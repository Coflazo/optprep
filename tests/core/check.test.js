import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkItem, intervalScore, netScore, positionOutcome } from '../../src/core/check.js';

test('mcq: +1 correct, -1 wrong, 0 skip', () => {
  const item = { kind: 'mcq', answerIndex: 2 };
  assert.deepEqual(checkItem(item, { choice: 2 }), { correct: true, score: 1 });
  assert.deepEqual(checkItem(item, { choice: 0 }), { correct: false, score: -1 });
  assert.deepEqual(checkItem(item, { skip: true }), { correct: false, score: 0, skipped: true });
  assert.equal(netScore([1, -1, 1, 0, 1]), 2);
});

test('rank: exact order only, no partial credit', () => {
  const item = { kind: 'rank', answerOrder: [2, 0, 1] };
  assert.equal(checkItem(item, { order: [2, 0, 1] }).score, 1);
  assert.equal(checkItem(item, { order: [2, 1, 0] }).score, 0);
});

test('interval: L/U when truth inside inclusive, else 0; L=0 scores 0', () => {
  assert.equal(intervalScore(30, 60, 42), 0.5);
  assert.equal(intervalScore(40, 50, 42), 0.8);
  assert.equal(intervalScore(43, 50, 42), 0);
  assert.equal(intervalScore(42, 42, 42), 1);
  assert.equal(intervalScore(0, 10, 5), 0);
  assert.equal(intervalScore(50, 40, 45), 0, 'reversed bounds are invalid');
  const item = { kind: 'interval', truth: 42 };
  assert.deepEqual(checkItem(item, { lower: 40, upper: 50 }), { correct: true, score: 0.8 });
});

test('orderbook: flat position with positive profit is correct', () => {
  // products A, B; bundle AB = A + B
  const board = {
    products: ['A', 'B'],
    instruments: [
      { id: 'A', legs: [1, 0], bid: 10, ask: 11 },
      { id: 'B', legs: [0, 1], bid: 20, ask: 21 },
      { id: 'AB', legs: [1, 1], bid: 33, ask: 34 },
    ],
  };
  // buy A at 11, buy B at 21, sell AB at 33 -> flat, profit 1
  const good = [{ id: 'A', side: 'buy' }, { id: 'B', side: 'buy' }, { id: 'AB', side: 'sell' }];
  assert.deepEqual(positionOutcome(board, good), { flat: true, profit: 1 });
  assert.equal(checkItem({ kind: 'orderbook', board }, { trades: good }).correct, true);
  const notFlat = [{ id: 'A', side: 'buy' }, { id: 'AB', side: 'sell' }];
  assert.equal(checkItem({ kind: 'orderbook', board }, { trades: notFlat }).correct, false);
  const loss = [{ id: 'A', side: 'sell' }, { id: 'B', side: 'sell' }, { id: 'AB', side: 'buy' }];
  assert.equal(positionOutcome(board, loss).profit, -4);
  assert.equal(checkItem({ kind: 'orderbook', board }, { trades: loss }).correct, false);
});
