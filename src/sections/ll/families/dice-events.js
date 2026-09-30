// Dice statement triples: de Mere, Newton-Pepys, sums, all-different, first six. No visual.
import { nCr, nPr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { poolItem, verifyPool } from '../lib.js';
import { q, qpow, sequences } from '../../bto/lib.js';

const ID = 'dice-events';
const ways2 = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const binomGe = (n, k, [a, c]) => { let s = 0n; for (let j = k; j <= n; j++) s += nCr(n, j) * BigInt(a) ** BigInt(j) * BigInt(c - a) ** BigInt(n - j); return new Q(s, BigInt(c) ** BigInt(n)); };
// Independent binomial tail by floating-point DP over trials.
const dpGe = (n, k, p) => { let d = [1]; for (let i = 0; i < n; i++) { const nx = Array(d.length + 1).fill(0); d.forEach((v, j) => { nx[j] += v * (1 - p); nx[j + 1] += v * p; }); d = nx; } return d.slice(k).reduce((a, b) => a + b, 0); };
const count2 = (f) => { let h = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (f(a, b)) h++; return h / 36; };

export const POOL = {
  sixInN: { setup: ({ n }) => `${n} throws of one die`, gen: (r) => ({ n: r.int(2, 6) }), text: ({ n }) => `At least one six in ${n} throws of a die.`, p: ({ n }) => q(1).sub(qpow(q(5, 6), n)), how: ({ n }) => `1 − (5/6)^${n}.`, check: ({ n }) => dpGe(n, 1, 1 / 6) },
  kSixes: { setup: ({ k }) => `a throw of ${6 * k} dice`, gen: (r) => ({ k: r.int(1, 3) }), text: ({ k }) => `At least ${k} six${k > 1 ? 'es' : ''} when ${6 * k} dice are thrown.`, p: ({ k }) => binomGe(6 * k, k, [1, 6]), how: ({ k }) => `Binomial tail: P(at least ${k} successes in ${6 * k} trials at 1/6). Newton–Pepys: more dice make it harder, not easier.`, check: ({ k }) => dpGe(6 * k, k, 1 / 6) },
  doubleSix: { setup: ({ n }) => `${n} throws of a pair of dice`, gen: (r) => ({ n: r.pick([12, 18, 24, 30]) }), text: ({ n }) => `At least one double six in ${n} throws of two dice.`, p: ({ n }) => q(1).sub(qpow(q(35, 36), n)), how: ({ n }) => `1 − (35/36)^${n}.`, check: ({ n }) => dpGe(n, 1, 1 / 36) },
  sumGe: { setup: () => 'one throw of two dice', gen: (r) => ({ t: r.int(7, 11) }), text: ({ t }) => `The sum of two dice is at least ${t}.`, p: ({ t }) => { let w = 0; for (let s = t; s <= 12; s++) w += ways2(s); return q(w, 36); }, how: ({ t }) => `Count ordered pairs with sum ≥ ${t}, divide by 36.`, check: ({ t }) => count2((a, b) => a + b >= t) },
  sumEq: { setup: () => 'one throw of two dice', gen: (r) => ({ s: r.int(4, 10) }), text: ({ s }) => `The sum of two dice is exactly ${s}.`, p: ({ s }) => q(ways2(s), 36), how: ({ s }) => `${ways2(s)} ordered pairs of 36.`, check: ({ s }) => count2((a, b) => a + b === s) },
  allDiff: { setup: ({ n }) => `a throw of ${n} dice`, gen: (r) => ({ n: r.int(3, 4) }), text: ({ n }) => `${n} dice all show different faces.`, p: ({ n }) => new Q(nPr(6, n), BigInt(6 ** n)), how: ({ n }) => `6·5·…/6^${n}.`, check: ({ n }) => { let h = 0, t = 0; for (const s of sequences(6, n)) { t++; if (new Set(s).size === n) h++; } return h / t; } },
  maxIs: { setup: () => 'one throw of two dice', gen: (r) => ({ k: r.int(3, 6) }), text: ({ k }) => `The higher of two dice is exactly ${k}.`, p: ({ k }) => q(2 * k - 1, 36), how: ({ k }) => `${2 * k - 1} ordered pairs have maximum ${k}.`, check: ({ k }) => count2((a, b) => Math.max(a, b) === k) },
  firstSix: { setup: () => 'throwing one die until the first six', gen: (r) => ({ k: r.int(1, 4) }), text: ({ k }) => `The first six appears on throw number ${k}.`, p: ({ k }) => qpow(q(5, 6), k - 1).mul(q(1, 6)), how: ({ k }) => `(5/6)^${k - 1} × 1/6.`, check: ({ k }) => dpGe(k - 1, k - 1, 5 / 6) / 6 },
  noSix: { setup: ({ n }) => `${n} throws of one die`, gen: (r) => ({ n: r.int(2, 5) }), text: ({ n }) => `No six in ${n} throws of a die.`, p: ({ n }) => qpow(q(5, 6), n), how: ({ n }) => `(5/6)^${n}.`, check: ({ n }) => 1 - dpGe(n, 1, 1 / 6) },
  double: { setup: () => 'one throw of two dice', gen: () => ({}), text: () => 'Two dice show the same face.', p: () => q(1, 6), how: () => '6 doubles of 36.', check: () => count2((a, b) => a === b) },
  threeSum: { setup: () => 'one throw of three dice', gen: (r) => ({ s: r.int(5, 16) }), text: ({ s }) => `The sum of three dice is exactly ${s}.`, p: ({ s }) => { let w = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const c = s - a - b; if (c >= 1 && c <= 6) w++; } return q(w, 216); }, how: ({ s }) => `Ordered triples with sum ${s}, over 216.`, check: ({ s }) => { let h = 0; for (const t of sequences(6, 3)) if (t[0] + t[1] + t[2] === s) h++; return h / 216; } },
};

export default {
  id: ID,
  section: 'll',
  title: 'Dice statement triples',
  skill: 'Price each dice event quickly (complement, count, binomial) and beware of "more trials, more successes needed" traps',
  levels: [1, 2, 3],

  generate(rng, { difficulty = 1 } = {}) {
    const keys = difficulty === 1 ? ['sixInN', 'sumGe', 'sumEq', 'double', 'maxIs', 'noSix'] : difficulty === 2 ? ['sixInN', 'doubleSix', 'allDiff', 'firstSix', 'sumGe', 'threeSum'] : ['kSixes', 'doubleSix', 'sixInN', 'allDiff', 'threeSum'];
    return poolItem(ID, rng, difficulty, POOL, {
      keys,
      text: (list) => `Fair six-sided dice throughout. The statements concern ${list}. Rank them from most to least likely.`,
      compare: 'Order the computed probabilities; the famous traps are that 24 throws for a double six (≈ 0.49) fall just short of 1/2 while 4 throws for one six (≈ 0.52) pass it, and that more dice with proportionally more sixes required get less likely.',
      rule: 'At least one: 1 − (1 − p)^n. Two-dice sums: (6 − |s − 7|)/36. Binomial tails for "at least k".',
      anchor: 'The single-die probability 1/6, combined with the complement rule, counting of ordered outcomes, and the binomial.',
      hints: ['Put a quick number on each statement: complement, count, or binomial.', 'At least one six in n throws: 1 − (5/6)^n.', 'Beware: 12 dice needing two sixes is less likely than 6 dice needing one.'],
    });
  },

  verify(item) { return verifyPool(item, POOL); },

  lesson: {
    purpose: 'Many Likelihood List items are pure reasoning triples. De Méré and Newton–Pepys are the classic traps: intuitions about "scaling up" the number of dice mislead.',
    anchor: 'The one-die probability 1/6, with one change per statement: complement for "at least one", counting for sums, binomial for "at least k".',
    steps: [
      { say: 'Price each statement with the fastest tool.', why: 'Only the order matters, so a rough value per statement is enough when gaps are clear.' },
      { say: '"At least one in n": 1 − (1 − p)^n.', why: 'Complement of all misses.' },
      { say: '"At least k in 6k": binomial tail; it falls as k grows.', why: 'The spread grows like √n while the target stays at the mean, so the tail below the mean fattens.' },
    ],
    predict: { question: 'One six in 6 dice, or two sixes in 12 dice: which is more likely?', answer: 'One six in 6 dice: 0.665 against 0.619 (Newton–Pepys).' },
    edge: 'At least one six in 1 throw is just 1/6; the complement rule gives the same.',
    rule: '1 − (5/6)^n; ways(s)/36; binomial tails shrink toward 1/2 from above as the batch grows.',
    contrast: 'One six in 4 throws (0.518) against one double six in 24 throws (0.491).',
  },
};
