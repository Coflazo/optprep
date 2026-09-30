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
    { say: `Net position: ${board.products.map((p) => `${p} 0`).join(', ')} (flat). Cash: ${cash} = ${px(profit)}.`, why: 'Flat means no market risk is left, so the cash is locked-in profit.' },
  ];
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
    solution: { steps: [...steps, ...describe(board, best.trades)], rule: fam.lesson.rule, anchor: fam.lesson.anchor },
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
