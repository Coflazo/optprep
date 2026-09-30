// Likelihood List: scenario families (visual + three statements with exact probabilities).
// Order: table and chart reading first, then pure-reasoning triples and the trap families.
import conjunction from './families/conjunction.js';
import scoreTable from './families/score-table.js';
import football from './families/football.js';
import surveyBar from './families/survey-bar.js';
import fundReturns from './families/fund-returns.js';
import histogramBins from './families/histogram-bins.js';
import scatterRegions from './families/scatter-regions.js';
import densityCurves from './families/density-curves.js';
import markovGraph from './families/markov-graph.js';
import diceEvents from './families/dice-events.js';
import cardEvents from './families/card-events.js';
import coinPatterns from './families/coin-patterns.js';
import collisions from './families/collisions.js';
import largeNumbers from './families/large-numbers.js';
import impossibleBounds from './families/impossible-bounds.js';
import bank from './bank.js';

export const families = [
  conjunction,
  scoreTable,
  football,
  surveyBar,
  fundReturns,
  histogramBins,
  scatterRegions,
  densityCurves,
  markovGraph,
  diceEvents,
  cardEvents,
  coinPatterns,
  collisions,
  largeNumbers,
  impossibleBounds,
];

export default { id: 'll', families, bank };
