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

// Left-to-right tidy layout: depth = longest path from root gives the column; leaves take
// rows in DFS order and each parent is centred on its children, so wide trees grow downwards.
export function render(spec) {
  const out = new Map(spec.nodes.map((n) => [n.id, []]));
  for (const ed of spec.edges) out.get(ed.from).push(ed);
  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  const depth = new Map([[spec.root, 0]]);
  for (let pass = 0; pass < spec.nodes.length; pass++) for (const ed of spec.edges) if (depth.has(ed.from)) depth.set(ed.to, Math.max(depth.get(ed.to) ?? 0, depth.get(ed.from) + 1));
  const boxW = 180, gapX = 110, gapY = 12, padX = 12, padY = 12;
  const lines = (n) => wrap(n.text, 24);
  const boxH = (n) => 14 + lines(n).length * 16;
  const cy = new Map();
  let nextY = padY;
  const place = (u) => {
    if (cy.has(u)) return;
    cy.set(u, null);
    const kids = out.get(u).map((ed) => ed.to).filter((v) => cy.get(v) === undefined);
    kids.forEach(place);
    const placed = kids.map((v) => cy.get(v)).filter((y) => y != null);
    if (!placed.length) { const hh = boxH(byId.get(u)); cy.set(u, nextY + hh / 2); nextY += hh + gapY; }
    else cy.set(u, (Math.min(...placed) + Math.max(...placed)) / 2);
  };
  place(spec.root);
  const x = (id) => padX + depth.get(id) * (boxW + gapX);
  const W = padX * 2 + (Math.max(...depth.values()) + 1) * (boxW + gapX) - gapX;
  const H = nextY - gapY + padY;
  const parts = [s('defs', {}, s('marker', { id: 'dg-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'dg-arrowhead' })))];
  for (const ed of spec.edges) {
    const a = [x(ed.from) + boxW, cy.get(ed.from)], b = [x(ed.to), cy.get(ed.to)];
    const mid = (a[0] + b[0]) / 2;
    parts.push(s('path', { d: `M ${a[0]} ${a[1]} C ${mid} ${a[1]}, ${mid} ${b[1]}, ${b[0] - 2} ${b[1]}`, class: 'dg-line', 'marker-end': 'url(#dg-arrow)', fill: 'none' }));
    if (ed.label) parts.push(text(b[0] - 8, b[1] - 9, ed.label, { 'text-anchor': 'end', class: 'dg-text dg-small dg-edge-label dg-halo' }));
  }
  for (const n of spec.nodes) {
    if (cy.get(n.id) == null) continue;
    const top = cy.get(n.id) - boxH(n) / 2;
    const g = s('g', {}, rect(x(n.id), top, boxW, boxH(n), `dg-box dg-flow-${n.kind || 'q'}`, 6),
      ...lines(n).map((ln, i) => text(x(n.id) + boxW / 2, top + 15 + i * 16, ln, { class: n.kind === 'a' ? 'dg-text dg-strong-text' : 'dg-text' })));
    parts.push(n.link ? s('a', { href: `#/study/lesson/${n.link}` }, g) : g);
  }
  const el = svg(W, H, spec.label || 'Decision tree', ...parts);
  el.setAttribute('class', 'diagram dg-flowchart');
  return el;
}
