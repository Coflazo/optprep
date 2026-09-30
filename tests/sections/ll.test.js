import { test } from 'node:test';
import assert from 'node:assert/strict';
import section from '../../src/sections/ll/index.js';
import { familySuite, volumeSuite, bankSuite, itemKey } from '../helpers/harness.js';
import { makeRng } from '../../src/core/rng.js';
import { RANK_MARGIN } from '../../src/core/contract.js';

for (const f of section.families) familySuite('ll', f);
volumeSuite('ll', section.families, { min: 500 });
bankSuite('ll', section.bank, { min: 45 });

const gen = (f, s, tag = 'x') => f.generate(makeRng(`${tag}:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] });
const fam = (id) => section.families.find((f) => f.id === id);

test('ll: at least 15 families; every one contributes at least 15 distinct items over 400 seeds', () => {
  assert.ok(section.families.length >= 15, `${section.families.length} families`);
  for (const f of section.families) {
    const keys = new Set();
    for (let s = 0; s < 400; s++) keys.add(itemKey(f.generate(makeRng(`vol:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] })));
    assert.ok(keys.size >= 15, `${f.id}: only ${keys.size} distinct items`);
  }
});

test('ll: every item carries plain-JSON params naming its family; margins hold with room', () => {
  for (const f of section.families) {
    for (let s = 0; s < 30; s++) {
      const it = gen(f, s, 'params');
      assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${f.id}: params not plain JSON`);
      assert.equal(it.params.family, f.id);
      const ps = it.answerOrder.map((i) => it.statements[i].p);
      assert.ok(ps[0] - ps[1] >= RANK_MARGIN && ps[1] - ps[2] >= RANK_MARGIN);
    }
  }
  for (const it of section.bank) assert.deepEqual(JSON.parse(JSON.stringify(it.params)), it.params, `${it.id}: params not plain JSON`);
});

test('ll: the Markov trap lists nodes by incoming arrows and the true order is the exact reverse', () => {
  const f = fam('markov-graph');
  for (let s = 0; s < 60; s++) {
    const it = f.generate(makeRng(`trap:${s}`), { difficulty: 5 });
    assert.deepEqual(it.answerOrder, [2, 1, 0], `seed ${s}`);
    const indeg = it.params.targets.map((j) => it.params.inDegree[j]);
    assert.ok(indeg[0] > indeg[1] && indeg[1] > indeg[2], `seed ${s}: in-degrees ${indeg}`);
    // the displayed arrow counts match the rendered graph
    const counts = it.params.targets.map((j) => it.prompt.visual.edges.filter((e) => e.to === it.prompt.visual.nodes[j].id && e.from !== e.to).length);
    assert.deepEqual(counts, indeg);
  }
  const bankTrap = section.bank.find((it) => it.id === 'll-bank-markov-reversal');
  assert.deepEqual(bankTrap.answerOrder, [2, 1, 0]);
});

test('ll: impossible and certain statements are exactly 0 and 1', () => {
  const f = fam('impossible-bounds');
  for (let s = 0; s < 60; s++) {
    const ps = gen(f, s, 'bounds').statements.map((x) => x.p).sort((a, b) => a - b);
    assert.equal(ps[0], 0);
    assert.equal(ps[2], 1);
  }
  const ft = section.bank.find((it) => it.id === 'll-bank-free-throw-impossible');
  assert.deepEqual(ft.statements.map((x) => x.p).sort((a, b) => a - b), [0, ft.statements.find((x) => x.p > 0 && x.p < 1).p, 1]);
});

test('ll: scatter points avoid gridlines and the diagonal, so region counts are unambiguous', () => {
  const f = fam('scatter-regions');
  for (let s = 0; s < 40; s++) {
    for (const [x, y] of gen(f, s, 'grid').prompt.visual.points) {
      assert.ok(!Number.isInteger(x) && !Number.isInteger(y) && x !== y);
    }
  }
});

// ---- Visual renderers: no DOM in node, so render into a minimal fake document and inspect the tree.
class FakeNode {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.style = {}; this.dataset = {}; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  append(...cs) { this.children.push(...cs); }
  addEventListener() {}
}
globalThis.Node = FakeNode;
globalThis.document = {
  createElementNS: (ns, t) => new FakeNode(t),
  createElement: (t) => new FakeNode(t),
  createTextNode: (t) => Object.assign(new FakeNode('#text'), { text: t }),
};

test('ll: every visual spec renders to an accessible SVG with finite coordinates and token colours only', async () => {
  const { renderVisual } = await import('../../src/ui/visuals/index.js');
  const specs = [];
  for (const f of section.families) for (let s = 0; s < 12; s++) { const v = gen(f, s, 'viz').prompt.visual; if (v) specs.push(v); }
  for (const it of section.bank) if (it.prompt.visual) specs.push(it.prompt.visual);
  const types = new Set(specs.map((v) => v.type));
  for (const t of ['table', 'bar', 'histogram', 'density', 'scatter', 'graph']) assert.ok(types.has(t), `no ${t} visual generated`);
  for (const spec of specs) {
    const root = renderVisual(spec);
    assert.equal(root.tag, 'figure');
    if (spec.type === 'table') continue;
    const svg = root.children[0];
    assert.equal(svg.tag, 'svg');
    assert.equal(svg.attrs.role, 'img');
    assert.ok(svg.attrs['aria-label']?.length > 20, 'aria-label summarises the data');
    assert.ok(svg.attrs.viewBox, 'responsive viewBox');
    const walk = (n) => {
      for (const [k, v] of Object.entries(n.attrs)) {
        assert.ok(!/NaN|undefined|Infinity/.test(v), `${spec.type}: ${n.tag}.${k} = ${v}`);
        if (k === 'style') assert.ok(!/#[0-9a-f]{3,6}|rgb\(|gradient|shadow|animation/i.test(v), `${spec.type}: raw colour or effect in ${v}`);
        assert.ok(!['fill', 'stroke'].includes(k), `${spec.type}: colour set outside CSS variables`);
      }
      if (n.tag === '#text') assert.ok(!/NaN|undefined/.test(String(n.text)), `${spec.type}: text ${n.text}`);
      n.children.forEach(walk);
    };
    walk(svg);
  }
});

test('ll: bank table params (scope and hit rows) reproduce every statement probability', () => {
  let checked = 0;
  for (const it of section.bank) {
    const st = it.params.statements;
    if (!Array.isArray(st) || !st[0]?.scope) continue;
    it.params.displayOrder.forEach((ci, pos) => {
      assert.equal(st[ci].hits.length / st[ci].scope.length, it.statements[pos].p, `${it.id} statement ${pos}`);
    });
    checked++;
  }
  assert.ok(checked >= 10, `only ${checked} table items checked`);
});
