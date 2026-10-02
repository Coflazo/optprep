// 80-in-8: fractions. Same-sized pieces before adding, cancel before multiplying, flip the second
// before dividing; and the fraction-decimal table that turns many questions into a lookup.
import { sec, mc, N, check, cum, frac, gcd } from './shared.js';

const lcm = (a, b) => (a * b) / gcd(a, b);
function proper(rng, dens) { for (;;) { const d = rng.pick(dens), n = rng.int(1, d - 1); if (gcd(n, d) === 1) return [n, d]; } }
const TYPE = ' (type a fraction like 7/12)';
const TABLE = [['1/2', '0.5'], ['1/4', '0.25'], ['3/4', '0.75'], ['1/5', '0.2'], ['1/8', '0.125'], ['3/8', '0.375'], ['1/16', '0.0625'], ['1/3', '0.333…'], ['1/6', '0.1666…'], ['1/7', '0.142857…'], ['1/9', '0.111…'], ['1/11', '0.0909…'], ['1/12', '0.0833…']];

function addQ(rng, related, op = '+') {
  for (;;) {
    const [a, b] = proper(rng, [2, 3, 4, 5, 6, 8, 9, 10, 12]), [c, d] = proper(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
    if (b === d || (b % d === 0 || d % b === 0) !== related) continue;
    const L = lcm(b, d), A = (a * L) / b, C = (c * L) / d, n = op === '+' ? A + C : A - C;
    if (n <= 0 || n % L === 0) continue;
    return N(`${a}/${b} ${op} ${c}/${d} = ?${TYPE}`, n / L, `Over ${L}: ${A}/${L} ${op} ${C}/${L} = ${n}/${L}${frac(n, L) !== `${n}/${L}` ? ` = ${frac(n, L)}` : ''}.`);
  }
}

const pool = [
  // 0 recognise: which operation needs a common denominator
  (rng) => { const [a, b] = proper(rng, [3, 4, 5, 6]), [c, d] = proper(rng, [7, 8, 9]); return mc({ q: `Which of these needs a common denominator first?`, right: `${a}/${b} + ${c}/${d}`, wrong: [[`${a}/${b} × ${c}/${d}`, 'a product goes straight across: tops times tops, bottoms times bottoms'], [`${a}/${b} ÷ ${c}/${d}`, 'a quotient flips the second fraction and multiplies'], [`${a}/${b} × ${d}`, 'a fraction times a whole number multiplies the top']], explain: 'Only + and − need equal pieces; × and ÷ work on tops and bottoms directly.' }, rng); },
  // 1 same denominator
  (rng) => { const d = rng.pick([7, 9, 11, 12]), a = rng.int(1, d - 3), b = rng.int(1, d - 1 - a); return N(`${a}/${d} + ${b}/${d} = ?${TYPE}`, (a + b) / d, `Same pieces: ${a} + ${b} = ${a + b} of them: ${frac(a + b, d)}.`); },
  // 2 related denominators
  (rng) => addQ(rng, true),
  // 3 unrelated denominators
  (rng) => addQ(rng, false),
  // 4 subtract
  (rng) => addQ(rng, rng.chance(0.5), '−'),
  // 5 multiply, cancel first
  (rng) => { for (;;) { const [a, b] = proper(rng, [3, 4, 5, 6, 8, 9]), [c, d] = proper(rng, [3, 4, 5, 6, 8, 9, 10]); if (gcd(a, d) === 1 && gcd(c, b) === 1) continue; const n = a * c, m = b * d; if (n % m === 0) continue; return N(`${a}/${b} × ${c}/${d} = ?${TYPE}`, n / m, `Cancel across first, then ${frac(n, m)}.`); } },
  // 6 divide, flip the second
  (rng) => { for (;;) { const [a, b] = proper(rng, [3, 4, 5, 6, 8]), [c, d] = proper(rng, [3, 4, 5, 8, 10]); const n = a * d, m = b * c; if (n % m === 0) continue; return N(`${a}/${b} ÷ ${c}/${d} = ?${TYPE}`, n / m, `${a}/${b} × ${d}/${c} = ${frac(n, m)}.`); } },
  // 7 size check
  (rng) => { const [a, b] = rng.pick([[1, 2], [1, 3], [2, 3], [1, 4]]), [c, d] = rng.pick([[1, 5], [1, 6], [2, 5], [3, 8]]), L = lcm(b, d), n = (a * L) / b + (c * L) / d; return mc({ q: `Which can be ${a}/${b} + ${c}/${d}?`, right: frac(n, L), wrong: [[frac(a + c, b + d), `smaller than ${a}/${b} alone: added tops and bottoms`], [frac(a * c, b * d), 'that is the product, smaller than both'], [frac(a + c, Math.max(b, d)), 'put both over the larger bottom without rescaling']], explain: `Over ${L}: ${n}/${L}${frac(n, L) !== `${n}/${L}` ? ` = ${frac(n, L)}` : ''}. A sum must be bigger than each part.` }, rng); },
  // 8 fraction to decimal
  (rng) => { const [f, dv] = rng.pick([['1/8', '0.125'], ['3/8', '0.375'], ['5/8', '0.625'], ['1/16', '0.0625'], ['3/4', '0.75'], ['1/5', '0.2']]); const wr = { '0.125': [['0.18', 'read 1/8 as "1 point 8"'], ['0.0125', 'a place too far'], ['0.25', 'that is 1/4']], '0.375': [['0.38', 'read 3/8 as "3 point 8"'], ['0.625', 'that is 5/8'], ['0.0375', 'a place too far']], '0.625': [['0.58', 'read 5/8 as "5 point 8"'], ['0.375', 'that is 3/8'], ['0.6', 'that is 3/5']], '0.0625': [['0.16', 'read 1/16 as "point 16"'], ['0.625', 'a place too few'], ['0.125', 'that is 1/8']], '0.75': [['0.34', 'read 3/4 as "3 point 4"'], ['0.25', 'that is 1/4'], ['0.075', 'a place too far']], '0.2': [['0.15', 'read 1/5 as "1 point 5"'], ['0.25', 'that is 1/4'], ['0.02', 'a place too far']] }[dv]; return mc({ q: `${f} as a decimal?`, right: dv, wrong: wr, explain: `${f} = ${dv}: halve 1/2 = 0.5 to 1/4 = 0.25, 1/8 = 0.125, 1/16 = 0.0625, then multiply up.` }, rng); },
  // 9 name the slip
  (rng) => { const [a, b] = rng.pick([[3, 4], [2, 3], [5, 6], [3, 5]]), [c, d] = rng.pick([[9, 10], [4, 5], [7, 8], [5, 9]]); return mc({ q: `A candidate answers ${a}/${b} ÷ ${c}/${d} = ${frac(b * c, a * d)}. What went wrong?`, right: 'Flipped the first fraction', wrong: [['Did not flip at all', `that gives ${frac(a * c, b * d)}`], ['Added instead of dividing', `that gives ${frac(a * d + c * b, b * d)}`], ['Forgot to cancel', `cancelling does not change the value`]], explain: `Flip the SECOND: ${a}/${b} × ${d}/${c} = ${frac(a * d, b * c)}. The candidate's answer is that upside down.` }, rng); },
];

const ADD = []; for (let c = 0; c < 5; c++) ADD.push([0, c]);
const MUL = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) MUL.push([r, c]);

export default {
  id: 'mm/fractions',
  book: 'mm',
  kind: 'family',
  family: 'mm-fractions',
  title: 'Fractions',
  summary: 'Add and subtract over a common denominator; multiply straight across after cancelling; divide by flipping the second fraction. Know the eighths, sixteenths and the recurring ones as decimals.',
  prerequisites: ['mm/decimals'],
  objectives: [
    'Add and subtract fractions with denominators up to 12 and give the answer in lowest terms',
    'Multiply and divide fractions, cancelling first',
    'Convert 1/8, 3/8, 1/16, 1/3, 1/6, 1/7, 1/9, 1/11 and 1/12 to decimals from memory',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: work out 2/3 + 3/4 and 3/4 ÷ 9/10. Try two ways for the first.', answer: '17/12 and 5/6.',
      explain: '2/3 + 3/4 = 8/12 + 9/12 = 17/12 (or cross-multiply: (2×4 + 3×3)/12). 3/4 ÷ 9/10 = 3/4 × 10/9 = 30/36 = 5/6.',
      attempts: [
        { id: 'topsbottoms', label: 'Added tops and bottoms', approach: '2 + 3 over 3 + 4: 5/7.', breaksAt: '5/7 is smaller than 3/4 alone; pieces of different sizes cannot be counted together.' },
        { id: 'flipfirst', label: 'Flipped the first fraction', approach: '4/3 × 9/10 = 36/30 = 6/5.', breaksAt: 'It is the divisor that is turned over: 3/4 × 10/9.' },
      ] },
    { type: 'text', text: 'The cue: a fraction bar inside a number, like 3/4 (the division sign between numbers is ÷ or :). The answer is a fraction in lowest terms, and the wrong options are the classic slips.' },
    check(pool, 0, 'which operation needs what'),

    sec('why'),
    { type: 'text', text: 'Fraction options on the 80-in-8 differ by exactly the slips this lesson names: tops and bottoms added, the wrong fraction flipped, a numerator off by one. Knowing the slips is worth as much as the method.' },
    check(pool, 0, 'which operation needs what'),

    sec('anchor'),
    { type: 'text', text: 'You know that 3/8 + 2/8 = 5/8: same-sized pieces add by counting them. **One change**: when the pieces differ, cut them into a common size first.' },
    check(pool, 1, 'same pieces'),

    sec('picture'),
    { type: 'diagram', diagram: 'grid', spec: { rows: 1, cols: 8, highlight: ADD, count: 5, colTitle: 'eighths' }, caption: '1/4 + 3/8: a quarter is 2 eighths, so the strip shows 2 + 3 = 5 eighths, 5/8. The common size here is the eighth.' },
    check(pool, 3, 'common denominators'),
    { type: 'diagram', diagram: 'grid', spec: { rows: 3, cols: 4, highlight: MUL, count: 6, rowTitle: '2/3 of the rows', colTitle: '3/4 of the columns' }, caption: '2/3 × 3/4 as an area: 2 of 3 rows times 3 of 4 columns covers 6 of 12 cells, 1/2. Tops times tops over bottoms times bottoms; no common denominator needed.' },
    check(pool, 5, 'multiplying'),
    { type: 'diagram', diagram: 'table', spec: { columns: ['fraction', 'decimal'], rows: TABLE }, caption: 'The table to know cold. Eighths are halvings of 1/4; sixteenths of 1/8. 1/7 = 0.142857 repeats six digits; 1/9 = 0.111…, 1/11 = 0.0909…, 1/12 = 0.08333….' },
    check(pool, 8, 'fractions as decimals'),

    sec('derivation'),
    { type: 'text', text: 'Four moves, one per operation, then the size check.' },
    { type: 'steps', steps: [
      { answers: 'topsbottoms', say: '+ and −: find the smallest common denominator, rescale each top, then add or take the tops. 2/3 + 3/4 = 8/12 + 9/12 = 17/12.', why: 'Only equal pieces can be counted together; the bottom names the piece size and stays.', checks: [cum(pool, 4)] },
      { say: '×: cancel any top with any bottom first, then tops times tops over bottoms times bottoms. 2/3 × 9/10 → 1/1 × 3/5 = 3/5.', why: 'A fraction of a fraction; cancelling first keeps the numbers small.', checks: [cum(pool, 5)] },
      { answers: 'flipfirst', say: '÷: flip the SECOND fraction and multiply. 3/4 ÷ 9/10 = 3/4 × 10/9 = 5/6.', why: 'Dividing by 9/10 undoes multiplying by 9/10, and 10/9 does exactly that.', checks: [cum(pool, 6)] },
      { say: 'Size: a sum is bigger than each part, a product of two proper fractions smaller than each, and ÷ a fraction below 1 makes it bigger.', why: 'Every classic slip breaks one of these: 2/5 for 1/2 + 1/3 is smaller than 1/2.', checks: [cum(pool, 7)] },
    ] },
    { type: 'explain', prompt: 'Why does 1/2 + 1/3 not equal 2/5?', model: 'A half and a third are pieces of different sizes, so their tops cannot be counted together. Cut both into sixths: 3/6 + 2/6 = 5/6. And 2/5 is smaller than 1/2 alone, which a sum can never be.', points: ['Different piece sizes', 'Rescale to sixths: 5/6', '2/5 is smaller than one part'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'mm-fractions', section: 'mm', difficulty: 1, seed: 'a', intro: 'A sum with related denominators or a product. Answer first.' },
    { type: 'worked', family: 'mm-fractions', section: 'mm', difficulty: 2, seed: 'b', fade: 1, intro: 'The rescaling is given; finish it.' },
    { type: 'thinkaloud', problem: '5/6 − 3/8 = ?', lines: [
      { t: 0, say: 'Minus: common denominator. 6 and 8 both go into 24.' },
      { t: 2, say: 'Over 24: 5 − 3 = 2, so 2/24 = 1/12.', slip: true },
      { t: 4, say: 'No: I did not rescale. 5/6 = 20/24 and 3/8 = 9/24.' },
      { t: 6, say: '20 − 9 = 11: 11/24. Size: 0.83 − 0.38 ≈ 0.46, and 11/24 ≈ 0.46. Tap it.' },
    ] },
    check(pool, 8, 'everything so far'),

    sec('predict'),
    { type: 'predict', question: '1/2 + 1/3: is the answer 2/5? Decide without working it out.', answer: 'No: 2/5 is less than 1/2 alone, and a sum is bigger than each part. It is 5/6.', explain: 'The size check rejects "tops plus tops over bottoms plus bottoms" in one glance.' },

    sec('traps'),
    { type: 'traps', family: 'mm-fractions', section: 'mm', extra: [
      { belief: 'Add tops and add bottoms.', fix: 'That gives a smaller answer than one part. Rescale to a common denominator.' },
      { belief: 'To divide fractions, flip the first one.', fix: 'Flip the second (the divisor): 3/4 ÷ 9/10 = 3/4 × 10/9.' },
      { belief: 'A common denominator is needed to multiply.', fix: 'Not for × and ÷: straight across, cancelling first.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out 2/3 + 3/4. One step is wrong.', steps: ['The common denominator is 12.', '2/3 = 8/12 and 3/4 = 9/12.', '8/12 + 9/12 = 17/24.'], errorStep: 2, explain: 'The denominator stays 12: twelfths plus twelfths are twelfths. 17/12. Size check: 2/3 + 3/4 is more than 1, and 17/24 is less.' },
    { type: 'check', scope: 'naming the slip', questions: [cum(pool, 9), mc({ q: 'Options for 2/3 + 3/4 are 5/7, 5/12, 17/24, 17/12. Which belief gives 5/12?', right: 'Common bottom, tops left as they were', wrong: [['Add the tops and add the bottoms', 'that gives 5/7'], ['Rescale, then add the bottoms too', 'that gives 17/24'], ['Rescale both, then add the tops', 'that is the right method and gives 17/12']], explain: '5/12 puts both over 12 but adds the old tops 2 + 3; rescaled they are 8 and 9, so 17/12.' })] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Cross-multiply for any sum of two fractions: a/b + c/d = (ad + bc)/bd, then reduce. 3/5 + 1/4 = (12 + 5)/20 = 17/20. For a decimal option list, convert with the table: 3/8 = 0.375.' },
    check(pool, 9, 'cross-multiplying'),

    sec('rule'),
    { type: 'callout', tone: 'rule', text: '+ −: common denominator, then tops. ×: cancel, then straight across. ÷: flip the second, then ×. Lowest terms. Size check: sums grow, proper products shrink.' },
    check(pool, 9, 'the rule'),

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Move', 'Answer'], rows: [['2/3 + 3/4', 'over 12', '17/12'], ['2/3 × 3/4', 'cancel 3s', '1/2'], ['2/3 ÷ 3/4', '2/3 × 4/3', '8/9'], ['3/4 ÷ 2/3', '3/4 × 3/2', '9/8']] },
    check(pool, 9, 'choosing the move'),
    { type: 'variation', base: 'Base: 2/3 + 3/4 = 17/12.', rows: [
      { change: '+ becomes ×', effect: 'No common denominator: 6/12 = 1/2.' },
      { change: '3/4 becomes 1/3', effect: 'Same denominators: 3/3 = 1.' },
      { same: true, change: 'The order is swapped: 3/4 + 2/3', effect: 'No change: 17/12.' },
      { fusion: true, change: '+ becomes − AND 3/4 becomes 1/6', effect: '2/3 − 1/6 = 4/6 − 1/6 = 3/6 = 1/2.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a sum can be a whole number (1/2 + 1/2 = 1), but the options then are whole too. Order matters for − and ÷ only: 3/4 ÷ 2/3 = 9/8 but 2/3 ÷ 3/4 = 8/9.' },
    check(pool, 9, 'edge cases'),
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "of" between two fractions means multiply (2/3 of 3/4 is 1/2), and odds or shares of a share in a probability question are the same products.' },
    check(pool, 9, 'transfer'),
    { type: 'transfer',
      near: { make: (rng) => { const [a, b] = rng.pick([[3, 4], [2, 3], [5, 8], [4, 5]]), [c, d] = rng.pick([[2, 3], [1, 2], [3, 5], [3, 4]]); return N(`Of a desk's trades, ${a}/${b} are equities and ${c}/${d} of those are buys. What fraction of all trades are equity buys?${TYPE}`, (a * c) / (b * d), `${a}/${b} × ${c}/${d} = ${frac(a * c, b * d)}.`); } },
      far: N(`Outside the test: you eat 2/3 of half a pizza. What fraction of the whole pizza is that?${TYPE}`, 1 / 3, '2/3 × 1/2 = 2/6 = 1/3.'),
      principle: mc({ q: 'Which idea carried over from the trades to the pizza?', right: '"Of" between fractions means multiply', wrong: [['Find a common denominator first', 'nothing was added'], ['Flip the second fraction and multiply', 'nothing was divided'], ['Add the tops and add the bottoms', 'that is never right']], explain: 'A fraction of a fraction is their product: tops times tops over bottoms times bottoms.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'mm-fractions', section: 'mm', count: 3 },
  ],
};
