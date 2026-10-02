// Active minutes, daily goal and streak. Time only counts inside a session, with the tab
// visible and input in the last 90 s, so leaving the app open never inflates the minutes.
export const IDLE_MS = 90e3;
export const MAX_TICK_MS = 10e3;

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (now) => { const d = new Date(now); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n).getTime()); // calendar maths: safe across DST
}

export function creditTick({ now, lastTick, lastInputAt, hidden, inSession }, idle = IDLE_MS) {
  if (hidden || !inSession || lastTick == null || lastInputAt == null) return 0;
  if (now - lastInputAt > idle) return 0;
  return Math.max(0, Math.min(now - lastTick, MAX_TICK_MS));
}

const met = (days, key, goalMs) => (days[key]?.ms || 0) >= goalMs;

// Current and best streak in days. An unfinished today never breaks the streak.
export function streak(days = {}, frozen = [], today, goalMin = 10) {
  const goalMs = goalMin * 60e3;
  const ok = (k) => met(days, k, goalMs) || frozen.includes(k);
  let cur = 0;
  let k = ok(today) ? today : addDays(today, -1);
  while (ok(k)) { cur += 1; k = addDays(k, -1); }
  const keys = [...new Set([...Object.keys(days), ...frozen])].sort();
  let best = 0, run = 0, prev = null;
  for (const key of keys) {
    if (!ok(key)) { run = 0; prev = key; continue; }
    run = prev && addDays(prev, 1) === key && ok(prev) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return { current: cur, best: Math.max(best, cur) };
}

// Spend freezes on the days missed since the last goal day, so one bad day doesn't reset
// a long streak. Freezes come from perfect checkpoints (max 2 held).
export function applyFreezes(activity, today, goalMin = 10) {
  const a = { ...activity, frozen: [...(activity.frozen || [])] };
  const goalMs = goalMin * 60e3;
  const ok = (k) => met(a.days || {}, k, goalMs) || a.frozen.includes(k);
  let k = addDays(today, -1);
  const missed = [];
  for (let i = 0; i < 60 && !ok(k); i++) { missed.push(k); k = addDays(k, -1); }
  if (!ok(k) || !missed.length || missed.length > (a.freezes || 0)) return a;
  a.frozen.push(...missed);
  a.freezes -= missed.length;
  return a;
}
