import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'skyscraper',
  title: 'Skyscraper',
  skill: 'Planning: work out the whole move sequence before the first move',
  spec: 'Tower of London style planning task. Three towers of coloured blocks; only the top block of a tower can move, onto another tower with room. Rebuild the target configuration in as few moves as possible across 10 progressive levels. Untimed, but moves, completion time and planning time before the first move are all recorded (reported by Aptitude Test Prep and JobTestPrep). Tower height caps and level sizes are this trainer\'s choice; every level has a BFS-verified optimum.',
  engine,
  view,
  coach,
};
