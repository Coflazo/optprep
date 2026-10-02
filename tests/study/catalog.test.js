// The catalog is generated from the lesson content; a stale catalog would send "Learn this"
// links to lessons that moved. Regenerate with: node tools/build-catalog.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogSource, sectionsCatalogSource } from '../../tools/build-catalog.mjs';
import { lessonForFamily as fromContent } from '../../src/study/content/index.js';
import { LESSONS, lessonForFamily } from '../../src/study/catalog.js';

test('the lesson catalog matches the lesson content', () => {
  assert.equal(readFileSync(new URL('../../src/study/catalog.js', import.meta.url), 'utf8'), catalogSource(), 'run node tools/build-catalog.mjs');
});

test('the family catalog matches the question families', () => {
  assert.equal(readFileSync(new URL('../../src/sections/catalog.js', import.meta.url), 'utf8'), sectionsCatalogSource(), 'run node tools/build-catalog.mjs');
});

test('catalog links agree with the content for every family lesson', () => {
  for (const l of LESSONS.filter((x) => x.kind === 'family')) assert.equal(lessonForFamily(l.book, l.family), fromContent(l.book, l.family));
  assert.equal(lessonForFamily('bto', 'no-such-family'), null);
});
