// Home: today's goal, the one next step, and the answer sheet for every task in the
// candidate's battery. First launch asks which battery they will sit.
import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { PRESETS, activatePreset, activePreset, presetSections } from '../../../config/presets.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { GAMES } from '../../zapn/index.js';
import { roadmap, nextStep } from '../../core/path.js';
import { readiness } from '../../core/readiness.js';
import { timingAtLeastAsStrict } from '../../../config/presets.js';
import { bubbles, field, choice, setRail } from '../sheet.js';
import { icon } from '../icons.js';
import { sectionMap } from './section.js';

export function presetPicker(store, { onDone, compact = false } = {}) {
  let picked = store.settings().preset?.id || 'full';
  const options = Object.values(PRESETS).map((p) => ({ value: p.id, label: p.title, hint: p.who }));
  return h('div', { class: 'preset-picker' },
    choice({ legend: compact ? 'Battery' : null, options, value: picked, onChange: (v) => { picked = v; } }),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => { store.setSetting('preset', { id: picked }); store.setSetting('presetConfirm', false); activatePreset({ id: picked }); onDone?.(); } }, compact ? 'Save' : 'Start')));
}

// One quiet row per task: name, progress, and Ready when earned. Details live on the roadmap.
function taskRow(store, id, map) {
  if (id === 'zapn') {
    const games = GAMES.filter((g) => activePreset().zapn.includes(g.id));
    const played = games.filter((g) => store.zapnRuns(g.id).length).length;
    return h('li', {}, h('a', { class: 'task-row', href: '#/zapn' },
      h('span', { class: 'task-name' }, 'Zap-N games'),
      h('span', { class: 'task-progress num' }, `${played} of ${games.length} played`)));
  }
  const cfg = SECTIONS[id];
  const runs = store.runs(id, 'exam').filter((r) => timingAtLeastAsStrict(r, cfg.exam));
  const ready = readiness(runs, cfg.target).ready;
  return h('li', {}, h('a', { class: 'task-row', href: `#/s/${id}` },
    h('span', { class: 'task-name' }, cfg.title),
    ready ? h('span', { class: 'stamp stamp-mastered' }, 'Ready') : null,
    h('span', { class: 'task-progress num' }, `${map.skillsDone} of ${map.skillsTotal} skills`),
    map.due ? h('span', { class: 'stamp stamp-needs-review' }, `${map.due} to review`) : null));
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

  const stepTitle = step ? step.row.title : 'Pick a task below';
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
      h('span', { class: 'next-kind' }, `${step.why === 'review' ? 'Review due' : 'Next'} in ${SECTIONS[step.sectionId].title}`),
      h('span', { class: 'next-title' }, stepTitle),
      step.row.kind === 'skill' ? bubbles(5, step.row.lv, { label: `Level ${step.row.lv} of 5` }) : null,
      h('span', { class: 'btn primary' }, stepVerb, icon('arrow', { size: 18 }))) : null,
    h('div', { class: 'tasks-head' }, h('h2', {}, 'Your tasks'), h('a', { class: 'small-note muted', href: '#/settings' }, `Battery: ${active.title}`)),
    h('ul', { class: 'task-list' }, ids.map((id) => (id === 'zapn' || mapOf[id] ? taskRow(store, id, mapOf[id]) : null))));
}
