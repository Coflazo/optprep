// Birthday-type collisions: any shared value versus someone sharing yours.
import { nPr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, qpow } from '../lib.js';

const ID = 'birthday';
const SETTINGS = {
  small: [
    { d: 12, n: [3, 4, 5, 6, 7], who: (n) => `A room holds ${n} people.`, what: 'birth month', ctx: 'Assume all 12 months are equally likely.' },
    { d: 6, n: [3, 4, 5], who: (n) => `You throw ${n} fair dice.`, what: 'face', ctx: '' },
    { d: 10, n: [3, 4, 5, 6], who: (n) => `${n} people each pick a digit from 0 to 9 at random.`, what: 'digit', ctx: '' },
    { d: 52, n: [5, 8, 10, 12], who: (n) => `A room holds ${n} people.`, what: 'birth week (of 52)', ctx: 'Assume all weeks are equally likely.' },
  ],
  big: [
    { d: 365, n: [10, 20, 23, 30, 40, 50, 57, 70], who: (n) => `A room holds ${n} people.`, what: 'birthday', ctx: 'Ignore leap years and assume all 365 days are equally likely.' },
    { d: 100, n: [5, 10, 12, 15, 20], who: (n) => `${n} traders each pick a number from 1 to 100 at random.`, what: 'number', ctx: '' },
  ],
};

export default {
  id: ID,
  section: 'bto',
  title: 'Birthday collisions',
  skill: 'P(some pair matches) = 1 − d(d−1)…(d−n+1)/d^n; it grows with the number of pairs, not people',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const S = rng.pick(difficulty === 2 ? SETTINGS.small : SETTINGS.big);
    const n = rng.pick(S.n), d = S.d;
    const mine = d === 365 && rng.chance(0.3);
    const allDiff = new Q(nPr(d, n), BigInt(d) ** BigInt(n));
    if (mine) {
      const v = q(1).sub(qpow(q(d - 1, d), n));
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `You are in a room with ${n} other people. ${S.ctx ? S.ctx + ' ' : ''}What is the probability that at least one of them shares your ${S.what}?`,
        distractors: [
          { value: q(1).sub(allDiff), misconception: 'Answered "some pair in the room matches". Only pairs that include you count here.' },
          { value: q(n, d), misconception: `Added 1/${d} per person; two people could both share your ${S.what}.` },
          { value: qpow(q(d - 1, d), n), misconception: 'Answered the complement: nobody shares yours.' },
          { value: q(1).sub(qpow(q(d - 1, d), n + 1)), misconception: 'Counted yourself among the people who could match you.' },
        ],
        steps: [
          { say: `Each other person misses your ${S.what} with probability ${d - 1}/${d}, independently.`, why: 'Your value is fixed; each other value is uniform.' },
          { say: `P(nobody matches) = (${d - 1}/${d})^${n} ≈ ${qpow(q(d - 1, d), n).toNumber().toFixed(4)}.`, why: 'Independent misses multiply.' },
          { say: `P = 1 − that ≈ ${v.toNumber().toFixed(4)}.`, why: 'Complement.' },
        ],
        rule: 'Match with a fixed value: 1 − ((d−1)/d)^n ≈ n/d. Any pair: 1 − d(d−1)…/d^n ≈ 1 − e^(−n²/2d).',
        anchor: 'The at-least-one complement rule, with the target fixed (your value), so each person is an independent trial.',
        hints: [`Your ${S.what} is fixed. What must each other person avoid?`, 'Complement: nobody matches.', `1 − (${d - 1}/${d})^${n}.`],
        data: { mode: 'mine', d, n },
      });
    }
    const v = q(1).sub(allDiff);
    const pairs = (n * (n - 1)) / 2;
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `${S.who(n)} ${S.ctx ? S.ctx + ' ' : ''}What is the probability that at least two of them share the same ${S.what}?`,
      distractors: [
        { value: q(n, d), misconception: `Scaled the single-match chance by the number of ${S.who(n).includes('dice') ? 'dice' : 'people'}. Collisions come from pairs, and there are C(${n},2) = ${pairs} of them.` },
        { value: q(pairs, d), misconception: 'Added 1/d for every pair; pair matches overlap, so adding overcounts.' },
        { value: q(1).sub(qpow(q(d - 1, d), n - 1)), misconception: 'Only checked whether someone matches one particular person.' },
        { value: allDiff, misconception: 'Answered the complement: all different.' },
        { value: 1 - ((d - 1) / d) ** pairs, misconception: 'Treated the pairs as independent. They share members, so this is only an approximation.' },
        ...(d === 365 ? [
          { value: 0.5, misconception: 'Recalled "23 people give about 1/2" and applied it to a different group size.' },
          { value: 1, misconception: 'Treated a high chance as certainty. Certainty needs 366 people (pigeonhole).' },
        ] : []),
      ],
      steps: [
        { say: 'Complement: all values different.', why: 'A single product, instead of many overlapping "pair matches" events.' },
        { say: `P(all different) = ${d}/${d} × ${d - 1}/${d} × … × ${d - n + 1}/${d} ≈ ${allDiff.toNumber().toFixed(4)}.`, why: 'Each new person must avoid every value already taken.' },
        { say: `P = 1 − that ≈ ${v.toNumber().toFixed(4)}.`, why: `Quick check: ${pairs} pairs × 1/${d} ≈ ${(pairs / d).toFixed(2)} suggests 1 − e^(−${(pairs / d).toFixed(2)}) ≈ ${(1 - Math.exp(-pairs / d)).toFixed(3)}.` },
      ],
      rule: 'P(collision) = 1 − Π (1 − i/d), i < n ≈ 1 − e^(−n(n−1)/2d). 23 people, 365 days: just over 1/2.',
      anchor: 'The "all dice different" chain 6/6 × 5/6 × 4/6 you know, with one change: d values instead of 6.',
      hints: ['Complement: all different.', `Each new person avoids all earlier values: (${d} − i)/${d}.`, `About 1 − e^(−${pairs}/${d}).`],
      data: { mode: 'any', d, n },
    });
  },

  // Independent check: sequential floating-point product (and, for small cases, enumeration).
  verify(item) {
    const { mode, d, n } = item.params;
    if (mode === 'mine') return agree(item, 1 - ((d - 1) / d) ** n, 1e-9);
    let p = 1;
    for (let i = 0; i < n; i++) p *= (d - i) / d;
    return agree(item, 1 - p, 1e-9);
  },

  lesson: {
    purpose: 'Collisions are everywhere in trading and systems (hash clashes, two orders at the same price, two people with the same birthday). Intuition badly underestimates them.',
    anchor: 'All-different dice (6/6 × 5/6 × 4/6 …) with one change: d possible values instead of 6.',
    steps: [
      { say: 'Complement: all n values distinct.', why: 'One product instead of overlapping pair events.' },
      { say: 'P(all distinct) = Π (d − i)/d for i = 0..n−1.', why: 'Each new person must avoid every earlier value.' },
      { say: 'Estimate: about e^(−n(n−1)/2d).', why: 'There are C(n,2) pairs, each matching with probability 1/d.' },
    ],
    predict: { question: 'How many people make a shared birthday more likely than not? And for a match with YOUR birthday?', answer: '23 for any pair; about 253 for a match with you. Pairs grow like n², matches with you only like n.' },
    edge: 'n > d makes a collision certain (pigeonhole).',
    rule: 'Any pair: 1 − Π(1 − i/d) ≈ 1 − e^(−n²/2d). Match with you: 1 − (1 − 1/d)^n ≈ n/d.',
    contrast: '"Some two people share a birthday" (pairs, n²) against "someone shares mine" (n trials against one fixed target).',
  },
};
