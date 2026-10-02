// NumberLogic family lesson: squares (or neighbour products) of Fibonacci numbers, possibly shifted.
// Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nextQ, pick, num, fibl } from './method-ladder.js';

const FIB = fibl(1, 1, 30);
// k = 'sq': F(i + s)² + c; k = 'prod': F(i + s)·F(i + s + 1) + c. The generator's parametrisation.
const fsq = (k, s, c, n) => Array.from({ length: n }, (_, i) => (k === 'sq' ? FIB[i + s] ** 2 : FIB[i + s] * FIB[i + s + 1]) + c);
const g = (xs) => diffs(xs);
const shift = (c) => (c ? (c < 0 ? ` − ${-c}` : ` + ${c}`) : '');
const form = (k, s, i) => (k === 'sq' ? `${FIB[i + s]}²` : `${FIB[i + s]} × ${FIB[i + s + 1]}`);
const off = (p) => (p.c ? `The terms are ${Math.abs(p.c)} ${p.c < 0 ? 'below' : 'above'} ${p.k === 'sq' ? 'squares' : 'products'}; ` : '');
const val = (k, s, i) => (k === 'sq' ? FIB[i + s] ** 2 : FIB[i + s] * FIB[i + s + 1]);

// Parameters as in the generator (level 4): start s from 0 to 6, a constant that is usually 0.
// Every combination was checked with the rule finder: none fits a second rule.
function draw(rng, k = rng.pick(['sq', 'prod'])) { const s = rng.int(0, 6), c = rng.pick([0, 0, 0, -3, -2, -1, 1, 2, 3]); return { k, s, c, xs: fsq(k, s, c, 8) }; }

const CH = fsq('sq', 2, 0, 7);
const E1c = 1, E1 = fsq('sq', 1, E1c, 7);
const E2 = fsq('prod', 1, 0, 7);
const E3c = -1, E3 = fsq('prod', 2, E3c, 7);
const PRED = fsq('sq', 0, 0, 7);
const ERR = fsq('sq', 3, 0, 7);
const SQ = Array.from({ length: 6 }, (_, i) => (i + 2) ** 2);
const PRN = Array.from({ length: 6 }, (_, i) => (i + 1) * (i + 2));

export default {
  id: 'nl/fibonacci-squares',
  book: 'nl',
  kind: 'family',
  family: 'fibonacci-squares',
  title: 'Squares and products of Fibonacci numbers',
  summary: 'Neither gaps nor ratios settle, but every term is a perfect square (or a product of two neighbours) after removing a constant: the roots are Fibonacci numbers.',
  prerequisites: ['nl/method-ladder', 'nl/fibonacci-like', 'nl/squares-plus', 'nl/pronic'],
  objectives: [
    'Spot perfect squares or neighbour products hiding behind a small constant',
    'Recover the roots (or factors) and see the Fibonacci rule in them',
    'Extend the roots by one step, reapply the square or product, add the constant back',
    'Avoid applying the Fibonacci rule to the terms themselves',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'ladder', label: 'Build a ladder', approach: `Took the gaps ${seq(g(CH.slice(0, 6)))} and their gaps, hoping a row settles.`, breaksAt: 'No row settles: the structure sits in the square roots.' },
      { id: 'terms-add', label: 'Add the last two terms', approach: `Saw Fibonacci-like growth and added ${CH[4]} + ${CH[5]}.`, breaksAt: 'Squares do not add like that; only the roots do.' },
      { id: 'root-only', label: 'Answer the next root', approach: `Found the next Fibonacci number, ${FIB[8]}, and gave it as the answer.`, breaksAt: 'That is the next root: it still has to be squared.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with the gaps, once by taking the square root of every term.`, answer: String(CH[6]), explain: `Gaps ${seq(g(CH.slice(0, 6)))} and their gaps ${seq(g(g(CH.slice(0, 6))))} never settle. Roots: ${seq(FIB.slice(2, 8))}, the Fibonacci numbers: each is the sum of the two before. Next root ${FIB[7]} + ${FIB[6]} = ${FIB[8]}, so the next term is ${FIB[8]}² = ${CH[6]}.` },
    { type: 'text', text: `A famous list, the **Fibonacci numbers** (${seq(FIB.slice(0, 7))}, …, each the sum of the two before), is hidden under an operation: every term is one of them **squared**, or the **product of two neighbours** F × next F, sometimes plus a small constant.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 6))}, ?`] },
    { type: 'check', scope: 'the cue: roots that are Fibonacci numbers', questions: [
      { make: (rng) => { const p = draw(rng, 'sq'), xs = fsq('sq', p.s, 0, 6), b = Math.max(2, Math.round(Math.sqrt(xs[5])) - 5), sq = Array.from({ length: 6 }, (_, i) => (i + b) ** 2), f0 = Math.max(2, Math.round(xs[5] / 13)), f = fibl(f0, f0 + rng.int(1, 3), 6); return pick(rng, 'Which sequence is the squares of consecutive Fibonacci numbers?', seq(xs), [[seq(sq), `its roots ${seq(sq.map(Math.sqrt))} count up by 1`], [seq(f), `these terms add like Fibonacci themselves (${f[3]} + ${f[4]} = ${f[5]}); they are not squares`]], `Roots ${seq(xs.map(Math.sqrt))}: each is the sum of the two before.`); } },
    ] },
    { type: 'text', text: `Not this lesson: squares of the counting numbers (${seq(SQ)}: roots 2, 3, 4, …, the squares lesson), products n(n + 1) (${seq(PRN)}), or a list whose terms themselves add like Fibonacci.` },
    { type: 'check', scope: 'the neighbouring lists', questions: [
      { type: 'choice', q: '4, 9, 16, 25, 36, 49: what are the roots?', options: ['2, 3, 4, 5: the counting numbers', '2, 3, 5, 8: Fibonacci numbers', 'there are no whole roots'], answer: 0, traps: { 1: 'the root after 3 is 4, not 5', 2: 'every term is a perfect square' }, explain: 'Roots 2, 3, 4, 5, 6, 7 count up: the squares lesson.' },
    ] },

    S('why'),
    { type: 'text', text: 'Layering a known list under an operation is a standard late-test disguise. The gaps and ratios of squared Fibonacci numbers look random, so the ladder fails. Two recognitions solve it: perfect squares (or neighbour products) and the Fibonacci rule. Each is familiar; the item only combines them, and the traps come from applying the right rule to the wrong layer.' },

    S('anchor'),
    { type: 'text', text: 'In the squares lesson the terms were b² (plus a constant) with b counting 1, 2, 3, …. This family changes **one thing**: the bases b are Fibonacci numbers instead of counting numbers. The move is the same: remove the constant, take roots, continue the roots with their own rule, then square them again.' },
    { type: 'check', scope: 'continuing the Fibonacci roots', questions: [
      { make: (rng) => { const s = rng.int(2, 8); return num(`The square roots of a sequence are ${seq(FIB.slice(s, s + 5))}. What is the next root?`, FIB[s + 5], `${FIB[s + 3]} + ${FIB[s + 4]} = ${FIB[s + 5]}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Put the roots under the terms. The terms follow no pattern you can see; the roots follow the Fibonacci rule. For the product version, write each term as two factors: the right factor of one term is the left factor of the next.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'square root', 'sum of the two roots before'], rows: CH.slice(0, 6).map((v, i) => [String(v), String(FIB[i + 2]), i >= 2 ? `${FIB[i]} + ${FIB[i + 1]} = ${FIB[i] + FIB[i + 1]}` : '']) }, caption: `${seq(CH.slice(0, 6))}: the roots ${seq(FIB.slice(2, 8))} add like Fibonacci. Next root ${FIB[8]}, next term ${FIB[8]}² = ${CH[6]}.` },
    { type: 'check', scope: 'roots and their rule', questions: [
      { make: (rng) => { const p = draw(rng, 'sq'), xs = fsq('sq', p.s, 0, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Roots ${seq(FIB.slice(p.s, p.s + 6))}; next root ${FIB[p.s + 6]}; ${FIB[p.s + 6]}² = ${xs[6]}.`, ['Take the square root of each term.', 'Continue the roots, then square.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(FIB.slice(2, 8), 1) }, caption: `The ladder of the roots: gaps ${seq(g(FIB.slice(2, 8)))} copy the roots two places back, the Fibonacci fingerprint from the two-term lesson. The ladder of the terms themselves would show nothing.` },
    { type: 'check', scope: 'the ladder of the roots', questions: [
      { type: 'choice', q: 'The roots 2, 3, 5, 8, 13 have gaps 1, 2, 3, 5. What do the gaps copy?', options: ['the roots two places back', 'the counting numbers', 'the roots one place back'], answer: 0, traps: { 1: '5 follows 3 in the gaps, not 4', 2: 'the gap into 13 is 5, not 8' }, explain: 'The Fibonacci fingerprint: each gap is the root two places back.' },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'as a product', 'left factor', 'right factor'], rows: E2.slice(0, 5).map((v, i) => [String(v), form('prod', 1, i), String(FIB[i + 1]), String(FIB[i + 2])]) }, caption: `${seq(E2.slice(0, 5))}: each term is two neighbouring Fibonacci numbers multiplied, and each right factor becomes the next left factor. Next: ${form('prod', 1, 5)} = ${E2[5]}.` },
    { type: 'check', scope: 'products of Fibonacci neighbours', questions: [
      { make: (rng) => { const p = draw(rng, 'prod'), xs = fsq('prod', p.s, 0, 7); return num(nextQ(xs.slice(0, 6)), xs[6], `Factors ${xs.slice(0, 6).map((_, i) => form('prod', p.s, i)).join(', ')}; next ${form('prod', p.s, 6)} = ${xs[6]}.`, ['Write each term as two close factors.', 'The next pair starts with the last right factor.']); } },
    ] },

    S('derivation'),
    { type: 'text', text: `The moves on ${seq(E3.slice(0, 6))}: these are not squares (${E3.find((v) => [2, 3, 7, 8].includes(v % 10))} ends in ${E3.find((v) => [2, 3, 7, 8].includes(v % 10)) % 10}, and no square does), so try neighbour products with a constant. Add ${-E3c} back: ${seq(E3.slice(0, 6).map((v) => v - E3c))} = ${E3.slice(0, 4).map((_, i) => form('prod', 2, i)).join(', ')}, …, Fibonacci neighbours. Next: ${form('prod', 2, 6)}${shift(E3c)} = ${E3[6]}.` },
    { type: 'steps', steps: [
      { answers: 'ladder', say: 'If no ladder row settles, test for perfect squares. If the terms sit 1, 2 or 3 away from squares, remove that constant first.', why: 'A shared constant hides the structure; it is the same move as in the squares lesson.',
        checks: [
          { make: (rng) => { let p; do p = draw(rng, 'sq'); while (!p.c); const xs = p.xs.slice(0, 6); return num(`Every term of ${seq(xs)} is a perfect square plus the same constant. What is the constant?`, p.c, `${p.c < 0 ? 'Add' : 'Subtract'} ${Math.abs(p.c)}: ${seq(xs.map((v) => v - p.c))}, the squares of ${seq(FIB.slice(p.s, p.s + 6))}.`, ['Find the nearest square to one of the larger terms.', 'The constant is term − square; check it on another term.']); } },
        ] },
      { say: 'Take the square roots (or split each term into two neighbouring factors).', why: 'The roots or factors are the hidden list; recovering them is the whole solution.',
        checks: [
          { make: (rng) => { const p = draw(rng, 'sq'), xs = fsq('sq', p.s, 0, 6), i = rng.int(3, 5); return num(`${seq(xs)}: what is the square root of the term ${xs[i]}?`, FIB[i + p.s], `${FIB[i + p.s]}² = ${xs[i]}.`); } },
        ] },
      { answers: 'terms-add', say: 'Check the roots: each is the sum of the two before it, so they are Fibonacci numbers.', why: 'Recognising the inner list tells you how to continue it.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), s = rng.int(1, 6), b = rng.int(2, 6); const roots = yes ? FIB.slice(s, s + 5) : Array.from({ length: 5 }, (_, i) => b + i); return pick(rng, `The square roots of a sequence are ${seq(roots)}. Are they Fibonacci numbers?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? `${roots[2]} + ${roots[3]} = ${roots[4]}: each is the sum of the two before` : `${roots[2]} + ${roots[3]} = ${roots[2] + roots[3]}, not ${roots[4]}: these just count up`]], yes ? 'They add like Fibonacci.' : 'Counting roots: that is the squares lesson.'); } },
        ] },
      { answers: 'root-only', say: 'Extend the inner list by one Fibonacci step, reapply the operation (square, or multiply the neighbours), then add the constant back.', why: 'The same three operations built every shown term, so they build the next one.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `${off(p)}the inner list is ${p.k === 'sq' ? 'squares' : 'products'} of Fibonacci numbers; next ${form(p.k, p.s, 6)}${shift(p.c)} = ${xs[6]}.`, ['Remove any constant, then take roots or factors.', 'One Fibonacci step, then square (or multiply) and add the constant back.']); } },
        ] },
    ] },
    { type: 'text', text: `Square or product? Try the square root of a middle term first. A whole-number root means squares; a root between two whole numbers means try two neighbouring factors (${FIB[4]} × ${FIB[5]} = ${FIB[4] * FIB[5]} lies between ${Math.floor(Math.sqrt(FIB[4] * FIB[5]))}² and ${Math.floor(Math.sqrt(FIB[4] * FIB[5])) + 1}²). The constant, if any, shows up as the same small gap to the nearest square or product on every term.` },
    { type: 'check', scope: 'square or product', questions: [
      { type: 'choice', q: 'A middle term is 104, and √104 ≈ 10.2. What do you try?', options: ['factors: 104 = 8 × 13', 'squares: 104 = 10² + 4', 'primes: 104 is prime'], answer: 0, traps: { 1: 'a root between whole numbers means try neighbouring factors first', 2: '104 is even' }, explain: '8 and 13 are Fibonacci neighbours.' },
    ] },
    { type: 'explain', prompt: 'Why do the terms themselves not follow the Fibonacci rule, even though the roots do?', model: 'The Fibonacci rule is additive: root(n) = root(n − 1) + root(n − 2). Squaring does not respect addition: (a + b)² = a² + 2ab + b², not a² + b². So the terms, which are the squared roots, do not add up to each other; only the roots do.', points: ['The rule lives in the roots', 'Squaring breaks addition: (a + b)² is not a² + b²', 'So test the Fibonacci rule on roots or factors, never on the terms'] },

    S('worked'),
    { type: 'worked', family: 'fibonacci-squares', section: 'nl', difficulty: 4, seed: 'a', explainAt: [1, 2], intro: 'Squares or products of Fibonacci numbers. Recover the inner list before opening the solution.' },
    { type: 'worked', family: 'fibonacci-squares', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'The inner list is given; extending it and reapplying the operation are yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? Predict the next square root, then the term.`, answer: `Root ${FIB[6]} (${FIB[4]} + ${FIB[5]}), term ${FIB[6]}² = ${PRED[6]}.`, explain: `The roots are ${seq(FIB.slice(0, 6))}. Adding the last two terms instead would give ${PRED[4] + PRED[5]}.` },

    S('traps'),
    { type: 'traps', family: 'fibonacci-squares', section: 'nl', extra: [
      { belief: 'Add the last two terms (Fibonacci on the terms).', fix: 'Only the roots add. The terms are squares, and squares do not add that way.' },
      { belief: 'The answer is the next Fibonacci number.', fix: 'That is the next root. Square it (or multiply it by its neighbour) and add any constant.' },
      { belief: 'The roots count up by 1.', fix: 'Check two roots: if they add like Fibonacci, the next root is their sum, not one more.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `The terms are squares: roots ${seq(FIB.slice(3, 9))}.`,
      'The roots are Fibonacci numbers: each is the sum of the two before.',
      `So the terms follow the same rule: ${ERR[4]} + ${ERR[5]} = ${ERR[4] + ERR[5]}.`,
      `Answer: ${ERR[4] + ERR[5]}.`,
    ], errorStep: 2, explain: `The rule belongs to the roots, not the terms: the next root is ${FIB[7]} + ${FIB[8]} = ${FIB[9]}, so the next term is ${FIB[9]}² = ${ERR[6]}. Test the belief on shown terms: ${ERR[0]} + ${ERR[1]} = ${ERR[0] + ERR[1]}, not ${ERR[2]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), xs = p.xs, s = p.s, f = FIB[s + 6], h = FIB[s + 7]; return pick(rng, nextQ(xs.slice(0, 6)), xs[6], [[xs[4] + xs[5], 'added the last two terms; only the roots (factors) add'], [(p.k === 'sq' ? f : h) + p.c, p.k === 'sq' ? `found the next root ${f} but forgot to square it` : `gave the next factor ${h} instead of the product ${f} × ${h}`], [(p.k === 'sq' ? (f + 1) ** 2 : f * f) + p.c, p.k === 'sq' ? `squared ${f + 1}; the next root is ${f}` : `squared ${f} instead of multiplying the neighbours ${f} × ${h}`], ...(p.c ? [[val(p.k, s, 6), `dropped the constant ${sgn(p.c)}`]] : [])], `${form(p.k, s, 6)}${shift(p.c)} = ${xs[6]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the Fibonacci numbers to 233 (${seq(FIB.slice(0, 13))}) and their squares up to 144² = ${144 ** 2}. A term you recognise as a square of one of them gives the whole item away.` },
    { type: 'check', scope: 'recognising Fibonacci squares at speed', questions: [
      { make: (rng) => { const p = draw(rng, 'sq'), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `${off(p)}roots ${seq(FIB.slice(p.s, p.s + 6))}; next root ${FIB[p.s + 6]}; ${FIB[p.s + 6]}²${shift(p.c)} = ${xs[6]}.`, ['Are the terms squares, or squares plus a small constant?', 'Continue the roots by the Fibonacci rule.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'For large terms, use the last digit: squares end only in 0, 1, 4, 5, 6 or 9. A term ending in 2, 3, 7 or 8 is not a square, so try a product of neighbours or a constant shift.' },
    { type: 'thinkaloud', problem: nextQ(E1.slice(0, 6)), lines: [
      { t: 0, say: `Growth looks Fibonacci-like: ${E1[4]} + ${E1[5]} = ${E1[4] + E1[5]}.`, slip: true },
      { t: 4, say: `Check a shown step: ${E1[3]} + ${E1[4]} = ${E1[3] + E1[4]}, not ${E1[5]}. The terms do not add. Each is ${E1c} more than a square: ${seq(E1.slice(0, 6).map((v) => v - E1c))}.` },
      { t: 10, say: `Roots ${seq(FIB.slice(1, 7))}: those add, ${FIB[4]} + ${FIB[5]} = ${FIB[6]}. Fibonacci roots.` },
      { t: 15, say: `Next root ${FIB[5]} + ${FIB[6]} = ${FIB[7]}. Square: ${FIB[7] ** 2}. Add the ${E1c} back: ${E1[6]}.` },
      { t: 19, say: `${FIB[7] ** 2} alone forgets the constant; ${E1[4] + E1[5]} was the adding trap. Answer ${E1[6]}.` },
    ] },
    { type: 'check', scope: 'the last digit, and the think-aloud', questions: [
      { type: 'choice', q: 'A large term ends in 7. What does that rule out?', options: ['a plain square', 'a product of neighbours', 'a constant shift'], answer: 0, traps: { 1: 'products of neighbours can end in 7 (89 × 233 = 20737)', 2: 'a shift can move the last digit anywhere' }, explain: 'Squares end only in 0, 1, 4, 5, 6 or 9.' },
      { type: 'choice', q: 'In the think-aloud, the first try added 65 + 170. What showed it was wrong?', options: ['26 + 65 = 91, not 170', 'the terms are primes', '170 is a square'], answer: 0, traps: { 1: '26 and 65 are not prime', 2: '170 = 169 + 1, one more than a square' }, explain: 'A shown step broke the adding rule; the roots added instead: 21² + 1 = 442.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'No row settles, terms are (near-)squares or neighbour products → remove the constant, recover the Fibonacci roots, extend by one, reapply, add the constant back.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Inner list', 'Operation', 'Next'], rows: [
      [seq(SQ.slice(0, 5)), seq(SQ.slice(0, 5).map(Math.sqrt)), 'square (counting roots)', String(SQ[5])],
      [seq(CH.slice(0, 5)), seq(FIB.slice(2, 7)), 'square (Fibonacci roots)', String(CH[5])],
      [seq(E2.slice(0, 5)), seq(FIB.slice(1, 7)), 'multiply neighbours', String(E2[5])],
      [seq(fibl(4, 9, 5)), 'none: the terms add', 'last + previous', String(fibl(4, 9, 6)[5])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 6))}, ? (squares of ${seq(FIB.slice(2, 8))}, next ${CH[6]})`, rows: [
      { change: 'Add 2 to every term', effect: `The roots do not change; remove the 2, square, add it back: ${CH[6] + 2}.` },
      { change: 'Multiply neighbours instead of squaring', effect: `${seq(fsq('prod', 2, 0, 6))}: next ${form('prod', 2, 6)} = ${fsq('prod', 2, 0, 7)[6]}.` },
      { change: 'The roots start one Fibonacci number later', effect: `${seq(fsq('sq', 3, 0, 6))}: next ${FIB[9]}² = ${fsq('sq', 3, 0, 7)[6]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the last two roots are still ${FIB[6]} and ${FIB[7]}, so the next term is still ${CH[6]}.` },
      { change: 'Multiply neighbours and add 2 to every term', fusion: true, effect: `The operation changes (neighbour products) and the shift sits on top of it: ${seq(fsq('prod', 2, 2, 6))}, next ${form('prod', 2, 6)} + 2 = ${fsq('prod', 2, 2, 7)[6]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: the list can start 1, 1, 4, 9 (${seq(PRED.slice(0, 4))}), with a repeated first term. The neighbour products equal running sums of the squares (${seq(fsq('prod', 0, 0, 5))} = ${fsq('sq', 0, 0, 5).map((_, i) => fsq('sq', 0, 0, i + 1).join(' + ')).join(', ')}), so both readings give the same next term.` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2), b = rng.int(2, 5), s = rng.int(1, 5); const xs = t === 0 ? fsq('sq', s, 0, 6) : t === 1 ? Array.from({ length: 6 }, (_, i) => (i + b) ** 2) : fsq('prod', s, 0, 6); const names = ['squares of Fibonacci numbers', 'squares of counting numbers', 'products of Fibonacci neighbours']; const trp = [[null, 'the roots add like Fibonacci; they do not count up by 1', 'the terms are perfect squares, not products of two different neighbours'], ['the roots count up by 1', null, 'the terms are perfect squares'], [`${xs[2]} is not a perfect square`, `${xs[2]} is not a perfect square`, null]]; return pick(rng, `${seq(xs)}: which description fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), t === 2 ? `${xs.slice(0, 3).map((_, i) => form('prod', s, i)).join(', ')}, …` : `Roots ${seq(xs.map(Math.sqrt))}.`); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: squares with Fibonacci sides tile a rectangle whose sides are neighbouring Fibonacci numbers, which is the picture behind the running-sum identity above. Whenever a list resists every test, look for a famous list under a simple operation.' },
    { type: 'transfer',
      near: { make: (rng) => { const s = rng.int(1, 6), xs = fsq('sq', s, 0, 7); return num(`Squares whose sides are consecutive Fibonacci numbers have areas ${seq(xs.slice(0, 6))}. What is the area of the next square?`, xs[6], `Sides ${seq(FIB.slice(s, s + 6))}; next side ${FIB[s + 6]}; area ${FIB[s + 6]}² = ${xs[6]}.`, ['Take the square root of each area.', 'Next Fibonacci side, then square it.']); } },
      far: { type: 'number', q: `Squares with sides ${seq(FIB.slice(0, 6))} fit together into one rectangle ${FIB[5]} wide. What is their total area?`, answer: fsq('sq', 0, 0, 6).reduce((a, b) => a + b, 0), explain: `${fsq('sq', 0, 0, 6).join(' + ')} = ${fsq('sq', 0, 0, 6).reduce((a, b) => a + b, 0)}, which is ${FIB[5]} × ${FIB[6]}: the running sum of Fibonacci squares is a product of neighbours.`, hints: ['Square each side.', 'Add the areas.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the rectangle?', options: ['Squares of Fibonacci numbers relate to neighbour products', 'The areas themselves follow the Fibonacci rule', 'The areas grow by a constant ratio each time', 'The areas have a constant second difference'], answer: 0, traps: { 1: `${FIB[3] ** 2} + ${FIB[4] ** 2} is not ${FIB[5] ** 2}`, 2: `the ratios ${fsq('sq', 2, 0, 5).slice(1).map((v, i) => (v / fsq('sq', 2, 0, 5)[i]).toFixed(2)).join(', ')} drift`, 3: `the second row ${seq(g(g(fsq('sq', 1, 0, 6))))} is not constant` }, explain: `The running sum of the squares equals F(n) × F(n + 1), the neighbour product of this lesson.` } },

    S('tryit'),
    { type: 'tryit', family: 'fibonacci-squares', section: 'nl', count: 3 },
  ],
};
