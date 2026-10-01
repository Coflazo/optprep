// Recognition tree for the NumberLogic book: the method ladder's test order, from what the list
// looks like to its lesson. Every one of the 30 family lessons is a linked answer box, plus the
// method ladder itself; no path asks more than four questions.
const q = (id, text) => ({ id, text, kind: 'q' });
const a = (id, text, lesson) => ({ id, text, kind: 'a', link: `nl/${lesson}` });

const nodes = [
  q('q1', 'First look: what are the terms?'),
  a('a-fr', 'Split tops and bottoms', 'fractions'),
  a('a-dc', 'Same tests, careful with decimals', 'decimals'),
  a('a-as', 'Strip the signs, solve the sizes', 'alternating-signs'),
  q('q2', 'Subtract neighbours: which row goes flat?'),
  // one subtraction
  a('a-ar', 'Constant gap: add it', 'arithmetic'),
  // two subtractions
  q('q3', 'Second row flat: a famous list inside?'),
  a('a-sq', 'Near squares: b² + c', 'squares-plus'),
  a('a-tr', '1, 3, 6, 10: triangular', 'triangular'),
  a('a-pr', 'Products b × (b + c)', 'pronic'),
  a('a-ai', 'Gaps count 1, 2, 3, …', 'add-index'),
  a('a-sd', 'None: climb the ladder', 'second-diff'),
  // three subtractions
  q('q4', 'Third row flat: near cubes?'),
  a('a-cu', 'Cubes, shifted', 'cubes-plus'),
  a('a-td', 'Climb three rows', 'third-diff'),
  // rows that copy the row above: multiplication
  q('q5', 'Rows copy each other: what keeps one ratio?'),
  a('a-ge', 'The terms: multiply', 'geometric'),
  a('a-po', 'Powers of 2 or 3, shifted', 'powers-offset'),
  a('a-dg', 'The gaps: multiply the gap', 'diff-geometric'),
  // zigzag gaps
  q('q10', 'Gaps zigzag: every second term regular?'),
  a('a-il', 'Two strands taking turns', 'interleaved'),
  a('a-ao', 'Two operations taking turns', 'alternating-ops'),
  // nothing settles: divide
  q('q6', 'No row settles: what do the ratios do?'),
  a('a-mi', 'Multiply by the count', 'multiply-index'),
  q('q7', 'Leftover: next − k × previous?'),
  a('a-af', 'Constant: k × last + c', 'affine-recurrence'),
  a('a-mc', 'Counts or alternates: two rules', 'mixed-combo'),
  q('q8', 'Built from the last terms: how?'),
  a('a-fl', 'Last + previous', 'fibonacci-like'),
  a('a-tb', 'Sum of the last three', 'tribonacci'),
  a('a-sp', 'A sum, off by the same c', 'sum-previous'),
  a('a-wt', 'Weights: 2 × last + previous', 'weighted-two-term'),
  q('q9', 'Explodes: multiply what?'),
  a('a-pd', 'Last × previous', 'product-recurrence'),
  a('a-sm', 'Last², plus c', 'square-minus'),
  q('q11', 'Irregular: a known list, or the digits?'),
  a('a-pm', 'The terms are primes', 'primes'),
  a('a-pg', 'The gaps are primes', 'prime-gaps'),
  a('a-fs', 'Square roots are Fibonacci', 'fibonacci-squares'),
  a('a-ds', 'Gap = digit sum of the term', 'digit-sum'),
  a('a-rd', 'Gap = the term written backwards', 'reverse-digits'),
  a('a-ml', 'Nothing fits: skip, then review the ladder', 'method-ladder'),
];

const e = (from, to, label) => (label ? { from, to, label } : { from, to });
const edges = [
  e('q1', 'a-fr', 'fractions'), e('q1', 'a-dc', 'decimals'), e('q1', 'a-as', 'signs flip'), e('q1', 'q2', 'whole numbers'),
  e('q2', 'a-ar', 'the gaps'), e('q2', 'q3', 'gaps of gaps'), e('q2', 'q4', 'the third row'), e('q2', 'q5', 'rows copy'), e('q2', 'q10', 'gaps zigzag'), e('q2', 'q6', 'none'),
  e('q3', 'a-sq', 'squares'), e('q3', 'a-tr', 'running totals'), e('q3', 'a-pr', 'products'), e('q3', 'a-ai', 'gaps count'), e('q3', 'a-sd', 'none'),
  e('q4', 'a-cu', 'yes'), e('q4', 'a-td', 'no'),
  e('q5', 'a-ge', 'the terms'), e('q5', 'a-po', 'powers ± c'), e('q5', 'a-dg', 'the gaps'),
  e('q10', 'a-il', 'yes'), e('q10', 'a-ao', 'the steps alternate'),
  e('q6', 'a-mi', 'count 2, 3, 4'), e('q6', 'q7', 'near a whole k'), e('q6', 'q8', 'drift near 1.6 to 3'), e('q6', 'q9', 'explode'), e('q6', 'q11', 'irregular'),
  e('q7', 'a-af', 'constant'), e('q7', 'a-mc', 'changes'),
  e('q8', 'a-fl', 'two terms'), e('q8', 'a-tb', 'three terms'), e('q8', 'a-sp', 'sum + c'), e('q8', 'a-wt', 'weights'),
  e('q9', 'a-pd', 'two terms'), e('q9', 'a-sm', 'the last term'),
  e('q11', 'a-pm', 'primes'), e('q11', 'a-pg', 'prime gaps'), e('q11', 'a-fs', 'squares'), e('q11', 'a-ds', 'small gaps'), e('q11', 'a-rd', 'near doubling'), e('q11', 'a-ml', 'none'),
];

export default {
  diagram: 'flow',
  caption: 'Start at the left and run the tests in the method ladder\'s order: look at the terms, subtract, then divide. Every answer box opens its lesson; no path asks more than four questions.',
  spec: { root: 'q1', nodes, edges },
};
