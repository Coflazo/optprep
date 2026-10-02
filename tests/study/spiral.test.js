import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextSpiral, spiralBlocks, spiralQuestion } from '../../src/study/spiral.js';

const q = { type: 'number', q: 'n?', answer: 1, explain: 'e' };
const gen = { make: () => q };
// blocks 1, 3, 5, 7, 9, 11 are checks; 13 is a mastery check; the rest teach.
const blocks = [];
for (let i = 0; i < 6; i++) blocks.push({ type: 'text', text: `unit ${i}` }, { type: 'check', questions: [q] });
blocks.push({ type: 'section', key: 'end', title: 'End' }, { type: 'check', mastery: true, questions: [gen, gen, gen] });
const n = (block, clean = true) => ({ block, clean });
const s = (block, clean = true) => ({ block, clean, spiral: true });

test('spiralBlocks: plain check blocks only, not mastery', () => {
  assert.deepEqual(spiralBlocks(blocks), [1, 3, 5, 7, 9, 11]);
  assert.deepEqual(spiralBlocks([]), []);
  assert.deepEqual(spiralBlocks(undefined), []);
});

test('no spiral before any answer, after an odd count, or right after a spiral', () => {
  assert.equal(nextSpiral(blocks, []), null);
  assert.equal(nextSpiral(blocks, [n(1)]), null);
  assert.equal(nextSpiral(blocks, [n(1), n(3), s(1), n(5)]), null);
  assert.equal(nextSpiral(blocks, [n(1), n(3), s(1)]), null, 'at most one spiral per new check');
});

test('after the second new check: the earlier one, never the one just answered', () => {
  assert.equal(nextSpiral(blocks, [n(1), n(3)]), 1);
  assert.equal(nextSpiral(blocks, [n(3), n(1)]), 3, 'the just-answered block is excluded even when it is earlier');
  assert.equal(nextSpiral(blocks, [n(1), n(1)]), null, 'nothing earlier to ask');
});

test('a missed check comes first, earliest miss first', () => {
  const log = [n(1), n(3), s(1), n(5, false), n(7, false)];
  assert.equal(nextSpiral(blocks, [...log.slice(0, 4), n(7)]), 5);
  assert.equal(nextSpiral(blocks, [n(1), n(3, false), n(5), n(7, false)]), 3);
  assert.equal(nextSpiral(blocks, log), 5, 'the miss at 7 was just answered, so 5');
});

test('a miss repaired on recall stops counting as missed', () => {
  const log = [n(1, false), n(3), s(1, true), n(5), n(7)];
  assert.equal(nextSpiral(blocks, log), 3, 'block 1 was repaired, so the next is the earliest never re-asked');
});

test('a miss that stays wrong on recall keeps priority', () => {
  assert.equal(nextSpiral(blocks, [n(1, false), n(3), s(1, false), n(5), n(7)]), 1);
});

test('blocks never re-asked come before blocks already re-asked', () => {
  // 1 and 3 were re-asked; 7 and 9 were not; 5 was just answered.
  assert.equal(nextSpiral(blocks, [n(1), n(3), s(1), n(5), n(7), s(3), n(9), n(5)]), 7);
});

test('expanding gap is exact for a single re-asked block', () => {
  const b = [{ type: 'check', questions: [q] }, { type: 'check', questions: [q] }];
  // block 0 re-asked once (times 1): due again when 4 new checks have passed since its last ask.
  const base = [n(0), n(1), s(0)];
  assert.equal(nextSpiral(b, [...base, n(1), n(1)]), null, '2 since last ask < 4');
  assert.equal(nextSpiral(b, [...base, n(1), n(1), n(1), n(1)]), 0, '4 since last ask');
  // re-asked twice: needs 8.
  const twice = [...base, n(1), n(1), n(1), n(1), s(0)];
  assert.equal(nextSpiral(b, [...twice, n(1), n(1), n(1), n(1)]), null);
  assert.equal(nextSpiral(b, [...twice, n(1), n(1), n(1), n(1), n(1), n(1), n(1), n(1)]), 0);
});

test('mastery checks and unknown blocks are never re-asked', () => {
  assert.equal(nextSpiral(blocks, [n(13), n(1)]), null);
  assert.equal(nextSpiral(blocks, [n(42), n(1)]), null);
});

test('a custom cadence: every third new check', () => {
  assert.equal(nextSpiral(blocks, [n(1), n(3)], { every: 3 }), null);
  assert.equal(nextSpiral(blocks, [n(1), n(3), n(5)], { every: 3 }), 1);
});

test('deterministic: same log, same answer', () => {
  const log = [n(1), n(3, false), s(1), n(5), n(7)];
  assert.equal(nextSpiral(blocks, log), nextSpiral(blocks, [...log]));
});

test('spiralQuestion prefers a generator, else the first question', () => {
  assert.equal(spiralQuestion([q, gen, q]), 1);
  assert.equal(spiralQuestion([q, q]), 0);
  assert.equal(spiralQuestion([gen]), 0);
});
