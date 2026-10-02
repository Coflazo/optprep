// Intervals: mental products and quotients. Two-digit products exactly (split, near-square);
// longer ones by friendly rounding, a rounding ledger, pairing the divisor, and a 2 to 3% band.
import { sec, dec, round, sig, mc, ivq, bestLog, eLog } from './scoring-and-width.js';

const chg = (from, to) => (to - from) / from;
const signed = (x, dp = 1) => `${x >= 0 ? '+' : '−'}${round(Math.abs(x) * 100, dp)}%`;
const X = { a: 47, b: 83 }; X.p = X.a * X.b; X.parts = [[40, 80], [40, 3], [7, 80], [7, 3]].map(([r, c]) => r * c);
const LED = { xs: [8.3, 68, 1.6], fr: [8, 70, 1.6] }; LED.ch = LED.xs.map((x, i) => chg(x, LED.fr[i])); LED.net = LED.ch.reduce((a, b) => a + b, 0);
LED.est = LED.fr.reduce((a, b) => a * b, 1); LED.corr = LED.est / (1 + LED.net); LED.exact = LED.xs.reduce((a, b) => a * b, 1);
const QT = { a: 260, b: 0.33, c: 99, d: 14.4 }; QT.exact = (QT.a * QT.b * QT.c) / QT.d;
QT.lo = (250 * 0.3 * 90) / 15; QT.hi = (300 * 0.4 * 100) / 14;
QT.step1 = QT.a / 3; QT.step2 = 100 / QT.d; QT.est = QT.step1 * QT.step2; QT.net = chg(1 / 3, QT.b) + chg(100, QT.c); QT.corr = QT.est * (1 + QT.net);
const TA = { a: 732, b: 0.48, c: 27, d: 6.4 }; TA.exact = (TA.a * TA.b * TA.c) / TA.d; TA.half = TA.a / 2; TA.q = TA.c / TA.d; TA.est = TA.half * TA.q; TA.corr = TA.est * (1 + chg(0.5, TA.b));
TA.band = [TA.corr / bestLog(0.03).f, TA.corr * bestLog(0.03).f];
const B2 = bestLog(0.02), B3 = bestLog(0.03);
const FR = [[0.125, '1/8'], [0.2, '1/5'], [0.25, '1/4'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [0.75, '3/4']];

const splitQ = (rng) => { const a = rng.int(13, 98), b = rng.int(13, 98); const t = Math.floor(b / 10) * 10, u = b % 10; return ivq(`What is ${a} × ${b}? Type your interval.`, a * b, `${a} × ${t} + ${a} × ${u} = ${a * t} + ${a * u} = ${a * b}. Exact: type [${a * b}, ${a * b}].`, [`Split ${b} into ${t} + ${u}.`, `${a} × ${t} = ${a * t}.`]); };
const nearSqQ = (rng) => { const m = rng.pick([30, 40, 50, 60, 70, 80]), d = rng.int(1, 6); return { type: 'number', q: `${m - d} × ${m + d} = ? (Hint: both are ${d} from ${m}.)`, answer: (m - d) * (m + d), hints: ['(m − d)(m + d) = m² − d².'], explain: `${m}² − ${d}² = ${m * m} − ${d * d} = ${(m - d) * (m + d)}.` }; };
const ledgerQ = (rng) => {
  const a = rng.pick([2.1, 3.9, 4.8, 6.2, 7.9, 9.2]), b = rng.pick([19, 31, 48, 52, 69, 81]), c = rng.pick([1.9, 2.1, 2.9, 3.1, 4.9]);
  const fr = [Math.round(a), Math.round(b / 10) * 10, Math.round(c)], net = chg(a, fr[0]) + chg(b, fr[1]) + chg(c, fr[2]), est = fr[0] * fr[1] * fr[2], v = a * b * c;
  return { type: 'number', q: `Estimate ${a} × ${b} × ${c} with friendly numbers and a correction. Your estimate? (within 1% counts)`, answer: round(v, 4), tolerance: round(0.01 * v, 4),
    hints: [`Friendly: ${fr.join(' × ')} = ${est}.`, `Changes ${signed(chg(a, fr[0]))}, ${signed(chg(b, fr[1]))}, ${signed(chg(c, fr[2]))}: net ${signed(net)}.`], explain: `${est} ÷ (1 ${net >= 0 ? '+' : '−'} ${dec(Math.abs(net), 3)}) ≈ ${dec(est / (1 + net), 1)}; exact ${round(v, 4)}.` };
};
const divQ = (rng) => { const a = rng.pick([180, 240, 360, 420, 540]), d = rng.pick([5.9, 6.1, 11.8, 12.2, 3.9]), fd = Math.round(d); const est = a / fd, v = a / d; return { hinge: true, ...mc({ q: `Estimate ${a} ÷ ${d}. You use ${a} ÷ ${fd} = ${dec(est, 2)}. Which way do you correct?`, right: d < fd ? `Up by about ${dec(Math.abs(chg(d, fd)) * 100, 1)}%` : `Down by about ${dec(Math.abs(chg(d, fd)) * 100, 1)}%`, wrong: [
  [d < fd ? `Down by about ${dec(Math.abs(chg(d, fd)) * 100, 1)}%` : `Up by about ${dec(Math.abs(chg(d, fd)) * 100, 1)}%`, 'treated the divisor like a factor: a divisor moves the result the opposite way to its rounding'],
  ['No correction: the change is too small to matter', `${dec(Math.abs(chg(d, fd)) * 100, 1)}% is comparable to the whole band`]], explain: `You divided by ${fd} instead of ${d}: a ${d < fd ? 'bigger' : 'smaller'} divisor, so ${dec(est, 2)} is ${d < fd ? 'too small' : 'too big'}. Exact ${dec(v, 2)}.` }, rng) }; };
const bandQ = (rng) => {
  const lv = rng.pick([2, 3]), s = lv === 2 ? 0.02 : 0.03, b = lv === 2 ? B2 : B3, m = rng.pick([450, 612, 903, 1480, 2250]);
  const E = (l, u) => dec(eLog(s, Math.log(l / m) / s, Math.log(u / m) / s), 2);
  const opt = [sig(m / b.f, 3), sig(m * b.f, 3)], pt = [m, m], wide = [sig(m * 0.8, 3), sig(m * 1.25, 3)], narrow = [sig(m * 0.995, 4), sig(m * 1.005, 4)];
  return { hinge: true, ...mc({ q: `Your corrected estimate of a ${lv === 2 ? 'three-factor product' : 'product with a division'} is ${m}, good to about ${Math.round(s * 100)}%. Which interval is best?`, right: `[${opt.join(', ')}]`, wrong: [
    [`[${pt.join(', ')}]`, 'a point: an estimate is not exact'],
    [`[${narrow.join(', ')}]`, `±0.5% for a ${Math.round(s * 100)}% error (expected ${E(Number(narrow[0]), Number(narrow[1]))})`],
    [`[${wide.join(', ')}]`, `±20% after a careful correction (expected ${E(Number(wide[0]), Number(wide[1]))})`]], explain: `${m} ×/÷ ${dec(b.f, 3)}: expected ${dec(b.e, 2)}.` }, rng) };
};

export default {
  id: 'iv/mental-product',
  book: 'iv',
  kind: 'family',
  family: 'mental-product',
  title: 'Mental products and quotients',
  summary: 'Two-digit products are exact (split one factor, or use m² − d²). Longer products: friendly rounding, a rounding ledger, pair the divisor, then a 2 to 3% band.',
  prerequisites: ['iv/estimation-tricks'],
  objectives: [
    'Multiply two two-digit numbers exactly in under 20 seconds',
    'Estimate a three- or four-number product or quotient to about 1 to 2% with a rounding ledger',
    'Correct in the right direction when a divisor is rounded',
    'Type a point for exact products and a 2 to 3% band for estimates',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'band', label: 'Banded the exact product', approach: `Estimated ${X.a} × ${X.b} as about 3,900 and typed a band.`, breaksAt: 'Two two-digit numbers are exact in seconds: split one factor.' },
      { id: 'nocorrect', label: 'Rounded without correcting', approach: `Took ${LED.fr.join(' × ')} = ${LED.est} as the centre.`, breaksAt: `The roundings moved it ${signed(LED.net)}; divide that out before banding.` },
    ], q: `Before any teaching: (a) What is ${X.a} × ${X.b}? (b) Estimate ${LED.xs.join(' × ')}. Type an interval for each, and try two different ways to get (a).`, answer: `(a) ${X.p} exactly: [${X.p}, ${X.p}]. (b) about ${dec(LED.corr, 0)} (exact ${round(LED.exact, 4)}): a band of about 2% each way.`,
      explain: `(a) is exact in seconds: ${X.a} × 80 + ${X.a} × 3. Any width wastes points. (b) has decimals and three factors: ${LED.fr.join(' × ')} = ${LED.est}, and the rounding moved it ${signed(LED.net)}, so the truth is near ${dec(LED.corr, 0)}.` },
    { type: 'text', text: 'The cue: bare arithmetic. "What is 47 × 83?" (two two-digit numbers, exact) or "Estimate 8.3 × 68 × 1.6" or "Estimate 732 × 0.48 × 27 ÷ 6.4" (decimals, three or four numbers, a division). The word "Estimate" and the decimals tell you an exact answer is not expected. "What is" with two whole two-digit numbers tells you it is.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which of these should get zero width?', right: '58 × 73', wrong: [['5.8 × 73 × 2.2', 'three factors with decimals: estimate with a ledger'], ['580 × 0.73 × 22 ÷ 3.1', 'four numbers and a division: estimate'], ['√5873', 'a root: iv/powers-roots']], explain: 'Two two-digit integers: split one and it is exact in seconds.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Arithmetic items are the easiest points in the section if you know which kind you face: an exact product scores 1, a careful estimate about 0.85 to 0.9. They also train the rounding ledger that every other estimate (Fermi chains, growth, counting) relies on. The two ways to lose points are the same everywhere: a band on an exact answer, and a band around an uncorrected estimate that sits off-centre by the net rounding.' },

    sec('anchor'),
    { type: 'text', text: 'You know the rounding ledger from the estimation-tricks lesson: round to friendly numbers, log each change as a percent, and divide out the net. **One change**: here the ledger is the whole question, including divisions, where a rounding moves the answer the opposite way. Nothing else is new.' },
    { type: 'check', scope: 'the ledger', questions: [{ make: ledgerQ }] },

    sec('picture'),
    { type: 'text', text: `Exact two-digit products: split both numbers into tens and units and add the four partial products. In practice you split only one: ${X.a} × ${X.b} = ${X.a} × 80 + ${X.a} × 3.` },
    { type: 'diagram', diagram: 'grid', spec: { rows: 2, cols: 2, rowLabels: ['40', '7'], colLabels: ['80', '3'], rowTitle: `${X.a} split`, colTitle: `${X.b} split`, cellText: [[X.parts[0], X.parts[1]], [X.parts[2], X.parts[3]]], highlight: [] }, caption: `The area picture of ${X.a} × ${X.b}: four rectangles, ${X.parts.join(' + ')} = ${X.p}. The total area is the product.` },
    { type: 'check', scope: 'splitting a factor', questions: [{ make: splitQ }] },
    { type: 'text', text: 'Three factors with decimals: no split is quick enough, so estimate. Round each to a friendly value, write the change next to it as a percent, and add the percents. The friendly product is off by about that net amount, so divide it out.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['number', 'friendly', 'change'], rows: [...LED.xs.map((x, i) => [String(x), String(LED.fr[i]), signed(LED.ch[i])]), ['product', String(round(LED.est, 4)), `net ${signed(LED.net)}`]] }, caption: `The ledger for ${LED.xs.join(' × ')}: the friendly product ${round(LED.est, 4)} is net ${signed(LED.net)} off, so the truth is near ${round(LED.est, 4)} ÷ ${dec(1 + LED.net, 3)} ≈ ${dec(LED.corr, 1)} (exact ${round(LED.exact, 4)}).` },
    { type: 'check', scope: 'correcting a divisor', questions: [{ make: divQ }] },
    { type: 'text', text: 'Before typing, a ten-second sanity check: round every number in the direction that pushes the result down (factors down, divisors up) for a floor, and the other way for a ceiling. Your estimate must fall between them; if it does not, a zero slipped.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 400, max: 900, step: 50, barriers: [QT.lo, QT.hi], marks: [{ x: QT.exact, label: `truth ${dec(QT.exact, 1)}` }, { x: QT.lo + 40, label: 'all rounded down' }, { x: QT.hi - 40, label: 'all rounded up' }] }, caption: `${QT.a} × ${QT.b} × ${QT.c} ÷ ${QT.d}: rounding every factor down and the divisor up gives ${dec(QT.lo, 1)}; the opposite gives ${dec(QT.hi, 1)}. The truth must lie between. Too wide to type, but a guard against a slipped zero.` },
    { type: 'check', scope: 'guaranteed bounds', questions: [
      mc({ q: `Which pair of roundings bounds ${QT.a} × ${QT.b} × ${QT.c} ÷ ${QT.d} from below?`, right: '250 × 0.3 × 90 ÷ 15', wrong: [['250 × 0.3 × 90 ÷ 14', 'rounding the divisor down pushes the result up: not a lower bound'], ['300 × 0.4 × 100 ÷ 15', 'factors rounded up push the result up'], ['260 × 0.33 × 100 ÷ 14.4', 'rounding 99 up raises the result']], explain: `Factors down, divisor up: ${dec(QT.lo, 1)} ≤ ${dec(QT.exact, 1)}.` }),
    ] },

    sec('derivation'),
    { type: 'text', text: 'Five moves. The first two are exact tricks for two-digit products; the next two are the estimation ledger, including the sign flip for divisors; the last sets the band.' },
    { type: 'steps', steps: [
      { answers: 'band', say: 'Two two-digit numbers: split one into tens and units and add two partial products.', why: 'a × (10t + u) = a × 10t + a × u: two easy multiplications.',
        checks: [{ make: splitQ }] },
      { say: 'If both numbers sit the same distance d either side of a round m, use (m − d)(m + d) = m² − d².', why: 'The cross terms cancel: one square and one tiny square.',
        checks: [{ make: nearSqQ }] },
      { answers: 'nocorrect', say: 'Longer products: round each factor to a friendly value, log the percent change, multiply, and divide by (1 + net change).', why: 'Percent changes add for products, so the net tells you how far the friendly product is off.',
        checks: [{ make: ledgerQ }] },
      { say: 'Divisions: a divisor rounded up makes the result too small, so it enters the ledger with the opposite sign. Better still, pair it with a nearby factor (27 ÷ 6.4 ≈ 4.2) or turn a decimal into a fraction (0.33 ≈ 1/3).', why: 'Pairing removes a big number from the arithmetic, and fractions cancel.',
        checks: [{ make: divQ }] },
      { say: `Type: exact products as a point; corrected estimates as about ×/÷ ${dec(B2.f, 2)} (three factors, 2%) to ×/÷ ${dec(B3.f, 2)} (with a division, 3%).`, why: 'The error after correction is a couple of percent, so the band is a ratio.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why is correcting for the rounding worth more than widening the band?', model: 'Rounding moves the friendly product by a known amount in a known direction: the ledger measures it. Dividing it out removes that bias, so the centre of the band lands near the truth and the band can stay narrow. Widening instead keeps the bias and pays for it with a lower ratio on every question.', points: ['The rounding error is known, not random', 'Correcting removes it; widening only covers it', 'A narrow, well-centred band scores more'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mental-product', section: 'iv', difficulty: 1, seed: 'a', intro: 'Two two-digit numbers. Exact: compute and type a point.' },
    { type: 'worked', family: 'mental-product', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'Four numbers with a division. The method is given; the band is yours.' },
    { type: 'thinkaloud', problem: `Estimate ${TA.a} × ${TA.b} × ${TA.c} ÷ ${TA.d}.`, lines: [
      { t: 0, say: 'I see "Estimate", decimals and a division: ledger and pairing, then a band of about 3%.' },
      { t: 4, say: `${TA.b} is almost a half: ${TA.a} × ½ = ${TA.half}.` },
      { t: 9, say: `Pair ${TA.c} with ${TA.d}: ${TA.c} ÷ ${TA.d} ≈ ${dec(TA.q, 2)}. So ${TA.half} × ${dec(TA.q, 2)} ≈ ${dec(TA.est, 0)}.` },
      { t: 18, say: `I rounded ${TA.b} up to 0.5, so the product is too low: add ${round(chg(TA.b, 0.5) * 100, 1)}%.`, slip: true },
      { t: 22, say: `No: a factor rounded up makes the product too high. Take the ${round(Math.abs(chg(0.5, TA.b)) * 100, 1)}% off: about ${dec(TA.corr, 0)}.` },
      { t: 30, say: `Check: 700 × 0.5 × 4 = ${700 * 0.5 * 4}, the same size. 3% error: [${dec(TA.band[0], 0)}, ${dec(TA.band[1], 0)}]. (Exact ${dec(TA.exact, 1)}.)` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try added 4.2% after rounding 0.48 up to 0.5. What was wrong?', options: ['rounding up makes it too high', 'pairing 27 with 6.4 was wrong', '0.48 is nearer 0.4 than 0.5'], answer: 0, traps: { 1: '27 ÷ 6.4 ≈ 4.22 was right', 2: '0.48 is 4% below 0.5' }, explain: 'A factor rounded up makes the product too high: take the 4% off, about 1482.' },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Estimate 4.8 × 61 × 2.1 and say which side of 600 the truth is on.', answer: `Above: the ledger nets ${signed(chg(4.8, 5) + chg(61, 60) + chg(2.1, 2))}, so the truth is about ${dec(600 / (1 + chg(4.8, 5) + chg(61, 60) + chg(2.1, 2)), 0)} (exact ${round(4.8 * 61 * 2.1, 4)}).`, explain: 'Two roundings went down and only one up, and the downs were bigger.' },

    sec('traps'),
    { type: 'traps', family: 'mental-product', section: 'iv', extra: [
      { belief: 'Round and multiply; the band will cover the rest.', fix: 'The net rounding can be 5% or more: correct it, then band.' },
      { belief: 'A divisor rounded up is corrected like a factor rounded up.', fix: 'Opposite sign: a bigger divisor makes the result smaller.' },
      { belief: 'A two-digit product needs a safety band.', fix: 'It is exact in 15 seconds: type the point.' },
      { belief: 'Dividing by 0.25 makes a number smaller.', fix: 'Dividing by a number below 1 multiplies: ÷ 0.25 is × 4.' },
    ] },
    { type: 'erroneous', problem: `A candidate estimates ${TA.a} × ${TA.b} × ${TA.c} ÷ ${TA.d} with a ledger. One step is wrong.`, steps: [
      `Friendly: 700 × 0.5 × 30 ÷ 6 = ${(700 * 0.5 * 30) / 6}.`,
      `Changes to the factors: ${TA.a} → 700 is ${signed(chg(TA.a, 700))}, ${TA.b} → 0.5 is ${signed(chg(TA.b, 0.5))}, ${TA.c} → 30 is ${signed(chg(TA.c, 30))}.`,
      `The divisor ${TA.d} → 6 is ${signed(chg(TA.d, 6))}, so it adds ${signed(chg(TA.d, 6))} to the net like the others.`,
      `Net ${signed(chg(TA.a, 700) + chg(TA.b, 0.5) + chg(TA.c, 30) + chg(TA.d, 6))}: estimate ${dec(((700 * 0.5 * 30) / 6) / (1 + chg(TA.a, 700) + chg(TA.b, 0.5) + chg(TA.c, 30) + chg(TA.d, 6)), 0)}.`,
    ], errorStep: 2, explain: `Dividing by 6 instead of ${TA.d} makes the result ${signed(TA.d / 6 - 1)} too big, so the divisor enters the ledger with the opposite sign. Net ${signed(chg(TA.a, 700) + chg(TA.b, 0.5) + chg(TA.c, 30) + (TA.d / 6 - 1))}: about ${dec(((700 * 0.5 * 30) / 6) / (1 + chg(TA.a, 700) + chg(TA.b, 0.5) + chg(TA.c, 30) + (TA.d / 6 - 1)), 0)} (exact ${dec(TA.exact, 1)}).` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'Estimate 120 ÷ 0.25.', right: '480', wrong: [['30', 'multiplied by 0.25 instead of dividing'], ['120.25', 'treated ÷ 0.25 as a small change'], ['48', 'slipped a zero']], explain: '÷ 0.25 is × 4: 480.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Decimals as fractions: ${FR.map(([d, f]) => `${round(d, 3)} ≈ ${f}`).join(', ')}. Replace, multiply, and correct by the small difference (0.33 is 1% below 1/3). A fraction often cancels against another number outright, which beats any rounding.` },
    { type: 'check', scope: 'decimals as fractions', questions: [
      { type: 'number', q: 'Estimate 0.25 × 368 by turning the decimal into a fraction.', answer: 92, explain: '0.25 = 1/4, and 368 ÷ 4 = 92.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'Near 100: (100 − a)(100 − b) = 100 × (100 − a − b) + ab, so 97 × 94 = 9100 + 18 = 9118. Squares near 50: 50² = 2500 and each step of d adds 100d + d².' },
    { type: 'check', scope: 'near-square products', questions: [{ make: nearSqQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Two two-digit numbers → split one, exact, point. Longer → friendly numbers + ledger (divisors with the opposite sign) + pair the divisor, correct by the net → band ×/÷ about 1.05 to 1.07.' },

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Method', 'Answer is', 'Type'], rows: [
      ['47 × 83', 'split one factor', 'exact', 'a point'],
      ['8.3 × 68 × 1.6', 'friendly + ledger', 'about 2% off', `×/÷ ${dec(B2.f, 3)}`],
      ['732 × 0.48 × 27 ÷ 6.4', 'pair divisor, fractions, ledger', 'about 3% off', `×/÷ ${dec(B3.f, 3)}`],
      ['√7000 (iv/powers-roots)', 'bracket with squares', 'about 1% off', 'a tighter band'],
    ] },
    { type: 'variation', base: `Base: ${X.a} × ${X.b} = ${X.p}, exact, typed as a point.`, rows: [
      { change: `${X.a} becomes ${X.a / 10}`, effect: `${round(X.p / 10, 2)}: still exact, still a point; only the decimal point moves.` },
      { change: 'A third factor, 2.9, is added', effect: 'Now estimate: 2.9 ≈ 3 (+3.4%), correct, and type a band of about 2%.' },
      { change: `${X.b} becomes 53`, effect: `Both factors are 3 from 50: 50² − 3² = ${47 * 53}, faster than splitting.` },
      { same: true, change: `The order is swapped: ${X.b} × ${X.a}`, effect: `No change: multiplication does not care about order, still ${X.p}.` },
      { fusion: true, change: `${X.a} becomes ${X.a / 10} AND a third factor, 2.9, is added`, effect: `${X.a / 10} × ${X.b} is still exact (${round(X.p / 10, 2)}), but × 2.9 makes it an estimate: ${round(X.p / 10, 2)} × 3 = ${round((X.p / 10) * 3, 2)}, less ${signed(chg(2.9, 3))} for rounding 2.9 up, about ${dec(((X.p / 10) * 3) / (1 + chg(2.9, 3)), 1)}, then a 2% band.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a factor exactly equal to its friendly value (1.6 stays 1.6) adds 0 to the ledger. Dividing by a number below 1 multiplies. If two roundings cancel (one +3%, one −3%), the friendly product is already close.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'Estimate 6.1 × 49 × 2.0 as 6 × 50 × 2 = 600. Which ledger is right?', right: `Net ${signed(chg(6.1, 6) + chg(49, 50))}: truth just below 600`, wrong: [[`Net ${signed(chg(6.1, 6) - chg(49, 50))}: truth well above 600`, 'treated 49 → 50 as a downward rounding: it went up'], ['Net 0: truth exactly 600', 'the two roundings nearly cancel, but not exactly']], explain: `6.1 → 6 is ${signed(chg(6.1, 6))}, 49 → 50 is ${signed(chg(49, 50))}: net ${signed(chg(6.1, 6) + chg(49, 50))}, so the truth (${round(6.1 * 49 * 2, 4)}) is just below 600.` }),
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the ledger finishes every Fermi chain, the growth factor in compound interest, and the scale-bar conversion in path lengths. Exact-or-estimate is the first decision on every Intervals question.' },
    { type: 'transfer',
      near: { make: (rng) => { const a = rng.int(21, 89), b = rng.int(21, 89); return ivq(`A trader buys ${a} lots at €${b} each. Total cost in euros? Type your interval.`, a * b, `${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10} = ${a * b}. Exact: a point.`); } },
      far: { type: 'number', q: 'Outside the assessment: a recipe for 4 people uses 350 g of flour. How many grams for 7 people?', answer: (350 * 7) / 4, explain: `350 × 7/4 = 350 × (1 + 3/4) = 350 + 262.5 = ${(350 * 7) / 4} g: split the awkward factor into easy parts.` },
      principle: mc({ q: 'Which idea carried over from the lot price to the recipe?', right: 'Split a factor into easy parts', wrong: [['Round both and add a band', 'both answers were exact'], ['Correct a divisor like a factor', 'a divisor moves the result the opposite way'], ['Use m² − d² for near squares', 'neither product was symmetric around a round number']], explain: 'In both, one awkward factor was broken into parts (tens and units, or 1 + 3/4) and the partial products added.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mental-product', section: 'iv', count: 3 },
  ],
};
