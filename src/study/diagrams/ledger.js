// Trade ledger: each trade's cash and the running net position per product.
// spec: { products: ['A','B'], rows: [{ text, side: 'buy'|'sell', price, legs: [..] }], stated?: { cash?, flat? } }
// validate: stated final cash and flatness match the running totals.
import { fmt, near } from './_util.js';
import { h } from '../../ui/dom.js';

export function run(spec) {
  const net = spec.products.map(() => 0);
  let cash = 0;
  const lines = spec.rows.map((r) => {
    const sg = r.side === 'buy' ? 1 : -1;
    r.legs.forEach((q, k) => { net[k] += sg * q; });
    cash += r.side === 'buy' ? -r.price : r.price;
    return { ...r, cash: Math.round(cash * 1e6) / 1e6, net: [...net] };
  });
  return { lines, cash: Math.round(cash * 1e6) / 1e6, flat: net.every((x) => x === 0) };
}

export function validate(spec) {
  const e = [];
  if (!Array.isArray(spec?.products) || !Array.isArray(spec?.rows) || !spec.rows.length) return ['ledger: products and rows required'];
  spec.rows.forEach((r, i) => { if (r.legs?.length !== spec.products.length) e.push(`ledger: row ${i} legs length`); if (!['buy', 'sell'].includes(r.side)) e.push(`ledger: row ${i} side`); });
  if (e.length) return e;
  const out = run(spec);
  if (spec.stated?.cash != null && !near(out.cash, spec.stated.cash)) e.push(`ledger: final cash ${out.cash}, stated ${spec.stated.cash}`);
  if (spec.stated?.flat != null && out.flat !== spec.stated.flat) e.push(`ledger: flat is ${out.flat}, stated ${spec.stated.flat}`);
  return e;
}

export function render(spec) {
  const out = run(spec);
  return h('figure', { class: 'dg-ledger', role: 'img', 'aria-label': spec.label || 'Trade ledger' },
    h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Trade'), h('th', { style: { textAlign: 'right' } }, 'Cash'), ...spec.products.map((p) => h('th', { style: { textAlign: 'right' } }, `Net ${p}`)))),
      h('tbody', {}, out.lines.map((l) => h('tr', {}, h('td', {}, `${l.side === 'buy' ? 'Buy' : 'Sell'} ${l.text} @ ${fmt(l.price)}`), h('td', { class: 'num', style: { textAlign: 'right' } }, `${l.cash >= 0 ? '+' : ''}${fmt(l.cash)}`), ...l.net.map((n) => h('td', { class: `num${n === 0 ? '' : ' dg-open'}`, style: { textAlign: 'right' } }, n > 0 ? `+${n}` : String(n))))))),
    h('div', { class: 'dg-caption-note' }, out.flat ? `Flat in every product; locked-in cash ${out.cash >= 0 ? '+' : ''}${fmt(out.cash)}.` : 'Not flat yet: a non-zero net means the cash is not locked in.'));
}
