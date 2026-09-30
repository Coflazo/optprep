import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { buildLibrary, librarySets, setCount } from '../../core/library.js';
import { runExam, runFeedbackSession } from '../runner.js';

// Numbered question sets: the whole fixed library, exam-sized chunks, worked in order.
export function setsPage(root, { store, id }) {
  const cfg = SECTIONS[id];
  const mod = SECTION_MODULES[id];
  const lib = buildLibrary(mod, { size: setCount(cfg.exam.count) * cfg.exam.count });
  const sets = librarySets(lib, cfg.exam.count);
  const done = store.sets(id);
  const fmt = (r) => (id === 'iv' ? `${r.score.toFixed(2)}/${r.max}` : `${r.score}/${r.max}`);
  const nDone = sets.filter((_, i) => done[i + 1]).length;
  mount(root,
    h('p', { class: 'muted' }, h('a', { href: `#/s/${id}` }, cfg.title), ' / Question sets'),
    h('h1', {}, `${cfg.title}: ${lib.length} questions in ${sets.length} sets`),
    h('p', { class: 'muted' }, `Every set is a fixed, exam-sized group of ${cfg.exam.count} different questions, easiest first. Practise a set with full feedback, or run it timed under the real rules. ${nDone} of ${sets.length} sets done.`),
    h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Set'), h('th', {}, 'Questions'), h('th', {}, 'Last'), h('th', {}, 'Best'), h('th', {}))),
      h('tbody', {}, sets.map((items, i) => {
        const n = i + 1;
        const r = done[n];
        return h('tr', {},
          h('td', { class: 'num' }, `Set ${n}`),
          h('td', { class: 'num muted' }, `${i * cfg.exam.count + 1}–${i * cfg.exam.count + items.length}`),
          h('td', { class: 'num' }, r ? `${fmt(r)} (${r.mode})` : '—'),
          h('td', { class: 'num' }, r ? (id === 'iv' ? r.best.toFixed(2) : String(r.best)) : '—'),
          h('td', { style: { textAlign: 'right', whiteSpace: 'nowrap' } },
            h('a', { class: 'btn small', href: `#/s/${id}/sets/${n}/practice` }, 'Practise'), ' ',
            h('a', { class: 'btn small', href: `#/s/${id}/sets/${n}/timed` }, 'Timed')));
      })))));
}

export function setRunPage(root, { store, id, n, mode }) {
  const cfg = SECTIONS[id];
  const sets = librarySets(buildLibrary(SECTION_MODULES[id], { size: setCount(cfg.exam.count) * cfg.exam.count }), cfg.exam.count);
  const items = sets[n - 1];
  if (!items) return mount(root, h('h1', {}, 'No such set'));
  if (mode === 'timed') return runExam(root, { sectionId: id, store, items, setNumber: n });
  return runFeedbackSession(root, { sectionId: id, mode: 'practice', items, store, setNumber: n, title: `${cfg.title} · Set ${n}` });
}
