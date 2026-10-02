// Home: today's goal, the one next step, and the answer sheet for every task in the
// candidate's battery. First launch asks which battery they will sit.
import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { PRESETS, activatePreset, activePreset, presetSections, SOURCES, REPORTED } from '../../../config/presets.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { GAMES } from '../../zapn/index.js';
import { roadmap, nextStep } from '../../core/path.js';
import { readiness } from '../../core/readiness.js';
import { timingAtLeastAsStrict } from '../../../config/presets.js';
import { bubbles, field, choice, setRail } from '../sheet.js';
import { icon } from '../icons.js';
import { sectionMap } from './section.js';
import { formatLine } from './format.js';

export function presetPicker(store, { onDone, compact = false } = {}) {
  let picked = store.settings().preset?.id || 'full';
  const options = Object.values(PRESETS).map((p) => ({ value: p.id, label: p.title, hint: p.who }));
  return h('div', { class: 'preset-picker' },
    choice({ legend: compact ? 'Battery' : null, options, value: picked, onChange: (v) => { picked = v; } }),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => { store.setSetting('preset', { id: picked }); store.setSetting('presetConfirm', false); activatePreset({ id: picked }); onDone?.(); } }, compact ? 'Save' : 'Start')));
}

function readinessLine(store, id) {
  const cfg = SECTIONS[id];
  const runs = store.runs(id, 'exam').filter((r) => timingAtLeastAsStrict(r, cfg.exam));
  const r = readiness(runs, cfg.target);
  const last = [...runs].sort((a, b) => a.finishedAt - b.finishedAt).slice(-3);
  const fmt = (x) => (id === 'iv' ? (x.score / x.max).toFixed(2) : `${x.score}/${x.max}`);
  const rep = REPORTED[id];
  return h('div', { class: 'readiness' },
    h('div', { class: 'readiness-line' },
      h('span', {}, 'Ready gate: ', h('span', { class: 'num' }, `${r.streak} of ${r.needed}`), ' exams in a row at ', cfg.target.label, '.'),
      r.ready ? h('span', { class: 'stamp stamp-mastered' }, 'Ready') : null),
    h('div', { class: 'readiness-meta' },
      h('span', {}, 'Last exams ', h('span', { class: 'num' }, last.length ? last.map(fmt).join('  ') : 'none yet')),
      rep ? h('span', {}, 'Reported pass ', h('span', { class: 'num' }, rep.text), ' (', h('a', { href: SOURCES[rep.source].url, target: '_blank', rel: 'noopener' }, SOURCES[rep.source].label), ')') : h('span', {}, 'No pass line is reported for this task.')));
}

function sectionField(store, id, map) {
  if (id === 'zapn') {
    const games = GAMES.filter((g) => activePreset().zapn.includes(g.id));
    const played = games.filter((g) => store.zapnRuns(g.id).length).length;
    return h('article', { class: 'field sheet-section' },
      h('header', { class: 'sheet-section-head' },
        h('h3', {}, h('a', { href: '#/zapn' }, 'Zap-N games')),
        h('span', { class: 'num muted' }, `${played} of ${games.length} played`)),
      bubbles(games.length, played, { label: `${played} of ${games.length} games played` }),
      h('p', { class: 'muted small-note' }, activePreset().note || 'Short cognitive games. Each has a coach and an exam mode.'),
      h('div', { class: 'row' }, h('a', { class: 'btn', href: '#/zapn' }, 'Open games')));
  }
  const cfg = SECTIONS[id];
  return h('article', { class: 'field sheet-section' },
    h('header', { class: 'sheet-section-head' },
      h('h3', {}, h('a', { href: `#/s/${id}` }, cfg.title)),
      h('span', { class: 'num muted' }, `${map.skillsDone} of ${map.skillsTotal} skills`)),
    h('p', { class: 'muted small-note num-ish' }, formatLine(cfg)),
    h('ol', { class: 'unit-strip' }, map.units.map((u) => h('li', { class: map.current && map.units[map.current.unit] === u ? 'is-current' : '' },
      h('span', { class: 'unit-name' }, u.title),
      bubbles(Math.min(u.total, 12), u.total > 12 ? (u.done / u.total) * 12 : u.done, { size: 'sm', label: `${u.title}: ${u.done} of ${u.total} done` })))),
    readinessLine(store, id),
    h('div', { class: 'row' },
      h('a', { class: 'btn', href: `#/s/${id}` }, 'Open roadmap'),
      h('a', { class: 'btn ghost', href: `#/run/${id}/practice` }, 'Practise'),
      h('a', { class: 'btn ghost', href: `#/run/${id}/exam` }, 'Exam replica')));
}

export function pathPage(root, { store }) {
  const preset = store.settings().preset;
  if (!preset) {
    mount(root,
      h('h1', {}, 'Which online assessment are you sitting?'),
      h('p', { class: 'lede' }, 'This sets the tasks on your sheet, their timing and the exam replicas. You can change it later in Settings.'),
      field(null, presetPicker(store, { onDone: () => pathPage(root, { store }) })));
    setRail(0, 'Not started');
    return;
  }
  const active = activePreset();
  const ids = presetSections(active);
  const maps = ids.filter((id) => id !== 'zapn' && SECTION_MODULES[id]).map((id) => ({ id, map: sectionMap(store, id) }));
  const mapOf = Object.fromEntries(maps.map((m) => [m.id, m.map]));
  const step = nextStep(maps);
  const goal = store.goalMin();
  const minutes = Math.floor(store.todayMs() / 60e3);
  const st = store.streak();
  setRail(Math.min(1, minutes / goal), `${minutes} of ${goal} minutes today`);

  const stepTitle = step ? `${SECTIONS[step.sectionId].title}: ${step.row.title}` : 'Pick a task below';
  const stepVerb = !step ? null : step.why === 'review' ? 'Review' : step.row.kind === 'lesson' ? 'Read the lesson' : step.row.kind === 'checkpoint' ? 'Take it' : 'Continue';

  mount(root,
    h('h1', {}, 'Today'),
    h('div', { class: 'today' },
      h('div', { class: 'today-goal' },
        bubbles(goal, minutes, { label: `${minutes} of ${goal} minutes today`, size: goal > 12 ? 'sm' : 'md' }),
        h('span', { class: 'num' }, `${minutes} of ${goal} min`)),
      h('div', { class: 'today-stats' },
        h('span', { class: 'stat' }, icon('fire', { size: 18 }), h('span', { class: 'num' }, String(st.current)), st.current === 1 ? ' day' : ' days'),
        h('span', { class: 'stat' }, icon('bolt', { size: 18 }), h('span', { class: 'num' }, String(store.xpTotal())), ' XP'),
        st.freezes ? h('span', { class: 'stat muted' }, h('span', { class: 'num' }, String(st.freezes)), st.freezes === 1 ? ' freeze' : ' freezes') : null)),
    step ? h('a', { class: 'next-step', href: step.row.href },
      h('span', { class: 'next-kind' }, step.why === 'review' ? 'Review due' : 'Next on your sheet'),
      h('span', { class: 'next-title' }, stepTitle),
      step.row.kind === 'skill' ? bubbles(5, step.row.lv, { label: `Level ${step.row.lv} of 5` }) : null,
      h('span', { class: 'btn primary' }, stepVerb, icon('arrow', { size: 18 }))) : null,
    h('p', { class: 'preset-line muted' }, 'Training for ', h('strong', {}, active.title), '. ', h('a', { href: '#/settings' }, 'Change')),
    h('h2', {}, 'Your sheet'),
    h('div', { class: 'sheet-sections' }, ids.map((id) => (id === 'zapn' || mapOf[id] ? sectionField(store, id, mapOf[id]) : null))),
    h('p', { class: 'muted small-note' }, 'One attempt every eight months. Ready means your last three full exams met this trainer\'s bar, which sits above the reported pass lines. It lowers the risk; it does not guarantee a pass.'));
}
