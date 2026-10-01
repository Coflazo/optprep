// Intervals: powers, roots, logs and growth. Bracket between values you know, refine with one
// Newton step, use log10 anchors for big powers, ln = 2.3026 × log10, and the rule of 72.
import { sec, dec, round, sig, num, mc, ivq, bestLog, eLog } from './scoring-and-width.js';

const L10 = [2, 3, 4, 5, 6, 7, 8, 9].map((d) => [d, Math.log10(d)]);
const SQ = { x: 7000 }; SQ.a = Math.floor(Math.sqrt(SQ.x)); SQ.newton = SQ.a + (SQ.x - SQ.a ** 2) / (2 * SQ.a); SQ.exact = Math.sqrt(SQ.x);
SQ.lin = SQ.a + (SQ.x - SQ.a ** 2) / ((SQ.a + 1) ** 2 - SQ.a ** 2);
const CU = { x: 410711 }; CU.a = Math.floor(Math.cbrt(CU.x)); CU.newton = CU.a + (CU.x - CU.a ** 3) / (3 * CU.a ** 2); CU.exact = Math.cbrt(CU.x);
const TA = { b: 3, k: 20 }; TA.lg = TA.k * Math.log10(TA.b); TA.int = Math.floor(TA.lg); TA.frac = TA.lg - TA.int; TA.mant = 10 ** TA.frac; TA.exact = TA.b ** TA.k;
TA.band = bestLog(0.04);
const G = { r: 7, n: 30, p: 1000 }; G.dbl = 72 / G.r; G.doublings = G.n / G.dbl; G.est = G.p * 2 ** G.doublings; G.exact = G.p * (1 + G.r / 100) ** G.n; G.linear = G.p * (1 + (G.n * G.r) / 100);
const rs = Array.from({ length: 20 }, (_, i) => i + 1);
const LN = { x: 3996 };
const B = { 1: bestLog(0.01), 15: bestLog(0.015), 3: bestLog(0.03), 4: bestLog(0.04) };

const sqrtQ = (rng) => { const x = rng.int(1100, 9800), a = Math.floor(Math.sqrt(x)); const nw = a + (x - a * a) / (2 * a); return ivq(`Estimate √${x}. Type your interval.`, Math.sqrt(x), `${a}² = ${a * a} and ${a + 1}² = ${(a + 1) ** 2}. Newton: ${a} + (${x} − ${a * a}) ÷ ${2 * a} = ${dec(nw, 3)} (exact ${dec(Math.sqrt(x), 4)}). With 1% care: about [${dec(nw / B[1].f, 2)}, ${dec(nw * B[1].f, 2)}].`, ['Find the squares either side.', '√(a² + d) ≈ a + d/(2a).']); };
const newtonQ = (rng) => { const a = rng.int(20, 95), d = rng.int(5, 2 * a - 5), x = a * a + d; return { type: 'number', q: `${a}² = ${a * a}. Use √(a² + d) ≈ a + d/(2a) to estimate √${x}. (3 decimal places)`, answer: round(a + d / (2 * a), 3), tolerance: 0.0015, hints: [`d = ${x} − ${a * a} = ${d}.`, `${d} ÷ ${2 * a}.`], explain: `${a} + ${d}/${2 * a} = ${dec(a + d / (2 * a), 4)} (exact ${dec(Math.sqrt(x), 4)}).` }; };
const cubeQ = (rng) => { const a = rng.int(12, 60), d = rng.int(10, 3 * a * a), x = a ** 3 + d; return { type: 'number', q: `${a}³ = ${num(a ** 3)}. Use ∛(a³ + d) ≈ a + d/(3a²) to estimate ∛${num(x)}. (2 decimal places)`, answer: round(a + d / (3 * a * a), 2), tolerance: 0.006, hints: [`d = ${num(d)}.`, `3a² = ${num(3 * a * a)}.`], explain: `${a} + ${num(d)}/${num(3 * a * a)} = ${dec(a + d / (3 * a * a), 3)} (exact ${dec(Math.cbrt(x), 3)}).` }; };
const logQ = (rng) => { const b = rng.pick([2, 3, 7]), k = rng.int(12, 30), lg = k * Math.log10(b); return { type: 'number', q: `Using log10 ${b} ≈ ${dec(Math.log10(b), 4)}, how many digits does ${b}^{${k}} have?`, answer: Math.floor(lg) + 1, hints: [`${k} × ${dec(Math.log10(b), 4)} = ${dec(lg, 3)}.`, 'A number with log10 between n and n + 1 has n + 1 digits.'], explain: `log10 = ${dec(lg, 3)}, so ${b}^{${k}} = ${dec(10 ** (lg - Math.floor(lg)), 3)} × 10^{${Math.floor(lg)}}: ${Math.floor(lg) + 1} digits.` }; };
const mantQ = (rng) => { const f = rng.pick([0.15, 0.3, 0.45, 0.6, 0.78, 0.9]); return { hinge: true, ...mc({ q: `log10 y = ${5 + f}. Which is closest to y?`, right: `${sig(10 ** f, 2)} × 10^{5}`, wrong: [[`${sig(1 + f, 2)} × 10^{5}`, 'read the fractional part as the mantissa: 10^{0.5} is about 3.16, not 1.5'], [`${sig(10 ** f, 2)} × 10^{6}`, 'counted one power of ten too many'], [`${sig(f * 10, 2)} × 10^{5}`, 'multiplied the fraction by 10 instead of raising 10 to it']], explain: `10^{${f}}: between the anchors in the table, about ${dec(10 ** f, 2)}, so y ≈ ${dec(10 ** f, 2)} × 10^{5}.` }, rng) }; };
const lnQ = (rng) => { const x = rng.pick([50, 200, 800, 3000, 20000, 60000]); return { type: 'number', q: `Estimate ln(${num(x)}) using ln x = 2.3026 × log10 x. (2 decimal places)`, answer: round(Math.log(x), 2), tolerance: 0.021, hints: [`log10 ${num(x)} = ${Math.floor(Math.log10(x))} + log10 of ${dec(x / 10 ** Math.floor(Math.log10(x)), 3)}.`], explain: `log10 ${num(x)} = ${dec(Math.log10(x), 4)}; × 2.3026 = ${dec(Math.log(x), 3)}.` }; };
const dblQ = (rng) => { const r = rng.pick([3, 4, 6, 8, 9, 12]), n = rng.pick([12, 18, 24, 36]), p = rng.pick([100, 1000, 5000]); const v = p * (1 + r / 100) ** n; return ivq(`${num(p)} grows ${r}% a year, compounded yearly, for ${n} years. Type your interval for the final value.`, v, `Rule of 72: doubles every ${dec(72 / r, 1)} years, so ${dec(n / (72 / r), 2)} doublings: ${num(p)} × 2^{${dec(n / (72 / r), 2)}} ≈ ${num(round(p * 2 ** (n / (72 / r)), 0))} (exact ${num(round(v, 2))}). About 3% each way.`, ['Doubling time ≈ 72 ÷ rate.', 'Number of doublings = years ÷ doubling time.']); };

export default {
  id: 'iv/powers-roots',
  book: 'iv',
  kind: 'family',
  family: 'powers-roots',
  title: 'Powers, roots, logs and growth',
  summary: 'Bracket between values you know, refine with one Newton step, use log10 anchors for big powers and logs, the rule of 72 for growth, and a 1 to 4% band.',
  prerequisites: ['iv/estimation-tricks'],
  objectives: [
    'Estimate square and cube roots to about 0.1% with a bracket and one Newton step',
    'Estimate big powers and natural logs through log10 anchors',
    'Estimate compound growth with the rule of 72',
    'Type 2^{k} exactly and every other answer with a 1 to 4% band',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'midpoint', label: 'Put the root halfway', approach: `Called √${SQ.x} ${SQ.a}.5, halfway between ${SQ.a} and ${SQ.a + 1}.`, breaksAt: `${SQ.x} is ${SQ.x - SQ.a ** 2} of the ${(SQ.a + 1) ** 2 - SQ.a ** 2} steps from ${SQ.a}² to ${SQ.a + 1}²; move that fraction, not half.` },
      { id: 'simple', label: 'Used simple interest', approach: `Took ${G.p} × (1 + ${G.n} × 0.0${G.r}) = ${num(G.linear)}.`, breaksAt: 'Growth compounds: count doublings with the rule of 72.' },
    ], q: `Before any teaching: estimate √${SQ.x} and ${G.p} × 1.0${G.r}^{${G.n}} in 20 seconds each. Type an interval for each. Two approaches for the root.`, answer: `√${SQ.x} ≈ ${dec(SQ.exact, 2)}; ${G.p} × 1.0${G.r}^{${G.n}} ≈ ${num(round(G.exact, 0))}.`,
      explain: `${SQ.a}² = ${SQ.a ** 2} and ${SQ.a + 1}² = ${(SQ.a + 1) ** 2} bracket the root; one Newton step gives ${dec(SQ.newton, 3)}. For the growth, simple interest (${num(G.linear)}) is far too low: 7% doubles money about every ${dec(G.dbl, 1)} years.` },
    { type: 'text', text: 'The cue: a function of one number. "Estimate √59430", "the cube root of 410711", "2^{16}", "3^{20}", "ln(3996)", "e^{4.2}", or "an account of 1000 grows 7% a year for 30 years". Only 2^{k} up to 2^{20} is exact; the rest are estimates. Each has a short, fixed method, so the first second of the question is spent deciding which of the five methods applies.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which of these should get zero width?', right: '2^{15}', wrong: [['√5000', 'irrational: estimate it'], ['1.07^{10}', 'compound growth: estimate it'], ['ln(500)', 'irrational: estimate it']], explain: `2^{15} = 1024 × 32 = ${2 ** 15}: exact, so a point.` }),
    ] },

    sec('why'),
    { type: 'text', text: 'These look like calculator questions, and without anchors they are guesses. Nobody expects you to know √59430; everybody can find the squares either side of it. With a handful of known values (squares, cubes, log10 of 2, 3 and 7, ln 10, the rule of 72) each one takes about 30 seconds and lands within 1 to 3%, which is worth 0.8 to 0.9 with the right band.' },

    sec('anchor'),
    { type: 'text', text: 'You know the anchors from the estimation-tricks lesson: 2^{10} = 1024, log10 2 ≈ 0.301, ln 10 ≈ 2.303, the rule of 72. **One change**: bracket the target between two values you know exactly, then move proportionally from the nearer one.' },
    { type: 'check', scope: '2^{10} and its multiples', questions: [
      { make: (rng) => { const k = rng.int(11, 20); return ivq(`What is 2^{${k}}? Type your interval.`, 2 ** k, `2^{10} = 1024, so 2^{${k}} = 1024 × 2^{${k - 10}} = ${num(2 ** k)}. Exact: a point.`, [`2^{${k - 10}} = ${2 ** (k - 10)}.`]); } },
    ] },

    sec('picture'),
    { type: 'text', text: `A root lives between two squares you know, and finding them is the first move. √${SQ.x} is between ${SQ.a} and ${SQ.a + 1}, because ${SQ.a}² = ${SQ.a ** 2} and ${SQ.a + 1}² = ${(SQ.a + 1) ** 2}. Near a known square, the curve is almost straight, so one step along its tangent does the rest.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: SQ.a - 1, max: SQ.a + 2, label: 'n' }, y: { min: (SQ.a - 1) ** 2, max: (SQ.a + 2) ** 2, label: 'n²' }, curves: [{ label: 'n²', points: Array.from({ length: 31 }, (_, i) => { const n = SQ.a - 1 + i / 10; return [n, n * n]; }) }], hlines: [{ y: SQ.x, label: `${SQ.x}` }], markers: [{ x: SQ.a, y: SQ.a ** 2, label: `${SQ.a}² = ${SQ.a ** 2}` }, { x: SQ.a + 1, y: (SQ.a + 1) ** 2, label: `${SQ.a + 1}² = ${(SQ.a + 1) ** 2}` }, { x: SQ.exact, y: SQ.x, label: `√${SQ.x} ≈ ${dec(SQ.exact, 2)}` }] }, caption: `${SQ.x} sits ${SQ.x - SQ.a ** 2} above ${SQ.a}². Each step of 1 in n adds about 2n ≈ ${2 * SQ.a} to n², so √${SQ.x} ≈ ${SQ.a} + ${SQ.x - SQ.a ** 2}/${2 * SQ.a} = ${dec(SQ.newton, 3)} (exact ${dec(SQ.exact, 3)}).` },
    { type: 'check', scope: 'the Newton step for roots', questions: [{ make: newtonQ }] },
    { type: 'text', text: 'Big powers and logs go through base-10 logarithms. You need only the logs of a few digits: every other digit follows from them, and a power becomes one multiplication. To turn a log back into a number, read the table the other way.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['d', 'log10 d', 'use'], rows: L10.map(([d, l]) => [String(d), dec(l, 3), d === 2 ? '2^{k}, halving' : d === 3 ? '3^{k}' : d === 7 ? '7^{k}' : d === 5 ? '= 1 − log10 2' : `from 2 and 3`]) }, caption: 'log10 of the digits. Every other value follows: log10 4 = 2 × log10 2, log10 6 = log10 2 + log10 3, log10 5 = 1 − log10 2. Read the table backwards to turn a log into a number.' },
    { type: 'check', scope: 'from a log back to a number', questions: [{ make: mantQ }] },
    { type: 'text', text: 'Compound growth doubles at a steady pace, so count doublings instead of multiplying year by year. The doubling time comes from the rule of 72; the plot shows where that rule is accurate.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 20, label: 'growth rate r (% per year)' }, y: { min: 0, max: 75, label: 'years to double' }, curves: [{ label: 'exact ln 2 / ln(1 + r)', points: rs.map((r) => [r, Math.LN2 / Math.log(1 + r / 100)]) }, { label: '72 / r', points: rs.map((r) => [r, 72 / r]) }] }, caption: `The rule of 72 against the exact doubling time. The two curves overlap from about 4% to 12%; at 1% the rule overstates slightly (72 against ${dec(Math.LN2 / Math.log(1.01), 1)}), at 20% it understates (${dec(72 / 20, 1)} against ${dec(Math.LN2 / Math.log(1.2), 1)}).` },
    { type: 'check', scope: 'the rule of 72', questions: [{ make: dblQ }] },

    sec('derivation'),
    { type: 'text', text: 'Six moves, one per kind of question plus the band. Each move starts from something you can compute exactly (a square, a cube, a known log, a doubling) and adds one small, controlled step.' },
    { type: 'steps', steps: [
      { answers: 'midpoint', say: 'Square root: find a with a² just below x, then √x ≈ a + (x − a²)/(2a).', why: '(a + h)² = a² + 2ah + h², and h² is tiny, so h ≈ (x − a²)/(2a).',
        checks: [{ make: newtonQ }] },
      { say: 'Cube root: find a with a³ just below x, then ∛x ≈ a + (x − a³)/(3a²).', why: '(a + h)³ ≈ a³ + 3a²h for small h.',
        checks: [{ make: cubeQ }] },
      { say: 'Big powers: log10(b^{k}) = k × log10 b. The whole part counts the digits minus one; 10 to the fractional part is the leading value.', why: 'Logs turn a power into one multiplication.',
        checks: [{ make: logQ }] },
      { say: 'Natural logs: ln x = 2.3026 × log10 x. And e^{x} = 10^{0.4343x}.', why: 'ln 10 = 2.3026 and log10 e = 0.4343 convert between the two bases.',
        checks: [{ make: lnQ }] },
      { answers: 'simple', say: 'Compound growth: doubling time ≈ 72 ÷ rate%. Final value ≈ start × 2^{years ÷ doubling time}.', why: 'Doubling needs n = ln 2 ÷ ln(1 + r) ≈ 0.69/r; 72 corrects for ln(1 + r) < r and divides nicely.',
        checks: [{ make: dblQ }] },
      { say: `Band: roots about 1% (×/÷ ${dec(B[1].f, 2)}), cube roots and logs 1 to 1.5%, growth 3%, big powers 4% (×/÷ ${dec(B[4].f, 2)}). 2^{k} is exact.`, why: 'Each method has a typical error; the band follows it.',
        checks: [{ make: sqrtQ }] },
    ] },
    { type: 'explain', prompt: 'Why is a 1% change in x only a 0.5% change in √x, and 0.33% in ∛x?', model: 'If x grows by a factor (1 + e), √x grows by √(1 + e) ≈ 1 + e/2 and ∛x by about 1 + e/3. A root divides the exponent, so it divides relative changes. That is why roots are easy to estimate tightly: an error in your bracket shrinks when you take the root.', points: ['√(1 + e) ≈ 1 + e/2 and ∛(1 + e) ≈ 1 + e/3', 'Roots divide relative errors by 2 or 3', 'So brackets on x become tight brackets on the root'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'powers-roots', section: 'iv', difficulty: 2, seed: 'a', intro: 'A square root or a power of 2. Bracket, refine, then choose the width.' },
    { type: 'worked', family: 'powers-roots', section: 'iv', difficulty: 3, seed: 'd', fade: 1, intro: 'A cube root, log or growth. The method is given; the band is yours.' },
    { type: 'thinkaloud', problem: `Estimate ${TA.b}^{${TA.k}}.`, lines: [
      { t: 0, say: 'I see a big power: logs. log10 3 ≈ 0.4771.' },
      { t: 5, say: `${TA.k} × 0.4771 = ${dec(TA.lg, 3)}. So it is 10^{${dec(TA.frac, 3)}} × 10^{${TA.int}}.` },
      { t: 12, say: `10^{${dec(TA.frac, 3)}} is about ${dec(TA.frac * 10, 2)}.`, slip: true },
      { t: 15, say: `No: the fraction is a log, not a digit. log10 3 = 0.477 and log10 3.5 ≈ ${dec(Math.log10(3.5), 3)}, so just under 3.5: about ${dec(TA.mant, 2)}.` },
      { t: 23, say: `Check: 3^{10} = ${num(3 ** 10)} ≈ 6 × 10^{4}; squared ≈ 3.6 × 10^{9}. Consistent.` },
      { t: 30, say: `Log reading is good to a few percent: ×/÷ ${dec(TA.band.f, 2)}: [${sig((TA.mant * 10 ** TA.int) / TA.band.f, 3)}, ${sig(TA.mant * 10 ** TA.int * TA.band.f, 3)}]. (Exact ${num(TA.exact)}.)` },
    ] },

    sec('predict'),
    { type: 'predict', question: `${G.p} grows ${G.r}% a year for ${G.n} years. Is the result closer to ${num(G.linear)}, 5,000 or 7,500?`, answer: `Closer to 7,500: ${dec(G.doublings, 2)} doublings give about ${num(round(G.est, 0))} (exact ${num(round(G.exact, 0))}).`, explain: `${num(G.linear)} is simple interest; compounding nearly triples it.` },

    sec('traps'),
    { type: 'traps', family: 'powers-roots', section: 'iv', extra: [
      { belief: 'Compound growth is simple interest: 7% for 30 years is ×3.1.', fix: 'Compounding: ×7.6. Use doublings.' },
      { belief: '√70000 has the same digits as √7000.', fix: 'Only an even power of ten keeps the digits: √700000 does; √70000 is √7 × 100.' },
      { belief: 'The fractional part of a log is the leading digit.', fix: 'Raise 10 to it: 10^{0.5} ≈ 3.16, not 5.' },
      { belief: 'Give 2^{k} a band.', fix: 'It is exact from 2^{10} = 1024: type the point.' },
    ] },
    { type: 'erroneous', problem: 'A candidate estimates √70000. One step is wrong.', steps: [
      `√7000 ≈ ${dec(Math.sqrt(7000), 2)} (from ${SQ.a}² = ${SQ.a ** 2}).`,
      `70000 is 10 × 7000, so √70000 = 10 × √7000 ≈ ${dec(10 * Math.sqrt(7000), 1)}.`,
      `Band about 1%: [${dec((10 * Math.sqrt(7000)) / B[1].f, 0)}, ${dec(10 * Math.sqrt(7000) * B[1].f, 0)}].`,
    ], errorStep: 1, explain: `Multiplying x by 10 multiplies the root by √10 ≈ 3.16, not 10. √70000 = √7 × 100 ≈ ${dec(Math.sqrt(70000), 1)}: 264² = ${264 ** 2} and 265² = ${265 ** 2} bracket it.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: '√700000 ≈ ?', right: dec(Math.sqrt(700000), 1), wrong: [[dec(Math.sqrt(70000), 1), 'that is √70000: the digits of √7'], [dec(Math.sqrt(7000) * 100, 0), 'multiplied the root by 100 for a factor of 100 in x... then once more'], ['83.7', 'forgot the powers of ten entirely']], explain: `700000 = 70 × 10^{4}, so √ = √70 × 100 ≈ ${dec(Math.sqrt(700000), 1)}: the same digits as √7000 = ${dec(Math.sqrt(7000), 2)}, times 10.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Pair the digits from the decimal point to find a root\'s size: 59430 → 5|94|30 → three digits, starting with 2 (since 2² ≤ 5 < 3²). For cube roots group in threes: 410|711 → two digits, starting with 7.' },
    { type: 'callout', tone: 'speed', text: 'Budget: 10 seconds to bracket, 15 to refine, 10 to type. The Newton step is one division; the linear interpolation between squares is almost as good if the division is awkward. For logs, write the number as mantissa × 10^{k} first: the k is free, and only the mantissa needs the table.' },
    { type: 'check', scope: 'sizing a root', questions: [
      { make: (rng) => { const x = rng.int(10000, 999999); const d = Math.floor(Math.log10(Math.sqrt(x))) + 1; return { type: 'number', q: `How many digits does the whole part of √${x} have?`, answer: d, hints: ['Pair the digits from the right.', 'One digit of root per pair.'], explain: `√${x} ≈ ${dec(Math.sqrt(x), 1)}: ${d} digits.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `Root → bracket with known squares or cubes, one Newton step. Big power → k × log10 b, then read the mantissa. ln → 2.3026 × log10. Growth → 72 ÷ rate per doubling. 2^{k} exact; everything else ×/÷ about ${dec(B[1].f, 2)} to ${dec(B[4].f, 2)}.` },

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Method', 'Typical error', 'Band'], rows: [
      ['2^{k}, k ≤ 20', '1024 × 2^{k − 10}', 'none', 'a point'],
      ['√x', 'bracket + Newton', 'about 1%', `×/÷ ${dec(B[1].f, 3)}`],
      ['∛x, ln x', 'bracket or log10', 'about 1 to 1.5%', `×/÷ ${dec(B[15].f, 3)}`],
      ['compound growth', 'rule of 72', 'about 3%', `×/÷ ${dec(B[3].f, 3)}`],
      ['b^{k}, e^{x}', 'log10 anchors', 'about 4%', `×/÷ ${dec(B[4].f, 3)}`],
    ] },
    { type: 'variation', base: `Base: √${SQ.x} ≈ ${dec(SQ.exact, 2)}, between ${SQ.a}² and ${SQ.a + 1}².`, rows: [
      { change: `${SQ.x} becomes ${num(SQ.x * 100)}`, effect: `Two more zeros, one more digit in the root: ${dec(Math.sqrt(SQ.x * 100), 1)}, the same digits × 10.` },
      { change: `${SQ.x} becomes ${num(SQ.x * 10)}`, effect: `One more zero: the digits change, √${num(SQ.x * 10)} ≈ ${dec(Math.sqrt(SQ.x * 10), 1)}.` },
      { change: 'Square root becomes cube root', effect: `∛${SQ.x} ≈ ${dec(Math.cbrt(SQ.x), 2)}: bracket with cubes (19³ = ${19 ** 3}).` },
      { same: true, change: `The question asks for the side of a square of area ${SQ.x}`, effect: `No change: that is √${SQ.x}, the same number and band.` },
      { fusion: true, change: `${SQ.x} becomes ${num(SQ.x * 100)} AND the square root becomes a cube root`, effect: `Group the digits in threes: ${num(SQ.x * 100)} → 700|000, so two digits starting with 8 (8³ = 512): ∛ ≈ ${dec(Math.cbrt(SQ.x * 100), 1)}. The zeros no longer shift the digits by a clean factor, because 100 is not a perfect cube.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a perfect square or cube is exact (type a point). The rule of 72 drifts for rates above about 15%: use ln(1 + r) ≈ r − r²/2. For e^{x} with small x, 1 + x + x²/2 beats logs.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: bracket-and-refine is how you invert anything monotone (percentiles in a grid, doubling times in a series). log10 anchors turn every big number in Fermi chains and combinatorics into additions.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'Estimate √(4900).', right: '[70, 70]', wrong: [[`[${dec(70 / B[1].f, 1)}, ${dec(70 * B[1].f, 1)}]`, 'a band on a perfect square'], ['[69, 71]', 'a band on a perfect square'], ['[49, 49]', 'took √ of the leading digits only']], explain: '70² = 4900 exactly: type the point.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const x = rng.int(1500, 9500), a = Math.floor(Math.sqrt(x)), nw = a + (x - a * a) / (2 * a); return { type: 'number', q: `A square plot has an area of ${num(x)} m². About how long is each side, in m? (1 decimal place)`, answer: round(Math.sqrt(x), 1), tolerance: 0.15, explain: `${a}² = ${a * a}; ${a} + ${x - a * a}/${2 * a} = ${dec(nw, 2)} m (exact ${dec(Math.sqrt(x), 3)}).` }; } },
      far: { type: 'number', q: 'Outside the OA: an option is worth 4.00 at 20% volatility and 5.00 at 25%. Estimate its value at 22% by interpolating between the two. (2 decimal places)', answer: 4 + ((22 - 20) / (25 - 20)) * 1, tolerance: 0.006, explain: '22% is 2/5 of the way from 20% to 25%, so 4.00 + 0.4 × 1.00 = 4.40.' },
      principle: mc({ q: 'Which idea carried over from roots to the option price?', right: 'Bracket with known values, then interpolate', wrong: [['Multiply the log by the exponent first', 'no power was involved in the option question'], ['Grow it with the rule of 72 doublings', 'nothing was compounding'], ['Take the exact midpoint of the bracket', '22% is not halfway: move by the fraction of the gap']], explain: 'Both placed an unknown between two known points and moved from the nearer one by the right fraction.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'powers-roots', section: 'iv', count: 3 },
  ],
};
