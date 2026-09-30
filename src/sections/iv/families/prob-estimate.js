import { nCr, derangements, factorial } from '../../../core/combinatorics.js';
import { ivItem } from '../lib.js';

// Probabilities that are exact in principle but not mentally computable in 60 s.
const S = {
  birthday: {
    level: 2,
    make: (rng) => ({ n: rng.int(10, 50) }),
    text: ({ n }) => `${n} people are in a room. Assuming 365 equally likely birthdays and no leap years, what is the probability, in percent, that at least two share a birthday?`,
    p: ({ n }) => { let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365; return 1 - q; },
    alt: ({ n }) => { let l = 0; for (let i = 0; i < n; i++) l += Math.log(365 - i) - Math.log(365); return -Math.expm1(l); },
    sd: 2.5,
    steps: ({ n }) => [
      { say: `P(all different) = 365/365 × 364/365 × … × ${366 - n}/365 ≈ exp(−n(n − 1)/730) = exp(−${(n * (n - 1) / 730).toFixed(2)}).`, why: 'Each factor is close to 1, so ln(1 − i/365) ≈ −i/365 and the exponents add to −n(n − 1)/(2·365).' },
      { say: 'Subtract from 1.', why: 'At least one shared birthday is the complement of all different.' },
    ],
  },
  sixes: {
    level: 2,
    make: (rng) => ({ n: rng.int(6, 24) }),
    text: ({ n }) => `A fair die is rolled ${n} times. What is the probability, in percent, of at least one six?`,
    p: ({ n }) => 1 - (5 / 6) ** n,
    alt: ({ n }) => -Math.expm1(n * Math.log(5 / 6)),
    sd: 1.5,
    steps: ({ n }) => [
      { say: `P(no six) = (5/6)^${n}. Use (5/6)^6 ≈ 0.335 and powers of it: (5/6)^${n} ≈ ${((5 / 6) ** n).toFixed(3)}.`, why: 'Anchor on a power you know, then multiply by the leftover factors.' },
      { say: 'P(at least one six) = 1 − (5/6)^n.', why: 'Complement of "none".' },
    ],
  },
  derange: {
    level: 3,
    make: (rng) => ({ n: rng.int(4, 12) }),
    text: ({ n }) => `${n} people put their hats in a box and each draws one at random. What is the probability, in percent, that nobody gets their own hat?`,
    p: ({ n }) => Number(derangements(n)) / Number(factorial(n)),
    alt: ({ n }) => { let s = 0; for (let k = 0; k <= n; k++) s += (-1) ** k / Number(factorial(k)); return s; },
    sd: 0.8,
    steps: ({ n }) => [
      { say: `Inclusion-exclusion: P = 1 − 1 + 1/2! − 1/3! + … ± 1/${n}!.`, why: 'Subtract permutations fixing a chosen person, add back pairs, and so on.' },
      { say: 'The series is e^(−1) ≈ 36.79% to within 1/(n + 1)!.', why: `For n ≥ 4 the tail is below 1/120, so the answer is within about ${(100 / Number(factorial(n + 1))).toFixed(3)} points of 36.79%.` },
    ],
  },
  binomTail: {
    level: 3,
    make: (rng) => { const n = rng.pick([20, 30, 40, 50, 60, 100]); const k = Math.round(n / 2 + rng.int(1, 3) * Math.sqrt(n) / 2); return { n, k }; },
    text: ({ n, k }) => `A fair coin is tossed ${n} times. What is the probability, in percent, of at least ${k} heads?`,
    p: ({ n, k }) => { let c = 0n; for (let j = k; j <= n; j++) c += nCr(n, j); return Number(c * 10n ** 12n / 2n ** BigInt(n)) / 1e12; },
    alt: ({ n, k }) => { let t = 0, pj = 0.5 ** n; for (let j = 0; j <= n; j++) { if (j >= k) t += pj; pj *= (n - j) / (j + 1); } return t; },
    sd: 2,
    steps: ({ n, k }) => [
      { say: `Heads ~ Binomial(${n}, 1/2): mean ${n / 2}, sd √(${n}/4) = ${(Math.sqrt(n) / 2).toFixed(2)}.`, why: 'Normal approximation to a symmetric binomial.' },
      { say: `With continuity correction, z = (${k} − 0.5 − ${n / 2}) / ${(Math.sqrt(n) / 2).toFixed(2)} = ${((k - 0.5 - n / 2) / (Math.sqrt(n) / 2)).toFixed(2)}; P = 1 − Φ(z).`, why: '"At least k" on a discrete count starts at the bar edge k − 0.5.' },
    ],
  },
  sumDice: {
    level: 4,
    make: (rng) => { const n = rng.pick([10, 20, 30, 50]); return { n, k: Math.round(3.5 * n + rng.int(1, 2) * Math.sqrt(n * 35 / 12)) }; },
    text: ({ n, k }) => `${n} fair dice are thrown. What is the probability, in percent, that the total is at least ${k}?`,
    p: ({ n, k }) => { let dist = [1]; for (let i = 0; i < n; i++) { const nd = Array(dist.length + 6).fill(0); dist.forEach((v, s) => { for (let f = 1; f <= 6; f++) nd[s + f] += v / 6; }); dist = nd; } return dist.slice(k).reduce((a, b) => a + b, 0); },
    alt: ({ n, k }) => { // generating-function coefficients by repeated convolution in the other order
      let dist = new Float64Array(6 * n + 1); dist[0] = 1;
      for (let i = 0; i < n; i++) { const nd = new Float64Array(6 * n + 1); for (let s = 6 * n; s >= 0; s--) { let v = 0; for (let f = 1; f <= 6 && f <= s; f++) v += dist[s - f]; nd[s] = v / 6; } dist = nd; }
      let t = 0; for (let s = k; s <= 6 * n; s++) t += dist[s]; return t;
    },
    sd: 2,
    steps: ({ n, k }) => [
      { say: `Total ≈ Normal(mean ${3.5 * n}, sd √(${n} × 35/12) = ${Math.sqrt(n * 35 / 12).toFixed(2)}).`, why: 'One die has variance 35/12; independent variances add.' },
      { say: `z = (${k} − 0.5 − ${3.5 * n}) / ${Math.sqrt(n * 35 / 12).toFixed(2)} = ${((k - 0.5 - 3.5 * n) / Math.sqrt(n * 35 / 12)).toFixed(2)}; P = 1 − Φ(z).`, why: 'Continuity correction for "at least k" on an integer total.' },
    ],
  },
};

const fam = {
  id: 'prob-estimate',
  section: 'iv',
  title: 'Probabilities you must estimate',
  skill: 'Approximate with complements, exponentials and the normal curve, then size the interval to your approximation error',
  levels: [2, 3, 4],
  generate(rng, { difficulty = 2 } = {}) {
    const keys = Object.keys(S).filter((k) => S[k].level === difficulty || (difficulty === 4 && S[k].level === 3));
    const key = rng.pick(keys), sc = S[key], params = sc.make(rng);
    const truth = sc.p(params) * 100;
    // Tail probabilities carry relative error; central ones absolute error; near 100% the gap to 100 caps it.
    const belief = truth < 12 ? { kind: 'lognormal', sd: 0.2 } : { kind: 'normal', sd: Number(Math.min(sc.sd, (100 - truth) / 1.5).toPrecision(2)) };
    const coach = { exact: false, belief, note: belief.kind === 'lognormal' ? 'A small tail probability: a good approximation is within about 20% of the true value, so think in ratios.' : `Exact in principle, but a 60-second estimate is good to about ±${belief.sd} percentage points.` };
    return ivItem(fam, rng, difficulty, {
      text: sc.text(params), truth, unit: '%', coach,
      steps: [...sc.steps(params), { say: `Exact value: ${truth.toFixed(2)}%.`, why: 'Computed exactly by the generator; your approximation should land within a couple of points.' }],
      hints: ['Complement first: what is the probability of the opposite event?', 'Use an approximation you trust (e^−x, the normal curve) and keep track of how far off it could be.'],
      params: { scenario: key, ...params },
    });
  },
  // Independent check: a second, differently organised exact computation.
  verify(item) {
    const alt = S[item.params.scenario].alt(item.params) * 100;
    return { ok: Math.abs(alt - item.truth) < 1e-6 && item.truth > 0, detail: `alternative computation ${alt}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Some probability questions are exact in principle but not in 60 seconds. The skill is a fast approximation plus an honest error bar.',
    anchor: 'The exact-probability questions, with one change: you estimate instead of compute, so the interval needs width.',
    steps: [
      { say: 'Pick the approximation: complement and e^(−x) for "at least one" and birthday questions, the normal curve for sums and counts.', why: 'Each has a known accuracy, which is what sets your width.' },
      { say: 'Estimate, then widen by the approximation error and your arithmetic error.', why: 'A miss scores 0; a slightly wide interval still scores 0.9.' },
    ],
    predict: { question: '23 people: P(shared birthday)? Estimate before reading on.', answer: 'exp(−23·22/730) = exp(−0.693) ≈ 0.5, so about 50% (exactly 50.73%).' },
    rule: 'Estimate with a trusted approximation, then set width from its error, not from nerves.',
    contrast: 'Exact questions: zero width. Estimated ones: width about ±1.4 sd. Treating an estimate as exact is the costliest mistake in this section.',
    edge: 'Derangements converge so fast that for n ≥ 7 the answer is 36.79% to two decimals: effectively exact.',
  },
};
export default fam;
