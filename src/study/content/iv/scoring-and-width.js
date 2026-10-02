// Intervals 1: the scoring rule and how wide to go. This file also exports the helpers every
// Intervals lesson shares (section headers, rounding, a choice-question builder, the normal CDF,
// the interval score and the expected-score optimum), so each number in the book is computed.
import { SECTION_TITLES } from '../../schema.js';
import { SECTIONS } from '../../../../config/sections.js';

export const sec = (key, title) => ({ type: 'section', key, title: title ?? SECTION_TITLES[key] });
export const round = (x, dp = 3) => Math.round(x * 10 ** dp) / 10 ** dp;
export const dec = (x, dp = 3) => String(round(x, dp));
export const sig = (x, n = 3) => String(Number(Number(x).toPrecision(n)));
export const pct = (x, dp = 1) => `${round(x * 100, dp)}%`;
export const num = (x) => Number(x).toLocaleString('en-US', { maximumFractionDigits: 6 });
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
export const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
export const IV = SECTIONS.iv;

// Choice question: the right option plus wrong options [value, false belief]. Duplicates are
// dropped; with an rng the right answer lands in a random slot, otherwise at `at`.
export function mc({ q, right, wrong = [], explain, hints, at = 0 }, rng) {
  const seen = new Set([String(right)]);
  const opts = [];
  for (const w of wrong) {
    const [v, trap] = Array.isArray(w) ? w : [w];
    if (seen.has(String(v)) || opts.length >= 5) continue;
    seen.add(String(v)); opts.push({ v: String(v), trap });
  }
  const pos = rng ? rng.int(0, opts.length) : Math.min(at, opts.length);
  opts.splice(pos, 0, { v: String(right) });
  const out = { type: 'choice', q, options: opts.map((o) => o.v), answer: pos, explain };
  const traps = {};
  opts.forEach((o, i) => { if (o.trap) traps[i] = o.trap; });
  if (Object.keys(traps).length) out.traps = traps;
  if (hints) out.hints = hints;
  return out;
}
// Interval micro-check: graded by the real Intervals rule (lower ÷ upper if the truth is inside).
export const ivq = (q, truth, explain, hints) => ({ type: 'interval', q, answer: truth, explain, ...(hints ? { hints } : {}) });

// Standard normal CDF (Abramowitz and Stegun 7.1.26, error below 1.5e-7).
export function Phi(z) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
// The Intervals score (same rule as src/core/check.js intervalScore).
export const score = (L, U, T) => (L > 0 && L <= U && T >= L && T <= U ? L / U : 0);
// Two-decimal bracket around a value that does not terminate: 41.666… -> [41.66, 41.67].
export const bracket = (x) => [Math.floor(x * 100 + 1e-9) / 100, Math.ceil(x * 100 - 1e-9) / 100];
export const terminates2 = (x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;
// What to type for an exact value x > 0: the point itself if it terminates within 6 decimals,
// otherwise the bracket that keeps 4 significant figures (2 decimals above 10, 3 from 1 to 10, ...).
export function exactEntry(x) {
  for (let dp = 0; dp <= 6; dp++) { const v = x * 10 ** dp; if (Math.abs(v - Math.round(v)) < 1e-7) { const p = round(x, dp); return { lo: p, hi: p, point: true, score: 1, text: `[${p}, ${p}]` }; } }
  const dp = Math.max(2, 3 - Math.floor(Math.log10(x)));
  const lo = round(Math.floor(x * 10 ** dp) / 10 ** dp, dp), hi = round(Math.ceil(x * 10 ** dp) / 10 ** dp, dp);
  return { lo, hi, point: false, score: lo / hi, dp, text: `[${lo}, ${hi}]` };
}
// Percent errors: ln(truth) ~ Normal(ln m, s). The band [m·e^(a·s), m·e^(b·s)] scores (Φ(b) − Φ(a))·e^(−(b − a)s) on average.
export const eLog = (s, a, b) => (Phi(b) - Phi(a)) * Math.exp(-(b - a) * s);
// Best symmetric band on the log scale (symmetric is optimal for percent errors).
export function bestLog(s) {
  let best = { z: 0, e: 0 };
  for (let k = 0; k <= 5000; k++) { const z = k / 1000, e = eLog(s, -z, z); if (e > best.e) best = { z, e }; }
  return { z: best.z, f: Math.exp(best.z * s), e: best.e, hit: 2 * Phi(best.z) - 1 };
}
export const bandFor = (m, s) => { const b = bestLog(s); return { ...b, lo: m / b.f, hi: m * b.f }; };
// Absolute errors: truth ~ Normal(m, sd). Search both ends (in sd units) for the best expected score.
export const eNorm = (m, sd, L, U) => (L > 0 && U >= L ? (Phi((U - m) / sd) - Phi((L - m) / sd)) * (L / U) : 0);
export function bestNorm(m, sd) {
  let best = { a: 0, b: 0, e: -1 };
  const scan = (a0, a1, b0, b1, st) => {
    for (let a = a0; a <= a1 + 1e-12; a += st) for (let b = Math.max(0, b0); b <= b1 + 1e-12; b += st) {
      const e = eNorm(m, sd, m - a * sd, m + b * sd);
      if (e > best.e) best = { a, b, e };
    }
  };
  scan(0, 4, 0, 4, 0.05);
  scan(best.a - 0.05, best.a + 0.05, best.b - 0.05, best.b + 0.05, 0.005);
  return { below: best.a, above: best.b, lo: m - best.a * sd, hi: m + best.b * sd, e: best.e };
}

// ---- numbers used in this lesson ----
const EX = { L: 40, U: 50, inT: 45, outT: 55 };
const FS = [1.1, 1.25, 1.5, 2];
const CH = { m: 200, s: 0.1 }; Object.assign(CH, bandFor(CH.m, CH.s));
const S_LIST = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3];
const BEST = Object.fromEntries(S_LIST.map((s) => [s, bestLog(s)]));
const PLOT_S = [0.05, 0.1, 0.2];
const zs = Array.from({ length: 81 }, (_, i) => i / 20);
const b10 = BEST[0.1];
const lossNarrow = b10.e - eLog(0.1, -(b10.z - 0.75), b10.z - 0.75);
const lossWide = b10.e - eLog(0.1, -(b10.z + 0.75), b10.z + 0.75);
const CNT = { m: 47, sd: 2 }; Object.assign(CNT, bestNorm(CNT.m, CNT.sd));
const WIDE = { s: 0.5 }; Object.assign(WIDE, bestLog(WIDE.s));
const P512 = (5 / 12) * 100; const [lo512, hi512] = bracket(P512);

const scoreQ = (rng) => {
  const L = rng.int(20, 90), U = L + rng.int(2, 30);
  const inside = rng.chance(0.7), T = inside ? rng.int(L, U) : rng.chance(0.5) ? U + rng.int(1, 9) : L - rng.int(1, Math.min(9, L - 1));
  const sc = score(L, U, T);
  return { type: 'number', q: `You type [${L}, ${U}] and the true value is ${T}. What do you score? (2 decimal places)`, answer: round(sc, 2), tolerance: 0.006,
    hints: ['Is the true value inside the interval, ends included?', inside ? 'Inside: the score is lower ÷ upper.' : 'Outside scores 0, whatever the width.'],
    explain: inside ? `${T} is inside, so the score is ${L}/${U} = ${dec(sc, 3)}.` : `${T} is outside [${L}, ${U}], so the score is 0.` };
};
const bandQ = (rng) => {
  const f = rng.pick([1.05, 1.1, 1.2, 1.25, 1.5]), m = rng.pick([8, 40, 250, 1200, 6000]);
  return { type: 'number', q: `You type [${m} ÷ ${f}, ${m} × ${f}] and the truth is inside. What do you score? (3 decimal places)`, answer: round(1 / (f * f), 3), tolerance: 0.0015,
    hints: ['The score is lower ÷ upper; write both ends with m in them.', `(m/${f}) ÷ (m × ${f}) = 1/${f}².`],
    explain: `(${m}/${f}) ÷ (${m} × ${f}) = 1/${f}² = ${dec(1 / (f * f), 3)}. The ${m} cancels: only the factor matters.` };
};
const chooseQ = (rng) => {
  const s = rng.pick([0.02, 0.05, 0.1]), m = rng.pick([60, 120, 480, 900, 2400]);
  const b = bestLog(s);
  const band = (z) => [sig(m * Math.exp(-z * s), 3), sig(m * Math.exp(z * s), 3)];
  const E = (z) => eLog(s, -z, z);
  const cands = [[b.z, null], [0.4, 'too narrow: the band misses so often that the high ratio is wasted'], [4.5, 'too wide: it almost never misses, but lower ÷ upper collapses'], [9, 'panic width: a guaranteed hit that scores little']];
  const right = band(b.z);
  const opts = cands.slice(1).map(([z, trap]) => [`[${band(z).join(', ')}]`, `${trap} (expected ${dec(E(z), 2)})`]);
  return { hinge: true, ...mc({ q: `Your estimate is ${m} and your estimates are typically off by ${Math.round(s * 100)}% (one SD, in percent). Which interval has the highest expected score?`, right: `[${right.join(', ')}]`, wrong: opts,
    hints: ['Expected score = P(hit) × lower ÷ upper.', `With a ${Math.round(s * 100)}% error the best band covers about ${dec(b.z, 1)} SDs each way.`],
    explain: `About ${dec(b.z, 1)} SDs each way: ${m} ×/÷ ${dec(b.f, 3)}, expected score ${dec(b.e, 2)}. Narrower misses too often; wider throws away ratio.` }, rng) };
};
const exactQ = (rng) => {
  const [n, d] = rng.pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 12], [5, 12], [7, 12], [1, 9], [4, 9], [5, 36], [7, 36], [11, 36], [13, 36]]);
  const T = (n / d) * 100, [lo, hi] = bracket(T);
  return ivq(`An exact answer is ${n}/${d}, and the question asks for it in percent. Type the interval that scores highest.`, T, `${n}/${d} = ${sig(T, 7)}…%, which does not terminate. The tightest safe interval is [${lo}, ${hi}], score ${dec(lo / hi, 4)}. A rounded point [${round(T, 2)}, ${round(T, 2)}] misses the truth and scores 0.`,
    ['Convert to percent: multiply by 100.', 'The digits go on for ever, so a single rounded number misses. Use the two-decimal values either side.']);
};

export default {
  id: 'iv/scoring-and-width',
  book: 'iv',
  kind: 'foundation',
  title: 'The scoring rule and how wide to go',
  summary: 'Score = lower ÷ upper if the truth is inside, else 0. Exact answers get zero width; estimates get a percent band sized to your error.',
  prerequisites: ['assessment/six-tasks', 'prob/poisson-normal'],
  objectives: [
    'Score any interval against a true value in under five seconds',
    'Explain why only the ratio lower ÷ upper matters, so width is measured in percent',
    'Give zero width (or a two-decimal bracket) whenever the answer is exact',
    'Turn an estimate and a typical percent error into the band with the highest expected score',
  ],
  blocks: [
    sec('score', 'The scoring rule'),
    { type: 'challenge', q: `Before any teaching: you estimate a quantity at ${CH.m}, and your estimates of this kind are typically off by about ${Math.round(CH.s * 100)}%. Which interval do you type, [${CH.m * 0.95}, ${CH.m * 1.05}], [${CH.m * 0.8}, ${CH.m * 1.2}] or [${CH.m / 2}, ${CH.m * 2}]? Find two different ways to decide.`, answer: `Close to [${sig(CH.lo, 3)}, ${sig(CH.hi, 3)}], expected score ${dec(CH.e, 2)}`,
      explain: `The narrow one hits only about ${pct(Phi(Math.log(1.05) / CH.s) - Phi(Math.log(0.95) / CH.s), 0)} of the time. The wide one always hits but scores ${dec(1 / 4, 2)}. The best trade-off is ${CH.m} ×/÷ ${dec(CH.f, 2)}, which hits ${pct(CH.hit, 0)} of the time and scores ${dec(1 / (CH.f * CH.f), 2)} when it does. This lesson derives that number.` },
    { type: 'text', text: `Every Intervals question asks for a positive quantity. You type a **lower** bound L and an **upper** bound U. If the true value T satisfies L ≤ T ≤ U (ends included), you score **L ÷ U**. If T is outside, you score **0**. The section has ${IV.exam.count} questions at ${IV.exam.perItemSeconds} seconds each, forward only.` },
    { type: 'diagram', diagram: 'numberline', spec: { min: 30, max: 60, step: 5, barriers: [EX.L, EX.U], marks: [{ x: EX.inT, label: `T = ${EX.inT}: ${dec(score(EX.L, EX.U, EX.inT), 2)}` }, { x: EX.outT, label: `T = ${EX.outT}: 0` }] }, caption: `The interval [${EX.L}, ${EX.U}]. A truth inside scores ${EX.L}/${EX.U} = ${dec(EX.L / EX.U, 2)}, wherever inside it lands. A truth outside scores 0, however close.` },
    { type: 'check', scope: 'the scoring rule', questions: [
      { make: scoreQ },
    ] },
    { type: 'text', text: 'Two edge rules: a lower bound of 0 or below always scores 0, and a lower bound above the upper bound scores 0. Both are easy to type by accident under time pressure.' },
    { type: 'check', scope: 'the two edge rules', questions: [
      mc({ q: 'You type [0, 500] to be safe, and the truth is 120. What do you score?', right: '0', wrong: [['1', 'thought a guaranteed hit guarantees points'], [dec(120 / 500, 2), 'divided the truth by the upper bound'], ['0.5', 'assumed a hit scores a fixed half point']], explain: 'A lower bound of 0 scores 0/500 = 0 even though 120 is inside. The lower bound must be above 0.' }),
    ] },

    sec('ratio', 'Only the ratio matters'),
    { type: 'text', text: `The score uses the ratio L ÷ U, never the gap U − L. [9, 11] and [900, 1100] both score 9/11 = ${dec(9 / 11, 3)}. So width is not measured in units; it is measured in **percent** of the answer. Write the interval as your estimate m divided and multiplied by one factor f.` },
    { type: 'formula', text: '[m ÷ f, m × f] scores (m/f) ÷ (m·f) = 1/f^{2}' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 2, label: 'factor f in [m ÷ f, m × f]' }, y: { min: 0, max: 1, label: 'score if the truth is inside' }, curves: [{ label: '1/f²', points: Array.from({ length: 51 }, (_, i) => { const f = 1 + i / 50; return [f, 1 / (f * f)]; }) }], markers: FS.map((f) => ({ x: f, y: 1 / (f * f), label: `×/÷ ${f}: ${dec(1 / (f * f), 2)}` })) }, caption: `The best you can score falls fast with the factor: ×/÷ ${FS[0]} keeps ${dec(1 / FS[0] ** 2, 2)}, ×/÷ ${FS[2]} keeps ${dec(1 / FS[2] ** 2, 2)}, ×/÷ ${FS[3]} keeps ${dec(1 / FS[3] ** 2, 2)}. The size of m never appears.` },
    { type: 'check', scope: 'score of a multiplicative band', questions: [
      { make: bandQ },
      mc({ q: 'Which interval scores more if the truth is inside: [95, 105] or [9.5, 10.5]?', right: 'Both the same', wrong: [['[95, 105] scores more', 'judged width by the gap: 10 looks small next to 95'], ['[9.5, 10.5] scores more', 'judged width by the gap: 1 looks tighter than 10']], explain: `95/105 = 9.5/10.5 = ${dec(95 / 105, 3)}. Same ratio, same score.` }),
    ] },
    { type: 'text', text: 'Because a ratio is a difference of logarithms, the score is e^{−(ln U − ln L)}: every interval of the same width **on a log scale** scores the same. That is why "10% each way" is the right language for width, and "± 5 units" is not.' },
    { type: 'check', scope: 'percent, not units', questions: [
      { make: (rng) => { const m = rng.pick([20, 80, 300, 2000]), d = rng.pick([2, 5, 10]); const L = m - d, U = m + d; return { type: 'number', q: `[${L}, ${U}] is "${m} ± ${d}". What does it score if the truth is inside? (3 decimal places)`, answer: round(L / U, 3), tolerance: 0.0015, explain: `${L}/${U} = ${dec(L / U, 3)}. The same ± ${d} around a number ten times bigger would score far more: units say nothing, the ratio says everything.` }; } },
    ] },

    sec('exact', 'Exact answers: zero width'),
    { type: 'text', text: 'If you can compute the answer exactly, type it as both bounds: [T, T] scores T ÷ T = 1, the maximum. Any width you add only lowers the score, because the truth was never in doubt.' },
    { type: 'check', scope: 'exact means zero width', questions: [
      { type: 'choice', q: 'You computed the answer exactly: 18. What do you type?', options: ['[18, 18]', '[17, 19]', '[17.9, 18.1]'], answer: 0, traps: { 1: 'width only lowers the score: 17/19 ≈ 0.89', 2: 'still below the 1 that [18, 18] scores' }, explain: '[T, T] scores T ÷ T = 1, the maximum.' },
    ] },
    { type: 'text', text: `If the exact value does not terminate (5/12 = ${sig(P512, 7)}…%), you cannot type it. A rounded point [${round(P512, 2)}, ${round(P512, 2)}] **misses** the truth by a fraction of a hundredth and scores 0. Bracket it instead with the two-decimal values either side: [${lo512}, ${hi512}], which scores ${dec(lo512 / hi512, 4)}.` },
    { type: 'check', scope: 'exact answers and brackets', questions: [
      mc({ q: `You have computed P = 5/12 exactly; the question asks in percent. What do you type?`, right: `[${lo512}, ${hi512}]`, at: 1, wrong: [[`[${round(P512, 2)}, ${round(P512, 2)}]`, `a rounded point: ${round(P512, 2)} is not ${sig(P512, 7)}…, so the truth is outside`], [`[41, 42]`, `a "safety" width on an exact answer: it scores ${dec(41 / 42, 3)} for no reason`], [`[0.41, 0.42]`, 'answered as a decimal, but the question asks in percent'], ['[40, 45]', `estimation habits on an exact question: ${dec(40 / 45, 3)}`]], explain: `5/12 = ${sig(P512, 7)}…%. The two-decimal bracket [${lo512}, ${hi512}] contains it and scores ${dec(lo512 / hi512, 4)}.` }),
      { make: exactQ },
    ] },

    sec('expected', 'Expected score: hit chance times ratio'),
    { type: 'text', text: 'Most questions cannot be computed exactly in a minute: you estimate. Then the truth is uncertain and the score is a gamble: **E[score] = P(L ≤ T ≤ U) × L ÷ U**. A wider band hits more often but pays less per hit. The best width balances the two, and it depends on how accurate you are.' },
    { type: 'steps', steps: [
      { say: `Describe your accuracy in percent: your estimate m is typically off by a fraction s of itself. Call s your one-SD error on the log scale: the truth lands in [m·e^{−s}, m·e^{s}] about ${pct(2 * Phi(1) - 1, 0)} of the time.`, why: 'Measurements, counts and products err in proportion to their size, and the score is a ratio, so percent is the natural unit.',
        checks: [{ make: (rng) => { const m = rng.pick([200, 400, 1000]), s = rng.pick([0.05, 0.1]); return { type: 'number', q: `Estimate ${m}, typical error ${Math.round(s * 100)}%. What is m·e^{s}, the top of the one-SD band? (nearest whole number)`, answer: Math.round(m * Math.exp(s)), tolerance: 1.01, hints: [`e^{${s}} ≈ 1 + ${s} for small s, a touch more.`], explain: `${m} × e^{${s}} = ${m} × ${dec(Math.exp(s), 4)} ≈ ${Math.round(m * Math.exp(s))}.` }; } }] },
      { say: 'Choose a band z SDs wide each way: [m·e^{−zs}, m·e^{zs}]. The truth lands inside with probability 2Φ(z) − 1.', why: 'On the log scale the truth is normal around ln m, so this is the familiar "within z SDs" probability.',
        checks: [mc({ q: 'How often does a band of 2 SDs each way contain the truth?', right: pct(2 * Phi(2) - 1, 1), at: 2, wrong: [[pct(2 * Phi(1) - 1, 1), 'that is 1 SD each way'], [pct(Phi(2), 1), 'counted only one side: Φ(2) includes the whole lower tail'], ['100%', 'a band never guarantees a hit unless it is infinite']], explain: `2Φ(2) − 1 = ${dec(2 * Phi(2) - 1, 4)}.` })] },
      { say: 'When it hits, the band scores L ÷ U = e^{−zs} ÷ e^{zs} = e^{−2zs}.', why: 'The m cancels, leaving only the width on the log scale.',
        checks: [{ make: (rng) => { const z = rng.pick([1, 1.5, 2]), s = rng.pick([0.05, 0.1, 0.2]); return { type: 'number', q: `z = ${z}, s = ${s}. What does the band score when it hits? (3 decimal places)`, answer: round(Math.exp(-2 * z * s), 3), tolerance: 0.0015, explain: `e^{−2 × ${z} × ${s}} = e^{−${round(2 * z * s, 3)}} = ${dec(Math.exp(-2 * z * s), 3)}.` }; } }] },
      { say: 'Multiply: E(z) = (2Φ(z) − 1) × e^{−2zs}. The first factor rises with z, the second falls. The best z is where the product peaks.', why: 'Expected score = chance of scoring × score when you do.',
        checks: [{ make: (rng) => { const z = rng.pick([1, 2]), s = rng.pick([0.05, 0.1]); const e = eLog(s, -z, z); return { type: 'number', q: `s = ${s}, z = ${z}. What is the expected score E(z)? (2 decimal places)`, answer: round(e, 2), tolerance: 0.011, hints: [`P(hit) = 2Φ(${z}) − 1 = ${dec(2 * Phi(z) - 1, 3)}.`, `Ratio = e^{−${round(2 * z * s, 2)}} = ${dec(Math.exp(-2 * z * s), 3)}.`], explain: `${dec(2 * Phi(z) - 1, 3)} × ${dec(Math.exp(-2 * z * s), 3)} = ${dec(e, 3)}.` }; } }] },
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 4, label: 'z: SDs covered each way' }, y: { min: 0, max: 1, label: 'expected score' }, curves: PLOT_S.map((s) => ({ label: `s = ${Math.round(s * 100)}%`, points: zs.map((z) => [z, eLog(s, -z, z)]) })), markers: PLOT_S.map((s) => ({ x: bestLog(s).z, y: bestLog(s).e, label: `best: ${dec(bestLog(s).e, 2)}` })) }, caption: `Expected score against width, for three accuracy levels. Each curve rises steeply (misses cost everything), peaks, then sinks slowly (width costs a little at a time). Sharper estimates (smaller s) peak higher and further right: ${PLOT_S.map((s) => `s = ${Math.round(s * 100)}% peaks at z ≈ ${dec(bestLog(s).z, 1)}`).join(', ')}.` },
    { type: 'check', scope: 'reading the expected-score curves', questions: [
      mc({ q: 'On the plot, what happens to the best achievable score as your typical error s shrinks?', right: 'It rises, and the best band covers more SDs', at: 0, wrong: [['It stays the same; only the width changes', 'forgot that a smaller s makes every band cheaper in ratio'], ['It rises, and the best band covers fewer SDs', 'with small s each SD is cheap, so you can afford more of them'], ['It falls, because narrow bands miss more', 'a narrower band in units is not narrower in SDs']], explain: `Smaller s: each SD costs less ratio, so you cover more SDs (${dec(BEST[0.05].z, 1)} at 5% against ${dec(BEST[0.2].z, 1)} at 20%) and still keep more score.` }),
    ] },

    sec('choose', 'Choosing the width'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['typical error s', 'best z (SDs each way)', 'factor f', 'band around 100', 'hit chance', 'expected score'], rows: S_LIST.map((s) => { const b = BEST[s]; return [`${Math.round(s * 100)}%`, dec(b.z, 2), dec(b.f, 3), `[${dec(100 / b.f, 1)}, ${dec(100 * b.f, 1)}]`, pct(b.hit, 0), dec(b.e, 3)]; }) }, caption: 'The optimum for each accuracy level, computed by maximising (2Φ(z) − 1)e^{−2zs}. Read across: your error decides the band, and the band decides nothing else.' },
    { type: 'text', text: `Rule of thumb from the table: with an error of a few percent, cover about ${dec(BEST[0.02].z, 1)} SDs each way; at ${Math.round(0.1 * 100)}%, about ${dec(BEST[0.1].z, 1)}; at ${Math.round(0.3 * 100)}%, about ${dec(BEST[0.3].z, 1)}. The expected score is set mostly by s itself: halving your error from 10% to 5% lifts the best score from ${dec(BEST[0.1].e, 2)} to ${dec(bestLog(0.05).e, 2)}. Accuracy earns points; width only avoids losing them.` },
    { type: 'check', scope: 'the optimal band', questions: [{ make: chooseQ }] },
    { type: 'text', text: `The curve is lopsided. At s = 10%, a band ${dec(0.75, 2)} SDs narrower than the best loses ${dec(lossNarrow, 3)} expected points; ${dec(0.75, 2)} SDs wider loses only ${dec(lossWide, 3)}. When you are unsure between two widths, take the wider.` },
    { type: 'check', scope: 'lopsided costs', questions: [
      mc({ q: 'You are torn between z = 1 and z = 2.5 for a 10% error. Which costs less expected score?', right: 'z = 2.5 (too wide)', wrong: [['z = 1 (too narrow)', 'assumed width and misses cost the same: misses cost everything at once'], ['They cost the same', 'the curve is not symmetric about its peak']], explain: `E(1) = ${dec(eLog(0.1, -1, 1), 3)}, E(2.5) = ${dec(eLog(0.1, -2.5, 2.5), 3)}, best ${dec(b10.e, 3)} at z = ${dec(b10.z, 2)}.` }),
    ] },
    { type: 'text', text: `Counts are different: an error of "± 2 dots" is the same size whether the count is high or low. So the truth is normal in units, not in percent. Then a higher interval has a better ratio for the same width, and the optimum **leans high**. For a count of ${CNT.m} ± ${CNT.sd}, the best interval is about [${dec(CNT.lo, 1)}, ${dec(CNT.hi, 1)}]: ${dec(CNT.below, 2)} SDs below, ${dec(CNT.above, 2)} above.` },
    { type: 'check', scope: 'counts lean high', questions: [
      mc({ q: `You counted ${CNT.m} items and trust the count to ± ${CNT.sd}. Where should the interval sit?`, right: 'A little more room above than below', wrong: [['Exactly symmetric around the count', 'symmetric is optimal on the log scale, not for a ± count'], ['More room below the count than above', 'a lower interval has a worse ratio for the same width'], ['Zero width, right at the count', 'the count is uncertain, so a point misses most of the time']], explain: `For the same width in units, a higher interval has a larger L ÷ U. Best: about [${dec(CNT.lo, 1)}, ${dec(CNT.hi, 1)}].` }),
    ] },

    sec('wide', 'When to go wide'),
    { type: 'text', text: `Go wide when the method itself could be off, not just the arithmetic: you are unsure which formula applies, or a factor of 10 could have slipped. With a ${Math.round(WIDE.s * 100)}% error the best band is m ×/÷ ${dec(WIDE.f, 2)}, which still earns ${dec(WIDE.e, 2)} on average. A narrow band built on a shaky method earns close to 0.` },
    { type: 'check', scope: 'when the method is shaky', questions: [
      mc({ q: 'Which situation calls for the widest band?', right: 'You are not sure whether the answer is n·p or n/p', wrong: [['You counted 40 coins twice and got 40 both times', 'a double-checked count is nearly exact'], ['You computed 5/12 exactly', 'exact: bracket it, no width'], ['You multiplied three rounded numbers with a 2% ledger', 'a known small error: a few percent each way']], explain: 'Model doubt (which formula?) can put you off by a large factor, so the band must be wide. Arithmetic doubt is small and known.' }),
    ] },
    { type: 'text', text: `Go slightly wide on exact answers that need many steps (a long inclusion-exclusion, a big multiplication): a 2 to 4% band costs ${pct(1 - 1 / 1.02 ** 2, 0)} to ${pct(1 - 1 / 1.04 ** 2, 0)} of the score, while one slipped digit inside a zero-width answer costs all of it.` },
    { type: 'check', scope: 'long exact computations', questions: [
      { make: (rng) => { const s = rng.pick([0.02, 0.04]); const b = bestLog(s); return { type: 'number', q: `A long exact computation where you allow a ${Math.round(s * 100)}% slip (one SD). What does the best band score when it hits? (2 decimal places)`, answer: round(1 / (b.f * b.f), 2), tolerance: 0.011, hints: ['Find the best z for this s (table above), then f = e^{zs}.', `z ≈ ${dec(b.z, 1)}, f ≈ ${dec(b.f, 3)}; the hit score is 1/f².`], explain: `Best z ≈ ${dec(b.z, 2)}, f = ${dec(b.f, 3)}, so 1/f² = ${dec(1 / (b.f * b.f), 3)}: a small, cheap insurance against a slip.` }; } },
    ] },

    sec('predict'),
    { type: 'predict', question: `Two candidates estimate the same quantities. A is typically off by 10% and uses the best band for 10%. B is off by 20% but types A's narrow band. Who scores more on average, and roughly what does each get?`, answer: `A: about ${dec(b10.e, 2)}. B: about ${dec(eLog(0.2, -b10.z * 0.5, b10.z * 0.5), 2)}, because A's band is only ${dec(b10.z / 2, 2)} of B's SDs each way.`, explain: `Copying someone else's width does not copy their accuracy. B's own best band would earn ${dec(BEST[0.2].e, 2)}.` },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `Score = L ÷ U, so think in percent. Exact → [T, T], or the two-decimal bracket if it repeats. Estimate with typical error s → [m ÷ f, m × f] with f = e^{zs}: z ≈ ${dec(BEST[0.05].z, 1)} to ${dec(BEST[0.02].z, 1)} for errors of a few percent, ${dec(BEST[0.1].z, 1)} at 10%, less beyond. Unsure of the width: go wider. Counts: lean high. Never type L ≤ 0.` },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: scoreQ }, { make: chooseQ }, { make: exactQ }] },
  ],
};
