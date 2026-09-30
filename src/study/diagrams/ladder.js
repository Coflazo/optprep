// Difference (or ratio) ladder for sequences: each row is the differences of the row above.
// spec: { mode: 'diff' | 'ratio', rows: [[terms], [d1], [d2], ...], predicted?: true (last entry of each row is the continuation) }
// validate: every row is exactly the differences (ratios) of the row above; exact for "a/b" strings.
import { toQ, toNum, fmt } from './_util.js';
import { h } from '../../ui/dom.js';

export function validate(spec) {
  const e = [];
  const rows = spec?.rows;
  if (!Array.isArray(rows) || rows.length < 2) return ['ladder: at least 2 rows'];
  for (let k = 1; k < rows.length; k++) {
    const up = rows[k - 1], row = rows[k];
    if (row.length !== up.length - 1) { e.push(`ladder: row ${k} must be one shorter`); continue; }
    row.forEach((v, j) => {
      const a = toQ(up[j]), b = toQ(up[j + 1]), q = toQ(v);
      if (a && b && q) {
        const want = spec.mode === 'ratio' ? (a.isZero() ? null : b.div(a)) : b.sub(a);
        if (!want || !want.eq(q)) e.push(`ladder: row ${k} entry ${j} is ${v}, expected ${want?.toString()}`);
      } else {
        const want = spec.mode === 'ratio' ? toNum(up[j + 1]) / toNum(up[j]) : toNum(up[j + 1]) - toNum(up[j]);
        if (Math.abs(want - toNum(v)) > 1e-9 * Math.max(1, Math.abs(want))) e.push(`ladder: row ${k} entry ${j} is ${v}, expected ${want}`);
      }
    });
  }
  return e;
}

// Staggered HTML ladder: each difference sits between the two numbers it comes from.
export function render(spec) {
  const n = spec.rows[0].length;
  const cols = 2 * n - 1;
  const grid = h('div', { class: 'dg-ladder', role: 'img', 'aria-label': spec.label || `${spec.mode === 'ratio' ? 'Ratio' : 'Difference'} ladder`, style: { gridTemplateColumns: `repeat(${cols}, minmax(28px, auto))` } });
  spec.rows.forEach((row, k) => {
    const name = k === 0 ? 'terms' : spec.mode === 'ratio' ? `×${k === 1 ? '' : k}` : `Δ${k === 1 ? '' : k}`;
    row.forEach((v, j) => {
      const pred = spec.predicted && j === row.length - 1;
      grid.append(h('span', { class: `dg-ladder-cell${pred ? ' dg-pred' : ''}${k === spec.rows.length - 1 ? ' dg-last-row' : ''}`, style: { gridColumn: `${k + 2 * j + 1} / span 1`, gridRow: `${k + 1}` }, title: name }, fmt(v)));
    });
  });
  return h('div', { class: 'dg-ladder-wrap' }, grid, h('div', { class: 'dg-caption-note' }, spec.mode === 'ratio' ? 'Each row: next term ÷ previous term.' : 'Each row: next number minus previous number.' + (spec.predicted ? ' Outlined cells are the continuation.' : '')));
}
