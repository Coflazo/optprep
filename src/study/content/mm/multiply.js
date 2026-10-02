// 80-in-8: multiplying. The shortcut multipliers (×5, ×25, ×125 as a power of ten over 2, 4, 8),
// the ×11 digit sum, near-100 products, and splitting one factor for everything else.
import { sec, mc, N, check, cum, PACE } from './shared.js';

const SHORT = {
  5: { how: '× 10 ÷ 2', wrong: [['× 100 ÷ 4', 'that is × 25'], ['× 100 ÷ 2', 'that is × 50'], ['× 1000 ÷ 8', 'that is × 125']] },
  25: { how: '× 100 ÷ 4', wrong: [['× 100 ÷ 2', 'that is × 50: halved once instead of twice'], ['× 10 ÷ 4', 'that is × 2.5: a zero short'], ['× 1000 ÷ 8', 'that is × 125']] },
  125: { how: '× 1000 ÷ 8', wrong: [['× 1000 ÷ 4', 'that is × 250: halved twice instead of three times'], ['× 100 ÷ 8', 'that is × 12.5: a zero short'], ['× 100 ÷ 4', 'that is × 25']] },
};
const notTen = (rng, lo, hi) => { for (;;) { const v = rng.int(lo, hi); if (v % 10) return v; } };

const pool = [
  // 0 recognise the shortcut
  (rng) => { const m = rng.pick([5, 25, 125]), n = notTen(rng, 12, 96); return mc({ q: `Which move turns ${n} × ${m} into easy steps?`, right: SHORT[m].how, wrong: SHORT[m].wrong, explain: `${m} = ${m === 5 ? '10 ÷ 2' : m === 25 ? '100 ÷ 4' : '1000 ÷ 8'}, so × ${m} is ${SHORT[m].how}.` }, rng); },
  // 1 × 5
  (rng) => { const n = notTen(rng, 23, 498); return N(`${n} × 5 = ?`, n * 5, `${n} × 10 = ${n * 10}, halved: ${n * 5}.`); },
  // 2 split one factor (× one digit)
  (rng) => { const a = notTen(rng, 13, 98), b = rng.int(3, 9), t = a - (a % 10); return N(`${a} × ${b} = ?`, a * b, `${t} × ${b} = ${t * b}, ${a % 10} × ${b} = ${(a % 10) * b}: ${a * b}.`); },
  // 3 × 25
  (rng) => { const n = notTen(rng, 12, 96); return N(`${n} × 25 = ?`, n * 25, `${n} × 100 = ${n * 100}, ÷ 4 (halve twice: ${n * 50}, ${n * 25}).`); },
  // 4 × 125
  (rng) => { const n = rng.pick([16, 24, 32, 48, 56, 64, 72, 88, 12, 36, 44, 28]); return N(`${n} × 125 = ?`, n * 125, `${n} × 1000 = ${n * 1000}, ÷ 8 = ${n * 125}.`); },
  // 5 × 11
  (rng) => { const n = notTen(rng, 12, 98), a = Math.floor(n / 10), b = n % 10; return N(`${n} × 11 = ?`, n * 11, `${a} and ${b} outside, ${a} + ${b} = ${a + b} in the middle${a + b >= 10 ? ' (carry the 1)' : ''}: ${n * 11}.`); },
  // 6 near 100
  (rng) => { const x = rng.int(1, 9), y = rng.int(2, 9), a = 100 - x, b = 100 - y; return N(`${a} × ${b} = ?`, a * b, `Distances −${x} and −${y}: ${a} − ${y} = ${100 - x - y}, so ${100 * (100 - x - y)}; + ${x} × ${y} = ${x * y}: ${a * b}.`); },
  // 7 two digits by two digits
  (rng) => { const a = notTen(rng, 13, 49), b = notTen(rng, 13, 49), t = b - (b % 10); return N(`${a} × ${b} = ?`, a * b, `${a} × ${t} = ${a * t}, ${a} × ${b % 10} = ${a * (b % 10)}: ${a * b}.`); },
  // 8 last digit and size
  (rng) => { const a = notTen(rng, 23, 89), b = notTen(rng, 23, 89), c = a * b; return mc({ q: `Which of these can be ${a} × ${b}?`, right: String(c), wrong: [[String(c + 2), `${a % 10} × ${b % 10} ends in ${c % 10}, not ${(c + 2) % 10}`], [String(c * 10), `${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10} = ${Math.round(a / 10) * 10 * Math.round(b / 10) * 10}: a zero too many`], [String(c - 1), `${a % 10} × ${b % 10} ends in ${c % 10}, not ${(c + 9) % 10}`]], explain: `Last digit from ${a % 10} × ${b % 10}; size from ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10}. Only ${c} passes both.` }, rng); },
  // 9 name the slip
  (rng) => { const n = notTen(rng, 12, 96); return mc({ q: `A candidate answers ${n} × 25 = ${n * 50}. What went wrong?`, right: 'Halved once instead of twice', wrong: [['Forgot to multiply by 100', `that would give ${n / 4}, far smaller`], ['Divided by 8 instead of 4', `that gives ${n * 12.5}, half the answer`], ['Added a zero too many', `that gives ${n * 250}`]], explain: `× 25 = × 100 ÷ 4. ${n * 100} ÷ 2 = ${n * 50} is × 50; halve again: ${n * 25}.` }, rng); },
];

export default {
  id: 'mm/multiply',
  book: 'mm',
  kind: 'family',
  family: 'mm-multiply',
  title: 'Multiply',
  summary: '× 5, × 25 and × 125 are a power of ten halved once, twice or three times; × 11 puts the digit sum in the middle; near 100, use the distances; otherwise split one factor.',
  prerequisites: ['mm/addsub'],
  objectives: [
    'Turn × 5, × 25 and × 125 into adding zeros and halving',
    'Multiply a two-digit number by 11 and two numbers near 100 in under 5 seconds',
    `Split one factor for any other product and check it by last digit and size within ${PACE} seconds`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: work out 36 × 25 and 97 × 94 in your head. Try two ways for the first.', answer: '900 and 9118.',
      explain: '36 × 25 = 3600 ÷ 4 = 900 (or 9 × 100, since 36 = 4 × 9). 97 × 94: distances −3 and −6; 97 − 6 = 91, so 9100, plus 3 × 6 = 18: 9118.',
      attempts: [
        { id: 'long', label: 'Long multiplication', approach: '36 × 20 = 720, 36 × 5 = 180, add: 900.', breaksAt: 'It works, but takes three products and an addition; × 100 ÷ 4 takes one halving twice.' },
        { id: 'round', label: 'Rounded to 100 × 100', approach: '97 × 94 is about 100 × 100 = 10000.', breaksAt: 'An estimate is not an option: the four options differ in the last digits. The distances make it exact.' },
      ] },
    { type: 'text', text: 'The cue: one factor is 5, 25, 125 or 11, or both sit near 100. Then a shortcut beats any long multiplication. With none of those, split one factor into tens and units.' },
    check(pool, 0, 'spotting the shortcut'),

    sec('why'),
    { type: 'text', text: `Products are the slowest questions on the 80-in-8 if done the long way: three partial products in ${PACE} seconds is not possible. A shortcut turns them into halving and adding zeros, which takes two seconds.` },
    check(pool, 0, 'spotting the shortcut'),

    sec('anchor'),
    { type: 'text', text: 'You can multiply by 10, 100 and 1000: add zeros. **One change**: 5 = 10 ÷ 2. So 486 × 5 = 4860 ÷ 2 = 2430. Every shortcut on this page is that idea with a different power of ten or a different halving.' },
    check(pool, 1, '× 5'),

    sec('picture'),
    { type: 'diagram', diagram: 'grid', spec: { rows: 2, cols: 2, rowLabels: ['20', '3'], colLabels: ['40', '7'], rowTitle: '23 split', colTitle: '47 split', cellText: [[800, 140], [120, 21]], highlight: [] }, caption: '23 × 47 as an area: four rectangles, 800 + 140 + 120 + 21 = 1081. Splitting only 47 (23 × 40 + 23 × 7 = 920 + 161) adds the same pieces in two steps.' },
    check(pool, 2, 'splitting one factor'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['× this', 'is', 'then', 'example'], rows: [['5', '× 10', '÷ 2', '486 × 5 = 4860 ÷ 2 = 2430'], ['25', '× 100', '÷ 4', '36 × 25 = 3600 ÷ 4 = 900'], ['125', '× 1000', '÷ 8', '48 × 125 = 48000 ÷ 8 = 6000']] }, caption: 'The three shortcut multipliers: a power of ten divided by 2, 4 or 8. Dividing by 4 is halving twice; by 8, three times.' },
    check(pool, 4, '× 25 and × 125'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 90, max: 100, step: 1, target: 100, marks: [{ x: 94, label: '94 = 100 − 6' }, { x: 97, label: '97 = 100 − 3' }] }, caption: '97 × 94 through the distances from 100: cross-subtract (97 − 6 = 91, so 9100), then add the product of the distances (3 × 6 = 18): 9118.' },
    check(pool, 6, 'near 100'),

    sec('derivation'),
    { type: 'text', text: 'Five moves. Pick the first one that fits the question; the last move checks every product.' },
    { type: 'steps', steps: [
      { answers: 'long', say: '× 5, × 25, × 125: add one, two or three zeros, then halve once, twice or three times. 36 × 25 = 3600 → 1800 → 900.', why: '5 = 10/2, 25 = 100/4, 125 = 1000/8.', checks: [cum(pool, 4)] },
      { say: '× 11 with a two-digit number: the digits go outside, their sum in the middle. 47 × 11 = 4 (11) 7 → carry → 517.', why: '47 × 11 = 470 + 47: the tens column adds the two digits.', checks: [cum(pool, 5)] },
      { answers: 'round', say: 'Both near 100: cross-subtract one distance, then add the product of the distances. 97 × 94 = 9100 + 18.', why: '(100 − a)(100 − b) = 100(100 − a − b) + ab.', checks: [cum(pool, 6)] },
      { say: 'Anything else: split the second factor into tens and units. 23 × 47 = 23 × 40 + 23 × 7 = 920 + 161.', why: 'a × (b + c) = a × b + a × c: two easy products.', checks: [cum(pool, 7)] },
      { say: 'Check: last digit from the units (3 × 7 ends in 1), size from rounded factors (20 × 50 = 1000).', why: 'Wrong options are usually the right digits with a slip in one place; one of the two checks sees it.', checks: [cum(pool, 8)] },
    ] },
    { type: 'explain', prompt: 'Why is × 25 the same as × 100 ÷ 4, and why is halving twice the same as ÷ 4?', model: '25 is a quarter of 100, so 25 lots of something is a quarter of 100 lots. Dividing by 4 is dividing by 2 and then by 2 again, because 4 = 2 × 2; halving is easier in your head than dividing by 4.', points: ['25 = 100 ÷ 4', '÷ 4 = ÷ 2 ÷ 2', 'Halving is one easy step'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-multiply', section: 'mm', difficulty: 1, seed: 'a', intro: 'A product with a shortcut or a single split. Answer first.' },
    { type: 'worked', family: 'mm-multiply', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'The first move is given; finish it.' },
    { type: 'thinkaloud', problem: '48 × 125 = ?', lines: [
      { t: 0, say: '125: that is 1000 ÷ 8.' },
      { t: 1, say: '48 × 1000 = 48000.' },
      { t: 2, say: 'Halve: 24000, halve: 12000. Tap 12000.', slip: true },
      { t: 4, say: 'Wait: ÷ 8 is three halvings, I did two. Once more: 6000.' },
      { t: 6, say: 'Check: 48 ÷ 8 = 6, so 6 thousand. Tap 6000.' },
    ] },
    check(pool, 8, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '64 × 25: does the answer end in 00, 25, 50 or 75?', answer: '00: 64 is a multiple of 4, so 64 × 25 = 16 × 100 = 1600.', explain: 'Any number times 25 ends in 00, 25, 50 or 75; which one depends on the remainder when you divide by 4.' },

    sec('traps'),
    { type: 'traps', family: 'mm-multiply', section: 'mm', extra: [
      { belief: '× 25 is × 100 ÷ 2.', fix: 'That is × 50. Halve twice: ÷ 4.' },
      { belief: 'Two-digit × two-digit: tens times tens plus units times units.', fix: '23 × 47 ≠ 800 + 21. The cross terms 20 × 7 and 3 × 40 are missing; split one factor instead.' },
      { belief: 'Near 100, subtract the product of the distances.', fix: 'Both below 100: ADD it. One above and one below: subtract.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out 36 × 25. One step is wrong.', steps: ['25 = 100 ÷ 4, so 36 × 25 = 3600 ÷ 4.', '3600 ÷ 4: halve once, 1800.', 'So 36 × 25 = 1800.'], errorStep: 1, explain: '÷ 4 is two halvings: 3600 → 1800 → 900. 1800 is 36 × 50. Check: 36 = 4 × 9, so 36 × 25 = 9 × 100 = 900.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 9), mc({ q: '98 × 97 = 9506. A candidate taps 956. Which belief caused it?', right: 'The distance product needs no padding', wrong: [['Near 100 you subtract the distance product', 'that gives 9494, not 956'], ['× 97 is × 100 − 3', 'that is a correct method and gives 9506'], ['Cross-subtract with the wrong distance', '98 − 3 = 97 − 2 = 95 either way']], explain: 'The distances are 2 and 3: 98 − 3 = 95, so 95 hundreds; 2 × 3 = 6 must fill two digits: 06. 95|06 = 9506.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Even number times 5: halve first, then add a zero (64 × 5 = 32 × 10 = 320). Multiple of 4 times 25: quarter first (64 × 25 = 16 × 100). Multiple of 8 times 125: eighth first (48 × 125 = 6 × 1000).' },
    check(pool, 9, 'halving first'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: '× 5, 25, 125: zeros, then halve 1, 2, 3 times. × 11: digit sum in the middle. Near 100: cross-subtract, add the distance product (two digits). Else split one factor. Check last digit and size.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Move', 'Answer'], rows: [
      ['36 × 5', '× 10 ÷ 2', '180'], ['36 × 25', '× 100 ÷ 4', '900'], ['36 × 50', '× 100 ÷ 2', '1800'], ['36 × 11', '3 (9) 6', '396'], ['36 × 27', '36 × 20 + 36 × 7', '972'],
    ] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: 'Base: 36 × 25 = 3600 ÷ 4 = 900.', rows: [
      { change: '25 becomes 50', effect: 'Halve once: 3600 ÷ 2 = 1800.' },
      { change: '36 becomes 37', effect: '3700 ÷ 4 = 925: not a multiple of 4, so the answer ends in 25.' },
      { same: true, change: 'The order is swapped: 25 × 36', effect: 'No change: 900. The shortcut works on whichever factor is 25.' },
      { fusion: true, change: '25 becomes 125 AND 36 becomes 48', effect: '48 × 125 = 48000 ÷ 8 = 6000: one more zero and one more halving.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: × 11 with a digit sum of 10 or more carries into the front digit (85 × 11 = 935, not 8135). Near 100 with one factor above and one below, the distance product is subtracted (104 × 97 = 10100 − 12 = 10088).' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: 25% is a quarter and 12.5% is an eighth, so percents of a number use the same halvings; and a price of 99.5 times a quantity is the near-100 trick in money.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.pick([24, 36, 44, 52, 64, 72, 84]); return N(`A box holds 25 bonds. How many bonds in ${n} boxes?`, n * 25, `${n} × 100 ÷ 4 = ${n * 25}.`); } },
      far: N('Outside the test: a 25% tip on a €84 bill. How many euros?', 21, '25% is a quarter: 84 ÷ 4 = 21, by halving twice (42, 21).'),
      principle: mc({ q: 'Which idea carried over from the boxes to the tip?', right: '25 is 100 ÷ 4', wrong: [['Split one factor into tens and units', 'neither needed a split'], ['Cross-subtract near 100', 'nothing was near 100'], ['Digit sum in the middle', 'that is × 11']], explain: 'Both are a quarter of a hundred: multiply by 25 = take a quarter of 100 lots.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-multiply', section: 'mm', count: 3 },
  ],
};
