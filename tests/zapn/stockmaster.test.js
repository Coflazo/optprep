import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/stockmaster/index.js';
import { createEngine, DEFAULTS, schedule, needle } from '../../src/zapn/stockmaster/engine.js';

test('stockmaster: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'stockmaster');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.stockmaster.metric);
});

test('stockmaster: 2-minute schedule, non-overlapping per slot, zones inside the dial, speeds ramp up', () => {
  assert.equal(DEFAULTS.durationMs, 120000);
  const gs = schedule(makeRng(2));
  assert.ok(gs.length > 60);
  for (let s = 0; s < DEFAULTS.slots; s++) {
    const mine = gs.filter((g) => g.slot === s);
    for (let i = 1; i < mine.length; i++) assert.ok(mine[i].spawn >= mine[i - 1].end + DEFAULTS.gapMin);
  }
  assert.ok(gs.every((g) => g.spawn < DEFAULTS.durationMs && g.zone[0] > 0 && g.zone[1] < 1 && g.zone[1] > g.zone[0]));
  const early = gs.filter((g) => g.spawn < 30000), late = gs.filter((g) => g.spawn > 90000);
  const mean = (xs) => xs.reduce((a, g) => a + g.speed, 0) / xs.length;
  assert.ok(mean(late) > mean(early));
});

// Click each gauge at the fraction `aim` of its zone (0.5 = centre); skip every `skipEvery`-th.
// Clicks are delivered in time order, as a real clock would.
function play(e, { aim = 0.5, skipEvery = 0 } = {}) {
  e.act({ type: 'start' }, 0);
  const clicks = e.state.gauges
    .filter((g, i) => !(skipEvery && i % skipEvery === 0))
    .map((g) => ({ slot: g.slot, t: g.spawn + ((g.zone[0] + aim * (g.zone[1] - g.zone[0])) * 1000) / g.speed }))
    .filter((c) => c.t >= 0 && c.t < DEFAULTS.durationMs)
    .sort((a, b) => a.t - b.t);
  for (const c of clicks) e.act({ type: 'click', slot: c.slot }, c.t);
  e.act({ type: 'tick' }, DEFAULTS.durationMs);
}

test('stockmaster: perfect timing scores 1; misses and early clicks lower it', () => {
  const perfect = createEngine(makeRng(3));
  play(perfect);
  const r = perfect.result();
  assert.equal(r.metric, 'accuracy');
  assert.equal(r.detail.falseClicks, 0);
  assert.equal(r.detail.misses, 0);
  assert.equal(r.value, 1);
  const sloppy = createEngine(makeRng(3));
  play(sloppy, { aim: -0.5, skipEvery: 5 });
  const s = sloppy.result();
  assert.ok(s.detail.misses > 0 && s.detail.early > 0);
  assert.equal(s.detail.hits, 0);
  assert.equal(s.value, 0);
});

test('stockmaster: needle position and single outcome per gauge', () => {
  const e = createEngine(makeRng(4));
  e.act({ type: 'start' }, 1000);
  const g = e.state.gauges[0];
  assert.equal(needle(g, g.spawn), 0);
  assert.ok(Math.abs(needle(g, g.spawn + 500 / g.speed) - 0.5) < 1e-9);
  const tMid = 1000 + g.spawn + ((g.zone[0] + g.zone[1]) * 500) / g.speed;
  assert.equal(e.act({ type: 'click', slot: g.slot }, tMid).result, 'hit');
  // A second click on the same slot before the next gauge spawns is an empty click.
  assert.equal(e.act({ type: 'click', slot: g.slot }, tMid + 1).result, 'empty');
  assert.equal(e.state.hits, 1);
  assert.equal(e.state.falseClicks, 1);
});

test('stockmaster: same seed and click times give the same result', () => {
  const a = createEngine(makeRng('m')), b = createEngine(makeRng('m'));
  play(a, { aim: 0.8, skipEvery: 3 }); play(b, { aim: 0.8, skipEvery: 3 });
  assert.deepEqual(a.result(), b.result());
});

test('stockmaster: needle schedules differ across seeds', () => {
  const seen = new Set();
  for (let s = 0; s < 30; s++) seen.add(schedule(makeRng(`vol${s}`)).map((g) => `${g.slot}:${g.spawn}:${g.speed.toFixed(4)}`).join(';'));
  assert.equal(seen.size, 30);
});
