// NumberLogic family lesson: constant difference. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, arith, geo, quad, weave } from './method-ladder.js';

const CHd = -7, CH = arith(41, CHd, 6);
const UP = arith(12, 9, 6);
const DOWN = arith(50, -6, 6);
const CROSS = arith(11, -4, 6);
const ERR = arith(62, -7, 6);
const MISS = arith(5, 4, 5);
const DEC = arith(0.5, 0.75, 5);
const T1 = geo(3, 2, 5), T2 = quad(2, 3, 2, 5), T3 = weave(arith(4, 3, 3), arith(30, -4, 3), 6);

// Sequences of the four types the contrast table names.
const KINDS = ['constant gap', 'constant ratio', 'gaps change by a constant', 'two strands'];
const KIND_TRAP = [
  [null, 'the ratios drift; it is the gaps that stay equal', 'the gaps do not change at all', 'the gaps never zigzag'],
  ['the gaps grow with the terms', null, 'the gaps grow by a factor, not by a fixed amount', 'every step is the same multiplication'],
  ['the gaps change', 'the ratios drift; the gaps grow by a fixed amount', null, 'the gaps move steadily in one direction'],
  ['the gaps alternate up and down', 'neighbours are unrelated; ratios mean nothing', 'the gaps zigzag rather than grow steadily', null],
];
function kindSeq(rng, t) {
  if (t === 0) return arith(rng.int(-10, 40), nz(rng, -9, 12), 5);
  if (t === 1) return geo(rng.int(2, 6), rng.pick([2, 3]), 5);
  if (t === 2) return quad(rng.int(1, 20), rng.int(1, 6), rng.int(1, 4), 5);
  return weave(arith(rng.int(1, 9), rng.int(2, 5), 3), arith(rng.int(30, 60), -rng.int(2, 6), 3), 6);
}

export default {
  id: 'nl/arithmetic',
  book: 'nl',
  kind: 'family',
  family: 'arithmetic',
  title: 'Constant gap: add the same number',
  summary: 'Subtract neighbours, later minus earlier; if every gap is d, the next term is last + d.',
  prerequisites: ['nl/method-ladder'],
  objectives: [
    'Spot a constant gap in under five seconds, rising or falling',
    'Find the next term, or a missing middle term, from last + d',
    'Jump ahead with term n = first + (n − 1) × d',
    'Name the two classic slips (wrong direction, misread gap) and check against them',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: one using the gaps, one using the position of each term.`, answer: String(CH[5]), explain: `The gaps are all ${neg(CH[1] - CH[0])}, so ${CH[4]} ${sgn(CH[1] - CH[0])} = ${CH[5]}. By position: term n = ${CH[0]} − ${-CHd} × (n − 1), so term 6 = ${CH[0]} − ${-CHd} × 5 = ${CH[5]}. If you wrote ${CH[4] - CHd}, you subtracted the wrong way round: this lesson names that slip.` },
    { type: 'text', text: 'The terms move by the **same amount every step**: up or down, starting anywhere, including below zero. The item asks for the next term, or hides one term in the middle and asks what replaces the question mark.' },
    { type: 'list', items: [`What number comes next?  ${seq(UP.slice(0, 5))}, ?`, `What number comes next?  ${seq(DOWN.slice(0, 5))}, ?`, `Which number replaces the question mark?  ${seq(MISS.slice(0, 2))}, ?, ${seq(MISS.slice(3))}`] },
    { type: 'text', text: `Not this lesson: gaps that change (${seq(T2)}) or terms that multiply (${seq(T1)}). Those fail the first test, and the method ladder sends you to the next rung.` },
    { type: 'check', scope: 'the cue: equal gaps', questions: [
      { make: (rng) => { const A = kindSeq(rng, 0), G = kindSeq(rng, 1), Qd = kindSeq(rng, 2); return pick(rng, 'Which sequence belongs to this lesson?', seq(A), [[seq(G), `its gaps ${seq(diffs(G))} grow`], [seq(Qd), `its gaps ${seq(diffs(Qd))} change by a fixed amount`]], `Only ${seq(A)} has equal gaps: ${seq(diffs(A))}.`); } },
    ] },
    { type: 'text', text: 'The wrong options are built from real slips: the step applied backwards, a gap misread by one, the term after the next one, and rules that fit only the last few terms (repeating the last ratio, adding the last two terms). Each one is tempting for a reason, and each has a quick test that kills it.' },
    { type: 'check', scope: 'where the wrong options come from', questions: [
      { make: (rng) => { const d = rng.int(3, 12) * rng.pick([1, -1]), xs = arith(rng.int(10, 60), d, 5), w = xs[4] - d; return pick(rng, `${seq(xs)}, ? A candidate answers ${neg(w)}. Which slip produced it?`, 'the step applied backwards', [['a gap misread by one', `that lands one away from the answer ${neg(xs[4] + d)}, not a whole gap the wrong way`], ['the term after the next one', `that would be ${neg(xs[4] + 2 * d)}, two gaps on`], ['repeating the last ratio', 'that multiplies; this option is exactly one gap on the wrong side of the last term']], `The gap is ${sgn(d)}; ${neg(xs[4])} ${sgn(-d)} = ${neg(w)} goes the wrong way. The answer is ${neg(xs[4] + d)}.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Constant gaps are the first rung of the ladder and the most common early item. Every other lesson starts with this same subtraction, so doing it fast and without slips here buys time for the late, hard questions. The slips are the danger: an easy item answered wrongly costs as much as a hard one.' },

    S('anchor'),
    { type: 'text', text: 'You already count in steps: 3, 6, 9, 12 is counting by 3. A constant-gap sequence is counting in steps with **one change**: the step d can be any whole number, positive or negative, and the count can start anywhere.' },
    { type: 'check', scope: 'counting in steps', questions: [
      { make: (rng) => { const a = rng.int(40, 90), d = rng.int(3, 9), xs = arith(a, -d, 5); return num(`Count down by ${d} from ${a}: ${seq(xs.slice(0, 4))}, ? What is the next number?`, xs[4], `${xs[3]} − ${d} = ${neg(xs[4])}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Write the gaps under the terms. For this family the gap row is flat: one number repeated. Plot the terms against their position and they sit on a straight line: every step right moves up (or down) by the same d.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(UP, 1), predicted: true }, caption: `Gaps of ${seq(UP.slice(0, 5))}: ${UP[1] - UP[0]} every time. The outlined cells are the continuation: copy the flat row once more, then ${UP[4]} + ${UP[1] - UP[0]} = ${UP[5]}.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 6, label: 'position n' }, y: { min: 0, max: 60, label: 'term' }, curves: [{ label: `add ${UP[1] - UP[0]}`, points: UP.map((v, i) => [i + 1, v]) }, { label: `add ${neg(DOWN[1] - DOWN[0])}`, points: DOWN.map((v, i) => [i + 1, v]) }], markers: [{ x: 6, y: UP[5], label: `next ${UP[5]}` }, { x: 6, y: DOWN[5], label: `next ${DOWN[5]}` }] }, caption: 'Against position, constant-gap sequences are straight lines. The rising line climbs by d per step; the falling one drops. The next term is one more step along the same line.' },
    { type: 'check', scope: 'the flat gap row', questions: [
      { make: (rng) => { const d = nz(rng, -12, 12), xs = arith(rng.int(-15, 60), d, 5); return num(`Every gap of ${seq(xs)} is the same. What is it? (Later minus earlier, with its sign.)`, d, `${neg(xs[1])} − ${neg(xs[0])} = ${neg(d)}, and the same for every pair.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Subtract each term from the next one: term 2 − term 1, term 3 − term 2, and so on. Always later minus earlier.', why: 'Later minus earlier keeps the sign: a falling sequence gives negative gaps, which tells you to go down. Subtracting the other way round flips every step.',
        checks: [
          { make: (rng) => { const d = -rng.int(3, 12), xs = arith(rng.int(40, 90), d, 5); return pick(rng, `What is the gap of ${seq(xs)}?`, d, [[-d, 'subtracted earlier minus later; the terms fall, so the gap is negative'], [d - 1, `misread one subtraction: ${xs[0]} − ${xs[1]} is ${-d}`], [d + 1, `misread one subtraction: ${xs[0]} − ${xs[1]} is ${-d}`]], `${xs[1]} − ${xs[0]} = ${neg(d)}: the terms fall by ${-d} each step.`); } },
        ] },
      { say: 'Check every gap, not just the first two. If all of them equal d, the rule is "add d".', why: 'A sequence can start with two equal gaps and then change. One unequal gap means this is a different family, and the method ladder takes over.',
        checks: [
          { make: (rng) => { const d = rng.int(2, 9), xs = arith(rng.int(1, 30), d, 5), bend = rng.chance(0.5); if (bend) xs[4] += rng.pick([1, 2, -1]); const g = diffs(xs); return pick(rng, `Is ${seq(xs)} a constant-gap sequence?`, bend ? 'No' : 'Yes', [[bend ? 'Yes' : 'No', bend ? `the first gaps agree but the last is ${g[3]}: check every gap` : 'every gap is equal; recheck the subtractions']], `Gaps: ${seq(g)}.`); } },
        ] },
      { say: 'Next term = last term + d. With a negative d the next term is smaller.', why: 'The rule that produced every shown step produces the next one. Adding a negative gap is the same as subtracting its size.',
        checks: [
          { make: (rng) => { const d = nz(rng, -15, 15), xs = arith(rng.int(-20, 60), d, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Gap ${sgn(d)}: ${neg(xs[4])} ${sgn(d)} = ${neg(xs[5])}.`, ['Subtract each term from the one after it.', `Add the gap to ${neg(xs[4])}.`]); } },
        ] },
      { say: 'A blank in the middle: fill it with left neighbour + d, then confirm that blank + d gives the right neighbour.', why: 'The gaps that do not touch the blank still show d. The right-hand check catches a misread d before it costs a point.',
        checks: [
          { make: (rng) => { const d = nz(rng, -9, 12), xs = arith(rng.int(-10, 50), d, 5), k = rng.int(2, 3); const shown = xs.map((v, i) => (i === k ? '?' : neg(v))).join(', '); return num(`Which number replaces the question mark?  ${shown}`, xs[k], `Gap ${sgn(d)} from the untouched pairs: ${neg(xs[k - 1])} ${sgn(d)} = ${neg(xs[k])}, and ${neg(xs[k])} ${sgn(d)} = ${neg(xs[k + 1])} checks.`, ['Find d from two neighbours that do not touch the blank.', `Left neighbour ${neg(xs[k - 1])} plus d.`]); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'numberline', spec: { min: -10, max: 12, step: 2, marks: CROSS.map((v, i) => ({ x: v, label: `t${i + 1}` })) }, caption: `${seq(CROSS)} on a number line: every jump is ${neg(CROSS[1] - CROSS[0])}, before and after zero. Crossing zero changes nothing; only the gap matters.` },
    { type: 'text', text: 'The four moves are the whole method. The first two decide whether this lesson applies at all; the last two use it. When the item hides a middle term, the only change is where you add: from the left neighbour of the blank instead of from the last term, with the right neighbour as a free check.' },
    { type: 'explain', prompt: 'Why must you subtract later minus earlier, and why check every gap rather than the first two?', model: 'Later minus earlier gives the step with its sign, so adding it moves in the right direction; the reverse order flips every step. Two equal gaps can be a coincidence at the start of a different rule, so only a fully flat gap row proves "add d".', points: ['Later − earlier keeps the sign of the step', 'Adding a negative gap moves down', 'One unequal gap anywhere means a different rule'] },

    S('worked'),
    { type: 'worked', family: 'arithmetic', section: 'nl', difficulty: 1, seed: 'a', intro: 'A live item from the generator. Find the gap, then the answer, before opening the solution.' },
    { type: 'worked', family: 'arithmetic', section: 'nl', difficulty: 1, seed: 'b', fade: 1, intro: 'The gaps are given; the final step and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: `Without writing the gaps: ${seq(CROSS.slice(0, 5))}, ? Will the next term be positive or negative, and what is it?`, answer: `Negative, ${neg(CROSS[5])}: the gap is ${neg(CROSS[1] - CROSS[0])} and the terms have already crossed zero.`, explain: 'A falling line keeps falling past zero; the sign of the terms never changes the rule.' },

    S('traps'),
    { type: 'traps', family: 'arithmetic', section: 'nl', extra: [
      { belief: `A falling sequence like ${seq(DOWN.slice(0, 3))} has gap +${DOWN[0] - DOWN[1]} because the terms are ${DOWN[0] - DOWN[1]} apart.`, fix: `Later minus earlier: ${DOWN[1]} − ${DOWN[0]} = ${neg(DOWN[1] - DOWN[0])}. Add ${neg(DOWN[1] - DOWN[0])}, that is, go down.` },
      { belief: 'Two equal gaps at the start prove the rule.', fix: 'Check every gap. One different gap means a different family.' },
      { belief: 'One quick subtraction is enough, so a misread gap is harmless.', fix: 'Confirm d on a second pair before answering: a one-off slip gives a wrong option that the test writers include on purpose.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `The terms are evenly spaced, ${ERR[0] - ERR[1]} apart.`,
      `So the gap is +${ERR[0] - ERR[1]}.`,
      `Next term = ${ERR[4]} + ${ERR[0] - ERR[1]} = ${ERR[4] + ERR[0] - ERR[1]}.`,
      `Answer: ${ERR[4] + ERR[0] - ERR[1]}.`,
    ], errorStep: 1, explain: `Later minus earlier gives ${neg(ERR[1] - ERR[0])}: the terms fall. The next term is ${ERR[4]} − ${ERR[0] - ERR[1]} = ${ERR[5]}. The warning sign: ${ERR[4] + ERR[0] - ERR[1]} is already in the list, so the answer walked backwards.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const d = rng.pick([1, -1]) * rng.int(2, 12), xs = arith(rng.int(-10, 60), d, 7), last = xs[4], u = d > 0 ? 1 : -1; return pick(rng, nextQ(xs.slice(0, 5)), xs[5], [[last - d, 'applied the step in the wrong direction'], [last + d + u, `misread the gap as ${Math.abs(d) + 1}`], [xs[6], 'added the gap twice: that is the term after the next one'], [last + d - u, `misread the gap as ${Math.abs(d) - 1}`]], `Gap ${sgn(d)}: ${neg(last)} ${sgn(d)} = ${neg(xs[5])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Subtract by counting up from the smaller number (from 38 up to 45 is ${45 - 38}), and treat negatives as positions on a number line (from −3 to 5 is ${5 - -3} steps right). Then eyeball the other pairs: once you know d, equal spacing is easy to confirm. Target: under 15 seconds.` },
    { type: 'callout', tone: 'speed', text: 'Jump ahead without listing: **term n = first + (n − 1) × d**. It checks an answer in one line, and it fills a blank that sits far from the terms you trust.' },
    { type: 'check', scope: 'term n = first + (n − 1) × d', questions: [
      { make: (rng) => { const a = rng.int(-10, 30), d = nz(rng, -9, 9), n = rng.int(8, 15); return num(`A constant-gap sequence starts at ${neg(a)} with gap ${sgn(d)}. What is term ${n}?`, a + (n - 1) * d, `${neg(a)} + (${n} − 1) × ${d < 0 ? `(${neg(d)})` : d} = ${neg(a + (n - 1) * d)}.`, [`Term ${n} is ${n - 1} steps after term 1.`, `${neg(a)} + ${n - 1} × ${neg(d)}.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Constant gap d (later minus earlier) → next = last + d.' },

    S('contrast'),
    { type: 'text', text: 'The first test separates four families that beginners mix up. Read the gap row and ask what stays fixed: the gap itself, the ratio, the change in the gap, or each strand on its own.' },
    { type: 'compare', columns: ['Sequence', 'Gaps', 'What stays fixed', 'Next'], rows: [
      [seq(UP.slice(0, 5)), seq(diffs(UP.slice(0, 5))), 'the gap', String(UP[5])],
      [seq(T1.slice(0, 4)), seq(diffs(T1.slice(0, 4))), 'the ratio (×2)', String(T1[4])],
      [seq(T2.slice(0, 4)), seq(diffs(T2.slice(0, 4))), 'the change in the gap', String(T2[4])],
      [seq(T3.slice(0, 5)), seq(diffs(T3.slice(0, 5))), 'each strand on its own', String(T3[5])],
    ] },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const t = rng.int(0, 3), xs = kindSeq(rng, t); return pick(rng, `${seq(xs)}: what stays fixed?`, KINDS[t], KINDS.map((k, i) => [k, KIND_TRAP[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(diffs(xs))}.`); } },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: gap 0 gives a constant sequence (7, 7, 7). Fractions and decimals follow the same rule: ${DEC.slice(0, 4).join(', ')} adds ${DEC[1] - DEC[0]}, next ${DEC[4]}. A blank between two shown terms is also their average, because both gaps around it equal d.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a constant gap is a straight line. Any series that grows by about the same amount each period extrapolates the same way, last value + (periods ahead) × step, which is exactly how you estimate a trend by eye.' },
    { type: 'check', scope: 'the edge cases', questions: [
      { make: (rng) => { const d = nz(rng, -9, 9), xs = arith(rng.int(-20, 40), d, 3); return num(`Which number replaces the question mark?  ${neg(xs[0])}, ?, ${neg(xs[2])}`, xs[1], `Both gaps around the blank equal d, so the blank is the average: (${neg(xs[0])} + ${neg(xs[2])}) ÷ 2 = ${neg(xs[1])}.`, ['The two gaps around the blank are equal.', 'Take the average of the two neighbours.']); } },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'arithmetic', section: 'nl', count: 3 },
  ],
};
