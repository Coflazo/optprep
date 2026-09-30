// Coupon collector: expected draws to see all n types, or k distinct faces of a die.
import { hittingTimes } from '../../../core/markov.js';
import { mcqItem, agree, q, harmonic } from '../lib.js';

const ID = 'coupon-collector';
const CTX = [
  { n: (x) => x, text: (n) => `A cereal brand hides one of ${n} different toys in each box, each equally likely. What is the expected number of boxes you must buy to collect all ${n} toys?`, unit: 'boxes' },
  { n: () => 6, text: () => 'You throw a fair die until every face 1 to 6 has appeared at least once. What is the expected number of throws?', unit: 'throws' },
  { n: () => 2, text: () => 'You flip a fair coin until you have seen both heads and tails. What is the expected number of flips?', unit: 'flips' },
  { n: () => 4, text: () => 'You draw cards with replacement from a shuffled deck until you have seen all four suits. What is the expected number of draws?', unit: 'draws' },
  { n: (x) => x, text: (n) => `A trading desk assigns each incoming order to one of ${n} traders uniformly at random. What is the expected number of orders until every trader has received at least one?`, unit: 'orders' },
];

export default {
  id: ID,
  section: 'bto',
  title: 'Coupon collector',
  skill: 'Split the wait into stages: with i types still missing, the next new one takes n/i draws on average',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const partial = difficulty === 3 && rng.chance(0.5);
    if (partial) {
      const s = rng.pick([6, 6, 8, 10, 12, 20]), k = rng.int(2, Math.min(s - 1, 6));
      let v = q(0);
      const parts = [];
      for (let i = 0; i < k; i++) { v = v.add(q(s, s - i)); parts.push(`${s}/${s - i}`); }
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        value: v,
        text: `You throw a fair ${s === 6 ? 'die' : `${s}-sided die`} until ${k} different faces have appeared. What is the expected number of throws?`,
        distractors: [
          { value: k, misconception: 'Assumed every throw shows a new face. Repeats become more likely as faces are used.' },
          { value: q(s).mul(harmonic(s)), misconception: `Computed the wait for all ${s} faces instead of ${k}.` },
          { value: q(s, s - k + 1), misconception: 'Only counted the last, slowest stage.' },
          { value: q(s).mul(harmonic(k)), misconception: `Used ${s}·H_${k}; the stage waits are ${s}/${s}, ${s}/${s - 1}, …, not ${s}/1, ${s}/2, ….` },
          { value: v.add(q(1)), misconception: 'Added an extra throw at the start.' },
        ],
        steps: [
          { say: `With i faces already seen, a new face appears with probability (${s} − i)/${s}.`, why: 'Any unseen face counts as new.' },
          { say: `Stage waits: ${parts.join(' + ')}.`, why: 'Each stage is a geometric wait with mean 1/p.' },
          { say: `Total = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Linearity of expectation over stages.' },
        ],
        rule: 'E[draws to see k of n types] = Σ_{i=0}^{k−1} n/(n − i).',
        anchor: 'The geometric wait 1/p, applied once per stage, with p shrinking as types are collected.',
        hints: ['When you have seen i faces, what is the chance the next throw is new?', 'Each stage is a geometric wait.', `Add ${parts.join(' + ')}.`],
        data: { s, k },
      });
    }
    const c = difficulty === 2 ? rng.pick(CTX.slice(1, 4)) : rng.pick([CTX[0], CTX[4], CTX[1]]);
    const n = c.n(rng.int(3, 10));
    const v = q(n).mul(harmonic(n));
    const parts = Array.from({ length: n }, (_, i) => `${n}/${n - i}`);
    return mcqItem(ID, rng, difficulty, {
      ev: true,
      value: v,
      text: c.text(n),
      distractors: [
        { value: n, misconception: `Assumed each ${c.unit.replace(/s$/, '')} brings a new type. Duplicates become common near the end.` },
        { value: n * n, misconception: 'Squared the number of types; the true growth is n·ln n.' },
        { value: (n * (n + 1)) / 2, misconception: 'Added 1 + 2 + … + n. The stage waits are n/n, n/(n−1), …, n/1, not 1, 2, …, n.' },
        { value: n * Math.log(n), misconception: 'Used the approximation n·ln n and dropped the +0.577n term; for small n that is a big miss.' },
        { value: q(n).mul(harmonic(n - 1)), misconception: 'Stopped one stage early (n·H_(n−1)), forgetting the slowest final stage.' },
      ],
      steps: [
        { say: `With i types collected, the next ${c.unit.replace(/s$/, '')} is new with probability (${n} − i)/${n}.`, why: 'Any missing type counts.' },
        { say: `Expected wait per stage = ${n}/(${n} − i): ${parts.join(' + ')}.`, why: 'Geometric waits.' },
        { say: `Total = ${n}·H_${n} = ${v} ≈ ${v.toNumber().toFixed(2)}.`, why: 'Linearity over stages; H_n = 1 + 1/2 + … + 1/n.' },
      ],
      rule: 'E[all n types] = n·H_n ≈ n(ln n + 0.577). Die: 14.7. Coin: 3. Four suits: 25/3.',
      anchor: 'The geometric wait 1/p, applied once per stage, with the one change that p falls as your collection grows.',
      hints: ['Break the wait into stages by how many types you have.', 'Stage i has success probability (n − i)/n.', `Sum ${parts.slice(0, 3).join(' + ')} + …`],
      data: { s: n, k: n },
    });
  },

  // Independent check: exact hitting time on the chain "number of types collected".
  verify(item) {
    const { s, k } = item.params;
    const P = Array.from({ length: k + 1 }, (_, i) => Array.from({ length: k + 1 }, (_, j) => {
      if (i === k) return q(j === k ? 1 : 0);
      if (j === i) return q(i, s);
      if (j === i + 1) return q(s - i, s);
      return q(0);
    }));
    return agree(item, hittingTimes(P, [k])[0]);
  },

  lesson: {
    purpose: 'Collecting every type (all faces, all suits, every trader hit) takes much longer than the number of types, and the size of that gap is exactly what a closest-value question tests.',
    anchor: 'The geometric wait 1/p you know, with one change: you wait several times in a row, and p drops each time because fewer types are still new.',
    steps: [
      { say: 'Stage i = time spent while you hold i types.', why: 'Within a stage the success chance is fixed.' },
      { say: 'Stage i ends when a new type appears: p = (n − i)/n, expected n/(n − i).', why: 'Geometric wait.' },
      { say: 'Add all stages: n(1/n + 1/(n−1) + … + 1/1) = n·H_n.', why: 'Linearity of expectation.' },
    ],
    predict: { question: 'All six die faces: closer to 10, 15 or 20 throws?', answer: '15: exactly 14.7. The last face alone takes 6 throws on average.' },
    edge: 'n = 1: one draw. n = 2 (coin): 1 + 2 = 3.',
    rule: 'n·H_n: 2 → 3, 4 → 8.33, 6 → 14.7, 10 → 29.3.',
    contrast: 'Waiting for one specific type (n draws) against waiting for all types (n·H_n): the last stage alone costs n.',
  },
};
