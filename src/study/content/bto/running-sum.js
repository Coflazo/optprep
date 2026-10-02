// Running totals: condition on the last step. p(n) averages the previous p values and settles at
// 1/(mean step); expected throws to pass n use the same recursion. Every number shown is computed here.
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

const DIE = [1, 2, 3, 4, 5, 6];
const COIN = [1, 2];
// p[m] = P(the running total ever equals m).
function hits(n, steps) {
  const p = [Q.of(1)];
  for (let m = 1; m <= n; m++) { let s = Q.of(0); for (const k of steps) if (m - k >= 0) s = s.add(p[m - k]); p.push(s.div(Q.of(steps.length))); }
  return p;
}
// E[m] = expected steps until the total is at least m.
function pass(n, steps) {
  const E = [Q.of(0)];
  for (let m = 1; m <= n; m++) { let s = Q.of(0); for (const k of steps) if (m - k > 0) s = s.add(E[m - k]); E.push(Q.of(1).add(s.div(Q.of(steps.length)))); }
  return E;
}
const D4 = [1, 2, 3, 4];
const PD = hits(30, DIE), PC = hits(12, COIN), ED = pass(30, DIE), EC = pass(12, COIN);
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const f4 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(4);
const LIM = 2 / 7;
const NS = Array.from({ length: 21 }, (_, i) => i);
const PATH = [0, 3, 5, 9, 10, 12]; // one sample run of totals (steps 3, 2, 4, 1, 2)
const ERR12 = Math.max(...PD.slice(12).map((x) => Math.abs(x.toNumber() - LIM))); // worst gap to 2/7 from n = 12 on
const OVER = ED[30].toNumber() - 30 / 3.5; // long-run extra throws beyond n/3.5
let T3 = 0; for (const a of DIE) for (const b of DIE) for (const c of DIE) if (a + b + c === 10) T3 += 1; // three dice summing to 10

export default {
  id: 'bto/running-sum',
  book: 'bto',
  kind: 'family',
  family: 'running-sum',
  title: 'Running totals',
  summary: 'Condition on the last step: p(n) = average of p(n − 1), …, p(n − 6), with p(0) = 1. Long run: 1/(mean step), 2/7 for a die.',
  prerequisites: ['bto/expected-waiting', 'prob/first-step-markov'],
  objectives: [
    'Set up p(n) = (1/6)[p(n − 1) + … + p(n − 6)] with p(0) = 1 and p(negative) = 0',
    'Use p(n) = (7/6)^(n−1)/6 for n from 1 to 6, and the limit 1/(mean step) for large n',
    'Compute the expected number of throws to reach at least n with E(m) = 1 + average of E(m − k)',
    'Keep "ever exactly n" apart from "ever at least n"',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw a fair die repeatedly and keep a running total. What is the probability that the total is exactly 4 at some point? Try two approaches.', answer: `${PD[4]} ≈ ${f3(PD[4])}`, explain: `If you answered 1/6 you only counted a first throw of 4; if ${f3(LIM)}, you used the long-run limit, which is not reached yet at 4. Totals of 4 come from 4, 1+3, 3+1, 2+2, 1+1+2, … The lesson adds them all up with one recursion.`, attempts: [
      { id: 'one-throw', label: 'A first throw of 4', approach: 'Counted only the runs whose first throw is a 4: 1/6.', breaksAt: 'Many runs land on 4 in several throws (1 + 3, 2 + 2, 1 + 1 + 2, …). The last throw can start from any total below 4.' },
      { id: 'list-ways', label: 'List every way to make 4', approach: 'Listed the ordered ways to add up to 4 and weighted each by (1/6) per throw.', breaksAt: 'Correct for 4, but the list explodes for bigger targets. For targets up to 6 the recursion collapses to one closed form.' },
      { id: 'limit', label: 'The long-run 2/7', approach: `Used the long-run chance 1/3.5 = 2/7 ≈ ${f3(LIM)}.`, breaksAt: '2/7 holds far from the start. At 4 the landing chances still remember that the total started at exactly 0.' },
    ] },
    { type: 'text', text: 'Something is added up step by step (die faces, or coin flips worth 1 and 2 points) and the question asks whether the running total ever **lands exactly on** a number, or how many steps it takes to **reach or pass** it.' },
    { type: 'list', items: ['"You keep a running total of die throws. Probability that it is ever exactly 10?"', '"Heads add 1, tails add 2. Probability the total ever equals 7?"', '"Expected number of die throws until the total is at least 20?"'] },
    { type: 'check', scope: 'lands on, or reaches', questions: [
      { type: 'choice', q: '"Keep adding die throws. Probability that the total is ever exactly 6?" Which kind is it?', options: ['the total lands exactly on a number', 'throws needed to reach or pass it', 'the total after a fixed number of throws', 'a walk that can move down'], answer: 0, traps: { 1: '"exactly 6" must be hit, not passed', 2: 'no number of throws is fixed', 3: 'die faces only add, so the total never falls' }, explain: '"Ever exactly 6" asks whether the running total lands on 6.' },
    ] },
    { type: 'text', text: 'Not this lesson: a total after a **fixed** number of throws (bto/three-dice, bto/clt-estimates), and walks that can move down as well as up (bto/random-walk-line).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Add die throws: P(the running total ever hits 12)', 'Throw 3 dice: P(the total is 12)', 'Throw 30 dice: P(the total is at least 120)', 'A ±1 walk: P(it ever reaches 12)'], answer: 0, traps: { 1: 'a fixed number of dice: bto/three-dice', 2: 'a fixed number of dice, estimated: bto/clt-estimates', 3: 'steps can go down: bto/random-walk-line' }, explain: 'A total that only grows, and a question about landing on a value.' },
    ] },

    S('why'),
    { type: 'text', text: 'Running-total questions are reported favourites because the answer barely depends on the target once it is moderately large: for a die it settles at 2/7. Knowing why lets you answer "exactly 30" in five seconds, and knowing the small-n formula lets you answer "exactly 5" in twenty. Candidates who try to list the ways to make the total drown in cases.' },

    S('anchor'),
    { type: 'text', text: 'You know the staircase count: the number of ways to climb n stairs taking 1 or 2 at a time is ways(n) = ways(n − 1) + ways(n − 2), by looking at the **last** step. A running total is that recursion with **one change**: each way is weighted by its probability, so you **average** instead of adding.' },
    { type: 'check', scope: 'condition on the last step', questions: [
      { type: 'number', q: 'Stairs taken 1 or 2 at a time. With ways(1) = 1 and ways(2) = 2, how many ways to climb 5 stairs?', answer: 8, hints: ['ways(3) = ways(2) + ways(1).', 'Keep going: 3, 5, 8.'], explain: 'ways(3) = 3, ways(4) = 5, ways(5) = 8.' },
    ] },

    S('picture'),
    { type: 'text', text: 'Follow one run of die throws on the number line. The total only moves right, by 1 to 6 each time, so it lands on some integers and jumps over others. Which ones it lands on is random, and that is what the question asks about.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 12, start: 0, marks: PATH.slice(1).map((x, i) => ({ x, label: `+${x - PATH[i]}` })) }, caption: `This run visited ${PATH.slice(1).join(', ')} and skipped every other total. To land on n, the total must sit at n − k just before a throw of k.` },
    { type: 'check', scope: 'landing means the last step fits', questions: [
      { type: 'choice', q: 'The total is ever exactly 5. From which totals could the last throw have started?', options: ['0, 1, 2, 3 or 4', 'only 4', '0 only', 'any total up to 11'], answer: 0, traps: { 1: 'a throw can be larger than 1', 2: 'you can arrive in several throws', 3: 'the total never goes down, so it must start below 5' }, explain: 'A throw of k from total 5 − k, for k = 1 to 5.' },
    ] },
    { type: 'text', text: 'So p(n), the chance of ever landing on n, is the average of the six values just below it: p(n) = (1/6)[p(n − 1) + … + p(n − 6)], starting from p(0) = 1. Plot it.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 20, label: 'target n' }, y: { min: 0, max: 1, label: 'P(total ever equals n)' }, curves: [{ label: 'p(n)', points: NS.map((n) => [n, PD[n].toNumber()]) }], hlines: [{ y: LIM, label: `2/7 ≈ ${LIM.toFixed(3)}` }], markers: [{ x: 6, y: PD[6].toNumber(), label: `n = 6: ${f3(PD[6])}` }] }, caption: `p rises from 1/6 at n = 1 to a peak of ${f3(PD[6])} at n = 6, then wobbles and settles at 2/7. By n = 12 it is ${f4(PD[12])}.` },
    { type: 'check', scope: 'the shape of p(n)', questions: [
      { make: (rng) => { const n = rng.int(15, 30); return mc(rng, `Running total of die throws. P(it ever equals ${n}), to 2 decimals?`, LIM.toFixed(2), [['0.17', 'only counted one throw'], ['0.50', 'treated hit or skip as a coin flip'], [(1 - LIM).toFixed(2), 'answered "skips it"']], `Large targets: 1/(mean step) = 1/3.5 = 2/7 ≈ ${f4(PD[n])} exactly.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'Coin version: heads add 1, tails add 2. The recursion averages two values instead of six.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Heads +1, tails +2', columns: ['n', ...[0, 1, 2, 3, 4, 5, 6].map(String)], rows: [['p(n)', ...[0, 1, 2, 3, 4, 5, 6].map((n) => PC[n].toString())]] }, caption: `Each entry is the average of the two before it: 1, 1/2, 3/4, 5/8, … It zigzags to 1/(mean step) = 1/1.5 = 2/3.` },
    { type: 'check', scope: 'the coin recursion', questions: [
      { make: (rng) => { const n = rng.int(3, 7); return mc(rng, `Heads +1, tails +2. P(the total ever equals ${n})?`, PC[n].toString(), [['2/3', 'used the limit too early'], ['1/2', 'only counted one flip'], [PC[n - 1].toString(), 'stopped one step early'], [Q.of(1).sub(PC[n]).toString(), 'answered "skips it"']], `p(${n}) = (p(${n - 1}) + p(${n - 2}))/2 = (${PC[n - 1]} + ${PC[n - 2]})/2 = ${PC[n]}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Condition on the last step: the total lands on n exactly when it lands on n − k and the next throw is k. So p(n) = (1/6)[p(n − 1) + … + p(n − 6)].', why: 'The events "land on n − k, then throw k" for k = 1 to 6 are disjoint, and the throw after landing is independent of the past.', answers: 'one-throw',
        checks: [
          { type: 'choice', q: 'Die running total. Which equation holds?', options: ['p(3) = (1/6)[p(2) + p(1) + p(0)]', 'p(3) = (1/6)[p(2) + p(1)]', 'p(3) = p(2) + p(1) + p(0)', 'p(3) = 3/6', 'p(3) = (1/6)[p(3) + p(2) + p(1) + p(0)]'], answer: 0, traps: { 1: 'left out landing from 0 with a throw of 3', 2: 'forgot the 1/6 for the throw', 3: 'counted single throws only', 4: 'a throw of 0 is impossible, so p(3) cannot feed itself' }, explain: 'Throws of 1, 2 or 3 from totals 2, 1, 0.' },
        ] },
      { say: 'Boundary values: p(0) = 1 (you start there) and p(negative) = 0.', why: 'These make the recursion start correctly: p(1) = p(0)/6 = 1/6.',
        checks: [
          { type: 'number', q: 'Using the boundaries, p(2) = (1/6)[p(1) + p(0)]. Value, as a decimal to 3 places?', answer: Number(PD[2].toNumber().toFixed(3)), tolerance: 0.0015, explain: `(1/6)(1/6 + 1) = ${PD[2]} ≈ ${f3(PD[2])}.` },
        ] },
      { say: 'For n from 1 to 6, subtract consecutive equations: p(n) − p(n − 1) = p(n − 1)/6, so p(n) = (7/6)p(n − 1) and p(n) = (7/6)^(n−1)/6.', why: 'Below 7 no term drops off the window, so each new p just adds p(n − 1)/6 to the previous one.', answers: 'list-ways',
        checks: [
          { make: (rng) => { const n = rng.int(2, 6); return mc(rng, `Die running total. P(ever exactly ${n})?`, PD[n].toString(), [['1/6', `only counted a single throw of ${n}`], [Q.of(n, 21).toString(), 'divided the target by the sum of the faces'], ['2/7', 'used the long-run limit'], [PD[n - 1].toString(), 'one power of 7/6 short']], `(7/6)^${n - 1} × 1/6 = ${PD[n]} ≈ ${f3(PD[n])}.`); } },
        ] },
      { say: 'Long run: the total moves 3.5 per throw on average, so it visits about one integer in every 3.5. p(n) → 1/(mean step) = 2/7.', why: 'Over a long stretch of length L the total makes about L/3.5 landings, spread evenly, so each integer is hit with chance 1/3.5. Near the start the landings are not yet spread evenly, so small targets differ.', answers: 'limit',
        checks: [
          { make: (rng) => { const [steps, lbl, m] = rng.pick([[[1, 2], 'coin worth 1 or 2', 1.5], [[1, 2, 3, 4], 'fair 4-sided die', 2.5], [[1, 2, 3, 4, 5, 6, 7, 8], 'fair 8-sided die', 4.5]]); return mc(rng, `Running total of a ${lbl}. Long-run P(a large total is ever hit exactly)?`, Q.of(2, 2 * m).toString(), [[Q.of(1, steps.length).toString(), 'used a single step'], ['1/2', 'treated hit or skip as a coin flip'], ['2/7', 'used the six-sided die answer']], `1/(mean step) = 1/${m} = ${Q.of(2, 2 * m)}.`); } },
        ] },
      { say: 'Expected throws to reach at least n: E(m) = 1 + (1/6)[E(m − 1) + … + E(m − 6)], with E(m) = 0 for m ≤ 0.', why: 'Spend one throw of k; the remaining target is m − k, and anything at or below 0 means you are done.',
        checks: [
          { make: (rng) => { const n = rng.int(2, 4); return { type: 'number', q: `Die. Expected throws until the total is at least ${n}? (Decimals are fine.)`, answer: ED[n].toNumber(), tolerance: 0.002, hints: ['E(1) = 1: any throw reaches 1.', `E(2) = 1 + E(1)/6.`], explain: `Building up: ${[1, 2, 3, 4].slice(0, n).map((m) => `E(${m}) = ${ED[m]}`).join(', ')}.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does P(the total ever equals n) settle at 2/7 for a die, whatever the large target?', model: 'Each throw moves the total 3.5 on average, so over a long stretch the total lands on about one integer in every 3.5 and jumps over the rest. Far from the start there is nothing special about any particular integer, so each one is hit with the same long-run chance, 1/3.5 = 2/7.', points: ['the mean step is 3.5', 'landings are spread evenly over a long stretch', 'so each large n is hit with chance 1/(mean step)'] },

    S('worked'),
    { type: 'worked', family: 'running-sum', section: 'bto', difficulty: 3, seed: 'e', explainAt: [0], intro: 'A small target. Try it before opening the solution.' },
    { type: 'worked', family: 'running-sum', section: 'bto', difficulty: 4, seed: 'a', fade: 1, intro: 'An expected number of flips. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Die running total: is it more likely to hit exactly 6 or exactly 7?', answer: `6: ${f3(PD[6])} against ${f3(PD[7])}. At 7 the window drops p(0) = 1 and the curve falls back towards 2/7.`, explain: 'p peaks at 6, the largest target a single throw can still reach.' },

    S('traps'),
    { type: 'traps', family: 'running-sum', section: 'bto', extra: [
      { belief: 'P(total ever equals n) = 1/6, the chance of one throw.', fix: 'Many different runs can land on n: average the previous p values.' },
      { belief: 'The limit 2/7 works for every target.', fix: `For small n the exact values differ: p(6) = ${f3(PD[6])}.` },
      { belief: 'Expected throws to reach n = n/3.5.', fix: 'The total overshoots n, so you need a little more.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(die running total ever equals 3). One step is wrong.', steps: [
      'Condition on the last throw: it lands on 3 from 2, 1 or 0.',
      'p(0) = 1, p(1) = 1/6.',
      'p(2) = (1/6)p(1) = 1/36.',
      `p(3) = (1/6)[p(2) + p(1) + p(0)] = ${Q.of(1, 6).mul(Q.of(1, 36).add(Q.of(1, 6)).add(Q.of(1)))}.`,
    ], errorStep: 2, explain: `p(2) also counts a single throw of 2 from total 0: p(2) = (1/6)[p(1) + p(0)] = ${PD[2]}. Then p(3) = ${PD[3]} ≈ ${f3(PD[3])}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `Die running total. A candidate answers 2/7 for "ever exactly 5". Which belief?`, options: ['Used the long-run limit for a small target', 'Counted a single throw of 5 and nothing else', 'Answered the chance that the total skips 5'], answer: 0, traps: { 1: 'a single throw of 5 gives 1/6', 2: `skipping 5 has chance ${f3(Q.of(1).sub(PD[5]))}` }, explain: `p(5) = (7/6)⁴/6 = ${PD[5]} ≈ ${f3(PD[5])}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Small targets: p(n) = (7/6)^(n−1)/6: ${[1, 2, 3, 4, 5, 6].map((n) => f3(PD[n])).join(', ')} for n = 1 to 6. Large targets (12 or more): answer 2/7 ≈ 0.286; the exact value is within ${(Math.ceil(ERR12 * 1000) / 1000).toFixed(3)} of it, far inside the option spacing.` },
    { type: 'check', scope: 'small and large targets', questions: [
      { make: (rng) => { const n = rng.pick([1, 2, 3, 12, 18, 25]); return { type: 'number', q: `Die running total. P(ever exactly ${n}), to 3 decimals?`, answer: Number(PD[n].toNumber().toFixed(3)), tolerance: 0.0015, hints: [n <= 6 ? 'Small target: (7/6)^(n−1)/6.' : 'Large target: the limit.'], explain: `${f4(PD[n])}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `Expected throws to pass a large n: about n/3.5 + ${OVER.toFixed(2)}, the extra paying for the overshoot past n. Check: E(20) = ${f3(ED[20])} against 20/3.5 + ${OVER.toFixed(2)} = ${(20 / 3.5 + OVER).toFixed(3)}. Budget 20 of the ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'thinkaloud', problem: 'You keep a running total of fair die throws. What is the probability that the total is ever exactly 6?', lines: [
      { t: 0, say: 'Running total, landing exactly on a target: condition on the last throw.' },
      { t: 4, say: `A target like 6 is out in the long run, so 2/7 ≈ ${f3(LIM)}...`, slip: true },
      { t: 8, say: 'No: 2/7 is for targets far from the start. Up to 6 no term drops out of the window, so p(n) = (7/6)^(n−1)/6.' },
      { t: 15, say: `(7/6)⁵ ≈ ${((7 / 6) ** 5).toFixed(2)}, over 6 gives ${f3(PD[6])}.` },
      { t: 23, say: `Sanity: 6 is the peak of the curve, the last target one throw can still reach, so it should beat 2/7. ${f3(PD[6])} does. Answer ${f3(PD[6])}.` },
    ] },
    { type: 'check', scope: 'throws to pass n and the think-aloud', questions: [
      { type: 'choice', q: 'Expected die throws until the running total reaches or passes 35?', options: ['10.5', '10', '17.5'], answer: 0, traps: { 1: 'forgot the overshoot past 35', 2: 'divided by 2 instead of the mean throw 3.5' }, explain: '35/3.5 + 0.48 ≈ 10.48: the 0.48 pays for the overshoot.' },
      { type: 'choice', q: 'In the think-aloud, the first try used 2/7 for a target of 6. What was wrong?', options: ['2/7 is for targets far from the start', '2/7 is the chance for a target of 1', 'the die is not fair'], answer: 0, traps: { 1: 'a target of 1 needs a first throw of 1: 1/6', 2: 'the die is fair' }, explain: 'Up to 6, p(n) = (7/6)^(n−1)/6, so p(6) ≈ 0.360.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Ever exactly n → p(n) = average of the previous p values, p(0) = 1; small n: (7/6)^(n−1)/6; large n: 1/(mean step) = 2/7.' },

    S('contrast'),
    { type: 'compare', columns: ['Question (die)', 'Tool', 'Value for n = 10'], rows: [
      ['total ever exactly n', 'average of previous six p', f3(PD[10])],
      ['total ever at least n', 'always happens', '1'],
      ['expected throws to reach at least n', 'E(m) = 1 + average of E(m − k)', f3(ED[10])],
      ['total after 3 throws exactly n', 'count triples (bto/three-dice)', f3(Q.of(T3, 216))],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: p(0) = 1, p(1) = 1/6 (only a first throw of 1 lands on 1). With steps of exactly 1 every total is hit (p = 1 = 1/(mean step)). "At least n" is certain because the total grows without bound.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Die running total. Which is certain?', options: ['the total is at least 10 at some point', 'the total is exactly 10 at some point', 'the total is exactly 10 after 3 throws', 'the total skips 10'], answer: 0, traps: { 1: `it can jump over 10: about ${f3(PD[10])}`, 2: `a fixed number of throws: ${T3} of 216`, 3: 'hitting 10 is possible' }, explain: 'The total grows by at least 1 each throw, so it passes every level.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "condition on the last step" is the first-step method run backwards (prob/first-step-markov). The long-run 1/(mean step) is a renewal fact, the same one that makes a hexagon walk return in 6 steps on average (bto/polygon-walk).' },
    { type: 'variation', base: `Die running total: P(ever exactly 4) = ${PD[4]} ≈ ${f3(PD[4])}.`, rows: [
      { change: 'Start the total at 100 and ask for exactly 104', effect: `No change: ${f3(PD[4])}. Only the distance still to cover matters, not where the count started.`, same: true },
      { change: 'Ask for exactly 20', effect: `Far from the start: about 2/7 (exactly ${f4(PD[20])}).` },
      { change: 'Ask for "at least 4" at some point', effect: 'Certain: the total grows by at least 1 each throw, so it passes every level.' },
      { change: 'Use a coin: heads +1, tails +2', effect: `Average two values instead of six: p(4) = ${PC[4]} ≈ ${f3(PC[4])}.` },
      { change: 'Use a 4-sided die and ask for exactly 20', effect: `Two changes, one rule: a large target gives 1/(mean step), and the mean step is now 2.5, so about 2/5 (exactly ${f4(hits(20, D4)[20])}).`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const s = rng.pick([4, 8]), n = rng.int(2, Math.min(s, 5)); const p = hits(n, Array.from({ length: s }, (_, i) => i + 1)); return mc(rng, `A board-game token starts on square 0 and moves forward by the roll of a fair ${s}-sided die each turn. P(it ever lands on square ${n})?`, p[n].toString(), [[Q.of(1, s).toString(), `only counted a single roll of ${n}`], [Q.of(2, s + 1).toString(), 'used the long-run limit for a small target'], [p[n - 1].toString(), 'stopped one step early'], [Q.of(1).sub(p[n]).toString(), 'answered "skips it"']], `Condition on the last roll: p(${n}) = ((${s} + 1)/${s})^${n - 1} × 1/${s} = ${p[n]}.`); } },
      far: { make: (rng) => { const k = rng.int(2, 4), t = rng.int(30, 50); const v = hits(t, Array.from({ length: k }, (_, i) => i + 1))[t]; return { type: 'number', q: `A trading algorithm buys in clips of ${Array.from({ length: k }, (_, i) => i + 1).join(', ').replace(/, (\d+)$/, ' or $1')} lots, each size equally likely, until it holds at least ${t} lots. P(its position is exactly ${t} lots at some point), to 2 decimals?`, answer: Number(v.toNumber().toFixed(2)), tolerance: 0.011, hints: ['The position is a running total that only grows.', `Far from the start, P(hit) ≈ 1/(mean clip) = 1/${(k + 1) / 2}.`], explain: `A large target: 1/(mean step) = 1/${(k + 1) / 2} = ${Q.of(2, k + 1)} ≈ ${(2 / (k + 1)).toFixed(3)} (exact ${f4(v)}).` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from die totals to the token and to the algorithm?', options: ['Condition on the last step; far out, use 1/(mean step)', 'Only a single step can ever land exactly on the target', 'Every target has the same chance, right from the start', 'Hitting or skipping is a coin flip, so the chance is 1/2'], answer: 0, traps: { 1: 'several steps can add up to the target', 2: 'small targets differ from the long-run value', 3: 'nothing makes hit and skip equally likely' }, explain: 'Both are running totals that only grow. Small targets use the last-step recursion; large targets settle at 1/(mean step).' } },

    S('tryit'),
    { type: 'tryit', family: 'running-sum', section: 'bto', count: 3 },
  ],
};
