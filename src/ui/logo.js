// OptPrep wordmark: Roboto Bold outlines with the o printed in answer-sheet orange and its
// counter filled like a pencil mark. Letters and mark follow the text colour, so the logo
// works in light, dark and high-contrast modes. Paths live in wordmark-paths.js.
import { h, s } from './dom.js';
import { VIEWBOX, LETTERS, GLYPHS, COUNTER, O_BOX } from './wordmark-paths.js';

const counter = () => s('path', { class: 'logo-mark', d: COUNTER.d, transform: `translate(${COUNTER.cx} ${COUNTER.cy}) scale(${COUNTER.scale}) translate(${-COUNTER.cx} ${-COUNTER.cy})` });

export function wordmark({ height = 26, label = 'OptPrep' } = {}) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
  return s('svg', { viewBox: VIEWBOX, height, class: 'wordmark', ...a11y },
    s('g', { transform: 'scale(1 -1)' },
      LETTERS.map(([ch, x], i) => s('path', { class: i === 0 ? 'logo-o' : 'logo-letter', d: GLYPHS[ch], transform: `translate(${x} 0)` })),
      counter()));
}

// The o alone, for tight spaces (tab bar, splash).
export function brandMark({ size = 28, label = 'OptPrep' } = {}) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
  const [x0, y0, x1, y1] = O_BOX;
  const pad = 40;
  return s('svg', { viewBox: `${x0 - pad} ${-(y1 + pad)} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`, width: size, height: size, class: 'mark', ...a11y },
    s('g', { transform: 'scale(1 -1)' }, s('path', { class: 'logo-o', d: GLYPHS.o }), counter()));
}

// Wordmark plus the descriptor that names the target in plain text.
export function brandLockup({ height = 26, descriptor = true } = {}) {
  return h('span', { class: 'lockup' },
    wordmark({ height }),
    descriptor ? h('span', { class: 'descriptor' }, 'for the Optiver online assessment') : null);
}
