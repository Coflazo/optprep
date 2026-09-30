// Probability tree, drawn left to right.
// spec: { root: { label, children: [{ p: '1/6', label, mark?: true, children?: [...] }] }, total?: '11/36', showProducts?: true }
// validate: every set of branches sums to exactly 1; if `total` is given it must equal
// the sum of path products over marked leaves.
import { svg, text, line, toQ, toNum, textW } from './_util.js';
import { Q } from '../../core/rational.js';
import { s } from '../../ui/dom.js';

export function validate(spec) {
  const e = [];
  let marked = Q.of(0);
  let exact = true;
  const walk = (node, prod, path) => {
    const kids = node.children || [];
    if (!kids.length) { if (node.mark) { if (prod) marked = marked.add(prod); else exact = false; } return; }
    let sum = Q.of(0), sumN = 0, allQ = true;
    for (const c of kids) {
      const q = toQ(c.p);
      if (q) sum = sum.add(q); else allQ = false;
      sumN += toNum(c.p);
      if (!(toNum(c.p) >= 0 && toNum(c.p) <= 1)) e.push(`tree: probability ${c.p} out of range at ${path}`);
      walk(c, q && prod ? prod.mul(q) : null, `${path}/${c.label}`);
    }
    if (allQ ? !sum.eq(Q.of(1)) : Math.abs(sumN - 1) > 1e-9) e.push(`tree: branches at ${path || 'root'} sum to ${allQ ? sum.toString() : sumN}, not 1`);
  };
  if (!spec?.root) return ['tree: root missing'];
  walk(spec.root, Q.of(1), '');
  if (spec.total != null) {
    const t = toQ(spec.total);
    if (!exact || !t) e.push('tree: total needs exact fractions throughout');
    else if (!marked.eq(t)) e.push(`tree: marked leaves sum to ${marked.toString()}, total says ${spec.total}`);
  }
  return e;
}

export function render(spec) {
  const leaves = [];
  const rowH = 34, padX = 60, gap = 90;
  const labW = (n) => (n.label ? textW(n.label) + 16 : 8);
  // Column x positions: each column is as wide as its widest label plus room for the branch.
  const colW = [];
  const measure = (n, d) => { colW[d] = Math.max(colW[d] || 0, d === 0 ? 8 : labW(n)); (n.children || []).forEach((c) => measure(c, d + 1)); };
  measure(spec.root, 0);
  const xs = [padX];
  for (let d = 1; d < colW.length; d++) xs[d] = xs[d - 1] + colW[d - 1] + gap;
  const place = (n, d, prod) => {
    const kids = n.children || [];
    n._x = xs[d]; n._prod = prod; n._d = d;
    if (!kids.length) { n._y = leaves.length * rowH + 28; leaves.push(n); return; }
    kids.forEach((c) => { const q = toQ(c.p); place(c, d + 1, prod && q ? prod.mul(q) : null); });
    n._y = (kids[0]._y + kids[kids.length - 1]._y) / 2;
  };
  place(spec.root, 0, Q.of(1));
  const prodLabel = (n) => n.product || (n._prod ? n._prod.toString() : '');
  const showP = spec.showProducts !== false;
  const leafEnd = Math.max(...leaves.map((n) => n._x + labW(n)));
  const prodW = showP ? Math.max(...leaves.map((n) => textW(prodLabel(n)))) : 0;
  const W = leafEnd + (showP ? 28 + prodW : 0) + 8;
  const H = leaves.length * rowH + (spec.total != null ? 48 : 24);
  const parts = [];
  const hasMark = (n) => n.mark || (n.children || []).some(hasMark);
  const draw = (n) => {
    // Branches start after the node's label, so a line never crosses text.
    const x0 = n === spec.root ? n._x + 6 : n._x + labW(n);
    for (const c of n.children || []) {
      parts.push(line(x0, n._y, c._x - 6, c._y, hasMark(c) ? 'dg-line dg-strong' : 'dg-line'));
      parts.push(text((x0 + c._x) / 2, (n._y + c._y) / 2 + (c._y > n._y ? 11 : -9), String(c.p), { class: 'dg-text dg-small dg-mono' }));
      draw(c);
    }
    parts.push(s('circle', { cx: n._x, cy: n._y, r: 4, class: n.mark ? 'dg-dot dg-mark' : 'dg-dot' }));
    if (n !== spec.root) parts.push(text(n._x + 10, n._y, n.label, { 'text-anchor': 'start' }));
    else parts.push(text(n._x - 10, n._y, n.label || '', { 'text-anchor': 'end' }));
    if (!(n.children || []).length && showP) parts.push(text(W - 8, n._y, prodLabel(n), { 'text-anchor': 'end', class: `dg-text dg-mono ${n.mark ? 'dg-strong-text' : 'dg-muted'}` }));
  };
  draw(spec.root);
  if (spec.total != null) parts.push(text(W - 8, H - 14, `marked total = ${spec.total}`, { 'text-anchor': 'end', class: 'dg-text dg-mono dg-strong-text' }));
  return svg(W, H, spec.label || 'Probability tree', ...parts);
}
