// Optimal stopping on a red/black deck: the value of a state is max(stop now, draw once and play
// on). Solve a table from small decks up. Every number shown is computed here, never typed by hand.
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

const zero = Q.of(0);
const MEMO = new Map();
// Value of drawing once from (r, b) and then playing optimally.
function draw(r, b) {
  const n = Q.of(r + b);
  let v = zero;
  if (r) v = v.add(Q.of(r).div(n).mul(Q.of(1).add(V(r - 1, b))));
  if (b) v = v.add(Q.of(b).div(n).mul(Q.of(-1).add(V(r, b - 1))));
  return v;
}
function V(r, b) {
  if (r === 0) return zero;
  if (b === 0) return Q.of(r);
  const key = `${r},${b}`;
  if (!MEMO.has(key)) { const d = draw(r, b); MEMO.set(key, d.cmp(zero) > 0 ? d : zero); }
  return MEMO.get(key);
}
// "Stop as soon as you are ahead": a plausible but suboptimal rule.
function ahead(r, b, s = 0) {
  if (s > 0 || r + b === 0) return Q.of(s);
  const n = Q.of(r + b);
  let v = zero;
  if (r) v = v.add(Q.of(r).div(n).mul(ahead(r - 1, b, s + 1)));
  if (b) v = v.add(Q.of(b).div(n).mul(ahead(r, b - 1, s - 1)));
  return v;
}
// Stopping at the best moment in hindsight: E[max over prefixes of the running total, and 0].
function hindsight(r, b) {
  let tot = 0, cnt = 0;
  const walk = (R, B, s, best) => { if (!R && !B) { tot += best; cnt += 1; return; } if (R) walk(R - 1, B, s + 1, Math.max(best, s + 1)); if (B) walk(R, B - 1, s - 1, best); };
  walk(r, b, 0, 0);
  return Q.of(tot, cnt);
}
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const R4 = [0, 1, 2, 3, 4];
const decide = (r, b) => (draw(r, b).cmp(zero) > 0 ? 'draw' : draw(r, b).cmp(zero) === 0 ? 'either' : 'stop');
const B3 = { r: 3, b: 3 };

export default {
  id: 'bto/card-stopping',
  book: 'bto',
  kind: 'family',
  family: 'card-stopping',
  title: 'Optimal stopping with a deck of cards',
  summary: 'V(r, b) = max(0, draw value), where drawing gives r/(r+b)·(1 + V(r−1, b)) + b/(r+b)·(−1 + V(r, b−1)). Fill the table from small decks.',
  prerequisites: ['bto/dice-games-ev', 'bto/card-symmetry'],
  objectives: [
    'Describe a position by (reds left, blacks left) and explain why past winnings do not matter',
    'Write the stop-or-draw recursion and fill a small value table by hand',
    'Explain why a balanced deck is worth more than 0: the option to stop',
    'Reject "play the whole deck", "stop when ahead" and "stop at the best moment in hindsight"',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: a deck of 2 red and 2 black cards is shuffled and turned over one card at a time. Each red pays you $1, each black costs $1, and you may stop whenever you like. With the best strategy, what is the game worth? Try two approaches.', answer: `${V(2, 2)} ≈ ${f3(V(2, 2))}`, explain: `If you answered 0 you played the whole deck: 2 − 2 = 0. The right to stop is worth something: after a red you can quit ahead. If you answered ${f3(hindsight(2, 2))}, you stopped at the best moment in hindsight, which needs knowledge of the cards to come.` },
    { type: 'text', text: 'Cards (or other items) are revealed one at a time from a **finite** pile, each one wins or loses money, and you may **stop whenever you like** and keep the running total. The question asks for the value of the game with the best strategy.' },
    { type: 'list', items: ['"3 red and 3 black cards: +$1 per red, −$1 per black, stop any time. What is the game worth?"', '"A deck of 4 red and 2 black: optimal value?"', '"Should you draw when 1 red and 2 black remain?"'] },
    { type: 'text', text: 'Not this lesson: dice, where every roll is a fresh copy of the last (bto/dice-games-ev), and card probabilities with no decisions (bto/card-draws).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['5 red, 5 black; stop whenever: game value', 'A die with up to two rerolls: game value', '5 red, 5 black; you must turn every card: expected total', '5 red, 5 black: P(the first card is red)'], answer: 0, traps: { 1: 'dice do not change as you roll: bto/dice-games-ev', 2: 'no choice: the total is 5 − 5 = 0', 3: 'a probability: bto/card-symmetry' }, explain: 'A finite deck, and you choose when to stop.' },
    ] },

    S('why'),
    { type: 'text', text: 'A balanced deck has expected value 0 if you must play it out, yet the right to stop makes it worth real money. That is an **option value**, exactly what market makers price every day. These items are rated hard, but the method is one recursion and a small table; with practice the classic decks take a minute.' },

    S('anchor'),
    { type: 'text', text: 'From bto/dice-games-ev: with a reroll, keep a roll exactly when the sure amount beats the value of continuing. Card stopping is the same rule with **one change**: every draw changes the deck, so the value of continuing depends on what is left. You need a value for every possible remaining deck. Luckily the decks are small, and each value only needs the values of decks with one card fewer.' },
    { type: 'check', scope: 'stop iff the sure amount beats continuing', questions: [
      { type: 'choice', q: 'Only red cards remain (3 of them). What should you do?', options: ['Draw them all: +3 for sure', 'Stop now', 'Draw one and stop'], answer: 0, traps: { 1: 'stopping gives 0 more; each red is +1', 2: 'every remaining card is a sure +1' }, explain: 'V(r, 0) = r.' },
      { type: 'choice', q: 'Only black cards remain. What should you do?', options: ['Stop now', 'Draw one', 'Draw them all'], answer: 0, traps: { 1: 'each black is a sure −1', 2: 'each black is a sure −1' }, explain: 'V(0, b) = 0.' },
    ] },

    S('picture'),
    { type: 'text', text: 'Start with the smallest interesting deck: 1 red, 1 black. Draw once. A red ends ahead and you stop at +1. A black puts you at −1, and the last card is red, so you draw it and finish at 0.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: '1 red, 1 black', children: [
      { p: '1/2', label: 'red: +1, stop', mark: true },
      { p: '1/2', label: 'black: −1', children: [{ p: '1', label: 'red: back to 0, done' }] },
    ] }, total: '1/2' }, caption: `Value = 1/2 × (+1) + 1/2 × 0 = ${V(1, 1)}. The marked leaf is the one where the option to stop earned money: you quit before the black could cancel your red.` },
    { type: 'check', scope: 'the 1-red, 1-black deck', questions: [
      { type: 'choice', q: 'Deck of 1 red and 1 black. Game value with optimal play?', options: [V(1, 1).toString(), '0', '1', '1/4'], answer: 0, traps: { 1: 'played the whole deck', 2: 'assumed the red always comes first', 3: 'multiplied the two halves instead of adding the branches' }, explain: `1/2 × 1 + 1/2 × 0 = ${V(1, 1)}.` },
    ] },
    { type: 'text', text: 'Now tabulate V(r, b) for every small deck. Each entry uses only the entry above it (one red fewer) and the entry to its left (one black fewer). Fill the first row and column first, then work outwards.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'V(r, b): reds left down, blacks left across', columns: ['r \\ b', ...R4.map(String)], rows: R4.map((r) => [String(r), ...R4.map((b) => V(r, b).toString())]) }, caption: `The first column is r (take every red), the first row is 0 (stop). The diagonal, balanced decks, reads 0, ${V(1, 1)}, ${V(2, 2)}, ${V(3, 3)}, ${V(4, 4)}: positive and growing. Once blacks outnumber reds enough, the value is 0 and you should not play.` },
    { type: 'check', scope: 'reading the table', questions: [
      { make: (rng) => { const [r, b] = rng.pick([[2, 1], [1, 2], [3, 2], [2, 3], [3, 1]]); return mc(rng, `From the table: V(${r}, ${b})?`, V(r, b).toString(), [[String(Math.max(0, r - b)), 'played the whole deck (or stopped at once)'], [V(b, r).toString(), 'swapped reds and blacks'], [Q.of(r, r + b).toString(), 'used P(first card red)']], `Row ${r}, column ${b}: ${V(r, b)}.`); } },
    ] },
    { type: 'text', text: `Compare four ways to play ${B3.r} red and ${B3.b} black: play everything, stop as soon as you are ahead, play optimally, and stop at the best moment with perfect hindsight (not allowed).` },
    { type: 'diagram', diagram: 'bar', spec: { title: `${B3.r} red, ${B3.b} black: value of each strategy`, xLabel: 'strategy', yLabel: 'expected $', categories: ['play all', 'stop when ahead', 'optimal', 'hindsight'], series: [{ name: 'value', values: [0, ahead(B3.r, B3.b), V(B3.r, B3.b), hindsight(B3.r, B3.b)].map((x) => Number((x instanceof Q ? x.toNumber() : x).toFixed(3))) }], valueLabels: true }, caption: `Optimal ${V(B3.r, B3.b)} beats "stop when ahead" (${ahead(B3.r, B3.b)}) because with many reds left you should keep drawing even when ahead. Hindsight (${hindsight(B3.r, B3.b)}) is an upper bound nobody can reach.` },
    { type: 'check', scope: 'strategies compared', questions: [
      { type: 'choice', q: `${B3.r} red, ${B3.b} black. Which value is achievable and the highest achievable?`, options: [V(B3.r, B3.b).toString(), hindsight(B3.r, B3.b).toString(), ahead(B3.r, B3.b).toString(), '0'], answer: 0, traps: { 1: 'needs you to know the cards still to come', 2: 'stopping as soon as you are ahead quits too early', 3: 'playing everything ignores the option' }, explain: `The recursion gives the best you can do without seeing the future: ${V(B3.r, B3.b)}.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'The state is (r, b): reds and blacks still in the deck. Money already won or lost does not change which future choices are best.', why: 'Every future card adds to or subtracts from whatever you hold. The best continuation depends only on what is left to draw.',
        checks: [
          { type: 'choice', q: 'You are $2 down with 2 red and 1 black left. What matters for your next decision?', options: ['Only the 2 red and 1 black left', 'The $2 you are down', 'Both equally', 'The order of the cards already drawn'], answer: 0, traps: { 1: 'sunk money: it is the same whatever you do next', 2: 'the past total adds a constant to every choice', 3: 'past cards matter only through what is left' }, explain: 'Future gains depend only on the remaining deck.' },
        ] },
      { say: 'Boundaries: V(r, 0) = r (take every red) and V(0, b) = 0 (stop at once).', why: 'With one colour left the best play is obvious.',
        checks: [
          { make: (rng) => { const r = rng.int(1, 6); return { type: 'number', q: `${r} red cards and no black cards remain. Value of the rest of the game?`, answer: r, explain: `Take them all: +${r}.` }; } },
        ] },
      { say: 'Otherwise compare stopping (0 more) with drawing once: with chance r/(r + b) you gain 1 and move to (r − 1, b); with b/(r + b) you lose 1 and move to (r, b − 1). V(r, b) = max(0, that draw value).', why: 'Drawing once and then playing optimally is worth the average of the two outcomes, each followed by the best play from the new deck.',
        checks: [
          { make: (rng) => { const [r, b] = rng.pick([[2, 1], [1, 2], [2, 2], [3, 1]]); const d = draw(r, b); return mc(rng, `V(${r - 1}, ${b}) = ${V(r - 1, b)} and V(${r}, ${b - 1}) = ${V(r, b - 1)}. Draw value at (${r}, ${b})?`, d.toString(), [[Q.of(r - b, r + b).toString(), 'used only the card value, forgetting the value of the deck after it'], [Q.of(r, r + b).mul(V(r - 1, b)).add(Q.of(b, r + b).mul(V(r, b - 1))).toString(), 'forgot the +1 and −1 of the card itself'], [Q.of(r, r + b).mul(Q.of(1).add(V(r - 1, b))).toString(), 'left out the black branch']], `${r}/${r + b} × (1 + ${V(r - 1, b)}) + ${b}/${r + b} × (−1 + ${V(r, b - 1)}) = ${d}.`, { hinge: true }); } },
        ] },
      { say: 'Fill the table from small decks upwards. Every state refers only to decks with one card fewer, so each entry is ready when you need it.', why: 'This is backward induction: the last decisions are solved first.',
        checks: [
          { type: 'choice', q: `V(1, 2) = ${V(1, 2)} and V(2, 1) = ${V(2, 1)}. What is V(2, 2)?`, options: [V(2, 2).toString(), '0', '1/2', Q.of(1, 2).mul(Q.of(1).add(V(1, 2))).add(Q.of(1, 2).mul(V(2, 1))).toString()], answer: 0, traps: { 1: 'the must-play value: the option is ignored', 2: 'the 1-and-1 value reused', 3: 'forgot the −1 of the black card' }, explain: `1/2 × (1 + ${V(1, 2)}) + 1/2 × (−1 + ${V(2, 1)}) = ${draw(2, 2)} > 0, so V(2, 2) = ${V(2, 2)}.` },
        ] },
      { say: 'Read the strategy off the table: draw while the draw value is positive, stop when it is negative. At exactly 0 you are indifferent.', why: 'V = max(0, draw value) is a decision: the larger branch is the move.',
        checks: [
          { make: (rng) => { const [r, b] = rng.pick([[1, 3], [2, 1], [1, 1], [2, 4], [3, 2]]); const d = decide(r, b); return mc(rng, `${r} red and ${b} black left. Draw or stop?`, d === 'draw' ? 'draw' : d === 'stop' ? 'stop' : 'either: both are worth 0', [['draw', 'the draw value is negative here'], ['stop', 'the draw value is positive: the deck still favours you'], ['either: both are worth 0', 'the draw value is not exactly 0 here']], `Draw value ${draw(r, b)}: ${d === 'draw' ? 'positive, so draw' : d === 'stop' ? 'negative, so stop' : 'exactly 0'}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: a deck with 2 red and 2 black cards has a total of 0. Why is the game worth more than 0 when you may stop?', model: `If you had to play every card you would always end at 0. With the right to stop you can quit when the deck has been kind to you (for example after an early red) and keep playing when the remaining deck favours you. You never have to take the bad endings in full, so the option is worth more than nothing: ${V(2, 2)} here.`, points: ['must-play value is r − b = 0', 'stopping lets you keep good early runs', 'the value is max(stop, draw) at every state, so it is never below 0'] },

    S('worked'),
    { type: 'worked', family: 'card-stopping', section: 'bto', difficulty: 4, seed: 'c', intro: 'A three-card deck. Build the small table before opening the solution.' },
    { type: 'worked', family: 'card-stopping', section: 'bto', difficulty: 5, seed: 'a', fade: 1, intro: 'A bigger deck with more blacks than reds. The first steps are given; filling the table and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'A deck of 1 red and 3 black cards. Is it worth playing at all?', answer: `No: V(1, 3) = ${V(1, 3)}. The draw value is ${draw(1, 3)}, so stop before the first card.`, explain: 'With too many blacks the option cannot save you: the chance of an early red is not worth the expected losses.' },

    S('traps'),
    { type: 'traps', family: 'card-stopping', section: 'bto', extra: [
      { belief: 'A balanced deck is worth 0.', fix: `Only if you must play it all. The option to stop is worth something: V(2, 2) = ${V(2, 2)}.` },
      { belief: 'Stop as soon as you are ahead.', fix: 'With many reds left you should keep drawing even when ahead.' },
      { belief: 'The value is the expected best running total.', fix: 'That uses hindsight. You must decide without seeing the next card.' },
    ] },
    { type: 'erroneous', problem: 'A candidate values a deck of 2 red and 1 black. One step is wrong.', steps: [
      `V(1, 1) = ${V(1, 1)} and V(2, 0) = 2.`,
      `Draw value at (2, 1) = 2/3 × (1 + ${V(1, 1)}) + 1/3 × (−1 + 2).`,
      `That is ${draw(2, 1)}.`,
      `Drawing beats stopping now, but after the first red you are ahead, so stop there: value ${ahead(2, 1)}.`,
    ], errorStep: 3, explain: `Being ahead is no reason to stop: the draw value from what is left still decides. V(2, 1) = ${V(2, 1)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `3 red, 3 black. A candidate answers ${ahead(3, 3)}. Which belief?`, options: ['Stop as soon as you are ahead', 'Play everything', 'Hindsight'], answer: 0, explain: `"Stop when ahead" gives ${ahead(3, 3)}; optimal gives ${V(3, 3)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the balanced decks: V(1,1) = ${V(1, 1)}, V(2,2) = ${V(2, 2)}, V(3,3) = ${V(3, 3)}, V(4,4) = ${V(4, 4)}. For an unbalanced deck, the answer is at least max(0, r − b); if an option is below that, it is wrong.` },
    { type: 'callout', tone: 'speed', text: `Fill the table diagonally, smallest decks first, and write fractions, not decimals. A 3 × 3 table is nine short averages: about 60 of your ${SECTIONS.bto.exam.perItemSeconds} seconds, so do these last.` },
    { type: 'check', scope: 'bounds and landmark values', questions: [
      { make: (rng) => { const [r, b] = rng.pick([[4, 2], [4, 1], [3, 1], [3, 2]]); return mc(rng, `${r} red, ${b} black. Which value could be the optimal game value?`, V(r, b).toString(), [[String(r - b - 1), 'below the must-play value r − b: impossible'], [String(r), 'more than the reds can ever pay'], [hindsight(r, b).toString(), 'the hindsight bound, not reachable']], `It must lie between r − b = ${r - b} and the hindsight bound ${f3(hindsight(r, b))}: ${V(r, b)}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Stop-any-time deck → V(r, b) = max(0, r/(r+b)(1 + V(r−1,b)) + b/(r+b)(−1 + V(r,b−1))), V(r,0) = r, V(0,b) = 0. Table from small decks up.' },

    S('contrast'),
    { type: 'compare', columns: ['Deck 3 red, 3 black', 'Rule', 'Value'], rows: [
      ['must play every card', 'no option', '0'],
      ['stop when first ahead', 'simple rule', ahead(3, 3).toString()],
      ['optimal stopping', 'recursion', V(3, 3).toString()],
      ['best moment in hindsight', 'not allowed: sees the future', hindsight(3, 3).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: all red, take everything (V = r). All black, never play (V = 0). One red and many blacks: V(1, b) = 0 for b ≥ 2 (here V(1, 2) = ${V(1, 2)}, V(1, 3) = ${V(1, 3)}), so the option is worthless.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: every "stop or continue" game is max(sure amount, value of continuing), solved from the end (bto/dice-games-ev). Zap-N\'s Balloon is the same trade-off, and so is deciding whether to keep a position open: an option is worth at least its exercise value.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Which statement is always true?', options: ['V(r, b) ≥ max(0, r − b)', 'V(r, b) = r − b', 'V(r, b) ≤ 0 when b > r', 'V(r, b) = V(b, r)'], answer: 0, traps: { 1: 'ignores the option to stop', 2: 'false: V(3, 4) is positive, the option can still pay', 3: 'reds and blacks are not symmetric: reds pay' }, explain: 'You can always stop at once (0) or play everything (r − b), so the optimum is at least the better of the two.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'card-stopping', section: 'bto', count: 3 },
  ],
};
