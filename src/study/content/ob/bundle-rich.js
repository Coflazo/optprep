// Orderbooks family 2: the rich bundle. A bundle whose bid is above the cost of its legs bought
// at their asks: sell the bundle, buy every leg once.
import { sec, px, r6, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeText, posText, singles, mispriced, boardText, PENALTY } from './book-basics.js';

// Challenge board: three legs, rich by 0.5 (a past-format board).
const A3 = card('A', [1, 0, 0], 12, 12.5), B3 = card('B', [0, 1, 0], 18, 18.5), C3 = card('C', [0, 0, 1], 30, 31);
const ABC = card('A + B + C', [1, 1, 1], 62.5, 63.5);
const legs3 = [part(A3), part(B3), part(C3)];
const pkg3 = packageOf(ABC, legs3, true);
// Two-leg picture board.
const A2 = card('A', [1, 0], 40, 40.5), B2 = card('B', [0, 1], 60, 60.5), AB2 = card('A + B', [1, 1], 101.5, 102);
const legs2 = [part(A2), part(B2)];
// Erroneous example: a fair three-leg bundle that looks rich if C is priced at its bid.
const ABCfair = card('A + B + C', [1, 1, 1], 61.5, 63.5);
const wrongCost = r6(A3.ask + B3.ask + C3.bid);
// Predict: move the bundle bid, or the bundle ask.
const bump = 0.5;
const Cd = card('C', [0, 0, 1], 30, 30.5);

// n legs (A, B, C...) plus optional distractor products that sit in no bundle; the bundle is
// rich (bid above the legs' asks) or cheap (ask below the legs' bids). Shared with bundle-cheap.
export function legsBoard(rng, n = 2, extra = 0, rich = true) {
  const names = ['A', 'B', 'C', 'D'].slice(0, n + extra);
  const cs = singles(rng, names, 10, 120);
  const parts = cs.slice(0, n).map((c) => part(c));
  const bundle = mispriced(names.slice(0, n).join(' + '), names.map((_, j) => (j < n ? 1 : 0)), parts, rich, rng.pick([0.5, 1, 1.5]), rng.pick([0.5, 1]));
  return { names, cs, parts, bundle, e: rich ? edgeSell(bundle, parts) : edgeBuy(bundle, parts) };
}
const richBoard = (rng, n, extra) => legsBoard(rng, n, extra, true);

function richQuoteQ(rng) {
  const [a, b] = singles(rng, ['A', 'B'], 20, 120);
  const p = [part(a), part(b)], La = buyCost(p), Lb = sellValue(p);
  const rich = card('A + B', [1, 1], r6(La + 0.5), r6(La + 1.5));
  const cheap = card('A + B', [1, 1], r6(Lb - 1.5), r6(Lb - 0.5));
  const fair = card('A + B', [1, 1], r6(La - 0.5), r6(La + 0.5));
  const midOnly = card('A + B', [1, 1], r6(La - 0.5), r6(La + 2.5));
  const Q = (c) => `A + B ${quote(c)}`;
  return mc({ q: `A ${quote(a)}, B ${quote(b)} (bid / ask). Which A + B quote is rich (sell it, buy the legs)?`, right: Q(rich),
    wrong: [[Q(cheap), 'its ask is below the legs\' bids added: that bundle is cheap, the opposite trade'], [Q(fair), 'its bid is below the legs\' asks added: nothing to sell into'], [Q(midOnly), 'its mid is high, but its bid does not clear the legs\' asks added']],
    explain: `The legs cost ${px(a.ask)} + ${px(b.ask)} = ${px(La)} at the asks. Only ${quote(rich)} has a bid above that.` }, rng);
}

function edgeQ(rng) {
  const { cs, parts, bundle, e } = richBoard(rng, rng.pick([2, 3]));
  return { type: 'number', q: `Board (bid / ask): ${boardText([...cs, bundle])}. Profit from selling ${bundle.name} and buying its legs?`, answer: e,
    hints: ['Buying the legs pays their asks.', `Legs' ask: ${parts.map((p) => px(p.ask)).join(' + ')} = ${px(buyCost(parts))}. Compare with the bundle bid.`],
    explain: `${px(bundle.bid)} − ${px(buyCost(parts))} = ${px(e)}.` };
}

// Hinge: the package on a board with an optional distractor; every wrong option is a real mistake.
function packageQ(rng) {
  const extra = rng.chance(0.5) ? 1 : 0;
  const { names, cs, parts, bundle } = richBoard(rng, 2, extra);
  const pkg = packageOf(bundle, parts, true);
  const wrong = [
    [cap(tradeText(flip(pkg))), 'traded the wrong way: the bundle ask is above the legs\' bids added, so buying it loses'],
    [cap(tradeText(pkg.slice(0, 2))), `left a leg open: you end short one ${parts[1].name}`],
    ['No trade: a bundle is always worth exactly its legs', 'a bundle has its own quote; nothing forces it to match its legs, which is the whole task'],
  ];
  if (extra) wrong.push([cap(tradeText([...pkg, [cs[2], 'buy']])), `${names[2]} is in no bundle: buying it leaves you long ${names[2]}`]);
  return mc({ q: `Board (bid / ask): ${boardText([bundle, ...cs])}. Which trades lock in a profit?`, right: cap(tradeText(pkg)), wrong,
    explain: `Legs' ask ${px(buyCost(parts))} < bundle bid ${px(bundle.bid)}: sell the bundle, buy one of each leg, profit ${px(edgeSell(bundle, parts))}.` }, rng);
}

function notRichQ(rng) {
  const cs = singles(rng, ['A', 'B', 'C'], 10, 90);
  const p = cs.map((c) => part(c)), La = buyCost(p);
  const bid = r6(La - rng.pick([0, 0.5])), X = card('A + B + C', [1, 1, 1], bid, r6(bid + 2 * rng.pick([0.5, 1])));
  const bidTrap = r6(cs[0].ask + cs[1].ask + cs[2].bid);
  return mc({ q: `Board (bid / ask): ${boardText([...cs, X])}. Should you sell A + B + C and buy the three legs?`, right: `No: the legs cost ${px(La)} and the bid is ${px(bid)}`,
    wrong: [[`Yes: the legs cost ${px(bidTrap)} and the bid is ${px(bid)}`, 'priced one leg (C) at its bid: every leg you buy costs its ask']],
    explain: `Edge = ${px(bid)} − ${px(La)} = ${px(bid - La)}: ${bid - La === 0 ? 'zero does not count' : 'a loss'}.` }, rng);
}

export default {
  id: 'ob/bundle-rich',
  book: 'ob',
  kind: 'family',
  family: 'bundle-rich',
  title: 'Rich bundle: sell it, buy the parts',
  summary: 'Bundle bid above the legs\' asks added: sell one bundle, buy one of every leg, keep the gap.',
  prerequisites: ['ob/book-basics', 'ob/crossed'],
  objectives: [
    'Price a bundle\'s replica at the legs\' asks and compare it with the bundle bid in one pass',
    'Execute the package: one sale of the bundle, one purchase of every leg, and count every product to 0',
    'Ignore products that sit in no bundle',
    'Explain why the legs\' bids, the bundle ask and the mids never enter the rich check',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A3, B3, C3, ABC])}. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeText(pkg3))}: +${px(outcome(pkg3, 3).cash)}.`, explain: `The legs bought at their asks cost ${px(A3.ask)} + ${px(B3.ask)} + ${px(C3.ask)} = ${px(buyCost(legs3))}; the bundle bid is ${px(ABC.bid)}. If you added the bids (${px(sellValue(legs3))}) you saw a bigger gap than exists; if you tried to buy the bundle, its ask ${px(ABC.ask)} is above every way of selling the legs.`,
      attempts: [
        { id: 'bids', label: 'Legs priced at their bids', approach: `Added the leg bids, ${px(sellValue(legs3))}, and saw the bundle bid ${px(ABC.bid)} clear them by ${px(ABC.bid - sellValue(legs3))}.`, breaksAt: `You buy the legs, and buying pays the ask: they cost ${px(buyCost(legs3))}, so the real gap is ${px(edgeSell(ABC, legs3))}.` },
        { id: 'buyit', label: 'Buy the bundle instead', approach: `Bought A + B + C at ${px(ABC.ask)} and sold the three legs.`, breaksAt: `The legs sell for only ${px(sellValue(legs3))}: that direction loses ${px(-edgeBuy(ABC, legs3))}.` },
        { id: 'someLegs', label: 'Buy only some of the legs', approach: 'Sold A + B + C, then bought A and B.', breaksAt: 'The bundle holds three legs, so you end short one C: not flat, nothing locked in.' },
      ] },
    { type: 'text', text: 'The cue: a **bundle card** (A + B, A + B + C) and **every one of its legs quoted alone**, with no weights and no minus signs. The question is one comparison: is the bundle\'s **bid** above what the legs cost at their **asks**?' },
    { type: 'list', items: [`"${boardText([A2, B2, AB2])}"`, `"${boardText([A3, B3, C3, ABC])}"`, 'Boards with an extra product (C) that appears in no bundle: a distractor'] },
    { type: 'check', scope: 'spotting a rich bundle', questions: [{ make: richQuoteQ }] },

    sec('why'),
    { type: 'text', text: 'Bundles are the core of the Orderbooks task. Real markets are full of them (index funds, baskets, packages), and a bundle and its parts must trade at consistent prices. When the bundle\'s buyers pay more than the parts cost, you sell them the bundle and build it from the parts at the same moment. This lesson and the cheap bundle are the two halves of the check you run on every bundle card.' },

    sec('anchor'),
    { type: 'text', text: 'You know the crossed market: one venue\'s **bid** above another venue\'s **ask** for the same product. One change: the "second venue" is the legs. Buying one A and one B delivers exactly one A + B, so the legs act as a venue for the bundle whose **ask is the legs\' asks added**. A rich bundle is a crossed market between the bundle\'s bid and that ask. Everything from crossed venues carries over: a touching quote earns 0, and the trade is one sale against one purchase of the same thing.' },
    { type: 'check', scope: 'the legs as a second venue', questions: [
      { make: (rng) => { const [a, b] = singles(rng, ['A', 'B'], 20, 120); const p = [part(a), part(b)]; return { type: 'number', q: `A ${quote(a)}, B ${quote(b)}. The legs act as a venue for A + B. What is that venue's ask (the cost of one A + B built from the legs)?`, answer: buyCost(p), hints: ['Building the bundle means buying each leg.', `${px(a.ask)} + ${px(b.ask)}.`], explain: `${px(a.ask)} + ${px(b.ask)} = ${px(buyCost(p))}.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'The bundle table puts the bundle\'s quote above its legs, with the legs added up in the last row. Read one diagonal: the bundle **bid** (top left) against the legs\' **ask** total (bottom right).' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(ABC, legs3), caption: `The challenge board. Bundle bid ${px(ABC.bid)} against the legs' ask ${px(buyCost(legs3))}: sell the bundle, buy the legs, +${px(edgeSell(ABC, legs3))}. The other diagonal (legs' bid ${px(sellValue(legs3))} against bundle ask ${px(ABC.ask)}) is a loss.` },
    { type: 'check', scope: 'the rich diagonal', questions: [{ make: edgeQ }] },
    { type: 'diagram', diagram: 'numberline', spec: { min: 99.5, max: 102.5, step: 0.5, marks: [{ x: sellValue(legs2), label: 'legs bid' }, { x: buyCost(legs2), label: 'legs ask' }, { x: AB2.bid, label: 'bundle bid' }, { x: AB2.ask, label: 'bundle ask' }] }, caption: `A ${quote(A2)}, B ${quote(B2)}, A + B ${quote(AB2)} on one price line. The bundle's whole quote sits to the right, and its bid (${px(AB2.bid)}) has passed the legs' ask (${px(buyCost(legs2))}): the two books cross by ${px(edgeSell(AB2, legs2))}.` },
    { type: 'check', scope: 'reading the price line', questions: [
      mc({ q: 'On the price line, which order of the four prices (left to right) means the bundle is rich?', right: 'legs bid, legs ask, bundle bid, bundle ask',
        wrong: [['legs bid, bundle bid, legs ask, bundle ask', 'the bundle bid is still left of the legs\' ask: overlapping, not crossed'], ['bundle bid, bundle ask, legs bid, legs ask', 'the bundle sits left of the legs: that is a cheap bundle'], ['bundle bid, legs bid, legs ask, bundle ask', 'the bundle quote just surrounds the legs: nothing crosses']],
        explain: 'Rich = the bundle bid is right of (above) the legs\' ask.' }),
    ] },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B', 'C'], pkg3), caption: `The package in a ledger: one sale of the bundle puts you short one of each leg; one purchase of each leg brings every column back to 0. Cash +${px(outcome(pkg3, 3).cash)}.` },
    { type: 'check', scope: 'executing the package', questions: [
      { make: (rng) => { const { cs, parts, bundle } = richBoard(rng, 3); const pkg = packageOf(bundle, parts, true); const o = outcome(pkg.slice(0, 3), 3); return mc({ q: `You sell ${bundle.name} and buy ${parts[0].name} and ${parts[1].name}. What is left open?`, right: posText(['A', 'B', 'C'], o.net),
        wrong: [['Nothing: flat', 'three trades are not enough: the bundle has three legs, so the package has four trades'], [posText(['A', 'B', 'C'], o.net.map((x) => -x)), 'flipped the sign: selling the bundle makes you short C'], [posText(['A', 'B', 'C'], [-1, -1, -1]), 'forgot that the two purchases close A and B']],
        explain: `The sale gives A −1, B −1, C −1; the purchases close A and B. C is still −1: buy one C.` }, rng); } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'Four moves turn the anchor into a procedure. Each move answers one question about the board, in the same order every time: what is the replica, what does it cost, does the bundle bid beat that cost, and which taps make it flat.' },
    { type: 'steps', steps: [
      { answers: 'someLegs', say: 'Name the replica. One A + B + C is exactly one A, one B and one C. If you sell the bundle, you owe those three units.', why: 'The bundle is its legs; only the exact set of legs cancels it.',
        checks: [mc({ q: 'You sell one A + B + C. Which purchases make you flat?', right: 'One A, one B, one C', wrong: [['One A and one B', 'C is still owed'], ['Three A', 'each product must net to 0 on its own'], ['One A, one B, one C and one more A + B + C', 'the extra bundle makes you long every leg again']], explain: 'One unit of each leg.' })] },
      { answers: 'bids', say: 'Price the replica on the side you trade. You buy the legs, and buying pays the ask, so the replica costs the asks added.', why: 'Always price the side you will actually hit.',
        checks: [{ make: (rng) => { const cs = singles(rng, ['A', 'B', 'C'], 10, 90); const p = cs.map((c) => part(c)); return { type: 'number', q: `A ${quote(cs[0])}, B ${quote(cs[1])}, C ${quote(cs[2])}. What does one of each cost?`, answer: buyCost(p), hints: ['Buy = ask.', `${p.map((x) => px(x.ask)).join(' + ')}.`], explain: `${p.map((x) => px(x.ask)).join(' + ')} = ${px(buyCost(p))}.` }; } }] },
      { answers: 'buyit', say: 'Compare. Selling the bundle receives its bid, so the edge is bundle bid − replica cost. Trade only if it is above 0. The other direction is the cheap check of the next lesson.', why: 'That is the whole cash flow of the package: one bid in, the asks out.',
        checks: [{ hinge: true, make: packageQ }] },
      { say: 'Execute: sell one bundle, buy one of every leg, then read the net row. Products that are in no bundle stay untouched.', why: 'The package is 1 + (number of legs) trades; a distractor product can only break flatness.',
        checks: [{ make: (rng) => { const n = rng.pick([2, 3]); const legs = ['A', 'B', 'C'].slice(0, n).join(' + '); return { type: 'number', q: `How many taps does the package for a rich ${legs} need (the bundle plus its legs)?`, answer: n + 1, explain: `One sale of ${legs} and ${n} leg purchases: ${n + 1}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Why does a rich bundle use its bid and the legs\' asks, and why do the bundle ask and the legs\' bids play no part?', model: 'I sell the bundle, so I receive its bid. That leaves me short every leg, so I buy each one, paying its ask. Those are the only prices my trades touch. The bundle ask and the legs\' bids belong to the opposite package, which I am not doing.', points: ['Selling the bundle receives its bid', 'Covering the short legs means buying them at their asks', 'The bundle ask and legs\' bids belong to the other direction'] },

    sec('worked'),
    { type: 'text', text: 'Watch for the distractor on the first board: a product that appears in no bundle card. It has a quote and may even look cheap, but no package can include it, because nothing on the board cancels it. On the second board there are three legs, so the package has four taps.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A3, B3, C3, ABC])}.`, lines: [
      { t: 0, say: 'A + B + C with all three legs quoted alone, no weights, no minus signs: plain bundle check.' },
      { t: 3, say: `Leg bids ${px(A3.bid)} + ${px(B3.bid)} + ${px(C3.bid)} = ${px(sellValue(legs3))}, bundle bid ${px(ABC.bid)}: ${px(ABC.bid - sellValue(legs3))} of edge.`, slip: true },
      { t: 6, say: `${px(ABC.bid - sellValue(legs3))} is several ticks: too good. I buy the legs, so they cost their asks, not their bids.` },
      { t: 9, say: `Leg asks: ${px(A3.ask)} + ${px(B3.ask)} + ${px(C3.ask)} = ${px(buyCost(legs3))}. Bundle bid ${px(ABC.bid)}: above by ${px(edgeSell(ABC, legs3))}. One tick: plausible.` },
      { t: 13, say: 'Sell A + B + C, buy A, buy B, buy C. Four taps.' },
      { t: 17, say: `Net row: A 0, B 0, C 0, cash +${px(outcome(pkg3, 3).cash)}. Submit.` },
    ] },
    { type: 'check', scope: 'the same check on a fresh board', questions: [{ make: edgeQ }] },
    { type: 'worked', section: 'ob', family: 'bundle-rich', difficulty: 2, seed: 'a', explainAt: [0, 1], intro: 'Two legs and a distractor product. Price the replica at the asks, decide, tap the package, then open the solution.' },
    { type: 'worked', section: 'ob', family: 'bundle-rich', difficulty: 3, seed: 'b', fade: 2, intro: 'Three legs. The pricing and the decision are given; tapping the four trades and checking the net row are yours.' },

    sec('predict'),
    { type: 'predict', question: `Board: A ${quote(A2)}, B ${quote(B2)}, A + B ${quote(AB2)}, profit ${px(edgeSell(AB2, legs2))}. Predict the profit if (a) the bundle bid rises by ${px(bump)}, or (b) instead the bundle ask rises by ${px(bump)}.`, answer: `(a) ${px(edgeSell(AB2, legs2) + bump)}: the price you sell at went up. (b) Still ${px(edgeSell(AB2, legs2))}: you never pay the bundle ask in this package.`, explain: 'Only the bundle bid and the legs\' asks enter the rich package.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'bundle-rich', extra: [
      { belief: 'Price the legs at their bids (or mids) when you buy them.', fix: 'Buying pays the ask. The bids make the gap look bigger than it is.' },
      { belief: 'Compare the bundle ask with the legs.', fix: 'You sell the bundle, so only its bid matters.' },
      { belief: 'Buying one or two of the legs is enough.', fix: 'Every leg must be bought once, or that product is left short.' },
      { belief: 'Trade every product on the board.', fix: 'A product in no bundle (a distractor) stays untouched.' },
    ] },
    { type: 'erroneous', problem: `A candidate checks ${boardText([A3, B3, C3, ABCfair])}. One step is wrong.`, steps: [
      'The replica of A + B + C is one A, one B and one C.',
      `Buying them costs ${px(A3.ask)} + ${px(B3.ask)} + ${px(C3.bid)} = ${px(wrongCost)}.`,
      `The bundle bid ${px(ABCfair.bid)} is above ${px(wrongCost)}: sell A + B + C, buy A, B and C.`,
      'Each product nets to 0: submit.',
    ], errorStep: 1, explain: `C was priced at its **bid**. Buying C pays its ask, ${px(C3.ask)}, so the replica costs ${px(buyCost(legs3))} and the edge is ${px(edgeSell(ABCfair, legs3))}: a loss. This submit costs ${PENALTY} seconds and there is no rich trade here.` },
    { type: 'check', scope: 'pricing every leg at its ask', questions: [{ make: notRichQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Add the leg asks once and hold that one number. The decision is a single comparison with the bundle bid; you never need the mids, the bundle ask or the legs\' bids for this direction.' },
    { type: 'check', scope: 'one number, one comparison', questions: [{ make: edgeQ }] },
    { type: 'callout', tone: 'speed', text: 'Sanity check before tapping: the edge is usually small (a tick or a few). If your "edge" is several points, you have almost certainly priced a leg at its bid.' },
    { type: 'check', scope: 'the sanity check', questions: [
      { type: 'choice', q: 'Your edge on a bundle comes out at 6 points. What is the likeliest cause?', options: ['a leg priced at its bid', 'a huge mispricing on the board', 'a stale bundle quote'], answer: 0, traps: { 1: 'edges are usually a tick or a few', 2: 'the quotes on the board are live' }, explain: 'A buy leg must be priced at its ask; using the bid inflates the edge.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Bundle bid > leg asks added → sell the bundle, buy one of each leg. Profit = bundle bid − leg asks added.' },

    sec('contrast'),
    { type: 'compare', columns: ['Type', 'Compare', 'Package'], rows: [
      ['Rich bundle', 'bundle bid vs leg asks added', 'sell bundle, buy each leg'],
      ['Cheap bundle', 'bundle ask vs leg bids added', 'buy bundle, sell each leg'],
      ['Crossed venues', 'best bid vs best ask, same product', 'buy the ask, sell the bid'],
      ['Weighted bundle (2A + B)', 'bid vs 2 × ask(A) + ask(B)', 'sell bundle, buy A twice and B once'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. A bid exactly equal to the legs\' ask earns 0: not a solution. Three legs means three spreads to beat, so a three-leg bundle needs a bigger gap on mids to be rich. A distractor product never enters the package.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const { cs, parts } = richBoard(rng, 2); const La = buyCost(parts), e = rng.pick([0, 0, 0.5]), go = e > 0; const X = card('A + B', [1, 1], r6(La + e), r6(La + e + 1)); const yes = 'Yes: one package is enough', no = 'No: the package earns nothing';
        return mc({ q: `A ${quote(cs[0])}, B ${quote(cs[1])}, A + B ${quote(X)}. Does selling A + B and buying the legs solve the board?`, right: go ? yes : no,
          wrong: [[go ? no : yes, go ? `the bid is above the legs' ask by ${px(e)}` : 'the bid only equals the legs\' ask: zero cash is not a profit'], ['Only with two copies of the package', go ? `one package already earns ${px(e)}` : 'two copies of zero are still zero']],
          explain: `${px(X.bid)} − ${px(La)} = ${px(e)}${go ? ': one package solves it.' : ': zero does not count.'}` }, rng); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: every harder type keeps "sell the card at its bid, buy its replica at the asks". Weighted bundles repeat a leg and spreads flip a leg\'s side. Chains build a missing leg from other bundles, and hidden boards use another bundle as the replica.' },
    { type: 'variation', base: `Base: ${boardText([A2, B2, AB2])}. Sell A + B, buy A and B: +${px(edgeSell(AB2, legs2))}.`, rows: [
      { same: true, change: `The bundle ask rises by ${px(1)}`, effect: `Nothing: you sell the bundle, so only its bid counts. Profit stays ${px(edgeSell(card('A + B', [1, 1], AB2.bid, AB2.ask + 1), legs2))}.` },
      { same: true, change: `B's bid falls by ${px(1)}`, effect: `Nothing: you buy B, so its bid never enters. Profit stays ${px(edgeSell(AB2, [part(A2), part(card('B', [0, 1], B2.bid - 1, B2.ask))]))}.` },
      { change: `B's ask rises by ${px(edgeSell(AB2, legs2))}`, effect: `The legs now cost exactly the bundle bid: profit ${px(edgeSell(AB2, [part(A2), part(card('B', [0, 1], B2.bid, B2.ask + edgeSell(AB2, legs2)))]))}, no trade.` },
      { same: true, change: `A product C appears, quoted ${quote(Cd)}, in no bundle`, effect: 'Nothing: C is a distractor. Leave it alone.' },
      { fusion: true, change: `The whole A + B quote rises by ${px(1)} and A's ask rises by ${px(0.5)}`, effect: `Both enter: +${px(1)} on the bundle bid you sell at, −${px(0.5)} on the A you buy. Profit ${px(edgeSell(card('A + B', [1, 1], AB2.bid + 1, AB2.ask + 1), [part(card('A', [1, 0], A2.bid, A2.ask + 0.5)), part(B2)]))}.` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const { cs, parts, bundle, e } = richBoard(rng, 3, 1); return { type: 'number', q: `Board (bid / ask): ${boardText(rng.shuffle([...cs, bundle]))}. One package locks in a profit. How much?`, answer: e,
        hints: ['D is in no bundle. Price the three legs at their asks.', `Legs' ask ${px(buyCost(parts))}; compare with the ${bundle.name} bid.`], explain: `${px(bundle.bid)} − ${px(buyCost(parts))} = ${px(e)}; D stays untouched.` }; } },
      far: { make: (rng) => { const c = (lo, hi) => rng.int(lo, hi), usd = (x) => (x / 100).toFixed(2);
        const shares = ['X', 'Y', 'Z'].map((n) => { const bid = c(2000, 9000), w = c(1, 3); return { n, bid, ask: bid + w }; });
        const asks = shares.reduce((s, x) => s + x.ask, 0), e = c(1, 5), fb = asks + e, fa = fb + c(2, 4);
        return { type: 'number', q: `A fund F holds exactly one share each of X, Y and Z. Quotes in $ (bid / ask): ${shares.map((x) => `${x.n} ${usd(x.bid)} / ${usd(x.ask)}`).join('; ')}; F ${usd(fb)} / ${usd(fa)}. What does selling 100 units of F and buying 100 of each share lock in, in dollars?`, answer: e,
          hints: ['Selling F receives its bid; buying the shares pays their asks.', `Shares at the asks: $${usd(asks)} per unit of F; F bid $${usd(fb)}.`],
          explain: `Per unit: ${usd(fb)} − ${usd(asks)} = $${usd(e)}. Times 100: $${e}. The fund is a bundle and the shares are its legs.` }; } },
      principle: mc({ q: 'Which idea carried over from the rich bundle to the fund?', right: 'Sell the package at its bid, buy its parts at their asks',
        wrong: [['Compare the fund\'s mid with the shares\' mids', 'mids are never traded: a mid gap can vanish after the spreads'], ['A fund always trades at exactly its holdings\' value', 'nothing forces it to, and that gap is the trade'], ['Buy the fund and sell the shares whenever they differ', 'the direction comes from which side is rich: here the fund bid beats the shares\' asks']],
        explain: 'The fund is a bundle: its bid above its holdings bought at their asks is a rich bundle, traded the same way.' }),
    },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'bundle-rich', count: 3 },
  ],
};
