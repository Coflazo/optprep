import { family, q, L, nz, signed } from '../lib.js';

const PQ = { 3: [[2, 1], [1, 2]], 4: [[3, 1], [1, 3], [2, 2], [3, -1]], 5: [[2, 1], [1, 2], [3, 1]] };
const term = (p, qq, c) => `${p === 1 ? '' : `${p}·`}a(n−1) ${qq < 0 ? '−' : '+'} ${Math.abs(qq) === 1 ? '' : `${Math.abs(qq)}·`}a(n−2)${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''}`;

export default family({
  id: 'weighted-two-term',
  title: 'Weighted two-term recurrence',
  skill: 'When last + previous is not enough, test small weights: 2·last + previous, last + 2·previous',
  levels: [3, 4, 5],
  view: 'table',
  show: (d) => (d === 5 ? 7 : d === 4 ? 6 : 5),
  params: (rng, d) => {
    const [p, qq] = rng.pick(PQ[d]);
    return { p, q: qq, c: d === 5 ? nz(rng, -5, 5) : 0, s: [rng.int(1, 5), rng.int(1, 6)] };
  },
  terms: ({ p, q: qq, c, s }, n) => { const out = s.map((v) => q(v)); while (out.length < n) { const m = out.length; out.push(out[m - 1].mul(q(p)).add(out[m - 2].mul(q(qq))).add(q(c))); } return out.slice(0, n); },
  rule: ({ p, q: qq, c }) => `a(n) = ${term(p, qq, c)}`,
  explain: ({ p, q: qq, c }, { shown }) => [
    { say: `Last + previous is too ${shown[3].cmp(shown[1].add(shown[2])) > 0 ? 'small' : 'large'}: ${L(shown[1])} + ${L(shown[2])} is not ${L(shown[3])}.`, why: 'The unweighted two-term rule is the first thing to rule out.' },
    { say: `Weights ${p} and ${qq}${c ? ` plus ${signed(c)}` : ''} fit every step: ${p} × ${L(shown[2])} ${qq < 0 ? '−' : '+'} ${Math.abs(qq)} × ${L(shown[1])}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(shown[3])}.`, why: 'Two unknown weights are pinned down by two steps; the remaining steps are the check.' },
  ],
  compute: ({ p, q: qq, c }, all, k) => `Term ${k + 1} = ${p} × ${L(all[k - 1])} ${qq < 0 ? '−' : '+'} ${Math.abs(qq)} × ${L(all[k - 2])}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(all[k])}.`,
  rivals: ({ p, q: qq, c }, { shown }) => {
    const n = shown.length, a = shown[n - 1], b = shown[n - 2];
    const out = [
      { value: a.mul(q(qq)).add(b.mul(q(p))).add(q(c)), misconception: `Swapped the weights: the ${p} goes on the last term and the ${qq} on the one before.` },
      { value: a.mul(q(p)).add(q(c)), misconception: `Dropped the a(n−2) term: ${p} × last alone misses the ${qq} × previous contribution.` },
    ];
    if (c) out.push({ value: a.mul(q(p)).add(b.mul(q(qq))), misconception: `Found the weights but forgot the constant ${signed(c)} added every step.` });
    return out;
  },
  hints: () => ['Check last + previous: how far off is it?', 'Try 2 × last + previous and last + 2 × previous; one of them fits every step.'],
  anchor: 'Fibonacci: a(n) = a(n−1) + a(n−2). The one change: each of the two terms carries a small weight.',
  srule: 'Two unknown weights: solve them from two steps, check on the rest.',
  lesson: {
    purpose: 'Reported example: 2, 5, 12, 29, 70, ? (answer 169, a(n) = 2a(n−1) + a(n−2)). Weighted recurrences look like ratio sequences but the ratio drifts.',
    anchor: 'Fibonacci-like, with one modification: the previous two terms are multiplied by small whole numbers before adding.',
    steps: [
      { say: 'The ratio drifts (2.5, 2.4, 2.42, …), so it is not geometric; test a two-term rule.', why: 'A two-term linear recurrence has a ratio that converges but is never exactly constant.' },
      { say: 'Solve p·a2 + q·a1 = a3 and p·a3 + q·a2 = a4 for small whole p, q; check on the remaining steps.', why: 'Two equations fix two weights; every further step must agree.' },
    ],
    predict: { question: '1, 3, 5, 11, 21, ? (hint: last + 2 × previous)', answer: '43 = 21 + 2 × 11.' },
    rule: 'Two unknown weights: solve them from two steps, check on the rest.',
    contrast: 'k·a(n−1) + c uses one previous term and a constant; a weighted two-term rule uses two previous terms and (usually) no constant.',
    edge: 'A negative weight (3·a(n−1) − a(n−2)) grows more slowly than the positive-weight versions; the ratio settles near 2.6.',
  },
});
