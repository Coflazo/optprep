import { family, q, L } from '../lib.js';

export default family({
  id: 'tribonacci',
  title: 'Sum of the previous three',
  skill: 'If last + previous falls short by a steady pattern, add one more term',
  levels: [3, 4],
  show: (d) => (d === 3 ? 6 : 7),
  params: (rng, d) => (d === 3 ? { s: [rng.int(0, 4), rng.int(1, 5), rng.int(1, 6)] } : { s: [rng.int(-4, 6), rng.int(-3, 8), rng.int(2, 10)] }),
  terms: ({ s }, n) => { const out = s.map((v) => q(v)); while (out.length < n) { const m = out.length; out.push(out[m - 1].add(out[m - 2]).add(out[m - 3])); } return out.slice(0, n); },
  rule: ({ s }) => `start ${s.join(', ')}; each term = sum of the previous three`,
  explain: (p, { shown }) => [
    { say: `Last + previous falls short: ${L(shown[3])} + ${L(shown[4])} is not ${L(shown[5])}.`, why: 'The two-term rule is the first thing to test; it fails, so a longer memory is involved.' },
    { say: `Adding three works everywhere: ${L(shown[2])} + ${L(shown[3])} + ${L(shown[4])} = ${L(shown[5])}.`, why: 'Check the three-term sum on at least two steps before trusting it.' },
  ],
  compute: (p, all, k) => `Term ${k + 1} = ${L(all[k - 3])} + ${L(all[k - 2])} + ${L(all[k - 1])} = ${L(all[k])}.`,
  rivals: (p, { shown }) => {
    const n = shown.length, [d, c, b, a] = shown.slice(n - 4);
    return [
      { value: a.add(b), misconception: 'Added only the previous two terms; the rule needs the previous three.' },
      { value: a.add(b).add(c).add(d), misconception: 'Added the previous four terms; one too many.' },
    ];
  },
  hints: () => ['Test last + previous. How far off is it?', 'The shortfall equals an earlier term: add three terms.'],
  anchor: 'Fibonacci-like sequences add the previous two terms; tribonacci changes one thing: add the previous three.',
  srule: 'a(n) = a(n−1) + a(n−2) + a(n−3).',
  lesson: {
    purpose: 'Recognising "sum of previous k" quickly, and checking how many terms are summed, turns a hard-looking late item into a quick one.',
    anchor: 'Fibonacci: a(n) = a(n−1) + a(n−2). Tribonacci: the same with one change, a third term joins the sum.',
    steps: [
      { say: 'Try last + previous; compute the shortfall next − (last + previous).', why: 'For tribonacci the shortfall is exactly a(n−3), an earlier term you can see.' },
      { say: 'Confirm the three-term sum on two steps, then add the last three terms.', why: 'Two checks rule out coincidence.' },
    ],
    predict: { question: '1, 1, 2, 4, 7, 13, ? Predict.', answer: '24 = 4 + 7 + 13.' },
    rule: 'a(n) = a(n−1) + a(n−2) + a(n−3).',
    contrast: 'Sum of all previous terms makes each term double the last after a while (1, 2, 3, 6, 12, 24); tribonacci keeps a window of exactly three.',
    edge: 'With a zero or negative start the early terms can look random; the rule only becomes visible from the fourth term.',
  },
});
