// Every Intervals family. Kept apart from index.js so bank.js can import it without a cycle.
import probExact from './families/prob-exact.js';
import probEstimate from './families/prob-estimate.js';
import expectedDice from './families/expected-dice.js';
import coupon from './families/coupon.js';
import waitingTime from './families/waiting-time.js';
import dotsCount from './families/dots-count.js';
import diceGrid from './families/dice-grid.js';
import pathLength from './families/path-length.js';
import percentile from './families/percentile.js';
import series from './families/series.js';
import mentalProduct from './families/mental-product.js';
import powersRoots from './families/powers-roots.js';
import combinatorics from './families/combinatorics.js';
import fermi from './families/fermi.js';

export const families = [
  probExact,
  probEstimate,
  expectedDice,
  coupon,
  waitingTime,
  dotsCount,
  diceGrid,
  pathLength,
  percentile,
  series,
  mentalProduct,
  powersRoots,
  combinatorics,
  fermi,
];
