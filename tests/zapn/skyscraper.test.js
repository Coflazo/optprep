import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/skyscraper/index.js';
import { createEngine, LEVELS, bfs, keyOf, legalMoves, applyMove, optimalMoves, optimalPath, generateLevel } from '../../src/zapn/skyscraper/engine.js';

const C3 = [3, 3, 3];

test('skyscraper: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'skyscraper');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.skyscraper.metric);
});

test('skyscraper: BFS optimum on small known cases', () => {
  // A = 0, B = 1, C = 2. Towers are bottom to top.
  assert.equal(optimalMoves([[0, 1], [], []], [[0, 1], [], []], C3), 0);
  assert.equal(optimalMoves([[0, 1], [], []], [[0], [1], []], C3), 1);
  // Reverse a two-block tower in place: both must leave and come back.
  assert.equal(optimalMoves([[0, 1], [], []], [[1, 0], [], []], C3), 4);
  // Reverse a two-block tower onto an empty tower: deal the top, then the bottom, onto it.
  assert.equal(optimalMoves([[0, 1], [], []], [[], [1, 0], []], C3), 2);
  // Same tower, same order, other tower: the top must be parked, so 3.
  assert.equal(optimalMoves([[0, 1], [], []], [[], [0, 1], []], C3), 3);
  // A full three-block reversal into another tower is a straight deal: 3 moves.
  assert.equal(optimalMoves([[0, 1, 2], [], []], [[], [2, 1, 0], []], C3), 3);
  // Caps matter: with cap 1 on the middle tower the in-place swap is still 4, never less.
  assert.equal(optimalMoves([[0, 1], [], []], [[1, 0], [], []], [2, 1, 1]), 4);
  // Unreachable when caps forbid it.
  assert.equal(optimalMoves([[0, 1], [], []], [[], [0, 1], []], [2, 1, 1]), Infinity);
});

test('skyscraper: optimalPath replays legally to the target in the optimal count', () => {
  const start = [[0, 1, 2], [3], []], target = [[3, 2], [], [1, 0]], caps = [4, 4, 4];
  const path = optimalPath(start, target, caps);
  assert.equal(path.length, optimalMoves(start, target, caps));
  let cur = start;
  for (const m of path) {
    assert.ok(legalMoves(cur, caps).some(([f, t]) => f === m[0] && t === m[1]));
    cur = applyMove(cur, m);
  }
  assert.equal(keyOf(cur), keyOf(target));
});

test('skyscraper: 10 levels, every generated level solvable at exactly the reported optimum', () => {
  assert.equal(LEVELS.length, 10);
  for (let s = 0; s < 6; s++) {
    const e = createEngine(makeRng(`lvl${s}`));
    e.state.levels.forEach((L, i) => {
      assert.equal(L.opt, LEVELS[i].opt);
      assert.equal(L.start.flat().length, LEVELS[i].blocks);
      L.start.forEach((t, k) => assert.ok(t.length <= L.caps[k]));
      L.target.forEach((t, k) => assert.ok(t.length <= L.caps[k]));
      // Independent direction: moves are reversible, so search back from the target.
      assert.equal(bfs(L.target, L.caps).dist.get(keyOf(L.start)), L.opt, `seed ${s} level ${i + 1}`);
    });
  }
});

test('skyscraper: same seed gives the same levels', () => {
  assert.deepEqual(createEngine(makeRng('x')).state.levels, createEngine(makeRng('x')).state.levels);
});

function playAll(e, detourOnLevel = -1) {
  let t = 1000;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    const L = e.state.levels[e.state.level];
    t += 3000; // think before the first move
    if (e.state.level === detourOnLevel) {
      const [f, to] = legalMoves(e.state.towers, L.caps)[0];
      e.act({ type: 'move', from: f, to }, t); e.act({ type: 'move', from: to, to: f }, t += 500);
    }
    for (const [f, to] of optimalPath(e.state.towers, L.target, L.caps)) e.act({ type: 'move', from: f, to }, t += 500);
    e.act({ type: 'next' }, t += 800);
  }
}

test('skyscraper: optimal play scores 0 moves over; a detour adds exactly 2', () => {
  const a = createEngine(makeRng('play'));
  playAll(a);
  const ra = a.result();
  assert.equal(ra.metric, 'movesOver');
  assert.equal(ra.value, 0);
  assert.equal(ra.score, 100);
  assert.equal(ra.detail.completed, 10);
  assert.ok(ra.detail.levels.every((r) => r.planMs === 3500));
  const b = createEngine(makeRng('play'));
  playAll(b, 4);
  assert.equal(b.result().value, 2 / 10);
  assert.equal(b.result().detail.levels[4].over, 2);
});

test('skyscraper: illegal moves are rejected and not counted', () => {
  const e = createEngine(makeRng('bad'));
  e.act({ type: 'start' }, 0);
  const empty = e.state.towers.findIndex((t) => t.length === 0);
  const src = empty >= 0 ? empty : 0;
  if (empty >= 0) assert.deepEqual(e.act({ type: 'move', from: src, to: (src + 1) % 3 }, 10), { ok: false });
  assert.deepEqual(e.act({ type: 'move', from: 0, to: 0 }, 20), { ok: false });
  assert.equal(e.state.moves, 0);
  assert.equal(e.state.firstMoveAt, null);
});

test('skyscraper: at least 300 distinct solvable levels with a verified optimum', () => {
  // Levels 1-9 (3 to 5 blocks) over 34 seeds; the 6-block level is verified in the test above.
  const seen = new Set();
  for (let s = 0; s < 34; s++) {
    const rng = makeRng(`vol${s}`);
    for (const spec of LEVELS.slice(0, 9)) {
      const L = generateLevel(rng, spec);
      assert.equal(bfs(L.target, L.caps, L.opt).dist.get(keyOf(L.start)), L.opt);
      seen.add(`${L.caps}:${keyOf(L.start)}>${keyOf(L.target)}`);
    }
  }
  assert.ok(seen.size >= 300, `only ${seen.size} distinct levels`);
});
