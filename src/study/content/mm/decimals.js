// 80-in-8: decimals. Place value first; then moving the point for powers of ten, lining up points
// to add and subtract, counting decimal places to multiply, and making the divisor whole to divide.
import { sec, mc, N, check, cum, r3 } from './shared.js';

const d1 = (rng, lo, hi) => { for (;;) { const m = rng.int(lo, hi); if (m % 10) return m / 10; } };
const d2 = (rng, lo, hi) => { for (;;) { const m = rng.int(lo, hi); if (m % 10) return m / 100; } };
const s = (x) => String(r3(x));

const pool = [
  // 0 recognise: where does the point go in a product
  (rng) => { const a = rng.int(2, 9), b = rng.int(2, 9), p = a * b; return mc({ q: `0.${a} × 0.${b} = ?`, right: s(p / 100), wrong: [[s(p / 10), 'counted one decimal place instead of two'], [s(p / 1000), 'counted three decimal places'], [s((a + b) / 10), 'added the digits instead of multiplying']], explain: `${a} × ${b} = ${p}; one place + one place = two places: ${s(p / 100)}.` }, rng); },
  // 1 place value
  (rng) => { const x = d2(rng, 101, 999); return N(`${s(x)} is how many hundredths?`, Math.round(x * 100), `${s(x)} = ${Math.round(x * 100)} hundredths: move the point two places right.`); },
  // 2 powers of ten
  (rng) => { const x = d2(rng, 101, 9999), k = rng.int(1, 3), times = rng.chance(0.5), r = Number((times ? x * 10 ** k : x / 10 ** k).toPrecision(10)); return N(`${s(x)} ${times ? '×' : '÷'} ${10 ** k} = ?`, r, `${10 ** k} has ${k} zero${k > 1 ? 's' : ''}: the point moves ${k} place${k > 1 ? 's' : ''} ${times ? 'right' : 'left'}, giving ${r}.`); },
  // 3 add, points lined up
  (rng) => { const x = d1(rng, 11, 99), y = d2(rng, 101, 999); return N(`${s(x)} + ${s(y)} = ?`, r3(x + y), `Line up the points: ${x.toFixed(2)} + ${s(y)} = ${s(x + y)}.`); },
  // 4 subtract by counting up
  (rng) => { const x = d1(rng, 41, 99), y = d2(rng, 101, 399), w = Math.ceil(y); return N(`${s(x)} − ${s(y)} = ?`, r3(x - y), `Count up: ${s(y)} → ${w} is ${s(w - y)}, ${w} → ${s(x)} is ${s(x - w)}: ${s(x - y)}.`); },
  // 5 decimal × whole
  (rng) => { const x = d1(rng, 12, 99), n = rng.int(3, 9); return N(`${s(x)} × ${n} = ?`, r3(x * n), `${Math.round(x * 10)} × ${n} = ${Math.round(x * 10) * n}; one decimal place: ${s(x * n)}.`); },
  // 6 decimal × decimal
  (rng) => { const a = rng.int(12, 49), b = rng.int(2, 9); return N(`${s(a / 10)} × 0.${b} = ?`, r3((a * b) / 100), `${a} × ${b} = ${a * b}; two decimal places: ${s((a * b) / 100)}.`); },
  // 7 divide by a decimal
  (rng) => { const y = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]), q = d1(rng, 11, 99), x = r3(q * y); return N(`${s(x)} ÷ ${s(y)} = ?`, q, `× 10 both: ${s(x * 10)} ÷ ${Math.round(y * 10)} = ${s(q)}.`); },
  // 8 bigger or smaller
  (rng) => { const x = d1(rng, 12, 99), y = rng.pick([0.5, 0.25, 0.2, 0.4]); return mc({ q: `${s(x)} ÷ ${s(y)}: compared with ${s(x)}, the answer is…`, right: 'bigger', wrong: [['smaller', 'dividing by a number below 1 makes a number bigger'], ['the same', `only ÷ 1 leaves ${s(x)} unchanged`]], explain: `${s(x)} ÷ ${s(y)} = ${s(x / y)}: how many ${s(y)}s fit in ${s(x)}, and more than ${s(x)} of them fit.` }, rng); },
  // 9 name the slip
  (rng) => { const m1 = rng.int(11, 99), m2 = rng.int(101, 999); if (!(m1 % 10 && m2 % 10)) return N('4.7 + 2.85 = ?', 7.55, 'Line up the points: 4.70 + 2.85 = 7.55.'); const x = m1 / 10, y = m2 / 100; return mc({ q: `A candidate answers ${s(x)} + ${s(y)} = ${s((m1 + m2) / 100)}. What went wrong?`, right: 'Lined up the last digits', wrong: [['Forgot a carry', `a carry slip changes one digit, not every place`], ['Subtracted instead', `${s(x)} − ${s(y)} = ${s(x - y)}`], ['Counted decimal places', 'that is a rule for multiplying, not adding']], explain: `${s(x)} was treated as ${s(m1 / 100)}. Line up the points: ${x.toFixed(2)} + ${s(y)} = ${s(x + y)}.` }, rng); },
];

const GRID = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) GRID.push([r, c]);

export default {
  id: 'mm/decimals',
  book: 'mm',
  kind: 'family',
  family: 'mm-decimals',
  title: 'Decimals',
  summary: 'A decimal is a whole number of tenths or hundredths. Line up points to add and subtract, count decimal places to multiply, make the divisor whole to divide, and ask "bigger or smaller?" before you tap.',
  prerequisites: ['mm/multiply'],
  objectives: [
    'Place the decimal point in sums, differences, products and quotients without writing anything down',
    'Divide by a decimal by scaling both numbers until the divisor is whole',
    'Reject an option whose point is in the wrong place by a bigger-or-smaller check',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: work out 4.7 + 2.85 and 0.3 × 0.4. Then try 1.35 ÷ 0.3 two different ways.', answer: '7.55, 0.12 and 4.5.',
      explain: '4.70 + 2.85 = 7.55 (points lined up). 3 × 4 = 12 with two decimal places: 0.12. 1.35 ÷ 0.3 = 13.5 ÷ 3 = 4.5.',
      attempts: [
        { id: 'align', label: 'Lined up the last digits', approach: '47 + 285 = 332, so 3.32.', breaksAt: '4.7 is 4.70: its 7 is tenths and must sit under the 8.' },
        { id: 'divide', label: 'Divided as if the point was not there', approach: '135 ÷ 3 = 45, so 45.', breaksAt: 'Scaling only one number changes the answer: ×10 both, 13.5 ÷ 3 = 4.5.' },
      ] },
    { type: 'text', text: 'The cue: a decimal point in the question. The digits of the answer come from whole-number arithmetic; the only new decision is where the point goes, and that is what most wrong options get wrong.' },
    check(pool, 0, 'placing the point'),

    sec('why'),
    { type: 'text', text: 'On the 80-in-8 the four options for a decimal question often share the same digits: 0.12, 1.2, 12, 0.012. Knowing the digits is worth nothing until the point is right.' },
    check(pool, 0, 'placing the point'),

    sec('anchor'),
    { type: 'text', text: 'You know place value: 3.47 is 3 ones, 4 tenths and 7 hundredths. **One change**: read it as 347 hundredths. Then every decimal sum is a whole-number sum of hundredths.' },
    check(pool, 1, 'place value'),

    sec('picture'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['', 'ones', '.', 'tenths', 'hundredths'], rows: [['', '4', '.', '7', '0'], ['+', '2', '.', '8', '5'], ['=', '7', '.', '5', '5']] }, caption: '4.7 + 2.85 with the points in one column: 4.7 becomes 4.70, tenths sit under tenths. 0.70 + 0.85 = 1.55 carries 1 into the ones: 7.55.' },
    check(pool, 3, 'lining up points'),
    { type: 'diagram', diagram: 'grid', spec: { rows: 10, cols: 10, highlight: GRID, count: 12, rowTitle: '0.3 = 3 rows', colTitle: '0.4 = 4 columns' }, caption: 'The unit square cut into 100 hundredths. 0.3 × 0.4 is 3 rows of 4: 12 small squares, 12 hundredths, 0.12. One decimal place times one decimal place gives two.' },
    check(pool, 6, 'decimal times decimal'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 1.5, step: 0.3, target: 1.35, marks: [{ x: 1.2, label: '4 jumps' }] }, caption: '1.35 ÷ 0.3 asks how many jumps of 0.3 reach 1.35: four reach 1.2 and half a jump more reaches 1.35, so 4.5. Scaling both by 10 (13.5 ÷ 3) counts the same jumps.' },
    check(pool, 7, 'dividing by a decimal'),

    sec('derivation'),
    { type: 'text', text: 'Five moves, one per kind of question, then a size check.' },
    { type: 'steps', steps: [
      { say: '× or ÷ 10, 100, 1000: move the point one place per zero, right for ×, left for ÷. 45.8 ÷ 1000 = 0.0458.', why: 'Each × 10 makes every digit worth ten times more.', checks: [cum(pool, 2)] },
      { answers: 'align', say: '+ and −: line up the points; fill empty places with 0 (4.7 = 4.70). For −, count up: 1.75 → 2 → 6.2 is 0.25 + 4.2 = 4.45.', why: 'Only digits of the same place value can be added or taken away.', checks: [cum(pool, 4)] },
      { say: '×: multiply as whole numbers, then count the decimal places in the question: 2.4 × 6 → 24 × 6 = 144 → 14.4.', why: '2.4 is 24 tenths, so the product is 144 tenths.', checks: [cum(pool, 5)] },
      { answers: 'divide', say: '÷ a decimal: multiply BOTH numbers by 10 or 100 until the divisor is whole. 1.35 ÷ 0.3 = 13.5 ÷ 3 = 4.5.', why: 'Scaling both by the same amount leaves the quotient unchanged.', checks: [cum(pool, 7)] },
      { say: 'Check: × or ÷ a number below 1 makes the result smaller or bigger. 2.4 ÷ 0.5 must be bigger than 2.4 (it is 4.8).', why: 'A misplaced point changes the size tenfold; this check sees it in a second.', checks: [cum(pool, 8)] },
    ] },
    { type: 'explain', prompt: 'Why does 0.3 × 0.4 have two decimal places when each factor has one?', model: '0.3 is 3 tenths and 0.4 is 4 tenths. A tenth of a tenth is a hundredth, so the product is 3 × 4 = 12 hundredths, which is 0.12. The places add because the place values multiply.', points: ['Tenth × tenth = hundredth', '3 × 4 = 12 hundredths', 'Decimal places add when multiplying'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-decimals', section: 'mm', difficulty: 1, seed: 'a', intro: 'A power of ten, a sum or a decimal times a whole number. Answer first.' },
    { type: 'worked', family: 'mm-decimals', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'The digits are given; you place the point.' },
    { type: 'thinkaloud', problem: '10.74 ÷ 0.6 = ?', lines: [
      { t: 0, say: 'Dividing by a decimal: make 0.6 whole.' },
      { t: 1, say: '0.6 × 10 = 6, so 10.74 ÷ 6 = 1.79.', slip: true },
      { t: 3, say: 'No: I scaled only the divisor. Both × 10: 107.4 ÷ 6.' },
      { t: 5, say: '107.4 ÷ 6 = 17.9. Bigger than 10.74, as it must be for ÷ 0.6.' },
      { t: 7, say: 'Multiply back: 17.9 × 0.6 = 10.74. Tap 17.9.' },
    ] },
    check(pool, 8, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '2.4 ÷ 0.5: before working it out, is the answer more or less than 2.4?', answer: 'More: dividing by a half doubles. 2.4 ÷ 0.5 = 4.8.', explain: 'Dividing by a number below 1 always makes the result bigger.' },

    sec('traps'),
    { type: 'traps', family: 'mm-decimals', section: 'mm', extra: [
      { belief: 'Line up the last digits, as with whole numbers.', fix: 'Line up the points. Whole numbers only look that way because their point is after the last digit.' },
      { belief: 'In a product, the answer has as many decimal places as the longest factor.', fix: 'The places add: 0.3 × 0.4 has 1 + 1 = 2 places, 0.12.' },
      { belief: 'Dividing always makes a number smaller.', fix: 'Not by a number below 1: 2.4 ÷ 0.5 = 4.8.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out 0.3 × 0.4. One step is wrong.', steps: ['Ignore the points: 3 × 4 = 12.', 'Each factor has one decimal place, so the answer has one.', 'So 0.3 × 0.4 = 1.2.'], errorStep: 1, explain: 'The places add: one plus one is two, so 0.12. The check: 0.3 of something less than 1 must be less than 0.4, and 1.2 is not.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 9), mc({ q: 'Options for 1.35 ÷ 0.3 are 0.45, 4.05, 4.5, 45. Which belief leads to 45?', right: 'Scaling the divisor is enough', wrong: [['Dividing by a decimal makes it smaller', 'that leads to 0.45'], ['Line up the points first', 'that is the rule for adding'], ['The zero in 4.05 holds a place', '4.05 is a misread of 4.5, not a scaling error']], explain: '135 ÷ 3 = 45 scales 1.35 by 100 but 0.3 only by 10. Scale both by 10: 13.5 ÷ 3 = 4.5.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Fractions in disguise: 0.5 = 1/2, 0.25 = 1/4, 0.125 = 1/8, 0.2 = 1/5. So ÷ 0.25 is × 4, × 0.125 is ÷ 8, ÷ 0.2 is × 5. 3.6 ÷ 0.25 = 14.4 in one step.' },
    check(pool, 9, 'decimals as fractions'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Powers of ten: move the point. + and −: points in a column. ×: whole numbers, then add the decimal places. ÷ a decimal: scale both until the divisor is whole. Then: bigger or smaller?' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Move', 'Answer'], rows: [['0.3 + 0.4', 'tenths add', '0.7'], ['0.3 × 0.4', '3 × 4, two places', '0.12'], ['1.2 ÷ 0.4', '12 ÷ 4', '3'], ['1.2 ÷ 4', '12 tenths ÷ 4', '0.3']] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: 'Base: 2.4 × 6 = 14.4.', rows: [
      { change: '6 becomes 0.6', effect: 'One more decimal place: 1.44.' },
      { change: '2.4 becomes 24', effect: 'One fewer: 144.' },
      { same: true, change: 'The order is swapped: 6 × 2.4', effect: 'No change: 14.4.' },
      { fusion: true, change: '2.4 becomes 0.24 AND 6 becomes 60', effect: 'One place more and one zero more cancel: still 14.4.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a trailing zero after the point changes nothing (2.50 = 2.5). A product can lose places to a trailing zero: 2.5 × 0.4 = 1.00 = 1.' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: prices in euros and cents are hundredths; a tick size of 0.05 times a quantity, and a price ÷ 0.25 are the same point-placing questions.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(12, 48); return N(`A bond pays 0.35 per unit. What do ${n} units pay?`, r3(0.35 * n), `35 × ${n} = ${35 * n}; two decimal places: ${s(0.35 * n)}.`); } },
      far: N('Outside the test: a recipe needs 0.75 litres of milk per batch. How many batches from 4.5 litres?', 6, '4.5 ÷ 0.75 = 450 ÷ 75 = 6: scale both by 100.'),
      principle: mc({ q: 'Which idea carried over to the recipe?', right: 'Scale both until the divisor is whole', wrong: [['Line up the decimal points', 'that is for adding'], ['Count decimal places and add them', 'that is for multiplying'], ['Move the point one place per zero', 'there was no power of ten']], explain: '4.5 ÷ 0.75 = 450 ÷ 75: the same scaling as 1.35 ÷ 0.3 = 13.5 ÷ 3.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-decimals', section: 'mm', count: 3 },
  ],
};
