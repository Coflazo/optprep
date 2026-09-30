import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { srsRecord, srsDue, SRS_INTERVALS } from '../../src/core/srs.js';
import { familyWeights, pickFamily } from '../../src/core/adaptive.js';
import { runMeetsTarget, readiness } from '../../src/core/readiness.js';
import { makeCountdown } from '../../src/core/timer.js';
import { makeRng } from '../../src/core/rng.js';

test('store records answers and runs, and round-trips through export/import', () => {
  const s = makeStore(memoryBackend());
  s.recordAnswer('bto', 'dice-sum', { correct: true, ms: 4000 });
  s.recordAnswer('bto', 'dice-sum', { correct: false, ms: 9000 });
  s.recordRun({ section: 'bto', mode: 'exam', score: 12, max: 20, items: [] });
  assert.deepEqual(s.stats()['bto:dice-sum'], { n: 2, correct: 1, ms: 13000 });
  assert.equal(s.runs('bto', 'exam').length, 1);
  const s2 = makeStore(memoryBackend());
  s2.importJSON(s.exportJSON());
  assert.equal(s2.runs('bto').length, 1);
  assert.throws(() => s2.importJSON('{"version":99}'));
});

test('store survives a broken backend', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const s = makeStore(broken);
  s.recordAnswer('nl', 'arith', { correct: true, ms: 1 });
  assert.equal(s.stats()['nl:arith'].n, 1);
});

test('SRS: a miss comes back soon, repeated hits push it out', () => {
  let srs = {};
  srs = srsRecord(srs, 'bto:bayes', false, 0);
  assert.deepEqual(srsDue(srs, 0), ['bto:bayes']);
  srs = srsRecord(srs, 'bto:bayes', true, 0);
  assert.equal(srs['bto:bayes'].box, 2);
  assert.deepEqual(srsDue(srs, SRS_INTERVALS[2] - 1), []);
  assert.deepEqual(srsDue(srs, SRS_INTERVALS[2] + 1), ['bto:bayes']);
});

test('adaptive weights favour weak and unseen families', () => {
  const stats = { 'bto:a': { n: 20, correct: 19, ms: 0 }, 'bto:b': { n: 20, correct: 5, ms: 0 } };
  const w = familyWeights('bto', ['a', 'b', 'c'], stats);
  assert.ok(w.b > w.a && w.c > w.a);
  const r = makeRng(1);
  const counts = { a: 0, b: 0, c: 0 };
  for (let i = 0; i < 3000; i++) counts[pickFamily(r, w)]++;
  assert.ok(counts.b > counts.a * 2);
});

test('readiness: last 3 exams must all meet the target', () => {
  const t = { metric: 'net', value: 18 };
  assert.equal(runMeetsTarget({ score: 18, max: 26 }, t), true);
  assert.equal(runMeetsTarget({ score: 17, max: 26 }, t), false);
  assert.equal(runMeetsTarget({ score: 13, max: 20 }, { metric: 'netPct', value: 0.6 }), true);
  assert.equal(runMeetsTarget({ score: 13.5, max: 18 }, { metric: 'mean', value: 0.7 }), true);
  const runs = [18, 20, 17, 19, 21, 22].map((score, i) => ({ score, max: 26, finishedAt: i }));
  assert.deepEqual(readiness(runs, t, 3), { ready: true, streak: 3, needed: 3 });
  assert.equal(readiness(runs.slice(0, 4), t, 3).ready, false);
});

test('countdown uses an injectable clock', () => {
  let now = 1000;
  const c = makeCountdown(5000, () => now);
  assert.equal(c.remaining(), 5000);
  now = 4000;
  assert.equal(c.remaining(), 2000);
  c.penalize(1500);
  assert.equal(c.remaining(), 500);
  now = 7000;
  assert.equal(c.expired(), true);
  assert.equal(c.remaining(), 0);
});
