// Intervals: exact expected values over a few fair dice. Sums add, independent products
// multiply, maxima via P(max ≤ k), |difference| by counting, one reroll by a threshold,
// distinct faces by indicators. Exact, so a point or a tight bracket.
import { Q, sumQ } from '../../../core/rational.js';
import { sec, dec, round, mc, ivq, exactEntry } from './scoring-and-width.js';

const faces = (m) => Array.from({ length: m }, (_, i) => i + 1);
const Emax = (m) => sumQ(faces(m).map((k) => Q.of(k * (2 * k - 1), m * m)));
const Emin = (m) => Q.of(m + 1).sub(Emax(m));
const Eabs = (m) => Q.of(m * m - 1, 3 * m);
const Ereroll = (m) => { const e = Q.of(m + 1, 2); return sumQ(faces(m).map((k) => (Q.of(k).cmp(e) > 0 ? Q.of(k) : e))).div(Q.of(m)); };
const Edist = (n) => Q.of(6).mul(Q.of(1).sub(Q.of(5 ** n, 6 ** n)));
const Emax3 = sumQ(faces(6).map((k) => Q.of(k * (k ** 3 - (k - 1) ** 3), 216)));
const show = (q) => `${q.toString()}${q.d === 1n ? '' : ` = ${dec(q.toNumber(), 4)}`}`;
const entry = (q) => exactEntry(q.toNumber()).text;

const CH = Emax(6);
const ABS = { d: 2 };
const absCells = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (Math.abs(r - c) === ABS.d) absCells.push([r, c]);
const RR = { m: 6 }; RR.e = (RR.m + 1) / 2; RR.v = Ereroll(RR.m);

const oneQ = (rng) => { const m = rng.pick([4, 8, 10, 12, 20]); return { type: 'number', q: `One fair ${m}-sided die. What is its expected value?`, answer: (m + 1) / 2, explain: `(1 + ${m}) ÷ 2 = ${(m + 1) / 2}: the faces are symmetric about their middle.` }; };
const sumQn = (rng) => { const n = rng.int(3, 12), m = rng.pick([4, 6, 8, 10, 12, 20]); const v = (n * (m + 1)) / 2; return ivq(`${n} fair ${m}-sided dice are thrown. Type the best interval for the expected total.`, v, `${n} × ${(m + 1) / 2} = ${v}. Exact and terminating: type [${v}, ${v}] for a score of 1.`, ['One die averages (1 + m)/2.', 'Linearity: add the averages.']); };
const prodQ = (rng) => {
  const m = rng.pick([4, 6, 8, 10, 12]), n = rng.pick([2, 3]), e = (m + 1) / 2, v = e ** n;
  const sq = faces(m).reduce((a, k) => a + k * k, 0) / m;
  return { hinge: true, ...mc({ q: `${n === 2 ? 'Two' : 'Three'} fair ${m}-sided dice are thrown. What is the expected product?`, right: String(round(v, 4)), wrong: [
    [String(round(n * e, 4)), 'added the means instead of multiplying them'],
    [String(round(n === 2 ? sq : sq * e, 4)), 'used E[X²] for one die: the same die squared is not two independent dice'],
    [String((1 + m ** n) / 2), 'averaged the smallest and largest possible products']],
    explain: `Independent dice: E[product] = E[die]^{${n}} = ${e}^{${n}} = ${round(v, 4)}.` }, rng) };
};
const maxQ = (rng) => {
  const m = rng.pick([4, 6, 8, 10]), mx = rng.chance(0.5), q = mx ? Emax(m) : Emin(m);
  return ivq(`Two fair ${m}-sided dice. Type the best interval for the expected ${mx ? 'larger' : 'smaller'} number.`, q.toNumber(), `E[max] = (m + 1)(4m − 1)/(6m) = ${show(Emax(m))}${mx ? '' : `, and E[min] = (m + 1) − E[max] = ${show(Emin(m))}`}. Type ${entry(q)}.`,
    ['P(max ≤ k) = (k/m)², so P(max = k) = (2k − 1)/m².', 'E[max] = Σ k(2k − 1)/m²; E[min] = m + 1 − E[max].']);
};
const absQ = (rng) => { const m = rng.pick([4, 6, 8, 10, 12]), q = Eabs(m); return ivq(`Two fair ${m}-sided dice. Type the best interval for the expected absolute difference.`, q.toNumber(), `(m² − 1)/(3m) = ${m * m - 1}/${3 * m} = ${show(q)}. Type ${entry(q)}.`, ['P(|X − Y| = d) = 2(m − d)/m² for d ≥ 1.', 'The sum simplifies to (m² − 1)/(3m).']); };
const rerollQ = (rng) => {
  const m = rng.pick([4, 6, 8, 10, 12, 20]), e = (m + 1) / 2, keep = faces(m).filter((k) => k > e), v = Ereroll(m);
  return { type: 'number', q: `A fair ${m}-sided die pays its face; you may reroll once and take the second number. With the best strategy, what is the expected payout? (4 decimal places)`, answer: round(v.toNumber(), 4), tolerance: 0.0001,
    hints: [`A reroll is worth ${e}: keep anything above it.`, `Keep ${keep[0]} to ${m}; the other ${m - keep.length} faces are worth ${e} each.`],
    explain: `(${keep.join(' + ')} + ${m - keep.length} × ${e}) ÷ ${m} = ${show(v)}.` };
};
const distQ = (rng) => { const n = rng.int(2, 6), q = Edist(n); return { type: 'number', q: `A fair die is rolled ${n} times. Expected number of different faces seen? (4 decimal places)`, answer: round(q.toNumber(), 4), tolerance: 0.0001, hints: ['One indicator per face: did it appear?', `P(a given face appears) = 1 − (5/6)^{${n}}.`], explain: `6 × (1 − (5/6)^{${n}}) = ${show(q)}.` }; };
const mirrorQ = (rng) => { const m = rng.pick([4, 6, 8, 10, 12]); return { type: 'number', q: `Two fair ${m}-sided dice: E[larger] = ${Emax(m).toString()}. What is E[smaller]? (as a decimal, 4 places)`, answer: round(Emin(m).toNumber(), 4), tolerance: 0.0001, hints: ['max + min = X + Y for every roll.', `So E[max] + E[min] = E[X] + E[Y] = ${m + 1}.`], explain: `${m + 1} − ${Emax(m).toString()} = ${show(Emin(m))}.` }; };

const TA = { m: 10 };

export default {
  id: 'iv/expected-dice',
  book: 'iv',
  kind: 'family',
  family: 'expected-dice',
  title: 'Expected values with dice',
  summary: 'Sums add, independent products multiply, maxima come from P(max ≤ k), differences from counting, a reroll from a threshold. Exact every time, so type a point or a tight bracket.',
  prerequisites: ['iv/prob-exact', 'prob/expectation-linearity', 'bto/expected-extremes', 'bto/dice-games-ev'],
  objectives: [
    'Name the tool for each expected-value question in five seconds (sum, product, max/min, |difference|, reroll, distinct faces)',
    'Compute each one exactly as a fraction in under 40 seconds',
    'Use the closed forms (m + 1)(4m − 1)/(6m) for the maximum and (m² − 1)/(3m) for the difference',
    'Type the exact answer as a point or a 4-significant-figure bracket',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'maxofmeans', label: 'Took the max of the means', approach: 'Answered 3.5, the mean of one die, since both dice average 3.5.', breaksAt: 'The maximum is taken roll by roll, so it leans high.' },
      { id: 'circular', label: 'Used max + min = total', approach: 'Wrote E[max] = 7 − E[min] and got stuck on E[min].', breaksAt: 'True, but one of the two must still be computed directly from P(max ≤ k).' },
    ], q: 'Before any teaching: two fair six-sided dice are thrown. What is the expected value of the larger number shown? Type an interval, and try two different ways of getting the number.', answer: `${show(CH)}…, so type ${entry(CH)}`,
      explain: `Not 3.5 (that is one die) and not 6 (that is the largest possible). The larger of two faces is pulled up: P(max = k) = (2k − 1)/36, and Σ k(2k − 1)/36 = ${CH.toString()}. The lesson builds that sum and a closed form.` },
    { type: 'text', text: 'The cue: "What is the **expected** …" over a few fair dice, with the answer typed as bounds. The quantity is one of six kinds: the total, the larger or smaller face, the product, the absolute difference, the best payout with one reroll, or the number of different faces in n rolls.' },
    { type: 'list', items: ['"7 fair six-sided dice are thrown. What is the expected total?"', '"Two fair 8-sided dice. What is the expected value of the smaller number?"', '"You may reroll a fair die once and take the second number. Expected payout with the best strategy?"'] },
    { type: 'check', scope: 'the six kinds', questions: [
      mc({ q: 'Which tool fits "Two dice: expected value of the larger number"?', right: 'P(max ≤ k) = (k/m)², then difference and average', wrong: [['Linearity: add the two means, 3.5 + 3.5', 'that is the total, not the larger face'], ['Independence: multiply the means, 3.5 × 3.5', 'that is the product'], ['A keep-or-reroll threshold at (m + 1)/2', 'that is the reroll game']], explain: 'A maximum is an "all at most k" event, which is easy: both dice ≤ k.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Expected values over dice are exact: each one is a short fraction, so each one is a full point if you compute it and a zero if you round it into a point. They are the weighted-average cousins of the exact probabilities, and they come up in Beat the Odds too, so the formulas pay twice. The work is recognising which of six kinds you face; after that each answer is one formula and one careful division.' },

    sec('anchor'),
    { type: 'text', text: 'You know one die: faces 1 to m, each equally likely, average (m + 1)/2. Every question here is that average **plus one change**: add several (sum), multiply several (product), keep the bigger (max), subtract (difference), or choose whether to keep it (reroll).' },
    { type: 'check', scope: 'one die', questions: [{ make: oneQ }] },

    sec('picture'),
    { type: 'text', text: 'Draw the maximum of two dice as counts. The larger face is at most k exactly when both dice are, which is k × k cells of the grid; so max = k takes k² − (k − 1)² = 2k − 1 cells. The minimum is the mirror image.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Two six-sided dice: cells per value (of 36)', xLabel: 'value', yLabel: 'cells', categories: faces(6).map(String), series: [{ name: 'max = k', values: faces(6).map((k) => 2 * k - 1) }, { name: 'min = k', values: faces(6).map((k) => 2 * (6 - k) + 1) }], valueLabels: true }, caption: `The maximum leans high (1, 3, 5, 7, 9, 11 cells) and the minimum leans low (the same counts reversed). Averaging gives E[max] = ${show(Emax(6))} and E[min] = ${show(Emin(6))}; they add to 7.` },
    { type: 'check', scope: 'the max and min counts', questions: [
      { make: (rng) => { const m = rng.pick([6, 8, 10]), k = rng.int(2, m); return { type: 'number', q: `Two fair ${m}-sided dice. In how many of the ${m * m} ordered pairs is the larger face exactly ${k}?`, answer: 2 * k - 1, hints: [`Both ≤ ${k}: ${k * k} pairs. Both ≤ ${k - 1}: ${(k - 1) ** 2}.`], explain: `${k}² − ${k - 1}² = ${2 * k - 1}.` }; } },
    ] },
    { type: 'diagram', diagram: 'grid', spec: { rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => Math.abs(r - c))), highlight: absCells, count: absCells.length }, caption: `The grid of |first − second|. Difference ${ABS.d} sits on two diagonals, ${absCells.length} cells = 2(6 − ${ABS.d}). Difference d has 2(m − d) cells for d ≥ 1 and m cells for d = 0.` },
    { type: 'check', scope: 'the difference diagonals', questions: [
      { make: (rng) => { const m = rng.pick([6, 8, 10, 12]), d = rng.int(1, m - 1); return { type: 'number', q: `Two fair ${m}-sided dice. How many ordered pairs have |difference| = ${d}?`, answer: 2 * (m - d), explain: `Two diagonals of length ${m} − ${d}: ${2 * (m - d)}.` }; } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['first roll', 'keep or reroll', 'worth'], rows: faces(RR.m).map((k) => [String(k), k > RR.e ? 'keep' : 'reroll', String(k > RR.e ? k : RR.e)]).concat([['average', '', `${RR.v.toString()} = ${dec(RR.v.toNumber(), 4)}`]]) }, caption: `The reroll game with one six-sided die. A reroll is worth ${RR.e} on average, so keep ${faces(RR.m).filter((k) => k > RR.e).join(', ')} and reroll the rest. The value of the game is the average of the "worth" column.` },
    { type: 'check', scope: 'the keep-or-reroll threshold', questions: [
      mc({ q: 'Fair 10-sided die, one reroll allowed. Which first rolls do you keep?', right: '6 to 10', wrong: [['5 to 10', 'kept 5, which is worth less than a reroll (5.5)'], ['7 to 10', 'rerolled 6, which beats the reroll average 5.5'], ['10 only', 'compared with the best face instead of the average reroll']], explain: 'A reroll averages 5.5; keep anything above it.' }),
    ] },

    sec('derivation'),
    { type: 'text', text: 'Seven formulas for the six kinds. Each starts from the one-die average and applies the single change named in the anchor; none needs more than a line of algebra, and each check below uses only the formula just derived.' },
    { type: 'steps', steps: [
      { say: 'Total of n dice: E = n(m + 1)/2.', why: 'Linearity: the mean of a sum is the sum of the means, with or without independence.',
        checks: [{ make: sumQn }] },
      { say: 'Product of independent dice: E = ((m + 1)/2)^{n}.', why: 'For independent variables E[XY] = E[X]E[Y]. It fails for one die times itself: E[X²] is bigger than E[X]².',
        checks: [{ make: prodQ }] },
      { answers: 'maxofmeans', say: 'Maximum of two: P(max = k) = (2k − 1)/m², so E[max] = Σ k(2k − 1)/m² = (m + 1)(4m − 1)/(6m).', why: 'Σ k(2k − 1) = 2Σk² − Σk = m(m + 1)(4m − 1)/6; divide by m².',
        checks: [{ make: maxQ }] },
      { answers: 'circular', say: 'Minimum of two: E[min] = (m + 1) − E[max].', why: 'max + min = X + Y on every roll, so their expectations add to E[X] + E[Y] = m + 1.',
        checks: [{ make: mirrorQ }] },
      { say: 'Absolute difference: P(|X − Y| = d) = 2(m − d)/m², so E = Σ 2d(m − d)/m² = (m² − 1)/(3m).', why: 'Two diagonals per difference; Σ d(m − d) = m(m² − 1)/6.',
        checks: [{ make: absQ }] },
      { say: 'One reroll: keep faces above (m + 1)/2, reroll the rest. E = (sum of kept faces + (number rerolled) × (m + 1)/2) ÷ m.', why: 'Keep whatever beats the value of the alternative; a reroll is worth one fresh die.',
        checks: [{ make: rerollQ }] },
      { say: 'Different faces in n rolls: E = 6 × (1 − (5/6)^{n}).', why: 'One indicator per face; each appears with probability 1 − (5/6)^{n}; linearity adds them even though they are dependent.',
        checks: [{ make: distQ }] },
    ] },
    { type: 'explain', prompt: 'Why is E[larger of two dice] not the larger of the two expectations, 3.5?', model: `The expectation of a maximum averages the maximum over every roll, and on most rolls the maximum is bigger than a typical single die: it only equals a low face when both dice are low. Taking the maximum of the expectations first throws that away and gives 3.5, but the true value is ${CH.toString()} ≈ ${dec(CH.toNumber(), 2)}.`, points: ['max is taken roll by roll, before averaging', 'Only both-low rolls give a low maximum, so it leans high', 'E[max] ≥ max(E), with equality only when there is no randomness'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'expected-dice', section: 'iv', difficulty: 2, seed: 'c', intro: 'A maximum, minimum, product or difference. Compute it and decide what to type.' },
    { type: 'worked', family: 'expected-dice', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'A reroll game or distinct faces. The computation is given; typing the interval is yours.' },
    { type: 'thinkaloud', problem: `Two fair ${TA.m}-sided dice are thrown. What is the expected value of the smaller number shown?`, lines: [
      { t: 0, say: 'I see "expected" and "smaller of two dice": the minimum. Exact, so zero width.' },
      { t: 4, say: `The minimum mirrors the maximum, so E[min] = E[max] = ${dec(Emax(TA.m).toNumber(), 2)}?`, slip: true },
      { t: 8, say: `No: they mirror around the middle, so max + min = X + Y and E[min] = ${TA.m + 1} − E[max].` },
      { t: 12, say: `E[max] = (m + 1)(4m − 1)/(6m) = ${TA.m + 1} × ${4 * TA.m - 1} / ${6 * TA.m} = ${dec(Emax(TA.m).toNumber(), 4)}.` },
      { t: 19, say: `E[min] = ${TA.m + 1} − ${dec(Emax(TA.m).toNumber(), 4)} = ${dec(Emin(TA.m).toNumber(), 4)}. Check: below the one-die mean ${(TA.m + 1) / 2}, as it must be.` },
      { t: 25, say: `It terminates, so I type ${entry(Emin(TA.m))}.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try set E[min] = E[max]. What was wrong?', options: ['they mirror around the middle', 'E[max] itself was miscounted', 'the dice have 6 sides'], answer: 0, traps: { 1: 'E[max] = 7.15 is right', 2: 'these dice have 10 sides' }, explain: 'max + min = X + Y, so E[min] = 11 − E[max] = 3.85.' },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Two dice give E[max] ≈ 4.47. With three six-sided dice, is E[max] closer to 4.5, 5 or 5.5?', answer: `Closer to 5: E[max of 3] = Σ k(k³ − (k − 1)³)/216 = ${show(Emax3)}.`, explain: 'Each extra die pushes the maximum up, but by less each time: the maximum can never pass 6.' },

    sec('traps'),
    { type: 'traps', family: 'expected-dice', section: 'iv', extra: [
      { belief: 'E[max] = max(E[X], E[Y]) = 3.5.', fix: `Average the maximum over the rolls: ${CH.toString()} for two six-sided dice.` },
      { belief: 'E[X²] = E[X]² for one die.', fix: `Only independent factors multiply. E[X²] for a die is ${Q.of(faces(6).reduce((a, k) => a + k * k, 0), 6).toString()}, not ${3.5 ** 2}.` },
      { belief: 'In the reroll game, keep a face equal to or above half of m.', fix: 'Compare with the reroll average (m + 1)/2, not with m/2.' },
      { belief: `Type ${dec(CH.toNumber(), 2)} for ${CH.toString()}.`, fix: `A rounded point misses: bracket it, ${entry(CH)}.` },
    ] },
    { type: 'erroneous', problem: 'A candidate computes the expected absolute difference of two fair six-sided dice. One step is wrong.', steps: [
      'Difference 0 has 6 cells, and contributes nothing to the average.',
      'Difference d (1 to 5) has 6 − d cells.',
      `E = (1 × 5 + 2 × 4 + 3 × 3 + 4 × 2 + 5 × 1)/36 = ${[1, 2, 3, 4, 5].reduce((a, d) => a + d * (6 - d), 0)}/36.`,
      `Type ${exactEntry([1, 2, 3, 4, 5].reduce((a, d) => a + d * (6 - d), 0) / 36).text}.`,
    ], errorStep: 1, explain: `Difference d has **two** diagonals, first above second and second above first: 2(6 − d) cells. Then E = ${Eabs(6).toString()} = ${dec(Eabs(6).toNumber(), 4)}…, typed as ${entry(Eabs(6))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate answers 3.5 for "two dice: expected larger face". Which belief?', right: 'max of the means = mean of the max', wrong: [['Linearity was applied to the sum', 'the sum would give 7, not 3.5'], ['Unordered pairs were counted as outcomes', 'that changes the weights, but does not give exactly 3.5']], explain: `max(3.5, 3.5) = 3.5. The truth is ${CH.toString()} ≈ ${dec(CH.toNumber(), 2)}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Six-sided values to know: E[max of 2] = ${show(Emax(6))}, E[min of 2] = ${show(Emin(6))}, E[|difference|] = ${show(Eabs(6))}, one reroll = ${show(Ereroll(6))}, E[product of 2] = ${3.5 ** 2}. Each saves the whole computation.` },
    { type: 'check', scope: 'values to know', questions: [
      { type: 'choice', q: 'Six-sided dice: E[max of 2] is:', options: ['4.4722', '2.5278', '1.9444', '4.25'], answer: 0, traps: { 1: 'that is E[min of 2]', 2: 'that is E[|difference|]', 3: 'that is one reroll' }, explain: 'E[max of 2] = 161/36 = 4.4722.' },
    ] },
    { type: 'callout', tone: 'speed', text: `Mirror shortcut: once you have E[max], E[min] = (m + 1) − E[max]. And a third decimal is free: ${entry(CH)} scores ${dec(exactEntry(CH.toNumber()).score, 4)}, where [4.47, 4.48] scores ${dec(4.47 / 4.48, 4)}.` },
    { type: 'check', scope: 'the mirror shortcut', questions: [{ make: mirrorQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Sum: n(m + 1)/2. Independent product: ((m + 1)/2)^{n}. Max of two: (m + 1)(4m − 1)/(6m); min: m + 1 minus that. |Difference|: (m² − 1)/(3m). Reroll: keep above (m + 1)/2. Distinct faces: 6(1 − (5/6)^{n}). Then a point or a 4-s.f. bracket.' },

    sec('contrast'),
    { type: 'compare', columns: ['Asked for', 'Tool', 'Two six-sided dice'], rows: [
      ['total', 'linearity', '7'],
      ['product', 'independence', String(3.5 ** 2)],
      ['larger face', 'P(max ≤ k) = (k/m)²', show(Emax(6))],
      ['smaller face', 'm + 1 − E[max]', show(Emin(6))],
      ['|difference|', '2(m − d) cells per d', show(Eabs(6))],
    ] },
    { type: 'variation', base: 'Base: two fair six-sided dice, expected total 7.', rows: [
      { change: 'Total becomes product', effect: `${3.5 ** 2}: independent means multiply.` },
      { change: 'Total becomes the larger face', effect: `${show(Emax(6))}: above 3.5, because the maximum leans high.` },
      { fusion: true, change: 'Total becomes the larger face AND the dice become 8-sided', effect: `${show(Emax(8))}: the max formula (m + 1)(4m − 1)/(6m) with m = 8. More faces raise the level; taking the max tilts it upward.` },
      { change: 'Total becomes |difference|', effect: `${show(Eabs(6))} by (m² − 1)/(3m).` },
      { same: true, change: 'The dice are thrown one after the other instead of together', effect: 'No change: timing does not change the 36 equally likely outcomes, so the expected total is still 7.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: with an odd m, the reroll average (m + 1)/2 is a face; keeping it or rerolling it gives the same value, so either choice is right. With one die, max = min = the die. E[product] with a repeated die (X × X) is not ((m + 1)/2)².' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'Fair 5-sided die, one reroll allowed. Is it right to keep a first roll of 3?', right: 'Keeping or rerolling 3 gives the same value', wrong: [['No: always reroll a 3, it is below average', 'the reroll is worth exactly 3, so nothing is gained'], ['Yes, and keep a 2 as well, since both are low', '2 is below the reroll value 3']], explain: 'The reroll averages (1 + 5)/2 = 3, a tie with the face you hold.' }),
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same tools elsewhere: linearity and indicators power the coupon collector and "expected number of" questions in Beat the Odds; P(max ≤ k) = (k/m)^{n} is the same move for "highest of n dice" probabilities; the keep-or-reroll threshold is the first step of every optimal stopping game.' },
    { type: 'transfer',
      near: { make: (rng) => { const m = rng.pick([5, 7, 9, 12]), q = Emax(m); return ivq(`Two fair ${m}-sided dice. Type the best interval for the expected larger number.`, q.toNumber(), `(m + 1)(4m − 1)/(6m) = ${show(q)}. Type ${entry(q)}.`); } },
      far: { type: 'number', q: 'Two traders each quote a whole-number price, equally likely from 1 to 10, independently. The desk takes the higher quote. Expected price taken? (2 decimal places)', answer: round(Emax(10).toNumber(), 2), tolerance: 0.006, explain: `The same maximum of two uniform choices: (11 × 39)/60 = ${show(Emax(10))}.` },
      principle: mc({ q: 'Which idea carried over from dice to quotes?', right: 'P(max ≤ k) = (k/m)², then average', wrong: [['Linearity: add the two means', 'that gives the total of the quotes'], ['Independence: multiply the means', 'that gives the product of the quotes'], ['Keep whatever beats the reroll value', 'no choice to keep or reroll was made']], explain: 'Both ask for the expected larger of two independent uniform values: the maximum distribution, then its average.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'expected-dice', section: 'iv', count: 3 },
  ],
};
