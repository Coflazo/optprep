// Shared test harness. Every family in every section runs through familySuite,
// and every section through volumeSuite, so "hundreds of verified questions per
// section" is a checked claim, not a promise.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { validateItem } from '../../src/core/contract.js';

export const itemKey = (it) => `${it.prompt.text}|${JSON.stringify(it.prompt.visual || null)}`;

export function familySuite(section, family, { seeds = 120, verifySeeds = 40 } = {}) {
  const levels = family.levels?.length ? family.levels : [1];
  test(`${section}/${family.id}: metadata and lesson`, () => {
    assert.equal(family.section, section);
    for (const k of ['id', 'title', 'skill']) assert.ok(family[k], `${k} missing`);
    const L = family.lesson;
    assert.ok(L && L.purpose && L.anchor && L.rule, 'lesson needs purpose, anchor, rule');
    assert.ok(Array.isArray(L.steps) && L.steps.length >= 2 && L.steps.every((s) => s.say && s.why), 'lesson steps need say + why');
    assert.ok(L.predict?.question && L.predict?.answer, 'lesson needs a predict question');
  });
  test(`${section}/${family.id}: ${seeds} seeds satisfy the item contract`, () => {
    for (let s = 0; s < seeds; s++) {
      const difficulty = levels[s % levels.length];
      const item = family.generate(makeRng(`${family.id}:${s}`), { difficulty });
      const errs = validateItem(item);
      assert.deepEqual(errs, [], `seed ${s}: ${errs.join('; ')}\n${item.prompt?.text}`);
      assert.equal(item.section, section);
      assert.equal(item.family, family.id);
    }
  });
  test(`${section}/${family.id}: independent verifier agrees on ${verifySeeds} seeds`, () => {
    for (let s = 0; s < verifySeeds; s++) {
      const difficulty = levels[s % levels.length];
      const item = family.generate(makeRng(`${family.id}:v${s}`), { difficulty });
      const v = family.verify(item, makeRng(`verify:${s}`));
      assert.ok(v.ok, `seed ${s}: ${v.detail || ''}\n${item.prompt.text}`);
    }
  });
}

export function volumeSuite(section, families, { min = 300, seedsPerFamily = 400 } = {}) {
  test(`${section}: at least ${min} distinct generated items`, () => {
    const keys = new Set();
    for (const f of families) {
      const levels = f.levels?.length ? f.levels : [1];
      for (let s = 0; s < seedsPerFamily; s++) keys.add(itemKey(f.generate(makeRng(`vol:${f.id}:${s}`), { difficulty: levels[s % levels.length] })));
    }
    assert.ok(keys.size >= min, `only ${keys.size} distinct items`);
  });
}

export function bankSuite(section, bank, { min = 40 } = {}) {
  test(`${section}: curated bank has at least ${min} valid sourced items`, () => {
    assert.ok(bank.length >= min, `bank has ${bank.length}`);
    const ids = new Set();
    for (const it of bank) {
      const errs = validateItem(it);
      assert.deepEqual(errs, [], `${it.id}: ${errs.join('; ')}`);
      assert.ok(it.meta?.source, `${it.id} needs meta.source`);
      assert.ok(!ids.has(it.id), `duplicate id ${it.id}`);
      ids.add(it.id);
    }
  });
}
