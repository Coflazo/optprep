import { validateQuestion } from './check.js';
// Lesson schema. Family and game lessons must follow the learner-profile template in
// order; foundation and strategy lessons are freer but still need a picture, a
// prediction and a rule. Validators are pure so tests run them over every lesson.
export const FAMILY_SECTIONS = ['recognise', 'why', 'anchor', 'picture', 'derivation', 'worked', 'predict', 'traps', 'speed', 'rule', 'contrast', 'tryit'];
export const SECTION_TITLES = {
  recognise: 'Recognise it', why: 'Why it matters', anchor: 'Start from what you know', picture: 'The picture first',
  derivation: 'Derivation, one move at a time', worked: 'Worked examples', predict: 'Predict before you look',
  traps: 'Traps', speed: 'Speed', rule: 'Rule', contrast: 'Contrast and edge cases', tryit: 'Try it',
};
export const BLOCK_TYPES = ['section', 'text', 'callout', 'diagram', 'steps', 'predict', 'worked', 'traps', 'compare', 'list', 'formula', 'tryit', 'recognize', 'check', 'challenge', 'explain', 'erroneous', 'thinkaloud', 'variation', 'transfer'];
// Sections that teach something get micro-checks; these do not (motivation, examples, summaries, the final test).
export const CHECK_EXEMPT = ['why', 'worked', 'predict', 'rule', 'tryit'];
export const CALLOUT_TONES = ['idea', 'trap', 'speed', 'rule', 'contrast', 'edge', 'transfer'];
export const KINDS = ['family', 'game', 'foundation', 'strategy'];
const TEACHING = ['text', 'diagram', 'callout', 'formula', 'list', 'compare', 'thinkaloud'];

const str = (x) => typeof x === 'string' && x.trim().length > 0;
const strOrFn = (x) => str(x) || typeof x === 'function';

export function validateBlock(b, where = '') {
  const e = [];
  const at = (m) => e.push(`${where}${b?.type || '?'}: ${m}`);
  if (!b || !BLOCK_TYPES.includes(b.type)) return [`${where}unknown block type ${b?.type}`];
  switch (b.type) {
    case 'section': if (!str(b.key) || !str(b.title)) at('needs key and title'); break;
    case 'text': case 'formula': if (!strOrFn(b.text)) at('needs text'); break;
    case 'callout': if (!CALLOUT_TONES.includes(b.tone) || !strOrFn(b.text)) at('needs tone and text'); break;
    case 'diagram': if (!str(b.diagram) || !(b.spec && (typeof b.spec === 'object' || typeof b.spec === 'function')) || !strOrFn(b.caption)) at('needs diagram, spec and caption (dual coding: every picture is explained)'); break;
    case 'steps':
      if (!Array.isArray(b.steps) || b.steps.length < 2 || !b.steps.every((s) => str(s.say) && str(s.why))) at('needs >= 2 steps with say and why');
      else if (b.steps.some((s) => s.say.split(/\s+/).length > 60)) at('a step says too much at once (cognitive load: keep each move under 60 words)');
      else b.steps.forEach((st, i) => { if (st.checks) e.push(...checkList(st.checks, `${where}steps[${i}] `)); });
      break;
    case 'check': e.push(...checkList(b.questions, where)); break;
    case 'predict': if (!str(b.question) || !str(b.answer)) at('needs question and answer'); break;
    case 'worked':
      if (!str(b.family) || !Number.isInteger(b.difficulty)) at('needs family and difficulty');
      if (b.explainAt && !(Array.isArray(b.explainAt) && b.explainAt.length >= 1 && b.explainAt.length <= 2 && b.explainAt.every((i) => Number.isInteger(i) && i >= 0))) at('explainAt: 1-2 step indexes');
      break;
    case 'traps': if (!str(b.family) && !(Array.isArray(b.extra) && b.extra.length)) at('needs family or extra traps'); break;
    case 'compare': if (!Array.isArray(b.columns) || !Array.isArray(b.rows) || !b.rows.every((r) => Array.isArray(r) && r.length === b.columns.length)) at('rows must match columns'); break;
    case 'list': if (!Array.isArray(b.items) || !b.items.length || !b.items.every(strOrFn)) at('needs items'); break;
    case 'tryit': if (!str(b.family) && !str(b.game)) at('needs family or game'); break;
    // productive failure: attempt with two approaches before any teaching
    case 'challenge':
      if (!str(b.q) || !str(b.answer) || !str(b.explain)) at('needs q, answer, explain');
      if (b.attempts && !(Array.isArray(b.attempts) && b.attempts.every((a) => str(a.id) && str(a.label) && str(a.approach) && str(a.breaksAt)) && new Set(b.attempts.map((a) => a.id)).size === b.attempts.length)) at('attempts need unique id, label, approach, breaksAt');
      break;
    // self-explanation / elaborative interrogation / teach-back: write it, then compare with key points
    case 'explain': if (!str(b.prompt) || !str(b.model) || !Array.isArray(b.points) || b.points.length < 2) at('needs prompt, model and >= 2 key points'); break;
    // erroneous example: find the broken step
    case 'erroneous':
      if (!str(b.problem) || !Array.isArray(b.steps) || b.steps.length < 3 || !Number.isInteger(b.errorStep) || !b.steps[b.errorStep] || !str(b.explain)) at('needs problem, >= 3 steps, a valid errorStep and explain');
      break;
    case 'recognize': if (!Array.isArray(b.items) || !b.items.length) at('needs items'); break;
    // think-aloud: an expert's inner monologue at exam pace, with the second each thought happens
    case 'thinkaloud':
      if (!str(b.problem) || !Array.isArray(b.lines) || b.lines.length < 3 || !b.lines.every((l) => Number.isFinite(l.t) && str(l.say))) at('needs problem and >= 3 lines of { t (seconds), say }');
      else if (b.lines.some((l, i) => i && l.t < b.lines[i - 1].t)) at('line times must not go backwards');
      else if (b.lines.some((l) => l.say.split(/\s+/).length > 40)) at('a think-aloud line is a thought, not a paragraph (max 40 words)');
      break;
    // transfer: near (same type, new surface), far (same structure elsewhere), then the principle that carried over
    case 'transfer':
      if (!['near', 'far', 'principle'].every((k) => b[k] && (typeof b[k].make === 'function' || validateQuestion(b[k]).length === 0))) at('needs near, far and principle questions');
      else if (b.principle.type && b.principle.type !== 'choice') at('principle must be a choice question');
      break;
    // variation theory: one feature of a base problem changes per row; predict the effect, then reveal it
    case 'variation':
      if (!str(b.base) || !Array.isArray(b.rows) || b.rows.length < 2 || !b.rows.every((r) => str(r.change) && str(r.effect))) at('needs base and >= 2 rows of { change, effect }');
      break;
    default: break;
  }
  return e;
}

// 1-3 questions; data questions validate now, generator questions are validated by the tests over seeds.
function checkList(qs, where) {
  if (!Array.isArray(qs) || qs.length < 1 || qs.length > 3) return [`${where}checks: 1 to 3 questions`];
  return qs.flatMap((q) => (typeof q?.make === 'function' ? [] : validateQuestion(q).map((m) => `${where}${m}`)));
}

// Unit rule constants (see cadence below).
export const UNIT_EXEMPT = ['why', 'rule'];
export const UNIT_TEACHING = ['text', 'diagram', 'callout', 'formula', 'list', 'compare', 'thinkaloud', 'traps'];
export const CLOSERS = ['check', 'steps', 'erroneous', 'recognize', 'transfer'];
const UNIT_MAX = 3;

// The unit rule: a question after every small piece of teaching.
// A unit is one idea: consecutive teaching blocks with at most one block of each type (a
// text plus the diagram, formula, callout, list or table that explains it) and at most 3
// blocks. A second block of a type already in the open unit starts a new unit. Each unit
// must be closed by a question block (CLOSERS) before the next unit starts or its section
// ends. Other blocks (challenge, explain, predict, worked, variation, tryit) neither open
// nor close a unit. Exception: the last unit of a "why" or "rule" section needs no check.
// Returns [{ section, at, unit, reason }] with block indexes into L.blocks.
export function cadence(L) {
  const out = [];
  let section = null, unit = [];
  const fail = (reason, next) => out.push({ section: section?.key ?? null, at: next, unit: unit.map((u) => u.i), reason });
  const end = () => { if (unit.length && !UNIT_EXEMPT.includes(section?.key)) fail('unit ends its section without a check', null); unit = []; };
  (L.blocks || []).forEach((b, i) => {
    if (b.type === 'section') { end(); section = b; return; }
    if (CLOSERS.includes(b.type)) { unit = []; return; }
    if (!UNIT_TEACHING.includes(b.type)) return;
    if (unit.length && (unit.length >= UNIT_MAX || unit.some((u) => u.type === b.type))) {
      fail(`new ${b.type} starts before the unit above is checked`, i);
      unit = [];
    }
    unit.push({ i, type: b.type });
  });
  end();
  return out;
}

// Every teaching section must end its unit with checks: a check block, or steps whose
// every step carries checks.
function sectionChecks(L) {
  const e = [];
  let cur = null, units = [];
  const flush = () => {
    if (!cur || CHECK_EXEMPT.includes(cur.key)) return;
    const hasCheck = units.some((b) => b.type === 'check') || units.some((b) => b.type === 'steps' && b.steps.every((s) => s.checks?.length));
    if (!hasCheck) e.push(`${L.id}: section "${cur.key}" needs micro-check questions`);
    // Smallest-unit rule: at most 3 teaching blocks in a row before the learner answers something.
    let run = 0;
    for (const b of units) {
      if (b.type === 'check' || b.type === 'steps') run = 0;
      else if (TEACHING.includes(b.type) && ++run > 3) { e.push(`${L.id}: section "${cur.key}" teaches 4+ blocks in a row without a check (check after every smallest unit)`); break; }
    }
    const stepsBlocks = units.filter((b) => b.type === 'steps');
    stepsBlocks.forEach((b) => b.steps.forEach((s, i) => { if (!s.checks?.length) e.push(`${L.id}: step ${i + 1} in "${cur.key}" needs 1-3 checks`); }));
  };
  for (const b of L.blocks) { if (b.type === 'section') { flush(); cur = b; units = []; } else units.push(b); }
  flush();
  return e;
}

// Teaching-skill requirements for family and game lessons (see the lesson template in the plan).
function pedagogy(L) {
  const e = [];
  const inSection = (key) => { const out = []; let on = false; for (const b of L.blocks) { if (b.type === 'section') on = b.key === key; else if (on) out.push(b); } return out; };
  if (!Array.isArray(L.objectives) || L.objectives.length < 2) e.push(`${L.id}: needs >= 2 objectives (goal setting)`);
  if (!inSection('recognise').some((b) => b.type === 'challenge')) e.push(`${L.id}: recognise needs a challenge (productive failure before teaching)`);
  if (!['derivation', 'rule'].some((k) => inSection(k).some((b) => b.type === 'explain'))) e.push(`${L.id}: needs an explain block in derivation or rule (self-explanation)`);
  if (!inSection('traps').some((b) => b.type === 'erroneous')) e.push(`${L.id}: traps need an erroneous example (find the error)`);
  if (!inSection('contrast').some((b) => b.type === 'callout' && b.tone === 'transfer')) e.push(`${L.id}: contrast needs a transfer callout`);
  const variation = inSection('contrast').find((b) => b.type === 'variation');
  if (!variation) e.push(`${L.id}: contrast needs a variation block (change one feature at a time)`);
  else if (!variation.rows.some((r) => r.same) || !variation.rows.some((r) => r.fusion)) e.push(`${L.id}: variation needs a row that changes nothing (same: true) and a row that changes two things at once (fusion: true)`);
  const think = ['worked', 'speed'].flatMap((k) => inSection(k)).find((b) => b.type === 'thinkaloud');
  if (!think) e.push(`${L.id}: needs a thinkaloud in worked or speed (an expert solving it at exam pace)`);
  else if (!think.lines.some((l, i) => l.slip && i < think.lines.length - 1)) e.push(`${L.id}: thinkaloud needs a wrong turn (slip: true) followed by the recovery`);
  if (!inSection('contrast').some((b) => b.type === 'transfer')) e.push(`${L.id}: contrast needs a transfer block (near, far, principle)`);
  const challenge = inSection('recognise').find((b) => b.type === 'challenge');
  if (challenge && !(challenge.attempts?.length >= 2)) e.push(`${L.id}: challenge needs >= 2 typical first attempts (attempts)`);
  else if (challenge) {
    const answered = L.blocks.filter((b) => b.type === 'steps').flatMap((b) => b.steps.map((st) => st.answers).filter(Boolean));
    for (const a of challenge.attempts) { const n = answered.filter((x) => x === a.id).length; if (n !== 1) e.push(`${L.id}: attempt "${a.id}" must be answered by exactly one step (answers: '${a.id}'), found ${n}`); }
  }
  if (L.kind === 'family' && !(L.blocks.find((b) => b.type === 'worked')?.explainAt?.length)) e.push(`${L.id}: first worked example needs explainAt (1-2 steps the learner explains)`);
  if (L.kind === 'family') {
    const worked = L.blocks.filter((b) => b.type === 'worked');
    if (!(worked[1]?.fade >= 1)) e.push(`${L.id}: second worked example must be faded (fade >= 1)`);
  }
  const allQs = L.blocks.flatMap((b) => (b.type === 'check' ? b.questions : b.type === 'steps' ? b.steps.flatMap((s) => s.checks || []) : []));
  const hinge = allQs.some((q) => q.type === 'choice' && q.traps && q.options.every((_, i) => i === q.answer || q.traps[i]));
  if (!hinge && !allQs.some((q) => typeof q.make === 'function' && q.hinge)) e.push(`${L.id}: needs a hinge question (a choice check whose every wrong option names its false belief)`);
  return e;
}

export function validateLesson(L) {
  const e = [];
  if (!str(L?.id) || !/^[a-z]+\/[a-z0-9-]+$/.test(L.id)) e.push(`bad id ${L?.id}`);
  if (!str(L?.book)) e.push('book missing');
  if (!KINDS.includes(L?.kind)) e.push(`kind ${L?.kind} invalid`);
  if (!str(L?.title) || !str(L?.summary)) e.push('title and summary required');
  if (!Array.isArray(L?.blocks) || !L.blocks.length) return [...e, 'blocks missing'];
  L.blocks.forEach((b, i) => e.push(...validateBlock(b, `${L.id} block ${i} `)));
  const keys = L.blocks.filter((b) => b.type === 'section').map((b) => b.key);
  e.push(...sectionChecks(L));
  const count = (t) => L.blocks.filter((b) => b.type === t).length;
  if (L.kind === 'family' || L.kind === 'game') {
    if (JSON.stringify(keys) !== JSON.stringify(FAMILY_SECTIONS)) e.push(`${L.id}: sections must be ${FAMILY_SECTIONS.join(' > ')}, got ${keys.join(' > ')}`);
    if (count('diagram') < 3) e.push(`${L.id}: needs at least 3 diagrams (has ${count('diagram')})`);
    if (L.kind === 'family') {
      if (!str(L.family)) e.push(`${L.id}: family lesson needs family`);
      if (count('worked') < 2) e.push(`${L.id}: needs 2 worked examples`);
      if (!L.blocks.some((b) => b.type === 'tryit' && b.family === L.family)) e.push(`${L.id}: tryit must use its own family`);
      if (!L.blocks.some((b) => b.type === 'traps')) e.push(`${L.id}: needs traps`);
    } else {
      if (!str(L.game)) e.push(`${L.id}: game lesson needs game`);
      if (!L.blocks.some((b) => b.type === 'tryit' && b.game === L.game)) e.push(`${L.id}: tryit must open its game`);
    }
    if (count('predict') < 1) e.push(`${L.id}: needs a predict`);
    e.push(...pedagogy(L));
  } else {
    if (count('diagram') < 1) e.push(`${L.id}: needs a diagram`);
    if (count('predict') < 1) e.push(`${L.id}: needs a predict`);
    if (!L.blocks.some((b) => b.type === 'callout' && b.tone === 'rule')) e.push(`${L.id}: needs a rule callout`);
    if (L.kind === 'foundation' && !L.blocks.some((b) => (b.type === 'check' && b.mastery && b.questions.length === 3) || b.type === 'tryit')) e.push(`${L.id}: foundation lesson needs a mastery check (3 questions, mastery: true) or a tryit`);
  }
  return e;
}

// Book: { id, title, blurb, chapters: [{ title, lessons: [lesson] }], tree: {diagram:'flow', spec}, drill?: [...] }
export function validateBook(B) {
  const e = [];
  if (!str(B?.id) || !str(B?.title) || !str(B?.blurb)) e.push('book needs id, title, blurb');
  if (!Array.isArray(B?.chapters) || !B.chapters.length) e.push(`${B?.id}: chapters missing`);
  else B.chapters.forEach((c, i) => { if (!str(c.title) || !Array.isArray(c.lessons)) e.push(`${B.id} chapter ${i} invalid`); });
  if (!B?.tree || B.tree.diagram !== 'flow') e.push(`${B?.id}: needs a flow recognition tree`);
  return e;
}

export const lessonsOf = (book) => book.chapters.flatMap((c) => c.lessons);
export const wordCount = (L) => L.blocks.reduce((n, b) => {
  const texts = [b.text, b.question, b.answer, b.title, ...(b.items || []), ...(b.steps || []).flatMap((s) => [s.say, s.why])].filter((x) => typeof x === 'string');
  return n + texts.join(' ').split(/\s+/).filter(Boolean).length;
}, 0);
