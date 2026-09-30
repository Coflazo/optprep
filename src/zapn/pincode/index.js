import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'pincode',
  title: 'Pincode',
  skill: 'Working memory: hold and transform a digit string',
  spec: 'Memorise a digit code, then type it. Three modes: as shown, reversed, and sorted low to high. Codes lengthen as you succeed; two correct answers at a length move you up, two wrong answers end the mode. No pen and paper (Aptitude Test Prep, JobTestPrep). This trainer starts at 3 digits and shows the whole code for 0.6 s per digit (at least 1.5 s); the real display timing is not published.',
  engine,
  view,
  coach,
};
