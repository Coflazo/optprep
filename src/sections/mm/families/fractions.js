// 80-in-8: fractions with denominators up to 12, all four operations, answers in lowest terms.
import { family, q, L, gcd } from '../lib.js';

const lcm = (a, b) => (a * b) / gcd(a, b);
const F = (n, d) => `${n}/${d}`;
const approx = (x) => Number(x.toNumber().toFixed(2));
// A proper fraction n/d in lowest terms with d from dens.
function proper(rng, dens) {
  const d = rng.pick(dens);
  let n = rng.int(1, d - 1);
  for (let i = 0; i < 20 && gcd(n, d) !== 1; i++) n = rng.int(1, d - 1);
  return gcd(n, d) === 1 ? [n, d] : null;
}
const slip = (x, s) => q(Number(x.n) + s, Number(x.d)); // numerator one off, same denominator
const nonInt = (x) => x.d !== 1n;

function pair(rng, d) {
  const A = proper(rng, d === 3 ? [7, 8, 9, 10, 11, 12] : [2, 3, 4, 5, 6, 8, 9, 10, 12]), B = proper(rng, d === 3 ? [5, 6, 7, 8, 9, 12] : [2, 3, 4, 5, 6, 8, 10, 12]);
  if (!A || !B || A[1] === B[1]) return null;
  const related = A[1] % B[1] === 0 || B[1] % A[1] === 0;
  if (d === 1 ? !related : related) return null;
  if (d === 2 && lcm(A[1], B[1]) > 40) return null;
  return [A, B];
}

function addSub(op) {
  return {
    levels: op === '+' ? [1, 2, 3] : [2, 3],
    build(rng, d) {
      const pr = pair(rng, d);
      if (!pr) return null;
      let [[a, b], [c, e]] = pr;
      if (op === '−' && q(a, b).cmp(q(c, e)) <= 0) [[a, b], [c, e]] = [[c, e], [a, b]];
      const M = lcm(b, e), A = (a * M) / b, C = (c * M) / e, N = op === '+' ? A + C : A - C;
      const v = q(N, M);
      if (!nonInt(v) || N === 0) return null;
      const plus = op === '+';
      const wrong = [[q(plus ? a + c : a - c, plus ? b + e : b - e), `${plus ? 'Added' : 'Subtracted'} the tops and ${plus ? 'added' : 'subtracted'} the bottoms.`],
        [q(plus ? a + c : a - c, M), `Put both over ${M} but did not rescale the tops (${a} and ${c} should become ${A} and ${C}).`],
        [q(N + 1, M), `Numerator slip: ${A} ${op} ${C} taken as ${N + 1}.`], [q(N - 1, M), `Numerator slip: ${A} ${op} ${C} taken as ${N - 1}.`],
        [plus ? q(a * c, b * e) : q(a, b).add(q(c, e)), plus ? 'Multiplied instead of adding.' : 'Added instead of subtracting.']];
      if (M !== b * e) wrong.push([q(N, b * e), `Rescaled the tops to ${M}ths but wrote ${b * e} underneath.`]);
      const reduced = q(N, M).toString() !== F(N, M);
      return {
        text: `${F(a, b)} ${op} ${F(c, e)} = ?`, value: v, mode: 'frac', wrong,
        ask: `${plus ? 'Add' : 'Subtract'} the fractions and give the answer in lowest terms.`,
        steps: [
          { say: `Common denominator ${M}: ${F(a, b)} = ${F(A, M)} and ${F(c, e)} = ${F(C, M)}.`, why: `Only pieces of the same size can be ${plus ? 'added' : 'subtracted'}; ${M} is the smallest number both ${b} and ${e} divide.` },
          { say: `${F(A, M)} ${op} ${F(C, M)} = ${F(N, M)}${reduced ? ` = ${v}` : ''}.`, why: `${plus ? 'Add' : 'Subtract'} the tops; the bottom names the piece size and stays${reduced ? ', then cancel the common factor' : ''}.` },
        ],
        fast: M === Math.max(b, e) ? `Only ${b < e ? F(a, b) : F(c, e)} needs rescaling, to ${M}ths: ${F(A, M)} ${op} ${F(C, M)} = ${v}.` : `Cross-multiply: (${a} × ${e} ${op} ${c} × ${b}) / (${b} × ${e}) = ${F(a * e + (plus ? 1 : -1) * c * b, b * e)} = ${v}.`,
        check: `Size: ${approx(q(a, b))} ${op} ${approx(q(c, e))} ≈ ${approx(v)}, and ${v} ≈ ${approx(v)}. The bottom of the answer divides ${M}.`,
        hints: [`What is the smallest number both ${b} and ${e} go into?`, `${F(a, b)} = ${F(A, M)}, ${F(c, e)} = ${F(C, M)}.`],
        params: { a: F(a, b), b: F(c, e), op },
      };
    },
  };
}

const mul = {
  levels: [1, 2],
  build(rng, d) {
    const A = proper(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]), B = proper(rng, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    if (!A || !B) return null;
    const [[a, b], [c, e]] = [A, B];
    const v = q(a * c, b * e);
    if (!nonInt(v)) return null;
    const cancels = gcd(a, e) > 1 || gcd(c, b) > 1;
    if (d === 1 ? !cancels : false) return null;
    const wrong = [[q(a * e, b * c), 'Turned the second fraction over, as if dividing.'], [q(a * c, b + e), 'Multiplied the tops but added the bottoms.'],
      [q(b * e, a * c), 'Inverted the answer: top and bottom swapped.'], [slip(v, 1), 'Cancelling slip: the top is one too big.'], [slip(v, -1), 'Cancelling slip: the top is one too small.'], [q(a + c, b + e), 'Added tops and bottoms instead of multiplying.']];
    return {
      text: `${F(a, b)} × ${F(c, e)} = ?`, value: v, mode: 'frac', wrong,
      ask: 'Multiply the fractions and give the answer in lowest terms.',
      steps: [
        { say: cancels ? `Cancel across first: ${gcd(a, e) > 1 ? `${a} and ${e} share ${gcd(a, e)}` : `${c} and ${b} share ${gcd(c, b)}`}.` : `Nothing cancels: ${a} and ${e} share no factor, nor do ${c} and ${b}.`, why: 'A top and a bottom anywhere in a product can be divided by a common factor before multiplying: smaller numbers, no reducing later.' },
        { say: `Tops times tops, bottoms times bottoms: ${F(a * c, b * e)} = ${v}.`, why: 'a/b × c/d = ac/bd: a fraction of a fraction.' },
      ],
      fast: `${F(a, b)} × ${F(c, e)}: cancel, then ${v}.`,
      check: `Both factors are below 1, so the product is smaller than each: ${approx(v)} < ${Math.min(approx(q(a, b)), approx(q(c, e)))}.`,
      hints: ['Look for a top and a bottom that share a factor.', 'Multiply the tops, multiply the bottoms.'],
      params: { a: F(a, b), b: F(c, e), op: '×' },
    };
  },
};

const div = {
  levels: [2, 3],
  build(rng, d) {
    const A = proper(rng, [2, 3, 4, 5, 6, 8, 9, 10, 12]), B = proper(rng, d === 3 ? [5, 7, 8, 9, 10, 11, 12] : [3, 4, 5, 6, 8, 10]);
    if (!A || !B) return null;
    const [[a, b], [c, e]] = [A, B];
    if (a * e === b * c) return null;
    const v = q(a * e, b * c);
    if (!nonInt(v)) return null;
    const wrong = [[q(a * c, b * e), 'Multiplied straight across without turning the second fraction over.'], [q(b * c, a * e), 'Turned the first fraction over instead of the second: the answer came out upside down.'],
      [slip(v, 1), 'Cancelling slip: the top is one too big.'], [slip(v, -1), 'Cancelling slip: the top is one too small.'], [q(a * e, b + c), `Cross-multiplied ${a} × ${e} on top but added ${b} + ${c} underneath.`]];
    return {
      text: `${F(a, b)} ÷ ${F(c, e)} = ?`, value: v, mode: 'frac', wrong,
      ask: 'Divide the first fraction by the second; answer in lowest terms.',
      steps: [
        { say: `Dividing by ${F(c, e)} is multiplying by ${F(e, c)}: ${F(a, b)} × ${F(e, c)}.`, why: `How many ${F(c, e)}s fit: multiplying by the flipped fraction undoes multiplying by ${F(c, e)}.` },
        { say: `${F(a * e, b * c)} = ${v}.`, why: 'Then multiply tops and bottoms and cancel.' },
      ],
      fast: `Keep, change, flip: ${F(a, b)} × ${F(e, c)} = ${v}.`,
      check: `${q(c, e).cmp(q(a, b)) > 0 ? `${F(c, e)} is bigger than ${F(a, b)}, so the answer is below 1` : `${F(c, e)} is smaller than ${F(a, b)}, so the answer is above 1`}: ${v} ≈ ${approx(v)}.`,
      hints: ['Flip the second fraction and multiply.', `${F(a, b)} × ${F(e, c)}.`],
      params: { a: F(a, b), b: F(c, e), op: '÷' },
    };
  },
};

const withWhole = {
  levels: [1, 3],
  build(rng, d) {
    const A = proper(rng, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    if (!A) return null;
    const [a, b] = A, n = rng.int(2, 12), times = d === 1;
    const v = times ? q(a * n, b) : q(a, b * n);
    if (!nonInt(v)) return null;
    const wrong = times
      ? [[q(a, b * n), `Divided by ${n} instead of multiplying.`], [q(a * n, b * n), `Multiplied the top and the bottom by ${n}: that leaves ${F(a, b)} unchanged.`], [q(a + n, b), `Added ${n} to the top.`], [slip(v, 1), 'Cancelling slip: the top is one too big.'], [slip(v, -1), 'Cancelling slip: the top is one too small.']]
      : [[q(a * n, b), `Multiplied by ${n} instead of dividing.`], [q(a, b + n), `Added ${n} to the bottom.`], [q(b * n, a), 'Inverted the answer: top and bottom swapped.'], [slip(v, 1), 'Numerator slip: the top is one too big.'], [q(a * n, b * n), `Multiplied top and bottom by ${n}.`]];
    const op = times ? '×' : '÷';
    return {
      text: `${F(a, b)} ${op} ${n} = ?`, value: v, mode: 'frac', wrong,
      ask: `${times ? 'Multiply' : 'Divide'} ${F(a, b)} by ${n}; answer in lowest terms.`,
      steps: times
        ? [{ say: `Only the top is multiplied: ${F(a, b)} × ${n} = ${F(a * n, b)}.`, why: `${n} lots of ${a} pieces of size 1/${b} are ${a * n} pieces of the same size.` }, { say: `Cancel: ${F(a * n, b)} = ${v}.`, why: 'Divide top and bottom by their common factor.' }]
        : [{ say: `Only the bottom is multiplied: ${F(a, b)} ÷ ${n} = ${F(a, b * n)}.`, why: `Cutting each 1/${b} piece into ${n} makes pieces of size 1/${b * n}.` }, { say: `Cancel if possible: ${v}.`, why: 'Lowest terms: divide top and bottom by any common factor.' }],
      fast: times ? `Cancel ${n} against ${b} first, then multiply: ${v}.` : `${F(a, b)} ÷ ${n} = ${F(a, b * n)} = ${v}.`,
      check: times ? `${n} × ${approx(q(a, b))} ≈ ${approx(v)}: the answer is ${n} times bigger.` : `${approx(q(a, b))} ÷ ${n} ≈ ${approx(v)}: the answer is ${n} times smaller.`,
      hints: [times ? 'Multiply only the top.' : 'Multiply only the bottom.', 'Then cancel.'],
      params: { a: F(a, b), n, op },
    };
  },
};

export default family({
  id: 'mm-fractions',
  title: 'Fractions',
  skill: 'Add, subtract, multiply and divide fractions with denominators up to 12, answers in lowest terms',
  levels: [1, 2, 3],
  rule: '+ and −: common denominator, then tops. ×: cancel across, then tops times tops over bottoms times bottoms. ÷: flip the second and multiply.',
  anchor: 'A fraction counts pieces: 3/8 is three pieces of size one eighth.',
  variants: { add: addSub('+'), sub: addSub('−'), mul, div, withWhole },
  lesson: {
    purpose: 'Fraction options on the test differ by exactly the classic slips (added tops and bottoms, flipped the wrong fraction), so knowing the slips is worth as much as knowing the method.',
    anchor: 'You know that 1/4 + 1/4 = 2/4: same-sized pieces add by counting. Everything else is making the pieces the same size.',
    steps: [
      { say: '+ and −: rescale to a common denominator. 2/3 + 3/4 = 8/12 + 9/12 = 17/12.', why: 'Only equal pieces add.' },
      { say: '×: cancel across, then multiply. 2/3 × 9/10 = 1/1 × 3/5 = 3/5.', why: 'A fraction of a fraction: tops times tops, bottoms times bottoms.' },
      { say: '÷: flip the second and multiply. 3/4 ÷ 9/10 = 3/4 × 10/9 = 5/6.', why: 'Dividing by 9/10 undoes multiplying by 9/10.' },
    ],
    predict: { question: '1/2 + 1/3: is the answer 2/5?', answer: 'No: 2/5 is less than 1/2 alone. It is 3/6 + 2/6 = 5/6.' },
    rule: 'Same pieces before adding; cancel before multiplying; flip the second before dividing.',
    contrast: 'Adding tops and bottoms (1/2 + 1/3 → 2/5) gives an answer smaller than one of the parts: a size check catches it.',
  },
});
