// Expected value of dice games: payoff functions, fair prices, and the optimal reroll rule.
import { Q } from '../../../core/rational.js';
import { mcqItem, agree, q, pic, table } from '../lib.js';

// Payoff per face: the fair price is the plain average of the right-hand column.
const payTable = (k, pay, caption, head = 'Payoff') => table(['Face', head], Array.from({ length: k }, (_, i) => [i + 1, pay(i + 1)]), caption);
// Two dice, every cell equally likely, holding its payoff.
const payGrid = (f, caption) => pic('grid', { rows: 6, cols: 6, highlight: [], cellText: [1, 2, 3, 4, 5, 6].map((a) => [1, 2, 3, 4, 5, 6].map((b) => String(f(a, b)))), rowTitle: 'first die', colTitle: 'second die' }, caption);

const ID = 'dice-games-ev';
const die = (k) => (k === 6 ? 'a fair die' : `a fair ${k}-sided die`);
const mean = (k) => q(k + 1, 2);
// EV answers cluster (3.5, 4.17, 4.25, 4.47): use a tighter closest-value spacing than the default 7%.
const minGap = (c) => Math.max(0.05, Math.abs(c) * 0.015);

// Optimal value of up to `rolls` rolls of a k-sided die, keeping the last roll: V1 = (k+1)/2,
// V_{r+1} = E[max(X, V_r)].
function optimal(k, rolls) {
  let V = mean(k);
  const cuts = [];
  for (let r = 1; r < rolls; r++) {
    let s = q(0);
    for (let x = 1; x <= k; x++) s = s.add(q(x).cmp(V) >= 0 ? q(x) : V);
    cuts.unshift(V);
    V = s.div(q(k));
  }
  return { V, cuts };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Dice games: expected value and when to reroll',
  skill: 'EV = Σ payoff × probability; reroll exactly when the current roll is below the value of continuing',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    const kind = difficulty === 2 ? rng.pick(['square', 'evenOdd', 'product', 'absDiff']) : difficulty === 3 ? 'reroll' : 'threeRolls';
    if (kind === 'square') {
      const k = rng.pick([4, 6, 6, 8, 10, 12]);
      const v = q((k + 1) * (2 * k + 1), 6);
      return mcqItem(ID, rng, difficulty, {
        ev: true, value: v, minGap,
        text: `You roll ${die(k)} and receive the square of the number shown, in dollars. What is the fair price to play?`,
        distractors: [
          { value: mean(k).mul(mean(k)), misconception: `Squared the average roll: E[X²] is not E[X]². The difference is the variance.` },
          { value: mean(k), misconception: 'Used the average roll, forgetting the payoff is the square.' },
          { value: q(k * k, 2), misconception: 'Averaged the smallest and largest payoffs (0 and k²). Squares are not evenly spaced.' },
          { value: q((1 + k * k), 2), misconception: 'Averaged 1² and k², treating the payoffs as evenly spaced.' },
          { value: q(k * k, 3), misconception: 'Used the continuous-uniform formula k²/3; a die has discrete faces 1..k.' },
        ],
        steps: [
          { say: `Fair price = expected payoff = (1² + 2² + … + ${k}²)/${k}.`, why: 'Each face has probability 1/k.' },
          { say: `Sum of squares = ${k}·${k + 1}·${2 * k + 1}/6 = ${(k * (k + 1) * (2 * k + 1)) / 6}, so E = ${v} ≈ ${v.toNumber().toFixed(2)}.`, why: 'Standard sum Σx² = n(n+1)(2n+1)/6.' },
        ],
        rule: 'E[X²] = (k+1)(2k+1)/6 for a fair k-sided die; E[X²] − E[X]² = variance > 0.',
        anchor: 'The average roll (k+1)/2, with one change: average the payoff f(x) = x² instead of x itself.',
        hints: ['Average the payoffs, not the rolls.', 'Σ x² = n(n+1)(2n+1)/6.', `Divide by ${k}.`],
        picture: payTable(k, (x) => x * x, `Each face pays its square. The fair price is the average of the column, ${(k * (k + 1) * (2 * k + 1)) / 6}/${k} = ${v}, more than the square of the average roll, ${mean(k).mul(mean(k))}.`),
        fast: `(k + 1)(2k + 1)/6 = ${k + 1} × ${2 * k + 1}/6 = ${v}.`,
        check: `E[X²] beats E[X]² = ${mean(k).mul(mean(k))} by the variance, so the answer must be above that; and below the top payoff ${k * k}.`,
        data: { kind, k },
      });
    }
    if (kind === 'evenOdd') {
      const k = rng.pick([6, 6, 8, 10, 12]);
      const t = rng.int(Math.ceil(k / 3), Math.ceil((2 * k) / 3));
      let s = 0;
      for (let x = 1; x <= k; x++) s += x >= t ? x : -x;
      const v = q(s, k);
      return mcqItem(ID, rng, difficulty, {
        ev: true, value: v, minGap,
        text: `You roll ${die(k)}. If it shows ${t} or more you win that many dollars; otherwise you lose that many dollars. What is your expected profit per game?`,
        distractors: [
          { value: q(0), misconception: 'Assumed winning and losing faces cancel. The winning faces are the larger numbers.' },
          { value: q(k - t + 1, k).mul(mean(k)), misconception: 'Multiplied P(win) by the average face, forgetting the losing faces cost money.' },
          { value: q(k - t + 1, k).sub(q(t - 1, k)), misconception: 'Computed P(win) − P(lose), ignoring the payoff sizes.' },
          { value: v.neg(), misconception: 'Swapped which faces win and which lose.' },
          { value: mean(k), misconception: 'Used the plain average roll.' },
        ],
        steps: [
          { say: `Winning faces ${t}..${k} sum to ${Array.from({ length: k - t + 1 }, (_, i) => t + i).reduce((a, b) => a + b, 0)}; losing faces 1..${t - 1} sum to ${((t - 1) * t) / 2}.`, why: 'Split the faces by outcome.' },
          { say: `E = (${Array.from({ length: k - t + 1 }, (_, i) => t + i).reduce((a, b) => a + b, 0)} − ${((t - 1) * t) / 2})/${k} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Each face has probability 1/k.' },
        ],
        rule: 'EV = (Σ winning payoffs − Σ losing payoffs)/k.',
        anchor: 'The average roll, with one change: some faces count negative.',
        hints: ['Which faces win and which lose?', 'Add the payoffs with signs, then divide by the number of faces.', `Signed sum ${s}.`],
        picture: payTable(k, (x) => (x >= t ? `+${x}` : `−${x}`), `Faces ${t} and up pay their value, the rest cost it. The signed column adds to ${s}; divide by ${k}.`, 'Profit'),
        fast: `(winning faces − losing faces)/${k} = ${s}/${k} = ${v}.`,
        check: `The big faces win, so the game ${s > 0 ? 'favours you' : s < 0 ? 'favours the house' : 'is fair'}; the answer must lie between −${t - 1} and ${k}.`,
        data: { kind, k, t },
      });
    }
    if (kind === 'product' || kind === 'absDiff') {
      const prod = kind === 'product';
      const v = prod ? q(49, 4) : q(70, 36);
      return mcqItem(ID, rng, difficulty, {
        ev: true, value: v, minGap,
        text: prod ? 'You roll two fair dice and receive the product of the faces in dollars. What is the fair price to play?' : 'You roll two fair dice and receive the absolute difference of the faces in dollars. What is the fair price to play?',
        distractors: prod ? [
          { value: q(91, 6), misconception: 'Used E[X²] (one die squared). The two dice are independent, so E[XY] = E[X]E[Y].' },
          { value: 7, misconception: 'Used the expected sum, not the product.' },
          { value: 18, misconception: 'Averaged the extreme products 1 and 36, treating products as evenly spread.' },
        ] : [
          { value: 0, misconception: 'Reasoned "E[X − Y] = 0, so the difference is worth 0". The absolute value removes the cancellation.' },
          { value: q(5, 2), misconception: 'Averaged the possible differences 0..5 as if equally likely. Small differences are more common.' },
          { value: 3.5, misconception: 'Used the average of one die.' },
          { value: q(35, 36), misconception: 'Divided the difference sum by 72, double-halving for order.' },
        ],
        steps: prod ? [
          { say: 'The dice are independent, so E[XY] = E[X]·E[Y].', why: 'Independence lets expectations of products factor.' },
          { say: 'E = 3.5 × 3.5 = 12.25.', why: 'Each die averages 3.5.' },
        ] : [
          { say: 'Count ordered pairs by difference d: d = 0 has 6, d ≥ 1 has 2(6 − d).', why: 'For d ≥ 1 the smaller face ranges over 1..6 − d, in two orders.' },
          { say: 'Σ d × count = 1·10 + 2·8 + 3·6 + 4·4 + 5·2 = 70; E = 70/36 ≈ 1.944.', why: 'Each ordered pair has probability 1/36.' },
        ],
        rule: prod ? 'Independent: E[XY] = E[X]E[Y]; but E[X²] ≠ E[X]².' : 'E|X − Y| for two dice = 70/36; |·| destroys the cancellation of E[X − Y] = 0.',
        anchor: 'The average of one die, with one change: the payoff combines two independent dice.',
        hints: prod ? ['Are the two dice independent?', 'Expectations of independent products factor.', '3.5².'] : ['Tabulate the differences 0..5 with their counts.', 'Counts: 6, 10, 8, 6, 4, 2.', '70/36.'],
        picture: prod ? payGrid((a, b) => a * b, 'Each of the 36 cells pays its product. The cells add to 441 = 21 × 21, so the average is 441/36 = 12.25 = 3.5².') : payGrid((a, b) => Math.abs(a - b), 'Each of the 36 cells pays the difference. The diagonal pays 0 and the cells add to 70, so the average is 70/36.'),
        fast: prod ? '3.5 × 3.5 = 12.25.' : '(1·10 + 2·8 + 3·6 + 4·4 + 5·2)/36 = 70/36.',
        check: prod ? 'Independence makes E[XY] = 3.5²; using E[X²] = 91/6 for one die squared would give 15.17, which is the wrong game.' : 'E[X − Y] = 0 but the absolute value removes the cancellation, so the answer is positive and below the largest difference 5.',
        data: { kind },
      });
    }
    const k = kind === 'threeRolls' ? rng.pick([4, 6, 6, 8]) : rng.pick([4, 6, 6, 8, 10, 12]);
    const rolls = kind === 'threeRolls' ? 3 : 2;
    const { V, cuts } = optimal(k, rolls);
    const two = optimal(k, 2).V;
    let maxOfAll = q(0); // E[max of `rolls` independent rolls]
    for (let x = 1; x <= k; x++) maxOfAll = maxOfAll.add(q(1).sub(new Q(BigInt(x - 1) ** BigInt(rolls), BigInt(k) ** BigInt(rolls))));
    const firstCut = cuts[0];
    // A plausible but suboptimal rule: keep only the top third on every roll.
    const top = Math.ceil((2 * k) / 3) + 1;
    let naive = mean(k);
    for (let r = 1; r < rolls; r++) {
      let s = q(0);
      for (let x = 1; x <= k; x++) s = s.add(x >= top ? q(x) : naive);
      naive = s.div(q(k));
    }
    return mcqItem(ID, rng, difficulty, {
      ev: true, value: V, minGap,
      text: `You roll ${die(k)} and may reroll ${rolls === 2 ? 'once' : 'up to twice'}. You are paid the number on your final roll (you cannot go back to an earlier roll). Playing optimally, what is your expected payout?`,
      distractors: [
        { value: mean(k), misconception: 'Ignored the option to reroll.' },
        { value: maxOfAll, misconception: `Took the maximum of ${rolls} rolls. Once you reroll, you must accept the new roll.` },
        ...(rolls === 3 ? [{ value: two, misconception: 'Used the one-reroll value; the second reroll option raises the value of continuing.' }] : []),
        { value: naive, misconception: `Kept only rolls of ${top} or more. Keep any roll at or above the value of rerolling (${firstCut}).` },
        { value: q(k), misconception: 'Assumed optimal play reaches the top face.' },
      ],
      steps: [
        { say: `Work backwards. With no rerolls left, a roll is worth its average ${mean(k)}.`, why: 'The last roll must be accepted.' },
        { say: rolls === 2 ? `With one reroll left, keep x if x ≥ ${mean(k)}, otherwise reroll.` : `With one reroll left the value is ${two}; with two left, keep x if x ≥ ${two}.`, why: 'Compare the sure value in hand with the expected value of continuing.' },
        { say: `Value = E[max(X, value of continuing)] = ${V} ≈ ${V.toNumber().toFixed(3)}.`, why: 'Average over the first roll with the keep/reroll rule applied.' },
      ],
      picture: payTable(k, (x) => (q(x).cmp(firstCut) >= 0 ? `keep: ${x}` : `reroll: worth ${firstCut}`), `First roll: keep a face worth at least the value of continuing (${firstCut}), otherwise reroll. The column averages to ${V}.`, 'Best move and its worth'),
      fast: `Keep ${firstCut.toNumber() % 1 === 0 ? `${firstCut} or more` : `above ${firstCut.toNumber().toFixed(2)}`}; value = E[max(X, ${firstCut})] = ${V.toNumber().toFixed(3)}.`,
      check: `Above one roll's ${mean(k)} (the option to reroll can only help) and below the max of ${rolls} rolls, ${maxOfAll.toNumber().toFixed(3)}, because a roll you passed on cannot be taken back.`,
      rule: 'Backward induction: V_1 = mean; V_(r+1) = E[max(X, V_r)]. d6: 3.5 → 4.25 → 4.667.',
      anchor: 'The average roll 3.5, with one change: you may throw away a low roll, so each roll is worth max(roll, value of continuing).',
      hints: ['Start from the last roll: what is it worth?', 'Keep a roll only if it beats the value of rerolling.', `Threshold ${firstCut}.`],
      data: { kind, k, rolls },
    });
  },

  // Independent check: exhaustive search over keep-sets (which faces to keep at each roll), or direct enumeration.
  verify(item) {
    const d = item.params;
    if (d.kind === 'square') { let s = 0; for (let x = 1; x <= d.k; x++) s += x * x; return agree(item, s / d.k); }
    if (d.kind === 'evenOdd') { let s = 0; for (let x = 1; x <= d.k; x++) s += x >= d.t ? x : -x; return agree(item, s / d.k); }
    if (d.kind === 'product' || d.kind === 'absDiff') {
      let s = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) s += d.kind === 'product' ? a * b : Math.abs(a - b);
      return agree(item, s / 36);
    }
    const k = d.k, avg = (k + 1) / 2;
    const val = (S, cont) => { let v = 0; for (let x = 1; x <= k; x++) v += (S >> (x - 1)) & 1 ? x : cont; return v / k; };
    let best = -Infinity;
    if (d.rolls === 2) for (let S = 0; S < 2 ** k; S++) best = Math.max(best, val(S, avg));
    else for (let S2 = 0; S2 < 2 ** k; S2++) { const c2 = val(S2, avg); for (let S1 = 0; S1 < 2 ** k; S1++) best = Math.max(best, val(S1, c2)); }
    return agree(item, best, 1e-9);
  },

  lesson: {
    purpose: 'Pricing a game ("what would you pay to play?") is the trader\'s core question. The price is the expected payoff, and options to stop or reroll add value you can compute backwards.',
    anchor: 'The average roll 3.5 = Σ x/6, with one change: average the payoff, and where you have a choice, average the better of your options.',
    steps: [
      { say: 'Fair price = expected payoff = Σ payoff(x) × P(x).', why: 'Over many plays, the average profit per game converges to this.' },
      { say: 'Nonlinear payoffs: E[f(X)] ≠ f(E[X]) (e.g. E[X²] > 3.5²).', why: 'Averaging and squaring do not commute; the gap is the variance.' },
      { say: 'Options: go backwards. The value of continuing is known at the last stage; keep a roll iff it beats that value.', why: 'Each decision compares a sure amount with an expectation.' },
    ],
    predict: { question: 'One reroll of a die: which rolls should you keep, and is the value above or below E[max of two dice] = 4.47?', answer: 'Keep 4, 5, 6; value 4.25, below 4.47, because a reroll must be accepted.' },
    edge: 'With unlimited rerolls (and no cost) the value approaches 6: you just wait for a six.',
    rule: 'Price = E[payoff]. d6 reroll values: 3.5, 4.25, 4.667. E[XY] = E[X]E[Y] for independent dice.',
    contrast: 'Stopping rule (must accept the reroll: 4.25) against the maximum of two rolls (keep the better: 4.47).',
  },
};
