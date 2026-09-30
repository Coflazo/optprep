// Adapter: the question visuals (src/ui/visuals) are usable as study diagrams too.
import { renderVisual } from '../../ui/visuals/index.js';
import { toNum } from './_util.js';

export const REUSED = ['table', 'bar', 'histogram', 'density', 'scatter', 'graph', 'series', 'dots', 'path', 'valuegrid'];

export function validateVisual(type, spec) {
  const e = [];
  if (type === 'graph' && spec?.markov) {
    const out = new Map();
    for (const ed of spec.edges || []) out.set(ed.from, (out.get(ed.from) || 0) + toNum(ed.p));
    for (const [n, t] of out) if (Math.abs(t - 1) > 1e-9) e.push(`graph: out-probabilities of ${n} sum to ${t}`);
  }
  if (type === 'table' && !(Array.isArray(spec?.columns) && Array.isArray(spec?.rows))) e.push('table: columns and rows required');
  return e;
}

export const renderReused = (type, spec) => renderVisual({ ...spec, type });
