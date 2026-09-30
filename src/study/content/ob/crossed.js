// Orderbooks family 1: crossed venues. One product quoted on several venues; a bid on one venue
// above an ask on another is a free round trip. Scan for the best bid and the best ask.
import { sec, px, r6, hp, card, quote, mc, cap, outcome, ledgerSpec, tradeText, posText, PER_BOARD, PENALTY } from './book-basics.js';

const V = (p, k, bid, ask) => card(`${p} (venue ${k})`, [1], bid, ask);
const bestBid = (cs) => cs.reduce((m, c) => (c.bid > m.bid ? c : m));
const bestAsk = (cs) => cs.reduce((m, c) => (c.ask < m.ask ? c : m));
const venueOf = (c) => c.name.match(/venue (\d)/)[1];

// Picture board: three venues, no two prices equal, best pair 3 -> 2.
const P3 = [V('A', 1, 60, 61), V('A', 2, 62, 63), V('A', 3, 59, 60.5)];
const pb = bestBid(P3), pa = bestAsk(P3);
// Challenge board (three venues, the widest cross is not the adjacent pair).
const C3 = [V('A', 1, 88, 89), V('A', 2, 89.5, 90.5), V('A', 3, 87, 88)];
const cb = bestBid(C3), ca = bestAsk(C3);
const near12 = r6(C3[1].bid - C3[0].ask);
// Two products: A only touches, B crosses.
const TA = [V('A', 1, 120, 121), V('A', 2, 121, 122)], TB = [V('B', 1, 64, 64.5), V('B', 2, 65, 65.5)];
const two = { A: TA, B: TB };
const twoCards = [...TA, ...TB].map((c) => ({ ...c, legs: c.name.startsWith('A') ? [1, 0] : [0, 1] }));
const bTrade = [[twoCards[2], 'buy'], [twoCards[3], 'sell']];
// Erroneous example: reads venue 2's ask as its bid.
const errProfit = r6(pb.bid - pa.ask), errWrong = r6(P3[1].ask - pa.ask);
// Predict: shift venue 2 up, or widen venue 1.
const PV1 = V('A', 1, 99.5, 100), PV2 = V('A', 2, 100.5, 101), shift = 1, widen = 0.5;
const PV3 = V('A', 3, 98.5, 99.5), vDrop = 1;

// n venues for one product with at least one cross; everything random on the 0.5 grid.
function venueBoard(rng, n, p = 'A') {
  const v = hp(rng, 30, 140);
  for (;;) {
    const cs = Array.from({ length: n }, (_, k) => { const o = rng.int(-4, 4) / 2, h = rng.pick([0.5, 1]); return V(p, k + 1, v + o - h, v + o + h); });
    const b = bestBid(cs), a = bestAsk(cs);
    if (b.bid > a.ask && new Set(cs.map((c) => c.bid)).size === n && new Set(cs.map((c) => c.ask)).size === n) return { cs, b, a, profit: r6(b.bid - a.ask) };
  }
}
const boardLine = (cs) => cs.map((c) => `venue ${venueOf(c)} ${quote(c)}`).join('; ');

function bestProfitQ(rng) {
  const { cs, b, a, profit } = venueBoard(rng, 3);
  return { type: 'number', q: `A on three venues (bid / ask): ${boardLine(cs)}. What is the most one buy and one sell of A can lock in?`, answer: profit,
    hints: ['Sell where the bid is highest, buy where the ask is lowest.', `Highest bid ${px(b.bid)}, lowest ask ${px(a.ask)}.`],
    explain: `Best bid ${px(b.bid)} (venue ${venueOf(b)}) − best ask ${px(a.ask)} (venue ${venueOf(a)}) = ${px(profit)}.` };
}

// Two products on two venues each: one crosses, the other only touches.
function whichProductQ(rng) {
  const cross = rng.pick(['A', 'B']), e = rng.pick([0.5, 1, 1.5]);
  const mk = (p) => { const v = hp(rng, 30, 140), h1 = rng.pick([0.5, 1]), h2 = rng.pick([0.5, 1]); const bid2 = v + h1 + (p === cross ? e : 0); const pair = [[v - h1, v + h1], [bid2, bid2 + 2 * h2]]; const up = rng.chance(0.5); return [V(p, 1, ...pair[up ? 0 : 1]), V(p, 2, ...pair[up ? 1 : 0])]; };
  const A = mk('A'), B = mk('B'), X = cross === 'A' ? A : B, Y = cross === 'A' ? B : A, other = cross === 'A' ? 'B' : 'A';
  const xb = bestBid(X), xa = bestAsk(X), yb = bestBid(Y), ya = bestAsk(Y);
  return mc({ q: `Board (bid / ask): A venue 1 ${quote(A[0])}, A venue 2 ${quote(A[1])}; B venue 1 ${quote(B[0])}, B venue 2 ${quote(B[1])}. Where is the arbitrage?`,
    right: `${cross}: buy on venue ${venueOf(xa)}, sell on venue ${venueOf(xb)}`,
    wrong: [
      [`${other}: buy on venue ${venueOf(ya)}, sell on venue ${venueOf(yb)}`, `${other}'s best bid only equals its best ask: zero profit does not count`],
      [`Buy ${cross} on venue ${venueOf(xa)}, sell ${other} on venue ${venueOf(yb)}`, 'mixed products: long one and short the other is not flat'],
      ['Both products: two round trips', `${other} earns exactly 0, so adding it gains nothing`],
    ],
    explain: `${cross}: ${px(xb.bid)} > ${px(xa.ask)}, edge ${px(e)}. ${other}: ${px(yb.bid)} = ${px(ya.ask)}, edge 0.` }, rng);
}

// Hinge: three venues; the wrong options are real reading mistakes, not smaller profits.
function hingeQ(rng) {
  const { cs, b, a, profit } = venueBoard(rng, 3);
  const midHi = cs.reduce((m, c) => (c.bid + c.ask > m.bid + m.ask ? c : m)), midLo = cs.reduce((m, c) => (c.bid + c.ask < m.bid + m.ask ? c : m));
  const wrong = [
    [`Buy on venue ${venueOf(b)} at ${px(b.ask)}, sell on venue ${venueOf(a)} at ${px(a.bid)}`, 'paired the right venues the wrong way round: you bought where it is dear and sold where it is cheap'],
    [`Buy on venue ${venueOf(a)} at ${px(a.bid)}, sell on venue ${venueOf(b)} at ${px(b.ask)}`, 'used the wrong side of each quote: buying pays the ask, selling receives the bid'],
    ['No trade: every venue quotes its bid below its ask', 'checked each venue alone: the cross is between venues'],
  ];
  if (midHi !== b || midLo !== a) wrong.push([`Buy on venue ${venueOf(midLo)} at ${px(midLo.ask)}, sell on venue ${venueOf(midHi)} at ${px(midHi.bid)}`, 'picked the venues by mid price: the mid is not what you trade at, and this pair earns less']);
  return mc({ q: `A on three venues (bid / ask): ${boardLine(cs)}. Which pair of trades locks in the largest profit?`, right: `Buy on venue ${venueOf(a)} at ${px(a.ask)}, sell on venue ${venueOf(b)} at ${px(b.bid)}`, wrong,
    explain: `Best bid ${px(b.bid)} on venue ${venueOf(b)}, best ask ${px(a.ask)} on venue ${venueOf(a)}: ${px(profit)}.` }, rng);
}

export default {
  id: 'ob/crossed',
  book: 'ob',
  kind: 'family',
  family: 'crossed',
  title: 'Crossed venues',
  summary: 'The same product on several venues: sell at the highest bid anywhere, buy at the lowest ask anywhere, if the bid is higher.',
  prerequisites: ['ob/book-basics'],
  objectives: [
    'Recognise a venue board (one product on several lines) in under five seconds',
    'Find the best bid and best ask across any number of venues and say whether they cross',
    'Trade the widest cross and state its profit, product by product on multi-product boards',
    'Reject the traps: touching quotes, mid-price comparisons, mixed products, reading an ask as a bid',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: A trades on three venues (bid / ask): ${boardLine(C3)}. Which one buy and one sell lock in the most? Try two approaches, then give the trades and the profit.`, answer: `Buy on venue ${venueOf(ca)} at ${px(ca.ask)}, sell on venue ${venueOf(cb)} at ${px(cb.bid)}: +${px(cb.bid - ca.ask)}.`, explain: `Pairing the neighbours venue 1 and venue 2 (buy ${px(C3[0].ask)}, sell ${px(C3[1].bid)}) earns only ${px(near12)}. It still solves the board, but the widest pair uses the lowest ask of all venues, which sits on venue ${venueOf(ca)}.` },
    { type: 'text', text: 'The cue: **one product appears on two or more lines**, labelled by venue ("A (venue 1)", "A (venue 2)"). Every line holds the same single product, so any buy on one line cancels any sell on another.' },
    { type: 'list', items: [`"A (venue 1) ${quote(PV1)}; A (venue 2) ${quote(PV2)}"`, 'Three venues for A, each with its own bid and ask', 'A and B each on two venues: one product crosses, the other only touches'] },
    { type: 'text', text: 'Not this lesson: a card that holds **several** products (A + B, 2A + B, A − B). Those are priced from their legs in the bundle lessons.' },
    { type: 'check', scope: 'the recognition cues', questions: [
      mc({ q: 'Which board is a crossed-venue board?', right: 'A (venue 1), A (venue 2), B (venue 1), B (venue 2)',
        wrong: [['A, B, A + B', 'a bundle board: A + B is priced from its legs'], ['A, B, A − B', 'a spread card: priced from A and B with a sign flip'], ['A, A + B, B + C, C', 'a chain: B has no card of its own']],
        explain: 'Only the first lists single products on several venues.' }),
    ] },

    sec('why'),
    { type: 'text', text: `Crossed venues are the easiest boards in the task and the warm-up for every other type: every bundle arbitrage is the same comparison (a bid above an ask for the same thing) with a replica in place of the second venue. They should cost you well under the ${PER_BOARD}-second average, which banks time for the chains and hidden boards.` },

    sec('anchor'),
    { type: 'text', text: 'From Book basics: on **one** book the bid is below the ask, so buying and selling the same card pays the spread. The one change here: **two books for one product**. Nothing forces venue 2\'s bid to sit below venue 1\'s ask, and when it does not, the round trip pays you instead.' },
    { type: 'check', scope: 'one book against two books', questions: [
      mc({ q: 'Two venues quote A. Which comparison can reveal a profit?', right: 'Venue 2\'s bid against venue 1\'s ask',
        wrong: [['Venue 1\'s bid against venue 1\'s ask', 'one book is never crossed: its bid is always below its ask'], ['Venue 2\'s mid against venue 1\'s mid', 'mids are not tradable'], ['Venue 2\'s ask against venue 1\'s ask', 'two asks are two buys: a profit needs one buy and one sell']],
        explain: 'A profit needs a sale (at a bid) above a purchase (at an ask), on different books.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Put every price for one product on a single line. Bids are where you can sell, asks where you can buy. An arbitrage exists exactly when **some bid sits to the right of some ask**; the widest gap is between the rightmost bid and the leftmost ask.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 58.5, max: 63.5, step: 0.5, marks: P3.flatMap((c) => [{ x: c.bid, label: `bid ${venueOf(c)}` }, { x: c.ask, label: `ask ${venueOf(c)}` }]) }, caption: `A on three venues (${boardLine(P3)}). The rightmost bid is venue ${venueOf(pb)}'s ${px(pb.bid)}; the leftmost ask is venue ${venueOf(pa)}'s ${px(pa.ask)}. The gap between them, ${px(pb.bid - pa.ask)}, is the best profit.` },
    { type: 'check', scope: 'rightmost bid, leftmost ask', questions: [{ make: bestProfitQ }] },
    { type: 'text', text: 'With two products, scan each product on its own. A product whose best bid only **equals** its best ask earns 0 and does not count.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Card', 'Bid (you sell)', 'Ask (you buy)'], rows: [...TA, ...TB].map((c) => [c.name, px(c.bid), px(c.ask)]) }, caption: `A touches: venue 2's bid ${px(bestBid(two.A).bid)} equals venue 1's ask ${px(bestAsk(two.A).ask)}. B crosses: venue 2's bid ${px(bestBid(two.B).bid)} is above venue 1's ask ${px(bestAsk(two.B).ask)}.` },
    { type: 'check', scope: 'one product at a time', questions: [{ make: whichProductQ }] },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B'], bTrade), caption: `The B trade in a ledger. Buying on venue 1 makes you long one B; selling on venue 2 closes it. A is never touched. Cash +${px(outcome(bTrade, 2).cash)}.` },
    { type: 'check', scope: 'the ledger of a venue trade', questions: [
      { make: (rng) => { const { b, a, profit } = venueBoard(rng, 2); return { type: 'number', q: `You buy one A on venue ${venueOf(a)} at ${px(a.ask)} and sell one A on venue ${venueOf(b)} at ${px(b.bid)}. Cash at the end?`, answer: profit, hints: ['A buy subtracts, a sale adds.', `${px(b.bid)} − ${px(a.ask)}.`], explain: `−${px(a.ask)} + ${px(b.bid)} = ${px(profit)}, and A nets to 0.` }; } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'The method is four moves, and each one comes straight from the ledger: which cards can cancel, where to sell, where to buy, and what the pair locks in.' },
    { type: 'steps', steps: [
      { say: 'Group the cards by product. Only cards of the same product can cancel each other.', why: 'Buying A on one venue and selling B on another leaves you long A and short B: not flat.',
        checks: [mc({ q: 'You buy A on venue 1 and sell B on venue 2. What is your position?', right: 'A +1, B −1', wrong: [['Flat', 'different products never cancel'], ['A −1, B +1', 'a buy adds, a sale removes'], ['A 0, B 0 with cash locked in', 'nothing is locked in while A and B are open']], explain: 'Each product keeps its own count.' })] },
      { say: 'For that product, find the highest bid on any venue. That is the best price you can sell at.', why: 'Any other bid pays you less for the same unit.',
        checks: [{ make: (rng) => { const { cs, b } = venueBoard(rng, 3); return { type: 'number', q: `A (bid / ask): ${boardLine(cs)}. Highest bid?`, answer: b.bid, explain: `Venue ${venueOf(b)}: ${px(b.bid)}.` }; } }] },
      { say: 'Find the lowest ask on any venue. That is the cheapest place to buy.', why: 'Any other ask costs you more for the same unit.',
        checks: [{ make: (rng) => { const { cs, a } = venueBoard(rng, 3); return { type: 'number', q: `A (bid / ask): ${boardLine(cs)}. Lowest ask?`, answer: a.ask, explain: `Venue ${venueOf(a)}: ${px(a.ask)}.` }; } }] },
      { say: 'If the best bid is above the best ask, buy one at the best ask and sell one at the best bid. The profit is best bid − best ask.', why: 'One buy and one sell of the same product is flat, so the price gap is locked-in cash. No other pair can beat the extremes.',
        checks: [{ hinge: true, make: hingeQ }] },
    ] },
    { type: 'explain', prompt: 'Why does the best pair always use the highest bid and the lowest ask, even when they are on venues that are not listed next to each other?', model: 'Every pair is one sale and one purchase of the same product, so its profit is the bid I sell at minus the ask I buy at. The highest bid makes the first term as big as possible and the lowest ask makes the second as small as possible, whatever venues they are on. The order the venues are listed in means nothing.', points: ['Profit of a pair = bid sold at − ask bought at', 'Maximise the bid and minimise the ask independently', 'The listing order of venues is irrelevant'] },

    sec('worked'),
    { type: 'text', text: 'Two live boards from the same generator the practice mode uses. On each: find the highest bid and the lowest ask per product, decide, tap the two prices, and read the net row before you look at the solution. On the second board one product only touches: notice how fast you can dismiss it.' },
    { type: 'thinkaloud', problem: `A on three venues (bid / ask): ${boardLine(C3)}.`, lines: [
      { t: 0, say: 'Three lines, all A, different venues: a crossed-venue board. Two numbers to find.' },
      { t: 3, say: `Bid column: ${C3.map((c) => px(c.bid)).join(', ')}. Highest ${px(cb.bid)}, venue ${venueOf(cb)}.` },
      { t: 6, say: `Ask column: ${C3.map((c) => px(c.ask)).join(', ')}. Lowest ${px(ca.ask)}, venue ${venueOf(ca)}.` },
      { t: 9, say: `${px(cb.bid)} is above ${px(ca.ask)}: crossed by ${px(cb.bid - ca.ask)}. The venues are not neighbours; that does not matter.` },
      { t: 12, say: `Buy on venue ${venueOf(ca)} at ${px(ca.ask)}, sell on venue ${venueOf(cb)} at ${px(cb.bid)}. One buy, one sell of A: net 0. Submit.` },
    ] },
    { type: 'check', scope: 'the same scan on a fresh board', questions: [{ make: bestProfitQ }] },
    { type: 'worked', section: 'ob', family: 'crossed', difficulty: 1, seed: 'a', intro: 'One product, two venues. Find the cross, tap the two prices, check the net, then open the solution.' },
    { type: 'worked', section: 'ob', family: 'crossed', difficulty: 2, seed: 'b', fade: 2, intro: 'Two products, two venues each. The scan is given; the trades and the final check are yours.' },

    sec('predict'),
    { type: 'predict', question: `Venue 1: A ${quote(PV1)}. Venue 2: A ${quote(PV2)}, a profit of ${px(PV2.bid - PV1.ask)}. Predict the new profit if (a) venue 2 moves both its prices up by ${px(shift)}, or (b) instead venue 1 widens its spread by ${px(widen)} on each side.`, answer: `(a) ${px(PV2.bid + shift - PV1.ask)}: the bid you sell at rises by ${px(shift)}. (b) ${px(PV2.bid - (PV1.ask + widen))}: the ask you buy at rises by ${px(widen)}, and a zero profit no longer counts.`, explain: 'Only two prices matter: the bid you sell at and the ask you buy at. Venue 1\'s bid and venue 2\'s ask never enter.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'crossed', extra: [
      { belief: 'Compare the venues\' mid prices.', fix: 'A higher mid on venue 2 is not an arbitrage unless its bid clears venue 1\'s ask.' },
      { belief: 'Touching quotes (bid = ask across venues) are a free trade.', fix: 'They earn exactly 0, and the board needs cash above zero.' },
      { belief: 'Pair the venues listed next to each other.', fix: 'Scan every venue: the best pair is the highest bid against the lowest ask, wherever they sit.' },
      { belief: 'Buying A on one venue and selling B on another is a hedge.', fix: 'Different products never cancel: you are long one and short the other.' },
    ] },
    { type: 'erroneous', problem: `A candidate solves A on three venues: ${boardLine(P3)}. One step is wrong.`, steps: [
      `Lowest ask: ${px(pa.ask)}, on venue ${venueOf(pa)}.`,
      `Highest bid: ${px(P3[1].ask)}, on venue 2.`,
      `Buy on venue ${venueOf(pa)} at ${px(pa.ask)}, sell on venue 2 at ${px(P3[1].ask)}.`,
      `Profit ${px(errWrong)}: submit.`,
    ], errorStep: 1, explain: `${px(P3[1].ask)} is venue 2's **ask**, the price you would pay there. Its bid is ${px(P3[1].bid)}. The sale earns ${px(P3[1].bid)}, so the profit is ${px(errProfit)}, and the trade list in step 3 cannot be tapped as written.` },
    { type: 'check', scope: 'the mid-price trap', questions: [
      { make: (rng) => { const v = hp(rng, 40, 140), s1 = rng.pick([1, 1.5, 2]), s2 = 0.5, g = rng.pick([0.5, 1, 2, 3]); const m2 = v + g; const q1 = V('A', 1, v - s1, v + s1), q2 = V('A', 2, m2 - s2, m2 + s2); const ok = q2.bid > q1.ask;
        return mc({ q: `Venue 1: A ${quote(q1)}. Venue 2: A ${quote(q2)}. Venue 2's mid is higher by ${px(g)}. Is there an arbitrage?`, right: ok ? `Yes: buy on venue 1 at ${px(q1.ask)}, sell on venue 2 at ${px(q2.bid)}` : `No: venue 2's bid ${px(q2.bid)} is not above venue 1's ask ${px(q1.ask)}`,
          wrong: ok ? [[`No: venue 2's bid ${px(q2.bid)} is not above venue 1's ask ${px(q1.ask)}`, 'misread the prices: the bid does clear the ask']] : [[`Yes: buy on venue 1 at ${px(q1.ask)}, sell on venue 2 at ${px(q2.bid)}`, 'trusted the mid gap: the spreads swallow it']],
          explain: `Compare ${px(q2.bid)} with ${px(q1.ask)}: ${ok ? `edge ${px(q2.bid - q1.ask)}` : `edge ${px(q2.bid - q1.ask)}, not positive`}.` }, rng); } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Two numbers per product: the highest bid and the lowest ask. Run your eye down the bid column once, then the ask column once. If the highest bid is not above the lowest ask, the product has nothing, whatever the mids say.' },
    { type: 'callout', tone: 'speed', text: `Any positive pair solves the board, so do not agonise over the widest one when the clock is short. But the widest pair is found in the same single scan, so take it. Before submitting, count: one buy and one sell of the same product. A wrong submit costs ${PENALTY} seconds.` },
    { type: 'check', scope: 'the two-number scan', questions: [{ make: bestProfitQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Same product on several venues → highest bid anywhere > lowest ask anywhere? Buy the ask, sell the bid. Equal is zero, zero does not count.' },

    sec('contrast'),
    { type: 'compare', columns: ['Board', 'Compare', 'Trade when it pays'], rows: [
      ['Crossed venues', 'highest bid vs lowest ask, same product', 'buy the lowest ask, sell the highest bid'],
      ['Rich bundle', 'bundle bid vs legs\' asks added', 'sell the bundle, buy every leg'],
      ['Cheap bundle', 'bundle ask vs legs\' bids added', 'buy the bundle, sell every leg'],
      ['One book alone', 'its own bid vs its own ask', 'never: bid < ask on one book'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. If the highest bid and the lowest ask are on the **same** venue, there is no arbitrage: that venue\'s bid is below its own ask. Touching (equal) quotes earn 0. With three or more venues, the best pair can skip over a venue in the middle.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a rich bundle is a crossed market between the bundle and a "second venue" you build from its legs, whose ask is the legs\' asks added. Every Orderbooks type is this comparison with a different replica.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc({ q: 'On a three-venue board, venue 2 has both the highest bid and the lowest ask. What do you do?', right: 'Nothing on A: venue 2\'s bid is below its own ask, so no pair crosses',
        wrong: [['Buy and sell on venue 2', 'one book is never crossed: that pays the spread'], ['Pair venue 1 with venue 3', 'their bids are lower and their asks higher than venue 2\'s, so they cannot cross either'], ['Buy on venue 2, sell on the venue with the next best bid', 'the next best bid is even lower than venue 2\'s bid, which is below every ask']],
        explain: 'Best bid ≤ its own ask ≤ every other ask: no bid anywhere beats any ask.' }),
    ] },

    { type: 'variation', base: `Base: venue 1 A ${quote(PV1)}, venue 2 A ${quote(PV2)}. Buy on venue 1, sell on venue 2: +${px(PV2.bid - PV1.ask)}.`, rows: [
      { change: `Venue 1's bid drops by ${px(vDrop)}`, effect: `Nothing: you buy on venue 1, so only its ask counts. Profit stays ${px(PV2.bid - PV1.ask)}.` },
      { change: `Venue 2's bid drops by ${px(PV2.bid - PV1.ask)}`, effect: `It now equals venue 1's ask: profit 0, no trade.` },
      { change: `A third venue quotes A ${quote(PV3)}`, effect: `New lowest ask ${px(PV3.ask)}: buy there instead. Profit ${px(PV2.bid - PV3.ask)}.` },
      { change: `Every venue 2 price rises by ${px(shift)}`, effect: `The bid you sell at rises: profit ${px(PV2.bid + shift - PV1.ask)}.` },
    ] },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'crossed', count: 3 },
  ],
};
