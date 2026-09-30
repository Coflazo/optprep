import { nCr, factorial } from '../../../core/combinatorics.js';
import { ivItem } from '../lib.js';

const WORDS = ['BANANA', 'LETTER', 'MISSISSIPPI', 'STATISTICS', 'OPTIONS', 'TRADING', 'ARBITRAGE', 'MARKET', 'VOLATILITY', 'COMMITTEE', 'PEPPER', 'BOOKKEEPER'];
const multiset = (w) => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return Object.values(c); };
const arrangements = (w) => multiset(w).reduce((q, k) => q / factorial(k), factorial(w.length));

const S = {
  choose: { levels: [2, 3, 4], make: (rng, d) => { const n = d === 2 ? rng.int(6, 12) : d === 3 ? rng.int(14, 25) : rng.int(30, 60); return { n, k: rng.int(2, d === 4 ? 8 : Math.min(6, n - 2)) }; },
    text: ({ n, k }) => `In how many ways can a committee of ${k} be chosen from ${n} people?`, f: ({ n, k }) => nCr(n, k),
    how: ({ n, k }) => `C(${n}, ${k}) = ${n}·${n - 1}·…·${n - k + 1} / ${k}!.` },
  word: { levels: [2, 3, 4], make: (rng, d) => ({ w: rng.pick(WORDS.filter((x) => (d === 2 ? x.length <= 6 : d === 3 ? x.length <= 8 : x.length >= 8))) }),
    text: ({ w }) => `How many distinct arrangements are there of the letters of ${w}?`, f: ({ w }) => arrangements(w),
    how: ({ w }) => `${w.length}! divided by the factorials of the repeat counts (${multiset(w).filter((k) => k > 1).map((k) => `${k}!`).join(', ') || 'none'}).` },
  grid: { levels: [2, 3], make: (rng, d) => ({ a: rng.int(2, d === 2 ? 5 : 9), b: rng.int(2, d === 2 ? 5 : 9) }),
    text: ({ a, b }) => `On a grid, how many shortest paths go from the corner (0, 0) to (${a}, ${b}) moving only right or up?`, f: ({ a, b }) => nCr(a + b, a),
    how: ({ a, b }) => `Each path is ${a + b} moves, of which ${a} are "right": C(${a + b}, ${a}).` },
  hearts: { levels: [3, 4], make: (rng) => ({ k: rng.int(0, 4) }),
    text: ({ k }) => `How many 5-card hands from a standard deck contain exactly ${k} heart${k === 1 ? '' : 's'}?`, f: ({ k }) => nCr(13, k) * nCr(39, 5 - k),
    how: ({ k }) => `Choose the hearts and the non-hearts separately: C(13, ${k}) × C(39, ${5 - k}).` },
};

const fam = {
  id: 'combinatorics',
  section: 'iv',
  title: 'Counting: combinations and arrangements',
  skill: 'Small counts are exact; large ones are estimated through logs or known factorials',
  levels: [2, 3, 4],
  generate(rng, { difficulty = 2 } = {}) {
    const key = rng.pick(Object.keys(S).filter((k) => S[k].levels.includes(difficulty))), sc = S[key], params = sc.make(rng, difficulty);
    const big = sc.f(params), truth = Number(big);
    const exact = truth <= 5000 || difficulty === 2;
    const coach = exact ? { exact: true, belief: { kind: 'point' }, note: 'Small enough to compute exactly: zero width.' } : { exact: false, belief: { kind: 'lognormal', sd: difficulty === 3 ? 0.03 : 0.06 }, note: 'Exact in principle, but the arithmetic is long; a careful estimate is good to a few percent.' };
    return ivItem(fam, rng, difficulty, {
      text: sc.text(params), truth, unit: 'ways', coach, exact: big.toString(),
      steps: [
        { say: sc.how(params), why: 'Count ordered choices, then divide out the orderings that do not matter.' },
        { say: `Exact count: ${big.toLocaleString('en-US')}.`, why: 'Computed with exact integers.' },
      ],
      hints: ['Does order matter? If not, divide by the orderings.', 'For big counts, multiply rounded factors and keep track of the rounding.'],
      params: { scenario: key, ...params },
    });
  },
  // Independent check: Pascal's triangle / explicit products in floating point.
  verify(item) {
    const P = item.params;
    const C = (n, k) => { let row = [1]; for (let i = 0; i < n; i++) row = [1, ...row.slice(1).map((v, j) => v + row[j]), 1]; return row[k]; };
    let v;
    if (P.scenario === 'choose') v = C(P.n, P.k);
    else if (P.scenario === 'grid') v = C(P.a + P.b, P.a);
    else if (P.scenario === 'hearts') v = C(13, P.k) * C(39, 5 - P.k);
    else { let f = 1; for (let i = 2; i <= P.w.length; i++) f *= i; for (const c of multiset(P.w)) for (let i = 2; i <= c; i++) f /= i; v = f; }
    return { ok: Math.abs(v / item.truth - 1) < 1e-12, detail: `alternative ${v}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Counting questions test whether you can set up the count; the interval tests whether you know when to stop computing.',
    anchor: 'Counting ordered choices (n × (n − 1) × …), with one change: divide by the orderings that are the same selection.',
    steps: [
      { say: 'Ordered first: n × (n − 1) × … for k picks.', why: 'Every ordered sequence is a distinct outcome.' },
      { say: 'Divide by k! for unordered selections, or by the repeat factorials for words with repeated letters.', why: 'Each unordered outcome was counted once per internal ordering.' },
      { say: 'Small results: exact, zero width. Large: estimate via rounded factors, interval ±3 to 6%.', why: 'Time spent on the last digit is time not spent on the next question.' },
    ],
    predict: { question: 'Arrangements of BANANA?', answer: '6!/(3!·2!) = 60.' },
    rule: 'Ordered count ÷ internal orderings; exact if small, estimated with a proportional interval if large.',
    contrast: 'Permutations (order matters) versus combinations (order does not): a factor of k!.',
    edge: 'C(n, k) = C(n, n − k): choose the smaller side to compute.',
  },
};
export default fam;
