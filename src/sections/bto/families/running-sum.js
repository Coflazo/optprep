// Running totals: P(the running sum ever equals n) and the expected number of throws to pass n.
import { absorptionProbs, hittingTimes } from '../../../core/markov.js';
import { mcqItem, agree, q } from '../lib.js';

const ID = 'running-sum';

// p(n) = average of p(n - step) over the steps, p(0) = 1, p(negative) = 0.
function hitProb(n, steps) {
  const p = [q(1)];
  for (let m = 1; m <= n; m++) {
    let s = q(0);
    for (const st of steps) if (m - st >= 0) s = s.add(p[m - st]);
    p.push(s.div(q(steps.length)));
  }
  return p[n];
}
// E(n) = expected throws until total >= n: E(m) = 1 + average of E(m - step), E(<= 0) = 0.
function passTime(n, steps) {
  const E = [q(0)];
  for (let m = 1; m <= n; m++) {
    let s = q(0);
    for (const st of steps) if (m - st > 0) s = s.add(E[m - st]);
    E.push(q(1).add(s.div(q(steps.length))));
  }
  return E[n];
}

export default {
  id: ID,
  section: 'bto',
  title: 'Running totals',
  skill: 'Condition on the last step: p(n) = average of p(n − k); long-run hit chance = 1/(mean step)',
  levels: [3, 4],

  generate(rng, { difficulty = 3 } = {}) {
    const coin = rng.chance(0.3);
    const steps = coin ? [1, 2] : [1, 2, 3, 4, 5, 6];
    const mean = coin ? 1.5 : 3.5;
    const expect = difficulty === 4 && rng.chance(0.5);
    const setup = coin
      ? 'You flip a fair coin repeatedly, adding 1 point for heads and 2 points for tails.'
      : 'You throw a fair die repeatedly and keep a running total of the faces.';
    if (expect) {
      const n = coin ? rng.int(4, 12) : rng.int(5, 20);
      const v = passTime(n, steps);
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        minGap: (c) => Math.max(0.05, Math.abs(c) * 0.04),
        value: v,
        text: `${setup} What is the expected number of ${coin ? 'flips' : 'throws'} until the total is at least ${n}?`,
        distractors: [
          { value: n / mean, misconception: `Divided ${n} by the mean step ${mean}; that ignores the overshoot past ${n}.` },
          { value: Math.ceil(n / mean), misconception: 'Rounded n/(mean step) up; the overshoot is an average, not a whole extra step.' },
          { value: n / steps[steps.length - 1], misconception: 'Divided by the largest step, as if every step were maximal.' },
          { value: n, misconception: 'Assumed each step adds 1.' },
          { value: (n + 1) / mean + 1, misconception: 'Added a full extra step for the overshoot.' },
        ],
        steps: [
          { say: `Let E(m) = expected ${coin ? 'flips' : 'throws'} to reach at least m. E(m) = 0 for m ≤ 0.`, why: 'Already there.' },
          { say: `E(m) = 1 + (1/${steps.length}) Σ_k E(m − k).`, why: 'One step, then the remaining target is m − k.' },
          { say: `Build up to m = ${n}: E(${n}) = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: `Compare n/mean = ${(n / mean).toFixed(2)}: the difference is the average overshoot.` },
        ],
        rule: 'E(m) = 1 + average E(m − k). Large n: E ≈ (n + expected overshoot)/mean.',
        anchor: 'First-step analysis for waiting times, with one change: the state is the remaining distance to the target.',
        hints: ['Define E(m) for the remaining distance m.', 'Condition on the first step.', 'Fill the table from small m upwards.'],
        params: { mode: 'pass', n, steps },
      });
    }
    const n = difficulty === 3 ? rng.int(1, coin ? 6 : 8) : rng.int(coin ? 6 : 9, coin ? 15 : 30);
    const v = hitProb(n, steps);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `${setup} What is the probability that the running total is ever exactly ${n}?`,
      distractors: [
        { value: q(1, steps.length), misconception: `Only counted reaching ${n} in a single ${coin ? 'flip' : 'throw'}.` },
        { value: 1 / mean, misconception: `Used the long-run limit 1/${mean}${n < 8 ? '; for small totals the exact value differs' : ''}.` },
        { value: n <= steps.length ? q(n, steps.reduce((a, b) => a + b, 0)) : 0.5, misconception: n <= steps.length ? 'Divided the target by the sum of the faces.' : 'Treated hitting or skipping the total as a coin flip.' },
        { value: q(1).sub(v), misconception: 'Answered the probability of skipping over the total.' },
      ],
      steps: [
        { say: `p(0) = 1 and p(m) = (1/${steps.length}) × [p(m − 1) + … + p(m − ${steps[steps.length - 1]})], with p(negative) = 0.`, why: 'To land on m, the previous total must be m − k and the next step must be k.' },
        { say: `Iterate up to ${n}: p(${n}) = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Each value uses only smaller totals.' },
        { say: `For large totals p → 1/(mean step) = 1/${mean} ≈ ${(1 / mean).toFixed(4)}.`, why: 'In the long run the total lands on one integer per mean step.' },
      ],
      rule: 'p(n) = average of the previous p values; limit 1/(mean step) (dice: 2/7).',
      anchor: 'The recursion for "number of ways to climb stairs", with one change: each way is weighted by its probability.',
      hints: ['How can the total land exactly on n? What must it have been one step earlier?', 'p(n) averages p(n − 1), …, p(n − 6).', 'For large n the answer settles near 2/7 for a die.'],
      params: { mode: 'hit', n, steps },
    });
  },

  // Independent check: Markov chain on the running total; states above n are merged into "overshoot".
  verify(item) {
    const { mode, n, steps } = item.params;
    const S = n + 2; // states 0..n, n+1 = overshot (absorbing); for 'pass', n is "done"
    const P = Array.from({ length: S }, () => Array(S).fill(q(0)));
    for (let m = 0; m < S; m++) {
      if (m >= n) { P[m][m] = q(1); continue; }
      for (const st of steps) {
        const to = m + st === n ? n : m + st > n ? n + 1 : m + st;
        P[m][to] = P[m][to].add(q(1, steps.length));
      }
    }
    if (mode === 'hit') return agree(item, absorptionProbs(P, [n, n + 1], n)[0]);
    return agree(item, hittingTimes(P, [n, n + 1])[0]);
  },

  lesson: {
    purpose: 'Running-total questions ("does the total ever hit exactly 10?") are reported favourites because the answer barely depends on the target once it is moderately large.',
    anchor: 'Counting ways to climb stairs with steps 1..6, with one change: weight each way by its probability 1/6 per step.',
    steps: [
      { say: 'Condition on the last step: p(m) = (1/6)[p(m−1) + … + p(m−6)].', why: 'Landing on m means being at m − k and then stepping k.' },
      { say: 'Start with p(0) = 1, p(negative) = 0, and iterate.', why: 'Each value uses only smaller totals.' },
      { say: 'Limit: 1/(mean step) = 2/7 ≈ 0.286 for a die.', why: 'On average the total visits one integer every 3.5 units.' },
    ],
    predict: { question: 'Is P(total ever equals 6) above or below the limit 2/7?', answer: 'Above: (7/6)^5/6 ≈ 0.36. Small totals are reachable in many short ways.' },
    edge: 'p(1) = 1/6: only a first throw of 1 lands on 1.',
    rule: 'p(n) = average of the previous six; p(1..6) = (7/6)^(n−1)/6; p → 2/7.',
    contrast: 'P(ever exactly n) (skipping is possible) against P(ever at least n) (always 1).',
  },
};
