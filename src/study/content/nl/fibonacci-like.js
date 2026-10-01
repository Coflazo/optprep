// NumberLogic family lesson: each term is the sum of the previous two. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, ratio, nextQ, pick, num, geo, fibl, round2 } from './method-ladder.js';

const g = (xs) => diffs(xs);
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const trib = (a, b, c, n) => { const o = [a, b, c]; while (o.length < n) o.push(o[o.length - 1] + o[o.length - 2] + o[o.length - 3]); return o; };
const wtd = (a, b, n) => { const o = [a, b]; while (o.length < n) o.push(2 * o[o.length - 1] + o[o.length - 2]); return o; };
const prod = (a, b, n) => { const o = [a, b]; while (o.length < n) o.push(o[o.length - 1] * o[o.length - 2]); return o; };
const addIdx = (a, n) => { const o = [a]; while (o.length < n) o.push(o[o.length - 1] + o.length); return o; };

const CH = fibl(3, 8, 7);
const E1 = fibl(2, 5, 7);
const NEG = fibl(-3, 5, 7);
const MISS = fibl(3, 4, 6);
const ERR = fibl(2, 5, 7);
const LONG = fibl(2, 7, 10);
const TR = trib(1, 1, 2, 6), WT = wtd(1, 3, 5), PR = prod(1, 2, 5);
const AI = addIdx(1, 6);

// Level 2 and level 3 starts, as in the generator; equal or doubled starts make a plain
// multiple of Fibonacci, which also fits other rules, so they are redrawn.
const pair = (rng) => { let a, b; do { if (rng.chance(0.5)) { a = rng.int(1, 9); b = rng.int(1, 9); } else { a = rng.int(-6, 15); b = rng.int(4, 20); } } while (a === b || b === 2 * a || a === 0); return [a, b]; };
const fresh = (rng, n) => fibl(...pair(rng), n);
const TA = fibl(4, 7, 7), TA3 = TA[3] + TA[4] + TA[5];
const E16 = E1.slice(0, 6), DB = E1.map((v) => 2 * v), UP1 = E1.map((v) => v + 1), ST = fibl(E1[0], 6, 7), BOTH = E1.map((v) => 2 * v + 1);
const stairs = (n) => { const w = [1, 2]; while (w.length < n) w.push(w[w.length - 1] + w[w.length - 2]); return w[n - 1]; };

export default {
  id: 'nl/fibonacci-like',
  book: 'nl',
  kind: 'family',
  family: 'fibonacci-like',
  title: 'Add the previous two terms',
  summary: 'When the gaps repeat the sequence two places back, each term is the sum of the two before it.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic'],
  objectives: [
    'Recognise a two-term sum from any starting pair, not only 1, 1, 2, 3, 5',
    'Confirm it on two steps before answering',
    'Fill a missing middle term by adding or subtracting neighbours',
    'Tell it apart from three-term sums, weighted sums and doubling',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with the gaps, once by adding neighbouring terms.`, answer: String(CH[6]), explain: `Gaps ${seq(g(CH.slice(0, 6)))}: from the second gap on, they repeat the terms ${seq(CH.slice(0, 4))}. Adding: ${CH[2]} + ${CH[3]} = ${CH[4]}, ${CH[3]} + ${CH[4]} = ${CH[5]}, so the next is ${CH[4]} + ${CH[5]} = ${CH[6]}.`,
      attempts: [
        { id: 'gap-pattern', label: 'Hunt for a gap pattern', approach: `Wrote the gaps ${seq(g(CH.slice(0, 6)))} and looked for them to double or grow steadily.`, breaksAt: 'The gaps have no pattern of their own: they repeat the terms two places back, so the rule lives in the terms.' },
        { id: 'one-sum', label: 'Trust one matching sum', approach: `Saw ${CH[0]} + ${CH[1]} = ${CH[2]} and answered without checking further.`, breaksAt: 'It holds here, but one sum near the start fits many rules. A second, later sum is the proof.' },
        { id: 'three', label: 'Add the last three', approach: `Added ${CH[3]} + ${CH[4]} + ${CH[5]} = ${CH[3] + CH[4] + CH[5]}.`, breaksAt: `Test the window on a shown step: ${CH[1]} + ${CH[2]} + ${CH[3]} = ${CH[1] + CH[2] + CH[3]}, not ${CH[4]}. The window is two terms.` },
      ] },
    { type: 'text', text: `Each term is the **sum of the two terms before it**. The famous start is ${seq(fibl(1, 1, 7))}, but any two numbers can start the chain, including negatives and zero. After the start, the terms grow by roughly 1.6 times per step.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(NEG.slice(0, 6))}, ?`, `Which number replaces the question mark?  ${seq(MISS.slice(0, 3))}, ?, ${seq(MISS.slice(4))}`] },
    { type: 'text', text: 'Not this lesson: sums of the previous **three** terms, weighted sums such as 2 × last + previous, or products of the last two. Those are later lessons, and the two-step check below tells them apart in seconds.' },
    { type: 'check', scope: 'the cue: each term is the sum of the two before', questions: [
      { make: (rng) => { const f = fresh(rng, 6), a = addIdx(rng.int(1, 5), 6), ge = geo(rng.int(2, 5), 2, 6); return pick(rng, 'In which sequence is every term the sum of the two before it?', seq(f), [[seq(a), `${a[2]} + ${a[3]} is not ${a[4]}: its gaps count up instead`], [seq(ge), `${ge[2]} + ${ge[3]} is not ${ge[4]}: it doubles`]], `${f[2]} + ${f[3]} = ${f[4]} and ${f[3]} + ${f[4]} = ${f[5]}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Two-term recurrences are a classic NumberLogic rule and appear in the middle of the test. Because any pair can start them, recognising 1, 1, 2, 3, 5 is not enough: you need a test that works on 4, 7, 11, 18 just as well. The same test, "does the gap row copy earlier terms?", is the starting point for the harder recurrences later in the test (three-term sums, weights, products).' },

    S('anchor'),
    { type: 'text', text: 'Constant gap: next = last + a fixed step. This family changes **one thing**: the step is not fixed; it is the **term before last**. "Next = last + step" still holds, with step = second-last term.' },
    { type: 'check', scope: 'next = last + second-last', questions: [
      { make: (rng) => { const b = rng.int(10, 60), a = rng.int(5, 40); return num(`The last term is ${b} and the term before it is ${a}. The rule adds the term before last to the last term. What comes next?`, a + b, `${b} + ${a} = ${a + b}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Write the gaps under the terms. The gap row is the sequence itself, shifted two places to the right: the gap into each term is the term two places back. The table view says the same thing as sums, and the ratio view shows the growth settling near 1.6.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1.slice(0, 6), 1) }, caption: `${seq(E1.slice(0, 6))}: gaps ${seq(g(E1.slice(0, 6)))}. From the second gap on they read ${seq(g(E1.slice(0, 6)).slice(1))}, the terms from the start again.` },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term n − 2', 'term n − 1', 'their sum', 'term n'], rows: E1.slice(2, 6).map((v, i) => [String(E1[i]), String(E1[i + 1]), String(E1[i] + E1[i + 1]), String(v)]) }, caption: 'Sum of the two before, against the actual term: the last two columns match on every row. Two matching rows are enough to answer.' },
    { type: 'check', scope: 'gaps copy the terms two places back', questions: [
      { make: (rng) => { const f = fresh(rng, 7); return num(nextQ(f.slice(0, 6)), f[6], `${f[4]} + ${f[5]} = ${f[6]}.`, ['Compare each gap with the terms.', 'Add the last two terms.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [LONG.slice(3, 9), LONG.slice(4, 9).map((v, i) => ratio(LONG[i + 3], v))] }, caption: `Ratios of a longer run: ${LONG.slice(4, 9).map((v, i) => round2(v / LONG[i + 3])).join(', ')}. Whatever the start, they settle near 1.618. Growth of about 1.6 per step with whole numbers is a strong hint of this family.` },

    { type: 'check', scope: 'growth near 1.6 per step', questions: [
      { make: (rng) => { const f = fibl(rng.int(2, 9), rng.int(10, 20), 10), L = f[8]; return pick(rng, `The last term of a long "add the previous two" run is ${L}. Without the earlier terms, which is closest to the next term?`, `about ${Math.round(1.6 * L)}`, [[`about ${2 * L}`, 'that is doubling; the ratio settles near 1.6, not 2'], [`about ${Math.round(1.25 * L)}`, 'too small: the ratio settles near 1.6']], `The next term is ${f[9]}, and ${f[9]} ÷ ${L} ≈ ${round2(f[9] / L)}.`); } },
    ] },
    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Write the gaps, later minus earlier.', why: 'The first test of the ladder, and the row you will compare with the terms.',
        checks: [
          { make: (rng) => { const f = fresh(rng, 6); return num(`${seq(f)}: what is the gap from ${neg(f[3])} to ${neg(f[4])}?`, f[4] - f[3], `${neg(f[4])} − ${par(f[3])} = ${neg(f[4] - f[3])}, which is also term 3.`); } },
        ] },
      { answers: 'gap-pattern', say: 'Compare the gap row with the terms. If each gap equals the term two places before it, the rule is "add the previous two".', why: 'a(n) − a(n − 1) = a(n − 2) is the same statement as a(n) = a(n − 1) + a(n − 2): move a(n − 1) to the other side.',
        checks: [
          { make: (rng) => { const f = fresh(rng, 6); return pick(rng, `The gaps of ${seq(f)} are ${seq(g(f))}. Which statement fits?`, 'each gap equals the term two places back', [['each gap is double the one before', `${g(f)[2]} is not 2 × ${g(f)[1]}`], ['the gaps grow by a fixed amount', `their differences ${seq(diffs(g(f)))} are not constant`]], `Gap ${g(f)[2]} into ${f[3]} equals term ${f[1]}; gap ${g(f)[3]} equals ${f[2]}.`); } },
        ] },
      { answers: 'one-sum', say: 'Confirm directly on two steps: term 3 + term 4 = term 5, and term 4 + term 5 = term 6.', why: 'One sum can match by coincidence near the start (1, 2, 3 fits many rules). Two matches make it safe.',
          checks: [
          { make: (rng) => { const yes = rng.chance(0.5); let xs; if (yes) xs = fresh(rng, 6); else { xs = fresh(rng, 5); xs.push(xs[4] + xs[3] + rng.pick([1, 2, -1])); } return pick(rng, `Is every term of ${seq(xs)} (from the third) the sum of the two before it?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every sum matches; recheck the additions' : `${xs[3]} + ${xs[4]} = ${xs[3] + xs[4]}, not ${xs[5]}: check every step, not only the first`]], `Sums: ${xs.slice(2).map((v, i) => `${par(xs[i])} + ${par(xs[i + 1])} = ${xs[i] + xs[i + 1]}`).join('; ')}.`); } },
        ] },
      { answers: 'three', say: 'Next = last + second-last.', why: 'The rule uses exactly the two previous terms, no more and no fewer.',
        checks: [
          { make: (rng) => { const f = fresh(rng, 7); return num(nextQ(f.slice(0, 6)), f[6], `${neg(f[4])} + ${neg(f[5])} = ${neg(f[6])}.`); } },
        ] },
      { say: 'A blank in the middle: the term after the blank is blank + the term before it, so blank = right neighbour − left neighbour. Confirm with the sum of the two terms before the blank.', why: 'The rule works in both directions: add forwards, subtract backwards.',
        checks: [
          { make: (rng) => { const f = fresh(rng, 6), k = rng.int(2, 4); return num(`Which number replaces the question mark?  ${f.map((v, i) => (i === k ? '?' : neg(v))).join(', ')}`, f[k], `${neg(f[k + 1])} − ${par(f[k - 1])} = ${neg(f[k])}, and ${par(f[k - 2])} + ${par(f[k - 1])} = ${neg(f[k])} confirms it.`, ['The term after the blank is the blank plus the term before it.', 'Right neighbour minus left neighbour.']); } },
        ] },
    ] },
    { type: 'text', text: 'Where the 1.6 comes from: if the ratio settles at some r, then next = r × last and last = r × second-last. Put that into next = last + second-last and divide by second-last: r × r = r + 1, whose positive solution is about 1.618. You never need the exact value. Use it as a size check: an option far from 1.6 × the last term is wrong before you add anything.' },
    { type: 'explain', prompt: 'Why does "each gap equals the term two places back" say the same thing as "each term is the sum of the previous two"?', model: 'The gap into term n is a(n) − a(n − 1). Saying it equals a(n − 2) means a(n) − a(n − 1) = a(n − 2), and adding a(n − 1) to both sides gives a(n) = a(n − 1) + a(n − 2).', points: ['Gap into term n = a(n) − a(n − 1)', 'Setting it equal to a(n − 2) and rearranging gives the sum rule', 'So the gap row is the sequence shifted by two'] },

    S('worked'),
    { type: 'worked', family: 'fibonacci-like', section: 'nl', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Small positive starts. Check two sums before opening the solution.' },
    { type: 'worked', family: 'fibonacci-like', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'Larger or negative starts. The check is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `A negative start: ${seq(NEG.slice(0, 6))}, ? Predict the next term.`, answer: `${NEG[4]} + ${NEG[5]} = ${NEG[6]}. The rule does not care about the sign of the start: ${par(NEG[0])} + ${NEG[1]} = ${NEG[2]} already fits.`, explain: 'Test the rule on every step, starting from the very first triple.' },

    S('traps'),
    { type: 'traps', family: 'fibonacci-like', section: 'nl', extra: [
      { belief: 'Add the last three terms.', fix: 'Check the window on a shown step: if two terms already give the next, a third would overshoot.' },
      { belief: 'The last two terms are close, so double the last term.', fix: 'Doubling only matches if the last two terms are equal. Add the two actual terms.' },
      { belief: 'The first sum matches, so the rule is proven.', fix: '1 + 2 = 3 fits many rules. Confirm on a second, later step.' },
    ] },
    { type: 'text', text: 'The wrong options in this family are built from slips like these: a three-term sum, a doubled last term, a repeated last gap. The rule behind each one fails on the shown terms, which is why the two-sum check comes before any answer.' },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 6)))}.`,
      'From the second gap on, the gaps repeat the earlier terms, so each term adds up earlier terms.',
      `Next = ${ERR[3]} + ${ERR[4]} + ${ERR[5]} = ${ERR[3] + ERR[4] + ERR[5]}.`,
      `Answer: ${ERR[3] + ERR[4] + ERR[5]}.`,
    ], errorStep: 2, explain: `Only the previous **two** terms are added: ${ERR[4]} + ${ERR[5]} = ${ERR[6]}. Check the window on a shown step: ${ERR[1]} + ${ERR[2]} + ${ERR[3]} = ${ERR[1] + ERR[2] + ERR[3]}, not ${ERR[4]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const f = fresh(rng, 8), a = f[5], b = f[4], c = f[3]; return pick(rng, nextQ(f.slice(0, 6)), f[6], [[a + b + c, 'added the previous three terms; the rule uses two'], [2 * a, 'doubled the last term instead of adding the one before it'], [a + (a - b), 'repeated the last gap; the gaps follow the terms'], [f[7], 'went one step too far: that is the term after the next one']], `${neg(b)} + ${neg(a)} = ${neg(f[6])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Test from the end: the last three terms are the largest and the least likely to match by coincidence. If second-last + third-last = last there, check one earlier triple and answer. Two additions, about ten seconds.' },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 6)), lines: [
      { t: 0, say: `Gaps ${seq(g(TA.slice(0, 6)))}: from the second on, they repeat the terms ${seq(TA.slice(0, 4))}.` },
      { t: 6, say: `So each term adds up the earlier ones: ${TA[3]} + ${TA[4]} + ${TA[5]} = ${TA3}.`, slip: true },
      { t: 10, say: `Test the window on a shown step: ${TA[2]} + ${TA[3]} + ${TA[4]} = ${TA[2] + TA[3] + TA[4]}, not ${TA[5]}. Two terms: ${TA[3]} + ${TA[4]} = ${TA[5]}. The window is two.` },
      { t: 15, say: `${TA[4]} + ${TA[5]} = ${TA[6]}.` },
      { t: 18, say: `Size check: ${TA[6]} ÷ ${TA[5]} ≈ ${round2(TA[6] / TA[5])}, near 1.6. Answer ${TA[6]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: test the window, then add', questions: [
      { make: (rng) => { const f = fresh(rng, 7); return num(nextQ(f.slice(0, 6)), f[6], `Window test: ${par(f[3])} + ${par(f[4])} = ${neg(f[5])}, so two terms. Next ${neg(f[4])} + ${par(f[5])} = ${neg(f[6])}.`, ['Test "previous two" on the last shown term.', 'Add the last two terms.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Two steps ahead with no gap row: after x, y come x + y and then x + 2y. Handy when the blank is one past the next term, or to double-check an answer.' },
    { type: 'check', scope: 'two steps ahead: x + y, then x + 2y', questions: [
      { make: (rng) => { const f = fresh(rng, 8); return num(`${seq(f.slice(0, 6))}, ?, ? What is the term **after** the next one?`, f[7], `x = ${neg(f[4])}, y = ${neg(f[5])}: x + 2y = ${neg(f[4])} + 2 × ${par(f[5])} = ${neg(f[7])}.`, ['Call the last two terms x and y.', 'The next two are x + y, then x + 2y.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Gaps repeat the terms two places back (check two sums) → next = last + second-last.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Test that works', 'Next'], rows: [
      [seq(E1.slice(0, 6)), `${E1[3]} + ${E1[4]} = ${E1[5]}: previous two`, String(E1[6])],
      [seq(TR), `${TR[2]} + ${TR[3]} + ${TR[4]} = ${TR[5]}: previous three`, String(TR[3] + TR[4] + TR[5])],
      [seq(WT), `2 × ${WT[3]} + ${WT[2]} = ${WT[4]}: weighted`, String(2 * WT[4] + WT[3])],
      [seq(PR), `${PR[2]} × ${PR[3]} = ${PR[4]}: product`, String(PR[3] * PR[4])],
      [seq(AI), `gaps ${seq(g(AI))} count: not a sum rule`, String(AI[5] + AI.length)],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: negative or zero starts are legal (${seq(NEG.slice(0, 5))}). An equal start pair (a, a) gives a times the classic list. And the rule runs backwards: the term before a, b is b − a.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: counting ways to climb stairs one or two steps at a time gives Fibonacci numbers, because the last move was a single step or a double step. Any "the next state depends on the last two" count, including coin-flip runs with no two heads in a row, has this shape.' },
    { type: 'variation', base: `${seq(E16)}, ?  ${E1[4]} + ${E1[5]} = ${E1[6]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E16.slice(1))}, ?`, effect: `Still ${E1[6]}. Every remaining term is still the sum of the two before it.` },
      { change: `Double every term: ${seq(DB.slice(0, 6))}, ?`, effect: `${DB[6]}. The rule survives: the sum of two doubled terms is the doubled sum.` },
      { change: `Add 1 to every term: ${seq(UP1.slice(0, 6))}, ?`, effect: `${UP1[6]}. The rule breaks: ${UP1[3]} + ${UP1[4]} = ${UP1[3] + UP1[4]}, not ${UP1[5]}. Each sum carries two shifts, so it becomes "add the previous two, then subtract 1".` },
      { change: `Change the start pair to ${E1[0]}, ${ST[1]}: ${seq(ST.slice(0, 6))}, ?`, effect: `${ST[6]}. Same rule, new chain: the start pair only decides which numbers appear.` },
      { fusion: true, change: `Double every term, then add 1: ${seq(BOTH.slice(0, 6))}, ?`, effect: `${BOTH[6]}. The doubling passes through the rule, the +1 breaks it: next = ${BOTH[4]} + ${BOTH[5]} − 1, which is 2 × ${E1[6]} + 1.` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const xs = t === 0 ? fresh(rng, 6) : t === 1 ? trib(rng.int(1, 3), rng.int(1, 4), rng.int(2, 6), 6) : wtd(rng.int(1, 4), rng.int(2, 6), 6); const names = ['sum of the previous two', 'sum of the previous three', '2 × last + previous']; const two = `${par(xs[3])} + ${par(xs[4])} = ${xs[3] + xs[4]}, not ${neg(xs[5])}`, three = `${par(xs[2])} + ${par(xs[3])} + ${par(xs[4])} = ${xs[2] + xs[3] + xs[4]}, not ${neg(xs[5])}`, w = `2 × ${par(xs[4])} + ${par(xs[3])} = ${2 * xs[4] + xs[3]}, not ${neg(xs[5])}`; const trp = [[null, three, w], [two, null, w], [two, three, null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), 'Test each window on the last shown term.'); } },
      { make: (rng) => { const f = fresh(rng, 6); return num(`Which number comes **before** the first term?  ?, ${seq(f)}`, f[1] - f[0], `The term before ${neg(f[0])}, ${neg(f[1])} is ${neg(f[1])} − ${par(f[0])} = ${neg(f[1] - f[0])}: then ${neg(f[1] - f[0])} + ${par(f[0])} = ${neg(f[1])}.`, ['The rule runs backwards by subtraction.', 'Second term minus first term.']); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const [a, b] = [rng.int(2, 9), rng.int(10, 20)], n = rng.int(7, 8), xs = fibl(a, b, n); return num(`A tally grows so that each week's count is the sum of the previous two weeks' counts. Week 1 had ${a} and week 2 had ${b}. What is the count in week ${n}?`, xs[n - 1], `Weeks 1 to ${n}: ${seq(xs)}, each the sum of the two before.`, ['Write the weeks out, adding the last two each time.', `Week 3 is ${a} + ${b} = ${a + b}.`]); } },
      far: { make: (rng) => { const n = rng.int(6, 10); return num(`You climb a staircase of ${n} steps, taking 1 or 2 steps at a time. In how many different ways can you reach the top?`, stairs(n), `The last move is a single or a double step, so ways(n) = ways(n − 1) + ways(n − 2), starting 1, 2: ${Array.from({ length: n }, (_, i) => stairs(i + 1)).join(', ')}.`, ['How many ways for 1 step? For 2 steps?', 'Your last move was a single or a double step: add the two counts before.']); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the staircase?', options: [
        'each value is the sum of the two values before it',
        'each value is the sum of all the values before it',
        'each value is double the value just before it',
        'each value adds a step that grows by a fixed amount',
      ], answer: 0, traps: { 1: 'the last move is one step or two, so only the two previous counts feed in', 2: 'doubling gives 1, 2, 4, 8; the stair counts go 1, 2, 3, 5, 8', 3: 'the steps 1, 1, 2, 3 are earlier values, not a fixed growth' }, explain: 'The stair count looks back exactly two places, like the sequences: ways(n) = ways(n − 1) + ways(n − 2).' },
    },

    S('tryit'),
    { type: 'tryit', family: 'fibonacci-like', section: 'nl', count: 3 },
  ],
};
