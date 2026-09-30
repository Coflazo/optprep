import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell, nameOf, fairOf } from '../lib.js';

// A bundle quoted against its components. Rich: bundle bid > sum of component asks.
// Cheap: bundle ask < sum of component bids. mode is fixed per exported family.
export function bundleFamily(mode) {
  const rich = mode === 'rich';
  const fam = {
    id: rich ? 'bundle-rich' : 'bundle-cheap',
    section: 'ob',
    title: rich ? 'Rich bundle: sell it, buy the parts' : 'Cheap bundle: buy it, sell the parts',
    skill: rich ? 'Price the bundle at the component asks; if its bid is higher, sell it and buy the parts' : 'Price the bundle at the component bids; if its ask is lower, buy it and sell the parts',
    levels: [1, 2, 3],
    lesson: {
      purpose: 'Bundles (ETFs, baskets) are the core of the Orderbooks section: a bundle and its parts must trade at consistent prices, and when they do not, you lock in the gap.',
      anchor: 'Crossed venues compare one product with itself; a bundle compares a package with the sum of its parts, priced on the correct side.',
      steps: [
        { say: rich ? 'Cost to build the bundle = sum of the component ASKS (you must buy them).' : 'Value of breaking the bundle = sum of the component BIDS (you must sell them).', why: 'Always price the side you will actually trade on.' },
        { say: rich ? 'If the bundle BID exceeds that cost, sell the bundle and buy the components.' : 'If the bundle ASK is below that value, buy the bundle and sell the components.', why: 'The bundle leg cancels the component legs exactly, so the position is flat.' },
      ],
      predict: { question: rich ? 'A: 40.0 / 40.5, B: 60.0 / 60.5, A + B: 101.5 / 102.0. Trade?' : 'A: 40.0 / 40.5, B: 60.0 / 60.5, A + B: 98.5 / 99.0. Trade?', answer: rich ? 'Parts cost 40.5 + 60.5 = 101.0 at the asks; the bundle bid 101.5 is higher: sell A + B, buy A, buy B, profit 0.5.' : 'Parts sell for 40.0 + 60.0 = 100.0 at the bids; the bundle ask 99.0 is lower: buy A + B, sell A, sell B, profit 1.0.' },
      rule: rich ? 'Bundle bid > Σ component asks → sell bundle, buy parts.' : 'Bundle ask < Σ component bids → buy bundle, sell parts.',
      contrast: 'Mid-price comparisons ignore the spread. A bundle can look rich at mid and still lose once you cross every spread.',
      edge: 'With three components you cross three spreads; the mispricing must beat all of them.',
    },
  };
  fam.generate = generateWith(fam, (rng, d) => {
    const n = d === 3 ? 3 : 2;
    const P = ['A', 'B', 'C'].slice(0, d === 2 ? 3 : n);
    const v = fairs(rng, P.length);
    const h = P.map(() => rng.pick([0.5, 1]));
    const instruments = P.map((p, k) => instrument(p, P.map((_, j) => (j === k ? 1 : 0)), v[k] - h[k], v[k] + h[k]));
    const legs = P.map((_, j) => (j < n ? 1 : 0));
    const e = rng.pick([0.5, 1, 1.5, 2]), bs = rng.pick([0.5, 1]);
    const askSum = instruments.slice(0, n).reduce((s, i) => s + i.ask, 0), bidSum = instruments.slice(0, n).reduce((s, i) => s + i.bid, 0);
    const bid = rich ? askSum + e : bidSum - e - 2 * bs, ask = bid + 2 * bs;
    const bundle = instrument(legs.map((q, j) => (q ? P[j] : '')).join(''), legs, bid, ask, nameOf(legs, P));
    // difficulty 2: a third product C quoted alone, plus the bundle; C is a distractor
    const board = { products: P, instruments: rng.chance(0.5) ? [bundle, ...instruments] : [...instruments, bundle] };
    const parts = instruments.slice(0, n);
    return obItem(fam, rng, d, {
      board,
      intended: rich ? [sell(bundle.id), ...parts.map((i) => buy(i.id))] : [buy(bundle.id), ...parts.map((i) => sell(i.id))],
      steps: rich
        ? [
          { say: `Build ${bundle.name} from parts at the asks: ${parts.map((i) => px(i.ask)).join(' + ')} = ${px(askSum)}.`, why: 'Buying the parts means paying their asks.' },
          { say: `The bundle bid ${px(bid)} is above ${px(askSum)}: sell the bundle, buy the parts.`, why: 'Selling the bundle and holding the parts leaves every product flat.' },
        ]
        : [
          { say: `Sell ${bundle.name}'s parts at the bids: ${parts.map((i) => px(i.bid)).join(' + ')} = ${px(bidSum)}.`, why: 'Selling the parts means receiving their bids.' },
          { say: `The bundle ask ${px(ask)} is below ${px(bidSum)}: buy the bundle, sell the parts.`, why: 'Owning the bundle and being short the parts leaves every product flat.' },
        ],
      hints: [`Price ${bundle.name} from its parts, using the side you would trade on.`, rich ? 'Compare the bundle bid with the sum of the part asks.' : 'Compare the bundle ask with the sum of the part bids.'],
      structure: rich ? 'bundle-rich' : 'bundle-cheap',
    });
  });
  fam.verify = verifyOb;
  return fam;
}
