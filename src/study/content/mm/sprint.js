// 80-in-8 opening lesson: the format, why accuracy beats reach under −1 scoring, what to do when
// stuck with no skip button, the pace checkpoints, and the method ladder the family lessons teach.
import { sec, mc, N, check, MM, PACE } from './shared.js';

const E = MM.exam, T = MM.target.value, MIN = E.totalSeconds / 60;
const net = (answered, wrong) => answered - 2 * wrong;
const CHECKPOINTS = [1, 2, 3].map((k) => ({ min: (k * MIN) / 4, q: (k * E.count) / 4 }));

const pool = [
  // 0 the format
  (rng) => { const k = rng.pick([1, 2, 3, 4]); return N(`${E.count} questions in ${MIN} minutes. At an even pace, how many questions should be done after ${k * 2} minutes?`, (E.count / MIN) * k * 2, `${E.count} ÷ ${MIN} = ${E.count / MIN} a minute, so ${(E.count / MIN) * k * 2} after ${k * 2} minutes: one every ${PACE} seconds.`); },
  // 1 net score
  (rng) => { const a = rng.int(50, 78), w = rng.int(0, 9); return N(`You answer ${a} questions and ${w} of them are wrong. What is your net score?`, net(a, w), `${a - w} right (+${a - w}) and ${w} wrong (−${w}): ${a - w} − ${w} = ${net(a, w)}.`); },
  // 2 accuracy against reach
  (rng) => { const a = rng.int(50, 60), extra = rng.int(5, 10), w = rng.int(Math.ceil(extra / 2) + 1, extra); return mc({ q: `Which run scores more: ${a} answered with 0 wrong, or ${a + extra} answered with ${w} wrong?`, right: `${a} with 0 wrong (${net(a, 0)} vs ${net(a + extra, w)})`, wrong: [[`${a + extra} with ${w} wrong (${net(a + extra, w)} vs ${net(a, 0)})`, 'each wrong answer costs two points against a right one: the lost +1 and the −1'], ['They score the same', `${net(a, 0)} and ${net(a + extra, w)} differ`]], explain: `Net = right − wrong. ${a} − 0 = ${net(a, 0)}; ${a + extra - w} − ${w} = ${net(a + extra, w)}.` }, rng); },
  // 3 guessing when stuck
  (rng) => { const left = rng.pick([4, 3, 2]), ev = 2 / left - 1; return { ...N(`Stuck, no skip button: you guess among ${left} remaining options at random. Expected points from the guess? (2 decimals, or a fraction)`, ev, `P(right) = 1/${left}; expected = 1/${left} − (1 − 1/${left}) = 2/${left} − 1 = ${Math.round(ev * 100) / 100}.`), tolerance: 0.006 }; },
  // 4 pace checkpoints
  (rng) => { const c = rng.pick(CHECKPOINTS), at = c.q + rng.pick([-9, -5, 4, 8]); return mc({ q: `${c.min} minutes gone, you are starting question ${at}. Against the ${PACE}-second pace you are…`, right: at > c.q ? 'ahead' : 'behind', wrong: [[at > c.q ? 'behind' : 'ahead', `the pace says question ${c.q} at ${c.min} minutes`], ['exactly on pace', `on pace is question ${c.q}`]], explain: `${c.min} minutes × ${E.count / MIN} a minute = question ${c.q}.` }, rng); },
  // 5 the two checks
  (rng) => { const a = rng.int(23, 89), b = rng.int(23, 89), c = a * b; return mc({ q: `Options for ${a} × ${b} are ${c - 10}, ${c}, ${c + 3}, ${c * 10}. Which can you rule out by the last digit alone?`, right: String(c + 3), wrong: [[String(c - 10), `ends in ${c % 10} like the true product: the last digit cannot rule it out`], [String(c * 10), 'ends in 0; it fails the size check, which is a different check']], explain: `${a % 10} × ${b % 10} ends in ${c % 10}; ${c + 3} ends in ${(c + 3) % 10}.` }, rng); },
];

export default {
  id: 'mm/sprint',
  book: 'mm',
  kind: 'strategy',
  title: 'The 80-in-8: format, scoring and pace',
  summary: `${E.count} questions, ${MIN} minutes, ${E.optionCount} options, one tap answers. Accuracy beats reach under −1 scoring; ${PACE} seconds a question; two checks before every tap.`,
  blocks: [
    sec('format', 'The format'),
    { type: 'text', text: `The 80-in-8 is a mental arithmetic test reported (QuantVault, June 2026) as a separate assessment for Quant Trader, graduate and intern trader roles. ${E.count} multiple-choice questions, ${MIN} minutes in total, ${E.optionCount} options each, no calculator. Tapping an option answers it and the next question appears: no skipping, no going back. Some candidates report a version where a skip (0 points) is allowed.` },
    check(pool, 0, 'the format'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['feature', 'value'], rows: [['questions', String(E.count)], ['time', `${MIN} minutes (${PACE} s a question)`], ['options', String(E.optionCount)], ['scoring', '+1 right, −1 wrong'], ['navigation', 'forward only, one tap answers'], ['reported pass', 'about 55 net; competitive 70+'], ['this trainer\'s target', `${T} net`]] }, caption: 'The reported format. The question shapes: direct (373 + 57 = ?) and missing number (66 × ? = 138.6), across whole numbers, decimals, fractions and percents. Division may be written ÷ or :.' },
    check(pool, 0, 'the format'),

    sec('scoring', 'The −1 rule'),
    { type: 'text', text: 'A wrong answer scores −1, so it costs two points against a right one. That is why 55 answered with 0 wrong (net 55) beats 60 answered with 5 wrong (net 50).' },
    check(pool, 1, 'net score'),
    { type: 'diagram', diagram: 'bar', spec: { title: 'Net score for four runs', xLabel: 'run', yLabel: 'net score', categories: ['55, 0 wrong', '60, 5 wrong', '70, 10 wrong', '64, 2 wrong'], series: [{ name: 'net', values: [net(55, 0), net(60, 5), net(70, 10), net(64, 2)] }], valueLabels: true }, caption: 'More answered is not more points. The 70-answer run with 10 wrong nets 50, below the careful 55. The target run, 64 answered with 2 wrong, nets 60.' },
    check(pool, 2, 'accuracy against reach'),
    { type: 'text', text: 'With no skip button you sometimes must answer a question you cannot finish. A blind guess among 4 is worth 2 × 1/4 − 1 = −0.5 on average. Rule out two options by the last digit or the size and the guess is worth 0; rule out three and it is a sure point.' },
    check(pool, 3, 'guessing when stuck'),

    sec('pace', 'Pace'),
    { type: 'text', text: `${PACE} seconds a question on average. Sums and decimals should take 3 or 4, banking time for fractions, percents and missing numbers. Check the clock at the quarter marks.` },
    check(pool, 4, 'pace'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: MIN, step: 1, marks: [...CHECKPOINTS.map((c) => ({ x: c.min, label: `Q${c.q}` })), { x: MIN, label: `Q${E.count}` }] }, caption: `Checkpoints at an even ${PACE}-second pace: question ${CHECKPOINTS.map((c) => c.q).join(', ')} at ${CHECKPOINTS.map((c) => c.min).join(', ')} minutes. Behind at a checkpoint: speed up on the easy shapes, never by guessing.` },
    check(pool, 4, 'pace'),

    sec('checks', 'Two checks before every tap'),
    { type: 'text', text: 'Wrong options are built from real slips, so they look right. Two one-second checks catch most of them: the last digit (only the units decide it) and the size (round each number and estimate).' },
    check(pool, 5, 'the two checks'),
    { type: 'compare', columns: ['Move', 'When', 'Lesson'], rows: [['Left to right, round and undo', '+ and −', 'Add and subtract'], ['×10 ÷ 2, ×100 ÷ 4, ×1000 ÷ 8, ×11', '× 5, 25, 125, 11', 'Multiply'], ['Distances from 100', 'both factors near 100', 'Multiply'], ['Bracket, then last digit', '÷ a two-digit number', 'Divide'], ['Count decimal places', 'decimals', 'Decimals'], ['Fraction-decimal table', '1/8, 3/8, 1/16, 1/7, …', 'Fractions'], ['Percent of WHICH number', '%', 'Percentages'], ['Inverse, then put it back', 'a ? on the left', 'Missing number'], ['Brackets, × ÷, + −', 'two or more signs', 'Order of operations']] },
    check(pool, 5, 'the method ladder'),

    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: `${PACE} seconds a question; accuracy before reach (each wrong costs two points against a right one); last digit and size before every tap; stuck with no skip: rule out two options, then pick.` },
    check(pool, 5, 'everything in this lesson'),

    sec('predict', 'Predict'),
    { type: 'predict', question: `You reach question 70 with 8 wrong. Do you meet the ${T}-net target?`, answer: `No: 62 right − 8 wrong = ${net(70, 8)} net. Reaching 66 with 2 wrong would give ${net(66, 2)}.`, explain: 'Speed only pays when accuracy holds: every wrong answer costs two points against a right one.' },
  ],
};
