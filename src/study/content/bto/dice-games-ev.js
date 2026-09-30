// Dice games: the fair price is the expected payoff; non-linear payoffs do not commute with
// averaging; a reroll option is valued backwards. Every number shown is computed here.
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

const faces = (k) => Array.from({ length: k }, (_, i) => i + 1);
const mean = (k) => Q.of(k + 1, 2);
const avg = (k, f) => faces(k).reduce((a, x) => a.add(f(x)), Q.of(0)).div(Q.of(k));
const sq = (k) => avg(k, (x) => Q.of(x * x));
// Value with r rolls in total (r − 1 rerolls), keeping the last roll: V1 = mean, V(r+1) = E[max(X, V(r))].
const V = (k, r) => { let v = mean(k); for (let i = 1; i < r; i++) { const c = v; v = avg(k, (x) => (Q.of(x).cmp(c) >= 0 ? Q.of(x) : c)); } return v; };
const keepSet = (k, c) => faces(k).filter((x) => Q.of(x).cmp(c) >= 0);
const maxOf = (k, n) => { let e = Q.of(0); for (let x = 1; x <= k; x++) e = e.add(Q.of(1).sub(new Q(BigInt(x - 1) ** BigInt(n), BigInt(k) ** BigInt(n)))); return e; };
const signed = (k, t) => avg(k, (x) => Q.of(x >= t ? x : -x));
const absDiff = () => { let s = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) s += Math.abs(a - b); return Q.of(s, 36); };
const f2 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(2);
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const RS = [1, 2, 3, 4, 5];
const DIFFS = [0, 1, 2, 3, 4, 5].map((d) => (d === 0 ? 6 : 2 * (6 - d))); // ordered pairs with |X − Y| = d
const COST = 1; // a reroll that costs $1: continuing is worth mean − cost
const costly = avg(6, (x) => (Q.of(x).cmp(mean(6).sub(Q.of(COST))) >= 0 ? Q.of(x) : mean(6).sub(Q.of(COST))));

export default {
  id: 'bto/dice-games-ev',
  book: 'bto',
  kind: 'family',
  family: 'dice-games-ev',
  title: 'Dice games: expected value and when to reroll',
  summary: `Fair price = E[payoff]. E[f(X)] is not f(E[X]). With a reroll, keep a roll exactly when it beats the value of rerolling: ${[1, 2, 3].map((r) => f2(V(6, r))).join(' → ')}.`,
  prerequisites: ['prob/expectation-linearity', 'bto/expected-extremes'],
  objectives: [
    'Price any payoff on one die as Σ payoff(x)/k, including signed and squared payoffs',
    'Explain why E[X²] > (E[X])², and use E[XY] = E[X]·E[Y] for independent dice',
    'Solve reroll games backwards: keep a roll exactly when it is at least the value of continuing',
    `Tell the one-reroll value ${V(6, 2)} from the maximum of two rolls ${maxOf(6, 2)}`,
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you roll a fair die and are paid its face in dollars. You may reroll once, but then you must accept the second roll. With the best strategy, what is the game worth? Try two approaches.', answer: `${V(6, 2)} = ${f2(V(6, 2))}`, explain: `If you answered 3.5 you ignored the option; if ${f3(maxOf(6, 2))} you took the better of two rolls, but a reroll cannot be undone. Keep 4, 5, 6 and reroll 1, 2, 3: the lesson shows why that cut-off is exactly the value of rerolling.` },
    { type: 'text', text: 'A game pays money depending on dice, and the question asks for its **fair price**, its **expected profit**, or its value **with the best strategy** when you may reroll or stop. Payoffs can be the face, its square, a product of two dice, or a win/lose rule.' },
    { type: 'list', items: ['"You are paid the square of a die roll. What is the fair price?"', '"You roll a die: 4 or more wins that many dollars, otherwise you lose that many. Expected profit?"', '"You may reroll up to twice and keep the last roll. Value with optimal play?"'] },
    { type: 'text', text: 'Not this lesson: a stopping game where the deck changes as you draw (bto/card-stopping), and the expected maximum of rolls you all keep (bto/expected-extremes).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Paid the product of two dice: fair price', 'Three dice: expected highest face', 'Red and black cards, stop any time: game value', 'Two dice: probability the product is even'], answer: 0, traps: { 1: 'no choice and no payoff function: bto/expected-extremes', 2: 'the deck changes as you draw: bto/card-stopping', 3: 'a probability, not a price' }, explain: 'A payoff on dice, priced by its expectation.' },
    ] },

    S('why'),
    { type: 'text', text: '"What would you pay to play?" is the trader\'s basic question, and the answer is the expected payoff. Two ideas decide these items. First, averaging and a non-linear payoff do not commute, so the "plug in 3.5" shortcut is wrong for squares and absolute values. Second, an option to reroll or stop has value, and you compute it backwards from the last decision.' },

    S('anchor'),
    { type: 'text', text: 'You know the average roll: (1 + 2 + … + 6)/6 = 3.5. A dice game is that with **one change**: average the **payoff** f(x) instead of the face x. Where you have a choice, average the better of your options. So every item here is the same two moves: list the payoff for each face, then average, taking the larger branch wherever a decision is allowed.' },
    { type: 'check', scope: 'average the payoff', questions: [
      { make: (rng) => { const k = rng.pick([6, 8, 10, 12]); return { type: 'number', q: `A fair ${k}-sided die pays its face in dollars. Fair price?`, answer: mean(k).toNumber(), explain: `(1 + … + ${k})/${k} = (${k} + 1)/2 = ${f2(mean(k))}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Pay the square of the face. Plot the six payoffs: they are not evenly spaced, and the big ones pull the average up.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Payoff x² for each face', xLabel: 'face', yLabel: 'dollars', categories: faces(6).map(String), series: [{ name: 'x²', values: faces(6).map((x) => x * x) }], valueLabels: true }, caption: `Average payoff (1 + 4 + 9 + 16 + 25 + 36)/6 = ${sq(6)} ≈ ${f2(sq(6))}. Squaring the average roll gives only 3.5² = ${f2(mean(6).mul(mean(6)))}. The gap, ${sq(6).sub(mean(6).mul(mean(6)))}, is the variance of one die.` },
    { type: 'check', scope: 'E[X²] against E[X]²', questions: [
      { make: (rng) => { const k = rng.pick([4, 6, 8, 10, 12]); const v = sq(k); return mc(rng, `A fair ${k}-sided die pays the square of its face. Fair price?`, v.toString(), [[mean(k).mul(mean(k)).toString(), 'squared the average roll: E[X²] is not E[X]²'], [mean(k).toString(), 'used the plain average'], [Q.of(1 + k * k, 2).toString(), 'averaged the smallest and largest payoffs'], [Q.of(k * k, 3).toString(), 'used the continuous formula k²/3']], `(1² + … + ${k}²)/${k} = (${k} + 1)(2·${k} + 1)/6 = ${v}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'Now a reroll. After your first roll x you choose: keep x, or reroll and take whatever comes, which is worth 3.5 on average. Plot both choices against x. The value of the game is the higher of the two lines at each face, averaged over the six faces.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 6, label: 'first roll x' }, y: { min: 0, max: 6, label: 'value' }, curves: [{ label: 'keep: x', points: faces(6).map((x) => [x, x]) }, { label: 'reroll: 3.5', points: [[1, 3.5], [6, 3.5]] }], vlines: [{ x: 3.5, label: 'cut-off 3.5' }] }, caption: `Take the higher line. Below 3.5 the reroll is better (faces 1, 2, 3); above it keep (4, 5, 6). Value = (3 × 3.5 + 4 + 5 + 6)/6 = ${V(6, 2)} = ${f2(V(6, 2))}.` },
    { type: 'check', scope: 'keep iff the roll beats rerolling', questions: [
      { make: (rng) => { const k = rng.pick([4, 8, 10, 12]); const c = mean(k); return mc(rng, `A fair ${k}-sided die, one reroll allowed (the reroll must be kept). Which first rolls should you keep?`, `${keepSet(k, c)[0]} or more`, [[`${k} only`, 'keeping only the top face throws away good rolls'], [`${keepSet(k, c)[0] + 1} or more`, `rerolled ${keepSet(k, c)[0]}, which beats the reroll value ${c}`], [`${keepSet(k, c)[0] - 1} or more`, `kept ${keepSet(k, c)[0] - 1}, which is below the reroll value ${c}`], ['every roll', 'ignored the option']], `A reroll is worth ${c}; keep anything at least that.`); } },
    ] },
    { type: 'text', text: 'Each extra reroll raises the value of continuing, which raises the cut-off, which raises the value again. The gains shrink fast.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Value of the game with r rolls allowed (fair die)', xLabel: 'rolls allowed', yLabel: 'value', categories: RS.map(String), series: [{ name: 'value', values: RS.map((r) => Number(V(6, r).toNumber().toFixed(3))) }], valueLabels: true }, caption: `One roll ${V(6, 1)}, two ${V(6, 2)}, three ${V(6, 3)}, four ${V(6, 4)}. The cut-off for the first roll with three rolls allowed is ${f2(V(6, 2))}: keep only 5 and 6.` },
    { type: 'check', scope: 'values grow with rerolls', questions: [
      { type: 'choice', q: 'Fair die, up to two rerolls. Which first rolls should you keep?', options: ['5 and 6', '4, 5 and 6', '6 only', 'any roll above 3.5'], answer: 0, traps: { 1: `continuing is now worth ${V(6, 2)}, more than 4`, 2: `5 beats the continuation value ${V(6, 2)}`, 3: 'that cut-off belongs to the last reroll, not the first' }, explain: `With two rolls left the future is worth ${V(6, 2)} = ${f2(V(6, 2))}: keep 5 and 6.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Fair price = expected payoff = Σ payoff(x) × P(x). Signs count: a loss is a negative payoff.', why: 'Over many plays the average profit per game converges to this number, so paying it breaks even.',
        checks: [
          { make: (rng) => { const k = rng.pick([6, 8, 10]); const t = rng.int(Math.ceil(k / 3), Math.ceil((2 * k) / 3)); const v = signed(k, t); return mc(rng, `A fair ${k}-sided die. ${t} or more: win that many dollars; below ${t}: lose that many. Expected profit?`, v.toString(), [['0', 'assumed wins and losses cancel'], [Q.of(k - t + 1, k).mul(mean(k)).toString(), 'forgot the losing faces cost money'], [v.neg().toString(), 'swapped the winning and losing faces'], [Q.of(k - t + 1, k).sub(Q.of(t - 1, k)).toString(), 'used P(win) − P(lose), ignoring amounts']], `Signed sum over faces / ${k} = ${v} ≈ ${f3(v)}.`); } },
        ] },
      { say: 'Non-linear payoffs: E[f(X)] is not f(E[X]). For squares, E[X²] = (k + 1)(2k + 1)/6, larger than ((k + 1)/2)².', why: 'Squaring stretches big values more than small ones, so the average of squares beats the square of the average. The difference is the variance.',
        checks: [
          { make: (rng) => { const k = rng.pick([4, 6, 8]); return { type: 'number', q: `A fair ${k}-sided die. E[X²] − (E[X])² = ? (Decimals are fine.)`, answer: sq(k).sub(mean(k).mul(mean(k))).toNumber(), tolerance: 0.001, hints: [`E[X²] = ${sq(k)}.`, `(E[X])² = ${mean(k).mul(mean(k))}.`], explain: `${sq(k)} − ${mean(k).mul(mean(k))} = ${sq(k).sub(mean(k).mul(mean(k)))}: the variance.` }; } },
        ] },
      { say: `Two independent dice: E[XY] = E[X]·E[Y] = 3.5² = ${f2(mean(6).mul(mean(6)))}. But |X − Y| is not linear: tabulate it.`, why: 'Independence lets the product factor. The absolute value destroys the cancellation that makes E[X − Y] = 0.',
        checks: [
          { type: 'choice', q: 'Two fair dice pay the absolute difference of the faces. Fair price?', options: [absDiff().toString(), '0', '5/2', '7/2'], answer: 0, traps: { 1: 'E[X − Y] = 0, but the absolute value removes the cancellation', 2: 'treated differences 0 to 5 as equally likely', 3: 'used one die' }, explain: `Counts of differences 0..5: ${DIFFS.join(', ')}. Σ d × count = ${absDiff().mul(Q.of(36))}, so ${absDiff()} ≈ ${f3(absDiff())}.` },
        ] },
      { say: 'Reroll games go backwards. On the last roll you must accept, so it is worth its mean (k + 1)/2. One roll earlier, keep x exactly when x is at least that mean.', why: 'Each decision compares a sure amount (the roll in hand) with an expectation (the value of continuing).',
        checks: [
          { make: (rng) => { const k = rng.pick([4, 6, 8, 12]); return mc(rng, `A fair ${k}-sided die, one reroll. The value of rerolling is:`, mean(k).toString(), [[String(k), 'assumed the reroll hits the top face'], [V(k, 2).toString(), 'used the value of the whole game, which includes the first roll\'s choice'], [Q.of(k, 2).toString(), 'forgot the faces start at 1']], `A forced roll is worth its mean ${mean(k)}.`); } },
        ] },
      { say: 'The value with the option is E[max(X, value of continuing)]. With more rerolls repeat: V₁ = mean, V_(r+1) = E[max(X, V_r)].', why: 'Averaging over the first roll with the keep-or-reroll rule applied gives the value; the recursion adds one decision per reroll.',
        checks: [
          { make: (rng) => { const k = rng.pick([4, 6, 8]), r = rng.int(2, 3); const v = V(k, r); return mc(rng, `A fair ${k}-sided die with ${r - 1} reroll${r > 2 ? 's' : ''} (keep the last roll). Value with optimal play?`, v.toString(), [[mean(k).toString(), 'ignored the option'], [maxOf(k, r).toString(), `took the best of ${r} rolls: a reroll cannot be undone`], [String(k), 'assumed optimal play reaches the top face'], ...(r === 3 ? [[V(k, 2).toString(), 'stopped the recursion one reroll early']] : [])], `V₁ = ${mean(k)}${r === 3 ? `, V₂ = ${V(k, 2)}` : ''}, V${r === 3 ? '₃' : '₂'} = ${v} ≈ ${f3(v)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: `In your own words: why is one reroll of a die worth ${V(6, 2)} and not ${maxOf(6, 2)}, the expected maximum of two rolls?`, model: 'With a reroll you decide before seeing the second roll, and once you reroll you must accept it. So you compare your first roll with the average of a fresh roll, 3.5, and keep 4, 5, 6. The maximum of two rolls would let you keep the better one after seeing both, which is more information and therefore worth more.', points: ['a reroll must be accepted: you cannot go back', 'the decision compares the roll in hand with 3.5, the value of a fresh roll', 'seeing both rolls first (the maximum) is worth more'] },

    S('worked'),
    { type: 'worked', family: 'dice-games-ev', section: 'bto', difficulty: 2, seed: 'b', intro: 'A squared payoff. Try it before opening the solution.' },
    { type: 'worked', family: 'dice-games-ev', section: 'bto', difficulty: 4, seed: 'c', fade: 1, intro: 'Two rerolls. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: `With unlimited free rerolls (keep the last), what is the game worth? And with one reroll that costs $${COST}?`, answer: `Unlimited: 6, since you simply reroll until a six. A $${COST} reroll nets ${mean(6).sub(Q.of(COST))}, so keep ${keepSet(6, mean(6).sub(Q.of(COST)))[0]} or more: value ${costly} ≈ ${f2(costly)}, below the free-reroll ${V(6, 2)}.`, explain: 'A cost lowers the value of continuing, which lowers the cut-off.' },

    S('traps'),
    { type: 'traps', family: 'dice-games-ev', section: 'bto', extra: [
      { belief: 'E[X²] = (E[X])².', fix: `Average the payoffs, not the rolls: ${sq(6)}, not ${f2(mean(6).mul(mean(6)))}.` },
      { belief: 'With a reroll you get the better of two rolls.', fix: `You must accept the reroll, so the value is ${V(6, 2)}, below ${maxOf(6, 2)}.` },
      { belief: 'Keep only high rolls, like 5 or 6, on every roll.', fix: 'The cut-off is the value of continuing, which depends on how many rerolls are left.' },
    ] },
    { type: 'erroneous', problem: 'A candidate values a fair die with up to two rerolls (keep the last roll). One step is wrong.', steps: [
      `The last roll is worth ${mean(6)}.`,
      `With one reroll left, keep 4, 5, 6: value ${V(6, 2)}.`,
      'With two rerolls left, keep 4, 5, 6 again, because they beat 3.5.',
      `Value = (3 × ${V(6, 2)} + 4 + 5 + 6)/6 = ${Q.of(3).mul(V(6, 2)).add(Q.of(15)).div(Q.of(6))}.`,
    ], errorStep: 2, explain: `With two rerolls left the future is worth ${V(6, 2)}, not 3.5, so 4 must be rerolled. Keep 5 and 6: value (4 × ${V(6, 2)} + 5 + 6)/6 = ${V(6, 3)} ≈ ${f3(V(6, 3))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `A die pays the square of its face. A candidate prices it at ${f2(mean(6).mul(mean(6)))}. Which belief?`, options: ['Squared the average roll', 'Averaged the extremes', 'Used the reroll value'], answer: 0, explain: `3.5² = ${f2(mean(6).mul(mean(6)))}. The fair price is E[X²] = ${sq(6)} ≈ ${f2(sq(6))}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Values to know for a fair die: rolls allowed 1, 2, 3, 4 → ${[1, 2, 3, 4].map((r) => V(6, r).toString()).join(', ')}. E[X²] = ${sq(6)}, E[XY] = ${mean(6).mul(mean(6))}, E|X − Y| = ${absDiff()}. Each one is a free point.` },
    { type: 'callout', tone: 'speed', text: `Backward induction is short: write the value of continuing, list the faces at or above it, average. Two lines per reroll, about 30 of your ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'check', scope: 'values to know', questions: [
      { make: (rng) => { const r = rng.int(1, 3); return { type: 'number', q: `Fair die, ${r} roll${r > 1 ? 's' : ''} allowed in total, keep the last. Value? (Decimals are fine.)`, answer: V(6, r).toNumber(), tolerance: 0.005, explain: `${V(6, r)} ≈ ${f3(V(6, r))}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Price = E[payoff], never payoff(E[X]). Option to reroll or stop → go backwards: keep iff the sure amount ≥ the value of continuing.' },

    S('contrast'),
    { type: 'compare', columns: ['Game (fair die)', 'You see', 'Value'], rows: [
      ['one roll', 'one roll', mean(6).toString()],
      ['one reroll, must accept it', 'the first roll only', V(6, 2).toString()],
      ['best of two rolls', 'both rolls', `${maxOf(6, 2)} ≈ ${f3(maxOf(6, 2))}`],
      ['two rerolls', 'one roll at a time', `${V(6, 3)} ≈ ${f3(V(6, 3))}`],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a payoff that is linear in the face (a + bx) is priced at a + b × 3.5 with no table. A reroll that costs more than the gain is never used, and the value falls back to 3.5.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: stopping on a deck of red and black cards is the same backward rule with a changing deck (bto/card-stopping). Zap-N\'s Balloon game is an optimal-stopping problem, and every "would you pay X to play" interview question is this lesson.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Rank the values: best of two rolls, one reroll, one roll.', options: ['best of two > one reroll > one roll', 'one reroll > best of two > one roll', 'best of two = one reroll > one roll', 'one roll > one reroll > best of two'], answer: 0, traps: { 1: 'seeing both rolls is more information than deciding blind', 2: 'they differ: the reroll must be accepted', 3: 'options never lower the value' }, explain: `${f3(maxOf(6, 2))} > ${f3(V(6, 2))} > ${f3(mean(6))}.` },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'dice-games-ev', section: 'bto', count: 3 },
  ],
};
