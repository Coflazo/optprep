import { Q, sumQ, ONE, ZERO } from '../../../core/rational.js';
import { hittingTimes } from '../../../core/markov.js';
import { ivItem, range } from '../lib.js';

// Coupon collector, uniform and weighted. Exact by inclusion-exclusion over subsets.
function expectedAll(ps) {
  const k = ps.length;
  let e = ZERO;
  for (let mask = 1; mask < 1 << k; mask++) {
    let p = ZERO, bits = 0;
    for (let i = 0; i < k; i++) if (mask & (1 << i)) { p = p.add(ps[i]); bits++; }
    e = bits % 2 ? e.add(ONE.div(p)) : e.sub(ONE.div(p));
  }
  return e;
}

const TOYS = ['red', 'blue', 'green', 'yellow', 'purple'];

const fam = {
  id: 'coupon',
  section: 'iv',
  title: 'Coupon collector, plain and weighted',
  skill: 'Split the wait into stages (uniform) or use inclusion-exclusion over the missing set (weighted)',
  levels: [3, 4, 5],
  generate(rng, { difficulty = 3 } = {}) {
    let text, ps, steps, coach;
    if (difficulty === 3) {
      const n = rng.int(3, 12);
      ps = range(1, n).map(() => Q.of(1, n));
      text = `A fair ${n}-sided die is rolled until every face has appeared at least once. What is the expected number of rolls?`;
      const Hn = sumQ(range(1, n).map((i) => Q.of(1, i)));
      steps = [
        { say: `Stage i (having seen i − 1 faces) waits a geometric time with success chance (${n} − i + 1)/${n}, mean ${n}/(${n} − i + 1).`, why: 'Each new face is a fresh wait; stages are independent.' },
        { say: `Sum: ${n} × (1 + 1/2 + … + 1/${n}) = ${n} × ${Hn.toNumber().toFixed(4)}.`, why: 'Linearity over stages gives n·H(n).' },
      ];
      coach = { exact: true, belief: { kind: 'point' }, note: 'Exact: n·H(n). Compute the harmonic sum carefully and give a tight bracket.' };
    } else {
      let w;
      do w = Array.from({ length: difficulty === 4 ? 3 : rng.int(3, 4) }, () => rng.int(1, 6)); while (new Set(w).size === 1);
      const tot = w.reduce((a, b) => a + b, 0);
      ps = w.map((x) => Q.of(x, tot));
      const names = TOYS.slice(0, w.length);
      text = `A cereal box contains one of ${w.length} toys: ${names.map((c, i) => `${c} with probability ${ps[i].toString()}`).join(', ')}. What is the expected number of boxes needed to collect all ${w.length}?`;
      steps = [
        { say: 'E[T] = Σ over non-empty sets S of toys of (−1)^(|S|+1) / P(S), where P(S) is the chance a box holds a toy from S.', why: 'T is the maximum of the first-arrival times; inclusion-exclusion turns E[max] into a signed sum of E[min] = 1/P(S).' },
        { say: `Singletons: ${ps.map((p) => `1/(${p.toString()})`).join(' + ')}; subtract pairs, add triples${w.length > 3 ? ', subtract the quadruple' : ''}.`, why: 'Each set S contributes the expected wait until the first toy from S.' },
      ];
      coach = { exact: true, belief: { kind: 'lognormal', sd: difficulty === 4 ? 0.02 : 0.04 }, note: 'Exact by inclusion-exclusion, but with 7 to 15 terms under time pressure, allow a few percent for arithmetic.' };
    }
    const e = expectedAll(ps), truth = e.toNumber();
    steps.push({ say: `E = ${e.toString()} ≈ ${truth.toFixed(4)}.`, why: 'Exact rational, rounded only for display.' });
    return ivItem(fam, rng, difficulty, {
      text, truth, unit: difficulty === 3 ? 'rolls' : 'boxes', coach, exact: e.toString(), steps,
      hints: ['Where is most of the waiting? At the end, when only the rarest item is missing.', difficulty === 3 ? 'Add the stage waits n/n + n/(n−1) + … + n/1.' : 'Inclusion-exclusion: add 1/p for singles, subtract 1/(p+q) for pairs, add back triples.'],
      params: { scenario: difficulty === 3 ? 'uniform' : 'weighted', probs: ps.map((p) => [Number(p.n), Number(p.d)]) },
    });
  },
  // Independent check: Markov chain solved by elimination, over the collected set (weighted)
  // or the number collected (uniform, where only the count matters).
  verify(item) {
    const ps = item.params.probs.map(([n, d]) => Q.of(n, d));
    const k = ps.length;
    let P, target;
    if (item.params.scenario === 'uniform') {
      P = Array.from({ length: k + 1 }, (_, c) => { const row = Array(k + 1).fill(ZERO); if (c === k) row[k] = ONE; else { row[c] = Q.of(c, k); row[c + 1] = Q.of(k - c, k); } return row; });
      target = k;
    } else {
      const N = 1 << k;
      P = Array.from({ length: N }, (_, m) => { const row = Array(N).fill(ZERO); for (let i = 0; i < k; i++) { const t = m | (1 << i); row[t] = row[t].add(ps[i]); } return row; });
      target = N - 1;
    }
    const h = hittingTimes(P, [target])[0].toNumber();
    return { ok: Math.abs(h - item.truth) < 1e-9, detail: `Markov chain ${h}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'The coupon collector is a reported Intervals item, including a weighted version. It is exact, but the weighted one is long enough that a small arithmetic allowance is wise.',
    anchor: 'Waiting for one event with chance p takes 1/p tries (geometric). Collecting all items chains several such waits, and the chance of a new item shrinks as you go.',
    steps: [
      { say: 'Uniform n items: stage waits n/n, n/(n − 1), …, n/1; total n·H(n).', why: 'After i items, a new one arrives with chance (n − i)/n.' },
      { say: 'Weighted: E[T] = Σ_S (−1)^(|S|+1) / P(S).', why: 'The time to finish is the latest of the first-arrival times; inclusion-exclusion expresses a maximum through minima, and the minimum over S waits 1/P(S).' },
    ],
    predict: { question: 'Six-sided die, all faces: expected rolls?', answer: '6 × 2.45 = 14.7.' },
    rule: 'Uniform: n·H(n). Weighted: Σ_S (−1)^(|S|+1)/P(S). The rarest item dominates.',
    contrast: 'Waiting for one specific item takes 1/p; waiting for all takes far longer, and with unequal weights the rare item alone contributes 1/p_min.',
    edge: 'With weights 1/2, 1/3, 1/6 the answer is 7.3: the 1/6 toy alone would take 6 boxes on average.',
  },
};
export default fam;
