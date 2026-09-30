// Venn diagram with 2 or 3 sets and a count (or probability) per region.
// spec: { sets: ['A','B'(,'C')], regions: { A, B, AB, none } | { A,B,C,AB,AC,BC,ABC,none }, total? }
// validate: exactly the right region keys, non-negative, and they add up to total.
import { svg, text, toNum } from './_util.js';
import { s } from '../../ui/dom.js';

const KEYS = { 2: ['A', 'B', 'AB', 'none'], 3: ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC', 'none'] };
export function validate(spec) {
  const n = spec?.sets?.length;
  if (n !== 2 && n !== 3) return ['venn: 2 or 3 sets'];
  const e = [];
  const keys = Object.keys(spec.regions || {}).sort();
  if (JSON.stringify(keys) !== JSON.stringify([...KEYS[n]].sort())) e.push(`venn: regions must be ${KEYS[n].join(',')}`);
  const vals = KEYS[n].map((k) => toNum(spec.regions?.[k] ?? NaN));
  if (vals.some((v) => !(v >= 0))) e.push('venn: regions must be non-negative');
  if (spec.total != null && Math.abs(vals.reduce((a, b) => a + b, 0) - toNum(spec.total)) > 1e-9) e.push(`venn: regions add to ${vals.reduce((a, b) => a + b, 0)}, total ${spec.total}`);
  return e;
}

export function render(spec) {
  const three = spec.sets.length === 3, R = 78, W = 380, H = three ? 300 : 230;
  const C = three ? [[150, 110], [230, 110], [190, 180]] : [[150, 115], [235, 115]];
  const parts = [s('rect', { x: 6, y: 6, width: W - 12, height: H - 12, rx: 6, class: 'dg-box' })];
  C.forEach(([x, y], i) => parts.push(s('circle', { cx: x, cy: y, r: R, class: `dg-set dg-set-${i + 1}` })));
  spec.sets.forEach((lab, i) => parts.push(text(C[i][0] + (i === 0 ? -R + 12 : i === 1 ? R - 12 : 0), C[i][1] + (i === 2 ? R + 14 : -R - 10), lab, { class: 'dg-text dg-strong-text' })));
  const r = spec.regions;
  const pos = three
    ? { A: [118, 92], B: [262, 92], C: [190, 222], AB: [190, 82], AC: [150, 162], BC: [230, 162], ABC: [190, 135], none: [W - 30, H - 22] }
    : { A: [118, 115], B: [268, 115], AB: [192, 115], none: [W - 30, H - 22] };
  for (const [k, [x, y]] of Object.entries(pos)) parts.push(text(x, y, r[k], { class: 'dg-text dg-mono' }));
  parts.push(text(pos.none[0] - 16, pos.none[1], 'neither', { 'text-anchor': 'end', class: 'dg-text dg-small dg-muted' }));
  if (spec.total != null) parts.push(text(24, H - 22, `total ${spec.total}`, { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `Venn diagram of ${spec.sets.join(', ')}`, ...parts);
}
