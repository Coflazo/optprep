import { family, q, L, list, ratiosQ, nz, signed } from '../lib.js';

export default family({
  id: 'multiply-index',
  title: 'Multiply by the counting numbers',
  skill: 'Ratios 2, 3, 4, 5 mean the multiplier counts up (factorial growth)',
  levels: [2, 3],
  show: 5,
  params: (rng, d) => (d === 2 ? { a: rng.pick([1, 2, 3, 5]), s: rng.pick([1, 2]), c: 0 } : { a: rng.int(1, 4), s: rng.pick([0, 1]), c: nz(rng, -3, 3) }),
  terms: ({ a, s, c }, n) => { const out = [q(a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].mul(q(i + s)).add(q(c))); return out; },
  rule: ({ s, c }) => `multiply by ${1 + s}, ${2 + s}, ${3 + s}, …${c ? `, then ${c < 0 ? 'subtract' : 'add'} ${Math.abs(c)}` : ''}`,
  explain: ({ s, c }, { shown }) => (c === 0
    ? [
      { say: `Ratios: ${ratiosQ(shown).map(L).join(', ')}.`, why: 'Gaps grow too fast for addition, so divide neighbours.' },
      { say: 'The multiplier goes up by 1 each step.', why: 'A counting multiplier is factorial-style growth.' },
    ]
    : [
      { say: `Ratios are near ${1 + s + 1}, ${2 + s + 1}, … but not whole: gaps ${list(shown.slice(1).map((v, i) => v.sub(shown[i])))} are not a clean pattern either.`, why: 'Near-whole ratios that increase suggest a counting multiplier plus a small constant.' },
      { say: `term = (step number) × previous ${signed(c)}: e.g. ${3 + s} × ${L(shown[2])} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(shown[3])}.`, why: 'Subtracting the multiplied part leaves the same constant every step.' },
    ]),
  compute: ({ s, c }, all, k) => `Term ${k + 1} = ${k + s} × ${L(all[k - 1])}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(all[k])}.`,
  rivals: ({ s, c }, { shown }) => {
    const n = shown.length, a = shown[n - 1], m = n + s;
    const out = [
      { value: a.mul(q(m - 1)).add(q(c)), misconception: `Reused the last multiplier ${m - 1}; the multiplier rises to ${m}.` },
      { value: a.mul(q(m + 1)).add(q(c)), misconception: `Jumped the multiplier to ${m + 1}; it rises by 1 each step, so it is ${m}.` },
    ];
    if (c) out.push({ value: a.mul(q(m)), misconception: `Used the right multiplier ${m} but dropped the ${signed(c)}.` });
    return out;
  },
  hints: () => ['Divide each term by the one before.', 'What happens to the multiplier from step to step?'],
  anchor: 'Geometric: multiply by the same r each step. The one change: the multiplier itself counts up 2, 3, 4, …',
  srule: 'Ratios count up → next = last × (next multiplier).',
  lesson: {
    purpose: 'Factorials and their cousins (×2, ×3, ×4, …) grow faster than any geometric sequence; spotting the counting ratio is instant once you look for it.',
    anchor: 'A geometric sequence multiplies by a fixed r. Here r is replaced by the step number.',
    steps: [
      { say: 'Divide neighbours and list the ratios.', why: 'Multiplicative rules show up in ratios, not in gaps.' },
      { say: 'If the ratios are 2, 3, 4, …, the next ratio is one more than the last.', why: 'The multiplier follows the counting numbers.' },
    ],
    predict: { question: '3, 3, 6, 18, 72, ? Predict the next ratio.', answer: 'Ratios 1, 2, 3, 4, so the next is ×5: 360.' },
    rule: 'Ratios count up → next = last × (next multiplier).',
    contrast: 'Adding the counting numbers gives slow quadratic growth; multiplying by them gives factorial growth.',
    edge: 'With a constant added (a(n) = n·a(n−1) + 1: 1, 2, 5, 16, 65) the ratios are only near whole; subtract the multiplied part to see the constant.',
  },
});
