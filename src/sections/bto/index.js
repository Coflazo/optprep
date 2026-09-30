// Beat the Odds: every family below is a generator + independent verifier + lesson.
// Order follows the rough difficulty ramp of the real test (symmetry and counting first, EV and walks later).
import twoDiceSum from './families/two-dice-sum.js';
import dieRepeats from './families/die-repeats.js';
import diceOrderStats from './families/dice-order-stats.js';
import threeDice from './families/three-dice.js';
import atLeastOne from './families/at-least-one.js';
import firstSuccess from './families/first-success.js';
import conditionalDice from './families/conditional-dice.js';
import cardSymmetry from './families/card-symmetry.js';
import cardDraws from './families/card-draws.js';
import urnDraws from './families/urn-draws.js';
import coinSequences from './families/coin-sequences.js';
import raceToK from './families/race-to-k.js';
import patternWaiting from './families/pattern-waiting.js';
import bayesTest from './families/bayes-test.js';
import bayesBoxes from './families/bayes-boxes.js';
import montyHall from './families/monty-hall.js';
import pigeonhole from './families/pigeonhole.js';
import birthday from './families/birthday.js';
import derangements from './families/derangements.js';
import expectedWaiting from './families/expected-waiting.js';
import couponCollector from './families/coupon-collector.js';
import linearity from './families/linearity.js';
import expectedExtremes from './families/expected-extremes.js';
import diceDuel from './families/dice-duel.js';
import diceGamesEv from './families/dice-games-ev.js';
import cardStopping from './families/card-stopping.js';
import runningSum from './families/running-sum.js';
import randomWalkLine from './families/random-walk-line.js';
import polygonWalk from './families/polygon-walk.js';
import gamblersRuin from './families/gamblers-ruin.js';
import cltEstimates from './families/clt-estimates.js';
import uniformGeometry from './families/uniform-geometry.js';
import bank from './bank.js';

export const families = [
  twoDiceSum,
  dieRepeats,
  diceOrderStats,
  threeDice,
  atLeastOne,
  firstSuccess,
  conditionalDice,
  cardSymmetry,
  cardDraws,
  urnDraws,
  coinSequences,
  raceToK,
  patternWaiting,
  bayesTest,
  bayesBoxes,
  montyHall,
  pigeonhole,
  birthday,
  derangements,
  expectedWaiting,
  couponCollector,
  linearity,
  expectedExtremes,
  diceDuel,
  diceGamesEv,
  cardStopping,
  runningSum,
  randomWalkLine,
  polygonWalk,
  gamblersRuin,
  cltEstimates,
  uniformGeometry,
];

export default { id: 'bto', families, bank };
