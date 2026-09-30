import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Q } from '../../src/core/rational.js';
import { solveLinear, hittingTimes, stationary, absorptionProbs } from '../../src/core/markov.js';

const q = (n, d = 1) => Q.of(n, d);

test('solveLinear solves a 2x2 system exactly', () => {
  // x + y = 3, x - y = 1  -> x = 2, y = 1
  const x = solveLinear([[q(1), q(1)], [q(1), q(-1)]], [q(3), q(1)]);
  assert.ok(x[0].eq(q(2)) && x[1].eq(q(1)));
});

test('random walk on a hexagon: expected return time is 6', () => {
  const n = 6;
  const P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) =>
    (j === (i + 1) % n || j === (i + n - 1) % n) ? q(1, 2) : q(0)));
  const h = hittingTimes(P, [0]);
  // return time = 1 + average hitting time from the two neighbours
  const ret = q(1).add(h[1].add(h[5]).mul(q(1, 2)));
  assert.ok(ret.eq(q(6)), ret.toString());
  // hitting time from the opposite vertex of a 6-cycle is 3*3 = 9
  assert.ok(h[3].eq(q(9)));
});

test('stationary distribution of a two-state chain', () => {
  const P = [[q(1, 2), q(1, 2)], [q(1, 4), q(3, 4)]];
  const pi = stationary(P);
  assert.ok(pi[0].eq(q(1, 3)) && pi[1].eq(q(2, 3)));
});

test('gambler ruin absorption probability', () => {
  // states 0..4, fair coin, absorbing at 0 and 4, start 1 -> P(hit 4) = 1/4
  const n = 5;
  const P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    if (i === 0 || i === n - 1) return j === i ? q(1) : q(0);
    return (j === i - 1 || j === i + 1) ? q(1, 2) : q(0);
  }));
  const a = absorptionProbs(P, [0, 4], 4);
  assert.ok(a[1].eq(q(1, 4)));
});
