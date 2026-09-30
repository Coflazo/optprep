import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'shapeshift',
  title: 'Shapeshift',
  skill: 'Speeded classification: fast responses without trading away accuracy',
  spec: 'A circle or a square flashes briefly at a random spot on screen. Press the right arrow for a circle and the left arrow for a square. 60 rounds; speed and accuracy are both measured (reported by Aptitude Test Prep and JobTestPrep). Flash length (500 ms) and the response window (1.5 s) are this trainer\'s choice; the sources only say the shapes appear briefly.',
  engine,
  view,
  coach,
};
