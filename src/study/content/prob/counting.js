// Probability foundations 2: counting. Multiplication principle, arrangements, ordered and
// unordered selections. Every count shown is computed here.
import { sec, frac, show, fact, nPr, nCr, mc } from './sample-spaces.js';

const LET = ['A', 'B', 'C', 'D'];
const pairs4 = [];
for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs4.push([LET[i], LET[j]]);

const orderedPickQ = (rng) => {
  const n = rng.int(6, 12), roles = rng.pick([['president', 'secretary'], ['president', 'secretary', 'treasurer']]);
  const k = roles.length, ans = nPr(n, k);
  return { type: 'number', q: `A club has ${n} members. In how many ways can a ${roles.join(', a ')} be chosen (one person per role)?`, answer: ans,
    hints: ['Does swapping two people between roles give a different result?', `Fill the roles one at a time: ${n} choices, then one fewer.`],
    explain: `Order matters (roles differ), no repeats: ${Array.from({ length: k }, (_, i) => n - i).join(' × ')} = ${ans}.` };
};
const chooseQ = (rng) => {
  const n = rng.int(5, 11), k = rng.int(2, 3), ans = nCr(n, k);
  return { type: 'number', q: `How many different groups of ${k} can be chosen from ${n} people?`, answer: ans,
    hints: [`First count ordered picks: ${n} × ${n - 1}${k === 3 ? ` × ${n - 2}` : ''}.`, `Each group was counted ${k}! = ${fact(k)} times.`],
    explain: `C(${n}, ${k}) = ${nPr(n, k)} / ${fact(k)} = ${ans}.` };
};
const bothRedQ = (rng) => {
  const n = rng.int(8, 14), r = rng.int(3, n - 3), fo = r * (r - 1), to = n * (n - 1);
  return mc({ q: `A pile has ${n} cards, ${r} of them red. Two cards are drawn without putting the first back. What is P(both red)?`, right: frac(fo, to),
    wrong: [[frac(r * r, n * n), 'put the first card back: the second draw has one red card fewer'], [frac(nCr(r, 2), to), 'mixed conventions: unordered favourable over ordered total'], [frac(r * (r - 1), n * n), 'shrank the red count but not the pile'], [frac(r, n), 'stopped after the first card']],
    explain: `Ordered: favourable ${r} × ${r - 1} = ${fo}, total ${n} × ${n - 1} = ${to}, so ${show(fo, to)}. Unordered gives the same: C(${r}, 2) / C(${n}, 2) = ${nCr(r, 2)}/${nCr(n, 2)}.` }, rng);
};

const aceO = 4 * 3, deckO = 52 * 51;

export default {
  id: 'prob/counting',
  book: 'prob',
  kind: 'foundation',
  title: 'Counting: multiply, arrange, choose',
  summary: 'Stages multiply; order matters means n × (n − 1) × …; order does not matter means divide by k!.',
  prerequisites: ['prob/sample-spaces'],
  objectives: [
    'Count multi-stage outcomes with the multiplication principle',
    'Count arrangements with n! and ordered picks with n × (n − 1) × … (k factors)',
    'Count unordered groups with C(n, k) = ordered picks / k!',
    'Decide in five seconds whether order matters, and use the same convention for favourable and total',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: from 7 people, how many different committees of 3 can be formed? And how many ways are there to pick a president, a secretary and a treasurer from the same 7? Two approaches, then both answers.', answer: `${nCr(7, 3)} committees; ${nPr(7, 3)} ways to fill the three roles`, explain: `Roles first: 7 × 6 × 5 = ${nPr(7, 3)}. A committee has no roles, and each committee of 3 was counted once per way of assigning the roles, 3! = 6 times: ${nPr(7, 3)} / 6 = ${nCr(7, 3)}.` },
    { type: 'text', text: 'Counting questions ask "how many ways", or hide a count inside a probability: favourable hands over all hands. Three questions pick the method: are there **stages**, does **order** matter, can items **repeat**?' },
    { type: 'list', items: ['"How many 4-digit codes…" (order matters, repeats allowed)', '"How many ways to award gold, silver and bronze…" (order matters, no repeats)', '"How many 5-card hands…" or "committees of 3…" (order does not matter)'] },
    { type: 'check', scope: 'order matters or not', questions: [
      mc({ q: 'In which of these does the order of the chosen items matter?', right: 'a 4-digit PIN code', at: 1,
        wrong: [['a 5-card poker hand', 'a hand is the same set of cards whatever order they were dealt in'], ['a team of 3 chosen from 10 people', 'a team has no first or second member'], ['2 balls grabbed from a bag at once', 'grabbed together, there is no first ball']],
        explain: '1234 and 4321 are different codes. The others are sets: reordering gives the same hand, team or pair.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Every card and urn question is a ratio of two counts. Listing by hand stops working past about 20 outcomes; these three tools count millions in one line.' },

    sec('anchor'),
    { type: 'text', text: 'You already count two dice with a grid: 6 rows × 6 columns = 36. The **multiplication principle** is that grid with any number of stages: if stage 1 has a choices and, whatever happened, stage 2 has b choices, there are a × b outcomes. A third stage with c choices makes a × b × c.' },
    { type: 'formula', text: 'k stages with n_{1}, n_{2}, …, n_{k} choices → n_{1} × n_{2} × … × n_{k} outcomes' },
    { type: 'check', scope: 'multiplication principle', questions: [
      { make: (rng) => { const a = rng.int(3, 6), b = rng.int(4, 8), c = rng.int(2, 5); return { type: 'number', q: `A menu has ${a} starters, ${b} mains and ${c} desserts. How many different three-course meals are there?`, answer: a * b * c, hints: ['Picture one grid of starters × mains, then repeat it for each dessert.', 'Multiply the three numbers.'], explain: `${a} × ${b} × ${c} = ${a * b * c}.` }; } },
      { type: 'number', q: 'A PIN has 4 digits, each 0 to 9, repeats allowed. How many PINs are there?', answer: 10 ** 4, hints: ['Four stages.', 'Each stage has 10 choices whatever came before.'], explain: `10 × 10 × 10 × 10 = ${10 ** 4}.` },
    ] },

    sec('picture'),
    { type: 'text', text: 'Arranging the letters A, B, C is three stages: 3 choices for the first place, then 2, then 1. As a tree: 3 × 2 × 1 = 6 leaves, one per arrangement.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: ['A', 'B', 'C'].map((x) => ({ p: '1/3', label: x, children: ['A', 'B', 'C'].filter((y) => y !== x).map((y) => ({ p: '1/2', label: x + y, children: [{ p: '1', label: x + y + ['A', 'B', 'C'].find((z) => z !== x && z !== y), mark: x === 'A' && y === 'B' }] })) })) }, total: frac(1, 6) }, caption: 'Each leaf is one arrangement: 3 branches, then 2, then 1. For a random order all 6 leaves are equally likely, so the marked leaf ABC has chance 1/6.' },
    { type: 'check', scope: 'the arrangement tree', questions: [
      { type: 'number', q: 'How many leaves would the tree have for the 4 letters A, B, C, D?', answer: fact(4), hints: ['One more stage at the front.', '4 choices, then 3, then 2, then 1.'], explain: `4 × 3 × 2 × 1 = ${fact(4)}.` },
      mc({ q: 'The letters A, B, C, D are put in a random order. What is P(the order starts with A)?', right: frac(fact(3), fact(4)), at: 2,
        wrong: [[frac(1, fact(4)), 'counted only the arrangement ABCD'], [frac(1, 3), 'used 3 remaining letters as the total'], [frac(3, 4), 'answered P(not starting with A)']],
        explain: `A first, then the other 3 in any order: ${fact(3)} of ${fact(4)} arrangements, so ${frac(fact(3), fact(4))}.` }),
    ] },

    sec('perm', 'Arrangements and ordered picks'),
    { type: 'text', text: 'All n objects in a row: n × (n − 1) × … × 1 ways, written **n!** ("n factorial"). Only k of the n places filled, with order mattering (gold, silver, bronze): stop after k factors.' },
    { type: 'formula', text: 'n! = n × (n − 1) × … × 1        ordered picks of k from n = n × (n − 1) × … × (n − k + 1)' },
    { type: 'check', scope: 'n! and ordered picks', questions: [
      { make: (rng) => { const n = rng.int(6, 12); return { type: 'number', q: `${n} runners race. In how many ways can gold, silver and bronze be awarded?`, answer: nPr(n, 3), hints: ['Three places, each a different runner.', `${n} choices for gold, then ${n - 1}, then ${n - 2}.`], explain: `${n} × ${n - 1} × ${n - 2} = ${nPr(n, 3)}.` }; } },
      { make: (rng) => { const k = rng.int(4, 6); return { type: 'number', q: `In how many orders can ${k} different books stand on a shelf?`, answer: fact(k), hints: [`${k}! = ${k} × ${k - 1} × … × 1.`], explain: `${k}! = ${fact(k)}.` }; } },
    ] },

    sec('comb', 'Unordered picks: n choose k'),
    { type: 'text', text: 'A committee has no first member. Each committee of k people appears k! times among the ordered picks (once per way of lining them up), so divide: C(n, k) = ordered picks / k!. Read C(n, k) as "n choose k".' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Group of 2', 'Ordered picks that give it'], rows: pairs4.map(([x, y]) => [`{${x}, ${y}}`, `${x}${y}, ${y}${x}`]), align: ['left', 'left'] }, caption: `Pick 2 of A, B, C, D. There are 4 × 3 = ${nPr(4, 2)} ordered picks, and each group appears 2! = 2 times, so C(4, 2) = ${nPr(4, 2)} / 2 = ${nCr(4, 2)} groups.` },
    { type: 'formula', text: 'C(n, k) = n × (n − 1) × … × (n − k + 1) / k!' },
    { type: 'check', scope: 'n choose k', questions: [{ make: chooseQ }] },

    sec('derivation'),
    { type: 'text', text: 'Two cards are drawn from a 52-card deck. P(both aces), counted two ways.' },
    { type: 'steps', steps: [
      { say: `Ordered total: the first card is any of 52, the second any of the 51 left: 52 × 51 = ${deckO} ordered draws.`, why: 'Two stages, and the second stage has 51 choices whatever the first card was.',
        checks: [{ make: (rng) => { const n = rng.int(10, 30); return { type: 'number', q: `How many ordered draws of 2 cards are there from a pile of ${n}?`, answer: n * (n - 1), hints: ['Two stages; the second card cannot be the first.'], explain: `${n} × ${n - 1} = ${n * (n - 1)}.` }; } }] },
      { say: `Ordered favourable: the first ace is any of 4, the second any of the 3 left: 4 × 3 = ${aceO}.`, why: 'The same principle, restricted to aces.',
        checks: [{ make: (rng) => { const r = rng.int(3, 8); return { type: 'number', q: `A pile holds ${r} red cards. How many ordered ways are there to draw 2 red cards?`, answer: r * (r - 1), explain: `${r} × ${r - 1} = ${r * (r - 1)}.` }; } }] },
      { say: `P = ${aceO} / ${deckO} = ${frac(aceO, deckO)}.`, why: 'Favourable over total, both ordered, over equally likely ordered draws.',
        checks: [mc({ q: 'Two cards from a 52-card deck. What is P(both hearts)?', right: frac(13 * 12, deckO), at: 1,
          wrong: [[frac(1, 16), 'as if the first card went back: 13/52 twice'], [frac(nCr(13, 2), deckO), 'mixed: unordered favourable over ordered total'], [frac(13 * 12, 52 * 52), 'shrank the hearts but not the deck']],
          explain: `Ordered: 13 × 12 = ${13 * 12} over ${deckO}, so ${frac(13 * 12, deckO)}.` })] },
      { say: `Unordered: C(4, 2) / C(52, 2) = ${nCr(4, 2)} / ${nCr(52, 2)} = ${frac(nCr(4, 2), nCr(52, 2))} again.`, why: 'Both counts were divided by 2! = 2, and the factor cancels. Order was never the problem; mixing conventions is.',
        checks: [{ type: 'number', q: 'C(52, 2) = ?', answer: nCr(52, 2), hints: ['Ordered pairs first: 52 × 51.', 'Divide by 2! = 2.'], explain: `52 × 51 / 2 = ${nCr(52, 2)}.` }] },
    ] },
    { type: 'explain', prompt: 'Why do the ordered and unordered counts give the same probability, and when do they not?', model: 'Each unordered pair of cards matches exactly 2! ordered draws, in the favourable count and in the total, so the factor cancels in the ratio. The answer goes wrong only when one count is ordered and the other unordered.', points: ['Each hand of k cards matches k! ordered draws', 'The k! appears top and bottom and cancels', 'Mixing an ordered count with an unordered one is the error'] },

    sec('predict'),
    { type: 'predict', question: 'From 10 people: are there more committees of 3, or more committees of 7?', answer: `The same: C(10, 3) = C(10, 7) = ${nCr(10, 3)}.`, explain: 'Choosing the 3 who are in is the same as choosing the 7 who are out.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Stages add: 3 starters and 4 mains make 7 meals.', fix: 'Every starter pairs with every main: a grid, 3 × 4 = 12.' },
      { belief: 'Divide by k! even when order matters (medals, codes, roles).', fix: 'Divide only when reordering the picks gives the same result.' },
      { belief: 'A hand or committee can be counted with n × (n − 1) × ….', fix: 'That counts each group k! times; divide by k!.' },
      { belief: 'With repeats allowed, still count n × (n − 1) × ….', fix: 'Repeats allowed means every stage keeps all n choices: n^{k}.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(two cards from a deck are both hearts). One step is wrong.', steps: [
      `Favourable: choose 2 of the 13 hearts, C(13, 2) = ${nCr(13, 2)}.`,
      `Total: 52 × 51 = ${deckO} possible 2-card draws.`,
      `P = ${nCr(13, 2)} / ${deckO}.`,
      `So P = ${frac(nCr(13, 2), deckO)}.`,
    ], errorStep: 1, explain: `Step 2 counts ordered draws while step 1 counted unordered hands. Use C(52, 2) = ${nCr(52, 2)}: P = ${nCr(13, 2)}/${nCr(52, 2)} = ${frac(nCr(13, 2), nCr(52, 2))}.` },
    { type: 'check', scope: 'the mixing trap', questions: [
      mc({ q: 'A candidate counts favourable 2-card hands with C(·, 2) but counts the total as ordered draws. Compared with the true probability, their answer is:', right: 'half the true value', at: 2,
        wrong: [['twice the true value', 'the ordered total is the bigger number, so the ratio shrinks'], ['exactly right', 'the 2! cancels only if it is on both sides'], ['off by a factor 52', 'the mismatch is the 2! = 2 orders of each hand, not the deck size']],
        explain: 'The total is 2 times too big (each hand counted in 2 orders) while the favourable count is not: the answer is halved.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `C(n, k) = C(n, n − k): always compute with the smaller k. C(12, 10) = C(12, 2) = 12 × 11 / 2 = ${nCr(12, 2)}.` },
    { type: 'callout', tone: 'speed', text: `Cancel before multiplying: C(10, 3) = 10 × 9 × 8 / 6, and 6 divides 9 × 8 first, so 10 × 12 = ${nCr(10, 3)}. Know by heart: C(52, 2) = ${nCr(52, 2)}, and C(n, 2) = n(n − 1)/2.` },
    { type: 'check', scope: 'smaller k and cancelling', questions: [
      { make: (rng) => { const n = rng.int(8, 16), k = rng.int(1, 3); return { type: 'number', q: `C(${n}, ${n - k}) = ?`, answer: nCr(n, k), hints: [`C(${n}, ${n - k}) = C(${n}, ${k}).`, `${Array.from({ length: k }, (_, i) => n - i).join(' × ')} / ${k}!.`], explain: `C(${n}, ${n - k}) = C(${n}, ${k}) = ${nCr(n, k)}.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Stages → multiply. Order matters → n × (n − 1) × … (k factors); repeats allowed → n^{k}. Order does not matter → divide the ordered count by k!. Same convention top and bottom.' },

    sec('contrast'),
    { type: 'compare', columns: ['Situation', 'Order matters?', 'Repeats?', 'Count'], rows: [
      ['4-digit PIN', 'yes', 'yes', `10^{4} = ${10 ** 4}`],
      ['Gold, silver, bronze among 8 runners', 'yes', 'no', `8 × 7 × 6 = ${nPr(8, 3)}`],
      ['Committee of 3 from 8', 'no', 'no', `C(8, 3) = ${nCr(8, 3)}`],
      ['Arranging 5 different books', 'yes', 'no', `5! = ${fact(5)}`],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: 0! = 1 (one way to arrange nothing), so C(n, 0) = C(n, n) = 1 and C(n, 1) = n. Choosing more than you have is impossible: C(3, 5) = 0.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: card-hand and urn questions in Beat the Odds, the Intervals combinatorics estimates, and the draws without replacement later in this book. Each is a ratio of two counts built with these three tools.' },
    { type: 'check', scope: 'the contrast table', questions: [
      { hinge: true, make: (rng) => { const k = rng.int(2, 3); return mc({ q: `A code has ${k} letters from A to Z, repeats allowed. How many codes are there?`, right: String(26 ** k),
        wrong: [[String(nPr(26, k)), 'that count forbids repeats'], [String(nCr(26, k)), 'a code has an order, and C(26, k) also forbids repeats'], [String(26 * k), 'added the stages instead of multiplying']],
        explain: `${k} stages, 26 choices each: 26^{${k}} = ${26 ** k}.` }, rng); } },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: orderedPickQ }, { make: chooseQ }, { make: bothRedQ }] },
  ],
};
