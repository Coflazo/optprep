// "At least one" events: sixes, de Mere's double sixes, independent trades, lottery tickets.
import { nCr } from '../../../core/combinatorics.js';
import { mcqItem, agree, qpow, q } from '../lib.js';
import { Q, sumQ } from '../../../core/rational.js';

const ID = 'at-least-one';
const FRACS = [[1, 2], [1, 3], [1, 4], [2, 5], [1, 5], [3, 10], [1, 6], [3, 5]];

function repeated(p, n, what, text) {
  const miss = q(1).sub(p);
  const none = qpow(miss, n);
  const value = q(1).sub(none);
  const exactlyOne = p.mul(qpow(miss, n - 1)).mul(q(n));
  return {
    value, text,
    distractors: [
      { value: p.mul(q(n)), misconception: `Added ${p} once per trial. The events "${what} on trial i" overlap, so their probabilities cannot be added.` },
      { value: none, misconception: `Answered the complement: this is P(no ${what} at all).` },
      { value: qpow(p, n), misconception: `Computed P(${what} on every trial) instead of on at least one.` },
      { value: q(1).sub(qpow(miss, n - 1)), misconception: 'Off by one: used n − 1 trials in the complement.' },
      { value: exactlyOne, misconception: `Computed exactly one ${what}. "At least one" also counts two or more.` },
    ],
    steps: [
      { say: `Complement: P(at least one ${what}) = 1 − P(no ${what} in ${n} trials).`, why: '"At least one" splits into many overlapping cases; "none" is a single product.' },
      { say: `P(none) = (${miss})^${n} ≈ ${none.toNumber().toFixed(4)}.`, why: 'Trials are independent, so the "miss" probabilities multiply.' },
      { say: `P = 1 − (${miss})^${n} ≈ ${value.toNumber().toFixed(4)}.`, why: 'Complement rule.' },
    ],
    hints: ['What is the opposite of "at least one"?', `P(no ${what}) is one probability raised to the ${n}th power.`, `1 − (${miss})^${n}.`],
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'At least one: the complement trick',
  skill: 'Turn "at least one" into 1 − P(none); never add overlapping chances',
  levels: [1, 2, 3],

  generate(rng, { difficulty = 1 } = {}) {
    let b, data;
    const variant = difficulty === 1 ? 'six' : difficulty === 2 ? rng.pick(['six', 'trades']) : rng.pick(['demere', 'lottery']);
    if (variant === 'six') {
      const n = difficulty === 1 ? rng.int(2, 4) : rng.int(4, 8);
      b = repeated(q(1, 6), n, 'six', `You throw a fair die ${n} times. What is the probability of at least one six?`);
      data = { variant, ps: Array(n).fill([1, 6]) };
    } else if (variant === 'demere') {
      const n = rng.pick([12, 18, 24, 25, 30]);
      b = repeated(q(1, 36), n, 'double six', `You throw a pair of dice ${n} times. What is the probability of at least one double six?`);
      b.distractors.push({ value: q(1).sub(qpow(q(5, 6), n)), misconception: 'Used 5/6 as the chance of "no double six" on a throw. That is the chance one die is not a six; a double six has chance 1/36.' });
      data = { variant, ps: Array(n).fill([1, 36]) };
    } else if (variant === 'lottery') {
      const n = rng.pick([10, 20, 50, 100]);
      b = repeated(q(1, n), n, 'winning ticket', `You buy ${n} tickets in ${n} independent draws, each ticket winning with probability 1/${n}. What is the probability that at least one ticket wins?`);
      b.distractors.push({ value: 0.5, misconception: 'Reasoned "on average one win, so 50%". An average of one win still leaves a large chance (about 1/e) of none.' });
      b.steps.push({ say: `For large n, (1 − 1/n)^n ≈ 1/e ≈ 0.368, so the answer is close to 1 − 1/e ≈ 0.632.`, why: 'This limit is worth memorising: n tries at a 1-in-n chance give about a 63% chance of at least one success.' });
      data = { variant, ps: Array(n).fill([1, n]) };
    } else {
      const k = 3;
      const ps = rng.shuffle(FRACS).slice(0, k);
      const P = ps.map(([a, c]) => q(a, c));
      const none = P.reduce((acc, p) => acc.mul(q(1).sub(p)), q(1));
      const all = P.reduce((acc, p) => acc.mul(p), q(1));
      const value = q(1).sub(none);
      const list = ps.map(([a, c]) => `${a}/${c}`).join(', ');
      b = {
        value,
        text: `Three independent trades succeed with probabilities ${list}. What is the probability that at least one succeeds?`,
        distractors: [
          { value: sumQ(P), misconception: 'Added the three probabilities. Successes can happen together, so adding double counts the overlaps.' },
          { value: all, misconception: 'Computed P(all three succeed).' },
          { value: none, misconception: 'Answered the complement: P(no trade succeeds).' },
          { value: q(1).sub(all), misconception: 'Computed P(not all succeed): the complement of "all", not of "none".' },
          { value: P.reduce((m, p) => (p.cmp(m) > 0 ? p : m)), misconception: 'Took the largest single probability, ignoring the other chances to succeed.' },
        ],
        steps: [
          { say: 'Complement: P(at least one) = 1 − P(all three fail).', why: 'Only one outcome fails the event: every trade failing.' },
          { say: `P(all fail) = ${P.map((p) => `(1 − ${p})`).join(' × ')} = ${none}.`, why: 'Independent failures multiply.' },
          { say: `P = 1 − ${none} = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Complement rule.' },
        ],
        hints: ['Which single outcome makes "at least one succeeds" false?', 'Multiply the three failure probabilities.', `1 − ${none}.`],
      };
      data = { variant, ps };
    }
    return mcqItem(ID, rng, difficulty, {
      ...b,
      rule: 'At least one = 1 − P(none) = 1 − Π(1 − p_i). Never add overlapping probabilities.',
      anchor: 'The complement rule P(A) = 1 − P(not A), applied where "not A" is one clean product.',
      data,
    });
  },

  // Independent check: sum P(exactly k successes) for k >= 1 (binomial sum), or enumerate 2^3 outcomes.
  verify(item) {
    const ps = item.params.ps.map(([a, c]) => q(a, c));
    if (item.params.variant === 'trades') {
      let tot = q(0);
      for (let m = 1; m < 8; m++) {
        let pr = q(1);
        ps.forEach((p, i) => { pr = pr.mul((m >> i) & 1 ? p : q(1).sub(p)); });
        tot = tot.add(pr);
      }
      return agree(item, tot);
    }
    // Binomial sum over k >= 1 successes, accumulated as one BigInt numerator over c^n.
    const [a, c] = item.params.ps[0], n = ps.length;
    let num = 0n;
    for (let k = 1; k <= n; k++) num += nCr(n, k) * BigInt(a) ** BigInt(k) * BigInt(c - a) ** BigInt(n - k);
    return agree(item, new Q(num, BigInt(c) ** BigInt(n)));
  },

  lesson: {
    purpose: '"At least one" appears in half of all quick probability questions. Adding the chances is the classic mistake; the complement makes it one multiplication.',
    anchor: 'You know P(not A) = 1 − P(A). "At least one success" is that rule with one change: "not A" is "every trial fails", which is a product.',
    steps: [
      { say: 'Name the complement: "no success at all".', why: 'It is a single outcome pattern, while "at least one" is a union of overlapping events.' },
      { say: 'Multiply the failure probabilities: Π(1 − p_i).', why: 'Independence turns "all fail" into a product.' },
      { say: 'Subtract from 1.', why: 'The event and its complement cover everything.' },
    ],
    predict: { question: 'Four throws of a die: is P(at least one six) above or below 1/2? What does adding 4 × 1/6 = 0.667 get wrong?', answer: 'Above: 1 − (5/6)^4 ≈ 0.518. Adding counts outcomes with two or more sixes several times, so it overshoots.' },
    edge: 'With 6 throws, adding gives 6/6 = 1, which is clearly wrong (you can miss every time); the truth is 1 − (5/6)^6 ≈ 0.665.',
    rule: 'At least one = 1 − Π(1 − p_i). n tries at 1/n → about 1 − 1/e ≈ 0.63.',
    contrast: 'Adding is right only for disjoint events ("sum is 2" or "sum is 3"). Multiplying is right for "all of them". "At least one" needs the complement.',
  },
};
