// Reference study lesson. Every family lesson copies this shape:
// 12 sections in order, >= 3 diagrams, 2 live worked examples, micro-checks after every
// teaching unit (each derivation step carries its own), traps, speed, rule, contrast, try-it.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
const ways = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const frac = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a || 1; }
const SUMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const gridFor = (pred) => ({
  rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die',
  cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => r + c + 2)),
  highlight: Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6), i % 6]).filter(([r, c]) => pred(r + c + 2)),
});

export default {
  id: 'bto/two-dice-sum',
  book: 'bto',
  kind: 'family',
  family: 'two-dice-sum',
  title: 'Two dice: sum events',
  summary: 'Count ordered pairs (36 of them), never sums (11) or unordered pairs (21).',
  prerequisites: ['prob/sample-spaces'],
  objectives: [
    'Recognise a two-dice sum question in under five seconds',
    'Count the ordered pairs for any sum with ways(s) = 6 − |s − 7|',
    'Answer single sums, sets, thresholds and parity questions exactly, in under 30 seconds',
    'Spot the two classic wrong answers (1/11 per sum, dividing by 21) and say why they are wrong',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw two fair dice. What is the probability that the sum is 9? Find two different ways to get there.', answer: `${ways(9)}/36 = ${frac(ways(9), 36)}`, explain: `Pairs (3,6), (4,5), (5,4), (6,3): ${ways(9)} of the 36 ordered outcomes. If you got 1/11 or 2/21, keep that attempt in mind: the lesson shows exactly which belief produced it.` },
    { type: 'text', text: 'Two fair six-sided dice are thrown and the question is about their **sum**: a single value ("exactly 8"), a small set ("11 or 12"), a threshold ("at least 10", "at most 4") or a property ("odd", "divisible by 3").' },
    { type: 'list', items: ['"You throw two dice. What is the probability that the sum is 11 or 12?"', '"Two dice are rolled. Probability the total is at least 9?"', '"What is the chance the sum of two dice is a multiple of 4?"'] },
    { type: 'text', text: 'Not this lesson: questions about the **maximum**, **doubles**, or one die beating another. Those use the same grid but count different cells.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Two dice: probability the larger face is 5', 'Two dice: probability the total is 10 or more', 'Two dice: probability both show the same face', 'One die thrown twice: probability the second is higher'], answer: 1, traps: { 0: 'a maximum question: same grid, different cells', 2: 'a doubles question', 3: 'a comparison question' }, explain: 'Only the second asks about the **sum** of the two faces.' },
    ] },

    S('why'),
    { type: 'text', text: 'Most dice questions are counting questions in disguise. Counting the right outcomes is the whole game, and the classic trap is counting the wrong kind of outcome. Get this pattern automatic and a whole block of Beat the Odds questions becomes a 20-second job.' },

    S('anchor'),
    { type: 'text', text: 'You already know one die: 6 faces, each equally likely, so P(event) = favourable faces / 6. Two dice are the same idea with **one change**: an outcome is now an ordered pair (first die, second die), and there are 6 × 6 = **36** of them, all equally likely.' },
    { type: 'check', scope: 'one die: favourable / 6', questions: [
      { make: (rng) => { const k = rng.int(3, 5); const fav = 7 - k; return { type: 'choice', q: `One fair die. What is P(face ≥ ${k})?`, options: [frac(fav, 6), frac(fav, 5), frac(fav - 1, 6), frac(6 - fav, 6)].filter((v, i, a) => a.indexOf(v) === i), answer: 0, traps: { 1: 'divided by 5: there are 6 faces', 2: `forgot that ${k} itself counts ("at least" includes it)`, 3: 'answered the complement' }, explain: `Faces ${k} to 6 qualify: ${fav} of 6 equally likely faces, so ${frac(fav, 6)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the 36 outcomes as a 6 × 6 grid: rows are the first die, columns the second, each cell holds the sum. The highlighted cells below are the 6 ways to make 7; they lie on one diagonal, because every sum lives on its own anti-diagonal.' },
    { type: 'diagram', diagram: 'grid', spec: { ...gridFor((s) => s === 7), count: 6 }, caption: 'The 36 ordered outcomes. Sum 7 is the longest diagonal: 6 cells.' },
    { type: 'check', scope: 'reading the grid', questions: [
      { make: (rng) => { const r = rng.int(1, 6), c = rng.int(1, 6); return { type: 'number', q: `In the grid, which sum sits in row ${r} (first die) and column ${c} (second die)?`, answer: r + c, explain: `The cell holds first + second = ${r} + ${c} = ${r + c}.` }; } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Ordered pairs per sum', xLabel: 'sum', yLabel: 'pairs', categories: SUMS.map(String), series: [{ name: 'pairs', values: SUMS.map(ways) }], valueLabels: true }, caption: 'Counting the diagonals gives a tent: 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1. The count is 6 − |sum − 7|.' },
    { type: 'check', scope: 'the tent of counts', questions: [
      { type: 'number', q: 'In the grid, how many cells have sum 8?', answer: ways(8), explain: `Sum 8 is the diagonal next to 7: 6 − |8 − 7| = ${ways(8)} cells.` },
      { type: 'choice', q: 'Which two sums are equally likely?', options: ['4 and 10', '4 and 8', '6 and 9', '2 and 7'], answer: 0, traps: { 1: '8 is 1 away from 7 (5 pairs) but 4 is 3 away (3 pairs)', 2: '6 is 1 away from 7 (5 pairs), 9 is 2 away (4 pairs)', 3: '2 has 1 pair, 7 has 6' }, explain: 'The tent is symmetric about 7: sums 7 − k and 7 + k have the same count. 4 and 10 are both 3 away (3 pairs each).' },
    ] },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: [{ p: '1/6', label: 'first 6', children: [{ p: '1/6', label: 'second 6 → sum 12', mark: true }, { p: '5/6', label: 'second not 6' }] }, { p: '5/6', label: 'first not 6' }] }, total: '1/36' }, caption: 'The same count as a tree: sum 12 needs 6 then 6, one path of probability 1/6 × 1/6 = 1/36. The grid is faster for sums; trees shine when order or stopping matters.' },
    { type: 'check', scope: 'the tree for one path', questions: [
      { type: 'choice', q: 'On the tree, what is the probability of the path "first 6, then second not 6"?', options: ['5/36', '1/6', '5/6', '6/36'], answer: 0, traps: { 1: 'read only the first branch and forgot to multiply by the second', 2: 'read only the second branch', 3: 'added the path to its sibling instead of multiplying along it' }, explain: 'Multiply along the path: 1/6 × 5/6 = 5/36.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Write every outcome as an ordered pair (first, second). There are 6 × 6 = 36, all equally likely.', why: '(1,2) and (2,1) are physically different rolls (paint one die red). Merging them would make doubles look as likely as mixed pairs, which they are not.',
        checks: [
          { type: 'choice', q: 'A red and a blue die are thrown. Which is true?', options: ['(red 2, blue 5) and (red 5, blue 2) are different outcomes', 'They are the same outcome', 'It depends on the colours'], answer: 0, traps: { 1: 'unordered counting: leads to 21 outcomes that are not equally likely' }, explain: 'Different rolls, different outcomes. Colour just makes the order visible; plain dice behave the same.' },
          { type: 'number', q: 'How many equally likely outcomes are there for two dice?', answer: 36, explain: '6 choices for the first die times 6 for the second.' },
        ] },
      { say: 'Count the pairs for each sum s: ways(s) = 6 − |s − 7| for s from 2 to 12.', why: 'For sum s, the first die can be any face that leaves a legal second face (1 to 6). There are 6 such faces at s = 7 and one fewer for each step away from 7.',
        checks: [
          { make: (rng) => { const s = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]); return { type: 'number', q: `How many ordered pairs give sum ${s}?`, answer: ways(s), explain: `6 − |${s} − 7| = ${ways(s)}.` }; } },
        ] },
      { say: 'Add the counts of every sum in the event, then divide by 36.', why: 'Different sums are disjoint events, so their counts add; equally likely outcomes turn a count into a probability.',
        checks: [
          { make: (rng) => { const s = rng.int(3, 10); const n = ways(s) + ways(s + 1); const opts = [frac(n, 36), frac(2, 11), frac(n, 21), frac(36 - n, 36)].filter((v, i, a) => a.indexOf(v) === i); return { type: 'choice', q: `P(sum is ${s} or ${s + 1})?`, options: opts, answer: 0, traps: { 1: 'treated the 11 sums as equally likely', 2: 'counted unordered pairs (21)', 3: 'answered the complement' }, explain: `${ways(s)} + ${ways(s + 1)} = ${n} pairs out of 36: ${frac(n, 36)}.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why must (2,5) and (5,2) be counted as two outcomes, and what goes wrong if you count them once?', model: 'The dice are two different objects, so (2,5) and (5,2) are different rolls. Counting ordered pairs keeps all 36 outcomes equally likely. Merged, a double like (3,3) and a mixed pair like {2,5} would be treated as equally likely, but the mixed pair happens two ways and the double one way.', points: ['Two dice are distinguishable objects, so order is real', 'Ordered pairs are equally likely (1/36 each)', 'Unordered pairs are not equally likely: doubles happen one way, mixed pairs two ways'] },

    S('worked'),
    { type: 'worked', family: 'two-dice-sum', difficulty: 1, seed: 'a', intro: 'A single sum or a pair of sums. Try it before opening the solution.' },
    { type: 'worked', family: 'two-dice-sum', difficulty: 2, seed: 'b', fade: 1, intro: 'A threshold or a property. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Without computing: is P(sum = 7) bigger or smaller than P(sum is 2 or 12)? By what factor?', answer: 'Bigger, three times: 6/36 against 1/36 + 1/36 = 2/36.', explain: 'The centre of the tent has 6 pairs; each end has 1.' },

    S('traps'),
    { type: 'traps', family: 'two-dice-sum', extra: [
      { belief: 'Every sum from 2 to 12 is equally likely (P = 1/11 each).', fix: 'Sums are made by different numbers of pairs: 7 by six, 2 by one.' },
      { belief: 'There are 21 outcomes: {1,2} is the same as {2,1}.', fix: 'The 21 unordered pairs are not equally likely: a double like {3,3} happens one way, a mixed pair like {1,2} two ways.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(sum ≥ 10) for two dice. One step is wrong.', steps: [
      'There are 36 equally likely ordered pairs.',
      'The qualifying sums are 10, 11 and 12.',
      'Sum 10 has 3 pairs, sum 11 has 1 pair ({5,6}), sum 12 has 1 pair.',
      'So 5 pairs qualify: P = 5/36.',
    ], errorStep: 2, explain: `Sum 11 has **two** ordered pairs, (5,6) and (6,5): the unordered-pair trap in one step. Correct count ${ways(10)} + ${ways(11)} + ${ways(12)} = ${ways(10) + ways(11) + ways(12)}, so P = ${frac(ways(10) + ways(11) + ways(12), 36)}.` },
    { type: 'check', scope: 'the two named traps', questions: [
      { type: 'choice', q: 'A candidate answers P(sum = 2) = 1/11. Which belief produced that?', options: ['All 11 sums are equally likely', 'Unordered pairs are equally likely', 'They took the complement', 'They used one die'], answer: 0, explain: '1/11 = one sum out of 11 possible sums: the equal-sums belief. The right answer is 1/36.' },
      { type: 'choice', q: 'Another answers P(sum = 7) = 3/21. Which belief?', options: ['Unordered pairs as equally likely outcomes', 'Equally likely sums', 'Forgetting the double (3,4)'], answer: 0, explain: 'Three unordered pairs {1,6}, {2,5}, {3,4} over 21 unordered pairs. With order: 6/36.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Use the **mirror**: ways(7 + k) = ways(7 − k). "At least 10" has the same count as "at most 4": 3 + 2 + 1 = 6. And for thresholds near the ends, count the short side: P(sum ≤ 10) = 1 − P(11 or 12) = 1 − 3/36.' },
    { type: 'callout', tone: 'speed', text: 'Memorise the partial sums from the top: sum 12 → 1, ≥ 11 → 3, ≥ 10 → 6, ≥ 9 → 10, ≥ 8 → 15. They are the triangular numbers 1, 3, 6, 10, 15.' },
    { type: 'check', scope: 'mirror and triangular numbers', questions: [
      { make: (rng) => { const k = rng.int(8, 11); const n = SUMS.filter((s) => s >= k).reduce((a, s) => a + ways(s), 0); return { type: 'number', q: `How many ordered pairs give a sum of at least ${k}? (Use the triangular numbers.)`, answer: n, explain: `From the top: ${SUMS.filter((s) => s >= k).map(ways).reverse().join(' + ')} = ${n}.` }; } },
      { make: (rng) => { const k = rng.int(3, 5); const n = SUMS.filter((s) => s <= k).reduce((a, s) => a + ways(s), 0); return { type: 'choice', q: `P(sum ≤ ${k}) equals which of these?`, options: [`P(sum ≥ ${14 - k})`, `P(sum ≥ ${13 - k})`, `P(sum ≤ ${k + 1})`], answer: 0, explain: `Mirror about 7: ≤ ${k} pairs with ≥ ${14 - k}; both are ${n} pairs.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Two dice → 36 ordered pairs; ways(s) = 6 − |s − 7|; add the ways, divide by 36.' },

    S('contrast'),
    { type: 'compare', columns: ['Situation', 'Equally likely outcomes', 'Example'], rows: [
      ['One die', '6 faces', 'P(≥ 5) = 2/6'],
      ['Two dice, sum', '36 ordered pairs', 'P(sum 7) = 6/36'],
      ['Two dice, unordered view', '21 pairs, **not** equally likely', 'do not divide by 21'],
      ['Three dice, sum', '216 ordered triples', 'P(sum 3) = 1/216'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: P(sum = 1) = 0 and P(2 ≤ sum ≤ 12) = 1. Parity is a coin flip: exactly half the cells, 18, are odd.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: whenever outcomes look unequal, find the **equally likely atoms** first and count them. Likelihood List tables (each row is an atom), card questions (each ordered card is an atom) and the maximum of two dice all use the same grid; only the highlighted cells change.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Two dice. P(sum is even)?', options: ['1/2', '6/11', '11/21', '5/9'], answer: 0, traps: { 1: '6 even sums out of 11 sums: equal-sums belief' }, explain: '18 of the 36 cells are even: 1/2 exactly.' },
      { type: 'number', q: 'Three dice: how many equally likely ordered outcomes?', answer: 216, explain: '6 × 6 × 6 = 216.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'two-dice-sum', count: 3 },
  ],
};
