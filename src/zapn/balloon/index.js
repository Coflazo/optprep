import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'balloon',
  title: 'Balloon',
  skill: 'Risk sizing: stop each bet where its expected value peaks',
  spec: 'Balloon Analogue Risk Task. Round 1: 30 balloons, 10c per pump, a pop loses that balloon\'s money. Round 2: 20 balloons, 20c per pump, a pop also costs 50% of the round-2 bank. Untimed; you cash in whenever you like. Reported by Aptitude Test Prep and JobTestPrep; the pop distribution is not published, so this trainer uses a pop point uniform on 1 to 20 pumps.',
  engine,
  view,
  coach,
};
