import { s } from '../dom.js';

// Grid of numbers (Intervals: statistics from 200 scores).
// spec: {
//   type: 'valuegrid',
//   cols: number,                 // values fill row by row
//   values: [number, ...],
//   caption?: string,             // shown above the grid
//   label?: string                // aria-label; must not state the statistic
// }
const CW = 40, CH = 24, PAD = 8, CAP = 22;

export default function valuegrid(spec) {
  const cols = spec.cols, rows = Math.ceil(spec.values.length / cols);
  const top = spec.caption ? CAP : 0;
  const w = cols * CW + 2 * PAD, h = rows * CH + 2 * PAD + top;
  const cells = spec.values.map((v, k) => s('text', {
    x: PAD + (k % cols) * CW + CW / 2, y: top + PAD + Math.floor(k / cols) * CH + CH / 2 + 4,
    'text-anchor': 'middle', style: { fill: 'var(--text)', fontSize: '13px', fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums' },
  }, String(v)));
  const rules = [];
  for (let r = 5; r < rows; r += 5) rules.push(s('line', { x1: PAD, y1: top + PAD + r * CH, x2: w - PAD, y2: top + PAD + r * CH }));
  return s('svg', { class: 'visual visual-valuegrid', viewBox: `0 0 ${w} ${h}`, width: '100%', role: 'img', 'aria-label': spec.label || `A grid of ${spec.values.length} numbers`, preserveAspectRatio: 'xMidYMid meet', style: { maxWidth: `${w * 1.3}px`, display: 'block' } },
    s('rect', { x: 0.5, y: 0.5, width: w - 1, height: h - 1, rx: 6, style: { fill: 'var(--surface)', stroke: 'var(--border)' } }),
    spec.caption ? s('text', { x: PAD, y: 16, style: { fill: 'var(--text-2)', fontSize: '12px' } }, spec.caption) : null,
    s('g', { style: { stroke: 'var(--border)', strokeWidth: 1 } }, rules),
    cells);
}
