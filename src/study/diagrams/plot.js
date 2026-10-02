// Function plot: curves from sampled points, with markers and reference lines.
// spec: { x: { min, max, label }, y: { min, max, label }, curves: [{ label, points: [[x, y]] }], markers?: [{ x, y, label }], vlines?: [{ x, label }], hlines?: [{ y, label }] }
// validate: every point inside the axes, x increasing along each curve.
import { svg, text, line, textW } from './_util.js';
import { s } from '../../ui/dom.js';

export function validate(spec) {
  const e = [];
  const X = spec?.x, Y = spec?.y;
  if (!(X && Y && X.max > X.min && Y.max > Y.min)) return ['plot: x and y ranges required'];
  const inB = ([x, y]) => x >= X.min - 1e-9 && x <= X.max + 1e-9 && y >= Y.min - 1e-9 && y <= Y.max + 1e-9;
  (spec.curves || []).forEach((c, i) => {
    if (!Array.isArray(c.points) || c.points.length < 2) e.push(`plot: curve ${i} needs points`);
    else {
      if (!c.points.every(inB)) e.push(`plot: curve ${i} leaves the axes`);
      if (c.points.some((p, j) => j && p[0] <= c.points[j - 1][0])) e.push(`plot: curve ${i} x must increase`);
    }
  });
  for (const m of spec.markers || []) if (!inB([m.x, m.y])) e.push(`plot: marker ${m.label} outside`);
  return e;
}

export function render(spec) {
  const W = 560, H = 300, l = 56, r = 16, t = 16, b = 46;
  const sx = (x) => l + ((x - spec.x.min) / (spec.x.max - spec.x.min)) * (W - l - r);
  const sy = (y) => H - b - ((y - spec.y.min) / (spec.y.max - spec.y.min)) * (H - t - b);
  const parts = [line(l, H - b, W - r, H - b, 'dg-line dg-strong'), line(l, t, l, H - b, 'dg-line dg-strong')];
  for (let k = 0; k <= 4; k++) {
    const xv = spec.x.min + (k / 4) * (spec.x.max - spec.x.min), yv = spec.y.min + (k / 4) * (spec.y.max - spec.y.min);
    parts.push(text(sx(xv), H - b + 16, +xv.toFixed(3), { class: 'dg-text dg-small dg-mono' }), text(l - 8, sy(yv), +yv.toFixed(3), { 'text-anchor': 'end', class: 'dg-text dg-small dg-mono' }), line(l, sy(yv), W - r, sy(yv), 'dg-grid'));
  }
  (spec.vlines || []).forEach((v) => parts.push(line(sx(v.x), t, sx(v.x), H - b, 'dg-line dg-dash'), text(sx(v.x), t + 6, v.label || '', { class: 'dg-text dg-small dg-muted' })));
  (spec.hlines || []).forEach((v) => parts.push(line(l, sy(v.y), W - r, sy(v.y), 'dg-line dg-dash'), text(W - r - 4, sy(v.y) - 8, v.label || '', { 'text-anchor': 'end', class: 'dg-text dg-small dg-muted' })));
  // Point labels stay inside the frame (they flip to the left near the right edge) and step
  // down when they would land on a label already placed.
  const placed = [];
  const overlaps = (a, b2) => a[0] < b2[2] && b2[0] < a[2] && a[1] < b2[3] && b2[1] < a[3];
  const pointLabel = (x, y, str, cls) => {
    if (!str) return;
    const w = textW(str, 13);
    const right = x + 8 + w <= W - 2;
    const x0 = right ? x + 8 : x - 8;
    let y0 = y - 10;
    const box = () => (right ? [x0, y0 - 11, x0 + w, y0 + 3] : [x0 - w, y0 - 11, x0, y0 + 3]);
    for (let k = 0; k < 4 && placed.some((pb) => overlaps(pb, box())); k++) y0 += 16;
    placed.push(box());
    parts.push(text(x0, y0, str, { 'text-anchor': right ? 'start' : 'end', class: cls }));
  };
  (spec.curves || []).forEach((c, i) => {
    parts.push(s('polyline', { points: c.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' '), class: `dg-curve dg-tone-${(i % 5) + 1}` }));
    const [lx, ly] = c.points[Math.floor(c.points.length * 0.7)];
    pointLabel(sx(lx) - 2, sy(ly), c.label, `dg-text dg-small dg-tone-text-${(i % 5) + 1}`);
  });
  (spec.markers || []).forEach((m) => { parts.push(s('circle', { cx: sx(m.x), cy: sy(m.y), r: 5, class: 'dg-dot dg-mark' })); pointLabel(sx(m.x), sy(m.y), m.label, 'dg-text dg-small'); });
  if (spec.x.label) parts.push(text((l + W - r) / 2, H - 10, spec.x.label, { class: 'dg-text dg-muted' }));
  if (spec.y.label) parts.push(text(14, (t + H - b) / 2, spec.y.label, { class: 'dg-text dg-muted', transform: `rotate(-90 14 ${(t + H - b) / 2})` }));
  return svg(W, H, spec.label || `Plot of ${(spec.curves || []).map((c) => c.label).join(', ')}`, ...parts);
}
