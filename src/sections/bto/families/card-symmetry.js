// Card symmetry: unseen discards change nothing; any fixed position is a uniformly random card.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, pic } from '../lib.js';

const oneLevel = (label, yes, no, pYes, pNo) => ({ label, children: [{ p: pYes, label: yes, mark: true }, { p: pNo, label: no }] });

const ID = 'card-symmetry';
const ord = (k) => `${k}${k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th'}`;

function build(kind, rng) {
  if (kind === 'discardRed' || kind === 'discardAce') {
    const d = rng.int(3, 20);
    const red = kind === 'discardRed';
    const good = red ? 26 : 4;
    const value = q(good, 52);
    const what = red ? 'red' : 'an ace';
    return {
      value, data: { kind, d },
      text: `A standard 52-card deck is shuffled. The top ${d} cards are thrown away without anyone seeing them. What is the probability that the next card (the ${ord(d + 1)} card of the deck) is ${what}?`,
      distractors: [
        { value: q(good, 52 - d), misconception: `Kept all ${good} ${red ? 'red cards' : 'aces'} but shrank the deck to ${52 - d}. The unseen discards remove ${red ? 'red' : 'ace'} and other cards alike.` },
        { value: q(Math.max(good - d, 0), 52 - d), misconception: `Assumed every discarded card was ${red ? 'red' : 'an ace'}.` },
        { value: red ? q(1, 4) : q(1, 52), misconception: red ? 'Used the chance of one suit (1/4) instead of one colour (1/2).' : 'Used the chance of one specific card (1/52) instead of any of the four aces.' },
        { value: red ? q(1, 2 ** Math.min(d + 1, 8)) : q(1, 4), misconception: red ? 'Multiplied 1/2 for the discarded cards too, as if they all had to be red.' : 'Confused rank with suit: 1/4 is the chance of a given suit.' },
        { value: red ? q(26 - Math.round(d / 4), 52 - d) : q(3, 52 - d), misconception: red ? 'Assumed exactly a quarter of the discards were red. Unseen discards are not known to have any particular make-up.' : 'Assumed exactly one ace was among the discards. Unseen discards are not known to have any particular make-up.' },
        { value: q(good, 52).mul(q(52 - d, 52)), misconception: 'Scaled the answer down for the cards thrown away. Removing unseen cards does not change what the next card is likely to be.' },
      ],
      steps: [
        { say: `The ${ord(d + 1)} card of a shuffled deck is equally likely to be any of the 52 cards.`, why: 'A uniform shuffle puts every card in every position with the same chance.' },
        { say: 'Throwing cards away unseen gives no information, so nothing updates.', why: 'Probabilities only change when you learn something. Averaging over every possible discard gives the same answer.' },
        { say: `P = ${good}/52 = ${value}.`, why: `${good} of 52 cards qualify.` },
      ],
      hints: ['Did you learn anything about the discarded cards?', `Position ${d + 1} is as random as position 1.`, `${good}/52.`],
      picture: pic('tree', { root: { label: 'one unseen discard', children: [
        { p: `${good}/52`, label: `discard ${red ? 'red' : 'an ace'}`, children: [{ p: `${good - 1}/51`, label: `next ${red ? "red" : "an ace"}`, mark: true }, { p: `${52 - good}/51`, label: "next other" }] },
        { p: `${52 - good}/52`, label: 'discard other', children: [{ p: `${good}/51`, label: `next ${red ? 'red' : 'an ace'}`, mark: true }, { p: `${51 - good}/51`, label: 'next other' }] },
      ] }, total: `${good}/52` }, `One unseen discard, split by what it was. The two marked paths add back to ${good}/52; each of the other ${d - 1} discards averages out the same way.`),
      fast: `Unseen cards carry no information, so the ${ord(d + 1)} card is a random card: ${good}/52 = ${value}.`,
      check: `The answer cannot depend on how many cards were burned: with ${d} or with 0 discards it is ${value}. An option that changes with ${d} uses the discards as if they were seen.`,
    };
  }
  if (kind === 'sameSuit' || kind === 'heartBottom') {
    const k = rng.int(2, 52);
    const text = kind === 'sameSuit'
      ? `A standard deck is shuffled. What is the probability that the ${k === 52 ? 'bottom (52nd)' : ord(k)} card has the same suit as the top card?`
      : 'A standard deck is shuffled and you see that the top card is a heart. What is the probability that the bottom card is also a heart?';
    return {
      value: q(12, 51), data: { kind, k },
      text,
      distractors: [
        { value: q(1, 4), misconception: 'Treated the two positions as independent draws with replacement. The top card has used up one card of that suit.' },
        { value: q(12, 52), misconception: 'Removed the top card from its suit but not from the deck: 51 cards remain.' },
        { value: q(13, 51), misconception: 'Removed the top card from the deck but not from its suit: only 12 of that suit remain.' },
        { value: q(1, 13), misconception: 'Used a rank probability (1/13) instead of a suit probability.' },
        { value: q(1, 16), misconception: 'Required both cards to be one specific suit, (1/4)². The top card\'s suit is given, not chosen.' },
        { value: q(39, 51), misconception: 'Answered the complement: a different suit from the top card.' },
        { value: q(1, 17), misconception: 'Multiplied by 13/52 for the top card\'s suit. The top card is already given, so only the second card is uncertain.' },
      ],
      steps: [
        { say: 'Condition on the top card. 51 cards remain, 12 of them in its suit.', why: 'The top card is known (or its suit is), so it is removed from both counts.' },
        { say: `The ${kind === 'sameSuit' ? `${ord(k)}` : 'bottom'} card is a uniformly random one of those 51.`, why: 'Given the top card, every other position is symmetric.' },
        { say: 'P = 12/51 = 4/17 ≈ 0.235.', why: 'Favourable over remaining.' },
      ],
      hints: ['Once the top card is fixed, how many cards remain and how many share its suit?', 'Position does not matter among the remaining 51.', '12/51.'],
      picture: pic('tree', { root: oneLevel('top card known', 'same suit', 'other suit', '12/51', '39/51'), total: '12/51' }, 'With the top card fixed, the other card is one of 51, and 12 of them share its suit. Its position does not matter.'),
      fast: '12 of the remaining 51 cards share the suit: 12/51 = 4/17.',
      check: 'Slightly below 1/4, because the top card has used up one card of its own suit: 12/51 against 13/52.',
    };
  }
  if (kind === 'aceBeforeKing') return {
    value: q(1, 2), data: { kind },
    text: 'A standard deck is shuffled and dealt face up one card at a time. What is the probability that the first ace appears before the first king?',
    distractors: [
      { value: q(4, 52), misconception: 'Computed the chance the very first card is an ace.' },
      { value: q(4, 8).mul(q(3, 7)), misconception: 'Required the first two aces-or-kings to both be aces.' },
      { value: q(1, 70), misconception: 'Required all four aces to come before all four kings. The question only compares the first of each.' },
    ],
    steps: [
      { say: 'Only the 8 aces and kings matter; ignore the other 44 cards.', why: 'The event is decided by which of those 8 cards comes first.' },
      { say: 'Each of the 8 is equally likely to be first among them; 4 are aces. P = 4/8 = 1/2.', why: 'Symmetry among the relevant cards.' },
    ],
    hints: ['Which cards decide the event?', 'Among the 8 aces and kings, which comes first?', '4/8.'],
    picture: pic('tree', { root: oneLevel('first of the 8 aces and kings', 'an ace', 'a king', '4/8', '4/8'), total: '1/2' }, 'Only the first card among the 4 aces and 4 kings decides it; the other 44 cards never matter. Each of the 8 is equally likely to come first.'),
    fast: 'Aces and kings are symmetric: 4 of the 8 deciding cards are aces, 1/2.',
    check: 'Swap the words ace and king and the question is unchanged, so the two answers are equal and add to 1: each is 1/2.',
  };
  const r = rng.pick(['spades', 'hearts']);
  return {
    value: q(1, 13), data: { kind: 'aceFirstOfSuit' },
    text: `A standard deck is shuffled. What is the probability that the ace of ${r} appears before every other ${r.slice(0, -1)}?`,
    distractors: [
      { value: q(1, 52), misconception: 'Computed the chance the ace is the very first card of the deck.' },
      { value: q(1, 4), misconception: 'Used a suit probability. Only the order among the 13 cards of that suit matters.' },
      { value: q(1, 2), misconception: 'Treated "before all the others" like "before one other card".' },
      { value: q(12, 13), misconception: 'Answered the complement.' },
    ],
    steps: [
      { say: `Only the 13 ${r} matter.`, why: 'Other cards do not change which of them comes first.' },
      { say: 'Each of the 13 is equally likely to be first among them: P = 1/13 ≈ 0.077.', why: 'Symmetry.' },
    ],
    hints: ['Which cards decide the event?', `The order among the 13 ${r}.`, '1/13.'],
    picture: pic('tree', { root: oneLevel(`first of the 13 ${r}`, 'the ace', 'another card', '1/13', '12/13'), total: '1/13' }, `Only the order among the 13 ${r} matters, and each of them is equally likely to come first.`),
    fast: `Each of the 13 ${r} is equally likely to come first among them: 1/13.`,
    check: `The 13 answers "card X comes first among the ${r}" are equal and must add to 1, so each is 1/13.`,
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Cards: symmetry and unseen discards',
  skill: 'Any fixed position of a shuffled deck is a uniformly random card; unseen cards carry no information',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? rng.pick(['discardRed', 'discardAce']) : rng.pick(['sameSuit', 'heartBottom', 'aceBeforeKing', 'aceFirstOfSuit']);
    const b = build(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      rule: 'Unseen cards change nothing; any position is uniform. Conditioning on a seen card removes it from the deck and from its group.',
      anchor: 'The top card of a shuffled deck is red with probability 1/2. Any other position is the same fact with one change: the position label, which a fair shuffle ignores.',
    });
  },

  // Independent check: average over what the discards could have been (law of total
  // probability), or count ordered pairs / relative orders directly.
  verify(item) {
    const d = item.params;
    if (d.kind === 'discardRed' || d.kind === 'discardAce') {
      const good = d.kind === 'discardRed' ? 26 : 4;
      let p = q(0);
      for (let r = 0; r <= Math.min(good, d.d); r++) {
        const w = new Q(nCr(good, r) * nCr(52 - good, d.d - r), nCr(52, d.d));
        p = p.add(w.mul(q(good - r, 52 - d.d)));
      }
      return agree(item, p);
    }
    if (d.kind === 'sameSuit' || d.kind === 'heartBottom') {
      let hits = 0, tot = 0;
      for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) if (a !== b) { tot++; if (a % 4 === b % 4) hits++; }
      return agree(item, hits / tot);
    }
    if (d.kind === 'aceBeforeKing') {
      // Arrangements of 4 A and 4 K with an A first: C(7,3) of C(8,4).
      return agree(item, Number(nCr(7, 3)) / Number(nCr(8, 4)));
    }
    return agree(item, 1 / 13);
  },

  lesson: {
    purpose: 'Card questions often hide a symmetry: discarding unseen cards or looking at "the 11th card" feels like it should matter, and it does not. Seeing this saves the whole 90 seconds.',
    anchor: 'You know the top card is red with probability 1/2. The 11th card is the same with one change, the position, and a fair shuffle does not care about positions.',
    steps: [
      { say: 'Ask: did I learn anything? Unseen discards give no information.', why: 'Without new information, probabilities stay at their starting values.' },
      { say: 'Any single position of a shuffled deck is a uniformly random card.', why: 'Every card is equally likely to land in every position.' },
      { say: 'When a card IS seen, remove it from the deck and from its group, then use symmetry on the rest.', why: 'Seen cards are information: 12 hearts in 51 cards after a heart is shown.' },
    ],
    predict: { question: 'You burn 25 cards unseen. Is the next card more likely to be red, less likely, or the same as before?', answer: 'The same, 1/2. Averaging over all possible burns gives back 26/52.' },
    edge: 'Burn 51 cards unseen: the last card is still red with probability 1/2.',
    rule: 'Unseen = ignore. Seen = remove from deck and from group. Relative order of k special cards: each is first with 1/k.',
    contrast: 'Seen versus unseen: showing that the top card is a heart changes P(next is a heart) to 12/51; hiding it keeps 13/52.',
  },
};
