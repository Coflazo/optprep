// Gambler's ruin: a walk between two absorbing walls. Fair: P(top first) = i/N and duration
// i(N − i). Biased: (1 − r^i)/(1 − r^N) with r = q/p. Every number shown is computed here.
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
const qpow = (x, k) => { let r = one; for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const ratio = (p) => one.sub(p).div(p); // r = q/p
const biased = (p, i, N) => { const r = ratio(p); return one.sub(qpow(r, i)).div(one.sub(qpow(r, N))); };
const biasedNum = (p, i, N) => { if (Math.abs(p - 0.5) < 1e-12) return i / N; const r = (1 - p) / p; return (1 - r ** i) / (1 - r ** N); };
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const f4 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(4);
const NN = 20;
const IS = Array.from({ length: NN + 1 }, (_, i) => i);
const ND = 10;
const PATH = [2, 3, 2, 1, 2, 3, 4, 5, 6];
const PS = [Q.of(2, 5), Q.of(9, 20), Q.of(11, 20), Q.of(3, 5), Q.of(1, 3), Q.of(2, 3)];
const BK = { p: Q.of(9, 20), i: 10, N: 20 };
const TK = { p: Q.of(2, 5), i: 3, N: 6 }; // think-aloud

export default {
  id: 'bto/gamblers-ruin',
  book: 'bto',
  kind: 'family',
  family: 'gamblers-ruin',
  title: 'Gambler\'s ruin',
  summary: 'Fair walk from i between 0 and N: P(reach N first) = i/N, expected duration i(N − i). Biased: (1 − r^i)/(1 − r^N) with r = q/p.',
  prerequisites: ['bto/random-walk-line', 'bto/expected-waiting', 'prob/first-step-markov'],
  objectives: [
    'Derive P(reach N before 0) = i/N from "a fair game keeps its expected value"',
    'Compute the expected duration i(N − i) and check it with first-step equations',
    'Apply the biased formula (1 − r^i)/(1 − r^N) with r = q/p, with r the right way round',
    'Predict how strongly a small edge per bet changes the ending over many bets',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you have $4 and bet $1 at a time on fair coin flips. You stop when you reach $10 or go broke. What is the probability that you reach $10? Try two approaches.', answer: `4/10 = ${Q.of(4, 10)}`, explain: 'If you answered 1/2, you ignored where you start. A fair game keeps your expected wealth at $4, and at the end you hold $10 or $0: 10 × P = 4. The lesson turns that one line into the whole family.', attempts: [
      { id: 'paths', label: 'Count the winning paths', approach: 'Tried to count every path from $4 that reaches $10 before $0 and weight it by (1/2) per step.', breaksAt: 'Paths can be any length, so the count never ends. A fair game lets you skip the paths: the expected wealth when you stop is still $4.' },
      { id: 'half', label: 'Two walls, so 1/2', approach: 'Two possible endings and fair flips, so each ending has chance 1/2.', breaksAt: 'Fair steps do not make the endings equally likely. Your start is closer to $0 than to $10, and the expected final wealth must equal $4: 10 × P = 4.' },
    ] },
    { type: 'text', text: 'A quantity moves up or down by 1 each step (a bankroll, a price, a particle) until it hits one of **two walls**, a target N or 0. The question asks which wall comes first, or how many steps the game lasts. Each step may be fair (1/2 up) or biased (p up).' },
    { type: 'list', items: ['"You have $10 and bet $1 on a game you win 45% of the time. You stop at $20 or $0. P(reach $20)?"', '"A stock at 3 moves ±1 per minute. P(it hits 10 before 0)?"', '"A particle at 4 on 0 to 10 moves ±1 until it hits an end. Expected number of steps?"'] },
    { type: 'check', scope: 'which wall, or how long', questions: [
      { type: 'choice', q: '"$4 moves ±$1 per bet, 1/2 each way, until $0 or $10. How long does it last on average?" What is asked?', options: ['how many steps the game lasts', 'which wall comes first', 'where it is after n steps', 'a biased walk'], answer: 0, traps: { 1: '"how long" asks for the duration, not the winner', 2: 'the walls stop it: no step count is fixed', 3: '1/2 each way is a fair walk' }, explain: '"How long on average" asks for the expected number of steps.' },
    ] },
    { type: 'text', text: 'Not this lesson: a walk with no walls observed for a fixed number of steps (bto/random-walk-line), and walks around a polygon (bto/polygon-walk, which uses this lesson\'s duration formula).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['A price at 5 moves ±1 until it hits 12 or 0: P(12 first)', 'A price at 5 moves ±1: P(it is above 5 after 10 steps)', 'A price at 5 moves ±1: P(it ever reaches 8 in 10 steps)', 'A token on a hexagon: expected time to the opposite corner'], answer: 0, traps: { 1: 'a fixed number of steps: bto/random-walk-line', 2: 'a fixed horizon, one level: reflection (bto/random-walk-line)', 3: 'a cycle: bto/polygon-walk' }, explain: 'Two walls, and the question is which comes first.' },
    ] },

    S('why'),
    { type: 'text', text: 'Bankroll, stop-loss and "who goes broke first" questions are all gambler\'s ruin. The fair case is a one-liner once you see why, and the options are built around the two natural mistakes: 1/2 (ignoring the start) and the one-step probability (ignoring that the game lasts many steps). The biased case shows the other big lesson: a small edge per bet becomes a large edge over the whole game.' },

    S('anchor'),
    { type: 'text', text: 'You know a fair bet has expected profit 0. Gambler\'s ruin is that fact with **one change**: apply it to the **whole game** up to the moment you stop. Your expected wealth at the end still equals your wealth at the start.' },
    { type: 'check', scope: 'a fair game keeps its expectation', questions: [
      { make: (rng) => { const i = rng.int(2, 8), N = rng.int(i + 2, 15); return mc(rng, `You start with $${i}, bet $1 on fair flips, and stop at $${N} or $0. What is your expected wealth when you stop?`, `$${i}`, [[`$${N / 2}`, 'assumed the two ends are equally likely'], [`$${N}`, 'assumed you always reach the target'], ['$0', 'assumed ruin is certain']], `Fair bets never change the expected wealth: $${i}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the walls. The walk starts at i and moves one step at a time until it lands on 0 or N; then it stops for good.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 6, barriers: [0, 6], start: 2, target: 6, path: PATH }, caption: `One run from 2 with walls at 0 and 6: it dipped to 1, recovered, and hit 6 after ${PATH.length - 1} steps. For a fair walk the chance of ending at 6 is 2/6 = ${Q.of(2, 6)}, whatever the route.` },
    { type: 'check', scope: 'P(top wall first) = i/N', questions: [
      { make: (rng) => { const N = rng.int(6, 20), i = rng.int(1, N - 1); return mc(rng, `Fair ±1 walk from ${i}, walls at 0 and ${N}. P(it hits ${N} first)?`, Q.of(i, N).toString(), [['1/2', 'ignored the starting point'], [Q.of(N - i, N).toString(), 'answered P(hit 0 first)'], ...(2 * i < N ? [[Q.of(i, N - i).toString(), 'used the odds i : (N − i) as a probability']] : []), [Q.of(i, 2 * N).toString(), 'halved i/N, as if only half the paths counted'], [Q.of(1, 2 ** Math.min(N - i, 10)).toString(), 'required every step to go up']], `Expected final wealth ${i} = ${N} × P, so P = ${Q.of(i, N)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: `Now let each step go up with p instead of 1/2, and plot P(reach ${NN} first) against the start, for three values of p.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: NN, label: 'start i' }, y: { min: 0, max: 1, label: `P(reach ${NN} before 0)` }, curves: [0.45, 0.5, 0.55].map((p) => ({ label: `p = ${p}`, points: IS.map((i) => [i, biasedNum(p, i, NN)]) })), markers: [{ x: 10, y: biasedNum(0.45, 10, NN), label: `p = 0.45 from 10: ${f3(biasedNum(0.45, 10, NN))}` }] }, caption: `The fair line is straight, i/${NN}. A 5-point edge bends it hard: from the middle, p = 0.45 reaches the top only ${f3(biasedNum(0.45, 10, NN))} of the time and p = 0.55 reaches it ${f3(biasedNum(0.55, 10, NN))} of the time.` },
    { type: 'check', scope: 'a small edge compounds', questions: [
      { type: 'choice', q: `Start at 10, walls 0 and ${NN}, win each step with 0.45. Closest to P(reach ${NN})?`, options: [f3(biasedNum(0.45, 10, NN)), '0.450', '0.500', f3(biasedNum(0.55, 10, NN))], answer: 0, traps: { 1: 'used the one-step probability for the whole game', 2: 'used the fair answer i/N', 3: 'turned the edge the wrong way: that is p = 0.55' }, explain: `r = 0.55/0.45 = 11/9; (1 − r^10)/(1 − r^20) ≈ ${f3(biasedNum(0.45, 10, NN))}.` },
    ] },
    { type: 'text', text: `How long does a fair game last? Plot the expected number of steps against the start, walls at 0 and ${ND}.` },
    { type: 'diagram', diagram: 'bar', spec: { title: `Expected steps until a wall (fair, N = ${ND})`, xLabel: 'start i', yLabel: 'expected steps', categories: Array.from({ length: ND + 1 }, (_, i) => String(i)), series: [{ name: 'i(N − i)', values: Array.from({ length: ND + 1 }, (_, i) => i * (ND - i)) }], valueLabels: true }, caption: `A parabola, i(${ND} − i): zero at the walls and largest in the middle (${(ND / 2) * (ND / 2)} steps from ${ND / 2}). Starting one step from a wall still takes ${ND - 1} steps on average.` },
    { type: 'check', scope: 'duration i(N − i)', questions: [
      { make: (rng) => { const N = rng.int(6, 20), i = rng.int(1, N - 1); return mc(rng, `Fair ±1 walk from ${i}, walls at 0 and ${N}. Expected number of steps until a wall?`, String(i * (N - i)), [[String(Math.min(i, N - i)), 'assumed it walks straight to the nearer wall'], [String(i * N), 'multiplied the start by N'], [String((N - i) ** 2), 'squared the distance to one wall'], [String(N), 'guessed the width']], `${i} × ${N - i} = ${i * (N - i)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Fair game: each step changes wealth by +1 or −1 with equal chance, so the expected change is 0, and the expected wealth at the stopping time equals the starting wealth i.', why: 'Adding up zero-mean changes gives a zero-mean total. The game stops at a bounded position, so nothing escapes to infinity.', answers: 'paths',
        checks: [
          { type: 'choice', q: 'Why can you not use this argument for "stop the moment you are $1 up", with no lower wall?', options: ['Without a lower wall, losses before you stop are unbounded', 'The flips stop being fair once you are ahead by $1', 'A $1 target is too small for the argument to apply', 'You can: the expected final wealth is still i'], answer: 0, traps: { 1: 'the flips are fair throughout', 2: 'the size of the target is not the issue', 3: 'you always stop at i + 1, so the expected final wealth is not i: the argument fails here' }, explain: 'The walls keep the wealth bounded; that is what lets the expectation carry over to the stopping time.' },
        ] },
      { say: 'At the end you hold N (probability P) or 0 (probability 1 − P). So N·P + 0 = i and P = i/N.', why: 'One equation, one unknown. The start i sets the answer, not the number of walls.', answers: 'half',
        checks: [
          { make: (rng) => { const N = rng.pick([10, 12, 20, 25]), i = rng.int(1, N - 1); return { type: 'number', q: `$${i} start, target $${N}, fair $1 bets. P(ruin), as a decimal?`, answer: (N - i) / N, tolerance: 1e-9, explain: `1 − ${i}/${N} = ${(N - i) / N}.` }; } },
        ] },
      { say: 'Duration: let E(x) be the expected number of steps left from x. E(0) = E(N) = 0 and E(x) = 1 + [E(x − 1) + E(x + 1)]/2.', why: 'Spend one step, then continue from a neighbour; the walls end the game.',
        checks: [
          { type: 'choice', q: 'Walls at 0 and 2, start at 1. Which equation holds?', options: ['E(1) = 1 + [E(0) + E(2)]/2', 'E(1) = [E(0) + E(2)]/2', 'E(1) = 1 + E(2)', 'E(1) = 2 + E(0)', 'E(1) = 1 + [E(0) + E(1) + E(2)]/3'], answer: 0, traps: { 1: 'forgot the step just spent', 2: 'ignored the step down', 3: 'counted two steps at once', 4: 'the walk never stays put: every step goes up or down' }, explain: 'E(1) = 1 + (0 + 0)/2 = 1: the first step always hits a wall.' },
        ] },
      { say: 'The solution is E(x) = x(N − x). Check: it is 0 at both walls, and its second difference E(x + 1) − 2E(x) + E(x − 1) is −2, exactly what the equation demands.', why: 'Rearranged, the equation says E(x + 1) − 2E(x) + E(x − 1) = −2. A quadratic with leading coefficient −1 does that.',
        checks: [
          { make: (rng) => { const N = rng.int(5, 12), x = rng.int(1, N - 1); return { type: 'number', q: `For E(x) = x(${N} − x), compute E(${x} + 1) − 2E(${x}) + E(${x} − 1).`, answer: -2, hints: [`E(${x + 1}) = ${(x + 1) * (N - x - 1)}, E(${x}) = ${x * (N - x)}, E(${x - 1}) = ${(x - 1) * (N - x + 1)}.`], explain: `${(x + 1) * (N - x - 1)} − ${2 * x * (N - x)} + ${(x - 1) * (N - x + 1)} = −2.` }; } },
        ] },
      { say: 'Biased steps (up with p, down with q = 1 − p): wealth is no longer fair, but r^wealth is, with r = q/p. Rerun the fair argument with r^wealth: P(reach N first) = (1 − r^i)/(1 − r^N).', why: 'E[r^(x ± 1)] = p·r^(x+1) + q·r^(x−1) = r^x(pr + q/r) = r^x(q + p) = r^x. Replace wealth by r^wealth in the fair argument: r^N·P + r^0·(1 − P) = r^i.',
        checks: [
          { make: (rng) => { const p = rng.pick(PS), N = rng.int(5, 10), i = rng.int(1, N - 1); const v = biased(p, i, N); return mc(rng, `Start ${i}, walls 0 and ${N}, each step up with ${p}. P(reach ${N} first)?`, `${f4(v)}`, [[f4(Q.of(i, N)), 'used the fair answer i/N'], [f4(p), 'used the one-step probability'], [f4(biased(one.sub(p), i, N)), 'used r = p/q: that is the opposite bias'], [f4(one.sub(v)), 'answered P(hit 0 first)']], `r = ${ratio(p)}; (1 − r^${i})/(1 − r^${N}) ≈ ${f4(v)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does a fair game from $i with walls at $0 and $N end at $N with probability exactly i/N?', model: 'A fair bet has zero expected profit, so however long the game runs, the expected wealth at the end is still i. At the end the wealth is either N or 0, so the expected wealth is N times the chance of ending at N. Setting N·P = i gives P = i/N.', points: ['fair bets keep expected wealth constant, even at the stopping time', 'the final wealth is N or 0', 'N·P = i, so P = i/N'] },

    S('worked'),
    { type: 'worked', family: 'gamblers-ruin', section: 'bto', difficulty: 3, seed: 'b', explainAt: [0], intro: 'How long a fair game lasts. Try it before opening the solution.' },
    { type: 'worked', family: 'gamblers-ruin', section: 'bto', difficulty: 4, seed: 'b', fade: 1, intro: 'A biased walk. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: `You have $${BK.i}, target $${BK.N}, and win each $1 bet with ${BK.p}. Is P(reach $${BK.N}) closer to 0.45, 0.25 or 0.12?`, answer: `About ${f3(biased(BK.p, BK.i, BK.N))}: r = ${ratio(BK.p)}, and a 5-point edge against you, repeated over many bets, cuts the fair 1/2 to about an eighth.`, explain: 'The one-step probability is a trap: the game lasts many steps, and the edge acts on every one of them.' },

    S('traps'),
    { type: 'traps', family: 'gamblers-ruin', section: 'bto', extra: [
      { belief: 'A fair game gives each wall a 1/2 chance.', fix: 'Only from the middle. From i it is i/N.' },
      { belief: 'The one-step win probability is the answer.', fix: 'The game lasts many steps; the edge compounds through r^i and r^N.' },
      { belief: 'r = p/q.', fix: 'r = q/p = (down chance)/(up chance). Check: p > 1/2 must give an answer above i/N.' },
    ] },
    { type: 'erroneous', problem: `Start at 3, walls 0 and 6, each step up with 2/3. A candidate works out P(reach 6 first). One step is wrong.`, steps: [
      'The walk is biased, so use r^wealth.',
      'r = p/q = (2/3)/(1/3) = 2.',
      `P = (1 − 2³)/(1 − 2⁶) = ${one.sub(Q.of(8)).div(one.sub(Q.of(64)))}.`,
      `Answer ${f3(one.sub(Q.of(8)).div(one.sub(Q.of(64))))}.`,
    ], errorStep: 1, explain: `r = q/p = 1/2. With the wrong r the answer drops below 1/2 although the walk drifts up. Correct: (1 − (1/2)³)/(1 − (1/2)⁶) = ${biased(Q.of(2, 3), 3, 6)} ≈ ${f3(biased(Q.of(2, 3), 3, 6))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'Fair walk from 3, walls 0 and 12. A candidate answers 1/2. Which belief?', options: ['Ignored the starting point', 'Used r the wrong way', 'Used the duration formula'], answer: 0, traps: { 1: 'r belongs to biased walks; this one is fair', 2: 'the duration is 3 × 9 = 27 steps, not a probability' }, explain: '3/12 = 1/4.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Fair: two formulas, i/N and i(N − i). Biased: write r = (down)/(up) first, then sanity check the direction: an edge in your favour must beat i/N, an edge against you must fall short of it.' },
    { type: 'check', scope: 'direction of the edge', questions: [
      { make: (rng) => { const p = rng.pick([Q.of(3, 5), Q.of(2, 5), Q.of(11, 20), Q.of(9, 20)]); const up = p.cmp(Q.of(1, 2)) > 0; return mc(rng, `Start 5, walls 0 and 10, up with ${p}. Without computing, P(reach 10) is:`, up ? 'above 1/2' : 'below 1/2', [[up ? 'below 1/2' : 'above 1/2', 'turned the edge the wrong way'], ['exactly 1/2', 'ignored the bias'], [`exactly ${p}`, 'used the one-step probability']], `From the middle, an edge ${up ? 'in' : 'against'} the walker pushes the answer ${up ? 'above' : 'below'} 1/2: ${f3(biased(p, 5, 10))}.`); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Powers you will need: (11/9)^10 ≈ ${((11 / 9) ** 10).toFixed(2)}, (3/2)^5 ≈ ${(1.5 ** 5).toFixed(2)}, 2^10 = 1024. With r far from 1 and N large, (1 − r^i)/(1 − r^N) ≈ r^(i − N) when r > 1. Budget 45 of the ${SECTIONS.bto.exam.perItemSeconds} seconds for a biased item.` },
    { type: 'thinkaloud', problem: `You have $${TK.i} and bet $1 at a time on a game you win with probability ${TK.p}. You stop at $${TK.N} or $0. What is the probability that you reach $${TK.N}?`, lines: [
      { t: 0, say: 'Two walls, $1 steps, a biased game: gambler\'s ruin with r^wealth.' },
      { t: 4, say: `r = p/q = ${TK.p.div(one.sub(TK.p))}...`, slip: true },
      { t: 7, say: `No: r = down/up = ${one.sub(TK.p)} ÷ ${TK.p} = ${ratio(TK.p)}. An edge against me must land below i/N = ${Q.of(TK.i, TK.N)}.` },
      { t: 14, say: `(${ratio(TK.p)})^${TK.i} = ${f3(qpow(ratio(TK.p), TK.i))}, (${ratio(TK.p)})^${TK.N} ≈ ${qpow(ratio(TK.p), TK.N).toNumber().toFixed(2)}.` },
      { t: 22, say: `P = (1 − ${f3(qpow(ratio(TK.p), TK.i))})/(1 − ${qpow(ratio(TK.p), TK.N).toNumber().toFixed(2)}) ≈ ${f3(biased(TK.p, TK.i, TK.N))}.` },
      { t: 28, say: `Sanity: below ${Q.of(TK.i, TK.N)}, as the edge is against me. Answer ≈ ${f3(biased(TK.p, TK.i, TK.N))}, ${SECTIONS.bto.exam.perItemSeconds - 28} seconds left.` },
    ] },
    { type: 'check', scope: 'r^(i − N) and the think-aloud', questions: [
      { type: 'choice', q: 'r = down/up = 2, walls 0 and 10, start 4. Using r^(i − N), P(reach 10) is about:', options: ['1/64', '4/10', '1/16', '1/1024'], answer: 0, traps: { 1: 'that is the fair answer i/N', 2: 'used r^(−i) instead of r^(i − N)', 3: 'that is r^(−N)' }, explain: 'r^(i − N) = 2^(−6) = 1/64 ≈ 0.016. The exact 15/1023 ≈ 0.015 is close.' },
      { type: 'choice', q: 'In the think-aloud, the first try set r = p/q = 2/3. What was wrong?', options: ['r is down over up: 3/2', 'r should be p + q', 'r should be p/N'], answer: 0, traps: { 1: 'p + q = 1 always', 2: 'N enters the formula as a power, not in r' }, explain: 'r = down/up = (3/5)/(2/5) = 3/2. An edge against you must land below i/N = 1/2.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Two walls → fair: P(top) = i/N, steps = i(N − i). Biased: P(top) = (1 − r^i)/(1 − r^N), r = q/p.' },

    S('contrast'),
    { type: 'compare', columns: ['Walk from 10, walls 0 and 20', 'P(reach 20 first)', 'Expected steps'], rows: [
      ['fair', f3(Q.of(10, 20)), String(10 * 10)],
      ['up with 0.55', f3(biasedNum(0.55, 10, 20)), 'shorter (drift)'],
      ['up with 0.45', f3(biasedNum(0.45, 10, 20)), 'shorter (drift)'],
      ['fair, from 1', f3(Q.of(1, 20)), String(1 * 19)],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: starting on a wall ends the game at once (P = 0 or 1, 0 steps). As p → 1/2 the biased formula tends to i/N. With the top wall removed (N → ∞) a fair walker is ruined with probability 1, yet the expected time to ruin is infinite.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Fair walk, walls 0 and 20. Which start gives the longest expected game?', options: ['10', '1', '19', 'All the same'], answer: 0, traps: { 1: `from 1: 1 × 19 = 19 steps`, 2: 'symmetric to 1', 3: 'i(N − i) depends on i' }, explain: `i(20 − i) peaks at the middle: ${10 * 10} steps.` },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a polygon walk is a line whose two walls are the same vertex. So the hitting time from distance k on an n-cycle is k(n − k) (bto/polygon-walk). The "fair quantity" trick is the martingale idea behind option pricing, and first-step equations are the same as in bto/expected-waiting.' },
    { type: 'variation', base: `Fair $1 bets from $4, stop at $10 or $0: P(reach $10) = 4/10 = ${Q.of(4, 10)}.`, rows: [
      { change: 'Bet $2 at a time instead of $1', effect: `No change: ${Q.of(4, 10)}. The game is still fair, so the expected final wealth is still $4 and 10 × P = 4.`, same: true },
      { change: 'Start at $5', effect: 'The middle: 5/10 = 1/2.' },
      { change: 'Ask for the expected number of bets', effect: `A different question with its own formula: i(N − i) = 4 × 6 = ${4 * 6}.` },
      { change: 'Win each bet with 0.45', effect: `r = 0.55/0.45 = 11/9: (1 − r⁴)/(1 − r¹⁰) ≈ ${f3(biasedNum(0.45, 4, 10))}, well below ${Q.of(4, 10)}.` },
      { change: 'Start at $8 with a target of $20', effect: `Both change, but only the ratio matters: 8/20 = ${Q.of(8, 20)} again. The duration does change: 8 × 12 = ${8 * 12} bets.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const N = rng.int(6, 16); let i = rng.int(2, N - 2); if (2 * i === N) i += 1; return mc(rng, `A stock is ${i} ticks above your stop-loss and ${N - i} ticks below your take-profit. It moves ±1 tick with equal chance. P(the take-profit is hit first)?`, Q.of(i, N).toString(), [['1/2', 'ignored where the price starts'], [Q.of(N - i, N).toString(), 'answered P(stop-loss first)'], ...(2 * i < N ? [[Q.of(i, N - i).toString(), 'used the odds i : (N − i) as a probability']] : []), [Q.of(1, 2 ** Math.min(N - i, 10)).toString(), 'required every tick to go up'], [Q.of(i, 2 * N).toString(), 'halved i/N, as if only half the paths counted']], `Walls at 0 and ${N}, start ${i}: P = ${i}/${N}${Q.of(i, N).toString() === `${i}/${N}` ? '' : ` = ${Q.of(i, N)}`}.`); } },
      far: { make: (rng) => { const p = rng.pick([Q.of(3, 5), Q.of(2, 3), Q.of(11, 20), Q.of(1, 3)]); const q = one.sub(p); const v = p.mul(p).div(p.mul(p).add(q.mul(q))); return { type: 'number', q: `A tennis game is at deuce. You win each point with probability ${p}, independently. You win the game once you are two points ahead (and lose once two behind). P(you win the game), to 3 decimals?`, answer: Number(v.toNumber().toFixed(3)), tolerance: 0.0015, hints: ['Your lead is a ±1 walk from 0 with walls at −2 and +2: shift it to start 2, walls 0 and 4.', `r = q/p = ${q.div(p)}: P = (1 − r²)/(1 − r⁴) = 1/(1 + r²).`], explain: `Start 2, walls 0 and 4: 1/(1 + r²) = p²/(p² + q²) = ${v} ≈ ${f3(v)}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from the gambler to the stock and to deuce?', options: ['A fair quantity keeps its start value until a wall', 'Two walls make both endings equally likely, 1/2', 'The one-step win chance is the whole game\'s chance', 'Count every path from the start to the top wall'], answer: 0, traps: { 1: 'only from the middle: from i it is i/N', 2: 'the edge compounds over many steps', 3: 'paths of every length: the count never ends' }, explain: 'The stock is a fair walk: P = i/N. Deuce is a biased walk between two walls: r^lead is the fair quantity, giving (1 − r^i)/(1 − r^N).' } },

    S('tryit'),
    { type: 'tryit', family: 'gamblers-ruin', section: 'bto', count: 3 },
  ],
};
