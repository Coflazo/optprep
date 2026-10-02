// The README comparison is a public claim about other products. Every row must trace to a
// source read on a stated date, and the chart must draw every row it is given.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chart, rows } from '../../tools/readme-charts.mjs';

const data = JSON.parse(readFileSync(new URL('../../docs/compare/competitors.json', import.meta.url), 'utf8'));
const VALUES = new Set(['yes', 'partial', 'no', 'not stated']);

test('every product row is sourced, priced and covers each task with a known value', () => {
  assert.match(data.checked, /^\d{4}-\d{2}-\d{2}$/);
  for (const p of data.products) {
    assert.ok(p.sources?.length && p.sources.every((u) => /^https:\/\//.test(u)), `${p.name}: sources`);
    assert.ok(Number.isFinite(p.price?.amount) && p.price.amount >= 0 && p.price.currency, `${p.name}: price`);
    assert.deepEqual(Object.keys(p.tasks).sort(), [...data.tasks].sort(), `${p.name}: tasks`);
    for (const t of data.tasks) assert.ok(VALUES.has(p.tasks[t]), `${p.name}: ${t} = ${p.tasks[t]}`);
  }
});

test('the chart lists every product, cheapest first, in both themes', () => {
  const list = rows(data);
  assert.equal(list.length, data.products.length);
  for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].eur <= list[i].eur);
  for (const theme of ['light', 'dark']) {
    const svg = chart(theme, data);
    assert.match(svg, /^<svg [^>]*role="img"/);
    for (const p of data.products) assert.ok(svg.includes(p.name.replace(/&/g, '&amp;')), `${theme}: ${p.name}`);
  }
});
