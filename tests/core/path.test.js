import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roadmap, nextStep, bandOf, SKILLED } from '../../src/core/path.js';
import { SECTION_MODULES } from '../../src/sections/index.js';

const fams = [
  { id: 'a', title: 'A', levels: [1, 2] }, { id: 'b', title: 'B', levels: [1] },
  { id: 'c', title: 'C', levels: [2, 3] }, { id: 'd', title: 'D', levels: [3, 4] },
];
const lessons = [{ id: 'x/basics', title: 'Basics', status: 'mastered' }, { id: 'x/more', title: 'More', status: 'new' }];
const checkpoints = [{ id: 'set', title: 'Timed set', href: '#', passed: false }, { id: 'exam', title: 'Exam replica', href: '#', passed: false }];
const count = (map) => map.units.flatMap((u) => u.rows).filter((r) => r.current).length;

test('bands follow the lowest difficulty a family offers', () => {
  assert.deepEqual(fams.map(bandOf), ['easy', 'easy', 'medium', 'hard']);
});

test('exactly one current row in every state of progress', () => {
  const states = [{}, { 'x:a': { lv: SKILLED }, 'x:b': { lv: 1 } }, Object.fromEntries(fams.map((f) => [`x:${f.id}`, { lv: 5 }]))];
  for (const mastery of states) {
    const done = mastery['x:d'] ? lessons.map((l) => ({ ...l, status: 'mastered' })) : lessons;
    const map = roadmap({ sectionId: 'x', families: fams, lessons: done, checkpoints, mastery });
    assert.equal(count(map), 1);
  }
});

test('the current row is the first unfinished one, later units are marked later', () => {
  const map = roadmap({ sectionId: 'x', families: fams, lessons, checkpoints, mastery: {} });
  assert.equal(map.units[map.current.unit].rows[map.current.row].id, 'x/more');
  assert.ok(map.units[1].rows.every((r) => r.later));
  const map2 = roadmap({ sectionId: 'x', families: fams, lessons: lessons.map((l) => ({ ...l, status: 'mastered' })), checkpoints, mastery: { 'x:a': { lv: 3 } } });
  assert.equal(map2.units[map2.current.unit].rows[map2.current.row].id, 'b');
});

test('a fully mastered path points at the exam checkpoint', () => {
  const all = Object.fromEntries(fams.map((f) => [`x:${f.id}`, { lv: 5 }]));
  const map = roadmap({ sectionId: 'x', families: fams, lessons: lessons.map((l) => ({ ...l, status: 'mastered' })), checkpoints: checkpoints.map((c) => ({ ...c, passed: true })), mastery: all });
  const row = map.units[map.current.unit].rows[map.current.row];
  assert.equal(row.kind, 'checkpoint');
  assert.equal(map.mastered, 4);
});

test('next step prefers a due review, then the first unfinished section', () => {
  const fresh = roadmap({ sectionId: 'x', families: fams, mastery: {} });
  const due = roadmap({ sectionId: 'y', families: fams, mastery: { 'y:c': { lv: 2 } }, srs: { 'y:c': { box: 1, due: 0 } }, now: 10 });
  assert.equal(nextStep([{ id: 'x', map: fresh }, { id: 'y', map: due }]).row.id, 'c');
  assert.equal(nextStep([{ id: 'x', map: fresh }]).why, 'continue');
});

test('real sections build a valid roadmap', () => {
  for (const [id, mod] of Object.entries(SECTION_MODULES)) {
    const map = roadmap({ sectionId: id, families: mod.families, checkpoints });
    assert.equal(count(map), 1, id);
    assert.equal(map.skillsTotal, mod.families.length, id);
  }
});
