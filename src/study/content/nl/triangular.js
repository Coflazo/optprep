// NumberLogic family lesson: triangular numbers, multiples and shifts. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, arith, tri } from './method-ladder.js';

// term i = k * T(s + i) + c: the generator's parametrisation.
const tr = (s, k, c, n) => Array.from({ length: n }, (_, i) => k * tri(s + i) + c);
const g = (xs) => diffs(xs);

const T10 = Array.from({ length: 10 }, (_, i) => tri(i + 1));
const CHs = 4, CH = tr(CHs, 1, 0, 6), CHm = CHs + 4;
const E1 = tr(3, 1, 0, 6);
const E2 = tr(2, 2, 0, 6);
const E3s = 2, E3k = 3, E3c = -2, E3 = tr(E3s, E3k, E3c, 6);
const ERRs = 7, ERR = tr(ERRs, 1, 0, 6), ERRm = ERRs + 4;
const SQ = Array.from({ length: 5 }, (_, i) => (i + 1) ** 2);
const PRON = Array.from({ length: 5 }, (_, i) => (i + 1) * (i + 2));
const ADD = [10, 11, 13, 16, 20];
const DOT = 4; // the picture uses T(4) and a 4 × 5 rectangle
const H15 = 15, SQm = 6;

// Dots: an m × (m + 1) rectangle split into two triangles of T(m) dots each.
const dotItems = (m) => {
  const out = [];
  for (let r = 0; r < m; r++) for (let c = 0; c <= m; c++) out.push({ x: 24 + c * 30, y: 24 + r * 30, r: 10, shape: 'circle', tone: c <= r ? 1 : 3 });
  return out;
};

const d1 = (rng, n) => { const s = rng.int(1, 7); return { s, k: 1, c: 0, xs: tr(s, 1, 0, n) }; };
const d2 = (rng, n) => { const s = rng.int(1, 7), k = rng.pick([2, 3]), c = nz(rng, -5, 5); return { s, k, c, xs: tr(s, k, c, n) }; };
const TAs = 5, TAk = 2, TAc = 3, TA = tr(TAs, TAk, TAc, 6), TAg = g(TA), TAm = TAs + 4;
const E15 = E1.slice(0, 5), E1m = 3 + 5, DB = E1.map((v) => 2 * v), UP5 = E1.map((v) => v + 5), LATE = tr(10, 1, 0, 6), BOTH = E1.map((v) => 2 * v + 5);
const shift = (c) => (c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : '');

export default {
  id: 'nl/triangular',
  book: 'nl',
  kind: 'family',
  family: 'triangular',
  title: 'Triangular numbers',
  summary: 'Running totals 1, 3, 6, 10, 15: gaps 2, 3, 4, …, and T(m) = m(m + 1)/2; multiples k·T have gaps k, 2k, 3k.',
  prerequisites: ['nl/method-ladder', 'nl/add-index'],
  objectives: [
    `Know the triangular numbers ${seq(T10)} by sight`,
    'Compute any T(m) = m(m + 1)/2 in one line',
    'Read multiples and shifts k·T(m) + c from the gaps',
    'Tell triangular numbers from squares and from products of neighbours',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by thinking of each term as a sum 1 + 2 + … + m.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} count up, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. As sums: ${CH[4]} = 1 + 2 + … + ${CHm}, so the next is 1 + 2 + … + ${CHm + 1} = ${CHm + 1} × ${CHm + 2} / 2 = ${CH[5]}.`,
      attempts: [
        { id: 'squares', label: 'Look for squares', approach: `Read the terms as squares plus something: ${CH[2]} is near 25 and ${CH[4]} is 36.`, breaksAt: `Square gaps are the odd numbers 3, 5, 7. These gaps, ${seq(g(CH.slice(0, 5)))}, count by 1: the triangular fingerprint.` },
        { id: 'position', label: 'Count positions for m', approach: `Called ${CH[4]} the 5th triangular number because it is the 5th term, and answered T(6) = ${tri(6)}.`, breaksAt: `The list starts partway along: the last gap is ${CHm}, so ${CH[4]} is T(${CHm}), not T(5).` },
        { id: 'half-square', label: 'Use m × m / 2', approach: `Wrote T(${CHm + 1}) = ${CHm + 1} × ${CHm + 1} / 2 = ${(CHm + 1) ** 2 / 2}.`, breaksAt: 'T(m) is m(m + 1)/2: the rectangle made of two triangles is one dot wider than it is tall.' },
      ] },
    { type: 'text', text: `The terms are **running totals of the counting numbers**: 1, 1 + 2, 1 + 2 + 3, and so on, giving ${seq(T10.slice(0, 6))}. The name comes from dots stacked in a triangle: one dot in the top row, two in the next, three below that. An item may start partway along the list, multiply every term by 2 or 3, or add a constant to each.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`, `Which number replaces the question mark?  ${seq(E1.slice(0, 2))}, ?, ${seq(E1.slice(3, 5))}`] },
    { type: 'check', scope: 'the cue: running totals', questions: [
      { make: (rng) => { const s = rng.int(1, 5), t = tr(s, 1, 0, 5), q = Array.from({ length: 5 }, (_, i) => (i + s) ** 2), p = Array.from({ length: 5 }, (_, i) => (i + s + 1) * (i + s + 3)); return pick(rng, 'Which sequence is a run of triangular numbers?', seq(t), [[seq(q), `those are squares: gaps ${seq(g(q))} are odd numbers`], [seq(p), `its gaps ${seq(g(p))} rise by 2, not by 1`]], `${seq(t)} has gaps ${seq(g(t))}: rising by 1.`); } },
    ] },
    { type: 'text', text: `Not this lesson: gaps in odd numbers 3, 5, 7, 9, which make squares (${seq(SQ)}). And note the overlap with the previous lesson: any "add 1, 2, 3, …" sequence such as ${seq(ADD)} is a triangular list shifted by a constant. This lesson is about knowing the list itself and jumping to any T(m) with a formula.` },
    { type: 'check', scope: 'the overlap with add-the-index', questions: [
      { type: 'choice', q: '10, 11, 13, 16, 20: what is it?', options: ['triangular numbers plus 10', 'squares plus a constant', 'unrelated to triangular numbers'], answer: 0, traps: { 1: 'gaps 1, 2, 3, 4 count up by 1; squares have odd gaps', 2: '"add 1, 2, 3, …" is a triangular list shifted' }, explain: 'T = 0, 1, 3, 6, 10, plus 10 each: 10, 11, 13, 16, 20.' },
    ] },

    S('why'),
    { type: 'text', text: 'Triangular numbers appear on their own and inside other rules: running totals, counts of pairs, sums of a count. Knowing the first ten by sight makes early items instant. The formula matters later: it jumps straight to a far term, checks a missing term, and exposes a scaled list (2, 6, 12, 20 is twice the triangular numbers). The gaps also give you a free position marker, which the other lessons do not.' },

    S('anchor'),
    { type: 'text', text: 'You know the counting numbers 1, 2, 3, 4. Triangular numbers change **one thing**: instead of listing them, keep a running total. Each new triangular number is the previous one plus the next counting number.' },
    { type: 'check', scope: 'running totals', questions: [
      { make: (rng) => { const m = rng.int(5, 9); return num(`What is 1 + 2 + … + ${m}?`, tri(m), `Running total: ${Array.from({ length: m }, (_, i) => tri(i + 1)).join(', ')}. The last is ${tri(m)}.`, ['Keep a running total as you add.', `Or pair them: (1 + ${m}) × ${m} ÷ 2.`]); } },
    ] },

    S('picture'),
    { type: 'text', text: `Stack T(m) dots in a triangle, then place a second, flipped copy against it. Together they fill a rectangle m dots tall and m + 1 dots wide. So two triangles hold m(m + 1) dots and one holds **T(m) = m(m + 1)/2**. In the picture m = ${DOT}: a ${DOT} × ${DOT + 1} rectangle of ${DOT * (DOT + 1)} dots, split into two triangles of ${tri(DOT)}.` },
    { type: 'diagram', diagram: 'dots', spec: { width: 24 * 2 + DOT * 30, height: 24 * 2 + (DOT - 1) * 30, items: dotItems(DOT), label: 'A rectangle of dots split into two triangles' }, caption: `First colour: the triangle ${Array.from({ length: DOT }, (_, i) => i + 1).join(' + ')} = ${tri(DOT)}. Second colour: the same triangle flipped. Together: ${DOT} × ${DOT + 1} = ${DOT * (DOT + 1)}, so one triangle is ${DOT * (DOT + 1)} ÷ 2.` },
    { type: 'check', scope: 'T(m) = m(m + 1)/2', questions: [
      { make: (rng) => { const m = rng.int(8, 16); return num(`What is T(${m}) = ${m}(${m} + 1)/2?`, tri(m), `${m} × ${m + 1} / 2 = ${tri(m)}.`, ['Multiply m by m + 1.', 'Halve the product.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(T10.slice(0, 7), 2), predicted: true }, caption: `The ladder: gaps ${seq(g(T10.slice(0, 6)))} are the counting numbers, second row ${g(g(T10))[0]}. The gap into T(m) is m itself, so the gaps tell you where you are in the list.` },
    { type: 'check', scope: 'the gap tells you m', questions: [
      { type: 'number', q: 'The gap into a triangular number is 9. What is that triangular number?', answer: 45, explain: 'The gap into T(m) is m, so it is T(9) = 9 × 10 / 2 = 45.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'squares', say: 'Write the gaps. If they count up by 1 (4, 5, 6, 7), the terms are triangular numbers, possibly shifted.', why: 'T(m) − T(m − 1) = m: the gaps of the triangular list are exactly the counting numbers.',
        checks: [
          { make: (rng) => { const p = d1(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? What is the next gap?`, g(p.xs)[4], `Gaps ${seq(g(p.xs).slice(0, 4))} count by 1: next ${g(p.xs)[4]}.`); } },
        ] },
      { answers: 'position', say: 'Place the list: the gap into T(m) is m, so the last gap tells you which triangular number the last term is.', why: 'This is the position marker. It lets you use the formula without counting from the start.',
        checks: [
          { make: (rng) => { const p = d1(rng, 5), m = p.s + 4; return num(`${seq(p.xs)} are triangular numbers. The last one is T(m). What is m?`, m, `The last gap is ${g(p.xs)[3]}, and the gap into T(m) is m, so m = ${m}. Check: ${m} × ${m + 1} / 2 = ${tri(m)}.`, ['What is the last gap?', 'The gap into T(m) is m.']); } },
        ] },
      { answers: 'half-square', say: 'Next term = T(m + 1) = last + (m + 1), or directly (m + 1)(m + 2)/2.', why: 'Both routes agree; the addition is faster for the next term, the formula faster for a far one.',
        checks: [
          { make: (rng) => { const p = d1(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `The last term is T(${p.s + 4}); next T(${p.s + 5}) = ${p.xs[4]} + ${p.s + 5} = ${p.xs[5]}.`, ['The gaps count by 1.', 'Add the next counting number.']); } },
        ] },
      { say: 'Multiples and shifts: gaps k, 2k, 3k, … mean k × T. Divide the gaps by k to place m; the shift is c = term − k·T(m).', why: 'Multiplying the list by k multiplies every gap by k; adding c changes no gap at all.',
        checks: [
          { make: (rng) => { const p = d2(rng, 6), m = p.s + 5; return num(`${seq(p.xs.slice(0, 5))}, ? The gaps are multiples of ${p.k}. What comes next?`, p.xs[5], `Gaps ÷ ${p.k} = ${seq(g(p.xs).slice(0, 4).map((v) => v / p.k))}, so the terms are ${p.k} × T${shift(p.c)}. Next: ${p.k} × T(${m})${shift(p.c)} = ${p.k} × ${tri(m)}${shift(p.c)} = ${neg(p.xs[5])}.`, [`Divide each gap by ${p.k}: the counting numbers appear.`, `The next gap is ${p.k} × (next count).`]); } },
        ] },
      { say: 'A blank in the middle: the triangular numbers have no gaps in the list, so the blank is the one between its neighbours.', why: 'Read m from a neighbour, then the blank is T(m + 1).',
        checks: [
          { make: (rng) => { const p = d1(rng, 5), k = rng.int(2, 3); return num(`Which number replaces the question mark?  ${p.xs.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, p.xs[k], `${p.xs[k - 1]} = T(${p.s + k - 1}), so the blank is T(${p.s + k}) = ${p.xs[k]}; then ${p.xs[k]} + ${p.s + k + 1} = ${p.xs[k + 1]} checks.`, ['Which triangular number is just left of the blank?', 'The blank is the next one.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E3, 2), predicted: true }, caption: `A multiple with a shift: ${seq(E3.slice(0, 5))} has gaps ${seq(g(E3.slice(0, 5)))} (${E3k} × the counting numbers) and second row ${g(g(E3))[0]}. Divided by ${E3k} the gaps count ${seq(g(E3.slice(0, 5)).map((v) => v / E3k))}, so the terms are ${E3k} × T${shift(E3c)}, and the next is ${E3k} × ${tri(E3s + 5)}${shift(E3c)} = ${E3[5]}.` },
    { type: 'text', text: 'Order of work for the harder items: gaps first, then divide the gaps by their common factor k, then place m from the last divided gap, and only at the end compare one term with k × T(m) to find c. Guessing c first is guesswork; finding it last is one subtraction.' },
    { type: 'check', scope: 'a multiple with a shift', questions: [
      { type: 'number', q: 'What comes next?  4, 10, 18, 28, 40, ?', answer: 54, explain: 'Gaps 6, 8, 10, 12 are 2 × the counting numbers: the next gap is 14, so 40 + 14 = 54.' },
    ] },
    { type: 'explain', prompt: 'Why do two copies of the triangle make an m × (m + 1) rectangle, and why is the gap into T(m) exactly m?', model: 'Row r of the triangle has r dots; the flipped copy fills the remaining m + 1 − r places in that row, so every row has m + 1 dots and there are m rows. T(m) adds the counting numbers up to m, so going from T(m − 1) to T(m) adds just the last one, m.', points: ['Each row of the rectangle has m + 1 dots, m rows in all', 'Two triangles fill it, so T(m) = m(m + 1)/2', 'T(m) − T(m − 1) = m, the position marker'] },

    S('worked'),
    { type: 'worked', family: 'triangular', section: 'nl', difficulty: 1, seed: 'a', explainAt: [0], intro: 'Plain triangular numbers from somewhere in the list. Place m before opening the solution.' },
    { type: 'worked', family: 'triangular', section: 'nl', difficulty: 2, seed: 'b', fade: 1, intro: 'A multiple, often with a shift. The reading is given; the final step is yours.' },

    S('predict'),
    { type: 'predict', question: `Without computing exactly: is T(20) bigger or smaller than 15² = ${15 * 15}?`, answer: `Smaller: T(20) is about 20²/2 = ${20 * 20 / 2} (exactly 20 × 21 / 2 = ${tri(20)}), below ${15 * 15}.`, explain: 'T(m) is roughly half of m²: a quick size check that rules out options.' },

    S('traps'),
    { type: 'traps', family: 'triangular', section: 'nl', extra: [
      { belief: 'The next term is the next square.', fix: 'Triangular gaps count 2, 3, 4, …; square gaps are the odd numbers 3, 5, 7. Check the gap row.' },
      { belief: 'T(m) = m × m / 2.', fix: 'It is m × (m + 1) / 2: the rectangle is one dot wider than it is tall.' },
      { belief: 'Once the triangular part is found, the answer is k × T.', fix: 'Put the shift back: k × T(m) + c.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 5)))}, counting up by 1.`,
      `The last gap is ${ERRm}, so the last term is T(${ERRm}).`,
      `Next = T(${ERRm + 1}) = ${ERRm + 1} × ${ERRm + 1} / 2 = ${(ERRm + 1) ** 2 / 2}.`,
      `Answer: ${(ERRm + 1) ** 2 / 2}.`,
    ], errorStep: 2, explain: `T(${ERRm + 1}) = ${ERRm + 1} × ${ERRm + 2} / 2 = ${ERR[5]}: the formula uses m(m + 1), not m². The warning sign: ${(ERRm + 1) ** 2 / 2} is only ${(ERRm + 1) ** 2 / 2 - ERR[4]} above ${ERR[4]}, but the next gap must be ${ERRm + 1}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = rng.chance(0.5) ? d1(rng, 6) : d2(rng, 6), m = p.s + 5, l = p.xs[4]; const wrong = [[p.k * m * m + p.c, `used ${m}² instead of T(${m}) = ${m} × ${m + 1} / 2`], [p.xs[5] + p.k, 'added one step too many to the gap'], [l + (l - p.xs[3]), 'repeated the last gap; the gaps grow']]; if (p.c) wrong.push([p.k * tri(m), `found ${p.k} × T(${m}) but dropped the ${sgn(p.c)}`]); return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], wrong, `${p.k === 1 ? '' : `${p.k} × `}T(${m})${shift(p.c)} = ${neg(p.xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise ${seq(T10)}. Beyond them, halve whichever of m and m + 1 is even **before** multiplying: T(${H15}) = ${H15} × ${(H15 + 1) / 2} = ${tri(H15)}. Smaller numbers, fewer slips.` },
    { type: 'check', scope: 'halve first, then multiply', questions: [
      { make: (rng) => { const m = rng.int(15, 40); return num(`What is T(${m})?`, tri(m), `${m % 2 === 0 ? `${m / 2} × ${m + 1}` : `${m} × ${(m + 1) / 2}`} = ${tri(m)}.`, [`Which of ${m} and ${m + 1} is even?`, 'Halve that one, then multiply.']); } },
    ] },

    { type: 'callout', tone: 'speed', text: `Check with squares: two neighbouring triangular numbers add to a square, T(m − 1) + T(m) = m². For example ${tri(SQm - 1)} + ${tri(SQm)} = ${tri(SQm - 1) + tri(SQm)} = ${SQm}².` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps ${seq(TAg.slice(0, 4))} rise by ${TAk}. Divide by ${TAk}: ${seq(TAg.slice(0, 4).map((v) => v / TAk))}, the counting numbers. So ${TAk} × triangular.` },
      { t: 6, say: `The last divided gap is ${TAm}, so the last term sits at T(${TAm}). Next is T(${TAm + 1}) = ${TAm + 1} × ${TAm + 2} / 2 = ${tri(TAm + 1)}.` },
      { t: 10, say: `Answer ${TAk} × ${tri(TAm + 1)} = ${TAk * tri(TAm + 1)}.`, slip: true },
      { t: 12, say: `Wait, is it pure ${TAk} × T? ${TAk} × T(${TAm}) = ${TAk * tri(TAm)}, but the last term is ${TA[4]}: a shift of ${sgn(TAc)} I dropped.` },
      { t: 16, say: `${TAk * tri(TAm + 1)}${shift(TAc)} = ${TA[5]}. Gap check: ${TA[5]} − ${TA[4]} = ${TAg[4]} = ${TAk} × ${TAm + 1}. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: place m, then find the shift last', questions: [
      { make: (rng) => { let p; do p = d2(rng, 6); while (!p.c); const m = p.s + 5; return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Gaps ÷ ${p.k} count ${seq(g(p.xs).slice(0, 4).map((v) => v / p.k))}, so the last term is ${p.k} × T(${m - 1})${shift(p.c)}. Next: ${p.k} × ${tri(m)}${shift(p.c)} = ${neg(p.xs[5])}.`, ['Divide the gaps by their common factor to place m.', 'Compare one term with k × T(m) to find the shift.']); } },
    ] },
    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Gaps count 2, 3, 4, … (or k, 2k, 3k) → triangular numbers: the last gap is m, next = k × T(m + 1) + c with T(m) = m(m + 1)/2.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Second row', 'What it is'], rows: [
      [seq(T10.slice(0, 5)), seq(g(T10.slice(0, 5))), String(g(g(T10))[0]), 'triangular: m(m + 1)/2'],
      [seq(SQ), seq(g(SQ)), String(g(g(SQ))[0]), 'squares: m²'],
      [seq(PRON), seq(g(PRON)), String(g(g(PRON))[0]), 'm(m + 1) = 2 × triangular'],
      [seq(ADD), seq(g(ADD)), String(g(g(ADD))[0]), 'triangular shifted by a constant'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: 2 × T(m) = m(m + 1), so ${seq(E2.slice(0, 5))} is both "twice triangular" and "products of neighbours": the two readings give the same next term. T(0) = 0, so a list can start at 0. A shift c changes no gap, so read m from the gaps first.` },
    { type: 'variation', base: `${seq(E15)}, ?  T(3) to T(${E1m - 1}); next T(${E1m}) = ${E1[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E15.slice(1))}, ?`, effect: `Still ${E1[5]}. The last gap is still ${E1m - 1}, so the last term is still T(${E1m - 1}) and the next is T(${E1m}).` },
      { change: `Double every term: ${seq(DB.slice(0, 5))}, ?`, effect: `${DB[5]}. Gaps double to ${seq(g(DB.slice(0, 5)))}; halve them to place m. (This list is also ${E1m - 1} × ${E1m} read as neighbours multiplied.)` },
      { change: `Add 5 to every term: ${seq(UP5.slice(0, 5))}, ?`, effect: `${UP5[5]}. The gaps are unchanged, so m is read exactly as before; the 5 is put back at the end.` },
      { change: `Start later, at T(10): ${seq(LATE.slice(0, 5))}, ?`, effect: `${LATE[5]} = T(${10 + 5}). Same method; with bigger m the formula ${10 + 5} × ${10 + 6} / 2 beats adding up.` },
      { fusion: true, change: `Double every term, then add 5: ${seq(BOTH.slice(0, 5))}, ?`, effect: `${BOTH[5]}. Halve the gaps (${seq(g(BOTH.slice(0, 5)))}) to place m = ${E1m - 1}, then find the +5 last: 2 × ${E1[5]} + 5.` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2), s = rng.int(2, 6); const xs = t === 0 ? tr(s, 1, 0, 5) : t === 1 ? Array.from({ length: 5 }, (_, i) => (i + s) ** 2) : Array.from({ length: 5 }, (_, i) => (i + s) * (i + s + 1)); const names = ['triangular numbers m(m + 1)/2', 'square numbers m × m', 'products of neighbours m(m + 1)']; const trp = [[null, 'squares have odd gaps; these gaps count by 1', 'those have gaps rising by 2; these rise by 1'], ['triangular gaps count by 1; these gaps are odd numbers', null, 'products of neighbours have even gaps; these are odd'], ['these gaps rise by 2, twice the triangular gaps', 'squares have odd gaps; these are even', null]]; return pick(rng, `${seq(xs)}: which list?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
      { make: (rng) => { const m = rng.int(8, 20); return num(`T(${m - 1}) + T(${m}) = ?`, m * m, `Neighbouring triangular numbers add to a square: ${tri(m - 1)} + ${tri(m)} = ${m * m} = ${m}².`, ['Use the square check rather than two formulas.', `It is ${m}².`]); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: T(m − 1) = m(m − 1)/2 is the number of pairs among m people, "m choose 2" in counting problems. It is also the partial-sum pattern of the two-dice tent in Beat the Odds.' },
    { type: 'transfer',
      near: { make: (rng) => { const m = rng.int(12, 30); return num(`A shop stacks cans in a flat triangle: 1 can in the top row, and each row below has one more can. How many cans are in a stack with ${m} rows?`, tri(m), `A running total 1 + 2 + … + ${m} = T(${m}) = ${m} × ${m + 1} / 2 = ${tri(m)}.`, ['Rows hold 1, 2, 3, … cans.', `T(${m}) = ${m}(${m} + 1)/2: halve the even one first.`]); } },
      far: { make: (rng) => { const n = rng.pick([6, 8, 10, 12, 20]); return num(`Two fair ${n}-sided dice are thrown. In how many of the ${n * n} equally likely outcomes is the first die strictly lower than the second?`, tri(n - 1), `If the second die shows v, the first has v − 1 lower values: 0 + 1 + 2 + … + ${n - 1} = T(${n - 1}) = ${tri(n - 1)}.`, ['Fix the second die at 1, 2, 3, … and count the lower values for the first.', `The counts run 0, 1, 2, …, ${n - 1}: a running total.`]); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the cans and the dice?', options: [
        'a running total 1 + 2 + … + m = m(m + 1)/2',
        'a full square of side m, so m × m',
        'half a square of side m, so m × m ÷ 2',
        'a running total of odd numbers 1 + 3 + 5 + …',
      ], answer: 0, traps: { 1: 'the rows hold 1, 2, 3, … items, not m each: the triangle is half of a rectangle', 2: 'two triangles make an m by (m + 1) rectangle, one wider than tall, so it is m(m + 1) ÷ 2', 3: 'adding odd numbers builds squares; here each row adds one more than the row before' }, explain: 'Rows of cans and "first die lower" counts both add 1, 2, 3, …: a triangular number, m(m + 1)/2.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'triangular', section: 'nl', count: 3 },
  ],
};
