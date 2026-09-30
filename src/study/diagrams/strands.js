// Interleaved sequence split into its strands (positions 1,3,5,... and 2,4,6,...).
// spec: { terms: [...], k?: 2, labels?: [..], next?: value (continuation, on the strand it belongs to) }
import { fmt } from './_util.js';
import { h } from '../../ui/dom.js';

export function validate(spec) {
  const k = spec?.k ?? 2;
  if (!Array.isArray(spec?.terms) || spec.terms.length < 2 * k) return [`strands: need at least ${2 * k} terms`];
  if (spec.labels && spec.labels.length !== k) return ['strands: labels length must equal k'];
  return [];
}

export function render(spec) {
  const k = spec.k ?? 2;
  const all = spec.next != null ? [...spec.terms, spec.next] : spec.terms;
  const row = (idx) => h('div', { class: 'dg-strand-row' }, all.map((v, i) => h('span', { class: `dg-strand-cell${i % k === idx ? ` dg-strand-${idx + 1}` : ' dg-strand-off'}${spec.next != null && i === all.length - 1 && i % k === idx ? ' dg-pred' : ''}` }, i % k === idx ? fmt(v) : '·')));
  return h('div', { class: 'dg-strands', role: 'img', 'aria-label': spec.label || `Sequence split into ${k} strands` },
    h('div', { class: 'dg-strand-row' }, all.map((v, i) => h('span', { class: `dg-strand-cell dg-strand-${(i % k) + 1}${spec.next != null && i === all.length - 1 ? ' dg-pred' : ''}` }, fmt(v)))),
    ...Array.from({ length: k }, (_, j) => h('div', {}, h('div', { class: 'dg-caption-note' }, spec.labels?.[j] || `strand ${j + 1}: positions ${j + 1}, ${j + 1 + k}, ${j + 1 + 2 * k}, …`), row(j))));
}
