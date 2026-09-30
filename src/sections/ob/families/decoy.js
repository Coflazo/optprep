import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell, nameOf, fairOf } from '../lib.js';

// A bundle that looks rich (or cheap) at mid prices but loses once every spread is crossed,
// next to a genuine arbitrage elsewhere on the board.
const fam = {
  id: 'decoy',
  section: 'ob',
  title: 'Decoys: mid-price illusions',
  skill: 'Price every candidate on the tradable side; a mid-price gap is not an arbitrage',
  levels: [3, 4, 5],
  lesson: {
    purpose: 'Real boards contain near-arbitrages that vanish after the spread. Chasing one costs time (a wrong submission), which is the scarcest resource in this section.',
    anchor: 'The bundle check you already know, with one discipline added: never compare mid prices, only the sides you would trade.',
    steps: [
      { say: 'For each candidate, compute the executable edge: bundle bid − Σ leg asks (sell bundle) and Σ leg bids − bundle ask (buy bundle).', why: 'Mid prices are not tradable; bids and asks are.' },
      { say: 'Discard candidates with edge ≤ 0, then execute the one with a positive edge.', why: 'A zero edge earns nothing; a negative edge loses.' },
    ],
    predict: { question: 'A: 30 / 31, B: 50 / 51, A + B: 80.5 / 83.5. The bundle mid (82) exceeds the leg mids (81). Arbitrage?', answer: 'No: selling the bundle gets 80.5 but the legs cost 31 + 51 = 82. The mid gap is swallowed by the spreads.' },
    rule: 'Edge = executable bid − executable cost; trade only if the edge is positive.',
    contrast: 'Mid-price comparison says "rich"; executable comparison says "not tradable". Only the second one pays.',
    edge: 'A decoy can be exactly break-even (edge 0): it still does not count, because the profit must be positive.',
  },
};

fam.generate = generateWith(fam, (rng, d) => {
  const P = d === 5 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];
  const v = fairs(rng, P.length, 20, 120);
  const unit = (k) => P.map((_, j) => (j === k ? 1 : 0));
  const legsI = P.map((p, k) => { const h = rng.pick([0.5, 1]); return instrument(p, unit(k), v[k] - h, v[k] + h); });
  // decoy on A + B: bid just below the legs' ask cost, ask far above, so its mid looks rich
  const dl = P.map((_, j) => (j < 2 ? 1 : 0));
  const askAB = legsI[0].ask + legsI[1].ask, bidAB = legsI[0].bid + legsI[1].bid;
  const gap = rng.pick([0, 0.5]), wide = rng.pick([2, 2.5, 3]);
  const decoyRich = rng.chance(0.5);
  const decoy = decoyRich
    ? instrument('AB', dl, askAB - gap, askAB - gap + wide, nameOf(dl, P))
    : instrument('AB', dl, bidAB + gap - wide, bidAB + gap, nameOf(dl, P));
  // genuine arbitrage: another bundle, mispriced by e after crossing every spread
  const from = P.length === 3 ? 1 : 2; // B + C on three products, C + D on four
  const gl = P.map((_, j) => (j >= from ? 1 : 0)), gIns = legsI.filter((_, j) => j >= from);
  const e = rng.pick([0.5, 1, 1.5]), hs = rng.pick([0.5, 1]);
  const gRich = rng.chance(0.5);
  const gAsk = gIns.reduce((s, i) => s + i.ask, 0), gBid = gIns.reduce((s, i) => s + i.bid, 0);
  const genuine = gRich
    ? instrument(P.slice(from).join(''), gl, gAsk + e, gAsk + e + 2 * hs, nameOf(gl, P))
    : instrument(P.slice(from).join(''), gl, gBid - e - 2 * hs, gBid - e, nameOf(gl, P));
  const board = { products: P, instruments: rng.shuffle([...legsI, decoy, genuine]) };
  const mids = (i) => (i.bid + i.ask) / 2;
  return obItem(fam, rng, d, {
    board,
    intended: gRich ? [sell(genuine.id), ...gIns.map((i) => buy(i.id))] : [buy(genuine.id), ...gIns.map((i) => sell(i.id))],
    steps: [
      { say: `${decoy.name} looks ${decoyRich ? 'rich' : 'cheap'} at mid (${px(mids(decoy))} against ${px(mids(legsI[0]) + mids(legsI[1]))}), but executable: ${decoyRich ? `bid ${px(decoy.bid)} against leg asks ${px(askAB)}` : `ask ${px(decoy.ask)} against leg bids ${px(bidAB)}`}, edge ${px(decoyRich ? decoy.bid - askAB : bidAB - decoy.ask)}.`, why: 'Crossing both leg spreads and the bundle spread wipes out the mid-price gap.' },
      { say: `${genuine.name}: ${gRich ? `bid ${px(genuine.bid)} against leg asks ${px(gAsk)}` : `ask ${px(genuine.ask)} against leg bids ${px(gBid)}`}, edge +${px(e)}.`, why: 'This one survives the spreads, so trade it.' },
    ],
    hints: ['Which bundle looks mispriced at mid? Now check it at the bid and the ask.', 'Compute the executable edge for every bundle; only a positive one counts.'],
    structure: 'decoy-plus-bundle',
  });
});
fam.verify = verifyOb;
export default fam;
