// NumberLogic family lesson: add the counting numbers (gaps m, 2m, 3m, ...). Every number shown is computed here.
import { S, neg, seq, diffs, ladderRows, nextQ, pick, num, arith, geo, tri } from './method-ladder.js';

// a(0) = a, gap i = m * (i + s): the generator's own parametrisation.
const addIdx = (a, m, s, n) => { const o = [a]; for (let i = 1; i < n; i++) o.push(o[i - 1] + m * (i + s)); return o; };
const g = (xs) => diffs(xs);
const mOf = (xs) => g(xs)[1] - g(xs)[0];

const CH = addIdx(10, 1, 0, 6);
const E1 = addIdx(3, 1, 2, 6);
const E2 = addIdx(7, 3, 1, 6);
const E5 = addIdx(4, 5, 0, 6);
const FIBLIKE = addIdx(2, 1, 0, 6);
const ERR = addIdx(20, 1, 2, 6);
const TRI = Array.from({ length: 6 }, (_, i) => tri(i + 1));
const AR = arith(5, 4, 5);
const FACT = [1, 2, 6, 24, 120];
const J = { last: 42, gaps: [7, 8, 9, 10] };
const Jsum = J.gaps.reduce((a, b) => a + b, 0);
const M3K = [2, 3, 4, 5], M3 = M3K.map((k) => 3 * k);

const easy = (rng, n) => addIdx(rng.int(0, 20), 1, rng.int(0, 4), n);
const hard = (rng, n) => addIdx(rng.int(-10, 30), rng.pick([2, 3, 5]), rng.int(0, 4), n);
const any = (rng, n) => (rng.chance(0.5) ? easy(rng, n) : hard(rng, n));
const TA = addIdx(15, 1, 3, 6), TAg = g(TA);
const E15 = E1.slice(0, 5), SHIFT = E1.map((v) => v + 97), TRIPLE = E1.map((v) => 3 * v), BOTH = E1.map((v) => 3 * v + 100);
const DOWN = [E1[0]]; for (let i = 0; i < 5; i++) DOWN.push(DOWN[i] + (g(E1)[3] - i));

export default {
  id: 'nl/add-index',
  book: 'nl',
  kind: 'family',
  family: 'add-index',
  title: 'Add 1, 2, 3, …: gaps that count',
  summary: 'Gaps that are consecutive numbers (or m, 2m, 3m) → the next gap is the next number in the count.',
  prerequisites: ['nl/method-ladder', 'nl/second-diff'],
  objectives: [
    'Recognise gaps that count (5, 6, 7, 8) or count in multiples (6, 9, 12, 15)',
    'Read the next gap straight off the count, without a second row',
    'Jump several terms ahead with a sum of consecutive numbers',
    'Avoid adding the position number or skipping a gap',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once with the gaps of the gaps.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))}: the counting numbers, so the next gap is ${g(CH)[4]} and ${CH[4]} + ${g(CH)[4]} = ${CH[5]}. The second row (all ${mOf(CH)}) gives the same answer one step slower. This lesson is about seeing the count at a glance.`,
      attempts: [
        { id: 'second-row', label: 'Build the full second row', approach: `Wrote the gaps of the gaps (all ${mOf(CH)}) and climbed back up the ladder.`, breaksAt: 'Nothing breaks, but it is the slow road: the gap row already counts, so the next gap can be read straight off it.' },
        { id: 'repeat', label: 'Repeat the last gap', approach: `Added the last gap again: ${CH[4]} + ${g(CH)[3]} = ${CH[4] + g(CH)[3]}.`, breaksAt: `The gaps count up, so the last gap never repeats: after ${g(CH)[3]} comes ${g(CH)[4]}.` },
        { id: 'position', label: 'Add the position number', approach: `The next term is term 6, so added 6: ${CH[4]} + 6 = ${CH[4] + 6}.`, breaksAt: `The count lives in the gaps, not the positions: the gap into term 6 is ${g(CH)[4]}.` },
      ] },
    { type: 'text', text: `The gaps are **consecutive counting numbers** (1, 2, 3, 4 or 4, 5, 6, 7) or consecutive **multiples** of one number (${seq(M3)} are ${M3K.map((k) => `3 × ${k}`).join(', ')}). The terms can start anywhere.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E5.slice(0, 5))}, ?`] },
    { type: 'text', text: 'This is a special case of the second-difference family (the second difference is m). What makes it its own lesson is the faster read: you recognise the count in the gap row and never build the second row.' },
    { type: 'check', scope: 'the cue: the gaps count', questions: [
      { make: (rng) => { const x = any(rng, 5), a = arith(rng.int(1, 20), rng.int(2, 9), 5), gg = geo(rng.int(2, 5), 2, 5); return pick(rng, 'Which sequence has gaps that count (m, 2m, 3m, …)?', seq(x), [[seq(a), `its gaps ${seq(g(a))} do not change`], [seq(gg), `its gaps ${seq(g(gg))} double`]], `The gaps of ${seq(x)} are ${seq(g(x))}: consecutive multiples of ${mOf(x)}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Adding the counting numbers is the gentlest rule beyond a constant gap, and it appears early. Reading the count directly saves the second row and a few seconds. The same idea, "the gaps are a list you know", returns later with gaps that are squares, primes or powers of 2. It also builds the habit this whole book relies on: when the gaps look familiar, name the list they form and continue the list, not the terms.' },

    S('anchor'),
    { type: 'text', text: 'Constant gap: add the same d every step. This family changes **one thing**: the amount you add goes up by the same m every step, as when you count 1, 2, 3, … (m = 1) or count in threes (m = 3). You continue the count exactly as you continued a constant-gap sequence, because the gaps themselves form one.' },
    { type: 'check', scope: 'counting the gaps', questions: [
      { make: (rng) => { const m = rng.pick([1, 2, 3, 5]), s0 = rng.int(1, 5), gs = Array.from({ length: 5 }, (_, i) => m * (s0 + i)); return num(`The gaps of a sequence are ${seq(gs.slice(0, 4))}. What is the next gap?`, gs[4], `They count in steps of ${m}: ${gs[3]} + ${m} = ${gs[4]}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Write the gaps under the terms: the gap row counts. Drawn as bars, the gaps form a **staircase**: each step one m taller than the last. The next term adds the next, taller stair. Stairs that grow evenly are this family; stairs that double in height belong to the lesson where the gaps multiply, so the picture alone separates the two.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1, 1), predicted: true }, caption: `${seq(E1.slice(0, 5))}: gaps ${seq(g(E1.slice(0, 5)))} count up by 1. The outlined cells: next gap ${g(E1)[4]}, next term ${E1[4]} + ${g(E1)[4]} = ${E1[5]}.` },
    { type: 'diagram', diagram: 'bar', spec: { title: `Gaps of ${seq(E2.slice(0, 6))}`, xLabel: 'step', yLabel: 'gap', categories: g(E2).map((_, i) => `${i + 1}`), series: [{ name: 'gap', values: g(E2) }], valueLabels: true }, caption: `A staircase of multiples of ${mOf(E2)}: ${seq(g(E2))}. Each stair is ${mOf(E2)} taller than the one before; the last bar is the gap into the next term.` },
    { type: 'check', scope: 'the staircase', questions: [
      { make: (rng) => { const xs = any(rng, 6); return num(`${seq(xs.slice(0, 5))}, ? What is the next gap?`, g(xs)[4], `Gaps ${seq(g(xs).slice(0, 4))} count in ${mOf(xs)}s: next ${g(xs)[4]}.`, ['Write the gaps.', 'Each gap is the same amount bigger than the last.']); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'List the gaps, later minus earlier.', why: 'The pattern lives in the gaps, not in the terms, which can start anywhere.',
        checks: [
          { make: (rng) => { const xs = any(rng, 5); return num(`${seq(xs)}: what is the third gap?`, g(xs)[2], `Gaps ${seq(g(xs))}; the third is ${neg(xs[3])} − ${neg(xs[2])} = ${g(xs)[2]}.`); } },
        ] },
      { answers: 'second-row', say: 'Recognise the count: consecutive numbers (m = 1) or consecutive multiples of m. m is the difference between neighbouring gaps.', why: 'Gaps m(k), m(k + 1), m(k + 2), … step by m each time; spotting m tells you how the count continues.',
        checks: [
          { make: (rng) => { const xs = hard(rng, 5); return num(`The gaps of ${seq(xs)} count in multiples of which number?`, mOf(xs), `Gaps ${seq(g(xs))}: each is ${mOf(xs)} more than the last, so m = ${mOf(xs)}.`, ['Write the gaps.', 'How much does each gap grow by?']); } },
        ] },
      { answers: 'repeat', say: 'Next gap = last gap + m: the next number in the count.', why: 'The count does not skip: after 4m comes 5m.',
        checks: [
          { make: (rng) => { const xs = hard(rng, 6); return num(`${seq(xs.slice(0, 5))}, ? What is the next gap?`, g(xs)[4], `${g(xs)[3]} + ${mOf(xs)} = ${g(xs)[4]}.`, ['Find the gaps and their step m.', 'Add m to the last gap.']); } },
        ] },
      { answers: 'position', say: 'Next term = last term + next gap.', why: 'Every term is the previous term plus its gap, and the gap comes from the count, not from the position number of the new term.',
        checks: [
          { make: (rng) => { const xs = any(rng, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Next gap ${g(xs)[4]}: ${neg(xs[4])} + ${g(xs)[4]} = ${neg(xs[5])}.`, ['The gaps count.', `Add the next gap to ${neg(xs[4])}.`]); } },
        ] },
      { say: 'A blank in the middle: the gaps on either side of it are the two missing counts. Blank = left neighbour + the next count after the gap before it.', why: 'The count is the same on both sides of the blank, so the right neighbour checks it.',
        checks: [
          { make: (rng) => { const xs = easy(rng, 5), k = rng.int(2, 3); return num(`Which number replaces the question mark?  ${xs.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, xs[k], `The gaps count by 1: gap into the blank = ${g(xs)[k - 2]} + 1 = ${g(xs)[k - 1]}, so ${neg(xs[k - 1])} + ${g(xs)[k - 1]} = ${neg(xs[k])}; then ${neg(xs[k])} + ${g(xs)[k]} = ${neg(xs[k + 1])} checks.`, ['Find the gaps you can see left of the blank.', 'Continue the count into the blank.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E2, 2), predicted: true }, caption: `The fallback for the same moves: ${seq(E2.slice(0, 5))} has second row ${mOf(E2)} every time, exactly m. Reading the count gives the outlined gap ${g(E2)[4]} directly; the ladder confirms it.` },
    { type: 'text', text: 'The count is harder to see when it starts high (gaps 13, 14, 15) or counts in an unusual multiple (gaps 35, 42, 49 are multiples of 7). Test the step between neighbouring gaps: if it is the same every time, you have the count, whatever it starts from. If the step between gaps is not constant, this lesson does not apply: the gaps may double, repeat earlier terms or be squares, and the method ladder sends you on.' },
    { type: 'explain', prompt: 'Why is "add 1, then 2, then 3, …" the same as a constant second difference, and why can you skip the second row here?', model: 'Consecutive counting numbers differ by 1, so the gaps of the gaps are all 1 (all m for multiples of m): that is a constant second difference. Because you recognise the count directly in the gap row, you can read the next gap without writing the second row.', points: ['Neighbouring gaps differ by m, so the second difference is m', 'The count itself tells you the next gap', 'The second row is still the fallback check'] },

    S('worked'),
    { type: 'worked', family: 'add-index', section: 'nl', difficulty: 1, seed: 'a', explainAt: [1], intro: 'Gaps that count by 1. Read the count before opening the solution.' },
    { type: 'worked', family: 'add-index', section: 'nl', difficulty: 2, seed: 'b', fade: 1, intro: 'Gaps that count in multiples. The gaps are given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(FIBLIKE.slice(0, 5))}, ? The start looks like "add the last two terms". Predict which rule is right and the next term.`, answer: `The gaps ${seq(g(FIBLIKE.slice(0, 5)))} count, so the next gap is ${g(FIBLIKE)[4]} and the term is ${FIBLIKE[5]}. "Add the last two" fails at ${FIBLIKE[2]} + ${FIBLIKE[3]} = ${FIBLIKE[2] + FIBLIKE[3]}, not ${FIBLIKE[4]}.`, explain: 'Test every candidate rule on every step: early coincidences are how test writers build wrong options.' },

    S('traps'),
    { type: 'traps', family: 'add-index', section: 'nl', extra: [
      { belief: 'The gap to add is the position number of the next term.', fix: 'The next gap is the next number in the gap count. It equals the position only when the count happens to start at 1.' },
      { belief: 'The next gap is two steps up the count (a skipped gap).', fix: 'The count moves one step at a time: last gap + m.' },
      { belief: 'The first few terms fit "add the last two", so that is the rule.', fix: 'Check the candidate on every shown step; one failure kills it.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 5)))}.`,
      'The gaps count up by 1.',
      `The next term is term 6, so add 6: ${ERR[4]} + 6 = ${ERR[4] + 6}.`,
      `Answer: ${ERR[4] + 6}.`,
    ], errorStep: 2, explain: `The next gap continues the count ${seq(g(ERR.slice(0, 5)))}: it is ${g(ERR)[4]}, not the position 6. So ${ERR[4]} + ${g(ERR)[4]} = ${ERR[5]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { let xs; do xs = any(rng, 7); while (g(xs)[4] === 6); const l = xs[4], lg = g(xs)[3], m = mOf(xs); return pick(rng, nextQ(xs.slice(0, 5)), xs[5], [[l + lg, 'repeated the last gap; the gaps count up'], [l + lg + 2 * m, 'skipped a number in the count'], [l + 6, 'added the position number 6 instead of the next gap'], [xs[6], 'went one step too far: that is the term after the next one']], `Next gap ${lg} + ${m} = ${lg + m}; ${neg(l)} + ${lg + m} = ${neg(xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Read the count, not the second row: once the gaps say "${seq(J.gaps)}", the next gap is ${J.gaps[3] + 1} with no subtraction. Target: under 15 seconds.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps: ${seq(TAg.slice(0, 4))}. They count up by 1.` },
      { t: 4, say: `So add the counting number of the next term: it is term 6, so ${TA[4]} + 6 = ${TA[4] + 6}.`, slip: true },
      { t: 7, say: `Wait: the count is in the gaps, not the positions. This count started at ${TAg[0]}, so after ${TAg[3]} comes ${TAg[4]}.` },
      { t: 10, say: `${TA[4]} + ${TAg[4]} = ${TA[5]}.` },
      { t: 13, say: `Check: ${TA[5]} − ${TA[4]} = ${TAg[4]} continues ${seq(TAg.slice(0, 4))}. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: continue the count, not the position', questions: [
      { make: (rng) => { const xs = addIdx(rng.int(0, 30), 1, rng.int(3, 9), 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Gaps ${seq(g(xs).slice(0, 4))} count by 1, so the next gap is ${g(xs)[4]} (not the position 6): ${xs[4]} + ${g(xs)[4]} = ${xs[5]}.`, ['Write the gaps and read the count.', `The count continues from ${g(xs)[3]}.`]); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Jump ahead with a sum: k terms ahead = last + (sum of the next k gaps), and a run of evenly spaced numbers sums to (first + last) × how many ÷ 2. From ${J.last} with next gaps ${seq(J.gaps)}: ${J.last} + (${J.gaps[0]} + ${J.gaps[3]}) × ${J.gaps.length} ÷ 2 = ${J.last + Jsum}.` },
    { type: 'check', scope: 'jumping ahead with a sum', questions: [
      { make: (rng) => { const xs = any(rng, 9), k = rng.int(3, 4), gs = g(xs).slice(4, 4 + k); return num(`${seq(xs.slice(0, 5))}, … What is the term ${k} places after ${neg(xs[4])}?`, xs[4 + k], `Next gaps ${seq(gs)}, sum (${gs[0]} + ${gs[k - 1]}) × ${k} ÷ 2 = ${gs.reduce((a, b) => a + b, 0)}; ${neg(xs[4])} + ${gs.reduce((a, b) => a + b, 0)} = ${neg(xs[4 + k])}.`, ['List the next few gaps by continuing the count.', '(first + last) × how many ÷ 2, then add to the last term.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Gaps m, 2m, 3m, … (a count) → next gap = last gap + m; next term = last + next gap.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Pattern', 'Next'], rows: [
      [seq(AR), seq(g(AR)), 'constant gap', String(AR[4] + g(AR)[0])],
      [seq(E1.slice(0, 5)), seq(g(E1.slice(0, 5))), 'gaps count by 1', String(E1[5])],
      [seq(E2.slice(0, 5)), seq(g(E2.slice(0, 5))), `gaps count in ${mOf(E2)}s`, String(E2[5])],
      [seq(FACT), seq(g(FACT)), 'ratios 2, 3, 4, 5: multiply by the count instead', String(FACT[4] * 6)],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: starting at 1 with gaps 2, 3, 4, … gives the triangular numbers ${seq(TRI)}; gaps in odd numbers 3, 5, 7, … (count in 2s) give the squares. A count can also start high: gaps 11, 12, 13 are still m = 1.` },
    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: running totals of 1, 2, 3, … appear whenever you count pairs or build a tent of counts, as in the two-dice sums in Beat the Odds, whose partial totals from the top are ${seq(TRI.slice(0, 5))}.` },
    { type: 'variation', base: `${seq(E15)}, ?  Gaps ${seq(g(E15))} count by 1; next ${E1[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E15.slice(1))}, ?`, effect: `Still ${E1[5]}. The gaps ${seq(g(E15.slice(1)))} still count by 1 and the last term has not moved.` },
      { change: `Start from ${SHIFT[0]} with the same gaps: ${seq(SHIFT.slice(0, 5))}, ?`, effect: `${SHIFT[5]}. The start shifts every term by the same amount; the gap count, and so the next gap ${g(E1)[4]}, is untouched.` },
      { change: `Triple every term: ${seq(TRIPLE.slice(0, 5))}, ?`, effect: `${TRIPLE[5]}. Every gap triples to ${seq(g(TRIPLE.slice(0, 5)))}: a count in 3s (m = 3), so the next gap is ${g(TRIPLE)[4]}.` },
      { change: `Count down instead: gaps ${seq(g(DOWN.slice(0, 5)))}, list ${seq(DOWN.slice(0, 5))}, ?`, effect: `${DOWN[5]}. m = −1: the count still moves one step, down this time, so the next gap is ${g(DOWN)[4]}.` },
      { fusion: true, change: `Triple every term, then add 100: ${seq(BOTH.slice(0, 5))}, ?`, effect: `${BOTH[5]}. The tripling makes it a count in 3s (gaps ${seq(g(BOTH.slice(0, 5)))}); the 100 vanishes in every gap, so the next gap is still ${g(BOTH)[4]}.` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const f = rng.int(1, 3), xs = t === 0 ? arith(rng.int(1, 20), rng.int(2, 9), 5) : t === 1 ? any(rng, 5) : FACT.map((v) => v * f); const names = ['add the same number each step', 'add the next counting number', 'multiply by the next counting number']; const tr = [[null, 'the gaps do not count; they are all equal', 'the ratios do not count up'], ['the gaps change; they count', null, 'the ratios are not whole numbers'], ['the gaps grow far too fast for addition', 'the gaps are not a count; the ratios are', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, tr[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
      { type: 'choice', q: 'First term 1, then gaps 2, 3, 4, 5, …: which famous list is this?', options: ['the triangular numbers', 'the square numbers', 'the powers of two', 'the prime numbers'], answer: 0, traps: { 1: 'squares have odd gaps 3, 5, 7', 2: 'powers of 2 have doubling gaps', 3: 'primes have irregular gaps' }, explain: `${seq(TRI.slice(0, 5))}, …: running totals of the counting numbers, n(n + 1)/2.` },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(7, 11); return num(`People enter a room one at a time, and each newcomer shakes hands with everyone already inside. The running totals of handshakes are ${seq(Array.from({ length: 5 }, (_, i) => tri(i)))} after 1 to 5 people. How many handshakes after ${n} people?`, tri(n - 1), `The totals grow by 1, 2, 3, 4, …: the k-th person adds k − 1. After ${n} people: 1 + 2 + … + ${n - 1} = (1 + ${n - 1}) × ${n - 1} ÷ 2 = ${tri(n - 1)}.`, ['Write the gaps between the running totals.', `Sum the count 1 + 2 + … + ${n - 1} with (first + last) × how many ÷ 2.`]); } },
      far: { make: (rng) => { const k = rng.int(4, 7); return num(`Two fair dice are thrown. In how many of the 36 equally likely outcomes is the sum at most ${k}?`, tri(k - 1), `Sum 2 has 1 way, sum 3 has 2, sum 4 has 3: the ways count up by 1 (up to sum 7). At most ${k}: 1 + 2 + … + ${k - 1} = ${tri(k - 1)}.`, ['Count the ways for sums 2, 3, 4, … one at a time.', 'The counts go 1, 2, 3, …: add them up.']); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the handshakes and the dice?', options: [
        'each step adds one more than the step before',
        'each step adds the same amount as the one before',
        'each value is the sum of the two values before it',
        'each step adds the position number of the new value',
      ], answer: 0, traps: { 1: 'the handshakes per newcomer and the ways per sum both go up by one each time', 2: 'no step looks back two values; the step itself grows by one', 3: 'the fifth person adds 4 handshakes, not 5: the step comes from the count, not the position' }, explain: 'Handshake totals and "sum at most k" counts are running totals of 1, 2, 3, …: gaps that count, summed.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'add-index', section: 'nl', count: 3 },
  ],
};
