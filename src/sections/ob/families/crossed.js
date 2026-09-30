import { fairs, instrument, px, obItem, generateWith, verifyOb, buy, sell } from '../lib.js';

// One product quoted on two venues; one venue's bid sits above the other's ask.
const fam = {
  id: 'crossed',
  section: 'ob',
  title: 'Crossed venues',
  skill: 'Compare the best bid anywhere with the best ask anywhere for the same product',
  levels: [1, 2],
  lesson: {
    purpose: 'The simplest arbitrage and the warm-up for every board: the same thing bought cheaply in one place and sold dearly in another.',
    anchor: 'Buying low and selling high, with one change: both happen at once, on two venues, so nothing is left over.',
    steps: [
      { say: 'For each product, find the highest bid and the lowest ask across venues.', why: 'You sell at a bid and buy at an ask; only the best of each matters.' },
      { say: 'If the highest bid is above the lowest ask, buy at that ask and sell at that bid.', why: 'One unit bought and one sold leaves you flat; the difference is profit.' },
    ],
    predict: { question: 'Venue 1: 99.5 / 100.0. Venue 2: 100.0 / 100.5. Is there an arbitrage?', answer: 'No: the best bid (100.0) equals the best ask (100.0), so profit is 0, not positive.' },
    rule: 'Best bid (anywhere) > best ask (anywhere) → buy the ask, sell the bid.',
    contrast: 'Comparing mid prices is the trap: a higher mid on venue 2 is not an arbitrage unless its bid clears venue 1\'s ask.',
    edge: 'Touching quotes (bid = ask across venues) give zero profit, which does not count.',
  },
};

fam.generate = generateWith(fam, (rng, d) => {
  const P = d === 1 ? ['A'] : ['A', 'B'];
  const v = fairs(rng, P.length);
  const target = d === 1 ? 0 : rng.int(0, 1), e = rng.pick([0.5, 1, 1.5]);
  const instruments = [];
  P.forEach((p, k) => {
    const legs = P.map((_, j) => (j === k ? 1 : 0));
    const h1 = rng.pick([0.5, 1]), h2 = rng.pick([0.5, 1]);
    const lo = { bid: v[k] - h1, ask: v[k] + h1 };
    // the target product is crossed by e; the other one only touches (profit 0)
    const hiBid = lo.ask + (k === target ? e : 0), hi = { bid: hiBid, ask: hiBid + 2 * h2 };
    const up = rng.chance(0.5);
    instruments.push(instrument(`${p}@1`, legs, (up ? lo : hi).bid, (up ? lo : hi).ask, `${p} (venue 1)`));
    instruments.push(instrument(`${p}@2`, legs, (up ? hi : lo).bid, (up ? hi : lo).ask, `${p} (venue 2)`));
  });
  const board = { products: P, instruments };
  const p = P[target], cheap = instruments.filter((i) => i.id.startsWith(p)).sort((a, b) => a.ask - b.ask)[0], rich = instruments.filter((i) => i.id.startsWith(p) && i !== cheap)[0];
  return obItem(fam, rng, d, {
    board,
    intended: [buy(cheap.id), sell(rich.id)],
    steps: [
      { say: `${p}: best ask ${px(cheap.ask)} on ${cheap.name.split('(')[1].replace(')', '')}, best bid ${px(rich.bid)} on ${rich.name.split('(')[1].replace(')', '')}.`, why: 'Scan each product for the lowest ask and the highest bid across venues.' },
      { say: `${px(rich.bid)} > ${px(cheap.ask)}: buy at the ask, sell at the bid.${P.length > 1 ? ` The other product only touches (bid = ask across venues), which earns 0.` : ''}`, why: 'A bid above another venue\'s ask is a crossed market.' },
    ],
    hints: ['For each product, what is the highest price anyone will pay, and the lowest price anyone will sell at?', 'Is any bid above any ask for the same product?'],
    structure: 'crossed-venues',
  });
});
fam.verify = verifyOb;
export default fam;
