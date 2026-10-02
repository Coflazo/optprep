// Drawing cards without replacement: the chain rule with shrinking counts, a free first card when it
// only sets a target, and the complement for "at least one". Every number shown is computed here.
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

// All k cards from a group of `good` (without replacement): good/52 × (good − 1)/51 × …
const allFrom = (good, k) => { let p = Q.of(1); for (let i = 0; i < k; i++) p = p.mul(Q.of(good - i, 52 - i)); return p; };
const qpow = (x, k) => { let r = Q.of(1); for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const atLeastOne = (good, k) => Q.of(1).sub(allFrom(52 - good, k));
const chainText = (good, k) => Array.from({ length: k }, (_, i) => `${good - i}/${52 - i}`).join(' × ');
const diffRanks = (k) => { let p = Q.of(1); for (let i = 0; i < k; i++) p = p.mul(Q.of(52 - 4 * i, 52 - i)); return p; };
const FLUSH = Q.of(4).mul(allFrom(13, 5));
const TWO_ACES = allFrom(4, 2);
const d3 = (x) => (Math.round(x.toNumber() * 1000) / 1000).toFixed(3);
const d4 = (x) => (Math.round(x.toNumber() * 10000) / 10000).toFixed(4);
const words = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
const KS = [1, 2, 3, 4, 5, 6];
const SAME3 = Q.of(12, 51).mul(Q.of(11, 50)); // three cards, same suit
// Chain over a pool of n items with g good: all k good.
const poolAll = (g, n, k) => { let p = Q.of(1); for (let i = 0; i < k; i++) p = p.mul(Q.of(g - i, n - i)); return p; };

export default {
  id: 'bto/card-draws',
  book: 'bto',
  kind: 'family',
  family: 'card-draws',
  title: 'Cards without replacement',
  summary: 'Multiply (good left)/(cards left) draw by draw. A first card that only sets a target is free. "At least one" = 1 − P(none).',
  prerequisites: ['bto/card-symmetry', 'bto/at-least-one'],
  objectives: [
    'Write the chain of shrinking fractions for any hand: two aces, all red, a flush',
    'Recognise when the first card only sets a target and gets factor 1 (pairs, same suit, same colour)',
    'Compute "at least one ace in k cards" through the complement with a shrinking product',
    'Know the two-card staples: pair 3/51, same suit 12/51, same colour 25/51, two aces 1/221',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: two cards are dealt from a shuffled deck. What is the probability that both are aces? Try two different approaches.', answer: `4/52 × 3/51 = ${TWO_ACES}`, explain: `Chain: the first is an ace with 4/52, then 3 aces remain among 51. Counting: C(4,2) = 6 ace pairs out of C(52,2) = 1326 pairs. If you got 1/169 you put the first card back; if you got 2/221 you doubled for the orders, which the chain already includes.`, attempts: [
      { id: 'replace', label: 'Same 4/52 for both cards', approach: '(4/52)² = 1/169.', breaksAt: 'The first ace is gone: only 3 aces remain, among 51 cards.' },
      { id: 'free-first', label: 'First card free', approach: 'The first card only sets the target, so 1 × 3/51.', breaksAt: '"Both aces" names the target, so card 1 must be an ace too and is charged 4/52.' },
      { id: 'double', label: 'Double for the two orders', approach: `4/52 × 3/51, then × 2 for the two orders: ${TWO_ACES.mul(Q.of(2))}.`, breaksAt: 'The chain already covers every order: "an ace, then another ace" never says which ace comes first.' },
    ] },
    { type: 'text', text: 'Several cards are dealt from one shuffled deck, so they are drawn **without replacement**, and the question asks about the hand: both aces, a pair, same suit or colour, all red, at least one ace or heart, no two of the same rank, a flush.' },
    { type: 'list', items: ['"Two cards are dealt. Probability both are aces?"', '"Two cards: probability they have the same rank?"', '"Five cards: probability of at least one ace?"', '"Five cards: probability all five are the same suit?"'] },
    { type: 'check', scope: 'a hand without replacement', questions: [
      { type: 'choice', q: '"Three cards are dealt. Probability that all three have different ranks?" What does it ask about?', options: ['the hand: no two of one rank', 'one card at a position', 'a pair in the hand', 'a flush'], answer: 0, traps: { 1: 'three cards dealt together are judged as a hand', 2: 'a pair needs two of the same rank', 3: 'a flush is about suits, not ranks' }, explain: 'All different ranks is a property of the hand: no two cards share a rank.' },
    ] },
    { type: 'text', text: 'Not this lesson: one card at a position (bto/card-symmetry) and balls of two colours (bto/urn-draws, same maths with simpler groups). Here the hand has several cards and both counts shrink with every draw.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Four cards: probability all are hearts', 'The 20th card: probability it is a heart', 'Top card shown as a heart: probability the bottom card is a heart', 'First ace before first king'], answer: 0, traps: { 1: 'one position: bto/card-symmetry', 2: 'one position after a seen card: bto/card-symmetry', 3: 'relative order: bto/card-symmetry' }, explain: 'A hand of four cards dealt without replacement.' },
    ] },

    S('why'),
    { type: 'text', text: 'Most card questions are "deal a few cards" questions. The whole method is one habit: after every card, lower both the good count and the deck. Each wrong option in these questions comes from breaking that habit in one specific way (the deck stays at 52, the good count stays put, the first card is charged when it should be free, or the orders are counted twice).' },

    S('anchor'),
    { type: 'text', text: 'One card: P(good) = good/52 (bto/card-symmetry). A hand is the same fraction repeated, with **one change**: after each card, the numerator and the denominator both drop, because that card is gone. It is the die-repeats walk with a deck that shrinks.' },
    { type: 'check', scope: 'one card, then both counts drop', questions: [
      { make: (rng) => { const g = rng.pick([[4, 'an ace'], [13, 'a heart'], [26, 'red'], [12, 'a face card']]); return mc(rng, `The first card dealt was ${g[1]}. P(the second card is also ${g[1]})?`, fr(g[0] - 1, 51), [[fr(g[0], 52), 'put the first card back'], [fr(g[0] - 1, 52), 'lowered the good count but not the deck'], [fr(g[0], 51), 'lowered the deck but not the good count']], `${g[0] - 1} left among 51.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw two cards as a tree. Every branch carries (good left)/(cards left) at that moment. For two aces, only the top path works.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'deal', children: [
      { p: '4/52', label: 'card 1 ace', children: [{ p: '3/51', label: 'card 2 ace', mark: true }, { p: '48/51', label: 'card 2 not ace' }] },
      { p: '48/52', label: 'card 1 not ace', children: [{ p: '4/51', label: 'card 2 ace' }, { p: '47/51', label: 'card 2 not ace' }] },
    ] }, total: TWO_ACES.toString() }, caption: `Both aces: 4/52 × 3/51 = ${TWO_ACES}. The second-draw fractions differ by branch: 3/51 after an ace, 4/51 after a non-ace. That dependence is what "without replacement" means.` },
    { type: 'check', scope: 'the two-card tree', questions: [
      { type: 'choice', q: 'From the tree: P(exactly one ace in two cards)?', options: [Q.of(4, 52).mul(Q.of(48, 51)).add(Q.of(48, 52).mul(Q.of(4, 51))).toString(), Q.of(4, 52).mul(Q.of(48, 51)).toString(), Q.of(8, 52).toString(), Q.of(1).sub(TWO_ACES).toString()], answer: 0, traps: { 1: 'counted only "ace first"', 2: 'added 4/52 twice', 3: 'answered "not both aces"' }, explain: 'Two marked paths: ace then non-ace, or non-ace then ace.' },
    ] },
    { type: 'text', text: 'When the question does not name the suit, rank or colour, the first card only **sets the target**. It cannot fail, so its factor is 1. Only the second card has to match.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Two cards', 'card 1', 'card 2 must', 'P'], rows: [
      ['same rank (a pair)', 'anything: 1', 'be 1 of 3 left of that rank, among 51', fr(3, 51)],
      ['same suit', 'anything: 1', 'be 1 of 12 left of that suit', fr(12, 51)],
      ['same colour', 'anything: 1', 'be 1 of 25 left of that colour', fr(25, 51)],
      ['both aces', 'an ace: 4/52', 'be 1 of 3 aces left', TWO_ACES.toString()],
    ] }, caption: 'The first three rows name no target, so card 1 is free. The last row names aces, so card 1 is charged 4/52 too.' },
    { type: 'check', scope: 'a free first card', questions: [
      { type: 'choice', q: 'Two cards. P(they have the same rank)?', options: [fr(3, 51), fr(1, 13), fr(4, 51), fr(1, 221)], answer: 0, traps: { 1: 'put the first card back (4/52)', 2: 'left 4 of that rank; one is already dealt', 3: 'required a specific pair such as two aces' }, explain: 'Card 1 free, then 3 of its rank among 51: 1/17.' },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'P(all k cards red)', xLabel: 'cards k', yLabel: 'probability', categories: KS.map(String), series: [{ name: 'with replacement (1/2)^k', values: KS.map((k) => Math.round(qpow(Q.of(1, 2), k).toNumber() * 1000) / 1000) }, { name: 'dealt from one deck', values: KS.map((k) => Math.round(allFrom(26, k).toNumber() * 1000) / 1000) }], valueLabels: true }, caption: 'For one card the two agree. After that the dealt hand falls faster, because each red card dealt makes the next red less likely. The gap is small for two cards and grows with the hand.' },
    { type: 'check', scope: 'why the dealt bars are lower', questions: [
      { make: (rng) => { const k = rng.int(3, 5); return mc(rng, `${words[k]} cards are dealt. P(all red)?`.replace(/^./, (c) => c.toUpperCase()), allFrom(26, k).toString(), [[qpow(Q.of(1, 2), k).toString(), 'used 1/2 for every card, as if each went back'], [allFrom(26, k).mul(Q.of(2)).toString(), 'answered "all the same colour"'], [Q.of(1).sub(allFrom(26, k)).toString(), 'answered "at least one black"']], `${chainText(26, k)} = ${allFrom(26, k)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'replace', say: 'Chain rule: P(card 1 good and card 2 good) = P(card 1 good) × P(card 2 good | card 1 good). Each factor is (good left)/(cards left).', why: 'After a card is dealt, the remaining cards are a uniform deck of 51, so the conditional chance is a plain fraction of what is left.',
        checks: [
          { make: (rng) => { const g = rng.pick([[4, 'aces'], [13, 'hearts'], [12, 'face cards']]); return mc(rng, `Two cards. P(both are ${g[1]})?`, allFrom(g[0], 2).toString(), [[qpow(Q.of(g[0], 52), 2).toString(), 'kept the first card in the deck'], [Q.of(g[0], 52).mul(Q.of(g[0] - 1, 52)).toString(), 'lowered the good count but left the deck at 52'], [Q.of(g[0], 52).mul(Q.of(g[0], 51)).toString(), 'lowered the deck but not the good count']], `${chainText(g[0], 2)} = ${allFrom(g[0], 2)}.`); } },
        ] },
      { answers: 'free-first', say: 'If the event names no target, the first card only sets one, so its factor is 1: same suit = 1 × 12/51.', why: 'Every first card is fine; the question is only whether later cards match it.',
        checks: [
          { type: 'choice', q: 'Three cards. P(all the same suit)?', options: [Q.of(12, 51).mul(Q.of(11, 50)).toString(), Q.of(13, 52).mul(Q.of(12, 51)).mul(Q.of(11, 50)).toString(), qpow(Q.of(1, 4), 2).toString(), Q.of(12, 51).toString()], answer: 0, traps: { 1: 'charged the first card 13/52: that is "all hearts"', 2: 'used 1/4 for each later card, as if with replacement', 3: 'only checked the second card' }, explain: `1 × 12/51 × 11/50 = ${Q.of(12, 51).mul(Q.of(11, 50))}.` },
        ] },
      { answers: 'double', say: 'All k cards from a group of g: g/52 × (g − 1)/51 × … (k factors). The same value as C(g, k)/C(52, k), counting hands.', why: 'The chain counts ordered deals; dividing ordered counts by k! on top and bottom gives the hand count, so the two routes agree.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 4); return { type: 'number', q: `${words[k]} cards are dealt. P(all are hearts)? Give 4 decimals.`.replace(/^./, (c) => c.toUpperCase()), answer: Math.round(allFrom(13, k).toNumber() * 10000) / 10000, tolerance: 0.00015, hints: ['Start at 13/52.', `Lower both counts each card: ${chainText(13, k)}.`], explain: `${chainText(13, k)} = ${allFrom(13, k)} ≈ ${d4(allFrom(13, k))}.` }; } },
        ] },
      { say: 'At least one: 1 − P(none), where "none" is a chain over the non-good cards: at least one ace in k cards = 1 − 48/52 × 47/51 × …', why: 'The at-least-one rule, with the shrinking product in place of (48/52)^k.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `${words[k]} cards are dealt. P(at least one ace)?`.replace(/^./, (c) => c.toUpperCase()), `1 − ${chainText(48, k)}`, [[Array(k).fill('4/52').join(' + '), 'added 4/52 per card: hands with two aces counted twice'], [`1 − ${Array(k).fill('48/52').join(' × ')}`, 'used 48/52 for every card, as if dealt with replacement'], [chainText(48, k), 'answered P(no ace)']], `1 − ${allFrom(48, k)} ≈ ${d3(atLeastOne(4, k))}.`); } },
        ] },
      { say: 'No two cards share a rank: each new card must avoid every rank used so far, 4 cards fewer each time: 52/52 × 48/51 × 44/50 × …', why: 'The die-repeats "all different" walk, with 4 cards per rank and a deck that shrinks by one.',
        checks: [
          { type: 'choice', q: 'Three cards. P(all different ranks)?', options: [diffRanks(3).toString(), Q.of(12, 13).mul(Q.of(11, 13)).toString(), qpow(Q.of(48, 51), 2).toString(), Q.of(1).sub(diffRanks(3)).toString()], answer: 0, traps: { 1: 'treated ranks as drawn with replacement', 2: 'only made each card avoid the first card\'s rank', 3: 'answered "at least one pair"' }, explain: `1 × 48/51 × 44/50 = ${diffRanks(3)}.` },
        ] },
    ] },
    { type: 'text', text: `A second route, useful for mixed hands: count **hands** instead of ordered deals. Two cards from 52 make C(52,2) = ${52 * 51 / 2} equally likely hands. Two aces are C(4,2) = 6 of them, so P = 6/${52 * 51 / 2} = ${TWO_ACES}, the chain's answer. One ace and one king are 4 × 4 = 16 hands, ${Q.of(16, 52 * 51 / 2)}: no orders to remember, because a hand has none. Use the chain when every card comes from one group, and hand counting when the hand mixes groups.` },
    { type: 'check', scope: 'counting hands with C(n, k)', questions: [
      { make: (rng) => { const g = rng.pick([['a heart', 13, 'a spade', 13], ['an ace', 4, 'a king', 4], ['a red card', 26, 'a black card', 26], ['a heart', 13, 'an ace of another suit', 3]]); const hands = g[1] * g[3]; return mc(rng, `Two cards. P(one is ${g[0]} and the other is ${g[2]})?`, Q.of(hands, 1326).toString(), [[Q.of(g[1], 52).mul(Q.of(g[3], 51)).toString(), 'counted only one order of the two cards'], [Q.of(g[1], 52).mul(Q.of(g[3], 52)).mul(Q.of(2)).toString(), 'put the first card back'], [Q.of(g[1] + g[3], 52).toString(), 'added the two groups']], `${g[1]} × ${g[3]} = ${hands} hands of 1326: ${Q.of(hands, 1326)}.`); } },
    ] },
    { type: 'explain', prompt: 'In your own words: why is P(both aces) = 4/52 × 3/51 not doubled "for the two orders", while P(one ace and one king) needs both orders?', model: 'The chain for "both aces" already covers every order of two aces: whichever ace comes first, the second factor counts all the remaining aces. For one ace and one king, the chain 4/52 × 4/51 describes only "ace then king"; "king then ace" is a different path with the same value, so it must be added.', points: ['a chain over one group already covers all orders within that group', 'mixed hands have several orders, one path each', 'add the paths (or count hands) when the cards come from different groups'] },

    S('worked'),
    { type: 'worked', family: 'card-draws', section: 'bto', difficulty: 1, seed: 'c', explainAt: [1], intro: 'A two-card hand. Try it before opening the solution.' },
    { type: 'worked', family: 'card-draws', section: 'bto', difficulty: 2, seed: 'c', fade: 1, intro: 'At least one in a bigger hand. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'Three cards are dealt from a shuffled deck. What is the probability that all three are the same suit?', lines: [
      { t: 0, say: 'Several cards from one deck: without replacement, so both counts drop each card.' },
      { t: 3, say: `Same suit: ${chainText(13, 3)} = ${allFrom(13, 3)}.`, slip: true },
      { t: 8, say: 'Wait, no suit is named. That was "all hearts". Card 1 only sets the target, so its factor is 1.' },
      { t: 12, say: `1 × 12/51 × 11/50 = ${SAME3}.` },
      { t: 16, say: `Check: it should be four times "all hearts", one per suit: 4 × ${allFrom(13, 3)} = ${allFrom(13, 3).mul(Q.of(4))}. Matches. Answer ${SAME3}.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try gave 11/850. What went wrong?', options: ['computed all hearts, but no suit was named', 'put the cards back after each draw', 'used too many factors', 'needed combinations, not factors'], answer: 0, traps: { 1: 'the counts dropped with each card, as they should', 2: 'three cards, three factors', 3: 'ordered factors work; the slip was naming a suit' }, explain: 'The first card only sets the suit: 1 × 12/51 × 11/50 = 22/425, four times "all hearts".' },
    ] },

    S('predict'),
    { type: 'predict', question: 'Two cards. Is P(same colour) above, below or equal to 1/2?', answer: `Below: ${fr(25, 51)} ≈ ${d3(Q.of(25, 51))}.`, explain: 'The first card removes one card of its own colour, so the second is slightly more likely to differ.' },

    S('traps'),
    { type: 'traps', family: 'card-draws', section: 'bto', extra: [
      { belief: 'Cards behave as if put back: (4/52)² for two aces.', fix: 'Both counts drop after every card: 4/52 × 3/51.' },
      { belief: 'The chain must be doubled for the two orders of the aces.', fix: 'A chain over one group already covers every order. Double only for mixed hands.' },
      { belief: 'The first card of a pair must be a particular rank.', fix: 'No rank is named, so the first card is free: 3/51.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(two cards are both aces). One step is wrong.', steps: [
      'P(first card is an ace) = 4/52.',
      'P(second is an ace, given the first was) = 3/51.',
      'The two aces can come in two orders, so multiply by 2.',
      `P = 2 × 4/52 × 3/51 = ${TWO_ACES.mul(Q.of(2))}.`,
    ], errorStep: 2, explain: `4/52 × 3/51 already includes every order: "an ace, then another ace" does not say which ace. Doubling counts each pair twice. Correct: ${TWO_ACES}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'A candidate answers P(both aces) = 1/169. Which belief?', options: ['The first card went back in the deck', 'Doubled the chain for the two orders', 'Treated the first card as free (factor 1)'], answer: 0, explain: `(4/52)² = 1/169. Without replacement: ${TWO_ACES}.` },
      { type: 'choice', q: 'Another answers P(pair) = 1/221. Which belief?', options: ['Required a specific pair such as two aces', 'Put the first card back in the deck', 'Counted the chance of the same suit'], answer: 0, explain: '1/221 is two aces. Any rank works: 3/51 = 1/17.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Two-card staples: pair ${fr(3, 51)}, same suit ${fr(12, 51)}, same colour ${fr(25, 51)}, two aces ${TWO_ACES}. Five-card flush ${FLUSH} ≈ ${d4(FLUSH)} (about 1 in ${Math.round(1 / FLUSH.toNumber())}).` },
    { type: 'check', scope: 'two-card staples', questions: [
      { type: 'choice', q: 'Two cards are dealt. P(they form a pair)?', options: ['1/17', '4/17', '1/221', '25/51'], answer: 0, traps: { 1: 'that is same suit', 2: 'that is two aces', 3: 'that is same colour' }, explain: 'The second card must match the rank of the first: 3/51 = 1/17.' },
    ] },
    { type: 'callout', tone: 'speed', text: `Estimation: for a small hand the "with replacement" answer is close and a little too big for "all good". Use it to throw out options, then compute the chain. Time budget ${SECTIONS.bto.exam.perItemSeconds} seconds: two-card items are recall; five-card chains take a minute, so reduce fractions as you go.` },
    { type: 'check', scope: 'staples and estimation', questions: [
      { type: 'choice', q: 'Four cards dealt. Closest value to P(all four red)?', options: [d3(allFrom(26, 4)), d3(qpow(Q.of(1, 2), 4)), d3(allFrom(26, 4).mul(Q.of(2))), '0.500'], answer: 0, traps: { 1: 'with replacement: a little too big', 2: 'all the same colour', 3: 'one card only' }, explain: `${chainText(26, 4)} ≈ ${d3(allFrom(26, 4))}, just under (1/2)⁴ = 0.0625.` },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Deal without replacement → multiply (good left)/(cards left). Unnamed target → first card free. At least one → 1 − chain over the rest.' },

    S('contrast'),
    { type: 'compare', columns: ['Two-card event', 'With replacement', 'Dealt from one deck'], rows: [
      ['both aces', fr(1, 169), TWO_ACES.toString()],
      ['same rank', fr(1, 13), fr(3, 51)],
      ['same suit', fr(1, 4), fr(12, 51)],
      ['same colour', fr(1, 2), fr(25, 51)],
      ['at least one ace', Q.of(1).sub(qpow(Q.of(48, 52), 2)).toString(), atLeastOne(4, 2).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: 5 aces in a 5-card hand is impossible (the chain hits 0/48). Any 3 cards include two of the same colour, and any 14 include two of the same rank: the chain for "all different" hits a zero factor (0/50 for colours, 0/39 for ranks).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'number', q: 'Fewest cards you must deal to be certain two share a rank?', answer: 14, explain: '13 ranks: 13 cards can all differ, the 14th must repeat one.' },
      { type: 'choice', q: 'Two cards. P(one ace and one king, in either order)?', options: [Q.of(2).mul(Q.of(4, 52)).mul(Q.of(4, 51)).toString(), Q.of(4, 52).mul(Q.of(4, 51)).toString(), Q.of(4, 52).mul(Q.of(3, 51)).toString()], answer: 0, traps: { 1: 'counted only ace-then-king: mixed hands have two orders', 2: 'used the both-aces chain' }, explain: `Two paths, each 4/52 × 4/51: ${Q.of(2).mul(Q.of(4, 52)).mul(Q.of(4, 51))}.` },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: urns are decks with two groups (bto/urn-draws). When the question counts how many of each colour you hold, counting hands with C(n, k) is faster than chains. Die throws are the with-replacement column (bto/die-repeats).' },
    { type: 'variation', base: `Two cards are dealt. P(same rank) = 1 × 3/51 = ${fr(3, 51)}.`, rows: [
      { change: 'Deal the two cards one at a time instead of together', effect: 'No change. Dealing together or in turn gives the same uniform pair of different cards.', same: true },
      { change: 'Ask for the same suit', effect: `Card 1 is still free; 12 of its suit remain: ${fr(12, 51)}.` },
      { change: 'Ask for two aces', effect: `The target is named, so card 1 is charged too: 4/52 × 3/51 = ${TWO_ACES}.` },
      { change: 'Put the first card back before the second draw', effect: `The counts no longer drop: 1 × 4/52 = ${fr(4, 52)}.` },
      { change: 'Put the first card back and ask for two aces', effect: `Naming aces charges card 1, replacement keeps both counts at 4/52: (4/52)² = ${qpow(Q.of(4, 52), 2)}. The two changes act on different factors and simply multiply.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.pick([10, 12, 15]); const d = rng.int(3, 5); return mc(rng, `A box holds ${n} bulbs, ${d} of them faulty. Two bulbs are taken out without replacement. P(both are faulty)?`, poolAll(d, n, 2).toString(), [[qpow(Q.of(d, n), 2).toString(), 'put the first bulb back'], [Q.of(d, n).mul(Q.of(d - 1, n)).toString(), 'lowered the faulty count but not the total'], [poolAll(d, n, 2).mul(Q.of(2)).toString(), 'doubled for the two orders']], `${d}/${n} × ${d - 1}/${n - 1} = ${poolAll(d, n, 2)}.`); } },
      far: { type: 'choice', q: 'An index has 10 stocks, 4 of them tech. A trader picks 3 different stocks at random. P(at least one tech stock)?', options: [Q.of(1).sub(poolAll(6, 10, 3)).toString(), Q.of(1).sub(qpow(Q.of(6, 10), 3)).toString(), poolAll(6, 10, 3).toString(), poolAll(4, 10, 3).toString()], answer: 0, traps: { 1: 'used 6/10 for every pick, as if stocks could repeat', 2: 'answered "no tech stock"', 3: 'answered "all three are tech"' }, explain: `1 − 6/10 × 5/9 × 4/8 = ${Q.of(1).sub(poolAll(6, 10, 3))}.` },
      principle: { type: 'choice', q: 'Which idea carried over from cards to bulbs and stocks?', options: ['After each pick, lower both the good count and the total', 'Each pick has the same chance as the first pick', 'Multiply by the number of orders of the picks', 'The first pick is always free, with factor 1'], answer: 0, traps: { 1: 'that is drawing with replacement', 2: 'a chain over one group already covers every order', 3: 'only when the event names no target' }, explain: 'Without replacement, every pick changes what is left: (good left)/(items left), multiplied along the picks.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'card-draws', section: 'bto', count: 3 },
  ],
};
