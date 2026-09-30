// Waiting for coin patterns: expected flips to HH vs HT, and Penney's game (which pattern first).
import { hittingTimes, absorptionProbs } from '../../../core/markov.js';
import { mcqItem, agree, q } from '../lib.js';

const ID = 'pattern-waiting';
const PATTERNS = { 2: ['HH', 'HT', 'TH', 'TT'], 3: ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'], 4: ['HHHH', 'HHTT', 'HTHT', 'HTTH', 'HHHT', 'THHH', 'HTHH'] };

// Conway correlation X·Y = sum over k of 2^(k-1) when the last k letters of X equal the first k of Y.
const corr = (X, Y) => { let s = 0; for (let k = 1; k <= Math.min(X.length, Y.length); k++) if (X.slice(-k) === Y.slice(0, k)) s += 2 ** (k - 1); return s; };
const overlaps = (A) => [...Array(A.length).keys()].map((i) => i + 1).filter((k) => A.slice(-k) === A.slice(0, k));

export default {
  id: ID,
  section: 'bto',
  title: 'Waiting for coin patterns',
  skill: 'Expected wait for a pattern = sum of 2^k over its self-overlaps; overlaps also decide Penney races',
  levels: [3, 4],

  generate(rng, { difficulty = 3 } = {}) {
    const race = difficulty === 4 && rng.chance(0.5);
    if (!race) {
      const L = difficulty === 3 ? rng.pick([2, 2, 3]) : rng.pick([3, 4]);
      const A = rng.pick(PATTERNS[L]);
      const ks = overlaps(A);
      const E = 2 * corr(A, A); // = sum over overlaps k of 2^k
      const run = 2 ** (L + 1) - 2;
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        value: q(E),
        text: `You flip a fair coin until the pattern ${A} appears in consecutive flips. What is the expected number of flips?`,
        distractors: [
          { value: 2 ** L, misconception: `Treated each block of ${L} flips as a fresh attempt with chance 1/2^${L}. Overlaps make some patterns slower than 2^${L}.` },
          { value: E === run ? 2 ** L : run, misconception: E === run ? 'Ignored the self-overlap: a near miss of a run pattern throws away the progress made.' : `Used the formula for ${'H'.repeat(L)} (2^${L + 1} − 2). That applies only to a pattern that overlaps itself at every shift.` },
          { value: 2 ** (L + 1), misconception: 'Doubled 2^L for no structural reason; only the self-overlaps add terms.' },
          { value: L * 2 ** (L - 1), misconception: 'Multiplied the length by 2^(L−1); the expected wait is a sum over self-overlaps, not a product.' },
          { value: E / 2, misconception: 'Summed 2^(k−1) instead of 2^k over the overlaps.' },
        ],
        steps: [
          { say: `List k where the last k letters of ${A} equal its first k letters: k = ${ks.join(', ')}.`, why: 'These self-overlaps say how much progress survives when a later flip breaks the pattern.' },
          { say: `Expected flips = ${ks.map((k) => `2^${k}`).join(' + ')} = ${E}.`, why: 'Conway\'s rule: each self-overlap of length k adds 2^k (fair-coin martingale argument).' },
          { say: `Check: HH (overlaps 1, 2) gives 2 + 4 = 6; HT (overlap 2 only) gives 4.`, why: 'After a failed HH attempt you restart; after a failed HT attempt (HH) you keep the last H.' },
        ],
        rule: 'E[wait for pattern] = Σ 2^k over self-overlaps k (full length always counts). HH = 6, HT = 4, HHH = 14.',
        anchor: 'Waiting for one head takes 2 flips on average. A pattern is the same wait with one change: a near miss may keep or destroy progress, depending on how the pattern overlaps itself.',
        hints: [`Does ${A} overlap itself? Compare its suffixes with its prefixes.`, 'Each overlap of length k contributes 2^k.', `Overlaps: ${ks.join(', ')}.`],
        data: { mode: 'wait', A },
      });
    }
    const L = rng.pick([2, 3, 3]);
    const pool = PATTERNS[L];
    let A, B;
    do { [A, B] = rng.shuffle(pool).slice(0, 2); } while (corr(A, A) - corr(A, B) === corr(B, B) - corr(B, A));
    // P(A first) = (BB - BA) / ((AA - AB) + (BB - BA)).
    const num = corr(B, B) - corr(B, A), den = corr(A, A) - corr(A, B) + num;
    const v = q(num, den);
    const EA = 2 * corr(A, A), EB = 2 * corr(B, B);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `A fair coin is flipped until either ${A} or ${B} appears in consecutive flips. What is the probability that ${A} appears first?`,
      distractors: [
        { value: 0.5, misconception: 'Assumed patterns of equal length are equally likely to appear first. Overlaps with each other change the race.' },
        { value: q(EB, EA + EB), misconception: 'Used the two expected waiting times as odds. Waiting times alone do not decide a race between overlapping patterns.' },
        { value: q(1).sub(v), misconception: `Computed the probability that ${B} appears first.` },
        { value: q(1, 2 ** L), misconception: `Computed P(the first ${L} flips are ${A}), ignoring what happens after a miss.` },
      ],
      steps: [
        { say: `Conway numbers: ${A}·${A} = ${corr(A, A)}, ${A}·${B} = ${corr(A, B)}, ${B}·${B} = ${corr(B, B)}, ${B}·${A} = ${corr(B, A)}.`, why: 'X·Y adds 2^(k−1) for each k where the last k letters of X equal the first k letters of Y.' },
        { say: `Odds ${A} : ${B} = (${B}·${B} − ${B}·${A}) : (${A}·${A} − ${A}·${B}) = ${num} : ${den - num}.`, why: 'Conway\'s formula for Penney\'s game.' },
        { say: `P(${A} first) = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Convert odds to a probability.' },
      ],
      rule: 'Penney: odds(A before B) = (BB − BA) : (AA − AB). A pattern whose prefix is the other\'s suffix tends to win.',
      anchor: 'The single-pattern waiting time with one change: two patterns race, so what matters is how each overlaps the other.',
      hints: ['Think about what each pattern needs just before it completes. Can one pattern "set up" the other?', 'Compute the four overlap numbers AA, AB, BB, BA.', `Odds ${num} : ${den - num}.`],
      data: { mode: 'race', A, B },
    });
  },

  // Independent check: build the pattern automaton as a Markov chain and solve it exactly.
  verify(item) {
    const d = item.params;
    const pats = d.mode === 'wait' ? [d.A] : [d.A, d.B];
    const states = new Set(['']);
    pats.forEach((p) => { for (let i = 1; i <= p.length; i++) states.add(p.slice(0, i)); });
    const list = [...states];
    const idx = new Map(list.map((s, i) => [s, i]));
    const next = (s, c) => { let t = s + c; while (!states.has(t)) t = t.slice(1); return t; };
    const P = list.map((s) => list.map(() => q(0)));
    list.forEach((s, i) => {
      if (pats.includes(s)) { P[i][i] = q(1); return; }
      for (const c of 'HT') { const j = idx.get(next(s, c)); P[i][j] = P[i][j].add(q(1, 2)); }
    });
    if (d.mode === 'wait') return agree(item, hittingTimes(P, [idx.get(d.A)])[idx.get('')]);
    const a = absorptionProbs(P, [idx.get(d.A), idx.get(d.B)], idx.get(d.A));
    return agree(item, a[idx.get('')]);
  },

  lesson: {
    purpose: 'HH takes longer to appear than HT, although each has chance 1/4 at any position. Traders get asked this because it separates "probability per window" from "waiting time".',
    anchor: 'You know the wait for one head is 2 flips. A pattern is the same wait with one change: after a near miss, you may keep part of your progress (HT) or lose it (HH).',
    steps: [
      { say: 'Find the self-overlaps: lengths k where the pattern\'s last k letters equal its first k.', why: 'An overlap means a completed or broken attempt can be the start of the next one.' },
      { say: 'Expected wait = Σ 2^k over those k (the full length always counts).', why: 'Fair-gambler argument: at the stopping time the bettors riding the overlaps hold exactly the fair value of the game.' },
      { say: 'For two patterns racing, use the four cross-overlaps AA, AB, BB, BA.', why: 'A pattern whose prefix matches the rival\'s suffix can "steal" the rival\'s progress.' },
    ],
    predict: { question: 'Which comes first more often in a race: HH or TH?', answer: 'TH, with probability 3/4. HH can only win if the first two flips are HH; after any T, TH must appear before HH.' },
    edge: 'Patterns with no self-overlap except the full length (like HT, HHT) wait exactly 2^L.',
    rule: 'Wait = Σ 2^k over self-overlaps. HH 6, HT 4, HHH 14, HTH 10, HHT 8. Race odds (BB − BA) : (AA − AB).',
    contrast: 'Probability at a fixed position (1/2^L for every pattern) against waiting time (depends on overlaps) against race odds (depends on cross-overlaps).',
  },
};
