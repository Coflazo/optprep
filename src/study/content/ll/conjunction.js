// Likelihood List family: two-way tables and subset logic (the Linda problem).
// Four cells answer every statement; containment orders AND, single and OR for free,
// and a conditional keeps the cell but shrinks the denominator. Every number is computed here.
import { S, LL, fr, dp, mc, rank, again } from './compare-without-computing.js';

// Worked table: A = plays chess, B = trader.
const T = { ab: 18, aNb: 22, Nab: 12, NaNb: 48 };
T.tot = T.ab + T.aNb + T.Nab + T.NaNb; T.A = T.ab + T.aNb; T.B = T.ab + T.Nab; T.or = T.tot - T.NaNb;
const P = { A: T.A / T.tot, B: T.B / T.tot, AB: T.ab / T.tot, or: T.or / T.tot, none: T.NaNb / T.tot, BgA: T.ab / T.A, AgB: T.ab / T.B };

// A fresh table for the checks: cells chosen so every statement is distinct.
const cells = (rng) => { const ab = rng.int(4, 30), aNb = rng.int(4, 30), Nab = rng.int(4, 30), NaNb = rng.int(4, 30); const tot = ab + aNb + Nab + NaNb; return { ab, aNb, Nab, NaNb, tot, A: ab + aNb, B: ab + Nab }; };
const say = (c) => `${c.tot} attendees: ${c.ab} play chess and trade, ${c.aNb} play chess only, ${c.Nab} trade only, ${c.NaNb} do neither.`;
const AgB = T.ab / T.B, TA = { a: 4, b: 9, c: 14, d: 22, e: 30, end: 36 };
// The think-aloud and variation prose states these orders; fail loudly if the table changes.
if (!(AgB > P.or && P.or > P.A && P.none > P.A && T.ab * T.tot > T.or * T.B)) throw new Error('conjunction: prose orders no longer hold');

// Transfer: near = the same table with a new surface; far = a deck of cards (no table at all).
const nearT = (rng) => again(() => { const c = cells(rng); return rank(rng, `${c.tot} clients: ${c.ab} use both the app and the website, ${c.aNb} the app only, ${c.Nab} the website only, ${c.NaNb} neither. Rank from most to least likely.`, [
  ['A randomly chosen client uses the app.', c.A / c.tot],
  ['A randomly chosen client uses the app and the website.', c.ab / c.tot],
  ['A randomly chosen website user also uses the app.', c.ab / c.B],
], `"App and website" sits inside "app" over the same ${c.tot} clients. The conditional keeps the ${c.ab} but divides by the ${c.B} website users: ${dp(c.ab / c.B, 2)} against ${dp(c.A / c.tot, 2)} for the app.`, { gap: 0.02 }); });
const farT = (rng) => { const r = rng.pick(['jack', 'queen', 'king']), [sub, k] = rng.pick([[`a red ${r}`, 2], [`a black ${r}`, 2], [`the ${r} of hearts`, 1], [`the ${r} of spades`, 1]]);
  return rank(rng, 'One card is drawn from a shuffled 52-card deck. Rank from most to least likely.', [
    [`It is a ${r}.`, 4 / 52], [`It is ${sub}.`, k / 52], [`Given that it is a face card (J, Q or K), it is a ${r}.`, 4 / 12],
  ], `"${sub}" sits inside "a ${r}" (${k}/52 against 4/52). The conditional keeps the 4 ${r}s but divides by the 12 face cards: 4/12.`); };

export default {
  id: 'll/conjunction',
  book: 'll',
  kind: 'family',
  family: 'conjunction',
  title: 'Two-way tables and subset logic',
  summary: 'AND ≤ each part ≤ OR by containment; a conditional keeps the cell and divides by its row.',
  prerequisites: ['ll/compare-without-computing', 'prob/inclusion-exclusion', 'prob/conditional-bayes'],
  objectives: [
    'Name the cell or cells behind any statement about a 2 × 2 table in a few seconds',
    'Order AND, single and OR statements with no arithmetic, and say why the story does not matter',
    'Compute a conditional as cell / row total and tell it apart from the joint probability',
    'Decide which pair still needs a count and settle it by cross-multiplying',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a table counts ${T.tot} conference attendees by two traits. ${T.ab} play chess and are traders, ${T.aNb} play chess but are not traders, ${T.Nab} are traders who do not play chess, ${T.NaNb} are neither. Rank from most to least likely: (a) a random attendee plays chess, (b) a random attendee plays chess and is a trader, (c) a random chess player is a trader. Two approaches, then an order.`, answer: `(c) ${fr(T.ab, T.A)} > (a) ${fr(T.A, T.tot)} > (b) ${fr(T.ab, T.tot)}`, explain: `(b) sits inside (a), so (a) > (b) with no arithmetic. (c) uses the same ${T.ab} as (b) but picks from the ${T.A} chess players only: ${dp(P.BgA, 2)}, which even beats (a) at ${dp(P.A, 2)}. If you put (c) near (b), you divided by everyone: the lesson names that exact step.`,
      attempts: [
        { id: 'story', label: 'Rank by the story', approach: 'You put (b) above (a) because a chess-playing trader sounds like a typical attendee.', breaksAt: '(b) is a subset of (a): adding "and is a trader" can only remove people, whatever the story.' },
        { id: 'everyone', label: 'Divide everything by everyone', approach: `You scored (c) as ${T.ab}/${T.tot}, the same as (b).`, breaksAt: `(c) picks from the ${T.A} chess players only, so its denominator is the chess row, not all ${T.tot}.` },
        { id: 'shrinks', label: 'A condition always lowers it', approach: 'You put (c) below (a) because an extra condition should make any statement less likely.', breaksAt: 'The condition shrinks the total as well as the count, so against a single trait no rule decides: you compute.' },
      ] },
    { type: 'text', text: 'The prompt shows a **2 × 2 table**: a population counted by two yes/no traits (plays chess or not, trader or not). One person is picked at random, sometimes from a subgroup. The statements are built from the traits: one trait, both (**and**), either (**or**), **neither**, or "a randomly chosen X who is also Y" (a **conditional**).' },
    { type: 'list', items: ['"A randomly chosen attendee plays chess and is a trader." (both)', '"A randomly chosen attendee plays chess or is a trader (or both)." (either)', '"A randomly chosen attendee who plays chess is also a trader." (conditional)'] },
    { type: 'text', text: 'Not this lesson: a table with one row per person and several scores (score tables), a list of match results (football), or the same counts drawn as grouped bars (survey bar charts). Those reuse the ideas here with a different picture.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Which statement is a conditional?', '"A randomly chosen trader plays chess."', [
        ['"A randomly chosen attendee is a trader who plays chess."', 'this is the joint "trader and chess" over everyone: the scope is all attendees'],
        ['"A randomly chosen attendee plays chess or trades."', 'an OR statement over everyone'],
        ['"A randomly chosen attendee does neither."', 'the neither cell over everyone'],
      ], '"A randomly chosen trader" restricts the pick to traders: the scope is the trader total.', { at: 2 }),
    ] },

    S('why'),
    { type: 'text', text: 'This is the conjunction fallacy in table form, the most common reasoning error in ranking tasks: a detailed statement feels more likely than a plain one that contains it. The fix costs nothing (containment orders most of the triple), and the one statement that needs arithmetic (a conditional) needs a single division. Get both right and these items take 20 seconds. The same two ideas, containment and scope, carry every other table and chart family in this book, so this is the lesson to make automatic first.' },

    S('anchor'),
    { type: 'text', text: 'You know the Venn diagram for two events: A only, B only, both, neither, and P(A or B) = P(A) + P(B) − P(A and B). A 2 × 2 table is the **same four regions** with one change: the table hands you each region as a cell count, so every statement is a sum of cells over a total.' },
    { type: 'check', scope: 'four cells = four Venn regions', questions: [
      { make: (rng) => { const c = cells(rng); return { type: 'number', q: `${say(c)} How many play chess or trade (or both)?`, answer: c.tot - c.NaNb, hints: ['Which single cell is outside "chess or trade"?', 'Everyone minus the neither cell.'], explain: `Everyone except the ${c.NaNb} who do neither: ${c.tot} − ${c.NaNb} = ${c.tot - c.NaNb}. The addition rule gives the same: ${c.A} + ${c.B} − ${c.ab}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Add a total row and a total column to the table. Row totals are the single trait A (chess), column totals the single trait B (trader), the corner is everyone.' },
    { type: 'diagram', diagram: 'table', spec: { caption: `${T.tot} attendees`, columns: ['', 'Trader', 'Not a trader', 'Total'], rows: [['Plays chess', T.ab, T.aNb, T.A], ['No chess', T.Nab, T.NaNb, T.Nab + T.NaNb], ['Total', T.B, T.aNb + T.NaNb, T.tot]] }, caption: `Read denominators off the margins: everyone ${T.tot}, chess players ${T.A}, traders ${T.B}. Read numerators off the cells.` },
    { type: 'check', scope: 'reading the margins', questions: [
      mc(null, 'For "a randomly chosen trader plays chess", which two numbers do you divide?', `${T.ab} / ${T.B}`, [
        [`${T.ab} / ${T.tot}`, 'divided by everyone: that is the joint "trader and chess", not "among traders"'],
        [`${T.ab} / ${T.A}`, 'divided by the chess players: that is "a chess player is a trader", the other direction'],
        [`${T.B} / ${T.tot}`, 'that is P(trader), with no chess condition at all'],
      ], `Cell ${T.ab} (both) over the trader column total ${T.B}: ${dp(P.AgB, 2)}.`, { at: 1 }),
    ] },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['plays chess', 'trader'], regions: { A: T.aNb, B: T.Nab, AB: T.ab, none: T.NaNb }, total: T.tot }, caption: `The same table as a Venn diagram. The lens (${T.ab}) is "chess and trader"; the chess circle (${T.aNb} + ${T.ab}) contains it; the union (everything but the ${T.NaNb} outside) contains the circle. That nesting is the whole ordering.` },
    { type: 'check', scope: 'nesting in the Venn diagram', questions: [
      mc(null, 'For every possible table, which statement can never be more likely than "plays chess"?', '"plays chess and is a trader"', [
        ['"is a trader"', 'the two circles are not nested: either can be larger, depending on the counts'],
        ['"plays chess or is a trader"', 'reversed: the union contains the chess circle, so it is at least as likely'],
        ['"a randomly chosen trader plays chess"', 'a conditional changes the denominator, so it can beat "plays chess" (it does in this table)'],
      ], 'The lens sits inside the chess circle, in every table.', { at: 0 }),
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Every statement from one table', xLabel: 'statement', yLabel: 'probability', categories: ['chess and trader', 'trader', 'chess', 'neither', 'chess or trader', 'trader | chess'], series: [{ name: 'P', values: [P.AB, P.B, P.A, P.none, P.or, P.BgA].map((x) => Number(x.toFixed(3))) }] }, caption: `The five statements over everyone climb from the lens (${dp(P.AB, 2)}) to the union (${dp(P.or, 2)}). The conditional "trader | chess" (${dp(P.BgA, 2)}) uses the lens count but a smaller total, so it jumps over "chess" (${dp(P.A, 2)}).` },
    { type: 'check', scope: 'where the conditional lands', questions: [
      mc(null, `In the chart, P(trader | chess) = ${dp(P.BgA, 2)} is larger than P(trader and chess) = ${dp(P.AB, 2)}. Is that true for every table?`, 'Yes: same cell, smaller total', [
        ['No: it depends on the counts', 'mixed it up with conditional against single trait, which does depend on the counts'],
        ['Only when more than half play chess', 'the size of the chess group only changes by how much, never the direction'],
      ], `Both have the lens count on top; the conditional divides by ${T.A}, the joint by ${T.tot} ≥ ${T.A}.`, { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'The method for every item of this type, built from the Venn picture: name the cells behind each statement, let containment order everything that is nested, then spend your one division on the conditional. Four moves; each has its own check before the next opens.' },
    { type: 'steps', steps: [
      { say: 'Name each statement by its cells: one trait is a row or column total, AND is the one lens cell, OR is three cells (everyone but neither), neither is one cell.', why: 'Once the cells are named, the numerator is a lookup, and containment between statements is visible as "these cells are a subset of those".',
        checks: [mc(null, '"A random attendee plays chess or is a trader" covers how many of the four cells?', '3', [['2', 'counted only the two "one trait only" cells and dropped the lens'], ['4', 'included the neither cell, which has neither trait'], ['1', 'confused OR with AND']], 'Chess only, trader only, and both: everything except neither.', { at: 1 })] },
      { answers: 'story', say: 'Order the nested statements with no arithmetic: AND ⊂ single trait ⊂ OR, so P(AND) ≤ P(single) ≤ P(OR).', why: 'Adding a condition (AND) can only remove people; allowing an alternative (OR) can only add them. A story about the person changes no counts.',
        checks: [{ make: (rng) => again(() => { const c = cells(rng); return rank(rng, `${say(c)} Rank without computing: from most to least likely for a random attendee.`, [['Plays chess.', c.A / c.tot], ['Plays chess and trades.', c.ab / c.tot], ['Plays chess or trades.', (c.tot - c.NaNb) / c.tot]], 'OR contains the single trait, which contains AND.'); }) }] },
      { answers: 'everyone', say: 'A conditional "a random chess player is a trader" keeps the lens count but divides by the chess total: P(trader | chess) = lens / chess row.', why: 'The pick is made among chess players only, so the scope, and with it the denominator, shrinks to that row.',
        checks: [{ make: (rng) => { const c = cells(rng); return { type: 'number', q: `${say(c)} A randomly chosen chess player is picked. P(they trade)? (2 decimals)`, answer: c.ab / c.A, tolerance: 0.006, hints: ['Numerator: players who also trade.', `Denominator: all chess players, ${c.ab} + ${c.aNb}.`], explain: `${c.ab} / ${c.A} = ${dp(c.ab / c.A, 2)}.` }; } }] },
      { answers: 'shrinks', say: 'Compare the conditional with the joint for free (it always wins or ties), but against a single trait you must compute: cross-multiply the two fractions.', why: 'Same numerator, smaller denominator gives P(B | A) ≥ P(A and B). Against P(A) or P(B) the numerators differ, so no containment decides it.',
        checks: [{ make: (rng) => again(() => { const c = cells(rng); const bga = c.ab / c.A, pb = c.B / c.tot; if (Math.abs(bga - pb) < 0.03) return null; return mc(rng, `${say(c)} Which is larger: P(trader | chess) or P(trader)?`, bga > pb ? 'P(trader | chess)' : 'P(trader)', [[bga > pb ? 'P(trader)' : 'P(trader | chess)', 'assumed a fixed direction: a conditional can land on either side of the plain probability'], ['They are always equal', 'that holds only when the two traits are independent']], `${c.ab}/${c.A} = ${dp(bga, 2)} against ${c.B}/${c.tot} = ${dp(pb, 2)}.`, { hints: ['Compute both fractions.', 'Cross-multiply to compare.'] }); }) }] },
    ] },
    { type: 'explain', prompt: 'Explain why "a random chess player is a trader" can beat "a random attendee plays chess", while "a random attendee plays chess and trades" never can.', model: 'The joint "chess and trades" is a subset of "plays chess", so its count is smaller over the same total of everyone. The conditional uses that same subset count but divides only by the chess players, a smaller total, so it can be large; it is a different population, not a subset over the same one, so containment says nothing about it against the plain chess fraction.', points: ['AND is a subset of the single trait over the same denominator', 'A conditional keeps the numerator and shrinks the denominator to the subgroup', 'Containment orders statements only when they share a denominator'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'conjunction', difficulty: 1, seed: 'a', explainAt: [0, 1], intro: 'Single, AND and OR: the order should come from containment alone. Commit to an order before opening the solution.' },
    { type: 'worked', section: 'll', family: 'conjunction', difficulty: 3, seed: 'b', fade: 1, intro: 'A conditional or a neither statement is mixed in. The cell counts are given; the final ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'Sam, picked at random from the staff, is quiet and loves puzzles. Which is more likely: "Sam is a trader" or "Sam is a trader who plays chess"? Does the description change your answer?', answer: '"Sam is a trader." Adding "plays chess" can only remove possibilities, and the description changes no counts.', explain: 'The Linda problem: plausibility is not probability.' },

    S('traps'),
    { type: 'traps', section: 'll', family: 'conjunction', extra: [
      { belief: 'A detailed story makes "trader who plays chess" more likely than "trader".', fix: 'The detailed statement is a subset of the plain one. Stories change how typical it feels, not which people it contains.' },
      { belief: '"Chess or trader" is P(chess) + P(trader).', fix: 'The lens is inside both: adding counts it twice. OR = everyone minus the neither cell.' },
      { belief: '"A random chess player is a trader" is the same as "a random attendee plays chess and trades".', fix: 'Same cell, different totals: the conditional divides by the chess row, the joint by everyone.' },
      { belief: 'P(trader | chess) = P(chess | trader).', fix: 'The lens is divided by the row total in one and the column total in the other.' },
    ] },
    { type: 'erroneous', problem: `A candidate ranks three statements about the table of ${T.tot} attendees (${T.ab} both, ${T.aNb} chess only, ${T.Nab} trader only, ${T.NaNb} neither). One step is wrong.`, steps: [
      `"Chess or trader": everyone except the neither cell, ${T.or}/${T.tot} = ${dp(P.or, 2)}.`,
      `"Plays chess": the chess row, ${T.A}/${T.tot} = ${dp(P.A, 2)}.`,
      `"A random chess player is a trader": the both cell, ${T.ab}/${T.tot} = ${dp(P.AB, 2)}.`,
      'Order: chess or trader > plays chess > chess player who is a trader.',
    ], errorStep: 2, explain: `The conditional picks among the ${T.A} chess players, so it is ${T.ab}/${T.A} = ${dp(P.BgA, 2)}, not ${T.ab}/${T.tot}. The right order is chess or trader (${dp(P.or, 2)}) > trader among chess players (${dp(P.BgA, 2)}) > plays chess (${dp(P.A, 2)}).` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, `A candidate writes P(trader | chess) = ${dp(P.AB, 2)} for this table. What went wrong?`, 'Divided the right cell by everyone instead of by the chess players', [
        ['Used the wrong cell', `the cell is right: ${T.ab} chess players trade`],
        ['Should have added the chess row and the trader column', 'that builds the OR count, not a conditional'],
        ['Nothing: the joint and the conditional are equal', 'they share a numerator but not a denominator'],
      ], `${T.ab}/${T.A} = ${dp(P.BgA, 2)}.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'OR is one subtraction: everyone minus the neither cell. Neither is one cell. AND is one cell. Only conditionals need a division.' },
    { type: 'callout', tone: 'speed', text: 'Run containment first and you usually have two of the three placed before any arithmetic. For the last pair (typically a conditional against a single trait), cross-multiply: cell × total against row × column total.' },
    { type: 'check', scope: 'one-cell reads and cross-multiplying', questions: [
      { make: (rng) => { const c = cells(rng); return { type: 'number', q: `${say(c)} What is P(a random attendee does neither)? (2 decimals)`, answer: c.NaNb / c.tot, tolerance: 0.006, hints: ['Neither is a single cell.'], explain: `${c.NaNb}/${c.tot} = ${dp(c.NaNb / c.tot, 2)}, which is also 1 − P(chess or trader).` }; } },
      { make: (rng) => again(() => { const c = cells(rng); const x = c.ab * c.tot, y = c.A * c.B; if (x === y) return null; return mc(rng, `${say(c)} Compare P(trader | chess) = ${c.ab}/${c.A} with P(trader) = ${c.B}/${c.tot} by cross-multiplying. Which is larger?`, x > y ? 'P(trader | chess)' : 'P(trader)', [[x > y ? 'P(trader)' : 'P(trader | chess)', 'multiplied the wrong pairs, or compared the numerators alone'], ['They are equal', `the cross-products ${x} and ${y} differ, so the fractions differ`]], `${c.ab} × ${c.tot} = ${x} against ${c.A} × ${c.B} = ${y}.`, { hints: ['a/b > c/d exactly when a × d > c × b.'] }); }) },
    ] },

    { type: 'thinkaloud', problem: `The same ${T.tot} attendees (${T.ab} both, ${T.aNb} chess only, ${T.Nab} trader only, ${T.NaNb} neither). Rank: (a) a random attendee plays chess, (b) a random attendee plays chess or trades, (c) a random trader plays chess.`, lines: [
      { t: 0, say: 'A 2 × 2 table and three statements: containment first, arithmetic last.' },
      { t: TA.a, say: `(b) is everyone but the ${T.NaNb} in neither, and it contains (a). So (b) above (a), free.` },
      { t: TA.b, say: '(c) is the chess-and-trader cell, so it sits inside (a) and goes last.', slip: true },
      { t: TA.c, say: `Wait: "a random trader" picks from the trader column. Same cell, but over ${T.B} traders, not ${T.tot}. That is a conditional; containment does not place it.` },
      { t: TA.d, say: `(c) = ${T.ab}/${T.B} = ${dp(AgB, 2)}. (a) = ${dp(P.A, 2)}, (b) = ${dp(P.or, 2)}. So (c) even beats the OR.` },
      { t: TA.e, say: `Close pair, so cross-multiply (c) against (b): ${T.ab} × ${T.tot} = ${T.ab * T.tot} against ${T.or} × ${T.B} = ${T.or * T.B}. (c) stays on top.` },
      { t: TA.end, say: `Order (c) > (b) > (a), with ${LL.exam.perItemSeconds - TA.end} of the ${LL.exam.perItemSeconds} seconds left.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine on a fresh table', questions: [
      { make: (rng) => again(() => { const c = cells(rng); return rank(rng, `${say(c)} Rank from most to least likely.`, [['A randomly chosen attendee plays chess.', c.A / c.tot], ['A randomly chosen attendee plays chess or trades.', (c.tot - c.NaNb) / c.tot], ['A randomly chosen trader plays chess.', c.ab / c.B]], `OR ${c.tot - c.NaNb}/${c.tot} contains chess ${c.A}/${c.tot}. The conditional is ${c.ab}/${c.B} = ${dp(c.ab / c.B, 2)}: compare it by value, not by containment.`, { gap: 0.02 }); }) },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: '2 × 2 table → AND ≤ single ≤ OR by containment (no arithmetic); OR = total − neither; conditional = cell / its row or column total, always ≥ the joint, computed against anything else.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Numerator', 'Denominator', 'Free comparison'], rows: [
      ['A and B', 'the lens cell', 'everyone', 'below A, below B'],
      ['A', 'the A row total', 'everyone', 'between AND and OR'],
      ['A or B', 'everyone − neither', 'everyone', 'above A, above B'],
      ['neither', 'one cell', 'everyone', '1 − P(A or B)'],
      ['B among A', 'the lens cell', 'the A row total', 'above A and B; anything else: compute'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: if every trader plays chess (the "trader only" cell is 0), then P(trader and chess) = P(trader): containment gives equality, never a reversal. If the lens is 0, every conditional between the two traits is 0.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: score tables ("at least 70 in both" inside "at least 70 in Maths"), survey bar charts (these four cells drawn as bars), scatter plots (a corner region inside a strip) and card statements ("a red king" inside "a king") all use containment for the free order and the scope for the denominator.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'In some table, nobody is a trader without playing chess. Then P(trader and chess) compared with P(trader) is:', 'equal', [['smaller', 'forgot the edge case: when one trait implies the other, AND equals the smaller trait'], ['larger', 'AND can never exceed one of its parts'], ['impossible to say', 'the empty "trader only" cell settles it']], 'Every trader is in the lens, so the lens equals the trader column.', { at: 0 }),
    ] },

    { type: 'variation', base: `The ${T.tot} attendees. Rank "plays chess" (${T.A}), "plays chess and trades" (${T.ab}) and "plays chess or trades" (${T.or}), all over everyone: OR > chess > AND.`, rows: [
      { same: true, change: 'Add a story: the attendee is quiet and loves puzzles', effect: 'No change. The story moves nobody between cells, and containment gives OR > chess > AND for every table.' },
      { same: true, change: 'Double every cell of the table', effect: 'No change. Numerator and denominator of every statement double together, so every fraction keeps its value.' },
      { change: 'Replace "plays chess and trades" with "a random trader plays chess"', effect: `The cell stays ${T.ab} but the total drops to the ${T.B} traders: ${dp(AgB, 2)}. It jumps above "plays chess" (${dp(P.A, 2)}) and the OR (${dp(P.or, 2)}). Containment no longer places it; you compute.` },
      { change: 'Replace "plays chess or trades" with "does neither"', effect: `Neither is the complement of the OR, not a superset of anything: ${T.NaNb}/${T.tot} = ${dp(P.none, 2)}. Here it lands above "plays chess" (${dp(P.A, 2)}); only a count decides.` },
      { fusion: true, change: 'Pick from the traders only, and ask "plays chess or trades"', effect: `Each change alone leaves a count to do: the OR over everyone is ${dp(P.or, 2)}, a trader playing chess is ${dp(AgB, 2)}. Together, every one of the ${T.B} traders already trades, so the OR is certain: P = 1.` },
    ] },
    { type: 'transfer',
      near: { make: nearT },
      far: { make: farT },
      principle: mc(null, 'Which idea carried over from the attendee table to the deck of cards?', 'AND sits inside its part; a conditional keeps the count but shrinks the total', [
        ['A statement that fits the description better is the more likely one', 'the conjunction fallacy: how well a statement fits is not how many outcomes it contains'],
        ['Every statement is a count divided by the size of the whole population', 'forgot the scope: "given a face card" divides by the 12 face cards, not by 52'],
        ['Adding any condition to a statement can only make it less likely', 'true for AND over the same total; a conditional also shrinks the total, so it can rise'],
      ], 'Containment ordered the plain statements; the scope (row total, or the 12 face cards) set the conditional\'s denominator. Neither needed a table.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'conjunction', count: 3 },
  ],
};
