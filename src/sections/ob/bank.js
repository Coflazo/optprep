// Curated Orderbooks boards in the reported format: products and bundles, each with a sell
// (bid) and buy (ask) price; tap prices to build a flat, profitable position. Every board is
// hand-written; tests confirm the written trades are the solver's best package.
import { positionOutcome } from '../../core/check.js';
import { describe, promptText, obSolution } from './lib.js';
import { families } from './registry.js';

const SRC = {
  tm: 'Tradermath Orderbooks practice test: cards of products and bundles with sell and buy prices, flat profitable position, wrong submits cost time; original board',
  qv: 'QuantVault / Glassdoor reports of the 2026 Orderbooks module (20 boards in 8 minutes, bundle arbitrage); original board',
  lj: 'Candidate write-up of the Orderbooks task (cheap card against a related bundle, check the margin, submit); original board',
};
const F = Object.fromEntries(families.map((f) => [f.id, f]));

// 'A+B' -> legs over the products; 'A@2' -> product A on venue 2; '2A-C' etc.
function parse(spec, products) {
  const [body, venue] = spec.split('@');
  const legs = products.map(() => 0);
  for (const m of body.matchAll(/([+-]?)(\d*)([A-D])/g)) legs[products.indexOf(m[3])] += (m[1] === '-' ? -1 : 1) * (m[2] ? +m[2] : 1);
  const name = venue ? `${body} (venue ${venue})` : body.replace(/([+-])/g, (s) => ` ${s === '-' ? '−' : '+'} `).replace(/^ − /, '−');
  return { id: spec, name, legs };
}

let n = 0;
function board(fam, d, src, products, cards, trades, idea) {
  const P = products.split('');
  const b = { products: P, instruments: cards.map(([spec, bid, ask]) => ({ ...parse(spec, P), bid, ask })) };
  const tr = trades.split(';').map((s) => s.trim()).flatMap((s) => { const [side, id, times] = s.split(' '); return Array(times ? +times.replace('x', '') : 1).fill({ id, side }); });
  const { profit } = positionOutcome(b, tr);
  n++;
  return {
    id: `ob:bank:${String(n).padStart(2, '0')}`,
    section: 'ob', family: fam, difficulty: d, kind: 'orderbook',
    prompt: { text: promptText(b) },
    board: b,
    best: { trades: tr, profit },
    solution: { ...obSolution(b, { trades: tr, profit }, fam), steps: [...idea.map(([say, why]) => ({ say, why })), ...describe(b, tr)], rule: F[fam].lesson.rule, anchor: F[fam].lesson.anchor },
    hints: ['Price every bundle from its parts on the side you would trade.', 'Look for a bid above an equivalent ask.'],
    params: { structure: fam },
    meta: { source: SRC[src] },
  };
}

const B = [
  // crossed venues
  board('crossed', 1, 'tm', 'A', [['A@1', 99.5, 100], ['A@2', 100.5, 101]], 'buy A@1; sell A@2',
    [['Venue 2 bids 100.5, above venue 1\'s ask of 100.0.', 'Same product, two prices: buy the cheap ask, sell the rich bid.']]),
  board('crossed', 1, 'tm', 'A', [['A@1', 48, 48.5], ['A@2', 47, 47.5], ['A@3', 48.5, 49]], 'buy A@2; sell A@3',
    [['Lowest ask 47.5 (venue 2), highest bid 48.5 (venue 3).', 'Pair the extremes: venue 1 against venue 2 earns only 0.5.']]),
  board('crossed', 2, 'qv', 'AB', [['A@1', 120, 121], ['A@2', 121, 122], ['B@1', 64, 64.5], ['B@2', 65, 65.5]], 'buy B@1; sell B@2',
    [['A only touches (bid 121.0 = ask 121.0): zero profit.', 'A zero edge is not an arbitrage.'], ['B: bid 65.0 on venue 2 above ask 64.5 on venue 1.', 'The crossed product is B.']]),
  board('crossed', 1, 'qv', 'A', [['A@1', 75.5, 76], ['A@2', 77, 77.5]], 'buy A@1; sell A@2',
    [['Venue 2 bid 77.0 is a full point above venue 1 ask 76.0.', 'Crossed market.']]),
  board('crossed', 2, 'tm', 'AB', [['A@1', 210, 211], ['A@2', 208.5, 209.5], ['B@1', 33, 34], ['B@2', 32, 33]], 'buy A@2; sell A@1',
    [['A: venue 1 bid 210.0 above venue 2 ask 209.5.', 'Crossed by 0.5.'], ['B: venue 1 bid 33.0 equals venue 2 ask 33.0.', 'Touching, not crossed.']]),
  board('crossed', 2, 'lj', 'A', [['A@1', 88, 89], ['A@2', 89.5, 90.5], ['A@3', 87, 88]], 'buy A@3; sell A@2',
    [['Best bid 89.5 (venue 2), best ask 88.0 (venue 3).', 'Venue 1 against venue 2 only earns 0.5; take the widest cross.']]),
  // rich bundles
  board('bundle-rich', 1, 'tm', 'AB', [['A', 40, 40.5], ['B', 60, 60.5], ['A+B', 101.5, 102]], 'sell A+B; buy A; buy B',
    [['Parts at the asks: 40.5 + 60.5 = 101.0.', 'Buying the parts pays their asks.'], ['Bundle bid 101.5 > 101.0.', 'Sell the bundle, buy the parts.']]),
  board('bundle-rich', 1, 'qv', 'AB', [['A', 25.5, 26], ['B', 73, 74], ['A+B', 100.5, 101.5]], 'sell A+B; buy A; buy B',
    [['Parts at the asks: 26.0 + 74.0 = 100.0.', 'Price the replica on the side you trade.'], ['Bundle bid 100.5 > 100.0.', 'Edge 0.5.']]),
  board('bundle-rich', 3, 'tm', 'ABC', [['A', 12, 12.5], ['B', 18, 18.5], ['C', 30, 31], ['A+B+C', 62.5, 63.5]], 'sell A+B+C; buy A; buy B; buy C',
    [['Parts at the asks: 12.5 + 18.5 + 31.0 = 62.0.', 'Three spreads to cross.'], ['Bundle bid 62.5 > 62.0.', 'Edge 0.5 survives all three.']]),
  board('bundle-rich', 2, 'lj', 'ABC', [['A', 55, 56], ['B', 44, 45], ['C', 101, 102], ['A+B', 102, 103]], 'sell A+B; buy A; buy B',
    [['C is a distractor: nothing else contains it.', 'Ignore cards that cannot be hedged.'], ['A + B bid 102.0 > 56.0 + 45.0 = 101.0.', 'Edge 1.0.']]),
  board('bundle-rich', 1, 'qv', 'AB', [['A', 150, 151], ['B', 49.5, 50], ['A+B', 202, 203]], 'sell A+B; buy A; buy B',
    [['Parts at the asks: 151.0 + 50.0 = 201.0.', 'Large prices, same check.'], ['Bundle bid 202.0 > 201.0.', 'Edge 1.0.']]),
  board('bundle-rich', 2, 'tm', 'AB', [['A', 31, 31.5], ['B', 42, 42.5], ['A+B', 74.5, 75]], 'sell A+B; buy A; buy B',
    [['Parts at the asks: 31.5 + 42.5 = 74.0.', 'Replica cost.'], ['Bundle bid 74.5 > 74.0.', 'Edge 0.5.']]),
  board('bundle-rich', 3, 'lj', 'ABC', [['A', 9.5, 10], ['B', 19.5, 20], ['C', 29.5, 30], ['A+B+C', 60.5, 61.5]], 'sell A+B+C; buy A; buy B; buy C',
    [['Parts at the asks: 10.0 + 20.0 + 30.0 = 60.0.', 'Replica cost.'], ['Bundle bid 60.5 > 60.0.', 'Edge 0.5.']]),
  // cheap bundles
  board('bundle-cheap', 1, 'tm', 'AB', [['A', 40, 40.5], ['B', 60, 60.5], ['A+B', 98.5, 99]], 'buy A+B; sell A; sell B',
    [['Parts at the bids: 40.0 + 60.0 = 100.0.', 'Selling the parts receives their bids.'], ['Bundle ask 99.0 < 100.0.', 'Buy the bundle, sell the parts: edge 1.0.']]),
  board('bundle-cheap', 1, 'qv', 'AB', [['A', 70, 71], ['B', 30, 31], ['A+B', 97.5, 98.5]], 'buy A+B; sell A; sell B',
    [['Parts at the bids: 70.0 + 30.0 = 100.0.', 'Replica value.'], ['Bundle ask 98.5 < 100.0.', 'Edge 1.5.']]),
  board('bundle-cheap', 3, 'tm', 'ABC', [['A', 22, 22.5], ['B', 35, 35.5], ['C', 43, 43.5], ['A+B+C', 98, 99]], 'buy A+B+C; sell A; sell B; sell C',
    [['Parts at the bids: 22.0 + 35.0 + 43.0 = 100.0.', 'Replica value.'], ['Bundle ask 99.0 < 100.0.', 'Edge 1.0.']]),
  board('bundle-cheap', 2, 'lj', 'AB', [['A', 110, 111], ['B', 90, 91], ['A+B', 197, 199.5]], 'buy A+B; sell A; sell B',
    [['Parts at the bids: 110.0 + 90.0 = 200.0.', 'Replica value.'], ['Bundle ask 199.5 < 200.0.', 'Edge 0.5, despite the wide bundle spread.']]),
  board('bundle-cheap', 1, 'tm', 'AB', [['A', 64, 64.5], ['B', 16, 16.5], ['A+B', 78.5, 79.5]], 'buy A+B; sell A; sell B',
    [['Parts at the bids: 64.0 + 16.0 = 80.0.', 'Replica value.'], ['Bundle ask 79.5 < 80.0.', 'Edge 0.5.']]),
  board('bundle-cheap', 3, 'qv', 'ABC', [['A', 5, 5.5], ['B', 7, 7.5], ['C', 11, 11.5], ['A+B+C', 21.5, 22.5]], 'buy A+B+C; sell A; sell B; sell C',
    [['Parts at the bids: 5.0 + 7.0 + 11.0 = 23.0.', 'Replica value.'], ['Bundle ask 22.5 < 23.0.', 'Edge 0.5.']]),
  board('bundle-cheap', 2, 'tm', 'ABC', [['A', 45, 46], ['B', 35, 36], ['C', 20, 21], ['A+B', 77, 79]], 'buy A+B; sell A; sell B',
    [['C is a distractor.', 'No card combines C with anything.'], ['A + B ask 79.0 < 45.0 + 35.0 = 80.0.', 'Edge 1.0.']]),
  // weighted bundles
  board('weighted', 2, 'tm', 'AB', [['A', 20, 20.5], ['B', 50, 50.5], ['2A+B', 92, 93]], 'sell 2A+B; buy A x2; buy B',
    [['2A + B at the asks: 2 × 20.5 + 50.5 = 91.5.', 'Two units of A.'], ['Bid 92.0 > 91.5: sell one bundle, buy two A and one B.', 'Edge 0.5.']]),
  board('weighted', 2, 'qv', 'AB', [['A', 15, 15.5], ['B', 30, 30.5], ['A+2B', 73, 74]], 'buy A+2B; sell A; sell B x2',
    [['A + 2B at the bids: 15.0 + 2 × 30.0 = 75.0.', 'Two units of B.'], ['Ask 74.0 < 75.0: buy the bundle, sell one A and two B.', 'Edge 1.0.']]),
  board('weighted', 3, 'tm', 'AB', [['A', 10, 10.5], ['B', 25, 26], ['3A+B', 58, 59]], 'sell 3A+B; buy A x3; buy B',
    [['3A + B at the asks: 3 × 10.5 + 26.0 = 57.5.', 'Three units of A.'], ['Bid 58.0 > 57.5.', 'Edge 0.5 after crossing four spreads.']]),
  board('weighted', 4, 'lj', 'ABC', [['A', 40, 41], ['B', 20, 21], ['C', 10, 11], ['2A+B+C', 115, 116]], 'sell 2A+B+C; buy A x2; buy B; buy C',
    [['2A + B + C at the asks: 82.0 + 21.0 + 11.0 = 114.0.', 'Weights 2, 1, 1.'], ['Bid 115.0 > 114.0.', 'Edge 1.0; five trades.']]),
  board('weighted', 3, 'qv', 'AB', [['A', 33, 33.5], ['B', 12, 12.5], ['2A+2B', 88, 89]], 'buy 2A+2B; sell A x2; sell B x2',
    [['2A + 2B at the bids: 2 × 33.0 + 2 × 12.0 = 90.0.', 'Two of each.'], ['Ask 89.0 < 90.0.', 'Edge 1.0.']]),
  board('weighted', 2, 'tm', 'AB', [['A', 60, 61], ['B', 25, 25.5], ['2A+B', 142.5, 143.5]], 'buy 2A+B; sell A x2; sell B',
    [['2A + B at the bids: 2 × 60.0 + 25.0 = 145.0.', 'Value of the parts.'], ['Ask 143.5 < 145.0.', 'Edge 1.5.']]),
  board('weighted', 4, 'lj', 'AB', [['A', 18, 18.5], ['B', 27, 27.5], ['A+3B', 101.5, 102.5]], 'sell A+3B; buy A; buy B x3',
    [['A + 3B at the asks: 18.5 + 3 × 27.5 = 101.0.', 'Three units of B.'], ['Bid 101.5 > 101.0.', 'Edge 0.5.']]),
  // spreads
  board('spread', 2, 'tm', 'AB', [['A', 50, 50.5], ['B', 30, 30.5], ['A-B', 21, 22]], 'sell A-B; buy A; sell B',
    [['Long A − B costs ask(A) − bid(B) = 50.5 − 30.0 = 20.5.', 'Buy A, sell B.'], ['Spread bid 21.0 > 20.5: sell the spread, buy A, sell B.', 'Edge 0.5.']]),
  board('spread', 2, 'qv', 'AB', [['A', 80, 81], ['B', 55, 56], ['A-B', 22.5, 23.5]], 'buy A-B; sell A; buy B',
    [['Short A − B raises bid(A) − ask(B) = 80.0 − 56.0 = 24.0.', 'Sell A, buy B.'], ['Spread ask 23.5 < 24.0: buy the spread, sell A, buy B.', 'Edge 0.5.']]),
  board('spread', 3, 'tm', 'AB', [['A', 40, 41], ['B', 70, 71], ['A-B', -28.5, -27.5]], 'sell A-B; buy A; sell B',
    [['Long A − B costs 41.0 − 70.0 = −29.0.', 'Negative spreads work the same way.'], ['Spread bid −28.5 > −29.0.', 'Edge 0.5.']]),
  board('spread', 3, 'lj', 'AB', [['A', 100, 100.5], ['B', 99, 99.5], ['A-B', 2, 2.5]], 'sell A-B; buy A; sell B',
    [['Long A − B costs 100.5 − 99.0 = 1.5.', 'Replica cost.'], ['Spread bid 2.0 > 1.5.', 'Edge 0.5.']]),
  board('spread', 4, 'tm', 'ABC', [['A', 30, 31], ['B', 20, 21], ['C', 10, 11], ['A-B', 7.5, 8.5], ['B-C', 9, 11]], 'buy A-B; sell A; buy B',
    [['B − C: cost 21.0 − 10.0 = 11.0, value 20.0 − 11.0 = 9.0, quote 9.0 / 11.0: no edge.', 'Check each spread on both sides.'], ['A − B: value 30.0 − 21.0 = 9.0, ask 8.5.', 'Buy A − B, sell A, buy B: edge 0.5.']]),
  board('spread', 3, 'qv', 'AB', [['A', 64, 65], ['B', 36, 37], ['A-B', 30, 31]], 'sell A-B; buy A; sell B',
    [['Long A − B costs 65.0 − 36.0 = 29.0.', 'Replica cost.'], ['Spread bid 30.0 > 29.0.', 'Edge 1.0.']]),
  // chains
  board('chain', 3, 'tm', 'ABC', [['A', 10, 10.5], ['A+B', 30, 30.5], ['B+C', 56, 56.5], ['C', 34, 34.5]], 'sell B+C; buy C; buy A+B; sell A',
    [['B has no card: B = (A + B) − A.', 'Build the missing product.'], ['Replica of B + C costs 34.5 + 30.5 − 10.0 = 55.0; the bid is 56.0.', 'Edge 1.0.']]),
  board('chain', 3, 'qv', 'ABC', [['A', 20, 21], ['A+B', 50, 51], ['B+C', 72, 73], ['C', 39, 40]], 'sell B+C; buy C; buy A+B; sell A',
    [['Replica of B + C = C + (A + B) − A costs 40.0 + 51.0 − 20.0 = 71.0.', 'Buy C and A + B at the asks, sell A at the bid.'], ['B + C bid 72.0 > 71.0.', 'Edge 1.0.']]),
  board('chain', 4, 'tm', 'ABC', [['A', 15, 15.5], ['A+B', 40, 40.5], ['B+C', 50, 51], ['C', 27, 27.5]], 'buy B+C; sell C; sell A+B; buy A',
    [['Selling the replica C + (A + B) − A raises 27.0 + 40.0 − 15.5 = 51.5.', 'Sell C and A + B at the bids, buy A at the ask.'], ['B + C ask 51.0 < 51.5.', 'Buy B + C, sell the replica: edge 0.5.']]),
  board('chain', 5, 'lj', 'ABCD', [['A', 10, 10.5], ['A+B', 25, 25.5], ['B+C', 35, 35.5], ['C+D', 51.5, 52], ['D', 29, 29.5]], 'sell C+D; buy D; buy B+C; sell A+B; buy A',
    [['C + D = D + (B + C) − (A + B) + A.', 'Walk back along the chain, alternating signs.'], ['Replica cost 29.5 + 35.5 − 25.0 + 10.5 = 50.5; C + D bid 51.5.', 'Edge 1.0 across five cards.']]),
  board('chain', 5, 'tm', 'ABCD', [['A', 20, 20.5], ['A+B', 45, 45.5], ['B+C', 60, 60.5], ['C+D', 67.5, 68], ['D', 34, 34.5]], 'buy C+D; sell D; sell B+C; buy A+B; sell A',
    [['Replica value: D bid 34.0 + (B + C) bid 60.0 − (A + B) ask 45.5 + A bid 20.0 = 68.5.', 'Sell the + cards at bids, buy the − card at its ask.'], ['C + D ask 68.0 < 68.5.', 'Edge 0.5.']]),
  board('chain', 4, 'qv', 'ABC', [['A', 5, 5.5], ['A+B', 17, 17.5], ['B+C', 31.5, 32], ['C', 18, 18.5]], 'sell B+C; buy C; buy A+B; sell A',
    [['Replica cost 18.5 + 17.5 − 5.0 = 31.0.', 'B = (A + B) − A.'], ['B + C bid 31.5 > 31.0.', 'Edge 0.5.']]),
  // decoys
  board('decoy', 3, 'tm', 'ABC', [['A', 30, 31], ['B', 50, 51], ['A+B', 80.5, 83.5], ['C', 20, 20.5], ['B+C', 69, 69.5]], 'buy B+C; sell B; sell C',
    [['A + B looks rich at mid (82.0 vs 81.0), but its bid 80.5 is below the leg asks 82.0.', 'Mid gaps are not tradable.'], ['B + C ask 69.5 < leg bids 50.0 + 20.0 = 70.0.', 'Edge 0.5.']]),
  board('decoy', 3, 'qv', 'ABC', [['A', 44, 45], ['B', 26, 27], ['A+B', 72, 74], ['C', 18, 19], ['B+C', 46.5, 47.5]], 'sell B+C; buy B; buy C',
    [['A + B: bid 72.0 exactly equals the leg asks 45.0 + 27.0: zero edge.', 'Zero does not count.'], ['B + C: bid 46.5 > 27.0 + 19.0 = 46.0.', 'Edge 0.5.']]),
  board('decoy', 3, 'lj', 'ABC', [['A@1', 70, 71], ['A@2', 71, 72], ['B', 30, 30.5], ['C', 15, 15.5], ['B+C', 46.5, 47]], 'sell B+C; buy B; buy C',
    [['A\'s venues only touch (71.0 / 71.0).', 'No profit there.'], ['B + C bid 46.5 > 30.5 + 15.5 = 46.0.', 'Edge 0.5.']]),
  board('decoy', 4, 'tm', 'AB', [['A', 100, 101], ['B', 50, 51], ['2A+B', 248, 252], ['A+B', 148, 149]], 'buy A+B; sell A; sell B',
    [['2A + B: its cheapest replica 2 × (A + B) − B costs 2 × 149.0 − 50.0 = 248.0, exactly its bid: zero edge.', 'Check every way to build the bundle; none beats its quote.'], ['A + B ask 149.0 < 100.0 + 50.0 = 150.0.', 'Edge 1.0.']]),
  board('decoy', 4, 'qv', 'ABC', [['A', 12, 13], ['B', 22, 23], ['C', 31, 32], ['A+B+C', 64.5, 68], ['A+C', 45.5, 46]], 'sell A+C; buy A; buy C',
    [['A + B + C: bid 64.5 < leg asks 68.0; ask 68.0 > leg bids 65.0.', 'No edge either way.'], ['A + C bid 45.5 > 13.0 + 32.0 = 45.0.', 'Edge 0.5.']]),
  board('decoy', 5, 'tm', 'AB', [['A', 80, 80.5], ['B', 20, 20.5], ['A-B', 59, 61], ['A+B', 101.5, 102]], 'sell A+B; buy A; buy B',
    [['A − B: cost 80.5 − 20.0 = 60.5 > bid 59.0; value 80.0 − 20.5 = 59.5 < ask 61.0.', 'The spread is fairly quoted.'], ['A + B bid 101.5 > 80.5 + 20.5 = 101.0.', 'Edge 0.5.']]),
  // hidden: bundle against bundle
  board('hidden', 4, 'tm', 'AB', [['A', 19, 22], ['B', 27, 30], ['A+B', 50, 50.5], ['2A+B', 73, 73.5]], 'sell 2A+B; buy A+B; buy A',
    [['Against the legs: 2 × 22.0 + 30.0 = 74.0 > bid 73.0; via 2 × (A + B) − B: 101.0 − 27.0 = 74.0, also too dear.', 'The obvious hedges fail.'], ['2A + B = (A + B) + A: 50.5 + 22.0 = 72.5 < 73.0.', 'Hedge with the tight bundle: edge 0.5.']]),
  board('hidden', 5, 'qv', 'ABC', [['A', 40, 42], ['B', 60, 62], ['C', 30, 32], ['A-B', -20.5, -20], ['B-C', 30, 30.5], ['A-C', 11, 11.5]], 'sell A-C; buy A-B; buy B-C',
    [['A − C against legs: cost 42.0 − 30.0 = 12.0 > bid 11.0.', 'Wide legs kill the obvious hedge.'], ['(A − B) + (B − C) costs −20.0 + 30.5 = 10.5 < 11.0.', 'Edge 0.5.']]),
  board('hidden', 5, 'lj', 'AB', [['A', 30, 33], ['B', 50, 53], ['A+B', 81, 81.5], ['2A+B', 109, 109.5]], 'buy 2A+B; sell A+B; sell A',
    [['Against legs: 2 × 30.0 + 50.0 = 110.0 vs ask 109.5 earns 0.5.', 'A real but smaller edge.'], ['Via (A + B) + A: 81.0 + 30.0 = 111.0 vs ask 109.5.', 'Edge 1.5: the best package.']]),
];

export default B;
