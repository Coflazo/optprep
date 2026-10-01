// Pincode: a digit code, how you chunk it, and what you type in each mode.
// spec: { code: '84921735', mode?: 'forward' | 'reverse' | 'sorted', chunks?: ['849', '217', '35'],
//         tally?: { '3': 2, ... }, answer?: '...' }
//   forward: the chunks as you hold them. reverse: the same chunks, then each chunk reversed in
//   reverse order. sorted: a tally of each digit, read out from 0 to 9.
// validate: the code is 1..16 digits (the engine's longest code); chunks hold 1-4 digits and join
// back into the code; a tally counts every digit of the code exactly; answer equals the engine's
// expected(code, mode).
import { h } from '../../ui/dom.js';
import { expected, MODES, DEFAULTS } from '../../zapn/pincode/engine.js';

export function validate(spec) {
  const e = [];
  const code = spec?.code;
  if (!(typeof code === 'string' && /^[0-9]+$/.test(code) && code.length <= DEFAULTS.maxLen)) return [`zapn-pincode: code must be 1..${DEFAULTS.maxLen} digits`];
  const mode = spec.mode ?? 'forward';
  if (!MODES.includes(mode)) return [`zapn-pincode: mode must be one of ${MODES.join(', ')}`];
  if (spec.chunks) {
    if (!spec.chunks.every((c) => typeof c === 'string' && /^[0-9]{1,4}$/.test(c))) e.push('zapn-pincode: chunks hold 1-4 digits each');
    else if (spec.chunks.join('') !== code) e.push(`zapn-pincode: chunks join to ${spec.chunks.join('')}, not ${code}`);
  }
  if (spec.tally) {
    const want = {};
    for (const d of code) want[d] = (want[d] || 0) + 1;
    const got = Object.fromEntries(Object.entries(spec.tally).filter(([, n]) => n));
    const keys = [...new Set([...Object.keys(want), ...Object.keys(got)])];
    for (const k of keys) if (want[k] !== got[k]) e.push(`zapn-pincode: digit ${k} appears ${want[k] || 0} times, tally says ${got[k] || 0}`);
  }
  if (spec.answer != null && spec.answer !== expected(code, mode)) e.push(`zapn-pincode: ${mode} answer is ${expected(code, mode)}, stated ${spec.answer}`);
  return e;
}

const gap = () => h('span', { style: { width: '14px', flex: '0 0 14px' } });
const chunkRow = (chunks, colourOf, rev = false) => h('div', { class: 'dg-strand-row' }, chunks.flatMap((c, i) => [i ? gap() : null, ...(rev ? [...c].reverse() : [...c]).map((d) => h('span', { class: `dg-strand-cell dg-strand-${(colourOf(i) % 4) + 1}` }, d))]));
const label = (s) => h('div', { class: 'dg-caption-note' }, s);

export function render(spec) {
  const mode = spec.mode ?? 'forward';
  const chunks = spec.chunks || [spec.code];
  const rows = [label(chunks.length > 1 ? `shown: ${spec.code.length} digits held as ${chunks.length} chunks` : `shown: ${spec.code.length} digits`), chunkRow(chunks, (i) => i)];
  if (mode === 'reverse') {
    const order = chunks.map((_, i) => chunks.length - 1 - i);
    rows.push(label('type: last chunk first, each chunk read backwards'), chunkRow(order.map((i) => chunks[i]), (i) => order[i], true));
  }
  if (mode === 'sorted') {
    const tally = spec.tally || [...spec.code].reduce((a, d) => ({ ...a, [d]: (a[d] || 0) + 1 }), {});
    const digits = Object.keys(tally).filter((d) => tally[d]).sort();
    rows.push(label('tally, digit: count (the order is thrown away)'),
      h('div', { class: 'dg-strand-row' }, digits.map((d) => h('span', { class: 'dg-strand-cell' }, `${d}: ${tally[d]}`))),
      label('type: read the tally from 0 to 9'),
      h('div', { class: 'dg-strand-row' }, [...expected(spec.code, 'sorted')].map((d) => h('span', { class: 'dg-strand-cell' }, d))));
  }
  if (spec.answer != null && mode !== 'sorted') rows.push(label(`answer: ${spec.answer}`));
  return h('div', { class: 'dg-strands', role: 'img', 'aria-label': spec.label || `Pincode ${spec.code}, ${mode} mode` }, rows);
}
