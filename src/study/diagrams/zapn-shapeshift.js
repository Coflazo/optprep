// Shapeshift: trials on the stage and how each response is scored, plus the timing of one trial.
// spec: { trials: [{ shape: 'circle' | 'square', x, y, key?: 'left' | 'right' | null, rt?: ms, result? }],
//         timeline?: true, stated?: { correct?, accuracy? } }
//   result: 'correct' | 'wrong' | 'miss'. x, y are stage fractions (the engine draws x in 0.1..0.9,
//   y in 0.15..0.85). rt counts from the flash; the flash lasts 500 ms, the answer window 1500 ms.
// validate: shapes and positions as the engine draws them; a stated result follows the engine:
// no key, or a key at or after the window, is a miss; otherwise correct exactly when the key is
// KEY_FOR[shape] (right for a circle, left for a square). rt below 0 is an early press, not an
// answer, so it is rejected. stated correct and accuracy (correct / trials) match.
import { svg, text, rect, line, near } from './_util.js';
import { s } from '../../ui/dom.js';
import { KEY_FOR, DEFAULTS } from '../../zapn/shapeshift/engine.js';

export const outcome = (t) => (t.key == null || t.rt == null || t.rt >= DEFAULTS.windowMs ? 'miss' : t.key === KEY_FOR[t.shape] ? 'correct' : 'wrong');

export function validate(spec) {
  const T = spec?.trials;
  if (!Array.isArray(T) || !T.length) return ['zapn-shapeshift: trials required'];
  const e = [];
  T.forEach((t, i) => {
    if (!(t.shape in KEY_FOR)) e.push(`zapn-shapeshift: trial ${i + 1} shape must be circle or square`);
    if (!(t.x >= 0.1 && t.x <= 0.9 && t.y >= 0.15 && t.y <= 0.85)) e.push(`zapn-shapeshift: trial ${i + 1} position outside the engine's stage area`);
    if (t.key != null && !['left', 'right'].includes(t.key)) e.push(`zapn-shapeshift: trial ${i + 1} key must be left, right or null`);
    if (t.rt != null && t.rt < 0) e.push(`zapn-shapeshift: trial ${i + 1} pressed before the shape: an early press is not an answer`);
    if (!e.length && t.result != null && t.result !== outcome(t)) e.push(`zapn-shapeshift: trial ${i + 1} is ${outcome(t)}, stated ${t.result}`);
  });
  if (e.length) return e;
  const correct = T.filter((t) => outcome(t) === 'correct').length;
  if (spec.stated?.correct != null && spec.stated.correct !== correct) e.push(`zapn-shapeshift: ${correct} correct, stated ${spec.stated.correct}`);
  if (spec.stated?.accuracy != null && !near(spec.stated.accuracy, correct / T.length)) e.push(`zapn-shapeshift: accuracy ${correct / T.length}, stated ${spec.stated.accuracy}`);
  return e;
}

const KEYTXT = { left: '← left', right: 'right →' };
const ARROW = { left: '←', right: '→' };

export function render(spec) {
  const SW = 112, SH = 72, G = 14;
  const W = Math.max(spec.trials.length * (SW + G) + G, spec.timeline ? 440 : 0);
  const H = SH + 58 + (spec.timeline ? 84 : 0);
  const parts = [];
  spec.trials.forEach((t, i) => {
    const x0 = G + i * (SW + G), y0 = 16;
    parts.push(text(x0 + SW / 2, 8, `round ${i + 1}`, { class: 'dg-text dg-small dg-muted' }));
    parts.push(rect(x0, y0, SW, SH, 'dg-box', 4));
    const cx = x0 + t.x * SW, cy = y0 + t.y * SH;
    parts.push(t.shape === 'circle' ? s('circle', { cx, cy, r: 9, class: 'dg-dot dg-mark' }) : rect(cx - 8, cy - 8, 16, 16, 'dg-region dg-tone-2', 1));
    const o = outcome(t);
    if (t.key === undefined) parts.push(text(x0 + SW / 2, y0 + SH + 14, `answer: ${KEYTXT[KEY_FOR[t.shape]]}`, { class: 'dg-text dg-small dg-strong-text' }));
    else {
      parts.push(text(x0 + SW / 2, y0 + SH + 14, t.key ? `${ARROW[t.key]} ${t.key}${t.rt != null ? `, ${t.rt} ms` : ''}` : 'no key', { class: 'dg-text dg-small dg-mono' }));
      parts.push(text(x0 + SW / 2, y0 + SH + 30, o, { class: `dg-text dg-small ${o === 'correct' ? 'dg-strong-text' : 'dg-muted'}` }));
    }
  });
  if (spec.timeline) {
    const y = SH + 84, x0 = 20, span = W - 40, total = DEFAULTS.itiMax + DEFAULTS.windowMs;
    const sx = (ms) => x0 + (ms / total) * span;
    parts.push(rect(sx(0), y, sx(DEFAULTS.itiMin) - sx(0), 14, 'dg-cell', 2), rect(sx(DEFAULTS.itiMin), y, sx(DEFAULTS.itiMax) - sx(DEFAULTS.itiMin), 14, 'dg-cell', 2));
    parts.push(text((sx(0) + sx(DEFAULTS.itiMax)) / 2, y - 8, `wait ${DEFAULTS.itiMin / 1000}-${DEFAULTS.itiMax / 1000} s (keys here are early)`, { class: 'dg-text dg-small dg-muted' }));
    const f = sx(DEFAULTS.itiMax);
    parts.push(rect(f, y, sx(DEFAULTS.itiMax + DEFAULTS.flashMs) - f, 14, 'dg-cell dg-cell-on', 2));
    parts.push(rect(f, y + 18, sx(DEFAULTS.itiMax + DEFAULTS.windowMs) - f, 10, 'dg-region dg-tone-1', 2));
    parts.push(line(f, y - 4, f, y + 32, 'dg-line dg-strong'));
    parts.push(text(f + 4, y + 44, `shape visible ${DEFAULTS.flashMs} ms · answer window ${DEFAULTS.windowMs} ms from the flash`, { 'text-anchor': 'start', class: 'dg-text dg-small' }));
  }
  return svg(W, H, spec.label || `Shapeshift, ${spec.trials.length} rounds`, ...parts);
}
