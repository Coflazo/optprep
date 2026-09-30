// NumberLogic family lesson: constant second difference. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, arith, geo, quad } from './method-ladder.js';

const CH = quad(7, 1, 2, 6);
const UP = quad(2, 1, 3, 7);
const PEAK = quad(10, 12, -4, 7);
const ERR = quad(5, 3, 3, 6);
const AR = arith(4, 5, 5);
const DG = [3, 4, 6, 10, 18];
const SQ = [1, 4, 9, 16, 25];
const g = (xs) => diffs(xs);

// d1-like and d2-like quadratics for the checks.
const easy = (rng, n) => quad(rng.int(1, 20), rng.int(1, 8), rng.int(1, 3), n);
// Small terms (|x| < 3) invite coincidental ratio patterns, so they are redrawn.
// Draws that invite a second reading are repeated: tiny terms, a repeated value near the turning
// point (6, 3, 6, 15), or a list that also adds its previous three terms (4, 4, 8, 16, 28).
const sum3 = (xs) => xs.slice(3, 5).every((v, i) => v === xs[i] + xs[i + 1] + xs[i + 2]);
const hard = (rng, n) => { let xs; do xs = quad(rng.int(-10, 40), rng.int(-10, 15), nz(rng, -6, 6), n); while (xs.slice(0, 5).some((v, i) => Math.abs(v) < 3 || v === xs[i + 1] || v === xs[i + 2]) || sum3(xs)); return xs; };
const any = (rng, n) => (rng.chance(0.5) ? easy(rng, n) : hard(rng, n));
const sOf = (xs) => diffs(diffs(xs))[0];

export default {
  id: 'nl/second-diff',
  book: 'nl',
  kind: 'family',
  family: 'second-diff',
  title: 'Gaps that change by a constant',
  summary: 'Gaps not constant? Take their gaps; a constant second difference s means next gap = last gap + s.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic'],
  objectives: [
    'Build the two-row ladder for five or six terms in under 20 seconds',
    'Extend a constant second difference and climb back to the next term',
    'Handle a negative second difference, where the terms rise, peak and fall',
    'Fill a missing middle term from the gaps to its left',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by guessing a formula in n.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} rise by ${sOf(CH)} each time, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. A formula exists (${CH[0]} + (n − 1)²) but finding it takes longer than the ladder, which needs no formula at all.` },
    { type: 'text', text: 'The gaps are not constant, but they move **steadily**: each gap is the previous gap plus the same amount s. The gaps can grow, shrink, or cross zero, so the terms can rise, peak and fall.' },
    { type: 'list', items: [`What number comes next?  ${seq(UP.slice(0, 5))}, ?`, `What number comes next?  ${seq(PEAK.slice(0, 6))}, ?`, `Which number replaces the question mark?  ${seq(ERR.slice(0, 3))}, ?, ${ERR[4]}`] },
    { type: 'text', text: `Not this lesson: gaps that multiply (${seq(g(DG))}) or gaps that zigzag. Squares, triangular numbers and "add 1, 2, 3, …" are special cases of this lesson; they have shortcut lessons, but this method always works on them.` },
    { type: 'check', scope: 'the cue: steadily changing gaps', questions: [
      { make: (rng) => { const q = easy(rng, 5), a = arith(rng.int(1, 20), rng.int(2, 9), 5), d = [rng.int(1, 9)]; const g0 = rng.int(1, 3); while (d.length < 5) d.push(d[d.length - 1] + g0 * 2 ** (d.length - 1)); return pick(rng, 'Which sequence belongs to this lesson?', seq(q), [[seq(a), `its gaps ${seq(g(a))} are constant: the previous lesson`], [seq(d), `its gaps ${seq(g(d))} double rather than grow by a fixed amount`]], `The gaps of ${seq(q)} are ${seq(g(q))}: they grow by ${sOf(q)} each time.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'A constant second difference covers every quadratic rule: squares, n(n + 1), triangular numbers, "add 3, then 5, then 7". You do not need to recognise the famous list behind a sequence to solve it: the two-row ladder finds the next term mechanically. It is the fallback that rescues you when recognition fails, and it appears in the first third of the test. Test writers like it because the gaps look almost regular, which tempts a rushed "add the last gap again"; that exact slip is nearly always among the options.' },

    S('anchor'),
    { type: 'text', text: 'Constant gap: the gap row is flat. This family changes **one thing**: the gap row is itself a constant-gap sequence. You already know how to continue a constant-gap sequence, so continue the gap row that way, then add its new entry to the last term.' },
    { type: 'check', scope: 'continuing the gap row', questions: [
      { make: (rng) => { const s = nz(rng, -5, 6), gs = arith(rng.int(-6, 12), s, 5); return num(`The gaps of a sequence are ${seq(gs.slice(0, 4))}. They form a constant-gap sequence. What is the next gap?`, gs[4], `The gaps change by ${sgn(s)} each time: ${neg(gs[3])} ${sgn(s)} = ${neg(gs[4])}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Two rows under the terms: the gaps, and beneath them the gaps of the gaps. The bottom row is flat. Against position, the terms trace a smooth curve: bending up when s is positive, bending down to a peak when s is negative.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(UP.slice(0, 6), 2), predicted: true }, caption: `${seq(UP.slice(0, 5))}: gaps ${seq(g(UP.slice(0, 5)))}, second differences all ${sOf(UP)}. The outlined cells continue it bottom-up: ${sOf(UP)}, then ${g(UP)[3]} + ${sOf(UP)} = ${g(UP)[4]}, then ${UP[4]} + ${g(UP)[4]} = ${UP[5]}.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 7, label: 'position n' }, y: { min: 0, max: 60, label: 'term' }, curves: [{ label: `s = ${sOf(UP)}`, points: UP.map((v, i) => [i + 1, v]) }, { label: `s = ${sOf(PEAK)}`, points: PEAK.map((v, i) => [i + 1, v]) }] }, caption: `Positive s bends upward (${seq(UP)}). Negative s bends down: ${seq(PEAK)} rises while its gaps are positive, peaks when a gap hits 0, then falls.` },
    { type: 'check', scope: 'the two-row picture', questions: [
      { make: (rng) => { const xs = any(rng, 5); return num(`What is the constant second difference of ${seq(xs)}?`, sOf(xs), `Gaps ${seq(g(xs))}; their gaps are all ${neg(sOf(xs))}.`, ['Write the gaps first.', 'Subtract neighbouring gaps, later minus earlier.']); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Write the gaps, later minus earlier. They are not all equal, so the rule is not "add d".', why: 'The first test of the ladder always comes first; it is cheap and it rules out the constant-gap family.',
        checks: [
          { make: (rng) => { const xs = hard(rng, 5); return num(`Write the gaps of ${seq(xs)}. What is the last gap?`, g(xs)[3], `Gaps: ${seq(g(xs))}.`, ['Later term minus earlier term.', `${neg(xs[4])} − ${neg(xs[3])}.`]); } },
        ] },
      { say: 'Write the gaps of the gaps. If they all equal s, the gap row is a constant-gap sequence with step s.', why: 'This is the arithmetic test applied one level down. Three equal entries (from five terms) are enough to trust it.',
        checks: [
          { make: (rng) => { const xs = hard(rng, 6); return num(`${seq(xs)}: what is the second difference?`, sOf(xs), `Gaps ${seq(g(xs))}, second differences ${seq(diffs(g(xs)))}.`, ['Gaps first.', 'Then gaps of the gaps, keeping signs.']); } },
        ] },
      { say: 'Extend the bottom row by copying s, then the gap row: next gap = last gap + s.', why: 'The constant row is the only one you may copy. The gap row then continues exactly like a constant-gap sequence.',
        checks: [
          { make: (rng) => { const xs = any(rng, 6); return num(`${seq(xs.slice(0, 5))}, ? What is the next gap?`, g(xs)[4], `Gaps ${seq(g(xs).slice(0, 4))}, step ${sgn(sOf(xs))}: ${neg(g(xs)[3])} ${sgn(sOf(xs))} = ${neg(g(xs)[4])}.`, ['Find the gaps and their step s.', 'Last gap + s.']); } },
        ] },
      { say: 'Climb up: next term = last term + next gap.', why: 'Each term is the previous term plus the gap between them, so the new gap lands on the last term.',
        checks: [
          { make: (rng) => { const xs = any(rng, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Next gap ${neg(g(xs)[4])}; ${neg(xs[4])} ${sgn(g(xs)[4])} = ${neg(xs[5])}.`, ['Two rows: gaps, then gaps of gaps.', 'Extend the bottom row, then the gap row, then the terms.']); } },
        ] },
      { say: 'A blank in the middle: take s from the gaps left of the blank, extend the gap row up to the blank, then check the terms to its right.', why: 'The gaps that do not touch the blank still show the pattern. The term after the blank is a free check.',
        checks: [
          { make: (rng) => { const xs = easy(rng, 5), k = 3; return num(`Which number replaces the question mark?  ${xs.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, xs[k], `Gaps before the blank ${seq(g(xs).slice(0, 2))} step by ${sOf(xs)}, so the gap into the blank is ${g(xs)[2]}: ${xs[2]} + ${g(xs)[2]} = ${xs[3]}. Check: ${xs[3]} + ${g(xs)[3]} = ${xs[4]}.`, ['Use the two gaps left of the blank.', 'The next gap grows by the same step.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(PEAK, 2), predicted: true }, caption: `The same four moves with a negative s: ${seq(PEAK.slice(0, 6))}. Bottom row ${sOf(PEAK)}, next gap ${g(PEAK)[4]} + (${sOf(PEAK)}) = ${g(PEAK)[5]}, next term ${PEAK[5]} + (${g(PEAK)[5]}) = ${PEAK[6]}. Signs are the only extra care.` },
    { type: 'text', text: 'Why five terms are enough: they give four gaps and three second differences, and three equal entries in the bottom row are strong evidence. With six terms you get four, which is why the harder items show six. If the bottom row has only two entries, treat the answer as a hypothesis and check it against every shown term.' },
    { type: 'explain', prompt: 'Why does a constant second difference turn the gap row into a constant-gap sequence, and why is the new gap (not s) what you add to the last term?', model: 'The second differences are the gaps of the gap row; if they are all s, the gap row adds s each step, which is a constant-gap sequence. The terms are built from the gaps, not from s, so the last term grows by the new gap; s only tells you how the gap changes.', points: ['Second differences are the gaps of the gap row', 'Constant s makes the gap row arithmetic', 'Terms add gaps; gaps add s'] },

    S('worked'),
    { type: 'worked', family: 'second-diff', section: 'nl', difficulty: 1, seed: 'a', intro: 'Five terms, a small positive second difference. Build the ladder before opening the solution.' },
    { type: 'worked', family: 'second-diff', section: 'nl', difficulty: 2, seed: 'b', fade: 1, intro: 'Six terms, any sign. The two rows are given; the climb back up is yours.' },

    S('predict'),
    { type: 'predict', question: `Before building the ladder: ${seq(PEAK.slice(0, 5))}, ? Will the next term be above or below ${PEAK[4]}, and what is it?`, answer: `Below: the gaps ${seq(g(PEAK.slice(0, 5)))} fall by ${-sOf(PEAK)} each time and have reached 0, so the next gap is ${g(PEAK)[4]} and the term is ${PEAK[5]}.`, explain: 'A negative second difference is a peak waiting to happen: the terms fall once the gaps turn negative.' },

    S('traps'),
    { type: 'traps', family: 'second-diff', section: 'nl', extra: [
      { belief: 'The next gap equals the last gap.', fix: 'That is the constant-gap rule. Here the gap moves by s every step.' },
      { belief: 'Add the second difference to the last term.', fix: 's belongs to the gap row: next gap = last gap + s, and only that new gap is added to the term.' },
      { belief: 'A negative second difference means the terms fall.', fix: 'It means the gaps shrink. The terms keep rising until a gap crosses zero.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 5)))}.`,
      `Gaps of the gaps: ${seq(diffs(g(ERR.slice(0, 5))))}, so s = ${sOf(ERR)}.`,
      `Next term = last term + s = ${ERR[4]} + ${sOf(ERR)} = ${ERR[4] + sOf(ERR)}.`,
      `Answer: ${ERR[4] + sOf(ERR)}.`,
    ], errorStep: 2, explain: `s goes into the gap row, not the term: next gap = ${g(ERR)[3]} + ${sOf(ERR)} = ${g(ERR)[4]}, so the next term is ${ERR[4]} + ${g(ERR)[4]} = ${ERR[5]}. The warning sign: a jump of ${sOf(ERR)} is far smaller than the last gap of ${g(ERR)[3]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const xs = any(rng, 7), l = xs[4], lg = g(xs)[3], s = sOf(xs); return pick(rng, nextQ(xs.slice(0, 5)), xs[5], [[l + lg, 'repeated the last gap as if the gaps were constant'], [l + s, 'added the second difference to the last term instead of to the last gap'], [l + lg + 2 * s, 'moved the gap by twice the second difference'], [l + lg - s, 'moved the gap the wrong way'], [xs[6], 'went one step too far: that is the term after the next one']], `Next gap ${neg(lg)} ${sgn(s)} = ${neg(lg + s)}; ${neg(l)} ${sgn(lg + s)} = ${neg(xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'One line: **next = last + (last gap + s)**. You need only the last two gaps to read s, but glance at the earlier ones to confirm it. If s = 2, a plain n² is hiding inside; if s = 1, triangular numbers are.' },
    { type: 'callout', tone: 'speed', text: 'Two steps ahead (useful when the blank is late, or to double-check): the next two gaps are last gap + s and last gap + 2s, so the term after next is last + 2 × last gap + 3s.' },
    { type: 'check', scope: 'the one-line and two-step shortcuts', questions: [
      { make: (rng) => { const xs = any(rng, 7), l = xs[4], lg = g(xs)[3], s = sOf(xs); return num(`${seq(xs.slice(0, 5))}, ?, ? What is the term **after** the next one?`, xs[6], `Next gaps ${neg(lg + s)} and ${neg(lg + 2 * s)}: ${neg(l)} + 2 × ${lg < 0 ? `(${neg(lg)})` : lg} + 3 × ${s < 0 ? `(${neg(s)})` : s} = ${neg(xs[6])}.`, ['Find the last gap and s.', 'last + 2 × last gap + 3s.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Gaps change by a constant s → next gap = last gap + s, next term = last + next gap.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Gaps of gaps', 'Rule'], rows: [
      [seq(AR), seq(g(AR)), seq(diffs(g(AR))), 'constant gap'],
      [seq(UP.slice(0, 5)), seq(g(UP.slice(0, 5))), seq(diffs(g(UP.slice(0, 5)))), 'gap grows by a constant (this lesson)'],
      [seq(SQ), seq(g(SQ)), seq(diffs(g(SQ))), 'squares: the same, with s = 2'],
      [seq(DG), seq(g(DG)), seq(diffs(g(DG))), 'gaps double: divide the gaps instead'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: s = 0 is a constant gap. A negative s makes a peak, and a gap of exactly 0 repeats a term (${seq(PEAK.slice(3, 5))}). If the second row is not constant but itself changes steadily, a third row settles it: the same method, one layer deeper.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a constant second difference is constant acceleration. Distance covered under steady acceleration, or running totals of a steadily growing count, all have this two-row ladder.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) xs = arith(rng.int(1, 20), rng.int(2, 9), 5); else if (t === 1) xs = easy(rng, 5); else { const g0 = rng.int(1, 3); xs = [rng.int(1, 9)]; while (xs.length < 5) xs.push(xs[xs.length - 1] + g0 * 2 ** (xs.length - 1)); } const names = ['constant gap', 'gaps grow by a constant', 'gaps double']; const tr = [[null, 'the gaps do not change at all', 'the gaps are equal, not doubling'], ['the gaps change', null, 'the gaps grow by a fixed amount, not a factor'], ['the gaps change', 'the gaps of the gaps are not constant: they double too', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, tr[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
      { make: (rng) => { const xs = quad(rng.int(0, 20), rng.int(10, 16), -rng.int(3, 5), 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Gaps ${seq(g(xs).slice(0, 5))} fall by ${-sOf(xs)}: next gap ${neg(g(xs)[5])}, so ${neg(xs[5])} ${sgn(g(xs)[5])} = ${neg(xs[6])}.`, ['The gaps shrink by the same amount each step.', 'Once a gap is negative, the terms fall.']); } },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'second-diff', section: 'nl', count: 3 },
  ],
};
