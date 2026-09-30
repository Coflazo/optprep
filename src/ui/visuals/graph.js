import { h as el, s } from '../dom.js';

// Directed graph (Markov chain) with probability-labelled edges.
// spec: {
//   type: 'graph',
//   title?: string,
//   nodes: [{ id: string, label?: string, x: number, y: number }],   // x, y in [0, 1] (layout box)
//   edges: [{ from: string, to: string, p: number, label?: string }],  // label e.g. '1/3'; from === to draws a self-loop
// }
const W = 520, H = 400, PAD = 64, R = 24;
const fmtP = (p) => String(Number(p.toFixed(3)));

export default function graph(spec) {
  const pos = new Map(spec.nodes.map((n) => [n.id, [PAD + n.x * (W - 2 * PAD), PAD + (spec.title ? 16 : 0) + n.y * (H - 2 * PAD - (spec.title ? 16 : 0))]]));
  const cx = spec.nodes.reduce((a, n) => a + pos.get(n.id)[0], 0) / spec.nodes.length;
  const cy = spec.nodes.reduce((a, n) => a + pos.get(n.id)[1], 0) / spec.nodes.length;
  const lab = (e) => e.label || fmtP(e.p);
  const name = (id) => spec.nodes.find((n) => n.id === id)?.label || id;
  const label = `${spec.title || 'Directed graph'}. ${spec.edges.map((e) => `${name(e.from)} to ${name(e.to)} with probability ${lab(e)}`).join('; ')}.`;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': label, class: 'viz' }, s('title', {}, label));
  const out = [];
  if (spec.title) out.push(s('text', { x: 12, y: 22, 'font-size': 15, style: 'fill: var(--text)' }, spec.title));
  const has = new Set(spec.edges.map((e) => `${e.from}>${e.to}`));
  const labels = [];
  const arrow = (tip, dir) => {
    const [ux, uy] = dir, [px, py] = [-uy, ux];
    const b = [tip[0] - ux * 11, tip[1] - uy * 11];
    return s('polygon', { points: `${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${(b[0] + px * 5).toFixed(1)},${(b[1] + py * 5).toFixed(1)} ${(b[0] - px * 5).toFixed(1)},${(b[1] - py * 5).toFixed(1)}`, style: 'fill: var(--text-2)' });
  };
  for (const e of spec.edges) {
    const [ax, ay] = pos.get(e.from), [bx, by] = pos.get(e.to);
    if (e.from === e.to) {
      // Self-loop: a small circle pushed away from the graph centre.
      let dx = ax - cx, dy = ay - cy;
      const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const lc = [ax + dx * (R + 14), ay + dy * (R + 14)];
      out.push(s('circle', { cx: lc[0].toFixed(1), cy: lc[1].toFixed(1), r: 15, style: 'fill: none; stroke: var(--text-2); stroke-width: 1.5' }));
      const tipAng = Math.atan2(dy, dx) + 2.2;
      const tip = [lc[0] + 15 * Math.cos(tipAng), lc[1] + 15 * Math.sin(tipAng)];
      out.push(arrow(tip, [Math.cos(tipAng + Math.PI / 2), Math.sin(tipAng + Math.PI / 2)]));
      labels.push([lc[0] + dx * 30, lc[1] + dy * 30, lab(e)]);
      continue;
    }
    let ux = bx - ax, uy = by - ay;
    const len = Math.hypot(ux, uy); ux /= len; uy /= len;
    const bend = has.has(`${e.to}>${e.from}`) ? 26 : 0; // separate a pair of opposite edges
    const [px, py] = [uy, -ux];
    const mid = [(ax + bx) / 2 + px * bend, (ay + by) / 2 + py * bend];
    const start = [ax + ux * R + px * (bend ? 6 : 0), ay + uy * R + py * (bend ? 6 : 0)];
    // End point on the target circle, approached from the control point.
    let ex = bx - mid[0], ey = by - mid[1];
    const el2 = Math.hypot(ex, ey); ex /= el2; ey /= el2;
    const end = [bx - ex * (R + 1), by - ey * (R + 1)];
    out.push(s('path', { d: `M${start[0].toFixed(1)},${start[1].toFixed(1)} Q${mid[0].toFixed(1)},${mid[1].toFixed(1)} ${end[0].toFixed(1)},${end[1].toFixed(1)}`, style: 'fill: none; stroke: var(--text-2); stroke-width: 1.5' }));
    out.push(arrow(end, [ex, ey]));
    // Bent edges: label at the curve's midpoint. Straight edges: 40% along from the source, so two
    // straight edges that cross at their midpoints (the diagonals of a square) never share a label spot.
    const t = bend ? 0.5 : 0.4;
    const bx2 = (1 - t) ** 2 * start[0] + 2 * t * (1 - t) * mid[0] + t * t * end[0];
    const by2 = (1 - t) ** 2 * start[1] + 2 * t * (1 - t) * mid[1] + t * t * end[1];
    const lp = [bx2 + px * 12, by2 + py * 12];
    labels.push([lp[0], lp[1], lab(e)]);
  }
  for (const n of spec.nodes) {
    const [x, y] = pos.get(n.id);
    out.push(s('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: R, style: 'fill: var(--surface); stroke: var(--text); stroke-width: 2' }));
    out.push(s('text', { x: x.toFixed(1), y: (y + 5).toFixed(1), 'font-size': 15, 'text-anchor': 'middle', style: 'fill: var(--text); font-weight: 600' }, n.label || n.id));
  }
  // Edge labels last, on a surface-coloured pad so lines never cross the digits.
  for (const [x, y, t] of labels) {
    const w = 8 * t.length + 8;
    out.push(s('rect', { x: (x - w / 2).toFixed(1), y: (y - 11).toFixed(1), width: w, height: 18, rx: 4, style: 'fill: var(--surface); stroke: var(--border); stroke-width: 1' }));
    out.push(s('text', { x: x.toFixed(1), y: (y + 3).toFixed(1), 'font-size': 13, 'text-anchor': 'middle', style: 'fill: var(--text)' }, t));
  }
  svg.append(...out);
  return el('figure', { class: 'visual visual-graph' }, svg);
}
