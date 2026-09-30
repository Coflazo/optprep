import { family, q, L } from '../lib.js';

const rev = (v) => Number(String(v).split('').reverse().join(''));

export default family({
  id: 'reverse-digits',
  title: 'Add the reversal',
  skill: 'When terms roughly double but not exactly, test "add the number written backwards"',
  levels: [4, 5],
  show: 5,
  limit: 1e7,
  params: (rng, d) => { for (;;) { const a = d === 4 ? rng.int(12, 98) : rng.int(102, 989); if (a % 10 && rev(a) !== a) return { a }; } },
  accept: (p, xs) => xs.every((v) => v.toNumber() % 10 !== 0),
  terms: ({ a }, n) => { const out = [a]; while (out.length < n) out.push(out[out.length - 1] + rev(out[out.length - 1])); return out.map((v) => q(v)); },
  rule: () => 'a(n) = a(n−1) + (a(n−1) with its digits reversed)',
  explain: (p, { shown }) => [
    { say: `Ratios are near 2 but wander (${shown.slice(1).map((v, i) => (v.toNumber() / shown[i].toNumber()).toFixed(2)).join(', ')}).`, why: 'Adding a number of the same size as the term roughly doubles it; the reversal is that number.' },
    { say: `Each gap is the previous term reversed: ${L(shown[1])} → ${rev(shown[1].toNumber())}, and ${L(shown[1])} + ${rev(shown[1].toNumber())} = ${L(shown[2])}.`, why: 'Check the reversal on every step.' },
  ],
  compute: (p, all, k) => `${L(all[k - 1])} reversed is ${rev(all[k - 1].toNumber())}; term ${k + 1} = ${L(all[k - 1])} + ${rev(all[k - 1].toNumber())} = ${L(all[k])}.`,
  rivals: (p, { shown }) => {
    const n = shown.length, a = shown[n - 1].toNumber(), b = shown[n - 2].toNumber();
    return [
      { value: q(2 * a), misconception: `Doubled ${a}; the rule adds the reversal ${rev(a)}, which equals ${a} only for palindromes.` },
      { value: q(a + rev(b)), misconception: `Added the reversal of the previous term (${rev(b)}) instead of the last term (${rev(a)}).` },
      { value: q(rev(a) * 2), misconception: 'Doubled the reversal instead of adding it to the original.' },
    ];
  },
  hints: () => ['The terms roughly double, but not exactly. What number of the same size could be added?', 'Write the previous term backwards.'],
  anchor: 'Doubling adds the term to itself; this family changes one thing: it adds the term written backwards.',
  srule: 'Near-doubling that wanders → next = last + reverse(last).',
  lesson: {
    purpose: 'Digit reversal is a late-test favourite because no algebraic tool finds it. Its symptom (ratios near 2 that drift) is easy to learn.',
    anchor: 'Doubling = x + x. Reverse-and-add = x + (x backwards).',
    steps: [
      { say: 'If ratios hover around 2 without settling, compute each gap and compare it with the previous term written backwards.', why: 'x and its reversal have the same number of digits, so the sum is roughly 2x.' },
      { say: 'Next = last + reverse(last).', why: 'Only the last term is used.' },
    ],
    predict: { question: '13, 44, 88, 176, ? Predict (note 44 and 88 are palindromes).', answer: '176 + 671 = 847.' },
    rule: 'Near-doubling that wanders → next = last + reverse(last).',
    contrast: 'For palindromes the reversal equals the number, so the step is an exact doubling; that is why 44 → 88 looks geometric for one step.',
    edge: 'Trailing zeros vanish when reversed (120 → 21), which is why these items avoid numbers ending in 0.',
  },
});
