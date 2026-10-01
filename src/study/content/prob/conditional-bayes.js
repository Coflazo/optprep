// Probability foundations 5: conditional probability as a shrunken sample space, trees,
// Bayes' rule with natural frequencies (1,000 people), base-rate neglect.
import { sec, frac, show, dec, mc, diceCells, diceGrid } from './sample-spaces.js';

// Worked scenario: 1,000 people, 2% sick, test hit rate 90%, false-alarm rate 5%.
const S = { n: 1000, sickPct: 2, hitPct: 90, faPct: 5 };
S.sick = (S.n * S.sickPct) / 100; S.healthy = S.n - S.sick;
S.tp = (S.sick * S.hitPct) / 100; S.fn = S.sick - S.tp;
S.fp = (S.healthy * S.faPct) / 100; S.tn = S.healthy - S.fp;
S.pos = S.tp + S.fp;
// Rarer condition for the prediction: 2 in 1,000.
const R = { sick: 2 }; R.tp = R.sick * 0.9; R.fp = (1000 - R.sick) * 0.05; R.p = R.tp / (R.tp + R.fp);

function bayesScenario(rng) {
  for (let i = 0; i < 50; i++) {
    const sick = rng.pick([10, 20, 25, 40, 50, 100]), hit = rng.pick([80, 90, 95]), fa = rng.pick([2, 4, 5, 10]);
    const tp = (sick * hit) / 100, fp = ((1000 - sick) * fa) / 100;
    if (Number.isInteger(tp) && Number.isInteger(fp)) return { sick, hit, fa, tp, fp, pos: tp + fp };
  }
  return { sick: 20, hit: 90, fa: 5, tp: 18, fp: 49, pos: 67 };
}
const bayesQ = (rng) => {
  const b = bayesScenario(rng);
  return mc({ q: `${b.sick} in 1,000 people have a condition. A test flags ${b.hit}% of those who have it and wrongly flags ${b.fa}% of those who do not. A random person tests positive. What is P(they have the condition)?`, right: frac(b.tp, b.pos),
    wrong: [[frac(b.hit, 100), 'confused P(condition | positive) with P(positive | condition)'], [frac(b.sick, 1000), 'ignored the test result'], [frac(b.tp, 1000), 'divided by everyone instead of by the positives'], [frac(b.tp, b.sick + b.fp), 'divided by the sick plus the false alarms, a group that is not the positives']],
    hints: ['Imagine 1,000 people and split them into sick and healthy.', `Positives: ${b.tp} sick ones and ${b.fp} healthy ones.`],
    explain: `Out of 1,000: ${b.sick} have it and ${b.tp} of them test positive; ${1000 - b.sick} do not and ${b.fp} of them test positive. P = ${b.tp}/(${b.tp} + ${b.fp}) = ${frac(b.tp, b.pos)} ≈ ${dec(b.tp / b.pos)}.` }, rng);
};
const urnSecondQ = (rng) => {
  const n = rng.int(7, 14), r = rng.int(3, n - 2);
  return mc({ q: `A bag has ${r} red and ${n - r} blue balls. Two are drawn without replacement. Given the first is red, what is P(the second is red)?`, right: frac(r - 1, n - 1),
    wrong: [[frac(r, n), 'forgot the first ball is gone'], [frac(r - 1, n), 'removed a red ball but not from the total'], [frac(r * (r - 1), n * (n - 1)), 'answered P(both red), not the conditional']],
    explain: `After a red is removed: ${r - 1} red among ${n - 1} balls, so ${frac(r - 1, n - 1)}.` }, rng);
};
const sumGivenQ = (rng) => {
  const s = rng.int(4, 10), cells = diceCells((a, b) => a + b === s), faces = [...new Set(cells.map(([r]) => r + 1))];
  const d = rng.pick(faces), fav = cells.filter(([r, c]) => r + 1 === d || c + 1 === d).length, allD = diceCells((a, b) => a === d || b === d).length;
  return mc({ q: `Two dice are thrown. Given that the sum is ${s}, what is P(at least one die shows ${d})?`, right: frac(fav, cells.length),
    wrong: [[frac(fav, 36), `did not shrink the sample space to the ${cells.length} cells with sum ${s}`], [frac(allD, 36), 'ignored the information about the sum'], [frac(1, 6), 'used one die on its own']],
    explain: `Sum ${s}: ${cells.length} cells. Of those, ${fav} ${fav === 1 ? 'contains' : 'contain'} a ${d}: ${frac(fav, cells.length)}.` }, rng);
};

const atLeast6 = diceCells((a, b) => a === 6 || b === 6).length;

export default {
  id: 'prob/conditional-bayes',
  book: 'prob',
  kind: 'foundation',
  title: "Conditional probability and Bayes' rule",
  summary: 'Given B: shrink the sample space to B and recount. Test questions: 1,000 people, then keep only the positives.',
  prerequisites: ['prob/sample-spaces', 'prob/inclusion-exclusion'],
  objectives: [
    'Compute P(A | B) by shrinking the sample space to B',
    'Multiply along a tree: P(A and B) = P(B) × P(A | B)',
    "Solve test and screening questions with natural frequencies (1,000 people) and Bayes' rule",
    'Explain base-rate neglect and tell P(A | B) from P(B | A)',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: ${S.sickPct}% of people have a condition. A test flags ${S.hitPct}% of those who have it and wrongly flags ${S.faPct}% of those who do not. You test positive. What is P(you have it)? Two approaches, then an answer.`, answer: `${S.tp}/${S.pos} ≈ ${dec(S.tp / S.pos, 2)}`, explain: `Out of 1,000 people: ${S.sick} have it and ${S.tp} of them test positive; ${S.healthy} do not and ${S.fp} of them test positive anyway. Of the ${S.pos} positives, ${S.tp} are sick. If you said ${S.hitPct}%, you answered a different question: P(positive | sick).`,
      attempts: [
        { id: 'hitRate', label: 'Answered the hit rate', approach: `Said a positive means a ${S.hitPct}% chance of being sick.`, breaksAt: `${S.hitPct}% is P(positive | sick): its total is the ${S.sick} sick people, not the ${S.pos} positives.` },
        { id: 'joint', label: 'Multiplied the two rates', approach: `Took ${S.sickPct}% × ${S.hitPct}% = ${dec(S.tp / S.n, 3)}.`, breaksAt: 'That is P(sick and positive), a share of everyone; the question makes the positives the total.' },
        { id: 'noBase', label: 'Ignored the base rate', approach: `Compared ${S.hitPct}% with ${S.faPct}% as if sick and healthy people were equally common.`, breaksAt: `They are not: ${S.healthy} healthy people produce ${S.fp} false alarms against ${S.tp} true positives.` },
      ] },
    { type: 'text', text: 'Trigger words: **given that**, **of those who**, **if we know**, "a test is positive", "the first card was a heart". You are told something about the outcome and asked about something else. Written **P(A | B)**, read "A given B".' },
    { type: 'check', scope: 'what P(A | B) means', questions: [
      mc({ q: 'A test flags 90% of sick people. "Of the people who test positive, what fraction are sick?" asks for:', right: 'P(sick | positive)', at: 1,
        wrong: [['P(positive | sick)', 'that is the 90%: the question fixes the positives and asks about sickness'], ['P(sick and positive)', 'that is a fraction of everyone, not of the positives'], ['P(positive)', 'that counts the positives, not how many of them are sick']],
        explain: '"Of those who test positive" is the given part: the positives are the new total.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Beat the Odds has whole families built on this: Monty Hall, boxes with coins, screening tests, second cards. The classic wrong answer is the reverse conditional, and the options are built to catch it.' },

    sec('anchor'),
    { type: 'text', text: 'You know favourable / total. Conditional probability is the same fraction with **one change**: the total is no longer the whole sample space but only the outcomes where B happened. Being told B throws the rest away.' },
    { type: 'formula', text: 'P(A | B) = (outcomes in both A and B) / (outcomes in B)' },
    { type: 'check', scope: 'shrinking the sample space', questions: [
      { make: (rng) => { const k = rng.int(4, 6), fav = [2, 4, 6].filter((x) => x >= k).length; return mc({ q: `One die is thrown. Given that the face is even, what is P(it is at least ${k})?`, right: frac(fav, 3),
        wrong: [[frac(fav, 6), 'divided by all 6 faces instead of the 3 even ones'], [frac(7 - k, 6), 'ignored the information'], [frac(3 - fav, 3), 'counted the even faces below the threshold']],
        explain: `The sample space shrinks to {2, 4, 6}. ${fav} of those are at least ${k}: ${frac(fav, 3)}.` }, rng); } },
    ] },

    sec('picture'),
    { type: 'text', text: `Two dice, and you are told at least one shows a 6. The sample space shrinks from 36 cells to the ${atLeast6} cells of the L. Every question now divides by ${atLeast6}.` },
    { type: 'diagram', diagram: 'grid', spec: diceGrid((a, b) => a === 6 || b === 6), caption: `Being told "at least one six" keeps only these ${atLeast6} cells: they are the new sample space, each still equally likely.` },
    { type: 'check', scope: 'the shrunken grid', questions: [
      { type: 'number', q: 'Given the first die is even, how many of the 36 cells remain in the sample space?', answer: 18, explain: 'Rows 2, 4 and 6: 3 × 6 = 18 cells.' },
      { make: (rng) => { const k = rng.int(8, 11), all = diceCells((a, b) => a + b >= k).length, fav = diceCells((a, b) => (a === 6 || b === 6) && a + b >= k).length; return mc({ q: `Two dice. Given that at least one shows a 6, what is P(the sum is at least ${k})?`, right: frac(fav, atLeast6),
        wrong: [[frac(fav, 36), `divided by all 36 cells instead of the ${atLeast6} that remain`], [frac(all, 36), 'ignored the information'], [frac(atLeast6 - fav, atLeast6), 'counted the six-cells below the threshold']],
        explain: `Of the ${atLeast6} cells with a six, ${fav} have sum at least ${k}: ${frac(fav, atLeast6)}.` }, rng); } },
    ] },

    sec('formula', 'From counts to probabilities'),
    { type: 'text', text: 'Divide the top and the bottom by the size of the whole sample space and the counts become probabilities:' },
    { type: 'formula', text: 'P(A | B) = P(A and B) / P(B)' },
    { type: 'check', scope: 'P(A and B) / P(B)', questions: [
      { make: (rng) => { const y = rng.pick([0.2, 0.25, 0.4, 0.5, 0.8]), q = rng.pick([0.25, 0.5, 0.75]), x = Math.round(y * q * 1000) / 1000; return { type: 'number', q: `P(A and B) = ${x} and P(B) = ${y}. What is P(A | B)?`, answer: q, tolerance: 1e-9, hints: ['Divide the overlap by the event you were told happened.'], explain: `${x} / ${y} = ${q}.` }; } },
    ] },

    sec('tree', 'Trees multiply'),
    { type: 'text', text: 'Turn the formula around: P(A and B) = P(B) × P(A | B). A tree does exactly this. The first branch is the chance of the first stage; the second branch is the chance of the second stage **given** the first; a path multiplies them.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'deal', children: [
      { p: frac(4, 52), label: 'ace', children: [{ p: frac(3, 51), label: 'ace', mark: true }, { p: frac(48, 51), label: 'not ace' }] },
      { p: frac(48, 52), label: 'not ace', children: [{ p: frac(4, 51), label: 'ace' }, { p: frac(47, 51), label: 'not ace' }] },
    ] }, total: frac(12, 2652) }, caption: `Two cards. First ace: 4/52 = ${frac(4, 52)}. Given that, 3 of the 51 left are aces: 3/51 = ${frac(3, 51)}. The marked path: ${frac(4, 52)} × ${frac(3, 51)} = ${frac(12, 2652)}.` },
    { type: 'check', scope: 'multiplying along a tree', questions: [
      { make: (rng) => { const n = rng.int(7, 12), r = rng.int(3, n - 3), fo = r * (r - 1), to = n * (n - 1); return mc({ q: `A bag has ${r} red and ${n - r} blue balls. Two are drawn without replacement. What is P(both red)?`, right: frac(fo, to),
        wrong: [[frac(r * r, n * n), 'used the same fraction twice, as if the first ball went back'], [frac(r * (r - 1), n * n), 'updated the reds but not the total'], [frac(r - 1, n - 1), 'gave only the second branch']],
        explain: `${r}/${n} × ${r - 1}/${n - 1} = ${show(fo, to)}.` }, rng); } },
    ] },

    sec('bayes', "Bayes' rule with 1,000 people"),
    { type: 'text', text: 'Test questions give the chance of a positive **given** sick and ask for the chance of sick **given** positive: the condition is reversed. Do not juggle four percentages. Imagine 1,000 people and push them through the tree as whole numbers.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['1,000 people', 'test +', 'test −', 'total'], rows: [['sick', String(S.tp), String(S.fn), String(S.sick)], ['healthy', String(S.fp), String(S.tn), String(S.healthy)], ['total', String(S.pos), String(S.fn + S.tn), String(S.n)]] }, caption: `The challenge as whole people. Given a positive, look only at the "test +" column: ${S.tp} of its ${S.pos} people are sick.` },
    { type: 'check', scope: 'reading the 1,000-people table', questions: [
      { type: 'number', q: 'In the table, how many of the 1,000 people test positive?', answer: S.pos, explain: `The "test +" column: ${S.tp} sick + ${S.fp} healthy = ${S.pos}.` },
      mc({ q: 'Given a positive test, which group of people is the new total?', right: `all ${S.pos} who test positive`, at: 1,
        wrong: [[`the ${S.sick} sick people, positive or not`, 'that conditions on being sick, not on the test result'], ['all 1,000 people in the table', 'the negatives are ruled out by the result'], [`the ${S.tp} sick people who test positive`, 'those are the favourable ones, not the total']],
        explain: 'Given the result, only the positive column remains.' }),
    ] },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'person', children: [
      { p: frac(S.sick, S.n), label: 'sick', children: [{ p: frac(S.hitPct, 100), label: 'test +', mark: true }, { p: frac(100 - S.hitPct, 100), label: 'test −' }] },
      { p: frac(S.healthy, S.n), label: 'healthy', children: [{ p: frac(S.faPct, 100), label: 'test +', mark: true }, { p: frac(100 - S.faPct, 100), label: 'test −' }] },
    ] }, total: frac(S.pos, S.n) }, caption: `The same as probabilities. Both marked paths end in a positive: together P(+) = ${S.pos}/1000. The sick path supplies ${S.tp}/1000 of it, so P(sick | +) = ${S.tp}/${S.pos}.` },
    { type: 'formula', text: 'P(sick | +) = P(sick) × P(+ | sick) / P(+)   (true positives over all positives)' },
    { type: 'check', scope: "Bayes' rule with natural frequencies", questions: [{ hinge: true, make: bayesQ }] },

    sec('derivation'),
    { type: 'text', text: 'The challenge again, one move at a time.' },
    { type: 'steps', steps: [
      { answers: 'noBase', say: `Start with 1,000 people. ${S.sickPct}% are sick: ${S.sick} sick, ${S.healthy} healthy.`, why: 'Whole people are easier to reason about than percentages of percentages.',
        checks: [{ make: (rng) => { const k = rng.pick([20, 25, 40, 50, 100, 200]); return { type: 'number', q: `A condition affects 1 in ${k} people. Out of 1,000 people, how many have it?`, answer: 1000 / k, explain: `1000 / ${k} = ${1000 / k}.` }; } }] },
      { say: `Split each group by the test: ${S.hitPct}% of the ${S.sick} sick test positive (${S.tp}); ${S.faPct}% of the ${S.healthy} healthy test positive (${S.fp}).`, why: 'Each group gets its own rate: the hit rate applies only to the sick, the false-alarm rate only to the healthy.',
        checks: [{ make: (rng) => { const h = rng.pick([900, 950, 960, 980]), fa = rng.pick([5, 10]); return { type: 'number', q: `Of ${h} healthy people, ${fa}% wrongly test positive. How many is that?`, answer: (h * fa) / 100, explain: `${fa}% of ${h} = ${(h * fa) / 100}.` }; } }] },
      { answers: 'hitRate', say: `Keep only the positives: ${S.tp} + ${S.fp} = ${S.pos} people. Given a positive, this group is the new sample space.`, why: 'Conditioning on the result throws away everyone who tested negative.',
        checks: [mc({ q: 'After a positive test, who is still in the sample space?', right: 'everyone who tested positive, sick or healthy', at: 2,
          wrong: [['only the sick people who tested positive', 'the healthy false alarms also tested positive'], ['everyone, since the test can be wrong', 'the negatives are ruled out by the result'], ['the sick, whether positive or negative', 'that conditions on being sick, not on the test']],
          explain: 'You know the result, not the condition: every positive stays, whatever their health.' })] },
      { answers: 'joint', say: `Read off: P(sick | positive) = ${S.tp}/${S.pos} ≈ ${dec(S.tp / S.pos, 2)}.`, why: 'Favourable (sick and positive) over the new total (all positives).',
        checks: [{ make: bayesQ }] },
    ] },
    { type: 'explain', prompt: `The test catches ${S.hitPct}% of sick people, yet a positive means only about ${Math.round((100 * S.tp) / S.pos)}% chance of being sick. Explain why.`, model: `Healthy people vastly outnumber sick ones. A small false-alarm rate applied to ${S.healthy} healthy people produces more positives (${S.fp}) than the ${S.hitPct}% hit rate applied to only ${S.sick} sick people (${S.tp}). Among the positives, the healthy ones dominate.`, points: ['The base rate makes the sick group small', 'False positives come from the large healthy group', 'P(sick | +) compares true positives with all positives, not with the sick'] },

    sec('predict'),
    { type: 'predict', question: 'Same test (90% hit rate, 5% false alarms) but the condition is ten times rarer: 2 in 1,000. Does P(sick | positive) go up or down, and roughly to what?', answer: `Down, to about ${dec(R.p, 3)}: ${dec(R.tp, 1)} true positives against ${dec(R.fp, 1)} false alarms.`, explain: 'The false alarms barely change while the true positives shrink tenfold. The rarer the condition, the less a positive means.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'P(A | B) = P(B | A).', fix: 'The hit rate P(+ | sick) and the answer P(sick | +) have different totals: the sick versus the positives.' },
      { belief: 'The base rate does not matter once you have a test result.', fix: 'The base rate sets how many healthy people are exposed to false alarms. Always start from it.' },
      { belief: 'Divide by the whole sample space.', fix: 'Given B, divide by the outcomes in B only.' },
      { belief: 'The second card has the same chances as the first.', fix: 'Without replacement the deck changed: update both the count and the total.' },
    ] },
    { type: 'erroneous', problem: 'A candidate answers the screening question from this lesson. One step is wrong.', steps: [
      `Out of 1,000 people, ${S.sick} are sick and ${S.healthy} healthy.`,
      `${S.tp} of the sick test positive; ${S.fp} of the healthy test positive.`,
      `P(sick | positive) = ${S.tp}/${S.sick}.`,
      `= ${dec(S.tp / S.sick, 1)}, so a positive means a ${S.hitPct}% chance of being sick.`,
    ], errorStep: 2, explain: `${S.tp}/${S.sick} divides by the sick: that is P(positive | sick). Given a positive, divide by all ${S.pos} positives: ${S.tp}/${S.pos} ≈ ${dec(S.tp / S.pos, 2)}.` },
    { type: 'check', scope: 'the shrunken sample space', questions: [
      mc({ q: 'Two dice. Given that at least one shows a 6, what is P(both are 6)?', right: frac(1, atLeast6), at: 2,
        wrong: [['1/6', 'treated it as "the other die is a 6", but you are not told which die showed the 6'], ['1/36', 'ignored the information: the sample space did not shrink'], [frac(2, atLeast6), 'counted (6, 6) once for each die']],
        explain: `The sample space is the ${atLeast6} cells with a six; only (6, 6) has two: 1/${atLeast6}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Natural frequencies: pick 1,000 people (10,000 if the rates need it) and write whole numbers on the tree. Never multiply four decimals in your head.' },
    { type: 'callout', tone: 'speed', text: `Odds shortcut: posterior odds = prior odds × (hit rate / false-alarm rate). Here ${S.sick} : ${S.healthy} × ${S.hitPct}/${S.faPct} = ${S.tp} : ${S.fp}, so P = ${S.tp}/(${S.tp} + ${S.fp}).` },
    { type: 'check', scope: 'the odds shortcut', questions: [
      { make: (rng) => { const k = rng.pick([9, 19, 49, 99]), lr = rng.pick([9, 10, 18, 19, 45]); return mc({ q: `Prior odds sick : healthy are 1 : ${k}. A positive test is ${lr} times more likely for a sick person than for a healthy one. What is P(sick | positive)?`, right: frac(lr, lr + k),
        wrong: [[frac(lr, lr + 1), 'ignored the prior odds'], [frac(1, 1 + k), 'ignored the test'], ...(lr < k ? [[frac(lr, k), 'reported the odds, not the probability']] : []), [frac(k, lr + k), 'answered P(healthy | positive)']],
        explain: `Posterior odds = 1 : ${k} × ${lr} = ${lr} : ${k}. P = ${lr}/(${lr} + ${k}) = ${frac(lr, lr + k)}.` }, rng); } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Given B → shrink the sample space to B and recount. Test questions → 1,000 people, split by condition, then by result, then keep only the positives.' },

    sec('contrast'),
    { type: 'compare', columns: ['Quantity', 'Meaning', 'In the 1,000-people table'], rows: [
      ['P(+ | sick)', 'of the sick, the fraction that test positive', `${S.tp}/${S.sick}`],
      ['P(sick | +)', 'of the positives, the fraction that are sick', `${S.tp}/${S.pos}`],
      ['P(sick and +)', 'of everyone, sick and positive', `${S.tp}/${S.n}`],
      ['P(+)', 'of everyone, positive', `${S.pos}/${S.n}`],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: if B is certain, P(A | B) = P(A). If A forces B, P(A | B) = P(A)/P(B). A test with no false alarms makes P(sick | +) = 1 whatever the base rate; a test whose hit rate equals its false-alarm rate tells you nothing.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: Monty Hall and the boxes questions in Beat the Odds (condition on what you were shown), card draws "given the first card was red", conditional dice ("given the sum is 8"). Each one shrinks the sample space to what you were told.' },
    { type: 'check', scope: 'the four quantities', questions: [
      { type: 'order', q: 'Order these from largest to smallest for the 1,000-people example.', items: ['P(+ | sick)', 'P(sick | +)', 'P(sick and +)', 'P(+)'], answer: [[0, S.tp / S.sick], [1, S.tp / S.pos], [2, S.tp / S.n], [3, S.pos / S.n]].sort((a, b) => b[1] - a[1]).map(([i]) => i), explain: `${dec(S.tp / S.sick, 2)} > ${dec(S.tp / S.pos, 3)} > ${dec(S.pos / S.n, 3)} > ${dec(S.tp / S.n, 3)}.` },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: bayesQ }, { make: sumGivenQ }, { make: urnSecondQ }] },
  ],
};
