import { family, q, L, signed } from '../lib.js';

export default family({
  id: 'cubes-plus',
  title: 'Cubes, shifted',
  skill: 'Know the cubes to 12³; a third-difference of 6 is the fingerprint of n³',
  levels: [2, 3],
  view: 'table',
  show: (d) => (d === 2 ? 5 : 6),
  params: (rng, d) => (d === 2 ? { s: rng.int(1, 6), k: rng.int(-9, 9), lin: 0 } : { s: rng.int(1, 7), k: rng.int(-9, 9), lin: rng.pick([-1, 1]) }),
  terms: ({ s, k, lin }, n) => Array.from({ length: n }, (_, i) => q((i + s) ** 3 + lin * (i + s) + k)),
  rule: ({ s, k, lin }) => `b³${lin ? ` ${lin < 0 ? '−' : '+'} b` : ''} ${k < 0 ? '−' : '+'} ${Math.abs(k)} for b = ${s}, ${s + 1}, …`,
  explain: ({ s, k, lin }, { shown }) => [
    { say: `Compare with cubes ${shown.map((_, i) => (i + s) ** 3).join(', ')}: differences ${shown.map((v, i) => L(v.sub(q((i + s) ** 3)))).join(', ')}.`, why: 'Growth that outruns squares but has no fixed ratio suggests cubes; line them up against the terms.' },
    { say: lin ? `The leftover is ${lin < 0 ? '−' : '+'}b ${signed(k)}: it moves with the base.` : `The leftover is always ${signed(k)}.`, why: 'Whatever is left after removing the cube must follow its own simple rule.' },
  ],
  compute: ({ s, k, lin }, all, kk) => `Term ${kk + 1} = ${kk + s}³${lin ? ` ${lin < 0 ? '−' : '+'} ${kk + s}` : ''} ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${L(all[kk])}.`,
  rivals: ({ s, k, lin }, { shown }) => {
    const b = shown.length + s;
    return [
      { value: q(b ** 3 + lin * b), misconception: `Found ${b}³ but dropped the constant ${signed(k)}.` },
      { value: q(b * b + lin * b + k), misconception: `Used ${b}² instead of ${b}³: the terms grow like cubes.` },
      { value: q((b + 1) ** 3 + lin * (b + 1) + k), misconception: `Skipped a base: used ${b + 1}³ instead of ${b}³.` },
    ];
  },
  hints: () => ['The growth is faster than squares. Which cubes are nearby?', 'Subtract the cube from each term: what is left?'],
  anchor: 'Squares plus a constant, with one change: the power is 3 instead of 2.',
  srule: 'Terms near cubes → subtract b³, read the leftover rule, cube the next base.',
  lesson: {
    purpose: 'Cubes appear in mid-test items, often disguised by a shift. Memorising 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000, 1331, 1728 pays off here.',
    anchor: 'Shifted squares, with the exponent raised from 2 to 3.',
    steps: [
      { say: 'Line the terms up against consecutive cubes.', why: 'A constant (or simply patterned) leftover confirms the cube shape.' },
      { say: 'Next term = (next base)³ + the leftover rule.', why: 'Both parts continue independently.' },
    ],
    predict: { question: '0, 7, 26, 63, 124, ? Predict.', answer: 'Cubes minus 1: 6³ − 1 = 215.' },
    rule: 'Terms near cubes → subtract b³, read the leftover rule, cube the next base.',
    contrast: 'The difference table also works (third differences of b³ are 6), but needs 5+ terms and more arithmetic than recognising cubes.',
    edge: 'b³ − b = (b − 1)·b·(b + 1): products of three consecutive numbers (6, 24, 60, 120) are cubes in disguise.',
  },
});
