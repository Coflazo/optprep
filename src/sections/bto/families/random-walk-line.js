// Simple ±1 random walk on a line: position after n steps, parity traps, price below zero, reflection.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, pic } from '../lib.js';

// One sample path drawn under the number line: start, then a list of +1/−1 moves.
function walkPicture(start, moves, extra, caption) {
  const path = [start];
  for (const m of moves) path.push(path[path.length - 1] + m);
  const marks = (extra.marks || []).map((m) => m.x);
  const lo = Math.min(...path, ...marks, ...(extra.barriers || [])) - 1, hi = Math.max(...path, ...marks, ...(extra.barriers || [])) + 1;
  return pic('numberline', { min: lo, max: hi, step: 1, start, path, ...extra }, caption);
}
const ups = (u, d) => [...Array(u).fill(1), ...Array(d).fill(-1)];
const zigzag = (n, first) => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? first : -first));
const plus = (a, b) => (b < 0 ? `${a} − ${-b}` : `${a} + ${b}`);

const ID = 'random-walk-line';
const pathsTo = (n, k) => ((n + k) % 2 !== 0 || Math.abs(k) > n ? 0n : nCr(n, (n + k) / 2)); // paths ending at k
const tail = (n, a) => { let s = 0n; for (let k = a; k <= n; k++) s += pathsTo(n, k); return s; }; // paths ending >= a

export default {
  id: ID,
  section: 'bto',
  title: 'Random walk on a line',
  skill: 'Position after n steps = 2·(ups) − n; count up-steps with C(n, ·); reflection doubles the "ever reached" count',
  levels: [3, 4],

  generate(rng, { difficulty = 3 } = {}) {
    const kind = difficulty === 3 ? rng.pick(['endAt', 'endAt', 'parity', 'below']) : rng.pick(['everReach', 'returnZero', 'below']);
    const N2 = 2n;
    if (kind === 'endAt' || kind === 'parity') {
      const n = rng.int(4, 12);
      let k = rng.int(0, Math.min(n, 6)) * (rng.chance(0.5) ? 1 : -1);
      if (kind === 'endAt' && (n + k) % 2) k += k >= 0 ? -1 : 1;
      if (kind === 'parity' && (n + k) % 2 === 0) k += k >= 0 ? 1 : -1;
      const v = new Q(pathsTo(n, k), N2 ** BigInt(n));
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `A particle starts at 0 and moves +1 or −1 with equal probability at each step. What is the probability that it is at ${k} after ${n} steps?`,
        distractors: [
          { value: q(1, n + 1), misconception: `Treated the ${n + 1} possible end points as equally likely (and forgot that only every other integer is reachable).` },
          { value: q(1, 2 ** n), misconception: 'Counted one path; many different paths end at the same point.' },
          { value: new Q(nCr(n, Math.abs(k)), N2 ** BigInt(n)), misconception: `Chose |k| = ${Math.abs(k)} up-steps; ending at ${k} needs (n + k)/2 up-steps.` },
          { value: (n + k) % 2 === 0 ? q(0) : new Q(nCr(n, Math.floor((n + Math.abs(k)) / 2)), N2 ** BigInt(n)), misconception: (n + k) % 2 === 0 ? 'Declared the point unreachable; its parity matches n, so it can be reached.' : 'Rounded (n + k)/2 to a whole number of up-steps. It is not a whole number, so the point cannot be reached.' },
          { value: new Q(pathsTo(n, k), N2 ** BigInt(n - 1)), misconception: `Divided by 2^${n - 1} instead of 2^${n}.` },
          ...((n + k) % 2 ? [
            { value: new Q(pathsTo(n, k - 1) + pathsTo(n, k + 1), N2 ** BigInt(n + 1)), misconception: 'Averaged the two neighbouring reachable positions; the walk can never stand on this one.' },
            { value: 0.5, misconception: 'Treated the question as a coin flip.' },
          ] : []),
        ],
        steps: [
          { say: `With u up-steps and ${n} − u down-steps, the position is 2u − ${n}.`, why: 'Each up adds 1, each down subtracts 1.' },
          (n + k) % 2 === 0
            ? { say: `Position ${k} needs u = (${plus(n, k)})/2 = ${(n + k) / 2} up-steps: C(${n}, ${(n + k) / 2}) = ${pathsTo(n, k)} paths.`, why: 'Choose which steps go up.' }
            : { say: `Position ${k} would need u = (${plus(n, k)})/2 = ${(n + k) / 2}, not a whole number.`, why: 'After n steps the position has the same parity as n.' },
          { say: `P = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: `Divide by 2^${n} equally likely paths.` },
        ],
        rule: 'P(S_n = k) = C(n, (n + k)/2)/2^n if n + k is even, else 0.',
        anchor: 'Exactly u heads in n flips, C(n, u)/2^n, with one change: the position 2u − n replaces the head count u.',
        hints: ['How does the final position depend on the number of up-steps?', 'Can the particle be at an odd position after an even number of steps?', 'Count paths with the right number of up-steps.'],
        picture: (n + k) % 2 === 0
          ? walkPicture(0, ups((n + k) / 2, (n - k) / 2), { target: k }, `One of the C(${n}, ${(n + k) / 2}) = ${pathsTo(n, k)} paths that end at ${k}: ${(n + k) / 2} steps up and ${(n - k) / 2} down, in any order.`)
          : ((kk) => walkPicture(0, ups((n + kk) / 2, (n - kk) / 2), { marks: [{ x: k, label: `${k}: never` }] }, `After ${n} steps the position always has the parity of ${n}, so ${k} is unreachable; this path ends next to it, at ${kk}.`))(k > 0 ? k - 1 : k + 1),
        fast: (n + k) % 2 === 0 ? `C(${n}, ${(n + k) / 2})/2^${n} = ${v}.` : `Parity: ${n} + ${k} is odd, so 0.`,
        check: (n + k) % 2 === 0 ? `It cannot beat the chance of the most likely end point, C(${n}, ${Math.floor(n / 2)})/2^${n} ≈ ${(Number(nCr(n, Math.floor(n / 2))) / 2 ** n).toFixed(3)}.` : 'An option above 0 forgets that every step changes the parity of the position.',
        params: { kind, n, k, start: 0 },
      });
    }
    if (kind === 'below') {
      const x = rng.int(1, 4), n = rng.pick([6, 8, 9, 10, 12, 16]);
      // P(start + S_n < 0) = P(S_n <= -x-1)
      let s = 0n; for (let k = -n; k <= -x - 1; k++) s += pathsTo(n, k);
      const v = new Q(s, N2 ** BigInt(n));
      let s2 = 0n; for (let k = -n; k <= -x; k++) s2 += pathsTo(n, k);
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `A price starts at ${x} and each day moves up 1 or down 1 with equal probability (it may go negative). What is the probability that the price is below 0 after ${n} days?`,
        distractors: [
          { value: new Q(s2, N2 ** BigInt(n)), misconception: 'Counted a price of exactly 0 as "below 0".' },
          { value: 0.5, misconception: 'Treated above/below zero as a coin flip, ignoring the starting cushion.' },
          { value: q(1).sub(v), misconception: 'Answered the complement.' },
          { value: new Q(s, N2 ** BigInt(n)).mul(q(2)), misconception: 'Applied the reflection doubling. That is for "ever below 0 during the path", not "below 0 at the end".' },
        ],
        steps: [
          { say: `Below 0 at the end ⇔ the walk S_${n} ≤ −${x + 1}.`, why: `Price = ${x} + S_${n}, and "below 0" means at most −1.` },
          { say: `Sum C(${n}, u)/2^${n} over up-counts u with 2u − ${n} ≤ −${x + 1}.`, why: 'Each end point is a binomial count.' },
          { say: `P = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Add the qualifying end points.' },
        ],
        rule: 'Terminal events: sum binomial end-point probabilities. Watch strict vs non-strict at the boundary.',
        anchor: 'Binomial tail of heads, with one change: translate "price below 0" into a condition on the number of up-days.',
        hints: ['What must the walk S_n be for the price to be negative?', 'Translate into a number of up-steps.', 'Sum the binomial probabilities.'],
        picture: walkPicture(x, [...Array(x + 1).fill(-1), ...zigzag(n - x - 1, -1)], { barriers: [0] }, `The bar marks 0. A path counts when it ends at −1 or lower, that is with ${x} + S_${n} ≤ −1; this one falls through 0 and stays below.`),
        fast: `Sum the binomial end points with ${x} + S_${n} ≤ −1: ${v.toNumber().toFixed(4)}.`,
        check: `Starting above 0 makes it less than 1/2, and ending exactly at 0 does not count; including it gives ${new Q(s2, N2 ** BigInt(n)).toNumber().toFixed(4)}.`,
        params: { kind, n, start: x },
      });
    }
    if (kind === 'everReach') {
      const n = rng.pick([6, 8, 10, 12]), a = rng.int(2, 4);
      // Reflection: P(max_{t<=n} S_t >= a) = P(S_n >= a) + P(S_n > a)
      const v = new Q(tail(n, a) + tail(n, a + 1), N2 ** BigInt(n));
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `A particle starts at 0 and moves +1 or −1 with equal probability at each step. What is the probability that it reaches ${a} at some point during the first ${n} steps?`,
        distractors: [
          { value: new Q(tail(n, a), N2 ** BigInt(n)), misconception: `Only counted paths that end at or above ${a}. Paths that touch ${a} and fall back also count; reflection adds them.` },
          { value: Math.min(1, 2 * Number(tail(n, a)) / 2 ** n), misconception: `Doubled P(end ≥ ${a}); the paths ending exactly at ${a} are not reflected copies and must not be doubled.` },
          { value: q(1, 2 ** a), misconception: `Required the first ${a} steps to all go up.` },
          { value: q(1).sub(v), misconception: 'Answered the complement.' },
        ],
        steps: [
          { say: `Split paths that ever reach ${a} by where they end: ≥ ${a} or < ${a}.`, why: 'Paths ending at or above a obviously touched a.' },
          { say: `Reflect the part after the first visit to ${a}: paths that touch ${a} and end below it match one-to-one with paths ending above ${a}.`, why: 'Reflection principle: flipping the steps after the first hit swaps "end at a − j" with "end at a + j".' },
          { say: `P = P(S_${n} ≥ ${a}) + P(S_${n} > ${a}) = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Add the two groups.' },
        ],
        rule: 'P(max_{t ≤ n} S_t ≥ a) = P(S_n ≥ a) + P(S_n > a) ≈ 2 P(S_n ≥ a).',
        anchor: 'The end-point binomial counts, with one change: reflection turns a question about the whole path into two end-point counts.',
        hints: ['Is ending above a the same as reaching a?', 'Reflect the path after its first visit to a.', 'Add P(end ≥ a) and P(end > a).'],
        picture: walkPicture(0, [...Array(a).fill(1), ...zigzag(n - a, -1)], { barriers: [a] }, `This path touches ${a} and then ends below it. Reflecting its steps after the first touch gives a path ending above ${a}, which is why the answer is about twice P(end ≥ ${a}).`),
        fast: `Reflection: P(S_${n} ≥ ${a}) + P(S_${n} > ${a}) = ${v.toNumber().toFixed(4)}.`,
        check: `At least P(end ≥ ${a}) = ${new Q(tail(n, a), N2 ** BigInt(n)).toNumber().toFixed(4)} (those paths surely touched ${a}) and at most twice that.`,
        params: { kind, n, a },
      });
    }
    const m = rng.int(2, 6), n = 2 * m;
    const v = new Q(nCr(n, m), N2 ** BigInt(n));
    const never = rng.chance(0.5);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: never
        ? `A particle starts at 0 and moves +1 or −1 with equal probability. What is the probability that it does not return to 0 at any of the steps 1 to ${n}?`
        : `A particle starts at 0 and moves +1 or −1 with equal probability. What is the probability that it is back at 0 after exactly ${n} steps?`,
      distractors: [
        { value: q(1, 2), misconception: 'Treated returning as a coin flip.' },
        { value: q(1, n + 1), misconception: 'Treated all end points as equally likely.' },
        { value: q(1).sub(v), misconception: never ? 'Computed P(some return), the complement.' : 'Computed P(not at 0 after n steps).' },
        { value: q(1, 2 ** m), misconception: `Required the first ${m} steps up and the last ${m} down: one path of many.` },
        { value: new Q(nCr(n, m), N2 ** BigInt(n)).mul(q(1, 2)), misconception: 'Halved the answer, keeping only walks that stay positive (or only the first return).' },
      ],
      steps: never ? [
        { say: `Fact: P(no return to 0 in steps 1..2m) = P(S_2m = 0) = C(2m, m)/4^m.`, why: 'A reflection argument pairs non-returning paths with paths ending at 0.' },
        { say: `P = C(${n}, ${m})/2^${n} = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Count paths with m ups and m downs.' },
      ] : [
        { say: `Back at 0 ⇔ ${m} ups and ${m} downs.`, why: 'Equal numbers cancel.' },
        { say: `P = C(${n}, ${m})/2^${n} = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Choose which steps go up.' },
      ],
      rule: 'P(S_2m = 0) = C(2m, m)/4^m ≈ 1/√(πm) — and P(no return by 2m) is the same number.',
      anchor: 'Exactly m heads in 2m flips, C(2m, m)/4^m, with one change: read "equal heads and tails" as "back at the start".',
      hints: ['How many ups and downs bring the walk back to 0?', 'C(2m, m) paths.', 'Divide by 2^(2m).'],
      picture: never
        ? walkPicture(0, Array(n).fill(1), { target: 0 }, `A path that never comes back to 0 in ${n} steps. There are exactly as many such paths as paths ending at 0: C(${n}, ${m}) = ${nCr(n, m)}.`)
        : walkPicture(0, ups(m, m), { target: 0 }, `One of the C(${n}, ${m}) = ${nCr(n, m)} paths back at 0: ${m} ups and ${m} downs in any order.`),
      fast: `C(${n}, ${m})/2^${n} = ${v}, about 1/√(π × ${m}) = ${(1 / Math.sqrt(Math.PI * m)).toFixed(3)}.`,
      check: `About 1/√(πm) = ${(1 / Math.sqrt(Math.PI * m)).toFixed(3)}, shrinking as the walk gets longer; ${never ? 'the never-return chance equals the back-at-0 chance exactly.' : 'it is the largest single end-point chance.'}`,
      params: { kind: never ? 'neverReturn' : 'returnZero', n },
    });
  },

  // Independent check: dynamic programming over the walk's position distribution (with a barrier where needed).
  verify(item) {
    const d = item.params;
    const n = d.n;
    const off = n + 2;
    let dist = Array(2 * off + 1).fill(0);
    dist[off] = 1;
    let absorbed = 0, returned = 0;
    for (let t = 1; t <= n; t++) {
      const nx = Array(2 * off + 1).fill(0);
      dist.forEach((p, i) => { if (p) { nx[i - 1] += p / 2; nx[i + 1] += p / 2; } });
      if (d.kind === 'everReach') { absorbed += nx[off + d.a]; nx[off + d.a] = 0; }
      if (d.kind === 'neverReturn') { returned += nx[off]; nx[off] = 0; }
      dist = nx;
    }
    if (d.kind === 'everReach') return agree(item, absorbed, 1e-9);
    if (d.kind === 'neverReturn') return agree(item, 1 - returned, 1e-9);
    if (d.kind === 'below') return agree(item, dist.reduce((s, p, i) => s + (i - off + d.start < 0 ? p : 0), 0), 1e-9);
    if (d.kind === 'returnZero') return agree(item, dist[off], 1e-9);
    return agree(item, dist[off + d.k] || 0, 1e-9);
  },

  lesson: {
    purpose: 'Prices, inventories and P&L are often modelled as ±1 walks. Where the walk ends is a binomial count; whether it ever touched a level needs the reflection trick.',
    anchor: 'Heads in n flips (binomial), with one change: position = ups − downs = 2·ups − n.',
    steps: [
      { say: 'End at k ⇔ (n + k)/2 up-steps; that must be a whole number.', why: 'Parity: after n steps the position has the parity of n.' },
      { say: 'P(S_n = k) = C(n, (n + k)/2)/2^n.', why: 'Choose which steps go up.' },
      { say: 'Ever reaching a by time n: P(S_n ≥ a) + P(S_n > a).', why: 'Reflect the path after its first visit to a.' },
    ],
    predict: { question: 'After 10 steps, which is more likely: being at 0 or at 1?', answer: 'Being at 0 (about 0.246). Position 1 is impossible after an even number of steps.' },
    edge: 'Wrong parity gives probability exactly 0, a classic trap option.',
    rule: 'End point: binomial with parity check. Ever touched: roughly double the end-point tail.',
    contrast: '"Is at a after n steps" (end point) against "reached a by step n" (whole path, about twice as likely for tails).',
  },
};
