import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDiagram, DIAGRAM_TYPES } from '../../src/study/diagrams/index.js';
import { arbitrage } from '../../src/study/diagrams/bundle.js';

const ok = (t, s) => assert.deepEqual(validateDiagram(t, s), [], `${t} should pass`);
const bad = (t, s, frag) => { const e = validateDiagram(t, s); assert.ok(e.length && (!frag || e.some((x) => x.includes(frag))), `${t} should fail (${frag}): ${e}`); };

test('tree: branches sum to 1 and marked total is exact', () => {
  const t = { root: { label: '', children: [{ p: '1/6', label: 'six', mark: true }, { p: '5/6', label: 'not six', children: [{ p: '1/6', label: 'six', mark: true }, { p: '5/6', label: 'not' }] }] }, total: '11/36' };
  ok('tree', t);
  bad('tree', { ...t, total: '1/3' }, 'marked leaves');
  bad('tree', { root: { children: [{ p: '1/2' }, { p: '1/3' }] } }, 'sum to');
});

test('grid: counts and ranges', () => {
  ok('grid', { rows: 6, cols: 6, highlight: [[4, 5], [5, 4], [5, 5]], count: 3 });
  bad('grid', { rows: 6, cols: 6, highlight: [[4, 5]], count: 3 }, 'count');
  bad('grid', { rows: 6, cols: 6, highlight: [[6, 0]] }, 'out of range');
});

test('venn: regions add to total', () => {
  ok('venn', { sets: ['A', 'B'], regions: { A: 10, B: 5, AB: 3, none: 2 }, total: 20 });
  bad('venn', { sets: ['A', 'B'], regions: { A: 10, B: 5, AB: 3, none: 2 }, total: 21 }, 'add to');
});

test('numberline, cycle, unitsquare, plot', () => {
  ok('numberline', { min: 0, max: 4, barriers: [0, 4], start: 1, path: [1, 2, 1, 0] });
  bad('numberline', { min: 0, max: 4, path: [1, 3] }, 'jump');
  ok('cycle', { n: 6, start: 0, target: 3 });
  bad('cycle', { n: 2 });
  ok('unitsquare', { regions: [{ points: [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]], area: '1/4' }] });
  bad('unitsquare', { regions: [{ points: [[0, 0], [1, 0], [0, 1]], area: 0.25 }] }, 'area');
  ok('plot', { x: { min: 0, max: 20 }, y: { min: 0, max: 60 }, curves: [{ label: 'EV', points: [[0, 0], [10, 50], [20, 0]] }] });
  bad('plot', { x: { min: 0, max: 20 }, y: { min: 0, max: 10 }, curves: [{ points: [[0, 0], [10, 50]] }] }, 'leaves');
});

test('ladder: exact differences and ratios', () => {
  ok('ladder', { mode: 'diff', rows: [[2, 6, 12, 20, 30], [4, 6, 8, 10], [2, 2, 2]] });
  bad('ladder', { mode: 'diff', rows: [[2, 6, 12], [4, 7]] }, 'expected');
  ok('ladder', { mode: 'ratio', rows: [[3, 6, 12, 24], [2, 2, 2]] });
  ok('ladder', { mode: 'diff', rows: [['1/2', '3/4', 1], ['1/4', '1/4']] });
});

test('flow: reachable, acyclic', () => {
  ok('flow', { root: 'q', nodes: [{ id: 'q', text: 'Gaps constant?' }, { id: 'a', text: 'Arithmetic', kind: 'a' }, { id: 'b', text: 'Look at ratios', kind: 'q' }], edges: [{ from: 'q', to: 'a', label: 'yes' }, { from: 'q', to: 'b', label: 'no' }] });
  bad('flow', { root: 'q', nodes: [{ id: 'q', text: 'x' }, { id: 'z', text: 'orphan' }], edges: [] }, 'unreachable');
  bad('flow', { root: 'a', nodes: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }], edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }] }, 'cycle');
});

test('orderbook diagrams: book, bundle, ledger arithmetic', () => {
  ok('book', { instrument: 'A', levels: [{ bid: 99.5, ask: 100 }, { bid: 99, ask: 100.5 }] });
  bad('book', { instrument: 'A', levels: [{ bid: 100, ask: 100 }] }, 'below ask');
  const b = { bundle: { name: 'A+B', bid: 33, ask: 34 }, legs: [{ name: 'A', qty: 1, bid: 10, ask: 11 }, { name: 'B', qty: 1, bid: 20, ask: 21 }], stated: { legsAsk: 32, legsBid: 30, profit: 1 } };
  ok('bundle', b);
  assert.equal(arbitrage(b).sellBundle, 1);
  bad('bundle', { ...b, stated: { profit: 2 } }, 'best profit');
  ok('ledger', { products: ['A', 'B'], rows: [{ text: 'A', side: 'buy', price: 11, legs: [1, 0] }, { text: 'B', side: 'buy', price: 21, legs: [0, 1] }, { text: 'A+B', side: 'sell', price: 33, legs: [1, 1] }], stated: { cash: 1, flat: true } });
  bad('ledger', { products: ['A'], rows: [{ text: 'A', side: 'buy', price: 11, legs: [1] }], stated: { flat: true } }, 'flat');
});

test('reused visuals and unknown types', () => {
  ok('graph', { markov: true, nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ from: 'a', to: 'b', p: '1/2' }, { from: 'a', to: 'a', p: '1/2' }, { from: 'b', to: 'a', p: 1 }] });
  bad('graph', { markov: true, edges: [{ from: 'a', to: 'b', p: 0.4 }] }, 'sum to');
  bad('nope', {}, 'unknown');
  assert.ok(DIAGRAM_TYPES.includes('tree') && DIAGRAM_TYPES.includes('density'));
});
