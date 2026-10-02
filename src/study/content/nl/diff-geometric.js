// NumberLogic family lesson: the gaps form a geometric sequence. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, ratios, nextQ, pick, num, geo, quad, affine } from './method-ladder.js';

// a(0) = a, gap i = g * r^(i - 1): the generator's parametrisation.
const dg = (a, gg, r, n) => { const o = [a]; for (let i = 1; i < n; i++) o.push(o[i - 1] + gg * r ** (i - 1)); return o; };
const g = (xs) => diffs(xs);

const CHa = 5, CHr = 3, CH = dg(CHa, 1, CHr, 6), CHc = CH[1] - CHr * CH[0];
const E2r = 2, E2 = dg(10, 3, E2r, 6);
const E3 = dg(4, 2, 3, 6);
const ZZ = dg(20, 3, -2, 7);
const PRED = dg(3, 1, 2, 6);
const ERR = dg(5, 2, 2, 6), ERRr = 2;
const QD = quad(3, 1, 2, 5);
const GEr = 2, GE = geo(3, GEr, 5);
const AFk = 2, AFc = 1, AF = affine(2, AFk, AFc, 5);
const P2 = geo(1, 2, 7);

// Gap 1 with a small start can mimic a digit rule (10, 11, 13, 17, 25 adds its digit sum), and
// start = first gap is plain doubling, so the checks draw around both.
const d2 = (rng, n) => { const r = 2; let a, gg; do { a = rng.int(1, 20); gg = rng.int(2, 5); } while (a === gg); return { r, xs: dg(a, gg, r, n) }; };
const d3 = (rng, n) => { const r = rng.pick([3, -2]); return { r, xs: dg(rng.int(-10, 20), rng.int(1, 4) * rng.pick([1, -1]), r, n) }; };
const anyP = (rng, n) => (rng.chance(0.5) ? d2(rng, n) : d3(rng, n));
const TA = dg(7, 2, 2, 6), TAg = g(TA), TAc = TA[1] - 2 * TA[0];
const E25 = E2.slice(0, 5), E2up = dg(100, 3, E2r, 6), E2tri = dg(10, 3, 3, 6), E2neg = dg(10, 3, -2, 6), E2both = dg(100, 3, 3, 6);
const HALVES = [32, 48, 64, 80, 96];
const times = (r) => (r < 0 ? `(${neg(r)})` : String(r));

export default {
  id: 'nl/diff-geometric',
  book: 'nl',
  kind: 'family',
  family: 'diff-geometric',
  title: 'Gaps that multiply',
  summary: 'Gaps not constant, gaps of gaps not constant either? Divide neighbouring gaps: a constant ratio r means next gap = last gap × r.',
  prerequisites: ['nl/method-ladder', 'nl/geometric', 'nl/second-diff'],
  objectives: [
    'Spot gaps that double or triple once the second row fails',
    'Continue the gap row by its ratio and climb back to the next term',
    'Handle a negative gap ratio, where the terms zigzag with growing swings',
    'Read the same sequence as r × previous + c when that is faster',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by comparing each term with ${CHr} × the term before.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} triple, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. Or: every term is ${CHr} × the previous ${CHc < 0 ? 'minus' : 'plus'} ${Math.abs(CHc)} (${CHr} × ${CH[4]} ${sgn(CHc)} = ${CH[5]}). The two readings are the same rule, and this lesson shows why.`,
      attempts: [
        { id: 'more-rows', label: 'Keep subtracting', approach: `Took the gaps ${seq(g(CH.slice(0, 5)))}, then their gaps ${seq(g(g(CH.slice(0, 5))))}, and kept going, waiting for a flat row.`, breaksAt: `Each new row is the row above times ${CHr - 1}: under a ratio, subtraction never settles.` },
        { id: 'terms-ratio', label: 'Divide the terms', approach: `Divided neighbouring terms and got ${ratios(CH.slice(0, 5)).join(', ')}.`, breaksAt: 'The terms are a start plus a geometric run of gaps, so their ratios drift. The constant ratio lives one row down, in the gaps.' },
        { id: 'multiply-term', label: 'Multiply the last term', approach: `Saw the gaps triple and answered ${CH[4]} × ${CHr} = ${CH[4] * CHr}.`, breaksAt: `Only the gaps triple: the next gap is ${g(CH)[3]} × ${CHr} = ${g(CH)[4]}, and it is added to ${CH[4]}.` },
      ] },
    { type: 'text', text: `The **gaps** change by a constant **factor**: ${seq(geo(1, 2, 4))}, or ${seq(geo(2, 3, 4))}, or ${seq(geo(3, -2, 4))}. The terms themselves are not geometric: they are a starting value plus a geometric run of gaps. When the factor is negative, the gaps alternate in sign and the terms zigzag with growing swings.` },
    { type: 'list', items: [`What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`, `What number comes next?  ${seq(ZZ.slice(0, 6))}, ?`] },
    { type: 'check', scope: 'the cue: gaps with a constant factor', questions: [
      { make: (rng) => { const p = d2(rng, 5), q = quad(rng.int(1, 20), rng.int(1, 5), rng.int(1, 3), 5), ge = geo(rng.int(2, 5), 3, 5); return pick(rng, 'In which sequence do the gaps (not the terms) multiply by a constant?', seq(p.xs), [[seq(q), `its gaps ${seq(g(q))} grow by a fixed amount`], [seq(ge), 'there the terms themselves multiply: divide the terms, not the gaps']], `The gaps of ${seq(p.xs)} are ${seq(g(p.xs))}: each is twice the one before.`); } },
    ] },
    { type: 'text', text: `Not this lesson: gaps that grow by a fixed amount (${seq(QD)} has gaps ${seq(g(QD))}, the second-difference lesson). Also terms that are themselves geometric (${seq(GE)}, where the terms, not just the gaps, keep one ratio).` },
    { type: 'check', scope: 'steady gaps against multiplying gaps', questions: [
      { type: 'choice', q: '3, 4, 7, 12, 19: which lesson is it?', options: ['second differences: gaps rise by 2', 'gaps that multiply (this lesson)', 'terms that multiply'], answer: 0, traps: { 1: 'the gaps 1, 3, 5, 7 rise by 2; they do not multiply', 2: '7/4 and 12/7 are different ratios' }, explain: 'Gaps 1, 3, 5, 7 grow by a fixed amount: the second-difference lesson.' },
    ] },

    S('why'),
    { type: 'text', text: 'Many sequences that look irregular are a plain geometric run one layer down. The ladder finds them in two moves, subtract then divide, so an item that looks like a late-test puzzle becomes a 30-second one. Test writers use this family in the middle of the test precisely because the second row fails and tempts people into guessing a formula. It is also the bridge to the next lesson: seen from the terms rather than the gaps, the very same sequences read as "multiply, then add a constant", and knowing both views lets you use whichever is quicker.' },

    S('anchor'),
    { type: 'text', text: 'In the second-difference lesson the gap row was a **constant-gap** sequence. This family changes **one thing**: the gap row is a **constant-ratio** sequence. So continue the gap row with the ratio rule you already know, then climb back up exactly as before.' },
    { type: 'check', scope: 'continuing a geometric gap row', questions: [
      { make: (rng) => { const r = rng.pick([2, 3, -2]), gs = geo(rng.int(1, 5) * rng.pick([1, -1]), r, 5); return num(`The gaps of a sequence are ${seq(gs.slice(0, 4))}. Each is ${neg(r)} times the one before. What is the next gap?`, gs[4], `${neg(gs[3])} × ${times(r)} = ${neg(gs[4])}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Build the ladder as usual. The gap row is not flat, and the row under it is not flat either: it is the gap row scaled, the signature of multiplication. So under the gaps, write **ratios** instead of a second row of differences.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E2.slice(0, 5), 2) }, caption: `${seq(E2.slice(0, 5))}: gaps ${seq(g(E2.slice(0, 5)))}, and the second row ${seq(g(g(E2.slice(0, 5))))} copies them. Subtraction will never settle here.` },
    { type: 'check', scope: 'when the second row copies the gaps', questions: [
      { type: 'choice', q: 'The second row of a ladder copies the gap row. What do you do next?', options: ['divide neighbouring gaps', 'build a third row of differences', 'stop: there is no rule'], answer: 0, traps: { 1: 'subtraction will never settle here', 2: 'dividing the gaps finds the rule' }, explain: 'A copied row is the sign of multiplication one layer down: divide the gaps.' },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [g(E2), ratios(g(E2))], predicted: true }, caption: `Divide the gaps instead: ${ratios(g(E2)).slice(0, 3).join(', ')}. The outlined cells continue it: next gap ${g(E2)[3]} × ${E2r} = ${g(E2)[4]}, so the next term is ${E2[4]} + ${g(E2)[4]} = ${E2[5]}.` },
    { type: 'check', scope: 'the ratio row under the gaps', questions: [
      { make: (rng) => { const p = anyP(rng, 5); return num(`What is the ratio between neighbouring gaps of ${seq(p.xs)}?`, p.r, `Gaps ${seq(g(p.xs))}; ${neg(g(p.xs)[1])} ÷ ${neg(g(p.xs)[0])} = ${neg(p.r)}.`, ['Write the gaps first.', 'Divide each gap by the one before it, keeping signs.']); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Gaps of ${seq(ZZ)}`, xLabel: 'step', yLabel: 'gap', categories: g(ZZ).map((_, i) => String(i + 1)), series: [{ name: 'gap', values: g(ZZ) }], valueLabels: true }, caption: `A negative ratio (${ratios(g(ZZ))[0]}): the gaps flip sign and double in size, so the terms zigzag with growing swings. Neighbouring gaps divide to the same ${ratios(g(ZZ))[0]} every time.` },

    { type: 'check', scope: 'a negative gap ratio', questions: [
      { make: (rng) => { const xs = dg(rng.int(0, 30), rng.int(1, 4), -2, 7), last = g(xs)[5], up = g(xs)[5] > 0; return pick(rng, `The gaps of ${seq(xs.slice(0, 6))} are ${seq(g(xs).slice(0, 5))}. Will the next term be above or below ${neg(xs[5])}?`, up ? 'above' : 'below', [[up ? 'below' : 'above', `the last gap was ${neg(g(xs)[4])}; with ratio −2 the sign flips`]], `Next gap ${neg(g(xs)[4])} × (−2) = ${neg(last)}, so the next term is ${neg(xs[6])}.`); } },
    ] },
    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Take the gaps, later minus earlier. They are not constant.', why: 'Always the first test: it rules out the constant-gap family and builds the row you will need.',
        checks: [
          { make: (rng) => { const p = d3(rng, 5); return num(`${seq(p.xs)}: what is the last gap?`, g(p.xs)[3], `Gaps ${seq(g(p.xs))}.`, ['Later minus earlier, with signs.', `${neg(p.xs[4])} − ${p.xs[3] < 0 ? `(${neg(p.xs[3])})` : p.xs[3]}.`]); } },
        ] },
      { answers: 'more-rows', say: 'Take the gaps of the gaps. Not constant either, and they look like a scaled copy of the gaps. Stop subtracting.', why: 'If each gap is r × the previous, the second row is (r − 1) × the gaps: another geometric run. More subtraction layers never settle.',
        checks: [
          { make: (rng) => { const p = d2(rng, 5), g2 = g(g(p.xs)); return pick(rng, `${seq(p.xs)} has gaps ${seq(g(p.xs))} and second row ${seq(g2)}. What next?`, 'divide neighbouring gaps', [['take a third row of differences', `the third row ${seq(g(g2))} copies again; subtraction never settles under a ratio`], ['divide neighbouring terms', `the terms are not geometric: ${ratios(p.xs).slice(0, 2).join(', ')} differ`]], 'The second row copies the gap row: the gaps multiply.'); } },
        ] },
      { answers: 'terms-ratio', say: 'Divide neighbouring gaps. If every ratio is r, the gap row is geometric.', why: 'This is the constant-ratio test applied one layer down, exactly as the second-difference lesson applied the constant-gap test one layer down.',
        checks: [
          { make: (rng) => { const p = d3(rng, 6); return num(`${seq(p.xs)}: the gaps are ${seq(g(p.xs))}. What is their ratio?`, p.r, `${neg(g(p.xs)[2])} ÷ ${neg(g(p.xs)[1])} = ${neg(p.r)}.`); } },
        ] },
      { say: 'Continue the gap row: next gap = last gap × r.', why: 'The gap row follows its own rule, independent of the terms.',
        checks: [
          { make: (rng) => { const p = anyP(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? What is the next gap?`, g(p.xs)[4], `Gap ratio ${neg(p.r)}: ${neg(g(p.xs)[3])} × ${times(p.r)} = ${neg(g(p.xs)[4])}.`, ['Find the gaps and their ratio.', 'Multiply the last gap by the ratio.']); } },
        ] },
      { answers: 'multiply-term', say: 'Climb up: next term = last term + next gap.', why: 'Every term is the previous term plus its gap; the ratio acts on gaps, never directly on terms.',
        checks: [
          { make: (rng) => { const p = anyP(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Next gap ${neg(g(p.xs)[4])}; ${neg(p.xs[4])} ${sgn(g(p.xs)[4])} = ${neg(p.xs[5])}.`, ['Gaps, then the ratio of the gaps.', 'Next gap first, then add it to the last term.']); } },
        ] },
    ] },
    { type: 'text', text: `The same sequence has a second description. If every gap is r times the one before, then every term is r × the previous term plus a fixed c, with c = term 2 − r × term 1. In the challenge: c = ${CH[1]} − ${CHr} × ${CH[0]} = ${CHc}, and ${CHr} × ${CH[4]} ${sgn(CHc)} = ${CH[5]}. Use whichever you see first; they always agree.` },
    { type: 'check', scope: 'next = r × last + c', questions: [
      { type: 'number', q: '4, 7, 13, 25, 49 has gaps 3, 6, 12, 24. With r = 2, what is c in next = 2 × previous + c?', answer: -1, explain: 'c = term 2 − r × term 1 = 7 − 8 = −1. Check: 2 × 7 − 1 = 13.' },
    ] },
    { type: 'explain', prompt: 'Why does the second row never settle when the gaps multiply, and why do you divide the gaps rather than the terms?', model: 'If each gap is r times the last, the difference between neighbouring gaps is (r − 1) times a gap, which still multiplies, so every further row is another geometric run. The terms are a start plus a geometric run of gaps, so only the gaps share one ratio; dividing the terms gives drifting ratios.', points: ['Second row = (r − 1) × the gaps, still geometric', 'The constant ratio lives in the gap row', 'Terms = start + geometric gaps, so their own ratios drift'] },

    S('worked'),
    { type: 'worked', family: 'diff-geometric', section: 'nl', difficulty: 2, seed: 'a', explainAt: [1], intro: 'Gaps that double. Divide the gaps before opening the solution.' },
    { type: 'worked', family: 'diff-geometric', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'Gaps that triple or flip sign. The gaps and their ratio are given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 5))}, ? The gaps so far are ${seq(g(PRED.slice(0, 5)))}. Is the next gap ${g(PRED)[3] + (g(PRED)[3] - g(PRED)[2])} (growing by a fixed amount) or ${g(PRED)[4]} (doubling)? Commit, then give the term.`, answer: `${g(PRED)[4]}, doubling: the gaps ${seq(g(PRED.slice(0, 5)))} grow by 1, 2, 4, not by a fixed amount. The term is ${PRED[4]} + ${g(PRED)[4]} = ${PRED[5]}.`, explain: 'Look at the whole gap row: the fixed-amount reading only fits the last two gaps.' },

    S('traps'),
    { type: 'traps', family: 'diff-geometric', section: 'nl', extra: [
      { belief: 'The gaps double, so the terms double.', fix: 'Only the gaps multiply. The next term is last + (last gap × r), not last × r.' },
      { belief: 'The gaps grow, so take another row of differences.', fix: 'If the second row copies the gaps, divide instead: subtraction never settles under a ratio.' },
      { belief: 'A negative ratio breaks the pattern.', fix: 'The gaps flip sign each step; divide with signs and the ratio is constant.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 5)))}.`,
      `Each gap is ${ERRr} times the one before.`,
      `So the sequence doubles: ${ERR[4]} × ${ERRr} = ${ERR[4] * ERRr}.`,
      `Answer: ${ERR[4] * ERRr}.`,
    ], errorStep: 2, explain: `The gaps double, not the terms: next gap = ${g(ERR)[3]} × ${ERRr} = ${g(ERR)[4]}, next term = ${ERR[4]} + ${g(ERR)[4]} = ${ERR[5]}. Check the belief on the shown terms: ${ERR[1]} × ${ERRr} is not ${ERR[2]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = anyP(rng, 6), l = p.xs[4], lg = g(p.xs)[3], pg = g(p.xs)[2]; return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], [[l * p.r, `multiplied the last term by ${neg(p.r)}; it is the gaps that multiply`], [l + lg * (p.r + 1), `multiplied the last gap by ${neg(p.r + 1)} instead of ${neg(p.r)}`], [l + lg + (lg - pg), 'grew the gap by a fixed amount, as if the second row were constant'], [l + lg, 'repeated the last gap']], `Next gap ${neg(lg)} × ${times(p.r)} = ${neg(lg * p.r)}; ${neg(l)} ${sgn(lg * p.r)} = ${neg(p.xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Doubling gaps are the common case: ${seq(P2)} should jump out of a gap row at sight. With a negative ratio, check the signs first (they alternate), then the sizes.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps: ${seq(TAg.slice(0, 4))}. Not constant, and the second row ${seq(g(TAg.slice(0, 4)))} copies them.` },
      { t: 5, say: `Doubling everywhere, so the sequence is geometric: ${TA[4]} × 2 = ${TA[4] * 2}.`, slip: true },
      { t: 8, say: `No: ${TA[1]} ÷ ${TA[0]} is not 2, so the terms are not geometric. The gaps are. Double the last gap instead.` },
      { t: 12, say: `Next gap ${TAg[3]} × 2 = ${TAg[4]}; ${TA[4]} + ${TAg[4]} = ${TA[5]}.` },
      { t: 15, say: `Cross-check with 2 × last + c: c = ${TA[1]} − 2 × ${TA[0]} = ${neg(TAc)}, and 2 × ${TA[4]} ${TAc < 0 ? '−' : '+'} ${Math.abs(TAc)} = ${TA[5]}. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: the gaps multiply, not the terms', questions: [
      { make: (rng) => { const p = d2(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Gaps ${seq(g(p.xs).slice(0, 4))} double; the terms do not (${p.xs[1]} ÷ ${p.xs[0]} is not 2). Next gap ${g(p.xs)[4]}, so ${neg(p.xs[4])} + ${g(p.xs)[4]} = ${neg(p.xs[5])}.`, ['Gaps first: what do they do?', 'Double the last gap, then add it to the last term.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Skip the gap row with the equivalent rule: **next = r × last + c**, where c = term 2 − r × term 1. One multiplication and one addition, and a second pair of terms checks it.' },
    { type: 'check', scope: 'next = r × last + c', questions: [
      { make: (rng) => { const p = anyP(rng, 5), c = p.xs[1] - p.r * p.xs[0]; return num(`The gaps of ${seq(p.xs)} multiply by ${neg(p.r)}. Every term is ${neg(p.r)} × the previous + c. What is c?`, c, `c = ${neg(p.xs[1])} − ${times(p.r)} × ${p.xs[0] < 0 ? `(${neg(p.xs[0])})` : p.xs[0]} = ${neg(c)}. Check: ${times(p.r)} × ${p.xs[1] < 0 ? `(${neg(p.xs[1])})` : p.xs[1]} ${sgn(c)} = ${neg(p.xs[2])}.`, ['Take the first two terms.', 'c = term 2 − r × term 1.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Second row copies the gaps → divide the gaps; ratio r → next gap = last gap × r, next = last + next gap (same as r × last + c).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'What stays fixed', 'Next'], rows: [
      [seq(QD), seq(g(QD)), 'the change in the gap', String(QD[4] + g(QD)[3] + g(g(QD))[0])],
      [seq(E2.slice(0, 5)), seq(g(E2.slice(0, 5))), 'the ratio of the gaps (this lesson)', String(E2[5])],
      [seq(GE), seq(g(GE)), 'the ratio of the terms', String(GE[4] * GEr)],
      [seq(AF), seq(g(AF)), 'r × previous + c (the same idea seen from the terms)', String(AFk * AF[4] + AFc)],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a gap ratio of 1 is a constant gap; a negative ratio zigzags; a pure geometric sequence also has geometric gaps, but there the terms share the ratio too, so divide the terms first and stop if it works.' },
    { type: 'variation', base: `${seq(E25)}, ?  Gaps ${seq(g(E25))} double; next ${E2[4]} + ${g(E2)[4]} = ${E2[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E25.slice(1))}, ?`, effect: `Still ${E2[5]}. The gaps ${seq(g(E25.slice(1)))} still double; two gap ratios are thinner evidence, but the rule is the same.` },
      { change: `Start at ${E2up[0]} instead of ${E2[0]}, same gaps: ${seq(E2up.slice(0, 5))}, ?`, effect: `${E2up[5]}. The start shifts every term; the gap row, and the next gap ${g(E2up)[4]}, do not move.` },
      { change: `Gaps triple instead of double: ${seq(E2tri.slice(0, 5))}, ?`, effect: `${E2tri[5]}. Same moves with r = 3: next gap ${g(E2tri)[3]} × 3 = ${g(E2tri)[4]}.` },
      { change: `Gap ratio −2: ${seq(E2neg.slice(0, 5))}, ?`, effect: `${E2neg[5]}. The gaps ${seq(g(E2neg.slice(0, 5)))} flip sign, so the terms zigzag; divide with signs and the ratio is still constant.` },
      { fusion: true, change: `Start at ${E2both[0]} and gaps triple: ${seq(E2both.slice(0, 5))}, ?`, effect: `${E2both[5]}. The two changes act on different rows: the start moves the terms, the ratio rules the gaps (next gap ${g(E2both)[4]}).` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const xs = t === 0 ? quad(rng.int(1, 20), rng.int(1, 5), rng.int(1, 3), 5) : t === 1 ? d2(rng, 5).xs : geo(rng.int(2, 5), rng.pick([2, 3]), 5); const names = ['gaps grow by a fixed amount', 'gaps multiply, terms do not', 'terms multiply']; const trp = [[null, 'the second row is constant, so the gaps add a fixed amount', 'the terms do not share a ratio'], ['the second row is not constant; it doubles', null, `the terms' ratios ${ratios(xs).slice(0, 2).join(', ')} differ`], ['the gaps grow by a factor', 'the terms themselves share one ratio, so divide the terms', null]]; return pick(rng, `${seq(xs)}: which description fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps ${seq(g(xs))}; second row ${seq(g(g(xs)))}.`); } },
      { make: (rng) => { const xs = dg(rng.int(0, 30), rng.int(1, 4), -2, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Gaps ${seq(g(xs).slice(0, 5))} flip sign and double: next gap ${neg(g(xs)[5])}, so ${neg(xs[5])} ${sgn(g(xs)[5])} = ${neg(xs[6])}.`, ['The gaps alternate in sign.', 'Next gap = last gap × (−2).']); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a geometric run of additions is compound growth on top of a base. In probability, 1/2 + 1/4 + 1/8 + … is a geometric run of gaps whose total climbs towards 1. You see the same picture in "keep flipping until" questions.' },
    { type: 'transfer',
      near: { make: (rng) => { const g0 = rng.pick(HALVES), xs = dg(rng.int(1, 20), g0, 0.5, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Gaps ${seq(g(xs).slice(0, 4))} halve each time (ratio 1/2), so the next gap is ${g(xs)[4]}: ${xs[4]} + ${g(xs)[4]} = ${xs[5]}.`, ['The gaps shrink: by a fixed amount or by a fixed factor?', 'Divide neighbouring gaps.']); } },
      far: { make: (rng) => { const n = rng.int(4, 6); return { type: 'number', q: `A fair coin is flipped until the first head. The first head comes on flip 1 with chance 1/2, on flip 2 with chance 1/4, on flip 3 with chance 1/8, and so on. What is the chance that it comes within the first ${n} flips? (A fraction or a decimal to three places.)`, answer: 1 - 1 / 2 ** n, tolerance: 0.001, hints: ['Keep a running total: 1/2, then 1/2 + 1/4, then + 1/8.', 'Each step adds half of the step before; the total climbs towards 1.'], explain: `The running totals ${Array.from({ length: n }, (_, i) => `${2 ** (i + 1) - 1}/${2 ** (i + 1)}`).join(', ')} add gaps that halve: within ${n} flips, ${2 ** n - 1}/${2 ** n}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the coin?', options: [
        'the steps form a geometric run: next step = last step × r',
        'the totals themselves multiply by one fixed factor',
        'the steps change by the same fixed amount each time',
        'the steps are equal, so the totals grow in a line',
      ], answer: 0, traps: { 1: 'the totals 1/2, 3/4, 7/8 do not share a ratio; the steps 1/2, 1/4, 1/8 do', 2: 'the steps halve each time; they do not drop by a fixed amount', 3: 'each step is half the one before, so the totals slow down near 1' }, explain: 'The coin totals are a start plus a geometric run of steps, exactly a sequence whose gaps multiply: next total = last total + last step × 1/2.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'diff-geometric', section: 'nl', count: 3 },
  ],
};
