import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { Q } from '../../src/core/rational.js';
import { ZAPN_TARGETS } from '../../config/sections.js';
import game from '../../src/zapn/numberbox/index.js';
import { createEngine, DEFAULTS, solve, solutionFor, evaluate, check, generateRound } from '../../src/zapn/numberbox/engine.js';

test('numberbox: index exports the game contract and the configured metric', () => {
  assert.equal(game.id, 'numberbox');
  assert.ok(game.title && game.skill && game.spec);
  assert.equal(typeof game.view.mount, 'function');
  assert.ok(game.coach.purpose && game.coach.rule && game.coach.strategy.every((s) => s.say && s.why));
  assert.equal(createEngine(makeRng(1)).result().metric, ZAPN_TARGETS.numberbox.metric);
});

test('numberbox: solver finds known answers including a fractional intermediate', () => {
  for (const [nums, t] of [[[3, 3, 8, 8], 24], [[1, 5, 5, 5], 24], [[4, 3, 2, 7], 52], [[1, 3, 4, 6], 24]]) {
    const e = solutionFor(nums, t);
    assert.ok(e, `${nums} -> ${t}`);
    assert.ok(check(nums, t, e).ok, e); // independent BigInt re-evaluation
  }
  assert.equal(solutionFor([1, 1, 1, 1], 24), null);
  assert.equal(solutionFor([1, 1, 1, 1], 4), '1 + 1 + 1 + 1');
});

// Brute force over all 4! orders x 5 bracketings x 4^3 operators, with BigInt fractions.
test('numberbox: subset DP reaches exactly the values of a brute-force tree enumeration', () => {
  const perms = (a) => (a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
  const shapes = ['((A o B) o C) o D', '(A o (B o C)) o D', '(A o B) o (C o D)', 'A o ((B o C) o D)', 'A o (B o (C o D))'];
  for (const nums of [[1, 2, 3, 4], [3, 3, 8, 8], [2, 5, 7, 9], [1, 1, 6, 9]]) {
    const brute = new Set();
    for (const [A, B, C, D] of perms(nums)) for (const sh of shapes) for (const o1 of '+-*/') for (const o2 of '+-*/') for (const o3 of '+-*/') {
      const ops = [o1, o2, o3];
      let k = 0;
      const r = evaluate(sh.replace('A', A).replace('B', B).replace('C', C).replace('D', D).replace(/o/g, () => ops[k++]));
      if (r.ok) brute.add(r.value.toString());
    }
    assert.deepEqual([...solve(nums).keys()].sort(), [...brute].sort(), `${nums}`);
  }
});

test('numberbox: parser handles precedence, brackets, symbols and rejects bad input', () => {
  assert.equal(evaluate('2 + 3 * 4').value.toString(), '14');
  assert.equal(evaluate('(2 + 3) × 4').value.toString(), '20');
  assert.equal(evaluate('8 ÷ (3 − 8 ÷ 3)').value.toString(), '24');
  assert.equal(evaluate('7 - 3 - 2').value.toString(), '2');
  assert.equal(evaluate('8 / 4 / 2').value.toString(), '1');
  for (const bad of ['', '2 +', '(2 + 3', '2 3', '-2 + 3', '4 / 0', '2 ^ 3']) assert.equal(evaluate(bad).ok, false, bad);
  assert.equal(check([1, 2, 3, 4], 10, '1 + 2 + 3 + 4').ok, true);
  assert.equal(check([1, 2, 3, 4], 10, '12 - 3 + 1').valid, false); // no concatenation
  assert.equal(check([1, 2, 3, 4], 10, '1 + 2 + 3').valid, false); // must use all four
  assert.equal(check([1, 2, 3, 4], 11, '1 + 2 + 3 + 4').ok, false);
});

test('numberbox: 10 rounds, every round solvable and the shown solution evaluates exactly to the target', () => {
  assert.equal(DEFAULTS.rounds, 10);
  for (let s = 0; s < 8; s++) {
    const e = createEngine(makeRng(`nb${s}`));
    assert.equal(e.state.rounds.length, 10);
    for (const R of e.state.rounds) {
      assert.equal(R.nums.length, 4);
      assert.ok(R.nums.every((n) => n >= 1 && n <= 9));
      assert.ok(R.target >= DEFAULTS.minTarget && R.target <= DEFAULTS.maxTarget);
      const c = check(R.nums, R.target, R.solution);
      assert.ok(c.valid && c.ok, `${R.nums} -> ${R.target}: ${R.solution}`);
    }
    // Difficulty ramps: late rounds have no more solutions than early rounds on average.
    const early = e.state.rounds.slice(0, 3).reduce((a, r) => a + r.solutionCount, 0) / 3;
    const late = e.state.rounds.slice(7).reduce((a, r) => a + r.solutionCount, 0) / 3;
    assert.ok(late <= early, `seed ${s}: early ${early} late ${late}`);
  }
});

test('numberbox: scoring counts solved rounds; wrong submits and skips are tracked', () => {
  const e = createEngine(makeRng('play'));
  let t = 0;
  e.act({ type: 'start' }, t);
  while (!e.isOver()) {
    const R = e.state.rounds[e.state.i];
    if (e.state.i === 2) { e.act({ type: 'skip' }, t += 5000); continue; }
    const bad = e.act({ type: 'submit', expr: R.nums.join(' + ') }, t += 1000);
    if (bad.ok) continue; // the sum happened to be the target
    assert.equal(e.act({ type: 'submit', expr: '1 +' }, t += 10).valid, false);
    assert.equal(e.act({ type: 'submit', expr: R.solution }, t += 2000).ok, true);
  }
  const r = e.result();
  assert.equal(r.metric, 'solved');
  assert.equal(r.value, 9);
  assert.ok(e.state.results[2].skipped);
  assert.ok(r.detail.wrongSubmits >= 1);
});

test('numberbox: at least 300 distinct solvable puzzles, each with a verified solution', () => {
  const seen = new Set();
  for (let s = 0; s < 330; s++) {
    const R = generateRound(makeRng(`vol${s}`), s % 10);
    const c = check(R.nums, R.target, R.solution);
    assert.ok(c.valid && c.ok, `${R.nums} -> ${R.target}: ${R.solution}`);
    seen.add(`${[...R.nums].sort().join(',')}=${R.target}`);
  }
  assert.ok(seen.size >= 300, `only ${seen.size} distinct puzzles`);
});

test('numberbox: same seed gives the same rounds', () => {
  assert.deepEqual(createEngine(makeRng('q')).state.rounds, createEngine(makeRng('q')).state.rounds);
});
