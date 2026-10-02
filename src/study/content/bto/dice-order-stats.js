// Two dice: maximum, minimum, doubles, differences, one die beating the other.
// Same 36-cell grid as the sums lesson; only the highlighted cells change.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
const fr = (n, d = 1) => Q.of(n, d).toString();
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const maxLe = (k) => k * k; // both dice at most k
const maxEq = (k) => maxLe(k) - maxLe(k - 1); // 2k − 1
const minGe = (k) => (7 - k) ** 2; // both dice at least k
const minEq = (k) => minGe(k) - minGe(k + 1); // 13 − 2k
const TIES = 6;
const BEATS = (36 - TIES) / 2;
const diffEq = (d) => (d === 0 ? 6 : 2 * (6 - d));
const K = [1, 2, 3, 4, 5, 6];
const cells = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6), i % 6]);
const grid = (text, pred) => {
  const hl = cells.filter(([r, c]) => pred(r + 1, c + 1));
  return { rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => text(r + 1, c + 1))), highlight: hl, count: hl.length };
};
const pct = (x) => `${Math.round(x * 1000) / 10}%`;

export default {
  id: 'bto/dice-order-stats',
  book: 'bto',
  kind: 'family',
  family: 'dice-order-stats',
  title: 'Two dice: max, min, doubles, differences',
  summary: 'Turn "the larger face is at most k" into "both dice are at most k", then subtract squares.',
  prerequisites: ['bto/two-dice-sum'],
  objectives: [
    'Recognise a maximum, minimum, double, difference or "who rolls higher" question on two dice',
    'Write P(max ≤ k) = k²/36 and P(max = k) = (2k − 1)/36 from the grid, not from memory',
    'Answer min, difference and "strictly higher" questions in under 20 seconds',
    'Name the false belief behind the answers 1/6, 2k/36 and 1/2',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw two fair dice. What is the probability that the larger of the two faces is exactly 4 (if both show 4, that counts)? Find two different ways to count it.', answer: `${maxEq(4)}/36`, explain: `The cells are (4,1), (4,2), (4,3), (4,4), (1,4), (2,4), (3,4): ${maxEq(4)} of 36. If you got 1/6 you assumed the larger face is uniform; if you got 8/36 you counted (4,4) twice. The lesson names both beliefs.`, attempts: [
      { id: 'one-arm', label: 'Only the first die is 4', approach: 'Fixed the first die at 4 and let the second run over 1 to 4: 4/36.', breaksAt: 'The larger face can sit on either die. The cells with the second die at 4 are missing.' },
      { id: 'uniform', label: 'The larger face is uniform', approach: 'The larger face is one of 1 to 6, so answered 1/6.', breaksAt: 'Max 1 needs (1,1), a single cell, while max 4 has seven. The six values are not equally likely.' },
      { id: 'both-arms', label: 'First die 4 plus second die 4', approach: 'Counted 4 cells with the first die at 4 and 4 with the second: 8/36.', breaksAt: 'The cell (4,4) is in both lists, so it was counted twice.' },
    ] },
    { type: 'text', text: 'Two fair dice are thrown, and the question is **not** about the sum. It asks about the **larger** face (maximum), the **smaller** face (minimum), a **double**, the **difference** between the faces, or whether one die **beats** the other.' },
    { type: 'list', items: ['"Two dice are rolled. What is the probability that the higher of the two numbers is 5?"', '"What is the chance that the smaller die shows at least 3?"', '"You and a friend each roll a die. What is the chance yours is strictly higher?"', '"Two dice: probability the faces differ by exactly 2?"'] },
    { type: 'check', scope: 'what the question asks about', questions: [
      { type: 'choice', q: '"Two dice: probability that the two faces are 3 apart?" What does it ask about?', options: ['the difference', 'the sum', 'the larger face', 'a double'], answer: 0, traps: { 1: 'nothing is added: "3 apart" is the gap between the faces', 2: '"3 apart" fixes the gap, not the larger face', 3: 'a double has a gap of 0' }, explain: '"3 apart" is the difference between the faces, whatever they add up to.' },
    ] },
    { type: 'text', text: 'Not this lesson: the **sum** of two dice (bto/two-dice-sum) and anything with three dice (bto/three-dice). Same grid idea, different cells.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Two dice: probability the smaller face is 2 or less', 'Two dice: probability the total is 9 or more', 'Three dice: probability the largest face is 4', 'Two dice: probability the total is odd'], answer: 0, traps: { 1: 'a sum question (bto/two-dice-sum)', 2: 'a maximum, but on three dice: that is bto/three-dice', 3: 'a sum question: parity of the total' }, explain: 'The smaller face is the minimum of two dice: this lesson. Totals belong to the sums lesson, and three dice to their own lesson.' },
    ] },

    S('why'),
    { type: 'text', text: 'Maxima, minima and "who rolls higher" come up constantly, and each has a two-line route once you see that "the larger face is at most k" means "both faces are at most k". That one translation turns an awkward event into a square of cells you can count at a glance.' },

    S('anchor'),
    { type: 'text', text: 'You already count the 36 ordered pairs (first die, second die) for sums. Keep exactly that sample space and change **one thing**: instead of adding the faces, look at the **larger** one (or the smaller one). The 36 cells stay equally likely; only the cells you highlight change.' },
    { type: 'check', scope: '36 ordered pairs, carried over from sums', questions: [
      { type: 'number', q: 'Two dice. How many of the 36 ordered pairs are doubles, (1,1) to (6,6)?', answer: TIES, explain: 'One double per face: the main diagonal of the grid.' },
      { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `One fair die. What is P(face ≤ ${k})?`, fr(k, 6), [[fr(k - 1, 6), `dropped the face ${k} itself ("at most" includes it)`], [fr(6 - k, 6), `answered the complement, a face above ${k}`], [fr(k, 5), 'divided by 5: a die has 6 faces']], `Faces 1 to ${k}: ${k} of 6.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Write the larger face in every cell. The cells where the larger face is **at most 4** are exactly the cells where **both** dice are at most 4: the 4 × 4 square in the corner.' },
    { type: 'diagram', diagram: 'grid', spec: grid((a, b) => Math.max(a, b), (a, b) => Math.max(a, b) <= 4), caption: `Each cell holds the larger face. "Max ≤ 4" is the corner square: 4 × 4 = ${maxLe(4)} cells. Every cell outside it has a 5 or a 6 somewhere.` },
    { type: 'check', scope: 'max ≤ k is a k × k square', questions: [
      { make: (rng) => { const k = rng.int(2, 6); return { type: 'number', q: `Two dice. How many ordered pairs have their larger face at most ${k}?`, answer: maxLe(k), hints: [`"Larger face ≤ ${k}" means what for each die?`, `Both dice must be at most ${k}: ${k} choices each.`], explain: `Both dice at most ${k}: ${k} × ${k} = ${maxLe(k)} cells.` }; } },
    ] },
    { type: 'text', text: 'Now **exactly** 4. Take the 4 × 4 square and remove the 3 × 3 square inside it (those cells have a maximum of 3 or less). What is left is an L-shaped rim: one arm where the first die is 4, one where the second die is 4, meeting at the single cell (4,4).' },
    { type: 'diagram', diagram: 'grid', spec: grid((a, b) => Math.max(a, b), (a, b) => Math.max(a, b) === 4), caption: `Max exactly 4 is the rim: ${maxLe(4)} − ${maxLe(3)} = ${maxEq(4)} cells. The corner (4,4) belongs to both arms but is one cell, so the count is odd.` },
    { type: 'check', scope: 'max = k is the rim of the square', questions: [
      { make: (rng) => { const k = rng.int(2, 6); return mc(rng, `Two dice. P(larger face is exactly ${k})?`, `${maxEq(k)}/36`, [['6/36', 'assumed the larger face is equally likely to be 1 to 6'], [`${maxLe(k)}/36`, `counted "at most ${k}", which includes smaller maxima`], [`${2 * k}/36`, `counted (${k},${k}) twice, once in each arm`], [`${k}/36`, 'counted only the arm where the first die carries the value']], `${k}² − ${k - 1}² = ${maxEq(k)} cells: the rim of the ${k} × ${k} square.`); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Ordered pairs per value', xLabel: 'value k', yLabel: 'pairs', categories: K.map(String), series: [{ name: 'max = k', values: K.map(maxEq) }, { name: 'min = k', values: K.map(minEq) }], valueLabels: true }, caption: `The maximum climbs through the odd numbers ${K.map(maxEq).join(', ')}; the minimum is the mirror image. Big values pile up for the max, small ones for the min.` },
    { type: 'check', scope: 'the shape of max and min', questions: [
      { type: 'choice', q: 'Two dice. Which event is the most likely?', options: ['max = 6', 'sum = 7', 'min = 6', 'max = 1'], answer: 0, traps: { 1: `the sum peaks at 7 with ${6} pairs, but the maximum piles up at 6 with ${maxEq(6)}`, 2: 'min = 6 needs both dice to show 6: one cell, the minimum is skewed down', 3: 'max = 1 needs both dice to show 1: one cell' }, explain: `max = 6 has ${maxEq(6)} pairs (at least one six), sum 7 has 6, and min = 6 and max = 1 have one each.` },
    ] },
    { type: 'text', text: 'For "who rolls higher", split the grid along its diagonal. The diagonal holds the 6 ties. Below it the first die is higher, above it the second is. Reflecting the grid across the diagonal swaps the two dice, so the two triangles hold the same number of cells.' },
    { type: 'diagram', diagram: 'grid', spec: grid((a, b) => (a > b ? 'W' : a === b ? '=' : 'L'), (a, b) => a > b), caption: `W marks cells where the first die wins: (36 − ${TIES})/2 = ${BEATS}. The ${TIES} ties (=) sit on the diagonal and belong to neither side.` },
    { type: 'check', scope: 'the diagonal split', questions: [
      { type: 'number', q: 'Two dice. In how many ordered pairs is the first die strictly higher than the second?', answer: BEATS, hints: ['How many cells are ties?', 'The remaining cells split evenly between the two dice.'], explain: `(36 − ${TIES})/2 = ${BEATS}.` },
      { type: 'choice', q: 'Two dice. P(first die ≥ second die)?', options: [fr(BEATS + TIES, 36), fr(BEATS, 36), '1/2', fr(BEATS + 2 * TIES, 36)], answer: 0, traps: { 1: 'dropped the ties, which "≥" includes', 2: 'forgot the ties exist: the non-tied cells split evenly, the whole grid does not', 3: 'counted the ties twice' }, explain: `${BEATS} wins plus ${TIES} ties = ${BEATS + TIES} of 36 = ${fr(BEATS + TIES, 36)}.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'one-arm', say: 'Translate the maximum into a statement about each die: the larger face is at most k exactly when both faces are at most k.', why: 'If either die showed more than k, the larger face would too. So one condition on the max becomes two conditions, one per die.',
        checks: [
          { type: 'choice', q: 'Two dice. "The larger face is at most 3" is the same event as:', options: ['both dice are at most 3', 'at least one die is at most 3', 'the first die is at most 3', 'the sum is at most 6'], answer: 0, traps: { 1: 'that is "the smaller face is at most 3"', 2: 'ignores the second die, which could be a 6', 3: '(1,4) has sum 5 but larger face 4' }, explain: 'Both dice must be at most 3, otherwise the larger face exceeds 3.' },
        ] },
      { answers: 'uniform', say: 'Both conditions hold together in k × k cells, so P(max ≤ k) = k²/36 = (k/6)².', why: 'Each die independently has k allowed faces; ordered pairs multiply.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `Two dice. P(larger face ≤ ${k})?`, fr(maxLe(k), 36), [[fr(k, 6), 'used one die only'], [fr(2 * k, 36), 'added the two dice\'s counts instead of multiplying'], [fr(maxEq(k), 36), 'computed "exactly k", not "at most k"']], `(${k}/6)² = ${maxLe(k)}/36 = ${fr(maxLe(k), 36)}.`); } },
        ] },
      { answers: 'both-arms', say: 'Exactly k = at most k, minus at most k − 1: k² − (k − 1)² = 2k − 1 cells.', why: 'The cells whose maximum is below k are the smaller square; removing them leaves the rim, where the maximum is exactly k. This subtraction is the new move.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 6); return { type: 'number', q: `Two dice. How many ordered pairs have larger face exactly ${k}?`, answer: maxEq(k), hints: [`Start from the ${k} × ${k} square.`, `Remove the ${k - 1} × ${k - 1} square inside it.`], explain: `${maxLe(k)} − ${maxLe(k - 1)} = ${maxEq(k)}, which is 2 × ${k} − 1.` }; } },
        ] },
      { say: 'Mirror it for the minimum: min ≥ k ⇔ both dice ≥ k, which is (7 − k)² cells. Then min = k has (7 − k)² − (6 − k)² = 13 − 2k cells.', why: 'Faces k to 6 are 7 − k values. The same subtraction peels off the rim of that square.',
        checks: [
          { make: (rng) => { const k = rng.int(1, 5); return mc(rng, `Two dice. P(smaller face is exactly ${k})?`, `${minEq(k)}/36`, [[`${minGe(k)}/36`, `counted "at least ${k}", which includes larger minima`], [`${maxEq(k)}/36`, 'used the maximum formula 2k − 1: the minimum is the mirror image'], ['6/36', 'assumed the smaller face is uniform'], [`${minEq(k) + 1}/36`, `counted (${k},${k}) twice`]], `(${7 - k})² − (${6 - k})² = ${minGe(k)} − ${minGe(k + 1)} = ${minEq(k)}.`); } },
        ] },
      { say: 'For "first beats second", remove the 6 ties. Swapping the dice turns every win into a loss, so the other 30 cells split 15 and 15.', why: 'Symmetry does the counting: the two dice are identical, so neither can be favoured once ties are set aside.',
        checks: [
          { type: 'choice', q: 'You and a friend each throw a die; ties are replayed until someone wins. What is your chance of winning?', options: ['1/2', fr(BEATS, 36), fr(BEATS + TIES, 36), fr(TIES, 36)], answer: 0, traps: { 1: 'that is the chance of winning a single throw, where a tie is still possible', 2: 'counted ties as wins', 3: 'answered the chance of a tie' }, explain: 'Replaying ties leaves only the 30 non-tied cells, which split evenly: 15/30 = 1/2.' },
        ] },
      { say: 'Difference exactly d (d ≥ 1): the smaller face runs from 1 to 6 − d, and each such pair appears in two orders, so 2(6 − d) cells.', why: 'The larger face is smaller + d and must stay at most 6. The two orders are the two diagonals d steps off the main one.',
        checks: [
          { make: (rng) => { const d = rng.int(1, 5); return { type: 'number', q: `Two dice. How many ordered pairs have faces differing by exactly ${d}?`, answer: diffEq(d), hints: [`How many values can the smaller face take so that smaller + ${d} ≤ 6?`, 'Each unordered pair comes in two orders.'], explain: `Smaller face 1 to ${6 - d}: ${6 - d} pairs, times 2 orders = ${diffEq(d)}.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does the maximum of two dice pile up at 6 while the sum is symmetric around 7?', model: `The maximum is 6 whenever at least one die shows 6, which is ${maxEq(6)} cells, but it is 1 only when both dice show 1. Each value k gets the rim of a k × k square, and bigger squares have longer rims. The sum counts anti-diagonals, which are longest in the middle and shrink equally on both sides.`, points: ['max ≤ k is a k × k square, so max = k is a rim of 2k − 1 cells', 'rims grow with k, so the max is skewed up (and the min down)', 'sums count anti-diagonals, which are symmetric about 7'] },

    S('worked'),
    { type: 'worked', family: 'dice-order-stats', section: 'bto', difficulty: 1, seed: 'c', explainAt: [0, 1], intro: 'A maximum, a double or "who rolls higher". Try it before opening the solution.' },
    { type: 'worked', family: 'dice-order-stats', section: 'bto', difficulty: 2, seed: 'g', fade: 1, intro: 'A minimum, a difference or an "at least one" threshold. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'Two fair dice are thrown. What is the probability that the larger face is exactly 5?', lines: [
      { t: 0, say: 'Larger face on two dice: a maximum. I think in squares, not lists.' },
      { t: 3, say: `First die 5 with the second at most 5: 5 cells. Second die 5: 5 more. So ${2 * 5}/36?`, slip: true },
      { t: 7, say: `Wait, (5,5) sits in both lists. Square minus square instead: ${maxLe(5)} − ${maxLe(4)} = ${maxEq(5)}.` },
      { t: 11, say: `Cross-check with the odd list 1, 3, 5, 7, 9, 11: max 5 is the fifth entry, ${maxEq(5)}. Same.` },
      { t: 14, say: `${maxEq(5)}/36 = ${fr(maxEq(5), 36)}. Below max 6 (${maxEq(6)}/36), as a skewed-up max should be. Answer ${fr(maxEq(5), 36)}, with ${SECTIONS.bto.exam.perItemSeconds - 14} seconds spare.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try gave 10/36. What went wrong?', options: ['counted (5, 5) twice', 'added the faces', 'kept the other die above 5', 'treated the max values as equally likely'], answer: 0, traps: { 1: 'nothing was added: both lists hold cells with a 5', 2: 'both lists kept the other die at 5 or below', 3: 'the try counted cells, not values' }, explain: '(5, 5) sits in both lists of 5. Square minus square: 25 − 16 = 9 cells, so 9/36 = 1/4.' },
    ] },

    S('predict'),
    { type: 'predict', question: 'Without computing: two dice. Is P(max = 6) bigger or smaller than P(min = 6)? By what factor?', answer: `Bigger, ${maxEq(6)} times: ${maxEq(6)}/36 against 1/36.`, explain: 'max = 6 needs at least one six; min = 6 needs two.' },

    S('traps'),
    { type: 'traps', family: 'dice-order-stats', section: 'bto', extra: [
      { belief: 'The larger face is equally likely to be any of 1 to 6 (P = 1/6).', fix: `Only (1,1) gives max 1, but ${maxEq(6)} pairs give max 6.` },
      { belief: 'Max exactly k has 2k cells: k in the first die or k in the second.', fix: 'The cell (k,k) is in both lists. Subtract the double once: 2k − 1.' },
      { belief: 'One die beats the other with probability 1/2.', fix: `Ties take ${TIES} of 36 cells. Only the other ${36 - TIES} split evenly: ${BEATS}/36.` },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(larger face is exactly 5) for two dice. One step is wrong.', steps: [
      'The larger face is 5 when one die shows 5 and the other shows at most 5.',
      'First die 5, second die 1 to 5: 5 ordered pairs.',
      'Second die 5, first die 1 to 5: 5 ordered pairs.',
      'Add them: 10 pairs, so P = 10/36.',
    ], errorStep: 3, explain: `The pair (5,5) is in both lists, so adding counts it twice. Correct count 5 + 5 − 1 = ${maxEq(5)}, the same as ${maxLe(5)} − ${maxLe(4)}. P = ${maxEq(5)}/36.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'A candidate answers P(max = 6) = 12/36. Which belief produced it?', options: ['Counting the double (6,6) twice', 'The max is uniform on 1 to 6', 'Answering max ≤ 6', 'Using unordered pairs'], answer: 0, explain: `Six cells with a 6 in the first die plus six with a 6 in the second, but (6,6) is in both: ${maxEq(6)}.` },
      { type: 'choice', q: 'Another answers P(your die is strictly higher) = 1/2. Which belief?', options: ['Forgetting the ties', 'Counting ties as wins', 'Using the sum grid'], answer: 0, explain: `The ${TIES} ties belong to neither player: ${BEATS}/36 = ${fr(BEATS, 36)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise one list: **1, 3, 5, 7, 9, 11**. These are the cell counts for max = 1, 2, …, 6. The minimum uses the same list backwards: min = 1 has 11, min = 6 has 1. "Strictly higher" is always ${BEATS}/36 = ${fr(BEATS, 36)}, about ${pct(BEATS / 36)}.` },
    { type: 'check', scope: 'the odd-number list', questions: [
      { make: (rng) => { const k = rng.int(1, 6); return { type: 'number', q: `Two dice. How many ordered pairs have smaller face exactly ${k}? (Use the list backwards.)`, answer: minEq(k), explain: `List 11, 9, 7, 5, 3, 1 for min = 1 to 6: min = ${k} has ${minEq(k)}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: '"At least one die shows k or more" is "max ≥ k": count the complement square, 1 − ((k − 1)/6)². "Both dice show k or more" is "min ≥ k": ((7 − k)/6)². Pick the square, never list cells.' },
    { type: 'check', scope: 'the complement square', questions: [
      { make: (rng) => { const k = rng.int(2, 6); return { type: 'number', q: `Two dice. How many ordered pairs have at least one die showing ${k} or more?`, answer: 36 - maxLe(k - 1), hints: ['What is the complement of "at least one die ≥ k"?', `Both dice at most ${k - 1}: a square.`], explain: `36 − ${k - 1}² = ${36 - maxLe(k - 1)}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `Time budget: Beat the Odds allows ${SECTIONS.bto.exam.perItemSeconds} seconds a question. An order-statistic item should take under 20: name the square, subtract, divide by 36, and use the spare time to check the double is counted once.` },
    { type: 'check', scope: 'the time budget', questions: [
      { type: 'choice', q: 'You finish an order-statistic item in 15 of the 90 seconds. What is the best use of the time left?', options: ['check the double is counted once', 'recount every cell by hand', 'redo it as a sum question', 'move on without a check'], answer: 0, traps: { 1: 'listing cells is the slow route the square replaces', 2: 'a sum is a different question', 3: 'the double is the classic slip, and there is time to check it' }, explain: 'Name the square, subtract, divide by 36, then check that the double sits in the count once.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Max ≤ k ⇔ both ≤ k: k² cells. Max = k: 2k − 1. Min = k: 13 − 2k. One beats the other: (36 − 6)/2 = 15.' },

    S('contrast'),
    { type: 'compare', columns: ['Event on two dice', 'Shape in the grid', 'Ordered pairs'], rows: [
      ['sum = s', 'one anti-diagonal', '6 − |s − 7|'],
      ['max = k', 'rim of the k × k corner square', '2k − 1'],
      ['min = k', 'rim of the far square', '13 − 2k'],
      ['double', 'main diagonal', String(diffEq(0))],
      ['|difference| = d ≥ 1', 'two diagonals, d off the main one', '2(6 − d)'],
      ['first > second', 'triangle below the diagonal', String(BEATS)],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: max = 1 and min = 6 each need a double, 1 cell. A difference of 0 is the doubles diagonal, ${diffEq(0)} cells, not 2 × 6: a zero difference has only one order. Max ≤ 6 is certain (36 cells).` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Two dice. P(faces differ by 0)?', options: ['1/6', '1/3', '0', '1/36'], answer: 0, traps: { 1: 'doubled the diagonal as if a zero difference had two orders', 2: 'forgot that equal faces have difference 0', 3: 'required one specific double' }, explain: `The ${diffEq(0)} doubles: 6/36 = 1/6.` },
      { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `Three dice. P(largest face ≤ ${k})?`, fr(k ** 3, 216), [[fr(k * k, 36), 'used two dice: three dice need a third factor'], [fr(k, 6), 'used one die'], [fr(3 * k, 18), 'added the dice instead of multiplying']], `Every die at most ${k}: (${k}/6)³ = ${fr(k ** 3, 216)}.`); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "the largest is at most k" means "every piece is at most k". So P(max ≤ k) is a product for any number of independent pieces. Three dice give (k/6)³ (bto/three-dice); the expected maximum in EV questions is built from these same P(max = k).' },
    { type: 'variation', base: `Two fair dice. P(larger face = 4) = ${maxEq(4)}/36.`, rows: [
      { change: 'Ask for the smaller face = 3 instead', effect: `No change: min = 3 has 13 − 6 = ${minEq(3)} cells. The minimum is the mirror image of the maximum, and 3 mirrors 4 (3 + 4 = 7).`, same: true },
      { change: 'Paint one die red and one blue', effect: 'No change. The 36 cells were already ordered pairs; colour only shows which die is which.', same: true },
      { change: 'Ask for "larger face at most 4"', effect: `No subtraction: the whole 4 × 4 square, ${maxLe(4)}/36 = ${fr(maxLe(4), 36)}.` },
      { change: 'Throw three dice, larger face exactly 4', effect: `The square becomes a cube: 4³ − 3³ = ${4 ** 3 - 3 ** 3} of 216. Same subtraction, one more factor.` },
      { change: 'Three dice and "at most 4" together', effect: `The cube removes nothing and the extra die adds a factor: (4/6)³ = ${fr(4 ** 3, 216)}. Each change acts on its own part of the formula: the exponent counts dice, the subtraction exists only for "exactly".`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const k = rng.int(3, 9); return mc(rng, `Two players each pick a whole number from 1 to 10, uniformly and independently. P(the larger of the two numbers is exactly ${k})?`, fr(2 * k - 1, 100), [[fr(2 * k, 100), `counted (${k},${k}) twice`], [fr(1, 10), 'assumed the larger number is uniform on 1 to 10'], [fr(k * k, 100), `counted "at most ${k}"`]], `${k}² − ${k - 1}² = ${2 * k - 1} of the 100 ordered pairs: ${fr(2 * k - 1, 100)}.`); } },
      far: { type: 'choice', q: 'A web page loads once both of two independent servers have answered. Each answers after a whole number of milliseconds from 1 to 10, all equally likely. P(the page has loaded within 6 ms)?', options: [fr(36, 100), fr(6, 10), fr(11, 100), fr(100 - 16, 100)], answer: 0, traps: { 1: 'used one server: the page waits for the slower one', 2: 'computed "the slower server answers at exactly 6 ms"', 3: 'computed "at least one server has answered", the minimum, not the maximum' }, explain: `The page waits for the slower server: max ≤ 6 means both ≤ 6, (6/10)² = ${fr(36, 100)}.` },
      principle: { type: 'choice', q: 'Which idea carried over from dice to numbers and servers?', options: ['The largest is at most k exactly when every piece is', 'The largest value is uniform over the possible values', 'Add the chances that each piece is k, then divide', 'Divide the values at most k by all possible values'], answer: 0, traps: { 1: 'the 1/6 and 1/10 answers: big maxima are more likely', 2: 'adding the arms counts the double twice', 3: 'that is one piece, not the largest of several' }, explain: 'Max ≤ k turns into "every piece ≤ k", a product of equal factors; "exactly k" is then a difference of two such products.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'dice-order-stats', section: 'bto', count: 3 },
  ],
};
