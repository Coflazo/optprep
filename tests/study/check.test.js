import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestion, gradeCheck, resolveQuestion } from '../../src/study/check.js';
import { makeRng } from '../../src/core/rng.js';

test('grading for every question type', () => {
  const c = { type: 'choice', q: 'P(sum 7)?', options: ['1/6', '1/11', '1/36'], answer: 0, traps: { 1: 'sums are not equally likely' }, explain: '6 of 36' };
  assert.deepEqual(validateQuestion(c), []);
  assert.deepEqual(gradeCheck(c, 0), { correct: true, trap: undefined });
  assert.equal(gradeCheck(c, 1).trap, 'sums are not equally likely');
  assert.equal(gradeCheck({ type: 'number', answer: 0.25, tolerance: 0.005 }, '0,251').correct, true);
  assert.equal(gradeCheck({ type: 'order', answer: [2, 0, 1] }, [2, 0, 1]).correct, true);
  assert.equal(gradeCheck({ type: 'interval', answer: 42 }, { lower: 40, upper: 50 }).score, 0.8);
  assert.ok(validateQuestion({ type: 'order', q: 'x', items: ['a', 'b'], answer: [0, 0], explain: 'y' }).length);
});

test('generator questions resolve per seed', () => {
  const g = { make: (rng) => { const k = rng.int(2, 6); return { type: 'number', q: `P(no six in ${k})`, answer: (5 / 6) ** k, tolerance: 1e-3, explain: 'multiply' }; } };
  const a = resolveQuestion(g, makeRng(1)), b = resolveQuestion(g, makeRng(1));
  assert.deepEqual(a, b);
  assert.deepEqual(validateQuestion(a), []);
});

test('number checks accept typed fractions', async () => {
  const { gradeCheck, parseNumber } = await import('../../src/study/check.js');
  assert.equal(parseNumber('1/4'), 0.25);
  assert.equal(parseNumber(' -3 / 8 '), -0.375);
  assert.equal(parseNumber('0,5'), 0.5);
  assert.ok(Number.isNaN(parseNumber('')));
  assert.ok(gradeCheck({ type: 'number', answer: 1 / 3 }, '1/3').correct);
  assert.ok(!gradeCheck({ type: 'number', answer: 1 / 3 }, '1/4').correct);
});

test('number checks accept the typographic minus sign', async () => {
  const { parseNumber } = await import('../../src/study/check.js');
  assert.equal(parseNumber('−3'), -3);
  assert.equal(parseNumber('−3/4'), -0.75);
});
