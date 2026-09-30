import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { drawItem, examItems, nearestLevel, examScore } from '../../src/core/draw.js';

// A fake section: two families with different levels, plus a bank.
const fam = (id, levels) => ({
  id, levels,
  generate: (rng, { difficulty }) => ({ id: `x:${id}:${rng.int(0, 1e9)}`, family: id, difficulty, prompt: { text: `${id}-${difficulty}-${rng.int(0, 1e9)}` } }),
});
const section = {
  id: 'nl',
  families: [fam('easy', [1, 2]), fam('hard', [4, 5])],
  bank: [{ id: 'b1', family: 'easy', difficulty: 2, prompt: { text: 'bank one' } }, { id: 'b2', family: 'hard', difficulty: 5, prompt: { text: 'bank two' } }],
};

test('nearestLevel picks the closest supported level', () => {
  assert.equal(nearestLevel([1, 2], 5), 2);
  assert.equal(nearestLevel([4, 5], 1), 4);
  assert.equal(nearestLevel([1, 3], 2), 1);
});

test('drawItem honours family and difficulty', () => {
  const it = drawItem(section, makeRng(1), { family: 'hard', difficulty: 1 });
  assert.equal(it.family, 'hard');
  assert.equal(it.difficulty, 4);
});

test('examItems is deterministic per seed, ramps difficulty, has unique prompts and mixes the bank', () => {
  const cfg = { count: 26, ramp: true, bankRatio: 0.25 };
  const a = examItems(section, cfg, 'seed-1');
  const b = examItems(section, cfg, 'seed-1');
  assert.deepEqual(a.map((x) => x.prompt.text), b.map((x) => x.prompt.text));
  assert.equal(a.length, 26);
  assert.equal(new Set(a.map((x) => x.prompt.text)).size, 26);
  const firstHalf = a.slice(0, 13).reduce((s, x) => s + x.difficulty, 0);
  const secondHalf = a.slice(13).reduce((s, x) => s + x.difficulty, 0);
  assert.ok(secondHalf > firstHalf, 'difficulty ramps');
  assert.ok(a.some((x) => x.id === 'b1' || x.id === 'b2'), 'bank items appear');
});

test('examScore follows each section scoring rule', () => {
  assert.deepEqual(examScore('bto', [1, -1, 0, 1]), { score: 1, max: 4 });
  assert.deepEqual(examScore('iv', [0.5, 0.8, 0]), { score: 1.3, max: 3 });
  assert.deepEqual(examScore('ll', [1, 0, 1]), { score: 2, max: 3 });
});
