// Generic rule search for NumberLogic. It never sees a family's parameters: it parses the
// displayed terms, tries a library of rule templates (fitting each template's parameters
// from the first terms by solving), and keeps a template only if it reproduces EVERY shown
// term with at least one term to spare as a check. verify() uses it to re-derive the answer
// independently, and generate() uses it to reject sequences with two valid continuations.
//
// Arithmetic is in doubles with a relative tolerance of 1e-9: shown values stay far below
// 2^53, so a false fit would need a coincidence at the ninth significant digit.

const EPS = 1e-9;
export const close = (a, b) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
const diffs = (x) => x.slice(1).map((v, i) => v - x[i]);
const last = (x) => x[x.length - 1];

// '−12', '3/4', '−2.25' -> number; fractions also return their parts.
export function parseTerm(s) {
  const t = String(s).trim().replace(/−/g, '-');
  let m;
  if ((m = t.match(/^(-?\d+)\/(\d+)$/))) return { v: +m[1] / +m[2], num: +m[1], den: +m[2] };
  if (/^-?\d+(\.\d+)?$/.test(t)) return { v: +t };
  throw new Error(`cannot parse term "${s}"`);
}

// ---- reference lists for "known sequence, scaled and shifted" ----
const PRIMES = (() => { const p = []; for (let n = 2; p.length < 40; n++) if (p.every((d) => n % d)) p.push(n); return p; })();
const FIB = (() => { const f = [1, 1]; while (f.length < 40) f.push(f[f.length - 1] + f[f.length - 2]); return f; })();
const KNOWN = [
  PRIMES,
  FIB,
  FIB.map((v) => v * v),
  FIB.slice(0, -1).map((v, i) => v * FIB[i + 1]),
  Array.from({ length: 16 }, (_, i) => { let f = 1; for (let k = 2; k <= i; k++) f *= k; return f; }),
  Array.from({ length: 40 }, (_, i) => 2 ** i),
  Array.from({ length: 30 }, (_, i) => 3 ** i),
  PRIMES.map((v) => v * v),
];

// ---- templates: each takes x (numbers) and returns the next term or null ----
function poly(x, deg) {
  if (x.length < deg + 2) return null;
  let t = x;
  const tails = [];
  for (let k = 0; k < deg; k++) { tails.push(last(t)); t = diffs(t); }
  if (!t.every((v) => close(v, t[0]))) return null;
  let nxt = t[0];
  for (let k = deg - 1; k >= 0; k--) nxt = tails[k] + nxt;
  return nxt;
}
function geo(x) {
  if (x.length < 3 || x[0] === 0) return null;
  const r = x[1] / x[0];
  for (let i = 1; i < x.length; i++) if (!close(x[i], x[i - 1] * r)) return null;
  return last(x) * r;
}
function affine(x) {
  if (x.length < 4 || close(x[1], x[0])) return null;
  const p = (x[2] - x[1]) / (x[1] - x[0]), c = x[1] - p * x[0];
  for (let i = 2; i < x.length; i++) if (!close(x[i], p * x[i - 1] + c)) return null;
  return p * last(x) + c;
}
function order2(x) {
  if (x.length < 5) return null;
  const det = x[1] * x[1] - x[0] * x[2];
  if (close(det, 0)) return null;
  const p = (x[2] * x[1] - x[0] * x[3]) / det, q = (x[1] * x[3] - x[2] * x[2]) / det;
  for (let i = 2; i < x.length; i++) if (!close(x[i], p * x[i - 1] + q * x[i - 2])) return null;
  return p * last(x) + q * x[x.length - 2];
}
function order2c(x) {
  if (x.length < 6) return null;
  // rows i = 2,3,4: x_i = p x_{i-1} + q x_{i-2} + c
  const A = [2, 3, 4].map((i) => [x[i - 1], x[i - 2], 1]), b = [x[2], x[3], x[4]];
  const s = solve3(A, b);
  if (!s) return null;
  const [p, q, c] = s;
  for (let i = 2; i < x.length; i++) if (!close(x[i], p * x[i - 1] + q * x[i - 2] + c)) return null;
  return p * last(x) + q * x[x.length - 2] + c;
}
function solve3(A, b) {
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(A);
  if (Math.abs(D) < 1e-9) return null;
  return [0, 1, 2].map((k) => det(A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)))) / D);
}
function period2(x) {
  if (x.length < 4) return null;
  for (let i = 2; i < x.length; i++) if (!close(x[i], x[i - 2])) return null;
  return x[x.length - 2];
}
function sumPrev(x, k) {
  if (x.length < k + 2) return null;
  const s = (i) => { let t = 0; for (let j = 1; j <= k; j++) t += x[i - j]; return t; };
  for (let i = k; i < x.length; i++) if (!close(x[i], s(i))) return null;
  return s(x.length);
}
// x_i = (sum of previous k) + r_i with r constant or arithmetic
function sumPrevPlus(x, k) {
  if (x.length < k + 3) return null;
  const r = [];
  for (let i = k; i < x.length; i++) { let t = 0; for (let j = 1; j <= k; j++) t += x[i - j]; r.push(x[i] - t); }
  const rn = poly(r, 0) ?? poly(r, 1);
  if (rn == null) return null;
  let t = 0; for (let j = 1; j <= k; j++) t += x[x.length - j];
  return t + rn;
}
function product(x) {
  if (x.length < 4) return null;
  const c = x[2] - x[1] * x[0];
  for (let i = 2; i < x.length; i++) if (!close(x[i], x[i - 1] * x[i - 2] + c)) return null;
  return last(x) * x[x.length - 2] + c;
}
function square(x) {
  if (x.length < 4) return null;
  const c = x[1] - x[0] * x[0];
  for (let i = 1; i < x.length; i++) if (!close(x[i], x[i - 1] * x[i - 1] + c)) return null;
  return last(x) ** 2 + c;
}
// Returns every fitting (list, offset, scale, shift): short runs can fit two ways by
// coincidence (5, 7, 11, 13, 17 + 6 is 11, 13, 17, 19, 23), and that is a real ambiguity.
function known(x) {
  if (x.length < 4) return [];
  const out = [];
  for (const K of KNOWN) {
    for (let s = 0; s + x.length < K.length && s < 14; s++) {
      let j = 1;
      while (j < x.length && K[s + j] === K[s]) j++;
      if (j >= x.length - 1) continue;
      const a = (x[j] - x[0]) / (K[s + j] - K[s]), b = x[0] - a * K[s];
      if (close(a, 0)) continue;
      let ok = true;
      for (let i = 1; i < x.length && ok; i++) ok = close(x[i], a * K[s + i] + b);
      if (ok) out.push(a * K[s + x.length] + b);
    }
  }
  return out;
}
const isNat = (v) => Number.isInteger(v) && v > 0;
const digitsOf = (v) => String(v).split('').map(Number);
const DIGIT_RULES = [
  (v) => v + digitsOf(v).reduce((a, b) => a + b, 0),
  (v) => v + digitsOf(v).reduce((a, b) => a * b, 1),
  (v) => v + Number(String(v).split('').reverse().join('')),
];
function digitRule(x, f) {
  if (x.length < 3 || !x.every(isNat)) return null;
  for (let i = 1; i < x.length; i++) if (x[i] !== f(x[i - 1])) return null;
  return f(last(x));
}
// x_i = m_i * x_{i-1} + r_i, where m is a constant or the index shifted, and r is simple
const MULTS = [
  ...[-3, -2, -1, 2, 3, 4, 5].map((p) => () => p),
  ...[-1, 0, 1, 2, 3].map((s) => (i) => i + s),
];
function residualMul(x) {
  if (x.length < 5) return [];
  const out = [];
  for (const m of MULTS) {
    const r = [];
    for (let i = 1; i < x.length; i++) r.push(x[i] - m(i) * x[i - 1]);
    const rn = [poly(r, 0), poly(r, 1), poly(r, 2), period2(r), geo(r)].find((v) => v != null);
    if (rn != null) out.push(m(x.length) * last(x) + rn);
  }
  return out;
}
function altSteps(x) {
  if (x.length < 6) return null;
  const nextStep = [];
  for (const c of [0, 1]) {
    const js = [];
    for (let j = c; j < x.length - 1; j += 2) js.push(j);
    const d = js.map((j) => x[j + 1] - x[j]);
    const r = js.every((j) => x[j] !== 0) ? js.map((j) => x[j + 1] / x[j]) : null;
    if (d.every((v) => close(v, d[0]))) nextStep[c] = (v) => v + d[0];
    else if (r && r.every((v) => close(v, r[0]))) nextStep[c] = (v) => v * r[0];
    else return null;
  }
  return nextStep[(x.length - 1) % 2](last(x));
}

// Templates allowed on derived sequences (differences, ratios, strands, parts).
function simple(x) {
  return [poly(x, 0), poly(x, 1), poly(x, 2), geo(x), affine(x), period2(x), sumPrev(x, 2), ...known(x)].filter((v) => v != null);
}
function interleave(x) {
  if (x.length < 6) return [];
  const strands = [x.filter((_, i) => i % 2 === 0), x.filter((_, i) => i % 2 === 1)];
  const preds = strands.map(simple);
  if (!preds[0].length || !preds[1].length) return [];
  return preds[x.length % 2];
}
function signAlt(x) {
  if (x.length < 4 || x.some((v) => v === 0)) return [];
  for (let i = 1; i < x.length; i++) if (Math.sign(x[i]) === Math.sign(x[i - 1])) return [];
  const s = -Math.sign(last(x));
  return simple(x.map(Math.abs)).map((v) => s * v);
}

// All rule fits: [{ rule, next }]. terms: labels (strings) or numbers.
export function predictAll(terms) {
  const parsed = terms.map((t) => (typeof t === 'number' ? { v: t } : parseTerm(t)));
  const x = parsed.map((p) => p.v);
  const out = [];
  const add = (rule, v) => { if (v != null && Number.isFinite(v)) out.push({ rule, next: v }); };
  const addAll = (rule, vs) => vs.forEach((v) => add(rule, v));
  for (let d = 0; d <= 3; d++) add(`polynomial degree ${d}`, poly(x, d));
  add('geometric', geo(x));
  add('affine recurrence', affine(x));
  add('two-term linear recurrence', order2(x));
  add('two-term linear recurrence with constant', order2c(x));
  add('period 2', period2(x));
  add('sum of previous two', sumPrev(x, 2));
  add('sum of previous three', sumPrev(x, 3));
  add('sum of previous two plus simple term', sumPrevPlus(x, 2));
  add('sum of previous three plus simple term', sumPrevPlus(x, 3));
  add('product of previous two plus constant', product(x));
  add('square of previous plus constant', square(x));
  addAll('known sequence scaled and shifted', known(x));
  DIGIT_RULES.forEach((f, i) => add(['add digit sum', 'add digit product', 'add reversal'][i], digitRule(x, f)));
  addAll('multiplier plus simple residual', residualMul(x));
  if (x.length >= 5) addAll('differences follow a rule', simple(diffs(x)).map((d) => last(x) + d));
  if (x.length >= 5 && x.every((v) => v !== 0)) addAll('ratios follow a rule', simple(x.slice(1).map((v, i) => v / x[i])).map((r) => last(x) * r));
  addAll('two interleaved sequences', interleave(x));
  add('alternating operations', altSteps(x));
  addAll('alternating sign', signAlt(x));
  if (parsed.every((p) => p.den)) {
    const ns = simple(parsed.map((p) => p.num)), ds = simple(parsed.map((p) => p.den));
    for (const n of ns) for (const d of ds) if (d !== 0) add('numerator and denominator rules', n / d);
  }
  return out;
}

export function distinctNext(terms) {
  const vals = [];
  for (const { next } of predictAll(terms)) if (!vals.some((v) => close(v, next))) vals.push(next);
  return vals;
}
