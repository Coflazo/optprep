// Book: Intervals. Two opening lessons (the scoring rule and width, estimation tricks), then one
// lesson per question family, and a recognition tree from "what does the question look like"
// to the lesson that solves it.
import scoringAndWidth from './scoring-and-width.js';
import estimationTricks from './estimation-tricks.js';
import probExact from './prob-exact.js';
import probEstimate from './prob-estimate.js';
import expectedDice from './expected-dice.js';
import coupon from './coupon.js';
import waitingTime from './waiting-time.js';
import dotsCount from './dots-count.js';
import diceGrid from './dice-grid.js';
import pathLength from './path-length.js';
import percentile from './percentile.js';
import series from './series.js';
import mentalProduct from './mental-product.js';
import powersRoots from './powers-roots.js';
import combinatorics from './combinatorics.js';
import fermi from './fermi.js';

const chapters = [
  { title: 'Scoring and estimation', intro: 'How lower ÷ upper works, how wide to go for a given accuracy, and the arithmetic tricks every estimate relies on.', lessons: [scoringAndWidth, estimationTricks] },
  { title: 'Probabilities', intro: 'Exact when the setup is small, so a point or a tight bracket; estimated with a known error when it is not.', lessons: [probExact, probEstimate] },
  { title: 'Expected values and waiting times', intro: 'Exact answers built from averages and geometric waits: dice expectations, collecting every item, waiting for a run.', lessons: [expectedDice, coupon, waitingTime] },
  { title: 'Reading pictures', intro: 'Counting, measuring and summarising what is drawn, with a band sized to the error of doing it by eye in a minute.', lessons: [dotsCount, diceGrid, pathLength, percentile, series] },
  { title: 'Arithmetic, powers and counting', intro: 'Exact when short, estimated with a rounding ledger and a narrow band when long.', lessons: [mentalProduct, powersRoots, combinatorics, fermi] },
];

const tree = { diagram: 'flow', caption: 'Start at the top and answer each question about the item in front of you; every answer box opens its lesson. Whatever the box, the last step is the same: a point or bracket if exact, a band sized to your error if estimated.', spec: { root: 'start', nodes: [
  { id: 'start', text: 'An Intervals question: type lower and upper', kind: 'q' },
  { id: 'a-score', text: 'How the score works and how wide to go', kind: 'a', link: 'iv/scoring-and-width' },
  { id: 'q1', text: 'Is there a picture to read?', kind: 'q' },
  { id: 'q2', text: 'What does the picture show?', kind: 'q' },
  { id: 'a-dots', text: 'Dots, coins or mixed shapes to count', kind: 'a', link: 'iv/dots-count' },
  { id: 'a-dice', text: 'A 10 × 10 grid of dice', kind: 'a', link: 'iv/dice-grid' },
  { id: 'a-path', text: 'A path with a scale bar', kind: 'a', link: 'iv/path-length' },
  { id: 'a-pct', text: 'A grid of 200 numbers', kind: 'a', link: 'iv/percentile' },
  { id: 'a-series', text: 'A noisy chart over time', kind: 'a', link: 'iv/series' },
  { id: 'q3', text: 'Can you compute it exactly in 40 seconds?', kind: 'q' },
  { id: 'q4', text: 'Exact: what is asked for?', kind: 'q' },
  { id: 'a-pe', text: 'A probability in % from dice, coins, cards or a stick', kind: 'a', link: 'iv/prob-exact' },
  { id: 'a-ed', text: 'An expected value over a few dice', kind: 'a', link: 'iv/expected-dice' },
  { id: 'a-coupon', text: 'Draws until every item has appeared', kind: 'a', link: 'iv/coupon' },
  { id: 'a-wait', text: 'Tosses until a run like HTH or 66', kind: 'a', link: 'iv/waiting-time' },
  { id: 'a-comb', text: 'A small number of ways', kind: 'a', link: 'iv/combinatorics' },
  { id: 'a-mp', text: 'A two-digit product', kind: 'a', link: 'iv/mental-product' },
  { id: 'a-pow2', text: '2 to a power up to 20', kind: 'a', link: 'iv/powers-roots' },
  { id: 'q5', text: 'Estimate: what kind?', kind: 'q' },
  { id: 'a-est', text: 'Tricks for any estimate', kind: 'a', link: 'iv/estimation-tricks' },
  { id: 'a-pest', text: 'A probability over many trials', kind: 'a', link: 'iv/prob-estimate' },
  { id: 'a-mp2', text: 'Products and quotients with decimals', kind: 'a', link: 'iv/mental-product' },
  { id: 'a-pr', text: 'A root, log, big power or growth', kind: 'a', link: 'iv/powers-roots' },
  { id: 'a-comb2', text: 'A count too big to finish', kind: 'a', link: 'iv/combinatorics' },
  { id: 'a-fermi', text: 'A word problem of given rates and times', kind: 'a', link: 'iv/fermi' },
], edges: [
  { from: 'start', to: 'a-score', label: 'first time' },
  { from: 'start', to: 'q1' },
  { from: 'q1', to: 'q2', label: 'yes' },
  { from: 'q1', to: 'q3', label: 'no' },
  { from: 'q2', to: 'a-dots' }, { from: 'q2', to: 'a-dice' }, { from: 'q2', to: 'a-path' }, { from: 'q2', to: 'a-pct' }, { from: 'q2', to: 'a-series' },
  { from: 'q3', to: 'q4', label: 'yes' },
  { from: 'q3', to: 'q5', label: 'no' },
  { from: 'q4', to: 'a-pe' }, { from: 'q4', to: 'a-ed' }, { from: 'q4', to: 'a-coupon' }, { from: 'q4', to: 'a-wait' }, { from: 'q4', to: 'a-comb' }, { from: 'q4', to: 'a-mp' }, { from: 'q4', to: 'a-pow2' },
  { from: 'q5', to: 'a-est' }, { from: 'q5', to: 'a-pest' }, { from: 'q5', to: 'a-mp2' }, { from: 'q5', to: 'a-pr' }, { from: 'q5', to: 'a-comb2' }, { from: 'q5', to: 'a-fermi' },
] } };

export default {
  id: 'iv',
  title: 'Intervals',
  blurb: 'Every Intervals question type: when to compute exactly and type a point, when to estimate, and how wide to go so that lower ÷ upper pays.',
  chapters,
  tree,
  pending: false,
};
