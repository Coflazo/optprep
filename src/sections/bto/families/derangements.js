// Random permutations: nobody gets their own item, exactly k fixed points, the impossible n−1 case.
import { derangements, factorial, nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, qpow, permutations } from '../lib.js';

const ID = 'derangements';
const CTX = [
  { setup: (n) => `${n} letters are put at random into ${n} addressed envelopes, one per envelope.`, item: 'letter', ok: 'is in its own envelope', noneOk: 'no letter is in its own envelope' },
  { setup: (n) => `${n} traders put their name in a hat and each draws one name at random (Secret Santa).`, item: 'trader', ok: 'draws their own name', noneOk: 'nobody draws their own name' },
  { setup: (n) => `${n} people leave their coats at a cloakroom; the coats are handed back in a random order.`, item: 'person', ok: 'gets their own coat', noneOk: 'nobody gets their own coat' },
];

export default {
  id: ID,
  section: 'bto',
  title: 'Derangements: nobody gets their own',
  skill: 'D(n)/n! ≈ 1/e; exactly k fixed: C(n,k)D(n−k)/n!; exactly n−1 fixed is impossible',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const c = rng.pick(CTX);
    const n = difficulty === 2 ? rng.int(3, 5) : rng.int(4, 7);
    const nf = factorial(n);
    const kind = difficulty === 2 ? rng.pick(['none', 'atLeastOne']) : rng.pick(['exactlyK', 'exactlyK', 'nMinusOne', 'none']);
    const Dn = derangements(n);
    const none = new Q(Dn, nf);
    const indep = qpow(q(n - 1, n), n);
    if (kind === 'none' || kind === 'atLeastOne') {
      const atLeast = kind === 'atLeastOne';
      const v = atLeast ? q(1).sub(none) : none;
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `${c.setup(n)} What is the probability that ${atLeast ? `at least one ${c.item} ${c.ok}` : c.noneOk}?`,
        distractors: [
          { value: atLeast ? q(1).sub(indep) : indep, misconception: `Treated each ${c.item}'s outcome as independent with chance ${n - 1}/${n}. The assignments are linked: if one ${c.item} takes another's, that changes what is left.` },
          { value: atLeast ? none : q(1).sub(none), misconception: 'Answered the complement.' },
          { value: atLeast ? q(1, n) : q(n - 1, n), misconception: `Only looked at one ${c.item}.` },
          { value: atLeast ? q(1) : q(0), misconception: atLeast ? `Added 1/${n} for each of the ${n} ${c.item}s and got 1. The events overlap, so the sum overcounts.` : `Added 1/${n} per ${c.item} for "someone matches", got 1, and concluded that "no match" is impossible.` },
          { value: atLeast ? q(1).sub(q(1, nf)) : q(1, nf), misconception: 'Treated a single arrangement as the only favourable (or unfavourable) one.' },
          { value: atLeast ? 1 - Math.exp(-1) : Math.exp(-1), misconception: `Used the large-n limit ${atLeast ? '1 − 1/e' : '1/e'} for a small group; for n = ${n} the exact value differs.` },
        ],
        steps: [
          { say: `Count arrangements where ${c.noneOk} (derangements): D(n) = (n − 1)(D(n−1) + D(n−2)), D(1) = 0, D(2) = 1, so D(${n}) = ${Dn}.`, why: `Item 1 goes to some slot j (n − 1 choices); then either j's item takes slot 1 (leaving D(n−2)) or it does not (D(n−1)).` },
          { say: `P(no match) = ${Dn}/${n}! = ${none} ≈ ${none.toNumber().toFixed(4)}.`, why: 'All n! arrangements are equally likely.' },
          ...(atLeast ? [{ say: `P(at least one) = 1 − ${none} = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Complement.' }] : []),
        ],
        rule: 'D(n)/n! = Σ (−1)^k/k! → 1/e ≈ 0.368 fast (n = 4: 0.375, n = 5: 0.367).',
        anchor: 'The complement rule for "at least one match", with one change: the "match" events are dependent, so inclusion-exclusion replaces the product.',
        hints: ['Is each person\'s chance of a match independent of the others?', `Count derangements: D(${n}) = ${Dn}.`, `${Dn}/${n}!.`],
        data: { kind, n },
      });
    }
    if (kind === 'nMinusOne') {
      return mcqItem(ID, rng, difficulty, {
        value: q(0),
        text: `${c.setup(n)} What is the probability that exactly ${n - 1} ${c.item}s ${c.ok.replace('is in its', 'are in their').replace('draws their', 'draw their').replace('gets their', 'get their')}?`,
        distractors: [
          { value: q(n, nf), misconception: `Chose which ${c.item} is wrong (${n} ways) and counted each as one arrangement. But if ${n - 1} are right, the last one's only remaining slot is its own.` },
          { value: q(1, nf), misconception: 'Counted one arrangement as favourable.' },
          { value: new Q(nCr(n, n - 1), 1n).mul(qpow(q(1, n), n - 1)).mul(q(n - 1, n)), misconception: 'Used a binomial model with independent 1/n matches; matches are dependent.' },
          { value: q(1, n), misconception: 'Used the chance that one particular item is placed correctly.' },
          { value: Math.exp(-1), misconception: 'Answered the "nobody matches" probability, about 1/e.' },
          { value: q(n - 1, n), misconception: `Used the chance that one particular ${c.item} misses, as if only that one had to be wrong.` },
          { value: 0.5, misconception: 'Treated the event as a coin flip.' },
        ],
        steps: [
          { say: `Suppose ${n - 1} are correct. Only one slot is left, and it is the last ${c.item}'s own.`, why: 'Every other slot is taken by its owner.' },
          { say: 'So the last one is correct too: exactly n − 1 matches is impossible. P = 0.', why: 'The event contains no arrangement.' },
        ],
        rule: 'Exactly n − 1 fixed points never happens; exactly k fixed points has C(n,k)D(n−k) arrangements.',
        anchor: 'The derangement count with one change: fix k items first, derange the rest. For k = n − 1 the rest is a single item, and D(1) = 0.',
        hints: [`If ${n - 1} are correct, where can the last one go?`, 'Only one slot remains.', 'Impossible.'],
        data: { kind, n },
      });
    }
    const k = rng.int(1, n - 2);
    const ways = nCr(n, k) * derangements(n - k);
    const v = new Q(ways, nf);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `${c.setup(n)} What is the probability that exactly ${k} ${k === 1 ? c.item : `${c.item}s`} ${k === 1 ? c.ok : c.ok.replace('is in its', 'are in their').replace('draws their', 'draw their').replace('gets their', 'get their')}?`,
      distractors: [
        { value: new Q(nCr(n, k), 1n).mul(qpow(q(1, n), k)).mul(qpow(q(n - 1, n), n - k)), misconception: `Used a binomial model: each ${c.item} matches independently with chance 1/${n}. Matches are dependent.` },
        { value: new Q(nCr(n, k) * factorial(n - k), nf), misconception: `Fixed ${k} matches and let the rest be anything, which allows extra matches: that counts "at least these ${k}" not "exactly ${k}".` },
        { value: new Q(derangements(n - k), nf), misconception: `Forgot to choose which ${k} match: multiply by C(${n},${k}).` },
        { value: q(1, n), misconception: 'Used the chance that one particular item matches.' },
        { value: q(1).sub(v), misconception: 'Answered the complement.' },
      ],
      steps: [
        { say: `Choose the ${k} that match: C(${n},${k}) = ${nCr(n, k)}.`, why: 'Any set of k can be the matched ones.' },
        { say: `The other ${n - k} must all miss: D(${n - k}) = ${derangements(n - k)} ways.`, why: '"Exactly k" forbids further matches, so the rest form a derangement.' },
        { say: `P = ${nCr(n, k)} × ${derangements(n - k)} / ${n}! = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Favourable over n! arrangements.' },
      ],
      rule: 'P(exactly k fixed) = C(n,k)·D(n−k)/n! ≈ e^(−1)/k! for large n.',
      anchor: 'The derangement count with one change: first choose which k are correct, then derange the rest.',
      hints: [`Choose which ${k} match.`, 'The rest must all miss: a derangement.', `C(${n},${k})·D(${n - k})/${n}!.`],
      data: { kind, n, k },
    });
  },

  // Independent check: enumerate all n! permutations and count fixed points.
  verify(item) {
    const { kind, n, k } = item.params;
    let hits = 0, tot = 0;
    for (const p of permutations(n)) {
      tot++;
      const fixed = p.reduce((s, x, i) => s + (x === i ? 1 : 0), 0);
      if ((kind === 'none' && fixed === 0) || (kind === 'atLeastOne' && fixed > 0) ||
        (kind === 'nMinusOne' && fixed === n - 1) || (kind === 'exactlyK' && fixed === k)) hits++;
    }
    return agree(item, hits / tot);
  },

  lesson: {
    purpose: 'Secret Santa, hat-check and envelope questions ask for "nobody gets their own". The answer is almost exactly 1/e for any group size above 4, which makes them fast if you know why.',
    anchor: 'At-least-one via the complement, with one change: the individual "match" events are dependent, so you cannot multiply (n−1)/n n times.',
    steps: [
      { say: 'Name the object: a random permutation; a "match" is a fixed point.', why: 'Every one of the n! arrangements is equally likely.' },
      { say: 'D(n) = (n − 1)(D(n−1) + D(n−2)), with D(1) = 0, D(2) = 1: 0, 1, 2, 9, 44, 265, 1854.', why: 'Follow item 1 to slot j, then split on whether item j swaps back into slot 1.' },
      { say: 'D(n)/n! = 1 − 1 + 1/2! − 1/3! + … → 1/e.', why: 'Inclusion-exclusion over the sets of forced matches.' },
      { say: 'Exactly k matches: C(n,k)·D(n−k)/n!.', why: 'Pick the matched ones, derange the rest.' },
    ],
    predict: { question: 'For 4 people, is P(nobody gets their own) closer to 0.375 or to (3/4)^4 ≈ 0.316?', answer: '0.375 = 9/24. The independence guess is noticeably off for small groups.' },
    edge: 'Exactly n − 1 matches is impossible: the last item has only its own slot left.',
    rule: 'P(no match) = D(n)/n! ≈ 1/e ≈ 0.368. Expected number of matches is 1 for every n.',
    contrast: 'Independent trials (binomial, (1 − 1/n)^n) against a permutation (dependent matches, D(n)/n!). Both tend to 1/e, but differ for small n.',
  },
};
