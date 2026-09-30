import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/shapeshift/index.js';
import { createEngine, DEFAULTS, KEY_FOR } from '../../src/zapn/shapeshift/engine.js';

test('shapeshift: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'shapeshift');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.shapeshift.metric);
});

test('shapeshift: 60 rounds, balanced shapes, positions inside the stage', () => {
  const e = createEngine(makeRng(3));
  assert.equal(DEFAULTS.rounds, 60);
  assert.equal(e.state.trials.length, 60);
  assert.equal(e.state.trials.filter((t) => t.shape === 'circle').length, 30);
  assert.ok(e.state.trials.every((t) => t.x > 0 && t.x < 1 && t.y > 0 && t.y < 1 && t.iti >= DEFAULTS.itiMin && t.iti <= DEFAULTS.itiMax));
  assert.deepEqual(createEngine(makeRng(3)).state.trials, e.state.trials);
});

// Drive with a 16 ms frame clock; respond `rt` ms after the shape appears.
function play(e, { rt = 400, wrongEvery = 0, skipEvery = 0 } = {}) {
  let t = 0, n = 0;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    t += 16;
    e.act({ type: 'tick' }, t);
    if (e.state.phase === 'stim' && t - e.state.stimAt >= rt) {
      n++;
      if (skipEvery && n % skipEvery === 0) { while (e.state.phase === 'stim') e.act({ type: 'tick' }, t += 16); continue; }
      const right = KEY_FOR[e.state.trials[e.state.i].shape];
      const key = wrongEvery && n % wrongEvery === 0 ? (right === 'left' ? 'right' : 'left') : right;
      e.act({ type: 'key', key }, t);
    }
  }
}

test('shapeshift: scoring counts correct keys, misses and reaction time', () => {
  const a = createEngine(makeRng(4));
  play(a, { rt: 400 });
  let r = a.result();
  assert.equal(r.metric, 'accuracy');
  assert.equal(r.value, 1);
  assert.ok(r.detail.meanRt >= 400 && r.detail.meanRt < 420);
  const b = createEngine(makeRng(4));
  play(b, { rt: 300, wrongEvery: 10, skipEvery: 15 });
  r = b.result();
  assert.equal(r.detail.misses, 4);
  assert.equal(r.detail.correct + r.detail.misses + (r.detail.answered - r.detail.correct), 60);
  assert.ok(r.value < 0.95 && r.value > 0.8);
});

test('shapeshift: a flash is visible for flashMs, a press before onset is early', () => {
  const e = createEngine(makeRng(5));
  e.act({ type: 'start' }, 0);
  assert.deepEqual(e.act({ type: 'key', key: 'left' }, 10), { early: true });
  const onset = e.state.onsetAt;
  e.act({ type: 'tick' }, onset);
  assert.equal(e.visible(onset + DEFAULTS.flashMs - 1), true);
  assert.equal(e.visible(onset + DEFAULTS.flashMs), false);
  e.act({ type: 'tick' }, onset + DEFAULTS.windowMs);
  assert.equal(e.state.responses[0].miss, true);
  assert.equal(e.result().detail.early, 1);
});

test('shapeshift: same seed and same timestamps give the same result', () => {
  const a = createEngine(makeRng('d')), b = createEngine(makeRng('d'));
  play(a, { rt: 350, wrongEvery: 7 }); play(b, { rt: 350, wrongEvery: 7 });
  assert.deepEqual(a.result(), b.result());
});

test('shapeshift: at least 300 distinct trials across seeds', () => {
  const seen = new Set();
  for (let s = 0; s < 6; s++) for (const t of createEngine(makeRng(`vol${s}`)).state.trials) seen.add(`${t.shape}|${t.x}|${t.y}|${t.iti}`);
  assert.ok(seen.size >= 300, `only ${seen.size}`);
});
