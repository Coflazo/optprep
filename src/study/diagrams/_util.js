// Shared helpers for study diagrams. Validators are pure (Node tests); render
// functions touch the DOM only when called.
import { Q } from '../../core/rational.js';
import { s } from '../../ui/dom.js';

// Accepts numbers, integers or "a/b" strings; returns an exact Q when possible.
export function toQ(x) {
  if (x instanceof Q) return x;
  if (typeof x === 'string' && /^-?\d+\s*\/\s*\d+$/.test(x.trim())) { const [a, b] = x.split('/').map((t) => BigInt(t.trim())); return new Q(a, b); }
  if (typeof x === 'string' && /^-?\d+$/.test(x.trim())) return Q.of(Number(x));
  if (Number.isInteger(x)) return Q.of(x);
  return null;
}
export const toNum = (x) => { const q = toQ(x); return q ? q.toNumber() : Number(x); };
export const fmt = (x) => (typeof x === 'string' ? x : Number.isInteger(x) ? String(x) : String(Math.round(x * 1e4) / 1e4));
export const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
export const eqExact = (a, b) => { const qa = toQ(a), qb = toQ(b); return qa && qb ? qa.eq(qb) : near(toNum(a), toNum(b)); };

export function svg(w, h, label, ...children) {
  return s('svg', { viewBox: `0 0 ${w} ${h}`, width: w, role: 'img', 'aria-label': label, class: 'diagram', preserveAspectRatio: 'xMidYMid meet' }, ...children);
}
export const text = (x, y, str, attrs = {}) => s('text', { x, y, class: 'dg-text', 'text-anchor': 'middle', 'dominant-baseline': 'middle', ...attrs }, String(str));
export const line = (x1, y1, x2, y2, cls = 'dg-line') => s('line', { x1, y1, x2, y2, class: cls });
export const rect = (x, y, w, h, cls = 'dg-box', rx = 4) => s('rect', { x, y, width: w, height: h, rx, class: cls });
// Rough text width for layout (monospace-ish estimate at 13px).
export const textW = (str, px = 13) => String(str).length * px * 0.58;
export function wrap(str, maxChars) {
  const words = String(str).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  return lines;
}
