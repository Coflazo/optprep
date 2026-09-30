// NumberLogic, part A: the method ladder, then the first fifteen families (the rules the exam
// introduces first, see src/sections/nl/registry.js), grouped by the idea that solves them.
import methodLadder from './method-ladder.js';
import arithmetic from './arithmetic.js';
import geometric from './geometric.js';
import secondDiff from './second-diff.js';
import addIndex from './add-index.js';
import diffGeometric from './diff-geometric.js';
import squaresPlus from './squares-plus.js';
import triangular from './triangular.js';
import cubesPlus from './cubes-plus.js';
import pronic from './pronic.js';
import primes from './primes.js';
import affineRecurrence from './affine-recurrence.js';
import fibonacciLike from './fibonacci-like.js';
import multiplyIndex from './multiply-index.js';
import interleaved from './interleaved.js';
import alternatingOps from './alternating-ops.js';

export default [
  { title: 'The method', intro: 'One ladder of tests that finds almost every rule, and the order to run them in.', lessons: [methodLadder] },
  { title: 'Constant layers', intro: 'Subtract or divide until a row is constant, then climb back up.', lessons: [arithmetic, geometric, secondDiff, addIndex, diffGeometric] },
  { title: 'Famous lists in disguise', intro: 'Squares, triangular numbers, cubes, products of neighbours and primes, shifted or scaled.', lessons: [squaresPlus, triangular, cubesPlus, pronic, primes] },
  { title: 'Built from the terms before', intro: 'Each term made from the previous one or two: multiply and add, add the last two, multiply by a count.', lessons: [affineRecurrence, fibonacciLike, multiplyIndex] },
  { title: 'Two rules at once', intro: 'Zigzag lists: two sequences taking turns, or two operations taking turns.', lessons: [interleaved, alternatingOps] },
];
