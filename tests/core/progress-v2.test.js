import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrate, blankV2 } from '../../src/core/migrate.js';
import { makeStore, memoryBackend, KEY, LEGACY_KEY, STATE_BUDGET } from '../../src/core/store.js';
import { trendStep, decayed, wilsonLower, weakPatterns, HALF_LIFE, beliefHash } from '../../src/core/patterns.js';
import { creditTick, dayKey, addDays, streak, applyFreezes, IDLE_MS } from '../../src/core/activity.js';
import { xpFor, levelStep, skillState } from '../../src/core/progression.js';
import { mistakeRow, upsertMistake, regenerate, MISTAKE_CAP } from '../../src/core/mistakes.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { makeRng } from '../../src/core/rng.js';

const v1 = JSON.parse(readFileSync(new URL('../fixtures/v1-state.json', import.meta.url), 'utf8'));
const NOW = 1759400000000;

test('migrate keeps every v1 key and value', () => {
  const { state, from } = migrate(structuredClone(v1), NOW);
  assert.equal(from, 1);
  assert.equal(state.version, 2);
  for (const k of ['stats', 'srs', 'zapn', 'sets', 'calibration', 'study', 'studyMeta', 'unknownTopLevel']) assert.deepEqual(state[k], v1[k], k);
  assert.equal(state.settings.divNotation, 'slash');
  assert.deepEqual(state.settings.someFutureKey, [1, 2]);
  assert.deepEqual(state.settings.preset, { id: 'kickstarter' });
  assert.equal(state.runs.length, 2);
  assert.deepEqual(state.runs[1].timing, { count: 18, perItemSeconds: 60 });
  assert.equal(state.activity.xpBase, 22);
  assert.deepEqual(state.mistakes, []);
  assert.ok(state.trend['bto:two-dice-sum'].n <= 20);
  assert.ok(state.mastery['bto:two-dice-sum'].lv <= 3);
});

test('migrate is idempotent and rejects unknown saves', () => {
  const once = migrate(structuredClone(v1), NOW).state;
  assert.deepEqual(migrate(structuredClone(once), NOW + 5).state, once);
  assert.equal(migrate({ version: 3, runs: [] }), null);
  assert.equal(migrate('garbage'), null);
  // Untrusted files: wrong container types or non-record list entries are refused whole.
  assert.equal(migrate({ version: 2, runs: [null] }), null);
  assert.equal(migrate({ version: 2, runs: [], stats: 'x' }), null);
  assert.equal(migrate({ version: 2, runs: [], mistakes: {} }), null);
  assert.equal(migrate({ version: 2, runs: [], activity: { days: [] } }), null);
  assert.equal(migrate({ version: 1, runs: [], settings: null }), null);
  assert.ok(migrate(JSON.parse('{"version":2,"runs":[],"__proto__":{"polluted":1}}')));
  assert.equal({}.polluted, undefined);
  assert.equal(migrate(null), null);
});

test('store migrates v1 once, writes v2, leaves v1 byte-for-byte', () => {
  const b = memoryBackend();
  const v1Text = JSON.stringify(v1);
  b.setItem(LEGACY_KEY, v1Text);
  const s = makeStore(b, {}, { clock: () => NOW });
  assert.equal(s.migratedFrom, 1);
  assert.equal(b.getItem(LEGACY_KEY), v1Text);
  assert.equal(JSON.parse(b.getItem(KEY)).version, 2);
  assert.equal(s.stats()['bto:two-dice-sum'].n, 12);
  const again = makeStore(b, {}, { clock: () => NOW });
  assert.equal(again.migratedFrom, null);
});

test('store never overwrites a save it cannot read', () => {
  for (const raw of ['{"version":7,"runs":[]}', '{not json']) {
    const b = memoryBackend();
    b.setItem(KEY, raw);
    const s = makeStore(b);
    assert.equal(s.readOnly, true);
    s.recordAnswer('bto', 'x', { correct: true, ms: 2000 });
    assert.equal(b.getItem(KEY), raw);
  }
});

test('store compacts and flags a full quota instead of losing progress silently', () => {
  let limit = Infinity;
  const m = new Map();
  const b = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { if (String(v).length > limit) throw new Error('QuotaExceededError'); m.set(k, String(v)); } };
  const s = makeStore(b, {}, { clock: () => NOW });
  for (let i = 0; i < 400; i++) s.state.mistakes.push({ id: `m${i}`, prompt: 'x'.repeat(300) });
  limit = 90_000;
  s.save();
  assert.equal(s.storageFull, false);
  assert.equal(s.state.mistakes.length, 250);
  limit = 10;
  s.save();
  assert.equal(s.storageFull, true);
  assert.ok(STATE_BUDGET > 1e6);
});

test('recordAnswer feeds trend, mastery, xp and the mistake log', () => {
  let t = NOW;
  const s = makeStore(memoryBackend(), {}, { clock: () => t });
  const fam = SECTION_MODULES.bto.families[0];
  const item = fam.generate(makeRng(42), { difficulty: 1 });
  const wrong = item.options.findIndex((o, i) => i !== item.answerIndex);
  s.recordAnswer('bto', fam.id, { correct: false, ms: 30000, miss: mistakeRow(item, { choice: wrong }, { now: t }) });
  for (let i = 0; i < 3; i++) { t += 1000; s.recordAnswer('bto', fam.id, { correct: true, ms: 20000 }); }
  const k = `bto:${fam.id}`;
  assert.equal(s.mastery()[k].lv, 1);
  assert.equal(s.mistakes().length, 1);
  assert.equal(s.mistakes()[0].chosen, item.options[wrong].label);
  assert.equal(s.xpTotal(), 6);
  s.recordAnswer('bto', fam.id, { correct: true, ms: 20000, mode: 'exam' });
  assert.equal(s.xpTotal(), 6, 'exam answers earn no per-answer XP');
});

test('trend decays with a 7-day half-life', () => {
  const t = trendStep(trendStep(undefined, false, 0), false, 0);
  const d = decayed(t, HALF_LIFE);
  assert.ok(Math.abs(d.n - 1) < 1e-9);
  assert.equal(d.c, 0);
});

test('wilson lower bound is cautious with little data', () => {
  assert.ok(wilsonLower(1, 1) < 0.5);
  assert.ok(wilsonLower(8, 10) > 0.55);
  assert.equal(wilsonLower(0, 0), 0);
});

test('weak patterns: needs evidence, at most two per family, top five', () => {
  const trend = {};
  for (let f = 0; f < 8; f++) trend[`bto:f${f}`] = { n: 10, c: f < 6 ? 2 : 9, at: NOW };
  trend['bto:thin'] = { n: 1, c: 0, at: NOW };
  const mistakes = [
    { sid: 'bto', fam: 'f0', belief: 'Added the probabilities', bk: beliefHash('Added the probabilities'), n: 5, at: NOW },
    { sid: 'bto', fam: 'f0', belief: 'Forgot the complement', bk: beliefHash('Forgot the complement'), n: 4, at: NOW },
  ];
  const out = weakPatterns({ trend, mistakes, now: NOW });
  assert.equal(out.length, 5);
  assert.ok(!out.some((p) => p.fam === 'thin' || p.fam === 'f6'));
  assert.ok(out.filter((p) => p.key === 'bto:f0').length <= 2);
  for (let i = 1; i < out.length; i++) assert.ok(out[i - 1].lb >= out[i].lb);
});

test('active time: idle, hidden and non-session ticks earn nothing', () => {
  const base = { now: 100e3, lastTick: 95e3, lastInputAt: 99e3, hidden: false, inSession: true };
  assert.equal(creditTick(base), 5e3);
  assert.equal(creditTick({ ...base, hidden: true }), 0);
  assert.equal(creditTick({ ...base, inSession: false }), 0);
  assert.equal(creditTick({ ...base, lastInputAt: base.now - IDLE_MS - 1 }), 0);
  assert.equal(creditTick({ ...base, lastTick: 0 }), 10e3, 'a sleeping laptop never credits a huge jump');
});

test('streak: today pending never breaks it, gaps do, DST is calendar-safe', () => {
  const goal = { ms: 10 * 60e3 };
  const days = { '2026-03-27': goal, '2026-03-28': goal, '2026-03-29': goal, '2026-03-30': goal };
  assert.equal(addDays('2026-03-29', 1), '2026-03-30'); // EU DST starts 29 March
  assert.deepEqual(streak(days, [], '2026-03-31', 10), { current: 4, best: 4 });
  assert.deepEqual(streak(days, [], '2026-03-30', 10), { current: 4, best: 4 });
  assert.equal(streak(days, [], '2026-04-02', 10).current, 0);
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59).getTime()), '2026-01-05');
});

test('freezes cover missed days only while they last', () => {
  const goal = { ms: 10 * 60e3 };
  const a = { days: { '2026-05-01': goal, '2026-05-02': goal }, freezes: 1, frozen: [] };
  const one = applyFreezes(a, '2026-05-04', 10);
  assert.deepEqual(one.frozen, ['2026-05-03']);
  assert.equal(one.freezes, 0);
  assert.equal(streak(one.days, one.frozen, '2026-05-04', 10).current, 3);
  const two = applyFreezes(a, '2026-05-05', 10);
  assert.deepEqual(two.frozen, [], 'two missed days need two freezes');
});

test('xp rules', () => {
  assert.equal(xpFor({ type: 'answer', mode: 'practice', correct: true, hints: 0, ms: 5000 }), 2);
  assert.equal(xpFor({ type: 'answer', mode: 'practice', correct: true, hints: 2, ms: 5000 }), 1);
  assert.equal(xpFor({ type: 'answer', mode: 'practice', correct: true, ms: 400 }), 0);
  assert.equal(xpFor({ type: 'answer', mode: 'exam', correct: true, ms: 5000 }), 0);
  assert.equal(xpFor({ type: 'checkpoint', net: 14, targetMet: true }), 24);
  assert.equal(xpFor({ type: 'checkpoint', net: -3, targetMet: false }), 0);
});

test('levels: three clean in a row per level, exam pace for level 5', () => {
  let m;
  for (let i = 0; i < 12; i++) m = levelStep(m, { clean: true, paced: false });
  assert.equal(m.lv, 4);
  m = levelStep(m, { clean: true, paced: true });
  m = levelStep(m, { clean: true, paced: false });
  assert.equal(m.prun, 0);
  for (let i = 0; i < 3; i++) m = levelStep(m, { clean: true, paced: true });
  assert.equal(m.lv, 5);
  assert.equal(levelStep({ lv: 2, run: 2 }, { clean: false }).run, 0);
  assert.equal(skillState({ lv: 3, run: 0 }, { box: 1, due: 0 }, 10), 'needs-review');
  assert.equal(skillState({ lv: 5 }, { box: 5, due: 0 }, 10), 'mastered');
  assert.equal(skillState(undefined), 'new');
});

test('mistake log: repeats bump the count, cap holds', () => {
  const list = [];
  upsertMistake(list, { id: 'a', n: 1 });
  upsertMistake(list, { id: 'b', n: 1 });
  upsertMistake(list, { id: 'a', n: 1 });
  assert.deepEqual(list.map((r) => [r.id, r.n]), [['b', 1], ['a', 2]]);
  const big = [];
  for (let i = 0; i < MISTAKE_CAP + 10; i++) upsertMistake(big, { id: String(i) });
  assert.equal(big.length, MISTAKE_CAP);
});

test('every section rebuilds a missed question from its id', () => {
  for (const [sid, mod] of Object.entries(SECTION_MODULES)) {
    for (const fam of mod.families.slice(0, 4)) {
      const item = fam.generate(makeRng(1234 + fam.id.length), { difficulty: fam.levels?.[0] ?? 1 });
      const row = mistakeRow(item, item.kind === 'mcq' ? { choice: 0 } : {}, { now: NOW });
      const back = regenerate(row, SECTION_MODULES);
      assert.ok(back, `${sid}:${fam.id} could not be rebuilt`);
      assert.equal(back.exact, true, `${sid}:${fam.id} rebuilt a different question`);
      assert.equal(back.item.prompt.text, item.prompt.text);
    }
  }
});

test('blank state has every v2 field', () => {
  const b = blankV2();
  for (const k of ['trend', 'mastery', 'activity', 'mistakes']) assert.ok(k in b);
});
