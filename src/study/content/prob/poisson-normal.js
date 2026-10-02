// Probability foundations 10: Poisson as the limit of rare independent events; the normal
// curve, the 68-95-99.7 rule and z-scores.
import { sec, frac, dec, round, pct, mc, fact, Phi } from './sample-spaces.js';

const pois = (lam, k) => (Math.exp(-lam) * lam ** k) / fact(k);
const within = (z) => Phi(z) - Phi(-z);
// The 68-95-99.7 rule as candidates use it; checked against the exact normal areas.
const W = { 1: 0.68, 2: 0.95, 3: 0.997 };
for (const z of [1, 2, 3]) if (Math.abs(W[z] - within(z)) > 0.005) throw new Error(`68-95-99.7 rule off at ${z}`);
const R = { 1: pct(W[1], 0), 2: pct(W[2], 0), 3: pct(W[3], 1) };
const tail = { 1: (1 - W[1]) / 2, 2: (1 - W[2]) / 2, 3: (1 - W[3]) / 2 };
const T = { 1: pct(tail[1], 0), 2: pct(tail[2], 1), 3: pct(tail[3], 2) };
const sgn = (x) => (x < 0 ? `−${-x}` : String(x));

const poisQ = (rng) => {
  const lam = rng.pick([0.5, 1, 1.5, 2, 3, 4]), k = rng.int(0, 2), ans = round(pois(lam, k), 3);
  return { type: 'number', q: `Events arrive at random at an average rate of ${lam} per hour. What is P(exactly ${k} in the next hour)? (3 decimal places)`, answer: ans, tolerance: 0.0011,
    hints: ['Poisson: e^{−λ} λ^{k} / k!.', `λ = ${lam}, e^{−${lam}} ≈ ${dec(Math.exp(-lam), 4)}.`],
    explain: `e^{−${lam}} × ${lam}^{${k}} / ${k}! = ${dec(Math.exp(-lam), 4)} × ${dec(lam ** k, 3)} / ${fact(k)} ≈ ${dec(pois(lam, k), 4)}.` };
};
const THINGS = [['Heights', 'cm', 175, 7], ['Exam scores', 'points', 60, 10], ['Daily returns', 'basis points', 0, 50], ['Delivery times', 'minutes', 30, 5]];
const normalTailQ = (rng) => {
  const [what, unit, mu, sd] = rng.pick(THINGS), z = rng.pick([1, 2]), up = rng.chance(0.5), x = up ? mu + z * sd : mu - z * sd;
  return mc({ q: `${what} are roughly normal with mean ${mu} ${unit} and SD ${sd} ${unit}. About what share lies ${up ? 'above' : 'below'} ${sgn(x)} ${unit}?`, right: T[z],
    wrong: [[pct(1 - W[z], 0), 'counted both tails'], [pct(W[z] / 2, 0), 'gave the area between the mean and the cut-off'], [pct(W[z], 0), `gave the area within ${z} SD`]],
    explain: `${sgn(x)} is ${z} SD ${up ? 'above' : 'below'} the mean. ${R[z]} lies within ${z} SD, so each tail holds about (100% − ${R[z]})/2 = ${T[z]}.` }, rng);
};
const zQ = (rng) => {
  const [what, unit, mu, sd] = rng.pick(THINGS), z = rng.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]), x = mu + z * sd;
  return { type: 'number', q: `${what}: mean ${mu} ${unit}, SD ${sd} ${unit}. What is the z-score of ${sgn(x)} ${unit}?`, answer: z, tolerance: 1e-9,
    hints: ['z = (x − μ) / σ.'], explain: `(${sgn(x)} − ${mu}) / ${sd} = ${sgn(z)}.` };
};

const ch = { lam: 3 };
const conv = [10, 100, 1000].map((n) => [String(n), dec((1 - ch.lam / n) ** n, 4)]);
const zs = [0, 0.5, 1, 1.5, 2, 2.5, 3];
const bell = Array.from({ length: 81 }, (_, i) => { const x = -4 + i * 0.1; return [round(x, 1), Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)]; });

export default {
  id: 'prob/poisson-normal',
  book: 'prob',
  kind: 'foundation',
  title: 'Poisson and the normal curve',
  summary: 'Rare events at a rate λ: P(k) = e^{−λ}λ^{k}/k!. Normal: measure in SDs, then 68-95-99.7.',
  prerequisites: ['prob/discrete-distributions'],
  objectives: [
    'Model counts of rare events with the Poisson and compute P(0) = e^{−λ} and P(k)',
    'Explain the Poisson as a binomial with many tiny trials and mean λ',
    'Read a normal curve with the 68-95-99.7 rule, one tail or both',
    'Convert a value to a z-score and turn it into a probability',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: large orders arrive at random, ${ch.lam} per hour on average. What is P(no large order in the next hour)? Two approaches, then an answer.`, answer: `e^{−${ch.lam}} ≈ ${dec(Math.exp(-ch.lam), 3)}`, explain: `Chop the hour into many tiny slots, each holding an order with a tiny chance: a binomial with huge n and tiny p. P(none) = (1 − ${ch.lam}/n)^{n}, which settles at e^{−${ch.lam}} as n grows. If you said 0 or a negative number from 1 − ${ch.lam}, the linear guess broke down.`,
      attempts: [
        { id: 'linear', label: 'One minus the rate', approach: `Took P(none) = 1 − ${ch.lam} = −${ch.lam - 1}.`, breaksAt: 'A probability cannot be negative: the empty slots multiply, (1 − λ/n)^{n}; they do not subtract all at once.' },
        { id: 'certain', label: 'An order is certain', approach: `With ${ch.lam} expected per hour, said at least one must come, so P(none) = 0.`, breaksAt: `An average of ${ch.lam} still leaves quiet hours: every slot is almost surely empty, and about ${pct(Math.exp(-ch.lam), 0)} of hours have no order at all.` },
      ] },
    { type: 'text', text: 'Two shapes. **Poisson**: a count of rare events arriving at random at a known average rate λ ("3 per hour", "0.5 typos per page"), with no fixed number of trials. **Normal**: a measurement or a big sum, described by its mean and standard deviation, shaped like a bell.' },
    { type: 'check', scope: 'Poisson or normal', questions: [
      mc({ q: 'Which is best modelled as Poisson?', right: 'typos per page, at 0.5 per page on average', at: 2,
        wrong: [['heads in 10 tosses of a fair coin', 'a fixed number of trials: binomial'], ['sixes in 600 rolls, 100 on average', 'a fixed number of trials (600): binomial, whatever its average'], ['the height of a random adult, in cm', 'a measurement: normal'], ['the roll on which the first six appears', 'a wait for the first success: geometric']],
        explain: 'Rare events, a known average rate, no fixed number of trials: Poisson.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Order arrivals, defaults and typos are Poisson; returns, errors and big sums are normal. Likelihood List shows density curves, Intervals asks for percentiles, and Beat the Odds estimates big sums with the normal curve. Two shapes, dozens of questions.' },

    sec('anchor'),
    { type: 'text', text: 'You know the binomial: n independent trials, chance p, mean np. The Poisson is the binomial with **one change**: n is huge and p is tiny, with np = λ held fixed. You know the rate, not n and p.' },
    { type: 'diagram', diagram: 'bar', spec: { title: `Poisson, λ = ${ch.lam}`, xLabel: 'number of events k', yLabel: 'probability', categories: Array.from({ length: 10 }, (_, k) => String(k)), series: [{ name: 'P(k)', values: Array.from({ length: 10 }, (_, k) => round(pois(ch.lam, k), 3)) }], valueLabels: true }, caption: `Where this lesson is heading: the Poisson chances for λ = ${ch.lam}. The counts 2 and 3 are equally likely (${dec(pois(3, 2), 3)} each); zero events happens ${dec(pois(3, 0), 3)} of the time, and the tail thins fast.` },
    { type: 'check', scope: 'binomial with tiny p', questions: [
      { make: (rng) => { const n = rng.pick([1000, 2000, 5000]), lam = rng.pick([2, 3, 4, 5]); return { type: 'number', q: `A binomial has n = ${n} trials and p = ${lam}/${n}. What is its mean?`, answer: lam, explain: `np = ${n} × ${lam}/${n} = ${lam}.` }; } },
    ] },

    sec('derivation'),
    { type: 'text', text: `The challenge, one move at a time: rate λ = ${ch.lam} per hour.` },
    { type: 'steps', steps: [
      { answers: 'certain', say: 'Split the hour into n tiny slots. Each slot holds an order with chance λ/n, independently of the others, and never two.', why: 'Many tiny independent trials: a binomial with n trials and p = λ/n, whose mean is np = λ.',
        checks: [mc({ q: 'Rate 3 per hour, split into 3,600 one-second slots. What is the chance of an order in one slot?', right: frac(3, 3600), at: 1,
          wrong: [['3', 'that is the rate per hour, not a chance'], [frac(1, 3600), 'forgot the rate'], [frac(3, 60), 'split into minutes, not seconds']],
          explain: 'λ/n = 3/3600 = 1/1200.' })] },
      { answers: 'linear', say: 'P(no order) = (1 − λ/n)^{n}. As n grows this settles at e^{−λ}.', why: 'Every slot must be empty (independence). The limit of (1 − λ/n)^{n} is e^{−λ}; the table shows it settling.',
        checks: [mc({ q: 'Which is closest to (1 − 2/1000)^{1000}?', right: dec((1 - 2 / 1000) ** 1000, 3), at: 0,
          wrong: [[dec(1 - 2 / 1000, 3), 'one slot only'], ['0.5', 'a guess: the product of many numbers just below 1 keeps shrinking'], [dec(2 / 1000, 3), 'that is one slot having an order']],
          explain: `It settles at e^{−2} ≈ ${dec(Math.exp(-2), 3)}.` })] },
      { say: 'P(k orders) = C(n, k)(λ/n)^{k}(1 − λ/n)^{n − k}, which settles at e^{−λ} λ^{k} / k!.', why: 'For large n, C(n, k)/n^{k} tends to 1/k! and (1 − λ/n)^{n − k} tends to e^{−λ}.',
        checks: [{ make: poisQ }] },
      { say: `The mean stays λ: it was np = λ for every n. A longer stretch just scales the rate: 2 hours at ${ch.lam} per hour is λ = ${2 * ch.lam}.`, why: 'The binomial mean did not depend on how finely the hour was chopped.',
        checks: [{ make: (rng) => { const r = rng.pick([0.25, 0.5, 2]), pages = rng.pick([10, 12, 20]); return { type: 'number', q: `Typos occur at ${r} per page on average. Expected number of typos in a ${pages}-page report?`, answer: r * pages, explain: `Rates add over pages: ${r} × ${pages} = ${r * pages}.` }; } }] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['slots n', `(1 − ${ch.lam}/n)^n`], rows: [...conv, ['limit', `e^−${ch.lam} = ${dec(Math.exp(-ch.lam), 4)}`]] }, caption: `P(no order) for finer and finer slots: it settles at e^{−${ch.lam}} ≈ ${dec(Math.exp(-ch.lam), 3)}.` },
    { type: 'check', scope: 'the limit table', questions: [
      mc({ q: `Rate ${ch.lam} per hour. Using the table, P(no order in the hour) is closest to:`, right: dec(Math.exp(-ch.lam), 2), at: 1,
        wrong: [[dec((1 - ch.lam / 10) ** 10, 2), 'stopped at n = 10, before the value settles'], [dec(1 - Math.exp(-ch.lam), 2), 'that is P(at least one order)']],
        explain: `The rows settle at e^{−${ch.lam}} ≈ ${dec(Math.exp(-ch.lam), 3)}, about ${dec(Math.exp(-ch.lam), 2)}.` }),
    ] },
    { type: 'explain', prompt: 'Why does the Poisson appear whenever you only know an average rate of rare events?', model: 'Chop time into tiny slots; each holds an event with a tiny, equal chance, independently. That is a binomial with huge n and tiny p whose mean np is the rate λ. As the slots shrink, the binomial settles into e^{−λ}λ^{k}/k!, which depends only on λ.', points: ['Tiny independent slots make a binomial', 'The mean np equals the rate λ, whatever n is', 'In the limit only λ remains: e^{−λ}λ^{k}/k!'] },

    sec('normal', 'The normal curve and 68-95-99.7'),
    { type: 'text', text: 'The normal curve is a bell fixed by two numbers: its centre μ (the mean) and its width σ (the **standard deviation**, the typical distance of a value from the mean). Measure distance from the centre in units of σ and every normal curve looks the same.' },
    { type: 'diagram', diagram: 'density', spec: { title: 'Standard normal', xLabel: 'distance from the mean, in SDs', curves: [{ name: 'density', points: bell }], shade: [{ from: -1, to: 1 }], xTicks: [-3, -2, -1, 0, 1, 2, 3] }, caption: `Within 1 SD of the mean (shaded): ${R[1]} of the area. Within 2 SD: ${R[2]}. Within 3 SD: ${R[3]}. Each tail beyond 1 SD holds about ${T[1]}.` },
    { type: 'formula', text: `within 1σ: ${R[1]}      within 2σ: ${R[2]}      within 3σ: ${R[3]}` },
    { type: 'check', scope: 'the 68-95-99.7 rule', questions: [{ make: normalTailQ }] },

    sec('z', 'z-scores'),
    { type: 'text', text: 'To use the rule on any normal, convert the value to a **z-score**: how many SDs it sits from the mean. Then read the standard curve.' },
    { type: 'formula', text: 'z = (x − μ) / σ' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['z', 'P(Z ≤ z)', 'P(Z > z)'], rows: zs.map((z) => [String(z), dec(Phi(z), 3), dec(1 - Phi(z), 3)]) }, caption: 'The standard normal table in seven rows. Negative z: use symmetry, P(Z ≤ −z) = P(Z > z).' },
    { type: 'check', scope: 'z = (x − μ)/σ', questions: [{ make: zQ }] },

    sec('predict'),
    { type: 'predict', question: 'The order rate doubles from 2 to 4 per hour. Does P(no order in an hour) halve?', answer: `No, it squares: e^{−2} ≈ ${dec(Math.exp(-2), 3)} becomes e^{−4} ≈ ${dec(Math.exp(-4), 3)}, about ${Math.round(Math.exp(2))} times smaller.`, explain: 'e^{−4} = (e^{−2})^{2}: two quiet hours in a row at the old rate.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'P(no event) = 1 − λ.', fix: 'That is only the first step of e^{−λ} for tiny λ. At λ = 3 it would be negative.' },
      { belief: 'The Poisson formula is e^{−λ}λ^{k}.', fix: 'Divide by k!: the orders of the k events do not matter.' },
      { belief: `${R[1]} lies above μ + σ, or ${R[1]} is one-sided.`, fix: `${R[1]} lies within one SD on both sides; one tail beyond 1 SD is about ${T[1]}.` },
      { belief: 'Divide by the variance to get z.', fix: 'Divide by σ, the square root of the variance.' },
    ] },
    { type: 'erroneous', problem: 'X is normal with mean 100 and variance 25. A candidate estimates P(X > 110). One step is wrong.', steps: [
      'The mean is 100.',
      'The standard deviation is 25.',
      `z = (110 − 100)/25 = ${10 / 25}.`,
      `P(X > 110) ≈ P(Z > ${10 / 25}) ≈ ${dec(1 - Phi(10 / 25), 2)}.`,
    ], errorStep: 1, explain: `25 is the variance; the SD is √25 = 5. Then z = 10/5 = 2 and P(X > 110) ≈ ${T[2]}.` },
    { type: 'check', scope: 'one tail or two', questions: [
      mc({ q: 'X is normal with mean μ and SD σ. About what is P(X > μ + σ)?', right: T[1], at: 0,
        wrong: [[pct(1 - W[1], 0), 'both tails: above and below'], [pct(W[1] / 2, 0), 'the area between μ and μ + σ'], [pct(W[1], 0), 'the area within one SD']],
        explain: `(100% − ${R[1]})/2 = ${T[1]}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Anchors: e^{−1} ≈ ${dec(Math.exp(-1), 2)}, e^{−2} ≈ ${dec(Math.exp(-2), 3)}, e^{−3} ≈ ${dec(Math.exp(-3), 3)}. For small λ, P(0) ≈ 1 − λ.` },
    { type: 'check', scope: 'e^{−λ} anchors', questions: [
      { make: (rng) => { const lam = rng.pick([1, 2, 3]); return mc({ q: `Events arrive at random at ${lam} per minute on average. Which is closest to P(none in the next minute)?`, right: dec(Math.exp(-lam), 3),
        wrong: [[dec(1 - Math.exp(-lam), 3), 'that is P(at least one)'], [dec(lam * Math.exp(-lam), 3), 'that is P(exactly one)'], [dec(1 / (lam + 1), 3), 'a guess from the rate, not e^{−λ}']],
        explain: `e^{−${lam}} ≈ ${dec(Math.exp(-lam), 3)}.` }, rng); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Normal one-sided tails: beyond 1 SD about ${T[1]}, beyond 2 SD about ${T[2]}, beyond 3 SD about ${T[3]}.` },
    { type: 'check', scope: 'one-sided normal tails', questions: [
      mc({ q: 'A quantity is roughly normal. About what share lies more than 2 SD above the mean?', right: T[2], at: 2,
        wrong: [[pct(1 - W[2], 0), 'counted both tails'], [T[1], 'used the 1 SD tail'], [T[3], 'used the 3 SD tail']],
        explain: `Within 2 SD lies ${R[2]}, so one tail holds (100% − ${R[2]})/2 ≈ ${T[2]}.` }),
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Rare events at a known rate λ → Poisson: P(0) = e^{−λ}, P(k) = e^{−λ}λ^{k}/k!, mean λ. Normal → z = (x − μ)/σ, then 68-95-99.7 (one tail: 16%, 2.5%, 0.15%).' },

    sec('contrast'),
    { type: 'compare', columns: ['', 'Binomial', 'Poisson', 'Normal'], rows: [
      ['Values', '0, 1, …, n', '0, 1, 2, … (no upper limit)', 'any real number'],
      ['Parameters', 'n and p', 'the rate λ', 'mean μ and SD σ'],
      ['Mean', 'np', 'λ', 'μ'],
      ['Use when', 'a fixed number of trials', 'rare events at a known rate', 'measurements and sums of many pieces'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: for small λ, P(0) = e^{−λ} ≈ 1 − λ. A normal variable takes any exact value with probability 0: only ranges have probability. The Poisson has no upper limit, but large counts become vanishingly rare.' },
    { type: 'check', scope: 'the contrast table and the edge cases', questions: [
      mc({ q: 'Defaults in a loan book arrive at random at 2 per month. Which model and mean for the number of defaults in 6 months?', right: 'Poisson, mean 12', at: 1,
        wrong: [['Poisson, mean 2', 'the rate is per month: over 6 months the mean is 6 × 2'], ['Normal, mean 12', 'a count of rare events at a rate is Poisson'], ['Binomial, mean 12', 'there is no fixed number of trials']],
        explain: 'Rare events at a rate: Poisson, with λ = 2 × 6 = 12.' }),
      { type: 'number', q: 'X is normal with mean μ. What is P(X = μ exactly)?', answer: 0, explain: 'A normal variable gives probability only to ranges. Any single exact value has probability 0.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: density-curve rows in Likelihood List, percentile and waiting-time questions in Intervals, and CLT estimates in Beat the Odds. The next lessons turn big sums into normal curves.' },
    { type: 'check', scope: 'normal tails in a Likelihood List row', questions: [
      { type: 'choice', q: 'Daily returns are roughly normal with mean 0% and SD 1%. Which is more likely tomorrow?', options: ['a return below −1%', 'a return above +2%', 'equally likely'], answer: 0, stable: true, traps: { 1: 'a 2 SD tail (about 2.5%) is far thinner than a 1 SD tail (about 16%)', 2: 'the two cut-offs sit at different distances from the mean' }, explain: `Below −1% is beyond 1 SD: about ${T[1]}. Above +2% is beyond 2 SD: about ${T[2]}.` },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: poisQ }, { make: normalTailQ }, { make: zQ }] },
  ],
};
