import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell, nameOf } from '../lib.js';

// Weighted bundles (2A + B, A + 2B, 3A + B, 2A + B + C): the hedge needs several units of a leg.
const SHAPES = { 2: [[2, 1], [1, 2]], 3: [[2, 1], [1, 2], [2, 1, 1]], 4: [[3, 1], [1, 3], [2, 1, 1], [2, 2]] };

const fam = {
  id: 'weighted',
  section: 'ob',
  title: 'Weighted bundles',
  skill: 'Multiply each leg\'s price by its weight, and trade that many units of the leg',
  levels: [2, 3, 4],
  lesson: {
    purpose: 'Weighted bundles test whether you hedge with the right number of units. One unit of 2A + B needs two units of A to flatten.',
    anchor: 'A plain bundle A + B, with one change: a leg appears more than once, so it is priced and traded that many times.',
    steps: [
      { say: 'Price the bundle from its legs, weight × price for each leg, on the side you will trade.', why: '2A + B contains two A\'s: two asks (or two bids) of A.' },
      { say: 'Compare with the bundle quote; trade one bundle against weight-many units of each leg.', why: 'Only the exact weights leave every product flat.' },
    ],
    predict: { question: 'A: 20.0 / 20.5, B: 50.0 / 50.5, 2A + B: 92.0 / 93.0. Trade?', answer: 'Parts cost 2 × 20.5 + 50.5 = 91.5 < bid 92.0: sell 2A + B, buy A twice, buy B. Profit 0.5.' },
    rule: 'Weighted bundle: fair = Σ weight × leg price; hedge with weight-many units of each leg.',
    contrast: 'Buying one A against 2A + B leaves you short one A: flat requires matching every weight.',
    edge: 'Four or five trades are normal here; the section allows as many taps as you need.',
  },
};

fam.generate = generateWith(fam, (rng, d) => {
  const w = rng.pick(SHAPES[d]);
  const P = ['A', 'B', 'C'].slice(0, w.length);
  const v = fairs(rng, P.length, 15, 90);
  const h = P.map(() => rng.pick([0.5, 1]));
  const legsI = P.map((p, k) => instrument(p, P.map((_, j) => (j === k ? 1 : 0)), v[k] - h[k], v[k] + h[k]));
  const rich = rng.chance(0.5), e = rng.pick([0.5, 1, 1.5, 2]), bs = rng.pick([0.5, 1, 1.5]);
  const askSum = w.reduce((s, q, k) => s + q * legsI[k].ask, 0), bidSum = w.reduce((s, q, k) => s + q * legsI[k].bid, 0);
  const bid = rich ? askSum + e : bidSum - e - 2 * bs;
  const bundle = instrument(w.map((q, j) => `${q}${P[j]}`).join(''), w, bid, bid + 2 * bs, nameOf(w, P));
  const board = { products: P, instruments: rng.chance(0.5) ? [bundle, ...legsI] : [...legsI, bundle] };
  const legTrades = legsI.flatMap((i, k) => Array(w[k]).fill(rich ? buy(i.id) : sell(i.id)));
  const terms = w.map((q, k) => `${q > 1 ? `${q} × ` : ''}${px(rich ? legsI[k].ask : legsI[k].bid)}`).join(' + ');
  return obItem(fam, rng, d, {
    board,
    intended: [rich ? sell(bundle.id) : buy(bundle.id), ...legTrades],
    steps: [
      { say: `${bundle.name} from its legs at the ${rich ? 'asks' : 'bids'}: ${terms} = ${px(rich ? askSum : bidSum)}.`, why: 'Each leg counts as many times as its weight.' },
      { say: rich ? `Bundle bid ${px(bid)} > ${px(askSum)}: sell one bundle, buy ${w.map((q, k) => `${q} ${P[k]}`).join(' and ')}.` : `Bundle ask ${px(bid + 2 * bs)} < ${px(bidSum)}: buy one bundle, sell ${w.map((q, k) => `${q} ${P[k]}`).join(' and ')}.`, why: 'Matching the weights leaves every product flat.' },
    ],
    hints: [`How many units of each product does one ${bundle.name} contain?`, 'Price the bundle as weight × leg price on the side you would trade, then compare.'],
    structure: rich ? 'weighted-bundle-rich' : 'weighted-bundle-cheap',
  });
});
fam.verify = verifyOb;
export default fam;
