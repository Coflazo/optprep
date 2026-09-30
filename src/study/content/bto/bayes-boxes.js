// Bayes with physical objects: coins (one double-headed), boxes of balls, two-sided cards.
// Weigh each hypothesis by prior × likelihood; count the equally likely atoms you could have seen.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const one = Q.of(1);
// m coins, one double-headed, k heads in a row: P(double-headed | evidence).
const dh = (m, k) => one.div(one.add(Q.of(m - 1, 2 ** k)));
// Box A: a red, b blue; box B: c red, d blue; equal priors; a red ball is drawn.
const boxA = (a, b, c, d) => { const la = Q.of(a, a + b), lb = Q.of(c, c + d); return la.div(la.add(lb)); };
// Two-sided cards: rr double red, mx mixed; a red face is seen.
const cards = (rr, mx) => Q.of(2 * rr, 2 * rr + mx);
const d3 = (x) => (Math.round((x instanceof Q ? x.toNumber() : x) * 1000) / 1000).toFixed(3);
const KS = [0, 1, 2, 3, 4, 5, 6];
const box = (rng) => { let a, b, c, d; do { a = rng.int(1, 6); b = rng.int(1, 6); c = rng.int(1, 6); d = rng.int(1, 6); } while (a + b === c + d || a * (c + d) === c * (a + b)); return { a, b, c, d }; };

export default {
  id: 'bto/bayes-boxes',
  book: 'bto',
  kind: 'family',
  family: 'bayes-boxes',
  title: 'Bayes: coins, boxes and cards',
  summary: 'Weigh each hidden object by prior × likelihood of what you saw. Count faces and balls, not objects.',
  prerequisites: ['bto/bayes-test'],
  objectives: [
    'List the hidden objects with priors and the likelihood of the evidence under each',
    'Compute the posterior as prior × likelihood over the total, or with odds',
    'Solve the two-sided card puzzle by counting faces (2/3), not cards (1/2)',
    'Weight boxes of different sizes correctly instead of pooling their balls',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: three cards are in a hat, one red on both sides, one black on both sides, one red on one side and black on the other. You draw a card and look at a random side: it is red. What is the probability the other side is red? Try two approaches.', answer: `${cards(1, 1)}`, explain: 'Three red faces could be showing: two belong to the red-red card, one to the mixed card. Two of three have a red back. If you said 1/2, you counted cards instead of faces.' },
    { type: 'text', text: 'An object is picked at random from a few kinds (a fair or a double-headed coin, box A or box B, one of several two-sided cards). You observe something it produced (heads several times, a red ball, a red face) and are asked which object you are holding, or what its hidden side shows.' },
    { type: 'list', items: ['"One of 10 coins is double-headed. You pick one, flip it 3 times: 3 heads. Probability it is the double-headed coin?"', '"Box A has 2 red, 1 blue; box B has 1 red, 3 blue. Pick a box at random, draw red. Probability it was box A?"', '"Three two-sided cards; you see a red face. Probability the back is red?"'] },
    { type: 'text', text: 'Not this lesson: rates of a signal in a population (bto/bayes-test), and a host who chooses what to reveal (bto/monty-hall). Here the evidence is produced by the object itself.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Urn X has 3 white, urn Y has 1 white and 2 black; a random urn gives white: P(urn X)?', '2% of emails are spam; a filter flags 90% of spam and 5% of others: P(spam | flagged)?', 'A host who knows the car opens a goat door: switch?', 'Draw 2 balls from one urn: P(both white)?'], answer: 0, traps: { 1: 'rates in a population: bto/bayes-test', 2: 'a host choosing what to show: bto/monty-hall', 3: 'no hidden object to infer: bto/urn-draws' }, explain: 'A hidden urn, evidence it produced, which urn was it.' },
    ] },

    S('why'),
    { type: 'text', text: 'These questions look like puzzles, and the puzzle is always the same: which things were **equally likely to be observed**? The wrong answers come from counting objects (cards, boxes) as if each were equally likely to produce what you saw. Once you weigh each object by how likely it was to produce the evidence, every version is one division.' },

    S('anchor'),
    { type: 'text', text: 'From bto/bayes-test: the answer is the "true" share of everything that could have produced the observation, prior × likelihood over the total. Here the same rule applies with **one change**: the hypotheses are physical objects, and the likelihoods come from **counting** inside each object (faces on a card, red balls in a box, heads from a coin) instead of being given as rates.' },
    { type: 'check', scope: 'prior × likelihood over the total', questions: [
      { type: 'choice', q: 'Hypothesis H has prior 1/3 and makes the evidence certain; its alternative has prior 2/3 and makes it happen half the time. P(H | evidence)?', options: ['1/2', '1/3', '2/3', '1'], answer: 0, traps: { 1: 'kept the prior', 2: 'used only the likelihoods (1 against 1/2) and dropped the priors', 3: 'thought evidence certain under H makes H certain' }, explain: '(1/3 × 1) / (1/3 × 1 + 2/3 × 1/2) = (1/3)/(2/3) = 1/2.' },
    ] },

    S('picture'),
    { type: 'text', text: 'The card puzzle as a grid of faces. Each row is a card, each column one of its sides. You are equally likely to be looking at any of the 6 faces. The highlighted faces are the red ones you could be seeing.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 3, cols: 2, rowLabels: ['RR', 'RB', 'BB'], colLabels: ['side 1', 'side 2'], rowTitle: 'card', colTitle: 'side seen', cellText: [['R', 'R'], ['R', 'B'], ['B', 'B']], highlight: [[0, 0], [0, 1], [1, 0]], count: 3 }, caption: 'Three red faces are possible. Two sit on the RR card, whose back is red; one on the RB card, whose back is black. P(back red | red seen) = 2/3.' },
    { type: 'check', scope: 'faces are the equally likely atoms', questions: [
      { make: (rng) => { const rr = rng.int(1, 3), mx = rng.int(1, 3), bb = rng.int(0, 2); return mc(rng, `A hat holds ${rr} red-red, ${mx} red-black and ${bb} black-black cards. You see a red face. P(the back is red)?`, cards(rr, mx).toString(), [[Q.of(rr, rr + mx).toString(), 'counted cards with a red side, not red faces'], ['1/2', 'two card types, so 1/2'], [Q.of(rr, rr + mx + bb).toString(), 'the prior chance of drawing a red-red card'], [Q.of(mx, 2 * rr + mx).toString(), 'answered the chance the back is black'], [Q.of(2 * rr, 2 * (rr + mx + bb)).toString(), 'divided the red-red faces by all faces, including the black ones you did not see']], `Red faces: ${2 * rr} on red-red cards, ${mx} on mixed: ${cards(rr, mx)}.`); } },
    ] },
    { type: 'text', text: 'A coin bag: 4 coins, one double-headed, three fair. Pick one and flip it twice: two heads. As a tree, split on the coin first (the prior), then on the evidence (the likelihood). Every path that shows two heads is marked.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'pick', children: [
      { p: '1/4', label: 'double-headed', children: [{ p: '1', label: 'HH', mark: true }] },
      { p: '3/4', label: 'fair', children: [{ p: '1/4', label: 'HH', mark: true }, { p: '3/4', label: 'not HH' }] },
    ] }, total: Q.of(1, 4).add(Q.of(3, 16)).toString() }, caption: `P(HH) = 1/4 + 3/16 = ${Q.of(1, 4).add(Q.of(3, 16))}. The double-headed share of it: (1/4) / ${Q.of(1, 4).add(Q.of(3, 16))} = ${dh(4, 2)}.` },
    { type: 'check', scope: 'weights from the tree', questions: [
      { make: (rng) => { const m = rng.int(3, 10), k = rng.int(1, 4); return mc(rng, `${m} coins: one double-headed, ${m - 1} fair. Pick one, flip it ${k} time${k > 1 ? 's' : ''}: all heads. P(double-headed)?`, dh(m, k).toString(), [[Q.of(1, m).toString(), 'kept the prior 1/m'], [one.sub(Q.of(1, 2 ** k)).toString(), 'used "a fair coin rarely does this" as the answer'], [dh(m, k - 1).toString(), `used ${k - 1} heads instead of ${k}`]], `Weights: 1/${m} × 1 against ${m - 1}/${m} × 1/${2 ** k}: ${dh(m, k)}.`); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: '10 coins, one double-headed: P(double-headed) after k heads', xLabel: 'heads in a row k', yLabel: 'probability', categories: KS.map(String), series: [{ name: 'P', values: KS.map((k) => Math.round(dh(10, k).toNumber() * 1000) / 1000) }], valueLabels: true }, caption: 'Each head doubles the odds in favour of the double-headed coin (a fair coin shows heads half the time, the fake always). Starting at 1 : 9, the odds pass even after 4 heads.' },
    { type: 'check', scope: 'each head doubles the odds', questions: [
      { type: 'choice', q: '10 coins, one double-headed. After how many heads in a row does the double-headed coin become more likely than not?', options: ['4', '3', '9', '1'], answer: 0, traps: { 1: `odds 8 : 9 after three heads: still below even`, 2: 'needed as many heads as fair coins', 3: 'one head only doubles 1 : 9 to 2 : 9' }, explain: 'Odds 1 : 9, then 2 : 9, 4 : 9, 8 : 9, 16 : 9. Four heads.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'List the hypotheses (which object) with their priors: the chance of picking each before any evidence.', why: 'Before you look, only the pick is uncertain. Priors come from how the object was chosen, not from its size.',
        checks: [
          { type: 'choice', q: 'Box A has 2 balls, box B has 10. You pick a box by a coin flip. Prior of box A?', options: ['1/2', '1/6', '2/12', '5/6'], answer: 0, traps: { 1: 'weighted by the number of balls; the box is chosen by a coin', 2: 'the same size weighting, unreduced', 3: 'weighted box B by size' }, explain: 'The coin picks the box: 1/2 each, whatever their sizes.' },
        ] },
      { say: 'For each hypothesis, find the likelihood: the chance it produces exactly what you saw.', why: 'The double-headed coin always shows heads; a fair coin shows k heads with 1/2^k; a box shows red with its own red fraction.',
        checks: [
          { make: (rng) => { const a = rng.int(2, 6); let b = rng.int(1, 6); if (b === a) b = a - 1; return mc(rng, `Box A holds ${a} red and ${b} blue. Likelihood of drawing red from box A?`, Q.of(a, a + b).toString(), [[Q.of(b, a + b).toString(), 'answered blue'], ['1/2', 'used the prior of the box'], [Q.of(a, 2 * (a + b)).toString(), 'multiplied by the prior 1/2: that is P(box A and red)'], [Q.of(1, a + b).toString(), 'one specific ball']], `${a} of ${a + b} balls are red.`); } },
        ] },
      { say: 'Weight = prior × likelihood. Posterior = one weight / the sum of all weights.', why: 'The weights are the joint chances of "this object and this evidence"; dividing by their sum conditions on the evidence.',
        checks: [
          { make: (rng) => { const { a, b, c, d } = box(rng); const v = boxA(a, b, c, d); return mc(rng, `Box A: ${a} red, ${b} blue. Box B: ${c} red, ${d} blue. A random box gives red. P(box A)?`, v.toString(), [[Q.of(a, a + c).toString(), 'pooled all red balls as equally likely'], [Q.of(a, a + b).toString(), 'answered P(red | A), the likelihood'], ['1/2', 'kept the prior'], [one.sub(v).toString(), 'answered box B']], `(½ × ${Q.of(a, a + b)}) / (½ × ${Q.of(a, a + b)} + ½ × ${Q.of(c, c + d)}) = ${v}.`); } },
        ] },
      { say: 'With equal priors the priors cancel: posterior ∝ likelihood. Never pool the balls of two boxes; a ball in a small box is more likely to be drawn.', why: 'Each box gets half the chance whatever its size, so its balls do not compete one-for-one with the other box\'s balls.',
        checks: [
          { type: 'choice', q: 'Box A: 1 red ball only. Box B: 1 red and 9 blue. A random box gives red. P(box A)?', options: [boxA(1, 0, 1, 9).toString(), '1/2', '1/11', '1/10'], answer: 0, traps: { 1: 'kept the prior (pooling the two red balls gives the same wrong 1/2)', 2: 'counted box A\'s ball as 1 of all 11 balls', 3: 'used box B\'s red fraction' }, explain: `Likelihoods 1 and 1/10: ${boxA(1, 0, 1, 9)}.` },
        ] },
      { say: 'Odds form: posterior odds = prior odds × likelihood ratio. Double-headed against fair after k heads: 1 : (m − 1) times 2^k : 1.', why: 'Only ratios matter, so skipping the normalisation until the end saves arithmetic.',
        checks: [
          { make: (rng) => { const m = rng.pick([5, 9, 17]); const k = rng.int(2, 4); const odds = Q.of(2 ** k, m - 1); return mc(rng, `${m} coins, one double-headed. After ${k} heads in a row, the odds double-headed : fair are ${2 ** k} : ${m - 1}. P(double-headed)?`, dh(m, k).toString(), [...(odds.cmp(1) <= 0 ? [[odds.toString(), 'reported the odds ratio as a probability']] : []), [Q.of(1, m).toString(), 'kept the prior'], [one.sub(Q.of(1, 2 ** k)).toString(), 'used "a fair coin rarely does this" as the answer'], [dh(m, k - 1).toString(), `counted ${k - 1} head${k > 2 ? 's' : ''} instead of ${k}`]], `Odds ${2 ** k} : ${m - 1}, so P = ${2 ** k}/${2 ** k + m - 1} = ${dh(m, k)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: in the three-card puzzle, why is the answer 2/3 and not 1/2?', model: 'What you see is a face, and each of the six faces is equally likely to be the one facing you. Three of them are red: two on the red-red card and one on the mixed card. So given a red face, you are twice as likely to hold the red-red card. Counting the two cards with a red side as equally likely ignores that the red-red card shows red twice as often.', points: ['the equally likely atoms are faces, not cards', 'the red-red card has two red faces, the mixed card one', 'P(back red) = 2 of 3 red faces'] },

    S('worked'),
    { type: 'worked', family: 'bayes-boxes', section: 'bto', difficulty: 2, seed: 'b', intro: 'Two-sided cards. Try it before opening the solution.' },
    { type: 'worked', family: 'bayes-boxes', section: 'bto', difficulty: 3, seed: 'c', fade: 1, intro: 'Two boxes of different sizes. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'A jar of 10 coins has one double-headed coin. You pick one and see three heads. Above or below 1/2 that you hold the double-headed coin?', answer: `Below: ${dh(10, 3)} ≈ ${d3(dh(10, 3))}.`, explain: 'Odds 1 : 9 times 8 : 1 = 8 : 9. One more head would tip it.' },

    S('traps'),
    { type: 'traps', family: 'bayes-boxes', section: 'bto', extra: [
      { belief: 'Count objects: two cards have a red side, so 1/2.', fix: 'Count faces: the red-red card shows red twice as often.' },
      { belief: 'Pool the balls of both boxes.', fix: 'Each box is chosen with 1/2; weight each by its own red fraction.' },
      { belief: '"A fair coin rarely does this" is the answer.', fix: 'Fair coins are many; weigh 1/2^k by how many fair coins there are.' },
    ] },
    { type: 'erroneous', problem: 'Box A: 1 red, 1 blue. Box B: 3 red, 1 blue. A box is picked by a coin flip and a ball drawn: red. A candidate works out P(box A). One step is wrong.', steps: [
      'There are 4 red balls in total.',
      'One of them is in box A.',
      'Each red ball is equally likely to be the one drawn, so P(box A) = 1/4.',
      'Answer 1/4.',
    ], errorStep: 2, explain: `Red balls are not equally likely: box A is picked half the time and then gives red with 1/2, box B with 3/4. P(box A | red) = (1/2)/(1/2 + 3/4) = ${boxA(1, 1, 3, 1)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: '9 fair coins and 1 double-headed; 3 heads. A candidate answers 7/8. Which belief?', options: ['"A fair coin rarely does this" as the answer', 'Kept the prior', 'Counted faces'], answer: 0, explain: `7/8 = 1 − 1/8 ignores that fair coins are nine times as common. Correct: ${dh(10, 3)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Write the weights, not the formula: one line per object, "prior × likelihood", then divide one by the sum. With equal priors, skip the priors entirely. With a double-headed coin, use odds: 1 : (m − 1), doubled per head.' },
    { type: 'callout', tone: 'speed', text: `Sanity: the posterior moves toward the object that makes the evidence more likely, never past certainty. Evidence that is equally likely under every object leaves the priors unchanged. Time budget ${SECTIONS.bto.exam.perItemSeconds} seconds; a two-object question takes 30.` },
    { type: 'check', scope: 'weights and sanity', questions: [
      { type: 'choice', q: 'Box A: 2 red, 2 blue. Box B: 5 red, 5 blue. A random box gives red. P(box A)?', options: ['1/2', '2/7', '2/5', '1/4'], answer: 0, traps: { 1: 'pooled the reds', 2: 'mixed a likelihood with a count', 3: 'multiplied prior and likelihood without dividing' }, explain: 'Both boxes give red with 1/2: the evidence is uninformative, so the prior stays.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Hidden object + evidence → weight = prior × P(evidence | object); posterior = weight / total. Count the atoms you could have seen (faces, balls), not the objects.' },

    S('contrast'),
    { type: 'compare', columns: ['Situation', 'Count this', 'Not this', 'Answer'], rows: [
      ['three cards, red face seen', 'red faces (3)', 'cards with red (2)', cards(1, 1).toString()],
      ['box A 1R1B, box B 3R1B, red', 'each box\'s red fraction', 'red balls pooled (4)', boxA(1, 1, 3, 1).toString()],
      ['1 double-headed in 4 coins, HH', '1/4 × 1 against 3/4 × 1/4', 'the prior 1/4', dh(4, 2).toString()],
      ['test with rates (bto/bayes-test)', 'true against false positives', 'the hit rate', 'depends on the base rate'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: evidence that is impossible under an object sends it to 0 (a tail rules out the double-headed coin at once). Evidence that is certain under every object teaches nothing. A single object in the bag is certain before and after.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: Monty Hall is this lesson with one extra wrinkle, the host chooses what to show, so his rule sets the likelihoods (bto/monty-hall). Updating on several pieces of evidence one at a time gives the same answer as updating on all at once, which is how traders revise a view trade by trade.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: '9 coins, one double-headed. You flip the chosen coin: heads, heads, tails. P(double-headed)?', options: ['0', dh(9, 2).toString(), '1/9', '1/2'], answer: 0, traps: { 1: 'ignored the tail', 2: 'kept the prior', 3: 'a coin flip' }, explain: 'A double-headed coin cannot show tails.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'bayes-boxes', section: 'bto', count: 3 },
  ],
};
