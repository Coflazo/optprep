import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell, nameOf, fairOf } from '../lib.js';

// Chains: a product that is not quoted alone must be built from overlapping bundles.
// 3 products: A, A + B, B + C, C (no plain B). 4 products: A, A + B, B + C, C + D, D.
const fam = {
  id: 'chain',
  section: 'ob',
  title: 'Chains of bundles',
  skill: 'When a product has no quote of its own, build it from overlapping bundles, (A + B) − A = B',
  levels: [3, 4, 5],
  lesson: {
    purpose: 'Harder boards omit a product\'s own quote, so the obvious hedge does not exist. Building it synthetically from other cards finds the arbitrage.',
    anchor: 'Hedging a bundle with its legs, with one change: a missing leg is itself replaced by a bundle minus a leg you do have.',
    steps: [
      { say: 'Write the unquoted product as a combination of quoted instruments: B = (A + B) − A.', why: 'Any exposure you can build synthetically, you can hedge.' },
      { say: 'Price the synthetic on the correct sides, then compare the mispriced bundle with its synthetic replica.', why: 'Buying (A + B) − A costs ask(A + B) − bid(A).' },
      { say: 'Execute every card of the chain once, in the direction that flattens each product.', why: 'Check each product\'s net position before submitting.' },
    ],
    predict: { question: 'A: 10.0 / 10.5, A + B: 30.0 / 30.5, B + C: 55.0 / 55.5, C: 34.0 / 34.5. Is B + C rich?', answer: 'Synthetic B + C = (A + B) − A + C costs 30.5 − 10.0 + 34.5 = 55.0 at the right sides; the B + C bid 55.0 only equals it, so no profit.' },
    rule: 'Missing product → build it from overlapping bundles; price every card on the side you trade.',
    contrast: 'A plain bundle hedge uses each leg\'s own quote; a chain crosses more spreads, so it needs a bigger mispricing.',
    edge: 'Four cards means four spreads crossed; an apparent 0.5 edge on mids often disappears.',
  },
};

fam.generate = generateWith(fam, (rng, d) => {
  const n = d === 5 ? 4 : 3;
  const P = ['A', 'B', 'C', 'D'].slice(0, n);
  const v = fairs(rng, n, 15, 90);
  const unit = (k) => P.map((_, j) => (j === k ? 1 : 0));
  const pairLegs = (a) => P.map((_, j) => (j === a || j === a + 1 ? 1 : 0));
  const hs = () => rng.pick([0.5, 1]);
  const mk = (legs, name, h = hs()) => { const f = fairOf(legs, v); return instrument(name, legs, f - h, f + h, nameOf(legs, P)); };
  // cards: A, then the pair bundles, then the last product alone
  const A = mk(unit(0), 'A');
  const pairs = Array.from({ length: n - 1 }, (_, a) => mk(pairLegs(a), `${P[a]}${P[a + 1]}`));
  const Z = mk(unit(n - 1), P[n - 1]);
  const target = pairs[n - 2]; // the last pair bundle (B + C, or C + D)
  // replica of the target, e.g. B + C = C + (A + B) − A, or C + D = D + (B + C) − (A + B) + A
  const rich = rng.chance(0.5), e = rng.pick([0.5, 1, 1.5]);
  const hedge = []; // [instrument, +1 buy / -1 sell] replicating +1 target
  hedge.push([Z, 1]);
  let sgn = 1;
  for (let a = n - 3; a >= 0; a--) { hedge.push([pairs[a], sgn]); sgn = -sgn; }
  hedge.push([A, sgn]);
  // price of buying the replica (for rich) / selling it (for cheap)
  const buyReplica = hedge.reduce((s, [i, g]) => s + (g > 0 ? i.ask : -i.bid), 0);
  const sellReplica = hedge.reduce((s, [i, g]) => s + (g > 0 ? i.bid : -i.ask), 0);
  const h = target.ask - target.bid;
  if (rich) { target.bid = buyReplica + e; target.ask = target.bid + h; } else { target.ask = sellReplica - e; target.bid = target.ask - h; }
  const instruments = [A, ...pairs, Z];
  const board = { products: P, instruments: rng.chance(0.5) ? instruments : [...instruments].reverse() };
  const intended = [rich ? sell(target.id) : buy(target.id), ...hedge.map(([i, g]) => ((g > 0) === rich ? buy(i.id) : sell(i.id)))];
  const missing = P.slice(1, n - 1).join(' and ');
  return obItem(fam, rng, d, {
    board,
    intended,
    steps: [
      { say: `${missing} ${n === 3 ? 'is' : 'are'} not quoted alone. Build ${target.name} from the other cards: ${hedge.map(([i, g]) => `${g > 0 ? '+' : '−'}(${i.name})`).join(' ')}.`, why: 'Adding and subtracting overlapping bundles cancels every product except the ones in the target.' },
      rich
        ? { say: `Buying that replica costs ${px(buyReplica)}; the ${target.name} bid is ${px(target.bid)}, higher by ${px(e)}.`, why: 'Buy the + cards at their asks, sell the − cards at their bids.' }
        : { say: `Selling that replica raises ${px(sellReplica)}; the ${target.name} ask is ${px(target.ask)}, lower by ${px(e)}.`, why: 'Sell the + cards at their bids, buy the − cards at their asks.' },
      { say: rich ? `Sell ${target.name} and buy the replica.` : `Buy ${target.name} and sell the replica.`, why: 'Target and replica cancel product by product.' },
    ],
    hints: ['One product has no card of its own. How can you build it from two cards you do have?', `Write ${target.name} as a signed sum of the other cards, then price each card on the side you would trade.`],
    structure: n === 3 ? 'chain-3' : 'chain-4',
  });
});
fam.verify = verifyOb;
export default fam;
