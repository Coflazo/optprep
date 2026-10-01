// Probability foundations 7: expected value, fair price, linearity, indicator variables.
import { sec, frac, dec, round, mc } from './sample-spaces.js';

const FACES = [1, 2, 3, 4, 5, 6];
const sumF = (pred) => FACES.filter(pred).reduce((a, b) => a + b, 0);
const eMax = FACES.reduce((a, m) => a + m * (2 * m - 1), 0) / 36;
const eSq = FACES.reduce((a, f) => a + f * f, 0);

const dieGameQ = (rng) => {
  const k = rng.int(4, 5), L = rng.int(1, 3), losers = k - 1, ev = (sumF((f) => f >= k) - L * losers) / 6;
  return { type: 'number', q: `Roll a fair die. If it shows ${k} or more you win that many euros; otherwise you lose €${L}. What is the expected payout per roll, in euros? (2 decimal places)`, answer: round(ev, 2), tolerance: 0.006,
    hints: ['List each outcome with its payout; losses are negative.', `Winning faces add ${sumF((f) => f >= k)}; the ${losers} losing faces add −${L * losers}. Divide by 6.`],
    explain: `(${FACES.filter((f) => f >= k).join(' + ')} − ${losers} × ${L}) / 6 = ${frac(sumF((f) => f >= k) - L * losers, 6)} ≈ ${dec(ev, 2)}.` };
};
const countQ = (rng) => {
  const kind = rng.int(0, 2);
  if (kind === 0) { const n = rng.pick([12, 18, 24, 30, 42, 60]); return { type: 'number', q: `${n} fair dice are thrown. What is the expected number of sixes?`, answer: n / 6, explain: `One six-indicator per die, each averaging 1/6: ${n} × 1/6 = ${n / 6}.` }; }
  if (kind === 1) { const k = rng.pick([8, 12, 16, 20]); return { type: 'number', q: `${k} cards are dealt from a shuffled 52-card deck. What is the expected number of hearts?`, answer: k / 4, explain: `Each card is a heart with chance 13/52 = 1/4, dependent or not: ${k} × 1/4 = ${k / 4}.` }; }
  const n = rng.pick([10, 20, 50, 100]), m = rng.pick([2, 5, 10].filter((x) => x < n));
  return { type: 'number', q: `${n} people take back hats at random from a pile of their ${n} hats. What is the expected number of matches among the first ${m} people?`, answer: m / n, tolerance: 1e-9, explain: `Each of the ${m} has chance 1/${n}: ${m}/${n} = ${dec(m / n, 3)}.` };
};
const fairQ = (rng) => {
  const a = rng.int(2, 4), b = rng.int(-3, 3);
  return { type: 'number', q: `A game pays €(${a} × face ${b < 0 ? '−' : '+'} ${Math.abs(b)}) on one roll of a fair die. What is the fair price to play, in euros?`, answer: a * 3.5 + b,
    hints: ['Fair price = expected payout.', `E[aX + b] = a E[X] + b, with E[face] = 3.5.`],
    explain: `${a} × 3.5 ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * 3.5 + b}.` };
};

const G = { vals: [-1, 5, 6], w: [4, 1, 1] };
G.ev = G.vals.reduce((a, v, i) => a + v * G.w[i], 0) / 6;

export default {
  id: 'prob/expectation-linearity',
  book: 'prob',
  kind: 'foundation',
  title: 'Expected value and linearity',
  summary: 'EV = Σ value × probability. Expected counts are sums of chances, with or without independence.',
  prerequisites: ['prob/independence'],
  objectives: [
    'Compute E[X] = Σ x × P(X = x) for a small game, losses included',
    'Price a game fairly: fair price = expected payout',
    'Use E[X + Y] = E[X] + E[Y] and E[aX + b] = a E[X] + b without independence',
    'Find expected counts with indicator variables in one line',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: 10 people drop their hats in a pile and each takes one back at random. How many people do you expect to get their own hat back? Two approaches, then an answer.', answer: '1', explain: 'Listing all 10! orders is hopeless. The fast route: each person gets their own hat with chance 1/10, and the expected number of matches is the sum of those ten chances, 10 × 1/10 = 1. This lesson builds that route.',
      attempts: [
        { id: 'list', label: 'Listed every order', approach: `Tried to count matches over all 10! = ${Array.from({ length: 10 }, (_, i) => i + 1).reduce((a, b) => a * b)} orders.`, breaksAt: 'Hopeless by hand. One indicator per person needs only one chance each: 1/10.' },
        { id: 'dependent', label: 'Stuck on dependence', approach: 'Decided the matches depend on each other, so no shortcut exists.', breaksAt: 'Linearity never needs independence: each indicator still averages 1/10, so the count averages 10 × 1/10.' },
      ] },
    { type: 'text', text: 'Trigger words: **expected**, **on average**, **fair price**, "how much would you pay to play", "expected number of". The answer is a long-run average, not a probability, so it can be any number: negative, above 1, or a value the game never actually pays.' },
    { type: 'check', scope: 'spotting an expected-value question', questions: [
      mc({ q: 'Which question asks for an expected value?', right: 'What is a fair price for a game paying a die face in €?', at: 2,
        wrong: [['What is the chance that a fair die shows a 6?', 'a probability, not an average payout'], ['Which sum of two fair dice is the most likely?', 'the most likely value is not the average value'], ['How many ordered outcomes do two dice have?', 'a count of outcomes, not an average']],
        explain: 'A fair price is the long-run average payout: an expected value.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Optiver makes markets: every quote is judged by its expected value. Beat the Odds asks for fair prices of dice games directly, and linearity turns "expected number of…" questions that look impossible into one multiplication.' },

    sec('anchor'),
    { type: 'text', text: 'You know the average of a list: add and divide. A fair die averages (1 + 2 + … + 6)/6 = 3.5. **Expected value** is that average with **one change**: each value is weighted by its probability instead of appearing once. For a fair die the weights are all 1/6, which is why the two agree.' },
    { type: 'formula', text: 'E[X] = Σ x × P(X = x)   (sum over every value x)' },
    { type: 'check', scope: 'E[X] as a weighted average', questions: [
      { make: (rng) => { const a = rng.int(1, 4) * 2, b = rng.int(3, 8) * 4, c = rng.int(0, 2) * 4, ev = a / 2 + b / 4 + c / 4; return { type: 'number', q: `A spinner pays €${a} with chance 1/2, €${b} with chance 1/4 and €${c} with chance 1/4. What is the expected payout, in euros?`, answer: ev, hints: ['Multiply each payout by its chance.', 'Then add the three products.'], explain: `${a} × 1/2 + ${b} × 1/4 + ${c} × 1/4 = ${a / 2} + ${b / 4} + ${c / 4} = ${ev}.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'Draw the distribution as bars: value along the bottom, probability as height. The expected value is the balance point, where a ruler carrying those weights would balance. Example game: roll a die, win €5 on a 5, €6 on a 6, lose €1 otherwise.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Payout of the example game', xLabel: 'payout (€)', yLabel: 'chance (in sixths)', categories: G.vals.map(String), series: [{ name: 'sixths', values: G.w }], valueLabels: true }, caption: `Four sixths of the weight sits at −1, one sixth each at 5 and 6. The balance point is (−4 + 5 + 6)/6 = ${frac(7, 6)} ≈ €${dec(G.ev, 2)}: the heavy bar at −1 pulls it far below the middle of the payouts.` },
    { type: 'check', scope: 'EV of a die game', questions: [{ make: dieGameQ }] },

    sec('fair', 'Fair price'),
    { type: 'text', text: 'A **fair price** makes the expected profit zero: fair price = E[payout]. Pay less and you gain on average; pay more and you lose on average. Expected profit per play = E[payout] − price.' },
    { type: 'check', scope: 'fair price and expected profit', questions: [
      { make: (rng) => { const c = rng.pick([5, 6, 8, 9]); return { type: 'number', q: `A game pays €(2 × face) on one roll of a fair die, and costs €${c} to play. What is your expected profit per play, in euros?`, answer: 7 - c, hints: ['First the expected payout: 2 × each face, weighted by 1/6.', 'Then subtract the price.'], explain: `E[payout] = 2 × 3.5 = 7. Profit = 7 − ${c} = ${7 - c < 0 ? `−${c - 7}` : 7 - c}.` }; } },
    ] },

    sec('linearity', 'Linearity: expectations add'),
    { type: 'text', text: 'Expected values add: E[X + Y] = E[X] + E[Y] for **any** X and Y, independent or not. Why: each outcome contributes (x + y) × its probability; split that into x × probability plus y × probability, and the two sums are E[X] and E[Y]. No step used independence. Scaling and shifting pass straight through too.' },
    { type: 'formula', text: 'E[X + Y] = E[X] + E[Y]        E[aX + b] = a E[X] + b' },
    { type: 'check', scope: 'adding and scaling expectations', questions: [
      { make: (rng) => { const n = rng.int(3, 20); return { type: 'number', q: `${n} fair dice are thrown. What is the expected total?`, answer: 3.5 * n, explain: `${n} × 3.5 = ${3.5 * n}.` }; } },
      { make: (rng) => { const a = rng.int(2, 5), b = rng.int(1, 9); return { type: 'number', q: `X is the face of a fair die. What is E[${a}X + ${b}]?`, answer: a * 3.5 + b, explain: `${a} × 3.5 + ${b} = ${a * 3.5 + b}.` }; } },
    ] },

    sec('indicators', 'Indicators: count by adding chances'),
    { type: 'text', text: 'An **indicator** of an event A is 1 if A happens and 0 if not. Its expected value is 1 × P(A) + 0 × (1 − P(A)) = P(A). A count ("how many of these events happen") is a sum of indicators, so by linearity:' },
    { type: 'formula', text: 'E[number of the events A_{1}, …, A_{n} that happen] = P(A_{1}) + … + P(A_{n})' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Person', 'P(own hat)', 'E[indicator]'], rows: [...[1, 2, 3, 4].map((k) => [String(k), '1/4', '1/4']), ['total', '', String(4 * (1 / 4))]] }, caption: 'Four people, four hats handed back at random. Each indicator averages 1/4 whatever the others do. The expected number of matches is 4 × 1/4 = 1.' },
    { type: 'check', scope: 'expected counts from indicators', questions: [{ make: countQ }] },

    sec('derivation'),
    { type: 'text', text: 'The hats challenge with n people, one move at a time.' },
    { type: 'steps', steps: [
      { answers: 'list', say: 'Give each person an indicator: I_{k} = 1 if person k gets their own hat, 0 otherwise.', why: 'The number of matches is hard to handle directly; each indicator is one yes/no event with an easy chance.',
        checks: [mc({ q: 'With 10 people, what is E[I_{k}] for one person k?', right: '1/10', at: 1,
          wrong: [['1/2', 'treated "own hat or not" as equally likely'], ['1', 'assumed a match is certain'], ['1/9', 'left the own hat out of the pile']],
          explain: 'Person k is equally likely to receive any of the 10 hats, so P(own hat) = 1/10, and E[indicator] = P.' })] },
      { say: 'The number of matches is X = I_{1} + I_{2} + … + I_{n}.', why: 'Each person who matches adds exactly 1 to the sum; everyone else adds 0.',
        checks: [{ type: 'number', q: 'Five people. The indicators come out 1, 0, 0, 1, 0. How many matches are there?', answer: 2, explain: 'The sum of the indicators counts the matches: 1 + 0 + 0 + 1 + 0 = 2.' }] },
      { answers: 'dependent', say: 'Linearity: E[X] = E[I_{1}] + … + E[I_{n}] = n × 1/n = 1.', why: 'The indicators are dependent (if all but one match, the last must too), but linearity never needed independence.',
        checks: [{ make: (rng) => { const n = rng.pick([5, 12, 30, 100]); return { type: 'number', q: `${n} people and ${n} hats, handed back at random. Expected number of matches?`, answer: 1, explain: `${n} × 1/${n} = 1, whatever the number of people.` }; } }] },
      { say: 'Same move, new question: the expected number of sixes in 20 throws is 20 × 1/6.', why: 'Every "expected number of" is a sum of chances: find one chance, multiply by how many events there are.',
        checks: [{ make: (rng) => { const k = rng.pick([13, 26, 39]); return { type: 'number', q: `${k} cards are dealt from a shuffled deck. What is the expected number of aces?`, answer: k / 13, explain: `Each card is an ace with chance 4/52 = 1/13: ${k} × 1/13 = ${k / 13}.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Why can you add the expected values of the hat indicators even though they depend on each other?', model: 'Linearity comes from splitting each outcome\'s weighted sum into pieces; it never uses independence. Each indicator averages 1/n no matter how the others behave, so the total averages n × 1/n = 1.', points: ['E[X + Y] = E[X] + E[Y] holds for dependent variables too', 'The expected value of an indicator is its probability', 'A count is a sum of indicators, so its mean is a sum of chances'] },

    sec('predict'),
    { type: 'predict', question: '10 cards are dealt from a shuffled deck. How many aces do you expect among them?', answer: `10 × 4/52 = ${frac(40, 52)} ≈ ${dec(40 / 52, 2)}.`, explain: 'One chance (4/52 per card) times 10 cards. Dealing without replacement makes the cards dependent, which linearity does not care about.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Linearity needs independence.', fix: 'It does not: E[X + Y] = E[X] + E[Y] always.' },
      { belief: 'E[X^{2}] = (E[X])^{2}, and in general E[f(X)] = f(E[X]).', fix: `Apply f to each value first, then average: E[face^{2}] = ${frac(eSq, 6)}, not 3.5^{2}.` },
      { belief: 'The fair price is the most likely payout.', fix: 'It is the probability-weighted average of all payouts.' },
      { belief: 'Average only the winning amounts.', fix: 'Every outcome enters, losses as negative values.' },
    ] },
    { type: 'erroneous', problem: 'A candidate prices a game that pays the square of a die roll, in euros. One step is wrong.', steps: [
      'The game pays (face)^{2} euros.',
      'The expected face value is 3.5.',
      `So the expected payout is 3.5^{2} = ${3.5 ** 2}.`,
      `The fair price is €${3.5 ** 2}.`,
    ], errorStep: 2, explain: `Square first, then average: (1 + 4 + 9 + 16 + 25 + 36)/6 = ${frac(eSq, 6)} ≈ ${dec(eSq / 6, 2)}. Squaring the average undershoots.` },
    { type: 'check', scope: 'linearity versus f(E[X])', questions: [
      mc({ q: 'Two fair dice. What is E[larger face + smaller face]?', right: '7', at: 3,
        wrong: [['it cannot be found without the distribution of the larger face', 'larger + smaller is just the sum of the two dice'], ['3.5', 'that is one die'], [String(3.5 * 3.5), 'multiplied the two means instead of adding']],
        explain: 'Larger + smaller = first + second whatever the throw, so the mean is 3.5 + 3.5 = 7.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'An expected count needs no distribution: chance of one event × number of events. E[total of n dice] = 3.5n; E[heads in n tosses] = n/2.' },
    { type: 'callout', tone: 'speed', text: 'Symmetric payouts: if the payout distribution is symmetric about a value, that value is the EV. A die is symmetric about 3.5, the sum of two dice about 7.' },
    { type: 'check', scope: 'expected counts in one line', questions: [
      { make: (rng) => { const a = rng.int(4, 20), b = rng.pick([6, 12, 18]), ev = a / 2 + b / 6; return { type: 'number', q: `${a} coins are tossed and ${b} dice thrown. What is the expected number of heads plus sixes?`, answer: ev, hints: ['One indicator per coin (chance 1/2) and one per die (chance 1/6).', 'Add all the chances.'], explain: `${a}/2 + ${b}/6 = ${a / 2} + ${b / 6} = ${ev}.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'EV = Σ value × probability. Expected count → add the chances (linearity needs no independence). Fair price = EV of the payout.' },

    sec('contrast'),
    { type: 'compare', columns: ['Question asks for', 'Compute', 'Two dice example'], rows: [
      ['expected sum', 'E[X] + E[Y]', '7'],
      ['most likely sum', 'the value with the largest probability', '7'],
      ['expected larger face', 'Σ m × P(larger = m)', `${frac(eMax * 36, 36)} ≈ ${dec(eMax, 2)}`],
      ['P(sum is 7)', 'a probability, not an average', frac(6, 36)],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: the expected value of a constant is the constant. An expected value need not be a possible outcome (a die never shows 3.5). A game is fair at exactly one price, its EV.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: dice-game fair prices and linearity questions in Beat the Odds, expected dice totals in Intervals, and the fair value of a bundle in Orderbooks. The next lesson, symmetry, uses indicators again.' },
    { type: 'check', scope: 'mean versus most likely versus probability', questions: [
      mc({ q: 'Two dice. Which of these is not 7?', right: 'the expected larger face', at: 1,
        wrong: [['the expected sum', 'E[sum] = 3.5 + 3.5 = 7'], ['the most likely sum', 'sum 7 has the most pairs, 6 of 36'], ['the expected larger face plus the expected smaller face', 'larger + smaller is the sum, whose mean is 7']],
        explain: `The expected larger face is ${dec(eMax, 2)}; the other three are all 7.` }),
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: dieGameQ }, { make: countQ }, { make: fairQ }] },
  ],
};
