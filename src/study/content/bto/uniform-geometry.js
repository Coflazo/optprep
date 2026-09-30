// Continuous uniforms as geometry: one uniform is a point on a segment (probability = length), two
// are a point in the unit square (probability = area). Every number shown is computed here.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const one = Q.of(1);
const meet = (w) => one.sub(one.sub(w).mul(one.sub(w))); // w = waiting time as a fraction of the window
const sumBelow = (s) => (s.cmp(one) <= 0 ? s.mul(s).div(Q.of(2)) : one.sub(Q.of(2).sub(s).mul(Q.of(2).sub(s)).div(Q.of(2))));
const ratio = (k) => Q.of(2, k + 1); // longer ≥ k × shorter
const semi = (n) => Q.of(n, 2 ** (n - 1));
const prod = (a) => a * (1 - Math.log(a));
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const f4 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(4);
const CH = { w: 20, T: 60 };
const W = Q.of(CH.w, CH.T);
const w = W.toNumber();
const S34 = Q.of(3, 4);
const K = 3;

export default {
  id: 'bto/uniform-geometry',
  book: 'bto',
  kind: 'family',
  family: 'uniform-geometry',
  title: 'Uniform geometry: sticks, meetings, areas',
  summary: 'Independent uniforms are a uniform point in a square, so probability = area. Meeting with wait w: 1 − (1 − w)². Stick into a triangle: 1/4. n points in a semicircle: n/2^(n−1).',
  prerequisites: ['prob/sample-spaces', 'bto/expected-extremes'],
  objectives: [
    'Map one uniform to a segment and two independent uniforms to the unit square',
    'Write the event as an inequality, shade it, and find its area, often through the corners',
    'Solve the standard cases: meeting in a window, X + Y < s, a stick broken into a triangle, the longer piece at least k times the shorter',
    'Quote the semicircle rule n/2^(n−1) and the product rule P(XY < a) = a(1 − ln a)',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: two friends each arrive at a café at a uniformly random time between 12:00 and 13:00, independently. Each waits ${CH.w} minutes for the other, then leaves. What is the probability that they meet? Try two approaches.`, answer: `1 − (${CH.T - CH.w}/${CH.T})² = ${meet(W)} ≈ ${f3(meet(W))}`, explain: `If you answered ${W} you let only one friend wait; if ${Q.of(2).mul(W)} you added both waits without trimming the parts outside the hour. Drawn as a square of arrival times, the "miss" region is two corner triangles, and corners are easy.` },
    { type: 'text', text: 'Quantities are chosen **uniformly at random** from an interval (arrival times, break points on a stick, numbers in [0, 1], points on a circle) and the question asks for the probability of a condition on them: meeting, forming a triangle, a sum or product below a level.' },
    { type: 'list', items: ['"A stick is broken at two random points: P(the pieces form a triangle)?"', '"X, Y uniform on [0, 1]: P(X + Y < 3/4)?"', '"Three random points on a circle: P(they lie in some semicircle)?"'] },
    { type: 'text', text: 'Not this lesson: **expected** positions of uniform points (bto/expected-extremes), and sums of many uniforms, where the normal curve takes over (bto/clt-estimates).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['X, Y uniform on [0, 1]: P(|X − Y| < 1/4)', 'X, Y uniform on [0, 1]: E|X − Y|', 'Two dice: P(the difference is at most 1)', '100 uniforms: P(their sum exceeds 55)'], answer: 0, traps: { 1: 'an expectation: bto/expected-extremes', 2: 'discrete dice: count cells, not areas', 3: 'many uniforms: bto/clt-estimates' }, explain: 'Two continuous uniforms and a condition: an area in the unit square.' },
    ] },

    S('why'),
    { type: 'text', text: 'Continuous questions look like integrals, and candidates freeze. They are really geometry: draw the square, shade the event, measure the area. The shapes are almost always triangles and bands, and the complement is often two corner triangles. With the picture, most of these items take under a minute.' },

    S('anchor'),
    { type: 'text', text: 'You know that one uniform point on [0, 1] lands in an interval with probability equal to its **length**. Two independent uniforms are the same idea with **one change**: the pair (X, Y) is a uniform point in the unit square, so lengths become **areas**.' },
    { type: 'check', scope: 'probability = length', questions: [
      { make: (rng) => { const a = rng.pick([0.1, 0.2, 0.25, 0.3]), b = rng.pick([0.6, 0.7, 0.75, 0.9]); return { type: 'number', q: `X is uniform on [0, 1]. P(${a} < X < ${b})?`, answer: Number((b - a).toFixed(2)), tolerance: 1e-9, explain: `Length ${b} − ${a} = ${(b - a).toFixed(2)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: `A stick of length 1 broken at one uniform point. The longer piece is at least ${K} times the shorter exactly when the shorter piece is at most 1/${K + 1} of the stick, so the break must fall near an end.` },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 1, step: 1 / (K + 1), barriers: [1 / (K + 1), K / (K + 1)], marks: [{ x: 1 / (2 * (K + 1)), label: 'favourable' }, { x: 0.5, label: 'pieces too even' }, { x: 1 - 1 / (2 * (K + 1)), label: 'favourable' }] }, caption: `Favourable breaks: [0, 1/${K + 1}] and [${K}/${K + 1}, 1], total length ${ratio(K)}. The middle stretch gives two pieces too close in size.` },
    { type: 'check', scope: 'one break: probability = length', questions: [
      { make: (rng) => { const k = rng.int(2, 6); return mc(rng, `A stick is broken at a uniform point. P(the longer piece is at least ${k} times the shorter)?`, ratio(k).toString(), [[Q.of(1, k).toString(), 'treated the ratio as uniform'], [Q.of(1, k + 1).toString(), 'used only one end of the stick'], [Q.of(k - 1, k + 1).toString(), 'answered the complement'], [Q.of(2, k).toString(), `put the cut-off at 1/${k} instead of 1/${k + 1}`]], `Shorter ≤ 1/${k + 1}: two end zones, ${ratio(k)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: `Two uniforms: the square of arrival times, each side one hour. They meet when |x − y| ≤ ${CH.w} minutes, a band along the diagonal.` },
    { type: 'diagram', diagram: 'unitsquare', spec: { xLabel: 'first arrival', yLabel: 'second arrival', regions: [{ points: [[0, 0], [w, 0], [1, 1 - w], [1, 1], [1 - w, 1], [0, w]], area: meet(W).toString(), label: 'meet', tone: 1 }] }, caption: `The band has area ${meet(W)}. The two white corners are right triangles with legs ${CH.T - CH.w}/${CH.T}, total (${CH.T - CH.w}/${CH.T})² = ${one.sub(meet(W))}: that is the miss probability.` },
    { type: 'check', scope: 'bands through their corners', questions: [
      { make: (rng) => { const m = rng.pick([5, 10, 15, 30, 40]); const v = meet(Q.of(m, 60)); return mc(rng, `Two people arrive uniformly in the same hour, independently; each waits ${m} minutes. P(they meet)?`, v.toString(), [[Q.of(m, 60).toString(), 'let only one of them wait'], [Q.of(Math.min(2 * m, 60), 60).toString(), 'added both waits without trimming the corners'], [Q.of(m * m, 3600).toString(), 'squared the waiting fraction'], [one.sub(v).toString(), 'answered the complement']], `1 − (${60 - m}/60)² = ${v} ≈ ${f3(v)}.`); } },
    ] },
    { type: 'text', text: 'A stick broken at two uniform points x and y. The three pieces form a triangle when every piece is shorter than 1/2. Shade those points of the square.' },
    { type: 'diagram', diagram: 'unitsquare', spec: { xLabel: 'first break x', yLabel: 'second break y', regions: [{ points: [[0, 0.5], [0.5, 0.5], [0.5, 1]], area: '1/8', label: 'x < y', tone: 2 }, { points: [[0.5, 0], [0.5, 0.5], [1, 0.5]], area: '1/8', label: 'y < x', tone: 2 }] }, caption: 'Two small triangles, each 1/8: P(triangle) = 1/4. Everything else has one piece of length at least 1/2.' },
    { type: 'check', scope: 'the broken-stick triangle', questions: [
      { type: 'choice', q: 'A stick is broken at two independent uniform points. P(the three pieces form a triangle)?', options: ['1/4', '1/2', '1/8', '3/4'], answer: 0, traps: { 1: 'guessed half; "every piece below 1/2" is much stricter', 2: 'multiplied three "piece < 1/2" chances as if independent', 3: 'answered the complement' }, explain: 'The two shaded triangles have area 1/8 each.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Name each random quantity and its range, and map them: one uniform to a segment, two independent uniforms to a square.', why: 'Independent uniforms fill the product space evenly, so probability is proportional to length or area.',
        checks: [
          { type: 'choice', q: 'Two arrival times uniform on 9:00 to 10:00, independent. The sample space is:', options: ['a 60 × 60 square', 'a 60-minute segment', 'a triangle', 'a circle'], answer: 0, traps: { 1: 'that is one arrival time', 2: 'the triangle appears only if you order the times', 3: 'nothing is circular here' }, explain: 'One axis per arrival time.' },
        ] },
      { say: 'Write the event as an inequality in x and y, then shade it: |x − y| ≤ w for meeting, x + y < s for a sum, "every piece < 1/2" for a triangle.', why: 'An inequality cuts the square along a straight line, leaving triangles and bands.',
        checks: [
          { make: (rng) => { const s = rng.pick([Q.of(1, 2), Q.of(3, 4), Q.of(2, 3), Q.of(5, 4), Q.of(3, 2)]); const v = sumBelow(s); return mc(rng, `X, Y uniform on [0, 1], independent. P(X + Y < ${s})?`, v.toString(), [[s.div(Q.of(2)).toString(), 'treated X + Y as uniform on [0, 2]'], [s.cmp(one) <= 0 ? s.mul(s).toString() : one.sub(Q.of(2).sub(s).mul(Q.of(2).sub(s))).toString(), 'forgot the 1/2 in the triangle area'], [one.sub(v).toString(), 'answered the complement']], `${s.cmp(one) <= 0 ? `Triangle with legs ${s}: ${s}²/2` : `1 − corner triangle (2 − ${s})²/2`} = ${v}.`); } },
        ] },
      { say: 'Measure the area, directly or through its complement. For bands the complement is two corner triangles: P(meet) = 1 − (1 − w)² with w the wait as a fraction of the window.', why: 'Two right triangles with legs 1 − w make a (1 − w)² square when put together.',
        checks: [
          { make: (rng) => { const m = rng.pick([6, 12, 15, 20, 30]); return { type: 'number', q: `Window 60 minutes, each waits ${m} minutes. P(meet), as a decimal to 3 places?`, answer: Number(meet(Q.of(m, 60)).toNumber().toFixed(3)), tolerance: 0.0015, hints: [`w = ${m}/60.`, `1 − (${60 - m}/60)².`], explain: `1 − (${60 - m}/60)² = ${meet(Q.of(m, 60))} ≈ ${f3(meet(Q.of(m, 60)))}.` }; } },
        ] },
      { say: 'Triangle from two breaks: a given piece is at least 1/2 with probability 1/4, and at most one piece can be that long. So P(some piece ≥ 1/2) = 3 × 1/4 and P(triangle) = 1/4.', why: 'The left piece is at least 1/2 when both breaks land in the right half: (1/2)². The three events are disjoint because the pieces sum to 1.',
        checks: [
          { type: 'choice', q: 'Two uniform breaks. P(the left piece is at least 1/2)?', options: ['1/4', '1/2', '1/8', '3/4'], answer: 0, traps: { 1: 'required only one break in the right half: both must be there', 2: 'cubed the half', 3: 'answered the complement' }, explain: 'Both breaks in [1/2, 1]: (1/2)² = 1/4.' },
        ] },
      { say: 'n uniform points on a circle lie in some semicircle with probability n/2^(n−1).', why: 'For each point, the others fall in the semicircle clockwise from it with (1/2)^(n−1); these n events are disjoint, since only one point can lead.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 5); return mc(rng, `${n} uniform points on a circle. P(they all lie in some semicircle)?`, semi(n).toString(), [[Q.of(1, 2 ** (n - 1)).toString(), 'fixed one semicircle in advance'], [Q.of(1, 2 ** n).toString(), 'required every point in one fixed half'], [one.sub(semi(n)).toString(), 'answered the complement'], ['1/2', 'treated it as a coin flip']], `${n} × (1/2)^${n - 1} = ${semi(n)}.`); } },
        ] },
      { say: 'Products: P(XY < a) = a + ∫ from a to 1 of (a/x) dx = a(1 − ln a).', why: 'Condition on X = x: for x ≤ a any Y works; for x > a you need Y < a/x.',
        checks: [
          { make: (rng) => { const a = rng.pick([0.1, 0.2, 0.25, 0.5]); return { type: 'number', q: `X, Y uniform on [0, 1], independent. P(XY < ${a}), to 3 decimals?`, answer: Number(prod(a).toFixed(3)), tolerance: 0.0015, hints: ['Condition on X.', `${a}(1 − ln ${a}); ln ${a} ≈ ${Math.log(a).toFixed(3)}.`], explain: `${a} × (1 + ${(-Math.log(a)).toFixed(3)}) ≈ ${prod(a).toFixed(3)}.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: `In your own words: why does "each waits ${CH.w} minutes" give ${meet(W)} rather than ${W} or ${Q.of(2).mul(W)}?`, model: `Put the two arrival times on the axes of a square. They meet when the times differ by at most ${CH.w} minutes, a band around the diagonal. The band is easier to measure through what is left: two corner triangles with legs of ${CH.T - CH.w} minutes, which together make a ${CH.T - CH.w} × ${CH.T - CH.w} square, ${one.sub(meet(W))} of the hour-square. So they meet with 1 − ${one.sub(meet(W))} = ${meet(W)}. One friend waiting gives only half the band, and adding both waits counts the parts outside the hour.`, points: ['two independent times = a uniform point in a square', 'meeting is a band |x − y| ≤ w', 'the complement is two corner triangles: (1 − w)²'] },

    S('worked'),
    { type: 'worked', family: 'uniform-geometry', section: 'bto', difficulty: 2, seed: 'a', intro: 'One break on a stick. Try it before opening the solution.' },
    { type: 'worked', family: 'uniform-geometry', section: 'bto', difficulty: 4, seed: 'a', fade: 1, intro: 'A product of two uniforms. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Two people each wait 30 minutes within the same hour. Is P(meet) above or below 1/2? And if each waits the whole hour?', answer: `Above: 1 − (1/2)² = ${meet(Q.of(1, 2))}. Waiting the whole hour: 1 − 0² = 1, they always meet.`, explain: 'Half the window of waiting covers three quarters of the square.' },

    S('traps'),
    { type: 'traps', family: 'uniform-geometry', section: 'bto', extra: [
      { belief: 'X + Y is uniform on [0, 2].', fix: 'Its density is a triangle peaked at 1: P(X + Y < s) = s²/2 for s ≤ 1.' },
      { belief: 'The three pieces are independent, so P(triangle) = (1/2)³.', fix: 'They must sum to 1; use the disjoint "one piece ≥ 1/2" events: 1 − 3/4.' },
      { belief: 'A product of uniforms is uniform.', fix: 'Products pile up near 0: P(XY < a) = a(1 − ln a) > a.' },
    ] },
    { type: 'erroneous', problem: `X, Y uniform on [0, 1]. A candidate works out P(X + Y < ${S34}). One step is wrong.`, steps: [
      'The pair (X, Y) is a uniform point in the unit square.',
      `The event is the region below the line x + y = ${S34}.`,
      `X + Y is uniform on [0, 2], so P = (${S34})/2 = ${S34.div(Q.of(2))}.`,
      `Answer ${S34.div(Q.of(2))}.`,
    ], errorStep: 2, explain: `X + Y is not uniform. The region is a triangle with legs ${S34}: area (${S34})²/2 = ${sumBelow(S34)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'Two uniform breaks of a stick. A candidate answers 1/8 for "forms a triangle". Which belief?', options: ['Treated the three pieces as independent', 'Answered the complement', 'Fixed one semicircle'], answer: 0, explain: '(1/2)³ multiplies dependent events. The answer is 1/4.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Draw first, always: a square with the event shaded takes ten seconds and prevents every trap above. Corners are faster than bands; triangles are half a square.' },
    { type: 'callout', tone: 'speed', text: `Landmarks: meeting with wait w: 1 − (1 − w)² (15 minutes in an hour → ${meet(Q.of(1, 4))}); triangle 1/4; three points in a semicircle 3/4; P(X + Y < 1) = 1/2; E|X − Y| = 1/3. Budget 30 of the ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'check', scope: 'landmarks', questions: [
      { make: (rng) => { const [txt, v] = rng.pick([['a stick broken at two uniform points forms a triangle', Q.of(1, 4)], ['three uniform points on a circle lie in a semicircle', semi(3)], ['X + Y < 1 for independent uniforms X, Y', Q.of(1, 2)], ['two people waiting 15 minutes in an hour meet', meet(Q.of(1, 4))]]); return { type: 'number', q: `Probability that ${txt}? (Decimals are fine.)`, answer: v.toNumber(), tolerance: 0.001, explain: `${v}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Uniform choices → segment or unit square; probability = length or area. Bands via the corners, 1 − (1 − w)². Triangle 1/4; semicircle n/2^(n−1); XY < a: a(1 − ln a).' },

    S('contrast'),
    { type: 'compare', columns: ['Question on [0, 1]', 'Shape', 'Answer'], rows: [
      ['P(X + Y < 1/2)', 'corner triangle', sumBelow(Q.of(1, 2)).toString()],
      ['P(X + Y < 3/2)', '1 − corner triangle', sumBelow(Q.of(3, 2)).toString()],
      ['P(|X − Y| ≤ 1/4)', 'diagonal band', meet(Q.of(1, 4)).toString()],
      ['P(XY < 1/2)', 'area under a hyperbola', f3(prod(0.5))],
      ['E|X − Y|', 'an expectation, not an area', '1/3 (bto/expected-extremes)'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a wait of 0 gives P(meet) = 0; a wait of the whole window gives 1. X + Y < 2 is certain. A disc of radius r around the centre of the unit square has probability πr² only while r ≤ 1/2; beyond that the disc spills out of the square.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the gaps picture for expected minimum and maximum of uniforms (bto/expected-extremes) and the continuity-correction bars of the normal approximation (bto/clt-estimates) are the same "probability is a length or an area" idea. Intervals items with areas and shapes reward the same habit of drawing first.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'X, Y uniform on [0, 1]. Which is largest?', options: ['P(X + Y < 3/2)', 'P(|X − Y| ≤ 1/4)', 'P(X + Y < 1/2)', 'P(XY < 1/2)'], answer: 0, traps: { 1: `the band is ${meet(Q.of(1, 4))}`, 2: 'a small corner: 1/8', 3: `about ${f3(prod(0.5))}, just below 7/8` }, explain: `1 − (1/2)²/2 = ${sumBelow(Q.of(3, 2))}.` },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'uniform-geometry', section: 'bto', count: 3 },
  ],
};
