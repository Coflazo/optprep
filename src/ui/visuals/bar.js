import { h as el, s } from '../dom.js';

// Grouped bar chart.
// spec: {
//   type: 'bar',
//   title?: string,
//   xLabel: string, yLabel: string,
//   categories: [string],                     // one group per category (e.g. years)
//   series: [{ name: string, values: [number] }],  // values[i] belongs to categories[i]; negatives allowed
//   unit?: string,                            // appended to value labels, e.g. '%'
//   valueLabels?: boolean,                    // print each value on its bar (default true)
// }
// The small helpers below are shared by histogram, density and scatter.

export const W = 560;
const FONT = { tick: 13, label: 14, title: 15, value: 12 };
export const col = (i) => `var(--viz-${(i % 5) + 1})`;

export function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const step = (f >= 7.5 ? 10 : f >= 3.5 ? 5 : f >= 1.5 ? 2 : 1) * mag;
  const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
  const ticks = [];
  for (let v = a; v <= b + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { ticks, lo: a, hi: b };
}

export const fmtTick = (v) => String(Number(Number(v).toFixed(3)));

export function root(w, h, label) {
  return s('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: 'img', 'aria-label': label, class: 'viz' }, s('title', {}, label));
}

export function text(x, y, str, { size = FONT.tick, anchor = 'middle', strong = false, rotate = null, baseline = null } = {}) {
  return s('text', {
    x, y, 'font-size': size, 'text-anchor': anchor,
    'dominant-baseline': baseline,
    transform: rotate == null ? null : `rotate(${rotate} ${x} ${y})`,
    style: `fill: var(${strong ? '--text' : '--text-2'})`,
  }, str);
}

export const line = (x1, y1, x2, y2, style) => s('line', { x1, y1, x2, y2, style });

// Frame with a y axis (gridlines + ticks), axis labels and an optional title/legend.
// Returns { g: [elements], x0, x1, y0, y1, sy } where sy maps data y to pixels.
export function frame({ w = W, h, title, xLabel, yLabel, yLo, yHi, legend = [], yTicks }) {
  const top = (title ? 34 : 14) + (legend.length > 1 ? 22 : 0);
  const left = 60, right = 16, bottom = 50;
  const x0 = left, x1 = w - right, y0 = h - bottom, y1 = top;
  const nt = yTicks ? { ticks: yTicks, lo: Math.min(...yTicks), hi: Math.max(...yTicks) } : niceTicks(yLo, yHi, 5);
  const sy = (v) => y0 - ((v - nt.lo) / (nt.hi - nt.lo)) * (y0 - y1);
  const g = [];
  if (title) g.push(text(x0, 20, title, { size: FONT.title, anchor: 'start', strong: true }));
  legend.forEach((name, i) => {
    if (legend.length < 2) return;
    const lx = x0 + i * 130, ly = (title ? 34 : 14) + 4;
    g.push(s('rect', { x: lx, y: ly, width: 12, height: 12, rx: 2, style: `fill: ${col(i)}` }));
    g.push(text(lx + 18, ly + 11, name, { anchor: 'start', strong: true }));
  });
  for (const t of nt.ticks) {
    g.push(line(x0, sy(t), x1, sy(t), 'stroke: var(--border); stroke-width: 1'));
    g.push(text(x0 - 8, sy(t) + 4, fmtTick(t), { anchor: 'end' }));
  }
  if (yLabel) g.push(text(16, (y0 + y1) / 2, yLabel, { size: FONT.label, rotate: -90, strong: true }));
  if (xLabel) g.push(text((x0 + x1) / 2, h - 10, xLabel, { size: FONT.label, strong: true }));
  return { g, x0, x1, y0, y1, sy, lo: nt.lo, hi: nt.hi };
}

export default function bar(spec) {
  const cats = spec.categories, ser = spec.series;
  const unit = spec.unit || '';
  const all = ser.flatMap((x) => x.values);
  const n = cats.length * ser.length;
  const w = Math.max(W, 90 + n * (ser.length > 1 ? 20 : 34));
  const h = 320;
  const label = `${spec.title || 'Bar chart'}. ${ser.map((x) => `${x.name}: ${cats.map((c, i) => `${c} ${x.values[i]}${unit}`).join(', ')}`).join('; ')}.`;
  const svg = root(w, h, label);
  const f = frame({ w, h, title: spec.title, xLabel: spec.xLabel, yLabel: spec.yLabel, yLo: Math.min(0, ...all), yHi: Math.max(0, ...all), legend: ser.map((x) => x.name) });
  const band = (f.x1 - f.x0) / cats.length;
  const bw = (band * 0.78) / ser.length;
  const showValues = spec.valueLabels !== false && n <= 40;
  const bars = [];
  cats.forEach((c, i) => {
    ser.forEach((x, j) => {
      const v = x.values[i];
      const bx = f.x0 + i * band + band * 0.11 + j * bw;
      const ya = f.sy(Math.max(0, v)), yb = f.sy(Math.min(0, v));
      bars.push(s('rect', { x: bx, y: ya, width: Math.max(1, bw - 2), height: Math.max(1, yb - ya), style: `fill: ${col(j)}` }));
      if (showValues) bars.push(text(bx + (bw - 2) / 2, v >= 0 ? ya - 5 : yb + FONT.value + 2, `${v}${unit}`, { size: FONT.value }));
    });
    bars.push(text(f.x0 + i * band + band / 2, f.y0 + 20, c, { size: FONT.tick, strong: true }));
  });
  bars.push(line(f.x0, f.sy(0), f.x1, f.sy(0), 'stroke: var(--text-2); stroke-width: 1'));
  svg.append(...f.g, ...bars);
  return el('figure', { class: 'visual visual-bar' }, svg);
}
