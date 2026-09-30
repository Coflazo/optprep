// Student score table: rank statements about a randomly chosen student (subset logic, conditionals).
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'score-table';
const NAMES = ['Ava', 'Ben', 'Chen', 'Dara', 'Eli', 'Farah', 'Gus', 'Hana', 'Ivo', 'Jade', 'Kofi', 'Lena', 'Milo', 'Nia', 'Omar', 'Pia'];
const SUBJ = [['Maths', 'Physics', 'Economics'], ['Maths', 'Statistics', 'English'], ['Probability', 'Programming', 'Finance']];

// Evaluate a structured condition on a row of scores (object subject -> score).
function test(c, r) {
  switch (c.t) {
    case 'ge': return r[c.s] >= c.v;
    case 'lt': return r[c.s] < c.v;
    case 'both': return r[c.a] >= c.v && r[c.b] >= c.v;
    case 'either': return r[c.a] >= c.v || r[c.b] >= c.v;
    case 'gt': return r[c.a] > r[c.b];
    case 'avg': return (r[c.subs[0]] + r[c.subs[1]] + r[c.subs[2]]) / 3 >= c.v;
    default: throw new Error(c.t);
  }
}
function describe(c) {
  switch (c.t) {
    case 'ge': return `scored at least ${c.v} in ${c.s}`;
    case 'lt': return `scored below ${c.v} in ${c.s}`;
    case 'both': return `scored at least ${c.v} in both ${c.a} and ${c.b}`;
    case 'either': return `scored at least ${c.v} in ${c.a} or ${c.b} (or both)`;
    case 'gt': return `scored higher in ${c.a} than in ${c.b}`;
    default: return `has an average of at least ${c.v} across the three subjects`;
  }
}

export default {
  id: ID,
  section: 'll',
  title: 'Score tables',
  skill: 'Count rows; a stricter condition (AND) can never beat a looser one (OR); conditionals change the denominator',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const subs = rng.pick(SUBJ);
      const n = rng.int(10, 14);
      const names = rng.shuffle(NAMES).slice(0, n);
      const rows = names.map((name) => {
        const ability = rng.int(45, 88);
        const r = { name };
        subs.forEach((s) => { r[s] = Math.max(30, Math.min(100, ability + rng.int(-16, 16))); });
        return r;
      });
      const v = () => 5 * rng.int(11, 17);
      const [a, b, c] = rng.shuffle(subs);
      const pool = [
        { t: 'ge', s: a, v: v() }, { t: 'lt', s: b, v: v() }, { t: 'both', a, b, v: v() }, { t: 'either', a, b: c, v: v() },
        { t: 'gt', a, b }, { t: 'avg', subs, v: v() }, { t: 'ge', s: c, v: v() },
      ];
      const conds = rng.shuffle(pool).slice(0, 3);
      const cond = difficulty >= 3 ? { t: 'ge', s: a, v: v() } : null; // one conditional statement at level 3+
      const statements = conds.map((cd, i) => {
        if (cond && i === 0 && cd.t !== 'gt') {
          const base = rows.filter((r) => test(cond, r));
          if (!base.length) return null;
          const hit = base.filter((r) => test(cd, r)).length;
          return { text: `Among students who ${describe(cond)}, a randomly chosen one ${describe(cd)}.`, p: q(hit, base.length), how: `${base.length} students ${describe(cond)}; ${hit} of them also ${describe(cd)}. The denominator is ${base.length}, not ${n}.`, spec: { given: cond, cond: cd } };
        }
        const hit = rows.filter((r) => test(cd, r)).length;
        return { text: `A randomly chosen student ${describe(cd)}.`, p: q(hit, n), how: `${hit} of the ${n} rows qualify.`, spec: { cond: cd } };
      });
      if (statements.some((x) => !x)) return null;
      return rankItem(ID, rng, difficulty, {
        text: `The table shows the exam scores of ${n} students. One student is picked at random (or, where stated, at random from a subgroup). Rank the statements from most to least likely.`,
        visual: { type: 'table', caption: 'Exam scores', columns: ['Student', ...subs], rows: rows.map((r) => [r.name, ...subs.map((s) => r[s])]) },
        statements,
        intro: [{ say: `Every probability is a count of rows: pick the right rows, then divide by the right total (${n}, or the size of the subgroup).`, why: 'A random student makes each row equally likely.' }],
        compare: 'Order by the counted fractions. Sanity check: an AND condition is contained in each of its parts, and an OR condition contains them.',
        rule: 'P = qualifying rows / rows in the group. AND ≤ each part ≤ OR. Conditional: shrink the denominator.',
        anchor: 'Favourable over total with equally likely outcomes, where the outcomes are rows of a table.',
        hints: ['Each statement is a fraction of rows. What is its denominator?', 'Use subset logic first: "both" can never beat "at least one of them".', 'Count only the rows you need for the close calls.'],
        params: { subjects: subs, rows: rows.map((r) => [r.name, ...subs.map((s) => r[s])]), statements: statements.map((x) => x.spec) },
      });
    });
  },

  // Independent check: re-read the scores from the rendered table and recount each statement.
  verify(item) {
    const { columns, rows } = item.prompt.visual;
    const objs = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
    const ev = (c, r) => {
      if (c.t === 'ge') return r[c.s] >= c.v;
      if (c.t === 'lt') return r[c.s] < c.v;
      if (c.t === 'both') return Math.min(r[c.a], r[c.b]) >= c.v;
      if (c.t === 'either') return Math.max(r[c.a], r[c.b]) >= c.v;
      if (c.t === 'gt') return r[c.a] - r[c.b] > 0;
      return r[c.subs[0]] + r[c.subs[1]] + r[c.subs[2]] >= 3 * c.v;
    };
    const ps = item.params.statements.map((sp) => {
      const base = sp.given ? objs.filter((r) => ev(sp.given, r)) : objs;
      return base.filter((r) => ev(sp.cond, r)).length / base.length;
    });
    return agreeRank(item, ps);
  },

  lesson: {
    purpose: 'Table questions test whether you read the denominator correctly and whether you use subset logic before counting. Both save most of the 90 seconds.',
    anchor: 'Favourable over total, with one change: the outcomes are table rows, and "given" statements shrink the total to a subgroup.',
    steps: [
      { say: 'Write each statement as "rows that qualify / rows in the group".', why: 'A random student makes rows equally likely.' },
      { say: 'Use subset logic: A AND B ≤ A ≤ A OR B.', why: 'A stricter event can never be more likely than a looser one.' },
      { say: 'For "among students who ...", divide by the size of that subgroup.', why: 'Conditioning changes the denominator.' },
    ],
    predict: { question: 'Can "at least 70 in both Maths and Physics" be more likely than "at least 70 in Maths"?', answer: 'Never. Every student in the first group is also in the second.' },
    edge: 'A conditional can exceed both unconditional statements: among strong Maths students, most may be strong in Physics.',
    rule: 'Count rows; AND ≤ part ≤ OR; conditional = count within the subgroup.',
    contrast: 'P(B | A) (count inside A) against P(A and B) (count over everyone).',
  },
};
