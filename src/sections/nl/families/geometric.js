import { Q } from '../../../core/rational.js';
import { family, q, label, list, ratiosQ, MINUS } from '../lib.js';

const rs = (r) => (r.d === 1n ? label(r) : `${label(r, 'frac')}`);

export default family({
  id: 'geometric',
  title: 'Constant ratio',
  skill: 'When gaps grow fast, divide neighbours: a constant ratio means multiply by the same number',
  levels: [1, 2],
  view: 'ratio',
  show: 5,
  missing: 1,
  params: (rng, d) => {
    if (d === 1) return { a: rng.int(1, 9), rn: rng.pick([2, 3]), rd: 1 };
    const kind = rng.int(0, 2);
    if (kind === 0) return { a: rng.int(1, 6), rn: rng.pick([4, 5]), rd: 1 };
    if (kind === 1) return { a: rng.int(1, 9) * rng.pick([1, -1]), rn: rng.pick([-2, -3]), rd: 1 };
    return { a: rng.pick([1, 3, 5, 7, 9]) * 64, rn: 1, rd: 2 };
  },
  terms: ({ a, rn, rd }, n) => Array.from({ length: n }, (_, i) => q(a).mul(Q.of(rn ** i, rd ** i))),
  rule: ({ a, rn, rd }) => `a(n) = ${a}·(${rd === 1 ? rn : `${rn}/${rd}`})^(n − 1)`,
  explain: ({ rn, rd }, { shown }) => [
    { say: `Gaps: ${list(shown.slice(1).map((v, i) => v.sub(shown[i])))}: not constant, and they grow with the terms.`, why: 'Gaps that scale with the terms point to multiplication, not addition.' },
    { say: `Ratios term ÷ previous: ${ratiosQ(shown).map(rs).join(', ')}.`, why: `Every ratio is ${rd === 1 ? rn : `${rn}/${rd}`}, the definition of a geometric sequence.` },
  ],
  compute: ({ rn, rd }, all, k) => `Term ${k + 1} = ${label(all[k - 1])} × ${rd === 1 ? (rn < 0 ? `(${MINUS}${-rn})` : rn) : `${rn}/${rd}`} = ${label(all[k])}.`,
  rivals: ({ rn, rd }, { shown }) => {
    const a = shown[shown.length - 1];
    if (rd === 2) return [{ value: a.mul(q(2)), misconception: 'Multiplied by 2 instead of halving: the terms shrink, so the ratio is 1/2.' }];
    if (rn < 0) return [
      { value: a.mul(q(-rn)), misconception: `Dropped the sign flip: the ratio is ${MINUS}${-rn}, so the sign alternates every step.` },
      { value: a.add(q(rn)), misconception: `Added ${rn} instead of multiplying by it.` },
    ];
    return [
      { value: a.add(q(rn)), misconception: `Added ${rn} instead of multiplying by ${rn}.` },
      { value: a.mul(q(rn + 1)), misconception: `Multiplied by ${rn + 1}: misread the constant ratio, which is ${rn}.` },
    ];
  },
  hints: () => ['The gaps grow as fast as the terms: try dividing instead of subtracting.', 'Is term ÷ previous term the same every time?'],
  anchor: 'Arithmetic sequences add the same number each step; a geometric sequence changes one thing: it multiplies by the same number.',
  srule: 'Constant ratio r → next = last × r.',
  lesson: {
    purpose: 'Doubling, tripling and halving show up constantly, and their gaps look irregular. Recognising a ratio stops you chasing the gaps.',
    anchor: 'Arithmetic: add d every step. Geometric: the same idea with one change, multiply by r every step.',
    steps: [
      { say: 'If the gaps grow in proportion to the terms, divide each term by the one before.', why: 'Multiplication makes the gap proportional to the current size, so the ratio is what stays fixed.' },
      { say: 'If every ratio equals r, the next term is last × r.', why: 'The rule that produced every step produces the next one.' },
    ],
    predict: { question: '5, −10, 20, −40, ? Predict the sign and size before computing.', answer: '80: the ratio is −2, so the sign flips and the size doubles.' },
    rule: 'Constant ratio r → next = last × r.',
    contrast: 'Geometric gaps are themselves geometric (3, 6, 12, 24 has gaps 3, 6, 12): if the gaps look like a scaled copy of the sequence, it is multiplication.',
    edge: 'r between 0 and 1 shrinks the terms (320, 160, 80); a negative r alternates signs; r = 1 is a constant sequence.',
  },
});
