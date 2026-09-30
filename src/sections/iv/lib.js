// Shared builder for Intervals items: every family computes a truth and a coach object,
// and this file turns them into a contract-valid item with a closing "choose the width" step.
import { bestInterval } from './optimal.js';
import { fmtNum } from '../../core/format.js';

// Rounded display with enough significant figures to be useful as an interval end.
export function show(x) {
  if (!Number.isFinite(x)) return String(x);
  if (Number.isInteger(x)) return fmtNum(x);
  const a = Math.abs(x);
  const dp = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 4;
  return fmtNum(Number(x.toFixed(dp)));
}
// Same rounding without thousands separators, for interval ends typed into inputs.
export function plain(x) {
  const a = Math.abs(x);
  return String(Number(x.toFixed(a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 4)));
}

// Two-decimal bracket around a non-terminating exact value, e.g. 41.666… -> [41.66, 41.67].
export function bracket(x) {
  const lo = Math.floor(x * 100 + 1e-9) / 100, hi = Math.ceil(x * 100 - 1e-9) / 100;
  return [lo, hi];
}

const memo = new Map();
export function optimal(belief, center) {
  if (belief.kind === 'point') return { lower: center, upper: center, score: 1 };
  // the optimum scales with the centre: cache on the relative spread
  const rel = belief.kind === 'normal' ? belief.sd / center : belief.sd;
  const key = `${belief.kind}:${rel.toPrecision(3)}`;
  if (!memo.has(key)) memo.set(key, bestInterval({ kind: belief.kind, sd: Number(rel.toPrecision(3)) }, 1));
  const r = memo.get(key);
  return { lower: r.lower * center, upper: r.upper * center, score: r.score };
}

// The closing step every solution shares: how wide to go, and why.
export function widthStep(coach, truth) {
  if (coach.exact && coach.belief.kind === 'point') {
    const [lo, hi] = bracket(truth);
    const terminating = Math.abs(truth * 1e6 - Math.round(truth * 1e6)) < 1e-6 * Math.max(1, truth);
    return {
      say: terminating ? `Exact answer, so give a zero-width interval: [${+truth.toFixed(6)}, ${+truth.toFixed(6)}], score 1.` : `Exact but non-terminating (${truth.toPrecision(8)}…), so bracket it tightly: [${lo}, ${hi}], score ${(lo / hi).toFixed(4)}.`,
      why: 'Score = lower/upper when the truth is inside. With no uncertainty, any width only lowers the score.',
    };
  }
  const o = optimal(coach.belief, truth);
  const normal = coach.belief.kind === 'normal', sd = coach.belief.sd;
  const below = normal ? (truth - o.lower) / sd : Math.log(truth / o.lower) / sd;
  const above = normal ? (o.upper - truth) / sd : Math.log(o.upper / truth) / sd;
  const spread = normal ? `±${show(sd)}` : `±${Math.round(sd * 100)}%`;
  return {
    say: `A well-prepared estimate is uncertain by about ${spread} (one standard deviation). The expected-score-optimal interval around a spot-on estimate is about [${plain(o.lower)}, ${plain(o.upper)}], expected score ${o.score.toFixed(2)}.`,
    why: normal
      ? `A miss scores 0 while width only costs the ratio lower/upper, so the optimum covers ${below.toFixed(1)} sd below and ${above.toFixed(1)} sd above: it leans high because a higher interval has a larger ratio.`
      : `A miss scores 0 while width only costs the ratio lower/upper, so the optimum covers ${below.toFixed(1)} sd each way on a log scale, which puts more room above the estimate than below.`,
  };
}

// Assemble the item. `steps` explain the computation; the width step is appended.
// params: plain JSON with every input behind `truth`, so an external pipeline can recompute it.
export function ivItem(fam, rng, difficulty, { text, visual, truth, unit, coach, steps, hints, params, exact }) {
  const it = {
    id: `iv:${fam.id}:${rng.seed}`,
    section: 'iv',
    family: fam.id,
    difficulty,
    kind: 'interval',
    prompt: visual ? { text, visual } : { text },
    truth,
    unit,
    coach,
    answer: { value: truth, display: show(truth), ...(exact ? { exact } : {}) },
    solution: { steps: [...steps, widthStep(coach, truth)], rule: fam.lesson.rule, anchor: fam.lesson.anchor },
    hints,
    params,
  };
  return it;
}

export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Non-overlapping random centres in a w x h box (rejection sampling; n stays small).
export function scatter(rng, n, w, h, minDist, margin = minDist) {
  const pts = [];
  for (let tries = 0; pts.length < n && tries < n * 400; tries++) {
    const x = rng.float(margin, w - margin), y = rng.float(margin, h - margin);
    if (pts.every(([a, b]) => (a - x) ** 2 + (b - y) ** 2 >= minDist * minDist)) pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return pts.length === n ? pts : null;
}
