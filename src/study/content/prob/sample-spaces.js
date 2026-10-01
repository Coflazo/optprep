// Probability foundations 1: sample spaces and equally likely outcomes.
// This file also exports the small helpers every prob lesson shares (section headers,
// exact fractions, counting, a choice-question builder, the normal CDF), so each number
// shown in the book is computed, never typed.
import { SECTION_TITLES } from '../../schema.js';

export const sec = (key, title) => ({ type: 'section', key, title: title ?? SECTION_TITLES[key] });
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
export const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
export const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
export const nPr = (n, r) => { let p = 1; for (let i = 0; i < r; i++) p *= n - i; return p; };
export const nCr = (n, r) => { if (r < 0 || r > n) return 0; const k = Math.min(r, n - r); let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); };
export const round = (x, dp = 3) => Math.round(x * 10 ** dp) / 10 ** dp;
export const dec = (x, dp = 3) => String(round(x, dp));
export const pct = (x, dp = 1) => `${round(x * 100, dp)}%`;
// 'n/d = reduced', or just 'n/d' when it is already in lowest terms.
export const show = (n, d) => { const r = frac(n, d); return r === `${n}/${d}` ? r : `${n}/${d} = ${r}`; };
export const ord = (n) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
export const uniq = (xs) => xs.filter((v, i, a) => a.indexOf(v) === i);

// Choice question: the right option plus wrong options [value, false belief]. Duplicates are
// dropped; with an rng the right answer lands in a random slot, otherwise at `at`.
export function mc({ q, right, wrong = [], explain, hints, at = 0 }, rng) {
  const seen = new Set([String(right)]);
  const opts = [];
  for (const w of wrong) {
    const [v, trap] = Array.isArray(w) ? w : [w];
    const f = /^(\d+)\/(\d+)$/.exec(String(v));
    if (seen.has(String(v)) || opts.length >= 5 || (f && +f[1] > +f[2])) continue; // never offer a probability above 1
    seen.add(String(v)); opts.push({ v: String(v), trap });
  }
  const pos = rng ? rng.int(0, opts.length) : Math.min(at, opts.length);
  opts.splice(pos, 0, { v: String(right) });
  const out = { type: 'choice', q, options: opts.map((o) => o.v), answer: pos, explain };
  const traps = {};
  opts.forEach((o, i) => { if (o.trap) traps[i] = o.trap; });
  if (Object.keys(traps).length) out.traps = traps;
  if (hints) out.hints = hints;
  return out;
}

// Standard normal CDF (Abramowitz and Stegun 7.1.26, error below 1.5e-7).
export function Phi(z) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

// Two dice as a 6 x 6 grid of ordered pairs.
export const diceCells = (pred) => { const out = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (pred(r + 1, c + 1)) out.push([r, c]); return out; };
export const diceGrid = (pred, text = (a, b) => a + b) => {
  const highlight = diceCells(pred);
  return { rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => text(r + 1, c + 1))), highlight, count: highlight.length };
};
const nWays = (pred) => diceCells(pred).length;

const PROPS = [
  { name: 'even', f: (x) => x % 2 === 0 }, { name: 'odd', f: (x) => x % 2 === 1 },
  { name: 'a prime (2, 3 or 5)', f: (x) => [2, 3, 5].includes(x) }, { name: 'a multiple of 3', f: (x) => x % 3 === 0 },
  { name: 'at least 5', f: (x) => x >= 5 }, { name: 'at most 2', f: (x) => x <= 2 }, { name: 'at least 4', f: (x) => x >= 4 },
];
const favFaces = (p) => [1, 2, 3, 4, 5, 6].filter(p.f).length;
const coinDieQ = (rng) => {
  const p = rng.pick(PROPS), side = rng.pick(['heads', 'tails']), fav = favFaces(p);
  return mc({ q: `A fair coin is tossed and a fair die is thrown. What is P(${side} and the die shows ${p.name})?`, right: frac(fav, 12),
    wrong: [[frac(fav, 6), 'used the 6 die faces as the total: the coin doubles the outcomes'], [frac(fav, 8), 'added 2 + 6 outcomes instead of multiplying them in a grid'], [frac(fav + 1, 12), 'counted one cell too many'], [frac(12 - fav, 12), 'counted the cells outside the event']],
    explain: `The grid has 2 × 6 = 12 equally likely cells. The ${side} row has ${fav} faces that are ${p.name}: ${show(fav, 12)}.` }, rng);
};
const maxQ = (rng) => {
  const kind = rng.pick(['larger', 'smaller']), m = rng.int(2, 5);
  const n = kind === 'larger' ? nWays((a, b) => Math.max(a, b) === m) : nWays((a, b) => Math.min(a, b) === m);
  return mc({ q: `Two fair dice are thrown. What is P(the ${kind} face is ${m})?`, right: frac(n, 36),
    wrong: [[frac(1, 6), `treated the 6 values of the ${kind} face as equally likely`], [frac(n + 1, 36), `counted (${m}, ${m}) twice`], [frac(n, 21), 'divided by the 21 unordered pairs, which are not equally likely'], [frac((n + 1) / 2, 36), 'counted only one arm of the L-shape']],
    explain: `Mark the cells: an L-shape of ${n} ordered pairs (the double (${m}, ${m}) once), so ${show(n, 36)}.` }, rng);
};
const headsQ = (rng) => {
  const k = rng.int(0, 3), n = nCr(3, k);
  return mc({ q: `Three fair coins are tossed. What is P(exactly ${k} head${k === 1 ? '' : 's'})?`, right: frac(n, 8),
    wrong: [[frac(1, 4), 'treated the four head counts 0, 1, 2, 3 as equally likely'], [frac(1, 8), 'counted one sequence only, ignoring the order of heads and tails'], [frac(n, 6), 'listed 6 sequences instead of 8']],
    explain: `List the 8 sequences HHH, HHT, …, TTT. Exactly ${k} head${k === 1 ? '' : 's'}: ${n} of them, so ${show(n, 8)}.` }, rng);
};

const hands = [['A', 'B'], ['A', 'C'], ['B', 'C']];
const sum8 = nWays((a, b) => a + b === 8), odd2 = nWays((a, b) => a % 2 && b % 2), doubles = nWays((a, b) => a === b);
const max4 = nWays((a, b) => Math.max(a, b) === 4);
const bigger = nWays((a, b) => a > b);
const twoHeads3 = nCr(3, 2), allSame3 = 2;

export default {
  id: 'prob/sample-spaces',
  book: 'prob',
  kind: 'foundation',
  title: 'Sample spaces and equally likely outcomes',
  summary: 'Favourable over total works only over equally likely outcomes: build that list first.',
  objectives: [
    'Write down the sample space of a coin, die or card experiment and say whether its outcomes are equally likely',
    'Compute P = favourable / total for coins, dice and small card sets in under 30 seconds',
    'Choose ordered or unordered outcomes and count favourable and total the same way',
    'Name the trap behind 1/3 for "one head, one tail" and fix it',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: two fair coins are tossed. What is the probability of one head and one tail? Find two different ways to get there.', answer: frac(2, 4), explain: 'List what each coin does: HH, HT, TH, TT. Four equally likely results, and two of them (HT, TH) have one of each: 2/4 = 1/2. If you got 1/3, you listed "two heads, two tails, one of each" and treated those three as equally likely. This lesson is about exactly that trap.',
      attempts: [
        { id: 'three', label: 'Three results, one favourable', approach: 'Listed two heads, two tails and one of each, and answered 1/3.', breaksAt: 'The three results are not equally likely: one of each is made by HT and by TH.' },
        { id: 'oneOrder', label: 'Multiplied 1/2 × 1/2', approach: `Took P(head then tail) = 1/2 × 1/2 = ${frac(1, 4)} as the answer.`, breaksAt: 'That is one order, HT. The order TH also gives one of each, so count both.' },
      ] },
    { type: 'text', text: 'A probability question describes an **experiment** (toss, throw, draw, deal) and asks about its result. One complete result is an **outcome**: for two coins, "first H, second T" is one outcome. The list of every possible outcome is the **sample space**. An **event** is a yes/no question about the result, which is the same as the set of outcomes where the answer is yes.' },
    { type: 'list', items: ['"A fair die is thrown": 6 outcomes, the faces 1 to 6.', '"Three coins are tossed": outcomes are sequences like HTH.', '"Two cards are drawn": outcomes are pairs of cards.'] },
    { type: 'check', scope: 'outcome, sample space, event', questions: [
      mc({ q: 'Two dice are thrown. Which of these is a single outcome rather than an event?', right: 'first die 3 and second die 5', at: 2,
        wrong: [['the sum of the two dice is 8', `an event: ${sum8} outcomes share it`], ['both faces are odd numbers', `an event: ${odd2} outcomes`], ['the two dice show a double', `an event: ${doubles} outcomes`], ['first die 3 and second die odd', 'the second die is not pinned down: 3 outcomes share it']],
        explain: 'An outcome records everything about one throw. The others are yes/no questions, so they are sets of outcomes: events.' }),
      { type: 'number', q: 'A coin is tossed three times. Write out the sample space (sequences like HTH). How many outcomes does it have?', answer: 8, hints: ['Start from the two-toss list HH, HT, TH, TT.', 'Each two-toss sequence can end in H or in T.'], explain: 'HHH, HHT, HTH, HTT, THH, THT, TTH, TTT: 8 sequences.' },
    ] },

    sec('why'),
    { type: 'text', text: 'Every Beat the Odds question and most Likelihood List rows reduce to one move: count the right outcomes. Candidates rarely lose marks on arithmetic; they lose them by counting outcomes that are not equally likely. Fix the list and the rest is division.' },

    sec('anchor'),
    { type: 'text', text: 'You already know one die: 6 faces, each equally likely, so P(even) = 3/6. Keep that fraction and add **one condition** you now check yourself: the outcomes you count must be **equally likely**. For one fair die they obviously are. For bigger experiments you build the list so that they are.' },
    { type: 'formula', text: 'P(event) = favourable outcomes / total outcomes   (all outcomes equally likely)' },
    { type: 'check', scope: 'favourable / total on one die', questions: [
      { make: (rng) => { const p = rng.pick(PROPS), fav = favFaces(p); return mc({ q: `One fair die. What is P(the face is ${p.name})?`, right: frac(fav, 6), wrong: [[frac(fav, 5), 'divided by 5: there are 6 faces'], [frac(6 - fav, 6), 'counted the faces outside the event'], [frac(1, 6), 'counted one face only']], explain: `${fav} of the 6 equally likely faces qualify: ${frac(fav, 6)}.` }, rng); } },
    ] },

    sec('picture'),
    { type: 'text', text: 'Two-stage experiments fit in a grid: one row per result of the first stage, one column per result of the second. A coin and a die give 2 rows × 6 columns = 12 cells, one per outcome. The cells are equally likely because the coin is fair, the die is fair, and neither affects the other.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 2, cols: 6, rowLabels: ['H', 'T'], rowTitle: 'coin', colTitle: 'die', highlight: [[0, 1], [0, 3], [0, 5]], count: 3 }, caption: `The 12 outcomes of a coin and a die. Highlighted: heads with an even face, 3 of 12 cells, so P = 3/12 = ${frac(3, 12)}.` },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'toss', children: [
      { p: '1/2', label: 'H', children: [{ p: '1/2', label: 'H → HH' }, { p: '1/2', label: 'T → HT', mark: true }] },
      { p: '1/2', label: 'T', children: [{ p: '1/2', label: 'H → TH', mark: true }, { p: '1/2', label: 'T → TT' }] },
    ] }, total: '1/2' }, caption: 'The same list as a tree: each path from left to right is one outcome. Two coins give 4 equally likely paths; the two marked paths (one head, one tail) make 2 of 4.' },
    { type: 'check', scope: 'reading the grid', questions: [
      { make: (rng) => { const k = rng.int(3, 6); return { type: 'number', q: `In the coin-and-die grid, how many cells show tails and a face of at least ${k}?`, answer: 7 - k, explain: `The tails row, faces ${k} to 6: ${7 - k} cells.` }; } },
      { make: coinDieQ },
    ] },

    sec('equal', 'Equally likely, or just possible?'),
    { type: 'text', text: 'A list can be complete and still useless for counting. Two coins listed by number of heads give three results: 0, 1, 2. The list is right, but 1 head happens two ways (HT and TH) while 0 and 2 heads happen one way each. Divide by 3 and every result gets 1/3, which is wrong.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Two coins: sequences per number of heads', xLabel: 'heads', yLabel: 'sequences', categories: ['0', '1', '2'], series: [{ name: 'sequences', values: [0, 1, 2].map((k) => nCr(2, k)) }], valueLabels: true }, caption: 'Three possible results, not equally likely: 1 head is made by 2 of the 4 sequences. Count the equally likely sequences first, then group them into results.' },
    { type: 'check', scope: 'equally likely outcomes', questions: [
      mc({ q: 'Three fair coins. A candidate lists the results as 0, 1, 2 or 3 heads and answers P(3 heads) = 1/4. What is the right answer?', right: frac(1, 8), at: 1,
        wrong: [['1/4', 'the four head counts are not equally likely: 3 heads is 1 of 8 sequences'], [frac(nCr(3, 2), 8), 'that is P(exactly 2 heads)'], ['1/3', 'dropped the 0-heads result and still treated the rest as equally likely']],
        explain: 'Go down to sequences: 8 equally likely, and only HHH has 3 heads. 1/8.' }),
      { type: 'number', q: 'Three coins: how many of the 8 sequences have exactly one head?', answer: nCr(3, 1), explain: 'HTT, THT, TTH: the head can be in any of the 3 places.' },
    ] },

    sec('order', 'Ordered or unordered: pick one and stick to it'),
    { type: 'text', text: 'Objects you can tell apart (two dice, a first and a second card) give **ordered** outcomes: (2, 5) and (5, 2) are different. When a hand is drawn at once you may count **unordered** hands instead. Both work as long as favourable and total use the same convention: every unordered hand of 2 is made by exactly 2 orders, so the factor cancels.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Unordered hand', 'Ordered draws', 'Contains A?'], rows: hands.map(([x, y]) => [`{${x}, ${y}}`, `${x}${y}, ${y}${x}`, x === 'A' || y === 'A' ? 'yes' : 'no']), align: ['left', 'left', 'left'] }, caption: `Draw 2 of the cards A, B, C. Unordered: 3 hands, 2 contain A. Ordered: 6 draws, 4 contain A. Same answer, ${frac(2, 3)}, because every hand is exactly 2 draws.` },
    { type: 'check', scope: 'consistent counting', questions: [
      mc({ q: 'Two cards are drawn from the four cards A, B, C, D. List the hands. What is P(the hand is exactly {A, B})?', right: frac(1, 6), at: 2,
        wrong: [[frac(1, 12), 'mixed conventions: one unordered hand over 12 ordered draws'], [frac(1, 4), 'divided by the 4 cards instead of the hands'], [frac(2, 6), 'counted AB and BA as favourable but the total as unordered hands']],
        explain: 'Unordered: 6 hands (AB, AC, AD, BC, BD, CD), one favourable: 1/6. Ordered: 2 of 12 draws, also 1/6.' }),
    ] },

    sec('derivation'),
    { type: 'text', text: 'Build one probability from nothing: two fair dice, P(the larger face is 4).' },
    { type: 'steps', steps: [
      { answers: 'oneOrder', say: 'Name one outcome: the ordered pair (first die, second die). Paint one die red if it helps.', why: 'An outcome must be one complete result. The pair records both dice, so every question about them can be answered from it.',
        checks: [{ type: 'number', q: 'How many ordered pairs are there for two dice?', answer: 36, explain: '6 rows × 6 columns in the grid.' }] },
      { answers: 'three', say: 'Check the pairs are equally likely: each die is fair and neither affects the other, so all 36 pairs have the same chance.', why: 'Only then may you divide by 36. The 11 sums would not qualify: 7 is made by 6 pairs, 12 by one.',
        checks: [mc({ q: 'Which list of outcomes for two dice is equally likely?', right: 'the 36 ordered pairs', at: 3,
          wrong: [['the 11 sums from 2 to 12', 'sums are made by different numbers of pairs'], ['the 21 unordered pairs like {2, 5}', 'a mixed pair happens two ways, a double one way'], ['the 6 values of the larger face', `larger face 6 happens in ${nWays((a, b) => Math.max(a, b) === 6)} pairs, larger face 1 in one`]],
          explain: 'Only the ordered pairs are equally likely; every other list groups them unevenly.' })] },
      { say: 'Mark the event. Larger face 4 means both dice are at most 4 and at least one is exactly 4: an L-shape in the grid.', why: 'Drawing the condition as a shape stops you missing (4, 4) or counting it twice.',
        checks: [{ make: (rng) => { const m = rng.int(2, 6); const n = nWays((a, b) => Math.max(a, b) === m); return { type: 'number', q: `How many ordered pairs have larger face ${m}?`, answer: n, hints: ['Both dice at most the value, at least one equal to it.', `Row ${m} gives ${m} cells up to column ${m}; column ${m} adds the ones above.`], explain: `Row ${m}: ${m} cells; column ${m} above the corner: ${m - 1} more. ${n} in all.` }; } }] },
      { say: `Divide: ${max4} favourable out of 36 equally likely, so P = ${frac(max4, 36)}.`, why: 'Favourable over total is valid now, because step 2 made the outcomes equally likely.',
        checks: [{ make: maxQ }] },
    ] },
    { type: 'diagram', diagram: 'grid', spec: diceGrid((a, b) => Math.max(a, b) === 4, (a, b) => Math.max(a, b)), caption: `Each cell shows the larger face. The event "larger face is 4" is an L: 4 cells in row 4 plus 3 in column 4, ${max4} of 36.` },
    { type: 'explain', prompt: 'In your own words: when is P = favourable / total allowed, and what do you do when the natural list of results is not equally likely?', model: 'Only when every outcome in the list has the same chance. If the natural results (sums, numbers of heads, larger faces) are not equally likely, go down to finer outcomes that are (ordered pairs, sequences), count those, and group them into the event.', points: ['The formula needs equally likely outcomes', 'Break results into finer, equally likely outcomes (sequences, ordered pairs)', 'Count favourable and total with the same convention'] },

    sec('predict'),
    { type: 'predict', question: 'Three fair coins. Which is more likely: exactly two heads, or all three the same? By how much?', answer: `Exactly two heads: ${twoHeads3}/8 against ${allSame3}/8.`, explain: 'Two heads is HHT, HTH, THH; all the same is HHH, TTT.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Every listed result is equally likely.', fix: 'Only the finest outcomes (sequences, ordered pairs) are. Results such as sums or head counts must be built from them.' },
      { belief: '(2, 5) and (5, 2) are the same outcome.', fix: 'For two dice they are different throws. Count both, or count unordered pairs on top and bottom alike.' },
      { belief: 'Favourable can be unordered while the total is ordered.', fix: 'Pick one convention and use it for both; the answer is then the same either way.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(two coins show different faces). One step is wrong.', steps: [
      'The possible results are: two heads, two tails, one of each.',
      'These three results are equally likely, so the total is 3.',
      'One result, "one of each", is favourable.',
      'So P = 1/3.',
    ], errorStep: 1, explain: `The list in step 1 is complete, but "one of each" is made by two sequences (HT, TH). Count sequences: 2 of 4, so P = ${frac(2, 4)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => {
        const dbl = rng.chance(0.5);
        const [ev, fo, fu] = dbl ? ['a double', doubles, 6] : ['two different faces', 36 - doubles, 15];
        return mc({ q: `A die is thrown twice. A candidate counts the 21 unordered pairs and answers P(${ev}) = ${fu}/21. What is the right answer?`, right: frac(fo, 36),
          wrong: [[frac(fu, 21), 'unordered pairs are not equally likely: mixed pairs happen two ways, doubles one way'], [frac(36 - fo, 36), 'answered the opposite event'], [frac(fu, 36), 'counted each pair once but divided by the ordered total']],
          explain: `Ordered pairs: ${fo} of 36 are ${ev}, so ${frac(fo, 36)}.` }, rng);
      } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Count a grid row by row, not cell by cell. "First die bigger than second" is 0 + 1 + 2 + 3 + 4 + 5 = ${bigger} cells.` },
    { type: 'callout', tone: 'speed', text: 'Sanity check every answer: a probability lies between 0 and 1, and favourable can never exceed total. If it does, you mixed conventions.' },
    { type: 'check', scope: 'row-by-row counting', questions: [
      { make: (rng) => { const d = rng.int(1, 4); const n = nWays((a, b) => a - b >= d); return { type: 'number', q: `Two dice. How many of the 36 ordered pairs have the first die at least ${d} more than the second?`, answer: n, hints: ['Go row by row: for first die = r, how many second faces are at most r − d?', `Rows 1 to ${d} give nothing; each later row gives one more than the row before.`], explain: `Row by row: ${[1, 2, 3, 4, 5, 6].map((r) => Math.max(0, r - d)).join(' + ')} = ${n}.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Favourable / total **only** over equally likely outcomes: list the finest outcomes (ordered if the objects can be told apart), count top and bottom the same way, divide.' },

    sec('contrast'),
    { type: 'compare', columns: ['Listing', 'Outcomes', 'Equally likely?'], rows: [
      ['Two coins as sequences HH, HT, TH, TT', '4', 'yes'],
      ['Two coins by number of heads', '3', `no: ${[0, 1, 2].map((k) => nCr(2, k)).join(', ')} sequences`],
      ['Two dice as ordered pairs', '36', 'yes'],
      ['Two dice as unordered pairs', String(21), 'no: doubles 1 way, mixed pairs 2 ways'],
      ['Two dice by sum', '11', 'no: 1 to 6 pairs each'],
      ['2 of the cards A, B, C, D as hands', '6', 'yes, if favourable is also counted as hands'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: an event with no favourable outcomes has P = 0; the whole sample space has P = 1. A **biased** coin has no equally likely list at all: there you weight each outcome by its own probability instead of counting.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: Beat the Odds dice and card questions (count ordered pairs or ordered cards), Likelihood List tables where each row is one equally likely case, and the Intervals dice grids. Each starts by asking what the equally likely outcomes are.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'A biased coin lands heads with probability 0.7. A candidate says P(heads) = 1/2 because there are two outcomes. Right or wrong?', options: ['Wrong: the two outcomes are not equally likely', 'Right: two outcomes, one of them favourable'], answer: 0, traps: { 1: 'favourable / total used on outcomes that are not equally likely' }, explain: 'Counting only works over equally likely outcomes; here P(heads) = 0.7 is given directly.' },
      { type: 'number', q: 'A die is thrown and two coins are tossed. Using a grid (die faces against the coin sequences), how many outcomes are there?', answer: 6 * 4, explain: '6 faces against the 4 sequences HH, HT, TH, TT: 24 cells.' },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: coinDieQ }, { make: maxQ }, { make: headsQ }] },
  ],
};
