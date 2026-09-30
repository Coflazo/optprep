// Scatter plots: fractions of points in regions, conditional fractions, above/below the diagonal.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'scatter-regions';
const CTX = [
  { x: 'Hours of practice', y: 'Test score (tens)', what: 'student' },
  { x: 'Signal strength', y: 'Next-day return (bp, tens)', what: 'day' },
  { x: 'Volume (millions)', y: 'Spread (ticks)', what: 'stock' },
];

function test(c, [x, y]) {
  switch (c.t) {
    case 'xGt': return x > c.a;
    case 'yGt': return y > c.b;
    case 'xLt': return x < c.a;
    case 'both': return x > c.a && y > c.b;
    case 'above': return y > x;
    default: throw new Error(c.t);
  }
}
const describe = (c) => ({ xGt: `x above ${c.a}`, yGt: `y above ${c.b}`, xLt: `x below ${c.a}`, both: `x above ${c.a} and y above ${c.b}`, above: 'its point above the dashed line y = x' }[c.t]);

export default {
  id: ID,
  section: 'll',
  title: 'Scatter plots',
  skill: 'Count points in a region; for "given" statements, count inside the conditioning strip only',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const ctx = rng.pick(CTX);
      const n = rng.int(24, 40);
      const slope = rng.pick([0.3, 0.5, 0.7, -0.4, 0.9]), icpt = rng.int(1, 4);
      const pts = [];
      while (pts.length < n) {
        const x = Math.round(rng.float(0.2, 9.8) * 10) / 10;
        const y = Math.round((icpt + slope * x + rng.normal(0, 1.6)) * 10) / 10;
        // keep points off integer gridlines and off the diagonal so every region count is unambiguous
        if (y < 0.2 || y > 9.8 || Number.isInteger(x) || Number.isInteger(y) || x === y) continue;
        pts.push([x, y]);
      }
      const a = rng.int(3, 7), b = rng.int(2, 7);
      const pool = [{ t: 'xGt', a }, { t: 'yGt', b }, { t: 'xLt', a: rng.int(2, 6) }, { t: 'both', a, b }, { t: 'above' }];
      const conds = rng.shuffle(pool).slice(0, 3);
      const given = difficulty >= 3 ? { t: 'xGt', a: rng.int(3, 7) } : null;
      const statements = conds.map((c, i) => {
        if (given && i === 0 && c.t !== 'xGt' && c.t !== 'xLt') {
          const base = pts.filter((p) => test(given, p));
          if (base.length < 3) return null;
          const hit = base.filter((p) => test(c, p)).length;
          return { text: `Among ${ctx.what}s with x above ${given.a}, a randomly chosen one has ${describe(c)}.`, p: q(hit, base.length), how: `${base.length} points lie right of x = ${given.a}; ${hit} of those qualify.`, spec: { given, cond: c } };
        }
        const hit = pts.filter((p) => test(c, p)).length;
        return { text: `A randomly chosen ${ctx.what} has ${describe(c)}.`, p: q(hit, n), how: `${hit} of the ${n} points qualify.`, spec: { cond: c } };
      });
      if (statements.some((x) => !x)) return null;
      const diag = statements.some((s) => s.spec.cond.t === 'above');
      return rankItem(ID, rng, difficulty, {
        text: `Each point is one ${ctx.what}: x = ${ctx.x.toLowerCase()}, y = ${ctx.y.toLowerCase()}. One ${ctx.what} is chosen at random (or from a subgroup, where stated). Rank the statements from most to least likely.`,
        visual: { type: 'scatter', xLabel: `x: ${ctx.x}`, yLabel: `y: ${ctx.y}`, points: pts, xDomain: [0, 10], yDomain: [0, 10], lines: diag ? [{ slope: 1, intercept: 0, label: 'y = x' }] : [] },
        statements,
        intro: [{ say: 'Every probability is (points in the region)/(points in scope). Gridlines are at whole numbers, and no point sits on one.', why: 'A random choice makes all points in scope equally likely.' }],
        compare: 'Order by the counted fractions. A region inside another (x > a AND y > b inside x > a) can never be larger.',
        rule: 'Count in the region / count in scope. Conditional statements use only the strip that satisfies the condition.',
        anchor: 'Counting rows of a table, drawn as dots: each point is one equally likely outcome.',
        hints: ['Which part of the plot does each statement describe?', 'For "among ... above a", count only points right of x = a.', 'Use containment before counting.'],
        params: { points: pts, statements: statements.map((s) => s.spec) },
      });
    });
  },

  // Independent check: recount the points in the rendered spec.
  verify(item) {
    const pts = item.prompt.visual.points;
    const inR = (c, [x, y]) => (c.t === 'xGt' ? x - c.a > 0 : c.t === 'yGt' ? y - c.b > 0 : c.t === 'xLt' ? c.a - x > 0 : c.t === 'both' ? x > c.a && y > c.b : y - x > 0);
    const ps = item.params.statements.map((sp) => {
      const scope = sp.given ? pts.filter((p) => inR(sp.given, p)) : pts;
      return scope.filter((p) => inR(sp.cond, p)).length / scope.length;
    });
    return agreeRank(item, ps);
  },

  lesson: {
    purpose: 'Scatter-plot questions test region counting and the denominator of conditional statements, often with a trend that makes conditionals very different from the raw fractions.',
    anchor: 'Counting table rows, with the one change that each row is drawn as a dot and regions replace conditions.',
    steps: [
      { say: 'Shade the region for each statement mentally (right of x = a, above y = b, above y = x).', why: 'Each statement is a region.' },
      { say: 'Count dots in the region; divide by all dots, or by the dots in the conditioning strip.', why: 'Scope decides the denominator.' },
      { say: 'Use containment to skip counts: a corner region is inside both of its strips.', why: 'Subset logic orders some statements without counting.' },
    ],
    predict: { question: 'With an upward trend, is P(y > 5 | x > 6) larger or smaller than P(y > 5)?', answer: 'Larger: high x comes with high y, so the conditional fraction rises.' },
    edge: 'A statement about a strip with very few points can swing wildly; one point changes the fraction a lot.',
    rule: 'Count / scope. Corner ⊂ strip. Trend → conditionals move with it.',
    contrast: 'P(both) (corner over all points) against P(y > b | x > a) (corner over the strip).',
  },
};
