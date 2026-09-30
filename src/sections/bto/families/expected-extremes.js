// Expected maximum and minimum: dice (tail-sum formula) and uniforms (order statistics).
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q } from '../lib.js';

const ID = 'expected-extremes';
const words = ['', 'one', 'two', 'three', 'four', 'five'];

export default {
  id: ID,
  section: 'bto',
  title: 'Expected maximum and minimum',
  skill: 'E[max] = Σ P(max ≥ k); for n uniforms E[max] = n/(n+1), E[min] = 1/(n+1)',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const uniform = difficulty === 4 || (difficulty === 3 && rng.chance(0.4));
    const minOf = rng.chance(0.4);
    if (!uniform) {
      const n = difficulty === 2 ? 2 : rng.int(3, 4);
      const s = rng.pick(difficulty === 2 ? [6, 6, 4, 8] : [6, 6, 4, 8, 10]);
      let E = q(0);
      for (let k = 1; k <= s; k++) {
        // P(max >= k) = 1 - ((k-1)/s)^n ; P(min >= k) = ((s-k+1)/s)^n
        const t = minOf ? new Q(BigInt(s - k + 1) ** BigInt(n), BigInt(s) ** BigInt(n)) : q(1).sub(new Q(BigInt(k - 1) ** BigInt(n), BigInt(s) ** BigInt(n)));
        E = E.add(t);
      }
      const avg = q(s + 1, 2);
      const cont = minOf ? q(s, n + 1) : q(s * n, n + 1);
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        minGap: (c) => Math.max(0.05, Math.abs(c) * 0.02),
        value: E,
        text: `You roll ${words[n]} fair ${s === 6 ? 'dice' : `${s}-sided dice`}. What is the expected value of the ${minOf ? 'lowest' : 'highest'} face?`,
        distractors: [
          { value: avg, misconception: 'Used the average of one die; the extreme of several dice is pulled away from the middle.' },
          { value: cont, misconception: `Used the continuous formula ${minOf ? 's/(n+1)' : 's·n/(n+1)'} on [0, ${s}]. Dice start at 1, and the faces are discrete.` },
          { value: q(s + 1).sub(E), misconception: `Swapped maximum and minimum (E[min] + E[max] = ${s + 1} for symmetric dice).` },
          { value: minOf ? q(1) : q(s), misconception: minOf ? 'Assumed the lowest face is usually 1.' : `Assumed the highest face is usually ${s}.` },
          { value: minOf ? avg.sub(q(1)) : avg.add(q(1)), misconception: 'Shifted the one-die average by a whole face as a rough guess.' },
        ],
        steps: [
          { say: `E[${minOf ? 'min' : 'max'}] = Σ_{k=1}^{${s}} P(${minOf ? 'min' : 'max'} ≥ k).`, why: 'Tail-sum formula for non-negative integers: X = Σ_k [X ≥ k].' },
          { say: minOf ? `P(min ≥ k) = ((${s} − k + 1)/${s})^${n}.` : `P(max ≥ k) = 1 − ((k − 1)/${s})^${n}.`, why: minOf ? 'Every die must be at least k.' : 'Complement of "every die below k".' },
          { say: `Sum = ${E} ≈ ${E.toNumber().toFixed(3)}.`, why: 'Add the terms.' },
        ],
        rule: 'E[max] = Σ (1 − ((k−1)/s)^n); E[min] = Σ ((s−k+1)/s)^n. Two d6: max 161/36 ≈ 4.47, min 91/36 ≈ 2.53.',
        anchor: 'P(max ≤ k) = (k/s)^n from the order-statistics questions, with one change: sum the tail probabilities to get an expectation.',
        hints: ['Write E[X] as Σ P(X ≥ k).', minOf ? 'Every die must be at least k.' : 'Use the complement: every die below k.', `Add ${s} terms.`],
        data: { mode: 'dice', n, s, minOf },
      });
    }
    const n = rng.int(2, 5);
    const which = rng.pick(['max', 'min', 'range', 'gap']);
    const v = which === 'max' ? q(n, n + 1) : which === 'min' ? q(1, n + 1) : which === 'range' ? q(n - 1, n + 1) : q(1, 3);
    const nn = which === 'gap' ? 2 : n;
    const text = which === 'gap'
      ? 'Two points are chosen independently and uniformly on [0, 1]. What is the expected distance between them?'
      : `${words[n][0].toUpperCase() + words[n].slice(1)} numbers are drawn independently and uniformly from [0, 1]. What is the expected value of the ${which === 'max' ? 'largest' : which === 'min' ? 'smallest' : 'difference between the largest and the smallest'}?`;
    return mcqItem(ID, rng, difficulty, {
      ev: true,
      value: v, text,
      distractors: [
        { value: 0.5, misconception: 'Used the mean of a single uniform.' },
        { value: which === 'min' ? q(1, n) : which === 'max' ? q(n - 1, n) : q(1, 2).mul(q(nn - 1, nn)), misconception: 'Divided by n instead of n + 1: n points cut [0, 1] into n + 1 gaps, not n.' },
        { value: which === 'max' ? q(1, n + 1) : which === 'min' ? q(n, n + 1) : q(2, nn + 1), misconception: which === 'max' || which === 'min' ? 'Swapped the largest and the smallest.' : 'Took two gaps instead of the span of all interior gaps.' },
        { value: which === 'gap' ? q(1, 2) : q(1).sub(q(1, 2 ** n)), misconception: which === 'gap' ? 'Took the distance as uniform on [0, 1]; short distances are more likely.' : 'Used 1 − (1/2)^n, a probability, as an expectation.' },
        { value: which === 'gap' ? q(1, 4) : q(1, n + 2), misconception: which === 'gap' ? 'Used E[min] of two uniforms (1/3) halved; the distance is |X − Y|.' : 'Divided by n + 2 instead of n + 1.' },
      ],
      steps: [
        { say: `${nn} independent uniform points cut [0, 1] into ${nn + 1} gaps.`, why: 'Order the points; the gaps before, between and after them.' },
        { say: `By symmetry every gap has the same expected length 1/${nn + 1}.`, why: 'Adding one extra point and joining the ends into a circle makes all gaps exchangeable.' },
        { say: which === 'max' ? `E[max] = 1 − (last gap) = ${n}/${n + 1}.` : which === 'min' ? `E[min] = first gap = 1/${n + 1}.` : which === 'range' ? `E[max − min] = ${n - 1} middle gaps = ${n - 1}/${n + 1}.` : 'E|X − Y| = the middle gap = 1/3.', why: 'Count which gaps make up the quantity.' },
      ],
      rule: 'n uniforms on [0,1]: E[k-th smallest] = k/(n+1); E[max] = n/(n+1); E|X − Y| = 1/3.',
      anchor: 'The mean of one uniform, 1/2 = the middle of 2 gaps, with one change: n points make n + 1 equal gaps on average.',
      hints: ['How many gaps do n points create in [0, 1]?', 'Each gap has the same expected length.', 'Count the gaps that make up the answer.'],
      data: { mode: 'uniform', which, n: nn },
    });
  },

  // Independent check: dice by full enumeration; uniforms by numerical integration of the order-statistic density.
  verify(item) {
    const d = item.params;
    if (d.mode === 'dice') {
      const { n, s, minOf } = d;
      let tot = 0, cnt = 0;
      const rec = (i, m) => {
        if (i === n) { tot += m; cnt++; return; }
        for (let x = 1; x <= s; x++) rec(i + 1, minOf ? Math.min(m, x) : Math.max(m, x));
      };
      rec(0, minOf ? Infinity : -Infinity);
      return agree(item, tot / cnt);
    }
    // Simpson integration of x times the density of the relevant statistic on [0, 1].
    const { which, n } = d;
    const f = which === 'max' ? (x) => x * n * x ** (n - 1)
      : which === 'min' ? (x) => x * n * (1 - x) ** (n - 1)
        : which === 'range' ? (x) => x * n * (n - 1) * x ** (n - 2) * (1 - x) // range density n(n−1)r^(n−2)(1−r)
          : (x) => x * 2 * (1 - x); // |X − Y| density 2(1 − x)
    const N = 2000;
    let s = f(0) + f(1);
    for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(i / N);
    return agree(item, s / (3 * N), 1e-9);
  },

  lesson: {
    purpose: '"What is the expected highest of three dice?" shows up in pricing (a payoff on the best of several outcomes). The tail-sum trick makes it a short sum.',
    anchor: 'You know P(max ≤ k) = (k/6)^n. The expectation is the same fact with one change: add up the tail probabilities P(max ≥ k).',
    steps: [
      { say: 'For a non-negative integer X, E[X] = Σ_{k≥1} P(X ≥ k).', why: 'X = number of k in 1..X, and expectation is linear.' },
      { say: 'P(max ≥ k) = 1 − ((k−1)/s)^n; P(min ≥ k) = ((s−k+1)/s)^n.', why: 'Complement of "all below k", and "all at least k".' },
      { say: 'For uniforms, n points split [0,1] into n + 1 gaps of equal mean length.', why: 'Symmetry of the spacings.' },
    ],
    predict: { question: 'Is E[max of two dice] closer to 4 or to 5?', answer: '4.47 (161/36): closer to 4.5, not 5.' },
    edge: 'One die: E[max] = E[min] = 3.5. Many dice: E[max] → 6.',
    rule: 'Tail sums for dice; k/(n+1) for uniforms; E[min] + E[max] = s + 1 for dice.',
    contrast: 'Discrete dice (faces 1..s, tail sums) against continuous uniforms (gaps of 1/(n+1)).',
  },
};
