// Shared plumbing for Beat the Odds families. mcqItem emits exactly the item shape of
// the reference family (two-dice-sum.js), so every family differs only in its maths.
import { buildMcq } from '../../core/options.js';
import { fmtP, fmtNum } from '../../core/format.js';
import { Q } from '../../core/rational.js';

export const q = (n, d = 1) => Q.of(n, d);
export const qpow = (x, k) => new Q(x.n ** BigInt(k), x.d ** BigInt(k));
export const num = (x) => (x instanceof Q ? x.toNumber() : typeof x === 'bigint' ? Number(x) : x);
export const range = (a, b) => { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; };
export const harmonic = (n) => { let s = q(0); for (let i = 1; i <= n; i++) s = s.add(q(1, i)); return s; };

// Probabilities below 0.01 keep two significant digits so 0.002 and 0.0005 stay distinct.
export function fmtAuto(v) {
  if (v !== 0 && Math.abs(v) < 0.01) return String(Number(v.toPrecision(2)));
  return v >= 0 && v <= 1 ? fmtP(v) : fmtNum(v);
}

// Closest-value spacing: relative for tiny answers, otherwise the core default.
const gap = (c) => { const a = Math.abs(c); return a > 0 && a < 0.04 ? Math.max(a * 0.3, 1e-6) : Math.max(0.012, a * 0.07); };

// o: { text, value (Q | number), distractors: [{value, misconception}], steps, rule, anchor,
//      hints, data, ev?: true for expectations (no [0,1] filter), exact?, format?, visual? }
export function mcqItem(family, rng, difficulty, o) {
  const correct = num(o.value);
  const prob = !o.ev;
  const distractors = o.distractors
    .map((d) => ({ value: num(d.value), misconception: d.misconception }))
    .filter((d) => Number.isFinite(d.value) && (!prob || (d.value >= 0 && d.value <= 1)));
  const format = o.format || fmtAuto;
  const mcq = buildMcq(rng, { correct, distractors, format, minGap: o.minGap || gap, fillers: o.fillers });
  return {
    id: `bto:${family}:${rng.seed}`,
    section: 'bto',
    family,
    difficulty,
    kind: 'mcq',
    prompt: o.visual ? { text: o.text, visual: o.visual } : { text: o.text },
    ...mcq,
    answer: { value: correct, exact: o.exact ?? exactText(o.value, format) },
    solution: { steps: o.steps, rule: o.rule, anchor: o.anchor },
    hints: o.hints,
    // Structured inputs, sufficient to recompute the answer without reading the prompt text.
    params: plain({ family, ...(o.params ?? o.data) }),
  };
}

// Plain-JSON copy (no Q objects, functions or undefined); throws on non-finite numbers.
export function plain(x) {
  return JSON.parse(JSON.stringify(x, (k, v) => {
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`params.${k} is not finite`);
    if (v instanceof Q) return v.toNumber();
    return v;
  }));
}

// Exact fraction when it is readable, otherwise a 6-significant-digit decimal.
export function exactText(x, format = fmtAuto) {
  if (!(x instanceof Q)) return format(num(x));
  return x.d < 1000000n ? x.toString() : `≈ ${Number(x.toNumber().toPrecision(6))}`;
}
export const qs = (x) => exactText(x); // short form for solution text

// Verifier verdict: the independent value matches the item's answer and the keyed option.
export function agree(item, expected, tol = 1e-9) {
  const v = item.answer.value;
  const e = num(expected);
  const ok = Math.abs(e - v) <= tol * Math.max(1, Math.abs(v)) && item.options[item.answerIndex].value === v;
  return { ok, detail: `independent ${e}, item says ${v}` };
}

// Monte Carlo agreement for continuous families: |estimate - p| within 4 standard errors.
// 4 rather than 3 sigma: 40 seeds at 3 sigma would fail by chance about 10% of the time.
export function agreeMc(item, hits, trials) {
  const v = item.answer.value;
  const est = hits / trials;
  const se = Math.sqrt(Math.max(v * (1 - v), 1e-4) / trials);
  const ok = Math.abs(est - v) <= 4 * se && item.options[item.answerIndex].value === v;
  return { ok, detail: `simulated ${est} over ${trials}, item says ${v}` };
}

// Standard normal CDF (Abramowitz-Stegun 26.2.17, error < 7.5e-8). Used for CLT distractors.
export function Phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

// Enumerate all sequences of length n over values 1..k.
export function* sequences(k, n) {
  const a = Array(n).fill(1);
  if (n === 0) { yield []; return; }
  while (true) {
    yield a;
    let i = n - 1;
    while (i >= 0 && a[i] === k) { a[i] = 1; i--; }
    if (i < 0) return;
    a[i]++;
  }
}

// Enumerate permutations of 0..n-1 (Heap's algorithm).
export function* permutations(n) {
  const a = [...Array(n).keys()], c = Array(n).fill(0);
  yield a;
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      if (i % 2 === 0) [a[0], a[i]] = [a[i], a[0]]; else [a[c[i]], a[i]] = [a[i], a[c[i]]];
      yield a;
      c[i]++;
      i = 0;
    } else { c[i] = 0; i++; }
  }
}
