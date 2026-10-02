import { family, q, L, list, ratiosQ, nz, signed } from '../lib.js';

export default family({
  id: 'affine-recurrence',
  title: 'Multiply, then add a constant',
  skill: 'Ratios near a whole number k but not exact: test k × previous and look at what is left over',
  levels: [2, 3],
  view: 'table',
  show: 5,
  params: (rng, d) => (d === 2
    ? { a: rng.int(1, 9), k: rng.pick([2, 3]), c: nz(rng, -9, 9) }
    : { a: rng.int(-5, 9), k: rng.pick([-2, 3, 4]), c: nz(rng, -12, 12) }),
  terms: ({ a, k, c }, n) => { const out = [q(a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].mul(q(k)).add(q(c))); return out; },
  rule: ({ k, c }) => `a(n) = ${k}·a(n−1) ${c < 0 ? '−' : '+'} ${Math.abs(c)}`,
  explain: ({ k, c }, { shown }) => [
    { say: `Ratios are close to ${k} but not exact (${ratiosQ(shown.filter((v) => !v.isZero())).slice(-2).map((r) => r.toNumber().toFixed(2)).join(', ')}, …).`, why: 'A near-constant ratio suggests multiplication plus a small fixed correction.' },
    { say: `${k} × each term, compared with the next: the leftover is always ${signed(c)} (e.g. ${k} × ${L(shown[1])} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(shown[2])}).`, why: 'Subtracting k × previous isolates the added constant; it is the same every step.' },
  ],
  compute: ({ k, c }, all, kk) => `Term ${kk + 1} = ${k} × ${L(all[kk - 1])} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(all[kk])}.`,
  rivals: ({ k, c }, { shown }) => {
    const a = shown[shown.length - 1];
    return [
      { value: a.mul(q(k)), misconception: `Multiplied by ${k} but forgot the ${signed(c)} that every step adds.` },
      { value: a.mul(q(k)).sub(q(c)), misconception: `Used ${signed(-c)} instead of ${signed(c)}: the correction has the wrong sign.` },
      { value: a.add(q(c)).mul(q(k)), misconception: `Added ${c} before multiplying; the order is multiply by ${k} first, then add ${c}.` },
    ];
  },
  hints: () => ['Divide neighbours: the ratio is nearly a whole number.', 'Compute k × previous and compare with the actual term: what is left over?'],
  anchor: 'Geometric: multiply by k. This family adds one change: after multiplying, add the same constant c.',
  srule: 'a(n) = k·a(n−1) + c: find k from the ratio, c from the leftover.',
  lesson: {
    purpose: 'This is the most common "harder" NumberLogic rule. Ratios that hover near 2 or 3 without being exact are its fingerprint.',
    anchor: 'Geometric sequence (×k each step) plus one modification: a fixed amount c is added after each multiplication.',
    steps: [
      { say: 'Divide neighbours; the ratios approach k.', why: 'For large terms the constant c is small relative to k·a, so the ratio tends to k.' },
      { say: 'Compute next − k × previous for two steps; if both equal c, the rule is a(n) = k·a(n−1) + c.', why: 'Subtracting the multiplied part isolates the constant, and two equal leftovers confirm it.' },
    ],
    predict: { question: '2, 5, 11, 23, 47, ? Guess k and c before checking.', answer: 'k = 2, c = 1: next is 95.' },
    rule: 'a(n) = k·a(n−1) + c: find k from the ratio, c from the leftover.',
    contrast: 'Pure geometric has leftover 0. Constant gaps (arithmetic) is the case k = 1. The gaps of this sequence are geometric with ratio k.',
    edge: 'A negative k alternates signs; a negative c pulls the terms down, and with a small start the sequence can shrink or cross zero.',
  },
});
