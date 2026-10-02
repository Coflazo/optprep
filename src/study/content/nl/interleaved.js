// NumberLogic family lesson: two interleaved sequences. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, ratios, polyDeg, allSame, nextQ, pick, num, arith, geo, quad, weave } from './method-ladder.js';

const g = (xs) => diffs(xs);
const odd = (xs) => xs.filter((_, i) => i % 2 === 0);
const even = (xs) => xs.filter((_, i) => i % 2 === 1);

const CHa = arith(3, 4, 4), CHb = arith(20, -3, 4), CH = weave(CHa, CHb, 7);
const E1 = weave(arith(2, 5, 4), arith(40, -6, 4), 7);
const E2 = weave(geo(3, 2, 4), arith(5, 3, 4), 7);
// The strand with growing gaps shows four terms; the strand that continues (three shown) stays simple.
const Q4a = quad(1, 2, 2, 4), Q4b = arith(30, -4, 4), Q4 = weave(Q4a, Q4b, 8);
const MISS = weave(arith(4, 3, 4), arith(25, -5, 4), 7);
const PRa = arith(5, 5, 4), PRb = geo(3, 3, 4), PR = weave(PRa, PRb, 7);
const ERa = arith(4, 3, 5), ERb = arith(30, -4, 5), ER = weave(ERa, ERb, 8);
const ALT = [2]; while (ALT.length < 6) ALT.push(ALT.length % 2 ? ALT[ALT.length - 1] + 3 : ALT[ALT.length - 1] * 2);
const QD = quad(2, 1, 2, 6);

// Two strands with distinct rules, the one that continues kept simple (as the generator does).
// Draws that happen to fit a single low-degree polynomial are repeated.
// Also repeated: lists where every term minus the sum of the two (or three) before it moves by a
// fixed step, a second reading the rule finder in src/sections/nl/solver.js accepts (4, 11, 8, 13, 16, 15).
const resid = (xs, k) => xs.slice(k).map((v, i) => v - xs.slice(i, i + k).reduce((a, b) => a + b, 0));
const twoFaced = (xs) => [2, 3].some((k) => { const r = resid(xs, k); return r.length >= 3 && allSame(diffs(r)); });
// A strand of gaps-growing-by-a-constant needs four visible terms to be checkable, so it only
// appears beside seven shown terms (as in the generator).
function draw(rng, n, kind = rng.int(0, n === 7 ? 2 : 1)) {
  for (;;) {
    const simple = rng.chance(0.5) ? { k: 'add', xs: arith(rng.int(1, 30), rng.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), 6) } : { k: 'mul', xs: geo(rng.int(1, 5), rng.pick([2, 3]), 6) };
    const other = kind === 0 ? { k: 'add', xs: arith(rng.int(1, 40), rng.pick([-6, -3, 2, 4, 8]), 6) } : kind === 1 ? { k: 'mul', xs: geo(rng.int(1, 4), 2, 6) } : { k: 'sq', xs: quad(rng.int(1, 10), rng.int(1, 5), rng.int(1, 3), 6) };
    // the next position is n + 1 (index n): it belongs to strand n % 2
    const [A, B] = n % 2 === 0 ? [simple, other] : [other, simple];
    const xs = weave(A.xs, B.xs, n + 3);
    if (A.k === B.k && A.xs[1] - A.xs[0] === B.xs[1] - B.xs[0]) continue;
    if (polyDeg(xs.slice(0, n)) >= 0 || twoFaced(xs.slice(0, n)) || new Set(xs.slice(0, n + 3)).size < n + 3 || xs.some((v) => Math.abs(v) < 3)) continue;
    return { xs, A, B, next: n % 2 === 0 ? A : B, other: n % 2 === 0 ? B : A };
  }
}
const word = { add: 'constant gap', mul: 'constant ratio', sq: 'gaps growing by a constant' };
const TAa = arith(5, 6, 4), TAb = geo(3, 2, 4), TA = weave(TAa, TAb, 8);
const E1a = arith(2, 5, 4), E1b = arith(40, -6, 4), E16 = E1.slice(0, 6);
const OTHER = weave(E1a, arith(50, -10, 4), 7), MORE = weave(E1a, E1b, 8), FAST = weave(arith(2, 10, 4), E1b, 7), SWAP = weave(E1b, E1a, 7), BOTH = weave(E1a, arith(50, -10, 4), 8);

export default {
  id: 'nl/interleaved',
  book: 'nl',
  kind: 'family',
  family: 'interleaved',
  title: 'Two sequences taking turns',
  summary: 'Neighbours unrelated or gaps zigzag → split odd and even positions, solve each strand, continue the strand whose turn it is.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic', 'nl/geometric'],
  objectives: [
    'Spot interleaving from zigzag gaps or unrelated neighbours',
    'Split a list into odd and even positions in seconds',
    'Decide which strand owns the next position from the number of shown terms',
    'Solve each strand with the earlier lessons and continue only the right one',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once reading neighbours, once reading every second term.`, answer: String(CH[6]), explain: `Neighbours give gaps ${seq(g(CH.slice(0, 6)))}: no single rule. Every second term: ${seq(CHa.slice(0, 3))} (add ${CHa[1] - CHa[0]}) and ${seq(CHb.slice(0, 3))} (subtract ${CHb[0] - CHb[1]}). Six terms are shown, so the next is position 7, on the first strand: ${CH[6]}.`,
      attempts: [
        { id: 'one-seq', label: 'Read it as one sequence', approach: `Took the gaps ${seq(g(CH.slice(0, 6)))} and tried to find one rule behind them.`, breaksAt: 'Every neighbour pair mixes the two strands, so no single rule survives the gaps.' },
        { id: 'halves', label: 'Split into halves', approach: `Split the list into its first three terms ${seq(CH.slice(0, 3))} and its last three ${seq(CH.slice(3, 6))}.`, breaksAt: 'The strands take turns rather than sitting side by side: positions 1, 3, 5 form one list and 2, 4, 6 the other.' },
        { id: 'last-strand', label: "Continue the last term's strand", approach: `The last term ${CH[5]} is on the falling strand, so continued it: ${CH[5]} − ${CHb[0] - CHb[1]} = ${CH[5] - (CHb[0] - CHb[1])}.`, breaksAt: `Six terms are shown, so the next is position 7, which is odd: the first strand moves, not the one ${CH[5]} sits on.` },
      ] },
    { type: 'text', text: 'Two separate sequences are written **alternately**: positions 1, 3, 5, … form one sequence and positions 2, 4, 6, … another. Neighbours then look unrelated and the gaps zigzag, but every second term follows a simple rule of its own.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(Q4.slice(0, 7))}, ?`] },
    { type: 'check', scope: 'the cue: every second term is regular', questions: [
      { make: (rng) => { const d = draw(rng, 6, 0), q = quad(rng.int(1, 20), rng.int(1, 5), rng.int(1, 3), 6), a = geo(rng.int(2, 5), 2, 6); return pick(rng, 'Which list is two sequences taking turns?', seq(d.xs.slice(0, 6)), [[seq(q), `its gaps ${seq(g(q))} grow steadily: one sequence`], [seq(a), 'every step doubles: one sequence']], `Odd positions ${seq(odd(d.xs.slice(0, 6)))}, even positions ${seq(even(d.xs.slice(0, 6)))}: each regular on its own.`); } },
    ] },
    { type: 'text', text: `Not this lesson: alternating **operations** such as ${seq(ALT)} (+3, ×2, +3, ×2), where each term is built from the one right before it. That zigzags too; the next lesson shows how to tell the two apart in one look.` },
    { type: 'check', scope: 'alternating operations', questions: [
      { type: 'choice', q: '2, 5, 10, 13, 26, 29: how is each term made?', options: ['from the term right before it', 'from the term two places back', 'from its position number'], answer: 0, traps: { 1: 'the zigzag comes from +3 and ×2 in turn, not from two strands', 2: 'each step uses the term before it, not the position' }, explain: '+3, ×2, +3, ×2: alternating operations, the next lesson.' },
    ] },

    S('why'),
    { type: 'text', text: 'Interleaving is how test writers make easy rules look hard, and it appears across the whole difficulty range, from two constant gaps early on to a squares strand beside a Fibonacci strand at the end. It is also the most common reason a clean rule "almost" fits: if a rule works on every other step and fails on the rest, split the list.' },

    S('anchor'),
    { type: 'text', text: 'You already solve single sequences. This family changes **one thing**: two of them take turns. Nothing new has to be solved; you only have to read the list in the right order and remember whose turn it is.' },
    { type: 'check', scope: 'reading every second term', questions: [
      { make: (rng) => { const d = draw(rng, 6), xs = d.xs.slice(0, 6); return pick(rng, `Read positions 1, 3, 5 of ${seq(xs)}. Which list do you get?`, seq(odd(xs)), [[seq(even(xs)), 'those are positions 2, 4, 6'], [seq(xs.slice(0, 3)), 'those are the first three terms, not every second one']], `Positions 1, 3, 5: ${seq(odd(xs))}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'The gap row of an interleaved list zigzags: big up, big down, or two sizes taking turns. Split the list into its two strands and each one is plain. The next term goes to the strand whose turn it is, which is not always the strand you noticed first.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1.slice(0, 6), 1) }, caption: `Gaps of ${seq(E1.slice(0, 6))}: ${seq(g(E1.slice(0, 6)))}. The signs alternate: neighbours belong to different sequences.` },
    { type: 'check', scope: 'alternating signs in the gaps', questions: [
      { type: 'choice', q: 'The gaps of a list read 38, −33, 27, −22, 16. What do the alternating signs say?', options: ['neighbours belong to different strands', 'the list is arithmetic after all', 'the terms double at every step'], answer: 0, traps: { 1: 'the gaps are not constant', 2: 'the gaps change sign; doubling keeps them one sign' }, explain: 'Up, down, up, down: each term sits in a different strand from its neighbour.' },
    ] },
    { type: 'diagram', diagram: 'strands', spec: { terms: E1.slice(0, 6), k: 2, labels: [`positions 1, 3, 5: add ${E1[2] - E1[0]}`, `positions 2, 4, 6: subtract ${E1[1] - E1[3]}`], next: E1[6] }, caption: `Split, each strand is a constant-gap sequence. Six terms shown, so the next is position 7 (odd): ${E1[4]} + ${E1[2] - E1[0]} = ${E1[6]}.` },
    { type: 'check', scope: 'whose turn it is', questions: [
      { make: (rng) => { const n = rng.pick([6, 7]), d = draw(rng, n), xs = d.xs.slice(0, n); return pick(rng, `${seq(xs)}, ? Which strand does the next term continue?`, n % 2 === 0 ? 'positions 1, 3, 5, …' : 'positions 2, 4, 6, …', [[n % 2 === 0 ? 'positions 2, 4, 6, …' : 'positions 1, 3, 5, …', `the next term is position ${n + 1}, which is ${n % 2 === 0 ? 'odd' : 'even'}`]], `${n} terms shown, so the next is position ${n + 1}.`); } },
    ] },
    { type: 'diagram', diagram: 'strands', spec: { terms: Q4.slice(0, 7), k: 2, labels: [`positions 1, 3, 5, 7: gaps ${seq(g(Q4a))}, growing by ${g(g(Q4a))[0]}`, `positions 2, 4, 6: subtract ${Q4b[0] - Q4b[1]}`], next: Q4[7] }, caption: `A harder pair: a strand whose gaps grow beside a falling strand. Seven terms shown, so position 8 is even and continues the falling strand: ${Q4b[2]} − ${Q4b[0] - Q4b[1]} = ${Q4[7]}. The growing strand only confirms the split.` },

    { type: 'check', scope: 'a harder pair', questions: [
      { make: (rng) => { const d = draw(rng, 7, 2), xs = d.xs.slice(0, 7); return num(nextQ(xs), d.xs[7], `Seven shown, so position 8 (even): ${seq(even(xs))} has a ${word[d.next.k]}, giving ${neg(d.xs[7])}. The odd strand ${seq(odd(xs))} has growing gaps but does not move next.`, ['Seven terms: which position is next?', 'Only the even-position strand matters.']); } },
    ] },
    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'one-seq', say: 'Look for the signal: gaps that zigzag (up, down, up, down) or take two alternating sizes, and neighbours that look unrelated.', why: 'Two sequences written alternately make every neighbour pair a mix of the two, so no single rule survives.',
        checks: [
          { make: (rng) => { const d = draw(rng, 6, 0), xs = d.xs.slice(0, 6); return pick(rng, `The gaps of ${seq(xs)} are ${seq(g(xs))}. What does that suggest?`, 'two sequences taking turns', [['gaps that change by a constant', `the gaps ${seq(g(xs))} jump back and forth; they do not change steadily`], ['a constant ratio', 'neighbour ratios are unrelated here']], 'Alternating gaps are the signal to split.'); } },
        ] },
      { answers: 'halves', say: 'Split: write positions 1, 3, 5, … as one list and 2, 4, 6, … as another.', why: 'Each strand is an ordinary sequence once read on its own.',
        checks: [
          { make: (rng) => { const d = draw(rng, 7), xs = d.xs.slice(0, 7); return num(`${seq(xs)}: what is the last term of the strand at even positions (2, 4, 6)?`, xs[5], `Even positions: ${seq(even(xs))}; the last is ${neg(xs[5])}.`); } },
        ] },
      { say: 'Solve each strand on its own with the earlier lessons: constant gap, constant ratio, gaps growing by a constant, or a two-term sum.', why: 'Nothing new: the strands are the families you already know.',
        checks: [
          { make: (rng) => { const n = 6, d = draw(rng, n, 0), s = d.next.xs; return num(`${seq(d.xs.slice(0, n))}: the strand at positions 1, 3, 5 is ${seq(s.slice(0, 3))}. What is its next term?`, s[3], `That strand has a ${word[d.next.k]}: next ${neg(s[3])}.`); } },
        ] },
      { answers: 'last-strand', say: 'Decide whose turn it is: with n terms shown, the next is position n + 1. Odd position → first strand; even position → second strand.', why: 'The strands alternate strictly, so the count of shown terms fixes the next strand. This is the step most people skip.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 7]), d = draw(rng, n), xs = d.xs.slice(0, n); return pick(rng, `${seq(xs)}, ? Which list continues?`, seq(n % 2 === 0 ? odd(xs) : even(xs)), [[seq(n % 2 === 0 ? even(xs) : odd(xs)), `the next term is position ${n + 1}, so it belongs to the other strand`]], `${n} terms shown: position ${n + 1} is ${n % 2 === 0 ? 'odd' : 'even'}.`); } },
        ] },
      { say: 'Continue that strand only.', why: 'The other strand does not move at this step; its next term is one position later.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 7]), d = draw(rng, n), xs = d.xs.slice(0, n); return num(nextQ(xs), d.xs[n], `Position ${n + 1} continues ${seq(n % 2 === 0 ? odd(xs) : even(xs))} (${word[d.next.k]}): ${neg(d.xs[n])}.`, ['Split odd and even positions.', `Which strand owns position ${n + 1}?`]); } },
        ] },
      { say: 'A blank in the middle belongs to the strand of its own position. Fill it from that strand and ignore the other.', why: 'The blank breaks only one strand; the other still confirms the split.',
        checks: [
          { make: (rng) => { const A = arith(rng.int(1, 9), rng.int(2, 6), 4), B = arith(rng.int(30, 60), -rng.int(3, 7), 4), xs = weave(A, B, 7), k = rng.int(3, 5); return num(`Which number replaces the question mark?  ${xs.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, xs[k], `The blank is position ${k + 1} (${k % 2 === 0 ? 'odd' : 'even'}), on the strand ${seq(k % 2 === 0 ? A : B)}: ${neg(xs[k])}.`, ['Which position is the blank?', 'Fill it from the strand of that parity.']); } },
        ] },
    ] },
    { type: 'text', text: 'At the hard end of the test, the strand that does **not** continue can be tougher: gaps that grow by a constant, or a strand in which each term adds the two before it in that strand. You rarely need its rule. The strand you continue stays simple, and the other only has to look regular enough to confirm the split. If the gaps zigzag and the continuing strand is clean, the split is right.' },
    { type: 'check', scope: 'the strand you continue', questions: [
      { type: 'choice', q: 'The gaps zigzag and the continuing strand is clean, but the other strand is hard to name. What do you do?', options: ['continue the clean strand', 'solve the hard strand first', 'drop the split entirely'], answer: 0, traps: { 1: 'you rarely need the other strand rule', 2: 'a zigzag and a clean strand confirm the split' }, explain: 'Only the strand whose turn it is needs a rule.' },
    ] },
    { type: 'explain', prompt: 'Why do neighbours look unrelated in an interleaved list, and why does the number of shown terms decide which strand continues?', model: 'Each neighbour pair takes one term from each strand, so their gap mixes two different rules and follows neither. The strands alternate strictly, so the next position n + 1 has a fixed parity: odd goes to the first strand, even to the second.', points: ['Every neighbour pair mixes the two strands', 'Every second term belongs to one strand', 'Position n + 1: odd → strand 1, even → strand 2'] },

    S('worked'),
    { type: 'worked', family: 'interleaved', section: 'nl', difficulty: 2, seed: 'a', explainAt: [0, 2], intro: 'Two constant-gap strands. Split and pick the strand before opening the solution.' },
    { type: 'worked', family: 'interleaved', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'One strand has growing gaps. The split is given; continuing the right strand is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PR.slice(0, 6))}, ? Which strand is next, and what is the term?`, answer: `Six terms shown, so position 7 (odd): the strand ${seq(PRa.slice(0, 3))} adds ${PRa[1] - PRa[0]}, giving ${PR[6]}. The other strand (${seq(PRb.slice(0, 3))}, ×3) would give ${PRb[3]} at position 8.`, explain: 'The tempting answer is the bigger, more striking strand. Parity decides, not size.' },

    S('traps'),
    { type: 'traps', family: 'interleaved', section: 'nl', extra: [
      { belief: 'The last shown term decides the strand, so continue its strand.', fix: 'The last term is the other strand. The next position is n + 1; its parity decides.' },
      { belief: 'The whole list is one sequence, so repeat the last gap.', fix: 'Neighbours belong to different strands; their gap means nothing.' },
      { belief: 'The strand is right, so any rule that fits two terms will do.', fix: 'Check the strand rule on all its terms: add or multiply is decided by the whole strand.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ER.slice(0, 7))}, ?. One step is wrong.`, steps: [
      `Odd positions: ${seq(odd(ER.slice(0, 7)))} (add ${ERa[1] - ERa[0]}).`,
      `Even positions: ${seq(even(ER.slice(0, 7)))} (subtract ${ERb[0] - ERb[1]}).`,
      `The last shown term ${ER[6]} is on the odd strand, so the next term continues it: ${ER[6]} + ${ERa[1] - ERa[0]} = ${ER[6] + ERa[1] - ERa[0]}.`,
      `Answer: ${ER[6] + ERa[1] - ERa[0]}.`,
    ], errorStep: 2, explain: `Seven terms are shown, so the next is position 8: even. It continues ${seq(even(ER.slice(0, 7)))}, giving ${ER[7]}. The last shown term is exactly the strand that does **not** move next.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const n = rng.pick([6, 7]), d = draw(rng, n), xs = d.xs, l = xs[n - 1]; return pick(rng, nextQ(xs.slice(0, n)), xs[n], [[xs[n + 1], 'continued the wrong strand: that is the other strand\'s next term'], [l + (l - xs[n - 2]), 'treated the list as one sequence and repeated the last gap'], [xs[n + 2], 'skipped a turn: that is this strand\'s term after next']], `Position ${n + 1} continues ${seq(n % 2 === 0 ? odd(xs.slice(0, n)) : even(xs.slice(0, n)))}: ${neg(xs[n])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Decide the strand **first**: n shown terms → position n + 1; n even → first strand, n odd → second. Then solve only that strand fully; a glance at the other confirms the split.' },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 7)), lines: [
      { t: 0, say: `Gaps ${seq(g(TA.slice(0, 7)))} swing down and up. Neighbours are unrelated, so split.` },
      { t: 5, say: `Odd positions ${seq(odd(TA.slice(0, 7)))}: add ${TAa[1] - TAa[0]}. Even positions ${seq(even(TA.slice(0, 7)))}: doubling.` },
      { t: 10, say: `The last term ${TA[6]} is on the add-${TAa[1] - TAa[0]} strand, so next is ${TA[6] + TAa[1] - TAa[0]}.`, slip: true },
      { t: 13, say: `Wait: seven terms shown, so the next is position 8, even. The doubling strand moves, not the one ${TA[6]} sits on.` },
      { t: 17, say: `${TAb[2]} × 2 = ${TA[7]}. Answer ${TA[7]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: count the terms before you continue', questions: [
      { make: (rng) => { const n = 6, d = draw(rng, n), xs = d.xs.slice(0, n); return num(nextQ(xs), d.xs[n], `Six shown: position 7 is odd, so ${seq(odd(xs))} continues (${word[d.next.k]}): ${neg(d.xs[n])}. The last term ${neg(xs[5])} sits on the other strand.`, ['How many terms are shown? Which position is next?', 'Continue only the strand that owns that position.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'The strand you must continue usually has only 3 or 4 visible terms, so test writers keep it simple: a constant gap or a constant ratio. If your strand needs a complicated rule, recheck the split.' },
    { type: 'check', scope: 'strand first, then one strand only', questions: [
      { make: (rng) => { const n = 7, d = draw(rng, n), xs = d.xs.slice(0, n), s = even(xs); return num(nextQ(xs), d.xs[n], `Seven shown: position 8 is even. Only ${seq(s)} matters (${word[d.next.k]}): ${neg(d.xs[n])}.`, ['Seven terms shown: which position is next?', 'Solve only the even-position strand.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Zigzag gaps or unrelated neighbours → split odd and even positions; n shown → next is position n + 1; continue that strand only.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'How to read it'], rows: [
      [seq(E1.slice(0, 6)), seq(g(E1.slice(0, 6))), 'two strands: every second term is regular'],
      [seq(ALT), seq(g(ALT)), 'alternating operations: +3, ×2, +3, ×2 on the previous term'],
      [seq(QD.slice(0, 5)), seq(g(QD.slice(0, 5))), 'one sequence: gaps grow steadily'],
      [seq(geo(2, -2, 5)), seq(g(geo(2, -2, 5))), 'one sequence: ratio −2, signs alternate'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a strand can be constant (5, x, 5, y, 5); one strand can be a two-term sum on its own (every second term adds the two before it in its strand); and three strands (positions 1, 4, 7, …) are possible but rare. The split is the same idea with every third term.' },
    { type: 'variation', base: `${seq(E16)}, ?  Six shown, position 7 is odd: ${E1a[2]} + ${E1a[1] - E1a[0]} = ${E1[6]}.`, rows: [
      { same: true, change: `Change the even strand to steps of −10: ${seq(OTHER.slice(0, 6))}, ?`, effect: `Still ${OTHER[6]}. The strand that does not move next can change freely; only the odd strand decides this answer.` },
      { change: `Show one more term: ${seq(MORE.slice(0, 7))}, ?`, effect: `${MORE[7]}. Seven shown, so position 8 is even: now the falling strand moves.` },
      { change: `The odd strand adds 10 instead of 5: ${seq(FAST.slice(0, 6))}, ?`, effect: `${FAST[6]}. Same strand moves; it simply steps by 10.` },
      { change: `Put the falling strand first: ${seq(SWAP.slice(0, 6))}, ?`, effect: `${SWAP[6]}. Position 7 is still odd, and the odd positions now hold the falling strand.` },
      { fusion: true, change: `Show one more term and give the even strand steps of −10: ${seq(BOTH.slice(0, 7))}, ?`, effect: `${BOTH[7]}. The extra term hands the turn to the even strand, and that is exactly the strand that changed, so both changes reach the answer.` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) xs = draw(rng, 6, 0).xs.slice(0, 6); else if (t === 1) xs = geo(rng.int(1, 5) * rng.pick([1, -1]), rng.pick([-2, -3]), 6); else xs = quad(rng.int(1, 20), rng.int(1, 5), rng.int(1, 3), 6); const names = ['two strands', 'one sequence, negative ratio', 'one sequence, steadily growing gaps']; const trp = [[null, `neighbour ratios ${ratios(xs).slice(0, 3).join(', ')} are not constant`, 'the gaps zigzag, they do not grow steadily'], ['every term is the previous one times the same negative number: one rule, no split needed', null, 'the gaps flip sign; they do not grow steadily'], ['every second term is not a separate simple list; the gaps grow steadily', 'the signs do not alternate', null]]; return pick(rng, `${seq(xs)}: which reading fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
      { make: (rng) => { const c = rng.int(2, 9), B = arith(rng.int(10, 30), rng.int(2, 6), 4), xs = weave([c, c, c, c], B, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `The odd strand is constant (${c}, ${c}, ${c}); position 7 is odd: ${c}.`, ['Split the positions.', 'A strand can be constant.']); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: whenever a list mixes two sources (odd and even rounds, two players taking turns, two alternating states), separate them before looking for a pattern.' },
    { type: 'transfer',
      near: { make: (rng) => { const A = arith(rng.int(1, 9), rng.int(2, 5), 4), B = arith(rng.int(30, 45), -rng.int(2, 5), 4), C = arith(rng.int(60, 80), rng.int(6, 9), 4), xs = [0, 1, 2, 3].flatMap((i) => [A[i], B[i], C[i]]); return num(`Three sequences take turns here (positions 1, 4, 7, …; 2, 5, 8, …; 3, 6, 9, …). ${nextQ(xs.slice(0, 9))}`, xs[9], `Nine shown, so position 10 belongs to the strand at positions 1, 4, 7, 10: ${seq(A.slice(0, 3))} steps by ${A[1] - A[0]}, giving ${A[3]}.`, ['Read every third term.', 'Position 10 is in the first strand (1, 4, 7, 10).']); } },
      far: { make: (rng) => { const a = rng.int(70, 90), da = rng.int(1, 3), b = rng.int(55, 68), db = -rng.int(1, 2), m = rng.int(9, 12), log = weave(arith(a, da, 3), arith(b, db, 3), 6), ans = m % 2 ? a + ((m - 1) / 2) * da : b + (m / 2 - 1) * db; return num(`A desk logs two products alternately, product A first: ${seq(log)}. Product A moves ${sgn(da)} per entry of its own, product B ${sgn(db)}. What is entry ${m} of the log?`, ans, `Entry ${m} is ${m % 2 ? 'odd, so product A' : 'even, so product B'}: it is that product's entry ${m % 2 ? (m + 1) / 2 : m / 2}, so ${m % 2 ? `${a} + ${(m - 1) / 2} × ${da}` : `${b} − ${m / 2 - 1} × ${-db}`} = ${ans}.`, ['Odd entries are product A, even entries product B.', `Entry ${m} is the ${m % 2 ? (m + 1) / 2 : m / 2}th entry of its own product.`]); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the three strands and the trading log?', options: [
        'separate the sources, then let the turn count pick one',
        'continue from the last entry that appears in the list',
        'find one rule for the gaps between neighbouring entries',
        'average the sources and continue that average instead',
      ], answer: 0, traps: { 1: 'the last entry belongs to another source most of the time; the position decides', 2: 'neighbours come from different sources, so their gaps mix two rules', 3: 'each source keeps its own rule; an average follows neither' }, explain: 'Interleaved strands and an alternating log both mix sources: split them, and the position of the wanted entry says which source to continue.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'interleaved', section: 'nl', count: 3 },
  ],
};
