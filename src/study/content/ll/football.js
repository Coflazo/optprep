// Likelihood List family: football results tables. Each row is a match; one pass down the score
// column classifies home win / draw / away win, total goals and "both scored". Team statements
// shrink the scope to that team's matches and read the score from the team's side.
import { S, dp, mc, rank, again } from './compare-without-computing.js';

const MS = [['Lions', 'Tigers', 2, 1], ['Wolves', 'Eagles', 0, 0], ['Tigers', 'Wolves', 3, 1], ['Eagles', 'Lions', 1, 2], ['Lions', 'Wolves', 1, 1], ['Tigers', 'Eagles', 0, 2], ['Wolves', 'Lions', 2, 3], ['Eagles', 'Tigers', 2, 2], ['Lions', 'Eagles', 4, 0], ['Wolves', 'Tigers', 1, 0], ['Tigers', 'Lions', 0, 1], ['Eagles', 'Wolves', 3, 1]]
  .map(([home, away, hg, ag]) => ({ home, away, hg, ag }));
const N = MS.length;
const TEAMS = ['Lions', 'Tigers', 'Wolves', 'Eagles'];
const sc = (m) => `${m.hg}–${m.ag}`;
const cnt = (f, ms = MS) => ms.filter(f).length;
const homeWin = (m) => m.hg > m.ag, draw = (m) => m.hg === m.ag, awayWin = (m) => m.ag > m.hg;
const goalsGe = (g) => (m) => m.hg + m.ag >= g;
const btts = (m) => m.hg > 0 && m.ag > 0;
const of = (T) => MS.filter((m) => m.home === T || m.away === T);
const mine = (m, T) => (m.home === T ? [m.hg, m.ag] : [m.ag, m.hg]);
const teamWin = (T) => (m) => { const [a, b] = mine(m, T); return a > b; };
const teamScored = (T) => (m) => mine(m, T)[0] > 0;
const H = cnt(homeWin), D = cnt(draw), A = cnt(awayWin);
const LIONS = of('Lions'), LW = cnt(teamWin('Lions'), LIONS), LS = cnt(teamScored('Lions'), LIONS);
const STATS = [['was won by the home team', homeWin], ['ended in a draw', draw], ['was won by the away team', awayWin], ['saw both teams score', btts], ['had at least 3 goals', goalsGe(3)], ['had at least 4 goals', goalsGe(4)]];

export default {
  id: 'll/football',
  book: 'll',
  kind: 'family',
  family: 'football',
  title: 'Football results',
  summary: 'Tally the score column once; a statement about team T divides by T\'s matches and reads the score from T\'s side.',
  prerequisites: ['ll/compare-without-computing', 'll/score-table'],
  objectives: [
    'Classify every score as home win, draw or away win, and read total goals and "both scored", in one pass',
    'Name the scope of a team statement and list that team\'s matches as the denominator',
    'Read a score from a team\'s side whether it played at home or away',
    'Order league-wide and team statements by comparing fractions with different denominators',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a league has ${N} results (home team first): ${MS.map((m) => `${m.home} ${sc(m)} ${m.away}`).join('; ')}. Rank: (a) a random match was won by the home team, (b) a random match involving the Lions was won by the Lions, (c) a random match ended in a draw.`, answer: `(b) ${LW}/${LIONS.length} > (a) ${H}/${N} > (c) ${D}/${N}`, explain: `(a) and (c) are tallies over all ${N} matches: ${H} home wins, ${D} draws. (b) counts only the ${LIONS.length} matches the Lions played, and they won ${LW}. If you divided (b) by ${N}, you used the league as the scope for a team statement.` },
    { type: 'text', text: 'The prompt is a **table of match results**: home team, away team, score (home goals first). A match is picked at random, or from one team\'s matches. Statements: home win, away win, draw, at least g goals in total, both teams scored, the away side kept a clean sheet, or "a random match involving team T was won by T" (or saw T score).' },
    { type: 'text', text: 'Not this lesson: a score table of students (a row per student, not per match) and two-way count tables. The counting idea is the same; what changes is how you read a row.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Which statement uses a smaller scope than the whole table?', '"A random match involving the Wolves was won by the Wolves."', [
        ['"A random match was won by the away team."', 'every match is in scope; only the numerator changes'],
        ['"A random match had at least 3 goals."', 'a tally over all matches'],
        ['"A random match ended 0–0."', 'still a tally over all matches'],
      ], '"Involving the Wolves" restricts the pick to the Wolves\' matches.', { at: 3 }),
    ] },

    S('why'),
    { type: 'text', text: 'Results tables are a reported Likelihood List scenario. Nothing here is hard, which is exactly why it costs points: under time pressure people read an away win as a home win, forget that a 0–0 draw has no scorer, or divide a team\'s wins by the whole league. One disciplined pass and a named scope remove all three. The items also mix league statements with team statements on purpose: the league ones divide by every match, the team ones by a handful, so a team with a good record jumps to the top of the order even with few wins in total.' },

    S('anchor'),
    { type: 'text', text: 'You already count rows of a table: favourable rows over rows in scope. The one change here: each row is a match whose **score** carries several facts at once (who won, how many goals, who scored), and some statements shrink the scope to one team\'s matches. So the work is reading: a match gives you the result by comparing its two numbers, the total by adding them, and "both scored" by checking that neither is zero.' },
    { type: 'check', scope: 'reading one score', questions: [
      { make: (rng) => { const hg = rng.int(0, 4), ag = rng.int(0, 4); const res = hg > ag ? 'home win' : hg === ag ? 'draw' : 'away win'; return mc(rng, `A match ends ${hg}–${ag} (home goals first). Which is it?`, res, [['home win', 'read the second number as the home side'], ['draw', 'looked at total goals instead of comparing the two'], ['away win', 'read the first number as the away side']].filter(([v]) => v !== res), `${hg} against ${ag}: ${res}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Three pictures, one per idea: the raw table (every fact is in the score column), the three results as bars (they always fill the whole league), and one team\'s matches cut out and turned to face that team.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Results (home team first)', columns: ['Home', 'Away', 'Score'], rows: MS.map((m) => [m.home, m.away, sc(m)]), align: ['left', 'left', 'right'] }, caption: `${N} matches, each picked with probability 1/${N}. Everything about a match is in its score.` },
    { type: 'check', scope: 'tallying the score column', questions: [
      { make: (rng) => { const [lab, f] = rng.pick(STATS); const k = cnt(f); return { type: 'number', q: `From the table: how many matches ${lab}?`, answer: k, hints: ['Go down the score column once.'], explain: `${k} of the ${N} matches ${lab}.` }; } },
    ] },
    { type: 'text', text: 'One pass gives three tallies that always add up to the number of matches, because every match is exactly one of home win, draw, away win.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Result of each match', xLabel: 'result', yLabel: 'matches', categories: ['home win', 'draw', 'away win'], series: [{ name: 'matches', values: [H, D, A] }] }, caption: `${H} + ${D} + ${A} = ${N}. Knowing two of the three gives the third.` },
    { type: 'check', scope: 'the three results partition the matches', questions: [
      { make: (rng) => { const n = rng.int(10, 16), h = rng.int(3, 7), d = rng.int(1, 4); return { type: 'number', q: `A league has ${n} matches: ${h} home wins and ${d} draws. P(a random match was an away win)? (2 decimals)`, answer: (n - h - d) / n, tolerance: 0.006, hints: ['Home win, draw and away win cover every match exactly once.'], explain: `${n} − ${h} − ${d} = ${n - h - d} away wins: ${dp((n - h - d) / n, 2)}.` }; } },
    ] },
    { type: 'text', text: 'For a team statement, first cut the table down to that team\'s matches and rewrite each score from the team\'s side (team goals first).' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'The Lions\' matches, from the Lions\' side', columns: ['Opponent', 'Venue', 'Lions–opp.', 'Result'], rows: LIONS.map((m) => { const [a, b] = mine(m, 'Lions'); return [m.home === 'Lions' ? m.away : m.home, m.home === 'Lions' ? 'home' : 'away', `${a}–${b}`, a > b ? 'win' : a === b ? 'draw' : 'loss']; }), align: ['left', 'left', 'right', 'left'] }, caption: `${LIONS.length} rows: that is the denominator of every Lions statement. The Lions won ${LW} and scored in ${LS}.` },
    { type: 'check', scope: 'the team scope', questions: [
      { make: (rng) => { const T = rng.pick(TEAMS); const g = of(T), w = cnt(teamWin(T), g); return { type: 'number', q: `From the results table: P(a random match involving the ${T} was won by the ${T})? (2 decimals)`, answer: w / g.length, tolerance: 0.006, hints: [`List the ${T}' matches, home or away.`, 'In each, compare the ' + T + '\' goals with the opponent\'s.'], explain: `The ${T} played ${g.length} matches and won ${w}: ${dp(w / g.length, 2)}.` }; } },
    ] },

    S('derivation'),
    { type: 'text', text: 'The method is four moves, in the order you run them under the clock: scope first (it decides the denominator before you count anything), then a single tally pass, then the team-side reading, then the comparison. Each move has a check that opens the next.' },
    { type: 'steps', steps: [
      { say: 'Name the scope of each statement: all matches, or only matches involving team T.', why: 'The scope is the denominator. "A random match involving the Lions" never picks a match the Lions did not play.',
        checks: [mc(null, `"A random match involving the Lions saw the Lions score." What is the denominator?`, `${LIONS.length}`, [[`${N}`, 'used the whole league as the scope'], [`${LS}`, 'used the numerator as the denominator'], [`${cnt((m) => m.home === 'Lions')}`, 'counted only the Lions\' home matches']], `The Lions played ${LIONS.length} matches.`, { at: 1 })] },
      { say: 'Make one pass down the scores and tally every statement at once: compare the two numbers (result), add them (total goals), check both are positive (both scored).', why: 'Each score holds all three facts, so reading it once is enough.',
        checks: [{ make: (rng) => { const g = rng.pick([2, 3, 4]); const k = cnt(goalsGe(g)), b = cnt(btts); return { type: 'number', q: `From the table: how many matches had at least ${g} goals AND saw both teams score?`, answer: cnt((m) => goalsGe(g)(m) && btts(m)), hints: ['For each score: add the two numbers, then check neither is 0.'], explain: `Both tests on the same pass: ${cnt((m) => goalsGe(g)(m) && btts(m))} (of ${k} with at least ${g} goals and ${b} with both scoring).` }; } }] },
      { say: 'For team statements read each score from the team\'s side: if T played away, T\'s goals are the second number.', why: 'The table is written home-first, so an away win for T looks like a loss if you read the first number.',
        checks: [{ make: (rng) => { const m = rng.pick(MS), T = rng.pick([m.home, m.away]); const [a, b] = mine(m, T); const res = a > b ? 'a win' : a === b ? 'a draw' : 'a loss'; return mc(rng, `${m.home} ${sc(m)} ${m.away}. For the ${T}, this match was:`, res, [['a win', 'read the home number as the ' + T + '\' goals'], ['a draw', 'compared the wrong pair of numbers'], ['a loss', 'read the score from the other team\'s side']].filter(([v]) => v !== res), `The ${T} scored ${a} and conceded ${b}: ${res}.`); } }] },
      { say: 'Compare fractions, not counts: team statements have small denominators, so a few wins can make a large probability.', why: 'Different denominators mean the raw counts can point the wrong way.',
        checks: [{ make: (rng) => again(() => { const T = rng.pick(TEAMS); const g = of(T); const [l1, f1] = rng.pick(STATS); const [l2, f2] = rng.pick(STATS.filter(([l]) => l !== l1)); return rank(rng, 'From the table, rank from most to least likely.', [[`A random match ${l1}.`, cnt(f1) / N], [`A random match ${l2}.`, cnt(f2) / N], [`A random match involving the ${T} was won by the ${T}.`, cnt(teamWin(T), g) / g.length]], `League tallies over ${N}; the ${T} statement over their ${g.length} matches.`, { gap: 0.02 }); }) }] },
    ] },
    { type: 'explain', prompt: 'Explain why "the Lions won 5 matches" and "the home team won 5 matches" can give different probabilities.', model: 'The counts are the same but the scopes differ. A home-win statement picks from all matches in the league, so 5 is divided by every match. A Lions statement picks only from the matches the Lions played, so the same 5 is divided by a smaller number and the probability is larger.', points: ['Each statement has its own scope', 'League statements divide by all matches', 'Team statements divide by that team\'s matches only'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'football', difficulty: 2, seed: 'a', intro: 'League-wide statements only. One pass, three tallies. Try it first.' },
    { type: 'worked', section: 'll', family: 'football', difficulty: 3, seed: 'b', fade: 1, intro: 'Team statements are mixed in. The tallies are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'A team won 3 of its 4 matches; the league has 12 matches with 6 home wins. Which is more likely: the team winning a random one of its matches, or a random league match being a home win?', answer: 'The team: 3/4 against 6/12.', explain: 'Different scopes: 4 matches against 12.' },

    S('traps'),
    { type: 'traps', section: 'll', family: 'football', extra: [
      { belief: 'A team\'s wins are divided by all matches in the league.', fix: '"A random match involving T" picks from T\'s matches only.' },
      { belief: 'In "Eagles 1–2 Lions" the Eagles scored 2.', fix: 'Home goals come first: the Eagles (home) scored 1, the Lions 2.' },
      { belief: 'A 0–0 draw counts as "both teams scored".', fix: 'Both teams scored means both numbers are at least 1.' },
      { belief: '"At least 3 goals" means more than 3.', fix: '"At least" includes 3: a 2–1 counts.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out "a random match involving the Lions was won by the Lions" from the table. One step is wrong.', steps: [
      `The Lions appear in ${LIONS.length} matches.`,
      `They won ${LW} of them.`,
      `P = ${LW}/${N} = ${dp(LW / N, 2)}, the same kind of number as the home-win rate ${H}/${N}.`,
      `So it ranks level with home wins.`,
    ], errorStep: 2, explain: `The scope is the Lions' ${LIONS.length} matches: ${LW}/${LIONS.length} = ${dp(LW / LIONS.length, 2)}, well above the home-win rate ${dp(H / N, 2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'Eagles 1–2 Lions (home team first). A candidate records this as an Eagles win. Which belief?', 'Read the second number as the home side\'s goals', [
        ['Divided by the wrong scope', 'the result of a single match is wrong before any division'],
        ['Counted "at least" as "more than"', 'no threshold is involved in deciding a winner'],
        ['Treated a draw as a win', 'the score is 1–2, not a draw'],
      ], 'Home goals first: Eagles 1, Lions 2, a Lions (away) win.', { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Write the three statement labels on your scrap paper and make one pass down the score column, ticking each as you go. Twelve scores take about 15 seconds.' },
    { type: 'callout', tone: 'speed', text: 'For a team statement, count the team\'s matches first (scan both name columns), then only look at those scores. Compare a/b with c/d by cross-multiplying when the fractions are close.' },
    { type: 'check', scope: 'one pass and cross-multiplying', questions: [
      { make: (rng) => again(() => { const a = rng.int(2, 5), b = rng.int(a + 1, 7), c = rng.int(3, 8), d = rng.int(c + 3, 16); if (a * d === b * c) return null; return mc(rng, `A team won ${a} of its ${b} matches; the league has ${c} draws in ${d} matches. Which is more likely for a random pick in its own scope?`, a * d > b * c ? 'the team winning' : 'a draw', [[a * d > b * c ? 'a draw' : 'the team winning', 'compared the counts, not the fractions']], `${a} × ${d} = ${a * d} against ${c} × ${b} = ${b * c}.`); }) },
    ] },

    S('rule'),
    { type: 'text', text: 'Everything above fits in two lines. Say the scope aloud before you count, and read every score from the side the statement is about.' },
    { type: 'callout', tone: 'rule', text: 'Results table → one pass: result, total goals, both scored. Team T → scope = T\'s matches, read scores from T\'s side. Compare fractions, not counts.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Scope (denominator)', 'Test on the score a–b'], rows: [
      ['home win', 'all matches', 'a > b'],
      ['draw', 'all matches', 'a = b'],
      ['at least g goals', 'all matches', 'a + b ≥ g'],
      ['both teams scored', 'all matches', 'a ≥ 1 and b ≥ 1'],
      ['away clean sheet', 'all matches', 'b = 0 (the away team scored no goals)'],
      ['T won', 'T\'s matches', 'T\'s goals > opponent\'s'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: every match is exactly one of home win, draw, away win, so the three probabilities add to 1. A 0–0 draw is a draw with no scorer; "at least 0 goals" is certain.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a score table (a row per student), fund returns (a row per year; "years after a positive year" is a shrunken scope) and histograms (bars instead of rows) all follow count / scope.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const h = rng.int(3, 7), d = rng.int(1, 4), n = h + d + rng.int(2, 6); return mc(rng, `${n} matches: P(home win) = ${h}/${n}, P(draw) = ${d}/${n}. What is P(away win)?`, `${n - h - d}/${n}`, [[`${n - h}/${n}`, 'forgot the draws: home win, draw and away win split every match'], [`${h}/${n}`, 'assumed home and away wins are equally common'], [`${d}/${n}`, 'confused away wins with draws']], `The three results add to 1: ${n} − ${h} − ${d} = ${n - h - d}.`); } },
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'football', count: 3 },
  ],
};
