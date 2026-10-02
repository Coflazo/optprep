// Saved-state versions. v1 (oa-trainer:v1) → v2 (optprep:v2) copies every v1 key as-is
// and adds the new progress fields. Pure: no storage, no clock unless passed in.
import { SRS_INTERVALS } from './srs.js';
import { dayKey } from './activity.js';

export const VERSION = 2;

export const blankV2 = () => ({
  version: VERSION, runs: [], stats: {}, srs: {}, zapn: {}, settings: {}, sets: {}, calibration: [],
  trend: {}, mastery: {}, activity: { days: {}, xpBase: 0, freezes: 0, frozen: [] }, mistakes: [],
});

// The exam formats v1 runs were taken under, so readiness can tell a 60 s run from a 45 s one.
const V1_EXAM = {
  bto: { count: 20, perItemSeconds: 90 }, nl: { count: 26, totalSeconds: 1500 }, ll: { count: 15, perItemSeconds: 90 },
  iv: { count: 18, perItemSeconds: 60 }, ob: { count: 20, totalSeconds: 480 },
};

function fromV1(raw, now) {
  const st = { ...blankV2(), ...raw, version: VERSION, migratedAt: now };
  st.trend = {};
  st.mastery = {};
  let correct = 0;
  for (const [k, s] of Object.entries(raw.stats || {})) {
    correct += s.correct || 0;
    const sr = raw.srs?.[k];
    const at = sr ? sr.due - SRS_INTERVALS[sr.box] : now;
    const n = Math.min(s.n || 0, 20);
    st.trend[k] = { n, c: s.n ? (n * s.correct) / s.n : 0, at };
    const acc = ((s.correct || 0) + 1) / ((s.n || 0) + 2);
    st.mastery[k] = { lv: acc >= 0.7 ? Math.max(0, Math.min(3, (sr?.box ?? 1) - 2)) : 0, run: 0, prun: 0, at };
  }
  const days = {};
  const mark = (t) => { if (Number.isFinite(t)) days[dayKey(t)] = { ms: 0, xp: 0, bf: 1 }; };
  for (const r of raw.runs || []) mark(r.finishedAt);
  for (const e of raw.studyMeta?.log || []) mark(e.at);
  for (const list of Object.values(raw.zapn || {})) for (const r of list) mark(r.at);
  for (const sec of Object.values(raw.sets || {})) for (const r of Object.values(sec)) mark(r.at);
  st.activity = { days, xpBase: 2 * correct, freezes: 0, frozen: [] };
  st.runs = (raw.runs || []).map((r) => (r.timing ? r : { ...r, timing: V1_EXAM[r.section] ?? null }));
  st.settings = { ...(raw.settings || {}), preset: raw.settings?.preset ?? { id: 'kickstarter' }, presetConfirm: true };
  st.mistakes = [];
  return st;
}

// A save from a file or a gist is untrusted. Every known field must have the container type
// the app reads, and lists must hold records, or the whole save is refused: a half-valid
// save would be stored and then break every page at boot.
const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
const records = (list) => list.every((x) => kind(x) === 'object');
function shapeOk(raw) {
  const blank = blankV2();
  for (const k of Object.keys(blank)) {
    if (!(k in raw)) continue;
    if (kind(raw[k]) !== kind(blank[k])) return false;
    if (Array.isArray(raw[k]) && !records(raw[k])) return false;
  }
  const days = raw.activity?.days;
  return days === undefined || kind(days) === 'object';
}

// → { state, from } or null when the input is not a known save.
export function migrate(raw, now = Date.now()) {
  if (kind(raw) !== 'object' || !Array.isArray(raw.runs) || !shapeOk(raw)) return null;
  if (raw.version === VERSION) return { state: { ...blankV2(), ...raw }, from: VERSION };
  if (raw.version === 1) return { state: fromV1(raw, now), from: 1 };
  return null;
}
