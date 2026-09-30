import { test } from 'node:test';
import assert from 'node:assert/strict';
import section from '../../src/sections/bto/index.js';
import { familySuite, volumeSuite, bankSuite, itemKey } from '../helpers/harness.js';
import { makeRng } from '../../src/core/rng.js';

for (const f of section.families) familySuite('bto', f);
volumeSuite('bto', section.families, { min: 500 });
bankSuite('bto', section.bank, { min: 45 });

test('bto: at least 30 families spanning difficulty 1..5', () => {
  assert.ok(section.families.length >= 30, `${section.families.length} families`);
  const levels = new Set(section.families.flatMap((f) => f.levels));
  for (let d = 1; d <= 5; d++) assert.ok(levels.has(d), `no family at difficulty ${d}`);
});

test('bto: every family contributes at least 15 distinct items over 400 seeds', () => {
  for (const f of section.families) {
    const keys = new Set();
    for (let s = 0; s < 400; s++) keys.add(itemKey(f.generate(makeRng(`vol:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] })));
    assert.ok(keys.size >= 15, `${f.id}: only ${keys.size} distinct items`);
  }
});

test('bto: every item carries plain-JSON params naming its family', () => {
  for (const f of section.families) {
    for (let s = 0; s < 30; s++) {
      const it = f.generate(makeRng(`params:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] });
      assert.ok(it.params && typeof it.params === 'object', `${f.id} seed ${s}: params missing`);
      assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${f.id}: params not plain JSON`);
      assert.equal(it.params.family, f.id);
    }
  }
  for (const it of section.bank) {
    assert.ok(it.params && typeof it.params === 'object', `${it.id}: params missing`);
    assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${it.id}: params not plain JSON`);
  }
});

test('bto: the keyed option is the unique closest value to the exact answer', () => {
  for (const f of section.families) {
    for (let s = 0; s < 40; s++) {
      const it = f.generate(makeRng(`close:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] });
      const d = it.options.map((o) => Math.abs(o.value - it.answer.value));
      const best = Math.min(...d);
      assert.equal(d.indexOf(best), it.answerIndex);
      assert.equal(d.filter((x) => x === best).length, 1, `${f.id} seed ${s}: tie for closest`);
    }
  }
});

test('bto: famous reported items keep their known answers', () => {
  const byId = Object.fromEntries(section.bank.map((it) => [it.id, it]));
  const want = { 'bto-bank-top-card-red': 0.5, 'bto-bank-dice-11-or-12': 1 / 12, 'bto-bank-three-flips-same': 0.25, 'bto-bank-61-coins': 1, 'bto-bank-second-throw-differs': 5 / 6, 'bto-bank-hexagon-return': 6 };
  for (const [id, v] of Object.entries(want)) {
    assert.ok(byId[id], `${id} missing from bank`);
    assert.ok(Math.abs(byId[id].answer.value - v) < 1e-12, `${id}: ${byId[id].answer.value}`);
  }
});
