// Number line for random walks, barriers and waiting times.
// spec: { min, max, step?: 1, barriers?: [x], start?: x, target?: x, path?: [x0, x1, ...], marks?: [{ x, label }] }
// validate: everything inside [min, max]; a path moves by exactly one step each time.
import { svg, text, line } from './_util.js';
import { s } from '../../ui/dom.js';

export function validate(spec) {
  const e = [];
  const { min, max } = spec || {};
  if (!(Number.isFinite(min) && Number.isFinite(max) && max > min)) return ['numberline: min < max required'];
  const inR = (x) => x >= min && x <= max;
  for (const x of [...(spec.barriers || []), spec.start, spec.target].filter((v) => v != null)) if (!inR(x)) e.push(`numberline: ${x} outside range`);
  for (const m of spec.marks || []) if (!inR(m.x)) e.push(`numberline: mark ${m.x} outside range`);
  const st = spec.step ?? 1;
  (spec.path || []).forEach((x, i, p) => { if (!inR(x)) e.push(`numberline: path ${x} outside`); if (i && Math.abs(Math.abs(x - p[i - 1]) - st) > 1e-9) e.push(`numberline: path jump at ${i}`); });
  return e;
}

export function render(spec) {
  const W = 560, H = spec.path?.length ? 150 : 96, x0 = 30, x1 = W - 30, y = 50;
  const sx = (v) => x0 + ((v - spec.min) / (spec.max - spec.min)) * (x1 - x0);
  const st = spec.step ?? 1;
  const parts = [line(x0, y, x1, y, 'dg-line dg-strong')];
  for (let v = spec.min; v <= spec.max + 1e-9; v += st) { parts.push(line(sx(v), y - 5, sx(v), y + 5)); parts.push(text(sx(v), y + 18, Math.round(v * 1e6) / 1e6, { class: 'dg-text dg-small dg-mono' })); }
  for (const b of spec.barriers || []) { parts.push(s('rect', { x: sx(b) - 3, y: y - 22, width: 6, height: 44, class: 'dg-barrier' })); }
  if (spec.start != null) parts.push(s('circle', { cx: sx(spec.start), cy: y, r: 7, class: 'dg-dot dg-mark' }), text(sx(spec.start), y - 18, 'start', { class: 'dg-text dg-small' }));
  if (spec.target != null) parts.push(s('circle', { cx: sx(spec.target), cy: y, r: 7, class: 'dg-dot dg-target' }), text(sx(spec.target), y - 18, 'target', { class: 'dg-text dg-small' }));
  for (const m of spec.marks || []) parts.push(text(sx(m.x), y - 30, m.label, { class: 'dg-text dg-small dg-muted' }));
  if (spec.path?.length > 1) {
    const pts = spec.path.map((v, i) => `${sx(v)},${y + 46 + i * (60 / spec.path.length)}`).join(' ');
    parts.push(s('polyline', { points: pts, class: 'dg-path' }));
    parts.push(text(x0, H - 10, `one sample path, ${spec.path.length - 1} steps`, { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  }
  return svg(W, H, spec.label || `Number line from ${spec.min} to ${spec.max}`, ...parts);
}
