import { h } from '../dom.js';

// spec: { type: 'table', caption?, columns: [string], rows: [[cell]], align?: ['left'|'right'] }
export default function table(spec) {
  const align = (i) => (spec.align?.[i] || (i === 0 ? 'left' : 'right'));
  return h('figure', { class: 'visual visual-table' },
    h('table', {},
      spec.caption ? h('caption', {}, spec.caption) : null,
      h('thead', {}, h('tr', {}, spec.columns.map((c, i) => h('th', { style: { textAlign: align(i) } }, c)))),
      h('tbody', {}, spec.rows.map((r) => h('tr', {}, r.map((c, i) => h('td', { style: { textAlign: align(i) } }, c)))))));
}
