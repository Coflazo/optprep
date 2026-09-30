import { h } from '../dom.js';

// Placeholder until the section build lands the real SVG renderer for "density".
export default function density(spec) {
  return h('figure', { class: 'visual' }, h('pre', {}, JSON.stringify(spec, null, 1)));
}
