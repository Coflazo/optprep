// 80-in-8: decimals with 1 or 2 places. Powers of ten, adding and subtracting with the points
// lined up, decimal × whole number, decimal × decimal, and dividing by a decimal.
import { family, q, L, smallFromLarge, placePicture, areaPicture, tablePicture } from '../lib.js';

const D = (m, dp) => q(m, 10 ** dp); // 347, 2 -> 3.47
const nonInt = (x) => x.d !== 1n;
const place = (dp) => (dp === 1 ? 'tenths' : dp === 2 ? 'hundredths' : 'thousandths');

const pow10 = {
  levels: [1],
  build(rng) {
    const dp = rng.int(1, 2), m = rng.int(dp === 1 ? 11 : 101, dp === 1 ? 999 : 9999);
    if (m % 10 === 0) return null;
    const x = D(m, dp), k = rng.int(1, 3), p = 10 ** k, times = rng.chance(0.5);
    const r = times ? x.mul(p) : x.div(p);
    if (!nonInt(r)) return null;
    const moved = (j) => (times ? k + j : k - j); // r × 10^j is x moved this many places
    const wrong = [-2, -1, 1, 2].map((j) => {
      const v = j > 0 ? r.mul(10 ** j) : r.div(10 ** -j), n = moved(j);
      return [v, n === 0 ? 'Did not move the decimal point at all.' : n < 0 ? 'Moved the decimal point the wrong way.' : `Moved the decimal point ${n} place${n > 1 ? 's' : ''} instead of ${k}.`];
    });
    const dir = times ? 'right' : 'left';
    return {
      text: `${L(x)} ${times ? '×' : '÷'} ${p} = ?`, value: r, mode: 'dec', wrong,
      ask: `${times ? 'Multiply' : 'Divide'} ${L(x)} by ${p}.`,
      steps: [
        { say: `${p} has ${k} zero${k > 1 ? 's' : ''}, so the decimal point moves ${k} place${k > 1 ? 's' : ''} to the ${dir}.`, why: `Each ${times ? '× 10 makes every digit ten times bigger' : '÷ 10 makes every digit ten times smaller'}: one place per zero.` },
        { say: 'Move the point and read the answer.', math: `${L(x)} ${times ? '×' : '÷'} ${p} = ${L(r)}`, why: 'Count the places one at a time; add zeros as place holders if the digits run out.' },
      ],
      picture: placePicture([['', x], [`${times ? '×' : '÷'} ${p}`, r]], `The same digits, shifted ${k} place${k > 1 ? 's' : ''} ${times ? 'to the left (bigger)' : 'to the right (smaller)'} against the fixed place columns. The wrong options shift them too far, too little or the wrong way.`),
      fast: `Count the zeros of ${p} (${k}) and hop the point ${k} to the ${dir}: ${L(r)}.`,
      check: `Size: ${times ? `${p} times` : `one ${p === 10 ? 'tenth' : p === 100 ? 'hundredth' : 'thousandth'} of`} ${L(x)} must be ${times ? 'bigger' : 'smaller'}; ${L(r)} is.`,
      hints: [`How many zeros does ${p} have?`, `Move the point that many places to the ${dir}.`],
      params: { x: L(x), op: times ? '×' : '÷', p },
    };
  },
};

const addDec = {
  levels: [1],
  build(rng) {
    const m1 = rng.int(11, 99), m2 = rng.int(101, 999);
    if (m1 % 10 === 0 || m2 % 10 === 0) return null;
    const x = D(m1, 1), y = D(m2, 2), c = x.add(y);
    if (!nonInt(c)) return null;
    const carry = (m1 % 10) * 10 + (m2 % 100) >= 100;
    const wrong = [[D(m1 + m2, 2), `Lined up the last digits instead of the decimal points: treated ${L(x)} as ${L(D(m1, 2))}.`],
      [c.add(D(1, 1)), 'Tenths slip: one tenth too many.'], [c.sub(D(1, 1)), 'Tenths slip: one tenth too few.'], [c.add(D(1, 2)), 'Hundredths slip: one hundredth too many.']];
    if (carry) wrong.push([c.sub(1), `Dropped the carry from the tenths into the ones (${L(D(m1 % 10, 1))} + ${L(D(m2 % 100, 2))} is more than 1).`]);
    return {
      text: `${L(x)} + ${L(y)} = ?`, value: c, mode: 'dec', wrong,
      ask: `Add ${L(y)} to ${L(x)}.`,
      steps: [
        { say: `Line up the points: ${L(x)} = ${(m1 / 10).toFixed(2)}.`, why: 'Write both with two decimal places so tenths sit under tenths and hundredths under hundredths.' },
        { say: 'Add the whole parts, then the decimal parts.', math: `${Math.floor(m1 / 10)} + ${Math.floor(m2 / 100)} = ${Math.floor(m1 / 10) + Math.floor(m2 / 100)};  ${L(D(m1 % 10, 1))} + ${L(D(m2 % 100, 2))} = ${L(D((m1 % 10) * 10 + (m2 % 100), 2))}`, why: 'Whole parts and decimal parts add separately; a decimal part over 1 carries into the ones.' },
        { say: 'Put the two parts back together.', math: `${Math.floor(m1 / 10) + Math.floor(m2 / 100)} + ${L(D((m1 % 10) * 10 + (m2 % 100), 2))} = ${L(c)}`, why: 'The whole parts and the decimal parts are two halves of one sum.' },
      ],
      picture: placePicture([['', x], ['+', y], ['=', c]], `Points lined up: tenths under tenths, hundredths under hundredths. Lining up the last digits instead would put the ${m1 % 10} of ${L(x)} in the hundredths.`),
      fast: `Ones first, then the decimal parts: ${Math.floor(m1 / 10) + Math.floor(m2 / 100)} + ${L(D((m1 % 10) * 10 + (m2 % 100), 2))} = ${L(c)}.`,
      check: `Size: about ${Math.round(m1 / 10)} + ${Math.round(m2 / 100)} = ${Math.round(m1 / 10) + Math.round(m2 / 100)}. The answer has ${L(y).split('.')[1].length} decimal places, ending in ${m2 % 10}.`,
      hints: ['Line up the decimal points, not the last digits.', `${L(x)} = ${(m1 / 10).toFixed(2)}.`],
      params: { x: L(x), y: L(y), op: '+' },
    };
  },
};

const subDec = {
  levels: [2],
  build(rng) {
    const m1 = rng.int(31, 99), m2 = rng.int(101, 899);
    if (m1 % 10 === 0 || m2 % 10 === 0 || Math.ceil(m2 / 100) * 10 > m1) return null; // count-up target must not pass x
    const x = D(m1, 1), y = D(m2, 2), c = x.sub(y);
    if (!nonInt(c)) return null;
    const wrong = [[D(Math.floor(m1 / 10) * 100 + (m1 % 10), 2).sub(y), `Treated ${L(x)} as ${L(D(Math.floor(m1 / 10) * 100 + (m1 % 10), 2))}: the ${m1 % 10} went into the hundredths.`],
      [D(smallFromLarge(m1 * 10, m2), 2), 'Took the smaller digit from the larger in each column (0 − 5 became 5) instead of borrowing.'],
      [c.add(D(1, 1)), 'Borrowed from the tenths but did not reduce them.'], [c.sub(1), 'Took one too many from the ones.'], [c.add(D(1, 2)), 'Hundredths slip after borrowing.']];
    return {
      text: `${L(x)} − ${L(y)} = ?`, value: c, mode: 'dec', wrong,
      ask: `Take ${L(y)} away from ${L(x)}.`,
      steps: [
        { say: `Line up the points: ${L(x)} = ${(m1 / 10).toFixed(2)}.`, why: 'The empty hundredths place holds a 0, and you will borrow into it.' },
        { say: `${(m1 / 10).toFixed(2)} − ${L(y)}: count up from ${L(y)} to ${Math.ceil(m2 / 100)} (${L(q(Math.ceil(m2 / 100)).sub(y))}), then to ${L(x)} (${L(x.sub(Math.ceil(m2 / 100)))}).`, why: 'Counting up to a whole number avoids borrowing across the point.' },
        { say: 'Add the two hops.', math: `${L(q(Math.ceil(m2 / 100)).sub(y))} + ${L(x.sub(Math.ceil(m2 / 100)))} = ${L(c)}`, why: 'The two hops together are the gap between the numbers.' },
      ],
      picture: { diagram: 'numberline', spec: { min: Math.floor(m2 / 100), max: Math.ceil(m1 / 10), step: 1, start: y.toNumber(), target: x.toNumber(), marks: [{ x: Math.ceil(m2 / 100), label: 'whole number' }] }, caption: `Count up from ${L(y)} (start) to ${L(x)} (target): ${L(q(Math.ceil(m2 / 100)).sub(y))} to reach ${Math.ceil(m2 / 100)}, then ${L(x.sub(Math.ceil(m2 / 100)))} more. The gap is ${L(c)}.` },
      fast: `Count up: ${L(y)} → ${Math.ceil(m2 / 100)} → ${L(x)}; the hops add to ${L(c)}.`,
      check: `Add back: ${L(c)} + ${L(y)} = ${L(x)}. Size: about ${Math.round(m1 / 10)} − ${Math.round(m2 / 100)}.`,
      hints: [`Write ${L(x)} as ${(m1 / 10).toFixed(2)}.`, `Count up from ${L(y)} to the next whole number first.`],
      params: { x: L(x), y: L(y), op: '−' },
    };
  },
};

const decTimesInt = {
  levels: [1, 2, 3],
  build(rng, d) {
    const dp = d === 1 ? 1 : 2, m = d === 1 ? rng.int(12, 99) : rng.int(12, 99), n = d === 3 ? rng.int(12, 48) : rng.int(3, 9);
    if (m % 10 === 0 || n % 10 === 0) return null;
    const x = D(m, d === 3 ? 2 : dp), c = x.mul(n);
    if (!nonInt(c)) return null;
    const xs = d === 3 ? 2 : dp, whole = Math.floor(m / 10 ** xs), frac = m % 10 ** xs, unit = D(1, xs);
    const wrong = [[c.mul(10), `Placed the point one place too late: ${m} × ${n} = ${m * n}, then counted ${xs - 1} decimal place${xs - 1 === 1 ? '' : 's'} instead of ${xs}.`],
      [c.div(10), `Placed the point one place too early: counted ${xs + 1} decimal places instead of ${xs}.`],
      [c.add(unit), `Last-digit slip: one ${place(xs).slice(0, -1)} too many.`], [c.sub(unit), `Last-digit slip: one ${place(xs).slice(0, -1)} too few.`]];
    if (whole) wrong.push([q(whole * n).add(D(frac * n, xs + 1)), `Multiplied the decimal part as if it were ${place(xs + 1)}: ${L(D(frac, xs))} × ${n} taken as ${L(D(frac * n, xs + 1))}.`]);
    return {
      text: `${L(x)} × ${n} = ?`, value: c, mode: 'dec', wrong,
      ask: `Multiply ${L(x)} by ${n}.`,
      steps: [
        { say: 'Ignore the point and multiply the whole numbers.', math: `${m} × ${n} = ${m * n}`, why: `${L(x)} is ${m} ${place(xs)}, so the product is ${m * n} ${place(xs)}.` },
        { say: `${L(x)} has ${xs} decimal place${xs > 1 ? 's' : ''}, so the answer has ${xs}.`, math: `${m * n} ${place(xs)} = ${L(c)}`, why: 'Count the decimal places in the question; the answer gets the same number.' },
      ],
      picture: whole ? areaPicture([n], [q(whole), D(frac, xs)], `Area model: ${L(x)} = ${whole} + ${L(D(frac, xs))}, each part times ${n}. The cells add to ${whole * n} + ${L(D(frac * n, xs))} = ${L(c)}.`)
        : tablePicture(['', 'Digits only', 'With the point'], [[`× ${n}`, `${m} × ${n} = ${m * n}`, `${L(x)} × ${n} = ${L(c)}`]], `Same digits either way; the ${xs} decimal place${xs > 1 ? 's' : ''} of ${L(x)} decide where the point goes.`),
      fast: whole ? `${whole} × ${n} = ${whole * n}, ${L(D(frac, xs))} × ${n} = ${L(D(frac * n, xs))}: ${L(c)}.` : `${m} × ${n} = ${m * n}, then ${xs} decimal places: ${L(c)}.`,
      check: `Size: about ${L(D(Math.round(m / 10 ** (xs - 1)), 1))} × ${n} ≈ ${Math.round((m / 10 ** xs) * n * 10) / 10}. Last digit: ${m % 10} × ${n % 10} ends in ${(m % 10) * (n % 10) % 10}.`,
      hints: [`Work out ${m} × ${n} first.`, `Then give the answer ${xs} decimal place${xs > 1 ? 's' : ''}.`],
      params: { x: L(x), n },
    };
  },
};

const decTimesDec = {
  levels: [2],
  build(rng) {
    const a = rng.int(2, 99), b = rng.int(2, 99);
    if (a % 10 === 0 || b % 10 === 0) return null;
    const x = D(a, 1), y = D(b, 1), c = x.mul(y);
    if (!nonInt(c)) return null;
    const wa = Math.floor(a / 10), wb = Math.floor(b / 10), fa = a % 10, fb = b % 10;
    const wrong = [[c.mul(10), `Counted one decimal place instead of two: ${a} × ${b} = ${a * b} → ${L(D(a * b, 1))}.`],
      [c.div(10), 'Counted three decimal places instead of two.'],
      [q(wa * wb).add(D(fa * fb, 2)), `Multiplied whole parts and decimal parts separately (${wa} × ${wb} and ${L(D(fa, 1))} × ${L(D(fb, 1))}) and missed the cross terms.`],
      [c.add(D(1, 2)), 'Last-digit slip in the hundredths.'], [c.sub(D(1, 2)), 'Last-digit slip in the hundredths.'], [c.add(D(1, 1)), 'Carry slip into the tenths.']];
    return {
      text: `${L(x)} × ${L(y)} = ?`, value: c, mode: 'dec', wrong,
      ask: `Multiply ${L(x)} by ${L(y)}.`,
      steps: [
        { say: 'Ignore the points and multiply the whole numbers.', math: `${a} × ${b} = ${a * b}`, why: 'Tenths times tenths are hundredths: the digits come from the whole-number product.' },
        { say: 'One place plus one place makes two decimal places.', math: `${a * b} hundredths = ${L(c)}`, why: '0.1 × 0.1 = 0.01, so the decimal places of the two factors add.' },
      ],
      picture: wa && wb ? areaPicture([q(wa), D(fa, 1)], [q(wb), D(fb, 1)], `Area model: whole and tenths parts of each factor. The four cells add to ${L(c)}; the two cross cells (${wa} × ${L(D(fb, 1))} and ${L(D(fa, 1))} × ${wb}) are what splitting whole and decimal parts misses.`)
        : tablePicture(['', 'Digits only', 'With the points'], [['product', `${a} × ${b} = ${a * b}`, `${L(x)} × ${L(y)} = ${L(c)}`]], `Same digits; two decimal places in the factors, so two in the answer.`),
      fast: `${a} × ${b} = ${a * b}, two places: ${L(c)}.`,
      check: `Size: about ${Math.round(a / 10) || 0.5} × ${Math.round(b / 10) || 0.5}. A factor below 1 makes the product smaller than the other factor.`,
      hints: [`${a} × ${b} = ?`, 'Count the decimal places in both factors and add them.'],
      params: { x: L(x), y: L(y) },
    };
  },
};

const divByDec = {
  levels: [3],
  build(rng) {
    const y = q(...rng.pick([[1, 5], [1, 4], [2, 5], [1, 2], [3, 5], [4, 5], [1, 20], [3, 25], [6, 5], [3, 2], [5, 2]]));
    const r = D(rng.int(11, 199), 1);
    if (!nonInt(r)) return null;
    const x = r.mul(y);
    if (x.d > 1000n) return null;
    const ys = L(y), sh = ys.split('.')[1]?.length || 0, p = 10 ** sh;
    const wrong = [[r.mul(p), `Scaled ${L(x)} by ${p} but left ${ys} as it was.`], [r.div(p), `Made ${ys} whole (${L(y.mul(p))}) but did not scale ${L(x)}.`],
      ...(p === 100 ? [[r.mul(10), `Scaled ${L(x)} by 100 but ${ys} by only 10.`], [r.div(10), `Scaled ${ys} by 100 but ${L(x)} by only 10.`]] : []),
      [x.mul(y), `Multiplied by ${ys} instead of dividing (dividing by a number below 1 makes the answer bigger).`], [r.add(D(1, 1)), 'Last-digit slip: one tenth too many.'], [r.sub(D(1, 1)), 'Last-digit slip: one tenth too few.']];
    return {
      text: `${L(x)} ÷ ${ys} = ?`, value: r, mode: 'dec', wrong,
      ask: `How many ${ys}s make ${L(x)}?`,
      steps: [
        { say: `Multiply both numbers by ${p}: ${L(x)} ÷ ${ys} = ${L(x.mul(p))} ÷ ${L(y.mul(p))}.`, why: 'Scaling both numbers by the same amount leaves the quotient unchanged, and the divisor becomes whole.' },
        { say: 'Divide by the whole number.', math: `${L(x.mul(p))} ÷ ${L(y.mul(p))} = ${L(r)}`, why: 'Now it is division by a whole number.' },
      ],
      picture: tablePicture(['', 'Number', 'Divisor', 'Quotient'], [['as given', L(x), ys, L(r)], [`both × ${p}`, L(x.mul(p)), L(y.mul(p)), L(r)]], `Scaling both numbers by ${p} leaves the quotient at ${L(r)}. Scaling only one of them is the slip behind two of the wrong options.`),
      fast: `÷ ${ys} is × ${L(q(Number(y.d), Number(y.n)))}: ${L(x)} × ${L(q(Number(y.d), Number(y.n)))} = ${L(r)}.`,
      check: `Multiply back: ${L(r)} × ${ys} = ${L(x)}. ${y.toNumber() < 1 ? `Dividing by less than 1 gives more than ${L(x)}.` : `Dividing by more than 1 gives less than ${L(x)}.`}`,
      hints: [`Multiply both numbers by ${p} so the divisor is whole.`, `${L(x.mul(p))} ÷ ${L(y.mul(p))}.`],
      params: { x: L(x), y: ys },
    };
  },
};

const decDivInt = {
  levels: [2],
  build(rng) {
    const n = rng.int(3, 9), r = D(rng.int(11, 99), rng.int(1, 2));
    if (!nonInt(r)) return null;
    const x = r.mul(n);
    const rs = L(r).split('.')[1].length;
    const wrong = [[r.mul(10), 'Put the point one place too late in the answer.'], [r.div(10), 'Put the point one place too early in the answer.'],
      [r.add(D(1, rs)), `Off by one in the last digit: ${n} × ${L(r.add(D(1, rs)))} is not ${L(x)}.`], [r.sub(D(1, rs)), `Off by one in the last digit: ${n} × ${L(r.sub(D(1, rs)))} is not ${L(x)}.`]];
    return {
      text: `${L(x)} ÷ ${n} = ?`, value: r, mode: 'dec', wrong,
      ask: `Divide ${L(x)} by ${n}.`,
      steps: [
        { say: `Ignore the point: ${L(x.mul(10 ** rs))} ÷ ${n} = ${L(r.mul(10 ** rs))}.`, why: `${L(x)} is ${L(x.mul(10 ** rs))} ${place(rs)}; dividing ${place(rs)} gives ${place(rs)}.` },
        { say: 'Put the point back.', math: `${L(r.mul(10 ** rs))} ${place(rs)} = ${L(r)}`, why: 'Dividing by a whole number keeps the point exactly above where it was.' },
      ],
      picture: placePicture([['', x], [`÷ ${n}`, r]], `Dividing by ${n} keeps the columns: ${place(rs)} stay ${place(rs)}, so the point of ${L(r)} sits where it sat in ${L(x)}.`),
      fast: `${L(x.mul(10 ** rs))} ÷ ${n} = ${L(r.mul(10 ** rs))}, point back in: ${L(r)}.`,
      check: `Multiply back: ${n} × ${L(r)} = ${L(x)}. Size: about ${Math.round(x.toNumber())} ÷ ${n}.`,
      hints: [`Ignore the point and divide ${L(x.mul(10 ** rs))} by ${n}.`, 'Put the point back in the same place.'],
      params: { x: L(x), n },
    };
  },
};

export default family({
  id: 'mm-decimals',
  title: 'Decimals',
  skill: 'Move the point for powers of ten, line up points to add and subtract, count decimal places to multiply, clear the divisor to divide',
  levels: [1, 2, 3],
  rule: 'Add and subtract with the points lined up. Multiply as whole numbers, then count the decimal places. To divide by a decimal, scale both numbers until the divisor is whole.',
  anchor: 'Place value: 3.47 is 347 hundredths, so decimal sums are whole-number sums in hundredths.',
  variants: { pow10, addDec, subDec, decTimesInt, decTimesDec, divByDec, decDivInt },
  lesson: {
    purpose: 'Decimal questions are whole-number questions with one extra decision: where the point goes. Most wrong options on the test are the right digits with the point in the wrong place.',
    anchor: 'You can do 47 + 285 and 12 × 7. A decimal is a whole number of tenths or hundredths.',
    steps: [
      { say: 'Adding: line up the points, not the last digits. 4.7 + 2.85 = 4.70 + 2.85 = 7.55.', why: 'Tenths must sit under tenths.' },
      { say: 'Multiplying: ignore the points, then count. 0.3 × 0.4: 3 × 4 = 12, two places, 0.12.', why: '0.1 × 0.1 = 0.01, so decimal places add.' },
      { say: 'Dividing by a decimal: scale both. 1.35 ÷ 0.3 = 13.5 ÷ 3 = 4.5.', why: 'Multiplying both numbers by 10 leaves the quotient unchanged.' },
    ],
    predict: { question: '2.4 ÷ 0.5: is the answer bigger or smaller than 2.4?', answer: 'Bigger: dividing by a number below 1 makes it bigger. 2.4 ÷ 0.5 = 4.8.' },
    rule: 'Points lined up for + and −; count places for ×; make the divisor whole for ÷.',
    contrast: '0.3 × 0.4 = 0.12, but 0.3 + 0.4 = 0.7: places add when multiplying, not when adding.',
  },
});
