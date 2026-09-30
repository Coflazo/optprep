import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/figureitout/index.js';
import { createEngine, ROUNDS, PROPS, optimum, solveExact, allCodes, feedback, possible } from '../../src/zapn/figureitout/engine.js';

test('figureitout: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'figureitout');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.figureitout.metric);
});

test('figureitout: 5 rounds with growing property counts, values within PROPS', () => {
  assert.equal(ROUNDS.length, 5);
  for (let i = 1; i < 5; i++) assert.ok(ROUNDS[i].length >= ROUNDS[i - 1].length);
  assert.equal(ROUNDS[0].length, 3);
  assert.equal(ROUNDS[4].length, 6);
  ROUNDS.forEach((vals) => vals.forEach((n, k) => assert.ok(n <= PROPS[k].values.length)));
  assert.deepEqual(optimum([4, 4, 3]), { expected: 3.25, worst: 4 });
});

test('figureitout: closed-form optimum equals exhaustive search over all adaptive strategies', () => {
  for (const v of [[2, 2], [3, 3], [2, 3, 2], [3, 3, 2], [2, 2, 2, 2], [4, 4], [3, 3, 3]]) {
    const exact = solveExact(allCodes(v));
    const closed = optimum(v);
    assert.ok(Math.abs(exact.expected - closed.expected) < 1e-12, `${v}: ${exact.expected} vs ${closed.expected}`);
    assert.equal(exact.worst, closed.worst);
  }
});

// Exact mean guesses of a deterministic strategy over every hidden code.
function strategyMean(values, next) {
  const codes = allCodes(values);
  let total = 0, worst = 0;
  for (const hidden of codes) {
    const guesses = [];
    for (;;) {
      const code = next(values, guesses);
      const fb = feedback(code, hidden);
      guesses.push({ code, fb });
      if (fb === (1 << values.length) - 1) break;
      assert.ok(guesses.length < 50, 'strategy does not terminate');
    }
    total += guesses.length; worst = Math.max(worst, guesses.length);
  }
  return { mean: total / codes.length, worst };
}
const parallel = (values, guesses) => possible(values, guesses).map((vs) => vs[0]);
const oneAtATime = (values, guesses) => { // change only the first wrong property each guess
  const poss = possible(values, guesses);
  const last = guesses.at(-1);
  if (!last) return poss.map((vs) => vs[0]);
  const k = last.code.findIndex((_, i) => !((last.fb >> i) & 1));
  return last.code.map((v, i) => (i === k ? poss[i][0] : v));
};
const lazyRepeat = (values, guesses) => { // keeps retrying the first value once per cycle
  const poss = possible(values, guesses);
  return poss.map((vs) => (guesses.length % 2 ? vs[0] : vs.at(-1)));
};

test('figureitout: solver optimum is no worse than any tested strategy', () => {
  for (const v of [[3, 3], [3, 3, 2], [4, 4, 3], [5, 3, 2]]) {
    const opt = optimum(v);
    for (const [name, s] of [['parallel', parallel], ['oneAtATime', oneAtATime], ['lazyRepeat', lazyRepeat]]) {
      const r = strategyMean(v, s);
      assert.ok(opt.expected <= r.mean + 1e-12, `${name} on ${v}: ${r.mean} < ${opt.expected}`);
      assert.ok(opt.worst <= r.worst, `${name} on ${v}`);
    }
    assert.ok(Math.abs(strategyMean(v, parallel).mean - opt.expected) < 1e-12, `parallel reaches the optimum on ${v}`);
    assert.ok(strategyMean(v, oneAtATime).mean > opt.expected + 0.5, 'one-at-a-time is clearly worse');
  }
});

function play(e, strat) {
  let t = 0;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    const R = e.state.rounds[e.state.round];
    const res = e.act({ type: 'guess', code: strat(R.values, e.state.guesses) }, t += 4000);
    if (res.solved) e.act({ type: 'next' }, t += 500);
  }
  return e.result();
}

test('figureitout: guessesOver is about 0 for perfect play and larger for one-at-a-time', () => {
  let good = 0, bad = 0;
  const n = 120;
  for (let s = 0; s < n; s++) {
    const r = play(createEngine(makeRng(`f${s}`)), parallel);
    assert.equal(r.metric, 'guessesOver');
    assert.equal(r.detail.completed, 5);
    good += r.value;
    bad += play(createEngine(makeRng(`f${s}`)), oneAtATime).value;
  }
  assert.ok(Math.abs(good / n) < 0.25, `perfect play mean over ${good / n}`);
  assert.ok(bad / n > 3, `one-at-a-time mean over ${bad / n}`);
});

test('figureitout: invalid guesses are ignored; same seed gives the same hidden figures', () => {
  const e = createEngine(makeRng(4));
  e.act({ type: 'start' }, 0);
  assert.equal(e.act({ type: 'guess', code: [0, 0] }, 1), null);
  assert.equal(e.act({ type: 'guess', code: [9, 0, 0] }, 1), null);
  assert.equal(e.state.guesses.length, 0);
  assert.deepEqual(createEngine(makeRng('h')).state.rounds.map((r) => r.hidden), createEngine(makeRng('h')).state.rounds.map((r) => r.hidden));
});

test('figureitout: at least 300 distinct hidden figures across seeds', () => {
  const seen = new Set();
  for (let s = 0; s < 80; s++) createEngine(makeRng(`vol${s}`)).state.rounds.forEach((R, i) => seen.add(`${i}:${R.hidden.join('')}`));
  assert.ok(seen.size >= 300, `only ${seen.size}`);
});
