// NumberLogic family lesson: multiply, then add a constant (a(n) = k·a(n−1) + c). Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, ratios, round2, nextQ, pick, num, nz, geo, affine } from './method-ladder.js';

const g = (xs) => diffs(xs);
const left = (xs, k) => xs.slice(1).map((v, i) => v - k * xs[i]);
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));

const CHk = 3, CHc = -2, CH = affine(3, CHk, CHc, 6);
const E1k = 2, E1c = 3, E1 = affine(1, E1k, E1c, 6);
const E2 = affine(2, 3, -1, 6);
const E3k = -2, E3c = 5, E3 = affine(2, E3k, E3c, 6);
const PRk = 3, PRc = 1, PR = affine(2, PRk, PRc, 6);
const ERk = 2, ERc = 1, ER = affine(4, ERk, ERc, 6);
const GE = geo(3, 2, 5);
const MX = [1, 3, 8, 19, 42];
const SMk = 3, SMc = 2, SM = affine(1, SMk, SMc, 4);
const FACT = [1, 2, 6, 24, 120];

const d2 = (rng, n) => { const k = rng.pick([2, 3]), c = nz(rng, -9, 9); return { k, c, xs: affine(rng.int(1, 9), k, c, n) }; };
// Level-3 style; starts that make every term equal (k·a + c = a) are redrawn.
const d3 = (rng, n) => { let k, c, a; do { k = rng.pick([-2, 3]); c = nz(rng, -12, 12); a = rng.int(-5, 9); } while (k * a + c === a || a === 0); return { k, c, xs: affine(a, k, c, n) }; };
const pos = (rng, n) => { let p; do p = rng.chance(0.5) ? d2(rng, n) : d3(rng, n); while (p.k < 0); return p; };
// Positive, strictly growing terms: the only case where "the ratios approach k" is readable.
const grow = (rng, n) => { let p; do p = pos(rng, n); while (!p.xs.every((v, i) => v > 0 && (i === 0 || v > p.xs[i - 1]))); return p; };
const TAk = 3, TAc = -4, TA = affine(6, TAk, TAc, 6);
const E15 = E1.slice(0, 5), NEGC = affine(E1[0], E1k, -E1c, 6), K3 = affine(E1[0], 3, E1c, 6), ST2 = affine(2, E1k, E1c, 6), BOTH = affine(2, 3, E1c, 6);
// k = 4 is left out of the near transfer: five terms of 4 × previous + c also fit a counting multiplier plus a
// quadratic leftover (checked with the rule finder in src/sections/nl/solver.js); k = 5 has one reading.
const pm = (c) => (c < 0 ? `− ${-c}` : `+ ${c}`);
const r2c = (x) => Math.round(x * 100) / 100;
const bank = (b, fee, yrs) => { for (let i = 0; i < yrs; i++) b = r2c(1.1 * b - fee); return b; };
const anyP = (rng, n) => (rng.chance(0.5) ? d2(rng, n) : d3(rng, n));

export default {
  id: 'nl/affine-recurrence',
  book: 'nl',
  kind: 'family',
  family: 'affine-recurrence',
  title: 'Multiply, then add a constant',
  summary: 'Ratios near a whole number k but never exact: the leftover c = next − k × previous is constant, so next = k × last + c.',
  prerequisites: ['nl/method-ladder', 'nl/geometric', 'nl/diff-geometric'],
  objectives: [
    'Spot ratios that hover near 2, 3 or 4 without being exact',
    'Find k and the leftover c with two multiplications',
    'Apply k × last + c in the right order, keeping the sign of c',
    'Handle a negative k, where the signs alternate',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by comparing each term with ${CHk} × the term before it.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} triple, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. Or: ${CHk} × each term, then ${CHc < 0 ? 'subtract' : 'add'} ${Math.abs(CHc)}: ${CHk} × ${CH[4]} ${sgn(CHc)} = ${CH[5]}. The second way is this lesson, and it is usually faster.`,
      attempts: [
        { id: 'first-ratio', label: 'Read k from the first pair', approach: `Took ${CH[1]} ÷ ${CH[0]} ≈ ${round2(CH[1] / CH[0])} as the ratio and tried k = ${Math.round(CH[1] / CH[0])}.`, breaksAt: `With small terms the constant swamps the ratio. The largest pair, ${CH[4]} ÷ ${CH[3]} ≈ ${round2(CH[4] / CH[3])}, shows k = ${CHk}.` },
        { id: 'round-k', label: 'Multiply by the rough ratio', approach: `Saw ratios near ${CHk} and answered ${CH[4]} × ${CHk} = ${CHk * CH[4]}.`, breaksAt: `Roughly ${CHk} is not exactly ${CHk}: every term lands ${Math.abs(CHc)} ${CHc < 0 ? 'below' : 'above'} ${CHk} × the previous one, and that leftover must go back on.` },
        { id: 'add-first', label: 'Add c before multiplying', approach: `Found c = ${neg(CHc)} but applied it first: ${CHk} × (${CH[4]} ${pm(CHc)}) = ${CHk * (CH[4] + CHc)}.`, breaksAt: `The rule multiplies, then adds. Test the order on a shown step: ${CHk} × (${CH[0]} ${pm(CHc)}) = ${CHk * (CH[0] + CHc)}, not ${CH[1]}.` },
      ] },
    { type: 'text', text: `Each term is k times the previous term, plus (or minus) the same constant c. The ratios drift towards k without reaching it: in ${seq(CH.slice(0, 5))} they are ${CH.slice(1, 5).map((v, i) => round2(v / CH[i])).join(', ')}, near ${CHk} but never equal. The constant c is what spoils the exact ratio.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `Not this lesson: exact ratios (${seq(GE)}, plain multiplication) and ratios that count up 2, 3, 4, 5 (${seq(FACT)}, multiplying by the counting numbers). Also not a leftover that changes from step to step, such as ${seq(MX)} (double, then add 1, 2, 3, 4): that is a later lesson.` },
    { type: 'check', scope: 'the cue: ratios near k, never exact', questions: [
      { make: (rng) => { const p = d2(rng, 5), ge = geo(rng.int(2, 6), p.k, 5), f = FACT.map((v) => v * rng.int(1, 3)); return pick(rng, 'Which sequence is "multiply, then add a constant"?', seq(p.xs), [[seq(ge), `its ratios are exactly ${p.k}: plain multiplication, no constant`], [seq(f), 'its ratios count up 2, 3, 4, 5']], `The ratios of ${seq(p.xs)} hover near ${p.k}; ${p.k} × each term is always ${neg(Math.abs(p.c))} ${p.c < 0 ? 'more than' : 'less than'} the next.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'This is the most common "harder" rule in the middle of the test. Its fingerprint, ratios that hover near a whole number, is easy to see once you look for it, and the leftover test confirms it with two multiplications. It also sits behind many rules that look exotic: "double and add one", "triple and subtract two", and the sequences whose gaps multiply from the previous lesson. Learn to see it here and you save the time other candidates spend guessing formulas.' },

    S('anchor'),
    { type: 'text', text: 'Geometric: next = r × last. This family changes **one thing**: after multiplying, add the same constant c. When c = 0 you are back to plain multiplication; when k = 1 you are back to a constant gap.' },
    { type: 'check', scope: 'multiply, then add', questions: [
      { make: (rng) => { const x = rng.int(6, 40), k = rng.pick([2, 3, 4]), c = nz(rng, -9, 9); return num(`Multiply ${x} by ${k}, then ${c < 0 ? 'subtract' : 'add'} ${Math.abs(c)}. What do you get?`, k * x + c, `${k} × ${x} = ${k * x}, then ${sgn(c)}: ${k * x + c}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Put two columns side by side: k × previous, and the actual next term. Their difference, the **leftover**, is the same in every row. That constant column is the whole proof.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['previous', `${E1k} × previous`, 'actual next', 'leftover'], rows: E1.slice(0, 4).map((v, i) => [neg(v), neg(E1k * v), neg(E1[i + 1]), sgn(E1[i + 1] - E1k * v)]) }, caption: `${seq(E1.slice(0, 5))}: the leftover is ${sgn(E1c)} in every row, so next = ${E1k} × ${E1[4]} ${sgn(E1c)} = ${E1[5]}.` },
    { type: 'check', scope: 'the leftover column', questions: [
      { make: (rng) => { const p = pos(rng, 5); return num(`The ratios of ${seq(p.xs)} are near ${p.k}. What is the leftover, next − ${p.k} × previous?`, p.c, `${neg(p.xs[2])} − ${p.k} × ${par(p.xs[1])} = ${neg(p.c)}, the same on every step.`, [`Compute ${p.k} × a term.`, 'Subtract it from the term after it.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [CH.slice(0, 5), ratios(CH.slice(0, 5))] }, caption: `Ratios of ${seq(CH.slice(0, 5))}: ${ratios(CH.slice(0, 5)).join(', ')}. They creep towards ${CHk} but never reach it. Near-constant ratios are the cue; the leftover test is the proof.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CH.slice(0, 5), 1) }, caption: `The same sequence from the gap side: gaps ${seq(g(CH.slice(0, 5)))}, each ${CHk} × the previous gap. "Multiply then add" always has gaps that multiply by k, which is why the previous lesson's method also works.` },

    { type: 'check', scope: 'the gaps multiply by k', questions: [
      { make: (rng) => { const p = pos(rng, 6), gs = g(p.xs); return num(`${seq(p.xs.slice(0, 5))} is ${p.k} × previous ${sgn(p.c)}. Its gaps are ${seq(gs.slice(0, 4))}. What is the next gap?`, gs[4], `Each gap is ${p.k} × the one before: ${neg(gs[3])} × ${p.k} = ${neg(gs[4])}.`); } },
    ] },
    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'first-ratio', say: 'Divide neighbours roughly. If the ratios hover near a whole number k (2, 3, 4, or −2) without being exact, suspect k × previous + c.', why: 'For large terms, c is small next to k × term, so the ratio creeps towards k. For small terms c matters more, so use the later, larger terms to read k.',
        checks: [
          { make: (rng) => { const p = grow(rng, 5); return num(`The ratios of ${seq(p.xs)} approach which whole number?`, p.k, `${neg(p.xs[4])} ÷ ${par(p.xs[3])} ≈ ${round2(p.xs[4] / p.xs[3])}: close to ${p.k}.`, ['Divide the last term by the one before.', 'Round to the nearest whole number.']); } },
        ] },
      { answers: 'round-k', say: 'Compute k × each term and subtract it from the next term. That difference is the leftover.', why: 'Removing the multiplied part isolates whatever is added on each step.',
        checks: [
          { make: (rng) => { const p = pos(rng, 5); return num(`${seq(p.xs)}, with k = ${p.k}. What is the first leftover, term 2 − ${p.k} × term 1?`, p.c, `${neg(p.xs[1])} − ${p.k} × ${par(p.xs[0])} = ${neg(p.c)}.`); } },
        ] },
      { say: 'Check that the leftover is the same c on at least two steps.', why: 'One leftover always exists; two equal ones confirm the rule. A leftover that changes (1, 2, 3, 4) means a different rule.',
        checks: [
          { make: (rng) => { const same = rng.chance(0.5), k = rng.pick([2, 3]); let xs; if (same) xs = affine(rng.int(1, 9), k, nz(rng, -6, 6), 5); else { xs = [rng.int(1, 9)]; while (xs.length < 5) xs.push(k * xs[xs.length - 1] + xs.length); } const lo = left(xs, k); return pick(rng, `${seq(xs)}: with k = ${k}, is the leftover constant?`, same ? 'Yes' : 'No', [[same ? 'No' : 'Yes', same ? `every leftover is ${neg(lo[0])}` : `the leftovers are ${seq(lo)}: they count up`]], `Leftovers: ${seq(lo)}.`); } },
        ] },
      { answers: 'add-first', say: 'Next = k × last + c. Multiply first, then add.', why: 'The rule multiplies the previous term and then adds c. Adding c first gives k × (last + c), a different number.',
        checks: [
          { make: (rng) => { const p = pos(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `k = ${p.k}, c = ${neg(p.c)}: ${p.k} × ${par(p.xs[4])} ${sgn(p.c)} = ${neg(p.xs[5])}.`, ['Ratios near which k? Then the leftover.', 'k × last, then add c.']); } },
        ] },
      { say: 'Negative k: the signs alternate and the ratios sit near −2. Run the same test, keeping every sign.', why: 'Multiplying by a negative number flips the sign each step; the leftover is still constant.',
        checks: [
          { make: (rng) => { let c, a, xs; do { c = nz(rng, -9, 9); a = rng.int(1, 9); xs = affine(a, -2, c, 6); } while (-2 * a + c === a); return num(nextQ(xs.slice(0, 5)), xs[5], `k = −2, c = ${neg(c)}: −2 × ${par(xs[4])} ${sgn(c)} = ${neg(xs[5])}.`, ['The signs alternate: k is negative.', 'Leftover = next − (−2) × previous.']); } },
        ] },
    ] },
    { type: 'text', text: `Small starting terms make the ratios misleading. ${seq(SM)} has ratios ${SM.slice(1).map((v, i) => round2(v / SM[i])).join(', ')}: the first says ${SM[1] / SM[0]}, but the rule is × ${SMk}, then ${sgn(SMc)}. Read k from the largest pair, and let the leftover test have the last word: ${SM[3]} − ${SMk} × ${SM[2]} = ${SMc} and ${SM[2]} − ${SMk} × ${SM[1]} = ${SMc}.` },
    { type: 'explain', prompt: 'Why do the ratios approach k but never equal it, and why is the leftover test more reliable than the ratio?', model: 'next ÷ previous = k + c ÷ previous. As the terms grow, c ÷ previous shrinks, so the ratio creeps towards k but never reaches it while c is not 0. The leftover next − k × previous removes the multiplied part exactly and gives c itself, so it is either constant or not: no rounding judgement is needed.', points: ['ratio = k + c ÷ previous', 'The ratio only approaches k as the terms grow', 'The leftover is exact: constant c or no rule'] },

    S('worked'),
    { type: 'worked', family: 'affine-recurrence', section: 'nl', difficulty: 2, seed: 'a', explainAt: [1], intro: 'k is 2 or 3. Find the leftover before opening the solution.' },
    { type: 'worked', family: 'affine-recurrence', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'k may be 4 or negative. The reading is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PR.slice(0, 5))}, ? Predict k and c before computing anything exactly.`, answer: `k = ${PRk}, c = ${neg(PRc)}: ${PRk} × ${PR[4]} ${sgn(PRc)} = ${PR[5]}.`, explain: `The ratios settle just above ${PRk}, so c is small and positive.` },

    S('traps'),
    { type: 'traps', family: 'affine-recurrence', section: 'nl', extra: [
      { belief: 'The ratio is roughly k, so multiply by k.', fix: 'Roughly is not exactly: compute the leftover and add it.' },
      { belief: 'c = k × previous − next.', fix: 'c = next − k × previous. A next term above k × previous means c is positive.' },
      { belief: 'Add c, then multiply.', fix: 'The order is multiply by k, then add c. Check the order on a shown step.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ER.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `The ratios are just over ${ERk}.`,
      `Leftovers: ${ER[1]} − ${ERk} × ${ER[0]} = ${ERc} and ${ER[2]} − ${ERk} × ${ER[1]} = ${ERc}, so c = ${ERc}.`,
      `Next = ${ERk} × (${ER[4]} + ${ERc}) = ${ERk * (ER[4] + ERc)}.`,
      `Answer: ${ERk * (ER[4] + ERc)}.`,
    ], errorStep: 2, explain: `The constant was added before multiplying. The rule is ${ERk} × last + ${ERc}: ${ERk} × ${ER[4]} + ${ERc} = ${ER[5]}. Test the order on a shown step: ${ERk} × (${ER[0]} + ${ERc}) = ${ERk * (ER[0] + ERc)}, not ${ER[1]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = anyP(rng, 7), l = p.xs[4]; return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], [[p.k * l, `multiplied by ${neg(p.k)} but forgot the ${sgn(p.c)}`], [p.k * l - p.c, 'used the leftover with the wrong sign'], [p.k * (l + p.c), `added ${neg(p.c)} before multiplying instead of after`], [l + (l - p.xs[3]), `repeated the last gap; the gaps multiply by ${neg(p.k)}`], [p.xs[6], 'went one step too far']], `k = ${neg(p.k)}, c = ${neg(p.c)}: ${neg(p.k)} × ${par(l)} ${sgn(p.c)} = ${neg(p.xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Read k from the **last** two terms, where c matters least: ${CH[4]} ÷ ${CH[3]} is about ${CHk}. Then one subtraction gives c: ${CH[4]} − ${CHk} × ${CH[3]} = ${CHc}. Confirm on one earlier pair and answer. Two multiplications, one subtraction.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Ratios: ${TA[2]} ÷ ${TA[1]} ≈ ${round2(TA[2] / TA[1])}, ${TA[4]} ÷ ${TA[3]} ≈ ${round2(TA[4] / TA[3])}. Near ${TAk}, never exact: multiply, then add.` },
      { t: 6, say: `Leftover from the last pair: ${TAk} × ${TA[3]} = ${TAk * TA[3]}, and ${TAk * TA[3]} − ${TA[4]} = ${-TAc}, so c = +${-TAc}.`, slip: true },
      { t: 10, say: `Wait, the leftover is next minus ${TAk} × previous: ${TA[4]} − ${TAk * TA[3]} = ${neg(TAc)}. The term sits below ${TAk} × previous, so c is negative.` },
      { t: 14, say: `Confirm on an earlier pair: ${TA[2]} − ${TAk} × ${TA[1]} = ${neg(TA[2] - TAk * TA[1])}. Same.` },
      { t: 18, say: `Next = ${TAk} × ${TA[4]} − ${-TAc} = ${TA[5]}. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: c = next − k × previous, with its sign', questions: [
      { make: (rng) => { let p; do p = pos(rng, 5); while (p.c > 0); return num(`${seq(p.xs)} is k × previous + c with k = ${p.k}. What is c?`, p.c, `c = next − ${p.k} × previous: ${neg(p.xs[3])} − ${p.k} × ${par(p.xs[2])} = ${neg(p.c)}. The terms sit below ${p.k} × previous, so c is negative.`, [`Compute ${p.k} × a term, then compare with the term after it.`, 'Next minus k × previous, not the other way round.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Stuck on k? Use the gaps: they multiply by exactly k (the gap-ratio lesson), and dividing two gaps gives k with no rounding.' },
    { type: 'check', scope: 'k from the last pair, c from one subtraction', questions: [
      { make: (rng) => { const p = pos(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? Read k from the last pair, c from one subtraction. What comes next?`, p.xs[5], `${neg(p.xs[4])} ÷ ${par(p.xs[3])} ≈ ${p.k}; c = ${neg(p.xs[4])} − ${p.k} × ${par(p.xs[3])} = ${neg(p.c)}; next ${p.k} × ${par(p.xs[4])} ${sgn(p.c)} = ${neg(p.xs[5])}.`, ['Largest pair gives the cleanest ratio.', 'c = last − k × second last.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Ratios near k, never exact → leftover c = next − k × previous; constant c → next = k × last + c (multiply first).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Leftover after × k', 'Rule'], rows: [
      [seq(GE), seq(left(GE, 2)), '× 2 exactly (geometric)'],
      [seq(E1.slice(0, 5)), seq(left(E1.slice(0, 5), E1k)), `× ${E1k}, then ${sgn(E1c)} (this lesson)`],
      [seq(MX), seq(left(MX, 2)), '× 2, then + 1, 2, 3, … (leftover counts up)'],
      [seq(FACT), 'not a fixed k', '× 2, × 3, × 4, … (multiplier counts up)'],
    ] },
    { type: 'text', text: 'All four rows are separated by one column of subtractions: the leftover after multiplying. It is 0 (plain multiplication), constant (this lesson), counting up (a later lesson), or there is no single k to multiply by at all.' },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const t = rng.int(0, 2), k = 2; let xs; if (t === 0) xs = geo(rng.int(2, 7), k, 5); else if (t === 1) xs = affine(rng.int(1, 9), k, nz(rng, -5, 5), 5); else { xs = [rng.int(1, 6)]; while (xs.length < 5) xs.push(k * xs[xs.length - 1] + xs.length); } const names = ['× 2 exactly', '× 2, then a constant', '× 2, then 1, 2, 3, …']; const trp = [[null, 'the leftover is 0 every time: no constant', 'the leftover is 0, not counting'], ['the leftover is not 0', null, 'the leftover stays the same; it does not count'], ['the leftover is not 0', 'the leftovers change: they count up', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Leftovers after × 2: ${seq(left(xs, 2))}.`); } },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: k = 1 is a constant gap c; c = 0 is plain multiplication; a negative k alternates signs; and if k × a + c = a the sequence never moves (a fixed point), which test writers avoid.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a balance that grows by a fixed percentage and also receives a fixed deposit each period follows k × previous + c. Expected-value recursions in probability, "value = p × value + cost", have the same shape.' },
    { type: 'variation', base: `${seq(E15)}, ?  × ${E1k}, then ${sgn(E1c)}; next ${E1k} × ${E1[4]} ${pm(E1c)} = ${E1[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E15.slice(1))}, ?`, effect: `Still ${E1[5]}. Every remaining step is still × ${E1k}, then ${sgn(E1c)}; the last term has not moved.` },
      { change: `Flip the constant to ${sgn(-E1c)}: ${seq(NEGC.slice(0, 5))}, ?`, effect: `${neg(NEGC[5])}. Same multiplier, leftover ${sgn(-E1c)} every step: the terms now run below ${E1k} × previous.` },
      { change: `Multiply by 3 instead of ${E1k}: ${seq(K3.slice(0, 5))}, ?`, effect: `${K3[5]}. The ratios now creep towards 3; the leftover after × 3 is still ${sgn(E1c)}.` },
      { change: `Start at 2 instead of ${E1[0]}: ${seq(ST2.slice(0, 5))}, ?`, effect: `${ST2[5]}. k and c are untouched: every leftover is still ${sgn(E1c)}. The start only decides where the run begins.` },
      { fusion: true, change: `Start at 2 and multiply by 3: ${seq(BOTH.slice(0, 5))}, ?`, effect: `${BOTH[5]}. The ratios move to near 3 (from k), the run begins higher (from the start), and the leftover ${sgn(E1c)} is untouched by either.` },
    ] },
    { type: 'check', scope: 'the edge cases', questions: [
      { make: (rng) => { const c = nz(rng, -9, 9), xs = affine(rng.int(2, 20), 1, c, 6); return num(`${seq(xs.slice(0, 5))}, ? This is k × previous + c with k = 1. What comes next?`, xs[5], `k = 1 means add c every step: ${neg(xs[4])} ${sgn(c)} = ${neg(xs[5])}. A constant gap is the k = 1 case.`); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { let k, c, a, xs; do { k = 5; c = nz(rng, -5, 5); a = rng.int(1, 5); xs = affine(a, k, c, 6); } while (k * a + c === a || xs[1] <= 0); return num(nextQ(xs.slice(0, 5)), xs[5], `Ratios near ${k}; leftover ${neg(xs[2])} − ${k} × ${xs[1]} = ${neg(c)} every step. Next: ${k} × ${xs[4]} ${pm(c)} = ${xs[5]}.`, ['Read k from the largest pair.', 'Leftover = next − k × previous; then k × last + c.']); } },
      far: { make: (rng) => { const b = rng.pick([1000, 2000, 500]), fee = rng.pick([20, 50, 100]), y = rng.int(2, 3), ans = bank(b, fee, y); return { type: 'number', q: `A savings balance of €${b} earns 10% interest at the end of each year, and then a fixed €${fee} fee is taken. What is the balance after ${y} years?`, answer: ans, tolerance: 0.01, hints: ['Each year: multiply by 1.1, then subtract the fee.', 'Multiply first, then take the fee, once per year.'], explain: `Each year is 1.1 × previous − ${fee}: ${[b, ...Array.from({ length: y }, (_, i) => bank(b, fee, i + 1))].join(' → ')}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the savings balance?', options: [
        'multiply the last value by k, then add a fixed c',
        'add the fixed c first, then multiply by k',
        'multiply by k only; c is too small to matter',
        'add the same amount to the value every step',
      ], answer: 0, traps: { 1: 'the fee comes after the interest; test the order on one year and it fails', 2: 'the leftover is the same every step, so leaving it out is wrong by c each time', 3: 'the step grows with the balance; only the leftover after multiplying is fixed' }, explain: 'Interest then fee is k × previous + c with k = 1.1 and c = −fee: the same two moves, in the same order, as the number sequences.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'affine-recurrence', section: 'nl', count: 3 },
  ],
};
