// 80-in-8: two or three operations in one line. Brackets, then × and ÷ left to right, then + and −
// left to right; a minus in front of brackets flips the signs inside.
import { sec, mc, N, check, cum } from './shared.js';

const pool = [
  // 0 recognise what goes first
  (rng) => { const a = rng.int(5, 40), b = rng.int(3, 12), c = rng.int(3, 12), op = rng.pick(['+', '−']); return mc({ q: `In ${a} ${op} ${b} × ${c}, which part is worked out first?`, right: `${b} × ${c}`, wrong: [[`${a} ${op} ${b}`, 'left to right is only for operations of equal rank'], [`${a} × ${c}`, 'those two numbers are not next to each other'], ['Any order gives the same', `(${a} ${op} ${b}) × ${c} is different`]], explain: `× before ${op}: ${b} × ${c} = ${b * c} first.` }, rng); },
  // 1 a product is one quantity
  (rng) => { const a = rng.int(2, 9), b = rng.int(2, 6), c = rng.int(2, 9); return N(`${a} + ${b} × ${c} = ?`, a + b * c, `${b} × ${c} = ${b * c} is one quantity; ${a} + ${b * c} = ${a + b * c}.`); },
  // 2 × before +
  (rng) => { const a = rng.int(5, 60), b = rng.int(3, 12), c = rng.int(3, 12); return N(`${a} + ${b} × ${c} = ?`, a + b * c, `${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${a + b * c}.`); },
  // 3 × before −
  (rng) => { const b = rng.int(3, 12), c = rng.int(3, 12), a = b * c + rng.int(5, 80); return N(`${a} − ${b} × ${c} = ?`, a - b * c, `${b} × ${c} = ${b * c}, then ${a} − ${b * c} = ${a - b * c}.`); },
  // 4 two products
  (rng) => { const a = rng.int(3, 12), b = rng.int(3, 12), c = rng.int(3, 12), d = rng.int(3, 12); return N(`${a} × ${b} + ${c} × ${d} = ?`, a * b + c * d, `${a * b} + ${c * d} = ${a * b + c * d}.`); },
  // 5 ÷ and × left to right
  (rng) => { const b = rng.int(2, 9), c = rng.int(2, 9), m = rng.int(2, 9), a = b * c * m; return N(`${a} ÷ ${b} × ${c} = ?`, (a / b) * c, `Left to right: ${a} ÷ ${b} = ${a / b}, × ${c} = ${(a / b) * c}.`); },
  // 6 brackets first
  (rng) => { const a = rng.int(3, 19), b = rng.int(3, 19), c = rng.int(3, 9), d = rng.int(2, 30); return N(`(${a} + ${b}) × ${c} − ${d} = ?`, (a + b) * c - d, `${a + b} × ${c} = ${(a + b) * c}, − ${d} = ${(a + b) * c - d}.`); },
  // 7 minus before brackets
  (rng) => { const a = rng.int(150, 900), b = rng.int(40, 140), c = rng.int(11, b - 5); return N(`${a} − (${b} − ${c}) = ?`, a - b + c, `${b} − ${c} = ${b - c}; ${a} − ${b - c} = ${a - b + c}. Or flip the inner sign: ${a} − ${b} + ${c}.`); },
  // 8 the left-to-right option
  (rng) => { const a = rng.int(5, 30), b = rng.int(3, 9), c = rng.int(3, 9), v = a + b * c; return mc({ q: `Which option is ${a} + ${b} × ${c}?`, right: String(v), wrong: [[String((a + b) * c), 'worked left to right'], [String(a + b + c), 'turned the × into a +'], [String(v + b), `${b} × ${c} slipped to ${b * (c + 1)}`]], explain: `${b} × ${c} = ${b * c} first: ${v}.` }, rng); },
  // 9 name the slip
  (rng) => { const b = rng.int(2, 6), c = rng.int(2, 6), m = rng.int(2, 9), a = b * c * m; if (b === c) return N(`${a} ÷ ${b} × ${c + 1} = ?`, (a / b) * (c + 1), `Left to right: ${a / b} × ${c + 1}.`); return mc({ q: `A candidate answers ${a} ÷ ${b} × ${c} = ${m}. What went wrong?`, right: 'Multiplied before dividing', wrong: [['Divided before multiplying', `that is the right order and gives ${(a / b) * c}`], ['Ignored a bracket', 'there are no brackets'], ['A times-table slip', `${b} × ${c} = ${b * c} was right; the order was not`]], explain: `${a} ÷ (${b} × ${c}) = ${m}, but × and ÷ have equal rank: left to right, ${a / b} × ${c} = ${(a / b) * c}.` }, rng); },
];

export default {
  id: 'mm/mixed',
  book: 'mm',
  kind: 'family',
  family: 'mm-mixed',
  title: 'Order of operations',
  summary: 'Brackets first; then × and ÷ from left to right; then + and − from left to right. A minus in front of brackets flips every sign inside. The left-to-right reading is always one of the wrong options.',
  prerequisites: ['mm/multiply'],
  objectives: [
    'Evaluate a line of two or three operations in the right order',
    'Treat × and ÷ (and + and −) as equal ranks worked left to right',
    'Remove brackets after a minus by flipping the signs inside',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: 12 + 8 × 5, then 48 ÷ 4 × 3. Try two different orders for each.', answer: '52 and 36.',
      explain: '12 + 8 × 5 = 12 + 40 = 52 (× before +). 48 ÷ 4 × 3: ÷ and × have equal rank, so left to right: 12 × 3 = 36.',
      attempts: [
        { id: 'lefttoright', label: 'Straight left to right', approach: '12 + 8 = 20, × 5 = 100.', breaksAt: '× binds tighter than +: 8 × 5 is one quantity added to 12.' },
        { id: 'timesfirst', label: '× always before ÷', approach: '4 × 3 = 12, then 48 ÷ 12 = 4.', breaksAt: '× and ÷ are one rank; the leftmost goes first.' },
      ] },
    { type: 'text', text: 'The cue: two or more operation signs in one line, or brackets. The question is built so that reading it left to right gives one of the four options.' },
    check(pool, 0, 'what goes first'),

    sec('why'),
    { type: 'text', text: 'Every mixed line has a "left to right" trap waiting among the options, and it looks just as plausible as the right answer. The order of operations is the whole question; the arithmetic is easy.' },
    check(pool, 0, 'what goes first'),

    sec('anchor'),
    { type: 'text', text: 'You know that 3 × 4 is three fours, a single amount. **One change**: in 2 + 3 × 4 that amount is added to 2. So the product is worked out first: 2 + 12 = 14.' },
    check(pool, 1, 'a product is one quantity'),

    sec('picture'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 16, step: 2, start: 2, target: 14, marks: [{ x: 6, label: '+4' }, { x: 10, label: '+4' }] }, caption: '2 + 3 × 4 on a number line: start at 2 and take three jumps of 4. You land on 14, not on (2 + 3) × 4 = 20.' },
    check(pool, 3, '× before + and −'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['line', 'left to right (wrong)', 'by rank (right)'], rows: [['12 + 8 × 5', '20 × 5 = 100', '12 + 40 = 52'], ['48 ÷ 4 × 3', '48 ÷ 12 = 4', '12 × 3 = 36'], ['500 − (90 − 25)', '500 − 90 − 25 = 385', '500 − 65 = 435']] }, caption: 'Three lines read two ways. The middle column is what the wrong options are made of; the right column follows the ranks.' },
    check(pool, 5, 'equal ranks'),
    { type: 'diagram', diagram: 'flow', spec: { root: 'b', nodes: [
      { id: 'b', text: 'Any brackets? Work them out first', kind: 'q' },
      { id: 'md', text: 'Then × and ÷, left to right', kind: 'q' },
      { id: 'as', text: 'Then + and −, left to right', kind: 'q' },
      { id: 'done', text: 'Check the size, then tap', kind: 'a' },
    ], edges: [{ from: 'b', to: 'md' }, { from: 'md', to: 'as' }, { from: 'as', to: 'done' }] }, caption: 'The order of operations as three passes over the line. Inside each pass, equal ranks go left to right.' },
    check(pool, 6, 'brackets'),

    sec('derivation'),
    { type: 'text', text: 'Four moves, one per pass, plus the sign rule for brackets.' },
    { type: 'steps', steps: [
      { say: 'Brackets first: (12 + 8) × 5 = 20 × 5 = 100.', why: 'Brackets say "this is one quantity"; nothing outside can split it.', checks: [cum(pool, 6)] },
      { answers: 'lefttoright', say: 'Then every × and ÷: 12 + 8 × 5 → 12 + 40.', why: 'A product or quotient is one quantity, like a bracket you do not see.', checks: [cum(pool, 4)] },
      { answers: 'timesfirst', say: '× and ÷ are one rank: go left to right. 48 ÷ 4 × 3 = 12 × 3 = 36.', why: '÷ 4 × 3 means "÷ 4, then × 3"; multiplying first would divide by 12 instead.', checks: [cum(pool, 5)] },
      { say: 'A minus in front of brackets flips every sign inside: 500 − (90 − 25) = 500 − 90 + 25 = 435.', why: 'Taking away (90 − 25) takes away 90 but gives back the 25.', checks: [cum(pool, 7)] },
    ] },
    { type: 'explain', prompt: 'Why is 48 ÷ 4 × 3 equal to 36 and not 4?', model: '× and ÷ have the same rank, so they are done in the order they appear. 48 ÷ 4 = 12 first, then 12 × 3 = 36. Doing 4 × 3 first would change the question into 48 ÷ 12, a different calculation.', points: ['Equal rank: left to right', '48 ÷ 4 first', 'Multiplying first divides by 12'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-mixed', section: 'mm', difficulty: 1, seed: 'a', intro: 'A sum or difference with one product. Answer first.' },
    { type: 'worked', family: 'mm-mixed', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'The first pass is given; finish it.' },
    { type: 'thinkaloud', problem: '48 ÷ 4 × 3 = ?', lines: [
      { t: 0, say: 'Two operations of the same rank, no brackets.' },
      { t: 1, say: '4 × 3 = 12, so 48 ÷ 12 = 4.', slip: true },
      { t: 2, say: 'No: equal rank goes left to right. 48 ÷ 4 = 12 first.' },
      { t: 3, say: '12 × 3 = 36. One option was 4: that is the trap. Tap 36.' },
    ] },
    check(pool, 8, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '12 + 8 × 5: is the answer more or less than 100?', answer: 'Less: 52. 100 is (12 + 8) × 5, the left-to-right trap.', explain: 'A sum with one product is the product plus a little: 40 + 12.' },

    sec('traps'),
    { type: 'traps', family: 'mm-mixed', section: 'mm', extra: [
      { belief: 'Work left to right like reading.', fix: 'Only within one rank. × and ÷ come before + and −.' },
      { belief: '× always comes before ÷.', fix: 'They are one rank: the leftmost first. 48 ÷ 4 × 3 = 36.' },
      { belief: 'Brackets after a minus can just be dropped.', fix: 'Flip every sign inside: 500 − (90 − 25) = 500 − 90 + 25.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out 500 − (90 − 25). One step is wrong.', steps: ['Drop the brackets: 500 − 90 − 25.', '500 − 90 = 410.', '410 − 25 = 385.'], errorStep: 0, explain: 'The minus in front flips the inner sign: 500 − 90 + 25 = 435. Or do the bracket first: 500 − 65 = 435.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 9), mc({ q: 'Options for 6 × 7 + 4 × 9 are 78, 84, 414, 594. Which belief gives 414?', right: 'Left to right, ignoring rank', wrong: [['Add the middle two numbers first', 'that gives 6 × 11 × 9 = 594'], ['A times-table slip in 6 × 7', 'that gives 84'], ['Both products first, then add', 'that is right and gives 78']], explain: '(6 × 7 + 4) × 9 = 46 × 9 = 414. By rank: 42 + 36 = 78.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Read the line once, find the × or ÷ and compute it while you read the rest; the answer is that product plus or minus the loose number. Brackets after a minus: flip the inner signs instead of working the bracket out.' },
    check(pool, 9, 'reading at speed'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Brackets, then × ÷, then + −; equal ranks left to right. A minus before brackets flips the signs inside.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Line', 'First', 'Answer'], rows: [['12 + 8 × 5', '8 × 5', '52'], ['(12 + 8) × 5', '12 + 8', '100'], ['48 ÷ 4 × 3', '48 ÷ 4', '36'], ['48 ÷ (4 × 3)', '4 × 3', '4'], ['500 − (90 − 25)', '90 − 25', '435']] },
    check(pool, 9, 'choosing the order'),
    { type: 'variation', base: 'Base: 12 + 8 × 5 = 52.', rows: [
      { change: 'Brackets around 12 + 8', effect: '(12 + 8) × 5 = 100.' },
      { change: '× 5 becomes ÷ 4', effect: '12 + 8 ÷ 4 = 14: ÷ also goes before +.' },
      { same: true, change: 'Written as 8 × 5 + 12', effect: 'No change: 52. The product is still one quantity.' },
      { fusion: true, change: '+ becomes − AND brackets around 12 − 8', effect: '(12 − 8) × 5 = 20.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a line of only + and − is plain left to right (50 − 20 + 5 = 35, not 25). A line of only × and ÷ too (60 ÷ 5 × 2 = 24).' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a P&L is a sum of products (quantity × price), and a spreadsheet formula follows exactly these ranks.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const a = rng.int(2, 6), p = rng.pick([15, 25, 35]), b = rng.int(2, 6), q = rng.pick([12, 20, 30]); return N(`A trader buys ${a} lots of ${p} and ${b} lots of ${q}. Total units: ${a} × ${p} + ${b} × ${q} = ?`, a * p + b * q, `Products first: ${a * p} + ${b * q} = ${a * p + b * q}.`); } },
      far: N('Outside the test: a taxi charges 4 plus 2 per km. What does a 7 km ride cost? (4 + 2 × 7)', 18, '2 × 7 = 14 first, then 4 + 14 = 18.'),
      principle: mc({ q: 'Which idea carried over from the lots to the taxi?', right: 'Products first, then the sum', wrong: [['Work strictly left to right', 'that gives (4 + 2) × 7 = 42'], ['Flip the signs inside brackets', 'there were no brackets'], ['Divide before multiplying', 'nothing was divided']], explain: 'Both are a fixed amount plus a product (rate × quantity): the product is one quantity.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-mixed', section: 'mm', count: 3 },
  ],
};
