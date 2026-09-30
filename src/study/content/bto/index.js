// Book: Beat the Odds. Chapters come from two parts written in parallel (a.js, b.js);
// the recognition tree lives in tree.js. This file only assembles them.
import partA from './a.js';
import partB from './b.js';
import tree from './tree.js';

const chapters = [...partA, ...partB];
export default {
  id: 'bto',
  title: 'Beat the Odds',
  blurb: 'Every Beat the Odds question type: dice, cards, coins, urns, games and expected values, each solved from first principles.',
  chapters,
  tree,
  pending: chapters.length === 0,
};
