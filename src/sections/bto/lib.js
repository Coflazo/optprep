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

// ---------------------------------------------------------------- worked-solution helpers
// The question sentence restated as what we want: "What is the probability that X?" -> "We want P(X)."
export function askFrom(text) {
  const sentences = String(text).split(/(?<=[.?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
  let i = sentences.map((s) => s.endsWith('?')).lastIndexOf(true);
  if (i < 0) i = sentences.length - 1;
  const q = sentences[i].replace(/[.?]$/, '');
  const low = (s) => s[0].toLowerCase() + s.slice(1);
  let m, ask;
  if ((m = q.match(/^Given that (.+?), what is the probability that (.+)$/i))) ask = `P(${m[2]} | ${m[1]})`;
  else if ((m = q.match(/^What is the probability that (.+)$/i))) ask = `P(${m[1]})`;
  else if ((m = q.match(/^What is the probability (of .+)$/i))) ask = `the probability ${m[1]}`;
  else if ((m = q.match(/^Estimate the probability (?:that )?(.+)$/i))) ask = `an estimate of P(${m[1]})`;
  else if ((m = q.match(/^What is the expected (.+)$/i))) ask = `E[${m[1]}]`;
  else return `We want to know: ${low(q)}.`;
  // A short ask leans on the sentence before it ("What is the expected number of flips?").
  const prev = i > 0 ? sentences[i - 1].replace(/\.$/, '') : '';
  return ask.split(/\s+/).length <= 4 && prev ? `We want ${ask}: ${low(prev)}.` : `We want ${ask}.`;
}

// A step whose words carry its arithmetic: the last "x = y" clause moves into `math`, the rest
// stays as the words. A step that is only an equation keeps its words and gains no math.
const CLAUSE = /(?<!\s):\s+|;\s+|,\s*so\s+|\.\s+(?=[A-Z])/;
export function splitMath(st) {
  if (st.math || !/=/.test(st.say)) return st;
  const t = st.say.replace(/\.$/, '');
  const parts = t.split(CLAUSE);
  const j = parts.map((s) => s.includes('=')).lastIndexOf(true);
  const lead = parts.slice(0, j).join(': ').trim();
  // Words-then-equation splits cleanly; a step that is an equation already, or chains several,
  // is turned into a short instruction plus its equation.
  if (j > 0 && lead.split(/\s+/).length >= 3 && !lead.includes('=')) return { ...st, say: `${lead}.`, math: parts.slice(j).join('; ').trim() };
  const lhs = t.split('=')[0].trim();
  const rhs = t.split('=').pop().trim();
  if (j === 0 && parts.length === 1 && lhs.split(/\s+/).length <= 4 && rhs.split(/\s+/).length <= 6) {
    let m;
    const say = /^[PE]$/.test(lhs) ? 'Put it together.' : /^[PE]\s*[([_]/.test(lhs) ? `Compute ${lhs}.` : (m = lhs.match(/^Let (.+)$/)) ? `Define ${m[1]}.` : /^Total/.test(lhs) ? 'Add it up.' : 'Work it out.';
    return { ...st, say, math: t };
  }
  return st;
}

// Picture builders. Every number comes from the caller's own parameters.
export const pic = (diagram, spec, caption) => ({ diagram, spec, caption });
// Two fair dice as the 36 ordered pairs, rows = first die.
export function diceGrid(hit, caption, extra = {}) {
  const highlight = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (hit(a, b)) highlight.push([a - 1, b - 1]);
  return pic('grid', { rows: 6, cols: 6, highlight, count: highlight.length, rowTitle: 'first die', colTitle: 'second die', ...extra }, typeof caption === 'function' ? caption(highlight.length) : caption);
}
// Repeated trials until the first success: success leaves stop, a miss carries on; n levels.
export function firstSuccessTree(n, p, miss, hitLabel, missLabel, markAll = true) {
  let node = { p: miss, label: `${missLabel} ×${n}` };
  for (let i = n; i >= 2; i--) node = { p: miss, label: missLabel, children: [{ p, label: hitLabel, mark: markAll || i === n }, node] };
  return { label: '', children: [{ p, label: hitLabel, mark: markAll || n === 1 }, node] };
}
export const table = (columns, rows, caption) => pic('table', { columns, rows: rows.map((r) => r.map(String)) }, caption);

// Steps with their arithmetic split out; at least one step always carries math.
export function withMath(steps) {
  const out = steps.map(splitMath);
  if (!out.some((st) => st.math)) {
    const j = out.map((st) => /=/.test(st.say)).lastIndexOf(true);
    if (j >= 0) out[j] = { ...out[j], math: out[j].say.replace(/\.$/, '').split(CLAUSE).filter((s) => s.includes('=')).pop().trim() };
  }
  return out;
}

// o: { text, value (Q | number), distractors: [{value, misconception, step?}], steps, rule, anchor,
//      hints, data, ev?: true for expectations (no [0,1] filter), exact?, format?, visual?,
//      ask?, fast, check, picture (null only on the no-picture list) }
export function mcqItem(family, rng, difficulty, o) {
  const correct = num(o.value);
  const prob = !o.ev;
  const distractors = o.distractors
    .map((d) => ({ value: num(d.value), misconception: d.misconception }))
    .filter((d) => Number.isFinite(d.value) && (!prob || (d.value >= 0 && d.value <= 1)));
  const format = o.format || fmtAuto;
  const mcq = buildMcq(rng, { correct, distractors, format, minGap: o.minGap || gap, fillers: o.fillers });
  // Which solution step a false belief breaks (counted from 1), where the family names it.
  for (const opt of mcq.options) {
    const d = o.distractors.find((x) => x.step && x.misconception === opt.misconception);
    if (d) opt.step = d.step;
  }
  return {
    id: `bto:${family}:${rng.seed}`,
    section: 'bto',
    family,
    difficulty,
    kind: 'mcq',
    prompt: o.visual ? { text: o.text, visual: o.visual } : { text: o.text },
    ...mcq,
    answer: { value: correct, exact: o.exact ?? exactText(o.value, format) },
    solution: { ask: o.ask || askFrom(o.text), steps: withMath(o.steps), fast: o.fast, check: o.check, picture: o.picture ? JSON.parse(JSON.stringify(o.picture)) : null, rule: o.rule, anchor: o.anchor },
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
