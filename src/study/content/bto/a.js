// Beat the Odds, part A: chapters and lessons for the first half of the families.
// Order: each lesson builds on the ones before it (listed in its prerequisites).
import twoDiceSum from './two-dice-sum.js';
import diceOrderStats from './dice-order-stats.js';
import dieRepeats from './die-repeats.js';
import threeDice from './three-dice.js';
import atLeastOne from './at-least-one.js';
import firstSuccess from './first-success.js';
import coinSequences from './coin-sequences.js';
import raceToK from './race-to-k.js';
import patternWaiting from './pattern-waiting.js';
import cardSymmetry from './card-symmetry.js';
import cardDraws from './card-draws.js';
import urnDraws from './urn-draws.js';
import conditionalDice from './conditional-dice.js';
import bayesTest from './bayes-test.js';
import bayesBoxes from './bayes-boxes.js';
import montyHall from './monty-hall.js';

export default [
  { title: 'Dice', intro: 'Sample spaces you can draw as a grid.', lessons: [twoDiceSum, diceOrderStats, dieRepeats, threeDice] },
  { title: 'Repeated trials and coins', intro: 'Independent tries: complements, waiting for a first success, counting strings, series and patterns.', lessons: [atLeastOne, firstSuccess, coinSequences, raceToK, patternWaiting] },
  { title: 'Cards and urns', intro: 'Drawing without replacement: symmetry first, then shrinking products, then counting hands.', lessons: [cardSymmetry, cardDraws, urnDraws] },
  { title: 'Conditioning', intro: 'Information shrinks the sample space: plain facts, noisy signals, hidden objects and a host who chooses.', lessons: [conditionalDice, bayesTest, bayesBoxes, montyHall] },
];
