import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell, nameOf } from '../lib.js';

// Spread instruments (A − B): long one product, short another. Price the spread from the
// legs on the correct sides and compare with its quote.
const fam = {
  id: 'spread',
  section: 'ob',
  title: 'Spread instruments',
  skill: 'A − B bought = A bought and B sold: price it as ask(A) − bid(B), or bid(A) − ask(B) when sold',
  levels: [2, 3, 4],
  lesson: {
    purpose: 'Spread instruments (calendar spreads, pairs) carry a negative leg. The sign flips which side of the leg you trade.',
    anchor: 'A bundle A + B, with one change: B enters with a minus sign, so buying the spread means selling B.',
    steps: [
      { say: 'Replicating a long A − B means buying A (at its ask) and selling B (at its bid): cost ask(A) − bid(B).', why: 'The minus sign turns the B leg into a sale.' },
      { say: 'If the spread bid is above that cost, sell the spread and replicate it: buy A, sell B.', why: 'Selling A − B leaves you short A and long B; the replicating trades cancel both.' },
      { say: 'If the spread ask is below bid(A) − ask(B), buy the spread, sell A, buy B.', why: 'The mirror image.' },
    ],
    predict: { question: 'A: 50.0 / 50.5, B: 30.0 / 30.5, A − B: 20.0 / 21.0. Trade?', answer: 'Replicate at 50.5 − 30.0 = 20.5 (cost) or 50.0 − 30.5 = 19.5 (value). Spread bid 20.0 < 20.5 and ask 21.0 > 19.5: no arbitrage.' },
    rule: 'Long A − B costs ask(A) − bid(B); short A − B raises bid(A) − ask(B).',
    contrast: 'For A + B both legs use the same side (both asks to buy). For A − B the legs use opposite sides.',
    edge: 'A spread can have a negative price when B is worth more than A; the same rule applies.',
  },
};

fam.generate = generateWith(fam, (rng, d) => {
  const P = d === 4 ? ['A', 'B', 'C'] : ['A', 'B'];
  let v = fairs(rng, P.length, 30, 140);
  if (d === 2) v = [Math.max(...v), Math.min(...v)];
  const h = P.map(() => rng.pick([0.5, 1]));
  const legsI = P.map((p, k) => instrument(p, P.map((_, j) => (j === k ? 1 : 0)), v[k] - h[k], v[k] + h[k]));
  const pairs = d === 4 ? [[0, 1], [1, 2]] : [[0, 1]];
  const target = rng.int(0, pairs.length - 1), rich = rng.chance(0.5), e = rng.pick([0.5, 1, 1.5]);
  const spreads = pairs.map(([a, b], k) => {
    const legs = P.map((_, j) => (j === a ? 1 : j === b ? -1 : 0)), hs = rng.pick([0.5, 1]);
    const cost = legsI[a].ask - legsI[b].bid, value = legsI[a].bid - legsI[b].ask;
    let bid, ask;
    if (k === target) { if (rich) { bid = cost + e; ask = bid + 2 * hs; } else { ask = value - e; bid = ask - 2 * hs; } }
    else { bid = v[a] - v[b] - hs; ask = v[a] - v[b] + hs; }
    return instrument(`${P[a]}-${P[b]}`, legs, bid, ask, nameOf(legs, P));
  });
  const board = { products: P, instruments: [...legsI, ...spreads] };
  const sp = spreads[target], [a, b] = pairs[target], A = legsI[a], B = legsI[b];
  return obItem(fam, rng, d, {
    board,
    intended: rich ? [sell(sp.id), buy(A.id), sell(B.id)] : [buy(sp.id), sell(A.id), buy(B.id)],
    steps: rich
      ? [
        { say: `Replicating a long ${sp.name} costs ask(${A.name}) − bid(${B.name}) = ${px(A.ask)} − ${px(B.bid)} = ${px(A.ask - B.bid)}.`, why: 'Buy the positive leg at its ask, sell the negative leg at its bid.' },
        { say: `The ${sp.name} bid ${px(sp.bid)} is higher: sell the spread, buy ${A.name}, sell ${B.name}.`, why: 'Short spread (−A, +B) plus the replication (+A, −B) is flat.' },
      ]
      : [
        { say: `Replicating a short ${sp.name} raises bid(${A.name}) − ask(${B.name}) = ${px(A.bid)} − ${px(B.ask)} = ${px(A.bid - B.ask)}.`, why: 'Sell the positive leg at its bid, buy the negative leg at its ask.' },
        { say: `The ${sp.name} ask ${px(sp.ask)} is lower: buy the spread, sell ${A.name}, buy ${B.name}.`, why: 'Long spread (+A, −B) plus the replication (−A, +B) is flat.' },
      ],
    hints: [`Which trades in the single products copy one unit of ${sp.name}?`, 'The minus sign flips the side: buying A − B means selling B.'],
    structure: rich ? 'spread-rich' : 'spread-cheap',
  });
});
fam.verify = verifyOb;
export default fam;
