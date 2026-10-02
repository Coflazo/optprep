// 80-in-8: exact division. ÷5 and ÷25 as doubling, short division in chunks (and the zero in the
// quotient), two-digit divisors by bracketing and the last digit, and multiplying back.
import { sec, mc, N, check, cum, PACE } from './shared.js';

const notTen = (rng, lo, hi) => { for (;;) { const v = rng.int(lo, hi); if (v % 10) return v; } };

const pool = [
  // 0 recognise the shortcut
  (rng) => { const five = rng.chance(0.5), q = notTen(rng, 21, 160), a = q * (five ? 5 : 25); return mc({ q: `Which move makes ${a} ÷ ${five ? 5 : 25} easy?`, right: five ? '× 2, then ÷ 10' : '× 4, then ÷ 100', wrong: five ? [['÷ 10, then ÷ 2', 'that is ÷ 20'], ['× 2, then ÷ 100', 'that is ÷ 50'], ['÷ 2, then × 10', 'that is × 5']] : [['× 2, then ÷ 100', 'that is ÷ 50: doubled only once'], ['× 4, then ÷ 10', 'that is ÷ 2.5: a zero short'], ['÷ 4, then × 100', 'that is × 25']], explain: five ? '5 = 10 ÷ 2, so ÷ 5 = × 2 ÷ 10.' : '25 = 100 ÷ 4, so ÷ 25 = × 4 ÷ 100.' }, rng); },
  // 1 fact family
  (rng) => { const a = rng.int(6, 9), b = notTen(rng, 12, 39); return N(`${a} × ${b} = ${a * b}. So ${a * b} ÷ ${a} = ?`, b, `Division reads the multiplication fact backwards: ${a * b} ÷ ${a} = ${b}.`); },
  // 2 ÷ 5
  (rng) => { const q = notTen(rng, 21, 199); return N(`${q * 5} ÷ 5 = ?`, q, `${q * 5} × 2 = ${q * 10}, ÷ 10 = ${q}.`); },
  // 3 ÷ 25
  (rng) => { const q = notTen(rng, 12, 99); return N(`${q * 25} ÷ 25 = ?`, q, `${q * 25} × 4 = ${q * 100}, ÷ 100 = ${q}.`); },
  // 4 short division in chunks
  (rng) => { const d = rng.int(3, 9), q = notTen(rng, 112, 199); return N(`${d * q} ÷ ${d} = ?`, q, `${d} × 100 = ${d * 100}, leaving ${d * (q - 100)}; ${d * (q - 100)} ÷ ${d} = ${q - 100}: ${q}.`); },
  // 5 zero in the quotient
  (rng) => { const d = rng.int(3, 9), q = rng.int(1, 9) * 100 + rng.int(1, 9); return N(`${d * q} ÷ ${d} = ?`, q, `${d} × ${q - (q % 100)} = ${d * (q - (q % 100))}, leaving ${d * (q % 100)}, which is ${d} × ${q % 100}: ${q}. The tens digit is 0.`); },
  // 6 two-digit divisor
  (rng) => { const d = notTen(rng, 13, 29), q = notTen(rng, 21, 49), T = q - (q % 10); return N(`${d * q} ÷ ${d} = ?`, q, `${d} × ${T} = ${d * T} and ${d} × ${T + 10} = ${d * (T + 10)}, so the answer is in the ${T}s; ${d} × ${q} = ${d * q}.`); },
  // 7 multiply back to choose
  (rng) => { const d = notTen(rng, 13, 49), q = notTen(rng, 21, 89), a = d * q, s = d % 2 ? 10 : 5; return mc({ q: `Which option is ${a} ÷ ${d}?`, right: String(q), wrong: [[String(q + 1), `${d} × ${q + 1} = ${d * (q + 1)}`], [String(q + s), `${d} × ${q + s} = ${d * (q + s)}: the right last digit, the wrong size`], [String(q * 10), `${d} × ${q * 10} = ${d * q * 10}: a zero too many`]], explain: `Multiply back: ${d} × ${q} = ${a}.` }, rng); },
  // 8 name the slip
  (rng) => { const d = rng.int(3, 9), q = rng.int(1, 9) * 100 + rng.int(1, 9), wrongQ = Number(String(q).replace('0', '')); return mc({ q: `A candidate answers ${d * q} ÷ ${d} = ${wrongQ}. What went wrong?`, right: 'Dropped the zero in the quotient', wrong: [['Divided by the wrong number', `${d} × ${wrongQ} = ${d * wrongQ}: the divisor was right, the place was not`], ['Added a zero too many', `${wrongQ} is too small, not too big`], ['Forgot a remainder', `${d * q} ÷ ${d} has no remainder`]], explain: `When ${d} did not go into a digit, a 0 must be written: ${q}. Size check: ${d * q} ÷ ${d} is more than 100.` }, rng); },
  // 9 halving chains for ÷ 4 and ÷ 8
  (rng) => { const k = rng.pick([4, 8]), q = notTen(rng, 31, 199); return N(`${q * k} ÷ ${k} = ?`, q, `Halve ${k === 4 ? 'twice' : 'three times'}: ${k === 4 ? `${q * 2}, ${q}` : `${q * 4}, ${q * 2}, ${q}`}.`); },
];

export default {
  id: 'mm/divide',
  book: 'mm',
  kind: 'family',
  family: 'mm-divide',
  title: 'Divide',
  summary: 'Every division on the test is exact. ÷5 and ÷25 become doubling; one-digit divisors go in chunks (write the zero); two-digit divisors are bracketed, then the last digit picks; always multiply back.',
  prerequisites: ['mm/multiply'],
  objectives: [
    'Divide by 5 and 25 by doubling and dropping zeros',
    'Divide by one digit in chunks without dropping a zero in the quotient',
    `Divide by a two-digit number by bracketing and the last digit, inside about ${PACE + 2} seconds`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: work out 1350 ÷ 25 and 824 ÷ 8. Try two ways for the first.', answer: '54 and 103.',
      explain: '1350 ÷ 25: × 4 = 5400, ÷ 100 = 54 (or: 1000 ÷ 25 = 40 and 350 ÷ 25 = 14). 824 ÷ 8: 800 ÷ 8 = 100, 24 ÷ 8 = 3: 103, with a 0 in the tens.',
      attempts: [
        { id: 'long', label: 'Long division by 25', approach: '25 into 135 goes 5, remainder 10; bring down 0; 25 into 100 goes 4: 54.', breaksAt: 'It works but needs the 25 times table and remainders in your head; doubling twice is faster.' },
        { id: 'zero', label: 'Short division, no zero', approach: '8 into 8 is 1, 8 into 2 does not go, 8 into 24 is 3: 13.', breaksAt: 'When 8 does not go into 2, a 0 must be written in the tens: 103.' },
      ] },
    { type: 'text', text: 'The cue: ÷ (or : in some reports) between two whole numbers. The answer is always a whole number, so every option can be tested by multiplying back.' },
    check(pool, 0, 'spotting the shortcut'),

    sec('why'),
    { type: 'text', text: 'Division is where the test hides a dropped zero (103 → 13) and a near miss (38 → 37). Multiplying back takes one second and catches both, which matters when a wrong tap costs a point.' },
    check(pool, 0, 'spotting the shortcut'),

    sec('anchor'),
    { type: 'text', text: 'You know your tables: 8 × 13 = 104. **One change**: division is that fact read backwards, 104 ÷ 8 = 13. Every method below is a way to find the missing factor.' },
    check(pool, 1, 'fact families'),

    sec('picture'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['÷ this', 'is', 'then', 'example'], rows: [['5', '× 2', '÷ 10', '435 ÷ 5 = 870 ÷ 10 = 87'], ['25', '× 4', '÷ 100', '1350 ÷ 25 = 5400 ÷ 100 = 54'], ['4', '÷ 2', '÷ 2', '1368 ÷ 4 = 684 ÷ 2 = 342']] }, caption: 'Dividing by 5 or 25 is multiplying by 2 or 4 and dropping zeros, because 5 = 10 ÷ 2 and 25 = 100 ÷ 4.' },
    check(pool, 3, '÷ 5 and ÷ 25'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['chunk taken out', 'that is', 'left over'], rows: [['6 × 100', '600', '144'], ['6 × 20', '120', '24'], ['6 × 4', '24', '0'], ['total', '100 + 20 + 4 = 124', '']] }, caption: '744 ÷ 6 in chunks: take out round multiples of 6 until nothing is left; the quotient is the sum of the multipliers. A chunk of 0 tens would still be a 0 in the answer.' },
    check(pool, 5, 'chunks and the zero'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 700, max: 1000, step: 50, target: 912, marks: [{ x: 720, label: '24 × 30' }, { x: 960, label: '24 × 40' }] }, caption: '912 ÷ 24: 912 lies between 24 × 30 = 720 and 24 × 40 = 960, so the answer is in the 30s. 24 × ? ends in 2 only for 3 or 8; 24 × 33 = 792 is too small, so 38.' },
    check(pool, 6, 'bracketing'),

    sec('derivation'),
    { type: 'text', text: 'Four moves, then the check that makes them safe.' },
    { type: 'steps', steps: [
      { answers: 'long', say: '÷ 5: double, drop a zero. ÷ 25: double twice, drop two zeros. 1350 ÷ 25 → 2700 → 5400 → 54.', why: '5 = 10/2 and 25 = 100/4.', checks: [cum(pool, 3)] },
      { answers: 'zero', say: 'One-digit divisor: take out round chunks (6 × 100, 6 × 20, 6 × 4). If a place has no chunk, its digit is 0: 824 ÷ 8 = 100 + 0 tens + 3 = 103.', why: 'The quotient is the sum of the chunks; a missing chunk is a 0 that holds the place.', checks: [cum(pool, 5)] },
      { say: 'Two-digit divisor: bracket between two tens (24 × 30 and 24 × 40), so the tens digit is known.', why: 'Multiplying by a round number is easy, and it fixes the size.', checks: [cum(pool, 6)] },
      { say: 'Then the last digit: 24 × ? must end in 2, so ? ends in 3 or 8; test the one in range.', why: 'Only the units digit of the quotient affects the units digit of the product.', checks: [cum(pool, 6)] },
      { say: 'Multiply back before tapping: 24 × 38 = 912.', why: 'An exact division has exactly one option that multiplies back; near misses and dropped zeros fail.', checks: [cum(pool, 7)] },
    ] },
    { type: 'explain', prompt: 'Why can the last digit leave two candidates when the divisor is even, but only one when it ends in 1, 3, 7 or 9?', model: 'Multiplying by an even number, two different units digits give the same last digit (24 × 3 and 24 × 8 both end in 2), because 24 × 5 ends in 0. A divisor ending in 1, 3, 7 or 9 shares no factor with 10, so each units digit gives a different last digit: only one candidate survives.', points: ['Even × 5 ends in 0', 'So two units digits collide', 'Odd, not 5: one candidate'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-divide', section: 'mm', difficulty: 1, seed: 'a', intro: 'A one-digit divisor or a ÷ 5. Answer first.' },
    { type: 'worked', family: 'mm-divide', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'The start is given; finish it and multiply back.' },
    { type: 'thinkaloud', problem: '2162 ÷ 23 = ?', lines: [
      { t: 0, say: 'Two-digit divisor: bracket. 23 × 90 = 2070, 23 × 100 = 2300: in the 90s.' },
      { t: 3, say: '2162 − 2070 = 92, and 92 ÷ 23 = 3, so 93.', slip: true },
      { t: 5, say: 'Multiply back: 23 × 3 = 69, not 92. 23 × 4 = 92. So 94.' },
      { t: 7, say: 'Last digit: 3 × 4 ends in 2, like 2162. Tap 94.' },
    ] },
    check(pool, 7, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '6237 ÷ 3: how many digits does the answer have, and what is its second digit?', answer: 'Four digits, second digit 0: 6237 ÷ 3 = 2079 (3 does not go into 2).', explain: 'The size check (6000 ÷ 3 = 2000) says four digits before you divide.' },

    sec('traps'),
    { type: 'traps', family: 'mm-divide', section: 'mm', extra: [
      { belief: 'If the divisor does not go into a digit, skip that digit.', fix: 'Write a 0 there. 824 ÷ 8 = 103, not 13.' },
      { belief: '÷ 25 is × 2 ÷ 100.', fix: 'That is ÷ 50. Double twice: × 4 ÷ 100.' },
      { belief: 'An option with the right last digit must be right.', fix: 'With an even divisor, two quotients share a last digit (33 and 38 for ÷ 24): check the size too.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out 6237 ÷ 3 by short division. One step is wrong.', steps: ['6 ÷ 3 = 2: write 2.', '3 does not go into 2: move straight on to 23.', '23 ÷ 3 = 7 remainder 2; 27 ÷ 3 = 9: answer 279.'], errorStep: 1, explain: 'When 3 does not go into 2, write 0 and carry the 2: the answer is 2079. Size check: 6000 ÷ 3 = 2000, so 279 is far too small.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 8), mc({ q: 'Options for 912 ÷ 24 are 33, 37, 38, 48. Multiplying back, which belief makes 33 tempting?', right: 'The last digit alone decides', wrong: [['Dividing by 24 is dividing by 20', '912 ÷ 20 ≈ 46, not 33'], ['A zero was dropped', '33 has no missing zero'], ['The size check alone decides', '33 and 38 are both in the 30s, so size cannot separate them']], explain: '24 × 33 = 792 and 24 × 38 = 912 both end in 2. Only multiplying back separates them: 38.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: '÷ 4 is halving twice, ÷ 8 three times: 1368 ÷ 8 → 684 → 342 → 171. ÷ 50 is × 2 ÷ 100. ÷ 125 is × 8 ÷ 1000.' },
    check(pool, 9, 'halving chains'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: '÷ 5, 25: double once or twice, drop zeros. One digit: chunks, and write every 0. Two digits: bracket the tens, last digit picks the units, multiply back.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Move', 'Answer'], rows: [['435 ÷ 5', '× 2 ÷ 10', '87'], ['1350 ÷ 25', '× 4 ÷ 100', '54'], ['824 ÷ 8', 'chunks: 100 + 0 + 3', '103'], ['912 ÷ 24', 'bracket 30s, last digit 3 or 8', '38']] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: 'Base: 744 ÷ 6 = 124.', rows: [
      { change: '744 becomes 7440', effect: 'Ten times bigger: 1240.' },
      { change: '÷ 6 becomes ÷ 12', effect: 'Twice the divisor, half the answer: 62.' },
      { same: true, change: 'Written as 744 : 6', effect: 'No change: the colon is the European division sign. Still 124.' },
      { fusion: true, change: '744 becomes 7440 AND ÷ 6 becomes ÷ 12', effect: 'Ten times bigger, then halved: 620.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a zero at the end of the quotient (840 ÷ 4 = 210) is as easy to drop as one in the middle; the size check catches both. Dividing by a number bigger than the first one gives less than 1, which never happens in this family.' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a price per unit (cost ÷ quantity), an average, and a rate per hour are all exact divisions that multiply back.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const d = rng.pick([12, 16, 24]), q = rng.int(21, 49); return N(`${d * q} shares are split equally between ${d} desks. How many per desk?`, q, `Bracket and multiply back: ${d} × ${q} = ${d * q}.`); } },
      far: N('Outside the test: a car uses 6 litres per 100 km. How many km does it go on 45 litres?', 750, '45 ÷ 6 = 7.5 hundreds of km, so 750 km. Check: 7.5 × 6 = 45.'),
      principle: mc({ q: 'Which idea carried over from the desks to the car?', right: 'Divide, then multiply back to check', wrong: [['Double twice and drop two zeros', 'neither divisor was 25'], ['Write the zero in the quotient', 'neither quotient had a missing digit'], ['Round the divisor to 100', 'the divisors were 24 and 6']], explain: 'Both are "how many of these fit": a division whose answer is proved by multiplying back.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-divide', section: 'mm', count: 3 },
  ],
};
