// Bayes with a diagnostic signal: prevalence, sensitivity, false-positive rate.
import { mcqItem, agree, q, pic } from '../lib.js';

const ID = 'bayes-test';
const CONTEXTS = [
  { pop: 'people', cond: 'have a condition', test: 'A screening test', flags: 'is positive for', yes: 'of those with the condition', no: 'of those without it', pos: 'positive', neg: 'negative', who: 'A person', self: 'this person', isPos: 'tests positive', isNeg: 'tests negative', has: 'has the condition' },
  { pop: 'transactions', cond: 'are fraudulent', test: 'A fraud filter', flags: 'flags', yes: 'of fraudulent transactions', no: 'of legitimate ones', pos: 'flagged', neg: 'unflagged', who: 'A transaction', self: 'this transaction', isPos: 'is flagged', isNeg: 'is not flagged', has: 'is fraudulent' },
  { pop: 'trade ideas', cond: 'are genuinely profitable', test: 'A backtest', flags: 'passes', yes: 'of profitable ideas', no: 'of unprofitable ones', pos: 'passing', neg: 'failing', who: 'An idea', self: 'this idea', isPos: 'passes the backtest', isNeg: 'fails the backtest', has: 'is genuinely profitable' },
  { pop: 'emails', cond: 'are phishing', test: 'A spam model', flags: 'flags', yes: 'of phishing emails', no: 'of legitimate ones', pos: 'flagged', neg: 'unflagged', who: 'An email', self: 'this email', isPos: 'is flagged', isNeg: 'is not flagged', has: 'is phishing' },
];
const PREV = [[1, 100], [1, 50], [1, 20], [1, 10], [1, 5], [1, 1000]];
const SENS = [[9, 10], [95, 100], [99, 100], [4, 5]];
const FPR = [[1, 10], [1, 20], [1, 100], [1, 5], [2, 100]];
const pct = ([a, b]) => `${+(100 * a / b).toFixed(2)}%`;

export default {
  id: ID,
  section: 'bto',
  title: 'Bayes: reading a positive signal',
  skill: 'P(condition | positive) = true positives / all positives; base rates dominate when the condition is rare',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const c = rng.pick(CONTEXTS);
    let [pv, sv, fv] = difficulty === 2 ? [rng.pick([[1, 10], [1, 5], [1, 2]]), [9, 10], rng.pick([[1, 10], [1, 5]])] : [rng.pick(PREV), rng.pick(SENS), rng.pick(FPR)];
    const variant = difficulty === 4 ? rng.pick(['twoPos', 'negative']) : 'pos';
    const p = q(...pv), s = q(...sv), f = q(...fv);
    const np = q(1).sub(p);
    let value, text, steps, distractors, extra;
    if (variant === 'pos' || variant === 'twoPos') {
      const k = variant === 'twoPos' ? 2 : 1;
      const lik = k === 2 ? s.mul(s) : s, flik = k === 2 ? f.mul(f) : f;
      const tp = p.mul(lik), fp = np.mul(flik);
      value = tp.div(tp.add(fp));
      const single = p.mul(s).div(p.mul(s).add(np.mul(f)));
      text = `${pct(pv)} of ${c.pop} ${c.cond}. ${c.test} ${c.flags} ${pct(sv)} ${c.yes} and ${pct(fv)} ${c.no}.` +
        (k === 1 ? ` ${c.who} ${c.isPos}. What is the probability that ${c.self} ${c.has}?`
          : ` ${c.who} is checked twice, with the two results independent given its true status, and ${c.isPos} both times. What is the probability that ${c.self} ${c.has}?`);
      distractors = [
        { value: lik, misconception: `Base-rate neglect: used P(${c.pos} | condition) = ${lik}, not P(condition | ${c.pos}).` },
        { value: q(1).sub(flik), misconception: 'Used the specificity (true-negative rate) as the answer.' },
        { value: p, misconception: 'Ignored the test result and answered the base rate.' },
        { value: tp, misconception: `Computed P(condition AND ${c.pos}) and forgot to divide by P(${c.pos}).` },
        { value: tp.add(fp), misconception: `Computed P(${c.pos}), the denominator, not the answer.` },
      ];
      if (k === 2) distractors.push({ value: single, misconception: 'Used only one of the two positive results.' });
      steps = [
        { say: `Imagine 1 unit of ${c.pop}. True ${c.pos}: ${p} × ${lik} = ${tp}.`, why: 'Those that have the condition and test positive.' },
        { say: `False ${c.pos}: ${np} × ${flik} = ${fp}.`, why: `Those without the condition that still test ${c.pos}${k === 2 ? ' twice' : ''}.` },
        { say: `P = ${tp} / (${tp} + ${fp}) = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: `Among all ${c.pos} cases, the fraction that are real.` },
      ];
      const plus = k === 2 ? `${c.pos} twice` : c.pos, notPlus = k === 2 ? 'not twice' : c.neg;
      extra = {
        picture: pic('tree', { root: { label: '', children: [
          { p: p.toString(), label: `${c.has.replace(/^is /, '')}`, children: [{ p: lik.toString(), label: plus, mark: true }, { p: q(1).sub(lik).toString(), label: notPlus }] },
          { p: np.toString(), label: 'does not', children: [{ p: flik.toString(), label: plus, mark: true }, { p: q(1).sub(flik).toString(), label: notPlus }] },
        ] } }, `Each leaf shows its path product. The two marked leaves are every ${c.pos} case; the real ones are the top marked leaf, ${tp} out of ${tp.add(fp)}.`),
        fast: `True : false ${c.pos} = ${tp} : ${fp}, so ${value}.`,
        check: `A ${c.pos} result raises the chance above the base rate ${p}, but with ${fp.cmp(tp) > 0 ? 'more false than true' : 'this many false'} ${c.pos} cases it stays ${value.cmp(s) < 0 ? `well below the hit rate ${s}` : 'below 1'}.`,
      };
    } else {
      const fn = p.mul(q(1).sub(s)), tn = np.mul(q(1).sub(f));
      value = fn.div(fn.add(tn));
      text = `${pct(pv)} of ${c.pop} ${c.cond}. ${c.test} ${c.flags} ${pct(sv)} ${c.yes} and ${pct(fv)} ${c.no}. ${c.who} ${c.isNeg}. What is the probability that ${c.self} nevertheless ${c.has}?`;
      distractors = [
        { value: q(1).sub(s), misconception: `Used the miss rate P(${c.neg} | condition) instead of P(condition | ${c.neg}).` },
        { value: p, misconception: 'Ignored the test result and answered the base rate.' },
        { value: fn, misconception: `Computed P(condition AND ${c.neg}) and forgot to divide by P(${c.neg}).` },
        { value: f, misconception: 'Used the false-positive rate, which is about the other group.' },
        { value: p.mul(s).div(p.mul(s).add(np.mul(f))), misconception: 'Answered the positive-result question instead of the negative one.' },
      ];
      steps = [
        { say: `Missed cases: ${p} × ${q(1).sub(s)} = ${fn}.`, why: `Have the condition but test ${c.neg}.` },
        { say: `Correct ${c.neg}: ${np} × ${q(1).sub(f)} = ${tn}.`, why: `Do not have it and test ${c.neg}.` },
        { say: `P = ${fn} / (${fn} + ${tn}) = ${value} ≈ ${value.toNumber().toFixed(4)}.`, why: `Fraction of ${c.neg} cases that are real.` },
      ];
      extra = {
        picture: pic('tree', { root: { label: '', children: [
          { p: p.toString(), label: `${c.has.replace(/^is /, '')}`, children: [{ p: s.toString(), label: c.pos }, { p: q(1).sub(s).toString(), label: c.neg, mark: true }] },
          { p: np.toString(), label: 'does not', children: [{ p: f.toString(), label: c.pos }, { p: q(1).sub(f).toString(), label: c.neg, mark: true }] },
        ] } }, `The two marked leaves are every ${c.neg} case. The missed real ones are the top marked leaf, ${fn} out of ${fn.add(tn)}.`),
        fast: `Missed : correct ${c.neg} = ${fn} : ${tn}, so ${value}.`,
        check: `A ${c.neg} result lowers the chance, so the answer must be below the base rate ${p}, though not zero while the test misses ${pct([sv[1] - sv[0], sv[1]])} of real cases.`,
      };
    }
    return mcqItem(ID, rng, difficulty, {
      value, text, distractors, steps, ...extra,
      rule: 'P(H | +) = P(H)P(+|H) / [P(H)P(+|H) + P(not H)P(+|not H)]. Count true positives against all positives.',
      anchor: 'Conditional probability P(A | B) = P(A and B)/P(B), with the one change that P(A and B) is built from a rate you are given the other way round.',
      hints: ['Picture 1,000 cases. How many have the condition, and how many of those test positive?', 'Now count the false positives among the rest.', 'True positives / all positives.'],
      data: { pv, sv, fv, variant },
    });
  },

  // Independent check: natural frequencies with integer counts in a population of 10^8.
  verify(item) {
    const { pv, sv, fv, variant } = item.params;
    const N = 100000000;
    const sick = (N * pv[0]) / pv[1], well = N - sick;
    let hit, miss;
    if (variant === 'negative') { hit = sick - (sick * sv[0]) / sv[1]; miss = well - (well * fv[0]) / fv[1]; }
    else if (variant === 'twoPos') { hit = (((sick * sv[0]) / sv[1]) * sv[0]) / sv[1]; miss = (((well * fv[0]) / fv[1]) * fv[0]) / fv[1]; }
    else { hit = (sick * sv[0]) / sv[1]; miss = (well * fv[0]) / fv[1]; }
    return agree(item, hit / (hit + miss), 1e-9);
  },

  lesson: {
    purpose: 'A positive signal from a good test can still be mostly false alarms. Every "test says yes, how likely is it real?" question is this one calculation.',
    anchor: 'You know P(A | B) = P(A and B)/P(B). Bayes is that definition with one change: P(A and B) is built as P(A)·P(B | A), because the test is described the other way round.',
    steps: [
      { say: 'Separate roles: base rate P(H), hit rate P(+ | H), false-alarm rate P(+ | not H).', why: 'Mixing up P(+ | H) and P(H | +) is the whole trap.' },
      { say: 'True positives = P(H)P(+ | H); false positives = P(not H)P(+ | not H).', why: 'Every positive comes from exactly one of the two groups.' },
      { say: 'Answer = true / (true + false).', why: 'Condition on "positive": only positive cases remain.' },
    ],
    predict: { question: '1% prevalence, 99% hit rate, 1% false alarms. Positive: roughly what chance it is real?', answer: 'About 1/2: 0.0099 true against 0.0099 false positives.' },
    edge: 'If the false-alarm rate is 0, every positive is real (answer 1). If the base rate is 0, no positive is real (answer 0).',
    rule: 'Posterior = true positives / all positives. Rare condition → false positives dominate.',
    contrast: 'P(+ | H) is a property of the test; P(H | +) depends on how common H is. They are equal only when the false positives balance the base rate.',
  },
};
