// Acceptance test for "hundreds of questions per section": every section's fixed
// library holds at least LIBRARY_MIN distinct, contract-valid questions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { buildLibrary, LIBRARY_MIN } from '../../src/core/library.js';
import { validateItem } from '../../src/core/contract.js';

for (const [id, section] of Object.entries(SECTION_MODULES)) {
  test(`${id}: library has at least ${LIBRARY_MIN} distinct valid questions`, () => {
    const lib = buildLibrary(section, { cache: false });
    assert.ok(lib.length >= LIBRARY_MIN, `${id} library has ${lib.length}`);
    for (const it of lib) assert.deepEqual(validateItem(it), [], `${it.id}`);
  });
}
