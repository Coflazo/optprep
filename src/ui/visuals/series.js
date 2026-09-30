import { s } from '../dom.js';

// Time series with an optional target marker (Intervals: extrapolation).
// spec: {
//   type: 'series',
//   points: [[t, y], ...],        // observations, t ascending
//   target?: number,              // time to estimate; the x axis extends to include it
//   xLabel?: string, yLabel?: string,
//   yMin?: number, yMax?: number, // optional fixed y range
//   label?: string                // aria-label
// }
const W = 480, H = 280, M = { l: 48, r: 16, t: 14, b: 34 };

function niceStep(span, n) {
  const raw = span / n, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}
const fmt = (v) => String(Number(v.toPrecision(6)));

export default function series(spec) {
  const pts = spec.points, ts = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const t0 = Math.min(...ts), t1 = Math.max(...ts, spec.target ?? -Infinity);
  let y0 = spec.yMin ?? Math.min(...ys), y1 = spec.yMax ?? Math.max(...ys);
  const pad = (y1 - y0 || 1) * 0.12;
  if (spec.yMin == null) y0 -= pad;
  if (spec.yMax == null) y1 += pad;
  const ys_ = niceStep(y1 - y0, 5), xs_ = niceStep(t1 - t0 || 1, 8);
  y0 = Math.floor(y0 / ys_) * ys_; y1 = Math.ceil(y1 / ys_) * ys_;
  const X = (t) => M.l + ((t - t0) / (t1 - t0 || 1)) * (W - M.l - M.r);
  const Y = (y) => H - M.b - ((y - y0) / (y1 - y0 || 1)) * (H - M.t - M.b);
  const axis = { fill: 'var(--text-2)', fontSize: '11px', fontFamily: 'var(--mono)' };
  const yt = [], xt = [];
  for (let v = y0; v <= y1 + 1e-9; v += ys_) yt.push(v);
  for (let v = Math.ceil(t0 / xs_) * xs_; v <= t1 + 1e-9; v += xs_) xt.push(v);
  return s('svg', { class: 'visual visual-series', viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': spec.label || 'Time series chart', preserveAspectRatio: 'xMidYMid meet', style: { maxWidth: `${W * 1.5}px`, display: 'block' } },
    s('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 6, style: { fill: 'var(--surface)', stroke: 'var(--border)' } }),
    s('g', { style: { stroke: 'var(--border)', strokeWidth: 1 } }, yt.map((v) => s('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }))),
    yt.map((v) => s('text', { x: M.l - 6, y: Y(v) + 4, 'text-anchor': 'end', style: axis }, fmt(v))),
    xt.map((v) => s('text', { x: X(v), y: H - M.b + 16, 'text-anchor': 'middle', style: axis }, fmt(v))),
    spec.xLabel ? s('text', { x: W - M.r, y: H - 6, 'text-anchor': 'end', style: axis }, spec.xLabel) : null,
    spec.target != null ? s('g', {},
      s('line', { x1: X(spec.target), x2: X(spec.target), y1: M.t, y2: H - M.b, style: { stroke: 'var(--text-2)', strokeWidth: 1.2, strokeDasharray: '4 4' } }),
      s('text', { x: X(spec.target) - 4, y: M.t + 10, 'text-anchor': 'end', style: axis }, `t = ${fmt(spec.target)}`)) : null,
    s('polyline', { points: pts.map(([t, y]) => `${X(t)},${Y(y)}`).join(' '), style: { fill: 'none', stroke: 'var(--viz-1)', strokeWidth: 1.2, strokeOpacity: 0.55 } }),
    pts.map(([t, y]) => s('circle', { cx: X(t), cy: Y(y), r: 2.6, style: { fill: 'var(--viz-1)' } })));
}
