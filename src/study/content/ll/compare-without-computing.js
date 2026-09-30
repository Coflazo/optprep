// Likelihood List opening lesson: rank without computing. Dominance (A implies B), AND ≤ part ≤ OR,
// reading the scope of a table, bounds at 0 and 1, rough buckets, and when an exact count is needed.
// This file also exports the small helpers every ll lesson uses, so every number shown is computed.
import { SECTION_TITLES } from '../../schema.js';
import { SECTIONS } from '../../../../config/sections.js';
import { Q } from '../../../core/rational.js';

// ---- shared helpers (pure) ----
export const LL = SECTIONS.ll;
export const S = (key, title) => ({ type: 'section', key, title: title ?? SECTION_TITLES[key] });
export const fr = (n, d = 1) => Q.of(n, d).toString();
export const num = (x) => (x instanceof Q ? x.toNumber() : x);
export const dp = (x, k = 3) => num(x).toFixed(k);
export const pc = (x, k = 0) => `${(num(x) * 100).toFixed(k)}%`;
export const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
export const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= Math.min(k, n - k); i++) r = (r * (n - Math.min(k, n - k) + i)) / i; return Math.round(r); };
export const again = (f) => { for (let i = 0; i < 400; i++) { const r = f(); if (r) return r; } throw new Error('generator could not build a question'); };

// Choice question; wrongs = [[value, false belief]]. With an rng the options are shuffled,
// otherwise the right answer's slot is a fixed hash of the question text, so static checks do not
// always put it first (extra.at is accepted and ignored). Duplicates are dropped.
export function mc(rng, q, right, wrongs, explain, extra = {}) {
  const rest = { ...extra };
  delete rest.at;
  const seen = new Set([String(right)]);
  const wrong = [];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && wrong.length < 5) { seen.add(String(t)); wrong.push({ t: String(t), trap }); }
  let opts;
  if (rng) opts = rng.shuffle([{ t: String(right), ok: true }, ...wrong]);
  else { opts = [...wrong]; opts.splice([...q].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7) % (opts.length + 1), 0, { t: String(right), ok: true }); }
  const traps = Object.fromEntries(opts.flatMap((o, i) => (o.trap ? [[i, o.trap]] : [])));
  return { type: 'choice', q, options: opts.map((o) => o.t), answer: opts.findIndex((o) => o.ok), ...(Object.keys(traps).length ? { traps } : {}), explain, ...rest };
}

// Ranking question (the Likelihood List task itself): entries [[text, p]], shown shuffled (rng)
// or as given; answer lists indices from most to least likely. Returns null when two values are
// closer than `gap`, so generators can retry; static callers use rankFixed, which throws instead.
export function rank(rng, q, entries, explain, extra = {}) {
  const { gap = 1e-9, ...rest } = extra;
  let shown = rng ? rng.shuffle(entries) : entries;
  const order = (xs) => xs.map((_, i) => i).sort((a, b) => num(xs[b][1]) - num(xs[a][1]));
  let answer = order(shown);
  if (!rng && answer.every((v, i) => v === i)) { shown = [shown[1], shown[0], ...shown.slice(2)]; answer = order(shown); }
  for (let i = 1; i < answer.length; i++) if (!(num(shown[answer[i - 1]][1]) - num(shown[answer[i]][1]) >= gap)) return null;
  return { type: 'order', q, items: shown.map((e) => e[0]), answer, explain, ...rest };
}
export const rankFixed = (...a) => { const r = rank(null, ...a); if (!r) throw new Error(`rank tie: ${a[0]}`); return r; };
export const ordered = (entries) => [...entries].sort((a, b) => num(b[1]) - num(a[1]));

// ---- this lesson's numbers ----
const ORDERS = fact(3);
const pairs = (f) => { let h = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (f(a, b)) h++; return h; };
const SIX = pairs((a, b) => a === 6 || b === 6), GE9 = pairs((a, b) => a + b >= 9), S12 = pairs((a, b) => a + b === 12);
const T = { tc: 12, tn: 18, nc: 13, nn: 57 };
T.tot = T.tc + T.tn + T.nc + T.nn; T.trader = T.tc + T.tn; T.chess = T.tc + T.nc; T.or = T.tot - T.nn;
const COIN10 = { atLeastOne: Q.of(1024 - 1, 1024), five: Q.of(C(10, 5), 1024), none: Q.of(1, 1024) };

// Two-way table generator shared by the checks below.
const table = (rng) => { const tc = rng.int(5, 25), tn = rng.int(5, 25), nc = rng.int(5, 25), nn = rng.int(10, 40); return { tc, tn, nc, nn, tot: tc + tn + nc + nn, trader: tc + tn, chess: tc + nc }; };
const tableText = (t) => `Of ${t.tot} staff, ${t.trader} are traders, ${t.chess} play chess, and ${t.tc} are traders who play chess.`;

const andOrRank = (rng) => again(() => { const t = table(rng); return rank(rng, `${tableText(t)} One staff member is picked at random. Rank from most to least likely (use containment, not arithmetic).`, [
  ['The person is a trader.', Q.of(t.trader, t.tot)],
  ['The person is a trader who plays chess.', Q.of(t.tc, t.tot)],
  ['The person is a trader or plays chess (or both).', Q.of(t.tot - t.nn, t.tot)],
], `"Trader and chess" sits inside "trader", which sits inside "trader or chess": ${t.tot - t.nn} ≥ ${t.trader} ≥ ${t.tc} out of ${t.tot}.`); });

const andBound = (rng) => {
  const a = rng.int(3, 7) / 10, b = rng.int(2, Math.round(a * 10) - 1) / 10, lo = Math.max(0, a + b - 1);
  const ok = Math.round((lo + (b - lo) * rng.pick([0.3, 0.5, 0.7])) * 100) / 100;
  return mc(rng, `P(A) = ${a}, P(B) = ${b}. Which value is possible for P(A and B)?`, String(ok), [
    [String(Math.round((b + 0.05) * 100) / 100), `believed AND can beat its smaller part: P(A and B) ≤ P(B) = ${b}`],
    [String(Math.round((a + 0.05) * 100) / 100), `believed the joint event can be larger than both parts`],
    [String(Math.round((a + b) * 100) / 100), 'added the two, which is the most P(A or B) could be, not P(A and B)'],
  ], `"A and B" happens only when B happens, so P(A and B) ≤ ${b}. ${ok} is below that.`, { hinge: true });
};

const crossMul = (rng) => again(() => {
  const a = rng.int(3, 19), b = rng.int(a + 2, 40), c = rng.int(3, 19), d = rng.int(c + 2, 40);
  if (a * d === b * c || Math.abs(a / b - c / d) > 0.06 || Math.abs(a / b - c / d) < 0.003) return null;
  const big = a * d > b * c ? `${a}/${b}` : `${c}/${d}`;
  return mc(rng, `Two statements are close: ${a}/${b} against ${c}/${d}. Which is larger?`, big, [
    [a * d > b * c ? `${c}/${d}` : `${a}/${b}`, 'compared numerators or denominators alone instead of cross-multiplying'],
    ['They are equal', 'rounded both to the same bucket and stopped: close is not equal'],
  ], `Cross-multiply: ${a} × ${d} = ${a * d} against ${c} × ${b} = ${b * c}.`, { hints: ['Compare a × d with c × b.'] });
});

export default {
  id: 'll/compare-without-computing',
  book: 'll',
  kind: 'foundation',
  title: 'Rank without computing',
  summary: 'Bounds, containment and rough sizes order most triples; compute exactly only the pair that is still close.',
  prerequisites: ['prob/sample-spaces', 'prob/complement', 'prob/inclusion-exclusion', 'assessment/six-tasks'],
  objectives: [
    'Say how a Likelihood List item is scored and what a partly right order earns',
    'Order two statements with no arithmetic when one implies the other (AND ≤ part ≤ OR)',
    'Name the scope (denominator) of a table or chart statement before counting',
    'Place a statement in a rough bucket (0, rare, unlikely, about even, likely, 1) in seconds',
    'Decide which pair, if any, needs an exact comparison, and do it by cross-multiplying',
  ],
  blocks: [
    S('task', 'The task'),
    { type: 'challenge', q: 'Before any teaching: two fair dice are thrown. Rank these from most to least likely: (a) the sum is 12, (b) at least one die shows a six, (c) the sum is at least 9. Try two different approaches.', answer: `(b) ${SIX}/36 > (c) ${GE9}/36 > (a) ${S12}/36`, explain: `(a) is obviously rare: one cell of 36. (b) and (c) look alike, and no shortcut separates them: you have to count, ${SIX} against ${GE9}. That split, most of the order for free and one close pair counted, is the whole method of this lesson.` },
    { type: 'text', text: `Likelihood List shows a scenario (a table, a chart, a graph, or just words) and three statements. You order the statements from most to least likely. There are ${LL.exam.count} items, ${LL.exam.perItemSeconds} seconds each, and ${LL.exam.navigation === 'forward' ? 'you cannot go back to an earlier item' : 'you may go back'}. Scoring: ${LL.blurb.split('. ').slice(1).join('. ')}` },
    { type: 'check', scope: 'the format and exact-order scoring', questions: [
      { type: 'number', q: 'In how many different orders can three statements be ranked?', answer: ORDERS, hints: ['Choose the top one, then the middle one.'], explain: `3 choices for the top, 2 for the middle, 1 left: ${ORDERS}.` },
      mc(null, 'You are sure which statement is most likely and have no idea about the other two. What is your chance of scoring the point?', '1/2', [
        [`1/${ORDERS}`, 'treated all orders as possible, but the top is already fixed'],
        ['2/3', 'thought getting two of three positions right earns partial credit'],
        ['1', 'thought the top statement alone scores the point'],
      ], 'Only the exact order scores. With the top fixed, the other two can go two ways: 1/2.', { at: 1 }),
    ] },

    S('dominance', 'Dominance: when one statement contains another'),
    { type: 'text', text: 'If every outcome that makes A true also makes B true (A **implies** B), then P(A) ≤ P(B). No numbers needed: B happens every time A does, and possibly more. "The sum is 12" implies "the sum is at least 9", so the first can never be the more likely.' },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['sum is 12', 'sum at least 9'], regions: { A: 0, B: GE9 - S12, AB: S12, none: 36 - GE9 }, total: 36 }, caption: `The circle "sum is 12" has nothing outside "sum at least 9": its private region is 0. Containment shows up as an empty private region, and it orders the two without counting (${S12} ≤ ${GE9}).` },
    { type: 'check', scope: 'A implies B gives P(A) ≤ P(B)', questions: [
      mc(null, 'Two dice. Which pair can you order without counting anything?', '"the sum is 7" and "the sum is odd"', [
        ['"the sum is 7" and "the sum is 8"', 'these never happen together, so neither contains the other: you must count'],
        ['"at least one six" and "the sum is at least 9"', 'they overlap, but each can happen without the other'],
        ['"the first die is 6" and "the sum is 10"', '(6,3) is in the first and not the second; (4,6) the other way round'],
      ], '7 is odd, so "sum is 7" implies "sum is odd": P(sum 7) ≤ P(odd).', { at: 2 }),
      { make: (rng) => { const a = rng.int(2, 6) / 10, hi = Math.round((a + rng.int(1, 3) / 10) * 10) / 10; return mc(rng, `Every trader at a firm also codes in Python. P(a random employee is a trader) = ${a}. Which value could P(the employee codes in Python) take?`, String(hi), [[String(Math.round((a - 0.1) * 10) / 10), `put the containing event below ${a}: every trader codes, so the coders are at least as likely`], [String(Math.round(a * a * 100) / 100), 'multiplied as if the two were independent events to be combined']], `Trader implies Python, so P(Python) ≥ ${a}. Only ${hi} is at least ${a}.`); } },
    ] },

    S('conjunction', 'AND never beats its parts, OR never loses to them'),
    { type: 'text', text: '"A and B" implies A, and A implies "A or B". So the chain below holds for **any** two events, whatever story comes with them. A detailed description that makes "trader who plays chess" feel typical does not change it: adding a condition can only remove outcomes. That illusion is the conjunction fallacy (the Linda problem).' },
    { type: 'formula', text: 'P(A and B) ≤ P(A) ≤ P(A or B)' },
    { type: 'check', scope: 'AND ≤ part ≤ OR', questions: [
      { make: andOrRank },
      { hinge: true, make: andBound },
    ] },

    S('scope', 'Tables and charts: numerator and scope'),
    { type: 'text', text: 'With a table or chart, every statement is a fraction: (outcomes that qualify) / (outcomes in scope). The wording names the scope. "A randomly chosen employee" means everyone. "A randomly chosen trader" or "among traders" means only the trader row: the denominator shrinks.' },
    { type: 'diagram', diagram: 'table', spec: { caption: `${T.tot} staff`, columns: ['', 'Plays chess', 'No chess', 'Total'], rows: [['Trader', T.tc, T.tn, T.trader], ['Not a trader', T.nc, T.nn, T.nc + T.nn], ['Total', T.chess, T.tn + T.nn, T.tot]] }, caption: `"Trader and plays chess" is one cell over everyone: ${T.tc}/${T.tot}. "A trader who plays chess, among traders" is the same cell over its row: ${T.tc}/${T.trader}. Same numerator, smaller scope, bigger probability.` },
    { type: 'check', scope: 'reading the scope from the wording', questions: [
      { type: 'number', q: `From the table: a randomly chosen trader is picked. What is P(plays chess)? (decimal)`, answer: T.tc / T.trader, tolerance: 0.005, hints: ['The scope is the trader row only.', `Cell over row total.`], explain: `${T.tc} of the ${T.trader} traders: ${dp(T.tc / T.trader, 2)}.` },
      mc(null, 'Which statement has the smallest denominator?', '"Among chess players, a random one is a trader."', [
        ['"A random staff member is a trader who plays chess."', 'the scope is everyone: this uses the grand total'],
        ['"A random staff member is a trader or plays chess."', 'the scope is everyone; only the numerator is large'],
      ], `"Among chess players" restricts the scope to the ${T.chess} chess players, fewer than the ${T.tot} staff.`, { at: 2 }),
    ] },
    { type: 'callout', tone: 'idea', text: 'Same numerator, smaller scope → larger fraction. So a conditional "B among A" is never less likely than the joint "A and B": P(B | A) ≥ P(A and B). But a conditional has no fixed relation to P(B) itself; that pair needs a count.' },
    { type: 'check', scope: 'conditional against joint and single', questions: [
      { make: (rng) => { const t = table(rng); return mc(rng, `${tableText(t)} Which is guaranteed without counting?`, 'P(chess | trader) ≥ P(trader and chess)', [['P(chess | trader) ≥ P(chess)', 'a conditional can be smaller or larger than the plain probability: it depends on the counts'], ['P(trader and chess) ≥ P(chess | trader)', 'reversed: the joint divides the same cell by the larger total'], ['P(chess | trader) = P(trader | chess)', 'the two conditionals divide by different totals (row against column)']], `Both are the cell ${t.tc} on top; the conditional divides by ${t.trader}, the joint by ${t.tot}.`); } },
    ] },

    S('bounds', 'Bounds: pin statements to 0 or 1 first'),
    { type: 'text', text: 'Some statements sound plausible and are impossible: they need more successes than there are trials, an odd difference from an even total, a sum no dice can make. Others are guaranteed by what has already happened. Probability 0 goes last and 1 goes first, with no estimate at all. Check this before anything else.' },
    { type: 'check', scope: 'impossible and certain by counting', questions: [
      { make: (rng) => { const n = rng.pick([50, 100]), made = n - rng.int(3, 8), k = rng.pick([20, 50]), tot = n + k, need = made + k + rng.int(1, 3), pct = Math.ceil((1000 * need) / tot) / 10; return mc(rng, `A shooter has made ${made} of ${n} free throws and takes ${k} more. How likely is she to finish the ${tot} shots with at least ${pct}% made?`, 'Impossible: probability 0', [['Unlikely but possible', `did not check the bound: at most ${made} + ${k} = ${made + k} makes are possible`], ['About even', 'judged by how good the shooter is instead of counting what is still reachable'], ['Certain', 'confused the target with a guaranteed one']], `${pct}% of ${tot} needs at least ${Math.ceil((pct * tot) / 100 - 1e-9)} makes; she can reach at most ${made + k}.`, { hints: ['How many makes does the percentage need?', 'How many can she still reach?'] }); } },
    ] },
    { type: 'text', text: `A rough scale does the rest. Put each statement in a bucket: 0, rare (under 0.05), unlikely (0.05 to 0.3), about even (0.3 to 0.7), likely (0.7 to 1), or 1. The challenge triple sits like this: sum 12 is rare; the other two are both near 0.3, in the same bucket.` },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 1, step: 0.1, marks: [{ x: S12 / 36, label: 'sum 12' }, { x: (GE9 + SIX) / 72, label: 'sum ≥ 9, a six' }], barriers: [0.05, 0.3, 0.7] }, caption: `Bars mark the bucket edges 0.05, 0.3 and 0.7. "Sum 12" (${dp(S12 / 36, 3)}) is alone in the rare bucket; "sum ≥ 9" (${dp(GE9 / 36, 3)}) and "a six" (${dp(SIX / 36, 3)}) share a bucket, so only they need an exact count.` },
    { type: 'check', scope: 'rough buckets', questions: [
      { make: (rng) => { const n = rng.pick([1, 2, 3, 4, 8, 10, 12]); const p = 1 - (5 / 6) ** n; const b = p < 0.05 ? 'rare (under 0.05)' : p < 0.3 ? 'unlikely (0.05 to 0.3)' : p < 0.7 ? 'about even (0.3 to 0.7)' : 'likely (0.7 to 1)'; return mc(rng, `P(at least one six in ${n} throws of a die) lies in which bucket?`, b, [['rare (under 0.05)', 'confused "at least one" with "all sixes"'], ['unlikely (0.05 to 0.3)', 'used one throw only: 1/6'], ['about even (0.3 to 0.7)', `under-counted the complement: 1 − (5/6)^${n}`], ['likely (0.7 to 1)', 'added 1/6 per throw and rounded up']].filter(([v]) => v !== b), `1 − (5/6)^${n} = ${dp(p)}.`, { hints: ['Use the complement: no six in any throw.', `(5/6)^${n}, then subtract from 1.`] }); } },
    ] },

    S('exact', 'When you must compute exactly'),
    { type: 'text', text: 'Compute only when two statements share a bucket and no containment separates them. Then compute just those two, as fractions, and compare by cross-multiplying: a/b is larger than c/d exactly when a × d is larger than c × b. No decimals, no common denominator.' },
    { type: 'check', scope: 'cross-multiplication', questions: [{ make: crossMul }] },
    { type: 'erroneous', problem: 'A candidate ranks three statements about a randomly chosen staff member at a firm where 30% are traders, 25% play chess and 12% are traders who play chess. One step is wrong.', steps: [
      'Bounds: none of the three statements is impossible or certain.',
      '"Trader or chess player" contains "trader", so it goes above it.',
      '"Trader who plays chess" fits a quiet puzzle lover best, so it goes above "trader".',
      'Order: trader or chess > trader who plays chess > trader.',
    ], errorStep: 2, explain: 'Step 3 ranks by how well the story fits, not by containment. "Trader who plays chess" implies "trader", so it can never be above it: 12% against 30%. The right order is OR > trader > AND.' },
    { type: 'explain', prompt: 'Explain to a friend why "A and B" can never be more likely than A, even when the description makes "A and B" sound more typical.', model: 'Every outcome where A and B both happen is an outcome where A happens, so the "A and B" outcomes are a subset of the A outcomes. A subset cannot carry more probability than the set that contains it. The description is just information about a randomly chosen case; it cannot add outcomes to "A and B" that are not already in A.', points: ['"A and B" outcomes are a subset of the A outcomes', 'A subset has at most the probability of the whole set', 'A plausible story changes how typical it feels, not which outcomes it contains'] },

    S('routine', 'The 90-second routine'),
    { type: 'diagram', diagram: 'flow', spec: { root: 'b', nodes: [
      { id: 'b', text: '1. Bounds: any statement impossible (0) or certain (1)?', kind: 'q' },
      { id: 'c', text: '2. Containment: does one imply another? AND ≤ part ≤ OR', kind: 'q' },
      { id: 'e', text: '3. Buckets: rough size of each statement', kind: 'q' },
      { id: 'x', text: '4. Exact count only for a pair still in one bucket', kind: 'q' },
      { id: 'd', text: 'Submit the order', kind: 'a' },
    ], edges: [{ from: 'b', to: 'c' }, { from: 'c', to: 'e' }, { from: 'e', to: 'x', label: 'a tie remains' }, { from: 'e', to: 'd', label: 'all separated' }, { from: 'x', to: 'd' }] }, caption: 'Cheapest test first. Most items are settled by step 2 or 3; step 4 is for one pair at most.' },
    { type: 'callout', tone: 'speed', text: `Budget per item: ${LL.exam.perItemSeconds} seconds. Spend the first few seconds on bounds and containment (free order), a few more placing buckets, and keep the rest for one exact comparison. Unused seconds do not carry over, so use them to double-check the close pair.` },
    { type: 'check', scope: 'the order of the routine', questions: [
      { type: 'order', q: 'Put the routine in the order you run it (first at the top).', items: ['Place each statement in a rough bucket', 'Check for statements that are impossible or certain', 'Compute exactly the pair that shares a bucket', 'Look for containment between statements'], answer: [1, 3, 0, 2], explain: 'Bounds, containment, buckets, then exact counting for the close pair only: cheapest test first.' },
    ] },

    S('predict'),
    { type: 'predict', question: 'Ten fair coin flips. Rank "at least one head", "exactly 5 heads" and "no heads". Which of them needs an exact calculation?', answer: `None: at least one head is ${dp(COIN10.atLeastOne)} (likely), exactly 5 is ${dp(COIN10.five)} (unlikely), no heads is ${dp(COIN10.none, 4)} (rare). Three different buckets.`, explain: 'When the buckets differ, the order is already decided.' },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Bounds (0 or 1) → containment (A implies B; AND ≤ part ≤ OR) → rough buckets → exact comparison only for the pair still close (cross-multiply).' },

    S('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: andOrRank }, { make: andBound }, { make: crossMul }] },
  ],
};
