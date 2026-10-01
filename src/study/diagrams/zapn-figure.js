// Figure It Out: guesses at a hidden figure, one right/wrong mark per property, and what is left.
// spec: { values: [4, 4, 3], hidden?: [v, ...], guesses: [{ code: [v, ...], marks?: [bool, ...] }],
//         remaining?: [[v, ...] per property], stated?: { expected?, worst? } }
//   Property k is the engine's PROPS[k] (shape, colour, fill, size, count, border); v indexes its values.
// validate: every code is in range; with hidden, marks equal the engine's feedback; without hidden,
// marks are consistent (one right value per property, a right value stays right, a wrong value
// never turns right); remaining equals the engine's possible(); stated expected and worst equal
// the engine's optimum(values).
import { svg, text, rect, near } from './_util.js';
import { PROPS, feedback, possible, optimum } from '../../zapn/figureitout/engine.js';

export function validate(spec) {
  const V = spec?.values;
  if (!(Array.isArray(V) && V.length >= 1 && V.length <= PROPS.length && V.every((n, k) => Number.isInteger(n) && n >= 1 && n <= PROPS[k].values.length))) return ['zapn-figure: values must list 1..6 properties, each within its value list'];
  const inRange = (c) => Array.isArray(c) && c.length === V.length && c.every((v, k) => Number.isInteger(v) && v >= 0 && v < V[k]);
  if (spec.hidden != null && !inRange(spec.hidden)) return ['zapn-figure: hidden out of range'];
  const G = spec.guesses || [];
  const e = [];
  G.forEach((g, i) => { if (!inRange(g.code)) e.push(`zapn-figure: guess ${i + 1} out of range`); if (g.marks && g.marks.length !== V.length) e.push(`zapn-figure: guess ${i + 1} needs one mark per property`); });
  if (e.length) return e;
  const marksOf = (g) => g.marks ?? (spec.hidden ? V.map((_, k) => !!((feedback(g.code, spec.hidden) >> k) & 1)) : null);
  if (spec.hidden) G.forEach((g, i) => { if (g.marks && JSON.stringify(g.marks) !== JSON.stringify(marksOf({ code: g.code }))) e.push(`zapn-figure: guess ${i + 1} marks do not match the hidden figure`); });
  else {
    V.forEach((_, k) => {
      const right = new Set(), wrong = new Set();
      G.forEach((g) => { if (!g.marks) return; (g.marks[k] ? right : wrong).add(g.code[k]); });
      if (right.size > 1) e.push(`zapn-figure: ${PROPS[k].key} has two different right values`);
      for (const v of right) if (wrong.has(v)) e.push(`zapn-figure: ${PROPS[k].key} value ${PROPS[k].values[v]} is marked both right and wrong`);
    });
  }
  if (spec.remaining != null) {
    if (G.some((g) => !marksOf(g))) e.push('zapn-figure: remaining needs marks or a hidden figure');
    else {
      const got = possible(V, G.map((g) => ({ code: g.code, fb: marksOf(g).reduce((m, ok, k) => m | (ok ? 1 << k : 0), 0) })));
      if (JSON.stringify(got) !== JSON.stringify(spec.remaining)) e.push(`zapn-figure: still possible is ${JSON.stringify(got)}, stated ${JSON.stringify(spec.remaining)}`);
    }
  }
  if (spec.stated) {
    const o = optimum(V);
    if (spec.stated.expected != null && !near(spec.stated.expected, o.expected, 1e-6)) e.push(`zapn-figure: optimum is ${o.expected}, stated ${spec.stated.expected}`);
    if (spec.stated.worst != null && spec.stated.worst !== o.worst) e.push(`zapn-figure: worst case is ${o.worst}, stated ${spec.stated.worst}`);
  }
  return e;
}

export function render(spec) {
  const V = spec.values, G = spec.guesses || [];
  const CW = 92, RH = 26, LW = 62;
  const marksOf = (g) => g.marks ?? (spec.hidden ? V.map((_, k) => !!((feedback(g.code, spec.hidden) >> k) & 1)) : null);
  const rows = G.length + (spec.remaining ? 1 : 0) + (spec.hidden ? 1 : 0);
  const W = LW + V.length * CW + 10, H = 30 + rows * (RH + 4) + (spec.stated ? 24 : 6);
  const parts = [];
  V.forEach((n, k) => parts.push(text(LW + k * CW + CW / 2, 14, `${PROPS[k].key} (${n})`, { class: 'dg-text dg-small dg-strong-text' })));
  let y = 26;
  G.forEach((g, i) => {
    const m = marksOf(g);
    parts.push(text(LW - 8, y + RH / 2, `guess ${i + 1}`, { 'text-anchor': 'end', class: 'dg-text dg-small dg-muted' }));
    g.code.forEach((v, k) => {
      parts.push(rect(LW + k * CW + 2, y, CW - 4, RH, m?.[k] ? 'dg-cell dg-cell-on' : 'dg-cell', 3));
      parts.push(text(LW + k * CW + CW / 2, y + RH / 2, `${m ? (m[k] ? '✓ ' : '✗ ') : ''}${PROPS[k].values[v]}`, { class: `dg-text dg-small${m?.[k] ? ' dg-strong-text' : ''}` }));
    });
    y += RH + 4;
  });
  if (spec.remaining) {
    parts.push(text(LW - 8, y + RH / 2, 'left', { 'text-anchor': 'end', class: 'dg-text dg-small dg-muted' }));
    spec.remaining.forEach((vs, k) => parts.push(text(LW + k * CW + CW / 2, y + RH / 2, vs.length === 1 ? `= ${PROPS[k].values[vs[0]]}` : `${vs.length} values`, { class: 'dg-text dg-small dg-mono' })));
    y += RH + 4;
  }
  if (spec.hidden) {
    parts.push(text(LW - 8, y + RH / 2, 'hidden', { 'text-anchor': 'end', class: 'dg-text dg-small dg-muted' }));
    spec.hidden.forEach((v, k) => parts.push(text(LW + k * CW + CW / 2, y + RH / 2, PROPS[k].values[v], { class: 'dg-text dg-small dg-muted' })));
    y += RH + 4;
  }
  if (spec.stated) parts.push(text(LW, H - 10, [spec.stated.expected != null ? `optimum ${Math.round(spec.stated.expected * 100) / 100} guesses on average` : '', spec.stated.worst != null ? `worst case ${spec.stated.worst}` : ''].filter(Boolean).join(' · '), { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `Figure It Out: ${G.length} guesses over ${V.length} properties`, ...parts);
}
