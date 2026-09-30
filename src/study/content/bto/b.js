// Beat the Odds, part B: chapters and lessons for the second half of the families.
// Order: each lesson builds on the ones before it (listed in its prerequisites).
import pigeonhole from './pigeonhole.js';
import birthday from './birthday.js';
import derangements from './derangements.js';
import expectedWaiting from './expected-waiting.js';
import linearity from './linearity.js';
import couponCollector from './coupon-collector.js';
import expectedExtremes from './expected-extremes.js';
import diceDuel from './dice-duel.js';
import diceGamesEv from './dice-games-ev.js';
import cardStopping from './card-stopping.js';
import runningSum from './running-sum.js';
import randomWalkLine from './random-walk-line.js';
import gamblersRuin from './gamblers-ruin.js';
import polygonWalk from './polygon-walk.js';
import uniformGeometry from './uniform-geometry.js';
import cltEstimates from './clt-estimates.js';

export default [
  { title: 'Counting arguments', intro: 'Certainties, collisions and matchings: find the worst case, count the pairs, count the permutations.', lessons: [pigeonhole, birthday, derangements] },
  { title: 'Expected value', intro: 'How long until, how many, how extreme: first-step equations, indicators, stages and tail sums.', lessons: [expectedWaiting, linearity, couponCollector, expectedExtremes] },
  { title: 'Games and stopping', intro: 'Who wins a duel, what a game is worth, and when to stop: prices are expectations, options are solved backwards.', lessons: [diceDuel, diceGamesEv, cardStopping] },
  { title: 'Random walks', intro: 'Totals that only climb, ±1 walks on a line, walls that end the game, and walks around a polygon.', lessons: [runningSum, randomWalkLine, gamblersRuin, polygonWalk] },
  { title: 'Continuous and estimation', intro: 'Uniform choices as areas, and sums of many trials as a normal curve.', lessons: [uniformGeometry, cltEstimates] },
];
