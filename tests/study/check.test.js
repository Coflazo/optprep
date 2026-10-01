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

test('choice options are arranged fairly: shuffled, numeric sorted, traps follow', async () => {
  const { arrangeChoice, gradeCheck } = await import('../../src/study/check.js');
  const { makeRng } = await import('../../src/core/rng.js');
  const q = { type: 'choice', q: '?', options: ['right', 'wrong a', 'wrong b', 'wrong c'], answer: 0, traps: { 1: 'belief a', 2: 'belief b', 3: 'belief c' }, explain: 'e' };
  const pos = [0, 0, 0, 0];
  for (let s = 0; s < 400; s++) {
    const a = arrangeChoice(q, makeRng(s));
    pos[a.answer] += 1;
    assert.equal(a.options[a.answer], 'right');
    for (const [k, v] of Object.entries(a.traps)) assert.equal(a.options[k], `wrong ${v.slice(-1)}`);
    const wrong = a.options.indexOf('wrong b');
    assert.equal(gradeCheck(a, wrong).trap, 'belief b');
  }
  for (const n of pos) assert.ok(n > 60 && n < 140, `position spread ${pos}`);
  const num = arrangeChoice({ type: 'choice', q: '?', options: ['5/12', '1/2', '1/12'], answer: 0, explain: 'e' }, makeRng(1));
  assert.deepEqual(num.options, ['1/12', '5/12', '1/2']);
  assert.equal(num.options[num.answer], '5/12');
  const fixed = { type: 'choice', q: '?', options: ['A only', 'B only', 'both'], answer: 2, stable: true, explain: 'e' };
  assert.equal(arrangeChoice(fixed, makeRng(1)), fixed);
});

test('choice validation still catches duplicates and bad indexes alongside the length cue', async () => {
  const { validateQuestion } = await import('../../src/study/check.js');
  const base = { type: 'choice', q: '?', explain: 'e' };
  assert.ok(validateQuestion({ ...base, options: ['a', 'a', 'b'], answer: 2 }).includes('check: duplicate options'));
  assert.ok(validateQuestion({ ...base, options: ['a', 'b'], answer: 5 }).includes('check: answer index'));
  assert.ok(validateQuestion({ ...base, options: ['the long and careful right answer', 'no', 'nah'], answer: 0 }).some((m) => m.includes('length cue')));
  assert.deepEqual(validateQuestion({ ...base, options: ['a', 'b', 'c'], answer: 1 }), []);
});

test('quotes like "100.5 / 101.5" are shuffled, not sorted as fractions', async () => {
  const { arrangeChoice } = await import('../../src/study/check.js');
  const { makeRng } = await import('../../src/core/rng.js');
  const q = { type: 'choice', q: '?', options: ['100.5 / 101.5', '99 / 100', '101 / 103', '98.5 / 102'], answer: 0, explain: 'e' };
  const pos = new Set();
  for (let s = 0; s < 50; s++) pos.add(arrangeChoice(q, makeRng(s)).answer);
  assert.ok(pos.size >= 3, `answer lands in ${pos.size} positions`);
  assert.deepEqual(arrangeChoice({ type: 'choice', q: '?', options: ['12%', '-3', '1/4'], answer: 0, explain: 'e' }, makeRng(1)).options, ['-3', '1/4', '12%']);
});
