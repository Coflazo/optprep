// Curated NumberLogic items. Original sequences written in the style of reported past
// questions; meta.source names the report each pattern type comes from. Every item is
// re-derived by the rule search in tests (unique continuation, answer among the options).
import { makeRng } from '../../core/rng.js';
import { buildMcq } from '../../core/options.js';
import { label, parseQ, genericRivals, encodeTerm } from './lib.js';
import { families } from './registry.js';

const SRC = {
  qv: 'QuantVault, Optiver online assessment guide (reported two-term recurrence example); original rewrite',
  qb: 'QuantBrainteasers, Optiver OA guide: differences, ratios, second differences, alternating strands, squares; original item',
  atp: 'Aptitude Test Prep, Optiver NumberLogic format (5 to 7 terms, 5 options, difficulty ramps); original item',
  eq: 'EverythingQuant NumberLogic tool: alternating, multi-step, prime and Fibonacci-style categories; original item',
  qp: 'QuantPrep Optiver sequences intro: two-term recurrences, product of previous, difference ladders; original item',
  jtp: 'JobTestPrep number-series pattern families (digit, reversal and fraction rules); original item',
  tm: 'Tradermath NumberLogic practice format (fractions, large numbers, alternating rules late in the test); original item',
};

function item(n, { fam, d, seq, ans, rule, steps, rivals = [], hints, src, c = {} }) {
  const F = families.find((f) => f.id === fam);
  if (!F) throw new Error(`bank: unknown family ${fam}`);
  const mode = seq.some((s) => s.includes('/')) ? 'frac' : seq.some((s) => s.includes('.')) || ans.includes('.') ? 'dec' : 'int';
  const shown = seq.map(parseQ), target = parseQ(ans), correctLabel = label(target, mode);
  const cands = [...rivals.map(([v, m]) => ({ value: parseQ(v), misconception: m })), ...genericRivals(shown, mode)];
  const seen = new Set([correctLabel]), chosen = [];
  for (const c of cands) {
    const l = label(c.value, mode);
    if (seen.has(l) || (mode === 'int' && c.value.d !== 1n) || l.length > 12) continue;
    seen.add(l);
    chosen.push({ ...c, label: l });
    if (chosen.length === 4) break;
  }
  if (chosen.length < 4) throw new Error(`nl bank item ${n} (${seq.join(', ')}): only ${chosen.length} distractors`);
  const byValue = new Map([[target.toNumber(), correctLabel], ...chosen.map((c) => [c.value.toNumber(), c.label])]);
  const mcq = buildMcq(makeRng(`nl-bank-${n}`), {
    correct: target.toNumber(),
    distractors: chosen.map((c) => ({ value: c.value.toNumber(), misconception: c.misconception })),
    format: (v) => byValue.get(v), minGap: () => 0, fillers: [],
  });
  const labels = shown.map((x) => label(x, mode));
  return {
    id: `nl:bank:${String(n).padStart(2, '0')}`,
    section: 'nl',
    family: fam,
    difficulty: d,
    kind: 'mcq',
    prompt: { text: `What number comes next?  ${labels.join(', ')}, ?`, sequence: [...labels, '?'] },
    ...mcq,
    answer: { value: target.toNumber(), label: correctLabel, rule },
    solution: { steps: steps.map(([say, why]) => ({ say, why })), rule: F.lesson.rule, anchor: F.lesson.anchor },
    hints: hints || ['Start with the gaps between neighbours.', 'If the gaps do not settle, try ratios, then look for two strands or a two-term rule.'],
    params: { rule: fam, coeffs: c, shown: shown.map(encodeTerm), next: encodeTerm(target), position: shown.length },
    meta: { source: SRC[src] },
  };
}

const RAW = [
  // difficulty 1
  { fam: 'arithmetic', d: 1, src: 'qb', c: { a: 7, d: 6 }, seq: ['7', '13', '19', '25', '31'], ans: '37', rule: 'add 6',
    steps: [['Gaps: 6, 6, 6, 6.', 'Subtract neighbours first; the gap is constant.'], ['31 + 6 = 37.', 'Constant gap: add it once more.']],
    rivals: [['36', 'Misread the gap as 5: 13 − 7 is 6.'], ['25', 'Subtracted the gap; the terms rise by 6.'], ['43', 'Added the gap twice: 43 is the term after the next one.']] },
  { fam: 'geometric', d: 1, src: 'qb', c: { a: 5, r: 2 }, seq: ['5', '10', '20', '40', '80'], ans: '160', rule: 'multiply by 2',
    steps: [['Gaps 5, 10, 20, 40 grow with the terms.', 'Growing gaps point to multiplication.'], ['Every ratio is 2, so 80 × 2 = 160.', 'Constant ratio: multiply once more.']],
    rivals: [['120', 'Added the last gap (40) again; the gaps double too.'], ['320', 'Doubled twice: 320 is the term after the next one.']] },
  { fam: 'squares-plus', d: 1, src: 'qb', c: { base0: 1, k: 1 }, seq: ['2', '5', '10', '17', '26'], ans: '37', rule: 'n² + 1',
    steps: [['Each term is one more than a square: 1, 4, 9, 16, 25.', 'Subtracting 1 leaves consecutive squares.'], ['6² + 1 = 37.', 'The next base is 6.']],
    rivals: [['36', 'Found 6² but dropped the + 1.'], ['35', 'Added the last gap (9) again; the gaps grow by 2.'], ['50', 'Skipped a base: 7² + 1 is the term after the next one.']] },
  { fam: 'triangular', d: 1, src: 'atp', c: { m0: 1, k: 1, c: 0 }, seq: ['1', '3', '6', '10', '15'], ans: '21', rule: 'triangular numbers',
    steps: [['Gaps: 2, 3, 4, 5.', 'The gaps are the counting numbers.'], ['15 + 6 = 21.', 'The next gap is 6.']],
    rivals: [['20', 'Added 5 again; the gap rises by 1 every step.'], ['25', 'Switched to square numbers; triangular gaps are 2, 3, 4, 5, not odd numbers.'], ['28', 'Added two gaps: 28 is the term after the next one.'], ['16', 'Added 1 to the last term; the gap rises to 6, not back to 1.']] },
  { fam: 'arithmetic', d: 1, src: 'atp', c: { a: 50, d: -6 }, seq: ['50', '44', '38', '32', '26'], ans: '20', rule: 'subtract 6',
    steps: [['Gaps: −6 each time.', 'A falling sequence with a constant gap is still arithmetic.'], ['26 − 6 = 20.', 'Apply the same step.']],
    rivals: [['32', 'Added 6 instead of subtracting it: the terms fall.'], ['21', 'Misread the gap as 5: 50 − 44 is 6.'], ['14', 'Subtracted 6 twice: 14 is the term after the next one.']] },
  { fam: 'pronic', d: 1, src: 'qb', c: { b0: 1, c: 1 }, seq: ['2', '6', '12', '20', '30'], ans: '42', rule: 'n(n + 1)',
    steps: [['Factor: 1×2, 2×3, 3×4, 4×5, 5×6.', 'Each term is a product of neighbours.'], ['6 × 7 = 42.', 'Both factors step up by 1.']],
    rivals: [['36', 'Used 6² instead of 6 × 7.'], ['40', 'Added 10 again; the gaps go 4, 6, 8, 10, 12.']] },
  { fam: 'geometric', d: 1, src: 'atp', c: { a: 243, r: [1, 3] }, seq: ['243', '81', '27', '9', '3'], ans: '1', rule: 'divide by 3',
    steps: [['Each term is a third of the one before.', 'Shrinking terms with a constant ratio: the ratio is 1/3.'], ['3 ÷ 3 = 1.', 'Apply the ratio once more.']],
    rivals: [['0', 'Subtracted the last gap pattern to 0; the terms divide, they never reach 0.'], ['9', 'Multiplied by 3; the sequence is shrinking.']] },
  { fam: 'squares-plus', d: 1, src: 'qb', c: { base0: 1, k: -1 }, seq: ['0', '3', '8', '15', '24'], ans: '35', rule: 'n² − 1',
    steps: [['Add 1 to each: 1, 4, 9, 16, 25.', 'The terms sit one below the squares.'], ['6² − 1 = 35.', 'Next base 6.']],
    rivals: [['36', 'Found 6² but dropped the − 1.'], ['48', 'Skipped a base: 7² − 1 is the term after the next one.']] },
  { fam: 'second-diff', d: 1, src: 'qb', c: { a: 100, d0: -3, s: -3 }, seq: ['100', '97', '91', '82', '70'], ans: '55', rule: 'subtract 3, 6, 9, 12, 15',
    steps: [['Gaps: −3, −6, −9, −12.', 'The gaps themselves change by −3 each time.'], ['Next gap −15: 70 − 15 = 55.', 'Continue the gap pattern.']],
    rivals: [['58', 'Repeated the last gap (−12); the gaps grow by 3 each step.'], ['52', 'Moved the gap by −6 instead of −3.'], ['37', 'Applied two gaps (−15, −18): 37 is the term after the next one.']] },
  // difficulty 2
  { fam: 'interleaved', d: 2, src: 'qb', c: { odd: { kind: 'arith', a: 3, d: 2 }, even: { kind: 'geo', a: 12, r: 2 } }, seq: ['3', '12', '5', '24', '7', '48'], ans: '9', rule: 'odd positions add 2; even positions double',
    steps: [['Split: positions 1, 3, 5 give 3, 5, 7; positions 2, 4, 6 give 12, 24, 48.', 'Neighbours are unrelated, every second term is regular.'], ['Position 7 continues 3, 5, 7: next 9.', 'The next position is odd.']],
    rivals: [['96', 'Continued the wrong strand: 96 would be position 8.']] },
  { fam: 'fibonacci-like', d: 2, src: 'qp', c: { a: 3, b: 4 }, seq: ['3', '4', '7', '11', '18', '29'], ans: '47', rule: 'sum of the previous two',
    steps: [['Gaps 1, 3, 4, 7, 11 repeat the sequence two places back.', 'That is the fingerprint of a(n) = a(n−1) + a(n−2).'], ['18 + 29 = 47.', 'Add the last two terms.']],
    rivals: [['58', 'Doubled 29; the rule adds the two previous terms.']] },
  { fam: 'powers-offset', d: 2, src: 'atp', c: { b: 2, s: 1, c: 1 }, seq: ['3', '5', '9', '17', '33'], ans: '65', rule: '2^n + 1',
    steps: [['Gaps 2, 4, 8, 16 double.', 'Doubling gaps mean powers of 2 inside.'], ['Terms are 2^n + 1: next 64 + 1 = 65.', 'Remove the constant, double, restore.']],
    rivals: [['66', 'Doubled 33, constant included; only the power part doubles.'], ['64', 'Found 2^6 but dropped the + 1.']] },
  { fam: 'multiply-index', d: 2, src: 'atp', c: { a: 1, mult0: 2 }, seq: ['1', '2', '6', '24', '120'], ans: '720', rule: 'multiply by 2, 3, 4, 5, 6',
    steps: [['Ratios: 2, 3, 4, 5.', 'The multiplier counts up.'], ['120 × 6 = 720.', 'Next multiplier 6.']],
    rivals: [['600', 'Reused the multiplier 5.'], ['840', 'Jumped the multiplier to 7.']] },
  { fam: 'primes', d: 2, src: 'eq', c: { startPrime: 2 }, seq: ['2', '3', '5', '7', '11', '13', '17'], ans: '19', rule: 'the primes',
    steps: [['Irregular gaps 1, 2, 2, 4, 2, 4 that never settle.', 'The signature of the primes.'], ['The prime after 17 is 19.', 'Both 19 and 17 are prime; 21 = 3 × 7 is not.']],
    rivals: [['21', 'Took the odd number after 19; 21 = 3 × 7 is not prime, and it skips 19.'], ['23', 'Skipped the prime 19.'], ['18', 'Added 1 as between 2 and 3; after 2 every prime is odd, so 18 cannot be next.']] },
  { fam: 'cubes-plus', d: 2, src: 'qb', c: { base0: 1, k: 0 }, seq: ['1', '8', '27', '64', '125'], ans: '216', rule: 'cubes',
    steps: [['These are 1³, 2³, 3³, 4³, 5³.', 'Know the cubes to 12³.'], ['6³ = 216.', 'Next base 6.']],
    rivals: [['36', 'Squared 6 instead of cubing it.'], ['186', 'Repeated the last gap (61); the gaps grow.']] },
  { fam: 'second-diff', d: 2, src: 'qb', c: { a: 4, d0: 2, s: 3 }, seq: ['4', '6', '11', '19', '30'], ans: '44', rule: 'gaps 2, 5, 8, 11, 14',
    steps: [['Gaps: 2, 5, 8, 11.', 'Not constant, but they rise by 3.'], ['Next gap 14: 30 + 14 = 44.', 'Second difference 3.']],
    rivals: [['41', 'Repeated the last gap 11.'], ['47', 'Increased the gap by 6 instead of 3.'], ['61', 'Applied two gaps (14, 17): 61 is the term after the next one.']] },
  { fam: 'affine-recurrence', d: 2, src: 'qp', c: { k: 2, c: 1 }, seq: ['5', '11', '23', '47', '95'], ans: '191', rule: 'a(n) = 2a(n−1) + 1',
    steps: [['Ratios are just over 2.', 'Multiplication plus a small constant.'], ['2 × 95 + 1 = 191.', 'Every step is double plus one.']],
    rivals: [['190', 'Doubled but forgot the + 1.'], ['192', 'Added 1 before doubling.']] },
  { fam: 'geometric', d: 2, src: 'tm', c: { a: 1, r: -2 }, seq: ['1', '−2', '4', '−8', '16'], ans: '−32', rule: 'multiply by −2',
    steps: [['Signs alternate and sizes double.', 'A negative ratio flips the sign each step.'], ['16 × (−2) = −32.', 'Apply the ratio once more.']],
    rivals: [['32', 'Dropped the sign flip.']] },
  { fam: 'decimals', d: 2, src: 'tm', c: { a: 0.5, r: 3 }, seq: ['0.5', '1.5', '4.5', '13.5', '40.5'], ans: '121.5', rule: 'multiply by 3',
    steps: [['Ratios: 3 each time.', 'Decimals do not change the ratio test.'], ['40.5 × 3 = 121.5.', 'Apply the ratio.']],
    rivals: [['12.15', 'Decimal point slip: ten times too small.'], ['67.5', 'Added the last gap (27) again.']] },
  { fam: 'alternating-ops', d: 2, src: 'eq', c: { ops: [['add', 3], ['mul', 2]] }, seq: ['7', '10', '20', '23', '46', '49'], ans: '98', rule: 'alternate +3 and ×2',
    steps: [['Steps: +3, ×2, +3, ×2, +3.', 'Two operations take turns.'], ['The next step is ×2: 49 × 2 = 98.', 'The last step was +3.']],
    rivals: [['52', 'Applied +3 again; the operations alternate.']] },
  // difficulty 3
  { fam: 'weighted-two-term', d: 3, src: 'qv', c: { p: 2, q: 1, c: 0 }, seq: ['3', '7', '17', '41', '99'], ans: '239', rule: 'a(n) = 2a(n−1) + a(n−2)',
    steps: [['Last + previous is too small (7 + 17 = 24, not 41).', 'Rule out the plain two-term sum first.'], ['2 × 17 + 7 = 41 and 2 × 41 + 17 = 99: weights 2 and 1.', 'Two steps fix the weights; the rest check them.'], ['2 × 99 + 41 = 239.', 'Apply the weights once more.']],
    rivals: [['140', 'Added the last two terms without the weight 2.'], ['181', 'Swapped the weights: 99 + 2 × 41.']] },
  { fam: 'affine-recurrence', d: 3, src: 'qp', c: { k: 3, c: 1 }, seq: ['1', '4', '13', '40', '121'], ans: '364', rule: 'a(n) = 3a(n−1) + 1',
    steps: [['Ratios approach 3 (4, 3.25, 3.08, 3.03).', 'Multiply by 3, then a small constant.'], ['3 × 121 + 1 = 364.', 'The leftover after tripling is always 1.']],
    rivals: [['363', 'Tripled but forgot the + 1.']] },
  { fam: 'product-recurrence', d: 3, src: 'qp', c: { c: 0 }, seq: ['2', '3', '6', '18', '108'], ans: '1944', rule: 'a(n) = a(n−1) × a(n−2)',
    steps: [['Growth is explosive: 18 → 108.', 'Terms are multiplied together.'], ['18 × 108 = 1944.', 'Multiply the last two terms.']],
    rivals: [['126', 'Added the last two terms instead of multiplying.'], ['648', 'Multiplied by the ratio 6 again.']] },
  { fam: 'tribonacci', d: 3, src: 'eq', c: { window: 3, c: 0 }, seq: ['1', '2', '4', '7', '13', '24'], ans: '44', rule: 'sum of the previous three',
    steps: [['7 + 13 = 20, not 24: two terms are not enough.', 'Test the two-term sum first.'], ['4 + 7 + 13 = 24 and 2 + 4 + 7 = 13: three terms.', 'Check the window on two steps.'], ['7 + 13 + 24 = 44.', 'Add the last three.']],
    rivals: [['37', 'Added only the last two terms.']] },
  { fam: 'prime-gaps', d: 3, src: 'eq', c: { a: 1, startPrime: 2 }, seq: ['1', '3', '6', '11', '18', '29'], ans: '42', rule: 'add 2, 3, 5, 7, 11, 13',
    steps: [['Gaps: 2, 3, 5, 7, 11.', 'The gaps are consecutive primes.'], ['Next gap 13: 29 + 13 = 42.', 'The prime after 11 is 13.']],
    rivals: [['38', 'Used 9 as the next gap; 9 is not prime.'], ['46', 'Skipped the prime 13.']] },
  { fam: 'fractions', d: 3, src: 'tm', c: { num: { a: 2, d: 3 }, den: { a: 3, d: 4 } }, seq: ['2/3', '5/7', '8/11', '11/15', '14/19'], ans: '17/23', rule: 'numerators +3, denominators +4',
    steps: [['Numerators 2, 5, 8, 11, 14; denominators 3, 7, 11, 15, 19.', 'Split the fraction into two sequences.'], ['Next: 17/23.', 'Numerators add 3, denominators add 4.']],
    rivals: [['17/19', 'Advanced only the numerator.'], ['14/23', 'Advanced only the denominator.']] },
  { fam: 'digit-sum', d: 3, src: 'jtp', c: { op: 'sum' }, seq: ['23', '28', '38', '49', '62', '70'], ans: '77', rule: 'add the digit sum',
    steps: [['Gaps 5, 10, 11, 13, 8: small and patternless.', 'The symptom of a digit rule.'], ['Each gap is the digit sum of the term before: 2 + 3 = 5, 2 + 8 = 10, …', 'Check on every step.'], ['7 + 0 = 7: 70 + 7 = 77.', 'Apply to the last term.']],
    rivals: [['78', 'Added the digit sum of 62 (8) instead of 70.']] },
  { fam: 'cubes-plus', d: 3, src: 'qb', c: { base0: 1, cube: 1, square: 1 }, seq: ['2', '12', '36', '80', '150'], ans: '252', rule: 'n³ + n²',
    steps: [['Compare with cubes 1, 8, 27, 64, 125: leftovers 1, 4, 9, 16, 25.', 'The leftover is a square.'], ['6³ + 6² = 216 + 36 = 252.', 'Both parts move with the base.']],
    rivals: [['216', 'Took 6³ and dropped the square.'], ['241', 'Assumed the second differences stay at 26.']] },
  { fam: 'affine-recurrence', d: 3, src: 'atp', c: { k: 3, c: -1 }, seq: ['1', '2', '5', '14', '41'], ans: '122', rule: 'a(n) = 3a(n−1) − 1',
    steps: [['Ratios approach 3 from below.', 'Multiply by 3, then subtract a constant.'], ['3 × 41 − 1 = 122.', 'The leftover is −1 every step.']],
    rivals: [['123', 'Tripled but forgot the − 1.']] },
  { fam: 'alternating-ops', d: 3, src: 'eq', c: { ops: [['mul', 2], ['sub', 1]] }, seq: ['4', '8', '7', '14', '13', '26'], ans: '25', rule: 'alternate ×2 and −1',
    steps: [['Steps: ×2, −1, ×2, −1, ×2.', 'Two operations alternate.'], ['The next step is −1: 26 − 1 = 25.', 'The last step was ×2.']],
    rivals: [['52', 'Doubled again; the operations alternate.']] },
  { fam: 'third-diff', d: 3, src: 'qb', c: { a: 1, gapPower: 2, gapBase0: 2 }, seq: ['1', '5', '14', '30', '55', '91'], ans: '140', rule: 'sums of squares',
    steps: [['Gaps 4, 9, 16, 25, 36 are squares.', 'Each term adds the next square.'], ['91 + 49 = 140.', 'The next square is 7².']],
    rivals: [['127', 'Assumed the gaps grow by a constant 11.']] },
  { fam: 'affine-recurrence', d: 3, src: 'qp', c: { k: 2, c: 2 }, seq: ['3', '8', '18', '38', '78'], ans: '158', rule: 'a(n) = 2a(n−1) + 2',
    steps: [['Ratios drift down towards 2.', 'Double plus a constant.'], ['2 × 78 + 2 = 158.', 'The leftover after doubling is always 2.']],
    rivals: [['156', 'Doubled but forgot the + 2.']] },
  // difficulty 4
  { fam: 'fibonacci-squares', d: 4, src: 'eq', c: { fibIndex0: 0, power: 2 }, seq: ['1', '1', '4', '9', '25', '64'], ans: '169', rule: 'squares of Fibonacci numbers',
    steps: [['All perfect squares: roots 1, 1, 2, 3, 5, 8.', 'The roots are Fibonacci numbers.'], ['13² = 169.', 'Next root 5 + 8 = 13.']],
    rivals: [['89', 'Added the last two terms; only the roots add.'], ['13', 'Found the root 13 but forgot to square it.']] },
  { fam: 'third-diff', d: 4, src: 'qb', c: { a: 2, gapPower: 2, gapBase0: 1 }, seq: ['2', '3', '7', '16', '32', '57'], ans: '93', rule: 'gaps are 1, 4, 9, 16, 25',
    steps: [['Gaps: 1, 4, 9, 16, 25.', 'The gaps are the squares.'], ['57 + 36 = 93.', 'The next square is 6².']],
    rivals: [['84', 'Assumed the gaps grow by a constant 9.']] },
  { fam: 'reverse-digits', d: 4, src: 'jtp', c: { op: 'reverse' }, seq: ['12', '33', '66', '132', '363', '726'], ans: '1353', rule: 'add the reversal',
    steps: [['Near-doubling that wanders: 12 → 33 is not ×2.', 'A same-size number is being added.'], ['12 + 21 = 33, 132 + 231 = 363: add the reversal.', 'Check on two steps.'], ['726 + 627 = 1353.', '363 was a palindrome (it doubled); 726 is not, so its reversal differs.']],
    rivals: [['1452', 'Doubled 726 as if it were a palindrome; its reversal is 627.'], ['1089', 'Added the reversal of the previous term (363).']] },
  { fam: 'mixed-combo', d: 4, src: 'qp', c: { indexMult0: 2, c: 1 }, seq: ['1', '2', '5', '16', '65', '326'], ans: '1957', rule: 'a(n) = n·a(n−1) + 1',
    steps: [['Ratios 2, 2.5, 3.2, 4.06, 5.02 rise towards whole numbers.', 'A counting multiplier plus a constant.'], ['2×2+1 = 5, 3×5+1 = 16, 4×16+1 = 65, 5×65+1 = 326.', 'Subtract n × previous: the leftover is 1.'], ['6 × 326 + 1 = 1957.', 'Next multiplier 6.']],
    rivals: [['1956', 'Multiplied by 6 but forgot the + 1.'], ['1631', 'Reused the multiplier 5.']] },
  { fam: 'multiply-index', d: 4, src: 'atp', c: { a: 2, mult0: 2 }, seq: ['2', '4', '12', '48', '240'], ans: '1440', rule: 'multiply by 2, 3, 4, 5, 6',
    steps: [['Ratios: 2, 3, 4, 5.', 'The multiplier counts up.'], ['240 × 6 = 1440.', 'Next multiplier 6.']],
    rivals: [['1200', 'Reused the multiplier 5.']] },
  { fam: 'fractions', d: 4, src: 'tm', c: { numFibIndex0: 0, denFibIndex0: 2 }, seq: ['1/2', '1/3', '2/5', '3/8', '5/13'], ans: '8/21', rule: 'Fibonacci numerators over Fibonacci denominators',
    steps: [['Numerators 1, 1, 2, 3, 5; denominators 2, 3, 5, 8, 13.', 'Both rows are Fibonacci numbers.'], ['Next: 8/21.', 'Extend each row by one Fibonacci step.']],
    rivals: [['8/13', 'Advanced only the numerator.'], ['5/21', 'Advanced only the denominator.']] },
  { fam: 'diff-geometric', d: 4, src: 'qb', c: { a: 5, g: 2, r: 2 }, seq: ['5', '7', '11', '19', '35', '67'], ans: '131', rule: 'gaps double',
    steps: [['Gaps: 2, 4, 8, 16, 32.', 'The gaps double.'], ['67 + 64 = 131.', 'Next gap 64.']],
    rivals: [['134', 'Doubled the last term instead of the last gap.']] },
  { fam: 'square-minus', d: 4, src: 'tm', c: { a: 2, c: -1 }, seq: ['2', '3', '8', '63', '3968'], ans: '15745023', rule: 'a(n) = a(n−1)² − 1',
    steps: [['8² = 64 against 63; 63² = 3969 against 3968.', 'Each term is the square of the last, minus 1.'], ['3968² − 1 = 15745024 − 1 = 15745023.', 'Use the calculator for the square.']],
    rivals: [['15745024', 'Squared but forgot the − 1.']] },
  { fam: 'interleaved', d: 4, src: 'qb', c: { odd: { kind: 'square', base0: 1 }, even: { kind: 'geo', a: 2, r: 3 } }, seq: ['1', '2', '4', '6', '9', '18', '16'], ans: '54', rule: 'odd positions: squares; even positions: ×3',
    steps: [['Odd positions 1, 4, 9, 16 are squares; even positions 2, 6, 18 triple.', 'Split the strands.'], ['Position 8 is even: 18 × 3 = 54.', 'Continue the tripling strand.']],
    rivals: [['25', 'Continued the squares strand; position 8 belongs to the other strand.']] },
  { fam: 'diff-geometric', d: 4, src: 'atp', c: { a: 10, g: 1, r: 2 }, seq: ['10', '11', '13', '17', '25', '41'], ans: '73', rule: 'gaps 1, 2, 4, 8, 16',
    steps: [['Gaps: 1, 2, 4, 8, 16.', 'Powers of 2.'], ['41 + 32 = 73.', 'Next gap 32.']],
    rivals: [['82', 'Doubled the last term instead of the gap.']] },
  // difficulty 5
  { fam: 'mixed-combo', d: 5, src: 'qp', c: { k: 2, addIndex0: 1 }, seq: ['1', '3', '8', '19', '42', '89'], ans: '184', rule: 'a(n) = 2a(n−1) + n',
    steps: [['Ratios hover just above 2.', 'Doubling is the dominant rule.'], ['Leftovers after doubling: 1, 2, 3, 4, 5.', 'The leftover counts up.'], ['2 × 89 + 6 = 184.', 'Next leftover 6.']],
    rivals: [['183', 'Reused the leftover 5.'], ['178', 'Doubled but dropped the leftover.']] },
  { fam: 'mixed-combo', d: 5, src: 'eq', c: { k: 2, alternating: 3, firstSign: 1 }, seq: ['4', '11', '19', '41', '79', '161'], ans: '319', rule: 'double, then alternately +3 and −3',
    steps: [['Ratios hover around 2.', 'Doubling dominates.'], ['Leftovers after doubling: +3, −3, +3, −3, +3.', 'The leftover alternates.'], ['2 × 161 − 3 = 319.', 'Next leftover −3.']],
    rivals: [['325', 'Reused the leftover +3.'], ['322', 'Doubled but dropped the leftover.']] },
  { fam: 'mixed-combo', d: 5, src: 'qp', c: { k: 3, addIndex0: 1 }, seq: ['2', '7', '23', '72', '220', '665'], ans: '2001', rule: 'a(n) = 3a(n−1) + n',
    steps: [['Ratios approach 3.', 'Tripling dominates.'], ['Leftovers after tripling: 1, 2, 3, 4, 5.', 'The leftover counts up.'], ['3 × 665 + 6 = 2001.', 'Next leftover 6.']],
    rivals: [['1995', 'Tripled but dropped the leftover.'], ['2000', 'Reused the leftover 5.']] },
  { fam: 'square-minus', d: 5, src: 'tm', c: { a: 3, c: -2 }, seq: ['3', '7', '47', '2207'], ans: '4870847', rule: 'a(n) = a(n−1)² − 2',
    steps: [['7² = 49 against 47; 47² = 2209 against 2207.', 'Square, then subtract 2.'], ['2207² − 2 = 4870849 − 2 = 4870847.', 'Apply once more.']],
    rivals: [['4870849', 'Squared but forgot the − 2.'], ['103729', 'Multiplied the last two terms instead of squaring.']] },
  { fam: 'product-recurrence', d: 5, src: 'qp', c: { c: 1 }, seq: ['1', '2', '3', '7', '22', '155'], ans: '3411', rule: 'a(n) = a(n−1) × a(n−2) + 1',
    steps: [['2 × 3 + 1 = 7, 3 × 7 + 1 = 22, 7 × 22 + 1 = 155.', 'Product of the last two, plus 1.'], ['22 × 155 + 1 = 3411.', 'Apply once more.']],
    rivals: [['3410', 'Multiplied but forgot the + 1.'], ['178', 'Added the last two terms plus 1.']] },
  { fam: 'fractions', d: 5, src: 'tm', c: { numIsPrevDen: true, denK: 2, denC: -1 }, seq: ['2/3', '3/5', '5/9', '9/17', '17/33'], ans: '33/65', rule: 'each denominator becomes the next numerator; denominators double minus 1',
    steps: [['Numerators 2, 3, 5, 9, 17; denominators 3, 5, 9, 17, 33.', 'Each denominator reappears as the next numerator.'], ['Denominators follow 2d − 1: 2 × 33 − 1 = 65.', 'The same rule drives both rows.'], ['Next: 33/65.', 'Numerator 33, denominator 65.']],
    rivals: [['33/49', 'Added 16 to the denominator (the last gap); the gaps double.'], ['17/65', 'Advanced only the denominator.']] },
];

export default RAW.map((r, i) => item(i + 1, r));
export { RAW, item };
