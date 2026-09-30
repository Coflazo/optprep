// Flowchart / decision tree (method recognition trees).
// spec: { root: id, nodes: [{ id, text, kind: 'q' | 'a' | 'note', link?: lessonId }], edges: [{ from, to, label? }] }
// validate: ids unique, edges reference nodes, every node reachable from root, no cycles.
import { svg, text, rect, wrap, line } from './_util.js';
import { s, h } from '../../ui/dom.js';

export function validate(spec) {
  const e = [];
  const ids = new Set();
  for (const n of spec?.nodes || []) { if (ids.has(n.id)) e.push(`flow: duplicate ${n.id}`); ids.add(n.id); }
  if (!ids.has(spec?.root)) return [...e, 'flow: root missing'];
  for (const ed of spec.edges || []) if (!ids.has(ed.from) || !ids.has(ed.to)) e.push(`flow: edge ${ed.from}->${ed.to} unknown node`);
  const out = new Map([...ids].map((i) => [i, []]));
  for (const ed of spec.edges || []) out.get(ed.from)?.push(ed.to);
  const state = new Map();
  const dfs = (u) => { state.set(u, 1); for (const v of out.get(u) || []) { if (state.get(v) === 1) e.push(`flow: cycle through ${v}`); else if (!state.has(v)) dfs(v); } state.set(u, 2); };
  dfs(spec.root);
  for (const i of ids) if (!state.has(i)) e.push(`flow: ${i} unreachable from root`);
  return e;
}

// Layered layout: depth = longest path from root; order within a layer by DFS discovery.
export function render(spec) {
  const out = new Map(spec.nodes.map((n) => [n.id, []]));
  for (const ed of spec.edges) out.get(ed.from).push(ed);
  const depth = new Map([[spec.root, 0]]);
  const order = [];
  const visit = (u) => { order.push(u); for (const ed of out.get(u)) { const d = depth.get(u) + 1; if (!depth.has(ed.to) || depth.get(ed.to) < d) depth.set(ed.to, d); if (!order.includes(ed.to)) visit(ed.to); } };
  visit(spec.root);
  for (let pass = 0; pass < spec.nodes.length; pass++) for (const ed of spec.edges) depth.set(ed.to, Math.max(depth.get(ed.to) ?? 0, (depth.get(ed.from) ?? 0) + 1));
  const layers = [];
  for (const id of order) (layers[depth.get(id)] ||= []).push(id);
  const boxW = 190, gapX = 24, rowH = 110;
  const W = Math.max(...layers.map((l) => l.length)) * (boxW + gapX) + gapX;
  const H = layers.length * rowH + 20;
  const pos = new Map();
  layers.forEach((l, d) => { const total = l.length * (boxW + gapX) - gapX; l.forEach((id, i) => pos.set(id, [(W - total) / 2 + i * (boxW + gapX), 16 + d * rowH])); });
  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  const parts = [s('defs', {}, s('marker', { id: 'dg-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'dg-arrowhead' })))];
  const boxH = (n) => 18 + wrap(n.text, 26).length * 16;
  for (const ed of spec.edges) {
    const [x1, y1] = pos.get(ed.from), [x2, y2] = pos.get(ed.to);
    const a = [x1 + boxW / 2, y1 + boxH(byId.get(ed.from))], b = [x2 + boxW / 2, y2];
    parts.push(s('path', { d: `M ${a[0]} ${a[1]} C ${a[0]} ${a[1] + 30}, ${b[0]} ${b[1] - 30}, ${b[0]} ${b[1] - 2}`, class: 'dg-line', 'marker-end': 'url(#dg-arrow)', fill: 'none' }));
    if (ed.label) parts.push(text((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ed.label, { class: 'dg-text dg-small dg-edge-label dg-halo' }));
  }
  for (const n of spec.nodes) {
    const [x, y] = pos.get(n.id); const lines = wrap(n.text, 26);
    const g = s('g', {}, rect(x, y, boxW, boxH(n), `dg-box dg-flow-${n.kind || 'q'}`, 6), ...lines.map((ln, i) => text(x + boxW / 2, y + 17 + i * 16, ln, { class: n.kind === 'a' ? 'dg-text dg-strong-text' : 'dg-text' })));
    parts.push(n.link ? s('a', { href: `#/study/lesson/${n.link}` }, g) : g);
  }
  return svg(W, H, spec.label || 'Decision tree', ...parts);
}
