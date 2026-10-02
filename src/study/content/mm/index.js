// Book: 80-in-8 mental math. An opening lesson on format, scoring and pace, then one lesson per
// question family, and a recognition tree from "what does the line look like" to its lesson.
import sprint from './sprint.js';
import addsub from './addsub.js';
import multiply from './multiply.js';
import divide from './divide.js';
import decimals from './decimals.js';
import fractions from './fractions.js';
import percent from './percent.js';
import missing from './missing.js';
import mixed from './mixed.js';

const chapters = [
  { title: 'How the 80-in-8 works', intro: 'The format, why accuracy beats reach under −1 scoring, the pace, and the two checks before every tap.', lessons: [sprint] },
  { title: 'Whole numbers', intro: 'Sums, differences, products and quotients: left to right, the shortcut multipliers, and multiplying back.', lessons: [addsub, multiply, divide] },
  { title: 'Decimals, fractions and percents', intro: 'Where the point goes, equal pieces before adding, and percent of which number.', lessons: [decimals, fractions, percent] },
  { title: 'Reversed and multi-step lines', intro: 'A blank on the left, and lines with two or three operations.', lessons: [missing, mixed] },
];

const tree = { diagram: 'flow', caption: 'Read the line once and answer each question about it; every answer box opens its lesson. Whatever the box, finish with the last-digit and size checks.', spec: { root: 'start', nodes: [
  { id: 'start', text: 'An 80-in-8 line: four options, one tap', kind: 'q' },
  { id: 'a-sprint', text: 'Format, scoring and pace', kind: 'a', link: 'mm/sprint' },
  { id: 'q1', text: 'Is there a ? left of the = sign?', kind: 'q' },
  { id: 'a-missing', text: 'Missing number: inverse, then put it back', kind: 'a', link: 'mm/missing' },
  { id: 'q2', text: 'Two or more operation signs, or brackets?', kind: 'q' },
  { id: 'a-mixed', text: 'Order of operations', kind: 'a', link: 'mm/mixed' },
  { id: 'q3', text: 'What kind of numbers?', kind: 'q' },
  { id: 'a-pct', text: 'A % sign', kind: 'a', link: 'mm/percent' },
  { id: 'a-frac', text: 'Fractions like 3/4', kind: 'a', link: 'mm/fractions' },
  { id: 'a-dec', text: 'A decimal point', kind: 'a', link: 'mm/decimals' },
  { id: 'q4', text: 'Whole numbers: which operation?', kind: 'q' },
  { id: 'a-add', text: '+ or −', kind: 'a', link: 'mm/addsub' },
  { id: 'a-mul', text: '× (look for 5, 25, 125, 11 or near 100)', kind: 'a', link: 'mm/multiply' },
  { id: 'a-div', text: '÷ or :', kind: 'a', link: 'mm/divide' },
], edges: [
  { from: 'start', to: 'a-sprint', label: 'first time' },
  { from: 'start', to: 'q1' },
  { from: 'q1', to: 'a-missing', label: 'yes' },
  { from: 'q1', to: 'q2', label: 'no' },
  { from: 'q2', to: 'a-mixed', label: 'yes' },
  { from: 'q2', to: 'q3', label: 'no' },
  { from: 'q3', to: 'a-pct' }, { from: 'q3', to: 'a-frac' }, { from: 'q3', to: 'a-dec' }, { from: 'q3', to: 'q4', label: 'whole' },
  { from: 'q4', to: 'a-add' }, { from: 'q4', to: 'a-mul' }, { from: 'q4', to: 'a-div' },
] } };

export default {
  id: 'mm',
  title: '80-in-8 mental math',
  blurb: 'The mental-math method ladder for the 80-in-8: a shortcut for every question shape, two checks that catch a wrong option, and pacing at 6 seconds a question.',
  chapters,
  tree,
  pending: false,
};
