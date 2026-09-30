// Law of large numbers comparisons: the same proportion is far less likely to be extreme in a big sample.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { poolItem, verifyPool } from '../lib.js';

const ID = 'large-numbers';
const NS = [10, 20, 50, 100];
const exactRange = (n, lo, hi) => { let s = 0n; for (let k = Math.max(0, lo); k <= Math.min(n, hi); k++) s += nCr(n, k); return new Q(s, 2n ** BigInt(n)); };
const dpRange = (n, lo, hi) => { let d = [1]; for (let i = 0; i < n; i++) { const nx = Array(d.length + 1).fill(0); d.forEach((v, j) => { nx[j] += v / 2; nx[j + 1] += v / 2; }); d = nx; } let s = 0; for (let k = Math.max(0, lo); k <= Math.min(n, hi); k++) s += d[k]; return s; };

export const POOL = {
  atLeast: {
    setup: ({ n }) => `${n} coin flips`,
    gen: (r) => ({ n: r.pick(NS), f: r.pick([0.6, 0.7]) }),
    text: ({ n, f }) => `At least ${Math.round(f * 100)}% heads in ${n} flips of a fair coin.`,
    p: ({ n, f }) => exactRange(n, Math.ceil(f * n - 1e-9), n),
    how: ({ n, f }) => `P(at least ${Math.ceil(f * n - 1e-9)} heads of ${n}); the sd of the head proportion is 0.5/√${n} ≈ ${(0.5 / Math.sqrt(n)).toFixed(3)}.`,
    check: ({ n, f }) => dpRange(n, Math.ceil(f * n - 1e-9), n),
  },
  exactHalf: {
    setup: ({ n }) => `${n} coin flips`,
    gen: (r) => ({ n: r.pick(NS) }),
    text: ({ n }) => `Exactly 50% heads in ${n} flips of a fair coin.`,
    p: ({ n }) => exactRange(n, n / 2, n / 2),
    how: ({ n }) => `C(${n},${n / 2})/2^${n} ≈ ${(Math.sqrt(2 / (Math.PI * n))).toFixed(3)}: exact balance gets rarer as n grows.`,
    check: ({ n }) => dpRange(n, n / 2, n / 2),
  },
  within: {
    setup: ({ n }) => `${n} coin flips`,
    gen: (r) => ({ n: r.pick(NS), w: r.pick([0.1, 0.05]) }),
    text: ({ n, w }) => `Between ${Math.round((0.5 - w) * 100)}% and ${Math.round((0.5 + w) * 100)}% heads (inclusive) in ${n} flips of a fair coin.`,
    p: ({ n, w }) => exactRange(n, Math.ceil((0.5 - w) * n - 1e-9), Math.floor((0.5 + w) * n + 1e-9)),
    how: ({ n, w }) => `Sum the binomial probabilities from ${Math.ceil((0.5 - w) * n - 1e-9)} to ${Math.floor((0.5 + w) * n + 1e-9)} heads; bigger samples concentrate near 50%.`,
    check: ({ n, w }) => dpRange(n, Math.ceil((0.5 - w) * n - 1e-9), Math.floor((0.5 + w) * n + 1e-9)),
  },
  hospital: {
    setup: ({ n }) => `a hospital with ${n} births a day`,
    gen: (r) => ({ n: r.pick([10, 15, 20, 45, 60]) }),
    text: ({ n }) => `On a given day, a hospital with ${n} births records more than 60% boys (boys and girls equally likely).`,
    p: ({ n }) => exactRange(n, Math.floor(0.6 * n + 1e-9) + 1, n),
    how: ({ n }) => `P(more than ${Math.floor(0.6 * n + 1e-9)} boys of ${n}); small hospitals see extreme days far more often.`,
    check: ({ n }) => dpRange(n, Math.floor(0.6 * n + 1e-9) + 1, n),
  },
};

export default {
  id: ID,
  section: 'll',
  title: 'Small samples versus large samples',
  skill: 'Proportions in small samples swing widely; in large samples they concentrate near the true rate (sd = 0.5/√n)',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const keys = difficulty === 2 ? ['atLeast', 'exactHalf', 'within'] : difficulty === 3 ? ['atLeast', 'within', 'hospital', 'exactHalf'] : ['atLeast', 'hospital', 'within', 'exactHalf', 'atLeast'];
    return poolItem(ID, rng, difficulty, POOL, {
      keys: [...new Set(keys)],
      text: (list) => `The statements concern ${list}. Rank them from most to least likely.`,
      compare: 'Order the binomial probabilities. Rule of thumb: the proportion of heads has sd 0.5/√n, so extremes fade and bands around 50% fill up as n grows.',
      rule: 'Head proportion: mean 1/2, sd 0.5/√n. P(exactly half) ≈ √(2/(πn)). Extreme proportions are a small-sample phenomenon.',
      anchor: 'The binomial count of heads, with one change: compare proportions across different sample sizes by dividing the sd by √n.',
      hints: ['How does the spread of the head proportion depend on n?', 'Small n: extremes are common. Large n: bands around 50% are nearly certain.', 'Exactly 50% gets rarer as n grows, even though "close to 50%" gets likelier.'],
    });
  },

  verify(item) { return verifyPool(item, POOL); },

  lesson: {
    purpose: 'The hospital problem (Kahneman and Tversky) shows that people ignore sample size. Ranking statements about proportions in different sample sizes tests exactly this.',
    anchor: 'The binomial count, with one change: to compare samples of different sizes, look at proportions, whose spread shrinks like 1/√n.',
    steps: [
      { say: 'Proportion of heads: mean 0.5, sd 0.5/√n (0.16 for 10 flips, 0.05 for 100).', why: 'The count has sd √n/2; divide by n.' },
      { say: 'An extreme proportion (≥ 60%) is 0.6 sd away for n = 10 but 2 sd away for n = 100.', why: 'Same distance, much smaller sd.' },
      { say: 'Exactly 50% gets rarer as n grows (≈ √(2/(πn))), while "within ±10%" gets likelier.', why: 'Many nearby outcomes share the probability.' },
    ],
    predict: { question: 'Which hospital has more days with over 60% boys: 15 births a day or 45?', answer: 'The smaller one: about 15% of days against about 7%.' },
    edge: 'n = 1: every day is 0% or 100% boys, maximally extreme.',
    rule: 'sd(proportion) = 0.5/√n. Small samples: extremes. Large samples: concentration.',
    contrast: '"Exactly 50%" (falls with n) against "between 40% and 60%" (rises with n).',
  },
};
