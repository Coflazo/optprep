import { h, s, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine, needle } from './engine.js';
import coach from './coach.js';

const CX = 60, CY = 58, RAD = 48;
const pt = (p, r = RAD) => [CX - r * Math.cos(Math.PI * p), CY - r * Math.sin(Math.PI * p)];
const arc = (p0, p1, r = RAD) => { const [x0, y0] = pt(p0, r), [x1, y1] = pt(p1, r); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, raf = 0, els = null, flash = null;
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Stock Master'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'Buy with a click or ', h('kbd', {}, '1'), h('kbd', {}, '2'), h('kbd', {}, '3'), h('kbd', {}, '4'), '.'),
      go));
    go.focus();
  }

  function slotView(i) {
    const zone = s('path', { fill: 'none', stroke: 'var(--correct)', 'stroke-width': 10 });
    const hand = s('line', { x1: CX, y1: CY, stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    const face = s('g', { style: { visibility: 'hidden' } }, zone, hand, s('circle', { cx: CX, cy: CY, r: 4, fill: 'var(--text)' }));
    const svg = s('svg', { viewBox: '0 0 120 70', width: 150, height: 88, 'aria-hidden': 'true' },
      s('path', { d: arc(0, 1), fill: 'none', stroke: 'var(--border)', 'stroke-width': 10 }), face);
    const btn = h('button', { class: 'btn', 'aria-label': `Indicator ${i + 1}`, style: { flexDirection: 'column', height: 'auto', padding: '8px', minWidth: '150px' }, onclick: () => click(i) },
      svg, h('span', { class: 'muted', style: { fontSize: '12px' } }, h('kbd', {}, String(i + 1))));
    return { btn, face, zone, hand, id: null };
  }

  function start() {
    cancelAnimationFrame(raf);
    engine = createEngine(rng);
    flash = null;
    els = {
      left: h('span', { class: 'timer' }), hits: h('span', {}),
      slots: Array.from({ length: engine.state.opts.slots }, (_, i) => slotView(i)),
      note: h('div', { role: 'status', style: { minHeight: '24px', textAlign: 'center', marginTop: '12px' } }),
    };
    put(container, h('div', { class: 'stage' },
      h('div', { class: 'hud' }, h('span', {}, 'Buy inside the green zone'), els.left, els.hits),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '12px' } }, els.slots.map((x) => x.btn)),
      els.note));
    engine.act({ type: 'start' }, now());
    raf = requestAnimationFrame(frame);
  }

  function click(i) {
    if (!engine || engine.isOver()) return;
    const r = engine.act({ type: 'click', slot: i }, now());
    if (r && practice) flash = r.result === 'hit' ? ['ok', 'Bought'] : r.result === 'empty' ? ['no', 'No indicator there'] : ['no', r.result === 'early' ? 'Too early' : 'Too late'];
  }

  function frame() {
    const t = now();
    engine.act({ type: 'tick' }, t);
    if (engine.isOver()) return finish();
    const st = engine.state, rel = t - st.startAt;
    const live = engine.active(t);
    els.slots.forEach((v, i) => {
      const g = live.find((x) => x.slot === i);
      if (!g) { if (v.id !== null) { v.id = null; v.face.style.visibility = 'hidden'; } return; }
      if (v.id !== g.id) { v.id = g.id; v.zone.setAttribute('d', arc(g.zone[0], g.zone[1])); v.face.style.visibility = 'visible'; }
      const [x, y] = pt(needle(g, rel), RAD - 6);
      v.hand.setAttribute('x2', x.toFixed(1)); v.hand.setAttribute('y2', y.toFixed(1));
    });
    const left = Math.max(0, st.opts.durationMs - rel);
    els.left.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    els.hits.textContent = practice ? `Hits ${st.hits} · misses ${st.misses} · false ${st.falseClicks}` : `Hits ${st.hits}`;
    if (practice && flash) { els.note.className = `badge ${flash[0]}`; els.note.textContent = flash[1]; }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    const res = engine.result(), T = ZAPN_TARGETS.stockmaster, d = res.detail;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Stock Master: result'),
      h('p', {}, h('strong', {}, `Hit rate ${(res.value * 100).toFixed(0)}%`), ` (target ${T.value * 100}%) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Hits ${d.hits} · misses ${d.misses} · false clicks ${d.falseClicks} (early ${d.early}, late ${d.late}, empty slot ${d.empty}).`),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver() || e.repeat) return;
    if (e.key >= '1' && e.key <= String(engine.state.opts.slots)) { e.preventDefault(); click(+e.key - 1); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    cancelAnimationFrame(raf);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
