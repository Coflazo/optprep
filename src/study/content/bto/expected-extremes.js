// Expected maximum and minimum: the tail-sum formula for dice, and the equal-gaps picture for
// uniforms on [0, 1]. Every number shown is computed here, never typed by hand.
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
const qpow = (x, k) => { let r = one; for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const tailMax = (s, n, k) => one.sub(qpow(Q.of(k - 1, s), n)); // P(max >= k)
const tailMin = (s, n, k) => qpow(Q.of(s - k + 1, s), n); // P(min >= k)
const sumK = (s, f) => { let t = Q.of(0); for (let k = 1; k <= s; k++) t = t.add(f(k)); return t; };
const eMax = (s, n) => sumK(s, (k) => tailMax(s, n, k));
const eMin = (s, n) => sumK(s, (k) => tailMin(s, n, k));
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const words = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
const K6 = [1, 2, 3, 4, 5, 6];
const maxGrid = (t) => ({
  rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die',
  cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => Math.max(r, c) + 1)),
  highlight: Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6), i % 6]).filter(([r, c]) => Math.max(r, c) + 1 >= t),
});
const T = 4;
// One die with one optional reroll: keep x iff x beats the mean 7/2 of a fresh roll.
const REROLL = K6.reduce((a, x) => a.add(Q.of(x).cmp(Q.of(7, 2)) >= 0 ? Q.of(x) : Q.of(7, 2)), Q.of(0)).div(Q.of(6));

export default {
  id: 'bto/expected-extremes',
  book: 'bto',
  kind: 'family',
  family: 'expected-extremes',
  title: 'Expected maximum and minimum',
  summary: 'Dice: E[max] = Σ P(max ≥ k) = Σ (1 − ((k−1)/s)^n). Uniforms: n points cut [0, 1] into n + 1 gaps of mean 1/(n + 1).',
  prerequisites: ['bto/dice-order-stats', 'bto/linearity'],
  objectives: [
    'Write E[X] = Σ P(X ≥ k) for a whole-number X, and say why it holds',
    'Compute E[max] and E[min] of n dice with tail sums, and check with E[min] + E[max] = s + 1',
    'Use the gaps picture for n uniforms: E[k-th smallest] = k/(n + 1), E|X − Y| = 1/3',
    'Reject the one-die average and the continuous formula as answers for dice',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you roll two fair dice. What is the expected value of the larger face? Try two approaches.', answer: `${eMax(6, 2)} ≈ ${f3(eMax(6, 2))}`, explain: `If you answered 3.5, you used one die; if 5, you guessed; if ${f3(Q.of(12, 3))} (= 6 × 2/3), you used the continuous formula. Listing P(max = k) = (2k − 1)/36 works but is slow. The lesson adds six tail probabilities instead.`, attempts: [
      { id: 'pmf', label: 'List P(max = k), then average', approach: 'Worked out P(max = k) = (2k − 1)/36 for each k and computed Σ k × P(max = k).', breaksAt: 'Correct but slow, and each P(max = k) is a difference of two squares. The tail probabilities P(max ≥ k) are easier and add straight to the mean.' },
      { id: 'one-die', label: 'One die: 3.5', approach: 'Answered 3.5, the average of a single die.', breaksAt: 'The larger face reaches k unless both dice stay below k, which is much more often than one die does. The max is pulled up.' },
      { id: 'continuous', label: 'Uniform formula 6 × 2/3', approach: `Used the uniform result "max of 2 is 2/3 of the range": 6 × 2/3 = ${Q.of(12, 3)}.`, breaksAt: 'That formula is for continuous points on an interval. Dice are whole numbers from 1 to 6, so they need the tail sums.' },
    ] },
    { type: 'text', text: 'Several dice are rolled, or several numbers are drawn uniformly from [0, 1], and the question asks for the **expected** highest, lowest, range, or distance between two of them. Payoffs on "the best of three outcomes" are priced this way.' },
    { type: 'list', items: ['"You roll three dice. What is the expected value of the highest face?"', '"Four numbers are drawn uniformly from [0, 1]. Expected value of the smallest?"', '"Two points are chosen on [0, 1]. Expected distance between them?"'] },
    { type: 'check', scope: 'the extreme that is asked for', questions: [
      { type: 'choice', q: '"You roll four dice and keep the best one. What is it worth on average?" Which quantity is asked?', options: ['the expected maximum', 'the expected sum', 'P(the maximum is 6)', 'the expected minimum'], answer: 0, traps: { 1: 'you keep one die, the best, not the total', 2: 'it asks an average, not a probability', 3: '"best" is the highest face' }, explain: 'Keeping the best of four dice gives the maximum; on average that is its expected value.' },
    ] },
    { type: 'text', text: 'Not this lesson: the **probability** that the maximum is at most k or equal to k (bto/dice-order-stats), and a game where you choose which roll to keep (bto/dice-games-ev).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Three dice: expected value of the lowest face', 'Three dice: probability that the lowest face is 2', 'One die with one reroll allowed: expected payout', 'Three dice: expected value of the sum'], answer: 0, traps: { 1: 'a probability of one value: bto/dice-order-stats', 2: 'a choice about stopping: bto/dice-games-ev', 3: 'the sum is linear: 3 × 3.5' }, explain: 'An expected extreme of several dice.' },
    ] },

    S('why'),
    { type: 'text', text: 'The obvious route, find P(max = k) for every k and average, is slow and easy to botch under time pressure. The tail-sum formula uses the probabilities you get most easily, P(max ≥ k), and adds them. For uniforms, one symmetry picture replaces an integral. Both give exact answers where the options are only a few hundredths apart.' },

    S('anchor'),
    { type: 'text', text: 'From bto/dice-order-stats: "the larger face is at most k" means **both** dice are at most k, so P(max ≤ k) = (k/6)². The expected maximum uses the same fact with **one change**: flip it to P(max ≥ k) = 1 − ((k − 1)/6)² and add those up over k.' },
    { type: 'check', scope: 'P(max ≤ k) = (k/s)^n', questions: [
      { make: (rng) => { const k = rng.int(2, 5), n = rng.int(2, 3); const v = qpow(Q.of(k, 6), n); return mc(rng, `${words[n][0].toUpperCase() + words[n].slice(1)} fair dice. P(the highest face is at most ${k})?`, v.toString(), [[Q.of(k, 6).toString(), 'used one die only'], [one.sub(v).toString(), 'answered "at least one die above k"'], [qpow(Q.of(k - 1, 6), n).toString(), 'used "below k" instead of "at most k"']], `Every die at most ${k}: (${k}/6)^${n} = ${v}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: `The 36 outcomes of two dice, each cell showing the larger face. Highlight the cells with max ≥ ${T}. Their complement is the ${T - 1} × ${T - 1} corner where both dice are below ${T}.` },
    { type: 'diagram', diagram: 'grid', spec: { ...maxGrid(T), count: 36 - (T - 1) * (T - 1) }, caption: `${36 - (T - 1) * (T - 1)} cells have max ≥ ${T}: P = 1 − (${T - 1}/6)² = ${tailMax(6, 2, T)}. Each threshold k gives one such L-shaped region.` },
    { type: 'check', scope: 'one tail probability', questions: [
      { make: (rng) => { const k = rng.int(2, 6); return { type: 'number', q: `Two dice. How many of the 36 cells have max ≥ ${k}?`, answer: 36 - (k - 1) * (k - 1), hints: [`Count the complement: both dice at most ${k - 1}.`, `(${k - 1})² cells.`], explain: `36 − ${(k - 1) * (k - 1)} = ${36 - (k - 1) * (k - 1)}.` }; } },
    ] },
    { type: 'text', text: 'Now plot P(max ≥ k) for every k from 1 to 6. The bars are all the tail probabilities, and their total height is the expected maximum.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Two dice: P(max ≥ k)', xLabel: 'threshold k', yLabel: 'probability', categories: K6.map(String), series: [{ name: 'P(max ≥ k)', values: K6.map((k) => Number(tailMax(6, 2, k).toNumber().toFixed(3))) }], valueLabels: true }, caption: `In 36ths: ${K6.map((k) => tailMax(6, 2, k).mul(Q.of(36)).toString()).join(' + ')} = ${eMax(6, 2).mul(Q.of(36))}. So E[max] = ${eMax(6, 2)} ≈ ${f3(eMax(6, 2))}. A max of 5 clears thresholds 1 to 5, so it is counted in five bars: that is why the bars add up to the mean.` },
    { type: 'check', scope: 'adding the tail bars', questions: [
      { type: 'choice', q: 'Two dice. E[max] = ?', options: [eMax(6, 2).toString(), '7/2', '5', '4'], answer: 0, traps: { 1: 'the average of one die: the max is pulled upward', 2: 'guessed the second-highest face', 3: 'rounded the continuous formula 6 × 2/3' }, explain: `Sum of the six bars: ${eMax(6, 2)}.` },
    ] },
    { type: 'text', text: 'For numbers drawn uniformly from [0, 1], picture the points as cuts. Three points cut the interval into four gaps, and by symmetry each gap has the same expected length, 1/4.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 1, step: 0.25, marks: [{ x: 0.25, label: 'E[min]' }, { x: 0.5, label: 'E[middle]' }, { x: 0.75, label: 'E[max]' }] }, caption: 'Three uniform points: on average at 1/4, 2/4, 3/4. The expected smallest is one gap from 0, the expected largest one gap from 1, the expected range is two gaps.' },
    { type: 'check', scope: 'the equal gaps', questions: [
      { make: (rng) => { const n = rng.int(2, 6); return mc(rng, `${words[n][0].toUpperCase() + words[n].slice(1)} numbers drawn uniformly from [0, 1]. Expected value of the largest?`, Q.of(n, n + 1).toString(), [[Q.of(n - 1, n).toString(), `divided by ${n}: ${n} points make ${n + 1} gaps`], ['1/2', 'used one uniform'], [Q.of(1, n + 1).toString(), 'gave the smallest']], `${n} points, ${n + 1} gaps of mean 1/${n + 1}; the largest is one gap below 1: ${Q.of(n, n + 1)}.`, { hinge: true }); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'For X in 1, 2, 3, …: X = [X ≥ 1] + [X ≥ 2] + [X ≥ 3] + …, where [X ≥ k] is 1 if true and 0 if not. Taking expectations: E[X] = Σ P(X ≥ k).', why: 'X = 4 clears the thresholds 1, 2, 3, 4 and no others, so exactly four indicators are 1. Linearity does the rest.', answers: 'pmf',
        checks: [
          { type: 'number', q: 'One fair die. Compute Σ P(X ≥ k) for k = 1 to 6. (Decimals are fine.)', answer: 3.5, tolerance: 1e-9, hints: ['P(X ≥ k) = (7 − k)/6.', '6/6 + 5/6 + … + 1/6.'], explain: '21/6 = 3.5: the tail sum gives back the familiar average.' },
        ] },
      { say: 'Maximum of n dice with s sides: P(max ≥ k) = 1 − P(every die below k) = 1 − ((k − 1)/s)^n.', why: 'The maximum reaches k unless every die stays at k − 1 or below.', answers: 'one-die',
        checks: [
          { make: (rng) => { const s = rng.pick([4, 6, 8]), n = rng.int(2, 3), k = rng.int(2, s); const v = tailMax(s, n, k); return mc(rng, `${words[n]} fair ${s}-sided dice. P(max ≥ ${k})?`, v.toString(), [[qpow(Q.of(k - 1, s), n).toString(), 'gave the complement: every die below k'], [one.sub(qpow(Q.of(k, s), n)).toString(), 'used "every die at most k" as the complement'], [Q.of(s - k + 1, s).toString(), 'used one die']], `1 − (${k - 1}/${s})^${n} = ${v}.`); } },
        ] },
      { say: 'Minimum: P(min ≥ k) = P(every die at least k) = ((s − k + 1)/s)^n.', why: 'The minimum is at least k exactly when no die falls below k.',
        checks: [
          { make: (rng) => { const n = rng.int(2, 3), k = rng.int(2, 5); const v = tailMin(6, n, k); return mc(rng, `${words[n]} fair dice. P(min ≥ ${k})?`, v.toString(), [[one.sub(v).toString(), 'answered "some die below k"'], [Q.of(7 - k, 6).toString(), 'used one die'], [qpow(Q.of(6 - k, 6), n).toString(), 'used "above k" instead of "at least k"']], `((6 − ${k} + 1)/6)^${n} = ${v}.`); } },
        ] },
      { say: 'Add the s terms. As a check, E[min] + E[max] = s + 1 for fair dice.', why: 'Turning each die upside down (face x becomes s + 1 − x) swaps the minimum and the maximum.',
        checks: [
          { make: (rng) => { const n = rng.int(2, 3), s = rng.pick([4, 6]); const mx = eMax(s, n); return mc(rng, `${words[n]} fair ${s}-sided dice have E[max] = ${mx}. What is E[min]?`, Q.of(s + 1).sub(mx).toString(), [[Q.of(s + 1, 2).toString(), 'used the one-die average'], [Q.of(s).sub(mx).toString(), `used s instead of s + 1 = ${s + 1}`], [one.div(mx).toString(), 'took the reciprocal']], `${s + 1} − ${mx} = ${Q.of(s + 1).sub(mx)}.`); } },
        ] },
      { say: 'Uniforms: n independent points on [0, 1] cut it into n + 1 gaps, each with mean 1/(n + 1). So E[k-th smallest] = k/(n + 1).', why: 'Add one more uniform point and bend [0, 1] into a circle: all n + 1 gaps become interchangeable, so they share the length 1 equally on average. This is for continuous points only; dice are whole numbers from 1 to s and need the tail sums.', answers: 'continuous',
        checks: [
          { make: (rng) => { const n = rng.int(3, 6), k = rng.int(1, n); return mc(rng, `${n} uniforms on [0, 1]. Expected value of the ${k === 1 ? 'smallest' : k === n ? 'largest' : `${k}-th smallest`}?`, Q.of(k, n + 1).toString(), [[Q.of(k, n).toString(), `divided by ${n} instead of ${n + 1}`], [Q.of(k, n + 2).toString(), `divided by ${n + 2}`], ['1/2', 'used one uniform']], `${k} gaps of 1/${n + 1}: ${Q.of(k, n + 1)}.`); } },
        ] },
      { say: 'Distance between two uniforms: it is the middle of the 3 gaps, so E|X − Y| = 1/3. The range of n uniforms is n − 1 middle gaps: (n − 1)/(n + 1).', why: 'Count which gaps make up the quantity, then multiply by the common mean length.',
        checks: [
          { make: (rng) => { const n = rng.int(2, 6); return mc(rng, `${n} uniforms on [0, 1]. Expected value of (largest − smallest)?`, Q.of(n - 1, n + 1).toString(), [['1/2', 'used one uniform'], [Q.of(n - 1, n).toString(), 'divided by n instead of n + 1'], [Q.of(2, n + 1).toString(), 'took two gaps instead of the n − 1 middle ones'], [Q.of(n, n + 1).toString(), 'gave E[max] and forgot to subtract E[min]'], [Q.of(n - 1, n + 2).toString(), `divided by ${n + 2} instead of ${n + 1}`]], `${n - 1} middle gaps of 1/${n + 1}: ${Q.of(n - 1, n + 1)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does adding up P(X ≥ k) over k give the expected value of X?', model: 'Write X as a count of the thresholds it clears: a value of 4 clears 1, 2, 3 and 4, so X is a sum of indicators [X ≥ k]. The expected value of each indicator is P(X ≥ k), and by linearity the expected sum is the sum of those probabilities.', points: ['X counts the thresholds 1, 2, … that it reaches', 'each threshold is an indicator with mean P(X ≥ k)', 'linearity adds them'] },

    S('worked'),
    { type: 'worked', family: 'expected-extremes', section: 'bto', difficulty: 2, seed: 'd', explainAt: [0, 1], intro: 'The lowest of two dice. Try it before opening the solution.' },
    { type: 'worked', family: 'expected-extremes', section: 'bto', difficulty: 4, seed: 'a', fade: 1, intro: 'Uniforms and gaps. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Is the expected highest of three dice closer to 5 or to 6? And does a fourth die add more or less than the third did?', answer: `Closer to 5: ${f3(eMax(6, 3))}. The third die added ${f3(eMax(6, 3).sub(eMax(6, 2)))}; a fourth adds only ${f3(eMax(6, 4).sub(eMax(6, 3)))}.`, explain: 'Diminishing returns: each extra die rarely beats an already high maximum.' },

    S('traps'),
    { type: 'traps', family: 'expected-extremes', section: 'bto', extra: [
      { belief: 'The highest of several dice averages 3.5, like one die.', fix: `The maximum is pulled up: ${eMax(6, 2)} ≈ ${f3(eMax(6, 2))} for two dice.` },
      { belief: 'For dice use s·n/(n + 1) like uniforms.', fix: 'Dice are discrete and start at 1: use tail sums.' },
      { belief: 'n uniform points make n gaps.', fix: 'They make n + 1 gaps (before, between and after the points).' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out E[min] of two fair dice. One step is wrong.', steps: [
      'E[min] = Σ P(min ≥ k), k = 1 to 6.',
      'P(min ≥ k) = 1 − ((k − 1)/6)².',
      `Sum = ${eMax(6, 2)}.`,
      `E[min] ≈ ${f3(eMax(6, 2))}.`,
    ], errorStep: 1, explain: `That is the maximum's tail. The minimum is at least k when both dice are: P(min ≥ k) = ((7 − k)/6)². Sum = ${eMin(6, 2)} ≈ ${f3(eMin(6, 2))}. Sanity check: ${f3(eMax(6, 2))} is above 3.5, impossible for a minimum.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'Four uniforms on [0, 1]. A candidate answers 3/4 for E[max]. Which belief?', options: ['Counted n gaps instead of n + 1', 'Swapped the max and the min', 'Used a single uniform only'], answer: 0, traps: { 1: 'E[min] of four uniforms is 1/5, not 3/4', 2: 'one uniform averages 1/2' }, explain: '4 points make 5 gaps: E[max] = 4/5.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Landmarks: two dice max ${eMax(6, 2)} ≈ ${f3(eMax(6, 2))}, min ${eMin(6, 2)} ≈ ${f3(eMin(6, 2))}; three dice max ${f3(eMax(6, 3))}, min ${f3(eMin(6, 3))}. Uniforms: max of n is n/(n + 1); E|X − Y| = 1/3.` },
    { type: 'check', scope: 'the landmarks', questions: [
      { type: 'choice', q: 'Two independent uniform numbers on [0, 1]. E[max]?', options: ['2/3', '1/2', '1/3', '3/4'], answer: 0, traps: { 1: 'that is one uniform on its own', 2: 'that is E[min] of two, or E|X − Y|', 3: 'that is the max of three' }, explain: 'Max of n uniforms: n/(n + 1) = 2/3.' },
    ] },
    { type: 'callout', tone: 'speed', text: `Sanity checks: E[max] is above the one-die mean and below the top face; E[min] + E[max] = s + 1. For uniforms, the expected positions are evenly spaced. Budget about 40 of the ${SECTIONS.bto.exam.perItemSeconds} seconds for a six-term tail sum.` },
    { type: 'thinkaloud', problem: 'You roll three fair dice. What is the expected value of the lowest face?', lines: [
      { t: 0, say: 'Expected lowest of three dice: a tail sum. E[min] = Σ P(min ≥ k) for k = 1 to 6.' },
      { t: 4, say: 'P(min ≥ k) = 1 − ((k − 1)/6)³...', slip: true },
      { t: 8, say: 'No, that is the maximum\'s tail. The minimum is at least k when every die is: ((7 − k)/6)³.' },
      { t: 13, say: `Cubes over 216: ${K6.map((k) => (7 - k) ** 3).join(' + ')} = ${K6.reduce((a, k) => a + (7 - k) ** 3, 0)}. So ${eMin(6, 3)} ≈ ${f3(eMin(6, 3))}.` },
      { t: 22, say: `Check: E[max] should be 7 − ${f3(eMin(6, 3))} = ${f3(eMax(6, 3))}, the three-dice landmark. And ${f3(eMin(6, 3))} sits below 3.5, as a minimum must.` },
      { t: 26, say: `Answer ≈ ${f3(eMin(6, 3))}, ${SECTIONS.bto.exam.perItemSeconds - 26} seconds left.` },
    ] },
    { type: 'check', scope: 'the symmetry check', questions: [
      { make: (rng) => { const n = rng.int(2, 4); return mc(rng, `${words[n]} fair dice. Which pair (E[min], E[max]) is possible?`, `${f3(eMin(6, n))} and ${f3(eMax(6, n))}`, [[`${f3(eMin(6, n))} and ${f3(Q.of(6).sub(eMin(6, n)))}`, 'the two must add to 7, not 6'], [`3.500 and ${f3(eMax(6, n))}`, 'the minimum is below the one-die mean'], [`${f3(eMin(6, n))} and 6.000`, 'the maximum is not always 6']], `They add to 7: ${f3(eMin(6, n))} + ${f3(eMax(6, n))}.`); } },
      { type: 'choice', q: 'In the think-aloud, the first try wrote P(min ≥ k) = 1 − ((k − 1)/6)³. What was wrong?', options: ['that is a tail of the maximum', 'the cube should be a square', 'k should start at 0'], answer: 0, traps: { 1: 'three dice give a cube', 2: 'the tail sum runs from k = 1 to 6' }, explain: 'The minimum is at least k when every die is: ((7 − k)/6)³.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Dice: E[max] = Σ (1 − ((k−1)/s)^n), E[min] = Σ ((s−k+1)/s)^n, and they add to s + 1. Uniforms: k-th smallest of n → k/(n + 1).' },

    S('contrast'),
    { type: 'compare', columns: ['Two draws', 'E[max]', 'E[min]', 'Method'], rows: [
      ['two fair dice', f3(eMax(6, 2)), f3(eMin(6, 2)), 'tail sums, add to 7'],
      ['two uniforms on [0, 6]', '4', '2', '6 × 2/3 and 6 × 1/3'],
      ['two uniforms on [0, 1]', '2/3', '1/3', 'three gaps of 1/3'],
      ['one die with one reroll (you choose)', REROLL.toString(), 'n/a', 'stopping rule (bto/dice-games-ev)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: one die gives E[max] = E[min] = 3.5. As the number of dice grows, E[max] → 6 and E[min] → 1. For uniforms, the range of two points is exactly their distance: (2 − 1)/(2 + 1) = 1/3.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Which is larger: E[max of two dice] or the value of one die with one optional reroll?', options: ['E[max of two dice]', 'The one-reroll game', 'They are exactly equal'], answer: 0, traps: { 1: 'with a reroll you must accept the second roll, so you cannot always keep the better one', 2: 'the reroll decision is made without seeing the second roll' }, explain: `${f3(eMax(6, 2))} against ${REROLL} = ${f3(REROLL)}: keeping the better of two seen rolls beats deciding blind.` },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the tail sum is linearity with one indicator per threshold (bto/linearity). The maximum of two rolls is the "keep the better" value that the reroll game falls short of (bto/dice-games-ev). The gaps picture also answers broken-stick questions (bto/uniform-geometry).' },
    { type: 'variation', base: `Two fair dice: E[max] = ${eMax(6, 2)} ≈ ${f3(eMax(6, 2))}.`, rows: [
      { change: 'Ask for 7 minus the expected lowest face', effect: `No change: ${f3(eMax(6, 2))}. Turning both dice upside down swaps min and max, so E[min] = 7 − E[max].`, same: true },
      { change: 'Roll three dice', effect: `Each tail rises to 1 − ((k − 1)/6)³: E[max] = ${eMax(6, 3)} ≈ ${f3(eMax(6, 3))}.` },
      { change: 'Ask for the lowest face', effect: `Use the minimum's tail ((7 − k)/6)²: ${eMin(6, 2)} ≈ ${f3(eMin(6, 2))}.` },
      { change: 'Replace the dice by two uniforms on [0, 6]', effect: 'Continuous now: two points make three gaps of mean 2, so E[max] = 4. Lower than the dice value, because dice start at 1, not 0.' },
      { change: 'Three 4-sided dice, lowest face', effect: `Both changes enter one tail sum: Σ ((5 − k)/4)³ for k = 1 to 4 = ${eMin(4, 3)} ≈ ${f3(eMin(4, 3))}.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const s = rng.pick([4, 8, 10]), n = rng.int(2, 3); const v = eMax(s, n); return mc(rng, `A spinner with ${s} equal sectors numbered 1 to ${s} is spun ${n} times. Expected value of the highest number, 3 decimals?`, f3(v), [[f3(Q.of(s + 1, 2)), 'used the average of one spin'], [f3(Q.of(s * n, n + 1)), 'used the continuous formula s·n/(n + 1)'], [f3(eMin(s, n)), 'gave the lowest number']], `Σ (1 − ((k − 1)/${s})^${n}) for k = 1 to ${s} = ${v} ≈ ${f3(v)}.`); } },
      far: { make: (rng) => { const n = rng.int(3, 6); const v = Q.of(n - 1, n + 1); return { type: 'number', q: `In a second-price auction, ${n} bidders each bid a value drawn uniformly from 0 to 1 (million euros), independently. The winner pays the second-highest bid. Expected price paid? (Decimals are fine.)`, answer: v.toNumber(), tolerance: 0.001, hints: [`${n} points cut [0, 1] into ${n + 1} gaps of mean 1/${n + 1}.`, 'The second-highest bid is two gaps below 1.'], explain: `The second-highest bid is two gaps below 1: 1 − 2/${n + 1} = ${n - 1}/${n + 1} ≈ ${v.toNumber().toFixed(3)} million.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from dice to the spinner and to the auction?', options: ['Tail sums for whole numbers, equal gaps for uniforms', 'An extreme averages the same as a single draw does', 'The uniform formula s·n/(n + 1) fits every case', 'n points cut the interval into n equal gaps'], answer: 0, traps: { 1: 'the maximum is pulled up and the minimum down', 2: 'discrete values starting at 1 need tail sums', 3: 'n points make n + 1 gaps' }, explain: 'The spinner is a die with more faces: add P(max ≥ k). The bids are uniforms: the second-highest sits two of the n + 1 equal gaps below the top.' } },

    S('tryit'),
    { type: 'tryit', family: 'expected-extremes', section: 'bto', count: 3 },
  ],
};
