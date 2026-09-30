import { family, q, L, nz, MINUS } from '../lib.js';

export default family({
  id: 'alternating-signs',
  title: 'Alternating signs',
  skill: 'Separate sign from size: solve the sizes, then restore the alternating sign',
  levels: [2, 3],
  show: 6,
  params: (rng, d) => (d === 2
    ? rng.pick([{ k: 'sq', s: rng.int(1, 6), e: rng.pick([0, 1]) }, { k: 'lin', a: rng.int(1, 9), d: rng.int(2, 7), e: rng.pick([0, 1]) }])
    : { k: 'aff', a: rng.int(1, 6), m: rng.pick([2, 3]), c: nz(rng, -5, 5) }),
  accept: (p, xs) => xs.every((v) => !v.isZero()),
  terms: (p, n) => {
    if (p.k === 'aff') { const out = [q(p.a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].mul(q(-p.m)).add(q(p.c))); return out; }
    return Array.from({ length: n }, (_, i) => q((-1) ** (i + p.e) * (p.k === 'sq' ? (i + p.s) ** 2 : p.a + i * p.d)));
  },
  rule: (p) => (p.k === 'aff' ? `a(n) = ${MINUS}${p.m}·a(n−1) ${p.c < 0 ? '−' : '+'} ${Math.abs(p.c)}` : p.k === 'sq' ? 'signs alternate; sizes are consecutive squares' : `signs alternate; sizes go up by ${p.d}`),
  explain: (p, { shown }) => (p.k === 'aff'
    ? [
      { say: `Signs alternate and sizes grow about ${p.m}× per step (${shown.slice(1, 4).map((v, i) => (v.toNumber() / shown[i].toNumber()).toFixed(2)).join(', ')}).`, why: `A ratio near ${MINUS}${p.m} means multiply by ${MINUS}${p.m} plus a small correction.` },
      { say: `${MINUS}${p.m} × each term leaves ${p.c < 0 ? MINUS : '+'}${Math.abs(p.c)} every time (e.g. ${MINUS}${p.m} × ${L(shown[2])} ${p.c < 0 ? '−' : '+'} ${Math.abs(p.c)} = ${L(shown[3])}).`, why: 'The leftover after the multiplication is the constant.' },
    ]
    : [
      { say: `Signs alternate. Sizes: ${shown.map((v) => L(v.n < 0n ? v.neg() : v)).join(', ')}.`, why: 'Strip the sign and solve the sizes as an ordinary sequence.' },
      { say: p.k === 'sq' ? 'The sizes are consecutive squares.' : `The sizes go up by ${p.d}.`, why: 'Then put the alternating sign back on.' },
    ]),
  compute: (p, all, k) => (p.k === 'aff'
    ? `Term ${k + 1} = ${MINUS}${p.m} × ${L(all[k - 1])} ${p.c < 0 ? '−' : '+'} ${Math.abs(p.c)} = ${L(all[k])}.`
    : `The next size is ${L(all[k].n < 0n ? all[k].neg() : all[k])} and the previous sign was ${all[k - 1].n < 0n ? 'negative' : 'positive'}, so term ${k + 1} = ${L(all[k])}.`),
  rivals: (p, { shown, next }) => {
    const a = shown[shown.length - 1];
    const out = [{ value: next.neg(), misconception: 'Right size, wrong sign: the signs alternate, so check the sign of the last term.' }];
    if (p.k === 'aff') {
      out.push({ value: a.mul(q(p.m)).add(q(p.c)), misconception: `Multiplied by +${p.m} instead of ${MINUS}${p.m}: the sign must flip every step.` });
      out.push({ value: a.mul(q(-p.m)), misconception: `Multiplied by ${MINUS}${p.m} but forgot the ${p.c < 0 ? MINUS : '+'}${Math.abs(p.c)}.` });
    } else {
      const sz = next.n < 0n ? next.neg() : next;
      out.push({ value: next.n < 0n ? sz.add(q(p.k === 'sq' ? 2 * (shown.length + p.s) + 1 : p.d)).neg() : sz.add(q(p.k === 'sq' ? 2 * (shown.length + p.s) + 1 : p.d)), misconception: 'Skipped a size: this uses the size after the next one.' });
    }
    return out;
  },
  hints: () => ['Ignore the signs for a moment. What do the sizes do?', 'Solve the sizes, then decide the sign from the pattern.'],
  anchor: 'Ordinary sequences with one change: every other term is negated.',
  srule: 'Signs alternate → solve |terms|, then flip the sign of the last term.',
  lesson: {
    purpose: 'Alternating signs make gaps swing wildly (+5, −13, +21). Separating sign from size removes the noise.',
    anchor: 'Any sequence you already know, with one modification: multiply every other term by −1.',
    steps: [
      { say: 'Strip the signs and solve the sizes.', why: 'The sign pattern and the size pattern are independent pieces.' },
      { say: 'Put the sign back: opposite to the last term.', why: 'An alternating sign flips every step.' },
    ],
    predict: { question: '1, −4, 9, −16, 25, ? Predict sign and size.', answer: '−36: sizes are squares, and the sign flips.' },
    rule: 'Signs alternate → solve |terms|, then flip the sign of the last term.',
    contrast: 'A negative ratio (×−2) also alternates signs, but there the size grows geometrically; separate sign and size in both cases.',
    edge: 'If the rule is "×(−m) + c", the sizes are not a clean sequence; test the multiplication with the sign included.',
  },
});
