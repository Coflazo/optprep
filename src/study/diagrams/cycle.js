// Polygon / cycle walk: n vertices on a circle, walker steps to a neighbour.
// spec: { n, start?: i, target?: i, labels?: [..], highlight?: [i], note? }
import { svg, text, line } from './_util.js';
import { s } from '../../ui/dom.js';

export function validate(spec) {
  const n = spec?.n;
  if (!(Number.isInteger(n) && n >= 3 && n <= 20)) return ['cycle: n must be 3..20'];
  const e = [];
  for (const i of [spec.start, spec.target, ...(spec.highlight || [])].filter((v) => v != null)) if (!(Number.isInteger(i) && i >= 0 && i < n)) e.push(`cycle: vertex ${i} out of range`);
  if (spec.labels && spec.labels.length !== n) e.push('cycle: labels length');
  return e;
}

export function render(spec) {
  const W = 300, H = 300, cx = 150, cy = 145, R = 105;
  const P = Array.from({ length: spec.n }, (_, i) => [cx + R * Math.sin((2 * Math.PI * i) / spec.n), cy - R * Math.cos((2 * Math.PI * i) / spec.n)]);
  const parts = [];
  P.forEach(([x, y], i) => { const [x2, y2] = P[(i + 1) % spec.n]; parts.push(line(x, y, x2, y2)); });
  P.forEach(([x, y], i) => {
    const cls = i === spec.start ? 'dg-dot dg-mark' : i === spec.target ? 'dg-dot dg-target' : (spec.highlight || []).includes(i) ? 'dg-dot dg-mark' : 'dg-dot';
    parts.push(s('circle', { cx: x, cy: y, r: 13, class: cls }));
    parts.push(text(x, y, spec.labels?.[i] ?? i, { class: 'dg-text dg-small dg-mono' }));
  });
  if (spec.note) parts.push(text(cx, H - 10, spec.note, { class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `Cycle with ${spec.n} vertices`, ...parts);
}
