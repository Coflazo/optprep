// Dice duels: P(A > B) for different dice, sums, best-of-two, and non-transitive dice.
import { mcqItem, agree, q } from '../lib.js';

const ID = 'dice-duel';
const EFRON = { A: [4, 4, 4, 4, 0, 0], B: [3, 3, 3, 3, 3, 3], C: [6, 6, 2, 2, 2, 2], D: [5, 5, 5, 1, 1, 1] };
const faces = (k) => Array.from({ length: k }, (_, i) => i + 1);

// Distribution of one "player's roll" as [value, weight] pairs (weights are equal-probability counts).
function dist(spec) {
  if (spec.type === 'die') return faces(spec.k).map((x) => [x, 1]);
  if (spec.type === 'custom') return spec.faces.map((x) => [x, 1]);
  const out = [];
  for (const a of faces(6)) for (const b of faces(6)) out.push([spec.type === 'sum2' ? a + b : Math.max(a, b), 1]);
  return out;
}
function beats(A, B) {
  const da = dist(A), db = dist(B);
  let win = 0, tie = 0, tot = 0;
  for (const [x, wa] of da) for (const [y, wb] of db) { tot += wa * wb; if (x > y) win += wa * wb; if (x === y) tie += wa * wb; }
  return { win: q(win, tot), tie: q(tie, tot) };
}
const name = (s) => (s.type === 'die' ? (s.k === 6 ? 'one fair die' : `one fair ${s.k}-sided die`) : s.type === 'sum2' ? 'two dice and adds them' : s.type === 'max2' ? 'two dice and keeps the higher' : `a die with faces ${s.faces.join(', ')}`);

export default {
  id: ID,
  section: 'bto',
  title: 'Dice duels',
  skill: 'P(A > B) = (1 − P(tie))/2 for identical players; otherwise count the favourable pairs',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    let A, B, reroll = false;
    if (difficulty === 2) {
      const pair = rng.pick(['same6', 'sizes', 'reroll']);
      if (pair === 'same6') { A = { type: 'die', k: 6 }; B = { type: 'die', k: 6 }; }
      else if (pair === 'reroll') { A = { type: 'die', k: rng.pick([6, 8, 10]) }; B = { ...A }; reroll = true; }
      else { const [a, b] = rng.pick([[8, 6], [6, 8], [10, 6], [12, 6], [6, 4], [4, 6], [20, 6], [10, 8]]); A = { type: 'die', k: a }; B = { type: 'die', k: b }; }
    } else {
      const pair = rng.pick(['sum', 'max', 'efron']);
      if (pair === 'sum') { A = { type: 'sum2' }; B = { type: 'sum2' }; }
      else if (pair === 'max') { A = { type: 'max2' }; B = { type: 'die', k: 6 }; }
      else { const [x, y] = rng.pick([['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C'], ['B', 'D']]); A = { type: 'custom', faces: EFRON[x] }; B = { type: 'custom', faces: EFRON[y] }; }
    }
    const { win, tie } = beats(A, B);
    const lose = q(1).sub(win).sub(tie);
    const v = reroll ? q(1, 2) : win;
    const same = JSON.stringify(A) === JSON.stringify(B);
    const text = reroll
      ? `You and a friend each roll ${name(A)}. Ties are rolled again until someone is strictly higher. What is the probability that you win?`
      : `You roll ${name(A).replace('two dice and adds them', 'two dice and add them').replace('two dice and keeps the higher', 'two dice and keep the higher')}; your friend rolls ${name(B)}. You win only if your result is strictly higher. What is the probability that you win?`;
    return mcqItem(ID, rng, difficulty, {
      value: v, text,
      distractors: [
        { value: reroll ? win : 0.5, misconception: reroll ? 'Ignored the rerolls and counted ties as losses. Ties are replayed, so only the non-tied rounds decide.' : 'Assumed the duel is a coin flip. Ties go against you, and the dice may not be equal.' },
        { value: win.add(tie), misconception: 'Counted ties as wins: that is P(yours ≥ theirs).' },
        { value: lose, misconception: 'Computed your friend\'s chance of winning.' },
        { value: tie, misconception: 'Computed the chance of a tie.' },
        { value: same ? q(1, 2).mul(q(1).add(tie)) : win.div(win.add(lose)), misconception: same ? 'Added half the tie probability to 1/2 instead of removing it.' : 'Discarded the ties and renormalised; ties are losses here, not replays.' },
      ],
      steps: same && !reroll && A.type !== 'custom' ? [
        { say: `P(tie) = ${tie}.`, why: 'Both players have the same distribution; add P(both show x) over x.' },
        { say: `By symmetry P(win) = P(lose), so P(win) = (1 − ${tie})/2 = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Swapping the two players maps wins to losses.' },
      ] : reroll ? [
        { say: 'Each round either decides the duel or repeats it unchanged.', why: 'A tie restarts the same situation.' },
        { say: 'Within a deciding round, you and your friend are symmetric, so P(win) = 1/2.', why: 'Condition on the round not being a tie.' },
      ] : [
        { say: `List the pairs: for each of your results x, count the friend's results below x.`, why: 'Win = strictly higher, so ties go to your friend.' },
        { say: `Wins: ${win}; ties: ${tie}; losses: ${lose}.`, why: 'These three add to 1.' },
        { say: `P(win) = ${v} ≈ ${v.toNumber().toFixed(4)}.`, why: 'Favourable over total pairs.' },
      ],
      rule: 'Identical players: P(win) = (1 − P(tie))/2. Different players: count pairs. Ties replayed → condition on a decision.',
      anchor: 'Two dice, 36 ordered pairs, with one change: the event compares the two results instead of adding them.',
      hints: ['What is the chance of a tie?', 'Are the two players symmetric?', same ? '(1 − P(tie))/2.' : 'Count, for each of your results, how many of theirs are lower.'],
      data: { A, B, reroll },
    });
  },

  // Independent check: exhaustive pair enumeration (explicit loops over raw faces).
  verify(item) {
    const { A, B, reroll } = item.params;
    const raw = (s) => {
      if (s.type === 'die') return faces(s.k);
      if (s.type === 'custom') return s.faces;
      const out = [];
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) out.push(s.type === 'sum2' ? a + b : a > b ? a : b);
      return out;
    };
    const ra = raw(A), rb = raw(B);
    let w = 0, l = 0;
    for (const x of ra) for (const y of rb) { if (x > y) w++; else if (x < y) l++; }
    return agree(item, reroll ? w / (w + l) : w / (ra.length * rb.length));
  },

  lesson: {
    purpose: 'Duels ("who rolls higher") hide two traps: ties, and dice that are not the same. Quick counting handles both.',
    anchor: 'The 36 ordered pairs of two dice, with one change: the event compares the two results.',
    steps: [
      { say: 'Compute P(tie) first.', why: 'Ties are where symmetry breaks and where "strictly higher" loses probability.' },
      { say: 'Identical players: P(win) = P(lose) = (1 − P(tie))/2.', why: 'Swapping the players swaps wins and losses.' },
      { say: 'Different players: count pairs directly, or condition on your result.', why: 'No symmetry to lean on.' },
      { say: 'If ties are replayed, only decisive rounds matter: P(win)/(P(win) + P(lose)).', why: 'A tie restarts the same duel.' },
    ],
    predict: { question: 'Two players each roll two dice and compare sums. Above or below 1/2 to win?', answer: 'Below: P(tie) = 146/1296, so P(win) = 575/1296 ≈ 0.444.' },
    edge: 'Non-transitive dice: A beats B, B beats C, C beats D and D beats A, each with probability 2/3.',
    rule: 'Same dice: (1 − P(tie))/2 (15/36 for one die each). Replayed ties: P(win)/(P(win) + P(lose)).',
    contrast: 'Ties as losses (15/36) against ties replayed (1/2).',
  },
};
