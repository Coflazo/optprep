import { family, q, L, nz, signed } from '../lib.js';

export default family({
  id: 'sum-previous',
  title: 'Sum of previous terms plus a constant',
  skill: 'When a sum-of-previous rule is off by the same amount every step, that amount is part of the rule',
  levels: [3, 4],
  view: 'table',
  show: (d) => (d === 3 ? 6 : 7),
  params: (rng, d) => ({ k: d === 3 ? 2 : 3, c: nz(rng, -4, 4), s: Array.from({ length: d === 3 ? 2 : 3 }, () => rng.int(1, 6)) }),
  terms: ({ k, c, s }, n) => { const out = s.map((v) => q(v)); while (out.length < n) { const m = out.length; let t = q(c); for (let j = 1; j <= k; j++) t = t.add(out[m - j]); out.push(t); } return out.slice(0, n); },
  rule: ({ k, c }) => `each term = sum of the previous ${k === 2 ? 'two' : 'three'} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`,
  explain: ({ k, c }, { shown }) => {
    const i = shown.length - 1, parts = shown.slice(i - k, i);
    return [
      { say: `Sum of the previous ${k === 2 ? 'two' : 'three'} misses by ${signed(c)}: ${parts.map(L).join(' + ')} = ${L(parts.reduce((a, b) => a.add(b)))}, actual ${L(shown[i])}.`, why: 'Test the sum rule and measure the miss rather than abandoning it.' },
      { say: `The miss is ${signed(c)} at every step.`, why: 'A constant miss is a constant term in the rule, not a coincidence.' },
    ];
  },
  compute: ({ k, c }, all, kk) => `Term ${kk + 1} = ${all.slice(kk - k, kk).map(L).join(' + ')} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(all[kk])}.`,
  rivals: ({ k, c }, { shown }) => {
    const n = shown.length, sum = shown.slice(n - k).reduce((a, b) => a.add(b));
    return [
      { value: sum, misconception: `Summed the previous ${k === 2 ? 'two' : 'three'} but dropped the constant ${signed(c)}.` },
      { value: sum.sub(q(c)), misconception: `Used ${signed(-c)} instead of ${signed(c)}; check the sign of the miss.` },
      { value: sum.add(q(c)).add(shown[n - k - 1]), misconception: `Summed ${k + 1} previous terms instead of ${k}.` },
    ];
  },
  hints: () => ['Try "sum of the previous two". How far off is it?', 'Is the miss the same every step?'],
  anchor: 'Fibonacci or tribonacci, with one change: add a fixed constant after summing.',
  srule: 'Sum rule off by a constant c every time → next = sum + c.',
  lesson: {
    purpose: 'The near-miss is the clue: a sum rule that is always off by 1 is a sum rule plus 1. Candidates who drop a rule at the first miss lose these items.',
    anchor: 'Fibonacci-like sequences add the previous two; this family adds a constant on top.',
    steps: [
      { say: 'Test the obvious sum rule and write down the miss at each step.', why: 'If the misses are equal, the rule is right up to a constant.' },
      { say: 'Next = sum of the previous terms + the constant miss.', why: 'The constant is part of every step, including the next one.' },
    ],
    predict: { question: '1, 2, 4, 7, 12, 20, ? (sum of previous two, then +1)', answer: '33 = 12 + 20 + 1.' },
    rule: 'Sum rule off by a constant c every time → next = sum + c.',
    contrast: 'If the misses grow (1, 2, 3, …) the extra term depends on the position, not a constant; treat the misses as their own sequence.',
    edge: 'A negative constant can make early terms shrink or repeat; the rule still holds from the third term.',
  },
});
