// Zap-N game lesson: Shapeshift (speeded classification). Timings, round counts and the key
// mapping come from the engine (src/zapn/shapeshift/engine.js).
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { DEFAULTS, KEY_FOR } from '../../../zapn/shapeshift/engine.js';
import { sec, mc, pct, dec } from './balloon.js';

const { rounds: R, flashMs, windowMs, itiMin, itiMax } = DEFAULTS;
const HALF = Math.floor(R / 2);
const TARGET = ZAPN_TARGETS.shapeshift.value;
const BUDGET = Math.floor(R * (1 - TARGET) + 1e-9); // errors you can afford
const acc = (errors) => (R - errors) / R;
const KEY = { right: 'right arrow', left: 'left arrow' };
const outcome = (t) => (t.key == null || t.rt >= windowMs ? 'miss' : t.key === KEY_FOR[t.shape] ? 'correct' : 'wrong');

const WORKED = [
  { shape: 'circle', x: 0.25, y: 0.4, key: 'right', rt: 410 },
  { shape: 'square', x: 0.8, y: 0.7, key: 'left', rt: 380 },
  { shape: 'square', x: 0.15, y: 0.3, key: 'right', rt: 250 },
  { shape: 'circle', x: 0.6, y: 0.8, key: null },
  { shape: 'circle', x: 0.45, y: 0.2, key: 'right', rt: 1450 },
  { shape: 'square', x: 0.7, y: 0.5, key: 'left', rt: 1600 },
].map((t) => ({ ...t, result: outcome(t) }));
const wCorrect = WORKED.filter((t) => t.result === 'correct').length;

export default {
  id: 'zapn/shapeshift',
  book: 'zapn',
  kind: 'game',
  game: 'shapeshift',
  title: 'Shapeshift: fast without guessing',
  summary: `Round means right, anything else left. ${pct(TARGET)} of ${R} rounds leaves ${BUDGET} errors, and ${2 * BUDGET} guesses spend them all.`,
  prerequisites: ['assessment/minus-one-rule'],
  objectives: [
    'Map each shape to its key with one rule: round is right, anything else is left',
    `Count your error budget: ${BUDGET} wrong or missed rounds out of ${R} at the ${pct(TARGET)} target`,
    'Explain why an anticipatory guess costs half an error on average and never pays',
    'Score any trial: correct, wrong or miss, from its key and reaction time',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. ${R} rounds; each shows a circle or a square for half a second. Right arrow for a circle, left for a square. The target is ${pct(TARGET)} accuracy. How many rounds can you get wrong or miss, and what does pressing early on 8 rounds (before you have really seen the shape) cost you on average?`, answer: `${BUDGET} errors allowed; 8 guesses cost about 4 errors, over budget.`, explain: `${pct(TARGET)} of ${R} is ${R - BUDGET} right, so ${BUDGET} errors. Circles and squares are equally common, so a guess is wrong half the time: 8 guesses cost 4 errors on average. If you thought a guess only costs a little speed, the lesson shows why it costs accuracy instead.`,
      attempts: [
        { id: 'fast', label: 'Press as fast as possible', approach: 'Pressed the instant anything appeared, to keep reaction time low.', breaksAt: 'A press before you recognise the shape is a guess, wrong half the time, and speed is not the score.' },
        { id: 'budget', label: 'A few slips are fine', approach: 'Aimed for mostly right and accepted a handful of errors.', breaksAt: `The target leaves only ${BUDGET} errors in ${R} rounds, misses included.` },
      ] },
    { type: 'text', text: `Shapeshift is the reaction game of Zap-N. A circle or a square flashes for ${flashMs} ms somewhere on the stage. Press the **right arrow** for a circle and the **left arrow** for a square. You have ${windowMs / 1000} s from the flash to answer. ${R} rounds, exactly ${HALF} circles and ${R - HALF} squares in random order.` },
    { type: 'text', text: `The tracked score is **accuracy**: correct answers out of ${R}, with misses counted as wrong. Mean reaction time on correct answers is recorded but is not the target. A key pressed before the shape appears is an early press, not an answer. Target: ${pct(TARGET)}.` },
    { type: 'check', scope: 'the key mapping and the score', questions: [
      mc({ q: 'A square flashes at the far right of the stage. Which key?', right: 'left arrow', at: 0,
        wrong: [['right arrow', 'followed where the shape appeared: position never matters, only the shape'], ['no key: wait for a circle', 'every round needs an answer; a miss counts as wrong']],
        explain: 'Square means left, wherever it appears.' }),
      mc({ q: 'Which result counts against your accuracy?', right: 'both a wrong key and no key in time', at: 2,
        wrong: [['only pressing the wrong key for the shape', 'a miss is scored as wrong too'], ['only answers slower than the average', 'speed is recorded, not scored: a slow correct answer is correct'], ['only rounds where no key was pressed', 'a wrong key is wrong']],
        explain: `Accuracy = correct / ${R}. Wrong keys and misses both fall outside the numerator.` }),
    ] },

    sec('why'),
    { type: 'text', text: 'Markets reward fast reactions only when they are right. Shapeshift measures whether you can go fast without letting speed break accuracy: the classic speed-accuracy trade-off. The score makes the trade explicit, because speed earns nothing on its own and one careless press costs a whole round.' },

    sec('anchor'),
    { type: 'text', text: 'You already react to a traffic light by one feature, its colour, without searching for the light. Shapeshift is that with **one change**: the "light" can appear anywhere and is gone after half a second. So you do not hunt for it; you keep your eyes in the centre, let it arrive, and react to its shape only.' },
    { type: 'check', scope: 'react to one feature', questions: [
      mc({ q: 'Which feature of a flash decides the key?', right: 'its shape only', at: 1,
        wrong: [['its position', 'position is random and irrelevant'], ['its size and shape', 'size never changes the answer'], ['how long it stays', 'every shape stays the same 500 ms']],
        explain: 'Round is right, anything else is left. Nothing else matters.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Four rounds as they might appear. The shapes land anywhere; the answer depends on the shape alone.' },
    { type: 'diagram', diagram: 'zapn-shapeshift', spec: { trials: [{ shape: 'circle', x: 0.2, y: 0.3 }, { shape: 'square', x: 0.85, y: 0.6 }, { shape: 'square', x: 0.3, y: 0.8 }, { shape: 'circle', x: 0.75, y: 0.25 }] }, caption: 'Circles (dark dots) get the right arrow, squares the left, wherever they land.' },
    { type: 'diagram', diagram: 'zapn-shapeshift', spec: { trials: [{ shape: 'circle', x: 0.5, y: 0.5 }], timeline: true }, caption: `One round's timing: a random wait of ${itiMin / 1000}-${itiMax / 1000} s (keys there are early presses), the shape for ${flashMs} ms, and ${windowMs / 1000} s from the flash to answer. The shape is gone ${(windowMs - flashMs) / 1000} s before the window closes.` },
    { type: 'check', scope: 'the timing of a round', questions: [
      { make: (rng) => { const t = 100 * rng.int(6, 14); return mc({ q: `The shape flashed and vanished. You press the correct key ${t} ms after the flash. How is the round scored?`, right: 'correct', at: 0,
        wrong: [['a miss: the shape was already gone', `the answer window is ${windowMs} ms from the flash, longer than the ${flashMs} ms the shape is visible`], ['correct but penalised for speed', 'speed is recorded, not scored']],
        explain: `${t} ms < ${windowMs} ms: inside the window, so it counts.` }, rng); } },
      mc({ q: 'You press right during the wait, before any shape appears. What happens?', right: 'it is an early press and the round still needs an answer', at: 1,
        wrong: [['it counts as the answer to the next shape that appears', 'an early press is not an answer to anything'], ['the round is scored wrong and the next round starts', 'early presses are counted separately; the round goes on']],
        explain: 'Early presses are logged apart from answers; the round waits for the shape as usual.' }),
    ] },
    { type: 'diagram', diagram: 'flow', spec: { root: 'q1', nodes: [
      { id: 'q1', text: 'Is a shape on the stage?', kind: 'q' },
      { id: 'w', text: 'No: wait, fingers still', kind: 'a' },
      { id: 'q2', text: 'Is it round?', kind: 'q' },
      { id: 'r', text: 'Yes: right arrow', kind: 'a' },
      { id: 'l', text: 'No: left arrow', kind: 'a' },
    ], edges: [{ from: 'q1', to: 'w', label: 'no' }, { from: 'q1', to: 'q2', label: 'yes' }, { from: 'q2', to: 'r', label: 'yes' }, { from: 'q2', to: 'l', label: 'no' }] }, caption: 'The whole game is two questions. The first one is where most errors come from: pressing before the answer to "is a shape there?" is yes.' },
    { type: 'check', scope: 'the two-question rule', questions: [
      mc({ q: 'A shape with straight edges and four corners appears. Which key?', right: 'left arrow', at: 1, wrong: [['right arrow', 'reversed the rule: round is right'], ['wait for a clearer shape', 'the shape is gone after 500 ms; answer now']], explain: 'Not round, so left.' }),
    ] },

    sec('derivation'),
    { type: 'text', text: 'There are two ways to press too soon. During the wait, before any shape exists, the press is logged as early and ignored: it cannot answer anything, but it shows an itchy finger. The costly one comes a moment later: the shape is on the stage but you have not yet recognised it, and the press counts as your answer. That is a **guess**. The steps below price it in the only currency the score uses, errors.' },
    { type: 'steps', steps: [
      { answers: 'budget', say: `Accuracy = correct / ${R}, misses counted wrong. The ${pct(TARGET)} target leaves at most ${BUDGET} errors in the whole game.`, why: `${R - BUDGET} / ${R} = ${dec(acc(BUDGET))} ≥ ${TARGET}, but ${R - BUDGET - 1} / ${R} = ${dec(acc(BUDGET + 1))} is below.`,
        checks: [{ type: 'number', q: `How many wrong or missed rounds can you afford and still reach ${pct(TARGET)}?`, answer: BUDGET, hints: [`${pct(TARGET)} of ${R} rounds must be right.`, `${R} × ${TARGET} = ${R * TARGET}.`], explain: `${R} − ${R * TARGET} = ${BUDGET}.` }] },
      { say: `A guess, meaning a press before you have recognised the shape, is right with probability 1/2: there are ${HALF} circles and ${R - HALF} squares in random order.`, why: 'Without seeing the shape, both keys are equally likely to be right.',
        checks: [{ type: 'number', q: 'Probability that a blind guess is right?', answer: 0.5, explain: 'Circles and squares are equally common: 1/2.' }] },
      { answers: 'fast', say: 'So g guesses cost g/2 errors on average. Waiting a few hundred milliseconds costs nothing in the score.', why: 'Each guess is wrong with probability 1/2; expected errors add up. Speed is not in the tracked metric.',
        checks: [{ make: (rng) => { const g = 2 * rng.int(2, 9); return { type: 'number', q: `You guess on ${g} rounds and answer every other round correctly. Expected accuracy? (a decimal)`, answer: acc(g / 2), tolerance: 0.001, hints: [`Expected errors: ${g} × 1/2.`, `(${R} − ${g / 2}) / ${R}.`], explain: `${g / 2} expected errors: ${R - g / 2}/${R} = ${dec(acc(g / 2))}.` }; } }] },
      { say: `${2 * BUDGET} guesses spend the whole budget of ${BUDGET} errors on average, before a single honest slip. So never guess.`, why: `${2 * BUDGET} × 1/2 = ${BUDGET}. Real play always has a few slips, so the budget for guessing is zero.`,
        checks: [mc({ q: 'Your honest error rate is zero. How many guessed rounds would, on average, use up the full error budget?', right: String(2 * BUDGET), at: 2, wrong: [[String(BUDGET), 'counted each guess as a certain error'], [String(4 * BUDGET), 'thought a guess is wrong only a quarter of the time'], ['none: guesses are free', 'a guess is wrong half the time']], explain: `Each guess costs 1/2 an error on average: ${BUDGET} ÷ 1/2 = ${2 * BUDGET}.` })] },
    ] },
    { type: 'text', text: `The picture of that trade: expected accuracy falls by half a round for every guessed round, and crosses the target at ${2 * BUDGET} guesses.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 20, label: 'rounds guessed out of 60' }, y: { min: 0.8, max: 1, label: 'expected accuracy' }, curves: [{ label: 'accuracy = (60 − g/2)/60', points: [0, 5, 10, 15, 20].map((g) => [g, acc(g / 2)]) }], hlines: [{ y: TARGET, label: 'target' }], vlines: [{ x: 2 * BUDGET, label: `${2 * BUDGET} guesses` }], markers: [{ x: 2 * BUDGET, y: acc(BUDGET), label: pct(acc(BUDGET)) }] }, caption: `Past ${2 * BUDGET} guesses, even perfect honest play falls below ${pct(TARGET)} on average.` },
    { type: 'check', scope: 'the guessing line', questions: [
      { make: (rng) => { const g = 2 * rng.int(1, 10); return { type: 'number', q: `Read the line: expected accuracy after ${g} guessed rounds (a decimal)?`, answer: acc(g / 2), tolerance: 0.001, explain: `(${R} − ${g / 2})/${R} = ${dec(acc(g / 2))}.` }; } },
    ] },
    { type: 'explain', prompt: 'Why is pressing early never worth it in Shapeshift, even though the game records your reaction time?', model: `The score is accuracy. A press before you recognise the shape is right only half the time, because circles and squares are equally common, so every guess costs half an error on average. The ${pct(TARGET)} target leaves only ${BUDGET} errors, so a handful of guesses spends the budget, while the time you save is not scored.`, points: ['Accuracy is the tracked metric; reaction time is only recorded', 'A guess is right with probability 1/2', `The error budget is ${BUDGET}, so ${2 * BUDGET} guesses exhaust it on average`] },

    sec('worked'),
    { type: 'text', text: 'Six rounds from a real run, with the key pressed and the time since the flash. Score each before you read on.' },
    { type: 'diagram', diagram: 'zapn-shapeshift', spec: { trials: WORKED, stated: { correct: wCorrect, accuracy: wCorrect / WORKED.length } }, caption: `${wCorrect} of ${WORKED.length} correct. Round 3 was a fast guess, round 4 a miss, round 6 came after the window had closed.` },
    { type: 'steps', steps: [
      { say: 'Rounds 1 and 2: circle and right arrow at 410 ms, square and left arrow at 380 ms. Both correct.', why: 'Right key for the shape, inside the window.',
        checks: [mc({ q: 'Round 1 took 410 ms and round 2 took 380 ms. Which scores higher?', right: 'they score the same', at: 0, wrong: [['round 2: it was faster', 'speed is recorded, not scored'], ['round 1: slower is more careful', 'both are simply correct']], explain: 'Each correct round adds exactly one to the numerator.' })] },
      { say: 'Round 3: square, right arrow at 250 ms. Wrong: the key was pressed before the shape was recognised.', why: 'The fastest press in the set is the wrong one: the signature of a guess.',
        checks: [mc({ q: 'What most likely caused round 3?', right: 'pressing before recognising the shape', at: 0, wrong: [['the square appeared on the left', 'position does not decide the key'], ['a slow reaction', 'it was the fastest press of the six']], explain: 'A 250 ms wrong answer is an anticipation error.' })] },
      { say: `Round 4: no key. Round 6: left arrow at 1600 ms, after the ${windowMs} ms window. Both are misses.`, why: `The round is scored as a miss the moment the window closes; a later press does not count.`,
        checks: [{ type: 'number', q: `How many of the six rounds are misses?`, answer: WORKED.filter((t) => t.result === 'miss').length, explain: 'Round 4 (no key) and round 6 (too late).' }] },
      { say: `Total: ${wCorrect} correct of ${WORKED.length}, accuracy ${dec(wCorrect / WORKED.length)}. Round 5 at 1450 ms still counted.`, why: `1450 ms is inside the ${windowMs} ms window: slow but correct.`,
        checks: [{ type: 'number', q: 'Accuracy over these six rounds? (a decimal)', answer: wCorrect / WORKED.length, tolerance: 0.001, explain: `${wCorrect}/${WORKED.length} = ${dec(wCorrect / WORKED.length)}.` }] },
    ] },

    sec('predict'),
    { type: 'predict', question: `You play every round perfectly except the 10 rounds after long waits, where impatience makes you press before you have really seen the shape. Expected accuracy?`, answer: `${dec(acc(5))} (${pct(acc(5))}): 5 expected errors, above the budget of ${BUDGET}.`, explain: '10 guesses × 1/2 = 5 expected errors.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Speed is the score.', fix: 'Accuracy is the tracked metric; reaction time is only recorded.' },
      { belief: 'A fast guess costs at most a little accuracy.', fix: 'It is wrong half the time: half an error per guess, and the budget is only a few errors.' },
      { belief: 'Pressing early gives a head start.', fix: 'A press before the shape is an early press, not an answer; the round still needs one.' },
      { belief: 'Where the shape appears matters.', fix: 'Position is random. Keep your eyes in the centre and let the shape arrive.' },
      { belief: 'A miss is better than a wrong answer.', fix: 'Both count as wrong.' },
    ] },
    { type: 'erroneous', problem: `A candidate scores a run: ${R - 3} rounds answered, ${R - 4} of them correct, 3 rounds with no key.`, steps: [
      `Rounds answered: ${R - 3}.`,
      `Correct: ${R - 4}.`,
      `Accuracy = ${R - 4} / ${R - 3} = ${dec((R - 4) / (R - 3))}.`,
      `That clears the ${pct(TARGET)} target.`,
    ], errorStep: 2, explain: `Misses count as wrong, so the denominator is all ${R} rounds: ${R - 4}/${R} = ${dec(acc(4))}, below ${pct(TARGET)}.` },
    { type: 'check', scope: 'scoring a run', questions: [
      { make: (rng) => { const w = rng.int(0, 3), m = rng.int(0, 3); return { type: 'number', q: `A run of ${R} rounds has ${w} wrong keys and ${m} misses. Accuracy? (a decimal)`, answer: acc(w + m), tolerance: 0.001, hints: ['Misses count as wrong.', `(${R} − ${w} − ${m}) / ${R}.`], explain: `${R - w - m}/${R} = ${dec(acc(w + m))}${acc(w + m) >= TARGET - 1e-9 ? ': on target' : ': below target'}.` }; } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Before each round: eyes on the centre, both fingers resting on the arrows. Moving a finger to a key costs time every round and invites pressing the wrong one.' },
    { type: 'callout', tone: 'speed', text: 'Get faster by removing the search, not by pressing sooner. If you catch yourself pressing before you have seen the shape, slow down for three rounds; errors cluster after fast streaks.' },
    { type: 'thinkaloud', problem: 'Mid-game. The stage is empty, then a shape flashes in the lower right. Times are from the flash.', lines: [
      { t: 0, say: 'Eyes on the centre dot, fingers resting on both arrows. Something appears low on the right.' },
      { t: 0.15, say: 'Right side, so right arrow.', slip: true },
      { t: 0.3, say: 'No: position never decides. Straight edges and corners: a square.' },
      { t: 0.45, say: 'Left arrow.' },
      { t: 0.55, say: `Check: still well inside the ${windowMs / 1000} s window, so the extra glance cost nothing. Fingers back to rest.` },
    ] },
    { type: 'check', scope: 'where speed comes from', questions: [
      mc({ q: 'You want a faster mean reaction time without losing accuracy. What should change?', right: 'keep eyes centred and fingers on the keys, then react to the shape', at: 1,
        wrong: [['press the moment anything moves on the stage, before it is clear', 'that is guessing: half an error per round it happens'], ['look toward the corners, where the shapes often appear', 'positions are random; searching costs time'], ['answer circles quickly and take extra care over squares', 'squares count exactly as much as circles']],
        explain: 'Speed comes from removing the search and the finger travel, not from anticipation.' }),
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `Shapeshift: eyes centre, fingers on keys. Round → right, anything else → left. Never press before you see it: ${BUDGET} errors is the whole budget.` },

    sec('contrast'),
    { type: 'compare', columns: ['Game', 'You respond to', 'Rules in play', 'No answer in time counts as'], rows: [
      ['Shapeshift', 'one shape, anywhere', 'one', 'wrong'],
      ['The Switch', 'the highlighted block', 'two, switching unpredictably', 'wrong'],
      ['CodeCompare', 'four candidate codes', 'one: find the identical code', 'wrong'],
      ['Stock Master', 'needles entering zones', 'one, on up to four dials at once', 'a miss, the same cost as a false click'],
    ] },
    { type: 'variation', base: 'A circle flashes at the centre of the stage. Answer: right arrow.', rows: [
      { same: true, change: 'It flashes in a corner instead', effect: 'Still right: position never changes the answer.' },
      { change: 'A square instead of a circle', effect: 'Left arrow: the shape is the only thing that decides.' },
      { fusion: true, change: 'A square, flashing in a corner', effect: 'Left arrow: the shape change flips the key, the position change does nothing.' },
      { same: true, change: 'You pressed right during the wait, just before it appeared', effect: 'That was an early press, not an answer. The round is still open: answer the circle, right.' },
      { same: true, change: 'The last four rounds were all circles', effect: 'Nothing changes: you answer the shape you see, never a pattern you expect.' },
      { change: 'You blinked and missed it, and 1.2 s have passed', effect: `Press either arrow before ${windowMs / 1000} s: a guess is right half the time, a miss never.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge case: if you blinked and never saw the shape, press a key before the ${windowMs / 1000} s window ends. A miss is certainly wrong; a guess is right half the time. This is the only guess that pays.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the −1 rule of the multiple-choice tasks (answer only when your chance beats the break-even) is the same trade. In Shapeshift waiting costs nothing, so the break-even is simple: never answer before you know.' },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.pick([40, 50, 80, 100]), T = rng.pick([0.9, 0.95]); const b = Math.floor(n * (1 - T) + 1e-9); return { type: 'number', q: `Another reaction game: ${n} rounds, blue means up and red means down, target ${pct(T)} accuracy with misses counted wrong. How many errors can you afford?`, answer: b, hints: [`${pct(T)} of ${n} must be right.`, `${n} − ${n} × ${T}.`], explain: `${n} − ${n * T} = ${b}.` }; } },
      far: { make: (rng) => { const k = rng.int(3, 5); return mc({ q: `Beat the Odds scores +1 right, −1 wrong, 0 skipped. You have narrowed a question to ${k} options and would pick one at random. Answer or skip?`, right: 'skip', at: rng.int(0, 1), wrong: [['answer', `a random pick among ${k} is right 1/${k} of the time: expected score 2/${k} − 1 = ${dec(2 / k - 1, 2)}`]], explain: `Expected score of answering: 2 × 1/${k} − 1 = ${dec(2 / k - 1, 2)} < 0.` }); } },
      principle: mc({ q: 'Which idea carried over from Shapeshift to the multiple-choice skip?', right: 'a guess is worth only its chance of being right', at: 2,
        wrong: [['a fast answer always beats a slow correct one', 'speed earns nothing in either score'], ['errors average out, so guess whenever unsure', 'a guess costs its chance of being wrong, every time'], ['wait until the last moment before every answer', 'waiting past the deadline is a miss; the point is to answer once you know']],
        explain: 'In both, an answer you cannot back is scored by its chance of being right, and speed alone earns nothing.' }),
    },
    { type: 'check', scope: 'the contrast table and the edge case', questions: [
      mc({ q: 'You looked away and never saw the shape. 1.2 s have passed since the flash. Best action?', right: 'press either arrow now', at: 1, wrong: [['press nothing', 'a miss is certainly wrong; a guess is right half the time'], ['wait for the next shape and answer it twice', 'extra presses are early presses, not answers']], explain: 'With 0.3 s of window left, a guess scores 1/2 on average against 0 for a miss.' }),
    ] },

    sec('tryit'),
    { type: 'tryit', game: 'shapeshift' },
  ],
};
