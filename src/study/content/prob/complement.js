// Probability foundations 3: the complement. P(not A) = 1 − P(A); "at least one" via "none".
import { sec, frac, dec, nCr, mc, diceGrid } from './sample-spaces.js';

const atLeastSixQ = (rng) => {
  const n = rng.int(2, 5), t = 6 ** n, none = 5 ** n;
  return mc({ q: `${n} fair dice are thrown. What is P(at least one six)?`, right: frac(t - none, t),
    wrong: [[frac(n, 6), 'added 1/6 per die, which counts outcomes with several sixes more than once'], [frac(1, t), 'that is P(every die is a six)'], [frac(none, t), 'that is P(no six), the complement'], [frac(t - 1, t), 'took the complement of "all sixes" instead of "no six"']],
    hints: ['What does the complement "no six" look like for each die?', `No six: each die has 5 faces, so 5^{${n}} = ${none} of 6^{${n}} = ${t} outcomes.`],
    explain: `P(no six) = ${none}/${t}, so P(at least one) = 1 − ${none}/${t} = ${frac(t - none, t)} ≈ ${dec((t - none) / t)}.` }, rng);
};
const atLeastTwoHeadsQ = (rng) => {
  const n = rng.int(3, 7), t = 2 ** n;
  return mc({ q: `A fair coin is tossed ${n} times. What is P(at least two heads)?`, right: frac(t - 1 - n, t),
    wrong: [[frac(t - 1, t), 'used "no heads" as the whole complement and forgot "exactly one head"'], [frac(t - n, t), 'used "exactly one head" as the whole complement and forgot "no heads"'], [frac(1 + n, t), 'answered the complement itself']],
    hints: ['The complement of "at least two" is "zero or one".', `No heads: 1 sequence. Exactly one head: ${n} sequences (where the head goes).`],
    explain: `Complement: 1 + ${n} = ${1 + n} of ${t} sequences. P = 1 − ${1 + n}/${t} = ${frac(t - 1 - n, t)}.` }, rng);
};
const atLeastRedQ = (rng) => {
  const n = rng.int(8, 14), r = rng.int(2, 5), k = rng.int(2, 3), b = n - r;
  const tot = nCr(n, k), none = nCr(b, k);
  return mc({ q: `A bag holds ${n} balls, ${r} red and ${b} blue. ${k} are drawn without replacement. What is P(at least one red)?`, right: frac(tot - none, tot),
    wrong: [[frac(none, tot), 'that is P(no red), the complement'], [frac(k * r, n), 'added the chance of red per draw, counting overlaps twice'], [frac(tot - nCr(r, k), tot), 'took the complement of "all red" instead of "no red"'], [frac(r, n), 'stopped after the first draw'], [frac(n ** k - b ** k, n ** k), 'drew with replacement: 1 − (blue/total) to the power of the draws']],
    hints: ['Complement: every ball drawn is blue.', `No red: C(${b}, ${k}) = ${none} of C(${n}, ${k}) = ${tot} hands.`],
    explain: `P(no red) = C(${b}, ${k}) / C(${n}, ${k}) = ${none}/${tot}. P(at least one red) = ${frac(tot - none, tot)}.` }, rng);
};

const c48 = nCr(48, 2), c52 = nCr(52, 2), aceAny = c52 - c48;
const four = { t: 6 ** 4, none: 5 ** 4 };

export default {
  id: 'prob/complement',
  book: 'prob',
  kind: 'foundation',
  title: 'The complement: count what you do not want',
  summary: 'P(not A) = 1 − P(A). "At least one" is 1 − P(none): one block instead of many cases.',
  prerequisites: ['prob/sample-spaces', 'prob/counting'],
  objectives: [
    'Use P(not A) = 1 − P(A) whenever the complement is shorter to count',
    'Solve "at least one" questions for dice, coins, cards and urns as 1 − P(none)',
    'Name the correct complement of "at least k" and "not all"',
    'Sanity-check "at least one" answers against the quick n × p bound',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: four fair dice are thrown. What is P(at least one six)? Two approaches, then an answer.', answer: `1 − ${four.none}/${four.t} = ${frac(four.t - four.none, four.t)} ≈ ${dec((four.t - four.none) / four.t)}`, explain: `Direct counting splits into exactly one, two, three or four sixes. Adding 1/6 four times gives 4/6, too big, because throws with two or more sixes are counted repeatedly. The other side is one block: no six at all is 5^{4} = ${four.none} of 6^{4} = ${four.t} outcomes.`,
      attempts: [
        { id: 'perDie', label: 'Added 1/6 per die', approach: `Answered 4 × 1/6 = ${frac(4, 6)}.`, breaksAt: 'Throws with two or more sixes are counted several times; with seven dice the sum passes 1.' },
        { id: 'allSix', label: 'One minus all sixes', approach: `Took 1 − (1/6)^{4} = ${frac(four.t - 1, four.t)}.`, breaksAt: 'The opposite of "at least one six" is "no six", not "every die a six".' },
        { id: 'cases', label: 'Counted each case', approach: 'Split into exactly one, two, three and four sixes and added them.', breaksAt: 'It works, but it takes four counts where the complement, no six, takes one.' },
      ] },
    { type: 'text', text: 'The trigger words are **at least one**, **not all**, **some**, **any**. They describe a big event made of many cases; its opposite is usually one small block.' },
    { type: 'check', scope: 'spotting a complement question', questions: [
      mc({ q: 'Which of these is fastest through the complement?', right: 'P(at least one six in 5 dice)', at: 3,
        wrong: [['P(exactly one six in 5 dice)', 'the complement "not exactly one" is longer to count than the event'], ['P(the first die is a six)', 'one die: count it directly, 1/6'], ['P(all five dice show six)', 'a single outcome: count it directly']],
        explain: 'Directly, "at least one six" is five cases (1 to 5 sixes); its complement "no six" is one count, 5^{5} of 6^{5}.' }),
    ] },

    sec('why'),
    { type: 'text', text: '"At least one" questions are among the most common Beat the Odds items. Counted directly they split into many overlapping cases; through the complement they are one count and one subtraction.' },

    sec('anchor'),
    { type: 'text', text: 'You know favourable / total. Every outcome is either in A or not in A, never both. So favourable(A) + favourable(not A) = total. Divide both sides by the total:' },
    { type: 'formula', text: 'P(A) + P(not A) = 1, so P(not A) = 1 − P(A)' },
    { type: 'check', scope: 'P(not A) = 1 − P(A)', questions: [
      { make: (rng) => { const p = rng.int(5, 95) / 100; return { type: 'number', q: `P(A) = ${p}. What is P(not A)?`, answer: Math.round((1 - p) * 100) / 100, tolerance: 1e-9, explain: `1 − ${p} = ${dec(1 - p, 2)}.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'Picture the whole sample space as a square of area 1. A covers part of it; everything else is "not A". The two areas add to 1, so knowing one gives the other.' },
    { type: 'diagram', diagram: 'unitsquare', spec: { regions: [{ points: [[0, 0], [0.3, 0], [0.3, 1], [0, 1]], area: 0.3, label: 'A: 0.3', tone: 1 }, { points: [[0.3, 0], [1, 0], [1, 1], [0.3, 1]], area: 0.7, label: 'not A: 0.7', tone: 3 }] }, caption: 'The sample space as area 1. A and "not A" never overlap and together fill the square: 0.3 + 0.7 = 1.' },
    { type: 'check', scope: 'the unit square', questions: [
      { make: (rng) => { const a = rng.pick([0.15, 0.2, 0.25, 0.35, 0.4, 0.45]); return { type: 'number', q: `In the unit square, A has area ${a}. What is P(not A)?`, answer: Math.round((1 - a) * 100) / 100, explain: `A and "not A" fill the square without overlap, so P(not A) = 1 − ${a} = ${Math.round((1 - a) * 100) / 100}.` }; } },
    ] },
    { type: 'diagram', diagram: 'grid', spec: diceGrid((a, b) => a === 6 || b === 6), caption: 'Two dice, at least one six: an L of 11 cells along the edges. The other cells form a 5 × 5 block with no six: 36 − 25 = 11.' },
    { type: 'check', scope: 'the two-dice grid', questions: [
      { type: 'number', q: 'In the two-dice grid, how many cells have no six?', answer: 25, explain: 'First die 1 to 5 and second die 1 to 5: a 5 × 5 block.' },
      mc({ q: 'Two dice. What is P(at least one six)?', right: frac(11, 36), at: 1,
        wrong: [[frac(2, 6), 'added 1/6 + 1/6, counting (6, 6) twice'], [frac(1, 36), 'that is P(both sixes)'], [frac(25, 36), 'that is P(no six), the complement']],
        explain: '1 − 25/36 = 11/36.' }),
    ] },

    sec('atleast', '"At least one" = 1 − P(none)'),
    { type: 'text', text: 'For n dice, "no six anywhere" means every die shows 1 to 5: 5 choices per die, 5^{n} outcomes out of 6^{n}. So P(at least one six) = 1 − 5^{n}/6^{n}. The complement is one block; the direct count is a pile of overlapping cases.' },
    { type: 'formula', text: 'P(at least one) = 1 − P(none)' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 20, label: 'number of dice n' }, y: { min: 0, max: 1, label: 'P(at least one six)' }, curves: [{ label: '1 − (5/6)^n', points: Array.from({ length: 21 }, (_, n) => [n, 1 - (5 / 6) ** n]) }], hlines: [{ y: 0.5, label: 'one half' }], markers: [{ x: 4, y: 1 - (5 / 6) ** 4, label: `n = 4: ${dec(1 - (5 / 6) ** 4)}` }] }, caption: `P(at least one six) rises with every die, passes 1/2 at n = 4 (${dec(1 - (5 / 6) ** 4)}) and never reaches 1. The naive n/6 would hit 1 at n = 6.` },
    { type: 'check', scope: '1 − P(none) for dice', questions: [{ hinge: true, make: atLeastSixQ }] },

    sec('derivation'),
    { type: 'text', text: 'Two cards are drawn from a deck. P(at least one ace), one move at a time.' },
    { type: 'steps', steps: [
      { answers: 'allSix', say: 'Name the complement exactly: "at least one ace" fails only when **no** card is an ace.', why: 'The complement of "at least one" is "none", not "exactly one": a hand with two aces also has at least one.',
        checks: [mc({ q: 'What is the complement of "at least two heads in 5 tosses"?', right: 'at most one head', at: 2,
          wrong: [['no heads', 'forgot the outcomes with exactly one head'], ['exactly one head', 'forgot the outcome with no heads'], ['at most two heads', 'exactly two heads belongs to the event itself']],
          explain: 'Not "at least two" means 0 or 1 heads: at most one.' })] },
      { answers: 'cases', say: `Count the complement: no-ace hands are 2 cards from the 48 non-aces, C(48, 2) = ${c48}, out of C(52, 2) = ${c52} hands.`, why: 'Unordered hands on both sides: the convention matches (counting lesson).',
        checks: [{ type: 'number', q: 'C(48, 2) = ?', answer: c48, hints: ['48 × 47 ordered pairs.', 'Divide by 2.'], explain: `48 × 47 / 2 = ${c48}.` }] },
      { say: `Subtract: P(at least one ace) = 1 − ${c48}/${c52} = ${frac(aceAny, c52)} ≈ ${dec(aceAny / c52)}.`, why: 'The event and its complement share no hand and together cover every hand, so their probabilities add to 1.',
        checks: [{ make: (rng) => { const n = rng.int(8, 14), r = rng.int(2, 4), t = nCr(n, 2), no = nCr(n - r, 2); return mc({ q: `A pile of ${n} cards has ${r} red. Two are drawn. What is P(at least one red)?`, right: frac(t - no, t),
          wrong: [[frac(no, t), 'that is P(no red)'], [frac(2 * r, n), 'added the chance per card'], [frac(nCr(r, 2), t), 'that is P(both red)']], explain: `1 − C(${n - r}, 2)/C(${n}, 2) = 1 − ${no}/${t} = ${frac(t - no, t)}.` }, rng); } }] },
      { answers: 'perDie', say: `Sanity check: the quick guess 2 × 4/52 ≈ ${dec(8 / 52)} is a little above ${dec(aceAny / c52)}, because it counts hands with two aces twice.`, why: 'Adding per-card chances double-counts overlaps; the complement never does. The next lesson makes this exact.',
        checks: [mc({ q: 'Why is 2 × 4/52 larger than the true P(at least one ace in 2 cards)?', right: 'it counts the hands with two aces twice', at: 0,
          wrong: [['it forgets that the second card has only 51 choices', 'the gap comes from the overlap, the double-counted two-ace hands'], ['it is not larger', `2 × 4/52 ≈ ${dec(8 / 52)} is above ${dec(aceAny / c52)}`], ['it counts ordered hands', 'no hands are counted there, only per-card chances']],
          explain: 'Each card has chance 4/52 of being an ace; adding the two chances counts the two-ace hands in both terms.' })] },
    ] },
    { type: 'explain', prompt: 'Why is 1 − P(none) easier and safer than adding up the chance for each card or die?', model: '"None" is one block of outcomes, counted with one product or one C(·). The direct route needs exactly one, exactly two, and so on, and adding per-trial chances counts the overlaps more than once, which is how n/6 can pass 1.', points: ['The complement of "at least one" is "none"', '"None" is a single count: 5^{n} or C(48, k)', 'Adding per-trial chances counts overlaps several times'] },

    sec('predict'),
    { type: 'predict', question: 'Ten fair coins. Is P(at least one head) closer to 0.5, 0.9 or 0.999?', answer: `0.999: 1 − 1/2^{10} = 1 − 1/${2 ** 10} ≈ ${dec(1 - 1 / 1024, 4)}.`, explain: 'The only way to fail is all tails: one sequence out of 1024.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'P(at least one six in n dice) = n/6.', fix: 'That passes 1 at n = 7. It counts throws with several sixes repeatedly; use 1 − 5^{n}/6^{n}.' },
      { belief: 'The complement of "at least one" is "exactly one".', fix: 'It is "none".' },
      { belief: 'The complement of "at least two" is "none".', fix: 'It is "none or exactly one".' },
      { belief: 'P(at least one six) = 1 − (1/6)^{n}.', fix: 'That is the complement of "every die is a six".' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(at least two heads in 4 tosses). One step is wrong.', steps: [
      `4 tosses give 2^{4} = ${2 ** 4} equally likely sequences.`,
      'The complement of "at least two heads" is "no heads".',
      'No heads is only TTTT: 1 sequence.',
      `So P = 1 − 1/16 = ${frac(15, 16)}.`,
    ], errorStep: 1, explain: `The complement is "at most one head": no heads (1 sequence) or exactly one head (4 sequences). P = 1 − 5/16 = ${frac(11, 16)}.` },
    { type: 'check', scope: 'the complement of "at least two"', questions: [{ hinge: true, make: atLeastTwoHeadsQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Anchor values: (5/6)^{4} ≈ ${dec((5 / 6) ** 4, 2)}, so four dice give just over 1/2 for at least one six; (1/2)^{10} = 1/1024 ≈ 1/1000.` },
    { type: 'check', scope: 'anchor values', questions: [
      mc({ q: 'Four fair dice. Which is closest to P(at least one six)?', right: dec(1 - (5 / 6) ** 4, 2), at: 1,
        wrong: [[dec(4 / 6, 2), 'added 4 × 1/6: that is only an upper bound'], [dec((5 / 6) ** 4, 2), 'that is P(no six)'], [dec((1 / 6) ** 4, 4), 'that is P(four sixes)']],
        explain: `1 − (5/6)^{4} = 1 − ${four.none}/${four.t} ≈ ${dec(1 - (5 / 6) ** 4, 3)}.` }),
    ] },
    { type: 'callout', tone: 'speed', text: `The quick sum n × (chance per trial) is always an upper bound for "at least one", and close when it is small: two dice give 2/6 ≈ ${dec(2 / 6, 2)} against the true ${dec(11 / 36, 2)}. Use it to bracket the answer, never as the answer.` },
    { type: 'check', scope: 'the quick sum is an upper bound', questions: [
      mc({ q: 'Three fair dice. The quick sum gives 3 × 1/6 = 0.5. What is P(at least one six), to 2 decimals?', right: dec(1 - (5 / 6) ** 3, 2), at: 0,
        wrong: [['0.5', 'took the quick sum as the answer: it is only an upper bound'], [dec((5 / 6) ** 3, 2), 'that is P(no six), the complement']],
        explain: `1 − (5/6)^{3} = 1 − 125/216 ≈ ${dec(1 - (5 / 6) ** 3, 2)}: just under the bound 0.5, because the sum counts throws with two sixes more than once.` }),
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: '"At least one" → 1 − P(none). "At least k" → 1 − P(fewer than k). Count whichever side is shorter.' },

    sec('contrast'),
    { type: 'compare', columns: ['Event', 'Complement', 'Count the complement as'], rows: [
      ['At least one six in n dice', 'no six', '5^{n} of 6^{n}'],
      ['At least two heads in n tosses', 'zero or one head', '1 + n of 2^{n}'],
      ['Not all three dice the same', 'all three the same', `6 of ${6 ** 3}`],
      ['At least one ace in k cards', 'no ace', 'C(48, k) of C(52, k)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: P(A) = 0 exactly when P(not A) = 1. With zero trials, "at least one" is impossible: 1 − 1 = 0. The complement of the complement is the event itself.' },
    { type: 'check', scope: 'the contrast table', questions: [
      mc({ q: 'Three fair dice. What is P(not all the same)?', right: frac(216 - 6, 216), at: 2,
        wrong: [[frac(6, 216), 'that is P(all the same)'], [frac(6 * 5 * 4, 216), 'that is P(all different), which also excludes throws with exactly one pair'], [frac(215, 216), 'only removed (6, 6, 6), not all six triples']],
        explain: `All the same: 6 of 216 throws. 1 − 6/216 = ${frac(210, 216)}.` }),
      { type: 'number', q: 'A coin is tossed 0 times. What is P(at least one head)?', answer: 0, explain: 'With no tosses, "no head" is certain: 1 − 1 = 0.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the birthday problem is 1 − P(all birthdays different); the at-least-one family in Beat the Odds; Likelihood List rows saying "at least one" are usually large. Whenever the direct count splits into cases, try the other side.' },
    { type: 'check', scope: 'the other side elsewhere', questions: [
      { type: 'choice', q: 'P(at least two of 23 people share a birthday) is 1 minus the probability of which event?', options: ['all 23 birthdays are different', 'exactly two share a birthday', 'nobody is born on 1 January', 'all 23 share one birthday'], answer: 0, traps: { 1: 'that is one case of the event, not its complement', 2: 'that is the complement of a different event', 3: 'that is the complement of "not all the same"' }, explain: '"At least two share" fails only when every birthday is different, so P = 1 − P(all different), one product.' },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: atLeastSixQ }, { make: atLeastTwoHeadsQ }, { make: atLeastRedQ }] },
  ],
};
