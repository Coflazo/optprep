// Answer-sheet primitives: bubbles, fields, choice groups, the timing rail and the scan.
// Orange prints the form (rings, rules, labels); navy is what the candidate has marked.
import { h } from './dom.js';

// A row of answer bubbles: `filled` of `n` are marked. Used for skill levels and goals.
export function bubbles(n, filled, { label, size = 'md', current = false } = {}) {
  const k = Math.max(0, Math.min(n, Math.round(filled)));
  const a11y = label === null ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': label ?? `${k} of ${n}` };
  return h('span', { class: `bubbles bubbles-${size}${current ? ' is-current' : ''}`, ...a11y },
    Array.from({ length: n }, (_, i) => h('span', { class: `bubble${i < k ? ' is-filled' : ''}`, style: { '--i': i } })));
}

// A printed field box with its label in form ink.
export function field(label, ...children) {
  return h('section', { class: 'field' }, label ? h('h2', { class: 'field-label' }, label) : null, ...children);
}

// A labelled radio group drawn as answer bubbles. Native inputs keep keyboard and screen
// reader behaviour; onChange gets the chosen value.
let groupSeq = 0;
export function choice({ legend, hideLegend = false, name = `choice-${++groupSeq}`, options, value, onChange, columns = false }) {
  return h('fieldset', { class: `choice${columns ? ' choice-columns' : ''}` },
    legend ? h('legend', { class: hideLegend ? 'visually-hidden' : null }, legend) : null,
    options.map((o) => h('label', { class: 'choice-option' },
      h('input', { type: 'radio', name, value: o.value, checked: o.value === value, onchange: () => onChange?.(o.value) }),
      h('span', { class: 'bubble', 'aria-hidden': 'true' }),
      h('span', { class: 'choice-text' }, h('span', { class: 'choice-label' }, o.label), o.hint ? h('span', { class: 'choice-hint' }, o.hint) : null))));
}

// Small state stamp for a row: what a grader would write in the margin.
const STAMP = { new: 'New', learning: 'In progress', 'needs-review': 'Review due', mastered: 'Mastered' };
export function stamp(state) { return h('span', { class: `stamp stamp-${state}` }, STAMP[state] || state); }

// The timing rail down the edge of the sheet. `fraction` of the marks are filled.
const RAIL_MARKS = 24;
export function setRail(fraction, label) {
  const rail = document.getElementById('rail');
  if (!rail) return;
  if (rail.childElementCount !== RAIL_MARKS) rail.replaceChildren(...Array.from({ length: RAIL_MARKS }, () => h('span', { class: 'rail-mark' })));
  const k = Math.round(Math.max(0, Math.min(1, fraction)) * RAIL_MARKS);
  [...rail.children].forEach((m, i) => m.classList.toggle('is-filled', i < k));
  rail.setAttribute('aria-label', label || `${Math.round(fraction * 100)}%`);
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Submit is a scan: one orange line sweeps the sheet and each row is graded as it passes.
// rows: elements with data-grade="right|wrong|skip". Resolves when the sweep finishes.
export function scanSheet(container, rows, { duration = 900 } = {}) {
  if (!rows.length || reduced()) { rows.forEach((r) => r.classList.add('is-graded')); return Promise.resolve(); }
  const line = h('div', { class: 'scan-line', 'aria-hidden': 'true' });
  container.classList.add('is-scanning');
  container.append(line);
  const top = container.getBoundingClientRect().top;
  const height = container.scrollHeight;
  rows.forEach((r) => {
    const at = (r.getBoundingClientRect().top - top + r.offsetHeight / 2) / height;
    setTimeout(() => r.classList.add('is-graded'), Math.max(0, at) * duration);
  });
  const anim = line.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${height}px)` }], { duration, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' });
  return anim.finished.catch(() => {}).then(() => { line.remove(); container.classList.remove('is-scanning'); });
}

// Number ticker for a rare reward moment (XP after a session). Tabular digits, 400 ms,
// ease-out; jumps straight to the value under reduced motion.
export function tickTo(el, to, { duration = 400 } = {}) {
  if (reduced() || !Number.isFinite(to)) { el.textContent = `+${to}`; return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = `+${Math.round(to * (1 - (1 - t) ** 3))}`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// A short status toast that enters and leaves through the bottom edge.
// Screen readers hear it through the page's single live region (#live). ms 0 keeps it up.
export function toast(message, { ms = 4000, icon: ico = null } = {}) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = h('div', { class: 'toast', 'aria-hidden': 'true' }, ico, h('span', {}, message));
  document.body.append(el);
  const live = document.getElementById('live');
  if (live) live.textContent = message;
  if (ms) setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 450); }, ms);
  return el;
}
