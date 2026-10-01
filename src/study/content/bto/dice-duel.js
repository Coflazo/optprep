// Dice duels: who rolls strictly higher. Ties first; symmetry for identical players; count pairs
// otherwise; replayed ties reduce to the decisive rounds. Every number shown is computed here.
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
const die = (k) => Array.from({ length: k }, (_, i) => i + 1);
const pairsOf = (f) => { const out = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) out.push(f(a, b)); return out; };
const SUM2 = pairsOf((a, b) => a + b);
const MAX2 = pairsOf((a, b) => Math.max(a, b));
// Win / tie / lose for "A strictly higher than B", every face list equally likely.
function duel(A, B) {
  let w = 0, t = 0;
  for (const x of A) for (const y of B) { if (x > y) w += 1; else if (x === y) t += 1; }
  const n = A.length * B.length;
  return { win: Q.of(w, n), tie: Q.of(t, n), lose: Q.of(n - w - t, n), w, t, n };
}
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const winsBelow = (a, b) => die(a).map((x) => Math.min(x - 1, b)); // for each of my faces, opponent faces below it
const EFRON = { A: [4, 4, 4, 4, 0, 0], B: [3, 3, 3, 3, 3, 3], C: [6, 6, 2, 2, 2, 2], D: [5, 5, 5, 1, 1, 1] };
const replay = (r) => r.win.div(r.win.add(r.lose));
const gridDuel = (a, b) => ({
  rows: a, cols: b, rowTitle: `your d${a}`, colTitle: `friend's d${b}`,
  cellText: Array.from({ length: a }, (_, r) => Array.from({ length: b }, (_, c) => (r > c ? 'W' : r === c ? 'T' : 'L'))),
  highlight: Array.from({ length: a * b }, (_, i) => [Math.floor(i / b), i % b]).filter(([r, c]) => r > c),
});
const CH = duel(die(8), die(6));
const SAME = duel(die(6), die(6));
const TK = { a: 10, b: 6, r: duel(die(10), die(6)) }; // think-aloud

export default {
  id: 'bto/dice-duel',
  book: 'bto',
  kind: 'family',
  family: 'dice-duel',
  title: 'Dice duels',
  summary: 'Identical players: P(win) = (1 − P(tie))/2. Different players: count the pairs. Ties replayed: P(win)/(P(win) + P(lose)).',
  prerequisites: ['bto/two-dice-sum', 'bto/dice-order-stats', 'bto/first-success'],
  objectives: [
    'Find P(tie) first and use symmetry: (1 − P(tie))/2 when both players roll the same way',
    'Count favourable pairs when the players differ (a d8 against a d6, the best of two against one die)',
    'Condition on a decisive round when ties are rolled again',
    'Name the three trap answers: 1/2, P(win or tie), and the opponent\'s chance',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you roll a fair 8-sided die and your friend rolls a fair 6-sided die. You win only if your number is strictly higher. What is the probability that you win? Try two approaches.', answer: `${CH.w}/${CH.n} = ${CH.win}`, explain: `For each of your faces, count your friend's faces below it: ${winsBelow(8, 6).join(' + ')} = ${CH.w} of ${CH.n} pairs. If you got ${CH.win.add(CH.tie)}, you counted ties as wins.`, attempts: [
      { id: 'ties-win', label: 'Higher or equal', approach: `Counted the pairs where your number is at least your friend's: ${CH.win.add(CH.tie)}.`, breaksAt: 'Strictly higher excludes the ties. They take probability away from you, so they must be split off first.' },
      { id: 'symmetry', label: 'Half of the non-ties', approach: `Found P(tie) = ${CH.tie} and split the rest in half: ${one.sub(CH.tie).div(Q.of(2))}.`, breaksAt: 'The half-half split needs both players to roll the same way. A d8 and a d6 are not mirror images of each other.' },
      { id: 'half-plus', label: '1/2 plus the 7s and 8s', approach: 'Took a fair 1/2 and added the chance of rolling 7 or 8, which always wins: 1/2 + 2/8.', breaksAt: 'On faces 1 to 6 the duel is not a fair 1/2: ties still happen there. Each row of the grid has to be counted.' },
    ] },
    { type: 'text', text: 'Two players each roll something (one die, two dice added, the higher of two dice, a die with unusual faces) and the higher result wins. The details that matter: whether a **tie** loses, is replayed, or is split, and whether both players roll the **same way**.' },
    { type: 'list', items: ['"You and a friend each roll a die; you win only with a strictly higher number."', '"You roll two dice and keep the higher; your friend rolls one die. P(you win)?"', '"Each rolls an 8-sided die; ties are rolled again. P(you win)?"'] },
    { type: 'text', text: 'Not this lesson: one die against a fixed target (bto/two-dice-sum style counting) and races where players take turns until a first success (bto/first-success, bto/race-to-k).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['You roll a d10, your friend two dice added: P(you are strictly higher)', 'You and a friend alternate rolling; first six wins: P(you win)', 'You roll two dice: P(the sum is at least 9)', 'You roll a die until it shows more than 4: expected rolls'], answer: 0, traps: { 1: 'a turn-taking race: bto/first-success', 2: 'a fixed target: bto/two-dice-sum', 3: 'a waiting time: bto/expected-waiting' }, explain: 'Two players, two independent rolls, the higher wins.' },
    ] },

    S('why'),
    { type: 'text', text: `Duels are a classic opener in trading interviews: "we both roll, higher wins, would you play at even odds?" The answer turns on ties. For one die each, ties take ${SAME.t}/36 of the probability away from both sides, so "strictly higher" wins only ${SAME.w}/36, not 1/2. Every wrong option in these items is one of three slips: ignoring ties, counting ties as wins, or answering for the other player. A fourth appears when the dice differ: assuming the bigger die wins "about half the time plus a bit" instead of counting.` },

    S('anchor'),
    { type: 'text', text: 'From bto/two-dice-sum: two dice give 36 equally likely ordered pairs, and you count cells. A duel is the same grid with **one change**: the event compares the two results ("mine above yours") instead of adding them. The grid, the ordered pairs and the division by the total stay exactly as they were.' },
    { type: 'check', scope: 'counting cells in the 36-grid', questions: [
      { type: 'number', q: 'You and a friend each roll one fair die. In how many of the 36 cells do you show the same number?', answer: SAME.t, explain: 'The diagonal: (1,1) to (6,6).' },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the 6 × 6 grid with your roll as the row and your friend\'s as the column. Mark W where you are strictly higher, T on the diagonal, L where you are lower. Every cell is one of the 36 equally likely pairs, so counting W cells is the whole job.' },
    { type: 'diagram', diagram: 'grid', spec: { ...gridDuel(6, 6), count: SAME.w }, caption: `The ${SAME.w} W cells sit below the diagonal and the ${SAME.w} L cells above it: a mirror image. The 6 ties take probability from both sides, so P(win) = ${SAME.win}, not 1/2.` },
    { type: 'check', scope: 'the mirror and the diagonal', questions: [
      { make: (rng) => { const k = rng.pick([4, 6, 8, 10, 12]); const r = duel(die(k), die(k)); return mc(rng, `You and a friend each roll a fair ${k}-sided die. You win only if strictly higher. P(you win)?`, r.win.toString(), [['1/2', 'ignored ties: they take probability from both sides'], [r.win.add(r.tie).toString(), 'counted ties as wins'], [Q.of(1, k).toString(), 'gave the chance of a tie'], [Q.of(k - 1, k).toString(), 'gave P(no tie)']], `P(tie) = 1/${k}, so P(win) = (1 − 1/${k})/2 = ${r.win}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'Different dice break the mirror. Here your 8-sided die meets your friend\'s 6-sided die: an 8 × 6 grid.' },
    { type: 'diagram', diagram: 'grid', spec: { ...gridDuel(8, 6), count: CH.w }, caption: `Rows 7 and 8 win outright (6 cells each); row x ≤ 6 wins x − 1 cells. Total ${winsBelow(8, 6).join(' + ')} = ${CH.w} of ${CH.n}: P(win) = ${CH.win}, ties ${CH.tie}, losses ${CH.lose}.` },
    { type: 'check', scope: 'counting a lopsided grid', questions: [
      { make: (rng) => { const [a, b] = rng.pick([[10, 6], [6, 8], [12, 6], [6, 4], [4, 6], [8, 6]]); const r = duel(die(a), die(b)); return mc(rng, `You roll a fair d${a}, your friend a fair d${b}. P(you are strictly higher)?`, r.win.toString(), [[r.win.add(r.tie).toString(), 'counted ties as wins'], [r.lose.toString(), 'computed your friend\'s chance'], ['1/2', 'assumed a fair duel'], [r.tie.toString(), 'gave the chance of a tie']], `Wins per face: ${winsBelow(a, b).join(' + ')} = ${r.w} of ${r.n}: ${r.win}.`); } },
    ] },
    { type: 'text', text: 'When ties are **rolled again**, a tie changes nothing: the duel restarts exactly as it was. Only rounds that decide something matter.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'round', children: [
      { p: SAME.win.toString(), label: 'you higher: you win', mark: true },
      { p: SAME.lose.toString(), label: 'friend higher: friend wins' },
      { p: SAME.tie.toString(), label: 'tie: same duel again' },
    ] }, total: SAME.win.toString() }, caption: `In one round you win ${SAME.win}, lose ${SAME.lose}. The tie branch copies the whole game, so the game is decided in the ratio ${SAME.win} : ${SAME.lose}: P(win) = ${replay(SAME)}.` },
    { type: 'check', scope: 'replayed ties', questions: [
      { make: (rng) => { const [a, b] = rng.pick([[8, 6], [6, 4], [10, 6], [6, 8]]); const r = duel(die(a), die(b)); const v = replay(r); return mc(rng, `You roll a d${a}, your friend a d${b}. Ties are rolled again. P(you win)?`, v.toString(), [[r.win.toString(), 'counted ties as losses: they are replayed'], ['1/2', 'the dice are different, so no symmetry'], [r.win.add(r.tie).toString(), 'counted ties as wins']], `Decisive rounds only: ${r.win} / (${r.win} + ${r.lose}) = ${v}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'A round has three outcomes: you win, tie, you lose. They add to 1. Find P(tie) first.', why: 'The tie is where "strictly higher" loses probability, and it is the easiest of the three to count: add P(both show x) over x.', answers: 'ties-win',
        checks: [
          { make: (rng) => { const r = duel(SUM2, SUM2); return rng.chance(0.5) ? { type: 'number', q: 'You and a friend each roll two dice and add them. In how many of the 36 × 36 = 1296 pairings are the totals equal?', answer: r.t, hints: ['For each total s, both players need s: ways(s)².', 'Add 1² + 2² + … + 6² + … + 1².'], explain: `Σ ways(s)² = ${r.t}: P(tie) = ${r.tie}.` } : { type: 'number', q: 'You and a friend each roll one die. P(tie) as a decimal to 3 places?', answer: Number(SAME.tie.toNumber().toFixed(3)), tolerance: 0.0015, explain: `6 of 36: ${SAME.tie} ≈ ${f3(SAME.tie)}.` }; } },
        ] },
      { say: 'Identical players: swapping the two names turns every win into a loss, so P(win) = P(lose) = (1 − P(tie))/2.', why: 'Symmetry: both players roll the same way, so any outcome and its swapped version are equally likely.', answers: 'symmetry',
        checks: [
          { make: (rng) => { const r = duel(SUM2, SUM2); return mc(rng, 'You and a friend each roll two dice and add them. You win only if strictly higher. P(you win)?', r.win.toString(), [['1/2', 'ignored ties'], [one.sub(r.tie).toString(), 'gave P(no tie)'], [r.win.add(r.tie).toString(), 'counted ties as wins'], [Q.of(1, 2).mul(one.add(r.tie)).toString(), 'added half the ties instead of removing them']], `P(tie) = ${r.tie}, so P(win) = (1 − ${r.tie})/2 = ${r.win} ≈ ${f3(r.win)}.`); } },
        ] },
      { say: 'Different players: condition on your result x and count the opponent\'s results strictly below x. Add over x, divide by all pairs.', why: 'No symmetry to lean on, but each row of the grid is a simple count. When a player rolls two dice, weight each of their results by how many of the 36 pairs produce it.', answers: 'half-plus',
        checks: [
          { make: (rng) => { const r = duel(MAX2, die(6)); return mc(rng, 'You roll two dice and keep the higher; your friend rolls one die. P(you strictly higher)?', r.win.toString(), [['1/2', 'assumed a fair duel'], [r.win.add(r.tie).toString(), 'counted ties as wins'], [r.lose.toString(), 'gave your friend\'s chance'], [SAME.win.toString(), 'ignored your second die']], `Your max is k with (2k − 1)/36; your friend is below with (k − 1)/6. Total ${r.win} ≈ ${f3(r.win)}.`); } },
        ] },
      { say: 'Ties replayed: a tie restarts the identical duel, so P(win) = P(win in a round) / (P(win in a round) + P(lose in a round)).', why: 'Condition on the first decisive round. Rounds that end in a tie carry no information about who wins.',
        checks: [
          { make: (rng) => { const k = rng.pick([6, 8, 10, 20]); return mc(rng, `You and a friend each roll a fair d${k}; ties are rolled again. P(you win)?`, '1/2', [[duel(die(k), die(k)).win.toString(), 'counted ties as losses: they are replayed'], [Q.of(1, k).toString(), 'gave the tie chance'], [Q.of(k - 1, k).toString(), 'gave P(a round is decisive)']], 'Identical players, decisive rounds only: symmetric, so 1/2.'); } },
        ] },
      { say: 'Different dice can be non-transitive: A beats B, B beats C, C beats D and D beats A, each with 2/3. "Better die" is not a ranking.', why: 'P(A beats B) compares whole distributions. It is not a property of each die on its own, so it need not be transitive.',
        checks: [
          { make: (rng) => { const [x, y] = rng.pick([['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]); const r = duel(EFRON[x], EFRON[y]); return mc(rng, `Die ${x} has faces ${EFRON[x].join(', ')}; die ${y} has ${EFRON[y].join(', ')}. P(${x} strictly beats ${y})?`, r.win.toString(), [['1/2', 'assumed no die is better'], [r.lose.toString(), 'computed the other die\'s chance'], ['1/3', 'counted faces instead of pairs']], `Count pairs: ${r.w} of ${r.n} = ${r.win}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: `In your own words: you and a friend each roll a die and the higher number wins, ties lose. Why is your chance ${SAME.w}/36 and not 1/2, and what changes if ties are rolled again?`, model: `The ${SAME.t} ties out of 36 are wins for nobody. The remaining ${36 - SAME.t} split evenly by symmetry, ${SAME.w} each, so a win is ${SAME.w}/36. If ties are replayed, a tie just restarts the same game, so only the ${36 - SAME.t} decisive outcomes matter and the answer becomes ${SAME.w}/${36 - SAME.t} = 1/2.`, points: ['ties take probability from both sides', 'identical players split the non-ties evenly', 'replayed ties: condition on a decisive round'] },

    S('worked'),
    { type: 'worked', family: 'dice-duel', section: 'bto', difficulty: 2, seed: 'e', explainAt: [1], intro: 'One die each, ties lose. Try it before opening the solution.' },
    { type: 'worked', family: 'dice-duel', section: 'bto', difficulty: 3, seed: 'a', fade: 1, intro: 'The higher of two dice against one die. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: `Both players roll two dice and add them; ties lose. Is your chance of winning above or below ${SAME.w}/36 (the one-die answer)?`, answer: `Above: ${duel(SUM2, SUM2).win} ≈ ${f3(duel(SUM2, SUM2).win)} against ${f3(SAME.win)}. Sums tie less often (${f3(duel(SUM2, SUM2).tie)} against ${f3(SAME.tie)}).`, explain: 'More possible results means fewer ties, and (1 − P(tie))/2 moves towards 1/2.' },

    S('traps'),
    { type: 'traps', family: 'dice-duel', section: 'bto', extra: [
      { belief: 'Same dice, so it is a fair 1/2 duel.', fix: 'Only if ties are replayed. If ties lose, P(win) = (1 − P(tie))/2.' },
      { belief: '"Strictly higher" includes ties.', fix: 'That is P(yours ≥ theirs). Strictly higher excludes the diagonal.' },
      { belief: 'If A beats B and B beats C, then A beats C.', fix: 'Not for dice: non-transitive sets exist, each beating the next with 2/3.' },
    ] },
    { type: 'erroneous', problem: 'You and a friend each roll a fair die; ties are rolled again. A candidate works out P(you win). One step is wrong.', steps: [
      `In one round: win ${SAME.win}, tie ${SAME.tie}, lose ${SAME.lose}.`,
      'A tie leads to another round.',
      `A tie is not a win, so P(win) = ${SAME.win}.`,
      `Answer ${SAME.win} ≈ ${f3(SAME.win)}.`,
    ], errorStep: 2, explain: `A replayed tie is not a loss either: it restarts the same duel. Only decisive rounds count: ${SAME.win} / (${SAME.win} + ${SAME.lose}) = ${replay(SAME)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'One die each, ties lose. A candidate answers 7/12. Which belief?', options: ['Counted ties as wins', 'Ignored ties: took 1/2', 'Gave the friend\'s chance'], answer: 0, traps: { 1: 'ignoring ties gives 1/2, not 7/12', 2: `the friend's chance is ${SAME.lose}` }, explain: `7/12 = 21/36 = wins plus ties. Strictly higher: ${SAME.win}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Same dice: say "(1 − P(tie))/2" before anything else. P(tie) for one k-sided die each is 1/k; for two-dice sums it is ${duel(SUM2, SUM2).tie}. That is the whole computation.` },
    { type: 'callout', tone: 'speed', text: `Different dice: sum the rows "faces below x" (for a d8 against a d6: ${winsBelow(8, 6).join(', ')}). Sanity check: win + tie + lose must be 1. Budget 30 of the ${SECTIONS.bto.exam.perItemSeconds} seconds.` },
    { type: 'thinkaloud', problem: `You roll a fair d${TK.a}, your friend a fair d${TK.b}. The higher number wins and ties are rolled again. What is the probability that you win?`, lines: [
      { t: 0, say: 'Two players, higher wins, ties replayed: a duel. Count one round, then keep only decisive rounds.' },
      { t: 4, say: `Same kind of duel, so (1 − P(tie))/2...`, slip: true },
      { t: 7, say: 'No: the dice differ, so there is no symmetry. Count the rows: friend\'s faces below each of mine.' },
      { t: 13, say: `Rows: ${winsBelow(TK.a, TK.b).join(' + ')} = ${TK.r.w} wins of ${TK.r.n}; ties ${TK.r.t}; losses ${TK.r.n - TK.r.w - TK.r.t}.` },
      { t: 22, say: `Ties replayed: ${TK.r.w}/(${TK.r.w} + ${TK.r.n - TK.r.w - TK.r.t}) = ${replay(TK.r)} ≈ ${f3(replay(TK.r))}.` },
      { t: 27, say: `Sanity: above the one-round ${f3(TK.r.win)}, as replays should push the favourite up. Answer ${replay(TK.r)}, ${SECTIONS.bto.exam.perItemSeconds - 27} seconds left.` },
    ] },
    { type: 'check', scope: 'the tie shortcut', questions: [
      { make: (rng) => { const k = rng.pick([4, 8, 10, 12, 20]); return { type: 'number', q: `Each player rolls a fair d${k}; ties lose. P(you win), as a decimal to 3 places?`, answer: Number(((1 - 1 / k) / 2).toFixed(3)), tolerance: 0.0015, explain: `(1 − 1/${k})/2 = ${duel(die(k), die(k)).win} ≈ ${f3(duel(die(k), die(k)).win)}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Duel → find P(tie). Same dice: (1 − P(tie))/2. Different dice: count pairs. Ties replayed: win/(win + lose).' },

    S('contrast'),
    { type: 'compare', columns: ['Duel', 'Win', 'Tie', 'Win with ties replayed'], rows: [
      ['d6 against d6', SAME.win.toString(), SAME.tie.toString(), replay(SAME).toString()],
      ['d8 against d6', CH.win.toString(), CH.tie.toString(), replay(CH).toString()],
      ['two dice summed, each', duel(SUM2, SUM2).win.toString(), duel(SUM2, SUM2).tie.toString(), '1/2'],
      ['best of two against one die', duel(MAX2, die(6)).win.toString(), duel(MAX2, die(6)).tie.toString(), replay(duel(MAX2, die(6))).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: dice that can never tie (like the non-transitive pair B against C) have win + lose = 1, so replays change nothing. A player who can never be strictly higher has P(win) = 0 under any tie rule.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "replay until decisive" is the one-round ratio from turn-taking races (bto/first-success, bto/race-to-k). The same tie-first habit applies to cards (same rank ties) and to Likelihood List items that compare "higher" with "at least as high".' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Which duel gives you exactly 1/2?', options: ['you d6, friend d6, ties rolled again', 'you d6, friend d6, ties lose', 'you d8, friend d6, ties rolled again', 'you d6, friend d8, ties rolled again'], answer: 0, traps: { 1: `ties lose, so you get ${SAME.win}`, 2: `the bigger die stays ahead even with replays: ${replay(CH)}`, 3: `the smaller die stays behind: ${replay(duel(die(6), die(8)))}` }, explain: 'Identical dice and replayed ties: the decisive rounds are mirror images.' },
    ] },
    { type: 'variation', base: `You roll a d8, your friend a d6; the higher number wins and ties lose. P(you win) = ${CH.w}/${CH.n} = ${CH.win}.`, rows: [
      { change: 'Your friend rolls first, you second', effect: `No change: ${CH.win}. The rolls are independent, so the order in time does not touch the grid.`, same: true },
      { change: 'Ties are rolled again', effect: `Only decisive rounds count: ${CH.win} ÷ (${CH.win} + ${CH.lose}) = ${replay(CH)}.` },
      { change: 'Ties count as wins for you', effect: `Add the diagonal: ${CH.win} + ${CH.tie} = ${CH.win.add(CH.tie)}.` },
      { change: 'You roll a d6 as well', effect: `Identical players: (1 − 1/6)/2 = ${SAME.win}.` },
      { change: 'Both roll d8s, and ties are rolled again', effect: 'Exactly 1/2. Identical dice restore the mirror, and replays remove the ties that kept each side below 1/2.', fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const same = rng.chance(0.5); const tie = same ? Q.of(3, 51) : Q.of(1, 13); const v = one.sub(tie).div(Q.of(2)); return mc(rng, `You and a friend each draw one card ${same ? 'from the same shuffled deck' : 'from your own shuffled deck'}. The higher rank wins (ace low, king high); equal ranks lose for both. P(you win)?`, v.toString(), [['1/2', 'ignored ties'], [v.add(tie).toString(), 'counted ties as wins'], [tie.toString(), 'gave the chance of a tie'], [one.sub(tie).toString(), 'gave P(no tie)']], `P(tie) = ${tie}${same ? ' (3 cards of your rank are left among 51)' : ''}. Identical players: (1 − ${tie})/2 = ${v}.`); } },
      far: { make: (rng) => { const a = rng.int(1, 4), b = rng.int(1, 4), n = rng.int(a + b + 1, 10); const v = Q.of(a, a + b), pa = Q.of(a, n), pb = Q.of(b, n); return { type: 'number', q: `Two traders watch the same market. Each minute, trader A makes a winning trade with probability ${pa}, trader B with probability ${pb}, and otherwise nothing happens (they never both win in the same minute). The first to make a winning trade gets the bonus. P(A gets it)? (Decimals are fine.)`, answer: v.toNumber(), tolerance: 0.001, hints: ['A quiet minute is a replayed tie: it restarts the same contest.', 'Keep only the decisive minutes.'], explain: `Decisive minutes only: ${pa} ÷ (${pa} + ${pb}) = ${v} ≈ ${v.toNumber().toFixed(3)}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from dice to the cards and to the traders?', options: ['Split off ties, then count or keep decisive rounds', 'Any duel between two players is a fair 1/2 bet', 'Strictly higher includes the tied outcomes', 'Ties are losses whatever the rules say'], answer: 0, traps: { 1: 'only identical players with replayed ties give 1/2', 2: 'strictly higher excludes the diagonal', 3: 'replayed ties restart the game; they are not losses' }, explain: 'The cards are identical players with ties that lose: (1 − P(tie))/2. The quiet minutes are replayed ties: condition on the first decisive minute.' } },

    S('tryit'),
    { type: 'tryit', family: 'dice-duel', section: 'bto', count: 3 },
  ],
};
