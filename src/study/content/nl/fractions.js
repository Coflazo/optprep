// NumberLogic family lesson: fraction sequences, solved as a numerator row and a denominator row.
// Every number shown is computed here.
import { S, seq, diffs, ladderRows, ratios, nextQ, pick, num, arith, geo, fibl, PRIMES } from './method-ladder.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const FIB = fibl(1, 1, 30);
const fr = (n, d) => `${n}/${d}`;
const frs = (N, D) => N.map((v, i) => fr(v, D[i])).join(', ');
const g = (xs) => diffs(xs);
const ROW = {
  arith: (a, d) => ({ f: (i) => a + i * d, say: `add ${d}` }),
  geo: (a, r) => ({ f: (i) => a * r ** i, say: `multiply by ${r}` }),
  sq: (s) => ({ f: (i) => (i + s) ** 2, say: 'consecutive squares' }),
  prime: (s) => ({ f: (i) => PRIMES[i + s], say: 'consecutive primes' }),
  fib: (s) => ({ f: (i) => FIB[i + s], say: 'Fibonacci numbers' }),
};
// Rows as in the generator; draws with a reducible term are repeated (the generator keeps
// every fraction in lowest terms, so the rows are unambiguous). A prime row starting at 5
// (5, 7, 11, 13, 17) also reads as 11, 13, 17, 19, 23 minus 6, so that start is skipped.
function build(nr, dr, n) {
  const N = Array.from({ length: n }, (_, i) => nr.f(i)), D = Array.from({ length: n }, (_, i) => dr.f(i));
  return N.every((v, i) => D[i] > 1 && gcd(v, D[i]) === 1) ? { N, D, nr, dr } : null;
}
function draw(rng, n, lvl = rng.pick([3, 4, 5])) {
  for (;;) {
    let nr, dr;
    if (lvl === 3) { nr = ROW.arith(rng.int(1, 5), rng.int(1, 4)); dr = ROW.arith(rng.int(2, 9), rng.int(1, 5)); }
    else if (lvl === 4) { if (rng.chance(0.5)) { nr = ROW.arith(rng.int(1, 7), rng.pick([1, 2, 3])); dr = ROW.geo(rng.int(2, 3), 2); } else { nr = ROW.sq(rng.int(1, 3)); dr = ROW.arith(rng.int(2, 9), rng.int(2, 5)); } }
    else if (rng.chance(0.5)) { const s = rng.int(1, 4); nr = ROW.fib(s); dr = ROW.fib(s + 1); }
    else { nr = ROW.prime(rng.pick([0, 1, 3])); dr = ROW.sq(rng.int(2, 4)); }
    const p = build(nr, dr, n);
    if (p) return { ...p, lvl, pair: lvl === 5 && p.N[1] === p.D[0] };
  }
}
const lastF = (p, n) => fr(p.N[n], p.D[n]);
// Wrong next terms after five shown (p needs seven entries). In a Fibonacci pair the mediant is
// the right answer, so that case gets its own slips.
const wrongs = (p) => (p.pair
  ? [[fr(p.N[4], p.D[5]), 'kept the old numerator; the old denominator moves up'], [fr(p.D[4], 2 * p.D[4]), 'doubled the denominator; the new one is the last top plus the last bottom'], [fr(p.D[4], p.D[4] + p.N[3]), `added the top from two steps back (${p.N[3]}) instead of the last one (${p.N[4]})`], [fr(p.N[6], p.D[6]), 'went one step too far']]
  : [[fr(p.N[5], p.D[4]), 'advanced only the numerator; both rows move'], [fr(p.N[4], p.D[5]), 'advanced only the denominator; both rows move'], [fr(p.N[3] + p.N[4], p.D[3] + p.D[4]), 'took the mediant (sum of tops over sum of bottoms); the rows have their own rules'], [fr(p.N[6], p.D[5]), 'moved the numerator two steps and the denominator one']]);
const nextOf = (p) => nextQ(frs(p.N.slice(0, 5), p.D.slice(0, 5)).split(', '));

const CH = build(ROW.arith(3, 2), ROW.arith(4, 3), 6);
const E1 = build(ROW.arith(1, 2), ROW.geo(2, 2), 6);
const E2 = build(ROW.sq(1), ROW.arith(3, 2), 6);
const E3 = build(ROW.fib(2), ROW.fib(3), 6);
const E4 = build(ROW.prime(1), ROW.sq(2), 6);
const PRED = build(ROW.fib(1), ROW.fib(2), 6);
const ERR = build(ROW.arith(2, 3), ROW.arith(5, 3), 6);
const DICE = [1, 3, 6, 10, 15]; // ordered pairs with sum at most 2, 3, 4, 5, 6
const HALF = { N: [1, 1, 1, 1, 1], D: geo(2, 2, 5) };

export default {
  id: 'nl/fractions',
  book: 'nl',
  kind: 'family',
  family: 'fractions',
  title: 'Fractions: two sequences stacked',
  summary: 'Split every fraction into its numerator and denominator, solve the two integer rows separately, advance both by one step and recombine.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic', 'nl/geometric', 'nl/squares-plus', 'nl/primes', 'nl/fibonacci-like'],
  objectives: [
    'Split a fraction sequence into two integer rows in seconds',
    'Solve each row with the earlier lessons (gaps, ratios, squares, primes, Fibonacci)',
    'Advance both rows by exactly one step and recombine',
    'Reject the classic slips: one row left behind, or the mediant',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'values', label: 'Find a rule for the values', approach: `Turned the fractions into decimals (${CH.N.slice(0, 3).map((v, i) => (v / CH.D[i]).toFixed(2)).join(', ')}, …) and looked for a pattern.`, breaksAt: 'The values are two rules divided; they rarely follow a rule of their own.' },
      { id: 'mediant', label: 'Add tops and bottoms', approach: 'Added the last two numerators and the last two denominators.', breaksAt: 'That mediant is not the rule of either row.' },
      { id: 'one-row', label: 'Move only one row', approach: 'Advanced the row with the obvious pattern and kept the other one.', breaksAt: 'Both rows move one step at every position.' },
    ], q: `Before any teaching: ${frs(CH.N.slice(0, 5), CH.D.slice(0, 5))}, ? What comes next? Try two ways: once with the values of the fractions, once reading the tops and bottoms as two lists.`, answer: lastF(CH, 5), explain: `As values (${CH.N.slice(0, 5).map((v, i) => (v / CH.D[i]).toFixed(2)).join(', ')}) nothing obvious appears. As two lists: tops ${seq(CH.N.slice(0, 5))} add ${CH.N[1] - CH.N[0]}, bottoms ${seq(CH.D.slice(0, 5))} add ${CH.D[1] - CH.D[0]}. Next: ${lastF(CH, 5)}.` },
    { type: 'text', text: 'Every term is a fraction. The value of each fraction rarely follows a rule; instead the **numerators** form one ordinary sequence and the **denominators** another, written one above the other.' },
    { type: 'list', items: [`What number comes next?  ${frs(E1.N.slice(0, 5), E1.D.slice(0, 5))}, ?`, `What number comes next?  ${frs(E2.N.slice(0, 5), E2.D.slice(0, 5))}, ?`, `What number comes next?  ${frs(E3.N.slice(0, 5), E3.D.slice(0, 5))}, ?`] },
    { type: 'text', text: 'Not this lesson: decimals (the decimal lesson), or two sequences written side by side in alternate positions (the strands lesson). Here the two sequences share every position, one on top, one below.' },
    { type: 'check', scope: 'the cue: two rows in every term', questions: [
      { make: (rng) => { const p = draw(rng, 5); return pick(rng, `${frs(p.N, p.D)}: which two lists do you solve?`, `${seq(p.N)} and ${seq(p.D)}`, [[`${seq(p.N.map((v, i) => v + p.D[i]))} and ${seq(p.D.map((v, i) => v - p.N[i]))}`, 'those are top + bottom and bottom − top; read each row on its own'], [`${p.N.map((v, i) => (v / p.D[i]).toFixed(2)).join(', ')} (the values)`, 'the values rarely follow a rule; the tops and bottoms do']], 'Numerators on top, denominators below.'); } },
    ] },

    S('why'),
    { type: 'text', text: 'Fraction items look intimidating, but most are two easy sequences glued together. The time sink is trying to find a rule for the values, or reaching for the calculator, which turns clean rows into decimals. The split takes seconds and hands you two problems from the first lessons.' },

    S('anchor'),
    { type: 'text', text: 'In the strands lesson you split one list into two sequences that take turns. This family changes **one thing**: the two sequences do not take turns, they are stacked, one numerator over one denominator, at every position. Split them, solve each, stack them again. It is easier than the strands: there is no turn to track, because both rows move at every position.' },
    { type: 'check', scope: 'reading the two stacked rows', questions: [
      { make: (rng) => { const p = draw(rng, 5, 3); return num(`${frs(p.N, p.D)}: what is the third denominator?`, p.D[2], `Denominators: ${seq(p.D)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Write the numerators on one line and the denominators on the line below. Each line is a sequence you already know how to solve; the fraction bar is only the way they are printed. Then extend both lines by one column and read the new column as the answer.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['row', '1', '2', '3', '4', '5', 'next'], rows: [['numerator', ...CH.N.slice(0, 5).map(String), String(CH.N[5])], ['denominator', ...CH.D.slice(0, 5).map(String), String(CH.D[5])]] }, caption: `${frs(CH.N.slice(0, 5), CH.D.slice(0, 5))} as two rows: tops add ${CH.N[1] - CH.N[0]}, bottoms add ${CH.D[1] - CH.D[0]}. Both advance one column: ${lastF(CH, 5)}.` },
    { type: 'check', scope: 'the two-row table', questions: [
      { make: (rng) => { const p = draw(rng, 6, 3); return num(`${frs(p.N.slice(0, 5), p.D.slice(0, 5))}, ? What is the next **numerator**?`, p.N[5], `Numerators ${seq(p.N.slice(0, 5))}: ${p.nr.say}, next ${p.N[5]}.`, ['Write the numerators as one list.']); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1.N.slice(0, 5), 1) }, caption: `The rows can follow different rules. In ${frs(E1.N.slice(0, 5), E1.D.slice(0, 5))} the numerators have a constant gap of ${g(E1.N)[0]} ...` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [E1.D.slice(0, 5), ratios(E1.D.slice(0, 5))] }, caption: `... while the denominators double. Next: ${E1.N[4]} + ${g(E1.N)[0]} = ${E1.N[5]} over ${E1.D[4]} × 2 = ${E1.D[5]}, so ${lastF(E1, 5)}.` },
    { type: 'check', scope: 'each row has its own rule', questions: [
      { make: (rng) => { const p = draw(rng, 6, 4); return num(`${frs(p.N.slice(0, 5), p.D.slice(0, 5))}, ? What is the next **denominator**?`, p.D[5], `Denominators ${seq(p.D.slice(0, 5))}: ${p.dr.say}, next ${p.D[5]}.`, ['Write the denominators as one list.', 'Gaps first; if they grow with the terms, divide.']); } },
    ] },

    S('derivation'),
    { type: 'text', text: `The whole method on ${frs(E2.N.slice(0, 5), E2.D.slice(0, 5))}: the tops ${seq(E2.N.slice(0, 5))} are the squares, the bottoms ${seq(E2.D.slice(0, 5))} add ${g(E2.D)[0]}. Next top ${E2.N[5]}, next bottom ${E2.D[5]}: ${lastF(E2, 5)}. Some values are above 1 and none of them can be reduced; neither matters, because the rows carry the rule.` },
    { type: 'steps', steps: [
      { answers: 'values', say: 'Split: write the numerators as one list and the denominators as another.', why: 'The fraction is only the display. Each row is built by its own rule.',
        checks: [
          { make: (rng) => { const p = draw(rng, 5); return pick(rng, `Split ${frs(p.N, p.D)}. Which list are the denominators?`, seq(p.D), [[seq(p.N), 'those are the numerators, the top row'], [seq(p.D.map((v, i) => v - p.N[i])), 'those are bottom minus top; the rows are read separately'], [seq(p.N.map((v, i) => v * p.D[i])), 'those are top × bottom; the rows are read separately']], `Denominators: ${seq(p.D)}.`); } },
        ] },
      { answers: 'mediant', say: 'Solve the numerator row as an ordinary sequence: constant gap, squares, primes or Fibonacci.', why: 'Nothing new: each row is a family you already know.',
        checks: [
          { make: (rng) => { const p = draw(rng, 6); return num(`${frs(p.N.slice(0, 5), p.D.slice(0, 5))}, ? What is the next numerator?`, p.N[5], `Numerators ${seq(p.N.slice(0, 5))}: ${p.nr.say}, so ${p.N[5]}.`, ['Top row only.']); } },
        ] },
      { say: 'Solve the denominator row the same way. It often carries the harder rule: doubling, squares or the next Fibonacci number.', why: 'Test writers put the twist in one row and keep the other simple, so check each row on its own.',
        checks: [
          { make: (rng) => { const p = draw(rng, 6); return num(`${frs(p.N.slice(0, 5), p.D.slice(0, 5))}, ? What is the next denominator?`, p.D[5], `Denominators ${seq(p.D.slice(0, 5))}: ${p.dr.say}, so ${p.D[5]}.`, ['Bottom row only.']); } },
        ] },
      { answers: 'one-row', say: 'Recombine: the next term is the next numerator over the next denominator. Both rows advance exactly one step.', why: 'Every position carries one entry of each row, so the next position needs the next entry of each.',
        checks: [
          { make: (rng) => { const p = draw(rng, 7); return pick(rng, nextOf(p), lastF(p, 5), wrongs(p).slice(0, 3), `${p.N[5]} over ${p.D[5]}.`); } },
        ] },
      { say: 'A row can feed the other: in consecutive Fibonacci fractions each denominator becomes the next numerator, and the new denominator is the sum of the last numerator and denominator.', why: 'Both rows are the same Fibonacci list, the bottom one step ahead of the top.',
        checks: [
          { make: (rng) => { const s = rng.int(1, 5), p = { ...build(ROW.fib(s), ROW.fib(s + 1), 7), pair: true }; return pick(rng, nextOf(p), lastF(p, 5), wrongs(p).slice(0, 3), `The old denominator ${p.D[4]} becomes the numerator; the new denominator is ${p.N[4]} + ${p.D[4]} = ${p.D[5]}: ${lastF(p, 5)}.`); } },
        ] },
    ] },
    { type: 'text', text: `The rows you will meet are the families from earlier lessons: a constant gap (${seq(CH.D.slice(0, 4))}), doubling (${seq(E1.D.slice(0, 4))}), squares (${seq(E2.N.slice(0, 4))}), primes (${seq(E4.N.slice(0, 4))}) and Fibonacci numbers (${seq(E3.N.slice(0, 4))}). Recognise each row on its own, and the fraction item costs no more than two easy items.` },
    { type: 'explain', prompt: 'Why does the value of each fraction not help, and why must both rows advance by exactly one step?', model: 'The rule was applied to the numerators and the denominators separately, so the values are just two independent sequences divided, and they rarely follow a pattern of their own. Each position holds entry k of both rows, so the next position holds entry k + 1 of both: moving one row and not the other, or one row twice, mixes positions.', points: ['Each row has its own rule; the value is only their quotient', 'Position k holds entry k of both rows', 'So both rows advance exactly one step'] },

    S('worked'),
    { type: 'worked', family: 'fractions', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'Two constant-gap rows. Split them before opening the solution.' },
    { type: 'worked', family: 'fractions', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'One row doubles or is a list of squares. The split is given; recombining is yours.' },

    S('predict'),
    { type: 'predict', question: `${frs(PRED.N.slice(0, 5), PRED.D.slice(0, 5))}, ? Predict the next fraction.`, answer: `${lastF(PRED, 5)}: both rows are Fibonacci numbers, the bottom one step ahead. ${PRED.D[4]} moves up; ${PRED.N[4]} + ${PRED.D[4]} = ${PRED.D[5]} goes below.`, explain: 'The values settle near 0.618, but no value rule gets you the exact next fraction as fast as the rows do.' },

    S('traps'),
    { type: 'traps', family: 'fractions', section: 'nl', extra: [
      { belief: 'Add the last two numerators and the last two denominators.', fix: 'That is the mediant. Each row follows its own rule; test that rule on the shown terms.' },
      { belief: 'Convert to decimals and find the pattern.', fix: 'The rows are the pattern; decimals destroy them.' },
      { belief: 'Only the row with the obvious pattern moves.', fix: 'Both rows advance one step at every position.' },
    ] },
    { type: 'text', text: 'The wrong options in a fraction item come from three slips: a row left behind, a row moved twice, or the mediant (sum of the last two tops over sum of the last two bottoms). Before choosing, check both rows of your answer against their own rules: the top against the tops, the bottom against the bottoms.' },
    { type: 'erroneous', problem: `A candidate finds the next term of ${frs(ERR.N.slice(0, 5), ERR.D.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `The values rise towards 1: ${ERR.N.slice(0, 5).map((v, i) => (v / ERR.D[i]).toFixed(2)).join(', ')}.`,
      'Each fraction seems to be built from the two before it.',
      `So add the last two tops and bottoms: (${ERR.N[3]} + ${ERR.N[4]})/(${ERR.D[3]} + ${ERR.D[4]}) = ${fr(ERR.N[3] + ERR.N[4], ERR.D[3] + ERR.D[4])}.`,
      `Answer: ${fr(ERR.N[3] + ERR.N[4], ERR.D[3] + ERR.D[4])}.`,
    ], errorStep: 2, explain: `The sum rule was never tested: ${fr(ERR.N[1] + ERR.N[2], ERR.D[1] + ERR.D[2])} is not ${fr(ERR.N[3], ERR.D[3])}. Split instead: tops ${seq(ERR.N.slice(0, 5))} add ${g(ERR.N)[0]}, bottoms ${seq(ERR.D.slice(0, 5))} add ${g(ERR.D)[0]}, so the answer is ${lastF(ERR, 5)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng, 7, rng.pick([3, 4])); return pick(rng, nextOf(p), lastF(p, 5), wrongs(p), `Tops: ${p.nr.say} → ${p.N[5]}; bottoms: ${p.dr.say} → ${p.D[5]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Read the columns, never the values. Put your finger on the tops and read them as a list, then the bottoms. Two small integer sequences, about 20 seconds in total.' },
    { type: 'callout', tone: 'speed', text: 'The calculator never helps here: a decimal like 0.6842 hides both rows. Keep every fraction as written; the items already use lowest terms.' },
    { type: 'thinkaloud', problem: nextOf(E2), lines: [
      { t: 0, say: `Fractions. Maybe each one is built from the two before: (${E2.N[3]} + ${E2.N[4]})/(${E2.D[3]} + ${E2.D[4]}) = ${fr(E2.N[3] + E2.N[4], E2.D[3] + E2.D[4])}.`, slip: true },
      { t: 6, say: `Test that on a shown step: (${E2.N[1]} + ${E2.N[2]})/(${E2.D[1]} + ${E2.D[2]}) = ${fr(E2.N[1] + E2.N[2], E2.D[1] + E2.D[2])}, not ${fr(E2.N[3], E2.D[3])}. Wrong idea. Split the rows.` },
      { t: 11, say: `Tops ${seq(E2.N.slice(0, 5))}: squares, next ${E2.N[5]}. Bottoms ${seq(E2.D.slice(0, 5))}: add ${g(E2.D)[0]}, next ${E2.D[5]}.` },
      { t: 16, say: `So ${lastF(E2, 5)}. Some values are above 1; that changes nothing.` },
      { t: 20, say: `Option check: ${fr(E2.N[5], E2.D[4])} leaves the bottom behind, and the mediant is out. Answer ${lastF(E2, 5)}.` },
    ] },
    { type: 'check', scope: 'rows first, never the values', questions: [
      { make: (rng) => { const p = draw(rng, 7, 5); return pick(rng, nextOf(p), lastF(p, 5), wrongs(p), `Tops ${p.nr.say}, bottoms ${p.dr.say}: ${lastF(p, 5)}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Fractions → split numerators and denominators, solve each row, advance both one step, recombine.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Top row', 'Bottom row', 'Next'], rows: [
      [frs(CH.N.slice(0, 4), CH.D.slice(0, 4)), CH.nr.say, CH.dr.say, lastF(CH, 4)],
      [frs(E1.N.slice(0, 4), E1.D.slice(0, 4)), E1.nr.say, E1.dr.say, lastF(E1, 4)],
      [frs(E2.N.slice(0, 4), E2.D.slice(0, 4)), E2.nr.say, E2.dr.say, lastF(E2, 4)],
      [frs(E3.N.slice(0, 4), E3.D.slice(0, 4)), 'Fibonacci', 'Fibonacci, one step ahead', lastF(E3, 4)],
      [frs(E4.N.slice(0, 4), E4.D.slice(0, 4)), E4.nr.say, E4.dr.say, lastF(E4, 4)],
    ] },
    { type: 'variation', base: `${frs(CH.N.slice(0, 5), CH.D.slice(0, 5))}, ? (tops add ${g(CH.N)[0]}, bottoms add ${g(CH.D)[0]}, next ${lastF(CH, 5)})`, rows: [
      { change: 'The bottoms double instead of adding', effect: `Tops unchanged, bottoms ${seq(geo(CH.D[0], 2, 5))}: next ${fr(CH.N[5], geo(CH.D[0], 2, 6)[5])}.` },
      { change: `The tops add ${g(CH.N)[0] + 1} instead`, effect: `Tops ${seq(arith(CH.N[0], g(CH.N)[0] + 1, 5))}, bottoms unchanged: next ${fr(arith(CH.N[0], g(CH.N)[0] + 1, 6)[5], CH.D[5])}.` },
      { change: 'Swap tops and bottoms', effect: `The same two rows upside down: ${frs(CH.D.slice(0, 5), CH.N.slice(0, 5))}, next ${fr(CH.D[5], CH.N[5])}.` },
      { change: 'Drop the first fraction', same: true, effect: `No change: both rows still end at ${CH.N[4]} and ${CH.D[4]} with the same steps, so the next is still ${lastF(CH, 5)}.` },
      { change: `Tops add ${g(CH.N)[0] + 1} and bottoms double, together`, fusion: true, effect: `Each change touches one row only, so they combine without interfering: tops ${seq(arith(CH.N[0], g(CH.N)[0] + 1, 5))}, bottoms ${seq(geo(CH.D[0], 2, 5))}, next ${fr(arith(CH.N[0], g(CH.N)[0] + 1, 6)[5], geo(CH.D[0], 2, 6)[5])}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a row can be constant (${frs(HALF.N.slice(0, 4), HALF.D.slice(0, 4))}: top 1, bottom doubling), and then the values also follow a rule (they halve); both readings agree. Values above 1 are allowed (${frs(E2.N.slice(2, 4), E2.D.slice(2, 4))}). Every term is already in lowest terms, so never reduce or expand one.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a ratio of two counts (hits over attempts, wins over games) changes because each count follows its own process. Model the counts, then divide; do not model the ratio directly.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const p = draw(rng, 6, 5); return num(`${frs(p.N.slice(0, 5), p.D.slice(0, 5))}, ? What is the next denominator?`, p.D[5], `Bottoms ${seq(p.D.slice(0, 5))}: ${p.dr.say}, next ${p.D[5]}.`, ['Read the bottom row only.', 'Which famous list is it?']); } },
      { make: (rng) => { const k = rng.int(4, 6), D = geo(2, 2, k + 1); return pick(rng, nextQ(D.slice(0, k).map((d) => fr(1, d))), fr(1, D[k]), [[fr(2, D[k]), 'the top row is constant at 1; it does not move'], [fr(1, D[k - 1] + 2), 'the bottom row doubles; it does not add 2']], `Top 1 every time; bottom doubles: ${fr(1, D[k])}. The values halve too.`); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = draw(rng, 7, 3); return pick(rng, `A player's record after each game (made over attempted) reads ${frs(p.N.slice(0, 5), p.D.slice(0, 5))}. If the pattern holds, what is the record after the next game?`, lastF(p, 5), wrongs(p).slice(0, 3), `Made: ${p.nr.say} → ${p.N[5]}; attempted: ${p.dr.say} → ${p.D[5]}.`); } },
      far: { type: 'number', q: `Two dice. Written over 36, P(sum ≤ 2), P(sum ≤ 3), P(sum ≤ 4), P(sum ≤ 5) are ${DICE.slice(0, 4).map((v) => fr(v, 36)).join(', ')}. What is P(sum ≤ 6)? (Type a fraction.)`, answer: DICE[4] / 36, explain: `The bottoms stay 36; the tops ${seq(DICE.slice(0, 4))} grow by 2, 3, 4, so the next top is ${DICE[3]} + 5 = ${DICE[4]}: ${fr(DICE[4], 36)}.`, hints: ['Read the tops as their own list.', 'Their gaps count up.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the fraction lists to the dice?', options: ['Solve the top and bottom as separate lists', 'Convert every fraction to a decimal first', 'Add the tops and bottoms of the last two terms', 'Multiply each fraction by a fixed ratio'], answer: 0, traps: { 1: 'the decimals hide the running totals in the tops', 2: 'the mediant follows neither list', 3: `${fr(DICE[1], 36)} to ${fr(DICE[2], 36)} and ${fr(DICE[2], 36)} to ${fr(DICE[3], 36)} are different ratios` }, explain: 'The tops are running totals and the bottom is fixed: two lists read separately, exactly as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'fractions', section: 'nl', count: 3 },
  ],
};
