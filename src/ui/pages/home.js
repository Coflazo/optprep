import { h, mount } from '../dom.js';
import { SECTIONS, PORTAL_ORDER, ZAPN_TARGETS } from '../../../config/sections.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { readiness, zapnReadiness } from '../../core/readiness.js';
import { srsDue } from '../../core/srs.js';
import { GAMES } from '../../zapn/index.js';

export function formatLine(cfg) {
  const e = cfg.exam;
  const time = e.perItemSeconds ? `${e.perItemSeconds} s each` : `${Math.round(e.totalSeconds / 60)} min total`;
  const scoring = { plusMinus: '+1 / −1 / skip 0', exactOrder: '1 point per exact order', ratio: 'lower ÷ upper if inside', solved: 'boards solved; wrong submit costs time' }[e.scoring];
  return `${e.count} questions, ${time}, ${scoring}`;
}

export function sectionStatus(store, id) {
  const cfg = SECTIONS[id];
  const runs = store.runs(id, 'exam');
  const r = readiness(runs, cfg.target);
  const last = [...runs].sort((a, b) => a.finishedAt - b.finishedAt).slice(-3);
  return { ...r, last };
}

export function zapnStatus(store) {
  const games = GAMES.filter((g) => !g.pending);
  const ready = games.filter((g) => zapnReadiness(store.zapnRuns(g.id), ZAPN_TARGETS[g.id]).ready).length;
  return { ready, total: GAMES.length, built: games.length };
}

export function homePage(root, { store }) {
  const rows = PORTAL_ORDER.map((id) => {
    if (id === 'zapn') {
      const z = zapnStatus(store);
      return h('tr', {},
        h('td', {}, h('a', { href: '#/zapn' }, 'Zap-N')),
        h('td', { class: 'muted' }, '9 mini-games; exam mode mirrors each game'),
        h('td', { class: 'num' }, `${z.ready} of ${z.total} games at target`),
        h('td', {}, z.ready === z.total ? h('span', { class: 'badge ok' }, 'Ready') : h('span', { class: 'badge' }, 'Not yet')),
        h('td', { style: { textAlign: 'right' } }, h('a', { class: 'btn small', href: '#/zapn' }, 'Open')));
    }
    const cfg = SECTIONS[id];
    const st = sectionStatus(store, id);
    const built = SECTION_MODULES[id].families.length > 0;
    const fmt = (r) => (id === 'iv' ? (r.score / r.max).toFixed(2) : `${r.score}/${r.max}`);
    return h('tr', {},
      h('td', {}, h('a', { href: `#/s/${id}` }, cfg.title)),
      h('td', { class: 'muted' }, formatLine(cfg)),
      h('td', { class: 'num' }, st.last.length ? st.last.map(fmt).join('  ') : '—'),
      h('td', {}, !built ? h('span', { class: 'badge warn' }, 'Being built') : st.ready ? h('span', { class: 'badge ok' }, 'Ready') : h('span', { class: 'badge' }, `Streak ${st.streak}/${st.needed}`)),
      h('td', { style: { textAlign: 'right' } }, h('a', { class: 'btn small', href: `#/s/${id}` }, 'Open')));
  });

  const due = srsDue(store.srs);
  const stats = store.stats();
  const weak = Object.entries(stats).filter(([, s]) => s.n >= 3)
    .map(([k, s]) => ({ k, acc: (s.correct + 1) / (s.n + 2), s }))
    .sort((a, b) => a.acc - b.acc).slice(0, 5);
  const famTitle = (key) => {
    const [sec, fam] = key.split(':');
    return `${SECTIONS[sec]?.title || sec}: ${SECTION_MODULES[sec]?.families.find((f) => f.id === fam)?.title || fam}`;
  };

  mount(root,
    h('h1', {}, 'Readiness'),
    h('p', { class: 'muted' }, 'Open a portal task only when its row says Ready: the last three full exams all met the target. A started task cannot be reset.'),
    h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Portal task'), h('th', {}, 'Exam replica'), h('th', {}, 'Last exams'), h('th', {}, 'Status'), h('th', {}))),
      h('tbody', {}, rows))),
    h('h2', {}, 'Due for review'),
    due.length ? h('div', { class: 'panel' }, h('ul', { class: 'plain' }, due.slice(0, 8).map((k) => h('li', {}, h('a', { href: `#/run/${k.split(':')[0]}/mistakes` }, famTitle(k))))))
      : h('p', { class: 'muted' }, 'Nothing due. Missed families come back here automatically.'),
    h('h2', {}, 'Weakest families'),
    weak.length ? h('div', { class: 'panel' }, h('table', {}, h('tbody', {}, weak.map((w) => {
      const [sec, fam] = w.k.split(':');
      return h('tr', {}, h('td', {}, famTitle(w.k)), h('td', { class: 'num', style: { textAlign: 'right' } }, `${w.s.correct}/${w.s.n}`),
        h('td', { style: { textAlign: 'right' } }, h('a', { class: 'btn small', href: `#/s/${sec}/learn/${fam}` }, 'Learn'), ' ', h('a', { class: 'btn small', href: `#/run/${sec}/practice/${fam}` }, 'Practise')));
    }))))
      : h('p', { class: 'muted' }, 'Answer a few questions per family and the weakest ones show up here.'),
    calibrationBlock(store));
}

// Under +1/−1 scoring, answering is worth it only when P(correct) > 0.5:
// EV = p − (1 − p) = 2p − 1. The calibration data says what "unsure" really means.
function calibrationBlock(store) {
  const cal = store.state.calibration || [];
  const bucket = (conf) => cal.filter((c) => (conf === 'sure' ? c.confidence >= 0.8 : c.confidence < 0.8));
  const acc = (xs) => (xs.length ? xs.filter((x) => x.correct).length / xs.length : null);
  const sure = bucket('sure'), unsure = bucket('unsure');
  const aSure = acc(sure), aUnsure = acc(unsure);
  const advice = aUnsure == null || unsure.length < 10 ? 'Mark answers as "unsure" in practice; after about 10 of them this tells you whether guessing pays.'
    : aUnsure > 0.5 ? `When unsure you are right ${(aUnsure * 100).toFixed(0)}% of the time, above 50%: answering still gains points on average (EV = 2p − 1 = ${(2 * aUnsure - 1).toFixed(2)} per question).`
      : `When unsure you are right only ${(aUnsure * 100).toFixed(0)}% of the time. Under −1 for a wrong answer, EV = 2p − 1 = ${(2 * aUnsure - 1).toFixed(2)}: skip those questions in the exam.`;
  return h('div', {},
    h('h2', {}, 'When to skip (Beat the Odds, NumberLogic)'),
    h('div', { class: 'panel' },
      h('p', { class: 'num' }, `Sure: ${aSure == null ? '—' : `${(aSure * 100).toFixed(0)}% right (${sure.length})`}    Unsure: ${aUnsure == null ? '—' : `${(aUnsure * 100).toFixed(0)}% right (${unsure.length})`}`),
      h('p', { style: { marginBottom: 0 } }, advice)));
}
