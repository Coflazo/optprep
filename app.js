// Hash router. Every page is a function (root, ctx) that may return a cleanup.
import { h, mount } from './src/ui/dom.js';
import { makeStore } from './src/core/store.js';
import { SECTIONS } from './config/sections.js';
import { activatePreset, activePreset, presetSections } from './config/presets.js';
import { pathPage } from './src/ui/pages/path.js';
import { sectionPage } from './src/ui/pages/section.js';
import { progressPage } from './src/ui/pages/progress.js';
import { settingsPage } from './src/ui/pages/settings.js';
import { learnPage } from './src/ui/pages/learn.js';
import { zapnHub, zapnGame } from './src/ui/pages/zapn.js';
import { mockPage } from './src/ui/pages/mock.js';
import { mkPage } from './src/ui/pages/mk.js';
import { dataPage } from './src/ui/pages/data.js';
import { setsPage, setRunPage } from './src/ui/pages/sets.js';
import { runFeedbackSession, runExam } from './src/ui/runner.js';
import { brandLockup, wordmark } from './src/ui/logo.js';
import { icon } from './src/ui/icons.js';
import { setRail } from './src/ui/sheet.js';
import { creditTick } from './src/core/activity.js';
import { initTheme } from './src/ui/theme.js';
import { createSync } from './src/ui/sync.js';
import { initPwa } from './src/ui/pwa.js';
import { studyHome, bookPage, lessonPage, cheatPage, drillPage, mixedPage, reviewPage, mistakesPage, weekPage } from './src/study/pages.js';
import { dueLessons, openBeliefs } from './src/study/progress.js';

const sync = createSync();
const store = makeStore(undefined, sync.hooks);
const view = document.getElementById('view');
const nav = document.getElementById('nav');
const tabbar = document.getElementById('tabbar');
let cleanup = null;
activatePreset(store.settings().preset);

initTheme();
mount(document.querySelector('.sidebar .brand'),
  h('a', { href: '#/', class: 'brand-link', 'aria-label': 'OptPrep, today' }, brandLockup()));
mount(document.getElementById('sidebar-foot'), h('div', {}, 'Not affiliated with or endorsed by Optiver.'));

const ROUTES = [
  [/^#?\/?$/, () => pathPage(view, { store, sync })],
  [/^#\/progress(?:\/(\w+))?$/, (m) => progressPage(view, { store, tab: m[1] })],
  [/^#\/settings$/, () => settingsPage(view, { store })],
  [/^#\/s\/(\w+)$/, (m) => sectionPage(view, { store, id: m[1] })],
  [/^#\/s\/(\w+)\/sets$/, (m) => setsPage(view, { store, id: m[1] })],
  [/^#\/s\/(\w+)\/sets\/(\d+)\/(practice|timed)$/, (m) => setRunPage(view, { store, id: m[1], n: +m[2], mode: m[3] })],
  [/^#\/s\/(\w+)\/learn\/([\w-]+)$/, (m) => learnPage(view, { store, id: m[1], family: m[2] })],
  [/^#\/run\/(\w+)\/exam(?:\/v(\d+))?$/, (m) => runExam(view, { sectionId: m[1], store, variant: m[2] != null ? SECTIONS[m[1]].variants[+m[2]] : null })],
  [/^#\/run\/(\w+)\/(practice|drill|mistakes)(?:\/([\w-]+))?$/, (m) => runFeedbackSession(view, { sectionId: m[1], mode: m[2], family: m[3], store })],
  [/^#\/zapn$/, () => zapnHub(view, { store })],
  [/^#\/zapn\/(\w+)(?:\/(practice|exam))?$/, (m) => zapnGame(view, { store, id: m[1], mode: m[2] || 'practice' })],
  [/^#\/study$/, () => studyHome(view, { store })],
  [/^#\/study\/book\/(\w+)$/, (m) => bookPage(view, { store, id: m[1] })],
  [/^#\/study\/lesson\/(\w+\/[\w-]+)$/, (m) => lessonPage(view, { store, id: m[1] })],
  [/^#\/study\/lesson\/(\w+\/[\w-]+)\/restore$/, (m) => lessonPage(view, { store, id: m[1], restore: true })],
  [/^#\/study\/review\/(\w+\/[\w-]+)$/, (m) => reviewPage(view, { store, id: m[1] })],
  [/^#\/study\/mistakes(?:\/(.+))?$/, (m) => mistakesPage(view, { store, key: decode(m[1]) })],
  [/^#\/study\/week$/, () => weekPage(view, { store })],
  [/^#\/study\/cheat\/(\w+)$/, (m) => cheatPage(view, { id: m[1] })],
  [/^#\/study\/drill\/(\w+)$/, (m) => drillPage(view, { id: m[1] })],
  [/^#\/study\/mixed\/(\w+)\/(\d+)$/, (m) => mixedPage(view, { store, id: m[1], chapter: +m[2] })],
  [/^#\/mock$/, () => mockPage(view, { store })],
  [/^#\/mk$/, () => mkPage(view, { store })],
  [/^#\/data$/, () => dataPage(view, { store })],
];

const decode = (x) => { try { return x ? decodeURIComponent(x) : null; } catch { return null; } };

// Today's minutes and streak, shown in the sidebar and the top bar.
function todayBits() {
  const st = store.streak();
  const minutes = Math.floor(store.todayMs() / 60e3);
  return [
    h('span', { class: 'stat', title: 'Streak' }, icon('fire', { size: 16 }), h('span', { class: 'num' }, String(st.current))),
    h('span', { class: 'stat', title: 'Minutes today' }, icon('timer', { size: 16 }), h('span', { class: 'num' }, `${minutes}/${store.goalMin()}`)),
  ];
}

function renderNav(hash) {
  const due = dueLessons(store).length;
  const open = openBeliefs(store).length;
  const here = (href) => hash === href || (href !== '#/' && hash.startsWith(`${href}/`));
  const link = (href, label, extra = null, ico = null, on = here(href)) => h('a', { href, 'aria-current': on ? 'page' : null }, ico ? icon(ico, { size: 18 }) : null, h('span', {}, label), extra);
  const studyOwn = /^#\/study\/(mistakes|week)/.test(hash);
  const tasks = presetSections(activePreset());
  mount(nav,
    link('#/', 'Today', null, 'path'),
    h('div', { class: 'group' }, 'Tasks'),
    tasks.map((id) => (id === 'zapn' ? link('#/zapn', 'Zap-N games') : link(`#/s/${id}`, SECTIONS[id].title))),
    h('div', { class: 'group' }, 'Learn'),
    link('#/study', 'Study guide', due ? h('span', { class: 'nav-count', 'aria-label': `${due} lessons due` }, String(due)) : null, 'study', (hash === '#/study' || hash.startsWith('#/study/')) && !studyOwn),
    link('#/progress', 'Progress', open ? h('span', { class: 'nav-count', 'aria-label': `${open} open mistakes` }, String(open)) : null, 'progress', hash.startsWith('#/progress') || studyOwn),
    link('#/mock', 'Full mock', null, 'timer'),
    link('#/mk', 'Market making', null, 'bolt'),
    link('#/settings', 'Settings', null, 'settings', hash === '#/settings' || hash === '#/data'));
  mount(tabbar,
    link('#/', 'Today', null, 'path', hash === '#/' || hash === '' || hash.startsWith('#/s/') || hash.startsWith('#/zapn') || hash.startsWith('#/run/')),
    link('#/study', 'Study', null, 'study', hash.startsWith('#/study') && !studyOwn),
    link('#/progress', 'Progress', null, 'progress', hash.startsWith('#/progress') || studyOwn),
    link('#/mock', 'Mock', null, 'timer'),
    link('#/settings', 'Settings', null, 'settings', hash === '#/settings' || hash === '#/data'));
  mount(document.getElementById('topbar'),
    h('a', { href: '#/', class: 'brand-link', 'aria-label': 'OptPrep, today' }, wordmark({ height: 22, label: '' })),
    h('div', { class: 'nav-today' }, todayBits()));
}

function route() {
  const go = () => render();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A short crossfade between pages; runs and games swap instantly (keyboard-heavy).
  if (document.startViewTransition && !reduce && !/^#\/(run|zapn\/\w+)/.test(location.hash) && view.childElementCount) document.startViewTransition(go); else go();
}

function render() {
  const hash = location.hash || '#/';
  cleanup?.();
  cleanup = null;
  setRail(Math.min(1, store.todayMs() / 60e3 / store.goalMin()), `${Math.floor(store.todayMs() / 60e3)} of ${store.goalMin()} minutes today`);
  renderNav(hash.startsWith('#/study') ? hash : hash.replace(/\/(practice|exam|drill|mistakes).*$/, ''));
  for (const [re, fn] of ROUTES) {
    const m = hash.match(re);
    if (m) {
      try { const c = fn(m); cleanup = typeof c === 'function' ? c : null; } catch (e) {
        console.error(e);
        mount(view, h('h1', {}, 'This page failed to load'), h('p', {}, 'Your progress is safe. Reload the page; if it happens again, report it with the details below.'), h('pre', {}, String(e.stack || e)));
      }
      view.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      return;
    }
  }
  mount(view, h('h1', {}, 'Page not found'), h('p', {}, 'This link does not match any page. ', h('a', { href: '#/' }, 'Go to today')));
}

window.addEventListener('hashchange', route);
// Printing a lesson opens every derivation step first, so the page prints as a complete document.
window.addEventListener('beforeprint', () => view.querySelectorAll('[data-print-expand]:not([hidden])').forEach((b) => b.click()));
sync.start(store).then((ok) => { if (ok && (location.hash || '#/') === '#/') route(); });
route();
initPwa();

// Active minutes: a 5 s ticker credits time only inside a session, with the tab visible and
// input in the last 90 s. Saved on the next store write and when the page is hidden.
const SESSION = /^#\/(run\/|s\/\w+\/(learn|sets\/\d+)|zapn\/\w+|study\/(lesson|review|drill|mixed|cheat)\/|mock)/;
let lastTick = Date.now();
let lastInputAt = null;
for (const ev of ['pointerdown', 'keydown', 'input', 'wheel', 'scroll', 'touchstart']) window.addEventListener(ev, () => { lastInputAt = Date.now(); }, { passive: true, capture: true });
setInterval(() => {
  const now = Date.now();
  store.creditMs(creditTick({ now, lastTick, lastInputAt, hidden: document.hidden, inSession: SESSION.test(location.hash) }));
  lastTick = now;
}, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) store.save(); else lastTick = Date.now(); });
window.addEventListener('pagehide', () => store.save());

// A new version is ready: offer one reload, never force it.
window.addEventListener('optprep:update', (e) => {
  const toast = h('div', { class: 'toast', role: 'status' }, 'A new version of OptPrep is ready.',
    h('button', { class: 'btn small', type: 'button', onclick: () => e.detail?.apply?.() }, 'Reload'));
  document.body.append(toast);
});
