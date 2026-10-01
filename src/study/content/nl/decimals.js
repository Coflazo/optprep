// NumberLogic family lesson: decimal sequences (quarter steps and fractional ratios). Every number shown is computed here.
import { S, seq, diffs, ladderRows, nextQ, pick, num, quad, round2 } from './method-ladder.js';

// Level 2: a quadratic in quarters (a/4 + g·i/4 + s·i(i−1)/8). Level 3: a·(rn/rd)^i. Both as in the
// generator. Quarters and the listed ratios are exact in binary, so plain numbers print exactly.
const qu = (xs) => xs.map((v) => v / 4);
const geoD = (a, rn, rd, n) => Array.from({ length: n }, (_, i) => (a * rn ** i) / rd ** i);
const g = (xs) => diffs(xs);
const rat = (xs) => xs.slice(1).map((v, i) => v / xs[i]);
const x4 = (xs) => xs.map((v) => v * 4);

const CHq = quad(6, 1, 1, 6), CH = qu(CHq);
const E1q = quad(5, 2, 2, 7), E1 = qu(E1q);
const E2 = geoD(16, 3, 2, 6), E3 = geoD(7, 1, 2, 6), E4 = geoD(8, 5, 2, 5), E5 = geoD(250, 1, 5, 5);
const ERR = geoD(7, 1, 2, 6);
const TICKS = [2, 3, 4, 5], QUOTES = TICKS.reduce((o, t) => [...o, o[o.length - 1] + t * 0.25], [101.25]);
const PRED = geoD(24, 3, 2, 6);

function quarters(rng, n) { const a = rng.int(1, 12), gg = rng.int(1, 4), s = rng.pick([1, 2]); return { k: 'quad', s: s / 4, q: quad(a, gg, s, n), xs: qu(quad(a, gg, s, n)) }; }
const KINDS = [(rng) => [16 * rng.int(1, 3), 3, 2], (rng) => [rng.pick([3, 5, 7, 9, 11]), 1, 2], (rng) => [8 * rng.int(1, 3), 5, 2], (rng) => [125 * rng.int(1, 4), 1, 5]];
function ratioSeq(rng, n) { const [a, rn, rd] = rng.pick(KINDS)(rng); return { k: 'geo', r: rn / rd, xs: geoD(a, rn, rd, n) }; }
const anyD = (rng, n) => (rng.chance(0.5) ? quarters(rng, n) : ratioSeq(rng, n));
const how = { 1.5: 'add half of it', 0.5: 'halve it', 2.5: 'double it and add half', 0.2: 'divide it by 5' };

export default {
  id: 'nl/decimals',
  book: 'nl',
  kind: 'family',
  family: 'decimals',
  title: 'Decimal sequences',
  summary: 'Decimals change the arithmetic, not the method: gaps first, then ratios; scale to whole numbers when the bookkeeping gets messy, and check the size of the answer.',
  prerequisites: ['nl/method-ladder', 'nl/second-diff', 'nl/geometric'],
  objectives: [
    'Run the gap and ratio tests on decimals without place-value slips',
    'Scale a quarter-step sequence to whole numbers and back',
    'Multiply by 1.5, 0.5, 2.5 and 0.2 in your head',
    'Reject options that are ten times too large or too small in one glance',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'point', label: 'Lose a decimal place', approach: `Halved ${ERR[4]} and wrote ${ERR[5] / 10}.`, breaksAt: 'The digits are right, but the answer is ten times too small.' },
      { id: 'gap-for-ratio', label: 'Add a fixed amount', approach: 'Saw the terms grow and added the last gap again.', breaksAt: 'When the gaps scale with the terms, the rule is a ratio.' },
      { id: 'messy', label: 'Fight the decimals', approach: 'Subtracted decimals directly and lined the places up wrongly.', breaksAt: 'Misaligned places give wrong gaps; counting in quarters avoids them.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the decimal gaps, once after multiplying every term by 4.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} grow by ${g(g(CH))[0]}, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. Times 4 the list is ${seq(CHq.slice(0, 5))}: gaps ${seq(g(CHq.slice(0, 5)))}, next ${CHq[5]}, and ${CHq[5]} ÷ 4 = ${CH[5]}. Same ladder, friendlier numbers.` },
    { type: 'text', text: 'The terms carry decimals, but no new kind of rule comes with them. Underneath there is an ordinary rule: gaps that grow by a constant (usually in quarters or halves), or a constant ratio that is not a whole number, such as 1.5, 0.5, 2.5 or 0.2.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `A ratio like 1.5 can hide for a while: ${seq(E2.slice(0, 5))} are all whole numbers, and the decimal only appears at ${E2[5]}. So treat a sequence with a decimal answer exactly like any other.` },
    { type: 'check', scope: 'the cue: an ordinary rule under the decimals', questions: [
      { make: (rng) => { const p = anyD(rng, 5); const names = ['gaps that grow by a constant', 'a constant ratio']; const t = p.k === 'quad' ? 0 : 1; return pick(rng, `${seq(p.xs)}: which rule is underneath?`, names[t], [[names[1 - t], t === 0 ? `the gaps ${seq(g(p.xs))} grow by ${p.s} each time; the ratios drift` : `every ratio is ${p.r}; the gaps scale with the terms`], ['no rule: decimals are random', 'decimals change the arithmetic, not the rule']], t === 0 ? `Gaps ${seq(g(p.xs))}, growing by ${p.s}.` : `Ratios ${seq(rat(p.xs))}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Decimal items test whether your method survives messier arithmetic. The rules are the easy ones from the first third of the test; what goes wrong is bookkeeping: a misaligned subtraction, a ratio of 1.5 read as "add 1.5", or a decimal point one place off. Test writers put the ten-times-too-big and ten-times-too-small answers among the options on purpose, so a two-second size check is worth a point.' },

    S('anchor'),
    { type: 'text', text: `You already run the ladder on whole numbers. This family changes **one thing**: the unit. ${seq(E1.slice(0, 4))} is ${seq(E1q.slice(0, 4))} counted in **quarters**, the way 1.25 euros is 125 cents. Change the unit, solve, change back.` },
    { type: 'check', scope: 'changing the unit to quarters', questions: [
      { make: (rng) => { const p = quarters(rng, 4); return num(`Count ${seq(p.xs)} in quarters (multiply every term by 4). What does ${p.xs[3]} become?`, p.q[3], `${p.xs[3]} × 4 = ${p.q[3]}. The whole list becomes ${seq(p.q)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'The same ladder twice: once in decimals, once in quarters. The shape is identical; only the labels change. For a fractional ratio, the ratio ladder shows one constant row, exactly as for whole numbers. Nothing about the method changes: the flat row is still the row you copy, and you still climb back up one row at a time.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1.slice(0, 6), 2), predicted: true }, caption: `${seq(E1.slice(0, 5))}: gaps ${seq(g(E1.slice(0, 5)))}, second row ${g(g(E1))[0]} every time. Outlined: next gap ${g(E1)[3]} + ${g(g(E1))[0]} = ${g(E1)[4]}, next term ${E1[4]} + ${g(E1)[4]} = ${E1[5]}.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1q.slice(0, 6), 2), predicted: true }, caption: `Times 4: ${seq(E1q.slice(0, 5))}, second row ${g(g(E1q))[0]}, next ${E1q[5]}. Divide back: ${E1q[5]} ÷ 4 = ${E1[5]}. Whole numbers, no decimal points to line up.` },
    { type: 'check', scope: 'the decimal ladder and its whole-number twin', questions: [
      { make: (rng) => { const p = quarters(rng, 5); return num(`What is the constant second difference of ${seq(p.xs)}?`, p.s, `Gaps ${seq(g(p.xs))}; their gaps are all ${p.s}. In quarters: ${seq(p.q)}, second difference ${p.s * 4}, and ${p.s * 4} ÷ 4 = ${p.s}.`, ['Subtract neighbours, lining up the decimal points.', 'Or multiply everything by 4 first.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [E2.slice(0, 5), rat(E2.slice(0, 5))] }, caption: `${seq(E2.slice(0, 5))}: every ratio is ${rat(E2)[0]}. Next ${E2[4]} × ${rat(E2)[0]} = ${E2[5]}: the first decimal appears only now.` },
    { type: 'check', scope: 'a fractional ratio', questions: [
      { make: (rng) => { const p = ratioSeq(rng, 5); return num(`${seq(p.xs)}: what is the constant ratio?`, p.r, `${p.xs[1]} ÷ ${p.xs[0]} = ${p.r}, and every other pair agrees.`, ['Divide a term by the one before it.']); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Subtract neighbours, lining up the decimal points. Write every gap with the same number of decimal places.', why: 'Misaligned places are the classic slip: 2.25 − 1.5 is 0.75, and writing 1.50 makes it obvious.',
        checks: [
          { make: (rng) => { const p = quarters(rng, 5); return num(`${seq(p.xs)}: what is the last gap?`, g(p.xs)[3], `${p.xs[4]} − ${p.xs[3]} = ${g(p.xs)[3]}. All gaps: ${seq(g(p.xs))}.`, ['Later minus earlier.', 'Line up the decimal points.']); } },
        ] },
      { say: 'Take the gaps again. A constant second row (often 0.25 or 0.5) means next gap = last gap + that constant.', why: 'Exactly the second-difference rule; the numbers are just smaller.',
        checks: [
          { make: (rng) => { const p = quarters(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? What is the next gap?`, g(p.xs)[4], `Gaps ${seq(g(p.xs).slice(0, 4))} grow by ${p.s}: ${g(p.xs)[3]} + ${p.s} = ${g(p.xs)[4]}.`, ['Write the gaps.', 'Last gap + the constant second difference.']); } },
        ] },
      { answers: 'messy', say: 'If the decimals slow you down, scale: multiply every term by 4 (quarters), 2 (halves) or 10 (tenths). Solve the whole-number list, then divide the answer back.', why: 'Multiplying every term by the same number multiplies every row of the ladder by it: the rule is unchanged.',
        checks: [
          { make: (rng) => { const p = quarters(rng, 6); return num(`Times 4, ${seq(p.xs.slice(0, 5))} becomes ${seq(p.q.slice(0, 5))}, whose next term is ${p.q[5]}. What is the next term of the decimal list?`, p.xs[5], `${p.q[5]} ÷ 4 = ${p.xs[5]}.`); } },
          { make: (rng) => { const p = quarters(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Times 4: ${seq(p.q.slice(0, 5))}, gaps ${seq(g(p.q.slice(0, 5)))}, next ${p.q[5]}; back: ${p.xs[5]}.`, ['Multiply every term by 4.', 'Solve, then divide by 4.']); } },
        ] },
      { answers: 'gap-for-ratio', say: 'If the gaps grow with the terms, divide neighbours instead. Common ratios: 1.5, 0.5, 2.5 and 0.2.', why: 'A constant ratio makes the gaps scale with the terms, whatever the decimals look like.',
        checks: [
          { make: (rng) => { const p = ratioSeq(rng, 5); return pick(rng, `The gaps of ${seq(p.xs)} are ${seq(g(p.xs))}. Which test next?`, 'divide neighbouring terms', [['take the gaps of the gaps', `the second row ${seq(g(g(p.xs)))} scales too; subtraction will not settle`], ['multiply every term by 4', 'scaling keeps the rule; it does not find it']], `The gaps scale with the terms: ratio ${p.r}.`); } },
        ] },
      { say: 'Multiply by the ratio using halves: × 1.5 adds half, × 0.5 halves, × 2.5 doubles and adds half, × 0.2 divides by 5.', why: 'Each is a whole-number operation you can do without a calculator, and each keeps the place value visible.',
        checks: [
          { make: (rng) => { const p = ratioSeq(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Ratio ${p.r}: ${how[p.r]} of ${p.xs[4]}, giving ${p.xs[5]}.`, ['Divide neighbours to find the ratio.', `× ${p.r} means: ${how[p.r]}.`]); } },
        ] },
      { answers: 'point', say: 'Check the size before you choose: the answer must sit near last + gap or last × ratio. An option ten times larger or smaller has the right digits and the wrong decimal point.', why: 'The digits alone do not decide a decimal answer; the size does.',
        checks: [
          { make: (rng) => { const p = anyD(rng, 6), a = p.xs[5]; return pick(rng, nextQ(p.xs.slice(0, 5)), a, [[a * 10, 'decimal point slip: right digits, ten times too large'], [a / 10, 'decimal point slip: right digits, ten times too small']], p.k === 'quad' ? `Next gap ${g(p.xs)[4]}: ${p.xs[4]} + ${g(p.xs)[4]} = ${a}.` : `${p.xs[4]} × ${p.r} = ${a}.`); } },
        ] },
    ] },
    { type: 'text', text: `The ratio moves on real items. ${seq(E4.slice(0, 4))} has ratio ${rat(E4)[0]}: double ${E4[3]} to ${2 * E4[3]}, add half, ${E4[3] / 2}, and the next term is ${E4[4]}. ${seq(E5.slice(0, 4))} has ratio ${rat(E5)[0]}: ${E5[3]} ÷ 5 = ${E5[4]}. In both, a rough size (about ${Math.round(E4[3] * 2.5)}, about ${round2(E5[3] / 5)}) comes before any exact digit.` },
    { type: 'explain', prompt: 'Why can you multiply every term by 4, solve, and divide the answer by 4, without changing the rule?', model: 'Scaling every term by 4 scales every gap, every second difference and every ratio row consistently: gaps and second differences are multiplied by 4, ratios are unchanged. So the same row is constant, the ladder climbs the same way, and dividing the new term by 4 undoes the scaling.', points: ['Scaling every term scales every difference row by the same factor', 'Ratios do not change at all', 'Dividing the answer back undoes the unit change'] },

    S('worked'),
    { type: 'worked', family: 'decimals', section: 'nl', difficulty: 2, seed: 'a', explainAt: [1], intro: 'Quarter steps with growing gaps. Scale if it helps, before opening the solution.' },
    { type: 'worked', family: 'decimals', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'A fractional ratio. The ratio is given; the last multiplication is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 4))}, ? Will the next term be a whole number? Predict it before multiplying.`, answer: `No: ${PRED[4]}. The ratio is ${rat(PRED)[0]}, and ${PRED[3]} is odd, so adding half of it leaves .5.`, explain: `${PRED[3]} + ${PRED[3] / 2} = ${PRED[4]}.` },

    S('traps'),
    { type: 'traps', family: 'decimals', section: 'nl', extra: [
      { belief: 'A ratio of 0.5 means subtract 0.5.', fix: 'A ratio multiplies: × 0.5 halves the term.' },
      { belief: 'The digits are right, so the answer is right.', fix: 'Check the size: last × ratio or last + gap. Options ten times off share your digits.' },
      { belief: 'Decimals mean a new kind of rule.', fix: 'Scale to whole numbers: the rule underneath is one you already know.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 5)))}. They halve, so divide neighbours.`,
      `Every ratio is ${rat(ERR)[0]}: each term is half the one before.`,
      `Half of ${ERR[4]} is ${ERR[5] / 10}.`,
      `Answer: ${ERR[5] / 10}.`,
    ], errorStep: 2, explain: `Half of ${ERR[4]} is ${ERR[5]}: one decimal place was lost. Size check: ${ERR[4]} is about ${round2(ERR[4])}, so half of it is about ${round2(ERR[5])}, not ${round2(ERR[5] / 10)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = ratioSeq(rng, 7), l = p.xs[4], a = p.xs[5]; return pick(rng, nextQ(p.xs.slice(0, 5)), a, [[a * 10, 'decimal point slip: ten times too large'], [a / 10, 'decimal point slip: ten times too small'], [l + g(p.xs)[3], 'repeated the last gap; the gaps scale with the terms'], [p.xs[6], 'went one step too far: that is the term after the next one']], `Ratio ${p.r}: ${l} × ${p.r} = ${a}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Scale first when the decimals are quarters or halves: × 4 or × 2 turns the list into whole numbers you can read at a glance. Divide only the final answer back; the rows in between can stay in whole numbers.' },
    { type: 'callout', tone: 'speed', text: 'Estimate before you pick: round the last term, apply the rule roughly, and discard options of the wrong size. Two seconds, and the ten-times traps are gone.' },
    { type: 'thinkaloud', problem: nextQ(E4.slice(0, 4)), lines: [
      { t: 0, say: `Gaps ${seq(g(E4.slice(0, 4)))} grow with the terms: divide instead.` },
      { t: 4, say: `${E4[1]} ÷ ${E4[0]} = ${rat(E4)[0]}, ${E4[2]} ÷ ${E4[1]} = ${rat(E4)[1]}. Ratio ${rat(E4)[0]}.` },
      { t: 9, say: `Times ${rat(E4)[0]} is double and add half: 2 × ${E4[3]} = ${2 * E4[3]}, half of ${E4[3]} is ${E4[3] / 20}, so ${2 * E4[3] + E4[3] / 20}.`, slip: true },
      { t: 14, say: `Size check: ${rat(E4)[0]} × ${E4[3]} is about ${Math.round(E4[4] / 10) * 10}, and ${2 * E4[3] + E4[3] / 20} is too small. Half of ${E4[3]} is ${E4[3] / 2}.` },
      { t: 19, say: `${2 * E4[3]} + ${E4[3] / 2} = ${E4[4]}. ${E4[4] * 10} and ${E4[4] / 10} would be place slips. Answer ${E4[4]}.` },
    ] },
    { type: 'check', scope: 'scaling and size checks', questions: [
      { make: (rng) => { const p = quarters(rng, 6); return num(`Scale ${seq(p.xs.slice(0, 5))} by 4, solve, and scale back. What comes next?`, p.xs[5], `× 4: ${seq(p.q.slice(0, 5))}, next ${p.q[5]}; ÷ 4: ${p.xs[5]}.`, ['Multiply every term by 4.', 'Second differences of the whole numbers, then climb.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Decimals → the same tests (gaps, then ratios); scale to whole numbers if it helps; check the size of the answer.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Rule underneath', 'Next'], rows: [
      [seq(E1.slice(0, 5)), `gaps grow by ${g(g(E1))[0]} (quarters)`, String(E1[5])],
      [seq(E2.slice(0, 5)), `× ${rat(E2)[0]}: add half`, String(E2[5])],
      [seq(E3.slice(0, 5)), `× ${rat(E3)[0]}: halve`, String(E3[5])],
      [seq(E4.slice(0, 4)), `× ${rat(E4)[0]}: double and add half`, String(E4[4])],
      [seq(E5.slice(0, 4)), `× ${rat(E5)[0]}: divide by 5`, String(E5[4])],
    ] },
    { type: 'variation', base: `${seq(E1.slice(0, 5))}, ? (gaps grow by ${g(g(E1))[0]}, next ${E1[5]})`, rows: [
      { change: 'Multiply every term by 4', effect: `${seq(E1q.slice(0, 5))}: whole numbers, second difference ${g(g(E1q))[0]}, next ${E1q[5]}: four times the old answer.` },
      { change: 'Add 0.25 to every term', effect: `The gaps do not change, so the answer rises by 0.25 too: ${E1[5] + 0.25}.` },
      { change: `The gaps grow by ${g(g(E1))[0] / 2} instead (same first two terms)`, effect: `${seq(qu(quad(5, 2, 1, 5)))}: next gap ${g(qu(quad(5, 2, 1, 6)))[4]}, next term ${qu(quad(5, 2, 1, 6))[5]}.` },
      { change: `Write every term with two decimal places (${E1.slice(0, 5).map((v) => v.toFixed(2)).join(', ')})`, same: true, effect: `No change: trailing zeros do not change a number, so the answer is still ${E1[5]}.` },
      { change: 'Multiply every term by 4, then add 1', fusion: true, effect: `Scaling multiplies every row by 4 and the 1 only shifts the terms, so the next term is 4 × ${E1[5]} + 1 = ${4 * E1[5] + 1}.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a ratio below 1 shrinks the terms towards 0 but never reaches it. A ratio of 1.5 keeps a multiple of 16 whole for four steps, so the decimal can arrive only at the answer. And halving an odd number always ends in .5.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: prices quoted in steps of 0.25 or 0.05 are whole numbers of ticks, so order-book arithmetic is easier in ticks. × 1.5 is a 50% rise and × 0.2 an 80% fall: percentage moves are ratios.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const opts = [[1.5, 'add half of it'], [0.5, 'take half of it'], [2.5, 'double it, add half'], [0.2, 'divide it by 5']]; const i = rng.int(0, 3), [r, w] = opts[i]; return pick(rng, `Multiplying by ${r} is the same as:`, w, opts.filter((_, j) => j !== i).map(([rr, ww]) => [ww, `that is × ${rr}`]), `× ${r}: ${w}.`); } },
      { make: (rng) => { const a = rng.pick([3, 5, 7, 9, 11]), xs = geoD(a, 1, 2, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Ratio 0.5: half of ${xs[4]} is ${xs[5]}.`, ['Each term is half the one before.', 'Keep every decimal place when halving.']); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = quarters(rng, 6); return num(`A price moves in quarter steps: ${seq(p.xs.slice(0, 5))}. If the pattern holds, what is the next price?`, p.xs[5], `Times 4: ${seq(p.q.slice(0, 5))}, next ${p.q[5]}; back to euros: ${p.xs[5]}.`, ['Count in quarters.', 'Second differences of the whole numbers, then divide by 4.']); } },
      far: { type: 'number', q: `A bid moves in ticks of 0.25: ${seq(QUOTES.slice(0, 4))}. The moves are ${seq(TICKS.slice(0, 3))} ticks. If the next move is ${TICKS[3]} ticks, what is the next bid?`, answer: QUOTES[4], explain: `In ticks the moves grow by 1; ${TICKS[3]} ticks is ${TICKS[3] * 0.25}, so ${QUOTES[3]} + ${TICKS[3] * 0.25} = ${QUOTES[4]}.`, hints: ['Work in ticks, not euros.', 'Convert the move back: ticks × 0.25.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the decimal lists to the bids?', options: ['Changing the unit does not change the rule', 'Decimal lists need new kinds of rules', 'Round every term before looking for a rule', 'Only the digits after the point matter'], answer: 0, traps: { 1: 'the tick moves follow a plain counting rule', 2: 'rounding destroys the quarter steps that carry the rule', 3: 'the whole number of ticks matters, not just the decimals' }, explain: 'Counting in ticks (quarters) turns the decimal moves into whole numbers with the same rule, exactly like scaling by 4 in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'decimals', section: 'nl', count: 3 },
  ],
};
