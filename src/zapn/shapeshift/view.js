import { h, s, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine } from './engine.js';
import coach from './coach.js';

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, raf = 0, els = null, flash = null, drawnTrial = -1;
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Shapeshift'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, h('kbd', {}, '←'), ' square, ', h('kbd', {}, '→'), ' circle. Keep your eyes on the centre.'),
      go));
    go.focus();
  }

  function start() {
    cancelAnimationFrame(raf);
    engine = createEngine(rng);
    flash = null;
    const shape = s('svg', { viewBox: '0 0 60 60', width: 60, height: 60, style: { position: 'absolute', visibility: 'hidden' }, 'aria-hidden': 'true' });
    drawnTrial = -1;
    const round = h('span', {}), score = h('span', {});
    els = {
      round, score,
      hud: h('div', { class: 'hud' }, round, score),
      field: h('div', { style: { position: 'relative', height: '300px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', overflow: 'hidden' } },
        h('div', { style: { position: 'absolute', left: '50%', top: '50%', width: '9px', height: '9px', marginLeft: '-4px', marginTop: '-4px', borderRadius: '50%', background: 'var(--border)' } }),
        shape),
      shape,
      note: h('div', { role: 'status', style: { minHeight: '24px', marginTop: '8px', textAlign: 'center' } }),
    };
    put(container, h('div', { class: 'stage' }, els.hud, els.field, els.note,
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '8px' } },
        h('button', { class: 'btn', style: { minHeight: '44px', minWidth: '120px' }, onclick: () => press('left') }, h('kbd', {}, '←'), ' Square'),
        h('button', { class: 'btn', style: { minHeight: '44px', minWidth: '120px' }, onclick: () => press('right') }, 'Circle ', h('kbd', {}, '→')))));
    engine.act({ type: 'start' }, now());
    raf = requestAnimationFrame(frame);
  }

  function show(res) {
    if (!practice || !res || res.early) return;
    flash = res.miss ? ['no', 'Too slow'] : res.correct ? ['ok', `Correct, ${Math.round(res.rt)} ms`] : ['no', `Wrong: that was a ${res.shape}`];
  }

  function press(key) {
    if (!engine || engine.isOver()) return;
    const res = engine.act({ type: 'key', key }, now());
    if (res?.early && practice) flash = ['no', 'Early: wait for the shape'];
    else show(res);
    if (engine.isOver()) return finish();
  }

  function frame() {
    const t = now();
    show(engine.act({ type: 'tick' }, t));
    if (engine.isOver()) return finish();
    const st = engine.state, T = st.trials[st.i];
    if (drawnTrial !== st.i && st.phase === 'stim') {
      drawnTrial = st.i;
      put(els.shape, T.shape === 'circle'
        ? s('circle', { cx: 30, cy: 30, r: 26, fill: 'var(--text)' })
        : s('rect', { x: 6, y: 6, width: 48, height: 48, fill: 'var(--text)' }));
      Object.assign(els.shape.style, { left: `calc(${T.x * 100}% - 30px)`, top: `calc(${T.y * 100}% - 30px)` });
    }
    els.shape.style.visibility = engine.visible(t) ? 'visible' : 'hidden';
    els.round.textContent = `Round ${Math.min(st.i + 1, st.trials.length)}/${st.trials.length}`;
    if (practice) els.score.textContent = `Correct ${st.responses.filter((r) => r.correct).length}`;
    if (practice && flash) { els.note.className = `badge ${flash[0]}`; els.note.textContent = flash[1]; }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    const res = engine.result(), T = ZAPN_TARGETS.shapeshift;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Shapeshift: result'),
      h('p', {}, h('strong', {}, `Accuracy ${(res.value * 100).toFixed(0)}%`), ` (${res.detail.correct}/${res.detail.rounds}; target ${T.value * 100}%) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Mean reaction time ${res.detail.meanRt ? Math.round(res.detail.meanRt) + ' ms' : 'n/a'} · misses ${res.detail.misses} · early presses ${res.detail.early}.`),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver()) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (!e.repeat) press(e.key === 'ArrowLeft' ? 'left' : 'right');
    }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    cancelAnimationFrame(raf);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}

