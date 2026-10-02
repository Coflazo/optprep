// 80-in-8: percentages. 10%, 5% and 1% chunks; the friendly fractions; which percent, the whole
// from a part, percentage change against the OLD value, and undoing a rise or a fall.
import { sec, mc, N, check, cum, r2 } from './shared.js';

const SHAPES = [
  ['15% of 240 = ?', 'the part', [['the whole', '240 is given: it is the whole'], ['the percent', '15% is given'], ['the change', 'nothing changes here']]],
  ['?% of 80 = 12', 'the percent', [['the part', '12 is given: it is the part'], ['the whole', '80 is given: it is the whole'], ['the change', 'nothing changes here']]],
  ['15% of ? = 36', 'the whole', [['the part', '36 is given: it is the part'], ['the percent', '15% is given'], ['the change', 'nothing changes here']]],
  ['% change from 80 to 92', 'the change', [['the part', 'neither number is a part of the other'], ['the whole', 'both values are given'], ['the percent of 92', 'change is measured against the old value, 80']]],
];

const pool = [
  // 0 recognise what is asked
  (rng) => { const [text, right, wrong] = rng.pick(SHAPES); return mc({ q: `In "${text}", what is unknown?`, right, wrong, explain: 'Name the three roles first: percent, whole, part. The unknown is the role that is missing.' }, rng); },
  // 1 ten percent
  (rng) => { const y = rng.int(12, 99) * 10 + rng.pick([0, 5]); return N(`10% of ${y} = ?`, y / 10, `A tenth: ${y} ÷ 10 = ${y / 10}.`); },
  // 2 chunks
  (rng) => { const p = rng.pick([15, 35, 45, 5, 30]), y = 20 * rng.int(3, 30); const parts = [p >= 10 ? `${Math.floor(p / 10)} × ${y / 10}` : null, p % 10 ? `half of ${y / 10}` : null].filter(Boolean).join(' + '); return N(`${p}% of ${y} = ?`, (p * y) / 100, `10% = ${y / 10}; ${p}% = ${parts} = ${(p * y) / 100}.`); },
  // 3 friendly fractions
  (rng) => { const [p, f, k] = rng.pick([[25, '1/4', 4], [50, '1/2', 2], [20, '1/5', 5], [12.5, '1/8', 8], [75, '3/4', 4]]), y = k * rng.int(6, 60); return N(`${p}% of ${y} = ?`, (p * y) / 100, `${p}% = ${f}: ${(p * y) / 100}.`); },
  // 4 which percent
  (rng) => { const p = rng.pick([5, 15, 20, 25, 30, 45, 60, 75]), y = 20 * rng.int(2, 20); return N(`?% of ${y} = ${(p * y) / 100}. What is the percent?`, p, `${(p * y) / 100} out of ${y} = ${r2((p * y) / 100 / y)} = ${p}%.`); },
  // 5 the whole from a part
  (rng) => { const p = rng.pick([10, 15, 20, 25, 40, 75]), y = 20 * rng.int(3, 30), z = (p * y) / 100; return N(`${p}% of ? = ${z}`, y, `1% = ${z} ÷ ${p} = ${r2(z / p)}; 100% = ${y}.`); },
  // 6 percentage change
  (rng) => { const a = rng.pick([40, 80, 120, 160, 200, 240, 400]), c = rng.pick([-25, -20, -10, 10, 15, 20, 25, 50]), b = (a * (100 + c)) / 100; return N(`Percentage change from ${a} to ${b}? (type −20 for a 20% fall)`, c, `Change ${b - a} over the OLD value ${a}: ${c}%.`); },
  // 7 before a rise or fall
  (rng) => { const p = rng.pick([10, 20, 25, 50]), up = rng.chance(0.5), o = 20 * rng.int(2, 30), v = (o * (up ? 100 + p : 100 - p)) / 100; return N(`After a ${p}% ${up ? 'rise' : 'fall'} a price is ${v}. Price before?`, o, `${v} is ${up ? 100 + p : 100 - p}% of the old price: ${v} ÷ ${(up ? 100 + p : 100 - p) / 100} = ${o}.`); },
  // 8 the base check
  (rng) => { const o = 20 * rng.int(3, 20), v = (o * 6) / 5; return mc({ q: `After a 20% rise the price is ${v}. Which is the old price?`, right: String(o), wrong: [[String(r2(v * 0.8)), `took 20% of the NEW price off; the 20% was of the old one`], [String(v - 20), 'subtracted 20 as a number, not 20%'], [String(r2(v * 1.2)), 'applied the rise again']], explain: `${v} = 120% of the old price: ${v} ÷ 1.2 = ${o}.` }, rng); },
  // 9 swap trick
  (rng) => { const [a, b] = rng.pick([[8, 25], [4, 50], [12, 25], [16, 50], [6, 50], [18, 50], [3, 20]]); return N(`${a}% of ${b} = ?`, (a * b) / 100, `x% of y = y% of x: ${b}% of ${a} = ${(a * b) / 100}.`); },
];

export default {
  id: 'mm/percent',
  book: 'mm',
  kind: 'family',
  family: 'mm-percent',
  title: 'Percentages',
  summary: 'Build any percent from 10%, 5% and 1%, or use the friendly fractions. Then the one question that decides the rest: percent of WHICH number? Change is against the old value; undoing a rise divides.',
  prerequisites: ['mm/fractions'],
  objectives: [
    'Find x% of y from 10%, 5% and 1% chunks or a friendly fraction',
    'Find the percent, the whole, or the percentage change, always against the right base',
    'Undo a rise or a fall by dividing, not by taking the percent off the new value',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: (a) 15% of 240. (b) After a 20% rise a price is 96: what was it before? Try two ways for (b).', answer: '(a) 36. (b) 80.',
      explain: '(a) 10% = 24, 5% = 12: 36. (b) 96 is 120% of the old price: 96 ÷ 1.2 = 80. Check: 80 + 16 = 96.',
      attempts: [
        { id: 'newbase', label: 'Took 20% off the new price', approach: '20% of 96 is 19.2; 96 − 19.2 = 76.8.', breaksAt: 'The 20% was of the OLD price. 76.8 + 20% of 76.8 = 92.16, not 96.' },
        { id: 'number', label: 'Subtracted 20', approach: '96 − 20 = 76.', breaksAt: '20% is not 20 units; it is a fifth of the old price.' },
      ] },
    { type: 'text', text: 'The cue: a % sign. Then name the three roles: the percent, the whole (the base) and the part. The question gives two of them; the slips all come from using the wrong number as the whole.' },
    check(pool, 0, 'what is unknown'),

    sec('why'),
    { type: 'text', text: 'Percent questions hide one trap each: the base. The wrong options are what you get from the wrong base (76.8 instead of 80), so the method has to name the base before any arithmetic.' },
    check(pool, 0, 'what is unknown'),

    sec('anchor'),
    { type: 'text', text: 'You know that 10% of anything is a tenth of it: 10% of 240 = 24. **One change**: every other percent is built from that tenth, its half (5%) and its tenth (1%).' },
    check(pool, 1, 'ten percent'),

    sec('picture'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['percent of 240', 'how', 'value'], rows: [['100%', 'the whole', '240'], ['10%', '÷ 10', '24'], ['5%', 'half of 10%', '12'], ['1%', '÷ 100', '2.4'], ['15%', '10% + 5%', '36']] }, caption: 'The chunk ladder: 10%, 5% and 1% of 240, and 15% built as 10% + 5%. Any percent is a sum of these chunks.' },
    check(pool, 3, 'chunks and fractions'),
    { type: 'diagram', diagram: 'numberline', spec: { min: 75, max: 95, step: 5, start: 80, target: 92, marks: [{ x: 86, label: '+12' }] }, caption: 'From 80 to 92 the change is +12. As a percent it is measured against where you started: 12 / 80 = 15%. Against 92 it would be 13%, the wrong base.' },
    check(pool, 6, 'percentage change'),
    { type: 'diagram', diagram: 'bar', spec: { title: 'Undoing a 20% rise', xLabel: 'price', yLabel: 'value', categories: ['old', 'after +20%', '96 − 20% of 96'], series: [{ name: 'price', values: [80, 96, 76.8] }], valueLabels: true }, caption: 'A 20% rise takes 80 to 96. Taking 20% of 96 off lands on 76.8, not 80: the 20% was of 80. Divide by 1.2 to undo.' },
    check(pool, 7, 'undoing a rise'),

    sec('derivation'),
    { type: 'text', text: 'Five shapes, one move each. Every move starts by naming the whole.' },
    { type: 'steps', steps: [
      { say: 'x% of y: chunks (15% = 10% + 5%) or a friendly fraction (25% = 1/4, 12.5% = 1/8, 20% = 1/5).', why: 'Chunks are divisions by 10 and halvings, all mental.', checks: [cum(pool, 3)] },
      { say: 'Which percent: part ÷ whole, as hundredths. 12 of 80 = 15/100 = 15%.', why: 'The percent is the part per hundred of the whole.', checks: [cum(pool, 4)] },
      { say: 'The whole from a part: scale the part to 1%, then to 100%. 15% is 36, so 1% is 2.4 and 100% is 240.', why: 'The given part sits at the given percent; the whole sits at 100%.', checks: [cum(pool, 5)] },
      { answers: 'number', say: 'Change: (new − old) ÷ OLD. 80 → 92 is 12/80 = +15%; 120 → 90 is −30/120 = −25%.', why: 'A change is always measured from where you started.', checks: [cum(pool, 6)] },
      { answers: 'newbase', say: 'Before a rise or fall: the new value is (100 ± p)% of the old. Divide: 96 ÷ 1.2 = 80; after a 25% fall to 60, 60 ÷ 0.75 = 80.', why: 'A rise multiplies the OLD price by 1 + p; dividing undoes it.', checks: [cum(pool, 8)] },
    ] },
    { type: 'explain', prompt: 'Why does taking 20% off 96 not undo a 20% rise?', model: 'The rise was 20% of the old price, 80, which is 16. Taking 20% of 96 removes 19.2, a bigger amount, because 96 is bigger than 80. To undo a multiplication by 1.2 you divide by 1.2.', points: ['The rise was a share of the old price', '20% of 96 is more than 20% of 80', 'Undo × 1.2 with ÷ 1.2'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-percent', section: 'mm', difficulty: 1, seed: 'a', intro: 'A percent of a number. Answer first.' },
    { type: 'worked', family: 'mm-percent', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'The first move is given; finish it.' },
    { type: 'thinkaloud', problem: 'After a 25% fall a price is 60. Price before = ?', lines: [
      { t: 0, say: 'Before a fall: the base is the old price, which I do not have yet.' },
      { t: 2, say: 'Add 25% of 60 back: 60 + 15 = 75.', slip: true },
      { t: 4, say: 'No: the 25% was of the old price. 60 is 75% of it.' },
      { t: 5, say: '60 ÷ 0.75 = 80. Check: 80 − 25% of 80 = 80 − 20 = 60. Tap 80.' },
    ] },
    check(pool, 8, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: 'A price falls 20%, then rises 20%. Is it back where it started?', answer: 'No: 100 → 80 → 96. The rise is 20% of a smaller number.', explain: 'Each percent is taken of the value at that moment, so equal percents up and down do not cancel.' },

    sec('traps'),
    { type: 'traps', family: 'mm-percent', section: 'mm', extra: [
      { belief: 'To undo a p% rise, take p% off the new value.', fix: 'Divide by (1 + p): 96 ÷ 1.2 = 80, not 76.8.' },
      { belief: 'Percentage change is the change divided by the new value.', fix: 'Divide by the OLD value: 120 → 90 is −30/120 = −25%.' },
      { belief: 'A change of 12 units is a 12% change.', fix: 'Only if the old value is 100.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out the percentage change from 120 to 90. One step is wrong.', steps: ['Change: 90 − 120 = −30.', 'Divide by the new value: −30 / 90 ≈ −33.3%.', 'So the change is about −33.3%.'], errorStep: 1, explain: 'Divide by the old value: −30 / 120 = −25%. Check: 120 − 25% of 120 = 120 − 30 = 90.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 9), mc({ q: 'Options for "after a 20% rise the price is 96, before = ?" are 76, 76.8, 80, 115.2. Which belief gives 115.2?', right: 'Apply the rise again', wrong: [['Take 20% of the new price off', 'that gives 76.8'], ['Subtract the percent as a number', 'that gives 76'], ['Divide by 1.2', 'that is right and gives 80']], explain: '96 × 1.2 = 115.2 goes the wrong way. Undo a rise by dividing.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Swap trick: x% of y = y% of x. 8% of 25 = 25% of 8 = 2; 16% of 50 = 50% of 16 = 8. Friendly fractions: 12.5% = 1/8, 20% = 1/5, 25% = 1/4, 33⅓% = 1/3, 75% = 3/4.' },
    check(pool, 9, 'the swap trick'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Name the whole first. Chunks of 10%, 5%, 1% or a friendly fraction. Change: over the OLD value. Before a rise or fall: divide by (100 ± p)%.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Unknown', 'Move', 'Answer'], rows: [['15% of 240', 'part', '10% + 5%', '36'], ['?% of 80 = 12', 'percent', '12/80', '15%'], ['15% of ? = 36', 'whole', '36 ÷ 15 × 100', '240'], ['80 → 92', 'change', '12/80', '+15%'], ['+20% → 96', 'old price', '96 ÷ 1.2', '80']] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: 'Base: 15% of 240 = 36.', rows: [
      { change: '240 becomes 480', effect: 'Twice the whole, twice the part: 72.' },
      { change: '15% becomes 30%', effect: 'Twice the percent: 72.' },
      { same: true, change: 'Written as 240 × 0.15', effect: 'No change: 36. 15% and 0.15 are the same number.' },
      { fusion: true, change: '15% becomes 30% AND 240 becomes 120', effect: 'The two changes cancel: 36.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a rise of 100% doubles; a fall of 100% leaves 0, so it cannot be undone. A percent above 100 (150% of 40 = 60) is still the same chunks.' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a return on a position is a percentage change against the entry price; a discount, a tax and a fee are all "percent of which number" questions.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const a = rng.pick([150, 250, 400, 600]), p = rng.pick([8, 12, 20]); return N(`A position worth ${a} rises ${p}%. What is it worth now?`, (a * (100 + p)) / 100, `${p}% of ${a} = ${(a * p) / 100}; ${a} + ${(a * p) / 100} = ${(a * (100 + p)) / 100}.`); } },
      far: N('Outside the test: a shirt costs €48 after a 20% discount. What was the price before?', 60, '48 is 80% of the old price: 48 ÷ 0.8 = 60.'),
      principle: mc({ q: 'Which idea carried over from the position to the shirt?', right: 'The percent is of the original', wrong: [['Take the percent of the new value', 'that is the trap in both'], ['Change is over the new value', 'change is over the old value'], ['Swap x% of y for y% of x', 'neither needed the swap']], explain: 'In both, the percent is a share of the starting value; for the shirt, undo it by dividing.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-percent', section: 'mm', count: 3 },
  ],
};
