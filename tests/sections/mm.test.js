import { test } from 'node:test';
import assert from 'node:assert/strict';
import section from '../../src/sections/mm/index.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { familySuite, volumeSuite } from '../helpers/harness.js';
import { makeRng } from '../../src/core/rng.js';
import { parseLabel, evaluate } from '../../src/sections/mm/lib.js';
import { divNotation } from '../../src/core/format.js';
import { buildLibrary, setCount } from '../../src/core/library.js';
import { SECTIONS } from '../../config/sections.js';
import { Q } from '../../src/core/rational.js';

for (const f of section.families) familySuite('mm', f);
volumeSuite('mm', section.families, { min: 560 });

const items = (f, n, tag) => Array.from({ length: n }, (_, s) => f.generate(makeRng(`${tag}:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] }));

test('mm: eight families with unique mm- ids across every section', () => {
  assert.equal(section.families.length, 8);
  const all = Object.values(SECTION_MODULES).flatMap((m) => m.families.map((f) => f.id));
  assert.equal(new Set(all).size, all.length, 'family ids must be unique across sections (lessons look families up by id)');
  for (const f of section.families) assert.match(f.id, /^mm-/);
  const levels = new Set(section.families.flatMap((f) => f.levels));
  for (const d of [1, 2, 3]) assert.ok(levels.has(d), `no family at difficulty ${d}`);
});

test('mm: exactly 4 options, distinct labels and values, a named false belief on every wrong one', () => {
  for (const f of section.families) for (const it of items(f, 80, 'shape')) {
    assert.equal(it.optionCount, 4);
    assert.equal(it.options.length, 4, it.prompt.text);
    assert.equal(new Set(it.options.map((o) => o.label)).size, 4, it.prompt.text);
    assert.equal(new Set(it.options.map((o) => o.value)).size, 4, it.prompt.text);
    it.options.forEach((o, i) => {
      if (i === it.answerIndex) assert.equal(o.misconception, null);
      else assert.ok(typeof o.misconception === 'string' && o.misconception.length > 15, `${it.prompt.text}: option ${o.label}`);
    });
  }
});

test('mm: the answer label parses back to the exact value, and all four options share one form and size', () => {
  const form = (l) => (l.endsWith('%') ? 'pct' : l.includes('/') ? 'frac' : l.includes('.') ? 'dec' : 'int');
  for (const f of section.families) for (const it of items(f, 80, 'form')) {
    const key = it.options[it.answerIndex];
    assert.equal(key.label, it.answer.label);
    assert.ok(parseLabel(key.label).eq(new Q(BigInt(it.answer.exact.split('/')[0]), BigInt(it.answer.exact.split('/')[1] || 1))), `${it.prompt.text}: ${key.label} vs ${it.answer.exact}`);
    const forms = new Set(it.options.map((o) => form(o.label)));
    assert.equal(forms.size, 1, `${it.prompt.text}: mixed forms ${it.options.map((o) => o.label).join(', ')}`);
    for (const o of it.options) {
      const r = Math.abs(o.value) / Math.abs(it.answer.value);
      assert.ok(r >= 1 / 12 && r <= 12, `${it.prompt.text}: ${o.label} is not the same size as ${key.label}`);
    }
  }
});

test('mm: every solution has ask, steps, an exam-speed path and a sanity check', () => {
  for (const f of section.families) for (const it of items(f, 40, 'sol')) {
    const s = it.solution;
    for (const k of ['ask', 'fast', 'check', 'rule', 'anchor']) assert.ok(typeof s[k] === 'string' && s[k].trim().length > 5, `${f.id}: solution.${k}`);
    assert.ok(s.steps.length >= 2 && s.steps.every((st) => st.say && st.why));
    assert.ok(!/undefined|NaN|\[object/.test(JSON.stringify(it)), `${f.id}: ${JSON.stringify(s)}`);
  }
});

test('mm: a twin keeps the variant and changes the numbers', () => {
  for (const f of section.families) {
    assert.ok(f.variants.length >= 3, `${f.id}: ${f.variants.length} variants`);
    for (const v of f.variants) {
      const a = f.generate(makeRng(`twin:${f.id}:${v}:a`), { variant: v, difficulty: 3 });
      assert.equal(a.params.variant, v);
      const b = f.generate(makeRng(`twin:${f.id}:${v}:b`), { variant: a.params.variant, difficulty: a.difficulty });
      assert.equal(b.params.variant, v);
      assert.equal(b.difficulty, a.difficulty);
      assert.deepEqual(JSON.parse(JSON.stringify(a.params)), a.params, 'params are plain JSON');
    }
  }
});

test('mm: the answer position is spread over all four slots', () => {
  for (const f of section.families) {
    const pos = [0, 0, 0, 0];
    for (const it of items(f, 400, 'pos')) pos[it.answerIndex]++;
    assert.ok(pos.every((n) => n >= 60), `${f.id}: answer positions ${pos.join('/')}`);
  }
});

// A test-wise solver who never does the sum picks the option closest to all the others (smallest
// summed digit-edit distance; ties split). With every wrong option one slip from the answer that
// found the answer 78 to 94% of the time. It must stay near the 1-in-4 chance level.
test('mm: the closest-to-the-others option is the answer no more often than chance (2,000 seeds per family)', () => {
  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  for (const f of section.families) {
    let hit = 0, compound = 0;
    for (const it of items(f, 2000, 'tell')) {
      const L = it.options.map((o) => o.label);
      const sums = L.map((a, i) => L.reduce((t, b, j) => t + (i === j ? 0 : lev(a, b)), 0));
      const best = sums.flatMap((v, i) => (v === Math.min(...sums) ? [i] : []));
      if (best.includes(it.answerIndex)) hit += 1 / best.length;
      if (it.options.some((o) => / A second slip on top: /.test(o.misconception || ''))) compound++;
    }
    assert.ok(hit / 2000 <= 0.35, `${f.id}: the centre option is the answer in ${(hit / 20).toFixed(1)}% of items`);
    assert.ok(compound / 2000 >= 0.5, `${f.id}: only ${compound} items build a distractor from another distractor`);
  }
});

test('mm: the verifier rejects an item keyed to a wrong option', () => {
  for (const f of section.families) for (const it of items(f, 10, 'neg')) {
    const k = (it.answerIndex + 1) % 4;
    const bad = { ...it, answerIndex: k, answer: { ...it.answer, label: it.options[k].label, value: it.options[k].value } };
    assert.equal(f.verify(bad).ok, false, `${f.id}: ${it.prompt.text}`);
  }
});

test('mm: the prompt parser follows the order of operations, fractions and percent', () => {
  const v = (s) => evaluate(s).toString();
  assert.equal(v('12 + 8 × 5'), '52');
  assert.equal(v('48 ÷ 4 × 3'), '36');
  assert.equal(v('48 : 4 × 3'), '36');
  assert.equal(v('500 − (90 − 25)'), '435');
  assert.equal(v('3/4 ÷ 9/10'), '5/6');
  assert.equal(v('2/3 + 3/4'), '17/12');
  assert.equal(v('15% of 240'), '36');
  assert.equal(v('12.5% of 360'), '45');
  assert.equal(evaluate('66 × ?', Q.of(21, 10)).toString(), '693/5'); // 138.6
  assert.throws(() => evaluate('2 + abc'));
});

test('mm: division notation swaps ÷ for : only when the setting asks for it', () => {
  assert.equal(divNotation('735 ÷ ? = 15', 'colon'), '735 : ? = 15');
  assert.equal(divNotation('735 ÷ ? = 15', 'obelus'), '735 ÷ ? = 15');
  assert.equal(divNotation('735 ÷ ? = 15', undefined), '735 ÷ ? = 15');
});

test('mm: the library fills seven 80-question sets with distinct prompts', () => {
  const cfg = SECTIONS.mm;
  const size = setCount(cfg.exam.count) * cfg.exam.count;
  assert.equal(size, 560);
  const lib = buildLibrary(section, { size, cache: false });
  assert.equal(lib.length, 560);
  assert.equal(new Set(lib.map((it) => it.prompt.text)).size, 560);
});

test('mm: config replicates the reported 80-in-8 format', () => {
  const e = SECTIONS.mm.exam;
  assert.deepEqual([e.count, e.totalSeconds, e.optionCount, e.scoring, e.navigation, e.autoAdvance, e.allowSkip], [80, 480, 4, 'plusMinus', 'forward', true, false]);
  assert.ok(SECTIONS.mm.variants.some((v) => v.allowSkip === true));
  assert.equal(SECTIONS.mm.target.metric, 'net');
});
