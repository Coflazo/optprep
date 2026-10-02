// Linearity of expectation with indicators: a count is a sum of 0/1 variables, and its mean is
// the sum of their probabilities, dependent or not. Every number shown is computed here.
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
const H = (n) => { let s = Q.of(0); for (let i = 1; i <= n; i++) s = s.add(Q.of(1, i)); return s; };
const distinct = (s, n) => Q.of(s).mul(one.sub(qpow(Q.of(s - 1, s), n)));
const empty = (k, m) => Q.of(k).mul(qpow(Q.of(k - 1, k), m));
const pSame = (r, b) => Q.of(r * (r - 1) + b * (b - 1), (r + b) * (r + b - 1));
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const D = (n) => { const d = [1, 0]; for (let m = 2; m <= n; m++) d.push((m - 1) * (d[m - 1] + d[m - 2])); return d[n]; };
const nCr = (n, r) => fact(n) / (fact(r) * fact(n - r));
// All 8 strings of 3 flips with their runs and change indicators.
const STR3 = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
const ch = (s, i) => (s[i] !== s[i + 1] ? 1 : 0);
const runs = (s) => 1 + ch(s, 0) + ch(s, 1);
const FP5 = [0, 1, 2, 3, 4, 5].map((k) => nCr(5, k) * D(5 - k));
const TK = 10; // think-aloud: 10 rolls
const ROLLS = Array.from({ length: 21 }, (_, i) => i);

export default {
  id: 'bto/linearity',
  book: 'bto',
  kind: 'family',
  family: 'linearity',
  title: 'Linearity of expectation',
  summary: 'Write the count as a sum of 0/1 indicators. E[count] = Σ P(each event), whether or not the events are dependent.',
  prerequisites: ['prob/expectation-linearity', 'bto/derangements', 'bto/coin-sequences'],
  objectives: [
    'Write any "expected number of …" as a sum of indicators, one per place, face, box or person',
    'Replace each indicator\'s expectation by a probability and add, without worrying about dependence',
    'Get the standard results fast: fixed points 1, runs (n + 1)/2, records H_n, empty boxes k(1 − 1/k)^m, distinct faces s(1 − (1 − 1/s)^n)',
    'Keep "expected count" apart from "probability of at least one"',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: 10 people drop their hats in a box and each takes one back at random. What is the expected number of people who get their own hat? Try two approaches.', answer: '1', explain: `If you started on the distribution (P(0 matches) ≈ ${f3(Q.of(D(10), fact(10)))}, P(1 match), …), you took the long road. Each person gets their own hat with 1/10, and 10 × 1/10 = 1. The lesson makes that one line work for every count.`, attempts: [
      { id: 'distribution', label: 'Build the whole distribution', approach: 'Started on P(0 matches), P(1 match), P(2 matches), … to average them.', breaksAt: 'Correct, but it needs a derangement count for every k. The count is a sum of 10 yes/no pieces, and the mean only needs those pieces.' },
      { id: 'at-least-one', label: 'P(at least one match)', approach: `Worked out P(someone gets their own hat) ≈ ${f3(one.sub(Q.of(D(10), fact(10))))} and gave that.`, breaksAt: 'That is a probability about the count, not its average. The count can be 2 or 3; its mean is built from each piece\'s own probability.' },
      { id: 'dependent', label: 'Dependence blocks 10 × 1/10', approach: 'Saw that the matches are dependent and decided 10 × 1/10 could not be trusted.', breaksAt: 'Adding expectations needs no independence. Dependence changes how matches cluster, never the mean.' },
    ] },
    { type: 'text', text: 'The question asks for an **expected number of** something: people who get their own hat, runs in a coin sequence, different faces seen, empty boxes, records, adjacent pairs of the same colour. The count could be complicated; its mean almost never is.' },
    { type: 'list', items: ['"A die is rolled 6 times. Expected number of different faces seen?"', '"10 balls into 4 boxes. Expected number of empty boxes?"', '"A deck is shuffled and laid out. Expected number of adjacent pairs of the same colour?"'] },
    { type: 'check', scope: 'an expected count', questions: [
      { type: 'choice', q: 'What does a linearity question ask for?', options: ['an expected count', 'the chance the count is 0', 'the most likely count', 'the whole distribution'], answer: 0, traps: { 1: 'that needs a complement or the distribution', 2: 'the most likely value is not the mean', 3: 'the mean needs no distribution' }, explain: 'An expected number of something: a mean of a count.' },
    ] },
    { type: 'text', text: 'Not this lesson: the **probability** that the count is 0 or at least 1 (bto/derangements, bto/birthday). Those need the whole distribution or a complement; the mean needs neither.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Roll a die 10 times: expected number of faces that never appear', 'Roll a die 10 times: probability that some face never appears', 'Roll a die until every face appears: expected rolls', 'Roll a die 10 times: probability of exactly two sixes'], answer: 0, traps: { 1: 'a probability of "at least one": inclusion-exclusion', 2: 'a waiting time: bto/coupon-collector', 3: 'a binomial probability' }, explain: 'An expected count: one indicator per face.' },
    ] },

    S('why'),
    { type: 'text', text: 'Expected-count questions look as if they need the full distribution, which is often a nightmare (how likely is each number of runs?). Linearity cuts that to one probability times a count, and it works **even when the events are dependent**. That last clause is exactly what candidates doubt, so it is exactly what the options exploit. The method is always the same three moves, and the only thinking is choosing what one indicator stands for: a person, a face, a box, a gap between flips, a position in a shuffle.' },

    S('anchor'),
    { type: 'text', text: 'You know E[X + Y] = E[X] + E[Y]: the expected sum of two dice is 3.5 + 3.5 = 7. Linearity for counts is that rule with **one change**: split the count into 0/1 **indicators**, one per small event. An indicator is 1 with probability p and 0 otherwise, so its expectation is just p.' },
    { type: 'check', scope: 'an indicator\'s expectation is its probability', questions: [
      { make: (rng) => { const s = rng.pick([4, 6, 8, 10]); return mc(rng, `I = 1 if a fair ${s}-sided die shows its top face, else 0. What is E[I]?`, Q.of(1, s).toString(), [[String(s), 'gave the face value, not the indicator'], [Q.of(s + 1, 2).toString(), 'gave the average face'], [Q.of(s - 1, s).toString(), 'gave the chance of the other outcome']], `E[I] = 1 × P(top face) + 0 × P(not) = 1/${s}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Take 3 flips of a fair coin. The number of runs is 1 plus the number of places where the next flip **changes**. Put one indicator on each of the two gaps.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'All 8 strings of 3 flips', columns: ['string', 'change at gap 1', 'change at gap 2', 'runs'], rows: STR3.map((s) => [s, String(ch(s, 0)), String(ch(s, 1)), String(runs(s))]) }, caption: `Each gap column holds four 1s out of 8: P(change) = 1/2 per gap. The runs column adds to ${STR3.reduce((a, s) => a + runs(s), 0)}, so E[runs] = ${Q.of(STR3.reduce((a, s) => a + runs(s), 0), 8)} = 1 + 1/2 + 1/2. You never needed the distribution of runs.` },
    { type: 'check', scope: 'runs as 1 + change indicators', questions: [
      { make: (rng) => { const n = rng.int(5, 20); return mc(rng, `A fair coin is flipped ${n} times. Expected number of runs?`, Q.of(n + 1, 2).toString(), [[Q.of(n, 2).toString(), 'forgot the first run'], [String(n - 1), 'counted every gap as a change'], ['2', 'assumed one run of heads and one of tails']], `1 + (${n} − 1)/2 = ${Q.of(n + 1, 2)}.`); } },
    ] },
    { type: 'text', text: 'Now a count with strongly **dependent** pieces: fixed points of a random ordering of 5 items (people who get their own hat). The distribution is lumpy, and exactly 4 matches is impossible.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Orderings of 5 items by number of fixed points', xLabel: 'fixed points', yLabel: 'orderings (of 120)', categories: ['0', '1', '2', '3', '4', '5'], series: [{ name: 'orderings', values: FP5 }], valueLabels: true }, caption: `Mean = (${FP5.map((c, k) => `${k}·${c}`).join(' + ')})/120 = ${Q.of(FP5.reduce((a, c, k) => a + k * c, 0), 120)}. Dependence shapes the bars; it does not move the mean. Five indicators with 1/5 each give 1 directly.` },
    { type: 'check', scope: 'dependence does not change the mean', questions: [
      { make: (rng) => { const n = rng.int(4, 52); return mc(rng, `A deck of ${n} different cards is shuffled. Expected number of cards still in their original position?`, '1', [[`1/${n}`, 'gave one card\'s chance, not the expected count'], [String(Math.exp(-1).toFixed(3)), 'gave P(no card in place), about 1/e'], ['0', 'thought dependence cancels the matches']], `${n} indicators, each with chance 1/${n}: ${n} × 1/${n} = 1.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'One indicator per **face** turns "different faces seen" into a sum. Each face is seen with 1 − (5/6)^n after n rolls, so E = 6(1 − (5/6)^n).' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 20, label: 'rolls n' }, y: { min: 0, max: 6, label: 'expected different faces' }, curves: [{ label: '6(1 − (5/6)^n)', points: ROLLS.map((n) => [n, distinct(6, n).toNumber()]) }], hlines: [{ y: 6, label: 'all 6 faces' }] }, caption: `After 6 rolls you expect ${f3(distinct(6, 6))} different faces, not 6: repeats set in early. The curve creeps towards 6 but never gets there.` },
    { type: 'check', scope: 'indicators per face', questions: [
      { make: (rng) => { const n = rng.int(2, 5), s = rng.pick([4, 6, 8]); const v = distinct(s, n); return mc(rng, `A fair ${s}-sided die is rolled ${n} times. Expected number of different faces?`, v.toString(), [[String(n), 'assumed every roll shows a new face'], [one.sub(qpow(Q.of(s - 1, s), n)).toString(), 'gave P(one particular face appears)'], [Q.of(s).mul(qpow(Q.of(s - 1, s), n)).toString(), 'counted the faces that do not appear']], `${s} × (1 − (${s - 1}/${s})^${n}) = ${v} ≈ ${f3(v)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Name what is counted and write count = I₁ + I₂ + … + I_m, one indicator per place, face, box or person.', why: 'Every count is a sum of yes/no questions: "is box 3 empty?", "does face 5 appear?". Choosing the right "one per" is the only creative step; pick the thing the question counts.', answers: 'distribution',
        checks: [
          { type: 'choice', q: '"Expected number of empty boxes when m balls go into k boxes." One indicator per:', options: ['box', 'ball', 'pair of balls', 'ball-box pair'], answer: 0, traps: { 1: 'balls are never empty: the count is about boxes', 2: 'pairs count collisions, not empty boxes', 3: 'that counts placements, not empty boxes' }, explain: 'I_j = 1 if box j is empty; the count is Σ I_j over the k boxes.' },
        ] },
      { say: 'Replace each expectation by a probability: E[I_j] = P(event j).', why: 'An indicator is 1 with probability P(event j) and 0 otherwise.', answers: 'at-least-one',
        checks: [
          { make: (rng) => { const k = rng.int(3, 6), m = rng.int(3, 6); const v = qpow(Q.of(k - 1, k), m); return mc(rng, `${m} balls are thrown independently into ${k} boxes. P(box 1 is empty)?`, v.toString(), [[Q.of(1, k).toString(), 'used the chance a ball lands in box 1'], [one.sub(v).toString(), 'answered "box 1 is occupied"'], [qpow(Q.of(k - 1, k), m - 1).toString(), 'one factor short']], `Every ball misses box 1: (${k - 1}/${k})^${m} = ${v}.`); } },
        ] },
      { say: 'Add them: E[count] = Σ P(event j). No independence is needed.', why: 'Expectation is a sum over outcomes, and sums can be regrouped in any order. Dependence changes the spread, never the mean.', answers: 'dependent',
        checks: [
          { make: (rng) => { const k = rng.int(3, 5), m = rng.int(3, 6); const v = empty(k, m); return mc(rng, `${m} balls into ${k} boxes. Expected number of empty boxes?`, v.toString(), [[String(Math.max(0, k - m)), 'assumed the balls spread perfectly'], [qpow(Q.of(k - 1, k), m).toString(), 'gave P(one box empty), not the count'], [Q.of(k).sub(v).toString(), 'counted occupied boxes']], `${k} × (${k - 1}/${k})^${m} = ${v} ≈ ${f3(v)}.`); } },
        ] },
      { say: 'Patterns: n flips contain n − L + 1 windows of length L, and each window matches a fixed pattern with 1/2^L. Overlaps do not matter.', why: 'One indicator per window, each with the same probability.',
        checks: [
          { make: (rng) => { const n = rng.int(5, 15); return mc(rng, `${n} fair flips. Expected number of positions where two consecutive flips are both heads (HHH counts 2)?`, Q.of(n - 1, 4).toString(), [[Q.of(n, 4).toString(), `counted ${n} windows; there are ${n - 1}`], [Q.of(n - 1, 2).toString(), 'used 1/2 per window: both flips must be heads'], [Q.of(Math.floor(n / 2), 4).toString(), 'only counted non-overlapping pairs']], `${n - 1} windows × 1/4 = ${Q.of(n - 1, 4)}.`); } },
        ] },
      { say: 'Records: position k holds a record exactly when it holds the largest of the first k numbers, which has chance 1/k. So E[records] = 1 + 1/2 + … + 1/n = H_n.', why: 'Among the first k numbers, each is equally likely to be the largest.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 6); return mc(rng, `The numbers 1 to ${n} are shuffled. Expected number of records (left-to-right maxima)?`, H(n).toString(), [[Q.of(n, 2).toString(), 'assumed half the positions are records'], [H(n).sub(one).toString(), 'forgot that the first number is always a record'], ['1', 'only counted the first number']], `1 + 1/2 + … + 1/${n} = ${H(n)}.`); } },
        ] },
      { say: 'Without replacement the same works: two given positions of a shuffled deck show the same colour with [r(r − 1) + b(b − 1)]/[N(N − 1)]. Multiply by the N − 1 adjacent pairs.', why: 'Each pair of positions holds a uniformly random ordered pair of distinct cards.',
        checks: [
          { make: (rng) => { const [r, b] = rng.pick([[4, 4], [6, 6], [5, 10], [26, 26]]); const N = r + b; const v = Q.of(N - 1).mul(pSame(r, b)); return mc(rng, `${r} red and ${b} black cards are shuffled in a row. Expected number of adjacent same-colour pairs?`, v.toString(), [[Q.of(N - 1, 2).toString(), 'used 1/2 per pair, as if with replacement'], [pSame(r, b).toString(), 'gave the probability for one pair'], [Q.of(N - 1).mul(one.sub(pSame(r, b))).toString(), 'counted pairs of different colours']], `${N - 1} × ${pSame(r, b)} = ${v} ≈ ${f3(v)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: the hat matches are clearly dependent. Why is the expected number of matches still exactly n × 1/n = 1?', model: 'The expected value of a sum is the sum of the expected values, because expectation is itself a sum over outcomes and sums can be regrouped. Dependence changes how the matches cluster (for example exactly n − 1 matches is impossible) but each person still gets their own hat with chance 1/n, so the total mean is n × 1/n.', points: ['count = sum of indicators', 'E[sum] = sum of E, with no independence needed', 'each indicator has expectation 1/n'] },

    S('worked'),
    { type: 'worked', family: 'linearity', section: 'bto', difficulty: 2, seed: 'd', explainAt: [0], intro: 'Runs in a coin sequence. Try it before opening the solution.' },
    { type: 'worked', family: 'linearity', section: 'bto', difficulty: 3, seed: 'c', fade: 1, intro: 'Different faces seen. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Roll a die 6 times. Is the expected number of different faces closer to 4 or to 6? And the expected number of faces never seen?', answer: `About ${f3(distinct(6, 6))} seen, and ${f3(Q.of(6).sub(distinct(6, 6)))} never seen. They add to 6.`, explain: 'Each face is missed with (5/6)^6 ≈ 0.335.' },

    S('traps'),
    { type: 'traps', family: 'linearity', section: 'bto', extra: [
      { belief: 'The events are dependent, so linearity does not apply.', fix: 'Linearity needs no independence. Only products of expectations do.' },
      { belief: 'The expected count equals the probability for one indicator.', fix: 'Multiply by the number of indicators: E = m × p.' },
      { belief: 'Expected number of matches = P(at least one match).', fix: 'Different questions: the count can be 2 or 3; its mean is 1, while P(at least one) ≈ 1 − 1/e.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out the expected number of different faces in 3 rolls of a fair die. One step is wrong.', steps: [
      'Let I_f = 1 if face f appears; the count is the sum over 6 faces.',
      'P(face f appears) = 3 × 1/6 = 1/2.',
      'E = 6 × 1/2 = 3.',
      'Answer: 3.',
    ], errorStep: 1, explain: `Adding 1/6 per roll double counts rolls that repeat face f. P(face f appears) = 1 − (5/6)³ = ${one.sub(qpow(Q.of(5, 6), 3))}, so E = ${distinct(6, 3)} ≈ ${f3(distinct(6, 3))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: '5 balls into 3 boxes. A candidate answers (2/3)⁵ for the expected number of empty boxes. Which belief?', options: ['Gave one indicator\'s probability, not the count', 'Assumed the boxes fill independently of each other', 'Counted occupied boxes instead of empty ones'], answer: 0, traps: { 1: 'independence is not needed, and assuming it would not change the mean', 2: `occupied boxes average ${Q.of(3).sub(empty(3, 5))}, well above 1` }, explain: `Multiply by the 3 boxes: 3 × (2/3)⁵ = ${empty(3, 5)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Say the template out loud: "one indicator per ___, each with probability ___, times how many". If you can fill both blanks, you are done. Fixed points 1; runs (n + 1)/2; windows (n − L + 1)/2^L; records H_n.' },
    { type: 'check', scope: 'the template', questions: [
      { make: (rng) => { const n = rng.int(10, 40); return { type: 'number', q: `${n} fair flips. Expected number of times the pattern HT appears (as two consecutive flips)?`, answer: (n - 1) / 4, tolerance: 1e-9, hints: ['One indicator per window of two flips.', `${n - 1} windows, each HT with 1/4.`], explain: `(${n} − 1)/4 = ${(n - 1) / 4}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `Harmonic numbers to keep: H₃ = ${H(3)}, H₄ = ${H(4)}, H₅ = ${H(5)}, H₆ = ${H(6)} ≈ ${f3(H(6))}. They reappear in coupon collecting. An item like this should take 30 of your ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'thinkaloud', problem: `A fair die is rolled ${TK} times. What is the expected number of faces that never appear?`, lines: [
      { t: 0, say: '"Expected number of": linearity. One indicator per face, 6 of them.' },
      { t: 4, say: `Face f never appears with (5/6)^${TK}.` },
      { t: 8, say: 'But the faces are dependent: if one is missing, the others are more likely to show. So I cannot just multiply by 6...', slip: true },
      { t: 13, say: `No: linearity needs no independence. Dependence changes the spread, not the mean. E = 6 × (5/6)^${TK}.` },
      { t: 19, say: `(5/6)^${TK} ≈ ${f3(qpow(Q.of(5, 6), TK))}, times 6 ≈ ${f3(Q.of(6).mul(qpow(Q.of(5, 6), TK)))}.` },
      { t: 25, say: `Sanity: ${TK} rolls should show most faces, so about one missing face is plausible. Answer ≈ ${f3(Q.of(6).mul(qpow(Q.of(5, 6), TK)))}, ${SECTIONS.bto.exam.perItemSeconds - 25} seconds left.` },
    ] },
    { type: 'check', scope: 'harmonic numbers and the think-aloud', questions: [
      { type: 'number', q: 'Four different numbers are put in a random order. Expected number of records (values larger than all before them)? Decimals are fine.', answer: 25 / 12, tolerance: 0.01, explain: 'Position i holds a record with chance 1/i: 1 + 1/2 + 1/3 + 1/4 = H₄ = 25/12 ≈ 2.083.' },
      { type: 'choice', q: 'In the think-aloud, the expert worried that the missing faces are dependent. What settles it?', options: ['linearity needs no independence', 'the faces are independent after all', 'multiply by 6 only if independent'], answer: 0, traps: { 1: 'they are dependent: one missing face makes the others more likely to show', 2: 'linearity adds the means whatever the dependence' }, explain: 'Dependence changes the spread, not the mean: E = 6 × (5/6)^10 ≈ 0.969.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: '"Expected number of …" → one indicator per place; E = Σ P(each). Dependence is irrelevant.' },

    S('contrast'),
    { type: 'compare', columns: ['Question (6 rolls of a die)', 'Tool', 'Value'], rows: [
      ['expected number of different faces', 'linearity: 6 × P(face seen)', f3(distinct(6, 6))],
      ['expected number of faces never seen', 'linearity: 6 × (5/6)⁶', f3(Q.of(6).mul(qpow(Q.of(5, 6), 6)))],
      ['P(all six faces seen)', 'counting: 6!/6⁶', f3(Q.of(fact(6), 6 ** 6))],
      ['P(some face never seen)', 'complement of the above', f3(one.sub(Q.of(fact(6), 6 ** 6)))],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a count that is always the same number has that number as its mean (e.g. 52 cards, 52 positions). Linearity fails only for products and non-linear functions: E[XY] = E[X]E[Y] needs independence, and E[X²] is not E[X]².' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Two fair dice. Which needs independence to compute as a product of means?', options: ['E[product of the faces]', 'E[sum of the faces]', 'E[number of sixes]', 'E[number of even faces]'], answer: 0, traps: { 1: 'sums split by linearity with no assumption', 2: 'a count of indicators: linearity', 3: 'also a count of indicators' }, explain: 'E[XY] = E[X]E[Y] holds for independent dice; sums and counts need nothing.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the tail-sum formula E[X] = Σ P(X ≥ k) is linearity with one indicator per threshold (bto/expected-extremes). Coupon collecting adds stage waits the same way (bto/coupon-collector). In Likelihood List items, expected counts often order statements without any heavy computation.' },
    { type: 'variation', base: '10 people take back their hats at random, one each. Expected number who get their own hat = 10 × 1/10 = 1.', rows: [
      { change: 'Use 100 people instead of 10', effect: 'No change: 100 × 1/100 = 1. More indicators, each less likely, and the two cancel.', same: true },
      { change: 'Each person grabs any hat, repeats allowed', effect: 'Still 1. The model changes and the events become independent, but each person still has chance 1/10.', same: true },
      { change: 'Ask for P(at least one gets their own hat)', effect: `A probability, not a mean: 1 − D(10)/10! ≈ ${f3(one.sub(Q.of(D(10), fact(10))))}. It needs derangements, not linearity.` },
      { change: 'Count pairs of people who swapped hats with each other', effect: `One indicator per pair: C(10,2) = ${nCr(10, 2)} pairs, each a swap with 1/(10 × 9). E = ${nCr(10, 2)}/90 = ${Q.of(nCr(10, 2), 90)}.` },
      { change: '20 people in a circle, count those who get their own hat or their right neighbour\'s', effect: 'Two changes: n cancels as before, but each person now has 2 winning hats: 20 × 2/20 = 2.', fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const k = rng.pick([5, 8, 10]), m = rng.int(3, 6); const v = empty(k, m); return mc(rng, `${m} traders each pick a whole number from 1 to ${k} at random, independently. Expected number of values from 1 to ${k} that nobody picked, 3 decimals?`, f3(v), [[f3(qpow(Q.of(k - 1, k), m)), 'gave the chance that one value is unpicked, not the count'], [String(Math.max(0, k - m)), 'assumed the traders pick different numbers'], [f3(Q.of(k).sub(v)), 'counted the values that were picked']], `One indicator per value: ${k} × (${k - 1}/${k})^${m} ≈ ${f3(v)}.`); } },
      far: { make: (rng) => { const n = rng.int(3, 6); const v = Q.of(2 * n, 2 * n - 1); return { type: 'number', q: `${n} couples (${2 * n} people) sit at random around a round table. Expected number of couples sitting next to each other? (Decimals are fine.)`, answer: v.toNumber(), tolerance: 0.005, hints: ['One indicator per couple.', `Seat one partner anywhere; the other takes one of the remaining ${2 * n - 1} seats, and 2 of them are adjacent.`], explain: `Each couple is together with 2/${2 * n - 1}; ${n} couples: ${n} × 2/${2 * n - 1} = ${v} ≈ ${v.toNumber().toFixed(3)}. The couples are dependent; linearity does not care.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from hats to the traders and to the table?', options: ['Write the count as indicators and add their chances', 'Events are dependent, so find the distribution first', 'The expected count is P(at least one event happens)', 'The expected count is one indicator\'s probability'], answer: 0, traps: { 1: 'dependence never blocks adding expectations', 2: 'a mean of a count is not a probability', 3: 'multiply by the number of indicators' }, explain: 'Unpicked values and seated couples are counts. One indicator per value or couple, each probability once, then add.' } },

    S('tryit'),
    { type: 'tryit', family: 'linearity', section: 'bto', count: 3 },
  ],
};
