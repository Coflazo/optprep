// NumberLogic family lesson: products of near neighbours, b(b + c). Every number shown is computed here.
import { S, neg, seq, diffs, ladderRows, nextQ, pick, fair, num, tri } from './method-ladder.js';

// term i = (s + i)(s + i + c): the generator's parametrisation.
const pr = (s, c, n) => Array.from({ length: n }, (_, i) => (i + s) * (i + s + c));
const g = (xs) => diffs(xs);
const fac = (s, c, n) => Array.from({ length: n }, (_, i) => `${i + s}×${i + s + c}`).join(', ');

const CHs = 4, CHc = 1, CH = pr(CHs, CHc, 6);
const E1s = 5, E1c = 1, E1 = pr(E1s, E1c, 6);
const E2s = 2, E2c = 3, E2 = pr(E2s, E2c, 6);
const E3s = 5, E3c = -2, E3 = pr(E3s, E3c, 6);
const PRs = 1, PRc = 2, PRED = pr(PRs, PRc, 6);
const ERs = 5, ERc = 1, ERR = pr(ERs, ERc, 6);
const REC = { b: 4, c: 1 };
const SQ1 = Array.from({ length: 5 }, (_, i) => (i + 2) ** 2 + 1);
const TRI = Array.from({ length: 5 }, (_, i) => tri(i + 2));
const LB = 19;
const NB = Array.from({ length: 11 }, (_, i) => (i + 1) * (i + 2));

const C = [1, 2, 3, 4, -1, -2];
const TAs = 15, TAc = 3, TA = pr(TAs, TAc, 6), TAb = TAs + 5;
const E15 = E1.slice(0, 5), WIDE = pr(E1s, 3, 6), LS = 10, LATE = pr(LS, E1c, 6), HALF = E1.map((v) => v / 2), BOTH = pr(LS, 3, 6);
const drawP = (rng, n) => { let s, c; do { s = rng.int(1, 14); c = rng.pick(C); } while (s + c <= 0); return { s, c, xs: pr(s, c, n) }; };
const small = (rng, n) => { const s = rng.int(2, 9), c = rng.pick([1, 2, 3]); return { s, c, xs: pr(s, c, n) }; };

// Dots: a b × (b + c) rectangle, the b × b square dark and the extra columns light.
const rect = (b, c) => { const out = []; for (let r = 0; r < b; r++) for (let k = 0; k < b + c; k++) out.push({ x: 20 + k * 26, y: 20 + r * 26, r: 9, shape: 'circle', tone: k < b ? 1 : 3 }); return out; };

export default {
  id: 'nl/pronic',
  book: 'nl',
  kind: 'family',
  family: 'pronic',
  title: 'Products of near neighbours: b(b + c)',
  summary: `Factor each term as two close numbers a fixed distance apart (${seq(pr(1, 1, 4))} = ${fac(1, 1, 4)}); the next term is the next pair.`,
  prerequisites: ['nl/method-ladder', 'nl/squares-plus'],
  objectives: [
    `Factor terms like ${seq(pr(5, 1, 3))} as two close numbers in seconds`,
    'Find the fixed distance c between the two factors',
    'Tell b(b + c) apart from squares plus a constant and from triangular numbers',
    'Cross-check with the ladder: the second difference is 2',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by writing each term as a product.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} grow by ${g(g(CH))[0]}, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. As products: ${fac(CHs, CHc, 5)}, so the next is ${fac(CHs + 5, CHc, 1)} = ${CH[5]}.`,
      attempts: [
        { id: 'any-pair', label: 'Take any factor pair', approach: `Wrote ${CH[0]} as 2 × ${CH[0] / 2} and ${CH[1]} as 3 × ${CH[1] / 3}, hunting for a pattern.`, breaksAt: 'Every term splits several ways; only the pair near the square root keeps the same distance on every term.' },
        { id: 'widen', label: 'Widen the distance', approach: `Thought the factors drift apart and used ${CHs + 5} × ${CHs + 5 + CHc + 1} = ${(CHs + 5) * (CHs + 5 + CHc + 1)}.`, breaksAt: `Both factors step up together, so the distance stays ${CHc}.` },
        { id: 'next-square', label: 'Square the next base', approach: `Saw the terms sit just above squares and answered ${CHs + 5}² = ${(CHs + 5) ** 2}.`, breaksAt: `b × b drops the extra column: the next pair is ${fac(CHs + 5, CHc, 1)} = ${CH[5]}.` },
      ] },
    { type: 'text', text: `Each term is a **product of two whole numbers a fixed distance apart**: b × (b + 1), or b × (b + 3), with b counting up. The terms look like squares that are slightly off: ${E1[0]} sits between ${E1s ** 2} and ${(E1s + 1) ** 2}, ${E1[2]} between ${(E1s + 2) ** 2} and ${(E1s + 3) ** 2}.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `Not this lesson: squares plus a constant (${seq(SQ1)}) and triangular numbers (${seq(TRI)}), which are half of b(b + 1). The factoring test below separates them: only this family splits every term into two factors the same distance apart.` },
    { type: 'check', scope: 'the cue: products of close numbers', questions: [
      { make: fair((rng) => { const p = small(rng, 5), s = rng.int(2, 6), q = Array.from({ length: 5 }, (_, i) => (i + s) ** 2 + rng.pick([1, 2, 3])), t = Array.from({ length: 5 }, (_, i) => tri(i + s)); return pick(rng, 'Which list is products of two numbers a fixed distance apart?', seq(p.xs), [[seq(q), 'squares plus a constant: no single factor distance fits every term'], [seq(t), 'those are triangular numbers, half of b(b + 1)']], `${seq(p.xs)} = ${fac(p.s, p.c, 5)}.`); }) },
    ] },

    S('why'),
    { type: 'text', text: `Products of neighbours (${seq(NB.slice(0, 6))}) appear early and in the middle of the test, and they look like squares that are slightly off. Factoring is faster than building the ladder, and the ladder (second difference 2) is a free check you can run if the factoring looks doubtful. They also connect three lessons: b(b + 1) is twice a triangular number, and b(b + 2) is a square minus 1.` },

    S('anchor'),
    { type: 'text', text: 'A square is b × b. This family changes **one thing**: the second factor is b + c instead of b. Picture a square of dots with c extra columns. Every term is still close to a square, which is why these lists feel familiar; the extra columns are exactly what makes them miss.' },
    { type: 'check', scope: 'factoring into neighbours', questions: [
      { make: (rng) => { const b = rng.int(5, 15); return num(`${b * (b + 1)} is the product of two neighbouring whole numbers. What is the smaller one?`, b, `${b} × ${b + 1} = ${b * (b + 1)}.`, [`${b * (b + 1)} is just above ${b}².`, `Try ${b} × ${b + 1}.`]); } },
    ] },

    S('picture'),
    { type: 'text', text: `b(b + c) is a rectangle of dots, b rows and b + c columns: a b × b square with c extra columns. Here b = ${REC.b} and c = ${REC.c}: ${REC.b} × ${REC.b + REC.c} = ${REC.b * (REC.b + REC.c)} dots.` },
    { type: 'diagram', diagram: 'dots', spec: { width: 40 + (REC.b + REC.c - 1) * 26, height: 40 + (REC.b - 1) * 26, items: rect(REC.b, REC.c), label: 'A rectangle of dots: a square plus extra columns' }, caption: `First colour: the ${REC.b} × ${REC.b} square (${REC.b * REC.b}). Second colour: ${REC.c} extra column of ${REC.b}. Total ${REC.b * REC.b} + ${REC.c * REC.b} = ${REC.b * (REC.b + REC.c)}. The next term is the ${REC.b + 1} × ${REC.b + 1 + REC.c} rectangle.` },
    { type: 'check', scope: 'the rectangle', questions: [
      { make: (rng) => { const b = rng.int(4, 12), c = rng.pick([1, 2, 3]); return num(`A rectangle has ${b} rows and ${b + c} columns. The next rectangle in the sequence has one more row and one more column. How many dots does it hold?`, (b + 1) * (b + 1 + c), `${b + 1} × ${b + 1 + c} = ${(b + 1) * (b + 1 + c)}.`); } },
    ] },
    { type: 'text', text: 'The ladder view: b(b + c) = b² + cb is a quadratic, so the gaps grow by exactly 2 each step, the same second difference as the squares.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E2, 2), predicted: true }, caption: `${seq(E2.slice(0, 5))} = ${fac(E2s, E2c, 5)}: gaps ${seq(g(E2.slice(0, 5)))}, second row ${g(g(E2))[0]}. Both routes give ${E2[5]}.` },
    { type: 'check', scope: 'second difference 2', questions: [
      { make: (rng) => { const p = drawP(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? The gaps grow by 2. What is the next gap?`, g(p.xs)[4], `Gaps ${seq(g(p.xs).slice(0, 4))}: next ${g(p.xs)[3]} + 2 = ${g(p.xs)[4]}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Factor each term as two close numbers. Start at the square root: a term between b² and (b + 1)² is often b × (b + 1).', why: 'Two factors a small distance apart sit either side of the square root, so that is where to look first.',
        checks: [
          { make: (rng) => { const p = drawP(rng, 5); return num(`${seq(p.xs)} is a list of products of two close numbers. What is the smaller factor of ${p.xs[2]}?`, p.s + 2, `${p.xs[2]} = ${p.s + 2} × ${p.s + 2 + p.c}.`, [`Which squares is ${p.xs[2]} near?`, 'Check the factor pairs close to the square root.']); } },
        ] },
      { answers: 'any-pair', say: 'The distance between the two factors must be the same for every term. That fixed distance is c.', why: 'One term can be factored many ways; the right pairing is the one that keeps the same distance across all terms.',
        checks: [
          { make: (rng) => { const p = drawP(rng, 5); return num(`${seq(p.xs)} = b × (b + c) for consecutive b. What is c?`, p.c, `${fac(p.s, p.c, 5)}: the larger factor is always ${p.c < 0 ? `${-p.c} less` : `${p.c} more`}, so c = ${neg(p.c)}.`, ['Factor the first two terms.', 'Larger factor minus smaller factor.']); } },
        ] },
      { answers: 'widen', say: 'The smaller factor counts up by 1, so the next b is the last b + 1.', why: 'Both factors step up together; the distance between them stays c.',
        checks: [
          { make: (rng) => { const p = drawP(rng, 5); return num(`${seq(p.xs)}: what is the smaller factor of the next term?`, p.s + 5, `The smaller factors run ${p.s}, …, ${p.s + 4}; next ${p.s + 5}.`); } },
        ] },
      { answers: 'next-square', say: 'Next term = next b × (next b + c).', why: 'Apply the same product to the next pair.',
        checks: [
          { make: (rng) => { const p = drawP(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `${fac(p.s, p.c, 5)}; next ${fac(p.s + 5, p.c, 1)} = ${p.xs[5]}.`, ['Factor each term as two close numbers.', 'Move both factors up by 1.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'b', 'b + c', 'b²', '(b + 1)²'], rows: E1.slice(0, 5).map((v, i) => [String(v), String(E1s + i), String(E1s + i + E1c), String((E1s + i) ** 2), String((E1s + i + 1) ** 2)]) }, caption: `Each term of ${seq(E1.slice(0, 5))} sits between two neighbouring squares, and its factors are the two bases of those squares. The square root points straight at the pair.` },
    { type: 'text', text: 'Why the square root is the right starting point: b(b + c) is close to (b + c/2)², so the square root of a term sits halfway between its two factors. Take the two whole numbers around the root with the right distance and you have the pair. For large terms this is much faster than trial division.' },
    { type: 'explain', prompt: 'Why must the distance between the factors be the same for every term, and why does b(b + c) have a second difference of 2?', model: 'Many numbers split into several factor pairs; the rule picks the pair whose distance is c every time, so a changing distance means the wrong pairing. b(b + c) = b² + cb: the cb part adds a constant c to each gap and the b² part makes the gaps grow by 2, so the second row is 2.', points: ['The same factor distance identifies the right pairing', 'b(b + c) = b² + cb', 'The b² part gives second difference 2; cb only shifts the gaps'] },

    S('worked'),
    { type: 'worked', family: 'pronic', section: 'nl', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Factor the first two terms before opening the solution.' },
    { type: 'worked', family: 'pronic', section: 'nl', difficulty: 2, seed: 'b', fade: 1, intro: 'The factoring is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 5))}, ? Read it as products and as squares minus something. Do the two readings agree on the next term?`, answer: `Yes: products ${fac(PRs, PRc, 5)} give ${fac(PRs + 5, PRc, 1)} = ${PRED[5]}; squares minus 1 give ${PRs + 6}² − 1 = ${PRED[5]}.`, explain: 'b(b + 2) = (b + 1)² − 1, so with an even distance both readings are the same rule.' },

    S('traps'),
    { type: 'traps', family: 'pronic', section: 'nl', extra: [
      { belief: 'The next term is the next square.', fix: 'b × b drops the c × b part; multiply by b + c.' },
      { belief: 'The factor distance grows by 1 each time.', fix: 'Both factors step up together; the distance stays c.' },
      { belief: 'Any factor pair of a term will do.', fix: 'Pick the pair near the square root and check the same distance on the next term.' },
    ] },
    { type: 'text', text: 'The wrong options are the square of the next base, a product with the distance widened by one, the last gap repeated, and the term one pair too far. Each is one multiplication away from the right answer, so compute the product rather than estimating it.' },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Factor: ${fac(ERs, ERc, 5)}.`,
      `The next smaller factor is ${ERs + 5}.`,
      `Next term = ${ERs + 5} × ${ERs + 5} = ${(ERs + 5) ** 2}.`,
      `Answer: ${(ERs + 5) ** 2}.`,
    ], errorStep: 2, explain: `The factors are always ${ERc} apart, so the next pair is ${fac(ERs + 5, ERc, 1)} = ${ERR[5]}. Squaring drops the extra ${ERc} × ${ERs + 5}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = drawP(rng, 7), b = p.s + 5, l = p.xs[4]; return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], [[b * b, `took ${b}² and dropped the ${p.c < 0 ? '−' : '+'}${Math.abs(p.c)} × ${b} part`], [b * (b + p.c + 1), `widened the factor distance to ${p.c + 1}; it stays ${p.c}`], [l + (l - p.xs[3]), 'repeated the last gap; the gaps grow by 2'], [p.xs[6], 'skipped a pair: that is the term after the next one']], `${fac(p.s + 5, p.c, 1)} = ${p.xs[5]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the products of neighbours by sight: ${seq(NB)}. Any of these in the list gives the rule away.` },
    { type: 'callout', tone: 'speed', text: `Large terms: take the square root, round, and test the pairs around it with the distance from the first term. ${LB * (LB + 1)} is just under ${LB + 1}², so try ${LB} × ${LB + 1}. One multiplication confirms it.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps ${seq(g(TA.slice(0, 5)))} grow by 2: a quadratic. Factor near the square roots.` },
      { t: 5, say: `${TA[0]} = ${fac(TAs, TAc, 1)}, ${TA[1]} = ${fac(TAs + 1, TAc, 1)}: factors ${TAc} apart. Check ${TA[4]} = ${fac(TAs + 4, TAc, 1)}. Same distance.` },
      { t: 11, say: `Next pair: ${TAb} × ${TAb + TAc + 1} = ${TAb * (TAb + TAc + 1)}.`, slip: true },
      { t: 14, say: `No: both factors step up together, so the distance stays ${TAc}. ${TAb} × ${TAb + TAc}.` },
      { t: 17, say: `${TAb} × ${TAb + TAc} = ${TA[5]}. Gap check: ${TA[5]} − ${TA[4]} = ${g(TA)[4]} = ${g(TA)[3]} + 2. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: the factor distance stays fixed', questions: [
      { make: (rng) => { const s0 = rng.int(8, 16), c = rng.pick([2, 3, 4]), xs = pr(s0, c, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `${fac(s0, c, 5)}: the distance stays ${c}. Next ${fac(s0 + 5, c, 1)} = ${xs[5]}.`, ['Factor the first terms near their square roots.', 'Move both factors up by 1; keep the distance.']); } },
    ] },
    { type: 'check', scope: 'factor from the square root', questions: [
      { make: (rng) => { const b = rng.int(14, 30), c = rng.pick([1, 2, 3]); return num(`${b * (b + c)} = b × (b + ${c}). What is b?`, b, `√${b * (b + c)} is about ${Math.round(Math.sqrt(b * (b + c)) * 10) / 10}; ${b} × ${b + c} = ${b * (b + c)}.`, ['Start near the square root.', `Look for two factors ${c} apart.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Terms factor as b × (b + c) with the same distance c → next = (b + 1) × (b + 1 + c).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Read it as', 'Next'], rows: [
      [seq(E1.slice(0, 5)), `b(b + 1): ${fac(E1s, E1c, 3)}, …`, String(E1[5])],
      [seq(PRED.slice(0, 5)), 'b(b + 2) = (b + 1)² − 1: both readings work', String(PRED[5])],
      [seq(SQ1), 'b² + 1: squares shifted, no factor rule', String((2 + 5) ** 2 + 1)],
      [seq(TRI), 'b(b + 1)/2: triangular, half of this lesson', String(tri(2 + 5))],
    ] },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const t = rng.int(0, 2), s = rng.int(2, 7); const xs = t === 0 ? pr(s, 1, 5) : t === 1 ? Array.from({ length: 5 }, (_, i) => (i + s) ** 2 + 1) : Array.from({ length: 5 }, (_, i) => tri(i + s)); const names = ['b(b + 1)', 'b² + 1', 'b(b + 1)/2']; const trp = [[null, `${xs[0]} − 1 is not a square`, 'these are twice as big as the triangular numbers'], ['the factor distance does not stay fixed', null, 'triangular gaps count by 1; these gaps grow by 2'], ['these are half of b(b + 1)', `${xs[0]} − 1 is not a square`, null]]; return pick(rng, `${seq(xs)}: which reading fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: c can be negative, as in ${fac(E3s, E3c, 3)} = ${seq(E3.slice(0, 3))}; an even c makes the list a square minus a constant too; and b(b + 1) is always even, so an odd term rules it out at once.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: factoring near the square root is how you split any number into two close factors, from areas of rectangles to counting pairs: b(b − 1) is the number of ordered pairs of different items from b.' },
    { type: 'variation', base: `${seq(E15)}, ?  ${fac(E1s, E1c, 5)}; next ${fac(E1s + 5, E1c, 1)} = ${E1[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E15.slice(1))}, ?`, effect: `Still ${E1[5]}. The remaining factor pairs keep distance ${E1c}, and the next pair is still ${fac(E1s + 5, E1c, 1)}.` },
      { change: `Distance 3 instead of ${E1c}: ${seq(WIDE.slice(0, 5))}, ?`, effect: `${WIDE[5]} = ${fac(E1s + 5, 3, 1)}. Same smaller factors; the larger one sits 3 above.` },
      { change: `Start at b = ${LS}: ${seq(LATE.slice(0, 5))}, ?`, effect: `${LATE[5]} = ${fac(LS + 5, E1c, 1)}. Bigger numbers, so factor from the square root.` },
      { change: `Halve every term: ${seq(HALF.slice(0, 5))}, ?`, effect: `${HALF[5]}. Half of b(b + 1) is the triangular number T(b): gaps now count by 1.` },
      { fusion: true, change: `Distance 3 and start at b = ${LS}: ${seq(BOTH.slice(0, 5))}, ?`, effect: `${BOTH[5]} = ${fac(LS + 5, 3, 1)}. The start fixes the smaller factor (${LS + 5}), the distance fixes the larger (${LS + 8}).` },
    ] },
    { type: 'check', scope: 'the edge cases', questions: [
      { make: (rng) => { const s = rng.int(4, 9), xs = pr(s, -2, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `${fac(s, -2, 5)}: the larger factor is 2 less. Next ${fac(s + 5, -2, 1)} = ${xs[5]}.`, ['Factor each term into two numbers 2 apart.', 'The first factor is the larger one here.']); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(6, 14); return num(`In a league every team plays every other team twice, home and away. With 2 teams there are 2 games, with 3 teams 6, with 4 teams 12, with 5 teams 20. How many games with ${n} teams?`, n * (n - 1), `The counts are ${fac(2, -1, 4)}: b(b − 1). With ${n} teams: ${n} × ${n - 1} = ${n * (n - 1)}.`, ['Factor 2, 6, 12, 20 as two neighbouring numbers.', `${n} × ${n - 1}.`]); } },
      far: { make: (rng) => { const b = rng.int(12, 30), c = rng.pick([2, 3, 4]); return num(`A rectangle's long side is ${c} cm longer than its short side, and its area is ${b * (b + c)} cm². How long is the short side?`, b, `√${b * (b + c)} ≈ ${Math.round(Math.sqrt(b * (b + c)) * 10) / 10}; the sides sit either side of it, ${c} apart: ${b} × ${b + c} = ${b * (b + c)}.`, ['Start near the square root of the area.', `Look for two factors ${c} apart.`]); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the league and the rectangle?', options: [
        'a product of two numbers that sit a fixed distance apart',
        'a perfect square, one number multiplied by itself',
        'half of the product of two neighbouring numbers',
        'a sum of two numbers that sit a fixed distance apart',
      ], answer: 0, traps: { 1: 'the two factors differ (teams and opponents, long and short side), so it is b × (b + c)', 2: 'halving counts each pairing once; home and away games count it twice', 3: 'games and areas multiply the two numbers; a sum grows far too slowly' }, explain: 'Games with home and away are b(b − 1), and the rectangle is b(b + c): both are two factors a fixed distance apart, found from the square root.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'pronic', section: 'nl', count: 3 },
  ],
};
