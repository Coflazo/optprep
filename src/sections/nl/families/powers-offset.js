import { family, q, L, nz, signed } from '../lib.js';

export default family({
  id: 'powers-offset',
  title: 'Powers of 2 or 3, shifted',
  skill: 'Know 2^0..2^12 and 3^0..3^8; subtract a constant to reveal them',
  levels: [2, 3],
  show: 5,
  params: (rng, d) => (d === 2 ? { b: 2, s: rng.int(0, 5), c: nz(rng, -5, 5) } : { b: rng.pick([2, 3]), s: rng.int(1, 4), c: nz(rng, -9, 9) }),
  terms: ({ b, s, c }, n) => Array.from({ length: n }, (_, i) => q(b ** (i + s) + c)),
  rule: ({ b, s, c }) => `${b}^m ${c < 0 ? '−' : '+'} ${Math.abs(c)} for m = ${s}, ${s + 1}, …`,
  explain: ({ b, s, c }, { shown }) => [
    { say: `Gaps: ${shown.slice(1).map((v, i) => L(v.sub(shown[i]))).join(', ')}, each ${b} times the one before.`, why: `Gaps that multiply by ${b} mean powers of ${b} are inside.` },
    { say: `Subtract ${c}: ${shown.map((v) => L(v.sub(q(c)))).join(', ')} = ${b}^${s}, ${b}^${s + 1}, …`, why: 'Removing the constant leaves the pure powers.' },
  ],
  compute: ({ b, s, c }, all, k) => `Term ${k + 1} = ${b}^${s + k} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${b ** (s + k)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(all[k])}.`,
  rivals: ({ b, s, c }, { shown }) => {
    const n = shown.length, a = shown[n - 1], p = b ** (s + n);
    return [
      { value: a.mul(q(b)), misconception: `Multiplied the whole term by ${b}, constant included; only the power part multiplies, the ${signed(c)} stays fixed.` },
      { value: q(p), misconception: `Found ${b}^${s + n} = ${p} but dropped the constant ${signed(c)}.` },
      { value: q(p - c), misconception: `Applied the constant with the wrong sign (${signed(-c)}).` },
    ];
  },
  hints: () => ['Look at the gaps: how does each compare to the one before?', 'Subtract the same small number from every term. Do you see powers?'],
  anchor: 'Geometric sequences multiply by b; this family is a geometric sequence (the powers of b) with one change: every term is shifted by the same constant.',
  srule: 'Gaps multiply by b → terms are b^m + c; next = b^(next m) + c.',
  lesson: {
    purpose: '2^n ± 1 and 3^n ± 1 are among the most frequent disguises. The gaps give them away instantly.',
    anchor: 'Powers of 2 (a geometric sequence), shifted by one constant.',
    steps: [
      { say: 'Compute gaps; if each gap is b times the last, the terms are b^m + c.', why: 'The constant cancels in a gap, leaving b^m(b − 1), which is geometric.' },
      { say: 'Find c by subtracting the nearest power from any term; next = next power + c.', why: 'The constant is the same for every term.' },
    ],
    predict: { question: '3, 5, 9, 17, 33, ? Predict.', answer: '65 = 64 + 1 (powers of 2 plus 1).' },
    rule: 'Gaps multiply by b → terms are b^m + c; next = b^(next m) + c.',
    contrast: 'Pure geometric: ratios exactly b. Shifted powers: ratios near b but not exact, while the gaps are exactly geometric.',
    edge: '2^m − 1 gives 1, 3, 7, 15, 31: equivalently a(n) = 2a(n−1) + 1. Both lenses agree.',
  },
});
