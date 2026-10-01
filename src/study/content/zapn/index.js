// Book: Zap-N. Nine game lessons grouped by the skill each game measures, plus a recognition tree
// from "what does this game reward?" to the lesson that teaches its strategy.
import balloon from './balloon.js';
import skyscraper from './skyscraper.js';
import numberbox from './numberbox.js';
import figureitout from './figureitout.js';
import pincode from './pincode.js';
import shapeshift from './shapeshift.js';
import codecompare from './codecompare.js';
import theswitch from './theswitch.js';
import stockmaster from './stockmaster.js';

const chapters = [
  { title: 'Risk', intro: 'The one game where a formula gives the best play: stop each bet where its expected value peaks.', lessons: [balloon] },
  { title: 'Planning and search', intro: 'Find the shortest route before the first move: lower bounds and parks for blocks, backward search for numbers.', lessons: [skyscraper, numberbox] },
  { title: 'Deduction', intro: 'Use every bit of feedback on every guess.', lessons: [figureitout] },
  { title: 'Working memory', intro: 'Pack a code into chunks, and store only what the answer needs.', lessons: [pincode] },
  { title: 'Speed and attention', intro: 'Fast only when right: one rule, a proofreading pass, a switching rule, and several moving targets at once.', lessons: [shapeshift, codecompare, theswitch, stockmaster] },
];

const tree = { diagram: 'flow', caption: 'Start at the top: what does the game in front of you reward? Every answer box opens its lesson.', spec: { root: 'q1', nodes: [
  { id: 'q1', text: 'What does the game reward?', kind: 'q' },
  { id: 'a-bal', text: 'Pump or cash: sizing a risky bet', kind: 'a', link: 'zapn/balloon' },
  { id: 'q-plan', text: 'Fewest moves or an exact target: what do you rearrange?', kind: 'q' },
  { id: 'a-fig', text: 'Guessing a hidden figure from right and wrong marks', kind: 'a', link: 'zapn/figureitout' },
  { id: 'a-pin', text: 'Typing back a hidden code: as shown, reversed, sorted', kind: 'a', link: 'zapn/pincode' },
  { id: 'q-speed', text: 'Speed with accuracy: what do you respond to?', kind: 'q' },
  { id: 'a-sky', text: 'Blocks between three towers', kind: 'a', link: 'zapn/skyscraper' },
  { id: 'a-nb', text: 'Four numbers into a target', kind: 'a', link: 'zapn/numberbox' },
  { id: 'a-ss', text: 'One shape flashing anywhere', kind: 'a', link: 'zapn/shapeshift' },
  { id: 'a-cc', text: 'Four codes against a target', kind: 'a', link: 'zapn/codecompare' },
  { id: 'a-sw', text: 'Whichever of two blocks is highlighted', kind: 'a', link: 'zapn/theswitch' },
  { id: 'a-sm', text: 'Needles entering zones on several dials', kind: 'a', link: 'zapn/stockmaster' },
], edges: [
  { from: 'q1', to: 'a-bal', label: 'risk' },
  { from: 'q1', to: 'q-plan', label: 'planning' },
  { from: 'q1', to: 'a-fig', label: 'deduction' },
  { from: 'q1', to: 'a-pin', label: 'memory' },
  { from: 'q1', to: 'q-speed', label: 'speed' },
  { from: 'q-plan', to: 'a-sky' }, { from: 'q-plan', to: 'a-nb' },
  { from: 'q-speed', to: 'a-ss' }, { from: 'q-speed', to: 'a-cc' }, { from: 'q-speed', to: 'a-sw' }, { from: 'q-speed', to: 'a-sm' },
] } };

export default {
  id: 'zapn',
  title: 'Zap-N',
  blurb: 'All nine Zap-N games: the rules as this trainer runs them, the best strategy and why it is best, the common mistakes, and the number each game asks you to hit.',
  chapters,
  tree,
  pending: false,
};
