// Likelihood List family: score tables. One row per student; each statement is
// (qualifying rows) / (rows in scope). AND = min over the subjects, OR = max, average = sum ≥ 3v,
// and "among students who ..." shrinks the scope. Every number is computed here.
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const SUB = ['Maths', 'Physics', 'Economics'];
const ROWS = [['Ava', 82, 75, 68], ['Ben', 64, 58, 71], ['Chen', 91, 88, 79], ['Dara', 55, 71, 62], ['Eli', 73, 69, 80], ['Farah', 88, 92, 85], ['Gus', 47, 52, 58], ['Hana', 69, 81, 74], ['Ivo', 77, 64, 66], ['Jade', 95, 90, 87]];
const N = ROWS.length;
const st = ROWS.map(([name, m, p, e]) => ({ name, Maths: m, Physics: p, Economics: e }));
const cnt = (f, rows = st) => rows.filter(f).length;
const ge = (s, v) => (r) => r[s] >= v;
const both = (a, b, v) => (r) => Math.min(r[a], r[b]) >= v;
const either = (a, b, v) => (r) => Math.max(r[a], r[b]) >= v;
const V = [60, 65, 70, 75, 80, 85];

// Challenge and derivation numbers.
const M70 = cnt(ge('Maths', 70)), MP70 = cnt(both('Maths', 'Physics', 70)), EI70 = cnt(either('Maths', 'Physics', 70));
const M80 = st.filter(ge('Maths', 80)), P80gM80 = cnt(ge('Physics', 80), M80);
const AVG75 = cnt((r) => r.Maths + r.Physics + r.Economics >= 225);
const GT = cnt((r) => r.Maths > r.Physics);

// Think-aloud: (a) Physics ≥ 70, (b) among Physics ≥ 80, Maths ≥ 80, (c) average ≥ 75.
const P70 = cnt(ge('Physics', 70)), P80 = st.filter(ge('Physics', 80)), M80gP80 = cnt(ge('Maths', 80), P80), MP80 = cnt(both('Maths', 'Physics', 80));
const AVA = st.find((r) => r.Maths + r.Physics + r.Economics === 225);
const TL = { a: P70 / N, b: M80gP80 / P80.length, c: AVG75 / N };
// Variation: either instead of both; a stricter threshold in (a); the conditional built from (a) and (b).
const M90 = cnt(ge('Maths', 90)), CgA = MP70 / M70;
if (!(TL.b > TL.a && TL.a > TL.c && MP80 / N < TL.c && AVA && EI70 / N > P80gM80 / M80.length && M90 < MP70 && CgA > MP70 / N)) throw new Error('score-table: prose orders no longer hold');

// Transfer: near = a sales table with fresh rows; far = two dice with a restricted scope.
const NAMES = ['Ana', 'Bo', 'Cy', 'Di', 'Ed', 'Fay', 'Gil', 'Hal'];
const nearT = (rng) => again(() => {
  const rows = NAMES.map((n) => [n, rng.int(4, 16), rng.int(4, 16)]), v = rng.int(8, 11), a = rng.int(10, 12), b = rng.int(9, 12);
  const g = rows.filter((r) => r[1] >= a); if (g.length < 2) return null;
  return rank(rng, `Deals closed per salesperson (Q1/Q2): ${rows.map((r) => `${r[0]} ${r[1]}/${r[2]}`).join(', ')}. Rank from most to least likely.`, [
    [`A randomly chosen salesperson closed at least ${v} deals in Q1.`, rows.filter((r) => r[1] >= v).length / 8],
    [`A randomly chosen salesperson closed at least ${v} in both quarters.`, rows.filter((r) => Math.min(r[1], r[2]) >= v).length / 8],
    [`Among those with at least ${a} in Q1, a random one closed at least ${b} in Q2.`, g.filter((r) => r[2] >= b).length / g.length],
  ], `"Both" sits inside "Q1" over all 8. The conditional divides by the ${g.length} with Q1 ≥ ${a}: ${g.filter((r) => r[2] >= b).length}/${g.length}.`, { gap: 0.02 });
});
const farT = (rng) => { const a = rng.int(3, 5), t = rng.int(8, 10); let k = 0; for (let x = a; x <= 6; x++) for (let y = 1; y <= 6; y++) if (x + y >= t) k++; const n = 6 * (7 - a);
  return { type: 'number', q: `Two fair dice are thrown. Given that the first die shows at least ${a}, what is P(the sum is at least ${t})? (2 decimals)`, answer: k / n, tolerance: 0.006, hints: [`The scope is the rows where the first die is ${a} or more: ${7 - a} × 6 = ${n} outcomes.`, `Count the pairs in that scope with sum ≥ ${t}.`], explain: `${k} of the ${n} outcomes in scope: ${dp(k / n, 2)}. Dividing by 36 would be the whole-class mistake.` }; };

export default {
  id: 'll/score-table',
  book: 'll',
  kind: 'family',
  family: 'score-table',
  title: 'Score tables',
  summary: 'Count rows; "both" is the minimum, "either" the maximum; "among students who ..." shrinks the denominator.',
  prerequisites: ['ll/compare-without-computing', 'll/conjunction'],
  objectives: [
    'Turn any statement about a score table into qualifying rows over rows in scope',
    'Tally "both", "either", "higher in A than B" and "average at least v" in one pass',
    'Order AND, single and OR conditions by containment before counting',
    'Use the subgroup size as the denominator for "among students who ..." statements',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: the table shows ${N} students' scores (Maths, Physics, Economics): ${ROWS.map((r) => `${r[0]} ${r.slice(1).join('/')}`).join(', ')}. Rank: (a) a random student scored at least 70 in Maths, (b) at least 70 in both Maths and Physics, (c) among students with at least 80 in Maths, a random one scored at least 80 in Physics.`, answer: `(c) ${P80gM80}/${M80.length} > (a) ${M70}/${N} > (b) ${MP70}/${N}`, explain: `(b) sits inside (a): no count needed for that pair. (c) picks only from the ${M80.length} strong mathematicians, and ${P80gM80} of them are strong in Physics: ${dp(P80gM80 / M80.length, 2)}. If you divided (c) by ${N}, you counted the right rows over the wrong scope.`,
      attempts: [
        { id: 'average', label: 'Compare average scores', approach: 'You compared the typical Maths score with 70 instead of counting students.', breaksAt: 'A random student makes each row equally likely, so the probability is a count of qualifying rows, not a typical score.' },
        { id: 'easy', label: 'Both is easy if Physics is', approach: 'You put (b) level with or above (a), since good mathematicians tend to do well in Physics too.', breaksAt: '"Both" keeps only the Maths rows that also pass Physics: a subset over the same class.' },
        { id: 'wholeclass', label: 'Divide (c) by the class', approach: `You scored (c) as ${P80gM80}/${N}: the right rows over all ${N} students.`, breaksAt: `(c) picks only from the ${M80.length} students with Maths ≥ 80, so that is the denominator.` },
      ] },
    { type: 'text', text: 'The prompt is a **table with one row per student** and a score per subject. One student is picked at random, or from a subgroup ("among students who ..."). Statements set thresholds: at least v in a subject, below v, at least v in **both** of two subjects, in **either**, higher in one subject than another, or an **average** of at least v.' },
    { type: 'text', text: 'Not this lesson: a 2 × 2 table of counts (two-way tables), where you read cells instead of counting rows, and match results (football), where each row is a match.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Which prompt belongs to this lesson?', 'A table of 12 students with a Maths and a Physics score each', [
        ['A table: 40 people who trade or not, by chess or not', 'a 2 × 2 count table: read cells (two-way tables)'],
        ['A table of 12 match results with home and away goals', 'each row is a match: football results'],
        ['A bar chart of how many interns chose each language', 'counts drawn as bars: survey bar charts'],
      ], 'One row per student, one column per subject: count rows.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Score tables are a reported Likelihood List scenario. With ten or more rows and three statements, counting everything three times eats the clock. The fast route counts each row once, uses containment to skip counts, and takes the denominator from the wording. The trap the item is built around is the denominator of the "among students who ..." statement.' },

    S('anchor'),
    { type: 'text', text: 'Favourable over total with equally likely outcomes is the rule you already trust. The one change: the outcomes are **rows**. A random student makes every row equally likely, so every statement is (rows that qualify) / (rows in scope). The words before the condition name the scope: "a randomly chosen student" is every row, "among students who ..." is only the rows that pass that first test.' },
    { type: 'check', scope: 'rows as equally likely outcomes', questions: [
      { make: (rng) => { const v = rng.pick(V); const s = rng.pick(SUB); const k = cnt(ge(s, v)); return { type: 'number', q: `Using the ${N}-student table above (in the challenge): P(a random student scored at least ${v} in ${s})? (2 decimals)`, answer: k / N, tolerance: 0.006, hints: [`Count the ${s} scores that are ${v} or more.`, `Divide by ${N}.`], explain: `${k} of the ${N} rows: ${dp(k / N, 2)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'The table itself. Read it column by column: each threshold statement is a tally down one column.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Exam scores', columns: ['Student', ...SUB], rows: ROWS }, caption: `${N} rows, each picked with probability 1/${N}. A threshold such as "at least 70 in Maths" is a tally of the Maths column: ${M70} rows.` },
    { type: 'check', scope: 'tallying one column', questions: [
      { make: (rng) => { const v = rng.pick(V); const k = N - cnt(ge('Physics', v)); return { type: 'number', q: `From the table: how many students scored below ${v} in Physics?`, answer: k, hints: ['"Below" excludes the threshold itself.'], explain: `${N} − ${cnt(ge('Physics', v))} (at least ${v}) = ${k}.` }; } },
    ] },
    { type: 'text', text: 'To count "both" and "either" fast, shade every score that clears the threshold. A row counts for "both" when both of its cells are shaded and for "either" when at least one is. In one line: "both" tests the **smaller** of the two scores, "either" the **larger**.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: N, cols: 3, rowLabels: ROWS.map((r) => r[0][0]), colLabels: SUB.map((s) => s.slice(0, 4)), rowTitle: 'student', colTitle: 'subject', cellText: ROWS.map((r) => r.slice(1)), highlight: st.flatMap((r, i) => SUB.map((s, j) => (r[s] >= 70 ? [i, j] : null)).filter(Boolean)), count: st.reduce((a, r) => a + SUB.filter((s) => r[s] >= 70).length, 0) }, caption: `Shade every score of at least 70. "Both Maths and Physics" is a row with both of its first two cells shaded (${MP70} rows); "either" is a row with at least one of them shaded (${EI70} rows).` },
    { type: 'check', scope: 'both = min, either = max', questions: [
      { make: (rng) => { const v = rng.pick(V); const k = cnt(both('Maths', 'Physics', v)); return { type: 'number', q: `How many students scored at least ${v} in both Maths and Physics?`, answer: k, hints: ['A row qualifies when its smaller score of the two reaches the threshold.'], explain: `Rows whose lower score of Maths and Physics is at least ${v}: ${k}.` }; } },
      { make: (rng) => { const v = rng.pick(V); const k = cnt(either('Maths', 'Economics', v)); return { type: 'number', q: `How many scored at least ${v} in Maths or Economics (or both)?`, answer: k, hints: ['A row qualifies when its larger score of the two reaches the threshold.'], explain: `Rows whose higher score of Maths and Economics is at least ${v}: ${k}.` }; } },
    ] },
    { type: 'text', text: 'Now draw the two tallies as sets. The containment from two-way tables reappears: the rows that clear both thresholds form the lens, the lens sits inside each single-subject circle, and each circle sits inside the union.' },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['Maths ≥ 70', 'Physics ≥ 70'], regions: { A: M70 - MP70, B: EI70 - M70, AB: MP70, none: N - EI70 }, total: N }, caption: `The two tallies as sets: the lens is "both" (${MP70}), the Maths circle holds ${M70}, the union is "either" (${EI70}). Both ⊂ Maths ⊂ either, in every table.` },
    { type: 'check', scope: 'containment of both, single, either', questions: [
      mc(null, 'Without counting: which can never be the most likely of "≥ 70 in both", "≥ 70 in Maths", "≥ 70 in Maths or Physics"?', '"≥ 70 in both"', [
        ['"≥ 70 in Maths or Physics"', 'reversed: the union contains the other two'],
        ['"≥ 70 in Maths"', 'Maths alone can be the most likely only in a tie with the union, when no one is strong in Physics only'],
      ], '"Both" is inside "Maths", which is inside "either": it is at most the least of them.', { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves turn any statement into a count. The first fixes what a probability means here, the second saves counts, the third fixes the denominator of the trap statement, and the fourth handles averages without a single division.' },
    { type: 'steps', steps: [
      { answers: 'average', say: 'Write each statement as rows that qualify over rows in scope. "A randomly chosen student" means scope = all rows.', why: 'Every row is equally likely to be picked, so a probability is a count ratio.',
        checks: [{ make: (rng) => { const v = rng.pick(V); const k = cnt((r) => r.Economics < v); return { type: 'number', q: `P(a random student scored below ${v} in Economics)? (2 decimals)`, answer: k / N, tolerance: 0.006, hints: ['Tally the Economics column.', `Divide by ${N}.`], explain: `${k}/${N} = ${dp(k / N, 2)}.` }; } }] },
      { answers: 'easy', say: 'Order nested conditions before counting: "both" ⊂ "one subject" ⊂ "either". A higher threshold sits inside a lower one.', why: 'A stricter condition keeps a subset of the rows; the same scope means the subset cannot be more likely.',
        checks: [{ make: (rng) => again(() => { const v = rng.pick(V); return rank(rng, `Rank for a random student in the table (use containment, then check with the counts): from most to least likely.`, [[`At least ${v} in Maths.`, cnt(ge('Maths', v)) / N], [`At least ${v} in both Maths and Physics.`, cnt(both('Maths', 'Physics', v)) / N], [`At least ${v} in Maths or Physics.`, cnt(either('Maths', 'Physics', v)) / N]], 'Either ⊇ Maths ⊇ both, and in this table each step removes at least one row.'); }) }] },
      { answers: 'wholeclass', say: '"Among students who scored at least a in X": list those rows first; they are the denominator. Count the qualifying rows among them.', why: 'The pick is made inside the subgroup, so the total is its size, not the class size.',
        checks: [{ make: (rng) => again(() => { const a = rng.pick([70, 75, 80]), b = rng.pick([70, 75, 80, 85]), s = rng.pick(['Physics', 'Economics']); const g = st.filter(ge('Maths', a)); if (g.length < 3) return null; const k = cnt(ge(s, b), g); return { type: 'number', q: `Among students with at least ${a} in Maths, a random one is picked. P(at least ${b} in ${s})? (2 decimals)`, answer: k / g.length, tolerance: 0.006, hints: [`First list the students with Maths ≥ ${a}: that is the denominator.`, `Count those with ${s} ≥ ${b}.`], explain: `${g.length} students have Maths ≥ ${a} (${g.map((r) => r.name).join(', ')}); ${k} of them have ${s} ≥ ${b}: ${k}/${g.length} = ${dp(k / g.length, 2)}.` }; }) }] },
      { say: '"Average of at least v across three subjects" is the same as "sum of at least 3v". Add the row, compare with 3v, never divide.', why: 'Multiplying both sides by 3 keeps the inequality and turns a division per row into one multiplication.',
        checks: [{ make: (rng) => { const v = rng.pick([65, 70, 75, 80]); const k = cnt((r) => r.Maths + r.Physics + r.Economics >= 3 * v); return { type: 'number', q: `How many students have an average of at least ${v} across the three subjects?`, answer: k, hints: [`Compare each row's sum with ${3 * v}.`], explain: `Rows with Maths + Physics + Economics ≥ ${3 * v}: ${k}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Explain why "at least 70 in both Maths and Physics" can never beat "at least 70 in Maths", but "among students with at least 80 in Maths, at least 80 in Physics" can beat both.', model: 'Every student who clears 70 in both also clears 70 in Maths, so the "both" rows are a subset of the Maths rows, over the same class. The conditional statement divides by the strong-maths subgroup instead of the class, so a small denominator can make its fraction large; containment does not apply because the scopes differ.', points: ['"Both" rows are a subset of the single-subject rows', 'Same denominator plus subset means smaller or equal', 'A conditional has a different, smaller denominator, so it must be counted'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'score-table', difficulty: 2, seed: 'a', explainAt: [0, 3], intro: 'Three unconditional statements. Tally in one pass and order. Try it before opening the solution.' },
    { type: 'worked', section: 'll', family: 'score-table', difficulty: 3, seed: 'b', fade: 1, intro: 'One statement picks from a subgroup. The counts are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: `Can "at least 70 in both Maths and Physics" ever be more likely than "at least 70 in Maths"? And in this table, is "higher in Maths than in Physics" (${GT} rows) more or less likely than "average of at least 75" (${AVG75} rows)?`, answer: `Never: "both" is a subset of "Maths". Higher in Maths: ${GT}/${N} against average ≥ 75: ${AVG75}/${N}.`, explain: 'The first is containment; the second has no containment, so it is a count.' },

    S('traps'),
    { type: 'traps', section: 'll', family: 'score-table', extra: [
      { belief: 'The "among students who ..." statement is divided by the whole class.', fix: 'Its scope is the subgroup: divide by the number of students who meet the condition.' },
      { belief: '"At least 70" excludes a score of exactly 70.', fix: '"At least" includes the threshold; "below" and "more than" exclude it.' },
      { belief: '"Both" can beat a single subject if the second subject is easy.', fix: 'Both is a subset of each subject. An easy second subject makes them equal at most.' },
      { belief: 'An average needs three divisions per row.', fix: 'Compare the sum with 3v instead.' },
    ] },
    { type: 'erroneous', problem: `A candidate works out "among students with at least 80 in Maths, a random one scored at least 80 in Physics" for the table above. One step is wrong.`, steps: [
      `Students with at least 80 in Maths: ${M80.map((r) => r.name).join(', ')}.`,
      `Of them, at least 80 in Physics: ${P80gM80}.`,
      `P = ${P80gM80}/${N} = ${dp(P80gM80 / N, 2)}.`,
      `So it ranks below "at least 70 in Maths" (${dp(M70 / N, 2)}).`,
    ], errorStep: 2, explain: `The scope is the ${M80.length} strong mathematicians, not the ${N} students: ${P80gM80}/${M80.length} = ${dp(P80gM80 / M80.length, 2)}, which ranks above "at least 70 in Maths".` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'In another table, a candidate counts 4 rows with Maths ≥ 70, but the right count is 5: the missing student scored exactly 70. Which belief?', '"At least 70" excludes 70', [
        ['Divided by the wrong total', 'the count itself is off, before any division'],
        ['Used "both" instead of "Maths"', 'a "both" count would drop rows for the second subject, not the boundary row'],
        ['Confused the row with the column', 'the tally is down the right column; only the boundary row was dropped'],
      ], '"At least" includes the threshold itself.', { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'One pass, not three. Run down the rows once and keep a tally per statement. For "both", look only at the smaller of the two scores; for "either", only the larger.' },
    { type: 'callout', tone: 'speed', text: 'Skip counts with containment: a "both" statement and its single-subject parent order themselves. Spend your counting on the conditional and on statements with no nesting.' },
    { type: 'callout', tone: 'speed', text: `Time budget: ${LL.exam.perItemSeconds} seconds per item. A single pass down a dozen rows with three tallies takes about 20 seconds; three separate passes take a minute and leave no time to check the conditional's denominator.` },
    { type: 'check', scope: 'min for both, max for either, sum for average', questions: [
      { make: (rng) => { const r = rng.pick(st), v = rng.pick(V); const ok = Math.min(r.Maths, r.Economics) >= v; return mc(rng, `${r.name} scored ${r.Maths} in Maths and ${r.Economics} in Economics. Does ${r.name} count for "at least ${v} in both Maths and Economics"?`, ok ? 'Yes' : 'No', [[ok ? 'No' : 'Yes', ok ? 'checked the wrong score: both scores are at least the threshold' : `looked at the larger score; the smaller, ${Math.min(r.Maths, r.Economics)}, decides "both"`]], `The smaller score is ${Math.min(r.Maths, r.Economics)}, ${ok ? 'at least' : 'below'} ${v}.`); } },
    ] },

    { type: 'thinkaloud', problem: 'The same table. Rank: (a) a random student scored at least 70 in Physics, (b) among students with at least 80 in Physics, a random one scored at least 80 in Maths, (c) a random student averaged at least 75.', lines: [
      { t: 0, say: 'One row per student, three statements: one pass down the rows, three tallies.' },
      { t: 6, say: `(a) is a Physics column tally: ${P70} of ${N}.` },
      { t: 12, say: `(b) needs Maths and Physics both at least 80: ${MP80} of ${N}. That goes last.`, slip: true },
      { t: 18, say: `Wait: "among students with at least 80 in Physics" picks inside that group. ${P80.length} students, ${M80gP80} of them with Maths ≥ 80: ${M80gP80}/${P80.length}.` },
      { t: 27, say: `(c): average ≥ 75 means sum ≥ 225. ${AVA.name}'s sum is exactly 225, and "at least" keeps ${AVA.name}. ${AVG75} of ${N}.` },
      { t: 35, say: `${dp(TL.b, 2)} > ${dp(TL.a, 2)} > ${dp(TL.c, 2)}: (b) > (a) > (c), with ${LL.exam.perItemSeconds - 35} seconds left for a recount.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine with new thresholds', questions: [
      { make: (rng) => again(() => { const [x, y] = rng.shuffle(SUB), v = rng.pick([65, 70, 75]), a = rng.pick([75, 80]), b = rng.pick([70, 75, 80]), w = rng.pick([65, 70, 75]); const g = st.filter(ge(x, a)); if (g.length < 2) return null; const k = cnt(ge(y, b), g);
        return rank(rng, 'Using the same table, rank from most to least likely.', [[`A random student scored at least ${v} in ${y}.`, cnt(ge(y, v)) / N], [`Among students with at least ${a} in ${x}, a random one scored at least ${b} in ${y}.`, k / g.length], [`A random student averaged at least ${w}.`, cnt((r) => r.Maths + r.Physics + r.Economics >= 3 * w) / N]], `${y} ≥ ${v}: ${cnt(ge(y, v))}/${N}. The conditional: ${k} of the ${g.length} with ${x} ≥ ${a}. Average ≥ ${w} is sum ≥ ${3 * w}: ${cnt((r) => r.Maths + r.Physics + r.Economics >= 3 * w)}/${N}.`, { gap: 0.02 }); }) },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Score table → qualifying rows / rows in scope; both = min ≥ v, either = max ≥ v, average ≥ v ⇔ sum ≥ 3v; order nested conditions by containment; "among ..." divides by the subgroup.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Row test', 'Denominator'], rows: [
      ['at least v in X', 'X ≥ v', 'all students'],
      ['at least v in both X and Y', 'min(X, Y) ≥ v', 'all students'],
      ['at least v in X or Y', 'max(X, Y) ≥ v', 'all students'],
      ['higher in X than Y', 'X − Y > 0', 'all students'],
      ['average at least v', 'X + Y + Z ≥ 3v', 'all students'],
      ['among X ≥ a, Y ≥ b', 'Y ≥ b', 'students with X ≥ a'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a subgroup with one student makes its statement 0 or 1; a threshold nobody reaches gives 0. When a tie decides a row ("higher in Maths than Physics" with equal scores), the row does not qualify.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: football tables (a row per match, team statements shrink the scope), fund returns (a row per year) and scatter plots (a row per point, a strip as the subgroup) are all "count rows in scope".' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'Only one student has at least 90 in Maths, and she has 85 in Physics. P(at least 80 in Physics | at least 90 in Maths)?', '1', [['1/10', 'divided by the class instead of the one-student subgroup'], ['0', 'mixed up the thresholds: 85 is at least 80'], ['1/2', 'treated the one student as a coin flip']], 'The subgroup has one student, and she qualifies: 1/1.', { at: 0 }),
    ] },

    { type: 'variation', base: `The challenge: (a) at least 70 in Maths (${M70}/${N}), (b) at least 70 in both Maths and Physics (${MP70}/${N}), (c) among Maths ≥ 80, Physics ≥ 80 (${P80gM80}/${M80.length}). Order (c) > (a) > (b).`, rows: [
      { same: true, change: 'Sort the table by Physics score instead of by name', effect: 'No change. A random pick treats every row alike, so the order of the rows changes no count.' },
      { change: 'Change (b) from "both" to "either"', effect: `Either tests the larger score: ${EI70}/${N}. It moves from inside (a) to around it, so from last to first, even above (c) (${dp(P80gM80 / M80.length, 2)}).` },
      { change: 'Raise the threshold in (a) from 70 to 90', effect: `Only ${M90} of ${N}, now below (b) (${MP70}/${N}). Containment needs the same threshold: "both ≥ 70" does not sit inside "Maths ≥ 90".` },
      { fusion: true, change: 'In (c), pick among Maths ≥ 70 and ask for Physics ≥ 70', effect: `The group is now (a)'s ${M70} rows and the target is (b)'s ${MP70}: ${MP70}/${M70} = ${dp(CgA, 2)}. Together the two changes make (c) = (b) divided by (a), so it can never fall below (b).` },
    ] },
    { type: 'transfer',
      near: { make: nearT },
      far: { make: farT },
      principle: mc(null, 'Which idea carried over from the score table to the two dice?', 'Count qualifying outcomes, divided by the outcomes left in the stated scope', [
        ['Divide by every outcome, whatever group the statement picks from', 'forgot the scope: "given the first die is at least ..." keeps only those rows'],
        ['A statement with two conditions is always the least likely one', 'true for AND over the same scope; a conditional also shrinks the denominator'],
        ['Average the numbers in the group and compare them with the threshold', 'a probability counts qualifying outcomes; an average answers a different question'],
      ], 'Rows of a table and pairs of dice are both equally likely outcomes: count those that qualify, over those in scope.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'score-table', count: 3 },
  ],
};
