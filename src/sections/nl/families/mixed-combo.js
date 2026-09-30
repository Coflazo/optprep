import { family, q, L, nz, signed } from '../lib.js';

// Two-rule combinations: a multiplier plus a term that depends on the position.
const V = {
  plusIndex: (rng) => ({ v: 'plusIndex', k: rng.pick([2, 3]), s: rng.int(0, 3), a: rng.int(1, 5) }),
  minusIndex: (rng) => ({ v: 'minusIndex', k: rng.pick([2, 3]), s: rng.int(1, 4), a: rng.int(4, 9) }),
  altConst: (rng) => ({ v: 'altConst', k: rng.pick([2, 3]), c: rng.int(1, 5), a: rng.int(1, 6) }),
  indexMul: (rng) => ({ v: 'indexMul', s: rng.int(0, 1), c: nz(rng, -3, 3), a: rng.int(1, 4) }),
};
const extra = (p, i) => (p.v === 'plusIndex' ? i + p.s : p.v === 'minusIndex' ? -(i + p.s) : p.v === 'altConst' ? (i % 2 ? p.c : -p.c) : p.c);
const mult = (p, i) => (p.v === 'indexMul' ? i + p.s : p.k);
const describeExtra = (p) => (p.v === 'plusIndex' ? `add ${1 + p.s}, ${2 + p.s}, ${3 + p.s}, …` : p.v === 'minusIndex' ? `subtract ${1 + p.s}, ${2 + p.s}, ${3 + p.s}, …` : p.v === 'altConst' ? `alternately add ${p.c} and subtract ${p.c}` : `${p.c < 0 ? 'subtract' : 'add'} ${Math.abs(p.c)}`);

export default family({
  id: 'mixed-combo',
  title: 'Two rules combined',
  skill: 'Peel off the dominant rule (the multiplier) and solve whatever is left over as its own sequence',
  levels: [5],
  show: 6,
  params: (rng) => rng.pick(Object.values(V))(rng),
  accept: (p, xs) => xs.every((v) => !v.isZero()) && new Set(xs.map((v) => v.toString())).size === xs.length,
  terms: (p, n) => { const out = [q(p.a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].mul(q(mult(p, i))).add(q(extra(p, i)))); return out; },
  rule: (p) => `multiply by ${p.v === 'indexMul' ? `${1 + p.s}, ${2 + p.s}, ${3 + p.s}, …` : p.k}, then ${describeExtra(p)}`,
  explain: (p, { shown }) => {
    const left = shown.slice(1).map((v, i) => v.sub(shown[i].mul(q(mult(p, i + 1)))));
    return [
      { say: `The terms grow by roughly ×${p.v === 'indexMul' ? `${1 + p.s}, ×${2 + p.s}, …` : p.k}. Subtract that multiple of the previous term: leftovers ${left.map(L).join(', ')}.`, why: 'The multiplier dominates the growth; removing it exposes the second rule.' },
      { say: `The leftovers ${p.v === 'plusIndex' || p.v === 'minusIndex' ? 'count steadily' : p.v === 'altConst' ? 'alternate in sign' : 'are constant'}: ${describeExtra(p)}.`, why: 'The leftover sequence is simple on its own, so the full rule is multiplier + leftover.' },
    ];
  },
  compute: (p, all, k) => `Term ${k + 1} = ${mult(p, k)} × ${L(all[k - 1])} ${signed(extra(p, k))} = ${L(all[k])}.`,
  rivals: (p, { shown }) => {
    const n = shown.length, a = shown[n - 1], m = mult(p, n);
    const out = [
      { value: a.mul(q(m)).add(q(extra(p, n - 1))), misconception: `Reused the last leftover (${signed(extra(p, n - 1))}); the leftover moves on to ${signed(extra(p, n))}.` },
      { value: a.mul(q(m)), misconception: `Applied the multiplier ×${m} but dropped the leftover ${signed(extra(p, n))}.` },
    ];
    if (p.v === 'indexMul') out.push({ value: a.mul(q(m - 1)).add(q(p.c)), misconception: `Reused the multiplier ${m - 1}; it rises to ${m}.` });
    else out.push({ value: a.mul(q(m)).sub(q(extra(p, n))), misconception: `Right multiplier, but the leftover with the wrong sign (${signed(-extra(p, n))}).` });
    return out;
  },
  hints: () => ['Estimate the ratio between neighbours: roughly what multiplier drives the growth?', 'Subtract multiplier × previous from each term and study the leftovers.'],
  anchor: 'The affine rule k·a(n−1) + c, with one change: the added part c is itself a small sequence (n, ±c, …) or the multiplier counts up.',
  srule: 'Two rules → remove the dominant multiplier, solve the leftover sequence, recombine.',
  lesson: {
    purpose: 'The last items of the test stack two simple rules. The method is to peel them apart, not to guess a formula.',
    anchor: 'a(n) = k·a(n−1) + c, where the only change is that c now varies with the position.',
    steps: [
      { say: 'Estimate the multiplier from the ratios (they approach k).', why: 'Multiplication dominates growth, so it is visible first.' },
      { say: 'Compute leftovers a(n) − k·a(n−1) and solve them as their own sequence.', why: 'What remains after removing the dominant rule is the second rule.' },
      { say: 'Next = k × last + next leftover.', why: 'Recombine both rules for the next step.' },
    ],
    predict: { question: '1, 3, 8, 19, 42, ? (×2, then add 1, 2, 3, …)', answer: '89 = 2 × 42 + 5.' },
    rule: 'Two rules → remove the dominant multiplier, solve the leftover sequence, recombine.',
    contrast: 'If the leftovers are constant, it is the plain affine rule; if they count or alternate, it is a combination.',
    edge: 'With a multiplier that counts up (×1, ×2, ×3) and a constant, the ratios drift upward; subtract n × previous to see the constant.',
  },
});
