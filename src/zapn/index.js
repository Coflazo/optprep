// Zap-N game registry. Each game lives in src/zapn/<id>/ with three files:
//   engine.js  pure state machine, no DOM, fully unit-tested:
//              createEngine(rng, opts) -> { state, act(action, tMs), isOver(), result() }
//              result() -> { score, metric, value, detail } where metric/value match
//              ZAPN_TARGETS in config/sections.js (e.g. { metric: 'span', value: 9 }).
//   view.js    mount(container, { rng, mode: 'practice'|'exam', onFinish(result) }) -> unmount()
//              Uses src/ui/dom.js and the .stage/.hud classes in src/ui/styles.css.
//   coach.js   { purpose, howItWorks: [..], scoring, strategy: [{say, why}], rule, drills?: [..] }
// index.js re-exports: export default { id, title, skill, spec, engine, view, coach }
import balloon from './balloon/index.js';
import skyscraper from './skyscraper/index.js';
import shapeshift from './shapeshift/index.js';
import codecompare from './codecompare/index.js';
import pincode from './pincode/index.js';
import numberbox from './numberbox/index.js';
import figureitout from './figureitout/index.js';
import theswitch from './theswitch/index.js';
import stockmaster from './stockmaster/index.js';

export const GAMES = [balloon, skyscraper, shapeshift, codecompare, pincode, numberbox, figureitout, theswitch, stockmaster];
export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));
