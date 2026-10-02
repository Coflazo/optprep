// 80-in-8: adding and subtracting whole numbers. Left to right in place parts, bridging through
// ten, compensation, counting up, and the two checks (last digit, size) that catch a slip.
import { sec, mc, N, neg, check, cum, PACE } from './shared.js';

const parts = (n) => String(n).split('').map((d, i, a) => Number(d) * 10 ** (a.length - 1 - i)).filter(Boolean);
const carry = (a, b) => (a % 10) + (b % 10) >= 10;
function twoNums(rng, lo, hi, blo, bhi, ok) { for (;;) { const a = rng.int(lo, hi), b = rng.int(blo, bhi); if (b % 10 && ok(a, b)) return [a, b]; } }

// ---- question makers, one per unit, in teaching order ----
const pool = [
  // 0 recognise: does the units column carry?
  (rng) => {
    const mk = (want) => { const [a, b] = twoNums(rng, 120, 899, 12, 98, (x, y) => carry(x, y) === want); return `${a} + ${b}`; };
    return mc({ q: 'Which sum needs a carry from the units into the tens?', right: mk(true), wrong: [[mk(false), 'its units add up to less than 10, so nothing carries'], [mk(false), 'its units add up to less than 10, so nothing carries'], [mk(false), 'its units add up to less than 10, so nothing carries']], explain: 'A carry happens exactly when the two units digits add to 10 or more.' }, rng);
  },
  // 1 anchor: biggest part first
  (rng) => { const [a, b] = twoNums(rng, 120, 899, 23, 98, () => true); const t = b - (b % 10); return N(`Add ${a} + ${b} left to right. What is the running total after adding the tens part of ${b}?`, a + t, `${b} = ${t} + ${b % 10}; first ${a} + ${t} = ${a + t}.`); },
  // 2 picture: jumps along the number line
  (rng) => { const [a, b] = twoNums(rng, 120, 899, 12, 98, carry); return N(`${a} + ${b} = ?`, a + b, `${a} + ${b - (b % 10)} = ${a + b - (b % 10)}, then + ${b % 10} = ${a + b} (the units bridge through the next ten).`); },
  // 3 picture: compensation
  (rng) => { const a = rng.int(120, 899), b = rng.int(2, 9) * 10 + rng.pick([7, 8, 9]); const r = b + (10 - (b % 10)); return N(`Round ${b} up to ${r}: ${a} + ${b} = ?`, a + b, `${a} + ${r} = ${a + r}, then take back ${r - b}: ${a + b}.`); },
  // 4 picture: subtraction by counting up
  (rng) => { const [a, b] = twoNums(rng, 300, 999, 12, 98, (x, y) => x % 10 < y % 10); return N(`${a} − ${b} = ?`, a - b, `Count up from ${b}: to ${b + (10 - (b % 10))} is ${10 - (b % 10)}, to ${a} is ${a - b - (10 - (b % 10))}; total ${a - b}.`); },
  // 5 last-digit check
  (rng) => {
    const [a, b] = twoNums(rng, 1200, 8999, 150, 999, carry), c = a + b;
    return mc({ q: `Without working it out fully: which of these can be ${a} + ${b}?`, right: String(c), wrong: [[String(c + 1), `ends in ${(c + 1) % 10}, but ${a % 10} + ${b % 10} ends in ${c % 10}`], [String(c - 2), `ends in ${(c + 8) % 10}, but ${a % 10} + ${b % 10} ends in ${c % 10}`], [String(c + 3), `ends in ${(c + 3) % 10}, but ${a % 10} + ${b % 10} ends in ${c % 10}`]], explain: `Only the units digits decide the last digit: ${a % 10} + ${b % 10} ends in ${c % 10}.` }, rng);
  },
  // 6 size check
  (rng) => {
    const [a, b] = twoNums(rng, 2100, 8800, 1100, 4900, () => true), c = a + b, r = Math.round(c / 100) * 100;
    return mc({ q: `${a} + ${b} is closest to which of these?`, right: String(r), wrong: [[String(r - 1000), 'dropped the carry into the thousands'], [String(r * 10), 'a zero too many'], [String(Math.round(r / 10)), 'a zero too few']], explain: `${Math.round(a / 100) * 100} + ${Math.round(b / 100) * 100} = ${Math.round(a / 100) * 100 + Math.round(b / 100) * 100}: about ${r}.` }, rng);
  },
  // 7 smaller minus bigger
  (rng) => { const a = rng.int(120, 700), b = a + rng.int(13, 199); return N(`${a} − ${b} = ? (type a minus sign if needed)`, a - b, `${b} is bigger, so the answer is negative: ${b} − ${a} = ${b - a}, so ${neg(a - b)}.`); },
  // 8 name the slip
  (rng) => {
    const [a, b] = twoNums(rng, 120, 899, 120, 899, (x, y) => carry(x, y) && (x % 100) + (y % 100) >= 100);
    const A = String(a).padStart(3, '0'), B = String(b).padStart(3, '0');
    const nc = Number([0, 1, 2].map((i) => (i === 0 ? Number(A[0]) + Number(B[0]) : (Number(A[i]) + Number(B[i])) % 10)).join(''));
    return mc({ q: `A candidate answers ${a} + ${b} = ${nc}. Which slip explains it?`, right: 'Never carried at all', wrong: [['Carried one time too many', `that gives more than ${a + b}, not less`], ['Added the units wrongly', `${a % 10} + ${b % 10} still ends in ${(a + b) % 10}, as ${nc} does`], ['Read + as −', `${a} − ${b} is ${a - b}`]], explain: `Each column was written mod 10 with no carry: the true answer is ${a + b}.` }, rng);
  },
  // 9 subtraction by compensation
  (rng) => { const a = rng.int(300, 999), b = rng.int(1, 6) * 100 - rng.pick([1, 2, 3]); if (b >= a) return N(`${a + 500} − ${b} = ?`, a + 500 - b, `${a + 500} − ${b + (100 - (b % 100))} + ${100 - (b % 100)} = ${a + 500 - b}.`); return N(`${a} − ${b} = ?`, a - b, `${b} is ${b + (100 - (b % 100))} − ${100 - (b % 100)}: ${a} − ${b + (100 - (b % 100))} = ${a - b - (100 - (b % 100))}, then + ${100 - (b % 100)} = ${a - b}.`); },
];

const X = { a: 373, b: 57 }; X.c = X.a + X.b;
const S = { a: 412, b: 57 }; S.c = S.a - S.b;

export default {
  id: 'mm/addsub',
  book: 'mm',
  kind: 'family',
  family: 'mm-addsub',
  title: 'Add and subtract',
  summary: 'Add and take away left to right in place parts, bridge through ten, round and undo, count up; then check the last digit and the size before you tap.',
  prerequisites: ['mm/sprint'],
  objectives: [
    `Add or subtract two 3- or 4-digit numbers in about ${PACE} seconds, left to right`,
    'Use compensation (57 = 60 − 3) and counting up when a number ends in 7, 8 or 9',
    'Reject a wrong option by its last digit or its size before tapping',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: work out ${X.a} + ${X.b} and ${S.a} − ${S.b} in your head. Try two different ways for the first.`, answer: `${X.c} and ${S.c}.`,
      explain: `${X.a} + 50 = 423, + 7 = ${X.c}. ${S.a} − ${S.b}: count up from ${S.b} to 60 (3), to 400 (340), to ${S.a} (12): ${S.c}.`,
      attempts: [
        { id: 'columns', label: 'Columns from the right', approach: 'Units first, write a digit, hold a carry, then the tens.', breaksAt: 'In your head you must hold the written digits and the carry at once; the answer comes out backwards.' },
        { id: 'round-forget', label: 'Rounded and forgot to undo', approach: `${X.a} + 60 = 433, and tapped 433.`, breaksAt: 'Rounding 57 up to 60 added 3 too many; they must come back off.' },
      ] },
    { type: 'text', text: 'The cue: two whole numbers joined by + or −, with = ? on the right. A quarter of the 80 questions look like this. They are the cheapest points on the test, if they take three seconds and never drop a carry.' },
    check(pool, 0, 'carries'),

    sec('why'),
    { type: 'text', text: `Eight minutes for 80 questions is ${PACE} seconds each. Sums and differences must take half that, to bank time for fractions and percents. A wrong answer costs a point, so speed without a check is a loss.` },
    check(pool, 0, 'carries'),

    sec('anchor'),
    { type: 'text', text: `You add in columns on paper. **One change**: in your head, start from the biggest place. ${X.a} + ${X.b}: first ${X.a} + 50 = 423, then + 7 = ${X.c}. You only ever hold one running total.` },
    check(pool, 1, 'left to right'),

    sec('picture'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 370, max: 440, step: 10, start: X.a, target: X.c, marks: [{ x: 423, label: '+50' }] }, caption: `${X.a} + ${X.b} as two jumps: +50 lands on 423, then +7 crosses 430 and lands on ${X.c}. Crossing a ten is the carry.` },
    check(pool, 2, 'jumps with a carry'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['move', 'running total'], rows: [[`${X.b} = 60 − 3`, '—'], [`${X.a} + 60`, '433'], ['− 3', String(X.c)]] }, caption: 'Compensation: round 57 up to 60, add the easy number, then take the 3 back. Best when a number ends in 7, 8 or 9.' },
    check(pool, 3, 'compensation'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 50, max: 420, step: 50, start: S.b, target: S.a, marks: [{ x: 60, label: '+3' }, { x: 400, label: '+340' }] }, caption: `${S.a} − ${S.b} by counting up: ${S.b} → 60 is 3, 60 → 400 is 340, 400 → ${S.a} is 12. The gap is 3 + 340 + 12 = ${S.c}. No borrowing.` },
    check(pool, 4, 'counting up'),

    sec('derivation'),
    { type: 'text', text: 'Six moves. The first three get the answer; the last three check it before you tap.' },
    { type: 'steps', steps: [
      { answers: 'columns', say: 'Split the second number into place parts and add the biggest first: 2846 + 1579 → 3846, 4346, 4416, 4425.', why: 'Each part changes one or two digits of a single running total; nothing has to be held backwards.', checks: [cum(pool, 2)] },
      { say: 'When the units cross ten, the tens digit goes up by one: 423 + 7 = 430.', why: 'That is the carry, done as one jump across a round number.', checks: [cum(pool, 2)] },
      { answers: 'round-forget', say: 'If a number ends in 7, 8 or 9, round it to the next ten, add, then undo the rounding: 373 + 57 = 373 + 60 − 3.', why: 'Adding a round number is one digit change; the undo is a tiny subtraction.', checks: [cum(pool, 3)] },
      { say: 'Last digit: only the units decide it. 6 + 9 ends in 5, so 2846 + 1579 ends in 5.', why: 'Carries move left, never right, so no slip in the tens can change the units.', checks: [cum(pool, 5)] },
      { say: 'Size: round both to hundreds. 2800 + 1600 = 4400, so the answer is near 4400.', why: 'A dropped carry in the thousands or a slipped zero changes the size, and the units check cannot see it.', checks: [cum(pool, 6)] },
      { say: 'Smaller minus bigger: the answer is negative. 245 − 318 = −(318 − 245) = −73.', why: 'Swapping the order of a subtraction only flips the sign.', checks: [cum(pool, 7)] },
    ] },
    { type: 'explain', prompt: 'Why does the last-digit check catch a units slip but not a dropped carry?', model: 'Carries only move from right to left. A dropped carry changes the tens or a higher place, so the last digit stays right; a units slip changes the last digit itself. That is why you need both checks: last digit for units slips, size for carries and zeros.', points: ['Carries move left only', 'A dropped carry leaves the last digit unchanged', 'So the size check is needed too'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-addsub', section: 'mm', difficulty: 1, seed: 'a', intro: 'A three-digit plus a two-digit number. Answer first, then read the steps.' },
    { type: 'worked', family: 'mm-addsub', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'Two three-digit numbers. The first move is given; finish it.' },
    { type: 'thinkaloud', problem: '4030 − 2113 = ?', lines: [
      { t: 0, say: 'Four digits minus four digits, zeros in the top number: counting up beats borrowing.' },
      { t: 2, say: '2113 up to 2120 is 7, up to 3000 is 880, up to 4030 is 1030.' },
      { t: 5, say: '7 + 880 + 1030 = 1817.', slip: true },
      { t: 7, say: 'Size check: 4000 − 2100 is about 1900, not 1800. Re-add: 7 + 880 = 887, + 1030 = 1917.' },
      { t: 10, say: 'Last digit: 0 − 3 borrows, 10 − 3 = 7. 1917 ends in 7. Tap 1917.' },
    ] },
    check(pool, 7, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '486 + 397: before working it out, what is the last digit, and is the answer above or below 900?', answer: 'Ends in 3 (6 + 7 = 13), and below 900: 486 + 400 = 886, then 3 back gives 883.', explain: 'Both checks take a second, and together they rule out most wrong options.' },

    sec('traps'),
    { type: 'traps', family: 'mm-addsub', section: 'mm', extra: [
      { belief: 'If I rounded a number to add it, the answer is done.', fix: 'Undo the rounding: 373 + 60 − 3, not 373 + 60.' },
      { belief: 'In subtraction I can take the smaller digit from the larger in each column.', fix: '412 − 57: 2 − 7 needs a borrow. Count up from 57 instead and the problem disappears.' },
      { belief: 'Smaller minus bigger is the same as bigger minus smaller.', fix: 'Same size, opposite sign: 245 − 318 = −73.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out 703 − 268 in their head. One step is wrong.', steps: [
      '268 is 270 − 2, so 703 − 268 = 703 − 270 + 2.',
      '703 − 270 = 533.',
      '533 + 2 = 535.',
    ], errorStep: 1, explain: '703 − 270 = 433: 703 − 200 = 503, − 70 = 433. The hundreds were not reduced. The right answer is 435; the size check (700 − 270 ≈ 430) catches 535.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 8), mc({ q: '486 + 397 = 883. Which check catches the wrong option 783?', right: 'The size check', wrong: [['The last-digit check', '783 ends in 3 like 883: a dropped hundred never changes the last digit'], ['Neither check', 'size: 500 + 400 = 900, far from 783'], ['Only both together', 'the size check alone is enough here']], explain: 'A dropped carry into the hundreds leaves the last digit right; only the size (about 900) shows that 783 is a hundred short.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Subtracting a number just below a hundred: take the round hundred, give back the difference. 612 − 298 = 612 − 300 + 2 = 314. Numbers just above: 612 − 304 = 612 − 300 − 4 = 308.' },
    check(pool, 9, 'compensation in subtraction'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Biggest part first, one running total. Ends in 7, 8 or 9: round and undo. Subtraction: count up. Before tapping: last digit, then size.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Fastest move', 'Check'], rows: [
      ['373 + 57', 'left to right: +50, +7', 'ends in 0; about 430'],
      ['373 + 59', 'compensate: +60, −1', 'ends in 2; about 430'],
      ['412 − 57', 'count up from 57', '57 + 355 = 412'],
      ['245 − 318', 'swap, then minus sign', 'negative; size 73'],
    ] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: `Base: ${X.a} + ${X.b} = ${X.c}, by ${X.a} + 50 + 7.`, rows: [
      { change: '57 becomes 59', effect: 'Compensate: 373 + 60 − 1 = 432.' },
      { change: '+ becomes −', effect: '373 − 57: count up from 57: 3 + 300 + 13 = 316.' },
      { same: true, change: 'The order is swapped: 57 + 373', effect: 'No change: 430. Start from the bigger number anyway; it is one less part to add.' },
      { fusion: true, change: '57 becomes 59 AND + becomes −', effect: '373 − 59 = 373 − 60 + 1 = 314: compensation flips direction in a subtraction.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: zeros in the top number (5003 − 1768) make column borrowing slow; count up instead (1768 → 1770 → 2000 → 5003 is 2 + 230 + 3003 = 3235). A second number with a 0 in the units (300) needs no compensation.' },
    check(pool, 9, 'zeros and edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: counting up is how a trader works out change, a spread or a P&L in their head; compensation (round, then undo) runs every Fermi estimate.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const a = rng.int(310, 890), b = rng.int(110, 480); return N(`You hold ${a} lots and sell ${b}. How many are left?`, a - b, `${a} − ${b}: count up from ${b} to ${a}: ${a - b}.`); } },
      far: N('Outside the test: a train leaves at 10:47 and the trip takes 38 minutes. How many minutes past 11:00 does it arrive?', 25, '10:47 + 13 minutes = 11:00 (bridge to the round number), then the other 25 minutes: 11:25.'),
      principle: mc({ q: 'Which idea carried over from the lots to the train?', right: 'Bridge to a round number, then add the rest', wrong: [['Column addition from the right', 'neither needed columns'], ['Round both and estimate', 'both answers were exact'], ['Subtract the smaller digit from the larger', 'that is the borrowing slip, not a method']], explain: 'Both jump to a round number first (a hundred, the hour) and then add what is left.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-addsub', section: 'mm', count: 3 },
  ],
};

