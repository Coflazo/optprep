// Linearity of expectation with indicator variables: fixed points, distinct faces, empty boxes, runs, records.
import { mcqItem, agree, q, qpow, harmonic, sequences, permutations } from '../lib.js';

const ID = 'linearity';

function build(kind, rng) {
  if (kind === 'fixed') {
    const n = rng.int(3, 7);
    return {
      value: q(1), params: { kind, n },
      text: `${n} people drop their hats in a box and each takes one back at random. What is the expected number of people who get their own hat?`,
      distractors: [
        { value: q(1, n), misconception: 'Answered the chance that one particular person gets their hat, not the expected count.' },
        { value: q(n, 2), misconception: 'Assumed about half get their own hat.' },
        { value: 0, misconception: 'Assumed dependence between people makes matches cancel out.' },
        { value: n * Math.exp(-1), misconception: `Multiplied n by 1/e; 1/e is the probability that NO one matches, not a per-person chance.` },
        { value: q(n - 1, n), misconception: 'Computed the chance a given person does not match.' },
      ],
      steps: [
        { say: 'Let I_k = 1 if person k gets their own hat. The count is I_1 + … + I_n.', why: 'Indicators turn a count into a sum.' },
        { say: `E[I_k] = P(person k matches) = 1/${n}.`, why: 'Their hat is equally likely to be any of the n.' },
        { say: `E[count] = ${n} × 1/${n} = 1.`, why: 'Linearity holds even though the indicators are dependent.' },
      ],
      rule: 'Expected fixed points of a random permutation = 1, for every n.',
    };
  }
  if (kind === 'distinct') {
    const n = rng.int(2, 5), s = rng.pick([4, 6, 6, 8]);
    const v = q(s).mul(q(1).sub(qpow(q(s - 1, s), n)));
    return {
      value: v, params: { kind, n, s },
      text: `You roll a fair ${s === 6 ? 'die' : `${s}-sided die`} ${n} times. What is the expected number of different faces that appear?`,
      distractors: [
        { value: n, misconception: 'Assumed every roll shows a new face.' },
        { value: q(1).sub(qpow(q(s - 1, s), n)), misconception: 'Computed P(one particular face appears), not the expected number of faces that appear.' },
        { value: q(s).mul(qpow(q(s - 1, s), n)), misconception: 'Computed the expected number of faces that do NOT appear.' },
        { value: q(n).mul(q(s - 1, s)), misconception: `Took ${n} rolls times the chance each is "new" as if that were a fixed ${s - 1}/${s}.` },
        { value: Math.min(n, s) , misconception: 'Took the maximum possible number of distinct faces.' },
      ],
      steps: [
        { say: `Let I_f = 1 if face f appears at least once. The count is Σ_f I_f over ${s} faces.`, why: 'Count faces, not rolls.' },
        { say: `P(face f appears) = 1 − (${s - 1}/${s})^${n}.`, why: 'Complement of "missed on every roll".' },
        { say: `E = ${s} × (1 − (${s - 1}/${s})^${n}) = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Linearity over faces.' },
      ],
      rule: 'E[distinct values] = s(1 − (1 − 1/s)^n).',
    };
  }
  if (kind === 'empty') {
    const m = rng.int(3, 6), k = rng.int(3, 4);
    const v = q(k).mul(qpow(q(k - 1, k), m));
    return {
      value: v, params: { kind, m, k },
      text: `${m} balls are thrown independently and uniformly into ${k} boxes. What is the expected number of empty boxes?`,
      distractors: [
        { value: Math.max(0, k - m), misconception: 'Assumed the balls spread out perfectly.' },
        { value: qpow(q(k - 1, k), m), misconception: 'Computed P(a particular box is empty), not the expected number of empty boxes.' },
        { value: q(k).mul(q(1).sub(qpow(q(k - 1, k), m))), misconception: 'Computed the expected number of occupied boxes.' },
        { value: q(k).mul(qpow(q(k - 1, k), m - 1)), misconception: 'Off by one in the exponent.' },
      ],
      steps: [
        { say: `P(box j empty) = (${k - 1}/${k})^${m}.`, why: 'Every ball must miss box j.' },
        { say: `E[empty] = ${k} × (${k - 1}/${k})^${m} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Sum of indicators over boxes.' },
      ],
      rule: 'E[empty boxes] = k(1 − 1/k)^m.',
    };
  }
  if (kind === 'runs') {
    const n = rng.int(4, 12);
    return {
      value: q(n + 1, 2), params: { kind, n },
      text: `You flip a fair coin ${n} times. A run is a maximal block of equal outcomes (HHTHH has 3 runs). What is the expected number of runs?`,
      distractors: [
        { value: q(n, 2), misconception: 'Counted one run per change, forgetting the first run.' },
        { value: 2, misconception: 'Assumed a typical sequence has one run of heads and one of tails.' },
        { value: n, misconception: 'Assumed every flip starts a new run.' },
        { value: q(n - 1, 4), misconception: 'Counted expected HH pairs instead of runs.' },
      ],
      steps: [
        { say: 'Runs = 1 + (number of positions i where flip i+1 differs from flip i).', why: 'Each change starts a new run.' },
        { say: `There are ${n - 1} neighbouring pairs, each different with probability 1/2.`, why: 'Independent fair flips.' },
        { say: `E = 1 + (${n - 1})/2 = ${q(n + 1, 2)}.`, why: 'Linearity.' },
      ],
      rule: 'E[runs in n fair flips] = (n + 1)/2.',
    };
  }
  if (kind === 'hh') {
    const n = rng.int(4, 12);
    return {
      value: q(n - 1, 4), params: { kind, n },
      text: `You flip a fair coin ${n} times. What is the expected number of positions where two consecutive flips are both heads (overlaps count, so HHH contains 2)?`,
      distractors: [
        { value: q(n, 4), misconception: `Counted ${n} neighbouring pairs; there are ${n - 1}.` },
        { value: q(Math.floor(n / 2), 4), misconception: 'Only counted non-overlapping pairs.' },
        { value: q(n - 1, 2), misconception: 'Used 1/2 per pair; both flips must be heads: 1/4.' },
        { value: q(1).sub(qpow(q(3, 4), n - 1)), misconception: 'Computed P(at least one HH), not the expected count.' },
      ],
      steps: [
        { say: `Indicators for the ${n - 1} neighbouring pairs, each HH with probability 1/4.`, why: 'Two independent fair flips.' },
        { say: `E = ${n - 1}/4.`, why: 'Linearity works despite overlaps.' },
      ],
      rule: 'E[count of a pattern of length L] = (n − L + 1)/2^L.',
    };
  }
  if (kind === 'records') {
    const n = rng.int(3, 7);
    const v = harmonic(n);
    return {
      value: v, params: { kind, n },
      text: `The numbers 1 to ${n} are shuffled into a random order and read left to right. A record is a number larger than everything before it (the first number is always a record). What is the expected number of records?`,
      distractors: [
        { value: q(n, 2), misconception: 'Assumed half the positions are records.' },
        { value: 1, misconception: 'Only counted the first number.' },
        { value: Math.log(n), misconception: 'Used ln n; the exact answer H_n = 1 + 1/2 + … + 1/n is larger by about 0.58.' },
        { value: harmonic(n).sub(q(1)), misconception: 'Forgot that the first number is always a record.' },
      ],
      steps: [
        { say: 'Position k is a record iff it holds the largest of the first k numbers.', why: 'That is the definition.' },
        { say: 'P(record at k) = 1/k.', why: 'Each of the first k numbers is equally likely to be the largest.' },
        { say: `E = 1 + 1/2 + … + 1/${n} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Linearity.' },
      ],
      rule: 'E[records] = H_n ≈ ln n + 0.577.',
    };
  }
  const deck = rng.pick([[26, 26], [4, 4], [13, 39], [6, 6], [10, 5]]);
  const [r, b] = deck, N = r + b;
  const pSame = q(r * (r - 1) + b * (b - 1), N * (N - 1));
  const v = q(N - 1).mul(pSame);
  return {
    value: v, params: { kind: 'adjacent', r, b },
    text: `A deck of ${r} red and ${b} black cards is shuffled and laid in a row. What is the expected number of adjacent pairs with the same colour?`,
    distractors: [
      { value: q(N - 1, 2), misconception: 'Used 1/2 per pair (with replacement). Without replacement, the second card is slightly less likely to match.' },
      { value: q(N, 2), misconception: `Counted ${N} adjacent pairs; there are ${N - 1}.` },
      { value: pSame, misconception: 'Answered the probability for one pair, not the expected count.' },
      { value: q(N - 1).mul(q(1).sub(pSame)), misconception: 'Counted pairs with different colours.' },
    ],
    steps: [
      { say: `There are ${N - 1} adjacent pairs.`, why: 'Neighbours in a row of N cards.' },
      { say: `P(a given pair matches) = (${r}·${r - 1} + ${b}·${b - 1})/(${N}·${N - 1}) = ${pSame}.`, why: 'Two specific positions hold a uniformly random ordered pair of distinct cards.' },
      { say: `E = ${N - 1} × ${pSame} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Linearity.' },
    ],
    rule: 'E[count] = (number of places) × P(event at one place), dependence or not.',
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Linearity of expectation',
  skill: 'Write a count as a sum of indicators; E[count] = Σ P(indicator), even when they are dependent',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const kind = difficulty === 2 ? rng.pick(['fixed', 'runs', 'hh']) : difficulty === 3 ? rng.pick(['distinct', 'empty', 'adjacent']) : rng.pick(['records', 'adjacent', 'distinct']);
    const b = build(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      ev: true,
      minGap: (c) => Math.max(0.04, Math.abs(c) * 0.05),
      ...b,
      anchor: 'E[X + Y] = E[X] + E[Y], with one change: X and Y are 0/1 indicators of small events, so each expectation is just a probability.',
      hints: ['What is being counted? Write it as a sum of 0/1 indicators.', 'Find the probability for one indicator.', 'Multiply by the number of indicators.'],
    });
  },

  // Independent check: brute-force enumeration of every outcome (small parameters by design).
  verify(item) {
    const d = item.params;
    let tot = 0, cnt = 0;
    if (d.kind === 'fixed' || d.kind === 'records') {
      for (const p of permutations(d.kind === 'fixed' ? d.n : d.n)) {
        cnt++;
        if (d.kind === 'fixed') tot += p.filter((x, i) => x === i).length;
        else { let best = -1; for (const x of p) if (x > best) { best = x; tot++; } }
      }
    } else if (d.kind === 'distinct') {
      for (const s of sequences(d.s, d.n)) { cnt++; tot += new Set(s).size; }
    } else if (d.kind === 'empty') {
      for (const s of sequences(d.k, d.m)) { cnt++; tot += d.k - new Set(s).size; }
    } else if (d.kind === 'runs' || d.kind === 'hh') {
      for (let m = 0; m < 2 ** d.n; m++) {
        cnt++;
        const f = (i) => (m >> i) & 1;
        for (let i = 1; i < d.n; i++) tot += d.kind === 'runs' ? (f(i) !== f(i - 1) ? 1 : 0) : (f(i) && f(i - 1) ? 1 : 0);
        if (d.kind === 'runs') tot += 1;
      }
    } else {
      // adjacent: every ordered pair of distinct cards is equally likely at two fixed neighbouring positions.
      const cards = [...Array(d.r).fill('r'), ...Array(d.b).fill('b')];
      let same = 0, pairs = 0;
      for (let i = 0; i < cards.length; i++) for (let j = 0; j < cards.length; j++) if (i !== j) { pairs++; if (cards[i] === cards[j]) same++; }
      return agree(item, (cards.length - 1) * same / pairs);
    }
    return agree(item, tot / cnt);
  },

  lesson: {
    purpose: '"Expected number of ..." questions look like they need the full distribution. They almost never do: linearity reduces them to one probability times a count.',
    anchor: 'E[X + Y] = E[X] + E[Y], with one change: split the count into 0/1 indicators, whose expectations are probabilities.',
    steps: [
      { say: 'Name what is counted and write count = Σ I_j, one indicator per place, face, box or person.', why: 'Every count is a sum of yes/no questions.' },
      { say: 'E[I_j] = P(event j).', why: 'An indicator is 1 with that probability and 0 otherwise.' },
      { say: 'Add them up; dependence between the indicators does not matter.', why: 'Linearity of expectation needs no independence.' },
    ],
    predict: { question: 'Shuffle a deck: expected number of cards in their original position?', answer: '1: 52 cards × 1/52 each.' },
    edge: 'Dependence can make the count highly variable (e.g. exactly n − 1 fixed points is impossible) without changing its mean.',
    rule: 'E[count] = Σ P(each event). Fixed points 1; runs (n+1)/2; records H_n; empty boxes k(1 − 1/k)^m.',
    contrast: 'Expected count (linearity, easy) against P(count ≥ 1) (needs inclusion-exclusion or a complement).',
  },
};
