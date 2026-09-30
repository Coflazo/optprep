import { Q } from '../../../core/rational.js';
import { ivItem } from '../lib.js';

// Mental arithmetic estimates: products and quotients of given numbers.
const dec = (rng, lo, hi, dp) => +(rng.float(lo, hi)).toFixed(dp);
const toQ = (x) => { const s = String(x); const [a, b = ''] = s.split('.'); return new Q(BigInt(a + b), 10n ** BigInt(b.length)); };
const fmt = (x) => String(x);

const fam = {
  id: 'mental-product',
  section: 'iv',
  title: 'Mental products and quotients',
  skill: 'Round to friendly numbers, track the rounding direction, and give a proportional interval',
  levels: [1, 2, 3],
  generate(rng, { difficulty = 1 } = {}) {
    let mul, div, coach, how;
    if (difficulty === 1) {
      mul = [rng.int(12, 99), rng.int(12, 99)]; div = [];
      coach = { exact: true, belief: { kind: 'point' }, note: 'Two-digit by two-digit is exact in 20 seconds: (a)(b) by splitting one factor.' };
      how = `Split: ${mul[0]} × ${mul[1]} = ${mul[0]} × ${Math.floor(mul[1] / 10) * 10} + ${mul[0]} × ${mul[1] % 10}.`;
    } else if (difficulty === 2) {
      mul = [dec(rng, 1.1, 9.9, 1), rng.int(12, 99), dec(rng, 1.1, 9.9, 1)]; div = [];
      coach = { exact: false, belief: { kind: 'lognormal', sd: 0.02 }, note: 'Three factors with decimals: exact is possible but slow; a rounded estimate is good to about ±2%.' };
      how = `Round each factor to a friendly value, multiply, then correct for the rounding directions (${mul.map(fmt).join(' × ')}).`;
    } else {
      mul = [rng.int(101, 999), dec(rng, 0.11, 0.99, 2), rng.int(11, 99)]; div = [dec(rng, 1.5, 19.5, 1)];
      coach = { exact: false, belief: { kind: 'lognormal', sd: 0.03 }, note: 'Four numbers with a division: a careful estimate is good to about ±3%.' };
      how = 'Pair numbers that simplify (a factor near the divisor, a decimal near a simple fraction), then correct for rounding.';
    }
    let q = Q.of(1);
    for (const m of mul) q = q.mul(toQ(m));
    for (const d of div) q = q.div(toQ(d));
    const truth = q.toNumber();
    const expr = mul.map(fmt).join(' × ') + div.map((d) => ` ÷ ${fmt(d)}`).join('');
    return ivItem(fam, rng, difficulty, {
      text: difficulty === 1 ? `What is ${expr}?` : `Estimate ${expr}.`, truth, unit: '', coach,
      steps: [
        { say: how, why: 'Friendly numbers make the arithmetic fast; remembering which way you rounded tells you which side to widen.' },
        { say: `Exact value: ${expr} = ${truth.toFixed(4).replace(/\.?0+$/, '')}.`, why: 'Computed exactly from the given numbers.' },
      ],
      hints: ['Round each number to one or two significant figures.', 'Did you round up or down overall? Shift the interval the other way.'],
      params: { scenario: difficulty === 1 ? 'product2' : difficulty === 2 ? 'product3' : 'product-quotient', multiply: mul, divide: div },
    });
  },
  // Independent check: sum of logarithms.
  verify(item) {
    const { multiply, divide } = item.params;
    const v = Math.exp(multiply.reduce((s, x) => s + Math.log(x), 0) - divide.reduce((s, x) => s + Math.log(x), 0));
    return { ok: Math.abs(v / item.truth - 1) < 1e-9, detail: `log-sum ${v}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Fast arithmetic estimates appear in Intervals and in every other section. The interval rewards knowing how accurate your rounding is.',
    anchor: 'Rounding to friendly numbers, as in mental maths, with one addition: you keep track of how much the rounding moved the answer, and that is your width.',
    steps: [
      { say: 'Round each factor to one or two significant figures, noting up or down.', why: 'Relative errors of the factors add up (approximately) in the product.' },
      { say: 'Multiply the friendly numbers, then correct: rounded up by 5% overall means the truth is about 5% lower.', why: 'Correcting the bias is worth more than widening.' },
      { say: 'Width: proportional, a couple of percent each side.', why: 'Relative error suits products; an absolute ± does not.' },
    ],
    predict: { question: 'Estimate 4.8 × 61 × 2.1.', answer: '5 × 60 × 2 = 600; corrections −4%, +1.7%, +5% ≈ +2.6%, so about 615 (exact 614.88).' },
    rule: 'Round, multiply, correct for the net rounding, interval ≈ ±2 to 3%.',
    contrast: 'For exact two-digit products, compute and give zero width; estimates need width only when you did not compute exactly.',
    edge: 'Dividing by a number below 1 multiplies: ÷ 0.25 is × 4.',
  },
};
export default fam;
