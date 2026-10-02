import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS } from '../../config/sections.js';
import { PRESETS, resolvePreset, applyPreset, activatePreset, activePreset, presetSections, timingOf, timingAtLeastAsStrict, ZAPN_ALL } from '../../config/presets.js';

test('applying a preset sets clocks; switching back restores the base format', () => {
  const ivBase = { ...SECTIONS.iv.exam };
  activatePreset({ id: 'kickstarter' });
  assert.equal(SECTIONS.iv.exam.perItemSeconds, 45);
  assert.equal(SECTIONS.nl.exam.navigation, 'free');
  activatePreset({ id: 'trader' });
  assert.equal(SECTIONS.nl.exam.count, 15);
  assert.equal(SECTIONS.nl.exam.navigation, 'forward');
  assert.equal(SECTIONS.bto.exam.count, 30);
  assert.equal(SECTIONS.nl.target.metric, 'netPct');
  assert.equal(SECTIONS.iv.exam.perItemSeconds, ivBase.perItemSeconds, 'a preset without iv timing leaves the base');
  activatePreset({ id: 'full' });
  assert.deepEqual(SECTIONS.iv.exam, ivBase);
  assert.equal(SECTIONS.nl.exam.count, 26);
  assert.equal(activePreset().id, 'full');
});

test('unknown or missing presets fall back to the full battery', () => {
  assert.equal(resolvePreset(null).id, 'full');
  assert.equal(resolvePreset({ id: 'nope' }).id, 'full');
});

test('custom keeps only real sections and games', () => {
  const r = resolvePreset({ id: 'custom', sections: ['bto', 'fake', 'zapn'], zapn: ['balloon', 'tetris'], timing: { bto: { perItemSeconds: 60 } } });
  assert.deepEqual(r.sections, ['bto', 'zapn']);
  assert.deepEqual(r.zapn, ['balloon']);
  applyPreset(r);
  assert.equal(SECTIONS.bto.exam.perItemSeconds, 60);
  activatePreset({ id: 'full' });
  const empty = resolvePreset({ id: 'custom', sections: [], zapn: [] });
  assert.deepEqual(empty.zapn, ZAPN_ALL);
});

test('preset section lists only name tasks that exist', () => {
  for (const p of Object.values(PRESETS)) for (const s of presetSections(resolvePreset({ id: p.id }))) assert.ok(s === 'zapn' || SECTIONS[s], `${p.id}: ${s}`);
});

test('readiness never counts a run under a looser clock', () => {
  const strict = { count: 18, perItemSeconds: 45 };
  const loose = { count: 18, perItemSeconds: 60 };
  assert.equal(timingAtLeastAsStrict({ timing: timingOf(strict) }, loose), true);
  assert.equal(timingAtLeastAsStrict({ timing: timingOf(loose) }, strict), false);
  assert.equal(timingAtLeastAsStrict({ timing: { count: 26, totalSeconds: 1500 } }, { count: 15, totalSeconds: 1500 }), true, '26 in 25 min is tighter per question than 15 in 25 min');
  assert.equal(timingAtLeastAsStrict({ timing: { count: 10, totalSeconds: 1500 } }, { count: 15, totalSeconds: 1500 }), false, 'a shorter run is not evidence for a longer one');
  assert.equal(timingAtLeastAsStrict({}, strict), true, 'unstamped legacy runs count');
});
