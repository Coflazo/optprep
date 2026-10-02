import { Q } from '../../../core/rational.js';
import { family, label, FIB } from '../lib.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];
const SEQ = {
  arith: (a, d) => (i) => a + i * d,
  geo: (a, r) => (i) => a * r ** i,
  sq: (s) => (i) => (i + s) ** 2,
  prime: (s) => (i) => PRIMES[i + s],
  fib: (s) => (i) => FIB[i + s],
};
const say = { arith: (a, d) => `add ${d}`, geo: (a, r) => `multiply by ${r}`, sq: () => 'consecutive squares', prime: () => 'consecutive primes', fib: () => 'Fibonacci numbers' };

export default family({
  id: 'fractions',
  title: 'Fractions: numerator and denominator rules',
  skill: 'Split each fraction into numerator and denominator and solve the two sequences separately',
  levels: [3, 4, 5],
  view: 'parts',
  show: 5,
  display: 'frac',
  params: (rng, d) => {
    if (d === 3) return { num: ['arith', rng.int(1, 5), rng.int(1, 4)], den: ['arith', rng.int(2, 9), rng.int(1, 5)] };
    if (d === 4) return rng.pick([
      { num: ['arith', rng.int(1, 7), rng.pick([1, 2, 3])], den: ['geo', rng.int(2, 3), 2] },
      { num: ['sq', rng.int(1, 3)], den: ['arith', rng.int(2, 9), rng.int(2, 5)] },
    ]);
    return rng.pick([
      { num: ['fib', rng.int(1, 4)], den: ['fib', 0], fibPair: true },
      { num: ['prime', rng.int(0, 3)], den: ['sq', rng.int(2, 4)] },
    ]);
  },
  accept: (p, xs) => xs.every((x) => x.d !== 1n && x.n > 0n),
  terms: (p, n) => {
    const N = SEQ[p.num[0]](...p.num.slice(1)), D = p.fibPair ? (i) => FIB[i + p.num[1] + 1] : SEQ[p.den[0]](...p.den.slice(1));
    const out = [];
    for (let i = 0; i < n; i++) { const a = N(i), b = D(i); if (gcd(a, b) !== 1 || b <= 1) return null; out.push(Q.of(a, b)); }
    return out;
  },
  rule: (p) => (p.fibPair ? 'consecutive Fibonacci numbers over the next one' : `numerators: ${say[p.num[0]](...p.num.slice(1))}; denominators: ${say[p.den[0]](...p.den.slice(1))}`),
  explain: (p, { shown }) => [
    { say: `Numerators: ${shown.map((x) => x.n).join(', ')}; denominators: ${shown.map((x) => x.d).join(', ')}.`, why: 'Fraction sequences are usually two integer sequences glued together; the fraction values themselves rarely follow a simple rule.' },
    { say: p.fibPair ? 'Both rows are Fibonacci numbers, and each denominator becomes the next numerator.' : `Numerators ${say[p.num[0]](...p.num.slice(1))}; denominators ${say[p.den[0]](...p.den.slice(1))}.`, why: 'Solve each row as an ordinary sequence.' },
  ],
  math: (p, all, k) => `top ${all[k - 1].n} → ${all[k].n}, bottom ${all[k - 1].d} → ${all[k].d}`,
  compute: (p, all, k) => `Next numerator ${all[k].n}, next denominator ${all[k].d}: ${label(all[k], 'frac')} (already in lowest terms).`,
  rivals: (p, { shown, next, after }) => {
    const n = shown.length, a = shown[n - 1], b = shown[n - 2];
    return [
      { value: Q.of(Number(next.n), Number(a.d)), misconception: 'Advanced the numerator but kept the old denominator; both rows move.' },
      { value: Q.of(Number(a.n), Number(next.d)), misconception: 'Advanced the denominator but kept the old numerator; both rows move.' },
      { value: Q.of(Number(a.n + b.n), Number(a.d + b.d)), misconception: 'Added the last two numerators and the last two denominators (the mediant); the rows follow their own rules instead.' },
      ...(after ? [{ value: Q.of(Number(after.n), Number(next.d)), misconception: 'Moved the numerator two steps and the denominator one; both rows advance by exactly one step.' }] : []),
    ];
  },
  hints: () => ['Write the numerators as one list and the denominators as another.', 'Solve each list on its own, then recombine.'],
  anchor: 'Two ordinary integer sequences you already know how to solve, with one change: they are written as numerator over denominator.',
  srule: 'Fractions → solve numerators and denominators separately, then recombine.',
  lesson: {
    purpose: 'Fractions look intimidating but are usually two easy sequences. The only trap is trying to find a rule for the values.',
    anchor: 'Two integer sequences, displayed as one fraction per position.',
    steps: [
      { say: 'Split into a numerator row and a denominator row.', why: 'Each row is built by its own rule; the fraction is just the display.' },
      { say: 'Extend both rows by one and recombine.', why: 'The next fraction is (next numerator)/(next denominator).' },
    ],
    predict: { question: '1/2, 2/3, 3/5, 5/8, 8/13, ? Predict.', answer: '13/21: both rows are Fibonacci numbers.' },
    rule: 'Fractions → solve numerators and denominators separately, then recombine.',
    contrast: 'Sometimes the fraction values do follow a rule (1/2, 1/4, 1/8 halve each time); test that only after the split fails.',
    edge: 'If a fraction could reduce (2/4), test writers keep it unreduced on purpose; these items use fractions already in lowest terms so the rows are unambiguous.',
  },
});
