import { test } from 'node:test';
import assert from 'node:assert/strict';
import { superscripts } from '../../src/core/format.js';

test('caret exponents print as superscripts; grouped or mixed exponents stay as written', () => {
  assert.equal(superscripts('C(6,1)/2^6 and 2^10'), 'C(6,1)/2⁶ and 2¹⁰');
  assert.equal(superscripts('1 − (n + 1)/2^n, n^k'), '1 − (n + 1)/2ⁿ, nᵏ');
  assert.equal(superscripts('2^(n-1) and e^kt'), '2^(n-1) and e^kt');
  assert.equal(superscripts(undefined), undefined);
});

import { prose } from '../../src/core/format.js';

test('a count of one takes the singular; algebra, decimals and larger counts stay as written', () => {
  assert.equal(prose('What is the probability of exactly 1 heads?'), 'What is the probability of exactly 1 head?');
  assert.equal(prose('1 tails then a head: (1/2)^2.'), '1 tail then a head: (1/2)².');
  assert.equal(prose('Each of the other 1 throws must match'), 'Each of the other 1 throw must match');
  assert.equal(prose('a run of k − 1 heads; the full 2k − 1 games'), 'a run of k − 1 heads; the full 2k − 1 games');
  assert.equal(prose('0.1 steps, 11 steps, 21 heads'), '0.1 steps, 11 steps, 21 heads');
});
