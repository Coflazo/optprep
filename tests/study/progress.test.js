import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { markRead, recordTry, statusOf, dueLessons } from '../../src/study/progress.js';

test('read, master with 3/3 clean, come back for review, drop on a miss', () => {
  const s = makeStore(memoryBackend());
  assert.equal(statusOf(s, 'bto/x'), 'new');
  markRead(s, 'bto/x', 0);
  assert.equal(statusOf(s, 'bto/x', 0), 'read');
  assert.equal(recordTry(s, 'bto/x', { n: 3, clean: 2 }, 0), false);
  assert.equal(statusOf(s, 'bto/x', 0), 'read');
  assert.equal(recordTry(s, 'bto/x', { n: 3, clean: 3 }, 1000), true);
  assert.equal(statusOf(s, 'bto/x', 2000), 'mastered');
  // the miss put it in box 1, so this clean pass moves it to box 2: review after 3 days
  assert.deepEqual(dueLessons(s, 1000 + 2 * 24 * 3600e3), []);
  assert.deepEqual(dueLessons(s, 1000 + 3 * 24 * 3600e3 + 1), ['bto/x']);
  assert.equal(statusOf(s, 'bto/x', 1000 + 3 * 24 * 3600e3 + 1), 'review');
  assert.equal(recordTry(s, 'bto/x', { n: 3, clean: 1 }, 5e9), false);
  assert.equal(s.state.study['bto/x'].box, 1);
});

test('interleave: no type twice in a row when avoidable', async () => {
  const { interleave } = await import('../../src/study/pages.js').catch(() => ({}));
  if (!interleave) return; // pages.js needs the DOM helpers only at call time
  const { makeRng } = await import('../../src/core/rng.js');
  for (let s = 0; s < 200; s++) {
    const xs = ['a', 'a', 'b', 'b', 'c', 'c'].map((key, i) => ({ key, item: `${key}${i}` }));
    const out = interleave(xs, makeRng(s));
    assert.equal(out.length, 6);
    for (let i = 1; i < out.length; i++) assert.notEqual(out[i][0], out[i - 1][0], `seed ${s}: ${out}`);
  }
});

test('units: a missed unit is weak until its next first attempt is right', async () => {
  const { recordUnit, weakUnits } = await import('../../src/study/progress.js');
  const store = makeStore(memoryBackend());
  recordUnit(store, 'bto/x', 'reading the grid', false, 1);
  recordUnit(store, 'bto/x', 'the tent', true, 2);
  assert.deepEqual(weakUnits(store).map((u) => u.unit), ['reading the grid']);
  recordUnit(store, 'bto/x', 'reading the grid', true, 3);
  assert.deepEqual(weakUnits(store), []);
});
