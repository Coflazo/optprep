// Three dice: sums, all different, exactly a pair, triples, maximum, even product.
import { mcqItem, agree, q, pic, table } from '../lib.js';

const ID = 'three-dice';
const SPLIT = [['all different', 120, '6 × 5 × 4'], ['exactly a pair', 90, '3 positions × 6 × 5'], ['three of a kind', 6, 'one per face'], ['total', 216, '6³']];

function explain(d) {
  if (d.kind === 'sum') {
    const s = d.s, highlight = [], cellText = [];
    for (let a = 1; a <= 6; a++) { cellText.push([]); for (let b = 1; b <= 6; b++) { const c = s - a - b; cellText[a - 1].push(c >= 1 && c <= 6 ? String(c) : ''); if (c >= 1 && c <= 6) highlight.push([a - 1, b - 1]); } }
    return {
      picture: pic('grid', { rows: 6, cols: 6, highlight, count: highlight.length, cellText, rowTitle: 'first die', colTitle: 'second die' }, `Each cell is a first-two-dice pair; the number in it is the third die needed for sum ${s}. ${highlight.length} cells have a legal third die (1 to 6), so ${highlight.length} of 216.`),
      fast: `Fix the first two dice and ask whether ${s} − a − b is a face: ${highlight.length} pairs work, ${highlight.length}/216.`,
      check: `Sums s and 21 − s have the same count (here ${s} and ${21 - s}), and the peak is 27 ways at 10 and 11; ${highlight.length} fits that shape.`,
    };
  }
  if (d.kind === 'max') {
    const k = d.k, w = k ** 3 - (k - 1) ** 3;
    return {
      picture: table(['Event', 'Ordered triples'], [[`max ≤ ${k}`, `${k}³ = ${k ** 3}`], [`max ≤ ${k - 1}`, `${k - 1}³ = ${(k - 1) ** 3}`], [`max = ${k}`, `${k ** 3} − ${(k - 1) ** 3} = ${w}`]], `"Max at most ${k}" is a ${k} × ${k} × ${k} cube of outcomes. Peel off the smaller cube and the ${w} triples left have max exactly ${k}.`),
      fast: `Difference of cubes: ${k}³ − ${k - 1}³ = ${w}, over 216.`,
      check: `The max leans high: P(max = 6) = 91/216 is the largest, and the counts for 1 to 6 (1, 7, 19, 37, 61, 91) add to 216.`,
    };
  }
  if (d.kind === 'product') return {
    picture: table(['Dice', 'Ordered triples'], [['all three odd', '3 × 3 × 3 = 27'], ['at least one even', '216 − 27 = 189']], 'An odd product needs every die odd: 27 triples. Every other triple has an even factor.'),
    fast: 'Complement: 1 − (1/2)³ = 7/8.',
    check: 'One even die is enough, so the answer must be well above 1/2: 7/8.',
  };
  const pick = { allDiff: 0, pair: 1, triple: 2 }[d.kind];
  return {
    picture: table(['Type', 'Ordered triples', 'Count'], SPLIT.map(([t, n, how]) => [t, how, n]), `Every one of the 216 triples is exactly one type. Here we want "${SPLIT[pick][0]}": ${SPLIT[pick][1]} of 216.`),
    fast: { allDiff: '6/6 × 5/6 × 4/6 = 120/216 = 5/9.', pair: '216 − 120 (all different) − 6 (triples) = 90, so 90/216.', triple: 'The first die is free; the other two match it: (1/6)² = 1/36.' }[d.kind],
    check: 'The three types must add to 216: 120 + 90 + 6. An option that breaks the sum counts the wrong type.',
  };
}
// Ordered triples summing to s: coefficient of x^s in (x + ... + x^6)^3.
const ways3 = (s) => { let n = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const c = s - a - b; if (c >= 1 && c <= 6) n++; } return n; };
// Unordered multisets {a <= b <= c} summing to s.
const multisets3 = (s) => { let n = 0; for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) { const c = s - a - b; if (c >= b && c <= 6) n++; } return n; };

function build(kind, rng) {
  if (kind === 'sum') {
    const s = rng.int(4, 17);
    const w = ways3(s);
    const value = q(w, 216);
    return {
      value, data: { kind, s },
      text: `You throw three fair dice. What is the probability that the sum is exactly ${s}?`,
      distractors: [
        { value: q(1, 16), misconception: 'Treated the 16 possible sums (3 to 18) as equally likely. Middle sums have far more ways.' },
        { value: q(multisets3(s), 56), misconception: 'Counted unordered combinations (56 of them) as equally likely. (1,2,3) can occur in 6 orders but (2,2,2) in only one.' },
        { value: q(multisets3(s), 216), misconception: 'Counted each unordered combination once over 216, missing its re-orderings.' },
        { value: q(1).sub(value), misconception: 'Answered the complement.' },
        { value: q(w, 36), misconception: 'Divided by 36, the two-dice total. Three dice have 6³ = 216 ordered outcomes.' },
      ],
      steps: [
        { say: 'There are 6³ = 216 equally likely ordered triples.', why: 'Three independent dice, six faces each.' },
        { say: `Count ordered triples with sum ${s}: fix the first two dice and check the third is between 1 and 6. Count = ${w}.`, why: 'For each (a, b) exactly one c = s − a − b is needed, so count the (a, b) that leave a legal c.' },
        { say: `P = ${w}/216 = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Favourable over total.' },
      ],
      hints: ['How many ordered outcomes do three dice have?', 'For each first-two-dice pair, is the needed third face between 1 and 6?', `There are ${w} such triples.`],
    };
  }
  if (kind === 'allDiff') return {
    value: q(120, 216), data: { kind },
    text: 'You throw three fair dice. What is the probability that all three show different faces?',
    distractors: [
      { value: q(25, 36), misconception: 'Only required each die to differ from the previous one (5/6 × 5/6). The third die must avoid both earlier faces.' },
      { value: q(35, 36), misconception: 'Treated "all different" as the complement of "all the same". A pair like 2, 2, 5 is neither.' },
      { value: q(20, 216), misconception: 'Counted sets of three faces (C(6,3) = 20) and forgot the 3! = 6 orders of each.' },
      { value: q(1, 2), misconception: 'Guessed the midpoint; the count 6 × 5 × 4 = 120 out of 216 is needed.' },
    ],
    steps: [
      { say: 'Walk the dice: 6/6 × 5/6 × 4/6.', why: 'The second die must avoid one face, the third must avoid two.' },
      { say: 'P = 120/216 = 5/9 ≈ 0.556.', why: 'Multiply the conditional fractions.' },
    ],
    hints: ['After the first die, how many faces may the second show?', 'The third die must avoid two faces.', '6·5·4/216.'],
  };
  if (kind === 'pair') return {
    value: q(90, 216), data: { kind },
    text: 'You throw three fair dice. What is the probability that exactly two of them show the same face (a pair, not three of a kind)?',
    distractors: [
      { value: q(96, 216), misconception: 'Computed "at least two the same" (1 − 120/216), which also includes three of a kind.' },
      { value: q(1, 2), misconception: 'Added 1/6 for each of the three pairs of dice. Those pair events overlap (three of a kind is in all three).' },
      { value: q(30, 216), misconception: 'Forgot to choose which die is the odd one out: there are 3 positions for it.' },
      { value: q(15, 216), misconception: 'Required the pair to be one specific face (for example two sixes). Any of the 6 faces can form the pair.' },
      { value: q(1, 6), misconception: 'Only checked whether the first two dice match. The pair can be any two of the three dice, and the third die must differ.' },
    ],
    steps: [
      { say: 'Choose which two dice match: C(3,2) = 3 ways.', why: 'The odd die can be in any of three positions.' },
      { say: 'Choose the pair face (6) and a different face for the odd die (5): 30 face choices.', why: 'The odd die must differ from the pair, otherwise it is three of a kind.' },
      { say: 'Favourable = 3 × 30 = 90; P = 90/216 = 5/12 ≈ 0.417.', why: 'Check: 6 (triples) + 90 (pairs) + 120 (all different) = 216.' },
    ],
    hints: ['Split 216 outcomes into three types: all different, exactly a pair, three of a kind.', 'All different is 120 and three of a kind is 6.', '216 − 120 − 6 = 90.'],
  };
  if (kind === 'triple') return {
    value: q(6, 216), data: { kind },
    text: 'You throw three fair dice. What is the probability that all three show the same face?',
    distractors: [
      { value: q(1, 216), misconception: 'Required a specific face such as three sixes. Any of the 6 faces works.' },
      { value: q(1, 6), misconception: 'Only required the second die to match the first.' },
      { value: q(2, 6), misconception: 'Added 1/6 for each later die. Both matches must happen together, so multiply.' },
      { value: q(96, 216), misconception: 'Computed "at least two the same".' },
    ],
    steps: [
      { say: 'The first die sets the face; the other two must match it: 1/6 × 1/6.', why: 'No face is specified, so the first die is free.' },
      { say: 'P = 1/36 ≈ 0.028.', why: 'Equivalent to 6 favourable triples out of 216.' },
    ],
    hints: ['Is a particular face required?', 'Two dice must match the first.', '(1/6)².'],
  };
  if (kind === 'max') {
    const k = rng.int(3, 6);
    const w = k ** 3 - (k - 1) ** 3;
    return {
      value: q(w, 216), data: { kind, k },
      text: `You throw three fair dice. What is the probability that the highest face shown is exactly ${k}?`,
      distractors: [
        { value: q(1, 6), misconception: 'Assumed the maximum is uniform over 1..6. Large maxima are much more likely.' },
        { value: q(k ** 3, 216), misconception: `Computed P(max ≤ ${k}); it also includes maxima below ${k}.` },
        { value: q(3 * (k - 1) ** 2, 216), misconception: `Counted exactly one die at ${k} and forgot outcomes with two or three dice at ${k}.` },
        { value: q(3, 6).mul(q(k, 6)).mul(q(k, 6)), misconception: `Added three cases "die i shows ${k}, the others are at most ${k}". Outcomes with two or three dice at ${k} are counted more than once.` },
      ],
      steps: [
        { say: `P(max ≤ ${k}) = (${k}/6)³ = ${k ** 3}/216.`, why: 'The maximum is at most k exactly when every die is at most k.' },
        { say: `P(max = ${k}) = P(max ≤ ${k}) − P(max ≤ ${k - 1}) = (${k ** 3} − ${(k - 1) ** 3})/216 = ${w}/216.`, why: 'Subtracting removes the outcomes whose maximum is below k.' },
        { say: `P ≈ ${(w / 216).toFixed(3)}.`, why: 'Reduce and convert.' },
      ],
      hints: ['"Max ≤ k" is easy: every die ≤ k.', 'Take the difference of two "max ≤" probabilities.', `(${k}³ − ${k - 1}³)/216.`],
    };
  }
  return {
    value: q(189, 216), data: { kind },
    text: 'You throw three fair dice and multiply the faces. What is the probability that the product is even?',
    distractors: [
      { value: q(1, 2), misconception: 'Assumed products are even or odd equally often. One even factor is enough to make the product even.' },
      { value: q(1, 8), misconception: 'Computed P(product odd) = (1/2)³, the complement.' },
      { value: q(3, 8), misconception: 'Computed P(exactly one die even).' },
      { value: q(1, 2).mul(q(3)), misconception: 'Added 1/2 per die; that exceeds 1, a sign the events overlap.' },
      { value: q(3, 4), misconception: 'Only considered two of the three dice: 1 − (1/2)².' },
    ],
    steps: [
      { say: 'The product is odd only if every die is odd.', why: 'A single even factor makes a product even.' },
      { say: 'P(all odd) = (1/2)³ = 1/8, so P(even) = 7/8 = 0.875.', why: 'Complement of "all odd".' },
    ],
    hints: ['When is a product odd?', 'All three dice odd.', '1 − 1/8.'],
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Three dice',
  skill: 'Count 216 ordered triples; split into all different / pair / triple; max ≤ k is a cube',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const kind = difficulty === 2 ? rng.pick(['allDiff', 'pair', 'triple', 'product']) : rng.pick(['sum', 'max', 'sum', 'pair']);
    const b = build(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      ...explain(b.data),
      rule: '216 ordered triples = 120 all different + 90 exactly a pair + 6 triples. P(max ≤ k) = (k/6)³.',
      anchor: 'Two dice give 36 ordered pairs; three dice are the same idea with one more factor of 6: 216 ordered triples.',
    });
  },

  // Independent check: enumerate all 216 ordered triples.
  verify(item) {
    const d = item.params;
    let hits = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) {
      const distinct = new Set([a, b, c]).size;
      const ok = d.kind === 'sum' ? a + b + c === d.s
        : d.kind === 'allDiff' ? distinct === 3
          : d.kind === 'pair' ? distinct === 2
            : d.kind === 'triple' ? distinct === 1
              : d.kind === 'max' ? Math.max(a, b, c) === d.k
                : (a * b * c) % 2 === 0;
      if (ok) hits++;
    }
    return agree(item, hits / 216);
  },

  lesson: {
    purpose: 'Three-dice questions test whether you count ordered outcomes and whether you can split them into clean types quickly.',
    anchor: 'Two dice: 36 ordered pairs. Three dice: the same with one change, 216 ordered triples, which split into three shapes.',
    steps: [
      { say: 'Split 216 by shape: all different 6·5·4 = 120; three of a kind 6; exactly a pair 216 − 126 = 90.', why: 'Every triple has exactly one shape, so the counts add to 216.' },
      { say: 'For sums, fix the first two dice and ask whether the third is legal.', why: 'Each (a, b) gives at most one c, so counting pairs is enough.' },
      { say: 'For the maximum, use P(max ≤ k) = (k/6)³ and subtract.', why: '"Every die ≤ k" is a product of independent events.' },
    ],
    predict: { question: 'Which is more likely with three dice: a sum of 10 or a sum of 3?', answer: 'Sum 10: 27 ways against 1 way. Middle sums dominate.' },
    edge: 'Sum 3 and sum 18 each have exactly one ordered triple, 1/216.',
    rule: '120 / 90 / 6 split; P(max = k) = (k³ − (k−1)³)/216.',
    contrast: 'Unordered combinations (56) are not equally likely: (1,2,3) has 6 orders, (1,1,2) has 3, (1,1,1) has 1.',
  },
};
