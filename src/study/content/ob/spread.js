// Orderbooks family 5: spread instruments (A − B). The minus sign flips the side of that leg:
// a long A − B is bought as "buy A, sell B", so it costs ask(A) − bid(B).
import { sec, px, pxp, r6, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeText, posText, singles, mispriced, boardText, PENALTY } from './book-basics.js';

const spreadCard = (a, b, bid, ask) => card(`${a.name} − ${b.name}`, a.legs.map((q, k) => q - b.legs[k]), bid, ask);
const repl = (a, b) => [part(a, 1), part(b, -1)];

// Challenge board (past format): A − B rich by 0.5.
const A = card('A', [1, 0], 50, 50.5), B = card('B', [0, 1], 30, 30.5), AB = spreadCard(A, B, 21, 22);
const rAB = repl(A, B), pkg = packageOf(AB, rAB, true);
// Negative spread (past format): A 40 / 41, B 70 / 71, A − B −28.5 / −27.5, rich by 0.5.
const An = card('A', [1, 0], 40, 41), Bn = card('B', [0, 1], 70, 71), ABn = spreadCard(An, Bn, -28.5, -27.5);
const rN = repl(An, Bn), pkgN = packageOf(ABn, rN, true);
// Erroneous example: a fair spread that looks rich if B is priced at its ask.
const Ae = card('A', [1, 0], 50, 50.5), Be = card('B', [0, 1], 30, 31), ABe = spreadCard(Ae, Be, 20, 20.5);
const rE = repl(Ae, Be), wrongCost = r6(Ae.ask - Be.ask);
const bumpB = 0.5;

function spreadBoard(rng, rich = rng.chance(0.5)) {
  const [a, b] = singles(rng, ['A', 'B'], 30, 140);
  const parts = repl(a, b);
  const sp = mispriced('A − B', [1, -1], parts, rich, rng.pick([0.5, 1, 1.5]), rng.pick([0.5, 1]));
  return { a, b, parts, sp, rich, e: rich ? edgeSell(sp, parts) : edgeBuy(sp, parts) };
}

function replicaQ(rng) {
  const [a, b] = singles(rng, ['A', 'B'], 30, 140);
  const long = rng.chance(0.5), p = repl(a, b);
  return mc({ q: `A ${quote(a)}, B ${quote(b)} (bid / ask). What does ${long ? 'buying' : 'selling'} one A − B through the single products ${long ? 'cost' : 'raise'}?`,
    right: px(long ? buyCost(p) : sellValue(p)),
    wrong: long
      ? [[px(a.ask - b.ask), 'used B\'s ask, but copying a long A − B sells B, at its bid'], [px(a.bid - b.ask), 'that is what selling the spread raises, the other direction'], [px(a.ask + b.bid), 'ignored the minus sign: B is sold, so its price comes off'], [px(a.bid - b.bid), 'used A\'s bid, but you buy A, at its ask']]
      : [[px(a.bid - b.bid), 'used B\'s bid, but copying a short A − B buys B, at its ask'], [px(a.ask - b.bid), 'that is what buying the spread costs, the other direction'], [px(a.bid + b.ask), 'ignored the minus sign: B is bought, so its price comes off'], [px(a.ask - b.ask), 'used A\'s ask, but you sell A, at its bid']],
    hints: [long ? 'Buying A − B = buying A and selling B.' : 'Selling A − B = selling A and buying B.', long ? `ask(A) − bid(B) = ${px(a.ask)} − ${px(b.bid)}.` : `bid(A) − ask(B) = ${px(a.bid)} − ${px(b.ask)}.`],
    explain: long ? `Buy A at ${px(a.ask)}, sell B at ${px(b.bid)}: ${px(a.ask)} − ${px(b.bid)} = ${px(buyCost(p))}.` : `Sell A at ${px(a.bid)}, buy B at ${px(b.ask)}: ${px(a.bid)} − ${px(b.ask)} = ${px(sellValue(p))}.` }, rng);
}

function edgeQ(rng) {
  const { a, b, parts, sp, rich, e } = spreadBoard(rng);
  return { type: 'number', q: `Board (bid / ask): ${boardText([a, b, sp])}. Profit of the one package that pays?`, answer: e,
    hints: ['Copy the spread both ways: ask(A) − bid(B) to buy it, bid(A) − ask(B) to sell it.', rich ? `Buying the copy costs ${px(buyCost(parts))}; compare with the spread bid.` : `Selling the copy raises ${px(sellValue(parts))}; compare with the spread ask.`],
    explain: rich ? `Sell A − B at ${px(sp.bid)}, buy A, sell B: ${px(sp.bid)} − ${pxp(buyCost(parts))} = ${px(e)}.` : `Buy A − B at ${px(sp.ask)}, sell A, buy B: ${px(sellValue(parts))} − ${pxp(sp.ask)} = ${px(e)}.` };
}

// Hinge: the package with the sign mistakes as wrong options.
function packageQ(rng) {
  const { a, b, parts, sp, rich, e } = spreadBoard(rng);
  const p = packageOf(sp, parts, rich);
  const noFlip = [[sp, rich ? 'sell' : 'buy'], [a, rich ? 'buy' : 'sell'], [b, rich ? 'buy' : 'sell']];
  return mc({ q: `Board (bid / ask): ${boardText([a, b, sp])}. Which trades lock in a profit?`, right: cap(tradeText(p)),
    wrong: [
      [cap(tradeText(noFlip)), 'treated A − B like A + B: the minus sign flips B\'s side, so B is traded the same way as the spread'],
      [cap(tradeText(flip(p))), 'traded the spread the wrong way: that direction loses'],
      [cap(tradeText(p.slice(0, 2))), `left B open: you end ${posText(['A', 'B'], outcome(p.slice(0, 2), 2).net)}`],
    ],
    explain: `${rich ? `Copy cost ask(A) − bid(B) = ${px(buyCost(parts))} < spread bid ${px(sp.bid)}` : `Copy value bid(A) − ask(B) = ${px(sellValue(parts))} > spread ask ${px(sp.ask)}`}: profit ${px(e)}.` }, rng);
}

// Two spreads on three products; exactly one is mispriced.
function twoSpreadsQ(rng) {
  const [a, b, c] = singles(rng, ['A', 'B', 'C'], 30, 140);
  const mid = (x) => (x.bid + x.ask) / 2, hs = () => rng.pick([0.5, 1]);
  const fairSp = (x, y) => { const f = mid(x) - mid(y), h = hs(); return spreadCard(x, y, r6(f - h), r6(f + h)); };
  const target = rng.chance(0.5) ? 'AB' : 'BC', rich = rng.chance(0.5), e = rng.pick([0.5, 1]);
  const mis = (x, y) => { const m = mispriced('', [], repl(x, y), rich, e, hs()); return spreadCard(x, y, m.bid, m.ask); };
  const AB = target === 'AB' ? mis(a, b) : fairSp(a, b), BC = target === 'BC' ? mis(b, c) : fairSp(b, c);
  const T = target === 'AB' ? AB : BC, F = target === 'AB' ? BC : AB;
  const tp = target === 'AB' ? repl(a, b) : repl(b, c);
  return mc({ q: `Board (bid / ask): ${boardText([a, b, c, AB, BC])}. Which spread card is mispriced, and which way?`, right: `${T.name}: ${rich ? 'sell it' : 'buy it'}`,
    wrong: [[`${T.name}: ${rich ? 'buy it' : 'sell it'}`, 'right card, wrong direction: that side loses'], [`${F.name}: sell it`, `${F.name}'s quote straddles its copy: nothing there`], [`${F.name}: buy it`, `${F.name}'s quote straddles its copy: nothing there`]],
    explain: `${T.name}: ${rich ? `bid ${px(T.bid)} > copy cost ${px(buyCost(tp))}` : `ask ${px(T.ask)} < copy value ${px(sellValue(tp))}`}, edge ${px(e)}. ${F.name}: bid ${px(F.bid)} ≤ ${px(buyCost(F === AB ? repl(a, b) : repl(b, c)))} and ask ${px(F.ask)} ≥ ${px(sellValue(F === AB ? repl(a, b) : repl(b, c)))}.` }, rng);
}

export default {
  id: 'ob/spread',
  book: 'ob',
  kind: 'family',
  family: 'spread',
  title: 'Spread instruments',
  summary: 'A − B is "long A, short B": copy it by buying A and selling B, so a long costs ask(A) − bid(B).',
  prerequisites: ['ob/bundle-rich', 'ob/bundle-cheap'],
  objectives: [
    'Copy a spread card with single products: buying A − B is buying A and selling B',
    'Price the copy both ways: ask(A) − bid(B) to buy it, bid(A) − ask(B) to sell it',
    'Trade spreads with negative prices without flipping the cash',
    'On a board with two spread cards, find the one that is mispriced',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A, B, AB])}. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeText(pkg))}: +${px(outcome(pkg, 2).cash)}.`, explain: `Selling A − B leaves you short A and **long** B. You close that by buying A (at ${px(A.ask)}) and selling B (at ${px(B.bid)}), so the copy costs ${px(A.ask)} − ${px(B.bid)} = ${px(buyCost(rAB))}, below the spread bid ${px(AB.bid)}. If you bought both legs, your net row showed B +2.`,
      attempts: [
        { id: 'bothBuy', label: 'Bought both legs', approach: 'Sold A − B, then bought A and bought B.', breaksAt: `Selling A − B already makes you long B, so buying B as well leaves ${posText(['A', 'B'], outcome([[AB, 'sell'], [A, 'buy'], [B, 'buy']], 2).net)}: not flat.` },
        { id: 'askAsk', label: 'Priced B at its ask', approach: `Priced the copy as ask(A) − ask(B) = ${px(A.ask)} − ${px(B.ask)} = ${px(A.ask - B.ask)}.`, breaksAt: `The copy sells B, so B earns its bid: ${px(A.ask)} − ${px(B.bid)} = ${px(buyCost(rAB))}.` },
        { id: 'buySpread', label: 'Bought the spread', approach: `Bought A − B at ${px(AB.ask)} and sold the copy (sell A, buy B).`, breaksAt: `Selling the copy raises only ${px(sellValue(rAB))}, below the ask ${px(AB.ask)}: that side loses ${px(-edgeBuy(AB, rAB))}.` },
      ] },
    { type: 'text', text: 'The cue: a card with a **minus sign**, such as A − B or B − C. It holds one unit of the first product and **minus** one of the second: owning it is being long A and short B at once. Traders call these spreads or pairs; its price can be negative when B is worth more than A.' },
    { type: 'list', items: [`"${boardText([A, B, AB])}"`, `"${boardText([An, Bn, ABn])}": a negative spread`, 'Three products with two spread cards, A − B and B − C: only one is mispriced'] },
    { type: 'check', scope: 'what a spread card holds', questions: [
      mc({ q: 'You buy one A − B. What is your position?', right: 'A +1, B −1', wrong: [['A +1, B +1', 'the minus sign makes the B leg negative'], ['A −1, B +1', 'that is what selling A − B gives'], ['A − B +1, nothing in A or B', 'a spread card is its legs, like any bundle']], explain: 'Buying the card adds its legs: +1 A and −1 B.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Spread cards (calendar spreads, pairs) are everywhere on real desks, and on the board they test one thing: whether the minus sign flips the side you trade. Every mistake on these boards is a sign mistake, and a sign mistake means a failed submit. The good news: once the copy is written as trades, the arithmetic is no harder than a plain bundle, and negative prices follow the same rules as positive ones.' },

    sec('anchor'),
    { type: 'text', text: 'You know the bundle A + B: to copy it you buy A and buy B, so the copy costs ask(A) + ask(B). One change: B enters with a **minus** sign. To copy +1 A and −1 B you buy A and **sell** B. Selling B receives its bid, and that money comes off the cost: the copy costs ask(A) − bid(B).' },
    { type: 'check', scope: 'the minus sign flips B\'s side', questions: [
      mc({ q: 'Which trades in the single products copy buying one A − B?', right: 'Buy A, sell B', wrong: [['Buy A, buy B', 'that copies A + B: the minus sign flips B'], ['Sell A, buy B', 'that copies selling A − B'], ['Sell A, sell B', 'that copies selling A + B']], explain: '+1 A is a purchase of A; −1 B is a sale of B.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'The bundle table works unchanged: the leg B shows with a minus, and the total row prices it on the flipped side automatically.' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(AB, rAB), caption: `A − B quoted ${quote(AB)}. Buying the copy costs ask(A) − bid(B) = ${px(A.ask)} − ${px(B.bid)} = ${px(buyCost(rAB))}; selling it raises bid(A) − ask(B) = ${px(A.bid)} − ${px(B.ask)} = ${px(sellValue(rAB))}. The spread bid ${px(AB.bid)} beats the first: +${px(edgeSell(AB, rAB))}.` },
    { type: 'check', scope: 'pricing the copy', questions: [{ make: replicaQ }] },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B'], pkg), caption: `Selling A − B puts you at A −1, B +1. Buying A closes A; selling B closes B. Cash +${px(outcome(pkg, 2).cash)}.` },
    { type: 'check', scope: 'the spread package in a ledger', questions: [{ make: edgeQ }] },
    { type: 'diagram', diagram: 'numberline', spec: { min: -31.5, max: -27, step: 0.5, marks: [{ x: sellValue(rN), label: 'copy sells' }, { x: buyCost(rN), label: 'copy costs' }, { x: ABn.bid, label: 'spread bid' }, { x: ABn.ask, label: 'spread ask' }] }, caption: `A negative spread: A ${quote(An)}, B ${quote(Bn)}, A − B ${quote(ABn)}. The copy costs ${px(buyCost(rN))} and sells for ${px(sellValue(rN))}. The spread bid ${px(ABn.bid)} is to the right of the copy's cost: sell the spread, +${px(edgeSell(ABn, rN))}. The picture is the same as for positive prices.` },
    { type: 'check', scope: 'negative prices', questions: [
      mc({ q: `You sell one A − B at its bid of ${px(ABn.bid)}. What happens to your cash?`, right: `It falls by ${px(-ABn.bid)}`, wrong: [[`It rises by ${px(-ABn.bid)}`, 'a sale adds the bid, and this bid is negative'], ['Nothing: negative prices cannot trade', 'spread cards trade at negative prices whenever B is worth more than A']], explain: `Cash changes by +bid = ${px(ABn.bid)}: selling at a negative price means paying.` }),
      { type: 'number', q: `Board: ${boardText([An, Bn, ABn])}. Cash after selling A − B, buying A and selling B?`, answer: outcome(pkgN, 2).cash, hints: ['Sells add the bid (even a negative one), buys subtract the ask.', `${px(ABn.bid)} − ${px(An.ask)} + ${px(Bn.bid)}.`], explain: `${px(ABn.bid)} − ${px(An.ask)} + ${px(Bn.bid)} = ${px(outcome(pkgN, 2).cash)}.` },
    ] },

    sec('derivation'),
    { type: 'text', text: 'The method is the bundle method with one extra move at the start: turn the card into trades. Once each leg has a side (buy or sell), its price follows from the side, and the rest is the usual comparison in both directions.' },
    { type: 'steps', steps: [
      { answers: 'bothBuy', say: 'Write the card as legs: A − B = +1 A and −1 B. Buying it copies as "buy A, sell B"; selling it copies as "sell A, buy B".', why: 'Each + leg is traded the same way as the card, each − leg the opposite way.',
        checks: [mc({ q: 'Which trades copy selling one B − C?', right: 'Sell B, buy C', wrong: [['Sell B, sell C', 'the minus sign flips C'], ['Buy B, sell C', 'that copies buying B − C'], ['Buy B, buy C', 'that copies buying B + C']], explain: 'Selling B − C gives −1 B and +1 C.' })] },
      { answers: 'askAsk', say: 'Cost of buying the copy: you pay A\'s ask and receive B\'s bid, so ask(A) − bid(B).', why: 'The sale of B brings money in, which lowers the cost.',
        checks: [{ make: (rng) => { const [a, b] = singles(rng, ['A', 'B'], 30, 140); const p = repl(a, b); return { type: 'number', q: `A ${quote(a)}, B ${quote(b)}. What does buying A and selling B cost, net?`, answer: buyCost(p), hints: ['Pay the ask on A, receive the bid on B.', `${px(a.ask)} − ${px(b.bid)}.`], explain: `${px(a.ask)} − ${px(b.bid)} = ${px(buyCost(p))}.` }; } }] },
      { say: 'Value of selling the copy: you receive A\'s bid and pay B\'s ask, so bid(A) − ask(B).', why: 'Mirror image: every side flips.',
        checks: [{ make: (rng) => { const [a, b] = singles(rng, ['A', 'B'], 30, 140); const p = repl(a, b); return { type: 'number', q: `A ${quote(a)}, B ${quote(b)}. What does selling A and buying B raise, net?`, answer: sellValue(p), hints: ['Receive the bid on A, pay the ask on B.', `${px(a.bid)} − ${px(b.ask)}.`], explain: `${px(a.bid)} − ${px(b.ask)} = ${px(sellValue(p))}.` }; } }] },
      { answers: 'buySpread', say: 'Compare with the spread\'s quote: bid above the copy\'s cost → sell the spread and buy the copy; ask below the copy\'s value → buy the spread and sell the copy.', why: 'The same two checks as every bundle; only the copy\'s price changed.',
        checks: [{ hinge: true, make: packageQ }] },
    ] },
    { type: 'explain', prompt: 'Why does buying the copy of A − B use B\'s bid, when for A + B it used B\'s ask?', model: 'For A + B the copy needs +1 B, so I buy B and pay its ask. For A − B the copy needs −1 B, so I sell B and receive its bid. The minus sign turns the B trade from a purchase into a sale, and a sale always happens at the bid.', points: ['A + B needs +1 B (a purchase); A − B needs −1 B (a sale)', 'Purchases pay the ask, sales receive the bid', 'The received bid comes off the cost of the copy'] },

    sec('worked'),
    { type: 'text', text: 'Two live boards. Before pricing anything, write the copy as trades ("buy A, sell B" or "sell A, buy B") and read each price off its trade. The second board has three products and two spread cards; only one of them pays.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A, B, AB])}.`, lines: [
      { t: 0, say: 'A − B: a minus sign. Long A, short B.' },
      { t: 3, say: `Copy of a long A − B: A's ask ${px(A.ask)} minus B's ask ${px(B.ask)} = ${px(A.ask - B.ask)}.`, slip: true },
      { t: 5, say: `No: the copy sells B, and a sale gets the bid. ${px(A.ask)} − ${px(B.bid)} = ${px(buyCost(rAB))}.` },
      { t: 8, say: `Spread bid ${px(AB.bid)} is above ${px(buyCost(rAB))}: sell the spread, buy the copy.` },
      { t: 11, say: `Other side, to be sure: sell A at ${px(A.bid)}, buy B at ${px(B.ask)} raises ${px(sellValue(rAB))}, below the ask ${px(AB.ask)}. Only one side pays.` },
      { t: 15, say: `Sell A − B, buy A, sell B. Net: A 0, B 0. Cash +${px(outcome(pkg, 2).cash)}. Submit.` },
    ] },
    { type: 'check', scope: 'the same method on a fresh board', questions: [{ make: edgeQ }] },
    { type: 'worked', section: 'ob', family: 'spread', difficulty: 2, seed: 'a', explainAt: [0], intro: 'One spread card, two products. Try it before opening the solution.' },
    { type: 'worked', section: 'ob', family: 'spread', difficulty: 4, seed: 'b', fade: 2, intro: 'Two spread cards. The pricing and the decision are given; the taps and the net check are yours.' },

    sec('predict'),
    { type: 'predict', question: `Board: ${boardText([A, B, AB])}; the copy of a long A − B costs ${px(buyCost(rAB))}. If B's **bid** rises by ${px(bumpB)}, does the copy get cheaper or dearer, and what happens to the profit?`, answer: `Cheaper: you sell B, so a higher bid brings more money in. The copy costs ${px(buyCost(rAB) - bumpB)} and the profit rises to ${px(AB.bid - buyCost(rAB) + bumpB)}.`, explain: 'On a minus leg, a price rise helps the buyer of the copy. The sign flips the effect of every move.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'spread', extra: [
      { belief: 'Copy A − B by buying both A and B.', fix: 'That copies A + B. The minus leg is sold.' },
      { belief: 'The copy of a long A − B costs ask(A) − ask(B).', fix: 'You sell B, so use its bid: ask(A) − bid(B).' },
      { belief: 'A negative price cannot be traded, or selling at it earns money.', fix: 'Negative prices trade normally; selling at a negative bid pays out.' },
      { belief: 'With two spread cards, both must be mispriced.', fix: 'Check each against its own copy; usually one straddles its copy and one pays.' },
    ] },
    { type: 'erroneous', problem: `A candidate checks ${boardText([Ae, Be, ABe])}. One step is wrong.`, steps: [
      'Selling A − B leaves me short A and long B, so I will buy A and sell B.',
      `The copy costs ask(A) − ask(B) = ${px(Ae.ask)} − ${px(Be.ask)} = ${px(wrongCost)}.`,
      `The spread bid ${px(ABe.bid)} is above ${px(wrongCost)}: sell A − B, buy A, sell B.`,
      'Every product nets to 0: submit.',
    ], errorStep: 1, explain: `B is **sold**, so it earns its bid: the copy costs ${px(Ae.ask)} − ${px(Be.bid)} = ${px(buyCost(rE))}. The edge is ${px(edgeSell(ABe, rE))} (a loss), and the other direction gives ${px(edgeBuy(ABe, rE))}. The trades are flat but lose money: a failed submit and ${PENALTY} seconds.` },
    { type: 'check', scope: 'the side of the minus leg', questions: [{ make: replicaQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Say the copy out loud as trades before any arithmetic: "buy A, sell B". Then each price is automatic (buy → ask, sell → bid). Pricing first and signing later is where the sign errors come from.' },
    { type: 'check', scope: 'say the copy as trades', questions: [
      { type: 'choice', q: 'You buy a copy of A − B. Which prices do you pay?', options: ['A at its ask, B at its bid', 'A at its bid, B at its ask', 'both at their mids'], answer: 0, traps: { 1: 'buying A pays its ask; selling B gets its bid', 2: 'mids are not prices you can trade' }, explain: 'Buy A − B = buy A, sell B: A at the ask, B at the bid.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'With two spread cards, a fairly quoted one has its bid below the copy\'s cost and its ask above the copy\'s value. Check that quickly, drop it, and spend the time on the other card.' },
    { type: 'check', scope: 'two spread cards', questions: [{ make: twoSpreadsQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'A − B = long A, short B. Buying the copy costs ask(A) − bid(B); selling it raises bid(A) − ask(B). Spread bid above the cost → sell it; spread ask below the value → buy it.' },

    sec('contrast'),
    { type: 'compare', columns: ['Card', 'Copy when buying it', 'Copy cost', 'Copy value (selling it)'], rows: [
      ['A + B', 'buy A, buy B', 'ask(A) + ask(B)', 'bid(A) + bid(B)'],
      ['A − B', 'buy A, sell B', 'ask(A) − bid(B)', 'bid(A) − ask(B)'],
      ['B − A', 'buy B, sell A', 'ask(B) − bid(A)', 'bid(B) − ask(A)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. B − A is A − B with every sign reversed: buying a copy of B − A costs exactly minus what selling a copy of A − B raises. A spread quote can straddle 0. A zero edge still does not count.' },
    { type: 'check', scope: 'the contrast table', questions: [
      mc({ q: 'Which prices make up the cost of buying a copy of B − A?', right: 'ask(B) − bid(A)', wrong: [['ask(A) − bid(B)', 'that copies A − B'], ['ask(B) − ask(A)', 'A is sold, so it earns its bid'], ['bid(B) − ask(A)', 'that is the value of selling the copy']], explain: 'Buy B (ask), sell A (bid).' }),
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: chains build a missing product with a minus sign: B = (A + B) − A. Hidden boards add two spreads: (A − B) + (B − C) = A − C. Every minus sign is a leg traded the opposite way.' },
    { type: 'variation', base: `Base: ${boardText([A, B, AB])}. Sell A − B, buy A, sell B: +${px(edgeSell(AB, rAB))}.`, rows: [
      { change: `B's bid and ask both rise by ${px(bumpB)}`, effect: `You sell B at its bid, which is now higher, so the copy gets cheaper: profit ${px(edgeSell(AB, repl(A, card('B', [0, 1], B.bid + bumpB, B.ask + bumpB))))}.` },
      { same: true, change: `B's ask rises by ${px(1)}`, effect: `Nothing: this package sells B, at its bid. Profit stays ${px(edgeSell(AB, repl(A, card('B', [0, 1], B.bid, B.ask + 1))))}.` },
      { same: true, change: `Every A and B price rises by ${px(10)}`, effect: `Nothing: the copy is a difference, so a shift in both legs cancels. Profit stays ${px(edgeSell(AB, repl(card('A', [1, 0], A.bid + 10, A.ask + 10), card('B', [0, 1], B.bid + 10, B.ask + 10))))}.` },
      { change: `The spread bid falls to ${px(buyCost(rAB))}`, effect: 'It now equals the copy\'s cost: profit 0, no trade.' },
      { fusion: true, change: `The whole A − B quote rises by ${px(0.5)} and A's ask rises by ${px(1)}`, effect: `Both enter: +${px(0.5)} on the spread bid you sell at, −${px(1)} on the A you buy. Profit ${px(edgeSell(spreadCard(A, B, AB.bid + 0.5, AB.ask + 0.5), repl(card('A', [1, 0], A.bid, A.ask + 1), B)))}: no trade.` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const [c, d] = singles(rng, ['C', 'D'], 30, 140); const rich = rng.chance(0.5), p = repl(c, d); const X = mispriced('C − D', [1, -1], p, rich, rng.pick([0.5, 1, 1.5]), rng.pick([0.5, 1])); const e = rich ? edgeSell(X, p) : edgeBuy(X, p);
        return { type: 'number', q: `Board (bid / ask): ${boardText([c, d, X])}. Profit of the one package that pays?`, answer: e,
          hints: ['Copy C − D both ways: ask(C) − bid(D) to buy it, bid(C) − ask(D) to sell it.', rich ? `Buying the copy costs ${px(buyCost(p))}; compare with the spread bid.` : `Selling the copy raises ${px(sellValue(p))}; compare with the spread ask.`],
          explain: rich ? `Sell C − D at ${px(X.bid)}, buy C, sell D: ${px(X.bid)} − ${pxp(buyCost(p))} = ${px(e)}.` : `Buy C − D at ${px(X.ask)}, sell C, buy D: ${px(sellValue(p))} − ${pxp(X.ask)} = ${px(e)}.` }; } },
      far: { make: (rng) => { const oa = rng.int(80, 200), ob = oa - rng.int(10, 30), nb = oa + rng.int(300, 600), na = nb + rng.int(20, 60);
        return { type: 'number', q: `A phone shop offers an upgrade: hand in an old phone, pay a fee and get a new phone. A dealer buys new phones for €${nb} and sells them for €${na}; it buys old phones for €${ob} and sells them for €${oa}. "Buy an old phone from the dealer, take the upgrade, sell the new phone to the dealer" makes money for any fee below how many euros?`, answer: nb - oa,
          hints: ['You buy the old phone (the dealer\'s selling price) and sell the new one (the dealer\'s buying price).', `${nb} − ${oa}.`],
          explain: `Selling the new phone raises €${nb}; buying the old one costs €${oa}. The round trip pays while the fee is below ${nb} − ${oa} = €${nb - oa}. The upgrade is a spread card: new − old.` }; } },
      principle: mc({ q: 'Which idea carried over from spread cards to the phone upgrade?', right: 'A swap is a spread: the part you give up trades the other way',
        wrong: [['Compare the fee with the gap between the two phones\' mids', 'mids are never traded: buy the old phone at its ask, sell the new one at its bid'], ['Price both phones at their asks, since both change hands', 'the new phone is sold, so it fetches its bid'], ['Any fee below the new phone\'s price pays', 'you must also buy the old phone you hand in, and its ask comes off']],
        explain: 'Upgrade = +1 new, −1 old: a spread. Copy it by selling the new phone at its bid and buying the old one at its ask.' }),
    },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'spread', count: 3 },
  ],
};
