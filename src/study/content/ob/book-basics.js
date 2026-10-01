// Orderbooks 0: the opening foundation lesson. Bid, ask and spread, crossed books, pricing a
// bundle from its legs, position and cash bookkeeping, flat positions and single packages.
// This file also exports the helpers every Orderbooks lesson shares, so every price shown in the
// book is computed here, never typed by hand. Definitions match the trainer: the checker
// (src/core/check.js) solves a board when the trades are flat and the cash is > 0; the solver
// (src/sections/ob/solver.js) shows the most profitable flat package that does not split into
// two smaller flat packages.
import { SECTION_TITLES } from '../../schema.js';
import { SECTIONS } from '../../../../config/sections.js';

export const sec = (key, title) => ({ type: 'section', key, title: title ?? SECTION_TITLES[key] });
export const OB = SECTIONS.ob.exam;
export const TARGET = SECTIONS.ob.target.value;
export const PER_BOARD = OB.totalSeconds / OB.count;
export const PENALTY = OB.wrongSubmitPenaltySeconds;

export const r6 = (x) => Math.round(x * 1e6) / 1e6;
// Prices sit on 0.5 ticks and print with one decimal ("40.5", "−3.0"); anything else prints as is.
export const px = (x) => { const v = r6(x), a = Math.abs(v); return `${v < 0 ? '−' : ''}${Number.isInteger(a * 2) ? a.toFixed(1) : String(a)}`; };
// A price used after a minus sign: wrapped in brackets when negative, "5.0 − (−2.0)".
export const pxp = (x) => (r6(x) < 0 ? `(${px(x)})` : px(x));
export const quote = (c) => `${px(c.bid)} / ${px(c.ask)}`;
export const hp = (rng, lo, hi) => rng.int(lo * 2, hi * 2) / 2;
export const cap = (s) => s[0].toUpperCase() + s.slice(1);

// A card: one row of the board. legs = units of each product inside it, e.g. [1, 1] for A + B.
export const card = (name, legs, bid, ask) => ({ name, legs, bid, ask });
export const price = (c, side) => (side === 'buy' ? c.ask : c.bid);
// A signed piece of a replica: qty units of card c (negative = sold).
export const part = (c, qty = 1) => ({ card: c, name: c.name, qty, bid: c.bid, ask: c.ask });
// Cost of buying a replica (pay asks on + parts, receive bids on − parts) and value of selling it.
export const buyCost = (parts) => r6(parts.reduce((s, p) => s + (p.qty >= 0 ? p.qty * p.ask : p.qty * p.bid), 0));
export const sellValue = (parts) => r6(parts.reduce((s, p) => s + (p.qty >= 0 ? p.qty * p.bid : p.qty * p.ask), 0));
export const edgeSell = (c, parts) => r6(c.bid - buyCost(parts)); // sell the card, buy the replica
export const edgeBuy = (c, parts) => r6(sellValue(parts) - c.ask); // buy the card, sell the replica

// Spec for the `bundle` diagram; its validator recomputes every stated number.
export function bundleSpec(c, parts, label) {
  return {
    bundle: { name: c.name, bid: c.bid, ask: c.ask },
    legs: parts.map((p) => ({ name: p.name, qty: p.qty, bid: p.bid, ask: p.ask })),
    stated: { legsAsk: buyCost(parts), legsBid: sellValue(parts), profit: Math.max(0, edgeSell(c, parts), edgeBuy(c, parts)) },
    ...(label ? { label } : {}),
  };
}

// trades: [[card, 'buy' | 'sell']]. Net units per product and the cash they lock in.
export function outcome(trades, n) {
  const net = Array(n).fill(0);
  let cash = 0;
  for (const [c, side] of trades) { const g = side === 'buy' ? 1 : -1; c.legs.forEach((q, k) => { net[k] += g * q; }); cash += side === 'buy' ? -c.ask : c.bid; }
  return { net, cash: r6(cash), flat: net.every((x) => x === 0) };
}
// Spec for the `ledger` diagram; its validator re-runs the totals.
export function ledgerSpec(products, trades, label) {
  const o = outcome(trades, products.length);
  return { products, rows: trades.map(([c, side]) => ({ text: c.name, side, price: price(c, side), legs: c.legs })), stated: { cash: o.cash, flat: o.flat }, ...(label ? { label } : {}) };
}
export const tradeText = (trades) => trades.map(([c, side]) => `${side} ${c.name} at ${px(price(c, side))}`).join(', ');
// Same, with repeated trades grouped: "buy 2 × A at 20.5".
export const tradeTextN = (trades) => {
  const out = [];
  for (const [c, side] of trades) { const last = out[out.length - 1]; if (last && last.c === c && last.side === side) last.n += 1; else out.push({ c, side, n: 1 }); }
  return out.map(({ c, side, n }) => `${side} ${n > 1 ? `${n} × ` : ''}${c.name} at ${px(price(c, side))}`).join(', ');
};
export const posText = (products, net) => products.map((p, k) => `${p} ${net[k] > 0 ? '+' : net[k] < 0 ? '−' : ''}${Math.abs(net[k])}`).join(', ');
// One package: the card one way, every part of its replica the other way (weights repeat, minus signs flip).
export function packageOf(c, parts, sellCard) {
  const out = [[c, sellCard ? 'sell' : 'buy']];
  for (const p of parts) { const side = (p.qty > 0) === sellCard ? 'buy' : 'sell'; for (let k = 0; k < Math.abs(p.qty); k++) out.push([p.card, side]); }
  return out;
}
export const flip = (trades) => trades.map(([c, side]) => [c, side === 'buy' ? 'sell' : 'buy']);

// Choice question: the right option plus [value, false belief] wrong options. Duplicates are
// dropped; with an rng the right answer lands in a random slot, otherwise at `at`.
export function mc({ q, right, wrong = [], explain, hints, at = 0 }, rng) {
  const seen = new Set([String(right)]);
  const opts = [];
  for (const [v, trap] of wrong) { if (seen.has(String(v)) || opts.length >= 5) continue; seen.add(String(v)); opts.push({ v: String(v), trap }); }
  const pos = rng ? rng.int(0, opts.length) : Math.min(at, opts.length);
  opts.splice(pos, 0, { v: String(right) });
  const out = { type: 'choice', q, options: opts.map((o) => o.v), answer: pos, explain };
  const traps = {};
  opts.forEach((o, i) => { if (o.trap) traps[i] = o.trap; });
  if (Object.keys(traps).length) out.traps = traps;
  if (hints) out.hints = hints;
  return out;
}

// Single products quoted around distinct fair values on the 0.5 grid.
export function singles(rng, names, lo = 20, hi = 120, halves = [0.5, 1]) {
  const used = new Set();
  return names.map((n, k) => {
    let v; do { v = hp(rng, lo, hi); } while (used.has(v)); used.add(v);
    const h = rng.pick(halves);
    return card(n, names.map((_, j) => (j === k ? 1 : 0)), v - h, v + h);
  });
}
// A card mispriced against its replica by e after every spread: rich (bid above the replica's
// cost) or cheap (ask below the replica's value). The other side stays unprofitable.
export function mispriced(name, legs, parts, rich, e, hs) {
  if (rich) { const bid = r6(buyCost(parts) + e); return card(name, legs, bid, r6(bid + 2 * hs)); }
  const ask = r6(sellValue(parts) - e); return card(name, legs, r6(ask - 2 * hs), ask);
}
export const boardText = (cards) => cards.map((c) => `${c.name} ${quote(c)}`).join('; ');

// ---------------------------------------------------------------- lesson data
const A0 = card('A', [1, 0], 40, 40.5), B0 = card('B', [0, 1], 60, 60.5);
const AB = card('A + B', [1, 1], 101.5, 102);            // the challenge board: rich by 0.5
const ABfair = card('A + B', [1, 1], 100.5, 101.5);      // no arbitrage either way
const legs0 = [part(A0), part(B0)];
const richPkg = packageOf(AB, legs0, true);
const V1 = card('A (venue 1)', [1], 99.5, 100), V2 = card('A (venue 2)', [1], 100.5, 101);
const venueTrades = [[V1, 'buy'], [V2, 'sell']];
const shop = { buys: 200, sells: 250 };
const book = { instrument: 'A', levels: [{ bid: 99.5, ask: 100 }, { bid: 99, ask: 100.5 }, { bid: 98.5, ask: 101 }] };

// ---------------------------------------------------------------- generators
function crossedQ(rng) {
  const v = hp(rng, 20, 150), h1 = rng.pick([0.5, 1]), h2 = rng.pick([0.5, 1]), e = rng.pick([0.5, 1, 1.5]);
  const lo = { bid: v - h1, ask: v + h1 }, hi = { bid: v + h1 + e, ask: v + h1 + e + 2 * h2 };
  const up = rng.chance(0.5), cheap = up ? 1 : 2, rich = 3 - cheap;
  const Q = { [cheap]: lo, [rich]: hi };
  return mc({
    q: `A is quoted on two venues (bid / ask). Venue 1: ${px(Q[1].bid)} / ${px(Q[1].ask)}. Venue 2: ${px(Q[2].bid)} / ${px(Q[2].ask)}. Which trades lock in a profit?`,
    right: `Buy on venue ${cheap} at ${px(Q[cheap].ask)}, sell on venue ${rich} at ${px(Q[rich].bid)}`,
    wrong: [
      [`Buy on venue ${rich} at ${px(Q[rich].ask)}, sell on venue ${cheap} at ${px(Q[cheap].bid)}`, 'bought on the dear venue and sold on the cheap one: that pays for both spreads'],
      [`Buy on venue ${cheap} at ${px(Q[cheap].bid)}, sell on venue ${rich} at ${px(Q[rich].ask)}`, 'swapped the sides: you buy at the ask and sell at the bid, never at the other price'],
      ['No trade: on each venue the bid is below the ask', 'checked each venue alone: the arbitrage is across venues, one venue\'s bid above the other venue\'s ask'],
    ],
    explain: `Venue ${rich}'s bid ${px(Q[rich].bid)} is above venue ${cheap}'s ask ${px(Q[cheap].ask)}. Buy one there, sell one here: flat, cash +${px(e)}.`,
  }, rng);
}

function bundleBoard(rng, rich) {
  const [a, b] = singles(rng, ['A', 'B'], 20, 120);
  if (rich == null) rich = rng.chance(0.5);
  const parts = [part(a), part(b)], e = rng.pick([0.5, 1, 1.5]);
  const ab = mispriced('A + B', [1, 1], parts, rich, e, rng.pick([0.5, 1]));
  return { a, b, ab, parts, rich, e };
}

function bundleTradeQ(rng) {
  const { a, b, ab, parts, rich, e } = bundleBoard(rng);
  const pkg = packageOf(ab, parts, rich);
  const partial = pkg.slice(0, 2);
  const allSame = [[ab, rich ? 'sell' : 'buy'], [a, rich ? 'sell' : 'buy'], [b, rich ? 'sell' : 'buy']];
  return mc({
    q: `Board (bid / ask): A ${quote(a)}; B ${quote(b)}; A + B ${quote(ab)}. Which trades lock in a profit?`,
    right: cap(tradeText(pkg)),
    wrong: [
      [cap(tradeText(flip(pkg))), rich ? 'bought the bundle: its ask is above what the legs sell for, so this loses' : 'sold the bundle: its bid is below what the legs cost, so this loses'],
      [cap(tradeText(partial)), `left one leg open: you end ${rich ? 'short' : 'long'} one B, so nothing is locked in`],
      [cap(tradeText(allSame)), `${rich ? 'sold' : 'bought'} everything: the legs must go the opposite way to the bundle to end flat`],
      ['No trade: the bundle is fairly priced', rich ? 'compared the wrong sides: the bundle bid clears what the legs cost at their asks, and that is all a trade needs' : 'compared the wrong sides: the bundle ask is below what the legs sell for at their bids, and that is all a trade needs'],
    ],
    explain: rich
      ? `Legs cost ${px(a.ask)} + ${px(b.ask)} = ${px(buyCost(parts))} at the asks; the bundle bid ${px(ab.bid)} is higher. Sell the bundle, buy the legs: +${px(e)}.`
      : `Legs sell for ${px(a.bid)} + ${px(b.bid)} = ${px(sellValue(parts))} at the bids; the bundle ask ${px(ab.ask)} is lower. Buy the bundle, sell the legs: +${px(e)}.`,
  }, rng);
}

function bundleProfitQ(rng) {
  const { a, b, ab, parts, rich, e } = bundleBoard(rng);
  return {
    type: 'number',
    q: `Board (bid / ask): A ${quote(a)}; B ${quote(b)}; A + B ${quote(ab)}. One package of trades locks in a profit. How much?`,
    answer: e,
    hints: ['Price the legs together on both sides: their bids added, and their asks added.', rich ? 'Compare the bundle bid with the legs\' asks added up.' : 'Compare the bundle ask with the legs\' bids added up.'],
    explain: rich
      ? `Sell A + B at ${px(ab.bid)}, buy A at ${px(a.ask)} and B at ${px(b.ask)}: ${px(ab.bid)} − ${px(buyCost(parts))} = ${px(e)}.`
      : `Buy A + B at ${px(ab.ask)}, sell A at ${px(a.bid)} and B at ${px(b.bid)}: ${px(sellValue(parts))} − ${px(ab.ask)} = ${px(e)}.`,
  };
}

function ledgerCashQ(rng) {
  const { a, b, ab, parts, rich } = bundleBoard(rng);
  const pkg = rng.shuffle(packageOf(ab, parts, rich));
  const o = outcome(pkg, 2);
  return {
    type: 'number',
    q: `Trades, one unit each: ${tradeText(pkg)}. What cash do they lock in?`,
    answer: o.cash,
    hints: ['Each buy subtracts the price you paid; each sell adds the price you received.', `Add the sells, subtract the buys: ${pkg.map(([c, s]) => `${s === 'buy' ? '−' : '+'}${px(price(c, s))}`).join(' ')}.`],
    explain: `${pkg.map(([c, s], i) => `${s === 'buy' ? (i ? '− ' : '−') : (i ? '+ ' : '')}${px(price(c, s))}`).join(' ')} = ${px(o.cash)}, and the position is flat.`,
  };
}

function netQ(rng) {
  const { a, b, ab } = bundleBoard(rng);
  const sellFirst = rng.chance(0.5);
  const trades = sellFirst ? [[ab, 'sell'], [a, 'buy']] : [[ab, 'buy'], [b, 'sell']];
  const o = outcome(trades, 2);
  const wrongSign = o.net.map((x) => -x);
  return mc({
    q: `You ${tradeText(trades)}. What is your position now?`,
    right: posText(['A', 'B'], o.net),
    wrong: [
      [posText(['A', 'B'], wrongSign), 'flipped the signs: a buy adds units of every product in the card, a sale removes them'],
      ['Flat', 'two trades are not automatically flat: count each product'],
      [posText(['A', 'B'], sellFirst ? [-1, -1] : [1, 1]), `ignored the ${sellFirst ? 'buy of A' : 'sale of B'}: it cancels one leg of the bundle`],
    ],
    explain: `${sellFirst ? 'Selling A + B gives A −1, B −1; buying A brings A back to 0.' : 'Buying A + B gives A +1, B +1; selling B brings B back to 0.'} Left: ${posText(['A', 'B'], o.net)}.`,
  }, rng);
}

function legsAskQ(rng, buy) {
  const [a, b] = singles(rng, ['A', 'B'], 20, 120);
  const parts = [part(a), part(b)];
  return {
    type: 'number',
    q: `A ${quote(a)}, B ${quote(b)} (bid / ask). ${buy ? 'What does it cost to buy one A and one B?' : 'How much do you receive for selling one A and one B?'}`,
    answer: buy ? buyCost(parts) : sellValue(parts),
    hints: [buy ? 'Buying pays the ask.' : 'Selling receives the bid.', buy ? `${px(a.ask)} + ${px(b.ask)}.` : `${px(a.bid)} + ${px(b.bid)}.`],
    explain: buy ? `Asks: ${px(a.ask)} + ${px(b.ask)} = ${px(buyCost(parts))}.` : `Bids: ${px(a.bid)} + ${px(b.bid)} = ${px(sellValue(parts))}.`,
  };
}

const flatOpts = (() => {
  const onlySell = outcome([[AB, 'sell']], 2), oneLeg = outcome([[AB, 'sell'], [A0, 'buy']], 2), wrongWay = outcome(flip(richPkg), 2), good = outcome(richPkg, 2);
  return { onlySell, oneLeg, wrongWay, good };
})();

export default {
  id: 'ob/book-basics',
  book: 'ob',
  kind: 'foundation',
  title: 'Book basics: bids, asks, bundles and flat positions',
  summary: 'Buy at the ask, sell at the bid; price a bundle from its legs on the side you trade; submit only flat with cash above zero.',
  prerequisites: [],
  objectives: [
    'Say which price you pay and which you receive on any card, and what the spread costs you',
    'Spot a crossed book: one venue\'s bid above another venue\'s ask for the same product',
    'Price a bundle from its legs both ways (legs\' bid and legs\' ask) and run the arbitrage check in both directions',
    'Keep a ledger of position and cash, and explain why a board counts only when you end flat with positive cash',
  ],
  blocks: [
    sec('recognise', 'What a board looks like'),
    { type: 'challenge', q: `Before any teaching. A board shows three cards, each with two prices written sell price / buy price: A ${quote(A0)}; B ${quote(B0)}; A + B ${quote(AB)}. Each tap trades one unit. Find trades that leave you holding nothing at the end and still make money. Try two approaches, then write the trades and the profit.`, answer: `${cap(tradeText(richPkg))}: profit ${px(outcome(richPkg, 2).cash)}.`, explain: `If you added ${px(A0.bid)} + ${px(B0.bid)} = ${px(sellValue(legs0))} and compared it with the bundle, or bought the bundle, keep that attempt. The lesson shows which price each trade really uses, and why the answer is the bundle's ${px(AB.bid)} against the legs' ${px(buyCost(legs0))}.` },
    { type: 'text', text: `The Orderbooks task gives you **${OB.count} boards** on one clock of **${OB.totalSeconds / 60} minutes**. A board is a list of **cards**: single products (A, B, C, D), and **bundles** that hold several products at once, such as A + B, 2A + B or A − B. Each card shows two prices. You tap prices to trade one unit at a time, then submit.` },
    { type: 'text', text: `A board counts as solved when your trades leave you holding **nothing** in every product (flat) and your cash is **above zero**. A wrong submit costs **${PENALTY} seconds**; you can then fix the trades and resubmit, or skip. The trainer's bar is ${TARGET} of ${OB.count} boards.` },
    { type: 'check', scope: 'the task format above', questions: [
      { type: 'number', q: `${OB.count} boards share one ${OB.totalSeconds / 60}-minute clock. How many seconds is that per board on average?`, answer: PER_BOARD, hints: ['Convert the clock to seconds first.', `${OB.totalSeconds} seconds shared by ${OB.count} boards.`], explain: `${OB.totalSeconds} ÷ ${OB.count} = ${PER_BOARD} seconds.` },
      mc({ q: 'Which submission solves a board?', right: 'Trades that leave every product flat with cash above zero',
        wrong: [['The most profitable trades on the board, and nothing less', 'any flat position with positive cash counts; you do not need the maximum'], ['Any trades whose cash is above zero', 'cash with an open position is not locked in: the position must be flat too'], ['Flat trades, even with zero cash', 'zero cash is no profit: it must be above zero']],
        explain: 'Solved = flat in every product and cash > 0. Nothing else is scored.' }),
    ] },

    sec('why', 'Why it matters'),
    { type: 'text', text: `Every Orderbooks board is the same skill in a new costume: find two ways to hold the same thing at two different prices, buy the cheap one, sell the dear one. That needs three habits that this lesson builds: know which price each tap uses, price a bundle from its parts, and count your position to zero before you submit. With about ${PER_BOARD} seconds a board, these must be automatic.` },

    sec('anchor', 'Start from what you know: the two prices of a shop'),
    { type: 'text', text: `A second-hand phone shop buys a phone from you for ${shop.buys} and sells you the same phone for ${shop.sells}. You always get the **lower** price when you sell and pay the **higher** one when you buy; the gap of ${shop.sells - shop.buys} is how the shop earns.` },
    { type: 'text', text: 'An order book is that shop with **one change**: the two prices come from other traders. The **bid** is the highest price anyone will pay, so it is where **you sell**. The **ask** (or offer) is the lowest price anyone will sell at, so it is where **you buy**. The gap, ask − bid, is the **spread**.' },
    { type: 'check', scope: 'bid, ask and spread', questions: [
      { make: (rng) => { const [a] = singles(rng, ['A'], 20, 150, [0.5, 1, 1.5]); return mc({ q: `A card reads A ${quote(a)} (bid / ask). You want to buy one A. Which price do you pay?`, right: px(a.ask),
        wrong: [[px(a.bid), 'swapped the sides: the bid is where you sell'], [px((a.bid + a.ask) / 2), 'the mid is not a price anyone trades at'], [px(a.ask - a.bid), 'that is the spread, not a price']],
        explain: `Buying takes the lowest offer: the ask, ${px(a.ask)}.` }, rng); } },
      { make: (rng) => { const [a] = singles(rng, ['A'], 20, 150, [0.5, 1, 1.5]); return { type: 'number', q: `A ${quote(a)}. You buy one A and sell it straight back. How much do you lose?`, answer: r6(a.ask - a.bid), hints: ['You pay the ask, then receive the bid.', `${px(a.ask)} − ${px(a.bid)}.`], explain: `Pay ${px(a.ask)}, receive ${px(a.bid)}: you lose the spread, ${px(a.ask - a.bid)}.` }; } },
    ] },
    { type: 'diagram', diagram: 'book', spec: book, caption: `A book for A. The top row is the best bid (${px(book.levels[0].bid)}) and best ask (${px(book.levels[0].ask)}); worse prices sit below. Each card on a board is the top row of a book like this.` },
    { type: 'text', text: 'On a single book the bid is always **below** the ask. So buying and selling the same card never makes money: it pays the spread. Every profit on a board comes from **two different cards** that deliver the same thing.' },
    { type: 'check', scope: 'reading the book', questions: [
      { type: 'number', q: 'In the book above, what is the spread at the top?', answer: r6(book.levels[0].ask - book.levels[0].bid), explain: `${px(book.levels[0].ask)} − ${px(book.levels[0].bid)} = ${px(book.levels[0].ask - book.levels[0].bid)}.` },
      mc({ q: 'You tap the same card twice: buy one, then sell one. What is the result?', right: 'Flat, with a loss of one spread',
        wrong: [['Flat, with zero profit', 'the two taps use different prices: ask in, bid out'], ['Flat, with a profit of one spread', 'you pay the higher price and receive the lower one'], ['Long one unit', 'the sale cancels the buy']],
        explain: 'You pay the ask and receive the bid, which is lower.' }),
    ] },

    sec('crossed', 'Two books for one product: a crossed market'),
    { type: 'text', text: `Now let A trade on two venues. Venue 1: ${quote(V1)}. Venue 2: ${quote(V2)}. Venue 2 will **pay** ${px(V2.bid)}, and venue 1 will **sell** at ${px(V1.ask)}. Buy one on venue 1, sell it on venue 2: you hold nothing and keep ${px(outcome(venueTrades, 1).cash)}. A bid above another book's ask for the same thing is called **crossed**.` },
    { type: 'diagram', diagram: 'numberline', spec: { min: 99, max: 101.5, step: 0.5, marks: [{ x: V1.bid, label: 'V1 bid' }, { x: V1.ask, label: 'V1 ask' }, { x: V2.bid, label: 'V2 bid' }, { x: V2.ask, label: 'V2 ask' }] }, caption: `Four prices on one line. Venue 2's bid (${px(V2.bid)}) sits to the right of venue 1's ask (${px(V1.ask)}): buy at the left one, sell at the right one.` },
    { type: 'check', scope: 'crossed venues', questions: [{ hinge: true, make: crossedQ }] },
    { type: 'text', text: `If venue 2's bid only **equals** venue 1's ask, buying and selling earns exactly 0. Zero is not a profit, so a touching market is not an arbitrage.` },
    { type: 'check', scope: 'touching is not crossed', questions: [
      { make: (rng) => { const v = hp(rng, 30, 140), h = rng.pick([0.5, 1]); const touch = rng.chance(0.5); const b2 = v + h + (touch ? 0 : rng.pick([0.5, 1])); const yes = `Yes: buy on venue 1 at ${px(v + h)}, sell on venue 2 at ${px(b2)}`, no = `No: selling at ${px(b2)} after buying at ${px(v + h)} earns exactly 0`; return mc({ q: `Venue 1: A ${px(v - h)} / ${px(v + h)}. Venue 2: A ${px(b2)} / ${px(b2 + 1)}. Is there an arbitrage?`, right: touch ? no : yes,
        wrong: touch ? [[yes, 'a zero profit is not a profit']] : [[no, `the bid ${px(b2)} is strictly above the ask ${px(v + h)}`]],
        explain: touch ? `${px(b2)} − ${px(v + h)} = 0: nothing to lock in.` : `${px(b2)} − ${px(v + h)} = ${px(b2 - v - h)} > 0.` }, rng); } },
    ] },

    sec('ledger', 'Bookkeeping: position and cash'),
    { type: 'text', text: 'Keep two running totals. **Position**: for each product, +1 for every unit you bought, −1 for every unit you sold. **Cash**: a buy subtracts the ask you paid, a sell adds the bid you received.' },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A'], venueTrades), caption: `The crossed trade in a ledger. After the buy you are long one A and down ${px(V1.ask)}; the sale on venue 2 brings A back to 0 and the cash to +${px(outcome(venueTrades, 1).cash)}.` },
    { type: 'check', scope: 'cash in a ledger', questions: [{ make: ledgerCashQ }] },
    { type: 'text', text: 'A bundle card moves **several products in one tap**. Selling one A + B is −1 A and −1 B at once, at the bundle\'s bid. The ledger below is the challenge board solved.' },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B'], richPkg), caption: `Sell A + B (A −1, B −1), buy A (A back to 0), buy B (B back to 0). Every column ends at 0 and the cash is +${px(outcome(richPkg, 2).cash)}.` },
    { type: 'check', scope: 'position after a bundle trade', questions: [{ make: netQ }] },

    sec('flat', 'Why every position must end flat'),
    { type: 'text', text: 'Suppose you sell A + B and stop. Your cash is large, but you owe one A and one B. What that costs you depends on prices you do not control. **Flat** means every product nets to 0: nothing is owed, nothing is held, so the cash cannot change any more. That is what "locked in" means, and it is the only kind of profit a board accepts.' },
    { type: 'check', scope: 'flat and cash > 0', questions: [
      mc({ q: `Board: A ${quote(A0)}; B ${quote(B0)}; A + B ${quote(AB)}. Which submission solves it?`, right: 'Sell A + B, buy A, buy B',
        wrong: [['Sell A + B only', `cash +${px(flatOpts.onlySell.cash)}, but short one A and one B: nothing is locked in`], ['Sell A + B, buy A', `cash +${px(flatOpts.oneLeg.cash)}, but still short one B: not flat`], ['Buy A + B, sell A, sell B', `flat, but the cash is ${px(flatOpts.wrongWay.cash)}: a locked-in loss`]],
        explain: `Only "sell A + B, buy A, buy B" is flat with cash above zero: +${px(flatOpts.good.cash)}.` }),
    ] },
    { type: 'text', text: 'One more definition, so the solutions make sense. Doing the same profitable trades twice is also flat and profitable, and it solves the board too, but it is one idea repeated. The solution the trainer shows is the most profitable **single package**: a flat set of trades that cannot be split into two smaller flat sets. Extra copies only cost taps and time.' },
    { type: 'check', scope: 'a single package', questions: [
      mc({ q: 'Which of these is one single package (flat, and impossible to split into two smaller flat sets)?', right: 'Sell A + B, buy A, buy B',
        wrong: [['Sell A + B twice, buy A twice, buy B twice', 'two copies of one package: it splits into two flat halves (it still solves a board, but it is not one package)'], ['Buy A on venue 1, sell A on venue 2, sell A + B, buy A, buy B', 'two separate arbitrages glued together: the venue pair is flat on its own'], ['Sell A + B, buy A', 'not flat: short one B, so it is no package at all']],
        explain: 'Remove any trade from "sell A + B, buy A, buy B" and it is no longer flat; no smaller flat set hides inside it.' }),
    ] },

    sec('bundle', 'Pricing a bundle from its legs'),
    { type: 'text', text: `A + B holds one A and one B, its **legs**. You can build it yourself: buying one A and one B costs the **asks** added, ${px(A0.ask)} + ${px(B0.ask)} = ${px(buyCost(legs0))}. You can also take it apart: selling one A and one B earns the **bids** added, ${px(A0.bid)} + ${px(B0.bid)} = ${px(sellValue(legs0))}. So the legs together have their own bid and ask.` },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(ABfair, legs0), caption: `A + B quoted ${quote(ABfair)} against its legs. The last row is the legs together: ${px(sellValue(legs0))} if you sell them, ${px(buyCost(legs0))} if you buy them. The bundle's bid is below the legs' ask and its ask is above the legs' bid, so nothing is crossed.` },
    { type: 'check', scope: 'the legs\' bid and ask', questions: [{ make: (rng) => legsAskQ(rng, true) }, { make: (rng) => legsAskQ(rng, false) }] },
    { type: 'text', text: 'The arbitrage check is the crossed-market check applied to the bundle and its legs, in both directions:' },
    { type: 'formula', text: 'sell the bundle, buy the legs: edge = bundle bid − legs\' ask     |     buy the bundle, sell the legs: edge = legs\' bid − bundle ask' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(AB, legs0), caption: `The challenge board. The bundle bid ${px(AB.bid)} is above the legs' ask ${px(buyCost(legs0))}: sell the bundle, buy the legs, edge ${px(edgeSell(AB, legs0))}. The other direction gives ${px(edgeBuy(AB, legs0))}: a loss.` },
    { type: 'check', scope: 'the arbitrage check both ways', questions: [{ hinge: true, make: bundleTradeQ }, { make: bundleProfitQ }] },

    sec('derivation', 'Derivation, one move at a time'),
    { type: 'text', text: 'Why is the edge exactly "bundle bid − legs\' ask"? Run the ledger on the challenge board, one trade at a time.' },
    { type: 'steps', steps: [
      { say: `Sell one A + B at its bid, ${px(AB.bid)}. Cash +${px(AB.bid)}; position A −1, B −1.`, why: 'Selling a card that holds one A and one B makes you short one of each.',
        checks: [mc({ q: 'After selling one A + B, what is your position?', right: 'A −1, B −1',
          wrong: [['A +1, B +1', 'selling makes you short, not long'], ['A 0, B 0: the bundle is its own product', 'a bundle is not a separate product: it moves A and B'], ['A −1, B 0', 'the bundle holds both legs']], explain: 'One A + B out means one A and one B out.' })] },
      { say: `Buy one A at its ask, ${px(A0.ask)}. Cash falls to ${px(AB.bid - A0.ask)}; A is back to 0.`, why: 'Buying pays the ask, and +1 A cancels −1 A.',
        checks: [{ type: 'number', q: `After selling A + B at ${px(AB.bid)} and buying A at ${px(A0.ask)}, what is your cash?`, answer: r6(AB.bid - A0.ask), hints: ['Sells add, buys subtract.', `${px(AB.bid)} − ${px(A0.ask)}.`], explain: `${px(AB.bid)} − ${px(A0.ask)} = ${px(AB.bid - A0.ask)}.` }] },
      { say: `Buy one B at its ask, ${px(B0.ask)}. B is back to 0, so you are flat. Cash: ${px(outcome(richPkg, 2).cash)}.`, why: 'Every product nets to zero, so the cash is locked in.',
        checks: [mc({ q: 'After the third trade, is the position flat?', right: 'Yes: A 0 and B 0', wrong: [['No: you still hold the bundle', 'you sold the bundle; its legs were bought back one by one']], explain: 'Each product was sold once (inside the bundle) and bought once.' })] },
      { say: `Collect the terms: cash = bid(A + B) − ask(A) − ask(B) = bundle bid − legs' ask. Profit exactly when the bundle bid is above the legs' ask.`, why: 'Buying both legs costs the legs\' ask, so this is the sell-the-bundle edge.',
        checks: [{ make: (rng) => { const { a, b, ab, parts } = bundleBoard(rng, true); return { type: 'number', q: `A ${quote(a)}, B ${quote(b)}, A + B ${quote(ab)}. Edge of selling the bundle and buying the legs?`, answer: edgeSell(ab, parts), hints: ['Bundle bid minus the legs\' ask.', `${px(ab.bid)} − (${px(a.ask)} + ${px(b.ask)}).`], explain: `${px(ab.bid)} − ${px(buyCost(parts))} = ${px(edgeSell(ab, parts))}.` }; } }] },
      { say: 'The mirror: buy the bundle at its ask, sell A and B at their bids. Cash = legs\' bid − bundle ask.', why: 'Every sign flips: you now receive the two bids and pay one ask.',
        checks: [{ make: (rng) => { const { a, b, ab, parts: p } = bundleBoard(rng, false); return { type: 'number', q: `A ${quote(a)}, B ${quote(b)}, A + B ${quote(ab)}. Edge of buying the bundle and selling the legs?`, answer: edgeBuy(ab, p), hints: ['Legs\' bid minus the bundle ask.', `(${px(a.bid)} + ${px(b.bid)}) − ${px(ab.ask)}.`], explain: `${px(sellValue(p))} − ${px(ab.ask)} = ${px(edgeBuy(ab, p))}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'In your own words: when you sell the bundle, why do you compare its bid with the legs\' asks, and not with their bids or mid prices?', model: 'Selling the bundle leaves me short both legs, so I must buy them, and buying pays the ask. The bundle sale receives its bid. The profit is what I actually receive minus what I actually pay, so bid against asks. Bids or mids are prices I would not get.', points: ['Selling the bundle makes you short the legs, so you buy them', 'Buying pays the ask; selling receives the bid', 'Mid prices are never traded, so they cannot measure profit'] },
    { type: 'check', scope: 'the derivation', questions: [
      mc({ q: 'You buy a bundle and sell its legs. Which prices enter your cash?', right: 'The bundle ask and the legs\' bids',
        wrong: [['The bundle bid and the legs\' asks', 'that is the other direction: selling the bundle'], ['The bundle ask and the legs\' asks', 'you sell the legs, so you receive their bids'], ['The mid prices of all three', 'mids are not tradable']], explain: 'Buy = ask, sell = bid, card by card.' }),
    ] },

    sec('predict'),
    { type: 'predict', question: 'If every spread on a board doubled (bids lower, asks higher, mid prices unchanged), would you find more arbitrages or fewer?', answer: 'Fewer. Every edge is a bid minus asks (or bids minus an ask); wider spreads lower every bid and raise every ask, so every edge shrinks.', explain: 'Spreads are the cost of trading. A gap between mid prices only pays if it is bigger than all the half-spreads you cross.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'You buy at the bid because it is the lower price.', fix: 'The bid is what buyers offer you: you sell there. You buy at the ask.' },
      { belief: 'Compare mid prices to find a mispriced bundle.', fix: 'Mids are never traded. Compare the bundle bid with the legs\' ask, or the legs\' bid with the bundle ask.' },
      { belief: 'Positive cash with an open position is a profit.', fix: 'Until every product nets to 0, the cash still depends on future prices. Only flat cash is locked in.' },
      { belief: 'A zero edge counts.', fix: 'The board needs cash strictly above zero.' },
      { belief: 'A bundle is its own product, so selling it does not touch A or B.', fix: 'A bundle is its legs: selling A + B is −1 A and −1 B.' },
    ] },
    { type: 'erroneous', problem: `A candidate checks the board A ${quote(A0)}; B ${quote(B0)}; A + B ${quote(ABfair)}. One step is wrong.`, steps: [
      `The legs' bids are ${px(A0.bid)} and ${px(B0.bid)}, together ${px(sellValue(legs0))}.`,
      `Selling A + B at ${px(ABfair.bid)} and buying the legs earns ${px(ABfair.bid)} − ${px(sellValue(legs0))} = ${px(ABfair.bid - sellValue(legs0))}.`,
      'That is positive, so sell A + B, buy A, buy B.',
      'Each product nets to 0: submit.',
    ], errorStep: 1, explain: `Buying the legs pays their **asks**: ${px(A0.ask)} + ${px(B0.ask)} = ${px(buyCost(legs0))}. The real edge is ${px(ABfair.bid)} − ${px(buyCost(legs0))} = ${px(edgeSell(ABfair, legs0))}, a loss, and the other direction gives ${px(edgeBuy(ABfair, legs0))}. No bundle trade here: this submit would cost ${PENALTY} seconds.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: `A candidate says: "A + B's mid is above the legs' mids, so sell A + B and buy the legs." What is wrong?`, right: 'Mids never trade: use the bundle bid and the legs\' ask',
        wrong: [['Nothing: a higher mid means the bundle is rich', 'a mid gap can vanish once you cross every spread'], ['The direction: a higher mid means buy A + B', 'the direction is not the issue; the prices are'], ['They should compare the bundle ask with the legs\' bid', 'that is the check for buying the bundle; they want to sell it']], explain: 'Profit is measured at executable prices only.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Budget: ${OB.totalSeconds} seconds for ${OB.count} boards is ${PER_BOARD} seconds each. A wrong submit burns ${PENALTY} seconds, so count each product's net to 0 **before** you submit. To reach ${TARGET} of ${OB.count} you can afford to miss only ${OB.count - TARGET}.` },
    { type: 'callout', tone: 'speed', text: 'Scan order on every board: (1) the same product on two venues: best bid against best ask; (2) each bundle: its bid against the legs\' asks added, its ask against the legs\' bids added. Add the legs once each way and keep both totals in your head.' },
    { type: 'check', scope: 'the time budget and the scan', questions: [
      { type: 'number', q: `How many boards can you miss and still reach ${TARGET} of ${OB.count}?`, answer: OB.count - TARGET, explain: `${OB.count} − ${TARGET} = ${OB.count - TARGET}.` },
      mc({ q: 'What is the last thing to do before pressing submit?', right: 'Check that every product nets to 0',
        wrong: [['Check that the cash is as large as possible', 'any positive flat package solves the board'], ['Add one more copy of the package', 'copies only cost taps and time'], ['Nothing: the board checks it for you', `a wrong submit costs ${PENALTY} seconds`]], explain: 'Flat and cash > 0 is the whole scoring rule; the net per product is the part people get wrong.' }),
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Buy at the ask, sell at the bid. A card is mispriced when its bid beats its replica bought at the asks, or its ask undercuts its replica sold at the bids. Submit only flat, with cash > 0.' },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: crossedQ }, { make: bundleTradeQ }, { make: ledgerCashQ }] },
  ],
};
