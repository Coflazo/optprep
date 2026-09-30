// Order book ladder for one instrument: bids (you sell into) and asks (you buy from).
// spec: { instrument, levels: [{ bid, bidQty?, ask, askQty? }], note? }
// validate: bid < ask on every level; bids fall and asks rise going down the book.
import { fmt } from './_util.js';
import { h } from '../../ui/dom.js';

export function validate(spec) {
  const e = [];
  const L = spec?.levels;
  if (!Array.isArray(L) || !L.length) return ['book: levels required'];
  L.forEach((l, i) => { if (!(l.bid < l.ask)) e.push(`book: level ${i} bid must be below ask`); if (i && !(l.bid <= L[i - 1].bid && l.ask >= L[i - 1].ask)) e.push(`book: level ${i} out of order`); });
  if (L[0] && !(L[0].bid < L[0].ask)) e.push('book: crossed top of book');
  return e;
}

export function render(spec) {
  return h('figure', { class: 'dg-book', role: 'img', 'aria-label': spec.label || `Order book for ${spec.instrument}` },
    h('table', {}, h('caption', {}, spec.instrument),
      h('thead', {}, h('tr', {}, h('th', {}, 'Bid qty'), h('th', {}, 'Bid (you sell)'), h('th', {}, 'Ask (you buy)'), h('th', {}, 'Ask qty'))),
      h('tbody', {}, spec.levels.map((l, i) => h('tr', { class: i === 0 ? 'dg-top' : '' },
        h('td', { class: 'num' }, l.bidQty ?? ''), h('td', { class: 'num dg-bid' }, fmt(l.bid)), h('td', { class: 'num dg-ask' }, fmt(l.ask)), h('td', { class: 'num' }, l.askQty ?? ''))))),
    h('div', { class: 'dg-caption-note' }, spec.note || `Spread at the top: ${fmt(spec.levels[0].ask - spec.levels[0].bid)}. Buying costs the ask; selling earns the bid.`));
}
