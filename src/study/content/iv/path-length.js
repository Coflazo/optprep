// Intervals: length of a drawn path against a scale bar. Measure every segment in bar lengths
// (diagonals by Pythagoras), add, convert once, then a percent band. Paths are built here and
// every length shown is computed from their coordinates.
import { sec, dec, round, mc, ivq, bandFor, bestLog, eLog } from './scoring-and-width.js';

const segs = (pts) => pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
const path = (points, px, units, unit) => ({ width: 420, height: 280, points, scale: { x: 20, y: 260, px, units, unit, label: `${units} ${unit}` }, label: 'A path drawn with a scale bar' });
const P1 = { pts: [[40, 60], [200, 60], [200, 180], [340, 180], [340, 100]], px: 40, u: 10, unit: 'm' };
P1.bars = segs(P1.pts).map((d) => d / P1.px); P1.totBars = P1.bars.reduce((a, b) => a + b, 0); P1.len = P1.totBars * P1.u;
const P2 = { pts: [[60, 220], [210, 220], [360, 20]], px: 50, u: 2, unit: 'km' };
P2.bars = segs(P2.pts).map((d) => d / P2.px); P2.totBars = P2.bars.reduce((a, b) => a + b, 0); P2.len = P2.totBars * P2.u;
P2.legs = [[(P2.pts[1][0] - P2.pts[0][0]) / P2.px, 0], [Math.abs(P2.pts[2][0] - P2.pts[1][0]) / P2.px, Math.abs(P2.pts[2][1] - P2.pts[1][1]) / P2.px]];
P2.manhattan = P2.legs.reduce((a, [x, y]) => a + x + y, 0) * P2.u;
P2.straight = (Math.hypot(P2.pts[2][0] - P2.pts[0][0], P2.pts[2][1] - P2.pts[0][1]) / P2.px) * P2.u;
const S = { 2: 0.06, 3: 0.08, 4: 0.1 };
const B = Object.fromEntries(Object.entries(S).map(([k, s]) => [k, bestLog(s)]));
const PR = { bars: 7.5, u: 10, s: 0.08 }; PR.m = PR.bars * PR.u; Object.assign(PR, bandFor(PR.m, PR.s));
const angles = Array.from({ length: 46 }, (_, i) => i * 2);
const TRI = [[3, 4], [6, 8], [5, 12], [1, 1], [1, 2], [2, 3]];

const convQ = (rng) => { const u = rng.pick([2, 5, 10, 50]), unit = rng.pick(['m', 'km']), bars = rng.pick([3.5, 4.25, 6.5, 7.75, 9.5]); return { type: 'number', q: `The scale bar shows ${u} ${unit}. A path measures ${bars} bars. How long is it, in ${unit}?`, answer: bars * u, tolerance: 1e-9, explain: `${bars} × ${u} = ${bars * u} ${unit}.` }; };
const diagQ = (rng) => { const [a, b] = rng.pick(TRI), d = Math.hypot(a, b); return { hinge: true, ...mc({ q: `A diagonal segment goes ${a} bars across and ${b} bars up. How many bars long is it?`, right: dec(d, 2), wrong: [[String(a + b), 'added the legs: a diagonal is shorter than going across then up'], [String(Math.max(a, b)), 'kept only the longer leg: the diagonal is longer than either leg'], [dec((a + b) / 2, 2), 'averaged the legs'], [String(a * b), 'multiplied the legs']], explain: `√(${a}² + ${b}²) = √${a * a + b * b} = ${dec(d, 2)} bars.` }, rng) }; };
const sumQ = (rng) => { const n = rng.int(3, 5), parts = Array.from({ length: n }, () => rng.pick([1, 1.5, 2, 2.5, 3, 3.5, 4])), u = rng.pick([5, 10, 20]); const t = parts.reduce((a, b) => a + b, 0); return { type: 'number', q: `Segments measure ${parts.join(', ')} bars, and the bar is ${u} m. Path length in m?`, answer: t * u, tolerance: 1e-9, hints: ['Add the bars first.', `Then multiply once by ${u}.`], explain: `${parts.join(' + ')} = ${t} bars; × ${u} = ${t * u} m.` }; };
const bandQ = (rng) => {
  const lv = rng.pick([2, 3, 4]), s = S[lv], m = rng.pick([36, 48, 75, 120, 16.5]), b = bestLog(s);
  const E = (l, u) => dec(eLog(s, Math.log(l / m) / s, Math.log(u / m) / s), 2);
  const opt = [round(m / b.f, 1), round(m * b.f, 1)], abs = [round(m - 2, 1), round(m + 2, 1)], narrow = [round(m * 0.98, 1), round(m * 1.02, 1)], wide = [round(m / 1.6, 1), round(m * 1.6, 1)];
  return { hinge: true, ...mc({ q: `You measured a path at ${m} m. Measuring by eye is good to about ${Math.round(s * 100)}%. Which interval is best?`, right: `[${opt.join(', ')}]`, wrong: [
    [`[${abs.join(', ')}]`, `a fixed ± 2 m ignores that measurement error grows with length (expected ${E(...abs)})`],
    [`[${narrow.join(', ')}]`, `a 2% band for a ${Math.round(s * 100)}% error: misses too often (expected ${E(...narrow)})`],
    [`[${wide.join(', ')}]`, `too wide for this error (expected ${E(...wide)})`]],
    explain: `${m} ×/÷ ${dec(b.f, 3)} (about ${dec(b.z, 1)} SDs of ${Math.round(s * 100)}% each way), expected ${dec(b.e, 2)}.` }, rng) };
};

export default {
  id: 'iv/path-length',
  book: 'iv',
  kind: 'family',
  family: 'path-length',
  title: 'Path length from a scale bar',
  summary: 'Measure each segment in bar lengths (diagonals by Pythagoras), add in bars, convert once, and type a percent band sized to your measuring error.',
  prerequisites: ['iv/scoring-and-width', 'iv/estimation-tricks'],
  objectives: [
    'Measure straight and diagonal segments in bar lengths',
    'Add in bar units and convert to the stated unit once, at the end',
    'Type a band of about 6 to 10% each way, growing with the number of segments',
    'Avoid the three traps: start-to-end distance, added legs for a diagonal, a fixed ± band',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'legs', label: 'Added the legs of the diagonal', approach: `Counted the diagonal as ${P2.legs[1][0]} + ${P2.legs[1][1]} = ${P2.legs[1][0] + P2.legs[1][1]} bars.`, breaksAt: `A diagonal is √(across² + up²) = ${P2.bars[1]} bars, shorter than going round the corner.` },
      { id: 'straight', label: 'Measured start to end', approach: 'Took the straight distance from the first point to the last.', breaksAt: 'The path is every segment added together, not the shortcut between its ends.' },
      { id: 'units', label: 'Answered in bars', approach: `Answered ${P2.totBars}, the length in bars.`, breaksAt: `Bars must be converted once, at the end: × ${P2.u} ${P2.unit}.` },
    ], q: `Before any teaching: a path goes ${P2.legs[0][0]} bars to the right, then diagonally ${P2.legs[1][0]} bars across and ${P2.legs[1][1]} bars up. The bar is ${P2.u} ${P2.unit}. How long is the path? Two approaches.`, answer: `${P2.totBars} bars × ${P2.u} = ${P2.len} ${P2.unit}`,
      explain: `The diagonal is √(${P2.legs[1][0]}² + ${P2.legs[1][1]}²) = ${P2.bars[1]} bars, not ${P2.legs[1][0] + P2.legs[1][1]}. Adding the legs gives ${P2.manhattan} ${P2.unit}; the start-to-end distance gives ${dec(P2.straight, 2)} ${P2.unit}. Both miss.` },
    { type: 'text', text: 'The cue: a **drawn path** (a line of several straight segments) with a **scale bar** that says what one bar length means, and "How long is the path?". The path is the whole line, every segment, not the distance from start to end. The bar may be in metres, kilometres or centimetres, and the answer is asked in the same unit as the bar.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'A path has a scale bar of 5 m. What is being measured?', right: 'The total length of every segment added together', wrong: [['The straight-line distance from start to end', 'shorter than the path whenever it turns'], ['The number of segments times 5 m', 'segments have different lengths'], ['The width of the picture in bars', 'the picture frame has nothing to do with the path']], explain: 'The path length is the sum of its segments.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Measurement is different from counting: the error is **proportional** to the length (a 5% misjudged ruler is 5% on every segment), so the band must be a percent band. A careful measurer earns about 0.7 to 0.8 per path; the classic traps (adding the legs of a diagonal, measuring start to end) score 0. Nothing here needs more than Pythagoras and addition; the points are won by measuring every segment in the same unit and by giving the band the right shape.' },

    sec('anchor'),
    { type: 'text', text: 'Reading a map scale is converting units: "1 bar = 10 m" is a conversion factor, like 3,600 seconds per hour. **One change**: before converting you must measure the drawing in bars, by eye, which is where the error comes from. The conversion itself is exact; all of the uncertainty lives in the measuring, so that is where the care goes.' },
    { type: 'check', scope: 'bar units to real units', questions: [{ make: convQ }] },

    sec('picture'),
    { type: 'text', text: 'Start with a path whose segments all run across or up the page. Each one can be measured directly: set a gap of one bar with two fingertips (or the cursor) and walk it along the segment, counting steps and judging the final fraction to the nearest quarter.' },
    { type: 'diagram', diagram: 'path', spec: path(P1.pts, P1.px, P1.u, P1.unit), caption: `A path of ${P1.bars.length} straight segments. Laying the bar along each one gives ${P1.bars.join(', ')} bars: ${P1.totBars} bars in all, × ${P1.u} ${P1.unit} = ${P1.len} ${P1.unit}.` },
    { type: 'check', scope: 'measuring straight segments', questions: [
      ivq('Measure the path above against its scale bar and type your interval, in m.', P1.len, `Segments ${P1.bars.join(' + ')} = ${P1.totBars} bars × ${P1.u} = ${P1.len} m. With a 6% measuring error the best band is about [${dec(P1.len / B[2].f, 1)}, ${dec(P1.len * B[2].f, 1)}].`, ['Lay the scale bar along each segment and count how many fit.', 'Add the bars, then multiply by 10 once.']),
    ] },
    { type: 'text', text: 'A slanted segment is harder to judge directly, because the bar is horizontal. Do not walk the bar along the slant; measure how far the segment runs across and how far it rises, each against the bar, and let Pythagoras do the rest.' },
    { type: 'diagram', diagram: 'path', spec: path(P2.pts, P2.px, P2.u, P2.unit), caption: `A diagonal segment: ${P2.legs[1][0]} bars across and ${P2.legs[1][1]} up, so √(${P2.legs[1][0]}² + ${P2.legs[1][1]}²) = ${P2.bars[1]} bars. The whole path is ${P2.bars.join(' + ')} = ${P2.totBars} bars = ${P2.len} ${P2.unit}.` },
    { type: 'check', scope: 'diagonal segments', questions: [{ make: diagQ }] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 90, label: 'angle of a segment (degrees from horizontal)' }, y: { min: 1, max: 1.5, label: '(across + up) ÷ true length' }, curves: [{ label: 'legs ÷ diagonal', points: angles.map((a) => [a, Math.cos((a * Math.PI) / 180) + Math.sin((a * Math.PI) / 180)]) }], markers: [{ x: 45, y: Math.SQRT2, label: `45°: ×${dec(Math.SQRT2, 3)}` }] }, caption: `Adding the legs instead of using Pythagoras overstates a diagonal by up to ${dec((Math.SQRT2 - 1) * 100, 0)}% (at 45°). That error is far bigger than the band, so it always scores 0.` },
    { type: 'check', scope: 'the diagonal trap', questions: [
      mc({ q: 'A segment runs at 45°, 2 bars across and 2 up. Adding the legs gives 4 bars. What is the true length?', right: dec(2 * Math.SQRT2, 2), wrong: [['4', 'added the legs'], ['2', 'kept one leg'], ['3', 'guessed a diagonal as 1.5 × the leg']], explain: `√(2² + 2²) = 2√2 ≈ ${dec(2 * Math.SQRT2, 2)} bars: the legs overstate it by ${dec((Math.SQRT2 - 1) * 100, 0)}%.` }),
    ] },

    sec('derivation'),
    { type: 'text', text: 'Five moves. The first four produce the length; the fifth turns your measuring accuracy into the band. Every check below uses only the move above it.' },
    { type: 'steps', steps: [
      { answers: 'units', say: 'Read the scale: the bar is one unit of measure, worth the stated amount (for example 2 km).', why: 'Everything is measured in bars first; the bar value is used once, at the end.',
        checks: [{ make: convQ }] },
      { say: 'Measure each straight segment by laying the bar along it (a fingertip gap or a straight edge on the screen) and counting bars, to a quarter bar.', why: 'Short, repeated comparisons with one ruler are more accurate than a single guess of the whole path.',
        checks: [mc({ q: 'The bar fits along a segment 3 times with about a quarter of a bar left over. Length in bars?', right: '3.25', wrong: [['3', 'dropped the leftover'], ['4', 'rounded the leftover up to a full bar'], ['3.5', 'called a quarter a half']], explain: 'Three full bars plus a quarter.' })] },
      { answers: 'legs', say: 'For a diagonal, measure how far it goes across and how far up, in bars, then take √(across² + up²).', why: 'Across and up are easy to judge against a horizontal bar; the diagonal itself is not.',
        checks: [{ make: diagQ }] },
      { answers: 'straight', say: 'Add all segments in bars, then multiply once by the bar value.', why: 'Converting each segment separately invites rounding errors and slipped units.',
        checks: [{ make: sumQ }] },
      { say: `Band: a percent band, about 6% (one SD) for 3 to 5 straight segments, 8% for 4 to 6 turning ones, 10% for 7 or more. That is × and ÷ about ${dec(B[2].f, 2)} to ${dec(B[4].f, 2)}.`, why: 'Each segment adds its own misjudgement, and errors scale with length, so the band is a ratio.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why should the band around a path length be a percent band rather than a fixed ± number of metres?', model: 'The error comes from judging lengths against the bar, and a misjudgement is a fraction of whatever is being measured: a 7% error on a 20 m path is 1.4 m, on a 200 m path 14 m. The score is lower ÷ upper, which also depends only on ratios, so a percent band matches both the error and the scoring.', points: ['Measuring errors are proportional to the length', 'The score depends only on the ratio lower ÷ upper', 'So the right band is estimate ×/÷ a factor'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'path-length', section: 'iv', difficulty: 2, seed: 'a', intro: 'A path of straight, axis-aligned segments. Measure, add, convert, then choose the band.' },
    { type: 'worked', family: 'path-length', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'A turning path with diagonals. The measurement is given; the band is yours.' },
    { type: 'thinkaloud', problem: `The diagonal path from the picture section: the bar shows ${P2.u} ${P2.unit}. How long is the path?`, lines: [
      { t: 0, say: `I see a path and a scale bar of ${P2.u} ${P2.unit}: I measure in bars and convert once.` },
      { t: 5, say: `First segment is horizontal: the bar fits ${P2.bars[0]} times.` },
      { t: 11, say: `The second goes ${P2.legs[1][0]} across and ${P2.legs[1][1]} up, so ${P2.legs[1][0] + P2.legs[1][1]} bars.`, slip: true },
      { t: 15, say: `No, that walks round the corner. The segment is the hypotenuse: √(${P2.legs[1][0] ** 2} + ${P2.legs[1][1] ** 2}) = ${P2.bars[1]} bars.` },
      { t: 22, say: `Total ${P2.totBars} bars × ${P2.u} = ${P2.len} ${P2.unit}. Check: more than the start-to-end gap, less than the legs added (${P2.manhattan}).` },
      { t: 30, say: `Two segments, one diagonal: about 6% error, ×/÷ ${dec(B[2].f, 2)}: [${dec(P2.len / B[2].f, 1)}, ${dec(P2.len * B[2].f, 1)}].` },
    ] },

    sec('predict'),
    { type: 'predict', question: `You measure ${PR.bars} bars and each bar is ${PR.u} m. You trust your measuring to about 8%. What interval do you type?`, answer: `About [${dec(PR.lo, 1)}, ${dec(PR.hi, 1)}]: ${PR.m} ×/÷ ${dec(PR.f, 2)}.`, explain: `It has more room above ${PR.m} (+${dec(PR.hi - PR.m, 1)}) than below (−${dec(PR.m - PR.lo, 1)}) because it is symmetric in ratio, not in metres. Expected score ${dec(PR.e, 2)}.` },

    sec('traps'),
    { type: 'traps', family: 'path-length', section: 'iv', extra: [
      { belief: 'The path length is the distance from start to end.', fix: 'Only for a single straight segment. A turning path is longer.' },
      { belief: 'A diagonal is across + up.', fix: `That overstates it by up to ${dec((Math.SQRT2 - 1) * 100, 0)}%. Use √(across² + up²).` },
      { belief: 'Convert each segment to metres and round as you go.', fix: 'Add in bars, convert once.' },
      { belief: 'A fixed ± band works for every path.', fix: 'Errors scale with length: use ×/÷ a factor.' },
    ] },
    { type: 'erroneous', problem: `A candidate measures the diagonal path (bar = ${P2.u} ${P2.unit}). One step is wrong.`, steps: [
      `The horizontal segment is ${P2.bars[0]} bars.`,
      `The diagonal goes ${P2.legs[1][0]} bars across and ${P2.legs[1][1]} up, so it is ${P2.legs[1][0] + P2.legs[1][1]} bars.`,
      `Total ${P2.bars[0] + P2.legs[1][0] + P2.legs[1][1]} bars × ${P2.u} = ${P2.manhattan} ${P2.unit}.`,
      `Type ${P2.manhattan} ×/÷ ${dec(B[2].f, 2)}.`,
    ], errorStep: 1, explain: `A diagonal is √(${P2.legs[1][0]}² + ${P2.legs[1][1]}²) = ${P2.bars[1]} bars, not the sum of its legs. The path is ${P2.len} ${P2.unit}, and a band around ${P2.manhattan} misses it completely.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: `A candidate answers ${dec(P2.straight, 1)} ${P2.unit} for the diagonal path. Which belief?`, right: 'Path = start-to-end distance', wrong: [['A diagonal is across + up', `that gives ${P2.manhattan}`], ['A fixed ± band is fine', 'that is about the band, not the centre']], explain: `${dec(P2.straight, 2)} ${P2.unit} is the straight line from the first point to the last. The path is ${P2.len} ${P2.unit}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Right triangles to recognise at sight (in bars): 3-4-5, 6-8-10, 5-12-13; a 45° diagonal is ${dec(Math.SQRT2, 3)} × its leg; 1 across and 2 up is ${dec(Math.sqrt(5), 3)}. Budget: about 35 seconds to measure, 10 to add and type.` },
    { type: 'callout', tone: 'speed', text: 'Use your fingertips or the cursor as calipers: set the gap to one bar once, then walk it along each segment. Resetting the gap for every segment is slower and less consistent. Count the segments before you start, and tick each one off as you measure it, so a short segment next to a long one is never skipped.' },
    { type: 'check', scope: 'quick triangles', questions: [{ make: diagQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `Path + scale bar → measure each segment in bars (diagonal = √(across² + up²)) → add in bars → × bar value once → band ×/÷ about ${dec(B[2].f, 2)} (few segments) to ${dec(B[4].f, 2)} (many).` },

    sec('contrast'),
    { type: 'compare', columns: ['Picture', 'Measure', 'Error', 'Band shape'], rows: [
      ['path + scale bar (this lesson)', 'sum of segments in bars', '6 to 10% of the length', 'estimate ×/÷ factor'],
      ['coins or dots (iv/dots-count)', 'a count', 'a few items', 'count ± items, leaning high'],
      ['noisy series (iv/series)', 'trend at a future time', 'grows with distance', 'wider further out'],
    ] },
    { type: 'variation', base: `Base: the straight-segment path above, ${P1.totBars} bars × ${P1.u} m = ${P1.len} m, measured to about 6%.`, rows: [
      { change: `The bar is worth ${2 * P1.u} m instead of ${P1.u} m`, effect: `The answer doubles to ${2 * P1.len} m; the band keeps the same ratio.` },
      { change: 'One segment becomes a diagonal, 3 bars across and 4 up', effect: 'That segment counts 5 bars, not 7: Pythagoras, not the legs.' },
      { change: 'The path has 8 segments instead of 4', effect: 'More misjudgements add up: allow about 10% instead of 6%, a wider band.' },
      { same: true, change: 'The path is walked from the other end', effect: 'No change: the same segments, the same length, the same band.' },
      { fusion: true, change: `The bar is worth ${2 * P1.u} m AND the first segment becomes a diagonal 3 bars across and 4 up`, effect: `The diagonal counts 5 bars instead of ${P1.bars[0]}, and each bar is worth double: (${P1.totBars} − ${P1.bars[0]} + 5) × ${2 * P1.u} = ${(P1.totBars - P1.bars[0] + 5) * 2 * P1.u} m. Measure in bars first, convert once.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a closed loop still counts every segment, including the one back to the start. A bar that is not a round number of your finger widths is fine: you count in bars, not in fingers. A very short segment next to a long one is easy to skip; count the segments first.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "measure in the picture\'s own unit, convert once" is the Fermi chain of units; Pythagoras is the distance in every grid-path question; and the percent band is the right shape for any measured quantity.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'A square loop of side 2 bars, bar = 5 m. How long is the path?', right: String(4 * 2 * 5), wrong: [[String(3 * 2 * 5), 'forgot the side that closes the loop'], ['0', 'used the start-to-end distance of a loop'], [String(2 * 5), 'measured one side only']], explain: '4 sides × 2 bars × 5 m = 40 m.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const segs = [rng.pick([2, 2.5, 3.5]), rng.pick([1, 1.5, 2]), rng.pick([1.5, 3, 4])], u = rng.pick([4, 5, 20]); const t = segs.reduce((a, b) => a + b, 0); return { type: 'number', q: `A floor plan: a corridor runs ${segs[0]} bars east, ${segs[1]} bars north, then ${segs[2]} bars east. The bar is ${u} m. How long is the corridor, in m?`, answer: t * u, tolerance: 1e-9, explain: `${segs.join(' + ')} = ${t} bars × ${u} = ${t * u} m.` }; } },
      far: { type: 'number', q: 'Outside the OA: a drone flies 6 km east and then 8 km north. How far is it from its base, in a straight line, in km?', answer: Math.hypot(6, 8), explain: '√(6² + 8²) = √100 = 10 km: the same Pythagoras as a diagonal segment.' },
      principle: mc({ q: 'Which idea carried over from the path to the drone?', right: 'Diagonal = √(across² + up²)', wrong: [['Diagonal = across + up', 'that is the route round the corner'], ['Convert each segment separately', 'there was nothing to convert'], ['Use a fixed ± band', 'no band was asked']], explain: 'Both needed the length of a slanted line from its across and up parts.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'path-length', section: 'iv', count: 3 },
  ],
};
