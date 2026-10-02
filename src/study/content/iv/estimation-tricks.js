// Intervals 2: estimation tricks for fast, honest bounds. Friendly numbers with a rounding
// ledger, powers of ten, bounds from both sides, anchors, and Fermi decomposition.
import { sec, round, dec, sig, pct, num, mc, ivq } from './scoring-and-width.js';

const chg = (from, to) => (to - from) / from; // relative change of rounding `from` to `to`
const signed = (x, dp = 1) => `${x >= 0 ? '+' : '−'}${round(Math.abs(x) * 100, dp)}%`;
// Round to a friendly value: one significant figure, or two when the first digit is 1.
const friendly = (x) => { const k = Math.floor(Math.log10(x)); const lead = x / 10 ** k; const dp = lead < 2 ? 1 : 0; return round(round(lead, dp) * 10 ** k, 6); };

const LED = { xs: [4.8, 61, 2.1] };
LED.fr = LED.xs.map(friendly); LED.ch = LED.xs.map((x, i) => chg(x, LED.fr[i]));
LED.net = LED.ch.reduce((a, b) => a + b, 0); LED.est = LED.fr.reduce((a, b) => a * b, 1);
LED.corr = LED.est / (1 + LED.net); LED.exact = LED.xs.reduce((a, b) => a * b, 1);
const SN = { a: 3600, b: 28000 }; SN.p = SN.a * SN.b;
const QT = { a: 732, b: 0.48, c: 27, d: 6.4 }; QT.exact = (QT.a * QT.b * QT.c) / QT.d;
QT.lo = (700 * 0.4 * 20) / 7; QT.hi = (800 * 0.5 * 30) / 6;
const GR = { r: 0.07, n: 10 }; GR.lin = 1 + GR.n * GR.r; GR.exact = (1 + GR.r) ** GR.n; GR.exp = Math.exp(GR.n * GR.r);
const ns = Array.from({ length: 31 }, (_, i) => i);
const PR = { x: 38, y: 52 }; PR.est = friendly(PR.x) * friendly(PR.y); PR.exact = PR.x * PR.y;
const FM = { rate: 2500, hours: 8 }; FM.per = FM.rate * FM.hours * 3600;
const ANCH = [
  ['2^{10}', num(2 ** 10), `≈ 10^{3}, ${signed(chg(1000, 1024))} over`],
  ['e', dec(Math.E, 4), 'growth and decay'],
  ['√2', dec(Math.SQRT2, 4), 'diagonals, √ of 2 × a square'],
  ['√3', dec(Math.sqrt(3), 4), 'equilateral triangles, √ of 3 × a square'],
  ['ln 2', dec(Math.LN2, 4), 'doubling times (rule of 72)'],
  ['ln 10', dec(Math.LN10, 4), 'converting log10 to ln'],
  ['log10 2', dec(Math.log10(2), 4), 'powers of 2 in powers of ten'],
  ['log10 3', dec(Math.log10(3), 4), 'powers of 3'],
  ['1/e', dec(1 / Math.E, 4), 'derangements, "nobody gets their own"'],
];

const ledgerQ = (rng) => {
  const a = rng.pick([18, 19, 21, 29, 31, 38, 39, 41, 48, 49, 51, 59, 61, 79, 81]), b = rng.pick([1.9, 2.1, 2.9, 3.1, 4.8, 5.2, 7.9, 9.8]);
  const fa = friendly(a), fb = friendly(b), net = chg(a, fa) + chg(b, fb), est = fa * fb, corr = est / (1 + net);
  return { type: 'number', q: `Estimate ${a} × ${b} with friendly numbers, then correct for the net rounding. Your corrected estimate?`, answer: round(a * b, 4), tolerance: round(0.01 * a * b, 4),
    hints: [`Friendly values: ${fa} and ${fb}.`, `Rounding changes: ${signed(chg(a, fa))} and ${signed(chg(b, fb))}, net ${signed(net)}.`, `${est} ÷ (1 ${net >= 0 ? '+' : '−'} ${dec(Math.abs(net), 3)}).`],
    explain: `${fa} × ${fb} = ${round(est, 4)}; net rounding ${signed(net)}, so correct to ${round(est, 4)} ÷ ${dec(1 + net, 3)} ≈ ${dec(corr, 2)}. Exact: ${round(a * b, 4)}. Accepted within 1%.` };
};
const boundQ = (rng) => {
  const [a, b, c] = [rng.int(21, 89), rng.int(21, 89), rng.int(3, 9)];
  return { hinge: true, ...mc({ q: `You want a guaranteed **upper** bound for ${a} × ${b} ÷ ${c}. How should you round?`, right: `${a} and ${b} up, ${c} down`, wrong: [
    [`all three up`, 'rounding the divisor up makes the quotient smaller, so this is not guaranteed to be above'],
    [`${a} and ${b} down, ${c} up`, 'that is the lower bound: everything pushed the other way'],
    [`all three down`, 'rounding the divisor down pushes up, the factors down push down: no guarantee either way'],
    [`to the nearest ten each`, 'nearest rounding goes both ways, so it gives an estimate, not a bound']], explain: 'Factors push the result the same way you round them; a divisor pushes it the opposite way. For an upper bound: factors up, divisor down.' }, rng) };
};
const gmQ = (rng) => {
  const lo = rng.pick([10, 20, 40, 100, 200]), k = rng.pick([4, 9, 16, 25, 100]), hi = lo * k, g = lo * Math.sqrt(k);
  return { hinge: true, ...mc({ q: `An unknown factor is surely between ${num(lo)} and ${num(hi)}, and you have no better idea. Which single value should go into the Fermi chain?`, right: num(g), wrong: [
    [num((lo + hi) / 2), 'the arithmetic mean: on a ratio scale it sits much closer to the top bound'],
    [num(lo), 'the lower bound: biased low by the full ratio'],
    [num(hi), 'the upper bound: biased high by the full ratio'],
    [sig(Math.sqrt(hi), 3), 'took the square root of the top bound alone']], explain: `The geometric mean √(${num(lo)} × ${num(hi)}) = ${num(g)} is the midpoint on a log scale: ${num(lo)} × ${Math.sqrt(k)} = ${num(g)}, and ${num(g)} × ${Math.sqrt(k)} = ${num(hi)}.` }, rng) };
};
const powQ = (rng) => {
  const k = rng.pick([20, 30, 40]), unit = { 20: ['million', 1e6], 30: ['billion', 1e9], 40: ['trillion', 1e12] }[k];
  const v = 2 ** k / unit[1];
  return { type: 'number', q: `Using 2^{10} = 1024, estimate 2^{${k}} in ${unit[0]}s (3 significant figures).`, answer: Number(v.toPrecision(3)), tolerance: 0.006,
    hints: [`2^{${k}} = (2^{10})^{${k / 10}} = 1024^{${k / 10}}.`, `1024^{${k / 10}} = 1.024^{${k / 10}} × 10^{${(3 * k) / 10}}; 1.024^{${k / 10}} ≈ 1 + ${k / 10} × 0.024.`],
    explain: `2^{${k}} = 1.024^{${k / 10}} × 10^{${(3 * k) / 10}} = ${dec(1.024 ** (k / 10), 4)} ${unit[0]}. The 2.4% per factor of 1024 compounds.` };
};
const growthQ = (rng) => {
  const r = rng.pick([3, 4, 6, 8, 9, 12]), n = rng.pick([12, 18, 24, 36]);
  const exact = (1 + r / 100) ** n;
  return ivq(`Money grows ${r}% a year for ${n} years. Using 1 + nx ≤ (1 + x)^{n} ≤ e^{nx}, type an interval that must contain the growth factor.`, exact,
    `Lower 1 + ${n} × ${r / 100} = ${dec(1 + (n * r) / 100, 3)}, upper e^{${round((n * r) / 100, 3)}} = ${dec(Math.exp((n * r) / 100), 3)}. The truth ${dec(exact, 3)} is inside. For a better score, centre on the rule of 72: ${dec(n / (72 / r), 2)} doublings, about ${dec(2 ** (n / (72 / r)), 2)}.`,
    ['Lower bound: simple interest, 1 + n × rate.', 'Upper bound: e to the power n × rate.']);
};

export default {
  id: 'iv/estimation-tricks',
  book: 'iv',
  kind: 'foundation',
  title: 'Estimation tricks for fast bounds',
  summary: 'Round to friendly numbers and track the percent you moved, keep powers of ten apart, bound from both sides, lean on anchors, and break big quantities into chains.',
  prerequisites: ['iv/scoring-and-width'],
  objectives: [
    'Estimate a product to within about 1% with a rounding ledger',
    'Give guaranteed lower and upper bounds for products, quotients and powers',
    'Recall the anchors 2^{10}, e, √2, √3, ln 2, ln 10, log10 2 and use the rule of 72',
    'Break a quantity into a chain of factors and combine a bounded unknown with the geometric mean',
  ],
  blocks: [
    sec('friendly', 'Friendly numbers and the rounding ledger'),
    { type: 'challenge', q: `Before any teaching: estimate ${LED.xs.join(' × ')} in ten seconds, then say whether your estimate is above or below the true value, and by roughly how much. Try two different roundings.`, answer: `${round(LED.exact, 4)} exactly; ${LED.fr.join(' × ')} = ${round(LED.est, 4)} is ${pct(Math.abs(LED.est / LED.exact - 1), 1)} too ${LED.est > LED.exact ? 'high' : 'low'}`,
      explain: `Rounding ${LED.xs[0]} up to ${LED.fr[0]} adds ${signed(LED.ch[0])}, ${LED.xs[1]} down to ${LED.fr[1]} takes ${signed(LED.ch[1])}, ${LED.xs[2]} down to ${LED.fr[2]} takes ${signed(LED.ch[2])}. Those percents add to ${signed(LED.net)}: the lesson turns that into a correction.` },
    { type: 'text', text: 'Round each number to a **friendly** value (one significant figure, two if it starts with 1) so the product is mental. Then write down how far each rounding moved it, as a percent. For a product, the percents **add**: (1 + a)(1 + b) = 1 + a + b + ab, and ab is tiny when a and b are a few percent.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['number', 'friendly', 'change'], rows: [...LED.xs.map((x, i) => [String(x), String(LED.fr[i]), signed(LED.ch[i])]), ['product', String(round(LED.est, 4)), `net ${signed(LED.net)}`]] }, caption: `The rounding ledger for ${LED.xs.join(' × ')}. The friendly product ${round(LED.est, 4)} is about ${pct(Math.abs(LED.net), 1)} ${LED.net < 0 ? 'below' : 'above'} the truth, so the truth is near ${round(LED.est, 4)} ÷ ${dec(1 + LED.net, 3)} ≈ ${dec(LED.corr, 1)} (exact ${round(LED.exact, 4)}).` },
    { type: 'check', scope: 'percent change of one rounding', questions: [
      { make: (rng) => { const [x, y] = rng.pick([[48, 50], [19, 20], [61, 60], [2.9, 3], [7.8, 8], [96, 100], [33, 30]]); return { type: 'number', q: `You round ${x} to ${y}. By what percent did the number change? (a negative number if it went down, 1 decimal place)`, answer: round(chg(x, y) * 100, 1), tolerance: 0.051, hints: ['Change ÷ original, as a percent.', `(${y} − ${x}) ÷ ${x}.`], explain: `(${y} − ${x}) ÷ ${x} = ${signed(chg(x, y))}.` }; } },
    ] },
    { type: 'text', text: 'Now correct: if the friendly product is net +3% too high, divide it by 1.03 (about the same as taking 3% off). The correction is worth more than any width, because it removes a known bias instead of covering it.' },
    { type: 'check', scope: 'the ledger correction', questions: [{ make: ledgerQ }] },

    sec('tens', 'Powers of ten'),
    { type: 'text', text: 'Most slips in estimation are a lost or extra zero. Write each number as a × 10^{k} with a between 1 and 10. Multiply the a parts, add the k parts, and fix the result if the a part reaches 10.' },
    { type: 'formula', text: '(a × 10^{j}) × (b × 10^{k}) = ab × 10^{j+k}        (a × 10^{j}) ÷ (b × 10^{k}) = (a/b) × 10^{j−k}' },
    { type: 'check', scope: 'mantissa and exponent', questions: [
      { make: (rng) => { const a = rng.pick([3, 4, 6, 7, 8]) * 10 ** rng.int(2, 4), b = rng.pick([2, 5, 9, 12, 25]) * 10 ** rng.int(2, 4); const k = Math.floor(Math.log10(a * b) + 1e-9); return { type: 'number', q: `${num(a)} × ${num(b)} = c × 10^{k} with c between 1 and 10. What is k?`, answer: k, hints: ['Write each number as a × 10^{k} first.', 'Add the exponents; bump by one if the leading parts multiply to 10 or more.'], explain: `${num(a)} × ${num(b)} = ${num(a * b)} = ${dec((a * b) / 10 ** k, 3)} × 10^{${k}}.` }; } },
      { make: (rng) => { const a = rng.pick([6, 8, 9]) * 10 ** rng.int(6, 8), b = rng.pick([2, 3, 4]) * 10 ** rng.int(2, 3); const q = a / b, k = Math.floor(Math.log10(q) + 1e-9); return { type: 'number', q: `${num(a)} ÷ ${num(b)} = c × 10^{k}. What is k?`, answer: k, explain: `${num(a)} ÷ ${num(b)} = ${num(q)} = ${dec(q / 10 ** k, 3)} × 10^{${k}}: subtract the exponents.` }; } },
    ] },
    { type: 'text', text: `Example: ${num(SN.a)} × ${num(SN.b)} = 3.6 × 10^{3} × 2.8 × 10^{4} = ${dec(3.6 * 2.8, 2)} × 10^{7} = ${dec((3.6 * 2.8) / 10, 3)} × 10^{8}, which is ${num(SN.p)}.` },
    { type: 'check', scope: 'fixing the a part', questions: [
      { type: 'number', q: '4,500 × 30,000 = c × 10^k with c between 1 and 10. What is c?', answer: 1.35, tolerance: 1e-9, explain: '4.5 × 3 = 13.5 reaches 10, so fix it: 1.35 × 10^8.' },
    ] },

    sec('bounds', 'Bounding from both sides'),
    { type: 'text', text: `For a product of positive numbers, rounding **every** factor down gives a guaranteed lower bound, and every factor up a guaranteed upper bound. A divisor works the other way: rounding it up makes the result smaller. So for ${QT.a} × ${QT.b} × ${QT.c} ÷ ${QT.d}: lower 700 × 0.4 × 20 ÷ 7 = ${dec(QT.lo, 1)}, upper 800 × 0.5 × 30 ÷ 6 = ${dec(QT.hi, 1)}. The truth, ${dec(QT.exact, 2)}, must lie between.` },
    { type: 'check', scope: 'bounds for products and quotients', questions: [{ make: boundQ }] },
    { type: 'text', text: `Bounds this crude are too wide to type (here they score ${dec(QT.lo / QT.hi, 2)}), but they catch slipped zeros and tell you which side of your estimate the truth is on. For growth, (1 + x)^{n} is always between simple interest 1 + nx and e^{nx}: at ${pct(GR.r, 0)} for ${GR.n} years, ${dec(GR.lin, 2)} ≤ ${dec(GR.exact, 3)} ≤ ${dec(GR.exp, 3)}.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 30, label: `years n at ${pct(GR.r, 0)}` }, y: { min: 0, max: 9, label: 'growth factor' }, curves: [{ label: '1 + nx', points: ns.map((n) => [n, 1 + n * GR.r]) }, { label: '(1 + x)^n', points: ns.map((n) => [n, (1 + GR.r) ** n]) }, { label: 'e^(nx)', points: ns.map((n) => [n, Math.exp(n * GR.r)]) }] }, caption: `Compound growth (middle) is squeezed between simple interest (below) and e^{nx} (above). The gap to e^{nx} stays small; the gap to simple interest grows fast: ${pct(GR.r, 0)} for 30 years is ×${dec((1 + GR.r) ** 30, 2)}, not the simple-interest ×${dec(1 + 30 * GR.r, 1)}.` },
    { type: 'check', scope: 'bounds for powers', questions: [{ make: growthQ }] },

    sec('anchors', 'Anchors worth knowing'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['anchor', 'value', 'use'], rows: ANCH }, caption: 'Values worth knowing by heart. Each one turns a slow calculation into a lookup plus a small correction.' },
    { type: 'text', text: `2^{10} = 1024 is 10^{3} × 1.024, ${pct(chg(1000, 1024), 1)} over, so 2^{20} ≈ 10^{6} and 2^{30} ≈ 10^{9}, each a little over, with the 2.4% compounding per factor of 1024. The same fact in logs: 10 × log10 2 = ${dec(10 * Math.log10(2), 3)}, just over 3.` },
    { type: 'check', scope: 'powers of 2 from 2^{10}', questions: [{ make: powQ }] },
    { type: 'text', text: `The **rule of 72** comes from ln 2. Doubling needs (1 + r)^{n} = 2, so n = ln 2 ÷ ln(1 + r) ≈ ${dec(Math.LN2, 3)} ÷ r, or ${dec(Math.LN2 * 100, 1)} ÷ (rate in %). 72 is used instead because ln(1 + r) is a little below r, which lengthens the doubling time, and 72 divides by 2, 3, 4, 6, 8, 9 and 12.` },
    { type: 'check', scope: 'the rule of 72', questions: [
      { make: (rng) => { const r = rng.pick([3, 4, 6, 8, 9, 12]), exact = Math.LN2 / Math.log(1 + r / 100); return { type: 'number', q: `At ${r}% a year, about how many years does money take to double? (rule of 72)`, answer: 72 / r, tolerance: 0.051, explain: `72 ÷ ${r} = ${dec(72 / r, 2)} years. Exact: ln 2 ÷ ln ${1 + r / 100} = ${dec(exact, 2)}.` }; } },
    ] },

    sec('fermi', 'Fermi decomposition'),
    { type: 'text', text: 'A big quantity you cannot see is usually a **chain** of small ones you can: a rate × a time × a conversion. Write the units next to every number; the units that cancel tell you what multiplies and what divides.' },
    { type: 'diagram', diagram: 'flow', spec: { root: 'r', nodes: [
      { id: 'r', text: `${num(FM.rate)} messages per second`, kind: 'q' },
      { id: 'h', text: '× 3,600 seconds per hour', kind: 'q' },
      { id: 'd', text: `× ${FM.hours} hours per day`, kind: 'q' },
      { id: 'a', text: `= ${num(FM.per)} messages per day = ${FM.per / 1e6} million`, kind: 'a' },
    ], edges: [{ from: 'r', to: 'h', label: 'seconds cancel' }, { from: 'h', to: 'd', label: 'hours cancel' }, { from: 'd', to: 'a' }] }, caption: 'A chain of units: each step cancels one unit and introduces the next. The powers of ten are counted once, at the end.' },
    { type: 'check', scope: 'chains of units', questions: [
      { make: (rng) => { const rate = rng.int(3, 40) * 100, hours = rng.pick([6, 8, 9, 24]); const v = (rate * hours * 3600) / 1e6; return { type: 'number', q: `A server handles ${num(rate)} requests per second for ${hours} hours a day. How many million requests per day?`, answer: round(v, 4), tolerance: round(0.02 * v, 4), hints: ['Seconds per hour: 3,600.', `${num(rate)} × 3,600 × ${hours}, then divide by 10^{6}.`], explain: `${num(rate)} × 3,600 × ${hours} = ${num(rate * 3600 * hours)} = ${round(v, 4)} million.` }; } },
    ] },
    { type: 'text', text: 'When one factor is unknown and you can only say "between lo and hi", use the **geometric mean** √(lo × hi), not the average. It is the midpoint on a log scale: equally far, as a ratio, from both ends, which is the scale the score uses.' },
    { type: 'check', scope: 'geometric mean of bounds', questions: [{ make: gmQ }] },

    sec('predict'),
    { type: 'predict', question: `You estimate ${PR.x} × ${PR.y} as ${friendly(PR.x)} × ${friendly(PR.y)} = ${PR.est}. Is the truth above or below ${PR.est}, and by roughly what percent?`, answer: `Below: the ledger says ${signed(chg(PR.x, friendly(PR.x)))} and ${signed(chg(PR.y, friendly(PR.y)))}, net ${signed(chg(PR.x, friendly(PR.x)) + chg(PR.y, friendly(PR.y)))}, so the truth is about that much under. Exact: ${PR.exact}.`, explain: `${PR.est} ÷ ${dec(1 + chg(PR.x, friendly(PR.x)) + chg(PR.y, friendly(PR.y)), 4)} ≈ ${dec(PR.est / (1 + chg(PR.x, friendly(PR.x)) + chg(PR.y, friendly(PR.y))), 1)}, within a few units of ${PR.exact}.` },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Round to friendly numbers and log each change in percent; percents add, so divide out the net. Mantissas multiply, exponents add. Bounds: factors and divisors round in opposite directions. Unknown between lo and hi: √(lo × hi).' },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: ledgerQ }, { make: boundQ }, { make: gmQ }] },
  ],
};
