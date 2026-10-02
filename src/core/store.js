// Progress lives in the browser (localStorage) with a memory fallback, so the app still
// works in a private window or when storage is blocked. Saves never overwrite data this
// version cannot read, and the old v1 key is left untouched as a backup.
import { blankV2, migrate, VERSION } from './migrate.js';
import { trendStep } from './patterns.js';
import { levelStep, xpFor, MAX_FREEZES } from './progression.js';
import { upsertMistake } from './mistakes.js';
import { dayKey, streak, applyFreezes } from './activity.js';

export const KEY = 'optprep:v2';
export const LEGACY_KEY = 'oa-trainer:v1';
export const STATE_BUDGET = 2_000_000; // characters of JSON; the browser allows about 5 MB per site

export function memoryBackend() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function defaultBackend() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* blocked */ }
  return memoryBackend();
}

const read = (backend, k) => { try { return backend.getItem(k); } catch { return null; } };

// Trim the bulky history first so a full quota never loses lessons, stats or settings.
export function compact(state, now = Date.now()) {
  state.mistakes = (state.mistakes || []).slice(-250);
  if (state.studyMeta?.log) state.studyMeta.log = state.studyMeta.log.slice(-2000);
  state.calibration = (state.calibration || []).slice(-1000);
  const old = now - 90 * 24 * 3600e3;
  state.runs = (state.runs || []).map((r) => (r.finishedAt < old && r.items ? { ...r, items: undefined } : r));
  return state;
}

// hooks: optional { answer(row), run(run), state(state) } used by the backend sync.
export function makeStore(backend = defaultBackend(), hooks = {}, { clock = () => Date.now() } = {}) {
  let state = blankV2();
  let readOnly = false;
  let storageFull = false;
  let bytes = 0;
  let migratedFrom = null;

  const raw = read(backend, KEY);
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw);
      const m = migrate(parsed, clock());
      if (m) state = m.state; else readOnly = true; // a newer or unknown save: keep it, work in memory
    } catch { readOnly = true; }
  } else {
    const legacy = read(backend, LEGACY_KEY);
    if (legacy != null) {
      try { const m = migrate(JSON.parse(legacy), clock()); if (m) { state = m.state; migratedFrom = m.from; } } catch { /* unreadable v1: start fresh, v1 stays as it is */ }
    }
  }

  const save = () => {
    if (readOnly) return;
    let text = JSON.stringify(state);
    if (text.length > STATE_BUDGET) { compact(state, clock()); text = JSON.stringify(state); }
    try { backend.setItem(KEY, text); storageFull = false; } catch {
      compact(state, clock()); text = JSON.stringify(state);
      try { backend.setItem(KEY, text); storageFull = false; } catch { storageFull = true; }
    }
    bytes = text.length;
    hooks.state?.(state);
  };
  if (migratedFrom != null) save();

  const today = () => dayKey(clock());
  const day = () => (state.activity.days[today()] = state.activity.days[today()] || { ms: 0, xp: 0 });
  const addXp = (n) => { if (n > 0) day().xp += n; };

  return {
    get state() { return state; },
    get readOnly() { return readOnly; },
    get storageFull() { return storageFull; },
    get bytes() { return bytes; },
    get migratedFrom() { return migratedFrom; },
    save,
    // One answer from any mode. Updates stats, the recency trend, the skill level, XP and
    // the mistake log, then saves once.
    recordAnswer(section, family, { correct, ms = 0, confidence, difficulty, score, hints = 0, mode = 'practice', fresh = true, budgetMs, miss } = {}) {
      const k = `${section}:${family}`;
      const now = clock();
      const s = state.stats[k] || { n: 0, correct: 0, ms: 0 };
      s.n += 1; s.correct += correct ? 1 : 0; s.ms += ms;
      state.stats[k] = s;
      state.trend[k] = trendStep(state.trend[k], correct, now);
      const clean = !!correct && !hints && fresh && mode !== 'exam';
      state.mastery[k] = levelStep(state.mastery[k], { clean, paced: !!budgetMs && ms > 0 && ms <= budgetMs }, now);
      addXp(xpFor({ type: 'answer', mode, correct, hints, ms }));
      if (!correct && miss) upsertMistake(state.mistakes, miss);
      if (confidence != null) {
        state.calibration.push({ section, confidence, correct: !!correct });
        if (state.calibration.length > 2000) state.calibration.splice(0, state.calibration.length - 2000);
      }
      hooks.answer?.({ section, family, correct: !!correct, ms, confidence: confidence ?? null, difficulty: difficulty ?? null, score: score ?? null, item_id: miss?.id ?? null, mode, hints, belief: miss?.belief ?? null, at: now / 1000 });
      save();
    },
    recordXp(n) { addXp(n); save(); },
    recordRun(run) {
      const r = { finishedAt: clock(), ...run };
      state.runs.push(r);
      if (run.mode === 'exam' || run.mode === 'set') {
        addXp(xpFor({ type: 'checkpoint', net: run.score, targetMet: run.targetMet }));
        if (run.perfect) state.activity.freezes = Math.min(MAX_FREEZES, (state.activity.freezes || 0) + 1);
      }
      hooks.run?.(r);
      save();
    },
    runs(section, mode) {
      return state.runs.filter((r) => r.section === section && (!mode || r.mode === mode));
    },
    recordZapn(game, result) {
      (state.zapn[game] = state.zapn[game] || []).push({ at: clock(), ...result });
      addXp(xpFor({ type: 'game' }));
      save();
    },
    zapnRuns(game) { return state.zapn[game] || []; },
    recordSet(section, n, result) {
      const sec = (state.sets[section] = state.sets[section] || {});
      const prev = sec[n];
      sec[n] = { ...result, at: clock(), best: Math.max(result.score, prev?.best ?? -Infinity), attempts: (prev?.attempts || 0) + 1 };
      save();
    },
    sets(section) { return state.sets?.[section] || {}; },
    stats() { return state.stats; },
    trend() { return state.trend; },
    mastery() { return state.mastery; },
    mistakes() { return state.mistakes; },
    get srs() { return state.srs; },
    set srs(v) { state.srs = v; save(); },
    settings() { return state.settings; },
    setSetting(k, v) { state.settings[k] = v; save(); },
    // Daily activity. creditMs is called by the session ticker; it only touches memory,
    // the next save (or pagehide) writes it.
    creditMs(ms) { if (ms > 0) day().ms += ms; },
    goalMin() { return state.settings.dailyGoalMin ?? 10; },
    xpTotal() { return (state.activity.xpBase || 0) + Object.values(state.activity.days).reduce((a, d) => a + (d.xp || 0), 0); },
    streak() {
      state.activity = applyFreezes(state.activity, today(), this.goalMin());
      return { ...streak(state.activity.days, state.activity.frozen, today(), this.goalMin()), freezes: state.activity.freezes || 0 };
    },
    todayMs() { return state.activity.days[today()]?.ms || 0; },
    exportJSON() { return JSON.stringify(state, null, 2); },
    // Replace local state with a server snapshot (used once, when this browser has no progress).
    adopt(snapshot) {
      const m = migrate(snapshot, clock());
      if (!m) return false;
      state = m.state;
      save();
      return true;
    },
    importJSON(text) {
      const m = migrate(JSON.parse(text), clock());
      if (!m) throw new Error('Not an OptPrep backup (wrong version or shape)');
      state = m.state;
      readOnly = false;
      save();
    },
    reset() { state = blankV2(); readOnly = false; save(); },
  };
}

export { VERSION };
