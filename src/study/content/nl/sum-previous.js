// NumberLogic family lesson: the sum of the previous two (or three) terms, plus a constant.
// Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, fibl } from './method-ladder.js';
import { trib } from './tribonacci.js';

// a(n) = (sum of the previous k terms) + c, k = 2 or 3: the generator's parametrisation.
const sp = (k, c, s, n) => { const o = [...s]; while (o.length < n) { let t = c; for (let j = 1; j <= k; j++) t += o[o.length - j]; o.push(t); } return o.slice(0, n); };
const g = (xs) => diffs(xs);
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const win = (xs, i, k) => xs.slice(i - k, i).reduce((a, b) => a + b, 0);
const miss = (xs, k) => xs.slice(k).map((v, i) => v - win(xs, i + k, k));
const plusC = (c) => (c < 0 ? ` − ${-c}` : ` + ${c}`);

const CHc = 1, CH = sp(2, CHc, [3, 4], 8);
const E1 = sp(2, -2, [5, 6], 7);
const E2 = sp(2, 3, [1, 2], 7);
const E3 = sp(3, 2, [1, 2, 3], 8);
const PREDc = 1, PRED = sp(2, PREDc, [1, 2], 7);
const ERRc = -1, ERR = sp(2, ERRc, [4, 5], 7);
const FB = fibl(3, 5, 7);
const CALLS = sp(2, 1, [1, 1], 7);
const CNT = [2, 3]; while (CNT.length < 7) CNT.push(CNT[CNT.length - 1] + CNT[CNT.length - 2] + CNT.length - 1);

// Level 3 (two-term window, six shown) and level 4 (three-term window, seven shown), as in the
// generator. Parameter sets whose shown terms also fit a second rule (found with the rule finder
// in src/sections/nl/solver.js) are redrawn.
const TWO_FACED = new Set(('2,1|-3 1,2|-2 3,2|-4 1,3|-3 1,3|1 2,3|-1 1,4|-4 1,4|2 3,4|-2 1,5|3 2,5|1 3,5|-1 4,5|-3 1,6|4 2,6|2 4,6|-2 5,6|-4 '
  + '2,1,1|-2 3,1,1|-2 4,1,1|-2 5,1,1|-2 6,1,1|-2 3,2,1|-2 1,2,2|-4 3,2,2|-4 4,2,2|-4 5,2,2|-4 6,2,2|-4 6,4,2|-4 3,2,3|-4').split(' '));
function draw(rng, lvl = rng.pick([3, 4])) {
  const k = lvl === 3 ? 2 : 3, n = lvl === 3 ? 6 : 7;
  for (;;) {
    const c = nz(rng, -4, 4), s = Array.from({ length: k }, () => rng.int(1, 6));
    if (TWO_FACED.has(`${s.join(',')}|${c}`)) continue;
    return { k, c, n, xs: sp(k, c, s, n + 2) };
  }
}
const kw = (k) => (k === 2 ? 'two' : 'three');

export default {
  id: 'nl/sum-previous',
  book: 'nl',
  kind: 'family',
  family: 'sum-previous',
  title: 'Sum of the previous terms, plus a constant',
  summary: 'A sum rule that misses by the same amount on every step is right: that amount c is part of the rule, so next = sum + c.',
  prerequisites: ['nl/method-ladder', 'nl/fibonacci-like', 'nl/tribonacci'],
  objectives: [
    'Measure the miss of a sum rule on every step in seconds',
    'Tell a constant miss (this rule) from a miss that copies earlier terms (a wider window)',
    'Get the sign of the constant right from which side the sum lands on',
    'Give next = sum of the window + c',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'abandon', label: 'Drop the sum at a miss', approach: `Saw ${CH[3]} + ${CH[4]} miss ${CH[5]} and moved on to ratios.`, breaksAt: 'The miss is the same on every step, so it is a constant in the rule.' },
      { id: 'window', label: 'Stick to two terms', approach: 'Kept testing the two-term sum while its misses changed.', breaksAt: 'Changing misses can mean a wider window: test three terms.' },
      { id: 'sign', label: 'Flip the sign of c', approach: 'Took c = sum − term instead of term − sum.', breaksAt: 'If the sum overshoots the term, c is negative.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once by adding the last two terms, once by checking what that sum misses on the shown steps.`, answer: String(CH[6]), explain: `Plain sum: ${CH[4]} + ${CH[5]} = ${CH[4] + CH[5]}. But on the shown steps the sum always misses by ${CH[2] - CH[1] - CH[0]}: ${CH[0]} + ${CH[1]} = ${CH[0] + CH[1]} against ${CH[2]}, ${CH[3]} + ${CH[4]} = ${CH[3] + CH[4]} against ${CH[5]}. So next = ${CH[4]} + ${CH[5]}${plusC(CHc)} = ${CH[6]}.` },
    { type: 'text', text: 'Each term is the sum of the previous two (or three) terms **plus the same constant c**. The plain sum rule misses on every step, but always by the same amount, and that constant miss is part of the rule rather than a sign that the idea was wrong.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 7))}, ?`] },
    { type: 'text', text: `Not this lesson: an exact sum (${seq(FB.slice(0, 6))}, the miss is 0), a miss that copies earlier terms (a wider window: the three-term lesson) or a miss that counts up, as in ${seq(CNT.slice(0, 6))} (misses ${seq(miss(CNT.slice(0, 6), 2))}).` },
    { type: 'check', scope: 'the cue: a constant miss', questions: [
      { make: (rng) => { const p = draw(rng, 3), f = fibl(rng.int(1, 5), rng.int(6, 9), 6), q = [rng.int(1, 4), rng.int(5, 8)]; while (q.length < 6) q.push(q[q.length - 1] + q[q.length - 2] + q.length - 1); return pick(rng, 'Which sequence is "sum of the previous two, plus a constant"?', seq(p.xs.slice(0, 6)), [[seq(f), 'the sum is exact on every step: the constant is 0 (the Fibonacci lesson)'], [seq(q), `its misses ${seq(miss(q, 2))} count up, they are not constant`]], `Misses of ${seq(p.xs.slice(0, 6))}: ${seq(miss(p.xs.slice(0, 6), 2))}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'This family punishes a habit: dropping a rule at the first miss. A sum that is off by exactly one on every step is almost right, and the "almost" is a constant you can read off. Candidates who abandon the sum burn a minute on ratios; candidates who measure the miss finish in fifteen seconds. The dropped constant is always among the options.' },

    S('anchor'),
    { type: 'text', text: 'In the Fibonacci lesson, next = last + second-last. This family changes **one thing**: after adding, add the same constant c. The multiply-then-add lesson did the same to geometric sequences; here it is done to a sum.' },
    { type: 'check', scope: 'sum, then add c', questions: [
      { make: (rng) => { const x = rng.int(10, 40), y = rng.int(20, 60), c = nz(rng, -5, 5); return num(`The last two terms are ${x} and ${y}. The rule adds them, then ${c < 0 ? 'subtracts' : 'adds'} ${Math.abs(c)}. What comes next?`, x + y + c, `${x} + ${y} = ${x + y}, then ${sgn(c)}: ${x + y + c}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Line up the plain sum against the actual term and write the miss in a last column. For this family the miss column is constant. That column is the whole proof. The bar chart after it compares the three shapes a miss column can take, because each shape sends you to a different rule.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term n − 2', 'term n − 1', 'their sum', 'term n', 'miss'], rows: E1.slice(2, 6).map((v, i) => [String(E1[i]), String(E1[i + 1]), String(E1[i] + E1[i + 1]), String(v), sgn(v - E1[i] - E1[i + 1])]) }, caption: `${seq(E1.slice(0, 6))}: the sum misses by ${sgn(miss(E1, 2)[0])} every time, so c = ${neg(miss(E1, 2)[0])} and next = ${E1[4]} + ${E1[5]}${plusC(miss(E1, 2)[0])} = ${E1[6]}.` },
    { type: 'check', scope: 'the miss column', questions: [
      { make: (rng) => { const p = draw(rng, 3); return num(`${seq(p.xs.slice(0, 6))}: what is the miss, term − (sum of the two before), on the last step?`, p.c, `${neg(p.xs[5])} − (${neg(p.xs[3])} + ${par(p.xs[4])}) = ${neg(p.c)}.`, ['Add the two terms before the last one.', 'Subtract that sum from the last term.']); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Miss of the two-term sum, step by step', xLabel: 'step', yLabel: 'miss', categories: miss(CH.slice(0, 6), 2).map((_, i) => String(i + 3)), series: [{ name: 'this family', values: miss(CH.slice(0, 6), 2) }, { name: 'a wider window', values: miss(trib(1, 2, 4, 6), 2) }, { name: 'a counting miss', values: miss(CNT.slice(0, 6), 2) }], valueLabels: true }, caption: `Three kinds of miss. Flat (${seq(miss(CH.slice(0, 6), 2))}): add a constant, this lesson. Copies earlier terms (${seq(miss(trib(1, 2, 4, 6), 2))}): widen the window. Counts up (${seq(miss(CNT.slice(0, 6), 2))}): the extra part follows its own sequence.` },
    { type: 'check', scope: 'three kinds of miss', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) xs = draw(rng, 3).xs.slice(0, 6); else if (t === 1) { const a = rng.int(1, 4); xs = trib(a, a + rng.int(1, 3), a + rng.int(5, 8), 6); } else { xs = [rng.int(1, 4), rng.int(5, 8)]; while (xs.length < 6) xs.push(xs[xs.length - 1] + xs[xs.length - 2] + xs.length - 1); } const names = ['add a constant after the sum', 'widen the window to three terms', 'the extra part counts up']; const m = miss(xs, 2); return pick(rng, `The misses of the two-term sum in ${seq(xs)} are ${seq(m)}. What do they say?`, names[t], names.map((nm, i) => [nm, i === 0 ? 'the misses are not all equal' : i === 1 ? `the misses do not copy the earlier terms ${seq(xs.slice(0, 4))}` : 'the misses do not rise by 1 each step']).filter((_, i) => i !== t), `Misses: ${seq(m)}.`); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CH.slice(0, 6), 1) }, caption: `The gap view of ${seq(CH.slice(0, 6))}: gaps ${seq(g(CH.slice(0, 6)))}. Each gap is the term two places back plus ${CHc} (${seq(CH.slice(0, 4).map((v) => v + CHc))}): the Fibonacci fingerprint, shifted by c.` },

    S('derivation'),
    { type: 'text', text: `A three-term example first: ${seq(E3.slice(0, 7))}. The two-term misses are ${seq(miss(E3.slice(0, 7), 2))}: they change. The three-term misses are ${seq(miss(E3.slice(0, 7), 3))}: constant. So the window is three wide and c = ${miss(E3, 3)[0]}, giving ${E3[4]} + ${E3[5]} + ${E3[6]}${plusC(miss(E3, 3)[0])} = ${E3[7]}. The moves below make each of those decisions separately.` },
    { type: 'steps', steps: [
      { say: 'Test the plain two-term sum on the last shown step and write the miss: term − (sum of the two before).', why: 'The sum is the natural rule to try once the gaps and ratios fail. Measuring the miss keeps the information a failed test gives you.',
        checks: [
          { make: (rng) => { const p = draw(rng, 3); return num(`${seq(p.xs.slice(0, 6))}: what is ${neg(p.xs[5])} − (${neg(p.xs[3])} + ${par(p.xs[4])})?`, p.c, `${neg(p.xs[5])} − ${par(p.xs[3] + p.xs[4])} = ${neg(p.c)}.`); } },
        ] },
      { answers: 'abandon', say: 'Write the miss on every step. If it is the same number c each time, the rule is the sum plus c.', why: 'One miss always exists. Equal misses on every step turn a coincidence into a rule.',
        checks: [
          { make: (rng) => { const same = rng.chance(0.5); let xs; if (same) xs = draw(rng, 3).xs.slice(0, 6); else { xs = [rng.int(1, 4), rng.int(5, 8)]; while (xs.length < 6) xs.push(xs[xs.length - 1] + xs[xs.length - 2] + xs.length - 1); } const m = miss(xs, 2); return pick(rng, `${seq(xs)}: is the miss of the two-term sum the same on every step?`, same ? 'Yes' : 'No', [[same ? 'No' : 'Yes', same ? `every miss is ${neg(m[0])}` : `the misses are ${seq(m)}: check all of them`]], `Misses: ${seq(m)}.`); } },
        ] },
      { answers: 'window', say: 'If the two-term misses change, try three terms: the three-term misses may be the constant ones.', why: 'The window can be two or three terms wide. The right window is the one whose misses are all equal.',
        checks: [
          { make: (rng) => { const p = draw(rng, 4), xs = p.xs.slice(0, 7); return pick(rng, `${seq(xs)}: two-term misses ${seq(miss(xs, 2))}, three-term misses ${seq(miss(xs, 3))}. Which window?`, 'three terms, plus a constant', [['two terms, plus a constant', `the two-term misses ${seq(miss(xs, 2))} change`], ['three terms, exact', `the three-term misses are ${neg(p.c)}, not 0`]], `Three-term misses are all ${neg(p.c)}.`); } },
        ] },
      { answers: 'sign', say: 'Read the sign of c from which side the sum lands on: sum above the term means c is negative; sum below means c is positive.', why: 'c = term − sum. A sign slip here produces an option that is off by exactly 2c.',
        checks: [
          { make: (rng) => { let p; do p = draw(rng); while (p.c > 0); const xs = p.xs.slice(0, p.n); return num(`${seq(xs)} is "sum of the previous ${kw(p.k)} plus c". What is c?`, p.c, `${neg(xs[p.n - 1])} − (${xs.slice(p.n - 1 - p.k, p.n - 1).map(par).join(' + ')}) = ${neg(p.c)}: the sum overshoots, so c is negative.`, ['Add the window before the last term.', 'c = term − sum.']); } },
        ] },
      { say: 'Next = the sum of the last k terms + c.', why: 'The constant belongs to every step, including the next one.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs; return num(nextQ(xs.slice(0, p.n)), xs[p.n], `${xs.slice(p.n - p.k, p.n).map(par).join(' + ')}${plusC(p.c)} = ${neg(xs[p.n])}.`, ['Find the window (two or three terms) whose misses are equal.', 'Sum the last window and add c.']); } },
        ] },
    ] },
    { type: 'text', text: 'Order matters when you test. Start with the two-term window because it is the most common; if its misses change, compute the three-term misses before giving up on sums. Only when neither window gives equal misses do you move on to weights, products or digits.' },
    { type: 'explain', prompt: 'Why is a constant miss part of the rule and not a failed test?', model: 'If term − (sum of the window) is the same c on every step, then term = sum + c on every step: that is a rule that reproduces every shown term. A rule that is wrong misses by amounts that change from step to step; a constant miss is exactly what an added constant looks like.', points: ['term − sum = c on every step means term = sum + c', 'A wrong rule misses by changing amounts', 'The same c applies to the next step'] },

    S('worked'),
    { type: 'worked', family: 'sum-previous', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'A two-term window plus a constant. Measure the miss before opening the solution.' },
    { type: 'worked', family: 'sum-previous', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'A three-term window plus a constant. The window and c are given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? Predict the miss of the two-term sum first, then the next term.`, answer: `The miss is ${sgn(miss(PRED, 2)[0])} every time, so the next term is ${PRED[4]} + ${PRED[5]}${plusC(PREDc)} = ${PRED[6]}.`, explain: `Misses: ${seq(miss(PRED.slice(0, 6), 2))}.` },

    S('traps'),
    { type: 'traps', family: 'sum-previous', section: 'nl', extra: [
      { belief: 'The sum missed, so the rule is not a sum.', fix: 'Measure the miss on every step. A constant miss is a constant in the rule.' },
      { belief: 'c = sum − term.', fix: 'c = term − sum. If the sum overshoots, c is negative.' },
      { belief: 'Any miss means add it once.', fix: 'Only a constant miss is a constant. Misses that copy earlier terms mean a wider window.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `The two-term sums are ${seq(ERR.slice(2, 6).map((_, i) => ERR[i] + ERR[i + 1]))} against the terms ${seq(ERR.slice(2, 6))}.`,
      `They miss by ${-ERRc} every time, so c = ${-ERRc}.`,
      `Next = ${ERR[4]} + ${ERR[5]}${plusC(-ERRc)} = ${ERR[4] + ERR[5] - ERRc}.`,
      `Answer: ${ERR[4] + ERR[5] - ERRc}.`,
    ], errorStep: 1, explain: `The sums overshoot: ${ERR[0]} + ${ERR[1]} = ${ERR[0] + ERR[1]} against ${ERR[2]}. c = term − sum = ${ERRc}, so the next term is ${ERR[4]} + ${ERR[5]}${plusC(ERRc)} = ${ERR[6]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), xs = p.xs, n = p.n, s = xs.slice(n - p.k, n).reduce((a, b) => a + b, 0); return pick(rng, nextQ(xs.slice(0, n)), xs[n], [[s, `summed the previous ${kw(p.k)} but dropped the constant ${sgn(p.c)}`], [s - p.c, `used ${sgn(-p.c)} instead of ${sgn(p.c)}: check which side the sum lands on`], [s + p.c + xs[n - p.k - 1], `summed ${p.k + 1} previous terms instead of ${p.k}`], [xs[n + 1], 'went one step too far: that is the term after the next one']], `Window of ${kw(p.k)}, c = ${neg(p.c)}: ${neg(xs[n])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Measure the miss on the **last** step, then confirm it on one earlier step. Two subtractions decide the rule; one more addition gives the answer.' },
    { type: 'callout', tone: 'speed', text: 'Gap shortcut for a two-term window: every gap equals the term two places back plus c. Compare one gap with its term two back and c falls out.' },
    { type: 'thinkaloud', problem: nextQ(E3.slice(0, 7)), lines: [
      { t: 0, say: `Two-term misses: ${seq(miss(E3.slice(0, 7), 2))}.` },
      { t: 4, say: 'They change, so this is not a sum rule at all. Try ratios.', slip: true },
      { t: 8, say: `Wait: changing two-term misses can mean a wider window. Three-term misses: ${seq(miss(E3.slice(0, 7), 3))}. All ${miss(E3, 3)[0]}.` },
      { t: 14, say: `Window of three, c = ${miss(E3, 3)[0]}. Next: ${E3[4]} + ${E3[5]} + ${E3[6]} = ${E3[4] + E3[5] + E3[6]}, plus ${miss(E3, 3)[0]} is ${E3[7]}.` },
      { t: 19, say: `Trap check: dropping c gives ${E3[4] + E3[5] + E3[6]}; a four-term window gives more. Answer ${E3[7]}.` },
    ] },
    { type: 'check', scope: 'the miss from the last step', questions: [
      { make: (rng) => { const p = draw(rng, 3), xs = p.xs; return num(`${seq(xs.slice(0, 6))}, ? Read the miss on the last step, confirm it once, and answer.`, xs[6], `Miss ${neg(xs[5])} − ${par(xs[3] + xs[4])} = ${neg(p.c)}; next ${neg(xs[4])} + ${par(xs[5])}${plusC(p.c)} = ${neg(xs[6])}.`, ['Last term minus the sum of the two before it.', 'Add the last two terms and that miss.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Sum rule off by the same c on every step → next = sum of the window + c (c = term − sum).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Misses of the two-term sum', 'Rule'], rows: [
      [seq(FB.slice(0, 6)), seq(miss(FB.slice(0, 6), 2)), 'exact sum (Fibonacci)'],
      [seq(CH.slice(0, 6)), seq(miss(CH.slice(0, 6), 2)), `sum${plusC(CHc)} (this lesson)`],
      [seq(trib(1, 2, 4, 6)), seq(miss(trib(1, 2, 4, 6), 2)), 'misses copy earlier terms: three-term sum'],
      [seq(CNT.slice(0, 6)), seq(miss(CNT.slice(0, 6), 2)), 'misses count up: sum + a counting term'],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 6))}, ? (sum of the previous two${plusC(CHc)}, next ${CH[6]})`, rows: [
      { change: `The constant becomes ${-CHc}`, effect: `${seq(sp(2, -CHc, [3, 4], 6))}: the sums now overshoot, next ${sp(2, -CHc, [3, 4], 7)[6]}.` },
      { change: 'The constant becomes 0', effect: `${seq(sp(2, 0, [3, 4], 6))}: the plain Fibonacci rule, next ${sp(2, 0, [3, 4], 7)[6]}.` },
      { change: 'A window of three, same constant and first three terms', effect: `${seq(sp(3, CHc, CH.slice(0, 3), 6))}: next ${sp(3, CHc, CH.slice(0, 3), 7)[6]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the last two terms and c are the same, so the next is still ${CH[6]}.` },
      { change: `A window of three and the constant ${-CHc}, together`, fusion: true, effect: `The wider window makes the terms grow faster, and the negative constant pulls every step down a little: ${seq(sp(3, -CHc, CH.slice(0, 3), 6))}, next ${sp(3, -CHc, CH.slice(0, 3), 7)[6]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a negative c can make early terms shrink or repeat (${seq(sp(2, -3, [2, 3], 5))}); the rule still holds on every step. With a three-term window, the two-term misses copy earlier terms plus c, so always check both windows.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a model that is off by the same amount every time has a missing constant, not a wrong structure. Measure the residual before you throw a model away; a constant residual is an intercept.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { let p; do p = draw(rng); while (p.c > -2); const xs = p.xs; return num(nextQ(xs.slice(0, p.n)), xs[p.n], `Window of ${kw(p.k)}, c = ${neg(p.c)}: ${xs.slice(p.n - p.k, p.n).map(par).join(' + ')} − ${-p.c} = ${neg(xs[p.n])}.`, ['A negative c: the sums overshoot.', 'Sum the window, then subtract.']); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = draw(rng, 3), xs = p.xs; return num(`A club's members each month equal the total of the previous two months plus the same number of walk-ins: ${seq(xs.slice(0, 6))}. How many next month?`, xs[6], `The misses of the two-month sum are all ${neg(p.c)}: ${xs[4]} + ${xs[5]}${plusC(p.c)} = ${xs[6]}.`, ['Measure the miss of the two-month sum.', 'Add the last two months and the miss.']); } },
      far: { type: 'number', q: `A program finds the n-th Fibonacci number by calling itself for n − 1 and n − 2. The total number of calls for n = 1 to 6 is ${seq(CALLS.slice(0, 6))}. How many calls for n = 7?`, answer: CALLS[6], explain: `Each call makes the two smaller calls plus itself: calls(n) = calls(n − 1) + calls(n − 2) + 1. So ${CALLS[5]} + ${CALLS[4]} + 1 = ${CALLS[6]}.`, hints: ['Measure the miss of the two-term sum.', 'The miss is the same every time.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the call counts?', options: ['A miss that never changes is a constant term', 'Every count doubles the count before it', 'The counts have a constant second difference', 'Add the previous three counts every time'], answer: 0, traps: { 1: `${CALLS[4]} is not double ${CALLS[3]}`, 2: `the second row ${seq(diffs(diffs(CALLS.slice(0, 6))))} is not constant`, 3: `${CALLS[2]} + ${CALLS[3]} + ${CALLS[4]} is not ${CALLS[5]}` }, explain: 'The two-term sum always misses the call count by 1, the call itself: a constant term, as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'sum-previous', section: 'nl', count: 3 },
  ],
};
