// Normal approximation to sums: build the mean and sd of a sum from one trial, standardise with a
// continuity correction, read the tail from landmarks. Every number shown is computed here.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

// Standard normal CDF (Abramowitz-Stegun 26.2.17, error below 1e-7).
function Phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}
const up = (z) => 1 - Phi(z); // one upper tail
const nCr = (n, r) => { let x = 1n; for (let i = 0; i < r; i++) x = (x * BigInt(n - i)) / BigInt(i + 1); return x; };
const coinAtLeast = (n, t) => { let s = 0n; for (let k = t; k <= n; k++) s += nCr(n, k); return Number(s) / 2 ** n; };
const coinBand = (n, lo, hi) => { let s = 0n; for (let k = lo; k <= hi; k++) s += nCr(n, k); return Number(s) / 2 ** n; };
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const f3 = (x) => x.toFixed(3);
const f4 = (x) => x.toFixed(4);
const DIE_VAR = Q.of(35, 12);
const DIE_SD = Math.sqrt(35 / 12);
const H16 = Array.from({ length: 17 }, (_, k) => ({ from: k - 0.5, to: k + 0.5, count: Number(nCr(16, k)) }));
const ZS = Array.from({ length: 81 }, (_, i) => -4 + i / 10);
const CH = { n: 144, t: 84 };
const chMu = CH.n / 2, chSd = Math.sqrt(CH.n) / 2;
// Think-aloud: 48 dice, total at least 190.
const TK = { n: 48, t: 190 };
TK.sd = Math.sqrt((TK.n * 35) / 12);
TK.z = (TK.t - 0.5 - 3.5 * TK.n) / TK.sd;

export default {
  id: 'bto/clt-estimates',
  book: 'bto',
  kind: 'family',
  family: 'clt-estimates',
  title: 'Normal approximation (CLT)',
  summary: 'A sum of n trials has mean nμ and sd σ√n (coin σ = 1/2, die σ ≈ 1.71). z = (threshold ± 0.5 − mean)/sd; tails beyond 1, 2, 3 sd: 16%, 2.3%, 0.13%.',
  prerequisites: ['prob/estimation-clt', 'prob/poisson-normal', 'bto/random-walk-line'],
  objectives: [
    'Build the mean and standard deviation of a sum from one trial: nμ and σ√n',
    'Standardise with a continuity correction and read the tail from the 1, 2 and 3 sd landmarks',
    'Handle two-sided bands ("between 45 and 55") as well as one-sided tails',
    'Name the traps: dividing by the variance, sd √n for a coin, and both tails for a one-sided question',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: you flip a fair coin ${CH.n} times. Estimate the probability of at least ${CH.t} heads. Try two approaches.`, answer: `About ${pct(coinAtLeast(CH.n, CH.t))} (exact).`, explain: `Mean ${chMu}, sd √${CH.n}/2 = ${chSd}: ${CH.t} is ${(CH.t - chMu) / chSd} sd above the mean, so about ${pct(up(2))} before the continuity correction and ${pct(up((CH.t - 0.5 - chMu) / chSd))} with it. If you used sd = √${CH.n} = ${Math.sqrt(CH.n)} you got about ${pct(up((CH.t - chMu) / Math.sqrt(CH.n)))}, a trap option.`, attempts: [
      { id: 'sqrt-n', label: `sd = √${CH.n} = ${Math.sqrt(CH.n)}`, approach: `Took the sd of the head count as √${CH.n} = ${Math.sqrt(CH.n)}: about ${pct(up((CH.t - chMu) / Math.sqrt(CH.n)))}.`, breaksAt: 'One flip counted as 0 or 1 has sd 1/2, not 1. Start from one trial before building the sum.' },
      { id: 'variance', label: 'Divided by the variance', approach: `Used variance ${CH.n} × 1/4 = ${CH.n / 4} as the spread: z = ${CH.t - chMu}/${CH.n / 4}.`, breaksAt: `${CH.n / 4} is the variance of the sum. z divides by the standard deviation, its square root ${chSd}.` },
      { id: 'no-cc', label: 'z from 84 itself', approach: `Standardised ${CH.t} directly: z = ${(CH.t - chMu) / chSd}, about ${pct(up((CH.t - chMu) / chSd))}.`, breaksAt: `The count ${CH.t} is a bar from ${CH.t - 0.5} to ${CH.t + 0.5}. "At least ${CH.t}" must include the whole bar, so the area starts at ${CH.t - 0.5}.` },
      { id: 'exact', label: 'Add the binomial terms', approach: `Started adding C(${CH.n}, k)/2^${CH.n} for k = ${CH.t} to ${CH.n}.`, breaksAt: `${CH.n - CH.t + 1} huge terms do not fit in ${SECTIONS.bto.exam.perItemSeconds} seconds. The landmarks of the normal curve land within the option spacing.` },
    ] },
    { type: 'text', text: 'Many independent trials are **added up** (heads in 100 flips, the total of 30 dice) and the question asks for a probability that is far too long to compute exactly in the time: at least 60 heads, a total of at least 120, a count between 45 and 55. The word "estimate" or "roughly" is a strong hint.' },
    { type: 'list', items: ['"100 flips: roughly P(at least 60 heads)?"', '"30 dice: estimate P(total at least 120)."', '"400 flips: P(heads between 190 and 210)?"'] },
    { type: 'check', scope: 'the hint in the wording', questions: [
      { type: 'choice', q: 'Which wording points most strongly to this lesson?', options: ['"roughly", with many trials added', '"exactly", with three dice', '"ever reaches" a level', '"first six" on throw k'], answer: 0, traps: { 1: 'three dice are counted exactly', 2: 'a path question: random walks', 3: 'a single first success' }, explain: 'Many trials added up and an estimate: the normal curve does it in time.' },
    ] },
    { type: 'text', text: 'Not this lesson: a handful of trials you can count exactly (bto/coin-sequences, bto/three-dice), and "ever reaches" questions about a path (bto/random-walk-line).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['50 dice: estimate P(total at least 190)', '3 dice: P(total is 10)', '10 flips: P(exactly 5 heads)', 'A ±1 walk: P(it ever reaches 3 in 10 steps)'], answer: 0, traps: { 1: 'few dice: count exactly (bto/three-dice)', 2: 'one binomial term: C(10, 5)/1024', 3: 'a path question: reflection (bto/random-walk-line)' }, explain: 'A sum of many trials, and a tail that is too long to count.' },
    ] },

    S('why'),
    { type: 'text', text: 'In 90 seconds nobody adds up 40 binomial terms. The normal curve gets within the spacing of the options in two lines, provided the mean and the standard deviation of the sum are right. Almost every wrong option comes from getting the sd wrong (using the variance, or √n for a coin) or from reading the wrong area off the curve. The method is always the same four moves: one trial, the sum, z, the landmark. None of them needs a table if you keep five tail values in your head.' },

    S('anchor'),
    { type: 'text', text: 'You know the normal curve\'s landmarks: about 68% within 1 sd of the mean, 95% within 2, 99.7% within 3. The CLT is those landmarks with **one change**: first build the mean and sd of the **sum** from one trial. Means add; **variances** add; so sd grows like √n. For 100 flips that means mean 50 and sd 5, so "60 or more" is a 2 sd event, a few percent.' },
    { type: 'check', scope: 'the 68-95-99.7 landmarks', questions: [
      { type: 'choice', q: 'For a normal quantity, roughly what fraction lies more than 2 sd **above** the mean?', options: [pct(up(2)), pct(1 - (Phi(2) - Phi(-2))), pct(Phi(2) - Phi(-2)), pct(up(1))], answer: 0, traps: { 1: 'both tails together: the question asks for one', 2: 'the fraction within 2 sd', 3: 'the 1 sd tail' }, explain: `5% lies outside ±2 sd, split evenly: about ${pct(up(2))} above.`, hinge: true },
    ] },

    S('picture'),
    { type: 'text', text: `The exact distribution of heads in 16 flips, drawn as bars of width 1 centred on each count. Its outline is already bell-shaped, centred on the mean ${16 / 2} and about ${Math.sqrt(16) / 2} counts wide on each side, which is the sd √16/2 = ${Math.sqrt(16) / 2}.` },
    { type: 'diagram', diagram: 'histogram', spec: { title: 'Heads in 16 fair flips (number of strings)', xLabel: 'heads', yLabel: 'strings (of 65536)', bins: H16 }, caption: 'Each count k is a bar from k − 0.5 to k + 0.5. "At least 11 heads" is every bar from the one centred on 11, so on the smooth curve it starts at 10.5: that is the continuity correction.' },
    { type: 'check', scope: 'bars and the continuity correction', questions: [
      { make: (rng) => { const n = rng.pick([36, 64, 100]), t = n / 2 + rng.int(3, 8); const which = rng.chance(0.5); return which ? mc(rng, `${n} flips, "at least ${t} heads". Where does the area start on the normal curve?`, String(t - 0.5), [[String(t), 'no continuity correction'], [String(t + 0.5), 'moved the edge the wrong way: that drops the bar at ' + t], [String(t - 1), 'dropped a whole count']], `The bar for ${t} starts at ${t - 0.5}.`) : mc(rng, `${n} flips, "at most ${t} heads". Where does the area end on the normal curve?`, String(t + 0.5), [[String(t), 'no continuity correction'], [String(t - 0.5), 'cut the bar at ' + t + ' in half the wrong way'], [String(t + 1), 'added a whole count']], `The bar for ${t} ends at ${t + 0.5}.`); } },
    ] },
    { type: 'text', text: 'Standardise: subtract the mean and divide by the sd, so every question becomes "how far out, in sd units?". Then read the area on the standard normal curve. The shaded tail below lies beyond z = 2.' },
    { type: 'diagram', diagram: 'density', spec: { title: 'Standard normal: tail beyond z = 2', xLabel: 'z', curves: [{ name: 'N(0, 1)', points: ZS.map((z) => [Number(z.toFixed(1)), Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)]) }], shade: [{ from: 2, to: 4 }], xTicks: [-3, -2, -1, 0, 1, 2, 3] }, caption: `Tail areas to know: beyond 1 sd ${pct(up(1))}, beyond 1.5 sd ${pct(up(1.5))}, beyond 2 sd ${pct(up(2))}, beyond 3 sd ${(up(3) * 100).toFixed(2)}%.` },
    { type: 'check', scope: 'reading one tail', questions: [
      { make: (rng) => { const z = rng.pick([1, 2, 3]); return mc(rng, `P(Z > ${z}) for a standard normal Z, roughly?`, pct(up(z)), [[pct(2 * up(z)), 'counted both tails'], [pct(Phi(z) - 0.5), 'read the area between 0 and z'], [pct(Phi(z)), 'read the area below z']], `Landmark: about ${pct(up(z))}.`); } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Landmarks', columns: ['z', 'one tail P(Z > z)', 'within ±z'], rows: [1, 1.5, 2, 2.5, 3].map((z) => [String(z), pct(up(z)), pct(Phi(z) - Phi(-z))]) }, caption: 'Keep the one-tail column in your head. A two-sided band is 1 − 2 × (one tail).' },
    { type: 'check', scope: 'bands from tails', questions: [
      { make: (rng) => { const z = rng.pick([1, 2]); return mc(rng, `Roughly what fraction of a normal quantity lies within ±${z} sd of its mean?`, pct(Phi(z) - Phi(-z)), [[pct(1 - up(z)), 'subtracted only one tail'], [pct(up(z)), 'gave one tail'], [pct(2 * up(z)), 'gave both tails']], `1 − 2 × ${pct(up(z))} ≈ ${pct(Phi(z) - Phi(-z))}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'One trial first: its mean μ and variance σ². A fair coin counted as heads = 1: μ = 1/2, σ² = 1/4. A fair die: μ = 3.5, σ² = 35/12 ≈ 2.92.', why: 'Separate the per-trial numbers from the sum; every later step builds on these two.', answers: 'sqrt-n',
        checks: [
          { type: 'choice', q: 'Variance of one fair die throw?', options: [DIE_VAR.toString(), '7/2', '91/6', '1'], answer: 0, traps: { 1: 'the mean, not the variance', 2: 'E[X²] without subtracting the squared mean', 3: 'assumed sd 1' }, explain: `E[X²] − (E[X])² = 91/6 − 49/4 = ${DIE_VAR}.` },
        ] },
      { say: 'Sum of n independent trials: mean nμ, variance nσ², so sd = σ√n.', why: 'Means add, and variances of independent trials add. Standard deviations do not add; they grow only like √n.', answers: 'variance',
        checks: [
          { make: (rng) => { const n = rng.pick([36, 64, 100, 144, 400]); return mc(rng, `Heads in ${n} fair flips. Standard deviation?`, String(Math.sqrt(n) / 2), [[String(Math.sqrt(n)), 'used √n: one flip has sd 1/2, not 1'], [String(n / 4), 'gave the variance n/4'], [String(n / 2), 'gave the mean']], `√(${n} × 1/4) = √${n}/2 = ${Math.sqrt(n) / 2}.`); } },
        ] },
      { say: 'Standardise: z = (threshold − mean)/sd, with the threshold moved half a unit outward from the counts you keep ("at least t" uses t − 0.5).', why: 'Each whole-number count is a bar of width 1; the smooth curve must cover the whole bar.', answers: 'no-cc',
        checks: [
          { make: (rng) => { const n = rng.pick([36, 100, 144]), t = n / 2 + rng.int(3, 9); const z = (t - 0.5 - n / 2) / (Math.sqrt(n) / 2); return { type: 'number', q: `${n} flips, at least ${t} heads. Compute z with the continuity correction (2 decimals).`, answer: Number(z.toFixed(2)), tolerance: 0.011, hints: [`Mean ${n / 2}, sd ${Math.sqrt(n) / 2}.`, `(${t} − 0.5 − ${n / 2})/${Math.sqrt(n) / 2}.`], explain: `(${t - 0.5} − ${n / 2})/${Math.sqrt(n) / 2} = ${z.toFixed(2)}.` }; } },
        ] },
      { say: 'Read one tail from the landmarks, interpolating between them: 1 sd ≈ 16%, 1.5 sd ≈ 6.7%, 2 sd ≈ 2.3%, 3 sd ≈ 0.13%.', why: 'A closest-value question only needs the right neighbourhood; the options are spaced wider than the interpolation error.', answers: 'exact',
        checks: [
          { make: (rng) => { const n = rng.pick([100, 144, 400]), sd = Math.sqrt(n) / 2, zz = rng.pick([1, 2, 3]), t = n / 2 + zz * sd; const v = coinAtLeast(n, t); return mc(rng, `${n} fair flips. Closest estimate of P(at least ${t} heads)?`, pct(v), [[pct(2 * v), 'counted both tails'], [pct(up((t - n / 2) / Math.sqrt(n))), 'used √n as the sd'], [pct(0.5 - v), 'read the area between the mean and the threshold'], [pct(1 - v), 'answered the complement']], `Mean ${n / 2}, sd ${sd}: about ${zz} sd up. Exact ${pct(v)}.`, { hinge: true }); } },
        ] },
      { say: 'For dice use the die numbers: a sum of n dice has mean 3.5n and sd ≈ 1.71√n. Then the same landmarks.', why: `√(35/12) ≈ ${DIE_SD.toFixed(3)}: the sd of one die.`,
        checks: [
          { make: (rng) => { const n = rng.pick([12, 27, 48, 75]); const sd = DIE_SD * Math.sqrt(n); return { type: 'number', q: `${n} fair dice. Standard deviation of the total (2 decimals)?`, answer: Number(sd.toFixed(2)), tolerance: 0.02, hints: ['Variance of one die: 35/12.', `√(${n} × 35/12).`], explain: `√(${n} × 35/12) ≈ ${sd.toFixed(2)}.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is the standard deviation of heads in 100 flips 5 and not 10 or 25?', model: 'One flip (heads = 1) has variance 1/4, so sd 1/2. Variances of independent flips add: 100 × 1/4 = 25. The sd is the square root of that, 5. Using √100 = 10 would treat one flip as having sd 1, and 25 is the variance, not the sd.', points: ['one flip has variance 1/4, sd 1/2', 'variances add over independent trials', 'sd = √(total variance) = √n/2'] },

    S('worked'),
    { type: 'worked', family: 'clt-estimates', section: 'bto', difficulty: 3, seed: 'a', explainAt: [0, 1], intro: 'Heads in 100 flips. Try it before opening the solution.' },
    { type: 'worked', family: 'clt-estimates', section: 'bto', difficulty: 4, seed: 'a', fade: 1, intro: 'A sum of dice. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: '100 flips: is P(at least 60 heads) closer to 16%, 2.3% or 0.1%? And 400 flips, at least 240 heads?', answer: `100 flips: 60 is 2 sd up, exact ${pct(coinAtLeast(100, 60))}. 400 flips: sd 10, so 240 is 4 sd up: exact ${(coinAtLeast(400, 240) * 100).toFixed(4)}%, essentially 0.`, explain: 'The same 60% share of heads is far rarer with more flips: the sd grows only like √n.' },

    S('traps'),
    { type: 'traps', family: 'clt-estimates', section: 'bto', extra: [
      { belief: 'Divide by the variance n/4.', fix: 'z divides by the standard deviation √n/2.' },
      { belief: 'The sd of n flips is √n.', fix: 'One flip has sd 1/2, so n flips have √n/2.' },
      { belief: 'A one-sided question uses both tails.', fix: '"At least" is one tail: about 2.3% at 2 sd, not 4.6%.' },
    ] },
    { type: 'erroneous', problem: '100 flips. A candidate estimates P(at least 60 heads). One step is wrong.', steps: [
      'Heads has mean 50.',
      'Variance per flip 1/4, so the sd is 100 × 1/4 = 25.',
      'z = (60 − 50)/25 = 0.4.',
      `P ≈ ${pct(up(0.4))}.`,
    ], errorStep: 1, explain: `25 is the variance. The sd is √25 = 5, so z = 2 and P ≈ ${pct(up(2))} (exact ${pct(coinAtLeast(100, 60))}).` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `100 flips, at least 60 heads. A candidate answers ${pct(2 * coinAtLeast(100, 60))}. Which belief?`, options: ['Counted both tails', 'Divided by the variance', 'Used √n as the sd'], answer: 0, traps: { 1: `dividing by the variance 25 gives z = 0.4, about ${pct(up(0.4))}`, 2: `sd √100 = 10 puts 60 at 1 sd, about ${pct(up(1))}` }, explain: `Double the one-tail answer ${pct(coinAtLeast(100, 60))}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Coin sd at a glance (√n/2): ${[36, 64, 100, 144, 400].map((n) => `${n} → ${Math.sqrt(n) / 2}`).join(', ')}. Die sd ≈ 1.71√n: ${[12, 30, 50].map((n) => `${n} dice → ${(DIE_SD * Math.sqrt(n)).toFixed(1)}`).join(', ')}.` },
    { type: 'check', scope: 'sd at a glance', questions: [
      { make: (rng) => { const n = rng.pick([36, 64, 100, 144, 196, 400]); return { type: 'number', q: `Standard deviation of heads in ${n} fair flips?`, answer: Math.sqrt(n) / 2, explain: `√${n}/2 = ${Math.sqrt(n) / 2}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `Two lines: "mean m, sd s, threshold is k sd away", then the landmark. Pick the option nearest the landmark; with the continuity correction the answer moves slightly towards the mean. About 30 of your ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'thinkaloud', problem: `You throw ${TK.n} fair dice. Estimate the probability that the total is at least ${TK.t}.`, lines: [
      { t: 0, say: 'A sum of many dice and "estimate": normal approximation. One die: mean 3.5, variance 35/12.' },
      { t: 5, say: `${TK.n} dice: mean ${3.5 * TK.n}, variance ${TK.n} × 35/12 = ${DIE_VAR.mul(Q.of(TK.n))}.` },
      { t: 10, say: `So z = (${TK.t} − ${3.5 * TK.n})/${DIE_VAR.mul(Q.of(TK.n))}...`, slip: true },
      { t: 14, say: `No, that divides by the variance. The sd is √${DIE_VAR.mul(Q.of(TK.n))} ≈ ${TK.sd.toFixed(1)}.` },
      { t: 20, say: `Continuity: "at least ${TK.t}" starts at ${TK.t - 0.5}. z = ${TK.t - 0.5 - 3.5 * TK.n}/${TK.sd.toFixed(1)} ≈ ${TK.z.toFixed(2)}.` },
      { t: 28, say: `Between 1.5 sd (${pct(up(1.5))}) and 2 sd (${pct(up(2))}), nearer 2: about ${pct(up(TK.z))}.` },
      { t: 34, say: `Sanity: about 2 sd up should be a few percent, and it is. Answer ≈ ${pct(up(TK.z))}, ${SECTIONS.bto.exam.perItemSeconds - 34} seconds left.` },
    ] },
    { type: 'check', scope: 'the two lines and the think-aloud', questions: [
      { type: 'choice', q: '100 flips, P(at least 60 heads). With the continuity correction, z is:', options: ['1.9', '2', '2.1', '0.38'], answer: 0, traps: { 1: 'cut at 60: the correction moves the cut toward the mean', 2: 'moved the cut the wrong way, to 60.5', 3: 'divided by the variance 25, not the sd 5' }, explain: 'Mean 50, sd 5, cut at 59.5: (59.5 − 50)/5 = 1.9.' },
      { type: 'choice', q: 'In the think-aloud, the first try divided by 140. What was wrong?', options: ['140 is the variance; divide by its root', '140 is the mean of 48 dice', 'the total should be split by 48'], answer: 0, traps: { 1: 'the mean is 168', 2: 'that gives the average, a different question' }, explain: 'z uses the sd: √140 ≈ 11.8.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Sum of n trials → mean nμ, sd σ√n (coin 1/2, die ≈ 1.71). z = (t ± 0.5 − mean)/sd. One tail: 16% / 2.3% / 0.13% at 1 / 2 / 3 sd.' },

    S('contrast'),
    { type: 'compare', columns: ['Quantity', 'Adds across trials?', '100 flips'], rows: [
      ['mean', 'yes', '50'],
      ['variance', 'yes (independent trials)', '25'],
      ['standard deviation', 'no: grows like √n', '5'],
      ['share of heads', 'sd shrinks like 1/√n', 'sd 0.05'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: with few trials (n = 5) or far tails the curve is rough, so count exactly. Exactly one value, "exactly 50 heads", is one bar: about 1/(sd·√(2π)) = ${f4(1 / (5 * Math.sqrt(2 * Math.PI)))} against the exact ${f4(Number(nCr(100, 50)) / 2 ** 100)}.` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'You go from 100 flips to 400 flips. What happens to the sd of the number of heads?', options: ['It doubles', 'It quadruples', 'It stays the same', 'It halves'], answer: 0, traps: { 1: 'the variance quadruples; the sd grows like √n', 2: 'the count spreads more with more flips', 3: 'that is the share of heads, not the count' }, explain: '√400/2 = 10 against √100/2 = 5.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the Intervals section asks for ranges, and mean ± 2 sd is the natural first guess (iv/estimation-tricks). A ±1 walk after n steps is a sum of n fair ±1 steps, so its end point has sd √n (bto/random-walk-line).' },
    { type: 'variation', base: `100 fair flips: P(at least 60 heads). Mean 50, sd 5, so 60 is 2 sd up: about ${pct(up((60 - 0.5 - 50) / 5))} with the correction (exact ${pct(coinAtLeast(100, 60))}).`, rows: [
      { change: 'Ask for at most 40 tails instead', effect: `No change: ${pct(coinAtLeast(100, 60))}. At most 40 tails is the same event as at least 60 heads.`, same: true },
      { change: 'Ask for at least 55 heads', effect: `Now 1 sd up: about 16% (exact ${pct(coinAtLeast(100, 55))}).` },
      { change: 'Ask for between 45 and 55 heads', effect: `A band of ±1 sd, widened by the correction to ±1.1 sd: about ${pct(Phi(1.1) - Phi(-1.1))} (exact ${pct(coinBand(100, 45, 55))}).` },
      { change: 'Flip 400 times, at least 240 heads', effect: 'The same 60% share, but the sd is only 10: 4 sd up, essentially 0.' },
      { change: 'Flip 400 times, at least 220 heads', effect: `Both change: mean 200, sd 10, so 220 is again 2 sd up. The z is the same, so about the same answer (exact ${pct(coinAtLeast(400, 220))}).`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.pick([100, 144, 400]), sd = Math.sqrt(n) / 2, zz = rng.pick([1, 2]), t = n / 2 + zz * sd; const v = coinAtLeast(n, t); return mc(rng, `A strategy makes ${n} independent trades, each a winner with probability 1/2. Closest estimate of P(at least ${t} winners)?`, pct(v), [[pct(2 * v), 'counted both tails'], [pct(up((t - n / 2) / Math.sqrt(n))), 'used √n as the sd'], [pct(1 - v), 'answered the complement'], [pct(0.5 - v), 'read the area between the mean and the threshold']], `Mean ${n / 2}, sd √${n}/2 = ${sd}: ${t} is ${zz} sd up. Exact ${pct(v)}.`); } },
      far: { make: (rng) => { const n = rng.pick([2500, 10000, 40000]), p = rng.pick([0.01, 0.02, 0.05]); const sd = Math.sqrt(n * p * (1 - p)); return { type: 'number', q: `An insurer holds ${n} independent policies, each with a ${p * 100}% chance of a claim this year. Standard deviation of the number of claims (1 decimal)?`, answer: Number(sd.toFixed(1)), tolerance: 0.06, hints: ['One policy is a 0/1 trial with variance p(1 − p).', `Variances add: ${n} × ${p} × ${(1 - p).toFixed(2)}.`], explain: `√(${n} × ${p} × ${(1 - p).toFixed(2)}) ≈ ${sd.toFixed(1)}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from coin flips to the trades and to the insurer?', options: ['Variances add, so the sd of a sum grows like √n', 'Standard deviations add, so the sd grows like n', 'The sd of a count is √n, whatever one trial is', 'Divide by the variance of the sum to standardise'], answer: 0, traps: { 1: 'sds do not add for independent trials', 2: 'one trial with chance p has variance p(1 − p), not 1', 3: 'z divides by the sd, the square root of the variance' }, explain: 'Both new questions are sums of independent 0/1 trials. Build one trial (variance p(1 − p)), add n variances, take the square root.' } },

    S('tryit'),
    { type: 'tryit', family: 'clt-estimates', section: 'bto', count: 3 },
  ],
};
