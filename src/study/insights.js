// Study insights: pure functions over the study log and state, used by the weekly review,
// the Study home "Next up" panel and the goal check. No DOM, no store: plain data in, data out.
export const DAY = 24 * 3600e3;

const rate = (k, n) => (n ? k / n : null);
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// One window (from, to]: checks, hints, try/review passes, pace, reviews, calibration, days.
export function windowStats({ log = [], study = {} }, from, to, now = to) {
  const ev = log.filter((e) => e.at > from && e.at <= to);
  const checks = ev.filter((e) => e.kind === 'check');
  const tries = ev.filter((e) => e.kind === 'try' || e.kind === 'review');
  const timed = tries.filter((e) => Array.isArray(e.ms) && e.ms.length && e.budgetMs > 0);
  const ratios = timed.flatMap((e) => e.ms.map((m) => m / e.budgetMs));
  // Calibration: confidence (1-5 mapped to 0-1) minus the share right in the last try. Positive = overconfident.
  const cal = Object.values(study).filter((x) => x.reflection?.at > from && x.reflection.at <= to && x.lastTry?.n && (x.reflection.after ?? x.reflection.before) != null)
    .map((x) => ((x.reflection.after ?? x.reflection.before) - 1) / 4 - x.lastTry.clean / x.lastTry.n);
  return {
    checks: checks.length,
    clean: rate(checks.filter((e) => e.clean).length, checks.length),
    hints: rate(checks.filter((e) => e.hints > 0).length, checks.length),
    tries: tries.length,
    passed: tries.filter((e) => e.n >= 3 && e.clean >= e.n).length,
    timedItems: ratios.length,
    paceMedian: median(ratios),
    inBudget: ratios.filter((r) => r <= 1).length,
    reviewsDone: ev.filter((e) => e.kind === 'review').length,
    // Still waiting: mastered lessons whose review date fell in this window and has passed.
    reviewsDue: Object.values(study).filter((x) => x.masteredAt != null && x.due > from && x.due <= to && x.due <= now).length,
    calGap: cal.length ? cal.reduce((a, b) => a + b, 0) / cal.length : null,
    calN: cal.length,
    days: new Set(ev.map((e) => new Date(e.at).toDateString())).size,
  };
}

export const weekStats = (data, now) => ({ cur: windowStats(data, now - 7 * DAY, now, now), prev: windowStats(data, now - 14 * DAY, now - 7 * DAY, now) });

const pct = (x) => `${Math.round(100 * x)}%`;

// The app's reading of a week: a few plain rules, each ending in one thing to do. Max 5.
export function readWeek(cur, prev, openBeliefCount = 0) {
  if (!cur.checks && !cur.tries) return ['Nothing logged in the last 7 days. Start with the one button under Next up on the Study home.'];
  const out = [];
  const up = (a, b, d) => a != null && b != null && a > b + d;
  if (up(cur.hints, prev.hints, 0.05) && !up(cur.clean, prev.clean, 0.05)) out.push(`Hint use went up (${pct(prev.hints)} to ${pct(cur.hints)}) but the clean rate did not: try every check without hints first, and open a hint only after one full attempt.`);
  else if (cur.hints != null && cur.hints >= 0.3) out.push(`You opened a hint on ${pct(cur.hints)} of checks: try without hints first.`);
  if (cur.clean != null && prev.clean != null && cur.clean < prev.clean - 0.1) out.push(`Your first-attempt clean rate fell from ${pct(prev.clean)} to ${pct(cur.clean)}: slow down on first attempts and read each question twice.`);
  if (!cur.timedItems) out.push('No timed questions this week: do the exam-pace try-it on a mastered lesson, so you know your speed as well as your accuracy.');
  else if (cur.paceMedian > 1) out.push(`Your median time is ${pct(cur.paceMedian)} of the exam budget: use the Speed section of the lesson, then retry at exam pace.`);
  if (cur.calGap != null && cur.calGap > 0.15) out.push('Your confidence ran above your results: test before rating yourself, answer the three questions first and rate after.');
  else if (cur.calGap != null && cur.calGap < -0.15) out.push('You score better than you rate yourself: trust the method and move on sooner.');
  if (cur.reviewsDue > cur.reviewsDone) out.push(`Reviews are piling up (${cur.reviewsDone} done, ${cur.reviewsDue} still due): do due reviews before new lessons.`);
  if (openBeliefCount >= 3) out.push(`${openBeliefCount} mistakes are still open: re-test the top one in the mistake log before new material.`);
  if (!out.length && cur.clean != null && prev.clean != null && cur.clean > prev.clean + 0.1) out.push(`Your clean rate rose from ${pct(prev.clean)} to ${pct(cur.clean)}: whatever you changed is working, so keep it.`);
  if (!out.length) out.push('No warning signs this week: keep the routine and add one exam-pace try-it.');
  return out.slice(0, 5);
}

// A study goal must say how, not only what: "review X from memory", not "Bayes".
const HOW = /\b(review\w*|re-?test\w*|test\w*|without hints?|no hints?|tim(e|ed|ing)|pace|explain\w*|recall\w*|from memory|retriev\w*|predict\w*|write|before|first|minutes?|daily|every|each|mistake log|slow\w*|check\w*)\b/i;
export const goalIsHow = (text) => { const t = String(text ?? '').trim(); return t.split(/\s+/).length >= 3 && HOW.test(t); };

// Ask "did you keep it?" once a week after the goal was set or last checked.
export const goalDue = (goal, now) => !!goal && now - Math.max(goal.at, ...(goal.checks || []).map((c) => c.at)) >= 7 * DAY;

// One next action, in order: a due review, an open-belief re-test, resume an unfinished
// lesson, the next unread lesson. lessons: [{ id, sections: [keys], masterable }] in book order.
export function pickNext({ lessons, study = {}, beliefs = [], log = [] }, now) {
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const due = lessons.filter((l) => study[l.id]?.masteredAt != null && study[l.id].due <= now).sort((a, b) => study[a.id].due - study[b.id].due);
  if (due.length) return { kind: 'review', id: due[0].id };
  const b = beliefs.find((x) => byId.has(x.unit?.lesson) || x.lessons?.some((id) => byId.has(id)));
  if (b) return { kind: 'retest', key: b.key };
  const lastAt = new Map();
  for (const e of log) if (e.lesson) lastAt.set(e.lesson, Math.max(lastAt.get(e.lesson) || 0, e.at));
  const unfinished = lessons.filter((l) => {
    const x = study[l.id];
    if (!x?.readAt || x.masteredAt != null || !x.lastSection) return false;
    return l.masterable || x.lastSection !== l.sections[l.sections.length - 1];
  }).sort((a, b2) => (lastAt.get(b2.id) ?? study[b2.id].readAt) - (lastAt.get(a.id) ?? study[a.id].readAt));
  if (unfinished.length) return { kind: 'resume', id: unfinished[0].id, section: study[unfinished[0].id].lastSection };
  const fresh = lessons.find((l) => study[l.id]?.readAt == null);
  return fresh ? { kind: 'start', id: fresh.id } : { kind: 'done' };
}

export function ago(t, now) {
  const d = Math.floor((now - t) / DAY);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}
