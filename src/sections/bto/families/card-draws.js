// Drawing cards without replacement: pairs, suits, colours, at least one ace, all red, flushes.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, qpow } from '../lib.js';

const ID = 'card-draws';
const words = ['', 'one', 'two', 'three', 'four', 'five'];
const C = (n, k) => nCr(n, k);
const ratio = (a, b) => new Q(a, b);

function build(kind, rng) {
  if (kind === 'twoAces') return {
    value: q(1, 221), data: { kind },
    text: 'You draw two cards from a shuffled 52-card deck without replacement. What is the probability that both are aces?',
    distractors: [
      { value: q(1, 169), misconception: 'Used (4/52)² as if the first card went back into the deck.' },
      { value: q(4, 52).mul(q(3, 52)), misconception: 'Reduced the aces to 3 for the second card but left the deck at 52; it has 51 cards.' },
      { value: q(1, 13), misconception: 'Only computed the first card.' },
      { value: q(8, 52), misconception: 'Added 4/52 for each draw; both draws must be aces, so multiply.' },
      { value: q(4, 52).mul(q(4, 51)), misconception: 'Reduced the deck to 51 but kept 4 aces for the second draw.' },
      { value: q(2, 221), misconception: 'Doubled for the two orders. The sequential product 4/52 × 3/51 already covers every order of two aces.' },
      { value: q(1, 2652), misconception: 'Counted one specific pair of aces (say spades then hearts) instead of any two aces.' },
    ],
    steps: [
      { say: 'P(first ace) = 4/52.', why: 'Four aces in 52 cards.' },
      { say: 'P(second ace | first ace) = 3/51.', why: 'One ace and one card are gone.' },
      { say: 'P = 4/52 × 3/51 = 12/2652 = 1/221 ≈ 0.0045.', why: 'Chain rule for dependent draws.' },
    ],
    hints: ['After one ace is drawn, what is left?', '3 aces in 51 cards.', '(4/52)(3/51).'],
  };
  if (kind === 'sameSuit') return {
    value: q(12, 51), data: { kind },
    text: 'You draw two cards from a shuffled deck. What is the probability that they have the same suit?',
    distractors: [
      { value: q(1, 4), misconception: 'Treated the second draw as with replacement (13/52).' },
      { value: q(1, 16), misconception: 'Required both to be one specific suit such as hearts. The first card may be any suit.' },
      { value: q(13, 51), misconception: 'Left 13 cards in the first card\'s suit; one of them is already drawn.' },
      { value: q(39, 51), misconception: 'Answered the complement: different suits.' },
      { value: q(1, 17), misconception: 'Multiplied by 13/52 for the first card\'s suit as if the suit were specified.' },
    ],
    steps: [
      { say: 'The first card can be anything; it only fixes the suit.', why: 'No suit is specified.' },
      { say: 'The second card must be one of the 12 remaining cards of that suit among 51: P = 12/51 = 4/17 ≈ 0.235.', why: 'Without replacement, both the suit count and the deck drop by one.' },
    ],
    hints: ['Does the first card matter?', 'How many cards of its suit are left, out of how many?', '12/51.'],
  };
  if (kind === 'sameColour') return {
    value: q(25, 51), data: { kind },
    text: 'You draw two cards from a shuffled deck. What is the probability that they have the same colour?',
    distractors: [
      { value: q(1, 2), misconception: 'Treated the draws as with replacement. Removing one red card makes red slightly less likely next.' },
      { value: q(26, 51), misconception: 'Answered the complement: different colours.' },
      { value: q(25, 102), misconception: 'Required both to be red specifically.' },
      { value: q(1, 4), misconception: 'Used (1/2)² for "both red" and forgot "both black".' },
      { value: q(2, 3), misconception: 'Listed three colour patterns (both red, both black, mixed) and treated them as equally likely. Mixed has two orders, so it is the most likely pattern.' },
    ],
    steps: [
      { say: 'The first card fixes the colour; 25 cards of that colour remain among 51.', why: 'One card of that colour is gone.' },
      { say: 'P = 25/51 ≈ 0.490.', why: 'Slightly below 1/2 because of the missing card.' },
    ],
    hints: ['Fix the first card\'s colour.', 'How many of that colour are left?', '25/51.'],
  };
  if (kind === 'pair') return {
    value: q(3, 51), data: { kind },
    text: 'You draw two cards from a shuffled deck. What is the probability that they have the same rank (a pair)?',
    distractors: [
      { value: q(1, 13), misconception: 'Treated the second draw as with replacement (4/52).' },
      { value: q(4, 51), misconception: 'Left 4 cards of the first card\'s rank; one of them is already drawn.' },
      { value: q(1, 221), misconception: 'Required a specific pair such as two aces.' },
      { value: q(12, 51), misconception: 'Computed the same-suit probability instead of same rank.' },
      { value: q(1, 169), misconception: 'Required a specific rank and drew with replacement.' },
    ],
    steps: [
      { say: 'The first card fixes the rank; 3 cards of that rank remain in 51.', why: 'Without replacement.' },
      { say: 'P = 3/51 = 1/17 ≈ 0.059.', why: 'Favourable over remaining.' },
    ],
    hints: ['After the first card, how many of its rank remain?', 'Out of 51 cards.', '3/51.'],
  };
  if (kind === 'atLeastAce') {
    const k = rng.int(2, 5);
    const none = ratio(C(48, k), C(52, k));
    const v = q(1).sub(none);
    const one = ratio(4n * C(48, k - 1), C(52, k));
    return {
      value: v, data: { kind, k },
      text: `You are dealt ${words[k]} cards from a shuffled deck. What is the probability that you hold at least one ace?`,
      distractors: [
        { value: q(4 * k, 52), misconception: `Added 4/52 for each of the ${k} cards. Two aces in the hand would be counted twice.` },
        { value: q(1).sub(qpow(q(12, 13), k)), misconception: 'Used 48/52 for every card, as if dealt with replacement.' },
        { value: one, misconception: 'Computed exactly one ace. "At least one" also includes hands with two or more.' },
        { value: none, misconception: 'Answered the complement: no aces.' },
        { value: q(1, 13), misconception: `Only considered one card of the ${k}.` },
        { value: ratio(C(4, k), C(52, k)), misconception: `Computed P(every card is an ace).` },
        { value: q(1).sub(qpow(q(48, 52), k - 1)), misconception: `Off by one: multiplied only ${k - 1} non-ace factors in the complement.` },
      ],
      steps: [
        { say: 'Complement: P(no ace) = C(48,k)/C(52,k), or 48/52 × 47/51 × … over k cards.', why: '"At least one" is the complement of "none", which is one product.' },
        { say: `P(no ace) = ${none} ≈ ${none.toNumber().toFixed(4)}.`, why: 'Every card must come from the 48 non-aces, and each draw shrinks both counts.' },
        { say: `P = 1 − ${none} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Complement rule.' },
      ],
      hints: ['What is the complement of "at least one ace"?', 'Every card must be a non-ace: 48/52, 47/51, …', `1 − ${none}.`],
    };
  }
  if (kind === 'allRed') {
    const k = rng.int(2, 5);
    const v = ratio(C(26, k), C(52, k));
    return {
      value: v, data: { kind, k },
      text: `You are dealt ${words[k]} cards from a shuffled deck. What is the probability that all of them are red?`,
      distractors: [
        { value: qpow(q(1, 2), k), misconception: 'Used 1/2 for every card, as if dealt with replacement.' },
        { value: v.mul(q(2)), misconception: 'Answered "all the same colour" (all red or all black).' },
        { value: q(1).sub(v), misconception: 'Answered the complement: at least one black.' },
        { value: q(1, 2 * k), misconception: 'Divided 1/2 by the number of cards instead of multiplying the chances.' },
        { value: qpow(q(1, 2), k - 1), misconception: 'Gave the first card probability 1, as if any colour would do. The question fixes the colour: red.' },
      ],
      steps: [
        { say: `Chain: 26/52 × 25/51 × … (${k} factors).`, why: 'Each red card drawn removes one red card and one card.' },
        { say: `P = C(26,${k})/C(52,${k}) = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Same value as counting red hands over all hands.' },
      ],
      hints: ['Draw one card at a time. How many reds remain after each?', `26/52, 25/51, …, ${k} factors.`, `C(26,${k})/C(52,${k}).`],
    };
  }
  if (kind === 'atLeastHeart') {
    const k = rng.int(2, 6);
    const none = ratio(C(39, k), C(52, k));
    const v = q(1).sub(none);
    return {
      value: v, data: { kind, k },
      text: `You are dealt ${k <= 5 ? words[k] : 'six'} cards from a shuffled deck. What is the probability that at least one of them is a heart?`,
      distractors: [
        { value: q(k, 4), misconception: `Added 1/4 for each card; hands with two hearts are counted twice.` },
        { value: q(1).sub(qpow(q(3, 4), k)), misconception: 'Used 3/4 for every non-heart, as if dealt with replacement.' },
        { value: none, misconception: 'Answered the complement: no hearts.' },
        { value: ratio(13n * C(39, k - 1), C(52, k)), misconception: 'Computed exactly one heart.' },
        { value: q(1, 4), misconception: 'Only considered one card.' },
      ],
      steps: [
        { say: `P(no heart) = 39/52 × 38/51 × … (${k} factors) = ${none} ≈ ${none.toNumber().toFixed(4)}.`, why: 'Every card must come from the 39 non-hearts, and both counts shrink.' },
        { say: `P = 1 − ${none} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Complement of "no heart".' },
      ],
      hints: ['Complement of "at least one heart"?', 'All cards from the 39 non-hearts.', `1 − C(39,${k})/C(52,${k}).`],
    };
  }
  if (kind === 'allDiffRanks') {
    const k = rng.int(3, 5);
    let v = q(1);
    for (let i = 0; i < k; i++) v = v.mul(q(52 - 4 * i, 52 - i));
    return {
      value: v, data: { kind, k },
      text: `You are dealt ${words[k]} cards from a shuffled deck. What is the probability that no two of them share a rank?`,
      distractors: [
        { value: (() => { let x = q(1); for (let i = 0; i < k; i++) x = x.mul(q(13 - i, 13)); return x; })(), misconception: 'Treated each card\'s rank as drawn with replacement (13/13 × 12/13 × …).' },
        { value: q(1).sub(v), misconception: 'Answered the complement: at least one pair.' },
        { value: qpow(q(48, 51), k - 1), misconception: 'Only required each card to differ in rank from the first card, with the same 48/51 each time.' },
        { value: (() => { let x = q(1); for (let i = 1; i < k; i++) x = x.mul(q(52 - 4 * i, 51)); return x; })(), misconception: 'Removed used ranks but kept the deck at 51 for every later card.' },
      ],
      steps: [
        { say: `Card by card: 52/52 × 48/51 × 44/50${k > 3 ? ' × 40/49' : ''}${k > 4 ? ' × 36/48' : ''}.`, why: 'Each new card must avoid every rank already used: four fewer good cards each time, one fewer card overall.' },
        { say: `P = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Chain rule.' },
      ],
      hints: ['How many cards avoid the first card\'s rank?', 'Each new card loses 4 good cards; the deck loses 1.', `Product of ${k} factors.`],
    };
  }
  // Flush (five of one suit, straight flushes included).
  const v = ratio(4n * C(13, 5), C(52, 5));
  return {
    value: v, data: { kind: 'flush' },
    text: 'You are dealt five cards from a shuffled deck. What is the probability that all five are of the same suit (a flush, straight flushes included)?',
    distractors: [
      { value: qpow(q(1, 4), 4), misconception: 'Used 1/4 for each of the last four cards, as if dealt with replacement.' },
      { value: ratio(C(13, 5), C(52, 5)), misconception: 'Required one specific suit; any of the 4 suits works.' },
      { value: qpow(q(1, 4), 5), misconception: 'Required a specific suit and dealt with replacement.' },
      { value: q(12, 51), misconception: 'Only checked that the second card matches the first.' },
    ],
    steps: [
      { say: 'The first card fixes the suit. Then 12/51 × 11/50 × 10/49 × 9/48.', why: 'Each further card must come from the shrinking suit.' },
      { say: `P = ${v} ≈ ${v.toNumber().toFixed(5)} (about 1 in 505).`, why: 'Equivalently 4 × C(13,5)/C(52,5).' },
    ],
    hints: ['Does the first card matter?', 'Four more cards must match its suit, without replacement.', '(12/51)(11/50)(10/49)(9/48).'],
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Cards without replacement',
  skill: 'Chain rule with shrinking counts; complement for "at least one"',
  levels: [1, 2, 3],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? rng.pick(['twoAces', 'sameSuit', 'sameColour', 'pair'])
      : difficulty === 2 ? rng.pick(['atLeastAce', 'allRed', 'atLeastHeart']) : rng.pick(['flush', 'allDiffRanks', 'atLeastAce', 'atLeastHeart']);
    const b = build(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      rule: 'Without replacement: multiply (good left)/(cards left) at each draw. "At least one" = 1 − P(none).',
      anchor: 'One card: good/52. Several cards: the same fraction repeated, with the one change that both counts drop after each draw.',
    });
  },

  // Independent check: sequential products or ordered-pair enumeration, not binomial coefficients.
  verify(item) {
    const d = item.params;
    const seq = (good, k) => { let p = 1; for (let i = 0; i < k; i++) p *= (good - i) / (52 - i); return p; };
    if (['twoAces', 'sameSuit', 'sameColour', 'pair'].includes(d.kind)) {
      // card c: rank = c % 13, suit = floor(c / 13), red = suit < 2
      let hits = 0, tot = 0;
      for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) {
        if (a === b) continue;
        tot++;
        const ok = d.kind === 'twoAces' ? a % 13 === 0 && b % 13 === 0
          : d.kind === 'sameSuit' ? Math.floor(a / 13) === Math.floor(b / 13)
            : d.kind === 'sameColour' ? (Math.floor(a / 13) < 2) === (Math.floor(b / 13) < 2)
              : a % 13 === b % 13;
        if (ok) hits++;
      }
      return agree(item, hits / tot);
    }
    if (d.kind === 'atLeastAce') return agree(item, 1 - seq(48, d.k));
    if (d.kind === 'allRed') return agree(item, seq(26, d.k));
    if (d.kind === 'atLeastHeart') return agree(item, 1 - seq(39, d.k));
    if (d.kind === 'allDiffRanks') {
      // Count ordered hands of distinct ranks: choose ranks in order (13·12·…) × a suit for each (4^k).
      let hands = 1, all = 1;
      for (let i = 0; i < d.k; i++) { hands *= (13 - i) * 4; all *= 52 - i; }
      return agree(item, hands / all);
    }
    return agree(item, 4 * seq(13, 5));
  },

  lesson: {
    purpose: 'Most card questions are "draw without replacement" questions. The whole trick is to shrink both the good count and the deck after every draw.',
    anchor: 'One draw: good/52. Several draws = the same fraction repeated, with one change: after each draw the numerator and the denominator both drop.',
    steps: [
      { say: 'Write the draws in order and the fraction for each: (good left)/(cards left).', why: 'The chain rule: P(A and B) = P(A) × P(B | A).' },
      { say: 'If the first card only sets a target (suit, rank, colour), give it probability 1.', why: 'An unspecified target costs nothing.' },
      { say: 'For "at least one", compute P(none) as a chain and subtract from 1.', why: 'The complement is one product; the direct count has many cases.' },
    ],
    predict: { question: 'Two cards: is P(same colour) above or below 1/2?', answer: 'Below: 25/51 ≈ 0.49. The first card removes one card of its own colour.' },
    edge: 'Draw 27 cards: both colours appear with certainty, since only 26 of each colour exist. (Any 3 cards already include two of the same colour.)',
    rule: 'Pair 3/51, same suit 12/51, same colour 25/51, two aces 1/221, flush ≈ 0.002.',
    contrast: 'With replacement the fractions stay fixed (1/4, 1/13, 1/2); without replacement they shrink. The gap is small for two cards and large for many.',
  },
};
