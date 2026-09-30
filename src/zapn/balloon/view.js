import { h, s, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine, ROUNDS, MAX_PUMPS } from './engine.js';
import coach from './coach.js';

const money = (c) => `$${(c / 100).toFixed(2)}`;
const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, timer = 0, note = null, shownRound = 0;

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Balloon'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'Pump: ', h('kbd', {}, 'Space'), ' or ', h('kbd', {}, '↑'), '. Collect: ', h('kbd', {}, 'Enter'), '.'),
      go));
    go.focus();
  }

  function start() {
    clearInterval(timer);
    engine = createEngine(rng);
    engine.act({ type: 'start' }, performance.now());
    note = null; shownRound = 0;
    render();
    timer = setInterval(renderHud, 500);
  }

  const act = (type) => {
    if (!engine || engine.isOver() || shownRound !== engine.state.round) return;
    const res = engine.act({ type }, performance.now());
    if (res && res.outcome !== 'pumped') note = res;
    if (engine.isOver()) return finish();
    render();
  };

  let hud;
  function renderHud() {
    if (!engine || !hud) return;
    const st = engine.state, r = ROUNDS[st.round] ?? ROUNDS.at(-1);
    put(hud,
      h('span', {}, `Round ${st.round + 1}/2 · Balloon ${st.balloon + 1}/${r.balloons}`),
      h('span', { class: 'timer' }, clock(performance.now() - st.startAt)),
      h('span', {}, `Bank ${money(st.banks[st.round] ?? 0)}`));
  }

  function roundBreak() {
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: () => { shownRound = engine.state.round; render(); } }, 'Start round 2');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Round 2'),
      h('p', {}, `Round 1 bank: ${money(engine.state.banks[0])}. Now 20 balloons at 20c per pump, and a pop also costs half of your round-2 bank.`),
      practice ? h('p', { class: 'rule' }, coach.rule) : null,
      go));
    go.focus();
  }

  function render() {
    const st = engine.state;
    if (st.round !== shownRound) return roundBreak();
    const r = ROUNDS[st.round];
    const radius = 30 + (st.pumps / MAX_PUMPS) * 90;
    hud = h('div', { class: 'hud' });
    const feedback = note && h('div', { class: `feedback ${note.outcome === 'pop' ? 'no' : 'ok'}`, role: 'status' },
      note.outcome === 'pop'
        ? `Popped on pump ${note.pumps}.${note.lost ? ` Lost ${money(note.lost)} from the bank.` : ''}`
        : `Collected ${money(note.earned)} after ${note.pumps} pumps.`,
      practice ? ` Pop point was ${note.popAt}; the EV-optimal target was ${note.optimal}.` : '');
    put(container, h('div', { class: 'stage' },
      hud,
      h('div', { style: { display: 'flex', justifyContent: 'center' } },
        s('svg', { viewBox: '0 0 260 260', width: 260, height: 260, role: 'img', 'aria-label': `Balloon with ${st.pumps} pumps` },
          s('line', { x1: 130, y1: 130 + radius, x2: 130, y2: 258, stroke: 'var(--text-2)', 'stroke-width': 1 }),
          s('circle', { cx: 130, cy: 130, r: radius, fill: 'var(--viz-5)', 'fill-opacity': 0.85, stroke: 'var(--text)', 'stroke-width': 1 }))),
      h('p', { style: { textAlign: 'center', fontSize: '18px' }, class: 'num' },
        `${st.pumps} pumps · ${money(st.pumps * r.centsPerPump)} in this balloon`),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn primary', style: { minHeight: '44px', minWidth: '120px' }, onclick: () => act('pump') }, 'Pump ', h('kbd', { style: { color: 'var(--text)' } }, 'Space')),
        h('button', { class: 'btn', style: { minHeight: '44px', minWidth: '120px' }, onclick: () => act('cash') }, 'Collect ', h('kbd', {}, 'Enter'))),
      feedback));
    renderHud();
  }

  function finish() {
    clearInterval(timer);
    const res = engine.result();
    const T = ZAPN_TARGETS.balloon;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Balloon: result'),
      h('p', {}, `Bank ${money(res.detail.bankCents)}; the EV-optimal policy earned ${money(res.detail.optimalCents)} on the same balloons.`),
      h('p', {}, h('strong', {}, `Ratio ${res.value.toFixed(2)}`), ` (target ${T.value}: ${T.label}) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, res.detail.perRound.map((r, i) => `Round ${i + 1}: ${money(r.bank)} vs optimal ${money(r.optimal)}, ${r.pops} pops, ${r.meanPumps.toFixed(1)} pumps per balloon.`).join(' ')),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver() || e.target?.closest?.('button, input, select, textarea')) return;
    if (shownRound !== engine.state.round) return;
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) act('pump'); }
    else if (e.key === 'Enter') { e.preventDefault(); act('cash'); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    clearInterval(timer);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
