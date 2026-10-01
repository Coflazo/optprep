// NumberLogic opening lesson: the universal method ladder (differences, differences again,
// ratios, recurrences, strands, known lists) and the order to test them under time pressure.
// It also exports the small helpers every NumberLogic part-A lesson uses, so all numbers in
// prose and diagrams are computed, never typed.
import { SECTION_TITLES, validateBlock } from '../../schema.js';
import { SECTIONS } from '../../../../config/sections.js';
import { Q } from '../../../core/rational.js';

// ---- shared helpers (pure) ----
export const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
export const neg = (v) => (v < 0 ? `−${-v}` : String(v));
export const sgn = (v) => (v < 0 ? `−${-v}` : `+${v}`);
export const seq = (xs) => xs.map(neg).join(', ');
export const diffs = (xs) => xs.slice(1).map((v, i) => v - xs[i]);
export const ladderRows = (xs, depth) => { const rows = [xs]; for (let k = 0; k < depth; k++) rows.push(diffs(rows[k])); return rows; };
export const ratio = (a, b) => (a === 0 ? 'undefined' : b % a === 0 ? b / a : Q.of(b, a).toString());
export const ratios = (xs) => xs.slice(1).map((v, i) => ratio(xs[i], v));
export const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };
export const nextQ = (xs) => `What comes next?  ${seq(xs)}, ?`;
export const allSame = (xs) => xs.every((v) => v === xs[0]);
export const round1 = (x) => Math.round(x * 10) / 10;
export const round2 = (x) => Math.round(x * 100) / 100;
// Smallest k whose k-th differences are constant (at least two entries), or -1: guards
// generated checks against coincidental polynomial fits.
export const polyDeg = (xs) => { let r = xs; for (let k = 0; r.length >= 2; k++, r = diffs(r)) if (allSame(r)) return k; return -1; };

// Choice question with shuffled options; wrong = [[value, false belief], ...]. Duplicates of
// the correct answer or of each other are dropped, so every shown wrong option names its belief.
export function pick(rng, q, correct, wrong, explain, extra = {}) {
  const lab = (v) => (typeof v === 'number' ? neg(v) : String(v));
  const opts = [{ v: lab(correct), ok: true }];
  const seen = new Set([opts[0].v]);
  for (const [v, t] of wrong) {
    const l = lab(v);
    if (seen.has(l)) continue;
    seen.add(l);
    opts.push({ v: l, t });
    if (opts.length === 5) break;
  }
  const order = rng.shuffle(opts);
  const traps = {};
  order.forEach((o, i) => { if (!o.ok) traps[i] = o.t; });
  return { type: 'choice', q, options: order.map((o) => o.v), answer: order.findIndex((o) => o.ok), traps, explain, ...extra };
}
// Redraw a generated choice question until the validator is happy with it (for options that
// are whole sequences, a longer right option is a length cue by accident, not by design).
export const fair = (build) => (rng) => { let x; for (let i = 0; i < 40; i++) { x = build(rng); if (!validateBlock({ type: 'check', questions: [x] }).length) break; } return x; };
export const num = (q, answer, explain, hints) => ({ type: 'number', q, answer, explain, ...(hints ? { hints } : {}) });

// ---- sequence builders used by the checks ----
export const arith = (a, d, n) => Array.from({ length: n }, (_, i) => a + i * d);
export const quad = (a, d0, s, n) => Array.from({ length: n }, (_, i) => a + i * d0 + (s * i * (i - 1)) / 2);
export const geo = (a, r, n) => Array.from({ length: n }, (_, i) => a * r ** i);
export const affine = (a, k, c, n) => { const o = [a]; while (o.length < n) o.push(k * o[o.length - 1] + c); return o; };
export const fibl = (a, b, n) => { const o = [a, b]; while (o.length < n) o.push(o[o.length - 1] + o[o.length - 2]); return o; };
export const weave = (A, B, n) => Array.from({ length: n }, (_, i) => (i % 2 ? B : A)[Math.floor(i / 2)]);
export const PRIMES = (() => { const p = []; for (let n = 2; p.length < 40; n++) if (p.every((d) => n % d)) p.push(n); return p; })();
export const tri = (m) => (m * (m + 1)) / 2;

// ---- lesson ----
const sec = (key, title) => ({ type: 'section', key, title });
const NL = SECTIONS.nl.exam;
const PACE = round1(NL.totalSeconds / NL.count);

const E1 = arith(7, 4, 5);
const E2 = quad(3, 1, 3, 6); // shown: first five; E2[5] is the continuation
const E2shown = E2.slice(0, 5);
const E2g = diffs(E2shown);
const SQ = Array.from({ length: 6 }, (_, i) => (i + 1) ** 2);
const CU = Array.from({ length: 6 }, (_, i) => (i + 1) ** 3);
const E4 = geo(3, 2, 5);
const E5c = 1, E5 = affine(2, 2, E5c, 5);
const E5next = 2 * E5[4] + E5c;
const E6 = fibl(4, 7, 5);
const E7a = arith(3, 2, 4), E7b = geo(12, 2, 3);
const E7 = weave(E7a, E7b, 6);
const CH = Array.from({ length: 6 }, (_, i) => (i + 1) ** 2 + 1);
const N8 = Array.from({ length: 8 }, (_, i) => i + 1);

// Four sequence types for the "which test" hinge.
const TESTS = ['first differences (the gaps)', 'second differences (gaps of gaps)', 'ratios (term ÷ previous term)', 'two strands (odd and even places)'];
const WHY_NOT = [
  // true type 0: arithmetic
  [null, 'the gaps are already constant: the first layer settles it', 'a constant gap is addition; the ratios drift, they are not constant', 'the gaps do not zigzag; one sequence explains every step'],
  // true type 1: quadratic
  ['the gaps change, so one subtraction is not enough', null, 'the gaps grow by a fixed amount, not by a fixed factor', 'the gaps move steadily in one direction; nothing zigzags'],
  // true type 2: geometric
  ['the gaps grow with the terms; they will never be constant', 'the gaps of the gaps grow too; subtraction layers never settle under multiplication', null, 'every step is the same multiplication; nothing alternates'],
  // true type 3: interleaved
  ['the gaps zigzag, so no single gap repeats', 'second differences of a zigzag zigzag even harder', 'neighbours are unrelated, so their ratios are meaningless', null],
];
function typedSeq(rng, t) {
  if (t === 0) return arith(rng.int(-10, 40), nz(rng, -9, 12), 5);
  if (t === 1) return quad(rng.int(1, 20), rng.int(1, 6), rng.int(1, 4), 5);
  if (t === 2) return geo(rng.int(1, 6), rng.pick([2, 3]), 5);
  const A = arith(rng.int(1, 9), rng.int(2, 5), 4), B = arith(rng.int(30, 60), -rng.int(2, 6), 3);
  return weave(A, B, 6);
}

export default {
  id: 'nl/method-ladder',
  book: 'nl',
  kind: 'foundation',
  title: 'The method ladder: how to attack any sequence',
  summary: 'Subtract, subtract again, divide, look back two terms, split the strands, match a known list: stop at the first layer that is constant.',
  prerequisites: ['assessment/minus-one-rule', 'assessment/pacing'],
  objectives: [
    'Build a difference ladder for five or six terms and say which row is constant',
    'Extend the bottom row and climb back up to the next term, one row at a time',
    'Pick the next test (ratios, recurrence, strands, known list) from what the ladder shows',
    `Budget about ${Math.round(PACE)} seconds a question and know when to skip and come back`,
  ],
  blocks: [
    sec('format', 'What NumberLogic asks'),
    { type: 'text', text: `NumberLogic shows a short list of numbers and a question mark. You pick the number that continues the list. There are **${NL.count} questions** on **one ${NL.totalSeconds / 60}-minute clock**, you may skip a question and come back to it, and scoring is **+1 right, −1 wrong, 0 skipped**.` },
    { type: 'text', text: `That is about **${PACE} seconds per question** on average. The questions get harder as you go, so the early ones must be faster than average to pay for the late ones.` },
    { type: 'check', scope: 'the format and its scoring', questions: [
      { make: (rng) => { const r = rng.int(13, 21), w = rng.int(1, 5), s = NL.count - r - w; return num(`You answer ${r} questions right, ${w} wrong and skip ${s}. What is your score?`, r - w, `${r} × (+1) + ${w} × (−1) + ${s} × 0 = ${r - w}.`, ['Each right answer is +1, each wrong one −1.', 'Skips score 0: only rights and wrongs count.']); } },
      { type: 'choice', q: 'You are stuck on question 5 after 70 seconds. What does the format let you do?', options: ['Skip it and come back later', 'Nothing: once you move on, it is gone', 'Guess: a blank counts as wrong anyway'], answer: 0, traps: { 1: 'that is the forward-only format of other tasks; NumberLogic lets you return', 2: 'a skip scores 0; a wrong guess scores −1' }, explain: 'One clock for the whole task and free navigation: park it, bank the easy ones, return with the time you saved.' },
    ] },

    sec('gaps', 'Test 1: subtract neighbours'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Find it two different ways.`, answer: `${CH[5]}`, explain: `Way 1: the gaps are ${seq(diffs(CH.slice(0, 5)))}, rising by ${diffs(diffs(CH))[0]} each time, so the next gap is ${diffs(CH)[4]} and ${CH[4]} + ${diffs(CH)[4]} = ${CH[5]}. Way 2: every term is a square plus 1, and 6² + 1 = ${CH[5]}. Two routes to one answer is what this lesson builds: the ladder that always works, and the shortcuts that are faster when you see them.` },
    { type: 'text', text: 'Every NumberLogic item hides one object: a **rule** that makes each term from the terms before it, or from its position. You cannot see the rule. You can see what it does to neighbours. The cheapest probe is subtraction: write each **gap** (later term minus earlier term) underneath, halfway between the two terms it came from.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1, 1) }, caption: `Terms on top, gaps below, each gap between its two terms. The gap row is ${E1[1] - E1[0]} every time, so the rule is "add ${E1[1] - E1[0]}". One subtraction per pair, done in your head.` },
    { type: 'check', scope: 'subtracting neighbours', questions: [
      { make: (rng) => { const a = rng.int(-20, 50), d = nz(rng, -12, 15), xs = arith(a, d, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Every gap is ${sgn(d)}, so ${neg(xs[4])} ${sgn(d)} = ${neg(xs[5])}.`, ['Subtract each term from the one after it.', `Every gap is the same: add it once more to ${neg(xs[4])}.`]); } },
      { make: (rng) => {
        const A = arith(rng.int(1, 30), rng.int(2, 9), 5), G = geo(rng.int(1, 5), 2, 5), Qd = quad(rng.int(1, 9), rng.int(1, 4), 2, 5);
        const d1 = rng.int(2, 7), d2 = rng.int(1, 4), Z = [rng.int(1, 9)]; while (Z.length < 5) Z.push(Z[Z.length - 1] + (Z.length % 2 ? d1 : -d2));
        return pick(rng, 'Which sequence has a constant gap?', seq(A), [[seq(G), `its gaps ${seq(diffs(G))} double`], [seq(Qd), `its gaps ${seq(diffs(Qd))} grow by 2`], [seq(Z), `its gaps ${seq(diffs(Z))} alternate`]], `The gaps of ${seq(A)} are ${seq(diffs(A))}: the same every time.`);
      } },
    ] },

    sec('ladder', 'Test 2: differences of differences'),
    { type: 'text', text: `When the gap row is not constant, do not guess a formula. The gap row is itself a sequence, so apply the same test to it. Each subtraction peels off one layer. Stop at the first row that is constant: that row is the only thing you know for certain, and everything else is rebuilt from it. Take ${seq(E2shown)} as the running example.` },
    { type: 'steps', steps: [
      { say: `Take differences: write each gap between its two terms. For ${seq(E2shown)} the gaps are ${seq(E2g)}.`, why: 'The gap removes the starting value. If the rule were "add the same amount", this row would be constant and you would stop here.',
        checks: [
          { make: (rng) => { const xs = quad(rng.int(1, 30), rng.int(-4, 8), nz(rng, -3, 4), 5); const g = diffs(xs); return num(`Write the gaps of ${seq(xs)}. What is the **last** gap?`, g[3], `Gaps: ${seq(g)}. The last is ${neg(xs[4])} − ${neg(xs[3])} = ${neg(g[3])}.`, ['Later term minus earlier term, for each neighbouring pair.', `The last pair is ${neg(xs[3])} and ${neg(xs[4])}.`]); } },
          { make: (rng) => { const lin = rng.chance(0.5); const xs = lin ? arith(rng.int(1, 30), nz(rng, -9, 9), 5) : quad(rng.int(1, 30), rng.int(1, 8), nz(rng, -3, 4), 5); return pick(rng, `Is the gap row of ${seq(xs)} constant?`, lin ? 'Yes' : 'No', [[lin ? 'No' : 'Yes', lin ? 'every gap is the same; check each subtraction again' : 'the gaps change; look at all of them, not just the first two']], `Gaps: ${seq(diffs(xs))}.`); } },
        ] },
      { say: `Take differences again: the gaps of the gaps. Here ${seq(E2g)} gives ${seq(diffs(E2g))}. Constant: the second difference is ${diffs(E2g)[0]}.`, why: 'The gap row is just another sequence. If it rises by the same amount each time, that amount is constant, and you have found the layer the rule lives on.',
        checks: [
          { make: (rng) => { const s = nz(rng, -4, 5), xs = quad(rng.int(1, 30), rng.int(-3, 9), s, 5); return num(`What is the constant second difference of ${seq(xs)}?`, s, `Gaps ${seq(diffs(xs))}; their gaps ${seq(diffs(diffs(xs)))}: all ${neg(s)}.`, ['First write the gaps.', 'Now subtract neighbouring gaps.']); } },
        ] },
      { say: `Extend the bottom row: copy its constant once more. The new bottom entry is ${diffs(E2g)[0]}.`, why: 'The constant row is the one layer whose rule you know for certain, so it is the only row you may extend by copying. Every other row is rebuilt from it.',
        checks: [
          { hinge: true, make: (rng) => { const s = nz(rng, -3, 4), xs = quad(rng.int(1, 30), rng.int(2, 9), s, 5), g = diffs(xs), last = xs[4], lg = g[3]; return pick(rng, `Ladder for ${seq(xs)}: gaps ${seq(g)}, second differences ${seq(diffs(g))}. What do you write **first**?`, `${neg(s)} at the end of the bottom row`, [[`${neg(lg)} at the end of the gap row`, 'copied the gap row, but it is not constant; only the bottom row repeats'], [`${neg(last + lg)} as the next term`, 'repeated the last gap, skipping the row that actually changes'], [`${neg(last + s)} as the next term`, 'added the second difference straight to the last term; it belongs to the gap row, one level down']], 'Always start at the constant row: extend it by copying, then climb up.'); } },
        ] },
      { say: `Climb back up: each new entry is the entry to its upper left plus the new entry below it. Next gap ${E2g[3]} + ${diffs(E2g)[0]} = ${E2g[3] + diffs(E2g)[0]}, then next term ${E2shown[4]} + ${E2g[3] + diffs(E2g)[0]} = ${E2[5]}.`, why: 'Every entry is the difference of the two above it, so the missing upper entry = its left neighbour + the difference beneath. Add upwards, row by row, until you reach the terms.',
        checks: [
          { make: (rng) => { const s = nz(rng, -3, 4), xs = quad(rng.int(1, 30), rng.int(1, 9), s, 6), g = diffs(xs); return num(`${seq(xs.slice(0, 5))}, ? The gaps are ${seq(g.slice(0, 4))} and the second difference is ${neg(s)}. What is the **next gap**?`, g[4], `Last gap ${neg(g[3])} ${sgn(s)} = ${neg(g[4])}.`, ['The new gap sits under the last gap, one step to the right.', `Last gap plus the second difference: ${neg(g[3])} ${sgn(s)}.`]); } },
          { make: (rng) => { const s = nz(rng, -3, 4), xs = quad(rng.int(1, 30), rng.int(1, 9), s, 6), g = diffs(xs); return num(nextQ(xs.slice(0, 5)), xs[5], `Gaps ${seq(g.slice(0, 4))}, second difference ${neg(s)}; next gap ${neg(g[4])}; next term ${neg(xs[4])} ${sgn(g[4])} = ${neg(xs[5])}.`, ['Build the gaps and the gaps of the gaps.', 'Extend the constant row, then add upwards: next gap, then next term.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E2, 2), predicted: true }, caption: `The whole move on one picture. The bottom row is constant (${diffs(E2g)[0]}); the outlined cells were written in the order bottom, middle, top: ${diffs(E2g)[0]}, then ${E2g[3]} + ${diffs(E2g)[0]} = ${diffs(E2)[4]}, then ${E2shown[4]} + ${diffs(E2)[4]} = ${E2[5]}.` },
    { type: 'explain', prompt: 'Why may you copy the bottom row but not the gap row? And why does "upper-left entry + entry below" rebuild the row above?', model: 'The bottom row is the first constant row, so its next entry is certain; the gap row changes, so copying it would assume a rule it does not follow. Each entry is the difference of the two entries above it, so the missing upper entry equals its left neighbour plus that difference.', points: ['Only a constant row can be extended by copying', 'Each entry = right term − left term of the row above', 'So the new upper entry = left neighbour + new entry below, climbing one row at a time'] },

    sec('polynomial', 'Why the ladder finds every polynomial'),
    { type: 'text', text: 'Each subtraction lowers the degree by one. A rule like 5 + 3n changes by exactly 3 per step, so its first row of gaps is constant. For n² the gap is (n + 1)² − n², which is linear, so the gaps of the gaps are constant. For n³ the gap is quadratic, so you need three layers.' },
    { type: 'formula', text: '(n + 1)^{2} − n^{2} = 2n + 1,   then   (2(n + 1) + 1) − (2n + 1) = 2' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(SQ, 2) }, caption: `The squares ${seq(SQ)}: gaps are the odd numbers, and the second row is ${diffs(diffs(SQ))[0]} every time. For k·n² the constant is 2k; shifting every term by a constant changes nothing below the top row.` },
    { type: 'check', scope: 'the second difference of k·n²', questions: [
      { make: (rng) => { const k = rng.int(2, 6), c = nz(rng, -9, 9), xs = Array.from({ length: 5 }, (_, i) => k * (i + 1) ** 2 + c); return num(`${seq(xs)} is ${k}n² ${c < 0 ? '−' : '+'} ${Math.abs(c)}. What is its constant second difference?`, 2 * k, `For k·n² the constant is 2k = ${2 * k}. Check: gaps ${seq(diffs(xs))}, their gaps ${seq(diffs(diffs(xs)))}.`, ['n² alone has second difference 2.', 'Multiplying every term by k multiplies every row by k.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CU, 3) }, caption: `The cubes ${seq(CU)} need three layers: the third row is ${diffs(diffs(diffs(CU)))[0]} every time. Each extra power costs one more row, and one more shown term to see it.` },
    { type: 'callout', tone: 'idea', text: 'Count what you can trust. Every row is one entry shorter than the row above, and a row only proves itself constant with at least two equal entries (three is safer). Five terms give three second differences: enough for a quadratic. A cubic needs six terms to show three equal third differences.' },
    { type: 'check', scope: 'degree = number of layers', questions: [
      { hinge: true, make: (rng) => {
        const deg = rng.int(1, 3), k = rng.int(2, 5), c = nz(rng, -9, 9);
        const form = deg === 1 ? `${k}n ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : `${k}n^{${deg}} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
        const names = ['first differences', 'second differences', 'third differences'];
        const trapFor = (d) => (d < deg ? `one subtraction per power: n${deg > 1 ? `^{${deg}}` : ''} needs ${deg} layers, not ${d}` : `too many layers: n${deg > 1 ? `^{${deg}}` : ''} is already constant after ${deg}`);
        return pick(rng, `a(n) = ${form}. Which row of the ladder is the first constant one?`, names[deg - 1], [...[1, 2, 3].filter((d) => d !== deg).map((d) => [names[d - 1], trapFor(d)]), ['none: the constant spoils it', 'a constant shifts every term equally; it disappears in the first subtraction']], `Degree ${deg} means ${deg} layer${deg > 1 ? 's' : ''} of subtraction.`);
      } },
    ] },

    sec('ratios', 'Test 3: divide neighbours'),
    { type: 'text', text: `Some sequences never settle under subtraction. In ${seq(E4)} the gaps are ${seq(diffs(E4))}: a copy of the sequence itself. The gaps of the gaps are a copy again. That is the fingerprint of **multiplication**: the step is proportional to the current size, so what stays fixed is the ratio, next ÷ previous.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E4, 2) }, caption: 'Subtracting a doubling sequence gives the same doubling sequence back, row after row. No row will ever be constant: switch tests.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [E4, ratios(E4)] }, caption: `Divide instead: every ratio is ${ratios(E4)[0]}. Next term ${E4[4]} × ${ratios(E4)[0]} = ${E4[4] * 2}.` },
    { type: 'check', scope: 'dividing neighbours', questions: [
      { make: (rng) => { const r = rng.pick([2, 3]), xs = geo(rng.int(2, 7), r, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Every ratio is ${r}: ${xs[4]} × ${r} = ${xs[5]}.`, ['The gaps grow as fast as the terms: divide instead.', 'Term ÷ previous term is the same every time.']); } },
      { make: (rng) => {
        const G = geo(rng.int(1, 5), 3, 5), A = arith(rng.int(2, 9), rng.int(3, 9), 5), F = affine(rng.int(1, 5), 2, rng.int(1, 3), 5);
        const rr = (xs) => ratios(xs).map((v) => round2(typeof v === 'number' ? v : Number(v.split('/')[0]) / Number(v.split('/')[1]))).join(', ');
        return pick(rng, 'Which sequence has a constant ratio?', seq(G), [[seq(A), `constant gap, not ratio: its ratios ${rr(A)} shrink`], [seq(F), `its ratios ${rr(F)} are near 2 but not equal`]], `Every ratio of ${seq(G)} is 3.`);
      } },
    ] },

    sec('recurrence', 'Test 4: build each term from the ones before'),
    { type: 'text', text: `Two recurrences cover most of what is left. **Multiply, then add**: a(n) = k·a(n−1) + c. The ratios hover near k without being equal, so compute next − k × previous: the leftover is the same every step. In ${seq(E5)} the ratios sit near 2, and every leftover is ${E5[1] - 2 * E5[0]}.` },
    { type: 'diagram', diagram: 'table', spec: { columns: ['previous', '2 × previous', 'actual next', 'leftover'], rows: E5.slice(0, 4).map((v, i) => [neg(v), neg(2 * v), neg(E5[i + 1]), sgn(E5[i + 1] - 2 * v)]) }, caption: `Line up 2 × previous against the actual next term. The leftover column is constant (${sgn(E5[1] - 2 * E5[0])}), so next = 2 × ${E5[4]} ${sgn(E5c)} = ${E5next}.` },
    { type: 'check', scope: 'the leftover after multiplying', questions: [
      { make: (rng) => { const k = rng.pick([2, 3]), c = nz(rng, -5, 6), xs = affine(rng.int(2, 9), k, c, 5); return num(`The ratios of ${seq(xs)} sit near ${k}. What is the leftover, next − ${k} × previous?`, c, `${neg(xs[2])} − ${k} × ${neg(xs[1])} = ${neg(c)}, and the same on every step.`, [`Pick two neighbours and compute ${k} × the first.`, 'Subtract that from the second: the same leftover appears every time.']); } },
    ] },
    { type: 'text', text: `**Add the previous two**: a(n) = a(n−1) + a(n−2). Here the gap into each term equals the term two places back, so the gap row is the sequence shifted right by two. In ${seq(E6)} the gaps are ${seq(diffs(E6))}.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E6, 1) }, caption: `The gaps ${seq(diffs(E6).slice(1))} reappear as terms: ${seq(E6.slice(0, 3))} on the top row. When the gap row copies the sequence two places back, add the last two terms: ${E6[3]} + ${E6[4]} = ${E6[3] + E6[4]}.` },
    { type: 'check', scope: 'two-term sums', questions: [
      { make: (rng) => { const a = rng.int(1, 9); let b = rng.int(1, 12); while (b === a || b === 2 * a) b = rng.int(1, 12); const xs = fibl(a, b, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Gaps ${seq(diffs(xs.slice(0, 6)))} repeat the terms two places back: ${neg(xs[4])} + ${neg(xs[5])} = ${neg(xs[6])}.`, ['Write the gaps and compare them with the terms.', 'Add the last two terms.']); } },
    ] },

    sec('strands', 'Test 5: two sequences taking turns'),
    { type: 'text', text: 'If the gaps zigzag (up, down, up, down) or neighbours look unrelated, two sequences may be written alternately. Read positions 1, 3, 5, … as one list and 2, 4, 6, … as another, and solve each on its own. The next term continues the strand whose turn it is: with 6 terms shown, position 7 is odd, so it continues the first strand.' },
    { type: 'diagram', diagram: 'strands', spec: { terms: E7, k: 2, labels: ['odd positions: add 2', 'even positions: double'], next: E7a[3] }, caption: `${seq(E7)} splits into ${seq(E7a.slice(0, 3))} (add 2) and ${seq(E7b)} (double). Position 7 is odd, so the next term is ${E7a[3]}, not ${E7b[2] * 2}.` },
    { type: 'check', scope: 'splitting strands', questions: [
      { make: (rng) => { const n = rng.pick([6, 7]), xs = weave(arith(rng.int(1, 9), rng.int(2, 5), 4), arith(rng.int(40, 70), -rng.int(3, 7), 4), n); const odd = n % 2 === 0; return pick(rng, `${seq(xs)}, ? Which strand does the next term continue?`, odd ? 'positions 1, 3, 5, …' : 'positions 2, 4, 6, …', [[odd ? 'positions 2, 4, 6, …' : 'positions 1, 3, 5, …', `the next term is position ${n + 1}, which is ${odd ? 'odd' : 'even'}`]], `${n} terms shown, so the next is position ${n + 1}.`); } },
      { make: (rng) => { let n, A, B, xs; do { n = rng.pick([6, 7]); A = arith(rng.int(1, 9), rng.int(2, 5), 4); B = geo(rng.int(2, 5), 2, 4); xs = weave(A, B, n + 1); } while (polyDeg(xs.slice(0, n)) >= 0 || (n === 6 && B[0] <= A[1])); return num(nextQ(xs.slice(0, n)), xs[n], `Strands ${seq(A.slice(0, Math.ceil(n / 2)))} (add ${A[1] - A[0]}) and ${seq(B.slice(0, Math.floor(n / 2)))} (double). Position ${n + 1} is ${n % 2 ? 'even' : 'odd'}: ${xs[n]}.`, ['Neighbours are unrelated: read every second term.', `Which strand owns position ${n + 1}?`]); } },
    ] },

    sec('index', 'Test 6: terms made from the position'),
    { type: 'text', text: 'Some sequences are a famous list, possibly shifted or scaled: squares, cubes, triangular numbers (running totals 1, 1 + 2, 1 + 2 + 3, …), products n(n + 1), powers of 2 and primes. Their gaps are fingerprints: squares have odd gaps, triangular numbers have gaps 2, 3, 4, …, powers of 2 have doubling gaps, and primes have irregular gaps that never settle. Primes are the one list no ladder row ever catches: you must recognise them.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['n', 'n²', 'n³', 'n(n + 1)/2', 'n(n + 1)', '2^n', 'n-th prime'], rows: N8.map((n) => [String(n), String(n * n), String(n ** 3), String(tri(n)), String(n * (n + 1)), String(2 ** n), String(PRIMES[n - 1])]) }, caption: 'The lists worth knowing by sight. Subtract a small constant from every term of a problem and look for one of these columns.' },
    { type: 'check', scope: 'the known lists', questions: [
      { make: (rng) => { const s = rng.int(2, 8), c = nz(rng, -6, 6), xs = Array.from({ length: 6 }, (_, i) => (i + s) ** 2 + c); return num(nextQ(xs.slice(0, 5)), xs[5], `Each term is a square ${c < 0 ? 'minus' : 'plus'} ${Math.abs(c)}: ${seq(xs.slice(0, 5).map((v) => v - c))}. Next: ${s + 5}² ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${xs[5]}.`, ['Are these close to perfect squares?', 'Subtract the same constant from every term and read the squares.']); } },
      { make: (rng) => {
        const lists = [['squares', (i) => (i + 2) ** 2, 'gaps are the odd numbers', 'squares (n²)'], ['cubes', (i) => (i + 2) ** 3, 'gaps grow far faster than odd numbers', 'cubes (n³)'], ['triangular numbers', (i) => tri(i + 2), 'gaps count up by 1', 'triangular (n(n + 1)/2)'], ['powers of 2', (i) => 2 ** (i + 1), 'gaps double', 'powers of 2 (2, 4, 8, …)'], ['primes', (i) => PRIMES[i + 2], 'gaps are irregular', 'primes (2, 3, 5, 7, …)']];
        const t = rng.int(0, 4), c = rng.int(1, 9), xs = Array.from({ length: 5 }, (_, i) => lists[t][1](i) + c);
        return pick(rng, `Each term of ${seq(xs)} is a known list plus the same constant. Which list?`, lists[t][3], lists.filter((_, i) => i !== t).map((l) => [l[3], `that list's ${l[2]}; these gaps are ${seq(diffs(xs))}`]), `The gaps ${seq(diffs(xs))} match the ${lists[t][0]}: their ${lists[t][2]}. A constant shift never changes the gaps.`);
      } },
    ] },

    sec('order', 'The order of tests under time pressure'),
    { type: 'diagram', diagram: 'flow', spec: { root: 'g', nodes: [
      { id: 'g', text: 'Gaps constant?', kind: 'q' },
      { id: 'ga', text: 'Add the gap', kind: 'a' },
      { id: 'g2', text: 'Gaps of gaps constant?', kind: 'q' },
      { id: 'g2a', text: 'Extend bottom row, climb up', kind: 'a' },
      { id: 'r', text: 'Ratios constant?', kind: 'q' },
      { id: 'ra', text: 'Multiply by the ratio', kind: 'a' },
      { id: 'rec', text: 'Ratios near k, or gaps copy earlier terms?', kind: 'q' },
      { id: 'reca', text: 'k × previous + leftover, or add the last two', kind: 'a' },
      { id: 'z', text: 'Gaps zigzag?', kind: 'q' },
      { id: 'za', text: 'Split strands, continue the right one', kind: 'a' },
      { id: 'k', text: 'Near a known list?', kind: 'q' },
      { id: 'ka', text: 'Undo the shift, read the list', kind: 'a' },
      { id: 'skip', text: 'Skip and come back', kind: 'note' },
    ], edges: [
      { from: 'g', to: 'ga', label: 'yes' }, { from: 'g', to: 'g2', label: 'no' },
      { from: 'g2', to: 'g2a', label: 'yes' }, { from: 'g2', to: 'r', label: 'no' },
      { from: 'r', to: 'ra', label: 'yes' }, { from: 'r', to: 'rec', label: 'no' },
      { from: 'rec', to: 'reca', label: 'yes' }, { from: 'rec', to: 'z', label: 'no' },
      { from: 'z', to: 'za', label: 'yes' }, { from: 'z', to: 'k', label: 'no' },
      { from: 'k', to: 'ka', label: 'yes' }, { from: 'k', to: 'skip', label: 'no' },
    ] }, caption: 'The ladder of tests, cheapest first. Most items stop in the first two boxes; each "no" costs a few seconds more.' },
    { type: 'callout', tone: 'speed', text: 'Let the **shape of the gaps** choose the next test instead of walking the list blindly: gaps of steady size → differences; gaps that grow like the terms → ratios; gaps that zigzag → strands; gaps that repeat earlier terms → add the last two; growth that explodes → products or powers.' },
    { type: 'callout', tone: 'speed', text: `Time budget: about ${PACE} seconds a question on average, less early on. If no layer is constant after about a minute, skip and come back: a fresh look later often sees it at once, and a guess costs a point.` },
    { type: 'check', scope: 'choosing the test', questions: [
      { hinge: true, make: (rng) => { const t = rng.int(0, 3), xs = typedSeq(rng, t); return pick(rng, `${seq(xs)}, ? Which test reveals the rule fastest?`, TESTS[t], TESTS.map((n, i) => [n, WHY_NOT[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(diffs(xs))}.`); } },
    ] },

    sec('predict', 'Predict'),
    { type: 'predict', question: `${seq(SQ.slice(1, 6))}, ? Before building anything: which row of the ladder will be constant, what is its value, and what is the next term?`, answer: `The second row, value ${diffs(diffs(SQ))[0]}: these are the squares 2² to 6², so the next is 7² = ${7 * 7}.`, explain: 'Recognising the list and building the ladder give the same answer; the ladder is the fallback when you do not recognise it.' },

    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Subtract, subtract again, divide, look back two terms, split the strands, match a known list: stop at the first constant layer, extend it, climb back up.' },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a constant sequence (7, 7, 7) is arithmetic with gap 0; a sequence containing 0 cannot be tested with ratios through that 0; a negative ratio shows up as signs that alternate.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: any table that changes step by step (a count by round, a price series) yields to the same question, "which layer is constant?". The difference ladder is also the discrete version of taking derivatives: a polynomial of degree k dies after k + 1 subtractions.' },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole ladder', questions: [
      { make: (rng) => { const s = nz(rng, -3, 4), xs = quad(rng.int(1, 30), rng.int(2, 9), s, 7), g = diffs(xs); return pick(rng, nextQ(xs.slice(0, 5)), xs[5], [[xs[4] + g[3], 'repeated the last gap as if the gaps were constant'], [xs[4] + g[3] + 2 * s, 'moved the gap by twice the second difference'], [xs[6], 'went one step too far: that is the term after the next one'], [xs[4] + s, 'added the second difference to the last term instead of to the last gap']], `Gaps ${seq(g.slice(0, 4))}, second difference ${neg(s)}: next gap ${neg(g[4])}, next term ${neg(xs[5])}.`); } },
      { make: (rng) => { const k = rng.pick([2, 3]), c = nz(rng, -4, 5), xs = affine(rng.int(2, 8), k, c, 6); return pick(rng, nextQ(xs.slice(0, 5)), xs[5], [[k * xs[4], `multiplied by ${k} but forgot the leftover ${sgn(c)}`], [k * xs[4] - c, 'used the leftover with the wrong sign'], [k * (xs[4] + c), `added ${neg(c)} before multiplying instead of after`], [xs[4] + (xs[4] - xs[3]), 'repeated the last gap; the gaps multiply']], `Ratios near ${k}, leftover ${sgn(c)}: ${k} × ${neg(xs[4])} ${sgn(c)} = ${neg(xs[5])}.`); } },
      { make: (rng) => { const n = rng.pick([6, 7]), A = arith(rng.int(1, 9), rng.int(2, 6), 5), B = arith(rng.int(40, 80), -rng.int(3, 8), 5), xs = weave(A, B, n + 2); return pick(rng, nextQ(xs.slice(0, n)), xs[n], [[xs[n + 1], 'continued the wrong strand'], [xs[n - 1] + (xs[n - 1] - xs[n - 2]), 'treated the list as one sequence and repeated the last gap'], [xs[n - 2], 'repeated the term two places back instead of continuing its strand']], `Position ${n + 1} continues the ${n % 2 ? 'even' : 'odd'} strand: ${neg(xs[n])}.`); } },
    ] },
  ],
};
