// NumberLogic family lesson: constant third differences (a cubic). Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, arith, quad } from './method-ladder.js';

// a(i) = a + b·i + c·i(i−1)/2 + t·i(i−1)(i−2)/6: first term a, first gap b, first second difference c,
// constant third difference t (the generator's parametrisation).
const cub = (a, b, c, t, n) => Array.from({ length: n }, (_, i) => a + b * i + (c * i * (i - 1)) / 2 + (t * i * (i - 1) * (i - 2)) / 6);
const g = (xs) => diffs(xs);
const g2 = (xs) => diffs(diffs(xs));
const g3 = (xs) => diffs(diffs(diffs(xs)));
const TET = [3, 4, 5, 6, 7, 8].map((n) => (n * (n - 1) * (n - 2)) / 6); // 3-card hands from n cards
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const dgs = (a, gg, n) => { const o = [a]; for (let i = 1; i < n; i++) o.push(o[i - 1] + gg * 2 ** (i - 1)); return o; };

const CH = cub(1, 4, 5, 2, 7); // sums of squares
const E1 = cub(3, 2, 1, 2, 7);
const E2 = cub(10, 6, -1, 3, 7);
const E3 = cub(4, 9, 6, -2, 7);
const CU = Array.from({ length: 7 }, (_, i) => (i + 1) ** 3);
const PRED = Array.from({ length: 6 }, (_, i) => 2 * (i + 1) ** 3);
const ERR = cub(2, 3, 2, 3, 7);
const AR = arith(5, 4, 6), QD = quad(3, 2, 3, 6), DG = dgs(3, 1, 6);

// Level 3 and level 4 draws, as in the generator. Draws with a repeated or tiny term, or two
// equal neighbouring gaps (a 0 in the second row lets "sum of the previous three plus a
// counting term" fit as well), invite a second reading and are redrawn.
const clean = (xs) => new Set(xs).size === xs.length && xs.slice(0, 6).every((v) => Math.abs(v) >= 2) && g2(xs).slice(0, 4).every((v) => v !== 0);
function draw(rng, n, lvl = rng.pick([3, 4])) {
  for (;;) {
    const t = lvl === 3 ? rng.int(1, 3) : nz(rng, -4, 4);
    const xs = cub(rng.int(-5, 20), rng.int(-3, 8), rng.int(-4, 6), t, n);
    if (clean(xs)) return xs;
  }
}
const edge = (xs, n) => ({ x: xs[n - 1], gl: g(xs)[n - 2], sl: g2(xs)[n - 3], t: g3(xs)[0] });

export default {
  id: 'nl/third-diff',
  book: 'nl',
  kind: 'family',
  family: 'third-diff',
  title: 'Three rounds of differences',
  summary: 'Gaps not constant, second row not constant but moving steadily: subtract a third time; a constant third row t rebuilds the next term in three additions.',
  prerequisites: ['nl/method-ladder', 'nl/second-diff'],
  objectives: [
    'Build a four-row ladder from six terms in under 30 seconds',
    'Extend a constant third row and climb three rows back to the next term',
    'Read the climb from the right edge of the ladder only',
    'Say when three rows are enough and when to switch to another test',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'repeat-second', label: 'Stop at two rows', approach: 'Took the gaps and the second row, then repeated the last second difference.', breaksAt: 'The second row still changes, so its next entry is not its last one.' },
      { id: 't-on-gap', label: 'Add t to the gap', approach: 'Found the third difference and added it straight to the last gap.', breaksAt: 't feeds the second row first; the gap grows by the new second difference.' },
      { id: 'formula', label: 'Guess a formula in n', approach: 'Tried to spot a formula such as n² plus something from the first terms.', breaksAt: 'A cubic is slow to guess; the ladder climbs to the answer with no formula at all.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once by taking differences until a row is constant, once by looking hard at the gaps.`, answer: String(CH[6]), explain: `Differences: gaps ${seq(g(CH.slice(0, 6)))}, then ${seq(g2(CH.slice(0, 6)))}, then ${seq(g3(CH.slice(0, 6)))}: the third row is constant. Climbing back gives ${CH[6]}. The shortcut: the gaps are the squares 2² to 6², so the next gap is 7² = ${g(CH)[5]} and ${CH[5]} + ${g(CH)[5]} = ${CH[6]}.` },
    { type: 'text', text: 'Subtract neighbours: the gaps are not constant. Subtract again: the second row is not constant either, but it moves **steadily**, rising or falling by the same amount. That means a third subtraction flattens it. The rule is a cubic in the position, and you never need its formula.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 6))}, ?`] },
    { type: 'check', scope: 'the cue: the second row moves steadily', questions: [
      { make: (rng) => { const c = draw(rng, 6, 3), q = quad(rng.int(10, 40), rng.int(3, 9), rng.int(2, 4), 6), d = dgs(rng.int(10, 40), rng.int(2, 4), 6); return pick(rng, 'Which sequence needs **three** rounds of subtraction before a row is constant?', seq(c), [[seq(q), `its second row ${seq(g2(q))} is already constant: two rounds`], [seq(d), `its rows ${seq(g(d))}, ${seq(g2(d))} keep doubling: no row of subtraction settles, divide instead`]], `${seq(c)}: second row ${seq(g2(c))}, third row ${seq(g3(c))}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: a second row that is already constant (stop at two rows), or a second row that copies the gaps, as in ${seq(DG)} with gaps ${seq(g(DG))}: subtraction never settles there, so divide instead.` },
    { type: 'check', scope: 'rows that never settle', questions: [
      { type: 'choice', q: '3, 4, 6, 10, 18, 34: what do you do?', options: ['divide: the gaps double', 'subtract a third time', 'stop at two rows'], answer: 0, traps: { 1: 'the rows copy themselves, so subtraction never settles', 2: 'the second row 1, 2, 4, 8 is not constant' }, explain: 'Gaps 1, 2, 4, 8, 16 double: divide instead of subtracting.' },
    ] },

    S('why'),
    { type: 'text', text: 'Third differences are the late-test version of the ladder. Sums of squares, cubes shifted by a constant and "add the squares" rules all live here, and they look random until you peel three layers. The method is the one you already use for two layers, run once more, so a question that looks like a formula hunt becomes three subtractions and three additions. Test writers rely on candidates stopping after the second row and repeating its last entry; that exact slip is always among the options.' },

    S('anchor'),
    { type: 'text', text: 'In the second-difference lesson the **second** row was flat and the gap row was a constant-gap sequence. This family changes **one thing**: the second row is itself a constant-gap sequence, so the flat row is the **third**. Continue the second row the way you continued the gaps before, then climb one extra row.' },
    { type: 'check', scope: 'continuing a steadily moving row', questions: [
      { make: (rng) => { const t = nz(rng, -4, 5), r = arith(rng.int(-8, 12), t, 5); return num(`The second row of a ladder is ${seq(r.slice(0, 4))}. It moves by the same amount each time. What is its next entry?`, r[4], `It changes by ${sgn(t)} each step: ${neg(r[3])} ${sgn(t)} = ${neg(r[4])}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Four rows: the terms, the gaps, the gaps of the gaps, and the third row. Every entry sits between the two entries it came from. The bottom row is flat; the outlined cells are the continuation, written from the bottom up.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1, 3), predicted: true }, caption: `${seq(E1.slice(0, 6))}: gaps ${seq(g(E1.slice(0, 6)))}, second row ${seq(g2(E1.slice(0, 6)))}, third row ${g3(E1)[0]} every time. Outlined, bottom up: ${g3(E1)[0]}, then ${g2(E1)[3]} + ${g3(E1)[0]} = ${g2(E1)[4]}, then ${g(E1)[4]} + ${g2(E1)[4]} = ${g(E1)[5]}, then ${E1[5]} + ${g(E1)[5]} = ${E1[6]}.` },
    { type: 'check', scope: 'reading the four-row ladder', questions: [
      { make: (rng) => { const xs = draw(rng, 6); return num(`What is the constant third difference of ${seq(xs)}?`, g3(xs)[0], `Gaps ${seq(g(xs))}; second row ${seq(g2(xs))}; third row ${seq(g3(xs))}.`, ['Write the gaps, later minus earlier.', 'Subtract twice more, keeping signs.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CU.slice(0, 6), 3) }, caption: `The cubes ${seq(CU.slice(0, 6))}: the third row is ${g3(CU)[0]} every time. Multiplying every term by k multiplies every row by k, so k·n³ has third difference ${g3(CU)[0]}k; adding a constant, or any n² and n terms, changes only the upper rows.` },
    { type: 'check', scope: 'the third difference of k·n³', questions: [
      { make: (rng) => { const k = rng.int(2, 5), c = nz(rng, -9, 9), xs = Array.from({ length: 6 }, (_, i) => k * (i + 1) ** 3 + c); return num(`${seq(xs)} is ${k}n³ ${c < 0 ? '−' : '+'} ${Math.abs(c)}. What is its constant third difference?`, 6 * k, `n³ has third difference ${g3(CU)[0]}, so ${k}n³ has ${6 * k}; the constant vanishes in the first subtraction. Check: ${seq(g3(xs))}.`, ['n³ alone gives 6 in the third row.', 'Scaling every term by k scales every row by k.']); } },
    ] },

    S('derivation'),
    { type: 'text', text: `Take ${seq(E2.slice(0, 6))} as the running example. Each move below is one subtraction pass or one addition pass.` },
    { type: 'steps', steps: [
      { say: `Take differences: write each gap between its two terms. Here: ${seq(g(E2.slice(0, 6)))}. Not constant.`, why: 'The first test always comes first. It removes the starting value and rules out a constant gap.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 6); return num(`Write the gaps of ${seq(xs)}. What is the **last** gap?`, g(xs)[4], `Gaps: ${seq(g(xs))}.`, ['Later term minus earlier term.', `${neg(xs[5])} − ${par(xs[4])}.`]); } },
        ] },
      { say: `Take them again: the gaps of the gaps, ${seq(g2(E2.slice(0, 6)))}. Still not constant, but they move by the same amount each step.`, why: 'The gap row is just another sequence, so apply the same test to it. A row that changes steadily is one subtraction away from flat.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 6); return num(`${seq(xs)} has gaps ${seq(g(xs))}. What is the **last** entry of the second row?`, g2(xs)[3], `Second row: ${seq(g2(xs))}.`, ['Subtract neighbouring gaps, later minus earlier.', `${neg(g(xs)[4])} − ${par(g(xs)[3])}.`]); } },
          { make: (rng) => { const three = rng.chance(0.5), xs = three ? draw(rng, 6) : quad(rng.int(1, 20), rng.int(1, 6), nz(rng, -3, 4), 6); return pick(rng, `Is the second row of ${seq(xs)} constant?`, three ? 'No' : 'Yes', [[three ? 'Yes' : 'No', three ? `the second row is ${seq(g2(xs))}: look at every entry` : `every entry of ${seq(g2(xs))} is the same; recheck the subtractions`]], `Second row: ${seq(g2(xs))}.`); } },
        ] },
      { answers: 'repeat-second', say: `Take them a third time: ${seq(g3(E2.slice(0, 6)))}. Constant: t = ${g3(E2)[0]}.`, why: 'Each subtraction lowers the degree of the rule by one. Three subtractions flatten a cubic, so this is the layer the rule lives on.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 6); return num(`${seq(xs)}: gaps ${seq(g(xs))}, second row ${seq(g2(xs))}. What is the third difference?`, g3(xs)[0], `Third row: ${seq(g3(xs))}.`, ['Subtract neighbours in the second row.', 'Keep the signs.']); } },
        ] },
      { say: `Extend the bottom row: copy t once more. New bottom entry ${g3(E2)[0]}.`, why: 'The flat row is the only row you know for certain, so it is the only one you may extend by copying. Every other row is rebuilt from it.',
        checks: [
          { hinge: true, make: (rng) => { const xs = draw(rng, 6), e = edge(xs, 6); return pick(rng, `Ladder for ${seq(xs)}: gaps ${seq(g(xs))}, second row ${seq(g2(xs))}, third row ${seq(g3(xs))}. What do you write **first**?`, `${neg(e.t)} at the end of the third row`, [[`${neg(e.sl)} at the end of the second row`, 'copied the second row, but it is not constant; only the third row repeats'], [`${neg(e.x + e.gl)} as the next term`, 'repeated the last gap, skipping two rows that change'], [`${neg(e.gl + e.t)} as the next gap`, 'added t to the gap row, skipping the second row']], 'Start at the flat row: copy it, then climb one row at a time.'); } },
        ] },
      { answers: 't-on-gap', say: `Climb one row: next second difference = last second difference + t = ${g2(E2)[3]} ${sgn(g3(E2)[0])} = ${g2(E2)[4]}.`, why: 'Every entry is the difference of the two above it, so the missing upper entry is its left neighbour plus the new entry below.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 7), e = edge(xs, 6); return num(`${seq(xs.slice(0, 6))}, ? The second row is ${seq(g2(xs).slice(0, 4))} and t = ${neg(e.t)}. What is the **next second difference**?`, g2(xs)[4], `${neg(e.sl)} ${sgn(e.t)} = ${neg(g2(xs)[4])}.`, ['The new entry sits under the last second difference, one step right.', 'Last second difference + t.']); } },
        ] },
      { say: `Climb again: next gap = last gap + new second difference = ${g(E2)[4]} ${sgn(g2(E2)[4])} = ${g(E2)[5]}.`, why: 'The same rule one row higher: left neighbour plus the entry just written below it.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 7), e = edge(xs, 6); return num(`${seq(xs.slice(0, 6))}, ? The last gap is ${neg(e.gl)} and the next second difference is ${neg(g2(xs)[4])}. What is the **next gap**?`, g(xs)[5], `${neg(e.gl)} ${sgn(g2(xs)[4])} = ${neg(g(xs)[5])}.`, ['Last gap plus the new second difference.']); } },
        ] },
      { answers: 'formula', say: `Climb to the top: next term = last term + new gap = ${E2[5]} ${sgn(g(E2)[5])} = ${E2[6]}.`, why: 'Each term is the previous term plus the gap between them. Three additions, bottom to top, and the ladder is done.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Third row ${neg(g3(xs)[0])}; next second difference ${neg(g2(xs)[4])}; next gap ${neg(g(xs)[5])}; next term ${neg(xs[5])} ${sgn(g(xs)[5])} = ${neg(xs[6])}.`, ['Three rows of differences.', 'Copy the flat row, then add upwards: second row, gaps, terms.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['row', 'last entry', '+ new entry below', 'new entry'], rows: [
      ['third row', neg(g3(E2)[0]), 'copy', neg(g3(E2)[0])],
      ['second row', neg(g2(E2)[3]), sgn(g3(E2)[0]), neg(g2(E2)[4])],
      ['gaps', neg(g(E2)[4]), sgn(g2(E2)[4]), neg(g(E2)[5])],
      ['terms', neg(E2[5]), sgn(g(E2)[5]), neg(E2[6])],
    ] }, caption: `The climb on one card. Read it top to bottom: only the right-hand edge of the ladder is used, and each new entry feeds the row above it.` },
    { type: 'check', scope: 'the climb on one card', questions: [
      { type: 'number', q: 'A ladder edge reads: last term 60, last gap 20, last second-row entry 8, third row 3. What is the next term?', answer: 91, explain: 'Bottom up: 8 + 3 = 11, then 20 + 11 = 31, then 60 + 31 = 91.' },
    ] },
    { type: 'explain', prompt: 'Why is the third row the one you copy, and why must you climb through the second row and the gaps instead of adding t to the last term?', model: 'Only the flat row has a known next entry; the rows above change, and each of their entries is the difference of the two above it. So the new second difference is the old one plus t, the new gap is the old gap plus that, and the new term is the old term plus that gap. Adding t to the term skips two rows that are still changing.', points: ['Only a constant row can be extended by copying', 'Each new upper entry = left neighbour + new entry below', 'The climb goes through every row: second row, gaps, terms'] },

    S('worked'),
    { type: 'worked', family: 'third-diff', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'A positive third difference. Build all four rows before opening the solution.' },
    { type: 'worked', family: 'third-diff', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'The third difference may be negative. The rows are given; the climb is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED)} is 2n³. Before subtracting anything: what will the third row be?`, answer: `${g3(PRED)[0]} every time: n³ gives ${g3(CU)[0]}, and doubling every term doubles every row.`, explain: `Check it: gaps ${seq(g(PRED))}, second row ${seq(g2(PRED))}, third row ${seq(g3(PRED))}.` },

    S('traps'),
    { type: 'traps', family: 'third-diff', section: 'nl', extra: [
      { belief: 'Stop after two rows and repeat the last second difference.', fix: 'The second row changes. Subtract once more; only a flat row may be copied.' },
      { belief: 'Add t straight onto the last gap.', fix: 't feeds the second row first: new second difference = last one + t, then the gap.' },
      { belief: 'Five terms are enough to trust a third row.', fix: 'Five terms give two third differences: one comparison. Six give three.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 6)))}; second row: ${seq(g2(ERR.slice(0, 6)))}.`,
      `Third row: ${seq(g3(ERR.slice(0, 6)))}, so t = ${g3(ERR)[0]}.`,
      `Next gap = last gap + t = ${g(ERR)[4]} + ${g3(ERR)[0]} = ${g(ERR)[4] + g3(ERR)[0]}.`,
      `Next term = ${ERR[5]} + ${g(ERR)[4] + g3(ERR)[0]} = ${ERR[5] + g(ERR)[4] + g3(ERR)[0]}.`,
    ], errorStep: 2, explain: `t belongs to the second row: next second difference = ${g2(ERR)[3]} + ${g3(ERR)[0]} = ${g2(ERR)[4]}, next gap = ${g(ERR)[4]} + ${g2(ERR)[4]} = ${g(ERR)[5]}, next term = ${ERR[5]} + ${g(ERR)[5]} = ${ERR[6]}. The warning sign: the next gap grew by only ${g3(ERR)[0]}, while the last gaps grew by ${g2(ERR)[3]} and more.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const xs = draw(rng, 8), e = edge(xs, 6); return pick(rng, nextQ(xs.slice(0, 6)), xs[6], [[e.x + e.gl + e.sl, 'stopped at two rows and repeated the last second difference'], [e.x + e.gl + e.t, 'added t to the last gap, skipping the second row'], [e.x + e.gl, 'repeated the last gap as if the gaps were constant'], [e.x + e.t, 'added t to the last term, skipping two rows'], [xs[7], 'went one step too far: that is the term after the next one']], `t = ${neg(e.t)}: second difference ${neg(e.sl)} ${sgn(e.t)} = ${neg(e.sl + e.t)}, gap ${neg(e.gl)} ${sgn(e.sl + e.t)} = ${neg(g(xs)[5])}, term ${neg(xs[6])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Only the **right edge** matters. Write four numbers: last term x, last gap g, last second difference s, third difference t. Then s′ = s + t, g′ = g + s′, x′ = x + g′. Three additions, about 20 seconds after the rows.' },
    { type: 'check', scope: 'the right edge', questions: [
      { make: (rng) => { const xs = draw(rng, 7), e = edge(xs, 6); return num(`The right edge of a ladder reads: last term ${neg(e.x)}, last gap ${neg(e.gl)}, last second difference ${neg(e.sl)}, third difference ${neg(e.t)}. What is the next term?`, xs[6], `s′ = ${neg(e.sl)} ${sgn(e.t)} = ${neg(e.sl + e.t)}; g′ = ${neg(e.gl)} ${sgn(e.sl + e.t)} = ${neg(g(xs)[5])}; x′ = ${neg(e.x)} ${sgn(g(xs)[5])} = ${neg(xs[6])}.`, ['Start at the bottom: s + t.', 'Then g + s′, then x + g′.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Named shortcut: if the gaps are a list you know (squares ${seq(CH.slice(1, 5).map((v, i) => v - CH[i]))}, or cubes), extend that list. Sums of squares have third difference ${g3(CH)[0]}; cubes have ${g3(CU)[0]}.` },
    { type: 'thinkaloud', problem: nextQ(E3.slice(0, 6)), lines: [
      { t: 0, say: `Six terms, and the gaps are not constant: ${seq(g(E3.slice(0, 6)))}.` },
      { t: 6, say: `They rise more and more slowly. Second row: ${seq(g2(E3.slice(0, 6)))}.` },
      { t: 10, say: `The gaps level off at ${g(E3)[4]}, so the next gap is ${g(E3)[4]} again: ${E3[5] + g(E3)[4]}.`, slip: true },
      { t: 14, say: `Wait: that treats the gaps as constant, but the second row is still falling. Third row: ${neg(g3(E3)[0])} every time.` },
      { t: 20, say: `Right edge: second difference ${neg(g2(E3)[3])}, gap ${g(E3)[4]}, term ${E3[5]}. ${neg(g2(E3)[3])} ${sgn(g3(E3)[0])} = ${neg(g2(E3)[4])}; ${g(E3)[4]} ${sgn(g2(E3)[4])} = ${g(E3)[5]}.` },
      { t: 26, say: `${E3[5]} + ${g(E3)[5]} = ${E3[6]}. Shape check: the next gap ${g(E3)[5]} is a bit below ${g(E3)[4]}, as a falling second row says. Answer ${E3[6]}.` },
    ] },
    { type: 'check', scope: 'the named shortcut', questions: [
      { make: (rng) => { const s0 = rng.int(1, 4), a = rng.int(1, 20), xs = [a]; for (let i = 0; i < 6; i++) xs.push(xs[i] + (s0 + i) ** 2); return num(`${seq(xs.slice(0, 6))}, ? The gaps are consecutive squares. What comes next?`, xs[6], `Gaps ${seq(g(xs).slice(0, 5))} are ${s0}² to ${s0 + 4}²; the next gap is ${s0 + 5}² = ${(s0 + 5) ** 2}, so ${xs[5]} + ${(s0 + 5) ** 2} = ${xs[6]}.`, ['Which squares are the gaps?', 'Add the next square to the last term.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Second row moves steadily → subtract a third time; constant t → s′ = s + t, g′ = g + s′, next = last + g′.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'First constant row', 'Next'], rows: [
      [seq(AR.slice(0, 5)), `gaps: ${g(AR)[0]}`, String(AR[5])],
      [seq(QD.slice(0, 5)), `second row: ${g2(QD)[0]}`, String(QD[5])],
      [seq(E1.slice(0, 6)), `third row: ${g3(E1)[0]}`, String(E1[6])],
      [seq(DG.slice(0, 5)), 'none: every row doubles, divide the gaps', String(DG[5])],
    ] },
    { type: 'variation', base: `${seq(E1.slice(0, 6))}, ? (third difference ${g3(E1)[0]}, next ${E1[6]})`, rows: [
      { change: 'Add 10 to every term', effect: `Every difference row stays the same (the 10 cancels), so the next term is also 10 more: ${E1[6] + 10}.` },
      { change: 'Double every term', effect: `Every row doubles: the third difference becomes ${2 * g3(E1)[0]} and the next term ${2 * E1[6]}.` },
      { change: `Make the third difference ${-g3(E1)[0]}, keeping the first three terms`, effect: `The list becomes ${seq(cub(3, 2, 1, -g3(E1)[0], 6))}; climbing from the new bottom row gives ${cub(3, 2, 1, -g3(E1)[0], 7)[6]}.` },
      { change: 'Drop the first term (five shown)', same: true, effect: `No change: the rule and the last terms are the same, so the next is still ${E1[6]}. You only lose a check: the third row has two entries, not three.` },
      { change: 'Double every term and then add 10', fusion: true, effect: `The doubling scales every row (the third difference becomes ${2 * g3(E1)[0]}); the 10 only shifts the terms. So the next term is 2 × ${E1[6]} + 10 = ${2 * E1[6] + 10}.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a negative t makes the second row fall, so the gaps grow more slowly and can turn round. If the third row is not constant either, do not go looking for a fourth row: try ratios, recurrences and strands first; NumberLogic items stop at three rows.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 3); const xs = t === 0 ? arith(rng.int(1, 30), rng.int(2, 9), 6) : t === 1 ? quad(rng.int(1, 20), rng.int(1, 6), rng.int(1, 3), 6) : t === 2 ? draw(rng, 6, 3) : dgs(rng.int(1, 9), rng.int(1, 3), 6); const names = ['the gap row', 'the second row', 'the third row', 'none of them']; const why = (i) => (i < t ? `that row is not constant here: ${seq([g, g2, g3][i](xs))}` : t === 3 ? 'every row keeps doubling; subtraction never settles' : 'too deep: an earlier row is already constant'); return pick(rng, `${seq(xs)}: which row is the first constant one?`, names[t], names.map((nm, i) => [nm, why(i)]).filter((_, i) => i !== t), `Gaps ${seq(g(xs))}; second row ${seq(g2(xs))}; third row ${seq(g3(xs))}.`); } },
      { type: 'number', q: 'How many shown terms do you need to see **three** equal entries in the third row?', answer: 6, explain: 'Each row is one entry shorter than the row above: 6 terms give 5 gaps, 4 second differences and 3 third differences.', hints: ['Each subtraction loses one entry.', 'You want 3 entries after three subtractions.'] },
    ] },

    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: the ladder is a discrete derivative. A rule of degree k has a constant k-th row, just as the k-th derivative of a degree-k polynomial is constant. Stacked cannonballs (${seq(CH.slice(0, 4))}, the sums of squares) and volumes of cubes are the everyday cubics.` },
    { type: 'transfer',
      near: { make: (rng) => { const xs = draw(rng, 7); return num(`A quantity is recorded on six days: ${seq(xs.slice(0, 6))}. Its third differences are constant. What is the reading on day 7?`, xs[6], `Third row ${neg(g3(xs)[0])}; next second difference ${neg(g2(xs)[4])}, next gap ${neg(g(xs)[5])}, reading ${neg(xs[6])}.`, ['Build three rows of differences.', 'Copy the flat row, then climb.']); } },
      far: { type: 'number', q: `How many different 3-card hands can be dealt from n cards? For n = 3, 4, 5, 6, 7 the counts are ${seq(TET.slice(0, 5))}. Using differences only, what is the count for n = 8?`, answer: TET[5], explain: `Gaps ${seq(g(TET.slice(0, 5)))}, second row ${seq(g2(TET.slice(0, 5)))}, third row ${seq(g3(TET.slice(0, 5)))}. Climb: ${g2(TET)[2]} + 1 = ${g2(TET)[3]}, ${g(TET)[3]} + ${g2(TET)[3]} = ${g(TET)[4]}, ${TET[4]} + ${g(TET)[4]} = ${TET[5]}.`, hints: ['The count is a cubic in n.', 'Three rows of differences, then climb.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the card counts?', options: ['A rule of degree k has a constant k-th row of differences', 'Every count grows by one constant ratio between neighbours', 'Each count is the sum of the two counts just before it', 'The number of hands is always a perfect cube of n'], answer: 0, traps: { 1: `the ratios ${TET.slice(1, 5).map((v, i) => (v / TET[i]).toFixed(2)).join(', ')} keep falling`, 2: `${TET[2]} + ${TET[3]} is not ${TET[4]}`, 3: `${TET[3]} is not a cube; the count is a cubic in n, not a cube` }, explain: 'Choosing 3 cards from n is a cubic in n, so three subtractions flatten it, exactly as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'third-diff', section: 'nl', count: 3 },
  ],
};
