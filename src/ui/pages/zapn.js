import { h, mount } from '../dom.js';
import { GAMES, GAME_BY_ID } from '../../zapn/index.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { zapnMeets, zapnReadiness } from '../../core/readiness.js';
import { makeRng } from '../../core/rng.js';

const fmtVal = (metric, v) => (v == null ? '—' : metric === 'accuracy' || metric === 'ratio' ? `${(v * 100).toFixed(0)}%` : `${Math.round(v * 100) / 100}`);

function best(runs, target) {
  const vals = runs.filter((r) => r.metric === target.metric).map((r) => r.value);
  if (!vals.length) return null;
  return target.metric.endsWith('Over') ? Math.min(...vals) : Math.max(...vals);
}

export function zapnHub(root, { store }) {
  mount(root,
    h('h1', {}, 'Zap-N'),
    h('p', { class: 'muted' }, 'Nine short games. Learn each one, practise it with feedback, then run it in exam mode. A game is ready after three exam runs in a row at target.'),
    h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Game'), h('th', {}, 'Trains'), h('th', { style: { textAlign: 'right' } }, 'Best'), h('th', {}, 'Target'), h('th', {}, 'Status'), h('th', {}))),
      h('tbody', {}, GAMES.map((g) => {
        const target = ZAPN_TARGETS[g.id];
        const runs = store.zapnRuns(g.id);
        const r = zapnReadiness(runs, target);
        return h('tr', {},
          h('td', {}, h('strong', {}, g.title)),
          h('td', { class: 'muted' }, g.skill || '—'),
          h('td', { class: 'num', style: { textAlign: 'right' } }, fmtVal(target.metric, best(runs, target))),
          h('td', { class: 'muted small-note' }, target.label),
          h('td', {}, g.pending ? h('span', { class: 'badge warn' }, 'Being built') : r.ready ? h('span', { class: 'badge ok' }, 'Ready') : h('span', { class: 'badge' }, `Streak ${r.streak}/${r.needed}`)),
          h('td', { style: { textAlign: 'right', whiteSpace: 'nowrap' } }, g.pending ? null : [
            h('a', { class: 'btn small', href: `#/zapn/${g.id}/practice` }, 'Practise'), ' ',
            h('a', { class: 'btn small', href: `#/zapn/${g.id}/exam` }, 'Exam')]));
      })))));
}

export function zapnGame(root, { store, id, mode = 'practice' }) {
  const g = GAME_BY_ID[id];
  if (!g || g.pending) return mount(root, h('h1', {}, g ? g.title : 'Unknown game'), h('p', { class: 'muted' }, 'This game is still being built.'));
  const target = ZAPN_TARGETS[id];
  const c = g.coach || {};
  const stage = h('div', {});
  const resultBox = h('div', {});
  let unmount = null;
  // Coach opens by default only until the game has been played once, so the stage is visible first after that.
  const coach = h('details', { class: 'panel', open: mode === 'practice' && !store.zapnRuns(id).length },
    h('summary', {}, h('strong', {}, 'How it works and how to play it well')),
    c.purpose ? h('p', {}, c.purpose) : null,
    g.spec ? h('p', { class: 'muted' }, g.spec) : null,
    c.howItWorks?.length ? h('ul', {}, c.howItWorks.map((x) => h('li', {}, x))) : null,
    c.scoring ? h('p', {}, h('strong', {}, 'Scoring. '), c.scoring) : null,
    c.strategy?.length ? h('ol', { class: 'steps' }, c.strategy.map((s, i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)), h('div', {}, s.say), h('div', { class: 'why' }, s.why)))) : null,
    c.rule ? h('div', { class: 'rule' }, c.rule) : null);

  function start() {
    resultBox.replaceChildren();
    unmount?.();
    unmount = g.view.mount(stage, {
      rng: makeRng(`${id}:${Date.now()}`), mode,
      onFinish: (result) => {
        store.recordZapn(id, { mode, ...result });
        const ok = zapnMeets(result, target);
        const r = zapnReadiness(store.zapnRuns(id), target);
        resultBox.replaceChildren(h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
          h('strong', {}, `${result.metric}: ${fmtVal(result.metric, result.value)}. `),
          ok ? 'At target. ' : `Target: ${target.label}. `,
          mode === 'exam' ? (r.ready ? 'Ready: three exam runs in a row at target.' : `Readiness streak ${r.streak}/${r.needed}.`) : 'Practice runs do not count toward readiness.',
          result.detail ? h('div', { class: 'muted' }, typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail)) : null),
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn primary', type: 'button', onclick: start }, 'Play again'), h('a', { class: 'btn', href: '#/zapn' }, 'All games')));
      },
    });
  }

  mount(root,
    h('p', { class: 'muted' }, h('a', { href: '#/zapn' }, 'Zap-N'), ` / ${g.title} / ${mode === 'exam' ? 'Exam' : 'Practice'}`),
    h('h1', {}, g.title),
    h('p', { class: 'muted' }, g.skill),
    coach, h('div', { style: { height: '16px' } }), stage, resultBox);
  start();
  return () => unmount?.();
}
