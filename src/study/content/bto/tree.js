// Recognition tree for the Beat the Odds book: from what the question looks like to its lesson.
// Every one of the 32 family lessons is a linked answer box; no path asks more than four questions.
const q = (id, text) => ({ id, text, kind: 'q' });
const a = (id, text, family) => ({ id, text, kind: 'a', link: `bto/${family}` });

const nodes = [
  q('q1', 'What does the question want?'),
  // Level 1
  q('qI', 'Told something first: what?'),
  q('qE', 'An average or a price: of what?'),
  q('qM', 'Something moves step by step: how?'),
  q('qP', 'A probability: what is random?'),
  // Information
  a('a-cd', 'A plain fact about the dice', 'conditional-dice'),
  a('a-bt', 'A test or signal with error rates', 'bayes-test'),
  q('qH', 'Something hidden: what?'),
  a('a-bb', 'A coin, box or card you cannot see', 'bayes-boxes'),
  a('a-mh', 'A host who knows opens a door', 'monty-hall'),
  // Expected value
  a('a-li', 'How many of something', 'linearity'),
  a('a-ex', 'The highest or lowest value', 'expected-extremes'),
  q('qT', 'Time until what?'),
  a('a-ew', 'One event, a few faces, a run', 'expected-waiting'),
  a('a-cc', 'Every type seen', 'coupon-collector'),
  a('a-pw', 'A coin pattern, or which comes first', 'pattern-waiting'),
  q('qG', 'A game with a choice: which?'),
  a('a-dg', 'Price a dice payoff, or reroll', 'dice-games-ev'),
  a('a-cs', 'Stop any time in a deck', 'card-stopping'),
  // Movement
  a('a-rs', 'A total that only grows', 'running-sum'),
  q('qW', '±1 steps: any walls?'),
  a('a-rw', 'No walls: where it ends or what it touches', 'random-walk-line'),
  a('a-gr', 'Two walls: which first, how long', 'gamblers-ruin'),
  a('a-pg', 'Around a polygon', 'polygon-walk'),
  // Probability
  a('a-ug', 'Uniform points: an area', 'uniform-geometry'),
  a('a-cl', 'A sum of many trials: estimate', 'clt-estimates'),
  a('a-dd', 'Two players compare rolls', 'dice-duel'),
  q('qDC', 'Dice, or coins and repeated tries?'),
  q('qD', 'Dice: what is asked?'),
  a('a-ts', 'The sum of two dice', 'two-dice-sum'),
  a('a-os', 'Max, min, doubles, differences', 'dice-order-stats'),
  a('a-dr', 'Repeats across throws of one die', 'die-repeats'),
  a('a-td', 'Three dice', 'three-dice'),
  q('qC', 'Repeated tries: what is asked?'),
  a('a-al', 'At least one success', 'at-least-one'),
  a('a-fs', 'The first success on try k', 'first-success'),
  a('a-sq', 'A count in n flips', 'coin-sequences'),
  a('a-rk', 'First to k wins a series', 'race-to-k'),
  q('qKB', 'Cards and urns, or boxes and people?'),
  q('qK', 'Cards or urns: what is asked?'),
  a('a-sy', 'One position, by symmetry', 'card-symmetry'),
  a('a-dw', 'Several draws in a row', 'card-draws'),
  a('a-ur', 'A hand, or a mix of colours', 'urn-draws'),
  q('qB', 'Boxes, birthdays or owners?'),
  a('a-ph', 'Some box must overflow', 'pigeonhole'),
  a('a-bd', 'Two share a value', 'birthday'),
  a('a-de', 'Items handed back to owners', 'derangements'),
];

const e = (from, to, label) => (label ? { from, to, label } : { from, to });
const edges = [
  e('q1', 'qI', 'given …'), e('q1', 'qE', 'expected value'), e('q1', 'qM', 'a walk or total'), e('q1', 'qP', 'a probability'),
  e('qI', 'a-cd'), e('qI', 'a-bt'), e('qI', 'qH'), e('qH', 'a-bb'), e('qH', 'a-mh'),
  e('qE', 'a-li'), e('qE', 'a-ex'), e('qE', 'qT', 'a wait'), e('qE', 'qG', 'a game'),
  e('qT', 'a-ew'), e('qT', 'a-cc'), e('qT', 'a-pw'), e('qG', 'a-dg'), e('qG', 'a-cs'),
  e('qM', 'a-rs', 'only up'), e('qM', 'qW', 'up or down'), e('qW', 'a-rw'), e('qW', 'a-gr'), e('qW', 'a-pg'),
  e('qP', 'a-ug', 'continuous'), e('qP', 'a-cl', 'many trials'), e('qP', 'a-dd', 'a duel'), e('qP', 'qDC'), e('qP', 'qKB'),
  e('qDC', 'qD', 'dice'), e('qDC', 'qC', 'coins, tries'),
  e('qD', 'a-ts'), e('qD', 'a-os'), e('qD', 'a-dr'), e('qD', 'a-td'),
  e('qC', 'a-al'), e('qC', 'a-fs'), e('qC', 'a-sq'), e('qC', 'a-rk'),
  e('qKB', 'qK', 'cards, urns'), e('qKB', 'qB', 'boxes, people'),
  e('qK', 'a-sy'), e('qK', 'a-dw'), e('qK', 'a-ur'),
  e('qB', 'a-ph'), e('qB', 'a-bd'), e('qB', 'a-de'),
];

export default {
  diagram: 'flow',
  caption: 'Start at the top and answer each question about the problem in front of you. Every answer box opens its lesson; no path needs more than four questions.',
  spec: { root: 'q1', nodes, edges },
};
