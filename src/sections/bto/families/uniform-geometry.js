// Continuous uniform geometry: broken sticks, meeting times, sums and products of uniforms, points on circles.
import { mcqItem, agreeMc, q, pic, table } from '../lib.js';

const sq = (regions, xLabel, yLabel, caption) => pic('unitsquare', { regions, xLabel, yLabel }, caption);
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const par = (x) => (String(x).includes('/') ? `(${x})` : String(x));

const ID = 'uniform-geometry';
const TRIALS = 20000;

// Each case: exact value, text, distractors, steps, and a one-trial simulator (for verify only).
function build(kind, rng) {
  switch (kind) {
    case 'ratio': {
      const k = rng.int(2, 5);
      return {
        value: q(2, k + 1), data: { kind, k },
        text: `A stick is broken at a uniformly random point. What is the probability that the longer piece is at least ${k} times as long as the shorter piece?`,
        distractors: [
          { value: q(1, k), misconception: `Used 1/${k} directly, as if the ratio were uniform.` },
          { value: q(1, k + 1), misconception: 'Only allowed the break on one side of the midpoint; the mirror side works too.' },
          { value: q(k - 1, k + 1), misconception: 'Answered the complement.' },
          { value: q(2, k), misconception: `Put the cut-off at 1/${k} of the stick instead of 1/${k + 1}: shorter/longer = 1/${k} means shorter = 1/${k + 1} of the whole.` },
        ],
        steps: [
          { say: `Longer ≥ ${k} × shorter ⇔ shorter ≤ 1/${k + 1} of the stick.`, why: `If the shorter piece is s, the longer is 1 − s, and 1 − s ≥ ${k}s ⇔ s ≤ 1/${k + 1}.` },
          { say: `The break must lie within 1/${k + 1} of either end: total length 2/${k + 1}.`, why: 'Two end zones, one on each side.' },
          { say: `P = ${q(2, k + 1)}.`, why: 'Uniform break: probability = length of the favourable set.' },
        ],
        sim: (r) => { const x = r.next(); const s = Math.min(x, 1 - x); return 1 - s >= k * s; },
        picture: pic('numberline', { min: 0, max: 1, step: 0.1, barriers: [1 / (k + 1), k / (k + 1)], marks: [{ x: 1 / (k + 1), label: `1/${k + 1}` }, { x: k / (k + 1), label: `${k}/${k + 1}` }] }, `The stick from 0 to 1. A break outside the two bars leaves a short piece of at most 1/${k + 1}: two end zones, ${q(2, k + 1)} of the length.`),
        fast: `Two end zones of 1/${k + 1}: ${q(2, k + 1)}.`,
        check: `k = 1 must give 1 (the longer piece is always at least as long), and the answer shrinks as k grows: 2/${k + 1} fits both.`,
      };
    }
    case 'triangle':
      return {
        value: q(1, 4), data: { kind },
        text: 'A stick is broken at two independent uniformly random points. What is the probability that the three pieces can form a triangle?',
        distractors: [
          { value: 0.5, misconception: 'Assumed a triangle forms half the time; the condition "every piece shorter than 1/2" is stricter.' },
          { value: q(3, 4), misconception: 'Answered the complement.' },
          { value: q(1, 8), misconception: 'Multiplied three "piece < 1/2" chances of 1/2 as if independent. The pieces must sum to 1, so they are dependent.' },
          { value: q(1, 3), misconception: 'Guessed one of three pieces being too long; the chance that some piece exceeds 1/2 is 3/4, not 2/3.' },
        ],
        steps: [
          { say: 'Three pieces form a triangle iff every piece is shorter than 1/2.', why: 'Triangle inequality: each side < sum of the other two = 1 − itself.' },
          { say: 'P(a given piece ≥ 1/2) = 1/4, and at most one piece can be that long, so P(some piece ≥ 1/2) = 3/4.', why: 'For the left piece: both cuts > 1/2, probability 1/4; the three events are disjoint.' },
          { say: 'P(triangle) = 1 − 3/4 = 1/4.', why: 'Complement.' },
        ],
        sim: (r) => { const a = r.next(), b = r.next(); const x = Math.min(a, b), y = Math.max(a, b); return x < 0.5 && y - x < 0.5 && 1 - y < 0.5; },
        picture: sq([{ points: [[0, 0.5], [0.5, 0.5], [0.5, 1]], area: '1/8', label: 'triangle', tone: 3 }, { points: [[0.5, 0], [1, 0.5], [0.5, 0.5]], area: '1/8', label: 'triangle', tone: 3 }], 'first break', 'second break', 'Each point of the square is a pair of break points. The two shaded triangles are where every piece is shorter than 1/2: 1/8 + 1/8 = 1/4.'),
        fast: 'Complement: some piece is at least 1/2 with chance 3 × 1/4; so 1/4.',
        check: 'Each of the three pieces is too long with chance 1/4 and only one piece can be, so 1 − 3/4. Answers like 1/2 count breaks, not pieces.',
      };
    case 'meet': {
      const w = rng.pick([5, 10, 12, 15, 20, 30]);
      const f = w / 60;
      return {
        value: q(1).sub(q(60 - w, 60).mul(q(60 - w, 60))), data: { kind, w },
        text: `Two friends each arrive at a café at an independent uniformly random time between 12:00 and 13:00. Each waits ${w} minutes for the other and then leaves. What is the probability that they meet?`,
        distractors: [
          { value: f, misconception: 'Counted only one friend waiting for the other.' },
          { value: Math.min(1, 2 * f), misconception: 'Added both waiting windows without removing the parts that fall outside the hour.' },
          { value: f * f, misconception: 'Squared the waiting fraction; that is the corner area, not the band.' },
          { value: (1 - f) ** 2, misconception: 'Answered the complement: the two corner triangles where they miss.' },
        ],
        steps: [
          { say: 'Plot the arrival times (x, y) in a 60 × 60 square; they meet iff |x − y| ≤ ' + w + '.', why: 'Uniform independent times → uniform point in the square.' },
          { say: `The miss region is two corner triangles, each with legs ${60 - w}: total area (${60 - w})².`, why: 'Outside the diagonal band.' },
          { say: `P = 1 − (${60 - w}/60)² = ${(1 - (1 - f) ** 2).toFixed(4)}.`, why: 'Area of the band over area of the square.' },
        ],
        sim: (r) => Math.abs(r.next() - r.next()) <= f,
        picture: sq([{ points: [[0, 0], [r4(f), 0], [1, r4(1 - f)], [1, 1], [r4(1 - f), 1], [0, r4(f)]], label: 'meet', tone: 3 }], 'first arrival (hour)', 'second arrival (hour)', `The hour as a unit square of arrival pairs. They meet inside the band |x − y| ≤ ${w}/60; the two corner triangles with legs ${60 - w}/60 are misses, so 1 − (${60 - w}/60)².`),
        fast: `1 − (1 − ${w}/60)² = 1 − (${60 - w}/60)² ≈ ${(1 - (1 - f) ** 2).toFixed(4)}.`,
        check: `At least ${w}/60 (the band is wider than that near the middle) and below 2 × ${w}/60 = ${((2 * w) / 60).toFixed(3)}, which counts the band's corners twice.`,
      };
    }
    case 'sum': {
      const s = rng.pick([q(1, 2), q(3, 4), q(1, 1), q(5, 4), q(3, 2), q(2, 3), q(4, 3)]);
      const sv = s.toNumber();
      const v = sv <= 1 ? s.mul(s).div(q(2)) : q(1).sub(q(2).sub(s).mul(q(2).sub(s)).div(q(2)));
      return {
        value: v, data: { kind, s: sv },
        text: `X and Y are independent and uniform on [0, 1]. What is the probability that X + Y < ${s}?`,
        distractors: [
          { value: sv / 2, misconception: 'Treated X + Y as uniform on [0, 2]. Its density is a triangle peaked at 1.' },
          { value: Math.min(1, sv * sv), misconception: 'Forgot the factor 1/2 in the triangle area.' },
          { value: 1 - v.toNumber(), misconception: 'Answered the complement.' },
          { value: Math.min(1, sv), misconception: 'Used s itself as the probability.' },
        ],
        steps: [
          { say: `The event is the part of the unit square below the line x + y = ${s}.`, why: 'Uniform independent X, Y → uniform point in the square.' },
          { say: sv <= 1 ? `That is a triangle with legs ${s}: area ${par(s)}²/2.` : `The complement is a corner triangle with legs 2 − ${s}: area (2 − ${s})²/2.`, why: 'Geometry of the region.' },
          { say: `P = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Probability = area.' },
        ],
        sim: (r) => r.next() + r.next() < sv,
        picture: sq([{ points: sv <= 1 ? [[0, 0], [sv, 0], [0, sv]] : [[0, 0], [1, 0], [1, sv - 1], [sv - 1, 1], [0, 1]], area: v.toString(), label: `x + y < ${s}`, tone: 3 }], 'X', 'Y', `The shaded part of the square lies below the line x + y = ${s}. ${sv <= 1 ? `It is a triangle with legs ${s}: ${par(s)}²/2.` : `It is everything except a corner triangle with legs 2 − ${s}.`}`),
        fast: sv <= 1 ? `${par(s)}²/2 = ${v}.` : `1 − (2 − ${s})²/2 = ${v}.`,
        check: `By symmetry P(X + Y < 1) = 1/2, so the answer is ${sv < 1 ? 'below' : sv > 1 ? 'above' : 'exactly'} 1/2; treating X + Y as uniform on [0, 2] would give ${q(1, 2).mul(s)}, which ignores the peak at 1.`,
      };
    }
    case 'product': {
      const a = rng.pick([0.1, 0.2, 0.25, 0.5]);
      const v = a * (1 - Math.log(a));
      return {
        value: v, exact: `${a}(1 − ln ${a})`, data: { kind, a },
        text: `X and Y are independent and uniform on [0, 1]. What is the probability that XY < ${a}?`,
        distractors: [
          { value: a, misconception: 'Treated the product as uniform. Products pile up near 0.' },
          { value: Math.sqrt(a), misconception: 'Used P(both below √a), which is only part of the region.' },
          { value: a * a, misconception: 'Squared the threshold.' },
          { value: 2 * a, misconception: 'Doubled the threshold for the two variables.' },
          { value: 1 - v, misconception: 'Answered the complement.' },
        ],
        steps: [
          { say: `P(XY < ${a}) = ∫₀¹ P(Y < ${a}/x) dx.`, why: 'Condition on X = x.' },
          { say: `For x ≤ ${a} the inner probability is 1; for x > ${a} it is ${a}/x. So P = ${a} + ${a}·(−ln ${a}).`, why: '∫ from a to 1 of a/x dx = −a ln a.' },
          { say: `P = ${a}(1 − ln ${a}) ≈ ${v.toFixed(4)}.`, why: 'Combine.' },
        ],
        sim: (r) => r.next() * r.next() < a,
        picture: sq([{ points: [[0, 0], [1, 0], ...Array.from({ length: 21 }, (_, i) => { const x = 1 - (i * (1 - a)) / 20; return [r4(x), r4(Math.min(1, a / x))]; }), [0, 1]], label: `xy < ${a}`, tone: 3 }], 'X', 'Y', `The region under the curve y = ${a}/x: the full strip x < ${a} (area ${a}) plus the area under the curve from ${a} to 1, which is −${a} ln ${a}.`),
        fast: `${a}(1 − ln ${a}) ≈ ${v.toFixed(4)}.`,
        check: `At least ${a} (the strip where X < ${a} always works) and far more than ${a}² = ${(a * a).toFixed(3)}, which would require both X and Y below ${a}.`,
      };
    }
    case 'semicircle':
      return {
        value: q(3, 4), data: { kind },
        text: 'Three points are chosen independently and uniformly on a circle. What is the probability that all three lie on some semicircle?',
        distractors: [
          { value: 0.5, misconception: 'Assumed a fixed semicircle; the semicircle may be chosen after seeing the points.' },
          { value: q(1, 4), misconception: 'Answered the complement: the triangle contains the centre.' },
          { value: q(1, 8), misconception: 'Required each point to fall in one fixed semicircle: (1/2)³.' },
          { value: q(3, 8), misconception: 'Used 3 × (1/2)³. The leading point sits at the start of its own semicircle for free, so each term is (1/2)², not (1/2)³.' },
        ],
        steps: [
          { say: 'For each point i, let A_i = "the other two lie in the semicircle starting at point i, going clockwise".', why: 'If the points fit in a semicircle, exactly one of them is its clockwise-first point.' },
          { say: 'P(A_i) = (1/2)² = 1/4, and the A_i are disjoint.', why: 'Each other point independently falls in that half.' },
          { say: 'P = 3 × 1/4 = 3/4.', why: 'Add disjoint events (n/2^(n−1) for n points).' },
        ],
        sim: (r) => { const t = [r.next(), r.next(), r.next()].sort((a, b) => a - b); const gaps = [t[1] - t[0], t[2] - t[1], 1 - t[2] + t[0]]; return Math.max(...gaps) >= 0.5; },
        picture: table(['Event', 'Chance'], [['the other two fall within half a turn clockwise of point 1', '1/4'], ['… of point 2', '1/4'], ['… of point 3', '1/4'], ['all three on one semicircle (disjoint, so add)', '3/4']], 'If the points fit in a semicircle, exactly one of them is the clockwise-first point of that semicircle, so the three events never overlap and their chances add.'),
        fast: 'n points: n/2^(n − 1); for 3 points, 3/4.',
        check: 'Two points always share a semicircle, so three points do so with a high chance; 1/2 or 1/4 understate it, and the n/2^(n − 1) rule gives 1 for n = 2 as it must.',
      };
    default: { // distance of a random point in the unit square to the centre
      const rr = rng.pick([0.25, 0.3, 0.4, 0.5]);
      const v = Math.PI * rr * rr;
      return {
        value: v, exact: `π × ${rr}²`, data: { kind: 'disc', r: rr },
        text: `A point is chosen uniformly in a unit square. What is the probability that it lies within ${rr} of the square's centre?`,
        distractors: [
          { value: 2 * rr, misconception: 'Used the diameter as a length fraction; the event is an area.' },
          { value: rr * rr, misconception: 'Forgot the factor π in the disc area.' },
          { value: 4 * rr * rr, misconception: 'Used the area of the enclosing square instead of the disc.' },
          { value: 1 - v, misconception: 'Answered the complement.' },
          { value: Math.PI * rr * rr / 4, misconception: 'Used a quarter disc, as if the point were measured from a corner.' },
        ],
        steps: [
          { say: `The favourable region is a disc of radius ${rr}, fully inside the square.`, why: `${rr} ≤ 0.5, so the disc does not cross the edges.` },
          { say: `P = area = π × ${rr}² ≈ ${v.toFixed(4)}.`, why: 'Uniform point: probability = area / 1.' },
        ],
        sim: (r) => (r.next() - 0.5) ** 2 + (r.next() - 0.5) ** 2 < rr * rr,
        picture: sq([{ points: Array.from({ length: 48 }, (_, i) => [r4(0.5 + rr * Math.cos((2 * Math.PI * i) / 48)), r4(0.5 + rr * Math.sin((2 * Math.PI * i) / 48))]), label: `radius ${rr}`, tone: 3 }], 'x', 'y', `The favourable region is the disc of radius ${rr} around the centre, fully inside the square, so the probability is its area π × ${rr}².`),
        fast: `π × ${rr}² ≈ ${v.toFixed(4)}.`,
        check: `The disc fits inside the square of side ${2 * rr} around the centre, so the answer is below ${(2 * rr) ** 2} and above the inner square's ${(2 * rr * rr).toFixed(3)}.`,
      };
    }
  }
}

export default {
  id: ID,
  section: 'bto',
  title: 'Uniform geometry: sticks, meetings, areas',
  skill: 'Turn independent uniform choices into a point in a square (or on a line) and measure the favourable area',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const kind = difficulty === 2 ? rng.pick(['ratio', 'sum', 'disc']) : difficulty === 3 ? rng.pick(['meet', 'triangle', 'sum']) : rng.pick(['product', 'semicircle', 'triangle', 'meet']);
    const b = build(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      value: b.value, exact: b.exact, text: b.text, distractors: b.distractors, steps: b.steps, picture: b.picture, fast: b.fast, check: b.check,
      rule: 'Two independent uniforms = a uniform point in the unit square; probability = area. Triangle from a broken stick: 1/4. Semicircle, n points: n/2^(n−1).',
      anchor: 'A single uniform point on a line has P(in an interval) = its length. Two uniforms are the same idea with one change: a point in a square, so lengths become areas.',
      hints: ['Draw the sample space: a segment or a unit square.', 'Shade the favourable region.', 'Compute its length or area.'],
      data: b.data,
    });
  },

  // Independent check: Monte Carlo with the passed rng (no exact route shared with the generator).
  verify(item, rng) {
    const b = build(item.params.kind, fixed(item.params));
    let hits = 0;
    for (let t = 0; t < TRIALS; t++) if (b.sim(rng)) hits++;
    return agreeMc(item, hits, TRIALS);
  },

  lesson: {
    purpose: 'Continuous questions (broken sticks, arrival windows) look hard but are geometry: the probability is an area in a square.',
    anchor: 'For one uniform point on [0, 1], P(interval) = length. Two independent uniforms: the same with one change, a point in the unit square, so P = area.',
    steps: [
      { say: 'Name the random quantities and their ranges; map them to a segment, square or circle.', why: 'Independent uniforms fill the product space evenly.' },
      { say: 'Write the event as an inequality (|x − y| ≤ w, x + y < s, every piece < 1/2).', why: 'Inequalities cut regions out of the square.' },
      { say: 'Compute the area directly or through its complement (often corner triangles).', why: 'Corners are easier than bands.' },
    ],
    predict: { question: 'Two people each wait 30 minutes within the same hour. Is P(meet) above or below 1/2?', answer: 'Above: 1 − (1/2)² = 3/4.' },
    edge: 'Waiting 60 minutes: they always meet (probability 1).',
    rule: 'P = favourable area. Meeting with wait w: 1 − (1 − w)². Triangle from two breaks: 1/4.',
    contrast: 'Sum of two uniforms (triangular, peaked at 1) against one uniform stretched to [0, 2] (flat).',
  },
};

// Minimal rng stand-in so build() reproduces the item's parameters from data (pick returns the stored value).
function fixed(data) {
  const val = { ratio: data.k, meet: data.w, product: data.a, disc: data.r }[data.kind];
  return {
    int: () => val,
    pick: (arr) => {
      if (data.kind === 'sum') return arr.find((x) => Math.abs((x.toNumber ? x.toNumber() : x) - data.s) < 1e-12);
      return val;
    },
  };
}
