import { family, q, L, list, diffsQ } from '../lib.js';

const T = (m) => (m * (m + 1)) / 2;

export default family({
  id: 'triangular',
  title: 'Triangular numbers',
  skill: 'Recognise 1, 3, 6, 10, 15, 21, 28, 36, 45, 55 and simple multiples or shifts of them',
  levels: [1, 2],
  show: 5,
  missing: 1,
  params: (rng, d) => (d === 1 ? { s: rng.int(1, 7), k: 1, c: 0 } : { s: rng.int(1, 7), k: rng.pick([2, 3]), c: rng.int(-5, 5) }),
  terms: ({ s, k, c }, n) => Array.from({ length: n }, (_, i) => q(k * T(i + s) + c)),
  rule: ({ k, c }) => `${k === 1 ? '' : `${k}·`}T(m)${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} with T(m) = m(m+1)/2`,
  explain: ({ k, c, s }, { shown }) => [
    { say: `Gaps: ${list(diffsQ(shown))}: they go up by ${k} each time.`, why: `Triangular numbers add 1, 2, 3, …; a multiple k·T adds k, 2k, 3k, …` },
    { say: `${k === 1 && !c ? 'These are' : `${c ? `Subtract ${c}${k > 1 ? ` and divide by ${k}` : ''}` : `Divide by ${k}`}:`} triangular numbers T(${s}) … T(${s + shown.length - 1}) = ${shown.map((_, i) => T(i + s)).join(', ')}.`, why: 'T(m) = 1 + 2 + … + m = m(m + 1)/2.' },
  ],
  compute: ({ k, c, s }, all, kk) => `T(${kk + s}) = ${kk + s}×${kk + s + 1}/2 = ${T(kk + s)}, so term ${kk + 1} = ${k === 1 ? '' : `${k} × `}${T(kk + s)}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(all[kk])}.`,
  rivals: ({ k, c, s }, { shown }) => {
    const m = shown.length + s;
    return [
      { value: q(k * m * m + c), misconception: `Used ${m}² instead of the triangular number ${m}×${m + 1}/2.` },
      { value: q(k * T(m) + c + k), misconception: `Added one step too many to the gap (${k * (m + 1)} instead of ${k * m}).` },
      { value: q(k * T(m)), misconception: c ? `Found the triangular part but dropped the ${c < 0 ? '−' : '+'}${Math.abs(c)}.` : 'Duplicate' },
    ].filter((r) => c || r.misconception !== 'Duplicate');
  },
  hints: () => ['Write the gaps.', 'The gaps count up. Which famous numbers add 1, 2, 3, 4, …?'],
  anchor: 'Counting 1, 2, 3, … and adding them up as you go: the triangular numbers are running totals of the counting numbers.',
  srule: 'Gaps 1, 2, 3, … (or k, 2k, 3k) → triangular numbers; T(m) = m(m + 1)/2.',
  lesson: {
    purpose: 'Triangular numbers appear on their own and inside other rules (handshakes, sums). Recognising them is instant once you know the list.',
    anchor: 'The counting numbers, with one change: keep a running total.',
    steps: [
      { say: 'Write the gaps; if they are the counting numbers (or a multiple of them), you have triangular numbers.', why: 'T(m) − T(m − 1) = m.' },
      { say: 'Next term = last + next gap, or T(m) = m(m + 1)/2 directly.', why: 'Either route gives the same value; the formula is faster for large m.' },
    ],
    predict: { question: '10, 15, 21, 28, 36, ? Predict.', answer: '45: gaps 5, 6, 7, 8, so 9 next.' },
    rule: 'Gaps 1, 2, 3, … (or k, 2k, 3k) → triangular numbers; T(m) = m(m + 1)/2.',
    contrast: 'Squares have odd gaps 1, 3, 5, 7; triangular numbers have gaps 1, 2, 3, 4. Two consecutive triangular numbers add to a square.',
    edge: 'Doubling a triangular number gives m(m + 1): 2, 6, 12, 20, the products of neighbours.',
  },
});
