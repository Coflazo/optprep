// Fund-return histories (bar chart): empirical frequencies, head-to-head comparisons, persistence.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'fund-returns';
const FUNDS = [['Steady', 'Swing'], ['Alpha', 'Beta'], ['North', 'South'], ['Core', 'Momentum']];

function describe(c, A, B) {
  switch (c.t) {
    case 'pos': return `${c.f === 0 ? A : B} had a positive return`;
    case 'gt': return `${c.f === 0 ? A : B} returned more than ${c.v}%`;
    case 'lt': return `${c.f === 0 ? A : B} returned less than ${c.v}%`;
    case 'beat': return `${B} beat ${A}`;
    case 'bothNeg': return 'both funds lost money';
    default: return `${c.f === 0 ? A : B} was positive, given that it was positive the year before`;
  }
}

export default {
  id: ID,
  section: 'll',
  title: 'Fund-return histories',
  skill: 'Read frequencies off a bar chart; a volatile fund wins more extremes, a steady fund wins "positive" statements',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const [A, B] = rng.pick(FUNDS);
      const n = rng.int(8, 12), start = rng.int(2010, 2014);
      const years = Array.from({ length: n }, (_, i) => String(start + i));
      const mA = rng.int(3, 7), mB = rng.int(3, 9);
      const draw = (m, sd) => { let v; do v = Math.round(rng.normal(m, sd)); while (v === 0); return v; };
      const ra = years.map(() => draw(mA, 4)), rb = years.map(() => draw(mB, 12));
      if (ra.some((x, i) => x === rb[i])) return null; // no ties, so "beat" is unambiguous
      const pool = difficulty === 2
        ? [{ t: 'pos', f: 0 }, { t: 'pos', f: 1 }, { t: 'gt', f: 1, v: 5 * rng.int(1, 3) }, { t: 'beat' }, { t: 'lt', f: 0, v: rng.int(2, 6) }]
        : [{ t: 'beat' }, { t: 'bothNeg' }, { t: 'persist', f: rng.int(0, 1) }, { t: 'gt', f: rng.int(0, 1), v: 5 * rng.int(1, 3) }, { t: 'pos', f: 1 }, { t: 'lt', f: 1, v: -5 }];
      const conds = rng.shuffle(pool).slice(0, 3);
      const val = (f, i) => (f === 0 ? ra[i] : rb[i]);
      const statements = conds.map((c) => {
        if (c.t === 'persist') {
          const idx = years.map((_, i) => i).filter((i) => i > 0 && val(c.f, i - 1) > 0);
          if (!idx.length) return null;
          const hit = idx.filter((i) => val(c.f, i) > 0).length;
          return { text: `In a randomly chosen year, ${describe(c, A, B)}.`, p: q(hit, idx.length), how: `${idx.length} years follow a positive year for ${c.f === 0 ? A : B}; in ${hit} of them it was positive again.` };
        }
        const ok = (i) => (c.t === 'pos' ? val(c.f, i) > 0 : c.t === 'gt' ? val(c.f, i) > c.v : c.t === 'lt' ? val(c.f, i) < c.v : c.t === 'beat' ? rb[i] > ra[i] : ra[i] < 0 && rb[i] < 0);
        const hit = years.filter((_, i) => ok(i)).length;
        return { text: `In a randomly chosen year, ${describe(c, A, B)}.`, p: q(hit, n), how: `${hit} of the ${n} years qualify.` };
      });
      if (statements.some((x) => !x)) return null;
      return rankItem(ID, rng, difficulty, {
        text: `The chart shows the annual returns of two funds, ${A} and ${B}, over ${n} years. A year is chosen at random from the chart (for the "given" statement, from the years that follow a positive year). Rank the statements from most to least likely.`,
        visual: { type: 'bar', xLabel: 'Year', yLabel: 'Return (%)', unit: '%', categories: years, series: [{ name: A, values: ra }, { name: B, values: rb }] },
        statements,
        intro: [{ say: 'Read each statement as a count of years (bars) out of the years in scope.', why: 'A randomly chosen year makes every year equally likely.' }],
        compare: `Order the counted fractions. Pattern check: the volatile fund (${B}) dominates statements about extremes; the steady fund (${A}) dominates "positive" statements.`,
        rule: 'Frequency = qualifying years / years in scope. Persistence statements use only years after a positive year.',
        anchor: 'Counting table rows, where each year is a row and the bars are the entries.',
        hints: ['Which bars does each statement look at?', 'For the "given" statement, list the years that follow a positive year first.', 'Compare fractions, not counts.'],
        params: { years, funds: [A, B], returns: [ra, rb], statements: conds },
      });
    });
  },

  // Independent check: recount from the rendered bar values.
  verify(item) {
    const [sa, sb] = item.prompt.visual.series.map((x) => x.values);
    const ps = item.params.statements.map((c) => {
      const v = c.f === 0 ? sa : sb;
      if (c.t === 'persist') {
        let den = 0, num = 0;
        for (let i = 1; i < v.length; i++) if (v[i - 1] > 0) { den++; if (v[i] > 0) num++; }
        return num / den;
      }
      let k = 0;
      for (let i = 0; i < sa.length; i++) {
        if ({ pos: v[i] > 0, gt: v[i] > c.v, lt: v[i] < c.v, beat: sb[i] > sa[i], bothNeg: sa[i] < 0 && sb[i] < 0 }[c.t]) k++;
      }
      return k / sa.length;
    });
    return agreeRank(item, ps);
  },

  lesson: {
    purpose: 'Fund-return charts are a reported Likelihood List scenario. They test reading frequencies from bars and the intuition that volatility wins extremes while steadiness wins "positive" events.',
    anchor: 'Counting rows of a table, drawn as bars: each year is one equally likely outcome.',
    steps: [
      { say: 'Name the scope: all years, or years after a positive year.', why: 'Conditional statements change the denominator.' },
      { say: 'Count qualifying bars; compare fractions.', why: 'Every year is equally likely.' },
      { say: 'Use the pattern to sanity-check: high variance → more very high and very low years.', why: 'Variance spreads outcomes to both tails.' },
    ],
    predict: { question: 'A steady fund (always 2-8%) and a volatile fund (−20% to +30%): which is more likely to be positive in a random year? To exceed 15%?', answer: 'Positive: the steady fund. Above 15%: the volatile fund.' },
    edge: 'If a fund was never positive, "given positive the year before" is undefined; items here always have such years.',
    rule: 'Count bars in scope. Variance wins tails; a positive mean with low variance wins "positive".',
    contrast: 'Unconditional frequency (all years) against persistence (only years after a positive year).',
  },
};
