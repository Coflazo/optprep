// Content acceptance tests: every lesson of every finished book validates; every diagram
// spec passes its validator; every check question (data or generated) is well formed;
// every worked/try-it family exists and generates. Coverage: every question family and
// every Zap-N game has its lesson.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS } from '../../src/study/content/index.js';
import { validateLesson, validateBook, lessonsOf } from '../../src/study/schema.js';
import { validateDiagram } from '../../src/study/diagrams/index.js';
import { validateQuestion } from '../../src/study/check.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { GAMES } from '../../src/zapn/index.js';
import { makeRng } from '../../src/core/rng.js';

const ctx = { rng: makeRng(1), lesson: {}, store: null };
const val = (x) => (typeof x === 'function' ? x(ctx) : x);
const findFamily = (fid) => Object.values(SECTION_MODULES).flatMap((m) => m.families).find((f) => f.id === fid);

for (const book of BOOKS.filter((b) => !b.pending)) {
  test(`study/${book.id}: book, tree and lessons validate`, () => {
    assert.deepEqual(validateBook(book), []);
    assert.deepEqual(validateDiagram('flow', book.tree.spec), [], 'recognition tree');
    const ids = new Set();
    for (const L of lessonsOf(book)) {
      assert.deepEqual(validateLesson(L), [], L.id);
      assert.ok(!ids.has(L.id), `duplicate ${L.id}`); ids.add(L.id);
      assert.equal(L.book, book.id, `${L.id} book`);
    }
  });
  test(`study/${book.id}: diagrams, checks and live examples`, () => {
    for (const L of lessonsOf(book)) {
      for (const b of L.blocks) {
        if (b.type === 'diagram') assert.deepEqual(validateDiagram(b.diagram, val(b.spec)), [], `${L.id} ${b.diagram}`);
        const qs = b.type === 'check' ? b.questions : b.type === 'steps' ? b.steps.flatMap((s) => s.checks || []) : b.type === 'transfer' ? [b.near, b.far, b.principle] : [];
        for (const q of qs) {
          if (typeof q.make === 'function') for (let s = 0; s < 25; s++) assert.deepEqual(validateQuestion(q.make(makeRng(`${L.id}:${s}`))), [], `${L.id} generated check seed ${s}`);
          else assert.deepEqual(validateQuestion(q), [], `${L.id} check: ${q.q}`);
        }
        if (b.type === 'worked' || (b.type === 'tryit' && b.family)) {
          const f = findFamily(b.family);
          assert.ok(f, `${L.id}: unknown family ${b.family}`);
          const lv = f.levels?.length ? f.levels : [1];
          for (let s = 0; s < (b.type === 'worked' ? 60 : 40); s++) f.generate(makeRng(`${L.id}:${b.type}:${s}`), { difficulty: b.difficulty ?? lv[s % lv.length] });
          if (b.type === 'worked' && b.explainAt) {
            const item = f.generate(makeRng(`study:${L.id}:${b.family}:${b.seed ?? b.difficulty}`), { difficulty: b.difficulty });
            for (const i of b.explainAt) assert.ok(i < (item.solution?.steps?.length || 0), `${L.id}: explainAt ${i} beyond the ${item.solution?.steps?.length} steps of the worked item`);
          }
        }
      }
    }
  });
}

// Reported as todo (non-fatal) while any book is still a placeholder.
const pending = BOOKS.filter((b) => b.pending).map((b) => b.id);
test('study coverage: every question family and every Zap-N game has a lesson', { todo: pending.length ? `books pending: ${pending.join(', ')}` : false }, () => {
  const lessons = BOOKS.filter((b) => !b.pending).flatMap(lessonsOf);
  const missing = [];
  for (const [sid, mod] of Object.entries(SECTION_MODULES)) for (const f of mod.families) {
    if (!lessons.some((l) => l.kind === 'family' && l.book === sid && l.family === f.id)) missing.push(`${sid}/${f.id}`);
  }
  for (const g of GAMES) if (!lessons.some((l) => l.kind === 'game' && l.game === g.id)) missing.push(`zapn/${g.id}`);
  assert.deepEqual(missing, [], `${missing.length} lessons missing`);
  // Every link in a recognition tree and every prerequisite points at a real lesson.
  const ids = new Set(lessons.map((l) => l.id));
  const dangling = [];
  for (const b of BOOKS) for (const n of b.tree?.spec?.nodes || []) if (n.link && !ids.has(n.link)) dangling.push(`${b.id} tree -> ${n.link}`);
  for (const l of lessons) for (const p of l.prerequisites || []) if (!ids.has(p)) dangling.push(`${l.id} needs ${p}`);
  assert.deepEqual(dangling, []);
  // Each family lesson is reachable from its book's recognition tree.
  const unlinked = lessons.filter((l) => l.kind === 'family' && !BOOK_TREE_LINKS(l.book).has(l.id)).map((l) => l.id);
  assert.deepEqual(unlinked, [], 'family lessons missing from their recognition tree');
});
const BOOK_TREE_LINKS = (id) => new Set((BOOKS.find((b) => b.id === id)?.tree?.spec?.nodes || []).map((n) => n.link).filter(Boolean));
