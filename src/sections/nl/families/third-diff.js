import { family, q, L, list, diffsQ, nz, signed, stepText } from '../lib.js';

const cubic = ({ a, b, c, t }, i) => a + b * i + (c * i * (i - 1)) / 2 + (t * i * (i - 1) * (i - 2)) / 6;

export default family({
  id: 'third-diff',
  title: 'Third differences constant',
  skill: 'Keep differencing until a layer is constant, then rebuild upward',
  levels: [3, 4],
  show: 6,
  params: (rng, d) => ({ a: rng.int(-5, 20), b: rng.int(-3, 8), c: rng.int(-4, 6), t: d === 3 ? rng.int(1, 3) : nz(rng, -4, 4) }),
  terms: (p, n) => Array.from({ length: n }, (_, i) => q(cubic(p, i))),
  rule: ({ t }) => `third differences constant at ${signed(t)} (a cubic in n)`,
  explain: ({ t }, { shown }) => {
    const g1 = diffsQ(shown), g2 = diffsQ(g1);
    return [
      { say: `Gaps: ${list(g1)}; gaps of gaps: ${list(g2)}.`, why: 'Neither layer is constant yet, so there is more structure below.' },
      { say: `Third layer: ${list(diffsQ(g2))}, constant at ${signed(t)}.`, why: 'Each differencing lowers the degree by one; constant at the third layer means a cubic.' },
    ];
  },
  compute: ({ t }, all, k) => {
    const g1 = diffsQ(all.slice(0, k + 1)), g2 = diffsQ(g1);
    return `Second difference ${L(g2[g2.length - 2])} ${signed(t)} = ${L(g2[g2.length - 1])}; gap ${L(g1[g1.length - 2])} + ${L(g2[g2.length - 1])} = ${L(g1[g1.length - 1])}; term ${stepText(all[k - 1], all[k])}.`;
  },
  rivals: ({ t }, { shown }) => {
    const a = shown[shown.length - 1], g1 = diffsQ(shown), g2 = diffsQ(g1);
    const lg = g1[g1.length - 1], l2 = g2[g2.length - 1];
    return [
      { value: a.add(lg).add(q(t)), misconception: `Added the third difference (${signed(t)}) straight onto the gap, skipping the second-difference layer.` },
      { value: a.add(lg).add(l2).add(q(2 * t)), misconception: `Raised the second difference by ${signed(2 * t)}; the third differences are ${signed(t)} each.` },
    ];
  },
  hints: () => ['Take differences. Then differences of those. Keep going.', 'The third layer is constant. Rebuild: next second difference, next gap, next term.'],
  anchor: 'Second-difference sequences have one constant layer below the gaps; this is the same method with one more layer.',
  srule: 'Difference until constant (k layers), then add back up the k layers.',
  lesson: {
    purpose: 'Late NumberLogic items hide cubes and sums of squares behind two layers. The differencing table finds them mechanically, without spotting the formula.',
    anchor: 'Second differences constant → quadratic. Add one layer: third differences constant → cubic.',
    steps: [
      { say: 'Build the table: terms, gaps, gaps of gaps, third layer.', why: 'Each subtraction removes the top-degree growth by one step.' },
      { say: 'Extend the constant layer by one entry, then add upward: new second difference, new gap, new term.', why: 'Each layer is the running total of the layer below it, so the next value of each is last + the entry below.' },
    ],
    predict: { question: '1, 8, 27, 64, 125, ? What is the constant third difference?', answer: '6 (cubes: third differences of n³ are 3! = 6). Next is 216.' },
    rule: 'Difference until constant (k layers), then add back up the k layers.',
    contrast: 'If the second layer is already constant, stop there (quadratic). If no layer becomes constant by the third, suspect a ratio, a recurrence or two interleaved sequences instead.',
    edge: 'Five terms give only two third differences: one check. Six terms give three, which is what makes the rule trustworthy.',
  },
});
