// NumberLogic family lesson: cubes, shifted (b³ + k, or b³ ± b + k). Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, fair, num, geo } from './method-ladder.js';

// term i = (s + i)³ + lin·(s + i) + k: the generator's parametrisation.
const cu = (s, k, lin, n) => Array.from({ length: n }, (_, i) => (i + s) ** 3 + lin * (i + s) + k);
const bases = (s, n) => Array.from({ length: n }, (_, i) => i + s);
const g = (xs) => diffs(xs);
const form = ({ k, lin }) => `b³${lin ? ` ${lin < 0 ? '−' : '+'} b` : ''} ${k < 0 ? '−' : '+'} ${Math.abs(k)}`;
const at = ({ k, lin }, b) => b ** 3 + lin * b + k;

const CHs = 1, CHk = -1, CH = cu(CHs, CHk, 0, 6);
const E1s = 2, E1k = 1, E1 = cu(E1s, E1k, 0, 6);
const E2s = 3, E2k = -5, E2 = cu(E2s, E2k, 0, 6);
const E3 = { s: 2, k: -3, lin: 1 }, E3x = cu(E3.s, E3.k, E3.lin, 6);
const P3s = 2, P3 = cu(P3s, 0, -1, 6);
const SQ = Array.from({ length: 5 }, (_, i) => (i + 2) ** 2 + 1);
const PW = geo(2, 2, 5).map((v) => v + 1);
const CUBES = Array.from({ length: 12 }, (_, i) => (i + 1) ** 3);

const d2 = (rng, n) => { const s = rng.int(1, 6), k = nz(rng, -9, 9); return { s, k, lin: 0, xs: cu(s, k, 0, n) }; };
const d3 = (rng, n) => { const s = rng.int(1, 7), k = rng.int(-9, 9), lin = rng.pick([-1, 1]); return { s, k, lin, xs: cu(s, k, lin, n) }; };
const anyP = (rng, n) => (rng.chance(0.5) ? d2(rng, n) : d3(rng, n));
const TA = { s: 3, k: 2, lin: 1 }, TAx = cu(TA.s, TA.k, TA.lin, 6), TAl = TAx.map((v, i) => v - (TA.s + i) ** 3), TAb = TA.s + 5;
const E25 = E2.slice(0, 5), KUP = cu(E2s, 4, 0, 6), LIN = cu(E2s, E2k, 1, 6), LB = 5, LATE = cu(LB, E2k, 0, 6), BOTH = cu(LB, E2k, 1, 6);
const pmk = (k) => (k < 0 ? `− ${-k}` : `+ ${k}`);
const leftovers = (p, n) => p.xs.slice(0, n).map((v, i) => v - (p.s + i) ** 3);

export default {
  id: 'nl/cubes-plus',
  book: 'nl',
  kind: 'family',
  family: 'cubes-plus',
  title: 'Cubes, shifted',
  summary: 'Terms near cubes: subtract b³ from each term, read the leftover (a constant, or ±b plus a constant), cube the next base.',
  prerequisites: ['nl/method-ladder', 'nl/squares-plus'],
  objectives: [
    `Know the cubes ${seq(CUBES)} by sight`,
    'Line the terms up against cubes and read the leftover rule',
    'Handle a leftover that moves with the base (b³ ± b + k)',
    'Use a constant third difference of 6 as the ladder check',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: the difference ladder (as many rows as it takes), and comparing each term with a famous list.`, answer: String(CH[5]), explain: `Ladder: gaps ${seq(g(CH.slice(0, 5)))}, then ${seq(g(g(CH.slice(0, 5))))}, then ${seq(g(g(g(CH.slice(0, 5)))))}: three rows to settle. Famous list: each term is ${neg(CHk)} from ${seq(bases(CHs, 5).map((b) => b ** 3))}, the cubes, so the next is ${CHs + 5}³ ${sgn(CHk)} = ${CH[5]}.`,
      attempts: [
        { id: 'squares', label: 'Read them as squares', approach: `Looked for squares near ${seq(CH.slice(1, 4))} (${seq(CH.slice(1, 4).map((v) => Math.round(Math.sqrt(v)) ** 2))}) and tried a "square + k" rule.`, breaksAt: `The growth outruns squares: the terms sit next to the cubes ${seq(bases(CHs + 1, 3).map((b) => b ** 3))}.` },
        { id: 'one-term', label: 'Match one term only', approach: `Saw ${CH[3]} next to ${(CHs + 3) ** 3} and built a guess on that one term.`, breaksAt: 'One term near a cube proves nothing. Only a leftover column with a simple rule in every row proves the reading.' },
        { id: 'next-cube', label: 'Answer the next cube', approach: `Spotted the cubes and answered ${CHs + 5}³ = ${(CHs + 5) ** 3}.`, breaksAt: `Every term sits ${Math.abs(CHk)} ${CHk < 0 ? 'below' : 'above'} its cube, so the constant goes back on: ${(CHs + 5) ** 3} ${pmk(CHk)} = ${CH[5]}.` },
      ] },
    { type: 'text', text: `The terms grow faster than squares but with no fixed ratio. Each is a **cube plus a small constant k**, or a cube plus or minus its own base plus k. Numbers such as ${seq(E1.slice(0, 4))} sit right next to ${seq(bases(E1s, 4).map((b) => b ** 3))}.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3x.slice(0, 5))}, ?`] },
    { type: 'check', scope: 'the cue: terms next to cubes', questions: [
      { make: fair((rng) => { const p = d2(rng, 5), s = rng.int(2, 6), q = Array.from({ length: 5 }, (_, i) => (i + s) ** 2 + rng.int(-3, 3)), pw = geo(rng.int(1, 3), 2, 5).map((v) => v + rng.int(1, 5)); return pick(rng, 'Which sequence is cubes plus a constant?', seq(p.xs), [[seq(q), 'too slow for cubes: those sit next to squares'], [seq(pw), `its gaps ${seq(g(pw))} double: powers of 2`]], `${seq(p.xs)} is ${seq(bases(p.s, 5).map((b) => b ** 3))} ${p.k < 0 ? 'minus' : 'plus'} ${Math.abs(p.k)}.`); }) },
    ] },
    { type: 'text', text: `Not this lesson: squares plus a constant (${seq(SQ)}, growth too slow, second row constant) and powers of 2 plus a constant (${seq(PW)}, gaps that double).` },
    { type: 'check', scope: 'the neighbouring lists', questions: [
      { type: 'choice', q: '3, 5, 9, 17, 33: which rule fits?', options: ['powers of 2 plus 1: gaps double', 'cubes plus a small constant', 'squares plus a constant: odd gaps'], answer: 0, traps: { 1: 'cube gaps run 7, 19, 37: they do not double', 2: 'square gaps rise by 2; these double' }, explain: 'Gaps 2, 4, 8, 16 double: 2^n + 1.' },
    ] },

    S('why'),
    { type: 'text', text: 'Cubes appear in middle items, usually shifted by a small constant. The difference ladder does find them, but it needs three rows and at least five terms, which costs time and invites slips. Knowing the cubes to 12³ turns the item into a lookup and one subtraction, with the ladder kept as a check.' },

    S('anchor'),
    { type: 'text', text: 'You met squares shifted by a constant: b² + k. This family changes **one thing**: the power is 3 instead of 2. The method is the same: undo the shift, read the bases, move to the next base, put the shift back.' },
    { type: 'check', scope: 'reading a cube back to its base', questions: [
      { make: (rng) => { const b = rng.int(3, 11), k = nz(rng, -9, 9); return num(`Each term is a cube ${k < 0 ? 'minus' : 'plus'} ${Math.abs(k)}. Which base b is behind the term ${b ** 3 + k}?`, b, `${b ** 3 + k} ${k < 0 ? '+' : '−'} ${Math.abs(k)} = ${b ** 3} = ${b}³.`, ['Undo the shift first.', 'Which whole number cubed gives that?']); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Line the terms up against consecutive cubes. The last column, term minus cube, is the leftover. For a plain shift it is the same number in every row.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['base b', 'b³', 'term', 'term − b³'], rows: bases(E2s, 5).map((b, i) => [String(b), String(b ** 3), neg(E2[i]), neg(E2[i] - b ** 3)]) }, caption: `${seq(E2.slice(0, 5))} against ${seq(bases(E2s, 5).map((b) => b ** 3))}: the leftover is ${neg(E2k)} in every row. Next: ${E2s + 5}³ ${sgn(E2k)} = ${E2[5]}.` },
    { type: 'check', scope: 'the leftover column', questions: [
      { make: (rng) => { const p = d2(rng, 5); return num(`Each term of ${seq(p.xs)} is a cube plus the same k. What is k?`, p.k, `${neg(p.xs[0])} − ${p.s}³ = ${neg(p.k)}, and the same for every term.`, ['Find the cube nearest the first term.', 'Term minus cube, with its sign.']); } },
    ] },
    { type: 'text', text: 'The ladder view: the gaps of b³ grow, their gaps grow too (6b), and only the third row is flat, at 6. A constant shift k never touches any row below the terms.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1, 3), predicted: true }, caption: `${seq(E1.slice(0, 5))}: three rows down, the third is ${g(g(g(E1)))[0]}. Climbing back: ${g(g(g(E1)))[0]}, then ${g(g(E1))[2]} + ${g(g(g(E1)))[0]} = ${g(g(E1))[3]}, then ${g(E1)[3]} + ${g(g(E1))[3]} = ${g(E1)[4]}, then ${E1[4]} + ${g(E1)[4]} = ${E1[5]}. It works, but the cube read is faster.` },
    { type: 'check', scope: 'the three-row ladder', questions: [
      { make: (rng) => { const p = d2(rng, 6), r2 = g(g(p.xs)); return num(`The second row of the ladder for ${seq(p.xs.slice(0, 5))} is ${seq(r2.slice(0, 3))}. The third row is 6 every time. What is the next entry of the second row?`, r2[3], `${r2[2]} + 6 = ${r2[3]}.`, ['The third row is the gaps of the second row.', 'Add 6 to the last entry.']); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'squares', say: 'Growth that outruns squares but has no fixed ratio: line the terms up against consecutive cubes. The first term tells you the starting base.', why: 'Cubes grow like b³: each is roughly (1 + 1/b)³ times the last, so the ratios fall steadily instead of staying fixed.',
        checks: [
          { make: (rng) => { const p = d2(rng, 5); return num(`${seq(p.xs)}: which base b has the cube nearest the first term?`, p.s, `${p.s}³ = ${p.s ** 3}, next to ${neg(p.xs[0])}.`); } },
        ] },
      { answers: 'one-term', say: 'Subtract each cube from its term. That column is the leftover.', why: 'Removing the cube isolates whatever the rule adds on top of it.',
        checks: [
          { make: (rng) => { const p = d3(rng, 5), b = p.s + 2; return num(`${seq(p.xs)} starts at base ${p.s}. What is the leftover of the third term, term − ${b}³?`, p.xs[2] - b ** 3, `${neg(p.xs[2])} − ${b ** 3} = ${neg(p.xs[2] - b ** 3)}.`); } },
        ] },
      { say: 'Read the leftover rule: the same number every time (a constant k), or a number that moves by 1 each step (±b + k).', why: 'The leftover must follow its own simple rule. If it rises or falls by exactly 1 per step, the base itself is being added or subtracted.',
        checks: [
          { make: (rng) => { const p = rng.chance(0.5) ? d2(rng, 5) : d3(rng, 5), lo = leftovers(p, 5); const moving = p.lin !== 0; return pick(rng, `${seq(p.xs)}: the leftovers after subtracting cubes are ${seq(lo)}. Which leftover rule?`, moving ? 'the base itself, ± b, plus a constant' : 'a fixed constant k on every row', [[moving ? 'a fixed constant k on every row' : 'the base itself, ± b, plus a constant', moving ? `the leftovers ${seq(lo)} change by 1 each step` : `every leftover is ${neg(lo[0])}`]], `Leftovers: ${seq(lo)}.`); } },
        ] },
      { answers: 'next-cube', say: 'Next term = (next base)³ + the leftover rule at the next base.', why: 'Both parts continue independently: the base by 1, the leftover by its own rule.',
        checks: [
          { make: (rng) => { const p = d2(rng, 6), b = p.s + 5; return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `${form(p)}: ${b}³ ${sgn(p.k)} = ${neg(p.xs[5])}.`, ['Subtract the nearest cubes.', 'Cube the next base, then add the constant back.']); } },
          { make: (rng) => { const p = d3(rng, 7), b = p.s + 6; return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Leftovers ${seq(leftovers(p, 6))} move by ${p.lin} each step; next ${b}³ ${p.lin < 0 ? '−' : '+'} ${b} ${sgn(p.k)} = ${neg(p.xs[6])}.`, ['Subtract the cubes and look at the leftovers.', 'Continue the leftovers by their step, then add the next cube.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['base b', 'b³', 'term', 'leftover'], rows: bases(E3.s, 5).map((b, i) => [String(b), String(b ** 3), neg(E3x[i]), neg(E3x[i] - b ** 3)]) }, caption: `${seq(E3x.slice(0, 5))} is ${form(E3)}: the leftovers ${seq(E3x.slice(0, 5).map((v, i) => v - (E3.s + i) ** 3))} rise by 1, exactly as b does. Next: ${E3.s + 5}³ + ${E3.s + 5} ${sgn(E3.k)} = ${E3x[5]}.` },
    { type: 'text', text: `Why test writers add ± b: it breaks the constant leftover you are looking for, so a hurried candidate who subtracts the cubes, sees leftovers like ${seq(E3x.slice(0, 4).map((v, i) => v - (E3.s + i) ** 3))} and gives up. A leftover that climbs or falls by exactly one per step is not noise; it is the base itself. Continue it one more step, then add it to the next cube. Nothing else about the method changes.` },
    { type: 'check', scope: 'a leftover that climbs', questions: [
      { type: 'choice', q: 'You subtract the cubes and the leftovers read 4, 5, 6, 7. What does that mean?', options: ['the base is in the rule: continue it', 'it is noise: give up on cubes', 'the leftover is a constant 4'], answer: 0, traps: { 1: 'a leftover that moves by exactly 1 is the base itself', 2: '4, 5, 6, 7 changes every step' }, explain: 'Continue the leftover one step (8) and add it to the next cube.' },
    ] },
    { type: 'explain', prompt: 'Why does subtracting cubes expose the rule faster than the three-row ladder, and why does a leftover that rises by 1 each step mean "+ b"?', model: 'Subtracting the cubes removes the fast-growing part in one move, leaving a leftover you can read at a glance, while the ladder needs three rounds of subtraction. The base b goes up by 1 from term to term, so a leftover that also goes up by 1 each step is b plus a fixed constant.', points: ['One subtraction per term removes the cube', 'The ladder needs three rows (third difference 6)', 'A leftover that moves by 1 per step is ± b + constant'] },

    S('worked'),
    { type: 'worked', family: 'cubes-plus', section: 'nl', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Cubes plus a constant. Find the leftover before opening the solution.' },
    { type: 'worked', family: 'cubes-plus', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'The leftover moves with the base. The reading is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(P3.slice(0, 5))}, ? Before any table: what are these numbers, and what comes next?`, answer: `Products of three neighbours (1 × 2 × 3, 2 × 3 × 4, …), which is b³ − b: next ${P3s + 5}³ − ${P3s + 5} = ${P3[5]}.`, explain: 'b³ − b = (b − 1) × b × (b + 1): a cube family in disguise.' },

    S('traps'),
    { type: 'traps', family: 'cubes-plus', section: 'nl', extra: [
      { belief: 'The next term is the next cube.', fix: 'Put the leftover back: (next base)³ + k.' },
      { belief: 'A leftover that changes means it is not cubes.', fix: 'If it changes by exactly 1 per step, the base is being added or subtracted: b³ ± b + k.' },
      { belief: 'The gaps grow fast, so square the next base.', fix: 'Squares grow far more slowly; compare with the cube list.' },
    ] },
    { type: 'text', text: 'Almost every wrong option here comes from one of four slips: dropping the constant, squaring instead of cubing, skipping a base, or freezing a leftover that should move. Each fails a one-line test against a shown term, so test your answer against the last shown term before choosing it.' },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(E3x.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Subtract the cubes ${seq(bases(E3.s, 5).map((b) => b ** 3))}: leftovers ${seq(E3x.slice(0, 5).map((v, i) => v - (E3.s + i) ** 3))}.`,
      `The last leftover is ${E3x[4] - (E3.s + 4) ** 3}.`,
      `So the next term is ${E3.s + 5}³ + ${E3x[4] - (E3.s + 4) ** 3} = ${(E3.s + 5) ** 3 + E3x[4] - (E3.s + 4) ** 3}.`,
      `Answer: ${(E3.s + 5) ** 3 + E3x[4] - (E3.s + 4) ** 3}.`,
    ], errorStep: 2, explain: `The leftover moves by 1 each step, so at the next base it is ${E3x[5] - (E3.s + 5) ** 3}, not ${E3x[4] - (E3.s + 4) ** 3}: next term ${E3.s + 5}³ + ${E3x[5] - (E3.s + 5) ** 3} = ${E3x[5]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = anyP(rng, 6), n = p.lin ? 6 : 5, b = p.s + n; const xs = cu(p.s, p.k, p.lin, n + 1); return pick(rng, nextQ(xs.slice(0, n)), xs[n], [[b ** 3 + p.lin * b, `found ${b}³ but dropped the constant ${sgn(p.k)}`], [b * b + p.lin * b + p.k, `used ${b}² instead of ${b}³`], [at(p, b + 1), `skipped a base: used ${b + 1}³`], [b ** 3 + xs[n - 1] - (b - 1) ** 3, 'kept the last leftover instead of continuing its rule']], `${form(p)}: next base ${b}, ${neg(xs[n])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Cubes to know: ${seq(CUBES)}. Last digits help you place a big term: 2³ ends in 8 and 8³ in 2, 3³ ends in 7 and 7³ in 3; every other digit cubes to itself in the last place.` },
    { type: 'check', scope: 'cubes by sight', questions: [
      { type: 'choice', q: 'Which number is a cube?', options: ['343', '324', '361', '400'], answer: 0, traps: { 1: '18², a square', 2: '19², a square', 3: '20², a square' }, explain: '343 = 7³.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'Products of three neighbours are cubes in disguise: (b − 1) × b × (b + 1) = b³ − b. And a leftover that moves by 1 is ± b: read it off two rows, never assume it is constant.' },
    { type: 'thinkaloud', problem: nextQ(TAx.slice(0, 5)), lines: [
      { t: 0, say: `Fast growth, no fixed ratio. Near cubes: ${seq(bases(TA.s, 5).map((b) => b ** 3))}.` },
      { t: 6, say: `Leftovers, term minus cube: ${seq(TAl.slice(0, 5))}.` },
      { t: 10, say: `Next base ${TAb}: ${TAb ** 3} + ${TAl[4]} = ${TAb ** 3 + TAl[4]}.`, slip: true },
      { t: 13, say: `Wait, the leftover moves by 1 each step: it is b ${pmk(TA.k)}, so at b = ${TAb} it is ${TAl[5]}, not ${TAl[4]}.` },
      { t: 17, say: `${TAb ** 3} + ${TAl[5]} = ${TAx[5]}. Check a row: ${TA.s + 1}³ + ${TA.s + 1} ${pmk(TA.k)} = ${TAx[1]}. Answer ${TAx[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: continue the leftover before adding it', questions: [
      { make: (rng) => { const p = d3(rng, 7), b = p.s + 6; return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Leftovers ${seq(leftovers(p, 6))} move by ${p.lin} per step, so at b = ${b} the leftover is ${neg(p.xs[6] - b ** 3)}: ${b ** 3} ${pmk(p.xs[6] - b ** 3)} = ${neg(p.xs[6])}.`, ['Subtract the cubes: is the leftover fixed or moving?', 'Move the leftover one more step, then add the next cube.']); } },
    ] },
    { type: 'check', scope: 'cubes by sight and b³ − b', questions: [
      { make: (rng) => { const b = rng.int(5, 12); return num(`What is ${b - 1} × ${b} × ${b + 1}?`, b ** 3 - b, `(b − 1) × b × (b + 1) = b³ − b = ${b ** 3} − ${b} = ${b ** 3 - b}.`, ['The middle number is b.', `b³ − b with b = ${b}.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Terms near cubes → subtract b³, read the leftover (constant, or moving by 1 = ± b), cube the next base and add the leftover back.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'First constant row', 'Read it as'], rows: [
      [seq(SQ), seq(g(SQ)), `second (${g(g(SQ))[0]})`, 'squares + k'],
      [seq(E1.slice(0, 5)), seq(g(E1.slice(0, 5))), `third (${g(g(g(E1)))[0]})`, 'cubes + k (this lesson)'],
      [seq(PW), seq(g(PW)), 'none: the gaps double', 'powers of 2 + k'],
      [seq(P3.slice(0, 5)), seq(g(P3.slice(0, 5))), `third (${g(g(g(P3)))[0]})`, 'b³ − b: products of three neighbours'],
    ] },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const t = rng.int(0, 2), s = rng.int(2, 5), k = nz(rng, -5, 5); const xs = t === 0 ? Array.from({ length: 5 }, (_, i) => (i + s) ** 2 + k) : t === 1 ? cu(s, k, 0, 5) : geo(2, 2, 5).map((v) => v + Math.abs(k)); const names = ['squares b² plus k', 'cubes b³ plus k', 'powers 2^{b} plus k']; const trp = [[null, 'cubes grow much faster; the second row here is constant', 'the gaps do not double'], ['the second row is not constant: it grows', null, 'the gaps do not double; the third row is 6'], ['the gaps double, which no polynomial does', 'the gaps double; cubes have a constant third row', null]]; return pick(rng, `${seq(xs)}: which reading?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps ${seq(g(xs))}; second row ${seq(g(g(xs)))}.`); } },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: 0³ = 0, so a list can start at 0 or at k; a leftover of b + k and one of −b + k move in opposite directions; and a list of cubes with k = 0 needs no subtraction at all.' },
    { type: 'variation', base: `${seq(E25)}, ?  b³ − ${-E2k} for b = ${seq(bases(E2s, 5))}; next ${E2s + 5}³ − ${-E2k} = ${E2[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E25.slice(1))}, ?`, effect: `Still ${E2[5]}. Every remaining term is still b³ − ${-E2k}, and the next base is still ${E2s + 5}.` },
      { change: `A shift of +4 instead: ${seq(KUP.slice(0, 5))}, ?`, effect: `${KUP[5]}. Same cubes and bases; only the constant you put back changes.` },
      { change: `Let the leftover move with the base, b³ + b − ${-E2k}: ${seq(LIN.slice(0, 5))}, ?`, effect: `${LIN[5]}. The leftovers now climb by 1, so at b = ${E2s + 5} the leftover is ${LIN[5] - (E2s + 5) ** 3}.` },
      { change: `Start at base ${LB}: ${seq(LATE.slice(0, 5))}, ?`, effect: `${LATE[5]} = ${LB + 5}³ − ${-E2k}. Bigger cubes, same leftover.` },
      { fusion: true, change: `Start at base ${LB} and let the leftover move: ${seq(BOTH.slice(0, 5))}, ?`, effect: `${BOTH[5]}. The start fixes the next base (${LB + 5}), the moving leftover is read at that base (${LB + 5} − ${-E2k}): the two changes act on different columns of the table.` },
    ] },
    { type: 'check', scope: 'the edge cases', questions: [
      { make: (rng) => { const s = rng.int(2, 5), xs = cu(s, 0, -1, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Products of three neighbours: ${s + 4} × ${s + 5} × ${s + 6} = ${(s + 5) ** 3} − ${s + 5} = ${xs[5]}.`, ['Factor each term as three neighbours.', 'The next product moves every factor up by 1.']); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: subtract the dominant part to expose the rest. It is the same move as the leftover test for "multiply, then add" and the same as reading squares under a shift.' },
    { type: 'transfer',
      near: { make: (rng) => { const p = { s: rng.int(9, 12), k: nz(rng, -9, 9), lin: 0 }, xs = cu(p.s, p.k, 0, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `These are ${p.s}³ to ${p.s + 4}³ ${p.k < 0 ? 'minus' : 'plus'} ${Math.abs(p.k)}: next ${p.s + 5}³ ${pmk(p.k)} = ${(p.s + 5) ** 3} ${pmk(p.k)} = ${xs[5]}.`, [`Is ${xs[0]} close to a cube? 10³ = 1000.`, 'Read the bases, then cube the next one and put the shift back.']); } },
      far: { make: (rng) => { const n = rng.int(4, 9); return num(`A big cube is built from ${n} × ${n} × ${n} small cubes, and its whole outside is painted. How many small cubes have no paint at all?`, (n - 2) ** 3, `Strip one layer from every face: the unpainted core is ${n - 2} × ${n - 2} × ${n - 2} = ${n - 2}³ = ${(n - 2) ** 3}.`, ['The unpainted cubes form a smaller cube inside.', 'Its side is two shorter: one layer off each end.']); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the painted cube?', options: [
        'spot a count of the form b³ and find the right base',
        'spot a count of the form b² and find the right base',
        'spot a count that doubles each time the base grows',
        'spot a count of 6 faces times the base of the cube',
      ], answer: 0, traps: { 1: 'a solid block counts length × width × height: three factors, not two', 2: 'the counts grow like b³, not by a fixed factor per step', 3: 'faces describe the painted surface; the unpainted cubes fill the inside' }, explain: 'Both questions come down to a cube number at the right base: the sequence terms sit next to b³, and the unpainted core is (n − 2)³.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'cubes-plus', section: 'nl', count: 3 },
  ],
};
