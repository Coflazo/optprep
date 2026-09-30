import { s } from '../dom.js';

// Path to measure against a scale bar (Intervals: visual measurement).
// spec: {
//   type: 'path', width, height,                      // viewBox size in px
//   points: [[x, y], ...],                            // polyline vertices in px
//   scale: { x, y, px, units, unit, label? },         // bar from (x, y) to (x + px, y) = units unit
//   label?: string                                    // aria-label; must not state the length
// }
// truth = sum of segment lengths in px / scale.px × scale.units.
export default function path(spec) {
  const { width: w, height: h, points, scale } = spec;
  const [sx, sy] = points[0], [ex, ey] = points[points.length - 1];
  const tick = 5;
  return s('svg', { class: 'visual visual-path', viewBox: `0 0 ${w} ${h}`, width: '100%', role: 'img', 'aria-label': spec.label || 'A path with a scale bar', preserveAspectRatio: 'xMidYMid meet', style: { maxWidth: `${w * 1.6}px`, display: 'block' } },
    s('rect', { x: 0.5, y: 0.5, width: w - 1, height: h - 1, rx: 6, style: { fill: 'var(--surface)', stroke: 'var(--border)' } }),
    s('polyline', { points: points.map((p) => p.join(',')).join(' '), style: { fill: 'none', stroke: 'var(--viz-1)', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } }),
    s('circle', { cx: sx, cy: sy, r: 4.5, style: { fill: 'var(--viz-3)' } }),
    s('circle', { cx: ex, cy: ey, r: 4.5, style: { fill: 'var(--viz-5)' } }),
    s('g', { style: { stroke: 'var(--text)', strokeWidth: 2 } },
      s('line', { x1: scale.x, y1: scale.y, x2: scale.x + scale.px, y2: scale.y }),
      s('line', { x1: scale.x, y1: scale.y - tick, x2: scale.x, y2: scale.y + tick }),
      s('line', { x1: scale.x + scale.px, y1: scale.y - tick, x2: scale.x + scale.px, y2: scale.y + tick })),
    s('text', { x: scale.x + scale.px + 8, y: scale.y + 4, style: { fill: 'var(--text)', fontSize: '12px', fontFamily: 'var(--mono)' } }, scale.label || `${scale.units} ${scale.unit}`));
}
