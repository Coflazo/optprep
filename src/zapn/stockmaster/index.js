import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'stockmaster',
  title: 'Stock Master',
  skill: 'Sustained attention and timing across several moving targets',
  spec: 'Several indicators appear and disappear; each needle rises at its own speed. Click an indicator while its needle is inside the coloured zone to buy. Too early or too late scores badly and a needle that runs out is a missed trade. 2 minutes continuous (Aptitude Test Prep, TrueInterview). This trainer uses 4 slots, sweeps of about 1 to 4 s that speed up over the 2 minutes, and zones covering 12 to 20% of the dial.',
  engine,
  view,
  coach,
};
