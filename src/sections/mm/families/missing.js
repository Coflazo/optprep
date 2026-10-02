// 80-in-8: the missing operand (66 × ? = 138.6, ? − 48 = 175, 735 ÷ ? = 15). Undo the operation
// with its inverse; the classic slip is undoing it with the same operation.
import { family, q, L, borrowPlaces, carryPlaces, smallFromLarge, intPick, tablePicture } from '../lib.js';

const Z = (n) => (Number.isInteger(n) ? q(n) : null);
const D = (m, dp) => q(m, 10 ** dp);

function o({ text, x, mode = 'int', wrong, inverse, why, check, hints, params }) {
  return {
    text, value: x, mode, wrong,
    ask: `Find the missing number in ${text}.`,
    steps: [
      { say: 'Undo the operation with its inverse.', math: `? = ${inverse}`, why },
      { say: 'Work out the inverse directly.', math: `${inverse} = ${L(x)}`, why: 'Now it is a direct calculation.' },
      { say: 'Put the answer back into the question.', math: text.replace('?', L(x)), why: 'Substituting the answer proves it, and catches an inverse taken the wrong way round.' },
    ],
    picture: tablePicture(['', 'Fact'], [['question', text], ['inverse', `? = ${inverse}`], ['answer', `? = ${L(x)}`], ['check', text.replace('?', L(x))]], `One fact, read two ways: the inverse line finds the blank, and the check line puts it back. Undoing with the same operation gives a different number that fails the check.`),
    fast: `? = ${inverse} = ${L(x)}.`,
    check, hints, params,
  };
}

const addL = {
  levels: [1],
  build(rng) {
    const x = rng.int(120, 899), b = rng.int(12, 98), c = x + b;
    if (b % 10 === 0 || !borrowPlaces(c, b).length) return null;
    return o({
      text: `? + ${b} = ${c}`, x: q(x), inverse: `${c} − ${b}`,
      wrong: [[q(c + b), `Added ${b} to ${c} instead of taking it away: undid + with another +.`], [Z(smallFromLarge(c, b)), 'Took the smaller digit from the larger in each column instead of borrowing.'], [q(x + 10), `Borrowed in ${c} − ${b} but did not reduce the tens.`], [q(x - 1), 'Units slip in the subtraction.'], [q(x + 1), 'Units slip in the subtraction.']],
      why: `Something plus ${b} is ${c}, so the something is ${c} take away ${b}.`,
      check: `The missing number is smaller than ${c}. ${x} + ${b} = ${c}.`,
      hints: [`What do you add ${b} to, to get ${c}?`, `${c} − ${b}.`], params: { b, c },
    });
  },
};

const subL = {
  levels: [1],
  build(rng) {
    const c = rng.int(120, 899), b = rng.int(12, 98), x = c + b;
    if (b % 10 === 0 || !carryPlaces(c, b).length) return null;
    const k = carryPlaces(c, b)[0];
    return o({
      text: `? − ${b} = ${c}`, x: q(x), inverse: `${c} + ${b}`,
      wrong: [[q(c - b), `Undid the subtraction with another subtraction (${c} − ${b}): the missing number is where you start, so add back.`], [q(x - 10 ** k), 'Dropped a carry while adding back.'], [q(x + 1), 'Units slip while adding back.'], [q(x - 1), 'Units slip while adding back.']],
      why: `Start from the missing number, take ${b}, land on ${c}: so the start is ${c} + ${b}.`,
      check: `The missing number is bigger than ${c}. ${x} − ${b} = ${c}.`,
      hints: [`If you take ${b} away and get ${c}, where did you start?`, `${c} + ${b}.`], params: { b, c },
    });
  },
};

const subR = {
  levels: [2],
  build(rng) {
    const a = rng.int(300, 999), c = intPick(rng, 112, a - 21, () => true);
    if (c == null) return null;
    const x = a - c;
    if (x % 10 === 0 || !borrowPlaces(a, c).length) return null;
    return o({
      text: `${a} − ? = ${c}`, x: q(x), inverse: `${a} − ${c}`,
      wrong: [[q(a + c), `Added ${a} + ${c}: but the missing number is what was taken away, so it is smaller than ${a}.`], [Z(smallFromLarge(a, c)), 'Took the smaller digit from the larger in each column.'], [q(x + 10), 'Borrow slip: did not reduce the tens.'], [q(x - 1), `Units slip in ${a} − ${c}: the last digit is one too low.`], [q(x + 1), `Units slip in ${a} − ${c}: the last digit is one too high.`]],
      why: `${a} minus something leaves ${c}, so the something is the gap between them: ${a} − ${c}.`,
      check: `The missing number is less than ${a}. ${a} − ${x} = ${c}.`,
      hints: [`What do you take from ${a} to leave ${c}?`, `The gap between ${c} and ${a}.`], params: { a, c },
    });
  },
};

function mulVariant(side, levels) {
  return {
    levels,
    build(rng, d) {
      const b = d === 1 ? rng.int(3, 9) : rng.int(12, 39), x = d === 1 ? rng.int(12, 99) : rng.int(3, 29);
      if (x % 10 === 0 || b % 10 === 0) return null;
      const c = b * x;
      const text = side === 'L' ? `? × ${b} = ${c}` : `${b} × ? = ${c}`;
      return o({
        text, x: q(x), inverse: `${c} ÷ ${b}`,
        wrong: [[q(x + 1), `Off by one: ${b} × ${x + 1} = ${b * (x + 1)}.`], [q(x - 1), `Off by one: ${b} × ${x - 1} = ${b * (x - 1)}.`], [q(c - b), `Subtracted ${b} instead of dividing by it.`], [q(x + 10), `Tens slip: ${b} × ${x + 10} = ${b * (x + 10)}.`], [q(x * 10), 'Wrote an extra zero: the quotient has one digit too many.']],
        why: `${b} times the missing number is ${c}, so it is ${c} shared into ${b}: ${c} ÷ ${b}.`,
        check: `Multiply back: ${b} × ${x} = ${c}. Last digit: ${b % 10} × ${x % 10} ends in ${(b * x) % 10}.`,
        hints: [`How many ${b}s make ${c}?`, `${c} ÷ ${b}.`], params: { b, c },
      });
    },
  };
}

const divR = {
  levels: [2],
  build(rng) {
    const x = rng.int(6, 49), c = rng.int(12, 49);
    if (x % 10 === 0 || c % 10 === 0 || x === c) return null;
    const a = x * c, s = c % 2 === 0 ? 5 : 10;
    return o({
      text: `${a} ÷ ? = ${c}`, x: q(x), inverse: `${a} ÷ ${c}`,
      wrong: [[q(x + 1), `Off by one: ${a} ÷ ${x + 1} is not ${c}.`], [q(x - 1), `Off by one: ${a} ÷ ${x - 1} is not ${c}.`], [q(x + s), `Matched only the last digit: ${c} × ${x + s} also ends in ${a % 10}.`], [x > s ? q(x - s) : null, `Matched only the last digit: ${c} × ${x - s} also ends in ${a % 10}.`]],
      why: `${a} split into the missing number of parts gives ${c} each, so the number of parts is ${a} ÷ ${c}.`,
      check: `Multiply back: ${x} × ${c} = ${a}.`,
      hints: [`How many ${c}s make ${a}?`, `${a} ÷ ${c}.`], params: { a, c },
    });
  },
};

const divL = {
  levels: [2],
  build(rng) {
    const b = rng.int(3, 9), c = rng.int(12, 99);
    if (c % 10 === 0) return null;
    const x = b * c;
    return o({
      text: `? ÷ ${b} = ${c}`, x: q(x), inverse: `${c} × ${b}`,
      wrong: [[q(x + b), `One group too many: ${b} × ${c + 1}.`], [q(x - b), `One group too few: ${b} × ${c - 1}.`], [Z(c / b), `Divided ${c} by ${b} again instead of multiplying back.`], [q(x + 10), `Carry slip in ${c} × ${b}: one ten too many.`], [q(x - 10), `Carry slip in ${c} × ${b}: one ten too few.`]],
      why: `The missing number split into ${b} equal parts gives ${c}, so it is ${b} lots of ${c}.`,
      check: `Divide back: ${x} ÷ ${b} = ${c}. The missing number is bigger than ${c}.`,
      hints: [`What number, divided by ${b}, gives ${c}?`, `${c} × ${b}.`], params: { b, c },
    });
  },
};

const mulDec = {
  levels: [3],
  build(rng) {
    const a = rng.int(12, 99), xm = rng.int(11, 99);
    if (a % 10 === 0 || xm % 10 === 0) return null;
    const x = D(xm, 1), c = x.mul(a);
    if (c.d === 1n) return null;
    return o({
      text: `${a} × ? = ${L(c)}`, x, mode: 'dec', inverse: `${L(c)} ÷ ${a}`,
      wrong: [[x.div(10), 'Put the point one place too far left.'], [x.add(D(1, 1)), `Off by a tenth: ${a} × ${L(x.add(D(1, 1)))} = ${L(x.add(D(1, 1)).mul(a))}.`], [x.sub(D(1, 1)), `Off by a tenth: ${a} × ${L(x.sub(D(1, 1)))} = ${L(x.sub(D(1, 1)).mul(a))}.`], [x.add(1), `Ones slip: ${a} × ${L(x.add(1))} = ${L(x.add(1).mul(a))}.`]],
      why: `${a} times the missing number is ${L(c)}, so it is ${L(c)} ÷ ${a}.`,
      check: `Size: ${L(c)} is about ${Math.round(c.toNumber() / a)} lots of ${a}. Multiply back: ${a} × ${L(x)} = ${L(c)}.`,
      hints: [`${L(c)} ÷ ${a}: ignore the point first (${L(c.mul(10))} ÷ ${a}).`, 'One decimal place in, one decimal place out.'], params: { a, c: L(c) },
    });
  },
};

const divDec = {
  levels: [3],
  build(rng) {
    const b = rng.int(3, 9), c = D(rng.int(11, 99), 1);
    if (c.d === 1n) return null;
    const x = c.mul(b);
    if (x.d === 1n) return null;
    return o({
      text: `? ÷ ${b} = ${L(c)}`, x, mode: 'dec', inverse: `${L(c)} × ${b}`,
      wrong: [[x.add(c), `One group too many: ${b + 1} × ${L(c)}.`], [x.sub(c), `One group too few: ${b - 1} × ${L(c)}.`], [x.div(10), 'Put the point one place too far left.'], [x.add(D(1, 1)), `Tenths slip in ${L(c)} × ${b}: one tenth too many.`], [c.div(b), `Divided ${L(c)} by ${b} again instead of multiplying back.`]],
      why: `The missing number split into ${b} parts gives ${L(c)}, so it is ${b} × ${L(c)}.`,
      check: `Divide back: ${L(x)} ÷ ${b} = ${L(c)}. Size: about ${b} × ${Math.round(c.toNumber())}.`,
      hints: [`What number, divided by ${b}, gives ${L(c)}?`, `${L(c)} × ${b}.`], params: { b, c: L(c) },
    });
  },
};

const subDec = {
  levels: [3],
  build(rng) {
    const bm = rng.int(101, 899), cm = rng.int(11, 99);
    if (bm % 10 === 0 || cm % 10 === 0) return null;
    const b = D(bm, 2), c = D(cm, 1), x = b.add(c);
    if (x.d === 1n) return null;
    return o({
      text: `? − ${L(b)} = ${L(c)}`, x, mode: 'dec', inverse: `${L(c)} + ${L(b)}`,
      wrong: [[c.sub(b), `Undid the subtraction with another subtraction (${L(c)} − ${L(b)}).`], [D(cm + bm, 2), `Lined up the last digits instead of the points: treated ${L(c)} as ${L(D(cm, 2))}.`], [x.add(D(1, 1)), 'Tenths slip while adding back.'], [x.sub(D(1, 1)), 'Tenths slip while adding back.'], [x.sub(1), 'Dropped the carry into the ones.']],
      why: `Start from the missing number, take ${L(b)}, land on ${L(c)}: so the start is ${L(c)} + ${L(b)}.`,
      check: `Bigger than ${L(c)}; ends in ${bm % 10} hundredths. ${L(x)} − ${L(b)} = ${L(c)}.`,
      hints: ['Undo − with +.', `${L(c)} + ${L(b)}, points lined up.`], params: { b: L(b), c: L(c) },
    });
  },
};

const addDec = {
  levels: [3],
  build(rng) {
    const am = rng.int(11, 79), cm = rng.int(301, 999);
    if (am % 10 === 0 || cm % 10 === 0) return null;
    const a = D(am, 1), c = D(cm, 2), x = c.sub(a);
    if (x.d === 1n || x.n <= 0n) return null;
    return o({
      text: `${L(a)} + ? = ${L(c)}`, x, mode: 'dec', inverse: `${L(c)} − ${L(a)}`,
      wrong: [[c.add(a), `Added ${L(a)} to ${L(c)} instead of taking it away.`], [c.sub(D(am, 2)), `Lined up the last digits instead of the points: treated ${L(a)} as ${L(D(am, 2))}.`], [x.add(D(1, 1)), 'Borrowed from the tenths but did not reduce them.'], [x.sub(D(1, 1)), 'Tenths slip in the subtraction: one tenth too few.'], [x.add(1), 'Ones slip: borrowed from the ones but did not reduce them.']],
      why: `${L(a)} plus the missing number is ${L(c)}, so the missing number is ${L(c)} − ${L(a)}.`,
      check: `Smaller than ${L(c)}. ${L(a)} + ${L(x)} = ${L(c)}.`,
      hints: ['Undo + with −.', `${L(c)} − ${L(a)}, points lined up.`], params: { a: L(a), c: L(c) },
    });
  },
};

export default family({
  id: 'mm-missing',
  title: 'Missing number',
  skill: 'Find the missing operand in +, −, × and ÷ (whole numbers and decimals) by undoing the operation',
  levels: [1, 2, 3],
  rule: 'Undo + with −, − with +, × with ÷, ÷ with ×; except a − ? and a ÷ ?, where the missing number is a − c and a ÷ c. Then put the answer back in.',
  anchor: 'Fact families: 8 + 5 = 13 means 13 − 5 = 8 and 13 − 8 = 5.',
  variants: { addL, subL, subR, mulL: mulVariant('L', [1]), mulR: mulVariant('R', [2]), divR, divL, mulDec, divDec, subDec, addDec },
  lesson: {
    purpose: 'About one question in five hides the unknown on the left. One wrong inverse costs a point, so the habit of putting the answer back in pays for itself.',
    anchor: 'You know fact families: 7 × 8 = 56 means 56 ÷ 8 = 7 and 56 ÷ 7 = 8.',
    steps: [
      { say: '? − 48 = 175: the missing number is where you start, so ? = 175 + 48 = 223.', why: 'Undo − with +.' },
      { say: '66 × ? = 138.6: ? = 138.6 ÷ 66 = 2.1.', why: 'Undo × with ÷.' },
      { say: '735 ÷ ? = 15: the unknown is the divisor, so ? = 735 ÷ 15 = 49.', why: 'A divisor is found by dividing, not multiplying.' },
    ],
    predict: { question: '312 − ? = 175: bigger or smaller than 175?', answer: 'Smaller than 312, and here 137: the gap between 175 and 312.' },
    rule: 'Inverse operation, then substitute back before you tap.',
    contrast: '? − 48 = 175 needs + (223), but 312 − ? = 175 needs − (137): where the blank sits decides the inverse.',
  },
});
