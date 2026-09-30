import { h as el, s } from '../dom.js';
import { W, root, frame, text, line, fmtTick, niceTicks } from './bar.js';

// Scatter plot with optional reference lines.
// spec: {
//   type: 'scatter',
//   title?: string,
//   xLabel: string, yLabel: string,
//   points: [[x, y], ...],
//   xDomain?: [lo, hi], yDomain?: [lo, hi],   // default: nice range around the data
//   lines?: [ { x: number, label?: string }          // vertical line
//           | { y: number, label?: string }          // horizontal line
//           | { slope: number, intercept: number, label?: string } ],  // y = slope * x + intercept
// }
// Gridlines sit on every integer tick so points can be counted against integer thresholds.
export default function scatter(spec) {
  const pts = spec.points;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const xd = spec.xDomain || [Math.min(...xs), Math.max(...xs)];
  const yd = spec.yDomain || [Math.min(...ys), Math.max(...ys)];
  const label = `${spec.title || 'Scatter plot'} of ${pts.length} points, ${spec.xLabel} from ${fmtTick(Math.min(...xs))} to ${fmtTick(Math.max(...xs))}, ${spec.yLabel} from ${fmtTick(Math.min(...ys))} to ${fmtTick(Math.max(...ys))}.${(spec.lines || []).map((l) => ` Reference line ${'x' in l ? `x = ${l.x}` : 'y' in l ? `y = ${l.y}` : `y = ${l.slope}x + ${l.intercept}`}.`).join('')}`;
  const h = 380;
  const svg = root(W, h, label);
  const yt = niceTicks(yd[0], yd[1], 8);
  const f = frame({ h, title: spec.title, xLabel: spec.xLabel, yLabel: spec.yLabel, yTicks: yt.ticks });
  const xt = niceTicks(xd[0], xd[1], 10);
  const sx = (v) => f.x0 + ((v - xt.lo) / (xt.hi - xt.lo)) * (f.x1 - f.x0);
  const out = [];
  for (const t of xt.ticks) {
    out.push(line(sx(t), f.y1, sx(t), f.y0, 'stroke: var(--border); stroke-width: 1'));
    out.push(text(sx(t), f.y0 + 20, fmtTick(t), { strong: true }));
  }
  for (const l of spec.lines || []) {
    let a, b;
    if ('x' in l) { a = [l.x, yt.lo]; b = [l.x, yt.hi]; }
    else if ('y' in l) { a = [xt.lo, l.y]; b = [xt.hi, l.y]; }
    else {
      // Intersect y = m x + c with the plotting box.
      const m = l.slope, c = l.intercept, eps = 1e-9, cand = [];
      for (const x of [xt.lo, xt.hi]) { const y = m * x + c; if (y >= yt.lo - eps && y <= yt.hi + eps) cand.push([x, y]); }
      if (m) for (const y of [yt.lo, yt.hi]) { const x = (y - c) / m; if (x >= xt.lo - eps && x <= xt.hi + eps) cand.push([x, y]); }
      if (cand.length < 2) continue;
      cand.sort((p, q) => p[0] - q[0]);
      a = cand[0]; b = cand[cand.length - 1];
    }
    out.push(line(sx(a[0]), f.sy(a[1]), sx(b[0]), f.sy(b[1]), 'stroke: var(--viz-2); stroke-width: 2; stroke-dasharray: 6 4'));
    if (l.label) out.push(text(sx(b[0]) - 4, f.sy(b[1]) + ('x' in l ? 14 : -6), l.label, { anchor: 'end', strong: true }));
  }
  for (const [x, y] of pts) out.push(s('circle', { cx: sx(x).toFixed(1), cy: f.sy(y).toFixed(1), r: 4, style: 'fill: var(--viz-1); fill-opacity: 0.85; stroke: var(--surface); stroke-width: 1' }));
  out.push(line(f.x0, f.y0, f.x1, f.y0, 'stroke: var(--text-2); stroke-width: 1'));
  svg.append(...f.g, ...out);
  return el('figure', { class: 'visual visual-scatter' }, svg);
}
