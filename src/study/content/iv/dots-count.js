// Intervals: visual counting under time pressure (a partly filled 10 × 10 grid, coins on a
// table, one shape among mixed shapes). Count in blocks, know your error, lean the band high.
// The pictures are generated here from fixed seeds, and every count shown is taken from them.
import { makeRng } from '../../../core/rng.js';
import { sec, dec, round, mc, ivq, bestNorm, eNorm } from './scoring-and-width.js';

const W = 420, H = 280, CELL = 26, X0 = (W - 10 * CELL) / 2, Y0 = (H - 10 * CELL) / 2;
const at = (r, c) => ({ x: +(X0 + (c + 0.5) * CELL).toFixed(1), y: +(Y0 + (r + 0.5) * CELL).toFixed(1) });
const gridBox = { x: X0, y: Y0, rows: 10, cols: 10, cell: CELL };
// A 10 × 10 grid with some cells filled.
function fillGrid(seed, p) {
  const rng = makeRng(seed), cells = [];
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (rng.chance(p)) cells.push([r, c]);
  return { cells, spec: { width: W, height: H, grid: gridBox, items: cells.map(([r, c]) => ({ ...at(r, c), r: 8, shape: 'circle', tone: 1 })), label: 'A 10 by 10 grid, some cells holding a dot' } };
}
// Mixed shapes, one per cell.
function mixedGrid(seed) {
  const rng = makeRng(seed), shapes = [];
  for (let k = 0; k < 100; k++) shapes.push(rng.pick(['circle', 'square', 'triangle']));
  return { shapes, spec: { width: W, height: H, grid: gridBox, items: shapes.map((s, k) => ({ ...at(Math.floor(k / 10), k % 10), r: 8, shape: s })), label: 'A 10 by 10 grid of mixed shapes' } };
}
// Coins: rejection sampling for non-overlapping centres.
function coins(seed, n) {
  const rng = makeRng(seed), pts = [];
  for (let tries = 0; pts.length < n && tries < 40000; tries++) {
    const x = +rng.float(18, W - 18).toFixed(1), y = +rng.float(18, H - 18).toFixed(1);
    if (pts.every(([a, b]) => (a - x) ** 2 + (b - y) ** 2 >= 27 * 27)) pts.push([x, y]);
  }
  return { pts, spec: { width: W, height: H, items: pts.map(([x, y]) => ({ x, y, r: 11, shape: 'coin', tone: 2 })), label: 'Coins scattered on a table' } };
}
const quad = (pts) => [pts.filter(([x, y]) => x < W / 2 && y < H / 2).length, pts.filter(([x, y]) => x >= W / 2 && y < H / 2).length, pts.filter(([x, y]) => x < W / 2 && y >= H / 2).length, pts.filter(([x, y]) => x >= W / 2 && y >= H / 2).length];

const G1 = fillGrid('iv-lesson-fill', 0.7); G1.n = G1.cells.length; G1.empty = 100 - G1.n;
G1.rowsEmpty = Array.from({ length: 10 }, (_, r) => 10 - G1.cells.filter(([rr]) => rr === r).length);
const C1 = coins('iv-lesson-coins', 41); C1.n = C1.pts.length; C1.q = quad(C1.pts);
const M1 = mixedGrid('iv-lesson-shapes-b'); M1.tri = M1.shapes.filter((s) => s === 'triangle').length;
M1.rows = Array.from({ length: 10 }, (_, r) => M1.shapes.slice(10 * r, 10 * r + 10).filter((s) => s === 'triangle').length);
const sdGrid = (n) => Number((1 + 0.02 * n).toPrecision(2)), sdCoin = (n) => Number((0.05 * n).toPrecision(2)), sdShape = (n) => Number((0.06 * n).toPrecision(2));
const CH = { n: 64 }; CH.sd = sdGrid(CH.n); Object.assign(CH, bestNorm(CH.n, CH.sd));
const PR = { n: 47, sd: 2 }; Object.assign(PR, bestNorm(PR.n, PR.sd));
const ER = { n: 69 }; ER.sd = sdGrid(ER.n); ER.b = bestNorm(ER.n, ER.sd); ER.naive = eNorm(ER.n, ER.sd, ER.n - ER.sd, ER.n + ER.sd);
const TA = coins('iv-lesson-coins-ta', 46); TA.n = TA.pts.length; TA.q = quad(TA.pts); TA.sd = sdCoin(TA.n); TA.b = bestNorm(TA.n, TA.sd);
const band = (b) => `[${Math.floor(b.lo)}, ${Math.ceil(b.hi)}]`;

const sdQ = (rng) => {
  const kind = rng.pick(['grid', 'coins', 'shapes']), n = kind === 'grid' ? rng.int(40, 85) : kind === 'coins' ? rng.int(25, 70) : rng.int(25, 40);
  const sd = kind === 'grid' ? sdGrid(n) : kind === 'coins' ? sdCoin(n) : sdShape(n);
  return { type: 'number', q: `A ${kind === 'grid' ? 'grid-fill' : kind === 'coins' ? 'coin' : 'one-shape'} count of ${n}. Using the error model (grid: 1 + 2% of the count; coins: 5%; one shape among many: 6%), what is your one-SD counting error? (1 decimal place)`, answer: round(sd, 1), tolerance: 0.051, explain: `${kind === 'grid' ? `1 + 0.02 × ${n}` : `${kind === 'coins' ? '0.05' : '0.06'} × ${n}`} = ${sd}.` };
};
const bandQ = (rng) => {
  const n = rng.int(35, 70), sd = rng.pick([1.5, 2, 2.5, 3]), b = bestNorm(n, sd);
  const opt = [Math.floor(b.lo), Math.ceil(b.hi)], sym1 = [Math.round(n - sd), Math.round(n + sd)], low = [Math.round(n - 2.4 * sd), Math.round(n + 1.6 * sd)], wide = [Math.round(n / 2), n * 2];
  const E = ([l, u]) => dec(eNorm(n, sd, l, u), 2);
  return { hinge: true, ...mc({ q: `You counted ${n} and your counting error is about ±${sd} (one SD). Which interval has the highest expected score?`, right: `[${opt.join(', ')}]`, wrong: [
    [`[${sym1.join(', ')}]`, `only 1 SD each way: it misses about a third of the time (expected ${E(sym1)})`],
    [`[${low.join(', ')}]`, `leans low: for the same width a lower interval has a worse ratio (expected ${E(low)})`],
    [`[${wide.join(', ')}]`, `panic width: always hits, scores ${dec(wide[0] / wide[1], 2)} (expected ${E(wide)})`],
    [`[${n}, ${n}]`, 'zero width on an uncertain count: almost always a miss']],
    explain: `About ${dec(b.below, 1)} SDs below and ${dec(b.above, 1)} above: [${opt.join(', ')}], expected ${E(opt)}.` }, rng) };
};
const gapQ = (rng) => { const e = Array.from({ length: 10 }, () => rng.int(1, 5)); const tot = e.reduce((a, b) => a + b, 0); return { type: 'number', q: `A mostly full 10 × 10 grid. You count the empty cells row by row: ${e.join(', ')}. How many cells hold a dot?`, answer: 100 - tot, hints: ['Add the empties.', `Then subtract from 100.`], explain: `${e.join(' + ')} = ${tot} empty, so ${100 - tot} dots.` }; };

const FAR = { m: 120, sd: 10 }; FAR.b = bestNorm(FAR.m, FAR.sd);

export default {
  id: 'iv/dots-count',
  book: 'iv',
  kind: 'family',
  family: 'dots-count',
  title: 'Visual counting',
  summary: 'Count in blocks (rows, gaps, quadrants), know your counting error, and type a band about two errors wide on each side, leaning high.',
  prerequisites: ['iv/scoring-and-width'],
  objectives: [
    'Count a 10 × 10 grid, a scatter of coins or one shape among many in under 45 seconds',
    'Pick the faster count: dots or gaps, rows or quadrants',
    'State your counting error from the count and turn it into the best band',
    'Explain why a count band leans high and why ± one error is too narrow',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'onebyone', label: 'Counted every dot', approach: `Ran one count through all ${CH.n} dots, cell by cell.`, breaksAt: 'Too slow, and a long running count loses its place; count the smaller side in blocks.' },
      { id: 'point', label: 'Typed the count as a point', approach: `Counted ${CH.n} and typed [${CH.n}, ${CH.n}].`, breaksAt: 'A timed count is off by a couple of items, so a point misses.' },
      { id: 'onesd', label: 'Typed ± one error', approach: `Typed [${CH.n - Math.round(CH.sd)}, ${CH.n + Math.round(CH.sd)}] for an error of about ${Math.round(CH.sd)}.`, breaksAt: 'One error each way misses about a third of the time.' },
    ], q: `Before any teaching: a 10 × 10 grid has dots in about two thirds of its cells. You have 45 seconds. How do you count, and what do you type if your count is ${CH.n}? Try two counting methods.`, answer: `Count the empty cells (about a third) and subtract from 100. With an error of about ±${CH.sd}, type about ${band(CH)}.`,
      explain: `Counting ${CH.n} dots one by one is slow and you lose your place; about ${100 - CH.n} gaps are half the work. Then a band about ${dec(CH.below, 1)} errors below and ${dec(CH.above, 1)} above scores ${dec(CH.e, 2)} on average. [${CH.n}, ${CH.n}] almost always misses.` },
    { type: 'text', text: 'The cue: a **picture** and "How many …?". Three forms are reported: a 10 × 10 grid where some cells hold a dot, coins scattered on a table, and a 10 × 10 grid of mixed shapes where you count only one kind.' },
    { type: 'list', items: ['"How many cells of the 10 × 10 grid contain a dot?"', '"How many coins are on the table?"', '"The grid holds circles, squares and triangles. How many triangles are there?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question belongs to this lesson?', right: 'A picture of coins: how many coins?', wrong: [['A 10 × 10 grid of dice: total number of pips', 'a dice grid: count × average plus a correction (iv/dice-grid)'], ['A grid of 200 scores: the median', 'order statistics from a value grid (iv/percentile)'], ['A path and a scale bar: how long?', 'measurement, not counting (iv/path-length)']], explain: 'Counting identical items in a picture.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Nobody counts 60 items perfectly in 45 seconds, and the score punishes both a miss (0) and a panicked band. The whole skill is a fast count with a small, **known** error, and a band sized to that error. Get this right and a counting question is worth about 0.8 every time. Get it wrong in either direction and the same question is worth 0 (a point that misses) or 0.25 (a band from 20 to 80). No other question type in the section is so cheap to master: the counting is ordinary, and the width is a table you learn once.' },

    sec('anchor'),
    { type: 'text', text: 'Counting you already know. **One change**: the clock. You trade a small counting error for speed and cover it with width. From the scoring lesson: an error of "± a few items" is the same size wherever the count is, so the best band leans slightly high.' },
    { type: 'check', scope: 'the leaning-high rule', questions: [
      mc({ q: `You counted ${PR.n} with an error of ±${PR.sd}. Which band is best?`, right: `[${Math.floor(PR.lo)}, ${Math.ceil(PR.hi)}]`, wrong: [[`[${PR.n - 5}, ${PR.n + 3}]`, 'leans low: a lower interval has a worse ratio for the same width'], [`[${PR.n - PR.sd}, ${PR.n + PR.sd}]`, '± one error: misses about a third of the time'], [`[${PR.n}, ${PR.n}]`, 'a point on an uncertain count']], explain: `About ${dec(PR.below, 1)} errors below and ${dec(PR.above, 1)} above: [${dec(PR.lo, 1)}, ${dec(PR.hi, 1)}].` }),
    ] },

    sec('picture'),
    { type: 'diagram', diagram: 'dots', spec: G1.spec, caption: `A grid about ${Math.round((G1.n / 100) * 10) * 10}% full. Counting the ${G1.empty} empty cells row by row (${G1.rowsEmpty.join(', ')}) is faster than counting ${G1.n} dots.` },
    { type: 'check', scope: 'counting gaps in the grid above', questions: [
      { type: 'number', q: 'In the grid above, how many cells are empty? Count row by row.', answer: G1.empty, hints: ['Row by row, count the gaps: most rows have only a few.', `The first two rows have ${G1.rowsEmpty[0]} and ${G1.rowsEmpty[1]} gaps.`], explain: `Empty per row: ${G1.rowsEmpty.join(', ')}; total ${G1.empty}, so ${G1.n} dots.` },
      { type: 'number', q: 'So how many cells hold a dot?', answer: G1.n, explain: `100 − ${G1.empty} = ${G1.n}.` },
    ] },
    { type: 'text', text: 'The empty cells are the smaller side here, so they are what you count; the dots follow by subtraction. Coins have no grid, so make one: split the table into four quadrants with imaginary lines through the middle, count each quadrant in clusters of three to five (you see a cluster that small without counting), and add. A coin on a line belongs to whichever side holds its centre.' },
    { type: 'diagram', diagram: 'dots', spec: C1.spec, caption: `${C1.n} coins. By quadrant (top left, top right, bottom left, bottom right): ${C1.q.join(', ')}. The four sub-counts are small enough to do reliably and give a built-in check on the total.` },
    { type: 'check', scope: 'quadrant counting', questions: [
      ivq('Count the coins in the picture above, quadrant by quadrant, and type your interval.', C1.n, `There are ${C1.n} coins (quadrants ${C1.q.join(', ')}). With a 5% counting error the best band is about ${band(bestNorm(C1.n, sdCoin(C1.n)))}.`, ['Four quadrants, clusters of three to five.', 'Then about two errors each side, a little more above.']),
    ] },
    { type: 'text', text: 'Mixed shapes add a distraction: two thirds of the grid is noise. Fix your eyes on one shape, sweep each row left to right, and write the row count down before moving on. Never try to count two shapes at once, and do not estimate from one row: rows vary far more than you would guess.' },
    { type: 'diagram', diagram: 'dots', spec: M1.spec, caption: `One shape among three: count only the triangles, row by row (${M1.rows.join(', ')}), total ${M1.tri}. Expect about a third of 100 overall; single rows vary a lot, which is why you count rather than guess from one row.` },
    { type: 'check', scope: 'counting one shape', questions: [
      ivq('How many triangles are in the grid above? Type your interval.', M1.tri, `Triangles per row: ${M1.rows.join(', ')}; total ${M1.tri}. With a 6% error, about ${band(bestNorm(M1.tri, sdShape(M1.tri)))}.`, ['Count triangles only, one row at a time.', 'Expect about a third of 100.']),
    ] },

    sec('derivation'),
    { type: 'text', text: 'Four moves: choose the blocks, count the smaller side, put a number on your error, and turn that number into a band. The first two make the count fast; the last two make the band pay.' },
    { type: 'steps', steps: [
      { say: 'Pick the block: rows for a grid, four quadrants for a scatter, one shape per row for mixed grids.', why: 'Small blocks are counted reliably; a running count of 60 single items is where places get lost.',
        checks: [mc({ q: 'Coins scattered on a table, no grid. Best way to count in 45 seconds?', right: 'Four quadrants, clusters of three to five, then add', wrong: [['One by one, left to right', 'slow, and you lose your place in a scatter'], ['Estimate the density of one corner and multiply', 'a density guess has a far larger error than a count']], explain: 'Quadrants turn one big count into four small ones plus a check.' })] },
      { answers: 'onebyone', say: 'Count the smaller side: if a grid is more than half full, count the gaps and subtract from 100.', why: 'Fewer items counted means fewer chances to slip.',
        checks: [{ make: gapQ }] },
      { answers: 'point', say: 'Know your error. A careful timed count is off by about 1 + 2% of the count on a grid, 5% for coins, 6% for one shape among many.', why: 'Errors grow with the number of items, and a scatter or distractors make each item harder.',
        checks: [{ make: sdQ }] },
      { answers: 'onesd', say: 'Type about two errors below and a little more above the count.', why: 'A ± error is the same size wherever the count is, so a higher band has a better ratio: the best band leans high.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why is [count − error, count + error] a bad interval, even though it looks honest?', model: 'One error each way covers only about two thirds of the outcomes, so about a third of the time the truth is outside and you score 0. Widening to about two errors each way costs only a few percent of ratio but almost removes the misses, which raises the expected score. And because the error is in items, not percent, the extra room belongs slightly above the count.', points: ['± one error hits only about 68% of the time', 'A miss costs the whole score; width costs a little ratio', 'Count errors are absolute, so the band leans high'] },

    sec('worked'),
    { type: 'worked', explainAt: [2], family: 'dots-count', section: 'iv', difficulty: 1, seed: 'a', intro: 'A partly filled grid. Count it (dots or gaps), then choose the band before opening the solution.' },
    { type: 'worked', family: 'dots-count', section: 'iv', difficulty: 2, seed: 'b', fade: 1, intro: 'Coins on a table. The counting method is given; the band is yours.' },
    { type: 'thinkaloud', problem: `A picture shows coins on a table (${TA.n} of them, though you do not know that yet). How many coins are there?`, lines: [
      { t: 0, say: 'I see a scatter, no grid: I split it into four quadrants through the middle.' },
      { t: 4, say: `Top left, in clusters of three to five: ${TA.q[0]}. Top right: ${TA.q[1]}.` },
      { t: 14, say: 'Bottom left looks as busy as top left, so I will call it the same without counting.', slip: true },
      { t: 17, say: `No: a guess is not a count. I count it: ${TA.q[2]}. Bottom right: ${TA.q[3]}.` },
      { t: 28, say: `Total ${TA.n}. Check: no quadrant is wildly different, and I did not skip a gap.` },
      { t: 33, say: `Coins: about 5% error, so ±${TA.sd}. Two errors below, a bit more above.` },
      { t: 40, say: `I type ${band(TA.b)}. Expected score about ${dec(TA.b.e, 2)}.` },
    ] },

    sec('predict'),
    { type: 'predict', question: `You counted ${PR.n} coins and trust yourself to ±${PR.sd}. Which interval, and what does it score if the truth is inside?`, answer: `About [${dec(PR.lo, 1)}, ${dec(PR.hi, 1)}], so [${Math.floor(PR.lo)}, ${Math.ceil(PR.hi)}] in whole numbers: it scores ${dec(Math.floor(PR.lo) / Math.ceil(PR.hi), 2)} when it hits, and hits almost always.`, explain: `Expected score about ${dec(PR.e, 2)}. The extra room sits above ${PR.n}, not below.` },

    sec('traps'),
    { type: 'traps', family: 'dots-count', section: 'iv', extra: [
      { belief: 'I counted carefully, so zero width is fine.', fix: 'One pass under time pressure is off by a couple of items: a point almost always misses.' },
      { belief: '± one counting error is an honest band.', fix: 'It hits only about two thirds of the time. Use about two errors each side.' },
      { belief: 'Width costs nothing when unsure: type [20, 80].', fix: 'That scores 0.25 at best. A good count earns 0.8.' },
      { belief: 'Count the dots even when the grid is nearly full.', fix: 'Count whichever is fewer, dots or gaps.' },
    ] },
    { type: 'erroneous', problem: 'A candidate counts a mostly full 10 × 10 grid. One step is wrong.', steps: [
      `The grid is mostly full, so I count the empty cells: ${100 - ER.n}.`,
      `So there are ${ER.n} dots.`,
      `My count is good to about ±${ER.sd}, so I type [${dec(ER.n - ER.sd, 1)}, ${dec(ER.n + ER.sd, 1)}].`,
      `If the truth is inside I score about ${dec((ER.n - ER.sd) / (ER.n + ER.sd), 2)}.`,
    ], errorStep: 2, explain: `± one error hits only about 68% of the time, so the expected score is ${dec(ER.naive, 2)}. About [${dec(ER.b.lo, 1)}, ${dec(ER.b.hi, 1)}] (two errors each side, leaning high) scores ${dec(ER.b.e, 2)} on average.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate types [20, 80] for a grid count of about 50. What is the best this can score?', right: String(20 / 80), wrong: [['1', 'a hit does not score 1; it scores lower ÷ upper'], ['0.8', 'that is what a good count band scores'], ['0.6', 'subtracted the bounds instead of dividing']], explain: '20 ÷ 80 = 0.25, and only if the truth is inside. A good count and a two-error band score about 0.8.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'You see up to about four items at a glance without counting. Count rows of a grid in chunks of two to four, and coins in clusters of three to five. Say the running total, not each item.' },
    { type: 'callout', tone: 'speed', text: 'Budget: about 40 seconds to count, 10 to type. If time allows a second pass, recount only the densest block: agreement lets you tighten the band, disagreement tells you to widen it.' },
    { type: 'check', scope: 'chunk counting', questions: [{ make: gapQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Picture + "how many" → count in blocks (fewer side, quadrants, one shape per row) → error ≈ 1 + 2% (grid), 5% (coins), 6% (one shape) → band ≈ two errors below, a bit more above.' },

    sec('contrast'),
    { type: 'compare', columns: ['Picture', 'How to count', 'Error (one SD)', 'Band for a count of 50'], rows: [
      ['10 × 10 grid, dots', 'rows; gaps if more than half full', `±${sdGrid(50)}`, band(bestNorm(50, sdGrid(50)))],
      ['coins on a table', 'four quadrants, clusters', `±${sdCoin(50)}`, band(bestNorm(50, sdCoin(50)))],
      ['one shape among three', 'that shape only, per row', `±${sdShape(50)}`, band(bestNorm(50, sdShape(50)))],
      ['dice grid, one face (iv/dice-grid)', 'expect 100/6, then scan', 'about ±10%', 'wider'],
    ] },
    { type: 'variation', base: `Base: a 10 × 10 grid with ${CH.n} dots, counted with an error of ±${CH.sd}: type about ${band(CH)}.`, rows: [
      { change: 'The grid becomes a scatter of coins with the same count', effect: `The error grows to 5% (±${sdCoin(CH.n)}), so the band widens to about ${band(bestNorm(CH.n, sdCoin(CH.n)))}.` },
      { change: `The grid is ${100 - CH.n}% full instead of ${CH.n}%`, effect: `Count dots directly instead of gaps; the error ±${sdGrid(100 - CH.n)} is similar, the band sits around ${100 - CH.n}.` },
      { change: 'Only triangles among mixed shapes are counted', effect: 'Per-row counting of one shape; the error rises to about 6% because the other shapes distract.' },
      { same: true, change: 'The picture is rotated a quarter turn', effect: 'No change: the same items, the same count and the same band. Count rows or columns, whichever is easier.' },
      { fusion: true, change: `The grid becomes coins AND the count doubles to ${2 * CH.n}`, effect: `Both raise the error: 5% of ${2 * CH.n} is ±${sdCoin(2 * CH.n)}, so about ${band(bestNorm(2 * CH.n, sdCoin(2 * CH.n)))}. In ratio terms the band is similar, because a bigger count also has a bigger centre.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a sparse grid (under 20 dots) counted twice with the same result is effectively exact, so zero width is optimal. A near-empty or near-full grid: count the rare side and the error drops to about one item.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: blocks and a known error drive every visual item in Intervals (the dice grid, the 200-score grid, the scale-bar path), and "count the smaller side" is the complement rule of probability in picture form.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'A grid has 12 dots. You counted twice and got 12 both times. What do you type?', right: '[12, 12]', wrong: [['[10, 15]', 'a band for an uncertain count: this one is not uncertain'], ['[6, 24]', 'panic width on an easy count'], ['[11, 13]', 'still gives away 15% for an error you do not have']], explain: 'Two agreeing counts of a sparse grid: the count is exact, so zero width scores 1.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(30, 60), sd = rng.pick([1.5, 2, 2.5]), b = bestNorm(n, sd); const opt = [Math.floor(b.lo), Math.ceil(b.hi)], one = [Math.round(n - sd), Math.round(n + sd)], wide = [Math.round(n * 0.6), Math.round(n * 1.4)]; return mc({ q: `A photo of a queue: you count ${n} people with an error of about ±${sd}. Which interval is best?`, right: `[${opt.join(', ')}]`, wrong: [[`[${one.join(', ')}]`, '± one error misses about a third of the time'], [`[${wide.join(', ')}]`, 'panic width'], [`[${n}, ${n}]`, 'a point on an uncertain count']], explain: `Two errors each way, a little more above: [${opt.join(', ')}].` }, rng); } },
      far: mc({ q: `Outside the OA: a delivery is due about ${FAR.m} minutes after noon, give or take ${FAR.sd} (one SD). You must give a window [L, U] in minutes after noon, scored L ÷ U if it arrives inside. Which window is best?`, right: `[${Math.floor(FAR.b.lo)}, ${Math.ceil(FAR.b.hi)}]`, wrong: [[`[${FAR.m - FAR.sd}, ${FAR.m + FAR.sd}]`, '± one SD misses about a third of the time'], [`[${FAR.m - 25}, ${FAR.m + 15}]`, 'leans low: a lower window has a worse ratio'], [`[${FAR.m / 2}, ${FAR.m * 2}]`, 'panic width']], explain: `An absolute error again: two SDs each way, leaning high: [${dec(FAR.b.lo, 1)}, ${dec(FAR.b.hi, 1)}].` }),
      principle: mc({ q: 'Which idea carried over from coins to the delivery window?', right: 'Absolute error: two SDs each way, lean high', wrong: [['Count the smaller side, then subtract', 'a counting trick; the window had nothing to count'], ['A percent band, estimate ×/÷ a factor', 'that is for proportional errors, not a fixed ± error'], ['Zero width once counted carefully', 'the arrival time is uncertain']], explain: 'Both errors are a fixed size in units, so the best band spans about two SDs each way and leans high.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'dots-count', section: 'iv', count: 3 },
  ],
};
