// Likelihood List family: Markov chains on a directed graph. Two-step statements multiply along paths
// and add over the middle node; long-run statements solve flow in = flow out (π = πP, Σπ = 1).
// Arrow counts are not probabilities: the reported trap lists nodes by incoming arrows and the true
// order is the reverse. Stationary distributions are solved exactly here with fractions.
import { Q } from '../../../core/rational.js';
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const q = (n, d = 1) => Q.of(n, d);
const L = ['A', 'B', 'C', 'D'];
// Exact stationary distribution: Gauss-Jordan on (P^T − I) with the last equation replaced by Σπ = 1.
export function stationaryQ(P) {
  const n = P.length;
  const M = Array.from({ length: n }, (_, j) => (j < n - 1 ? [...P.map((row, i) => row[j].sub(i === j ? q(1) : q(0))), q(0)] : [...Array(n).fill(q(1)), q(1)]));
  for (let c = 0; c < n; c++) {
    const r = M.findIndex((row, k) => k >= c && !row[c].isZero());
    [M[c], M[r]] = [M[r], M[c]];
    const piv = M[c][c];
    M[c] = M[c].map((v) => v.div(piv));
    for (let k = 0; k < n; k++) if (k !== c && !M[k][c].isZero()) { const f = M[k][c]; M[k] = M[k].map((v, j) => v.sub(f.mul(M[c][j]))); }
  }
  return M.map((row) => row[n]);
}
const edgesOf = (P) => P.flatMap((row, i) => row.map((p, j) => (p.isZero() ? null : { from: L[i], to: L[j], p: p.toNumber(), label: p.toString() })).filter(Boolean));
const Z = () => q(0);
const mat = (n, list) => { const P = Array.from({ length: n }, () => Array.from({ length: n }, Z)); for (const [i, j, a, b] of list) P[i][j] = q(a, b); return P; };

// Picture chain (3 nodes).
const P3 = mat(3, [[0, 1, 1, 2], [0, 2, 1, 2], [1, 0, 1, 3], [1, 2, 2, 3], [2, 0, 1, 1]]);
const PI3 = stationaryQ(P3);
const two = (P, s) => P.map((_, j) => P.reduce((t, _r, k) => t.add(P[s][k].mul(P[k][j])), q(0)));
const TWO_A = two(P3, 0);
const KC = P3[0][2].add(P3[1][2].mul(P3[0][1])); // π_C / π_A in the picture chain
const WRONG = P3[0][1].mul(P3[1][0]).mul(P3[0][2]).mul(P3[2][0]);
const LAY3 = [[0.5, 0.05], [0.08, 0.95], [0.92, 0.95]], LAY4 = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]];
const nodes = (lay) => lay.map(([x, y], i) => ({ id: L[i], x, y }));

// Trap chain (4 nodes): A has the most incoming arrows, C the fewest, but the long run is C > B > A.
const PT = mat(4, [[0, 1, 3, 4], [0, 3, 1, 4], [1, 0, 1, 5], [1, 3, 4, 5], [2, 0, 1, 10], [2, 1, 1, 3], [2, 3, 17, 30], [3, 2, 5, 6], [3, 0, 1, 6]]);
const PIT = stationaryQ(PT);
if (!(PIT[0].cmp(PIT[1]) < 0 && PIT[1].cmp(PIT[2]) < 0)) throw new Error('trap chain must reverse the arrow order');
const indeg = (P) => P.map((_, j) => P.filter((row, i) => i !== j && !row[j].isZero()).length);
const INT = indeg(PT);

// Random irreducible 3-node chain for the checks (exact fractions from a small menu).
const SPL = { 1: [[[1, 1]]], 2: [[[1, 2], [1, 2]], [[1, 3], [2, 3]], [[1, 4], [3, 4]], [[2, 5], [3, 5]]], 3: [[[1, 3], [1, 3], [1, 3]], [[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 3], [1, 6]]] };
function chain3(rng) {
  for (;;) {
    const P = Array.from({ length: 3 }, () => Array.from({ length: 3 }, Z));
    for (let i = 0; i < 3; i++) { const t = rng.shuffle([0, 1, 2].filter((j) => j !== i || rng.chance(0.3))).slice(0, rng.int(1, 3)); const sp = rng.pick(SPL[t.length]); t.forEach((j, k) => { P[i][j] = q(...sp[k]); }); }
    const reach = (s) => { const seen = new Set([s]), st = [s]; while (st.length) { const u = st.pop(); for (let v = 0; v < 3; v++) if (!P[u][v].isZero() && !seen.has(v)) { seen.add(v); st.push(v); } } return seen.size === 3; };
    if ([0, 1, 2].every(reach)) return P;
  }
}
// Variation: redirect C → A to C → B; start at C and stop after 2 steps.
const PR = mat(3, [[0, 1, 1, 2], [0, 2, 1, 2], [1, 0, 1, 3], [1, 2, 2, 3], [2, 1, 1, 1]]), PIR = stationaryQ(PR), TWO_C = two(P3, 2);
if (!(PI3[0].cmp(PI3[2]) > 0 && PI3[2].cmp(PI3[1]) > 0 && PIR[1].cmp(PIR[2]) > 0 && PIR[2].cmp(PIR[0]) > 0 && TWO_A[1].isZero() && TWO_C[0].isZero())) throw new Error('markov-graph: prose orders no longer hold');

// Transfer: near = a three-state position chain with new names; far = two-state weather.
const POS = ['Long', 'Flat', 'Short'];
const nearT = (rng) => again(() => { const P = chain3(rng), pi = stationaryQ(P).map((x) => x.toNumber()), say = P.map((row, i) => row.map((p, j) => (p.isZero() ? null : `${POS[i]}→${POS[j]} ${p}`)).filter(Boolean).join(', ')).join('; ');
  return rank(rng, `Each day a trader's position moves between Long, Flat and Short with these probabilities: ${say}. On a random day far in the future, rank from most to least likely.`, POS.map((n, i) => [`The position is ${n}.`, pi[i]]), `Balance: ${pi.map((v, i) => `${POS[i]} ≈ ${dp(v, 3)}`).join(', ')}.`, { gap: 0.02 }); });
const farT = (rng) => { const p = rng.pick([[1, 4], [1, 5], [1, 3], [2, 5]]), r = rng.pick([[1, 2], [2, 3], [3, 5], [1, 3]]); const sr = p[0] / p[1], rs = r[0] / r[1];
  return { type: 'number', q: `A sunny day turns rainy the next day with probability ${p[0]}/${p[1]}; a rainy day turns sunny with ${r[0]}/${r[1]} (otherwise the weather stays). In the long run, what fraction of days are sunny? (3 decimals)`, answer: rs / (sr + rs), tolerance: 0.0015, hints: ['Flow sunny → rainy equals flow rainy → sunny.', `π_S × ${p[0]}/${p[1]} = π_R × ${r[0]}/${r[1]}, and π_S + π_R = 1.`], explain: `π_S = ${r[0]}/${r[1]} ÷ (${p[0]}/${p[1]} + ${r[0]}/${r[1]}) = ${dp(rs / (sr + rs), 3)}.` }; };

const sayP = (P) => P.map((row, i) => row.map((p, j) => (p.isZero() ? null : `${L[i]}→${L[j]} ${p}`)).filter(Boolean).join(', ')).join('; ');

export default {
  id: 'll/markov-graph',
  book: 'll',
  kind: 'family',
  family: 'markov-graph',
  title: 'Markov chains on a graph',
  summary: 'Two steps: multiply along paths, add over the middle node. Long run: flow in = flow out. Never count arrows.',
  prerequisites: ['prob/first-step-markov', 'prob/conditional-bayes'],
  objectives: [
    'Compute where a chain is after two steps by summing path products',
    'Write the balance equation (flow in = flow out) for any node',
    'Solve a two- or three-node chain for its long-run fractions by ratios',
    'Reject the arrow-count reading and say why probability flow decides the long run',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a signal moves every second along an outgoing arrow with the probability shown: ${sayP(PT)}. After a very long time it is observed at a random moment. Rank: at A (${INT[0]} incoming arrows), at B (${INT[1]}), at C (${INT[2]}).`, answer: [2, 1, 0].map((i) => `${L[i]} ${PIT[i]} ≈ ${dp(PIT[i].toNumber(), 3)}`).join(' > '), explain: `The order is the exact reverse of the arrow counts. D sends ${PT[3][2]} of its probability to C every step, and D is fed by everyone; A only receives thin arrows. If you ranked by arrows, you counted roads instead of traffic.`,
      attempts: [
        { id: 'start', label: 'Trace it from a start', approach: 'You followed a few steps from one node and ranked by where the signal went first.', breaksAt: 'After a long time the start is forgotten: the long run is the distribution that one more step leaves unchanged.' },
        { id: 'outgoing', label: 'Balance the arrows out', approach: 'You wrote each node\'s equation from the arrows leaving it.', breaksAt: 'Being at j next means arriving at j, so the balance for j uses the arrows entering j.' },
        { id: 'arrows', label: 'Count incoming arrows', approach: `You ranked A first because ${INT[0]} arrows point into it.`, breaksAt: 'An arrow is a road, not traffic: its flow is how often its source is visited times its label.' },
      ] },
    { type: 'text', text: 'The prompt is a **directed graph**: nodes joined by arrows, each arrow labelled with a probability, and the arrows leaving any node add to 1. Something (a signal, a customer, a price state) moves one arrow per step. Statements ask where it is after a fixed number of steps from a known start, or where it is at a random moment after running for a very long time.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Node B has arrows B→A labelled 1/4 and B→C labelled 1/2, and no other arrows except possibly a self-loop. What must the self-loop B→B be?', '1/4', [['0', 'forgot that the arrows leaving a node must add to 1'], ['1/2', 'copied another label instead of taking what is left'], ['3/4', 'added the two labels instead of subtracting them from 1']], '1 − 1/4 − 1/2 = 1/4.', { at: 1 }),
    ] },
    { type: 'text', text: 'Not this lesson: "until" questions with an absorbing end (first-step analysis in the foundations) and a single conditional probability. Here the process never stops.' },
    { type: 'check', scope: 'a process that never stops', questions: [
      { type: 'choice', q: '"Starting at A, what is P(it ever reaches the absorbing node D)?" Which lesson is it?', options: ['first-step analysis', 'Markov graphs (this lesson)', 'a single conditional'], answer: 0, traps: { 1: 'an absorbing end and "ever reaches" belong to first-step analysis', 2: 'there is a process over many steps' }, explain: 'An "until" question with an absorbing end is first-step analysis. Here the process never stops.' },
    ] },

    S('why'),
    { type: 'text', text: 'A reported Likelihood List item shows exactly this trap: statements listed by how many arrows point into each node, and the true long-run order is the reverse. Intuition counts roads; probability counts traffic. The balance equations settle it in about a minute, and two-step questions take seconds once you think in paths.' },

    S('anchor'),
    { type: 'text', text: 'You know a probability tree: multiply along a path, add the paths that end in the same outcome. A chain is a tree that **keeps going**, with one change: every level uses the same arrows. Two steps is a two-level tree; the long run is where the tree settles.' },
    { type: 'check', scope: 'multiply along, add across', questions: [
      { make: (rng) => { const a = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4]]), b = rng.pick([[1, 2], [1, 3], [3, 4]]); return { type: 'number', q: `A path takes an arrow of probability ${a[0]}/${a[1]} and then one of ${b[0]}/${b[1]}. Probability of the path? (3 decimals)`, answer: (a[0] / a[1]) * (b[0] / b[1]), tolerance: 0.0015, hints: ['Multiply along the path.'], explain: `${a[0]}/${a[1]} × ${b[0]}/${b[1]} = ${dp((a[0] / a[1]) * (b[0] / b[1]), 3)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'A three-node chain. Read each arrow as "from here, go there with this probability".' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, nodes: nodes(LAY3), edges: edgesOf(P3) }, caption: `From A: half to B, half to C. From B: 1/3 to A, 2/3 to C. From C: always to A. Every node's outgoing labels add to 1.` },
    { type: 'check', scope: 'reading the graph', questions: [
      mc(null, 'In this chain, starting at C, where is the signal after one step?', 'at A for certain', [['at A or B, half each', 'read arrows pointing into C as leaving it'], ['at C', 'C has no self-loop: it always moves'], ['anywhere, a third each', 'assumed every node is equally likely without reading the labels']], 'The only arrow out of C goes to A with probability 1.', { at: 0 }),
    ] },
    { type: 'text', text: 'Two steps from A, drawn as a tree. Every path multiplies two arrows; paths ending at the same node add.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'A', children: [{ p: '1/2', label: 'B', children: [{ p: '1/3', label: 'A', mark: true }, { p: '2/3', label: 'C' }] }, { p: '1/2', label: 'C', children: [{ p: '1', label: 'A', mark: true }] }] }, total: TWO_A[0].toString() }, caption: `After 2 steps from A: at A with ${TWO_A[0]} (paths A→B→A and A→C→A), at C with ${TWO_A[2]}, at B with ${TWO_A[1]} (no two-step path ends there).` },
    { type: 'check', scope: 'two-step paths', questions: [
      { make: (rng) => { const s = rng.int(0, 2), t = rng.int(0, 2); const v = two(P3, s)[t]; return { type: 'number', q: `In the three-node chain, start at ${L[s]}. P(at ${L[t]} after exactly 2 steps)? (3 decimals)`, answer: v.toNumber(), tolerance: 0.0015, hints: ['List where it can be after 1 step.', 'From each, follow one more arrow to the target; multiply, then add.'], explain: `Sum over the middle node: ${[0, 1, 2].map((k) => `${P3[s][k]} × ${P3[k][t]}`).filter((x) => !/^0 |× 0$/.test(x)).join(' + ') || '0'} = ${v}.` }; } },
    ] },
    { type: 'text', text: 'The trap chain from the challenge. Count arrows into A, B and C, then compare with the long-run fractions in the caption.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, nodes: nodes(LAY4), edges: edgesOf(PT) }, caption: `Incoming arrows: A ${INT[0]}, B ${INT[1]}, C ${INT[2]}. Long run: A ${PIT[0]} (${dp(PIT[0].toNumber(), 3)}), B ${PIT[1]} (${dp(PIT[1].toNumber(), 3)}), C ${PIT[2]} (${dp(PIT[2].toNumber(), 3)}), D ${PIT[3]}. The heavy flow is D → C.` },
    { type: 'check', scope: 'arrows against flow', questions: [
      mc(null, 'In the trap chain, why does C beat A in the long run despite fewer incoming arrows?', `D is visited often and sends ${PT[3][2]} of it straight to C`, [['C has a self-loop that keeps the signal there for many steps', 'C has no self-loop: read the arrows leaving C'], ['The arrows into A point the wrong way for the signal to arrive', 'every arrow is one-way; direction is not the difference'], ['A has more outgoing arrows, so the signal leaves A faster', 'outgoing arrows always carry exactly 1 in total, however many there are']], 'What matters is how much probability flows along an arrow, weighted by how often its source is visited.', { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Two-step statements need only the tree. Long-run statements need the idea that the distribution stops changing; four moves turn that idea into numbers.' },
    { type: 'steps', steps: [
      { answers: 'start', say: 'Long run means the chance of being at each node no longer changes from one step to the next. Call those chances π_A, π_B, π_C.', why: 'Run the chain long enough and the start is forgotten; one more step must leave the distribution as it is.',
        checks: [mc(null, 'After a very long time, what do the long-run chances π_A + π_B + π_C add to?', '1', [['the number of nodes', 'they are probabilities of being somewhere'], ['it depends on the start', 'the long run forgets the start'], ['the number of arrows', 'arrows carry probability, they are not probabilities of location']], 'The signal is always at exactly one node.', { at: 0 })] },
      { answers: 'outgoing', say: 'Balance: the chance of being at node j after one more step is the flow into j, so π_j = Σ_i π_i × P(i → j).', why: 'To be at j next, you were at some i and took the arrow i → j. Unchanged means that total equals π_j.',
        checks: [mc(null, 'In the three-node chain, which is the balance equation for B?', 'π_B = ½ π_A', [['π_B = ⅓ π_A + ⅔ π_C', 'used the arrows leaving B instead of those entering it'], ['π_B = ½', 'read one arrow label as the long-run chance'], ['π_B = π_A + π_C', 'added whole chances without the arrow probabilities']], 'The only arrow into B is A → B with ½.', { at: 0 })] },
      { say: 'Two nodes shortcut: flow across the split balances, π_A × P(A → B) = π_B × P(B → A), so π_A / π_B = P(B → A) / P(A → B).', why: 'In the long run, as much probability crosses from A to B each step as crosses back.',
        checks: [{ make: (rng) => { const p = rng.pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4]]), r = rng.pick([[1, 2], [1, 3], [1, 5], [2, 5], [1, 6]]); const pv = p[0] / p[1], rv = r[0] / r[1]; return { type: 'number', q: `Two nodes: A → B with ${p[0]}/${p[1]} (else stay), B → A with ${r[0]}/${r[1]} (else stay). Long-run π_A? (3 decimals)`, answer: rv / (pv + rv), tolerance: 0.0015, hints: ['π_A × P(A→B) = π_B × P(B→A).', 'π_A / π_B = P(B→A) / P(A→B); then normalise.'], explain: `π_A = ${r[0]}/${r[1]} ÷ (${p[0]}/${p[1]} + ${r[0]}/${r[1]}) = ${dp(rv / (pv + rv), 3)}.` }; } }] },
      { say: `Three nodes: express every π through one node, then normalise. In the picture chain, π_B = ${P3[0][1]} π_A and π_C = ${P3[0][2]} π_A + ${P3[1][2]} π_B = ${KC} π_A, so π_A = 1 / (1 + ${P3[0][1]} + ${KC}) = ${PI3[0]}.`, why: 'Each balance equation gives one node in terms of others; the sum-to-1 condition fixes the scale.',
        checks: [{ type: 'number', q: 'In the three-node chain, what is π_C? (3 decimals)', answer: PI3[2].toNumber(), tolerance: 0.0015, hints: [`π_C = ${KC} π_A and π_A = ${PI3[0]}.`], explain: `${KC} × ${PI3[0]} = ${PI3[2]} ≈ ${dp(PI3[2].toNumber(), 3)}.` }] },
      { answers: 'arrows', say: 'Rank by the π values, never by arrow counts. A single high-probability arrow out of a busy node can outweigh several thin arrows.', why: 'The flow along i → j is π_i × P(i → j): both how often you are at i and how likely the arrow is.',
        checks: [{ hinge: true, make: (rng) => again(() => { const P = chain3(rng); const pi = stationaryQ(P).map((x) => x.toNumber()); const deg = indeg(P); const top = pi.indexOf(Math.max(...pi)); if (pi.filter((v) => Math.abs(v - pi[top]) < 0.02).length > 1) return null; const most = deg.indexOf(Math.max(...deg)); const wrongs = [0, 1, 2].filter((i) => i !== top).map((i) => [L[i], i === most ? 'counted incoming arrows instead of solving the balance equations' : 'picked a node without weighing each arrow by how often its source is visited']); return mc(rng, `Chain: ${sayP(P)}. Which node is visited most in the long run?`, L[top], wrongs, `Long run: ${pi.map((v, i) => `π_${L[i]} ≈ ${dp(v, 3)}`).join(', ')}.`, { hints: ['Write flow in = flow out for each node.', 'Express two nodes through the third, then normalise.'] }); }) }] },
    ] },
    { type: 'explain', prompt: 'Explain why the node with the most incoming arrows need not be the one visited most often.', model: 'An arrow is a road, not traffic. The long-run flow along an arrow is how often its source is visited times the arrow\'s probability. Three arrows of probability 1/8 from rarely visited nodes carry less than one arrow of probability 4/5 from a busy node, so the busy node\'s target gets more visits.', points: ['Flow along i → j = π_i × P(i → j)', 'Arrow counts ignore both factors', 'Balance equations weigh every arrow correctly'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'markov-graph', difficulty: 3, seed: 'a', explainAt: [0, 1], intro: 'Where is the signal after exactly two steps? List the paths. Try it first.' },
    { type: 'worked', section: 'll', family: 'markov-graph', difficulty: 5, seed: 'b', fade: 1, intro: 'The trap version: statements listed by incoming arrows. The balance solution is given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'A goes to B with probability 1; B goes to A with 1/2 and stays with 1/2. Which node is visited more in the long run?', answer: 'B: π_B = 2/3, π_A = 1/3. Balance: π_A × 1 = π_B × 1/2.', explain: 'B keeps half its probability each step; A gives all of its away.' },

    S('traps'),
    { type: 'text', text: 'Two misreadings cause nearly every miss: counting arrows instead of probability, and reading an arrow backwards in a balance equation. Before writing anything, put a finger on the arrowheads that point into the node.' },
    { type: 'traps', section: 'll', family: 'markov-graph', extra: [
      { belief: 'The node with the most incoming arrows is visited most.', fix: 'Weigh each arrow by its probability and by how often its source is visited: π = πP.' },
      { belief: 'The balance equation for j uses the arrows leaving j.', fix: 'It uses the arrows entering j: π_j = Σ_i π_i P(i → j).' },
      { belief: 'After two steps, the answer is the product of two arrow labels.', fix: 'Add the products of every path that ends at the target.' },
      { belief: 'The long-run answer depends on where the signal started.', fix: 'For a chain where every node reaches every other, the long run forgets the start.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(at A after exactly 2 steps, starting at A) in the three-node chain. One step is wrong.', steps: [
      `After one step from A: at B with ${P3[0][1]} or at C with ${P3[0][2]}.`,
      `From B the arrow back to A is ${P3[1][0]}; from C it is ${P3[2][0]}.`,
      `P(at A after 2 steps) = ${P3[0][1]} × ${P3[1][0]} × ${P3[0][2]} × ${P3[2][0]} = ${WRONG}.`,
      'So a return to A within two steps is unlikely.',
    ], errorStep: 2, explain: `A→B→A and A→C→A are alternative paths, so their products add: ${P3[0][1]} × ${P3[1][0]} + ${P3[0][2]} × ${P3[2][0]} = ${TWO_A[0]}. Multiply along a path, add across paths.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'A candidate writes the balance equation for C in the three-node chain as π_C = 1 × π_C. Which belief?', 'Used the arrow leaving C instead of the arrows entering it', [['Counted the arrows into C instead of weighing them', 'no counting happened: a single label was used'], ['Forgot to normalise the chances so they add to 1', 'normalising comes after the balance equations are right'], ['Followed a two-step path back to C instead of one step', 'this is a one-step balance']], 'Into C: ½ from A and ⅔ from B: π_C = ½ π_A + ⅔ π_B.', { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Cut shortcut: split the nodes into two groups; in the long run the flow across the split is equal both ways. For two nodes this gives the ratio in one line; for three, use the cut around a node with one incoming arrow first.' },
    { type: 'check', scope: 'the cut shortcut', questions: [
      { make: (rng) => { const p = rng.pick([[1, 2], [1, 3], [1, 4], [3, 4]]), r = rng.pick([[1, 2], [2, 3], [1, 5], [3, 5]]); const pv = p[0] / p[1], rv = r[0] / r[1]; const ans = rv > pv ? 'A' : rv < pv ? 'B' : 'equal'; return mc(rng, `Two nodes: A leaves to B with ${p[0]}/${p[1]}, B leaves to A with ${r[0]}/${r[1]} (otherwise each stays). Which is visited more?`, ans === 'equal' ? 'They are equal' : ans, [['A', 'reversed the cut ratio: the node that is harder to leave is visited more'], ['B', 'reversed the cut ratio: the node that is harder to leave is visited more'], ['They are equal', 'two nodes are equal only when the leaving probabilities match']].filter(([v]) => v !== (ans === 'equal' ? 'They are equal' : ans)), `π_A/π_B = P(B→A)/P(A→B) = ${dp(rv / pv, 3)}.`); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Self-loops do not move probability, so leave them out of every cut equation. Budget: ${LL.exam.perItemSeconds} seconds; a three-node balance is two substitutions and one normalisation.` },
    { type: 'check', scope: 'self-loops stay out', questions: [
      { type: 'choice', q: 'A → A 1/2, A → B 1/2, B → A 1. Which arrow do you leave out of the cut between A and B?', options: ['the self-loop A → A', 'the arrow A → B', 'the arrow B → A'], answer: 0, traps: { 1: 'flow from A to B crosses the cut', 2: 'flow back from B crosses the cut' }, explain: 'π_A × 1/2 = π_B × 1, so π_A = 2/3 and π_B = 1/3.' },
    ] },

    { type: 'thinkaloud', problem: 'The three-node picture chain (A → B ½, A → C ½, B → A ⅓, B → C ⅔, C → A 1). Observed at a random moment after a long time, rank: at A, at B, at C.', lines: [
      { t: 0, say: 'Long run at a random moment: balance equations, not arrow counts.' },
      { t: 5, say: `Into B: only A → B with ${P3[0][1]}. So π_B = ${P3[0][1]} π_A.` },
      { t: 12, say: 'Into A: C sends everything there, so π_A = π_C.', slip: true },
      { t: 18, say: `Wait, B → A with ${P3[1][0]} enters A too. Easier to balance C: π_C = ${P3[0][2]} π_A + ${P3[1][2]} π_B = ${KC} π_A.` },
      { t: 28, say: `Normalise: π_A (1 + ${P3[0][1]} + ${KC}) = 1, so π_A = ${PI3[0]}, π_C = ${PI3[2]}, π_B = ${PI3[1]}.` },
      { t: 34, say: `They add to 1. Order A > C > B, with ${LL.exam.perItemSeconds - 34} seconds left.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine on a fresh chain', questions: [
      { make: (rng) => again(() => { const P = chain3(rng), pi = stationaryQ(P).map((x) => x.toNumber()); return rank(rng, `Chain: ${sayP(P)}. Observed at a random moment after a long time, rank from most to least likely.`, L.slice(0, 3).map((n, i) => [`The signal is at ${n}.`, pi[i]]), `Balance: ${pi.map((v, i) => `π_${L[i]} ≈ ${dp(v, 3)}`).join(', ')}.`, { gap: 0.02, hints: ['Write flow in = flow out for the node with the fewest incoming arrows.', 'Express the others through one node, then normalise.'] }); }) },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Graph chain → two steps: Σ over middle nodes of products. Long run: π_j = Σ_i π_i P(i → j), Σπ = 1 (two nodes: π_A/π_B = P(B→A)/P(A→B)). Count flow, never arrows.' },

    S('contrast'),
    { type: 'compare', columns: ['Question', 'Depends on the start?', 'Method'], rows: [
      ['after 1 step', 'yes', 'read the arrows out of the start'],
      ['after exactly 2 steps', 'yes', 'sum of path products over the middle node'],
      ['long run, random moment', 'no', 'balance equations π = πP, Σπ = 1'],
      ['until an absorbing node', 'yes', 'first-step analysis (foundations)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a node with a self-loop close to 1 soaks up most of the long-run time even with one thin incoming arrow. A chain that alternates between two nodes with probability 1 has long-run fractions ½ each, but after an even number of steps from A it is always at A.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'A goes to B with probability 1 and B goes to A with probability 1. Starting at A, where is the signal after exactly 4 steps?', 'at A', [['at B', 'counted an odd number of moves'], ['at A or B, half each', 'used the long-run fractions for a fixed step count'], ['it cannot be known', 'the moves are certain, so the position is too']], 'Each pair of steps returns to A.', { at: 0 }),
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: first-step analysis in Beat the Odds (the same equations with a boundary) and race-to-k series. Order-flow models on a trading desk use it too: what matters is the traffic along a route, not how many routes exist.' },
    { type: 'variation', base: `The three-node picture chain, long run: A ${PI3[0]}, C ${PI3[2]}, B ${PI3[1]}. Order A > C > B.`, rows: [
      { same: true, change: 'Start the signal at C instead of A', effect: 'No change. The long run forgets the start: the balance equations never mention it.' },
      { change: 'Ask where it is after exactly 2 steps from A', effect: `Now the start matters: A ${TWO_A[0]}, C ${TWO_A[2]}, B ${TWO_A[1]} (no two-step path from A ends at B). Same order, different method and numbers.` },
      { change: 'Redirect the arrow C → A to C → B (still probability 1)', effect: `One arrow changes where C's traffic goes: B ${PIR[1]}, C ${PIR[2]}, A ${PIR[0]}. The order reverses to B > C > A.` },
      { fusion: true, change: 'Start at C, and ask where it is after exactly 2 steps', effect: `Alone, the new start changes nothing in the long run. With a fixed step count it matters: C → A is forced, then A splits, so B ${TWO_C[1]}, C ${TWO_C[2]}, A ${TWO_C[0]}.` },
    ] },
    { type: 'transfer',
      near: { make: nearT },
      far: { make: farT },
      principle: mc(null, 'Which idea carried over from the signal graph to the weather?', 'In the long run the flow each way across a split is equal', [
        ['Each state is equally likely in the long run, whatever the arrows', 'the shares follow the flows, not the number of states'],
        ['The long-run share depends on the state you start in', 'the long run forgets the start'],
        ['The state with more ways to arrive is the most common one', 'count traffic, not roads: weigh each arrow by its source'],
      ], 'Sunny-to-rainy flow equals rainy-to-sunny flow, exactly as π_A P(A → B) = π_B P(B → A) for two nodes.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'markov-graph', count: 3 },
  ],
};
