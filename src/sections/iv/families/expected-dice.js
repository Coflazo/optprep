import { Q, sumQ } from '../../../core/rational.js';
import { ivItem, range } from '../lib.js';

// Expected values over a few fair dice, computed exactly with rationals.
const faces = (m) => range(1, m);
const S = {
  sumN: {
    level: 1,
    make: (rng) => ({ n: rng.int(2, 12), m: rng.pick([4, 6, 8, 10, 12, 20]) }),
    text: ({ n, m }) => `${n} fair ${m}-sided dice are thrown. What is the expected total?`,
    ev: ({ n, m }) => Q.of(n * (m + 1), 2),
    steps: ({ n, m }) => [{ say: `One ${m}-sided die averages (1 + ${m})/2 = ${(m + 1) / 2}; by linearity the total averages ${n} × ${(m + 1) / 2}.`, why: 'Expectation is linear: the mean of a sum is the sum of the means, independence not even needed.' }],
    brute: ({ n, m }) => n * faces(m).reduce((a, b) => a + b, 0) / m,
  },
  max2: {
    level: 2,
    make: (rng) => ({ m: rng.pick([4, 6, 8, 10]), which: rng.pick(['max', 'min']) }),
    text: ({ m, which }) => `Two fair ${m}-sided dice are thrown. What is the expected value of the ${which === 'max' ? 'larger' : 'smaller'} number shown?`,
    ev: ({ m, which }) => { const s = sumQ(faces(m).map((k) => Q.of(k * (which === 'max' ? 2 * k - 1 : 2 * (m - k) + 1), m * m))); return s; },
    steps: ({ m, which }) => [
      { say: which === 'max' ? `P(max = k) = (k² − (k − 1)²)/${m * m} = (2k − 1)/${m * m}.` : `P(min = k) = (2(${m} − k) + 1)/${m * m}.`, why: which === 'max' ? 'P(max ≤ k) = (k/m)²; subtract consecutive values.' : 'P(min ≥ k) = ((m − k + 1)/m)²; subtract consecutive values.' },
      { say: `E = Σ k·P(k) over k = 1..${m}.`, why: 'Definition of expectation over the distribution just found.' },
    ],
    brute: ({ m, which }) => { let t = 0; for (const a of faces(m)) for (const b of faces(m)) t += which === 'max' ? Math.max(a, b) : Math.min(a, b); return t / (m * m); },
  },
  product: {
    level: 2,
    make: (rng) => ({ m: rng.pick([4, 6, 8, 10, 12]), n: rng.pick([2, 3]) }),
    text: ({ m, n }) => `${n === 2 ? 'Two' : 'Three'} fair ${m}-sided dice are thrown. What is the expected product of the numbers shown?`,
    ev: ({ m, n }) => { let q = Q.of(1); for (let i = 0; i < n; i++) q = q.mul(Q.of(m + 1, 2)); return q; },
    steps: ({ m, n }) => [{ say: `Independent dice: E[product] = E[die]^${n} = ${(m + 1) / 2}^${n}.`, why: 'For independent variables the mean of a product is the product of the means.' }],
    brute: ({ m, n }) => { let t = 0, c = 0; const rec = (i, p) => { if (i === n) { t += p; c++; return; } for (const f of faces(m)) rec(i + 1, p * f); }; rec(0, 1); return t / c; },
  },
  absDiff: {
    level: 2,
    make: (rng) => ({ m: rng.pick([4, 6, 8, 10, 12]) }),
    text: ({ m }) => `Two fair ${m}-sided dice are thrown. What is the expected absolute difference between them?`,
    ev: ({ m }) => Q.of((m * m - 1), 3 * m),
    steps: ({ m }) => [
      { say: `P(|diff| = d) = 2(${m} − d)/${m * m} for d ≥ 1.`, why: 'Difference d arises from m − d ordered pairs in each direction.' },
      { say: `E = Σ d·2(${m} − d)/${m * m} = (m² − 1)/(3m) = ${m * m - 1}/${3 * m}.`, why: 'The sum of d(m − d) over d = 1..m − 1 is m(m² − 1)/6.' },
    ],
    brute: ({ m }) => { let t = 0; for (const a of faces(m)) for (const b of faces(m)) t += Math.abs(a - b); return t / (m * m); },
  },
  reroll: {
    level: 3,
    make: (rng) => ({ m: rng.pick([4, 6, 8, 10, 12, 20]) }),
    text: ({ m }) => `You roll a fair ${m}-sided die and are paid the number shown. After seeing it you may reroll once and take the second number instead. With the best strategy, what is your expected payout?`,
    ev: ({ m }) => { const e = Q.of(m + 1, 2); return sumQ(faces(m).map((k) => (Q.of(k).cmp(e) > 0 ? Q.of(k) : e))).div(Q.of(m)); },
    steps: ({ m }) => {
      const e = (m + 1) / 2, keep = faces(m).filter((k) => k > e);
      return [
        { say: `A reroll is worth ${e} on average, so keep any first roll above ${e}: keep ${keep[0]}..${m}.`, why: 'Compare what you hold with the value of the alternative.' },
        { say: `E = (${keep.join(' + ')} + ${m - keep.length} × ${e}) / ${m}.`, why: 'Kept faces pay themselves; the others pay the reroll average.' },
      ];
    },
    brute: ({ m }) => { let best = 0; for (let t = 0; t <= m; t++) { let s = 0; for (const k of faces(m)) s += k > t ? k : (m + 1) / 2; best = Math.max(best, s / m); } return best; },
  },
  distinct: {
    level: 3,
    make: (rng) => ({ n: rng.int(2, 6) }),
    text: ({ n }) => `A fair six-sided die is rolled ${n} times. What is the expected number of different faces that appear?`,
    ev: ({ n }) => Q.of(6).mul(Q.of(1).sub(Q.of(5 ** n, 6 ** n))),
    steps: ({ n }) => [
      { say: `Each face appears at least once with probability 1 − (5/6)^${n}.`, why: 'Indicator per face: missing a given face has probability (5/6)^n.' },
      { say: `Sum over 6 faces: 6 × (1 − (5/6)^${n}).`, why: 'Linearity: expected count = sum of indicator probabilities.' },
    ],
    brute: ({ n }) => { let t = 0, c = 0; const xs = []; const rec = (i) => { if (i === n) { t += new Set(xs).size; c++; return; } for (let f = 1; f <= 6; f++) { xs[i] = f; rec(i + 1); } }; rec(0); return t / c; },
  },
};

const fam = {
  id: 'expected-dice',
  section: 'iv',
  title: 'Expected values with dice',
  skill: 'Linearity, indicators and max/min distributions give exact expectations quickly',
  levels: [1, 2, 3],
  generate(rng, { difficulty = 1 } = {}) {
    const keys = Object.keys(S).filter((k) => S[k].level === difficulty);
    const key = rng.pick(keys), sc = S[key], params = sc.make(rng);
    const ev = sc.ev(params), truth = ev.toNumber();
    return ivItem(fam, rng, difficulty, {
      text: sc.text(params), truth, unit: '', coach: { exact: true, belief: { kind: 'point' }, note: 'Exact expectation: compute it and give zero width (or a two-decimal bracket).' },
      exact: ev.toString(),
      steps: [...sc.steps(params), { say: `E = ${ev.toString()} = ${+truth.toFixed(4)}.`, why: 'Keep it as a fraction until the last step.' }],
      hints: ['Is this a sum of simpler pieces? Linearity of expectation.', 'For max or min, find P(max ≤ k) first.'],
      params: { scenario: key, ...params },
    });
  },
  verify(item) {
    const b = S[item.params.scenario].brute(item.params);
    return { ok: Math.abs(b - item.truth) < 1e-9, detail: `enumerated ${b}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Expected-value questions are the "weighted average" cousins of the probability questions: exact, so they reward zero width.',
    anchor: 'The average of one die, (1 + m)/2, extended with one idea at a time: linearity for sums, independence for products, P(max ≤ k) for maxima.',
    steps: [
      { say: 'Sums: add the means. Products of independent dice: multiply the means.', why: 'Linearity always; the product rule needs independence.' },
      { say: 'Max or min: get P(max ≤ k) = (k/m)^n, difference it, then average.', why: 'Maxima are "all at most k" events, which multiply.' },
      { say: 'Counts of things (distinct faces, matches): sum indicator probabilities.', why: 'Linearity works even when the indicators are dependent.' },
    ],
    predict: { question: 'Expected larger value of two six-sided dice?', answer: '161/36 ≈ 4.47: above 3.5 because the max favours high faces.' },
    rule: 'Exact E → fractions → zero width. Sums add, independent products multiply, maxima via P(max ≤ k).',
    contrast: 'E[max] is not max(E): two dice have E = 3.5 each but E[max] = 4.47.',
    edge: 'With the reroll option the threshold is the reroll value (m + 1)/2: keep strictly above it; a tie does not matter.',
  },
};
export default fam;
