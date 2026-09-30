// One place that scores every item kind, so the exam replicas cannot drift apart.
//   mcq       +1 / -1 / 0 for a skip           (Beat the Odds, NumberLogic)
//   rank      1 for the exact order, else 0     (Likelihood List)
//   interval  lower/upper if truth inside       (Intervals)
//   orderbook correct if flat and profit > 0    (Orderbooks)

export const netScore = (scores) => scores.reduce((s, x) => s + x, 0);

export function intervalScore(lower, upper, truth) {
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) return 0;
  if (lower <= 0 || upper <= 0 || lower > upper) return 0;
  const eps = 1e-9 * Math.max(1, Math.abs(truth));
  if (truth < lower - eps || truth > upper + eps) return 0;
  return lower / upper;
}

// trades: [{ id, side: 'buy' | 'sell' }], one unit each. Buys pay the ask, sells receive the bid.
export function positionOutcome(board, trades) {
  const net = board.products.map(() => 0);
  let profit = 0;
  for (const t of trades) {
    const ins = board.instruments.find((i) => i.id === t.id);
    if (!ins) throw new Error(`unknown instrument ${t.id}`);
    const sgn = t.side === 'buy' ? 1 : -1;
    ins.legs.forEach((q, k) => { net[k] += sgn * q; });
    profit += t.side === 'buy' ? -ins.ask : ins.bid;
  }
  profit = Math.round(profit * 1e6) / 1e6;
  return { flat: net.every((x) => x === 0), profit };
}

export function checkItem(item, response) {
  if (response?.skip) return { correct: false, score: 0, skipped: true };
  switch (item.kind) {
    case 'mcq': {
      const ok = response.choice === item.answerIndex;
      return { correct: ok, score: ok ? 1 : -1 };
    }
    case 'rank': {
      const ok = response.order?.length === item.answerOrder.length &&
        response.order.every((v, i) => v === item.answerOrder[i]);
      return { correct: ok, score: ok ? 1 : 0 };
    }
    case 'interval': {
      const score = intervalScore(Number(response.lower), Number(response.upper), item.truth);
      return { correct: score > 0, score };
    }
    case 'orderbook': {
      const trades = response.trades || [];
      if (!trades.length) return { correct: false, score: 0 };
      const { flat, profit } = positionOutcome(item.board, trades);
      const ok = flat && profit > 0;
      return { correct: ok, score: ok ? 1 : 0, profit, flat };
    }
    default:
      throw new Error(`unknown item kind ${item.kind}`);
  }
}
