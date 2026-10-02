// Coin-sequence statements: HT appears more readily than HH, runs, alternation, exact counts.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { poolItem, verifyPool } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'coin-patterns';
const fib = (n) => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };
// Strings of length n avoiding k heads in a row.
const noRun = (n, k) => { let st = Array(k).fill(0); st[0] = 1; for (let i = 0; i < n; i++) { const nx = Array(k).fill(0); nx[0] = st.reduce((a, b) => a + b, 0); for (let r = 0; r < k - 1; r++) nx[r + 1] += st[r]; st = nx; } return st.reduce((a, b) => a + b, 0); };
const enumerate = (n, f) => { let h = 0; for (let m = 0; m < 2 ** n; m++) { let s = ''; for (let i = 0; i < n; i++) s += (m >> i) & 1 ? 'H' : 'T'; if (f(s)) h++; } return h / 2 ** n; };

export const POOL = {
  hasHH: { setup: ({ n }) => `${n} flips`, gen: (r) => ({ n: r.int(4, 8) }), text: ({ n }) => `HH appears somewhere in ${n} flips.`, p: ({ n }) => q(2 ** n - fib(n + 2), 2 ** n), how: ({ n }) => `1 − F(${n + 2})/2^${n}: strings with no HH are counted by Fibonacci numbers.`, check: ({ n }) => enumerate(n, (s) => s.includes('HH')) },
  hasHT: { setup: ({ n }) => `${n} flips`, gen: (r) => ({ n: r.int(4, 8) }), text: ({ n }) => `HT appears somewhere in ${n} flips.`, p: ({ n }) => q(2 ** n - (n + 1), 2 ** n), how: ({ n }) => `Only T…TH…H avoids HT: ${n + 1} strings. P = 1 − ${n + 1}/2^${n}.`, check: ({ n }) => enumerate(n, (s) => s.includes('HT')) },
  hasHHH: { setup: ({ n }) => `${n} flips`, gen: (r) => ({ n: r.int(5, 9) }), text: ({ n }) => `Three heads in a row appear somewhere in ${n} flips.`, p: ({ n }) => q(2 ** n - noRun(n, 3), 2 ** n), how: ({ n }) => `1 − (strings avoiding HHH)/2^${n} = 1 − ${noRun(n, 3)}/${2 ** n}.`, check: ({ n }) => enumerate(n, (s) => s.includes('HHH')) },
  alternate: { setup: ({ n }) => `${n} flips`, gen: (r) => ({ n: r.int(3, 6) }), text: ({ n }) => `${n} flips alternate perfectly (HTHT… or THTH…).`, p: ({ n }) => q(2, 2 ** n), how: ({ n }) => `Two strings of ${2 ** n}.`, check: ({ n }) => enumerate(n, (s) => ![...s].some((c, i) => i && c === s[i - 1])) },
  exactly: { setup: ({ n }) => `${n} flips`, gen: (r) => { const n = r.int(4, 8); return { n, k: r.int(1, n - 1) }; }, text: ({ n, k }) => `Exactly ${k} head${k === 1 ? '' : 's'} in ${n} flips.`, p: ({ n, k }) => new Q(nCr(n, k), 2n ** BigInt(n)), how: ({ n, k }) => `C(${n},${k})/2^${n}.`, check: ({ n, k }) => enumerate(n, (s) => [...s].filter((c) => c === 'H').length === k) },
  firstHead: { setup: () => 'flipping until the first head', gen: (r) => ({ j: r.int(1, 4) }), text: ({ j }) => `The first head comes on flip ${j}.`, p: ({ j }) => q(1, 2 ** j), how: ({ j }) => `${j - 1} tails then a head: (1/2)^${j}.`, check: ({ j }) => enumerate(j, (s) => s === 'T'.repeat(j - 1) + 'H') },
  moreHeads: { setup: ({ n }) => `${n} flips`, gen: (r) => ({ n: r.pick([4, 6, 8]) }), text: ({ n }) => `Strictly more heads than tails in ${n} flips.`, p: ({ n }) => q(1).sub(new Q(nCr(n, n / 2), 2n ** BigInt(n))).mul(q(1, 2)), how: ({ n }) => `(1 − P(tie))/2 with P(tie) = C(${n},${n / 2})/2^${n}.`, check: ({ n }) => enumerate(n, (s) => [...s].filter((c) => c === 'H').length * 2 > n) },
};

export default {
  id: ID,
  section: 'll',
  title: 'Coin-sequence statements',
  skill: 'Count strings: HT is easier to find than HH in a fixed number of flips; ties matter for "more heads"',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const keys = difficulty === 2 ? ['exactly', 'firstHead', 'moreHeads', 'alternate'] : difficulty === 3 ? ['hasHH', 'hasHT', 'exactly', 'moreHeads', 'alternate'] : ['hasHH', 'hasHT', 'hasHHH', 'moreHeads'];
    return poolItem(ID, rng, difficulty, POOL, {
      keys,
      text: (list) => `A fair coin is flipped. The statements concern ${list}. Rank them from most to least likely.`,
      compare: 'Order the counts. Trap: HH and HT have the same chance at any fixed position, but HT appears somewhere in n flips more often, because HH needs a clean restart after a miss.',
      rule: 'Contains HT: 1 − (n + 1)/2^n. Contains HH: 1 − F(n + 2)/2^n. More heads: (1 − P(tie))/2.',
      anchor: 'Counting 2^n equally likely strings, with the one change that the events are about patterns inside the string.',
      hints: ['Count strings that AVOID the pattern.', 'Avoiding HT forces all tails before all heads: n + 1 strings.', 'Avoiding HH gives Fibonacci counts.'],
    });
  },

  verify(item) { return verifyPool(item, POOL); },

  lesson: {
    purpose: 'Sequence statements hide an asymmetry: patterns with the same per-position probability are not equally likely to appear somewhere, because of how they overlap.',
    anchor: 'Counting 2^n equally likely strings, with one change: count strings that avoid a pattern, then subtract.',
    steps: [
      { say: 'Avoid HT: once an H appears, every later flip must be H. So the string is T…TH…H: n + 1 strings.', why: 'An H followed by a T would create HT.' },
      { say: 'Avoid HH: every H must be followed by T (or end the string): Fibonacci count F(n + 2).', why: 'Split on the last flip: T, or TH.' },
      { say: 'Compare: n + 1 grows slowly, F(n + 2) grows fast, so HT is found far more often.', why: 'More strings avoid HH than HT.' },
    ],
    predict: { question: 'In 6 flips, is HH or HT more likely to appear somewhere?', answer: 'HT: 1 − 7/64 ≈ 0.89 against HH: 1 − 21/64 ≈ 0.67.' },
    edge: 'In 2 flips both are 1/4; the difference appears from 3 flips on.',
    rule: 'Avoiders: HT → n + 1; HH → F(n + 2); HHH → tribonacci-like counts.',
    contrast: 'Probability at a fixed position (1/4 for both) against probability of appearing somewhere (HT > HH).',
  },
};
