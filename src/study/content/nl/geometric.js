// NumberLogic family lesson: constant ratio. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, ratios, nextQ, pick, num, arith, geo, affine } from './method-ladder.js';

const CH = geo(5, -2, 6);
const G = geo(3, 2, 6);
const A6 = arith(3, 6, 6);
const HALF = Array.from({ length: 6 }, (_, i) => 448 / 2 ** i);
const TRI = geo(2, -3, 6);
const PRED = geo(3, -3, 6);
const AFF = affine(2, 2, 1, 5);
const FACT = [1, 2, 6, 24, 120];
const P2 = geo(2, 2, 10), P3 = geo(3, 3, 6);
const HOP = arith(4, 3, 5);
const TA = geo(3, -2, 6), TAs = TA.slice(0, 5).map(Math.abs);
const G5 = G.slice(0, 5), FLIP = geo(3, -2, 6), BIG = geo(15, -2, 6), SH = G.map((v) => v + 10);
const pow = (b, n) => b ** n;

// Question pools: ratio r and a start that keeps every term an integer.
function ratioSeq(rng, n, { neg: allowNeg = true, half = true } = {}) {
  const kind = rng.int(0, allowNeg && half ? 3 : allowNeg ? 2 : 1);
  if (kind === 0) return { r: 2, xs: geo(rng.int(2, 9), 2, n) };
  if (kind === 1) return { r: 3, xs: geo(rng.int(1, 7), 3, n) };
  if (kind === 2) { const r = rng.pick([-2, -3]); return { r, xs: geo(rng.int(1, 6) * rng.pick([1, -1]), r, n) }; }
  const a = rng.pick([1, 3, 5, 7]) * 2 ** (n - 1);
  return { r: 0.5, xs: Array.from({ length: n }, (_, i) => a / 2 ** i) };
}
const rText = (r) => (r === 0.5 ? '1/2' : neg(r));

export default {
  id: 'nl/geometric',
  book: 'nl',
  kind: 'family',
  family: 'geometric',
  title: 'Constant ratio: multiply by the same number',
  summary: 'When the gaps grow with the terms, divide neighbours; a constant ratio r means next = last × r.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic'],
  objectives: [
    'Tell multiplication from addition by looking at the gap row',
    'Find r by dividing neighbours, including negative ratios and ratios below 1',
    'Find the next term, or a missing middle term, with last × r',
    'Avoid the add-instead-of-multiply and dropped-sign traps',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by dividing neighbours.`, answer: neg(CH[5]), explain: `The gaps ${seq(diffs(CH.slice(0, 5)))} swing wildly and never settle. Dividing works: every ratio is ${neg(CH[1] / CH[0])}, so ${CH[4]} × (${neg(CH[1] / CH[0])}) = ${neg(CH[5])}. If you answered ${-CH[5]}, you found the size but dropped the sign flip.`,
      attempts: [
        { id: 'gaps', label: 'Chase the gaps', approach: `Wrote the gaps ${seq(diffs(CH.slice(0, 5)))} and looked for a pattern in them.`, breaksAt: 'Under multiplication every gap is a fixed multiple of its term, so no layer of subtraction ever settles.' },
        { id: 'add', label: 'Add the ratio', approach: `Found the ratio ${neg(CH[1] / CH[0])} and added it: ${CH[4]} + (${neg(CH[1] / CH[0])}) = ${CH[4] + CH[1] / CH[0]}.`, breaksAt: 'A ratio is a factor, not a step: a constant ratio means multiply by it every time.' },
        { id: 'sign', label: 'Drop the sign flip', approach: `Saw the sizes double and answered ${-CH[5]}.`, breaksAt: `The ratio is ${neg(CH[1] / CH[0])}, not ${-CH[1] / CH[0]}: after the positive ${CH[4]} the next term must be negative.` },
      ] },
    { type: 'text', text: 'The terms change by the same **factor** each step: doubling, tripling, halving, or doubling while the sign flips. The gaps are not constant; they grow (or shrink) in proportion to the terms themselves.' },
    { type: 'list', items: [`What number comes next?  ${seq(G.slice(0, 5))}, ?`, `What number comes next?  ${seq(HALF.slice(0, 5))}, ?`, `What number comes next?  ${seq(TRI.slice(0, 5))}, ?`] },
    { type: 'check', scope: 'the cue: a constant factor', questions: [
      { make: (rng) => { const g = geo(rng.int(2, 6), rng.pick([2, 3]), 5), a = arith(rng.int(2, 9), rng.int(3, 9), 5), f = affine(rng.int(2, 6), 2, rng.int(1, 3), 5); return pick(rng, 'Which sequence belongs to this lesson?', seq(g), [[seq(a), `constant gap ${a[1] - a[0]}: that is addition`], [seq(f), 'its ratios are near 2 but not equal: double plus a constant']], `Every ratio of ${seq(g)} is ${g[1] / g[0]}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: ratios that are close to a whole number but never exact (${seq(AFF)} is "double, then add 1"), or ratios that count up (${seq(FACT)}). Those have their own lessons, and dividing neighbours is how you tell them apart.` },
    { type: 'check', scope: 'near-ratios and counting ratios', questions: [
      { type: 'choice', q: '2, 5, 11, 23, 47: divide neighbours. What do you see?', options: ['ratios near 2, never exact', 'an exact ratio of 2', 'ratios that count up'], answer: 0, traps: { 1: '5/2 = 2.5 and 11/5 = 2.2: not exactly 2', 2: 'the ratios settle toward 2; they do not count up' }, explain: 'Double, then add 1: the ratios drift toward 2. That is a different lesson.' },
    ] },
    { type: 'text', text: 'The wrong options come from real slips: adding r instead of multiplying by it, dropping the sign of a negative ratio, repeating the last gap, and multiplying one step too far. One test kills all of them: divide your answer by the last term. You must get r.' },
    { type: 'check', scope: 'the one test that kills wrong options', questions: [
      { make: (rng) => { const r = rng.pick([2, 3]), xs = geo(rng.int(2, 7), r, 6); return num(`${seq(xs.slice(0, 5))}, ? You think the answer is ${xs[5]}. Divide it by the last term: what must you get if you are right?`, r, `${xs[5]} ÷ ${xs[4]} = ${r}, the ratio every step shows.`, ['What does every step do to the previous term?', 'The answer ÷ last term must equal the ratio.']); } },
    ] },

    S('why'),
    { type: 'text', text: 'Doubling, tripling and halving appear from the first questions on, and their gaps look irregular to anyone who only subtracts. Recognising a ratio in a few seconds stops you chasing gaps. It is also the base of the harder rules later in the test: "multiply, then add", "multiply by 2, 3, 4" and gaps that multiply all start with one division.' },

    S('anchor'),
    { type: 'text', text: 'A constant-gap sequence **adds** the same d each step. A constant-ratio sequence is the same idea with **one change**: it **multiplies** by the same r each step. Subtraction exposes an added step; division exposes a multiplied one.' },
    { type: 'check', scope: 'repeated multiplication', questions: [
      { make: (rng) => { const a = rng.int(2, 9), r = rng.pick([2, 3]); return num(`Start at ${a} and multiply by ${r} three times. Where do you end up?`, a * r ** 3, `${a} × ${r} × ${r} × ${r} = ${a * r ** 3}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: `Under multiplication the step is proportional to the current term, so the gap row is a scaled copy of the sequence. Subtract again and you get another copy: no subtraction layer ever settles. Divide instead and the row is flat.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(G.slice(0, 5), 2) }, caption: `Gaps of ${seq(G.slice(0, 5))}: ${seq(diffs(G.slice(0, 5)))}, the sequence again. Their gaps: a copy again. This is the signal to stop subtracting.` },
    { type: 'check', scope: 'a gap row that copies the terms', questions: [
      { type: 'choice', q: 'The gaps of 5, 10, 20, 40, 80 are 5, 10, 20, 40. What does that tell you?', options: ['stop subtracting: the gaps copy the terms', 'subtract once more: it will settle', 'the gaps are constant after all'], answer: 0, traps: { 1: 'every further row is another copy', 2: 'they double' }, explain: 'A gap row that copies the sequence is the sign of multiplication: divide instead.' },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [G, ratios(G)], predicted: true }, caption: `Ratios of the same sequence: ${ratios(G)[0]} every time. The outlined cells are the continuation: ${G[4]} × ${ratios(G)[0]} = ${G[5]}.` },
    { type: 'check', scope: 'the flat ratio row', questions: [
      { make: (rng) => { const { r, xs } = ratioSeq(rng, 5); return num(`Every ratio next ÷ previous of ${seq(xs)} is the same. What is it? (Give 1/2 as 0.5.)`, r, `${neg(xs[1])} ÷ ${neg(xs[0])} = ${rText(r)}, and the same for every pair.`, ['Divide each term by the one before it.', 'Keep the sign: negative ÷ positive is negative.']); } },
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 6, label: 'position n' }, y: { min: 0, max: 100, label: 'term' }, curves: [{ label: `add ${A6[1] - A6[0]}`, points: A6.map((v, i) => [i + 1, v]) }, { label: `multiply by ${G[1] / G[0]}`, points: G.map((v, i) => [i + 1, v]) }] }, caption: `Same start ${G[0]}. Adding ${A6[1] - A6[0]} is a straight line; multiplying by ${G[1] / G[0]} bends upward and overtakes it by term ${A6.findIndex((v, i) => G[i] > v) + 1}. A curve that bends is the picture of a ratio.` },

    { type: 'check', scope: 'straight line against curve', questions: [
      { make: (rng) => { const a = arith(rng.int(2, 9), rng.int(3, 8), 5), d = arith(rng.int(60, 90), -rng.int(4, 9), 5), gg = geo(rng.int(1, 4), rng.pick([2, 3]), 5); return pick(rng, 'Plotted against position, which sequence bends upward instead of lying on a straight line?', seq(gg), [[seq(a), `constant gap ${a[1] - a[0]}: a straight line climbing`], [seq(d), `constant gap ${neg(d[1] - d[0])}: a straight line falling`]], `${seq(gg)} multiplies by ${gg[1] / gg[0]}: its steps grow, so the line bends.`); } },
    ] },
    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'gaps', say: 'Take the gaps first; it is the cheapest test. If they grow and look like a scaled copy of the terms, stop subtracting.', why: 'Under "multiply by r", next − last = (r − 1) × last, so every gap is a fixed multiple of its term. The gaps grow with the terms and no subtraction layer ever becomes constant.',
        checks: [
          { make: (rng) => { const g = geo(rng.int(2, 7), rng.pick([2, 3]), 5), gp = diffs(g); return pick(rng, `The gaps of ${seq(g)} are ${seq(gp)}. What do you test next?`, 'the ratios', [['the gaps of the gaps', `they are ${seq(diffs(gp))}: a copy again, never constant`], [`add the last gap again: ${g[4] + gp[3]}`, 'the gaps are growing, so the last gap does not repeat']], 'Gaps that copy the sequence mean multiplication: divide neighbours.'); } },
        ] },
      { answers: 'add', say: 'Divide each term by the one before: term 2 ÷ term 1, term 3 ÷ term 2, and so on. If every ratio equals r, the rule is "multiply by r".', why: 'Division strips out the size and leaves the factor. A ratio between 0 and 1 means shrinking; a negative ratio means the sign flips every step.',
        checks: [
          { make: (rng) => { const { r, xs } = ratioSeq(rng, 5); return num(`What is the constant ratio of ${seq(xs)}? (Give 1/2 as 0.5.)`, r, `${neg(xs[2])} ÷ ${neg(xs[1])} = ${rText(r)}.`, ['Divide a term by the one before it.', 'Check the sign: do the terms alternate?']); } },
        ] },
      { answers: 'sign', say: 'Next term = last × r. With a negative r the sign flips once more.', why: 'The rule that produced every shown step produces the next one. Multiplying by a negative ratio always changes the sign.',
        checks: [
          { make: (rng) => { const { r, xs } = ratioSeq(rng, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Ratio ${rText(r)}: ${neg(xs[4])} × ${r < 0 ? `(${neg(r)})` : rText(r)} = ${neg(xs[5])}.`, ['Divide neighbours to find r.', `Multiply ${neg(xs[4])} by r, keeping the sign.`]); } },
        ] },
      { say: 'A blank in the middle: find r from two untouched neighbours, then blank = left neighbour × r, and check that blank × r gives the right neighbour.', why: 'The pairs away from the blank still show r; the right-hand check catches a wrong r.',
        checks: [
          { make: (rng) => { const { r, xs } = ratioSeq(rng, 5, { half: false }), k = rng.int(2, 3); return num(`Which number replaces the question mark?  ${xs.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, xs[k], `Ratio ${neg(r)} from the untouched pairs: ${neg(xs[k - 1])} × ${r < 0 ? `(${neg(r)})` : r} = ${neg(xs[k])}, and ${neg(xs[k])} × ${r < 0 ? `(${neg(r)})` : r} = ${neg(xs[k + 1])} checks.`, ['Find r from two neighbours that do not touch the blank.', `Multiply ${neg(xs[k - 1])} by r.`]); } },
        ] },
    ] },
    { type: 'text', text: `A consequence worth knowing: around a blank, blank × blank = left × right, because left × right = left × (left × r × r). So the blank is the **geometric mean** of its neighbours, the multiplication version of the average you used for constant gaps. For ${seq(G.slice(1, 4))} that is ${G[1]} × ${G[3]} = ${G[1] * G[3]} = ${G[2]} × ${G[2]}. The sign still comes from the alternation.` },
    { type: 'check', scope: 'the geometric mean', questions: [
      { type: 'number', q: 'Which number replaces the question mark?  4, ?, 36  (the same positive ratio both steps)', answer: 12, explain: '4 × 36 = 144 = 12 × 12, so the blank is 12.' },
    ] },
    { type: 'explain', prompt: 'Why does subtracting never settle for a doubling sequence, and what does a negative ratio do to the terms?', model: 'Doubling adds a step equal to the current term, so the gaps are the sequence again and so are their gaps; only division removes the size. A negative ratio multiplies the size by |r| and flips the sign every step, so the terms alternate.', points: ['Under ×r each gap is (r − 1) × the term, so gaps grow with the terms', 'Division isolates the factor r', 'Negative r: size × |r|, sign flips each step'] },

    S('worked'),
    { type: 'worked', family: 'geometric', section: 'nl', difficulty: 1, seed: 'a', explainAt: [0], intro: 'A doubling or tripling item. Divide two neighbours before opening the solution.' },
    { type: 'worked', family: 'geometric', section: 'nl', difficulty: 2, seed: 'b', fade: 1, intro: 'A harder ratio (large, negative or a half). The gaps and ratios are given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `Before computing: ${seq(PRED.slice(0, 5))}, ? What sign will the next term have, and roughly how big is it?`, answer: `Negative, ${neg(PRED[5])}: the ratio is ${neg(PRED[1] / PRED[0])}, so the sign flips and the size triples.`, explain: 'Sign and size are two separate checks: alternation gives the sign, the factor gives the size.' },

    S('traps'),
    { type: 'traps', family: 'geometric', section: 'nl', extra: [
      { belief: 'Growing gaps mean the second differences are constant.', fix: `Check how the gaps grow: ${seq(diffs(G.slice(0, 5)))} double, they do not grow by a fixed amount. Doubling gaps mean a ratio.` },
      { belief: 'Alternating signs break the pattern.', fix: `Divide with signs: every ratio of ${seq(TRI.slice(0, 4))} is ${neg(TRI[1] / TRI[0])}. The sign flip is part of the rule.` },
      { belief: 'Shrinking terms mean subtraction.', fix: `${seq(HALF.slice(0, 4))} halves: ratio 1/2. Shrinking by a constant factor is still multiplication.` },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(TRI.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Ratios: ${neg(TRI[1])} ÷ ${TRI[0]} = ${neg(TRI[1] / TRI[0])}, ${TRI[2]} ÷ (${neg(TRI[1])}) = ${neg(TRI[2] / TRI[1])}, and so on.`,
      `Every ratio is ${neg(TRI[1] / TRI[0])}.`,
      `Next term = ${TRI[4]} × ${-TRI[1] / TRI[0]} = ${TRI[4] * (-TRI[1] / TRI[0])}.`,
      `Answer: ${TRI[4] * (-TRI[1] / TRI[0])}.`,
    ], errorStep: 2, explain: `The ratio is ${neg(TRI[1] / TRI[0])}, not ${-TRI[1] / TRI[0]}: ${TRI[4]} × (${neg(TRI[1] / TRI[0])}) = ${neg(TRI[5])}. The signs alternate, and the last shown term is positive, so the next must be negative.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const { r, xs } = ratioSeq(rng, 7, { half: false }), last = xs[4], ar = Math.abs(r); const wrong = [[last + r, `added ${neg(r)} instead of multiplying by it`], [last + (last - xs[3]), 'repeated the last gap; the gaps grow with the terms'], [xs[6], 'multiplied twice: that is the term after the next one']]; wrong.unshift(r < 0 ? [last * ar, 'dropped the sign flip of a negative ratio'] : [last * (r + 1), `misread the ratio as ${r + 1}`]); return pick(rng, nextQ(xs.slice(0, 5)), xs[5], wrong, `Ratio ${neg(r)}: ${neg(last)} × ${r < 0 ? `(${neg(r)})` : r} = ${neg(xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Sign first, size second. Alternating signs mean a negative ratio; then look only at sizes. Know the powers by sight: ${seq(P2)} and ${seq(P3)}. A term you recognise tells you the ratio at once.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Signs alternate and the sizes ${seq(TAs)} double. Gaps would zigzag, so divide straight away.` },
      { t: 4, say: `${neg(TA[1])} ÷ ${TA[0]} = ${neg(TA[1] / TA[0])}, ${TA[2]} ÷ (${neg(TA[1])}) = ${neg(TA[2] / TA[1])}. Ratio ${neg(TA[1] / TA[0])} throughout.` },
      { t: 8, say: `Next: ${TA[4]} × 2 = ${2 * TA[4]}.`, slip: true },
      { t: 10, say: `Sign check fails: the signs alternate and ${TA[4]} is positive, so the next is negative. I dropped the minus: ${TA[4]} × (${neg(TA[1] / TA[0])}) = ${neg(TA[5])}.` },
      { t: 14, say: `Divide back: ${neg(TA[5])} ÷ ${TA[4]} = ${neg(TA[1] / TA[0])}. Answer ${neg(TA[5])}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: sign first, size second', questions: [
      { make: (rng) => { const r = rng.pick([-2, -3]), xs = geo(rng.int(1, 6) * rng.pick([1, -1]), r, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Signs alternate, so r is negative: r = ${neg(r)}. ${neg(xs[4])} × (${neg(r)}) = ${neg(xs[5])}, the opposite sign to ${neg(xs[4])}.`, ['Decide the sign first: do the signs alternate?', `Then the size: multiply ${Math.abs(xs[4])} by ${-r}.`]); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Jump ahead: **term n = first × r^{n − 1}**. Doubling ten times multiplies by ${2 ** 10}, so a sequence cannot double for long before the numbers get huge; test writers stop early.` },
    { type: 'check', scope: 'term n = first × r^(n − 1)', questions: [
      { make: (rng) => { const a = rng.int(1, 5), r = rng.pick([2, 3]), n = r === 2 ? rng.int(7, 9) : rng.int(5, 6); return num(`A sequence starts at ${a} and multiplies by ${r} each step. What is term ${n}?`, a * r ** (n - 1), `${a} × ${r}^${n - 1} = ${a} × ${r ** (n - 1)} = ${a * r ** (n - 1)}.`, [`Term ${n} is ${n - 1} multiplications after term 1.`, `${r}^${n - 1} = ${r ** (n - 1)}.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Gaps grow like the terms → divide; constant ratio r → next = last × r (keep the sign).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Ratios', 'Rule'], rows: [
      [seq(HOP), seq(diffs(HOP)), 'shrinking', `add ${HOP[1] - HOP[0]}`],
      [seq(G.slice(0, 5)), seq(diffs(G.slice(0, 5))), ratios(G.slice(0, 5)).join(', '), `multiply by ${G[1] / G[0]}`],
      [seq(AFF), seq(diffs(AFF)), 'near 2, never exact', `double, then add ${AFF[1] - 2 * AFF[0]}`],
      [seq(FACT), seq(diffs(FACT)), ratios(FACT).join(', '), 'multiply by 2, 3, 4, …'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: r = 1 is a constant sequence; r between 0 and 1 shrinks the terms towards zero; a negative r alternates the signs; a zero anywhere makes division impossible, so a sequence with a 0 in it is not geometric.' },
    { type: 'variation', base: `${seq(G5)}, ?  Ratio ${G[1] / G[0]}, next ${G[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(G5.slice(1))}, ?`, effect: `Still ${G[5]}. Three ratios still read ${G[1] / G[0]} and the last term has not moved.` },
      { change: `Multiply every term by 5: ${seq(G5.map((v) => 5 * v))}, ?`, effect: `${5 * G[5]}. The ratio stays ${G[1] / G[0]}: scaling every term cancels in each division (unlike a gap, which would scale too).` },
      { change: `Add 10 to every term: ${seq(SH.slice(0, 5))}, ?`, effect: `${SH[5]}. The ratios are no longer equal, but the gaps ${seq(diffs(SH.slice(0, 5)))} still double: it becomes a "gaps multiply" item.` },
      { change: `Flip the sign every step: ${seq(FLIP.slice(0, 5))}, ?`, effect: `${neg(FLIP[5])}. The ratio becomes ${neg(FLIP[1] / FLIP[0])}: same size, and the sign now alternates.` },
      { fusion: true, change: `Multiply by 5 and flip the sign every step: ${seq(BIG.slice(0, 5))}, ?`, effect: `${neg(BIG[5])}. The 5 cancels in every ratio, the flip makes it ${neg(BIG[1] / BIG[0])}, so next = ${BIG[4]} × (${neg(BIG[1] / BIG[0])}).` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const xs = t === 0 ? arith(rng.int(2, 9), rng.int(3, 8), 5) : t === 1 ? geo(rng.int(2, 6), rng.pick([2, 3]), 5) : affine(rng.int(2, 6), 2, rng.int(1, 3), 5); const names = ['add a constant', 'multiply by a constant', 'double, then add a constant']; const traps = [[null, 'the ratios shrink; the gaps are what stay equal', 'there is no multiplication: the gaps are equal'], ['the gaps grow, so this is not addition', null, 'the leftover after doubling is 0 every time: pure multiplication'], ['the gaps grow, so this is not addition', 'the ratios are close to 2 but not equal', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, traps[t][i]]).filter((_, i) => i !== t), `Gaps ${seq(diffs(xs))}; ratios ${ratios(xs).join(', ')}.`); } },
      { make: (rng) => { const a = rng.pick([3, 5, 7, 9, 11]) * 32, xs = Array.from({ length: 6 }, (_, i) => a / 2 ** i); return num(nextQ(xs.slice(0, 5)), xs[5], `Ratio 1/2: ${xs[4]} ÷ 2 = ${xs[5]}.`, ['The terms shrink by the same factor.', 'Halve the last term.']); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: anything that shrinks or grows by a fixed factor per round is geometric. In Beat the Odds, "no six in n throws" is (5/6)^{n}: each extra throw multiplies the probability by the same 5/6.' },
    { type: 'transfer',
      near: { make: (rng) => { const up = rng.chance(0.5), m = rng.int(1, 3), xs = up ? geo(32 * m, 1.5, 6) : geo(243 * m, 2 / 3, 6).map(Math.round); return num(nextQ(xs.slice(0, 5)), xs[5], `The ratio is ${up ? '3/2' : '2/3'} every time (${xs[1]} ÷ ${xs[0]} = ${up ? '1.5' : '2/3'}), so ${xs[4]} × ${up ? '3/2' : '2/3'} = ${xs[5]}.`, ['The gaps grow (or shrink) with the terms: divide neighbours.', `The ratio is not a whole number: ${xs[1]} ÷ ${xs[0]} as a fraction.`]); } },
      far: { make: (rng) => { const n = rng.int(2, 4); return { type: 'number', q: `A fair die is thrown ${n} times. What is the probability that no six appears? (A fraction or a decimal to three places.)`, answer: pow(5, n) / pow(6, n), tolerance: 0.001, hints: ['Each throw keeps "no six so far" alive with the same chance.', `Multiply by 5/6 once per throw: (5/6)^{${n}}.`], explain: `Each throw multiplies the chance by 5/6: (5/6)^{${n}} = ${pow(5, n)}/${pow(6, n)}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequence to the dice?', options: [
        'each step multiplies by the same factor, so n steps give factor^{n}',
        'each step adds the same amount, so n steps give n × the amount',
        'the gaps between the values grow by a fixed amount each step',
        'each step multiplies by a factor that counts up: 2, 3, 4, …',
      ], answer: 0, traps: { 1: 'adding 5/6 per throw would pass 1 after two throws: chances of "every throw" multiply', 2: 'that is the second-difference rule; here each value is a fixed multiple of the one before', 3: 'the factor is 5/6 on every throw; it never changes' }, explain: 'The chance of "no six so far" and a geometric sequence both multiply by one fixed factor per step, so after n steps the start is multiplied by the factor to the power n.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'geometric', section: 'nl', count: 3 },
  ],
};
