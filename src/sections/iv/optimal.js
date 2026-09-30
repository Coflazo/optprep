// Expected-score-optimal interval for the Intervals scoring rule
//   score = L/U if L <= truth <= U (and L > 0), else 0.
// belief describes a well-prepared candidate's uncertainty about the truth around their
// point estimate `center`:
//   { kind: 'point' }                 exact answer: zero width is optimal
//   { kind: 'normal', sd }            truth ~ Normal(center, sd), sd in the item's unit
//   { kind: 'lognormal', sd }         ln(truth) ~ Normal(ln center, sd), sd in log units
// bestInterval maximises E[score] numerically (coarse grid, then two refinements).

// Standard normal CDF (Abramowitz-Stegun 7.1.26 erf, |error| < 1.5e-7).
export function Phi(z) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

// E[score] of [lower, upper] under the belief.
export function expectedScore(belief, center, lower, upper) {
  if (!(lower > 0) || !(upper >= lower)) return 0;
  if (belief.kind === 'point') return center >= lower && center <= upper ? lower / upper : 0;
  const p = belief.kind === 'normal'
    ? Phi((upper - center) / belief.sd) - Phi((lower - center) / belief.sd)
    : Phi(Math.log(upper / center) / belief.sd) - Phi(Math.log(lower / center) / belief.sd);
  return (lower / upper) * p;
}

// Search over (a, b) = interval ends in standard-deviation units from the centre.
export function bestInterval(belief, center) {
  if (!belief || belief.kind === 'point' || !(belief.sd > 0)) return { lower: center, upper: center, score: 1 };
  const toLU = belief.kind === 'normal'
    ? (a, b) => [center + a * belief.sd, center + b * belief.sd]
    : (a, b) => [center * Math.exp(a * belief.sd), center * Math.exp(b * belief.sd)];
  const f = (a, b) => { const [L, U] = toLU(a, b); return expectedScore(belief, center, L, U); };
  let best = { a: 0, b: 0, v: -1 };
  const scan = (a0, a1, b0, b1, step) => {
    for (let a = a0; a <= a1 + 1e-12; a += step) {
      for (let b = Math.max(a, b0); b <= b1 + 1e-12; b += step) {
        const v = f(a, b);
        if (v > best.v) best = { a, b, v };
      }
    }
  };
  scan(-4, 1, -1, 5, 0.1);
  for (const [w, st] of [[0.15, 0.01], [0.012, 0.001]]) scan(best.a - w, best.a + w, best.b - w, best.b + w, st);
  const [lower, upper] = toLU(best.a, best.b);
  return { lower, upper, score: best.v };
}
