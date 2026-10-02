// 80-in-8: whole-number multiplication. Times one digit, two digits by two, and the shortcut
// multipliers (×5 = ×10 ÷ 2, ×25 = ×100 ÷ 4, ×125 = ×1000 ÷ 8, ×11 digit-sum, near 100).
import { family, q, digits, dropCarryMul, tens, units, intPick } from '../lib.js';

const Z = (n) => (Number.isInteger(n) ? q(n) : null); // null: not a whole number, so not an option
const lastDigit = (a, b) => `${a % 10} × ${b % 10} ends in ${(a % 10) * (b % 10) % 10}, so the answer ends in ${(a * b) % 10}`;
const size = (a, b) => { const r = (n) => (n >= 100 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10); return `${r(a)} × ${r(b)} = ${r(a) * r(b)}`; };

const byOne = {
  levels: [1, 2],
  build(rng, d) {
    const a = d === 1 ? rng.int(13, 99) : rng.int(112, 989), b = rng.int(3, 9);
    if (a % 10 === 0 || a % 10 === 1) return null;
    const c = a * b, t = a - (a % 10), u = a % 10, carry = Math.floor((u * b) / 10);
    const top = digits(a).at(-1), topPlace = 10 ** (String(a).length - 1);
    const wrong = [];
    if (carry) wrong.push([Z(dropCarryMul(a, b)), 'Forgot the carries: wrote only the units digit of each column product.'], [Z(c + 10 * carry), `Added the carry ${carry} twice.`]);
    wrong.push([Z(c - top * topPlace), `Times-table slip: ${top} × ${b} recalled as ${top * (b - 1)} (that is ${top} × ${b - 1}).`]);
    wrong.push([Z(c + 10), 'Carried one ten too many in the middle.'], [Z(c - 10), 'Carried one ten too few in the middle.']);
    wrong.push([Z(c + (rng.chance(0.5) ? 1 : -1)), `Units slip: ${u} × ${b} = ${u * b}, which ends in ${(u * b) % 10}.`]);
    return {
      text: `${a} × ${b} = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${a} by ${b}.`,
      steps: [
        { say: `Split ${a} = ${t} + ${u}: ${t} × ${b} = ${t * b}.`, why: 'Multiply the big part first; its product sets the size of the answer.' },
        { say: `${u} × ${b} = ${u * b}, and ${t * b} + ${u * b} = ${c}.`, why: 'a × b = (tens part) × b + (units part) × b: two easy products, one addition.' },
      ],
      fast: `${t} × ${b} = ${t * b}, + ${u * b} = ${c}: left to right, no carries to remember.`,
      check: `Last digit: ${lastDigit(a, b)}. Size: ${size(a, b)}.`,
      hints: [`Split ${a} into ${t} + ${u}.`, `${t} × ${b} = ${t * b}.`],
      params: { a, b },
    };
  },
};

const timesFive = {
  levels: [1],
  build(rng) {
    const n = rng.chance(0.5) ? rng.int(23, 99) : rng.int(112, 998);
    if (n % 10 === 0) return null;
    const c = n * 5;
    const halfDigits = Number(String(n * 10).split('').map(Number).map((x) => Math.floor(x / 2)).join(''));
    const wrong = [[Z(n * 10), `Multiplied by 10 and forgot to halve: ${n} × 10 = ${n * 10}.`],
      [Z(c + 10), 'Halving slip in the tens: one ten too many.'], [Z(c - 10), 'Halving slip in the tens: one ten too few.'],
      [Z(c + 100), 'Halving slip in the hundreds.']];
    if (n % 2 === 0) wrong.push([Z(n / 2), `Halved ${n} but forgot the × 10.`]);
    if (halfDigits !== c) wrong.push([Z(halfDigits), `Halved ${n * 10} digit by digit and dropped the remainder from an odd digit.`]);
    return {
      text: `${n} × 5 = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${n} by 5.`,
      steps: [
        { say: `× 5 is × 10 ÷ 2: ${n} × 10 = ${n * 10}.`, why: '5 = 10 ÷ 2, so multiplying by 5 is multiplying by 10 and halving.' },
        { say: `${n * 10} ÷ 2 = ${c}.`, why: 'Halving one number is quicker than five times a several-digit number.' },
      ],
      fast: `Halve, then add a zero: ${n} ÷ 2 = ${n / 2}, × 10 = ${c}.`,
      check: `An odd number times 5 ends in 5, an even one in 0: ${n} is ${n % 2 ? 'odd' : 'even'}, so the answer ends in ${c % 10}. Size: half of ${n * 10}.`,
      hints: ['5 = 10 ÷ 2.', `${n} × 10 = ${n * 10}; now halve it.`],
      params: { n, m: 5 },
    };
  },
};

const timesQuarter = {
  levels: [2],
  build(rng) {
    const n = rng.chance(0.6) ? rng.int(12, 99) : rng.int(104, 396);
    if (n % 10 === 0) return null;
    const c = n * 25;
    const wrong = [[Z(c * 2), `Halved only once: ${n * 100} ÷ 2 is × 50, not × 25.`], [Z(c / 2), 'Halved three times: ÷ 8 instead of ÷ 4.'],
      [Z(c + 25), 'Quarter slip: one 25 too many when dividing by 4.'], [Z(c - 25), 'Quarter slip: one 25 too few when dividing by 4.'], [Z(c + 100), 'Hundreds slip while dividing by 4.']];
    if ((n * 10) % 4 === 0) wrong.push([Z((n * 10) / 4), `Used ${n} × 10 ÷ 4: one zero short.`]);
    return {
      text: `${n} × 25 = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${n} by 25.`,
      steps: [
        { say: `× 25 is × 100 ÷ 4: ${n} × 100 = ${n * 100}.`, why: '25 = 100 ÷ 4.' },
        { say: `${n * 100} ÷ 4 = ${c} (halve twice: ${n * 50}, then ${c}).`, why: 'Dividing by 4 is halving twice, which is easier than a long multiplication by 25.' },
      ],
      fast: n % 4 === 0 ? `${n} ÷ 4 = ${n / 4}, then × 100 = ${c}.` : `Quarter ${n}: ${n} ÷ 4 = ${n / 4}, × 100 = ${c}.`,
      check: `× 25 always ends in 00, 25, 50 or 75: ${c} ends in ${String(c).slice(-2)}. Size: a quarter of ${n * 100}.`,
      hints: ['25 = 100 ÷ 4.', `${n} × 100 = ${n * 100}; now halve twice.`],
      params: { n, m: 25 },
    };
  },
};

const timesEighth = {
  levels: [3],
  build(rng) {
    const n = rng.int(12, 96);
    if (n % 10 === 0) return null;
    const c = n * 125;
    const wrong = [[Z(c * 2), `Divided ${n * 1000} by 4 instead of 8.`], [Z(c + 125), 'Eighth slip: one 125 too many.'], [Z(c - 125), 'Eighth slip: one 125 too few.'],
      [Z(c + 1000), 'Thousands slip while halving three times.']];
    if ((n * 100) % 8 === 0) wrong.push([Z((n * 100) / 8), `Used ${n} × 100 ÷ 8: one zero short.`]);
    return {
      text: `${n} × 125 = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${n} by 125.`,
      steps: [
        { say: `× 125 is × 1000 ÷ 8: ${n} × 1000 = ${n * 1000}.`, why: '125 = 1000 ÷ 8.' },
        { say: `${n * 1000} ÷ 8 = ${c} (halve three times: ${n * 500}, ${n * 250}, ${c}).`, why: 'Dividing by 8 is halving three times.' },
      ],
      fast: `${n} ÷ 8 = ${n / 8}, then × 1000 = ${c}.`,
      check: `× 125 always ends in 000, 125, 250, 375, 500, 625, 750 or 875: ${c} ends in ${String(c).slice(-3)}. Size: an eighth of ${n * 1000}, about ${Math.round(n / 8)} thousand.`,
      hints: ['125 = 1000 ÷ 8.', `${n} × 1000 = ${n * 1000}; now halve three times.`],
      params: { n, m: 125 },
    };
  },
};

const timesEleven = {
  levels: [1, 2],
  build(rng, d) {
    const n = intPick(rng, 12, 98, (x) => x % 10 !== 0 && (d === 1 ? units(x) + Math.floor(x / 10) < 10 : units(x) + Math.floor(x / 10) >= 10));
    if (n == null) return null;
    const a = Math.floor(n / 10), b = n % 10, s = a + b, c = n * 11;
    const wrong = [[Z(n * 10), `Multiplied by 10 and forgot to add ${n} once more.`], [Z(c + 10), `Digit-sum slip: ${a} + ${b} taken as ${s + 1}.`], [Z(c - 10), `Digit-sum slip: ${a} + ${b} taken as ${s - 1}.`],
    ];
    if (s < 10 && b !== a) wrong.push([Z(Number(String(c).split('').reverse().join(''))), `Put ${b} in front and ${a} at the back: the digits went the wrong way round.`]);
    if (s >= 10) wrong.push([Z(Number(`${a}${s}${b}`)), `Wrote ${s} in the middle without carrying the 1.`], [Z(a * 100 + (s % 10) * 10 + b), `Dropped the carry: ${s} in the middle, but the 1 never reached ${a}.`]);
    return {
      text: `${n} × 11 = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${n} by 11.`,
      steps: [
        { say: `× 11 is × 10 + × 1: ${n} × 10 + ${n}.`, why: '11 = 10 + 1.' },
        { say: `The digits ${a} and ${b} go outside, their sum ${s} goes in the middle${s >= 10 ? `, carrying 1 into ${a}` : ''}: ${c}.`, why: `${n}0 + ${n}: the tens column adds ${a} and ${b}.` },
      ],
      fast: `${a} _ ${b}, middle ${a} + ${b} = ${s}${s >= 10 ? ' (carry 1)' : ''}: ${c}.`,
      check: `The answer starts with ${Math.floor(c / 100)} and ends in ${b}; it is about 11 × ${n} ≈ ${n * 10 + n}.`,
      hints: ['11 = 10 + 1.', `Put ${a} + ${b} between ${a} and ${b}.`],
      params: { n, m: 11 },
    };
  },
};

const twoByTwo = {
  levels: [2, 3],
  build(rng, d) {
    const a = d === 2 ? rng.int(12, 49) : rng.int(31, 99), b = d === 2 ? rng.int(12, 49) : rng.int(31, 99);
    if (a % 10 === 0 || b % 10 === 0 || a === b || a % 10 === 1 || b % 10 === 1) return null;
    const c = a * b, ta = tens(a), ua = units(a), tb = tens(b), ub = units(b);
    const wrong = [[Z(ta * tb + ua * ub), `Multiplied tens by tens and units by units (${ta} × ${tb} + ${ua} × ${ub}), missing both cross terms.`],
      [Z(c - ta * ub), `Forgot the cross term ${ta} × ${ub}.`], [Z(c - ua * tb), `Forgot the cross term ${ua} × ${tb}.`],
      [Z(c + 10), 'Carry slip in the tens: one carry too many when adding the partial products.'], [Z(c - 10), 'Carry slip in the tens: one carry dropped when adding the partial products.'], [Z(c + 100), 'Carry slip in the hundreds.']];
    return {
      text: `${a} × ${b} = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${a} by ${b}.`,
      steps: [
        { say: `Split ${b} = ${tb} + ${ub}: ${a} × ${tb} = ${a * tb}.`, why: 'Split only one factor; the other stays whole.' },
        { say: `${a} × ${ub} = ${a * ub}.`, why: 'The second partial product: the whole first number times the units.' },
        { say: `${a * tb} + ${a * ub} = ${c}.`, why: 'a × (tens + units) = a × tens + a × units.' },
      ],
      fast: `${a} × ${tb} = ${a * tb}, plus ${a} × ${ub} = ${a * ub}: ${c}.`,
      check: `Last digit: ${lastDigit(a, b)}. Size: ${size(a, b)}.`,
      hints: [`Split ${b} into ${tb} + ${ub}.`, `${a} × ${tb} = ${a * tb}.`],
      params: { a, b },
    };
  },
};

// (100 − x)(100 − y) = 100(100 − x − y) + xy, and its relatives above 100.
const near100 = {
  levels: [3],
  build(rng) {
    const kind = rng.pick(['below', 'above', 'straddle']);
    const x = rng.int(1, 12), y = rng.int(2, 12);
    const a = kind === 'above' ? 100 + x : 100 - x, b = kind === 'below' ? 100 - y : 100 + y;
    if (a === b) return null;
    const c = a * b, da = a - 100, db = b - 100, base = 100 * (100 + da + db), xy = da * db;
    const wrong = [[Z(base), `Forgot the product of the distances from 100 (${da} × ${db}).`], [Z(base - xy), `${xy > 0 ? 'Subtracted' : 'Added'} ${Math.abs(xy)} instead of ${xy > 0 ? 'adding' : 'subtracting'} it.`],
      [Z(c + 10), 'Slip in the tens of the distance product.'], [Z(c - 100), 'Slip in the hundreds when adding the distance product.']];
    if (Math.abs(xy) < 10 && xy > 0) wrong.push([Z(Number(`${(100 + da + db)}${xy}`)), `Did not pad ${xy} to two digits (0${xy}).`]);
    const sgn = (v) => (v < 0 ? `− ${-v}` : `+ ${v}`);
    return {
      text: `${a} × ${b} = ?`, value: Z(c), mode: 'int', wrong,
      ask: `Multiply ${a} by ${b}; both are close to 100.`,
      steps: [
        { say: `Distances from 100: ${a} = 100 ${sgn(da)}, ${b} = 100 ${sgn(db)}.`, why: 'Numbers near 100 multiply fastest through their distances from 100.' },
        { say: `Cross-add: ${a} ${sgn(db)} = ${100 + da + db}, so 100 × ${100 + da + db} = ${base}.`, why: '(100 + p)(100 + q) = 100(100 + p + q) + pq.' },
        { say: `Add the distance product ${da} × ${db} = ${xy}: ${base} ${sgn(xy)} = ${c}.`, why: `The pq term: ${xy > 0 ? 'both on the same side of 100, so it is added' : 'one above and one below 100, so it is subtracted'}.` },
      ],
      fast: `${a} ${sgn(db)} = ${100 + da + db}; then ${da} × ${db} = ${xy}: ${c}.`,
      check: `Last digit: ${lastDigit(a, b)}. Size: about 100 × ${100 + da + db}.`,
      hints: ['Write each number as 100 plus or minus a small distance.', `100 × (${a} ${sgn(db)}) = ${base}; then the distance product.`],
      params: { a, b },
    };
  },
};

export default family({
  id: 'mm-multiply',
  title: 'Multiply',
  skill: 'Multiply exactly with splits and shortcut multipliers: ×5, ×25, ×125, ×11 and numbers near 100',
  levels: [1, 2, 3],
  rule: '×5 = ×10 ÷ 2, ×25 = ×100 ÷ 4, ×125 = ×1000 ÷ 8; ×11 puts the digit sum in the middle; otherwise split one factor.',
  anchor: 'Times tables plus the distributive law: a × (b + c) = a × b + a × c.',
  variants: { byOne, timesFive, timesQuarter, timesEighth, timesEleven, twoByTwo, near100 },
  lesson: {
    purpose: 'Products are the slowest questions on the 80-in-8 unless you see the shortcut. The shortcuts turn a long multiplication into a halving.',
    anchor: 'You know 10, 100 and 1000 times anything. 5, 25 and 125 are those divided by 2, 4 and 8.',
    steps: [
      { say: '× 5 = × 10 ÷ 2: 486 × 5 = 4860 ÷ 2 = 2430.', why: '5 = 10 ÷ 2.' },
      { say: '× 25 = × 100 ÷ 4: 36 × 25 = 3600 ÷ 4 = 900.', why: '25 = 100 ÷ 4; dividing by 4 is halving twice.' },
      { say: '× 125 = × 1000 ÷ 8: 48 × 125 = 48000 ÷ 8 = 6000.', why: '125 = 1000 ÷ 8.' },
      { say: '× 11: put the digit sum in the middle. 47 × 11 = 4 (4+7) 7 = 517.', why: '47 × 11 = 470 + 47; the tens column adds the two digits.' },
    ],
    predict: { question: '64 × 25: before working it out, does the answer end in 00, 25, 50 or 75?', answer: '00: 64 is a multiple of 4, so 64 × 25 = 16 × 100 = 1600.' },
    rule: '×5, ×25, ×125: add zeros, then halve once, twice, three times. Otherwise split one factor.',
    contrast: '× 25 halves twice; × 50 halves once. Halving once for × 25 gives twice the answer.',
  },
});
