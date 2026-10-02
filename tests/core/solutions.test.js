// Every generated and every bank item carries a full worked solution: the ask, a picture
// (the study diagram that best explains it, validated by that diagram's own arithmetic),
// steps with their math, the exam-speed path and a sanity check. Pictures are built from the
// item's own numbers, and the checks below tie each picture type back to the item.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { validateSolution } from '../../src/core/contract.js';
import { validateDiagram, DIAGRAM_TYPES } from '../../src/study/diagrams/index.js';
import { makeRng } from '../../src/core/rng.js';
import { parseLabel } from '../../src/sections/mm/lib.js';

const SECTIONS = ['mm', 'ob'];
const SEEDS = 40;

// Families whose solutions carry no picture, with the reason. Keep this list short.
const NO_PICTURE = {};

// Plain tutor voice: no filler adverbs, no stock AI words, no en or em dashes.
const BANNED = /\b(simply|just|obviously|clearly|delve|crucial|pivotal|notably|additionally|furthermore|moreover|robust|seamless(ly)?|let's)\b|it's worth|[–—]/i;
const num = (s) => parseLabel(String(s).replace(/,/g, '')).toNumber();

// Picture numbers must agree with the item they explain.
function agrees(it) {
  const p = it.solution.picture;
  if (!p) return null;
  const sp = p.spec;
  if (it.section === 'mm' && p.diagram === 'table' && sp.columns[0] === '×') {
    const total = sp.rows.reduce((t, r) => t + r.slice(1).reduce((u, c) => u + num(c), 0), 0);
    if (Math.abs(total - it.answer.value) > 1e-9) return `area cells add to ${total}, answer ${it.answer.value}`;
  }
  if (it.section === 'mm' && p.diagram === 'table' && ['carry', 'lends'].includes(sp.rows[0][0])) {
    const [a, b, c] = sp.rows.slice(1).map((r) => Number(r.slice(1).join('')));
    const want = sp.rows[2][0] === '+' ? a + b : a - b;
    if (want !== c || Math.abs(c) !== Math.abs(it.answer.value)) return `column view ${a} ${sp.rows[2][0]} ${b} = ${c}, answer ${it.answer.value}`;
  }
  if ((p.diagram === 'bundle' || p.diagram === 'ledger') && it.best) {
    const stated = p.diagram === 'bundle' ? sp.stated.profit : sp.stated.cash;
    if (Math.abs(stated - it.best.profit) > 1e-9) return `${p.diagram} states ${stated}, best profit ${it.best.profit}`;
  }
  if (p.diagram === 'tree' && sp.total != null && it.answer?.value != null) {
    const [n, d = '1'] = String(sp.total).split('/');
    if (Math.abs(Number(n) / Number(d) - it.answer.value) > 1e-9) return `tree total ${sp.total}, answer ${it.answer.value}`;
  }
  return null;
}

function check(it, where) {
  const s = it.solution;
  const errs = validateSolution(s);
  assert.deepEqual(errs, [], `${where}: ${errs.join('; ')}`);
  for (const t of [s.ask, s.fast, s.check, s.picture?.caption, ...s.steps.map((st) => st.math)].filter(Boolean)) assert.ok(!BANNED.test(t), `${where}: banned word or dash in "${t}"`);
  assert.ok(!/undefined|NaN|\[object|Infinity/.test(JSON.stringify(s)), `${where}: ${JSON.stringify(s).slice(0, 400)}`);
  if (s.picture) {
    assert.ok(DIAGRAM_TYPES.includes(s.picture.diagram), `${where}: unknown diagram ${s.picture.diagram}`);
    const de = validateDiagram(s.picture.diagram, s.picture.spec);
    assert.deepEqual(de, [], `${where}: ${s.picture.diagram} ${de.join('; ')}`);
    assert.deepEqual(JSON.parse(JSON.stringify(s.picture)), s.picture, `${where}: picture must be plain JSON`);
    const bad = agrees(it);
    assert.equal(bad, null, `${where}: ${bad}`);
  } else assert.ok(NO_PICTURE[`${it.section}/${it.family}`], `${where}: picture is null but the family is not on the no-picture list`);
}

for (const sid of SECTIONS) {
  const mod = SECTION_MODULES[sid];
  for (const f of mod.families) {
    test(`${sid}/${f.id}: ask, picture, step math, exam-speed path and check on ${SEEDS} seeds per difficulty`, () => {
      for (const d of f.levels?.length ? f.levels : [1]) {
        for (let s = 0; s < SEEDS; s++) {
          const it = f.generate(makeRng(`sol:${f.id}:${d}:${s}`), { difficulty: d });
          check(it, `${f.id} d${d} seed ${s}`);
        }
      }
    });
  }
  test(`${sid}: every bank item carries the full solution`, () => {
    for (const it of mod.bank) check(it, it.id);
  });
}

test('the no-picture list names real families and gives a reason', () => {
  for (const [k, why] of Object.entries(NO_PICTURE)) {
    const [sid, fid] = k.split('/');
    assert.ok(SECTION_MODULES[sid]?.families.some((f) => f.id === fid), `${k} is not a family`);
    assert.ok(why.length > 20, `${k}: give the reason`);
  }
  assert.ok(Object.keys(NO_PICTURE).length <= 6, 'the no-picture list must stay short');
});
