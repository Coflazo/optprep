import { s } from '../dom.js';

// Counting picture (Intervals: coins on a table, shape grids, dice grids).
// spec: {
//   type: 'dots', width, height,                     // viewBox size in px
//   items: [{ x, y, r, shape: 'circle'|'square'|'triangle'|'coin'|'die', pips?: 1..6, tone?: 1..5 }],
//   grid?: { x, y, rows, cols, cell },               // optional faint cell lines
//   label?: string                                   // aria-label; must not state the count
// }
// Pure: positions and faces come from the spec, so what is drawn is what was scored.
const tone = (t) => `var(--viz-${t || 1})`;
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };

function shape(it) {
  const { x, y, r } = it;
  switch (it.shape) {
    case 'square': return s('rect', { x: x - r * 0.85, y: y - r * 0.85, width: r * 1.7, height: r * 1.7, style: { fill: tone(it.tone || 3) } });
    case 'triangle': return s('polygon', { points: `${x},${y - r} ${x + r * 0.95},${y + r * 0.75} ${x - r * 0.95},${y + r * 0.75}`, style: { fill: tone(it.tone || 2) } });
    case 'coin': return s('g', {},
      s('circle', { cx: x, cy: y, r, style: { fill: tone(it.tone || 2) } }),
      s('circle', { cx: x, cy: y, r: r * 0.68, style: { fill: 'none', stroke: 'var(--surface)', strokeWidth: 1.2 } }));
    case 'die': {
      const h = r, q = r * 0.5;
      return s('g', {},
        s('rect', { x: x - h, y: y - h, width: 2 * h, height: 2 * h, rx: h * 0.25, style: { fill: 'var(--surface)', stroke: 'var(--text-2)', strokeWidth: 1 } }),
        (PIPS[it.pips] || []).map(([dx, dy]) => s('circle', { cx: x + dx * q, cy: y + dy * q, r: h * 0.16, style: { fill: 'var(--text)' } })));
    }
    default: return s('circle', { cx: x, cy: y, r, style: { fill: tone(it.tone || 1) } });
  }
}

export default function dots(spec) {
  const { width: w, height: h, grid } = spec;
  const lines = [];
  if (grid) {
    for (let i = 0; i <= grid.rows; i++) lines.push(s('line', { x1: grid.x, y1: grid.y + i * grid.cell, x2: grid.x + grid.cols * grid.cell, y2: grid.y + i * grid.cell }));
    for (let j = 0; j <= grid.cols; j++) lines.push(s('line', { x1: grid.x + j * grid.cell, y1: grid.y, x2: grid.x + j * grid.cell, y2: grid.y + grid.rows * grid.cell }));
  }
  return s('svg', { class: 'visual visual-dots', viewBox: `0 0 ${w} ${h}`, width: '100%', role: 'img', 'aria-label': spec.label || 'Picture of items to count', preserveAspectRatio: 'xMidYMid meet', style: { maxWidth: `${w * 1.6}px`, display: 'block' } },
    s('rect', { x: 0.5, y: 0.5, width: w - 1, height: h - 1, rx: 6, style: { fill: 'var(--surface)', stroke: 'var(--border)' } }),
    s('g', { style: { stroke: 'var(--border)', strokeWidth: 1 } }, lines),
    spec.items.map(shape));
}
