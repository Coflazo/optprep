// Probability foundations 8: symmetry arguments. Positions in a shuffle, which comes first,
// duels with ties, and the n + 1 against n coins argument.
import { sec, frac, dec, round, mc, nCr, ord, diceCells, diceGrid } from './sample-spaces.js';

const ATTR = [{ name: 'a heart', n: 13 }, { name: 'an ace', n: 4 }, { name: 'red', n: 26 }, { name: 'a face card (J, Q or K)', n: 12 }];
const kthCardQ = (rng) => {
  const k = rng.int(5, 40), a = rng.pick(ATTR);
  return mc({ q: `A deck is shuffled. What is P(the ${ord(k)} card is ${a.name})?`, right: frac(a.n, 52),
    wrong: [[frac(a.n, 52 - (k - 1)), 'shrank the deck by the cards above, but you have not seen them'], [frac(1, 52), 'answered for one specific card'], [frac(a.n - 1, 51), 'removed one of them, as if it had been dealt face up']],
    explain: `Every position of a shuffled deck holds a uniformly random card: ${a.n}/52 = ${frac(a.n, 52)}.` }, rng);
};
const burnQ = (rng) => {
  const k = rng.int(3, 15);
  return mc({ q: `A shuffled deck has its top ${k} cards removed face down, unseen. What is P(the next card is red)?`, right: '1/2',
    wrong: [[frac(26, 52 - k), `kept all 26 red cards but shrank the deck to ${52 - k}`], [frac(26 - k, 52 - k), `assumed all ${k} discarded cards were red`], ['1/4', 'used one suit instead of one colour']],
    explain: `The ${ord(k + 1)} card of a shuffled deck is a uniform card; unseen discards tell you nothing. 26/52 = 1/2.` }, rng);
};
const GROUPS = [['all four kings', 4], ['both black jacks', 2], ['all four queens', 4], ['all 13 hearts', 13], ['the three other aces', 3]];
const firstAmongQ = (rng) => {
  const [g, m] = rng.pick(GROUPS);
  return mc({ q: `A deck is shuffled. What is P(the ace of spades comes before ${g})?`, right: frac(1, m + 1),
    wrong: [[frac(1, m), 'left the ace of spades out of the race'], ['1/2', 'treated it as a two-card race'], [frac(m, m + 1), 'answered P(one of the others comes first)']],
    explain: `Only the order of these ${m + 1} cards matters, and each is equally likely to be first among them: 1/${m + 1}.` }, rng);
};
const duelQ = (rng) => {
  const n = rng.pick([4, 6, 8, 10, 12, 20]);
  return mc({ q: `Alice and Bob each roll a fair ${n}-sided die (faces 1 to ${n}). What is P(Alice rolls strictly higher)?`, right: frac(n - 1, 2 * n),
    wrong: [['1/2', 'ignored ties'], [frac(n + 1, 2 * n), 'counted ties as wins: that is P(Alice ≥ Bob)'], [frac(1, n), 'that is P(tie)']],
    explain: `P(tie) = 1/${n}. The rest splits evenly by symmetry: (1 − 1/${n})/2 = ${frac(n - 1, 2 * n)}.` }, rng);
};
const beforeFirstQ = (rng) => {
  const [g, m] = rng.pick([['ace', 4], ['heart', 13], ['king', 4], ['red card', 26]]), others = 52 - m;
  return { type: 'number', q: `A deck is shuffled. What is the expected number of cards before the first ${g}? (2 decimal places)`, answer: round(others / (m + 1), 2), tolerance: 0.006,
    hints: [`Take one of the ${others} other cards: it lies before all ${m} ${g}s with chance 1/${m + 1}.`, 'Add that chance over every other card (linearity).'],
    explain: `${others} other cards, each before every ${g} with chance 1/${m + 1}: ${others}/${m + 1} ≈ ${dec(others / (m + 1), 2)}.` };
};

const perms3 = [['A', 'x', 'y'], ['A', 'y', 'x'], ['x', 'A', 'y'], ['y', 'A', 'x'], ['x', 'y', 'A'], ['y', 'x', 'A']];
const beats = diceCells((a, b) => a > b).length, ties = diceCells((a, b) => a === b).length;
// P(tie) when both toss n fair coins: C(2n, n) / 4^n (Vandermonde: sum of C(n, k)^2).
const tieP = Object.fromEntries([1, 2, 3].map((n) => [n, [nCr(2 * n, n), 4 ** n]]));

export default {
  id: 'prob/symmetry',
  book: 'prob',
  kind: 'foundation',
  title: 'Symmetry arguments',
  summary: 'If swapping labels turns an event into its mirror, the two are equally likely. Any position of a shuffle is the top card.',
  prerequisites: ['prob/sample-spaces', 'prob/expectation-linearity'],
  objectives: [
    'Use "every position of a shuffled deck is a uniform card" to answer position questions in one line',
    'Find which of m interchangeable items comes first: 1/m',
    'Handle ties: P(A wins) = (1 − P(tie)) / 2 for interchangeable players',
    'Name the swap behind a symmetry claim, and spot events that only look symmetric',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: a deck is shuffled. What is P(the 20th card is the ace of spades)? And P(the ace of spades comes before the ace of hearts)? Two approaches, then answers.', answer: '1/52 and 1/2', explain: 'A tree over the first 19 cards is hopeless. Symmetry: position 20 is as random as position 1, so any given card sits there with chance 1/52; and swapping the two aces turns "spades first" into "hearts first", so each has chance 1/2.' },
    { type: 'text', text: 'Triggers: a shuffled deck and a **position** ("the 20th card", "the last card"); a race between interchangeable items ("which comes first"); two players in the same situation ("who wins"). Before computing, ask whether swapping labels turns the event into its mirror.' },
    { type: 'check', scope: 'spotting a symmetry question', questions: [
      mc({ q: 'A deck is shuffled. Which question falls to symmetry in one line?', right: 'P(the 7th card dealt is a spade)', at: 1,
        wrong: [['P(the first ace is the 7th card dealt)', '"the first ace" depends on the six cards before it: position 7 is not interchangeable with position 1 for it'], ['P(two dice sum to 7)', 'a counting question: 6 of 36 cells'], ['P(at least one six in four dice)', 'a complement question']],
        explain: 'Position 7 of a shuffled deck is a uniform card: 13/52 = 1/4.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Symmetry answers in one line what a tree answers in ten. Beat the Odds has whole families built for it (card positions, races, dice duels), and its wrong options are exactly the long-calculation slips.' },

    sec('anchor'),
    { type: 'text', text: 'You know the top card of a shuffled deck is equally likely to be any of the 52 cards. Symmetry is that fact with **one change**: any fixed position (the 20th, the last) is just another "top card" with a different label. A fair shuffle treats every position alike.' },
    { type: 'check', scope: 'any position is uniform', questions: [{ make: kthCardQ }] },

    sec('picture'),
    { type: 'text', text: 'Three cards, one ace (A) and two others (x, y), in a random order. List all 3! = 6 orders and look where the ace sits.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Order', 'Ace at position'], rows: perms3.map((p) => [p.join(' '), String(p.indexOf('A') + 1)]), align: ['left', 'right'] }, caption: 'Each position holds the ace in 2 of the 6 orders: 1/3 each. Nothing about position 1 is special.' },
    { type: 'check', scope: 'counting positions', questions: [
      { type: 'number', q: 'Four cards, one of them an ace, in a random order. How many of the 24 orders put the ace in position 3?', answer: 6, hints: ['Fix the ace in position 3.', 'The other 3 cards fill the other places in 3! ways.'], explain: '3! = 6 orders, the same for every position: 24 / 4.' },
    ] },

    sec('positions', 'Every position is the top card'),
    { type: 'text', text: 'In a shuffled deck, the card at position k is a uniformly random card, for every k. Cards dealt or burned face down before it change nothing, because you learn nothing about them: averaged over what they might be, the chances come back to where they started.' },
    { type: 'check', scope: 'unseen cards change nothing', questions: [{ hinge: true, make: burnQ }] },

    sec('first', 'Which comes first'),
    { type: 'text', text: 'Two specific cards: swapping them turns "this one first" into "that one first", so each has chance 1/2. Among m specific cards, each is equally likely to be the first of them to appear (and the last): 1/m. The other cards only fill the gaps.' },
    { type: 'formula', text: 'P(a given one of m specific cards appears first among them) = 1/m' },
    { type: 'check', scope: 'first among m', questions: [{ hinge: true, make: firstAmongQ }] },

    sec('ties', 'Symmetry with ties'),
    { type: 'text', text: 'Two players each roll a die. Swapping the players turns "A higher" into "B higher", so the two are equally likely. They do not cover everything, though: ties take their share first.' },
    { type: 'diagram', diagram: 'grid', spec: diceGrid((a, b) => a > b, (a, b) => (a > b ? 'A' : a < b ? 'B' : '=')), caption: `A is the first die (rows). A wins in the ${beats} cells below the diagonal, B in the ${beats} above, and the ${ties} diagonal cells are ties: ${beats}/36 = (1 − ${ties}/36)/2.` },
    { type: 'formula', text: 'P(A wins) = (1 − P(tie)) / 2   when A and B are interchangeable' },
    { type: 'check', scope: 'duels with ties', questions: [{ hinge: true, make: duelQ }] },

    sec('derivation'),
    { type: 'text', text: 'Alice tosses n + 1 fair coins and Bob tosses n. What is P(Alice gets more heads)? One move at a time.' },
    { type: 'steps', steps: [
      { say: "Set Alice's extra coin aside. Compare her first n coins with Bob's n: she is ahead, behind or tied.", why: 'Now both players are in the same situation, so symmetry applies to them.',
        checks: [mc({ q: 'With the extra coin set aside, why is P(Alice ahead) = P(Bob ahead)?', right: 'both toss n fair coins, so swapping names swaps the events', at: 0,
          wrong: [['ties are impossible, so ahead and behind split everything', 'ties are possible, and symmetry does not need them to be'], ['Alice has the extra coin, which evens out the odds', 'the extra coin was set aside'], ['it is not true: Alice is more likely to be ahead', 'with the extra coin aside, the two situations are mirror images']],
          explain: 'Identical situations: relabelling Alice as Bob maps "Alice ahead" onto "Bob ahead".' })] },
      { say: 'Call the chance of "ahead" a and the chance of "tied" t. By symmetry "behind" is also a, so 2a + t = 1.', why: 'The three cases cover everything and never overlap.',
        checks: [{ make: (rng) => { const n = rng.int(2, 3), [tn, td] = tieP[n]; return mc({ q: `Each player tosses ${n} coin${n > 1 ? 's' : ''}; P(tied) = ${frac(tn, td)}. What is P(Alice ahead)?`, right: frac(td - tn, 2 * td),
          wrong: [[frac(td - tn, td), 'forgot to split the untied share between the two players'], ['1/2', 'ignored ties'], [frac(tn, 2 * td), 'split the tie share instead of the rest'], [frac(tn, td), 'answered P(tied)']],
          explain: `(1 − ${frac(tn, td)})/2 = ${frac(td - tn, 2 * td)}.` }, rng); } }] },
      { say: 'Bring back the extra coin. Alice ends with more heads if she was ahead (whatever the coin does), or tied and the coin lands heads.', why: 'Behind by one or more, one extra head can at best draw level.',
        checks: [mc({ q: 'Alice is behind by one after n coins, and her extra coin lands heads. Result?', right: 'they end level: no win for Alice', at: 2,
          wrong: [['she ends with more heads than Bob', 'one extra head from one behind only draws level'], ['she is still behind Bob by one', 'the extra head closes the gap by one']],
          explain: 'Behind by one plus one head is level.' })] },
      { say: 'P = a + t/2 = a + (1 − 2a)/2 = 1/2, for every n.', why: 'The unknown a cancels: no counting needed, and the answer does not depend on n.',
        checks: [{ make: (rng) => { const n = rng.int(5, 50); return { type: 'number', q: `Alice tosses ${n + 1} fair coins and Bob tosses ${n}. What is P(Alice gets more heads)?`, answer: 0.5, explain: 'a + t/2 = 1/2, whatever n is.' }; } }] },
    ] },
    { type: 'explain', prompt: 'Why does the answer 1/2 not depend on n?', model: 'Split on the first n coins: Alice is ahead with chance a, behind with chance a (by symmetry) and tied with chance 1 − 2a. She ends with more heads if ahead, or if tied and her extra coin is heads: a + (1 − 2a)/2 = 1/2. The unknown a cancels.', points: ['Setting the extra coin aside makes the players symmetric', 'Ahead and behind have the same chance a; ties take the rest', 'The extra coin only matters from a tie, and a cancels'] },

    sec('predict'),
    { type: 'predict', question: 'Deal a shuffled deck. Is the first ace more likely to be at position 1 or at position 2?', answer: `Position 1: 4/52 ≈ ${dec(4 / 52, 4)}, against 48/52 × 4/51 ≈ ${dec((48 * 4) / (52 * 51), 4)} for position 2.`, explain: 'Each position is equally likely to hold a given card, but "the first ace at position 2" also needs a non-ace at position 1. It is not a symmetric event.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Unseen discards change the odds of the next card.', fix: 'You learned nothing about them: the next card is still a uniform card.' },
      { belief: 'Symmetry applies to "the first ace is at position k".', fix: 'The first ace depends on the cards before it, so positions are not interchangeable for it.' },
      { belief: 'In a dice duel, P(A wins) = 1/2.', fix: 'Only after removing ties: (1 − P(tie))/2.' },
      { belief: 'The last card of a deck is special.', fix: 'It is as random as the first.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(first die > second die) for two fair dice. One step is wrong.', steps: [
      'The two dice are interchangeable.',
      'So P(first > second) = P(second > first).',
      'These two events cover every throw, so each is 1/2.',
      'P(first > second) = 1/2.',
    ], errorStep: 2, explain: `Ties (${ties} of 36 throws) belong to neither event. Each is (1 − ${ties}/36)/2 = ${frac(beats, 36)}.` },
    { type: 'check', scope: 'ties in a duel', questions: [
      mc({ q: 'Alice and Bob each roll a fair die. What is P(Alice ≥ Bob)?', right: frac(beats + ties, 36), at: 2,
        wrong: [['1/2', 'ignored ties'], [frac(beats, 36), 'that is "strictly greater": ties count for "≥"'], ['1/6', 'that is P(tie)']],
        explain: `Strictly greater ${beats}/36 plus ties ${ties}/36 = ${frac(beats + ties, 36)}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Swap test before any calculation: name the relabelling (players, cards, positions) that turns the event into its mirror. If one exists, the answer is (1 − P(tie))/2 for two players, or 1/m for m interchangeable items.' },
    { type: 'check', scope: 'the swap test with ties', questions: [
      mc({ q: 'Ann and Bob each toss 3 fair coins. P(they get the same number of heads) = 5/16. What is P(Ann gets strictly more heads)?', right: frac(11, 32), at: 1,
        wrong: [['1/2', 'ignored ties'], [frac(5, 16), 'that is P(tie)'], [frac(21, 32), 'counted ties as wins for Ann']],
        explain: 'Swapping Ann and Bob turns "Ann more" into "Bob more", so they share what ties leave: (1 − 5/16)/2 = 11/32.' }),
    ] },
    { type: 'callout', tone: 'speed', text: `Symmetry plus linearity: each of the 48 non-aces lies before all 4 aces with chance 1/5 (first among 5 cards). So the expected number of cards before the first ace is 48/5 = ${48 / 5}.` },
    { type: 'check', scope: 'first-among-m with linearity', questions: [{ make: beforeFirstQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Swap test: if a relabelling maps the event onto its mirror, both are equally likely. Shuffle positions are interchangeable; among m interchangeable items each is first with chance 1/m; with ties, P(A wins) = (1 − P(tie))/2.' },

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Symmetric?', 'Answer'], rows: [
      ['the 20th card is a heart', 'yes: positions are interchangeable', frac(13, 52)],
      ['ace of spades before ace of hearts', 'yes: swap the two cards', '1/2'],
      ['first die higher than second', 'yes, but ties sit outside', frac(beats, 36)],
      ['the first ace is at position 1', 'no: "first ace" depends on earlier cards', frac(4, 52)],
      ['the first ace is at position 2', 'no', frac(48 * 4, 52 * 51)],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: with continuous values (two uniform random points, two returns) ties have probability 0, so P(X > Y) = 1/2 exactly. With m = 1 item, "first among them" is certain.' },
    { type: 'check', scope: 'swapping whole groups, and ties of probability 0', questions: [
      mc({ q: 'A deck is shuffled. What is P(the first ace appears before the first king)?', right: '1/2', at: 0,
        wrong: [[frac(4, 52), 'that is P(the top card is an ace)'], ['1/5', 'treated it as one ace racing four kings'], [frac(1, nCr(8, 4)), 'that is P(all four aces come before all four kings), a stronger event']],
        explain: 'Swap the labels ace and king: "first ace before first king" becomes "first king before first ace". Same chance, no ties possible: 1/2.' }),
      { type: 'choice', q: 'X and Y are two independent uniform random points on [0, 1]. P(X > Y) is:', options: ['exactly 1/2', 'a little below 1/2', 'a little above 1/2'], answer: 0, stable: true, traps: { 1: 'continuous values tie with probability 0, so nothing is lost to ties', 2: 'swapping X and Y shows the two sides are equal' }, explain: 'Swap X and Y: P(X > Y) = P(Y > X), and P(X = Y) = 0. So each is exactly 1/2.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the card-symmetry, race-to-k and dice-duel families in Beat the Odds, and the expected position of the first ace. Also Likelihood List rows where two teams or two funds are described identically.' },
    { type: 'check', scope: 'symmetry in a series', questions: [
      { type: 'choice', q: 'Two equally strong players play a best-of-7 series. What is P(the player who starts wins the series)?', options: ['1/2', '4/7', 'cannot tell without the series formula'], answer: 0, traps: { 1: 'counted games needed instead of swapping the players', 2: 'swap the two players: if starting gives no edge, the series is its own mirror' }, explain: 'Equal players and no starter edge: swapping them maps every winning path for one onto a winning path for the other. 1/2.' },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: burnQ }, { make: firstAmongQ }, { make: duelQ }] },
  ],
};
