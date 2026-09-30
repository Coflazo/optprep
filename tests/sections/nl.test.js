import { test } from 'node:test';
import assert from 'node:assert/strict';
import section from '../../src/sections/nl/index.js';
import { familySuite, volumeSuite, bankSuite, itemKey } from '../helpers/harness.js';
import { makeRng } from '../../src/core/rng.js';
import { predictAll, distinctNext } from '../../src/sections/nl/solver.js';
import { label } from '../../src/sections/nl/lib.js';
import { verifyNl } from '../../src/sections/nl/lib.js';

for (const f of section.families) familySuite('nl', f);
volumeSuite('nl', section.families, { min: 500 });
bankSuite('nl', section.bank, { min: 45 });

test('nl: every family contributes at least 15 distinct items over 400 seeds', () => {
  for (const f of section.families) {
    const keys = new Set();
    for (let s = 0; s < 400; s++) keys.add(itemKey(f.generate(makeRng(`div:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] })));
    assert.ok(keys.size >= 15, `${f.id}: only ${keys.size} distinct items`);
  }
});

test('nl: ~30 families cover difficulties 1..5', () => {
  assert.ok(section.families.length >= 28);
  const levels = new Set(section.families.flatMap((f) => f.levels));
  for (let d = 1; d <= 5; d++) assert.ok(levels.has(d), `no family at difficulty ${d}`);
});

test('nl: the true rule reproduces every shown term, and misconceptions are specific', () => {
  for (const f of section.families) {
    for (let s = 0; s < 30; s++) {
      const d = f.levels[s % f.levels.length];
      const it = f.generate(makeRng(`nl-rule:${f.id}:${s}`), { difficulty: d });
      const mode = it.answer.full.some((l) => l.includes('/')) ? 'frac' : it.answer.full.some((l) => l.includes('.')) ? 'dec' : 'int';
      const again = f.terms(it.params.coeffs, it.answer.full.length).map((x) => label(x, mode));
      assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${f.id}: params must be plain JSON`);
      assert.equal(it.params.rule, f.id);
      assert.deepEqual(again, it.answer.full, `${f.id} seed ${s}: terms() disagrees with the item`);
      it.prompt.sequence.forEach((l, i) => { if (l !== '?') assert.equal(l, it.answer.full[i], `${f.id}: shown term ${i}`); });
      assert.equal(it.options[it.answerIndex].label, it.answer.label);
      const mis = it.options.filter((o) => o.misconception).map((o) => o.misconception);
      assert.equal(new Set(mis).size, 4, `${f.id}: misconceptions must be distinct`);
      for (const m of mis) {
        assert.ok(m.length > 25 && !/Magnitude guess/.test(m), `${f.id}: vague misconception "${m}"`);
      }
    }
  }
});

test('nl solver: finds the reported example and rejects ambiguity', () => {
  assert.deepEqual(distinctNext(['2', '5', '12', '29', '70']), [169]);
  assert.deepEqual(distinctNext(['1', '1', '4', '9', '25', '64']), [169]);
  assert.deepEqual(distinctNext(['1/2', '2/3', '3/5', '5/8', '8/13']).map((v) => v.toFixed(6)), [(13 / 21).toFixed(6)]);
  assert.deepEqual(distinctNext(['3', '1', '4', '1', '5', '9']), [], 'digits of pi follow no template');
  assert.ok(distinctNext(['11', '13', '17', '19', '23']).length > 1, 'primes with gaps 2,4,2,4 are genuinely ambiguous');
  assert.ok(predictAll(['12', '33', '66', '132', '363']).some((r) => r.rule === 'add reversal'));
});

test('nl: missing-term items have exactly one option that completes a rule', () => {
  let seen = 0;
  for (const f of section.families) {
    for (let s = 0; s < 80 && seen < 40; s++) {
      const it = f.generate(makeRng(`nl-miss:${f.id}:${s}`), { difficulty: f.levels[0] });
      if (it.prompt.sequence.at(-1) === '?') continue;
      seen++;
      assert.ok(verifyNl(it).ok, it.prompt.text);
    }
  }
  assert.ok(seen >= 10, `only ${seen} missing-term items generated`);
});

test('nl bank: every curated item has a unique rule-consistent answer', () => {
  for (const it of section.bank) {
    assert.ok(verifyNl(it).ok, `${it.id}: ${verifyNl(it).detail}\n${it.prompt.text}`);
    assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${it.id}: params must be plain JSON`);
    assert.equal(it.params.shown.length, it.prompt.sequence.length - 1);
    assert.ok(section.families.some((f) => f.id === it.params.rule), `${it.id}: unknown rule ${it.params.rule}`);
  }
});
