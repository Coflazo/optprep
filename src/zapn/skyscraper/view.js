import { h, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine, optimalPath } from './engine.js';
import coach from './coach.js';

const COLOURS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--warn)'];
const LABELS = 'ABCDEF';
const BLOCK = 30;
const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;

function tower(blocks, cap, { selected = false, small = false } = {}) {
  const w = small ? 40 : 64, bh = small ? 20 : BLOCK;
  return h('div', { style: { display: 'flex', flexDirection: 'column-reverse', gap: '2px', width: `${w}px`, height: `${cap * (bh + 2) + 6}px`, padding: '2px', borderBottom: '2px solid var(--text-2)', background: selected ? 'var(--surface-2)' : 'transparent', borderRadius: '4px 4px 0 0' } },
    blocks.map((b) => h('div', { style: { height: `${bh}px`, background: COLOURS[b], borderRadius: '4px', color: 'var(--surface)', fontSize: small ? '11px' : '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, LABELS[b])));
}

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, sel = null, msg = null, timer = 0, advance = 0;
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Skyscraper'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'Keys: ', h('kbd', {}, '1'), h('kbd', {}, '2'), h('kbd', {}, '3'), ' pick a tower, then the destination. ', h('kbd', {}, 'Esc'), ' cancels, ', h('kbd', {}, 'R'), ' resets the level (moves still count).'),
      go));
    go.focus();
  }

  function start() {
    clearInterval(timer);
    engine = createEngine(rng);
    engine.act({ type: 'start' }, now());
    sel = null; msg = null;
    render();
    timer = setInterval(renderHud, 250);
  }

  function pick(i) {
    if (!engine || engine.state.phase !== 'play') return;
    if (sel == null) { if (engine.state.towers[i].length) sel = i; render(); return; }
    if (sel === i) { sel = null; render(); return; }
    const res = engine.act({ type: 'move', from: sel, to: i }, now());
    sel = null;
    msg = res && !res.ok ? { bad: true, text: 'That tower is full.' } : null;
    if (res?.solved) return levelDone(res.result);
    render();
  }

  function levelDone(r) {
    const L = engine.state.levels[engine.state.level];
    msg = { ok: !practice || r.over === 0, text: practice ? `Solved in ${r.moves} moves (optimal ${r.opt}). Planning ${secs(r.planMs)}, total ${secs(r.totalMs)}.` : 'Level complete.',
      path: practice && r.over > 0 ? optimalPath(L.start, L.target, L.caps).map(([f, t]) => `${f + 1}→${t + 1}`).join(', ') : null };
    render();
    if (!practice) advance = setTimeout(next, 700);
  }

  function next() {
    clearTimeout(advance);
    if (!engine || engine.state.phase !== 'levelDone') return;
    engine.act({ type: 'next' }, now());
    msg = null;
    if (engine.isOver()) return finish();
    render();
  }

  let hud;
  function renderHud() {
    if (!engine || !hud || engine.isOver()) return;
    const st = engine.state;
    put(hud,
      h('span', {}, `Level ${st.level + 1}/10`),
      h('span', { class: 'timer' }, st.phase === 'play' ? secs(now() - st.levelStart) : ''),
      h('span', {}, `Moves ${st.moves}${practice ? ` · optimal ${st.levels[st.level].opt}` : ''}`));
  }

  function render() {
    const st = engine.state, L = st.levels[st.level];
    hud = h('div', { class: 'hud' });
    const nextBtn = st.phase === 'levelDone' && practice ? h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: next }, 'Next level ', h('kbd', { style: { color: 'var(--text)' } }, 'Enter')) : null;
    put(container, h('div', { class: 'stage' },
      hud,
      h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '32px' } },
        h('div', {},
          h('div', { class: 'muted', style: { fontSize: '13px', marginBottom: '6px' } }, 'Target'),
          h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '8px' } }, L.target.map((t, i) => tower(t, L.caps[i], { small: true })))),
        h('div', {},
          h('div', { class: 'muted', style: { fontSize: '13px', marginBottom: '6px' } }, sel == null ? 'Your towers: pick a tower' : `Move the top of tower ${sel + 1} to...`),
          h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '12px' } },
            st.towers.map((t, i) => h('button', {
              class: 'btn', 'aria-pressed': String(sel === i), 'aria-label': `Tower ${i + 1}: ${t.map((b) => LABELS[b]).join(' ') || 'empty'}, holds ${L.caps[i]}`,
              style: { flexDirection: 'column', alignItems: 'center', padding: '6px', height: 'auto', borderColor: sel === i ? 'var(--accent)' : 'var(--border)' },
              onclick: () => pick(i),
            }, tower(t, L.caps[i], { selected: sel === i }), h('span', { class: 'muted', style: { fontSize: '12px' } }, h('kbd', {}, String(i + 1)))))))),
      msg ? h('div', { class: `feedback ${msg.bad ? 'no' : msg.ok === false ? 'no' : 'ok'}`, role: 'status' }, msg.text, msg.path ? h('div', { class: 'muted' }, `Optimal sequence: ${msg.path}`) : null) : null,
      nextBtn));
    renderHud();
    nextBtn?.focus();
  }

  function finish() {
    clearInterval(timer);
    const res = engine.result(), T = ZAPN_TARGETS.skyscraper;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Skyscraper: result'),
      h('p', {}, h('strong', {}, `${res.value.toFixed(2)} moves over optimal per level`), ` (target at most ${T.value}) `,
        h('span', { class: `badge ${res.value <= T.value ? 'ok' : 'no'}` }, res.value <= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Mean planning time ${secs(res.detail.meanPlanMs)}, mean level time ${secs(res.detail.meanTotalMs)}.`),
      h('table', {}, h('thead', {}, h('tr', {}, ['Level', 'Moves', 'Optimal', 'Planning'].map((x) => h('th', {}, x)))),
        h('tbody', {}, res.detail.levels.map((r) => h('tr', {}, h('td', {}, r.level), h('td', { class: 'num' }, r.moves), h('td', { class: 'num' }, r.opt), h('td', { class: 'num' }, secs(r.planMs)))))),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver() || e.target?.closest?.('button, input, select, textarea')) {
      if (engine && e.key >= '1' && e.key <= '3' && e.target?.closest?.('.stage')) { e.preventDefault(); pick(+e.key - 1); }
      return;
    }
    if (e.key >= '1' && e.key <= '3') { e.preventDefault(); pick(+e.key - 1); }
    else if (e.key === 'Escape') { sel = null; render(); }
    else if (e.key === 'r' || e.key === 'R') { if (engine.state.phase === 'play') { engine.act({ type: 'reset' }, now()); sel = null; render(); } }
    else if (e.key === 'Enter' && engine.state.phase === 'levelDone') { e.preventDefault(); next(); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    clearInterval(timer); clearTimeout(advance);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
