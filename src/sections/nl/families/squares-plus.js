import { family, q, L, signed } from '../lib.js';

export default family({
  id: 'squares-plus',
  title: 'Squares, shifted or scaled',
  skill: 'Know the squares to 30² by sight; subtract a small constant to reveal them',
  levels: [1, 2],
  view: 'table',
  show: 5,
  missing: 1,
  params: (rng, d) => (d === 1
    ? { m: 1, s: rng.int(1, 8), k: rng.int(-6, 6), c: 1 }
    : rng.pick([{ m: 2, s: rng.int(0, 5) * 2 + 1, k: rng.int(-4, 4), c: 1 }, { m: 1, s: rng.int(2, 10), k: rng.int(-5, 5), c: rng.pick([2, 3]) }])),
  terms: ({ m, s, k, c }, n) => Array.from({ length: n }, (_, i) => q(c * (m * i + s) ** 2 + k)),
  rule: ({ m, s, k, c }) => `${c === 1 ? '' : `${c}·`}b² ${k < 0 ? '−' : '+'} ${Math.abs(k)} for b = ${s}, ${s + m}, ${s + 2 * m}, …`,
  explain: ({ m, s, k, c }, { shown }) => [
    { say: `${k === 0 ? 'Compare' : `Subtract ${k}${k < 0 ? ' (i.e. add ' + -k + ')' : ''}`}${c > 1 ? ` and divide by ${c}` : ''}: ${shown.map((v) => L(v.sub(q(k)).div(q(c)))).join(', ')}.`, why: 'Removing the constant and the scale leaves a list you can recognise.' },
    { say: `These are the squares of ${shown.map((_, i) => m * i + s).join(', ')}.`, why: `The bases ${m === 1 ? 'count up by 1' : 'are consecutive odd numbers'}, so the next base is ${m * shown.length + s}.` },
  ],
  compute: ({ m, s, k, c }, all, kk) => `Term ${kk + 1} = ${c === 1 ? '' : `${c} × `}${m * kk + s}² ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${L(all[kk])}.`,
  rivals: ({ m, s, k, c }, { shown }) => {
    const b = m * shown.length + s;
    return [
      { value: q(c * b * b), misconception: `Found the square ${b}² but dropped the constant ${signed(k)}.` },
      { value: q(c * (b + m) ** 2 + k), misconception: `Skipped a base: used ${b + m}² instead of ${b}².` },
      { value: q(c * b * b - k), misconception: `Applied the constant with the wrong sign (${signed(-k)}).` },
    ].filter((r) => k !== 0 || r.value.toNumber() !== c * b * b);
  },
  hints: () => ['Do these numbers sit next to perfect squares?', 'Subtract a small constant from every term and look again.'],
  anchor: 'The squares 1, 4, 9, 16, 25 are known by sight; this family changes one thing: every square is shifted (or scaled) by the same amount.',
  srule: 'Terms near squares → subtract the constant, read the bases, square the next base.',
  lesson: {
    purpose: 'Squares hide behind a small shift in many sequences. Knowing squares to 30² turns these into a two-second read.',
    anchor: 'Perfect squares, with one modification: add the same constant (or multiply by the same factor) to each.',
    steps: [
      { say: 'Compare each term with the nearest perfect square; the difference is the same constant each time.', why: 'A shared offset means the shape is squares.' },
      { say: 'Next term = (next base)² + the constant.', why: 'The bases count up by a fixed step.' },
    ],
    predict: { question: '3, 8, 15, 24, 35, ? Predict the constant first.', answer: 'Each is a square minus 1 (4, 9, 16, 25, 36): next is 49 − 1 = 48.' },
    rule: 'Terms near squares → subtract the constant, read the bases, square the next base.',
    contrast: 'Second differences also solve this (they are constant, 2 for n²). The square lens is faster when you recognise it; the difference table is the fallback.',
    edge: 'Odd bases only (1, 9, 25, 49) give second difference 8; a scale factor c gives second difference 2c.',
  },
});
