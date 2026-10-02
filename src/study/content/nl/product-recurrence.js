// NumberLogic family lesson: each term is the product of the previous two (plus a constant).
// Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ratio, nextQ, pick, num, fibl, geo } from './method-ladder.js';

export const prod = (a, b, c, n) => { const o = [a, b]; while (o.length < n) o.push(o[o.length - 1] * o[o.length - 2] + c); return o.slice(0, n); };
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const plusC = (c) => (c ? (c < 0 ? ` − ${-c}` : ` + ${c}`) : '');
const digits = (v) => String(Math.abs(v)).length;

const CH = prod(3, 2, 0, 6);
const E1 = prod(2, 4, 0, 7);
const E2 = prod(-2, 3, 0, 7);
const E3c = -1, E3 = prod(3, 2, E3c, 7);
const PRED = prod(2, 5, 0, 7);
const ERR = prod(3, 4, 0, 7);
const GE = geo(3, 4, 6), FB = fibl(3, 4, 7);
const POW2 = prod(2, 2, 0, 6);

// Seeds and constants as in the generator: level 3 has no constant, level 4 adds 1, −1 or 2.
// Six terms are shown unless the seventh would pass 10^8 (then five). Every such seed was
// checked with the rule finder: none fits a second rule.
const SEEDS = [];
for (let a = -3; a <= 4; a++) for (let b = -3; b <= 5; b++) if (a && b && Math.abs(a * b) > 1) SEEDS.push([a, b]);
function draw(rng, lvl = rng.pick([3, 4])) {
  for (;;) {
    const [a, b] = rng.pick(SEEDS), c = lvl === 3 ? 0 : rng.pick([1, -1, 2]), t = prod(a, b, c, 8);
    if (new Set(t.slice(0, 4)).size < 3 || t.slice(2, 5).some((v) => Math.abs(v) < 2)) continue;
    let n = 6; while (n > 5 && Math.abs(t[n]) > 1e8) n--;
    if (Math.abs(t[n]) > 1e8) continue;
    return { c, n, xs: t };
  }
}
const pos = (rng, lvl) => { let p; do p = draw(rng, lvl); while (p.xs.slice(0, p.n + 1).some((v) => v <= 0)); return p; };

export default {
  id: 'nl/product-recurrence',
  book: 'nl',
  kind: 'family',
  family: 'product-recurrence',
  title: 'Multiply the previous two terms',
  summary: 'Explosive growth whose ratios repeat the terms two places back: each term is last × previous, sometimes plus a small constant.',
  prerequisites: ['nl/method-ladder', 'nl/fibonacci-like', 'nl/geometric'],
  objectives: [
    'Recognise explosive growth where the ratio itself keeps growing',
    'Confirm last × previous on two steps, and read a constant leftover',
    'Get the sign right with negative seeds',
    'Estimate the size of the answer from digit counts before multiplying',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'sum', label: 'Add the last two', approach: `Tried the Fibonacci rule: ${CH[3]} + ${CH[4]} = ${CH[3] + CH[4]}.`, breaksAt: 'Sums are far too small for growth this fast.' },
      { id: 'ratio', label: 'Repeat the last ratio', approach: `Divided ${CH[4]} by ${CH[3]} and multiplied ${CH[4]} by that ratio again.`, breaksAt: 'The ratio is the term two places back, so it grows every step.' },
      { id: 'square', label: 'Square the last term', approach: 'Saw explosive growth and squared the last term.', breaksAt: 'The rule multiplies two different neighbours, not a term by itself.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the ratios, once by combining the two terms before each term.`, answer: String(CH[5]), explain: `Ratios ${CH.slice(1, 5).map((v, i) => ratio(CH[i], v)).join(', ')}: no constant ratio, and from the second one on they repeat the terms ${seq(CH.slice(0, 3))}. Combining: ${CH[1]} × ${CH[2]} = ${CH[3]}, ${CH[2]} × ${CH[3]} = ${CH[4]}. Next: ${CH[3]} × ${CH[4]} = ${CH[5]}.` },
    { type: 'text', text: 'Each term is the **product of the two terms before it**, sometimes plus a small constant. The terms explode: the number of digits roughly adds up from step to step, so after a few terms they are far larger than any constant-ratio sequence would give.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'check', scope: 'the cue: products of neighbours', questions: [
      { make: (rng) => { const p = pos(rng, 3), xs = p.xs.slice(0, 6), ge = geo(rng.int(2, 5), rng.pick([3, 4]), 6), f = fibl(rng.int(2, 5), rng.int(6, 9), 6); return pick(rng, 'In which sequence is every term the product of the two before it?', seq(xs), [[seq(ge), `every ratio is ${ge[1] / ge[0]}: the same multiplier each time`], [seq(f), `${f[3]} + ${f[4]} = ${f[5]}: a sum, not a product`]], `${xs[2]} × ${xs[3]} = ${xs[4]}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: a constant ratio (${seq(GE.slice(0, 5))}: × 4 every time), the sum of the previous two (${seq(FB.slice(0, 6))}), or the square of the last term plus a constant (the next lesson).` },
    { type: 'check', scope: 'the neighbouring rules', questions: [
      { type: 'choice', q: '3, 4, 7, 11, 18, 29: which rule fits?', options: ['the sum of the previous two', 'the product of the previous two', 'a constant ratio'], answer: 0, traps: { 1: '4 × 7 = 28, not 11', 2: '7/4 and 11/7 are different' }, explain: '3 + 4 = 7, 4 + 7 = 11: a plain sum, not a product.' },
    ] },

    S('why'),
    { type: 'text', text: 'Product rules produce the biggest numbers in the middle of the test, and huge numbers push candidates towards the calculator before they have a rule. The fingerprint is quick to see: ratios that are not constant but copy earlier terms. Two multiplications confirm it, and a digit-count estimate rejects most wrong options before any exact arithmetic.' },

    S('anchor'),
    { type: 'text', text: 'In the Fibonacci lesson, next = last + previous. This family changes **one thing**: multiply instead of add. The same checks apply: test the rule on two shown steps, then apply it once more. Even the fingerprint carries over: there the gaps copied the terms two places back; here the ratios do.' },
    { type: 'check', scope: 'last × previous', questions: [
      { make: (rng) => { const a = rng.int(3, 12), b = rng.int(5, 30); return num(`The last term is ${b} and the one before it is ${a}. Each term is the product of the two before it. What comes next?`, a * b, `${a} × ${b} = ${a * b}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Two views of the same rule. As products: each row multiplies two neighbours and hits the next term. As ratios: dividing a term by the one before it leaves the term two places back, so the ratio row copies the sequence.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term n − 2', 'term n − 1', 'product', 'term n'], rows: E1.slice(2, 5).map((v, i) => [String(E1[i]), String(E1[i + 1]), String(E1[i] * E1[i + 1]), String(v)]) }, caption: `${seq(E1.slice(0, 5))}: the product of each pair is the next term. Next: ${E1[3]} × ${E1[4]} = ${E1[5]}.` },
    { type: 'check', scope: 'products of neighbours', questions: [
      { type: 'number', q: 'What comes next?  2, 3, 6, 18, ?', answer: 108, explain: '6 × 18 = 108.' },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [E1.slice(0, 5), E1.slice(1, 5).map((v, i) => ratio(E1[i], v))] }, caption: `Ratios of the same list: ${E1.slice(1, 5).map((v, i) => ratio(E1[i], v)).join(', ')}. From the second ratio on they read ${seq(E1.slice(0, 3))}, the terms two places back. A ratio row that copies the sequence means multiply the last two terms.` },
    { type: 'check', scope: 'the ratio row copies the terms', questions: [
      { make: (rng) => { const p = pos(rng, 3), xs = p.xs; return num(`${seq(xs.slice(0, 5))}: what is ${xs[4]} ÷ ${xs[3]}?`, xs[4] / xs[3], `${xs[4]} ÷ ${xs[3]} = ${xs[2]}, which is the term two places before ${xs[4]}.`); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Digits per term of ${seq(PRED.slice(0, 6))}`, xLabel: 'position', yLabel: 'digits', categories: PRED.slice(0, 6).map((_, i) => String(i + 1)), series: [{ name: 'digits', values: PRED.slice(0, 6).map(digits) }], valueLabels: true }, caption: `Digit counts ${seq(PRED.slice(0, 6).map(digits))}: each is roughly the sum of the two before it (give or take one), because multiplying adds lengths. A constant ratio adds the same few digits every step instead.` },
    { type: 'check', scope: 'digit counts add', questions: [
      { make: (rng) => { const a = rng.int(12, 99), b = rng.int(100, 999); return pick(rng, `A product rule has last two terms ${a} and ${b}. About how many digits will the next term have?`, `${digits(a * b)}`, [[`${digits(b) + 1}`, `only one digit more than ${b}: that is what × 10 would do; a product adds the lengths`], [`${digits(a) + digits(b) + 2}`, 'too many: lengths add, give or take one'], [`${digits(b)}`, 'the product of two numbers above 10 is longer than either']], `${a} × ${b} = ${a * b}: ${digits(a * b)} digits.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: `The six moves on ${seq(E3.slice(0, 6))}: the ratios ${E3.slice(1, 6).map((v, i) => ratio(E3[i], v)).join(', ')} grow, so try products. ${E3[1]} × ${E3[2]} = ${E3[1] * E3[2]} against ${E3[3]}, and ${E3[2]} × ${E3[3]} = ${E3[2] * E3[3]} against ${E3[4]}: every product misses by ${neg(E3c)}. So next = ${E3[4]} × ${E3[5]}${plusC(E3c)} = ${E3[6]}. With a constant, the ratio row no longer copies the terms exactly, which is why the direct product check matters more than the ratios.` },
    { type: 'steps', steps: [
      { answers: 'sum', say: 'Divide neighbours. If the ratios are not constant and keep growing, suspect a product rule.', why: 'A constant ratio means multiply by the same number. Growing ratios mean the multiplier itself grows, and the obvious growing multiplier is an earlier term.',
        checks: [
          { make: (rng) => { const p = pos(rng, 3), xs = p.xs.slice(0, 6), r = xs.slice(1).map((v, i) => ratio(xs[i], v)); return pick(rng, `The ratios of ${seq(xs)} are ${r.join(', ')}. What does that suggest?`, 'last × previous', [['one constant ratio', 'the ratios are not all equal'], ['last + previous', `${xs[3]} + ${xs[4]} is far below ${xs[5]}`]], `The ratios repeat the terms two places back.`); } },
        ] },
      { answers: 'ratio', say: 'Compare the ratio row with the terms. If each ratio equals the term two places back, each term is last × previous.', why: 'a(n) ÷ a(n − 1) = a(n − 2) says the same as a(n) = a(n − 1) × a(n − 2).',
        checks: [
          { make: (rng) => { const p = pos(rng, 3), xs = p.xs; return pick(rng, `In ${seq(xs.slice(0, 6))}, ${xs[5]} ÷ ${xs[4]} = ${xs[5] / xs[4]}. Which term is that?`, `term 4 (${xs[3]})`, [[`term 5 (${xs[4]})`, 'that would be squaring the last term'], [`term 3 (${xs[2]})`, 'that is three places back'], ['none of them', `${xs[3]} matches exactly`]].filter(([v]) => v !== `term 4 (${xs[3]})`), `The ratio into term 6 equals term 4, two places back: a product rule.`); } },
        ] },
      { answers: 'square', say: 'Confirm last × previous directly on two steps.', why: 'Near the start a product and a sum can agree (2 × 2 = 2 + 2). Two later steps rule that out.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), p = pos(rng, 3), xs = p.xs.slice(0, 6); if (!yes) xs[5] += rng.pick([1, 2, -1]); return pick(rng, `Is every term of ${seq(xs)} from the third on the product of the two before it?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every product matches' : `${xs[3]} × ${xs[4]} = ${xs[3] * xs[4]}, not ${xs[5]}: check every step`]], `Products: ${xs.slice(2).map((v, i) => `${xs[i] * xs[i + 1]} vs ${v}`).join('; ')}.`); } },
        ] },
      { say: 'If every product misses by the same amount, that leftover c is part of the rule: term = last × previous + c.', why: 'As with the sum-plus-constant rule, a constant miss is a constant term, not a failed test.',
        checks: [
          { make: (rng) => { const p = draw(rng, 4), xs = p.xs; return num(`${seq(xs.slice(0, p.n))}: what is the leftover, term − (product of the two before it)?`, p.c, `${neg(xs[3])} − ${par(xs[1])} × ${par(xs[2])} = ${neg(xs[3])} − ${par(xs[1] * xs[2])} = ${neg(p.c)}, the same on every step.`, ['Multiply two neighbours.', 'Subtract the product from the next term.']); } },
        ] },
      { say: 'Next = last × previous + c.', why: 'The rule reads only the two most recent terms and the constant.',
        checks: [
          { make: (rng) => { const p = pos(rng), xs = p.xs; return num(nextQ(xs.slice(0, p.n)), xs[p.n], `${xs[p.n - 2]} × ${xs[p.n - 1]}${plusC(p.c)} = ${xs[p.n]}.`, ['Check the product on a shown step.', 'Multiply the last two terms, then add any constant.']); } },
        ] },
      { say: 'With negative seeds, keep the signs: a product of two negatives is positive, of mixed signs negative.', why: 'The sign pattern follows from the rule; do not strip signs as in the alternating-signs lesson.',
        checks: [
          { make: (rng) => { let p; do p = draw(rng); while (!p.xs.slice(0, p.n).some((v) => v < 0)); const xs = p.xs; return num(nextQ(xs.slice(0, p.n)), xs[p.n], `${par(xs[p.n - 2])} × ${par(xs[p.n - 1])}${plusC(p.c)} = ${neg(xs[p.n])}.`, ['Multiply the last two terms with their signs.', 'Then add any constant.']); } },
        ] },
    ] },
    { type: 'explain', prompt: 'Why does the ratio row of a product sequence copy the terms two places back, and why does that make the growth explosive?', model: 'If a(n) = a(n − 1) × a(n − 2), then a(n) ÷ a(n − 1) = a(n − 2): the ratio into each term is an earlier term. Since the terms grow, the multiplier grows with them, so the growth accelerates instead of staying at a fixed rate.', points: ['a(n) ÷ a(n − 1) = a(n − 2)', 'The multiplier is an earlier term, which itself grows', 'So digit counts add rather than increase by a fixed amount'] },

    S('worked'),
    { type: 'worked', family: 'product-recurrence', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'A pure product. Check two products before opening the solution.' },
    { type: 'worked', family: 'product-recurrence', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'A product plus a constant. The check is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 5))}, ? Before multiplying: about how many digits will the next term have?`, answer: `${digits(PRED[5])}: ${PRED[3]} × ${PRED[4]} = ${PRED[5]}. Lengths add: ${digits(PRED[3])} + ${digits(PRED[4])} digits give ${digits(PRED[5])}, give or take one.`, explain: 'Options with the wrong number of digits can be crossed out before you multiply.' },

    S('traps'),
    { type: 'traps', family: 'product-recurrence', section: 'nl', extra: [
      { belief: 'The last ratio will repeat.', fix: 'The ratio grows: it is always the term two places back.' },
      { belief: 'Square the last term.', fix: 'The rule multiplies two different terms: last × previous.' },
      { belief: 'A near-miss means the rule is wrong.', fix: 'If every product misses by the same c, add c.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `The ratios ${ERR.slice(1, 5).map((v, i) => ratio(ERR[i], v)).join(', ')} grow: a product rule.`,
      `Check: ${ERR[1]} × ${ERR[2]} = ${ERR[3]} and ${ERR[2]} × ${ERR[3]} = ${ERR[4]}.`,
      `Next = ${ERR[4]} × ${ERR[4]} = ${ERR[4] * ERR[4]}.`,
      `Answer: ${ERR[4] * ERR[4]}.`,
    ], errorStep: 2, explain: `The check in the step before multiplies two **different** neighbours. Next = ${ERR[3]} × ${ERR[4]} = ${ERR[5]}. Squaring the last term is a different rule (the next lesson).` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), xs = p.xs, n = p.n, a = xs[n - 1], b = xs[n - 2]; const w = [[a + b + p.c, 'added the previous two terms; the growth is multiplicative'], [a * a + p.c, 'squared the last term; the rule multiplies the last two different terms'], [a * (a / b), 'repeated the last ratio; the ratio grows every step']]; if (p.c) w.unshift([a * b, `multiplied correctly but forgot the ${sgn(p.c)}`]); return pick(rng, nextQ(xs.slice(0, n)), xs[n], w.filter(([v]) => Number.isInteger(v)), `${par(b)} × ${par(a)}${plusC(p.c)} = ${neg(xs[n])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Size first: digit counts add, so estimate the length of last × previous and cross out options of the wrong length. Then check the **last digit**: it is the last digit of (last digit × last digit) + c.' },
    { type: 'check', scope: 'size and last digit', questions: [
      { make: (rng) => { const p = pos(rng, 3), xs = p.xs, n = p.n, t = xs[n]; return pick(rng, `${seq(xs.slice(0, n))}, ? Use size and last digit only: which option can be right?`, t, [[t + 2 * (t % 10 === 9 ? -1 : 1), `wrong last digit: ${xs[n - 2] % 10} × ${xs[n - 1] % 10} ends in ${(xs[n - 2] * xs[n - 1]) % 10}`], [Math.round(t / 10), `wrong size: about ${digits(xs[n - 2]) + digits(xs[n - 1])} digits expected`], [xs[n - 1] + xs[n - 2], 'far too small: that is the sum, not the product']], `${xs[n - 2]} × ${xs[n - 1]} = ${t}.`); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Use the calculator only for the final product, after two shown steps have confirmed the rule. Budget: 20 seconds, most of it spent on the two confirming products rather than on the answer.' },
    { type: 'thinkaloud', problem: nextQ(E3.slice(0, 6)), lines: [
      { t: 0, say: `Growth explodes: ${E3[4]} to ${E3[5]}.` },
      { t: 3, say: `Ratio ${E3[5]} ÷ ${E3[4]} is about ${(E3[5] / E3[4]).toFixed(1)}, so multiply ${E3[5]} by that again: about ${Math.round((E3[5] * E3[5]) / E3[4])}.`, slip: true },
      { t: 7, say: `But the ratio before was about ${(E3[4] / E3[3]).toFixed(1)}: the ratios keep growing. Test products of neighbours instead.` },
      { t: 11, say: `${E3[1]} × ${E3[2]} = ${E3[1] * E3[2]} against ${E3[3]}; ${E3[2]} × ${E3[3]} = ${E3[2] * E3[3]} against ${E3[4]}. Off by ${neg(E3c)} each time.` },
      { t: 17, say: `One more: ${E3[3]} × ${E3[4]} = ${E3[3] * E3[4]} against ${E3[5]}. Rule: last × previous${plusC(E3c)}.` },
      { t: 22, say: `Calculator: ${E3[4]} × ${E3[5]} = ${E3[4] * E3[5]}${plusC(E3c)} = ${E3[6]}.` },
      { t: 27, say: `Size: ${digits(E3[4])} + ${digits(E3[5])} digits give about ${digits(E3[4]) + digits(E3[5])}; ${E3[6]} has ${digits(E3[6])}. Answer ${E3[6]}.` },
    ] },
    { type: 'check', scope: 'the calculator last, and the think-aloud', questions: [
      { type: 'choice', q: 'When do you use the calculator in a product item?', options: ['for the final product, after two checks', 'for every ratio first', 'never, not even for the answer'], answer: 0, traps: { 1: 'ratios are a hint; the products are the check', 2: 'the final product is the one place it helps' }, explain: 'Confirm the rule on two shown steps, then multiply once.' },
      { type: 'choice', q: 'In the think-aloud, the first try multiplied 395 by the last ratio again. Why was that wrong?', options: ['the ratios keep growing', 'the last ratio was 4.9, not 9', 'the terms are sums'], answer: 0, traps: { 1: '395/44 is about 9; the one before was about 4.9', 2: 'products, not sums, fit the list' }, explain: 'Growing ratios point to products of neighbours: 44 × 395 − 1 = 17379.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Explosive growth, ratios repeat the terms two back → next = last × previous (+ the constant leftover, if every product misses by it).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Ratios', 'Rule', 'Next'], rows: [
      [seq(GE.slice(0, 5)), GE.slice(1, 5).map((v, i) => ratio(GE[i], v)).join(', '), '× 4 every time (geometric)', String(GE[5])],
      [seq(FB.slice(0, 5)), FB.slice(1, 5).map((v, i) => ratio(FB[i], v)).join(', '), 'last + previous', String(FB[5])],
      [seq(E1.slice(0, 5)), E1.slice(1, 5).map((v, i) => ratio(E1[i], v)).join(', '), 'last × previous (this lesson)', String(E1[5])],
      [seq(E3.slice(0, 5)), E3.slice(1, 5).map((v, i) => ratio(E3[i], v)).join(', '), `last × previous${plusC(E3c)}`, String(E3[5])],
    ] },
    { type: 'variation', base: `${seq(E1.slice(0, 6))}, ? (last × previous, next ${E1[6]})`, rows: [
      { change: 'Add 1 after every product', effect: `${seq(prod(E1[0], E1[1], 1, 5))}, …: the constant compounds, and the sixth term is already ${prod(E1[0], E1[1], 1, 6)[5]} instead of ${E1[5]}.` },
      { change: `First seed ${E1[0] + 1} instead of ${E1[0]}`, effect: `${seq(prod(E1[0] + 1, E1[1], 0, 5))}, …: every later term changes; the sixth is ${prod(E1[0] + 1, E1[1], 0, 6)[5]}.` },
      { change: `First seed ${-E1[0]} instead of ${E1[0]}`, effect: `${seq(prod(-E1[0], E1[1], 0, 6))}: the same sizes with signs from the products, so the next is ${neg(prod(-E1[0], E1[1], 0, 7)[6])}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the last two terms are the same, so the next is still ${E1[6]}.` },
      { change: `First seed ${-E1[0]} and add 1 after every product`, fusion: true, effect: `The sign change and the constant interact: +1 is added to signed products, so the sizes no longer match the original. ${seq(prod(-E1[0], E1[1], 1, 5))}, …, sixth term ${neg(prod(-E1[0], E1[1], 1, 6)[5])}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a seed of 1 makes the third term equal the second (${seq(prod(1, 3, 0, 5))}), and seeds 1, 1 stall forever, so the rule only shows once both factors exceed 1. Negative seeds give sign patterns that follow the products (${seq(E2.slice(0, 5))}).` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2), a = rng.int(2, 4), b = rng.int(3, 5); const xs = t === 0 ? prod(a, b, 0, 6) : t === 1 ? geo(a, b, 6) : fibl(a, b + 3, 6); const names = ['last × previous', 'a fixed multiplier', 'last + previous']; const trp = [[null, `the ratios ${xs.slice(1, 4).map((v, i) => ratio(xs[i], v)).join(', ')} are equal`, `${xs[3]} + ${xs[4]} = ${xs[5]}`], [`${xs[3]} × ${xs[4]} is not ${xs[5]}`, null, `${xs[3]} + ${xs[4]} is not ${xs[5]}`], [`${xs[3]} × ${xs[4]} is not ${xs[5]}`, 'the ratios are not constant', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, t === 0 ? (i === 1 ? 'the ratios grow' : `${xs[3]} + ${xs[4]} is not ${xs[5]}`) : trp[t][i]]).filter((_, i) => i !== t), 'Test each rule on the last step.'); } },
    ] },

    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: logarithms turn products into sums. ${seq(E1.slice(0, 6))} are the powers ${E1.slice(0, 6).map((v) => `2^{${Math.log2(v)}}`).join(', ')}, and the exponents follow the Fibonacci rule. Any multiplicative process (compounding on compounding) becomes additive on a log scale.` },
    { type: 'transfer',
      near: { make: (rng) => { const p = pos(rng, 3), xs = p.xs; return num(`In a chain reaction each round's count is the product of the two rounds before it: ${seq(xs.slice(0, p.n))}. What is the next round's count?`, xs[p.n], `${xs[p.n - 2]} × ${xs[p.n - 1]} = ${xs[p.n]}.`, ['Check a product on a shown round.', 'Multiply the last two rounds.']); } },
      far: { type: 'number', q: `The terms ${seq(POW2.slice(0, 5))} are powers of 2, and each is the product of the two before it. The next term is 2 to which power?`, answer: Math.log2(POW2[5]), explain: `The exponents are ${seq(POW2.slice(0, 5).map(Math.log2))}: multiplying powers adds exponents, so the exponents follow the Fibonacci rule. Next: ${Math.log2(POW2[3])} + ${Math.log2(POW2[4])} = ${Math.log2(POW2[5])}.`, hints: ['Write each term as 2 to a power.', 'Multiplying powers adds the exponents.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the exponents?', options: ['Taking logs turns a product rule into a sum rule', 'The ratio of neighbours stays the same each time', 'Each term is the square of the term before it', 'A fixed amount is added at every single step'], answer: 0, traps: { 1: `the ratios ${seq(POW2.slice(1, 5).map((v, i) => v / POW2[i]))} grow`, 2: `${POW2[3]} squared is not ${POW2[4]}`, 3: `the gaps ${seq(diffs(POW2.slice(0, 5)))} are not constant` }, explain: 'Products of neighbours in the terms become sums of neighbours in the exponents: the product rule of this lesson and the Fibonacci rule are the same rule on a log scale.' } },

    S('tryit'),
    { type: 'tryit', family: 'product-recurrence', section: 'nl', count: 3 },
  ],
};
