import { h } from '../dom.js';
import { intervalScore } from '../../core/check.js';
import { fmtNum } from '../../core/format.js';

// Lower and upper bound. Practice shows the score you would get if the truth is inside.
export function intervalView(item, { onChange, showPreview = true } = {}) {
  let locked = false;
  const lo = h('input', { type: 'number', class: 'big', step: 'any', inputmode: 'decimal', 'aria-label': 'Lower bound', oninput: () => { update(); onChange?.(); } });
  const hi = h('input', { type: 'number', class: 'big', step: 'any', inputmode: 'decimal', 'aria-label': 'Upper bound', oninput: () => { update(); onChange?.(); } });
  const preview = h('div', { class: 'muted num' });
  function update() {
    const L = parseFloat(lo.value), U = parseFloat(hi.value);
    if (!showPreview) return;
    if (!Number.isFinite(L) || !Number.isFinite(U)) { preview.textContent = ''; return; }
    if (L <= 0) { preview.textContent = 'A lower bound of 0 or below always scores 0.'; return; }
    if (L > U) { preview.textContent = 'Lower is above upper: this scores 0.'; return; }
    preview.textContent = `If the true value is inside: score ${(L / U).toFixed(2)}`;
  }
  const el = h('div', { class: 'interval' },
    h('div', { class: 'row' },
      h('div', {}, h('label', { class: 'field' }, 'Lower'), lo),
      h('div', {}, h('label', { class: 'field' }, 'Upper'), hi),
      item.unit ? h('div', { class: 'muted', style: { alignSelf: 'flex-end', paddingBottom: '8px' } }, item.unit) : null),
    preview);
  return {
    el,
    focus: () => lo.focus(),
    response: () => {
      const L = parseFloat(lo.value), U = parseFloat(hi.value);
      return Number.isFinite(L) && Number.isFinite(U) ? { lower: L, upper: U } : null;
    },
    setResponse: (r) => { if (r) { lo.value = r.lower; hi.value = r.upper; update(); } },
    lock: () => { locked = true; lo.disabled = true; hi.disabled = true; },
    reveal: (res, r) => {
      const s = r ? intervalScore(r.lower, r.upper, item.truth) : 0;
      preview.textContent = `True value ${fmtNum(item.truth)}${item.unit ? ` ${item.unit}` : ''}. Your score ${s.toFixed(2)}.`;
    },
    get locked() { return locked; },
  };
}
