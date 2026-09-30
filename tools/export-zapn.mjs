// Export JS-generated Zap-N puzzles so the C++ engine can re-solve each one:
//   node tools/export-zapn.mjs [out.json]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { makeRng } from '../src/core/rng.js';
import * as sky from '../src/zapn/skyscraper/engine.js';
import * as nb from '../src/zapn/numberbox/engine.js';
import * as fig from '../src/zapn/figureitout/engine.js';
import * as bal from '../src/zapn/balloon/engine.js';

const out = process.argv[2] || 'backend/data/zapn/export.json';
const skyscraper = [];
sky.LEVELS.forEach((spec, li) => {
  for (let s = 0; s < 30; s++) {
    const L = sky.generateLevel(makeRng(`sky:${li}:${s}`), spec);
    skyscraper.push({ start: L.start, target: L.target, caps: L.caps, opt: L.opt });
  }
});
const numberbox = [];
for (let s = 0; s < 300; s++) numberbox.push(nb.generateRound(makeRng(`nb:${s}`), s % 10));
const figure = fig.ROUNDS.map((values) => ({ values, ...fig.optimum(values) }));
const balloon = bal.ROUNDS.map((r) => ({ ...r, popMax: bal.MAX_PUMPS, ev: bal.solveRound(r).ev, firstTarget: bal.optimalTarget(r, 0, 0) }));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ skyscraper, numberbox, figure, balloon }));
console.log(`skyscraper ${skyscraper.length}, numberbox ${numberbox.length}, figure ${figure.length}, balloon ${balloon.length}`);
