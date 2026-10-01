// Likelihood List family: density curves. Probability is area under the curve (total area 1).
// Flat curves: height 1/width. Triangles: half base times height. Bells: symmetry and the 68-95
// landmarks. Compare areas as width × typical height. Every area is integrated here, never typed.
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
// Standard normal CDF by Simpson's rule from 0 (accurate to ~1e-12 over |z| ≤ 8).
function Phi(z) { const n = 2000, h = z / n; let s = phi(0) + phi(z); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * phi(i * h); return 0.5 + (s * h) / 3; }
const nArea = (m, sd, a, b) => Phi((b - m) / sd) - Phi((a - m) / sd);
const npts = (m, sd, lo, hi, n = 160) => Array.from({ length: n + 1 }, (_, i) => { const x = lo + ((hi - lo) * i) / n; return [Number(x.toFixed(4)), Number((phi((x - m) / sd) / sd).toFixed(5))]; });
const uni = (lo, hi, a, b) => Math.max(0, Math.min(b, hi) - Math.max(a, lo)) / (hi - lo);
// Polylines sampled every 0.25 so shaded intervals always contain points; the uniform jumps at its edges.
const grid = (x0, x1) => Array.from({ length: Math.round((x1 - x0) / 0.25) + 1 }, (_, i) => x0 + i * 0.25);
const upts = (lo, hi, x0, x1) => { const h = Number((1 / (hi - lo)).toFixed(5)); return grid(x0, x1).flatMap((x) => (x === lo ? [[x, 0], [x, h]] : x === hi ? [[x, h], [x, 0]] : [[x, x > lo && x < hi ? h : 0]])); };
const triF = (lo, md, hi) => (x) => (x <= lo ? 0 : x >= hi ? 1 : x <= md ? (x - lo) ** 2 / ((hi - lo) * (md - lo)) : 1 - (hi - x) ** 2 / ((hi - lo) * (hi - md)));
const tpts = (lo, md, hi, x0, x1) => grid(x0, x1).map((x) => [x, Number((x <= lo || x >= hi ? 0 : x <= md ? (2 * (x - lo)) / ((hi - lo) * (md - lo)) : (2 * (hi - x)) / ((hi - lo) * (hi - md))).toFixed(5))]);

// Challenge: bell centred at 3, sd 1.
const M = 3, SD = 1;
const CH = { a: nArea(M, SD, 4.5, 50), b: nArea(M, SD, 3, 3.5), c: nArea(M, SD, -50, 2) };
const CHO = [['(a) above 4.5', CH.a], ['(b) between 3 and 3.5', CH.b], ['(c) below 2', CH.c]].sort((x, y) => y[1] - x[1]);
const ONE = nArea(0, 1, -1, 1), TWO = nArea(0, 1, -2, 2);
const TRI = [0, 2, 6];

// Think-aloud: desk A bell (mean 2, sd 2), desk B uniform on −4 to 6.
const TK = { m: 2, s: 2, lo: -4, hi: 6, cut: 4 };
TK.a = nArea(TK.m, TK.s, TK.m + TK.s, 50); TK.b = uni(TK.lo, TK.hi, TK.cut, TK.hi); TK.c = nArea(TK.m, TK.s, TK.m - TK.s, TK.m);
// Variation: sd doubled; (b) narrowed; sd halved with (c) moved to 2.5.
const V2 = { a: nArea(M, 2, 4.5, 50), b: nArea(M, 2, 3, 3.5), c: nArea(M, 2, -50, 2) }, VB = nArea(M, SD, 3, 3.25), VH = { a: nArea(M, 0.5, 4.5, 50), b: nArea(M, 0.5, 3, 3.5), c: nArea(M, 0.5, -50, 2.5) };
if (!(TK.c > TK.b && TK.b > TK.a && V2.c > V2.a && V2.a > V2.b && CH.c > VB && VB > CH.a && VH.b > VH.c && VH.c > VH.a && Math.abs(VH.c - CH.c) < 1e-9)) throw new Error('density-curves: prose orders no longer hold');

// Landmark statements about a bell with mean m and sd s.
const LAND = (m, s) => [
  [`X is above ${m}.`, 0.5],
  [`X is between ${m - s} and ${m + s}.`, ONE],
  [`X is above ${m + s}.`, (1 - ONE) / 2],
  [`X is below ${m - 2 * s}.`, (1 - TWO) / 2],
  [`X is between ${m} and ${m + 2 * s}.`, TWO / 2],
  [`X is between ${m - 2 * s} and ${m + 2 * s}.`, TWO],
];
// Two landmark statements about desk A (a bell) and one exact statement about desk B (flat).
const twoDesks = (rng) => again(() => { const m = rng.int(1, 5), s = rng.pick([1, 2]), lo = m - rng.int(4, 8), w = rng.int(8, 14), cut = lo + rng.int(1, w - 1); const pool = rng.shuffle(LAND(m, s)).slice(0, 2).map(([t, p]) => [`Desk A: ${t.replace('X', 'its P&L')}`, p]);
  return rank(rng, `Desk A's daily P&L is bell-shaped with mean ${m} and sd ${s}. Desk B's is uniform between ${lo} and ${lo + w}. Rank from most to least likely.`, [...pool, [`Desk B: its P&L is above ${cut}.`, uni(lo, lo + w, cut, lo + w)]], `Desk A by landmarks; desk B exactly: (${lo + w} − ${cut})/${w} = ${dp(uni(lo, lo + w, cut, lo + w), 2)}.`, { gap: 0.03 }); });

export default {
  id: 'll/density-curves',
  book: 'll',
  kind: 'family',
  family: 'density-curves',
  title: 'Density curves',
  summary: 'Probability is area under the curve: width × typical height, symmetry, and the 68-95 landmarks.',
  prerequisites: ['ll/histogram-bins', 'prob/poisson-normal'],
  objectives: [
    'Read a statement as an area under the right curve and check it against the total area 1',
    'Compute exact areas for flat and triangular curves in one line',
    'Use symmetry and the 68-95 rule to place any interval on a bell curve',
    'Order a narrow band near the peak against a wide interval in a tail by width × height',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: X has a bell-shaped density centred at ${M} with standard deviation ${SD}. Rank: (a) X is above 4.5, (b) X is between 3 and 3.5, (c) X is below 2. Two approaches, then an order.`, answer: CHO.map(([t, p]) => `${t} ≈ ${dp(p, 3)}`).join(' > '), explain: 'The narrow band (b) sits at the peak, where the curve is tallest: half a unit of width at full height. (c) is the whole tail beyond 1 sd, about 16%. (a) is the tail beyond 1.5 sd. If you ranked the tails first because they are "wider", you compared widths without heights.',
      attempts: [
        { id: 'height', label: 'Read the curve height', approach: 'You ranked each statement by how tall the curve is over its interval.', breaksAt: 'Height is density, not probability: each statement is the area over its interval, on its side of the cut.' },
        { id: 'bothtails', label: 'Use 32% for one tail', approach: 'You put (c) at about 0.32, the share outside one sd.', breaksAt: '0.32 is both tails together; one side beyond 1 sd holds about 0.16.' },
        { id: 'wide', label: 'The wider interval wins', approach: 'You put both tails above (b) because they stretch out forever.', breaksAt: 'Area is width × height: half a unit at the peak beats a long, thin tail.' },
      ] },
    { type: 'text', text: 'The prompt shows one or more smooth **density curves**: the P&L of a desk, a measurement X. Statements ask whether the quantity is above a, below a, or between a and b, possibly for different curves. The curves have shapes you can reason with: bells (normal), flat blocks (uniform), triangles, and right-skewed humps.' },
    { type: 'text', text: 'Not this lesson: a histogram with counts on the bars (add counts) or a fund chart (count years). Here there are no counts; the area is the probability.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'On a density curve, what is the probability that X lies between a and b?', 'the area under the curve between a and b', [['the height of the curve at the midpoint of a and b', 'height is density, not probability: it can even exceed 1'], ['the width b − a', 'width alone ignores how tall the curve is there'], ['the height at b minus the height at a', 'differences of heights mean nothing here']], 'Area = probability; the total area under a density is 1.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Density items look like calculus and are solved with rectangles, triangles and two remembered numbers. The trap is visual: wide intervals in a thin tail look big, narrow intervals at a tall peak look small. Comparing area, not width, fixes it, and a few landmark areas turn the picture into numbers in seconds. With several desks on one chart, each statement names its own curve: compare areas under different curves exactly as you would compare fractions with different denominators, one number per statement.' },

    S('anchor'),
    { type: 'text', text: 'You know histograms: probability of a range = bars in the range / total. A density is a histogram with **one change**: the bins are made infinitely thin and the heights rescaled so the total area is 1. Adding bars becomes measuring area. Everything you did with bars still works: a range is the area over it, a complement is 1 minus that area, and a conditional divides one area by another.' },
    { type: 'check', scope: 'a density is a histogram with thin bars', questions: [
      mc(null, 'A density curve is drawn for a quantity X. What is the total area under the whole curve?', '1', [['the height of the peak', 'height is not area'], ['the range of X', 'the width of the support is not the area'], ['it depends on the curve', 'every density is scaled so that the total probability is 1']], 'All outcomes together have probability 1.', { at: 0 }),
    ] },

    S('picture'),
    { type: 'text', text: `A bell curve centred at ${M} with sd ${SD}. The shaded band is within one sd of the centre. Three shapes follow, one per picture, because each shape has its own one-line area rule: bells by landmarks, flat curves by width, triangles by similar triangles.` },
    { type: 'diagram', diagram: 'density', spec: { xLabel: 'x', yLabel: 'density', curves: [{ name: 'X', points: npts(M, SD, -1, 7) }], shade: [{ from: M - SD, to: M + SD }] }, caption: `Within 1 sd: ${dp(ONE, 3)} of the area. Each tail beyond 1 sd: ${dp((1 - ONE) / 2, 3)}. Beyond 2 sd on one side: ${dp((1 - TWO) / 2, 3)}. The curve is symmetric, so each half holds 0.5.` },
    { type: 'check', scope: 'symmetry and the 68-95 landmarks', questions: [
      { make: (rng) => { const m = rng.int(1, 6), s = rng.pick([0.5, 1, 2]); const [t, p] = rng.pick(LAND(m, s)); return { type: 'number', q: `X is bell-shaped with mean ${m} and sd ${s}. P(${t.replace(/\.$/, '')})? (2 decimals, use 68-95)`, answer: p, tolerance: 0.02, hints: ['Within 1 sd: about 0.68; within 2 sd: about 0.95.', 'Split what is left equally between the two tails.'], explain: `≈ ${dp(p, 3)} from symmetry and the 68-95 landmarks.` }; } },
    ] },
    { type: 'text', text: 'A flat (uniform) curve between 0 and 6. Its height must make the rectangle\'s area 1, so the height is 1/6.' },
    { type: 'diagram', diagram: 'density', spec: { xLabel: 'x', yLabel: 'density', curves: [{ name: 'uniform on 0 to 6', points: upts(0, 6, -1, 7) }], shade: [{ from: 1, to: 3 }] }, caption: `Height 1/6 everywhere between 0 and 6. The shaded interval from 1 to 3 has area 2 × 1/6 = ${dp(uni(0, 6, 1, 3), 3)}.` },
    { type: 'check', scope: 'flat curves: width × 1/width', questions: [
      { make: (rng) => { const lo = rng.int(-2, 3), w = rng.int(4, 10), a = lo + rng.int(0, w - 2), b = a + rng.int(1, lo + w - a); return { type: 'number', q: `X is uniform between ${lo} and ${lo + w}. P(X between ${a} and ${b})? (3 decimals)`, answer: uni(lo, lo + w, a, b), tolerance: 0.0015, hints: [`Height = 1/${w}.`, 'Area = interval width × height.'], explain: `(${b} − ${a})/${w} = ${dp(uni(lo, lo + w, a, b), 3)}.` }; } },
    ] },
    { type: 'text', text: `A triangle from ${TRI[0]} to ${TRI[2]} peaking at ${TRI[1]}. Height at the peak: 2/(base) = 2/${TRI[2] - TRI[0]}, so the whole triangle has area 1.` },
    { type: 'diagram', diagram: 'density', spec: { xLabel: 'x', yLabel: 'density', curves: [{ name: 'triangle', points: tpts(...TRI, -1, 7) }], shade: [{ from: TRI[0], to: TRI[1] }] }, caption: `Left of the peak: a triangle with base ${TRI[1] - TRI[0]} and height 2/${TRI[2] - TRI[0]}, area ½ × ${TRI[1] - TRI[0]} × 2/${TRI[2] - TRI[0]} = ${dp(triF(...TRI)(TRI[1]), 3)}. The peak is not the middle of the area.` },
    { type: 'check', scope: 'triangle areas', questions: [
      { make: (rng) => { const x = rng.pick([1, 3, 4, 5]); const F = triF(...TRI); const tail = x > TRI[1]; return { type: 'number', q: `For the triangle above (0 to 6, peak at 2): P(X ${tail ? 'above' : 'below'} ${x})? (3 decimals)`, answer: tail ? 1 - F(x) : F(x), tolerance: 0.0015, hints: [tail ? `The part right of ${x} is a small triangle with base ${TRI[2] - x}.` : `The part left of ${x} is a small triangle with base ${x}.`, 'Areas of similar triangles scale with the square of the base.'], explain: `${tail ? `(${TRI[2]} − ${x})²/(6 × 4)` : `${x}²/(6 × 2)`} = ${dp(tail ? 1 - F(x) : F(x), 3)}.` }; } },
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves from "area" to a ranking. The first three give exact or landmark areas; the last one compares areas you have not computed. In an item you rarely need all four: pick the one that matches each curve\'s shape.' },
    { type: 'steps', steps: [
      { answers: 'height', say: 'Identify the curve, the interval and the side: "above a" is the area right of a, "below a" left of a, "between" the band.', why: 'Every statement is one area; getting the side wrong gives the complement.',
        checks: [{ make: (rng) => { const m = rng.int(2, 6); return mc(rng, `X is bell-shaped with mean ${m}. Which statement is the complement of "X is above ${m + 1}"?`, `X is below ${m + 1}`, [[`X is below ${m - 1}`, 'mirrored the point across the mean: that is the matching tail, equal in size, not the complement'], [`X is above ${m - 1}`, 'shifted the cut instead of switching sides']], 'Same cut, other side: the two areas add to 1.'); } }] },
      { say: 'Flat curve: height = 1/width of the support, so P(interval) = overlap width / support width.', why: 'A rectangle of area 1 over width w must have height 1/w.',
        checks: [{ make: (rng) => { const w = rng.int(3, 8); return { type: 'number', q: `A uniform density runs over an interval of width ${w}. What is its height? (3 decimals)`, answer: 1 / w, tolerance: 0.0015, explain: `1/${w} = ${dp(1 / w, 3)}.` }; } }] },
      { answers: 'bothtails', say: 'Bell curve: symmetric about the mean, about 68% within 1 sd, 95% within 2 sd. One tail beyond 1 sd ≈ 16%, beyond 2 sd ≈ 2.5%.', why: 'The two tails outside a symmetric band are equal, so each gets half of what the band leaves.',
        checks: [{ make: (rng) => { const m = rng.int(1, 6), s = rng.pick([1, 2]); return mc(rng, `X is bell-shaped, mean ${m}, sd ${s}. P(X > ${m + s}) is closest to:`, '0.16', [['0.32', 'took both tails beyond 1 sd, not one'], ['0.34', 'took the band between the mean and 1 sd'], ['0.05', 'used the 2-sd tail for a 1-sd cut']], `(1 − 0.68)/2 = 0.16.`); } }] },
      { answers: 'wide', say: 'Rank areas you did not compute by width × typical height: a narrow band at the peak can beat a wide stretch of tail.', why: 'Area is roughly width times the height over the interval; the peak is where height is largest.',
        checks: [{ make: (rng) => again(() => { const m = rng.int(1, 5), s = rng.pick([0.5, 1, 2]); const pool = rng.shuffle(LAND(m, s)).slice(0, 3); return rank(rng, `X is bell-shaped, mean ${m}, sd ${s}. Rank from most to least likely.`, pool, 'Symmetry and the 68-95 landmarks place each one.', { gap: 0.05 }); }) }] },
    ] },
    { type: 'explain', prompt: 'Explain why "X between 3 and 3.5" can beat "X below 2" for a bell curve centred at 3 with sd 1, although the second interval is much wider.', model: 'Probability is area, and area is width times height. The interval from 3 to 3.5 is only half a unit wide but sits under the tallest part of the curve. Below 2 is infinitely wide, but the curve there is low and falls away fast, so its area is only the one-sided tail beyond 1 sd, about 0.16, against about 0.19 for the band at the peak.', points: ['Probability is area, not width', 'Area ≈ width × height over the interval', 'The peak is tall; the tail is thin'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'density-curves', difficulty: 2, seed: 'a', explainAt: [0, 3], intro: 'One curve, three intervals. Estimate each area. Try it before opening the solution.' },
    { type: 'worked', section: 'll', family: 'density-curves', difficulty: 3, seed: 'b', fade: 1, intro: 'Two curves. The areas are worked out for you; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'Bell curve centred at 3 with sd 1: which is bigger, P(X > 4) or P(2.5 < X < 3)?', answer: `P(2.5 < X < 3) ≈ ${dp(nArea(3, 1, 2.5, 3), 2)} against P(X > 4) ≈ ${dp(nArea(3, 1, 4, 50), 2)}.`, explain: 'Half a unit at the peak beats the whole tail beyond 1 sd.' },

    S('traps'),
    { type: 'text', text: 'Density traps are visual: the eye measures width and height separately. Before ranking, say "area" for each statement and estimate it as width × height.' },
    { type: 'traps', section: 'll', family: 'density-curves', extra: [
      { belief: 'A taller curve at x means X = x is more likely than a probability of that height.', fix: 'Height is density. Only areas are probabilities; a density can exceed 1.' },
      { belief: 'A wide interval always beats a narrow one.', fix: 'Compare width × height: a narrow band at the peak can beat a wide tail.' },
      { belief: 'Half the area of a right-skewed curve lies left of its peak.', fix: 'The long right tail holds most of the area: the peak is left of the median.' },
      { belief: 'P(X > m + 1 sd) ≈ 0.32.', fix: 'That is both tails beyond 1 sd; one tail is about 0.16.' },
    ] },
    { type: 'erroneous', problem: 'A candidate ranks the challenge statements for the bell centred at 3 with sd 1. One step is wrong.', steps: [
      'Area = probability; the curve is symmetric about 3.',
      '"Below 2" is the tail beyond 1 sd: about 0.16.',
      '"Between 3 and 3.5" is only half a unit wide, so it is smaller than any tail.',
      'Order: below 2 > above 4.5 > between 3 and 3.5.',
    ], errorStep: 2, explain: `Width alone does not decide area. The band at the peak has area ≈ ${dp(CH.b, 3)}, larger than both tails (${dp(CH.c, 3)} and ${dp(CH.a, 3)}).` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'A uniform density on 0 to 0.5 has height 2. A candidate says this is impossible because a probability cannot exceed 1. Which belief?', 'Height is a probability', [['Area must be 2', 'the area is 0.5 × 2 = 1, as it must be'], ['A uniform curve must have height 1', 'the height is 1/width, which can be any positive number'], ['The support must be at least 1 wide', 'no such rule: only the area must be 1']], 'Height is density; area 0.5 × 2 = 1 is the probability.', { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Four numbers do most of the work: 0.5 (either side of a symmetric centre), 0.68 (within 1 sd), 0.16 (one tail beyond 1 sd), 0.025 (one tail beyond 2 sd). A band from the mean to 1 sd is 0.34.' },
    { type: 'callout', tone: 'speed', text: `For flat curves never estimate: overlap width / support width is exact. For triangles use similar triangles: a corner piece of base b has area (b/base)² times the area on that side of the peak. Budget: ${LL.exam.perItemSeconds} seconds is plenty once every statement has a landmark.` },
    { type: 'check', scope: 'landmark areas', questions: [
      { make: (rng) => { const m = rng.int(0, 5), s = rng.pick([1, 2, 3]); return { type: 'number', q: `X is bell-shaped, mean ${m}, sd ${s}. P(${m} < X < ${m + s})? (2 decimals)`, answer: ONE / 2, tolerance: 0.02, hints: ['Half of the 68% band.'], explain: `0.68 / 2 ≈ ${dp(ONE / 2, 2)}.` }; } },
    ] },

    { type: 'thinkaloud', problem: `Desk A's daily P&L is bell-shaped with mean ${TK.m} and sd ${TK.s}; desk B's is uniform between ${TK.lo} and ${TK.hi}. Rank: (a) A's P&L is above ${TK.m + TK.s}, (b) B's P&L is above ${TK.cut}, (c) A's P&L is between ${TK.m - TK.s} and ${TK.m}.`, lines: [
      { t: 0, say: 'Two curves, three areas. Each statement gets one number: a landmark or an exact rectangle.' },
      { t: 6, say: `(c) runs from 1 sd below A's mean to the mean: half of 0.68, about ${dp(TK.c, 2)}.` },
      { t: 12, say: `(a) is one tail of A beyond 1 sd: about ${dp(TK.a, 2)}.` },
      { t: 17, say: '(b): B is flat and spread wide, so its curve is low everywhere. Its area must be below A\'s tail.', slip: true },
      { t: 23, say: `Low is not small. Height 1/${TK.hi - TK.lo}, width ${TK.hi - TK.cut}: exactly ${dp(TK.b, 2)}, which beats ${dp(TK.a, 2)}.` },
      { t: 29, say: `Order (c) > (b) > (a), with ${LL.exam.perItemSeconds - 29} seconds left.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine with fresh desks', questions: [{ make: twoDesks }] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Density → probability = area. Flat: width/support. Triangle: ½ base × height, corners scale with the square. Bell: 0.5 / 0.68 / 0.16 / 0.025. Compare the rest by width × height.' },

    S('contrast'),
    { type: 'compare', columns: ['Shape', 'Height', 'Quick area'], rows: [
      ['uniform on [lo, hi]', '1/(hi − lo)', 'overlap / (hi − lo)'],
      ['triangle lo, peak, hi', '2/(hi − lo) at the peak', '(x − lo)²/((hi − lo)(peak − lo)) left of x'],
      ['bell (normal)', 'tallest at the mean', '68% within 1 sd, 95% within 2 sd'],
      ['right-skewed hump', 'peak near the left', 'most area to the right of the peak'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: P(X = a) is 0 for any single value (no width, no area), so "above a" and "at least a" are equal. An interval outside the curve\'s support has probability 0.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: histograms are densities with thick bars, large-number statements use the bell\'s landmarks for proportions (sd 0.5/√n), and Intervals estimates use the same 68-95 rule for ranges.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'X has a smooth density. How do P(X > 2) and P(X ≥ 2) compare?', 'They are equal', [['P(X ≥ 2) is larger', 'counted the single point 2 as having probability, but it has no width'], ['P(X > 2) is larger', 'a strict inequality cannot add area'], ['It depends on the curve', 'for any smooth density a single point has area 0']], 'A single point has zero width, so zero area.', { at: 0 }),
    ] },

    { type: 'variation', base: `The challenge: bell centred at ${M}, sd ${SD}. (a) above 4.5 ≈ ${dp(CH.a, 3)}, (b) between 3 and 3.5 ≈ ${dp(CH.b, 3)}, (c) below 2 ≈ ${dp(CH.c, 3)}. Order (b) > (c) > (a).`, rows: [
      { same: true, change: 'Add 10 to the mean and to every number in the statements', effect: 'No change. Areas depend only on where each interval sits relative to the curve, and everything moved together.' },
      { change: 'Double the sd to 2', effect: `The peak flattens and the tails fatten: (a) ≈ ${dp(V2.a, 3)}, (b) ≈ ${dp(V2.b, 3)}, (c) ≈ ${dp(V2.c, 3)}. The narrow band loses its height and drops to last.` },
      { change: 'Narrow (b) to "between 3 and 3.25"', effect: `Half the width at nearly the same height: about ${dp(VB, 3)}. (b) falls below (c) but stays above (a).` },
      { fusion: true, change: 'Halve the sd to 0.5, and move (c) to "below 2.5"', effect: `The narrower curve alone would turn "below 2" into a 2-sd tail; the new cut 2.5 puts it back at 1 sd, still ${dp(VH.c, 3)}. (b) becomes a full sd from the mean (${dp(VH.b, 3)}), (a) a 3-sd tail (${dp(VH.a, 4)}).` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => again(() => { const m = rng.int(20, 40), s = rng.pick([2, 4, 5]); return rank(rng, `A trade's fill time (ms) is bell-shaped with mean ${m} and sd ${s}. Rank from most to least likely.`, rng.shuffle(LAND(m, s)).slice(0, 3).map(([t, p]) => [t.replace('X', 'The fill time'), p]), 'Symmetry and the 68-95 landmarks place each one.', { gap: 0.05 }); }) },
      far: { make: (rng) => { const n = rng.pick([1000, 2000, 4000]), m = rng.pick([170, 175, 180]), s = rng.pick([6, 7, 8]), k = rng.pick([1, 2]), tail = (1 - (k === 1 ? ONE : TWO)) / 2;
        return { type: 'number', q: `The heights of ${n} adults are bell-shaped with mean ${m} cm and sd ${s} cm. About how many are taller than ${m + k * s} cm? (use 68-95)`, answer: n * (k === 1 ? 0.16 : 0.025), tolerance: n * 0.01, hints: [`${m + k * s} is ${k} sd above the mean.`, `One tail beyond ${k} sd holds about ${k === 1 ? '16%' : '2.5%'}.`], explain: `About ${k === 1 ? '16%' : '2.5%'} of ${n}: ${n * (k === 1 ? 0.16 : 0.025)} (the exact tail is ${dp(tail, 4)}).` }; } },
      principle: mc(null, 'Which idea carried over from the P&L curves to the heights?', 'Probability is the area beyond the cut, read from the 68-95 landmarks', [
        ['The height of the curve at the cut is the share of people above it', 'height is density, not a share'],
        ['The wider side of the cut always holds more of the probability', 'width alone ignores how tall the curve is there'],
        ['About 32% lie beyond one sd on each side of the mean', '32% is both tails together; one side is about 16%'],
      ], 'A share of a population is an area under its density, exactly like a probability for one random pick.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'density-curves', count: 3 },
  ],
};
