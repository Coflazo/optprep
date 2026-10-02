import { test } from 'node:test';
import assert from 'node:assert/strict';
import { superscripts } from '../../src/core/format.js';

test('caret exponents print as superscripts; grouped or mixed exponents stay as written', () => {
  assert.equal(superscripts('C(6,1)/2^6 and 2^10'), 'C(6,1)/2⁶ and 2¹⁰');
  assert.equal(superscripts('1 − (n + 1)/2^n, n^k'), '1 − (n + 1)/2ⁿ, nᵏ');
  assert.equal(superscripts('2^(n-1) and e^kt'), '2^(n-1) and e^kt');
  assert.equal(superscripts(undefined), undefined);
});
