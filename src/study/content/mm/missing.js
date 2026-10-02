// 80-in-8: the missing number. Undo the operation with its inverse, except when the blank is
// the second number of a − or ÷; then put the answer back in before tapping.
import { sec, mc, N, check, cum, r3 } from './shared.js';

const SHAPES = [
  (b, c) => [`? + ${b} = ${c}`, `${c} − ${b}`, [[`${c} + ${b}`, 'undid + with another +'], [`${b} − ${c}`, 'took the numbers in the wrong order'], [`${c} × ${b}`, 'changed the operation family']]],
  (b, c) => [`? − ${b} = ${c}`, `${c} + ${b}`, [[`${c} − ${b}`, 'undid − with another −: the blank is where you start'], [`${b} − ${c}`, 'took the numbers in the wrong order'], [`${c} ÷ ${b}`, 'changed the operation family']]],
  (b, c) => [`${c + b} − ? = ${c}`, `${c + b} − ${c}`, [[`${c + b} + ${c}`, 'the blank is what was taken away, so it is smaller than the first number'], [`${c} − ${c + b}`, 'that is negative'], [`${c + b} × ${c}`, 'changed the operation family']]],
];

const pool = [
  // 0 recognise the inverse
  (rng) => { const b = rng.int(12, 98), c = rng.int(120, 600), [text, right, wrong] = rng.pick(SHAPES)(b, c); return mc({ q: `Which calculation finds the missing number in ${text}?`, right, wrong, explain: `Undo the operation: ${right}. Then put it back in to check.` }, rng); },
  // 1 fact family
  (rng) => { const a = rng.int(6, 19), b = rng.int(4, 19); return N(`${a} + ${b} = ${a + b}. So ${a + b} − ${b} = ?`, a, `The same fact read backwards: ${a}.`); },
  // 2 ? + b = c
  (rng) => { const x = rng.int(120, 899), b = rng.int(12, 98); return N(`? + ${b} = ${x + b}`, x, `? = ${x + b} − ${b} = ${x}.`); },
  // 3 ? − b = c
  (rng) => { const c = rng.int(120, 899), b = rng.int(12, 98); return N(`? − ${b} = ${c}`, c + b, `Start from the blank, take ${b}, land on ${c}: ? = ${c} + ${b} = ${c + b}.`); },
  // 4 a − ? = c
  (rng) => { const a = rng.int(300, 999), c = rng.int(112, a - 21); return N(`${a} − ? = ${c}`, a - c, `The blank is what was taken away: ${a} − ${c} = ${a - c}.`); },
  // 5 ? × b = c
  (rng) => { const b = rng.int(3, 9), x = rng.int(12, 99); return N(rng.chance(0.5) ? `? × ${b} = ${b * x}` : `${b} × ? = ${b * x}`, x, `? = ${b * x} ÷ ${b} = ${x}.`); },
  // 6 a ÷ ? = c
  (rng) => { const x = rng.int(6, 39), c = rng.int(12, 39); return N(`${x * c} ÷ ? = ${c}`, x, `The blank is the divisor: ${x * c} ÷ ${c} = ${x}.`); },
  // 7 ? ÷ b = c
  (rng) => { const b = rng.int(3, 9), c = rng.int(12, 99); return N(`? ÷ ${b} = ${c}`, b * c, `? = ${c} × ${b} = ${b * c}.`); },
  // 8 decimals
  (rng) => { const a = rng.int(12, 89), x = rng.int(11, 59) / 10; if (Number.isInteger(x)) return N('66 × ? = 138.6', 2.1, '? = 138.6 ÷ 66 = 2.1.'); return N(`${a} × ? = ${r3(a * x)}`, x, `? = ${r3(a * x)} ÷ ${a}: ignore the point, ${Math.round(a * x * 10)} ÷ ${a} = ${Math.round(x * 10)}, then one decimal place: ${x}.`); },
  // 9 put it back
  (rng) => { const b = rng.int(3, 9), c = rng.int(12, 49), x = b * c; return mc({ q: `Which option makes ? ÷ ${b} = ${c} true?`, right: String(x), wrong: [[String(x - b), `${x - b} ÷ ${b} = ${c - 1}: one group too few`], [String(x + b), `${x + b} ÷ ${b} = ${c + 1}: one group too many`], [String(c + b), `added ${b} instead of multiplying`]], explain: `Put it back: ${x} ÷ ${b} = ${c}.` }, rng); },
];

export default {
  id: 'mm/missing',
  book: 'mm',
  kind: 'family',
  family: 'mm-missing',
  title: 'Missing number',
  summary: 'Undo the operation with its inverse: + with −, − with +, × with ÷, ÷ with ×. When the blank is the second number of a − or ÷, the missing number is a − c or a ÷ c. Then put it back in.',
  prerequisites: ['mm/divide'],
  objectives: [
    'Choose the right inverse for a blank anywhere in +, −, × or ÷',
    'Spot the two exceptions (a − ? and a ÷ ?) before calculating',
    'Check a missing-number answer by putting it back in, for whole numbers and decimals',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: fill the blanks. ? − 48 = 175, 312 − ? = 175, 735 ÷ ? = 15. Try two ways for the first.', answer: '223, 137 and 49.',
      explain: '? − 48 = 175: start from the blank, take 48, land on 175, so ? = 175 + 48 = 223. 312 − ? = 175: the blank is what was taken away, 312 − 175 = 137. 735 ÷ ? = 15: the blank is the divisor, 735 ÷ 15 = 49.',
      attempts: [
        { id: 'same', label: 'Undid − with −', approach: '? − 48 = 175, so ? = 175 − 48 = 127.', breaksAt: '127 − 48 = 79, not 175. The blank is where you started, so add back.' },
        { id: 'always', label: 'Always used the inverse', approach: '312 − ? = 175, so ? = 312 + 175 = 487.', breaksAt: '312 − 487 is negative. When the blank is the number taken away, it is 312 − 175.' },
      ] },
    { type: 'text', text: 'The cue: a ? on the left of the = sign, with the result on the right: 66 × ? = 138.6, ? − 48 = 175, 735 : ? = 15. About one question in five has this shape.' },
    check(pool, 0, 'choosing the inverse'),

    sec('why'),
    { type: 'text', text: 'The arithmetic is the same as a direct question; the risk is the direction. The most tempting wrong option is always the answer to the inverse taken the wrong way round, and it costs a point.' },
    check(pool, 0, 'choosing the inverse'),

    sec('anchor'),
    { type: 'text', text: 'You know fact families: 8 + 5 = 13 means 13 − 5 = 8 and 13 − 8 = 5. **One change**: the blank is one member of a family; read the family the other way to find it.' },
    check(pool, 1, 'fact families'),

    sec('picture'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 150, max: 250, step: 25, start: 175, target: 223, marks: [{ x: 200, label: '+48 to undo −48' }] }, caption: '? − 48 = 175: the blank is a start point that lands on 175 after a step of −48. Walking back from 175 means +48: 223.' },
    check(pool, 3, 'undoing −'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['blank is…', 'example', 'missing number'], rows: [['first of +', '? + 48 = 175', '175 − 48'], ['first of −', '? − 48 = 175', '175 + 48'], ['second of −', '312 − ? = 175', '312 − 175'], ['either of ×', '66 × ? = 138.6', '138.6 ÷ 66'], ['first of ÷', '? ÷ 6 = 37', '37 × 6'], ['second of ÷', '735 ÷ ? = 15', '735 ÷ 15']] }, caption: 'The inverse for every position. Two rows break the pattern: when the blank is the second number of − or ÷, you use the same operation again.' },
    check(pool, 6, 'all positions'),
    { type: 'diagram', diagram: 'flow', spec: { root: 'q', nodes: [
      { id: 'q', text: 'Where is the ?', kind: 'q' },
      { id: 'first', text: 'First number, or either side of + or ×', kind: 'q' },
      { id: 'second', text: 'Second number of − or ÷', kind: 'q' },
      { id: 'inv', text: 'Use the inverse: + ↔ −, × ↔ ÷', kind: 'a' },
      { id: 'same', text: 'Same operation: a − c or a ÷ c', kind: 'a' },
      { id: 'back', text: 'Put it back in, then tap', kind: 'note' },
    ], edges: [{ from: 'q', to: 'first' }, { from: 'q', to: 'second' }, { from: 'first', to: 'inv' }, { from: 'second', to: 'same' }, { from: 'inv', to: 'back' }, { from: 'same', to: 'back' }] }, caption: 'One question decides the move: is the blank the second number of a − or a ÷? Every path ends with the same check.' },
    check(pool, 7, 'the decision'),

    sec('derivation'),
    { type: 'text', text: 'Four moves, in the order you meet the question.' },
    { type: 'steps', steps: [
      { say: 'Find the blank and the operation next to it.', why: 'The position decides the inverse; the numbers come later.', checks: [cum(pool, 0)] },
      { answers: 'same', say: 'Blank first, or either side of + and ×: use the inverse. ? − 48 = 175 → 175 + 48 = 223; ? × 6 = 222 → 222 ÷ 6 = 37.', why: 'The inverse undoes what was done to the blank.', checks: [cum(pool, 5)] },
      { answers: 'always', say: 'Blank second of − or ÷: the same operation. 312 − ? = 175 → 312 − 175 = 137; 735 ÷ ? = 15 → 735 ÷ 15 = 49.', why: 'The blank is the gap between the two numbers, or how many times one fits in the other.', checks: [cum(pool, 6)] },
      { say: 'Put it back in: 223 − 48 = 175. With decimals, also check the size: 66 × 2.1 ≈ 140.', why: 'One substitution catches an inverse taken the wrong way round.', checks: [cum(pool, 9)] },
    ] },
    { type: 'explain', prompt: 'Why is 312 − ? = 175 solved with a subtraction, but ? − 48 = 175 with an addition?', model: 'In ? − 48 = 175 the blank is the starting number: 48 was taken from it, so adding 48 back recovers it. In 312 − ? = 175 the blank is the amount taken away: it is the gap between 312 and 175, which is a subtraction.', points: ['Blank as the start: add back', 'Blank as the amount taken: the gap', 'Position decides, not the sign'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-missing', section: 'mm', difficulty: 1, seed: 'a', intro: 'A blank on the left. Answer first, then read the steps.' },
    { type: 'worked', family: 'mm-missing', section: 'mm', difficulty: 3, seed: 'b', fade: 1, intro: 'A decimal blank. The inverse is given; finish it.' },
    { type: 'thinkaloud', problem: '735 ÷ ? = 15', lines: [
      { t: 0, say: 'Blank on the left, next to a ÷.' },
      { t: 1, say: 'Undo ÷ with ×: 735 × 15.', slip: true },
      { t: 2, say: 'No: that is over 10000, and dividing 735 by it gives far less than 15. The blank is the divisor: same operation.' },
      { t: 4, say: '735 ÷ 15: 15 × 50 = 750, one 15 less: 49.' },
      { t: 6, say: 'Put it back: 735 ÷ 49 = 15, since 49 × 15 = 735. Tap 49.' },
    ] },
    check(pool, 8, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '312 − ? = 175: is the blank bigger or smaller than 175?', answer: 'Smaller: 312 − 175 = 137. Taking 137 from 312 leaves 175.', explain: 'Ask what the blank is (the amount taken away) before you choose the operation.' },

    sec('traps'),
    { type: 'traps', family: 'mm-missing', section: 'mm', extra: [
      { belief: 'Undo − with −.', fix: '? − 48 = 175 needs + 48: the blank is where you start.' },
      { belief: 'Always use the inverse.', fix: 'Not when the blank is the second number of − or ÷: 312 − ? = 175 is 312 − 175.' },
      { belief: 'Dividing the result again undoes a division.', fix: '? ÷ 6 = 37 needs × 6: 222.' },
    ] },
    { type: 'erroneous', problem: 'A candidate fills 312 − ? = 175. One step is wrong.', steps: ['The operation is −, so undo it with +.', '? = 312 + 175 = 487.', 'Tap 487.'], errorStep: 0, explain: 'The blank is the amount taken away, so it is the gap: 312 − 175 = 137. Putting 487 back in gives 312 − 487 < 0, not 175.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 9), mc({ q: 'Options for ? − 48 = 175 are 127, 213, 223, 233. Which belief gives 127?', right: 'Undo − with another −', wrong: [['A dropped carry', 'that gives 213'], ['Always use the inverse', 'here the inverse is right and gives 223'], ['A carry too many', 'that gives 233']], explain: '175 − 48 = 127 subtracts again. The blank is the start: 175 + 48 = 223.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Decimal blanks: ignore the point, find the digits, then place the point by size. 66 × ? = 138.6: 1386 ÷ 66 = 21, and 66 × 2 ≈ 132, so 2.1.' },
    check(pool, 9, 'decimal blanks'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Blank first, or beside + or ×: inverse. Blank second of − or ÷: same operation. Then put it back in.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Move', 'Answer'], rows: [['? + 48 = 175', '175 − 48', '127'], ['? − 48 = 175', '175 + 48', '223'], ['312 − ? = 175', '312 − 175', '137'], ['? × 6 = 222', '222 ÷ 6', '37'], ['? ÷ 6 = 37', '37 × 6', '222'], ['735 ÷ ? = 15', '735 ÷ 15', '49']] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: 'Base: ? − 48 = 175, so ? = 223.', rows: [
      { change: '− becomes +', effect: '? + 48 = 175: ? = 127.' },
      { change: 'The blank moves: 223 − ? = 175', effect: 'Now the blank is taken away: 223 − 175 = 48.' },
      { same: true, change: 'Written the other way round: 175 = ? − 48', effect: 'No change: 223. The sides of = can swap.' },
      { fusion: true, change: '− becomes ÷ AND 48 becomes 5', effect: '? ÷ 5 = 175: ? = 875.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: × is symmetric, so 66 × ? and ? × 66 are the same question. + is symmetric too. Only − and ÷ care which side the blank is on.' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: backing out an entry price from a P&L, or a quantity from a total cost, is a missing number; so is solving for x in any one-step equation.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const b = rng.int(12, 98), c = rng.int(120, 600); return N(`A trader sold ${b} lots and now holds ${c}. How many did they hold before?`, b + c, `? − ${b} = ${c}: ? = ${c} + ${b} = ${b + c}.`); } },
      far: N('Outside the test: a cake needs 3 eggs. You used 27 eggs. How many cakes?', 9, '? × 3 = 27: ? = 27 ÷ 3 = 9.'),
      principle: mc({ q: 'Which idea carried over from the lots to the eggs?', right: 'Undo the step with its inverse', wrong: [['Repeat the same operation', 'that is only for a blank second in − or ÷'], ['Bracket between two round numbers', 'nothing needed bracketing'], ['Count up to a round number', 'that is a way to subtract, not to choose']], explain: 'Both undo what was done to the unknown: add back 48 lots, divide out 3 eggs a cake.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-missing', section: 'mm', count: 3 },
  ],
};
