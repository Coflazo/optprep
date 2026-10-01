// Intervals: probabilities that are exact in principle but too long for a minute. Complement,
// exponential shortcut, known limits (1/e), the normal curve; then width from the method's error.
import { sec, dec, round, pct, mc, ivq, Phi, bestLog, bestNorm, bandFor, sig } from './scoring-and-width.js';

const bday = (n) => { let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365; return (1 - q) * 100; };
const bdayApprox = (n) => (1 - Math.exp(-(n * (n - 1)) / 730)) * 100;
const sixes = (n) => (1 - (5 / 6) ** n) * 100;
const tail = (z) => (1 - Phi(z)) * 100;
const nCr = (n, r) => { let c = 1; for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i; return c; };
const binTail = (n, k) => { let t = 0; for (let j = k; j <= n; j++) t += nCr(n, j); return (t / 2 ** n) * 100; };
const derange = (n) => { let s = 0, f = 1; for (let k = 0; k <= n; k++) { if (k) f *= k; s += (-1) ** k / f; } return s * 100; };

const CH = { n: 30 }; CH.exact = bday(CH.n); CH.approx = bdayApprox(CH.n); CH.band = bestNorm(CH.approx, 2.5);
const PRED = { n: 23 }; PRED.exact = bday(PRED.n); PRED.approx = bdayApprox(PRED.n);
const BIN = { n: 30, k: 20 }; BIN.sd = Math.sqrt(BIN.n) / 2; BIN.z = (BIN.k - 0.5 - BIN.n / 2) / BIN.sd; BIN.est = tail(BIN.z); BIN.exact = binTail(BIN.n, BIN.k);
const ERR = { n: 100, k: 60 }; ERR.sd = Math.sqrt(ERR.n) / 2; ERR.z = (ERR.k - 0.5 - ERR.n / 2) / ERR.sd; ERR.est = tail(ERR.z); ERR.exact = binTail(ERR.n, ERR.k);
ERR.wrongSd = Math.sqrt(ERR.n); ERR.wrongZ = (ERR.k - 0.5 - ERR.n / 2) / ERR.wrongSd; ERR.wrong = tail(ERR.wrongZ);
const TAILB = bestLog(0.2);
const BB = bestNorm(70, 2.5), SB = bestNorm(85, 1.5);
const Z_ROWS = [1, 1.5, 1.645, 2, 2.5, 3];
const POW = [6, 12, 18, 24];
const NS = Array.from({ length: 60 }, (_, i) => i + 1);

const bdayQ = (rng) => {
  const n = rng.int(15, 45), s = (n * (n - 1)) / 730;
  return { type: 'number', q: `${n} people. Using P(all different) ≈ e^{−n(n − 1)/730}, estimate P(some shared birthday) in percent. (1 decimal place)`, answer: round(bdayApprox(n), 1), tolerance: 0.6,
    hints: [`n(n − 1)/730 = ${n * (n - 1)}/730 = ${dec(s, 3)}.`, `e^{−${dec(s, 3)}} = ${dec(Math.exp(-s), 3)}; subtract from 1.`],
    explain: `e^{−${dec(s, 3)}} = ${dec(Math.exp(-s), 3)}, so ${dec(bdayApprox(n), 1)}%. The exact value is ${dec(bday(n), 2)}%: the shortcut runs slightly low.` };
};
const sixQ = (rng) => {
  const n = rng.pick([7, 8, 10, 13, 14, 16, 20]), t = sixes(n);
  return ivq(`A fair die is rolled ${n} times. Estimate P(at least one six), in percent, and type your interval.`, t, `(5/6)^{${n}} = (5/6)^{6} × (5/6)^{${n - 6}} ≈ ${dec((5 / 6) ** 6, 3)} × ${dec((5 / 6) ** (n - 6), 3)} = ${dec((5 / 6) ** n, 3)}, so about ${dec(t, 1)}%. With a ±1.5-point error the best band is about [${dec(bestNorm(t, 1.5).lo, 1)}, ${dec(Math.min(100, bestNorm(t, 1.5).hi), 1)}].`,
    ['Complement: 1 − (5/6)^{n}.', `Anchor: (5/6)^{6} ≈ ${dec((5 / 6) ** 6, 3)}; multiply by the leftover factors of 5/6.`]);
};
const zQ = (rng) => {
  const n = rng.pick([36, 64, 100, 144]), sd = Math.sqrt(n) / 2, k = n / 2 + rng.pick([2, 3]) * sd / 1 + 1;
  const kk = Math.round(k), z = (kk - 0.5 - n / 2) / sd;
  return { type: 'number', q: `A fair coin is tossed ${n} times. For P(at least ${kk} heads), what z do you look up, with the continuity correction? (2 decimal places)`, answer: round(z, 2), tolerance: 0.011,
    hints: [`Mean ${n / 2}, SD √${n}/2 = ${sd}.`, `Cut at ${kk} − 0.5 = ${kk - 0.5}.`], explain: `z = (${kk - 0.5} − ${n / 2}) / ${sd} = ${dec(z, 2)}, so P ≈ ${dec(tail(z), 2)}%.` };
};
const bandQ = (rng) => {
  const est = rng.pick([1.8, 2.5, 3.2, 4.4, 6.1]), b = bandFor(est, 0.2);
  const add = [round(est - 2, 2) > 0 ? round(est - 2, 2) : 0.1, round(est + 2, 2)];
  return { hinge: true, ...mc({ q: `Your normal-curve estimate of a tail probability is ${est}%, good to about 20% of itself. Which interval is best?`, right: `[${sig(b.lo, 3)}, ${sig(b.hi, 3)}]`, wrong: [
    [`[${add[0]}, ${add[1]}]`, 'an absolute ± 2 points: on a small value that is a huge ratio'],
    [`[${est}, ${est}]`, 'treated an approximation as exact: a point almost never hits'],
    [`[${sig(est * 0.97, 3)}, ${sig(est * 1.03, 3)}]`, 'a 3% band for a 20% error: misses most of the time'],
    [`[${sig(est / 3, 3)}, ${sig(est * 3, 3)}]`, `panic width: hits always but scores ${dec(1 / 9, 2)}`]],
    explain: `A 20% error calls for about ${dec(TAILB.z, 1)} SDs each way on the log scale: ${est} ×/÷ ${dec(TAILB.f, 2)}, expected score ${dec(TAILB.e, 2)}.` }, rng) };
};
const expQ = (rng) => {
  const x = rng.pick([0.25, 0.5, 0.75, 1, 1.5, 2, 3]);
  return { type: 'number', q: `What is e^{−${x}}? (3 decimal places)`, answer: round(Math.exp(-x), 3), tolerance: 0.0021, hints: ['Anchors: e^{−0.5} ≈ 0.607, e^{−1} ≈ 0.368.', 'e^{−(a + b)} = e^{−a} × e^{−b}.'], explain: `e^{−${x}} = ${dec(Math.exp(-x), 4)}.` };
};

const TA = { n: 25 }; TA.pairs = (TA.n * (TA.n - 1)) / 2; TA.x = TA.pairs / 365; TA.approx = bdayApprox(TA.n); TA.exact = bday(TA.n); TA.band = bestNorm(TA.approx + 1, 2.5);

export default {
  id: 'iv/prob-estimate',
  book: 'iv',
  kind: 'family',
  family: 'prob-estimate',
  title: 'Probabilities you must estimate',
  summary: 'Many-trial probabilities (birthdays, sixes in n rolls, hats, coin and dice tails): complement, exponential shortcut or normal curve, then a band sized to the shortcut\'s error.',
  prerequisites: ['iv/prob-exact', 'iv/estimation-tricks', 'prob/estimation-clt', 'bto/birthday'],
  objectives: [
    'Recognise a probability that is exact in principle but too long to compute in a minute',
    'Estimate it with the right shortcut: e^{−x} for products near 1, 1/e for hats, the normal curve for sums',
    'Size the band from the shortcut\'s error: points for central values, percent for small tails',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'linear', label: 'Scaled by the number of people', approach: `Took ${CH.n}/365 ≈ ${dec((CH.n / 365) * 100, 1)}%.`, breaksAt: 'Matches come from pairs of people, and the complement counts them all.' },
      { id: 'exact', label: 'Started the exact product', approach: `Multiplied 365/365 × 364/365 × … and ran out of time.`, breaksAt: `${CH.n} factors do not fit in a minute; their product is an exponential.` },
      { id: 'point', label: 'Typed the estimate as a point', approach: `Got ${dec(CH.approx, 1)}% and typed [${dec(CH.approx, 1)}, ${dec(CH.approx, 1)}].`, breaksAt: 'The shortcut is off by about a point, so a point misses.' },
    ], q: `Before any teaching: ${CH.n} people are in a room. What is the probability, in percent, that at least two share a birthday (365 equally likely days)? Type an interval, and find two ways to get a number.`, answer: `${dec(CH.exact, 2)}%; a good interval is about [${dec(CH.band.lo, 1)}, ${dec(CH.band.hi, 1)}]`,
      explain: `The exact product of ${CH.n} fractions will not fit in a minute. The shortcut 1 − e^{−${CH.n}·${CH.n - 1}/730} gives ${dec(CH.approx, 1)}%, about ${(CH.exact - CH.approx).toFixed(2)} points low. The lesson shows where the shortcut comes from and how wide to go around it.` },
    { type: 'text', text: 'The cue: a probability, in percent, over **many** trials or people. Exact in principle, but the exact form has dozens of factors or terms: n people and birthdays, at least one six in 10 to 24 rolls, n hats handed back at random, at least k heads in 30 to 100 tosses, the total of 10 to 50 dice.' },
    { type: 'list', items: ['"30 people are in a room. Probability, in percent, that at least two share a birthday?"', '"A fair die is rolled 15 times. Probability, in percent, of at least one six?"', '"A fair coin is tossed 100 times. Probability, in percent, of at least 60 heads?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question belongs here (estimate, with width) rather than in exact probabilities?', right: '12 hats returned at random: P(nobody gets their own), in percent', wrong: [['3 fair dice are thrown: P(all show different numbers), in percent', '6 × 5 × 4 over 216: exact in seconds'], ['4 fair coins are tossed: P(at least 2 heads), in percent', '11 of 16 sequences: exact'], ['2 cards from a deck: P(both are aces), in percent', '4/52 × 3/51: exact']], explain: 'Twelve hats means inclusion-exclusion with 13 terms. It is effectively 1/e, but you are estimating.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'These questions punish both instincts. Treating them as exact (zero width) almost always misses, because the shortcut is off by a point or so. Treating them as wild guesses (a huge band) wastes the fact that the shortcuts are good. The skill is a fast approximation plus an honest error bar. Both halves are learnable: there are only three shortcuts, and each one has a known, stable error, so the width is decided before the question even appears.' },

    sec('anchor'),
    { type: 'text', text: 'Start from the exact lesson: the complement turns "at least one" into 1 − P(none), and P(none) is a product. **One change**: the product has too many factors to multiply, so you replace it with an exponential or a normal-curve estimate, and the interval gets width. Three shortcuts cover every question of this type; the picture section shows each one next to the exact curve.' },
    { type: 'check', scope: 'the complement set-up', questions: [
      mc({ q: 'P(at least one six in n rolls) equals which expression?', right: '1 − (5/6)^{n}', wrong: [['n/6', 'added the chances: over 1 once n > 6'], ['(1/6)^{n}', 'that is P(all sixes)'], ['1 − (1/6)^{n}', 'that is P(not all sixes)']], explain: 'None of the n rolls is a six with probability (5/6)^{n}; take the complement.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Shortcut one: a product of factors close to 1 is an exponential. Since 1 − x ≈ e^{−x} for small x, P(all birthdays different) = (1 − 1/365)(1 − 2/365)… ≈ e^{−(1 + 2 + … + (n − 1))/365} = e^{−n(n − 1)/730}.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 60, label: 'people n' }, y: { min: 0, max: 100, label: 'P(shared birthday), %' }, curves: [{ label: 'exact', points: NS.map((n) => [n, bday(n)]) }, { label: 'e^(−n(n−1)/730)', points: NS.map((n) => [n, bdayApprox(n)]) }], markers: [{ x: PRED.n, y: PRED.exact, label: `n = ${PRED.n}: ${dec(PRED.exact, 1)}%` }] }, caption: `The exact curve and the shortcut almost coincide. The shortcut runs slightly low (by ${(CH.exact - CH.approx).toFixed(2)} points at n = ${CH.n}), because each 1 − x is a little below e^{−x}.` },
    { type: 'check', scope: 'the exponential shortcut', questions: [{ make: bdayQ }] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['rolls n', '(5/6)^n', 'P(at least one six)'], rows: POW.map((n) => [String(n), dec((5 / 6) ** n, 4), `${dec(sixes(n), 2)}%`]) }, caption: `Shortcut two: anchor on (5/6)^{6} ≈ ${dec((5 / 6) ** 6, 3)} (close to 1/3) and multiply. Every six extra rolls multiply P(no six) by about a third. (e^{−n/6} is too crude here: 1/6 is not small.)` },
    { type: 'check', scope: 'powers of 5/6', questions: [{ make: sixQ }] },
    { type: 'text', text: `Shortcut three: a count of successes or a total is roughly normal. Cut at the half-integer: "at least k" starts at k − ½. For ${BIN.n} tosses and at least ${BIN.k} heads: mean ${BIN.n / 2}, SD ${dec(BIN.sd, 2)}, z = (${BIN.k - 0.5} − ${BIN.n / 2}) / ${dec(BIN.sd, 2)} = ${dec(BIN.z, 2)}, tail ${dec(BIN.est, 2)}% (exact ${dec(BIN.exact, 2)}%).` },
    { type: 'diagram', diagram: 'histogram', spec: { title: `Heads in ${BIN.n} tosses (middle and upper bars)`, xLabel: 'heads', yLabel: 'sequences (millions)', bins: Array.from({ length: 13 }, (_, i) => i + 10).map((k) => ({ from: k - 0.5, to: k + 0.5, count: Math.round(nCr(BIN.n, k) / 1e6) })) }, caption: `"At least ${BIN.k}" is the bars from ${BIN.k} upward, which start at ${BIN.k - 0.5}. Cutting the normal curve at ${BIN.k - 0.5}, not ${BIN.k}, keeps the whole bar for ${BIN.k}.` },
    { type: 'check', scope: 'the normal cut', questions: [{ make: zQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { answers: 'linear', say: 'Write the complement: "at least one" or "some shared" becomes 1 − P(none) or 1 − P(all different).', why: 'P(none) is one product; "at least one" is a messy union.',
        checks: [mc({ q: 'n people: P(some shared birthday) = ?', right: '1 − P(all n birthdays differ)', wrong: [['n/365, one chance per person', 'the linear guess: ignores that pairs, not people, create matches'], ['(1/365)^{n}, all on one day', 'that is everyone sharing one given day']], explain: 'Complement of "all different", which is a product of n factors.' })] },
      { answers: 'exact', say: 'Turn a product of factors near 1 into an exponential: (1 − a)(1 − b)… ≈ e^{−(a + b + …)}.', why: 'ln(1 − x) ≈ −x for small x, so the logs add to −(a + b + …).',
        checks: [{ make: (rng) => { const n = rng.int(20, 40); return { type: 'number', q: `${n} people: what is the exponent 1 + 2 + … + ${n - 1} over 365? (3 decimal places)`, answer: round((n * (n - 1)) / 730, 3), tolerance: 0.0015, explain: `${n}·${n - 1}/2 = ${(n * (n - 1)) / 2}, over 365 = ${dec((n * (n - 1)) / 730, 3)}.` }; } }] },
      { say: 'Know the limits: hats (nobody gets their own) → 1/e = 36.79% for n of 7 or more; (5/6)^{6} ≈ 1/3.', why: 'Inclusion-exclusion for hats is the series for e^{−1}, and its tail is below 1/(n + 1)!.',
        checks: [{ make: (rng) => { const n = rng.int(7, 12); return { type: 'number', q: `${n} hats handed back at random. P(nobody gets their own), in percent, to 2 decimal places?`, answer: round(derange(n), 2), tolerance: 0.006, explain: `e^{−1} = ${dec(100 / Math.E, 4)}%; for n = ${n} the exact value is ${dec(derange(n), 4)}%, the same to two decimals.` }; } }] },
      { say: 'For counts and totals, use the normal curve: mean, SD, cut at k − ½, z, then read the tail.', why: 'A sum of many independent pieces is close to normal (the CLT); the half-integer keeps the bar for k.',
        checks: [{ make: zQ }] },
      { answers: 'point', say: 'Size the band from the shortcut\'s error. Central values (roughly 12% to 88%): an absolute error of 1 to 2.5 points, band about ±2 of those. Small tails: a percent error near 20%, band ×/÷ 1.3.', why: 'The e^{−x} and normal shortcuts err by points in the middle but by a fraction of the value in the tails.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why does a tail estimate like "2.9%" need a percent band while "70%" can take a ± band in points?', model: 'The normal approximation is off by a fraction of the value in the tails, so 2.9% could easily be 2.4% or 3.5%: the error is about 20% of the value, and the interval should be 2.9 ×/÷ 1.3. In the middle the same shortcuts are off by a point or two regardless of the value, so 70 ± 3 is the right shape there.', points: ['Tail errors are proportional to the value', 'Central errors are a few points, whatever the value', 'The band\'s shape follows the error\'s shape: ×/÷ for proportional, ± for absolute'] },

    sec('worked'),
    { type: 'worked', explainAt: [0, 3], family: 'prob-estimate', section: 'iv', difficulty: 2, seed: 'a', intro: 'Birthdays or sixes. Estimate, then choose the band before you open the solution.' },
    { type: 'worked', family: 'prob-estimate', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'Hats or a coin tail. The estimate is given; sizing the band is your step.' },
    { type: 'thinkaloud', problem: `${TA.n} people are in a room. What is the probability, in percent, that at least two share a birthday?`, lines: [
      { t: 0, say: 'I see many people and a match: exact is too long, so I estimate.' },
      { t: 3, say: `${TA.n} people out of 365 days: about ${dec((TA.n / 365) * 100, 0)}%.`, slip: true },
      { t: 6, say: 'No: that counts people. Matches come from pairs. I take the complement, all birthdays different.' },
      { t: 10, say: `Pairs: ${TA.n} × ${TA.n - 1} / 2 = ${TA.pairs}. Over 365 that is ${dec(TA.x, 3)}.` },
      { t: 17, say: `e^{−${dec(TA.x, 3)}}: e^{−0.8} ≈ ${dec(Math.exp(-0.8), 3)}, a touch lower, about ${dec(Math.exp(-TA.x), 2)}. So about ${dec(TA.approx, 0)}%.` },
      { t: 25, say: `Check: 23 people give about half, and ${TA.n} is a few more, so a bit over half is right.` },
      { t: 31, say: `The shortcut runs about a point low: centre near ${dec(TA.approx + 1, 0)}, error 2.5 points, leaning high: [${dec(TA.band.lo, 1)}, ${dec(TA.band.hi, 1)}]. (Truth ${dec(TA.exact, 2)}%.)` },
    ] },

    sec('predict'),
    { type: 'predict', question: `${PRED.n} people: is P(some shared birthday) above or below 50%? Decide before computing.`, answer: `Just above: ${dec(PRED.exact, 2)}%. The shortcut gives e^{−${PRED.n}·${PRED.n - 1}/730} = e^{−${dec((PRED.n * (PRED.n - 1)) / 730, 3)}}, and ${dec((PRED.n * (PRED.n - 1)) / 730, 3)} is almost exactly ln 2, so ${PRED.approx.toFixed(1)}%.`, explain: `There are ${(PRED.n * (PRED.n - 1)) / 2} pairs of people, each matching with chance 1/365. Pairs, not people, drive birthday matches.` },

    sec('traps'),
    { type: 'traps', family: 'prob-estimate', section: 'iv', extra: [
      { belief: 'Birthday matches grow like n/365.', fix: `Matches come from pairs: n(n − 1)/2 of them. ${CH.n} people make ${(CH.n * (CH.n - 1)) / 2} pairs.` },
      { belief: 'An estimate can be typed as a point.', fix: 'Your shortcut is off by a point or two; a point interval almost always scores 0.' },
      { belief: 'Cut the normal curve at k for "at least k".', fix: 'The bar for k starts at k − ½; cutting at k loses half of it.' },
      { belief: 'A ± 2-point band works for a 3% tail.', fix: 'That is [1, 5], a ratio of 0.2. Tails need a percent band.' },
    ] },
    { type: 'erroneous', problem: `A candidate estimates P(at least ${ERR.k} heads in ${ERR.n} tosses). One step is wrong.`, steps: [
      `Heads have mean ${ERR.n / 2}.`,
      `The SD is √${ERR.n} = ${ERR.wrongSd}.`,
      `Cut at ${ERR.k - 0.5}: z = (${ERR.k - 0.5} − ${ERR.n / 2}) / ${ERR.wrongSd} = ${dec(ERR.wrongZ, 2)}.`,
      `Tail ≈ ${dec(ERR.wrong, 1)}%; type about ${dec(ERR.wrong, 1)} ×/÷ 1.3.`,
    ], errorStep: 1, explain: `One toss has SD 1/2, so ${ERR.n} tosses have SD √${ERR.n} × 1/2 = ${ERR.sd}. Then z = ${dec(ERR.z, 2)} and the tail is about ${dec(ERR.est, 2)}% (exact ${dec(ERR.exact, 2)}%). The wrong SD put the whole band far above the truth.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate types [8, 9] for P(shared birthday among 30 people). Which belief produced it?', right: 'Matches grow like n/365', wrong: [['The complement was forgotten', `the complement of the right answer would be about ${dec(100 - CH.exact, 0)}%`], ['The normal curve was cut at k', 'no normal curve is involved here']], explain: `30/365 ≈ ${dec(3000 / 365, 1)}%: the linear belief. The truth is ${dec(CH.exact, 1)}%.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Exponential anchors: e^{−0.5} ≈ ${dec(Math.exp(-0.5), 3)}, e^{−1} ≈ ${dec(Math.exp(-1), 3)}, e^{−2} ≈ ${dec(Math.exp(-2), 3)}, e^{−3} ≈ ${dec(Math.exp(-3), 3)}. Combine them: e^{−1.5} = e^{−1} × e^{−0.5} ≈ ${dec(Math.exp(-1.5), 3)}.` },
    { type: 'callout', tone: 'speed', text: `Normal tails to know: ${Z_ROWS.map((z) => `z = ${z} → ${dec(tail(z), 2)}%`).join(', ')}. Between them, interpolate on the ratio: each extra 0.5 in z divides the tail by roughly 2.5 to 4.` },
    { type: 'check', scope: 'exponential anchors', questions: [{ make: expQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Many trials → complement → e^{−Σ} for products near 1, 1/e for hats, normal with a half-integer cut for sums → band: ± about 2 of your point-errors in the middle, ×/÷ 1.3 in the tails.' },

    sec('contrast'),
    { type: 'compare', columns: ['Setup', 'Shortcut', 'Error of the shortcut', 'Band'], rows: [
      ['Birthdays, n people', '1 − e^{−n(n−1)/730}', `${(CH.exact - CH.approx).toFixed(2)} points low at n = ${CH.n}`, `SD 2.5 points: −${dec(BB.below * 2.5, 1)} / +${dec(BB.above * 2.5, 1)}`],
      ['At least one six in n rolls', '1 − (5/6)^{6} powers', 'rounding of the anchor', `SD 1.5 points: −${dec(SB.below * 1.5, 1)} / +${dec(SB.above * 1.5, 1)}`],
      ['n hats, nobody own', `1/e = ${dec(100 / Math.E, 2)}%`, 'below 0.01 points for n ≥ 7', 'nearly exact: tight'],
      ['At least k heads / dice total ≥ k', 'normal, cut at k − ½', 'about 20% of a small tail', `×/÷ ${dec(TAILB.f, 2)}`],
    ] },
    { type: 'variation', base: `Base: ${CH.n} people, P(shared birthday) ≈ 1 − e^{−${CH.n}·${CH.n - 1}/730} = ${dec(CH.approx, 1)}%, a band of about ± 5 points.`, rows: [
      { change: `${CH.n} people become 60`, effect: `e^{−60·59/730} ≈ ${dec(Math.exp(-(60 * 59) / 730), 4)}, so about ${dec(bdayApprox(60), 1)}%: the band cannot pass 100, so all the width goes below.` },
      { change: 'Birthdays become "at least one six in 12 rolls"', effect: `(5/6)^{12} ≈ ${dec((5 / 6) ** 12, 3)}, so ${dec(sixes(12), 1)}%: the same ± shape, with a smaller error.` },
      { change: 'Birthdays become "at least 60 heads in 100 tosses"', effect: `A small tail, about ${dec(ERR.est, 1)}%: switch to a ×/÷ ${dec(TAILB.f, 2)} band.` },
      { change: 'Birthdays become "10 hats, nobody gets their own"', effect: `1/e = ${dec(100 / Math.E, 4)}% to four decimals: a hair-thin bracket.` },
      { same: true, change: 'The people are asked their birthdays one at a time, in a different order', effect: 'No change: whether some pair matches does not depend on the order of asking, so the estimate and the band stay the same.' },
      { fusion: true, change: `${CH.n} people become 40 AND the year has 400 days`, effect: `Both feed the same exponent, pairs over days: 40·39/800 = ${dec((40 * 39) / 800, 3)}, so about ${dec((1 - Math.exp(-(40 * 39) / 800)) * 100, 1)}%. More people push it up, more days pull it down.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: with few trials (up to about 5 dice or 6 coins) compute exactly instead. Hats with n ≥ 7 are 36.79% to two decimals, so a tight bracket like [${dec(100 / Math.E - 0.01, 2)}, ${dec(100 / Math.E + 0.01, 2)}] is safe. Near 100%, the band cannot go above 100: put the spare width below.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: e^{−x} for products near 1 is the Poisson limit (rare events), the normal cut is the CLT from Beat the Odds, and "size the band from the method\'s error" is how every Intervals estimate is finished.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: '9 hats are returned at random. Which interval is best for P(nobody gets their own), in percent?', right: `[${dec(derange(9) - 0.01, 2)}, ${dec(derange(9) + 0.01, 2)}]`, wrong: [[`[${dec(derange(9) - 2.5, 1)}, ${dec(derange(9) + 2.5, 1)}]`, 'a central-value band for a value that is known to 4 decimals'], ['[11.1, 11.1]', 'used 1/n: the chance one given person gets their own hat'], [`[${dec(100 - 100 / Math.E, 2)}, ${dec(100 - 100 / Math.E + 0.02, 2)}]`, 'gave the complement: someone gets their own hat']], explain: `Exact ${dec(derange(9), 4)}%, the same as 1/e to four decimals, so a hair-thin bracket is safe.` }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(12, 20); let q = 1; for (let i = 0; i < n; i++) q *= (100 - i) / 100; return ivq(`${n} traders each pick one of 100 stocks at random. Estimate P(at least two pick the same stock), in percent, and type your interval.`, (1 - q) * 100, `Pairs ${n}·${n - 1}/2 = ${(n * (n - 1)) / 2}, over 100: e^{−${dec((n * (n - 1)) / 200, 2)}} ≈ ${dec(Math.exp(-(n * (n - 1)) / 200), 3)}, so about ${dec((1 - Math.exp(-(n * (n - 1)) / 200)) * 100, 1)}%. Exact ${dec((1 - q) * 100, 2)}%.`); } },
      far: { type: 'number', q: 'A desk makes 40 independent trades a day, each with a 2% chance of a booking error. Estimate P(at least one error), in percent. (1 decimal place)', answer: round((1 - 0.98 ** 40) * 100, 1), tolerance: 1.05, explain: `Complement and exponential: 1 − 0.98^{40} ≈ 1 − e^{−0.8} = ${dec((1 - Math.exp(-0.8)) * 100, 1)}%. Exact ${dec((1 - 0.98 ** 40) * 100, 2)}%.` },
      principle: mc({ q: 'Which idea carried over from birthdays to booking errors?', right: 'A product of factors near 1 is e^{−sum}', wrong: [['Matches come from pairs, not people', 'booking errors are not matches between pairs'], ['Cut the normal curve at a half-integer', 'no sum of many pieces was approximated'], ['Exact answers get zero width', 'both answers were estimates']], explain: 'Both were "at least one" questions whose "none" probability is a long product of factors near 1, replaced by e to minus their sum.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'prob-estimate', section: 'iv', count: 3 },
  ],
};
