// Study diagram registry: every type exports validate(spec) -> errors[] (pure) and render(spec) -> Element.
import * as tree from './tree.js';
import * as grid from './grid.js';
import * as venn from './venn.js';
import * as numberline from './numberline.js';
import * as cycle from './cycle.js';
import * as unitsquare from './unitsquare.js';
import * as plot from './plot.js';
import * as ladder from './ladder.js';
import * as strands from './strands.js';
import * as flow from './flow.js';
import * as book from './book.js';
import * as bundle from './bundle.js';
import * as ledger from './ledger.js';
import * as zapnTower from './zapn-tower.js';
import * as zapnBalloon from './zapn-balloon.js';
import * as zapnPincode from './zapn-pincode.js';
import * as zapnSwitch from './zapn-switch.js';
import * as zapnCodecompare from './zapn-codecompare.js';
import * as zapnNumberbox from './zapn-numberbox.js';
import * as zapnFigure from './zapn-figure.js';
import * as zapnStock from './zapn-stock.js';
import * as zapnShapeshift from './zapn-shapeshift.js';
import { REUSED, validateVisual, renderReused } from './visuals.js';

const OWN = {
  tree, grid, venn, numberline, cycle, unitsquare, plot, ladder, strands, flow, book, bundle, ledger,
  'zapn-tower': zapnTower, 'zapn-balloon': zapnBalloon, 'zapn-pincode': zapnPincode, 'zapn-switch': zapnSwitch,
  'zapn-codecompare': zapnCodecompare, 'zapn-numberbox': zapnNumberbox, 'zapn-figure': zapnFigure, 'zapn-stock': zapnStock, 'zapn-shapeshift': zapnShapeshift,
};

export const DIAGRAM_TYPES = [...Object.keys(OWN), ...REUSED];

export function validateDiagram(type, spec) {
  if (OWN[type]) return OWN[type].validate(spec);
  if (REUSED.includes(type)) return validateVisual(type, spec);
  return [`unknown diagram type ${type}`];
}

export function renderDiagram(type, spec) {
  if (OWN[type]) return OWN[type].render(spec);
  if (REUSED.includes(type)) return renderReused(type, spec);
  throw new Error(`unknown diagram type ${type}`);
}
