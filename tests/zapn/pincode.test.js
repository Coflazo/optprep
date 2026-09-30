import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/pincode/index.js';
import { createEngine, DEFAULTS, MODES, expected, showMs } from '../../src/zapn/pincode/engine.js';

test('pincode: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'pincode');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.pincode.metric);
});

test('pincode: transforms for the three modes', () => {
  assert.deepEqual(MODES, ['forward', 'reverse', 'sorted']);
  assert.equal(expected('40971', 'forward'), '40971');
  assert.equal(expected('40971', 'reverse'), '17904');
  assert.equal(expected('40971', 'sorted'), '01479');
  assert.equal(expected('3303', 'sorted'), '0333');
});

// A simulated candidate with a fixed capacity per mode: correct when len <= cap, else wrong.
function play(e, caps) {
  let t = 0;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    e.act({ type: 'tick' }, (t = e.state.showUntil));
    assert.equal(e.state.phase, 'input');
    const mode = MODES[e.state.mode];
    const want = expected(e.state.digits, mode);
    const answer = e.state.len <= caps[mode] ? want : want.slice(0, -1) + ((+want.at(-1) + 1) % 10);
    for (const d of answer) e.act({ type: 'digit', d }, t += 200);
    e.act({ type: 'submit' }, t += 100);
    e.act({ type: 'tick' }, (t += DEFAULTS.feedbackMs));
  }
}

test('pincode: two correct advance, two wrong end the mode; span is the forward length', () => {
  const e = createEngine(makeRng(2));
  play(e, { forward: 9, reverse: 6, sorted: 5 });
  const r = e.result();
  assert.equal(r.metric, 'span');
  assert.equal(r.value, 9);
  assert.deepEqual(r.detail.spans, { forward: 9, reverse: 6, sorted: 5 });
  // Forward: lengths 3..9 twice correct (14), then 10 wrong twice (2) = 16 trials.
  assert.equal(e.state.trials.filter((x) => x.mode === 'forward').length, 16);
  assert.ok(e.state.trials.every((x) => x.digits.length === x.len && /^[0-9]+$/.test(x.digits)));
});

test('pincode: a correct-wrong-correct sequence still advances (two correct at the length)', () => {
  const e = createEngine(makeRng(3));
  let t = 0;
  e.act({ type: 'start' }, t);
  const answerOnce = (right) => {
    e.act({ type: 'tick' }, (t = e.state.showUntil));
    const want = expected(e.state.digits, 'forward');
    for (const d of right ? want : '9'.repeat(want.length + 1)) e.act({ type: 'digit', d }, t += 50);
    e.act({ type: 'submit' }, t += 50);
    e.act({ type: 'tick' }, (t += DEFAULTS.feedbackMs));
  };
  answerOnce(true); answerOnce(false); answerOnce(true);
  assert.equal(e.state.len, 4);
  answerOnce(false); answerOnce(false);
  assert.equal(e.state.mode, 1);
  assert.equal(e.result().value, 3);
});

test('pincode: digits typed while the code is visible are ignored; backspace edits', () => {
  const e = createEngine(makeRng(4));
  e.act({ type: 'start' }, 0);
  e.act({ type: 'digit', d: 5 }, 10);
  assert.equal(e.state.typed, '');
  const t = showMs(3);
  e.act({ type: 'digit', d: 5 }, t);
  e.act({ type: 'digit', d: 6 }, t + 1);
  e.act({ type: 'back' }, t + 2);
  assert.equal(e.state.typed, '5');
});

test('pincode: same seed gives the same codes', () => {
  const a = createEngine(makeRng('p')), b = createEngine(makeRng('p'));
  play(a, { forward: 6, reverse: 5, sorted: 4 }); play(b, { forward: 6, reverse: 5, sorted: 4 });
  assert.deepEqual(a.state.trials, b.state.trials);
});

test('pincode: at least 300 distinct codes across seeds', () => {
  const seen = new Set();
  for (let s = 0; s < 12; s++) {
    const e = createEngine(makeRng(`vol${s}`));
    play(e, { forward: 8, reverse: 6, sorted: 6 });
    for (const x of e.state.trials) seen.add(`${x.mode}:${x.digits}`);
  }
  assert.ok(seen.size >= 300, `only ${seen.size}`);
});
