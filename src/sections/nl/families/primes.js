import { family, q, L, PRIMES } from '../lib.js';

const isPrime = (n) => n > 1 && PRIMES.every((p) => p * p > n || n % p);
const f = ({ al, be, sq }, p) => (sq ? p * p : al * p + be);
const nextOddComposite = (p) => { for (let v = p + 2; ; v += 2) if (!isPrime(v)) return v; };

export default family({
  id: 'primes',
  title: 'Prime numbers and their transforms',
  skill: 'Know the primes to 100; test 2p ± c and p² when terms are near primes',
  levels: [2, 3],
  view: 'table',
  show: (d) => (d === 2 ? 6 : 5),
  params: (rng, d) => {
    if (d === 2) return { s: rng.int(0, 10), al: 1, be: 0, sq: false };
    return rng.pick([
      { s: rng.int(0, 8), al: rng.pick([2, 3]), be: rng.int(-3, 5), sq: false },
      { s: rng.int(1, 9), al: 1, be: rng.pick([-1, 1, 2, 3, -3]), sq: false },
      { s: rng.int(0, 4), al: 1, be: 0, sq: true },
    ]);
  },
  terms: (p, n) => Array.from({ length: n }, (_, i) => q(f(p, PRIMES[p.s + i]))),
  rule: ({ al, be, sq }) => (sq ? 'squares of consecutive primes' : `${al === 1 ? '' : `${al}·`}p ${be < 0 ? '−' : '+'} ${Math.abs(be)} over consecutive primes p`),
  explain: (p, { shown }) => [
    { say: `Gaps are irregular (${shown.slice(1).map((v, i) => L(v.sub(shown[i]))).join(', ')}) and no ratio or difference layer is constant.`, why: 'Irregular gaps that never settle are the signature of primes.' },
    { say: `${p.sq ? 'Square roots' : p.al === 1 && p.be === 0 ? 'The terms themselves' : `Undo the transform (subtract ${p.be}, divide by ${p.al})`}: ${PRIMES.slice(p.s, p.s + shown.length).join(', ')}, consecutive primes.`, why: 'Once the transform is removed, the primes are recognisable.' },
  ],
  compute: (p, all, k) => `The next prime is ${PRIMES[p.s + k]}, so term ${k + 1} = ${p.sq ? `${PRIMES[p.s + k]}²` : p.al === 1 && p.be === 0 ? `${PRIMES[p.s + k]}` : `${p.al === 1 ? '' : `${p.al} × `}${PRIMES[p.s + k]} ${p.be < 0 ? '−' : '+'} ${Math.abs(p.be)}`} = ${L(all[k])}.`,
  rivals: (p, { shown }) => {
    const last = PRIMES[p.s + shown.length - 1], nxt = PRIMES[p.s + shown.length], comp = nextOddComposite(last);
    const out = [{ value: q(f(p, PRIMES[p.s + shown.length + 1])), misconception: `Skipped a prime: after ${last} comes ${nxt}, not ${PRIMES[p.s + shown.length + 1]}.` }];
    if (comp < nxt) out.push({ value: q(f(p, comp)), misconception: `Used ${comp}, which is odd but not prime (${comp} = ${PRIMES.find((d) => comp % d === 0)} × ${comp / PRIMES.find((d) => comp % d === 0)}).` });
    out.push({ value: q(f(p, last + 2)), misconception: `Assumed the primes step by 2 (${last} → ${last + 2}); prime gaps vary.` });
    return out;
  },
  hints: () => ['The gaps never settle into a pattern. Which famous list has irregular gaps?', 'Undo any simple transform (subtract a constant, halve, square-root) and look for primes.'],
  anchor: 'Primes are a list you already know; this family changes at most one thing: each prime may be doubled, shifted or squared.',
  srule: 'Irregular gaps that never settle → primes; undo the transform, take the next prime.',
  lesson: {
    purpose: 'Primes have no formula, so no difference table finds them. They must be recognised, and 2p + 1 or p² disguises are common.',
    anchor: 'The primes 2, 3, 5, 7, 11, 13, … with one optional modification applied to each (×2, +c, squared).',
    steps: [
      { say: 'If differences and ratios never settle, suspect primes.', why: 'Prime gaps are irregular by nature.' },
      { say: 'Undo the transform, read the primes, apply the transform to the next prime.', why: 'The transform is the same for every term.' },
    ],
    predict: { question: '5, 7, 11, 13, 17, 19, ? Predict.', answer: '23: consecutive primes.' },
    rule: 'Irregular gaps that never settle → primes; undo the transform, take the next prime.',
    contrast: 'Odd numbers step by 2 forever; primes skip the odd composites 9, 15, 21, 25, 27, 33, 35, 39, 45, 49, …',
    edge: '2 is the only even prime; lists starting 2, 3, 5 have a gap of 1 first.',
  },
});
