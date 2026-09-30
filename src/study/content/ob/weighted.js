// Orderbooks family 4: weighted bundles (2A + B, A + 2B, 3A + B, 2A + B + C, 2A + 2B). A leg
// with weight w is priced w times and traded w times.
import { sec, px, r6, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeTextN, posText, singles, mispriced, boardText, PENALTY } from './book-basics.js';

const NAMES = ['A', 'B', 'C'];
export const wName = (w) => w.map((q, k) => `${q > 1 ? q : ''}${NAMES[k]}`).join(' + ');
const SHAPES = [[2, 1], [1, 2], [3, 1], [1, 3], [2, 1, 1], [2, 2]];

// Challenge board (past format): 2A + B rich by 0.5.
const A = card('A', [1, 0], 20, 20.5), B = card('B', [0, 1], 50, 50.5), W = card('2A + B', [2, 1], 92, 93);
const wparts = [part(A, 2), part(B, 1)];
const pkg = packageOf(W, wparts, true);
const oneEach = packageOf(W, [part(A, 1), part(B, 1)], true);
// Cheap picture board (past format): A + 2B.
const A2 = card('A', [1, 0], 15, 15.5), B2 = card('B', [0, 1], 30, 30.5), W2 = card('A + 2B', [1, 2], 73, 74);
const w2parts = [part(A2, 1), part(B2, 2)];
const pkg2 = packageOf(W2, w2parts, false);
// Erroneous example (past format): A + 3B with the weight put on A.
const Ae = card('A', [1, 0], 18, 18.5), Be = card('B', [0, 1], 27, 27.5), We = card('A + 3B', [1, 3], 101.5, 102.5);
const eparts = [part(Ae, 1), part(Be, 3)];
const wrongCost = r6(3 * Ae.ask + Be.ask);
const bumpA = 0.5;

function weightedBoard(rng, w = rng.pick(SHAPES), rich = rng.chance(0.5)) {
  const names = NAMES.slice(0, w.length);
  const cs = singles(rng, names, 15, 90);
  const parts = cs.map((c, k) => part(c, w[k]));
  const bundle = mispriced(wName(w), w, parts, rich, rng.pick([0.5, 1, 1.5]), rng.pick([0.5, 1, 1.5]));
  return { w, names, cs, parts, bundle, rich, e: rich ? edgeSell(bundle, parts) : edgeBuy(bundle, parts) };
}
const reweigh = (cs, w) => cs.map((c, k) => part(c, w[k]));

function priceQ(rng) {
  const { w, cs, parts, rich } = weightedBoard(rng);
  const terms = parts.map((p) => `${p.qty > 1 ? `${p.qty} × ` : ''}${px(rich ? p.ask : p.bid)}`).join(' + ');
  return { type: 'number', q: `Legs (bid / ask): ${boardText(cs)}. What does ${rich ? 'buying' : 'selling'} the contents of one ${wName(w)} ${rich ? 'cost' : 'fetch'}?`, answer: rich ? buyCost(parts) : sellValue(parts),
    hints: [`${wName(w)} holds ${parts.map((p) => `${p.qty} ${p.name}`).join(', ')}.`, `${rich ? 'Asks' : 'Bids'}, each times its weight: ${terms}.`],
    explain: `${terms} = ${px(rich ? buyCost(parts) : sellValue(parts))}.` };
}

// Hinge: the package, with the classic weight mistakes as wrong options.
function packageQ(rng) {
  const { w, cs, parts, bundle, rich, e } = weightedBoard(rng, rng.pick([[2, 1], [1, 2], [3, 1], [2, 1, 1]]));
  const p = packageOf(bundle, parts, rich);
  const ones = packageOf(bundle, reweigh(cs, w.map(() => 1)), rich);
  const rot = w.slice(1).concat(w[0]);
  const wrongLeg = packageOf(bundle, reweigh(cs, rot), rich);
  return mc({ q: `Board (bid / ask): ${boardText([...cs, bundle])}. Which trades lock in a profit?`, right: cap(tradeTextN(p)),
    wrong: [
      [cap(tradeTextN(ones)), `traded one unit of each leg: ${wName(w)} holds more than one of some leg, so that product is left open`],
      [cap(tradeTextN(wrongLeg)), 'put the weights on the wrong legs: one product ends short, another long'],
      [cap(tradeTextN(flip(p))), `traded the bundle the wrong way: the other direction loses`],
    ],
    explain: `${wName(w)} at the ${rich ? 'asks' : 'bids'}: ${px(rich ? buyCost(parts) : sellValue(parts))}. ${rich ? `Bid ${px(bundle.bid)} is higher` : `Ask ${px(bundle.ask)} is lower`}: profit ${px(e)} with ${p.length} taps.` }, rng);
}

function edgeQ(rng) {
  const { cs, parts, bundle, rich, e } = weightedBoard(rng);
  return { type: 'number', q: `Board (bid / ask): ${boardText([...cs, bundle])}. Profit of the one package that pays?`, answer: e,
    hints: ['Price the bundle\'s contents both ways: weight × bid and weight × ask for each leg.', rich ? `Contents at the asks: ${px(buyCost(parts))}. Compare with the bundle bid.` : `Contents at the bids: ${px(sellValue(parts))}. Compare with the bundle ask.`],
    explain: rich ? `Sell the bundle: ${px(bundle.bid)} − ${px(buyCost(parts))} = ${px(e)}.` : `Buy the bundle: ${px(sellValue(parts))} − ${px(bundle.ask)} = ${px(e)}.` };
}

export default {
  id: 'ob/weighted',
  book: 'ob',
  kind: 'family',
  family: 'weighted',
  title: 'Weighted bundles',
  summary: 'A leg with weight w counts w times: price it w times, trade it w times.',
  prerequisites: ['ob/bundle-rich', 'ob/bundle-cheap'],
  objectives: [
    'Read the contents of a weighted card (2A + B, A + 3B, 2A + B + C) and price them on the traded side',
    'Run the rich and cheap checks with weights',
    'Execute the package with the right number of units per leg and verify the net row',
    'Name the two weight mistakes: one unit per leg, and the weight on the wrong leg',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A, B, W])}. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeTextN(pkg))}: +${px(outcome(pkg, 2).cash)}.`, explain: `If you sold 2A + B and bought one A and one B, your net row reads ${posText(['A', 'B'], outcome(oneEach, 2).net)}: not flat. The bundle holds two A, so its contents cost 2 × ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(wparts))} at the asks.` },
    { type: 'text', text: 'The cue: a bundle whose name has a **number in front of a leg**: 2A + B, A + 2B, 3A + B, 2A + B + C, 2A + 2B. The number is the **weight**: how many units of that product one bundle holds. Every leg is still quoted alone, so this is the rich or cheap check with repeated legs.' },
    { type: 'list', items: [`"${boardText([A, B, W])}"`, `"${boardText([A2, B2, W2])}"`, 'Three legs with one weighted: 2A + B + C'] },
    { type: 'check', scope: 'reading a weighted card', questions: [
      { make: (rng) => { const w = rng.pick(SHAPES), k = rng.int(0, w.length - 1); return { type: 'number', q: `How many units of ${NAMES[k]} does one ${wName(w)} hold?`, answer: w[k], explain: `The weight in front of ${NAMES[k]} is ${w[k]}${w[k] === 1 ? ' (no number means 1)' : ''}.` }; } },
    ] },

    sec('why'),
    { type: 'text', text: 'Weighted bundles test whether you hedge with the right number of units. The pricing is one multiplication more than a plain bundle, but the execution is where boards are lost: one A too few leaves you short A, the submit fails, and the clock loses seconds. The skill is to let the weights drive both the price and the tap count. Weights also magnify spreads: a weight-3 leg pays its spread three times, so these boards punish sloppy pricing more than plain bundles do.' },

    sec('anchor'),
    { type: 'text', text: 'You know the plain bundle A + B: price the legs on the side you trade and compare. One change: a leg appears **more than once**. 2A + B is just A + A + B written short, so its contents cost ask(A) + ask(A) + ask(B), and hedging it takes two A trades and one B trade. The weight is a count of units inside the card; it never multiplies the bundle\'s own price.' },
    { type: 'check', scope: '2A + B = A + A + B', questions: [{ make: priceQ }] },

    sec('picture'),
    { type: 'text', text: 'The bundle table shows the weight next to each leg, and the total row already multiplies by it. Read it the same way as before: the bundle bid against the contents\' ask total, then the contents\' bid total against the bundle ask. Only the totals are bigger.' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(W, wparts), caption: `2A + B quoted ${quote(W)}. Contents at the asks: 2 × ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(wparts))}; at the bids: 2 × ${px(A.bid)} + ${px(B.bid)} = ${px(sellValue(wparts))}. The bid ${px(W.bid)} clears the first: +${px(edgeSell(W, wparts))}.` },
    { type: 'check', scope: 'the weighted total', questions: [{ make: edgeQ }] },
    { type: 'diagram', diagram: 'ledger', spec: ledgerSpec(['A', 'B'], pkg2), caption: `A cheap A + 2B. Buying it makes you long one A and two B; one A sale and two B sales bring both columns to 0. Cash +${px(outcome(pkg2, 2).cash)}.` },
    { type: 'check', scope: 'weights in the ledger', questions: [
      { make: (rng) => { const { w, parts, bundle, rich } = weightedBoard(rng, rng.pick([[2, 1], [1, 2], [3, 1], [1, 3]])); const p = packageOf(bundle, reweigh(parts.map((x) => x.card), [1, 1]), rich); const o = outcome(p, 2); return mc({ q: `You ${rich ? 'sell' : 'buy'} one ${wName(w)} and ${rich ? 'buy' : 'sell'} one A and one B. What is your net position?`, right: posText(['A', 'B'], o.net),
        wrong: [['Flat', 'one unit per leg only flattens a plain bundle'], [posText(['A', 'B'], o.net.map((x) => -x)), 'flipped the sign of the leftover'], [posText(['A', 'B'], o.net.slice().reverse()), 'put the leftover on the other leg']],
        explain: `The bundle moves ${w.map((q, k) => `${q} ${NAMES[k]}`).join(' and ')}; one of each leg closes only part of it.` }, rng); } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Card', 'Contents', 'Taps in the package'], rows: SHAPES.map((w) => [wName(w), w.map((q, k) => `${q} ${NAMES[k]}`).join(', '), String(1 + w.reduce((s, q) => s + q, 0))]) }, caption: 'Weights set the tap count: one tap for the bundle plus one per unit of every leg. 3A + B and 2A + B + C take five taps each.' },
    { type: 'check', scope: 'weights set the tap count', questions: [
      { make: (rng) => { const w = rng.pick(SHAPES); return { type: 'number', q: `How many taps does the package for a mispriced ${wName(w)} take?`, answer: 1 + w.reduce((s, q) => s + q, 0), hints: ['One for the bundle, then one per unit of each leg.', `1 + ${w.join(' + ')}.`], explain: `1 + ${w.join(' + ')} = ${1 + w.reduce((s, q) => s + q, 0)}.` }; } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'Nothing in the logic changes from the plain bundle. What changes is the bookkeeping: the card is shorthand for several units, and every unit has to be priced and traded. The four moves below make that explicit, so a weight can never slip through.' },
    { type: 'steps', steps: [
      { say: 'Expand the card into units: 3A + B is A + A + A + B.', why: 'The bundle is its contents, unit by unit; weights are shorthand.',
        checks: [{ make: (rng) => { const w = rng.pick(SHAPES); return { type: 'number', q: `How many product units in total does one ${wName(w)} hold?`, answer: w.reduce((s, q) => s + q, 0), explain: `${w.join(' + ')} = ${w.reduce((s, q) => s + q, 0)}.` }; } }] },
      { say: 'Price the contents on the traded side: weight × ask for each leg you would buy, or weight × bid for each leg you would sell.', why: 'Each unit is one tap at that leg\'s price.',
        checks: [{ make: priceQ }] },
      { say: 'Compare with the bundle quote in both directions, exactly as for a plain bundle, and pick the one that pays.', why: 'The weights change the totals, not the logic.',
        checks: [{ hinge: true, make: packageQ }] },
      { say: 'Execute weight-many units of each leg, then read the net row: every product must show 0.', why: 'Only the exact weights cancel the bundle; the net row catches a missing unit before the submit does.',
        checks: [mc({ q: 'You sold one 2A + B. Which leg trades make you flat?', right: 'Buy A twice, buy B once', wrong: [['Buy A once, buy B once', 'still short one A'], ['Buy A once, buy B twice', 'weight on the wrong leg: short A, long B'], ['Sell A twice, sell B once', 'selling adds to the short instead of closing it']], explain: 'Two A and one B came out with the bundle; two A and one B go back in.' })] },
    ] },
    { type: 'explain', prompt: 'Why must you trade exactly weight-many units of each leg, and what does the net row show if you trade one of each instead?', model: 'One 2A + B moves two A and one B, so only two A trades and one B trade cancel it. With one of each, A is left at −1 (or +1 when buying the bundle): the position is open, the cash is not locked in, and the submit fails.', points: ['A weight is a unit count: 2A means two units of A', 'Flat needs each product to net to 0 separately', 'One of each leaves the weighted leg open by weight − 1'] },

    sec('worked'),
    { type: 'text', text: 'Two live boards. The rich or cheap direction is random, so run both checks with the weights before deciding. On the second board, count your taps against the contents before submitting: the table in the picture section gives the number for every shape.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A, B, W])}.`, lines: [
      { t: 0, say: '2A + B: a weight on A. Two A and one B inside, both legs quoted.' },
      { t: 3, say: `Rich side: 2 × ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(wparts))} against bid ${px(W.bid)}. Up ${px(edgeSell(W, wparts))}.` },
      { t: 8, say: `Sanity: ${px(buyCost(wparts))} is near twice A plus B, so the weight is on the right leg.` },
      { t: 12, say: 'Sell 2A + B, buy A, buy A, buy B. Four taps: one plus the weights 2 and 1.' },
      { t: 17, say: `Net row: A 0, B 0. Cash +${px(outcome(pkg, 2).cash)}. Submit.` },
    ] },
    { type: 'check', scope: 'the same method on a fresh board', questions: [{ make: edgeQ }] },
    { type: 'worked', section: 'ob', family: 'weighted', difficulty: 2, seed: 'a', intro: 'Two legs, one of them weighted. Try it before opening the solution.' },
    { type: 'worked', section: 'ob', family: 'weighted', difficulty: 4, seed: 'b', fade: 2, intro: 'A heavier shape. The pricing and the decision are given; the taps and the net check are yours.' },

    sec('predict'),
    { type: 'predict', question: `Board: ${boardText([A, B, W])}, profit ${px(edgeSell(W, wparts))}. If A's ask rises by ${px(bumpA)}, what happens to the profit?`, answer: `It falls by ${px(2 * bumpA)} to ${px(edgeSell(W, wparts) - 2 * bumpA)}: you buy two A, so every move in A's ask counts twice. The trade no longer pays.`, explain: 'A weight multiplies a leg\'s price, its spread and every change in it.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'weighted', extra: [
      { belief: 'Hedge a bundle with one unit of each leg.', fix: 'Trade weight-many units: 2A + B needs two A.' },
      { belief: 'The weight belongs to whichever leg is cheaper.', fix: 'Read it off the card: in A + 3B the three belongs to B.' },
      { belief: '2A + 2B means trading the bundle twice.', fix: 'It is one card holding two A and two B: one bundle tap, two A taps, two B taps.' },
      { belief: 'Price the weight once and forget it in the spread.', fix: 'A weight-2 leg costs its spread twice, so weighted bundles need bigger mid gaps to pay.' },
    ] },
    { type: 'erroneous', problem: `A candidate solves ${boardText([Ae, Be, We])}. One step is wrong.`, steps: [
      'A + 3B holds one A and three B.',
      `Its contents cost 3 × ${px(Ae.ask)} + ${px(Be.ask)} = ${px(wrongCost)} at the asks.`,
      `The bid ${px(We.bid)} is far above ${px(wrongCost)}: sell A + 3B, buy three A and one B.`,
      'Submit.',
    ], errorStep: 1, explain: `The weight 3 belongs to **B**: ${px(Ae.ask)} + 3 × ${px(Be.ask)} = ${px(buyCost(eparts))}. The edge is ${px(edgeSell(We, eparts))}, not ${px(We.bid - wrongCost)}, and the trades must be one A and three B. The written trades end at ${posText(['A', 'B'], outcome(packageOf(We, [part(Ae, 3), part(Be, 1)], true), 2).net)}: a failed submit and ${PENALTY} seconds gone.` },
    { type: 'check', scope: 'the weight mistakes', questions: [
      { make: (rng) => { const w = rng.pick([[1, 3], [3, 1], [1, 2], [2, 1]]); const cs = singles(rng, ['A', 'B'], 15, 90); const k = w[0] > 1 ? 0 : 1, o = 1 - k; const right = buyCost(reweigh(cs, w)), swapped = buyCost(reweigh(cs, [w[1], w[0]])), ones = buyCost(reweigh(cs, [1, 1])), all = r6(w[k] * (cs[0].ask + cs[1].ask));
        return mc({ q: `A ${quote(cs[0])}, B ${quote(cs[1])}. What do the contents of one ${wName(w)} cost at the asks?`, right: px(right),
          wrong: [[px(swapped), `put the weight on ${NAMES[o]} instead of ${NAMES[k]}`], [px(ones), 'ignored the weight: priced one unit of each leg'], [px(all), 'applied the weight to both legs']],
          explain: `${w.map((q, j) => `${q > 1 ? `${q} × ` : ''}${px(cs[j].ask)}`).join(' + ')} = ${px(right)}.` }, rng); } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Multiply once per leg and add: weight × price. For the tap count, use 1 + the weights added, and check the trade list against it before submitting.' },
    { type: 'callout', tone: 'speed', text: 'Tap the weighted leg\'s units one after another (A, A, then B) so the trade list reads like the card. A glance then confirms the count, and the net row confirms flatness, before you spend a submit.' },
    { type: 'callout', tone: 'speed', text: 'Sanity check: a weighted bundle\'s quote should sit near weight × each leg\'s price. If 2A + B trades near A + B, you have misread which leg is weighted.' },
    { type: 'check', scope: 'multiply, add, count', questions: [{ make: edgeQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Weighted bundle: contents = weight × leg price on the traded side, added; trade one bundle against weight-many units of each leg.' },

    sec('contrast'),
    { type: 'compare', columns: ['Card', 'Contents cost (buying them)', 'Package when rich'], rows: [
      ['A + B', 'ask(A) + ask(B)', 'sell A + B, buy A, buy B'],
      ['2A + B', '2 × ask(A) + ask(B)', 'sell 2A + B, buy A twice, buy B'],
      ['A + 3B', 'ask(A) + 3 × ask(B)', 'sell A + 3B, buy A, buy B three times'],
      ['2A + B + C', '2 × ask(A) + ask(B) + ask(C)', 'sell it, buy A twice, B once, C once'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. 2A + 2B holds two of each: still one bundle tap. Five taps (3A + B, 2A + B + C, 2A + 2B) is normal here. A zero edge after weighting still does not count.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: hidden boards hedge 2A + B with another bundle, (A + B) + A, which crosses one tight spread instead of two wide ones. The weights still have to match unit for unit.' },
    { type: 'check', scope: 'the contrast table', questions: [
      mc({ q: 'Which trades hedge one sold 2A + B + C?', right: 'Buy A twice, B once, C once', wrong: [['Buy A, B and C once each', 'short one A left over'], ['Buy A twice, B twice, C twice', 'long one B and one C left over'], ['Buy two 2A + B + C', 'buying the card back only pays the spread; two copies overshoot']], explain: 'Match the contents: two A, one B, one C.' }),
    ] },

    { type: 'variation', base: `Base: ${boardText([A, B, W])}. Sell 2A + B, buy two A and one B: +${px(edgeSell(W, wparts))}.`, rows: [
      { change: `A's ask rises by ${px(bumpA)}`, effect: `Two A are bought, so the cost rises by ${px(2 * bumpA)}: profit ${px(edgeSell(W, [part(card('A', [1, 0], A.bid, A.ask + bumpA), 2), part(B)]))}, no trade.` },
      { change: `B's ask rises by ${px(bumpA)}`, effect: `One B is bought: cost up ${px(bumpA)}, profit ${px(edgeSell(W, [part(A, 2), part(card('B', [0, 1], B.bid, B.ask + bumpA))]))}, no trade.` },
      { change: `A's bid falls by ${px(1)}`, effect: `Nothing: you buy A, at its ask. Profit stays ${px(edgeSell(W, [part(card('A', [1, 0], A.bid - 1, A.ask), 2), part(B)]))}.` },
      { change: `The bundle ask rises by ${px(1)}`, effect: `Nothing: you sell the bundle, at its bid. Profit stays ${px(edgeSell(card('2A + B', [2, 1], W.bid, W.ask + 1), wparts))}.` },
    ] },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'weighted', count: 3 },
  ],
};
