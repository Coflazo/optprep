import { h as el, s } from '../dom.js';
import { W, root, frame, text, line, fmtTick } from './bar.js';

// Histogram of counts over contiguous bins.
// spec: {
//   type: 'histogram',
//   title?: string,
//   xLabel: string, yLabel: string,          // yLabel usually 'Count' or 'Days'
//   bins: [{ from: number, to: number, count: integer }],  // contiguous, ascending; bins[i].to === bins[i+1].from
//   unit?: string,                           // appended to edge labels, e.g. '%'
//   showCounts?: boolean,                    // print the count above each bar (default true)
// }
export default function histogram(spec) {
  const bins = spec.bins;
  const unit = spec.unit || '';
  const total = bins.reduce((a, b) => a + b.count, 0);
  const label = `${spec.title || 'Histogram'}. ${total} observations. ${bins.map((b) => `${b.from}${unit} to ${b.to}${unit}: ${b.count}`).join(', ')}.`;
  const h = 320;
  const svg = root(W, h, label);
  const f = frame({ h, title: spec.title, xLabel: spec.xLabel, yLabel: spec.yLabel, yLo: 0, yHi: Math.max(1, ...bins.map((b) => b.count)) });
  const lo = bins[0].from, hi = bins[bins.length - 1].to;
  const sx = (v) => f.x0 + ((v - lo) / (hi - lo)) * (f.x1 - f.x0);
  const out = [];
  for (const b of bins) {
    const xa = sx(b.from), xb = sx(b.to), y = f.sy(b.count);
    out.push(s('rect', { x: xa, y, width: Math.max(1, xb - xa - 1), height: Math.max(0, f.y0 - y), style: 'fill: var(--viz-1)' }));
    if (spec.showCounts !== false) out.push(text((xa + xb) / 2, y - 5, String(b.count), { size: 12 }));
  }
  const edges = [lo, ...bins.map((b) => b.to)];
  const every = Math.ceil(edges.length / 12);
  edges.forEach((e, i) => {
    if (i % every) return;
    out.push(line(sx(e), f.y0, sx(e), f.y0 + 5, 'stroke: var(--text-2); stroke-width: 1'));
    out.push(text(sx(e), f.y0 + 20, `${fmtTick(e)}${unit}`, { strong: true }));
  });
  out.push(line(f.x0, f.y0, f.x1, f.y0, 'stroke: var(--text-2); stroke-width: 1'));
  svg.append(...f.g, ...out);
  return el('figure', { class: 'visual visual-histogram' }, svg);
}
