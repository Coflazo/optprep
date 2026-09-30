// Impossibility and certainty traps (the reported free-throw item): one statement is impossible or
// certain by a counting bound, however plausible it sounds.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'impossible-bounds';
const binomGe = (n, k, [a, c]) => { if (k <= 0) return q(1); if (k > n) return q(0); let s = 0n; for (let j = k; j <= n; j++) s += nCr(n, j) * BigInt(a) ** BigInt(j) * BigInt(c - a) ** BigInt(n - j); return new Q(s, BigInt(c) ** BigInt(n)); };

function freeThrow(rng) {
  const [a, c] = rng.pick([[9, 10], [4, 5], [3, 4], [17, 20]]);
  const n = rng.pick([50, 100]), made = Math.round((n * a) / c), k = rng.pick([20, 50, 100]);
  const total = n + k;
  // impossible: needs more makes than shots left
  const needImp = made + k + rng.int(1, 3), pctImp = Math.ceil((1000 * needImp) / total) / 10;
  // certain: already guaranteed by the makes so far
  const pctSure = Math.floor((1000 * made) / total / 5) * 5 / 10;
  const j = Math.round(k * (a / c)) + rng.int(-2, 1);
  const mid = binomGe(k, j, [a, c]);
  return {
    text: `A basketball player has made ${made} of her first ${n} free throws. She will take ${k} more, making each with probability ${a}/${c}, independently.`,
    statements: [
      { text: `She finishes the ${total} shots with at least ${pctImp}% made.`, p: q(0), how: `${pctImp}% of ${total} needs at least ${Math.ceil((pctImp * total) / 100 - 1e-9)} makes, but she can reach at most ${made} + ${k} = ${made + k}. Impossible.` },
      { text: `She makes at least ${j} of the next ${k} shots.`, p: mid, how: `Binomial tail P(Bin(${k}, ${a}/${c}) ≥ ${j}).` },
      { text: `She finishes the ${total} shots with at least ${pctSure}% made.`, p: q(1), how: `She already has ${made} makes: ${made}/${total} = ${((100 * made) / total).toFixed(1)}% ≥ ${pctSure}% even if she misses everything. Certain.` },
    ],
    params: { scenario: 'freeThrow', made, n, k, a, c, pctImp, pctSure, j },
  };
}
function dice(rng) {
  const t = rng.int(4, 10), bad = rng.pick([13, 1, 14]), cap = rng.pick([12, 13]);
  let w = 0; for (let s = t; s <= 12; s++) w += 6 - Math.abs(s - 7);
  return {
    text: 'Two fair dice are thrown.',
    statements: [
      { text: `Their sum is ${bad}.`, p: q(0), how: 'Sums run from 2 to 12. Impossible.' },
      { text: `Their sum is at least ${t}.`, p: q(w, 36), how: `${w} of 36 ordered pairs.` },
      { text: `Their sum is at most ${cap}.`, p: q(1), how: 'The largest possible sum is 12. Certain.' },
    ],
    params: { scenario: 'dice', t, bad, cap },
  };
}
function coins(rng) {
  const n = rng.pick([6, 8, 10, 12]), d = rng.pick([1, 3, 5]);
  const k = n / 2;
  return {
    text: `A fair coin is flipped ${n} times.`,
    statements: [
      { text: `The number of heads minus the number of tails is exactly ${d}.`, p: q(0), how: `heads − tails = 2·heads − ${n} is even. Impossible.` },
      { text: `Exactly ${k} heads come up.`, p: new Q(nCr(n, k), 2n ** BigInt(n)), how: `C(${n},${k})/2^${n}.` },
      { text: 'At least one head or at least one tail comes up.', p: q(1), how: 'Every flip is one or the other. Certain.' },
    ],
    params: { scenario: 'coins', n, d },
  };
}
function cards(rng) {
  const k = rng.pick([5, 6, 7]);
  const allDiffRanks = (() => { let num = 1n, den = 1n; for (let i = 0; i < k; i++) { num *= BigInt(52 - 4 * i); den *= BigInt(52 - i); } return new Q(num, den); })();
  return {
    text: `You are dealt ${k} cards from a shuffled deck.`,
    statements: [
      { text: `At least two of the ${k} cards share a suit.`, p: q(1), how: `${k} cards, 4 suits: pigeonhole. Certain.` },
      { text: `All ${k} cards have different ranks.`, p: allDiffRanks, how: `52/52 × 48/51 × 44/50 × … (${k} factors).` },
      { text: `The ${k} cards include all four kings and all four queens.`, p: q(0), how: `That needs 8 cards; only ${k} are dealt. Impossible.` },
    ],
    params: { scenario: 'cards', k },
  };
}

export default {
  id: ID,
  section: 'll',
  title: 'Impossible and certain statements',
  skill: 'Check hard bounds before estimating: counts, parity and pigeonhole can force probability 0 or 1',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const s = (difficulty === 2 ? rng.pick([dice, coins, cards]) : rng.pick([freeThrow, freeThrow, cards, coins]))(rng);
      const order = rng.shuffle([0, 1, 2]);
      return rankItem(ID, rng, difficulty, {
        text: `${s.text} Rank the statements from most to least likely.`,
        statements: order.map((i) => s.statements[i]),
        intro: [{ say: 'Before estimating anything, test each statement against a hard bound: maximum possible count, parity, or pigeonhole.', why: 'A bound gives an exact 0 or 1, which fixes the ends of the ranking.' }],
        compare: 'Certain events go first and impossible events last; only the middle statement needs arithmetic.',
        rule: 'Check bounds first: more successes than trials → 0; guaranteed already → 1; wrong parity → 0; more items than boxes → 1.',
        anchor: 'Probabilities live in [0, 1]; a counting argument that rules an event in or out pins it to an endpoint.',
        hints: ['Is any statement impossible whatever happens?', 'Is any statement guaranteed by what already happened?', 'Only the remaining statement needs a real estimate.'],
        params: { ...s.params, order },
      });
    });
  },

  // Independent check: brute force the small scenarios; for free throws use a DP over the remaining shots.
  verify(item) {
    const d = item.params;
    let ps;
    if (d.scenario === 'freeThrow') {
      const p = d.a / d.c;
      let dist = [1];
      for (let i = 0; i < d.k; i++) { const nx = Array(dist.length + 1).fill(0); dist.forEach((v, j) => { nx[j] += v * (1 - p); nx[j + 1] += v * p; }); dist = nx; }
      const tot = d.n + d.k;
      const pFinal = (pct) => dist.reduce((s, v, j) => s + (100 * (d.made + j) >= pct * tot - 1e-9 ? v : 0), 0);
      ps = [pFinal(d.pctImp), dist.slice(d.j).reduce((a, b) => a + b, 0), pFinal(d.pctSure)];
    } else if (d.scenario === 'dice') {
      let lo = 0, mid = 0, hi = 0;
      const { bad, cap } = d;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { if (a + b === bad) lo++; if (a + b >= d.t) mid++; if (a + b <= cap) hi++; }
      ps = [lo / 36, mid / 36, hi / 36];
    } else if (d.scenario === 'coins') {
      let imp = 0, mid = 0, sure = 0;
      for (let m = 0; m < 2 ** d.n; m++) {
        let h = 0; for (let i = 0; i < d.n; i++) h += (m >> i) & 1;
        if (h - (d.n - h) === d.d) imp++; if (h === d.n / 2) mid++; if (h > 0 || h < d.n) sure++;
      }
      ps = [imp, mid, sure].map((x) => x / 2 ** d.n);
    } else {
      // cards: sequential-probability recursion over ranks for "all different"; bounds for the others
      let p = 1; for (let i = 0; i < d.k; i++) p *= (13 - i) * 4 / (52 - i);
      ps = [d.k > 4 ? 1 : NaN, p, d.k < 8 ? 0 : NaN];
    }
    // ps is in the scenario's canonical order; the item displays order[i] at position i
    return agreeRank(item, d.order.map((i) => ps[i]), 1e-9);
  },

  lesson: {
    purpose: 'A reported Likelihood List item hides an impossible statement behind a plausible story (a 90% shooter "reaching 95%"). Bounds settle such statements exactly and instantly.',
    anchor: 'Probabilities live in [0, 1]. A counting bound that rules an event out (or in) puts it at an endpoint without any estimation.',
    steps: [
      { say: 'For each statement ask: is it possible at all? Is it already guaranteed?', why: 'Max achievable count, parity, and pigeonhole are the three quick bounds.' },
      { say: 'Place impossible statements last and certain ones first.', why: 'Nothing beats 1 or loses to 0.' },
      { say: 'Estimate only what is left.', why: 'One real calculation instead of three.' },
    ],
    predict: { question: '90 of 100 made; 100 more shots. Can she finish at 96%?', answer: 'No: 96% of 200 = 192 makes, but at most 190 are possible.' },
    edge: 'A statement can be "almost impossible" (like 100 makes in a row) without being impossible; only a hard bound gives exactly 0.',
    rule: 'Bounds first: max count, parity, pigeonhole. Then estimate the rest.',
    contrast: 'Impossible (probability 0 by a bound) against very unlikely (positive but tiny).',
  },
};
