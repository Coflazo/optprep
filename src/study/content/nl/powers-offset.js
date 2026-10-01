// NumberLogic family lesson: powers of 2 or 3 shifted by a constant. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, ratios, nz, nextQ, pick, num, geo, quad } from './method-ladder.js';

// b^(i + s) + c for i = 0, 1, 2, …: the generator's parametrisation.
const pw = (b, s, c, n) => Array.from({ length: n }, (_, i) => b ** (i + s) + c);
const g = (xs) => diffs(xs);
const shift = (c) => (c < 0 ? ` − ${-c}` : ` + ${c}`);
const pow = (b, m) => `${b}^{${m}}`;

const CHc = 3, CH = pw(2, 1, CHc, 7);
const E1 = pw(2, 2, -3, 6);
const E2 = pw(3, 1, 2, 6);
const E3 = pw(2, 0, 5, 7);
const PRED = pw(3, 1, -1, 6);
const ERR = pw(2, 1, 1, 7);
const GE = geo(3, 2, 5);
const DG = [10]; while (DG.length < 6) DG.push(DG[DG.length - 1] + 3 * 2 ** (DG.length - 1));
const TOWER = Array.from({ length: 7 }, (_, i) => 2 ** (i + 1) - 1);
const P2 = Array.from({ length: 13 }, (_, m) => 2 ** m), P3 = Array.from({ length: 9 }, (_, m) => 3 ** m);

// Level 2 and level 3 draws, as in the generator.
function draw(rng, n, lvl = rng.pick([2, 3])) {
  const b = lvl === 2 ? 2 : rng.pick([2, 3]), s = lvl === 2 ? rng.int(0, 5) : rng.int(1, 4), c = lvl === 2 ? nz(rng, -5, 5) : nz(rng, -9, 9);
  return { b, s, c, xs: pw(b, s, c, n) };
}
const twos = (rng, n) => { let p; do p = draw(rng, n); while (p.b !== 2 || p.s < 1); return p; };

export default {
  id: 'nl/powers-offset',
  book: 'nl',
  kind: 'family',
  family: 'powers-offset',
  title: 'Powers of 2 or 3, shifted',
  summary: 'Gaps that multiply by exactly 2 or 3 from a power: the terms are b^m + c. Find c, raise the power, add c back.',
  prerequisites: ['nl/method-ladder', 'nl/geometric', 'nl/diff-geometric', 'nl/squares-plus'],
  objectives: [
    'Recognise 2^m + c and 3^m + c from the gaps in under ten seconds',
    'Find the hidden constant c from one term and its gap',
    'Give the next term as the next power plus c, never b × last',
    'Use next = b × last − (b − 1) × c as a one-line check',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'double', label: 'Double the last term', approach: 'The terms roughly double, so the last term was multiplied by 2.', breaksAt: 'That doubles the constant too; only the power part doubles.' },
      { id: 'geometric', label: 'Look for one ratio', approach: 'Divided neighbours and expected one constant ratio.', breaksAt: 'The constant shift spoils the ratios; only the gaps multiply exactly.' },
      { id: 'drop-c', label: 'Answer the next power', approach: 'Recognised the powers of 2 and gave the next power itself.', breaksAt: 'Every term carries the constant c, the next one too.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by subtracting the same number from every term.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} double, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. Or subtract ${CHc} from every term: ${seq(CH.slice(0, 5).map((v) => v - CHc))}, the powers of 2, so the next is ${2 ** 6} + ${CHc} = ${CH[5]}. If you answered ${2 * CH[4]}, you doubled the ${CHc} as well: the lesson shows why that fails.` },
    { type: 'text', text: 'Every term is a **power of 2 or 3 plus the same constant**. The gaps give it away: they multiply by exactly 2 (or 3), and for base 2 the gaps are themselves powers of 2. The terms do **not** keep one ratio, because the constant spoils it.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `Not this lesson: an exact ratio (${seq(GE)}: plain multiplication, no shift) or gaps that double from a start that is not a power, as in ${seq(DG.slice(0, 5))} with gaps ${seq(g(DG.slice(0, 5)))}, three times the powers of 2 (the gaps-that-multiply lesson covers it).` },
    { type: 'check', scope: 'the cue: gaps multiply by b, terms shifted powers', questions: [
      { make: (rng) => { const p = twos(rng, 5), ge = geo(rng.pick([3, 5, 7]) * 2 ** p.s, 2, 5), q = quad(rng.int(1, 20), rng.int(5, 15), rng.int(4, 8), 5); return pick(rng, 'Which sequence is a power of 2 plus the same constant?', seq(p.xs), [[seq(ge), `exact ratio 2 and ${ge[0]} is not a power of 2: plain multiplication`], [seq(q), `its gaps ${seq(g(q))} grow by a fixed amount, they do not double`]], `Subtract ${neg(p.c)}: ${seq(p.xs.map((v) => v - p.c))}, the powers of 2.`); } },
    ] },

    S('why'),
    { type: 'text', text: '2^m ± 1 and 3^m ± 1 are among the most frequent disguises in the middle of the test. They look like "roughly doubling", which invites the quick answer 2 × last, and that answer is always among the options. The gaps settle the question in seconds, and knowing the powers of 2 and 3 by sight turns the whole item into one subtraction and one addition.' },

    S('anchor'),
    { type: 'text', text: 'You know the powers of 2 as a geometric sequence, and from the squares lesson you know the move "subtract a constant to reveal a famous list". This family is exactly those two things together: **geometric powers, with one change**: every term shifted by the same c.' },
    { type: 'check', scope: 'a geometric list shifted by a constant', questions: [
      { make: (rng) => { const s = rng.int(2, 5), c = rng.int(2, 9), base = geo(2 ** s, 2, 5); return num(`The powers ${seq(base.slice(0, 4))} double. Add ${c} to every one: ${seq(base.slice(0, 4).map((v) => v + c))}, ? What comes next?`, base[4] + c, `The powers continue ${base[3]} × 2 = ${base[4]}; shifted, ${base[4]} + ${c} = ${base[4] + c}. Only the power part doubles.`, ['What is the next power?', `Add ${c} to it.`]); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Build the ladder. For base 2 the gap row **is** the list of powers, and the row under it copies the gaps: the signature of multiplication one layer down. The constant has vanished, because a constant shift never survives a subtraction.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CH.slice(0, 5), 2) }, caption: `${seq(CH.slice(0, 5))}: gaps ${seq(g(CH.slice(0, 5)))} are powers of 2, and the second row ${seq(g(g(CH.slice(0, 5))))} copies them. Why: 2^{m + 1} − 2^{m} = 2^{m}, so each gap equals the power under the term to its left.` },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'gap to its right', 'term − gap'], rows: CH.slice(0, 4).map((v, i) => [String(v), String(g(CH)[i]), sgn(v - g(CH)[i])]) }, caption: `Subtract each gap from the term on its left: the leftover is ${sgn(CH[0] - g(CH)[0])} every time. That leftover is c, and the gap was the power: ${CH[0]} = ${g(CH)[0]} + ${CHc}.` },
    { type: 'check', scope: 'the gap is the power under the term', questions: [
      { make: (rng) => { const p = twos(rng, 6), i = rng.int(1, 3); return num(`In ${seq(p.xs.slice(0, 5))} the gaps are ${seq(g(p.xs.slice(0, 5)))}. Which power of 2 sits under the term ${neg(p.xs[i])}?`, 2 ** (i + p.s), `The gap to the right of ${neg(p.xs[i])} is ${g(p.xs)[i]}, and for base 2 that gap is the power: ${neg(p.xs[i])} = ${2 ** (i + p.s)}${shift(p.c)}.`, ['Look at the gap to the right of that term.', 'For base 2, that gap equals the power.']); } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['exponent m', ...P2.map((_, m) => String(m))], rows: [['power of 2', ...P2.map(String)], ['power of 3', ...P3.map(String), ...P2.slice(P3.length).map(() => '')]] }, caption: 'The two rows to know by sight: 2^0 to 2^12 and 3^0 to 3^8. Every item in this family is one of these rows shifted by a small constant.' },
    { type: 'check', scope: 'knowing the powers by sight', questions: [
      { make: (rng) => { const m = rng.int(4, 8), v = 3 ** m; return pick(rng, 'Which number is a power of 3?', v, [[v - 3, `${v - 3} is 3 less than ${v} = 3^{${m}}`], [2 ** (m + 2), `${2 ** (m + 2)} = 2^{${m + 2}}, a power of 2`], [3 * (3 ** (m - 1) + 1), `${3 * (3 ** (m - 1) + 1)} = 3 × ${3 ** (m - 1) + 1}, and ${3 ** (m - 1) + 1} is not a power of 3`]], `${v} = 3^{${m}}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'geometric', say: 'Take the gaps. If each gap is b times the one before, with b = 2 or 3, the gap row is geometric.', why: 'A constant shift cancels in every gap: (b^{m + 1} + c) − (b^{m} + c) = b^{m}(b − 1). What remains is a geometric run.',
        checks: [
          { make: (rng) => { const p = draw(rng, 5); return num(`What is the ratio between neighbouring gaps of ${seq(p.xs)}?`, p.b, `Gaps ${seq(g(p.xs))}: each is ${p.b} times the one before.`, ['Write the gaps.', 'Divide a gap by the one before it.']); } },
        ] },
      { say: 'Read the power under one term from its gap: for b = 2 the gap to its right equals the power; for b = 3 the gap is twice the power.', why: '2^{m + 1} − 2^{m} = 2^{m}, and 3^{m + 1} − 3^{m} = 2 × 3^{m}: divide the gap by b − 1.',
        checks: [
          { make: (rng) => { const p = draw(rng, 6, 3), i = rng.int(1, 3); return num(`${seq(p.xs.slice(0, 5))} is a power of ${p.b} plus a constant. The gap to the right of ${neg(p.xs[i])} is ${g(p.xs)[i]}. Which power sits under ${neg(p.xs[i])}?`, p.b ** (i + p.s), `Power = gap ÷ (${p.b} − 1) = ${g(p.xs)[i]} ÷ ${p.b - 1} = ${p.b ** (i + p.s)}.`, [`The gap is (${p.b} − 1) × the power.`, `Divide the gap by ${p.b - 1}.`]); } },
        ] },
      { answers: 'drop-c', say: 'c = term − its power. Check the same c on a second term.', why: 'The constant is shared by every term, so a second term either confirms it or rules the family out.',
        checks: [
          { make: (rng) => { const p = draw(rng, 5); return num(`${seq(p.xs)} is a power of ${p.b} plus c. What is c?`, p.c, `${neg(p.xs[2])} = ${p.b ** (2 + p.s)}${shift(p.c)}, and ${neg(p.xs[3])} = ${p.b ** (3 + p.s)}${shift(p.c)}: c = ${neg(p.c)}.`, ['Find the power under one term.', 'c = term − power; check on another term.']); } },
        ] },
      { answers: 'double', say: 'Next = the next power + c. Only the power part multiplies by b; c stays where it is.', why: 'The rule is b^{m} + c at every position, so moving one step raises the power and leaves c alone.',
        checks: [
          { make: (rng) => { const p = draw(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Terms are ${p.b}^{m}${shift(p.c)}; the next power is ${pow(p.b, 5 + p.s)} = ${p.b ** (5 + p.s)}, so ${p.b ** (5 + p.s)}${shift(p.c)} = ${neg(p.xs[5])}.`, ['Subtract the same c from every term.', 'Raise the power once, then add c back.']); } },
        ] },
      { say: 'Cross-check by climbing: next gap = b × last gap, next = last + next gap.', why: 'The gap row is geometric, so this is the gaps-that-multiply method. Both routes must give the same number.',
        checks: [
          { make: (rng) => { const p = draw(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? What is the **next gap**?`, g(p.xs)[4], `Last gap ${g(p.xs)[3]} × ${p.b} = ${g(p.xs)[4]}; next term ${neg(p.xs[4])} + ${g(p.xs)[4]} = ${neg(p.xs[5])}.`, ['The gaps multiply by the base.']); } },
        ] },
    ] },
    { type: 'text', text: `The five moves on a base-3 item, ${seq(E2.slice(0, 5))}: the gaps ${seq(g(E2.slice(0, 5)))} triple, so b = 3. The gap to the right of ${E2[1]} is ${g(E2)[1]}, so the power under ${E2[1]} is ${g(E2)[1]} ÷ 2 = ${3 ** 2} and c = ${E2[1]} − ${3 ** 2} = ${E2[1] - 9}. Check on ${E2[2]}: ${3 ** 3} + ${E2[1] - 9} = ${E2[2]}. Next: 3^{6} + ${E2[1] - 9} = ${E2[5]}, and the climb agrees: ${E2[4]} + ${g(E2)[3]} × 3 = ${E2[5]}.` },
    { type: 'explain', prompt: 'Why does the constant disappear from the gaps, and why is b × last the wrong next term?', model: 'Every term is b^{m} + c, so a gap is (b^{m + 1} + c) − (b^{m} + c) = b^{m}(b − 1): the c cancels. Multiplying the whole last term by b gives b^{m + 1} + bc, which multiplies the constant too; the rule only moves the power, so the true next term is b^{m + 1} + c, off by (b − 1) × c.', points: ['c cancels in every subtraction', 'The gaps are (b − 1) × the powers', 'b × last multiplies c as well: it is off by (b − 1) × c'] },

    S('worked'),
    { type: 'worked', family: 'powers-offset', section: 'nl', difficulty: 2, seed: 'a', explainAt: [1], intro: 'Powers of 2 with a small shift. Find c before opening the solution.' },
    { type: 'worked', family: 'powers-offset', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'Base 2 or 3, a larger shift. The reading is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 4))}, ? Is the next term 3 × ${PRED[3]} = ${3 * PRED[3]}, or something else? Commit, then give it.`, answer: `Something else: ${PRED[4]}. The terms are 3^{m} − 1, and 3^{5} − 1 = ${PRED[4]}. Tripling the whole term also triples the −1, giving ${3 * PRED[3]}.`, explain: `The gaps ${seq(g(PRED.slice(0, 4)))} triple, so the next gap is ${g(PRED)[3]}: ${PRED[3]} + ${g(PRED)[3]} = ${PRED[4]}.` },

    S('traps'),
    { type: 'traps', family: 'powers-offset', section: 'nl', extra: [
      { belief: 'The terms roughly double, so double the last term.', fix: 'Only the power doubles. 2 × (2^{m} + c) = 2^{m + 1} + 2c, one c too many.' },
      { belief: 'The answer is the next power.', fix: 'Add c back: every term carries it, the next one too.' },
      { belief: 'c is the first term.', fix: 'c is term − power. The first term is itself shifted.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 5)))}. They double.`,
      'So the terms roughly double as well.',
      `Next = 2 × ${ERR[4]} = ${2 * ERR[4]}.`,
      `Answer: ${2 * ERR[4]}.`,
    ], errorStep: 2, explain: `The terms are 2^{m} + 1: only the power doubles. Next = 2^{6} + 1 = ${ERR[5]}. Test the belief on a shown step: 2 × ${ERR[2]} = ${2 * ERR[2]}, not ${ERR[3]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng, 7), l = p.xs[4], P = p.b ** (5 + p.s); return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], [[p.b * l, `multiplied the whole term by ${p.b}, constant included`], [P, `found ${pow(p.b, 5 + p.s)} = ${P} but dropped the constant ${sgn(p.c)}`], [P - p.c, `applied the constant with the wrong sign (${sgn(-p.c)})`], [l + g(p.xs)[3], 'repeated the last gap; the gaps multiply'], [p.xs[6], 'went one step too far: that is the term after the next one']], `${p.b}^{m}${shift(p.c)}: ${P}${shift(p.c)} = ${neg(p.xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'One line, no gaps: b × (b^{m} + c) = b^{m + 1} + bc, which is (b − 1) × c too much. So **next = b × last − (b − 1) × c**. For base 2: next = 2 × last − c.' },
    { type: 'callout', tone: 'speed', text: 'Spot c from the smallest term: it sits closest to its power. Then check one large term before answering. Budget: under 20 seconds.' },
    { type: 'thinkaloud', problem: nextQ(E2.slice(0, 5)), lines: [
      { t: 0, say: `Gaps ${seq(g(E2.slice(0, 5)))}: each is three times the last.` },
      { t: 4, say: `So the terms triple too: 3 × ${E2[4]} = ${3 * E2[4]}.`, slip: true },
      { t: 8, say: `Check that on a shown step: 3 × ${E2[1]} = ${3 * E2[1]}, not ${E2[2]}. Only the gaps triple, so this is a power of 3 plus a constant.` },
      { t: 14, say: `For base 3 the gap is twice the power: ${g(E2)[1]} ÷ 2 = ${3 ** 2} under ${E2[1]}, so c = ${E2[1] - 9}. Check: 3^{3} + ${E2[1] - 9} = ${E2[2]}.` },
      { t: 20, say: `Next power 3^{6} = ${3 ** 6}, plus ${E2[1] - 9}: ${E2[5]}. The tripled guess was off by ${3 * E2[4] - E2[5]}, twice c. Answer ${E2[5]}.` },
    ] },
    { type: 'check', scope: 'next = b × last − (b − 1) × c', questions: [
      { make: (rng) => { const p = draw(rng, 6); return num(`${seq(p.xs.slice(0, 5))} is ${p.b}^{m}${shift(p.c)}. Use next = ${p.b} × last − ${p.b - 1} × c. What comes next?`, p.xs[5], `${p.b} × ${neg(p.xs[4])} = ${neg(p.b * p.xs[4])}; minus ${p.b - 1} × ${p.c < 0 ? `(${neg(p.c)})` : p.c} = ${neg((p.b - 1) * p.c)}: ${neg(p.xs[5])}.`, [`Multiply the last term by ${p.b}.`, `Then subtract (${p.b} − 1) × c.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Gaps multiply by exactly b (2 or 3) → terms are b^{m} + c: c = term − power, next = next power + c (= b × last − (b − 1)c).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Terms are', 'Next'], rows: [
      [seq(GE), seq(g(GE)), `exact ratio ${ratios(GE)[0]}`, String(GE[4] * 2)],
      [seq(ERR.slice(0, 5)), seq(g(ERR.slice(0, 5))), '2^{m} + 1 (this lesson)', String(ERR[5])],
      [seq(E2.slice(0, 5)), seq(g(E2.slice(0, 5))), '3^{m} + 2 (this lesson)', String(E2[5])],
      [seq(DG.slice(0, 5)), seq(g(DG.slice(0, 5))), '3 × 2^{m} + 7 (gaps that multiply)', String(DG[5])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 5))}, ? (2^{m} + ${CHc}, next ${CH[5]})`, rows: [
      { change: `The constant becomes −${CHc}`, effect: `Same powers, shifted down: ${seq(pw(2, 1, -CHc, 5))}, next ${pw(2, 1, -CHc, 6)[5]}. The gaps do not change at all.` },
      { change: 'The base becomes 3 (same exponents, same constant)', effect: `${seq(pw(3, 1, CHc, 5))}: the gaps now triple, next ${pw(3, 1, CHc, 6)[5]}.` },
      { change: 'The list starts one power later', effect: `${seq(pw(2, 2, CHc, 5))}: same rule, next 2^{7} + ${CHc} = ${pw(2, 2, CHc, 6)[5]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: ${seq(CH.slice(1, 5))}, ? still ends at ${CH[4]}, so the next is still ${CH[5]}. The answer depends on the rule and the last term, not on where the list starts.` },
      { change: 'Base 3 and one power later, together', fusion: true, effect: `Both changes act on the power part only: ${seq(pw(3, 2, CHc, 5))}, next 3^{7} + ${CHc} = ${pw(3, 2, CHc, 6)[5]}. The constant is untouched by either.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: c = 0 is plain geometric. 2^{m} − 1 (${seq(pw(2, 1, -1, 5))}) is also "double and add 1": both lenses give the same next term. A large negative c makes the first terms negative (${seq(pw(2, 0, -5, 4))}); the gaps still double.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: 2^{m} − 1 is the number written with m ones in binary, and the number of moves in the Tower of Hanoi. A balance that doubles each period after a fixed fee is taken follows b^{m} + c too: strip the constant to see the growth.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) xs = twos(rng, 5).xs; else if (t === 1) xs = geo(rng.pick([3, 5, 7]), 2, 5); else { xs = [rng.int(5, 20)]; const k = rng.pick([3, 5]); while (xs.length < 5) xs.push(xs[xs.length - 1] + k * 2 ** (xs.length - 1)); } const names = ['a power of 2 plus a constant', 'exact ratio 2', 'gaps double from a non-power start']; const trp = [[null, 'the ratios are not exact: the constant spoils them', 'the gaps start at a power of 2, so the terms are powers plus c'], [`every ratio is exactly 2; nothing is shifted`, null, 'the terms themselves double'], [`the gaps ${seq(g(xs))} are not powers of 2`, 'the terms do not keep one ratio', null]]; return pick(rng, `${seq(xs)}: which description fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
      { make: (rng) => { const s = rng.int(1, 4), xs = pw(2, s, -1, 6); return num(`${seq(xs.slice(0, 5))}, ? Read it as "double, then add 1". What comes next?`, xs[5], `2 × ${xs[4]} + 1 = ${xs[5]}, the same as 2^{${s + 5}} − 1.`); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = draw(rng, 6, 3); return num(`A meter shows ${seq(p.xs.slice(0, 5))}. Each reading is a power of ${p.b} plus the same constant. What is the next reading?`, p.xs[5], `c = ${neg(p.c)}; next ${p.b}^{${p.s + 5}}${shift(p.c)} = ${neg(p.xs[5])}.`, ['Gaps multiply by the base.', 'Find c, raise the power, add c back.']); } },
      far: { type: 'number', q: `The least number of moves for a Tower of Hanoi with 1, 2, 3, 4, 5 discs is ${seq(TOWER.slice(0, 5))}. How many moves for 7 discs?`, answer: TOWER[6], explain: `The counts are 2^{n} − 1 (add 1: ${seq(TOWER.slice(0, 5).map((v) => v + 1))}). For 7 discs: 2^{7} − 1 = ${TOWER[6]}.`, hints: ['Add 1 to every count.', 'Powers of 2, then subtract the 1 again.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the tower?', options: ['Remove a constant shift to reveal a known list', 'Multiply the last term by the same ratio each time', 'Add the last two terms to get the next one', 'Look for a constant second row of differences'], answer: 0, traps: { 1: `the ratios ${TOWER.slice(1, 4).map((v, i) => (v / TOWER[i]).toFixed(2)).join(', ')} are not constant`, 2: `${TOWER[1]} + ${TOWER[2]} is not ${TOWER[3]}`, 3: `the second row ${seq(diffs(diffs(TOWER.slice(0, 5))))} doubles, it is not constant` }, explain: 'The move counts are powers of 2 shifted by −1; undoing the shift reveals the list, exactly as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'powers-offset', section: 'nl', count: 3 },
  ],
};
