import { family, q, L, list, diffsQ } from '../lib.js';

export default family({
  id: 'fibonacci-like',
  title: 'Sum of the previous two',
  skill: 'When the gaps look like earlier terms, test last + previous',
  levels: [2, 3],
  view: 'table',
  show: 6,
  missing: 2,
  params: (rng, d) => (d === 2 ? { a: rng.int(1, 9), b: rng.int(1, 9) } : { a: rng.int(-6, 15), b: rng.int(4, 20) }),
  terms: ({ a, b }, n) => { const out = [q(a), q(b)]; while (out.length < n) out.push(out[out.length - 1].add(out[out.length - 2])); return out.slice(0, n); },
  rule: ({ a, b }) => `start ${a}, ${b}; each term = sum of the previous two`,
  explain: (p, { shown }) => [
    { say: `Gaps: ${list(diffsQ(shown))}.`, why: 'The gaps reproduce earlier terms of the sequence: the gap into each term is the term two places back.' },
    { say: `So each term = previous + the one before (e.g. ${L(shown[2])} + ${L(shown[3])} = ${L(shown[4])}).`, why: 'If next − last equals the term before last every time, the rule is a(n) = a(n−1) + a(n−2).' },
  ],
  compute: (p, all, k) => `Term ${k + 1} = ${L(all[k - 2])} + ${L(all[k - 1])} = ${L(all[k])}.`,
  missingRivalsFor: (p, all, k) => (k >= 2 ? [{ value: all[k - 1].add(all[k - 1]), misconception: 'Doubled the term before the blank instead of adding the two terms before it.' }] : []),
  rivals: (p, { shown }) => {
    const n = shown.length, a = shown[n - 1], b = shown[n - 2], c = shown[n - 3];
    return [
      { value: a.add(b).add(c), misconception: 'Added the previous three terms; the rule uses only the previous two.' },
      { value: a.mul(q(2)), misconception: 'Doubled the last term: that only works if the last two terms are equal.' },
    ];
  },
  hints: () => ['Look at the gaps: do they appear earlier in the sequence?', 'Try adding the last two terms.'],
  anchor: 'Arithmetic: add a fixed step. Fibonacci-like: add a step that is not fixed but equals the term before last.',
  srule: 'Gaps repeat earlier terms → a(n) = a(n−1) + a(n−2).',
  lesson: {
    purpose: 'Two-term recurrences are the classic NumberLogic rule. Any two starting numbers give a valid sequence, so you cannot rely on recognising 1, 1, 2, 3, 5.',
    anchor: 'An arithmetic sequence adds the same step each time. Fibonacci-like: the step you add is the term before last.',
    steps: [
      { say: 'Compute the gaps and compare them with the sequence itself.', why: 'For a(n) = a(n−1) + a(n−2), the gap a(n) − a(n−1) equals a(n−2), so the gap list is the sequence shifted by two.' },
      { say: 'Next = last + second-last.', why: 'The recurrence uses exactly the two previous terms.' },
    ],
    predict: { question: '4, 7, 11, 18, 29, ? Predict before adding.', answer: '47. Gaps 3, 4, 7, 11 repeat the sequence shifted: the Lucas-style start 4, 7.' },
    rule: 'Gaps repeat earlier terms → a(n) = a(n−1) + a(n−2).',
    contrast: 'Tribonacci adds three terms; weighted versions use 2·a(n−1) + a(n−2). Check the rule on two different steps before choosing.',
    edge: 'Negative or zero starts are legal: −3, 5, 2, 7, 9, 16. The rule is the same.',
  },
});
