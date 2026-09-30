import { h } from '../dom.js';

// Placeholder until the section build lands the real SVG renderer for "path".
export default function path(spec) {
  return h('figure', { class: 'visual' }, h('pre', {}, JSON.stringify(spec, null, 1)));
}
