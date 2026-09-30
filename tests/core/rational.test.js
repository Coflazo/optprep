import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Q } from '../../src/core/rational.js';

test('normalises sign and gcd', () => {
  assert.equal(Q.of(2, -4).toString(), '-1/2');
  assert.equal(Q.of(6, 3).toString(), '2');
});

test('arithmetic is exact', () => {
  const x = Q.of(1, 3).add(Q.of(1, 6));
  assert.ok(x.eq(Q.of(1, 2)));
  assert.ok(Q.of(2, 3).mul(Q.of(3, 4)).eq(Q.of(1, 2)));
  assert.ok(Q.of(1, 2).div(Q.of(1, 4)).eq(Q.of(2)));
  assert.ok(Q.of(1).sub(Q.of(5, 6)).eq(Q.of(1, 6)));
  assert.equal(Q.of(1, 3).cmp(Q.of(1, 2)), -1);
});

test('toNumber and from', () => {
  assert.equal(Q.of(1, 4).toNumber(), 0.25);
  assert.ok(Q.from(3).eq(Q.of(3, 1)));
  assert.ok(Q.from(Q.of(1, 2)).eq(Q.of(1, 2)));
});

test('division by zero throws', () => {
  assert.throws(() => Q.of(1, 0));
  assert.throws(() => Q.of(1).div(Q.of(0)));
});
