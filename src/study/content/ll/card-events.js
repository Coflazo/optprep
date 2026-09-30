// Likelihood List family: card statement triples (no picture). Two-card facts come from fixing the
// first card (the second is uniform over 51); hands from complements written as products; positions
// of a named card from symmetry. Every value is an exact fraction computed here.
import { Q } from '../../../core/rational.js';
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const q = (n, d = 1) => Q.of(n, d);
const CB = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = (r * (BigInt(n) - BigInt(k) + i)) / i; return r; };
const hyperNone = (bad, k) => new Q(CB(52 - bad, k), CB(52, k)); // no card of a type with `bad` copies in k cards
const TWO = { pair: q(3, 51), suit: q(12, 51), red: q(26, 52).mul(q(25, 51)), sameCol: q(25, 51), diffCol: q(26, 51), oneAce: q(2 * 4 * 48, 52 * 51) };
// Unreduced two-card fractions as they are derived (matches among the other 51), for display.
const TX = { pair: `${4 - 1}/51`, suit: `${13 - 1}/51`, red: TWO.red.toString(), sameCol: `${26 - 1}/51`, diffCol: `${26}/51` };
const SUIT102 = `${(13 - 1) * 2}/102`;
const LADDER = [['pair', TWO.pair, TX.pair], ['same suit', TWO.suit, TX.suit], ['both red', TWO.red, TX.red], ['same colour', TWO.sameCol, TX.sameCol], ['different colours', TWO.diffCol, TX.diffCol]];
const ACE = (k) => q(1).sub(hyperNone(4, k)), HEART = (k) => q(1).sub(hyperNone(13, k));
const PAIR5 = q(1).sub(new Q(CB(13, 5) * 4n ** 5n, CB(52, 5))), NOACE13 = hyperNone(4, 13), FLUSH = new Q(4n * CB(13, 5), CB(52, 5));
const CH = [['(a) same suit', TWO.suit, TX.suit], ['(b) different colours', TWO.diffCol, TX.diffCol], ['(c) both red', TWO.red, TX.red]].sort((a, b) => b[1].cmp(a[1]));

// Pool for the ranking checks.
const POOL = {
  pair: () => ['Two dealt cards form a pair.', TWO.pair],
  suit: () => ['Two dealt cards have the same suit.', TWO.suit],
  red: () => ['Two dealt cards are both red.', TWO.red],
  diffCol: () => ['Two dealt cards have different colours.', TWO.diffCol],
  aceHand: (r) => { const k = r.int(3, 7); return [`A ${k}-card hand has at least one ace.`, ACE(k)]; },
  heartHand: (r) => { const k = r.int(2, 5); return [`A ${k}-card hand has at least one heart.`, HEART(k)]; },
  topK: (r) => { const k = r.pick([5, 10, 13, 20, 26]); return [`The ace of spades is among the top ${k} cards.`, q(k, 52)]; },
  noAce13: () => ['A 13-card hand has no ace.', NOACE13],
};

export default {
  id: 'll/card-events',
  book: 'll',
  kind: 'family',
  family: 'card-events',
  title: 'Card statement triples',
  summary: 'Two cards: fix the first, the second is uniform over 51. Hands: complement as a product. Positions: symmetry.',
  prerequisites: ['bto/card-draws', 'bto/card-symmetry', 'prob/complement'],
  objectives: [
    'Give pair, same suit, both red, same colour and different colours for two cards from one idea',
    'Price "at least one X in a k-card hand" as 1 minus a product of shrinking fractions',
    'Use symmetry for the position of a named card and for cards burned unseen',
    'Separate close two-card statements (same suit against both red) exactly',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: two cards are dealt from a shuffled 52-card deck. Rank: (a) they have the same suit, (b) they have different colours, (c) they are both red. Two approaches, then an order.', answer: CH.map(([t, p, x]) => `${t} ${x} ≈ ${dp(p)}`).join(' > '), explain: `Fix the first card. (b): 26 of the other 51 have the other colour, ${TX.diffCol}. (a): 12 of the 51 share its suit, ${TX.suit}. (c): 26/52 × 25/51 = ${TX.red}. (a) and (c) are close: ${TX.suit} = ${SUIT102} against ${TX.red}. If you put same suit first among those two, you rounded too early.` },
    { type: 'text', text: 'There is **no picture**: three statements about cards from a well-shuffled 52-card deck. They come in three shapes: two cards dealt (pair, same suit, colours, exactly one ace), a hand of k cards (at least one ace, at least one heart, a pair or better, a flush), and the position of one named card (the ace of spades in the top k, the next card after some are burned).' },
    { type: 'text', text: 'Not this lesson: dice (independent throws, no removal) and coin strings. Cards are drawn **without replacement**: each card dealt changes what is left, and that single fact is behind every value below.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, '"The ace of spades is among the top 10 cards." Which shape is it?', 'the position of one named card', [['two cards dealt', 'ten cards are involved, but only one card is named'], ['a hand of k cards with at least one of a kind', 'there is exactly one ace of spades, so this is about where it sits'], ['a dice statement', 'a deck is dealt without replacement']], 'One named card: symmetry makes its position uniform.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Card triples mix quick two-card facts with hand-level complements, and they like to pair two statements that are almost equal (same suit against both red). Recognising each shape in a second, and knowing when to keep exact fractions, is the whole skill. The values are small fractions you can carry in your head, so a card item should be the fastest in the section once the five two-card facts and the complement rule are automatic.' },

    S('anchor'),
    { type: 'text', text: 'You know one card: uniform over 52. Every statement here is that fact plus **one move**: condition on a first card (two-card facts), take the complement as a product (hands), or use symmetry (positions). Removal is the only thing that makes cards different from dice: each dealt card leaves one fewer of its kind and one fewer in total.' },
    { type: 'check', scope: 'one card is uniform', questions: [
      { make: (rng) => { const [t, n] = rng.pick([['a heart', 13], ['a king', 4], ['a red card', 26], ['a face card (J, Q, K)', 12]]); return { type: 'number', q: `One card is drawn. P(${t})? (3 decimals)`, answer: n / 52, tolerance: 0.0015, explain: `${n}/52 = ${dp(n / 52)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Same suit as a tree. The first card can be anything; only the second card has to match.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'first card: any', children: [{ p: '12/51', label: 'second has its suit', mark: true }, { p: '39/51', label: 'second differs' }] }, total: TWO.suit.toString() }, caption: `12 of the remaining 51 cards share the first card's suit: ${TX.suit} ≈ ${dp(TWO.suit)}. No 1/4 × 1/4 anywhere: the first card sets the target.` },
    { type: 'check', scope: 'fix the first card', questions: [
      { make: (rng) => { const [t, n, w] = rng.pick([['form a pair (same rank)', 3, 'used 4 matching cards: the first card itself is gone'], ['have the same suit', 12, 'used 13 matching cards: the first card itself is gone'], ['have different colours', 26, 'used 25: only the first card\'s own colour lost a card']]); return mc(rng, `Two cards are dealt. P(they ${t})?`, `${n}/51`, [[`${n + (n === 26 ? -1 : 1)}/51`, w], [`${n}/52`, 'divided by 52: one card is already out'], [`${n + (n === 26 ? 0 : 1)}/52 × ${n}/51`, 'demanded a specific first card instead of letting it be anything']], `The first card can be anything; ${n} of the other 51 qualify.`); } },
    ] },
    { type: 'text', text: 'Both red as a tree. Now the first card has a condition too, so both branches carry a fraction.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: '', children: [{ p: '26/52', label: 'first red', children: [{ p: '25/51', label: 'second red', mark: true }, { p: '26/51', label: 'second black' }] }, { p: '26/52', label: 'first black' }] }, total: TWO.red.toString() }, caption: `26/52 × 25/51 = ${TWO.red} ≈ ${dp(TWO.red)}: just above same suit (${dp(TWO.suit)}). Same colour (either both red or both black) doubles it: ${TX.sameCol}.` },
    { type: 'check', scope: 'sequential products', questions: [
      { make: (rng) => { const [t, n] = rng.pick([['both hearts', 13], ['both aces', 4], ['both face cards', 12], ['both black', 26]]); const v = q(n, 52).mul(q(n - 1, 51)); return { type: 'number', q: `Two cards are dealt. P(${t})? (4 decimals)`, answer: v.toNumber(), tolerance: 0.00015, hints: [`First: ${n}/52.`, `Second: ${n - 1}/51.`], explain: `${n}/52 × ${n - 1}/51 = ${v} ≈ ${dp(v, 4)}.` }; } },
    ] },
    { type: 'text', text: 'The two-card ladder: five statements every card item draws from, in order.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Two cards dealt', xLabel: 'statement', yLabel: 'probability', categories: LADDER.map(([t]) => t), series: [{ name: 'P', values: LADDER.map(([, p]) => Number(p.toNumber().toFixed(3))) }] }, caption: `${LADDER.map(([t, , x]) => `${t} ${x}`).join(' < ')}. Same colour sits just below 1/2, different colours just above: 25 against 26 of the other 51.` },
    { type: 'check', scope: 'the two-card ladder', questions: [
      mc(null, 'Which is more likely for two dealt cards: same suit or both red?', 'both red', [['same suit', `rounded ${TX.suit} and ${TX.red} to the same size and guessed; exactly, ${SUIT102} < ${TX.red}`], ['equal', `both are near ${dp(TWO.suit, 2)}, but ${TX.suit} = ${SUIT102} is one 102nd short`]], `Both red ${TX.red} against same suit ${TX.suit} = ${SUIT102}.`, { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves: one for two-card facts, one for sequences of specific cards, one for hands, one for positions. Each statement needs exactly one of them, so the first job on every item is to say which.' },
    { type: 'steps', steps: [
      { say: 'Two cards, a relation between them (same rank, suit or colour): fix the first card; the second is uniform over the other 51. Count the matches left.', why: 'Whatever the first card is, the count of matching cards left is the same, so the first card drops out.',
        checks: [{ make: (rng) => { const ok = rng.pick([['same rank', 3], ['same suit', 12], ['same colour', 25]]); return { type: 'number', q: `Two cards: how many of the remaining 51 have the ${ok[0]} as the first?`, answer: ok[1], explain: `${ok[1]}: the first card's own copy is gone.` }; } }] },
      { say: 'Two cards, each with its own condition (both red, both aces): multiply the chances in order, shrinking both top and bottom.', why: 'Without replacement, the second draw sees one fewer card of the kind and one fewer card in total.',
        checks: [{ type: 'number', q: 'P(exactly one of two dealt cards is an ace)? (4 decimals)', answer: TWO.oneAce.toNumber(), tolerance: 0.00015, hints: ['Ace then non-ace, or non-ace then ace.', '2 × 4/52 × 48/51.'], explain: `2 × 4/52 × 48/51 = ${TWO.oneAce} ≈ ${dp(TWO.oneAce, 4)}.` }] },
      { say: 'Hands: P(at least one X in k cards) = 1 − P(no X) = 1 − (non-X)/52 × (non-X − 1)/51 × … (k factors).', why: '"None" is one sequential product; "at least one" would need many cases.',
        checks: [{ make: (rng) => { const k = rng.int(2, 5); return { type: 'number', q: `P(a ${k}-card hand has at least one ace)? (3 decimals)`, answer: ACE(k).toNumber(), tolerance: 0.0015, hints: ['Complement: no ace at all.', `48/52 × 47/51 × … (${k} factors).`], explain: `1 − ${Array.from({ length: k }, (_, i) => `${48 - i}/${52 - i}`).join(' × ')} = ${dp(ACE(k))}.` }; } }] },
      { say: 'One named card: its position is uniform over 52, so P(in the top k) = k/52. Cards burned unseen change nothing: the next card is red with 1/2.', why: 'A shuffle treats every position alike; unseen cards carry no information.',
        checks: [{ hinge: true, make: (rng) => { const d = rng.int(5, 20); return mc(rng, `${d} cards are burned face down, unseen. P(the next card is red)?`, '1/2', [[`${26 - Math.floor(d / 2)}/${52 - d}`, 'guessed how many reds were burned: unseen cards give no information'], [`26/${52 - d}`, 'removed the burned cards from the total but not from the reds'], ['it cannot be known', 'unknown is not uninformative: by symmetry every position is red with 1/2']], 'By symmetry, any single position is red with probability 26/52.'); } }] },
    ] },
    { type: 'explain', prompt: 'Explain why "two cards have the same suit" is 12/51 and not 13/52 × 12/51 or 1/4.', model: 'The first card can be any card, so it has no cost: probability 1. The only requirement is that the second card matches its suit, and of the 51 cards left, 12 do. 13/52 × 12/51 is the chance of two cards of one specific suit such as hearts; 1/4 forgets that the first card has used up one card of its suit.', points: ['The first card is free (probability 1)', 'The second must match: 12 of the remaining 51', '13/52 × 12/51 fixes a specific suit, which is a different event'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'card-events', difficulty: 2, seed: 'a', intro: 'Two-card statements and a symmetry fact. Price each one. Try it first.' },
    { type: 'worked', section: 'll', family: 'card-events', difficulty: 3, seed: 'b', fade: 1, intro: 'Hand statements. The complements are worked out; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'Two cards: same suit or different colours, which is more likely?', answer: `Different colours: ${TX.diffCol} ≈ ${dp(TWO.diffCol, 2)} against ${TX.suit} ≈ ${dp(TWO.suit, 2)}.`, explain: 'A colour holds 26 cards, a suit 13.' },

    S('traps'),
    { type: 'text', text: 'Card traps come from treating the deck as if cards were replaced (52 in every denominator), from fixing a specific suit or rank when the statement leaves it free, and from rounding close fractions before comparing them. The erroneous solution below shows the first one inside a hand calculation, where it is easiest to miss because every factor looks plausible.' },
    { type: 'traps', section: 'll', family: 'card-events', extra: [
      { belief: 'Two cards have the same suit with 1/4.', fix: `The first card uses up one of its suit: ${TX.suit}, slightly less.` },
      { belief: 'Same suit is 13/52 × 12/51.', fix: `That is two hearts. The suit is free: 4 times that, ${q(4).mul(q(13, 52)).mul(q(12, 51))} = ${TX.suit}.` },
      { belief: 'Burned unseen cards change the chance of the next card.', fix: 'By symmetry the next card is red with 1/2.' },
      { belief: `Same suit and both red are equal because both are about ${dp(TWO.suit, 2)}.`, fix: `Keep fractions: ${SUIT102} against ${TX.red}.` },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(a 5-card hand has at least one ace). One step is wrong.', steps: [
      'Complement: P(no ace in 5 cards).',
      'Each card is a non-ace with 48/52, so P(no ace) = (48/52)^5.',
      `So P(at least one ace) = 1 − (48/52)^5 ≈ ${dp(1 - (48 / 52) ** 5)}.`,
      'It ranks above "at least one heart in 2 cards".',
    ], errorStep: 1, explain: `Without replacement the fractions shrink: 48/52 × 47/51 × 46/50 × 45/49 × 44/48. P(at least one ace) = ${ACE(5)} ≈ ${dp(ACE(5))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'A candidate answers P(two cards both red) = 1/4. Which belief?', 'Treated the second draw as if the first card were replaced', [['Fixed a specific suit', 'no suit is involved'], ['Used symmetry of positions', 'symmetry gives single-card facts, not pairs'], ['Took the complement', 'no complement was taken']], `(26/52)^2 = ${q(26, 52).mul(q(26, 52))} assumes replacement; the truth is 26/52 × 25/51 = ${TX.red}.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise the two-card ladder: pair ${TX.pair}, same suit ${TX.suit}, both red ${TX.red}, same colour ${TX.sameCol}, different colours ${TX.diffCol}. Most two-card triples are then a lookup.` },
    { type: 'callout', tone: 'speed', text: `Hand landmarks: at least one ace in 5 cards ≈ ${dp(ACE(5), 2)}, a pair or better in 5 ≈ ${dp(PAIR5, 2)}, no ace in 13 ≈ ${dp(NOACE13, 2)}, a flush ≈ ${dp(FLUSH, 4)}. Budget: ${LL.exam.perItemSeconds} seconds; with the ladder most items take 20.` },
    { type: 'check', scope: 'the ladder and hand landmarks', questions: [
      { make: (rng) => again(() => { const keys = rng.shuffle(Object.keys(POOL)).slice(0, 3); return rank(rng, 'Rank from most to least likely (a well-shuffled 52-card deck).', keys.map((k) => POOL[k](rng)), 'Ladder values, hand complements and k/52 for a named card.', { gap: 0.02 }); }) },
    ] },

    S('rule'),
    { type: 'text', text: 'Say the shape first (a relation between two cards, specific kinds, a hand, a named card), then apply its one move. Keep fractions until two statements have been compared, then convert only if you must.' },
    { type: 'callout', tone: 'rule', text: 'Cards → two cards: fix the first, count matches among 51. Specific kinds: shrinking products. Hands: 1 − product of "not X" draws. A named card: k/52; unseen burns change nothing.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Method', 'Value'], rows: [
      ['same colour', 'fix the first, 25 of 51', TX.sameCol],
      ['same suit', 'fix the first, 12 of 51', TX.suit],
      ['both red', '26/52 × 25/51', TX.red],
      ['at least one ace in 5', '1 − 48/52 × … × 44/48', `≈ ${dp(ACE(5))}`],
      ['ace of spades in the top 13', 'symmetry', q(13, 52).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: five cards always contain two of the same suit (four suits, pigeonhole), so that statement is certain. A 13-card hand can hold all four aces, so "no ace" is neither 0 nor 1.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: urn draws in Beat the Odds (without replacement), collisions ("all different" as a shrinking product), and impossible-and-certain statements (pigeonhole with suits).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'P(5 dealt cards include at least two of the same suit)?', '1', [[`${dp(PAIR5, 3)}`, 'answered "two of the same rank", a different statement'], [TX.suit, 'used the two-card same-suit fact for five cards'], ['3/4', 'guessed; five cards into four suits must repeat one']], 'Four suits, five cards: pigeonhole.', { at: 0 }),
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'card-events', count: 3 },
  ],
};
