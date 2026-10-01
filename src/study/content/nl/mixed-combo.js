// NumberLogic family lesson: two rules combined (a multiplier plus a leftover that follows its own
// small sequence). Every number shown is computed here.
import { S, neg, sgn, seq, ratio, nz, nextQ, pick, num, affine, geo } from './method-ladder.js';

// The generator's four variants: × k then add i + s; × k then subtract i + s; × k then ±c
// alternately; × (i + s) then add c. Term 1 is a; term i + 1 = mult(i) × term i + extra(i).
const extra = (p, i) => (p.v === 'plusIndex' ? i + p.s : p.v === 'minusIndex' ? -(i + p.s) : p.v === 'altConst' ? (i % 2 ? p.c : -p.c) : p.c);
const mult = (p, i) => (p.v === 'indexMul' ? i + p.s : p.k);
const mc = (p, n) => { const o = [p.a]; for (let i = 1; i < n; i++) o.push(o[i - 1] * mult(p, i) + extra(p, i)); return o; };
const left = (p, xs) => xs.slice(1).map((v, i) => v - mult(p, i + 1) * xs[i]);
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const plus = (v) => (v < 0 ? ` − ${-v}` : ` + ${v}`);
const DESC = {
  plusIndex: (p) => `add ${1 + p.s}, ${2 + p.s}, ${3 + p.s}, …`,
  minusIndex: (p) => `subtract ${1 + p.s}, ${2 + p.s}, ${3 + p.s}, …`,
  altConst: (p) => `add ${p.c}, subtract ${p.c}, alternately`,
  indexMul: (p) => `${p.c < 0 ? 'subtract' : 'add'} ${Math.abs(p.c)} every time`,
};
const mulDesc = (p) => (p.v === 'indexMul' ? `× ${1 + p.s}, × ${2 + p.s}, × ${3 + p.s}, …` : `× ${p.k}`);

// Parameters as in the generator (level 5); lists with a 0 or a repeated term are redrawn. Every
// parameter set was checked with the rule finder: none fits a second rule.
const V = {
  plusIndex: (rng) => ({ v: 'plusIndex', k: rng.pick([2, 3]), s: rng.int(0, 3), a: rng.int(1, 5) }),
  minusIndex: (rng) => ({ v: 'minusIndex', k: rng.pick([2, 3]), s: rng.int(1, 4), a: rng.int(4, 9) }),
  altConst: (rng) => ({ v: 'altConst', k: rng.pick([2, 3]), c: rng.int(1, 5), a: rng.int(1, 6) }),
  indexMul: (rng) => ({ v: 'indexMul', s: rng.int(0, 1), c: nz(rng, -3, 3), a: rng.int(1, 4) }),
};
function draw(rng, v = rng.pick(Object.keys(V))) {
  for (;;) { const p = V[v](rng), xs = mc(p, 8); if (xs.slice(0, 7).every((x) => x !== 0) && new Set(xs.slice(0, 7)).size === 7) return { ...p, xs }; }
}
const fixedK = (rng) => draw(rng, rng.pick(['plusIndex', 'minusIndex', 'altConst']));

const CHp = { v: 'plusIndex', k: 2, s: 0, a: 2 }, CH = mc(CHp, 7);
const E1p = { v: 'altConst', k: 2, c: 3, a: 5 }, E1 = mc(E1p, 7);
const E2p = { v: 'minusIndex', k: 3, s: 1, a: 5 }, E2 = mc(E2p, 7);
const E3p = { v: 'indexMul', s: 1, c: -1, a: 2 }, E3 = mc(E3p, 7);
const PREDp = { v: 'plusIndex', k: 3, s: 0, a: 1 }, PRED = mc(PREDp, 7);
const ERRp = { v: 'plusIndex', k: 2, s: 1, a: 3 }, ERR = mc(ERRp, 7);
const RES = 1, LASTV = 50;
const AF = affine(2, 2, 1, 6), FACT = [1, 2, 6, 24, 120, 720];

export default {
  id: 'nl/mixed-combo',
  book: 'nl',
  kind: 'family',
  family: 'mixed-combo',
  title: 'Two rules combined',
  summary: 'Ratios near a multiplier, but the leftover after multiplying is not constant: solve the leftovers as their own small sequence, then next = multiplier × last + next leftover.',
  prerequisites: ['nl/method-ladder', 'nl/affine-recurrence', 'nl/multiply-index', 'nl/add-index'],
  objectives: [
    'Read the dominant multiplier from the late ratios',
    'Compute the leftovers and name their pattern: counting, alternating or constant',
    'Handle a multiplier that counts up (× 2, × 3, × 4) with a constant leftover',
    'Combine both rules for the next term without reusing the last leftover',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'ratio', label: 'Multiply by k only', approach: `Read the ratio near ${CHp.k} and gave ${CHp.k} × ${CH[5]} = ${CHp.k * CH[5]}.`, breaksAt: 'A leftover is added on every step, the next one too.' },
      { id: 'affine', label: 'Reuse the last leftover', approach: `Treated it as k × last + c with c = the last leftover, ${extra(CHp, 5)}.`, breaksAt: 'The leftovers change; they form a sequence of their own.' },
      { id: 'fixed-k', label: 'Force one multiplier', approach: 'Looked for a single k although the ratios kept climbing.', breaksAt: 'Ratios that climb 2, 3, 4, 5 mean the multiplier itself counts up.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with the gaps, once by comparing each term with 2 × the term before it.`, answer: String(CH[6]), explain: `Gaps ${seq(CH.slice(1, 6).map((v, i) => v - CH[i]))}: no clean rule. Against 2 × previous, the leftovers are ${seq(left(CHp, CH.slice(0, 6)))}: they count up. So the next leftover is ${extra(CHp, 6)} and the next term 2 × ${CH[5]} + ${extra(CHp, 6)} = ${CH[6]}.` },
    { type: 'text', text: 'Two simple rules are stacked. A **multiplier** drives the growth (× 2, × 3, or a multiplier that counts up), and a small **leftover** is added each step that follows its own pattern: it counts up, counts down, alternates in sign, or stays constant beside a counting multiplier.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 6))}, ?`] },
    { type: 'text', text: `Not this lesson: a constant leftover with a fixed multiplier (${seq(AF.slice(0, 5))}, the multiply-then-add lesson) or a counting multiplier with no leftover (${seq(FACT.slice(0, 5))}, the multiply-by-the-count lesson).` },
    { type: 'check', scope: 'the cue: a leftover that changes', questions: [
      { make: (rng) => { const p = draw(rng, 'plusIndex'), xs = p.xs.slice(0, 6), af = affine(rng.int(1, 5), p.k, rng.int(1, 4), 6); const ge = geo(rng.int(2, 6), p.k, 6); return pick(rng, `All three lists grow by about × ${p.k}. In which one does the leftover after × ${p.k} change from step to step?`, seq(xs), [[seq(af), `its leftovers after × ${p.k} are all ${af[1] - p.k * af[0]}: the multiply-then-add rule`], [seq(ge), `its leftovers are all 0: plain multiplication`]], `Leftovers of ${seq(xs)}: ${seq(left(p, xs))}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'The last items of the test stack two easy rules, and the only way through is to peel them apart. Guessing a single formula fails, the ratios alone never settle, and the gaps look chaotic from the first step to the last. Remove the dominant multiplier and a short, simple list is left: that list is the second rule. The method is the multiply-then-add test from earlier, with one extra look at the leftovers.' },

    S('anchor'),
    { type: 'text', text: 'In the multiply-then-add lesson, next − k × previous was the same c on every step. This family changes **one thing**: that leftover is itself a small sequence (1, 2, 3, …, or +c, −c, +c, …). Find it the same way, then continue it like any sequence.' },
    { type: 'check', scope: 'continuing the leftover sequence', questions: [
      { make: (rng) => { const p = fixedK(rng), lo = left(p, p.xs.slice(0, 6)); return num(`After × ${p.k}, the leftovers of a sequence are ${seq(lo)}. What is the next leftover?`, extra(p, 6), `They ${DESC[p.v](p)}: next ${neg(extra(p, 6))}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Line up k × previous against the actual term: the leftover column now changes, but in a simple way. Charting the leftovers shows the three patterns side by side; the ratios, meanwhile, drift towards k.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['previous', `${CHp.k} × previous`, 'actual next', 'leftover'], rows: CH.slice(0, 5).map((v, i) => [String(v), String(CHp.k * v), String(CH[i + 1]), sgn(CH[i + 1] - CHp.k * v)]) }, caption: `${seq(CH.slice(0, 6))}: the leftovers count ${seq(left(CHp, CH.slice(0, 6)))}. Next: ${CHp.k} × ${CH[5]} + ${extra(CHp, 6)} = ${CH[6]}.` },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Leftovers after multiplying, step by step', xLabel: 'step', yLabel: 'leftover', categories: ['1', '2', '3', '4', '5'], series: [{ name: `${seq(CH.slice(0, 3))}, … (× 2)`, values: left(CHp, CH.slice(0, 6)) }, { name: `${seq(E1.slice(0, 3))}, … (× 2)`, values: left(E1p, E1.slice(0, 6)) }, { name: `${seq(AF.slice(0, 3))}, … (× 2)`, values: AF.slice(1, 6).map((v, i) => v - 2 * AF[i]) }], valueLabels: true }, caption: 'Three leftover patterns: counting up (this lesson), alternating in sign (this lesson), constant (the multiply-then-add lesson). Name the pattern and you have the second rule.' },
    { type: 'check', scope: 'reading the leftover column', questions: [
      { make: (rng) => { const p = fixedK(rng), xs = p.xs.slice(0, 6); return num(`${seq(xs)}: what is the last leftover, ${neg(xs[5])} − ${p.k} × ${par(xs[4])}?`, extra(p, 5), `${neg(xs[5])} − ${par(p.k * xs[4])} = ${neg(extra(p, 5))}. All leftovers: ${seq(left(p, xs))}.`, [`Multiply the second-last term by ${p.k}.`, 'Subtract from the last term.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [CH.slice(1, 6), CH.slice(2, 6).map((v, i) => ratio(CH[i + 1], v))] }, caption: `Ratios ${CH.slice(2, 6).map((v, i) => (v / CH[i + 1]).toFixed(2)).join(', ')}: they slide towards ${CHp.k} as the terms grow, because the leftover matters less and less. Read the multiplier from the largest pair.` },

    S('derivation'),
    { type: 'text', text: `A second pattern to keep in mind: ${seq(E1.slice(0, 6))}. The ratios sit near ${E1p.k}; the leftovers after × ${E1p.k} are ${seq(left(E1p, E1.slice(0, 6)))}, alternating in sign. Five leftovers shown, so the next is the sixth: ${sgn(extra(E1p, 6))}, and the next term is ${E1p.k} × ${E1[5]}${plus(extra(E1p, 6))} = ${E1[6]}. Whose turn it is matters here, exactly as with two strands.` },
    { type: 'steps', steps: [
      { say: 'Estimate the multiplier from the last ratio (the largest terms). If it sits near a whole number k, the dominant rule is × k.', why: 'Multiplication dominates growth, and the leftover shrinks in relative size as the terms grow.',
        checks: [
          { make: (rng) => { const p = fixedK(rng), xs = p.xs.slice(0, 6); return num(`${seq(xs)}: the last ratio ${neg(xs[5])} ÷ ${par(xs[4])} is about ${(xs[5] / xs[4]).toFixed(2)}. Which whole-number multiplier drives the growth?`, p.k, `Close to ${p.k}.`); } },
        ] },
      { answers: 'ratio', say: 'Compute the leftovers: each term minus k × the term before it.', why: 'Removing the dominant rule exposes whatever is added on each step.',
        checks: [
          { make: (rng) => { const p = fixedK(rng), xs = p.xs.slice(0, 6); return num(`${seq(xs)}, with k = ${p.k}: what is the third leftover, ${neg(xs[3])} − ${p.k} × ${par(xs[2])}?`, extra(p, 3), `${neg(xs[3])} − ${par(p.k * xs[2])} = ${neg(extra(p, 3))}.`); } },
        ] },
      { answers: 'affine', say: 'Name the leftover pattern: constant, counting up or down, or alternating in sign. Continue it by one step.', why: 'The leftovers are always a simple sequence; it is the second rule.',
        checks: [
          { make: (rng) => { const p = fixedK(rng), lo = left(p, p.xs.slice(0, 6)); const names = { plusIndex: 'counting up by 1', minusIndex: 'counting down by 1', altConst: 'alternating in sign' }; return pick(rng, `The leftovers after × ${p.k} are ${seq(lo)}. What is their pattern?`, names[p.v], [...Object.entries(names).filter(([k]) => k !== p.v).map(([, v]) => [v, `the leftovers ${seq(lo)} do not do that`]), ['constant', 'they change from step to step']], `They ${DESC[p.v](p)}; next ${neg(extra(p, 6))}.`); } },
        ] },
      { answers: 'fixed-k', say: 'If the ratios themselves count up (near 2, 3, 4, 5), the multiplier counts up. Subtract n × previous with the right n; the leftover is then a constant.', why: 'This is the multiply-by-the-count rule with a constant added: the same peeling, with a moving multiplier.',
        checks: [
          { make: (rng) => { const p = draw(rng, 'indexMul'), xs = p.xs.slice(0, 6); return num(`${seq(xs)}: the multipliers are ${mulDesc(p)}. What is ${neg(xs[4])} − ${mult(p, 4)} × ${par(xs[3])}?`, p.c, `${neg(xs[4])} − ${par(mult(p, 4) * xs[3])} = ${neg(p.c)}, the same on every step.`); } },
        ] },
      { say: 'Next = multiplier × last + the **next** leftover.', why: 'Both rules move one step: the multiplier (fixed or counting) and the leftover sequence.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `Multiplier ${mulDesc(p)}; leftovers ${DESC[p.v](p)}: ${mult(p, 6)} × ${par(xs[5])}${plus(extra(p, 6))} = ${neg(xs[6])}.`, ['Read the multiplier from the ratios.', 'Continue the leftovers by one step, then combine.']); } },
        ] },
    ] },
    { type: 'text', text: `The counting-multiplier version, ${seq(E3.slice(0, 6))}: the ratios ${E3.slice(1, 6).map((v, i) => (v / E3[i]).toFixed(1)).join(', ')} climb rather than settle, which rules out a fixed k. Subtract ${[1, 2, 3].map((i) => i + E3p.s).join(', ')}, … times the previous term instead, the multiplier rising by one each step: the leftovers are ${seq(left(E3p, E3.slice(0, 6)))}, constant. Next: ${mult(E3p, 6)} × ${E3[5]}${plus(E3p.c)} = ${E3[6]}.` },
    { type: 'explain', prompt: 'Why subtract the multiplied part first, and why must the leftover move on to its next value?', model: 'The multiplier creates almost all of the growth, so it hides the small added part; subtracting k × previous removes it exactly and leaves the added sequence. Each step of the rule uses the next entry of that sequence, so reusing the last leftover applies an old step instead of the new one.', points: ['Multiplication dominates, so remove it to see the rest', 'The leftovers are a sequence of their own', 'The next step uses the next leftover, not the last one'] },

    S('worked'),
    { type: 'worked', family: 'mixed-combo', section: 'nl', difficulty: 5, seed: 'a', explainAt: [1], intro: 'Find the multiplier and the leftovers before opening the solution.' },
    { type: 'worked', family: 'mixed-combo', section: 'nl', difficulty: 5, seed: 'b', fade: 1, intro: 'The leftovers are given; continuing them and combining are yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? Predict the multiplier and the next leftover before computing the term.`, answer: `× ${PREDp.k}, leftovers ${seq(left(PREDp, PRED.slice(0, 6)))}, so the next leftover is ${extra(PREDp, 6)}: ${PREDp.k} × ${PRED[5]} + ${extra(PREDp, 6)} = ${PRED[6]}.`, explain: `The ratios settle just above ${PREDp.k}, and the leftovers count.` },

    S('traps'),
    { type: 'traps', family: 'mixed-combo', section: 'nl', extra: [
      { belief: 'Reuse the last leftover.', fix: 'The leftover is a sequence: move it one step on.' },
      { belief: 'The ratio is near k, so the answer is k × last.', fix: 'The leftover is part of every step. Add the next one.' },
      { belief: 'Leftovers that change mean the multiplier is wrong.', fix: 'If they change in a simple pattern, both rules are right; name the pattern.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `The ratios approach ${ERRp.k}: multiply by ${ERRp.k}.`,
      `Leftovers after × ${ERRp.k}: ${seq(left(ERRp, ERR.slice(0, 6)))}.`,
      `So next = ${ERRp.k} × ${ERR[5]} + ${extra(ERRp, 5)} = ${ERRp.k * ERR[5] + extra(ERRp, 5)}.`,
      `Answer: ${ERRp.k * ERR[5] + extra(ERRp, 5)}.`,
    ], errorStep: 2, explain: `The leftovers count up, so the next one is ${extra(ERRp, 6)}, not the last one again: ${ERRp.k} × ${ERR[5]} + ${extra(ERRp, 6)} = ${ERR[6]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), xs = p.xs, a = xs[5], m = mult(p, 6); const w = [[m * a + extra(p, 5), `reused the last leftover (${sgn(extra(p, 5))}); it moves on to ${sgn(extra(p, 6))}`], [m * a, `applied × ${m} but dropped the leftover ${sgn(extra(p, 6))}`]]; if (p.v === 'indexMul') w.push([(m - 1) * a + p.c, `reused the multiplier ${m - 1}; it rises to ${m}`]); else w.push([m * a - extra(p, 6), `right multiplier, but the leftover with the wrong sign (${sgn(-extra(p, 6))})`]); w.push([xs[7], 'went one step too far: that is the term after the next one']); return pick(rng, nextQ(xs.slice(0, 6)), xs[6], w, `${m} × ${par(a)}${plus(extra(p, 6))} = ${neg(xs[6])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Read k from the last pair, where the leftover matters least. Then compute only the last three leftovers: three multiplications are enough to name the pattern and extend it.' },
    { type: 'callout', tone: 'speed', text: 'Size check: the answer is close to k × last, off by one small leftover. Any option far from k × last is out before you finish.' },
    { type: 'thinkaloud', problem: nextQ(E2.slice(0, 6)), lines: [
      { t: 0, say: `Ratios near ${E2p.k}: ${E2[5]} ÷ ${E2[4]} is about ${(E2[5] / E2[4]).toFixed(2)}. Multiplier ${E2p.k}.` },
      { t: 6, say: `Leftovers after × ${E2p.k}: ${seq(left(E2p, E2.slice(0, 6)))}. Not constant.` },
      { t: 10, say: `The last leftover was ${neg(extra(E2p, 5))}, so use it again: ${E2p.k} × ${E2[5]}${plus(extra(E2p, 5))} = ${E2p.k * E2[5] + extra(E2p, 5)}.`, slip: true },
      { t: 14, say: `No: the leftovers count down by 1 every step, so the next one is ${neg(extra(E2p, 6))}, not ${neg(extra(E2p, 5))}.` },
      { t: 18, say: `${E2p.k} × ${E2[5]} = ${E2p.k * E2[5]}, then ${plus(extra(E2p, 6)).trim()}: ${E2[6]}.` },
      { t: 22, say: `Size check: close to ${E2p.k} × ${E2[5]}, off by one small leftover. Answer ${E2[6]}.` },
    ] },
    { type: 'check', scope: 'k from the last pair, three leftovers', questions: [
      { make: (rng) => { const p = fixedK(rng), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `× ${p.k}; leftovers ${seq(left(p, xs.slice(0, 6)))}, next ${neg(extra(p, 6))}: ${neg(xs[6])}.`, ['k from the last ratio.', 'Three leftovers, name the pattern, extend it.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Ratios near k, leftover not constant → leftovers = term − k × previous form a simple sequence → next = k × last + next leftover (multiplier counting up: subtract n × previous).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Multiplier', 'Leftovers', 'Next'], rows: [
      [seq(AF.slice(0, 5)), '× 2', `${seq(AF.slice(1, 5).map((v, i) => v - 2 * AF[i]))} (constant)`, String(AF[5])],
      [seq(CH.slice(0, 5)), mulDesc(CHp), seq(left(CHp, CH.slice(0, 5))), String(CH[5])],
      [seq(E1.slice(0, 5)), mulDesc(E1p), seq(left(E1p, E1.slice(0, 5))), String(E1[5])],
      [seq(FACT.slice(0, 5)), '× 2, × 3, × 4, …', '0 (none)', String(FACT[5])],
      [seq(E3.slice(0, 5)), mulDesc(E3p), seq(left(E3p, E3.slice(0, 5))), String(E3[5])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 6))}, ? (× 2, then ${DESC.plusIndex(CHp)}; next ${CH[6]})`, rows: [
      { change: 'The leftover stays at 1 every step', effect: `${seq(affine(CH[0], 2, 1, 6))}: the multiply-then-add rule, next ${affine(CH[0], 2, 1, 7)[6]}.` },
      { change: 'Multiply by 3 instead of 2', effect: `${seq(mc({ ...CHp, k: 3 }, 6))}: the same leftovers on a faster base, next ${mc({ ...CHp, k: 3 }, 7)[6]}.` },
      { change: 'Subtract the counting leftovers instead of adding them', effect: `${seq(mc({ v: 'minusIndex', k: 2, s: 0, a: CH[0] }, 6))}: next ${mc({ v: 'minusIndex', k: 2, s: 0, a: CH[0] }, 7)[6]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the shown leftovers become ${seq(left(CHp, CH.slice(0, 6)).slice(1))}, still counting, so the next leftover is still ${extra(CHp, 6)} and the next term ${CH[6]}.` },
      { change: 'Multiply by 3 and subtract the counting leftovers', fusion: true, effect: `The faster multiplier dominates and the subtracted leftovers pull each step down a little: ${seq(mc({ v: 'minusIndex', k: 3, s: 0, a: CH[0] }, 6))}, next ${mc({ v: 'minusIndex', k: 3, s: 0, a: CH[0] }, 7)[6]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a leftover pattern of 0, 0, 0 is plain multiplication; a constant leftover is the multiply-then-add lesson. With a counting multiplier, the ratios drift upwards (${E3.slice(1, 5).map((v, i) => (v / E3[i]).toFixed(1)).join(', ')}) instead of settling, so subtract n × previous with n rising.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: decomposing a series into a dominant trend plus a small residual, then modelling the residual on its own, is how most forecasting starts. Peel the big effect first; the small one is easier to see once it is alone.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const p = t === 0 ? draw(rng, 'plusIndex') : t === 1 ? draw(rng, 'altConst') : { v: 'aff', k: rng.pick([2, 3]), c: rng.int(1, 5) }; const xs = t === 2 ? affine(rng.int(1, 5), p.k, p.c, 6) : p.xs.slice(0, 6); const lo = xs.slice(1).map((v, i) => v - p.k * xs[i]); const names = ['leftovers count up', 'leftovers alternate in sign', 'leftovers are constant']; return pick(rng, `${seq(xs)}: after × ${p.k}, which pattern do the leftovers follow?`, names[t], names.map((nm, i) => [nm, `the leftovers are ${seq(lo)}`]).filter((_, i) => i !== t), `Leftovers: ${seq(lo)}.`); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = fixedK(rng), xs = p.xs; return num(`A savings pot is multiplied by ${p.k} each year, then a deposit or withdrawal that follows its own pattern is applied: ${seq(xs.slice(0, 6))}. What is next year's value?`, xs[6], `Leftovers after × ${p.k}: ${seq(left(p, xs.slice(0, 6)))}; next ${neg(extra(p, 6))}: ${p.k} × ${par(xs[5])}${plus(extra(p, 6))} = ${neg(xs[6])}.`, ['Subtract k × last year from each year.', 'Continue the leftovers, then combine.']); } },
      far: { type: 'number', q: `A data series is modelled as 2 × the previous value plus a residual that alternates +${RES} and −${RES}. The last value is ${LASTV} and the last residual was +${RES}. What does the model predict next?`, answer: 2 * LASTV - RES, explain: `Trend: 2 × ${LASTV} = ${2 * LASTV}. The residual alternates, so after +${RES} comes −${RES}: ${2 * LASTV - RES}.`, hints: ['Apply the dominant rule first.', 'Then the next residual, not the last one.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the model?', options: ['Remove the main rule, then solve what is left', 'Multiply the last value by the ratio only', 'Reuse the last residual for the next step', 'Add the last two values of the series'], answer: 0, traps: { 1: 'that drops the residual completely', 2: 'the residual alternates, so it changes sign each step', 3: 'the model uses one previous value, not two' }, explain: 'Trend plus residual is exactly multiplier plus leftover: peel off the trend, continue the residual, recombine.' } },

    S('tryit'),
    { type: 'tryit', family: 'mixed-combo', section: 'nl', count: 3 },
  ],
};
