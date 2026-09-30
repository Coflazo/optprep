import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/theswitch/index.js';
import { createEngine, DEFAULTS, generateTrials } from '../../src/zapn/theswitch/engine.js';

test('theswitch: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'theswitch');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.theswitch.metric);
});

test('theswitch: 35 rounds, 17 switches, answers match the active task', () => {
  assert.equal(DEFAULTS.rounds, 35);
  for (let s = 0; s < 50; s++) {
    const ts = generateTrials(makeRng(`t${s}`), 35);
    assert.equal(ts.length, 35);
    assert.equal(ts.filter((t) => t.switch).length, 17);
    ts.forEach((t, i) => {
      if (i > 0) assert.equal(t.switch, t.task !== ts[i - 1].task);
      const [a, op, b] = t.math.text.split(' ');
      const v = op === '+' ? +a + +b : +a - +b;
      assert.equal(v, t.math.value);
      assert.ok(v > 0);
      assert.equal(t.arrows.same, t.arrows.a.dir === t.arrows.b.dir);
      assert.equal(t.answer, t.task === 'math' ? v % 2 === 1 : t.arrows.same);
    });
  }
});

function play(e, { rtSwitch = 900, rtRepeat = 700, wrongEvery = 0 } = {}) {
  let t = 0;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    e.act({ type: 'tick' }, t += DEFAULTS.itiMs);
    const T = e.state.trials[e.state.i];
    const yes = wrongEvery && (e.state.i + 1) % wrongEvery === 0 ? !T.answer : T.answer;
    e.act({ type: 'answer', yes }, t += T.switch ? rtSwitch : rtRepeat);
  }
}

test('theswitch: accuracy, switch cost and the equal-weight score', () => {
  const e = createEngine(makeRng(2));
  play(e);
  const r = e.result();
  assert.equal(r.metric, 'accuracy');
  assert.equal(r.value, 1);
  assert.equal(r.detail.switchCost, 200);
  const b = createEngine(makeRng(2));
  play(b, { wrongEvery: 5 });
  assert.equal(b.result().detail.correct, 28);
  assert.ok(b.result().score < r.score);
});

test('theswitch: no answer within the deadline is a wrong timeout', () => {
  const e = createEngine(makeRng(3));
  e.act({ type: 'start' }, 0);
  e.act({ type: 'tick' }, DEFAULTS.itiMs);
  e.act({ type: 'tick' }, DEFAULTS.itiMs + DEFAULTS.deadlineMs);
  assert.equal(e.state.responses[0].timeout, true);
  assert.equal(e.state.responses[0].correct, false);
});

test('theswitch: same seed and timestamps give the same result', () => {
  const a = createEngine(makeRng('z')), b = createEngine(makeRng('z'));
  play(a, { wrongEvery: 4 }); play(b, { wrongEvery: 4 });
  assert.deepEqual(a.result(), b.result());
});

test('theswitch: at least 300 distinct trials across seeds', () => {
  const seen = new Set();
  for (let s = 0; s < 12; s++) {
    for (const t of generateTrials(makeRng(`vol${s}`), 35)) seen.add(`${t.task}|${t.math.text}|${t.arrows.a.dir}${t.arrows.a.n}|${t.arrows.b.dir}${t.arrows.b.n}`);
  }
  assert.ok(seen.size >= 300, `only ${seen.size}`);
});
