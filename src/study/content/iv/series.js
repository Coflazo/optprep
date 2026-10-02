// Intervals: extrapolate a noisy time series (straight-line, constant-percentage growth, or
// line plus cycle). Average clusters, fit through the averages, extend to the target time,
// and widen with the distance beyond the data. The series is generated here from a fixed seed.
import { makeRng } from '../../../core/rng.js';
import { sec, dec, round, mc, ivq, bestNorm, eNorm, bestLog } from './scoring-and-width.js';

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const neg = (x) => String(x).replace(/^-/, '−');
// Straight-line series with noise.
const L = { T: 24, a: 30, b: 1.8, sigma: 4, tStar: 32 };
{ const rng = makeRng('iv-lesson-series'); L.pts = Array.from({ length: L.T }, (_, i) => [i + 1, round(L.a + L.b * (i + 1) + rng.normal(0, L.sigma), 2)]); }
L.truth = L.a + L.b * L.tStar;
L.first = L.pts.slice(0, 5); L.last = L.pts.slice(-5);
L.ta = avg(L.first.map((p) => p[0])); L.ya = avg(L.first.map((p) => p[1]));
L.tb = avg(L.last.map((p) => p[0])); L.yb = avg(L.last.map((p) => p[1]));
L.slope = (L.yb - L.ya) / (L.tb - L.ta); L.est = L.yb + L.slope * (L.tStar - L.tb);
L.naiveSlope = L.pts[L.T - 1][1] - L.pts[L.T - 2][1]; L.naive = L.pts[L.T - 1][1] + L.naiveSlope * (L.tStar - L.T);
L.sd = 2 * L.sigma * Math.sqrt(1 / L.T + (L.tStar - (L.T + 1) / 2) ** 2 / L.pts.reduce((s, [t]) => s + (t - (L.T + 1) / 2) ** 2, 0));
L.band = bestNorm(L.est, round(L.sd, 1));
const ys = L.pts.map((p) => p[1]).concat([L.est, L.truth]);
const Y = { min: Math.floor(Math.min(...ys) / 10) * 10, max: Math.ceil(Math.max(...ys) / 10) * 10 };
const tbar = (L.T + 1) / 2, Sxx = L.pts.reduce((s, [t]) => s + (t - tbar) ** 2, 0);
const seAt = (t) => Math.sqrt(1 / L.T + (t - tbar) ** 2 / Sxx);
const hs = Array.from({ length: 41 }, (_, i) => i);
const E = { a: 20, g: 1.05 }; E.double = Math.log(2) / Math.log(E.g);

const slopeQ = (rng) => { const ta = rng.int(2, 4), tb = rng.int(18, 26), ya = rng.int(20, 60), d = rng.pick([12, 18, 24, 30, -15]); const s = d / (tb - ta); return { type: 'number', q: `The first cluster of points averages ${ya} around t = ${ta}; the last averages ${ya + d} around t = ${tb}. What is the slope per step? (2 decimal places)`, answer: round(s, 2), tolerance: 0.006, hints: ['Rise over run between the two cluster centres.', `(${ya + d} − ${ya}) ÷ (${tb} − ${ta}).`], explain: `${neg(d)} ÷ ${tb - ta} = ${neg(dec(s, 3))} per step.` }; };
const extQ = (rng) => { const tb = rng.int(20, 26), yb = rng.int(40, 90), s = rng.pick([0.8, 1.2, 1.5, 2, -0.6]), ts = tb + rng.int(6, 12); const v = yb + s * (ts - tb); return { type: 'number', q: `Your trend passes through ${yb} at t = ${tb} with slope ${s} per step. What is the trend value at t = ${ts}?`, answer: round(v, 4), tolerance: 1e-6, explain: `${yb} + (${neg(s)}) × ${ts - tb} = ${dec(v, 2)}.` }; };
const growQ = (rng) => { const r = rng.pick([2, 3, 4, 5, 6]), d = Math.log(2) / Math.log(1 + r / 100); return { hinge: true, ...mc({ q: `A series grows by a constant percentage and doubles about every ${dec(70 / r, 1)} steps. About what is the growth per step?`, right: `${r}%`, wrong: [[`${round(100 / (70 / r), 1)}%`, 'spread the doubling (100%) evenly over the steps: that ignores compounding'], [`${round(70 / r / 10, 1)}%`, 'divided the doubling time by 10 instead of dividing 70 by it'], [`${2 * r}%`, 'doubled the rate because the series doubles']], explain: `Rule of 70: growth ≈ 70 ÷ doubling time = 70 ÷ ${dec(70 / r, 1)} ≈ ${r}% (exact doubling time at ${r}%: ${dec(d, 1)} steps).` }, rng) }; };
const phaseQ = (rng) => { const P = 12, k = rng.pick([0, 1, 2, 3]), t = P * rng.int(2, 4) + (k * P) / 4; const val = [0, 1, 0, -1][k]; return mc({ q: `A cycle A·sin(2πt/${P}) with A = 10. What does the cycle add at t = ${t}?`, right: String(10 * val), wrong: [['10', 'assumed the cycle is always at its peak'], ['−10', 'assumed the cycle is always at its trough'], ['0', 'ignored the cycle'], ['5', 'took half the amplitude']].filter(([v]) => v !== String(10 * val)), explain: `t = ${t} is ${k}/4 of the way through a cycle of ${P} (after ${Math.floor(t / P)} full cycles): sin = ${val}, so ${10 * val}.` }, rng); };
const bandQ = (rng) => {
  const est = rng.int(60, 120), sd = rng.pick([2, 3, 5]), b = bestNorm(est, sd);
  const opt = [Math.floor(b.lo), Math.ceil(b.hi)], narrow = [est - 1, est + 1], low = [Math.round(est - 2.6 * sd), Math.round(est + 1.4 * sd)], wide = [Math.round(est * 0.6), Math.round(est * 1.4)];
  const Ex = ([l, u]) => dec(eNorm(est, sd, l, u), 2);
  return { hinge: true, ...mc({ q: `Your extrapolated trend value is ${est}, with an error of about ±${sd} (one SD) at this distance. Which interval is best?`, right: `[${opt.join(', ')}]`, wrong: [
    [`[${narrow.join(', ')}]`, `too narrow: extrapolation error is real (expected ${Ex(narrow)})`],
    [`[${low.join(', ')}]`, `leans low: a lower band has a worse ratio (expected ${Ex(low)})`],
    [`[${wide.join(', ')}]`, `±40% for a ±${sd} error (expected ${Ex(wide)})`]], explain: `Two SDs each way, a little more above: [${opt.join(', ')}], expected ${Ex(opt)}.` }, rng) };
};

export default {
  id: 'iv/series',
  book: 'iv',
  kind: 'family',
  family: 'series',
  title: 'Extrapolate a noisy time series',
  summary: 'Average a cluster at each end, draw the trend through the two averages, extend it to the target time (by ratios for growth, plus the cycle phase for seasonal data), and widen with the distance beyond the data.',
  prerequisites: ['iv/scoring-and-width', 'iv/estimation-tricks'],
  objectives: [
    'Fit a trend by eye from two cluster averages instead of single noisy points',
    'Extrapolate a straight-line trend, a constant-percentage trend (via the doubling time) and a trend plus cycle',
    'Widen the band the further the target lies beyond the data',
    'Explain why the last two points are the worst possible guide to the slope',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'lastpoint', label: 'Started from the last point', approach: `Took the final observation, ${L.pts[L.T - 1][1]}, as the current level.`, breaksAt: 'A single point carries the full noise; average the last cluster instead.' },
      { id: 'lasttwo', label: 'Slope from the last two points', approach: `Used the last step, ${L.pts[L.T - 2][1]} → ${L.pts[L.T - 1][1]}, as the slope.`, breaksAt: 'One step is mostly noise, and it is multiplied by every step you extend.' },
      { id: 'samewidth', label: 'Kept the usual band', approach: 'Typed the same ±5% band as for any estimate.', breaksAt: 'Slope errors grow with the distance beyond the data, so the band must too.' },
    ], q: `Before any teaching: a chart shows ${L.T} noisy observations rising roughly in a straight line; the last two are ${L.pts[L.T - 2][1]} and ${L.pts[L.T - 1][1]}. You are asked for the noise-free trend value at t = ${L.tStar}. How do you find the slope? Two approaches, then an estimate.`, answer: `Average the first 5 and the last 5 points: slope ${dec(L.slope, 2)}, trend at t = ${L.tStar} about ${dec(L.est, 1)} (true value ${dec(L.truth, 1)}).`,
      explain: `The last two points give a slope of ${dec(L.naiveSlope, 2)} and an estimate of ${dec(L.naive, 1)}: one point's noise, multiplied by ${L.tStar - L.T} steps. Averages cancel noise; single points amplify it.` },
    { type: 'text', text: 'The cue: a **chart of a noisy series**, a sentence saying how it was generated (a straight-line trend, a constant-percentage growth, or a line plus a repeating cycle, each with random noise), and a request for the **noise-free** value at a time beyond the data.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'The question asks for "the noise-free trend value at t = 36". What are you estimating?', right: 'The value of the underlying trend line at t = 36', wrong: [['The next noisy observation after the data', 'the question removes the noise'], ['The last observed value', 'that is at the end of the data, not at t = 36'], ['The average of all observed values', 'that is the trend at the middle of the data']], explain: 'The generating model without its noise, evaluated at the target time.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Series items are deliberately noisy, and the trap is to chase the noise: the last point, or the last two, look like the freshest information but carry the most error per unit of slope. A calm two-cluster fit gets within a few percent, and the band grows in a known way with how far you extrapolate. The generating model is always stated in words, so you never guess the shape: you only estimate its numbers.' },

    sec('anchor'),
    { type: 'text', text: 'You know how to draw a line through two points and read off its value anywhere: slope = rise ÷ run, then value = start + slope × distance. **One change**: the two "points" are averages of clusters of noisy observations, and you read the line beyond the data, where small slope errors grow.' },
    { type: 'check', scope: 'a line through two points', questions: [{ make: extQ }] },

    sec('picture'),
    { type: 'diagram', diagram: 'series', spec: { points: L.pts, target: L.tStar, xLabel: 't', yLabel: 'value', label: `A noisy series observed at t = 1 to ${L.T}` }, caption: `${L.T} noisy observations of a straight-line trend. The dashed line marks the target t = ${L.tStar}, ${L.tStar - L.T} steps beyond the data.` },
    { type: 'check', scope: 'cluster averages', questions: [
      { type: 'number', q: `The first five points of the chart are ${L.first.map((p) => p[1]).join(', ')}. What is their average? (1 decimal place)`, answer: round(L.ya, 1), tolerance: 0.051, explain: `Sum ${dec(L.first.reduce((a, p) => a + p[1], 0), 2)} ÷ 5 = ${dec(L.ya, 2)}, centred at t = ${L.ta}.` },
    ] },
    { type: 'text', text: 'Now fit the trend. Take the first five and the last five points, find each cluster\'s average and its centre time, and join the two averages with a straight line. Extend that line to the target time: that is your estimate.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: L.tStar + 2, label: 't' }, y: { min: Y.min, max: Y.max, label: 'value' }, curves: [{ label: 'data', points: L.pts }, { label: 'trend through the two averages', points: [[L.ta, L.ya], [L.tStar, L.est]] }], markers: [{ x: L.ta, y: L.ya, label: `first 5: ${dec(L.ya, 1)}` }, { x: L.tb, y: L.yb, label: `last 5: ${dec(L.yb, 1)}` }, { x: L.tStar, y: L.est, label: `t = ${L.tStar}: ${dec(L.est, 1)}` }] }, caption: `Average the first five points (t ≈ ${L.ta}) and the last five (t ≈ ${L.tb}), join them, and extend: slope ${dec(L.slope, 2)}, estimate ${dec(L.est, 1)} at t = ${L.tStar} (true trend ${dec(L.truth, 1)}).` },
    { type: 'check', scope: 'slope from two clusters', questions: [{ make: slopeQ }] },
    { type: 'text', text: 'How wide should the band be? A small error in the slope does little harm near the data and more and more harm as you extend the line. The curve below shows how the uncertainty of a fitted trend grows with the target time.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 40, label: `t (data run from 1 to ${L.T})` }, y: { min: 0, max: 1.2, label: 'relative error of the fitted trend' }, curves: [{ label: 'error multiplier', points: hs.map((t) => [t, seAt(t)]) }], vlines: [{ x: L.T, label: 'end of data' }] }, caption: `How the trend's error grows with the target time, for ${L.T} observations: smallest in the middle of the data, and rising steadily beyond it (${dec(seAt(L.T + 6) / seAt(L.T), 2)} times the end-of-data error 6 steps out, ${dec(seAt(L.T + 12) / seAt(L.T), 2)} times 12 steps out). A slope error is multiplied by the distance.` },
    { type: 'check', scope: 'error grows with distance', questions: [
      mc({ q: 'The same data, two targets: 4 steps and 14 steps beyond the last observation. How should the bands compare?', right: 'The 14-step band should be wider', wrong: [['The same width: the data did not change', 'the slope error is multiplied by the distance'], ['The 4-step band should be wider', 'nearer the data the fit is better, not worse'], ['Both zero width: the model is stated', 'the model is stated, its parameters are not']], explain: 'Any error in the slope grows in proportion to how far you extend the line.' }),
    ] },

    sec('derivation'),
    { type: 'text', text: 'Six moves. The first three handle a straight line; the fourth and fifth adapt them to growth and to cycles; the last sets the band.' },
    { type: 'steps', steps: [
      { answers: 'lastpoint', say: 'Average a cluster of about 5 points at the start and 5 at the end. Note the centre time of each cluster.', why: 'Averaging k points cuts the noise by √k; far-apart clusters pin the slope.',
        checks: [{ make: (rng) => { const k = rng.pick([4, 5, 9]), s = rng.pick([3, 4, 6]); return { type: 'number', q: `Each point has noise SD ${s}. What is the noise SD of an average of ${k} points? (2 decimal places)`, answer: round(s / Math.sqrt(k), 2), tolerance: 0.006, explain: `${s}/√${k} = ${dec(s / Math.sqrt(k), 3)}.` }; } }] },
      { answers: 'lasttwo', say: 'Slope = (end average − start average) ÷ (end centre − start centre).', why: 'Rise over run between the two cluster centres.',
        checks: [{ make: slopeQ }] },
      { say: 'Straight-line trend: value at t* = end average + slope × (t* − end centre).', why: 'Walk along the line from the last cluster to the target.',
        checks: [{ make: extQ }] },
      { say: 'Constant-percentage growth: find how many steps the series takes to double; growth per step ≈ 70 ÷ that; extend by multiplying, not adding.', why: 'Percentage growth is a straight line on a log scale; adding a fixed amount undershoots it.',
        checks: [{ make: growQ }] },
      { say: 'Line plus cycle: average over one full cycle at each end to get the trend (the cycle cancels), then add the cycle\'s value at t*.', why: 'A full cycle averages to zero; the phase of t* in the cycle decides what to add.',
        checks: [{ make: phaseQ }] },
      { answers: 'samewidth', say: 'Band: about two of your errors each way, leaning high, and wider the further t* is beyond the data.', why: 'The trend error grows with the distance; the error is in units, so lean high.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why are the last two points the worst guide to the slope, even though they are the most recent?', model: 'The slope from two neighbouring points is their difference divided by 1, so it carries the full noise of two single observations, and that noise is then multiplied by every step you extrapolate. Two cluster averages far apart divide the noise by √(cluster size) and by the long distance between them, so the slope is many times more accurate.', points: ['Neighbouring points: full noise divided by a run of 1', 'Cluster averages cut noise by √k', 'A long run between clusters shrinks the slope error further'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'series', section: 'iv', difficulty: 3, seed: 'a', intro: 'A straight-line trend with noise. Fit it from two clusters, extend it, then band it.' },
    { type: 'worked', family: 'series', section: 'iv', difficulty: 4, seed: 'b', fade: 1, intro: 'Constant-percentage growth. The trend is given; choosing the band is yours.' },
    { type: 'thinkaloud', problem: `The straight-line series from the picture section: estimate the noise-free trend at t = ${L.tStar}.`, lines: [
      { t: 0, say: 'I see a noisy line and "noise-free trend": I fit the trend, then extend it.' },
      { t: 4, say: `The last two points jump from ${L.pts[L.T - 2][1]} to ${L.pts[L.T - 1][1]}: a slope of ${dec(L.naiveSlope, 1)} a step.`, slip: true },
      { t: 8, say: `No: one step is mostly noise, and ${L.tStar - L.T} steps would multiply it. I use two cluster averages.` },
      { t: 12, say: `First five average about ${dec(L.ya, 1)} at t = ${L.ta}; last five about ${dec(L.yb, 1)} at t = ${L.tb}. Slope ${dec(L.slope, 2)}.` },
      { t: 24, say: `Extend ${L.tStar - L.tb} steps: ${dec(L.yb, 1)} + ${dec(L.slope, 2)} × ${L.tStar - L.tb} ≈ ${dec(L.est, 1)}. Check: it keeps the data's pace. Fine.` },
      { t: 34, say: `${L.tStar - L.T} steps beyond the data, error about ±${dec(L.sd, 1)}: I type [${Math.floor(L.band.lo)}, ${Math.ceil(L.band.hi)}]. (True trend ${dec(L.truth, 1)}.)` },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Data from t = 1 to 30 average 40 near t = 3 and 70 near t = 28. What is the trend at t = 40?', answer: `Slope 30 ÷ 25 = ${dec(30 / 25, 2)} per step, so 70 + ${40 - 28} × ${dec(30 / 25, 2)} = ${dec(70 + 12 * (30 / 25), 1)}.`, explain: 'Walk from the nearer cluster: the last one.' },

    sec('traps'),
    { type: 'traps', family: 'series', section: 'iv', extra: [
      { belief: 'The last point is the best estimate of the current level.', fix: 'It carries the full noise. Average the last cluster.' },
      { belief: 'The slope comes from the last two points.', fix: 'Their noise, divided by a run of 1, is multiplied by every extrapolated step.' },
      { belief: 'Percentage growth can be extended with a straight line.', fix: 'That undershoots: extend by multiplying (doubling time), not adding.' },
      { belief: 'The band is the same however far you extrapolate.', fix: 'Slope error grows with distance: widen further out.' },
    ] },
    { type: 'erroneous', problem: `A candidate extrapolates the picture-section series to t = ${L.tStar}. One step is wrong.`, steps: [
      `The last five points average ${dec(L.yb, 1)}, centred at t = ${L.tb}.`,
      `The slope is the last step: ${L.pts[L.T - 1][1]} − ${L.pts[L.T - 2][1]} = ${dec(L.naiveSlope, 2)} per step.`,
      `At t = ${L.tStar}: ${dec(L.yb, 1)} + ${dec(L.naiveSlope, 2)} × ${L.tStar - L.tb} = ${dec(L.yb + L.naiveSlope * (L.tStar - L.tb), 1)}.`,
      'Type a band of about ±5% around it.',
    ], errorStep: 1, explain: `One step of a noisy series measures mostly noise. Two cluster averages give a slope of ${dec(L.slope, 2)} and ${dec(L.est, 1)} at t = ${L.tStar}; the true trend is ${dec(L.truth, 1)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A series grows about 5% per step. From 100 at t = 20, a candidate extends 10 steps by adding 5 per step and types about 150. Which belief?', right: 'Growth extends in a straight line', wrong: [['The last point is the level', 'the level 100 is fine here'], ['The band is the same at any distance', 'this is about the centre, not the band']], explain: `Compounding: 100 × 1.05^{10} = ${dec(100 * 1.05 ** 10, 1)}, not 150.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Read cluster averages off the chart by eye: the middle of a band of five points is good enough. Rule of 70 for growth: doubling time × growth% ≈ 70. For cycles, first find where t* sits: at a whole number of cycles the cycle adds nothing.' },
    { type: 'callout', tone: 'speed', text: 'Budget: 25 seconds to read two clusters, 15 to extend, 10 to type. A band about ±5% of the value is a safe default when you have no time to think about the error; widen it further as the target moves further beyond the data.' },
    { type: 'check', scope: 'growth by doubling', questions: [
      { make: (rng) => { const a = rng.pick([10, 20, 40]), d = rng.pick([7, 10, 14]), k = rng.pick([1, 2, 3]); return { type: 'number', q: `A trend is ${a} now and doubles every ${d} steps. What is it ${k * d} steps later?`, answer: a * 2 ** k, explain: `${k * d} steps is ${k} doublings: ${a} × 2^{${k}} = ${a * 2 ** k}.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Noisy series → average a cluster at each end → slope between the cluster centres → extend (add for a line, multiply for growth, add the cycle phase for seasonal) → band two errors wide, wider the further out, leaning high.' },

    sec('contrast'),
    { type: 'compare', columns: ['Model', 'Fit', 'Extend', 'Trap'], rows: [
      ['straight line + noise', 'two cluster averages', 'add slope × distance', 'last-two-points slope'],
      ['constant % growth', 'doubling time (rule of 70)', 'multiply', 'straight-line extension undershoots'],
      ['line + cycle + noise', 'average one full cycle at each end', 'trend + cycle at t*', 'forgetting the phase'],
    ] },
    { type: 'variation', base: `Base: the straight-line series above, extended ${L.tStar - L.T} steps beyond the data.`, rows: [
      { change: `The target moves from ${L.tStar - L.T} to ${2 * (L.tStar - L.T)} steps beyond the data`, effect: `The centre moves along the same line; the error grows (about ×${dec(seAt(L.T + 2 * (L.tStar - L.T)) / seAt(L.tStar), 2)}), so the band widens.` },
      { change: 'The noise doubles', effect: 'Cluster averages get noisier, so the slope is less certain: widen the band in proportion.' },
      { change: 'The trend grows by a constant percentage instead', effect: 'Extend by multiplying (doubling time), and use a percent band.' },
      { same: true, change: 'The chart\'s vertical axis is zoomed in', effect: 'No change: the same numbers, the same fit, the same answer. Only the picture looks steeper.' },
      { fusion: true, change: 'The target moves twice as far out AND the noise doubles', effect: `The errors multiply: twice the noise, and about ×${dec(seAt(L.T + 2 * (L.tStar - L.T)) / seAt(L.tStar), 2)} for the distance, so the band is roughly ${dec(2 * seAt(L.T + 2 * (L.tStar - L.T)) / seAt(L.tStar), 1)} times as wide.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a target inside the data range is interpolation, the easiest case, with the smallest error. A falling trend can cross zero: an Intervals truth is always positive, so check the direction of the slope. A target at a whole number of cycles adds nothing from the cycle.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: averaging to beat noise is the √n rule from the CLT, doubling times are the rule of 72 from compound growth, and "error grows with the distance beyond the data" is why forecasts widen with the horizon.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [{ make: phaseQ }] },
    { type: 'transfer',
      near: { make: (rng) => { const ya = rng.int(30, 60), yb = ya + rng.int(10, 30), ta = 3, tb = 22, ts = tb + rng.int(6, 12); const s = (yb - ya) / (tb - ta), v = yb + s * (ts - tb); return { type: 'number', q: `Monthly sales are noisy. The first five months average ${ya} (centred at month ${ta}); the last five average ${yb} (centred at month ${tb}). Trend value at month ${ts}? (1 decimal place)`, answer: round(v, 1), tolerance: 0.051, explain: `Slope ${yb - ya} ÷ ${tb - ta} = ${dec(s, 3)}; ${yb} + ${dec(s, 3)} × ${ts - tb} = ${dec(v, 2)}.` }; } },
      far: { type: 'number', q: 'Outside the assessment: a stock traded 2.0 million shares a day on average in January and 2.6 million in June, five months later. If the trend continues, what in September? (2 decimal places, millions)', answer: round(2.6 + ((2.6 - 2.0) / 5) * 3, 2), tolerance: 0.006, explain: `Slope 0.6 ÷ 5 = 0.12 a month; 2.6 + 0.12 × 3 = ${dec(2.6 + 0.12 * 3, 2)} million.` },
      principle: mc({ q: 'Which idea carried over from the chart to the trading volume?', right: 'Fit through averages, not single points', wrong: [['Extend the last step of the data', 'the single last step is mostly noise'], ['Use the mean of all the data', 'that is the level in the middle, not at the target'], ['Keep the same width at any distance', 'errors grow with the distance']], explain: 'Both used two averaged levels far apart to fix the slope, then walked along it.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'series', section: 'iv', count: 3 },
  ],
};
