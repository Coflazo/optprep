import { h, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine } from './engine.js';
import coach from './coach.js';

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, raf = 0, els = null, drawn = -1;
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'CodeCompare'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'Answer with ', h('kbd', {}, '1'), h('kbd', {}, '2'), h('kbd', {}, '3'), h('kbd', {}, '4'), ' or a click.'),
      go));
    go.focus();
  }

  function start() {
    cancelAnimationFrame(raf);
    engine = createEngine(rng, { gapMs: practice ? 900 : 400 });
    drawn = -1;
    els = {
      round: h('span', {}), left: h('span', { class: 'timer' }), score: h('span', {}),
      bar: h('span', { style: { width: '100%', transition: 'none' } }),
      target: h('div', { class: 'num', style: { fontSize: '28px', letterSpacing: '0.12em', textAlign: 'center', padding: '16px 0' } }),
      options: h('div', { class: 'options' }),
    };
    put(container, h('div', { class: 'stage' },
      h('div', { class: 'hud' }, els.round, els.left, els.score),
      h('div', { class: 'bar' }, els.bar),
      els.target, els.options));
    engine.act({ type: 'start' }, now());
    raf = requestAnimationFrame(frame);
  }

  function choose(index) {
    if (!engine || engine.state.phase !== 'show') return;
    engine.act({ type: 'choose', index }, now());
    paintOptions();
  }

  function paintOptions() {
    const st = engine.state, R = st.rounds[st.i];
    const answered = st.phase === 'gap' ? st.responses.at(-1) : null;
    put(els.options, R.options.map((o, k) => {
      let cls = 'option';
      if (answered && practice) {
        if (k === R.answer) cls += ' is-correct';
        else if (k === answered.choice) cls += ' is-wrong';
      }
      return h('button', { class: cls, 'aria-label': `Option ${k + 1}: ${o.split('').join(' ')}`, onclick: () => choose(k) },
        h('span', { class: 'key' }, k + 1), h('span', { class: 'val', style: { fontSize: '20px', letterSpacing: '0.12em' } }, o));
    }));
  }

  function frame() {
    const t = now();
    const res = engine.act({ type: 'tick' }, t);
    if (engine.isOver()) return finish();
    const st = engine.state, R = st.rounds[st.i];
    if (drawn !== st.i || res) {
      drawn = st.i;
      els.target.textContent = R.target;
      paintOptions();
    }
    const left = engine.remaining(t);
    els.round.textContent = `Round ${st.i + 1}/${st.rounds.length}`;
    els.left.textContent = st.phase === 'show' ? `${(left / 1000).toFixed(1)} s` : '';
    els.left.className = `timer${left < 1000 && st.phase === 'show' ? ' low' : ''}`;
    els.bar.style.width = `${st.phase === 'show' ? (100 * left) / R.allowanceMs : 0}%`;
    if (practice) els.score.textContent = `Correct ${st.responses.filter((r) => r.correct).length}`;
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    const res = engine.result(), T = ZAPN_TARGETS.codecompare;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'CodeCompare: result'),
      h('p', {}, h('strong', {}, `Accuracy ${(res.value * 100).toFixed(0)}%`), ` (${res.detail.correct}/${res.detail.rounds}; target ${T.value * 100}%) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Timeouts ${res.detail.timeouts} · mean time on correct answers ${res.detail.meanRt ? (res.detail.meanRt / 1000).toFixed(2) + ' s' : 'n/a'}.`),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver()) return;
    if (e.key >= '1' && e.key <= '4') { e.preventDefault(); choose(+e.key - 1); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    cancelAnimationFrame(raf);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
