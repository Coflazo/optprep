import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';

test('same seed gives the same stream', () => {
  const a = makeRng(42), b = makeRng(42);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
});

test('string seeds work and differ from each other', () => {
  assert.notEqual(makeRng('x').next(), makeRng('y').next());
  assert.equal(makeRng('abc').next(), makeRng('abc').next());
});

test('int is inclusive and in range', () => {
  const r = makeRng(1);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = r.int(3, 7);
    assert.ok(v >= 3 && v <= 7 && Number.isInteger(v));
    seen.add(v);
  }
  assert.equal(seen.size, 5);
});

test('shuffle is a permutation and pick returns a member', () => {
  const r = makeRng(9);
  const arr = [1, 2, 3, 4, 5, 6];
  const s = r.shuffle(arr);
  assert.deepEqual([...s].sort(), arr);
  assert.deepEqual(arr, [1, 2, 3, 4, 5, 6], 'shuffle does not mutate');
  assert.ok(arr.includes(r.pick(arr)));
});

test('fork gives an independent reproducible child', () => {
  const a = makeRng(5).fork('child'), b = makeRng(5).fork('child');
  assert.equal(a.next(), b.next());
});
