// Exhaustive orderbook solver. A position is a signed unit count per instrument (buying and
// selling the same instrument only pays its spread, so it is never optimal). The search
// enumerates every such position with at most N unit trades, pruning branches whose open
// exposure the remaining instruments cannot close, and keeps flat positions with profit > 0.
//
// "Best" = the most profitable indecomposable flat position: one that does not split into two
// smaller flat positions. Repeating an arbitrage (2 × the same package) is therefore not a new
// answer, and neither is gluing two independent arbitrages together. Ties: fewer trades, then
// the first found.

const EPS = 1e-9;
const round6 = (x) => Math.round(x * 1e6) / 1e6;

export function toTrades(board, q) {
  const trades = [];
  q.forEach((v, i) => { for (let k = 0; k < Math.abs(v); k++) trades.push({ id: board.instruments[i].id, side: v > 0 ? 'buy' : 'sell' }); });
  return trades;
}

const flat = (board, q) => board.products.every((_, p) => board.instruments.reduce((s, ins, i) => s + q[i] * ins.legs[p], 0) === 0);

// True if some non-empty proper sub-position (same signs, smaller or equal sizes) is flat.
export function decomposable(board, q) {
  const idx = q.map((v, i) => i).filter((i) => q[i] !== 0);
  const r = q.map(() => 0);
  const total = idx.reduce((s, i) => s * (Math.abs(q[i]) + 1), 1);
  for (let code = 1; code < total - 1; code++) {
    let c = code;
    for (const i of idx) { const m = Math.abs(q[i]) + 1; r[i] = Math.sign(q[i]) * (c % m); c = Math.floor(c / m); }
    if (flat(board, r)) return true;
  }
  return false;
}

export function solve(board, maxTrades = 6) {
  const ins = board.instruments, I = ins.length, P = board.products.length;
  // maxLeg[i][p]: the largest |leg| in product p among instruments i..I-1 (for pruning)
  const maxLeg = Array.from({ length: I + 1 }, () => Array(P).fill(0));
  for (let i = I - 1; i >= 0; i--) for (let p = 0; p < P; p++) maxLeg[i][p] = Math.max(maxLeg[i + 1][p], Math.abs(ins[i].legs[p]));
  const q = Array(I).fill(0), exp = Array(P).fill(0);
  let best = null;
  const rec = (i, rem, cash) => {
    for (let p = 0; p < P; p++) if (Math.abs(exp[p]) > rem * maxLeg[i][p]) return;
    if (i === I) {
      if (cash > EPS && q.some((v) => v !== 0)) {
        const n = q.reduce((s, v) => s + Math.abs(v), 0), profit = round6(cash);
        if (!best || profit > best.profit + EPS || (Math.abs(profit - best.profit) <= EPS && n < best.n)) {
          if (!decomposable(board, q)) best = { q: [...q], profit, n };
        }
      }
      return;
    }
    for (let v = -rem; v <= rem; v++) {
      q[i] = v;
      for (let p = 0; p < P; p++) exp[p] += v * ins[i].legs[p];
      rec(i + 1, rem - Math.abs(v), cash + (v > 0 ? -v * ins[i].ask : -v * ins[i].bid));
      for (let p = 0; p < P; p++) exp[p] -= v * ins[i].legs[p];
    }
    q[i] = 0;
  };
  rec(0, maxTrades, 0);
  return best ? { trades: toTrades(board, best.q), profit: best.profit, position: best.q } : null;
}

// A deliberately different search for verification: every multiset of unit trades over the
// 2·I trade types (buy or sell each instrument, both allowed), up to N trades, with
// decomposability checked on sub-multisets. Slower, shares no code with solve().
export function bruteForceBest(board, maxTrades = 6) {
  const types = board.instruments.flatMap((ins) => [{ ins, sgn: 1 }, { ins, sgn: -1 }]);
  const T = types.length, P = board.products.length;
  const counts = Array(T).fill(0);
  let best = null;
  const netOf = (cnt) => {
    const net = Array(P).fill(0);
    let cash = 0;
    cnt.forEach((c, t) => {
      if (!c) return;
      const { ins, sgn } = types[t];
      ins.legs.forEach((l, p) => { net[p] += c * sgn * l; });
      cash += c * (sgn > 0 ? -ins.ask : ins.bid);
    });
    return { net, cash };
  };
  const splits = (cnt) => {
    const nz = cnt.map((c, t) => t).filter((t) => cnt[t] > 0);
    const total = nz.reduce((s, t) => s * (cnt[t] + 1), 1);
    for (let code = 1; code < total - 1; code++) {
      let c = code;
      const sub = Array(T).fill(0);
      for (const t of nz) { sub[t] = c % (cnt[t] + 1); c = Math.floor(c / (cnt[t] + 1)); }
      if (netOf(sub).net.every((v) => v === 0)) return true;
    }
    return false;
  };
  const rec = (start, left) => {
    if (left < maxTrades) {
      const { net, cash } = netOf(counts);
      if (net.every((v) => v === 0) && cash > EPS) {
        const profit = Math.round(cash * 1e6) / 1e6, n = maxTrades - left;
        if ((!best || profit > best.profit + EPS || (Math.abs(profit - best.profit) <= EPS && n < best.n)) && !splits(counts)) best = { profit, n };
      }
    }
    if (left === 0) return;
    for (let t = start; t < T; t++) { counts[t]++; rec(t, left - 1); counts[t]--; }
  };
  rec(0, maxTrades);
  return best;
}
