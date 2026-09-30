import { ivItem } from '../lib.js';

// Powers, roots, logs and compound growth: exact in principle, estimated in practice.
const S = {
  sqrt: { level: 2, make: (rng) => ({ x: rng.int(1000, 99999) }), f: ({ x }) => Math.sqrt(x), text: ({ x }) => `Estimate √${x}.`, sd: 0.01,
    how: ({ x }) => `Bracket with squares: ${Math.floor(Math.sqrt(x))}² = ${Math.floor(Math.sqrt(x)) ** 2} and ${Math.ceil(Math.sqrt(x))}² = ${Math.ceil(Math.sqrt(x)) ** 2}, then interpolate.` },
  cbrt: { level: 3, make: (rng) => ({ x: rng.int(1000, 999999) }), f: ({ x }) => Math.cbrt(x), text: ({ x }) => `Estimate the cube root of ${x}.`, sd: 0.015,
    how: ({ x }) => `Bracket with cubes: ${Math.floor(Math.cbrt(x))}³ = ${Math.floor(Math.cbrt(x)) ** 3} and ${Math.ceil(Math.cbrt(x))}³ = ${Math.ceil(Math.cbrt(x)) ** 3}, then interpolate (a 3% change in x is a 1% change in the root).` },
  pow2: { level: 2, make: (rng) => ({ k: rng.int(11, 20) }), f: ({ k }) => 2 ** k, text: ({ k }) => `What is 2^${k}?`, exact: true,
    how: ({ k }) => `2^10 = 1024, so 2^${k} = 1024 × 2^${k - 10} = ${2 ** k}.` },
  bigpow: { level: 4, make: (rng) => ({ b: rng.pick([2, 3, 7, 1.5]), k: rng.int(12, 30) }), f: ({ b, k }) => b ** k, text: ({ b, k }) => `Estimate ${b}^${k}.`, sd: 0.04,
    how: ({ b, k }) => `Use logs: ${k} × log10(${b}) = ${(k * Math.log10(b)).toFixed(3)}, so ${b}^${k} ≈ 10^${(k * Math.log10(b)).toFixed(3)}.` },
  compound: { level: 3, make: (rng) => ({ r: rng.int(2, 12), n: rng.int(5, 30), p: rng.pick([100, 1000, 5000, 10000]) }), f: ({ r, n, p }) => p * (1 + r / 100) ** n, text: ({ r, n, p }) => `An account of ${p} grows by ${r}% per year, compounded yearly. Estimate its value after ${n} years.`, sd: 0.03,
    how: ({ r, n }) => `Rule of 72: doubling time ≈ ${(72 / r).toFixed(1)} years, so ${n} years ≈ ${(n / (72 / r)).toFixed(2)} doublings: factor 2^${(n / (72 / r)).toFixed(2)}.` },
  ln: { level: 3, make: (rng) => ({ x: rng.int(20, 90000) }), f: ({ x }) => Math.log(x), text: ({ x }) => `Estimate ln(${x}), the natural logarithm.`, sd: 0.01,
    how: ({ x }) => `ln(${x}) = log10(${x}) × ln(10) ≈ ${Math.log10(x).toFixed(3)} × 2.3026.` },
  exp: { level: 4, make: (rng) => ({ x: +rng.float(1, 9).toFixed(1) }), f: ({ x }) => Math.exp(x), text: ({ x }) => `Estimate e^${x}.`, sd: 0.02,
    how: ({ x }) => `e^${x} = 10^(${x} × 0.4343) = 10^${(x * 0.4343).toFixed(3)}; or combine e^2 ≈ 7.389 and e^0.5 ≈ 1.649.` },
};
const ALT = {
  sqrt: ({ x }) => { let g = x / 2; for (let i = 0; i < 60; i++) g = (g + x / g) / 2; return g; },
  cbrt: ({ x }) => Math.exp(Math.log(x) / 3),
  pow2: ({ k }) => Number(1n << BigInt(k)),
  bigpow: ({ b, k }) => { let r = 1; for (let i = 0; i < k; i++) r *= b; return r; },
  compound: ({ r, n, p }) => { let v = p; for (let i = 0; i < n; i++) v += v * r / 100; return v; },
  ln: ({ x }) => {
    const atanh2 = (y) => { let s = 0; for (let k = 0; k < 60; k++) s += y ** (2 * k + 1) / (2 * k + 1); return 2 * s; };
    let k = 0, m = x;
    while (m >= 2) { m /= 2; k++; }
    return k * atanh2(1 / 3) + atanh2((m - 1) / (m + 1)); // ln 2 = 2 atanh(1/3)
  },
  exp: ({ x }) => { let s = 1, t = 1; for (let k = 1; k < 80; k++) { t *= x / k; s += t; } return s; },
};

const fam = {
  id: 'powers-roots',
  section: 'iv',
  title: 'Powers, roots, logs and growth',
  skill: 'Bracket between known values, interpolate, and use logs for large powers',
  levels: [2, 3, 4],
  generate(rng, { difficulty = 2 } = {}) {
    const key = rng.pick(Object.keys(S).filter((k) => S[k].level === difficulty)), sc = S[key], params = sc.make(rng);
    const truth = sc.f(params);
    const coach = sc.exact ? { exact: true, belief: { kind: 'point' }, note: 'Exact from 2^10 = 1024: zero width.' } : { exact: false, belief: { kind: 'lognormal', sd: sc.sd }, note: `A prepared estimate is good to about ±${(sc.sd * 100).toFixed(1)}%.` };
    return ivItem(fam, rng, difficulty, {
      text: sc.text(params), truth, unit: key === 'compound' ? '' : '', coach,
      steps: [
        { say: sc.how(params), why: 'Anchor on values you know exactly, then adjust.' },
        { say: `Exact value: ${truth.toPrecision(8)}.`, why: 'Computed to full precision.' },
      ],
      hints: ['Which nearby values do you know exactly?', 'For big powers, work in log10 and convert back.'],
      params: { scenario: key, ...params },
    });
  },
  // Independent check: a different numerical method for each function.
  verify(item) {
    const v = ALT[item.params.scenario](item.params);
    return { ok: Math.abs(v / item.truth - 1) < 1e-9, detail: `alternative ${v}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Roots, logs and compound growth are classic estimation targets. Knowing a few anchors (squares, 2^10, log10 2 = 0.301, ln 10 = 2.303, rule of 72) makes them quick.',
    anchor: 'Rounding to friendly numbers, applied to functions: find the nearest values you know exactly and interpolate between them.',
    steps: [
      { say: 'Bracket: find known values either side (squares, cubes, powers of 2 or 10).', why: 'Bracketing bounds the answer before any arithmetic.' },
      { say: 'Interpolate proportionally: for a root, a 1% change in x is a 0.5% (square) or 0.33% (cube) change in the root.', why: 'Relative changes scale by the exponent.' },
      { say: 'For large powers, use log10: k × log10(b), then 10 to that power.', why: 'Logs turn powers into multiplication.' },
    ],
    predict: { question: 'Estimate √5000.', answer: '70² = 4900, 71² = 5041: about 70.7 (exact 70.71).' },
    rule: 'Bracket with known values, interpolate proportionally, logs for powers; interval ±1 to 4%.',
    contrast: 'Compound growth is not linear: 7% for 10 years is ×1.97, not ×1.7.',
    edge: '2^k is exact from 2^10 = 1024: give zero width. The rule of 72 drifts for rates above 10%.',
  },
};
export default fam;
