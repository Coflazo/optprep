import { ivItem } from '../lib.js';

// Polyline length against a scale bar. truth = (sum of segment lengths in px) / bar px × bar units.
const W = 420, H = 280;
const UNITS = [[5, 'm'], [10, 'm'], [50, 'm'], [1, 'km'], [2, 'km'], [100, 'm'], [20, 'cm']];

// Does the newest segment properly cross (or touch) any earlier non-adjacent segment?
function crossesEarlier(pts) {
  const n = pts.length - 1, [p, q] = [pts[n - 1], pts[n]];
  const orient = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  for (let i = 0; i + 1 < n - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (orient(p, q, a) !== orient(p, q, b) && orient(a, b, p) !== orient(a, b, q)) return true;
  }
  return false;
}
const segLen = (pts) => pts.slice(1).reduce((s, [x, y], i) => s + Math.hypot(x - pts[i][0], y - pts[i][1]), 0);

const fam = {
  id: 'path-length',
  section: 'iv',
  title: 'Path length from a scale bar',
  skill: 'Measure each segment in scale-bar units, round consistently, and add',
  levels: [2, 3, 4],
  generate(rng, { difficulty = 2 } = {}) {
    const nSeg = difficulty === 2 ? rng.int(3, 5) : difficulty === 3 ? rng.int(4, 6) : rng.int(7, 9);
    // A turning walk: headings change by at most 110 degrees, and no two non-adjacent
    // segments may cross, so every segment can be measured on its own.
    let pts;
    for (;;) {
      pts = [[rng.int(30, 200), rng.int(40, 200)]];
      let heading = rng.float(0, 2 * Math.PI), ok = true;
      for (let i = 0; i < nSeg && ok; i++) {
        const [x, y] = pts[pts.length - 1];
        let nx, ny;
        if (difficulty === 2) { const horiz = i % 2 === 0; const d = rng.int(30, 110) * (rng.chance(0.5) ? 1 : -1); nx = horiz ? x + d : x; ny = horiz ? y : y + d; }
        else { heading += rng.float(-1.9, 1.9); const d = rng.int(difficulty === 4 ? 25 : 35, 100); nx = Math.round(x + d * Math.cos(heading)); ny = Math.round(y + d * Math.sin(heading)); }
        if (nx < 15 || nx > W - 15 || ny < 15 || ny > H - 45) ok = false;
        else { pts.push([nx, ny]); ok = !crossesEarlier(pts); }
      }
      if (ok) break;
    }
    const [u, unit] = rng.pick(UNITS), barPx = rng.pick([40, 50, 60, 80]);
    const scale = { x: 20, y: H - 20, px: barPx, units: u, unit, label: `${u} ${unit}` };
    const visual = { type: 'path', width: W, height: H, points: pts, scale, label: 'A path drawn with a scale bar' };
    const px = segLen(pts), truth = (px / barPx) * u;
    const sd = [0, 0, 0.06, 0.08, 0.1][difficulty];
    return ivItem(fam, rng, difficulty, {
      text: `How long is the path, in ${unit}? The scale bar shows ${u} ${unit}.`, visual, truth, unit,
      coach: { exact: false, belief: { kind: 'lognormal', sd }, note: `Measuring ${nSeg} segments by eye against the bar is good to about ±${Math.round(sd * 100)}%.` },
      steps: [
        { say: `Mark off the scale bar along each of the ${nSeg} segments (fingers or a straight edge on screen) and write each length in bar units.`, why: 'Measuring each segment against the same ruler keeps errors from compounding in one direction.' },
        { say: `Total ≈ ${(px / barPx).toFixed(2)} bars × ${u} ${unit} = ${truth.toFixed(2)} ${unit}.`, why: 'Convert bar units to the stated unit at the end, once.' },
      ],
      hints: ['How many scale bars fit along the longest segment?', 'Measure every segment in bar lengths, add, then multiply by the bar value.'],
      params: { scenario: 'polyline', points: pts, barPx, barUnits: u, unit },
    });
  },
  // Independent check: recompute from the spec with a different summation order.
  verify(item) {
    const { points, scale } = item.prompt.visual;
    let px = 0;
    for (let i = points.length - 1; i > 0; i--) px += Math.sqrt((points[i][0] - points[i - 1][0]) ** 2 + (points[i][1] - points[i - 1][1]) ** 2);
    const t = (px * scale.units) / scale.px;
    return { ok: Math.abs(t - item.truth) < 1e-9 * Math.max(1, t), detail: `recomputed ${t}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'A reported item asks for the length of a drawn path against a scale bar. It is measurement, not counting, so the error is proportional to the length.',
    anchor: 'Reading a map scale: the same as converting units, with one change: you first measure the drawing in bar lengths.',
    steps: [
      { say: 'Measure each segment in bar lengths.', why: 'The bar is the only ruler on the page.' },
      { say: 'Add the segments, then multiply by the bar value.', why: 'One conversion at the end avoids rounding each segment.' },
      { say: 'Use a proportional width (about ±8% per side for a multi-segment path).', why: 'Measurement error scales with length, so the interval should too.' },
    ],
    predict: { question: 'You measure 7.5 bars and each bar is 10 m. You trust yourself to ±8%. Interval?', answer: 'About [67, 85]: 75 × e^(±0.1) with a little more room above.' },
    rule: 'Length = (bars counted) × (bar value); interval = estimate × e^(±1.3 × relative error).',
    contrast: 'Straight-line distance from start to end is shorter than the path; the question asks for the path.',
    edge: 'Diagonal segments are the trap: a diagonal across a 3 × 4 bar box is 5 bars, not 7.',
  },
};
export default fam;
