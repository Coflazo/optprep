// A bundle priced against its legs: what the legs cost to buy / earn to sell versus the bundle's quote.
// spec: { bundle: { name, bid, ask }, legs: [{ name, qty, bid, ask }], stated?: { legsAsk?, legsBid?, profit? } }
// validate: bid < ask everywhere; stated leg totals (and any stated arbitrage profit) match the arithmetic.
import { fmt, near } from './_util.js';
import { h } from '../../ui/dom.js';

export const legsCost = (legs) => ({
  buy: legs.reduce((a, l) => a + (l.qty >= 0 ? l.qty * l.ask : l.qty * l.bid), 0),   // pay asks (receive bids on negative legs)
  sell: legs.reduce((a, l) => a + (l.qty >= 0 ? l.qty * l.bid : l.qty * l.ask), 0),  // receive bids (pay asks on negative legs)
});

export function arbitrage(spec) {
  const { buy, sell } = legsCost(spec.legs);
  const sellBundle = spec.bundle.bid - buy;   // buy legs, sell bundle
  const buyBundle = sell - spec.bundle.ask;   // buy bundle, sell legs
  return { buyLegs: buy, sellLegs: sell, sellBundle, buyBundle, best: Math.max(sellBundle, buyBundle, 0) };
}

export function validate(spec) {
  const e = [];
  if (!spec?.bundle || !Array.isArray(spec.legs) || !spec.legs.length) return ['bundle: bundle and legs required'];
  for (const x of [spec.bundle, ...spec.legs]) if (!(x.bid < x.ask)) e.push(`bundle: ${x.name} bid must be below ask`);
  const a = arbitrage(spec);
  if (spec.stated?.legsAsk != null && !near(spec.stated.legsAsk, a.buyLegs)) e.push(`bundle: legs cost ${a.buyLegs} to buy, stated ${spec.stated.legsAsk}`);
  if (spec.stated?.legsBid != null && !near(spec.stated.legsBid, a.sellLegs)) e.push(`bundle: legs earn ${a.sellLegs} to sell, stated ${spec.stated.legsBid}`);
  if (spec.stated?.profit != null && !near(spec.stated.profit, a.best)) e.push(`bundle: best profit ${a.best}, stated ${spec.stated.profit}`);
  return e;
}

export function render(spec) {
  const a = arbitrage(spec);
  const leg = (l) => `${l.qty === 1 ? '' : l.qty === -1 ? '−' : l.qty} ${l.name}`.trim();
  return h('figure', { class: 'dg-bundle', role: 'img', 'aria-label': spec.label || `${spec.bundle.name} priced from its legs` },
    h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', {}, 'Bid (sell)'), h('th', {}, 'Ask (buy)'))),
      h('tbody', {},
        h('tr', { class: 'dg-top' }, h('td', {}, h('strong', {}, spec.bundle.name)), h('td', { class: 'num dg-bid' }, fmt(spec.bundle.bid)), h('td', { class: 'num dg-ask' }, fmt(spec.bundle.ask))),
        spec.legs.map((l) => h('tr', {}, h('td', {}, leg(l)), h('td', { class: 'num' }, fmt(l.bid)), h('td', { class: 'num' }, fmt(l.ask)))),
        h('tr', { class: 'dg-sum' }, h('td', {}, 'Legs together'), h('td', { class: 'num' }, fmt(a.sellLegs)), h('td', { class: 'num' }, fmt(a.buyLegs))))),
    h('div', { class: 'dg-caption-note' },
      a.sellBundle > 1e-9 ? `Buy the legs for ${fmt(a.buyLegs)}, sell ${spec.bundle.name} at ${fmt(spec.bundle.bid)}: +${fmt(a.sellBundle)}.`
        : a.buyBundle > 1e-9 ? `Buy ${spec.bundle.name} at ${fmt(spec.bundle.ask)}, sell the legs for ${fmt(a.sellLegs)}: +${fmt(a.buyBundle)}.`
          : `No arbitrage: ${spec.bundle.name}'s bid ${fmt(spec.bundle.bid)} ≤ legs' ask ${fmt(a.buyLegs)} and its ask ${fmt(spec.bundle.ask)} ≥ legs' bid ${fmt(a.sellLegs)}.`));
}
