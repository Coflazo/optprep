// Symmetric random walks on polygons: return time, hitting time, last vertex visited, two walkers meeting.
import { hittingTimes, absorptionProbs } from '../../../core/markov.js';
import { mcqItem, agree, q } from '../lib.js';

const ID = 'polygon-walk';
const NAMES = { 4: 'square', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
const shape = (n) => (n === 4 ? "a square" : `a regular ${NAMES[n] || `${n}-gon`}`);
const MOVE = 'Each second it moves to one of the two neighbouring vertices, each with probability 1/2.';

export default {
  id: ID,
  section: 'bto',
  title: 'Random walks on polygons',
  skill: 'Cycle walk: return time n, hitting time k(n − k), every other vertex equally likely to be last',
  levels: [3, 4, 5],

  generate(rng, { difficulty = 3 } = {}) {
    const kind = difficulty === 3 ? rng.pick(['return', 'hit']) : difficulty === 4 ? rng.pick(['hit', 'last', 'return']) : rng.pick(['meet', 'meet', 'last']);
    if (kind === 'return') {
      const n = rng.pick([4, 5, 6, 6, 7, 8, 10, 12]);
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        value: q(n),
        text: `A token starts at a vertex of ${shape(n)}. ${MOVE} What is the expected number of seconds until it first returns to its starting vertex?`,
        distractors: [
          { value: n / 2, misconception: 'Assumed the token goes about halfway round and comes back.' },
          { value: n * n, misconception: 'Squared n; that is the scale of the time to wander far, not to return.' },
          { value: 2, misconception: 'Only counted the path "step out, step straight back", which happens with probability 1/2.' },
          { value: n - 1, misconception: 'Computed the expected time to reach an adjacent vertex from the start (1 × (n − 1)), not the return time.' },
          { value: Math.floor(n / 2) * Math.ceil(n / 2), misconception: 'Computed the expected time to reach the opposite vertex.' },
        ],
        steps: [
          { say: `In the long run the token spends equal time at every vertex: 1/${n} each.`, why: 'The walk is symmetric, so the uniform distribution is stationary.' },
          { say: `Expected return time = 1/(stationary probability) = ${n}.`, why: 'Visits to a state are spaced, on average, by the reciprocal of its long-run frequency (Kac\'s lemma).' },
          { say: `Check by first steps: 1 + (hitting time from a neighbour) = 1 + 1 × (${n} − 1) = ${n}.`, why: 'Hitting time from distance k is k(n − k).' },
        ],
        rule: 'Return time to a vertex of an n-cycle = n (1/stationary probability).',
        anchor: 'Long-run frequency 1/n per vertex, with one change: turn a frequency into a waiting time by taking the reciprocal.',
        hints: ['What fraction of time does the token spend at each vertex in the long run?', 'Mean return time = 1 / long-run fraction.', `${n}.`],
        data: { kind, n },
      });
    }
    if (kind === 'hit') {
      const n = rng.pick(difficulty === 3 ? [4, 5, 6, 8] : [6, 7, 8, 9, 10, 12]);
      const k = rng.int(1, Math.floor(n / 2));
      const v = k * (n - k);
      return mcqItem(ID, rng, difficulty, {
        ev: true,
        value: q(v),
        text: `A token starts at vertex 0 of ${shape(n)} with vertices numbered 0 to ${n - 1} around it. ${MOVE} What is the expected number of seconds until it first reaches vertex ${k}?`,
        distractors: [
          { value: k, misconception: 'Assumed the token walks straight there; it wanders back and forth.' },
          { value: k * k, misconception: `Used the line formula k² for a walk with no walls. On the ${NAMES[n] || 'polygon'}, the far side is a second route, giving k(n − k).` },
          { value: (n / 2) ** 2, misconception: 'Used the opposite-vertex answer for every target.' },
          { value: n, misconception: 'Used the return time n.' },
          { value: v / 2, misconception: 'Halved k(n − k), as if the token always chose the shorter side.' },
        ],
        steps: [
          { say: `Cut the polygon open at vertex ${k}: the token sits on a line with the target at both ends, ${k} steps one way and ${n - k} steps the other.`, why: 'Reaching vertex k from either side ends the walk.' },
          { say: `On a line, the expected time to leave the interval from distances a and b is a × b.`, why: 'Gambler\'s-ruin duration for a fair walk: E = a·b.' },
          { say: `E = ${k} × ${n - k} = ${v}.`, why: 'Apply with a = k, b = n − k.' },
        ],
        rule: 'Hitting time on an n-cycle from distance k = k(n − k). Opposite vertex of a hexagon: 9.',
        anchor: 'Gambler\'s ruin duration a·b, with one change: the polygon is a line whose two ends are the same vertex.',
        hints: ['Unroll the polygon: which two ends stop the walk?', 'Fair walk between walls at distance a and b lasts a·b on average.', `${k} × ${n - k}.`],
        data: { kind, n, k },
      });
    }
    if (kind === 'last') {
      const n = rng.pick([5, 6, 7, 8, 10, 12]);
      const k = rng.int(1, Math.floor(n / 2));
      return mcqItem(ID, rng, difficulty, {
        value: q(1, n - 1),
        text: `A token starts at vertex 0 of ${shape(n)} with vertices numbered 0 to ${n - 1}. ${MOVE} It keeps moving until every vertex has been visited. What is the probability that vertex ${k} is the last one to be visited?`,
        distractors: [
          { value: q(1, n), misconception: 'Counted the starting vertex among the candidates; it is already visited.' },
          { value: k === Math.floor(n / 2) ? 0.5 : q(k, n), misconception: 'Assumed far vertices are much more likely to be last. Every other vertex is equally likely.' },
          { value: q(2, n - 1), misconception: 'Doubled for the two sides of approach; the two approaches are already inside the 1/(n − 1).' },
          { value: q(1, n - 2), misconception: 'Excluded both the start and a neighbour; only the start is excluded.' },
          { value: 0, misconception: `Assumed vertex ${k} is too close to be last; the walk can go all the way round the other way first.` },
        ],
        steps: [
          { say: `Vertex ${k} is last exactly when the token reaches one of its neighbours first and then goes all the way round to the other neighbour without touching ${k}.`, why: 'At that moment every vertex except k has been seen.' },
          { say: `P(reach neighbour ${k - 1} before ${k + 1 === n ? 0 : k + 1} the long way) × P(then cover n − 2 steps before 1 step back) = ${n - k - 1}/${n - 2} × 1/${n - 1}, plus the mirror term ${k - 1}/${n - 2} × 1/${n - 1}.`, why: 'Two gambler\'s-ruin probabilities for a fair walk.' },
          { say: `Sum = (${n - 2}/${n - 2}) × 1/${n - 1} = 1/${n - 1}, whatever k is.`, why: 'The k-dependence cancels.' },
        ],
        rule: 'On a cycle, every non-starting vertex is equally likely to be the last one visited: 1/(n − 1).',
        anchor: 'Gambler\'s ruin i/N, used twice, with one change: the walls move as the visited arc grows.',
        hints: ['What must have happened just before vertex k is visited last?', 'The token sits at one neighbour of k, having visited everything else.', 'The answer does not depend on k.'],
        data: { kind, n, k },
      });
    }
    // Two walkers on an even polygon starting D apart (D even), both moving each second.
    const n = rng.pick([6, 8, 8, 10, 12]);
    const Ds = [...Array(n / 2 + 1).keys()].filter((d) => d > 0 && d % 2 === 0);
    const D = rng.pick(Ds);
    const m = n / 2, j = D / 2;
    const v = 2 * j * (m - j);
    return mcqItem(ID, rng, difficulty, {
      ev: true,
      value: q(v),
      text: `Two tokens sit ${D} vertices apart on ${shape(n)}. Every second, both move at the same time, each to a neighbouring vertex with probability 1/2, independently. What is the expected number of seconds until they first land on the same vertex?`,
      distractors: [
        { value: j * (m - j), misconception: 'Forgot the seconds when both move the same way and the gap stays put: the gap walk is lazy, which doubles the time.' },
        { value: D * (n - D), misconception: 'Treated one token as fixed and let the other walk alone.' },
        { value: (D * (n - D)) / 2, misconception: 'Halved the single-walker time, reasoning that two walkers close the gap twice as fast.' },
        { value: D, misconception: 'Assumed the tokens head straight for each other.' },
        { value: 4 * j * (m - j), misconception: 'Counted the gap in single vertices on the full n-cycle and also doubled for laziness.' },
      ],
      steps: [
        { say: 'Track only the gap. Each second it changes by −2, 0 or +2 with probabilities 1/4, 1/2, 1/4.', why: 'Both move toward, both away, or both the same way.' },
        { say: `The gap is always even, so measure it in pairs of vertices: a lazy fair walk on a ${m}-cycle starting ${j} away.`, why: 'Odd gaps never occur, and meeting means gap 0.' },
        { say: `Non-lazy hitting time: ${j} × (${m} − ${j}) = ${j * (m - j)}. The walk only moves half the time, so E = 2 × ${j * (m - j)} = ${v}.`, why: 'A walk that pauses with probability 1/2 takes twice as long on average.' },
      ],
      rule: 'Two walkers: study the difference. Gap steps −2/0/+2 with 1/4, 1/2, 1/4 → lazy walk on an (n/2)-cycle: E = 2j(n/2 − j).',
      anchor: 'Single-walker hitting time k(n − k), with one change: the gap is itself a walk that sometimes stands still.',
      hints: ['Follow the distance between the tokens, not the tokens themselves.', 'How does the gap change in one second? What is its parity?', `A lazy walk on a ${m}-cycle from distance ${j}.`],
      data: { kind: 'meet', n, D },
    });
  },

  // Independent check: exact Markov-chain solves (hitting times, gambler's ruin, the directed gap chain).
  verify(item) {
    const d = item.params;
    const cycle = (n, lazy = false) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
      const nb = j === (i + 1) % n || j === (i + n - 1) % n;
      if (lazy) return j === i ? q(1, 2) : nb ? q(1, 4) : q(0);
      return nb ? q(1, 2) : q(0);
    }));
    if (d.kind === 'return') {
      const h = hittingTimes(cycle(d.n), [0]);
      return agree(item, q(1).add(h[1].add(h[d.n - 1]).mul(q(1, 2))));
    }
    if (d.kind === 'hit') return agree(item, hittingTimes(cycle(d.n), [d.k])[0]);
    if (d.kind === 'meet') {
      // Directed gap g = (b - a) mod n moves by -2, 0, +2 with 1/4, 1/2, 1/4.
      const n = d.n;
      const P = Array.from({ length: n }, (_, g) => Array.from({ length: n }, (_, h) => {
        let p = q(0);
        if (h === (g + 2) % n) p = p.add(q(1, 4));
        if (h === (g + n - 2) % n) p = p.add(q(1, 4));
        if (h === g) p = p.add(q(1, 2));
        return p;
      }));
      // odd gaps are unreachable from an even start; give them a self-loop so the system stays solvable
      for (let g = 1; g < n; g += 2) P[g] = P[g].map((_, h) => (h === 0 ? q(1) : q(0)));
      return agree(item, hittingTimes(P, [0])[d.D]);
    }
    // last vertex: two gambler's-ruin legs on a line, each solved exactly.
    const line = (N) => Array.from({ length: N + 1 }, (_, i) => Array.from({ length: N + 1 }, (_, j) =>
      (i === 0 || i === N) ? q(i === j ? 1 : 0) : (j === i - 1 || j === i + 1) ? q(1, 2) : q(0)));
    const { n, k } = d;
    // Leg 1: from 0, hit k-1 (clockwise neighbour side) before k+1-n (counter-clockwise neighbour).
    const L = n - 2; // positions -(n-k-1) .. (k-1) shifted to 0..L
    const leg1 = absorptionProbs(line(L), [0, L], L)[n - k - 1];
    const leg2 = absorptionProbs(line(n - 1), [0, n - 1], n - 1)[1]; // cover n-2 steps before 1 back
    const p = leg1.mul(leg2).add(q(1).sub(leg1).mul(leg2));
    return agree(item, p);
  },

  lesson: {
    purpose: 'Random walks on a hexagon or octagon are a reported Beat the Odds staple. Three facts (return time, hitting time, last vertex) answer almost every variant in seconds.',
    anchor: 'Gambler\'s ruin on a line (win probability i/N, duration a·b) with one change: the ends of the line are glued into a circle.',
    steps: [
      { say: 'Return time: the walk spends 1/n of its time at each vertex, so returns take n steps on average.', why: 'Mean return time = 1/(long-run frequency).' },
      { say: 'Hitting time from distance k: unroll the cycle at the target; walls at k and n − k: E = k(n − k).', why: 'Fair-walk exit time from an interval is the product of the distances to the ends.' },
      { say: 'Last vertex visited: every non-start vertex has chance 1/(n − 1).', why: 'Two gambler\'s-ruin legs whose k-dependence cancels.' },
      { say: 'Two walkers: study the gap. It is a lazy walk, so double the one-walker time on the halved cycle.', why: 'Differences of symmetric walks are symmetric walks.' },
    ],
    predict: { question: 'Hexagon: expected time from a vertex to the opposite one?', answer: '9 = 3 × 3. Return to the start takes only 6.' },
    edge: 'Adjacent target on an n-cycle: 1 × (n − 1). The shortest target is the slowest per unit of distance.',
    rule: 'Return n; hit k(n − k); last vertex 1/(n − 1); meeting walkers 2j(n/2 − j).',
    contrast: 'Return time (n, grows linearly) against crossing time (n²/4, grows quadratically).',
  },
};
