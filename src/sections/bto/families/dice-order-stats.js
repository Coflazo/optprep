// Two dice: maximum, minimum, doubles, differences, "first beats second".
import { mcqItem, agree, q, diceGrid } from '../lib.js';

const ID = 'dice-order-stats';

// The 36-cell grid with the event shaded, plus the exam-speed path and a check, per kind.
function explain(d) {
  const { kind, k } = d;
  if (kind === 'max') return {
    picture: diceGrid((a, b) => Math.max(a, b) === k, (n) => `Max exactly ${k} is an L-shaped band: row ${k} and column ${k} up to the corner, ${n} cells. It is the ${k} × ${k} square minus the ${k - 1} × ${k - 1} square.`),
    fast: `Squares: ${k}² − ${k - 1}² = ${2 * k - 1}, so ${2 * k - 1}/36.`,
    check: `The max leans high: P(max = 6) = 11/36 is the largest and P(max = 1) = 1/36 the smallest; ${2 * k - 1}/36 sits in that order.`,
  };
  if (kind === 'min') return {
    picture: diceGrid((a, b) => Math.min(a, b) === k, (n) => `Min exactly ${k} is an L-shaped band starting at (${k}, ${k}) and running to the far edges: ${n} cells.`),
    fast: `Squares from the top: ${7 - k}² − ${6 - k}² = ${13 - 2 * k}, so ${13 - 2 * k}/36.`,
    check: `The min leans low: P(min = 1) = 11/36 is the largest; min = ${k} and max = ${7 - k} have the same count, ${13 - 2 * k}.`,
  };
  if (kind === 'doubles') return {
    picture: diceGrid((a, b) => a === b, 'The doubles are the diagonal: 6 cells of 36.'),
    fast: 'Whatever the first die shows, the second matches it with chance 1/6.',
    check: 'One double per face, six in all: 6/36. A named double such as (6, 6) is six times rarer.',
  };
  if (kind === 'diff') return {
    picture: diceGrid((a, b) => Math.abs(a - b) === d.d, (n) => `Difference ${d.d} is two diagonals, ${6 - d.d} cells each side of the main one: ${n} cells.`),
    fast: `${6 - d.d} pairs one way, ${6 - d.d} the other: ${2 * (6 - d.d)}/36.`,
    check: `Larger differences are rarer: difference 1 has 10 cells and 5 has 2, and ${d.d} has ${2 * (6 - d.d)}.`,
  };
  if (kind === 'beats') return {
    picture: diceGrid((a, b) => a > b, "Rows are your die, columns your friend's. You win in the 15 cells below the diagonal; the 6 diagonal cells are ties and the 15 above are losses."),
    fast: 'Remove the 6 ties; half of the other 30 are yours: 15/36.',
    check: 'Win, tie and lose must add to 1: 15/36 + 6/36 + 15/36. An answer of 1/2 forgets the ties.',
  };
  return {
    picture: diceGrid((a, b) => Math.max(a, b) >= k, (n) => `Everything outside the ${k - 1} × ${k - 1} corner square of low pairs: ${n} cells.`),
    fast: `Complement: 1 − (${k - 1}/6)² = ${36 - (k - 1) ** 2}/36.`,
    check: `It must beat one die alone, ${7 - k}/6, but stay below adding the two dice, ${2 * (7 - k)}/6.`,
  };
}

function build(kind, rng) {
  if (kind === 'max' || kind === 'min') {
    const k = kind === 'max' ? rng.int(2, 6) : rng.int(1, 5);
    const w = kind === 'max' ? 2 * k - 1 : 13 - 2 * k;
    const cum = kind === 'max' ? k * k : (7 - k) ** 2;
    const word = kind === 'max' ? 'larger' : 'smaller';
    return {
      value: q(w, 36), data: { kind, k },
      text: `You throw two fair dice. What is the probability that the ${word} of the two faces is exactly ${k}? (If they are equal, that common value counts.)`,
      distractors: [
        { value: q(1, 6), misconception: `Assumed the ${word} face is equally likely to be any of 1..6. It is skewed towards ${kind === 'max' ? '6' : '1'}.` },
        { value: q(cum, 36), misconception: `Computed P(${word} face ${kind === 'max' ? '≤' : '≥'} ${k}); that also includes values ${kind === 'max' ? 'below' : 'above'} ${k}.` },
        { value: q(w + 1, 36), misconception: `Counted the double (${k}, ${k}) twice. It is one outcome.` },
        { value: q(kind === 'max' ? k : 7 - k, 36), misconception: 'Counted only outcomes where the first die carries the value, missing the mirrored ones.' },
        { value: q(2 * k - 1, 21), misconception: 'Used the 21 unordered pairs as equally likely outcomes.' },
      ],
      steps: [
        { say: `P(${word} ${kind === 'max' ? '≤' : '≥'} ${k}) = (${kind === 'max' ? k : 7 - k}/6)² = ${cum}/36.`, why: `The ${word} face is ${kind === 'max' ? 'at most' : 'at least'} ${k} exactly when both dice are.` },
        { say: `Subtract the same event one step further: ${kind === 'max' ? `(${k - 1})²` : `(${6 - k})²`} = ${kind === 'max' ? (k - 1) ** 2 : (6 - k) ** 2}. Favourable = ${w}.`, why: `What is left has the ${word} face exactly ${k}. Equivalently: (${k},${k}) plus the ${w - 1} outcomes with one die at ${k} and the other ${kind === 'max' ? 'below' : 'above'} it.` },
        { say: `P = ${w}/36 ≈ ${(w / 36).toFixed(3)}.`, why: 'Favourable over 36 ordered pairs.' },
      ],
      hints: [`When is the ${word} face ${kind === 'max' ? 'at most' : 'at least'} ${k}?`, 'Take a difference of two squares.', `${w}/36.`],
    };
  }
  if (kind === 'doubles') return {
    value: q(1, 6), data: { kind },
    text: 'You throw two fair dice. What is the probability that they show the same face (a double)?',
    distractors: [
      { value: q(1, 36), misconception: 'Required a specific double such as (6,6). Any of six doubles works.' },
      { value: q(6, 21), misconception: 'Used the 21 unordered pairs as equally likely: doubles would get 6/21. A mixed pair like {2,5} is twice as likely as a double.' },
      { value: q(5, 6), misconception: 'Answered the complement: the dice differ.' },
      { value: q(1, 2), misconception: 'Treated "same" and "different" as equally likely.' },
      { value: q(1, 12), misconception: 'Halved 1/6, as if ordered pairs double counted the doubles.' },
    ],
    steps: [
      { say: 'The first die can be anything; the second must match it.', why: 'No face is specified.' },
      { say: 'P = 1/6 (6 doubles out of 36 ordered pairs).', why: 'Each face has exactly one double.' },
    ],
    hints: ['Does the first die matter?', 'The second die must equal the first.', '6/36.'],
  };
  if (kind === 'diff') {
    const d = rng.int(1, 5);
    const w = 2 * (6 - d);
    return {
      value: q(w, 36), data: { kind, d },
      text: `You throw two fair dice. What is the probability that the faces differ by exactly ${d}?`,
      distractors: [
        { value: q(6 - d, 36), misconception: `Counted only one order: (a, a + ${d}) and (a + ${d}, a) are both outcomes.` },
        { value: q(1, 6), misconception: 'Assumed every difference 0..5 is equally likely. Small differences have more pairs.' },
        { value: q(6 - d, 21), misconception: 'Used the 21 unordered pairs as equally likely.' },
        { value: q(w + 2, 36), misconception: `Counted ${7 - d} starting values instead of ${6 - d}: an off-by-one at the edge of the die.` },
        { value: q(1).sub(q(w, 36)), misconception: 'Answered the complement.' },
      ],
      steps: [
        { say: `Pairs with difference ${d}: the smaller face can be 1..${6 - d}, so ${6 - d} unordered pairs.`, why: `The larger face = smaller + ${d} must stay at most 6.` },
        { say: `Each appears in two orders: ${w} ordered outcomes, P = ${w}/36 ≈ ${(w / 36).toFixed(3)}.`, why: 'The two dice are distinguishable.' },
      ],
      hints: ['How many values can the smaller face take?', 'Each unordered pair comes in two orders.', `2 × ${6 - d}/36.`],
    };
  }
  if (kind === 'beats') return {
    value: q(15, 36), data: { kind },
    text: 'You and a friend each throw one fair die. What is the probability that your face is strictly higher than your friend\'s?',
    distractors: [
      { value: q(1, 2), misconception: 'Split all outcomes between "you win" and "friend wins", forgetting the 6 ties.' },
      { value: q(21, 36), misconception: 'Counted ties as wins: that is P(yours ≥ friend\'s).' },
      { value: q(15, 21), misconception: 'Used the 21 unordered pairs as the sample space.' },
      { value: q(30, 36), misconception: 'Counted every non-tied outcome as a win for you. Half of those 30 outcomes are wins for your friend.' },
      { value: q(1, 6), misconception: 'Answered P(tie).' },
    ],
    steps: [
      { say: 'P(tie) = 6/36.', why: 'Six doubles.' },
      { say: 'The other 30 outcomes split evenly: you higher in 15, friend higher in 15.', why: 'Swapping the two dice maps "you higher" onto "friend higher", so they are equally likely.' },
      { say: 'P = 15/36 = 5/12 ≈ 0.417.', why: 'Symmetry after removing ties.' },
    ],
    hints: ['What happens in the outcomes that are not ties?', 'Remove the ties first.', '(36 − 6)/2 = 15.'],
  };
  const k = rng.int(3, 6);
  const v = q(36 - (k - 1) ** 2, 36);
  return {
    value: v, data: { kind: 'maxAtLeast', k },
    text: `You throw two fair dice. What is the probability that at least one of them shows ${k} or more?`,
    distractors: [
      { value: q(2 * (7 - k), 6), misconception: `Added P(die ≥ ${k}) for both dice; outcomes where both are ≥ ${k} are counted twice.` },
      { value: q((7 - k) ** 2, 36), misconception: `Computed P(both dice ≥ ${k}).` },
      { value: q((k - 1) ** 2, 36), misconception: `Answered the complement: both dice below ${k}.` },
      { value: q(7 - k, 6), misconception: 'Only considered one die.' },
    ],
    steps: [
      { say: `Complement: both dice ≤ ${k - 1}, probability (${k - 1}/6)² = ${(k - 1) ** 2}/36.`, why: '"At least one" is easiest through "none".' },
      { say: `P = 1 − ${(k - 1) ** 2}/36 = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Complement rule.' },
    ],
    hints: ['What is the opposite of "at least one shows k or more"?', 'Both dice below k.', `1 − (${k - 1}/6)².`],
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Two dice: max, min, doubles, differences',
  skill: 'Use P(max ≤ k) = (k/6)² and symmetry after removing ties',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? rng.pick(['doubles', 'beats', 'max']) : rng.pick(['min', 'diff', 'maxAtLeast', 'max']);
    const b = build(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      ...explain(b.data),
      rule: 'P(max ≤ k) = (k/6)²; P(max = k) = (2k − 1)/36; P(min = k) = (13 − 2k)/36; P(one beats other) = (1 − 1/6)/2.',
      anchor: 'The 36 ordered pairs of two dice, with the one change that we look at the larger or smaller face instead of the sum.',
    });
  },

  // Independent check: enumerate the 36 ordered pairs.
  verify(item) {
    const d = item.params;
    let hits = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      const ok = d.kind === 'max' ? Math.max(a, b) === d.k
        : d.kind === 'min' ? Math.min(a, b) === d.k
          : d.kind === 'doubles' ? a === b
            : d.kind === 'diff' ? Math.abs(a - b) === d.d
              : d.kind === 'beats' ? a > b
                : Math.max(a, b) >= d.k;
      if (ok) hits++;
    }
    return agree(item, hits / 36);
  },

  lesson: {
    purpose: 'Maxima, minima and "who rolls higher" show up constantly, and each has a two-line route once you think in terms of "both dice are at most k".',
    anchor: 'You already count 36 ordered pairs for sums. Order statistics are the same 36 pairs with one change: the event is about the larger or smaller face.',
    steps: [
      { say: 'max ≤ k ⇔ both dice ≤ k, so P(max ≤ k) = (k/6)².', why: 'Two independent conditions multiply.' },
      { say: 'P(max = k) = (k² − (k − 1)²)/36 = (2k − 1)/36.', why: 'Remove the pairs whose maximum is below k.' },
      { say: 'For "A beats B", remove the 6 ties and split the rest in half.', why: 'Swapping the dice turns every "A wins" outcome into a "B wins" outcome.' },
    ],
    predict: { question: 'Is the maximum of two dice more likely to be 6 or 3?', answer: '6: 11/36 against 5/36. Big maxima have more pairs.' },
    edge: 'P(max = 1) = 1/36 (only (1,1)); P(max = 6) = 11/36 (at least one six).',
    rule: 'max = k: (2k−1)/36; min = k: (13−2k)/36; beats: 15/36.',
    contrast: 'The maximum is skewed up, the minimum is skewed down, the sum is symmetric around 7.',
  },
};
