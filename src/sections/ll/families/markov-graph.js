// Markov chain on a directed graph: long-run frequencies (stationary distribution) and 2-step
// probabilities. The trap variant lists nodes by how many arrows point into them, and the true
// long-run order is exactly the reverse.
import { stationary } from '../../../core/markov.js';
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'markov-graph';
const SPLITS = { 1: [[[1, 1]]], 2: [[[1, 2], [1, 2]], [[1, 3], [2, 3]], [[1, 4], [3, 4]], [[2, 5], [3, 5]]], 3: [[[1, 3], [1, 3], [1, 3]], [[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 3], [1, 6]], [[3, 5], [1, 5], [1, 5]]] };
const LAYOUT = {
  3: [[0.5, 0.05], [0.08, 0.95], [0.92, 0.95]],
  4: [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]],
};
const LABELS = ['A', 'B', 'C', 'D'];

function randomChain(rng, n) {
  const P = Array.from({ length: n }, () => Array(n).fill(null).map(() => q(0)));
  const edges = [];
  for (let i = 0; i < n; i++) {
    const deg = rng.int(1, Math.min(3, n));
    const targets = rng.shuffle([...Array(n).keys()].filter((j) => j !== i || rng.chance(0.3))).slice(0, deg);
    const split = rng.pick(SPLITS[targets.length]);
    targets.forEach((j, k) => { P[i][j] = q(...split[k]); edges.push({ from: LABELS[i], to: LABELS[j], p: q(...split[k]).toNumber(), label: q(...split[k]).toString() }); });
  }
  // irreducible: every node reaches every node
  const reach = (s) => { const seen = new Set([s]), st = [s]; while (st.length) { const u = st.pop(); for (let v = 0; v < n; v++) if (!P[u][v].isZero() && !seen.has(v)) { seen.add(v); st.push(v); } } return seen.size === n; };
  for (let s = 0; s < n; s++) if (!reach(s)) return null;
  return { P, edges };
}

// Trap chain on 4 nodes. Roles: H has 3 incoming arrows, M has 2, L has 1, X is the hidden
// fourth node. Probabilities are drawn so that most flow runs X -> L, making the long-run order
// L > M > H: the exact reverse of the arrow counts.
function trapChain(rng) {
  const f = (arr) => q(...rng.pick(arr));
  const a1 = f([[1, 2], [2, 3], [3, 4]]), b1 = f([[1, 5], [1, 4], [1, 3]]);
  const c1 = f([[1, 6], [1, 8], [1, 10]]), c2 = f([[1, 4], [1, 5], [1, 3]]), d1 = f([[3, 4], [4, 5], [5, 6]]);
  const [H, M, L, X] = rng.shuffle([0, 1, 2, 3]);
  const P = Array.from({ length: 4 }, () => Array(4).fill(null).map(() => q(0)));
  const set = (i, j, p) => { P[i][j] = p; };
  set(H, M, a1); set(H, X, q(1).sub(a1));
  set(M, H, b1); set(M, X, q(1).sub(b1));
  set(L, H, c1); set(L, M, c2); set(L, X, q(1).sub(c1).sub(c2));
  set(X, L, d1); set(X, H, q(1).sub(d1));
  const edges = [];
  P.forEach((r, i) => r.forEach((p, j) => { if (!p.isZero()) edges.push({ from: LABELS[i], to: LABELS[j], p: p.toNumber(), label: p.toString() }); }));
  return { P, edges, roles: [H, M, L] };
}

export default {
  id: ID,
  section: 'll',
  title: 'Markov chains on a graph',
  skill: 'Long-run frequency = stationary distribution (flow in = flow out); arrow counts are not probabilities',
  levels: [3, 4, 5],

  generate(rng, { difficulty = 3 } = {}) {
    return retry(() => {
      const n = difficulty === 3 ? 3 : rng.pick([3, 4]);
      const ch = randomChain(rng, n);
      if (!ch) return null;
      const nodes = LAYOUT[n].map(([x, y], i) => ({ id: LABELS[i], x, y }));
      const visual = { type: 'graph', nodes, edges: ch.edges };
      if (difficulty === 3) {
        const s0 = rng.int(0, n - 1);
        const two = [...Array(n).keys()].map((j) => { let t = q(0); for (let k = 0; k < n; k++) t = t.add(ch.P[s0][k].mul(ch.P[k][j])); return t; });
        const pick = rng.shuffle([...Array(n).keys()]).slice(0, 3);
        return rankItem(ID, rng, difficulty, {
          text: `A signal moves between the nodes each second, following an outgoing arrow with the probability shown. It starts at ${LABELS[s0]}. Rank the statements about where it is after exactly 2 seconds.`,
          visual,
          statements: pick.map((j) => ({ text: `After 2 seconds the signal is at ${LABELS[j]}.`, p: two[j], how: `Sum over the middle node k of P(${LABELS[s0]} → k) × P(k → ${LABELS[j]}).` })),
          intro: [{ say: `List every two-step path out of ${LABELS[s0]}.`, why: 'Each path probability is the product of its two arrows.' }],
          compare: 'Add path probabilities per end node and order them.',
          rule: 'P(2 steps i → j) = Σ_k P(i,k) P(k,j): multiply along paths, add over paths.',
          anchor: 'Chaining two conditional probabilities, summed over the possible middle stop.',
          hints: [`Where can the signal be after 1 second?`, 'From each of those, follow one more arrow.', 'Multiply along each path; add paths that end at the same node.'],
          params: { matrix: ch.P.map((r) => r.map((x) => x.toString())), start: s0, steps: 2, targets: pick, mode: 'nstep' },
        });
      }
      const trap = difficulty === 5;
      const tc = trap ? trapChain(rng) : null;
      if (trap) { ch.P = tc.P; ch.edges = tc.edges; visual.nodes = LAYOUT[4].map(([x, y], i) => ({ id: LABELS[i], x, y })); visual.edges = tc.edges; }
      const nn = ch.P.length;
      const pi = stationary(ch.P);
      const indeg = [...Array(nn).keys()].map((j) => ch.edges.filter((e) => e.to === LABELS[j] && e.from !== e.to).length);
      // Trap: display H, M, L (most incoming arrows first); the long-run order must be the exact reverse.
      const pick = trap ? tc.roles : rng.shuffle([...Array(nn).keys()]).slice(0, 3);
      if (trap) {
        const p = pick.map((j) => pi[j].toNumber());
        if (!(p[0] < p[1] && p[1] < p[2])) return null;
      }
      return rankItem(ID, rng, difficulty, {
        text: `A signal moves between the nodes each second, following an outgoing arrow with the probability shown. After running for a very long time, it is observed at a random moment.${trap ? ' The statements are listed by how many arrows point into each node.' : ''} Rank the statements from most to least likely.`,
        visual,
        statements: pick.map((j) => ({ text: `The signal is at ${LABELS[j]}${trap ? ` (${indeg[j]} incoming arrow${indeg[j] === 1 ? '' : 's'})` : ''}.`, p: pi[j], how: `Long-run fraction of time at ${LABELS[j]} from the balance equations π = πP.` })),
        intro: [
          { say: 'Solve the balance equations: for each node, long-run flow in = long-run flow out.', why: 'In the long run, the probability of being at each node stops changing: π = πP with Σπ = 1.' },
          ...(trap ? [{ say: 'Ignore how many arrows point in; what matters is how much probability flows along them.', why: 'Many low-probability arrows can carry less flow than one arrow of probability 1.' }] : []),
        ],
        compare: trap ? 'The long-run order is the exact reverse of the arrow-count order shown.' : 'Order the stationary probabilities.',
        rule: 'Long-run frequency = stationary π with π = πP, Σπ = 1. Count probability flow, not arrows.',
        anchor: 'Flow balance (what comes in must go out), applied to probability moving between nodes.',
        hints: ['In the long run, the chance of being at each node is constant. Write that as flow in = flow out.', 'Solve for the ratios between nodes, then normalise.', trap ? 'Do not trust the number of incoming arrows.' : 'Compare the three stationary probabilities.'],
        params: { matrix: ch.P.map((r) => r.map((x) => x.toString())), targets: pick, mode: trap ? 'trap' : 'stationary', inDegree: indeg },
      });
    });
  },

  // Independent check: floating-point iteration on the rendered edges (lazy chain for the long run,
  // explicit two-step path sums for the short run).
  verify(item) {
    const { nodes, edges } = item.prompt.visual;
    const n = nodes.length, idx = new Map(nodes.map((v, i) => [v.id, i]));
    const P = Array.from({ length: n }, () => Array(n).fill(0));
    edges.forEach((e) => { P[idx.get(e.from)][idx.get(e.to)] += e.p; });
    if (P.some((r) => Math.abs(r.reduce((a, b) => a + b, 0) - 1) > 1e-9)) return { ok: false, detail: 'rows do not sum to 1' };
    const d = item.params;
    let ps;
    if (d.mode === 'nstep') {
      ps = d.targets.map((j) => { let s = 0; for (let k = 0; k < n; k++) s += P[d.start][k] * P[k][j]; return s; });
    } else {
      let v = Array(n).fill(1 / n);
      for (let t = 0; t < 4000; t++) {
        const nx = v.map((x) => x / 2); // lazy step (P + I)/2 has the same stationary distribution and never oscillates
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) nx[j] += (v[i] * P[i][j]) / 2;
        v = nx;
      }
      ps = d.targets.map((j) => v[j]);
    }
    const r = agreeRank(item, ps, 1e-7);
    if (r.ok && d.mode === 'trap') r.ok = JSON.stringify(item.answerOrder) === '[2,1,0]';
    return r;
  },

  lesson: {
    purpose: 'A reported Likelihood List item shows a chain on a directed graph where the obvious reading (most arrows in = most visited) gives exactly the wrong order. The balance equations settle it.',
    anchor: 'Flow balance (in = out), applied to probability: in the long run, as much probability enters each node per step as leaves it.',
    steps: [
      { say: 'Write π_j = Σ_i π_i P(i → j) for each node, plus π_A + π_B + … = 1.', why: 'Stationary means the distribution is unchanged by one more step.' },
      { say: 'Solve for ratios: pick one node, express the others relative to it.', why: 'Three nodes need only two ratios.' },
      { say: 'Compare flows, not arrow counts: one arrow with probability 1 can outweigh three arrows with 1/4.', why: 'Probability, not topology, drives the long run.' },
    ],
    predict: { question: 'A goes to B with probability 1; B goes to A with 1/2 and stays with 1/2. Which node is visited more in the long run?', answer: 'B: π_B = 2/3, π_A = 1/3. B keeps half its mass each step.' },
    edge: 'A node with a self-loop of probability close to 1 absorbs most of the long-run time even with one incoming arrow.',
    rule: 'π = πP, Σπ = 1. Two steps: Σ_k P(i,k)P(k,j).',
    contrast: 'Long-run frequency (stationary π) against the state after two steps (depends on the start).',
  },
};
