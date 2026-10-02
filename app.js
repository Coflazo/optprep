// Hash router. Every page is a function (root, ctx) that may return a cleanup.
import { h, mount } from './src/ui/dom.js';
import { makeStore } from './src/core/store.js';
import { SECTIONS, PORTAL_ORDER } from './config/sections.js';
import { homePage } from './src/ui/pages/home.js';
import { sectionPage } from './src/ui/pages/section.js';
import { learnPage } from './src/ui/pages/learn.js';
import { zapnHub, zapnGame } from './src/ui/pages/zapn.js';
import { mockPage } from './src/ui/pages/mock.js';
import { dataPage } from './src/ui/pages/data.js';
import { setsPage, setRunPage } from './src/ui/pages/sets.js';
import { runFeedbackSession, runExam } from './src/ui/runner.js';
import { brandLockup } from './src/ui/logo.js';
import { initTheme } from './src/ui/theme.js';
import { createSync } from './src/ui/sync.js';
import { initPwa } from './src/ui/pwa.js';
import { studyHome, bookPage, lessonPage, cheatPage, drillPage, mixedPage, reviewPage, mistakesPage, weekPage } from './src/study/pages.js';
import { dueLessons, openBeliefs } from './src/study/progress.js';

const sync = createSync();
const store = makeStore(undefined, sync.hooks);
const view = document.getElementById('view');
const nav = document.getElementById('nav');
let cleanup = null;

initTheme();
mount(document.querySelector('.sidebar .brand'),
  h('a', { href: '#/', class: 'brand-link', 'aria-label': 'OptPrep home' }, brandLockup()),
  h('div', { class: 'brand-note' }, 'Not affiliated with or endorsed by Optiver'));

const ROUTES = [
  [/^#?\/?$/, () => homePage(view, { store, sync })],
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
  [/^#\/data$/, () => dataPage(view, { store })],
];

const decode = (x) => { try { return x ? decodeURIComponent(x) : null; } catch { return null; } };

function renderNav(hash) {
  const due = dueLessons(store).length;
  const open = openBeliefs(store).length;
  const link = (href, label, on = hash === href || (href !== '#/' && hash.startsWith(`${href}/`))) => h('a', { href, 'aria-current': on ? 'page' : null }, label);
  const studyOwn = /^#\/study\/(mistakes|week)/.test(hash);
  mount(nav,
    link('#/', 'Readiness'),
    h('div', { class: 'group' }, 'Portal tasks'),
    PORTAL_ORDER.map((id) => (id === 'zapn' ? link('#/zapn', 'Zap-N') : link(`#/s/${id}`, SECTIONS[id].title))),
    h('div', { class: 'group' }, 'Study'),
    link('#/study', ['Study guide', due ? h('span', { class: 'badge', 'aria-label': `${due} lessons due for review` }, String(due)) : null], (hash === '#/study' || hash.startsWith('#/study/')) && !studyOwn),
    link('#/study/mistakes', ['Mistake log', open ? h('span', { class: 'badge', 'aria-label': `${open} open mistakes` }, String(open)) : null]),
    link('#/study/week', 'Weekly review'),
    h('div', { class: 'group' }, 'Practice'),
    link('#/mock', 'Full mock'),
    link('#/data', 'Data and backup'));
}

function route() {
  const hash = location.hash || '#/';
  cleanup?.();
  cleanup = null;
  renderNav(hash.startsWith('#/study') ? hash : hash.replace(/\/(practice|exam|drill|mistakes).*$/, ''));
  for (const [re, fn] of ROUTES) {
    const m = hash.match(re);
    if (m) {
      try { const c = fn(m); cleanup = typeof c === 'function' ? c : null; } catch (e) {
        console.error(e);
        mount(view, h('h1', {}, 'Something broke'), h('pre', {}, String(e.stack || e)));
      }
      view.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      return;
    }
  }
  mount(view, h('h1', {}, 'Not found'), h('p', {}, h('a', { href: '#/' }, 'Back to readiness')));
}

window.addEventListener('hashchange', route);
// Printing a lesson opens every derivation step first, so the page prints as a complete document.
window.addEventListener('beforeprint', () => view.querySelectorAll('[data-print-expand]:not([hidden])').forEach((b) => b.click()));
sync.start(store).then((ok) => { if (ok && (location.hash || '#/') === '#/') route(); });
route();
initPwa();
