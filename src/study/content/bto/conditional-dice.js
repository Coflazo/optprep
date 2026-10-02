// Conditional probability with two dice (and two children): delete the outcomes the information
// rules out, then count. Every number shown is computed here, never typed by hand.
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

const F = [1, 2, 3, 4, 5, 6];
const pairs = F.flatMap((a) => F.map((b) => [a, b]));
const n = (pred) => pairs.filter(([a, b]) => pred(a, b)).length;
const cond = (ev, given) => Q.of(n((a, b) => ev(a, b) && given(a, b)), n(given));
const has = (x) => (a, b) => a === x || b === x;
const sumIs = (s) => (a, b) => a + b === s;
const sumGe = (s) => (a, b) => a + b >= s;
const both6 = (a, b) => a === 6 && b === 6;
const cells = (pred) => pairs.filter(([a, b]) => pred(a, b)).map(([a, b]) => [a - 1, b - 1]);
const grid = (pred, text) => ({ rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: F.map((a) => F.map((b) => text(a, b))), highlight: cells(pred), count: n(pred) });
const A11 = n(has(6)); // outcomes with at least one 6
const WIN = Q.of(1, 3); // far transfer: each strategy wins a day
const BOTH_W = WIN.mul(WIN);
const ANY_W = Q.of(1).sub(Q.of(1).sub(WIN).mul(Q.of(1).sub(WIN)));
const V = { A: n((a, b) => has(6)(a, b) && !sumGe(10)(a, b)), B: n((a, b) => sumGe(10)(a, b) && !has(6)(a, b)), AB: n((a, b) => has(6)(a, b) && sumGe(10)(a, b)), none: n((a, b) => !has(6)(a, b) && !sumGe(10)(a, b)) };

export default {
  id: 'bto/conditional-dice',
  book: 'bto',
  kind: 'family',
  family: 'conditional-dice',
  title: 'Conditional probability with dice',
  summary: 'Delete the outcomes the information rules out, then count: P(B | A) = |A ∩ B| / |A|.',
  prerequisites: ['bto/two-dice-sum', 'prob/conditional-bayes'],
  objectives: [
    'Shrink the 36-cell sample space to the outcomes consistent with the information',
    'Compute P(B | A) = |A ∩ B| / |A| for any dice condition in under 30 seconds',
    'Tell "at least one die is a 6" (1/11 for both) from "the first die is a 6" (1/6)',
    'Keep P(B | A), P(A | B) and P(A and B) apart',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: two dice are thrown and you are told that at least one of them shows a 6. What is the probability that both show a 6? Try two approaches.', answer: `${cond(both6, has(6))}`, explain: `${A11} of the 36 outcomes contain a 6, and only (6,6) has two. If you said 1/6 you reasoned about "the other die", but the information does not say which die is the 6.`, attempts: [
      { id: 'twelve', label: 'Twelve cells with a 6', approach: 'Counted 6 cells with the first die a 6 and 6 with the second: 1/12.', breaksAt: `(6,6) is in both lists. There are ${A11} cells with a 6, not 12.` },
      { id: 'over-36', label: 'Both sixes out of 36', approach: 'Took P(both 6) = 1/36 and stopped there.', breaksAt: `That ignores the information: the ${36 - A11} cells with no 6 are ruled out, so the total is ${A11}.` },
      { id: 'other-die', label: 'The other die must be a 6', approach: 'One die is a 6, so the other die needs a 6 too: 1/6.', breaksAt: '"At least one" does not say which die. There is no single "other die" to reason about.' },
    ] },
    { type: 'text', text: 'Two dice are thrown (or a family has two children) and you are **told something** before the question: "given that the sum is 8", "at least one die shows a 6", "the first die is even", "at least one child is a boy". The question asks about another event in that light.' },
    { type: 'list', items: ['"Two dice. Given that at least one shows a 6, probability both do?"', '"Given that the sum is at least 10, probability that at least one die is a 6?"', '"Given that the dice differ, probability the sum is 7?"', '"A family has two children, at least one a girl. Probability both are girls?"'] },
    { type: 'check', scope: 'what you are told', questions: [
      { type: 'choice', q: '"Two dice: if the first die is even, what is the chance the sum is 8?" What are you told?', options: ['the first die is even', 'the sum is 8', 'two dice are thrown', 'both of the first two'], answer: 0, traps: { 1: 'the sum is the event asked about, not the information', 2: 'that is the experiment itself', 3: 'only the fact given before the question is the condition' }, explain: 'The condition is the fact you are told: the first die is even.' },
    ] },
    { type: 'text', text: 'Not this lesson: conditioning on a noisy signal about a hidden cause, such as a test result (bto/bayes-test) or a ball drawn from an unknown box (bto/bayes-boxes). Here the information is a plain fact about the outcome itself.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Two dice; the sum is odd. Probability a die shows 1?', 'A test is 90% accurate; you test positive. Probability you are ill?', 'Two dice; probability the sum is odd', 'A coin is picked from a bag and shows heads twice. Probability it is double-headed?'], answer: 0, traps: { 1: 'a noisy signal about a hidden cause: bto/bayes-test', 2: 'no information given: bto/two-dice-sum', 3: 'evidence about which object you hold: bto/bayes-boxes' }, explain: 'A fact about the dice themselves, then a question about the same dice.' },
    ] },

    S('why'),
    { type: 'text', text: '"Given that" questions test one thing: do you shrink the sample space correctly? The wording is chosen to make you reason about "the other die" when the information does not say which die, and to make you swap P(B | A) with P(A | B). Both give plausible options, so the only defence is to count. The classic two-children puzzle is the same question with a 4-outcome sample space instead of 36, and it is answered by exactly the same three moves.' },

    S('anchor'),
    { type: 'text', text: 'You know P(event) = favourable / total over equally likely outcomes. Conditioning is that rule with **one change**: the information deletes every outcome that contradicts it, so the **total** becomes only the outcomes still possible. They stay equally likely, so you count again inside the smaller set.' },
    { type: 'check', scope: 'favourable over a smaller total', questions: [
      { type: 'choice', q: 'One die. You are told the face is even. P(it is a 6)?', options: ['1/3', '1/6', '1/2', '2/3'], answer: 0, traps: { 1: 'ignored the information', 2: 'thought 6 is half of the even faces', 3: 'answered "not a 6" within the even faces' }, explain: 'Even faces 2, 4, 6 remain; one of the three is a 6.' },
    ] },

    S('picture'),
    { type: 'text', text: 'Mark the information on the 36-cell grid. "At least one die shows a 6" is the last row plus the last column: 11 cells, not 12, because (6,6) sits in both. Everything else is deleted.' },
    { type: 'diagram', diagram: 'grid', spec: grid(has(6), (a, b) => a + b), caption: `The ${A11} cells still possible. Only (6,6) has two sixes, so P(both 6 | at least one 6) = ${cond(both6, has(6))}. Each cell shows its sum.` },
    { type: 'check', scope: 'counting inside the highlighted cells', questions: [
      { make: (rng) => { const s = rng.pick([7, 8, 9, 10, 11]); const v = cond(sumIs(s), has(6)); return mc(rng, `Two dice. Given at least one shows a 6, P(the sum is ${s})?`, v.toString(), [[Q.of(6 - Math.abs(s - 7), 36).toString(), 'ignored the information'], [Q.of(n((a, b) => has(6)(a, b) && sumIs(s)(a, b)), 36).toString(), 'counted the cells but divided by 36'], [Q.of(n((a, b) => has(6)(a, b) && sumIs(s)(a, b)), 12).toString(), 'counted 12 cells with a 6, double counting (6,6)']], `Cells with a 6 and sum ${s}: ${n((a, b) => has(6)(a, b) && sumIs(s)(a, b))} of ${A11}.`); } },
    ] },
    { type: 'text', text: 'Now name the die: "the **first** die shows a 6". Only the last row survives: 6 cells. Now "both are 6" is 1 of 6. The information changed, so the deleted cells changed, so the answer changed.' },
    { type: 'diagram', diagram: 'grid', spec: grid((a) => a === 6, (a, b) => a + b), caption: `First die is 6: 6 cells, and P(both 6) = ${cond(both6, (a) => a === 6)}. "At least one" keeps ${A11} cells; "this one" keeps 6.` },
    { type: 'check', scope: '"at least one" versus "this one"', questions: [
      { type: 'choice', q: 'Two dice. Given that the second die is a 3, P(both show 3)?', options: [cond((a, b) => a === 3 && b === 3, (a, b) => b === 3).toString(), cond((a, b) => a === 3 && b === 3, has(3)).toString(), '1/36', '1/2'], answer: 0, traps: { 1: 'used "at least one 3", but the die is named', 2: 'ignored the information', 3: 'treated "same" and "different" as equally likely' }, explain: 'The second die is fixed; the first matches with 1/6.' },
    ] },
    { type: 'text', text: 'Two events, two directions. With A = "at least one 6" and B = "sum at least 10", the Venn diagram below counts cells. P(A | B) divides the overlap by B; P(B | A) divides it by A.' },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['A: a 6 shows', 'B: sum ≥ 10'], regions: V, total: 36 }, caption: `Cell counts. The overlap has ${V.AB} cells. P(A | B) = ${V.AB}/${V.AB + V.B}, because B has ${V.AB + V.B} cells, but P(B | A) = ${V.AB}/${V.AB + V.A}, because A has ${V.AB + V.A}. Same overlap, different denominators, very different answers.` },
    { type: 'check', scope: 'the two directions of conditioning', questions: [
      { type: 'choice', q: 'Two dice. P(at least one 6 | sum ≥ 10)?', options: [Q.of(V.AB, V.AB + V.B).toString(), Q.of(V.AB, V.AB + V.A).toString(), Q.of(V.AB, 36).toString(), Q.of(A11, 36).toString()], answer: 0, traps: { 1: 'reversed the condition: that is P(sum ≥ 10 | a 6)', 2: 'P(both), not divided by P(condition)', 3: 'ignored the condition' }, explain: `Condition on B: ${V.AB + V.B} cells, ${V.AB} with a 6.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'List the equally likely outcomes as ordered pairs: 36 for two dice, 4 for two children (BB, BG, GB, GG, oldest first).', why: 'Conditioning only works on equally likely atoms; ordered pairs are those atoms.',
        checks: [
          { type: 'number', q: 'Two children, each a boy or girl with 1/2. How many equally likely ordered outcomes (older, younger)?', answer: 4, explain: 'BB, BG, GB, GG.' },
        ] },
      { answers: 'twelve', say: 'Delete every outcome that contradicts the information. What is left is the new sample space A.', why: 'The information says those outcomes did not happen; nothing else is learned.',
        checks: [
          { make: (rng) => { const opts = [['the sum is 8', sumIs(8)], ['the dice differ', (a, b) => a !== b], ['the sum is even', (a, b) => (a + b) % 2 === 0], ['at least one die is a 2', has(2)], ['the first die is odd', (a) => a % 2 === 1]]; const [t, f] = rng.pick(opts); return { type: 'number', q: `Two dice. You are told ${t}. How many of the 36 outcomes remain?`, answer: n(f), hints: ['Count ordered pairs that fit.', 'Remember (a,b) and (b,a) are different unless a = b.'], explain: `${n(f)} ordered pairs fit.` }; } },
        ] },
      { answers: 'over-36', say: 'Count the event inside A and divide: P(B | A) = |A ∩ B| / |A|.', why: 'The surviving outcomes stay equally likely, so favourable over total still works, with the new total.',
        checks: [
          { make: (rng) => { const s = rng.int(4, 10); const x = rng.pick(F.filter((v) => s - v >= 1 && s - v <= 6)); const v = cond(has(x), sumIs(s)); return mc(rng, `Two dice. Given the sum is ${s}, P(at least one die shows ${x})?`, v.toString(), [[Q.of(A11, 36).toString(), 'ignored the condition'], [cond(sumIs(s), has(x)).toString(), 'reversed the condition'], [Q.of(1, 6).toString(), 'thought about one die only']], `${n(sumIs(s))} pairs sum to ${s}; ${n((a, b) => sumIs(s)(a, b) && has(x)(a, b))} contain a ${x}: ${v}.`); } },
        ] },
      { say: 'The same thing as a formula: P(B | A) = P(A and B) / P(A). With equally likely outcomes, the 36s cancel and you are back to counting.', why: 'Dividing by P(A) rescales the surviving outcomes so they add up to 1 again.',
        checks: [
          { type: 'choice', q: 'P(A and B) = 5/36 and P(A) = 11/36. P(B | A)?', options: ['5/11', '5/36', '11/36', '55/1296'], answer: 0, traps: { 1: 'forgot to divide by P(A)', 2: 'that is P(A)', 3: 'multiplied instead of dividing' }, explain: '(5/36)/(11/36) = 5/11.' },
        ] },
      { answers: 'other-die', say: '"At least one" and "this one" are different information. "At least one child is a boy" keeps BB, BG, GB: P(BB) = 1/3. "The older is a boy" keeps BB, BG: P(BB) = 1/2.', why: 'Naming which child (or die) deletes more outcomes. The trap is to treat "at least one" as if it named one.',
        checks: [
          { type: 'choice', q: 'Two children; you learn at least one is a girl. P(both girls)?', options: ['1/3', '1/2', '1/4', '2/3'], answer: 0, traps: { 1: 'treated "at least one" as naming a particular child', 2: 'ignored the information', 3: 'answered "one of each"' }, explain: 'GG, GB, BG remain; GG is one of three.' },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is P(both 6 | at least one 6) equal to 1/11 and not 1/6?', model: `"At least one 6" does not say which die shows it, so ${A11} ordered outcomes remain: five with only the first die a 6, five with only the second, and (6,6). Only (6,6) has two sixes. The 1/6 answer pretends we know which die is the 6 and asks about the other one, which would keep only 6 outcomes.`, points: ['list the outcomes consistent with "at least one 6": 11', 'only (6,6) is favourable', '1/6 assumes a named die, a different condition'] },

    S('worked'),
    { type: 'worked', family: 'conditional-dice', section: 'bto', difficulty: 2, seed: 'b', explainAt: [0], intro: 'A plain dice condition. Try it before opening the solution.' },
    { type: 'worked', family: 'conditional-dice', section: 'bto', difficulty: 3, seed: 'f', fade: 1, intro: 'A sum condition and an "at least one" event. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'Two dice are thrown. Given that the sum is at least 10, what is the probability that at least one die shows a 6?', lines: [
      { t: 0, say: '"Given that": shrink the 36 cells to those with sum at least 10, then count inside.' },
      { t: 4, say: `At least one 6 is ${A11} cells of 36, so ${Q.of(A11, 36)}.`, slip: true },
      { t: 7, say: `Wait, that ignores the information. The new total is the cells with sum at least 10: ${n(sumIs(10))} + ${n(sumIs(11))} + ${n(sumIs(12))} = ${n(sumGe(10))}.` },
      { t: 11, say: `Inside them, the cells with a 6: (4,6), (6,4), (5,6), (6,5), (6,6). That is ${V.AB} of ${n(sumGe(10))}.` },
      { t: 15, say: `Check: only (5,5) has no 6, so ${cond(has(6), sumGe(10))} fits. Answer ${cond(has(6), sumGe(10))}, with time to spare.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try gave 11/36. What went wrong?', options: ['kept all 36 cells instead of the 6', 'miscounted the cells with a 6', 'counted (6, 6) twice', 'counted sums, not cells'], answer: 0, traps: { 1: '11 cells with a 6 is right on the full grid', 2: '(6, 6) was counted once', 3: 'the try counted cells' }, explain: 'Given the sum is at least 10, only 6 cells remain, and 5 of them hold a 6: 5/6.' },
    ] },

    S('predict'),
    { type: 'predict', question: 'Two dice. Is P(sum is 7 | the dice differ) bigger or smaller than P(sum is 7)?', answer: `Bigger: ${cond(sumIs(7), (a, b) => a !== b)} against 1/6.`, explain: 'No sum-7 pair is a double, so deleting the 6 doubles removes only failures.' },

    S('traps'),
    { type: 'traps', family: 'conditional-dice', section: 'bto', extra: [
      { belief: '"At least one die is a 6" means "the other die" is uniform, so P(both 6) = 1/6.', fix: `There is no single "other die": ${A11} outcomes remain and one is (6,6).` },
      { belief: 'P(B | A) = P(A | B).', fix: 'Same overlap, different denominators.' },
      { belief: 'Conditioning on A: divide the overlap by 36.', fix: 'That is P(A and B). Divide by |A| instead.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(both boys | at least one boy) for a two-child family. One step is wrong.', steps: [
      'We know one of the children is a boy.',
      'The other child is independent of him, so it is a boy with probability 1/2.',
      'Both are boys exactly when the other child is a boy.',
      'P = 1/2.',
    ], errorStep: 1, explain: '"At least one boy" does not pick out a particular child, so there is no "other child". The outcomes BB, BG, GB remain, equally likely: P(BB) = 1/3.' },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `Two dice, given at least one 6. A candidate answers P(sum ≥ 10) = ${Q.of(V.AB, V.AB + V.B)}. Which belief?`, options: ['Reversed the condition', 'Ignored the condition', 'Divided by 36'], answer: 0, explain: `${Q.of(V.AB, V.AB + V.B)} is P(a 6 | sum ≥ 10). Correct: ${Q.of(V.AB, V.AB + V.A)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the common denominators: at least one x → ${A11}; sum s → 6 − |s − 7|; the dice differ → ${n((a, b) => a !== b)}; sum even → ${n((a, b) => (a + b) % 2 === 0)}; first die named → 6. Then count the event inside and you are done.` },
    { type: 'check', scope: 'the memorised denominators', questions: [
      { make: (rng) => { const x = rng.int(1, 6); const s = rng.pick(F.map((v) => v + x).filter((t) => t >= 2)); const v = cond(sumIs(s), has(x)); return mc(rng, `Two dice. Given at least one die shows ${x}, P(the sum is ${s})?`, v.toString(), [[Q.of(n((a, b) => has(x)(a, b) && sumIs(s)(a, b)), 12).toString(), 'used 12 as the denominator, double counting the double'], [Q.of(6 - Math.abs(s - 7), 36).toString(), 'ignored the condition'], [Q.of(1, 6).toString(), `treated "the other die" as uniform`]], `Denominator ${A11}; favourable ${n((a, b) => has(x)(a, b) && sumIs(s)(a, b))}.`); } },
    ] },
    { type: 'callout', tone: 'speed', text: `Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds a question. Write the denominator first (5 seconds), then list the favourable cells (15 seconds). If the event is bigger than a handful of cells, count its complement inside A.` },
    { type: 'check', scope: 'the complement inside A', questions: [
      { type: 'choice', q: 'Two dice. Given the dice differ, P(the sum is not 7)?', options: ['4/5', '5/6', '1/5', '2/3'], answer: 0, traps: { 1: 'that is P(sum not 7) with no information: 30 of 36', 2: 'that is P(sum is 7 | the dice differ)', 3: 'counted 24 cells but kept 36 as the total' }, explain: 'Denominator first: 30 cells with different faces. All 6 cells with sum 7 differ, so 30 − 6 = 24 of 30 = 4/5.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Given information → delete the outcomes it rules out, then count: P(B | A) = |A ∩ B| / |A|. "At least one" is not "this one".' },

    S('contrast'),
    { type: 'compare', columns: ['Information', 'Outcomes left', 'P(both 6)'], rows: [
      ['none', '36', '1/36'],
      ['at least one 6', String(A11), cond(both6, has(6)).toString()],
      ['the first die is 6', '6', cond(both6, (a) => a === 6).toString()],
      ['the sum is 12', '1', cond(both6, sumIs(12)).toString()],
      ['the sum is at least 11', String(n(sumGe(11))), cond(both6, sumGe(11)).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: if the information implies the event (the sum is 12, so both are 6), the answer is 1. If it contradicts it (the sum is 7, so not both 6), the answer is 0. If the information rules out nothing, you are back to the unconditional answer.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Two dice. Given the sum is 7, P(both dice show the same face)?', options: ['0', '1/6', '1/11', '1/36'], answer: 0, traps: { 1: 'ignored the condition', 2: 'reused the "at least one" denominator', 3: 'the unconditional chance of one double' }, explain: 'A sum of 7 is odd, so the faces cannot be equal.' },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: Bayes questions are conditioning where the outcomes are "hidden cause × observed signal" pairs (bto/bayes-test, bto/bayes-boxes). Monty Hall is conditioning where what you are shown depends on the host\'s rule (bto/monty-hall). In every case: write the atoms, delete, count.' },
    { type: 'variation', base: `Two dice; at least one shows a 6. P(both show 6) = ${cond(both6, has(6))}.`, rows: [
      { change: 'At least one shows a 1; ask whether both show 1', effect: `No change: ${cond((a, b) => a === 1 && b === 1, has(1))}. Any face plays the role of 6.`, same: true },
      { change: 'You are told the first die shows a 6', effect: `A named die keeps only its row: ${cond(both6, (a) => a === 6)}.` },
      { change: 'You are told nothing', effect: `No cells are deleted: ${cond(both6, () => true)}.` },
      { change: 'You are told the sum is at least 11', effect: `Three cells remain, (5,6), (6,5), (6,6): ${cond(both6, sumGe(11))}.` },
      { change: 'The first die is named, and you ask for sum 12 instead of both 6', effect: `Sum 12 and "both 6" are the same cells, so that change does nothing; only the naming moves the answer: ${cond(sumIs(12), (a) => a === 6)}. Check which change touches the deleted cells.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const k = rng.pick([4, 8, 10]); return mc(rng, `Two fair ${k}-sided dice (faces 1 to ${k}). You are told at least one shows ${k}. P(both show ${k})?`, Q.of(1, 2 * k - 1).toString(), [[Q.of(1, k).toString(), 'reasoned about "the other die"'], [Q.of(1, 2 * k).toString(), `counted ${2 * k} cells with a ${k}, double counting the double`], [Q.of(1, k * k).toString(), 'ignored the information']], `${2 * k - 1} cells contain a ${k}; one of them is the double.`); } },
      far: { type: 'choice', q: `A trader runs two independent strategies; each has a winning day with probability ${WIN}. You hear that at least one won today. P(both won)?`, options: [BOTH_W.div(ANY_W).toString(), WIN.toString(), BOTH_W.toString(), ANY_W.toString()], answer: 0, traps: { 1: 'reasoned about "the other strategy", or treated WW, WL, LW as equally likely', 2: 'ignored the news', 3: 'computed P(at least one won), the condition itself' }, explain: `P(both | at least one) = P(both)/P(at least one) = ${BOTH_W}/${ANY_W} = ${BOTH_W.div(ANY_W)}.` },
      principle: { type: 'choice', q: 'Which idea carried over from dice to bigger dice and strategies?', options: ['Delete what the information rules out, then rescale', '"At least one" names one item; ask about the other', 'The information changes nothing: use the plain chance', 'Divide the overlap by the total before the news'], answer: 0, traps: { 1: '"at least one" does not say which item', 2: 'information deletes outcomes, so it changes the total', 3: 'that is P(A and B), not P(B | A)' }, explain: 'P(B | A) = P(A and B)/P(A): keep only what is still possible, then rescale it to total 1.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'conditional-dice', section: 'bto', count: 3 },
  ],
};
