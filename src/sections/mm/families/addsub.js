// 80-in-8: addition and subtraction of 2- to 4-digit whole numbers, always with carries or borrows.
import { family, q, neg, PLACE, carryPlaces, borrowPlaces, noCarrySum, smallFromLarge, digits, intPick } from '../lib.js';

// 1579 -> [1000, 500, 70, 9]: the place parts, largest first.
const parts = (n) => digits(n).map((d, k) => d * 10 ** k).filter(Boolean).reverse();
// Two significant figures for a size check: 373 -> 370, 1579 -> 1600, 57 -> 57.
const rough = (n) => { const k = Math.max(0, String(Math.abs(n)).length - 2); return Math.round(n / 10 ** k) * 10 ** k; };
const Z = (n) => q(n);

function chain(start, ps, op) {
  let run = start;
  return ps.map((p, i) => {
    const prev = run;
    run = op === '+' ? run + p : run - p;
    const last = i === ps.length - 1;
    return {
      say: `${neg(prev)} ${op === '+' ? '+' : '−'} ${p} = ${neg(run)}`,
      why: i === 0 ? `Work one place at a time, biggest part first (${ps.join(' + ')}), so you only ever hold one running total.`
        : last ? (op === '+' ? `Last the units: ${prev % 10} + ${p} ${prev % 10 + p >= 10 ? 'passes the next ten, so the tens digit goes up by one' : 'stays inside the same ten'}.`
          : `Last the units: ${prev % 10} − ${p} ${prev % 10 < p ? 'goes below the ten, so the tens digit goes down by one' : 'stays inside the same ten'}.`)
          : 'Next place down: only one or two digits of the running total change.',
    };
  });
}

// Compensation: round the second number to a ten, then undo the rounding.
function compensate(a, b, op) {
  const u = b % 10;
  if (u === 0) return `${a} ${op} ${b} directly.`;
  const up = u >= 5, r = up ? b + (10 - u) : b - u, d = Math.abs(r - b);
  const mid = op === '+' ? a + r : a - r;
  const fix = op === '+' ? (up ? '−' : '+') : (up ? '+' : '−');
  return `${b} is ${r} ${up ? '−' : '+'} ${d}: ${a} ${op === '+' ? '+' : '−'} ${r} = ${mid}, then ${fix} ${d} = ${op === '+' ? a + b : a - b}.`;
}

const add = {
  levels: [1, 2, 3],
  build(rng, d) {
    const a = d === 3 ? rng.int(1200, 8999) : rng.int(120, 899);
    const b = d === 1 ? rng.int(12, 98) : d === 2 ? rng.int(120, 899) : (rng.chance(0.5) ? rng.int(150, 999) : rng.int(1100, 8999));
    const cp = carryPlaces(a, b);
    if (b % 10 === 0 || cp.length < (d === 1 ? 1 : 2)) return null;
    const c = a + b, ua = a % 10, ub = b % 10, A = digits(a), B = digits(b);
    const colSum = (k) => (A[k] || 0) + (B[k] || 0);
    const wrong = cp.map((k) => [Z(c - 10 ** k), `Dropped the carry into the ${PLACE[k]}: the ${PLACE[k - 1]} column passed 10 but no 1 was carried.`]);
    wrong.push([Z(noCarrySum(a, b)), 'Added each column on its own and never carried.']);
    const free = [1, 2, 3].filter((k) => !cp.includes(k) && 10 ** k <= c);
    if (free.length) { const k = rng.pick(free); wrong.push([Z(c + 10 ** k), `Carried a 1 into the ${PLACE[k]} that was never there: the ${PLACE[k - 1]} column made only ${colSum(k - 1) + (cp.includes(k - 1) ? 1 : 0)}.`]); }
    const s = rng.chance(0.5) ? 1 : -1;
    wrong.push([Z(c + s), `Units slip: ${ua} + ${ub} taken as ${ua + ub + s}.`]);
    wrong.push([Z(c - s * 10), `Tens slip: one ten too ${s < 0 ? 'many' : 'few'} while adding the tens.`]);
    const ps = parts(b);
    return {
      text: `${a} + ${b} = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Add ${b} to ${a}.`,
      steps: chain(a, ps, '+'),
      fast: compensate(a, b, '+'),
      check: `Units: ${ua} + ${ub} ends in ${(ua + ub) % 10}, so the answer ends in ${c % 10}. Size: ${rough(a)} + ${rough(b)} ≈ ${rough(a) + rough(b)}.`,
      hints: [`Add ${b} in parts: ${ps.join(' + ')}.`, `The units ${ua} + ${ub} end in ${(ua + ub) % 10}, and so does the answer.`],
      params: { a, b, op: '+' },
    };
  },
};

const sub = {
  levels: [1, 2, 3],
  build(rng, d) {
    let a;
    if (d === 3 && rng.chance(0.4)) a = rng.int(2, 9) * 1000 + rng.int(1, 9) * (rng.chance(0.5) ? 1 : 10); // zeros to borrow across
    else a = d === 3 ? rng.int(2000, 9999) : d === 2 ? rng.int(300, 999) : rng.int(200, 999);
    const b = d === 1 ? rng.int(12, 98) : d === 2 ? intPick(rng, 101, a - 12, () => true) : (rng.chance(0.5) ? rng.int(150, 999) : intPick(rng, 1100, a - 100, () => true));
    if (b == null || b >= a || b % 10 === 0) return null;
    const bp = borrowPlaces(a, b);
    if (bp.length < (d === 1 ? 1 : 2)) return null;
    const c = a - b, ua = a % 10, ub = b % 10;
    const wrong = [[Z(smallFromLarge(a, b)), 'Took the smaller digit from the larger in each column instead of borrowing.']];
    for (const k of bp) wrong.push([Z(c + 10 ** k), `Borrowed for the ${PLACE[k - 1]} but did not reduce the ${PLACE[k]} digit of ${a}.`]);
    wrong.push([Z(c - 10 ** rng.pick(bp)), 'Took the borrowed 1 off twice.']);
    const s = rng.chance(0.5) ? 1 : -1;
    const top = ua < ub ? ua + 10 : ua;
    wrong.push([Z(c + s), `Units slip: ${top} − ${ub} taken as ${top - ub + s}.`]);
    const ps = parts(b);
    return {
      text: `${a} − ${b} = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Take ${b} away from ${a}.`,
      steps: chain(a, ps, '−'),
      fast: compensate(a, b, '−'),
      check: `Add back: ${c} + ${b} = ${a}. Units: ${top} − ${ub} = ${top - ub}, so the answer ends in ${c % 10}.`,
      hints: [`Take ${b} away in parts: ${ps.join(', then ')}.`, `Check by adding back: answer + ${b} must give ${a}.`],
      params: { a, b, op: '−' },
    };
  },
};

// Smaller minus larger: the answer is negative.
const negative = {
  levels: [3],
  build(rng) {
    const a = rng.int(120, 899), b = a + rng.int(13, 299);
    if (b > 999 || b % 10 === 0 || a % 10 === 0) return null;
    const bp = borrowPlaces(b, a);
    if (!bp.length) return null;
    const m = b - a, c = -m;
    const wrong = [[Z(m), `Took the smaller number from the larger (${b} − ${a}) and dropped the minus sign.`],
      [Z(-smallFromLarge(b, a)), 'Kept the minus sign but took the smaller digit from the larger in each column.']];
    for (const k of bp) wrong.push([Z(c - 10 ** k), `Borrowed in ${b} − ${a} but did not reduce the ${PLACE[k]} digit.`]);
    const s = rng.chance(0.5) ? 1 : -1;
    wrong.push([Z(c + s), 'Units slip in the last column.']);
    wrong.push([Z(c - 10 * s), 'Tens slip after borrowing: the tens digit was reduced once too often or not at all.']);
    return {
      text: `${a} − ${b} = ?`, value: Z(c), mode: 'int', wrong, mixedSigns: true,
      ask: `Take ${b} away from ${a}; ${b} is the bigger number.`,
      steps: [
        { say: `${b} is bigger than ${a}, so the answer is negative: find ${b} − ${a} and put a minus in front.`, why: 'a − b = −(b − a): swapping the order only flips the sign.' },
        ...chain(b, parts(a), '−'),
        { say: `So ${a} − ${b} = ${neg(c)}.`, why: 'The size is the gap between the two numbers; the sign says the first number is the smaller one.' },
      ],
      fast: `Count up from ${a} to ${b}: ${a} → ${Math.ceil(a / 10) * 10} → ${Math.floor(b / 10) * 10} → ${b} is ${m}; the answer is ${neg(c)}.`,
      check: `Smaller minus bigger is negative. Add back: ${neg(c)} + ${b} = ${a}.`,
      hints: ['Which number is bigger? Then the sign is already decided.', `Find the gap ${b} − ${a}, then put a minus in front.`],
      params: { a, b, op: '−' },
    };
  },
};

export default family({
  id: 'mm-addsub',
  title: 'Add and subtract',
  skill: 'Add and subtract 2- to 4-digit numbers with carries and borrows, left to right in place-value parts',
  levels: [1, 2, 3],
  rule: 'Add or subtract one place at a time, biggest part first; or round the second number to a ten and undo the rounding.',
  anchor: 'Column addition and subtraction, done from the left so the running total stays in your head.',
  variants: { add, sub, negative },
  lesson: {
    purpose: 'A quarter of the 80 questions are plain sums and differences. They are the cheapest points on the test if they take three seconds and never slip a carry.',
    anchor: 'You already add in columns on paper. The only change: start from the biggest place and keep one running total.',
    steps: [
      { say: 'Split the second number into place parts: 1579 = 1000 + 500 + 70 + 9.', why: 'Each part changes only one or two digits of the running total.' },
      { say: 'Add (or take away) the parts from the left: 2846 + 1000 = 3846, + 500 = 4346, + 70 = 4416, + 9 = 4425.', why: 'Left to right keeps the big digits right first, which is what the size check needs.' },
      { say: 'Check the last digit: 6 + 9 ends in 5, and so does 4425.', why: 'A dropped carry never changes the units digit, but a units slip always does.' },
    ],
    predict: { question: '412 − 57: will the answer end in 5 or in 4?', answer: '5: 12 − 7 = 5 after borrowing, so the answer (355) ends in 5.' },
    rule: 'Biggest part first, one running total; or round to a ten and undo. Units digit and size check before you tap.',
    contrast: 'Rounding one number (57 → 60) and undoing it (+3) is faster than column work when a number ends in 7, 8 or 9.',
  },
});
