// NumberLogic family lesson: add the last term written backwards. Every number shown is computed here.
import { S, seq, diffs, ratio, nextQ, pick, num, geo, affine } from './method-ladder.js';
import { ds, run } from './digit-sum.js';

const rv = (v) => Number(String(v).split('').reverse().join(''));
const rr = (a, n) => run(a, rv, n);
const g = (xs) => diffs(xs);
const pal = (v) => rv(v) === v;

// Starts as in the generator (level 4: 12 to 98, level 5: 102 to 989; no final 0, no palindrome,
// no term ending in 0). Starts whose five shown terms also fit a second rule (checked with the
// rule finder in src/sections/nl/solver.js) are skipped.
const TWO_FACED = new Set([12, 24, 29, 38, 47, 56, 65, 74, 83, 92, 451, 873]);
function draw(rng, lvl = rng.pick([4, 5])) {
  for (;;) {
    const a = lvl === 4 ? rng.int(12, 98) : rng.int(102, 989);
    if (a % 10 === 0 || pal(a) || TWO_FACED.has(a)) continue;
    const xs = rr(a, 7);
    if (xs.slice(0, 6).some((v) => v % 10 === 0) || xs[5] > 1e7) continue;
    return { a, xs };
  }
}
const pals = (rng, lastPal) => { for (;;) { const p = draw(rng); if (pal(p.xs[4]) === lastPal) return p; } };

const CH = rr(58, 6);
const E1 = rr(89, 6);
const E2 = rr(167, 6);
const E3 = rr(123, 6);
const PRED = rr(79, 5);
const ERR = rr(57, 6);
const PAL0 = 87, PSTEPS = [PAL0]; while (!pal(PSTEPS[PSTEPS.length - 1]) || PSTEPS.length === 1) PSTEPS.push(PSTEPS[PSTEPS.length - 1] + rv(PSTEPS[PSTEPS.length - 1]));
const DBL = geo(7, 2, 5), AF = affine(5, 2, 3, 5), DS = run(58, ds, 5);

export default {
  id: 'nl/reverse-digits',
  book: 'nl',
  kind: 'family',
  family: 'reverse-digits',
  title: 'Add the number written backwards',
  summary: 'Terms that roughly double but wander (exactly double at palindromes): each gap is the previous term reversed, so next = last + reverse(last).',
  prerequisites: ['nl/method-ladder', 'nl/geometric', 'nl/digit-sum'],
  objectives: [
    'Recognise near-doubling that wanders, with exact doubling at palindromes',
    'Match each gap to the term before it written backwards',
    'Add the reversal of the last term, not of an earlier one',
    'Check the last digit of the answer in one step',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'ratio', label: 'Chase the ratio', approach: `Computed the ratios ${CH.slice(1, 5).map((v, i) => (v / CH[i]).toFixed(2)).join(', ')} and looked for their pattern.`, breaksAt: 'The ratio depends on the digits, so it never settles.' },
      { id: 'prev-rev', label: 'Reverse an earlier term', approach: 'Added the reversal of the term before the last one.', breaksAt: 'Each gap belongs to the term on its left: reverse the last term.' },
      { id: 'double', label: 'Double the last term', approach: `Saw ${CH[2]} + ${CH[2]} = ${CH[3]} and doubled from there on.`, breaksAt: 'That step doubled only because the term was a palindrome.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the ratios, once by comparing each gap with the term before it.`, answer: String(CH[5]), explain: `Ratios ${CH.slice(1, 5).map((v, i) => (v / CH[i]).toFixed(2)).join(', ')}: around 2, but not constant. Gaps ${seq(g(CH.slice(0, 5)))}: ${g(CH)[0]} is ${CH[0]} backwards, ${g(CH)[1]} is ${CH[1]} backwards. So next = ${CH[4]} + ${rv(CH[4])} = ${CH[5]}.` },
    { type: 'text', text: 'Each term is the previous term **plus the same number written backwards**. Because a number and its reversal have the same number of digits, the terms roughly double; the ratio wanders, and it is exactly 2 whenever a term reads the same both ways (a palindrome).' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `Not this lesson: exact doubling every time (${seq(DBL)}), double plus a constant (${seq(AF)}: the ratio settles instead of wandering) or a small digit-sum gap (${seq(DS)}).` },
    { type: 'check', scope: 'the cue: gap = the previous term backwards', questions: [
      { make: (rng) => { const p = draw(rng, 4), xs = p.xs.slice(0, 5), af = affine(rng.int(20, 60), 2, rng.int(1, 5), 5), d = run(rng.int(100, 999), ds, 5); return pick(rng, 'In which sequence is every gap the previous term written backwards?', seq(xs), [[seq(af), `its gaps ${seq(g(af))} double: that is 2 × previous + ${af[1] - 2 * af[0]}`], [seq(d), `its gaps ${seq(g(d))} are small digit sums`]], `${xs[1]} = ${xs[0]} + ${rv(xs[0])}, ${xs[2]} = ${xs[1]} + ${rv(xs[1])}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Digit reversal is a late-test favourite because no algebraic test finds it: gaps, ratios and recurrences all fail. It also sets a trap: a palindrome in the list doubles exactly for one step, which invites "multiply by 2" for the answer. Knowing the symptom (roughly doubling, wandering ratio) turns the item into one reversal and one addition, done in well under the time budget.' },

    S('anchor'),
    { type: 'text', text: 'Doubling adds a number to itself: x + x. This family changes **one thing**: it adds the number written backwards, x + reverse(x). When x is a palindrome the two are the same, which is why some steps look exactly like doubling. Like the digit-sum rule, it reads only the last term; unlike it, the number added is as large as the term itself.' },
    { type: 'check', scope: 'x + reverse(x)', questions: [
      { make: (rng) => { let x; do x = rng.int(102, 989); while (x % 10 === 0 || pal(x)); return num(`What is ${x} + ${x} written backwards?`, x + rv(x), `${x} backwards is ${rv(x)}; ${x} + ${rv(x)} = ${x + rv(x)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Three views of one list. The table adds each term to its reversal. The ratio row shows the wandering growth. The bars show that every gap equals the reversal of the term on its left.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'written backwards', 'sum', 'next term'], rows: CH.slice(0, 4).map((v, i) => [String(v), String(rv(v)), String(v + rv(v)), String(CH[i + 1])]) }, caption: `${seq(CH.slice(0, 5))}: term + reversal = next term on every row. ${CH[2]} is a palindrome, so that step is an exact doubling. Next: ${CH[4]} + ${rv(CH[4])} = ${CH[5]}.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [CH.slice(0, 5), CH.slice(1, 5).map((v, i) => ratio(CH[i], v))] }, caption: `Ratios ${CH.slice(1, 5).map((v, i) => (v / CH[i]).toFixed(2)).join(', ')}: around 2, never settling. A ratio that settles would mean a multiply-then-add rule instead.` },
    { type: 'check', scope: 'term + reversal = next term', questions: [
      { make: (rng) => { const p = draw(rng), xs = p.xs; return num(nextQ(xs.slice(0, 5)), xs[5], `${xs[4]} backwards is ${rv(xs[4])}; ${xs[4]} + ${rv(xs[4])} = ${xs[5]}.`, ['Compare each gap with the term before it, read backwards.', 'Add the last term reversed.']); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Gaps of ${seq(CH.slice(0, 5))} against reversals`, xLabel: 'step', yLabel: 'size', categories: g(CH.slice(0, 5)).map((_, i) => String(i + 1)), series: [{ name: 'gap', values: g(CH.slice(0, 5)) }, { name: 'left term written backwards', values: CH.slice(0, 4).map(rv) }], valueLabels: true }, caption: 'Each pair of bars is identical: every gap is the term before it, reversed. Unlike a digit sum, this gap is as large as the term itself.' },
    { type: 'check', scope: 'the gap is the reversal of the left term', questions: [
      { make: (rng) => { let p, i; do { p = draw(rng); i = rng.int(1, 3); } while (pal(p.xs[i])); const xs = p.xs; return num(`In ${seq(xs.slice(0, 5))}, what is ${xs[i]} written backwards?`, rv(xs[i]), `${xs[i]} → ${rv(xs[i])}, and indeed ${xs[i]} + ${rv(xs[i])} = ${xs[i + 1]}.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: `A three-digit start works the same way: ${seq(E2.slice(0, 5))}. The first gap ${g(E2)[0]} is ${E2[0]} backwards; the second, ${g(E2)[1]}, is ${E2[1]} backwards. The terms grow to four and five digits, so write the reversal down rather than juggling it: ${E2[4]} becomes ${rv(E2[4])}, and ${E2[4]} + ${rv(E2[4])} = ${E2[5]}.` },
    { type: 'steps', steps: [
      { answers: 'ratio', say: 'Divide neighbours roughly. Growth near 2 that wanders (sometimes exactly 2, sometimes 3 or more) points to adding a number of the same size.', why: 'A number and its reversal have the same length, so their sum is about twice the number, more when the reversal is bigger.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 5); return pick(rng, `The ratios of ${seq(xs)} are ${xs.slice(1).map((v, i) => (v / xs[i]).toFixed(2)).join(', ')}. What does that suggest?`, 'add the term reversed', [['a constant ratio of 2', 'the ratios wander; they are not all 2'], ['2 × previous + a constant', 'that makes the ratio settle; these jump around']], 'Near-doubling that wanders: test reverse-and-add.'); } },
        ] },
      { say: 'Write the gaps.', why: 'The gap row is the list you will compare with the reversals.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 5); return num(`${seq(xs)}: what is the last gap?`, g(xs)[3], `${xs[4]} − ${xs[3]} = ${g(xs)[3]}.`); } },
        ] },
      { answers: 'prev-rev', say: 'Compare each gap with the term on its left written backwards. If they match on every step, the rule is reverse-and-add.', why: 'The rule builds the next term from the current one, so the gap after a term is that term reversed.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), p = draw(rng), xs = p.xs.slice(0, 5); if (!yes) xs[4] += rng.pick([1, 2, 9]); return pick(rng, `Is every gap of ${seq(xs)} the term before it written backwards?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every gap matches its reversal' : `${xs[3]} backwards is ${rv(xs[3])}, but the last gap is ${xs[4] - xs[3]}`]], `Reversals ${seq(xs.slice(0, 4).map(rv))} against gaps ${seq(g(xs))}.`); } },
        ] },
      { say: 'Next = last + last written backwards.', why: 'Only the last term is used.',
        checks: [
          { make: (rng) => { const p = pals(rng, false), xs = p.xs; return num(nextQ(xs.slice(0, 5)), xs[5], `${xs[4]} + ${rv(xs[4])} = ${xs[5]}.`, ['Reverse the last term.', 'Add it to the last term.']); } },
        ] },
      { answers: 'double', say: 'A palindrome reads the same backwards, so that one step is an exact doubling. The next step is not, unless the new term is a palindrome too.', why: 'Doubling is a special case of the rule, not a new rule. Reverse the actual last term every time.',
        checks: [
          { make: (rng) => { const lastPal = rng.chance(0.5), p = pals(rng, lastPal), xs = p.xs; return pick(rng, `${seq(xs.slice(0, 5))}, ? Is the next term exactly 2 × ${xs[4]}?`, lastPal ? 'Yes' : 'No', [[lastPal ? 'No' : 'Yes', lastPal ? `${xs[4]} reads the same backwards, so the step doubles` : `${xs[4]} backwards is ${rv(xs[4])}, not ${xs[4]}`]], `Next: ${xs[4]} + ${rv(xs[4])} = ${xs[5]}.`); } },
        ] },
    ] },
    { type: 'text', text: `How far the ratio wanders depends on the digits. In ${seq(PRED.slice(0, 4))}, ${PRED[1]} backwards (${rv(PRED[1])}) is much bigger than ${PRED[1]}, so that step multiplies by about ${(PRED[2] / PRED[1]).toFixed(1)}; a term whose reversal is smaller grows by less than 2. The ratio is only a symptom; the reversal is the rule.` },
    { type: 'explain', prompt: 'Why do the terms roughly double, and why is doubling exactly right only at a palindrome?', model: 'A number and its reversal have the same number of digits, so adding them gives roughly twice the number; the ratio is above 2 when the reversal is bigger and below 2 when it is smaller. Only when the number reads the same backwards is the reversal equal to the number, so only then is the step exactly 2 × last.', points: ['Same number of digits, so the sum is about double', 'The ratio depends on whether the reversal is bigger or smaller', 'Exact doubling happens only for palindromes'] },

    S('worked'),
    { type: 'worked', family: 'reverse-digits', section: 'nl', difficulty: 4, seed: 'a', explainAt: [1], intro: 'A two-digit start. Match two gaps to reversals before opening the solution.' },
    { type: 'worked', family: 'reverse-digits', section: 'nl', difficulty: 5, seed: 'b', fade: 1, intro: 'A three-digit start. The matching is given; the last reversal is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 4))}, ? Will the next term be about double ${PRED[3]}, or much more? Commit, then give it.`, answer: `Much more: ${PRED[3]} backwards is ${rv(PRED[3])}, far bigger than ${PRED[3]}, so the next term is ${PRED[3]} + ${rv(PRED[3])} = ${PRED[4]}.`, explain: 'The size of the step depends on the reversal, not on a fixed ratio.' },

    S('traps'),
    { type: 'traps', family: 'reverse-digits', section: 'nl', extra: [
      { belief: 'A doubling step means the rule is doubling.', fix: 'That step started from a palindrome. Check the other steps: they add the reversal.' },
      { belief: 'Reverse the term before the last.', fix: 'Each gap belongs to the term on its left. Reverse the last term.' },
      { belief: 'The ratio is near 2, so multiply by 2.', fix: 'Near 2 is not 2. Compute the reversal and add.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `${ERR[0]} + ${rv(ERR[0])} = ${ERR[1]} and ${ERR[1]} + ${rv(ERR[1])} = ${ERR[2]}: add the reversal.`,
      `${ERR[2]} + ${ERR[2]} = ${ERR[3]}: from here on the terms double.`,
      `So the next term is 2 × ${ERR[4]} = ${2 * ERR[4]}.`,
      `Answer: ${2 * ERR[4]}.`,
    ], errorStep: 1, explain: `${ERR[2]} doubled only because it is a palindrome. The rule is still reverse-and-add: ${ERR[3]} + ${rv(ERR[3])} = ${ERR[4]}, and next ${ERR[4]} + ${rv(ERR[4])} = ${ERR[5]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = pals(rng, false), xs = p.xs, a = xs[4], b = xs[3]; return pick(rng, nextQ(xs.slice(0, 5)), xs[5], [[2 * a, `doubled ${a}; that only works for palindromes, and ${a} backwards is ${rv(a)}`], [a + rv(b), `added the reversal of the term before the last (${rv(b)})`], [2 * rv(a), 'doubled the reversal instead of adding it to the original'], [a + (a - b), 'repeated the last gap']], `${a} + ${rv(a)} = ${xs[5]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Last-digit check: the answer ends in the last digit of (last digit + first digit) of the last term, because those two digits are added in the units column. One glance removes most wrong options.' },
    { type: 'callout', tone: 'speed', text: 'Reverse from the right: read the digits of the last term from its end and write them down, then add column by column. Test one earlier gap first, then answer: about 20 seconds. If the first gap you test is not a reversal, stop and go back to the ladder of tests.' },
    { type: 'thinkaloud', problem: nextQ(E1.slice(0, 5)), lines: [
      { t: 0, say: `Ratios roughly 2: ${E1.slice(1, 5).map((v, i) => (v / E1[i]).toFixed(1)).join(', ')}.` },
      { t: 3, say: `Call it doubling: 2 × ${E1[4]} = ${2 * E1[4]}.`, slip: true },
      { t: 6, say: `But ${E1[1]} to ${E1[2]} is × ${(E1[2] / E1[1]).toFixed(1)}: not doubling. Check the gaps instead.` },
      { t: 10, say: `First gap ${g(E1)[0]}: that is ${E1[0]} backwards. Second gap ${g(E1)[1]}: ${E1[1]} backwards. Reverse and add.` },
      { t: 15, say: `Last term ${E1[4]}, backwards ${rv(E1[4])}. Sum: ${E1[5]}.` },
      { t: 19, say: `Last digit check: ${E1[4] % 10} + ${String(E1[4])[0]} ends in ${(E1[4] % 10 + +String(E1[4])[0]) % 10}, and ${E1[5]} ends in ${E1[5] % 10}. Answer ${E1[5]}.` },
    ] },
    { type: 'check', scope: 'the last-digit check', questions: [
      { make: (rng) => { const p = pals(rng, false), xs = p.xs, a = xs[4], t = xs[5], ld = (a % 10 + +String(a)[0]) % 10; return pick(rng, `${seq(xs.slice(0, 5))}, ? Using only the last-digit check, which option can be right?`, t, [[2 * a, `${2 * a} ends in ${(2 * a) % 10}, but ${a % 10} + ${String(a)[0]} ends in ${ld}`], [t + 1, `${t + 1} ends in ${(t + 1) % 10}, not ${ld}`], [t + 10 * (ld === 0 ? 1 : -1) + 1, `ends in ${(t + 1) % 10}: the units digit must be ${ld}`]], `${a} + ${rv(a)} = ${t}, ending in ${ld}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Near-doubling that wanders (exact at palindromes) → gap = previous term backwards → next = last + reverse(last).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Ratios', 'Rule', 'Next'], rows: [
      [seq(DBL.slice(0, 4)), 'exactly 2', 'double', String(DBL[4])],
      [seq(AF.slice(0, 4)), AF.slice(1, 4).map((v, i) => (v / AF[i]).toFixed(2)).join(', '), `2 × last + ${AF[1] - 2 * AF[0]}: the ratio settles`, String(AF[4])],
      [seq(CH.slice(0, 4)), CH.slice(1, 4).map((v, i) => (v / CH[i]).toFixed(2)).join(', '), 'add the reversal: the ratio wanders', String(CH[4])],
      [seq(DS.slice(0, 4)), DS.slice(1, 4).map((v, i) => (v / DS[i]).toFixed(2)).join(', '), 'add the digit sum: small gaps', String(DS[4])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 5))}, ? (add the reversal, next ${CH[5]})`, rows: [
      { change: `Start at ${rv(CH[0])} (the first term backwards)`, same: true, effect: `No change after the first step: ${rv(CH[0])} + ${CH[0]} = ${CH[1]} as well, so the list continues ${seq(rr(rv(CH[0]), 5))} and the next is still ${CH[5]}.` },
      { change: `Start at ${CH[0] + 1}`, effect: `${seq(rr(CH[0] + 1, 5))}: a different list, next ${rr(CH[0] + 1, 6)[5]}.` },
      { change: 'Add the digit sum instead of the reversal', effect: `${seq(DS)}: small gaps, next ${run(CH[0], ds, 6)[5]} (the previous lesson).` },
      { change: 'Drop the first term', same: true, effect: `No change: the rule reads only the last term, so the next is still ${CH[5]}.` },
      { change: `Start at ${CH[0] + 1} and double instead of adding the reversal`, fusion: true, effect: `Doubling ignores the digits, so the new start just scales: ${seq(geo(CH[0] + 1, 2, 5))}, next ${geo(CH[0] + 1, 2, 6)[5]}, far from ${rr(CH[0] + 1, 6)[5]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a trailing 0 vanishes when reversed (${10 * 12} backwards is ${rv(120)}), so these items avoid terms ending in 0. Palindromes double exactly (${seq(rr(16, 6))} ends in a run of doublings once it reaches ${rr(16, 6)[4]}).` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: reverse-and-add is the classic route to palindromes (most starts reach one within a few steps, and 196 famously never seems to). Any rule that reads the digits rather than the size of a number needs a digit view, not algebra.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const xs = t === 0 ? draw(rng, 4).xs.slice(0, 5) : t === 1 ? affine(rng.int(3, 9), 2, rng.int(1, 5), 5) : run(rng.int(20, 60), ds, 5); const names = ['add the reversal', '2 × last + a constant', 'add the digit sum']; const trp = [[null, `2 × ${xs[3]} + ${xs[1] - 2 * xs[0]} = ${2 * xs[3] + xs[1] - 2 * xs[0]}, not ${xs[4]}`, `the gaps are as large as the terms, far above a digit sum`], [`${xs[3]} + ${rv(xs[3])} = ${xs[3] + rv(xs[3])}, not ${xs[4]}`, null, 'the gaps double; digit sums stay small'], [`${xs[3]} + ${rv(xs[3])} = ${xs[3] + rv(xs[3])}, not ${xs[4]}`, 'the ratios are near 1, not 2', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), 'Test each rule on the last step.'); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = pals(rng, false), xs = p.xs; return num(`Each day a number grows by itself written backwards: ${seq(xs.slice(0, 5))}. What is it next?`, xs[5], `${xs[4]} + ${rv(xs[4])} = ${xs[5]}.`, ['Compare each jump with the number before it, read backwards.', 'Reverse the last number and add.']); } },
      far: { type: 'number', q: `Reverse-and-add from ${PAL0}: ${PAL0} + ${rv(PAL0)} = ${PAL0 + rv(PAL0)}, then ${PAL0 + rv(PAL0)} + ${rv(PAL0 + rv(PAL0))}, and so on. After how many steps is the result a palindrome (the same read backwards) for the first time?`, answer: PSTEPS.length - 1, explain: `${seq(PSTEPS)}: ${PSTEPS[PSTEPS.length - 1]} reads the same both ways after ${PSTEPS.length - 1} steps.`, hints: ['Keep adding each number to its reversal.', 'Stop when the number reads the same backwards.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the palindrome hunt?', options: ['Each step adds the number written backwards', 'Each step doubles the number exactly', 'Each step adds the sum of the digits', 'Each step multiplies by a fixed ratio'], answer: 0, traps: { 1: `${PSTEPS[1]} is not double ${PSTEPS[0]}`, 2: `the steps are as big as the numbers, far above a digit sum`, 3: `the ratios ${PSTEPS.slice(1).map((v, i) => (v / PSTEPS[i]).toFixed(2)).join(', ')} differ` }, explain: 'The palindrome hunt is reverse-and-add, the rule of this lesson, run until the digits line up.' } },

    S('tryit'),
    { type: 'tryit', family: 'reverse-digits', section: 'nl', count: 3 },
  ],
};
