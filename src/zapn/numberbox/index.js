import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'numberbox',
  title: 'NumberBox',
  skill: 'Arithmetic search: work backwards from the target',
  spec: 'Make the target number from four numbers using +, −, ×, ÷ and brackets, each number used exactly once. 10 rounds; untimed, with the option to give up and move on (Aptitude Test Prep, JobTestPrep, EverythingQuant). This trainer draws the four numbers from 1 to 9 and targets from 10 to 99, with rounds ordered from many solutions to one or two; every round is checked solvable by an exhaustive exact-fraction solver.',
  engine,
  view,
  coach,
};
