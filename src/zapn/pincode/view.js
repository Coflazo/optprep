import { h, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine, MODES } from './engine.js';
import coach from './coach.js';

const ASK = { forward: 'Type it exactly as shown', reverse: 'Type it in reverse order', sorted: 'Type the digits sorted from low to high' };

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, raf = 0, els = null, drawnKey = '';
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Pincode'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'Type digits with ', h('kbd', {}, '0'), '-', h('kbd', {}, '9'), ', correct with ', h('kbd', {}, 'Backspace'), ', submit with ', h('kbd', {}, 'Enter'), '. No pen and paper.'),
      go));
    go.focus();
  }

  function start() {
    cancelAnimationFrame(raf);
    engine = createEngine(rng);
    drawnKey = '';
    const key = (label, onclick, extra = {}) => h('button', { class: 'btn', style: { minHeight: '44px', justifyContent: 'center' }, onclick, ...extra }, label);
    els = {
      mode: h('span', {}), len: h('span', {}), span: h('span', {}),
      ask: h('p', { class: 'muted', style: { textAlign: 'center', margin: '8px 0' } }),
      big: h('div', { class: 'num', 'aria-live': 'polite', style: { fontSize: '36px', letterSpacing: '0.2em', textAlign: 'center', minHeight: '56px' } }),
      note: h('div', { role: 'status', style: { minHeight: '28px', textAlign: 'center' } }),
    };
    const pad = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: '6px', justifyContent: 'center', marginTop: '8px' } },
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => key(String(d), () => send({ type: 'digit', d }))),
      key('Del', () => send({ type: 'back' }), { 'aria-label': 'Delete last digit' }),
      key('0', () => send({ type: 'digit', d: 0 })),
      key('OK', () => send({ type: 'submit' }), { class: 'btn primary', 'aria-label': 'Submit' }));
    put(container, h('div', { class: 'stage' }, h('div', { class: 'hud' }, els.mode, els.len, els.span), els.ask, els.big, els.note, pad));
    engine.act({ type: 'start' }, now());
    raf = requestAnimationFrame(frame);
  }

  function send(action) {
    if (!engine || engine.isOver()) return;
    const res = engine.act(action, now());
    if (res && 'correct' in res) {
      els.note.className = `badge ${res.correct ? 'ok' : 'no'}`;
      els.note.textContent = res.correct ? 'Correct' : practice ? `Wrong: expected ${res.want}, you typed ${res.typed || 'nothing'}` : 'Wrong';
    }
    drawnKey = '';
  }

  function frame() {
    engine.act({ type: 'tick' }, now());
    if (engine.isOver()) return finish();
    const st = engine.state, m = MODES[st.mode];
    const k = `${st.phase}|${st.digits}|${st.typed}|${st.mode}`;
    if (k !== drawnKey) {
      drawnKey = k;
      els.mode.textContent = `Mode ${st.mode + 1}/3: ${m}`;
      els.len.textContent = `${st.len} digits`;
      els.span.textContent = `Forward span ${st.spans.forward}`;
      els.ask.textContent = st.phase === 'show' ? `Memorise. ${ASK[m]}.` : st.phase === 'input' ? ASK[m] : '';
      els.big.textContent = st.phase === 'show' ? st.digits : st.phase === 'input' ? (st.typed || '_') : '';
      if (st.phase === 'show') { els.note.textContent = ''; els.note.className = ''; }
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    const res = engine.result(), T = ZAPN_TARGETS.pincode, sp = res.detail.spans;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Pincode: result'),
      h('p', {}, h('strong', {}, `Forward span ${res.value}`), ` (target ${T.value}) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Reverse span ${sp.reverse} · sorted span ${sp.sorted} · ${res.detail.correct}/${res.detail.trials} codes correct.`),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver() || e.target?.closest?.('input, select, textarea')) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); send({ type: 'digit', d: +e.key }); }
    else if (e.key === 'Backspace') { e.preventDefault(); send({ type: 'back' }); }
    else if (e.key === 'Enter') { e.preventDefault(); send({ type: 'submit' }); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    cancelAnimationFrame(raf);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
