// Simple ±1 random walk on a line: the end point is a binomial count of up-steps (with a parity
// check); "ever reached" needs the reflection principle. Every number shown is computed here.
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

const nCr = (n, r) => { if (r < 0 || r > n) return 0n; let x = 1n; for (let i = 0; i < r; i++) x = (x * BigInt(n - i)) / BigInt(i + 1); return x; };
const paths = (n, k) => ((n + k) % 2 !== 0 || Math.abs(k) > n ? 0n : nCr(n, (n + k) / 2)); // paths from 0 ending at k
const tot = (n) => 2n ** BigInt(n);
const pEnd = (n, k) => new Q(paths(n, k), tot(n));
const pRange = (n, lo, hi) => { let s = 0n; for (let k = lo; k <= hi; k++) s += paths(n, k); return new Q(s, tot(n)); };
const pAtLeast = (n, a) => pRange(n, a, n);
const pEver = (n, a) => pAtLeast(n, a).add(pAtLeast(n, a + 1)); // reflection
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const f4 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(4);
const N6 = 6;
const KS = Array.from({ length: 2 * N6 + 1 }, (_, i) => i - N6);
const PATH1 = [0, 1, 2, 1, 2, 3, 2]; // 4 ups, 2 downs
const PATH2 = [0, 1, 2, 1, 0, -1, 0]; // touches 2, ends at 0
const row = (n) => Array.from({ length: n + 1 }, (_, u) => nCr(n, u).toString());
const upTo = (n, u) => Array.from({ length: u + 1 }, (_, i) => nCr(n, i).toString()).join(' + ');
const reflectAfterHit = (p, a) => { const i = p.indexOf(a); return p.map((x, j) => (j <= i ? x : 2 * a - x)); };

export default {
  id: 'bto/random-walk-line',
  book: 'bto',
  kind: 'family',
  family: 'random-walk-line',
  title: 'Random walk on a line',
  summary: 'Position after n steps = 2·(ups) − n. P(S_n = k) = C(n, (n+k)/2)/2^n, zero for the wrong parity. Ever reaching a: P(S_n ≥ a) + P(S_n > a).',
  prerequisites: ['bto/coin-sequences', 'prob/discrete-distributions'],
  objectives: [
    'Translate an end position into a number of up-steps, u = (n + k)/2, and spot parity zeros',
    'Compute end-point events (such as "below 0 after n days") as binomial sums, minding strict inequalities',
    'Use the reflection principle for "reaches a at some point during the first n steps"',
    'Use P(no return to 0 in 2m steps) = P(S_2m = 0) = C(2m, m)/4^m',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: a particle starts at 0 and moves +1 or −1 with equal probability each step. What is the probability that it is at 2 after 6 steps? Try two approaches.', answer: `C(6, 4)/2⁶ = ${pEnd(6, 2)}`, explain: `If you answered 1/7 or 1/13, you treated the end points as equally likely. Ending at 2 needs 4 ups and 2 downs, in any order: ${paths(6, 2)} of the 64 paths.` },
    { type: 'text', text: 'Something moves **up or down by 1** each step with equal chance: a particle, a price, a score. The question asks where it is **after n steps** (exactly k, below 0, back at the start) or whether it **ever reaches** a level during the first n steps.' },
    { type: 'list', items: ['"A price starts at 2 and moves ±1 daily. Probability it is below 0 after 8 days?"', '"Probability the particle is back at 0 after 10 steps?"', '"Probability it reaches +3 at some point during the first 10 steps?"'] },
    { type: 'text', text: 'Not this lesson: walls that stop the walk and the question of which wall comes first (bto/gamblers-ruin), and walks around a polygon (bto/polygon-walk).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['±1 walk from 0: P(at −2 after 8 steps)', '±1 walk from 3: P(it hits 10 before 0)', '±1 walk on a hexagon: expected return time', 'Die running total: P(it ever equals 8)'], answer: 0, traps: { 1: 'two stopping walls: bto/gamblers-ruin', 2: 'a walk on a cycle: bto/polygon-walk', 3: 'steps only go up: bto/running-sum' }, explain: 'An end point after a fixed number of ±1 steps.' },
    ] },

    S('why'),
    { type: 'text', text: 'Prices, inventories and P&L are often modelled as ±1 walks, so these items are common. Where the walk **ends** is just a coin-flip count in disguise. Whether it ever **touched** a level is a question about the whole path, and one trick, reflection, turns it back into end-point counts. The traps are parity (an odd position after an even number of steps is impossible) and boundaries ("below 0" versus "at or below 0").' },

    S('anchor'),
    { type: 'text', text: 'From bto/coin-sequences: n fair flips give 2^n equally likely strings, and exactly u heads has C(n, u)/2^n. A ±1 walk is that with **one change**: read heads as up-steps and tails as down-steps. The position is ups − downs = u − (n − u) = 2u − n.' },
    { type: 'check', scope: 'position = 2u − n', questions: [
      { make: (rng) => { const n = rng.int(6, 12), u = rng.int(0, n); return { type: 'number', q: `A walk takes ${n} steps, ${u} of them up. Where does it end (starting from 0)?`, answer: 2 * u - n, explain: `${u} − ${n - u} = ${2 * u - n}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw one path. Each step moves one unit left or right; the order does not matter for the end point, only the number of ups.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: -4, max: 4, start: 0, path: PATH1 }, caption: `Up, up, down, up, up, down: 4 ups and 2 downs, ending at 2. Any other order of 4 ups and 2 downs also ends at 2, and there are C(6, 4) = ${paths(6, 2)} of them.` },
    { type: 'check', scope: 'counting paths to an end point', questions: [
      { make: (rng) => { const n = rng.pick([6, 8, 10]), k = rng.pick([0, 2, 4, -2]); return mc(rng, `±1 walk from 0. P(at ${k} after ${n} steps)?`, pEnd(n, k).toString(), [[Q.of(1, n + 1).toString(), 'treated all end points as equally likely'], [Q.of(1, 2 ** n).toString(), 'counted one path'], [new Q(nCr(n, Math.abs(k)), tot(n)).toString(), `chose |k| = ${Math.abs(k)} up-steps; you need (n + k)/2`], [new Q(paths(n, k), tot(n - 1)).toString(), `divided by 2^${n - 1}`]], `u = (${n} + ${k})/2 = ${(n + k) / 2}: C(${n}, ${(n + k) / 2})/2^${n} = ${pEnd(n, k)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: `Plot every end point after ${N6} steps.` },
    { type: 'diagram', diagram: 'bar', spec: { title: `Where a ±1 walk ends after ${N6} steps`, xLabel: 'position', yLabel: 'paths (of 64)', categories: KS.map(String), series: [{ name: 'paths', values: KS.map((k) => Number(paths(N6, k))) }], valueLabels: true }, caption: `Only even positions have bars: after an even number of steps the position is even. The bars are the binomial row ${row(N6).join(', ')}, spread two units apart.` },
    { type: 'check', scope: 'parity', questions: [
      { make: (rng) => { const n = rng.pick([7, 8, 9, 10]); const k = n % 2 === 0 ? rng.pick([1, 3, -1]) : rng.pick([0, 2, -2]); return mc(rng, `±1 walk from 0. P(at ${k} after ${n} steps)?`, '0', [[new Q(nCr(n, Math.floor((n + Math.abs(k)) / 2)), tot(n)).toString(), `rounded (n + k)/2 = ${(n + k) / 2} to a whole number`], [Q.of(1, n + 1).toString(), 'treated the end points as equally likely'], ['1/2', 'treated it as a coin flip']], `(${n} + ${k})/2 = ${(n + k) / 2} is not a whole number: the walk can never stand there.`); } },
    ] },
    { type: 'text', text: 'Now a path that touches 2 and falls back to 0. Mirror everything it does **after** its first visit to 2: ups become downs. The mirrored path ends at 4.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: -4, max: 4, start: 0, path: PATH2, marks: [{ x: 2, label: 'level a = 2' }] }, caption: `This path touches 2 at step 2 and ends at 0. Its reflection after step 2 is ${reflectAfterHit(PATH2, 2).join(', ')}, ending at 4 = 2a − 0. Every path that touches a and ends below a pairs with exactly one path ending above a.` },
    { type: 'check', scope: 'the reflection pairing', questions: [
      { make: (rng) => { const a = rng.int(1, 3), e = rng.int(-2, a - 1); return { type: 'number', q: `A path touches level ${a} and later ends at ${e}. Reflect it after its first visit to ${a}. Where does the reflected path end?`, answer: 2 * a - e, hints: ['Reflection mirrors the end point in the level a.', `2a − ${e}.`], explain: `2 × ${a} − (${e}) = ${2 * a - e}.` }; } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'With u up-steps and n − u down-steps, S_n = 2u − n. So S_n = k needs u = (n + k)/2 up-steps.', why: 'Solve 2u − n = k for u.',
        checks: [
          { make: (rng) => { const n = rng.pick([8, 10, 12]), k = rng.pick([2, 4, -2, 0]); return { type: 'number', q: `How many up-steps does a ${n}-step walk need to end at ${k}?`, answer: (n + k) / 2, explain: `(${n} + ${k})/2 = ${(n + k) / 2}.` }; } },
        ] },
      { say: 'If (n + k)/2 is not a whole number, P(S_n = k) = 0. Otherwise P(S_n = k) = C(n, (n + k)/2)/2^n.', why: 'Choose which of the n steps go up; all 2^n paths are equally likely.',
        checks: [
          { make: (rng) => { const n = rng.pick([5, 7, 9]), k = rng.pick([1, 3, -1, -3]); return mc(rng, `P(S_${n} = ${k})?`, pEnd(n, k).toString(), [[Q.of(1, n + 1).toString(), 'treated end points as equally likely'], ['0', `${n} + ${k} is even, so the point is reachable`], [new Q(nCr(n, Math.abs(k)), tot(n)).toString(), 'used |k| up-steps']], `u = ${(n + k) / 2}: C(${n}, ${(n + k) / 2})/2^${n} = ${pEnd(n, k)}.`); } },
        ] },
      { say: 'End-point events are sums of these terms. A price starting at x is below 0 after n steps exactly when S_n ≤ −x − 1, which with parity means the first reachable value below −x.', why: 'Price = x + S_n, and "below 0" means at most −1. Strict or non-strict changes which end points count.',
        checks: [
          { make: (rng) => { const x = rng.int(1, 3), n = rng.pick([6, 8, 10]); const v = pRange(n, -n, -x - 1); return mc(rng, `A price starts at ${x} and moves ±1 each day (it may go negative). P(below 0 after ${n} days)?`, v.toString(), [[pRange(n, -n, -x).toString(), 'counted a price of exactly 0 as below 0'], ['1/2', 'ignored the starting cushion'], [v.mul(Q.of(2)).toString(), 'doubled for reflection: that is for "ever", not "at the end"'], [Q.of(1).sub(v).toString(), 'answered the complement']], `Sum of end points S_${n} ≤ ${-x - 1}: ${v} ≈ ${f4(v)}.`); } },
        ] },
      { say: 'Ever reaching a by step n: paths ending at or above a obviously got there. Paths that touch a and end below it match, by reflection, the paths ending above a. So P = P(S_n ≥ a) + P(S_n > a).', why: 'Reflecting after the first visit to a is a one-to-one pairing between "touched a, ended at a − j" and "ended at a + j".',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 8, 10]), a = rng.int(2, 3); const v = pEver(n, a); return mc(rng, `±1 walk from 0. P(it reaches ${a} at some point during the first ${n} steps)?`, v.toString(), [[pAtLeast(n, a).toString(), `only counted paths ending at or above ${a}`], [pAtLeast(n, a).mul(Q.of(2)).toString(), `doubled P(end ≥ ${a}): the paths ending exactly at ${a} must not be doubled`], [Q.of(1, 2 ** a).toString(), `required the first ${a} steps all up`], [Q.of(1).sub(v).toString(), 'answered the complement']], `P(S_${n} ≥ ${a}) + P(S_${n} > ${a}) = ${pAtLeast(n, a)} + ${pAtLeast(n, a + 1)} = ${v}.`); } },
        ] },
      { say: 'A reflection argument also gives: P(no return to 0 during steps 1 to 2m) = P(S_2m = 0) = C(2m, m)/4^m.', why: 'Non-returning paths can be paired with paths that end at 0. The two probabilities are the same number.',
        checks: [
          { make: (rng) => { const m = rng.int(2, 6); const v = pEnd(2 * m, 0); return mc(rng, `±1 walk from 0. P(it does not return to 0 at any of steps 1 to ${2 * m})?`, v.toString(), [[Q.of(1).sub(v).toString(), 'answered "some return"'], ['1/2', 'treated it as a coin flip'], [v.mul(Q.of(1, 2)).toString(), 'kept only the paths that stay positive']], `Same number as P(S_${2 * m} = 0) = C(${2 * m}, ${m})/2^${2 * m} = ${v}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is P(the walk reaches a during n steps) about twice P(it ends at or above a)?', model: 'Every path that ends above a clearly reached a. For every path that touched a and then fell back below it, mirror its steps after the first visit: it becomes a path that ends above a, and the pairing is one-to-one. So "touched and ended below" is as likely as "ended above", which roughly doubles the count. Paths ending exactly at a have no partner, so they are counted once.', points: ['paths ending at or above a obviously reached it', 'reflection after the first hit pairs "touched, ended below" with "ended above"', 'so P = P(S_n ≥ a) + P(S_n > a)'] },

    S('worked'),
    { type: 'worked', family: 'random-walk-line', section: 'bto', difficulty: 3, seed: 'c', intro: 'An end point with the parity check. Try it before opening the solution.' },
    { type: 'worked', family: 'random-walk-line', section: 'bto', difficulty: 4, seed: 'c', fade: 1, intro: 'Ever reaching a level. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'After 10 steps, which is more likely: being at 0 or being at 1? And which is more likely: ending at or above 2, or reaching 2 at some point?', answer: `At 0: ${f3(pEnd(10, 0))}; at 1 it is impossible (0). Reaching 2 (${f3(pEver(10, 2))}) is about twice as likely as ending at or above 2 (${f3(pAtLeast(10, 2))}).`, explain: 'Parity for the first; reflection for the second.' },

    S('traps'),
    { type: 'traps', family: 'random-walk-line', section: 'bto', extra: [
      { belief: 'All end points from −n to n are equally likely.', fix: 'End points are binomial: the middle is far more likely, and half the integers are unreachable.' },
      { belief: 'Doubling applies to "below 0 after n days".', fix: 'Reflection is for "ever touched". An end-point question is a plain binomial sum.' },
      { belief: '"Below 0" includes 0.', fix: 'Below 0 means at most −1; with parity that can be −2.' },
    ] },
    { type: 'erroneous', problem: 'A price starts at 2 and moves ±1 each day. A candidate works out P(below 0 after 8 days). One step is wrong.', steps: [
      'Price = 2 + S_8, so below 0 means S_8 ≤ −3.',
      'After 8 steps S_8 is even, so this means S_8 ≤ −2.',
      `S_8 ≤ −2 means at most 3 up-days: (${upTo(8, 3)})/256 = ${pRange(8, -8, -2)}.`,
      `Answer ${pRange(8, -8, -2)}.`,
    ], errorStep: 1, explain: `S_8 is even and at most −3, so S_8 ≤ −4 (not −2, which gives a price of exactly 0). At most 2 up-days: (${upTo(8, 2)})/256 = ${pRange(8, -8, -4)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: '±1 walk from 0, 8 steps. A candidate answers 1/17 for P(at 2). Which belief?', options: ['Equally likely end points from −8 to 8', 'One path only', 'Reflection doubling'], answer: 0, explain: `17 end points treated as equal. Correct: ${pEnd(8, 2)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `First move on every item: parity. If n + k is odd, answer 0 and move on. Then convert to up-steps and read the binomial row: n = 6 → ${row(6).join(', ')}; n = 8 → ${row(8).join(', ')}.` },
    { type: 'callout', tone: 'speed', text: `Back at 0 after 2m steps: C(2m, m)/4^m ≈ 1/√(πm). For m = 5: exact ${f4(pEnd(10, 0))}, estimate ${(1 / Math.sqrt(Math.PI * 5)).toFixed(4)}. An end-point item should take 30 of your ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'check', scope: 'parity first, then the row', questions: [
      { make: (rng) => { const n = rng.pick([6, 8]), k = rng.pick([0, 2, 4, 3, -1]); return { type: 'number', q: `±1 walk from 0. How many of the 2^${n} paths end at ${k} after ${n} steps?`, answer: Number(paths(n, k)), hints: ['Parity first.', `u = (${n} + ${k})/2.`], explain: (n + k) % 2 ? 'Wrong parity: 0 paths.' : `C(${n}, ${(n + k) / 2}) = ${paths(n, k)}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'End at k: u = (n + k)/2, parity or 0, then C(n, u)/2^n. Ever reaches a: P(S_n ≥ a) + P(S_n > a). No return in 2m steps = P(S_2m = 0).' },

    S('contrast'),
    { type: 'compare', columns: ['Question (10 steps, level 2)', 'Kind', 'Value'], rows: [
      ['at exactly 2 after 10 steps', 'end point', f4(pEnd(10, 2))],
      ['at or above 2 after 10 steps', 'end point tail', f4(pAtLeast(10, 2))],
      ['reaches 2 at some point', 'whole path: reflection', f4(pEver(10, 2))],
      ['at 1 after 10 steps', 'wrong parity', '0'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: |k| > n is unreachable (0). k = n needs every step up: 1/2^n. Starting at a level (a = 0) means it has already been reached: P = 1, and the formula agrees since P(S_n ≥ 0) + P(S_n > 0) = 1.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: add walls that stop the walk and you get gambler\'s ruin (bto/gamblers-ruin); glue the ends of a line into a circle and you get polygon walks (bto/polygon-walk). For many steps the end point is roughly normal with sd √n (bto/clt-estimates).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Which is largest for a 10-step walk?', options: ['reaches 2 at some point', 'at or above 2 after 10 steps', 'at exactly 2 after 10 steps', 'at 1 after 10 steps'], answer: 0, traps: { 1: 'misses paths that touched 2 and fell back', 2: 'one end point only', 3: 'wrong parity: impossible' }, explain: `${f4(pEver(10, 2))} > ${f4(pAtLeast(10, 2))} > ${f4(pEnd(10, 2))} > 0.` },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'random-walk-line', section: 'bto', count: 3 },
  ],
};
