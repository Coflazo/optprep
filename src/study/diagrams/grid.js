// Sample-space grid, e.g. the 36 outcomes of two dice.
// spec: { rows, cols, rowLabels?, colLabels?, rowTitle?, colTitle?, cellText?: [[...]], highlight: [[r, c]], count?: n }
// validate: indices in range, no duplicates, count equals the number highlighted.
import { svg, text, rect } from './_util.js';

export function validate(spec) {
  const e = [];
  const { rows, cols, highlight = [] } = spec || {};
  if (!(Number.isInteger(rows) && Number.isInteger(cols) && rows > 0 && cols > 0 && rows <= 20 && cols <= 20)) return ['grid: rows/cols must be 1..20'];
  const seen = new Set();
  for (const [r, c] of highlight) {
    if (!(r >= 0 && r < rows && c >= 0 && c < cols)) e.push(`grid: cell ${r},${c} out of range`);
    const k = `${r},${c}`; if (seen.has(k)) e.push(`grid: duplicate ${k}`); seen.add(k);
  }
  if (spec.count != null && spec.count !== highlight.length) e.push(`grid: count ${spec.count} but ${highlight.length} highlighted`);
  if (spec.cellText && (spec.cellText.length !== rows || spec.cellText.some((r) => r.length !== cols))) e.push('grid: cellText dims');
  return e;
}

export function render(spec) {
  const cs = 34, ox = 58, oy = 46;
  const W = ox + spec.cols * cs + 16, H = oy + spec.rows * cs + 34;
  const hl = new Set((spec.highlight || []).map(([r, c]) => `${r},${c}`));
  const parts = [];
  if (spec.colTitle) parts.push(text(ox + (spec.cols * cs) / 2, 12, spec.colTitle, { class: 'dg-text dg-muted' }));
  if (spec.rowTitle) parts.push(text(14, oy + (spec.rows * cs) / 2, spec.rowTitle, { class: 'dg-text dg-muted', transform: `rotate(-90 14 ${oy + (spec.rows * cs) / 2})` }));
  for (let c = 0; c < spec.cols; c++) parts.push(text(ox + c * cs + cs / 2, oy - 12, spec.colLabels?.[c] ?? c + 1, { class: 'dg-text dg-mono' }));
  for (let r = 0; r < spec.rows; r++) {
    parts.push(text(ox - 14, oy + r * cs + cs / 2, spec.rowLabels?.[r] ?? r + 1, { class: 'dg-text dg-mono' }));
    for (let c = 0; c < spec.cols; c++) {
      const on = hl.has(`${r},${c}`);
      parts.push(rect(ox + c * cs + 1, oy + r * cs + 1, cs - 2, cs - 2, on ? 'dg-cell dg-cell-on' : 'dg-cell', 3));
      const t = spec.cellText?.[r]?.[c];
      if (t != null) parts.push(text(ox + c * cs + cs / 2, oy + r * cs + cs / 2, t, { class: `dg-text dg-small dg-mono${on ? ' dg-strong-text' : ''}` }));
    }
  }
  parts.push(text(ox, H - 12, `${(spec.highlight || []).length} of ${spec.rows * spec.cols} highlighted`, { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `Grid of ${spec.rows * spec.cols} outcomes, ${(spec.highlight || []).length} highlighted`, ...parts);
}
