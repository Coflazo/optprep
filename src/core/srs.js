// Leitner boxes keyed by "section:family". A miss drops the family to box 1 (due
// now); each hit moves it up one box and pushes the next review further out.
// Intervals are short because the assessment is close.
export const SRS_INTERVALS = [0, 0, 10 * 60e3, 60 * 60e3, 24 * 3600e3, 3 * 24 * 3600e3];

export function srsRecord(srs, key, correct, now = Date.now()) {
  const cur = srs[key] || { box: 1, due: now };
  const box = correct ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : 1;
  return { ...srs, [key]: { box, due: now + SRS_INTERVALS[box] } };
}

export function srsDue(srs, now = Date.now()) {
  return Object.entries(srs)
    .filter(([, v]) => v.box < SRS_INTERVALS.length - 1 && v.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([k]) => k);
}
