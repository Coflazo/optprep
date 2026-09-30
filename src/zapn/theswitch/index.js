import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'theswitch',
  title: 'The Switch',
  skill: 'Task switching: re-load the active rule before every answer',
  spec: 'Each round shows a sum or difference (top) and two sets of arrows (bottom). The highlighted block is the one to answer: top asks whether the result is odd, bottom asks whether both arrow sets point the same way. Answer Yes or No. The active block switches unpredictably. 35 rounds; speed and accuracy count equally (Aptitude Test Prep, JobTestPrep, QuantVault). The 4 s answer deadline is this trainer\'s choice; one report says late rounds allow about 1 s.',
  engine,
  view,
  coach,
};
