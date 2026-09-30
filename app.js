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
import { runFeedbackSession, runExam } from './src/ui/runner.js';
import { optiverLogo } from './src/ui/logo.js';

const store = makeStore();
const view = document.getElementById('view');
const nav = document.getElementById('nav');
let cleanup = null;

mount(document.querySelector('.sidebar .brand'),
  h('a', { href: '#/', class: 'brand-link', 'aria-label': 'OA Trainer home' }, optiverLogo({ height: 20 })),
  h('div', { class: 'brand-sub' }, 'Assessment trainer'),
  h('div', { class: 'brand-note' }, 'Unofficial practice, not affiliated with Optiver'));

const ROUTES = [
  [/^#?\/?$/, () => homePage(view, { store })],
  [/^#\/s\/(\w+)$/, (m) => sectionPage(view, { store, id: m[1] })],
  [/^#\/s\/(\w+)\/learn\/([\w-]+)$/, (m) => learnPage(view, { store, id: m[1], family: m[2] })],
  [/^#\/run\/(\w+)\/exam(?:\/v(\d+))?$/, (m) => runExam(view, { sectionId: m[1], store, variant: m[2] != null ? SECTIONS[m[1]].variants[+m[2]] : null })],
  [/^#\/run\/(\w+)\/(practice|drill|mistakes)(?:\/([\w-]+))?$/, (m) => runFeedbackSession(view, { sectionId: m[1], mode: m[2], family: m[3], store })],
  [/^#\/zapn$/, () => zapnHub(view, { store })],
  [/^#\/zapn\/(\w+)(?:\/(practice|exam))?$/, (m) => zapnGame(view, { store, id: m[1], mode: m[2] || 'practice' })],
  [/^#\/mock$/, () => mockPage(view, { store })],
  [/^#\/data$/, () => dataPage(view, { store })],
];

function renderNav(hash) {
  const link = (href, label) => h('a', { href, 'aria-current': hash === href || (href !== '#/' && hash.startsWith(`${href}/`)) ? 'page' : null }, label);
  mount(nav,
    link('#/', 'Readiness'),
    h('div', { class: 'group' }, 'Portal tasks'),
    PORTAL_ORDER.map((id) => (id === 'zapn' ? link('#/zapn', 'Zap-N') : link(`#/s/${id}`, SECTIONS[id].title))),
    h('div', { class: 'group' }, 'Practice'),
    link('#/mock', 'Full mock'),
    link('#/data', 'Data and backup'));
}

function route() {
  const hash = location.hash || '#/';
  cleanup?.();
  cleanup = null;
  renderNav(hash.replace(/\/(practice|exam|drill|mistakes).*$/, ''));
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
route();
