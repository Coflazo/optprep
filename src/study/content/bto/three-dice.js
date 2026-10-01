// Three dice: 216 ordered triples, split by shape (120 / 90 / 6), sums by fixing two dice,
// maximum as a cube. Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
const fr = (n, d = 1) => Q.of(n, d).toString();
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const T = 216;
const F = [1, 2, 3, 4, 5, 6];
const triples = F.flatMap((a) => F.flatMap((b) => F.map((c) => [a, b, c])));
const count = (pred) => triples.filter(pred).length;
const ways3 = (s) => count(([a, b, c]) => a + b + c === s);
const multisets = (s) => { let n = 0; for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) { const c = s - a - b; if (c >= b && c <= 6) n++; } return n; };
const ALL_DIFF = count(([a, b, c]) => new Set([a, b, c]).size === 3);
const PAIR = count(([a, b, c]) => new Set([a, b, c]).size === 2);
const TRIPLE = count(([a, b, c]) => a === b && b === c);
const ODD = count(([a, b, c]) => (a * b * c) % 2 === 1);
const maxEq = (k) => k ** 3 - (k - 1) ** 3;
const SUMS = Array.from({ length: 16 }, (_, i) => i + 3);
const MOVES = [-1, 0, 1].flatMap((a) => [-1, 0, 1].flatMap((b) => [-1, 0, 1].map((c) => a + b + c)));
const BACK = MOVES.filter((m) => m === 0).length; // up/down/stay sequences of 3 steps that return to the start
const k3 = (k) => ({ pair: 3 * k * (k - 1), diff: k * (k - 1) * (k - 2), all: k ** 3 });
const sumGrid = (s) => {
  const hl = [];
  const text = F.map((a) => F.map((b) => { const c = s - a - b; if (c >= 1 && c <= 6) { hl.push([a - 1, b - 1]); return c; } return '·'; }));
  return { rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: text, highlight: hl, count: hl.length };
};

export default {
  id: 'bto/three-dice',
  book: 'bto',
  kind: 'family',
  family: 'three-dice',
  title: 'Three dice',
  summary: 'Count 216 ordered triples: split them 120 / 90 / 6 by shape, fix two dice for sums, cube for the maximum.',
  prerequisites: ['bto/two-dice-sum', 'bto/die-repeats'],
  objectives: [
    'Recognise a three-dice question and name its equally likely outcomes (216 ordered triples)',
    'Split 216 into all different, exactly a pair and three of a kind, and use the split to answer in seconds',
    'Count the triples for any sum by fixing the first two dice',
    'Compute P(max = k) = (k³ − (k − 1)³)/216 and P(product even) by the complement',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw three fair dice. What is the probability that exactly two of them show the same face (a pair, not three of a kind)? Find two different ways.', answer: `${PAIR}/216 = ${fr(PAIR, T)}`, explain: `Direct: 3 positions for the odd die × 6 faces for the pair × 5 for the odd die = ${PAIR}. By elimination: 216 − ${ALL_DIFF} (all different) − ${TRIPLE} (triples) = ${PAIR}. If you got ${fr(T - ALL_DIFF, T)} you included three of a kind; if you got ${fr(30, T)} you forgot where the odd die sits.`, attempts: [
      { id: 'no-position', label: 'Pair face times odd face', approach: `Counted 6 faces for the pair × 5 for the odd die = 30 of 216, so ${fr(30, T)}.`, breaksAt: 'A combination like {2, 2, 5} is three ordered triples: the odd die can be first, second or third.' },
      { id: 'at-least-two', label: 'One minus all different', approach: `Took 1 − P(all different) = ${fr(T - ALL_DIFF, T)}.`, breaksAt: 'That is "at least two equal", which also contains the three-of-a-kind triples.' },
    ] },
    { type: 'text', text: 'Three fair dice are thrown at once (or one die three times, which is the same thing). The question asks about the **shape** of the result (all different, a pair, three of a kind), the **sum**, the **highest face**, or a property such as an even product.' },
    { type: 'list', items: ['"Three dice are rolled. What is the probability that the total is 10?"', '"Three dice: what is the chance that exactly two match?"', '"Three dice: probability the highest number shown is 5?"', '"Three dice are rolled and the faces multiplied. Probability the product is even?"'] },
    { type: 'text', text: 'Not this lesson: two dice (bto/two-dice-sum, bto/dice-order-stats) and long runs of throws where only agreement matters (bto/die-repeats). Three dice is where the counting first gets big enough that shortcuts matter.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Three dice: probability the sum is 12', 'Two dice: probability the sum is 12', 'A die thrown until the first six: probability it takes 3 throws', 'Two dice: probability both are even'], answer: 0, traps: { 1: 'two dice: bto/two-dice-sum', 2: 'a waiting question: bto/first-success', 3: 'two dice' }, explain: 'Three dice and a sum: 216 ordered triples.' },
    ] },

    S('why'),
    { type: 'text', text: 'With 216 outcomes you cannot list cells the way you can with 36. Three dice questions test whether you still count **ordered** outcomes when there are too many to see, and whether you know a few structural splits that make the count instant. A question like "three dice total 10" takes 15 seconds with the right picture and minutes without.' },

    S('anchor'),
    { type: 'text', text: 'Two dice give 6 × 6 = 36 ordered pairs, all equally likely. Three dice are the same idea with **one more factor of 6**: 6 × 6 × 6 = **216** ordered triples (first, second, third), each with probability 1/216. Everything you did on the 36-cell grid still holds; there is just one more die to place.' },
    { type: 'check', scope: '216 ordered triples', questions: [
      { type: 'number', q: 'Three dice. How many equally likely ordered outcomes are there?', answer: T, explain: '6 × 6 × 6.' },
      { type: 'choice', q: 'Three dice. P(all three show 6)?', options: [fr(1, T), fr(1, 36), fr(3, 6), fr(1, 16)], answer: 0, traps: { 1: 'used two dice', 2: 'added 1/6 per die', 3: 'treated the 16 possible sums as equally likely' }, explain: 'One triple, (6,6,6), out of 216.' },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the shapes as a tree, asking only "new face or repeat?" at each die. The second die repeats the first with 1/6. The third die either matches, adds a new face, or completes a triple. The two marked paths are the ways to end with exactly a pair.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'die 1', children: [{ p: '1', label: 'any face', children: [
      { p: '5/6', label: 'die 2 new', children: [{ p: '4/6', label: 'die 3 new: all different' }, { p: '2/6', label: 'die 3 repeats one: pair', mark: true }] },
      { p: '1/6', label: 'die 2 repeats', children: [{ p: '1/6', label: 'die 3 repeats: triple' }, { p: '5/6', label: 'die 3 new: pair', mark: true }] },
    ] }] }, total: fr(PAIR, T) }, caption: `Exactly a pair = 5/6 × 2/6 + 1/6 × 5/6 = ${fr(PAIR, T)}. The unmarked leaves give all different (${fr(ALL_DIFF, T)}) and triple (${fr(TRIPLE, T)}); the three add to 1.` },
    { type: 'check', scope: 'the shape tree', questions: [
      { type: 'choice', q: 'From the tree: P(three of a kind)?', options: [fr(TRIPLE, T), fr(1, T), fr(2, 6), fr(1, 6)], answer: 0, traps: { 1: 'required one named face, such as three sixes', 2: 'added 1/6 for each later die', 3: 'only required die 2 to match die 1' }, explain: `1 × 1/6 × 1/6 = ${fr(TRIPLE, T)}: ${TRIPLE} triples of 216.` },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Three dice: every triple has exactly one shape', xLabel: 'shape', yLabel: 'ordered triples', categories: ['all different', 'exactly a pair', 'three of a kind'], series: [{ name: 'triples', values: [ALL_DIFF, PAIR, TRIPLE] }], valueLabels: true }, caption: `${ALL_DIFF} + ${PAIR} + ${TRIPLE} = ${ALL_DIFF + PAIR + TRIPLE}. Know any two and the third is free.` },
    { type: 'check', scope: 'the 120 / 90 / 6 split', questions: [
      { type: 'number', q: 'Three dice. How many ordered triples contain at least two equal faces?', answer: PAIR + TRIPLE, hints: ['Which shapes have at least two equal faces?', 'Pairs and triples, or 216 minus all different.'], explain: `${PAIR} + ${TRIPLE} = 216 − ${ALL_DIFF} = ${PAIR + TRIPLE}.` },
    ] },
    { type: 'text', text: 'For a sum, fix the first two dice on the familiar 6 × 6 grid. For each cell, the third die must show s − first − second. The cell counts when that number is a real face, 1 to 6. The grid below does it for a sum of 10: each highlighted cell shows the face the third die needs.' },
    { type: 'diagram', diagram: 'grid', spec: sumGrid(10), caption: `Sum 10: ${ways3(10)} highlighted cells, so ${ways3(10)} ordered triples. A dot means the third die would need a face below 1 or above 6.` },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Ordered triples per sum', xLabel: 'sum', yLabel: 'triples', categories: SUMS.map(String), series: [{ name: 'triples', values: SUMS.map(ways3) }], valueLabels: true }, caption: `Doing that for every sum gives a bell: ${SUMS.slice(0, 6).map(ways3).join(', ')}, … up to ${ways3(10)} at 10 and 11, then back down. The chart is symmetric: sum s and 21 − s have the same count.` },
    { type: 'check', scope: 'fixing two dice; the symmetry s ↔ 21 − s', questions: [
      { make: (rng) => { const s = rng.int(4, 7); return { type: 'number', q: `Three dice. How many ordered triples have sum ${s}? (Fix the first two dice.)`, answer: ways3(s), hints: [`For which (first, second) is ${s} − first − second between 1 and 6?`, `The first two dice must sum to between ${s - 6} and ${s - 1}.`], explain: `Count (a, b) with 1 ≤ ${s} − a − b ≤ 6: ${ways3(s)} cells.` }; } },
      { type: 'choice', q: 'Three dice. Which sum is as likely as a sum of 7?', options: ['14', '13', '11', '8'], answer: 0, traps: { 1: 'mirrored about 10 instead of 10.5', 2: 'guessed the peak', 3: `took the neighbouring sum: 8 has ${ways3(8)} triples, 7 has ${ways3(7)}` }, explain: `Swap every face x for 7 − x: sum s becomes 21 − s. So 7 ↔ 14, both ${ways3(7)} triples.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'no-position', say: 'Use ordered triples as the outcomes: 216 of them, each 1/216.', why: 'The dice are distinct objects. The 56 unordered combinations are not equally likely: {1,2,3} happens in 6 orders, {1,1,2} in 3, {1,1,1} in 1.',
        checks: [
          { type: 'choice', q: 'Why is dividing by 56 (unordered combinations) wrong?', options: ['Combinations happen in different numbers of orders', 'There are 64 combinations, so 56 undercounts them', 'Sums, not combinations, are the equally likely outcomes'], answer: 0, traps: { 1: 'there are 56; the problem is that they are not equally likely', 2: `sums are even less equal: sum 3 has 1 triple, sum 10 has ${ways3(10)}` }, explain: `{1,2,3} is 6 ordered triples; {2,2,2} is 1. Dividing by 56 treats them as equally likely.` },
        ] },
      { say: 'All different: walk the dice, 6 × 5 × 4 = 120. Three of a kind: 6 (one per face).', why: 'The same allowed-face walk as repeated throws: each new die avoids every used face.',
        checks: [
          { type: 'choice', q: 'Three dice. P(all three different)?', options: [fr(ALL_DIFF, T), fr(25, 36), fr(35, 36), fr(20, T)], answer: 0, traps: { 1: 'only kept neighbouring dice apart (5/6 × 5/6)', 2: 'took the complement of "all the same"', 3: 'counted sets of three faces, C(6,3), without their 6 orders' }, explain: `${ALL_DIFF}/216 = ${fr(ALL_DIFF, T)}.` },
        ] },
      { answers: 'at-least-two', say: 'Exactly a pair: 216 − 120 − 6 = 90. Directly: choose the odd die\'s position (3) × the pair face (6) × a different odd face (5) = 90.', why: 'Every triple has exactly one shape, so the counts add to 216. The direct count confirms it; forgetting the 3 positions is the classic slip.',
        checks: [
          { make: (rng) => mc(rng, 'Three dice. P(exactly two show the same face)?', fr(PAIR, T), [[fr(PAIR + TRIPLE, T), 'included three of a kind ("at least two")'], [fr(30, T), 'forgot to choose which die is the odd one'], [fr(15, T), 'required the pair to be one named face'], ['1/2', 'added 1/6 for each of the three pairs of dice']], `${PAIR}/216 = ${fr(PAIR, T)}.`) },
        ] },
      { say: 'Sum s: for each of the 36 (first, second) pairs, the third die is forced to s − first − second. Count the pairs where that face is legal.', why: 'Each (a, b) gives at most one c, so counting triples reduces to counting cells of a grid you already know.',
        checks: [
          { make: (rng) => { const s = rng.pick([5, 6, 15, 16]); return { type: 'number', q: `Three dice. How many ordered triples have sum ${s}?`, answer: ways3(s), hints: [s > 10 ? `Use symmetry: sum ${s} matches sum ${21 - s}.` : 'Fix the first two dice and check the third.', `Count the (a, b) that leave a legal third face.`], explain: `${ways3(s)} triples${s > 10 ? ` (same as sum ${21 - s})` : ''}.` }; } },
        ] },
      { say: 'Maximum: max ≤ k ⇔ every die ≤ k, so k³ triples. Max exactly k: k³ − (k − 1)³.', why: 'The two-dice square becomes a cube; subtracting the smaller cube leaves the triples whose largest face is exactly k.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 6); return mc(rng, `Three dice. P(highest face is exactly ${k})?`, fr(maxEq(k), T), [[fr(k ** 3, T), `computed max ≤ ${k}`], ['1/6', 'assumed the maximum is uniform'], [fr(3 * (k - 1) ** 2, T), `counted exactly one die at ${k} and forgot two or three`]], `${k}³ − ${k - 1}³ = ${maxEq(k)}: ${fr(maxEq(k), T)}.`); } },
        ] },
      { say: 'Even product: a product is odd only when every factor is odd, so P(even) = 1 − (1/2)³.', why: 'One even die is enough to make the product even; the complement is a single clean case.',
        checks: [
          { type: 'number', q: 'Three dice are multiplied. How many of the 216 ordered triples give an even product?', answer: T - ODD, hints: ['When is a product odd?', 'All three dice odd: 3 × 3 × 3.'], explain: `216 − ${ODD} = ${T - ODD}, so P = ${fr(T - ODD, T)}.` },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does the direct count for "exactly a pair" need the factor 3, and how can you check the answer without it?', model: `A pair and an odd die can be arranged with the odd die first, second or third, and these are different ordered triples, so there are 3 × 6 × 5 = ${PAIR}. The check is the split: all 216 triples are all different (${ALL_DIFF}), a pair, or a triple (${TRIPLE}), so pairs are what is left.`, points: ['ordered triples: the odd die\'s position matters', '3 positions × 6 pair faces × 5 odd faces', 'check: 216 − 120 − 6'] },

    S('worked'),
    { type: 'worked', family: 'three-dice', section: 'bto', difficulty: 2, seed: 'f', explainAt: [0], intro: 'A shape question on three dice. Try it before opening the solution.' },
    { type: 'worked', family: 'three-dice', section: 'bto', difficulty: 3, seed: 'd', fade: 1, intro: 'A sum on three dice. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'Three fair dice are thrown. What is the probability that the sum is 16?', lines: [
      { t: 0, say: `Three dice, a sum near the top: 216 ordered triples, and I mirror. 16 pairs with 21 − 16 = ${21 - 16}.` },
      { t: 4, say: `Sum ${21 - 16} as faces: {1,1,3} and {1,2,2}. That is ${multisets(5)} outcomes, so ${multisets(5)}/216?`, slip: true },
      { t: 8, say: `Wait, those are combinations. Each pair shape stands for 3 ordered triples: ${multisets(5)} × 3 = ${ways3(5)}.` },
      { t: 12, say: `Cross-check with the triangular list for sums 3 to 8: ${SUMS.slice(0, 3).map(ways3).join(', ')}, so sum 5 has ${ways3(5)}. Same.` },
      { t: 16, say: `P = ${ways3(16)}/216 = ${fr(ways3(16), T)} ≈ ${(ways3(16) / T).toFixed(3)}. Tiny, as an extreme sum should be. Answer ${fr(ways3(16), T)}.` },
    ] },

    S('predict'),
    { type: 'predict', question: 'Without computing: three dice. Is P(all three different) above or below 1/2? And is a sum of 10 more or less likely than a sum of 9?', answer: `Above: ${fr(ALL_DIFF, T)} ≈ ${Math.round(ALL_DIFF / T * 1000) / 1000}. And 10 beats 9, ${ways3(10)} triples against ${ways3(9)}.`, explain: `Both sums have six unordered partitions, but 9 includes (3,3,3), which has only one order.` },

    S('traps'),
    { type: 'traps', family: 'three-dice', section: 'bto', extra: [
      { belief: 'The 16 sums from 3 to 18 are equally likely.', fix: `Sum 3 has 1 triple, sum 10 has ${ways3(10)}.` },
      { belief: 'The 56 unordered combinations are equally likely outcomes.', fix: 'A combination of three different faces happens in 6 orders, a pair-shape in 3, a triple in 1.' },
      { belief: '"Exactly a pair" is 1 − P(all different).', fix: 'That is "at least two equal", which also contains the 6 triples.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(sum of three dice is 5). One step is wrong.', steps: [
      'There are 216 equally likely ordered triples.',
      'The ways to write 5 as three faces are {1,1,3} and {1,2,2}.',
      'Each of these is one outcome, so there are 2 favourable outcomes.',
      'P = 2/216 = 1/108.',
    ], errorStep: 2, explain: `{1,1,3} is three ordered triples ((1,1,3), (1,3,1), (3,1,1)), and so is {1,2,2}. The count is ${ways3(5)} (matching ${multisets(5)} combinations × 3 orders), so P = ${fr(ways3(5), T)}. The error mixed unordered combinations with an ordered total.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `A candidate answers P(sum = 10) = ${multisets(10)}/56. Which belief produced it?`, options: ['Unordered combinations are equally likely', 'All 16 possible sums are equally likely', 'The third die was left out of the count'], answer: 0, explain: `${multisets(10)} combinations of 56, but they carry different numbers of orders. Correct: ${ways3(10)}/216 = ${fr(ways3(10), T)}.` },
      { type: 'choice', q: `Another answers P(exactly a pair) = ${fr(PAIR + TRIPLE, T)}. Which belief?`, options: ['Counting triples as pairs', 'Forgetting the odd die\'s position', 'Using two dice'], answer: 0, explain: `${fr(PAIR + TRIPLE, T)} = 1 − ${fr(ALL_DIFF, T)} includes the ${TRIPLE} triples.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise **${ALL_DIFF} / ${PAIR} / ${TRIPLE}** (all different / exactly a pair / three of a kind). As fractions: ${fr(ALL_DIFF, T)}, ${fr(PAIR, T)}, ${fr(TRIPLE, T)}.` },
    { type: 'callout', tone: 'speed', text: `Sums 3 to 8 have ${SUMS.slice(0, 6).map(ways3).join(', ')} triples: the triangular numbers. Then ${ways3(9)}, ${ways3(10)}, ${ways3(11)}, ${ways3(12)} in the middle. Anything above 10.5 mirrors: count sum s as 21 − s.` },
    { type: 'callout', tone: 'speed', text: `Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds a question. Shape and product items are 10-second recalls; sums and maxima take 30 with the grid or the cube.` },
    { type: 'check', scope: 'the memorised split and the sum list', questions: [
      { make: (rng) => { const s = rng.pick([13, 14, 15, 16, 17]); return mc(rng, `Three dice. P(sum = ${s})?`, fr(ways3(s), T), [[fr(ways3(s - 1), T), 'mirrored to the wrong sum (21 − s is the partner)'], ['1/16', 'treated the 16 sums as equally likely'], [fr(multisets(s), 56), 'counted unordered combinations over 56']], `Sum ${s} mirrors sum ${21 - s}: ${ways3(s)} triples, ${fr(ways3(s), T)}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Three dice → 216 ordered triples = 120 all different + 90 pair + 6 triple. Sum: fix two dice, count legal thirds (s ↔ 21 − s). Max = k: k³ − (k−1)³.' },

    S('contrast'),
    { type: 'compare', columns: ['', 'Two dice', 'Three dice'], rows: [
      ['ordered outcomes', '36', String(T)],
      ['most likely sum', '7 (6 pairs)', `10 and 11 (${ways3(10)} triples)`],
      ['sum symmetry', 's ↔ 14 − s', 's ↔ 21 − s'],
      ['max ≤ k', 'k²/36', 'k³/216'],
      ['all different', '30/36', `${ALL_DIFF}/216`],
      ['all the same', '6/36', `${TRIPLE}/216`],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: sum 3 and sum 18 each have exactly one triple (1/216). A sum of 9 and a sum of 10 each have six unordered combinations, yet 9 has ${ways3(9)} triples and 10 has ${ways3(10)}, because (3,3,3) counts once while mixed combinations count 3 or 6 times.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: whenever outcomes are described as combinations, weight each combination by its number of orders (6 for all different, 3 for a pair, 1 for a triple). Poker hands, Likelihood List rankings of dice totals and multinomial counts all use this weighting.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Three dice. Which is more likely?', options: ['sum = 10', 'sum = 9', 'They are equally likely'], answer: 0, traps: { 1: '9 includes (3,3,3), a combination with a single order', 2: 'both have six combinations, but combinations carry different numbers of orders' }, explain: `${ways3(10)} against ${ways3(9)} ordered triples.` },
      { type: 'number', q: 'Three dice. How many ordered triples does the combination {2, 2, 5} stand for?', answer: 3, explain: '(2,2,5), (2,5,2), (5,2,2): a pair shape has 3 orders.' },
    ] },

    { type: 'variation', base: `Three dice. P(sum = 10) = ${ways3(10)}/216 = ${fr(ways3(10), T)}.`, rows: [
      { change: 'Ask for sum 11 instead', effect: `No change: ${ways3(11)} triples. 10 and 11 mirror each other (21 − 10 = 11), the twin peaks of the bell.`, same: true },
      { change: 'Throw one die three times instead of three dice at once', effect: 'No change. Three throws are three ordered positions, exactly like three labelled dice.', same: true },
      { change: 'Ask for sum 9', effect: `Drops to ${ways3(9)}: nine and ten both have six combinations, but (3,3,3) has one order where a mixed combination has 3 or 6.` },
      { change: 'Ask for "sum at least 11"', effect: `Sums 11 to 18 mirror sums 3 to 10, so exactly half: ${SUMS.filter((x) => x >= 11).reduce((a, x) => a + ways3(x), 0)}/216 = ${fr(SUMS.filter((x) => x >= 11).reduce((a, x) => a + ways3(x), 0), T)}.` },
      { change: 'Two dice and sum 11, both at once', effect: `The mirror moves with the number of dice: two dice mirror about 7 (s ↔ 14 − s), so 11 pairs with 3, giving ${F.flatMap((a) => F.map((b) => a + b)).filter((x) => x === 11).length}/36. Dropping a die changes the grid and the mirror together.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const k = rng.pick([4, 8, 10]); const c = k3(k); return mc(rng, `Three fair ${k}-sided dice (faces 1 to ${k}) are thrown. P(exactly two show the same face)?`, fr(c.pair, c.all), [[fr(c.all - c.diff, c.all), 'included three of a kind ("at least two")'], [fr(k * (k - 1), c.all), 'forgot to choose which die is the odd one'], [fr(3, k), 'added 1/k for each of the three pairs of dice']], `3 positions × ${k} pair faces × ${k - 1} odd faces = ${c.pair} of ${c.all}: ${fr(c.pair, c.all)}.`); } },
      far: { type: 'choice', q: 'Each second a quote moves up one tick, down one tick or stays, each with probability 1/3, independently. After 3 seconds, P(the quote is back where it started)?', options: [fr(BACK, 27), fr(2, 27), fr(2, 10), fr(BACK - 1, 27)], answer: 0, traps: { 1: 'counted the combinations {up, down, stay} and {stay, stay, stay} as one sequence each', 2: 'took 2 of the 10 unordered combinations as equally likely', 3: 'forgot stay, stay, stay' }, explain: `27 ordered sequences. {up, down, stay} has 6 orders, {stay, stay, stay} has 1: ${BACK} of 27.` },
      principle: { type: 'choice', q: 'Which idea carried over from dice to the moving quote?', options: ['Weight each combination by its number of orders', 'Each combination of results is one equal outcome', 'Every total (sum or end point) is equally likely', 'Count only the combinations with all results different'], answer: 0, traps: { 1: 'combinations are not equally likely: 6 orders against 1', 2: 'totals are made by different numbers of sequences', 3: 'pairs and triples of equal results count too, with fewer orders' }, explain: 'Ordered sequences are the equally likely atoms; a combination is worth as many atoms as it has orders (6, 3 or 1).' },
    },

    S('tryit'),
    { type: 'tryit', family: 'three-dice', section: 'bto', count: 3 },
  ],
};
