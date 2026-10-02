import { family, q, L, signed } from '../lib.js';

// a(n) = a(n−1)² + c with small starts; difficulty 5 uses the larger adjustments.
const viable = (a, c) => {
  const t = [a];
  while (t.length < 6) t.push(t[t.length - 1] ** 2 + c);
  if (new Set(t.slice(0, 4)).size < 4 || t.slice(1, 4).some((v) => Math.abs(v) < 2)) return null;
  let show = 5;
  while (show > 4 && Math.abs(t[show]) > 2e8) show--;
  return Math.abs(t[show]) > 2e8 ? null : show;
};
const POOL = { 4: [], 5: [] };
for (let a = -5; a <= 6; a++) for (let c = -9; c <= 6; c++) if (c && viable(a, c)) POOL[Math.abs(c) <= 2 ? 4 : 5].push([a, c]);

export default family({
  id: 'square-minus',
  title: 'Square the previous term, then adjust',
  skill: 'When each term is roughly the square of the one before, the leftover is the constant',
  levels: [4, 5],
  view: 'table',
  show: (d, p) => p.show,
  limit: 2e8,
  params: (rng, d) => { const [a, c] = rng.pick(POOL[d]); return { a, c, show: viable(a, c) }; },
  terms: ({ a, c }, n) => { const out = [q(a)]; while (out.length < n) { const v = out[out.length - 1]; out.push(v.mul(v).add(q(c))); } return out; },
  rule: ({ c }) => `a(n) = a(n−1)² ${c < 0 ? '−' : '+'} ${Math.abs(c)}`,
  explain: ({ c }, { shown }) => [
    { say: `Each term is close to the square of the one before: ${L(shown[2])}² = ${L(shown[2].mul(shown[2]))} against ${L(shown[3])}.`, why: 'Growth where the digit count doubles each step means squaring.' },
    { say: `The leftover is ${signed(c)} every time.`, why: 'Subtract the square from the next term on every step; a constant leftover is the adjustment.' },
  ],
  compute: ({ c }, all, k) => `Term ${k + 1} = ${L(all[k - 1])}² ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(all[k - 1].mul(all[k - 1]))} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${L(all[k])}.`,
  rivals: ({ c }, { shown }) => {
    const n = shown.length, a = shown[n - 1], b = shown[n - 2];
    return [
      { value: a.mul(a), misconception: `Squared the last term but forgot the ${signed(c)}.` },
      { value: a.mul(a).sub(q(c)), misconception: `Squared correctly, then applied the adjustment with the wrong sign (${signed(-c)} instead of ${signed(c)}).` },
      { value: a.mul(b).add(q(c)), misconception: 'Multiplied the last two terms; the rule squares the last term.' },
    ];
  },
  hints: () => ['How many digits does each term have compared with the one before?', 'Square the previous term and compare with the actual term.'],
  anchor: 'The product rule multiplies the last two terms; this one multiplies the last term by itself, then adds a constant.',
  srule: 'Digit count doubles each step → a(n) = a(n−1)² + c; find c from one step, check on another.',
  lesson: {
    purpose: 'Squaring rules produce the largest numbers on the test. The calculator helps, but only after you have the rule.',
    anchor: 'Squares (b²) and the affine rule (k·a + c) combined: square the previous term, then add c.',
    steps: [
      { say: 'Compare each term with the square of its predecessor.', why: 'Squaring doubles the number of digits, which is the visual cue.' },
      { say: 'The difference is the constant; confirm it on a second step.', why: 'One step always gives some constant; the second step is the test.' },
    ],
    predict: { question: '2, 3, 8, 63, ? Predict the constant and the next term.', answer: 'c = −1: 63² − 1 = 3968.' },
    rule: 'Digit count doubles each step → a(n) = a(n−1)² + c; find c from one step, check on another.',
    contrast: 'Geometric growth adds a fixed number of digits per step; squaring doubles the digit count. Product rules (a·b) sit in between.',
    edge: 'Small starts can loop (2² − 2 = 2) or shrink (1² − 1 = 0); a rule is only testable once the terms move.',
  },
});
