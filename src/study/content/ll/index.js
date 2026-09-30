// Book: Likelihood List. An opening lesson on ranking without computing, then one lesson per
// question family, grouped by what the prompt shows. The recognition tree goes from the prompt's
// picture to the lesson that solves it; every family lesson is a linked answer box.
import compare from './compare-without-computing.js';
import bounds from './impossible-bounds.js';
import conjunction from './conjunction.js';
import scoreTable from './score-table.js';
import football from './football.js';
import surveyBar from './survey-bar.js';
import fundReturns from './fund-returns.js';
import histogramBins from './histogram-bins.js';
import scatterRegions from './scatter-regions.js';
import densityCurves from './density-curves.js';
import markovGraph from './markov-graph.js';
import diceEvents from './dice-events.js';
import cardEvents from './card-events.js';
import coinPatterns from './coin-patterns.js';
import collisions from './collisions.js';
import largeNumbers from './large-numbers.js';

const chapters = [
  { title: 'How to rank', intro: 'Only the exact order scores. Bounds and containment order most triples for free; exact work is saved for the one close pair.', lessons: [compare, bounds] },
  { title: 'Tables', intro: 'Every statement is rows that qualify over rows in scope; the wording names the scope.', lessons: [conjunction, scoreTable, football] },
  { title: 'Charts', intro: 'Bars, dots and curves are tables in disguise: count bars or dots, or measure area.', lessons: [surveyBar, fundReturns, histogramBins, scatterRegions, densityCurves] },
  { title: 'Graphs', intro: 'Probability moving along arrows: paths for a few steps, balance for the long run.', lessons: [markovGraph] },
  { title: 'Statements without a picture', intro: 'Dice, cards, coins, collisions and sample sizes: one fast tool per statement, and the classic traps each one hides.', lessons: [diceEvents, cardEvents, coinPatterns, collisions, largeNumbers] },
];

const tree = { diagram: 'flow', caption: 'Start at the top on every item. Each answer box opens its lesson.', spec: { root: 'r', nodes: [
  { id: 'r', text: 'Every item: bounds, containment, buckets, then exact work for one pair', kind: 'note', link: 'll/compare-without-computing' },
  { id: 'q0', text: 'Is a statement impossible or certain by a count?', kind: 'q' },
  { id: 'a-ib', text: 'Max achievable, already guaranteed, parity, pigeonhole', kind: 'a', link: 'll/impossible-bounds' },
  { id: 'q1', text: 'What does the prompt show?', kind: 'q' },
  { id: 'q-t', text: 'A table: what is one row?', kind: 'q' },
  { id: 'q-c', text: 'A chart: what is drawn?', kind: 'q' },
  { id: 'q-w', text: 'Only words: what is random?', kind: 'q' },
  { id: 'a-cj', text: 'A 2 × 2 count by two traits', kind: 'a', link: 'll/conjunction' },
  { id: 'a-st', text: 'A student with a score per subject', kind: 'a', link: 'll/score-table' },
  { id: 'a-fb', text: 'A match result, home team first', kind: 'a', link: 'll/football' },
  { id: 'a-sb', text: 'Grouped bars of survey counts', kind: 'a', link: 'll/survey-bar' },
  { id: 'a-fr', text: 'Two funds\' returns, one pair of bars per year', kind: 'a', link: 'll/fund-returns' },
  { id: 'a-hb', text: 'Touching bars of counts over ranges', kind: 'a', link: 'll/histogram-bins' },
  { id: 'a-sc', text: 'Dots on x and y axes', kind: 'a', link: 'll/scatter-regions' },
  { id: 'a-dc', text: 'Smooth density curves', kind: 'a', link: 'll/density-curves' },
  { id: 'a-mk', text: 'Nodes and arrows with probabilities', kind: 'a', link: 'll/markov-graph' },
  { id: 'a-de', text: 'Dice: throws, sums, at least k sixes', kind: 'a', link: 'll/dice-events' },
  { id: 'a-ce', text: 'Cards: two dealt, a hand, a named card', kind: 'a', link: 'll/card-events' },
  { id: 'a-cp', text: 'Coin strings: patterns, exact counts', kind: 'a', link: 'll/coin-patterns' },
  { id: 'a-co', text: 'Shared birthdays, repeats, matches', kind: 'a', link: 'll/collisions' },
  { id: 'a-ln', text: 'The same proportion in samples of different sizes', kind: 'a', link: 'll/large-numbers' },
], edges: [
  { from: 'r', to: 'q0' },
  { from: 'q0', to: 'a-ib', label: 'yes' },
  { from: 'q0', to: 'q1', label: 'no, or after pinning it' },
  { from: 'q1', to: 'q-t', label: 'a table' },
  { from: 'q1', to: 'q-c', label: 'a chart' },
  { from: 'q1', to: 'a-mk', label: 'a graph' },
  { from: 'q1', to: 'q-w', label: 'no picture' },
  { from: 'q-t', to: 'a-cj' }, { from: 'q-t', to: 'a-st' }, { from: 'q-t', to: 'a-fb' },
  { from: 'q-c', to: 'a-sb' }, { from: 'q-c', to: 'a-fr' }, { from: 'q-c', to: 'a-hb' }, { from: 'q-c', to: 'a-sc' }, { from: 'q-c', to: 'a-dc' },
  { from: 'q-w', to: 'a-de' }, { from: 'q-w', to: 'a-ce' }, { from: 'q-w', to: 'a-cp' }, { from: 'q-w', to: 'a-co' }, { from: 'q-w', to: 'a-ln' },
] } };

export default {
  id: 'll',
  title: 'Likelihood List',
  blurb: 'Rank three statements from most to least likely: tables, charts, graphs and pure-reasoning triples, each solved with bounds and containment first and exact counts only where needed.',
  chapters,
  tree,
  pending: false,
};
