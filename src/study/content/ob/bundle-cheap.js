// Orderbooks family 3: the cheap bundle. A bundle whose ask is below what its legs sell for at
// their bids: buy the bundle, sell every leg once. The mirror image of the rich bundle.
import { sec, px, r6, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeText, posText, singles, boardText, PENALTY } from './book-basics.js';
import { legsBoard } from './bundle-rich.js';

// Challenge board: two legs, cheap by 1.5 (a past-format board).
const A = card('A', [1, 0], 70, 71), B = card('B', [0, 1], 30, 31), AB = card('A + B', [1, 1], 97.5, 98.5);
const legs = [part(A), part(B)];
const pkg = packageOf(AB, legs, false);
// Three-leg picture board, cheap by 1.0.
const A3 = card('A', [1, 0, 0], 22, 22.5), B3 = card('B', [0, 1, 0], 35, 35.5), C3 = card('C', [0, 0, 1], 43, 43.5), ABC = card('A + B + C', [1, 1, 1], 98, 99);
const legs3 = [part(A3), part(B3), part(C3)];
const pkg3 = packageOf(ABC, legs3, false);
// Wide bundle spread, still cheap (predict).
const Aw = card('A', [1, 0], 110, 111), Bw = card('B', [0, 1], 90, 91), ABw = card('A + B', [1, 1], 197, 199.5);
const legsW = [part(Aw), part(Bw)];
// Erroneous example: legs priced at their asks when selling.
const Ae = card('A', [1, 0], 40, 40.5), Be = card('B', [0, 1], 60, 61), ABe = card('A + B', [1, 1], 99.5, 101);
const legsE = [part(Ae), part(Be)];

const cheapBoard = (rng, n, extra) => legsBoard(rng, n, extra, false);

function cheapQuoteQ(rng) {
  const [a, b] = singles(rng, ['A', 'B'], 20, 120);
  const p = [part(a), part(b)], La = buyCost(p), Lb = sellValue(p);
  const cheap = card('A + B', [1, 1], r6(Lb - 1.5), r6(Lb - 0.5));
  const rich = card('A + B', [1, 1], r6(La + 0.5), r6(La + 1.5));
  const fair = card('A + B', [1, 1], r6(Lb - 0.5), r6(Lb + 0.5));
  const midOnly = card('A + B', [1, 1], r6(Lb - 2.5), r6(Lb + 0.5));
  const Q = (c) => `A + B ${quote(c)}`;
  return mc({ q: `A ${quote(a)}, B ${quote(b)} (bid / ask). Which A + B quote is cheap (buy it, sell the legs)?`, right: Q(cheap),
    wrong: [[Q(rich), 'its bid is above the legs\' asks added: that bundle is rich, the opposite trade'], [Q(fair), 'its ask is above the legs\' bids added: buying it and selling the legs loses'], [Q(midOnly), 'its mid is low, but its ask does not undercut the legs\' bids added']],
    explain: `The legs sell for ${px(a.bid)} + ${px(b.bid)} = ${px(Lb)} at the bids. Only ${quote(cheap)} has an ask below that.` }, rng);
}

function edgeQ(rng) {
  const { cs, parts, bundle, e } = cheapBoard(rng, rng.pick([2, 3]));
  return { type: 'number', q: `Board (bid / ask): ${boardText([...cs, bundle])}. Profit from buying ${bundle.name} and selling its legs?`, answer: e,
    hints: ['Selling the legs receives their bids.', `Legs' bid: ${parts.map((p) => px(p.bid)).join(' + ')} = ${px(sellValue(parts))}. Compare with the bundle ask.`],
    explain: `${px(sellValue(parts))} − ${px(bundle.ask)} = ${px(e)}.` };
}

// Hinge: every wrong option is a named mistake.
function packageQ(rng) {
  const extra = rng.chance(0.5) ? 1 : 0;
  const { names, cs, parts, bundle } = cheapBoard(rng, 2, extra);
  const p = packageOf(bundle, parts, false);
  const wrong = [
    [cap(tradeText(flip(p))), 'traded the wrong way: the bundle bid is below the legs\' asks added, so selling it loses'],
    [cap(tradeText(p.slice(0, 2))), `left a leg open: you end long one ${parts[1].name}`],
    [cap(tradeText([[bundle, 'buy'], [cs[0], 'buy'], [cs[1], 'buy']])), 'bought everything: owning the bundle already makes you long the legs, so they must be sold'],
  ];
  if (extra) wrong.push([cap(tradeText([...p, [cs[2], 'sell']])), `${names[2]} is in no bundle: selling it leaves you short ${names[2]}`]);
  return mc({ q: `Board (bid / ask): ${boardText([bundle, ...cs])}. Which trades lock in a profit?`, right: cap(tradeText(p)), wrong,
    explain: `Legs' bid ${px(sellValue(parts))} > bundle ask ${px(bundle.ask)}: buy the bundle, sell one of each leg, profit ${px(edgeBuy(bundle, parts))}.` }, rng);
}

function notCheapQ(rng) {
  const cs = singles(rng, ['A', 'B'], 20, 120);
  const p = cs.map((c) => part(c)), Lb = sellValue(p), La = buyCost(p);
  const ask = r6(Lb + rng.pick([0, 0.5])), X = card('A + B', [1, 1], r6(ask - 2 * rng.pick([0.5, 1])), ask);
  const askTrap = La;
  return mc({ q: `Board (bid / ask): ${boardText([...cs, X])}. Should you buy A + B and sell the legs?`, right: `No: the legs fetch ${px(Lb)} and the ask is ${px(ask)}`,
    wrong: [[`Yes: the legs fetch ${px(askTrap)} and the ask is ${px(ask)}`, 'priced the legs you sell at their asks: selling receives the bid']],
    explain: `Edge = ${px(Lb)} − ${px(ask)} = ${px(Lb - ask)}: ${Lb - ask === 0 ? 'zero does not count' : 'a loss'}.` }, rng);
}

export default {
  id: 'ob/bundle-cheap',
  book: 'ob',
  kind: 'family',
  family: 'bundle-cheap',
  title: 'Cheap bundle: buy it, sell the parts',
  summary: 'Bundle ask below the legs\' bids added: buy one bundle, sell one of every leg, keep the gap.',
  prerequisites: ['ob/bundle-rich'],
  objectives: [
    'Price a bundle\'s legs at their bids and compare the total with the bundle ask',
    'Execute the cheap package: one purchase of the bundle, one sale of every leg, every product to 0',
    'Run both bundle checks on one card and know that at most one can pay',
    'Explain why a wide bundle spread does not stop a cheap-bundle trade',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A, B, AB])}. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeText(pkg))}: +${px(outcome(pkg, 2).cash)}.`, explain: `Selling the bundle fails here: its bid ${px(AB.bid)} is below the legs' ask ${px(buyCost(legs))}. The other direction works: buy A + B for ${px(AB.ask)} and sell the legs for ${px(A.bid)} + ${px(B.bid)} = ${px(sellValue(legs))}.`,
      attempts: [
        { id: 'richOnly', label: 'Only checked the rich side', approach: `Compared the bundle bid ${px(AB.bid)} with the leg asks ${px(buyCost(legs))}, saw a loss and moved on.`, breaksAt: `That rules out one direction only: the ask ${px(AB.ask)} is below the leg bids ${px(sellValue(legs))}.` },
        { id: 'askLegs', label: 'Legs sold at their asks', approach: `Valued the legs you sell at ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(legs))}.`, breaksAt: `Selling receives the bid: the legs fetch ${px(sellValue(legs))}, not ${px(buyCost(legs))}.` },
        { id: 'buyAll', label: 'Bought the bundle and the legs', approach: 'Bought A + B, then bought one A and one B as well.', breaksAt: 'Owning the bundle already makes you long A and B; buying the legs doubles the position instead of closing it.' },
      ] },
    { type: 'text', text: 'The cue is the same board shape as the rich bundle: a bundle card and every one of its legs quoted alone. What differs is the answer to the second check: the bundle\'s **ask** is below what the legs **sell** for at their **bids**. You run both checks on every bundle card; this lesson is the second one.' },
    { type: 'list', items: [`"${boardText([A, B, AB])}"`, `"${boardText([A3, B3, C3, ABC])}"`, 'A bundle with a wide spread next to tight legs: the ask can still undercut'] },
    { type: 'check', scope: 'spotting a cheap bundle', questions: [{ make: cheapQuoteQ }] },

    sec('why'),
    { type: 'text', text: 'Many bundle boards go this way. Candidates who learned only "sell the rich bundle" stare at a cheap board, see a bundle bid below the legs\' asks, and conclude there is nothing to do. The bundle check has two directions, and a board is solved by whichever one pays. Running both costs one extra addition per card, and it is often the difference between solving a board and skipping it.' },

    sec('anchor'),
    { type: 'text', text: 'You know the rich bundle: the legs act as a venue whose **ask** is the leg asks added, and you sell the bundle into it. One change: the same venue also has a **bid**, the leg bids added, which is what the legs fetch when you sell them. A cheap bundle is a crossed market the other way round: the bundle\'s ask is below the legs\' bid. Buy the cheap one, sell the dear one, exactly as with venues. Nothing else is new: the same cards, the same one-unit taps, the opposite sides.' },
    { type: 'check', scope: 'the legs\' bid as the second venue', questions: [
      { make: (rng) => { const [a, b] = singles(rng, ['A', 'B'], 20, 120); const p = [part(a), part(b)]; return { type: 'number', q: `A ${quote(a)}, B ${quote(b)}. What do one A and one B fetch if you sell them (the legs' bid for A + B)?`, answer: sellValue(p), hints: ['Selling receives the bid.', `${px(a.bid)} + ${px(b.bid)}.`], explain: `${px(a.bid)} + ${px(b.bid)} = ${px(sellValue(p))}.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'In the bundle table, read the other diagonal: the legs\' **bid** total (bottom left) against the bundle **ask** (top right). The rich diagonal from the last lesson is still there; on a cheap board it shows a loss, and that is exactly the moment to read the other one.' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(ABC, legs3), caption: `Three legs. Their bids add to ${px(sellValue(legs3))}; the bundle ask is ${px(ABC.ask)}. Buy the bundle, sell the legs: +${px(edgeBuy(ABC, legs3))}. The rich diagonal (bid ${px(ABC.bid)} against the legs' ask ${px(buyCost(legs3))}) is a loss.` },
    { type: 'check', scope: 'the cheap diagonal', questions: [{ make: edgeQ }] },
    { type: 'diagram', diagram: 'numberline', spec: { min: 97, max: 102, step: 0.5, marks: [{ x: AB.bid, label: 'bundle bid' }, { x: AB.ask, label: 'bundle ask' }, { x: sellValue(legs), label: 'legs bid' }, { x: buyCost(legs), label: 'legs ask' }] }, caption: `The challenge board on one line. The bundle's whole quote sits to the left of the legs', and its ask (${px(AB.ask)}) is left of the legs' bid (${px(sellValue(legs))}): crossed by ${px(edgeBuy(AB, legs))}.` },
    { type: 'check', scope: 'reading the price line', questions: [
      mc({ q: 'Left to right on the price line, which order means the bundle is cheap?', right: 'bundle bid, bundle ask, legs bid, legs ask',
        wrong: [['bundle bid, legs bid, bundle ask, legs ask', 'the bundle ask is right of the legs\' bid: overlapping, not crossed'], ['legs bid, legs ask, bundle bid, bundle ask', 'the bundle sits right of the legs: that is a rich bundle'], ['legs bid, bundle bid, bundle ask, legs ask', 'the bundle quote sits inside the legs\' quote: nothing crosses']],
        explain: 'Cheap = the bundle ask is left of (below) the legs\' bid.' }),
    ] },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B', 'C'], pkg3), caption: `The cheap package in a ledger. Buying the bundle makes you long one of each leg; selling each leg brings every column to 0. Cash +${px(outcome(pkg3, 3).cash)}.` },
    { type: 'check', scope: 'executing the cheap package', questions: [
      { make: (rng) => { const { parts, bundle } = cheapBoard(rng, 3); const p = packageOf(bundle, parts, false); const o = outcome(p.slice(0, 3), 3); return mc({ q: `You buy ${bundle.name} and sell ${parts[0].name} and ${parts[1].name}. What is left open?`, right: posText(['A', 'B', 'C'], o.net),
        wrong: [['Nothing: flat', 'a three-leg bundle needs three leg sales'], [posText(['A', 'B', 'C'], o.net.map((x) => -x)), 'flipped the sign: buying the bundle makes you long C'], [posText(['A', 'B', 'C'], [1, 1, 1]), 'forgot that the two sales close A and B']],
        explain: 'The purchase gives A +1, B +1, C +1; the sales close A and B. Sell one C to finish.' }, rng); } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'The same four moves as the rich bundle, with every side flipped. Watch which price each move uses.' },
    { type: 'steps', steps: [
      { answers: 'buyAll', say: 'Buy one bundle. You now hold one of each leg: A + B makes you long one A and one B.', why: 'A bundle is its legs, so owning it is owning them.',
        checks: [mc({ q: 'You buy one A + B + C. Which sales make you flat?', right: 'One A, one B, one C', wrong: [['One A and one B', 'C is still held'], ['Three C', 'each product must net to 0 on its own'], ['One A + B + C and one A', 'selling the bundle back already flattens you; the extra A sale makes you short A']], explain: 'One unit of each leg, sold.' })] },
      { answers: 'askLegs', say: 'Price the replica on the side you trade. You sell the legs, and selling receives the bid, so the legs fetch their bids added.', why: 'Always price the side you will actually hit.',
        checks: [{ make: (rng) => { const cs = singles(rng, ['A', 'B', 'C'], 10, 90); const p = cs.map((c) => part(c)); return { type: 'number', q: `A ${quote(cs[0])}, B ${quote(cs[1])}, C ${quote(cs[2])}. What do one of each fetch when sold?`, answer: sellValue(p), hints: ['Sell = bid.', `${p.map((x) => px(x.bid)).join(' + ')}.`], explain: `${p.map((x) => px(x.bid)).join(' + ')} = ${px(sellValue(p))}.` }; } }] },
      { answers: 'richOnly', say: 'Compare. Buying the bundle pays its ask, so the edge is legs\' bid − bundle ask. Trade only if it is above 0. Run it even after the rich check fails.', why: 'Cash in: the leg bids. Cash out: one bundle ask.',
        checks: [{ hinge: true, make: packageQ }] },
      { say: 'Execute: buy one bundle, sell one of every leg, read the net row. The bundle bid never enters.', why: 'You only ever hit the bundle\'s ask in this package, so the width of the bundle\'s spread is irrelevant.',
        checks: [{ make: (rng) => { const { cs, parts, bundle, e } = cheapBoard(rng, 2); const wid = rng.pick([2, 3, 4]); const W = card(bundle.name, bundle.legs, r6(bundle.ask - wid), bundle.ask); return { type: 'number', q: `Board: ${boardText([...cs, W])}. The bundle's spread is ${px(wid)}. Profit from the cheap package?`, answer: e, hints: ['Only the bundle ask matters when you buy it.', `Legs' bid ${px(sellValue(parts))} − ask ${px(W.ask)}.`], explain: `${px(sellValue(parts))} − ${px(W.ask)} = ${px(e)}; the wide bid is never touched.` }; } }] },
    ] },
    { type: 'explain', prompt: 'A bundle cannot be rich and cheap at the same time. Explain why, using the four prices.', model: 'Rich needs the bundle bid above the legs\' ask; cheap needs the bundle ask below the legs\' bid. The bundle bid is below its ask and the legs\' bid is below their ask. If the ask were below the legs\' bid, the bid would be even lower, so it could not be above the legs\' ask. At most one direction pays, so check one and then the other.', points: ['Rich: bundle bid > legs\' ask; cheap: bundle ask < legs\' bid', 'Each quote has its bid below its ask', 'So both cannot hold: at most one direction pays'] },

    sec('worked'),
    { type: 'text', text: 'Two live boards. On each, add the leg bids once, compare with the bundle ask, then tap the bundle\'s buy price and every leg\'s sell price. The first has two legs; the second has three, so its package is four taps.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A, B, AB])}.`, lines: [
      { t: 0, say: 'A + B with both legs quoted alone: a bundle check.' },
      { t: 3, say: `Rich side: bid ${px(AB.bid)} against leg asks ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(legs))}. No.` },
      { t: 5, say: 'Nothing on this card, then. Next board.', slip: true },
      { t: 6, say: 'Wait: that was one direction. A failed rich check says nothing about the cheap side.' },
      { t: 8, say: `Cheap side: ask ${px(AB.ask)} against leg bids ${px(A.bid)} + ${px(B.bid)} = ${px(sellValue(legs))}. Yes, by ${px(edgeBuy(AB, legs))}.` },
      { t: 12, say: `Buy A + B at ${px(AB.ask)}, sell A at ${px(A.bid)}, sell B at ${px(B.bid)}.` },
      { t: 16, say: `Net row zero, cash +${px(outcome(pkg, 2).cash)}. Submit.` },
    ] },
    { type: 'check', scope: 'the same check on a fresh board', questions: [{ make: edgeQ }] },
    { type: 'worked', section: 'ob', family: 'bundle-cheap', difficulty: 1, seed: 'a', explainAt: [0, 1], intro: 'Two legs. Try it before opening the solution.' },
    { type: 'worked', section: 'ob', family: 'bundle-cheap', difficulty: 3, seed: 'b', fade: 2, intro: 'Three legs. The pricing and the decision are given; the four taps and the net check are yours.' },

    sec('predict'),
    { type: 'predict', question: `Board: ${boardText([Aw, Bw, ABw])}. The bundle's spread (${px(ABw.ask - ABw.bid)}) is much wider than the legs'. Predict: is there a trade, and what does it earn?`, answer: `Yes: the legs sell for ${px(sellValue(legsW))} at their bids and the bundle ask is ${px(ABw.ask)}: buy the bundle, sell the legs, +${px(edgeBuy(ABw, legsW))}.`, explain: 'A wide bundle spread only hurts the direction that uses its bid. The cheap package touches only the ask.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'bundle-cheap', extra: [
      { belief: 'If the bundle bid is below the legs\' ask, there is nothing to do.', fix: 'That rules out only the rich direction. Check the ask against the legs\' bids too.' },
      { belief: 'Price the legs you sell at their asks.', fix: 'Selling receives the bid. The asks make the legs look more valuable than they are.' },
      { belief: 'A wide bundle spread kills the trade.', fix: 'The cheap package never touches the bundle bid; only the ask matters.' },
      { belief: 'After buying the bundle, buy the legs too.', fix: 'Owning the bundle already makes you long the legs; you sell them.' },
    ] },
    { type: 'erroneous', problem: `A candidate checks ${boardText([Ae, Be, ABe])}. One step is wrong.`, steps: [
      'Buying A + B makes me long one A and one B, so I will sell both legs.',
      `Selling them earns ${px(Ae.ask)} + ${px(Be.ask)} = ${px(buyCost(legsE))}.`,
      `The bundle ask ${px(ABe.ask)} is below ${px(buyCost(legsE))}: buy A + B, sell A, sell B.`,
      'Each product nets to 0: submit.',
    ], errorStep: 1, explain: `Selling the legs receives their **bids**: ${px(Ae.bid)} + ${px(Be.bid)} = ${px(sellValue(legsE))}. The edge is ${px(edgeBuy(ABe, legsE))}, a loss, and the rich direction gives ${px(edgeSell(ABe, legsE))}. No trade on this bundle; the submit would cost ${PENALTY} seconds.` },
    { type: 'check', scope: 'pricing the legs you sell at their bids', questions: [{ make: notCheapQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'On every bundle card, add the leg bids and the leg asks in one pass (two running totals), then glance at the bundle quote once: is its bid above the first total or its ask below the second? That covers the rich and the cheap lesson in one look.' },
    { type: 'check', scope: 'both totals in one pass', questions: [
      { make: (rng) => { const rich = rng.chance(0.5); const { cs, parts, bundle, e } = legsBoard(rng, 2, 0, rich); return mc({ q: `Board: ${boardText([...cs, bundle])}. Which package, and what does it earn?`, right: rich ? `Sell the bundle, buy the legs: +${px(e)}` : `Buy the bundle, sell the legs: +${px(e)}`,
        wrong: [[rich ? `Buy the bundle, sell the legs: +${px(e)}` : `Sell the bundle, buy the legs: +${px(e)}`, 'ran only one check and assumed the direction'], ['No trade', `the legs' totals are ${px(sellValue(parts))} / ${px(buyCost(parts))} and the bundle quote crosses one of them`]],
        explain: rich ? `Bundle bid ${px(bundle.bid)} > legs' ask ${px(buyCost(parts))}.` : `Bundle ask ${px(bundle.ask)} < legs' bid ${px(sellValue(parts))}.` }, rng); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'The two totals differ by the legs\' spreads added. If the bundle quote sits inside that range, move on to the next card immediately.' },
    { type: 'check', scope: 'inside the range', questions: [
      { type: 'choice', q: 'Leg bids add to 47.5 and leg asks to 50.0. The bundle is quoted 48.0 / 49.5. What do you do?', options: ['move on: it sits inside the range', 'sell the bundle at its bid, 48.0', 'buy the bundle at its ask, 49.5'], answer: 0, traps: { 1: '48.0 is below the leg asks 50.0, so selling the bundle and buying legs loses', 2: '49.5 is above the leg bids 47.5, so buying it and selling the legs loses' }, explain: 'Bid below 50.0 and ask above 47.5: no edge either way.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Bundle ask < leg bids added → buy the bundle, sell one of each leg. Profit = leg bids added − bundle ask.' },

    sec('contrast'),
    { type: 'compare', columns: ['', 'Rich bundle', 'Cheap bundle'], rows: [
      ['Bundle price used', 'its bid (you sell it)', 'its ask (you buy it)'],
      ['Leg prices used', 'their asks (you buy them)', 'their bids (you sell them)'],
      ['Trade when', 'bundle bid > leg asks added', 'bundle ask < leg bids added'],
      ['Package', 'sell bundle, buy each leg', 'buy bundle, sell each leg'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. An ask exactly equal to the leg bids added earns 0. A bundle can be neither rich nor cheap (then look elsewhere on the board), but never both. A wide bundle spread does not matter to the cheap package.' },
    { type: 'check', scope: 'the rich and cheap sides', questions: [
      mc({ q: 'Which prices does the cheap-bundle package trade at?', right: 'The bundle ask and the leg bids', wrong: [['The bundle bid and the leg asks', 'that is the rich package'], ['The bundle ask and the leg asks', 'the legs are sold, so they fetch their bids'], ['The bundle bid and the leg bids', 'you buy the bundle, so you pay its ask']], explain: 'Buy = ask (the bundle), sell = bid (the legs).' }),
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: every later card type is checked in both directions like this. A spread A − B, a weighted 2A + B, a chain replica, a bundle hedged with another bundle: each has a "sell the card" edge and a "buy the card" edge, and at most one of them pays.' },
    { type: 'variation', base: `Base: ${boardText([A, B, AB])}. Buy A + B, sell A and B: +${px(edgeBuy(AB, legs))}.`, rows: [
      { same: true, change: `The bundle bid falls by ${px(2)}`, effect: `Nothing: you buy the bundle, so its bid never enters. Profit stays ${px(edgeBuy(card('A + B', [1, 1], AB.bid - 2, AB.ask), legs))}.` },
      { same: true, change: `A's ask rises by ${px(1)}`, effect: `Nothing: you sell A, at its bid. Profit stays ${px(edgeBuy(AB, [part(card('A', [1, 0], A.bid, A.ask + 1)), part(B)]))}.` },
      { change: `A's bid falls by ${px(1)}`, effect: `The legs fetch ${px(1)} less: profit ${px(edgeBuy(AB, [part(card('A', [1, 0], A.bid - 1, A.ask)), part(B)]))}.` },
      { change: `The bundle ask rises by ${px(edgeBuy(AB, legs))}`, effect: 'It now equals the legs\' bid: profit 0, no trade.' },
      { fusion: true, change: `The whole A + B quote rises by ${px(1)} and A's bid rises by ${px(0.5)}`, effect: `Both enter: −${px(1)} on the bundle ask you pay, +${px(0.5)} on the A you sell. Profit ${px(edgeBuy(card('A + B', [1, 1], AB.bid + 1, AB.ask + 1), [part(card('A', [1, 0], A.bid + 0.5, A.ask)), part(B)]))}.` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const { cs, parts, bundle, e } = cheapBoard(rng, 3, 1); return { type: 'number', q: `Board (bid / ask): ${boardText(rng.shuffle([...cs, bundle]))}. One package locks in a profit. How much?`, answer: e,
        hints: ['D is in no bundle. Price the three legs at their bids.', `Legs' bid ${px(sellValue(parts))}; compare with the ${bundle.name} ask.`], explain: `${px(sellValue(parts))} − ${px(bundle.ask)} = ${px(e)}; D stays untouched.` }; } },
      far: { make: (rng) => { const buy = [rng.int(18, 30), rng.int(25, 40), rng.int(12, 22)], e = rng.int(2, 9), set = buy[0] + buy[1] + buy[2] - e;
        return { type: 'number', q: `A bookshop sells a boxed set of three textbooks for €${set}, and sells nothing separately. A second-hand dealer pays €${buy[0]}, €${buy[1]} and €${buy[2]} for the three books, one at a time. Per set, what does buying the box and selling the books lock in, in euros?`, answer: e,
          hints: ['You sell the books, so what counts is what the dealer pays for them.', `${buy.join(' + ')} = ${buy[0] + buy[1] + buy[2]}; subtract the box price.`],
          explain: `${buy.join(' + ')} − ${set} = €${e}. The box is a cheap bundle: its ask is below what its parts fetch.` }; } },
      principle: mc({ q: 'Which idea carried over from the cheap bundle to the boxed set?', right: 'A package whose ask is below its parts\' bids: buy it, sell the parts',
        wrong: [['Compare the box price with what the books cost to buy new', 'you sell the books, so what matters is what buyers pay: their bids'], ['A set is always worth exactly the sum of its books', 'nothing forces a package to match its parts: that gap is the trade'], ['Buy the set only if each book is cheaper inside it', 'only the totals matter: the set is bought and the books sold as a package']],
        explain: 'Buy the package at its ask, sell every part at its bid, keep the gap: the cheap-bundle trade.' }),
    },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'bundle-cheap', count: 3 },
  ],
};
