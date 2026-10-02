// Intervals: statistics of a grid of 200 scores (median, percentile, count above a threshold,
// mean) without sorting: translate to a rank, count against trial values in sampled rows,
// scale up, adjust. Grids are generated here from fixed seeds; every count shown is computed.
import { makeRng } from '../../../core/rng.js';
import { sec, dec, round, mc, ivq, bestNorm, eNorm } from './scoring-and-width.js';

const scores = (seed, n, mu, sd) => { const rng = makeRng(seed); return Array.from({ length: n }, () => Math.min(99, Math.max(1, Math.round(rng.normal(mu, sd))))); };
const atMost = (v, x) => v.filter((y) => y <= x).length;
const kth = (v, k) => [...v].sort((a, b) => a - b)[k - 1];
const median200 = (v) => (kth(v, 100) + kth(v, 101)) / 2;
const pctl = (v, p) => kth(v, Math.ceil((p / 100) * v.length));
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;

const SM = scores('iv-lesson-grid60', 60, 52, 13);
SM.trial = 50; SM.le = atMost(SM, SM.trial);
const distinct = [...new Set(SM)].sort((a, b) => a - b);
const ecdf = distinct.map((x) => [x, atMost(SM, x) / SM.length]);
const SMmed = (kth(SM, 30) + kth(SM, 31)) / 2, SM80 = pctl(SM, 80);
const BIG = scores('iv-lesson-grid200', 200, 56, 12);
BIG.sample = BIG.slice(0, 50); BIG.med = median200(BIG);
BIG.trials = [BIG.med - 3, BIG.med + 1].map((t) => Math.round(t)).map((t) => ({ t, k: atMost(BIG.sample, t) }));
BIG.est = BIG.trials[0].t + ((BIG.trials[1].t - BIG.trials[0].t) * (25 - BIG.trials[0].k)) / Math.max(1, BIG.trials[1].k - BIG.trials[0].k);
BIG.sd = 1 + 0.15 * Math.sqrt(BIG.reduce((a, x) => a + (x - mean(BIG)) ** 2, 0) / 200);
BIG.band = bestNorm(BIG.est, round(BIG.sd, 1));
const PR = { rows: 4, k: 34, t: 72 };
const ER = { p: 90 }; ER.rank = Math.ceil((ER.p / 100) * 200);
const SKEW = [...scores('iv-lesson-skew', 199, 40, 6), 99];

const rankQ = (rng) => {
  const p = rng.pick([10, 20, 25, 75, 80, 90]), r = Math.ceil((p / 100) * 200);
  return { type: 'number', q: `200 scores. The ${p}th percentile is defined as the smallest score with at least ${p}% of scores at or below it. It is the k-th smallest score. What is k?`, answer: r, hints: [`${p}% of 200.`], explain: `${p}% of 200 = ${r}: the ${r}th smallest${p > 50 ? `, which is the ${200 - r + 1}th largest` : ''}.` };
};
const scaleQ = (rng) => {
  const n = rng.pick([40, 50]), k = rng.int(Math.round(n * 0.2), Math.round(n * 0.8)), t = rng.int(40, 70);
  return { type: 'number', q: `In ${n / 10} rows (${n} of the 200 scores), ${k} are at or below ${t}. About how many of all 200 are at or below ${t}?`, answer: (k / n) * 200, tolerance: 1e-9, hints: [`${k} of ${n} is ${dec((k / n) * 100, 1)}%.`, 'Apply that fraction to 200.'], explain: `${k}/${n} × 200 = ${dec((k / n) * 200, 1)}.` };
};
const dirQ = (rng) => {
  const n = 50, t = rng.int(45, 65), k = rng.pick([15, 18, 20, 30, 32, 35]);
  const below = k < n / 2;
  return mc({ q: `Hunting the median: in ${n} sampled scores, ${k} are at or below your trial value ${t}. What next?`, right: below ? `Raise the trial value above ${t}` : `Lower the trial value below ${t}`, wrong: [
    [below ? `Lower the trial value below ${t}` : `Raise the trial value above ${t}`, `the wrong direction: ${k} of ${n} is ${below ? 'under' : 'over'} half`],
    [`Stop: the median is ${t}`, `the median needs about half (${n / 2}) at or below it`]], explain: `${k} of ${n} is ${dec((k / n) * 100, 0)}%, ${below ? 'short of' : 'more than'} 50%, so the median is ${below ? 'above' : 'below'} ${t}.` }, rng);
};
const meanSdQ = (rng) => { const s = rng.pick([10, 12, 15, 20]), n = rng.pick([25, 50, 100]); return { type: 'number', q: `Scores have SD ${s}. You average ${n} of them as an estimate of the mean of all 200. Roughly what is the SD of your estimate? (1 decimal place)`, answer: round(s / Math.sqrt(n), 1), tolerance: 0.051, hints: ['The SD of an average of n values is σ/√n.'], explain: `${s}/√${n} = ${dec(s / Math.sqrt(n), 2)}. (Sampling without replacement from 200 makes it a little smaller still.)` }; };
const bandQ = (rng) => {
  const est = rng.int(45, 70), sd = rng.pick([2, 3, 4]), b = bestNorm(est, sd);
  const opt = [Math.floor(b.lo), Math.ceil(b.hi)], narrow = [est - 1, est + 1], wide = [Math.round(est / 2), est * 2], low = [Math.round(est - 2.6 * sd), Math.round(est + 1.4 * sd)];
  const E = ([l, u]) => dec(eNorm(est, sd, l, u), 2);
  return { hinge: true, ...mc({ q: `Your sampled estimate of a median is ${est}, good to about ±${sd}. Which interval is best?`, right: `[${opt.join(', ')}]`, wrong: [
    [`[${narrow.join(', ')}]`, `treats a sampled estimate as nearly exact (expected ${E(narrow)})`],
    [`[${low.join(', ')}]`, `leans low: a lower band has a worse ratio (expected ${E(low)})`],
    [`[${wide.join(', ')}]`, `panic width (expected ${E(wide)})`]], explain: `About two SDs each side, a little more above: [${opt.join(', ')}], expected ${E(opt)}.` }, rng) };
};

export default {
  id: 'iv/percentile',
  book: 'iv',
  kind: 'family',
  family: 'percentile',
  title: 'Statistics from a grid of 200 values',
  summary: 'Never sort. Turn the statistic into a rank or a count, count against trial values in a few rows, scale to 200, adjust, and band to the sampling error.',
  prerequisites: ['iv/scoring-and-width', 'iv/dots-count', 'prob/estimation-clt'],
  objectives: [
    'Translate a median or percentile of 200 values into the rank you are hunting',
    'Estimate it by counting how many sampled values fall at or below a trial value, then adjusting',
    'Estimate a mean from sampled rows and a count above a threshold by row counts',
    'Size the band: a few points for medians and means, more for tails and counts',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'sort', label: 'Started sorting the scores', approach: 'Began writing the 200 scores in order.', breaksAt: 'Sorting takes minutes; a percentile is only a count of values at or below a number.' },
      { id: 'onerow', label: 'Used the middle of one row', approach: 'Took the middle value of one row of 10.', breaksAt: 'Ten values are far too few; sample four or five rows and scale up.' },
      { id: 'average', label: 'Averaged instead', approach: 'Averaged a few rows and called it the median.', breaksAt: 'Mean and median differ whenever the scores are skewed.' },
    ], q: 'Before any teaching: a grid shows 200 test scores, 20 rows of 10. "What is the median?" You have 60 seconds. Sorting 200 numbers is impossible. Find two other ways in.', answer: 'Pick a trial value, count how many of a few rows are at or below it, scale to 200, and move the trial value until about half fall below. Or average a few rows if the scores look symmetric.',
      explain: 'The median is the value with half the scores below it. You do not need the order of all 200, only a count against one number, and counting is fast.' },
    { type: 'text', text: 'The cue: a **grid of numbers** (200 scores) and one statistic: the median, a percentile (with its definition stated), how many scores are at or above a threshold, or the mean.' },
    { type: 'list', items: ['"What is the median of the 200 scores? (With an even count, the mean of the 100th and 101st smallest.)"', '"What is the 90th percentile, the smallest score with at least 90% at or below it?"', '"How many of the 200 scores are 75 or higher?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question belongs to this lesson?', right: 'A grid of 200 scores: the 25th percentile', wrong: [['A 10 × 10 grid of dots: how many are filled?', 'a count of items: iv/dots-count'], ['A chart of a noisy series: its value at t = 40', 'extrapolation: iv/series'], ['Two dice: expected value of the larger', 'theory, exact: iv/expected-dice']], explain: 'A statistic of many numbers shown in a grid.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'This item looks like drudgery and punishes the obvious plan: anyone who starts sorting runs out of time and scores 0. The counting method gets within a few points in under a minute, which is worth about 0.7 to 0.8. It is also the only item where knowing an exact definition (which rank is the percentile?) matters as much as arithmetic.' },

    sec('anchor'),
    { type: 'text', text: 'The median is the middle value once sorted. **One change**: instead of sorting, turn it around. For any trial value you can count how many scores are at or below it; the median is the value where that count reaches half. Counting against one number is what you did with dots, applied to a grid of numbers.' },
    { type: 'check', scope: 'rank from a definition', questions: [{ make: rankQ }] },

    sec('picture'),
    { type: 'diagram', diagram: 'valuegrid', spec: { cols: 10, values: SM, caption: `${SM.length} scores`, label: `A grid of ${SM.length} scores` }, caption: `${SM.length} scores in rows of 10. Pick a trial value, say ${SM.trial}, and count the scores at or below it row by row: ${SM.le} of ${SM.length}.` },
    { type: 'check', scope: 'counting against a trial value', questions: [
      { type: 'number', q: `In the grid above, how many of the ${SM.length} scores are at or below ${SM.trial}? Count row by row.`, answer: SM.le, hints: ['One row at a time: how many are 50 or less?', `Row one has ${atMost(SM.slice(0, 10), SM.trial)}.`], explain: `Rows: ${Array.from({ length: 6 }, (_, r) => atMost(SM.slice(10 * r, 10 * r + 10), SM.trial)).join(', ')}; total ${SM.le}, which is ${dec((SM.le / SM.length) * 100, 0)}%.` },
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: Math.min(...SM) - 1, max: Math.max(...SM) + 1, label: 'score' }, y: { min: 0, max: 1, label: 'fraction at or below' }, curves: [{ label: 'fraction ≤ score', points: ecdf }], hlines: [{ y: 0.5, label: 'half' }, { y: 0.8, label: '80%' }], markers: [{ x: SMmed, y: 0.5, label: `median ${SMmed}` }, { x: SM80, y: atMost(SM, SM80) / SM.length, label: `80th pct ${SM80}` }] }, caption: `The same ${SM.length} scores as a curve: for each score, the fraction at or below it. A percentile is read sideways: go across from the fraction you want to where the curve reaches it. Median ${SMmed}, 80th percentile ${SM80}.` },
    { type: 'check', scope: 'reading the curve', questions: [
      mc({ q: 'On the curve, where do you read the 80th percentile?', right: 'Go across at 0.8 to the curve, then down to the score', wrong: [['Go up from the score 80 to the curve', 'that gives the fraction at or below 80, not the 80th percentile'], ['Take 80% of the largest score', 'a percentile is a rank, not a fraction of the maximum'], ['Take the score in the 80th position of the grid', 'the grid is unsorted: positions mean nothing']], explain: 'A percentile answers "which score has 80% at or below it": start from the fraction.' }),
    ] },
    { type: 'text', text: 'With 200 scores you do not count them all. Count against the trial value in five full rows (50 scores), turn that into a fraction, and apply it to 200. Then try a second value on the other side of the target and interpolate between the two.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['trial value', 'at or below, in 50 sampled', 'scaled to 200'], rows: BIG.trials.map(({ t, k }) => [String(t), String(k), String(4 * k)]) }, caption: `Hunting the median of 200 scores from 5 sampled rows. The median needs 100 of 200 at or below, 25 of 50 in the sample: it lies between the two trials, near ${dec(BIG.est, 1)} by interpolation. (True median ${BIG.med}.)` },
    { type: 'check', scope: 'scaling a sample', questions: [{ make: scaleQ }] },

    sec('derivation'),
    { type: 'text', text: 'Five moves: name the target count, test a trial value on a sample, adjust, handle the mean separately, and band it. Only the fourth move is about the mean; the rest work for any median, percentile or threshold count.' },
    { type: 'steps', steps: [
      { answers: 'sort', say: 'Translate the statistic into a target. Median of 200: half at or below (100). p-th percentile: at least 2p at or below. "How many are ≥ t": a straight count.', why: 'Every order statistic is a question about how many values sit below a number.',
        checks: [{ make: rankQ }] },
      { answers: 'onerow', say: 'Choose a trial value near the middle of the grid\'s range and count how many sampled values are at or below it. Sample 4 or 5 full rows.', why: 'A fraction measured on 40 to 50 values is good to a few percent, and counting against one number needs no sorting.',
        checks: [{ make: scaleQ }] },
      { say: 'Adjust: too few at or below means the target is higher; too many means lower. Two or three trials and a straight-line interpolation pin it down.', why: 'The fraction below rises steadily with the trial value, so the target sits between a trial that is short and one that overshoots.',
        checks: [{ make: dirQ }] },
      { answers: 'average', say: 'For the mean, average several rows. Its error is the score SD divided by √(how many you averaged).', why: 'An average of n values has SD σ/√n: 50 values cut the spread by about 7.',
        checks: [{ make: meanSdQ }] },
      { say: 'Band: medians and means about ±2 to 3 points, extreme percentiles and counts wider (about 12% of a count). Two SDs each way, leaning high.', why: 'Tails hold few values, so each sampled row tells you less about them.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why does counting against a trial value replace sorting?', model: 'A percentile is defined by how many values lie at or below it. For any single number you can count that directly, without knowing the order of the others. So instead of sorting all 200, you test a few candidate numbers, see which side of the target each lands, and close in, and you can do the counting on a sample of rows and scale it up.', points: ['A percentile is the value where the count at or below reaches a target', 'Counting against one number needs no sorting', 'A sample of rows gives the fraction; scale it to 200'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'percentile', section: 'iv', difficulty: 3, seed: 'a', intro: 'A median, a mean or a count. Estimate it, then choose the band.' },
    { type: 'worked', family: 'percentile', section: 'iv', difficulty: 4, seed: 'b', fade: 1, intro: 'A percentile or a count in a possibly skewed grid. The method is given; the band is yours.' },
    { type: 'thinkaloud', problem: 'A grid of 200 scores. What is the median?', lines: [
      { t: 0, say: 'I see 200 numbers and "median": I will not sort. I need the value with 100 of 200, so 25 of 50, at or below it.' },
      { t: 5, say: `The numbers look centred in the 50s. I sample the first 5 rows and try ${BIG.trials[0].t}: ${BIG.trials[0].k} of 50 at or below.` },
      { t: 17, say: `${BIG.trials[0].k} is under 25, so the median is below ${BIG.trials[0].t}.`, slip: true },
      { t: 21, say: `No: too few at or below means the median is higher. I try ${BIG.trials[1].t}: ${BIG.trials[1].k} of 50.` },
      { t: 33, say: `25 sits between them: interpolating gives about ${dec(BIG.est, 1)}. Check: the values run from ${Math.min(...BIG)} to ${Math.max(...BIG)}, so that is plausible.` },
      { t: 42, say: `Median error about ±${dec(BIG.sd, 1)}: two SDs each way, leaning high: [${Math.floor(BIG.band.lo)}, ${Math.ceil(BIG.band.hi)}]. (True median ${BIG.med}.)` },
    ] },

    sec('predict'),
    { type: 'predict', question: `In ${PR.rows} rows (${PR.rows * 10} scores) you find ${PR.k} at or below ${PR.t}. Is the 90th percentile above or below ${PR.t}?`, answer: `${PR.k}/${PR.rows * 10} = ${dec((PR.k / (PR.rows * 10)) * 100, 0)}% at or below ${PR.t}, short of 90%, so the 90th percentile is above ${PR.t}.`, explain: 'Compare the fraction at or below the trial value with the percentile you want; move the trial value in the direction of the shortfall.' },

    sec('traps'),
    { type: 'traps', family: 'percentile', section: 'iv', extra: [
      { belief: 'Sort the grid first.', fix: 'Sorting 200 numbers takes minutes. Count against trial values instead.' },
      { belief: 'The 90th percentile of 200 is the 90th smallest score.', fix: 'It is the 180th smallest (90% of 200), which is the 21st largest.' },
      { belief: 'The mean and the median are the same.', fix: 'Only for symmetric data. A long upper tail pulls the mean above the median.' },
      { belief: 'One sampled row is enough.', fix: 'Ten values give a fraction good to about ±15%. Sample four or five rows.' },
    ] },
    { type: 'erroneous', problem: 'A candidate looks for the 90th percentile of 200 scores. One step is wrong.', steps: [
      'The definition: the smallest score with at least 90% of scores at or below it.',
      'So I need the 90th smallest score.',
      'I pick trial values and count how many are at or below each, in sampled rows.',
      'I adjust the trial value until the right count is reached, then band it.',
    ], errorStep: 1, explain: `90% of 200 is ${ER.rank}, so it is the ${ER.rank}th smallest score (the ${200 - ER.rank + 1}st largest). The 90th smallest is only the 45th percentile.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: `A grid of 200 scores has ${SKEW.length - 1} values between ${Math.min(...SKEW)} and ${Math.max(...SKEW.slice(0, -1))} and one score of 99. Which is larger?`, right: 'The mean', wrong: [['The median', 'one extreme value moves the mean, not the median'], ['They are equal', 'only for symmetric data']], explain: `The single 99 pulls the mean up; the median ignores how far the top value is. Here mean ${dec(mean(SKEW), 2)}, median ${median200(SKEW)}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'High percentiles are fastest from the top: the 90th percentile of 200 is the 21st largest, so scan for the top values and count down. Low percentiles, count up from the bottom. Only the median needs the middle.' },
    { type: 'callout', tone: 'speed', text: 'For "how many are ≥ t", count every row if the threshold is in the tail (few hits per row, quick). If it is near the middle, count 10 rows and double. Budget 40 seconds counting, 10 typing.' },
    { type: 'check', scope: 'counting from the top', questions: [
      { make: (rng) => { const p = rng.pick([80, 90, 95]), r = Math.ceil((p / 100) * 200); return { type: 'number', q: `200 scores. The ${p}th percentile (at least ${p}% at or below) is the k-th largest. What is k?`, answer: 200 - r + 1, hints: [`It is the ${r}th smallest.`, 'The k-th largest is the (201 − k)-th smallest.'], explain: `${r}th smallest = ${200 - r + 1}th largest.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Grid of 200 → translate to a count (median 100, p-th percentile 2p, or ≥ t) → count sampled rows against trial values → scale by 200/sample → adjust and interpolate → band ≈ two sampling errors, leaning high.' },

    sec('contrast'),
    { type: 'compare', columns: ['Asked for', 'Hunt for', 'Sample', 'Error'], rows: [
      ['median', '100 of 200 at or below', '4 to 5 rows, trial values', 'a few points'],
      ['90th percentile', `${ER.rank}th smallest = ${200 - ER.rank + 1}st largest`, 'scan the top values', 'wider: tails are sparse'],
      ['count ≥ t', 'a count', 'all rows if t is high', 'about 12%'],
      ['mean', 'the average', 'several row averages', 'SD ÷ √(values averaged)'],
    ] },
    { type: 'variation', base: 'Base: the median of 200 scores, found with trial values on 5 sampled rows.', rows: [
      { change: 'Median becomes 90th percentile', effect: 'Hunt the 21st largest from the top; fewer values nearby, so the band widens.' },
      { change: 'Median becomes mean', effect: 'Average rows instead of counting; for skewed data the answer moves toward the long tail.' },
      { change: 'Sample 2 rows instead of 5', effect: 'Same method, but the sampled fraction is noisier: widen the band.' },
      { same: true, change: 'The same 200 scores are shuffled to other positions', effect: 'No change: the median depends only on the values, not where they sit in the grid.' },
      { fusion: true, change: 'Median becomes 90th percentile AND you sample only 2 rows', effect: 'The two hurt together: the tail is sparse and a small sample catches few tail values, so the band must widen a lot. Better to scan all rows for the top values instead.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: integer scores tie a lot, so neighbouring percentiles can share a value and a median can be a half-integer (the mean of the 100th and 101st). A threshold count uses "or higher", so a score equal to t counts. A count below t is the complement: 200 minus the count at or above.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "count against a trial value and adjust" is binary search, and it finds any quantile of any data. The σ/√n error of a sampled mean is the CLT from the probability foundations.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'The 100th smallest of 200 scores is 57 and the 101st is 58. What is the median, by the stated definition?', right: '57.5', wrong: [['57', 'took only the 100th smallest'], ['58', 'took only the 101st smallest'], ['57 or 58, either is right', 'the definition fixes it: their mean']], explain: 'With an even count, the median is the mean of the two middle values: 57.5.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const k = rng.int(12, 38), t = rng.int(20, 40); return { type: 'number', q: `A grid of 200 delivery times. In 5 rows (50 times), ${k} are at most ${t} minutes. About how many of the 200 are at most ${t} minutes?`, answer: 4 * k, explain: `${k}/50 × 200 = ${4 * k}.` }; } },
      far: { type: 'number', q: 'Outside the assessment: a risk team wants the 5th percentile of 400 daily returns (the smallest return with at least 5% at or below it). It is the k-th smallest. What is k?', answer: Math.ceil(0.05 * 400), explain: `5% of 400 = ${Math.ceil(0.05 * 400)}: the ${Math.ceil(0.05 * 400)}th smallest return.` },
      principle: mc({ q: 'Which idea carried over from test scores to returns?', right: 'A percentile is a count at or below a value', wrong: [['A percentile is a fraction of the maximum', 'it is a rank, not a share of the top value'], ['Sort first, then read off the middle', 'counting against a value needs no sorting'], ['The mean and the median coincide', 'only for symmetric data']], explain: 'Both reduce to "which value has the target number of observations at or below it".' }) },

    sec('tryit'),
    { type: 'tryit', family: 'percentile', section: 'iv', count: 3 },
  ],
};
