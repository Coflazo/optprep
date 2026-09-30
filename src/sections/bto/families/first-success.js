// Geometric distribution: first six on throw k, more than k throws, first success on an even throw.
import { mcqItem, agree, qpow, q } from '../lib.js';

const ID = 'first-success';
const COINS = [[1, 3], [2, 5], [3, 4], [1, 4], [3, 5]];
const ord = (k) => `${k}${k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th'}`;

export default {
  id: ID,
  section: 'bto',
  title: 'Waiting for the first success',
  skill: 'Write the path: k − 1 misses then a hit; sum a geometric series for "odd/even" races',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const variant = difficulty === 1 ? rng.pick(['onK', 'moreThanK']) : rng.pick(['coinOnK', 'evenThrow', 'duel']);
    let o;
    if (variant === 'onK' || variant === 'coinOnK' || variant === 'moreThanK') {
      const [a, c] = variant === 'coinOnK' ? rng.pick(COINS) : [1, 6];
      const p = q(a, c), m = q(1).sub(p);
      const k = variant === 'coinOnK' ? rng.int(2, 5) : rng.int(2, 6);
      const what = variant === 'coinOnK' ? 'head' : 'six';
      const setup = variant === 'coinOnK' ? `A biased coin lands heads with probability ${p}. You flip it repeatedly.` : 'You throw a fair die repeatedly.';
      if (variant === 'moreThanK') {
        const value = qpow(m, k);
        o = {
          value,
          text: `${setup} What is the probability that you need more than ${k} throws to see the first six?`,
          distractors: [
            { value: qpow(m, k - 1), misconception: `Off by one: "more than ${k} throws" means the first ${k} throws all miss, not ${k - 1}.` },
            { value: q(1).sub(value), misconception: `Answered the complement: P(a six within the first ${k} throws).` },
            { value: q(1).sub(q(k, 6)), misconception: `Subtracted 1/6 per throw as if "six on throw i" were disjoint events.` },
            { value: p.mul(value), misconception: `Computed P(first six exactly on throw ${k + 1}); the question allows any later throw.` },
          ],
          steps: [
            { say: `"More than ${k} throws needed" is the same event as "no six in the first ${k} throws".`, why: 'Translate the waiting-time event into a statement about a fixed block of throws.' },
            { say: `P = (5/6)^${k} = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Independent misses multiply.' },
          ],
          hints: [`What must happen on the first ${k} throws?`, `All ${k} throws miss.`, `(5/6)^${k}.`],
          data: { variant, a, c, k },
        };
      } else {
        const value = qpow(m, k - 1).mul(p);
        o = {
          value,
          text: `${setup} What is the probability that the first ${what} appears on the ${ord(k)} ${variant === 'coinOnK' ? 'flip' : 'throw'}?`,
          distractors: [
            { value: p, misconception: `Used P(${what}) on that one trial and ignored that the ${k - 1} earlier trials must all miss.` },
            { value: qpow(m, k - 1), misconception: `Forgot the final factor ${p} for the ${what} itself on trial ${k}.` },
            { value: qpow(m, k).mul(p), misconception: `Off by one: used ${k} misses before the ${what} instead of ${k - 1}.` },
            { value: q(1).sub(qpow(m, k)), misconception: `Computed P(a ${what} somewhere in the first ${k} trials), not P(first one exactly on trial ${k}).` },
            { value: qpow(p, k), misconception: `Multiplied the success probability ${k} times, as if every trial had to succeed.` },
          ],
          steps: [
            { say: `The only path: miss on trials 1..${k - 1}, then ${what} on trial ${k}.`, why: '"First" means nothing earlier succeeded, so the earlier trials are forced misses.' },
            { say: `P = (${m})^${k - 1} × ${p} = ${value} ≈ ${value.toNumber().toFixed(4)}.`, why: 'Independent trials multiply along the single path.' },
          ],
          hints: [`What must the first ${k - 1} trials show?`, `${k - 1} misses, then one success.`, `(${m})^${k - 1} × ${p}.`],
          data: { variant, a, c, k },
        };
      }
    } else {
      // First six on an even-numbered throw, or the starter of an alternating duel wins.
      const value = variant === 'evenThrow' ? q(5, 11) : q(6, 11);
      const text = variant === 'evenThrow'
        ? 'You throw a fair die until the first six. What is the probability that the first six appears on an even-numbered throw?'
        : 'Ann and Bob take turns throwing a fair die, Ann first. The first to throw a six wins. What is the probability that Ann wins?';
      o = {
        value, text,
        distractors: [
          { value: 0.5, misconception: 'Assumed odd and even throws are symmetric. Throw 1 is odd, so the odd side gets the first chance and wins more often.' },
          { value: q(1).sub(value), misconception: variant === 'evenThrow' ? 'Computed the odd-throw probability.' : 'Computed Bob\'s probability.' },
          { value: variant === 'evenThrow' ? q(5, 36) : q(1, 6), misconception: 'Only counted the first round and ignored that the game continues after two misses.' },
          { value: q(1, 6), misconception: 'Used the chance of a six on a single throw.' },
          { value: q(11, 36), misconception: 'Computed P(a six appears somewhere in the first round of two throws), which says nothing about which throw it was on.' },
        ],
        steps: [
          { say: 'Group the throws into rounds of two (odd, even).', why: 'Every round looks the same: it ends with a six on the odd throw, a six on the even throw, or two misses and a fresh round.' },
          { say: 'Per round: P(odd throw is the six) = 1/6, P(even throw is the six) = 5/6 × 1/6 = 5/36.', why: 'The even throw only counts if the odd throw missed.' },
          { say: 'Rounds that end in two misses restart the same situation, so only the ratio 1/6 : 5/36 = 6 : 5 matters.', why: 'Conditioning on the round deciding the game removes the repeats.' },
          { say: `P = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: variant === 'evenThrow' ? 'Even share = 5/(6 + 5).' : 'Ann has the odd throws: 6/(6 + 5).' },
        ],
        hints: ['Does the game look the same after two misses?', 'Compare 1/6 (odd throw wins) with 5/36 (even throw wins) inside one round.', 'Ratio 6 : 5.'],
        data: { variant },
      };
    }
    return mcqItem(ID, rng, difficulty, {
      ...o,
      rule: 'First success on trial k: (1 − p)^(k−1) p. More than k trials: (1 − p)^k. Alternating race: first mover wins with 1/(2 − p).',
      anchor: 'A single trial succeeds with p. Waiting for the first success = the same trial repeated, with the one change that every earlier trial must fail.',
    });
  },

  // Independent check: sum the series of path probabilities term by term.
  verify(item) {
    const d = item.params;
    if (d.variant === 'evenThrow' || d.variant === 'duel') {
      const p = 1 / 6;
      let even = 0;
      for (let k = 2; k < 800; k += 2) even += (1 - p) ** (k - 1) * p;
      return agree(item, d.variant === 'evenThrow' ? even : 1 - even, 1e-9);
    }
    const p = d.a / d.c;
    // P(first success on k) = P(T > k-1) - P(T > k); P(T > k) = 1 - sum_{j<=k} (1-p)^(j-1) p.
    const tail = (k) => { let s = 0; for (let j = 1; j <= k; j++) s += (1 - p) ** (j - 1) * p; return 1 - s; };
    const v = d.variant === 'moreThanK' ? tail(d.k) : tail(d.k - 1) - tail(d.k);
    return agree(item, v, 1e-9);
  },

  lesson: {
    purpose: 'Waiting-time questions ("the first six on throw 4", "who throws the first six") reduce to one forced path, so they are fast once the path is written down.',
    anchor: 'One trial: P(success) = p. Waiting for the first success is the same trial repeated, with one change: every trial before the success must be a failure.',
    steps: [
      { say: 'Write the path: F F … F S (k − 1 failures, then success).', why: '"First" forbids any earlier success.' },
      { say: 'Multiply along the path: (1 − p)^(k−1) p.', why: 'Independent trials multiply.' },
      { say: '"More than k trials" = the first k are all failures: (1 − p)^k.', why: 'It says nothing about what happens after trial k.' },
      { say: 'For turn-taking races, compare the two chances inside one round and ignore rounds with no winner.', why: 'A round with two misses returns the game to the same state.' },
    ],
    predict: { question: 'Is the first six more likely on throw 1 or on throw 2?', answer: 'Throw 1: 1/6 against 5/36. Each later throw is less likely to be the first six because it needs the earlier misses.' },
    edge: 'With p = 1, the first success is always on trial 1: (1 − p)^(k−1) p is 1 for k = 1 and 0 afterwards.',
    rule: 'P(first success on k) = (1−p)^(k−1) p; P(T > k) = (1−p)^k; starter of an alternating race wins with 1/(2 − p).',
    contrast: '"First six on throw k" (exact position) against "a six within k throws" (at least one): the second is 1 − (5/6)^k and is much larger.',
  },
};
