// Bayes with a diagnostic signal: true positives against all positives. Base rates dominate
// when the condition is rare. Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const one = Q.of(1);
const post = (p, s, f) => { const tp = p.mul(s), fp = one.sub(p).mul(f); return tp.div(tp.add(fp)); };
const postNeg = (p, s, f) => { const fn = p.mul(one.sub(s)), tn = one.sub(p).mul(one.sub(f)); return fn.div(fn.add(tn)); };
const pct = (x) => `${+(x.toNumber() * 100).toFixed(2)}%`;
const d3 = (x) => (Math.round((x instanceof Q ? x.toNumber() : x) * 1000) / 1000).toFixed(3);
const PV = [Q.of(1, 10), Q.of(1, 5), Q.of(1, 20), Q.of(1, 100), Q.of(1, 50)];
const SV = [Q.of(9, 10), Q.of(4, 5), Q.of(19, 20), Q.of(99, 100)];
const FV = [Q.of(1, 10), Q.of(1, 20), Q.of(1, 5), Q.of(1, 100)];
const draw = (rng) => ({ p: rng.pick(PV), s: rng.pick(SV), f: rng.pick(FV) });
const setup = ({ p, s, f }) => `${pct(p)} of people have a condition. A test is positive for ${pct(s)} of those with it and for ${pct(f)} of those without it.`;
// Tree example and area example.
const T = { p: Q.of(1, 10), s: Q.of(9, 10), f: Q.of(1, 10) };
const A = { p: Q.of(1, 5), s: Q.of(4, 5), f: Q.of(1, 4) };
const N = 1000;
const PREVS = [0.001, 0.01, 0.05, 0.1, 0.5];
const postNum = (p, s, f) => (p * s) / (p * s + (1 - p) * f);
const FR = { p: Q.of(1, 50), s: Q.of(19, 20), f: Q.of(1, 50) }; // think-aloud: fraud filter
const QU = { p: Q.of(1, 20), s: Q.of(4, 5), f: Q.of(1, 10) }; // far transfer: puzzle screen
const M = 10000;
const cnt = (x) => x.mul(Q.of(M)).toNumber();

export default {
  id: 'bto/bayes-test',
  book: 'bto',
  kind: 'family',
  family: 'bayes-test',
  title: 'Bayes: reading a positive signal',
  summary: 'P(condition | positive) = true positives / all positives. Rare conditions make most positives false.',
  prerequisites: ['bto/conditional-dice', 'prob/conditional-bayes'],
  objectives: [
    'Separate the three numbers by role: base rate, hit rate, false-alarm rate',
    'Compute P(condition | positive) as true positives over all positives, with natural frequencies',
    'Handle a negative result and two independent positive results',
    'Predict when a positive signal is mostly false alarms, before computing',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${setup({ p: Q.of(1, 100), s: Q.of(99, 100), f: Q.of(1, 100) })} A random person tests positive. What is the probability they have the condition? Try two approaches.`, answer: `${post(Q.of(1, 100), Q.of(99, 100), Q.of(1, 100))}`, explain: 'Picture 10,000 people: 100 have it and 99 of them test positive; 9,900 do not and 99 of them test positive too. A positive is real 99 times out of 198. If you said 99%, you answered P(positive | condition), the other direction.', attempts: [
      { id: 'hit-rate', label: 'The test is 99% accurate', approach: 'Answered 99%: the test is right 99 times in 100.', breaksAt: '99% is P(positive | has it). The question asks P(has it | positive), the other direction.' },
      { id: 'healthy', label: 'Only sick people test positive', approach: 'Treated a positive as near proof, close to 1.', breaksAt: '1% of the 9,900 healthy people test positive too: 99 false alarms, as many as the true positives.' },
      { id: 'no-divide', label: 'Base rate times hit rate', approach: `Multiplied 1% × 99% = ${Q.of(1, 100).mul(Q.of(99, 100))}.`, breaksAt: 'That is P(has it and positive) among everyone. You were told the result is positive, so divide by P(positive).' },
    ] },
    { type: 'text', text: 'Three numbers and one observation. A **base rate** (how common the condition is), a **hit rate** (how often the signal fires when the condition is there), a **false-alarm rate** (how often it fires when it is not). Then a signal is observed and you are asked how likely the condition now is. The context changes: medical tests, fraud filters, spam models, backtests.' },
    { type: 'list', items: ['"1% of people have a condition; the test is 99% accurate both ways. You test positive..."', '"A fraud filter flags 95% of fraud and 2% of legitimate transactions; 1 in 50 transactions is fraud..."', '"A backtest passes 90% of good strategies and 10% of bad ones; 1 in 10 ideas is good..."'] },
    { type: 'text', text: 'Not this lesson: evidence about which physical object you hold (a coin, a box, a card: bto/bayes-boxes), and plain facts about dice (bto/conditional-dice). The signal here is noisy and described by rates.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['A sensor fires on 80% of faults and 5% of normal runs; 2% of runs are faulty; it fires: P(fault)?', 'A bag has 1 double-headed and 9 fair coins; you see 3 heads: P(double-headed)?', 'Two dice; at least one 6: P(both 6)?', 'A die is thrown until a six: P(it takes 3 throws)?'], answer: 0, traps: { 1: 'evidence about a physical object: bto/bayes-boxes', 2: 'a plain fact about the outcome: bto/conditional-dice', 3: 'a waiting question' }, explain: 'Base rate, hit rate, false-alarm rate, observed signal.' },
    ] },

    S('why'),
    { type: 'text', text: 'A positive signal from a good test can still be mostly false alarms. That fact is the whole point of these questions, and the tempting option is always the hit rate itself. Traders meet the same trap daily: a backtest that "passes 90% of good strategies" says little about a strategy that passed, if good strategies are rare.' },

    S('anchor'),
    { type: 'text', text: 'From bto/conditional-dice: P(B | A) = |A ∩ B| / |A|, count inside what the information leaves. Bayes is that with **one change**: the atoms (has it and positive, has it and negative, …) are not equally likely, so instead of counting cells you **weight** them. The easiest way to weight is to imagine a round number of people, say 1,000, and count people.' },
    { type: 'check', scope: 'counting people instead of cells', questions: [
      { make: (rng) => { const p = rng.pick([Q.of(1, 10), Q.of(1, 5), Q.of(1, 20)]); return { type: 'number', q: `Out of 1,000 people, how many have a condition with base rate ${pct(p)}?`, answer: p.mul(Q.of(N)).toNumber(), explain: `1,000 × ${pct(p)} = ${p.mul(Q.of(N)).toNumber()}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'As a tree: first split on the condition (the base rate), then on the result (the hit rate or the false-alarm rate). The marked leaves are all the positives. The answer is the top marked leaf as a share of both.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'person', children: [
      { p: T.p.toString(), label: 'has it', children: [{ p: T.s.toString(), label: 'positive (true)', mark: true }, { p: one.sub(T.s).toString(), label: 'negative (missed)' }] },
      { p: one.sub(T.p).toString(), label: 'does not', children: [{ p: T.f.toString(), label: 'positive (false alarm)', mark: true }, { p: one.sub(T.f).toString(), label: 'negative' }] },
    ] }, total: T.p.mul(T.s).add(one.sub(T.p).mul(T.f)).toString() }, caption: `Base rate 1/10, hit rate 9/10, false alarms 1/10. True positives ${T.p.mul(T.s)}, false positives ${one.sub(T.p).mul(T.f)}: equal, so a positive is real with ${post(T.p, T.s, T.f)}.` },
    { type: 'check', scope: 'true positives over all positives', questions: [
      { type: 'choice', q: 'Same tree. P(has it | positive)?', options: [post(T.p, T.s, T.f).toString(), T.s.toString(), T.p.mul(T.s).toString(), T.p.toString()], answer: 0, traps: { 1: 'answered the hit rate, P(positive | has it)', 2: 'P(has it and positive): forgot to divide by P(positive)', 3: 'ignored the result: the base rate' }, explain: `${T.p.mul(T.s)} / (${T.p.mul(T.s)} + ${one.sub(T.p).mul(T.f)}) = ${post(T.p, T.s, T.f)}.` },
    ] },
    { type: 'text', text: 'The same thing as areas. The square is everyone. The left strip, as wide as the base rate, is the people who have it; its shaded height is the hit rate. The right strip is everyone else; its shaded height is the false-alarm rate. A positive lands somewhere in the shaded area.' },
    { type: 'diagram', diagram: 'unitsquare', spec: { xLabel: 'has it (left) | does not (right)', yLabel: 'tests positive (shaded height)', regions: [
      { points: [[0, 0], [0.2, 0], [0.2, 0.8], [0, 0.8]], area: A.p.mul(A.s).toString(), label: 'true +', tone: 1 },
      { points: [[0.2, 0], [1, 0], [1, 0.25], [0.2, 0.25]], area: one.sub(A.p).mul(A.f).toString(), label: 'false +', tone: 4 },
    ] }, caption: `Base rate 1/5, hit rate 4/5, false alarms 1/4. The tall thin block (${A.p.mul(A.s)}) is smaller than the short wide one (${one.sub(A.p).mul(A.f)}), so a positive is real only ${post(A.p, A.s, A.f)} of the time. A rare condition makes the left strip thin however tall it is.` },
    { type: 'check', scope: 'the area picture', questions: [
      { type: 'choice', q: 'In the square, which change shrinks the false + block the most?', options: ['Lowering the false-alarm rate', 'Raising the hit rate', 'Raising the number of people tested'], answer: 0, traps: { 1: 'that grows the true + block but leaves the false + block alone', 2: 'probabilities do not depend on how many are tested' }, explain: 'The false + block is (1 − base rate) × false-alarm rate.' },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'A 99% / 1% test: P(has it | positive)', xLabel: 'base rate', yLabel: 'probability', categories: PREVS.map((p) => `${p * 100}%`), series: [{ name: 'P(has it | +)', values: PREVS.map((p) => Math.round(postNum(p, 0.99, 0.01) * 1000) / 1000) }], valueLabels: true }, caption: 'The same test, different base rates. At 1% prevalence a positive is a coin flip; at 0.1% it is mostly a false alarm; at 50% it is almost certain. The test did not change; the population did.' },
    { type: 'check', scope: 'base rates move the answer', questions: [
      { type: 'choice', q: 'A 99% / 1% test is used on a population where 1 in 1,000 has the condition. A positive is real about:', options: [`${Math.round(postNum(0.001, 0.99, 0.01) * 100)}% of the time`, '99% of the time', '50% of the time', '1% of the time'], answer: 0, traps: { 1: 'the hit rate', 2: 'the 1% population answer', 3: 'the false-alarm rate' }, explain: `${d3(postNum(0.001, 0.99, 0.01))}: about 1 real case per 10 false alarms.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'hit-rate', say: 'Label the numbers by role. Base rate P(H). Hit rate P(+ | H). False-alarm rate P(+ | not H). The question wants P(H | +).', why: 'Every error in this family is a role mix-up: the hit rate is about people who have it, the answer is about people who tested positive.',
        checks: [
          { type: 'choice', q: '"The test is positive for 95% of those with the condition." This number is:', options: ['P(+ | H), the hit rate', 'P(H | +), the answer', 'P(H), the base rate', 'P(+), the share of positives'], answer: 0, traps: { 1: 'the wording starts from those with the condition, so it conditions on H', 2: 'the base rate is how common H is', 3: 'the share of positives mixes both groups' }, explain: '"Of those with the condition" fixes H; the 95% is about the result.' },
        ] },
      { say: 'True positives: P(H) × P(+ | H).', why: 'To be a true positive you must have it (base rate) and then the test must fire (hit rate): a two-step path.',
        checks: [
          { make: (rng) => { const x = draw(rng); return { type: 'number', q: `${setup(x)} Out of 10,000 people, how many are true positives?`, answer: x.p.mul(x.s).mul(Q.of(10000)).toNumber(), tolerance: 0.5, hints: ['How many have it?', 'Of those, the hit rate test positive.'], explain: `10,000 × ${pct(x.p)} × ${pct(x.s)} = ${x.p.mul(x.s).mul(Q.of(10000)).toNumber()}.` }; } },
        ] },
      { answers: 'healthy', say: 'False positives: P(not H) × P(+ | not H).', why: 'Everyone else can also test positive, at the false-alarm rate, and there are many more of them when H is rare.',
        checks: [
          { make: (rng) => { const x = draw(rng); return { type: 'number', q: `${setup(x)} Out of 10,000 people, how many are false positives?`, answer: one.sub(x.p).mul(x.f).mul(Q.of(10000)).toNumber(), tolerance: 0.5, hints: ['How many do not have it?', 'Of those, the false-alarm rate test positive.'], explain: `10,000 × ${pct(one.sub(x.p))} × ${pct(x.f)} = ${one.sub(x.p).mul(x.f).mul(Q.of(10000)).toNumber()}.` }; } },
        ] },
      { answers: 'no-divide', say: 'P(H | +) = true positives / (true positives + false positives).', why: 'Conditioning on a positive keeps only the positives; the answer is the real share of them.',
        checks: [
          { make: (rng) => { const x = draw(rng); const v = post(x.p, x.s, x.f); return mc(rng, `${setup(x)} A person tests positive. P(they have it)?`, v.toString(), [[x.s.toString(), 'base-rate neglect: answered the hit rate'], [x.p.toString(), 'ignored the result'], [x.p.mul(x.s).toString(), 'forgot to divide by P(positive)'], [one.sub(x.f).toString(), 'answered the true-negative rate']], `${x.p.mul(x.s)} / (${x.p.mul(x.s)} + ${one.sub(x.p).mul(x.f)}) = ${v} ≈ ${d3(v)}.`); } },
        ] },
      { say: 'A negative result works the same way with the other branches: missed cases P(H)(1 − hit rate) against true negatives P(not H)(1 − false-alarm rate).', why: 'Conditioning on "negative" keeps the negative leaves; the answer is the share that still have the condition.',
        checks: [
          { make: (rng) => { const x = draw(rng); const v = postNeg(x.p, x.s, x.f); return mc(rng, `${setup(x)} A person tests negative. P(they still have it)?`, v.toString(), [[one.sub(x.s).toString(), 'answered the miss rate P(− | H)'], [x.p.toString(), 'ignored the result'], [x.p.mul(one.sub(x.s)).toString(), 'forgot to divide by P(negative)']], `${x.p.mul(one.sub(x.s))} / (${x.p.mul(one.sub(x.s))} + ${one.sub(x.p).mul(one.sub(x.f))}) = ${v}.`); } },
        ] },
      { say: 'Two independent positives: multiply the rates along each branch. True: P(H) × hit². False: P(not H) × false-alarm². Then divide as before.', why: 'Given the true status, the two results are independent, so each branch gets its rate twice.',
        checks: [
          { type: 'choice', q: 'Base rate 1/10, hit rate 9/10, false alarms 1/10. Two independent positives. P(has it)?', options: [post(Q.of(1, 10), Q.of(81, 100), Q.of(1, 100)).toString(), post(T.p, T.s, T.f).toString(), Q.of(81, 100).toString(), Q.of(99, 100).toString()], answer: 0, traps: { 1: 'used only one of the two positives', 2: 'answered the double hit rate', 3: 'thought two positives make it 1 − (1/10)²' }, explain: `True ${Q.of(1, 10).mul(Q.of(81, 100))}, false ${Q.of(9, 10).mul(Q.of(1, 100))}: ${post(Q.of(1, 10), Q.of(81, 100), Q.of(1, 100))}.` },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why can a 99%-accurate test give a positive that is only about 50% likely to be real?', model: 'When the condition is rare, the healthy group is huge. A 1% false-alarm rate on that huge group produces about as many positives as a 99% hit rate on the tiny sick group. The answer is the real share of all positives, so it depends on the base rate as much as on the test.', points: ['name the roles: base rate, hit rate, false-alarm rate', 'false positives come from the large healthy group', 'answer = true positives / all positives'] },

    S('worked'),
    { type: 'worked', family: 'bayes-test', section: 'bto', difficulty: 2, seed: 'b', explainAt: [1, 2], intro: 'Round numbers. Try it before opening the solution.' },
    { type: 'worked', family: 'bayes-test', section: 'bto', difficulty: 3, seed: 'b', fade: 1, intro: 'A rare condition. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: `${pct(FR.p)} of transactions are fraud. A filter flags ${pct(FR.s)} of fraud and ${pct(FR.f)} of legitimate transactions. A transaction is flagged. What is the probability it is fraud?`, lines: [
      { t: 0, say: 'Base rate, hit rate, false-alarm rate and a signal: Bayes. I will use natural frequencies.' },
      { t: 3, say: `The filter catches ${pct(FR.s)} of fraud, so a flag means about ${pct(FR.s)} fraud.`, slip: true },
      { t: 6, say: `No: ${pct(FR.s)} is P(flag | fraud), the wrong direction. Count flags in ${M.toLocaleString('en')} transactions instead.` },
      { t: 10, say: `${cnt(FR.p)} are fraud and ${cnt(FR.p.mul(FR.s))} of them are flagged. ${cnt(one.sub(FR.p)).toLocaleString('en')} are legitimate and ${cnt(one.sub(FR.p).mul(FR.f))} of them are flagged.` },
      { t: 16, say: `${cnt(FR.p.mul(FR.s))}/(${cnt(FR.p.mul(FR.s))} + ${cnt(one.sub(FR.p).mul(FR.f))}) = ${post(FR.p, FR.s, FR.f)} ≈ ${d3(post(FR.p, FR.s, FR.f))}. About half, because legitimate transactions vastly outnumber fraud. Answer ${post(FR.p, FR.s, FR.f)}.` },
    ] },

    S('predict'),
    { type: 'predict', question: 'Base rate 1 in 1,000. The test catches everyone who has it and has a 5% false-alarm rate. Before computing: is a positive more or less likely than 10% to be real?', answer: `Less: about ${d3(postNum(0.001, 1, 0.05))}, roughly 1 real case per 50 false alarms.`, explain: '1,000 people: 1 true positive, about 50 false ones.' },

    S('traps'),
    { type: 'traps', family: 'bayes-test', section: 'bto', extra: [
      { belief: 'P(condition | positive) equals the hit rate.', fix: 'The hit rate is P(positive | condition). The answer also needs the base rate and the false alarms.' },
      { belief: 'A test that is "99% accurate" makes a positive 99% reliable.', fix: 'Only if the condition is common. At 1% prevalence it is about 50%.' },
      { belief: 'P(H and +) is the answer.', fix: 'Divide by P(+): you are told the result was positive.' },
    ] },
    { type: 'erroneous', problem: `A candidate answers: ${setup(T)} A person tests positive; how likely do they have it? One step is wrong.`, steps: [
      'Base rate 1/10; the test fires for 9/10 of those with it and 1/10 of those without.',
      'A positive result means the test fired.',
      'The test fires correctly 9/10 of the time, so P(has it | positive) = 9/10.',
      'Answer 9/10.',
    ], errorStep: 2, explain: `9/10 is P(positive | has it), the other direction. The positives are ${T.p.mul(T.s)} true and ${one.sub(T.p).mul(T.f)} false, so P(has it | positive) = ${post(T.p, T.s, T.f)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'Base rate 1/5, hit 4/5, false alarms 1/4. A candidate answers 4/25. Which belief?', options: ['P(H and +) instead of P(H | +)', 'The hit rate 4/5 given as the answer', 'The base rate 1/5 given as the answer'], answer: 0, explain: `4/25 = 1/5 × 4/5 is the true-positive share of everyone. Divide by P(+): ${post(A.p, A.s, A.f)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Natural frequencies are the fastest route: pick a population that makes every count whole (1,000 or 10,000), count true and false positives, divide. No formula to remember.' },
    { type: 'callout', tone: 'speed', text: `Odds form for quick estimates: posterior odds = prior odds × (hit rate / false-alarm rate). 1 : 99 prior with a 99/1 ratio gives 99 : 99 = 1 : 1. Each extra independent positive multiplies the odds by the ratio again. Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds; natural frequencies take about 40.` },
    { type: 'check', scope: 'odds form', questions: [
      { make: (rng) => { const odds = rng.pick([[1, 9], [1, 4], [1, 19], [1, 99]]); const lr = rng.pick([9, 10, 19, 20]); const v = Q.of(odds[0] * lr, odds[0] * lr + odds[1]); return mc(rng, `Prior odds ${odds[0]} : ${odds[1]}. The signal is ${lr} times as likely if H is true. P(H | signal)?`, v.toString(), [[Q.of(odds[0] * lr, odds[1]).toString(), 'reported the odds as a probability'], [Q.of(odds[0], odds[0] + odds[1]).toString(), 'ignored the signal'], [Q.of(lr - 1, lr).toString(), 'used only the likelihood ratio']], `Posterior odds ${odds[0] * lr} : ${odds[1]}, so P = ${v}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Signal observed → true positives / all positives = P(H)P(+|H) / [P(H)P(+|H) + P(not H)P(+|not H)]. Rare H → false alarms dominate.' },

    S('contrast'),
    { type: 'compare', columns: ['Quantity (1/10, 9/10, 1/10 test)', 'Meaning', 'Value'], rows: [
      ['P(+ | H)', 'hit rate: a property of the test', T.s.toString()],
      ['P(H | +)', 'the answer: depends on the base rate', post(T.p, T.s, T.f).toString()],
      ['P(H and +)', 'true positives among everyone', T.p.mul(T.s).toString()],
      ['P(+)', 'all positives among everyone', T.p.mul(T.s).add(one.sub(T.p).mul(T.f)).toString()],
      ['P(H | −)', 'missed cases among negatives', postNeg(T.p, T.s, T.f).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a false-alarm rate of 0 makes every positive real (answer 1). A base rate of 0 makes every positive false (answer 0). A test with hit rate equal to false-alarm rate carries no information: the answer is the base rate.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: coins, boxes and cards (bto/bayes-boxes) are Bayes with hit rates that come from counting. Monty Hall is Bayes where the host\'s rule sets the rates (bto/monty-hall). In research, a backtest that passes many bad ideas has a low "P(good | passed)" when good ideas are rare.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'A test fires for 30% of those with the condition and 30% of those without. Base rate 1/8. P(has it | positive)?', options: ['1/8', '3/10', '1/2', '0'], answer: 0, traps: { 1: 'the hit rate', 2: 'a coin flip', 3: 'the signal is uninformative, not disproving' }, explain: 'Equal rates cancel: the posterior equals the prior.' },
    ] },

    { type: 'variation', base: `Base rate ${T.p}, hit rate ${T.s}, false alarms ${T.f}. P(has it | positive) = ${post(T.p, T.s, T.f)}.`, rows: [
      { change: 'Imagine 10,000 people instead of 1,000', effect: `No change: ${post(T.p, T.s, T.f)}. The population size cancels; it only makes the counts whole.`, same: true },
      { change: 'Base rate 1/100 instead of 1/10', effect: `False alarms now swamp the real cases: ${post(Q.of(1, 100), T.s, T.f)}.` },
      { change: 'False alarms 1/100 instead of 1/10', effect: `The false + block shrinks tenfold: ${post(T.p, T.s, Q.of(1, 100))}.` },
      { change: 'The result is negative', effect: `Use the other leaves: ${postNeg(T.p, T.s, T.f)}. A negative almost rules it out.` },
      { change: 'Base rate 1/100 and two independent positives', effect: `The rarer base rate cuts the prior odds about elevenfold, and the second positive multiplies them by 9 again: ${post(Q.of(1, 100), T.s.mul(T.s), T.f.mul(T.f))}, close to the base value. In odds form the two changes simply multiply.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const x = draw(rng); const v = post(x.p, x.s, x.f); return mc(rng, `${pct(x.p)} of emails are spam. A filter flags ${pct(x.s)} of spam and ${pct(x.f)} of normal emails. An email is flagged. P(it is spam)?`, v.toString(), [[x.s.toString(), 'answered the hit rate'], [x.p.toString(), 'ignored the flag'], [x.p.mul(x.s).toString(), 'forgot to divide by P(flagged)']], `${x.p.mul(x.s)} / (${x.p.mul(x.s)} + ${one.sub(x.p).mul(x.f)}) = ${v}.`); } },
      far: { type: 'choice', q: `${pct(QU.p)} of applicants are strong. An interview puzzle is solved by ${pct(QU.s)} of strong applicants and ${pct(QU.f)} of the others. An applicant solves it. P(the applicant is strong)?`, options: [post(QU.p, QU.s, QU.f).toString(), QU.s.toString(), QU.p.mul(QU.s).toString(), QU.p.toString()], answer: 0, traps: { 1: 'answered P(solve | strong), the hit rate', 2: 'forgot to divide by P(solve)', 3: 'ignored the evidence' }, explain: `Strong solvers ${QU.p.mul(QU.s)}, other solvers ${one.sub(QU.p).mul(QU.f)}: ${post(QU.p, QU.s, QU.f)}.` },
      principle: { type: 'choice', q: 'Which idea carried over from tests to spam filters and interviews?', options: ['Real signals over all signals, weighted by the base rate', 'The hit rate is the chance the signal is real', 'Multiply base rate by hit rate and stop there', 'A strong signal makes the base rate irrelevant'], answer: 0, traps: { 1: 'the hit rate conditions on the cause, not on the signal', 2: 'that is P(cause and signal); divide by P(signal)', 3: 'a rare cause keeps false alarms in the majority' }, explain: 'P(cause | signal) = true signals / all signals; the base rate sets how many of each there are.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'bayes-test', section: 'bto', count: 3 },
  ],
};
