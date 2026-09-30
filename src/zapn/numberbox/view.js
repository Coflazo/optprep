import { h, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine } from './engine.js';
import coach from './coach.js';

const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  let engine = null, timer = 0, els = null, note = null;
  const now = () => performance.now();

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'NumberBox'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, 'Type the expression; ', h('kbd', {}, '*'), ' or ', h('kbd', {}, 'x'), ' multiply, ', h('kbd', {}, '/'), ' divides. ', h('kbd', {}, 'Enter'), ' submits.'),
      go));
    go.focus();
  }

  function start() {
    clearInterval(timer);
    engine = createEngine(rng);
    engine.act({ type: 'start' }, now());
    note = null;
    render();
    timer = setInterval(tickHud, 500);
  }

  function insert(text) {
    const inp = els.input, a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
    inp.value = inp.value.slice(0, a) + text + inp.value.slice(b);
    inp.focus();
    inp.setSelectionRange(a + text.length, a + text.length);
    markUsed();
  }

  function markUsed() {
    const R = engine.state.rounds[engine.state.i];
    const used = [...(els.input.value.match(/\d+/g) ?? [])].map(Number);
    R.nums.forEach((n, k) => {
      const j = used.indexOf(n);
      const on = j >= 0;
      if (on) used.splice(j, 1);
      els.tiles[k].style.opacity = on ? '0.4' : '1';
    });
  }

  function submit() {
    const i = engine.state.i, R = engine.state.rounds[i];
    const res = engine.act({ type: 'submit', expr: els.input.value }, now());
    if (!res) return;
    if (!res.valid) note = ['no', `Not valid: ${res.reason}.`];
    else if (!res.ok) note = ['no', practice ? `That makes ${res.value}, not ${R.target}.` : 'Not the target.'];
    else note = ['ok', `Round ${i + 1} solved.`];
    if (engine.isOver()) return finish();
    render(res.ok);
  }

  function skip() {
    const i = engine.state.i, R = engine.state.rounds[i];
    engine.act({ type: 'skip' }, now());
    note = ['no', practice ? `Round ${i + 1} skipped. One solution: ${R.solution} = ${R.target}.` : `Round ${i + 1} skipped.`];
    if (engine.isOver()) return finish();
    render(true);
  }

  function tickHud() {
    if (!engine || !els || engine.isOver()) return;
    els.time.textContent = clock(now() - engine.state.roundStart);
  }

  function render(newRound = true) {
    const st = engine.state, R = st.rounds[st.i];
    const keep = !newRound && els ? els.input.value : '';
    els = {
      time: h('span', { class: 'timer' }),
      input: h('input', { type: 'text', class: 'big', 'aria-label': 'Expression', autocomplete: 'off', spellcheck: 'false', style: { width: '100%', maxWidth: '420px' } }),
      tiles: R.nums.map((n) => h('button', { class: 'btn', style: { minHeight: '52px', minWidth: '52px', fontSize: '22px', justifyContent: 'center', transition: 'opacity 120ms ease' }, onclick: () => insert(String(n)) }, n)),
    };
    els.input.value = keep;
    els.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    els.input.addEventListener('input', markUsed);
    const op = (label, text = label) => h('button', { class: 'btn', style: { minHeight: '44px', minWidth: '44px', justifyContent: 'center' }, onclick: () => insert(text) }, label);
    put(container, h('div', { class: 'stage stack' },
      h('div', { class: 'hud' }, h('span', {}, `Round ${st.i + 1}/${st.rounds.length}`), els.time, h('span', {}, `Solved ${st.results.filter((r) => r.solved).length}`)),
      h('div', { style: { textAlign: 'center' } },
        h('div', { class: 'muted', style: { fontSize: '13px' } }, 'Target'),
        h('div', { class: 'num', style: { fontSize: '44px', fontWeight: 600 } }, R.target)),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, els.tiles),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, op('+', ' + '), op('−', ' - '), op('×', ' × '), op('÷', ' ÷ '), op('('), op(')'),
        h('button', { class: 'btn', style: { minHeight: '44px' }, onclick: () => { els.input.value = ''; markUsed(); els.input.focus(); } }, 'Clear')),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, els.input,
        h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: submit }, 'Submit'),
        h('button', { class: 'btn', style: { minHeight: '44px' }, onclick: skip }, 'Skip')),
      note ? h('div', { class: `feedback ${note[0]}`, role: 'status' }, note[1]) : null,
      practice ? h('p', { class: 'muted', style: { fontSize: '13px' } }, 'Rule: ', coach.rule) : null));
    markUsed();
    tickHud();
    els.input.focus();
  }

  function finish() {
    clearInterval(timer);
    const res = engine.result(), T = ZAPN_TARGETS.numberbox;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'NumberBox: result'),
      h('p', {}, h('strong', {}, `${res.value} of ${res.detail.rounds} targets made`), ` (target ${T.value}) `,
        h('span', { class: `badge ${res.value >= T.value ? 'ok' : 'no'}` }, res.value >= T.value ? 'met' : 'not met')),
      h('p', { class: 'muted' }, `Wrong submissions ${res.detail.wrongSubmits} · mean time per solved round ${res.detail.meanSolveMs ? clock(res.detail.meanSolveMs) : 'n/a'}.`),
      h('table', {}, h('thead', {}, h('tr', {}, ['Round', 'Numbers', 'Target', 'Result', 'A solution'].map((x) => h('th', {}, x)))),
        h('tbody', {}, engine.state.results.map((r) => {
          const R = engine.state.rounds[r.i];
          return h('tr', {}, h('td', {}, r.i + 1), h('td', { class: 'num' }, R.nums.join(' ')), h('td', { class: 'num' }, R.target),
            h('td', {}, h('span', { class: `badge ${r.solved ? 'ok' : 'no'}` }, r.solved ? 'made' : 'skipped')), h('td', { class: 'num' }, R.solution));
        }))),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  intro();
  return () => { clearInterval(timer); clear(container); };
}

