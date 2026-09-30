// Density curves: rank interval probabilities read off normal, skewed, uniform and triangular densities.
import { rankItem, retry, agreeRank } from '../lib.js';

const ID = 'density-curves';
const XMIN = -4, XMAX = 10;

// Simpson's rule on [a, b] with n (even) panels.
function simpson(f, a, b, n = 2000) {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

export const DISTS = {
  normal: ({ mu, sd }) => ({
    pdf: (x) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)),
    prob: (a, b) => simpson((x) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)), Math.max(a, mu - 12 * sd), Math.min(b, mu + 12 * sd)),
    breaks: [],
    desc: `bell-shaped, centred at ${mu}`,
  }),
  skew: ({ th }) => ({
    pdf: (x) => (x <= 0 ? 0 : (x / (th * th)) * Math.exp(-x / th)),
    prob: (a, b) => { const F = (x) => (x <= 0 ? 0 : 1 - Math.exp(-x / th) * (1 + x / th)); return F(b) - F(a); },
    breaks: [0],
    desc: `right-skewed, starting at 0 with a peak at ${th}`,
  }),
  uniform: ({ lo, hi }) => ({
    pdf: (x) => (x >= lo && x <= hi ? 1 / (hi - lo) : 0),
    prob: (a, b) => Math.max(0, Math.min(b, hi) - Math.max(a, lo)) / (hi - lo),
    breaks: [lo, hi],
    desc: `flat between ${lo} and ${hi}`,
  }),
  tri: ({ lo, mode, hi }) => ({
    pdf: (x) => (x < lo || x > hi ? 0 : x <= mode ? (2 * (x - lo)) / ((hi - lo) * (mode - lo)) : (2 * (hi - x)) / ((hi - lo) * (hi - mode))),
    prob: (a, b) => {
      const F = (x) => (x <= lo ? 0 : x >= hi ? 1 : x <= mode ? (x - lo) ** 2 / ((hi - lo) * (mode - lo)) : 1 - (hi - x) ** 2 / ((hi - lo) * (hi - mode)));
      return F(b) - F(a);
    },
    breaks: [lo, mode, hi],
    desc: `triangular from ${lo} to ${hi}, peaking at ${mode}`,
  }),
};

function randomCurve(rng, kind) {
  if (kind === 'normal') return { kind, mu: rng.int(1, 5), sd: rng.pick([0.75, 1, 1.25, 1.5]) };
  if (kind === 'skew') return { kind, th: rng.pick([0.5, 0.75, 1, 1.25]) };
  if (kind === 'uniform') { const lo = rng.int(-3, 3); return { kind, lo, hi: lo + rng.int(3, 6) }; }
  const lo = rng.int(-3, 2), hi = lo + rng.int(4, 7);
  return { kind: 'tri', lo, mode: rng.int(lo + 1, hi - 1), hi };
}

export function points(c) {
  const d = DISTS[c.kind](c);
  const xs = new Set();
  for (let i = 0; i <= 224; i++) xs.add(Number((XMIN + ((XMAX - XMIN) * i) / 224).toFixed(4)));
  d.breaks.forEach((b) => xs.add(b));
  const sorted = [...xs].sort((a, b) => a - b);
  const out = [];
  for (const x of sorted) {
    if (c.kind === 'uniform' && (x === c.lo || x === c.hi)) {
      // vertical jump: draw both the outside (0) and inside (height) values at the edge
      const hgt = Number((1 / (c.hi - c.lo)).toFixed(5));
      out.push(x === c.lo ? [x, 0] : [x, hgt], x === c.lo ? [x, hgt] : [x, 0]);
    } else out.push([x, Number(d.pdf(x).toFixed(5))]);
  }
  return out;
}

const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1)).replace('-', '−');
function describe(name, st) {
  if (st.t === 'gt') return `${name} is above ${fmt(st.a)}.`;
  if (st.t === 'lt') return `${name} is below ${fmt(st.a)}.`;
  return `${name} is between ${fmt(st.a)} and ${fmt(st.b)}.`;
}

export default {
  id: ID,
  section: 'll',
  title: 'Density curves',
  skill: 'Probability = area under the curve; compare areas by width × typical height, and use symmetry',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const k = difficulty === 2 ? 1 : difficulty === 3 ? 2 : 3;
      const kinds = rng.shuffle(['normal', 'skew', 'uniform', 'tri', 'normal']).slice(0, k);
      const curves = kinds.map((kd) => randomCurve(rng, kd));
      const names = k === 1 ? ['X'] : ['Desk A', 'Desk B', 'Desk C'].slice(0, k);
      const sts = [];
      for (let i = 0; i < 3; i++) {
        const ci = k === 1 ? 0 : i % k === i ? i : rng.int(0, k - 1);
        const t = rng.pick(['gt', 'lt', 'between']);
        const a = rng.int(-2, 7) + (rng.chance(0.3) ? 0.5 : 0);
        const b = a + rng.pick([0.5, 1, 1.5, 2, 3]);
        sts.push({ curve: ci, t, a, b: t === 'between' ? b : null });
      }
      if (new Set(sts.map((x) => JSON.stringify(x))).size < 3) return null;
      const who = (ci) => (k === 1 ? 'X' : `${names[ci]}'s P&L`);
      const statements = sts.map((st) => {
        const d = DISTS[curves[st.curve].kind](curves[st.curve]);
        const lo = st.t === 'gt' ? st.a : st.t === 'lt' ? -Infinity : st.a;
        const hi = st.t === 'gt' ? Infinity : st.t === 'lt' ? st.a : st.b;
        const p = d.prob(lo === -Infinity ? -50 : lo, hi === Infinity ? 50 : hi);
        return { text: describe(who(st.curve), st), p, how: `Area under ${k === 1 ? 'the curve' : `${names[st.curve]}'s curve`} (${d.desc}) ${st.t === 'gt' ? `to the right of ${fmt(st.a)}` : st.t === 'lt' ? `to the left of ${fmt(st.a)}` : `between ${fmt(st.a)} and ${fmt(st.b)}`}.` };
      });
      return rankItem(ID, rng, difficulty, {
        text: k === 1
          ? 'The curve is the probability density of a random quantity X. Rank the statements about X from most to least likely.'
          : `The curves are the probability densities of tomorrow's P&L (in $k) for ${k} trading desks. Rank the statements from most to least likely.`,
        visual: { type: 'density', xLabel: k === 1 ? 'x' : 'P&L ($k)', yLabel: 'Density', curves: curves.map((c, i) => ({ name: k === 1 ? 'X' : names[i], points: points(c) })) },
        statements,
        intro: [{ say: 'Each statement is an area under one curve; the total area under each curve is 1.', why: 'A density turns probability into area.' }],
        compare: 'Compare areas: width × typical height, symmetry about the peak for bell curves, and flat height 1/width for uniform curves.',
        rule: 'P(a < X < b) = area under the density between a and b. Normal: 68% within 1 sd, 95% within 2 sd.',
        anchor: 'A histogram of many outcomes, with one change: the bars are so thin that the outline becomes a smooth curve, and area still means probability.',
        hints: ['Which curve does each statement use?', 'Estimate each area as width × typical height.', 'Use symmetry and the 68-95 rule for bell curves.'],
        params: { curves, statements: sts },
      });
    });
  },

  // Independent check: trapezoid areas of the rendered polyline points (not the formulas).
  verify(item) {
    const curves = item.prompt.visual.curves;
    const area = (pts, lo, hi) => {
      let s = 0;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        if (x1 <= x0) continue;
        const a = Math.max(lo, x0), b = Math.min(hi, x1);
        if (b <= a) continue;
        const ya = y0 + ((y1 - y0) * (a - x0)) / (x1 - x0), yb = y0 + ((y1 - y0) * (b - x0)) / (x1 - x0);
        s += ((ya + yb) / 2) * (b - a);
      }
      return s;
    };
    const ps = item.params.statements.map((st) => {
      const pts = curves[st.curve].points;
      return st.t === 'gt' ? area(pts, st.a, Infinity) : st.t === 'lt' ? area(pts, -Infinity, st.a) : area(pts, st.a, st.b);
    });
    return agreeRank(item, ps, 0.008);
  },

  lesson: {
    purpose: 'Density-curve questions ask you to compare areas at a glance. Knowing a few landmark areas turns a picture into numbers in seconds.',
    anchor: 'A histogram of outcomes, with one change: infinitely thin bars, so probability is the area under a smooth outline.',
    steps: [
      { say: 'Identify the curve, the interval, and which side is meant.', why: '"Above 3" is the right tail; "between 1 and 2" is a band.' },
      { say: 'Estimate area as width × typical height; use the total area 1 as a check.', why: 'Rectangles approximate thin slices well.' },
      { say: 'Use landmarks: bell curve 68% within 1 sd, 95% within 2 sd; flat curve height = 1/width.', why: 'Most comparisons are settled by one landmark.' },
    ],
    predict: { question: 'Bell curve centred at 3 with sd 1: which is bigger, P(X > 4) or P(2.5 < X < 3)?', answer: 'P(2.5 < X < 3) ≈ 0.19 against P(X > 4) ≈ 0.16.' },
    edge: 'A narrow interval at the peak can beat a wide interval in the tail.',
    rule: 'Area = probability. Width × height; 68-95 for bells; 1/width for flat densities.',
    contrast: 'The height of a density (not a probability) against the area under it (a probability).',
  },
};
