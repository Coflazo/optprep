// Study progress per lesson: read, mastered (3/3 fresh questions without hints), and
// spaced review. Stored inside the main store state so it syncs and backs up with it.
import { SRS_INTERVALS } from '../core/srs.js';

const REVIEW = [0, 24 * 3600e3, 3 * 24 * 3600e3, 7 * 24 * 3600e3, 16 * 24 * 3600e3, 35 * 24 * 3600e3];
void SRS_INTERVALS;

export function studyState(store) {
  store.state.study = store.state.study || {};
  return store.state.study;
}

export function markRead(store, id, now = Date.now()) {
  const st = studyState(store);
  st[id] = { ...(st[id] || {}), readAt: st[id]?.readAt ?? now };
  store.save();
}

// A try-it result. 3/3 clean moves the lesson up a review box; anything less drops it to box 1.
// `ms` (per-item times) and `budgetMs` (the exam's time per item) add the exam-pace tier:
// right first time AND every item inside the budget.
export function recordTry(store, id, { n, clean, ms, budgetMs, kind = 'try' }, now = Date.now()) {
  const st = studyState(store);
  const cur = st[id] || {};
  const pass = n >= 3 && clean >= n;
  const paced = pass && Array.isArray(ms) && ms.length === n && budgetMs > 0 && ms.every((m) => m <= budgetMs);
  const box = pass ? Math.min((cur.box || 0) + 1, REVIEW.length - 1) : 1;
  st[id] = { ...cur, readAt: cur.readAt ?? now, box, due: now + (pass ? REVIEW[box] : 0), masteredAt: pass ? (cur.masteredAt ?? now) : cur.masteredAt,
    pacedAt: paced ? (cur.pacedAt ?? now) : cur.pacedAt, lastTry: { n, clean, at: now, ...(ms ? { ms, budgetMs, paced } : {}) } };
  logEvent(store, { kind, lesson: id, n, clean, ...(ms ? { ms, budgetMs, paced } : {}) }, now);
  store.save();
  return pass;
}

// Scaffolds fade only while the last try was clean: a failed review switches them back on.
export const scaffoldsOff = (store, id) => { const x = studyState(store)[id]; return !!(x?.masteredAt != null && x.lastTry && x.lastTry.clean >= x.lastTry.n); };
export const pacedOf = (store, id) => studyState(store)[id]?.pacedAt != null;

export function setLastSection(store, id, key) {
  const st = studyState(store);
  if (st[id]?.lastSection === key) return;
  st[id] = { ...(st[id] || {}), lastSection: key };
  store.save();
}

export function statusOf(store, id, now = Date.now()) {
  const x = studyState(store)[id];
  if (!x) return 'new';
  if (x.masteredAt != null && x.due != null && x.due <= now) return 'review';
  if (x.masteredAt != null) return 'mastered';
  return x.readAt != null ? 'read' : 'new';
}

export function dueLessons(store, now = Date.now()) {
  return Object.entries(studyState(store)).filter(([, x]) => x.masteredAt != null && x.due <= now).map(([id]) => id);
}

// Self-regulated learning record: confidence before/after, hardest step, plan for next time.
export function recordReflection(store, id, data, now = Date.now()) {
  const st = studyState(store);
  const cur = st[id] || {};
  st[id] = { ...cur, reflection: { ...(cur.reflection || {}), ...data, at: now } };
  store.save();
  return st[id];
}

// Knowledge components: every check scope (a unit of teaching) is tracked separately, so a
// lesson can be "read" while one of its units is still weak. A unit whose latest first
// attempt was wrong comes back on the study home until it is answered right.
export function recordUnit(store, id, unit, clean, now = Date.now()) {
  if (!store || !unit) return;
  const st = studyState(store);
  const cur = st[id] || {};
  const units = { ...(cur.units || {}) };
  const u = units[unit] || { n: 0, clean: 0 };
  units[unit] = { n: u.n + 1, clean: u.clean + (clean ? 1 : 0), last: clean, at: now };
  st[id] = { ...cur, units };
  store.save();
}

export function weakUnits(store) {
  const out = [];
  for (const [id, x] of Object.entries(studyState(store))) for (const [unit, u] of Object.entries(x.units || {})) if (u.last === false) out.push({ id, unit, ...u });
  return out.sort((a, b) => b.at - a.at);
}

// Study-wide records that are not per lesson: an event log (for the weekly review), misses
// grouped by the false belief behind them (the mistake log), and the learner's study goal.
export function studyMeta(store) {
  store.state.studyMeta = store.state.studyMeta || { log: [], beliefs: {}, goal: null };
  return store.state.studyMeta;
}

export function logEvent(store, ev, now = Date.now()) {
  if (!store) return;
  const m = studyMeta(store);
  m.log.push({ ...ev, at: now });
  if (m.log.length > 4000) m.log.splice(0, m.log.length - 4000);
}

export const beliefKey = (text) => String(text).toLowerCase().replace(/\d+(\.\d+)?/g, '#').replace(/\s+/g, ' ').trim().slice(0, 140);

// A miss: the belief behind it (a trap text, or the step the learner marked), where it
// happened, and the error type (slip | idea | method | misread) when the learner named it.
export function recordMiss(store, { belief, lesson, unit, type }, now = Date.now()) {
  if (!store || !belief) return;
  const m = studyMeta(store);
  const k = beliefKey(belief);
  const b = m.beliefs[k] || { text: belief, count: 0, lessons: [], types: {}, clean: [], first: now };
  b.count += 1; b.last = now; b.open = true; b.clean = [];
  if (lesson && !b.lessons.includes(lesson)) b.lessons.push(lesson);
  if (unit) b.unit = { lesson, unit };
  if (type) b.types[type] = (b.types[type] || 0) + 1;
  m.beliefs[k] = b;
  logEvent(store, { kind: 'miss', lesson, belief: k, type }, now);
  store.save();
}

// Re-test: a belief clears after two clean answers on different days.
export function recordRetest(store, key, clean, now = Date.now()) {
  const b = studyMeta(store).beliefs[key];
  if (!b) return false;
  const day = new Date(now).toDateString();
  if (!clean) b.clean = [];
  else if (!b.clean.includes(day)) b.clean.push(day);
  b.open = b.clean.length < 2;
  logEvent(store, { kind: 'retest', belief: key, clean }, now);
  store.save();
  return !b.open;
}

export function setBeliefPlan(store, key, plan) {
  const b = studyMeta(store).beliefs[key];
  if (b) { b.plan = plan; store.save(); }
}

export const openBeliefs = (store) => Object.entries(studyMeta(store).beliefs).filter(([, b]) => b.open).map(([key, b]) => ({ key, ...b })).sort((a, b) => b.count - a.count || b.last - a.last);

export function setGoal(store, text, now = Date.now()) {
  const m = studyMeta(store);
  if (m.goal) (m.pastGoals ||= []).push(m.goal);
  m.goal = { text, at: now, checks: [] };
  store.save();
}
export function checkGoal(store, verdict, now = Date.now()) { const g = studyMeta(store).goal; if (g) { g.checks.push({ verdict, at: now }); store.save(); } }
