// Probability foundations 9: binomial, geometric and hypergeometric counts.
import { sec, frac, dec, round, mc, nCr } from './sample-spaces.js';

const binomDiceQ = (rng) => {
  const n = rng.int(3, 6), k = rng.int(1, Math.min(3, n - 1)), t = 6 ** n, fav = nCr(n, k) * 5 ** (n - k);
  return mc({ q: `A fair die is rolled ${n} times. What is P(exactly ${k} six${k > 1 ? 'es' : ''})?`, right: frac(fav, t),
    wrong: [[frac(5 ** (n - k), t), `counted one order only: there are C(${n}, ${k}) = ${nCr(n, k)} orders`], [frac(nCr(n, k), 6 ** k), 'ignored the other dice, which must not be sixes'], [frac(1, n + 1), `treated the ${n + 1} possible counts as equally likely`], [frac(t - 5 ** n, t), 'answered P(at least one six)']],
    hints: ['One order first: which dice are sixes, which are not?', `One order: (1/6)^{${k}} × (5/6)^{${n - k}}. Then count the orders.`],
    explain: `C(${n}, ${k}) × 5^{${n - k}} / 6^{${n}} = ${nCr(n, k)} × ${5 ** (n - k)} / ${t} = ${frac(fav, t)} ≈ ${dec(fav / t)}.` }, rng);
};
const coinsQ = (rng) => {
  const n = rng.int(4, 7), k = rng.int(1, n - 1), t = 2 ** n;
  return mc({ q: `A fair coin is tossed ${n} times. What is P(exactly ${k} head${k > 1 ? 's' : ''})?`, right: frac(nCr(n, k), t),
    wrong: [[frac(1, t), 'counted one order only'], [frac(1, n + 1), 'treated the head counts as equally likely'], [frac(k, n), 'used the fraction of tosses instead of a probability']],
    explain: `C(${n}, ${k}) = ${nCr(n, k)} orders, each (1/2)^{${n}}: ${frac(nCr(n, k), t)}.` }, rng);
};
const geomQ = (rng) => {
  const tail = rng.chance(0.5), k = rng.int(2, 5);
  if (tail) return mc({ q: `A fair die is rolled until the first six. What is P(more than ${k} rolls are needed)?`, right: frac(5 ** k, 6 ** k),
    wrong: [[frac(5 ** (k - 1), 6 ** k), `that is P(the first six is on roll ${k})`], [frac(6 ** k - 5 ** k, 6 ** k), `that is P(a six within ${k} rolls)`], [frac(5 ** (k - 1), 6 ** (k - 1)), `stopped one roll early: more than ${k} needs ${k} failures`]],
    explain: `More than ${k} rolls means the first ${k} all miss: (5/6)^{${k}} = ${frac(5 ** k, 6 ** k)}.` }, rng);
  return mc({ q: `A fair die is rolled until the first six. What is P(the first six comes on roll ${k})?`, right: frac(5 ** (k - 1), 6 ** k),
    wrong: [[frac(5 ** k, 6 ** (k + 1)), `off by one: ${k - 1} failures come before the six, not ${k}`], [frac(k * 5 ** (k - 1), 6 ** k), 'multiplied by the number of positions, but the six must come last'], [frac(5 ** (k - 1), 6 ** (k - 1)), 'forgot the six itself'], ['1/6', 'ignored the rolls before']],
    explain: `${k - 1} miss${k === 2 ? '' : 'es'} then a six: (5/6)^{${k - 1}} × 1/6 = ${frac(5 ** (k - 1), 6 ** k)}.` }, rng);
};
const hyperQ = (rng) => {
  const N = rng.int(8, 12), K = rng.int(3, 5), n = rng.int(2, 3), k = rng.int(1, n);
  const top = nCr(K, k) * nCr(N - K, n - k), tot = nCr(N, n);
  if (top === 0) return hyperQ(rng);
  return mc({ q: `A bag holds ${N} balls, ${K} of them red. ${n} are drawn without replacement. What is P(exactly ${k} red)?`, right: frac(top, tot),
    wrong: [[frac(nCr(K, k), tot), `forgot to choose the ${n - k} non-red ball${n - k === 1 ? '' : 's'}`], [frac(nCr(n, k) * K ** k * (N - K) ** (n - k), N ** n), 'used the binomial, as if each ball went back'], [frac(K, N), 'answered for a single draw']],
    explain: `C(${K}, ${k}) × C(${N - K}, ${n - k}) / C(${N}, ${n}) = ${nCr(K, k)} × ${nCr(N - K, n - k)} / ${tot} = ${frac(top, tot)}.` }, rng);
};

// Pictures.
const coinTree = (depth, prefix = '') => (depth === 0 ? null : ['H', 'T'].map((c) => {
  const lab = prefix + c, kids = coinTree(depth - 1, lab);
  return kids ? { p: '1/2', label: lab, children: kids } : { p: '1/2', label: lab, mark: [...lab].filter((x) => x === 'H').length === 2 };
}));
const HY = { N: 10, K: 4, n: 3 };
const hyRows = [0, 1, 2, 3].map((k) => [String(k), String(nCr(HY.K, k) * nCr(HY.N - HY.K, HY.n - k)), frac(nCr(HY.K, k) * nCr(HY.N - HY.K, HY.n - k), nCr(HY.N, HY.n))]);
const ch = { two: nCr(5, 2) * 5 ** 3, t: 6 ** 5 };

export default {
  id: 'prob/discrete-distributions',
  book: 'prob',
  kind: 'foundation',
  title: 'Binomial, geometric and hypergeometric',
  summary: 'Count successes in n trials (binomial), wait for the first success (geometric), or draw without replacement (hypergeometric).',
  prerequisites: ['prob/counting', 'prob/independence', 'prob/expectation-linearity'],
  objectives: [
    'Name the model from the wording: fixed n and independent, wait for a first success, or draws without replacement',
    'Compute P(X = k) = C(n, k)p^{k}(1 − p)^{n − k} and the mean np',
    'Compute P(T = k) = (1 − p)^{k − 1}p, P(T > k) = (1 − p)^{k} and the mean wait 1/p',
    'Compute hypergeometric chances C(K, k)C(N − K, n − k)/C(N, n)',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: a fair die is rolled 5 times. What is P(exactly two sixes)? And how many rolls do you expect to wait for the first six? Two approaches, then answers.', answer: `${frac(ch.two, ch.t)} ≈ ${dec(ch.two / ch.t)}; 6 rolls`, explain: `One order such as 6 6 x x x has chance (1/6)^{2}(5/6)^{3}; there are C(5, 2) = 10 such orders: ${nCr(5, 2)} × ${5 ** 3} / ${ch.t}. If you got ${frac(5 ** 3, ch.t)}, you counted one order only. The wait averages 1/(1/6) = 6 rolls.`,
      attempts: [
        { id: 'oneOrder', label: 'Counted one order only', approach: `Took (1/6)^{2} × (5/6)^{3} = ${frac(5 ** 3, ch.t)}.`, breaksAt: `That is one order, such as 6 6 x x x; C(5, 2) = ${nCr(5, 2)} orders share that chance.` },
        { id: 'noFail', label: 'Ignored the non-sixes', approach: `Took C(5, 2) × (1/6)^{2} = ${frac(nCr(5, 2), 36)}.`, breaksAt: 'The other three rolls must not be sixes, so every order also carries (5/6)^{3}.' },
        { id: 'halfWait', label: 'Waited about 3.5 rolls', approach: 'Expected the first six around roll 3 or 4, the middle of the faces.', breaksAt: 'Each roll succeeds with chance 1/6, so the waits average 1/(1/6) = 6 rolls.' },
      ] },
    { type: 'text', text: 'Three shapes cover most repeated-trial questions. **Binomial**: a fixed number n of independent trials; count the successes. **Geometric**: repeat until the first success; count the trials. **Hypergeometric**: draw n without replacement from a pile with K successes; count the successes drawn.' },
    { type: 'check', scope: 'naming the model', questions: [
      mc({ q: 'A bag has 5 red and 7 blue balls. You draw 4 without replacement and count the reds. Which model?', right: 'hypergeometric', at: 1,
        wrong: [['binomial', 'the draws are not independent without replacement'], ['geometric', 'you count successes in a fixed number of draws, not the wait for the first']],
        explain: 'Fixed number of draws, without replacement, counting successes: hypergeometric.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'These shapes cover a large share of Beat the Odds: "exactly k heads", "first six on the fifth roll", "two aces in a five-card hand". Naming the shape first turns each into a formula built from rules you already trust.' },

    sec('anchor'),
    { type: 'text', text: 'The binomial is two earlier lessons glued together: the product rule for independent trials gives the chance of **one** specific sequence, and counting gives **how many** sequences there are. New = product rule + one change: count the orders.' },
    { type: 'check', scope: 'one specific order', questions: [
      { make: (rng) => { const n = rng.int(3, 5), k = rng.int(1, n - 1), seq = [...Array(k).fill('six'), ...Array(n - k).fill('no six')].join(', '); return mc({ q: `A die is rolled ${n} times. What is P(the results are, in this order: ${seq})?`, right: frac(5 ** (n - k), 6 ** n),
        wrong: [[frac(nCr(n, k) * 5 ** (n - k), 6 ** n), 'counted every order, but the question fixes one'], [frac(1, 6 ** k), 'ignored the "no six" rolls'], [frac(1, 6 ** n), 'treated "no six" as one face']],
        explain: `Independent rolls multiply: (1/6)^{${k}} × (5/6)^{${n - k}} = ${frac(5 ** (n - k), 6 ** n)}.` }, rng); } },
    ] },

    sec('picture'),
    { type: 'text', text: 'Three tosses of a fair coin: 8 equally likely paths. Exactly 2 heads is 3 of them (HHT, HTH, THH), each with the same chance. That is the binomial in miniature: number of orders × chance of one order.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: coinTree(3) }, total: frac(nCr(3, 2), 8) }, caption: `The marked leaves are the ${nCr(3, 2)} orders with two heads, each 1/8: together ${frac(nCr(3, 2), 8)}.` },
    { type: 'check', scope: 'the three-toss tree', questions: [
      { type: 'number', q: 'In the three-toss tree, how many leaves have exactly one head?', answer: nCr(3, 1), explain: 'HTT, THT, TTH: C(3, 1) = 3.' },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Six tosses: sequences per number of heads', xLabel: 'heads', yLabel: 'sequences (of 64)', categories: [0, 1, 2, 3, 4, 5, 6].map(String), series: [{ name: 'sequences', values: [0, 1, 2, 3, 4, 5, 6].map((k) => nCr(6, k)) }], valueLabels: true }, caption: `Six tosses: ${[0, 1, 2, 3, 4, 5, 6].map((k) => nCr(6, k)).join(', ')} sequences of ${2 ** 6}. Each count is C(6, k); the middle is most likely.` },
    { type: 'check', scope: 'orders times one order', questions: [
      mc({ q: 'From the six-toss bar chart: what is P(exactly 3 heads)?', right: frac(nCr(6, 3), 64), at: 1,
        wrong: [[frac(1, 7), 'treated the 7 head counts as equally likely'], [frac(1, 64), 'counted one order only'], [frac(3, 6), 'used the fraction of tosses instead of a probability']],
        explain: `The bar for 3 heads holds C(6, 3) = ${nCr(6, 3)} of the 64 sequences: ${frac(nCr(6, 3), 64)}.` }),
      { make: coinsQ },
    ] },

    sec('derivation'),
    { type: 'text', text: 'The binomial formula, one move at a time: n independent trials, each a success with chance p.' },
    { type: 'steps', steps: [
      { answers: 'noFail', say: 'Take one specific sequence, say S S F F F: its chance is p × p × (1 − p) × (1 − p) × (1 − p).', why: 'Independent trials multiply (independence lesson).',
        checks: [mc({ q: 'A biased coin shows heads with chance 0.3. P(H H T, in that order)?', right: dec(0.3 * 0.3 * 0.7, 3), at: 2,
          wrong: [[dec(0.3 * 0.3, 3), 'forgot the tail'], [dec(3 * 0.3 * 0.3 * 0.7, 3), 'counted all orders, but this one is fixed'], [dec(0.7 * 0.7 * 0.3, 3), 'swapped the chances of heads and tails']],
          explain: '0.3 × 0.3 × 0.7 = 0.063.' })] },
      { say: 'Every sequence with k successes has the same chance, p^{k}(1 − p)^{n − k}: only the order of the factors differs.', why: 'Multiplication does not care about order.',
        checks: [{ type: 'choice', q: 'Is P(F S F S F) equal to P(S S F F F)?', options: ['Yes', 'No'], answer: 0, traps: { 1: 'the same five factors appear, just in a different order' }, explain: 'Both are p^{2}(1 − p)^{3}.' }] },
      { answers: 'oneOrder', say: 'Count the orders: choose which k of the n trials succeed, C(n, k) ways.', why: 'A sequence is fixed by the positions of its successes (counting lesson).',
        checks: [{ make: (rng) => { const n = rng.int(5, 9), k = rng.int(2, 4); return { type: 'number', q: `How many sequences of ${n} tosses have exactly ${k} heads?`, answer: nCr(n, k), hints: [`Choose the ${k} positions of the heads.`], explain: `C(${n}, ${k}) = ${nCr(n, k)}.` }; } }] },
      { say: 'The orders cannot happen together, so add their chances: P(X = k) = C(n, k) p^{k}(1 − p)^{n − k}.', why: 'Adding C(n, k) equal chances is multiplying by C(n, k).',
        checks: [{ make: binomDiceQ }] },
      { say: 'Mean: X = I_{1} + … + I_{n}, one indicator per trial, so E[X] = np.', why: 'Linearity (expectation lesson): each trial contributes p.',
        checks: [{ make: (rng) => { const n = rng.pick([20, 40, 50, 100]), p = rng.pick([0.1, 0.25, 0.3, 0.5]); return { type: 'number', q: `${n} independent trials, each a success with chance ${p}. Expected number of successes?`, answer: round(n * p, 6), explain: `np = ${n} × ${p} = ${round(n * p, 6)}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Why does the binomial formula contain C(n, k), and why does the hypergeometric not multiply the same p again and again?', model: 'p^{k}(1 − p)^{n − k} is the chance of one particular order; C(n, k) orders share it, so they are added. The hypergeometric draws without replacement, so the chance of a success changes after every draw; it counts equally likely hands instead of multiplying a fixed p.', points: ['p^{k}(1 − p)^{n − k} is one order', 'C(n, k) counts the orders, which are disjoint', 'Without replacement the chance changes, so count hands instead'] },

    sec('geometric', 'Geometric: wait for the first success'),
    { type: 'text', text: 'Repeat independent trials until the first success; T is the number of the trial where it arrives. T = k means k − 1 failures and then a success. T > k means the first k trials all failed.' },
    { type: 'formula', text: 'P(T = k) = (1 − p)^{k − 1} p      P(T > k) = (1 − p)^{k}      E[T] = 1/p' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'First six on roll k', xLabel: 'roll k', yLabel: 'probability', categories: Array.from({ length: 10 }, (_, i) => String(i + 1)), series: [{ name: 'P(T = k)', values: Array.from({ length: 10 }, (_, i) => round((5 / 6) ** i / 6, 3)) }], valueLabels: true }, caption: 'Each bar is 5/6 of the one before. Roll 1 is the single most likely, even though the average wait is 6.' },
    { type: 'steps', steps: [
      { say: 'T = k needs k − 1 failures then a success: (1 − p)^{k − 1} × p.', why: 'Independent trials multiply, and the order is forced (the success must come last), so there is no C(n, k).',
        checks: [{ make: (rng) => { const p = rng.pick([[1, 2], [1, 3], [1, 4]]), k = rng.int(2, 4), q = p[1] - p[0]; return mc({ q: `Each trial succeeds with chance ${p[0]}/${p[1]}. What is P(the first success is on trial ${k})?`, right: frac(q ** (k - 1), p[1] ** k),
          wrong: [[frac(q ** k, p[1] ** (k + 1)), `off by one: only ${k - 1} failures come first`], [frac(q ** (k - 1), p[1] ** (k - 1)), 'forgot the success itself'], [frac(k * q ** (k - 1), p[1] ** k), 'multiplied by the positions, but the success must be last']],
          explain: `(${q}/${p[1]})^{${k - 1}} × 1/${p[1]} = ${frac(q ** (k - 1), p[1] ** k)}.` }, rng); } }] },
      { say: 'T > k means the first k trials all fail: (1 − p)^{k}.', why: 'Nothing is said about the trials after k.',
        checks: [{ make: (rng) => { const k = rng.int(2, 4); return mc({ q: `A die is rolled until the first six. What is P(no six in the first ${k} rolls)?`, right: frac(5 ** k, 6 ** k), wrong: [[frac(6 ** k - 5 ** k, 6 ** k), 'that is P(at least one six)'], [frac(5 ** (k - 1), 6 ** k), 'that is P(the first six on roll k)']], explain: `(5/6)^{${k}} = ${frac(5 ** k, 6 ** k)}.` }, rng); } }] },
      { answers: 'halfWait', say: 'Mean wait: in a long run of N trials you see about Np successes, so the waits between them average N/(Np) = 1/p.', why: 'Each success ends one wait, and the waits fill the whole run. The first-step lesson proves it exactly.',
        checks: [{ make: (rng) => { const k = rng.int(3, 5), p = frac(7 - k, 6); return { type: 'number', q: `A die is rolled until it shows ${k} or more. How many rolls do you expect?`, answer: 6 / (7 - k), tolerance: 0.006, hints: [`P(success per roll) = ${7 - k}/6.`, 'Mean wait = 1/p.'], explain: `p = ${p}, so E[T] = 1/p = ${frac(6, 7 - k)}${Number.isInteger(6 / (7 - k)) ? '' : ` ≈ ${dec(6 / (7 - k), 2)}`}.` }; } }] },
    ] },

    sec('hyper', 'Hypergeometric: draws without replacement'),
    { type: 'text', text: 'A pile of N items holds K successes. Draw n without replacement and count the successes X. Every hand of n is equally likely, so count hands: choose k of the K successes and n − k of the N − K others. The mean is n × K/N, because each draw is a success with chance K/N (symmetry) and linearity adds them.' },
    { type: 'formula', text: 'P(X = k) = C(K, k) × C(N − K, n − k) / C(N, n)      mean n × K/N' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['red drawn', 'hands', 'probability'], rows: hyRows }, caption: `${HY.N} balls, ${HY.K} red, ${HY.n} drawn: hands per number of reds. The hands add up to C(${HY.N}, ${HY.n}) = ${nCr(HY.N, HY.n)}.` },
    { type: 'check', scope: 'counting hands', questions: [{ make: hyperQ }] },

    sec('predict'),
    { type: 'predict', question: 'A die is rolled until the first six. Is P(more than 6 rolls are needed) above or below 1/2?', answer: `Below: (5/6)^{6} ≈ ${dec((5 / 6) ** 6, 3)}.`, explain: 'The mean wait is 6, but short waits are the most likely; a few very long waits pull the mean up.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'The binomial chance of k successes is p^{k}(1 − p)^{n − k}.', fix: 'That is one order; multiply by the C(n, k) orders.' },
      { belief: 'Draws without replacement are binomial.', fix: 'The pile changes after every draw: count hands (hypergeometric) or multiply updated fractions.' },
      { belief: '"First success on trial k" is (1 − p)^{k} p.', fix: 'Only k − 1 failures come before it: (1 − p)^{k − 1} p.' },
      { belief: 'A mean wait of 1/p means the wait is usually about 1/p.', fix: 'The single most likely wait is 1; the long right tail pulls the mean up.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(exactly 2 heads in 4 tosses of a fair coin). One step is wrong.', steps: [
      'The tosses are independent, each heads with chance 1/2.',
      'The sequence HHTT has probability (1/2)^{4} = 1/16.',
      'So P(exactly 2 heads) = 1/16.',
      'Check: 1/16 is below 1/2, which is plausible.',
    ], errorStep: 2, explain: `HHTT is one of C(4, 2) = ${nCr(4, 2)} orders, each with chance 1/16: P = ${nCr(4, 2)}/16 = ${frac(nCr(4, 2), 16)}.` },
    { type: 'check', scope: 'binomial orders', questions: [{ hinge: true, make: binomDiceQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Coins (p = 1/2): P(X = k) = C(n, k)/2^{n}, just count. Dice: keep C(n, k) × 5^{n − k} over 6^{n} in whole numbers until the last step.' },
    { type: 'check', scope: 'whole numbers until the last step', questions: [
      { type: 'number', q: 'A die is rolled 4 times. How many of the 6^{4} = 1296 sequences have exactly one six?', answer: nCr(4, 1) * 5 ** 3, hints: ['Where is the six? C(4, 1) places.', 'The other three dice: 5 faces each.'], explain: `C(4, 1) × 5^{3} = 4 × 125 = ${nCr(4, 1) * 5 ** 3}. Keep that whole number; P = ${nCr(4, 1) * 5 ** 3}/1296 only at the end.` },
    ] },
    { type: 'callout', tone: 'speed', text: `Tail anchors: (5/6)^{4} ≈ ${dec((5 / 6) ** 4, 2)}, (5/6)^{6} ≈ ${dec((5 / 6) ** 6, 2)}, (1/2)^{10} ≈ 1/1000. Big pile, few draws: the hypergeometric is close to the binomial with p = K/N.` },
    { type: 'check', scope: 'tail anchors', questions: [
      { make: (rng) => { const k = rng.pick([4, 6, 12]), v = (5 / 6) ** k; return mc({ q: `A die is rolled until the first six. Which is closest to P(more than ${k} rolls are needed)?`, right: dec(v, 2),
        wrong: [[dec(1 - v, 2), `that is P(a six within ${k} rolls)`], [dec((5 / 6) ** (k - 1) / 6, 2), `that is P(the first six is exactly on roll ${k})`]],
        explain: `(5/6)^{${k}} ≈ ${dec(v, 3)}.` }, rng); } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Fixed n, independent, count successes → binomial C(n, k)p^{k}(1 − p)^{n − k}, mean np. Wait for the first success → geometric (1 − p)^{k − 1}p, mean 1/p. Without replacement, count successes → hypergeometric C(K, k)C(N − K, n − k)/C(N, n), mean nK/N.' },

    sec('contrast'),
    { type: 'compare', columns: ['', 'Binomial', 'Geometric', 'Hypergeometric'], rows: [
      ['What is counted', 'successes in n trials', 'trials up to the first success', 'successes in n draws'],
      ['Trials', 'independent, n fixed', 'independent, until a success', 'without replacement, n fixed'],
      ['P(X = k)', 'C(n, k)p^{k}(1 − p)^{n − k}', '(1 − p)^{k − 1}p', 'C(K, k)C(N − K, n − k)/C(N, n)'],
      ['Mean', 'np', '1/p', 'nK/N'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: p = 1 makes the binomial always n and the geometric always 1. One draw (n = 1) makes the hypergeometric a plain K/N. Drawing everything (n = N) makes X = K for sure.' },
    { type: 'check', scope: 'hypergeometric mean and the edge cases', questions: [
      { make: (rng) => { const N = rng.pick([20, 30, 40, 52]), K = rng.int(4, 10), n = rng.int(3, 8), ans = round((n * K) / N, 2); return { type: 'number', q: `A pile of ${N} cards holds ${K} winners. ${n} are drawn without replacement. Expected number of winners? (2 decimal places)`, answer: ans, tolerance: 0.006, hints: ['Each draw is a winner with chance K/N.', 'Add over the draws.'], explain: `${n} × ${K}/${N} = ${dec((n * K) / N, 3)}.` }; } },
      { type: 'number', q: 'A bag holds 12 balls, 5 of them red. You draw all 12. What is P(exactly 5 red)?', answer: 1, explain: 'Drawing everything (n = N) gives X = K for sure.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the first-success, urn-draws and coin-sequences families in Beat the Odds, waiting-time questions in Intervals, and coin-pattern rows in Likelihood List. The next lesson grows the binomial into the Poisson and the normal curve.' },
    { type: 'check', scope: 'the geometric wait elsewhere', questions: [
      { type: 'number', q: 'An order is re-sent until it fills. Each attempt fills with probability 0.2, independently. What is the expected number of attempts?', answer: 5, explain: 'A geometric wait from the table: mean 1/p = 1/0.2 = 5.' },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: coinsQ }, { make: geomQ }, { make: hyperQ }] },
  ],
};
