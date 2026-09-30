// Orderbooks family 8: hidden arbitrage between bundles. The single legs are wide, so the card
// fails against its own legs; the edge appears when another tight bundle is used as the hedge:
// 2A + B = (A + B) + A, or A − C = (A − B) + (B − C).
import { sec, px, r6, hp, card, part, quote, mc, cap, buyCost, sellValue, edgeSell, edgeBuy, bundleSpec, ledgerSpec, outcome, packageOf, flip, tradeText, posText, mispriced, boardText, PENALTY } from './book-basics.js';

// Challenge board (past format): 2A + B rich by 0.5 against (A + B) + A, a loss against its legs.
const A = card('A', [1, 0], 19, 22), B = card('B', [0, 1], 27, 30), AB = card('A + B', [1, 1], 50, 50.5), W = card('2A + B', [2, 1], 73, 73.5);
const viaLegs = [part(A, 2), part(B, 1)], viaAB = [part(AB, 1), part(A, 1)], via2AB = [part(AB, 2), part(B, -1)];
const pkg = packageOf(W, viaAB, true);
// Spread version (past format): A − C rich by 0.5 against (A − B) + (B − C).
const As = card('A', [1, 0, 0], 40, 42), Bs = card('B', [0, 1, 0], 60, 62), Cs = card('C', [0, 0, 1], 30, 32);
const AmB = card('A − B', [1, -1, 0], -20.5, -20), BmC = card('B − C', [0, 1, -1], 30, 30.5), AmC = card('A − C', [1, 0, -1], 11, 11.5);
const sLegs = [part(As, 1), part(Cs, -1)], sRep = [part(AmB, 1), part(BmC, 1)];
const sPkg = packageOf(AmC, sRep, true);
const sWrong = [[AmC, 'sell'], [AmB, 'buy'], [BmC, 'sell']];
// Both hedges pay (past format): the bundle hedge pays more.
const A3 = card('A', [1, 0], 30, 33), B3 = card('B', [0, 1], 50, 53), AB3 = card('A + B', [1, 1], 81, 81.5), W3 = card('2A + B', [2, 1], 109, 109.5);
const legs3 = [part(A3, 2), part(B3, 1)], rep3 = [part(AB3, 1), part(A3, 1)];
// Variation rows on the challenge board.
const An = card('A', [1, 0], 20, 21), Bw = card('B', [0, 1], 26, 31), ABup = card('A + B', [1, 1], 50, 51), Wask = card('2A + B', [2, 1], 73, 74.5);

// 2A + B with wide singles and a tight A + B; mispriced against (A + B) + A by e.
function hiddenBoard(rng, rich = rng.chance(0.5)) {
  const v1 = hp(rng, 20, 90); let v2; do { v2 = hp(rng, 20, 90); } while (v2 === v1);
  const wide = rng.pick([1.5, 2]), e = rng.pick([0.5, 1, 1.5]);
  const a = card('A', [1, 0], v1 - wide, v1 + wide), b = card('B', [0, 1], v2 - wide, v2 + wide), ab = card('A + B', [1, 1], v1 + v2 - 0.5, v1 + v2 + 0.5);
  const rep = [part(ab, 1), part(a, 1)], legs = [part(a, 2), part(b, 1)];
  const w = mispriced('2A + B', [2, 1], rep, rich, e, 0.5);
  return { a, b, ab, w, rep, legs, rich, e, cards: rng.shuffle([a, b, ab, w]) };
}
// A − C with wide singles and tight A − B, B − C; mispriced against the two spreads by e.
function spreadsBoard(rng, rich = rng.chance(0.5)) {
  const v = []; while (v.length < 3) { const x = hp(rng, 30, 120); if (!v.includes(x)) v.push(x); }
  v.sort((x, y) => y - x); // A > B > C keeps every spread positive
  const wide = rng.pick([1.5, 2]), e = rng.pick([0.5, 1, 1.5]);
  const [a, b, c] = ['A', 'B', 'C'].map((n, k) => card(n, [0, 1, 2].map((j) => (j === k ? 1 : 0)), v[k] - wide, v[k] + wide));
  const ab = card('A − B', [1, -1, 0], v[0] - v[1] - 0.5, v[0] - v[1] + 0.5), bc = card('B − C', [0, 1, -1], v[1] - v[2] - 0.5, v[1] - v[2] + 0.5);
  const rep = [part(ab, 1), part(bc, 1)], legs = [part(a, 1), part(c, -1)];
  const ac = mispriced('A − C', [1, 0, -1], rep, rich, e, 0.5);
  return { a, b, c, ab, bc, ac, rep, legs, rich, e, cards: rng.shuffle([a, b, c, ab, bc, ac]) };
}
const edgeOf = (x, parts, rich) => (rich ? edgeSell(x, parts) : edgeBuy(x, parts));

function legHedgeQ(rng) {
  const { w, legs, rich, cards } = hiddenBoard(rng);
  const ed = edgeOf(w, legs, rich);
  return mc({ q: `Board (bid / ask): ${boardText(cards)}. Does ${rich ? 'selling 2A + B and buying two A and one B' : 'buying 2A + B and selling two A and one B'} lock in a profit?`,
    right: `No: the edge is ${px(ed)}`,
    wrong: [[`Yes: the edge is ${px(Math.abs(ed))}`, 'dropped the sign: the wide legs make this a loss'], [`Yes: ${rich ? 'the bundle bid is above the legs\' mids' : 'the bundle ask is below the legs\' mids'}`, 'mids are not tradable']],
    explain: rich ? `Bid ${px(w.bid)} − (2 × ${px(legs[0].ask)} + ${px(legs[1].ask)}) = ${px(ed)}.` : `(2 × ${px(legs[0].bid)} + ${px(legs[1].bid)}) − ask ${px(w.ask)} = ${px(ed)}.` }, rng);
}

function bundleHedgeQ(rng) {
  const { w, rep, rich, e, cards } = hiddenBoard(rng);
  return { type: 'number', q: `Board (bid / ask): ${boardText(cards)}. Hedge 2A + B with (A + B) + A. What does the one profitable package lock in?`, answer: e,
    hints: [rich ? 'Buying the replica: A + B at its ask, A at its ask.' : 'Selling the replica: A + B at its bid, A at its bid.', rich ? `Cost ${px(rep[0].ask)} + ${px(rep[1].ask)} = ${px(buyCost(rep))}; compare with the 2A + B bid.` : `Value ${px(rep[0].bid)} + ${px(rep[1].bid)} = ${px(sellValue(rep))}; compare with the 2A + B ask.`],
    explain: rich ? `${px(w.bid)} − ${px(buyCost(rep))} = ${px(e)}.` : `${px(sellValue(rep))} − ${px(w.ask)} = ${px(e)}.` };
}

// Hinge: bundle hedge against the leg hedge and the classic slips.
function packageQ(rng) {
  const { a, ab, w, rep, legs, rich, e, cards } = hiddenBoard(rng);
  const p = packageOf(w, rep, rich), viaL = packageOf(w, legs, rich), half = [[w, rich ? 'sell' : 'buy'], [ab, rich ? 'buy' : 'sell']];
  return mc({ q: `Board (bid / ask): ${boardText(cards)}. Which trades lock in a profit?`, right: cap(tradeText(p)),
    wrong: [
      [cap(tradeText(viaL)), `the leg hedge: flat, but the wide legs make it lose (cash ${px(outcome(viaL, 2).cash)})`],
      [cap(tradeText(half)), `left A open: A + B holds one A, 2A + B holds two (net ${posText(['A', 'B'], outcome(half, 2).net)})`],
      [cap(tradeText(flip(p))), 'traded 2A + B the wrong way: that direction loses'],
      ['No trade: the leg hedge fails', 'stopped after the obvious hedge: a tight bundle gives a cheaper one'],
    ],
    explain: `2A + B = (A + B) + A. ${rich ? `Buying it costs ${px(buyCost(rep))} < bid ${px(w.bid)}` : `Selling it raises ${px(sellValue(rep))} > ask ${px(w.ask)}`}: profit ${px(e)}.` }, rng);
}

function spreadsEdgeQ(rng) {
  const { ac, rep, rich, e, cards } = spreadsBoard(rng);
  return { type: 'number', q: `Board (bid / ask): ${boardText(cards)}. A − C = (A − B) + (B − C). What does the profitable package lock in?`, answer: e,
    hints: [rich ? 'Buy both spreads at their asks; sell A − C at its bid.' : 'Sell both spreads at their bids; buy A − C at its ask.', rich ? `${px(ac.bid)} − (${px(rep[0].ask)} + ${px(rep[1].ask)}).` : `(${px(rep[0].bid)} + ${px(rep[1].bid)}) − ${px(ac.ask)}.`],
    explain: rich ? `${px(ac.bid)} − ${px(buyCost(rep))} = ${px(e)}.` : `${px(sellValue(rep))} − ${px(ac.ask)} = ${px(e)}.` };
}

export default {
  id: 'ob/hidden',
  book: 'ob',
  kind: 'family',
  family: 'hidden',
  title: 'Hidden arbitrage between bundles',
  summary: 'When the leg hedge fails on wide legs, hedge with another tight bundle: 2A + B = (A + B) + A, A − C = (A − B) + (B − C).',
  prerequisites: ['ob/weighted', 'ob/spread', 'ob/chain'],
  objectives: [
    'Recognise the hidden board: wide single products, tight bundles, a card that fails against its own legs',
    'List every exact replica of a card from the other cards and price each on the traded side',
    'Trade the card against its cheapest replica, for weighted bundles and for spreads',
    'Know that when two hedges both pay, either one solves the board',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: board (bid / ask) ${boardText([A, B, AB, W])}. Find a flat, profitable set of trades. Two approaches, then the trades and the profit.`, answer: `${cap(tradeText(pkg))}: +${px(outcome(pkg, 2).cash)}.`, explain: `Against its legs 2A + B fails: 2 × ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(viaLegs))} is above the bid ${px(W.bid)}. But 2A + B = (A + B) + A, and that costs ${px(AB.ask)} + ${px(A.ask)} = ${px(buyCost(viaAB))}. If your first approach was the leg hedge and you stopped, that is the belief this lesson removes.` },
    { type: 'text', text: 'The cue: **single products with wide quotes** (spreads of several points) next to **bundles with tight quotes**, and a card that overlaps another bundle almost completely: 2A + B next to A + B, or A − C next to A − B and B − C. Run the plain check and it fails; the edge is between the bundles.' },
    { type: 'list', items: [`"${boardText([A, B, AB, W])}"`, `"${boardText([As, Bs, Cs, AmB, BmC, AmC])}"`] },
    { type: 'check', scope: 'the leg hedge on a hidden board', questions: [{ make: legHedgeQ }] },

    sec('why'),
    { type: 'text', text: 'These are the hardest boards in the task, and they punish the habit that solves every earlier type: "bundle against its legs". The legs are deliberately expensive to trade, so that check always fails here. Candidates who know only one replica per card skip these boards; candidates who ask "what else holds the same contents?" solve them in twenty seconds.' },

    sec('anchor'),
    { type: 'text', text: 'From chains you know a replica can be built from bundles, not only from legs: B + C = C + (A + B) − A. One change: here every leg **is** quoted, so a leg replica exists, but it is expensive. You pick a bundle replica anyway, because a tight bundle crosses one small spread where the wide legs cross several big ones.' },
    { type: 'check', scope: 'a bundle as part of a replica', questions: [
      mc({ q: 'Which combination of cards holds exactly the contents of 2A + B?', right: '(A + B) + A', wrong: [['(A + B) + B', 'that is A + 2B'], ['(A + B) − A', 'that is B'], ['2 × (A + B)', 'that is 2A + 2B: one B too many']], explain: 'A + B brings one A and one B; one more A makes 2A + B.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Price the same card against two different replicas. First its own legs.' },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(W, viaLegs), caption: `2A + B against its legs. The wide legs cost ${px(buyCost(viaLegs))} to buy and fetch ${px(sellValue(viaLegs))} to sell; the quote ${quote(W)} sits inside that range. Nothing crosses.` },
    { type: 'check', scope: 'the failed leg hedge', questions: [
      { type: 'number', q: `From the table: selling 2A + B at ${px(W.bid)} and buying two A and one B at their asks locks in what (negative for a loss)?`, answer: edgeSell(W, viaLegs), hints: ['Bid minus the legs\' ask total.', `${px(W.bid)} − ${px(buyCost(viaLegs))}.`], explain: `${px(W.bid)} − ${px(buyCost(viaLegs))} = ${px(edgeSell(W, viaLegs))}: a loss.` },
    ] },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(W, viaAB), caption: `The same card against (A + B) + A. The replica crosses one tight spread (A + B) and one wide one (A): it costs ${px(buyCost(viaAB))}, below the bid ${px(W.bid)}. +${px(edgeSell(W, viaAB))}.` },
    { type: 'check', scope: 'the bundle hedge', questions: [{ make: bundleHedgeQ }] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Replica of 2A + B', 'Cost to buy it', 'Edge of selling 2A + B'], rows: [
      ['A + A + B (the legs)', px(buyCost(viaLegs)), px(edgeSell(W, viaLegs))],
      ['(A + B) + A', px(buyCost(viaAB)), px(edgeSell(W, viaAB))],
      ['2 × (A + B) − B', px(buyCost(via2AB)), px(edgeSell(W, via2AB))],
    ] }, caption: 'Three exact replicas, three prices. Only the one that crosses the fewest wide spreads beats the bid.' },
    { type: 'check', scope: 'choosing the cheapest replica', questions: [
      { make: (rng) => { const { a, b, ab, w, rep, legs, rich, cards } = hiddenBoard(rng, true); const r2 = [part(ab, 2), part(b, -1)]; return mc({ q: `Board: ${boardText(cards)}. You will sell 2A + B. Which replica is cheapest to buy?`, right: `(A + B) + A: ${px(buyCost(rep))}`,
        wrong: [[`A + A + B: ${px(buyCost(legs))}`, 'the legs cross three wide spreads'], [`2 × (A + B) − B: ${px(buyCost(r2))}`, 'crosses two tight spreads plus a wide one on B']], explain: `Costs: legs ${px(buyCost(legs))}, (A + B) + A ${px(buyCost(rep))}, 2 × (A + B) − B ${px(buyCost(r2))}.` }, rng); } },
    ] },
    { type: 'diagram', diagram: 'bundle', spec: bundleSpec(AmC, sRep), caption: `The spread version. A − C against (A − B) + (B − C): B cancels. Buying both spreads costs ${px(AmB.ask)} + ${px(BmC.ask)} = ${px(buyCost(sRep))}, below the A − C bid ${px(AmC.bid)}: +${px(edgeSell(AmC, sRep))}. Against its legs (ask(A) − bid(C) = ${px(buyCost(sLegs))}) it fails.` },
    { type: 'check', scope: 'two spreads make a third', questions: [{ make: spreadsEdgeQ }] },

    sec('derivation'),
    { type: 'text', text: 'The method is the bundle method with one extra loop: if the first replica fails, look for another one. Four moves for the weighted version, one more for spreads.' },
    { type: 'steps', steps: [
      { say: 'Run the obvious hedge first: the card against its own legs. On a hidden board it fails, because each leg is wide.', why: 'It is one addition, and on most boards it is the answer, so it always comes first.',
        checks: [{ make: legHedgeQ }] },
      { say: 'List the other exact replicas: any cards whose contents add up to the card. 2A + B = (A + B) + A = 2 × (A + B) − B.', why: 'A hedge is any set of trades with the same contents; there is usually more than one.',
        checks: [mc({ q: 'Which of these is also an exact replica of 2A + B?', right: '2 × (A + B) − B', wrong: [['2 × (A + B) − A', 'that is A + 2B'], ['(A + B) + 2A', 'that is 3A + B'], ['(A + B) − B + A', 'that is 2A']], explain: '2A + 2B minus one B leaves 2A + B.' })] },
      { say: 'Price each replica on the traded side. The one crossing the fewest wide spreads is cheapest to buy (or fetches the most when sold).', why: 'Every card costs half its spread against its mid; tight cards cost almost nothing.',
        checks: [{ make: bundleHedgeQ }] },
      { say: 'Trade the card against its cheapest replica if the edge is positive, then read the net row.', why: 'Card and replica cancel product by product; any replica that pays solves the board.',
        checks: [{ hinge: true, make: packageQ }] },
      { say: 'Spread cards work the same way: A − C = (A − B) + (B − C). Buy (or sell) both spreads against the card.', why: 'B enters once with + and once with −, so it cancels.',
        checks: [mc({ q: 'Which spread trades copy buying one A − C?', right: 'Buy A − B, buy B − C', wrong: [['Buy A − B, sell B − C', 'that is A − 2B + C: the B terms add instead of cancelling'], ['Sell A − B, sell B − C', 'that copies selling A − C'], ['Buy A − B only', 'leaves −B open and C untouched']], explain: '(A − B) + (B − C) = A − C.' })] },
    ] },
    { type: 'explain', prompt: 'Why does hedging 2A + B with A + B and one A beat hedging it with two A and one B on these boards?', model: 'Both replicas hold exactly 2A + B, so both are flat. The leg replica crosses three wide spreads (A twice, B once); the bundle replica crosses the tight A + B spread and one wide A spread. Crossing less spread means a cheaper replica, so its edge is bigger and here it is the only positive one.', points: ['Both are exact replicas: same contents, both flat', 'Cost = what you pay in spreads against the mids', 'Tight bundles replace wide legs and cut that cost'] },

    sec('worked'),
    { type: 'text', text: 'An expert solves the challenge board at exam pace first. Watch the order: one glance at the leg hedge, then straight to the replica that uses the tight bundle. The first live board after it is a 2A + B board; the second can be either version, 2A + B or a spread A − C next to A − B and B − C.' },
    { type: 'thinkaloud', problem: `Board (bid / ask): ${boardText([A, B, AB, W])}.`, lines: [
      { t: 0, say: 'Wide singles, a tight A + B, and 2A + B. Leg hedge first, then the bundle hedge.' },
      { t: 4, say: `Legs at the asks: 2 × ${px(A.ask)} + ${px(B.ask)} = ${px(buyCost(viaLegs))} against bid ${px(W.bid)}. Fails. Other side fails too: quote sits inside the legs' range.` },
      { t: 9, say: `2A + B = (A + B) + A. Cost ${px(AB.ask)} + ${px(A.ask)} = ${px(buyCost(viaAB))}.` },
      { t: 13, say: `${px(W.bid)} beats ${px(buyCost(viaAB))} by ${px(edgeSell(W, viaAB))}. Sell 2A + B, buy A + B, buy A.` },
      { t: 18, say: `Net: A −2 + 1 + 1 = 0, B −1 + 1 = 0. Cash +${px(outcome(pkg, 2).cash)}. Submit.` },
    ] },
    { type: 'check', scope: 'the same method on a fresh board', questions: [{ make: bundleHedgeQ }] },
    { type: 'worked', section: 'ob', family: 'hidden', difficulty: 4, seed: 'a', intro: '2A + B against A + B and A. Try the leg hedge, see it fail, then find the bundle hedge.' },
    { type: 'worked', section: 'ob', family: 'hidden', difficulty: 5, seed: 'b', fade: 4, intro: 'Either version can appear here. The failed leg hedge is shown; finding the other replica, the decision and the taps are yours.' },

    sec('predict'),
    { type: 'predict', question: `Board: ${boardText([A3, B3, AB3, W3])}. Predict: which hedges of buying 2A + B pay, and which pays more?`, answer: `Both. Selling the legs raises ${px(sellValue(legs3))}: +${px(edgeBuy(W3, legs3))}. Selling (A + B) + A raises ${px(sellValue(rep3))}: +${px(edgeBuy(W3, rep3))}. Either solves the board; the bundle hedge pays more because it crosses less spread.`, explain: 'Any flat package with positive cash counts. The trainer\'s solution shows the most profitable single package.' },

    sec('traps'),
    { type: 'traps', section: 'ob', family: 'hidden', extra: [
      { belief: 'If the card fails against its legs, the board has no trade.', fix: 'Look for a replica that uses another bundle; wide legs are the hint.' },
      { belief: 'Hedge 2A + B with A + B alone.', fix: 'A + B holds one A; add a second A or you are short A.' },
      { belief: '(A − B) − (B − C) = A − C.', fix: 'It is A − 2B + C. The spreads must be added so B cancels.' },
      { belief: 'If two hedges pay, one of them must be wrong.', fix: 'Both are flat and profitable, so either solves; the tighter one earns more.' },
    ] },
    { type: 'erroneous', problem: `A candidate works on ${boardText([As, Bs, Cs, AmB, BmC, AmC])}. One step is wrong.`, steps: [
      `Against its legs A − C costs ask(A) − bid(C) = ${px(As.ask)} − ${px(Cs.bid)} = ${px(buyCost(sLegs))}, above the bid ${px(AmC.bid)}: no.`,
      'Build A − C from the spreads instead: (A − B) − (B − C).',
      'So sell A − C, buy A − B, sell B − C.',
      'Submit.',
    ], errorStep: 1, explain: `(A − B) − (B − C) = A − 2B + C. The written trades end at ${posText(['A', 'B', 'C'], outcome(sWrong, 3).net)}: not flat, and the submit costs ${PENALTY} seconds. The right replica is (A − B) + (B − C): buy both spreads for ${px(buyCost(sRep))} and sell A − C at ${px(AmC.bid)}, +${px(outcome(sPkg, 3).cash)}.` },
    { type: 'check', scope: 'adding spreads so B cancels', questions: [{ make: spreadsEdgeQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'The tell is visible before any arithmetic: single products with spreads of several points and bundles quoted a tick wide. When you see it, skip straight to the bundle hedge after one glance at the leg sum.' },
    { type: 'callout', tone: 'speed', text: 'Any replica that pays solves the board. Do not spend seconds proving you found the best one; take the first positive edge, check the net row, submit.' },
    { type: 'check', scope: 'the bundle hedge at speed', questions: [{ make: packageQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Leg hedge fails on wide legs → rebuild the card from tight bundles, 2A + B = (A + B) + A, A − C = (A − B) + (B − C); trade against the cheapest replica with a positive edge.' },

    sec('contrast'),
    { type: 'compare', columns: ['Board', 'Why the plain hedge is not used', 'Replica'], rows: [
      ['Weighted 2A + B', 'it works: legs are tight', 'A + A + B'],
      ['Chain B + C', 'no B card exists', 'C + (A + B) − A'],
      ['Hidden 2A + B', 'legs exist but are wide', '(A + B) + A'],
      ['Hidden A − C', 'legs exist but are wide', '(A − B) + (B − C)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases. When both hedges pay, either is a correct submission; the bundle hedge usually earns more. A bundle replica whose edge is exactly 0 does not count. On a spread board, check each spread card against the other two before building anything.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: real desks hedge a position with whatever instrument is cheapest to trade, often a liquid index future instead of its many thinly traded parts. The replica is chosen by cost, not by how obvious it is.' },
    { type: 'check', scope: 'choosing between hedges', questions: [
      mc({ q: `Board: ${boardText([A3, B3, AB3, W3])}. Which submission solves it?`, right: 'Either package: buying 2A + B against the legs or against (A + B) + A', wrong: [['Only the bundle hedge: the leg hedge is wrong', `the leg hedge is flat with cash +${px(edgeBuy(W3, legs3))}, which also counts`], ['Only the leg hedge: bundle hedges are not allowed', 'any cards can form a replica'], ['Neither: the edges are too small', 'any positive cash counts']], explain: `Leg hedge +${px(edgeBuy(W3, legs3))}, bundle hedge +${px(edgeBuy(W3, rep3))}: both flat and positive.` }),
    ] },
    { type: 'variation', base: `Base: ${boardText([A, B, AB, W])}. Sell 2A + B against (A + B) + A: +${px(edgeSell(W, viaAB))}; the leg hedge gives ${px(edgeSell(W, viaLegs))}.`, rows: [
      { change: `A narrows to ${quote(An)}`, effect: `Both hedges now pay: legs ${px(edgeSell(W, [part(An, 2), part(B, 1)]))}, bundle hedge ${px(edgeSell(W, [part(AB, 1), part(An, 1)]))}. Either solves; the bundle hedge still pays more.` },
      { change: `B widens to ${quote(Bw)}`, effect: `Nothing for the bundle hedge: it never touches B. Profit stays ${px(edgeSell(W, viaAB))}.` },
      { change: `A + B's ask rises to ${px(ABup.ask)}`, effect: `The bundle replica now costs ${px(buyCost([part(ABup, 1), part(A, 1)]))}: edge ${px(edgeSell(W, [part(ABup, 1), part(A, 1)]))}, no trade.` },
      { change: `2A + B's ask rises to ${px(Wask.ask)}`, effect: `Nothing: selling 2A + B uses its bid. Profit stays ${px(edgeSell(Wask, viaAB))}.` },
    ] },

    sec('tryit'),
    { type: 'tryit', section: 'ob', family: 'hidden', count: 3 },
  ],
};
