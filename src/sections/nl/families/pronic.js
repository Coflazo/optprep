import { family, q, L, list, diffsQ } from '../lib.js';

export default family({
  id: 'pronic',
  title: 'n(n + c): products of near neighbours',
  skill: 'Factor each term as two close numbers: 2, 6, 12, 20 = 1·2, 2·3, 3·4, 4·5',
  levels: [2],
  show: 5,
  params: (rng) => ({ s: rng.int(1, 14), c: rng.pick([1, 2, 3, 4, -1, -2]) }),
  accept: (p, xs) => xs.every((v) => !v.isZero()),
  terms: ({ s, c }, n) => Array.from({ length: n }, (_, i) => q((i + s) * (i + s + c))),
  rule: ({ s, c }) => `b(b ${c < 0 ? '−' : '+'} ${Math.abs(c)}) = b² ${c < 0 ? '−' : '+'} ${Math.abs(c) === 1 ? '' : Math.abs(c)}b for b = ${s}, ${s + 1}, …`,
  explain: ({ s, c }, { shown }) => [
    { say: `Factor each term: ${shown.map((v, i) => `${i + s}×${i + s + c}`).join(', ')}.`, why: 'Numbers like 12, 20, 30 are products of two close integers; the gap between the factors is fixed.' },
    { say: `Cross-check with gaps ${list(diffsQ(shown))}: they rise by 2 each time.`, why: 'b(b + c) is a quadratic, so its second difference is 2.' },
  ],
  compute: ({ s, c }, all, k) => `Term ${k + 1} = ${k + s} × ${k + s + c} = ${L(all[k])}.`,
  rivals: ({ s, c }, { shown }) => {
    const b = shown.length + s;
    return [
      { value: q(b * b), misconception: `Took ${b}² and forgot the ${c < 0 ? '−' : '+'}${Math.abs(c) === 1 ? '' : Math.abs(c)}b part (${b} × ${b + c}).` },
      { value: q(b * (b + c + 1)), misconception: `Widened the factor gap to ${c + 1}; it stays ${c} (${b} × ${b + c}).` },
    ];
  },
  hints: () => ['Try writing each term as a product of two close whole numbers.', 'The two factors keep the same distance apart.'],
  anchor: 'Squares are b × b; this family changes one thing: the second factor is b + c.',
  srule: 'Terms = b(b + c) → next = (next b)(next b + c).',
  lesson: {
    purpose: 'Products of neighbours (2, 6, 12, 20, 30) are common and look like "almost squares". Factoring is faster than differencing.',
    anchor: 'Squares b × b, changed in one place: multiply by b + c instead of b.',
    steps: [
      { say: 'Write each term as a product of two close integers.', why: 'If the factor gap is the same every time, that is the rule.' },
      { say: 'Next term = next b × (next b + c).', why: 'Both factors step up by 1.' },
    ],
    predict: { question: '3, 8, 15, 24, 35, ? Factor first.', answer: '1×3, 2×4, 3×5, 4×6, 5×7 → 6×8 = 48.' },
    rule: 'Terms = b(b + c) → next = (next b)(next b + c).',
    contrast: 'Triangular numbers are half of these: b(b+1)/2 gives 1, 3, 6, 10. If the terms are half-products, divide by 2 first.',
    edge: 'The same list can be read as squares minus a constant when c is even (b(b+2) = (b+1)² − 1). Both readings give the same answer.',
  },
});
