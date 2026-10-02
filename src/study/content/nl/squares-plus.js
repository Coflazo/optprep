// NumberLogic family lesson: squares, shifted or scaled. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, arith, geo, tri } from './method-ladder.js';

// term i = c * (s + m*i)^2 + k: the generator's parametrisation (m = 2 means odd bases).
const sq = (c, s, m, k, n) => Array.from({ length: n }, (_, i) => c * (s + m * i) ** 2 + k);
const bases = (s, m, n) => Array.from({ length: n }, (_, i) => s + m * i);
const g = (xs) => diffs(xs);

const CHs = 3, CHk = 2, CH = sq(1, CHs, 1, CHk, 6);
const E1s = 5, E1k = -3, E1 = sq(1, E1s, 1, E1k, 6);
const ODDs = 3, ODDk = 1, ODD = sq(1, ODDs, 2, ODDk, 6), ODDlast = ODDs + 8;
const SC = sq(2, 4, 1, -1, 6);
const PREDk = -1, PRED = sq(1, 1, 1, PREDk, 6);
const CUBE = Array.from({ length: 5 }, (_, i) => (i + 2) ** 3 + 1);
const PRON = Array.from({ length: 5 }, (_, i) => (i + 1) * (i + 2));
const TRI = Array.from({ length: 5 }, (_, i) => tri(i + 1));
const B10 = Array.from({ length: 10 }, (_, i) => i + 11);
const EXP = { a: 2, b: 3 };
const EXPv = 10 * EXP.a + EXP.b;

// Question pools matching the generator's two levels.
const d1 = (rng, n) => { const s = rng.int(1, 8), k = nz(rng, -6, 6); return { c: 1, s, m: 1, k, xs: sq(1, s, 1, k, n) }; };
const odd = (rng, n) => { const s = rng.int(0, 5) * 2 + 1, k = nz(rng, -4, 4); return { c: 1, s, m: 2, k, xs: sq(1, s, 2, k, n) }; };
const scaled = (rng, n) => { const s = rng.int(2, 10), k = nz(rng, -5, 5), c = rng.pick([2, 3]); return { c, s, m: 1, k, xs: sq(c, s, 1, k, n) }; };
const anyP = (rng, n) => [d1, odd, scaled][rng.int(0, 2)](rng, n);
const TA = sq(1, 5, 2, -2, 6), TAg = g(TA), TAb = bases(5, 2, 6), TAk = TAb[0] ** 2 - TA[0], TAs = TAg[1] - TAg[0];
const E15 = E1.slice(0, 5), KUP = sq(1, E1s, 1, 5, 6), OB = sq(1, E1s, 2, E1k, 6), SC2 = sq(2, E1s, 1, E1k, 6), OS2 = sq(2, E1s, 2, E1k, 6);
const READS = [[2, 'b² with the bases stepping by 1'], [8, 'b² with the bases stepping by 2'], [4, '2b² with the bases stepping by 1'], [6, '3b² with the bases stepping by 1']];
const READ_TRAP = { 2: 'bases stepping by 1 give a second row of 2', 8: 'bases two apart give a second row of 8', 4: 'a scale of 2 doubles the 2 to 4', 6: 'a scale of 3 triples the 2 to 6' };
const form = ({ c, k }) => `${c === 1 ? '' : `${c} × `}b² ${k < 0 ? '−' : '+'} ${Math.abs(k)}`;

export default {
  id: 'nl/squares-plus',
  book: 'nl',
  kind: 'family',
  family: 'squares-plus',
  title: 'Squares, shifted or scaled',
  summary: 'Terms sit a fixed distance from perfect squares: remove the constant, read the bases, square the next base.',
  prerequisites: ['nl/method-ladder', 'nl/second-diff'],
  objectives: [
    'Know the squares to 20² by sight and build any square to 30² in seconds',
    'Find the shift k by comparing each term with its square',
    'Handle odd bases (1, 9, 25, 49) and scaled squares (2b², 3b²)',
    'Cross-check with the second difference: 2 for b², 8 for odd bases, 2c for c·b²',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: the two-row ladder, and comparing each term with a perfect square.`, answer: String(CH[5]), explain: `Ladder: gaps ${seq(g(CH.slice(0, 5)))}, second difference ${g(g(CH))[0]}, next gap ${g(CH)[4]}, so ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. Squares: every term is ${CHk} more than ${seq(bases(CHs, 1, 5).map((b) => b * b))}, so the next is ${CHs + 5}² + ${CHk} = ${CH[5]}. Both work; the square read is faster once you see it.`,
      attempts: [
        { id: 'one-term', label: 'Match one term to a square', approach: `Noticed ${CH[3]} is close to 36 and built a guess on that one term.`, breaksAt: 'One term near a square proves nothing: the offset must be the same for every term before you trust the reading.' },
        { id: 'unshift', label: 'Shift the wrong way', approach: `Added ${CHk} to every term (${seq(CH.slice(0, 3).map((v) => v + CHk))}, …) and found no squares.`, breaksAt: `The terms sit ${CHk} above the squares, so take it off: ${CH[0]} − ${CHk} = ${CH[0] - CHk} = ${CHs}².` },
        { id: 'next-square', label: 'Answer the next square', approach: `Read the bases ${seq(bases(CHs, 1, 5))} and answered ${CHs + 5}² = ${(CHs + 5) ** 2}.`, breaksAt: `The constant belongs to every term, the next one included: ${(CHs + 5) ** 2} + ${CHk} = ${CH[5]}.` },
      ] },
    { type: 'text', text: `Every term is a perfect square **plus the same constant k**, or c times a square plus k. The bases of the squares count up by 1, or run through the odd numbers only. The shift is what hides them: ${seq(CH.slice(0, 3))} do not look square until you take ${CHk} off each.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(ODD.slice(0, 5))}, ?`, `What number comes next?  ${seq(SC.slice(0, 5))}, ?`] },
    { type: 'check', scope: 'the cue: a fixed distance from squares', questions: [
      { make: (rng) => { const p = d1(rng, 5), cu = Array.from({ length: 5 }, (_, i) => (i + rng.int(2, 4)) ** 3 + rng.int(-3, 3)), ar = arith(rng.int(1, 30), rng.int(3, 9), 5); return pick(rng, 'Which sequence is squares plus a constant?', seq(p.xs), [[seq(cu), 'those grow far faster: they sit next to cubes'], [seq(ar), `constant gap ${ar[1] - ar[0]}: squares have growing gaps`]], `${seq(p.xs)} is ${seq(bases(p.s, 1, 5).map((b) => b * b))} ${p.k < 0 ? 'minus' : 'plus'} ${Math.abs(p.k)}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: products of two neighbours like ${seq(PRON.slice(0, 4))} (factor them), and cubes, which outgrow squares fast (${seq(CUBE.slice(0, 4))}). Squares of primes or of Fibonacci numbers have their own lessons.` },
    { type: 'check', scope: 'the neighbouring lists', questions: [
      { type: 'choice', q: '2, 6, 12, 20, 30: which test settles it?', options: ['factor: 1 × 2, 2 × 3, 3 × 4', 'shift by a constant to reach squares', 'shift by a constant to reach cubes'], answer: 0, traps: { 1: 'no single constant turns these into squares', 2: 'cubes outgrow these fast' }, explain: 'Each term is a product of two neighbours, b(b + 1). Factor them.' },
    ] },

    S('why'),
    { type: 'text', text: 'Squares hide behind a small shift in many early and middle items. If you know the squares by sight, these become a two-second read: subtract, recognise, square the next base. The two-row ladder solves them too, but more slowly, so it becomes your check rather than your method. The same move, "subtract a constant to reveal a famous list", comes back for cubes, powers and primes.' },

    S('anchor'),
    { type: 'text', text: 'You know 1, 4, 9, 16, 25, 36 by sight. This family changes **one thing**: every square is moved by the same amount k (or multiplied by the same c first). Undo that one change and you are back to squares you know.' },
    { type: 'check', scope: 'reading a square back to its base', questions: [
      { make: (rng) => { const b = rng.int(6, 19), k = nz(rng, -6, 6); return num(`Each term is a square ${k < 0 ? 'minus' : 'plus'} ${Math.abs(k)}. Which base b is behind the term ${b * b + k}?`, b, `${b * b + k} ${k < 0 ? '+' : '−'} ${Math.abs(k)} = ${b * b} = ${b}².`, ['Undo the shift first.', 'Which number squared gives that?']); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Line the terms up against the squares of their bases. The last column, term minus square, is the same in every row: that constant is k. The ladder tells the same story from the other side: the gaps of b² are the odd numbers 2b + 1, so the second row is always 2, whatever k is.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['base b', 'b²', 'term', 'term − b²'], rows: bases(E1s, 1, 5).map((b, i) => [String(b), String(b * b), neg(E1[i]), neg(E1[i] - b * b)]) }, caption: `${seq(E1.slice(0, 5))} against the squares of ${seq(bases(E1s, 1, 5))}: the last column is ${neg(E1k)} in every row. Next: ${E1s + 5}² ${E1k < 0 ? '−' : '+'} ${Math.abs(E1k)} = ${E1[5]}.` },
    { type: 'check', scope: 'the constant column', questions: [
      { make: (rng) => { const p = d1(rng, 5); return num(`Each term of ${seq(p.xs)} is a square plus the same constant k. What is k? (It may be negative.)`, p.k, `${seq(p.xs)} minus ${seq(bases(p.s, 1, 5).map((b) => b * b))} is ${neg(p.k)} every time.`, ['Find the perfect square just below or above each term.', 'Term minus square, with its sign.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1, 2), predicted: true }, caption: `The ladder of the same sequence: gaps ${seq(g(E1.slice(0, 5)))} are consecutive odd numbers and the second row is ${g(g(E1))[0]}. A second difference of exactly 2 is the ladder's hint that a plain b² is inside.` },
    { type: 'check', scope: 'second row 2', questions: [
      { type: 'number', q: '11, 18, 27, 38, 51: what is the constant second row?', answer: 2, explain: 'Gaps 7, 9, 11, 13: second row 2, the hint that a plain b² is inside (here b² + 2).' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'one-term', say: 'Compare each term with the nearest perfect square. If every term sits the same distance k from a square, and the bases rise steadily, the shape is squares.', why: 'One term near a square proves nothing; a shared offset across all terms is the fingerprint.',
        checks: [
          { make: (rng) => { const p = d1(rng, 5); return num(`${seq(p.xs)}: what is k in "square + k"?`, p.k, `k = ${neg(p.xs[0])} − ${p.s}² = ${neg(p.k)}, and the same for every term.`, ['Subtract the nearest square from the first term.', 'Check the same k works for the others.']); } },
        ] },
      { answers: 'unshift', say: 'Subtract k from every term to reveal the squares, then read their bases.', why: 'Undoing the shift turns an unfamiliar list into a list you know by sight.',
        checks: [
          { make: (rng) => { const p = d1(rng, 5); return num(`${seq(p.xs)} is b² ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)}. What is the base b of the **last** term?`, p.s + 4, `${neg(p.xs[4])} ${p.k < 0 ? '+' : '−'} ${Math.abs(p.k)} = ${(p.s + 4) ** 2} = ${p.s + 4}².`); } },
        ] },
      { say: 'The bases rise by a fixed step: 1 for consecutive squares, 2 for odd (or even) bases only. Next base = last base + step.', why: 'The base list is itself a constant-gap sequence, so continuing it is the first lesson again.',
        checks: [
          { make: (rng) => { const p = odd(rng, 5); return num(`${seq(p.xs)} is b² ${p.k < 0 ? '−' : '+'} ${Math.abs(p.k)}. What is the next base?`, p.s + 10, `Bases ${seq(bases(p.s, 2, 5))} step by 2 (odd numbers): next ${p.s + 10}.`, [`Subtract ${neg(p.k)} and take square roots.`, 'How far apart are neighbouring bases?']); } },
        ] },
      { answers: 'next-square', say: 'Next term = (next base)² + k.', why: 'Both parts continue independently: the base list by its step, the constant unchanged.',
        checks: [
          { make: (rng) => { const p = rng.chance(0.5) ? d1(rng, 6) : odd(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `${form(p)} for b = ${seq(bases(p.s, p.m, 5))}: next ${p.s + 5 * p.m}² ${sgn(p.k)} = ${neg(p.xs[5])}.`, ['Remove the constant and read the bases.', 'Square the next base, then put the constant back.']); } },
        ] },
      { say: 'Scaled squares: a second difference of 2c (not 2) means c × squares. Divide by c to find the bases, then k = term − c·b².', why: 'Multiplying every term by c multiplies every ladder row by c, so the second row shows c directly.',
        checks: [
          { make: (rng) => { const p = scaled(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? The second difference is ${2 * p.c}, so the terms are ${p.c}b² + k. What comes next?`, p.xs[5], `Bases ${seq(bases(p.s, 1, 5))}, k = ${neg(p.xs[0])} − ${p.c} × ${p.s * p.s} = ${neg(p.k)}. Next: ${p.c} × ${(p.s + 5) ** 2} ${sgn(p.k)} = ${neg(p.xs[5])}.`, [`Divide each term by ${p.c}: which squares are close?`, `k = term − ${p.c} × b², then use the next base.`]); } },
        ] },
      { say: 'A blank in the middle: find k from the terms you can see, read the bases on either side, and fill in the base between them.', why: 'The base list has no gaps, so the missing base is the one between its neighbours.',
        checks: [
          { make: (rng) => { const p = d1(rng, 5), k = rng.int(2, 3); return num(`Which number replaces the question mark?  ${p.xs.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, p.xs[k], `k = ${neg(p.k)}; bases ${seq(bases(p.s, 1, 5))}; the blank is ${p.s + k}² ${sgn(p.k)} = ${neg(p.xs[k])}.`, ['Find k from the shown terms.', 'Which base is missing?']); } },
        ] },
    ] },
    { type: 'text', text: 'Which reading to try first? Let the second difference choose. A second row of 2 means plain consecutive squares; 8 means the bases step by 2 (odd or even bases); 4 or 6 means a scale of 2 or 3 on consecutive squares. One subtraction layer more than usual, and you know exactly what you are looking for before you look.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(ODD, 2), predicted: true }, caption: `Odd bases: ${seq(ODD.slice(0, 5))} is b² + ${ODDk} for b = ${seq(bases(ODDs, 2, 5))}. The second row is ${g(g(ODD))[0]}, not 2: with bases two apart, each gap grows by ${g(g(ODD))[0]}. Next: ${ODDlast + 2}² + ${ODDk} = ${ODD[5]}.` },
    { type: 'check', scope: 'let the second row choose', questions: [
      { type: 'choice', q: 'The second row of a squares-type ladder is 8. What does it say?', options: ['the bases step by 2', 'plain consecutive squares', 'a scale of 3 on the squares'], answer: 0, traps: { 1: 'plain consecutive squares give 2', 2: 'a scale of 3 gives 6' }, explain: 'With bases two apart, each gap grows by 8.' },
    ] },
    { type: 'explain', prompt: 'Why does subtracting the same k from every term leave the gaps unchanged, and why is the second difference of b² always 2?', model: 'A constant shift moves every term equally, so every difference between neighbours stays the same. The gap from b² to (b + 1)² is 2b + 1, which grows by 2 each time b grows by 1, so the second row is 2.', points: ['A shift cancels in every subtraction', 'Consecutive squares differ by 2b + 1', 'That gap grows by 2 per step, so the second difference is 2 (8 for odd bases, 2c for c·b²)'] },

    S('worked'),
    { type: 'worked', family: 'squares-plus', section: 'nl', difficulty: 1, seed: 'a', explainAt: [0], intro: 'Consecutive squares with a shift. Find k before opening the solution.' },
    { type: 'worked', family: 'squares-plus', section: 'nl', difficulty: 2, seed: 'b', fade: 1, intro: 'Odd bases or a scale factor. The reading is given; the final step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 5))}, ? Predict k first, then the next term.`, answer: `k = ${neg(PREDk)}: these are ${seq(bases(1, 1, 5).map((b) => b * b))} minus ${-PREDk}, so the next is 6² − ${-PREDk} = ${PRED[5]}.`, explain: '0 is a square too (0 = 1² − 1 here): a term of 0 or 3 at the start is a strong hint.' },

    S('traps'),
    { type: 'traps', family: 'squares-plus', section: 'nl', extra: [
      { belief: 'The next term is just the next square.', fix: 'You found the base; now put the constant back: (next base)² + k.' },
      { belief: 'k = square − term.', fix: 'k = term − square. A term above its square has positive k.' },
      { belief: 'With odd bases, the next base is last base + 1.', fix: 'Odd bases step by 2: after 11 comes 13.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ODD.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Subtract ${ODDk}: ${seq(bases(ODDs, 2, 5).map((b) => b * b))}.`,
      `The bases are ${seq(bases(ODDs, 2, 5))}.`,
      `The next base is ${ODDlast + 1}.`,
      `Next term: ${ODDlast + 1}² + ${ODDk} = ${(ODDlast + 1) ** 2 + ODDk}.`,
    ], errorStep: 2, explain: `The bases are odd numbers, two apart: the next base is ${ODDlast + 2}, so the next term is ${ODDlast + 2}² + ${ODDk} = ${ODD[5]}. Using ${ODDlast + 1} treats the bases as counting by 1.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = rng.chance(0.6) ? d1(rng, 6) : odd(rng, 6), b = p.s + 5 * p.m, l = p.xs[4]; return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], [[b * b, `found ${b}² but dropped the constant ${sgn(p.k)}`], [(b + p.m) ** 2 + p.k, `skipped a base: used ${b + p.m}² instead of ${b}²`], [b * b - p.k, 'applied the constant with the wrong sign'], [l + (l - p.xs[3]), 'repeated the last gap; the gaps of squares grow']], `${form(p)}: ${b}² ${sgn(p.k)} = ${neg(p.xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Learn 11² to 30² cold (table below). To build one you forgot: (10a + b)² = 100a² + 20ab + b², so ' + `${EXPv}² = ${100 * EXP.a ** 2} + ${20 * EXP.a * EXP.b} + ${EXP.b ** 2} = ${EXPv ** 2}.` },
    { type: 'check', scope: 'building a square', questions: [
      { type: 'number', q: 'Build 34² with (10a + b)² = 100a² + 20ab + b².', answer: 1156, explain: '900 + 240 + 16 = 1156.' },
    ] },
    { type: 'callout', tone: 'speed', text: `Neighbouring squares differ by 2b + 1: the next square is last square + 2 × last base + 1. From 24² = ${24 * 24}, 25² = ${24 * 24} + ${2 * 24 + 1} = ${25 * 25}. That is also the next gap of any "square + k" sequence.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps ${seq(TAg.slice(0, 4))} grow; second row ${seq(diffs(TAg.slice(0, 4)))}. Squares, bases two apart.` },
      { t: 6, say: `Near squares: ${seq(TAb.slice(0, 5).map((b) => b * b))}, each ${TAk} more than the term. So term = b² − ${TAk} with b = ${seq(TAb.slice(0, 5))}.` },
      { t: 12, say: `Next base ${TAb[4] + 1}: ${TAb[4] + 1}² − ${TAk} = ${(TAb[4] + 1) ** 2 - TAk}.`, slip: true },
      { t: 15, say: `No: the bases are odd, two apart, as the ${TAs} said. Next base ${TAb[5]}.` },
      { t: 19, say: `${TAb[5]}² = ${TAb[5] ** 2}, minus ${TAk} is ${TA[5]}. Gap check: ${TA[5]} − ${TA[4]} = ${TAg[4]} = ${TAg[3]} + ${TAs}. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: let the second row choose the reading', questions: [
      { make: (rng) => { const t = rng.int(0, 3), [v, right] = READS[t]; return pick(rng, `A list of squares plus a constant has second row ${v}, ${v}, ${v}. Which reading fits?`, right, READS.filter((_, i) => i !== t).map(([w, r]) => [r, READ_TRAP[w]]), `Consecutive squares give 2; bases two apart give 8; a scale c multiplies the 2 by c. So ${v} means ${right}.`); } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['b', 'b²', 'b', 'b²'], rows: B10.map((b) => [String(b), String(b * b), String(b + 10), String((b + 10) ** 2)]) }, caption: 'Squares from 11² to 30². Knowing these by sight turns most items in this family into a subtraction.' },
    { type: 'check', scope: 'the next square = square + 2b + 1', questions: [
      { make: (rng) => { const b = rng.int(15, 29); return num(`${b}² = ${b * b}. What is ${b + 1}²?`, (b + 1) ** 2, `${b * b} + 2 × ${b} + 1 = ${(b + 1) ** 2}.`, ['Neighbouring squares differ by 2b + 1.', `Add ${2 * b + 1}.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Terms near squares → subtract the constant (divide by any scale), read the bases, square the next base, add the constant back.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Second difference', 'Read it as'], rows: [
      [seq(E1.slice(0, 5)), String(g(g(E1))[0]), 'b² + k (this lesson)'],
      [seq(ODD.slice(0, 5)), String(g(g(ODD))[0]), 'odd bases: b² + k with b stepping by 2'],
      [seq(PRON), String(g(g(PRON))[0]), 'b(b + 1): factor into neighbours'],
      [seq(TRI), String(g(g(TRI))[0]), 'triangular numbers'],
      [seq(CUBE), 'not constant', 'cubes + k: a third row is needed'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: k can be negative and a term can be 0 (0 = 1² − 1). b(b + 2) is (b + 1)² − 1, so ${seq(Array.from({ length: 4 }, (_, i) => (i + 1) * (i + 3)))} can be read either way and gives the same answer. A scale c shows up as second difference 2c.` },
    { type: 'variation', base: `${seq(E15)}, ?  b² − ${-E1k} for b = ${seq(bases(E1s, 1, 5))}; next ${E1s + 5}² − ${-E1k} = ${E1[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E15.slice(1))}, ?`, effect: `Still ${E1[5]}. Every remaining term is still b² − ${-E1k}, and the next base is still ${E1s + 5}.` },
      { change: `Shift by +5 instead of −${-E1k}: ${seq(KUP.slice(0, 5))}, ?`, effect: `${KUP[5]}. Same bases, same squares; only the constant you put back changes.` },
      { change: `Odd bases ${seq(bases(E1s, 2, 5))}: ${seq(OB.slice(0, 5))}, ?`, effect: `${OB[5]}. The second row becomes ${g(g(OB))[0]} and the next base is ${E1s + 10}, not ${E1s + 5}.` },
      { change: `Scale by 2: ${seq(SC2.slice(0, 5))}, ?`, effect: `${SC2[5]}. The second row doubles to ${g(g(SC2))[0]}; next = 2 × ${(E1s + 5) ** 2} − ${-E1k}.` },
      { fusion: true, change: `Odd bases and scale 2: ${seq(OS2.slice(0, 5))}, ?`, effect: `${OS2[5]}. The two changes multiply in the second row: bases two apart give 8, the scale doubles it to ${g(g(OS2))[0]}; next = 2 × ${E1s + 10}² − ${-E1k}.` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2), s = rng.int(2, 6), k = nz(rng, -4, 4); const xs = t === 0 ? sq(1, s, 1, k, 5) : t === 1 ? sq(1, s * 2 - 1, 2, k, 5) : Array.from({ length: 5 }, (_, i) => (i + s) ** 3 + k); const names = ['consecutive squares + k', 'odd-base squares + k', 'cubes + k']; const tr = [[null, 'the bases count by 1: second difference 2, not 8', 'the growth is too slow for cubes'], ['the second difference is 8, so the bases step by 2', null, 'the growth is too slow for cubes'], ['the gaps grow faster than squares allow', 'the second row is not constant', null]]; return pick(rng, `${seq(xs)}: which reading fits?`, names[t], names.map((nm, i) => [nm, tr[t][i]]).filter((_, i) => i !== t), `Second row: ${seq(g(g(xs)))}.`); } },
      { make: (rng) => { const p = odd(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Odd bases ${seq(bases(p.s, 2, 5))}: next ${p.s + 10}² ${sgn(p.k)} = ${neg(p.xs[5])}.`, ['Remove the constant: which squares?', 'The bases step by 2.']); } },
    ] },

    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: subtract a constant to reveal a famous list. The same move uncovers powers of 2 (${seq(geo(2, 2, 4).map((v) => v + 1))} is 2ⁿ + 1), cubes and primes shifted by a constant.` },
    { type: 'transfer',
      near: { make: (rng) => { const s = rng.int(18, 24), k = nz(rng, -9, 9), xs = sq(1, s, 1, k, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `These are ${s}² to ${s + 4}² ${k < 0 ? 'minus' : 'plus'} ${Math.abs(k)}. The next gap is 2 × ${s + 4} + 1 = ${2 * (s + 4) + 1}, so ${xs[4]} + ${2 * (s + 4) + 1} = ${xs[5]} = ${s + 5}² ${k < 0 ? '−' : '+'} ${Math.abs(k)}.`, ['Which squares sit a fixed distance from these terms?', 'The next gap between squares is 2 × last base + 1.']); } },
      far: { make: (rng) => { const k = rng.int(3, 6); return num(`Two fair dice are thrown. The larger of the two faces is at most ${k} in ${k}² = ${k * k} of the 36 outcomes. In how many outcomes is the larger face exactly ${k}?`, 2 * k - 1, `Exactly ${k} = at most ${k} minus at most ${k - 1}: ${k * k} − ${(k - 1) ** 2} = ${2 * k - 1}, which is 2 × ${k - 1} + 1, the gap between neighbouring squares.`, [`"Exactly ${k}" = "at most ${k}" minus "at most ${k - 1}".`, `${k}² − ${k - 1}².`]); } },
      principle: { type: 'choice', q: 'Which idea carried over from the shifted squares to the dice?', options: [
        'neighbouring squares differ by 2b + 1',
        'neighbouring squares differ by the same amount',
        'the next square is the last square plus b',
        'each square is the sum of the two squares before it',
      ], answer: 0, traps: { 1: 'the gap 2b + 1 grows with b; only the second difference is constant', 2: 'you add 2b + 1, not b: 5² − 4² is 9, not 5', 3: 'that is the Fibonacci rule; squares grow by the odd numbers' }, explain: 'The next gap of a "square + k" list and the count of "larger face exactly k" are both (b + 1)² − b² = 2b + 1.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'squares-plus', section: 'nl', count: 3 },
  ],
};
