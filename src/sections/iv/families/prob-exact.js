import { Q } from '../../../core/rational.js';
import { nCr } from '../../../core/combinatorics.js';
import { ivItem, range } from '../lib.js';

const pct = (q) => q.toNumber() * 100;
const ways2 = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const PRIMES = new Set([2, 3, 5, 7, 11]);

// Each scenario: params(rng) -> p; text; steps; enumerate(p) -> probability by brute force.
const S = {
  sumEq: {
    level: 1,
    make: (rng) => ({ s: rng.int(3, 11) }),
    text: ({ s }) => `Two fair six-sided dice are thrown. What is the probability, in percent, that the sum is exactly ${s}?`,
    p: ({ s }) => Q.of(ways2(s), 36),
    steps: ({ s }) => [{ say: `Ordered pairs with sum ${s}: 6 − |${s} − 7| = ${ways2(s)} of 36.`, why: 'Two dice have 36 equally likely ordered outcomes; the count peaks at 7.' }],
    brute: ({ s }) => count2((a, b) => a + b === s),
  },
  sumAtLeast: {
    level: 1,
    make: (rng) => ({ k: rng.int(4, 11) }),
    text: ({ k }) => `Two fair six-sided dice are thrown. What is the probability, in percent, that the sum is at least ${k}?`,
    p: ({ k }) => Q.of(range(k, 12).reduce((n, s) => n + ways2(s), 0), 36),
    steps: ({ k }) => [{ say: `Count ordered pairs for sums ${k} to 12: ${range(k, 12).map(ways2).join(' + ')} = ${range(k, 12).reduce((n, s) => n + ways2(s), 0)} of 36.`, why: '"At least" includes the sum itself.' }],
    brute: ({ k }) => count2((a, b) => a + b >= k),
  },
  anyHead: {
    level: 1,
    make: (rng) => ({ n: rng.int(2, 7) }),
    text: ({ n }) => `A fair coin is tossed ${n} times. What is the probability, in percent, of at least one head?`,
    p: ({ n }) => Q.of(1).sub(Q.of(1, 2 ** n)),
    steps: ({ n }) => [{ say: `P(no head) = (1/2)^${n} = 1/${2 ** n}, so P(at least one) = 1 − 1/${2 ** n}.`, why: '"At least one" is easiest through its complement, "none".' }],
    brute: ({ n }) => { let c = 0; for (let m = 0; m < 2 ** n; m++) if (m) c++; return c / 2 ** n; },
  },
  exactHeads: {
    level: 1,
    make: (rng) => { const n = rng.int(3, 8); return { n, k: rng.int(1, n - 1) }; },
    text: ({ n, k }) => `A fair coin is tossed ${n} times. What is the probability, in percent, of exactly ${k} heads?`,
    p: ({ n, k }) => Q.of(Number(nCr(n, k)), 2 ** n),
    steps: ({ n, k }) => [{ say: `C(${n}, ${k}) = ${nCr(n, k)} sequences have exactly ${k} heads, out of 2^${n} = ${2 ** n}.`, why: 'Each sequence of tosses is equally likely; count the favourable ones.' }],
    brute: ({ n, k }) => { let c = 0; for (let m = 0; m < 2 ** n; m++) if (m.toString(2).split('1').length - 1 === k) c++; return c / 2 ** n; },
  },
  duel: {
    level: 2,
    make: (rng) => ({ m: rng.pick([4, 6, 8, 10, 12, 20]) }),
    text: ({ m }) => `You and a friend each roll a fair ${m}-sided die. What is the probability, in percent, that your number is strictly higher?`,
    p: ({ m }) => Q.of(m - 1, 2 * m),
    steps: ({ m }) => [
      { say: `P(tie) = ${m}/${m * m} = 1/${m}.`, why: 'A tie needs the second die to match the first: one face in m.' },
      { say: `By symmetry P(higher) = (1 − 1/${m}) / 2 = ${m - 1}/${2 * m}.`, why: 'Higher and lower are equally likely, and together they are everything except a tie.' },
    ],
    brute: ({ m }) => { let c = 0; for (let a = 1; a <= m; a++) for (let b = 1; b <= m; b++) if (a > b) c++; return c / (m * m); },
  },
  duelUneven: {
    level: 3,
    make: (rng) => { const m = rng.pick([4, 6, 8]); return { m, n: rng.pick([6, 8, 10, 12, 20].filter((v) => v > m)) }; },
    text: ({ m, n }) => `You roll a fair ${n}-sided die and your friend rolls a fair ${m}-sided die. What is the probability, in percent, that your number is strictly higher?`,
    p: ({ m, n }) => { let c = 0; for (let b = 1; b <= m; b++) c += n - b; return Q.of(c, m * n); },
    steps: ({ m, n }) => [
      { say: `For each of the friend's values b = 1..${m}, you win with ${n} − b faces: total ${range(1, m).map((b) => n - b).join(' + ')} = ${range(1, m).reduce((s, b) => s + n - b, 0)}.`, why: 'Condition on the smaller die, then count your winning faces.' },
      { say: `Divide by ${m} × ${n} = ${m * n} equally likely pairs.`, why: 'Every (your roll, their roll) pair is equally likely.' },
    ],
    brute: ({ m, n }) => { let c = 0; for (let a = 1; a <= n; a++) for (let b = 1; b <= m; b++) if (a > b) c++; return c / (m * n); },
  },
  maxAtMost: {
    level: 2,
    make: (rng) => ({ k: rng.int(2, 5), d: rng.pick([2, 3]) }),
    text: ({ k, d }) => `${d === 2 ? 'Two' : 'Three'} fair six-sided dice are thrown. What is the probability, in percent, that the highest number shown is at most ${k}?`,
    p: ({ k, d }) => Q.of(k ** d, 6 ** d),
    steps: ({ k, d }) => [{ say: `Max ≤ ${k} means every die is ≤ ${k}: (${k}/6)^${d} = ${k ** d}/${6 ** d}.`, why: 'A maximum below a threshold is an "all of them" event, so the probabilities multiply.' }],
    brute: ({ k, d }) => enumDice(d, (xs) => Math.max(...xs) <= k),
  },
  cards: {
    level: 2,
    make: (rng) => ({ ev: rng.pick(['suit', 'rank', 'red', 'face']) }),
    text: ({ ev }) => `Two cards are drawn without replacement from a standard 52-card deck. What is the probability, in percent, that ${({ suit: 'they have the same suit', rank: 'they have the same rank', red: 'both are red', face: 'both are face cards (J, Q, K)' })[ev]}?`,
    p: ({ ev }) => ({ suit: Q.of(12, 51), rank: Q.of(3, 51), red: Q.of(26 * 25, 52 * 51), face: Q.of(12 * 11, 52 * 51) })[ev],
    steps: ({ ev }) => [({
      suit: { say: 'Whatever the first card, 12 of the remaining 51 share its suit: 12/51.', why: 'Condition on the first card; only the second draw matters.' },
      rank: { say: 'Whatever the first card, 3 of the remaining 51 share its rank: 3/51.', why: 'Condition on the first card.' },
      red: { say: '26/52 × 25/51.', why: 'Without replacement the second draw has one fewer red card.' },
      face: { say: '12/52 × 11/51.', why: 'There are 12 face cards; the second draw has one fewer.' },
    })[ev]],
    brute: ({ ev }) => {
      let c = 0, t = 0;
      for (let x = 0; x < 52; x++) for (let y = 0; y < 52; y++) {
        if (x === y) continue;
        t++;
        const sx = x % 4, sy = y % 4, rx = Math.floor(x / 4), ry = Math.floor(y / 4);
        if ({ suit: sx === sy, rank: rx === ry, red: sx < 2 && sy < 2, face: rx >= 10 && ry >= 10 }[ev]) c++;
      }
      return c / t;
    },
  },
  anySix: {
    level: 2,
    make: (rng) => ({ n: rng.int(2, 4) }),
    text: ({ n }) => `A fair die is rolled ${n} times. What is the probability, in percent, of at least one six?`,
    p: ({ n }) => Q.of(1).sub(Q.of(5 ** n, 6 ** n)),
    steps: ({ n }) => [{ say: `P(no six) = (5/6)^${n} = ${5 ** n}/${6 ** n}; subtract from 1.`, why: 'Complement of "at least one" is "none".' }],
    brute: ({ n }) => enumDice(n, (xs) => xs.includes(6)),
  },
  stick: {
    level: 3,
    make: (rng) => ({ k: rng.int(2, 9) }),
    text: ({ k }) => `A stick is broken at a uniformly random point. What is the probability, in percent, that the longer piece is at least ${k} times as long as the shorter one?`,
    p: ({ k }) => Q.of(2, k + 1),
    steps: ({ k }) => [
      { say: `Longer ≥ ${k} × shorter means the shorter piece is at most 1/${k + 1} of the stick.`, why: `If the short piece is x, the long one is 1 − x, and 1 − x ≥ ${k}x gives x ≤ 1/${k + 1}.` },
      { say: `The break lands within 1/${k + 1} of either end: probability 2/${k + 1}.`, why: 'Two end zones, each of length 1/(k + 1), under a uniform break.' },
    ],
    brute: ({ k }) => { const N = 200000; let c = 0; for (let i = 0; i < N; i++) { const u = (i + 0.5) / N; if (Math.max(u, 1 - u) >= k * Math.min(u, 1 - u)) c++; } return c / N; },
    tol: 1e-4,
  },
  sum3: {
    level: 3,
    make: (rng) => ({ s: rng.int(5, 16) }),
    text: ({ s }) => `Three fair six-sided dice are thrown. What is the probability, in percent, that the sum is exactly ${s}?`,
    p: ({ s }) => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const r = s - a - b; if (r >= 1 && r <= 6) c++; } return Q.of(c, 216); },
    steps: ({ s }) => {
      const byA = range(1, 6).map((a) => range(1, 6).filter((b) => s - a - b >= 1 && s - a - b <= 6).length);
      return [
        { say: `Fix the first die a; the other two must sum to ${s} − a. Counts for a = 1..6: ${byA.join(', ')}.`, why: 'Reduce three dice to the familiar two-dice count, once per value of the first die.' },
        { say: `Total ${byA.reduce((x, y) => x + y, 0)} of 216.`, why: '6³ = 216 equally likely ordered outcomes.' },
      ];
    },
    brute: ({ s }) => enumDice(3, (xs) => xs[0] + xs[1] + xs[2] === s),
  },
  allDifferent: {
    level: 3,
    make: (rng) => ({ n: rng.int(2, 4), m: rng.pick([6, 8, 10]) }),
    text: ({ n, m }) => `${['', '', 'Two', 'Three', 'Four'][n]} fair ${m}-sided dice are thrown. What is the probability, in percent, that all show different numbers?`,
    p: ({ n, m }) => { let q = Q.of(1); for (let i = 0; i < n; i++) q = q.mul(Q.of(m - i, m)); return q; },
    steps: ({ n, m }) => [{ say: `Multiply the chances each new die avoids the earlier ones: ${range(0, n - 1).map((i) => `${m - i}/${m}`).join(' × ')}.`, why: 'Sequential conditioning: die i must miss the i − 1 values already used.' }],
    brute: ({ n, m }) => enumDice(n, (xs) => new Set(xs).size === xs.length, m),
  },
  primeSum: {
    level: 3,
    make: (rng) => ({ ev: rng.pick(['prime', 'even-product', 'mult3-product', 'square-sum']) }),
    text: ({ ev }) => `Two fair six-sided dice are thrown. What is the probability, in percent, that ${({ prime: 'the sum is a prime number', 'even-product': 'the product is even', 'mult3-product': 'the product is a multiple of 3', 'square-sum': 'the sum is a perfect square' })[ev]}?`,
    p: ({ ev }) => ({ prime: Q.of(15, 36), 'even-product': Q.of(27, 36), 'mult3-product': Q.of(20, 36), 'square-sum': Q.of(7, 36) })[ev],
    steps: ({ ev }) => [({
      prime: { say: 'Prime sums 2, 3, 5, 7, 11 have 1 + 2 + 4 + 6 + 2 = 15 ordered pairs.', why: 'List the qualifying sums, then count ordered pairs per sum.' },
      'even-product': { say: 'Odd product needs both odd: 3 × 3 = 9 pairs; even = 36 − 9 = 27.', why: 'The complement is simpler: a product is odd only when both factors are odd.' },
      'mult3-product': { say: 'No factor of 3 needs both dice in {1, 2, 4, 5}: 16 pairs; so 36 − 16 = 20.', why: 'Complement: a product avoids 3 only if neither die is 3 or 6.' },
      'square-sum': { say: 'Square sums 4 and 9: 3 + 4 = 7 pairs.', why: 'The only perfect squares between 2 and 12 are 4 and 9.' },
    })[ev]],
    brute: ({ ev }) => count2((a, b) => ({ prime: PRIMES.has(a + b), 'even-product': (a * b) % 2 === 0, 'mult3-product': (a * b) % 3 === 0, 'square-sum': a + b === 4 || a + b === 9 })[ev]),
  },
};

function count2(f) { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (f(a, b)) c++; return c / 36; }
function enumDice(n, f, m = 6) {
  let c = 0, t = 0;
  const xs = [];
  const rec = (i) => { if (i === n) { t++; if (f(xs)) c++; return; } for (let v = 1; v <= m; v++) { xs[i] = v; rec(i + 1); } };
  rec(0);
  return c / t;
}

const fam = {
  id: 'prob-exact',
  section: 'iv',
  title: 'Exact probabilities in percent',
  skill: 'When the answer is computable exactly, compute it and give the tightest interval that contains it',
  levels: [1, 2, 3],
  generate(rng, { difficulty = 1 } = {}) {
    const keys = Object.keys(S).filter((k) => S[k].level === difficulty);
    const key = rng.pick(keys), sc = S[key], params = sc.make(rng);
    const p = sc.p(params), truth = pct(p);
    const coach = { exact: true, belief: { kind: 'point' }, note: 'Exact answer: compute it and give zero width, or a two-decimal bracket if it does not terminate.' };
    return ivItem(fam, rng, difficulty, {
      text: sc.text(params), truth, unit: '%', coach,
      exact: `${p.toString()} = ${truth.toPrecision(8)}%`,
      steps: [...sc.steps(params), { say: `P = ${p.toString()} = ${+truth.toFixed(4)}${Math.abs(truth * 1e4 - Math.round(truth * 1e4)) > 1e-6 ? '…' : ''}%.`, why: 'Convert the exact fraction to percent: multiply by 100.' }],
      hints: ['Is this exactly computable? Then width only costs you.', 'Count equally likely outcomes, or use the complement.'],
      params: { scenario: key, ...params },
    });
  },
  // Independent check: brute-force enumeration (or a fine grid for the stick).
  verify(item) {
    const sc = S[item.params.scenario];
    const b = sc.brute(item.params) * 100;
    const ok = Math.abs(b - item.truth) <= (sc.tol ? sc.tol * 100 : 1e-9) && item.coach.exact;
    return { ok, detail: `enumerated ${b}, item says ${item.truth}` };
  },
  lesson: {
    purpose: 'About a third of Intervals questions have an exact answer. Computing it and giving zero width scores 1.0; a lazy wide interval around the same answer scores 0.5.',
    anchor: 'A Beat-the-Odds probability question, with one change: instead of picking an option you type bounds, and the score is lower/upper.',
    steps: [
      { say: 'Decide first: can this be computed exactly in under 40 seconds?', why: 'Exact questions reward zero width; estimation questions reward calibrated width. The decision sets your strategy.' },
      { say: 'Compute by counting equally likely outcomes, conditioning, or the complement.', why: 'The same tools as Beat the Odds.' },
      { say: 'If the percent terminates, answer [x, x]; if not, bracket it with the two-decimal values either side.', why: 'The truth must be inside the interval (inclusive); a rounded point can miss it by 0.003 and score 0.' },
    ],
    predict: { question: 'Two dice: P(sum = 7) in percent. Which interval do you type?', answer: '16.666…%, so [16.66, 16.67]: score 0.9994. Typing [16.67, 16.67] scores 0.' },
    rule: 'Exact → compute → zero width (or a two-decimal bracket if it repeats).',
    contrast: 'Estimation questions (counting dots, extrapolating a series) need width; exact ones punish it. Misclassifying either way costs points.',
    edge: 'An answer of exactly 0 cannot score (lower must be above 0); the real test reportedly includes such a trap, so do not burn time on it.',
  },
};
export default fam;
