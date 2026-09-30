// Likelihood List family: small samples against large samples. The proportion of heads has mean 1/2
// and sd 0.5/√n, so extreme proportions fade with n, a band around 1/2 fills up, and exactly one half
// gets rarer (≈ √(2/(πn))). Binomial probabilities are computed exactly by dynamic programming here.
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const dist = (n) => { let d = [1]; for (let i = 0; i < n; i++) { const nx = Array(d.length + 1).fill(0); d.forEach((v, j) => { nx[j] += v / 2; nx[j + 1] += v / 2; }); d = nx; } return d; };
const range = (n, lo, hi) => dist(n).reduce((s, v, k) => s + (k >= lo && k <= hi ? v : 0), 0);
const atLeastPct = (n, f) => range(n, Math.ceil(f * n - 1e-9), n);
const morePct = (n, f) => range(n, Math.floor(f * n + 1e-9) + 1, n);
const half = (n) => range(n, n / 2, n / 2);
const within = (n, w) => range(n, Math.ceil((0.5 - w) * n - 1e-9), Math.floor((0.5 + w) * n + 1e-9));
const sd = (n) => 0.5 / Math.sqrt(n);
// One-sided normal tail beyond z (Simpson's rule), for the landmark numbers quoted in prose.
const tailZ = (z) => { const f = (t) => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI); const n = 2000, h = z / n; let s = f(0) + f(z); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * h); return 0.5 - (s * h) / 3; };
const T1 = dp(tailZ(1), 2), T2 = dp(tailZ(2), 3);
const NS = [10, 20, 50, 100];
const CH = [['(a) the 10-birth hospital records more than 60% boys', morePct(10, 0.6)], ['(b) the 50-birth hospital records more than 60% boys', morePct(50, 0.6)], ['(c) exactly 50% boys among 30 births', half(30)]].sort((a, b) => b[1] - a[1]);
const npdf = (m, s) => Array.from({ length: 201 }, (_, i) => { const x = i / 200; return [x, Number((Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))).toFixed(4))]; });

// Pool for the ranking checks.
const POOL = {
  ge: (r) => { const n = r.pick(NS), f = r.pick([0.6, 0.7]); return [`At least ${f * 100}% heads in ${n} flips.`, atLeastPct(n, f)]; },
  half: (r) => { const n = r.pick(NS); return [`Exactly 50% heads in ${n} flips.`, half(n)]; },
  within: (r) => { const n = r.pick(NS), w = r.pick([0.1, 0.05]); return [`Between ${Math.round((0.5 - w) * 100)}% and ${Math.round((0.5 + w) * 100)}% heads (inclusive) in ${n} flips.`, within(n, w)]; },
  hosp: (r) => { const n = r.pick([10, 15, 20, 45, 60]); return [`A hospital with ${n} births a day records more than 60% boys.`, morePct(n, 0.6)]; },
};

export default {
  id: 'll/large-numbers',
  book: 'll',
  kind: 'family',
  family: 'large-numbers',
  title: 'Small samples versus large samples',
  summary: 'The proportion has sd 0.5/√n: extremes are a small-sample thing, bands around 1/2 fill up, and exactly 1/2 gets rarer.',
  prerequisites: ['prob/discrete-distributions', 'prob/estimation-clt'],
  objectives: [
    'Give the sd of a proportion of fair flips, 0.5/√n, and the z-distance of any threshold',
    'Rank "at least f%" statements across sample sizes without computing tails',
    'Explain why "exactly 50%" falls with n while "between 40% and 60%" rises',
    'Solve the hospital problem and its variants in one line',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: boys and girls are equally likely. Rank: (a) a hospital with 10 births today records more than 60% boys, (b) a hospital with 50 births today records more than 60% boys, (c) exactly 50% of 30 births today are boys.', answer: CH.map(([t, p]) => `${t} ≈ ${dp(p)}`).join(' > '), explain: 'Most people call (a) and (b) equal: "60% is 60%". Sample size decides it. In 10 births one extra boy moves the proportion by 10 points; in 50 births by 2. Extreme proportions are common in small samples and rare in large ones. (c) needs one exact count, which is never very likely.' },
    { type: 'text', text: 'There is **no picture**: statements about the **proportion** of heads (or boys) in samples of **different sizes**: at least f% in n flips, exactly 50%, between two percentages, more than 60% boys in a small or a large hospital. The trap is to judge by the percentage alone.' },
    { type: 'text', text: 'Not this lesson: a fixed number of flips with patterns (coin strings) or a single binomial count. Here the point is comparing the same proportion across n, and the sample sizes are what the item is really about.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Which pair of statements does this lesson compare?', '"at least 70% heads in 10 flips" and "at least 70% heads in 100 flips"', [['"HH somewhere in 6 flips" and "HT somewhere in 6 flips"', 'patterns in one fixed string: coin strings'], ['"exactly 3 heads in 5 flips" and "exactly 2 heads in 5 flips"', 'same n, different counts: a single binomial'], ['"at least one six in 4 throws" and "at least one double six in 24"', 'at-least-one statements: dice triples']], 'Same proportion, different sample sizes.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'This is the hospital problem (Kahneman and Tversky): people ignore sample size and judge "more than 60% boys" as equally likely anywhere. Items rank proportions across sample sizes precisely to test that. One formula, sd = 0.5/√n, answers all of them, and three direction rules (extremes fall, bands rise, exact balance falls) settle most items before you compute anything.' },

    S('anchor'),
    { type: 'text', text: 'You know the binomial count: n fair flips give a head count with mean n/2 and sd √n/2. The one change: to compare different n, divide by n and look at the **proportion**. Its mean is 1/2 and its sd is (√n/2)/n = 0.5/√n. The count spreads out as n grows, but the proportion tightens: that one contrast is the whole family.' },
    { type: 'check', scope: 'sd of a proportion', questions: [
      { make: (rng) => { const n = rng.pick([4, 16, 25, 64, 100, 400]); return { type: 'number', q: `n = ${n} fair flips. sd of the proportion of heads? (3 decimals)`, answer: sd(n), tolerance: 0.0015, hints: ['0.5 / √n.'], explain: `0.5/√${n} = 0.5/${Math.sqrt(n)} = ${dp(sd(n))}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'The spread of the proportion against n. It falls fast at first and slowly later: quadrupling n halves it.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 100, label: 'sample size n' }, y: { min: 0, max: 0.5, label: 'sd of the proportion' }, curves: [{ label: '0.5/√n', points: Array.from({ length: 100 }, (_, i) => [i + 1, sd(i + 1)]) }], markers: [{ x: 10, y: sd(10), label: `n = 10: ${dp(sd(10), 2)}` }, { x: 100, y: sd(100), label: `n = 100: ${dp(sd(100), 2)}` }] }, caption: `At n = 10 a proportion wanders about ${dp(sd(10), 2)} from 1/2; at n = 100 only ${dp(sd(100), 2)}.` },
    { type: 'check', scope: 'quadrupling halves the spread', questions: [
      mc(null, 'Going from 25 flips to 100 flips, the sd of the proportion of heads:', 'halves', [['quarters', 'divided by the change in n instead of its square root'], ['doubles', 'confused the proportion with the count, whose sd grows'], ['stays the same', 'ignored sample size: the hospital-problem belief']], `√100/√25 = 2, so ${dp(sd(25), 2)} becomes ${dp(sd(100), 2)}.`, { at: 0 }),
    ] },
    { type: 'text', text: 'The same threshold, 60%, against the two spreads. For n = 10 it is less than one sd out; for n = 100 it is two sds out.' },
    { type: 'diagram', diagram: 'density', spec: { xLabel: 'proportion of heads', yLabel: 'density', curves: [{ name: 'n = 10', points: npdf(0.5, sd(10)) }, { name: 'n = 100', points: npdf(0.5, sd(100)) }], shade: [{ from: 0.6, to: 1, curve: 0 }, { from: 0.6, to: 1, curve: 1 }] }, caption: `z = (0.6 − 0.5)/sd: ${dp(0.1 / sd(10), 2)} for n = 10, ${dp(0.1 / sd(100), 2)} for n = 100. Exact: P(at least 60%) is ${dp(atLeastPct(10, 0.6))} against ${dp(atLeastPct(100, 0.6))}.` },
    { type: 'check', scope: 'the z-distance of a threshold', questions: [
      { make: (rng) => { const n = rng.pick([16, 25, 36, 64, 100]), f = rng.pick([0.6, 0.7, 0.4]); return { type: 'number', q: `n = ${n}. How many sds of the proportion is ${f * 100}% from 50%? (2 decimals)`, answer: Math.abs(f - 0.5) / sd(n), tolerance: 0.006, hints: [`sd = 0.5/√${n}.`, `|${f} − 0.5| / sd.`], explain: `${dp(Math.abs(f - 0.5), 1)} / ${dp(sd(n), 3)} = ${dp(Math.abs(f - 0.5) / sd(n), 2)}.` }; } },
    ] },
    { type: 'text', text: 'Three statements across four sample sizes: extremes fall, bands rise, exact balance falls. Read each group of bars left to right and say which way it moves before reading the numbers.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Fair coin, n flips', xLabel: 'n', yLabel: 'probability', categories: NS.map(String), series: [{ name: 'at least 60% heads', values: NS.map((n) => Number(atLeastPct(n, 0.6).toFixed(3))) }, { name: 'exactly 50%', values: NS.map((n) => Number(half(n).toFixed(3))) }, { name: '40% to 60%', values: NS.map((n) => Number(within(n, 0.1).toFixed(3))) }] }, caption: `At least 60%: ${NS.map((n) => dp(atLeastPct(n, 0.6))).join(', ')}. Exactly 50%: ${NS.map((n) => dp(half(n))).join(', ')}. Between 40% and 60%: ${NS.map((n) => dp(within(n, 0.1))).join(', ')}.` },
    { type: 'check', scope: 'which way each statement moves with n', questions: [
      mc(null, 'As n grows from 10 to 100, which statement becomes more likely?', 'between 40% and 60% heads', [['exactly 50% heads', 'exact balance gets rarer: more counts share the probability'], ['at least 60% heads', 'extremes fade as the spread shrinks'], ['none of them', 'the band around 1/2 fills up']], 'The band holds more and more sds of the distribution.', { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves that turn "which sample size" into a z-distance, and a z-distance into an order. The last move handles the one statement that behaves differently, exact balance.' },
    { type: 'steps', steps: [
      { say: 'Head count: mean n/2, sd √n/2. Proportion = count/n: mean 1/2, sd 0.5/√n.', why: 'Dividing a random quantity by n divides its sd by n; √n/2 over n is 0.5/√n.',
        checks: [{ make: (rng) => { const n = rng.pick([16, 36, 64, 100]); return { type: 'number', q: `n = ${n}. sd of the head count? (2 decimals)`, answer: Math.sqrt(n) / 2, tolerance: 0.006, hints: ['√n / 2.'], explain: `√${n}/2 = ${dp(Math.sqrt(n) / 2, 2)}.` }; } }] },
      { say: 'A threshold proportion f sits z = |f − 1/2| / (0.5/√n) = 2|f − 1/2|√n sds from the centre. Same f, bigger n → bigger z.', why: 'The distance to the threshold is fixed while the spread shrinks like 1/√n.',
        checks: [{ make: (rng) => { const f = rng.pick([0.6, 0.7]); return mc(rng, `At least ${f * 100}% heads: which n puts the threshold furthest out in sds?`, 'n = 100', [['n = 10', 'reversed: small n means a wide spread, so the threshold is close'], ['n = 25', 'in between: z grows with √n'], ['all the same', 'judged by the percentage alone']], `z = 2 × ${dp(f - 0.5, 1)} × √n grows with n.`); } }] },
      { say: 'The further out the threshold, the smaller its tail: P(at least f%) falls with n for any f above 1/2. Small samples produce extreme proportions.', why: `Tail probabilities shrink quickly with z (about ${T1} at z = 1, ${T2} at z = 2).`,
        checks: [{ hinge: true, make: (rng) => { const [a, b] = rng.pick([[10, 45], [15, 60], [10, 60], [20, 45]]); return mc(rng, `Which hospital has more days with more than 60% boys: one with ${a} births a day or one with ${b}?`, `the ${a}-birth hospital`, [[`the ${b}-birth hospital`, 'thought more births means more chances of an extreme day; the proportion concentrates instead'], ['about the same', 'judged by the percentage alone: the hospital-problem belief']], `${dp(morePct(a, 0.6))} against ${dp(morePct(b, 0.6))}.`); } }] },
      { say: 'Exactly 1/2 gets rarer (≈ √(2/(πn))) while a band around 1/2 gets likelier: the probability spreads over more counts, but those counts crowd into the band.', why: 'The single central count has probability about 1/(sd of the count × √(2π)), and that sd grows like √n.',
        checks: [{ make: (rng) => { const n = rng.pick([10, 20, 50, 100]); return { type: 'number', q: `Estimate P(exactly 50% heads in ${n} flips) with √(2/(πn)). (3 decimals)`, answer: half(n), tolerance: 0.01, hints: [`√(2/(π × ${n})).`], explain: `≈ ${dp(Math.sqrt(2 / (Math.PI * n)))}; exact ${dp(half(n))}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Explain why a small hospital records "more than 60% boys" on more days than a large one, although boys are equally likely in both.', model: 'The proportion of boys in a day\'s births has sd 0.5/√n. In a small hospital n is small, so the proportion swings widely and passing 60% is a short distance in sds. In a large hospital the proportion is tightly packed around 50%, so 60% is several sds away and rarely reached.', points: ['Proportion sd = 0.5/√n', 'Same threshold, smaller sd → more sds away', 'More sds away → smaller tail'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'large-numbers', difficulty: 2, seed: 'a', intro: 'At least f%, exactly half, and a band, across sample sizes. Try it first.' },
    { type: 'worked', section: 'll', family: 'large-numbers', difficulty: 3, seed: 'b', fade: 1, intro: 'The hospital version. The binomial values are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'Which hospital has more days with over 60% boys: 15 births a day or 45?', answer: `The smaller one: ${dp(morePct(15, 0.6), 2)} against ${dp(morePct(45, 0.6), 2)}.`, explain: 'Small samples swing further.' },

    S('traps'),
    { type: 'text', text: 'Every trap here ignores n, or uses it in the wrong direction. Before ranking, write the sample size next to each statement and ask how many sds out its threshold is. The law of large numbers is about closeness to 1/2, never about landing on it.' },
    { type: 'traps', section: 'll', family: 'large-numbers', extra: [
      { belief: '"More than 60%" is equally likely in a small and a large sample.', fix: 'The sd of a proportion is 0.5/√n: the small sample reaches 60% far more often.' },
      { belief: 'Exactly 50% gets more likely with more flips (law of large numbers).', fix: 'The proportion gets closer to 1/2, but hitting it exactly gets rarer: ≈ √(2/(πn)).' },
      { belief: 'A larger sample gives more chances of an extreme result.', fix: 'The proportion concentrates; extremes need a longer run of luck.' },
      { belief: 'The sd of a proportion shrinks like 1/n.', fix: 'It shrinks like 1/√n: quadruple n to halve it.' },
    ] },
    { type: 'erroneous', problem: 'A candidate ranks "at least 60% heads in 10 flips", "at least 60% heads in 100 flips" and "exactly 50% heads in 100 flips". One step is wrong.', steps: [
      `sd of the proportion: ${dp(sd(10), 2)} for n = 10, ${dp(sd(100), 2)} for n = 100.`,
      `60% is ${dp(0.1 / sd(10), 1)} sd out for n = 10 and ${dp(0.1 / sd(100), 1)} sd out for n = 100, so the n = 10 statement is far likelier.`,
      'Exactly 50% in 100 flips is the most likely of all: the law of large numbers pulls the proportion to 50%.',
      'Order: exactly 50% (100) > at least 60% (10) > at least 60% (100).',
    ], errorStep: 2, explain: `The law of large numbers pulls the proportion near 50%, not onto it. Exactly 50 heads in 100 has probability ${dp(half(100))}, below "at least 60% in 10 flips" (${dp(atLeastPct(10, 0.6))}).` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'A candidate says "exactly 50% heads" is more likely in 1000 flips than in 10 flips. Which belief?', 'The proportion converging to 1/2 means hitting 1/2 exactly', [['The sd shrinks like 1/n', 'no sd was used'], ['Larger samples give more extremes', 'the claim is about the centre, not extremes'], ['Proportions do not depend on n', 'the candidate did use n, in the wrong direction']], `Exactly half: ${dp(half(10))} for 10 flips, about ${dp(Math.sqrt(2 / (Math.PI * 1000)))} for 1000.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `sd table for the proportion: n = 10 → ${dp(sd(10), 2)}, 25 → ${dp(sd(25), 2)}, 100 → ${dp(sd(100), 2)}, 400 → ${dp(sd(400), 3)}. Threshold 60%: z = 0.2√n. Tails: z = 1 → about ${T1}, z = 2 → about ${T2}.` },
    { type: 'callout', tone: 'speed', text: `Direction rules settle most items without numbers: extremes fall with n, bands around 1/2 rise with n, exactly 1/2 falls with n. Budget: ${LL.exam.perItemSeconds} seconds; use numbers only when two statements move the same way.` },
    { type: 'check', scope: 'direction rules and the sd table', questions: [
      { make: (rng) => again(() => { const keys = rng.shuffle(Object.keys(POOL)).slice(0, 3); return rank(rng, 'Fair coin (or equally likely boys and girls). Rank from most to least likely.', keys.map((k) => POOL[k](rng)), 'z-distance with sd 0.5/√n for tails; √(2/(πn)) for exactly half; bands rise with n.', { gap: 0.02 }); }) },
    ] },

    S('rule'),
    { type: 'text', text: 'Write n next to every statement, then apply the direction rules; compute a z only for two statements that move the same way. That is rarely more than one pair per item.' },
    { type: 'callout', tone: 'rule', text: 'Proportions across n → sd = 0.5/√n, z = 2|f − ½|√n. Extremes fall with n, bands around ½ rise, exactly ½ falls (≈ √(2/(πn))). Small samples make extreme days.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'As n grows', 'Why'], rows: [
      ['at least 60% heads', 'falls', 'threshold moves more sds out'],
      ['between 40% and 60%', 'rises to 1', 'the band holds more sds'],
      ['exactly 50%', 'falls', 'probability spreads over more counts'],
      ['at least 50% heads', 'falls towards 1/2', 'the tie at exactly half shrinks'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: n = 1 is maximally extreme (every sample is 0% or 100%). "At least 50%" is always above 1/2 for even n because it includes the tie; for odd n it is exactly 1/2.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: volatile funds (a small sample swings like a volatile fund), the 68-95 landmarks on density curves, and Intervals estimates where a sum of many pieces concentrates like √n.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const n = rng.pick([5, 7, 9, 11]); return mc(rng, `P(at least 50% heads in ${n} flips)?`, '1/2', [['above 1/2, because it includes ties', `with ${n} (odd) flips a tie is impossible`], ['below 1/2', 'heads and tails are symmetric'], [dp(half(n + 1)), 'answered "exactly half" for the next even n']], 'Odd n: no tie, so symmetry splits the outcomes equally.'); } },
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'large-numbers', count: 3 },
  ],
};
