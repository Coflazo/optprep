// Birthday-type collisions ranked against each other: any pair versus "someone matches you".
import { nPr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { poolItem, verifyPool } from '../lib.js';
import { q, qpow } from '../../bto/lib.js';

const ID = 'collisions';
const anyPair = (n, d) => q(1).sub(new Q(nPr(d, n), BigInt(d) ** BigInt(n)));
const seqAny = (n, d) => { let p = 1; for (let i = 0; i < n; i++) p *= (d - i) / d; return 1 - p; };

export const POOL = {
  birthdayAny: { setup: ({ n }) => `a room of ${n}`, gen: (r) => ({ n: r.pick([10, 15, 20, 23, 30, 40, 50]) }), text: ({ n }) => `In a room of ${n} people, at least two share a birthday.`, p: ({ n }) => anyPair(n, 365), how: ({ n }) => `1 − 365·364·…/365^${n}; ${(n * (n - 1)) / 2} pairs.`, check: ({ n }) => seqAny(n, 365) },
  birthdayYou: { setup: ({ n }) => `you and ${n} others`, gen: (r) => ({ n: r.pick([20, 50, 100, 150, 250]) }), text: ({ n }) => `Among ${n} other people, at least one shares your birthday.`, p: ({ n }) => q(1).sub(qpow(q(364, 365), n)), how: ({ n }) => `1 − (364/365)^${n}: only ${n} chances, one per person.`, check: ({ n }) => 1 - Math.exp(n * Math.log1p(-1 / 365)) },
  month: { setup: ({ n }) => `${n} people's birth months`, gen: (r) => ({ n: r.int(3, 6) }), text: ({ n }) => `Among ${n} people, at least two were born in the same month (months equally likely).`, p: ({ n }) => anyPair(n, 12), how: ({ n }) => `1 − 12·11·…/12^${n}.`, check: ({ n }) => seqAny(n, 12) },
  diceRepeat: { setup: ({ n }) => `${n} dice`, gen: (r) => ({ n: r.int(2, 5) }), text: ({ n }) => `Some face repeats when ${n} dice are thrown.`, p: ({ n }) => anyPair(n, 6), how: ({ n }) => `1 − 6·5·…/6^${n}.`, check: ({ n }) => seqAny(n, 6) },
  pinClash: { setup: ({ n }) => `${n} random PINs`, gen: (r) => ({ n: r.pick([5, 10, 20, 40]) }), text: ({ n }) => `${n} people each pick a random 2-digit PIN (00-99); at least two pick the same one.`, p: ({ n }) => anyPair(n, 100), how: ({ n }) => `1 − 100·99·…/100^${n}.`, check: ({ n }) => seqAny(n, 100) },
  weekday: { setup: ({ n }) => `${n} people's birth weekdays`, gen: (r) => ({ n: r.int(2, 5) }), text: ({ n }) => `Among ${n} people, all were born on different days of the week.`, p: ({ n }) => new Q(nPr(7, n), 7n ** BigInt(n)), how: ({ n }) => `7·6·…/7^${n}.`, check: ({ n }) => 1 - seqAny(n, 7) },
};

export default {
  id: ID,
  section: 'll',
  title: 'Collision (birthday-type) statements',
  skill: 'Collisions grow with the number of pairs (n²/2), matches with one fixed person only with n',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const keys = difficulty === 2 ? ['month', 'diceRepeat', 'weekday', 'pinClash'] : ['birthdayAny', 'birthdayYou', 'pinClash', 'month', 'diceRepeat'];
    return poolItem(ID, rng, difficulty, POOL, {
      keys,
      text: (list) => `Assume every value is equally likely and choices are independent. The statements concern ${list}. Rank them from most to least likely.`,
      compare: 'Order the computed probabilities: pair counts drive collisions, so 23 people beat 1/2 for a shared birthday while you need about 253 others to match your own.',
      rule: 'P(some pair matches) ≈ 1 − e^(−n(n−1)/2d). P(someone matches a fixed value) = 1 − (1 − 1/d)^n ≈ n/d.',
      anchor: 'The "all dice different" chain, with d values instead of 6; "matches you" is the at-least-one complement instead.',
      hints: ['Is the statement about any pair, or about one fixed person?', 'Count pairs: n(n−1)/2, each matching with chance 1/d.', 'Use 1 − e^(−pairs/d) as a quick estimate.'],
    });
  },

  verify(item) { return verifyPool(item, POOL); },

  lesson: {
    purpose: 'Collision statements are ranked badly by intuition because people count people instead of pairs.',
    anchor: 'The "all different" chain for dice, with d possible values instead of 6.',
    steps: [
      { say: 'Any pair: 1 − Π(1 − i/d).', why: 'Each new person must avoid all earlier values.' },
      { say: 'Quick estimate: 1 − e^(−pairs/d) with pairs = n(n−1)/2.', why: 'Each pair collides with chance 1/d, and pairs are nearly independent.' },
      { say: 'Matching a fixed person: 1 − (1 − 1/d)^n.', why: 'Only n chances, not n²/2.' },
    ],
    predict: { question: '23 people share a birthday, or 100 others include your birthday: which is likelier?', answer: 'The 23-person collision: 0.507 against 0.24.' },
    edge: 'n > d makes a collision certain (pigeonhole).',
    rule: 'Pairs, not people: n²/2d. Fixed target: n/d.',
    contrast: '"Some two share" (pairs) against "someone shares mine" (one target).',
  },
};
