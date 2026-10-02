import { h, mount } from '../dom.js';
import { SECTIONS, PORTAL_ORDER, ZAPN_TARGETS } from '../../../config/sections.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { readiness, zapnReadiness } from '../../core/readiness.js';
import { srsDue } from '../../core/srs.js';
import { GAMES } from '../../zapn/index.js';
import { BOOK_BY_ID } from '../../study/content/index.js';
import { lessonsOf } from '../../study/schema.js';
import { statusOf } from '../../study/progress.js';

// "Study: 4/32 mastered" under a task name, once that task's book is written.
function studyLine(store, id) {
  const b = BOOK_BY_ID[id];
  if (!b || b.pending) return null;
  const ls = lessonsOf(b);
  const m = ls.filter((l) => ['mastered', 'review'].includes(statusOf(store, l.id))).length;
  return h('div', { class: 'muted small-note' }, h('a', { href: `#/study/book/${id}` }, 'Study'), `: ${m}/${ls.length} lessons mastered`);
}

export function formatLine(cfg) {
  const e = cfg.exam;
  const time = e.perItemSeconds ? `${e.perItemSeconds} s each` : `${Math.round(e.totalSeconds / 60)} min total`;
  const scoring = { plusMinus: e.allowSkip === false ? '+1 / −1, no skipping' : '+1 / −1 / skip 0', exactOrder: '1 point per exact order', ratio: 'lower ÷ upper if inside', solved: 'boards solved; wrong submit costs time' }[e.scoring];
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

export function homePage(root, { store, sync }) {
  const rows = PORTAL_ORDER.map((id) => {
    if (id === 'zapn') {
      const z = zapnStatus(store);
      return h('tr', {},
        h('td', {}, h('a', { href: '#/zapn' }, 'Zap-N'), studyLine(store, 'zapn')),
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
      h('td', {}, h('a', { href: `#/s/${id}` }, cfg.title), studyLine(store, id)),
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
    calibrationBlock(store),
    backendBlock(sync));
}

// Filled asynchronously from the Python backend when it is running.
function backendBlock(sync) {
  const box = h('div', {});
  if (!sync?.online) return box;
  const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  sync.analytics().then((a) => {
    if (!a?.sections) return;
    const rows = Object.entries(a.sections).filter(([, v]) => v.forecast).map(([id, v]) => {
      const f = v.forecast;
      return h('tr', {},
        h('td', {}, SECTIONS[id].title),
        h('td', { class: 'num', style: { textAlign: 'right' } }, `${fmt(f.expected)} / ${f.max}`),
        h('td', { class: 'num', style: { textAlign: 'right' } }, `${fmt(f.interval[0])} to ${fmt(f.interval[1])}`),
        h('td', { class: 'num', style: { textAlign: 'right' } }, `${Math.round(f.pMeetTarget * 100)}%`),
        h('td', { class: 'muted' }, v.weakest?.length ? v.weakest.map((w) => w.family).join(', ') : ''));
    });
    box.append(h('h2', {}, 'Exam forecast'),
      h('p', { class: 'muted' }, 'From your answers so far: an ability model per section, simulated over full exams (skipping any question you would get right less than half the time). The interval is 80%.'),
      rows.length ? h('div', { class: 'panel' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Section'), h('th', { style: { textAlign: 'right' } }, 'Expected'), h('th', { style: { textAlign: 'right' } }, '80% range'), h('th', { style: { textAlign: 'right' } }, 'P(target)'), h('th', {}, 'Weakest families'))),
        h('tbody', {}, rows))) : h('p', { class: 'muted' }, 'Answer questions in any section and the forecast appears here.'));
  });
  sync.verification().then((r) => {
    if (!r?.sections) return;
    const lines = Object.entries(r.sections).map(([id, v]) => {
      const st = v.stats || {};
      const extra = [st.monte_carlo ? `${st.monte_carlo} re-simulated in C++` : null, st.orderbook_solved ? `${st.orderbook_solved} re-solved by branch and bound` : null,
        st.sequence_checked ? `${st.sequence_checked} rule-searched for ambiguity` : null].filter(Boolean).join(', ');
      return h('li', {}, `${SECTIONS[id]?.title || id}: ${st.items || 0} checked, ${st.failed || 0} failed${extra ? `; ${extra}` : ''}.`);
    });
    const z = r.zapn;
    if (z) lines.push(h('li', {}, `Zap-N: ${Object.entries(z).filter(([, v]) => v?.checked).map(([k, v]) => `${k} ${v.checked}`).join(', ')} puzzles re-solved in C++, ${Object.values(z).filter((v) => v?.mismatches?.length).length} with mismatches.`));
    box.append(h('h2', {}, 'Question verification'), h('div', { class: 'panel' }, h('ul', { class: 'plain' }, lines)));
  });
  return box;
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
