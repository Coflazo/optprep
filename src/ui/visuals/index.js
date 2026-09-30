// Visual registry. An item may carry prompt.visual = { type, ...data }; the runner
// calls renderVisual(spec) and places the returned element above the options.
// Each visual file exports default (spec) => Element and registers itself here.
// Visuals must be pure functions of the spec (no randomness): the item already
// holds every number, so what is drawn is exactly what was scored.
import table from './table.js';
import bar from './bar.js';
import histogram from './histogram.js';
import density from './density.js';
import scatter from './scatter.js';
import graph from './graph.js';
import series from './series.js';
import dots from './dots.js';
import path from './path.js';
import valuegrid from './valuegrid.js';

const REGISTRY = { table, bar, histogram, density, scatter, graph, series, dots, path, valuegrid };

export function renderVisual(spec) {
  const fn = REGISTRY[spec?.type];
  if (!fn) throw new Error(`no visual registered for type "${spec?.type}"`);
  return fn(spec);
}

export const VISUAL_TYPES = Object.keys(REGISTRY);
