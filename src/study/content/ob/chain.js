// Orderbooks family 6: chains. A product has no card of its own, so a bundle that contains it is
// hedged with a replica built from overlapping cards: B + C = C + (A + B) − A.
import { sec, px, r6, hp, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeText, posText, boardText, PENALTY } from './book-basics.js';

const P4 = ['A', 'B', 'C', 'D'];
const sgnText = (q) => (q > 0 ? '+' : '−');
export const replicaText = (parts) => parts.map((p, i) => `${i ? ` ${sgnText(p.qty)} ` : p.qty < 0 ? '−' : ''}${p.name.includes('+') ? `(${p.name})` : p.name}`).join('');
const netOf = (parts, n) => Array.from({ length: n }, (_, k) => parts.reduce((s, p) => s + p.qty * p.card.legs[k], 0));
const signed = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');

// Challenge board (past format): B + C rich by 1.0.
const A = card('A', [1, 0, 0], 10, 10.5), AB = card('A + B', [1, 1, 0], 30, 30.5), BC = card('B + C', [0, 1, 1], 56, 56.5), C = card('C', [0, 0, 1], 34, 34.5);
const rep = [part(C, 1), part(AB, 1), part(A, -1)];
const pkg = packageOf(BC, rep, true);
// Erroneous example: fair chain that looks cheap if A (bought back) is priced at its bid.
const Ae = card('A', [1, 0, 0], 15, 16), ABe = card('A + B', [1, 1, 0], 40, 40.5), BCe = card('B + C', [0, 1, 1], 50, 51), Ce = card('C', [0, 0, 1], 27, 27.5);
const repE = [part(Ce, 1), part(ABe, 1), part(Ae, -1)];
const wrongValue = r6(Ce.bid + ABe.bid - Ae.bid);
// Four-product chain (past format): C + D = D + (B + C) − (A + B) + A, rich by 1.0.
const A4 = card('A', [1, 0, 0, 0], 10, 10.5), AB4 = card('A + B', [1, 1, 0, 0], 25, 25.5), BC4 = card('B + C', [0, 1, 1, 0], 35, 35.5), CD4 = card('C + D', [0, 0, 1, 1], 51.5, 52), D4 = card('D', [0, 0, 0, 1], 29, 29.5);
const rep4 = [part(D4, 1), part(BC4, 1), part(AB4, -1), part(A4, 1)];
const widen = 0.5;
// Variation rows on the challenge board.
const vDropA = 0.5, vAskA = 1, vBCbid = r6(buyCost(rep));
const Bq = card('B', [0, 1, 0], 19.5, 20.5), repB = [part(Bq, 1), part(C, 1)];
const withA = (bid, ask) => [part(C, 1), part(AB, 1), part(card('A', A.legs, bid, ask), -1)];
// Challenge attempts: every replica card bought; every replica card priced at its ask.
const allBuy = [[BC, 'sell'], [C, 'buy'], [AB, 'buy'], [A, 'buy']];
const allAsk = r6(C.ask + AB.ask - A.ask);

// A chain board on n products: A, the pair bundles, the last product; the last pair is mispriced.
export function chainBoard(rng, n = 3, rich = rng.chance(0.5)) {
  const P = P4.slice(0, n), v = [];
  while (v.length < n) { const x = hp(rng, 15, 90); if (!v.includes(x)) v.push(x); }
  const mk = (legs) => { const f = legs.reduce((s, q, k) => s + q * v[k], 0), h = rng.pick([0.5, 1]); return card(P.filter((_, k) => legs[k]).join(' + '), legs, f - h, f + h); };
  const unit = (k) => P.map((_, j) => (j === k ? 1 : 0));
  const a = mk(unit(0)), pairs = Array.from({ length: n - 1 }, (_, i) => mk(P.map((_, j) => (j === i || j === i + 1 ? 1 : 0)))), z = mk(unit(n - 1));
  const target = pairs[n - 2];
  const parts = [part(z, 1)];
  let sg = 1;
  for (let i = n - 3; i >= 0; i--) { parts.push(part(pairs[i], sg)); sg = -sg; }
  parts.push(part(a, sg));
  const e = rng.pick([0.5, 1, 1.5]), h = target.ask - target.bid;
  if (rich) { target.bid = r6(buyCost(parts) + e); target.ask = r6(target.bid + h); } else { target.ask = r6(sellValue(parts) - e); target.bid = r6(target.ask - h); }
  return { P, cards: [a, ...pairs, z], target, parts, rich, e };
}

function replicaPriceQ(rng) {
  const { cards, target, parts, rich } = chainBoard(rng, 3);
  const right = rich ? buyCost(parts) : sellValue(parts);
  const allAsk = r6(parts.reduce((s, p) => s + p.qty * p.ask, 0)), allBid = r6(parts.reduce((s, p) => s + p.qty * p.bid, 0));
  return mc({ q: `Board (bid / ask): ${boardText(cards)}. What does ${rich ? 'buying' : 'selling'} the replica ${replicaText(parts)} of ${target.name} ${rich ? 'cost' : 'raise'}?`, right: px(right),
    wrong: rich
      ? [[px(allAsk), 'priced the − card at its ask: you sell it when buying the replica, so it earns its bid'], [px(r6(parts.reduce((s, p) => s + Math.abs(p.qty) * p.ask, 0))), 'ignored the minus sign: the − card is subtracted'], [px(allBid), 'priced the + cards at their bids: you buy them, at their asks']]
      : [[px(allBid), 'priced the − card at its bid: you buy it back when selling the replica, so it costs its ask'], [px(r6(parts.reduce((s, p) => s + Math.abs(p.qty) * p.bid, 0))), 'ignored the minus sign: the − card is subtracted'], [px(allAsk), 'priced the + cards at their asks: you sell them, at their bids']],
    hints: [rich ? 'Buying the replica: + cards are bought (asks), − cards are sold (bids).' : 'Selling the replica: + cards are sold (bids), − cards are bought (asks).', parts.map((p) => `${sgnText(p.qty)}${px(rich === p.qty > 0 ? p.ask : p.bid)}`).join(' ')],
    explain: `${parts.map((p, i) => `${i ? ` ${sgnText(p.qty)} ` : ''}${px(rich === p.qty > 0 ? p.ask : p.bid)}`).join('')} = ${px(right)}.` }, rng);
}

// Hinge: the chain package with the classic slips as wrong options.
function packageQ(rng) {
  const { cards, target, parts, rich, e } = chainBoard(rng, 3);
  const p = packageOf(target, parts, rich);
  const aTrade = p[p.length - 1];
  const signSlip = [...p.slice(0, -1), [aTrade[0], aTrade[1] === 'buy' ? 'sell' : 'buy']];
  const noA = p.slice(0, -1);
  const legsOnly = [p[0], p[1]];
  return mc({ q: `Board (bid / ask): ${boardText(cards)}. Which trades lock in a profit?`, right: cap(tradeText(p)),
    wrong: [
      [cap(tradeText(signSlip)), `traded A the wrong way: A enters the replica with a minus sign, so it goes opposite to A + B (net ${posText(['A', 'B', 'C'], outcome(signSlip, 3).net)})`],
      [cap(tradeText(noA)), `left A open: the A + B trade also moves A (net ${posText(['A', 'B', 'C'], outcome(noA, 3).net)})`],
      [cap(tradeText(legsOnly)), `hedged only C: B has no card, so it must come from A + B (net ${posText(['A', 'B', 'C'], outcome(legsOnly, 3).net)})`],
      [cap(tradeText(flip(p))), 'traded the target the wrong way: that direction loses'],
    ],
    explain: `Replica ${replicaText(parts)}: ${rich ? `costs ${px(buyCost(parts))}, below the bid ${px(target.bid)}` : `raises ${px(sellValue(parts))}, above the ask ${px(target.ask)}`}. Profit ${px(e)}.` }, rng);
}

export default {
  id: 'ob/chain',
  book: 'ob',
  kind: 'family',
  family: 'chain',
  title: 'Chains of bundles',
  summary: 'A product with no card of its own is built from overlapping bundles: B = (A + B) − A.',
  prerequisites: ['ob/bundle-rich', 'ob/bundle-cheap', 'ob/spread'],
  objectives: [
    'Spot the product with no card and build it from overlapping bundles',
    'Write the replica of a pair bundle as a signed sum of cards, for three and four products',
    'Price the replica on the traded side: + cards and − cards on opposite sides',
    'Execute a four- or five-card package and verify every product nets to 0',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A, AB, BC, C])}. There is no card for B alone. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeText(pkg))}: +${px(outcome(pkg, 3).cash)}.`, explain: `B = (A + B) − A, so B + C = C + (A + B) − A. Buying that replica costs ${px(C.ask)} + ${px(AB.ask)} − ${px(A.bid)} = ${px(buyCost(rep))}, below the B + C bid ${px(BC.bid)}. If you stopped at "no B card, no hedge", that is the belief this lesson removes.`,
      attempts: [
        { id: 'noHedge', label: 'No B card, so no trade', approach: 'Saw that B has no card of its own and skipped the board.', breaksAt: `B can be built: buying A + B and selling A gives exactly one B, and the chain then pays ${px(edgeSell(BC, rep))}.` },
        { id: 'allBuy', label: 'Bought every replica card', approach: 'Sold B + C, then bought C, A + B and A.', breaksAt: `A enters the replica with a minus sign, so it must be sold: buying it leaves ${posText(['A', 'B', 'C'], outcome(allBuy, 3).net)}.` },
        { id: 'askOnly', label: 'Priced every card at its ask', approach: `Priced the replica as ${px(C.ask)} + ${px(AB.ask)} − ${px(A.ask)} = ${px(allAsk)}.`, breaksAt: `Buying the replica sells A, and a sale earns the bid: ${px(C.ask)} + ${px(AB.ask)} − ${px(A.bid)} = ${px(buyCost(rep))}.` },
      ] },
    { type: 'text', text: 'The cue: pair bundles that **overlap** (A + B, B + C, C + D) and a product in the middle with **no card of its own**. Only the ends of the chain (A, and C or D) are quoted alone. The obvious hedge for B + C needs a B card, and there is none.' },
    { type: 'list', items: [`"${boardText([A, AB, BC, C])}"`, `"${boardText([A4, AB4, BC4, CD4, D4])}": B and C both missing`] },
    { type: 'check', scope: 'spotting a chain', questions: [
      mc({ q: `Board: ${boardText([A4, AB4, BC4, CD4, D4])}. Which products have no card of their own?`, right: 'B and C', wrong: [['None: every letter appears on some card', 'appearing inside a bundle is not the same as having your own card'], ['Only B', 'C also appears only inside bundles'], ['A and D', 'those are the two quoted alone']], explain: 'A and D are quoted alone; B and C appear only inside bundles.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Chains are the harder boards: the obvious hedge does not exist, so candidates who only know "bundle against legs" skip them. Building the missing product from other cards turns a skip into a solve. The replica has three or four cards, which also means more taps and more spreads to beat, so accuracy matters more than on any earlier type.' },

    sec('anchor'),
    { type: 'text', text: 'From the spread lesson you know a card with a minus sign: A − B is "+1 A, −1 B". Now run it backwards. (A + B) − A is "+1 A, +1 B, −1 A" = **+1 B**. So buying A + B and selling A gives you exactly one B. That is the one change from a plain bundle hedge: a missing leg is replaced by a bundle minus a leg you do have.' },
    { type: 'check', scope: 'B = (A + B) − A', questions: [
      mc({ q: 'Which trades leave you with exactly +1 B and nothing else?', right: 'Buy A + B, sell A', wrong: [['Buy A + B, buy A', 'that is +2 A, +1 B'], ['Sell A + B, buy A', 'that is −1 B'], ['Buy A + B', 'that also leaves +1 A']], explain: '+1 A + 1 B from the bundle, −1 A from the sale: +1 B.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Write the replica as signed cards and add their contents product by product. Everything except the target cancels.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Card', 'Sign', 'A', 'B', 'C'], rows: [...rep.map((p) => [p.name, sgnText(p.qty), ...[0, 1, 2].map((k) => signed(p.qty * p.card.legs[k]))]), ['Replica', '', ...netOf(rep, 3).map(signed)]] }, caption: `C + (A + B) − A, column by column: A cancels, and what is left is ${netOf(rep, 3).map((x, k) => (x ? ['A', 'B', 'C'][k] : null)).filter(Boolean).join(' + ')}, exactly the B + C card.` },
    { type: 'check', scope: 'adding signed cards', questions: [
      mc({ q: 'On a board with A, A + B and C, which signed sum of cards equals B + C?', right: 'C + (A + B) − A', wrong: [['C + (A + B) + A', 'that is 2A + B + C: A must be subtracted'], ['C − (A + B) + A', 'that is C − B'], ['(A + B) − A', 'that is only B: C is missing']], explain: 'Add the contents: C, plus A and B, minus A = B + C.' }),
    ] },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(BC, rep), caption: `B + C against its replica. The "legs" are now cards with signs: buying the replica pays C's and A + B's asks and receives A's bid, ${px(C.ask)} + ${px(AB.ask)} − ${px(A.bid)} = ${px(buyCost(rep))}. The bid ${px(BC.bid)} beats it: +${px(edgeSell(BC, rep))}.` },
    { type: 'check', scope: 'pricing the replica', questions: [{ make: replicaPriceQ }] },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B', 'C'], pkg), caption: `The package in a ledger. Selling B + C opens B and C; buying C closes C; buying A + B closes B but opens A; selling A closes A. Cash +${px(outcome(pkg, 3).cash)}.` },
    { type: 'check', scope: 'the ledger of a chain', questions: [
      { make: (rng) => { const { target, parts, rich } = chainBoard(rng, 3); const p = packageOf(target, parts, rich); const o = outcome(p.slice(0, 3), 3); return mc({ q: `You ${tradeText(p.slice(0, 3))}. What is still open?`, right: posText(['A', 'B', 'C'], o.net),
        wrong: [['Nothing: flat', 'the A + B trade moved A too'], [posText(['A', 'B', 'C'], o.net.map((x) => -x)), 'flipped the sign of the leftover'], [posText(['A', 'B', 'C'], [0, o.net[0], 0]), 'put the leftover on B, the missing product']],
        explain: `A + B brought in A as well as B. ${o.net[0] > 0 ? 'Sell' : 'Buy'} one A to finish.` }, rng); } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'Five moves. The first three build the replica, the fourth prices and trades it, the fifth stretches the idea to a four-product chain. None of them needs a new price rule: buys pay asks, sells receive bids, and a minus sign flips the side.' },
    { type: 'steps', steps: [
      { say: 'Find the product with no card. It is the reason the plain bundle hedge fails.', why: 'Every other product can be traded directly; only the missing one needs building.',
        checks: [mc({ q: `Board: ${boardText([A, AB, BC, C])}. Which product has no card?`, right: 'B', wrong: [['A', 'A is quoted alone'], ['C', 'C is quoted alone'], ['None', 'B appears only inside bundles']], explain: 'B appears only in A + B and B + C.' })] },
      { answers: 'noHedge', say: 'Build it from a bundle that contains it minus the other leg of that bundle: B = (A + B) − A.', why: 'The bundle brings in the missing product plus one you can trade away.',
        checks: [mc({ q: 'Which combination of cards gives exactly +1 D?', right: '(C + D) − C', wrong: [['(C + D) + C', 'that is 2C + D'], ['(B + C) − C', 'that is B, not D'], ['C − (C + D)', 'that is −D']], explain: 'C + D minus C leaves D.' })] },
      { answers: 'allBuy', say: 'Replace the missing leg in the target: B + C = [(A + B) − A] + C. Each card keeps its sign, and a − card is traded the opposite way to the + cards.', why: 'The replica must hold exactly the target\'s contents.',
        checks: [{ make: (rng) => { const rich = rng.chance(0.5); return mc({ q: `You want to ${rich ? 'sell' : 'buy'} B + C and hedge with the replica C + (A + B) − A. Which replica trades?`, right: rich ? 'Buy C, buy A + B, sell A' : 'Sell C, sell A + B, buy A', wrong: [[rich ? 'Buy C, buy A + B, buy A' : 'Sell C, sell A + B, sell A', 'ignored A\'s minus sign'], [rich ? 'Sell C, sell A + B, buy A' : 'Buy C, buy A + B, sell A', 'traded the replica the same way as the target: it must go the opposite way'], [rich ? 'Buy C, buy B' : 'Sell C, sell B', 'there is no B card to trade']], explain: `${rich ? 'Selling' : 'Buying'} the target means ${rich ? 'buying' : 'selling'} the replica: + cards ${rich ? 'bought' : 'sold'}, the − card ${rich ? 'sold' : 'bought'}.` }, rng); } }] },
      { answers: 'askOnly', say: 'Price the replica on the traded side and compare with the target, both directions.', why: 'Buying it: + cards at asks, − cards at bids. Selling it: the reverse.',
        checks: [{ hinge: true, make: packageQ }] },
      { say: 'For a four-product chain, walk back along the chain alternating signs: C + D = D + (B + C) − (A + B) + A.', why: 'Each step cancels the product the previous card introduced.',
        checks: [mc({ q: 'Add the contents of D + (B + C) − (A + B) + A. What is left?', right: 'C + D', wrong: [['B + C + D', 'B enters with B + C and leaves with −(A + B)'], ['A + C + D', 'the −A inside −(A + B) cancels the +A'], ['D', 'C from B + C is not cancelled']], explain: `Totals: ${netOf(rep4, 4).map(signed).map((x, k) => `${P4[k]} ${x}`).join(', ')}: C + D.` })] },
    ] },
    { type: 'explain', prompt: 'Why can you hedge B + C on a board where B has no card of its own?', model: 'A hedge only needs a set of trades whose contents equal B + C. Buying A + B and selling A gives exactly one B, and adding C gives B + C. Any exposure I can build from the cards on the board, I can hedge, so the missing card does not matter.', points: ['A hedge is any set of trades with the same contents', '(A + B) − A = B', 'Any exposure you can build, you can hedge'] },

    sec('worked'),
    { type: 'text', text: 'Two live boards. Name the missing product first, write the replica as signed cards, price it on the traded side, then tap every card once. The think-aloud above shows the pace: about twenty seconds, most of it spent on the replica line. On the four-product board, the replica has four cards and the package five taps.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A, AB, BC, C])}.`, lines: [
      { t: 0, say: 'Cards A, A + B, B + C, C. No B on its own: a chain.' },
      { t: 3, say: 'The target is the bundle with the missing product that I cannot hedge directly: B + C.' },
      { t: 6, say: 'Replica: C plus (A + B) minus A. Check: A cancels, B and C stay.' },
      { t: 9, say: `Try selling B + C at ${px(BC.bid)}. Replica at the asks: ${px(C.ask)} + ${px(AB.ask)} − ${px(A.ask)} = ${px(allAsk)}.`, slip: true },
      { t: 12, say: `No: buying the replica sells A, so A earns its bid, ${px(A.bid)}. Replica ${px(C.ask)} + ${px(AB.ask)} − ${px(A.bid)} = ${px(buyCost(rep))}.` },
      { t: 15, say: `${px(BC.bid)} beats ${px(buyCost(rep))} by ${px(edgeSell(BC, rep))}. Sell B + C, buy C, buy A + B, sell A.` },
      { t: 20, say: 'Net row: A 0, B 0, C 0. Submit.' },
    ] },
    { type: 'check', scope: 'the same method on a fresh board', questions: [{ make: replicaPriceQ }] },
    { type: 'worked', section: 'ob', family: 'chain', difficulty: 3, seed: 'a', explainAt: [0], intro: 'Three products, B missing. Try it before opening the solution.' },
    { type: 'worked', section: 'ob', family: 'chain', difficulty: 5, seed: 'b', fade: 4, intro: 'Four products, B and C missing. The replica is given; its price, the decision and the taps are yours.' },

    sec('predict'),
    { type: 'predict', question: `The challenge package trades four cards and earns ${px(edgeSell(BC, rep))}. If every card's spread widened by ${px(widen)} on each side (mids unchanged), what would the profit become?`, answer: `${px(edgeSell(BC, rep) - 4 * widen)}: each of the four trades gets ${px(widen)} worse, so the edge shrinks by 4 × ${px(widen)} = ${px(4 * widen)} and the trade is gone.`, explain: 'Every card in a package costs you half its spread against the mid. Longer replicas need bigger mispricings.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'chain', extra: [
      { belief: 'No card for B means no hedge for B + C.', fix: 'Build B: (A + B) − A.' },
      { belief: 'Every card in the replica is bought (or every card sold).', fix: 'Cards with a minus sign go the opposite way to cards with a plus sign.' },
      { belief: 'Price the whole replica at asks when buying it.', fix: 'The − cards are sold when you buy the replica, so they earn their bids.' },
      { belief: 'A chain package can skip the A trade.', fix: 'A + B brings in an A that must be traded away, or A is left open.' },
    ] },
    { type: 'erroneous', problem: `A candidate checks ${boardText([Ae, ABe, BCe, Ce])}. One step is wrong.`, steps: [
      'B has no card, so B + C = C + (A + B) − A.',
      `Selling that replica raises C's bid + A + B's bid − A's bid: ${px(Ce.bid)} + ${px(ABe.bid)} − ${px(Ae.bid)} = ${px(wrongValue)}.`,
      `The B + C ask ${px(BCe.ask)} is below ${px(wrongValue)}: buy B + C, sell C, sell A + B, buy A.`,
      'Every product nets to 0: submit.',
    ], errorStep: 1, explain: `Selling the replica means **buying** A back, at its ask ${px(Ae.ask)}. The replica raises ${px(Ce.bid)} + ${px(ABe.bid)} − ${px(Ae.ask)} = ${px(sellValue(repE))}, exactly the ask ${px(BCe.ask)}: edge ${px(edgeBuy(BCe, repE))}, and zero does not count. The submit fails and costs ${PENALTY} seconds.` },
    { type: 'check', scope: 'the side of each replica card', questions: [{ make: replicaPriceQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Write the replica once as signed cards, "+C +(A + B) −A", and read each price from its sign and your direction. That line is also your tap list, so you never have to rebuild it.' },
    { type: 'check', scope: 'signed cards as a tap list', questions: [{ make: packageQ }] },
    { type: 'callout', tone: 'speed', text: 'Chains cost four or five taps. Budget for that, and read the net row product by product before submitting: the A that A + B drags in is the classic leftover.' },
    { type: 'check', scope: 'the leftover', questions: [
      { type: 'choice', q: 'After a chain trade, which product is the classic leftover?', options: ['the A that A + B drags in', 'the B inside B + C', 'none: chains are always flat'], answer: 0, traps: { 1: 'B cancels between A + B and B + C', 2: 'only a hedged chain is flat: read the net row' }, explain: 'A + B brings an A you did not want; the chain must sell or buy it back.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Missing product → build it from an overlapping bundle minus its other leg, B = (A + B) − A; hedge the target with the signed replica, + cards one way, − cards the other.' },

    sec('contrast'),
    { type: 'compare', columns: ['Type', 'Replica of the target', 'Cards in the package'], rows: [
      ['Plain bundle B + C', 'B + C (both quoted alone)', '3'],
      ['Spread B − C', 'B − C: buy B, sell C (or the reverse)', '3'],
      ['Chain, 3 products', 'C + (A + B) − A', '4'],
      ['Chain, 4 products', 'D + (B + C) − (A + B) + A', '5'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. A replica that exactly equals the target\'s quote earns 0. Four cards means four spreads crossed, so a gap that looks big on mids can vanish. If the missing product could be built two ways, either replica is a valid hedge.' },
    { type: 'check', scope: 'the contrast table', questions: [
      mc({ q: 'How many taps does the package for a mispriced C + D on a five-card chain (A, A + B, B + C, C + D, D) take?', right: '5', wrong: [['3', 'that would be a plain bundle with both legs quoted'], ['4', 'that is the three-product chain'], ['6', 'every card is traded once, and there are five']], explain: 'The target plus its four-card replica.' }),
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: hidden boards hedge a card with another bundle even when the legs are quoted, because the bundle is cheaper to trade. The principle is the same: any exposure you can build from the cards, you can hedge.' },
    { type: 'variation', base: `Base board: ${boardText([A, AB, BC, C])}. Sell B + C, buy the replica C + (A + B) − A: +${px(edgeSell(BC, rep))}.`, rows: [
      { change: `A's bid falls by ${px(vDropA)}`, effect: `The replica sells A, so it now costs ${px(buyCost(withA(A.bid - vDropA, A.ask)))}: profit ${px(edgeSell(BC, withA(A.bid - vDropA, A.ask)))}.` },
      { same: true, change: `A's ask rises by ${px(vAskA)}`, effect: `Nothing: this package sells A, so only A's bid counts. Profit stays ${px(edgeSell(BC, withA(A.bid, A.ask + vAskA)))}.` },
      { change: `A card for B appears, quoted ${quote(Bq)}`, effect: `Now the plain hedge works too: B + C against B and C costs ${px(buyCost(repB))}, profit ${px(edgeSell(BC, repB))} in three taps. The chain replica was only a way to build the missing B.` },
      { change: `The B + C bid falls to ${px(vBCbid)}`, effect: `Edge ${px(vBCbid - buyCost(rep))}: zero does not count. Check the other direction; it loses too.` },
      { fusion: true, change: `A's bid falls by ${px(vDropA)} and C's whole quote falls by ${px(vDropA)}`, effect: `The replica sells A (${px(vDropA)} less received) and buys C (${px(vDropA)} cheaper): the moves cancel. Profit stays ${px(edgeSell(BC, [part(card('C', C.legs, C.bid - vDropA, C.ask - vDropA), 1), part(AB, 1), part(card('A', A.legs, A.bid - vDropA, A.ask), -1)]))}.` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const { cards, target, parts, rich, e } = chainBoard(rng, 3); return { type: 'number', q: `Board (bid / ask): ${boardText(cards)}. One package locks in a profit. How much?`, answer: e,
        hints: [`B has no card: build ${target.name} as ${replicaText(parts)}.`, rich ? `Buying the replica costs ${px(buyCost(parts))}; compare with the ${target.name} bid.` : `Selling the replica raises ${px(sellValue(parts))}; compare with the ${target.name} ask.`],
        explain: rich ? `${px(target.bid)} − ${px(buyCost(parts))} = ${px(e)}.` : `${px(sellValue(parts))} − ${px(target.ask)} = ${px(e)}.` }; } },
      far: { make: (rng) => { const k = rng.int(150, 260), coffee = rng.int(220, 380), j = rng.int(250, 420), x = k + coffee - rng.int(20, 60), eur = (c) => (c / 100).toFixed(2), ans = x - k + j;
        return { type: 'number', q: `A café sells a croissant for €${eur(k)}, a croissant-and-coffee combo for €${eur(x)} and a juice for €${eur(j)}. Coffee is not sold on its own. Built from these prices, what is a coffee-and-juice deal worth, in euros?`, answer: ans / 100, tolerance: 0.005,
          hints: ['Coffee = (croissant + coffee) − croissant.', `${eur(x)} − ${eur(k)} + ${eur(j)}.`],
          explain: `Coffee + juice = (croissant + coffee) − croissant + juice: ${eur(x)} − ${eur(k)} + ${eur(j)} = €${eur(ans)}. The missing item is built like B = (A + B) − A.` }; } },
      principle: mc({ q: 'Which idea carried over from the chain board to the café menu?', right: 'An item with no price of its own is a package minus its other part',
        wrong: [['An item not sold alone has no price, so nothing can be said', 'it can be built: (croissant + coffee) − croissant'], ['Add up every price on the menu that mentions the item', 'the parts you do not want must be subtracted, not added'], ['Take the average of the combos that contain the item', 'an average ignores what else is inside each combo']],
        explain: 'Both build the missing piece as a package minus a part that is priced alone: B = (A + B) − A.' }),
    },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'chain', count: 3 },
  ],
};
