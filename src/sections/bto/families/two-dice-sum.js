// Reference family: every other family copies this shape.
//   generate(rng, {difficulty}) -> item satisfying src/core/contract.js
//   verify(item)                -> recomputes the answer by a different method
//   lesson                      -> the Learn-mode card (learner-profile cycle)
import { buildMcq } from '../../../core/options.js';
import { fmtP } from '../../../core/format.js';
import { Q } from '../../../core/rational.js';
import { askFrom, diceGrid, withMath } from '../lib.js';

const ways = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7)); // ordered pairs summing to s

const EVENTS = [
  // difficulty 1: a single sum or a pair of sums
  (rng) => { const s = rng.int(2, 12); return { text: `the sum is exactly ${s}`, sums: [s], kind: 'eq' }; },
  (rng) => { const s = rng.int(2, 11); return { text: `the sum is ${s} or ${s + 1}`, sums: [s, s + 1], kind: 'set' }; },
  // difficulty 2: thresholds, where "at least" vs "more than" is the classic slip
  (rng) => { const k = rng.int(4, 11); return { text: `the sum is at least ${k}`, sums: range(k, 12), kind: 'atLeast', k }; },
  (rng) => { const k = rng.int(3, 10); return { text: `the sum is at most ${k}`, sums: range(2, k), kind: 'atMost', k }; },
  (rng) => { const odd = rng.chance(0.5); return { text: `the sum is ${odd ? 'odd' : 'even'}`, sums: range(2, 12).filter((s) => s % 2 === (odd ? 1 : 0)), kind: 'parity' }; },
  (rng) => { const m = rng.pick([3, 4, 5]); return { text: `the sum is divisible by ${m}`, sums: range(2, 12).filter((s) => s % m === 0), kind: 'set' }; },
];

function range(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; }

export default {
  id: 'two-dice-sum',
  section: 'bto',
  title: 'Two dice: sum events',
  skill: 'Count equally likely ordered pairs (36), not sums (11) or unordered pairs (21)',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const ev = (difficulty === 1 ? rng.pick(EVENTS.slice(0, 2)) : rng.pick(EVENTS.slice(2)))(rng);
    const count = ev.sums.reduce((n, s) => n + ways(s), 0);
    const exact = Q.of(count, 36);
    const p = exact.toNumber();
    const unordered = ev.sums.reduce((n, s) => n + Math.ceil(ways(s) / 2), 0); // {a,b} with a<=b
    const distractors = [
      { value: ev.sums.length / 11, misconception: 'Treated the 11 possible sums (2 to 12) as equally likely. They are not: 7 has six pairs, 2 has one.' },
      { value: unordered / 21, misconception: 'Counted unordered pairs {a,b} as the 21 equally likely outcomes. (1,2) and (2,1) are different outcomes, so there are 36.' },
      { value: unordered / 36, misconception: 'Counted each unordered pair once over 36, missing that (a,b) and (b,a) both occur when a is not b.' },
      { value: 1 - p, misconception: 'Answered the complement: this is the probability the event does NOT happen.' },
    ];
    if (ev.kind === 'atLeast') distractors.push({ value: range(ev.k + 1, 12).reduce((n, s) => n + ways(s), 0) / 36, misconception: `Read "at least ${ev.k}" as "more than ${ev.k}" and dropped the sum ${ev.k} itself.` });
    if (ev.kind === 'atMost') distractors.push({ value: range(2, ev.k - 1).reduce((n, s) => n + ways(s), 0) / 36, misconception: `Read "at most ${ev.k}" as "less than ${ev.k}" and dropped the sum ${ev.k} itself.` });
    const mcq = buildMcq(rng, { correct: p, distractors, format: fmtP });
    const tally = ev.sums.filter((s) => ways(s) > 0).map((s) => `${s}: ${ways(s)}`).join(', ');
    return {
      id: `bto:two-dice-sum:${rng.seed}`,
      section: 'bto',
      family: 'two-dice-sum',
      difficulty,
      kind: 'mcq',
      prompt: { text: `You throw two fair six-sided dice. What is the probability that ${ev.text}?` },
      ...mcq,
      answer: { value: p, exact: exact.toString() },
      solution: {
        ask: askFrom(`What is the probability that ${ev.text}?`),
        picture: diceGrid((a, b) => ev.sums.includes(a + b), `Rows are the first die, columns the second. Each sum is one anti-diagonal; the ${count} shaded cells are the pairs where ${ev.text}.`, { cellText: [1, 2, 3, 4, 5, 6].map((a) => [1, 2, 3, 4, 5, 6].map((b) => String(a + b))) }),
        fast: count > 18 ? `Count the complement: ${36 - count} pairs, so ${count}/36 = ${exact.toString()}.` : `Ordered pairs per sum, 6 − |s − 7|: ${tally}. Total ${count}/36 = ${exact.toString()}.`,
        check: `Mirror check: sums s and 14 − s have the same count, and the counts over 2 to 12 add to 36. ${count}/36 ${count === 18 ? 'is exactly 1/2' : count > 18 ? 'is above 1/2' : 'is below 1/2'}.`,
        steps: withMath([
          { say: 'The sample space is 6 × 6 = 36 ordered pairs, all equally likely.', why: 'Each die is independent and fair, so every (first, second) pair has probability 1/36.' },
          { say: `Ordered pairs per qualifying sum: ${tally}.`, why: 'A sum s between 2 and 12 is made by 6 − |s − 7| ordered pairs; 7 is the peak with 6.' },
          { say: `Total favourable pairs = ${count}, so P = ${count}/36 = ${exact.toString()} ≈ ${fmtP(p)}.`, why: 'Equally likely outcomes: probability = favourable / total.' },
        ]),
        rule: 'Two dice → 36 ordered pairs; ways(s) = 6 − |s − 7|.',
        anchor: 'Counting favourable over total, the same as a single die but with 36 outcomes instead of 6.',
      },
      hints: [
        'How many equally likely outcomes are there when you care which die shows what?',
        'List the sums that qualify, then count ordered pairs for each: the count peaks at 7.',
        `Favourable ordered pairs: ${count}.`,
      ],
      // Structured inputs: the event is "sum of two fair six-sided dice lies in sums".
      params: { family: 'two-dice-sum', dice: 2, sides: 6, sums: ev.sums },
    };
  },

  // Independent check: brute-force the 36 outcomes by re-reading the event from the prompt.
  verify(item) {
    const text = item.prompt.text;
    const test = parseEvent(text);
    if (!test) return { ok: false, detail: `could not parse event: ${text}` };
    let hits = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (test(a + b)) hits++;
    const expected = hits / 36;
    const ok = Math.abs(expected - item.answer.value) < 1e-12 && item.options[item.answerIndex].value === item.answer.value;
    return { ok, detail: `enumerated ${expected}, item says ${item.answer.value}` };
  },

  lesson: {
    purpose: 'Most dice questions are counting questions in disguise. Counting the right outcomes is the whole game, and the classic trap is counting the wrong kind of outcome.',
    anchor: 'One die: 6 equally likely faces, P = favourable/6. Two dice are the same idea with one change: the outcomes are ordered pairs, 36 of them.',
    steps: [
      { say: 'Write outcomes as (first die, second die).', why: 'Pairs like (1,2) and (2,1) are physically different rolls, so they must be counted separately to keep outcomes equally likely.' },
      { say: 'Count ordered pairs per sum: 2 → 1, 3 → 2, …, 7 → 6, …, 12 → 1.', why: 'For sum s the first die can be any value that leaves a legal second die; there are 6 − |s − 7| such values.' },
      { say: 'Add the counts for the sums in the event and divide by 36.', why: 'Disjoint sums add; equally likely outcomes turn counts into probabilities.' },
    ],
    predict: { question: 'Before computing: is P(sum = 7) bigger or smaller than P(sum is 2 or 12)? By how many times?', answer: 'Bigger, three times: 6/36 against 2/36.' },
    rule: 'Two dice → 36 ordered pairs; ways(s) = 6 − |s − 7|.',
    contrast: 'Sums are not equally likely (that gives 1/11 per sum), and unordered pairs are not equally likely either (21 of them, but doubles are half as likely as mixed pairs).',
  },
};

function parseEvent(text) {
  let m;
  if ((m = text.match(/sum is exactly (\d+)/))) return (s) => s === +m[1];
  if ((m = text.match(/sum is (\d+) or (\d+)/))) return (s) => s === +m[1] || s === +m[2];
  if ((m = text.match(/sum is at least (\d+)/))) return (s) => s >= +m[1];
  if ((m = text.match(/sum is at most (\d+)/))) return (s) => s <= +m[1];
  if ((m = text.match(/sum is (odd|even)/))) return (s) => s % 2 === (m[1] === 'odd' ? 1 : 0);
  if ((m = text.match(/divisible by (\d+)/))) return (s) => s % +m[1] === 0;
  return null;
}
