import { h as el, s } from '../dom.js';
import { W, root, frame, text, line, fmtTick, niceTicks, col } from './bar.js';

// Probability density curves (one or more), drawn as polylines.
// spec: {
//   type: 'density',
//   title?: string,
//   xLabel: string, yLabel?: string,          // yLabel defaults to 'Density'
//   curves: [{ name: string, points: [[x, y], ...] }],   // x ascending; a jump is two points with the same x
//   shade?: [{ from: number, to: number, curve?: integer }],  // optional shaded areas under curve index (default 0)
//   xTicks?: [number],                         // explicit x ticks; default: nice ticks over the x range
// }
export default function density(spec) {
  const curves = spec.curves;
  const xs = curves.flatMap((c) => c.points.map((p) => p[0]));
  const ys = curves.flatMap((c) => c.points.map((p) => p[1]));
  const xLo = Math.min(...xs), xHi = Math.max(...xs);
  const label = `${spec.title || 'Density curves'}. ${curves.map((c) => {
    const peak = c.points.reduce((m, p) => (p[1] > m[1] ? p : m));
    return `${c.name}: spans ${fmtTick(c.points[0][0])} to ${fmtTick(c.points[c.points.length - 1][0])}, peak near ${fmtTick(peak[0])}`;
  }).join('; ')}.`;
  const h = 320;
  const svg = root(W, h, label);
  const f = frame({ h, title: spec.title, xLabel: spec.xLabel, yLabel: spec.yLabel || 'Density', yLo: 0, yHi: Math.max(...ys) * 1.05, legend: curves.map((c) => c.name) });
  const sx = (v) => f.x0 + ((v - xLo) / (xHi - xLo)) * (f.x1 - f.x0);
  const out = [];
  for (const sh of spec.shade || []) {
    const c = curves[sh.curve || 0];
    const pts = c.points.filter((p) => p[0] >= sh.from && p[0] <= sh.to);
    if (pts.length < 2) continue;
    const poly = [[pts[0][0], 0], ...pts, [pts[pts.length - 1][0], 0]].map(([x, y]) => `${sx(x).toFixed(1)},${f.sy(y).toFixed(1)}`).join(' ');
    out.push(s('polygon', { points: poly, style: `fill: ${col(sh.curve || 0)}; fill-opacity: 0.18` }));
  }
  curves.forEach((c, i) => {
    const pts = c.points.map(([x, y]) => `${sx(x).toFixed(1)},${f.sy(y).toFixed(1)}`).join(' ');
    out.push(s('polyline', { points: pts, style: `fill: none; stroke: ${col(i)}; stroke-width: 2; stroke-linejoin: round` }));
  });
  const ticks = spec.xTicks || niceTicks(xLo, xHi, 8).ticks.filter((t) => t >= xLo - 1e-9 && t <= xHi + 1e-9);
  for (const t of ticks) {
    out.push(line(sx(t), f.y0, sx(t), f.y0 + 5, 'stroke: var(--text-2); stroke-width: 1'));
    out.push(line(sx(t), f.y1, sx(t), f.y0, 'stroke: var(--border); stroke-width: 1'));
    out.push(text(sx(t), f.y0 + 20, fmtTick(t), { strong: true }));
  }
  out.push(line(f.x0, f.y0, f.x1, f.y0, 'stroke: var(--text-2); stroke-width: 1'));
  svg.append(...f.g, ...out);
  return el('figure', { class: 'visual visual-density' }, svg);
}
