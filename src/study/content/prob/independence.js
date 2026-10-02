// Probability foundations 6: independence. Definition, independent vs disjoint, the product
// rule for repeated trials, draws with and without replacement.
import { sec, frac, show, dec, round, mc, diceCells, diceGrid } from './sample-spaces.js';

const withWithoutQ = (rng) => {
  const n = rng.int(6, 12), r = rng.int(3, n - 2), repl = rng.chance(0.5);
  const w = { fo: r * r, to: n * n }, wo = { fo: r * (r - 1), to: n * (n - 1) };
  const [ok, other] = repl ? [w, wo] : [wo, w];
  return mc({ q: `A bag has ${r} red and ${n - r} blue balls. Two are drawn ${repl ? 'with' : 'without'} replacement. What is P(both red)?`, right: frac(ok.fo, ok.to),
    wrong: [[frac(other.fo, other.to), repl ? 'updated the bag, but the first ball went back' : 'kept the first fraction, but the first ball did not go back'], [frac(r, n), 'stopped after one draw'], [frac(r - 1, n - 1), 'gave only the second branch of the tree']],
    explain: repl ? `The bag is restored, so the draws are independent: ${r}/${n} × ${r}/${n} = ${frac(w.fo, w.to)}.` : `The bag changes: ${r}/${n} × ${r - 1}/${n - 1} = ${frac(wo.fo, wo.to)}.` }, rng);
};
const atLeastOneOf3Q = (rng) => {
  const ps = [rng.pick([0.1, 0.2, 0.3]), rng.pick([0.2, 0.4, 0.5]), rng.pick([0.1, 0.25, 0.5])];
  const none = ps.reduce((a, p) => a * (1 - p), 1), ans = round(1 - none, 3);
  return { type: 'number', q: `Three independent events have chances ${ps.join(', ')}. What is P(at least one happens)? (3 decimal places)`, answer: ans, tolerance: 0.0011,
    hints: ['Complement: none of them happens.', `None: ${ps.map((p) => dec(1 - p, 2)).join(' × ')}, multiplied because they are independent.`],
    explain: `P(none) = ${ps.map((p) => dec(1 - p, 2)).join(' × ')} = ${dec(none, 4)}. P(at least one) = ${dec(1 - none, 4)}.` };
};
const diceIndepQ = (rng) => {
  const k = rng.int(1, 6), s = rng.pick([6, 7, 8]);
  const both = diceCells((a, b) => a === k && a + b === s).length, sumN = diceCells((a, b) => a + b === s).length;
  const indep = both * 36 === 6 * sumN;
  return { type: 'choice', q: `Two dice. Are "the first die shows ${k}" and "the sum is ${s}" independent?`, options: ['Yes', 'No'], answer: indep ? 0 : 1,
    traps: indep ? { 1: 'the sum looks like it depends on the first die, but for sum 7 every first face leaves exactly one partner' } : { 0: `for sum ${s} the first die matters: the check P(A and B) = P(A) × P(B) fails` },
    explain: `P(both) = ${both}/36. P(first ${k}) × P(sum ${s}) = 1/6 × ${sumN}/36 = ${frac(sumN, 216)}. ${indep ? 'Equal: independent.' : `Not equal (${frac(both, 36)}): dependent.`}` };
};

const H = { w: frac(13 * 13, 52 * 52), wo: frac(13 * 12, 52 * 51) };
const evenHigh = diceCells((a, b) => a % 2 === 0 && b >= 5).length;

export default {
  id: 'prob/independence',
  book: 'prob',
  kind: 'foundation',
  title: 'Independence',
  summary: 'Independent means knowing A does not change B: then, and only then, P(A and B) = P(A) × P(B).',
  prerequisites: ['prob/conditional-bayes'],
  objectives: [
    'Test independence with P(A and B) = P(A) × P(B), or P(A | B) = P(A)',
    'Tell independent from disjoint, and explain why disjoint events are dependent',
    'Multiply chances across independent trials, including 1 − (1 − p)^{n} for "at least one"',
    'Draw with and without replacement correctly',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: two cards are drawn from a deck. Case 1: the first card is put back and the deck reshuffled before the second draw. Case 2: it is not put back. Find P(both hearts) in each case.', answer: `Case 1: ${H.w}. Case 2: ${H.wo}.`, explain: `With replacement the second draw is a fresh deck: 13/52 × 13/52 = ${H.w}. Without, one heart is gone: 13/52 × 12/51 = ${H.wo}. The only difference is whether the first draw changes the second.` },
    { type: 'text', text: 'Trigger words: **independent**, **with replacement**, separate dice or coins, or the question "does knowing A change the chance of B?". If it does not, the events are independent, and that is what lets you multiply.' },
    { type: 'check', scope: 'does knowing A change B?', questions: [
      mc({ q: 'Which pair of events is independent?', right: 'the first die shows 6 / the second die shows 6', at: 3,
        wrong: [['the first card is a heart / the second card is a heart (no replacement)', 'the first heart removes a heart: the second chance drops to 12/51'], ['a die shows 6 / the same die shows an even number', 'knowing it is a 6 makes "even" certain'], ['a die shows 1 / the same die shows 6', 'disjoint: knowing one happened rules the other out']],
        explain: 'Two separate dice do not influence each other: knowing the first shows 6 leaves the second at 1/6.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Every "and" across separate trials is a product, and every product is valid only under independence. Coin sequences, repeated dice and waiting times all rest on it. The disjoint-versus-independent mix-up is a favourite Likelihood List trap.' },

    sec('anchor'),
    { type: 'text', text: 'From the last lesson: P(A | B) = P(A and B) / P(B). **Independence** is the special case where knowing B does not change A: P(A | B) = P(A). Multiply both sides by P(B):' },
    { type: 'formula', text: 'A and B independent ⇔ P(A and B) = P(A) × P(B)' },
    { type: 'check', scope: 'the product rule', questions: [
      { make: (rng) => { const a = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6]), b = rng.pick([0.1, 0.2, 0.5, 0.7]); return { type: 'number', q: `A and B are independent, P(A) = ${a}, P(B) = ${b}. What is P(A and B)?`, answer: round(a * b, 4), tolerance: 1e-9, explain: `${a} × ${b} = ${dec(a * b, 4)}.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'In the unit square, draw A as a vertical strip and B as a horizontal band. Inside the band, A still takes the same share of the width: knowing B changes nothing. The overlap is a rectangle, and its area is width × height.' },
    { type: 'diagram', diagram: 'unitsquare', spec: { regions: [
      { points: [[0, 0.5], [0.4, 0.5], [0.4, 1], [0, 1]], area: 0.2, label: 'A only', tone: 1 },
      { points: [[0.4, 0], [1, 0], [1, 0.5], [0.4, 0.5]], area: 0.3, label: 'B only', tone: 2 },
      { points: [[0, 0], [0.4, 0], [0.4, 0.5], [0, 0.5]], area: 0.2, label: 'A and B', tone: 4 },
    ], xLabel: 'A: the left 0.4', yLabel: 'B: the bottom 0.5' }, caption: 'A is the left strip (width 0.4), B the bottom band (height 0.5). Their overlap has area 0.4 × 0.5 = 0.2 = P(A) × P(B): the picture of independence.' },
    { type: 'check', scope: 'the strip and the band', questions: [
      { make: (rng) => { const w = rng.pick([0.2, 0.3, 0.6, 0.7]), hgt = rng.pick([0.4, 0.5, 0.8]), ans = round(w * hgt, 4); return { type: 'number', q: `In the unit square, A is a vertical strip of width ${w} and B a horizontal band of height ${hgt}. What is the area of the overlap, P(A and B)?`, answer: ans, tolerance: 1e-9, explain: `The overlap is a rectangle, ${w} wide and ${hgt} high: ${ans}. That is P(A) × P(B).` }; } },
    ] },
    { type: 'diagram', diagram: 'grid', spec: diceGrid((a, b) => a % 2 === 0 && b >= 5), caption: `First die even (18 cells) and second die at least 5 (12 cells): ${evenHigh} cells have both, and ${evenHigh}/36 = 18/36 × 12/36. Two separate dice give crossing strips.` },
    { type: 'check', scope: 'testing independence on the grid', questions: [{ make: diceIndepQ }] },

    sec('disjoint', 'Independent is not disjoint'),
    { type: 'text', text: 'Disjoint events cannot both happen: P(A and B) = 0. If both have positive chances, P(A) × P(B) > 0, so they are **not** independent. They are as dependent as events get: learning that A happened tells you B did not.' },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['A: face 1 or 2', 'B: face 5 or 6'], regions: { A: 2, B: 2, AB: 0, none: 2 }, total: 6 }, caption: 'One die, disjoint events: the lens is empty. P(A) × P(B) = 1/3 × 1/3 is not 0, so they fail the independence test.' },
    { type: 'check', scope: 'disjoint versus independent', questions: [
      mc({ q: 'A and B are disjoint, with P(A) = 0.3 and P(B) = 0.4. What is P(A | B)?', right: '0', at: 1,
        wrong: [['0.3', 'treated disjoint as independent: knowing B does change A'], ['0.12', 'multiplied, which assumes independence'], ['0.7', 'added the two probabilities']],
        explain: 'Given B happened, A cannot have happened: P(A | B) = P(A and B)/P(B) = 0.' }),
    ] },

    sec('replace', 'With and without replacement'),
    { type: 'text', text: 'With replacement, every draw starts from the same bag: the draws are independent and you multiply the same fraction. Without replacement the bag changes, so multiply the conditional fractions from a tree (previous lesson).' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'bag 3R 2B', children: [
      { p: frac(3, 5), label: 'red', children: [{ p: frac(2, 4), label: 'red', mark: true }, { p: frac(2, 4), label: 'blue' }] },
      { p: frac(2, 5), label: 'blue', children: [{ p: frac(3, 4), label: 'red' }, { p: frac(1, 4), label: 'blue' }] },
    ] }, total: frac(3 * 2, 5 * 4) }, caption: `Without replacement: P(both red) = 3/5 × 2/4 = ${frac(6, 20)}. With replacement the second branch would still say 3/5, giving ${frac(9, 25)}.` },
    { type: 'check', scope: 'with and without replacement', questions: [{ make: withWithoutQ }] },

    sec('derivation'),
    { type: 'text', text: 'From two independent events to n independent trials, one move at a time.' },
    { type: 'steps', steps: [
      { say: 'Two independent events: P(A and B) = P(A) × P(B), because P(A | B) = P(A).', why: 'In a tree, the second branch is not changed by the first, so the path product uses the plain chance.',
        checks: [mc({ q: 'A fair coin is tossed and a fair die thrown. What is P(heads and a 6)?', right: frac(1, 12), at: 2,
          wrong: [[frac(2, 3), 'added 1/2 + 1/6: "and" multiplies'], ['1/8', 'added the outcome counts 2 + 6 instead of multiplying'], ['1/6', 'ignored the coin']],
          explain: '1/2 × 1/6 = 1/12, the same as 1 cell of the 12-cell grid.' })] },
      { say: 'Three or more independent trials: keep multiplying. Each new branch is unchanged by everything before it.', why: '(A and B) is itself one event, independent of C, so the two-event rule applies again.',
        checks: [{ make: (rng) => { const k = rng.int(2, 4); return mc({ q: `A die is thrown ${k} times. What is P(every throw is at least 5)?`, right: frac(1, 3 ** k),
          wrong: [[frac(1, 6 ** k), 'used 1/6 per throw, but "at least 5" is two faces'], [frac(1, 3), 'used one throw only'], [frac(3 ** k - 2 ** k, 3 ** k), 'that is P(at least one throw is 5 or 6)']],
          explain: `Each throw: 2/6 = 1/3. Independent: (1/3)^{${k}} = ${frac(1, 3 ** k)}.` }, rng); } }] },
      { say: 'With chance p per trial: P(all n succeed) = p^{n}, P(none succeed) = (1 − p)^{n}, so P(at least one) = 1 − (1 − p)^{n}.', why: 'The complement lesson counted 5^{n}/6^{n}. Independence gives the same answer for any p, even when there is nothing to count.',
        checks: [{ make: (rng) => { const p = rng.pick([0.1, 0.2, 0.3, 0.4]), n = rng.int(2, 5), ans = round(1 - (1 - p) ** n, 3); return { type: 'number', q: `A biased coin shows heads with chance ${p}. It is tossed ${n} times. P(at least one head)? (3 decimal places)`, answer: ans, tolerance: 0.0011, hints: ['Complement: all tails.', `All tails: ${dec(1 - p, 1)}^{${n}}.`], explain: `1 − ${dec(1 - p, 1)}^{${n}} = 1 − ${dec((1 - p) ** n, 4)} = ${dec(1 - (1 - p) ** n, 4)}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Why can you multiply 13/52 × 13/52 for two hearts with replacement, but not without?', model: 'With replacement the deck is restored, so the first card tells you nothing about the second: P(second heart | first heart) = 13/52 and the product rule applies. Without replacement one heart is gone, the second chance is 12/51, and you must multiply that conditional fraction instead.', points: ['Multiplying plain probabilities needs independence', 'With replacement the second draw is unchanged by the first', 'Without replacement, multiply the updated chance 12/51'] },

    sec('predict'),
    { type: 'predict', question: 'A fair coin has landed heads 5 times in a row. Is tails now more likely than heads on the next toss?', answer: 'No: still 1/2. The tosses are independent, and the coin has no memory.', explain: `The run of 5 heads had chance 1/${2 ** 5} before it happened, but it is now history. Believing a tail is "due" is the gambler's fallacy.` },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Disjoint means independent.', fix: 'Disjoint events with positive chances are dependent: one rules the other out.' },
      { belief: 'A coin that has shown heads five times is due a tail.', fix: 'Independent tosses have no memory: P(tail) stays 1/2.' },
      { belief: 'Without replacement, multiply the original fractions.', fix: 'Update the fraction after every draw.' },
      { belief: '"And" means add.', fix: '"And" across independent trials multiplies. Adding is for "or" of disjoint events.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(two cards drawn without replacement are both aces). One step is wrong.', steps: [
      'P(the first card is an ace) = 4/52.',
      'The draws are independent, so P(the second is an ace) = 4/52 too.',
      `P(both aces) = (4/52)^{2} = ${frac(16, 52 * 52)}.`,
      'That is about 1 in 169.',
    ], errorStep: 1, explain: `Without replacement the draws are dependent: after an ace, 3 of the 51 cards left are aces. P = 4/52 × 3/51 = ${frac(12, 52 * 51)}.` },
    { type: 'check', scope: 'dependent draws', questions: [
      { hinge: true, make: (rng) => { const n = rng.int(8, 12), r = rng.int(4, n - 2), fo = r * (r - 1) * (r - 2), to = n * (n - 1) * (n - 2); return mc({ q: `A bag has ${r} red and ${n - r} blue balls. Three are drawn without replacement. What is P(all three red)?`, right: frac(fo, to),
        wrong: [[frac(r ** 3, n ** 3), 'multiplied the unchanged fraction, which assumes replacement'], [frac(fo, n ** 3), 'updated the reds but not the total'], [frac(r - 2, n - 2), 'gave only the last branch']],
        explain: `${r}/${n} × ${r - 1}/${n - 1} × ${r - 2}/${n - 2} = ${show(fo, to)}.` }, rng); } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'For several independent events with different chances, "at least one" is still one line: 1 − (1 − p_{1})(1 − p_{2})(1 − p_{3}).' },
    { type: 'check', scope: 'at least one of several', questions: [{ make: atLeastOneOf3Q }] },
    { type: 'callout', tone: 'speed', text: `Big deck, few draws: without replacement is close to with replacement. 13/52 × 12/51 ≈ ${dec(1 / 17, 4)} against (1/4)^{2} = ${dec(1 / 16, 4)}. Use the easy version to bracket, never as the answer when options are close.` },
    { type: 'check', scope: 'with replacement as a bracket', questions: [
      { type: 'choice', q: 'Two cards are dealt from a full deck without replacement. P(both hearts) is:', options: ['a little below 1/16', 'exactly 1/16', 'a little above 1/16'], answer: 0, stable: true, traps: { 1: 'treated the draws as with replacement: the answer when options are close must use 12/51', 2: 'one heart is gone, so the second chance is lower, not higher' }, explain: `13/52 × 12/51 = 1/17 ≈ ${dec(1 / 17, 4)}, just below 1/16 = ${dec(1 / 16, 4)}.` },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Independent → multiply: P(A and B) = P(A) × P(B); test it with P(A | B) = P(A). Disjoint is the opposite of independent. Without replacement → multiply the updated fractions.' },

    sec('contrast'),
    { type: 'compare', columns: ['', 'Disjoint', 'Independent'], rows: [
      ['Definition', 'P(A and B) = 0', 'P(A and B) = P(A) × P(B)'],
      ['Knowing A happened', 'B becomes impossible', 'B keeps its chance'],
      ['P(A or B)', 'P(A) + P(B)', 'P(A) + P(B) − P(A) × P(B)'],
      ['Picture', 'two separate circles', 'a vertical strip crossing a horizontal band'],
      ['Example', '"1" and "6" on one die', '"6" on the first die and "6" on the second'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: an event with chance 0 or 1 is independent of everything. If A and B are independent, so are A and not-B. Independence is about chances, not mechanics: on two dice, "first die shows 3" and "sum is 7" are independent.' },
    { type: 'check', scope: 'the table and the edge cases', questions: [
      { make: (rng) => { const a = rng.pick([0.2, 0.3, 0.5]), b = rng.pick([0.4, 0.5, 0.6]), ans = round(a + b - a * b, 4); return { type: 'number', q: `A and B are independent, P(A) = ${a}, P(B) = ${b}. What is P(A or B)?`, answer: ans, tolerance: 1e-9, hints: ['Addition rule, with the overlap from the product rule.'], explain: `${a} + ${b} − ${a} × ${b} = ${dec(ans, 4)}.` }; } },
      { type: 'choice', q: 'P(A) = 0. Is A independent of every other event B?', options: ['Yes', 'No'], answer: 0, stable: true, traps: { 1: 'P(A and B) = 0 = 0 × P(B), so the product rule holds' }, explain: 'An event with chance 0 (or 1) passes the test P(A and B) = P(A) × P(B) for every B.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: coin sequences and first-success waiting times in Beat the Odds, repeated dice games, and Likelihood List conjunctions where P(A and B) can never beat P(A). The next lessons multiply independent trials everywhere.' },
    { type: 'check', scope: 'multiplying independent trials', questions: [
      mc({ q: 'A fair coin is tossed four times. What is P(H, H, T, H in that order)?', right: frac(1, 16), at: 0,
        wrong: [[frac(4, 16), 'that is P(exactly three heads) in any order'], [frac(1, 8), 'multiplied three tosses, not four'], [frac(1, 2), 'used one toss only']],
        explain: 'The tosses are independent, so one fixed sequence is (1/2)^{4} = 1/16.' }),
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: withWithoutQ }, { make: atLeastOneOf3Q }, { make: diceIndepQ }] },
  ],
};
