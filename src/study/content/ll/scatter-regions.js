// Likelihood List family: scatter plots. Each point is one equally likely outcome; a statement is a
// region (strip, band, corner, half-plane). Four quadrant counts answer strip, band, corner and the
// conditional "among points with x above a". Points come from a seeded rng, so they never change.
import { makeRng } from '../../../core/rng.js';
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

// 30 points with an upward trend, off the integer gridlines and off the diagonal.
const PTS = (() => {
  const rng = makeRng('ll-study-scatter'); const out = [];
  while (out.length < 30) {
    const x = Math.round(rng.float(0.3, 9.7) * 10) / 10, y = Math.round((1.2 + 0.7 * x + rng.normal(0, 1.5)) * 10) / 10;
    if (y < 0.3 || y > 9.7 || Number.isInteger(x) || Number.isInteger(y) || x === y) continue;
    out.push([x, y]);
  }
  return out;
})();
const N = PTS.length;
const cnt = (f, pts = PTS) => pts.filter(f).length;
const XA = 5, YB = 6;
const strip = cnt(([x]) => x > XA), band = cnt(([, y]) => y > YB), corner = cnt(([x, y]) => x > XA && y > YB), above = cnt(([x, y]) => y > x);
const Q = { tl: cnt(([x, y]) => x < XA && y > YB), tr: corner, bl: cnt(([x, y]) => x < XA && y < YB), br: cnt(([x, y]) => x > XA && y < YB) };
const CH = [['(a)', band / N, `${band}/${N}`], ['(b)', corner / N, `${corner}/${N}`], ['(c)', corner / strip, `${corner}/${strip}`]];
const CHO = [...CH].sort((a, b) => b[1] - a[1]);

// Quadrant counts for the reasoning checks: n points, strip s, band b, corner c.
const quad = (rng) => { const n = rng.int(24, 40), s = rng.int(8, n - 8), b = rng.int(8, n - 8), c = rng.int(Math.max(2, s + b - n + 1), Math.min(s, b) - 1); return { n, s, b, c, a: rng.int(3, 7), v: rng.int(3, 7) }; };
const sayQ = (q) => `${q.n} points: ${q.s} have x above ${q.a}, ${q.b} have y above ${q.v}, and ${q.c} have both.`;

export default {
  id: 'll/scatter-regions',
  book: 'll',
  kind: 'family',
  family: 'scatter-regions',
  title: 'Scatter plots',
  summary: 'Each point is one outcome: count points in the region over points in scope; a corner sits inside its strip.',
  prerequisites: ['ll/conjunction', 'll/histogram-bins'],
  objectives: [
    'Turn each statement into a region: a strip, a band, a corner or a half-plane',
    'Get strip, band and corner counts from four quadrant counts',
    'Use the strip as the denominator of "among points with x above a"',
    'Predict how an upward trend moves a conditional against the plain fraction',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${N} trading days are plotted (x = signal strength, y = next-day return, both 0 to 10). ${strip} points have x above 5, ${band} have y above 6, ${corner} have both. Rank: (a) a random day has y above 6, (b) x above 5 and y above 6, (c) among days with x above 5, a random one has y above 6.`, answer: CHO.map((c) => `${c[0]} ${c[2]}`).join(' > '), explain: `(b) is a corner inside the band of (a), so (a) ≥ (b) with no counting. (c) uses the same ${corner} corner points but picks only from the ${strip} points in the strip x > 5: ${dp(corner / strip, 2)}. With an upward trend, high x comes with high y, so (c) climbs.` },
    { type: 'text', text: 'The prompt is a **scatter plot**: each point is one item (a day, a student, a stock) with an x and a y value. One point is picked at random, or from the points meeting a condition. Statements name regions: x above a (a vertical strip), y above b (a horizontal band), both (a corner), or above the dashed line y = x. Gridlines sit at whole numbers and no point sits on one.' },
    { type: 'text', text: 'Not this lesson: a histogram (one variable, bars of counts) or density curves (areas). Here you count dots.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, '"x above 4 and y above 7" is which region of a scatter plot?', 'the top-right corner beyond x = 4 and y = 7', [['the vertical strip right of x = 4', 'that is "x above 4" alone: the y condition is dropped'], ['the band above y = 7', 'that is "y above 7" alone: the x condition is dropped'], ['everything right of x = 4 or above y = 7', 'that is the OR region, not AND']], 'AND keeps only the points meeting both: a corner.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Scatter plots are a reported Likelihood List scenario. The counting is easy; the design of the item is not. It pairs a corner with its strip (containment decides that pair for free) and a conditional with a trend (the conditional moves away from the plain fraction in the direction of the trend). Knowing both saves most of the counting, and the counting that is left is four quadrant counts, not one pass per statement.' },

    S('anchor'),
    { type: 'text', text: 'You know the 2 × 2 table: four cells, AND inside each single trait, conditionals over a row. A scatter plot with one vertical and one horizontal line is **the same table**: the lines cut the plane into four quadrants, and each quadrant count is a cell. The one change: you count dots to fill the cells. After that, everything from the table lesson carries over unchanged: the corner is the lens, the strip is a row total, the band is a column total, and a conditional is a cell over its row.' },
    { type: 'check', scope: 'quadrants as the four cells', questions: [
      { make: (rng) => { const q = quad(rng); return { type: 'number', q: `${sayQ(q)} How many points have x above ${q.a} but y not above ${q.v}?`, answer: q.s - q.c, hints: ['The strip splits into the corner and the rest of the strip.'], explain: `${q.s} − ${q.c} = ${q.s - q.c}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'The challenge plot with the two lines x = 5 and y = 6 drawn in. Each statement is a region cut out by the lines.' },
    { type: 'diagram', diagram: 'scatter', spec: { xLabel: 'x: signal strength', yLabel: 'y: next-day return', points: PTS, xDomain: [0, 10], yDomain: [0, 10], lines: [{ x: XA, label: 'x = 5' }, { y: YB, label: 'y = 6' }] }, caption: `${N} points. Right of x = 5: ${strip}. Above y = 6: ${band}. Both (top-right corner): ${corner}. The cloud slopes upward.` },
    { type: 'check', scope: 'counting a strip', questions: [
      { make: (rng) => { const a = rng.int(2, 8); const k = cnt(([x]) => x > a); return { type: 'number', q: `From the plot: how many points have x above ${a}?`, answer: k, hints: [`Count the dots right of the gridline x = ${a}.`], explain: `${k} points.` }; } },
    ] },
    { type: 'text', text: 'Collapse the plot into four counts, one per quadrant. Every region statement is then a sum of cells.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 2, cols: 2, rowLabels: ['y > 6', 'y < 6'], colLabels: ['x < 5', 'x > 5'], rowTitle: 'y', colTitle: 'x', cellText: [[Q.tl, Q.tr], [Q.bl, Q.br]], highlight: [[0, 1]], count: 1 }, caption: `The corner (highlighted) holds ${Q.tr}. The strip x > 5 is the right column: ${Q.tr} + ${Q.br} = ${strip}. The band y > 6 is the top row: ${Q.tl} + ${Q.tr} = ${band}.` },
    { type: 'check', scope: 'strip, band, corner from quadrants', questions: [
      { make: (rng) => { const c = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)]; return { type: 'number', q: `Quadrant counts: top-left ${c[0]}, top-right ${c[1]}, bottom-left ${c[2]}, bottom-right ${c[3]}. Among points on the right (x above the line), P(top)? (2 decimals)`, answer: c[1] / (c[1] + c[3]), tolerance: 0.006, hints: ['The scope is the right column.', 'Top-right over the right column total.'], explain: `${c[1]}/(${c[1]} + ${c[3]}) = ${dp(c[1] / (c[1] + c[3]), 2)}.` }; } },
    ] },
    { type: 'text', text: 'The diagonal statement "above the line y = x" is a half-plane: count the dots whose y beats their x. It cuts across the quadrants, so it is the one statement the four counts do not answer.' },
    { type: 'diagram', diagram: 'scatter', spec: { xLabel: 'x', yLabel: 'y', points: PTS, xDomain: [0, 10], yDomain: [0, 10], lines: [{ slope: 1, intercept: 0, label: 'y = x' }] }, caption: `${above} of the ${N} points lie above y = x. With this trend (y ≈ 1.2 + 0.7x), low-x points sit above the line and high-x points below it.` },
    { type: 'check', scope: 'above or below the diagonal', questions: [
      { make: (rng) => { const [x, y] = rng.pick(PTS); const up = y > x; return mc(rng, `A point sits at x = ${x}, y = ${y}. Is it above the line y = x?`, up ? 'Yes' : 'No', [[up ? 'No' : 'Yes', 'compared the point with the wrong axis: above y = x means y is larger than x']], `${y} ${up ? '>' : '<'} ${x}.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves. Two of them avoid counting altogether; the other two make sure the counts you do take go over the right total.' },
    { type: 'steps', steps: [
      { say: 'Draw each statement as a region: strip (x above a), band (y above b), corner (both), half-plane (above y = x).', why: 'Once regions are drawn, containment is visible: the corner lies inside both the strip and the band.',
        checks: [mc(null, 'Which region is contained in the strip "x above 5"?', 'x above 5 and y above 6', [['y above 6', 'the band sticks out to the left of x = 5'], ['above the line y = x', 'the half-plane crosses both sides of x = 5'], ['x above 4', 'reversed: that strip contains "x above 5"']], 'The corner keeps only strip points.', { at: 0 })] },
      { say: 'Probability = points in the region / points in scope. "A random point" means scope = all points.', why: 'Each point is one equally likely outcome.',
        checks: [{ make: (rng) => { const b = rng.int(2, 8); const k = cnt(([, y]) => y > b); return { type: 'number', q: `From the plot: P(a random point has y above ${b})? (2 decimals)`, answer: k / N, tolerance: 0.006, hints: [`Count dots above y = ${b}.`, `Divide by ${N}.`], explain: `${k}/${N} = ${dp(k / N, 2)}.` }; } }] },
      { say: 'Corner ⊂ strip and corner ⊂ band: P(corner) is at most both, with no counting.', why: 'Adding a condition removes points; the scope is the same.',
        checks: [{ make: (rng) => again(() => { const q = quad(rng); return rank(rng, `${sayQ(q)} Rank for a random point, most to least likely.`, [[`x above ${q.a}.`, q.s / q.n], [`y above ${q.v}.`, q.b / q.n], [`x above ${q.a} and y above ${q.v}.`, q.c / q.n]], `The corner (${q.c}) is inside both; strip ${q.s} against band ${q.b} is a plain count.`); }) }] },
      { say: '"Among points with x above a": the strip is the scope. P = corner / strip.', why: 'The pick is made inside the strip, so its count replaces the total.',
        checks: [{ make: (rng) => { const q = quad(rng); return { type: 'number', q: `${sayQ(q)} Among points with x above ${q.a}, P(y above ${q.v})? (2 decimals)`, answer: q.c / q.s, tolerance: 0.006, hints: ['Scope: the strip.', 'Corner over strip.'], explain: `${q.c}/${q.s} = ${dp(q.c / q.s, 2)}.` }; } }] },
      { say: 'Trend check: with an upward trend, points in a high-x strip have high y, so P(y above b | x above a) > P(y above b). A downward trend flips it.', why: 'Conditioning on high x selects the part of the cloud where y is high.',
        checks: [{ hinge: true, make: (rng) => { const up = rng.chance(0.5); return mc(rng, `A scatter plot shows a clear ${up ? 'upward' : 'downward'} trend. Compared with P(y above 6), P(y above 6 | x above 7) is:`, up ? 'larger' : 'smaller', [[up ? 'smaller' : 'larger', 'read the trend backwards: follow the cloud to the right'], ['the same', 'treated x and y as unrelated despite the visible trend'], ['always 1', 'confused "most points" with "all points"']], up ? 'High x comes with high y, so the strip is rich in high-y points.' : 'High x comes with low y, so the strip is poor in high-y points.'); } }] },
    ] },
    { type: 'explain', prompt: 'Explain why "x above 5 and y above 6" can never beat "y above 6", yet "y above 6 among points with x above 5" can.', model: 'The corner is part of the band, so over the same set of points it has fewer points and cannot be more likely. The conditional keeps the corner count but divides by the strip only, not by all points; with an upward trend most strip points are high, so the fraction can exceed the band\'s share of all points.', points: ['Corner ⊂ band over the same scope', 'The conditional divides by the strip', 'An upward trend concentrates high y inside the high-x strip'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'scatter-regions', difficulty: 2, seed: 'a', intro: 'Strips, bands, corners and the diagonal over all points. Count and order. Try it first.' },
    { type: 'worked', section: 'll', family: 'scatter-regions', difficulty: 3, seed: 'b', fade: 1, intro: 'One statement picks from a strip. The counts are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'With an upward trend, is P(y > 5 | x > 6) larger or smaller than P(y > 5)?', answer: 'Larger: high x comes with high y, so the conditional fraction rises.', explain: 'A downward trend would push it below.' },

    S('traps'),
    { type: 'text', text: 'Most misses come from the conditional. Either it is divided by all points, or its direction is read against the trend. The rest are counting slips near a gridline: say the region out loud ("strictly right of the line") before counting.' },
    { type: 'traps', section: 'll', family: 'scatter-regions', extra: [
      { belief: '"Among points with x above a" divides by all points.', fix: 'The strip is the scope: corner / strip.' },
      { belief: 'A corner can beat its strip if the trend is strong.', fix: 'The corner is inside the strip over the same scope: at most equal.' },
      { belief: '"Above the line y = x" means above some fixed height.', fix: 'It means y is larger than x for that point; the boundary is diagonal.' },
      { belief: 'A strip with few points gives a reliable fraction.', fix: 'One point changes it a lot; count carefully and expect extreme values.' },
    ] },
    { type: 'erroneous', problem: 'A candidate ranks the challenge statements. One step is wrong.', steps: [
      `Band y > 6: ${band} of ${N}.`,
      `Corner x > 5 and y > 6: ${corner} of ${N}, inside the band.`,
      `Among x > 5, y > 6: ${corner} of ${N} = ${dp(corner / N, 2)}, equal to the corner.`,
      'So the conditional ties with the corner at the bottom.',
    ], errorStep: 2, explain: `The conditional divides by the ${strip} points in the strip: ${corner}/${strip} = ${dp(corner / strip, 2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, `A candidate says "x > 5 and y > 6" (${corner} points) is more likely than "x > 5" (${strip} points) because the trend is strong. Which belief?`, 'A corner can beat its strip', [['The conditional divides by all points', 'no conditional statement is involved here'], ['Above y = x means a fixed height', 'no diagonal statement is involved'], ['The trend reverses conditionals', 'trends move conditionals, not containment']], 'The corner is inside the strip: never more likely.', { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Draw the two lines once and count four quadrants: every strip, band, corner and conditional is a sum or ratio of those four numbers.' },
    { type: 'callout', tone: 'speed', text: `Containment first (corner below strip and band), trend second (which side of the plain fraction the conditional lands), counts last. Budget: ${LL.exam.perItemSeconds} seconds; four quadrant counts of about 30 dots take 30 seconds.` },
    { type: 'check', scope: 'quadrant counts and containment', questions: [
      { make: (rng) => { const c = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)]; const n = c[0] + c[1] + c[2] + c[3]; return { type: 'number', q: `Quadrant counts: top-left ${c[0]}, top-right ${c[1]}, bottom-left ${c[2]}, bottom-right ${c[3]}. P(a random point is on the right or on top)? (2 decimals)`, answer: (n - c[2]) / n, tolerance: 0.006, hints: ['Only one quadrant is outside "right or top".'], explain: `Everything but bottom-left: ${n - c[2]}/${n} = ${dp((n - c[2]) / n, 2)}.` }; } },
    ] },

    S('rule'),
    { type: 'text', text: 'Draw the lines, count four quadrants, then read every statement off those four numbers with its own scope.' },
    { type: 'callout', tone: 'rule', text: 'Scatter plot → region / scope. Four quadrant counts; corner ≤ strip, band; "among x > a" = corner / strip; an upward trend lifts the conditional, a downward one lowers it.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Region', 'Scope'], rows: [
      ['x above a', 'vertical strip', 'all points'],
      ['y above b', 'horizontal band', 'all points'],
      ['x above a and y above b', 'corner', 'all points'],
      ['above y = x', 'half-plane over the diagonal', 'all points'],
      ['among x above a, y above b', 'corner', 'the strip'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a strip with no points makes its conditional meaningless (items avoid it); a strip with one point makes it 0 or 1. With no trend, the conditional is close to the plain fraction.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the 2 × 2 table (quadrants are cells), survey charts (the strip is the group), and histograms ("among values above a" is the same subgroup move in one dimension).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'Only one point has x above 9, and its y is 8. P(y above 6 | x above 9)?', '1', [['1/30', 'divided by all points instead of the one-point strip'], ['0', 'mixed up the thresholds: 8 is above 6'], ['1/2', 'treated the single point as a coin flip']], 'The strip has one point, and it qualifies.', { at: 0 }),
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'scatter-regions', count: 3 },
  ],
};
