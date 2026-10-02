// Market making: quote a two-sided market on a number nobody has seen, against a trader
// who knows part of it. Pure and seeded. Every value is exact: fair values and the other
// trader's expectations are means over every equally likely outcome, kept as fractions
// (src/core/rational.js). Nothing is simulated.
//
// The other trader, every round:
//   1. It sees part of the outcome (one die, one card, the first four flips) and computes
//      E = E[number | what it sees].
//   2. It also has a reason of its own to trade (a hedge) worth H, drawn uniformly from the
//      multiples of 1/4 in [-K, K], K set per quantity. Its value is V = E + H.
//   3. It buys your size at your ask if V > ask, sells your size at your bid if V < bid,
//      and otherwise passes. A tie passes.
// Without step 2 every market loses on average, because a trader who trades only on
// information trades only when it is right. The hedge is the flow a spread earns from.
//
// Your side (the market maker): it sells to you at your bid, so you buy (position +size);
// it buys at your ask, so you sell (position -size).
//   P&L  = position x (settlement - trade price)
//   edge = position x (fair value - trade price), the value locked in at the trade
import { Q } from '../core/rational.js';

export const ROUNDS = 8;
export const SIZES = [1, 5, 10];

const ZERO = Q.of(0);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const D6 = range(1, 6);
const an = (n) => ([8, 11, 18].includes(n) ? `an ${n}` : `a ${n}`);

// list() enumerates every equally likely outcome as { draw, value, seen }: `seen` is what
// the other trader sees. cap is the widest market allowed; hedge is K.
export const QUANTITIES = {
  dice3: {
    label: 'Sum of three dice', setup: 'Three fair dice are rolled and kept hidden.',
    botLine: 'The other trader sees one of the dice.', cap: 4, hedge: 3,
    list: () => D6.flatMap((a) => D6.flatMap((b) => D6.map((c) => ({ draw: [a, b, c], value: a + b + c, seen: a })))),
    seenText: (s) => an(s),
    drawText: (d) => `The dice were ${d.join(', ')}.`,
  },
  max2: {
    label: 'Higher of two dice', setup: 'Two fair dice are rolled and kept hidden. The number is the higher of the two.',
    botLine: 'The other trader sees one of the two dice.', cap: 2, hedge: 1.5,
    list: () => D6.flatMap((a) => D6.map((b) => ({ draw: [a, b], value: Math.max(a, b), seen: a }))),
    seenText: (s) => an(s),
    drawText: (d) => `The dice were ${d.join(' and ')}.`,
  },
  heads10: {
    label: 'Heads in ten coin flips', setup: 'A fair coin is flipped ten times out of sight.',
    botLine: 'The other trader saw the first four flips.', cap: 2, hedge: 2,
    list: () => range(0, 1023).map((m) => {
      const draw = range(0, 9).map((i) => (m >> i) & 1);
      const heads = (xs) => xs.reduce((a, b) => a + b, 0);
      return { draw, value: heads(draw), seen: heads(draw.slice(0, 4)) };
    }),
    seenText: (s) => `${s} ${s === 1 ? 'head' : 'heads'} in the first four flips`,
    drawText: (d) => `The flips were ${d.map((x) => (x ? 'H' : 'T')).join('')}.`,
  },
  cards2: {
    label: 'Sum of two cards', setup: 'Two cards are dealt face down from ten cards numbered 1 to 10.',
    botLine: 'The other trader sees one of the two cards.', cap: 6, hedge: 4,
    list: () => range(1, 10).flatMap((a) => range(1, 10).filter((b) => b !== a).map((b) => ({ draw: [a, b], value: a + b, seen: a }))),
    seenText: (s) => an(s),
    drawText: (d) => `The cards were ${d.join(' and ')}.`,
  },
};
export const IDS = Object.keys(QUANTITIES);

const cache = new Map();
const memo = (key, f) => { if (!cache.has(key)) cache.set(key, f()); return cache.get(key); };
const mean = (xs) => Q.of(xs.reduce((a, b) => a + b, 0), xs.length);

export const outcomes = (id) => memo(`o:${id}`, () => QUANTITIES[id].list());
export const fairValue = (id) => memo(`f:${id}`, () => mean(outcomes(id).map((o) => o.value)));

// What the other trader can see, with its probability p and its exact expectation e.
export const botViews = (id) => memo(`v:${id}`, () => {
  const groups = new Map();
  for (const o of outcomes(id)) {
    if (!groups.has(o.seen)) groups.set(o.seen, []);
    groups.get(o.seen).push(o.value);
  }
  const n = outcomes(id).length;
  return [...groups].map(([seen, values]) => ({ seen, p: Q.of(values.length, n), e: mean(values) }));
});
export const botExpectation = (id, seen) => botViews(id).find((v) => v.seen === seen).e;

export const hedges = (id) => memo(`h:${id}`, () => {
  const n = QUANTITIES[id].hedge * 4;
  return range(-n, n).map((k) => Q.of(k, 4));
});

// The other trader's rule, from its side: 'buy' at your ask, 'sell' at your bid, or 'pass'.
export function botDecision({ bid, ask, value }) {
  if (value.cmp(ask) > 0) return 'buy';
  if (value.cmp(bid) < 0) return 'sell';
  return 'pass';
}

// Your position and trade price after its decision.
export function fill({ action, bid, ask, size }) {
  if (action === 'buy') return { position: -size, price: ask };
  if (action === 'sell') return { position: size, price: bid };
  return { position: 0, price: null };
}

export const pnlOf = ({ position, price }, settlement) => (position ? Q.from(position).mul(Q.from(settlement).sub(price)) : ZERO);
export const edgeOf = ({ position, price }, fair) => (position ? Q.from(position).mul(fair.sub(price)) : ZERO);

// Exact expected P&L per lot of a market (bid, ask): over what the other trader sees and
// its hedge. Given what it sees, the number averages e, so a sale at the ask is worth
// ask - e and a purchase at the bid e - bid.
export function quoteValue(id, bid, ask) {
  const hs = hedges(id);
  let total = ZERO;
  for (const { p, e } of botViews(id)) {
    for (const h of hs) {
      const action = botDecision({ bid, ask, value: e.add(h) });
      if (action === 'buy') total = total.add(p.mul(ask.sub(e)));
      else if (action === 'sell') total = total.add(p.mul(e.sub(bid)));
    }
  }
  return total.div(hs.length);
}

// A typed price: "10.5", "10,5", "-3", ".25". At most two decimals. Returns a Q or null.
export function price(x) {
  if (x instanceof Q) return x;
  const t = String(x ?? '').trim().replace(',', '.').replace(/[\u2212\u2012\u2013]/g, '-');
  const m = /^(-?)(\d*)(?:\.(\d{1,2}))?$/.exec(t);
  if (!m || (!m[2] && !m[3])) return null;
  const n = BigInt(m[2] || '0') * 100n + BigInt((m[3] || '').padEnd(2, '0'));
  return new Q(m[1] ? -n : n, 100n);
}

export function checkQuote(id, { bid: b, ask: a, size }) {
  const bid = price(b), ask = price(a);
  if (!bid || !ask) return { error: 'Enter a bid and an ask as numbers with at most two decimals, like 9.5 and 11.5.' };
  if (bid.cmp(ask) >= 0) return { error: 'Your bid must be below your ask.' };
  const { cap } = QUANTITIES[id];
  if (ask.sub(bid).cmp(cap) > 0) return { error: `Your market is ${text(ask.sub(bid))} wide. The most allowed here is ${cap}.` };
  if (!SIZES.includes(size)) return { error: 'Pick a size: 1, 5 or 10.' };
  return { bid, ask, size };
}

// Display: exact decimals when the fraction has one, otherwise "about x.xx".
export const text = (q) => (100n % q.d === 0n ? String(q.toNumber()) : `about ${q.toNumber().toFixed(2)}`);
const fairText = (q) => (100n % q.d === 0n ? text(q) : `${q}, ${text(q)}`);

// Everything about one played round, as plain numbers and text for the view and the coach.
export function playRound({ id, outcome, hedge }, { bid, ask, size }) {
  const def = QUANTITIES[id];
  const fair = fairValue(id);
  const botE = botExpectation(id, outcome.seen);
  const action = botDecision({ bid, ask, value: botE.add(hedge) });
  const f = fill({ action, bid, ask, size });
  const two = Q.of(2);
  const mid = bid.add(ask).div(two), width = ask.sub(bid);
  const half = width.div(two), halfCap = Q.of(def.cap, 2);
  const es = botViews(id).map((v) => v.e.toNumber());
  return {
    id, label: def.label, cap: def.cap, size,
    bid: bid.toNumber(), ask: ask.toNumber(), mid: mid.toNumber(), width: width.toNumber(),
    fair: fair.toNumber(), fairText: fairText(fair), midError: mid.sub(fair).toNumber(),
    seen: outcome.seen, seenText: def.seenText(outcome.seen), botE: botE.toNumber(), botEText: text(botE), hedge: hedge.toNumber(),
    infoLow: Math.min(...es), infoHigh: Math.max(...es),
    action, position: f.position, price: f.price && f.price.toNumber(),
    draw: outcome.draw, drawText: def.drawText(outcome.draw), settlement: outcome.value,
    pnl: pnlOf(f, outcome.value).toNumber(), edge: edgeOf(f, fair).toNumber(),
    // Picked off: its information alone (E, without the hedge) said your price was wrong.
    pickedOff: action === 'pass' ? null : action === 'buy' ? botE.cmp(ask) > 0 : botE.cmp(bid) < 0,
    // Expected P&L per lot: your market, the same width centred on fair, full width centred on fair.
    ev: quoteValue(id, bid, ask).toNumber(),
    evCentred: quoteValue(id, fair.sub(half), fair.add(half)).toNumber(),
    evFull: quoteValue(id, fair.sub(halfCap), fair.add(halfCap)).toNumber(),
    exact: { pnl: pnlOf(f, outcome.value), edge: edgeOf(f, fair) },
  };
}

// A session: 8 rounds, each quantity twice in a seeded order. Outcomes and hedges are all
// drawn up front, so the same seed gives the same rounds whatever you quote.
export function createSession(rng) {
  const order = rng.shuffle(Array.from({ length: ROUNDS }, (_, i) => IDS[i % IDS.length]));
  const plan = order.map((id) => {
    const list = outcomes(id), hs = hedges(id);
    return { id, outcome: list[rng.int(0, list.length - 1)], hedge: hs[rng.int(0, hs.length - 1)] };
  });
  const state = { round: 0, phase: 'quote', pnl: ZERO, edge: ZERO, log: [] };

  function quote(q) {
    if (state.phase !== 'quote') return { error: 'This round is already quoted.' };
    const r = plan[state.round];
    const ok = checkQuote(r.id, q);
    if (ok.error) return ok;
    const entry = { n: state.round + 1, ...playRound(r, ok) };
    state.pnl = state.pnl.add(entry.exact.pnl);
    state.edge = state.edge.add(entry.exact.edge);
    state.log.push(entry);
    state.phase = 'reveal';
    return { entry };
  }

  function next() {
    if (state.phase !== 'reveal') return false;
    state.round += 1;
    state.phase = state.round >= ROUNDS ? 'done' : 'quote';
    return true;
  }

  function result() {
    const rounds = state.log.map((e) => ({ id: e.id, bid: e.bid, ask: e.ask, size: e.size, fair: e.fair, action: e.action, settlement: e.settlement, pnl: e.pnl, edge: e.edge, pickedOff: e.pickedOff }));
    return { pnl: state.pnl.toNumber(), edge: state.edge.toNumber(), rounds };
  }

  return {
    plan, state, quote, next, result,
    current: () => (state.phase === 'done' ? null : { id: plan[state.round].id, ...QUANTITIES[plan[state.round].id] }),
    isOver: () => state.phase === 'done',
  };
}
