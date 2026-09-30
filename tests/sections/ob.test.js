import { test } from 'node:test';
import assert from 'node:assert/strict';
import section from '../../src/sections/ob/index.js';
import { familySuite, volumeSuite, bankSuite, itemKey } from '../helpers/harness.js';
import { makeRng } from '../../src/core/rng.js';
import { positionOutcome, checkItem } from '../../src/core/check.js';
import { solve, bruteForceBest, decomposable } from '../../src/sections/ob/solver.js';

for (const f of section.families) familySuite('ob', f);
volumeSuite('ob', section.families, { min: 500 });
bankSuite('ob', section.bank, { min: 45 });

// Orderbook prompts share one text, so distinctness is judged on the board itself.
const boardKey = (it) => JSON.stringify(it.board);

test('ob: every family contributes at least 15 distinct boards over 400 seeds', () => {
  const all = new Set();
  for (const f of section.families) {
    const keys = new Set();
    for (let s = 0; s < 400; s++) { const it = f.generate(makeRng(`div:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] }); keys.add(boardKey(it)); all.add(boardKey(it)); }
    assert.ok(keys.size >= 15, `${f.id}: only ${keys.size} distinct boards`);
  }
  assert.ok(all.size >= 500, `only ${all.size} distinct boards`);
});

test('ob: best equals the solver result, is accepted by the checker, and prices sit on 0.5 ticks', () => {
  for (const f of section.families) {
    for (let s = 0; s < 25; s++) {
      const it = f.generate(makeRng(`ob-best:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] });
      const r = solve(it.board, 6);
      assert.deepEqual(it.best, { trades: r.trades, profit: r.profit });
      assert.deepEqual(checkItem(it, { trades: it.best.trades }).correct, true);
      for (const i of it.board.instruments) for (const p of [i.bid, i.ask]) assert.ok(Number.isInteger(p * 2), `${f.id}: price ${p} off tick`);
      assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params);
      assert.ok(it.params.structure);
    }
  }
});

test('ob bank: the written trades are flat, indecomposable and as profitable as the exhaustive best', () => {
  for (const it of section.bank) {
    const out = positionOutcome(it.board, it.best.trades);
    assert.ok(out.flat && out.profit > 0, it.id);
    const q = it.board.instruments.map((ins) => it.best.trades.filter((t) => t.id === ins.id).reduce((s, t) => s + (t.side === 'buy' ? 1 : -1), 0));
    assert.ok(!decomposable(it.board, q), `${it.id}: written package splits into two`);
    assert.equal(solve(it.board, 6).profit, it.best.profit, `${it.id}: solver finds a better package`);
    assert.equal(bruteForceBest(it.board, 6).profit, it.best.profit, `${it.id}: brute force disagrees`);
  }
});

test('ob solver: small known boards', () => {
  const b = { products: ['A', 'B'], instruments: [
    { id: 'A', name: 'A', legs: [1, 0], bid: 40, ask: 40.5 },
    { id: 'B', name: 'B', legs: [0, 1], bid: 60, ask: 60.5 },
    { id: 'AB', name: 'A + B', legs: [1, 1], bid: 101.5, ask: 102 },
  ] };
  const r = solve(b, 6);
  assert.equal(r.profit, 0.5);
  assert.deepEqual(r.position, [1, 1, -1], 'one package, not three copies of it');
  const none = { ...b, instruments: b.instruments.map((i) => (i.id === 'AB' ? { ...i, bid: 100.5, ask: 101.5 } : i)) };
  assert.equal(solve(none, 6), null, 'fair quotes admit no arbitrage');
  assert.equal(bruteForceBest(none, 6), null);
});

test('ob solver: decomposable positions are recognised', () => {
  const b = { products: ['A'], instruments: [{ id: 'X', legs: [1] }, { id: 'Y', legs: [1] }, { id: 'Z', legs: [1] }] };
  assert.equal(decomposable(b, [2, -2, 0]), true, 'two copies of a pair');
  assert.equal(decomposable(b, [1, -1, 0]), false);
  assert.equal(decomposable(b, [1, 1, -2]), true, 'X + Y − 2Z splits into (X − Z) + (Y − Z)');
  const c = { products: ['A', 'B'], instruments: [{ id: 'W', legs: [2, 1] }, { id: 'A', legs: [1, 0] }, { id: 'B', legs: [0, 1] }] };
  assert.equal(decomposable(c, [-1, 2, 1]), false, 'a weighted package is one piece');
});

test('ob solver: agrees with the brute force on random boards', () => {
  const rng = makeRng('ob-random');
  for (let k = 0; k < 60; k++) {
    const P = ['A', 'B', 'C'].slice(0, rng.int(1, 3));
    const fair = P.map(() => rng.int(20, 60));
    const instruments = Array.from({ length: rng.int(2, 5) }, (_, i) => {
      const legs = P.map(() => rng.int(-1, 2));
      if (legs.every((x) => x === 0)) legs[0] = 1;
      const f = legs.reduce((s, q, j) => s + q * fair[j], 0) + rng.pick([-2, -1, 0, 0, 1, 2]);
      const h = rng.pick([0.5, 1]);
      return { id: `I${i}`, name: `I${i}`, legs, bid: f - h, ask: f + h };
    });
    const board = { products: P, instruments };
    const a = solve(board, 5), b = bruteForceBest(board, 5);
    assert.equal(a?.profit ?? null, b?.profit ?? null, JSON.stringify(board));
  }
});
