import { family, q, L, list, diffsQ, stepText } from '../lib.js';

export default family({
  id: 'add-index',
  title: 'Add the counting numbers',
  skill: 'Gaps that count up 1, 2, 3 (or 2, 4, 6) mean a(n) = a(n−1) + m·n',
  levels: [1, 2],
  show: 5,
  missing: 1,
  params: (rng, d) => (d === 1 ? { a: rng.int(0, 20), m: 1, s: rng.int(0, 4) } : { a: rng.int(-10, 30), m: rng.pick([2, 3, 5]), s: rng.int(0, 4) }),
  terms: ({ a, m, s }, n) => { const out = [q(a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].add(q(m * (i + s)))); return out; },
  rule: ({ m, s }) => `add ${m * (1 + s)}, ${m * (2 + s)}, ${m * (3 + s)}, … (the gap grows by ${m})`,
  explain: ({ m }, { shown }) => [
    { say: `Gaps: ${list(diffsQ(shown))}.`, why: 'Subtracting neighbours exposes the step.' },
    { say: `The gaps are consecutive multiples of ${m}: each is ${m} more than the last.`, why: `The rule is "add the next ${m === 1 ? 'counting number' : `multiple of ${m}`}".` },
  ],
  compute: ({ m }, all, k) => `Next gap ${L(all[k].sub(all[k - 1]))}; term ${k + 1} = ${stepText(all[k - 1], all[k])}.`,
  rivals: ({ m }, { shown }) => {
    const a = shown[shown.length - 1], g = a.sub(shown[shown.length - 2]);
    return [
      { value: a.add(g).add(q(2 * m)), misconception: `Skipped a gap: the next gap is ${L(g.add(q(m)))}, not ${L(g.add(q(2 * m)))}.` },
      { value: a.add(q(shown.length)), misconception: `Added the position number ${shown.length} rather than continuing the gap pattern.` },
    ];
  },
  hints: () => ['Write the gaps.', 'The gaps count up in steps. What is the next gap?'],
  anchor: 'Arithmetic: add the same number each time. Here the one change: the number you add goes up by the same amount each time.',
  srule: 'Gaps m, 2m, 3m, … → next gap = last gap + m.',
  lesson: {
    purpose: 'The gentlest non-arithmetic rule and the gateway to second differences: the gap itself counts.',
    anchor: 'Counting 1, 2, 3 is the simplest sequence; here those counting numbers are the gaps.',
    steps: [
      { say: 'List the gaps.', why: 'The pattern lives in the gaps, not the terms.' },
      { say: 'The gaps rise by a fixed m, so the next gap is last gap + m.', why: 'This is a second-difference rule with second difference m.' },
    ],
    predict: { question: '10, 11, 13, 16, 20, ? Predict the next gap.', answer: 'Gaps 1, 2, 3, 4, so the next gap is 5 and the term is 25.' },
    rule: 'Gaps m, 2m, 3m, … → next gap = last gap + m.',
    contrast: 'Adding n makes a quadratic (second differences constant); multiplying by n makes factorial growth (ratios count up).',
    edge: 'Starting from 1 gives the triangular numbers: 1, 3, 6, 10, 15.',
  },
});
