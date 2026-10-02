// 80-in-8: two or three operations in one line. Brackets first, then × and ÷ left to right,
// then + and − left to right. The tempting wrong answer is always the one read left to right.
import { family, q } from '../lib.js';

// Expression tree, root (the answer) on the left; every box is worked out from the boxes to its right.
// node: [text, ...children] for an operation, or a number for a leaf.
function tree(node, caption) {
  const nodes = [], edges = [];
  let n = 0;
  const walk = (x, depth) => {
    const id = `n${n++}`;
    if (Array.isArray(x)) {
      nodes.push({ id, text: x[0], kind: depth === 0 ? 'a' : 'q' });
      for (const c of x.slice(1)) edges.push({ from: id, to: walk(c, depth + 1) });
    } else nodes.push({ id, text: String(x), kind: 'note' });
    return id;
  };
  walk(node, 0);
  return { diagram: 'flow', spec: { root: 'n0', nodes, edges, label: 'Expression tree' }, caption };
}
const TREE = 'Expression tree: each box is worked out from the boxes to its right, so the deepest operation goes first and the box on the left is the answer.';

const Z = (n) => (Number.isInteger(n) && n > 0 ? q(n) : null);
const ORDER = 'Brackets first, then × and ÷, then + and −; equal ranks go left to right.';

const addMul = {
  levels: [1],
  build(rng) {
    const a = rng.int(5, 60), b = rng.int(3, 12), c = rng.int(3, 12), first = rng.chance(0.5);
    const v = a + b * c;
    const text = first ? `${a} + ${b} × ${c} = ?` : `${b} × ${c} + ${a} = ?`;
    const wrong = [[Z(v + b), `Times-table slip: ${b} × ${c} recalled as ${b * (c + 1)}.`], [Z(v - b), `Times-table slip: ${b} × ${c} recalled as ${b * (c - 1)}.`], [Z(v + 10), 'Carry slip in the final addition.'], [Z(a + b + c), 'Added all three numbers: the × became a +.']];
    if (first) wrong.unshift([Z((a + b) * c), `Worked left to right: (${a} + ${b}) × ${c}.`]);
    else wrong.unshift([Z(b * (c + a)), `Added ${c} + ${a} first, then multiplied.`]);
    return {
      text, value: q(v), mode: 'int', wrong,
      ask: 'Evaluate the line with the order of operations.',
      steps: [
        { say: '× before +: work out the product first.', math: `${b} × ${c} = ${b * c}`, why: ORDER },
        { say: 'Add.', math: `${a} + ${b * c} = ${v}`, why: 'Only the addition is left.' },
      ],
      picture: tree([`+  gives ${v}`, a, [`×  gives ${b * c}`, b, c]], TREE),
      fast: `Spot the × first (${b * c}), then add ${a}: ${v}.`,
      check: `The answer is ${a} plus a product, so it is more than ${b * c}. Last digit: ${a % 10} + ${(b * c) % 10} ends in ${v % 10}.`,
      hints: ['Which operation goes first?', `${b} × ${c} = ${b * c}.`],
      params: { a, b, c },
    };
  },
};

const subMul = {
  levels: [1],
  build(rng) {
    const b = rng.int(3, 12), c = rng.int(3, 12), a = b * c + rng.int(6, 90);
    const v = a - b * c;
    const wrong = [[Z((a - b) * c), `Worked left to right: (${a} − ${b}) × ${c}.`], [Z(v + b), `Times-table slip: ${b} × ${c} recalled as ${b * (c - 1)}.`], [Z(v - b), `Times-table slip: ${b} × ${c} recalled as ${b * (c + 1)}.`],
      [Z(v + 10), 'Borrow slip in the subtraction.'], [Z(v - 10), 'Borrow slip in the subtraction.'], [Z(a - b - c), 'Subtracted both numbers: the × became a −.']];
    return {
      text: `${a} − ${b} × ${c} = ?`, value: q(v), mode: 'int', wrong,
      ask: 'Evaluate the line with the order of operations.',
      steps: [
        { say: '× before −: work out the product first.', math: `${b} × ${c} = ${b * c}`, why: ORDER },
        { say: 'Subtract.', math: `${a} − ${b * c} = ${v}`, why: 'Only the subtraction is left.' },
      ],
      picture: tree([`−  gives ${v}`, a, [`×  gives ${b * c}`, b, c]], TREE),
      fast: `${b * c} first, then ${a} − ${b * c} = ${v}.`,
      check: `Add back: ${v} + ${b * c} = ${a}.`,
      hints: ['× goes before −.', `${b} × ${c} = ${b * c}.`],
      params: { a, b, c },
    };
  },
};

const twoProducts = {
  levels: [2],
  build(rng) {
    const a = rng.int(3, 12), b = rng.int(3, 12), c = rng.int(3, 12), d = rng.int(3, 12), plus = rng.chance(0.6);
    const v = plus ? a * b + c * d : a * b - c * d;
    if (v <= 0) return null;
    const op = plus ? '+' : '−';
    const wrong = [[Z(plus ? (a * b + c) * d : (a * b - c) * d), `Worked left to right: (${a} × ${b} ${op} ${c}) × ${d}.`], [Z(a * (plus ? b + c : b - c) * d), `Did the middle ${b} ${op} ${c} first.`],
      [Z(v + a), `Times-table slip: ${a} × ${b} recalled as ${a * (b + 1)}.`], [Z(plus ? v - d : v + d), `Times-table slip: ${c} × ${d} recalled as ${(c - 1) * d}.`], [Z(v + 10), 'Carry slip in the final + or −: one ten too many.']];
    return {
      text: `${a} × ${b} ${op} ${c} × ${d} = ?`, value: q(v), mode: 'int', wrong,
      ask: 'Evaluate the line with the order of operations.',
      steps: [
        { say: 'Both products first.', math: `${a} × ${b} = ${a * b};  ${c} × ${d} = ${c * d}`, why: ORDER },
        { say: `Then the ${plus ? 'addition' : 'subtraction'}.`, math: `${a * b} ${op} ${c * d} = ${v}`, why: 'The + or − joins the two products.' },
      ],
      picture: tree([`${op}  gives ${v}`, [`×  gives ${a * b}`, a, b], [`×  gives ${c * d}`, c, d]], TREE),
      fast: `${a * b} ${op} ${c * d} = ${v}.`,
      check: `Size: ${a * b} ${op} ${c * d}. Last digit: ${(a * b) % 10} ${op} ${(c * d) % 10} gives ${v % 10}.`,
      hints: ['Two products joined by one + or −.', `${a} × ${b} = ${a * b}.`],
      params: { a, b, c, d },
    };
  },
};

const addDiv = {
  levels: [2],
  build(rng) {
    const c = rng.int(3, 12), k = rng.int(4, 25), b = c * k, a = rng.int(6, 90), first = rng.chance(0.6);
    const v = a + k;
    const wrong = [[Z(v + 1), `Off by one: ${b} ÷ ${c} taken as ${k + 1}.`], [Z(v - 1), `Off by one: ${b} ÷ ${c} taken as ${k - 1}.`], [Z(v + 10), 'Carry slip in the addition.'], [Z(a + b - c), 'Subtracted instead of dividing.']];
    if (first) wrong.unshift([Z((a + b) / c), `Worked left to right: (${a} + ${b}) ÷ ${c}.`]);
    return {
      text: first ? `${a} + ${b} ÷ ${c} = ?` : `${b} ÷ ${c} + ${a} = ?`, value: q(v), mode: 'int', wrong,
      ask: 'Evaluate the line with the order of operations.',
      steps: [
        { say: '÷ before +: work out the division first.', math: `${b} ÷ ${c} = ${k}`, why: ORDER },
        { say: 'Add.', math: `${a} + ${k} = ${v}`, why: 'Only the addition is left.' },
      ],
      picture: tree([`+  gives ${v}`, a, [`÷  gives ${k}`, b, c]], TREE),
      fast: `${b} ÷ ${c} = ${k}, + ${a} = ${v}.`,
      check: `Multiply back: ${c} × ${k} = ${b}. The answer is a little more than ${a}.`,
      hints: ['Divide before you add.', `${b} ÷ ${c} = ${k}.`],
      params: { a, b, c },
    };
  },
};

const divMul = {
  levels: [3],
  build(rng) {
    const b = rng.int(2, 9), c = rng.int(2, 9), m = rng.int(2, 9), a = b * c * m;
    if (b === c) return null;
    const v = (a / b) * c;
    const wrong = [[Z(a / (b * c)), `Multiplied ${b} × ${c} first: × and ÷ have equal rank and go left to right.`], [Z(v + c), `Slip in ${a} ÷ ${b}: one too many.`], [Z(v - c), `Slip in ${a} ÷ ${b}: one too few.`], [Z(v + 10), 'Carry slip in the multiplication: one ten too many.'], [Z(v - 10), 'Carry slip in the multiplication: one ten too few.']];
    return {
      text: `${a} ÷ ${b} × ${c} = ?`, value: q(v), mode: 'int', wrong,
      ask: 'Evaluate left to right: ÷ and × have equal rank.',
      steps: [
        { say: 'Equal rank, so left to right: the division first.', math: `${a} ÷ ${b} = ${a / b}`, why: ORDER },
        { say: 'Multiply.', math: `${a / b} × ${c} = ${v}`, why: 'Then the multiplication.' },
      ],
      picture: tree([`×  gives ${v}`, [`÷  gives ${a / b}`, a, b], c], `${TREE} Equal ranks nest from the left, so ${a} ÷ ${b} sits deepest.`),
      fast: `${a} ÷ ${b} = ${a / b}, × ${c} = ${v}.`,
      check: `Dividing by ${b} then multiplying by ${c} scales ${a} by ${c}/${b}: ${c > b ? 'bigger' : 'smaller'} than ${a}.`,
      hints: ['× and ÷ have the same rank.', 'Go left to right.'],
      params: { a, b, c },
    };
  },
};

const brackets = {
  levels: [3],
  build(rng) {
    const kind = rng.pick(['mul', 'sub']);
    if (kind === 'mul') {
      const a = rng.int(3, 19), b = rng.int(3, 19), c = rng.int(3, 9), d = rng.int(2, 40);
      const v = (a + b) * c - d;
      if (v <= 0) return null;
      const wrong = [[Z(a + b * c - d), `Ignored the brackets: multiplied ${b} × ${c} first.`], [Z((a + b) * (c - d)), `Subtracted ${d} from ${c} before multiplying.`], [Z(v + 10), 'Borrow slip in the subtraction.'], [Z(v + c), `Slip in ${a + b} × ${c}: one ${c} too many.`], [Z(v - c), `Slip in ${a + b} × ${c}: one ${c} too few.`]];
      return {
        text: `(${a} + ${b}) × ${c} − ${d} = ?`, value: q(v), mode: 'int', wrong,
        ask: 'Evaluate the line with the order of operations.',
        steps: [
          { say: 'Brackets first.', math: `${a} + ${b} = ${a + b}`, why: ORDER },
          { say: 'Then the multiplication.', math: `${a + b} × ${c} = ${(a + b) * c}`, why: '× before −.' },
          { say: 'Then the subtraction.', math: `${(a + b) * c} − ${d} = ${v}`, why: 'The subtraction comes last.' },
        ],
        picture: tree([`−  gives ${v}`, [`×  gives ${(a + b) * c}`, [`( + )  gives ${a + b}`, a, b], c], d], TREE),
        fast: `${a + b} × ${c} = ${(a + b) * c}, − ${d} = ${v}.`,
        check: `Size: ${a + b} × ${c} is ${(a + b) * c}; the answer is ${d} below it.`,
        hints: ['Brackets first.', `${a + b} × ${c}.`],
        params: { a, b, c, d },
      };
    }
    const a = rng.int(150, 900), b = rng.int(40, 140), c = rng.int(11, b - 5);
    const v = a - (b - c);
    const wrong = [[Z(a - b - c), `Dropped the brackets without turning − ${c} into + ${c}.`], [Z(a + b - c), 'Added the bracket instead of subtracting it.'], [Z(v + 10), 'Borrow slip: the tens digit was not reduced.'], [Z(v - 10), 'Borrow slip: the tens digit was reduced twice.'], [Z(v + 1), 'Units slip in the last subtraction: one too high.']];
    return {
      text: `${a} − (${b} − ${c}) = ?`, value: q(v), mode: 'int', wrong,
      ask: 'Evaluate the line with the order of operations.',
      steps: [
        { say: 'Brackets first.', math: `${b} − ${c} = ${b - c}`, why: ORDER },
        { say: 'Then the outer subtraction.', math: `${a} − ${b - c} = ${v}`, why: 'Then the outer subtraction.' },
      ],
      picture: tree([`−  gives ${v}`, a, [`( − )  gives ${b - c}`, b, c]], `${TREE} The bracket is one number, ${b - c}, so all of it is taken away.`),
      fast: `${a} − ${b} + ${c} = ${v}: a minus in front of brackets flips the sign inside.`,
      check: `Taking away less than ${b}: the answer is between ${a - b} and ${a}.`,
      hints: ['Brackets first.', `${b} − ${c} = ${b - c}.`],
      params: { a, b, c },
    };
  },
};

export default family({
  id: 'mm-mixed',
  title: 'Order of operations',
  skill: 'Evaluate two- and three-operation lines: brackets, then × and ÷ left to right, then + and − left to right',
  levels: [1, 2, 3],
  rule: 'Brackets, then × and ÷ left to right, then + and − left to right. A minus in front of brackets flips every sign inside.',
  anchor: 'Multiplication is repeated addition, so 2 + 3 × 4 means 2 plus three lots of 4.',
  variants: { addMul, subMul, twoProducts, addDiv, divMul, brackets },
  lesson: {
    purpose: 'Mixed lines are built so that reading them left to right gives one of the options. The order of operations is the whole question.',
    anchor: '3 × 4 is three fours, a single quantity. In 2 + 3 × 4 that quantity is added to 2: 14.',
    steps: [
      { say: '12 + 8 × 5: × first, 8 × 5 = 40, then 12 + 40 = 52.', why: 'Products bind tighter than sums.' },
      { say: '48 ÷ 4 × 3: equal rank, left to right: 12 × 3 = 36.', why: '× and ÷ are one rank; the leftmost goes first.' },
      { say: '500 − (90 − 25) = 500 − 65 = 435.', why: 'Brackets first; or flip the signs inside: 500 − 90 + 25.' },
    ],
    predict: { question: '48 ÷ 4 × 3: is the answer 4 or 36?', answer: '36: left to right, 48 ÷ 4 = 12, then × 3. The 4 comes from doing 4 × 3 first.' },
    rule: 'Brackets, × ÷, + −; ties left to right.',
    contrast: '(12 + 8) × 5 = 100 but 12 + 8 × 5 = 52: brackets change the order.',
  },
});
