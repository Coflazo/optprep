// NumberLogic family lesson: add the digit sum (or digit product) of the last term.
// Every number shown is computed here.
import { S, seq, diffs, ladderRows, nextQ, pick, num } from './method-ladder.js';

export const ds = (v) => String(v).split('').reduce((a, b) => a + +b, 0);
export const dp = (v) => String(v).split('').reduce((a, b) => a * +b, 1);
export const run = (a, f, n) => { const o = [a]; while (o.length < n) o.push(o[o.length - 1] + f(o[o.length - 1])); return o; };
const g = (xs) => diffs(xs);
const sumTxt = (v) => `${String(v).split('').join(' + ')} = ${ds(v)}`;
const prodTxt = (v) => `${String(v).split('').join(' × ')} = ${dp(v)}`;

// Starts as in the generator: two-digit starts for the digit sum; for the digit product, starts
// whose first seven terms contain no 0 digit. Starts whose six shown terms also fit a second rule
// (checked with the rule finder in src/sections/nl/solver.js) are skipped.
const SUM_TWO_FACED = new Set([13, 15, 22, 31, 37, 54, 56, 59, 79, 83, 86, 88, 90]);
const PROD_STARTS = [];
for (let a = 10; a <= 999; a++) { let v = a, ok = true; for (let i = 0; i < 7 && ok; i++) { ok = !String(v).includes('0'); v += dp(v); } if (ok && a !== 368) PROD_STARTS.push(a); }
function draw(rng, f = rng.chance(0.6) ? 'sum' : 'prod') {
  for (;;) {
    const a = f === 'sum' ? rng.int(10, 99) : rng.pick(PROD_STARTS), xs = run(a, f === 'sum' ? ds : dp, 8);
    if (f === 'sum' && SUM_TWO_FACED.has(a)) continue;
    // at least three different gaps among the shown ones, so the list cannot pass for a constant gap
    if (xs.slice(0, 7).every((v, i) => i === 0 || v !== xs[i - 1]) && new Set(g(xs.slice(0, 6))).size >= 3) return { f, xs };
  }
}
const F = { sum: ds, prod: dp }, W = { sum: 'digit sum', prod: 'digit product' }, TXT = { sum: sumTxt, prod: prodTxt };

const CH = run(19, ds, 7);
const E1 = run(47, ds, 7);
const E2 = run(12, ds, 8);
const E3 = run(PROD_STARTS[3], dp, 7);
const PRED = run(33, ds, 7);
const ERR = run(64, ds, 7);
const NINE = 8261;
const REV = run(16, (v) => Number(String(v).split('').reverse().join('')), 6);

export default {
  id: 'nl/digit-sum',
  book: 'nl',
  kind: 'family',
  family: 'digit-sum',
  title: 'Add the digit sum (or product)',
  summary: 'Small gaps that jump around with no pattern of their own: compare each gap with the digits of the term before it; next = last + digit sum (or digit product) of last.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic'],
  objectives: [
    'Spot the symptom: small, irregular gaps that no ladder row settles',
    'Match each gap to the digit sum or digit product of the term on its left',
    'Add the digit sum of the **last** term, not an earlier one',
    'Know why digit-product items never contain a 0',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'ladder', label: 'Keep building ladders', approach: `Took the gaps ${seq(g(CH.slice(0, 6)))} and more rows of differences.`, breaksAt: 'The gaps come from the digits, not from a formula, so no row settles.' },
      { id: 'wrong-term', label: 'Use the wrong term', approach: 'Took the digit sum of the term after the gap, or of an earlier term.', breaksAt: 'Each gap belongs to the term on its left.' },
      { id: 'sum-only', label: 'Only ever try sums', approach: 'Kept testing digit sums although the gaps were far too big for them.', breaksAt: 'Gaps above what a digit sum allows point to the digit product.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with rows of differences, once by looking at the digits of each term.`, answer: String(CH[6]), explain: `Differences: ${seq(g(CH.slice(0, 6)))}, then ${seq(g(g(CH.slice(0, 6))))}: nothing settles. Digits: each gap is the digit sum of the term before it (${sumTxt(CH[0])}, ${sumTxt(CH[1])}, …). The digit sum of ${CH[5]} is ${ds(CH[5])}, so the next term is ${CH[6]}.` },
    { type: 'text', text: 'The gaps are **small** compared with the terms and they **jump around** with no pattern of their own. Each gap is computed from the digits of the term before it: usually their sum, sometimes their product.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 6))}, ?`, `What number comes next?  ${seq(PRED.slice(0, 6))}, ?`] },
    { type: 'check', scope: 'the cue: small, patternless gaps from the digits', questions: [
      { make: (rng) => { const p = draw(rng, 'sum'), xs = p.xs.slice(0, 6), b = rng.int(10, 40), ai = [b]; while (ai.length < 6) ai.push(ai[ai.length - 1] + ai.length + 1); return pick(rng, 'In which sequence is every gap the digit sum of the term before it?', seq(xs), [[seq(ai), `its gaps ${seq(g(ai))} count up; ${ai[1]} has digit sum ${ds(ai[1])}, not ${g(ai)[1]}`], [seq(REV.slice(0, 5)), 'its gaps are as large as the terms themselves: each is the term before it written backwards, not a digit sum']], `${seq(xs)}: gaps ${seq(g(xs))} are the digit sums ${seq(xs.slice(0, 5).map(ds))}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: gaps that follow a list (primes, counting numbers) or a gap equal to the term written backwards, as in ${seq(REV.slice(0, 5))}: that gap is as large as the term itself (the reversal lesson).` },
    { type: 'check', scope: 'a gap as big as the term', questions: [
      { type: 'choice', q: '16, 77, 154, 605, 1111: what is each gap?', options: ['the term written backwards', 'the digit sum of the term', 'the next prime number'], answer: 0, traps: { 1: '16 has digit sum 7, but the gap is 61', 2: 'the second gap is 77, which is not prime' }, explain: '16 + 61 = 77, 77 + 77 = 154, 154 + 451 = 605: the reversal lesson.' },
    ] },

    S('why'),
    { type: 'text', text: 'Digit rules resist every difference, ratio and recurrence test, so they are the classic time sink: candidates build ladder after ladder and nothing settles. The symptom (small, jumpy gaps) is quick to learn, and checking one digit sum takes two seconds. Recognise it early and the item is one addition.' },

    S('anchor'),
    { type: 'text', text: 'A constant-gap sequence adds the same d every time. This family changes **one thing**: d is recomputed at every step from the digits of the current term. The rule still reads only the last term.' },
    { type: 'check', scope: 'computing a digit sum', questions: [
      { make: (rng) => { const v = rng.int(100, 999); return num(`What is the digit sum of ${v}?`, ds(v), `${sumTxt(v)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Write each term, its digits and their sum in a row. The sum on each row is exactly the gap to the next term. A chart makes the match visible: the gap bars and the digit-sum bars have identical heights.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'digit sum', 'term + digit sum', 'next term'], rows: CH.slice(0, 5).map((v, i) => [String(v), sumTxt(v), String(v + ds(v)), String(CH[i + 1])]) }, caption: `${seq(CH.slice(0, 6))}: on every row, term + digit sum = next term. Next: ${CH[5]} + ${ds(CH[5])} = ${CH[6]}.` },
    { type: 'check', scope: 'term + digit sum = next term', questions: [
      { make: (rng) => { const p = draw(rng, 'sum'), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `Digit sum of ${xs[5]}: ${sumTxt(xs[5])}; ${xs[5]} + ${ds(xs[5])} = ${xs[6]}.`, ['Compare each gap with the digits of the term before it.', 'Add the digit sum of the last term.']); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Gaps of ${seq(CH.slice(0, 6))} against digit sums`, xLabel: 'step', yLabel: 'size', categories: g(CH.slice(0, 6)).map((_, i) => String(i + 1)), series: [{ name: 'gap', values: g(CH.slice(0, 6)) }, { name: 'digit sum of the left term', values: CH.slice(0, 5).map(ds) }], valueLabels: true }, caption: 'Each pair of bars is identical: the gap into a term is the digit sum of the term before it. Note the drop after a carry (a term ending in 9 moves to a new ten, and its digit sum collapses).' },
    { type: 'check', scope: 'the drop after a carry', questions: [
      { type: 'choice', q: 'In a digit-sum list the gap after 59 is 14, then the next gap is small. Why the drop?', options: ['59 + 14 = 73: a new ten, smaller digits', 'the rule switched to digit products', 'the list hit a prime number'], answer: 0, traps: { 1: 'one list never mixes sums and products', 2: 'primes play no part in the rule' }, explain: 'Crossing into a new ten resets the tens digit, so the digit sum collapses.' },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CH.slice(0, 6), 2) }, caption: `The ladder view of the same list: gaps ${seq(g(CH.slice(0, 6)))}, second row ${seq(g(g(CH.slice(0, 6))))}. No row settles, and none will: the gaps come from the digits, not from a formula.` },
    { type: 'check', scope: 'the gap is the digit sum of the left term', questions: [
      { make: (rng) => { for (;;) { const xs = draw(rng, 'sum').xs.slice(0, 6), i = rng.int(1, 3); if (ds(xs[i + 1]) === g(xs)[i] || ds(xs[i - 1]) === g(xs)[i]) continue; return pick(rng, `In ${seq(xs)}, the gap from ${xs[i]} to ${xs[i + 1]} is ${g(xs)[i]}. Which digits give it?`, `the digits of ${xs[i]} (${sumTxt(xs[i])})`, [[`the digits of ${xs[i + 1]} (${sumTxt(xs[i + 1])})`, 'the gap is built from the term before it, not after it'], [`the digits of ${xs[i - 1]} (${sumTxt(xs[i - 1])})`, 'that is one term too early']], `${xs[i]} + ${ds(xs[i])} = ${xs[i + 1]}.`); } } },
    ] },

    S('derivation'),
    { type: 'text', text: `A product example to keep in mind: ${seq(E3.slice(0, 6))}. The gaps ${seq(g(E3.slice(0, 6)))} do not match the digit sums (${sumTxt(E3[0])}, not ${g(E3)[0]}), but they match the products: ${prodTxt(E3[0])}, ${prodTxt(E3[1])}. Next: ${prodTxt(E3[5])}, so ${E3[5]} + ${dp(E3[5])} = ${E3[6]}. The moves below apply to both versions.` },
    { type: 'steps', steps: [
      { answers: 'ladder', say: 'Take the gaps and one more row. Small gaps that jump around and a second row that never settles are the symptom.', why: 'Every formula-based rule shows a pattern within two rows. Digit rules do not, because they depend on the digits, not the position.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 6); return pick(rng, `${seq(xs)}: gaps ${seq(g(xs))}, second row ${seq(g(g(xs)))}. What next?`, 'check the digits', [['take a third row', 'the second row is noise; a third will be too'], ['divide neighbours', `the ratios ${xs.slice(1, 3).map((v, i) => Math.round((100 * v) / xs[i]) / 100).join(', ')} are close to 1 and drift`]], 'Small, jumpy gaps point to the digits.'); } },
        ] },
      { say: 'Compute the digit sum of a term: add its digits.', why: 'It is the candidate gap. For a two-digit number it is at most 18, which is why the gaps stay small.',
        checks: [
          { make: (rng) => { const p = draw(rng, 'sum'), v = p.xs[rng.int(2, 4)]; return num(`What is the digit sum of ${v}?`, ds(v), `${sumTxt(v)}.`); } },
        ] },
      { answers: 'wrong-term', say: 'Compare each gap with the digit sum of the term on its **left**. If they match on every step, the rule is "add the digit sum".', why: 'The rule builds the next term from the current one, so the gap after a term belongs to that term.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), p = draw(rng, 'sum'), xs = p.xs.slice(0, 6); if (!yes) xs[5] += rng.pick([1, 2, -1]); return pick(rng, `Is every gap of ${seq(xs)} the digit sum of the term before it?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every gap matches' : `${xs[4]} has digit sum ${ds(xs[4])}, but the last gap is ${xs[5] - xs[4]}`]], `Digit sums ${seq(xs.slice(0, 5).map(ds))} against gaps ${seq(g(xs))}.`); } },
        ] },
      { say: 'Next = last + digit sum of the last term.', why: 'Only the last term is used; the digit sum of any earlier term is irrelevant now.',
        checks: [
          { make: (rng) => { const p = draw(rng, 'sum'), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `${sumTxt(xs[5])}; ${xs[5]} + ${ds(xs[5])} = ${xs[6]}.`, ['Check the digit sum on two gaps.', 'Add the digit sum of the last term.']); } },
        ] },
      { answers: 'sum-only', say: 'If the gaps are too big for a digit sum, try the digit **product**: multiply the digits instead.', why: `The product of digits can be much larger than their sum (7 × 8 = ${7 * 8}), which fits bigger jumps.`,
        checks: [
          { make: (rng) => { const p = draw(rng, 'prod'), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `Gaps ${seq(g(xs.slice(0, 6)))} are the digit products. ${prodTxt(xs[5])}; ${xs[5]} + ${dp(xs[5])} = ${xs[6]}.`, ['Multiply the digits of a term and compare with the gap after it.', 'Add the digit product of the last term.']); } },
        ] },
    ] },
    { type: 'text', text: 'Sum or product? Decide from the first gap you check. If the gap equals the digit sum, stay with sums; if it is larger than any digit sum could be, multiply the digits. Never mix the two within one list: every step uses the same operation on the digits.' },
    { type: 'check', scope: 'sum or product', questions: [
      { type: 'number', q: 'What comes next?  26, 38, 62, 74, ?', answer: 102, explain: 'The first gap 12 is 2 × 6, not 2 + 6: products. 7 × 4 = 28, so 74 + 28 = 102.' },
    ] },
    { type: 'explain', prompt: 'Why does no row of differences ever settle for a digit rule, and why must the digit sum come from the last term?', model: 'The gap is computed from the digits of the current term, which change irregularly (a carry resets them), so the gaps follow no formula in the position and every difference row stays noisy. The rule makes each term from the one before it, so the next term needs the digit sum of the last term; an earlier term\'s digit sum was already used for an earlier gap.', points: ['The gaps depend on digits, not on the position', 'Carries make the gaps jump, so no row settles', 'Each gap belongs to the term on its left: use the last term'] },

    S('worked'),
    { type: 'worked', family: 'digit-sum', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'A digit sum rule. Match two gaps before opening the solution.' },
    { type: 'worked', family: 'digit-sum', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'A digit product rule. The matching is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? Before adding: will the next gap be bigger or smaller than the last one (${g(PRED)[4]})?`, answer: `${ds(PRED[5]) > g(PRED)[4] ? 'Bigger' : 'Smaller'}: the digit sum of ${PRED[5]} is ${sumTxt(PRED[5])}, so the next term is ${PRED[6]}.`, explain: 'A digit sum can go up or down from one step to the next; it follows the digits, not a trend.' },

    S('traps'),
    { type: 'traps', family: 'digit-sum', section: 'nl', extra: [
      { belief: 'Use the digit sum of the term before the last one.', fix: 'Each gap belongs to the term on its left. The next gap comes from the last term.' },
      { belief: 'The gaps look random, so guess the average gap.', fix: 'Random-looking small gaps are the symptom of a digit rule: test it.' },
      { belief: 'A digit product can contain 0.', fix: 'A 0 digit makes the product 0 and the list stalls, so product items avoid zeros.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `The gaps ${seq(g(ERR.slice(0, 6)))} are small and jumpy.`,
      `They are digit sums: ${sumTxt(ERR[0])}, ${sumTxt(ERR[1])}, and so on.`,
      `The last gap was ${g(ERR)[4]}, the digit sum of ${ERR[4]}, so the next gap is the digit sum of ${ERR[4]} again: ${ERR[5]} + ${ds(ERR[4])} = ${ERR[5] + ds(ERR[4])}.`,
      `Answer: ${ERR[5] + ds(ERR[4])}.`,
    ], errorStep: 2, explain: `The next gap belongs to the **last** term, ${ERR[5]}: ${sumTxt(ERR[5])}, so the answer is ${ERR[5]} + ${ds(ERR[5])} = ${ERR[6]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), f = F[p.f], xs = p.xs, a = xs[5], b = xs[4], o = p.f === 'sum' ? 'prod' : 'sum'; return pick(rng, nextQ(xs.slice(0, 6)), xs[6], [[a + f(b), `added the ${W[p.f]} of ${b}, the term before the last`], [a + F[o](a), `added the ${W[o]}; the gaps match the ${W[p.f]}`], [a + f(a) + 1, `off by one: the ${W[p.f]} of ${a} is ${f(a)}`], [a + (a - b), 'repeated the last gap']], `${TXT[p.f](a)}; ${a} + ${f(a)} = ${xs[6]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Test one gap, then one more: two matching digit sums are enough. The digit sum of a two-digit number is at most 18, so a gap above 18 before three-digit terms points to the product instead.' },
    { type: 'check', scope: 'two matches, then answer', questions: [
      { make: (rng) => { const p = draw(rng), f = F[p.f], xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `${W[p.f]} rule: ${TXT[p.f](xs[5])}; ${xs[5]} + ${f(xs[5])} = ${xs[6]}.`, ['Match one gap to the digits of the term before it, then one more.', 'Sum or product? Apply it to the last term.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Watch the carries: when a term crosses into a new ten or hundred (… 59 to 73, … 98 to 115), its digit sum collapses and the next gap drops. A sudden small gap after a big one is the fingerprint.' },
    { type: 'thinkaloud', problem: nextQ(E1.slice(0, 6)), lines: [
      { t: 0, say: `Gaps ${seq(g(E1.slice(0, 6)))}: small next to the terms, and jumpy. Ladders will not help.` },
      { t: 4, say: `Digits of ${E1[0]}: ${sumTxt(E1[0])}, the first gap. Digits of ${E1[1]}: ${sumTxt(E1[1])}, the second gap. Add the digit sum.` },
      { t: 9, say: `The last gap, ${g(E1)[4]}, came from ${E1[4]}. Add it again: ${E1[5] + ds(E1[4])}.`, slip: true },
      { t: 13, say: `No: each gap comes from the term on its left, so the next gap comes from ${E1[5]}: ${sumTxt(E1[5])}.` },
      { t: 17, say: `${E1[5]} + ${ds(E1[5])} = ${E1[6]}. Answer ${E1[6]}.` },
    ] },
    { type: 'check', scope: 'carries, and the think-aloud', questions: [
      { type: 'number', q: 'In a digit-sum list, which gap follows the term 99?', answer: 18, explain: '9 + 9 = 18; the next term 117 has digit sum 9, so the gap after it drops.' },
      { type: 'choice', q: 'In the think-aloud, the first try reused the gap 14. What was wrong?', options: ['the next gap comes from 109: 1 + 0 + 9', 'the gaps here are digit products', 'the gap 14 came from 109'], answer: 0, traps: { 1: '4 + 7 = 11 is a sum, so sums it is', 2: '14 came from 95, not 109' }, explain: 'Each gap comes from the term on its left: 109 + 10 = 119.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Small, jumpy gaps → compare each gap with the digit sum (or product) of the term on its left → next = last + digit sum (product) of last.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gap after each term', 'Rule', 'Next'], rows: [
      [seq(CH.slice(0, 5)), 'its digit sum', 'add the digit sum', String(CH[5])],
      [seq(E3.slice(0, 5)), 'its digit product', 'add the digit product', String(E3[5])],
      [seq(REV.slice(0, 4)), 'the term written backwards', 'add the reversal (next lesson)', String(REV[4])],
      [seq(E2.slice(0, 6)), `digit sums that look periodic (${seq(g(E2.slice(0, 5)))})`, 'still the digit sum: a carry breaks the period', String(E2[6])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 6))}, ? (add the digit sum, next ${CH[6]})`, rows: [
      { change: `Start at ${CH[0] + 1} instead of ${CH[0]}`, effect: `${seq(run(CH[0] + 1, ds, 6))}: a different list, next ${run(CH[0] + 1, ds, 7)[6]}. The rule is the same; the digits decide every gap.` },
      { change: 'Add the digit product instead of the digit sum', effect: `${seq(run(CH[0], dp, 6))}: once a term contains a 0, the product is 0 and the list stalls. That is why product items avoid zeros.` },
      { change: `Start at ${ERR[0]}`, effect: `${seq(run(ERR[0], ds, 7))}, next ${run(ERR[0], ds, 8)[7]}. Different starts can later join the same list, because different terms can share a digit sum.` },
      { change: 'Drop the first term', same: true, effect: `No change: the rule reads only the last term, so the next is still ${CH[6]}.` },
      { change: `Start at ${CH[0] + 2} and add the digit product`, fusion: true, effect: `${seq(run(CH[0] + 2, dp, 7))}: the product rule grows faster than the sum rule until a 0 digit appears, and then the list stalls for good.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: gaps can look periodic for a while (${seq(E2.slice(0, 6))} has gaps ${seq(g(E2.slice(0, 6)))}), but the next carry breaks the pattern (${E2[6]} + ${ds(E2[6])} = ${E2[7]}). A digit product with a 0 digit stalls the list, so those items never contain a 0.` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 1), p = draw(rng, t === 0 ? 'sum' : 'prod'), xs = p.xs.slice(0, 6), names = ['the digit sum', 'the digit product']; return pick(rng, `${seq(xs)}: each gap is what of the term before it?`, names[t], [[names[1 - t], `${xs[2]} has ${W[t === 0 ? 'prod' : 'sum']} ${F[t === 0 ? 'prod' : 'sum'](xs[2])}, but the gap after it is ${xs[3] - xs[2]}`], ['the term written backwards', 'a reversal is as large as the term; these gaps are small']], `${TXT[p.f](xs[2])}, and the gap is ${xs[3] - xs[2]}.`); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a number and its digit sum leave the same remainder when divided by 9 (casting out nines). That is why digit sums appear in divisibility tests and in check digits on account numbers.' },
    { type: 'transfer',
      near: { make: (rng) => { const p = draw(rng, 'sum'), xs = p.xs; return num(`A counter adds the sum of its own digits at every tick: ${seq(xs.slice(0, 6))}. What does it show next?`, xs[6], `${sumTxt(xs[5])}; ${xs[5]} + ${ds(xs[5])} = ${xs[6]}.`, ['Compare each jump with the digits of the reading before it.', 'Add the digit sum of the last reading.']); } },
      far: { type: 'number', q: `A number and its digit sum leave the same remainder when divided by 9. Using digit sums only, what remainder does ${NINE} leave when divided by 9?`, answer: NINE % 9, explain: `${sumTxt(NINE)}, and ${sumTxt(ds(NINE))}. So the remainder is ${NINE % 9}.`, hints: ['Add the digits.', 'Add the digits of that sum again until one digit is left.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the remainder?', options: ['Work from the digits of the number, not its size', 'Take differences until one of the rows is flat', 'Divide neighbours and look for a constant ratio', 'Subtract a constant to reveal a famous list'], answer: 0, traps: { 1: 'no difference row describes a remainder', 2: 'there is no ratio in a single number', 3: 'no famous list is hidden here' }, explain: 'Both the digit-sum rule and the remainder test read the digits of the number; size-based tools do not see them.' } },

    S('tryit'),
    { type: 'tryit', family: 'digit-sum', section: 'nl', count: 3 },
  ],
};
