import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'figureitout',
  title: 'Figure It Out',
  skill: 'Deduction: use every bit of feedback on every guess',
  spec: 'A hidden figure has several properties (shape, colour, fill, and more in later rounds). You compose a guess by choosing a value for each property and learn which properties are right. 5 rounds with a growing number of properties; the number of guesses matters more than time (Aptitude Test Prep, JobTestPrep). One report says feedback gives only the count of right properties; this trainer follows the per-property reports. Property lists and value counts are this trainer\'s choice.',
  engine,
  view,
  coach,
};
