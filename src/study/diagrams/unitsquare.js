// Unit square with shaded regions (uniform random points, broken sticks).
// spec: { regions: [{ points: [[x, y], ...], label?, area?: '1/4' | number, tone?: 1..5 }], xLabel?, yLabel? }
// validate: vertices inside [0,1]^2; a stated area matches the polygon area (shoelace).
import { svg, text, line, toNum } from './_util.js';
import { s } from '../../ui/dom.js';

export const polygonArea = (pts) => Math.abs(pts.reduce((a, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return a + x * y2 - x2 * y; }, 0)) / 2;

export function validate(spec) {
  const e = [];
  if (!Array.isArray(spec?.regions) || !spec.regions.length) return ['unitsquare: regions missing'];
  spec.regions.forEach((r, i) => {
    if (!Array.isArray(r.points) || r.points.length < 3) { e.push(`unitsquare: region ${i} needs 3+ points`); return; }
    if (r.points.some(([x, y]) => !(x >= 0 && x <= 1 && y >= 0 && y <= 1))) e.push(`unitsquare: region ${i} leaves the square`);
    if (r.area != null && Math.abs(polygonArea(r.points) - toNum(r.area)) > 1e-9) e.push(`unitsquare: region ${i} area ${polygonArea(r.points)} but says ${r.area}`);
  });
  return e;
}

export function render(spec) {
  const W = 320, H = 320, o = 40, L = 250;
  const px = (x) => o + x * L, py = (y) => o + (1 - y) * L - 10;
  const parts = [s('rect', { x: o, y: o - 10, width: L, height: L, class: 'dg-box' })];
  spec.regions.forEach((r, i) => {
    parts.push(s('polygon', { points: r.points.map(([x, y]) => `${px(x)},${py(y)}`).join(' '), class: `dg-region dg-tone-${r.tone || (i % 5) + 1}` }));
    if (r.label) { const cx = r.points.reduce((a, p) => a + p[0], 0) / r.points.length, cy = r.points.reduce((a, p) => a + p[1], 0) / r.points.length; parts.push(text(px(cx), py(cy), r.label, { class: 'dg-text dg-small' })); }
  });
  for (const v of [0, 0.5, 1]) { parts.push(text(px(v), o + L + 4, v, { class: 'dg-text dg-small dg-mono' })); parts.push(text(o - 14, py(v), v, { class: 'dg-text dg-small dg-mono' })); }
  if (spec.xLabel) parts.push(text(o + L / 2, H - 8, spec.xLabel, { class: 'dg-text dg-muted' }));
  if (spec.yLabel) parts.push(text(12, o + L / 2, spec.yLabel, { class: 'dg-text dg-muted', transform: `rotate(-90 12 ${o + L / 2})` }));
  parts.push(line(px(0), py(0), px(0), py(0)));
  return svg(W, H, spec.label || 'Unit square with shaded regions', ...parts);
}
