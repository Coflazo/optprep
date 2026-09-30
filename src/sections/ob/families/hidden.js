import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell, nameOf, fairOf } from '../lib.js';

// No arbitrage against the single products (their spreads are wide), but two tightly quoted
// bundles are inconsistent with each other. Variant 1: 2A + B against (A + B) + A.
// Variant 2: spreads A − C against (A − B) + (B − C).
const fam = {
  id: 'hidden',
  section: 'ob',
  title: 'Hidden arbitrage between bundles',
  skill: 'When the obvious leg hedge fails, hedge one bundle with another bundle',
  levels: [4, 5],
  lesson: {
    purpose: 'The hardest boards have no arbitrage in the obvious place (bundle against its legs) because the legs are expensive to trade. The edge sits between two bundles.',
    anchor: 'Hedging a bundle with its legs, with one change: use another bundle as the hedge, because it is cheaper to trade than the legs.',
    steps: [
      { say: 'Check the obvious hedge first; if the legs\' spreads eat the edge, look for a bundle that covers most of the same exposure.', why: 'Bundles with tight quotes are cheaper hedges than several wide legs.' },
      { say: 'Write the mispriced card as a combination of other cards: 2A + B = (A + B) + A, or A − C = (A − B) + (B − C).', why: 'Any exact combination is a valid hedge.' },
      { say: 'Price the combination on the tradable sides and compare.', why: 'The same executable-edge rule as always.' },
    ],
    predict: { question: 'A: 19 / 22, B: 29 / 32, A + B: 50 / 50.5, 2A + B: 72 / 72.5. Where is the arbitrage?', answer: 'Against legs: sell 2A + B at 72, buy 2 A + B = 44 + 32 = 76: loss. Against A + B + A: 50.5 + 22 = 72.5: loss too. None here: the 2A + B bid would need to exceed 72.5.' },
    rule: 'Hedge with whatever combination of cards is cheapest to trade; the edge is bid − cost of that combination.',
    contrast: 'The obvious leg hedge crosses the wide single-product spreads; the bundle hedge crosses tight ones.',
    edge: 'If both hedges are profitable, the one with the tighter spreads earns more; either is a correct submission.',
  },
};

fam.generate = generateWith(fam, (rng, d) => {
  const variant = d === 4 ? 1 : rng.pick([1, 2]);
  const e = rng.pick([0.5, 1, 1.5]), wide = rng.pick([1.5, 2]), tight = 0.5;
  if (variant === 1) {
    const P = ['A', 'B'], v = fairs(rng, 2, 20, 90);
    const A = instrument('A', [1, 0], v[0] - wide, v[0] + wide), B = instrument('B', [0, 1], v[1] - wide, v[1] + wide);
    const f1 = fairOf([1, 1], v), AB = instrument('AB', [1, 1], f1 - tight, f1 + tight, nameOf([1, 1], P));
    const rich = rng.chance(0.5);
    const cost = AB.ask + A.ask, value = AB.bid + A.bid;
    const W = rich ? instrument('2AB', [2, 1], cost + e, cost + e + 2 * tight, nameOf([2, 1], P)) : instrument('2AB', [2, 1], value - e - 2 * tight, value - e, nameOf([2, 1], P));
    const board = { products: P, instruments: rng.shuffle([A, B, AB, W]) };
    const legCost = 2 * A.ask + B.ask, legValue = 2 * A.bid + B.bid;
    return obItem(fam, rng, d, {
      board,
      intended: rich ? [sell(W.id), buy(AB.id), buy(A.id)] : [buy(W.id), sell(AB.id), sell(A.id)],
      steps: [
        { say: rich ? `Against the legs: ${W.name} bid ${px(W.bid)} vs 2 × ${px(A.ask)} + ${px(B.ask)} = ${px(legCost)}: no edge.` : `Against the legs: ${W.name} ask ${px(W.ask)} vs 2 × ${px(A.bid)} + ${px(B.bid)} = ${px(legValue)}: no edge.`, why: 'The single products have wide spreads, so the obvious hedge fails.' },
        { say: `${W.name} = (${AB.name}) + A. ${rich ? `Buying that costs ${px(AB.ask)} + ${px(A.ask)} = ${px(cost)}; the ${W.name} bid is ${px(W.bid)}.` : `Selling that raises ${px(AB.bid)} + ${px(A.bid)} = ${px(value)}; the ${W.name} ask is ${px(W.ask)}.`}`, why: 'The tight A + B card replaces one A and the B, crossing one small spread instead of two wide ones.' },
        { say: rich ? `Sell ${W.name}, buy ${AB.name}, buy A.` : `Buy ${W.name}, sell ${AB.name}, sell A.`, why: 'Flat in A and B.' },
      ],
      hints: ['The obvious bundle-versus-legs check fails. Which other card contains most of the same products?', `Write ${W.name} as another bundle plus one leg.`],
      structure: 'bundle-vs-bundle',
    });
  }
  const P = ['A', 'B', 'C'], v = fairs(rng, 3, 30, 120);
  const legs = P.map((p, k) => instrument(p, P.map((_, j) => (j === k ? 1 : 0)), v[k] - wide, v[k] + wide));
  const sp = (a, b) => { const l = P.map((_, j) => (j === a ? 1 : j === b ? -1 : 0)), f = fairOf(l, v); return instrument(`${P[a]}-${P[b]}`, l, f - tight, f + tight, nameOf(l, P)); };
  const AB = sp(0, 1), BC = sp(1, 2);
  const rich = rng.chance(0.5);
  const cost = AB.ask + BC.ask, value = AB.bid + BC.bid;
  const l = [1, 0, -1];
  const AC = rich ? instrument('A-C', l, cost + e, cost + e + 2 * tight, nameOf(l, P)) : instrument('A-C', l, value - e - 2 * tight, value - e, nameOf(l, P));
  const board = { products: P, instruments: rng.shuffle([...legs, AB, BC, AC]) };
  return obItem(fam, rng, d, {
    board,
    intended: rich ? [sell(AC.id), buy(AB.id), buy(BC.id)] : [buy(AC.id), sell(AB.id), sell(BC.id)],
    steps: [
      { say: rich ? `Against the legs: ${AC.name} bid ${px(AC.bid)} vs ask(A) − bid(C) = ${px(legs[0].ask - legs[2].bid)}: no edge.` : `Against the legs: ${AC.name} ask ${px(AC.ask)} vs bid(A) − ask(C) = ${px(legs[0].bid - legs[2].ask)}: no edge.`, why: 'Wide single-product spreads kill the obvious replication.' },
      { say: `${AC.name} = (${AB.name}) + (${BC.name}). ${rich ? `Buying both costs ${px(AB.ask)} + ${px(BC.ask)} = ${px(cost)}; the ${AC.name} bid is ${px(AC.bid)}.` : `Selling both raises ${px(AB.bid)} + ${px(BC.bid)} = ${px(value)}; the ${AC.name} ask is ${px(AC.ask)}.`}`, why: 'B cancels between the two spreads.' },
      { say: rich ? `Sell ${AC.name}, buy ${AB.name}, buy ${BC.name}.` : `Buy ${AC.name}, sell ${AB.name}, sell ${BC.name}.`, why: 'Flat in A, B and C.' },
    ],
    hints: ['The single products are expensive to trade. Can two spreads add up to the third?', '(A − B) + (B − C) = A − C.'],
    structure: 'spread-vs-spreads',
  });
});
fam.verify = verifyOb;
export default fam;
