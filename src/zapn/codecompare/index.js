import * as engine from './engine.js';
import * as view from './view.js';
import coach from './coach.js';

export default {
  id: 'codecompare',
  title: 'CodeCompare',
  skill: 'Visual precision under a shrinking deadline',
  spec: 'A licence-plate style code of 7 to 10 letters and digits, and 4 candidates; exactly one is identical, the others differ by 1 or 2 characters. 30 rounds; the time allowance shrinks from 5 s to 3 s and the codes lengthen (Aptitude Test Prep, TrueInterview). Other reports describe the window shrinking toward 1 s or less, and one describes the code as disappearing before the options appear; this trainer keeps the code visible and uses 5 s to 3 s.',
  engine,
  view,
  coach,
};
