import { family, q, L } from '../lib.js';

const ds = (v) => String(v).split('').reduce((a, b) => a + +b, 0);
const dp = (v) => String(v).split('').reduce((a, b) => a * +b, 1);
const F = { sum: ds, prod: dp };
const W = { sum: 'digit sum', prod: 'digit product' };
// Starts (2 or 3 digits) whose first 7 terms (6 shown + the answer) contain no 0 digit.
// Only 6 two-digit starts qualify, so 3-digit starts are included: 98 in total.
const PROD_STARTS = [];
for (let a = 10; a <= 999; a++) {
  let v = a, ok = true;
  for (let i = 0; i < 7 && ok; i++) { ok = !String(v).includes('0'); v += dp(v); }
  if (ok) PROD_STARTS.push(a);
}
if (PROD_STARTS.length < 50) throw new Error(`digit-sum: only ${PROD_STARTS.length} product starts`);

export default family({
  id: 'digit-sum',
  title: 'Add the digit sum (or product)',
  skill: 'When gaps are small, irregular and track the digits, test "add the sum of the digits"',
  levels: [3, 4],
  view: 'table',
  show: 6,
  // Digit products: most starts reach a number containing 0 within a few terms
  // (product 0, the sequence stalls), so draw only from PROD_STARTS.
  params: (rng, d) => (d === 3 ? { a: rng.int(10, 99), f: 'sum' } : { a: rng.pick(PROD_STARTS), f: 'prod' }),
  accept: ({ f }, xs) => xs.every((v, i) => i === 0 || !v.eq(xs[i - 1])) && (f === 'sum' || xs.every((v) => !String(v.toNumber()).includes('0'))),
  terms: ({ a, f }, n) => { const out = [a]; while (out.length < n) out.push(out[out.length - 1] + F[f](out[out.length - 1])); return out.map((v) => q(v)); },
  rule: ({ f }) => `a(n) = a(n−1) + ${W[f]} of a(n−1)`,
  explain: ({ f }, { shown }) => [
    { say: `Gaps: ${shown.slice(1).map((v, i) => L(v.sub(shown[i]))).join(', ')}: irregular, and small compared with the terms.`, why: 'Small gaps that jump around without a pattern of their own often come from the digits.' },
    { say: `Each gap is the ${W[f]} of the term before: ${L(shown[1])} → ${String(shown[1].toNumber()).split('').join(f === 'sum' ? ' + ' : ' × ')} = ${F[f](shown[1].toNumber())}.`, why: 'Check the digit rule on every gap; one coincidence is not a rule.' },
  ],
  compute: ({ f }, all, k) => { const v = all[k - 1].toNumber(); return `${W[f]} of ${v} = ${String(v).split('').join(f === 'sum' ? ' + ' : ' × ')} = ${F[f](v)}; term ${k + 1} = ${v} + ${F[f](v)} = ${L(all[k])}.`; },
  rivals: ({ f }, { shown }) => {
    const n = shown.length, a = shown[n - 1].toNumber(), b = shown[n - 2].toNumber();
    const other = f === 'sum' ? 'prod' : 'sum';
    return [
      { value: q(a + F[f](b)), misconception: `Added the ${W[f]} of the previous term (${b}) instead of the last term (${a}).` },
      { value: q(a + F[other](a)), misconception: `Added the ${W[other]} of ${a}; the gaps match the ${W[f]}.` },
      { value: q(a + F[f](a) + 1), misconception: `Off by one: the ${W[f]} of ${a} is ${F[f](a)}.` },
    ];
  },
  hints: () => ['The gaps are small and irregular. Compare each gap with the digits of the term before it.', `Add up (or multiply) the digits of a term: does that give the next gap?`],
  anchor: 'Arithmetic sequences add a fixed number; here the number added is computed from the current term\'s digits.',
  srule: 'Gaps equal the digit sum (product) of the previous term → next = last + digitsum(last).',
  lesson: {
    purpose: 'Digit rules resist every difference and ratio test. Recognising the symptom (small, patternless gaps) avoids burning a minute on algebra.',
    anchor: 'An arithmetic step "add d", with one change: d is recomputed from the digits of the current term.',
    steps: [
      { say: 'If the gaps are small, irregular and never settle, compare each gap with the digits of the term before it.', why: 'Digit sums stay small and fluctuate, exactly the symptom.' },
      { say: 'Next = last + digit sum (or product) of last.', why: 'The rule reads only the current term.' },
    ],
    predict: { question: '15, 21, 24, 30, 33, ? Predict.', answer: '39: digit sum of 33 is 6.' },
    rule: 'Gaps equal the digit sum (product) of the previous term → next = last + digitsum(last).',
    contrast: 'Periodic gaps (3, 6, 3, 6) can mimic a digit rule for a few terms; the digit rule breaks the period as soon as a carry changes the digits.',
    edge: 'A digit product with a 0 in the number adds 0 and the sequence stalls, so test writers avoid zeros for product rules.',
  },
});
