// First to k wins (best-of series): win probability and the chance the series goes the distance.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, qpow } from '../lib.js';

const ID = 'race-to-k';
const PS = [[1, 2], [3, 5], [2, 3], [2, 5], [3, 4], [11, 20]];

// P(A wins a race to k) = sum_{j=0}^{k-1} C(k-1+j, j) p^k q^j (A wins game k+j, B has j wins).
function winRace(p, k) {
  let s = q(0);
  for (let j = 0; j < k; j++) s = s.add(new Q(nCr(k - 1 + j, j), 1n).mul(qpow(p, k)).mul(qpow(q(1).sub(p), j)));
  return s;
}

export default {
  id: ID,
  section: 'bto',
  title: 'First to k wins',
  skill: 'Imagine all 2k − 1 games are played: the race winner is whoever wins at least k of them',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const k = rng.int(2, 4), n = 2 * k - 1;
    const [a, c] = difficulty === 2 ? [1, 2] : rng.pick(PS.slice(1));
    const p = q(a, c), r = q(1).sub(p);
    const full = difficulty === 2 || rng.chance(0.4);
    if (full) {
      // Goes the distance: after 2k − 2 games it is k − 1 each.
      const v = new Q(nCr(2 * k - 2, k - 1), 1n).mul(qpow(p, k - 1)).mul(qpow(r, k - 1));
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `${a === 1 && c === 2 ? `Two evenly matched teams play a best-of-${n} series` : `Team A wins each game against team B with probability ${p}, independently. They play a best-of-${n} series`} (first to ${k} wins). What is the probability that the series goes all ${n} games?`,
        distractors: [
          { value: qpow(q(1, 2), n - 1), misconception: 'Counted one specific sequence of alternating wins; many orders give k − 1 wins each.' },
          { value: q(1, k), misconception: `Treated the ${k} possible series lengths as equally likely.` },
          { value: new Q(nCr(n, k), 1n).mul(qpow(p, k)).mul(qpow(r, k - 1)), misconception: `Required A to win ${k} of all ${n} games in any order; the question is about reaching game ${n} at all.` },
          { value: q(1).sub(v), misconception: 'Answered the probability that the series ends early.' },
          { value: q(1, 2), misconception: 'Treated "goes the distance" as a coin flip.' },
        ],
        steps: [
          { say: `The series reaches game ${n} exactly when the first ${n - 1} games split ${k - 1}–${k - 1}.`, why: 'Otherwise someone already has k wins.' },
          { say: `P = C(${n - 1}, ${k - 1}) × p^${k - 1} × (1 − p)^${k - 1} = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Choose which of the first games A wins.' },
        ],
        rule: 'Series of first-to-k goes the full 2k − 1 games with probability C(2k−2, k−1)(pq)^(k−1). Best-of-7, even teams: 20/64 = 5/16.',
        anchor: 'Exactly j heads in m flips, with one change: the "flips" are the first 2k − 2 games and j = k − 1.',
        hints: [`What must the score be after ${n - 1} games?`, `${k - 1} wins each, in any order.`, `C(${n - 1}, ${k - 1})(pq)^${k - 1}.`],
        params: { mode: 'full', k, a, c },
      });
    }
    const v = winRace(p, k);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `Team A wins each game against team B with probability ${p}, independently. They play until one team has won ${k} games (best of ${n}). What is the probability that team A wins the series?`,
      distractors: [
        { value: p, misconception: 'Used the single-game probability. A series amplifies the stronger team\'s edge.' },
        { value: qpow(p, k), misconception: `Required A to win the first ${k} games straight.` },
        { value: q(1).sub(v), misconception: 'Answered team B\'s probability.' },
        { value: new Q(nCr(n, k), 1n).mul(qpow(p, k)).mul(qpow(r, n - k)), misconception: `Computed A winning exactly ${k} of ${n} games; A also wins with more than ${k}.` },
        { value: 0.5, misconception: 'Treated a series between unequal teams as even.' },
      ],
      steps: [
        { say: `Pretend all ${n} games are played even after the series is decided.`, why: 'The extra games cannot change who reached k first: exactly one team wins at least k of the n games.' },
        { say: `A wins the series ⇔ A wins at least ${k} of ${n} games: Σ_{j=${k}}^{${n}} C(${n}, j) p^j (1 − p)^(${n} − j).`, why: 'Binomial tail.' },
        { say: `P = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: `Compare with one game: ${p.toNumber().toFixed(3)}.` },
      ],
      rule: 'Race to k = at least k wins out of 2k − 1 imagined games (binomial tail).',
      anchor: 'The binomial tail P(at least k of n), with one change: stopping early does not matter once you imagine the full n games.',
      hints: [`Would playing all ${n} games change the winner?`, 'Then it is a binomial tail.', `P(at least ${k} of ${n}).`],
      params: { mode: 'win', k, a, c },
    });
  },

  // Independent check: play out all 2^(2k-1) full-length sequences (weighted), stopping logic applied explicitly.
  verify(item) {
    const { mode, k, a, c } = item.params;
    const n = 2 * k - 1, p = a / c;
    let win = 0, full = 0;
    for (let m = 0; m < 2 ** n; m++) {
      let wa = 0, wb = 0, w = 1, winner = null, len = 0;
      for (let i = 0; i < n; i++) {
        const aw = (m >> i) & 1;
        w *= aw ? p : 1 - p;
        if (winner) continue;
        len++;
        if (aw) wa++; else wb++;
        if (wa === k) winner = 'A'; else if (wb === k) winner = 'B';
      }
      if (winner === 'A') win += w;
      if (len === n) full += w;
    }
    return agree(item, mode === 'win' ? win : full, 1e-9);
  },

  lesson: {
    purpose: 'Best-of series and "first to k" races look like they need a game tree. The imagine-all-games trick turns them into a binomial tail.',
    anchor: 'The binomial P(at least k successes in n trials), with one change: the real series stops early, but stopping does not change the winner.',
    steps: [
      { say: 'Imagine all 2k − 1 games are played regardless.', why: 'After someone reaches k, the extra games cannot give the other team k.' },
      { say: 'A wins the race ⇔ A wins at least k of the 2k − 1 games.', why: 'Exactly one team can have k or more.' },
      { say: 'The series goes the distance ⇔ the first 2k − 2 games split evenly.', why: 'Nobody has reached k before the last game.' },
    ],
    predict: { question: 'A 60% team in a best-of-7: above or below 60% to win the series?', answer: 'Above: about 71%. Longer series favour the stronger team.' },
    edge: 'Best of 1 (k = 1): the series probability equals the single-game probability.',
    rule: 'P(win race to k) = P(Bin(2k−1, p) ≥ k). Full length: C(2k−2, k−1)(pq)^(k−1).',
    contrast: 'Winning a series (at least k of 2k − 1) against winning exactly k games of 2k − 1.',
  },
};
