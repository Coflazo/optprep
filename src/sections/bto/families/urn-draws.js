// Hypergeometric draws from an urn: exactly j red, at least j red, first blue on draw m.
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, qpow } from '../lib.js';

const ID = 'urn-draws';
const words = ['no', 'one', 'two', 'three', 'four', 'five'];
const hyper = (r, b, k, j) => new Q(nCr(r, j) * nCr(b, k - j), nCr(r + b, k));
const binom = (p, k, j) => new Q(nCr(k, j), 1n).mul(qpow(p, j)).mul(qpow(q(1).sub(p), k - j));

export default {
  id: ID,
  section: 'bto',
  title: 'Urns: drawing without replacement',
  skill: 'Hypergeometric counting C(r,j)C(b,k−j)/C(n,k); do not forget the C(k,j) orders in a sequential product',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const r = rng.int(3, 8), b = rng.int(3, 8), n = r + b;
    const k = difficulty === 2 ? rng.int(2, 3) : rng.int(3, 4);
    const atLeast = difficulty === 3 && rng.chance(0.5);
    const j = atLeast ? rng.int(1, k - 1) + (k === 3 ? 1 : 0) : rng.int(1, k - 1);
    const jj = Math.min(j, k);
    const exact = hyper(r, b, k, jj);
    let value = exact;
    if (atLeast) { value = q(0); for (let t = jj; t <= k; t++) value = value.add(hyper(r, b, k, t)); }
    const pr = q(r, n);
    let withRep = binom(pr, k, jj);
    if (atLeast) { withRep = q(0); for (let t = jj; t <= k; t++) withRep = withRep.add(binom(pr, k, t)); }
    // One fixed order (reds first) without the C(k, j) arrangements.
    let oneOrder = q(1);
    for (let i = 0; i < jj; i++) oneOrder = oneOrder.mul(q(r - i, n - i));
    for (let i = 0; i < k - jj; i++) oneOrder = oneOrder.mul(q(b - i, n - jj - i));
    const ev = atLeast ? `at least ${words[jj]} red` : `exactly ${words[jj]} red`;
    const distractors = [
      { value: withRep, misconception: 'Treated the draws as with replacement (binomial). Each red drawn lowers the chance of the next red.' },
      { value: oneOrder, misconception: `Computed one specific order (reds first) and forgot the C(${k},${jj}) = ${nCr(k, jj)} possible orders.` },
      { value: q(1).sub(value), misconception: 'Answered the complement.' },
      atLeast
        ? { value: exact, misconception: `Computed exactly ${words[jj]} red; "at least" also includes more reds.` }
        : { value: (() => { let s = q(0); for (let t = jj; t <= k; t++) s = s.add(hyper(r, b, k, t)); return s; })(), misconception: `Computed at least ${words[jj]} red; the question asks for exactly ${words[jj]}.` },
      { value: q(jj, k), misconception: 'Used the fraction of the draws that are red as a probability.' },
    ];
    const terms = atLeast ? Array.from({ length: k - jj + 1 }, (_, i) => jj + i) : [jj];
    const termText = terms.map((t) => `C(${r},${t})C(${b},${k - t})`).join(' + ');
    return mcqItem(ID, rng, difficulty, {
      value,
      text: `An urn holds ${r} red and ${b} blue balls. You draw ${words[k]} balls without replacement. What is the probability of ${ev}?`,
      distractors,
      steps: [
        { say: `All C(${n},${k}) = ${nCr(n, k)} sets of ${k} balls are equally likely.`, why: 'Drawing without replacement gives a uniformly random subset; order does not matter for the colour count.' },
        { say: `Favourable sets: ${termText} = ${value.mul(new Q(nCr(n, k), 1n))}.`, why: `Choose which reds and which blues are in the hand${atLeast ? ', for each allowed number of reds' : ''}.` },
        { say: `P = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Favourable over total.' },
      ],
      rule: 'P(j red in k draws) = C(r,j)C(b,k−j)/C(r+b,k). A sequential product must be multiplied by C(k,j) orders.',
      anchor: 'The binomial C(k,j)p^j(1−p)^(k−j) you know, with one change: without replacement, the red chance shrinks as reds come out, so count subsets instead.',
      hints: ['Does the order of the drawn balls matter for the colour count?', `Count sets: choose ${jj} of ${r} reds and ${k - jj} of ${b} blues.`, `${termText} over C(${n},${k}).`],
      data: { r, b, k, j: jj, atLeast },
    });
  },

  // Independent check: probability tree, one draw at a time (recursion on remaining balls).
  verify(item) {
    const { r, b, k, j, atLeast } = item.params;
    const f = (R, B, left, need) => {
      if (left === 0) return atLeast ? (need <= 0 ? 1 : 0) : need === 0 ? 1 : 0;
      let p = 0;
      if (R > 0) p += (R / (R + B)) * f(R - 1, B, left - 1, need - 1);
      if (B > 0) p += (B / (R + B)) * f(R, B - 1, left - 1, need);
      return p;
    };
    return agree(item, f(r, b, k, j), 1e-9);
  },

  lesson: {
    purpose: '"Draw k balls from an urn" is the standard model for sampling without replacement: cards, defective items, committee picks. The binomial is the tempting wrong tool.',
    anchor: 'Binomial = k independent draws with the same p. Hypergeometric = the same question with one change: draws do not go back, so p changes, and counting subsets replaces multiplying fixed p.',
    steps: [
      { say: 'Count subsets: C(r + b, k) equally likely hands.', why: 'Without replacement, every k-subset is equally likely.' },
      { say: 'Favourable: C(r, j) ways to pick the reds × C(b, k − j) ways to pick the blues.', why: 'Independent choices inside the hand multiply.' },
      { say: 'If you prefer a sequential product (reds first), multiply by C(k, j) orders.', why: 'Every order of the same colours has the same probability.' },
    ],
    predict: { question: 'Urn with 5 red, 5 blue; draw 2. Is P(one of each) above or below the binomial 1/2?', answer: 'Above: 25/45 = 5/9. Taking a red makes blue more likely next.' },
    edge: 'If k exceeds the number of blues, "no red" is impossible: C(b, k) = 0.',
    rule: 'C(r,j)C(b,k−j)/C(n,k). Sequential product × C(k,j).',
    contrast: 'With replacement (binomial) the draws are independent; without replacement (hypergeometric) they are negatively dependent.',
  },
};
