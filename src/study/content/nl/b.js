// NumberLogic, part B: the fifteen families the exam introduces later (see src/sections/nl/registry.js),
// grouped by the idea that solves them and ordered so each lesson builds on the ones before it.
import thirdDiff from './third-diff.js';
import powersOffset from './powers-offset.js';
import decimals from './decimals.js';
import alternatingSigns from './alternating-signs.js';
import fractions from './fractions.js';
import tribonacci from './tribonacci.js';
import sumPrevious from './sum-previous.js';
import weightedTwoTerm from './weighted-two-term.js';
import productRecurrence from './product-recurrence.js';
import squareMinus from './square-minus.js';
import primeGaps from './prime-gaps.js';
import fibonacciSquares from './fibonacci-squares.js';
import digitSum from './digit-sum.js';
import reverseDigits from './reverse-digits.js';
import mixedCombo from './mixed-combo.js';

export default [
  { title: 'One layer deeper', intro: 'A third row of differences, and powers of 2 or 3 hidden under a constant shift.', lessons: [thirdDiff, powersOffset] },
  { title: 'Familiar rules in disguise', intro: 'Decimals, flipping signs and fractions change how a sequence looks, not how you solve it.', lessons: [decimals, alternatingSigns, fractions] },
  { title: 'Longer memories', intro: 'Each term built from the last two or three: wider windows, constants, weights, products and squares.', lessons: [tribonacci, sumPrevious, weightedTwoTerm, productRecurrence, squareMinus] },
  { title: 'Hidden lists and digit rules', intro: 'When no row ever settles: a famous list one layer down, or a rule that reads the digits.', lessons: [primeGaps, fibonacciSquares, digitSum, reverseDigits] },
  { title: 'Two rules stacked', intro: 'The last items: peel off the multiplier, then solve what is left as its own sequence.', lessons: [mixedCombo] },
];
