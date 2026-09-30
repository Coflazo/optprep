// Fair-coin sequences: all the same, exactly k heads, more heads than tails, no HH, runs.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, qpow } from '../lib.js';

const ID = 'coin-sequences';
const fib = (n) => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }; // F(1)=F(2)=1
// Sequences of length n with no run of k heads (DP on current head-run length).
function noRun(n, k) {
  let st = Array(k).fill(0); st[0] = 1;
  for (let i = 0; i < n; i++) {
    const nx = Array(k).fill(0);
    const tot = st.reduce((a, b) => a + b, 0);
    nx[0] = tot; // a tail resets the run
    for (let r = 0; r < k - 1; r++) nx[r + 1] += st[r]; // a head extends it
    st = nx;
  }
  return st.reduce((a, b) => a + b, 0);
}

function build(kind, n, rng) {
  const N = 2 ** n;
  if (kind === 'allSame') return {
    value: q(2, N), data: { kind, n },
    text: `You flip a fair coin ${n} times. What is the probability that all ${n} flips show the same side (all heads or all tails)?`,
    distractors: [
      { value: q(1, N), misconception: 'Only counted all heads. All tails also qualifies.' },
      { value: q(1).sub(q(2, N)), misconception: 'Answered the complement: at least one of each side.' },
      { value: q(n, N), misconception: `Counted ${n} favourable sequences, one per flip. There are exactly 2: HH…H and TT…T.` },
      { value: q(1, 2), misconception: 'Only compared the second flip with the first.' },
      { value: q(2, N * 2), misconception: `Used ${n} factors of 1/2 after the first flip instead of ${n - 1}.` },
    ],
    steps: [
      { say: 'The first flip sets the side; each of the other flips must match it.', why: 'No side is specified.' },
      { say: `P = (1/2)^${n - 1} = ${q(2, N)} ≈ ${(2 / N).toFixed(4)}.`, why: `Equivalently 2 favourable sequences out of ${N}.` },
    ],
    hints: ['Is a particular side required?', 'Only the later flips must match the first.', `(1/2)^${n - 1}.`],
  };
  if (kind === 'exactlyK') {
    const k = rng.int(1, n - 1);
    const v = new Q(nCr(n, k), BigInt(N));
    let atLeast = q(0);
    for (let t = k; t <= n; t++) atLeast = atLeast.add(new Q(nCr(n, t), BigInt(N)));
    return {
      value: v, data: { kind, n, k },
      text: `You flip a fair coin ${n} times. What is the probability of exactly ${k} heads?`,
      distractors: [
        { value: q(1, N), misconception: `Counted one sequence (for example ${'H'.repeat(k)}${'T'.repeat(n - k)}) and forgot the C(${n},${k}) = ${nCr(n, k)} orders.` },
        { value: q(1, n + 1), misconception: `Treated the ${n + 1} possible head counts as equally likely.` },
        { value: q(k, n), misconception: 'Used the fraction of flips that are heads as a probability.' },
        { value: atLeast, misconception: `Computed at least ${k} heads.` },
        { value: new Q(nCr(n, k), BigInt(N / 2)), misconception: `Divided by 2^${n - 1} instead of 2^${n}.` },
      ],
      steps: [
        { say: `There are 2^${n} = ${N} equally likely sequences.`, why: 'Each flip doubles the count.' },
        { say: `Sequences with exactly ${k} heads: choose their positions, C(${n},${k}) = ${nCr(n, k)}.`, why: 'A sequence is fixed by which flips are heads.' },
        { say: `P = ${nCr(n, k)}/${N} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Favourable over total.' },
      ],
      hints: ['How many sequences in total?', `Choose which ${k} flips are heads.`, `C(${n},${k})/2^${n}.`],
    };
  }
  if (kind === 'moreHeads') {
    const tie = n % 2 === 0 ? new Q(nCr(n, n / 2), BigInt(N)) : q(0);
    const v = q(1).sub(tie).mul(q(1, 2));
    return {
      value: v, data: { kind, n },
      text: `You flip a fair coin ${n} times. What is the probability of strictly more heads than tails?`,
      distractors: n % 2 === 0 ? [
        { value: q(1, 2), misconception: `Ignored ties. With ${n} flips, ${n / 2} heads and ${n / 2} tails has probability ${tie}.` },
        { value: tie, misconception: 'Computed the tie probability.' },
        { value: q(1).sub(v), misconception: 'Answered the complement (at most as many heads as tails).' },
        { value: q(1).add(tie).mul(q(1, 2)), misconception: 'Counted ties as wins: that is P(heads ≥ tails).' },
      ] : [
        { value: new Q(nCr(n, (n + 1) / 2), BigInt(N)), misconception: 'Computed exactly one more head than tails, not "more".' },
        { value: q(1, 2).sub(new Q(nCr(n, (n - 1) / 2), BigInt(N)).mul(q(1, 2))), misconception: `Subtracted half a tie probability, but ${n} is odd: a tie is impossible.` },
        { value: q(1, 3), misconception: 'Split the outcomes into more heads, tie, more tails as equally likely thirds.' },
        { value: q(n + 1, 2 * n), misconception: 'Guessed a small edge above 1/2; symmetry gives exactly 1/2.' },
      ],
      steps: n % 2 === 0 ? [
        { say: `P(tie) = C(${n},${n / 2})/2^${n} = ${tie}.`, why: 'A tie needs exactly half heads.' },
        { say: `The rest splits evenly: P = (1 − ${tie})/2 = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Swapping H and T maps "more heads" onto "more tails".' },
      ] : [
        { say: `With ${n} flips a tie is impossible.`, why: `${n} is odd.` },
        { say: 'By H/T symmetry, P = 1/2.', why: 'Every "more heads" sequence has a mirror "more tails" sequence.' },
      ],
      hints: ['Can there be a tie?', 'Use the symmetry between heads and tails.', n % 2 === 0 ? `(1 − ${tie})/2.` : '1/2.'],
    };
  }
  if (kind === 'noHH') {
    const good = fib(n + 2);
    const v = q(good, N);
    return {
      value: v, data: { kind, n },
      text: `You flip a fair coin ${n} times. What is the probability that no two consecutive flips are both heads?`,
      distractors: [
        { value: qpow(q(3, 4), n - 1), misconception: 'Treated each neighbouring pair as independent. Overlapping pairs share a flip, so their events are dependent.' },
        { value: q(1).sub(q(n - 1, 4)), misconception: 'Subtracted 1/4 per neighbouring pair as if the "pair is HH" events were disjoint.' },
        { value: q(1).sub(v), misconception: 'Answered the complement: some HH appears.' },
        { value: q(n + 1, N), misconception: 'Counted only the sequences with at most one head.' },
        { value: q(fib(n + 1), N), misconception: 'Off by one in the Fibonacci count: used F(n+1) instead of F(n+2).' },
      ],
      steps: [
        { say: 'Let a(n) = number of good sequences of length n. A good sequence ends in T (then any good n − 1 before it) or in TH (then any good n − 2).', why: 'An H must be preceded by a T, so split on the last flip.' },
        { say: `a(n) = a(n−1) + a(n−2), with a(1) = 2, a(2) = 3: the Fibonacci numbers. a(${n}) = ${good}.`, why: 'The split gives the recursion; a(1) = {H, T}, a(2) = {HT, TH, TT}.' },
        { say: `P = ${good}/${N} ≈ ${(good / N).toFixed(3)}.`, why: 'Favourable over total.' },
      ],
      hints: ['Where can a head sit? What must come just before it?', 'Split on the last flip: T, or TH.', `The count is a Fibonacci number: ${good}.`],
    };
  }
  const k = rng.int(2, Math.min(4, n - 1));
  const good = N - noRun(n, k);
  const v = q(good, N);
  return {
    value: v, data: { kind: 'run', n, k },
    text: `You flip a fair coin ${n} times. What is the probability of seeing at least ${k} heads in a row somewhere?`,
    distractors: [
      { value: q(n - k + 1, 2 ** k), misconception: `Added 1/2^${k} for each of the ${n - k + 1} starting positions. Overlapping runs are counted many times.` },
      { value: q(1, 2 ** k), misconception: 'Only checked one fixed block of flips.' },
      { value: q(1).sub(v), misconception: 'Answered the complement.' },
      { value: q(1).sub(qpow(q(2 ** k - 1, 2 ** k), n - k + 1)), misconception: 'Treated the overlapping windows as independent. Neighbouring windows share flips.' },
      { value: q(1).sub(qpow(q(2 ** k - 1, 2 ** k), Math.floor(n / k))), misconception: `Only checked the ${Math.floor(n / k)} non-overlapping blocks of ${k}; runs can start anywhere.` },
    ],
    steps: [
      { say: `Count the complement: sequences with no run of ${k} heads, tracking the length of the current head run (0..${k - 1}).`, why: 'A tail resets the run; a head extends it; reaching length k is forbidden.' },
      { say: `That count is ${N - good} of ${N}.`, why: 'Step the counts forward one flip at a time.' },
      { say: `P = 1 − ${N - good}/${N} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Complement.' },
    ],
    hints: ['Count sequences that avoid the run instead.', 'Track the current run of heads: a tail resets it.', `${N - good} sequences avoid it.`],
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Coin sequences',
  skill: 'Count 2^n sequences; choose positions with C(n,k); handle neighbours with a recursion',
  levels: [1, 2, 3],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? rng.pick(['allSame', 'exactlyK']) : difficulty === 2 ? rng.pick(['exactlyK', 'moreHeads']) : rng.pick(['noHH', 'run']);
    const n = difficulty === 1 ? rng.int(3, 5) : rng.int(4, 10);
    const b = build(kind, n, rng);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      rule: 'All same: (1/2)^(n−1). Exactly k: C(n,k)/2^n. No HH: F(n+2)/2^n. Runs: count the complement with a run-length recursion.',
      anchor: 'One flip: 1/2. n flips: the same with one change, 2^n equally likely sequences, so every question is a count over 2^n.',
    });
  },

  // Independent check: enumerate every one of the 2^n sequences as bit patterns.
  verify(item) {
    const d = item.params;
    const N = 2 ** d.n;
    let hits = 0;
    for (let m = 0; m < N; m++) {
      const bits = Array.from({ length: d.n }, (_, i) => (m >> i) & 1); // 1 = head
      const h = bits.reduce((a, b) => a + b, 0);
      let best = 0, cur = 0, hh = false;
      bits.forEach((b, i) => { cur = b ? cur + 1 : 0; best = Math.max(best, cur); if (b && i > 0 && bits[i - 1]) hh = true; });
      const ok = d.kind === 'allSame' ? h === 0 || h === d.n
        : d.kind === 'exactlyK' ? h === d.k
          : d.kind === 'moreHeads' ? h > d.n - h
            : d.kind === 'noHH' ? !hh
              : best >= d.k;
      if (ok) hits++;
    }
    return agree(item, hits / N);
  },

  lesson: {
    purpose: 'Coin sequences are the cleanest counting problems: every sequence has the same probability, so everything is "count and divide by 2^n".',
    anchor: 'One flip: 1/2. n flips = the same with one change: 2^n equally likely strings, so a probability is a count of strings.',
    steps: [
      { say: 'Fixed number of heads: choose their positions, C(n,k).', why: 'A string is determined by where its heads are.' },
      { say: 'Symmetry: swapping H and T maps any event onto its mirror.', why: 'P(more heads) = P(more tails), so each is (1 − P(tie))/2.' },
      { say: 'Neighbour conditions (no HH, runs): count good strings with a recursion on the last flips.', why: 'Overlapping windows are dependent, so products or sums over windows are wrong.' },
    ],
    predict: { question: '10 flips: is P(no two heads in a row) above or below (3/4)^9 ≈ 0.075?', answer: 'Above: 144/1024 ≈ 0.141. Overlapping pairs are positively correlated in the "safe" direction.' },
    edge: 'n = 1: no HH is certain (2/2); n = 2: 3/4, where the independence guess happens to be exact.',
    rule: 'Count strings: C(n,k) for head counts, Fibonacci for no HH, a run-length table for runs.',
    contrast: '"Exactly k heads" (any positions) is a binomial count, C(n, k). "At least k heads in a row" (adjacent positions, runs overlap) is not: count the strings with no such run by a recursion and take the complement.',
  },
};
