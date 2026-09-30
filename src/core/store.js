// Progress lives in the browser (localStorage) with a memory fallback, so the app
// still works in a private window or when storage is blocked. Export/import is the
// backup path.
const KEY = 'oa-trainer:v1';
const VERSION = 1;
const blank = () => ({ version: VERSION, runs: [], stats: {}, srs: {}, zapn: {}, settings: {} });

export function memoryBackend() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

function defaultBackend() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* blocked */ }
  return memoryBackend();
}

export function makeStore(backend = defaultBackend()) {
  let state = blank();
  try {
    const raw = backend.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw); if (parsed.version === VERSION) state = { ...blank(), ...parsed }; }
  } catch { /* unreadable storage: start fresh in memory */ }
  const save = () => { try { backend.setItem(KEY, JSON.stringify(state)); } catch { /* keep in memory */ } };

  return {
    get state() { return state; },
    save,
    recordAnswer(section, family, { correct, ms = 0, confidence } = {}) {
      const k = `${section}:${family}`;
      const s = state.stats[k] || { n: 0, correct: 0, ms: 0 };
      s.n += 1; s.correct += correct ? 1 : 0; s.ms += ms;
      state.stats[k] = s;
      if (confidence != null) {
        state.calibration = state.calibration || [];
        state.calibration.push({ section, confidence, correct: !!correct });
        if (state.calibration.length > 2000) state.calibration.splice(0, state.calibration.length - 2000);
      }
      save();
    },
    recordRun(run) {
      state.runs.push({ finishedAt: Date.now(), ...run });
      save();
    },
    runs(section, mode) {
      return state.runs.filter((r) => r.section === section && (!mode || r.mode === mode));
    },
    recordZapn(game, result) {
      (state.zapn[game] = state.zapn[game] || []).push({ at: Date.now(), ...result });
      save();
    },
    zapnRuns(game) { return state.zapn[game] || []; },
    stats() { return state.stats; },
    get srs() { return state.srs; },
    set srs(v) { state.srs = v; save(); },
    settings() { return state.settings; },
    setSetting(k, v) { state.settings[k] = v; save(); },
    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (parsed?.version !== VERSION || !Array.isArray(parsed.runs)) throw new Error('Not a trainer backup (wrong version or shape)');
      state = { ...blank(), ...parsed };
      save();
    },
    reset() { state = blank(); save(); },
  };
}
