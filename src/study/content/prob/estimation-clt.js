// Probability foundations 12: fast estimation. Variance and SD, the SD of a sum, the CLT
// shortcut, sum versus average, the half-integer cut, sanity bounds.
import { sec, dec, round, pct, mc, nCr, Phi } from './sample-spaces.js';

const FACES = [1, 2, 3, 4, 5, 6];
const dieVar = FACES.reduce((a, f) => a + (f - 3.5) ** 2, 0) / 6;
const dieSD = Math.sqrt(dieVar);
// Binomial upper tail P(X >= k), X ~ Bin(n, 1/2), by the pmf ratio (no huge factorials).
const tailHalf = (n, k) => { let pm = 0.5 ** n, s = 0; for (let j = 0; j <= n; j++) { if (j >= k) s += pm; pm = (pm * (n - j)) / (j + 1); } return s; };
const RULE = { 1: 0.16, 2: 0.025 };
const rulePct = (z) => (z === 1 ? '16%' : '2.5%');

const ch = { n: 100, k: 60 };
ch.exact = tailHalf(ch.n, ch.k); ch.sd = Math.sqrt(ch.n) / 2; ch.zc = (ch.k - 0.5 - ch.n / 2) / ch.sd; ch.cc = 1 - Phi(ch.zc);
const sixty = [10, 100, 1000].map((n) => ({ n, p: tailHalf(n, Math.ceil(0.6 * n)) }));
const four = (() => { let d = [1]; for (let i = 0; i < 4; i++) { const nd = Array(d.length + 6).fill(0); d.forEach((c, s) => { for (let f = 1; f <= 6; f++) nd[s + f] += c; }); d = nd; } return d; })();
const E = { n: 100, cut: 385 }; E.mean = 3.5 * E.n; E.sd = dieSD * Math.sqrt(E.n); E.z = (E.cut - E.mean) / E.sd;

const sdSumQ = (rng) => {
  if (rng.chance(0.5)) { const n = rng.pick([100, 400, 900, 1600, 2500, 10000]); return { type: 'number', q: `A fair coin is tossed ${n} times. What is the SD of the number of heads?`, answer: Math.sqrt(n) / 2, hints: ['One toss (1 for heads): SD 1/2.', 'SD of a sum of n: σ√n.'], explain: `1/2 × √${n} = ${Math.sqrt(n) / 2}.` }; }
  const n = rng.pick([25, 36, 64, 100, 400]); return { type: 'number', q: `${n} fair dice are thrown. What is the SD of their total? (1 decimal place)`, answer: round(dieSD * Math.sqrt(n), 1), tolerance: 0.051, hints: [`One die: SD ≈ ${dec(dieSD, 2)}.`, `Multiply by √${n} = ${Math.sqrt(n)}.`], explain: `${dec(dieSD, 3)} × √${n} = ${dec(dieSD, 3)} × ${Math.sqrt(n)} ≈ ${dec(dieSD * Math.sqrt(n), 1)}.` };
};
const cltCoinQ = (rng) => {
  const n = rng.pick([100, 400, 900, 1600]), sd = Math.sqrt(n) / 2, z = rng.pick([1, 2]), cut = n / 2 + z * sd;
  return mc({ q: `A fair coin is tossed ${n} times. About what is P(more than ${cut} heads)?`, right: rulePct(z),
    wrong: [[z === 1 ? '32%' : '5%', 'counted both tails'], [z === 1 ? '34%' : '47.5%', 'gave the area between the mean and the cut'], [z === 1 ? '2.5%' : '16%', `misread the distance: ${cut} is ${z} SD above the mean`], ['50%', 'forgot the spread entirely']],
    explain: `Mean ${n / 2}, SD √${n}/2 = ${sd}. ${cut} is ${z} SD above the mean, so about ${rulePct(z)} lies beyond it.` }, rng);
};
const avgQ = (rng) => {
  const n = rng.pick([25, 100, 400]), r = Math.sqrt(n);
  return mc({ q: `The average of ${n} fair dice is computed. What is its SD, roughly?`, right: dec(dieSD / r, 3),
    wrong: [[dec(dieSD * r, 1), 'that is the SD of the total, not the average'], [dec(dieSD, 2), 'that is one die'], [dec(dieVar / n, 4), 'that is the variance of the average, not its SD']],
    explain: `σ/√n = ${dec(dieSD, 3)}/${r} ≈ ${dec(dieSD / r, 3)}. Averages concentrate.` }, rng);
};
const diceTailQ = (rng) => {
  const n = rng.pick([100, 400, 900]), z = rng.pick([1, 2]), sd = dieSD * Math.sqrt(n), cut = Math.round(3.5 * n + z * sd);
  return mc({ q: `${n} fair dice are thrown. About what is P(the total is above ${cut})?`, right: rulePct(z),
    wrong: [[z === 1 ? '32%' : '5%', 'counted both tails'], ['50%', 'forgot the spread'], [z === 1 ? '2.5%' : '16%', 'misjudged how many SDs away the cut is'], ['0.15%', 'used the SDs added up instead of σ√n']],
    hints: [`Mean ${3.5 * n}; SD ≈ ${dec(dieSD, 2)} × √${n}.`, `The cut is about ${z} SD above the mean.`],
    explain: `Mean ${3.5 * n}, SD ≈ ${dec(sd, 1)}. ${cut} is about ${z} SD above: roughly ${rulePct(z)}.` }, rng);
};

export default {
  id: 'prob/estimation-clt',
  book: 'prob',
  kind: 'foundation',
  title: 'Fast estimation and the CLT',
  summary: 'A sum of n independent pieces: mean nμ, SD σ√n, shape ≈ normal. Then z and 68-95-99.7.',
  prerequisites: ['prob/expectation-linearity', 'prob/independence', 'prob/poisson-normal'],
  objectives: [
    'Compute the variance and SD of one die, one coin or one 0/1 trial',
    'Compute the mean and SD of a sum (nμ, σ√n) and of an average (μ, σ/√n)',
    'Estimate tail probabilities of big sums with z and the 68-95-99.7 rule in under a minute',
    'Use the half-integer cut for counts and sanity-check an estimate before answering',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: ${ch.n} fair coins are tossed. What is P(at least ${ch.k} heads)? Two approaches, then an answer.`, answer: `about ${dec(ch.exact, 3)} (exact ${dec(ch.exact, 4)})`, explain: `Summing ${ch.n - ch.k + 1} binomial terms is hopeless by hand. Estimate instead: mean ${ch.n / 2}, SD √${ch.n}/2 = ${ch.sd}, so ${ch.k} is about 2 SD above the mean: roughly 2.5%. Cutting at ${ch.k - 0.5} (the edge of the bar for ${ch.k}) gives z = ${dec(ch.zc, 2)} and ${dec(ch.cc, 4)}, close to the exact ${dec(ch.exact, 4)}.`,
      attempts: [
        { id: 'sumTerms', label: 'Added the binomial terms', approach: `Started adding C(${ch.n}, k)/2^{${ch.n}} for k = ${ch.k} to ${ch.n}.`, breaksAt: `${ch.n - ch.k + 1} terms with huge numbers: out of reach in a minute. Estimate with the mean and SD instead.` },
        { id: 'sdAdd', label: 'SD grows like n', approach: `Took the SD of ${ch.n} coins as ${ch.n} × 1/2 = ${ch.n / 2}.`, breaksAt: `Variances add, not SDs: the SD is 1/2 × √${ch.n} = ${ch.sd}.` },
      ] },
    { type: 'text', text: 'Trigger: **many** independent pieces added up (100 coins, 50 dice, a year of daily profits) and a question about the total or the average, often with "approximately" or "closest to". Exact counting is out of reach; the normal curve is not.' },
    { type: 'check', scope: 'spotting a CLT question', questions: [
      mc({ q: 'Which question wants the CLT shortcut?', right: 'P(the total of 100 dice is above 380)', at: 3,
        wrong: [['P(the total of 2 dice is 7)', 'two dice: count the 36 cells exactly'], ['P(at least one six in 4 dice)', 'complement: 1 − (5/6)^{4}'], ['the expected total of 100 dice', 'linearity alone gives 350; no curve needed']],
        explain: 'A tail probability for a sum of many independent pieces: mean, SD, z.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Intervals and Beat the Odds both ask for quick estimates of big sums, and the options are far enough apart that a good estimate wins. The CLT turns "impossible to count" into two numbers and a z-score.' },

    sec('anchor'),
    { type: 'text', text: 'From the expectation lesson: E[sum] = n × E[one piece]. From the last lesson: the normal curve and z-scores. The CLT joins them with **one** new ingredient: how wide the sum is, its SD.' },
    { type: 'check', scope: 'the mean of a sum', questions: [
      { make: (rng) => { const n = rng.pick([40, 100, 250, 1000]); return { type: 'number', q: `${n} fair dice are thrown. What is the expected total?`, answer: 3.5 * n, explain: `${n} × 3.5 = ${3.5 * n}.` }; } },
    ] },

    sec('variance', 'Spread of one piece: variance and SD'),
    { type: 'text', text: 'The **variance** is the average squared distance from the mean: Var(X) = E[(X − μ)^{2}]. Squaring stops positive and negative distances cancelling. The **SD** is its square root, back in the original units.' },
    { type: 'formula', text: 'Var(X) = E[(X − μ)^{2}]        SD = √Var' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['face', 'distance from 3.5', 'squared'], rows: [...FACES.map((f) => [String(f), dec(f - 3.5, 1), dec((f - 3.5) ** 2, 2)]), ['average', '0', dec(dieVar, 3)]] }, caption: `One die: the squared distances add to ${dec(dieVar * 6, 1)}, so they average ${dec(dieVar * 6, 1)}/6 = ${Math.round(dieVar * 12)}/12 ≈ ${dec(dieVar, 2)}, and SD ≈ ${dec(dieSD, 2)}.` },
    { type: 'check', scope: 'variance and SD of a die', questions: [
      { type: 'number', q: 'One fair die: what is its SD, to 2 decimal places?', answer: round(dieSD, 2), tolerance: 0.006, hints: ['Average the squared distances from 3.5.', `They average ${dec(dieVar, 3)}; take the square root.`], explain: `√(35/12) ≈ ${dec(dieSD, 3)}.` },
      mc({ q: 'A die face is 1. What does it add to the variance sum, before dividing by 6?', right: String((1 - 3.5) ** 2), at: 2,
        wrong: [['−2.5', 'used the signed distance: squared distances are never negative'], [String(Math.abs(1 - 3.5)), 'forgot to square the distance'], ['1', 'squared the face, not its distance from the mean']],
        explain: '(1 − 3.5)^{2} = 6.25.' }),
    ] },
    { type: 'text', text: 'A 0/1 piece (1 with chance p): distance 1 − p with chance p and p with chance 1 − p, so Var = p(1 − p)^{2} + (1 − p)p^{2} = p(1 − p). A fair coin counted as 1 for heads has Var 1/4 and SD 1/2.' },
    { type: 'check', scope: 'variance and SD of one piece', questions: [
      { make: (rng) => { const p = rng.pick([0.1, 0.2, 0.3, 0.5]); return { type: 'number', q: `A 0/1 piece equals 1 with chance ${p}. What is its variance?`, answer: round(p * (1 - p), 4), tolerance: 1e-9, hints: ['p(1 − p).'], explain: `${p} × ${dec(1 - p, 1)} = ${dec(p * (1 - p), 4)}.` }; } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'Why variances add for independent pieces, and SDs do not.' },
    { type: 'steps', steps: [
      { say: 'Write each piece as its mean plus a deviation: X = μ_{X} + D_{X} and Y = μ_{Y} + D_{Y}, where each deviation averages 0.', why: 'Only the deviations create spread; the means only shift the centre.',
        checks: [{ make: (rng) => { const f = rng.int(1, 6); return { type: 'number', q: `A die shows ${f}. What is its deviation from the mean 3.5?`, answer: f - 3.5, tolerance: 1e-9, explain: `${f} − 3.5 = ${f < 3.5 ? `−${3.5 - f}` : f - 3.5}.` }; } }] },
      { say: 'The sum deviates by D_{X} + D_{Y}, so Var(X + Y) = E[(D_{X} + D_{Y})^{2}] = E[D_{X}^{2}] + E[D_{Y}^{2}] + 2 E[D_{X} D_{Y}].', why: 'Expand the square, then use linearity (expectation lesson).',
        checks: [mc({ q: 'Which term decides whether Var(X + Y) equals Var(X) + Var(Y)?', right: '2 E[D_{X} D_{Y}]', at: 2,
          wrong: [['E[D_{X}^{2}]', 'that is Var(X) itself'], ['E[D_{Y}^{2}]', 'that is Var(Y) itself'], ['none: the square of a sum is the sum of the squares', '(a + b)^{2} has the cross term 2ab']],
          explain: 'The first two terms are the variances; only the cross term can break the sum.' })] },
      { answers: 'sdAdd', say: 'For independent pieces the cross term averages 0: whatever D_{X} is, D_{Y} still averages 0. So Var(X + Y) = Var(X) + Var(Y).', why: 'Independence means knowing D_{X} does not change D_{Y}, whose average is 0.',
        checks: [{ make: (rng) => { const [a, b, c] = rng.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]); return mc({ q: `X and Y are independent with SDs ${a} and ${b}. What is the SD of X + Y?`, right: String(c),
          wrong: [[String(a + b), 'added the SDs: variances add, not SDs'], [String(a * a + b * b), 'stopped at the variance'], [String(Math.abs(b - a)), 'subtracted the SDs']],
          explain: `Var = ${a}^{2} + ${b}^{2} = ${a * a + b * b}; SD = √${a * a + b * b} = ${c}.` }, rng); } }] },
      { answers: 'sumTerms', say: 'n independent copies: Var(S) = nσ^{2}, so SD(S) = σ√n.', why: 'Add the same variance n times, then take the square root.',
        checks: [{ make: sdSumQ }] },
    ] },
    { type: 'explain', prompt: 'Why does the SD of a sum of n independent pieces grow like √n and not like n?', model: 'Variances add because the cross terms of independent deviations average to zero: deviations partly cancel. n pieces give variance nσ^{2}, and the SD is its square root, σ√n. Only if every piece moved in the same direction would the SDs add to nσ.', points: ['Variances add for independent pieces; SDs do not', 'Independent deviations partly cancel (cross terms average 0)', 'SD = √(nσ^{2}) = σ√n'] },

    sec('clt', 'The CLT shortcut'),
    { type: 'text', text: 'The **Central Limit Theorem**: a sum of many independent pieces is approximately normal, whatever the single piece looks like. So S is roughly normal with mean nμ and SD σ√n: find z, then read 68-95-99.7.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Total of four dice', xLabel: 'total', yLabel: `ways (of ${6 ** 4})`, categories: four.map((_, s) => String(s)).slice(4), series: [{ name: 'ways', values: four.slice(4) }], valueLabels: false }, caption: `One die is flat; the total of four is already a bell, peaked at 14 (${four[14]} of ${6 ** 4} throws) with thin tails. More dice, closer to the normal curve.` },
    { type: 'formula', text: 'S = X_{1} + … + X_{n} ≈ normal with mean nμ and SD σ√n' },
    { type: 'check', scope: 'the CLT with coins', questions: [{ make: cltCoinQ }] },

    sec('average', 'Sum versus average'),
    { type: 'text', text: 'The average S/n has mean μ and SD σ√n / n = σ/√n. The sum spreads out as n grows; the average concentrates on μ. Mixing the two is the classic CLT error.' },
    { type: 'check', scope: 'sum or average', questions: [{ hinge: true, make: avgQ }] },

    sec('predict'),
    { type: 'predict', question: 'Is getting at least 60% heads more likely with 10 tosses or with 100 tosses?', answer: `With 10: ${dec(sixty[0].p, 3)} against ${dec(sixty[1].p, 3)} for 100 tosses.`, explain: 'With 10 tosses, 60% is 6 heads, less than 1 SD above the mean. With 100 tosses it is 60, 2 SD above. The average concentrates as n grows.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'SDs add.', fix: 'Variances add for independent pieces; the SD of the sum is σ√n.' },
      { belief: 'The average of n pieces has SD σ√n.', fix: 'That is the sum. The average has σ/√n.' },
      { belief: 'Divide by the variance in z.', fix: 'Divide by the SD.' },
      { belief: 'The CLT already works for two or three pieces.', fix: 'A few pieces are still far from normal: count exactly when n is small.' },
    ] },
    { type: 'erroneous', problem: `A candidate estimates P(the total of ${E.n} dice is above ${E.cut}). One step is wrong.`, steps: [
      `Mean = ${E.n} × 3.5 = ${E.mean}.`,
      `SD of one die ≈ ${dec(dieSD, 2)}, so the SD of the total ≈ ${E.n} × ${dec(dieSD, 2)} = ${dec(E.n * dieSD, 0)}.`,
      `z = ${E.cut - E.mean}/${dec(E.n * dieSD, 0)} ≈ ${dec((E.cut - E.mean) / (E.n * dieSD), 1)}.`,
      `P ≈ ${pct(1 - Phi((E.cut - E.mean) / (E.n * dieSD)), 0)}.`,
    ], errorStep: 1, explain: `The SD of a sum is σ√n, not σn: ${dec(dieSD, 2)} × √${E.n} ≈ ${dec(E.sd, 1)}. Then z ≈ ${dec(E.z, 2)} and P ≈ ${pct(1 - Phi(E.z), 0)}.` },
    { type: 'check', scope: 'SD of a sum in a tail estimate', questions: [{ make: diceTailQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Coin counts: SD = √n/2 (100 tosses → 5, 400 → 10, 10,000 → 50). Dice totals: SD ≈ ${dec(dieSD, 1)}√n. About 95% of the time a sum lands within 2 SD of its mean: use that as your sanity bracket.` },
    { type: 'callout', tone: 'speed', text: 'Whole-number counts: P(X ≥ 60) ≈ P(normal ≥ 59.5). Each count k is a bar from k − ½ to k + ½, so "at least 60" starts at the left edge of the bar for 60.' },
    { type: 'diagram', diagram: 'histogram', spec: { title: 'Heads in 16 tosses (middle bars)', xLabel: 'heads', yLabel: 'sequences', bins: [4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => ({ from: k - 0.5, to: k + 0.5, count: nCr(16, k) })) }, caption: 'Each whole count k is a bar from k − ½ to k + ½. "At least 10 heads" is the bars from 10 upward, which start at 9.5: that is where the normal curve should be cut.' },
    { type: 'check', scope: 'SD of a sum and the half-integer cut', questions: [
      { make: sdSumQ },
      mc({ q: 'Using the normal curve for P(at least 60 heads in 100 tosses), where should you cut?', right: '59.5', at: 1, wrong: [['60', 'cuts the bar for 60 in half, losing half of it'], ['60.5', 'drops the whole bar for 60'], ['50', 'that is the mean, not the cut']], explain: 'The bar for 60 spans 59.5 to 60.5; "at least 60" includes all of it.' }),
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Sum of n independent copies → mean nμ, SD σ√n (average: μ and σ/√n), shape ≈ normal; convert with z and read 68-95-99.7. For counts, cut at the half-integer.' },

    sec('contrast'),
    { type: 'compare', columns: ['', 'Sum S', 'Average S/n'], rows: [
      ['Mean', 'nμ', 'μ'],
      ['SD', 'σ√n', 'σ/√n'],
      ['100 dice', `mean 350, SD ≈ ${dec(dieSD * 10, 1)}`, `mean 3.5, SD ≈ ${dec(dieSD / 10, 3)}`],
      ['As n grows', 'spreads out', 'concentrates on μ'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: n = 1 is just the piece (a single die is flat, not a bell). Skewed pieces, such as rare events, need a larger n before the bell appears. With small n, count exactly or at least use the half-integer cut.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: CLT estimates in Beat the Odds, Fermi and probability estimates in Intervals, large-number rows in Likelihood List (bigger samples stay closer to the mean), and the P&L of many independent trades.' },
    { type: 'check', scope: 'sum versus average as n grows', questions: [
      { type: 'order', q: 'Rank from most likely to least likely: at least 60% heads in 10, in 100 and in 1,000 tosses.', items: sixty.map((x) => `${x.n} tosses`), answer: sixty.map((x, i) => [i, x.p]).sort((a, b) => b[1] - a[1]).map(([i]) => i), explain: `${sixty.map((x) => `${x.n}: ${x.p < 1e-4 ? 'below 0.0001' : dec(x.p, 4)}`).join('; ')}. The average concentrates, so a fixed 60% gets harder to reach.` },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: sdSumQ }, { make: cltCoinQ }, { make: avgQ }] },
  ],
};
