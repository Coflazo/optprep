import { family, q, L, signed } from '../lib.js';

const SEEDS = [];
for (let a = -3; a <= 4; a++) for (let b = -3; b <= 5; b++) if (a && b && Math.abs(a * b) > 1) SEEDS.push([a, b]);

export default family({
  id: 'product-recurrence',
  title: 'Product of the previous two',
  skill: 'Explosive growth where each term divides the next: test last × previous',
  levels: [3, 4],
  show: (d, p) => p.show,
  limit: 1e8,
  params: (rng, d) => {
    for (;;) {
      const [a, b] = rng.pick(SEEDS), c = d === 3 ? 0 : rng.pick([1, -1, 2]);
      const t = [a, b];
      while (t.length < 8) t.push(t[t.length - 1] * t[t.length - 2] + c);
      if (new Set(t.slice(0, 4)).size < 3 || t.slice(2, 5).some((v) => Math.abs(v) < 2)) continue;
      let show = 6;
      while (show > 5 && Math.abs(t[show]) > 1e8) show--;
      if (Math.abs(t[show]) > 1e8) continue;
      return { a, b, c, show };
    }
  },
  terms: ({ a, b, c }, n) => { const out = [q(a), q(b)]; while (out.length < n) { const m = out.length; out.push(out[m - 1].mul(out[m - 2]).add(q(c))); } return out.slice(0, n); },
  rule: ({ c }) => `a(n) = a(n−1) × a(n−2)${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''}`,
  explain: ({ c }, { shown }) => [
    { say: `Growth is explosive: the digit count roughly adds up (${shown.slice(-3).map(L).join(', ')}).`, why: 'Multiplying two terms adds their lengths; that is faster than any fixed ratio.' },
    { say: `Last × previous${c ? ` ${signed(c)}` : ''} fits: ${L(shown[2])} × ${L(shown[3])}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(shown[4])}.`, why: 'Check the product on every step; with a constant, check that the leftover is the same each time.' },
  ],
  compute: ({ c }, all, k) => `Term ${k + 1} = ${L(all[k - 2])} × ${L(all[k - 1])}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''} = ${L(all[k])}.`,
  rivals: ({ c }, { shown }) => {
    const n = shown.length, a = shown[n - 1], b = shown[n - 2];
    const out = [
      { value: a.add(b).add(q(c)), misconception: 'Added the previous two terms; the growth is multiplicative, so multiply them.' },
      { value: a.mul(a).add(q(c)), misconception: 'Squared the last term; the rule multiplies the last two different terms.' },
    ];
    if (c) out.push({ value: a.mul(b), misconception: `Multiplied correctly but forgot the ${signed(c)} added after every product.` });
    return out;
  },
  hints: () => ['The terms grow faster than any constant ratio.', 'Multiply the two terms before each term.'],
  anchor: 'Fibonacci-like: add the previous two. The one change: multiply them instead.',
  srule: 'Explosive growth, each term divisible by earlier ones → a(n) = a(n−1) × a(n−2) (+ c).',
  lesson: {
    purpose: 'Product rules produce huge numbers fast; recognising them early saves a calculator hunt through ratios.',
    anchor: 'Fibonacci adds the last two terms; the product rule multiplies them.',
    steps: [
      { say: 'Watch the lengths: when digit counts add up, terms are being multiplied together.', why: 'log(a·b) = log a + log b: products add lengths.' },
      { say: 'Check last × previous on two steps; if there is a steady leftover, that is the added constant.', why: 'Two checks separate a real rule from a coincidence.' },
    ],
    predict: { question: '2, 3, 6, 18, 108, ? Predict the size before multiplying.', answer: '1944 = 18 × 108.' },
    rule: 'Explosive growth, each term divisible by earlier ones → a(n) = a(n−1) × a(n−2) (+ c).',
    contrast: 'Geometric: multiply by the same number each time (ratio fixed). Product rule: the multiplier is the previous term, so the ratio itself grows.',
    edge: 'Seeds 1 and 1 stall at 1; a seed of 1 makes the third term equal the second. The rule shows only once both factors exceed 1.',
  },
});
