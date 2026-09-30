import { ivItem, scatter } from '../lib.js';

// Visual counting under time pressure: a partly filled grid, coins on a table, or one
// shape among mixed shapes. The truth is the count of matching items in the visual spec.
const W = 420, H = 280;
const SHAPES = ['circle', 'square', 'triangle'];
const NAMES = { circle: 'circles', square: 'squares', triangle: 'triangles' };

function gridSpec(rng, fillP, mixed) {
  const cell = 26, x0 = (W - 10 * cell) / 2, y0 = (H - 10 * cell) / 2;
  const items = [];
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    if (!mixed && !rng.chance(fillP)) continue;
    items.push({ x: +(x0 + (c + 0.5) * cell).toFixed(1), y: +(y0 + (r + 0.5) * cell).toFixed(1), r: 8, shape: mixed ? rng.pick(SHAPES) : 'circle', tone: 1 });
  }
  return { type: 'dots', width: W, height: H, grid: { x: x0, y: y0, rows: 10, cols: 10, cell }, items, label: mixed ? 'A 10 by 10 grid of mixed shapes' : 'A 10 by 10 grid, some cells holding a dot' };
}

const fam = {
  id: 'dots-count',
  section: 'iv',
  title: 'Visual counting',
  skill: 'Count in blocks (rows, clusters), then size the interval to your counting error',
  levels: [1, 2, 3],
  generate(rng, { difficulty = 1 } = {}) {
    let visual, text, truth, target, sd, how;
    if (difficulty === 1) {
      visual = gridSpec(rng, rng.float(0.35, 0.8), false);
      truth = visual.items.length; target = 'circle';
      text = 'How many cells of the 10 × 10 grid contain a dot?';
      sd = 1 + 0.02 * truth;
      how = 'Count row by row (or count the empty cells if the grid is mostly full) and add.';
    } else if (difficulty === 2) {
      const n = rng.int(22, 70);
      const pts = scatter(rng, n, W, H, 26, 16);
      visual = { type: 'dots', width: W, height: H, items: pts.map(([x, y]) => ({ x, y, r: 11, shape: 'coin', tone: 2 })), label: 'Coins scattered on a table' };
      truth = n; target = 'coin';
      text = 'How many coins are on the table?';
      sd = 0.05 * n;
      how = 'Split the table into four quadrants, count each with a small cluster at a time, and add.';
    } else {
      visual = gridSpec(rng, 1, true);
      target = rng.pick(SHAPES);
      truth = visual.items.filter((i) => i.shape === target).length;
      text = `The 10 × 10 grid holds circles, squares and triangles. How many ${NAMES[target]} are there?`;
      sd = 0.06 * truth;
      how = `Count ${NAMES[target]} per row (about a third of each row) and add; the other shapes are distractors.`;
    }
    sd = Number(sd.toPrecision(2));
    return ivItem(fam, rng, difficulty, {
      text, visual, truth, unit: difficulty === 1 ? 'cells' : target === 'coin' ? 'coins' : NAMES[target],
      coach: { exact: false, belief: { kind: 'normal', sd }, note: `A careful 45-second count is typically within ±${sd} of the truth; widen by that, not by panic.` },
      steps: [
        { say: how, why: 'Block counting is faster and more reliable than counting one by one, and the blocks give a built-in check.' },
        { say: `True count: ${truth}.`, why: 'Taken from the picture itself.' },
      ],
      hints: ['Divide the picture into rows or quadrants.', 'Count one block exactly, estimate how many blocks there are, then correct.'],
      params: { scenario: difficulty === 1 ? 'grid-fill' : difficulty === 2 ? 'coins' : 'shape-count', countShape: target, items: visual.items.map((i) => [i.x, i.y, i.shape]) },
    });
  },
  // Independent check: recount matching items in the rendered spec.
  verify(item) {
    const n = item.prompt.visual.items.filter((i) => i.shape === item.params.countShape).length;
    const inBox = item.prompt.visual.items.every((i) => i.x - i.r >= 0 && i.x + i.r <= item.prompt.visual.width && i.y - i.r >= 0 && i.y + i.r <= item.prompt.visual.height);
    return { ok: n === item.truth && inBox, detail: `recounted ${n}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Reported items include a 10 × 10 grid of shapes and a table of coins. Counting fast but not perfectly, then choosing the right width, is the whole skill.',
    anchor: 'Ordinary counting, with one change: you have 60 seconds, so you trade a small known counting error for speed and cover it with interval width.',
    steps: [
      { say: 'Count in blocks: rows of a grid, quadrants of a scatter.', why: 'Blocks of 5 to 10 are counted reliably at a glance; single items are not.' },
      { say: 'For a mostly full grid, count the gaps instead and subtract from 100.', why: 'Count whichever is fewer.' },
      { say: 'Set width from your counting error (a few percent), leaning slightly high.', why: 'L/U scoring rewards a tight interval that still contains the truth.' },
    ],
    predict: { question: 'You count 47 coins and trust yourself to ±2. Which interval?', answer: 'About [45, 50]: roughly 1.3 standard deviations each side, a little more above. Score 0.9 if the truth is inside.' },
    rule: 'Count in blocks; interval ≈ count ± 1.3 × your error, nudged up.',
    contrast: 'Exact questions: zero width. Counting under time pressure: small, calibrated width. Guessing wildly wide ([20, 80]) scores 0.25 even when right.',
    edge: 'If you are certain of the count (a sparse grid, counted twice), zero width is optimal here too.',
  },
};
export default fam;
