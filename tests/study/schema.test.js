import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLesson, FAMILY_SECTIONS, SECTION_TITLES } from '../../src/study/schema.js';

const sections = FAMILY_SECTIONS.map((key) => ({ type: 'section', key, title: SECTION_TITLES[key] }));
const chk = [{ type: 'choice', q: 'Which?', options: ['a', 'b', 'c'], answer: 1, traps: { 0: 'belief a', 2: 'belief c' }, explain: 'because' }];
const check = { type: 'check', questions: chk };
const good = {
  id: 'bto/demo', book: 'bto', kind: 'family', family: 'two-dice-sum', title: 'Demo', summary: 'A demo lesson.', objectives: ['one', 'two'],
  blocks: [
    sections[0], { type: 'challenge', q: 'try', answer: 'x', explain: 'y', attempts: [{ id: 'sums', label: 'count sums', approach: '11 sums', breaksAt: 'not equally likely' }, { id: 'unordered', label: 'unordered pairs', approach: '21 pairs', breaksAt: 'doubles are rarer' }] }, { type: 'text', text: 'cue' }, check, sections[1], { type: 'text', text: 'why' }, sections[2], { type: 'text', text: 'anchor' }, check,
    sections[3], { type: 'diagram', diagram: 'grid', spec: {}, caption: 'c' }, { type: 'diagram', diagram: 'tree', spec: {}, caption: 'c' }, { type: 'diagram', diagram: 'flow', spec: {}, caption: 'c' }, check,
    sections[4], { type: 'steps', steps: [{ say: 'a', why: 'b', checks: chk, answers: 'sums' }, { say: 'c', why: 'd', checks: chk, answers: 'unordered' }] }, { type: 'explain', prompt: 'why?', model: 'because', points: ['p1', 'p2'] },
    sections[5], { type: 'worked', family: 'two-dice-sum', difficulty: 1, explainAt: [1] }, { type: 'worked', family: 'two-dice-sum', difficulty: 2, fade: 1 },
    sections[6], { type: 'predict', question: 'q?', answer: 'a' }, sections[7], { type: 'traps', family: 'two-dice-sum' }, { type: 'erroneous', problem: 'p', steps: ['a', 'b', 'c'], errorStep: 1, explain: 'e' }, check,
    sections[8], { type: 'thinkaloud', problem: 'p', lines: [{ t: 0, say: 'see it' }, { t: 3, say: 'divide by 11?', slip: true }, { t: 5, say: 'no: 36 pairs' }, { t: 9, say: 'check it' }] }, { type: 'callout', tone: 'speed', text: 'fast' }, check, sections[9], { type: 'callout', tone: 'rule', text: 'rule' },
    sections[10], { type: 'compare', columns: ['a', 'b'], rows: [['1', '2']] }, { type: 'callout', tone: 'transfer', text: 't' }, check, { type: 'variation', base: 'b', rows: [{ change: 'c1', effect: 'e1', same: true }, { change: 'c2', effect: 'e2', fusion: true }] }, { type: 'transfer', near: { type: 'number', q: 'n?', answer: 1, explain: 'e' }, far: { type: 'number', q: 'f?', answer: 2, explain: 'e' }, principle: { type: 'choice', q: 'p?', options: ['a', 'b', 'c'], answer: 0, explain: 'e' } }, sections[11], { type: 'tryit', family: 'two-dice-sum' },
  ],
};

test('a complete family lesson validates', () => { assert.deepEqual(validateLesson(good), []); });

test('missing or reordered sections, too few diagrams, wrong tryit are caught', () => {
  const swapped = { ...good, blocks: [...good.blocks] };
  const iR = swapped.blocks.findIndex((b) => b.key === 'recognise'), iW = swapped.blocks.findIndex((b) => b.key === 'why');
  [swapped.blocks[iR], swapped.blocks[iW]] = [swapped.blocks[iW], swapped.blocks[iR]];
  assert.ok(validateLesson(swapped).some((e) => e.includes('sections must be')));
  const fewer = { ...good, blocks: good.blocks.filter((b) => !(b.type === 'diagram' && b.diagram === 'flow')) };
  assert.ok(validateLesson({ ...good, objectives: [] }).some((e) => e.includes('objectives')));
  assert.ok(validateLesson({ ...good, blocks: good.blocks.filter((b) => b.type !== 'challenge') }).some((e) => e.includes('challenge')));
  assert.ok(validateLesson({ ...good, blocks: good.blocks.map((b) => (b.fade ? { ...b, fade: 0 } : b)) }).some((e) => e.includes('faded')));
  assert.ok(validateLesson(fewer).some((e) => e.includes('3 diagrams')));
  const wrongTry = { ...good, blocks: good.blocks.map((b) => (b.type === 'tryit' ? { ...b, family: 'other' } : b)) };
  assert.ok(validateLesson(wrongTry).some((e) => e.includes('tryit')));
  assert.ok(validateLesson({ ...good, blocks: [...good.blocks, { type: 'bogus' }] }).some((e) => e.includes('unknown block')));
});

test('every teaching unit needs 1-3 micro-checks; steps each need their own', () => {
  const noCheck = { ...good, blocks: good.blocks.filter((b, i) => !(b.type === 'check' && good.blocks[i - 1]?.type === 'callout' && good.blocks[i - 1].tone === 'speed')) };
  assert.ok(validateLesson(noCheck).some((e) => e.includes('"speed" needs micro-check')));
  const stepNoCheck = { ...good, blocks: good.blocks.map((b) => (b.type === 'steps' ? { ...b, steps: [{ say: 'a', why: 'b' }, b.steps[1]] } : b)) };
  assert.ok(validateLesson(stepNoCheck).some((e) => e.includes('step 1')));
  const tooMany = { ...good, blocks: good.blocks.map((b) => (b.type === 'check' ? { ...b, questions: [...chk, ...chk, ...chk, ...chk] } : b)) };
  assert.ok(validateLesson(tooMany).some((e) => e.includes('1 to 3')));
});

test('thinkaloud and variation are required and validated', () => {
  const noTA = { ...good, blocks: good.blocks.filter((b) => b.type !== 'thinkaloud') };
  assert.ok(validateLesson(noTA).some((e) => e.includes('needs a thinkaloud')));
  const noVar = { ...good, blocks: good.blocks.filter((b) => b.type !== 'variation') };
  assert.ok(validateLesson(noVar).some((e) => e.includes('variation block')));
  const backwards = { ...good, blocks: good.blocks.map((b) => (b.type === 'thinkaloud' ? { ...b, lines: [{ t: 5, say: 'a' }, { t: 2, say: 'b', slip: true }, { t: 9, say: 'c' }] } : b)) };
  assert.ok(validateLesson(backwards).some((e) => e.includes('must not go backwards')));
});

test('challenge attempts must each be answered by exactly one derivation step', () => {
  const noAnswer = { ...good, blocks: good.blocks.map((b) => (b.type === 'steps' ? { ...b, steps: b.steps.map((st) => ({ ...st, answers: undefined })) } : b)) };
  assert.ok(validateLesson(noAnswer).some((e) => e.includes('must be answered by exactly one step')));
  const noSlip = { ...good, blocks: good.blocks.map((b) => (b.type === 'thinkaloud' ? { ...b, lines: b.lines.map(({ slip, ...l }) => l) } : b)) };
  assert.ok(validateLesson(noSlip).some((e) => e.includes('wrong turn')));
});
