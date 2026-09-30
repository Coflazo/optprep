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
export function recordTry(store, id, { n, clean }, now = Date.now()) {
  const st = studyState(store);
  const cur = st[id] || {};
  const pass = n >= 3 && clean >= n;
  const box = pass ? Math.min((cur.box || 0) + 1, REVIEW.length - 1) : 1;
  st[id] = { ...cur, readAt: cur.readAt ?? now, box, due: now + (pass ? REVIEW[box] : 0), masteredAt: pass ? (cur.masteredAt ?? now) : cur.masteredAt, lastTry: { n, clean, at: now } };
  store.save();
  return pass;
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
