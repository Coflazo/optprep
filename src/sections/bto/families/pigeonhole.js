// Pigeonhole certainties next to look-alike events that are only likely.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, sequences, table } from '../lib.js';

const ID = 'pigeonhole';
// P(Bin(n, 1/k) > m): the chance that one particular box overflows.
function oneBoxTail(n, k, m) {
  let s = 0n;
  for (let j = m + 1; j <= n; j++) s += nCr(n, j) * BigInt(k - 1) ** BigInt(n - j);
  return new Q(s, BigInt(k) ** BigInt(n));
}

export default {
  id: ID,
  section: 'bto',
  title: 'Pigeonhole: when it is certain',
  skill: 'Check n > k·m before estimating anything: then an overflow is guaranteed',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? rng.pick(['coinsSure', 'socksSure', 'pairsSum']) : rng.pick(['coinsSure', 'coinsSmall', 'socksMaybe', 'pairsSumMaybe']);
    if (kind === 'coinsSure') {
      const k = rng.int(8, 20), m = rng.int(3, 6), n = k * m + rng.int(1, 3);
      const tail = oneBoxTail(n, k, m);
      return mcqItem(ID, rng, difficulty, {
        value: q(1),
        text: `${n} coins are thrown at random into ${k} boxes. You win a prize if any box ends up with more than ${m} coins. What is the probability that you win?`,
        distractors: [
          { value: tail, misconception: 'Computed the chance that one particular box overflows. The prize needs only some box to overflow.' },
          { value: 0, misconception: `Reasoned that an even spread of about ${m} per box keeps every box at ${m} or below. ${k} × ${m} = ${k * m} < ${n}, so an even spread is impossible.` },
          { value: 0.5, misconception: 'Treated "overflow or not" as a coin flip.' },
          { value: q(1, k), misconception: 'Used the chance that a given coin lands in a given box.' },
          { value: q(n - k * m, n), misconception: 'Used the fraction of "excess" coins as a probability.' },
        ],
        steps: [
          { say: `If every box held at most ${m} coins, the total would be at most ${k} × ${m} = ${k * m}.`, why: 'Add up the caps.' },
          { say: `But there are ${n} > ${k * m} coins, so some box must hold more than ${m}.`, why: 'Pigeonhole principle: whatever the random placement is.' },
          { say: 'P = 1.', why: 'The event happens in every outcome.' },
        ],
        rule: 'n items, k boxes: some box has at least ⌈n/k⌉. If n > k·m, "some box > m" is certain.',
        anchor: 'You know 3 socks from 2 colours give a pair. The coin version is the same idea with one change: more boxes and a larger cap.',
        hints: ['What is the most coins the boxes can hold if none has more than the cap?', `Compare ${k} × ${m} with ${n}.`, 'The event is certain.'],
        picture: table(['', 'Coins'], [[`${k} boxes filled to the cap of ${m}`, k * m], ['coins thrown', n], ['coins with nowhere to go', n - k * m]], `Even the most even spread that keeps every box at ${m} or fewer holds only ${k * m} coins. The other ${n - k * m} must push some box past ${m}, whatever the throws.`),
        fast: `${k} × ${m} = ${k * m} < ${n}: certain, P = 1.`,
        check: `One box alone overflows with chance ${tail.toNumber().toFixed(3)}, but the question asks for any box; the cap count ${k * m} < ${n} makes it certain, so anything below 1 is wrong.`,
        data: { kind, n, k, m },
      });
    }
    if (kind === 'coinsSmall') {
      const [n, k, t] = rng.pick([[4, 3, 3], [5, 3, 3], [5, 4, 2], [4, 2, 3], [6, 3, 3], [5, 2, 4], [3, 3, 2], [6, 4, 3]]);
      // P(some box >= t) by counting assignments with every box <= t-1 (exact, via DP on boxes).
      const fact = (x) => { let r = 1; for (let i = 2; i <= x; i++) r *= i; return r; };
      let ways = [1]; // ways[j] = sum over ordered fill of boxes so far with j coins of multinomial pieces
      for (let b = 0; b < k; b++) {
        const nx = Array(n + 1).fill(0);
        ways.forEach((w, j) => { for (let c = 0; c <= t - 1 && j + c <= n; c++) nx[j + c] += w / fact(c); });
        ways = nx;
      }
      const good = Math.round(ways[n] * fact(n));
      const v = q(k ** n - good, k ** n);
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `${n} coins are thrown independently and uniformly into ${k} boxes. What is the probability that some box ends up with at least ${t} coins?`,
        distractors: [
          { value: 1, misconception: `Applied the pigeonhole principle without checking it: ${k} boxes can hold ${n} coins with at most ${t - 1} each (${k} × ${t - 1} = ${k * (t - 1)} ≥ ${n}).` },
          { value: oneBoxTail(n, k, t - 1), misconception: 'Computed the chance for one particular box only.' },
          { value: oneBoxTail(n, k, t - 1).mul(q(k)), misconception: 'Multiplied the one-box chance by the number of boxes. Two boxes can overflow together, so this double counts.' },
          { value: q(good, k ** n), misconception: 'Answered the complement: every box below the threshold.' },
        ],
        steps: [
          { say: `Total assignments: ${k}^${n} = ${k ** n}.`, why: 'Each coin independently picks one of the boxes.' },
          { say: `Assignments with every box at most ${t - 1}: ${good}.`, why: 'Count occupancy patterns (a, b, …) with each entry ≤ t − 1, weighted by n!/(a! b! …) arrangements of the coins.' },
          { say: `P = 1 − ${good}/${k ** n} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Complement.' },
        ],
        rule: 'First test n > k·(t − 1). If it fails, the event is uncertain: count the complement.',
        anchor: 'The pigeonhole certainty with one change: too few coins, so it becomes an ordinary counting problem.',
        hints: [`Can ${k} boxes hold ${n} coins with none reaching ${t}?`, 'If yes, count the placements where no box reaches the threshold.', `${good} of ${k ** n} placements avoid it.`],
        picture: table(['Placements of the coins', 'Count'], [[`every box below ${t}`, good], [`some box at ${t} or more`, k ** n - good], [`all (${k}^${n})`, k ** n]], `${k} × ${t - 1} = ${k * (t - 1)} ≥ ${n}, so the boxes can stay below ${t} and the event is not certain. Count the placements that avoid it and take the rest.`),
        fast: `${k * (t - 1)} ≥ ${n}, so not certain: 1 − ${good}/${k ** n} = ${v}.`,
        check: `The pigeonhole test fails (${k} × ${t - 1} = ${k * (t - 1)} ≥ ${n}), so the answer is below 1; the ${k} placements with every coin in one box already give at least ${k}/${k ** n}.`,
        data: { kind, n, k, t },
      });
    }
    if (kind === 'socksSure' || kind === 'socksMaybe') {
      const c = rng.int(3, 6), s = rng.int(4, 8);
      const d = kind === 'socksSure' ? c + 1 : rng.int(2, c);
      let none = q(1);
      for (let i = 0; i < d; i++) none = none.mul(q(s * (c - i), s * c - i));
      const v = kind === 'socksSure' ? q(1) : q(1).sub(none);
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `A drawer holds ${s} socks of each of ${c} colours (${s * c} socks). In the dark you take ${d} socks. What is the probability that at least two of them have the same colour?`,
        distractors: kind === 'socksSure' ? [
          { value: q(1).sub(q(1, c)), misconception: 'Estimated a likely-but-not-certain chance. With more socks than colours, a match is forced.' },
          { value: q(d - 1, c), misconception: 'Added 1/c for each extra sock as if it only had to match one earlier sock.' },
          { value: 0.5, misconception: 'Treated "match or no match" as a coin flip.' },
          { value: q(1, c), misconception: 'Used the chance that two particular socks match.' },
        ] : [
          { value: 1, misconception: `Applied pigeonhole with too few socks: ${d} socks can all differ when there are ${c} colours.` },
          { value: none, misconception: 'Answered the complement: all colours different.' },
          { value: q(d * (d - 1) / 2, c), misconception: 'Added 1/c for each pair of socks; pair matches overlap, so this overcounts.' },
          { value: q(1, c), misconception: 'Used the chance that two particular socks match.' },
        ],
        steps: kind === 'socksSure' ? [
          { say: `${d} socks, ${c} colours: if all colours differed you could hold at most ${c} socks.`, why: 'One sock per colour is the most you can have without a match.' },
          { say: 'So a match is certain: P = 1.', why: 'Pigeonhole principle.' },
        ] : [
          { say: `${d} ≤ ${c}, so all-different is possible: compute the complement.`, why: 'Pigeonhole does not force a match here.' },
          { say: `P(all different) = ${Array.from({ length: d }, (_, i) => `${s * (c - i)}/${s * c - i}`).join(' × ')} = ${none}.`, why: 'Each new sock must avoid every colour already taken; both counts shrink.' },
          { say: `P = 1 − ${none} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Complement.' },
        ],
        rule: 'More items than categories → a repeat is certain. Otherwise 1 − P(all different).',
        anchor: 'The birthday problem with one change: few categories (colours), so it can tip over into certainty.',
        hints: ['Compare the number of socks with the number of colours.', kind === 'socksSure' ? 'More socks than colours.' : 'All-different is possible, so use the complement.', kind === 'socksSure' ? 'Certain.' : `1 − ${none}.`],
        picture: kind === 'socksSure'
          ? table(['', 'Socks'], [[`one of each of the ${c} colours`, c], ['socks taken', d]], `With ${c} colours, ${c} socks is the most you can hold without a match; the ${d}th sock must repeat a colour.`)
          : table(['Sock', 'Socks of a new colour', 'Socks left', 'Factor'], Array.from({ length: d }, (_, i) => [i + 1, s * (c - i), s * c - i, `${s * (c - i)}/${s * c - i}`]), `The complement, all colours different: each sock must avoid every colour already taken. The product is ${none}; the answer is 1 minus that.`),
        fast: kind === 'socksSure' ? `${d} socks > ${c} colours: certain.` : `1 − ${Array.from({ length: d }, (_, i) => `${s * (c - i)}/${s * c - i}`).join(' × ')} = ${v}.`,
        check: kind === 'socksSure' ? 'More socks than colours forces a match in every draw, so the answer is exactly 1.' : `${d} socks ≤ ${c} colours, so a match is possible but not forced: the answer is strictly between 0 and 1.`,
        data: { kind, c, s, d },
      });
    }
    // Pick distinct numbers from 1..2N; pairs {i, 2N+1-i} sum to 2N+1.
    const N = rng.int(4, 7), sure = kind === 'pairsSum';
    const r = sure ? N + 1 : rng.int(3, N);
    const noPair = new Q(nCr(N, r) * 2n ** BigInt(r), nCr(2 * N, r));
    const v = sure ? q(1) : q(1).sub(noPair);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `You choose ${r} different numbers at random from 1 to ${2 * N}. What is the probability that two of your numbers add up to ${2 * N + 1}?`,
      distractors: sure ? [
        { value: q(1).sub(new Q(2n ** BigInt(N), nCr(2 * N, N))), misconception: `Used the ${N}-number calculation. With ${r} numbers the ${N} complementary pairs force a hit.` },
        { value: q(r * (r - 1) / 2, 2 * N - 1), misconception: 'Added the chance per pair of chosen numbers; the pair events overlap.' },
        { value: 0.5, misconception: 'Treated the event as a coin flip.' },
        { value: q(1, 2 * N - 1), misconception: 'Used the chance that two particular chosen numbers are complementary.' },
      ] : [
        { value: 1, misconception: `Applied pigeonhole with too few numbers: ${r} ≤ ${N} numbers can avoid every complementary pair.` },
        { value: noPair, misconception: 'Answered the complement: no two numbers sum to the target.' },
        { value: q(1, 2 * N - 1), misconception: 'Used the chance that two particular chosen numbers are complementary.' },
        { value: q(r * (r - 1) / 2, 2 * N - 1), misconception: 'Added the chance per pair of chosen numbers; the pair events overlap.' },
      ],
      steps: [
        { say: `Group 1..${2 * N} into ${N} pairs summing to ${2 * N + 1}: {1, ${2 * N}}, {2, ${2 * N - 1}}, …`, why: 'Each number has exactly one partner.' },
        sure
          ? { say: `${r} numbers in ${N} pairs: two share a pair. P = 1.`, why: 'Pigeonhole principle.' }
          : { say: `No hit means at most one number per pair: choose ${r} pairs and one member of each, C(${N},${r}) × 2^${r} = ${nCr(N, r) * 2n ** BigInt(r)} of C(${2 * N},${r}) = ${nCr(2 * N, r)} sets.`, why: 'Pigeonhole does not force a hit, so count the complement.' },
        sure
          ? { say: 'The random choice does not matter.', why: 'Every possible set of that size contains a complementary pair.' }
          : { say: `P = 1 − ${noPair} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Complement.' },
      ],
      rule: 'Build the boxes (complementary pairs), then compare items with boxes.',
      anchor: 'Coins into boxes, with one change: the boxes are pairs of numbers that sum to the target.',
      hints: ['Which numbers pair up to the target?', `There are ${N} such pairs. Compare with ${r}.`, sure ? 'Certain.' : 'Count sets using at most one number from each pair.'],
      picture: table(['Box', `Numbers adding to ${2 * N + 1}`], Array.from({ length: N }, (_, i) => [i + 1, `${i + 1} and ${2 * N - i}`]), sure ? `${N} boxes, ${r} numbers: two of them must share a box, and a shared box is a pair adding to ${2 * N + 1}.` : `${r} numbers in ${N} boxes can all sit in different boxes, so a hit is not forced: count the sets that use at most one number per box.`),
      fast: sure ? `${r} numbers into ${N} pairs: certain.` : `No hit: C(${N},${r}) × 2^${r} of C(${2 * N},${r}) sets, so 1 − ${noPair} = ${v}.`,
      check: sure ? `${r} > ${N} boxes, so every possible choice contains a pair: exactly 1.` : `${r} ≤ ${N}, so some choices avoid every pair: the answer is below 1.`,
      data: { kind, N, r },
    });
  },

  // Independent check: brute-force enumeration where feasible, the pigeonhole bound otherwise.
  verify(item) {
    const d = item.params;
    if (d.kind === 'coinsSure') return agree(item, d.n > d.k * d.m ? 1 : NaN);
    if (d.kind === 'coinsSmall') {
      let hits = 0, tot = 0;
      for (const s of sequences(d.k, d.n)) { tot++; const cnt = Array(d.k + 1).fill(0); s.forEach((b) => cnt[b]++); if (Math.max(...cnt) >= d.t) hits++; }
      return agree(item, hits / tot);
    }
    if (d.kind === 'socksSure' || d.kind === 'socksMaybe') {
      if (d.d > d.c) return agree(item, 1);
      // Probability tree over colour sequences: colour j next has (s - used_j)/(remaining) chance.
      const n = d.s * d.c;
      const rec = (used, left, drawn) => {
        if (left === 0) return used.some((u) => u > 1) ? 1 : 0;
        let acc = 0;
        for (let j = 0; j < d.c; j++) {
          if (used[j] === d.s) continue;
          const nx = [...used]; nx[j]++;
          acc += ((d.s - used[j]) / (n - drawn)) * rec(nx, left - 1, drawn + 1);
        }
        return acc;
      };
      return agree(item, rec(Array(d.c).fill(0), d.d, 0), 1e-9);
    }
    // numbers: enumerate all r-subsets of 1..2N
    const M = 2 * d.N;
    let hits = 0, tot = 0;
    const walk = (start, chosen) => {
      if (chosen.length === d.r) { tot++; const set = new Set(chosen); if (chosen.some((x) => set.has(M + 1 - x))) hits++; return; }
      for (let x = start; x <= M; x++) walk(x + 1, [...chosen, x]);
    };
    walk(1, []);
    return agree(item, hits / tot);
  },

  lesson: {
    purpose: 'Some questions dress up a certainty as a random experiment ("61 coins into 15 boxes"). Spotting the pigeonhole argument answers them in seconds and avoids a wasted estimate.',
    anchor: 'Three socks, two colours: a pair is certain. General pigeonhole is the same idea with one change: n items into k boxes forces some box to have at least ⌈n/k⌉.',
    steps: [
      { say: 'Before computing, ask: what is the most items the boxes can take while avoiding the event?', why: 'If that maximum is below the number of items, the event is forced.' },
      { say: 'Compare n with k × m (m = the cap per box).', why: 'n > k·m means some box must exceed m in every outcome.' },
      { say: 'If the check fails, the event is uncertain: count the complement ("every box within the cap").', why: 'The same boxes now organise an ordinary count.' },
    ],
    predict: { question: '61 coins into 15 boxes: P(some box has more than 4)? And with 60 coins?', answer: '61: certain, 15 × 4 = 60 < 61. 60: not certain (all boxes exactly 4 is possible), though very likely.' },
    edge: 'n = k·m exactly: avoiding the event requires a perfectly even spread, which is possible but rare.',
    rule: 'n > k·m → P = 1. Otherwise compute 1 − P(all boxes ≤ m).',
    contrast: 'Pigeonhole (certain, for n > k) against birthday-type collisions (likely but uncertain, for n ≤ k).',
  },
};
