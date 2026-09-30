// Normal approximation to sums: heads in n flips and sums of many dice (exact answer, CLT reasoning).
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, Phi } from '../lib.js';

const ID = 'clt-estimates';
const DICE_CACHE = new Map();
// Exact counts of each total for n dice (BigInt), cached per n.
function diceCounts(n) {
  if (DICE_CACHE.has(n)) return DICE_CACHE.get(n);
  let c = [1n];
  for (let i = 0; i < n; i++) {
    const nx = Array(c.length + 6).fill(0n);
    c.forEach((w, s) => { for (let f = 1; f <= 6; f++) nx[s + f] += w; });
    c = nx;
  }
  DICE_CACHE.set(n, c);
  return c;
}
const coinTail = (n, lo, hi) => { // P(lo <= heads <= hi), exact
  let s = 0n, c = 1n;
  for (let k = 0; k <= n; k++) { if (k >= lo && k <= hi) s += c; c = (c * BigInt(n - k)) / BigInt(k + 1); }
  return new Q(s, 2n ** BigInt(n));
};

export default {
  id: ID,
  section: 'bto',
  title: 'Normal approximation (CLT)',
  skill: 'Standardise: z = (threshold − mean)/sd with sd = √(n·variance); a fair coin has sd √n/2',
  levels: [3, 4],

  generate(rng, { difficulty = 3 } = {}) {
    const kind = difficulty === 3 ? 'coinTail' : rng.pick(['coinBand', 'diceTail', 'coinTail']);
    if (kind === 'coinTail' || kind === 'coinBand') {
      const n = rng.pick(difficulty === 3 ? [36, 64, 100, 100, 144] : [100, 144, 196, 256, 400]);
      const mu = n / 2, sd = Math.sqrt(n) / 2;
      const z = rng.pick(kind === 'coinTail' ? [1, 1.5, 2, 2.5, 3] : [1, 2]);
      const w = Math.round(z * sd);
      const lo = kind === 'coinTail' ? mu + w : mu - w, hi = kind === 'coinTail' ? n : mu + w;
      const v = coinTail(n, lo, hi);
      const zc = kind === 'coinTail' ? (lo - 0.5 - mu) / sd : (hi + 0.5 - mu) / sd;
      const noCC = kind === 'coinTail' ? 1 - Phi((lo - mu) / sd) : 2 * Phi((hi - mu) / sd) - 1;
      const varAsSd = kind === 'coinTail' ? 1 - Phi((lo - mu) / (n / 4)) : 2 * Phi((hi - mu) / (n / 4)) - 1;
      const rootN = kind === 'coinTail' ? 1 - Phi((lo - mu) / Math.sqrt(n)) : 2 * Phi((hi - mu) / Math.sqrt(n)) - 1;
      const text = kind === 'coinTail'
        ? `You flip a fair coin ${n} times. Estimate the probability of getting at least ${lo} heads.`
        : `You flip a fair coin ${n} times. Estimate the probability that the number of heads is between ${lo} and ${hi} inclusive.`;
      return mcqItem(ID, rng, difficulty, {
        value: v, text,
        distractors: [
          { value: varAsSd, misconception: `Divided by the variance n/4 = ${n / 4} instead of the standard deviation √n/2 = ${sd}.` },
          { value: rootN, misconception: `Used √n = ${Math.sqrt(n)} as the standard deviation; one fair flip has sd 1/2, so the sum has sd √n/2.` },
          { value: kind === 'coinTail' ? 2 * v.toNumber() : (1 - v.toNumber()) / 2, misconception: kind === 'coinTail' ? 'Counted both tails; the question asks for one side only.' : 'Computed one tail outside the band.' },
          { value: q(1).sub(v), misconception: 'Answered the complement.' },
          { value: kind === 'coinTail' ? 0.5 - v.toNumber() : v.toNumber() / 2, misconception: kind === 'coinTail' ? 'Read the normal table as the area between the mean and z, not beyond z.' : 'Only took one half of the band.' },
          { value: noCC, misconception: 'Used the normal curve without a continuity correction; close, but the exact answer is the one listed.' },
        ],
        steps: [
          { say: `Heads ~ Binomial(${n}, 1/2): mean ${mu}, sd = √(${n} × 1/4) = ${sd}.`, why: 'Variance of one flip is 1/4; variances of independent flips add.' },
          { say: `Standardise with a continuity correction: z = ${zc.toFixed(2)}.`, why: `Each integer count is a bar of width 1, so "${kind === 'coinTail' ? `≥ ${lo}` : `≤ ${hi}`}" starts at ${kind === 'coinTail' ? lo - 0.5 : hi + 0.5}.` },
          { say: `Normal estimate ≈ ${(kind === 'coinTail' ? 1 - Phi(zc) : 2 * Phi(zc) - 1).toFixed(4)}; exact binomial = ${v.toNumber().toFixed(4)}.`, why: 'Know the landmarks: 1σ ≈ 16% per tail, 2σ ≈ 2.3%, 3σ ≈ 0.13%.' },
        ],
        rule: 'Sum of n flips: mean n/2, sd √n/2. Tails beyond 1σ, 2σ, 3σ: 16%, 2.3%, 0.13%. Within ±1σ: 68%, ±2σ: 95%.',
        anchor: 'The 68-95-99.7 rule for a normal curve, with one change: first build the mean and sd of a sum from one flip\'s mean 1/2 and variance 1/4.',
        hints: ['What are the mean and standard deviation of the number of heads?', `sd = √n/2 = ${sd}. How many sds away is the threshold?`, `About ${(w / sd).toFixed(1)} sd.`],
        data: { kind, n, lo, hi },
      });
    }
    const n = rng.pick([10, 20, 30, 50]);
    const mu = 3.5 * n, sd = Math.sqrt((35 * n) / 12);
    const z = rng.pick([1, 1.5, 2]);
    const t = Math.round(mu + z * sd);
    const c = diceCounts(n);
    let s = 0n;
    for (let x = t; x < c.length; x++) s += c[x];
    const v = new Q(s, 6n ** BigInt(n));
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `You throw ${n} fair dice. Estimate the probability that their total is at least ${t}.`,
      distractors: [
        { value: 1 - Phi((t - mu) / ((35 * n) / 12)), misconception: `Divided by the variance ${((35 * n) / 12).toFixed(1)} instead of the sd ${sd.toFixed(2)}.` },
        { value: 1 - Phi((t - mu) / Math.sqrt(n)), misconception: 'Assumed each die has sd 1; its variance is 35/12, so its sd is about 1.71.' },
        { value: 1 - Phi((t - mu) / (sd * Math.sqrt(n))), misconception: 'Multiplied the sd of the sum by √n a second time.' },
        { value: 2 * v.toNumber(), misconception: 'Counted both tails.' },
        { value: q(1).sub(v), misconception: 'Answered the complement.' },
        { value: 0.5 - v.toNumber(), misconception: 'Read the normal table as the area between the mean and z.' },
      ],
      steps: [
        { say: `One die: mean 3.5, variance 35/12 ≈ 2.92. Sum of ${n}: mean ${mu}, sd = √(${n} × 35/12) ≈ ${sd.toFixed(2)}.`, why: 'Means and variances of independent dice add.' },
        { say: `z = (${t} − 0.5 − ${mu})/${sd.toFixed(2)} ≈ ${((t - 0.5 - mu) / sd).toFixed(2)}.`, why: 'Continuity correction: the total is an integer.' },
        { say: `Normal estimate ≈ ${(1 - Phi((t - 0.5 - mu) / sd)).toFixed(4)}; exact = ${v.toNumber().toFixed(4)}.`, why: 'The CLT is already very accurate for 10+ dice.' },
      ],
      rule: 'n dice: mean 3.5n, sd ≈ 1.71√n. Then use the 16% / 2.3% / 0.13% tail landmarks.',
      anchor: 'The 68-95-99.7 rule, with one change: the sd of one die (≈ 1.71) replaces the sd of one flip (1/2).',
      hints: ['What are the mean and variance of one die?', `Sum: mean ${mu}, sd ≈ ${sd.toFixed(2)}.`, `The threshold is about ${z} sd above the mean.`],
      data: { kind: 'diceTail', n, t },
    });
  },

  // Independent check: floating-point convolution of the single-trial distribution.
  verify(item) {
    const d = item.params;
    const faces = d.kind === 'diceTail' ? [1, 2, 3, 4, 5, 6] : [0, 1];
    let dist = [1];
    for (let i = 0; i < d.n; i++) {
      const nx = Array(dist.length + faces[faces.length - 1]).fill(0);
      dist.forEach((p, s) => faces.forEach((f) => { nx[s + f] += p / faces.length; }));
      dist = nx;
    }
    const lo = d.kind === 'diceTail' ? d.t : d.lo, hi = d.kind === 'diceTail' ? dist.length - 1 : d.hi;
    let p = 0;
    for (let s = lo; s <= hi; s++) p += dist[s] || 0;
    return agree(item, p, 1e-9);
  },

  lesson: {
    purpose: 'Many questions ("at least 60 heads in 100 flips") are too long to compute exactly in 90 seconds. The normal approximation gets within the answer spacing in two lines.',
    anchor: 'The normal curve with its 68-95-99.7 landmarks, with one change: build the mean and sd of a sum from one trial (mean μ, variance σ² → sum mean nμ, sd σ√n).',
    steps: [
      { say: 'One trial: mean and variance (coin 1/2 and 1/4; die 3.5 and 35/12).', why: 'Separate the per-trial numbers from the sum.' },
      { say: 'Sum of n: mean nμ, variance nσ², sd σ√n.', why: 'Variances of independent trials add; sds do not.' },
      { say: 'z = (threshold ± 0.5 − mean)/sd, then read the tail: 1σ → 16%, 2σ → 2.3%, 3σ → 0.13%.', why: 'The ±0.5 treats each integer as a bar of width 1.' },
    ],
    predict: { question: '100 flips: at least 60 heads, closer to 16%, 2.3% or 0.1%?', answer: 'About 2.3% (exact 2.8%): 60 is 2 sd above 50, with sd 5.' },
    edge: 'Few trials (n = 5) or extreme tails: the normal curve is rough; then count exactly.',
    rule: 'sd(sum) = σ√n; coin σ = 1/2, die σ ≈ 1.71. Landmarks 16% / 2.3% / 0.13%.',
    contrast: 'Variance (adds across trials) against standard deviation (what z divides by).',
  },
};
