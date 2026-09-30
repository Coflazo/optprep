// Book: NumberLogic. Chapters come from two parts written in parallel (a.js, b.js);
// the recognition tree lives in tree.js. This file only assembles them.
import partA from './a.js';
import partB from './b.js';
import tree from './tree.js';

const chapters = [...partA, ...partB];
export default {
  id: 'nl',
  title: 'NumberLogic',
  blurb: 'Every sequence type in NumberLogic: how to spot it in seconds, prove it, and find the next term.',
  chapters,
  tree,
  pending: chapters.length === 0,
};
