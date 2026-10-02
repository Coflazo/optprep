// A section's roadmap, drawn as its answer sheet: units from Foundations to Exam pace,
// one numbered row per lesson, skill or checkpoint, five level bubbles per skill, and a
// single current row. The exam format and question library sit in the header field.
import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { REPORTED, SOURCES } from '../../../config/presets.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { srsDue } from '../../core/srs.js';
import { roadmap } from '../../core/path.js';
import { readiness } from '../../core/readiness.js';
import { buildLibrary, librarySets, setCount } from '../../core/library.js';
import { lessonForFamily, BOOK_BY_ID } from '../../study/content/index.js';
import { lessonsOf } from '../../study/schema.js';
import { statusOf } from '../../study/progress.js';
import { bubbles, stamp, setRail } from '../sheet.js';
import { icon } from '../icons.js';
import { formatLine } from './format.js';

function checkpoints(store, id) {
  const cfg = SECTIONS[id];
  const drills = store.runs(id, 'drill');
  const sets = Object.values(store.sets(id));
  return [
    { id: 'drill', title: 'Drill: 10 questions on the clock', href: `#/run/${id}/drill`, passed: drills.some((r) => r.max && r.score / r.max >= 0.7) },
    { id: 'set', title: 'Timed set from the library', href: `#/s/${id}/sets`, passed: sets.some((s) => s.mode === 'timed') },
    { id: 'exam', title: `Exam replica: ${formatLine(cfg)}`, href: `#/run/${id}/exam`, passed: readiness(store.runs(id, 'exam'), cfg.target).ready },
  ];
}

export function sectionMap(store, id) {
  const mod = SECTION_MODULES[id];
  const book = BOOK_BY_ID[id];
  const lessons = book && !book.pending ? lessonsOf(book).filter((l) => l.kind !== 'family' && l.kind !== 'game').map((l) => ({ id: l.id, title: l.title, status: statusOf(store, l.id) })) : [];
  return roadmap({
    sectionId: id, families: mod.families, lessons, checkpoints: checkpoints(store, id),
    mastery: store.mastery(), srs: store.srs, lessonFor: (fid) => lessonForFamily(id, fid),
  });
}

function row(r, n, id) {
  const actions = r.kind === 'skill'
    ? [r.lesson ? h('a', { class: 'btn small ghost', href: `#/study/lesson/${r.lesson}` }, 'Lesson') : h('a', { class: 'btn small ghost', href: `#/s/${id}/learn/${r.id}` }, 'Learn'),
      h('a', { class: `btn small${r.current ? ' primary' : ''}`, href: r.href }, r.state === 'needs-review' ? 'Review' : 'Practise')]
    : [h('a', { class: `btn small${r.current ? ' primary' : ''}`, href: r.href }, r.kind === 'lesson' ? 'Read' : 'Start')];
  return h('li', { class: `grid-row${r.current ? ' is-current' : ''}${r.later ? ' is-later' : ''}${r.done ? ' is-done' : ''}`, id: r.current ? 'current-row' : null, 'aria-current': r.current ? 'step' : null },
    h('span', { class: 'grid-num num' }, String(n)),
    h('span', { class: 'grid-body' },
      h('span', { class: 'grid-title' }, r.title),
      r.kind === 'skill' && r.skill ? h('span', { class: 'grid-skill' }, r.skill) : null,
      r.current ? h('span', { class: 'you-are-here' }, icon('pencil', { size: 14 }), 'You are here') : null),
    h('span', { class: 'grid-level' },
      r.kind === 'skill' ? bubbles(5, r.lv, { label: `Level ${r.lv} of 5`, current: r.current }) : bubbles(1, r.done ? 1 : 0, { label: r.done ? 'Done' : 'Not done', current: r.current })),
    h('span', { class: 'grid-state' }, r.state !== 'new' || r.current ? stamp(r.state) : null),
    h('span', { class: 'grid-actions' }, actions));
}

export function sectionPage(root, { store, id }) {
  const cfg = SECTIONS[id];
  const mod = SECTION_MODULES[id];
  if (!cfg || !mod) return mount(root, h('h1', {}, 'Unknown task'), h('p', {}, h('a', { href: '#/' }, 'Back to your sheet')));
  const map = sectionMap(store, id);
  const lib = buildLibrary(mod, { size: setCount(cfg.exam.count) * cfg.exam.count });
  const nSets = librarySets(lib, cfg.exam.count).length;
  const due = srsDue(store.srs).filter((k) => k.startsWith(`${id}:`)).length;
  const rep = REPORTED[id];
  setRail(map.skillsTotal ? map.skillsDone / map.skillsTotal : 0, `${map.skillsDone} of ${map.skillsTotal} skills at level 3`);
  let n = 0;
  mount(root,
    h('h1', {}, cfg.title),
    h('p', { class: 'lede' }, cfg.blurb),
    h('section', { class: 'field format-field' },
      h('h2', { class: 'field-label' }, 'Exam replica'),
      h('p', { class: 'num-ish' }, formatLine(cfg)),
      h('p', { class: 'muted small-note' }, `Trainer bar: ${cfg.target.label}. `, rep ? ['Reported pass: ', h('span', { class: 'num' }, rep.text), ' (', h('a', { href: SOURCES[rep.source].url, target: '_blank', rel: 'noopener' }, SOURCES[rep.source].label), ').'] : 'No pass line is reported for this task.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: `#/run/${id}/practice` }, 'Practise'),
        h('a', { class: 'btn', href: `#/run/${id}/exam` }, 'Exam replica'),
        ...cfg.variants.map((v, i) => h('a', { class: 'btn ghost', href: `#/run/${id}/exam/v${i}` }, v.label)),
        due ? h('a', { class: 'btn ghost', href: `#/run/${id}/mistakes` }, `Review ${due} due`) : null,
        h('a', { class: 'btn ghost', href: `#/s/${id}/sets` }, `Library: ${nSets} sets`),
        BOOK_BY_ID[id] && !BOOK_BY_ID[id].pending ? h('a', { class: 'btn ghost', href: `#/study/book/${id}` }, 'Study book') : null)),
    map.units.map((u) => h('section', { class: 'unit' },
      h('header', { class: 'unit-head' },
        h('h2', {}, u.title),
        h('span', { class: 'num muted' }, `${u.done} of ${u.total}`)),
      h('ol', { class: 'grid', start: n + 1 }, u.rows.map((r) => row(r, ++n, id))))));
  // Bring the current row into view on arrival, without animating a keyboard-driven jump.
  const cur = root.querySelector('#current-row');
  if (cur && cur.getBoundingClientRect().top > window.innerHeight * 0.7) cur.scrollIntoView({ block: 'center' });
}
