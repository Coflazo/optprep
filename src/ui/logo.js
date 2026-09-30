// History note: this file once drew a third-party wordmark. It was removed from the
// repository's history; the header shows the product name as text instead.
import { s } from './dom.js';

export function optiverLogo({ height = 18, label = 'Trainer' } = {}) {
  return s('svg', { viewBox: '0 0 120 24', height, role: 'img', 'aria-label': label, class: 'logo' }, s('text', { x: 0, y: 18, 'font-size': 18, 'font-weight': 700, fill: 'currentColor' }, label));
}
