import { Q } from '../../../core/rational.js';
import { family, q, L, list, diffsQ, stepText } from '../lib.js';

export default family({
  id: 'diff-geometric',
  title: 'Gaps form a geometric sequence',
  skill: 'When the gaps multiply rather than add, extend the gaps by their ratio',
  levels: [2, 3],
  show: (d) => (d === 2 ? 5 : 6),
  params: (rng, d) => (d === 2
    ? { a: rng.int(0, 20), g: rng.int(1, 5), r: 2 }
    : { a: rng.int(-10, 20), g: rng.int(1, 4) * rng.pick([1, -1]), r: rng.pick([3, -2]) }),
  terms: ({ a, g, r }, n) => { const out = [q(a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].add(Q.of(g * r ** (i - 1)))); return out; },
  rule: ({ g, r }) => `gaps ${g}, ${g * r}, ${g * r * r}, … (each gap × ${r})`,
  explain: ({ r }, { shown }) => [
    { say: `Gaps: ${list(diffsQ(shown))}.`, why: 'Subtract first; the gaps are not constant and their differences are not constant either.' },
    { say: `Each gap is ${r} times the one before.`, why: 'Dividing neighbouring gaps gives the same ratio each time, so the gaps are geometric.' },
  ],
  compute: ({ r }, all, k) => `Next gap = ${L(all[k - 1].sub(all[k - 2]))} × ${r < 0 ? `(${r})` : r} = ${L(all[k].sub(all[k - 1]))}; term ${stepText(all[k - 1], all[k])}.`,
  rivals: ({ r }, { shown }) => {
    const a = shown[shown.length - 1], g = a.sub(shown[shown.length - 2]);
    return [
      { value: a.mul(q(r)), misconception: `Multiplied the last term by ${r}; it is the gaps that multiply by ${r}, not the terms.` },
      { value: a.add(g.mul(q(r + 1))), misconception: `Multiplied the last gap by ${r + 1} instead of ${r}.` },
    ];
  },
  hints: () => ['Write the gaps.', 'Compare neighbouring gaps by dividing, not subtracting.'],
  anchor: 'Second-difference sequences have gaps that add a constant; here the one change is that the gaps multiply by a constant.',
  srule: 'Gaps geometric with ratio r → next = last + r × last gap.',
  lesson: {
    purpose: 'Many "weird" sequences are a plain geometric sequence one layer down. Spotting it saves you from guessing formulas.',
    anchor: 'Second differences: the gaps form an arithmetic sequence. This family: the same set-up, but the gaps form a geometric sequence.',
    steps: [
      { say: 'Write the gaps; if their differences are not constant, divide neighbouring gaps.', why: 'Differencing tests for addition; dividing tests for multiplication.' },
      { say: 'Next gap = last gap × r; next term = last term + next gap.', why: 'The gaps follow their own rule, and each term is the previous term plus its gap.' },
    ],
    predict: { question: '3, 4, 6, 10, 18, ? Predict the next gap first.', answer: 'Gaps 1, 2, 4, 8, so the next gap is 16 and the term is 34.' },
    rule: 'Gaps geometric with ratio r → next = last + r × last gap.',
    contrast: 'Equivalent lens: a(n) = r·a(n−1) + c. Here 3, 4, 6, 10, 18 is also a(n) = 2a(n−1) − 2. Either lens gives the same next term; use whichever you see first.',
    edge: 'A negative ratio makes the gaps alternate in sign, so the sequence zigzags with growing swings.',
  },
});
