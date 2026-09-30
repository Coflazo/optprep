// Card statement triples: two-card events, five-card hands, symmetry facts. No visual.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { poolItem, verifyPool } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'card-events';
const C = (n, k) => nCr(n, k);
// Independent checks use sequential products or explicit pair loops (card c: rank c % 13, suit c / 13 | 0).
const seq = (goods, k) => { let p = 1; for (let i = 0; i < k; i++) p *= (goods - i) / (52 - i); return p; };
const pairs = (f) => { let h = 0, t = 0; for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) if (a !== b) { t++; if (f(a, b)) h++; } return h / t; };
const suit = (c) => Math.floor(c / 13), rank = (c) => c % 13, red = (c) => suit(c) < 2;

export const POOL = {
  twoRed: { setup: () => 'two cards dealt', gen: () => ({}), text: () => 'Two cards dealt from a shuffled deck are both red.', p: () => q(25, 102), how: () => '26/52 × 25/51.', check: () => pairs((a, b) => red(a) && red(b)) },
  sameSuit: { setup: () => 'two cards dealt', gen: () => ({}), text: () => 'Two cards dealt from a shuffled deck have the same suit.', p: () => q(12, 51), how: () => 'First card free; 12 of the remaining 51 match its suit.', check: () => pairs((a, b) => suit(a) === suit(b)) },
  pair: { setup: () => 'two cards dealt', gen: () => ({}), text: () => 'Two cards dealt from a shuffled deck form a pair (same rank).', p: () => q(3, 51), how: () => '3 of the remaining 51 match the first card\'s rank.', check: () => pairs((a, b) => rank(a) === rank(b)) },
  diffColour: { setup: () => 'two cards dealt', gen: () => ({}), text: () => 'Two cards dealt from a shuffled deck have different colours.', p: () => q(26, 51), how: () => '26 of the remaining 51 have the other colour.', check: () => pairs((a, b) => red(a) !== red(b)) },
  oneAceTwo: { setup: () => 'two cards dealt', gen: () => ({}), text: () => 'Exactly one of two dealt cards is an ace.', p: () => q(2 * 4 * 48, 52 * 51), how: () => 'Ace then non-ace or non-ace then ace: 2 × 4 × 48 / (52 × 51).', check: () => pairs((a, b) => (rank(a) === 0) !== (rank(b) === 0)) },
  aceInHand: { setup: ({ k }) => `a ${k}-card hand`, gen: (r) => ({ k: r.int(3, 7) }), text: ({ k }) => `A ${k}-card hand contains at least one ace.`, p: ({ k }) => q(1).sub(new Q(C(48, k), C(52, k))), how: ({ k }) => `1 − C(48,${k})/C(52,${k}).`, check: ({ k }) => 1 - seq(48, k) },
  heartInHand: { setup: ({ k }) => `a ${k}-card hand`, gen: (r) => ({ k: r.int(2, 5) }), text: ({ k }) => `A ${k}-card hand contains at least one heart.`, p: ({ k }) => q(1).sub(new Q(C(39, k), C(52, k))), how: ({ k }) => `1 − C(39,${k})/C(52,${k}).`, check: ({ k }) => 1 - seq(39, k) },
  pairOrBetter: { setup: () => 'a 5-card hand', gen: () => ({}), text: () => 'A 5-card hand contains at least two cards of the same rank.', p: () => q(1).sub(new Q(C(13, 5) * 4n ** 5n, C(52, 5))), how: () => '1 − C(13,5)·4^5/C(52,5): the complement is five different ranks.', check: () => { let p = 1; for (let i = 0; i < 5; i++) p *= (52 - 4 * i) / (52 - i); return 1 - p; } },
  noAceBridge: { setup: () => 'a 13-card hand', gen: () => ({}), text: () => 'A 13-card bridge hand contains no ace.', p: () => new Q(C(48, 13), C(52, 13)), how: () => 'C(48,13)/C(52,13) ≈ 0.304.', check: () => seq(48, 13) },
  aceSpadesTop: { setup: ({ k }) => `the top ${k} cards`, gen: (r) => ({ k: r.pick([5, 10, 13, 20, 26]) }), text: ({ k }) => `The ace of spades is among the top ${k} cards of a shuffled deck.`, p: ({ k }) => q(k, 52), how: ({ k }) => `Its position is uniform: ${k}/52.`, check: ({ k }) => 1 - seq(51, k) },
  topRed: { setup: ({ d }) => `burning ${d} cards`, gen: (r) => ({ d: r.int(5, 20) }), text: ({ d }) => `After ${d} cards are burned unseen, the next card is red.`, p: () => q(1, 2), how: () => 'Unseen cards change nothing: 1/2.', check: ({ d }) => { let s = 0; for (let r = 0; r <= d; r++) { const w = Number(C(26, r) * C(26, d - r)) / Number(C(52, d)); s += w * (26 - r) / (52 - d); } return s; } },
  flushFive: { setup: () => 'a 5-card hand', gen: () => ({}), text: () => 'A 5-card hand is a flush (all one suit).', p: () => new Q(4n * C(13, 5), C(52, 5)), how: () => '4·C(13,5)/C(52,5) ≈ 0.002.', check: () => 4 * seq(13, 5) },
};

export default {
  id: ID,
  section: 'll',
  title: 'Card statement triples',
  skill: 'Two-card events via the second card\'s conditional chance; hands via complements; positions via symmetry',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const keys = difficulty === 2 ? ['twoRed', 'sameSuit', 'pair', 'diffColour', 'oneAceTwo', 'topRed', 'aceSpadesTop'] : ['aceInHand', 'heartInHand', 'pairOrBetter', 'noAceBridge', 'flushFive', 'aceSpadesTop', 'diffColour'];
    return poolItem(ID, rng, difficulty, POOL, {
      keys,
      text: (list) => `A standard 52-card deck, well shuffled. The statements concern ${list}. Rank them from most to least likely.`,
      compare: 'Order the computed probabilities. Watch the near misses: two different colours (26/51) sits just above 1/2, two reds (25/102) just below 1/4.',
      rule: 'Two cards: fix the first, the second has 51 options. Hands: complement ("none") as a product. Positions: uniform.',
      anchor: 'One card is uniform over 52; each statement adds one step (a second card, a complement, or a symmetry).',
      hints: ['For two-card statements, fix the first card and ask about the second.', 'For "at least one" in a hand, use the complement.', 'Positions of a single card are uniform.'],
    });
  },

  verify(item) { return verifyPool(item, POOL); },

  lesson: {
    purpose: 'Card triples mix quick two-card facts with hand-level complements; recognising each shape in a second is the whole skill.',
    anchor: 'A single card is uniform over 52. Every statement here is that fact plus one move: a second card, a complement, or symmetry.',
    steps: [
      { say: 'Two cards: fix the first; the second is uniform over the other 51.', why: 'Conditioning on the first card.' },
      { say: 'Hands: P(at least one X) = 1 − P(no X) = 1 − C(52 − x, k)/C(52, k).', why: 'Complement.' },
      { say: 'A particular card\'s position is uniform: P(in the top k) = k/52.', why: 'Symmetry of the shuffle.' },
    ],
    predict: { question: 'Two cards: same suit or different colours, which is more likely?', answer: 'Different colours: 26/51 ≈ 0.51 against 12/51 ≈ 0.24.' },
    edge: 'Five cards in four suits always contain two of the same suit (probability 1).',
    rule: 'Pair 3/51, same suit 12/51, different colour 26/51, both red 25/102; hands via complements.',
    contrast: 'Same colour (25/51) against same suit (12/51): a colour holds 26 cards, a suit 13.',
  },
};
