// Coupon collector: stages by how many types you hold; stage i is a geometric wait n/(n − i).
// All n types: n·H_n. Every number shown is computed here, never typed by hand.
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

const H = (n) => { let s = Q.of(0); for (let i = 1; i <= n; i++) s = s.add(Q.of(1, i)); return s; };
const stage = (n, i) => Q.of(n, n - i); // mean wait while holding i of n types
const partial = (n, k) => { let s = Q.of(0); for (let i = 0; i < k; i++) s = s.add(stage(n, i)); return s; };
const all = (n) => Q.of(n).mul(H(n));
const terms = (n, k) => Array.from({ length: k }, (_, i) => `${n}/${n - i}`).join(' + ');
const f2 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(2);
const GAMMA = 0.5772;
const approx = (n) => n * (Math.log(n) + GAMMA);
const TK = 8; // think-aloud: 8 toys
const NS = Array.from({ length: 30 }, (_, i) => i + 1);
const node = (id, label, x, y) => ({ id, label, x, y });

export default {
  id: 'bto/coupon-collector',
  book: 'bto',
  kind: 'family',
  family: 'coupon-collector',
  title: 'Coupon collector',
  summary: 'Holding i of n types, the next new one takes n/(n − i) tries on average. All n: n·H_n ≈ n(ln n + 0.577).',
  prerequisites: ['bto/expected-waiting', 'bto/linearity'],
  objectives: [
    'Split a collecting wait into stages by how many types you already hold',
    'Compute n·H_n exactly for small n, and estimate n(ln n + 0.577) for large n',
    'Handle partial collections: k different faces out of s',
    'Explain why the last type alone costs n tries on average',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you draw cards with replacement from a shuffled deck until you have seen all four suits. What is the expected number of draws? Try two approaches.', answer: `${terms(4, 4)} = ${all(4)} ≈ ${f2(all(4))}`, explain: 'If you answered 4, you assumed every draw brings a new suit; if 16, you added four waits of 4. The first draw is always new and the last suit takes 4 draws on its own. The lesson adds the stages.', attempts: [
      { id: 'one-each', label: 'Four draws, one per suit', approach: 'Assumed each draw brings a suit not yet seen: 4 draws.', breaksAt: 'After the first draw, some draws repeat a suit you already hold. The chance of a new suit falls as the collection grows.' },
      { id: 'four-waits', label: 'Four waits of 4', approach: 'Waited 4 draws for each suit: 4 × 4 = 16.', breaksAt: 'Early on any missing suit counts as new, so the early stages are far shorter than 4. Only the last stage lasts 4.' },
      { id: 'distribution', label: 'Full distribution of the wait', approach: 'Tried to find the chance that all four suits are seen by draw k, for every k, and average.', breaksAt: 'Possible with inclusion-exclusion, but slow. The total time is a sum of stage times, and expectations of sums add.' },
    ] },
    { type: 'text', text: 'Each try brings one of n equally likely **types** (toys, faces, suits, traders), with repeats possible, and you keep going until you have **all** of them, or k different ones. The question asks for the expected number of tries.' },
    { type: 'list', items: ['"Throw a die until every face has appeared. Expected throws?"', '"Each cereal box holds one of 8 toys. Expected boxes to get all 8?"', '"Throw a 10-sided die until 4 different faces have appeared. Expected throws?"'] },
    { type: 'text', text: 'Not this lesson: waiting for one **specific** type (a geometric wait, 1/p) or a fixed set of two or three special faces (bto/expected-waiting), and the expected number of different types after a **fixed** number of tries (bto/linearity).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Draw with replacement until all 13 ranks have appeared: expected draws', 'Draw with replacement until an ace appears: expected draws', 'Draw 13 cards with replacement: expected number of different ranks', 'Draw until an ace and a king have both appeared: expected draws'], answer: 0, traps: { 1: 'one specific type: 1/p = 13', 2: 'a fixed number of draws: linearity', 3: 'two special types: a two-stage wait (bto/expected-waiting)' }, explain: 'Every one of the 13 types must appear.' },
    ] },

    S('why'),
    { type: 'text', text: `Collecting everything takes much longer than the number of types: a die needs about ${f2(all(6))} throws for 6 faces, and 50 types need about ${Math.round(approx(50))} tries. The size of that gap is exactly what a closest-value question tests, and the wrong options (n, n², 1 + 2 + … + n) are what intuition produces. One idea, splitting into stages, gets it exact, and the same stages give the partial versions ("until 4 different faces") for free.` },

    S('anchor'),
    { type: 'text', text: 'From bto/expected-waiting: a wait for a success with chance p per try lasts 1/p on average, and waits in stages add. Coupon collecting is that with **one change**: the stage success chance **falls** as your collection grows, because fewer types are still new. Nothing else changes: each stage is still a fresh geometric wait, and the stages still add.' },
    { type: 'check', scope: 'a geometric stage lasts 1/p', questions: [
      { make: (rng) => { const n = rng.pick([6, 8, 10]), i = rng.int(1, n - 1); return mc(rng, `A fair ${n}-sided die. You have already seen ${i} different faces. Expected throws until a new face?`, stage(n, i).toString(), [[Q.of(n - i, n).toString(), 'gave the chance per throw, not the wait'], [Q.of(n, i).toString(), 'used the faces already seen instead of the ones still missing'], [String(n), 'used the wait for one specific face']], `Chance of new = ${n - i}/${n}, so the wait is ${n}/${n - i} = ${stage(n, i)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the wait for all six faces as stages. Stage i runs while you hold i faces; it ends at the first new face. Early stages are short because almost every throw is new; late stages are long because almost every throw is a repeat.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Expected throws in each stage (fair die)', xLabel: 'faces already held', yLabel: 'expected throws', categories: ['0', '1', '2', '3', '4', '5'], series: [{ name: 'stage wait', values: [0, 1, 2, 3, 4, 5].map((i) => Number(stage(6, i).toNumber().toFixed(2))) }], valueLabels: true }, caption: `The stages grow: ${[0, 1, 2, 3, 4, 5].map((i) => +stage(6, i).toNumber().toFixed(2)).join(', ')}. They add to ${all(6)} = ${f2(all(6))}. The last face alone costs 6, about ${Math.round((6 / all(6).toNumber()) * 100)}% of the total.` },
    { type: 'check', scope: 'reading the stage bars', questions: [
      { make: (rng) => { const i = rng.int(2, 4); return { type: 'number', q: `Fair die, ${i} faces already seen. Expected throws until the next new face? (Decimals are fine.)`, answer: stage(6, i).toNumber(), tolerance: 0.01, explain: `6/(6 − ${i}) = ${stage(6, i)} = ${f2(stage(6, i))}.` }; } },
    ] },
    { type: 'text', text: 'The same stages as a chain. The state is how many types you hold; you can stay or move up one, never down. A state with a loop back to itself is a geometric wait, and its mean is 1 over the chance of leaving.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Collecting four suits', nodes: [node('0', '0', 0.02, 0.5), node('1', '1', 0.26, 0.5), node('2', '2', 0.5, 0.5), node('3', '3', 0.74, 0.5), node('4', '4', 0.98, 0.5)], edges: [{ from: '0', to: '1', p: 1, label: '1' }, { from: '1', to: '1', p: 1 / 4, label: '1/4' }, { from: '1', to: '2', p: 3 / 4, label: '3/4' }, { from: '2', to: '2', p: 2 / 4, label: '2/4' }, { from: '2', to: '3', p: 2 / 4, label: '2/4' }, { from: '3', to: '3', p: 3 / 4, label: '3/4' }, { from: '3', to: '4', p: 1 / 4, label: '1/4' }, { from: '4', to: '4', p: 1, label: 'done' }] }, caption: `No arrow goes back, so each stage is a clean geometric wait: 4/4 + 4/3 + 4/2 + 4/1 = ${all(4)} ≈ ${f2(all(4))} draws.` },
    { type: 'check', scope: 'stages that add', questions: [
      { make: (rng) => { const n = rng.int(3, 6); const v = all(n); return mc(rng, `${n} equally likely types, one per try. Expected tries to collect all ${n}?`, v.toString(), [[String(n), 'assumed every try brings a new type'], [String(n * n), 'squared the number of types'], [String((n * (n + 1)) / 2), 'added 1 + 2 + … + n: the stage waits are n/n, n/(n − 1), …'], [Q.of(n).mul(H(n - 1)).toString(), 'stopped one stage early and missed the slowest stage']], `${terms(n, n)} = ${v} ≈ ${f2(v)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'For large n, n·H_n grows like n·ln n: faster than n, much slower than n².' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 30, label: 'types n' }, y: { min: 0, max: 120, label: 'expected tries' }, curves: [{ label: 'n·H_n (exact)', points: NS.map((n) => [n, all(n).toNumber()]) }, { label: 'n (one try each)', points: NS.map((n) => [n, n]) }], markers: [{ x: 6, y: all(6).toNumber(), label: `die: ${f2(all(6))}` }] }, caption: `The gap between the curves is the cost of repeats. At n = 30 the exact value is ${f2(all(30))}; n(ln n + 0.577) gives ${f2(approx(30))}.` },
    { type: 'check', scope: 'the n(ln n + 0.577) estimate', questions: [
      { make: (rng) => { const n = rng.pick([20, 30, 50, 100]); return { type: 'number', q: `Estimate the expected tries to collect all of ${n} equally likely types, with n(ln n + 0.577). Round to a whole number.`, answer: Math.round(approx(n)), tolerance: 2, hints: [`ln ${n} ≈ ${Math.log(n).toFixed(2)}.`, `${n} × (${Math.log(n).toFixed(2)} + 0.577).`], explain: `${n} × ${(Math.log(n) + GAMMA).toFixed(3)} ≈ ${approx(n).toFixed(1)} (exact ${f2(all(n))}).` }; } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Stage i is the time while you hold exactly i of the n types. During it, every try is new with the same chance (n − i)/n.', why: 'Any of the n − i missing types counts as new, and each try is independent.', answers: 'one-each',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 8, 12]), i = rng.int(1, n - 2); return mc(rng, `${n} types, ${i} already held. P(the next try is new)?`, Q.of(n - i, n).toString(), [[Q.of(1, n).toString(), 'only counted one specific missing type'], [Q.of(i, n).toString(), 'counted the types you already have'], [Q.of(1, n - i).toString(), 'inverted the fraction']], `${n - i} of the ${n} types are missing.`); } },
        ] },
      { say: 'Each stage is a geometric wait with mean n/(n − i).', why: 'Mean wait = 1/p with p = (n − i)/n. Early stages have p near 1, so they last about one try; only the last stage has p = 1/n.', answers: 'four-waits',
        checks: [
          { make: (rng) => { const n = rng.pick([5, 8, 10]); return { type: 'number', q: `${n} types. Expected tries in the last stage (${n - 1} held, 1 missing)?`, answer: n, explain: `n/(n − (n − 1)) = ${n}/1 = ${n}: the last type alone takes n tries.` }; } },
        ] },
      { say: 'Add the stages: E = n/n + n/(n − 1) + … + n/1 = n(1 + 1/2 + … + 1/n) = n·H_n.', why: 'Linearity: the total time is the sum of the stage times. The stages happen one after another and never overlap, so nothing is double counted.', answers: 'distribution',
        checks: [
          { make: (rng) => { const n = rng.int(3, 6); return { type: 'number', q: `Expected tries to collect all of ${n} types? (Decimals are fine.)`, answer: all(n).toNumber(), tolerance: 0.01, hints: [`Stages: ${terms(n, n)}.`, `H_${n} = ${H(n)}.`], explain: `${n} × ${H(n)} = ${all(n)} ≈ ${f2(all(n))}.` }; } },
        ] },
      { say: 'Only k of the n types: stop after stage k − 1. E = n/n + n/(n − 1) + … + n/(n − k + 1).', why: 'You need k new types, so you run only the first k stages: the fast ones. That is why a partial collection is so much cheaper than a full one.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 8, 10, 12]), k = rng.int(2, 4); const v = partial(n, k); return mc(rng, `A fair ${n}-sided die. Expected throws until ${k} different faces have appeared?`, v.toString(), [[String(k), 'assumed every throw shows a new face'], [all(n).toString(), `computed the wait for all ${n} faces`], [Q.of(n).mul(H(k)).toString(), `used ${n}·H_${k}: the stages are ${n}/${n}, ${n}/${n - 1}, …, not ${n}/1, ${n}/2, …`]], `${terms(n, k)} = ${v} ≈ ${f2(v)}.`); } },
        ] },
      { say: 'For large n use H_n ≈ ln n + 0.577, so E ≈ n(ln n + 0.577).', why: 'The harmonic sum is the area under 1/x plus a constant (Euler\'s 0.577).',
        checks: [
          { type: 'choice', q: '100 types. Which is closest to the expected number of tries to collect them all?', options: [String(Math.round(approx(100))), '100', String(Math.round(100 * Math.log(100))), '10000'], answer: 0, traps: { 1: 'one try per type: repeats are ignored', 2: `n ln n without the 0.577n term: about ${Math.round(GAMMA * 100)} tries short`, 3: 'n²: far too many' }, explain: `100 × (${Math.log(100).toFixed(3)} + 0.577) ≈ ${approx(100).toFixed(0)}; exact ${f2(all(100))}.` },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is the last type so expensive, and why does that make the total grow faster than n?', model: 'When you hold all but one type, only 1 of the n outcomes is new, so that stage alone takes n tries on average. The second-to-last takes n/2, and so on, so the total is n(1 + 1/2 + … + 1/n). That harmonic sum keeps growing like ln n, so the total grows like n ln n rather than n.', points: ['stage i lasts n/(n − i) on average', 'the last stage alone lasts n', 'the sum n·H_n grows like n ln n'] },

    S('worked'),
    { type: 'worked', family: 'coupon-collector', section: 'bto', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Every face of a die. Try it before opening the solution.' },
    { type: 'worked', family: 'coupon-collector', section: 'bto', difficulty: 3, seed: 'b', fade: 1, intro: 'A partial collection. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Fair die: which takes longer on average, collecting the first 5 faces or collecting the sixth one after that?', answer: `About the same: the first five take ${f2(partial(6, 5))} throws, the last one alone takes 6.`, explain: 'The last stage is the slowest by far.' },

    S('traps'),
    { type: 'traps', family: 'coupon-collector', section: 'bto', extra: [
      { belief: 'n types take about n tries.', fix: `Repeats pile up near the end: n·H_n, which is ${f2(all(6))} for a die.` },
      { belief: 'The stage waits are 1, 2, …, n.', fix: 'They are n/n, n/(n − 1), …, n/1: the fractions, not the integers.' },
      { belief: 'n ln n is the answer.', fix: 'Add 0.577n: n(ln n + 0.577). For small n use the exact sum.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out the expected throws of a fair 8-sided die until 3 different faces have appeared. One step is wrong.', steps: [
      'Stage 0: the first throw is always new, 1 throw.',
      'Stage 1: one face held, a new face with 7/8, wait 8/7.',
      'Stage 2: two faces held, a new face with 2/8, wait 8/2 = 4.',
      `Total = 1 + 8/7 + 4 = ${Q.of(1).add(Q.of(8, 7)).add(Q.of(4))}.`,
    ], errorStep: 2, explain: `With two faces held, 6 of the 8 faces are new, not 2: p = 6/8, wait 8/6. Total = ${terms(8, 3)} = ${partial(8, 3)} ≈ ${f2(partial(8, 3))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'All six faces of a die. A candidate answers 21. Which belief?', options: ['Took the stage waits as 1, 2, …, 6', 'Used n ln n without the 0.577n term', 'Counted one try per type, no repeats'], answer: 0, traps: { 1: `6 ln 6 ≈ ${(6 * Math.log(6)).toFixed(1)}, not 21`, 2: 'one try per type gives 6' }, explain: `1 + 2 + … + 6 = 21. The stages are 6/6, 6/5, …, 6/1: ${all(6)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Landmarks: coin (2 types) 3; four suits ${all(4)} ≈ ${f2(all(4))}; die ${f2(all(6))}; 10 types ${f2(all(10))}; 13 ranks ${f2(all(13))}. Harmonic numbers: H₄ = ${H(4)}, H₆ = ${H(6)}.` },
    { type: 'callout', tone: 'speed', text: `For n of 10 or more, go straight to n(ln n + 0.577): ${[10, 20, 50, 100].map((n) => `ln ${n} ≈ ${Math.log(n).toFixed(2)}`).join(', ')}. It is within 2% and takes 15 of your ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'thinkaloud', problem: `Each cereal box holds one of ${TK} toys, all equally likely. What is the expected number of boxes needed to collect all ${TK}?`, lines: [
      { t: 0, say: `All of ${TK} types, repeats possible: coupon collector. Stages by how many toys I already hold.` },
      { t: 4, say: `Each toy is a 1/${TK} wait, so ${TK} × ${TK} = ${TK * TK} boxes...`, slip: true },
      { t: 8, say: `No: early on almost every box is new. Only the last toy costs ${TK}. Stage waits are ${TK}/${TK}, ${TK}/${TK - 1}, …, ${TK}/1.` },
      { t: 14, say: `Sum = ${TK} × H_${TK}. H_${TK} ≈ ${H(TK).toNumber().toFixed(3)}, so about ${f2(all(TK))}.` },
      { t: 22, say: `Check: ${TK}(ln ${TK} + 0.577) ≈ ${f2(approx(TK))}, close and slightly under, as expected for small n. ${TK * TK} was never plausible.` },
      { t: 27, say: `Answer ≈ ${f2(all(TK))}, with ${SECTIONS.bto.exam.perItemSeconds - 27} seconds left.` },
    ] },
    { type: 'check', scope: 'landmark values', questions: [
      { make: (rng) => { const n = rng.pick([2, 4, 6]); return { type: 'number', q: `Expected tries to collect all ${n} equally likely types? (Decimals are fine.)`, answer: all(n).toNumber(), tolerance: 0.01, explain: `${n}·H_${n} = ${all(n)} ≈ ${f2(all(n))}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Collect all n types → Σ n/(n − i) = n·H_n ≈ n(ln n + 0.577). Only k types → stop the sum after k stages.' },

    S('contrast'),
    { type: 'compare', columns: ['Question (fair die)', 'Stages', 'Expected throws'], rows: [
      ['one specific face (a six)', '1 stage, p = 1/6', '6'],
      ['a 1 and a 2 (any order)', '6/2 + 6/1', Q.of(6, 2).add(Q.of(6)).toString()],
      ['any 3 different faces', '6/6 + 6/5 + 6/4', partial(6, 3).toString()],
      ['all 6 faces', '6/6 + … + 6/1', `${all(6)} ≈ ${f2(all(6))}`],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: n = 1 takes one try. n = 2 (a coin) takes 1 + 2 = 3. k = 1 of any n takes exactly one try, since the first try is always new.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: any wait that climbs through stages without falling back adds its stage means (bto/expected-waiting). After a fixed number of tries, the expected number of types seen is linearity, n(1 − (1 − 1/n)^t) (bto/linearity). In systems it is "how many requests until every server has been hit".' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Fair die. Which is largest?', options: ['all 6 faces', 'any 5 different faces', 'a 1 and a 2', 'a six'], answer: 0, traps: { 1: `5 faces: ${f2(partial(6, 5))}, the slow last stage is missing`, 2: `${Q.of(6, 2).add(Q.of(6))} throws`, 3: '6 throws' }, explain: `All six: ${f2(all(6))}.` },
    ] },
    { type: 'variation', base: `A fair die is thrown until all 6 faces have appeared: E = 6·H_6 = ${all(6)} ≈ ${f2(all(6))}.`, rows: [
      { change: 'Use a spinner with 6 equal sectors instead of a die', effect: `No change: ${f2(all(6))}. Only the number of equally likely types matters, not what carries them.`, same: true },
      { change: 'Stop at 3 different faces', effect: `Only the three fast stages: ${terms(6, 3)} = ${partial(6, 3)} = ${f2(partial(6, 3))}.` },
      { change: 'Use an 8-sided die', effect: `One more stage and bigger numerators: 8·H_8 = ${all(8)} ≈ ${f2(all(8))}.` },
      { change: 'Load the die so the 6 comes up half the time', effect: 'Longer. The other faces become rarer, and the last rare face now dominates the wait. Equal chances give the shortest collection.' },
      { change: 'A 12-sided die, and stop at 6 different faces', effect: `Both changes cut the wait: more types keep each early stage near one throw, and stopping at 6 skips every slow stage. ${terms(12, 6)} ≈ ${f2(partial(12, 6))}, about half of ${f2(all(6))}.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const k = rng.int(3, 5); const v = partial(13, k); return { type: 'number', q: `You draw a card from a full deck, note its rank, and put it back. Expected draws until ${k} different ranks have appeared? (Decimals are fine.)`, answer: v.toNumber(), tolerance: 0.01, hints: ['13 types; you need only the first few stages.', `Stages: ${terms(13, k)}.`], explain: `${terms(13, k)} = ${v} ≈ ${f2(v)}.` }; } },
      far: { make: (rng) => { const n = rng.pick([20, 50, 100, 200]); return { type: 'number', q: `A market-data feed updates one of ${n} stocks at random on each tick, all equally likely. Estimate the expected number of ticks until every stock has updated at least once. Round to a whole number.`, answer: Math.round(approx(n)), tolerance: Math.max(2, Math.round(0.02 * approx(n))), hints: ['Each stock is a type; you need all of them.', `n(ln n + 0.577) with ln ${n} ≈ ${Math.log(n).toFixed(2)}.`], explain: `${n} × (${Math.log(n).toFixed(2)} + 0.577) ≈ ${approx(n).toFixed(0)} (exact ${n}·H_${n} ≈ ${f2(all(n))}).` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from dice to the ranks and to the stock feed?', options: ['Stages by types held: add the waits n/(n − i)', 'Every try is new, so n types take about n tries', 'Each type is a wait of n, so n × n tries in all', 'Stage waits go 1, 2, …, n, so add the integers'], answer: 0, traps: { 1: 'repeats pile up as the collection grows', 2: 'early on any missing type counts as new', 3: 'the stage waits are fractions n/(n − i), not integers' }, explain: 'Ranks and stocks are equally likely types collected with repeats. Stage i lasts n/(n − i); a partial collection stops early, a full one adds all n stages.' } },

    S('tryit'),
    { type: 'tryit', family: 'coupon-collector', section: 'bto', count: 3 },
  ],
};
