// Progress: the patterns that keep costing points, every wrong answer with the belief
// behind it, and pace per task. Each pattern and mistake leads straight to practice.
import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { familyTitle as famTitle } from '../../sections/catalog.js';
import { weakPatterns } from '../../core/patterns.js';
import { dayKey, addDays } from '../../core/activity.js';
import { lessonForFamily } from '../../study/catalog.js';

const secTitle = (sid) => SECTIONS[sid]?.title || sid;
const pct = (x) => `${Math.round(100 * x)}%`;
const when = (t) => new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' });

function patternsTab(store) {
  const list = weakPatterns({ trend: store.trend(), mistakes: store.mistakes() });
  if (!list.length) return h('p', { class: 'empty' }, 'No pattern yet. Patterns appear once a skill has a few recent answers and keeps losing points. Practise any task and check back.');
  return h('ol', { class: 'patterns' }, list.map((p) => {
    const lesson = lessonForFamily(p.sid, p.fam);
    return h('li', { class: 'pattern' },
      h('div', { class: 'pattern-where' }, `${secTitle(p.sid)}: ${famTitle(p.sid, p.fam)}`),
      h('p', { class: 'pattern-text' }, p.type === 'belief' ? p.text : 'You miss this skill more often than chance would explain.'),
      h('p', { class: 'muted small-note' }, 'Misses at least ', h('span', { class: 'num' }, pct(p.lb)), ' of recent answers (', h('span', { class: 'num' }, p.n.toFixed(1)), ' weighted answers, recent ones count more).'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: `#/run/${p.sid}/practice/${p.fam}` }, 'Practise 10 now'),
        lesson ? h('a', { class: 'btn ghost', href: `#/study/lesson/${lesson}` }, 'Open the lesson') : null));
  }));
}

function mistakesTab(store) {
  const all = [...store.mistakes()].reverse();
  if (!all.length) return h('p', { class: 'empty' }, 'No wrong answers saved yet. Every miss in practice lands here with the belief behind it.');
  const sections = [...new Set(all.map((m) => m.sid))];
  let sec = 'all', q = '';
  const list = h('ol', { class: 'mistakes' });
  const count = h('p', { class: 'muted small-note', 'aria-live': 'polite' });
  const draw = () => {
    const rows = all.filter((m) => (sec === 'all' || m.sid === sec) && (!q || `${m.prompt} ${m.belief || ''} ${famTitle(m.sid, m.fam)}`.toLowerCase().includes(q)));
    count.textContent = `${rows.length} of ${all.length} wrong answers`;
    list.replaceChildren(...rows.slice(0, 200).map((m) => h('li', { class: 'mistake' },
      h('div', { class: 'mistake-head' },
        h('span', { class: 'num muted' }, when(m.at)),
        h('span', {}, `${secTitle(m.sid)}: ${famTitle(m.sid, m.fam)}`),
        m.n > 1 ? h('span', { class: 'stamp stamp-needs-review' }, `missed ${m.n} times`) : null),
      h('p', { class: 'mistake-prompt' }, m.prompt),
      h('p', { class: 'mistake-answers' },
        h('span', {}, 'You: ', h('span', { class: 'num wrong-ink' }, m.chosen ?? 'no answer')),
        h('span', {}, 'Right: ', h('span', { class: 'num right-ink' }, m.correct ?? '?'))),
      m.belief ? h('p', { class: 'mistake-belief' }, 'Your answer comes from: ', h('em', {}, m.belief)) : null,
      h('div', { class: 'row' },
        h('a', { class: 'btn small', href: `#/run/${m.sid}/practice/${m.fam}` }, 'Try a twin'),
        lessonForFamily(m.sid, m.fam) ? h('a', { class: 'btn small ghost', href: `#/study/lesson/${lessonForFamily(m.sid, m.fam)}` }, 'Lesson') : null))));
  };
  draw();
  return h('div', {},
    h('div', { class: 'filters' },
      h('label', { class: 'field-inline' }, 'Task ',
        h('select', { onchange: (e) => { sec = e.target.value; draw(); } }, h('option', { value: 'all' }, 'All tasks'), sections.map((s) => h('option', { value: s }, secTitle(s))))),
      h('label', { class: 'field-inline' }, 'Search ',
        h('input', { type: 'search', placeholder: 'Words from the question or belief', oninput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } }))),
    count, list);
}

function paceTab(store) {
  const stats = store.stats();
  const bySec = {};
  for (const [k, s] of Object.entries(stats)) {
    const [sid] = k.split(':');
    const b = (bySec[sid] = bySec[sid] || { n: 0, c: 0, ms: 0 });
    b.n += s.n; b.c += s.correct; b.ms += s.ms;
  }
  const today = dayKey(Date.now());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const mins = days.map((d) => Math.round((store.state.activity.days[d]?.ms || 0) / 60e3));
  const peak = Math.max(store.goalMin(), ...mins);
  return h('div', {},
    h('h3', {}, 'Minutes per day, last 14 days'),
    h('div', { class: 'minutes-chart', role: 'img', 'aria-label': days.map((d, i) => `${d}: ${mins[i]} minutes`).join(', ') },
      days.map((d, i) => h('div', { class: 'minutes-col' },
        h('span', { class: `minutes-bar${mins[i] >= store.goalMin() ? ' is-met' : ''}`, style: { '--h': (mins[i] / peak).toFixed(3) } }),
        h('span', { class: 'minutes-day num' }, d.slice(8)))),
      h('span', { class: 'goal-line', style: { '--h': (store.goalMin() / peak).toFixed(3) } }, h('span', {}, `goal ${store.goalMin()} min`))),
    h('h3', {}, 'Accuracy and pace by task'),
    Object.keys(bySec).length ? h('table', { class: 'data' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Task'), h('th', { class: 'r' }, 'Answered'), h('th', { class: 'r' }, 'Right'), h('th', { class: 'r' }, 'Average time'))),
      h('tbody', {}, Object.entries(bySec).map(([sid, b]) => h('tr', {},
        h('td', {}, secTitle(sid)), h('td', { class: 'r num' }, String(b.n)), h('td', { class: 'r num' }, pct(b.c / b.n)), h('td', { class: 'r num' }, b.ms ? `${(b.ms / b.n / 1000).toFixed(1)} s` : '-')))))
      : h('p', { class: 'empty' }, 'Answer a few questions and your accuracy and pace show up here.'));
}

const TABS = [['patterns', 'Weak patterns', patternsTab], ['mistakes', 'Wrong answers', mistakesTab], ['pace', 'Pace', paceTab]];

export function progressPage(root, { store, tab = 'patterns' }) {
  const active = TABS.find((t) => t[0] === tab) || TABS[0];
  mount(root,
    h('h1', {}, 'Progress'),
    h('nav', { class: 'tabs', 'aria-label': 'Progress views' }, TABS.map(([id, label]) => h('a', { href: `#/progress/${id}`, 'aria-current': id === active[0] ? 'page' : null }, label))),
    h('div', { class: 'tab-panel' }, active[2](store)));
}
