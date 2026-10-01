// Stock Master: gauges on a timeline. A needle sweeps from 0 to 1 at `speed` sweeps per second,
// starting at `spawn` (ms); the gauge vanishes at 1. It is inside its zone from
// spawn + 1000·z0/speed to spawn + 1000·z1/speed.
// spec: { gauges: [{ slot, spawn, speed, zone: [z0, z1] }], clicks?: [{ slot, t, result? }],
//         stated?: { windows?: [[inMs, outMs] per gauge], order?: [gauge index by zone entry],
//                    hits?, misses?, falseClicks?, accuracy? } }
// validate: zones inside [0, 1] with z0 < z1, speeds positive, gauges in one slot never overlap;
// every click resolves by the engine's rule (hit inside the zone, early or late outside it, empty on
// a slot with no live gauge); stated windows, entry order, counts and accuracy
// (hits / (hits + misses + false clicks)) match the arithmetic.
import { svg, text, line, rect, near, fmt } from './_util.js';
import { s } from '../../ui/dom.js';
import { needle } from '../../zapn/stockmaster/engine.js';

export const endOf = (g) => g.spawn + 1000 / g.speed;
export const windowOf = (g) => [g.spawn + (1000 * g.zone[0]) / g.speed, g.spawn + (1000 * g.zone[1]) / g.speed];

// Replays the clicks with the engine's rule; gauges never clicked are misses.
export function resolve(spec) {
  const done = new Map();
  const clicks = [...(spec.clicks || [])].map((c, i) => ({ ...c, i })).sort((a, b) => a.t - b.t).map((c) => {
    const gi = spec.gauges.findIndex((g, j) => g.slot === c.slot && g.spawn <= c.t && c.t < endOf(g) && !done.has(j));
    if (gi < 0) return { ...c, got: 'empty' };
    const g = spec.gauges[gi], p = needle(g, c.t);
    const got = p >= g.zone[0] && p <= g.zone[1] ? 'hit' : p < g.zone[0] ? 'early' : 'late';
    done.set(gi, got);
    return { ...c, gauge: gi, got };
  });
  const hits = clicks.filter((c) => c.got === 'hit').length;
  const falseClicks = clicks.length - hits;
  const misses = spec.gauges.length - done.size;
  return { clicks, hits, misses, falseClicks, accuracy: hits + misses + falseClicks ? hits / (hits + misses + falseClicks) : 0 };
}

export function validate(spec) {
  const G = spec?.gauges;
  if (!Array.isArray(G) || !G.length) return ['zapn-stock: gauges required'];
  const e = [];
  G.forEach((g, i) => {
    if (!(Number.isInteger(g.slot) && g.slot >= 0 && g.slot < 8 && g.spawn >= 0 && g.speed > 0)) e.push(`zapn-stock: gauge ${i + 1} needs slot, spawn >= 0 and speed > 0`);
    if (!(Array.isArray(g.zone) && g.zone[0] >= 0 && g.zone[0] < g.zone[1] && g.zone[1] <= 1)) e.push(`zapn-stock: gauge ${i + 1} zone must satisfy 0 <= z0 < z1 <= 1`);
  });
  if (e.length) return e;
  G.forEach((g, i) => G.forEach((o, j) => { if (j > i && o.slot === g.slot && o.spawn < endOf(g) && g.spawn < endOf(o)) e.push(`zapn-stock: gauges ${i + 1} and ${j + 1} overlap in slot ${g.slot + 1}`); }));
  const r = resolve(spec);
  for (const c of r.clicks) if (c.result != null && c.result !== c.got) e.push(`zapn-stock: click at ${c.t} ms on slot ${c.slot + 1} is ${c.got}, stated ${c.result}`);
  const st = spec.stated || {};
  if (st.windows) G.forEach((g, i) => { const w = windowOf(g), sw = st.windows[i]; if (!sw || !near(sw[0], w[0], 1e-6) || !near(sw[1], w[1], 1e-6)) e.push(`zapn-stock: gauge ${i + 1} zone window is ${w.map((x) => fmt(x)).join('-')} ms, stated ${sw}`); });
  if (st.order) { const want = G.map((_, i) => i).sort((a, b) => windowOf(G[a])[0] - windowOf(G[b])[0]); if (JSON.stringify(want) !== JSON.stringify(st.order)) e.push(`zapn-stock: zone entry order is ${want.map((i) => i + 1)}, stated ${st.order.map((i) => i + 1)}`); }
  for (const k of ['hits', 'misses', 'falseClicks']) if (st[k] != null && st[k] !== r[k]) e.push(`zapn-stock: ${k} is ${r[k]}, stated ${st[k]}`);
  if (st.accuracy != null && !near(st.accuracy, r.accuracy, 1e-9)) e.push(`zapn-stock: accuracy is ${r.accuracy}, stated ${st.accuracy}`);
  return e;
}

export function render(spec) {
  const G = spec.gauges, r = resolve(spec);
  const tMax = Math.max(...G.map(endOf), ...(spec.clicks || []).map((c) => c.t)) ;
  const L = 118, Rm = 16, W = 600, lane = 38, top = 14;
  const sx = (t) => L + (t / tMax) * (W - L - Rm);
  const H = top + G.length * lane + 44;
  const parts = [];
  const step = tMax > 6000 ? 2000 : tMax > 3000 ? 1000 : 500;
  for (let t = 0; t <= tMax + 1e-9; t += step) { parts.push(line(sx(t), top, sx(t), top + G.length * lane, 'dg-line dg-dash')); parts.push(text(sx(t), top + G.length * lane + 12, `${fmt(t / 1000)} s`, { class: 'dg-text dg-small dg-mono dg-muted' })); }
  G.forEach((g, i) => {
    const y = top + i * lane + lane / 2, [a, b] = windowOf(g);
    parts.push(text(L - 8, y, `dial ${i + 1} · slot ${g.slot + 1}`, { 'text-anchor': 'end', class: 'dg-text dg-small' }));
    parts.push(line(sx(g.spawn), y, sx(endOf(g)), y, 'dg-line dg-strong'));
    parts.push(rect(sx(a), y - 9, Math.max(2, sx(b) - sx(a)), 18, 'dg-region dg-tone-1', 2));
    if (!r.clicks.some((c) => c.gauge === i)) parts.push(text(sx(endOf(g)) + 4, y, spec.clicks ? 'miss' : '', { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  });
  for (const c of r.clicks) {
    const lanes = c.gauge != null ? [c.gauge] : G.map((g, j) => (g.slot === c.slot ? j : -1)).filter((j) => j >= 0).slice(0, 1);
    const y = top + (lanes[0] ?? 0) * lane + lane / 2;
    parts.push(s('circle', { cx: sx(c.t), cy: y, r: 5, class: c.got === 'hit' ? 'dg-dot dg-target' : 'dg-dot dg-mark' }));
    parts.push(text(sx(c.t), y - 13, c.got, { class: 'dg-text dg-small dg-halo' }));
  }
  parts.push(text(L, H - 12, spec.clicks ? `hits ${r.hits}, misses ${r.misses}, false clicks ${r.falseClicks}: accuracy ${fmt(r.accuracy)}` : 'shaded: the time the needle spends inside its zone', { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `Stock Master timeline with ${G.length} dials`, ...parts);
}
