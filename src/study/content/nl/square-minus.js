// NumberLogic family lesson: square the previous term, then add or subtract a constant.
// Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ratio, nextQ, pick, num, geo, affine } from './method-ladder.js';
import { prod } from './product-recurrence.js';

const sm = (a, c, n) => { const o = [a]; while (o.length < n) o.push(o[o.length - 1] ** 2 + c); return o.slice(0, n); };
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const plusC = (c) => (c < 0 ? ` − ${-c}` : ` + ${c}`);
const digits = (v) => String(Math.abs(v)).length;

// The generator's pools: starts −5..6, constants −9..6 (level 4: |c| ≤ 2, level 5: |c| ≥ 3); the
// first four terms distinct and away from 0 and ±1; five terms shown, four if the sixth passes
// 2 × 10^8. Every pool entry was checked with the rule finder: none fits a second rule.
const showOf = (a, c) => { const t = sm(a, c, 6); if (new Set(t.slice(0, 4)).size < 4 || t.slice(1, 4).some((v) => Math.abs(v) < 2)) return 0; let n = 5; while (n > 4 && Math.abs(t[n]) > 2e8) n--; return Math.abs(t[n]) > 2e8 ? 0 : n; };
const POOL = { 4: [], 5: [] };
for (let a = -5; a <= 6; a++) for (let c = -9; c <= 6; c++) if (c && showOf(a, c)) POOL[Math.abs(c) <= 2 ? 4 : 5].push([a, c]);
function draw(rng, lvl = rng.pick([4, 5])) { const [a, c] = rng.pick(POOL[lvl]), n = showOf(a, c); return { a, c, n, xs: sm(a, c, n + 1) }; }

const CH = sm(2, 1, 5);
const E1 = sm(-1, 4, 5);
const E2 = sm(1, -4, 6);
const E3 = sm(0, 5, 5);
const PRED = sm(1, 3, 5);
const ERRc = -3, ERR = sm(3, ERRc, 5);
const RS = sm(3, 0, 5); // 3, 9, 81, 6561, 3^16
const PR = prod(2, 3, 0, 6), GE = geo(2, 5, 5), AF = affine(2, 5, 1, 5);

export default {
  id: 'nl/square-minus',
  book: 'nl',
  kind: 'family',
  family: 'square-minus',
  title: 'Square the last term, then adjust',
  summary: 'Digit counts double every step: each term is the square of the one before plus a constant c; find c from one step, confirm on another, square the last term and add c.',
  prerequisites: ['nl/method-ladder', 'nl/squares-plus', 'nl/affine-recurrence', 'nl/product-recurrence'],
  objectives: [
    'Recognise squaring growth from digit counts that double',
    'Find the constant as next − previous² and confirm it on a second step',
    'Give last² + c with the sign of c right, using the calculator only for the square',
    'Tell squaring apart from the product of the last two terms',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'ratio', label: 'Chase the ratio', approach: `Divided neighbours: ${CH.slice(1, 4).map((v, i) => (v / CH[i]).toFixed(1)).join(', ')}, and looked for their pattern.`, breaksAt: 'Each ratio is roughly the previous term, so the ratios never settle.' },
      { id: 'product', label: 'Multiply the last two', approach: `Used the product rule: ${CH[2]} × ${CH[3]}.`, breaksAt: 'The last term is multiplied by itself, not by the term before it.' },
      { id: 'one-step', label: 'Trust one leftover', approach: 'Squared one term, found a leftover and answered with it straight away.', breaksAt: 'Any single step has some leftover; only a repeated one is a rule.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 4))}, ? What comes next? Try two ways: once with the ratios, once by comparing each term with the square of the one before.`, answer: String(CH[4]), explain: `Ratios ${CH.slice(1, 4).map((v, i) => ratio(CH[i], v)).join(', ')} explode: no fixed multiplier. Squares: ${CH[0]}² = ${CH[0] ** 2} against ${CH[1]}, ${CH[1]}² = ${CH[1] ** 2} against ${CH[2]}, ${CH[2]}² = ${CH[2] ** 2} against ${CH[3]}: always ${sgn(CH[1] - CH[0] ** 2)}. Next: ${CH[3]}² + ${CH[1] - CH[0] ** 2} = ${CH[4]}.` },
    { type: 'text', text: 'Each term is the **square of the term before it, plus the same constant c** (often ±1 or ±2). The growth is the fastest in the test: the number of digits roughly doubles each step, so four or five terms already reach millions.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 4))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 4))}, ?`] },
    { type: 'text', text: `Not this lesson: the product of the last two terms (${seq(PR.slice(0, 5))}, the previous lesson), a fixed ratio (${seq(GE.slice(0, 4))}) or k × last + c (${seq(AF.slice(0, 4))}), which add a fixed number of digits per step.` },
    { type: 'check', scope: 'the cue: digit counts double', questions: [
      { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 4), ge = geo(rng.int(20, 60), rng.pick([4, 5, 6]), 4), pr = prod(rng.int(3, 5), rng.int(6, 9), 0, 5).slice(1); return pick(rng, 'In which sequence is each term the square of the one before, plus a constant?', seq(xs), [[seq(ge), `every ratio is ${ge[1] / ge[0]}: a fixed multiplier`], [seq(pr), `${pr[1]} × ${pr[2]} = ${pr[3]}: the product of two different terms`]], `${par(xs[1])}² = ${xs[1] ** 2} against ${xs[2]}; ${xs[2]}² = ${xs[2] ** 2} against ${xs[3]}: the same leftover ${sgn(p.c)}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Squaring rules produce the largest numbers on the test and usually sit at the end, where time is short. The calculator is allowed, but it only helps once you know what to type. Recognising the doubling digit count takes a glance; one square and one subtraction then give the constant. The costly mistakes are small ones made at the very end: a dropped constant or a constant with the wrong sign, both of which are always among the options.' },

    S('anchor'),
    { type: 'text', text: 'In the product lesson each term was last × previous. This family changes **one thing**: the last term is multiplied by **itself**, then a constant is added, just as the multiply-then-add lesson added c after multiplying by a fixed k.' },
    { type: 'check', scope: 'square, then add c', questions: [
      { make: (rng) => { const x = rng.int(6, 40), c = rng.pick([-3, -2, -1, 1, 2, 3]); return num(`The last term is ${x}. The rule squares it, then ${c < 0 ? 'subtracts' : 'adds'} ${Math.abs(c)}. What comes next?`, x * x + c, `${x}² = ${x * x}, then ${sgn(c)}: ${x * x + c}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Line up each term with the square of the one before it. The leftover column is constant, and it is the whole rule. The ratio row shows the same fact from another side: each ratio is roughly the previous term, because squaring multiplies a number by itself.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['previous', 'previous²', 'actual next', 'leftover'], rows: E1.slice(0, 4).map((v, i) => [neg(v), String(v * v), String(E1[i + 1]), sgn(E1[i + 1] - v * v)]) }, caption: `${seq(E1.slice(0, 4))}: the leftover is ${sgn(E1[1] - E1[0] ** 2)} every time. Next: ${E1[3]}² ${sgn(E1[1] - E1[0] ** 2)} = ${E1[4]}.` },
    { type: 'check', scope: 'the leftover after squaring', questions: [
      { make: (rng) => { const p = draw(rng); return num(`${seq(p.xs.slice(0, p.n))}: what is the leftover, next − previous², on the last shown step?`, p.c, `${neg(p.xs[p.n - 1])} − ${par(p.xs[p.n - 2])}² = ${neg(p.xs[p.n - 1])} − ${p.xs[p.n - 2] ** 2} = ${neg(p.c)}.`, ['Square the second-last term.', 'Subtract it from the last term.']); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Digits per term of ${seq(CH)}`, xLabel: 'position', yLabel: 'digits', categories: CH.map((_, i) => String(i + 1)), series: [{ name: 'digits', values: CH.map(digits) }], valueLabels: true }, caption: `Digit counts ${seq(CH.map(digits))}: roughly doubling. A product of two terms adds two different lengths; a square adds a length to itself.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [CH.slice(1, 5), CH.slice(2, 5).map((v, i) => ratio(CH[i + 1], v))] }, caption: `Ratios ${CH.slice(2, 5).map((v, i) => Math.round((10 * v) / CH[i + 1]) / 10).join(', ')}: each is close to the term before it (${seq(CH.slice(1, 4))}). The multiplier is the term itself.` },
    { type: 'check', scope: 'digit counts and ratios', questions: [
      { make: (rng) => { const x = rng.int(1000, 9999), c = rng.pick([-2, -1, 1, 2]); return pick(rng, `A squaring rule has last term ${x}. About how many digits will the next term have?`, `${digits(x * x + c)}`, [[`${digits(x) + 1}`, 'one extra digit is what × 10 does; a square about doubles the length'], [`${2 * digits(x) + 2}`, 'too many: a square of a 4-digit number has 7 or 8 digits']], `${x}²${plusC(c)} = ${x * x + c}: ${digits(x * x + c)} digits.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: `The moves on ${seq(E2.slice(0, 5))}: the lengths grow fast, so square. ${par(E2[1])}² = ${E2[1] ** 2} against ${E2[2]}: leftover ${neg(E2[2] - E2[1] ** 2)}. ${E2[2]}² = ${E2[2] ** 2} against ${E2[3]}: leftover ${neg(E2[3] - E2[2] ** 2)} again. Next: ${E2[4]}² = ${E2[4] ** 2}, and ${E2[4] ** 2}${plusC(E2[1] - E2[0] ** 2)} = ${E2[5]}. Notice the first step squared a negative number: the sign disappears, the rule does not change.` },
    { type: 'steps', steps: [
      { answers: 'ratio', say: 'Look at the lengths: if the digit count roughly doubles each step, suspect squaring.', why: 'Squaring a number with d digits gives 2d − 1 or 2d digits. Nothing else in the test grows that fast.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, p.n); return pick(rng, `${seq(xs)}: the digit counts are ${seq(xs.map(digits))}. Which rule should you test first?`, 'last² plus a constant', [['a fixed multiplier', 'a fixed multiplier adds about the same number of digits each step'], ['last plus previous', 'a sum at most adds one digit']], 'Doubling lengths mean squaring.'); } },
        ] },
      { answers: 'product', say: 'Square one term and compare it with the next: the leftover is next − previous².', why: 'Removing the square exposes whatever is added after it.',
        checks: [
          { make: (rng) => { const p = draw(rng); return num(`${seq(p.xs.slice(0, p.n))}: what is ${neg(p.xs[2])} − ${par(p.xs[1])}²?`, p.c, `${par(p.xs[1])}² = ${p.xs[1] ** 2}; ${neg(p.xs[2])} − ${p.xs[1] ** 2} = ${neg(p.c)}.`); } },
        ] },
      { answers: 'one-step', say: 'Confirm the same leftover on a second step.', why: 'One step always produces some leftover. Only an equal leftover on another step proves the rule.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), p = draw(rng), xs = p.xs.slice(0, p.n); if (!yes) xs[3] += rng.pick([1, 2, -1]); const lo = xs.slice(1).map((v, i) => v - xs[i] ** 2); return pick(rng, `${seq(xs)}: is next − previous² the same on every step?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? `every leftover is ${neg(lo[0])}` : `the leftovers are ${seq(lo)}: check each step`]], `Leftovers: ${seq(lo)}.`); } },
        ] },
      { say: 'Next = last² + c. Square with the calculator, then add c.', why: 'The rule reads only the last term, so one square and one addition finish the item.',
        checks: [
          { make: (rng) => { const p = draw(rng); return num(nextQ(p.xs.slice(0, p.n)), p.xs[p.n], `${par(p.xs[p.n - 1])}² = ${p.xs[p.n - 1] ** 2}, and ${p.xs[p.n - 1] ** 2}${plusC(p.c)} = ${p.xs[p.n]}.`, ['Find c from one step and confirm it.', 'Square the last term, then add c.']); } },
        ] },
      { say: 'A negative start or a negative c can make an early term negative; squaring makes every later term positive again.', why: 'A square is never negative, so only the first terms can carry a minus sign; the leftover test works the same.',
        checks: [
          { make: (rng) => { let p; do p = draw(rng); while (!p.xs.slice(0, 2).some((v) => v < 0)); return num(nextQ(p.xs.slice(0, p.n)), p.xs[p.n], `Leftover ${neg(p.xs[2])} − ${par(p.xs[1])}² = ${neg(p.c)}; next ${p.xs[p.n - 1]}²${plusC(p.c)} = ${p.xs[p.n]}.`, ['Square with the sign: (−3)² = 9.', 'Then add c.']); } },
        ] },
    ] },
    { type: 'text', text: 'Why items show only four or five terms: each extra term squares an already large number, so a sixth term would have far too many digits to work with. That leaves two or three steps to find and confirm c, which is exactly enough: one to read the leftover, one or two to check it.' },
    { type: 'explain', prompt: 'Why do the digit counts double, and why is the leftover test more reliable than the ratio?', model: 'Squaring a d-digit number gives about 2d digits, so each step doubles the length; the constant is too small to change that. The ratio is next ÷ previous = previous + c ÷ previous, which drifts with every term, while next − previous² removes the square exactly and leaves c itself.', points: ['A square has about twice the digits', 'ratio = previous + c ÷ previous: it never settles', 'next − previous² = c exactly, the same on every step'] },

    S('worked'),
    { type: 'worked', family: 'square-minus', section: 'nl', difficulty: 4, seed: 'a', explainAt: [1], intro: 'A small constant. Find it from one step and confirm it before opening the solution.' },
    { type: 'worked', family: 'square-minus', section: 'nl', difficulty: 5, seed: 'b', fade: 1, intro: 'A larger constant. The leftover is given; the square is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 4))}, ? Predict the constant from the first step, then the number of digits of the answer.`, answer: `c = ${PRED[1]} − ${PRED[0]}² = ${PRED[1] - PRED[0] ** 2}; ${PRED[3]}² + ${PRED[1] - PRED[0] ** 2} = ${PRED[4]}, ${digits(PRED[4])} digits.`, explain: `Check c on a second step: ${PRED[2]}² + ${PRED[1] - PRED[0] ** 2} = ${PRED[3]}.` },

    S('traps'),
    { type: 'traps', family: 'square-minus', section: 'nl', extra: [
      { belief: 'c = previous² − next.', fix: 'c = next − previous². If the square overshoots the next term, c is negative.' },
      { belief: 'Multiply the last two terms.', fix: 'That is the product rule. Here the last term is multiplied by itself.' },
      { belief: 'One leftover proves the rule.', fix: 'Any single step has some leftover. Confirm it on a second step.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 4))}, ?. One step is wrong.`, steps: [
      `The digit counts ${seq(ERR.slice(0, 4).map(digits))} grow fast: try squaring.`,
      `${ERR[1]}² = ${ERR[1] ** 2} and ${ERR[2]}² = ${ERR[2] ** 2}; the squares overshoot by ${-ERRc}, so c = ${-ERRc}.`,
      `Next = ${ERR[3]}² + ${-ERRc} = ${ERR[3] ** 2 - ERRc}.`,
      `Answer: ${ERR[3] ** 2 - ERRc}.`,
    ], errorStep: 1, explain: `The squares **overshoot**, so the constant is negative: c = ${ERR[2]} − ${ERR[1] ** 2} = ${ERRc}. Next = ${ERR[3]}² − ${-ERRc} = ${ERR[4]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), xs = p.xs, n = p.n, a = xs[n - 1], b = xs[n - 2]; return pick(rng, nextQ(xs.slice(0, n)), xs[n], [[a * a, `squared the last term but forgot the ${sgn(p.c)}`], [a * a - p.c, `applied the constant with the wrong sign (${sgn(-p.c)} instead of ${sgn(p.c)})`], [a * b + p.c, 'multiplied the last two terms; the rule squares the last one'], [2 * a + p.c, 'doubled instead of squaring']], `${a}²${plusC(p.c)} = ${xs[n]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Read c from the **smallest** step (the first two terms), where the square is easy in your head, and confirm it on the next step. Save the calculator for the final square.' },
    { type: 'callout', tone: 'speed', text: 'Last-digit check: the answer ends in the last digit of (last digit of the last term)² + c. With the digit count (about double), that eliminates most wrong options without the full square.' },
    { type: 'thinkaloud', problem: nextQ(E1.slice(0, 4)), lines: [
      { t: 0, say: `Digit counts ${seq(E1.slice(0, 4).map(digits))}: the length jumps fast.` },
      { t: 3, say: `Explosive, so last × previous: ${E1[2]} × ${E1[1]} = ${E1[2] * E1[1]}.`, slip: true },
      { t: 7, say: `That is nowhere near ${E1[3]}. Try squaring instead: ${E1[2]}² = ${E1[2] ** 2}, and ${E1[3]} − ${E1[2] ** 2} = ${E1[3] - E1[2] ** 2}.` },
      { t: 12, say: `Same leftover earlier? ${E1[1]}² = ${E1[1] ** 2} against ${E1[2]}: leftover ${E1[2] - E1[1] ** 2} again. Rule: square, then add ${E1[1] - E1[0] ** 2}.` },
      { t: 18, say: `Calculator: ${E1[3]}² = ${E1[3] ** 2}. Plus ${E1[1] - E1[0] ** 2}: ${E1[4]}.` },
      { t: 23, say: `Size: a ${digits(E1[3])}-digit number squared, ${digits(E1[4])} digits. Last digit: ${E1[3] % 10}² + ${E1[1] - E1[0] ** 2} ends in ${E1[4] % 10}. Answer ${E1[4]}.` },
    ] },
    { type: 'check', scope: 'c from the first step, last-digit check', questions: [
      { make: (rng) => { const p = draw(rng, 4), xs = p.xs, n = p.n, t = xs[n], ld = ((xs[n - 1] % 10) ** 2 + p.c + 100) % 10; return pick(rng, `${seq(xs.slice(0, n))}, ? Using c from the first step and the last digit only, which option can be right?`, t, [[t + (ld === 9 ? -2 : 2), `wrong last digit: ${Math.abs(xs[n - 1]) % 10}²${plusC(p.c)} ends in ${ld}`], [t - 2 * p.c, `the constant has the wrong sign: c = ${neg(p.c)}`], [Math.round(t / 10), 'wrong size: a square about doubles the digit count']], `c = ${neg(xs[1])} − ${par(xs[0])}² = ${neg(p.c)}; ${xs[n - 1]}²${plusC(p.c)} = ${t}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Digit counts double → c = next − previous² (confirm on two steps) → next = last² + c.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Digits per term', 'Rule', 'Next'], rows: [
      [seq(AF.slice(0, 4)), seq(AF.slice(0, 4).map(digits)), '5 × last + 1: one digit per step', String(AF[4])],
      [seq(PR.slice(0, 5)), seq(PR.slice(0, 5).map(digits)), 'last × previous: lengths add', String(PR[5])],
      [seq(CH.slice(0, 4)), seq(CH.slice(0, 4).map(digits)), `last²${plusC(CH[1] - CH[0] ** 2)}: lengths double`, String(CH[4])],
      [seq(E2.slice(0, 5)), seq(E2.slice(0, 5).map(digits)), `last²${plusC(E2[1] - E2[0] ** 2)}`, String(E2[5])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 4))}, ? (last²${plusC(CH[1] - CH[0] ** 2)}, next ${CH[4]})`, rows: [
      { change: `The constant becomes ${-(CH[1] - CH[0] ** 2)}`, effect: `${seq(sm(CH[0], -(CH[1] - CH[0] ** 2), 4))}: next ${sm(CH[0], -(CH[1] - CH[0] ** 2), 5)[4]}.` },
      { change: `Start at ${-CH[0]} instead of ${CH[0]}`, same: true, effect: `No change after the first term: (${neg(-CH[0])})² = ${CH[0]}², so the list is ${seq(sm(-CH[0], CH[1] - CH[0] ** 2, 4))} and the next is still ${CH[4]}.` },
      { change: `Start at ${CH[0] + 1}`, effect: `${seq(sm(CH[0] + 1, CH[1] - CH[0] ** 2, 4))}: next ${sm(CH[0] + 1, CH[1] - CH[0] ** 2, 5)[4]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the rule reads only the last term, so the next is still ${CH[4]}.` },
      { change: `Start at ${CH[0] + 1} and make the constant ${-(CH[1] - CH[0] ** 2)}`, fusion: true, effect: `Both changes feed every later square, so the list moves a long way: ${seq(sm(CH[0] + 1, -(CH[1] - CH[0] ** 2), 4))}, next ${sm(CH[0] + 1, -(CH[1] - CH[0] ** 2), 5)[4]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: some starts loop or stall (2² − 2 = 2 forever; 1² − 1 = 0, then −1, 0, −1), so the items avoid them. A start of 0 or a negative start is fine: ${seq(E3.slice(0, 4))} squares from the second term on. Four shown terms are common here, because the fifth would be enormous.` },
    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: x² − 2 from 4 (${seq(sm(4, -2, 4))}) is the sequence behind a classic primality test for numbers of the form 2^{p} − 1. Repeated squaring is also how computers raise numbers to large powers quickly: squaring doubles the exponent at every step.` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const xs = t === 0 ? draw(rng, 4).xs.slice(0, 4) : t === 1 ? prod(rng.int(2, 3), rng.int(4, 6), 0, 5).slice(1) : affine(rng.int(2, 6), rng.int(3, 5), rng.pick([1, -1, 2]), 4); const names = ['last² + c', 'last × previous', 'k × last + c']; const lo = seq(xs.slice(1).map((v, i) => v - xs[i] ** 2)); const trp = [[null, `${par(xs[1])} × ${xs[2]} = ${xs[1] * xs[2]}, not ${xs[3]}`, 'the lengths double; k × last adds a fixed number of digits'], [`the leftovers after squaring, ${lo}, are not constant`, null, 'the ratio grows; k is not fixed'], [`the leftovers after squaring, ${lo}, are not constant`, `${xs[1]} × ${xs[2]} = ${xs[1] * xs[2]}, not ${xs[3]}`, null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), 'Test each rule on the last shown step.'); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = draw(rng, 4); return num(`An index is updated each year by squaring it and adding a fixed adjustment: ${seq(p.xs.slice(0, p.n))}. What is the next value?`, p.xs[p.n], `Adjustment ${neg(p.c)}; ${par(p.xs[p.n - 1])}²${plusC(p.c)} = ${p.xs[p.n]}.`, ['Square one value and compare with the next.', 'Square the last value, then add the adjustment.']); } },
      far: { type: 'number', q: `To compute 3^{16}, a computer squares repeatedly: ${seq(RS.slice(0, 4))}, ?. What is the next number?`, answer: RS[4], explain: `Each number is the square of the one before (constant 0): ${RS[3]}² = ${RS[4]}, which is 3^{16}.`, hints: ['Compare each number with the square of the one before.', 'Square the last number.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to repeated squaring?', options: ['Each value is the previous value squared, plus a constant', 'Each value is the product of the two values before it', 'The ratio of neighbours stays the same at every step', 'Each value adds the same amount to the previous one'], answer: 0, traps: { 1: `${RS[1]} × ${RS[2]} is not ${RS[3]}`, 2: `the ratios ${seq(RS.slice(1, 4).map((v, i) => v / RS[i]))} grow`, 3: `the gaps ${seq(diffs(RS.slice(0, 4)))} grow` }, explain: 'Repeated squaring is last² + c with c = 0: square the last term, add the constant, as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'square-minus', section: 'nl', count: 3 },
  ],
};
