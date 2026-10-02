// Card symmetry: any fixed position of a shuffled deck is a uniform card; unseen discards carry
// no information; seen cards are removed from the deck and from their group; relative order of
// k special cards is uniform. Every number shown is computed here, never typed by hand.
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

const ord = (k) => `${k}${k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th'}`;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♥', '♦', '♣', '♠'];
// One unseen card is discarded, then the next card is drawn: average over the discard.
const nextRedAfterOne = Q.of(1, 2).mul(Q.of(25, 51)).add(Q.of(1, 2).mul(Q.of(26, 51)));
const GROUPS = [
  { what: 'red', good: 26 }, { what: 'a heart', good: 13 }, { what: 'an ace', good: 4 }, { what: 'a face card (J, Q, K)', good: 12 },
];

export default {
  id: 'bto/card-symmetry',
  book: 'bto',
  kind: 'family',
  family: 'card-symmetry',
  title: 'Cards: symmetry and unseen discards',
  summary: 'Any position of a shuffled deck is a uniform card. Unseen cards change nothing; seen cards leave the deck and their group.',
  prerequisites: ['prob/symmetry', 'bto/two-dice-sum'],
  objectives: [
    'Answer "the k-th card" and "after unseen discards" questions with the starting fraction, instantly',
    'Update correctly after a card is seen: remove it from the deck and from its group',
    'Solve "which special card comes first" by looking only at the special cards: each is first with 1/k',
    'Name why 26/42 and 16/42 are wrong after 10 unseen discards',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: a shuffled 52-card deck has its top 10 cards thrown away face down, unseen. What is the probability that the next card is red? Try two different arguments.', answer: '1/2', explain: 'The 11th card is as random as the first. If you got 26/42 you kept all the reds but shrank the deck; if you got 16/42 you assumed every discard was red. Unseen cards teach you nothing, so nothing changes.', attempts: [
      { id: 'enumerate', label: 'Split on the discarded reds', approach: 'Started listing how many of the 10 discards were red, 0 to 10, each with its own weight.', breaksAt: 'Eleven weighted cases will not fit in 90 seconds, and they are not needed: the 11th card is as random as the first.' },
      { id: 'shrink', label: '26 reds among 42 cards', approach: 'Kept all 26 reds and shrank the deck to 42: 26/42.', breaksAt: 'The discards removed reds as well, about half of them. Shrinking the deck alone overstates red.' },
      { id: 'all-red', label: 'Assume the discards were red', approach: 'Took the worst case, all 10 discards red: 16/42.', breaksAt: 'Nobody saw the discards. Removing cards from a group is only allowed for cards you actually see.' },
    ] },
    { type: 'text', text: 'A deck is shuffled and the question points at a **position** (the 11th card, the bottom card), at cards **thrown away unseen**, at a card you **did** see, or at the **order** in which special cards appear ("the first ace before the first king").' },
    { type: 'list', items: ['"The top 10 cards are discarded face down. Probability the next card is red?"', '"Probability the 15th card has the same suit as the top card?"', '"You see the top card is a heart. Probability the bottom card is a heart?"', '"Cards are turned over one by one. Probability the first ace comes before the first king?"'] },
    { type: 'check', scope: 'the four kinds of card question', questions: [
      { type: 'choice', q: '"The top 5 cards are burned face down. Probability that the 6th card is an ace?" What kind is it?', options: ['cards thrown away unseen', 'a card you did see', 'the order of special cards', 'a hand dealt at once'], answer: 0, traps: { 1: 'nobody looked at the burned cards', 2: 'one card is asked about, not which of two kinds comes first', 3: 'a single position is asked about, not a hand' }, explain: 'Burned face down means thrown away unseen.' },
    ] },
    { type: 'text', text: 'Not this lesson: hands of several cards dealt at once, like "two aces in two cards" (bto/card-draws). Here the question is about one position or about relative order, and symmetry answers it without a product.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Probability the 30th card dealt is a spade', 'Probability a 5-card hand is a flush', 'Probability two drawn cards are both aces', 'Probability of at least one ace in 4 cards'], answer: 0, traps: { 1: 'a hand: bto/card-draws', 2: 'two cards together: bto/card-draws', 3: 'an at-least-one hand: bto/card-draws' }, explain: 'A single position: symmetry says 13/52.' },
    ] },

    S('why'),
    { type: 'text', text: 'Card symmetry questions are designed to make you compute when you should not. Discards, far-away positions and long sequences feel like they must change the answer, and each tempting option is built from one such feeling. Seeing the symmetry turns a 90-second question into a 5-second one, and knowing exactly when the symmetry breaks (a card you saw) keeps you from overusing it.' },

    S('anchor'),
    { type: 'text', text: 'You already know the top card of a shuffled deck: 52 equally likely cards, so P(red) = 26/52 = 1/2. The 11th card is the same fact with **one change**: the position label. A fair shuffle does not care about labels, so every position holds each of the 52 cards with the same chance, 1/52.' },
    { type: 'check', scope: 'a fixed position is a uniform card', questions: [
      { make: (rng) => { const k = rng.int(2, 52); const g = rng.pick(GROUPS); return mc(rng, `A deck is shuffled. P(the ${ord(k)} card is ${g.what})?`, fr(g.good, 52), [[fr(g.good, 53 - k), 'shrank the deck by the cards above it, although nothing was seen'], [fr(1, 52), 'answered for one specific card'], [fr(g.good, 52 - g.good), 'divided by the other cards instead of all 52']], `Every position is a uniform card: ${g.good}/52 = ${fr(g.good, 52)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Picture the deck as a 4 × 13 grid, one cell per card. Whatever position you point at, the card there is one of these 52 cells, each with the same chance. The highlighted half are the reds.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 4, cols: 13, rowLabels: SUITS, colLabels: RANKS, rowTitle: 'suit', colTitle: 'rank', highlight: Array.from({ length: 26 }, (_, i) => [Math.floor(i / 13), i % 13]), count: 26 }, caption: 'The 52 cards. The card in any fixed position is one uniformly random cell: red with 26/52, a heart with 13/52, an ace with 4/52.' },
    { type: 'check', scope: 'counting cells in the deck grid', questions: [
      { type: 'number', q: 'How many cells of the grid are red face cards (J, Q, K of hearts or diamonds)?', answer: 6, explain: '3 face ranks × 2 red suits.' },
    ] },
    { type: 'text', text: 'Now throw one card away **unseen** and look at the next. Split on what the discard was: red (then 25 reds remain in 51) or black (26 reds in 51). Average the two branches.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'discard', children: [
      { p: '1/2', label: 'discard red', children: [{ p: '25/51', label: 'next red', mark: true }, { p: '26/51', label: 'next black' }] },
      { p: '1/2', label: 'discard black', children: [{ p: '26/51', label: 'next red', mark: true }, { p: '25/51', label: 'next black' }] },
    ] }, total: nextRedAfterOne.toString() }, caption: `1/2 × 25/51 + 1/2 × 26/51 = ${nextRedAfterOne}. The two branches pull in opposite directions and cancel exactly. With more discards the tree is bigger, but the average is always the starting 1/2.` },
    { type: 'check', scope: 'averaging over an unseen discard', questions: [
      { type: 'choice', q: 'Two cards are discarded unseen. P(the third card is an ace)?', options: [fr(4, 52), fr(4, 50), fr(2, 50), fr(3, 50)], answer: 0, traps: { 1: 'kept all four aces but shrank the deck', 2: 'assumed both discards were aces', 3: 'assumed exactly one discard was an ace' }, explain: 'Unseen discards average out: 4/52 = 1/13.' },
    ] },
    { type: 'text', text: 'For order questions, ignore every card that cannot decide the event. "First ace before first king" is decided by which of the 8 aces and kings shows up first, and each of those 8 is equally likely to be the first of them.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'first of the 8 aces and kings', children: [{ p: '4/8', label: 'it is an ace', mark: true }, { p: '4/8', label: 'it is a king' }] }, total: '1/2' }, caption: 'The other 44 cards only change when the decisive card appears, not which one it is. So P(first ace before first king) = 4/8.' },
    { type: 'check', scope: 'only the special cards matter', questions: [
      { make: (rng) => { const a = rng.int(1, 4), b = rng.int(1, 4); const A = ['ace', 'aces'], B = ['king', 'kings']; return mc(rng, `A special deck has ${a} marked ${a > 1 ? A[1] : A[0]}, ${b} marked ${b > 1 ? B[1] : B[0]} and 40 plain cards, shuffled. P(the first marked card is an ace)?`, fr(a, a + b), [[fr(a, 40 + a + b), 'counted the plain cards, which cannot decide the event'], ['1/2', 'assumed aces and kings are always equally matched'], [fr(1, a + b), 'required one specific ace']], `Only the ${a + b} marked cards matter: ${a} of them are aces, ${fr(a, a + b)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'enumerate', say: 'A fair shuffle makes all 52! orderings equally likely, so the card in any fixed position is each of the 52 cards with probability 1/52.', why: 'For a given card c and position k, the orderings with c at k are 51! of 52!, whatever k is.',
        checks: [
          { type: 'choice', q: 'Why is P(the bottom card is the ace of spades) = 1/52?', options: ['51! of the 52! orderings put it at the bottom', 'The bottom card is dealt last, so it is special', 'The 51 cards above it shrink the chances to 1/52'], answer: 0, traps: { 1: 'no position is special in a fair shuffle', 2: 'the cards above it are not seen, so they do not condition anything' }, explain: 'Fix the ace at the bottom and order the other 51 freely: 51!/52! = 1/52.' },
        ] },
      { answers: 'shrink', say: 'Cards removed unseen give no information. Averaging over everything they could have been returns the starting probability.', why: 'Probabilities move only when you learn something. The unseen-discard tree cancels exactly, for any number of discards.',
        checks: [
          { make: (rng) => { const d = rng.int(3, 20); return mc(rng, `The top ${d} cards are discarded unseen. P(the next card is red)?`, '1/2', [[fr(26, 52 - d), `kept all 26 reds in a deck of ${52 - d}`], [fr(Math.max(26 - d, 0), 52 - d), 'assumed every discard was red'], [fr(1, 4), 'used a suit instead of a colour']], 'Unseen discards change nothing: 1/2.'); } },
        ] },
      { answers: 'all-red', say: 'A card you **see** is information. Remove it from the deck and from its group: after seeing a heart on top, 12 hearts remain among 51 cards.', why: 'Seeing the top card fixes it, so every other position is a uniform card from the 51 that are left.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 52); return mc(rng, `You see the top card is a heart. P(the ${k === 52 ? 'bottom' : ord(k)} card is a heart)?`, fr(12, 51), [[fr(13, 52), 'ignored the seen card'], [fr(13, 51), 'removed the heart from the deck but not from the hearts'], [fr(12, 52), 'removed it from the hearts but not from the deck'], [fr(1, 16), 'multiplied 1/4 × 1/4 as if the top card were still unknown']], '12 hearts among the 51 other cards.'); } },
        ] },
      { say: 'Unseen top card, question about matching it: condition on it anyway. Whatever the top card is, the k-th card matches its suit with 12/51.', why: 'The answer is the same for every possible top card, so it is also the overall answer: averaging equal numbers gives that number.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 52); return mc(rng, `A deck is shuffled. P(the ${ord(k)} card has the same suit as the top card)?`, fr(12, 51), [[fr(1, 4), 'treated the two positions as independent draws with replacement'], [fr(1, 16), 'required both cards to be one named suit'], [fr(13, 51), 'forgot the top card uses up one card of its suit']], 'Condition on the top card: 12 of the other 51 match its suit.'); } },
        ] },
      { say: 'Relative order: among k special cards, each is equally likely to come first, so a group of m of them provides the first with m/k.', why: 'Every ordering of the special cards among themselves is equally likely; the plain cards only fill the gaps.',
        checks: [
          { type: 'choice', q: 'P(the ace of spades appears before every other spade)?', options: [fr(1, 13), fr(1, 52), fr(1, 4), fr(1, 2)], answer: 0, traps: { 1: 'computed "the ace of spades is the top card"', 2: 'used a suit chance', 3: 'treated "before all the others" like "before one other card"' }, explain: 'Only the 13 spades matter; each is first among them with 1/13.' },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why do unseen discards leave P(next card is red) at 1/2, while seeing the top card changes P(next is a heart)?', model: 'Unseen discards are equally likely to be any cards, so the cases where they were mostly red and mostly black balance out; averaging over them gives back 26/52. A card you see is fixed, so it is no longer a possibility for the other positions: it leaves the deck and, if it is a heart, it leaves the hearts too, giving 12/51.', points: ['probabilities change only with information', 'averaging over unseen discards returns the prior', 'a seen card is removed from the deck and from its group'] },

    S('worked'),
    { type: 'worked', family: 'card-symmetry', section: 'bto', difficulty: 1, seed: 'b', explainAt: [1], intro: 'Unseen discards. Try it before opening the solution.' },
    { type: 'worked', family: 'card-symmetry', section: 'bto', difficulty: 2, seed: 'c', fade: 1, intro: 'Matching the top card. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'A deck is shuffled. The top card is turned face up: a heart. The next 3 cards are discarded face down. What is the probability that the 5th card is a heart?', lines: [
      { t: 0, say: 'One position, some cards seen, some unseen: a symmetry question. First I sort the cards into seen and unseen.' },
      { t: 4, say: `Four cards are gone, one of them a heart, so ${12} hearts in ${52 - 4} cards: ${fr(12, 48)}?`, slip: true },
      { t: 8, say: 'Wait: the three face-down cards are unseen, so they change nothing. Only the seen heart leaves the deck and the hearts.' },
      { t: 12, say: `12 hearts among the 51 other cards: ${fr(12, 51)}.` },
      { t: 15, say: `Check: a little under 1/4, because one heart is already gone. Answer ${fr(12, 51)}, most of the ${SECTIONS.bto.exam.perItemSeconds} seconds left.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try gave 12/48. What went wrong?', options: ['let the unseen discards change the odds', 'forgot the seen heart', 'used 13 hearts in 52', 'divided by the number of suits'], answer: 0, traps: { 1: 'the seen heart was removed in that try', 2: 'the try used 12 in 48', 3: 'nothing was divided by 4' }, explain: 'Face-down cards tell you nothing. Only the seen heart leaves: 12 hearts in 51 cards = 4/17.' },
    ] },

    S('predict'),
    { type: 'predict', question: 'You burn 51 cards unseen. What is the chance the last card is the ace of spades?', answer: '1/52, exactly as for the top card.', explain: 'Nothing was seen, so the last card is still a uniform card.' },

    S('traps'),
    { type: 'traps', family: 'card-symmetry', section: 'bto', extra: [
      { belief: 'Unseen discards shrink the deck, so use good/(52 − d).', fix: 'They also remove good cards on average. The two effects cancel exactly: good/52.' },
      { belief: 'A far-away position (the 30th card) has different odds from the top card.', fix: 'A fair shuffle treats every position alike.' },
      { belief: 'A seen card changes nothing.', fix: 'Seen cards are information: remove them from the deck and from their group.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(the 11th card is an ace) after the top 10 are discarded face down. One step is wrong.', steps: [
      'The top 10 cards are gone, so 42 cards remain.',
      'None of the discards was seen, so all 4 aces are still among the 42.',
      'P(next card is an ace) = 4/42.',
      'About 0.095.',
    ], errorStep: 1, explain: `"Unseen" does not mean "not an ace": some discards may be aces. Averaging over what they could be gives 4/52 = ${fr(4, 52)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'After 10 unseen discards, a candidate answers P(next card red) = 26/42. Which belief?', options: ['Unseen discards only shrink the deck', 'All ten of the discards were red', 'A card you see changes nothing'], answer: 0, explain: 'The discards remove reds as often as blacks on average: 1/2.' },
      { type: 'choice', q: 'The top card is shown: a heart. A candidate answers P(bottom card heart) = 1/4. Which belief?', options: ['A seen card changes nothing', 'Unseen cards shrink the deck', 'Only special cards matter'], answer: 0, explain: 'The seen heart leaves the deck and the hearts: 12/51.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Three words decide these questions: **seen or unseen?** Unseen → the answer is the starting fraction (26/52, 13/52, 4/52). Seen → remove the card from the deck and from its group (12/51, 25/51, 3/51). Order → count only the special cards (m/k).' },
    { type: 'check', scope: 'seen or unseen', questions: [
      { type: 'choice', q: 'The top card is turned face up: it is red. The next 5 cards are discarded face down. P(the 7th card is red)?', options: [fr(25, 51), '1/2', fr(25, 46), fr(20, 46)], answer: 0, traps: { 1: 'ignored the card you saw', 2: 'shrank the deck by the unseen discards', 3: 'assumed all 5 unseen discards were red' }, explain: 'Remove the seen red; ignore the unseen five: 25/51.' },
    ] },
    { type: 'callout', tone: 'speed', text: `The speed win is large: a symmetry item takes 5 to 10 seconds of the ${SECTIONS.bto.exam.perItemSeconds} available. Spend the spare time rereading the wording for "you see", "face up" or "revealed", the words that break the symmetry.` },
    { type: 'check', scope: 'words that break the symmetry', questions: [
      { type: 'choice', q: 'Which phrase in a card question breaks the symmetry?', options: ['"turned face up"', '"after shuffling"', '"discarded face down"', '"the 20th card"'], answer: 0, traps: { 1: 'shuffling is what creates the symmetry', 2: 'face-down discards are unseen, so they keep it', 3: 'a position alone keeps the symmetry' }, explain: 'A card you see leaves the deck and its group. Reread the wording for "you see", "face up" or "revealed".' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Unseen → ignore (any position is a uniform card). Seen → remove from deck and from group. First among k special cards → each 1/k.' },

    S('contrast'),
    { type: 'compare', columns: ['Situation', 'What changes', 'P(card in question is a heart)'], rows: [
      ['top card, nothing known', 'nothing', '13/52'],
      ['30th card, 29 above it unseen', 'nothing', '13/52'],
      ['bottom card, top card seen as a heart', 'deck 51, hearts 12', '12/51'],
      ['bottom card, top card seen as a spade', 'deck 51, hearts 13', '13/51'],
      ['first heart before first spade', 'only the 26 hearts and spades matter', '13/26'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: burn 51 cards unseen and the last card is still red with 1/2. See all 26 reds and the rest are certainly black. With one special card of each kind (the ace of spades against the king of spades) the order is still 1/2; with 4 aces against 1 king it becomes 4/5.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'You see the top card is a spade. P(the bottom card is a heart)?', options: [fr(13, 51), fr(12, 51), fr(13, 52), fr(12, 52)], answer: 0, traps: { 1: 'removed a heart, but the seen card was a spade', 2: 'ignored the seen card', 3: 'removed a heart and ignored the deck shrinking' }, explain: 'The spade leaves the deck but not the hearts: 13/51.' },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the third ball drawn from an urn is red with r/(r + b), exactly like the first (bto/urn-draws). "Seen versus unseen" is the heart of Monty Hall, where what the host shows depends on what he knows (bto/monty-hall). And P(the second card is an ace) = 4/52 before you look at the first (bto/card-draws).' },
    { type: 'variation', base: 'Shuffled deck, top 10 cards discarded face down. P(the 11th card is red) = 1/2.', rows: [
      { change: 'Discard 30 cards instead of 10', effect: 'No change: 1/2. More unseen cards are still no information.', same: true },
      { change: 'Ask about the bottom card instead of the 11th', effect: 'No change: every position of a fair shuffle is a uniform card.', same: true },
      { change: 'Turn the top card face up: it is red', effect: `Now there is information: ${fr(25, 51)}. The seen red leaves the deck and the reds; the unseen discards still do nothing.` },
      { change: 'Ask for a heart instead of red', effect: `The group shrinks, the symmetry stays: ${fr(13, 52)}.` },
      { change: 'Ask for a heart and turn the top card up: a heart', effect: `The group sets the start (13 of 52) and the seen heart removes one from both: ${fr(12, 51)}. Each change touches a different part of the fraction.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.pick([20, 30, 40]); const r = rng.int(3, 8); const d = rng.int(2, 6); return mc(rng, `A shuffled pile of ${n} raffle tickets holds ${r} winners. The top ${d} tickets are removed without anyone looking. P(the next ticket is a winner)?`, fr(r, n), [[fr(r, n - d), `kept all ${r} winners in a pile of ${n - d}`], [fr(Math.max(r - d, 0), n - d), 'assumed every removed ticket was a winner'], [fr(1, n), 'answered for one specific ticket']], `Unseen removals change nothing: ${r}/${n} = ${fr(r, n)}.`); } },
      far: { type: 'choice', q: 'Twelve candidates are interviewed in random order; 3 are strong. A colleague ran the first 4 interviews and has told you nothing. P(the 5th candidate is strong)?', options: [fr(3, 12), fr(3, 8), fr(1, 12), fr(3, 11)], answer: 0, traps: { 1: 'shrank the pool by the 4 interviews you know nothing about', 2: 'answered for one named candidate', 3: 'removed one candidate as if you had seen who it was' }, explain: 'The 5th slot of a random order is a uniform candidate: 3 of 12.' },
      principle: { type: 'choice', q: 'Which idea carried over from cards to tickets and candidates?', options: ['Unseen removals leave every position a uniform draw', 'Removed items shrink the pool, so divide by fewer', 'Removed items were probably the common kind', 'Later positions have different odds from the first'], answer: 0, traps: { 1: 'they also remove good items on average; the effects cancel', 2: 'unseen items could be anything; assuming a kind invents information', 3: 'a fair shuffle treats every position alike' }, explain: 'Probabilities change only with information. Unseen removals average out; only seen items are removed from their group.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'card-symmetry', section: 'bto', count: 3 },
  ],
};
