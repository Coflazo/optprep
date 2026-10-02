// Zap-N game lesson: Skyscraper (a Tower of London planning task). Optima come from the engine's
// breadth-first search (src/zapn/skyscraper/engine.js); every count below is computed here.
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { LEVELS, legalMoves, applyMove, optimalMoves, optimalPath, bfs, generateLevel } from '../../../zapn/skyscraper/engine.js';
import { sec, mc } from './balloon.js';

const LET = 'ABCDEF';
const desc = (s) => s.map((t, i) => `tower ${i + 1}: ${t.length ? t.map((b) => LET[b]).join(' ') : 'empty'}`).join(' · ');
const shared = (a, b) => { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; return k; };
const bound = (s, t) => s.flat().length - s.reduce((n, x, i) => n + shared(x, t[i]), 0);
const mv = (s, [f, t]) => `${LET[s[f][s[f].length - 1]]} from ${f + 1} to ${t + 1}`;
const TARGET = ZAPN_TARGETS.skyscraper.value;

// The challenge: reverse a two-block tower in place.
const CH = { caps: [3, 3, 3], start: [[0, 1], [], []], target: [[1, 0], [], []] };
CH.opt = optimalMoves(CH.start, CH.target, CH.caps); CH.lb = bound(CH.start, CH.target); CH.path = optimalPath(CH.start, CH.target, CH.caps);
// The worked level: one park.
const W = { caps: [4, 3, 2], start: [[2, 1, 0, 3], [], []], target: [[0], [1, 2], [3]] };
W.opt = optimalMoves(W.start, W.target, W.caps); W.lb = bound(W.start, W.target); W.path = optimalPath(W.start, W.target, W.caps);
W.states = W.path.reduce((acc, m) => [...acc, applyMove(acc[acc.length - 1], m)], [W.start]);
const layers = (() => { const h = []; for (const d of bfs(W.start, W.caps).dist.values()) h[d] = (h[d] || 0) + 1; return h; })();
const total = layers.reduce((a, b) => a + b, 0);
// The prediction: move a three-block tower, same order, to another tower.
const PR = { caps: [3, 3, 3], start: [[0, 1, 2], [], []], target: [[], [0, 1, 2], []] };
PR.opt = optimalMoves(PR.start, PR.target, PR.caps); PR.lb = bound(PR.start, PR.target);

// The think-aloud level.
const TA = { caps: [4, 3, 2], start: [[2, 1, 3], [0], []], target: [[1], [3, 2], [0]] };
TA.opt = optimalMoves(TA.start, TA.target, TA.caps); TA.lb = bound(TA.start, TA.target); TA.path = optimalPath(TA.start, TA.target, TA.caps);
TA.states = TA.path.reduce((acc, m) => [...acc, applyMove(acc[acc.length - 1], m)], [TA.start]);
const TAm = (i) => mv(TA.states[i], TA.path[i]);
// Variation rows: one change to the challenge each.
const V = {
  otherTower: optimalMoves(CH.start, [[], [1, 0], []], CH.caps),
  sameOrder: optimalMoves(CH.start, [[], [0, 1], []], CH.caps),
  tightCaps: optimalMoves(CH.start, CH.target, [3, 1, 1]),
  relabel: optimalMoves([[2, 3], [], []], [[3, 2], [], []], CH.caps),
  fusion: optimalMoves(CH.start, [[], [0, 1], []], [3, 3, 1]),
};
const small = (rng) => generateLevel(rng, LEVELS[rng.int(0, 4)]);
const levelText = (L) => `Caps ${L.caps.join(', ')}. Start (bottom to top): ${desc(L.start)}. Target: ${desc(L.target)}.`;
const firstMoveQ = (rng) => {
  for (;;) {
    const L = generateLevel(rng, LEVELS[rng.int(2, 5)]);
    const scored = legalMoves(L.start, L.caps).map((m) => ({ m, extra: optimalMoves(applyMove(L.start, m), L.target, L.caps) + 1 - L.opt }));
    const best = scored.filter((x) => x.extra === 0);
    if (best.length !== 1 || scored.length < 3) continue;
    return mc({ q: `${levelText(L)} The minimum is ${L.opt} moves. Which first move starts a minimum solution?`, right: mv(L.start, best[0].m),
      wrong: scored.filter((x) => x.extra > 0).slice(0, 4).map((x) => [mv(L.start, x.m), `after this move the target is still ${L.opt - 1 + x.extra} moves away: a move that does not shorten the remaining plan costs ${x.extra} extra`]),
      explain: `${mv(L.start, best[0].m)} is the only move after which the target is ${L.opt - 1} moves away.` }, rng);
  }
};

export default {
  id: 'zapn/skyscraper',
  book: 'zapn',
  kind: 'game',
  game: 'skyscraper',
  title: 'Skyscraper: plan the whole move list',
  summary: 'Count the blocks that must move, add one for every block that must be parked, and place bottom-up.',
  prerequisites: [],
  objectives: [
    'Read a level as three stacks and list the legal moves in seconds',
    'Compute the lower bound: blocks outside the shared bottom stacks each move at least once',
    'Find the blocks that must be parked, so minimum = lower bound + parking moves',
    `Hit the target: on average at most ${TARGET} moves above the minimum per level`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. Three towers, each with room for 3 blocks. Tower 1 holds A with B on top; towers 2 and 3 are empty. Only the top block of a tower can move, onto another tower with room. Rebuild tower 1 as B with A on top. What is the fewest number of moves?`, answer: `${CH.opt} moves.`, explain: `Both blocks must leave tower 1 before B can sit at the bottom, and both must come back: B to 2, A to 3, B to 1, A to 1. If you said 2 or 3, you counted each block once; the lesson shows where the extra moves come from.`,
      attempts: [
        { id: 'once', label: 'Count each misplaced block once', approach: 'Counted the two blocks that are out of place and answered 2.', breaksAt: 'A block that must step aside before its home is ready moves twice, so that count is only a floor.' },
        { id: 'greedy', label: 'Send blocks straight home', approach: 'Moved each top block to its final tower as soon as that was possible.', breaksAt: 'A block placed early can cover a spot that a lower block still needs.' },
        { id: 'nearest', label: 'Park on the nearest free tower', approach: 'Put every block that had to step aside on whichever tower was free.', breaksAt: 'A block parked on a future base has to move again.' },
      ] },
    { type: 'text', text: 'Skyscraper is the planning game of Zap-N. Three towers hold lettered, coloured blocks; each tower has a height cap. Only the **top** block of a tower moves, and only onto a tower that still has room. You rebuild a target picture in as few moves as possible, over 10 levels from 3 blocks (2 moves) to 6 blocks (9 moves).' },
    { type: 'check', scope: 'the rules', questions: [
      mc({ q: 'Tower 1 holds A, B, C (C on top), tower 2 holds D, tower 3 is empty. Which blocks can move right now?', right: 'C and D', at: 2,
        wrong: [['only C', 'every tower has its own top block: D is the top of tower 2'], ['A, B, C and D', 'only the top block of a tower moves'], ['C only onto tower 3', 'C can also go onto D: tower 2 has room']],
        explain: 'Each non-empty tower offers exactly one movable block, its top: C on tower 1 and D on tower 2.' }),
    ] },
    { type: 'text', text: `Scoring is moves above the minimum, averaged over the levels. Target: at most ${TARGET}. Your planning pause before the first move is recorded separately, so thinking is cheap and wasted moves are not. A reset puts the blocks back but the moves still count.` },
    { type: 'check', scope: 'the score', questions: [
      mc({ q: 'You plan for 20 seconds, then solve a 6-move level in 6 moves. Another candidate starts at once and solves it in 8. Who scores better on this level?', right: 'you: 0 extra moves against 2', at: 0,
        wrong: [['the other candidate: faster start', 'planning time is recorded separately; the score is moves above the minimum'], ['equal: both solved it', 'solving is not enough; every extra move counts']],
        explain: 'The score is moves above the minimum. A long plan that saves moves is a good trade.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'A trader who fires the first order and hopes pays for every correction. Skyscraper measures whether you build the whole sequence in your head, count it, and only then act. The same habit wins NumberBox and every multi-step Orderbooks trade: plan, count, execute without stopping.' },

    sec('anchor'),
    { type: 'text', text: 'You know Tower of Hanoi: move a stack one disk at a time, a disk never on a smaller one. Skyscraper is Hanoi with **one change**: no size rule, but every tower has a height cap and the target can be any arrangement. What carries over is the key constraint: only the top moves, so whatever sits on a block must leave before that block can.' },
    { type: 'check', scope: 'only the top moves', questions: [
      { make: (rng) => { const L = small(rng); const n = legalMoves(L.start, L.caps).length; return { type: 'number', q: `Caps ${L.caps.join(', ')}. Start (bottom to top): ${desc(L.start)}. How many legal moves are there right now?`, answer: n, hints: ['Each non-empty tower has one movable block: its top.', 'Each top block can go to either other tower if it has room.'], explain: `${legalMoves(L.start, L.caps).map((m) => mv(L.start, m)).join('; ')}: ${n} moves.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'Draw each arrangement as three stacks, bottom to top. Here is the challenge solved in the minimum, one frame per move. Both blocks leave tower 1 and come back: each of them is **parked** once.' },
    { type: 'diagram', diagram: 'zapn-tower', spec: { caps: CH.caps, start: CH.start, target: CH.target, path: CH.path, frames: true, opt: CH.opt, bound: CH.lb }, caption: `The challenge in ${CH.opt} moves. The lower bound says ${CH.lb} (two blocks are out of place), but each must step aside first, so each moves twice.` },
    { type: 'check', scope: 'reading the frames', questions: [
      mc({ q: 'In the frames above, how many times does each block move?', right: 'twice each', at: 1,
        wrong: [['once each', 'counted only the moves that land a block on its final spot'], ['A twice, B once', 'B also has to step aside so that it can come back to the bottom'], ['three times each', 'counted frames instead of moves']],
        explain: `${CH.opt} moves, two per block: out of the way, then home.` }),
    ] },
    { type: 'text', text: `The minimum is a search result. From the start, list every arrangement one move away, then every arrangement two moves away, and so on (breadth-first search). The first layer that contains the target gives the minimum. For the level worked below there are ${total} reachable arrangements; the target first appears at distance ${W.opt}.` },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Arrangements by distance from the start', xLabel: 'moves from the start', yLabel: 'arrangements', categories: layers.map((_, d) => String(d)), series: [{ name: 'arrangements', values: layers }], valueLabels: true }, caption: `Breadth-first layers for the worked level (4 blocks, caps 4, 3, 2). The target sits in layer ${W.opt}, among ${layers[W.opt]} arrangements: no plan can be shorter, and a random walk would wander among ${total}.` },
    { type: 'check', scope: 'breadth-first layers', questions: [
      mc({ q: `Breadth-first search first finds the target in layer ${W.opt}. Can a ${W.opt - 1}-move solution exist?`, right: 'no', at: 1,
        wrong: [['yes, with a cleverer order', `every arrangement reachable in ${W.opt - 1} moves is in layers 0 to ${W.opt - 1}, and the target is not there`], ['only if a block is parked', 'parking adds moves; it never shortens a solution']],
        explain: `Layers 0 to ${W.opt - 1} hold every arrangement reachable in at most ${W.opt - 1} moves, and none is the target.` }),
      { type: 'number', q: 'From the bar chart: how many arrangements are exactly one move from the start?', answer: layers[1], explain: `Layer 1 has ${layers[1]}: one per legal first move.` },
    ] },

    sec('derivation'),
    { type: 'text', text: 'You cannot run a breadth-first search on 6 blocks in your head. You can get the same number from two counts.' },
    { type: 'steps', steps: [
      { say: 'Compare each start tower with its target tower from the bottom up. The matching bottom blocks form the **shared bottom stack**; they never need to move.', why: 'A block in the shared bottom stack is already on its final base with everything under it final. Moving it could only cost moves.',
        checks: [{ make: (rng) => { const L = small(rng); const sh = L.start.reduce((n, x, i) => n + shared(x, L.target[i]), 0); return { type: 'number', q: `${levelText(L)} How many blocks are in shared bottom stacks?`, answer: sh, hints: ['Tower by tower, compare start and target from the bottom.', 'Stop counting a tower at its first mismatch.'], explain: `Matches from the bottom, tower by tower: ${L.start.map((x, i) => shared(x, L.target[i])).join(' + ')} = ${sh}.` }; } }] },
      { say: '**Lower bound**: every other block must move at least once. Lower bound = blocks − blocks in shared bottom stacks.', why: 'A block outside the shared stack is either in the wrong place, or sits on a block that must move, which it has to leave first.',
        checks: [{ make: (rng) => { const L = small(rng); return { type: 'number', q: `${levelText(L)} What is the lower bound on the number of moves?`, answer: bound(L.start, L.target), hints: ['Count the shared bottom blocks first.', `There are ${L.blocks} blocks; subtract the shared ones.`], explain: `${L.blocks} blocks − ${L.blocks - bound(L.start, L.target)} shared = ${bound(L.start, L.target)}.` }; } }] },
      { answers: 'once', say: 'A block whose final spot is not ready when it must leave has to be **parked**: it moves once out of the way and once home. Each park adds one move.', why: 'The minimum counts one move per block that must move, plus one for every extra move. Extra moves are exactly the parks.',
        checks: [mc({ q: `The challenge (A B into B A) has lower bound ${CH.lb} and minimum ${CH.opt}. How many parking moves does it need?`, right: String(CH.opt - CH.lb), at: 1, wrong: [['0', 'assumed the lower bound is always reachable'], ['1', 'only parked the top block; B must also step aside before it can be the bottom'], ['4', 'counted every move as a park']], explain: `${CH.opt} − ${CH.lb} = ${CH.opt - CH.lb}: both blocks park once.` })] },
      { answers: 'greedy', say: 'Plan **bottom-up**: the first block to place is a target bottom block. Clear whatever covers it and whatever occupies its destination.', why: 'A block can only land on its final base, and the base must be final first. Bottom blocks carry the first constraints.',
        checks: [mc({ q: `Worked level: start ${desc(W.start)}; target ${desc(W.target)}. Which block can go straight home first?`, right: 'D, to tower 3', at: 0,
          wrong: [['A, to tower 1', 'A belongs at the bottom of tower 1, which is still occupied by C and B'], ['C, to tower 2', 'C belongs on top of B in tower 2, and B is not there yet'], ['B, to tower 2', 'B is buried under A and D']],
          explain: 'D is the top of tower 1 and its home, the bottom of tower 3, is empty: it goes home in one move.' })] },
      { answers: 'nearest', say: 'Park on the tower you will need **last**, never on a spot a later placement needs.', why: 'A parked block that sits on a future base must be moved again: one more wasted move.',
        checks: [mc({ q: 'In the worked level after D goes home, A must leave tower 1 before B and C can go to tower 2. Where should A park?', right: 'on D, in tower 3', at: 0,
          wrong: [['on tower 2', 'tower 2 needs B at its bottom next: A would have to move again'], ['nowhere: A should go home first', "A's home is the bottom of tower 1, still under C and B"]],
          explain: 'Tower 3 is finished with D and has room for one more; A waits there and then goes straight home.' })] },
    ] },
    { type: 'explain', prompt: 'Why is "blocks outside the shared bottom stacks" a lower bound but not always the answer?', model: 'Each such block must move at least once, so no solution can use fewer moves. But a block may have to leave its tower before its final spot is ready; then it moves out of the way and later home, which costs a second move. The minimum is the lower bound plus those parking moves.', points: ['Every block outside the shared stack moves at least once', 'A block that must leave before its home is ready is parked', 'Each park adds exactly one extra move'] },

    sec('worked'),
    { type: 'text', text: `The level from the bar chart: caps 4, 3, 2. Lower bound ${W.lb} (no shared bottom blocks), minimum ${W.opt}: one park.` },
    { type: 'diagram', diagram: 'zapn-tower', spec: { caps: W.caps, start: W.start, target: W.target, opt: W.opt, bound: W.lb }, caption: 'Start and target. Read the target from the bottom: A alone on 1, B then C on 2, D alone on 3.' },
    { type: 'steps', steps: [
      { say: `Count: 4 blocks, no tower shares a bottom block, so the lower bound is ${W.lb}.`, why: "Tower 1 starts with C at the bottom but the target's bottom is A; towers 2 and 3 start empty.",
        checks: [{ type: 'number', q: 'Lower bound for this level?', answer: W.lb, explain: `4 − 0 shared = ${W.lb}.` }] },
      { say: `Move 1: ${mv(W.states[0], W.path[0])}. D goes straight home to the bottom of tower 3.`, why: 'D is on top and its home is empty: a move that is already final.',
        checks: [{ type: 'number', q: 'After move 1, how many blocks are on their final spot?', answer: 1, explain: 'Only D.' }] },
      { say: `Move 2: ${mv(W.states[1], W.path[1])}. A parks on D.`, why: "A's home is the bottom of tower 1, under C and B. Tower 2 is needed next for B, so A parks on the finished tower.",
        checks: [mc({ q: 'Why does A not park on tower 2?', right: 'B must be placed at the bottom of tower 2 next', at: 0, wrong: [['tower 2 is already full up to its height cap', 'tower 2 is empty with cap 3'], ['a block may not move twice in one level', 'blocks may move any number of times; each move just counts']], explain: 'Parking on a future base forces another move.' })] },
      { say: `Moves 3 and 4: ${mv(W.states[2], W.path[2])}, then ${mv(W.states[3], W.path[3])}. Tower 2 is built bottom-up.`, why: 'B and C now come off tower 1 in exactly the order tower 2 needs them.',
        checks: [{ type: 'number', q: 'After move 4, which tower is empty? (1, 2 or 3)', answer: 1, explain: 'C, B and A have all left tower 1 (A is parked on 3).' }] },
      { say: `Move 5: ${mv(W.states[4], W.path[4])}. Total ${W.opt} = lower bound ${W.lb} + 1 park.`, why: 'A returns home to the now-empty tower 1. Every block moved once except A, which moved twice.',
        checks: [{ type: 'number', q: 'How many moves above the lower bound did this level need?', answer: W.opt - W.lb, explain: `${W.opt} − ${W.lb} = ${W.opt - W.lb}: A's park.` }] },
    ] },
    { type: 'diagram', diagram: 'zapn-tower', spec: { caps: W.caps, start: W.start, target: W.target, path: W.path, frames: true, opt: W.opt }, caption: 'The five frames. Only A moves twice; everything else goes straight home.' },
    { type: 'check', scope: 'the five frames', questions: [
      { type: 'choice', q: 'In the five frames, which block moves twice?', options: ['A, parked once', 'every block', 'none of them'], answer: 0, traps: { 1: 'only one park is needed: 4 blocks in 5 moves', 2: '5 moves for 4 blocks means one moves twice' }, explain: 'Lower bound 4 plus one park: A steps aside once, then goes home.' },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Caps 3, 3, 3. Tower 1 holds A, B, C (A at the bottom). Move the whole tower to tower 2 in the same order. Minimum moves?', answer: `${PR.opt}: the lower bound is ${PR.lb}, and B and C must both be parked.`, explain: 'A must reach the bottom of tower 2 first, so C and B have to leave tower 1 and must not land on tower 2: both park on tower 3 (C, then B on C), then A, B, C go home.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Move each block straight to its final tower whenever you can.', fix: 'A block placed too early can bury a block that belongs under it. Place bottom-up.' },
      { belief: 'A block on the right tower at the right height can stay.', fix: 'Only if everything below it is final too. A missing block underneath forces it to move.' },
      { belief: 'Park on the nearest free tower.', fix: 'Park on the tower you will need last; parking on a future base costs another move.' },
      { belief: 'A long pause before the first move costs points.', fix: 'Planning time is recorded separately; only moves above the minimum are scored.' },
      { belief: 'Reset wipes out a bad start.', fix: 'The blocks go back, but the moves already made still count.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out the minimum for the challenge (tower 1: A then B; target tower 1: B then A). One step is wrong.', steps: [
      'No bottom block matches (A is at the bottom now, B must be), so neither block is in a shared stack.',
      'So the lower bound is 2 moves.',
      'Each of the two blocks moves exactly once.',
      'So the minimum is 2 moves.',
    ], errorStep: 2, explain: `The lower bound is only a floor. B cannot go home while A is under it, and A cannot go home until B is at the bottom: both must be parked, so each moves twice and the minimum is ${CH.opt}.` },
    { type: 'check', scope: 'choosing the first move', questions: [{ make: firstMoveQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'The 3-second count: per tower, count matching blocks from the bottom; lower bound = blocks − matches. Then ask of each block that must leave early: "is my home ready?" Each "no" is one park.' },
    { type: 'check', scope: 'the lower-bound count', questions: [
      { make: (rng) => { const L = generateLevel(rng, LEVELS[rng.int(5, 8)]); return { type: 'number', q: `${levelText(L)} Lower bound on the moves?`, answer: bound(L.start, L.target), hints: ['Count matching blocks from the bottom of each tower.', `Subtract them from ${L.blocks}.`], explain: `${L.blocks} − ${L.blocks - bound(L.start, L.target)} = ${bound(L.start, L.target)}. (The minimum here is ${L.opt}.)` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Say the whole move list before touching anything ("D to 3, A to 3, B to 2, C to 2, A to 1"), check its length against lower bound + parks, then execute without stopping. The pause is free; a mid-level rethink usually costs a move.' },
    { type: 'thinkaloud', problem: `Caps ${TA.caps.join(', ')}. Start: ${desc(TA.start)}. Target: ${desc(TA.target)}. Plan it before the first move.`, lines: [
      { t: 0, say: `Target bottoms first: tower 1 needs B, tower 2 needs D, tower 3 needs A. No start tower shares a bottom block, so the lower bound is ${TA.lb}.` },
      { t: 5, say: `A is on top of tower 2 and its home, the bottom of tower 3, is empty: ${TAm(0)}.` },
      { t: 8, say: `D is now the top of tower 1 and the bottom of tower 2 is free: ${TAm(1)}.` },
      { t: 11, say: 'B must leave tower 1 before C can. Park it on tower 2, which has room.', slip: true },
      { t: 14, say: `No: C belongs on D in tower 2, so B there would block it. Tower 3 is finished with A: ${TAm(2)}.` },
      { t: 18, say: `Then ${TAm(3)} and ${TAm(4)}. That is ${TA.opt} moves: lower bound ${TA.lb} plus one park. The count matches, so I move without stopping.` },
    ] },
    { type: 'check', scope: 'the think-aloud and the second tip', questions: [
      { type: 'choice', q: 'When do you say the whole move list?', options: ['before touching any block', 'after the first two moves', 'only if you get stuck'], answer: 0, traps: { 1: 'a mid-level rethink usually costs a move', 2: 'the pause is free; planning late is not' }, explain: 'Plan the whole list, check its length against lower bound + parks, then move without stopping.' },
      { type: 'choice', q: 'In the think-aloud, the first idea parked B on tower 2. What was wrong?', options: ['C belongs on D in tower 2', 'tower 2 had no room for B', 'B could not move yet'], answer: 0, traps: { 1: 'tower 2 had room', 2: 'B was the top of tower 1 by then' }, explain: 'B on tower 2 would block C. Tower 3 was finished with A, so B parks there.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Skyscraper: lower bound = blocks outside the shared bottom stacks; minimum = lower bound + parks. Place bottom-up, park on the tower needed last, say the whole list, then move.' },

    sec('contrast'),
    { type: 'compare', columns: ['Puzzle', 'Constraint', 'Minimum'], rows: [
      ['Tower of Hanoi (n disks)', 'never a disk on a smaller one', '2^{n} − 1 moves, always'],
      ['Skyscraper', 'only tops move; height caps', 'lower bound + parks (breadth-first search is exact)'],
      ['NumberBox', 'each number used once', 'not a move count: search backwards from the target'],
    ] },
    { type: 'variation', base: `The challenge: caps 3, 3, 3, tower 1 holds A then B; rebuild tower 1 as B then A. Minimum ${CH.opt} moves.`, rows: [
      { change: 'Build B then A on tower 2 instead of tower 1', effect: `${V.otherTower} moves: deal B, then A, straight onto the empty tower. The target base is free, so nobody parks.` },
      { change: 'Keep the order (A then B) but on tower 2', effect: `${V.sameOrder} moves: B must step aside so A can reach the bottom of tower 2 first; one park.` },
      { fusion: true, change: 'Keep the order (A then B) on tower 2, and tower 3 holds only one block', effect: `${V.fusion} moves: the order decides that B parks once; the cap of 1 still leaves room for that one park, so it costs nothing extra.` },
      { same: true, change: 'Caps 3, 1, 1 instead of 3, 3, 3', effect: `Still ${V.tightCaps}: each parked block needs only one slot, so the tighter caps cost nothing here.` },
      { same: true, change: 'Blocks C and D instead of A and B', effect: `Still ${V.relabel}: only positions matter, never which letters or colours the blocks carry.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a cap of 1 or 2 limits where you can park, which can force an extra park. A level can have zero parks (minimum = lower bound): then every move goes straight home, bottom-up. Every generated level is reachable and has a search-verified minimum.' },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const n = rng.int(3, 6); return { type: 'number', q: `Tower of Hanoi with ${n} disks: minimum number of moves?`, answer: 2 ** n - 1, explain: `2^{${n}} − 1 = ${2 ** n - 1}.` }; } },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a lower bound plus the unavoidable extras is how you estimate any minimum quickly, and breadth-first search is the shortest path in any puzzle where every move costs the same. NumberBox uses the same planning discipline: work out the full route before the first keystroke.' },
    { type: 'transfer',
      near: { make: (rng) => { const L = generateLevel(rng, LEVELS[rng.int(1, 4)]); return { type: 'number', q: `${levelText(L)} Minimum number of moves?`, answer: L.opt, hints: [`Lower bound first: ${L.blocks} blocks minus the shared bottom blocks.`, 'Add one for every block that must step aside before its home is ready.'], explain: `Lower bound ${bound(L.start, L.target)}, plus ${L.opt - bound(L.start, L.target)} park${L.opt - bound(L.start, L.target) === 1 ? '' : 's'}: ${L.opt}.` }; } },
      far: { make: (rng) => { const n = rng.int(4, 8), k = rng.int(1, 3); return { type: 'number', q: `A crane must move ${n} containers, none of them on its final spot. ${k} of them sit on a spot that has to be filled first, so each of those must be set down in a buffer area before going to its own spot. Each lift moves one container once. Fewest lifts?`, answer: n + k, hints: ['Every container needs at least one lift.', 'The ones that wait in the buffer need a second lift.'], explain: `${n} lifts for the containers plus ${k} for the detours: ${n + k}.` }; } },
      principle: mc({ q: 'Which idea carried over from Skyscraper to the crane?', right: 'one move per item that must move, plus one per forced detour', at: 0,
        wrong: [['one move per item that is out of place, and nothing more', 'forgets the items that must wait somewhere else first'], ['the 2^{n} − 1 count from the Tower of Hanoi formula', 'that count comes from the Hanoi size rule, which neither puzzle has'], ['try moves until the target appears, then count them', 'no plan: extra moves are exactly what gets scored']],
        explain: 'Lower bound (every item that must move) plus the forced parks gives the minimum in both.' }),
    },

    sec('tryit'),
    { type: 'tryit', game: 'skyscraper' },
  ],
};
