import { h, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine } from './engine.js';
import coach from './coach.js';

const arrows = ({ dir, n }) => (dir === 'left' ? '←' : '→').repeat(n);

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, raf = 0, els = null, drawn = -1, flash = null;
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'The Switch'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'No: ', h('kbd', {}, '←'), ' or ', h('kbd', {}, 'N'), '. Yes: ', h('kbd', {}, '→'), ' or ', h('kbd', {}, 'Y'), '.'),
      go));
    go.focus();
  }

  const block = (title, font) => {
    const body = h('div', { class: 'num', style: { fontSize: '32px', ...(font ? { fontFamily: font } : {}), letterSpacing: '0.08em', textAlign: 'center', minHeight: '48px' } });
    const el = h('div', { style: { border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', transition: 'opacity 120ms ease, border-color 120ms ease, background-color 120ms ease' } },
      h('div', { class: 'muted', style: { fontSize: '13px' } }, title), body);
    return { el, body };
  };

  function start() {
    cancelAnimationFrame(raf);
    engine = createEngine(rng);
    drawn = -1; flash = null;
    els = {
      round: h('span', {}), score: h('span', {}),
      top: block('Is the result odd?'), bottom: block('Do both arrow sets point the same way?', 'var(--font)'),
      note: h('div', { role: 'status', style: { minHeight: '24px', textAlign: 'center', marginTop: '8px' } }),
    };
    put(container, h('div', { class: 'stage' },
      h('div', { class: 'hud' }, els.round, els.score),
      h('div', { class: 'stack' }, els.top.el, els.bottom.el),
      els.note,
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '8px' } },
        h('button', { class: 'btn', style: { minHeight: '44px', minWidth: '120px' }, onclick: () => answer(false) }, h('kbd', {}, '←'), ' No'),
        h('button', { class: 'btn', style: { minHeight: '44px', minWidth: '120px' }, onclick: () => answer(true) }, 'Yes ', h('kbd', {}, '→')))));
    engine.act({ type: 'start' }, now());
    raf = requestAnimationFrame(frame);
  }

  function note(res) {
    if (!practice || !res) return;
    flash = res.timeout ? ['no', 'Too slow'] : res.correct ? ['ok', `Correct, ${Math.round(res.rt)} ms${res.switch ? ' (switch)' : ''}`]
      : ['no', `Wrong: the ${res.task === 'math' ? 'top' : 'bottom'} block was active`];
  }

  function answer(yes) {
    if (!engine || engine.isOver()) return;
    note(engine.act({ type: 'answer', yes }, now()));
    if (engine.isOver()) finish();
  }

  function paint(active, T) {
    for (const [b, on] of [[els.top, active && T.task === 'math'], [els.bottom, active && T.task === 'arrows']]) {
      Object.assign(b.el.style, { opacity: !active || on ? '1' : '0.45', borderColor: on ? 'var(--accent)' : 'var(--border)', background: on ? 'var(--surface-2)' : 'transparent' });
    }
    els.top.body.textContent = active ? T.math.text.replace('-', '−') : '';
    put(els.bottom.body, active ? [h('span', { style: { marginRight: '48px' } }, arrows(T.arrows.a)), h('span', {}, arrows(T.arrows.b))] : '');
  }

  function frame() {
    note(engine.act({ type: 'tick' }, now()));
    if (engine.isOver()) return finish();
    const st = engine.state;
    const key = st.phase === 'stim' ? st.i : -1 - st.i;
    if (key !== drawn) { drawn = key; paint(st.phase === 'stim', st.trials[st.i]); }
    els.round.textContent = `Round ${st.i + 1}/${st.trials.length}`;
    if (practice) {
      els.score.textContent = `Correct ${st.responses.filter((r) => r.correct).length}`;
      if (flash) { els.note.className = `badge ${flash[0]}`; els.note.textContent = flash[1]; }
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    const res = engine.result(), T = ZAPN_TARGETS.theswitch, d = res.detail;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'The Switch: result'),
      h('p', {}, h('strong', {}, `Accuracy ${(res.value * 100).toFixed(0)}%`), ` (${d.correct}/${d.rounds}; target ${T.value * 100}%) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Score ${res.score}/100 (accuracy and speed equally weighted) · mean correct time ${d.meanRt ? Math.round(d.meanRt) + ' ms' : 'n/a'} · switch cost ${d.switchCost != null ? Math.round(d.switchCost) + ' ms' : 'n/a'} · timeouts ${d.timeouts}.`),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver() || e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'n') { e.preventDefault(); answer(false); }
    else if (k === 'arrowright' || k === 'y') { e.preventDefault(); answer(true); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    cancelAnimationFrame(raf);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
