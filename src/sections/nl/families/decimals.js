import { Q } from '../../../core/rational.js';
import { family, label, list, diffsQ, ratiosQ } from '../lib.js';

const D = (x) => label(x, 'dec');

export default family({
  id: 'decimals',
  title: 'Decimal sequences',
  skill: 'Apply the same difference and ratio tests; the decimal point changes nothing but the bookkeeping',
  levels: [2, 3],
  view: 'table',
  show: 5,
  display: 'dec',
  params: (rng, d) => (d === 2
    ? { k: 'quad', a: rng.int(1, 12), g: rng.int(1, 4), s: rng.pick([1, 2]) }
    : rng.pick([
      { k: 'geo', a: 16 * rng.int(1, 3), rn: 3, rd: 2 },
      { k: 'geo', a: rng.pick([3, 5, 7, 9, 11]), rn: 1, rd: 2 },
      { k: 'geo', a: 8 * rng.int(1, 3), rn: 5, rd: 2 },
      { k: 'geo', a: 125 * rng.int(1, 4), rn: 1, rd: 5 },
    ])),
  terms: (p, n) => Array.from({ length: n }, (_, i) => (p.k === 'quad'
    ? Q.of(p.a, 4).add(Q.of(p.g * i, 4)).add(Q.of(p.s * i * (i - 1), 8))
    : Q.of(p.a * p.rn ** i, p.rd ** i))),
  rule: (p) => (p.k === 'quad' ? `gaps start at ${p.g / 4} and grow by ${p.s / 4}` : `multiply by ${p.rn / p.rd}`),
  explain: (p, { shown }) => (p.k === 'quad'
    ? [
      { say: `Gaps: ${list(diffsQ(shown), 'dec')}.`, why: 'Subtract neighbours, keeping the decimals exact.' },
      { say: `The gaps grow by ${p.s / 4} each time.`, why: 'Constant second difference, exactly as with whole numbers.' },
    ]
    : [
      { say: `Gaps (${list(diffsQ(shown), 'dec')}) are not constant; ratios are ${ratiosQ(shown).map(D).join(', ')}.`, why: 'Scaling gaps point to a ratio; dividing neighbours confirms it.' },
      { say: `Every ratio is ${p.rn / p.rd}.`, why: 'A constant ratio is geometric, whatever the decimals look like.' },
    ]),
  compute: (p, all, k) => (p.k === 'quad'
    ? `Next gap ${D(all[k].sub(all[k - 1]))}; term ${k + 1} = ${D(all[k - 1])} + ${D(all[k].sub(all[k - 1]))} = ${D(all[k])}.`
    : `Term ${k + 1} = ${D(all[k - 1])} × ${p.rn / p.rd} = ${D(all[k])}.`),
  rivals: (p, { next }) => [
    { value: next.mul(Q.of(10)), misconception: 'Decimal point slip: right digits, but ten times too large.' },
    { value: next.div(Q.of(10)), misconception: 'Decimal point slip: right digits, but ten times too small.' },
  ],
  hints: () => ['Treat the decimals exactly like whole numbers: subtract neighbours first.', 'If the gaps scale with the terms, divide neighbours instead.'],
  anchor: 'Whole-number sequences with one change: the terms carry decimals. The tests (gaps, ratios) are identical.',
  srule: 'Decimals change the arithmetic, not the method: gaps first, then ratios.',
  lesson: {
    purpose: 'Decimal items test whether you keep the method under messier arithmetic. The calculator is allowed; use it for the multiplication, not for the pattern.',
    anchor: 'The same difference and ratio tests as for integers, with one change: the numbers carry decimals.',
    steps: [
      { say: 'Subtract neighbours; if the gaps have a pattern, extend it.', why: 'Differences work the same with decimals.' },
      { say: 'If the gaps scale with the terms, divide neighbours: ratios such as 1.5, 0.5 or 2.5 are common.', why: 'A fractional ratio still makes a geometric sequence.' },
    ],
    predict: { question: '16, 24, 36, 54, 81, ? Predict.', answer: '121.5 (×1.5 each time).' },
    rule: 'Decimals change the arithmetic, not the method: gaps first, then ratios.',
    contrast: 'A ratio below 1 shrinks the terms (7, 3.5, 1.75); a ratio above 1 with a fractional part (×1.5) produces decimals only after a few terms.',
    edge: 'Watch the place value: 0.875 × 0.5 = 0.4375, not 0.04375. Estimate the size before choosing.',
  },
});
