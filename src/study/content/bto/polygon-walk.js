// Symmetric random walks on polygons: return time n, hitting time k(n − k) by unrolling the cycle
// into gambler's ruin, last vertex 1/(n − 1), two walkers via the lazy gap. Every number is computed here.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const NAMES = { 4: 'square', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 10: 'decagon', 12: 'dodecagon' };
const hit = (n, k) => k * (n - k); // expected time from distance k to the target on an n-cycle
const meet = (n, D) => 2 * (D / 2) * (n / 2 - D / 2); // two walkers D apart (D even, n even)
const node = (id, label, x, y) => ({ id, label, x, y });
const CH = { n: 8, k: 3 };
const HEX = 6;

export default {
  id: 'bto/polygon-walk',
  book: 'bto',
  kind: 'family',
  family: 'polygon-walk',
  title: 'Random walks on polygons',
  summary: 'On an n-cycle: return time n; hitting time from distance k is k(n − k); every other vertex is last with 1/(n − 1); two walkers: follow the lazy gap.',
  prerequisites: ['bto/gamblers-ruin', 'prob/first-step-markov'],
  objectives: [
    'Give the expected return time n from the long-run share 1/n of time at each vertex',
    'Unroll the cycle at the target and use the gambler\'s-ruin duration: k(n − k)',
    'State that every vertex other than the start is equally likely to be visited last: 1/(n − 1)',
    'Reduce two walkers to their gap, a lazy walk that takes twice as long',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a token sits on vertex 0 of a regular octagon (vertices 0 to 7). Each second it moves to a neighbouring vertex, each with probability 1/2. What is the expected number of seconds until it first reaches vertex ${CH.k}? Try two approaches.`, answer: `${CH.k} × ${CH.n - CH.k} = ${hit(CH.n, CH.k)}`, explain: `If you answered ${CH.k}, you let the token walk straight there; if ${CH.k * CH.k}, you used a line with no far side. On a cycle the target can be reached from both sides: cut it open there and it is a gambler's-ruin line with walls ${CH.k} and ${CH.n - CH.k} steps away.` },
    { type: 'text', text: 'A token (bug, particle, two players) sits on the corners of a polygon and each second steps to one of the **two neighbours** at random. The question asks how long until it **returns**, until it **reaches** a given corner, which corner is visited **last**, or when **two tokens meet**.' },
    { type: 'list', items: ['"A bug on a hexagon: expected time to return to its start?"', '"Expected time to reach the opposite corner of a hexagon?"', '"Two tokens on opposite corners of an octagon both move each second: expected time until they meet?"'] },
    { type: 'text', text: 'Not this lesson: a walk on an infinite line (bto/random-walk-line) and a line with two walls (bto/gamblers-ruin), which this lesson reuses.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['A token on a pentagon: P(vertex 2 is the last one visited)', 'A particle on 0 to 5: P(it hits 5 before 0)', 'A ±1 walk: P(back at 0 after 6 steps)', 'A die running total: P(it ever equals 6)'], answer: 0, traps: { 1: 'two walls on a line: bto/gamblers-ruin', 2: 'an end point on a line: bto/random-walk-line', 3: 'an increasing total: bto/running-sum' }, explain: 'A walk around the corners of a polygon.' },
    ] },

    S('why'),
    { type: 'text', text: 'Polygon walks are a reported Beat the Odds staple. They look like they need a system of equations, one per corner, but three facts answer almost every variant in seconds: return time n, hitting time k(n − k), and the last-vertex answer 1/(n − 1). Two-walker questions add one more idea: follow the distance between them.' },

    S('anchor'),
    { type: 'text', text: 'From bto/gamblers-ruin: a fair ±1 walk between walls at distances a and b lasts a × b steps on average. A polygon is that line with **one change**: its two ends are glued together at the target, so the walls are the same vertex approached from two sides.' },
    { type: 'check', scope: 'fair duration a × b', questions: [
      { make: (rng) => { const a = rng.int(1, 5), b = rng.int(1, 6); return { type: 'number', q: `A fair ±1 walk has a wall ${a} steps to its left and ${b} steps to its right. Expected steps until it hits a wall?`, answer: a * b, explain: `${a} × ${b} = ${a * b}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'A hexagon with the token at vertex 0 and the target at the opposite vertex 3. The token can reach 3 going either way round.' },
    { type: 'diagram', diagram: 'cycle', spec: { n: HEX, start: 0, target: 3, note: 'start 0, target 3' }, caption: `Distance 3 clockwise, 3 anticlockwise. Hitting either way ends the walk.` },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: HEX, barriers: [0, HEX], start: 3, marks: [{ x: 0, label: 'vertex 3' }, { x: HEX, label: 'vertex 3' }] }, caption: `Cut the hexagon open at vertex 3 and lay it flat: the token starts in the middle of a line whose two ends are both vertex 3. Gambler's ruin gives 3 × 3 = ${hit(HEX, 3)} seconds.` },
    { type: 'check', scope: 'unrolling at the target', questions: [
      { make: (rng) => { const n = rng.pick([5, 6, 7, 8, 10, 12]), k = rng.int(1, Math.floor(n / 2)); return mc(rng, `Regular ${NAMES[n]}, token at vertex 0. Expected seconds to first reach vertex ${k}?`, String(hit(n, k)), [[String(k), 'assumed it walks straight there'], [String(k * k), 'used the line formula k² with no far side'], [String(n), 'used the return time'], [String(hit(n, k) / 2), 'halved k(n − k), as if it always takes the short side']], `Unroll at vertex ${k}: walls ${k} and ${n - k} away, so ${k} × ${n - k} = ${hit(n, k)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'Two tokens that both move each second: follow only the **gap** between them. On an octagon the gap takes even values; label the states by the gap clockwise.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Gap between two walkers on an octagon', nodes: [node('0', 'met', 0.5, 0.05), node('2', 'gap 2', 0.95, 0.5), node('4', 'gap 4', 0.5, 0.95), node('6', 'gap 6', 0.05, 0.5)], edges: [
      { from: '0', to: '0', p: 1, label: 'done' },
      { from: '2', to: '0', p: 0.25, label: '1/4' }, { from: '2', to: '4', p: 0.25, label: '1/4' }, { from: '2', to: '2', p: 0.5, label: '1/2' },
      { from: '4', to: '2', p: 0.25, label: '1/4' }, { from: '4', to: '6', p: 0.25, label: '1/4' }, { from: '4', to: '4', p: 0.5, label: '1/2' },
      { from: '6', to: '4', p: 0.25, label: '1/4' }, { from: '6', to: '0', p: 0.25, label: '1/4' }, { from: '6', to: '6', p: 0.5, label: '1/2' },
    ] }, caption: `Half the time both tokens step the same way and the gap stays put (the loops). Otherwise the gap moves by 2. In units of 2 vertices it is a walk on a 4-cycle that pauses half the time. From gap 4 (2 units): 2 × 2 = 4 moves, doubled for the pauses: ${meet(8, 4)} seconds.` },
    { type: 'check', scope: 'the gap walk', questions: [
      { type: 'choice', q: 'Two tokens on a polygon both step each second. In one second, what happens to the gap?', options: ['−2, 0 or +2 with 1/4, 1/2, 1/4', '−1 or +1 with 1/2 each', '−2 or +2 with 1/2 each', '0 always'], answer: 0, traps: { 1: 'each token moves 1, so the gap moves by 2 or 0', 2: 'forgot the seconds when both move the same way', 3: 'they move independently, so the gap changes half the time' }, explain: 'Towards each other (1/4), apart (1/4), same direction (1/2).' },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Hexagon, start at 0: P(vertex k is visited last)', xLabel: 'vertex k', yLabel: 'probability', categories: ['1', '2', '3', '4', '5'], series: [{ name: 'P(last)', values: [1, 2, 3, 4, 5].map(() => Number((1 / (HEX - 1)).toFixed(3))) }], valueLabels: true }, caption: `All five bars are equal, 1/${HEX - 1}. The neighbours of the start are as likely to be last as the far vertex: the token often wanders all the way round the other way first.` },
    { type: 'check', scope: 'the last vertex', questions: [
      { make: (rng) => { const n = rng.pick([5, 6, 7, 8, 10]), k = rng.int(1, Math.floor(n / 2)); return mc(rng, `Regular ${NAMES[n]}, start at vertex 0. P(vertex ${k} is the last vertex visited)?`, Q.of(1, n - 1).toString(), [[Q.of(1, n).toString(), 'counted the start among the candidates'], [Q.of(k, n).toString(), 'made far vertices more likely'], ['0', 'thought a nearby vertex cannot be last'], [Q.of(2, n - 1).toString(), 'doubled for the two sides of approach']], `Every vertex other than the start: 1/(${n} − 1) = ${Q.of(1, n - 1)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Return time: the walk is symmetric, so in the long run it spends 1/n of its time at each vertex. Visits to the start are then n steps apart on average: expected return time n.', why: 'If a vertex is occupied a fraction π of the time, the gaps between visits average 1/π (Kac\'s rule).',
        checks: [
          { make: (rng) => { const n = rng.pick([4, 5, 6, 8, 10, 12]); return mc(rng, `Regular ${NAMES[n]}. Expected seconds until the token first returns to its start?`, String(n), [[String(n / 2), 'assumed it goes halfway and back'], [String(n * n), 'squared n'], ['2', 'only counted "out and straight back"'], [String(hit(n, Math.floor(n / 2))), 'used the time to the opposite vertex']], `1/(1/${n}) = ${n}. Check: 1 step out, then 1 × (${n} − 1) back: ${n}.`); } },
        ] },
      { say: 'Hitting time: cut the cycle at the target. The token sits on a line with the target at both ends, k steps one way and n − k the other. Fair duration: k(n − k).', why: 'Reaching the target from either side ends the walk, exactly like hitting either wall in gambler\'s ruin.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 8, 10, 12]); return { type: 'number', q: `Regular ${NAMES[n]}. Expected seconds from a vertex to the opposite vertex?`, answer: hit(n, n / 2), explain: `(${n}/2)² = ${hit(n, n / 2)}.` }; } },
        ] },
      { say: 'Last vertex: vertex k is last when the token reaches one of its neighbours first and then goes all the way round to the other neighbour. Two gambler\'s-ruin legs; the k cancels and every non-start vertex gets 1/(n − 1).', why: 'Leg one splits between the neighbours in proportions (n − k − 1) : (k − 1); leg two, going the long way round, is 1/(n − 1) either way.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 8, 10]); return { type: 'number', q: `Regular ${NAMES[n]}. Add P(last) over all vertices other than the start.`, answer: 1, explain: `${n - 1} vertices × 1/${n - 1} = 1: exactly one of them is last.` }; } },
        ] },
      { say: 'Two walkers D apart (D even, n even): the gap moves −2, 0, +2 with 1/4, 1/2, 1/4. In units of 2 it is a walk on an (n/2)-cycle, starting D/2 away.', why: 'Odd gaps never occur, and meeting means gap 0, so the target is 0 on the smaller cycle.',
        checks: [
          { make: (rng) => { const n = rng.pick([8, 10, 12]), D = rng.pick([2, 4]); return mc(rng, `Two tokens ${D} apart on a regular ${NAMES[n]}. In units of 2 vertices, the gap walks on:`, `a ${n / 2}-cycle, starting ${D / 2} away`, [[`a ${n}-cycle, starting ${D} away`, 'did not halve: the gap only takes even values'], [`a ${n / 2}-cycle, starting ${D} away`, 'halved the cycle but not the gap'], [`a line from 0 to ${n}`, 'the gap wraps around the polygon']], `Halve both: ${n / 2}-cycle, distance ${D / 2}.`); } },
        ] },
      { say: 'A walk that moves only half the time takes twice as long: E = 2 × (D/2) × (n/2 − D/2).', why: 'Each second is a real move with chance 1/2, so on average two seconds pass per move of the gap.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 8, 10, 12]), D = rng.pick([2, 4].filter((d) => d <= n / 2)); return mc(rng, `Two tokens ${D} apart on a regular ${NAMES[n]}, both moving each second. Expected seconds until they meet?`, String(meet(n, D)), [[String(meet(n, D) / 2), 'forgot the seconds when the gap stands still'], [String(hit(n, D)), 'held one token fixed'], [String(hit(n, D) / 2), 'halved the one-walker time'], [String(D), 'assumed they walk straight towards each other']], `2 × ${D / 2} × (${n / 2} − ${D / 2}) = ${meet(n, D)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is the expected time from a hexagon vertex to the opposite vertex 9, while the return time is only 6?', model: 'To reach the opposite vertex, cut the hexagon open there: the token is 3 steps from the target on both sides of a line, and a fair walk between walls 3 and 3 away lasts 3 × 3 = 9. Returning is quicker because the token spends one sixth of its time at each vertex, so visits to any vertex, including the start, come every 6 steps on average.', points: ['unrolling turns the cycle into gambler\'s ruin with walls k and n − k away', 'the fair duration is the product k(n − k)', 'return time is 1/(long-run share) = n'] },

    S('worked'),
    { type: 'worked', family: 'polygon-walk', section: 'bto', difficulty: 4, seed: 'a', intro: 'A hitting time on a heptagon. Try it before opening the solution.' },
    { type: 'worked', family: 'polygon-walk', section: 'bto', difficulty: 5, seed: 'c', fade: 1, intro: 'Two walkers. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'On a regular octagon, which takes longer on average: reaching a neighbouring vertex, or returning to the start?', answer: `Returning, but only just: the return takes 8 and reaching the neighbour takes 1 × 7 = ${hit(8, 1)}. A token one step from its target can still wander off the long way round.`, explain: 'The nearest target is the slowest per unit of distance: 7 seconds for 1 step.' },

    S('traps'),
    { type: 'traps', family: 'polygon-walk', section: 'bto', extra: [
      { belief: 'The token walks roughly straight to its target.', fix: 'It wanders: the time grows like k(n − k), not k.' },
      { belief: 'Far vertices are more likely to be visited last.', fix: 'Every vertex other than the start is last with 1/(n − 1).' },
      { belief: 'Two walkers close the gap twice as fast as one.', fix: 'The gap often stands still: it is a lazy walk, twice as slow as its moves suggest.' },
    ] },
    { type: 'erroneous', problem: 'Two tokens start on opposite corners of a regular octagon; both move each second. A candidate finds the expected time until they meet. One step is wrong.', steps: [
      'Track the gap: it changes by −2, 0 or +2.',
      'In units of 2 the gap walks on a 4-cycle, starting 2 away.',
      `A walk on a 4-cycle from distance 2 takes 2 × 2 = ${hit(4, 2)} steps, so they meet after ${hit(4, 2)} seconds.`,
      `Answer ${hit(4, 2)}.`,
    ], errorStep: 2, explain: `The gap moves only half the time (probability 1/2 it stays put), so each move takes 2 seconds on average: ${meet(8, 4)} seconds.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `Hexagon, token at 0. A candidate answers 3 for the time to reach vertex 3. Which belief?`, options: ['The token walks straight there', 'Used the return time', 'Halved k(n − k)'], answer: 0, explain: `3 steps if it never turned back; with wandering, 3 × 3 = ${hit(6, 3)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Three numbers per polygon. Square: return 4, opposite ${hit(4, 2)}. Hexagon: return 6, neighbour ${hit(6, 1)}, opposite ${hit(6, 3)}. Octagon: return 8, opposite ${hit(8, 4)}, two walkers from opposite corners ${meet(8, 4)}.` },
    { type: 'callout', tone: 'speed', text: `Sanity check: a hitting time is never below the distance and never above (n/2)²; the return time is exactly n. Each of these items should take 20 of your ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'check', scope: 'landmark values', questions: [
      { make: (rng) => { const [txt, v] = rng.pick([['hexagon: return to start', 6], ['hexagon: opposite vertex', hit(6, 3)], ['octagon: opposite vertex', hit(8, 4)], ['square: opposite vertex', hit(4, 2)], ['octagon: two walkers from opposite corners', meet(8, 4)]]); return { type: 'number', q: `Expected seconds, ${txt}?`, answer: v, explain: `Landmark: ${v}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'n-cycle walk → return n; reach distance k: k(n − k); last vertex 1/(n − 1); two walkers D apart: 2(D/2)(n/2 − D/2).' },

    S('contrast'),
    { type: 'compare', columns: ['Question (octagon)', 'Idea', 'Answer'], rows: [
      ['return to the start', 'long-run share 1/8', '8'],
      ['reach the neighbour', 'unroll: walls 1 and 7', String(hit(8, 1))],
      ['reach the opposite vertex', 'unroll: walls 4 and 4', String(hit(8, 4))],
      ['which vertex is last', 'symmetry of the two legs', '1/7 each'],
      ['two walkers from opposite corners', 'lazy gap on a 4-cycle', String(meet(8, 4))],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a triangle (n = 3) has every vertex adjacent: hitting time 1 × 2 = 2. The neighbour of the start (k = 1) takes n − 1, almost as long as the return. Two walkers an odd distance apart on an even polygon never meet: the gap stays odd.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the return time n is the long-run frequency trick that also gives the running-total limit 1/(mean step) (bto/running-sum). Tracking a difference instead of two objects works for any pair of symmetric walks, and the unrolled line is plain gambler\'s ruin (bto/gamblers-ruin).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Two tokens 3 vertices apart on a hexagon, both moving each second. Expected time until they meet?', options: ['They never meet', `${hit(6, 3)}`, `${2 * hit(6, 3)}`, '3'], answer: 0, traps: { 1: 'the one-walker time: here the gap stays odd', 2: 'doubled for laziness, but the gap can never reach 0', 3: 'assumed they walk straight at each other' }, explain: 'Each second the gap changes by −2, 0 or +2, so an odd gap stays odd and never becomes 0.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'polygon-walk', section: 'bto', count: 3 },
  ],
};
