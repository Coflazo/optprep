import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateItem } from '../../src/core/contract.js';
import { buildMcq } from '../../src/core/options.js';
import { makeRng } from '../../src/core/rng.js';

const base = {
  id: 'bto:demo:1', section: 'bto', family: 'demo', difficulty: 1,
  prompt: { text: 'Two dice. P(sum = 12)?' },
  solution: { steps: [{ say: '36 equally likely pairs', why: 'each die has 6 faces' }, { say: 'Only (6,6) works', why: 'max face is 6' }], rule: 'one pair out of 36', anchor: 'counting equally likely outcomes' },
  hints: ['How many ordered pairs are there?', 'Which pairs sum to 12?'],
};

test('buildMcq returns 5 sorted, distinct options with misconceptions on wrong ones', () => {
  const r = makeRng(3);
  const m = buildMcq(r, {
    correct: 1 / 36,
    distractors: [
      { value: 1 / 21, misconception: 'Counted unordered pairs as equally likely' },
      { value: 1 / 6, misconception: 'Used one die instead of two' },
      { value: 2 / 36, misconception: 'Counted (6,6) twice' },
      { value: 1 / 36, misconception: 'duplicate of correct, must be dropped' },
      { value: 1 / 11, misconception: 'Treated the 11 sums as equally likely' },
    ],
    format: (v) => v.toFixed(3),
  });
  assert.equal(m.options.length, 5);
  const labels = m.options.map((o) => o.label);
  assert.equal(new Set(labels).size, 5);
  const vals = m.options.map((o) => o.value);
  assert.deepEqual(vals, [...vals].sort((a, b) => a - b));
  assert.equal(m.options[m.answerIndex].misconception, null);
  m.options.forEach((o, i) => { if (i !== m.answerIndex) assert.ok(o.misconception.length > 5); });
  assert.ok(!labels.includes('duplicate'));
});

test('validateItem accepts a good mcq and flags a broken one', () => {
  const r = makeRng(1);
  const m = buildMcq(r, { correct: 0.5, distractors: [0.25, 0.75, 0.1, 0.9, 0.6].map((v) => ({ value: v, misconception: 'some specific error' })), format: (v) => v.toFixed(2) });
  const item = { ...base, kind: 'mcq', ...m };
  assert.deepEqual(validateItem(item), []);
  const bad = { ...item, hints: [] };
  assert.ok(validateItem(bad).some((e) => e.includes('hints')));
});

test('validateItem checks rank margins and order', () => {
  const item = { ...base, kind: 'rank', statements: [{ text: 'a', p: 0.2 }, { text: 'b', p: 0.5 }, { text: 'c', p: 0.3 }], answerOrder: [1, 2, 0] };
  assert.deepEqual(validateItem(item), []);
  const tooClose = { ...item, statements: [{ text: 'a', p: 0.30 }, { text: 'b', p: 0.5 }, { text: 'c', p: 0.305 }], answerOrder: [1, 2, 0] };
  assert.ok(validateItem(tooClose).some((e) => e.includes('margin')));
  const wrongOrder = { ...item, answerOrder: [0, 1, 2] };
  assert.ok(validateItem(wrongOrder).some((e) => e.includes('answerOrder')));
});

test('validateItem checks interval truth and orderbook best trade', () => {
  assert.deepEqual(validateItem({ ...base, kind: 'interval', truth: 12.5 }), []);
  assert.ok(validateItem({ ...base, kind: 'interval', truth: -1 }).length);
  const board = { products: ['A', 'B'], instruments: [
    { id: 'A', legs: [1, 0], bid: 10, ask: 11 }, { id: 'B', legs: [0, 1], bid: 20, ask: 21 }, { id: 'AB', legs: [1, 1], bid: 33, ask: 34 }] };
  const ok = { ...base, kind: 'orderbook', board, best: { trades: [{ id: 'A', side: 'buy' }, { id: 'B', side: 'buy' }, { id: 'AB', side: 'sell' }], profit: 1 } };
  assert.deepEqual(validateItem(ok), []);
  const lie = { ...ok, best: { ...ok.best, profit: 5 } };
  assert.ok(validateItem(lie).some((e) => e.includes('profit')));
});
