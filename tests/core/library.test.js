import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLibrary, librarySets, LIBRARY_MIN, setCount } from '../../src/core/library.js';

let counter = 0;
const fam = (id, variety) => ({
  id, levels: [1, 2, 3],
  generate: (rng, { difficulty }) => { const k = rng.int(0, variety - 1); return { id: `x:${id}:${k}:${counter++}`, family: id, difficulty, prompt: { text: `${id} #${k}` } }; },
});
const section = { id: 'bto', families: [fam('a', 400), fam('b', 400), fam('c', 30)], bank: [{ id: 'bank1', family: 'a', difficulty: 2, prompt: { text: 'bank one' } }] };

test('library is deterministic, unique, sized, and includes the bank', () => {
  const lib = buildLibrary(section, { size: 520, cache: false });
  const again = buildLibrary(section, { size: 520, cache: false });
  assert.equal(lib.length, 520);
  assert.deepEqual(lib.map((x) => x.prompt.text), again.map((x) => x.prompt.text));
  assert.equal(new Set(lib.map((x) => x.prompt.text)).size, 520);
  assert.ok(lib.some((x) => x.id === 'bank1'));
  // a low-variety family stops contributing once exhausted instead of looping forever
  assert.ok(lib.filter((x) => x.family === 'c').length <= 30);
});

test('sets partition the library in exam-sized chunks', () => {
  const lib = buildLibrary(section, { size: 520, cache: false });
  const sets = librarySets(lib, 20);
  assert.equal(sets.length, 26);
  assert.equal(sets.flat().length, 520);
  assert.equal(setCount(20), Math.ceil(LIBRARY_MIN / 20));
});
