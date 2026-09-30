// Likelihood List family: histograms. A bar height is a count of observations; a range is a sum of
// neighbouring bars over the total; "among values above a" divides by the bars above a only.
// Every number is computed here.
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const LO = -4, W = 1;
const COUNTS = [3, 8, 17, 26, 24, 14, 6, 2];
const K = COUNTS.length;
const BINS = COUNTS.map((count, i) => ({ from: LO + i * W, to: LO + (i + 1) * W, count }));
const N = COUNTS.reduce((a, b) => a + b, 0);
const edge = (i) => LO + i * W;
const mass = (a, b) => BINS.filter((x) => x.from >= a && x.to <= b).reduce((s, x) => s + x.count, 0);
const neg = (v) => (v < 0 ? `−${-v}` : String(v));
const ABOVE1 = mass(1, edge(K)), MID = mass(-1, 1), ABOVE2 = mass(2, edge(K));
const cumL = COUNTS.map((_, i) => mass(edge(0), edge(i + 1)));
const cumR = COUNTS.map((_, i) => mass(edge(i), edge(K)));

// A fresh histogram for the checks (bell-ish, integer counts).
const fresh = (rng) => { const k = rng.int(6, 8), lo = rng.pick([0, 10, 20]), w = rng.pick([1, 2, 5]); const c = Array.from({ length: k }, (_, i) => Math.max(1, Math.round(20 * Math.exp(-((i - (k - 1) / 2) ** 2) / (k / 2))) + rng.int(-3, 3))); return { k, lo, w, c, n: c.reduce((a, b) => a + b, 0), e: (i) => lo + i * w, m(a, b) { return c.reduce((s, x, i) => s + (lo + i * w >= a && lo + (i + 1) * w <= b ? x : 0), 0); } }; };
const sayH = (h) => `A histogram has bins ${h.c.map((x, i) => `${h.e(i)} to ${h.e(i + 1)}: ${x}`).join(', ')}.`;

export default {
  id: 'll/histogram-bins',
  book: 'll',
  kind: 'family',
  family: 'histogram-bins',
  title: 'Histograms',
  summary: 'Add the bars inside the range and divide by the total; "among values above a" divides by the bars above a.',
  prerequisites: ['ll/compare-without-computing', 'll/score-table'],
  objectives: [
    'Find the total once and turn any range into a sum of neighbouring bars',
    'Count the short side: "above a" as total minus "below a" when that is quicker',
    'Compute a conditional range by dividing by the bars in the condition only',
    'Say why P(above b | above a) is never below P(above b) when b > a',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a histogram of ${N} daily returns has bins (in %) ${BINS.map((b) => `${neg(b.from)} to ${neg(b.to)}: ${b.count}`).join(', ')}. Returns never fall exactly on an edge. Rank: (a) a random day's return is above 1%, (b) it is between −1% and 1%, (c) among days above 1%, a random one is above 2%.`, answer: `(b) ${MID}/${N} > (c) ${ABOVE2}/${ABOVE1} > (a) ${ABOVE1}/${N}`, explain: `(a) adds the bars right of 1: ${ABOVE1} of ${N}. (b) adds the two middle bars: ${MID}. (c) keeps only the ${ABOVE1} days above 1% as its total, and ${ABOVE2} of them are above 2%: ${dp(ABOVE2 / ABOVE1, 2)}. If (c) came out smallest, you divided by ${N}.` },
    { type: 'text', text: 'The prompt is a **histogram**: bars over touching intervals (bins), each bar\'s height the number of observations in its bin. One observation is picked at random, or from a subgroup ("among days above 1%"). Statements ask for a value above a, below a, between a and b, or a range inside a range. The item promises that no value sits exactly on a bin edge, so ranges always line up with whole bars.' },
    { type: 'text', text: 'Not this lesson: a fund chart (each bar is one year, a single outcome) or a density curve (area, not counts). Here each bar holds many outcomes.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'In a histogram, what does a bar\'s height tell you?', 'how many observations fall in that bin', [['the value of one observation', 'that is a bar chart of individual outcomes, like yearly fund returns'], ['the probability density at that value', 'that is a density curve: area, not height, is probability there'], ['the average of the bin', 'a histogram records counts, not averages']], 'Height = count. Probability = count / total.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Histogram items look like statistics and are really counting. The work is adding a few bars, and the trap is the denominator: an unconditional range divides by everything, a conditional range by the bars in its condition. Knowing which one takes a second and saves the whole item. Returns, exam scores, trade P&L and order fill times all come as histograms in these items; the picture changes, the counting never does.' },

    S('anchor'),
    { type: 'text', text: 'You know "favourable over total" for rows of a table. A histogram is that table with **one change**: rows are grouped into bins and only the group sizes are shown. Every observation is still equally likely, so a bar of height 17 carries 17 equally likely outcomes. You lose the individual values inside a bin, and you never need them: the item only asks about ranges that start and end on edges.' },
    { type: 'check', scope: 'bars as groups of outcomes', questions: [
      { make: (rng) => { const h = fresh(rng); return { type: 'number', q: `${sayH(h)} How many observations in total?`, answer: h.n, hints: ['Add every bar once.'], explain: `${h.c.join(' + ')} = ${h.n}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'The histogram from the challenge. Ranges are read by covering whole bars: "between −1% and 1%" is exactly the two bars in the middle.' },
    { type: 'diagram', diagram: 'histogram', spec: { xLabel: 'Daily return (%)', yLabel: 'Days', unit: '%', bins: BINS }, caption: `${N} days in total. "Above 1%" is the ${BINS.filter((b) => b.from >= 1).length} bars right of 1: ${ABOVE1} days. "Between −1% and 1%" is ${COUNTS[3]} + ${COUNTS[4]} = ${MID} days.` },
    { type: 'check', scope: 'a range is a sum of bars', questions: [
      { make: (rng) => { const a = rng.int(0, K - 2), b = rng.int(a + 1, Math.min(K, a + 3)); const k = mass(edge(a), edge(b)); return { type: 'number', q: `From the histogram: P(a random day's return is between ${neg(edge(a))}% and ${neg(edge(b))}%)? (2 decimals)`, answer: k / N, tolerance: 0.006, hints: ['Add the bars between the two edges.', `Divide by ${N}.`], explain: `${k}/${N} = ${dp(k / N, 2)}.` }; } },
    ] },
    { type: 'text', text: 'Running totals make every range one subtraction. Build them from the left (days below an edge) and from the right (days above an edge).' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Running totals', columns: ['Bin (%)', 'Days', 'Below its right edge', 'Above its left edge'], rows: BINS.map((b, i) => [`${neg(b.from)} to ${neg(b.to)}`, b.count, cumL[i], cumR[i]]) }, caption: `"Above 1%" is read straight from the right column (${cumR[5]}); "below −2%" from the left column (${cumL[1]}). Days below an edge plus days above the same edge always make ${N}.` },
    { type: 'check', scope: 'running totals and the short side', questions: [
      { make: (rng) => { const i = rng.int(1, K - 1); return { type: 'number', q: `${cumL[i - 1]} of the ${N} days are below ${neg(edge(i))}%. How many are above ${neg(edge(i))}%?`, answer: N - cumL[i - 1], hints: ['No value sits on an edge, so every day is on one side.'], explain: `${N} − ${cumL[i - 1]} = ${N - cumL[i - 1]}.` }; } },
    ] },
    { type: 'text', text: 'A conditional range picks from a smaller histogram. "Among days above 1%" throws away every bar left of 1: what remains is the whole population for that statement.' },
    { type: 'diagram', diagram: 'histogram', spec: { title: 'The subgroup: days above 1%', xLabel: 'Daily return (%)', yLabel: 'Days', unit: '%', bins: BINS.slice(5) }, caption: `The subgroup has ${ABOVE1} days. "Above 2%" inside it is ${ABOVE2} days: ${ABOVE2}/${ABOVE1} = ${dp(ABOVE2 / ABOVE1, 2)}, far more than ${ABOVE2}/${N} = ${dp(ABOVE2 / N, 2)} over all days.` },
    { type: 'check', scope: 'the conditional histogram', questions: [
      { make: (rng) => { const i = rng.int(3, 5), j = rng.int(i + 1, K - 1); const base = mass(edge(i), edge(K)), hit = mass(edge(j), edge(K)); return { type: 'number', q: `Among days above ${neg(edge(i))}%, a random one is picked. P(it is above ${neg(edge(j))}%)? (2 decimals)`, answer: hit / base, tolerance: 0.006, hints: [`Denominator: days above ${neg(edge(i))}%.`, `Numerator: days above ${neg(edge(j))}% (all of them are in the subgroup).`], explain: `${hit}/${base} = ${dp(hit / base, 2)}.` }; } },
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves, from the total to the conditional. The last one is the fact that makes conditionals rank high, and it is the fact the item is designed around.' },
    { type: 'steps', steps: [
      { say: 'Find the total N once: it is the denominator of every unconditional statement.', why: 'Each observation is equally likely to be picked, so a probability is (observations in range) / N.',
        checks: [{ make: (rng) => { const h = fresh(rng); return { type: 'number', q: `${sayH(h)} Total?`, answer: h.n, explain: `${h.n}.` }; } }] },
      { say: 'A range is a block of neighbouring bars: add them. Values never sit on an edge, so each bar is fully in or fully out.', why: 'Disjoint bins add, the same way disjoint events add.',
        checks: [{ make: (rng) => { const h = fresh(rng); const a = rng.int(1, h.k - 2); return { type: 'number', q: `${sayH(h)} P(a random value is above ${h.e(a)})? (2 decimals)`, answer: h.m(h.e(a), h.e(h.k)) / h.n, tolerance: 0.006, hints: [`Add the bars right of ${h.e(a)}.`, `Divide by ${h.n}.`], explain: `${h.m(h.e(a), h.e(h.k))}/${h.n} = ${dp(h.m(h.e(a), h.e(h.k)) / h.n, 2)}.` }; } }] },
      { say: '"Among values above a": the subgroup (bars above a) is the new total. Count the qualifying bars inside it.', why: 'The pick happens inside the subgroup, so its size replaces N.',
        checks: [{ make: (rng) => { const h = fresh(rng); const a = rng.int(1, h.k - 3), b = rng.int(a + 1, h.k - 1); const base = h.m(h.e(a), h.e(h.k)), hit = h.m(h.e(b), h.e(h.k)); return { type: 'number', q: `${sayH(h)} Among values above ${h.e(a)}, P(above ${h.e(b)})? (2 decimals)`, answer: hit / base, tolerance: 0.006, hints: [`Denominator: bars above ${h.e(a)}.`, `Numerator: bars above ${h.e(b)}.`], explain: `${hit}/${base} = ${dp(hit / base, 2)}.` }; } }] },
      { say: 'When b > a, "above b" is inside "above a", so P(above b | above a) = (bars above b) / (bars above a) ≥ (bars above b) / N.', why: 'Same numerator, smaller denominator. The conditional can never lose to the plain "above b".',
        checks: [{ hinge: true, make: (rng) => again(() => { const h = fresh(rng); const a = rng.int(1, h.k - 3), b = rng.int(a + 1, h.k - 1); const base = h.m(h.e(a), h.e(h.k)), hit = h.m(h.e(b), h.e(h.k)); if (base === h.n) return null; return mc(rng, `${sayH(h)} Which is larger: P(above ${h.e(b)}) or P(above ${h.e(b)} | above ${h.e(a)})?`, `P(above ${h.e(b)} | above ${h.e(a)})`, [[`P(above ${h.e(b)})`, 'believed conditioning always lowers a probability'], ['They are equal', `forgot that the conditional divides by ${base}, not ${h.n}`]], `${hit}/${base} against ${hit}/${h.n}: same top, smaller bottom.`); }) }] },
    ] },
    { type: 'explain', prompt: 'Explain why "among days above 1%, above 2%" can be much likelier than "above 2%", even though both describe the same days on top.', model: 'Both have the same numerator, the days above 2%. The plain statement divides by every day, while the conditional divides only by the days above 1%, a much smaller group. The days above 2% are a large share of that small group, so the conditional probability is larger.', points: ['Same numerator: days above 2%', 'The conditional divides by the subgroup, not the total', 'Smaller denominator, larger fraction'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'histogram-bins', difficulty: 2, seed: 'a', intro: 'Three ranges over the whole histogram. Find the total, add bars, order. Try it first.' },
    { type: 'worked', section: 'll', family: 'histogram-bins', difficulty: 3, seed: 'b', fade: 1, intro: 'A conditional range may appear. The bar sums are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'Can P(value above 2 | value above 1) be larger than P(value above 1)?', answer: 'Yes. The conditional divides by the smaller group above 1, so it can exceed the plain probability of being above 1.', explain: 'It is never smaller than P(above 2), and it can beat anything else.' },

    S('traps'),
    { type: 'text', text: 'Two slips cause almost every miss here: dividing a conditional range by the total, and reading a range one bar too wide. Say the denominator before adding anything, and put a finger on both edges of the range before you add the bars between them.' },
    { type: 'traps', section: 'll', family: 'histogram-bins', extra: [
      { belief: 'A conditional range divides by the total.', fix: 'It divides by the bars in its condition only.' },
      { belief: 'A tall narrow bar and a short wide one compare by height.', fix: 'Compare counts in the range, not heights: two short bars can outnumber one tall bar.' },
      { belief: '"Between −1 and 1" includes the neighbouring bars that touch the edges.', fix: 'Only bars fully inside the range count; values never sit on an edge.' },
      { belief: 'Conditioning always makes a statement less likely.', fix: 'Conditioning on a superset shrinks the denominator and raises it.' },
    ] },
    { type: 'erroneous', problem: 'A candidate ranks the challenge statements. One step is wrong.', steps: [
      `Total: ${N} days.`,
      `Above 1%: ${ABOVE1}/${N}. Between −1% and 1%: ${MID}/${N}.`,
      `Among days above 1%, above 2%: ${ABOVE2}/${N} = ${dp(ABOVE2 / N, 2)}.`,
      'Order: between > above 1% > the conditional.',
    ], errorStep: 2, explain: `The conditional divides by the ${ABOVE1} days above 1%: ${ABOVE2}/${ABOVE1} = ${dp(ABOVE2 / ABOVE1, 2)}, which puts it above "above 1%" (${dp(ABOVE1 / N, 2)}).` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, `A candidate answers P(above 2% | above 1%) = ${ABOVE2}/${N}. Which belief?`, 'A conditional divides by the total', [['Values can sit on an edge', 'no edge case is involved here'], ['Heights are probabilities', 'the counts were read correctly'], ['Between means including neighbours', 'no "between" statement is involved']], `The denominator is the ${ABOVE1} days above 1%.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Count the short side: "above −2%" is N minus the two left bars. Build running totals from whichever end is closer to the edge in the statement.' },
    { type: 'callout', tone: 'speed', text: `A conditional range with a small subgroup is usually the most or least likely of the three: check it first. Budget: ${LL.exam.perItemSeconds} seconds; three bar sums take well under a minute.` },
    { type: 'callout', tone: 'speed', text: 'Sanity check: the three unconditional statements share the denominator, so their order is the order of their bar sums. Only a conditional needs a division, and a cross-multiplication settles it against the others.' },
    { type: 'check', scope: 'counting from the nearer end', questions: [
      { make: (rng) => again(() => { const i = rng.int(1, 3), j = rng.int(5, 7), a = rng.int(0, 2), b = a + rng.int(2, 3); return rank(rng, 'From the challenge histogram, rank from most to least likely.', [[`Above ${neg(edge(i))}%.`, mass(edge(i), edge(K)) / N], [`Above ${neg(edge(j))}%.`, mass(edge(j), edge(K)) / N], [`Between ${neg(edge(a))}% and ${neg(edge(b))}%.`, mass(edge(a), edge(b)) / N]], 'Count each on its short side over the same total.'); }) },
    ] },

    S('rule'),
    { type: 'text', text: 'The whole family in one line: say the denominator (total or subgroup), then add whole bars.' },
    { type: 'callout', tone: 'rule', text: 'Histogram → total once; range = Σ bars inside / total (count the short side); "among values above a" = Σ bars in both / Σ bars above a, never below the plain probability.' },

    S('contrast'),
    { type: 'compare', columns: ['Picture', 'A bar or area means', 'Probability of a range'], rows: [
      ['Histogram', 'count of observations in a bin', 'bars in range / total'],
      ['Fund chart', 'one year\'s return (one outcome)', 'years qualifying / years'],
      ['Density curve', 'height is density, not probability', 'area under the curve'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a range covering every bin has probability 1, an empty range 0. A subgroup of one bin makes "among values in that bin, above its left edge" certain.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: density curves are histograms with infinitely thin bars (sums become areas), and scatter-plot strips are subgroups exactly like "among days above 1%".' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'A histogram of 80 values. What is P(a value lies in some bin)?', '1', [['80/80 of the tallest bar', 'mixed up one bin with all bins'], ['the tallest bar / 80', 'answered for the most common bin only'], ['1/8', 'assumed eight equally likely bins']], 'Every value is in exactly one bin.', { at: 0 }),
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'histogram-bins', count: 3 },
  ],
};
