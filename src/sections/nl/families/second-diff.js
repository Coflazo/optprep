import { family, q, L, list, diffsQ, nz, signed, stepText } from '../lib.js';

const quad = ({ a, d0, s }, i) => a + i * d0 + (s * i * (i - 1)) / 2;

export default family({
  id: 'second-diff',
  title: 'Gaps change by a constant',
  skill: 'When the gaps are not constant, take the gaps of the gaps',
  levels: [1, 2],
  show: (d) => (d === 1 ? 5 : 6),
  missing: 1,
  params: (rng, d) => (d === 1
    ? { a: rng.int(1, 20), d0: rng.int(1, 8), s: rng.int(1, 3) }
    : { a: rng.int(-10, 40), d0: rng.int(-10, 15), s: nz(rng, -6, 6) }),
  terms: (p, n) => Array.from({ length: n }, (_, i) => q(quad(p, i))),
  rule: ({ d0, s }) => `gaps start at ${d0} and change by ${signed(s)} each step`,
  explain: ({ s }, { shown }) => {
    const g = diffsQ(shown);
    return [
      { say: `Gaps: ${list(g)}. Not constant.`, why: 'First test: subtract neighbours. A non-constant gap means the rule is not "add d".' },
      { say: `Gaps of the gaps: ${list(diffsQ(g))}, all ${signed(s)}.`, why: 'Taking differences a second time strips one more layer; a constant second difference means the gap itself moves by a fixed amount.' },
    ];
  },
  compute: ({ s }, all, k) => (k >= 2
    ? `Next gap = ${L(all[k - 1].sub(all[k - 2]))} ${signed(s)} = ${L(all[k].sub(all[k - 1]))}, so term ${k + 1} = ${stepText(all[k - 1], all[k])}.`
    : `Term 2 = ${stepText(all[0], all[1])}, the first gap.`),
  rivals: ({ s }, { shown }) => {
    const a = shown[shown.length - 1], g = a.sub(shown[shown.length - 2]);
    return [
      { value: a.add(g).add(q(2 * s)), misconception: `Changed the gap by ${signed(2 * s)} instead of ${signed(s)}: the gaps of the gaps are ${signed(s)} every time.` },
      { value: a.add(g).sub(q(s)), misconception: `Moved the gap the wrong way (${signed(-s)} instead of ${signed(s)}).` },
    ];
  },
  hints: () => ['The gaps are not constant. Write them down.', 'Now subtract neighbouring gaps. What stays fixed?'],
  anchor: 'Arithmetic sequences have constant gaps; here the gaps themselves form an arithmetic sequence. Same test, applied one level down.',
  srule: 'Constant second difference s → next gap = last gap + s.',
  lesson: {
    purpose: 'Squares, triangular numbers and "add 1, then 2, then 3" all hide behind one test: differences of differences. Learn it once and a whole class of sequences opens.',
    anchor: 'Arithmetic: constant gap. Second-difference: the same idea with one change, the gap is itself arithmetic.',
    steps: [
      { say: 'Write the gaps, then the gaps of the gaps.', why: 'Each subtraction removes one layer of structure; when a layer is constant you have found the rule.' },
      { say: 'Next gap = last gap + the constant second difference; next term = last term + next gap.', why: 'Rebuild upward: the fixed layer tells you how the layer above moves.' },
    ],
    predict: { question: '2, 5, 10, 17, 26, ? First predict the next gap, then the term.', answer: 'Gaps 3, 5, 7, 9, so the next gap is 11 and the term is 37 (these are n² + 1).' },
    rule: 'Constant second difference s → next gap = last gap + s.',
    contrast: 'Second-difference sequences are quadratics in n; geometric sequences also have growing gaps, but their gaps grow by a ratio, not by a fixed amount.',
    edge: 'A negative second difference makes the gaps shrink and eventually turn negative: the sequence rises, peaks, then falls.',
  },
});
