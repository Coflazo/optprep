import { Q } from '../../../core/rational.js';
import { family, q, L, list, diffsQ, ratiosQ } from '../lib.js';

// Strand kinds: arithmetic, geometric, quadratic, fibonacci-like.
const STRAND = {
  arith: (rng) => ({ k: 'arith', a: rng.int(1, 30), d: rng.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6, 7]) }),
  geo: (rng) => ({ k: 'geo', a: rng.int(1, 5), r: rng.pick([2, 3]) }),
  quad: (rng) => ({ k: 'quad', a: rng.int(1, 10), d: rng.int(1, 5), s: rng.int(1, 3) }),
  fib: (rng) => ({ k: 'fib', a: rng.int(1, 5), b: rng.int(2, 7) }),
};
function strandTerm(st, j) {
  if (st.k === 'arith') return Q.of(st.a + j * st.d);
  if (st.k === 'geo') return Q.of(st.a * st.r ** j);
  if (st.k === 'quad') return Q.of(st.a + j * st.d + (st.s * j * (j - 1)) / 2);
  let [x, y] = [st.a, st.b];
  for (let i = 0; i < j; i++) [x, y] = [y, x + y];
  return Q.of(x);
}
const describe = (st) => ({
  arith: `adds ${st.d}`, geo: `multiplies by ${st.r}`, quad: `has gaps growing by ${st.s}`, fib: 'adds its previous two terms',
})[st.k];
const strandCheck = (xs, st) => (st.k === 'geo' ? `ratios ${ratiosQ(xs).map(L).join(', ')}` : st.k === 'fib' ? `${L(xs[0])} + ${L(xs[1])} = ${L(xs[2])}` : `gaps ${list(diffsQ(xs))}`);

export default family({
  id: 'interleaved',
  title: 'Two interleaved sequences',
  skill: 'When neighbours make no sense, read every second term',
  levels: [2, 3, 4, 5],
  show: (d, p) => p.show,
  missing: 2,
  params: (rng, d) => {
    const show = d <= 3 ? rng.pick([6, 7]) : 7;
    // the strand holding the next term has only 3 visible terms: keep it arithmetic or geometric
    const nextKind = d === 2 ? 'arith' : rng.pick(['arith', 'geo']);
    const otherKind = d === 2 ? 'arith' : d === 3 ? (nextKind === 'arith' ? 'geo' : 'arith') : d === 4 ? 'quad' : 'fib';
    const nextStrand = STRAND[nextKind](rng), other = STRAND[show === 7 || otherKind === 'arith' || otherKind === 'geo' ? otherKind : 'arith'](rng);
    // position show belongs to strand (show % 2)
    const strands = show % 2 === 0 ? [nextStrand, other] : [other, nextStrand];
    return { show, strands };
  },
  terms: ({ strands }, n) => Array.from({ length: n }, (_, i) => strandTerm(strands[i % 2], Math.floor(i / 2))),
  rule: ({ strands }) => `odd positions ${describe(strands[0])}; even positions ${describe(strands[1])}`,
  explain: ({ strands }, { shown }) => {
    const A = shown.filter((_, i) => i % 2 === 0), B = shown.filter((_, i) => i % 2 === 1);
    return [
      { say: `Neighbouring terms follow no single rule, so split them: positions 1, 3, 5, … give ${list(A)}; positions 2, 4, 6, … give ${list(B)}.`, why: 'Two sequences written alternately make neighbours unrelated but every-second term regular.' },
      { say: `The first strand ${describe(strands[0])} (${strandCheck(A, strands[0])}); the second ${describe(strands[1])} (${strandCheck(B, strands[1])}).`, why: 'Each strand is solved on its own, as an ordinary sequence.' },
    ];
  },
  compute: ({ strands }, all, k) => `Term ${k + 1} sits at an ${k % 2 === 0 ? 'odd' : 'even'} position, so it continues the ${k % 2 === 0 ? 'first' : 'second'} strand: ${L(all[k])}.`,
  rivals: ({ strands }, { shown, after }) => {
    const n = shown.length, a = shown[n - 1];
    const other = strands[(n + 1) % 2], j = Math.floor((n + 1) / 2);
    const out = [{ value: strandTerm(other, j), misconception: 'Continued the wrong strand: the next position belongs to the other interleaved sequence.' }];
    const same = strands[n % 2], prev = strandTerm(same, Math.floor(n / 2) - 1);
    const alt = same.k === 'geo' ? prev.add(q(same.r)) : same.k === 'arith' ? prev.mul(q(Math.abs(same.d))) : null;
    if (alt) out.push({ value: alt, misconception: `Right strand, wrong operation: that strand ${describe(same)}.` });
    out.push({ value: a.add(a.sub(shown[n - 2])), misconception: 'Treated the whole list as one sequence and repeated the last gap; neighbours belong to different strands.' });
    return out;
  },
  hints: () => ['Neighbouring terms look unrelated. Look at every second term.', 'Solve positions 1, 3, 5, … and 2, 4, 6, … separately. Which strand does the next position belong to?'],
  anchor: 'Each strand is an ordinary sequence you already know; the only change is that two of them are written alternately.',
  srule: 'Zigzag or unrelated neighbours → split odd and even positions, solve each, continue the right one.',
  lesson: {
    purpose: 'Interleaving is how test writers make easy rules look hard. It is also the most common reason a clean-looking rule "almost" fits.',
    anchor: 'You already solve single sequences. Interleaving = two known sequences + one change: they take turns.',
    steps: [
      { say: 'If gaps zigzag or neighbours look unrelated, write positions 1, 3, 5, … and 2, 4, 6, … as separate lists.', why: 'Alternating rules only become regular when each strand is read alone.' },
      { say: 'Solve each strand; the next term continues the strand whose turn it is.', why: 'Position parity decides which strand; the most common slip is extending the wrong one.' },
    ],
    predict: { question: '2, 10, 4, 20, 6, 40, ? Which strand is next, and what is it?', answer: 'Position 7 is odd: strand 2, 4, 6 → 8.' },
    rule: 'Zigzag or unrelated neighbours → split odd and even positions, solve each, continue the right one.',
    contrast: 'Alternating operations (+3, ×2, +3, ×2) also zigzag, but there each term depends on the one before it; in interleaving the strands never touch.',
    edge: 'With 6 shown terms each strand has only 3 terms: enough for a constant gap or ratio, not for anything subtler.',
  },
});
