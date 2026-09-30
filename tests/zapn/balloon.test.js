import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/balloon/index.js';
import { createEngine, solveRound, optimalBank, optimalTarget, ROUNDS, MAX_PUMPS } from '../../src/zapn/balloon/engine.js';

// Independent expectimax over the full outcome tree (no DP table), for small rounds.
function bruteForce({ balloons, centsPerPump: c, bankPenalty: p }, N) {
  const f = (b, bank) => {
    if (b === 0) return bank;
    let best = -Infinity;
    for (let t = 0; t <= N; t++) {
      let ev = 0;
      for (let k = 1; k <= N; k++) ev += k > t ? f(b - 1, bank + t * c) : f(b - 1, bank - Math.floor(bank * p));
      best = Math.max(best, ev / N);
    }
    return best;
  };
  return f(balloons, 0);
}

function playThreshold(engine, target) {
  let t = 0;
  engine.act({ type: 'start' }, t);
  while (!engine.isOver()) {
    const res = engine.act({ type: 'pump' }, ++t);
    if (res.outcome === 'pumped' && res.pumps >= target) engine.act({ type: 'cash' }, ++t);
  }
}

test('balloon: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'balloon');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.engine.createEngine, 'function');
  assert.equal(typeof game.view.mount, 'function');
  for (const k of ['purpose', 'howItWorks', 'scoring', 'strategy', 'rule']) assert.ok(game.coach[k], k);
  assert.ok(game.coach.strategy.every((s) => s.say && s.why));
  const e = game.engine.createEngine(makeRng(1));
  assert.equal(e.result().metric, ZAPN_TARGETS.balloon.metric);
});

test('balloon: round format matches the reported spec', () => {
  assert.deepEqual(ROUNDS.map((r) => [r.balloons, r.centsPerPump, r.bankPenalty]), [[30, 10, 0], [20, 20, 0.5]]);
  const e = createEngine(makeRng(2));
  assert.equal(e.pops[0].length, 30);
  assert.equal(e.pops[1].length, 20);
  assert.ok(e.pops.flat().every((k) => k >= 1 && k <= MAX_PUMPS));
});

test('balloon: round 1 optimum equals a brute-force scan over thresholds', () => {
  const N = MAX_PUMPS, c = ROUNDS[0].centsPerPump;
  let bestT = 0, bestEv = -1;
  for (let t = 0; t <= N; t++) {
    const ev = c * t * (N - t) / N;
    if (ev > bestEv) { bestEv = ev; bestT = t; }
  }
  assert.equal(bestT, 10);
  const { ev } = solveRound(ROUNDS[0]);
  assert.ok(Math.abs(ev - 30 * bestEv) < 1e-6, `${ev} vs ${30 * bestEv}`);
  for (let i = 0; i < 30; i++) assert.equal(optimalTarget(ROUNDS[0], i, i * 50), 10);
});

test('balloon: bank-penalty DP matches brute-force expectimax on small rounds', () => {
  for (const [n, N, c, p] of [[1, 6, 20, 0.5], [2, 6, 20, 0.5], [3, 5, 20, 0.5], [3, 6, 10, 0], [2, 7, 30, 0.25]]) {
    const r = { balloons: n, centsPerPump: c, bankPenalty: p };
    const dp = solveRound(r, N).ev;
    const bf = bruteForce(r, N);
    assert.ok(Math.abs(dp - bf) < 1e-6, `n=${n} N=${N} p=${p}: dp ${dp} bf ${bf}`);
  }
});

test('balloon: round 2 policy shrinks as the bank grows (numbers quoted by the coach)', () => {
  const r2 = ROUNDS[1];
  assert.equal(optimalTarget(r2, 0, 0), 11);
  let prev = Infinity;
  for (let bank = 0; bank <= 1000; bank += 100) {
    const t = optimalTarget(r2, 10, bank);
    assert.ok(t <= prev, `not monotone at ${bank}`);
    prev = t;
  }
  assert.ok(optimalTarget(r2, 10, 1000) <= 2);
  // Coach rule "about 11 minus the round-2 bank in dollars" stays within 2 pumps mid-round.
  for (let i = 0; i <= 15; i++) {
    for (let bank = 0; bank <= Math.min(1000, i * 19 * 20); bank += 100) {
      const rule = Math.max(0, 11 - bank / 100);
      assert.ok(Math.abs(optimalTarget(r2, i, bank) - rule) <= 2, `balloon ${i + 1}, bank ${bank}`);
    }
  }
  assert.match(game.coach.rule, /11 minus/);
});

test('balloon: same seed and same actions give the same result', () => {
  const a = createEngine(makeRng('seed')), b = createEngine(makeRng('seed'));
  playThreshold(a, 7); playThreshold(b, 7);
  assert.deepEqual(a.result(), b.result());
});

test('balloon: scoring rules for cash, pop and the round-2 bank penalty', () => {
  const e = createEngine(makeRng(5), { maxPumps: 20 });
  e.act({ type: 'start' }, 0);
  const k0 = e.pops[0][0];
  // Round 1: cash one pump short of the pop point earns 10c per pump.
  for (let i = 0; i < k0 - 1; i++) e.act({ type: 'pump' }, 1);
  if (k0 > 1) assert.equal(e.act({ type: 'cash' }, 2).earned, (k0 - 1) * 10);
  // Pop: pump until it bursts, earns nothing, round-1 bank unchanged.
  const before = e.state.banks[0];
  let res;
  do res = e.act({ type: 'pump' }, 3); while (res.outcome === 'pumped');
  assert.equal(res.outcome, 'pop');
  assert.equal(e.state.banks[0], before);
  // Skip to round 2 by cashing at zero pumps.
  while (e.state.round === 0) e.act({ type: 'cash' }, 4);
  // Build a round-2 bank, then pop: bank loses floor(bank / 2).
  const k = e.pops[1][0];
  for (let i = 0; i < k - 1; i++) e.act({ type: 'pump' }, 5);
  e.act({ type: 'cash' }, 6);
  const bank = e.state.banks[1];
  assert.equal(bank, (k - 1) * 20);
  do res = e.act({ type: 'pump' }, 7); while (res.outcome === 'pumped');
  assert.equal(e.state.banks[1], bank - Math.floor(bank / 2));
});

test('balloon: playing the optimal policy scores ratio 1; timid play scores less', () => {
  for (let s = 0; s < 20; s++) {
    const e = createEngine(makeRng(`opt${s}`));
    let t = 0;
    e.act({ type: 'start' }, t);
    while (!e.isOver()) {
      const r = ROUNDS[e.state.round];
      const target = optimalTarget(r, e.state.balloon, e.state.banks[e.state.round]);
      if (e.state.pumps >= target) e.act({ type: 'cash' }, ++t);
      else e.act({ type: 'pump' }, ++t);
    }
    const res = e.result();
    assert.equal(res.metric, 'ratio');
    assert.ok(Math.abs(res.value - 1) < 1e-12, `seed ${s}: ${res.value}`);
    assert.equal(res.detail.optimalCents, optimalBank(ROUNDS[0], e.pops[0]) + optimalBank(ROUNDS[1], e.pops[1]));
  }
  let timid = 0;
  for (let s = 0; s < 20; s++) { const e = createEngine(makeRng(`opt${s}`)); playThreshold(e, 2); timid += e.result().value; }
  assert.ok(timid / 20 < 0.6, `timid mean ratio ${timid / 20}`);
});

test('balloon: pop points differ across seeds and cover 1..20 evenly', () => {
  const seqs = new Set(), freq = Array(MAX_PUMPS + 1).fill(0);
  for (let s = 0; s < 40; s++) {
    const pops = createEngine(makeRng(`vol${s}`)).pops.flat();
    seqs.add(pops.join(','));
    pops.forEach((k) => freq[k]++);
  }
  assert.equal(seqs.size, 40);
  const n = 40 * 50, expected = n / MAX_PUMPS;
  const chi2 = freq.slice(1).reduce((a, f) => a + (f - expected) ** 2 / expected, 0);
  assert.ok(chi2 < 43.8, `chi-square ${chi2} on 19 df`); // 99.9th percentile
});
