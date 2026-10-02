// OptPrep mark: a timer ring with a tick (a timed test, answered right). Original
// artwork; the same geometry lives in assets/mark.svg and the PWA icons. Colours come
// from the brand tokens so the mark follows light and dark mode.
import { h, s } from './dom.js';

export function brandMark({ size = 28, label = 'OptPrep' } = {}) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
  return s('svg', { viewBox: '0 0 64 64', width: size, height: size, ...a11y, class: 'mark' },
    s('rect', { width: 64, height: 64, rx: 14, class: 'mark-bg' }),
    s('circle', { cx: 32, cy: 32, r: 19, fill: 'none', 'stroke-width': 5, class: 'mark-track' }),
    s('path', { d: 'M32 13A19 19 0 1 1 13 32', fill: 'none', 'stroke-width': 5, 'stroke-linecap': 'round', class: 'mark-arc' }),
    s('path', { d: 'M23.5 32.5l6 6L41 26', fill: 'none', 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'mark-tick' }));
}

// Mark + wordmark, with the descriptor that names the target in plain text.
export function brandLockup({ size = 28, descriptor = true } = {}) {
  return h('span', { class: 'lockup' },
    brandMark({ size, label: '' }),
    h('span', { class: 'lockup-text' },
      h('span', { class: 'wordmark' }, 'OptPrep'),
      descriptor ? h('span', { class: 'descriptor' }, 'for the Optiver OA') : null));
}
