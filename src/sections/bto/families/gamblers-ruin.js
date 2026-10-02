// Gambler's ruin: fair win probability i/N, duration i(N − i), and the biased formula.
import { hittingTimes, absorptionProbs } from '../../../core/markov.js';
import { mcqItem, agree, q, qpow, pic } from '../lib.js';

const xs = (N) => Array.from({ length: N + 1 }, (_, x) => x);
const par = (x) => (String(x).includes('/') ? `(${x})` : String(x));

const ID = 'gamblers-ruin';
const BIASED = [[2, 5], [9, 20], [11, 20], [3, 5], [1, 3], [2, 3], [49, 100], [51, 100]];
const CTX = [
  (i, N, p) => `You have $${i} and bet $1 at a time on ${p ? `a game you win with probability ${p}` : 'fair coin flips'}. You stop when you reach $${N} or go broke.`,
  (i, N, p) => `A stock trades at ${i}. Each minute it moves up 1 ${p ? `with probability ${p}` : 'or down 1 with equal probability'}${p ? ' and down 1 otherwise' : ''}. A trader closes the position when the price hits ${N} or 0.`,
  (i, N, p) => `A particle starts at position ${i} on the integers 0 to ${N}. Each step it moves right ${p ? `with probability ${p}` : 'or left with probability 1/2 each'}${p ? ' and left otherwise' : ''}, until it hits 0 or ${N}.`,
];
const goal = (c, N) => (c === 0 ? `you reach $${N}` : c === 1 ? `the price hits ${N} before 0` : `the particle hits ${N} before 0`);

export default {
  id: ID,
  section: 'bto',
  title: 'Gambler\'s ruin',
  skill: 'Fair walk: P(hit N first) = i/N, duration i(N − i). Biased: (1 − r^i)/(1 − r^N) with r = q/p',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const ci = rng.int(0, CTX.length - 1), ctx = CTX[ci];
    const N = rng.int(4, difficulty === 4 ? 10 : 20), i = rng.int(1, N - 1);
    if (difficulty === 2) {
      const v = q(i, N);
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `${ctx(i, N, null)} What is the probability that ${goal(ci, N)}?`,
        distractors: [
          { value: 0.5, misconception: 'Assumed a fair game gives even chances of either end, ignoring where you start.' },
          { value: q(N - i, N), misconception: 'Answered the probability of hitting 0 first.' },
          { value: q(i, N - i), misconception: 'Used the odds i : (N − i) as a probability.' },
          { value: qpow(q(1, 2), N - i), misconception: 'Required winning every step in a row; the walk may go down and recover.' },
          { value: q(i, 2 * N), misconception: 'Halved i/N, as if only half the paths counted.' },
        ],
        steps: [
          { say: 'In a fair game your expected wealth never changes, including at the moment you stop.', why: 'A fair game is a martingale; stopping at a bounded time keeps the expectation.' },
          { say: `So N × P(hit ${N}) + 0 × P(hit 0) = ${i}.`, why: 'Expected final wealth = starting wealth.' },
          { say: `P = ${i}/${N}${v.toString() !== `${i}/${N}` ? ` = ${v}` : ''} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Solve.' },
        ],
        rule: 'Fair walk from i between 0 and N: P(hit N first) = i/N.',
        anchor: 'Expected value of a fair bet is zero; applied to the whole game, it pins down the chance of each ending.',
        hints: ['In a fair game, what happens to your expected wealth?', 'At the end you hold either N or 0.', `${i}/${N}.`],
        picture: pic('plot', { x: { min: 0, max: N, label: 'start' }, y: { min: 0, max: 1, label: `P(reach ${N} first)` }, curves: [{ label: 'x/N', points: xs(N).map((x) => [x, x / N]) }], markers: [{ x: i, y: i / N, label: `start ${i}: ${v}` }] }, `In a fair game the chance of reaching the top is a straight line in the starting point: 0 at 0, 1 at ${N}, so ${i}/${N} from ${i}.`),
        fast: `${i}/${N} = ${v}.`,
        check: `The two endings add to 1: P(reach ${N}) = ${v} and P(go broke) = ${q(N - i, N)}; starting ${i < N / 2 ? 'below' : i > N / 2 ? 'above' : 'at'} the middle puts the answer ${i < N / 2 ? 'below' : i > N / 2 ? 'above' : 'at'} 1/2.`,
        data: { mode: 'fairP', i, N },
      });
    }
    if (difficulty === 3) {
      const v = i * (N - i);
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        value: q(v),
        text: `${ctx(i, N, null)} What is the expected number of steps until one of the two ends is reached?`,
        distractors: [
          { value: Math.min(i, N - i), misconception: 'Assumed the walk heads straight to the nearer end.' },
          { value: i * N, misconception: 'Multiplied the start by the target; the formula uses the two distances to the ends.' },
          { value: (N - i) ** 2, misconception: 'Squared the distance to the top end, ignoring the bottom end.' },
          { value: v / 2, misconception: 'Halved i(N − i).' },
          { value: N, misconception: 'Guessed the width of the interval.' },
        ],
        steps: [
          { say: 'Let E(x) be the expected remaining steps from x. E(0) = E(N) = 0 and E(x) = 1 + (E(x−1) + E(x+1))/2.', why: 'One step, then continue from a neighbour.' },
          { say: 'The solution is E(x) = x(N − x).', why: 'Check: the second difference of x(N − x) is −2, which matches E(x+1) − 2E(x) + E(x−1) = −2.' },
          { say: `E(${i}) = ${i} × ${N - i} = ${v}.`, why: 'Substitute.' },
        ],
        rule: 'Fair walk exit time from an interval = (distance to one end) × (distance to the other).',
        anchor: 'First-step analysis E = 1 + average of neighbours, with one change: two absorbing walls instead of one target.',
        hints: ['Set up E(x) = 1 + average of E at the two neighbours.', 'Try a quadratic that vanishes at 0 and N.', `${i} × ${N - i}.`],
        picture: pic('plot', { x: { min: 0, max: N, label: 'start' }, y: { min: 0, max: Math.ceil((N * N) / 4) + 1, label: 'expected steps' }, curves: [{ label: 'x(N − x)', points: xs(N).map((x) => [x, x * (N - x)]) }], markers: [{ x: i, y: v, label: `start ${i}: ${v}` }] }, `The expected duration is a parabola: 0 at both walls, largest in the middle (${Math.floor(N / 2) * Math.ceil(N / 2)}). From ${i} it is ${i} × ${N - i}.`),
        fast: `${i} × ${N - i} = ${v}.`,
        check: `At least the distance to the nearer wall, ${Math.min(i, N - i)}, and at most the middle value ${Math.floor(N / 2) * Math.ceil(N / 2)}.`,
        data: { mode: 'fairE', i, N },
      });
    }
    const [a, c] = rng.pick(BIASED);
    const p = q(a, c), r = q(c - a, a);
    const v = q(1).sub(qpow(r, i)).div(q(1).sub(qpow(r, N)));
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `${ctx(i, N, p)} What is the probability that ${goal(ci, N)}?`,
      distractors: [
        { value: q(i, N), misconception: 'Used the fair-game answer i/N and ignored the bias. Over many steps a small edge compounds.' },
        { value: p, misconception: 'Used the single-step probability as the answer for the whole game.' },
        { value: qpow(p, N - i), misconception: 'Required winning every step in a row.' },
        { value: q(1).sub(v), misconception: 'Answered the probability of hitting 0 first.' },
        { value: q(1).sub(qpow(q(1).div(r), i)).div(q(1).sub(qpow(q(1).div(r), N))), misconception: 'Inverted the ratio: used p/q instead of q/p, which gives the answer for the opposite bias.' },
      ],
      steps: [
        { say: `Let r = (1 − p)/p = ${r}.`, why: 'r compares the down-step and up-step probabilities.' },
        { say: 'P(hit N first from i) = (1 − r^i)/(1 − r^N).', why: 'r^x is constant in expectation along the walk (a martingale), so it plays the role wealth played in the fair case.' },
        { say: `P = (1 − ${par(r)}^${i})/(1 − ${par(r)}^${N}) ≈ ${v.toNumber().toFixed(4)}.`, why: 'Substitute.' },
      ],
      rule: 'Biased ruin: P = (1 − r^i)/(1 − r^N), r = q/p. r → 1 recovers i/N.',
      anchor: 'The fair answer i/N, with one change: replace "wealth" by r^wealth, the quantity that stays fair when the game is not.',
      hints: ['What is r = q/p here?', 'Use (1 − r^i)/(1 − r^N).', `r = ${r}.`],
      picture: pic('plot', { x: { min: 0, max: N, label: 'start' }, y: { min: 0, max: 1, label: `P(reach ${N} first)` }, curves: [{ label: `p = ${p}`, points: xs(N).map((x) => [x, (1 - r.toNumber() ** x) / (1 - r.toNumber() ** N)]) }, { label: 'fair', points: xs(N).map((x) => [x, x / N]) }], markers: [{ x: i, y: v.toNumber(), label: `start ${i}: ${v.toNumber().toFixed(3)}` }] }, `With p = ${p} the curve bends ${p.cmp(q(1, 2)) > 0 ? 'above' : 'below'} the fair straight line: a small edge per step compounds over the many steps of the game.`),
      fast: `r = ${r}; (1 − r^${i})/(1 − r^${N}) ≈ ${v.toNumber().toFixed(4)}.`,
      check: `With p ${p.cmp(q(1, 2)) > 0 ? 'above' : 'below'} 1/2 the answer must be ${p.cmp(q(1, 2)) > 0 ? 'above' : 'below'} the fair ${q(i, N)}, and the edge grows with the length of the game.`,
      data: { mode: 'biased', i, N, a, c },
    });
  },

  // Independent check: exact absorption probabilities / hitting times on the chain 0..N.
  verify(item) {
    const { mode, i, N, a, c } = item.params;
    const p = mode === 'biased' ? q(a, c) : q(1, 2);
    const P = Array.from({ length: N + 1 }, (_, x) => Array.from({ length: N + 1 }, (_, y) => {
      if (x === 0 || x === N) return q(x === y ? 1 : 0);
      if (y === x + 1) return p;
      if (y === x - 1) return q(1).sub(p);
      return q(0);
    }));
    if (mode === 'fairE') return agree(item, hittingTimes(P, [0, N])[i]);
    return agree(item, absorptionProbs(P, [0, N], N)[i]);
  },

  lesson: {
    purpose: 'Bankroll, price-barrier and "who goes broke" questions are gambler\'s ruin. The fair case is a one-liner; the biased case shows how fast a small edge compounds.',
    anchor: 'A fair bet has expected profit zero. Applied to the whole game until it stops, that single fact gives the ruin probability.',
    steps: [
      { say: 'Fair game: E[final wealth] = starting wealth i.', why: 'Each step has zero expected change.' },
      { say: 'Final wealth is N (prob P) or 0: N·P = i, so P = i/N.', why: 'Solve the one equation.' },
      { say: 'Duration: E(x) = x(N − x).', why: 'The quadratic satisfies E = 1 + average of neighbours with zeros at the walls.' },
      { say: 'Biased: replace wealth by r^wealth with r = q/p; it is fair in expectation, giving (1 − r^i)/(1 − r^N).', why: 'E[r^(next)] = p·r^(x+1) + q·r^(x−1) = r^x when r = q/p.' },
    ],
    predict: { question: 'Start at 5 of 10. With p = 0.55 per step, is P(reach 10) closer to 0.55 or to 0.73?', answer: '0.73. With r = 9/11, (1 − r^5)/(1 − r^10) ≈ 0.73: a small edge compounds over many steps.' },
    edge: 'i = 0 or i = N: the game is already over (P = 0 or 1, duration 0).',
    rule: 'Fair: i/N and i(N − i). Biased: (1 − r^i)/(1 − r^N), r = q/p.',
    contrast: 'Probability of the ending (linear in i when fair) against time to the ending (quadratic, largest in the middle).',
  },
};
