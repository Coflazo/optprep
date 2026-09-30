// Orderbooks family 7: decoys. A bundle that looks mispriced at mid prices but has no executable
// edge after the spreads, next to a genuine arbitrage elsewhere on the board.
import { sec, px, r6, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeText, singles, mispriced, boardText, PENALTY } from './book-basics.js';

const mid = (c) => r6((c.bid + c.ask) / 2);
const half = (c) => r6((c.ask - c.bid) / 2);
const midsOf = (parts) => r6(parts.reduce((s, p) => s + p.qty * (p.bid + p.ask) / 2, 0));

// Challenge board (past format): A + B looks rich at mid, B + C is cheap by 0.5.
const A = card('A', [1, 0, 0], 30, 31), B = card('B', [0, 1, 0], 50, 51), C = card('C', [0, 0, 1], 20, 20.5);
const AB = card('A + B', [1, 1, 0], 80.5, 83.5), BC = card('B + C', [0, 1, 1], 69, 69.5);
const lAB = [part(A), part(B)], lBC = [part(B), part(C)];
const pkg = packageOf(BC, lBC, false);
const gapAB = r6(mid(AB) - midsOf(lAB)), halvesAB = r6(half(AB) + half(A) + half(B));
// Variation rows on the decoy alone.
const shiftUp = 2, ABup = card('A + B', AB.legs, AB.bid + shiftUp, AB.ask + shiftUp), ABnarrow = card('A + B', AB.legs, mid(AB) - 0.5, mid(AB) + 0.5), ABask = card('A + B', AB.legs, AB.bid, AB.ask + 1);

// Legs A, B, C (and D); a decoy on A + B that looks mispriced at mid; a genuine arbitrage on the
// last two products, rich or cheap by e.
function decoyBoard(rng, n = 3) {
  const names = ['A', 'B', 'C', 'D'].slice(0, n);
  const cs = singles(rng, names, 20, 120);
  const dl = [part(cs[0]), part(cs[1])], decoyRich = rng.chance(0.5), gap = rng.pick([0, 0.5]), wide = rng.pick([2, 2.5, 3]);
  const legsOf = (from) => names.map((_, j) => (j >= from ? 1 : 0));
  const decoy = decoyRich
    ? card('A + B', names.map((_, j) => (j < 2 ? 1 : 0)), r6(buyCost(dl) - gap), r6(buyCost(dl) - gap + wide))
    : card('A + B', names.map((_, j) => (j < 2 ? 1 : 0)), r6(sellValue(dl) + gap - wide), r6(sellValue(dl) + gap));
  const from = n === 3 ? 1 : 2, gl = cs.slice(from).map((c) => part(c)), rich = rng.chance(0.5), e = rng.pick([0.5, 1, 1.5]);
  const genuine = mispriced(names.slice(from).join(' + '), legsOf(from), gl, rich, e, rng.pick([0.5, 1]));
  return { names, cs, decoy, dl, decoyRich, genuine, gl, rich, e, cards: rng.shuffle([...cs, decoy, genuine]) };
}

function midQ(rng) {
  const [a] = singles(rng, ['A'], 20, 150, [0.5, 1, 1.5, 2]);
  return { type: 'number', q: `A ${quote(a)} (bid / ask). What is its mid price?`, answer: mid(a), hints: ['The mid is halfway between bid and ask.', `(${px(a.bid)} + ${px(a.ask)}) ÷ 2.`], explain: `(${px(a.bid)} + ${px(a.ask)}) ÷ 2 = ${px(mid(a))}. Nobody trades there: it is a reference point only.` };
}

// Executable edge = mid gap − half-spreads crossed.
function gapEdgeQ(rng) {
  const g = rng.pick([0.5, 1, 1.5, 2]), hb = rng.pick([0.5, 1, 1.5]), h1 = rng.pick([0.5, 1]), h2 = rng.pick([0.5, 1]);
  return { type: 'number', q: `A + B's mid is ${px(g)} above the legs' mids added. Half-spreads: A + B ${px(hb)}, A ${px(h1)}, B ${px(h2)}. What is the executable edge of selling A + B and buying the legs (negative for a loss)?`, answer: r6(g - hb - h1 - h2),
    hints: ['Selling the bundle loses its half-spread against its mid; buying each leg loses that leg\'s half-spread.', `${px(g)} − (${px(hb)} + ${px(h1)} + ${px(h2)}).`],
    explain: `${px(g)} − ${px(hb + h1 + h2)} = ${px(g - hb - h1 - h2)}${g - hb - h1 - h2 > 0 ? ': tradable' : ': not tradable'}.` };
}

// Hinge: the decoy against the genuine trade.
function hingeQ(rng) {
  const { names, cs, decoy, dl, decoyRich, genuine, gl, rich, e, cards } = decoyBoard(rng, 3);
  const good = packageOf(genuine, gl, rich), bad = packageOf(decoy, dl, decoyRich);
  const badEdge = decoyRich ? edgeSell(decoy, dl) : edgeBuy(decoy, dl);
  return mc({ q: `Board (bid / ask): ${boardText(cards)}. Which trades lock in a profit?`, right: cap(tradeText(good)),
    wrong: [
      [cap(tradeText(bad)), `chased the mid gap: A + B looks ${decoyRich ? 'rich' : 'cheap'} at mid, but its executable edge is ${px(badEdge)}`],
      [cap(tradeText(flip(good))), `traded ${genuine.name} the wrong way: that direction loses`],
      ['No trade: the only mispriced bundle fails after the spreads', `stopped after the decoy: ${genuine.name} has an edge of ${px(e)}`],
    ],
    explain: `A + B: edge ${px(badEdge)} (a decoy). ${genuine.name}: ${rich ? `bid ${px(genuine.bid)} − legs' ask ${px(buyCost(gl))}` : `legs' bid ${px(sellValue(gl))} − ask ${px(genuine.ask)}`} = ${px(e)}.` }, rng);
}

function candidateEdgeQ(rng) {
  const { decoy, dl, decoyRich, cs } = decoyBoard(rng, 3);
  const ed = decoyRich ? edgeSell(decoy, dl) : edgeBuy(decoy, dl);
  return mc({ q: `A ${quote(cs[0])}, B ${quote(cs[1])}, A + B ${quote(decoy)}. A + B's mid (${px(mid(decoy))}) ${decoyRich ? 'is above' : 'is below'} the legs' mids (${px(midsOf(dl))}). Is ${decoyRich ? 'selling A + B and buying the legs' : 'buying A + B and selling the legs'} a solution?`,
    right: `No: the executable edge is ${px(ed)}`,
    wrong: [[`Yes: it locks in the mid gap, ${px(Math.abs(mid(decoy) - midsOf(dl)))}`, 'profit comes from bids and asks, not mids']],
    explain: decoyRich ? `Bid ${px(decoy.bid)} − legs' ask ${px(buyCost(dl))} = ${px(ed)}.` : `Legs' bid ${px(sellValue(dl))} − ask ${px(decoy.ask)} = ${px(ed)}.` }, rng);
}

export default {
  id: 'ob/decoy',
  book: 'ob',
  kind: 'family',
  family: 'decoy',
  title: 'Decoys: mid-price illusions',
  summary: 'A mid-price gap is not a trade: executable edge = mid gap − every half-spread crossed. Check each card at bid and ask.',
  prerequisites: ['ob/bundle-rich', 'ob/bundle-cheap'],
  objectives: [
    'Compute a mid price and explain why it is never a trading price',
    'Derive executable edge = mid gap − the half-spreads crossed, and use it to reject decoys',
    'Scan every bundle on a multi-bundle board at executable prices and trade the one with a positive edge',
    'Treat an edge of exactly 0 as a decoy',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A, B, AB, C, BC])}. A + B's mid is ${px(mid(AB))}, the legs' mids add to ${px(midsOf(lAB))}. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeText(pkg))}: +${px(outcome(pkg, 3).cash)}.`, explain: `A + B is the bait: selling it at ${px(AB.bid)} and buying the legs at ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(lAB))} loses ${px(-edgeSell(AB, lAB))}. The real trade is B + C: its ask ${px(BC.ask)} is below the legs' bids ${px(B.bid)} + ${px(C.bid)} = ${px(sellValue(lBC))}.` },
    { type: 'text', text: 'The cue: **two or more bundles** on one board, and one of them looks obviously off: a wide quote whose middle sits far from its legs. That card is often the decoy. The real arbitrage is usually a quieter card with a tight quote.' },
    { type: 'list', items: [`"${boardText([A, B, AB, C, BC])}"`, 'Four products, A + B and C + D: one looks rich at mid, the other pays', 'A decoy with an edge of exactly 0: it looks like a trade and earns nothing'] },
    { type: 'check', scope: 'spotting a decoy board', questions: [{ make: candidateEdgeQ }] },

    sec('why'),
    { type: 'text', text: `Real boards contain near-arbitrages that vanish after the spread. Chasing one costs a failed submit (${PENALTY} seconds) and, worse, the time you spent building it. Decoys test one discipline: price every candidate at the prices you would actually trade, and ignore how the mids look. In this trainer a decoy is built so that its executable edge is exactly 0 or slightly negative, while a genuine arbitrage sits on another card of the same board.` },

    sec('anchor'),
    { type: 'text', text: 'You know the bundle check: bundle bid against the legs\' asks, legs\' bids against the bundle ask. One change: the board now tempts you with a shortcut, the **mid price**, halfway between bid and ask. The mid is a fair-value guess, not a price anyone will trade with you. The anchor stays exactly the same; the new skill is refusing the shortcut.' },
    { type: 'check', scope: 'the mid price', questions: [{ make: midQ }] },

    sec('picture'),
    { type: 'text', text: 'Put both bundles side by side in the bundle table. The decoy\'s quote is wide and its middle is high, but neither diagonal crosses. The second table is the quiet card next to it, and that one does cross.' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(AB, lAB), caption: `The decoy. A + B's mid ${px(mid(AB))} is ${px(gapAB)} above the legs' mids, yet its bid ${px(AB.bid)} is below the legs' ask ${px(buyCost(lAB))} and its ask ${px(AB.ask)} is above the legs' bid ${px(sellValue(lAB))}.` },
    { type: 'check', scope: 'reading the decoy table', questions: [
      { type: 'number', q: `From the table: A + B bid ${px(AB.bid)}, legs' ask ${px(buyCost(lAB))}. What does selling A + B and buying the legs lock in (negative for a loss)?`, answer: edgeSell(AB, lAB), hints: ['Bundle bid minus the legs\' ask.', `${px(AB.bid)} − ${px(buyCost(lAB))}.`], explain: `${px(AB.bid)} − ${px(buyCost(lAB))} = ${px(edgeSell(AB, lAB))}: a loss.` },
    ] },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(BC, lBC), caption: `The genuine trade. B + C's ask ${px(BC.ask)} is below the legs' bid ${px(sellValue(lBC))}: +${px(edgeBuy(BC, lBC))}. Its quote is tight, so almost nothing is lost to its spread.` },
    { type: 'check', scope: 'the genuine trade', questions: [
      mc({ q: 'Which package solves the board?', right: 'Buy B + C, sell B, sell C', wrong: [['Sell A + B, buy A, buy B', `the decoy: edge ${px(edgeSell(AB, lAB))}`], ['Sell B + C, buy B, buy C', `wrong direction: edge ${px(edgeSell(BC, lBC))}`], ['Both bundle trades together', 'the decoy part loses money and one package is all a board needs']], explain: `Only B + C has a positive executable edge: ${px(edgeBuy(BC, lBC))}.` }),
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Card', 'Mid gap', 'Half-spreads crossed', 'Executable edge'], rows: [
      ['A + B (sell it)', px(gapAB), px(halvesAB), px(edgeSell(AB, lAB))],
      ['B + C (buy it)', px(r6(midsOf(lBC) - mid(BC))), px(r6(half(BC) + half(B) + half(C))), px(edgeBuy(BC, lBC))],
    ] }, caption: `The mid gap minus every half-spread you cross is the executable edge. A + B has the bigger gap (${px(gapAB)}) but crosses ${px(halvesAB)} of half-spreads; B + C has a small gap and a small crossing cost.` },
    { type: 'check', scope: 'mid gap minus half-spreads', questions: [{ make: gapEdgeQ }] },

    sec('derivation'),
    { type: 'text', text: 'Why exactly does a mid gap shrink by the half-spreads? Rewrite every tradable price as its mid plus or minus a half-spread, and the formula falls out in four moves.' },
    { type: 'steps', steps: [
      { say: 'Every quote is its mid plus or minus a half-spread: bid = mid − h, ask = mid + h, with h = (ask − bid) ÷ 2.', why: 'The mid is just the centre of the quote; the half-spread is how far each tradable price sits from it.',
        checks: [{ make: (rng) => { const [a] = singles(rng, ['A'], 20, 150, [0.5, 1, 1.5, 2]); return { type: 'number', q: `A ${quote(a)}. What is its half-spread h?`, answer: half(a), hints: ['Half of ask − bid.', `(${px(a.ask)} − ${px(a.bid)}) ÷ 2.`], explain: `(${px(a.ask)} − ${px(a.bid)}) ÷ 2 = ${px(half(a))}.` }; } }] },
      { say: 'Selling the bundle receives its bid: bundle mid − h(bundle). Buying each leg pays its ask: leg mid + h(leg).', why: 'Each trade gives up half a spread against the mid, in the direction that hurts you.',
        checks: [mc({ q: 'Against its mid, what does selling a card at its bid cost you?', right: 'Half its spread', wrong: [['Its whole spread', 'the whole spread is a round trip: buy and sell'], ['Nothing', 'the bid sits below the mid'], ['Half its spread, but it is a gain', 'selling below the mid is a loss against the mid']], explain: 'bid = mid − h.' })] },
      { say: 'Edge = bundle bid − leg asks = (bundle mid − legs\' mids) − (h(bundle) + every h(leg)) = mid gap − half-spreads crossed.', why: 'Collect the mids into the gap and the half-spreads into the crossing cost.',
        checks: [{ make: gapEdgeQ }] },
      { say: 'So a card is tradable only when its mid gap is bigger than all the half-spreads it crosses. Price every candidate at bid and ask; trade only a positive edge.', why: 'A wide card, or one with many legs, needs a large gap before anything is left.',
        checks: [{ hinge: true, make: hingeQ }] },
    ] },
    { type: 'explain', prompt: 'A card looks rich by 1.0 at mid. In your own words, why can that still be a losing trade?', model: 'Selling it gives me its bid, which is half its spread below the mid, and buying each leg costs its ask, half that leg\'s spread above its mid. Those half-spreads are subtracted from the 1.0 gap. If they add to more than 1.0, the executable edge is negative, whatever the mids say.', points: ['Trades happen at bid and ask, each half a spread from the mid', 'Executable edge = mid gap − half-spreads crossed', 'A wide card or many legs can swallow the whole gap'] },

    sec('worked'),
    { type: 'text', text: 'First an expert solves the challenge board at exam pace, then two live boards. On each, list every bundle, compute both executable edges for each one, and trade the positive edge. Notice that the think-aloud never computes a single mid.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A, B, AB, C, BC])}.`, lines: [
      { t: 0, say: 'Five cards, two bundles: A + B and B + C. Check both, both directions, at bid and ask only.' },
      { t: 4, say: `A + B: bid ${px(AB.bid)} against leg asks ${px(buyCost(lAB))}: ${px(edgeSell(AB, lAB))}. Ask ${px(AB.ask)} against leg bids ${px(sellValue(lAB))}: no. Looks rich on mids, is not.` },
      { t: 10, say: `B + C: ask ${px(BC.ask)} against leg bids ${px(B.bid)} + ${px(C.bid)} = ${px(sellValue(lBC))}. Positive, ${px(edgeBuy(BC, lBC))}.` },
      { t: 14, say: 'Buy B + C, sell B, sell C. A is untouched.' },
      { t: 18, say: `Net row: A 0, B 0, C 0, cash +${px(outcome(pkg, 3).cash)}. Submit.` },
    ] },
    { type: 'check', scope: 'the same scan on a fresh board', questions: [{ make: hingeQ }] },
    { type: 'worked', section: 'ob', family: 'decoy', difficulty: 3, seed: 'a', intro: 'Three products, a decoy and a genuine bundle. Check both before you tap.' },
    { type: 'worked', section: 'ob', family: 'decoy', difficulty: 5, seed: 'b', fade: 3, intro: 'Four products. The decoy is taken apart for you; finding and trading the genuine card is yours.' },

    sec('predict'),
    { type: 'predict', question: `A card looks rich by ${px(gapAB)} at mid. Its own half-spread is ${px(half(AB))} and its two legs have half-spreads of ${px(half(A))} each. Predict the executable edge before computing it.`, answer: `${px(gapAB)} − (${px(half(AB))} + ${px(half(A))} + ${px(half(B))}) = ${px(gapAB - halvesAB)}: a loss.`, explain: 'This is the challenge board\'s A + B: the gap is smaller than the half-spreads it must cross.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'decoy', extra: [
      { belief: 'A bundle whose mid is far from its legs\' mids is an arbitrage.', fix: 'Subtract every half-spread crossed; only a positive remainder is tradable.' },
      { belief: 'The profit of a package is its mid gap.', fix: 'Profit is bids received minus asks paid.' },
      { belief: 'Once one bundle fails, the board has no trade.', fix: 'Check every bundle: the genuine one is often the quiet card.' },
      { belief: 'An edge of exactly 0 is a safe submit.', fix: 'Zero is not a profit; the submit fails.' },
    ] },
    { type: 'erroneous', problem: `A candidate works on ${boardText([A, B, AB, C, BC])}. One step is wrong.`, steps: [
      `A + B's mid is ${px(mid(AB))}; the legs' mids add to ${px(midsOf(lAB))}.`,
      'So A + B looks rich: sell it and buy A and B.',
      `Those trades lock in the mid gap, ${px(gapAB)}.`,
      'Flat in A and B: submit.',
    ], errorStep: 2, explain: `The trades lock in bid minus asks: ${px(AB.bid)} − ${px(A.ask)} − ${px(B.ask)} = ${px(edgeSell(AB, lAB))}, a loss. The mid gap is never what you get. The submit fails and costs ${PENALTY} seconds; the real trade was B + C.` },
    { type: 'check', scope: 'mids are not prices', questions: [{ make: candidateEdgeQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Skip mids entirely. For each bundle compute the two executable edges (bid − leg asks, leg bids − ask); they are as fast as mids and they are the answer.' },
    { type: 'callout', tone: 'speed', text: 'Scan order on a multi-bundle board: tight quotes first. A wide quote needs a big gap to pay, so it is the likeliest decoy.' },
    { type: 'callout', tone: 'speed', text: 'An edge of exactly 0 is a decoy: drop the card at once and keep scanning. Every board in this trainer has a package with a positive edge somewhere, so a zero means the answer is on another card, not that the board is empty.' },
    { type: 'check', scope: 'executable edges only', questions: [{ make: hingeQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Never trade a mid gap. Executable edge = bid received − asks paid (= mid gap − half-spreads crossed); trade only if it is above 0.' },

    sec('contrast'),
    { type: 'compare', columns: ['Comparison', 'What it measures', 'Can you trade it?'], rows: [
      ['Bundle mid vs legs\' mids', 'where fair value probably is', 'no'],
      ['Bundle bid vs legs\' asks', 'profit of selling the bundle', 'yes, if above 0'],
      ['Legs\' bids vs bundle ask', 'profit of buying the bundle', 'yes, if above 0'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. A decoy with an edge of exactly 0 looks like a trade and scores nothing. A card that looks cheap at mid can be a decoy too. Venues that only touch are the venue version of a decoy.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: chains and hidden boards cross three or four spreads, so their mid gaps must be larger still. Any time you see a gap, subtract what it costs to trade it before you believe it.' },
    { type: 'check', scope: 'mid vs executable', questions: [
      mc({ q: 'A card crosses its own half-spread of 1.0 and two legs with half-spreads of 0.5 each. What mid gap does it need before it pays?', right: 'More than 2.0', wrong: [['More than 0', 'a positive mid gap is not enough: the half-spreads come off'], ['More than 1.0', 'forgot the legs\' half-spreads'], ['More than 4.0', 'used whole spreads instead of half-spreads']], explain: '1.0 + 0.5 + 0.5 = 2.0 must be beaten.' }),
    ] },
    { type: 'variation', base: `Base: ${boardText([A, B, AB])}. A + B looks rich by ${px(gapAB)} at mid; selling it earns ${px(edgeSell(AB, lAB))}.`, rows: [
      { change: `The whole A + B quote moves up ${px(shiftUp)} (now ${quote(ABup)})`, effect: `The bid clears the legs' ask: edge ${px(edgeSell(ABup, lAB))}. No longer a decoy.` },
      { change: `A + B narrows to ${quote(ABnarrow)} (same mid)`, effect: `Less spread to cross, but still not enough: edge ${px(edgeSell(ABnarrow, lAB))}.` },
      { change: `A + B's ask rises by ${px(1)}`, effect: `Nothing for the sell check: it uses the bid. Edge stays ${px(edgeSell(ABask, lAB))}, although the mid gap grew.` },
    ] },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'decoy', count: 3 },
  ],
};
