// Shared machinery for the 80-in-8 families: exact arithmetic with Q, one label form per item
// (all integers, all decimals, all fractions or all percents), the 4-option item builder and
// the independent verifier, which re-reads the prompt and tests every option in it.
import { Q } from '../../core/rational.js';
import { buildMcq } from '../../core/options.js';
import { label, parseQ, MINUS } from '../nl/lib.js';

export { Q, MINUS };
export const q = (n, d = 1) => Q.of(n, d);
export const PLACE = ['units', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];

// ---------------------------------------------------------------- labels and forms
function decimals(x) { for (let k = 0; k <= 8; k++) if ((10n ** BigInt(k)) % x.d === 0n) return k; return null; }
// Any Q as text: integers, terminating decimals, otherwise n/d. Used in prompts and solutions.
export const L = (x) => label(x, 'dec');
export const neg = (n) => (n < 0 ? `${MINUS}${-n}` : String(n));

export function fmt(x, mode) {
  if (mode === 'frac') return label(x, 'frac');
  if (mode === 'pct') return `${label(x, 'dec')}%`;
  return label(x, mode === 'int' ? 'int' : 'dec');
}

// A wrong option must share the answer's form and rough size, so only the exact value decides.
// Size: within a factor of 12 either way (a place-value slip of ×10 or ÷10 is allowed).
export function fits(v, c, mode) {
  if (v.isZero()) return false;
  const dp = decimals(v);
  const form = mode === 'int' ? v.d === 1n
    : mode === 'dec' ? v.d !== 1n && dp !== null && dp <= 4
      : mode === 'frac' ? v.d !== 1n && v.d <= 400n
        : dp !== null && dp <= 2; // pct
  if (!form) return false;
  const a = Math.abs(v.toNumber()), b = Math.abs(c.toNumber());
  return a >= b / 12 && a <= b * 12;
}

export const modeOf = (x) => (x.d === 1n ? 'int' : decimals(x) !== null ? 'dec' : 'frac');
export const parseLabel = (s) => parseQ(String(s).replace(/%$/, ''));

// ---------------------------------------------------------------- digit helpers (integers)
export const digits = (n) => String(n).split('').reverse().map(Number); // units first
const fromDigits = (ds) => ds.reduce((s, d, k) => s + d * 10 ** k, 0);
// Places that receive a carry when a + b is done in columns (1 = tens, 2 = hundreds, ...).
export function carryPlaces(a, b) {
  const A = digits(a), B = digits(b), out = [];
  let c = 0;
  for (let k = 0; k < Math.max(A.length, B.length); k++) {
    c = (A[k] || 0) + (B[k] || 0) + c >= 10 ? 1 : 0;
    if (c) out.push(k + 1);
  }
  return out;
}
// Places that lend in a − b (a > b): place k lends to place k − 1.
export function borrowPlaces(a, b) {
  const A = digits(a), B = digits(b), out = [];
  let br = 0;
  for (let k = 0; k < A.length; k++) {
    br = (A[k] || 0) - (B[k] || 0) - br < 0 ? 1 : 0;
    if (br) out.push(k + 1);
  }
  return out;
}
// Each column written without carrying; the leftmost column writes its full sum.
export function noCarrySum(a, b) {
  const A = digits(a), B = digits(b), n = Math.max(A.length, B.length);
  return Array.from({ length: n }, (_, k) => { const s = (A[k] || 0) + (B[k] || 0); return (k === n - 1 ? s : s % 10) * 10 ** k; }).reduce((x, y) => x + y, 0);
}
// "Smaller digit from the larger" in every column: the classic no-borrow subtraction error.
export function smallFromLarge(a, b) {
  const A = digits(a), B = digits(b);
  return fromDigits(A.map((d, k) => Math.abs(d - (B[k] || 0))));
}
// n × one digit with every carry forgotten: each column keeps only its units digit, the leftmost writes all.
export function dropCarryMul(n, m) {
  const A = digits(n);
  return A.reduce((s, d, k) => s + (k === A.length - 1 ? d * m : (d * m) % 10) * 10 ** k, 0);
}
export const tens = (n) => Math.floor(n / 10) * 10;
export const units = (n) => n % 10;
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const round10 = (n) => Math.round(n / 10) * 10;
export const sig1 = (x) => { const p = 10 ** Math.floor(Math.log10(Math.abs(x))); return Math.round(x / p) * p; };
// Number of decimal places of a Q (null if it does not terminate).
export const dps = decimals;
export function intPick(rng, lo, hi, ok, tries = 200) {
  for (let i = 0; i < tries; i++) { const v = rng.int(lo, hi); if (ok(v)) return v; }
  return null;
}

// ---------------------------------------------------------------- item builder
// o: { text, value: Q, mode, wrong: [[Q, misconception]], ask, steps, fast, check, hints, params?, rule?, anchor?, mixedSigns? }
// Generic near misses on both sides of c, in order of how tempting they are. Used only to fill a
// side the family's own errors leave short, so the answer's position among the sorted options is
// uniform instead of always in the middle.
function nearMisses(c, mode) {
  const side = (k) => (k > 0 ? 'high' : 'low');
  if (mode === 'int') {
    return [1, -1, 10, -10, 100, -100, 2, -2].map((k) => [c.add(k), Math.abs(k) <= 2
      ? `Units slip: ${Math.abs(k)} too ${side(k)}. The size is right, so only a last-digit check catches it.`
      : Math.abs(k) === 10 ? `Tens slip: one carry or borrow too ${k > 0 ? 'many' : 'few'}. The last digit matches, so check the tens.`
        : `Hundreds slip: one carry or borrow too ${k > 0 ? 'many' : 'few'} in the hundreds.`]);
  }
  if (mode === 'dec' || mode === 'pct') {
    const u = mode === 'pct' ? q(1) : q(1, 10 ** decimals(c));
    const what = mode === 'pct' ? 'percentage point' : 'unit in the last decimal place';
    return [1, -1, 10, -10, 5, -5, 2, -2].map((k) => [c.add(u.mul(k)), `Slip of ${Math.abs(k)} ${what}${Math.abs(k) > 1 ? 's' : ''}, too ${side(k)}: right size, wrong ${Math.abs(k) >= 10 ? 'second-last' : 'last'} digit.`]);
  }
  const n = Number(c.n), d = Number(c.d); // frac
  return [[q(n + 1, d), 'Numerator slip: the top is one too big (a slip while adding or cancelling).'], [q(n - 1, d), 'Numerator slip: the top is one too small (a slip while adding or cancelling).'],
    [q(n, d - 1), 'Denominator slip: the bottom is one too small.'], [q(n, d + 1), 'Denominator slip: the bottom is one too big.'],
    [q(n + 2, d), 'Numerator slip: the top is two too big.'], [q(Math.max(1, n - 2), d), 'Numerator slip: the top is two too small.']];
}

function mcqItem(def, rng, difficulty, variant, o) {
  const correctLabel = fmt(o.value, o.mode);
  const seen = new Set([correctLabel]);
  const pool = (list) => {
    const out = [];
    for (const [v, m] of list) {
      if (!(v instanceof Q) || !m || !fits(v, o.value, o.mode)) continue;
      if (!o.mixedSigns && (v.n < 0n) !== (o.value.n < 0n)) continue; // a sign slip only where the variant asks for it
      const l = fmt(v, o.mode);
      if (seen.has(l)) continue;
      seen.add(l);
      out.push({ v, l, m });
    }
    return out;
  };
  const fam = pool(o.wrong);
  if (fam.length < 2) return null;
  const extra = pool(nearMisses(o.value, o.mode));
  const below = (xs) => xs.filter((x) => x.v.cmp(o.value) < 0), above = (xs) => xs.filter((x) => x.v.cmp(o.value) > 0);
  const fb = rng.shuffle(below(fam)), fa = rng.shuffle(above(fam)), eb = below(extra), ea = above(extra);
  // Fill r options below the answer and 3 − r above, family errors first. Two wrong options
  // symmetric about the answer would mark it as their midpoint, so that pair is never chosen.
  const twice = o.value.mul(2);
  const choose = (r) => {
    const pick = [];
    const fill = (list, need) => { let got = 0; for (const x of list) { if (got === need) break; if (pick.some((p) => p.v.add(x.v).eq(twice))) continue; pick.push(x); got++; } return got === need; };
    return fill([...fb, ...eb], r) && fill([...fa, ...ea], 3 - r) ? pick : null;
  };
  let cands = null;
  for (const r of rng.shuffle([0, 1, 2, 3])) if ((cands = choose(r))) break;
  if (!cands) return null;
  const byValue = new Map([[o.value.toNumber(), correctLabel], ...cands.map((c) => [c.v.toNumber(), c.l])]);
  if (byValue.size !== cands.length + 1) return null;
  const mcq = buildMcq(rng, {
    correct: o.value.toNumber(),
    distractors: cands.map((c) => ({ value: c.v.toNumber(), misconception: c.m })),
    format: (v) => byValue.get(v), count: 4, minGap: () => 0, fillers: [],
  });
  return {
    id: `mm:${def.id}:${rng.seed}`,
    section: 'mm',
    family: def.id,
    difficulty,
    kind: 'mcq',
    optionCount: 4,
    prompt: { text: o.text },
    ...mcq,
    answer: { value: o.value.toNumber(), label: correctLabel, exact: o.value.toString() },
    solution: { ask: o.ask, steps: o.steps, fast: o.fast, check: o.check, rule: o.rule || def.rule, anchor: o.anchor || def.anchor },
    hints: o.hints,
    params: { family: def.id, variant, ...(o.params || {}) },
  };
}

// Family factory. def: { id, title, skill, levels, rule, anchor, variants: { name: { levels, build(rng, d) -> o | null } }, verify?, lesson }
// generate(rng, { difficulty, variant }) draws a variant valid at that difficulty, or the named one
// (a "twin" of an earlier item: same variant, new numbers).
export function family(def) {
  const names = Object.keys(def.variants);
  return {
    id: def.id,
    section: 'mm',
    title: def.title,
    skill: def.skill,
    levels: def.levels,
    variants: names,
    generate(rng, { difficulty = def.levels[0], variant } = {}) {
      const pool = variant ? [variant] : names.filter((k) => def.variants[k].levels.includes(difficulty));
      if (!pool.length || !def.variants[pool[0]]) throw new Error(`${def.id}: no variant ${variant || `at difficulty ${difficulty}`}`);
      for (let attempt = 0; attempt < 120; attempt++) {
        const name = rng.pick(pool);
        const v = def.variants[name];
        const d = v.levels.includes(difficulty) ? difficulty : v.levels[0];
        const o = v.build(rng, d);
        if (!o) continue;
        const item = mcqItem(def, rng, d, name, o);
        if (item) return item;
      }
      throw new Error(`${def.id}: no valid item after 120 attempts (difficulty ${difficulty}, variant ${variant || 'any'})`);
    },
    verify: def.verify || verifyExpr,
    lesson: def.lesson,
  };
}

// ---------------------------------------------------------------- independent verifier
// A small exact parser for the prompt: numbers (12, 2.75, 3/4 as one fraction token), ?, + − × ÷ :,
// brackets, postfix % (÷ 100) and "of" (×). It never sees the generator's numbers, only the text.
const TOKEN = /(\d+(?:\.\d+)?\/\d+|\d+(?:\.\d+)?|\?|of|[-+−×÷:()%])/y;
export function tokens(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    if (/\s/.test(src[i])) { i++; continue; }
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(src);
    if (!m) throw new Error(`cannot read "${src.slice(i)}"`);
    out.push(m[1]);
    i += m[1].length;
  }
  return out;
}

export function evaluate(src, x) {
  const t = tokens(src);
  let p = 0;
  const peek = () => t[p];
  const take = () => t[p++];
  const expr = () => {
    let v = term();
    while (['+', '-', '−'].includes(peek())) { const op = take(); const r = term(); v = op === '+' ? v.add(r) : v.sub(r); }
    return v;
  };
  const term = () => {
    let v = factor();
    while (['×', '÷', ':', 'of'].includes(peek())) { const op = take(); const r = factor(); v = op === '×' || op === 'of' ? v.mul(r) : v.div(r); }
    return v;
  };
  const factor = () => {
    if (peek() === '-' || peek() === '−') { take(); return factor().neg(); }
    let v = primary();
    while (peek() === '%') { take(); v = v.div(100); }
    return v;
  };
  const primary = () => {
    const s = take();
    if (s === '(') { const v = expr(); if (take() !== ')') throw new Error('missing )'); return v; }
    if (s === '?') { if (!(x instanceof Q)) throw new Error('? without a value'); return x; }
    if (s != null && /^\d/.test(s)) return parseQ(s);
    throw new Error(`unexpected ${s}`);
  };
  const v = expr();
  if (p !== t.length) throw new Error(`unexpected ${t[p]}`);
  return v;
}

// Verdict: exactly one option satisfies the prompt, it is the keyed one, and the answer record matches it.
export function judge(item, holds) {
  const vals = item.options.map((o) => parseLabel(o.label));
  const sat = vals.map((v) => { try { return holds(v); } catch { return false; } });
  const k = item.answerIndex;
  const ok = sat[k] && sat.filter(Boolean).length === 1 && item.options[k].label === item.answer.label &&
    vals[k].toNumber() === item.answer.value && item.options[k].value === item.answer.value;
  return { ok, detail: `options satisfying the prompt: ${item.options.filter((_, i) => sat[i]).map((o) => o.label).join(', ') || 'none'}; keyed ${item.options[k].label}` };
}

export function verifyExpr(item) {
  const parts = item.prompt.text.split('=');
  if (parts.length !== 2) return { ok: false, detail: `not one equation: ${item.prompt.text}` };
  return judge(item, (v) => evaluate(parts[0], v).eq(evaluate(parts[1], v)));
}
