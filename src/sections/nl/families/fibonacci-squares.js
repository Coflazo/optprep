import { family, q, L, FIB } from '../lib.js';

export default family({
  id: 'fibonacci-squares',
  title: 'Squares and products of Fibonacci numbers',
  skill: 'Take square roots (or factor into neighbours) to reveal a Fibonacci list',
  levels: [4],
  view: 'table',
  show: 6,
  params: (rng) => ({ s: rng.int(0, 6), k: rng.pick(['sq', 'prod']), c: rng.pick([0, 0, 0, -3, -2, -1, 1, 2, 3]) }),
  terms: ({ s, k, c }, n) => Array.from({ length: n }, (_, i) => q((k === 'sq' ? FIB[i + s] ** 2 : FIB[i + s] * FIB[i + s + 1]) + c)),
  rule: ({ k, c }) => `${k === 'sq' ? 'squares of consecutive Fibonacci numbers' : 'products of consecutive Fibonacci numbers F(n)·F(n+1)'}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''}`,
  explain: ({ s, k, c }, { shown }) => [
    ...(c ? [{ say: `${c < 0 ? 'Add' : 'Subtract'} ${Math.abs(c)} from every term: ${shown.map((v) => L(v.sub(q(c)))).join(', ')}.`, why: 'A shared constant hides the structure; remove it first.' }] : []),
    { say: k === 'sq' ? `Every term is a perfect square: ${shown.map((_, i) => `${FIB[i + s]}²`).join(', ')}.` : `Every term factors into neighbours: ${shown.map((_, i) => `${FIB[i + s]}×${FIB[i + s + 1]}`).join(', ')}.`, why: 'Neither gaps nor ratios settle; factoring exposes the building blocks.' },
    { say: `The roots${k === 'sq' ? '' : ' (factors)'} ${FIB.slice(s, s + shown.length + (k === 'sq' ? 0 : 1)).join(', ')} are Fibonacci numbers.`, why: 'Each root is the sum of the two before it.' },
  ],
  compute: ({ s, k, c }, all, kk) => `Next Fibonacci number ${FIB[kk + s + (k === 'sq' ? 0 : 1)]}: term ${kk + 1} = ${k === 'sq' ? `${FIB[kk + s]}²` : `${FIB[kk + s]} × ${FIB[kk + s + 1]}`}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(all[kk])}.`,
  rivals: ({ s, k, c }, { shown }) => {
    const n = shown.length, a = shown[n - 1], b = shown[n - 2], f = FIB[n + s], g = FIB[n + s + 1];
    const out = [
      { value: a.add(b), misconception: 'Applied the Fibonacci rule to the terms themselves; only the roots (factors) add, not the terms.' },
      { value: q((k === 'sq' ? f : g) + c), misconception: k === 'sq' ? `Found the next Fibonacci number ${f} but forgot to square it.` : `Gave the next Fibonacci factor ${g} instead of the product ${f} × ${g}.` },
      { value: q((k === 'sq' ? (f + 1) ** 2 : f * f) + c), misconception: k === 'sq' ? `Squared ${f + 1}; the next Fibonacci number is ${f}.` : `Squared ${f} instead of multiplying the neighbours ${f} × ${g}.` },
    ];
    if (c) out.push({ value: q(k === 'sq' ? f * f : f * g), misconception: `Found the ${k === 'sq' ? 'square' : 'product'} but dropped the constant ${c < 0 ? '−' : '+'}${Math.abs(c)}.` });
    return out;
  },
  hints: () => ['Are these perfect squares, or products of two neighbours?', 'Look at the roots or factors: how is each built from the two before?'],
  anchor: 'The Fibonacci numbers, with one change applied to each: square it, or multiply it by the next one.',
  srule: 'Squares/products of known lists → recover the list, extend it, reapply the operation.',
  lesson: {
    purpose: 'Layering a known list under an operation is a common late-test disguise. 1, 1, 4, 9, 25, 64 is the canonical example.',
    anchor: 'Fibonacci numbers (1, 1, 2, 3, 5, 8, …), each squared or multiplied by its successor.',
    steps: [
      { say: 'Check for perfect squares; otherwise factor each term into two close numbers.', why: 'Recovering the inner list is the whole solution.' },
      { say: 'Extend the inner list by one step and apply the same operation.', why: 'The operation is the same at every position.' },
    ],
    predict: { question: '1, 4, 9, 25, 64, ? Predict.', answer: '169 = 13² (roots 1, 2, 3, 5, 8, 13).' },
    rule: 'Squares/products of known lists → recover the list, extend it, reapply the operation.',
    contrast: 'The terms do not satisfy a(n) = a(n−1) + a(n−2) themselves (25 + 64 is not 169); only the roots do.',
    edge: 'F(n)·F(n+1) equals the running sum of the squares: 1, 2, 6, 15, 40 = 1, 1+1, 1+1+4, … Both descriptions give the same next term.',
  },
});
