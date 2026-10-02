// Expected waiting times: one geometric wait is 1/p; stages that never reset add up; progress
// that can reset needs one first-step equation per state. Every number shown is computed here.
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
const SIX = Q.of(1, 6);
const geo = (p, k) => { let r = p; for (let i = 1; i < k; i++) r = r.mul(one.sub(p)); return r; }; // P(first success on k)
const median = (p) => { let k = 1, c = p.toNumber(); while (c < 0.5) { k += 1; c += geo(p, k).toNumber(); } return k; };
// Stage waits for "m special faces of an s-sided die all appear".
const stages = (s, m) => Array.from({ length: m }, (_, i) => Q.of(s, m - i));
const stageSum = (s, m) => stages(s, m).reduce((a, x) => a.add(x), Q.of(0));
const stageText = (s, m) => stages(s, m).map((x) => x.toString()).join(' + ');
const twoInRow = (s) => s * s + s;
const run = (k) => 2 ** (k + 1) - 2;
const KS = Array.from({ length: 20 }, (_, i) => i + 1);
const node = (id, label, x, y) => ({ id, label, x, y });

export default {
  id: 'bto/expected-waiting',
  book: 'bto',
  kind: 'family',
  family: 'expected-waiting',
  title: 'Expected waiting times',
  summary: 'One success: 1/p. Stages that never reset: add the stage waits. Progress that can reset: one equation per state, E = 1 + Σ p·E(next).',
  prerequisites: ['bto/first-success', 'prob/first-step-markov', 'prob/expectation-linearity'],
  objectives: [
    'Derive E = 1/p for a geometric wait from E = 1 + (1 − p)E',
    'Split a multi-stage wait (two special faces, a repeat, both sides of a coin) into stages and add their means',
    'Write and solve first-step equations when progress can reset: two sixes in a row, k heads in a row',
    'Reject the median, the failures-only count and 1/p² as answers to "expected number"',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw a fair die until a 1 and a 2 have both appeared, in any order. What is the expected number of throws? Try two approaches.', answer: `${stageText(6, 2)} = ${stageSum(6, 2)}`, explain: 'If you answered 12, you added two separate waits of 6. At the start either special face ends the first stage, so it takes only 3 throws on average. The lesson splits every wait into stages like this.', attempts: [
      { id: 'series', label: 'Average over every finishing throw', approach: 'Started writing P(finished on throw k) for every k and summing k times it, and got stuck on the infinite series.', breaksAt: 'The sum is right but slow. Spending one throw and continuing from where you land turns the infinite series into a one-line equation.' },
      { id: 'one-stage', label: 'One wait at 2/6', approach: `Used 1/p with p = 2/6 for "a 1 or a 2": ${Q.of(6, 2)} throws.`, breaksAt: 'E = 1/p needs the same p on every throw. Once one special face has shown, only the other helps and p drops to 1/6.' },
      { id: 'two-waits', label: 'Two separate waits of 6', approach: 'Waited 6 throws for the 1 and 6 more for the 2: 12.', breaksAt: 'At the start either special face moves you on, so the first stage has chance 2/6 and lasts 3 throws, not 6.' },
    ] },
    { type: 'text', text: 'Something is repeated **until** a target happens, and the question asks for the **expected number** of trials: the first six, a double, a 1 and a 2 both seen, two sixes in a row, three heads in a row, a throw that repeats the one before.' },
    { type: 'list', items: ['"You throw two dice until they show a double. Expected number of throws?"', '"A die is thrown until a 5 and a 6 have both appeared. Expected throws?"', '"Expected number of flips until three heads in a row?"'] },
    { type: 'check', scope: 'the quantity asked for', questions: [
      { type: 'choice', q: 'What does an expected-waiting question ask for?', options: ['the average number of trials until the target', 'the chance the target comes on trial k', 'the chance the target ever comes', 'which of two targets comes first'], answer: 0, traps: { 1: 'that is a first-success probability', 2: 'a repeated fair trial reaches the target eventually', 3: 'that is a race between patterns' }, explain: 'It asks for an expected number of trials, not a probability.' },
    ] },
    { type: 'text', text: 'Not this lesson: the **probability** that the wait ends on throw k (bto/first-success), which pattern of coin flips comes first (bto/pattern-waiting), and collecting **all** of n types (bto/coupon-collector).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Throw a die until a 6 follows a 6: expected throws', 'Throw a die until a 6: probability it takes exactly 3 throws', 'Flip until HH or TH: which comes first', 'Throw a die until all six faces appear: expected throws'], answer: 0, traps: { 1: 'a probability of one position: bto/first-success', 2: 'a race between patterns: bto/pattern-waiting', 3: 'all n types: bto/coupon-collector' }, explain: 'An expected number of throws until a target with progress (a six, then another).' },
    ] },

    S('why'),
    { type: 'text', text: '"How long until" is the most common harder Beat the Odds question, and one method handles all of them: write down where you can be, spend one trial, and continue from where you land. The options are built from four wrong ideas: the median instead of the mean, counting only failures, adding stage waits that overlap, and treating overlapping attempts as fresh.' },

    S('anchor'),
    { type: 'text', text: 'From bto/first-success: the first six comes on throw k with (5/6)^(k−1) × 1/6, a path of misses then a hit. The expected wait is the same process with **one change**: instead of one position, you want the average position over all of them.' },
    { type: 'check', scope: 'the geometric path probability', questions: [
      { make: (rng) => { const k = rng.int(2, 4); return mc(rng, `A die is thrown until a six. P(the six comes on throw ${k})?`, geo(SIX, k).toString(), [[SIX.toString(), 'ignored the misses before it'], [geo(SIX, k + 1).toString(), 'one miss too many']], `(5/6)^${k - 1} × 1/6 = ${geo(SIX, k)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Plot the whole distribution of the wait for a six. The bars fall by a factor 5/6 each step, and the tail goes on for a long way.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'P(first six on throw k)', xLabel: 'throw k', yLabel: 'probability', categories: KS.map(String), series: [{ name: 'P', values: KS.map((k) => Math.round(geo(SIX, k).toNumber() * 1000) / 1000) }], valueLabels: false }, caption: `The most likely throw is 1 and the median is ${median(SIX)} (half the time you are done by throw ${median(SIX)}). The mean is 6: the long tail of unlucky runs pulls it above the median.` },
    { type: 'check', scope: 'mean against median', questions: [
      { make: (rng) => { const p = rng.pick([Q.of(1, 4), Q.of(1, 6), Q.of(1, 10), Q.of(1, 5)]); return mc(rng, `Each try succeeds with ${p}. Expected number of tries, counting the success?`, one.div(p).toString(), [[String(median(p)), 'gave the median: the mean is larger because of the long tail'], [one.div(p).sub(one).toString(), 'counted only the failures'], [p.toString(), 'gave the success chance, not a number of tries'], [one.div(p).mul(one.div(p)).toString(), 'squared 1/p']], `1/p = ${one.div(p)}. The median is ${median(p)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'When progress can never be lost, draw the wait as **stages**. Waiting for a 1 and a 2: at first either face moves you on (chance 2/6); after that only the missing one does (1/6).' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Waiting for a 1 and a 2', nodes: [node('a', 'none', 0.05, 0.5), node('b', 'one', 0.5, 0.5), node('c', 'both', 0.95, 0.5)], edges: [{ from: 'a', to: 'a', p: 4 / 6, label: '4/6' }, { from: 'a', to: 'b', p: 2 / 6, label: '2/6' }, { from: 'b', to: 'b', p: 5 / 6, label: '5/6' }, { from: 'b', to: 'c', p: 1 / 6, label: '1/6' }, { from: 'c', to: 'c', p: 1, label: 'done' }] }, caption: `No arrow points backwards, so the wait is two geometric waits in a row: 1/(2/6) + 1/(1/6) = ${stageText(6, 2)} = ${stageSum(6, 2)}.` },
    { type: 'check', scope: 'stages that add', questions: [
      { make: (rng) => { const s = rng.pick([6, 8, 10]), m = rng.int(2, 3); const v = stageSum(s, m); return mc(rng, `A fair ${s}-sided die is thrown until faces 1 to ${m} have all appeared. Expected throws?`, v.toString(), [[String(m * s), `added ${m} separate waits of ${s}`], [String(s), 'waited for one face only'], [Q.of(s, m).toString(), 'counted only the first stage']], `${stageText(s, m)} = ${v}.`); } },
    ] },
    { type: 'text', text: 'When progress **can** be lost, an arrow points backwards. Waiting for two sixes in a row: after one six, a non-six sends you back to the start.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Waiting for 6, 6', nodes: [node('s', 'start', 0.05, 0.5), node('x', '6', 0.5, 0.5), node('y', '66', 0.95, 0.5)], edges: [{ from: 's', to: 's', p: 5 / 6, label: '5/6' }, { from: 's', to: 'x', p: 1 / 6, label: '1/6' }, { from: 'x', to: 'y', p: 1 / 6, label: '1/6' }, { from: 'x', to: 's', p: 5 / 6, label: '5/6' }, { from: 'y', to: 'y', p: 1, label: 'done' }] }, caption: `The arrow from "6" back to "start" is the reset. Stage sums no longer work; you need one equation per state. The answer is ${twoInRow(6)}, not 36.` },
    { type: 'check', scope: 'resets break stage sums', questions: [
      { type: 'choice', q: 'Which wait can you solve by adding stage means?', options: ['a 5 and a 6 both seen, any order', 'two sixes in a row (a 6, then a 6)', 'three heads in a row', 'the pattern 6 then 5 then 6'], answer: 0, traps: { 1: 'a non-six after a six resets progress', 2: 'a tail resets the run', 3: 'a miss can lose progress, so states are needed' }, explain: 'Seen faces stay seen: no arrow points back.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Let E be the expected number of trials. Spend one trial. With chance p you stop; with 1 − p you are back where you started, facing the same E again: E = 1 + (1 − p)E.', why: 'Independent trials have no memory: after a failure the remaining wait is a fresh copy of the whole wait.', answers: 'series',
        checks: [
          { type: 'choice', q: 'Each try succeeds with 1/4. Which equation holds for the expected number of tries E?', options: ['E = 1 + (3/4)E', 'E = (3/4)E', 'E = 1 + (1/4)E', 'E = 4 + (3/4)E'], answer: 0, traps: { 1: 'forgot the trial you just spent', 2: 'restarted on success instead of failure', 3: 'spent 4 trials instead of 1' }, explain: 'One trial, then a fresh wait with chance 3/4.' },
        ] },
      { say: 'Solve: E − (1 − p)E = 1, so pE = 1 and E = 1/p.', why: 'The one-line equation carries the whole infinite sum 1·p + 2·(1 − p)p + 3·(1 − p)²p + … It holds only while p is the same on every trial.', answers: 'one-stage',
        checks: [
          { make: (rng) => { const [txt, p] = rng.pick([['two dice until the sum is at least 10', Q.of(6, 36)], ['a card with replacement until an ace', Q.of(4, 52)], ['two dice until the sum is 12', Q.of(1, 36)], ['a die until a 5 or a 6', Q.of(2, 6)], ['three dice until all show the same face', Q.of(6, 216)]]); return { type: 'number', q: `You throw or draw ${txt}. Expected number of tries?`, answer: one.div(p).toNumber(), hints: ['What is the success chance per try?', `p = ${p}.`], explain: `p = ${p}, so E = 1/p = ${one.div(p)}.` }; } },
        ] },
      { say: 'Stages: if progress is never lost, split the wait where the success chance changes. Each stage is geometric with mean 1/p_i, and the total mean is the sum.', why: 'Linearity of expectation: the total time is the sum of the stage times.', answers: 'two-waits',
        checks: [
          { make: (rng) => { const s = rng.pick([6, 8, 12]), m = rng.int(2, 3); const v = stageSum(s, m); return { type: 'number', q: `A ${s}-sided die is thrown until faces 1 to ${m} have all appeared. Expected throws? (Exact decimals are fine.)`, answer: v.toNumber(), tolerance: 0.01, hints: [`First stage: any of ${m} faces, chance ${m}/${s}.`, stageText(s, m)], explain: `${stageText(s, m)} = ${v} ≈ ${v.toNumber().toFixed(2)}.` }; } },
        ] },
      { say: 'A throw that repeats the previous face: the first throw sets a face; after that each throw matches its predecessor with 1/s. E = 1 + s.', why: 'Whatever the previous face is, exactly one face matches it, so from throw 2 on it is a geometric wait with p = 1/s.',
        checks: [
          { make: (rng) => { const s = rng.pick([4, 6, 8, 10, 20]); return mc(rng, `A fair ${s}-sided die is thrown until a throw shows the same face as the throw before. Expected throws?`, String(s + 1), [[String(s), 'forgot the first throw, which cannot match anything but still counts'], [String(s * s + s), 'waited for one specific double such as two sixes'], [String(s * s), `treated each pair as a fresh 1/${s * s} attempt`]], `1 + ${s} = ${s + 1}.`); } },
        ] },
      { say: 'Resets: one unknown per state. Two sixes in a row: E₀ = 1 + (5/6)E₀ + (1/6)E₁ and E₁ = 1 + (5/6)E₀, where E₁ is the wait after one six.', why: 'From "one six", a six finishes (0 more) and anything else returns you to the start.',
        checks: [
          { make: (rng) => { const s = rng.pick([4, 6, 8, 10]); return { type: 'number', q: `Solve the same equations for a ${s}-sided die: expected throws until two ${s}s in a row?`, answer: twoInRow(s), hints: [`Substitute E₁ = 1 + ((${s} − 1)/${s})E₀ into the first equation.`, `You get E₀/${s * s} = 1/${s} + 1/${s * s}.`], explain: `E₀ = ${s}² + ${s} = ${twoInRow(s)}.` }; } },
        ] },
      { say: 'k heads in a row: to extend a run of k − 1 heads, flip once more; a tail sends you back to the start. E_k = 2E_(k−1) + 2, so E_k = 2^(k+1) − 2.', why: 'E_k = E_(k−1) + 1 + (1/2)E_k: reach k − 1 heads, flip once, and half the time start over.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `Fair coin. Expected flips until ${k} heads in a row?`, String(run(k)), [[String(2 ** k), `treated each block of ${k} flips as a fresh attempt`], [String(2 ** (k + 1)), 'forgot the − 2'], [String(2 * k), 'added 2 per head: a tail wipes out the run']], `2^${k + 1} − 2 = ${run(k)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does waiting for two sixes in a row take 42 throws on average and not 36, even though any given pair of throws is 6, 6 with chance 1/36?', model: 'The chance 1/36 is per pair of positions, but the pairs overlap and a failure is costly: after a six, a non-six throws away the progress, and the throw that failed cannot start a new attempt of its own. The first-step equations track that reset exactly and give 36 + 6 = 42.', points: ['1/36 is a chance per window, not a waiting time', 'a miss after a six resets progress to the start', 'one equation per state of progress captures the reset'] },

    S('worked'),
    { type: 'worked', family: 'expected-waiting', section: 'bto', difficulty: 1, seed: 'd', explainAt: [1], intro: 'One geometric wait. Try it before opening the solution.' },
    { type: 'worked', family: 'expected-waiting', section: 'bto', difficulty: 3, seed: 'd', fade: 1, intro: 'A wait with a reset. The equations are given; solving them and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Which takes longer on average: waiting for a six, or waiting for a throw that repeats the one before it?', answer: `The repeat: ${6 + 1} throws against 6. After the first throw it is also a 1/6 wait, but the first throw itself is spent.`, explain: 'Same chance per throw, one extra throw at the start.' },

    S('traps'),
    { type: 'traps', family: 'expected-waiting', section: 'bto', extra: [
      { belief: 'The expected wait is when you are "probably done" (the median).', fix: 'The mean includes the long tail: 6 for a six, while the median is 4.' },
      { belief: 'Waiting for a 1 and a 2 is two waits of 6.', fix: 'At first either face will do: 3 + 6 = 9.' },
      { belief: 'Two sixes in a row: each pair is a 1/36 attempt, so 36.', fix: 'Attempts overlap and resets waste throws: 42.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out the expected number of flips until two heads in a row with a fair coin. One step is wrong.', steps: [
      'States: 0 (no head yet), 1 (last flip a head).',
      'E₀ = 1 + (1/2)E₀ + (1/2)E₁.',
      'E₁ = 1 + (1/2)E₁, since after a tail you still have your head.',
      'So E₁ = 2 and E₀ = 4.',
    ], errorStep: 2, explain: `After a head, a tail destroys the run: E₁ = 1 + (1/2)E₀, not (1/2)E₁. Solving gives E₀ = ${run(2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'Wait for a six. A candidate answers 5. Which belief?', options: ['Counted only the failures before the six', 'Gave the median wait instead of the mean', 'Squared 1/p instead of taking 1/p itself'], answer: 0, traps: { 1: `the median wait for a six is ${median(SIX)}, not 5`, 2: '(1/p)² would be 36' }, explain: 'The six itself is a throw: 5 misses on average plus 1.' },
      { type: 'choice', q: `Another answers ${median(SIX)}. Which belief?`, options: ['Gave the median, not the mean', 'Counted only the failures, not the six', 'Added stage means for a one-stage wait'], answer: 0, traps: { 1: 'failures only gives 5', 2: 'one six is a single stage, so the stage sum is just 6' }, explain: `By throw ${median(SIX)} you are done at least half the time, but the mean is 6.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know these cold: one six 6; any repeat of the previous face 7; a 1 and a 2 ${stageSum(6, 2)}; two sixes in a row ${twoInRow(6)}; HH ${run(2)}; HHH ${run(3)}; both sides of a fair coin 3. Each saves a full computation.` },
    { type: 'check', scope: 'the landmark waits', questions: [
      { make: (rng) => { const [txt, v] = rng.pick([['a fair coin until HH', run(2)], ['a fair coin until HHH', run(3)], ['a die until two sixes in a row', twoInRow(6)], ['a die until a throw repeats the one before', 7]]); return { type: 'number', q: `Expected number of throws or flips: ${txt}?`, answer: v, explain: `Landmark value: ${v}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `Sanity check: a wait with resets is always longer than the "fresh attempt" guess (${twoInRow(6)} > 36, ${run(2)} > 4). A stage sum is always shorter than separate waits added (${stageSum(6, 2)} < 12). Budget: ${SECTIONS.bto.exam.perItemSeconds} seconds; two-state equations take about 40.` },
    { type: 'thinkaloud', problem: 'A fair coin is flipped until three heads in a row appear. What is the expected number of flips?', lines: [
      { t: 0, say: 'Until a run of heads: a tail can wipe out progress, so this is a reset wait. States, not a stage sum.' },
      { t: 4, say: 'Three flips are HHH with chance 1/8, so about 8 blocks of three...', slip: true },
      { t: 8, say: 'Wait: blocks overlap and a tail throws the run away. Fresh-attempt guesses are always too short when there are resets.' },
      { t: 13, say: `Run recursion E_k = 2E_(k−1) + 2: E₁ = ${run(1)}, E₂ = ${run(2)}, E₃ = ${run(3)}.` },
      { t: 20, say: `Check with the landmark 2^(k+1) − 2 = ${2 ** 4} − 2 = ${run(3)}. Longer than the fresh guess, as a reset wait must be.` },
      { t: 24, say: `Answer ${run(3)}, with ${SECTIONS.bto.exam.perItemSeconds - 24} seconds left.` },
    ] },
    { type: 'check', scope: 'the sanity rule and the think-aloud', questions: [
      { type: 'choice', q: 'Expected throws until a 5 and a 6 have both appeared. Separate waits add to 6 + 6 = 12. The true answer is:', options: ['below 12', 'exactly 12', 'above 12'], answer: 0, stable: true, traps: { 1: 'the first stage accepts either face, so the stages overlap', 2: 'a stage sum is shorter, never longer, than separate waits added' }, explain: 'Stages: 6/2 = 3 for the first of the two faces, then 6 for the other: 9 < 12.' },
      { type: 'choice', q: 'In the think-aloud, the first try guessed about 8 blocks of three flips. What was wrong?', options: ['it ignored resets: a tail ends the run', 'HHH has chance 1/16 per block', 'the flips here are not independent'], answer: 0, traps: { 1: 'HHH has chance 1/8', 2: 'the flips are independent; the run is what resets' }, explain: 'Fresh-attempt guesses are too short when there are resets. E_k = 2E_(k−1) + 2 gives 14.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'One success: 1/p. No resets: add stage means 1/p_i. Resets: E_state = 1 + Σ p·E_next, solve. Two sixes 42; k heads 2^(k+1) − 2.' },

    S('contrast'),
    { type: 'compare', columns: ['Wait (fair die or coin)', 'Structure', 'Expected'], rows: [
      ['first six', 'one geometric stage', '6'],
      ['a 1 and a 2', 'two stages, no reset', stageSum(6, 2).toString()],
      ['all six faces', 'six stages (bto/coupon-collector)', Q.of(6, 6).add(Q.of(6, 5)).add(Q.of(6, 4)).add(Q.of(6, 3)).add(Q.of(6, 2)).add(Q.of(6, 1)).toString()],
      ['two sixes in a row', 'reset after a miss', String(twoInRow(6))],
      ['HH (coin)', 'reset after a tail', String(run(2))],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: p = 1 gives E = 1 (the first trial always succeeds). As p shrinks, E = 1/p grows without bound. A biased coin until both sides appear: 1 + p/q + q/p, which is 3 for a fair coin and larger for any bias.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'A coin with heads 1/3. Expected flips until both a head and a tail have appeared?', options: [one.add(Q.of(1, 2)).add(Q.of(2)).toString(), '3', Q.of(3).add(Q.of(3, 2)).toString(), '2'], answer: 0, traps: { 1: 'used the fair-coin answer', 2: 'added two waits from scratch: after the first flip only the other side is missing', 3: 'assumed two flips always suffice' }, explain: `1 + (1/3)/(2/3) + (2/3)/(1/3) = ${one.add(Q.of(1, 2)).add(Q.of(2))}.` },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: coupon collecting is the stage sum with n stages (bto/coupon-collector); pattern races use the same state equations (bto/pattern-waiting); random walks and gambler\'s ruin are first-step equations with a position as the state (bto/gamblers-ruin).' },
    { type: 'variation', base: `A fair die is thrown until a 1 and a 2 have both appeared: E = ${stageText(6, 2)} = ${stageSum(6, 2)}.`, rows: [
      { change: 'Wait for a 5 and a 6 instead', effect: `No change: ${stageSum(6, 2)}. Only the number of special faces and sides enters the stages, not which faces they are.`, same: true },
      { change: 'Require the 1 first and the 2 after it', effect: 'Now a 2 before the 1 is wasted, so the first stage waits for the 1 alone: 6 + 6 = 12.' },
      { change: 'Wait for two sixes in a row', effect: `A reset appears (a miss after a six sends you back), so stage sums fail: the state equations give ${twoInRow(6)}.` },
      { change: 'Use an 8-sided die', effect: `Each stage mean is 8 over the faces still missing: ${stageText(8, 2)} = ${stageSum(8, 2)}.` },
      { change: 'An 8-sided die and three special faces', effect: `Both changes enter the same stage sum: 8 on top, one stage per special face: ${stageText(8, 3)} = ${stageSum(8, 3)} ≈ ${stageSum(8, 3).toNumber().toFixed(2)}.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const [txt, c] = rng.pick([['a king and a queen', 4], ['a heart and a spade', 13], ['an ace and a king', 4]]); const v = Q.of(52, 2 * c).add(Q.of(52, c)); return { type: 'number', q: `You draw a card from a full deck, look, and put it back, until you have seen ${txt}. Expected number of draws?`, answer: v.toNumber(), tolerance: 0.01, hints: ['Two stages: first either kind, then the one still missing.', `Stage 1 has chance ${2 * c}/52, stage 2 has ${c}/52.`], explain: `52/${2 * c} + 52/${c} = ${v} (the same stage sum as a 1 and a 2 on a die).` }; } },
      far: { make: (rng) => { const p = rng.pick([Q.of(1, 2), Q.of(1, 3), Q.of(2, 3), Q.of(1, 4)]); const v = one.div(p).add(one.div(p.mul(p))); return { type: 'number', q: `A trading strategy is profitable each day with probability ${p}, independently. Expected number of days until it has two profitable days in a row?`, answer: v.toNumber(), tolerance: 0.01, hints: ['States: no profitable day yet, and one profitable day just now. A loss after a win resets.', `E₀ = 1 + (1 − p)E₀ + pE₁ and E₁ = 1 + (1 − p)E₀ with p = ${p}.`, 'Solving gives 1/p + 1/p².'], explain: `The two sixes equations with p = ${p}: E = 1/p + 1/p² = ${one.div(p)} + ${one.div(p.mul(p))} = ${v}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from dice to the cards and to the trading days?', options: ['Spend one trial, continue from the state you land in', 'Treat each block of trials as a fresh 1/p attempt', 'Answer the trial by which you are probably done', 'Add a full separate wait for each thing you need'], answer: 0, traps: { 1: 'blocks overlap and resets waste trials, so this is too short', 2: 'that is the median, not the mean', 3: 'early on any missing item helps, so stages are shorter' }, explain: 'Both new waits are first-step problems: the cards never reset, so the stages add; the trading days reset after a loss, so each state gets its own equation.' } },

    S('tryit'),
    { type: 'tryit', family: 'expected-waiting', section: 'bto', count: 3 },
  ],
};
