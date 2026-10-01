// Zap-N game lesson: Figure It Out (deduction under per-property feedback). Property lists, round
// sizes, feedback and the optimum come from src/zapn/figureitout/engine.js; probabilities are exact.
import { Q, sumQ } from '../../../core/rational.js';
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { PROPS, ROUNDS, optimum, feedback, possible } from '../../../zapn/figureitout/engine.js';
import { sec, mc, dec } from './balloon.js';

const TARGET = ZAPN_TARGETS.figureitout.value;
const R1 = ROUNDS[0];
const name = (k, v) => PROPS[k].values[v];
const figText = (code) => code.map((v, k) => name(k, v)).join(', ');
const marksOf = (code, hidden) => code.map((_, k) => !!((feedback(code, hidden) >> k) & 1));
const markText = (code, hidden) => marksOf(code, hidden).map((ok, k) => `${PROPS[k].key} ${ok ? '✓' : '✗'}`).join(', ');
const withFb = (gs, hidden) => gs.map((code) => ({ code, fb: feedback(code, hidden) }));
// P(done within m guesses) under the optimal strategy, exact.
const doneBy = (V, m) => V.reduce((p, n) => p.mul(Q.of(Math.min(m, n), n)), Q.of(1));
const expectedQ = (V) => sumQ(Array.from({ length: Math.max(...V) }, (_, m) => Q.of(1).sub(doneBy(V, m))));
const OPT1 = optimum(R1);
const gu = (m) => `${m} guess${m === 1 ? '' : 'es'}`;
// The optimal strategy, trying untried values in index order.
function playOptimal(V, hidden) {
  const gs = [];
  for (;;) {
    const poss = possible(V, withFb(gs, hidden));
    const g = poss.map((vs) => vs[0]);
    gs.push(g);
    if (feedback(g, hidden) === (1 << V.length) - 1) return gs;
  }
}
// One-property-at-a-time play: change only the first wrong property each guess.
function playOneAtATime(V, hidden) {
  const gs = [V.map(() => 0)];
  while (feedback(gs[gs.length - 1], hidden) !== (1 << V.length) - 1) {
    const last = gs[gs.length - 1], m = marksOf(last, hidden), k = m.indexOf(false);
    gs.push(last.map((v, j) => (j === k ? v + 1 : v)));
  }
  return gs;
}
const HID = [2, 0, 1];
const PIC = playOptimal(R1, HID);
const BAD = playOneAtATime(R1, HID);
const W = { V: ROUNDS[1], hidden: [2, 0, 1, 2] };
W.gs = playOptimal(W.V, W.hidden);

const randState = (rng) => {
  const V = rng.pick(ROUNDS.slice(0, 3)), hidden = V.map((n) => rng.int(0, n - 1));
  const all = playOptimal(V, hidden.map((h) => h));
  const g = all.slice(0, Math.max(1, Math.min(all.length - 1, rng.int(1, 2))));
  return { V, hidden, g };
};
const historyText = (s) => s.g.map((c, i) => `guess ${i + 1}: ${figText(c)} (${markText(c, s.hidden)})`).join('; ');
const remainingQ = (rng) => {
  for (;;) {
    const s = randState(rng);
    const poss = possible(s.V, withFb(s.g, s.hidden));
    const k = poss.findIndex((vs) => vs.length > 1);
    if (k < 0) continue;
    return { type: 'number', q: `The ${PROPS[k].key} has ${s.V[k]} possible values. After ${historyText(s)}, how many ${PROPS[k].key} values are still possible?`, answer: poss[k].length, hints: ['A ✓ fixes the value; a ✗ removes only the value you tried.', `Count the ${PROPS[k].key} values not yet marked wrong.`], explain: `${s.V[k]} minus the ${s.V[k] - poss[k].length} tried and marked wrong: ${poss[k].map((v) => name(k, v)).join(', ')}.` };
  }
};
const nextGuessQ = (rng) => {
  for (;;) {
    const s = randState(rng);
    const poss = possible(s.V, withFb(s.g, s.hidden));
    const last = s.g[s.g.length - 1], m = marksOf(last, s.hidden);
    const wrongK = m.map((ok, k) => (ok ? -1 : k)).filter((k) => k >= 0), rightK = m.map((ok, k) => (ok ? k : -1)).filter((k) => k >= 0);
    if (wrongK.length < 2 || !rightK.length || wrongK.some((k) => poss[k].length < 2)) continue;
    const best = poss.map((vs) => vs[0]);
    const oneOnly = last.map((v, k) => (k === wrongK[0] ? poss[k][0] : v));
    const touchRight = best.map((v, k) => (k === rightK[0] ? (v + 1) % s.V[k] : v));
    const tried = s.g.flatMap((c) => c.filter((_, k) => k === wrongK[1]).map((v) => v)).find((v) => v !== s.hidden[wrongK[1]]);
    const retry = best.map((v, k) => (k === wrongK[1] ? tried : v));
    return mc({ q: `${s.V.map((n, k) => `${PROPS[k].key} (${n})`).join(', ')}. So far: ${historyText(s)}. Which next guess is best?`, right: figText(best),
      wrong: [[figText(oneOnly), 'changed only one wrong property: every property can be tested on every guess'], [figText(touchRight), `changed ${PROPS[rightK[0]].key}, which is already marked right`], [figText(retry), `retried ${name(wrongK[1], tried)}, already marked wrong`]],
      explain: `Keep every ✓, change every ✗ to an untried value: ${figText(best)}.` }, rng);
  }
};

export default {
  id: 'zapn/figureitout',
  book: 'zapn',
  kind: 'game',
  game: 'figureitout',
  title: 'Figure It Out: test every property on every guess',
  summary: 'Keep every right value, change every wrong one to an untried value: the round then lasts as long as the property with the most values.',
  prerequisites: ['prob/independence', 'prob/expectation-linearity'],
  objectives: [
    'Play the optimal strategy: keep rights, change every wrong property to an untried value',
    'Track how many values are still possible for each property after any guesses',
    'Compute the worst case (the largest value count) and the expected guesses of the optimal strategy',
    `Hit the target: on average at most ${TARGET} guess above the optimum per round`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. A hidden figure has a ${PROPS[0].key} (${R1[0]} options), a ${PROPS[1].key} (${R1[1]}) and a ${PROPS[2].key} (${R1[2]}). Each guess names one value for every property, and you are told which properties are right. What strategy finishes fastest? Worst-case number of guesses? Average?`, answer: `Worst case ${OPT1.worst}, average ${dec(OPT1.expected, 2)} guesses.`, explain: `Change every wrong property on every guess. Each property is then its own small search, and the round ends when the slowest one is found: never later than guess ${OPT1.worst}. If you planned to change one property at a time, the lesson counts what that costs.`,
      attempts: [
        { id: 'oneatatime', label: 'Change one property per guess', approach: 'Varied one property at a time, like a controlled experiment.', breaksAt: 'The marks already name each right property, so changing one wastes the feedback on the others.' },
        { id: 'average', label: 'Average of the biggest property', approach: `Expected (${R1[0]} + 1)/2 = ${(R1[0] + 1) / 2} guesses, from the property with the most values.`, breaksAt: 'The round waits for the slowest of several properties, and that maximum averages more.' },
        { id: 'total', label: 'Count every possible figure', approach: `Counted ${R1.join(' × ')} = ${R1.reduce((a, b) => a * b, 1)} figures and feared that many guesses.`, breaksAt: 'Per-property marks let the properties be searched in parallel, so the worst case is the largest single count.' },
      ] },
    { type: 'text', text: 'Figure It Out is the deduction game of Zap-N. A hidden figure has one value for each property: shape, colour, fill, and in later rounds size, count and border. You build a guess by picking a value for every property; the feedback marks **each property** right or wrong. The round ends when every property is right.' },
    { type: 'text', text: `${ROUNDS.length} rounds, from ${ROUNDS[0].length} properties to ${ROUNDS[ROUNDS.length - 1].length}. The score is guesses above the optimum (the expected count of a perfect strategy: ${dec(OPT1.expected, 2)} in round 1), averaged over rounds. Target: at most ${TARGET} above. Time is recorded but the guess count is what matters.` },
    { type: 'check', scope: 'what the feedback says', questions: [
      mc({ q: 'Guess: circle, blue, solid. Feedback: shape ✗, colour ✓, fill ✗. What do you know?', right: 'colour is blue; shape is not circle; fill is not solid', at: 1,
        wrong: [['only that one property is right', 'the feedback names which one: colour'], ['shape and fill are both wrong, so try circle again with another colour', 'circle is already ruled out, and blue is already known'], ['nothing until all three are right', 'every mark is certain information']],
        explain: 'Per-property feedback: a ✓ fixes that value, a ✗ removes the value you tried.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Good traders extract all the information a market signal carries before acting again. Figure It Out measures whether every guess uses all the feedback it can get, instead of testing one idea at a time like a slow, controlled experiment. The optimum is known exactly, so every wasted guess shows up in the score.' },

    sec('anchor'),
    { type: 'text', text: 'You know Mastermind: guess a code, get told how many pegs are right. Figure It Out is Mastermind with **one change**: you are told **which** properties are right. That change splits the puzzle into independent small puzzles, one per property, that share a single submit button. A count of right pegs forces you to work out which ones they were; here the game tells you, so no guess ever has to be spent finding out.' },
    { type: 'check', scope: 'separate puzzles, one button', questions: [
      mc({ q: 'Shape was marked ✗ on circle. What does that tell you about colour?', right: 'nothing', at: 0, wrong: [['colour is probably right', 'marks on one property say nothing about another'], ['colour is probably wrong', 'marks on one property say nothing about another']], explain: 'Each mark is about its own property only.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Round 1 played optimally: every guess keeps each ✓ and moves each ✗ to a value not yet tried.' },
    { type: 'diagram', diagram: 'zapn-figure', spec: { values: R1, hidden: HID, guesses: PIC.map((code) => ({ code, marks: marksOf(code, HID) })), remaining: possible(R1, withFb(PIC, HID)), stated: { expected: OPT1.expected, worst: OPT1.worst } }, caption: `Solved in ${PIC.length} guesses. ${PROPS[1].key[0].toUpperCase() + PROPS[1].key.slice(1)} was right at once and never touched again; ${PROPS[0].key} needed ${HID[0] + 1} tries, so it set the length of the round.` },
    { type: 'check', scope: 'tracking what is still possible', questions: [{ make: remainingQ }] },
    { type: 'diagram', diagram: 'zapn-figure', spec: { values: R1, hidden: HID, guesses: BAD.map((code) => ({ code, marks: marksOf(code, HID) })) }, caption: `The same hidden figure, changing one property at a time: ${BAD.length} guesses instead of ${PIC.length}. Each guess wastes the feedback on every property it did not change.` },
    { type: 'check', scope: 'all at once versus one at a time', questions: [{ make: nextGuessQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { answers: 'oneatatime', say: 'Feedback on property k says nothing about the others, so each property is its own search running in parallel.', why: 'The hidden values are drawn separately, and each mark is about one property only.',
        checks: [mc({ q: 'Round 1 has 4 shapes, 4 colours, 3 fills. If you test all three every guess, which property can take longest?', right: 'shape or colour (4 values each)', at: 0, wrong: [['fill (3 values, the fewest)', 'fill has the fewest values, so it is found soonest at worst'], ['all three take equally long', 'a property with more values can need more guesses']], explain: 'A property with n values is found by guess n at the latest.' })] },
      { say: 'One property with n values, trying an untried value each guess: you hit it on guess U, equally likely to be 1, 2, ..., n. So P(found within m guesses) = m/n.', why: 'The hidden value is equally likely to be any of the n, and you reach them one per guess in a fixed order.',
        checks: [{ make: (rng) => { const n = rng.int(3, 5), m = rng.int(1, n - 1); return { type: 'number', q: `A property has ${n} values. Probability it is found within ${gu(m)}? (fraction or decimal)`, answer: m / n, tolerance: 0.001, explain: `By then you have tried ${m} of the ${n} equally likely values: ${m}/${n}.` }; } }] },
      { say: 'The round ends when every property is found: P(done within m) = product over properties of min(m, n)/n.', why: 'The properties are independent, so the chances multiply; a property with n ≤ m is surely found (min(m, n)/n = 1).',
        checks: [{ make: (rng) => { const V = rng.pick(ROUNDS.slice(0, 3)), m = rng.int(1, Math.max(...V) - 1); return { type: 'number', q: `Values per property ${V.join(', ')}. Probability the round is done within ${gu(m)}? (fraction or decimal)`, answer: doneBy(V, m).toNumber(), tolerance: 0.001, hints: [`Each property: min(${m}, n)/n.`, `Multiply: ${V.map((n) => `${Math.min(m, n)}/${n}`).join(' × ')}.`], explain: `${V.map((n) => `${Math.min(m, n)}/${n}`).join(' × ')} = ${doneBy(V, m)}.` }; } }] },
      { answers: 'average', say: 'Expected guesses = P(not done within 0) + P(not done within 1) + P(not done within 2) + ...', why: 'The number of guesses G equals the count of m = 0, 1, 2, ... with G > m. Each is an indicator, and linearity adds their chances.',
        checks: [{ type: 'number', q: `Round 1 (values ${R1.join(', ')}). Expected guesses of the optimal strategy? (2 decimals)`, answer: OPT1.expected, tolerance: 0.006, hints: [`P(not done within m) for m = 0, 1, 2, 3: ${Array.from({ length: OPT1.worst }, (_, m) => String(Q.of(1).sub(doneBy(R1, m)))).join(', ')}.`, 'Add them.'], explain: `${Array.from({ length: OPT1.worst }, (_, m) => String(Q.of(1).sub(doneBy(R1, m)))).join(' + ')} = ${expectedQ(R1)} = ${dec(OPT1.expected, 2)}.` }] },
      { answers: 'total', say: 'Worst case = the largest value count: the slowest property can need all its values.', why: 'With the strategy, a property with n values is found by guess n at the latest, and the others are found no later.',
        checks: [{ make: (rng) => { const k = rng.int(0, ROUNDS.length - 1); return { type: 'number', q: `Round ${k + 1} has values ${ROUNDS[k].join(', ')}. Worst-case guesses with the optimal strategy?`, answer: optimum(ROUNDS[k]).worst, explain: `The largest count: ${Math.max(...ROUNDS[k])}.` }; } }] },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Round 1: when the optimal strategy finishes`, xLabel: 'guess', yLabel: 'chance (in 48ths)', categories: Array.from({ length: OPT1.worst }, (_, m) => String(m + 1)), series: [{ name: '48ths', values: Array.from({ length: OPT1.worst }, (_, m) => doneBy(R1, m + 1).sub(doneBy(R1, m)).mul(Q.of(48)).toNumber()) }], valueLabels: true }, caption: `P(finish on guess m) = P(done within m) − P(done within m − 1). Most rounds end on guess 3 or 4; the mean is ${dec(OPT1.expected, 2)}.` },
    { type: 'check', scope: 'reading the finishing chances', questions: [
      { type: 'number', q: 'From the chart: probability that the optimal strategy needs all 4 guesses in round 1? (fraction or decimal)', answer: Q.of(1).sub(doneBy(R1, 3)).toNumber(), tolerance: 0.001, explain: `1 − P(done within 3) = 1 − ${doneBy(R1, 3)} = ${Q.of(1).sub(doneBy(R1, 3))}.` },
    ] },
    { type: 'explain', prompt: 'Why does the optimal strategy last exactly as long as the slowest property, and why is its average above (n + 1)/2 for the biggest property?', model: 'Each guess tests every unsolved property at once, so all the small searches run in parallel and the round ends when the last one hits. The last one is the maximum of several independent finishing guesses, and a maximum is at least as large as any one of them, so its average sits above the average of the biggest property alone.', points: ['All properties are tested on every guess, in parallel', 'The round ends at the maximum of the properties’ finishing guesses', 'The maximum of several random finishing times averages more than any single one'] },

    sec('worked'),
    { type: 'text', text: `A round-2 state (values ${W.V.join(', ')}). The hidden figure is shown so you can check each mark.` },
    { type: 'diagram', diagram: 'zapn-figure', spec: { values: W.V, hidden: W.hidden, guesses: W.gs.map((code) => ({ code, marks: marksOf(code, W.hidden) })), remaining: possible(W.V, withFb(W.gs, W.hidden)), stated: { expected: optimum(W.V).expected, worst: optimum(W.V).worst } }, caption: `Solved in ${W.gs.length} guesses against an optimum of ${dec(optimum(W.V).expected, 2)} on average.` },
    { type: 'steps', steps: [
      { say: `Guess 1: ${figText(W.gs[0])}. Feedback: ${markText(W.gs[0], W.hidden)}.`, why: 'Any first guess is as good as any other: every value is equally likely.',
        checks: [{ type: 'number', q: `After guess 1, how many ${PROPS[0].key} values are still possible?`, answer: possible(W.V, withFb(W.gs.slice(0, 1), W.hidden))[0].length, explain: `${W.V[0]} − 1 tried = ${possible(W.V, withFb(W.gs.slice(0, 1), W.hidden))[0].length}.` }] },
      { say: `Guess 2: keep ${PROPS[1].key}, change the other three to untried values: ${figText(W.gs[1])}. Feedback: ${markText(W.gs[1], W.hidden)}.`, why: 'Three searches advance at once; the ✓ is never touched.',
        checks: [mc({ q: 'Before guess 3, which properties still need testing?', right: `${marksOf(W.gs[1], W.hidden).map((ok, k) => (ok ? null : PROPS[k].key)).filter(Boolean).join(' and ')}`, at: 0, wrong: [['all four', 'right marks are certain and stay'], [PROPS[1].key, `${PROPS[1].key} was right from guess 1`]], explain: 'Only the ✗ properties move.' })] },
      { say: `Guess 3: ${figText(W.gs[2])}. All right: ${W.gs.length} guesses.`, why: `The slowest property here was ${PROPS[0].key}, whose hidden value was the third one tried.`,
        checks: [{ type: 'number', q: `How many guesses above the optimum (${dec(optimum(W.V).expected, 2)}) is this round? (2 decimals, negative if below)`, answer: W.gs.length - optimum(W.V).expected, tolerance: 0.006, explain: `${W.gs.length} − ${dec(optimum(W.V).expected, 2)} = ${dec(W.gs.length - optimum(W.V).expected, 2)}: luck can put a round below the average optimum.` }] },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Three properties with 5, 3 and 2 values. Worst-case guesses with the optimal strategy, and which property decides it?', answer: `${optimum([5, 3, 2]).worst}, decided by the property with 5 values. Average ${dec(optimum([5, 3, 2]).expected, 2)}.`, explain: 'The round lasts as long as the slowest property; the 3- and 2-value properties are always done by then.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Change one property at a time to see what made the difference.', fix: 'The feedback already says which property is right. Change every wrong one every guess.' },
      { belief: 'A right mark might be a fluke; test it again.', fix: 'A ✓ is certain. Changing it guarantees the next guess cannot finish the round.' },
      { belief: 'Retrying a value is harmless.', fix: 'A value marked wrong is wrong forever; retrying it wastes a guess.' },
      { belief: 'The round length depends on how many figures are possible in total.', fix: 'It depends on the largest single value count, because properties are searched in parallel.' },
      { belief: 'Average guesses = (n + 1)/2 for the largest property.', fix: `The round waits for the slowest of several properties: ${dec(OPT1.expected, 2)} in round 1, not 2.5.` },
    ] },
    { type: 'erroneous', problem: `A candidate estimates the average guesses for round 1 (values ${R1.join(', ')}). One step is wrong.`, steps: [
      'Each property is its own search, run in parallel.',
      'The round ends when the slowest property is found.',
      'The slowest property has 4 values and is found on average at guess (4 + 1)/2 = 2.5.',
      'So the round averages 2.5 guesses.',
    ], errorStep: 2, explain: `The round ends at the maximum of the finishing guesses of all properties, not at the average of one of them. Two properties have 4 values and a third has 3; their maximum averages ${dec(OPT1.expected, 2)}.` },
    { type: 'check', scope: 'choosing the next guess', questions: [{ make: nextGuessQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Before each submit, say the count left per property ("shape 2, colour done, fill 1"). A property with one value left is not a guess: set it and move on.' },
    { type: 'callout', tone: 'speed', text: `Keyboard: up and down pick the property, left and right change its value, Enter submits. Set every ✗ property to its next untried value in one pass, top to bottom. You go above the optimum only by retrying a wrong value or leaving a ✗ property unchanged.` },
    { type: 'thinkaloud', problem: `Round 3 (values ${ROUNDS[2].join(', ')}). Guess 1 was circle, blue, solid, small: shape ✗, colour ✗, fill ✓, size ✗.`, lines: [
      { t: 0, say: 'Fill is solid: lock it. Shape, colour and size are wrong.' },
      { t: 3, say: `Counts left: shape ${ROUNDS[2][0] - 1}, colour ${ROUNDS[2][1] - 1}, size ${ROUNDS[2][3] - 1}. Worst case for this round is ${optimum(ROUNDS[2]).worst} guesses.` },
      { t: 5, say: 'Change only the shape this time, to see what that does.', slip: true },
      { t: 7, say: 'No: the marks already say which properties are wrong. Change all three wrong ones at once.' },
      { t: 9, say: 'Next untried in each: square, orange, medium. Fill stays solid.' },
      { t: 12, say: 'Check before Enter: no ✓ touched, no ✗ value repeated. Submit square, orange, solid, medium.' },
    ] },
    { type: 'check', scope: 'counting what is left', questions: [{ make: remainingQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Figure It Out: keep every ✓, move every ✗ to an untried value, every guess. The round lasts as long as the property with the most values.' },

    sec('contrast'),
    { type: 'compare', columns: ['Game', 'Feedback', 'Best strategy'], rows: [
      ['Figure It Out', 'which properties are right', 'test every property every guess; worst case = largest value count'],
      ['Mastermind', 'only how many are right', 'pick guesses that split the remaining codes most evenly'],
      ['CodeCompare', 'none: all candidates visible', 'eliminate the ones that differ'],
    ] },
    { type: 'variation', base: `Round 1: values ${R1.join(', ')}, per-property feedback. Worst case ${OPT1.worst}, average ${dec(OPT1.expected, 2)}.`, rows: [
      { change: `Add a fourth property with 3 values (${ROUNDS[1].join(', ')})`, effect: `Worst case still ${optimum(ROUNDS[1]).worst}; the average rises only to ${dec(optimum(ROUNDS[1]).expected, 2)}, because the new property runs in parallel.` },
      { change: 'Shape gets a 5th value (5, 4, 3)', effect: `Worst case ${optimum([5, 4, 3]).worst}, average ${dec(optimum([5, 4, 3]).expected, 2)}: the largest count sets the pace.` },
      { same: true, change: 'The properties are listed in a different order', effect: 'Nothing changes: the strategy treats every property the same way.' },
      { fusion: true, change: 'Shape gets a 5th value and a 3-value property is added (5, 4, 3, 3)', effect: `Worst case ${optimum([5, 4, 3, 3]).worst}, set by the new largest count; the extra property only nudges the average to ${dec(optimum([5, 4, 3, 3]).expected, 2)}.` },
      { change: 'Feedback says only how many properties are right', effect: 'The properties are no longer separate puzzles; you must choose guesses that split the possibilities, and rounds take longer.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: when a property has one value left, it is certain but still has to be submitted. A lucky first guess can finish below the optimum; the optimum is an average, so luck evens out over the five rounds.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: run independent searches in parallel and the total time is the slowest one, not the sum. Elimination (keep only what is still possible) is also how CodeCompare and multiple-choice questions are won.' },
    { type: 'transfer',
      near: { make: nextGuessQ },
      far: { make: (rng) => { const f = [rng.int(2, 6), rng.int(2, 6), rng.int(2, 6)]; return { type: 'number', q: `Three independent services are broken. Each build tries one candidate fix per service at once and reports which services now pass. The services have ${f.join(', ')} candidate fixes, exactly one right each. Worst-case number of builds?`, answer: Math.max(...f), hints: ['Each build tests every broken service at once.', 'The last service to be fixed decides.'], explain: `The services are fixed in parallel; the one with ${Math.max(...f)} candidates can need ${Math.max(...f)} builds.` }; } },
      principle: mc({ q: 'Which idea carried over from Figure It Out to the builds?', right: 'independent searches in parallel take as long as the slowest one', at: 1,
        wrong: [['the total time is the sum of all the separate searches', 'that is testing one thing at a time'], ['the total time is the product of all the value counts', 'that counts every combination, which per-part feedback never needs'], ['the total time is the average of the separate searches', 'the slowest search, not the average one, decides when all are done']],
        explain: 'Per-part feedback lets every part be searched at once, so the slowest part sets the pace.' }),
    },
    { type: 'check', scope: 'the variation rows', questions: [
      { make: (rng) => { const V = [rng.int(3, 5), rng.int(2, 4), rng.int(2, 3)]; return mc({ q: `Values ${V.join(', ')}. Worst-case guesses with the optimal strategy?`, right: String(Math.max(...V)), wrong: [[String(V.reduce((a, b) => a + b, 0) - V.length + 1), 'added the properties as if tested one at a time'], [String(V.reduce((a, b) => a * b, 1)), 'counted every possible figure'], [String(Math.min(...V)), 'took the smallest property']], explain: `The largest value count: ${Math.max(...V)}.` }, rng); } },
    ] },

    sec('tryit'),
    { type: 'tryit', game: 'figureitout' },
  ],
};
