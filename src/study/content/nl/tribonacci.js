// NumberLogic family lesson: each term is the sum of the previous three. Every number shown is computed here.
import { S, neg, seq, diffs, ratio, nextQ, pick, num, fibl, geo, round2 } from './method-ladder.js';

export const trib = (a, b, c, n) => { const o = [a, b, c]; while (o.length < n) o.push(o[o.length - 1] + o[o.length - 2] + o[o.length - 3]); return o.slice(0, n); };
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const sum3 = (xs, i) => xs[i - 3] + xs[i - 2] + xs[i - 1];

const CH = trib(2, 3, 4, 8);
const E1 = trib(2, 1, 4, 7);
const STAIRS = trib(1, 2, 4, 7);
const T2 = [E1[0] + 1, E1[1], E1[2]]; while (T2.length < 7) T2.push(T2[T2.length - 1] + T2[T2.length - 2] + T2[T2.length - 3] + 1);
const T1 = E1.slice(0, 3); while (T1.length < 7) T1.push(T1[T1.length - 1] + T1[T1.length - 2] + T1[T1.length - 3] + 1);
const E2 = trib(0, 2, 5, 7);
const E3 = trib(-2, 4, 3, 8);
const PRED = trib(1, 1, 2, 8);
const ERR = trib(1, 3, 4, 8);
const LONG = trib(1, 1, 2, 12);
const FB = fibl(2, 3, 7);
const ALL = [1, 2]; while (ALL.length < 7) ALL.push(ALL.reduce((a, b) => a + b, 0));

// Level 3 and level 4 starts, as in the generator. Some starts make six terms fit a second rule
// as well (checked with the rule finder): an evenly spaced start (1, 2, 3), a start whose third
// term is the sum of the first two (3, 2, 5), two starting terms of equal size, and 4, 3, 5.
// Those, and starts with repeated or tiny terms, are redrawn.
const twoFaced = ([a, b, c]) => b - a === c - b || c === a + b || Math.abs(a) === Math.abs(b) || `${a},${b},${c}` === '4,3,5';
function draw(rng, n, lvl = rng.pick([3, 4])) {
  for (;;) {
    const s = lvl === 3 ? [rng.int(0, 4), rng.int(1, 5), rng.int(1, 6)] : [rng.int(-4, 6), rng.int(-3, 8), rng.int(2, 10)];
    const xs = trib(...s, n);
    if (!twoFaced(s) && new Set(xs.slice(0, 5)).size === 5 && xs.slice(3).every((v) => Math.abs(v) >= 3)) return xs;
  }
}

export default {
  id: 'nl/tribonacci',
  book: 'nl',
  kind: 'family',
  family: 'tribonacci',
  title: 'Add the previous three terms',
  summary: 'Last + previous falls short, and the shortfall is the term three places back: each term is the sum of the previous three.',
  prerequisites: ['nl/method-ladder', 'nl/fibonacci-like'],
  objectives: [
    'Test the two-term sum and read its shortfall in one subtraction',
    'Recognise the shortfall as the term three places back',
    'Confirm the three-term window on two steps before answering',
    'Add the last three terms, and two steps ahead when needed',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'two-sum', label: 'Add the last two', approach: `Added the last two terms, as in the Fibonacci rule: ${CH[4]} + ${CH[5]} = ${CH[4] + CH[5]}.`, breaksAt: 'That rule falls short on every shown step.' },
      { id: 'give-up', label: 'Abandon sums', approach: 'Saw the two-term sum fail and switched to ratios and ladders.', breaksAt: 'The miss is the term three back: the sum was one term short, not wrong.' },
      { id: 'grow-window', label: 'Add everything before', approach: 'Added all the previous terms, or four of them.', breaksAt: 'The window slides and stays three terms wide.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once by adding the last two terms, once by adding the last three.`, answer: String(CH[6]), explain: `Last two: ${CH[4]} + ${CH[5]} = ${CH[4] + CH[5]}, but check that rule on a shown step: ${CH[3]} + ${CH[4]} = ${CH[3] + CH[4]}, not ${CH[5]}. Last three: ${CH[2]} + ${CH[3]} + ${CH[4]} = ${CH[5]} fits, and so does ${CH[1]} + ${CH[2]} + ${CH[3]} = ${CH[4]}. Next: ${CH[3]} + ${CH[4]} + ${CH[5]} = ${CH[6]}.` },
    { type: 'text', text: 'Each term is the **sum of the three terms before it**. The first three terms are the free start; the rule shows from the fourth term on. Growth is a little faster than in the two-term version: about 1.84 times per step.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 7))}, ?`] },
    { type: 'check', scope: 'the cue: a three-term window', questions: [
      { make: (rng) => { const t = draw(rng, 6, 3), f = fibl(rng.int(1, 5), rng.int(6, 9), 6), d = geo(rng.int(2, 5), 2, 6); return pick(rng, 'In which sequence is every term (from the fourth) the sum of the three before it?', seq(t), [[seq(f), `${f[2]} + ${f[3]} = ${f[4]} already: two terms, not three`], [seq(d), `${d[1]} + ${d[2]} + ${d[3]} is not ${d[4]}: it doubles`]], `${t[2]} + ${t[3]} + ${t[4]} = ${t[5]}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: the sum of the previous two (${seq(FB.slice(0, 6))}), or the sum of **all** previous terms, which soon just doubles (${seq(ALL)}). Also not a sum that misses by the same constant every step: that is the next lesson.` },
    { type: 'check', scope: 'the neighbouring rules', questions: [
      { type: 'choice', q: '1, 2, 3, 6, 12, 24, 48: which rule fits?', options: ['the sum of all previous terms', 'the sum of the previous three', 'the sum of the previous two'], answer: 0, traps: { 1: '3 + 6 + 12 = 21, not 24', 2: '6 + 12 = 18, not 24' }, explain: '1 + 2 + 3 + 6 + 12 = 24: every term so far, which soon just doubles.' },
    ] },

    S('why'),
    { type: 'text', text: 'Three-term sums sit in the harder middle of the test. Their trap is psychological: the two-term sum is the first thing everyone tries, it fails, and candidates abandon sums altogether. The miss is not noise. It is exactly the term three places back, which tells you the window is one term wider. That single observation turns a confusing list into three additions.' },

    S('anchor'),
    { type: 'text', text: 'In the Fibonacci lesson, next = last + second-last. This family changes **one thing**: the third-last term joins the sum. The window grows from two terms to three; the method (check the window on shown steps, then add) is the same. What is new is the diagnosis: learning to read a failed two-term test as a clue rather than a dead end.' },
    { type: 'check', scope: 'adding a three-term window', questions: [
      { make: (rng) => { const a = rng.int(5, 30), b = rng.int(10, 50), c = rng.int(20, 80); return num(`The last three terms are ${a}, ${b}, ${c}. Each term is the sum of the three before it. What comes next?`, a + b + c, `${a} + ${b} + ${c} = ${a + b + c}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Slide a window of three terms along the list. The sum of the window equals the term just after it, on every row. Try the two-term window first and it falls short on every row by a term you can see. The ratio view adds a size check: the terms grow by roughly 1.8 each step.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term n − 3', 'term n − 2', 'term n − 1', 'sum of the three', 'term n'], rows: E1.slice(3, 6).map((v, i) => [String(E1[i]), String(E1[i + 1]), String(E1[i + 2]), String(E1[i] + E1[i + 1] + E1[i + 2]), String(v)]) }, caption: `${seq(E1.slice(0, 6))}: the three-term sum matches the next term on every row. Next: ${E1[3]} + ${E1[4]} + ${E1[5]} = ${E1[6]}.` },
    { type: 'check', scope: 'the three-term window', questions: [
      { make: (rng) => { const xs = draw(rng, 7, 3); return num(nextQ(xs.slice(0, 6)), xs[6], `${xs[3]} + ${xs[4]} + ${xs[5]} = ${xs[6]}.`, ['Add the last three terms.']); } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term n − 2', 'term n − 1', 'two-term sum', 'term n', 'shortfall'], rows: E1.slice(3, 6).map((v, i) => [String(E1[i + 1]), String(E1[i + 2]), String(E1[i + 1] + E1[i + 2]), String(v), String(v - E1[i + 1] - E1[i + 2])]) }, caption: `The two-term test on the same list. The shortfall column reads ${seq(E1.slice(3, 6).map((v, i) => v - E1[i + 1] - E1[i + 2]))}: the terms ${seq(E1.slice(0, 3))} from three places back. A miss that repeats the sequence means the window is too narrow.` },
    { type: 'check', scope: 'the shortfall is the term three back', questions: [
      { make: (rng) => { const xs = draw(rng, 6); const sh = xs[5] - xs[4] - xs[3]; return num(`${seq(xs)}: by how much does ${neg(xs[3])} + ${neg(xs[4])} fall short of ${neg(xs[5])}?`, sh, `${neg(xs[5])} − (${neg(xs[3])} + ${par(xs[4])}) = ${neg(sh)}, which is the term ${neg(xs[2])} three places back.`, ['Add the two terms, then subtract from the third.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [LONG.slice(6, 11), LONG.slice(7, 11).map((v, i) => ratio(LONG[i + 6], v))] }, caption: `Ratios along a longer run: ${LONG.slice(7, 11).map((v, i) => round2(v / LONG[i + 6])).join(', ')}. They settle near 1.84, against 1.62 for the two-term sum. Growth of about 1.8 per step is a hint of a three-term window.` },
    { type: 'check', scope: 'growth near 1.84', questions: [
      { type: 'choice', q: 'Terms grow by about 1.84 per step. Which window does that point to?', options: ['three terms', 'two terms', 'one term times a constant'], answer: 0, traps: { 1: 'two-term sums grow by about 1.62', 2: 'a constant ratio would be exact' }, explain: 'About 1.84 per step is the three-term window.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Test the two-term sum on a late step: is term 6 equal to term 4 + term 5?', why: 'The two-term rule is the cheapest recurrence to test, and it must be ruled out before a wider window.',
        checks: [
          { make: (rng) => { const two = rng.chance(0.4), xs = two ? fibl(rng.int(1, 6), rng.int(7, 12), 6) : draw(rng, 6); return pick(rng, `${seq(xs)}: is ${neg(xs[5])} the sum of the two terms before it?`, two ? 'Yes' : 'No', [[two ? 'No' : 'Yes', two ? `${xs[3]} + ${xs[4]} = ${xs[5]} exactly` : `${neg(xs[3])} + ${par(xs[4])} = ${xs[3] + xs[4]}, not ${neg(xs[5])}`]], `${neg(xs[3])} + ${par(xs[4])} = ${xs[3] + xs[4]}.`); } },
        ] },
      { answers: 'two-sum', say: 'Measure the shortfall: term − (sum of the two before it).', why: 'A failed rule is information. The size of the miss tells you what is missing from the rule.',
        checks: [
          { make: (rng) => { const xs = draw(rng, 6); const sh = xs[4] - xs[3] - xs[2]; return num(`${seq(xs)}: what is ${neg(xs[4])} − (${neg(xs[2])} + ${par(xs[3])})?`, sh, `${neg(xs[4])} − ${par(xs[2] + xs[3])} = ${neg(sh)}.`); } },
        ] },
      { answers: 'give-up', say: 'Compare the shortfall with the earlier terms. If it equals the term three places back, a third term belongs in the sum.', why: 'a(n) − (a(n − 1) + a(n − 2)) = a(n − 3) is the same statement as a(n) = a(n − 1) + a(n − 2) + a(n − 3).',
        checks: [
          { make: (rng) => { const xs = draw(rng, 6), sh = xs[5] - xs[4] - xs[3]; return pick(rng, `In ${seq(xs)}, ${neg(xs[5])} − (${neg(xs[3])} + ${par(xs[4])}) = ${neg(sh)}. Which term is that?`, `term 3 (${neg(xs[2])})`, [[`term 4 (${neg(xs[3])})`, 'that is two places back; it is already in the two-term sum'], [`term 1 (${neg(xs[0])})`, 'that is five places back'], ['none: the rule is not a sum', 'the shortfall matches an earlier term exactly']], `The shortfall equals term 3, three places before term 6.`); } },
        ] },
      { say: 'Confirm the three-term sum on a second step.', why: 'One matching window can be luck, especially near a small start. Two matches make the rule safe.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5); const xs = draw(rng, 6); if (!yes) xs[5] += rng.pick([1, 2, -1]); return pick(rng, `Is every term of ${seq(xs)} from the fourth on the sum of the three before it?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every window matches; recheck the additions' : `${neg(xs[2])} + ${par(xs[3])} + ${par(xs[4])} = ${sum3(xs, 5)}, not ${neg(xs[5])}: check every window`]], `Windows: ${xs.slice(3).map((v, i) => `${sum3(xs, i + 3)} vs ${neg(v)}`).join('; ')}.`); } },
        ] },
      { answers: 'grow-window', say: 'Next = the sum of the last three terms.', why: 'The window slides one step: drop the oldest term, include the newest.',
        checks: [
          { make: (rng) => { const lvl = rng.pick([3, 4]), n = lvl === 3 ? 6 : 7, xs = draw(rng, n + 1, lvl); return num(nextQ(xs.slice(0, n)), xs[n], `${neg(xs[n - 3])} + ${par(xs[n - 2])} + ${par(xs[n - 1])} = ${neg(xs[n])}.`, ['Check a window of three on a shown step.', 'Add the last three terms.']); } },
        ] },
    ] },
    { type: 'text', text: `The five moves on ${seq(E3.slice(0, 7))}: the two-term test fails at the end (${E3[4]} + ${E3[5]} = ${E3[4] + E3[5]}, not ${E3[6]}); the shortfall ${E3[6] - E3[4] - E3[5]} is the term ${E3[3]} three places back; a second window agrees (${E3[2]} + ${E3[3]} + ${E3[4]} = ${E3[5]}). Next: ${E3[4]} + ${E3[5]} + ${E3[6]} = ${E3[7]}. The negative start does not matter: from the fourth term on, every window is a plain sum.` },
    { type: 'check', scope: 'the five moves', questions: [
      { type: 'number', q: 'What comes next?  1, 1, 2, 4, 7, 13, ?', answer: 24, explain: '4 + 7 + 13 = 24.' },
    ] },
    { type: 'explain', prompt: 'Why is the shortfall of the two-term sum exactly the term three places back?', model: 'If a(n) = a(n − 1) + a(n − 2) + a(n − 3), then a(n) − (a(n − 1) + a(n − 2)) = a(n − 3). So the two-term test misses on every step by an earlier term of the sequence, and seeing the sequence reappear in the misses tells you to widen the window by one.', points: ['Subtract the two-term sum from both sides of the rule', 'The leftover is a(n − 3), a term you can see', 'Misses that copy the sequence mean the window is too narrow'] },

    S('worked'),
    { type: 'worked', family: 'tribonacci', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'Small positive starts, six terms. Test the two-term sum first.' },
    { type: 'worked', family: 'tribonacci', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'Seven terms, possibly a negative start. The window check is given; the sum is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? The last two add to ${PRED[4] + PRED[5]}. Will the next term be above or below that? Commit, then give it.`, answer: `Above: ${PRED[3]} + ${PRED[4]} + ${PRED[5]} = ${PRED[6]}. The third term adds ${PRED[3]} on top of the two-term sum.`, explain: 'Every window of three matches; the two-term sum always falls short by the third term back.' },

    S('traps'),
    { type: 'traps', family: 'tribonacci', section: 'nl', extra: [
      { belief: 'The two-term sum failed, so the rule is not a sum.', fix: 'Measure the miss. If it copies an earlier term, widen the window.' },
      { belief: 'Add all the previous terms.', fix: 'The window is three terms wide; a sum of everything soon doubles each time.' },
      { belief: 'One matching window proves the rule.', fix: 'Small starts match many rules once. Check a second window.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 7))}, ?. One step is wrong.`, steps: [
      `The two-term sum fails: ${ERR[4]} + ${ERR[5]} = ${ERR[4] + ERR[5]}, not ${ERR[6]}.`,
      `The window is wider: ${ERR[3]} + ${ERR[4]} + ${ERR[5]} = ${ERR[6]}.`,
      `So add the terms before the last as well: ${ERR[3]} + ${ERR[4]} + ${ERR[5]} + ${ERR[6]} = ${ERR[3] + ERR[4] + ERR[5] + ERR[6]}.`,
      `Answer: ${ERR[3] + ERR[4] + ERR[5] + ERR[6]}.`,
    ], errorStep: 2, explain: `The window slides; it does not grow. Drop the oldest term: ${ERR[4]} + ${ERR[5]} + ${ERR[6]} = ${ERR[7]}. A four-term sum would already fail on a shown step: ${ERR[2]} + ${ERR[3]} + ${ERR[4]} + ${ERR[5]} = ${ERR[2] + ERR[3] + ERR[4] + ERR[5]}, not ${ERR[6]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const xs = draw(rng, 8, 3), a = xs[5], b = xs[4], c = xs[3], d = xs[2]; return pick(rng, nextQ(xs.slice(0, 6)), xs[6], [[a + b, 'added only the last two terms; the rule needs three'], [a + b + c + d, 'added four terms: the window slides, it does not grow'], [2 * a, 'doubled the last term'], [xs[7], 'went one step too far: that is the term after the next one']], `${c} + ${b} + ${a} = ${xs[6]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Test from the end, where coincidences are rare: is the last term the sum of the three before it? If yes, check one earlier window and add. Three additions, about 15 seconds.' },
    { type: 'check', scope: 'test from the end', questions: [
      { type: 'choice', q: 'Where do you test a three-term window first?', options: ['on the last term', 'on the fourth term', 'on the first term'], answer: 0, traps: { 1: 'small early terms can match by coincidence', 2: 'the first three terms are the free start' }, explain: 'The last terms are the largest, so a match there is no coincidence.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'Two steps ahead: after x, y, z the next terms are x + y + z and then y + z + (x + y + z) = x + 2y + 2z. Useful when the blank is one past the next term.' },
    { type: 'thinkaloud', problem: nextQ(E2.slice(0, 6)), lines: [
      { t: 0, say: `Gaps ${seq(E2.slice(1, 6).map((v, i) => v - E2[i]))}: nothing clean. Try sums.` },
      { t: 5, say: `${E2[3]} + ${E2[4]} = ${E2[3] + E2[4]}, but the next term is ${E2[5]}: short by ${E2[5] - E2[3] - E2[4]}.` },
      { t: 9, say: `So the rule is last + previous + ${E2[5] - E2[3] - E2[4]}: next ${E2[4] + E2[5] + E2[5] - E2[3] - E2[4]}.`, slip: true },
      { t: 13, say: `Check the step before: ${E2[2]} + ${E2[3]} = ${E2[2] + E2[3]} against ${E2[4]}, short by ${E2[4] - E2[2] - E2[3]}, not ${E2[5] - E2[3] - E2[4]}. The miss is the term three back, not a constant.` },
      { t: 18, say: `Window of three: ${E2[2]} + ${E2[3]} + ${E2[4]} = ${E2[5]} and ${E2[1]} + ${E2[2]} + ${E2[3]} = ${E2[4]}. Confirmed.` },
      { t: 23, say: `Next: ${E2[3]} + ${E2[4]} + ${E2[5]} = ${E2[6]}. Answer ${E2[6]}.` },
    ] },
    { type: 'check', scope: 'from the end, and two steps ahead', questions: [
      { make: (rng) => { const xs = draw(rng, 8, 3), x = xs[3], y = xs[4], z = xs[5]; return num(`${seq(xs.slice(0, 6))}, ?, ? What is the term **after** the next one?`, xs[7], `x = ${x}, y = ${y}, z = ${z}: x + 2y + 2z = ${x} + ${2 * y} + ${2 * z} = ${xs[7]}.`, ['Call the last three x, y, z.', 'The next two are x + y + z, then x + 2y + 2z.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Two-term sum falls short by the term three back → next = sum of the last three (check two windows).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Window that works', 'Next'], rows: [
      [seq(FB.slice(0, 6)), `${FB[3]} + ${FB[4]} = ${FB[5]}: two terms`, String(FB[6])],
      [seq(E1.slice(0, 6)), `${E1[2]} + ${E1[3]} + ${E1[4]} = ${E1[5]}: three terms`, String(E1[6])],
      [seq(ALL.slice(0, 6)), 'all previous terms: soon doubles', String(ALL[6])],
    ] },
    { type: 'variation', base: `${seq(E1.slice(0, 6))}, ? (sum of the previous three, next ${E1[6]})`, rows: [
      { change: 'Add 1 after every sum', effect: `${seq(T1.slice(0, 6))}: every step gains 1, next ${T1[6]} (the next lesson's rule).` },
      { change: 'Sum only the previous two (same first two terms)', effect: `${seq(fibl(E1[0], E1[1], 6))}: the Fibonacci rule, next ${fibl(E1[0], E1[1], 7)[6]}.` },
      { change: `Change the first term to ${E1[0] + 1}`, effect: `${seq(trib(E1[0] + 1, E1[1], E1[2], 6))}: every later term moves, next ${trib(E1[0] + 1, E1[1], E1[2], 7)[6]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the last three terms are the same, so the next is still ${E1[6]}. You only lose one window to check.` },
      { change: `Change the first term to ${E1[0] + 1} and add 1 after every sum`, fusion: true, effect: `The new start shifts every later term and the +1 adds up on every step: ${seq(T2.slice(0, 6))}, next ${T2[6]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a zero or negative start (${seq(E2.slice(0, 5))}, ${seq(E3.slice(0, 4))}) makes the first terms look random; the rule only shows from the fourth term. Six shown terms give three windows to check; five give only two.` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 1); const xs = t === 0 ? fibl(rng.int(1, 6), rng.int(7, 12), 6) : draw(rng, 6, 3); const names = ['sum of the previous two', 'sum of the previous three']; const two = `${xs[3]} + ${xs[4]} = ${xs[3] + xs[4]}, not ${xs[5]}`, three = `${xs[2]} + ${xs[3]} + ${xs[4]} = ${xs[2] + xs[3] + xs[4]}, not ${xs[5]}`; return pick(rng, `${seq(xs)}: which rule?`, names[t], [[names[1 - t], t === 0 ? three : two], ['sum of all previous terms', `${xs.slice(0, 5).reduce((a, b) => a + b, 0)} is not ${xs[5]}`]], 'Test each window on the last shown term.'); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: counting ways to climb stairs taking 1, 2 or 3 steps at a time gives a three-term sum. The last move was one of three sizes. Whenever the next state depends on the last k states, the window is k wide.' },
    { type: 'transfer',
      near: { make: (rng) => { const xs = draw(rng, 7, 3); return num(`A shop's orders each day equal the total of the previous three days: ${seq(xs.slice(0, 6))}. How many orders tomorrow?`, xs[6], `${xs[3]} + ${xs[4]} + ${xs[5]} = ${xs[6]}.`, ['Check a window of three on a shown day.', 'Add the last three days.']); } },
      far: { type: 'number', q: `Ways to climb n stairs taking 1, 2 or 3 steps at a time: n = 1, 2, 3, 4, 5 give ${seq(STAIRS.slice(0, 5))}. How many ways for n = 6?`, answer: STAIRS[5], explain: `The last move is 1, 2 or 3 steps, so the count is the sum of the previous three: ${STAIRS[2]} + ${STAIRS[3]} + ${STAIRS[4]} = ${STAIRS[5]}.`, hints: ['What was the last move?', 'Add the counts for n − 1, n − 2 and n − 3.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the stairs?', options: ['Each count depends on a fixed window of earlier counts', 'The counts grow by one constant ratio each time', 'The counts have a constant second row of differences', 'Each count is exactly double the count before it'], answer: 0, traps: { 1: `the ratios ${STAIRS.slice(1, 5).map((v, i) => (v / STAIRS[i]).toFixed(2)).join(', ')} drift`, 2: `the second row ${seq(diffs(diffs(STAIRS.slice(0, 5))))} is not constant`, 3: `${STAIRS[3]} is not double ${STAIRS[2]}` }, explain: 'The last move covers 1, 2 or 3 stairs, so each count adds the three before it: the three-term window of this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'tribonacci', section: 'nl', count: 3 },
  ],
};
