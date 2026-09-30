import { Q, ZERO, ONE } from '../../../core/rational.js';
import { hittingTimes } from '../../../core/markov.js';
import { ivItem } from '../lib.js';

// Expected waiting times for patterns in coin or die sequences, via the overlap formula.
// For a pattern w over an alphabet with letter probabilities p, E[T] = Σ over k where the
// length-k prefix equals the length-k suffix of 1/P(prefix of length k).
function overlapWait(pattern, prob) {
  let e = ZERO;
  for (let k = 1; k <= pattern.length; k++) {
    if (pattern.slice(0, k) === pattern.slice(pattern.length - k)) {
      let p = ONE;
      for (const ch of pattern.slice(0, k)) p = p.mul(prob(ch));
      e = e.add(ONE.div(p));
    }
  }
  return e;
}

const COIN = ['HH', 'HT', 'HHH', 'HTH', 'THH', 'HHT', 'HTT', 'HHHH', 'HTHT', 'HHTT', 'THTH', 'HTHH'];
const DIE = [['66', 'two sixes in a row'], ['61', 'a six immediately followed by a one'], ['666', 'three sixes in a row'], ['616', 'the run six, one, six'], ['12', 'a one immediately followed by a two'], ['11', 'two ones in a row']];

const fam = {
  id: 'waiting-time',
  section: 'iv',
  title: 'Expected waiting times for patterns',
  skill: 'Patterns that overlap themselves take longer: E = sum of 1/P(prefix) over prefixes that are also suffixes',
  levels: [2, 3, 4],
  generate(rng, { difficulty = 2 } = {}) {
    let text, pattern, prob, desc, unit;
    if (difficulty === 2 || (difficulty === 3 && rng.chance(0.5))) {
      pattern = rng.pick(COIN.filter((w) => (difficulty === 2 ? w.length <= 3 : w.length >= 3)));
      const biased = difficulty === 3 && rng.chance(0.5);
      const ph = biased ? Q.of(rng.pick([1, 2]), 3) : Q.of(1, 2);
      prob = (ch) => (ch === 'H' ? ph : ONE.sub(ph));
      desc = pattern.split('').join('');
      text = `A ${biased ? `biased coin (P(heads) = ${ph.toString()})` : 'fair coin'} is tossed until the sequence ${desc} first appears in consecutive tosses. What is the expected number of tosses?`;
      unit = 'tosses';
    } else if (difficulty === 3) {
      const [w, d] = rng.pick(DIE.filter(([x]) => x.length === 2));
      pattern = w; desc = d; prob = () => Q.of(1, 6);
      text = `A fair die is rolled until ${d} first appears. What is the expected number of rolls?`;
      unit = 'rolls';
    } else {
      const [w, d] = rng.pick(DIE.filter(([x]) => x.length === 3).concat([['6666', 'four sixes in a row'], ['1234', 'the run one, two, three, four']]));
      pattern = w; desc = d; prob = () => Q.of(1, 6);
      text = `A fair die is rolled until ${d} first appears. What is the expected number of rolls?`;
      unit = 'rolls';
    }
    const e = overlapWait(pattern, prob), truth = e.toNumber();
    const overlaps = [];
    for (let k = 1; k <= pattern.length; k++) if (pattern.slice(0, k) === pattern.slice(pattern.length - k)) overlaps.push(pattern.slice(0, k));
    return ivItem(fam, rng, difficulty, {
      text, truth, unit, coach: { exact: true, belief: { kind: 'point' }, note: 'Exact by the overlap rule: zero width.' }, exact: e.toString(),
      steps: [
        { say: `Prefixes of ${pattern} that are also suffixes: ${overlaps.join(', ')}.`, why: 'After a partial match fails, an overlapping prefix lets the search restart part-way instead of from zero; each overlap adds its own waiting cost.' },
        { say: `E = ${overlaps.map((w) => `1/P(${w})`).join(' + ')} = ${overlaps.map((w) => { let p = ONE; for (const c of w) p = p.mul(prob(c)); return ONE.div(p).toString(); }).join(' + ')} = ${e.toString()}.`, why: 'Overlap rule (a fair-game or martingale argument): each overlapping prefix contributes 1/P(prefix).' },
      ],
      hints: ['Does the pattern overlap itself (can its end be the start of a new copy)?', 'Add 1/P(prefix) for every prefix that is also a suffix, including the whole pattern.'],
      params: { scenario: 'pattern', pattern, letterProbs: [...new Set(pattern)].map((c) => [c, Number(prob(c).n), Number(prob(c).d)]), alphabet: /[HT]/.test(pattern) ? 'HT' : '123456' },
    });
  },
  // Independent check: pattern-matching automaton as a Markov chain, solved exactly.
  verify(item) {
    const { pattern } = item.params;
    const pm = new Map(item.params.letterProbs.map(([c, n, d]) => [c, Q.of(n, d)]));
    const alphabet = item.params.alphabet.split('');
    const pOf = (c) => pm.get(c) ?? (alphabet.length === 2 ? ONE.sub([...pm.values()][0]) : Q.of(1, 6));
    const L = pattern.length;
    const next = (state, c) => { const s = pattern.slice(0, state) + c; for (let k = Math.min(L, s.length); k >= 0; k--) if (s.endsWith(pattern.slice(0, k))) return k; return 0; };
    const P = Array.from({ length: L + 1 }, (_, st) => {
      const row = Array(L + 1).fill(ZERO);
      if (st === L) { row[L] = ONE; return row; }
      for (const c of alphabet) { const t = next(st, c); row[t] = row[t].add(pOf(c)); }
      return row;
    });
    const h = hittingTimes(P, [L])[0].toNumber();
    return { ok: Math.abs(h - item.truth) < 1e-9, detail: `automaton ${h}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Waiting-time questions are exact and quick once you know the overlap rule. They also expose a classic false intuition: HH and HT are not equally slow.',
    anchor: 'Waiting for one event with chance p takes 1/p tries. A pattern is the same idea with one change: after a near miss, overlap lets you keep part of your progress.',
    steps: [
      { say: 'List the prefixes of the pattern that are also suffixes (always including the whole pattern).', why: 'These are the ways a failed attempt can still count towards the next one.' },
      { say: 'E[T] = Σ 1/P(prefix) over those prefixes.', why: 'A fair-bet (martingale) argument: each gambler betting on the pattern contributes the inverse of the prefix probability.' },
    ],
    predict: { question: 'Fair coin: E[tosses to HH] versus HT?', answer: 'HH = 4 + 2 = 6 (H overlaps), HT = 4 (no overlap).' },
    rule: 'E[T] = Σ over prefix = suffix of 1/P(prefix).',
    contrast: 'The chance that HH or HT appears at a given position is the same (1/4); the waiting time differs because of overlap.',
    edge: 'For "two sixes in a row" the answer is 36 + 6 = 42, not 36.',
  },
};
export default fam;
