// 80-in-8: exact whole-number division. Short division by one digit (including a zero in the
// quotient), division by a two-digit number, and the shortcuts ÷5 = ×2 ÷ 10 and ÷25 = ×4 ÷ 100.
import { family, q } from '../lib.js';

const Z = (n) => (Number.isInteger(n) ? q(n) : null);
const hasInnerZero = (n) => /\d0\d/.test(String(n));

// Wrong quotients next to qq that a learner checks by multiplying back.
function nearMisses(rng, a, d, qq) {
  const s = rng.chance(0.5) ? 1 : -1;
  return [[Z(qq + s), `Off by one in the last digit: ${d} × ${qq + s} = ${d * (qq + s)}, not ${a}.`],
    [Z(qq + 10 * s), `Tens slip while bringing down: ${d} × ${qq + 10 * s} = ${d * (qq + 10 * s)}.`],
    [Z(qq * 10), 'Wrote an extra zero in the quotient.']];
}

const short = {
  levels: [1, 2, 3],
  build(rng, dl) {
    const d = rng.int(3, 9);
    // d3: a zero inside the quotient (824 ÷ 8 = 103)
    const qq = dl === 1 ? rng.int(14, 199) : dl === 2 ? rng.int(112, 1499) : rng.pick([rng.int(1, 9) * 100 + rng.int(1, 9), rng.int(1, 9) * 1000 + rng.int(1, 9) * 10 + rng.int(1, 9), rng.int(1, 9) * 1000 + rng.int(1, 9) * 100 + rng.int(1, 9)]);
    const a = d * qq;
    if (qq % 10 === 0 || (dl === 3 && !hasInnerZero(qq)) || (dl < 3 && hasInnerZero(qq))) return null;
    const wrong = nearMisses(rng, a, d, qq);
    if (hasInnerZero(qq)) wrong.unshift([Z(Number(String(qq).replace(/0/g, ''))), `Dropped the zero in the quotient: when ${d} did not go into a digit, nothing was written.`]);
    wrong.push([Z(qq + 5 * (rng.chance(0.5) ? 1 : -1) * (d % 2 === 0 ? 1 : 2)), 'Matched only the last digit: this quotient times the divisor also ends in the right digit, but the size is off.']);
    const lead = Math.floor(qq / 10 ** (String(qq).length - 1)) * 10 ** (String(qq).length - 1);
    return {
      text: `${a} ÷ ${d} = ?`, value: Z(qq), mode: 'int', wrong,
      ask: `How many ${d}s make ${a}?`,
      steps: [
        { say: `Take out a big round chunk: ${d} × ${lead} = ${d * lead}, leaving ${a - d * lead}.`, why: 'Division is repeated subtraction; a round multiple of the divisor removes most of it at once.' },
        { say: `${a - d * lead} ÷ ${d} = ${qq - lead}, so ${lead} + ${qq - lead} = ${qq}.`, why: 'The quotient is the sum of the chunks you took out.' },
      ],
      fast: `Short division left to right${hasInnerZero(qq) ? ', writing 0 whenever the divisor does not go' : ''}: ${a} ÷ ${d} = ${qq}.`,
      check: `Multiply back: ${d} × ${qq} = ${a}. ${hasInnerZero(qq) ? `Size: ${a} ÷ ${d} is more than ${10 ** (String(qq).length - 1)}, so the quotient has ${String(qq).length} digits.` : `Last digit: ${d} × ${qq % 10} ends in ${(d * (qq % 10)) % 10}, like ${a}.`}`,
      hints: [`${d} × ${lead} = ${d * lead}.`, `What is left after taking out ${d * lead}?`],
      params: { a, d },
    };
  },
};

const byFive = {
  levels: [1],
  build(rng) {
    const qq = rng.int(21, 199);
    if (qq % 10 === 0) return null;
    const a = qq * 5;
    const wrong = [[Z(a * 2), `Doubled ${a} but forgot to divide by 10.`], [Z(qq / 2), `Divided ${a} by 10 but forgot to double.`], [Z(a / 10), 'Divided by 10 instead of 5.'], ...nearMisses(rng, a, 5, qq)];
    return {
      text: `${a} ÷ 5 = ?`, value: Z(qq), mode: 'int', wrong,
      ask: `Divide ${a} by 5.`,
      steps: [
        { say: `÷ 5 is × 2 ÷ 10: ${a} × 2 = ${a * 2}.`, why: '5 = 10 ÷ 2, so dividing by 5 is dividing by 10 and doubling.' },
        { say: `${a * 2} ÷ 10 = ${qq}.`, why: 'Doubling and dropping a zero beats short division by 5.' },
      ],
      fast: `Double and drop the zero: ${a} → ${a * 2} → ${qq}.`,
      check: `Multiply back: ${qq} × 5 = ${a}. Size: a fifth is twice a tenth, and a tenth of ${a} is ${a / 10}.`,
      hints: ['5 = 10 ÷ 2.', `${a} × 2 = ${a * 2}.`],
      params: { a, d: 5 },
    };
  },
};

const byQuarterHundred = {
  levels: [2],
  build(rng) {
    const qq = rng.int(12, 159);
    if (qq % 10 === 0) return null;
    const a = qq * 25;
    const wrong = [[Z(qq / 2), `Doubled only once: ${a} × 2 ÷ 100 is ÷ 50.`], [Z(qq * 10), 'Divided by 10 instead of 100 after multiplying by 4.'], [Z(qq * 2), `Multiplied by 8 instead of 4 before dropping the two zeros.`], ...nearMisses(rng, a, 25, qq)];
    return {
      text: `${a} ÷ 25 = ?`, value: Z(qq), mode: 'int', wrong,
      ask: `Divide ${a} by 25.`,
      steps: [
        { say: `÷ 25 is × 4 ÷ 100: ${a} × 4 = ${a * 4}.`, why: '25 = 100 ÷ 4, so dividing by 25 is multiplying by 4 and dividing by 100.' },
        { say: `${a * 4} ÷ 100 = ${qq}.`, why: 'Doubling twice and dropping two zeros replaces a long division.' },
      ],
      fast: `Each 100 holds four 25s: ${Math.floor(a / 100)} hundreds make ${Math.floor(a / 100) * 4}${a % 100 ? `, and the ${a % 100} left holds ${(a % 100) / 25} more` : ''}: ${qq}.`,
      check: `Multiply back: ${qq} × 25 = ${a}. Four 25s make 100, so the answer is about ${a} ÷ 100 × 4 ≈ ${Math.round((a / 100) * 4)}.`,
      hints: ['25 = 100 ÷ 4.', `${a} × 4 = ${a * 4}.`],
      params: { a, d: 25 },
    };
  },
};

const twoDigit = {
  levels: [2, 3],
  build(rng, dl) {
    const d = dl === 2 ? rng.int(12, 29) : rng.int(13, 79), qq = dl === 2 ? rng.int(12, 49) : rng.int(21, 99);
    if (d % 10 === 0 || qq % 10 === 0) return null;
    const a = d * qq, T = qq - (qq % 10);
    const cands = Array.from({ length: 10 }, (_, i) => T + i).filter((x) => (d * x) % 10 === a % 10);
    const wrong = [...nearMisses(rng, a, d, qq), [Z(qq + (d % 2 === 0 ? 5 : 10)), `Matched only the last digit: ${d} × ${qq + (d % 2 === 0 ? 5 : 10)} also ends in ${a % 10}, but it is too big.`],
      [Z(qq - (d % 2 === 0 ? 5 : 10)), `Matched only the last digit: ${d} × ${qq - (d % 2 === 0 ? 5 : 10)} also ends in ${a % 10}, but it is too small.`]];
    return {
      text: `${a} ÷ ${d} = ?`, value: Z(qq), mode: 'int', wrong,
      ask: `How many ${d}s make ${a}?`,
      steps: [
        { say: `Bracket: ${d} × ${T} = ${d * T} and ${d} × ${T + 10} = ${d * (T + 10)}, so the answer is in the ${T}s.`, why: 'Two round multiples of the divisor fix the tens digit of the answer.' },
        { say: `Last digit: ${d} × ? must end in ${a % 10}; in the ${T}s that is ${cands.join(' or ')}${cands.length > 1 ? `, and ${cands.filter((x) => x !== qq).map((x) => `${d} × ${x} = ${d * x}`).join(', ')} is not ${a}` : ''}: ${qq}.`, why: 'Only the units digit of the quotient affects the units digit of the product.' },
        { say: `Check: ${d} × ${qq} = ${a}.`, why: 'Multiplying back proves it exactly.' },
      ],
      fast: `${d} × ${T} = ${d * T} is just below ${a}; the last digit ${d % 10} × ? → ${a % 10} leaves ${cands.join(' or ')}: ${qq}.`,
      check: `Multiply back: ${d} × ${qq} = ${a}. Size: between ${d} × ${T} and ${d} × ${T + 10}.`,
      hints: [`${d} × ${T} = ${d * T}; ${d} × ${T + 10} = ${d * (T + 10)}.`, `Which last digit makes ${d % 10} × ? end in ${a % 10}?`],
      params: { a, d },
    };
  },
};

export default family({
  id: 'mm-divide',
  title: 'Divide',
  skill: 'Divide exactly: short division (zeros in the quotient), two-digit divisors, ÷5 and ÷25 shortcuts',
  levels: [1, 2, 3],
  rule: '÷5 = ×2 ÷ 10; ÷25 = ×4 ÷ 100; a two-digit divisor: bracket the tens with round multiples, then let the last digit pick; always multiply back.',
  anchor: 'Division undoes multiplication: a ÷ d = q exactly when d × q = a.',
  variants: { short, byFive, byQuarterHundred, twoDigit },
  lesson: {
    purpose: 'Every division on the test comes out exact, so the options can be checked by multiplying back: that check turns a hard division into an easy product.',
    anchor: 'You know your tables: 8 × 13 = 104. Division is the same fact read backwards: 104 ÷ 8 = 13.',
    steps: [
      { say: '÷ 5 is × 2 ÷ 10: 435 ÷ 5 = 870 ÷ 10 = 87.', why: '5 = 10 ÷ 2.' },
      { say: '÷ 25 is × 4 ÷ 100: 1350 ÷ 25 = 5400 ÷ 100 = 54.', why: '25 = 100 ÷ 4.' },
      { say: 'Two-digit divisor: estimate with a round number (912 ÷ 24 ≈ 912 ÷ 25 ≈ 36), then the last digit: 24 × ? ends in 2 only for ? ending in 3 or 8: 38.', why: 'The estimate gives the tens, the units digit gives the rest.' },
    ],
    predict: { question: '824 ÷ 8: two digits or three?', answer: 'Three: 824 is more than 8 × 100, so the answer is 103 (the zero must be written).' },
    rule: 'Estimate, pick by the last digit, multiply back. Write 0 in the quotient when the divisor does not go.',
    contrast: 'Dividing by 25 multiplies by 4; dividing by 50 multiplies by 2. Doubling once for ÷25 gives half the answer.',
  },
});
