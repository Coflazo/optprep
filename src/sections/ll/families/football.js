// Football results table: frequencies of match outcomes, team-conditional statements.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'football';
const TEAMS = ['Lions', 'Tigers', 'Wolves', 'Eagles', 'Sharks', 'Bears', 'Hawks', 'Foxes'];
const GOALS = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4];

const involve = (m, T) => m.home === T || m.away === T;
function test(c, m) {
  const tot = m.hg + m.ag;
  switch (c.t) {
    case 'homeWin': return m.hg > m.ag;
    case 'awayWin': return m.ag > m.hg;
    case 'draw': return m.hg === m.ag;
    case 'goalsGe': return tot >= c.g;
    case 'btts': return m.hg > 0 && m.ag > 0;
    case 'teamWin': return (m.home === c.T && m.hg > m.ag) || (m.away === c.T && m.ag > m.hg);
    case 'teamScored': return (m.home === c.T && m.hg > 0) || (m.away === c.T && m.ag > 0);
    case 'cleanSheetHome': return m.ag === 0;
    default: throw new Error(c.t);
  }
}
function describe(c) {
  switch (c.t) {
    case 'homeWin': return ['a randomly chosen match', 'was won by the home team'];
    case 'awayWin': return ['a randomly chosen match', 'was won by the away team'];
    case 'draw': return ['a randomly chosen match', 'ended in a draw'];
    case 'goalsGe': return ['a randomly chosen match', `had at least ${c.g} goals in total`];
    case 'btts': return ['a randomly chosen match', 'saw both teams score'];
    case 'teamWin': return [`a randomly chosen match involving the ${c.T}`, `was won by the ${c.T}`];
    case 'teamScored': return [`a randomly chosen match involving the ${c.T}`, `saw the ${c.T} score`];
    default: return ['a randomly chosen match', 'ended with the away team scoring no goals'];
  }
}

export default {
  id: ID,
  section: 'll',
  title: 'Football results',
  skill: 'Turn a results table into frequencies; team statements use only that team\'s matches as the denominator',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const teams = rng.shuffle(TEAMS).slice(0, rng.int(4, 6));
      const n = rng.int(10, 14);
      const ms = [];
      for (let i = 0; i < n; i++) {
        const [home, away] = rng.shuffle(teams).slice(0, 2);
        const hg = rng.pick(GOALS) + (rng.chance(0.25) ? 1 : 0), ag = rng.pick(GOALS);
        ms.push({ home, away, hg, ag });
      }
      const T = rng.pick(teams);
      if (ms.filter((m) => involve(m, T)).length < 3) return null;
      const pool = difficulty === 2
        ? [{ t: 'homeWin' }, { t: 'awayWin' }, { t: 'draw' }, { t: 'goalsGe', g: rng.int(2, 4) }, { t: 'btts' }, { t: 'cleanSheetHome' }]
        : [{ t: 'teamWin', T }, { t: 'teamScored', T }, { t: 'goalsGe', g: rng.int(3, 5) }, { t: 'btts' }, { t: 'draw' }, { t: 'homeWin' }];
      const conds = rng.shuffle(pool).slice(0, 3);
      const statements = conds.map((c) => {
        const base = c.T ? ms.filter((m) => involve(m, c.T)) : ms;
        const hit = base.filter((m) => test(c, m)).length;
        const [who, what] = describe(c);
        return { text: `${who[0].toUpperCase() + who.slice(1)} ${what}.`, p: q(hit, base.length), how: `${hit} of the ${base.length} ${c.T ? `matches the ${c.T} played` : 'matches'} qualify.` };
      });
      return rankItem(ID, rng, difficulty, {
        text: `The table lists this season's ${n} results in a small league. A match is picked at random from the table (or from one team's matches, where stated). Rank the statements from most to least likely.`,
        visual: { type: 'table', caption: 'Results (home team first)', columns: ['Home', 'Away', 'Score'], rows: ms.map((m) => [m.home, m.away, `${m.hg}–${m.ag}`]), align: ['left', 'left', 'right'] },
        statements,
        intro: [{ say: 'Scan the score column once and tally each statement as you go.', why: 'One pass over the rows is faster than one pass per statement.' }],
        compare: 'Order by the tallied fractions; watch that team statements divide by that team\'s games only.',
        rule: 'Frequency = qualifying matches / matches in scope. "Involving team T" shrinks the scope to T\'s matches.',
        anchor: 'Counting rows of a table, with the one change that some statements restrict which rows count.',
        hints: ['What is the denominator of each statement?', 'Tally home wins, draws, away wins and goal totals in one pass.', 'Compare the fractions, not the raw counts.'],
        params: { matches: ms.map((m) => [m.home, m.away, m.hg, m.ag]), statements: conds },
      });
    });
  },

  // Independent check: parse the rendered score strings and recount.
  verify(item) {
    const ms = item.prompt.visual.rows.map(([home, away, sc]) => { const [hg, ag] = sc.split(/\D+/).map(Number); return { home, away, hg, ag }; });
    const ps = item.params.statements.map((c) => {
      const scope = c.T ? ms.filter((m) => m.home === c.T || m.away === c.T) : ms;
      let hit = 0;
      for (const m of scope) {
        const mine = c.T ? (m.home === c.T ? [m.hg, m.ag] : [m.ag, m.hg]) : [m.hg, m.ag];
        const ok = { homeWin: m.hg > m.ag, awayWin: m.ag > m.hg, draw: m.hg === m.ag, goalsGe: m.hg + m.ag >= c.g, btts: Math.min(m.hg, m.ag) > 0, teamWin: mine[0] > mine[1], teamScored: mine[0] > 0, cleanSheetHome: m.ag === 0 }[c.t];
        if (ok) hit++;
      }
      return hit / scope.length;
    });
    return agreeRank(item, ps);
  },

  lesson: {
    purpose: 'Results tables are a reported Likelihood List scenario. The work is tallying; the trap is the denominator for team-specific statements.',
    anchor: 'Counting rows of a table, with the one change that "involving team T" restricts which rows are in play.',
    steps: [
      { say: 'Tally the outcomes you need in one pass down the score column.', why: 'Home win, draw, away win and total goals are all visible in each score.' },
      { say: 'For team statements, first list that team\'s matches.', why: 'The denominator is their games, not the league\'s.' },
      { say: 'Compare fractions, not counts.', why: 'Different statements can have different denominators.' },
    ],
    predict: { question: 'A team won 3 of its 4 games; the league has 12 games with 6 home wins. Which is higher: P(the team wins a random game of theirs) or P(home win in a random game)?', answer: 'The team: 3/4 against 6/12.' },
    edge: 'A team with no games makes its statements undefined; every item here gives each named team at least three games.',
    rule: 'Frequency = qualifying / in scope. Always name the scope first.',
    contrast: 'Frequency over all matches against frequency over one team\'s matches.',
  },
};
