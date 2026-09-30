import { h, s, mount as put, clear } from '../../ui/dom.js';
import { ZAPN_TARGETS } from '../../../config/sections.js';
import { createEngine, possible } from './engine.js';
import coach from './coach.js';

const COLOUR = { blue: 'var(--viz-1)', orange: 'var(--viz-2)', green: 'var(--viz-3)', purple: 'var(--viz-4)', red: 'var(--viz-5)' };
const SIZE = { small: 0.6, medium: 0.8, large: 1 };
let patternId = 0;

function shapeEl(shape, cx, cy, r, attrs) {
  if (shape === 'circle') return s('circle', { cx, cy, r, ...attrs });
  if (shape === 'square') return s('rect', { x: cx - r * 0.85, y: cy - r * 0.85, width: r * 1.7, height: r * 1.7, ...attrs });
  const n = shape === 'triangle' ? 3 : shape === 'diamond' ? 4 : 6;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a) + (n === 3 ? r * 0.15 : 0)).toFixed(1)}`;
  }).join(' ');
  return s('polygon', { points: pts, ...attrs });
}

// Draws a figure from a {key: value} map; properties absent in early rounds use defaults.
function figure(f, px = 96) {
  const col = COLOUR[f.colour] ?? 'var(--text)';
  const id = `fio${++patternId}`;
  const fillMode = f.fill ?? 'solid';
  const count = Number(f.count ?? 1), r = 20 * (SIZE[f.size] ?? 0.8);
  const stroke = { stroke: col, 'stroke-width': f.border === 'thick' ? 3 : 1.5, ...(f.border === 'dashed' ? { 'stroke-dasharray': '3 2' } : {}) };
  const fill = fillMode === 'solid' ? col : fillMode === 'outline' ? 'none' : `url(#${id})`;
  const defs = s('defs', {}, fillMode === 'striped'
    ? s('pattern', { id, width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, s('rect', { width: 2, height: 4, fill: col }))
    : s('pattern', { id, width: 4, height: 4, patternUnits: 'userSpaceOnUse' }, s('circle', { cx: 2, cy: 2, r: 1, fill: col })));
  const xs = count === 1 ? [48] : count === 2 ? [28, 68] : [16, 48, 80];
  const rr = count === 3 ? Math.min(r, 14) : count === 2 ? Math.min(r, 17) : r;
  return s('svg', { viewBox: '0 0 96 48', width: px, height: px / 2, 'aria-hidden': 'true' }, defs, xs.map((x) => shapeEl(f.shape ?? 'circle', x, 24, rr, { fill, ...stroke })));
}

export function mount(container, { rng, mode = 'practice', onFinish } = {}) {
  const practice = mode === 'practice';
  const doc = container.ownerDocument;
  let engine = null, code = [], row = 0, timer = 0, hudTime = null;
  const now = () => performance.now();
  const R = () => engine.state.rounds[engine.state.round];
  const asMap = (c) => Object.fromEntries(R().props.map((p, k) => [p.key, p.values[c[k]]]));

  function intro() {
    engine = null;
    const go = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: start }, 'Start');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Figure It Out'),
      h('ul', {}, coach.howItWorks.map((x) => h('li', {}, x))),
      h('p', { class: 'muted' }, h('kbd', {}, '↑'), h('kbd', {}, '↓'), ' property, ', h('kbd', {}, '←'), h('kbd', {}, '→'), ' value, ', h('kbd', {}, 'Enter'), ' guess.'),
      go));
    go.focus();
  }

  function start() {
    clearInterval(timer);
    engine = createEngine(rng);
    engine.act({ type: 'start' }, now());
    newRound();
    timer = setInterval(() => { if (hudTime && engine && engine.state.phase === 'play') hudTime.textContent = `${Math.floor((now() - engine.state.roundStart) / 1000)} s`; }, 500);
  }

  function newRound() { code = R().values.map(() => 0); row = 0; render(); }

  function guess() {
    if (engine.state.phase !== 'play') return;
    engine.act({ type: 'guess', code }, now());
    render();
  }

  function next() {
    engine.act({ type: 'next' }, now());
    if (engine.isOver()) return finish();
    newRound();
  }

  function render() {
    const st = engine.state, Rd = R(), done = st.phase === 'roundDone';
    const poss = possible(Rd.values, st.guesses);
    hudTime = h('span', { class: 'timer' });
    const rows = Rd.props.map((p, k) => h('div', {
      role: 'radiogroup', 'aria-label': p.key,
      style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '4px 8px', borderLeft: `2px solid ${k === row ? 'var(--accent)' : 'transparent'}`, background: k === row ? 'var(--surface-2)' : 'transparent' },
    },
    h('span', { style: { width: '64px', fontSize: '13px' }, class: 'muted' }, p.key),
    p.values.slice(0, Rd.values[k]).map((v, j) => {
      const ruledOut = practice && !poss[k].includes(j);
      return h('button', {
        class: 'btn small', role: 'radio', 'aria-checked': String(code[k] === j), tabindex: code[k] === j ? '0' : '-1',
        style: { minHeight: '40px', borderColor: code[k] === j ? 'var(--accent)' : 'var(--border)', boxShadow: code[k] === j ? 'inset 0 0 0 1px var(--accent)' : 'none', opacity: ruledOut ? '0.4' : '1', textDecoration: ruledOut ? 'line-through' : 'none' },
        onclick: () => { code[k] = j; row = k; render(); },
      }, v);
    })));
    const history = st.guesses.map((g, n) => h('div', { class: 'row', style: { gap: '8px', padding: '4px 0', borderTop: '1px solid var(--border)' } },
      h('span', { class: 'num muted', style: { width: '20px' } }, n + 1),
      figure(Object.fromEntries(Rd.props.map((p, k) => [p.key, p.values[g.code[k]]])), 64),
      Rd.props.map((p, k) => h('span', { class: `badge ${g.marks[k] ? 'ok' : 'no'}` }, `${p.key} ${g.marks[k] ? 'right' : 'wrong'}`))));
    const r = st.results.at(-1);
    const nextBtn = done ? h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: next }, st.round + 1 < st.rounds.length ? 'Next round ' : 'See result ', h('kbd', { style: { color: 'var(--text)' } }, 'Enter')) : null;
    put(container, h('div', { class: 'stage stack' },
      h('div', { class: 'hud' }, h('span', {}, `Round ${st.round + 1}/${st.rounds.length}`), hudTime, h('span', {}, `Guesses ${st.guesses.length}${practice ? ` · optimum ${Rd.expected.toFixed(2)}` : ''}`)),
      h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '24px' } },
        h('div', { class: 'stack', style: { flex: '1 1 320px' } }, rows,
          h('div', { class: 'row' }, h('button', { class: 'btn primary', style: { minHeight: '44px' }, disabled: done, onclick: guess }, 'Guess ', h('kbd', { style: { color: 'var(--text)' } }, 'Enter')))),
        h('div', { style: { textAlign: 'center' } }, h('div', { class: 'muted', style: { fontSize: '13px' } }, 'Your guess'), figure(asMap(code), 144))),
      done ? h('div', { class: 'feedback ok', role: 'status' }, practice ? `Found in ${r.guesses} guesses. Optimal play averages ${r.optimal.toFixed(2)} (worst case ${r.worst}).` : `Found in ${r.guesses} guesses.`) : null,
      nextBtn,
      history.length ? h('div', {}, h('div', { class: 'muted', style: { fontSize: '13px' } }, 'Guesses so far'), history.slice().reverse()) : null));
    if (nextBtn) nextBtn.focus();
  }

  function finish() {
    clearInterval(timer);
    const res = engine.result(), T = ZAPN_TARGETS.figureitout;
    const again = h('button', { class: 'btn primary', style: { minHeight: '44px' }, onclick: intro }, 'Play again');
    put(container, h('div', { class: 'panel stack' },
      h('h2', {}, 'Figure It Out: result'),
      h('p', {}, h('strong', {}, `${res.value.toFixed(2)} guesses above optimal per round`), ` (target at most ${T.value}) `,
        h('span', { class: `badge ${res.value <= T.value ? 'ok' : 'no'}` }, res.value <= T.value ? 'met' : 'not met')),
      h('table', {}, h('thead', {}, h('tr', {}, ['Round', 'Guesses', 'Optimal mean', 'Time'].map((x) => h('th', {}, x)))),
        h('tbody', {}, res.detail.rounds.map((r) => h('tr', {}, h('td', {}, r.round), h('td', { class: 'num' }, r.guesses), h('td', { class: 'num' }, r.optimal.toFixed(2)), h('td', { class: 'num' }, `${Math.round(r.ms / 1000)} s`))))),
      practice ? [h('p', { class: 'rule' }, coach.rule), h('ol', { class: 'steps' }, coach.strategy.map((x, i) => h('li', {}, h('span', { class: 'n' }, i + 1), x.say, h('div', { class: 'why' }, x.why))))] : null,
      again));
    again.focus();
    onFinish?.(res);
  }

  function onKey(e) {
    if (!engine || engine.isOver()) return;
    const st = engine.state;
    if (e.key === 'Enter') {
      if (e.target?.closest?.('button') && !e.target.closest('[role=radio]')) return; // let focused buttons act
      e.preventDefault();
      if (st.phase === 'roundDone') next(); else guess();
      return;
    }
    if (st.phase !== 'play') return;
    const n = R().values.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); row = (row + (e.key === 'ArrowUp' ? n - 1 : 1)) % n; render(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const m = R().values[row];
      code[row] = (code[row] + (e.key === 'ArrowLeft' ? m - 1 : 1)) % m;
      render();
    } else if (/^[1-6]$/.test(e.key) && +e.key <= R().values[row]) { code[row] = +e.key - 1; render(); }
  }
  doc.addEventListener('keydown', onKey);
  intro();

  return () => {
    clearInterval(timer);
    doc.removeEventListener('keydown', onKey);
    clear(container);
  };
}
