import { family, q, L, list, diffsQ, nz, signed } from '../lib.js';

export default family({
  id: 'arithmetic',
  title: 'Constant difference',
  skill: 'Subtract neighbours first: a constant gap means add the same number every step',
  levels: [1],
  show: 5,
  missing: 1,
  params: (rng) => ({ a: rng.int(-20, 60), d: nz(rng, -19, 19) }),
  terms: ({ a, d }, n) => Array.from({ length: n }, (_, i) => q(a + i * d)),
  rule: ({ a, d }) => `a(n) = ${a} ${d < 0 ? '−' : '+'} ${Math.abs(d)}·(n − 1)`,
  explain: ({ d }, { shown, mode }) => [
    { say: `Gaps between neighbours: ${list(diffsQ(shown), mode)}.`, why: 'Subtracting neighbours is the cheapest first test; it removes the starting value and exposes the step.' },
    { say: `Every gap is ${signed(d)}, so the rule is "add ${d}".`, why: 'A constant difference is the definition of an arithmetic sequence.' },
  ],
  compute: ({ d }, all, k) => `Term ${k + 1} = ${L(all[k - 1])} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = ${L(all[k])}.`,
  rivals: ({ d }, { shown }) => {
    const a = shown[shown.length - 1];
    return [
      { value: a.sub(q(d)), misconception: `Applied the step in the wrong direction: the terms ${d > 0 ? 'rise' : 'fall'} by ${Math.abs(d)}, so ${d > 0 ? 'add' : 'subtract'} it.` },
      { value: a.add(q(d + (d > 0 ? 1 : -1))), misconception: `Misread the gap as ${Math.abs(d) + 1}; recheck one subtraction, the gap is ${Math.abs(d)}.` },
    ];
  },
  hints: () => ['Subtract each term from the one after it.', 'If the gaps are all the same, add that gap once more.'],
  anchor: 'Counting in steps: the same as counting 1, 2, 3 but with a different step and starting point.',
  srule: 'Constant gap d → next = last + d.',
  lesson: {
    purpose: 'Every sequence question starts with one cheap test: are the gaps constant? Answering that in five seconds tells you whether to stop or dig deeper.',
    anchor: 'Counting 1, 2, 3, … adds 1 each time. An arithmetic sequence is the same thing with one change: add a fixed d instead of 1, from any start.',
    steps: [
      { say: 'Write the gaps: term 2 − term 1, term 3 − term 2, and so on.', why: 'The gap removes the starting value, so only the rule is left.' },
      { say: 'If every gap equals d, the next term is last + d.', why: 'The rule "add d" produced every shown step, so it produces the next one.' },
    ],
    predict: { question: '−7, −3, 1, 5, ? What comes next, and what is the gap?', answer: '9; the gap is +4 throughout, negative start included.' },
    rule: 'Constant gap d → next = last + d.',
    contrast: 'Constant gap (arithmetic: add d) versus constant ratio (geometric: multiply by r). 3, 6, 9 adds 3; 3, 6, 12 doubles.',
    edge: 'A negative gap is still constant: 40, 33, 26 falls by 7. A gap of 0 would be a constant sequence.',
  },
});
