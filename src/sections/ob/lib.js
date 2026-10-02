// Shared board helpers for Orderbooks families. Every board is built from fair values with
// symmetric spreads, then ONE instrument (or venue) is mispriced to create the intended
// arbitrage. The exhaustive solver decides `best`; a family only keeps a board when the
// solver's best position is the one its explanation describes.
import { solve, bruteForceBest } from './solver.js';
import { positionOutcome } from '../../core/check.js';

export const PRODUCTS = ['A', 'B', 'C', 'D'];
export const MAX_TRADES = 6;
const MINUS = '−';

// Fair values: distinct multiples of 0.5 in [lo, hi].
export function fairs(rng, n, lo = 20, hi = 150) {
  const out = [];
  while (out.length < n) { const v = rng.int(lo * 2, hi * 2) / 2; if (!out.includes(v)) out.push(v); }
  return out;
}

// Display name from legs, e.g. [2, 1, 0] -> "2A + B", [1, -1] -> "A − B".
export function nameOf(legs, products = PRODUCTS) {
  let s = '';
  legs.forEach((q, i) => {
    if (!q) return;
    const a = Math.abs(q), term = `${a === 1 ? '' : a}${products[i]}`;
    s += s ? ` ${q < 0 ? MINUS : '+'} ${term}` : `${q < 0 ? MINUS : ''}${term}`;
  });
  return s;
}

export const px = (x) => `${x < 0 ? MINUS : ''}${Number.isInteger(x) ? Math.abs(x).toFixed(1) : String(Math.abs(x))}`;
export const quote = (fair, half) => ({ bid: fair - half, ask: fair + half });
export const fairOf = (legs, v) => legs.reduce((s, q, i) => s + q * v[i], 0);

export function instrument(id, legs, bid, ask, name) {
  return { id, name: name || nameOf(legs), legs, bid, ask };
}

// "buy A at 50.5; sell A + B at 81.0" and the cash sum, for the generic closing steps.
export function describe(board, trades) {
  const byId = new Map(board.instruments.map((i) => [i.id, i]));
  const parts = trades.map((t) => { const i = byId.get(t.id); return `${t.side} ${i.name} at ${px(t.side === 'buy' ? i.ask : i.bid)}`; });
  const flows = trades.map((t) => { const i = byId.get(t.id); return t.side === 'buy' ? -i.ask : i.bid; });
  const cash = flows.map((f, k) => (k === 0 ? px(f) : `${f < 0 ? MINUS : '+'} ${px(Math.abs(f))}`)).join(' ');
  const { profit } = positionOutcome(board, trades);
  return [
    { say: `Trades: ${parts.join('; ')}.`, why: 'Each tap is one unit: buying pays the ask, selling receives the bid.' },
    { say: `Net position: ${board.products.map((p) => `${p} 0`).join(', ')} (flat). Add up the cash.`, math: `${cash} = ${px(profit)}`, why: 'Flat means no market risk is left, so the cash is locked-in profit.' },
  ];
}

// ---------------------------------------------------------------- worked-solution fields
const mid = (i) => (i.bid + i.ask) / 2;
const r6 = (x) => Math.round(x * 1e6) / 1e6;

// The best package seen as one card (the target) against the cards that rebuild it. The target is
// the traded card with the most legs, ties to the card on the side traded least often. Hedge
// quantities are signed so the bundle diagram prices them on the side actually traded.
function targetView(board, trades) {
  const byId = new Map(board.instruments.map((i) => [i.id, i]));
  const count = new Map();
  for (const t of trades) { const k = `${t.side}|${t.id}`; count.set(k, (count.get(k) || 0) + 1); }
  const rows = [...count.entries()].map(([k, n]) => { const [side, id] = k.split('|'); return { side, n, ins: byId.get(id) }; });
  const sideN = (s) => rows.filter((r) => r.side === s).reduce((a, r) => a + r.n, 0);
  const weight = (r) => r.ins.legs.reduce((a, q) => a + Math.abs(q), 0);
  const T = [...rows].sort((a, b) => weight(b) - weight(a) || sideN(a.side) - sideN(b.side))[0];
  const sold = T.side === 'sell';
  const legs = rows.filter((r) => r !== T).map((r) => ({ name: r.ins.name, qty: (r.side === 'buy') === sold ? r.n : -r.n, bid: r.ins.bid, ask: r.ins.ask }));
  return { T: T.ins, n: T.n, sold, legs };
}

// Executable edges for every multi-leg card whose legs all have their own card.
function edgeTable(board) {
  const single = board.products.map((_, k) => board.instruments.find((i) => i.legs.every((q, j) => q === (j === k ? 1 : 0))));
  const rows = [];
  for (const c of board.instruments) {
    if (c.legs.reduce((a, q) => a + Math.abs(q), 0) < 2 || c.legs.some((q, k) => q && !single[k])) continue;
    const sum = (f) => c.legs.reduce((a, q, k) => a + (q ? q * f(single[k], q) : 0), 0);
    const legsAsk = sum((i, q) => (q > 0 ? i.ask : i.bid)), legsBid = sum((i, q) => (q > 0 ? i.bid : i.ask));
    rows.push({ name: c.name, mid: r6(mid(c) - sum((i) => mid(i))), sell: r6(c.bid - legsAsk), buy: r6(legsBid - c.ask) });
  }
  return rows;
}

const signedPx = (x) => `${x > 0 ? '+' : ''}${px(x)}`;

// ask, fast path, sanity check and picture for one board and its best package.
export function obSolution(board, best, structure) {
  const { trades, profit } = best;
  const byId = new Map(board.instruments.map((i) => [i.id, i]));
  const ask = `Find the trades that leave you flat in ${board.products.join(', ')} and lock in the most cash.`;
  const flat = `Count units per product after all ${trades.length} taps: ${board.products.map((p) => `${p} 0`).join(', ')}. A product left at +1 or −1 means the cash is not locked in yet.`;
  if (structure === 'crossed' || structure === 'crossed-venues') {
    const b = trades.map((t) => byId.get(t.id)), buyI = b[trades.findIndex((t) => t.side === 'buy')], sellI = b[trades.findIndex((t) => t.side === 'sell')];
    const product = board.products[buyI.legs.findIndex((q) => q)];
    const where = (i) => i.name.match(/\((.+)\)/)?.[1] ?? i.name;
    return {
      ask,
      fast: `For each product, put the highest bid next to the lowest ask. ${product}: bid ${px(sellI.bid)} on ${where(sellI)}, ask ${px(buyI.ask)} on ${where(buyI)}. Buy one, sell one: ${px(profit)}.`,
      check: `${flat} The edge is bid minus ask, ${px(sellI.bid)} − ${px(buyI.ask)} = ${px(profit)}; a pair that only touches would give 0, which does not count.`,
      picture: {
        diagram: 'ledger',
        spec: { products: board.products, rows: trades.map((t) => { const i = byId.get(t.id); return { text: i.name, side: t.side, price: t.side === 'buy' ? i.ask : i.bid, legs: i.legs }; }), stated: { cash: profit, flat: true } },
        caption: `One row per tap. After the buy and the sell, the position in ${product} is back to 0 and the cash ${signedPx(profit)} is locked in.`,
      },
    };
  }
  const { T, sold, legs } = targetView(board, trades);
  const legsAsk = r6(legs.reduce((a, l) => a + (l.qty >= 0 ? l.qty * l.ask : l.qty * l.bid), 0));
  const legsBid = r6(legs.reduce((a, l) => a + (l.qty >= 0 ? l.qty * l.bid : l.qty * l.ask), 0));
  const cost = sold ? legsAsk : legsBid;
  const quote = sold ? T.bid : T.ask;
  const term = (l) => `${Math.abs(l.qty) > 1 ? `${Math.abs(l.qty)} × ` : ''}${l.name.includes(' ') ? `(${l.name})` : l.name}`;
  const rebuild = legs.map((l, i) => `${i ? (l.qty < 0 ? ' − ' : ' + ') : l.qty < 0 ? '−' : ''}${term(l)}`).join('');
  const midEdge = r6((sold ? 1 : -1) * (mid(T) - legs.reduce((a, l) => a + l.qty * mid(l), 0)));
  const decoys = structure === 'decoy' || structure === 'decoy-plus-bundle' ? edgeTable(board) : [];
  const decoy = decoys.find((r) => r.name !== T.name && Math.max(r.sell, r.buy) <= 0);
  const picture = decoy
    ? {
      diagram: 'table',
      spec: { columns: ['Bundle card', 'Mid gap', 'Sell it: bid − leg asks', 'Buy it: leg bids − ask'], rows: decoys.map((r) => [r.name, signedPx(r.mid), signedPx(r.sell), signedPx(r.buy)]) },
      caption: `Executable edge for each bundle card, priced on the side you would trade. ${decoy.name} has a mid gap of ${signedPx(decoy.mid)} but no positive edge; only ${T.name} pays, ${px(profit)}.`,
    }
    : {
      diagram: 'bundle',
      spec: { bundle: { name: T.name, bid: T.bid, ask: T.ask }, legs, stated: { legsAsk, legsBid, profit } },
      caption: `${T.name} against the cards that rebuild it: ${rebuild}. ${sold ? `Selling ${T.name} earns its bid ${px(T.bid)}; rebuilding costs ${px(legsAsk)}` : `Buying ${T.name} costs its ask ${px(T.ask)}; selling the rebuild earns ${px(legsBid)}`}. The gap ${px(profit)} is the locked-in profit.`,
    };
  return {
    ask,
    fast: `Price ${T.name} from the other cards on the side you would trade: ${rebuild} ${sold ? 'costs' : 'earns'} ${px(cost)}. Its ${sold ? 'bid' : 'ask'} is ${px(quote)}, so ${sold ? 'sell it and buy' : 'buy it and sell'} the rebuild: ${px(profit)}.`,
    check: `${flat} At mid prices the gap looks like ${signedPx(midEdge)}; only the executable edge, ${px(profit)}, is profit.`,
    picture,
  };
}

const sameTrades = (a, b) => JSON.stringify([...a].map((t) => `${t.id}:${t.side}`).sort()) === JSON.stringify([...b].map((t) => `${t.id}:${t.side}`).sort());

// The card list doubles as the text alternative for the board (and keeps prompts distinct).
export function promptText(board) {
  return `Build a position that is flat in every product and locks in a profit. Each tap trades one unit: buy at the ask, sell at the bid. Cards (sell / buy): ${board.instruments.map((i) => `${i.name} ${px(i.bid)} / ${px(i.ask)}`).join('; ')}.`;
}

// Build the item if the solver agrees with the intended package; otherwise return null.
export function obItem(fam, rng, difficulty, { board, intended, steps, hints, structure }) {
  for (const i of board.instruments) if (!(i.bid < i.ask)) return null;
  const best = solve(board, MAX_TRADES);
  if (!best || !sameTrades(best.trades, intended)) return null;
  return {
    id: `ob:${fam.id}:${rng.seed}`,
    section: 'ob',
    family: fam.id,
    difficulty,
    kind: 'orderbook',
    prompt: { text: promptText(board) },
    board,
    best: { trades: best.trades, profit: best.profit },
    solution: { ...obSolution(board, best, structure), steps: [...steps, ...describe(board, best.trades)], rule: fam.lesson.rule, anchor: fam.lesson.anchor },
    hints,
    params: { structure },
  };
}

// Retry wrapper: families return null when the solver finds a different best package.
export function generateWith(fam, build) {
  return (rng, { difficulty = fam.levels[0] } = {}) => {
    for (let k = 0; k < 60; k++) {
      const it = build(k === 0 ? rng : rng.fork(`retry${k}`), difficulty);
      if (it) { it.id = `ob:${fam.id}:${rng.seed}`; return it; }
    }
    throw new Error(`ob/${fam.id}: no board after 60 attempts at difficulty ${difficulty}`);
  };
}

// Independent check shared by all families.
export function verifyOb(item) {
  const bf = bruteForceBest(item.board, MAX_TRADES);
  const out = positionOutcome(item.board, item.best.trades);
  const ok = !!bf && out.flat && Math.abs(out.profit - item.best.profit) < 1e-9 && Math.abs(bf.profit - item.best.profit) < 1e-9;
  return { ok, detail: `brute force best ${bf?.profit}, item best ${item.best.profit}, flat ${out.flat}` };
}

export const buy = (id) => ({ id, side: 'buy' });
export const sell = (id) => ({ id, side: 'sell' });
