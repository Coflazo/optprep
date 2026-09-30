// Curated Intervals items, written in the style of reported questions (dice duels, broken
// sticks, a 10 × 10 shape grid, a table of 42 coins, a 10 × 10 dice grid, a scale-bar path,
// a 200-score grid, noisy series, a weighted coupon collector). meta.source names the report.
// Truths are computed here from exact inputs; tests recompute each one independently.
import { Q, sumQ } from '../../core/rational.js';
import { nCr } from '../../core/combinatorics.js';
import { makeRng } from '../../core/rng.js';
import { ivItem, scatter } from './lib.js';
import { families } from './registry.js';

const SRC = {
  tm: 'Tradermath Intervals practice test: question families (dice duels, broken sticks, shape and coin counting, dice grid, scale-bar path, 200-score grid, noisy series, weighted coupon collector); original rewrite',
  qv: 'QuantVault Optiver Intervals replica: 18 questions, 60 s each, score lower/upper, exact answers reward zero width; original item',
  qb: 'QuantBrainteasers / PracHub Optiver probability and expected-value question styles; original item',
  est: 'Standard trading-interview estimation practice (mental arithmetic, powers, units); original item',
};
const F = Object.fromEntries(families.map((f) => [f.id, f]));
const EXACT = { exact: true, belief: { kind: 'point' }, note: 'Exact answer: zero width, or a two-decimal bracket if it repeats.' };
const HINTS = ['Decide first: is this exactly computable, or an estimate?', 'Exact → compute and give zero width. Estimate → width from your honest error.'];

function item(n, famId, d, src, o) {
  const it = ivItem(F[famId], { seed: 'bank' }, d, { hints: HINTS, ...o });
  it.id = `iv:bank:${String(n).padStart(2, '0')}`;
  it.meta = { source: SRC[src] };
  return it;
}
const pct = (q) => q.toNumber() * 100;
const steps = (...pairs) => pairs.map(([say, why]) => ({ say, why }));

// Visual items: the family generators with fixed seeds, so the pictures are reproducible.
function fromFamily(n, famId, d, seed, src) {
  const it = F[famId].generate(makeRng(`iv-bank:${seed}`), { difficulty: d });
  it.id = `iv:bank:${String(n).padStart(2, '0')}`;
  it.meta = { source: SRC[src] };
  return it;
}

function coinsTable(n, count, src) {
  const rng = makeRng(`iv-bank-coins:${count}`);
  const pts = scatter(rng, count, 420, 280, 26, 16);
  const visual = { type: 'dots', width: 420, height: 280, items: pts.map(([x, y]) => ({ x, y, r: 11, shape: 'coin', tone: 2 })), label: 'Coins scattered on a table' };
  return item(n, 'dots-count', 2, src, {
    text: 'How many coins are on the table?', visual, truth: count, unit: 'coins',
    coach: { exact: false, belief: { kind: 'normal', sd: Number((0.05 * count).toPrecision(2)) }, note: 'A 45-second quadrant count is good to about ±5%.' },
    steps: steps(['Split the table into quadrants and count each in small clusters.', 'Clusters of 3 to 5 are read at a glance; quadrants give a built-in check.'], [`True count: ${count}.`, 'Counted from the picture.']),
    params: { scenario: 'coins', countShape: 'coin', items: visual.items.map((i) => [i.x, i.y, i.shape]) },
  });
}

const B = [];
let k = 0;
const add = (...args) => B.push(item(++k, ...args));

// ---- exact probabilities, in percent ----
add('prob-exact', 1, 'tm', {
  text: 'You and a friend each roll a fair six-sided die. What is the probability, in percent, that your number is strictly higher?',
  truth: pct(Q.of(15, 36)), unit: '%', coach: EXACT, exact: '5/12',
  steps: steps(['P(tie) = 6/36.', 'The second die matches the first in one face of six.'], ['Higher and lower are symmetric: (1 − 1/6)/2 = 5/12 = 41.666…%.', 'Everything except ties splits evenly.']),
  params: { scenario: 'duel', m: 6 },
});
add('prob-exact', 2, 'tm', {
  text: 'A stick is broken at two independent uniformly random points. What is the probability, in percent, that the three pieces can form a triangle?',
  truth: 25, unit: '%', coach: EXACT, exact: '1/4',
  steps: steps(['A triangle needs every piece shorter than half the stick.', 'Triangle inequality: the longest side must be less than the sum of the other two, i.e. below 1/2.'], ['The region where some piece exceeds 1/2 has three corner triangles, each 1/4 of the square: P = 1 − 3/4 = 1/4.', 'Plot the two break points in the unit square and shade the bad regions.']),
  params: { scenario: 'triangle-stick' },
});
add('prob-exact', 2, 'qb', {
  text: 'Two fair six-sided dice are thrown. What is the probability, in percent, that the product is a perfect square?',
  truth: pct(Q.of(8, 36)), unit: '%', coach: EXACT, exact: '2/9',
  steps: steps(['Squares: the six doubles (1, 4, 9, 16, 25, 36) plus (1, 4) and (4, 1) giving 4.', 'List square products up to 36 and count ordered pairs.'], ['8 of 36 = 22.22…%.', 'Ordered pairs are equally likely.']),
  params: { scenario: 'square-product' },
});
add('prob-exact', 2, 'qb', {
  text: 'Three fair six-sided dice are rolled in order. What is the probability, in percent, that the three numbers are strictly increasing?',
  truth: pct(Q.of(20, 216)), unit: '%', coach: EXACT, exact: '5/54',
  steps: steps(['Each set of three different values appears in exactly one increasing order: C(6, 3) = 20 outcomes.', 'Choosing the set fixes the increasing arrangement.'], ['20/216 = 9.259…%.', 'Out of 6³ ordered outcomes.']),
  params: { scenario: 'increasing3' },
});
add('prob-exact', 1, 'qb', {
  text: 'A fair coin is tossed 4 times. What is the probability, in percent, of at least two heads?',
  truth: pct(Q.of(11, 16)), unit: '%', coach: EXACT, exact: '11/16',
  steps: steps(['Complement: 0 or 1 heads = 1 + 4 = 5 of 16.', 'Fewer cases on the complement side.'], ['1 − 5/16 = 11/16 = 68.75%.', 'Terminating decimal: zero width.']),
  params: { scenario: 'atLeastHeads', n: 4, k: 2 },
});
add('prob-exact', 2, 'qb', {
  text: 'Two cards are drawn without replacement from a standard deck. What is the probability, in percent, that both are aces?',
  truth: pct(Q.of(12, 2652)), unit: '%', coach: EXACT, exact: '1/221',
  steps: steps(['4/52 × 3/51 = 12/2652 = 1/221.', 'The second draw has one ace and one card fewer.'], ['1/221 = 0.4524…%.', 'Small but exact: bracket it to four decimals if you can.']),
  params: { scenario: 'two-aces' },
});
add('prob-exact', 3, 'tm', {
  text: 'You roll two fair dice and keep the higher; your friend rolls one fair die. What is the probability, in percent, that your kept number is strictly higher than your friend\'s?',
  truth: pct(Q.of(125, 216)), unit: '%', coach: EXACT, exact: '125/216',
  steps: steps(['Condition on your friend\'s value y: P(your max > y) = 1 − (y/6)².', 'Your max is at most y only if both dice are.'], ['Average over y = 1..6: 1 − (1 + 4 + 9 + 16 + 25 + 36)/216 = 125/216 = 57.87…%.', 'Each y is equally likely.']),
  params: { scenario: 'duel-best-of-two' },
});
add('prob-exact', 3, 'qb', {
  text: 'Two fair dice are thrown and at least one shows a six. What is the probability, in percent, that the sum is at least 10?',
  truth: pct(Q.of(5, 11)), unit: '%', coach: EXACT, exact: '5/11',
  steps: steps(['Condition: 11 ordered pairs contain a six.', 'Not 12: (6, 6) is counted once.'], ['Of those, (6,4), (6,5), (6,6), (4,6), (5,6) sum to 10 or more: 5/11 = 45.45…%.', 'Conditional probability = favourable within the condition / size of the condition.']),
  params: { scenario: 'six-then-sum', k: 10 },
});
add('prob-exact', 3, 'qb', {
  text: 'A point is chosen uniformly at random in a square. What is the probability, in percent, that it lies inside the circle inscribed in the square?',
  truth: 25 * Math.PI, unit: '%', coach: EXACT, exact: 'π/4',
  steps: steps(['Area ratio: circle of radius 1/2 in a unit square: π/4.', 'Uniform point: probability = area.'], ['π/4 = 78.539…%.', 'Exact but irrational: bracket to two decimals.']),
  params: { scenario: 'inscribed-circle' },
});
add('prob-exact', 1, 'qv', {
  text: 'Two fair six-sided dice are thrown. What is the probability, in percent, that the sum is at least 9?',
  truth: pct(Q.of(10, 36)), unit: '%', coach: EXACT, exact: '5/18',
  steps: steps(['Sums 9, 10, 11, 12 have 4 + 3 + 2 + 1 = 10 ordered pairs.', 'Count per sum.'], ['10/36 = 27.77…%.', 'Bracket [27.77, 27.78].']),
  params: { scenario: 'sumAtLeast', k: 9 },
});

// ---- probabilities to estimate ----
add('prob-estimate', 2, 'qb', {
  text: '30 people are in a room. Assuming 365 equally likely birthdays and no leap years, what is the probability, in percent, that at least two share a birthday?',
  truth: (1 - Array.from({ length: 30 }, (_, i) => (365 - i) / 365).reduce((a, b) => a * b, 1)) * 100, unit: '%',
  coach: { exact: false, belief: { kind: 'normal', sd: 2.5 }, note: 'exp(−n(n−1)/730) is good to about a point here.' },
  steps: steps(['P(all different) ≈ exp(−30·29/730) = exp(−1.19) ≈ 0.30.', 'Sum of i/365 for i < 30 is 435/365.'], ['So about 70%; exact 70.63%.', 'The approximation slightly undershoots.']),
  params: { scenario: 'birthday', n: 30 },
});
add('prob-estimate', 2, 'qb', {
  text: 'A fair die is rolled 10 times. What is the probability, in percent, of at least one six?',
  truth: (1 - (5 / 6) ** 10) * 100, unit: '%',
  coach: { exact: false, belief: { kind: 'normal', sd: 1.5 }, note: '(5/6)^10 from (5/6)^6 ≈ 0.335: good to about a point.' },
  steps: steps(['(5/6)^10 = (5/6)^6 × (5/6)^4 ≈ 0.335 × 0.482 ≈ 0.162.', 'Anchor on a known power.'], ['1 − 0.162 ≈ 83.8%; exact 83.85%.', 'Complement.']),
  params: { scenario: 'sixes', n: 10 },
});
add('prob-estimate', 3, 'qb', {
  text: 'A fair coin is tossed 100 times. What is the probability, in percent, of at least 60 heads?',
  truth: Number((() => { let c = 0n; for (let j = 60; j <= 100; j++) c += nCr(100, j); return c * 10n ** 12n / 2n ** 100n; })()) / 1e10, unit: '%',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.2 }, note: 'A tail probability: the normal approximation is good to about 20% of the value.' },
  steps: steps(['Mean 50, sd 5; with continuity correction z = (59.5 − 50)/5 = 1.9.', 'At least 60 starts at the bar edge 59.5.'], ['1 − Φ(1.9) ≈ 2.9%; exact 2.84%.', 'Tail probabilities are relative-error estimates.']),
  params: { scenario: 'binomTail', n: 100, k: 60 },
});
add('prob-estimate', 3, 'qb', {
  text: '10 people put their hats in a box and each draws one at random. What is the probability, in percent, that nobody gets their own hat?',
  truth: (() => { let s = 0, f = 1; for (let j = 0; j <= 10; j++) { if (j) f *= j; s += (-1) ** j / f; } return s * 100; })(), unit: '%',
  coach: { exact: false, belief: { kind: 'normal', sd: 0.8 }, note: 'e^(−1) is correct to four decimals here; the only uncertainty is recall.' },
  steps: steps(['Inclusion-exclusion gives 1 − 1 + 1/2! − … + 1/10!.', 'Alternating corrections for fixed points.'], ['That is e^(−1) to within 1/11!: 36.79%.', 'The series converges extremely fast.']),
  params: { scenario: 'derange', n: 10 },
});

// ---- expected values ----
add('coupon', 4, 'tm', {
  text: 'A cereal box contains one of 3 toys: red with probability 1/2, blue with probability 1/3, green with probability 1/6. What is the expected number of boxes needed to collect all 3?',
  truth: 7.3, unit: 'boxes', coach: { exact: true, belief: { kind: 'lognormal', sd: 0.02 }, note: 'Exact by inclusion-exclusion (7 terms); allow a little for arithmetic.' }, exact: '73/10',
  steps: steps(['Singles: 2 + 3 + 6 = 11. Pairs: 1/(5/6) + 1/(2/3) + 1/(1/2) = 1.2 + 1.5 + 2 = 4.7. Triple: 1.', 'E[T] = Σ singles − Σ pairs + triple.'], ['11 − 4.7 + 1 = 7.3.', 'The rare green toy alone would take 6 boxes.']),
  params: { scenario: 'weighted', probs: [[1, 2], [1, 3], [1, 6]] },
});
add('coupon', 3, 'qb', {
  text: 'A fair six-sided die is rolled until every face has appeared at least once. What is the expected number of rolls?',
  truth: 14.7, unit: 'rolls', coach: EXACT, exact: '147/10',
  steps: steps(['Stage waits: 6/6 + 6/5 + 6/4 + 6/3 + 6/2 + 6/1.', 'Each new face is a geometric wait.'], ['= 1 + 1.2 + 1.5 + 2 + 3 + 6 = 14.7.', 'n·H(n) with n = 6.']),
  params: { scenario: 'uniform', probs: Array(6).fill([1, 6]) },
});
add('coupon', 5, 'tm', {
  text: 'A box holds one of 4 stickers: A with probability 1/2, B with probability 1/4, C with probability 1/8, D with probability 1/8. What is the expected number of boxes needed to collect all 4?',
  truth: (() => { const ps = [Q.of(1, 2), Q.of(1, 4), Q.of(1, 8), Q.of(1, 8)]; let e = Q.of(0); for (let m = 1; m < 16; m++) { let p = Q.of(0), b = 0; for (let i = 0; i < 4; i++) if (m & (1 << i)) { p = p.add(ps[i]); b++; } e = b % 2 ? e.add(Q.of(1).div(p)) : e.sub(Q.of(1).div(p)); } return e.toNumber(); })(),
  unit: 'boxes', coach: { exact: true, belief: { kind: 'lognormal', sd: 0.04 }, note: '15 inclusion-exclusion terms under time pressure: allow about 4%.' },
  steps: steps(['Inclusion-exclusion over the 15 non-empty sets of stickers.', 'E[time of the last first-arrival] = Σ (−1)^(|S|+1)/P(S).'], ['The two 1/8 stickers dominate: waiting for both alone takes 8 + 8 − 4 = 12 boxes.', 'Sanity check against the rarest items.']),
  params: { scenario: 'weighted', probs: [[1, 2], [1, 4], [1, 8], [1, 8]] },
});
add('expected-dice', 2, 'qb', {
  text: 'Two fair six-sided dice are thrown. What is the expected value of the larger number shown?',
  truth: 161 / 36, unit: '', coach: EXACT, exact: '161/36',
  steps: steps(['P(max = k) = (2k − 1)/36.', 'P(max ≤ k) = k²/36, differenced.'], ['E = Σ k(2k − 1)/36 = 161/36 = 4.472…', 'Bracket [4.47, 4.48].']),
  params: { scenario: 'max2', m: 6, which: 'max' },
});
add('expected-dice', 3, 'qb', {
  text: 'You roll a fair six-sided die and are paid the number shown. After seeing it you may reroll once and take the second number instead. With the best strategy, what is your expected payout?',
  truth: 4.25, unit: '', coach: EXACT, exact: '17/4',
  steps: steps(['A reroll is worth 3.5, so keep 4, 5, 6 and reroll 1, 2, 3.', 'Keep whatever beats the alternative.'], ['E = (4 + 5 + 6 + 3 × 3.5)/6 = 25.5/6 = 4.25.', 'Terminating: zero width.']),
  params: { scenario: 'reroll', m: 6 },
});
add('expected-dice', 3, 'qb', {
  text: 'A fair six-sided die is rolled 6 times. What is the expected number of different faces that appear?',
  truth: 6 * (1 - (5 / 6) ** 6), unit: '', coach: EXACT, exact: '31031/7776',
  steps: steps(['Each face appears with probability 1 − (5/6)^6 ≈ 0.665.', 'Indicator per face.'], ['6 × 0.6651 = 3.99.', 'Linearity over the six indicators.']),
  params: { scenario: 'distinct', n: 6 },
});
add('expected-dice', 1, 'qv', {
  text: '7 fair six-sided dice are thrown. What is the expected total?',
  truth: 24.5, unit: '', coach: EXACT, exact: '49/2',
  steps: steps(['One die averages 3.5.', 'Linearity of expectation.'], ['7 × 3.5 = 24.5.', 'Exact: zero width.']),
  params: { scenario: 'sumN', n: 7, m: 6 },
});
add('expected-dice', 2, 'qb', {
  text: 'Two fair six-sided dice are thrown. What is the expected absolute difference between them?',
  truth: 70 / 36, unit: '', coach: EXACT, exact: '35/18',
  steps: steps(['P(|diff| = d) = 2(6 − d)/36 for d = 1..5.', 'Differences in both directions.'], ['E = 2(5 + 8 + 9 + 8 + 5)/36 = 70/36 = 1.944…', 'Bracket [1.94, 1.95].']),
  params: { scenario: 'absDiff', m: 6 },
});

// ---- waiting times ----
const wait = (pattern, d, text, truth, how, alphabet = 'HT', probs = [['H', 1, 2], ['T', 1, 2]]) => add('waiting-time', d, 'qb', {
  text, truth, unit: alphabet === 'HT' ? 'tosses' : 'rolls', coach: EXACT, exact: String(truth),
  steps: steps([how, 'Overlap rule: sum 1/P(prefix) over prefixes that are also suffixes.'], [`E = ${truth}.`, 'Exact: zero width.']),
  params: { scenario: 'pattern', pattern, letterProbs: probs.filter(([c]) => pattern.includes(c)), alphabet },
});
wait('HH', 2, 'A fair coin is tossed until two heads appear in a row. What is the expected number of tosses?', 6, 'Overlaps of HH: H and HH, so 2 + 4.');
wait('HTH', 3, 'A fair coin is tossed until the sequence HTH first appears in consecutive tosses. What is the expected number of tosses?', 10, 'Overlaps of HTH: H and HTH, so 2 + 8.');
wait('HHT', 3, 'A fair coin is tossed until the sequence HHT first appears in consecutive tosses. What is the expected number of tosses?', 8, 'HHT overlaps itself only as a whole: 8.');
wait('66', 3, 'A fair die is rolled until two sixes appear in a row. What is the expected number of rolls?', 42, 'Overlaps of 66: 6 and 66, so 6 + 36.', '123456', [['6', 1, 6]]);

// ---- visual counting and measurement (fixed seeds) ----
B.push(fromFamily(++k, 'dots-count', 3, 'shapes-a', 'tm'));
B.push(coinsTable(++k, 42, 'tm'));
B.push(fromFamily(++k, 'dice-grid', 3, 'pips-a', 'tm'));
B.push(fromFamily(++k, 'dice-grid', 2, 'sixes-a', 'tm'));
B.push(fromFamily(++k, 'dots-count', 1, 'fill-a', 'tm'));
B.push(coinsTable(++k, 57, 'tm'));
B.push(fromFamily(++k, 'dots-count', 3, 'shapes-b', 'tm'));
B.push(fromFamily(++k, 'path-length', 2, 'path-a', 'tm'));
B.push(fromFamily(++k, 'path-length', 3, 'path-b', 'tm'));
B.push(fromFamily(++k, 'path-length', 4, 'path-c', 'tm'));
B.push(fromFamily(++k, 'percentile', 4, 'grid-a', 'tm'));
B.push(fromFamily(++k, 'percentile', 3, 'grid-b', 'tm'));
B.push(fromFamily(++k, 'percentile', 4, 'grid-c', 'tm'));
B.push(fromFamily(++k, 'series', 3, 'series-a', 'tm'));
B.push(fromFamily(++k, 'series', 4, 'series-b', 'tm'));
B.push(fromFamily(++k, 'series', 5, 'series-c', 'tm'));

// ---- arithmetic, powers, counting, given-number estimates ----
add('mental-product', 1, 'est', {
  text: 'What is 47 × 83?', truth: 3901, unit: '', coach: EXACT, exact: '3901',
  steps: steps(['47 × 83 = 47 × 80 + 47 × 3 = 3760 + 141.', 'Split one factor into tens and units.'], ['= 3901.', 'Exact: zero width.']),
  params: { scenario: 'product2', multiply: [47, 83], divide: [] },
});
add('mental-product', 3, 'est', {
  text: 'Estimate 732 × 0.48 × 27 ÷ 6.4.', truth: (732 * 48 * 27) / (100 * 6.4), unit: '',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.03 }, note: 'Four numbers with a division: about ±3%.' },
  steps: steps(['0.48 ≈ 1/2 (−4%), 27/6.4 ≈ 4.2: 732 × 0.5 × 4.2 ≈ 1537.', 'Pair the divisor with a nearby factor.'], ['Correct the 0.48 rounding (−4%): ≈ 1476; exact 1482.3.', 'Track the rounding direction.']),
  params: { scenario: 'product-quotient', multiply: [732, 0.48, 27], divide: [6.4] },
});
add('powers-roots', 2, 'est', {
  text: 'Estimate √7000.', truth: Math.sqrt(7000), unit: '',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.01 }, note: 'Bracketing between squares is good to about 1%.' },
  steps: steps(['83² = 6889, 84² = 7056.', 'Bracket between consecutive squares.'], ['7000 is 111/167 of the way: ≈ 83.66 (exact 83.666).', 'Linear interpolation between the squares.']),
  params: { scenario: 'sqrt', x: 7000 },
});
add('powers-roots', 3, 'est', {
  text: 'An account of 1000 grows by 7% per year, compounded yearly. Estimate its value after 30 years.', truth: 1000 * 1.07 ** 30, unit: '',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.03 }, note: 'Rule of 72 plus a correction: about ±3%.' },
  steps: steps(['Rule of 72: doubling every 10.3 years, so about 2.9 doublings.', 'ln 2 / ln 1.07 ≈ 10.24 years exactly.'], ['2^2.93 ≈ 7.6: about 7600 (exact 7612.26).', 'Compounding, not 1000 × (1 + 30 × 0.07) = 3100.']),
  params: { scenario: 'compound', r: 7, n: 30, p: 1000 },
});
add('powers-roots', 2, 'est', {
  text: 'What is 2^20?', truth: 2 ** 20, unit: '', coach: EXACT, exact: '1048576',
  steps: steps(['2^10 = 1024.', 'Known anchor.'], ['1024² = 1,048,576.', 'Exact: zero width.']),
  params: { scenario: 'pow2', k: 20 },
});
add('combinatorics', 3, 'qb', {
  text: 'How many 5-card hands can be dealt from a standard 52-card deck?', truth: Number(nCr(52, 5)), unit: 'ways', coach: EXACT, exact: nCr(52, 5).toString(),
  steps: steps(['C(52, 5) = 52·51·50·49·48 / 120.', 'Order within a hand does not matter.'], ['= 2,598,960.', 'A number worth memorising: zero width.']),
  params: { scenario: 'choose', n: 52, k: 5 },
});
add('combinatorics', 2, 'qb', {
  text: 'How many distinct arrangements are there of the letters of BANANA?', truth: 60, unit: 'ways', coach: EXACT, exact: '60',
  steps: steps(['6! = 720 orderings of the letters.', 'Treat the letters as distinct first.'], ['Divide by 3! for the A\'s and 2! for the N\'s: 720/12 = 60.', 'Swapping identical letters gives the same word.']),
  params: { scenario: 'word', w: 'BANANA' },
});
add('combinatorics', 4, 'qb', {
  text: 'How many 5-card hands from a standard deck contain exactly 2 hearts?', truth: Number(nCr(13, 2) * nCr(39, 3)), unit: 'ways',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.03 }, note: 'Exact in principle; the multiplication is long enough to allow about 3%.' },
  steps: steps(['C(13, 2) = 78 hearts pairs; C(39, 3) = 9139 non-heart triples.', 'Choose hearts and non-hearts separately.'], ['78 × 9139 = 712,842.', 'Multiply.']),
  params: { scenario: 'hearts', k: 2 },
});
add('fermi', 2, 'est', {
  text: 'An exchange gateway handles 2,500 messages per second, steadily, for 8 hours a day. How many million messages is that per day?', truth: 72, unit: 'million',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.03 }, note: 'Pure arithmetic: about ±3% under time pressure.' },
  steps: steps(['8 hours = 28,800 seconds.', 'Convert the time unit first.'], ['2,500 × 28,800 = 72,000,000 = 72 million.', 'Count powers of ten separately.']),
  params: { scenario: 'messages', rate: 2500, hours: 8 },
});
add('fermi', 3, 'est', {
  text: 'Light in optical fibre travels at about 200,000 km per second. What is the round-trip time, in milliseconds, over a 5,800 km fibre route?', truth: 58, unit: 'ms',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.05 }, note: 'Given numbers only: about ±5% for slips.' },
  steps: steps(['200,000 km/s = 200 km per millisecond.', 'Match the output unit early.'], ['Round trip 11,600 km / 200 = 58 ms.', 'Remember the factor 2.']),
  params: { scenario: 'latency', km: 5800 },
});
add('fermi', 3, 'est', {
  text: 'A market maker trades 1,200,000 shares a day and earns on average 25% of a 2-cent spread per share. What are its daily earnings in euros?', truth: 6000, unit: '€',
  coach: { exact: false, belief: { kind: 'lognormal', sd: 0.05 }, note: 'Given numbers only: about ±5% for slips.' },
  steps: steps(['Per share: 0.25 × €0.02 = €0.005.', 'Capture fraction times spread.'], ['1,200,000 × 0.005 = €6,000.', 'Watch the cents-to-euros conversion.']),
  params: { scenario: 'ticks', spread: 0.02, shares: 1200000, capture: 0.25 },
});

export default B;
