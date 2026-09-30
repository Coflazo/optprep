import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/codecompare/index.js';
import { createEngine, DEFAULTS, allowanceMs, lengthAt, editCount, generateRound } from '../../src/zapn/codecompare/engine.js';

test('codecompare: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'codecompare');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.codecompare.metric);
});

test('codecompare: 30 rounds, allowance 5 s down to 3 s, length 7 up to 10', () => {
  assert.equal(DEFAULTS.rounds, 30);
  assert.equal(allowanceMs(0), 5000);
  assert.equal(allowanceMs(29), 3000);
  for (let i = 1; i < 30; i++) {
    assert.ok(allowanceMs(i) < allowanceMs(i - 1));
    assert.ok(lengthAt(i) >= lengthAt(i - 1));
  }
  assert.equal(lengthAt(0), 7);
  assert.equal(lengthAt(29), 10);
});

test('codecompare: exactly one identical option; distractors differ by 1-2 edits and from each other', () => {
  const rng = makeRng('gen');
  for (let n = 0; n < 600; n++) {
    const R = generateRound(rng, n % 30);
    assert.equal(R.options.length, 4);
    assert.equal(R.options.filter((o) => o === R.target).length, 1);
    assert.equal(R.options[R.answer], R.target);
    assert.equal(new Set(R.options).size, 4);
    assert.match(R.target, /^[A-Z0-9]{7,10}$/);
    for (const o of R.options) if (o !== R.target) {
      const d = editCount(R.target, o);
      assert.ok(d >= 1 && d <= 2, `${R.target} vs ${o}: ${d}`);
    }
  }
});

test('codecompare: scoring and timeouts', () => {
  const e = createEngine(makeRng(9));
  let t = 0;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    const i = e.state.i;
    if (i % 10 === 9) { e.act({ type: 'tick' }, t += e.state.rounds[i].allowanceMs); } // time out
    else if (i % 10 === 4) e.act({ type: 'choose', index: (e.state.rounds[i].answer + 1) % 4 }, t += 900); // wrong
    else e.act({ type: 'choose', index: e.state.rounds[i].answer }, t += 1200);
    e.act({ type: 'tick' }, t += DEFAULTS.gapMs);
  }
  const r = e.result();
  assert.equal(r.metric, 'accuracy');
  assert.equal(r.detail.correct, 24);
  assert.equal(r.detail.timeouts, 3);
  assert.equal(r.value, 24 / 30);
  assert.equal(r.detail.meanRt, 1200);
});

test('codecompare: an answer after the deadline is a timeout, not a hit', () => {
  const e = createEngine(makeRng(10));
  e.act({ type: 'start' }, 0);
  e.act({ type: 'choose', index: e.state.rounds[0].answer }, 5001);
  assert.equal(e.state.responses[0].timeout, true);
  assert.equal(e.state.responses[0].correct, false);
});

test('codecompare: same seed gives the same rounds', () => {
  assert.deepEqual(createEngine(makeRng('s')).state.rounds, createEngine(makeRng('s')).state.rounds);
});

test('codecompare: at least 300 distinct rounds across seeds', () => {
  const seen = new Set();
  for (let s = 0; s < 12; s++) for (const R of createEngine(makeRng(`vol${s}`)).state.rounds) seen.add(`${R.target}|${R.options.join(',')}`);
  assert.ok(seen.size >= 300, `only ${seen.size}`);
});
