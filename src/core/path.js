// The roadmap for one section, drawn as an answer grid: units from Foundations to Exam
// pace, one row per lesson, skill or checkpoint. Pure: data in, rows out. Exactly one row
// is "current" so the page always shows a single place to start.
import { skillState, MAX_LEVEL } from './progression.js';

export const UNITS = [
  { band: 'foundations', title: 'Foundations' },
  { band: 'easy', title: 'Easy' },
  { band: 'medium', title: 'Medium' },
  { band: 'hard', title: 'Hard' },
  { band: 'exam', title: 'Exam pace' },
];
export const SKILLED = 3; // a skill row counts as done at level 3; levels 4 and 5 are speed

export function bandOf(family) {
  const lo = Math.min(...(family.levels?.length ? family.levels : [1]));
  return lo <= 1 ? 'easy' : lo === 2 ? 'medium' : 'hard';
}

// lessons: the section book's non-family lessons [{ id, title, status }] where status is
// 'new' | 'read' | 'mastered' | 'review'. checkpoints: [{ id, title, href, passed }].
export function roadmap({ sectionId, families, lessons = [], checkpoints = [], mastery = {}, srs = {}, now = Date.now(), lessonFor = () => null }) {
  const rows = { foundations: [], easy: [], medium: [], hard: [], exam: [] };
  for (const l of lessons) rows.foundations.push({ kind: 'lesson', id: l.id, title: l.title, done: l.status === 'mastered' || l.status === 'review', state: l.status === 'review' ? 'needs-review' : l.status === 'mastered' ? 'mastered' : l.status === 'read' ? 'learning' : 'new', href: `#/study/lesson/${l.id}` });
  for (const f of families) {
    const key = `${sectionId}:${f.id}`;
    const m = mastery[key];
    const lv = m?.lv || 0;
    rows[bandOf(f)].push({
      kind: 'skill', id: f.id, key, title: f.title, skill: f.skill, lv, done: lv >= SKILLED,
      state: skillState(m, srs[key], now), lesson: lessonFor(f.id),
      href: `#/run/${sectionId}/practice/${f.id}`,
    });
  }
  for (const c of checkpoints) rows.exam.push({ kind: 'checkpoint', ...c, done: !!c.passed, state: c.passed ? 'mastered' : 'new' });

  const units = UNITS.map((u) => ({ ...u, rows: rows[u.band] })).filter((u) => u.rows.length);
  let current = null;
  for (let ui = 0; ui < units.length && !current; ui++) {
    const ri = units[ui].rows.findIndex((r) => !r.done);
    if (ri >= 0) current = { unit: ui, row: ri };
  }
  // Everything done: the current row is the last checkpoint (keep the exam habit).
  if (!current && units.length) current = { unit: units.length - 1, row: units[units.length - 1].rows.length - 1 };
  units.forEach((u, ui) => {
    u.done = u.rows.filter((r) => r.done).length;
    u.total = u.rows.length;
    u.rows.forEach((r, ri) => { r.current = !!current && current.unit === ui && current.row === ri; r.later = !!current && ui > current.unit; });
  });
  const skills = units.flatMap((u) => u.rows).filter((r) => r.kind === 'skill');
  return {
    units, current,
    skillsDone: skills.filter((r) => r.done).length,
    skillsTotal: skills.length,
    mastered: skills.filter((r) => r.lv >= MAX_LEVEL).length,
    due: skills.filter((r) => r.state === 'needs-review').length,
  };
}

// The single next step across the whole preset: a due review first, then the current row
// of the first section whose path is unfinished, then that section's exam.
export function nextStep(maps) {
  for (const { id, map } of maps) {
    const row = map.units.flatMap((u) => u.rows).find((r) => r.state === 'needs-review');
    if (row) return { sectionId: id, row, why: 'review' };
  }
  for (const { id, map } of maps) {
    if (!map.current) continue;
    const row = map.units[map.current.unit].rows[map.current.row];
    if (!row.done) return { sectionId: id, row, why: 'continue' };
  }
  const first = maps.find((m) => m.map.current);
  return first ? { sectionId: first.id, row: first.map.units[first.map.current.unit].rows[first.map.current.row], why: 'exam' } : null;
}
