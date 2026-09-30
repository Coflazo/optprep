// Every NumberLogic family, ordered roughly by the difficulty at which each rule first
// appears (the exam ramps). Kept apart from index.js so bank.js can import it without a cycle.
import arithmetic from './families/arithmetic.js';
import geometric from './families/geometric.js';
import secondDiff from './families/second-diff.js';
import addIndex from './families/add-index.js';
import squaresPlus from './families/squares-plus.js';
import triangular from './families/triangular.js';
import diffGeometric from './families/diff-geometric.js';
import affineRecurrence from './families/affine-recurrence.js';
import fibonacciLike from './families/fibonacci-like.js';
import multiplyIndex from './families/multiply-index.js';
import interleaved from './families/interleaved.js';
import alternatingOps from './families/alternating-ops.js';
import cubesPlus from './families/cubes-plus.js';
import pronic from './families/pronic.js';
import primes from './families/primes.js';
import powersOffset from './families/powers-offset.js';
import decimals from './families/decimals.js';
import alternatingSigns from './families/alternating-signs.js';
import thirdDiff from './families/third-diff.js';
import tribonacci from './families/tribonacci.js';
import weightedTwoTerm from './families/weighted-two-term.js';
import productRecurrence from './families/product-recurrence.js';
import primeGaps from './families/prime-gaps.js';
import sumPrevious from './families/sum-previous.js';
import digitSum from './families/digit-sum.js';
import fractions from './families/fractions.js';
import fibonacciSquares from './families/fibonacci-squares.js';
import reverseDigits from './families/reverse-digits.js';
import squareMinus from './families/square-minus.js';
import mixedCombo from './families/mixed-combo.js';

export const families = [
  arithmetic,
  geometric,
  secondDiff,
  addIndex,
  squaresPlus,
  triangular,
  diffGeometric,
  affineRecurrence,
  fibonacciLike,
  multiplyIndex,
  interleaved,
  alternatingOps,
  cubesPlus,
  pronic,
  primes,
  powersOffset,
  decimals,
  alternatingSigns,
  thirdDiff,
  tribonacci,
  weightedTwoTerm,
  productRecurrence,
  primeGaps,
  sumPrevious,
  digitSum,
  fractions,
  fibonacciSquares,
  reverseDigits,
  squareMinus,
  mixedCombo,
];
