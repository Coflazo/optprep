// Book: Probability foundations. Twelve foundation lessons, each relying only on earlier ones,
// plus a recognition tree from "what does the question look like" to the lesson that solves it.
import sampleSpaces from './sample-spaces.js';
import counting from './counting.js';
import complement from './complement.js';
import inclusionExclusion from './inclusion-exclusion.js';
import conditionalBayes from './conditional-bayes.js';
import independence from './independence.js';
import expectation from './expectation-linearity.js';
import symmetry from './symmetry.js';
import discrete from './discrete-distributions.js';
import poissonNormal from './poisson-normal.js';
import firstStep from './first-step-markov.js';
import estimation from './estimation-clt.js';

const chapters = [
  { title: 'Counting outcomes', intro: 'What an outcome is, how to count them, and when to count the other side.', lessons: [sampleSpaces, counting, complement] },
  { title: 'Combining events', intro: 'Or, given, and: the three ways events combine.', lessons: [inclusionExclusion, conditionalBayes, independence] },
  { title: 'Expectation', intro: 'Averages, fair prices, and the one-line arguments that skip the algebra.', lessons: [expectation, symmetry] },
  { title: 'Distributions', intro: 'The shapes that repeated trials, rare events and measurements take.', lessons: [discrete, poissonNormal] },
  { title: 'Processes and estimation', intro: 'Processes that run until something happens, and quick estimates of big sums.', lessons: [firstStep, estimation] },
];

const tree = { diagram: 'flow', caption: 'Start at the top and answer each question about the problem in front of you; every answer box opens its lesson.', spec: { root: 'q1', nodes: [
  { id: 'q1', text: 'What does the question ask for?', kind: 'q' },
  { id: 'q2', text: 'A probability: what shape is the event?', kind: 'q' },
  { id: 'q3', text: 'A count of successes or a waiting time: which kind?', kind: 'q' },
  { id: 'a-ss', text: 'One experiment, "favourable over total"', kind: 'a', link: 'prob/sample-spaces' },
  { id: 'a-ct', text: 'How many ways, hands, codes or committees', kind: 'a', link: 'prob/counting' },
  { id: 'a-cm', text: '"At least one", "not all"', kind: 'a', link: 'prob/complement' },
  { id: 'a-ie', text: '"A or B", overlapping groups', kind: 'a', link: 'prob/inclusion-exclusion' },
  { id: 'a-cb', text: '"Given that", a test result, the second draw', kind: 'a', link: 'prob/conditional-bayes' },
  { id: 'a-in', text: '"A and B" across separate trials', kind: 'a', link: 'prob/independence' },
  { id: 'a-sy', text: 'Which comes first, the k-th card, who wins a duel', kind: 'a', link: 'prob/symmetry' },
  { id: 'a-ev', text: 'An expected value, fair price or expected count', kind: 'a', link: 'prob/expectation-linearity' },
  { id: 'a-dd', text: 'Fixed trials, first success, or draws without replacement', kind: 'a', link: 'prob/discrete-distributions' },
  { id: 'a-pn', text: 'Rare events at a rate, or a normal curve', kind: 'a', link: 'prob/poisson-normal' },
  { id: 'a-fs', text: 'A process that runs until something happens', kind: 'a', link: 'prob/first-step-markov' },
  { id: 'a-cl', text: 'An estimate for a sum of many pieces', kind: 'a', link: 'prob/estimation-clt' },
], edges: [
  { from: 'q1', to: 'q2', label: 'a probability' },
  { from: 'q1', to: 'a-ev', label: 'an average' },
  { from: 'q1', to: 'q3', label: 'a count or wait' },
  { from: 'q1', to: 'a-fs', label: 'until …' },
  { from: 'q1', to: 'a-cl', label: 'many pieces' },
  { from: 'q2', to: 'a-ss' }, { from: 'q2', to: 'a-ct' }, { from: 'q2', to: 'a-cm' }, { from: 'q2', to: 'a-ie' },
  { from: 'q2', to: 'a-cb' }, { from: 'q2', to: 'a-in' }, { from: 'q2', to: 'a-sy' },
  { from: 'q3', to: 'a-dd' }, { from: 'q3', to: 'a-pn' },
] } };

export default {
  id: 'prob',
  title: 'Probability foundations',
  blurb: 'The tools every probability question is built from: counting, complements, or, given, and, expectation, symmetry, the standard distributions, first-step analysis and fast estimation.',
  chapters,
  tree,
  pending: false,
};
