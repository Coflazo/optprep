// Likelihood List family: fund-return bar charts. Each year is one equally likely outcome; a
// statement counts bars. Thresholds, head-to-head years, "both lost", and persistence (years after a
// positive year) are all counts over a named scope. Volatility wins tails, steadiness wins "positive".
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const neg = (v) => (v < 0 ? `−${-v}` : String(v));

const YEARS = Array.from({ length: 10 }, (_, i) => String(2014 + i));
const A = { name: 'Steady', r: [5, 3, 6, -1, 4, 7, 2, 5, -2, 6] };
const B = { name: 'Swing', r: [18, -9, 24, -14, 11, 29, -6, 9, -12, 21] };
const N = YEARS.length;
const cnt = (f) => YEARS.filter((_, i) => f(i)).length;
const aPos = cnt((i) => A.r[i] > 0), bGt10 = cnt((i) => B.r[i] > 10), bBeat = cnt((i) => B.r[i] > A.r[i]), bNeg = cnt((i) => B.r[i] < 0), bothNeg = cnt((i) => A.r[i] < 0 && B.r[i] < 0);
// Persistence: years whose previous year was positive.
const persist = (f) => { const idx = YEARS.map((_, i) => i).filter((i) => i > 0 && f.r[i - 1] > 0); return { idx, hit: idx.filter((i) => f.r[i] > 0).length }; };
const PA = persist(A), PB = persist(B);
// Normal densities for the volatility picture (percent returns).
const pdf = (m, s) => (x) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const curve = (m, s) => Array.from({ length: 121 }, (_, i) => { const x = -40 + i * (80 / 120); return [Number(x.toFixed(3)), Number(pdf(m, s)(x).toFixed(5))]; });
const area = (m, s, lo, hi) => { let t = 0; const n = 4000, h = (hi - lo) / n; for (let i = 0; i < n; i++) t += pdf(m, s)(lo + (i + 0.5) * h) * h; return t; };
const STEADY = [4, 3], SWING = [6, 14];
const tail = (ms, x) => area(ms[0], ms[1], x, ms[0] + 12 * ms[1]);

// Think-aloud: Swing lost, Steady above 5% (strict: the 5% years are out), Steady persistence.
const ge5 = cnt((i) => A.r[i] >= 5), gt5 = cnt((i) => A.r[i] > 5), PAr = PA.hit / PA.idx.length;
// Variation: both tails for (b); both funds lost; Swing + 5 points with a 15% line.
const bExt = cnt((i) => B.r[i] > 10 || B.r[i] < -10), trail5 = cnt((i) => B.r[i] <= A.r[i] && B.r[i] + 5 > A.r[i]), bBeat5 = cnt((i) => B.r[i] + 5 > A.r[i]), bGt10s = cnt((i) => B.r[i] + 5 > 15);
if (!(PAr > bNeg / N && bNeg / N > gt5 / N && ge5 / N > bNeg / N && bExt / N < aPos / N && bExt / N > bBeat / N && bothNeg / N < bGt10 / N && bGt10s === bGt10 && bBeat5 === bBeat + trail5)) throw new Error('fund-returns: prose orders no longer hold');

// Fresh pair of funds for the think-aloud check and the near transfer.
const pair = (rng) => ({ a: Array.from({ length: 10 }, () => rng.int(-2, 8)), b: Array.from({ length: 10 }, () => rng.int(-15, 20)) });
const persistOf = (r) => { const idx = r.map((_, i) => i).filter((i) => i > 0 && r[i - 1] > 0); return { n: idx.length, hit: idx.filter((i) => r[i] > 0).length }; };
const farT = (rng) => again(() => {
  const d = Array.from({ length: 12 }, () => (rng.chance(0.5) ? 'R' : 'D')), idx = d.map((_, i) => i).filter((i) => i > 0 && d[i - 1] === 'R'), hit = idx.filter((i) => d[i] === 'R').length;
  if (idx.length < 3) return null;
  return { type: 'number', q: `A weather log for 12 days (R = rain, D = dry): ${d.join(' ')}. P(rain on a day, given rain the day before)? (2 decimals)`, answer: hit / idx.length, tolerance: 0.006, hints: ['The scope is the days right after a rainy day; day 1 has no day before.', `There are ${idx.length} such days.`], explain: `${idx.length} days follow a rainy day, ${hit} of them rainy: ${dp(hit / idx.length, 2)}.` };
});

// Checks on the fixed chart: threshold statements for either fund.
const thresholds = (rng) => {
  const f = rng.pick([A, B]), t = rng.pick(['gt', 'lt']), v = f === A ? rng.pick([2, 3, 4, 5]) : rng.pick([-10, -5, 5, 10, 15, 20]);
  const k = cnt((i) => (t === 'gt' ? f.r[i] > v : f.r[i] < v));
  return { f, t, v, k, text: `${f.name} returned ${t === 'gt' ? 'more' : 'less'} than ${v}%` };
};

export default {
  id: 'll/fund-returns',
  book: 'll',
  kind: 'family',
  family: 'fund-returns',
  title: 'Fund-return histories',
  summary: 'Each year is one outcome: count bars in scope. Persistence statements use only years after a positive year.',
  prerequisites: ['ll/compare-without-computing', 'll/football'],
  objectives: [
    'Turn threshold, head-to-head and "both lost" statements into counts of years',
    'Find the scope of a persistence statement (years that follow a positive year) and divide by it',
    'Predict from the chart\'s shape which fund wins statements about extremes and which wins "positive"',
    'Order the three statements with at most one close comparison',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: two funds, ${A.name} and ${B.name}, returned (in %) over ${YEARS[0]} to ${YEARS[N - 1]}: ${A.name} ${A.r.join(', ')}; ${B.name} ${B.r.join(', ')}. A year is picked at random. Rank: (a) ${A.name} was positive, (b) ${B.name} returned more than 10%, (c) ${B.name} beat ${A.name}.`, answer: `(a) ${aPos}/${N} > (c) ${bBeat}/${N} > (b) ${bGt10}/${N}`, explain: `All three are counts of years out of ${N}. (a): ${A.name} lost only ${N - aPos} years. (c): compare the two bars year by year. (b): ${B.name} is volatile, so it clears 10% often but not most of the time.`,
      attempts: [
        { id: 'eyeball', label: 'Judge the bars by eye', approach: 'You ordered the statements from the look of the chart without counting years.', breaksAt: 'Each year is one equally likely outcome: count the bars past the line, one year at a time.' },
        { id: 'average', label: 'Compare the averages', approach: `You ranked (c) from which fund has the higher average return.`, breaksAt: '"Beat" is decided year by year: compare the two bars of each year, not the averages.' },
        { id: 'risky', label: 'Volatile means less likely', approach: `You put every ${B.name} statement low because ${B.name} is the risky fund.`, breaksAt: `Spread fattens both tails: ${B.name} wins statements about extremes, ${A.name} wins "positive".` },
      ] },
    { type: 'text', text: 'The prompt is a **bar chart of yearly returns** for two funds, one pair of bars per year. A year is picked at random (for "given" statements, from the years that qualify). Statements: a fund was positive, returned more or less than v%, one fund beat the other, both lost money, or a fund was positive **given** it was positive the year before.' },
    { type: 'check', scope: 'who is picked from', questions: [
      { type: 'choice', q: '"In a random year when Fund A was positive, Fund B was positive too." Which years are picked from?', options: ['the years when Fund A was positive', 'all the years on the chart', 'the years when Fund B was positive'], answer: 0, traps: { 1: 'a "given" statement picks only from the years that qualify', 2: 'the condition is on Fund A' }, explain: 'Count Fund B positive among the years when Fund A was positive, over those years only.' },
    ] },
    { type: 'text', text: 'Not this lesson: a histogram (bars are counts of values, not years) and density curves (smooth areas). Here every bar is a single year\'s outcome and you count bars.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'In a fund-return chart, what is one equally likely outcome?', 'one year (a pair of bars)', [['one bar height', 'a height is a return, not an outcome: you count years'], ['one percentage point', 'returns are measurements, not outcomes to count'], ['one fund', 'the fund is part of the statement, not the random pick']], 'A random year is picked, so each year counts once.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Fund charts are a reported Likelihood List scenario. They test two things: reading a frequency off bars without losing a year, and the intuition that **volatility wins extremes while steadiness wins "positive"**. The persistence statement adds a denominator trap: its scope is not all years. Both skills transfer straight to risk questions on a trading desk.' },

    S('anchor'),
    { type: 'text', text: 'You know how to count rows of a table in scope. The one change: each row is a **year**, drawn as a pair of bars. "In a random year, X happened" is (years where X happened) / (years in scope). The chart hides the table, so the only new skill is reading it without losing a year: go left to right and tick.' },
    { type: 'check', scope: 'a year is a row', questions: [
      { make: (rng) => { const s = thresholds(rng); return { type: 'number', q: `In the challenge data, how many years did ${s.text}?`, answer: s.k, hints: [`Go through ${s.f.name}'s ${N} returns once.`, s.t === 'gt' ? `"More than ${s.v}" excludes ${s.v}.` : `"Less than ${s.v}" excludes ${s.v}.`], explain: `${s.k} of the ${N} years.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'The chart as the item draws it. Read one fund at a time for threshold statements, and the two bars of a year together for "beat" and "both lost".' },
    { type: 'diagram', diagram: 'bar', spec: { xLabel: 'Year', yLabel: 'Return (%)', unit: '%', categories: YEARS, series: [{ name: A.name, values: A.r }, { name: B.name, values: B.r }] }, caption: `${A.name} barely moves and is positive in ${aPos} of ${N} years. ${B.name} swings between ${neg(Math.min(...B.r))}% and ${neg(Math.max(...B.r))}%: more big gains and more losses.` },
    { type: 'check', scope: 'counting bars', questions: [
      { make: (rng) => { const s = thresholds(rng); return { type: 'number', q: `From the chart: P(in a random year, ${s.text})? (decimal)`, answer: s.k / N, tolerance: 0.001, hints: ['Count the bars past the line.'], explain: `${s.k}/${N} = ${dp(s.k / N, 1)}.` }; } },
      { type: 'number', q: `How many years did both funds lose money?`, answer: bothNeg, hints: ['A year counts only when both of its bars are below zero.'], explain: `${bothNeg} years: ${YEARS.filter((_, i) => A.r[i] < 0 && B.r[i] < 0).join(' and ')}.` },
    ] },
    { type: 'text', text: 'Why does the volatile fund win the extremes? Picture each fund\'s returns as a bell curve. Same kind of centre, different spread: the wide curve puts more area far from the middle on **both** sides.' },
    { type: 'diagram', diagram: 'density', spec: { title: 'Typical return profiles', xLabel: 'return (%)', yLabel: 'density', curves: [{ name: `${A.name}-like (sd ${STEADY[1]}%)`, points: curve(...STEADY) }, { name: `${B.name}-like (sd ${SWING[1]}%)`, points: curve(...SWING) }], shade: [{ from: 15, to: 40, curve: 1 }, { from: -40, to: 0, curve: 1 }] }, caption: `Mean ${STEADY[0]}% with sd ${STEADY[1]}% against mean ${SWING[0]}% with sd ${SWING[1]}%. Above 15%: ${dp(tail(STEADY, 15))} against ${dp(tail(SWING, 15))}. Below 0: ${dp(1 - tail(STEADY, 0))} against ${dp(1 - tail(SWING, 0))}. The steady fund wins "positive", the volatile one wins "above 15%".` },
    { type: 'check', scope: 'volatility and the tails', questions: [
      mc(null, 'A steady fund (returns always between 2% and 8%) and a volatile fund (between −20% and +30%). Which statement favours the steady fund?', 'the fund was positive', [['the fund returned more than 15%', 'the steady fund can never reach 15%: tails belong to the volatile fund'], ['the fund lost more than 10%', 'the steady fund never loses at all'], ['the fund\'s return was above 25%', 'another extreme: only the volatile fund gets there']], 'The steady fund is always positive; the volatile one sometimes loses.', { at: 0 }),
    ] },
    { type: 'text', text: 'Persistence ("positive, given positive the year before") has its own scope: only years whose **previous** year was positive. The first year has no previous year, so it is never in scope.' },
    { type: 'diagram', diagram: 'table', spec: { caption: `${A.name}: which years are in scope for persistence`, columns: ['Year', 'Previous year', 'In scope?', 'Positive again?'], rows: YEARS.slice(1).map((y, j) => { const i = j + 1; const inS = A.r[i - 1] > 0; return [y, `${A.r[i - 1]}%`, inS ? 'yes' : 'no', inS ? (A.r[i] > 0 ? 'yes' : 'no') : '']; }) }, caption: `${PA.idx.length} years follow a positive year; ${A.name} was positive again in ${PA.hit}. P = ${PA.hit}/${PA.idx.length}, not ${PA.hit}/${N}.` },
    { type: 'check', scope: 'the persistence scope', questions: [
      mc(null, `P(${B.name} positive | ${B.name} positive the year before), from the chart?`, `${PB.hit}/${PB.idx.length}`, [[`${PB.hit}/${N}`, 'divided by all years: the scope is only years after a positive year'], [`${PB.hit}/${N - 1}`, 'dropped the first year but kept years after a loss'], [`${cnt((i) => B.r[i] > 0)}/${N}`, 'answered the plain P(positive), ignoring the condition']], `${B.name} was positive in ${PB.idx.map((i) => YEARS[i - 1]).join(', ')}; the years after those number ${PB.idx.length}, and ${PB.hit} of them were positive.`, { at: 1 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves cover every statement in this family. They all reduce to one question: which years count, out of which years?' },
    { type: 'steps', steps: [
      { answers: 'eyeball', say: 'Threshold statements: count one fund\'s bars on the right side of the line. "More than 10%" excludes a 10% year.', why: 'A random year makes each year equally likely; the line splits years into qualifying and not.',
        checks: [{ make: (rng) => { const s = thresholds(rng); return { type: 'number', q: `How many years did ${s.text}?`, answer: s.k, hints: ['Compare each bar with the line; strict inequality.'], explain: `${s.k} years.` }; } }] },
      { answers: 'average', say: 'Head-to-head ("B beat A"): compare the two bars of each year. It is not about which fund has the higher average.', why: 'The event is about a single random year, so only that year\'s pair matters.',
        checks: [{ type: 'number', q: `In how many years did ${B.name} beat ${A.name}?`, answer: bBeat, hints: ['Year by year: is the second bar higher?'], explain: `${bBeat} of the ${N} years.` }] },
      { say: 'Persistence: list the years whose previous year was positive. That list is the denominator; count the positive years in it.', why: 'The condition is about the year before, so the scope is shifted by one year and the first year is never in it.',
        checks: [{ make: (rng) => { const r = Array.from({ length: 6 }, () => rng.pick([-3, -1, 2, 4, 6, 8])); const idx = r.map((_, i) => i).filter((i) => i > 0 && r[i - 1] > 0); if (!idx.length) r[0] = 5; const idx2 = r.map((_, i) => i).filter((i) => i > 0 && r[i - 1] > 0); return { type: 'number', q: `A fund returned ${r.join(', ')} (%) over six years. How many years are in scope for "positive, given positive the year before"?`, answer: idx2.length, hints: ['Look at years 2 to 6.', 'A year is in scope when the year before it was positive.'], explain: `Years ${idx2.map((i) => i + 1).join(', ')}: ${idx2.length} years.` }; } }] },
      { answers: 'risky', say: 'Sanity-check the order with the shape: the volatile fund should win statements about big gains or big losses, the steady fund statements about being positive.', why: 'A wider spread puts more years far from the centre on both sides.',
        checks: [mc(null, `Which is more likely in a random year: "${B.name} lost money" or "${A.name} lost money"?`, `"${B.name} lost money"`, [[`"${A.name} lost money"`, 'forgot that volatility fattens the loss side too, not only the gain side'], ['equally likely', 'judged by the average return instead of the spread']], `${bNeg} years against ${N - aPos}.`, { at: 1 })] },
    ] },
    { type: 'explain', prompt: 'Explain why the volatile fund can be more likely to return over 15% and also more likely to lose money than the steady fund.', model: 'Volatility is spread: the volatile fund\'s returns land far from their centre in both directions. So it has more very good years and more losing years, while the steady fund\'s returns stay in a narrow band just above zero, which makes it positive almost every year but never spectacular.', points: ['Spread pushes outcomes into both tails', 'The steady fund lives in a narrow positive band', 'Extreme statements favour spread; "positive" favours a positive centre with low spread'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'fund-returns', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Threshold and head-to-head statements. Count bars and order. Try it before opening the solution.' },
    { type: 'worked', section: 'll', family: 'fund-returns', difficulty: 4, seed: 'b', fade: 1, intro: 'A persistence or "both lost" statement is mixed in. The counts are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'A steady fund always returns 2% to 8%; a volatile one ranges from −20% to +30%. Which is more likely to be positive in a random year? Which is more likely to exceed 15%?', answer: 'Positive: the steady fund (always). Above 15%: the volatile fund (the steady one never gets there).', explain: 'Spread wins the tails; a positive centre with low spread wins "positive".' },

    S('traps'),
    { type: 'text', text: 'The traps split into two kinds. Counting slips: a boundary year at exactly the threshold, a year dropped while scanning. Scope slips: the persistence statement divided by every year. The first kind is fixed by counting the short side, the second by writing the scope down before counting.' },
    { type: 'traps', section: 'll', family: 'fund-returns', extra: [
      { belief: 'The persistence statement divides by all years.', fix: 'Only years whose previous year was positive are in scope; the first year never is.' },
      { belief: '"B beat A" is likely because B has the higher average.', fix: 'It is a year-by-year comparison; a volatile fund with a higher average can still lose most head-to-heads.' },
      { belief: 'The volatile fund is always the riskier bet for every statement.', fix: 'It wins statements about extremes (both big gains and big losses); the steady fund wins "positive".' },
      { belief: '"More than 10%" includes a 10% year.', fix: 'Strict: a year at exactly 10% does not count.' },
    ] },
    { type: 'erroneous', problem: `A candidate works out P(${A.name} positive | positive the year before) from the chart. One step is wrong.`, steps: [
      `${A.name} was positive in ${aPos} of the ${N} years.`,
      `Years that follow a positive year and are positive again: ${PA.hit}.`,
      `P = ${PA.hit}/${N} = ${dp(PA.hit / N, 1)}.`,
      `So it ranks below "${A.name} was positive" (${dp(aPos / N, 1)}).`,
    ], errorStep: 2, explain: `The scope is the ${PA.idx.length} years after a positive year: ${PA.hit}/${PA.idx.length} = ${dp(PA.hit / PA.idx.length, 2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'A fund had 6 positive years out of 10, and 4 of the 5 years after a positive year were positive. A candidate answers P(positive | positive the year before) = 4/10. Which belief?', 'The scope is all years', [['Persistence equals the plain rate', 'the candidate did not use 6/10 either'], ['The first year counts twice', 'no double counting happened'], ['"Positive" includes zero', 'no zero years are involved']], 'The scope is the 5 years after a positive year: 4/5.', { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Use the shape before counting. If one statement is about an extreme and another about being positive, the volatile and steady funds usually take one each, and a quick count only confirms it.' },
    { type: 'check', scope: 'shape before counting', questions: [
      { type: 'choice', q: '"Above +15%" and "positive": which fund usually wins each?', options: ['volatile for the extreme, steady for positive', 'steady for the extreme, volatile for positive', 'steady for both, since it never loses much'], answer: 0, traps: { 1: 'the steady fund rarely reaches an extreme year', 2: 'a steady fund misses the big years' }, explain: 'Big swings reach the extremes; small steady returns are positive more often.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'Count the short side: "positive in 8 of 10 years" is faster as "lost in 2". For "beat", scan for the years where the steady fund wins; there are usually few.' },
    { type: 'check', scope: 'counting the short side', questions: [
      { make: (rng) => again(() => { const s1 = thresholds(rng), s2 = thresholds(rng); if (s1.text === s2.text) return null; return rank(rng, 'From the chart, rank from most to least likely for a random year.', [[`${s1.text}.`, s1.k / N], [`${s2.text}.`, s2.k / N], [`${B.name} beat ${A.name}.`, bBeat / N]], 'Count each on its short side.'); }) },
    ] },
    { type: 'callout', tone: 'speed', text: `Budget: ${LL.exam.perItemSeconds} seconds. Ten years and three statements is thirty bar reads; with the shape check first you usually need only the one statement the shape does not decide.` },
    { type: 'check', scope: 'the time budget', questions: [
      { type: 'choice', q: 'Ten years, three statements. Which statements do you count bar by bar?', options: ['only the one the shape does not decide', 'all three, reading every bar', 'none: the shape decides all three'], answer: 0, traps: { 1: 'thirty bar reads waste the budget when the shape settles two', 2: 'the shape usually leaves one open' }, explain: 'Check the shape first; count only the statement it leaves open.' },
    ] },

    { type: 'thinkaloud', problem: `The same chart. Rank for a random year: (a) ${B.name} lost money, (b) ${A.name} returned more than 5%, (c) ${A.name} was positive, given it was positive the year before.`, lines: [
      { t: 0, say: 'Two funds by year: each statement is years that count over years in scope.' },
      { t: 6, say: `(a) ${B.name} below zero: ${bNeg} of ${N}.` },
      { t: 12, say: `(b) ${A.name} at 5% or more: ${ge5} years, so ${ge5}/${N}, above (a).`, slip: true },
      { t: 17, say: `Wait: "more than 5%" is strict. The ${ge5 - gt5} years at exactly 5% are out: ${gt5} of ${N}, below (a).` },
      { t: 25, say: `(c) persistence: ${PA.idx.length} years follow a positive ${A.name} year, ${PA.hit} of them positive again. ${PA.hit}/${PA.idx.length}, not over ${N}.` },
      { t: 31, say: `Order (c) > (a) > (b), with ${LL.exam.perItemSeconds - 31} seconds left.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine on fresh funds', questions: [
      { make: (rng) => again(() => { const f = pair(rng), pa = persistOf(f.a), v = rng.int(3, 6); if (pa.n < 3) return null; const neg = f.b.filter((x) => x < 0).length, gt = f.a.filter((x) => x > v).length;
        return rank(rng, `Returns (%) over 10 years. Calm: ${f.a.join(', ')}. Wild: ${f.b.join(', ')}. Rank for a random year from most to least likely.`, [['Wild lost money.', neg / 10], [`Calm returned more than ${v}%.`, gt / 10], ['Calm was positive, given it was positive the year before.', pa.hit / pa.n]], `Wild below zero: ${neg}/10. Calm strictly above ${v}: ${gt}/10. Persistence: ${pa.hit} of the ${pa.n} years after a positive year.`, { gap: 0.02 }); }) },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Fund chart → years in scope; count bars past the line (strict inequalities); "beat" = year-by-year; persistence divides by years after a positive year. Spread wins extremes, steadiness wins "positive".' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Which years count', 'Scope'], rows: [
      ['A positive', 'A\'s bar above 0', 'all years'],
      ['B above v%', 'B\'s bar above v', 'all years'],
      ['B beat A', 'B\'s bar above A\'s in that year', 'all years'],
      ['both lost', 'both bars below 0', 'all years'],
      ['A positive | positive the year before', 'A positive again', 'years after an A-positive year'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a fund that is never positive has no years in scope for persistence, so the statement has no meaning (items avoid this). A tie year does not count for "beat".' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'Two funds with the same average: one with a wide spread, one narrow. Which is more likely to lose more than 10% in a random year?', 'the wide one', [['the narrow one', 'reversed: a narrow spread keeps returns near the average'], ['equally likely', 'the same average does not mean the same tails']], 'Spread puts more years in both tails.', { at: 0 }),
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: large-number statements, where a small hospital, like a volatile fund, has more extreme days. Also density curves (a wide curve has fatter tails) and Markov chains (the state last step changes what happens next).' },
    { type: 'variation', base: `The challenge: (a) ${A.name} positive ${aPos}/${N}, (b) ${B.name} above 10% ${bGt10}/${N}, (c) ${B.name} beat ${A.name} ${bBeat}/${N}. Order (a) > (c) > (b).`, rows: [
      { same: true, change: 'Shuffle the order of the years', effect: 'No change. A random year treats every year alike, and "beat" compares within one year. (A persistence statement would change: it depends on which year comes before which.)' },
      { change: `Change (b) to "${B.name} returned more than 10% or less than −10%"`, effect: `Both tails now count: ${bExt}/${N}. Volatility wins extremes on both sides, so (b) climbs from last to second.` },
      { change: 'Change (c) to "both funds lost money"', effect: `Both bars must be below zero: ${bothNeg}/${N}. ${A.name} rarely loses, so (c) falls to last.` },
      { fusion: true, change: `Add 5 points to every ${B.name} return, and raise the line in (b) to 15%`, effect: `For (b) the two changes cancel: ${B.name} + 5 > 15 is ${B.name} > 10, still ${bGt10}/${N}. (c) gains only years where ${B.name} trailed by less than 5 points: ${trail5}, so ${bBeat5}/${N}.` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => again(() => { const f = pair(rng), v = rng.pick([5, 10]); const pos = f.a.filter((x) => x > 0).length, gt = f.b.filter((x) => x > v).length, beat = f.b.filter((x, i) => x > f.a[i]).length;
        return rank(rng, `Daily P&L (k€) of two traders over 10 days. Ann: ${f.a.join(', ')}. Bob: ${f.b.join(', ')}. Rank for a random day from most to least likely.`, [['Ann made money.', pos / 10], [`Bob made more than ${v}k.`, gt / 10], ['Bob beat Ann.', beat / 10]], `Ann positive ${pos}/10; Bob strictly above ${v}: ${gt}/10; Bob above Ann day by day: ${beat}/10.`, { gap: 0.02 }); }) },
      far: { make: farT },
      principle: mc(null, 'Which idea carried over from the fund chart to the weather log?', 'Scope = the steps right after a qualifying one; count hits among those', [
        ['Divide the rainy days that follow rain by every day in the log', 'the first day has no day before, and days after a dry day are not in scope'],
        ['Yesterday cannot matter, so use the plain share of rainy days', 'that answers P(rain), ignoring the condition'],
        ['Count the rainy days, then divide by the days before each of them', 'the scope is the days after a rainy day, not the days before one'],
      ], '"Given positive the year before" and "given rain the day before" both keep only the steps that follow a qualifying one.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'fund-returns', count: 3 },
  ],
};
