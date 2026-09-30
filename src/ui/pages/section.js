import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { srsDue } from '../../core/srs.js';
import { formatLine, sectionStatus } from './home.js';
import { buildLibrary, librarySets, setCount } from '../../core/library.js';

export function sectionPage(root, { store, id }) {
  const cfg = SECTIONS[id];
  const mod = SECTION_MODULES[id];
  if (!cfg || !mod) return mount(root, h('h1', {}, 'Unknown section'));
  if (!mod.families.length) {
    return mount(root, h('h1', {}, cfg.title), h('p', { class: 'muted' }, cfg.blurb), h('div', { class: 'panel' }, 'This section is still being built.'));
  }
  const st = sectionStatus(store, id);
  const lib = buildLibrary(mod, { size: setCount(cfg.exam.count) * cfg.exam.count });
  const nSets = librarySets(lib, cfg.exam.count).length;
  const setsDone = Object.keys(store.sets(id)).length;
  const due = srsDue(store.srs).filter((k) => k.startsWith(`${id}:`)).length;
  const stats = store.stats();
  const famRows = mod.families.map((f) => {
    const s = stats[`${id}:${f.id}`];
    return h('tr', {},
      h('td', {}, h('strong', {}, f.title), h('div', { class: 'muted small-note' }, f.skill)),
      h('td', { class: 'num', style: { textAlign: 'right' } }, s ? `${s.correct}/${s.n}` : '—'),
      h('td', { style: { textAlign: 'right', whiteSpace: 'nowrap' } },
        h('a', { class: 'btn small', href: `#/s/${id}/learn/${f.id}` }, 'Learn'), ' ',
        h('a', { class: 'btn small', href: `#/run/${id}/practice/${f.id}` }, 'Practise')));
  });
  mount(root,
    h('h1', {}, cfg.title),
    h('p', { class: 'muted' }, cfg.blurb),
    h('div', { class: 'panel' },
      h('div', { class: 'spread' },
        h('div', {},
          h('div', {}, `Exam replica: ${formatLine(cfg)}`),
          h('div', { class: 'muted' }, `Target: ${cfg.target.label}. `, st.ready ? 'Ready.' : `Readiness streak ${st.streak} of ${st.needed}.`)),
        st.ready ? h('span', { class: 'badge ok' }, 'Ready') : h('span', { class: 'badge' }, 'Not yet')),
      h('div', { class: 'row', style: { marginTop: '16px' } },
        h('a', { class: 'btn primary', href: `#/run/${id}/practice` }, 'Practice'),
        h('a', { class: 'btn', href: `#/run/${id}/drill` }, 'Drill (10, timed)'),
        h('a', { class: 'btn', href: `#/run/${id}/exam` }, 'Exam (full replica)'),
        ...cfg.variants.map((v, i) => h('a', { class: 'btn', href: `#/run/${id}/exam/v${i}` }, v.label)),
        h('a', { class: 'btn', href: `#/run/${id}/mistakes` }, `Mistakes (${due} due)`))),
    h('h2', {}, 'Question library'),
    h('div', { class: 'panel spread' },
      h('div', {}, h('div', {}, `${lib.length} fixed questions in ${nSets} exam-sized sets, plus unlimited fresh questions in Practice, Drill and Exam.`),
        h('div', { class: 'muted' }, `${setsDone} of ${nSets} sets done.`)),
      h('a', { class: 'btn primary', href: `#/s/${id}/sets` }, 'Open sets')),
    h('h2', {}, 'Question families'),
    h('p', { class: 'muted' }, `${mod.families.length} families, ${mod.bank.length} curated questions from reported past tests. Practice picks weaker families more often.`),
    h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Family'), h('th', { style: { textAlign: 'right' } }, 'Correct'), h('th', {}))),
      h('tbody', {}, famRows))));
}
