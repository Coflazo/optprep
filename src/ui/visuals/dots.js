import { h } from '../dom.js';

// Placeholder until the section build lands the real SVG renderer for "dots".
export default function dots(spec) {
  return h('figure', { class: 'visual' }, h('pre', {}, JSON.stringify(spec, null, 1)));
}
