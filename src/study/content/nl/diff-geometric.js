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
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by comparing each term with ${CHr} × the term before.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} triple, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. Or: every term is ${CHr} × the previous ${CHc < 0 ? 'minus' : 'plus'} ${Math.abs(CHc)} (${CHr} × ${CH[4]} ${sgn(CHc)} = ${CH[5]}). The two readings are the same rule, and this lesson shows why.` },
    { type: 'text', text: `The **gaps** change by a constant **factor**: ${seq(geo(1, 2, 4))}, or ${seq(geo(2, 3, 4))}, or ${seq(geo(3, -2, 4))}. The terms themselves are not geometric: they are a starting value plus a geometric run of gaps. When the factor is negative, the gaps alternate in sign and the terms zigzag with growing swings.` },
    { type: 'list', items: [`What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`, `What number comes next?  ${seq(ZZ.slice(0, 6))}, ?`] },
    { type: 'text', text: `Not this lesson: gaps that grow by a fixed amount (${seq(QD)} has gaps ${seq(g(QD))}, the second-difference lesson), or terms that are themselves geometric (${seq(GE)}, where the terms, not just the gaps, keep one ratio).` },
    { type: 'check', scope: 'the cue: gaps with a constant factor', questions: [
      { make: (rng) => { const p = d2(rng, 5), q = quad(rng.int(1, 20), rng.int(1, 5), rng.int(1, 3), 5), ge = geo(rng.int(2, 5), 3, 5); return pick(rng, 'In which sequence do the gaps (not the terms) multiply by a constant?', seq(p.xs), [[seq(q), `its gaps ${seq(g(q))} grow by a fixed amount`], [seq(ge), 'there the terms themselves multiply: divide the terms, not the gaps']], `The gaps of ${seq(p.xs)} are ${seq(g(p.xs))}: each is twice the one before.`); } },
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
      { say: 'Take the gaps of the gaps. Not constant either, and they look like a scaled copy of the gaps. Stop subtracting.', why: 'If each gap is r × the previous, the second row is (r − 1) × the gaps: another geometric run. More subtraction layers never settle.',
        checks: [
          { make: (rng) => { const p = d2(rng, 5), g2 = g(g(p.xs)); return pick(rng, `${seq(p.xs)} has gaps ${seq(g(p.xs))} and second row ${seq(g2)}. What next?`, 'divide neighbouring gaps', [['take a third row of differences', `the third row ${seq(g(g2))} copies again; subtraction never settles under a ratio`], ['divide neighbouring terms', `the terms are not geometric: ${ratios(p.xs).slice(0, 2).join(', ')} differ`]], 'The second row copies the gap row: the gaps multiply.'); } },
        ] },
      { say: 'Divide neighbouring gaps. If every ratio is r, the gap row is geometric.', why: 'This is the constant-ratio test applied one layer down, exactly as the second-difference lesson applied the constant-gap test one layer down.',
        checks: [
          { make: (rng) => { const p = d3(rng, 6); return num(`${seq(p.xs)}: the gaps are ${seq(g(p.xs))}. What is their ratio?`, p.r, `${neg(g(p.xs)[2])} ÷ ${neg(g(p.xs)[1])} = ${neg(p.r)}.`); } },
        ] },
      { say: 'Continue the gap row: next gap = last gap × r.', why: 'The gap row follows its own rule, independent of the terms.',
        checks: [
          { make: (rng) => { const p = anyP(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? What is the next gap?`, g(p.xs)[4], `Gap ratio ${neg(p.r)}: ${neg(g(p.xs)[3])} × ${times(p.r)} = ${neg(g(p.xs)[4])}.`, ['Find the gaps and their ratio.', 'Multiply the last gap by the ratio.']); } },
        ] },
      { say: 'Climb up: next term = last term + next gap.', why: 'Every term is the previous term plus its gap; the ratio acts on gaps, never directly on terms.',
        checks: [
          { make: (rng) => { const p = anyP(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Next gap ${neg(g(p.xs)[4])}; ${neg(p.xs[4])} ${sgn(g(p.xs)[4])} = ${neg(p.xs[5])}.`, ['Gaps, then the ratio of the gaps.', 'Next gap first, then add it to the last term.']); } },
        ] },
    ] },
    { type: 'text', text: `The same sequence has a second description. If every gap is r times the one before, then every term is r × the previous term plus a fixed c, with c = term 2 − r × term 1. In the challenge: c = ${CH[1]} − ${CHr} × ${CH[0]} = ${CHc}, and ${CHr} × ${CH[4]} ${sgn(CHc)} = ${CH[5]}. Use whichever you see first; they always agree.` },
    { type: 'explain', prompt: 'Why does the second row never settle when the gaps multiply, and why do you divide the gaps rather than the terms?', model: 'If each gap is r times the last, the difference between neighbouring gaps is (r − 1) times a gap, which still multiplies, so every further row is another geometric run. The terms are a start plus a geometric run of gaps, so only the gaps share one ratio; dividing the terms gives drifting ratios.', points: ['Second row = (r − 1) × the gaps, still geometric', 'The constant ratio lives in the gap row', 'Terms = start + geometric gaps, so their own ratios drift'] },

    S('worked'),
    { type: 'worked', family: 'diff-geometric', section: 'nl', difficulty: 2, seed: 'a', intro: 'Gaps that double. Divide the gaps before opening the solution.' },
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
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a geometric run of additions is compound growth on top of a base. In probability, 1/2 + 1/4 + 1/8 + … is a geometric run of gaps whose running total climbs towards 1, the same picture you see in "keep flipping until" questions.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const xs = t === 0 ? quad(rng.int(1, 20), rng.int(1, 5), rng.int(1, 3), 5) : t === 1 ? d2(rng, 5).xs : geo(rng.int(2, 5), rng.pick([2, 3]), 5); const names = ['gaps grow by a fixed amount', 'gaps multiply, terms do not', 'terms multiply']; const trp = [[null, 'the second row is constant, so the gaps add a fixed amount', 'the terms do not share a ratio'], ['the second row is not constant; it doubles', null, `the terms' ratios ${ratios(xs).slice(0, 2).join(', ')} differ`], ['the gaps grow by a factor', 'the terms themselves share one ratio, so divide the terms', null]]; return pick(rng, `${seq(xs)}: which description fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps ${seq(g(xs))}; second row ${seq(g(g(xs)))}.`); } },
      { make: (rng) => { const xs = dg(rng.int(0, 30), rng.int(1, 4), -2, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Gaps ${seq(g(xs).slice(0, 5))} flip sign and double: next gap ${neg(g(xs)[5])}, so ${neg(xs[5])} ${sgn(g(xs)[5])} = ${neg(xs[6])}.`, ['The gaps alternate in sign.', 'Next gap = last gap × (−2).']); } },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'diff-geometric', section: 'nl', count: 3 },
  ],
};
