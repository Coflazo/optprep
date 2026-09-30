import { test } from 'node:test';
import assert from 'node:assert/strict';
import section from '../../src/sections/iv/index.js';
import { familySuite, volumeSuite, bankSuite, itemKey } from '../helpers/harness.js';
import { makeRng } from '../../src/core/rng.js';
import { intervalScore } from '../../src/core/check.js';
import { bestInterval, expectedScore, Phi } from '../../src/sections/iv/optimal.js';

for (const f of section.families) familySuite('iv', f);
volumeSuite('iv', section.families, { min: 500 });
bankSuite('iv', section.bank, { min: 45 });

test('iv: every family contributes at least 15 distinct items over 400 seeds', () => {
  for (const f of section.families) {
    const keys = new Set();
    for (let s = 0; s < 400; s++) keys.add(itemKey(f.generate(makeRng(`div:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] })));
    assert.ok(keys.size >= 15, `${f.id}: only ${keys.size} distinct items`);
  }
});

test('iv: items carry unit, coach and JSON params; a spot-on zero-width answer to an exact item scores 1', () => {
  for (const f of section.families) {
    for (let s = 0; s < 20; s++) {
      const it = f.generate(makeRng(`iv-meta:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] });
      assert.equal(typeof it.unit, 'string');
      assert.equal(typeof it.coach.exact, 'boolean');
      assert.ok(['point', 'normal', 'lognormal'].includes(it.coach.belief.kind));
      if (it.coach.belief.kind !== 'point') assert.ok(it.coach.belief.sd > 0);
      assert.ok(it.coach.note.length > 10);
      assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${f.id}: params must be plain JSON`);
      assert.ok(it.params.scenario, `${f.id}: params.scenario missing`);
      if (it.coach.belief.kind === 'point') assert.equal(intervalScore(it.truth, it.truth, it.truth), 1);
      if (it.prompt.visual) assert.ok(!String(it.prompt.visual.label).match(new RegExp(`\\b${Math.round(it.truth)}\\b`)), `${f.id}: aria label leaks the answer`);
    }
  }
});

test('iv visuals: specs reproduce the truth', () => {
  for (let s = 0; s < 30; s++) {
    const d = section.families.find((f) => f.id === 'dots-count').generate(makeRng(`vis:dots:${s}`), { difficulty: 1 + (s % 3) });
    assert.equal(d.prompt.visual.items.filter((i) => i.shape === d.params.countShape).length, d.truth);
    const g = section.families.find((f) => f.id === 'dice-grid').generate(makeRng(`vis:dice:${s}`), { difficulty: 3 });
    assert.equal(g.prompt.visual.items.reduce((a, i) => a + i.pips, 0), g.truth);
    const p = section.families.find((f) => f.id === 'path-length').generate(makeRng(`vis:path:${s}`), { difficulty: 2 + (s % 3) });
    const { points, scale } = p.prompt.visual;
    const len = points.slice(1).reduce((a, [x, y], i) => a + Math.hypot(x - points[i][0], y - points[i][1]), 0) / scale.px * scale.units;
    assert.ok(Math.abs(len - p.truth) < 1e-9);
    const v = section.families.find((f) => f.id === 'percentile').generate(makeRng(`vis:grid:${s}`), { difficulty: 3 });
    assert.equal(v.prompt.visual.values.length, 200);
  }
});

// Independent brute-force checks for bank scenarios that no generator family produces.
const d6 = [1, 2, 3, 4, 5, 6];
const frac = (f, n) => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (f((i + 0.5) / n, (j + 0.5) / n)) c++; return c / (n * n); };
const BANK_CHECKS = {
  'triangle-stick': () => [frac((u, v) => { const [a, b] = [Math.min(u, v), Math.max(u, v)]; return Math.max(a, b - a, 1 - b) < 0.5; }, 800) * 100, 0.05],
  'square-product': () => [d6.flatMap((a) => d6.map((b) => Number.isInteger(Math.sqrt(a * b)))).filter(Boolean).length / 36 * 100, 1e-9],
  increasing3: () => [d6.flatMap((a) => d6.flatMap((b) => d6.map((c) => a < b && b < c))).filter(Boolean).length / 216 * 100, 1e-9],
  atLeastHeads: ({ n, k }) => [Array.from({ length: 2 ** n }, (_, m) => m.toString(2).split('1').length - 1 >= k).filter(Boolean).length / 2 ** n * 100, 1e-9],
  'two-aces': () => { let c = 0; for (let x = 0; x < 52; x++) for (let y = 0; y < 52; y++) if (x !== y && x < 4 && y < 4) c++; return [c / (52 * 51) * 100, 1e-9]; },
  'duel-best-of-two': () => [d6.flatMap((a) => d6.flatMap((b) => d6.map((y) => Math.max(a, b) > y))).filter(Boolean).length / 216 * 100, 1e-9],
  'six-then-sum': ({ k }) => { const pairs = d6.flatMap((a) => d6.map((b) => [a, b])).filter(([a, b]) => a === 6 || b === 6); return [pairs.filter(([a, b]) => a + b >= k).length / pairs.length * 100, 1e-9]; },
  'inscribed-circle': () => [frac((x, y) => (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25, 1000) * 100, 0.05],
};

test('iv bank: every truth is recomputed independently', () => {
  for (const it of section.bank) {
    assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${it.id}: params must be plain JSON`);
    const chk = BANK_CHECKS[it.params.scenario];
    if (chk) {
      const [v, tol] = chk(it.params);
      assert.ok(Math.abs(v - it.truth) <= tol, `${it.id}: brute force ${v}, bank ${it.truth}`);
    } else {
      const f = section.families.find((x) => x.id === it.family);
      const r = f.verify(it);
      assert.ok(r.ok, `${it.id}: ${r.detail}`);
    }
  }
});

test('optimal: exact belief gives zero width and score 1', () => {
  assert.deepEqual(bestInterval({ kind: 'point' }, 42), { lower: 42, upper: 42, score: 1 });
});

test('optimal: wider belief gives a wider optimum and a lower score', () => {
  let prevW = 0, prevS = 1;
  for (const sd of [1, 3, 6, 12]) {
    const r = bestInterval({ kind: 'normal', sd }, 100);
    assert.ok(r.upper - r.lower > prevW && r.score < prevS);
    prevW = r.upper - r.lower; prevS = r.score;
  }
});

test('optimal: the interval leans high because lower/upper rewards higher intervals', () => {
  const n = bestInterval({ kind: 'normal', sd: 8 }, 100);
  assert.ok((n.lower + n.upper) / 2 > 100 && n.upper - 100 > 100 - n.lower);
  const l = bestInterval({ kind: 'lognormal', sd: 0.1 }, 100);
  assert.ok(Math.abs(Math.log(l.lower / 100) + Math.log(l.upper / 100)) < 0.005, 'symmetric in log space');
  assert.ok((l.lower + l.upper) / 2 > 100);
});

test('optimal: lognormal optimum satisfies the first-order condition φ(z)/s = 2Φ(z) − 1', () => {
  for (const s of [0.05, 0.1, 0.3]) {
    const r = bestInterval({ kind: 'lognormal', sd: s }, 50), z = Math.log(r.upper / 50) / s;
    const lhs = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) / s, rhs = 2 * Phi(z) - 1;
    assert.ok(Math.abs(lhs - rhs) < 2e-3, `s=${s}: ${lhs} vs ${rhs}`);
  }
});

test('optimal: no nearby interval beats the optimum, and Monte Carlo agrees with expectedScore', () => {
  const b = { kind: 'normal', sd: 5 }, c = 60, r = bestInterval(b, c);
  for (const [dl, du] of [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3], [0.3, 0.3], [-0.3, -0.3]]) {
    assert.ok(expectedScore(b, c, r.lower + dl, r.upper + du) <= r.score + 1e-9);
  }
  const rng = makeRng('mc');
  let tot = 0;
  const N = 20000;
  for (let i = 0; i < N; i++) tot += intervalScore(r.lower, r.upper, rng.normal(c, 5));
  assert.ok(Math.abs(tot / N - r.score) < 0.01, `MC ${tot / N} vs ${r.score}`);
});

// Minimal DOM stand-in so the SVG renderers can run under node.
class FakeNode {}
class FakeEl extends FakeNode {
  constructor(tag) { super(); this.tag = tag; this.attrs = {}; this.children = []; this.style = {}; this.dataset = {}; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener() {}
  append(...c) { this.children.push(...c); }
}
class FakeText extends FakeNode { constructor(t) { super(); this.text = t; } }

test('visual renderers: pure SVG with role=img, viewBox, CSS-variable colours and no answer in the label', async () => {
  globalThis.Node = FakeNode;
  globalThis.document = { createElement: (t) => new FakeEl(t), createElementNS: (_, t) => new FakeEl(t), createTextNode: (t) => new FakeText(t) };
  const { renderVisual } = await import('../../src/ui/visuals/index.js');
  const walk = (el, f) => { f(el); (el.children || []).forEach((c) => walk(c, f)); };
  for (const f of section.families) {
    const it = f.generate(makeRng(`render:${f.id}`), { difficulty: f.levels.at(-1) });
    if (!it.prompt.visual) continue;
    const svg = renderVisual(it.prompt.visual);
    assert.equal(svg.tag, 'svg');
    assert.equal(svg.attrs.role, 'img');
    assert.ok(svg.attrs.viewBox && svg.attrs['aria-label']);
    walk(svg, (el) => {
      for (const k of ['fill', 'stroke']) if (el.style?.[k] && el.style[k] !== 'none') assert.match(el.style[k], /^var\(--/, `${f.id}: ${k} must use a CSS variable`);
      assert.ok(!/gradient|filter|animate/i.test(el.tag || ''));
    });
    const again = renderVisual(it.prompt.visual);
    assert.equal(JSON.stringify(again), JSON.stringify(svg), 'renderer must be deterministic');
  }
  delete globalThis.document;
  delete globalThis.Node;
});
