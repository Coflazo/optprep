import { test } from 'node:test';
import assert from 'node:assert/strict';
import { factorial, nCr, nPr, derangements } from '../../src/core/combinatorics.js';

test('factorial and binomials', () => {
  assert.equal(factorial(5), 120n);
  assert.equal(nCr(52, 5), 2598960n);
  assert.equal(nCr(5, 0), 1n);
  assert.equal(nCr(5, 6), 0n);
  assert.equal(nPr(5, 2), 20n);
});

test('derangements', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(derangements), [1n, 0n, 1n, 2n, 9n, 44n]);
});
