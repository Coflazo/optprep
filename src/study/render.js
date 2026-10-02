// Lesson renderer. Blocks are data; this turns them into DOM. Text goes through the
// inline markup (text nodes only). Diagrams come from the study registry. Worked
// examples and try-it questions come live from the verified generators.
import { CLOSERS } from './schema.js';
import { h } from '../ui/dom.js';
import { renderInline } from './markup.js';
import { renderDiagram } from './diagrams/index.js';
import { resolveQuestion as resolveRaw, gradeCheck, arrangeChoice } from './check.js';
// Every rendered question is resolved (generators run) and its choice options arranged fairly.
const resolveQuestion = (spec, rng) => arrangeChoice(resolveRaw(spec, rng), rng.fork('arrange'));
import { SECTION_MODULES } from '../sections/index.js';
import { makeRng } from '../core/rng.js';
import { itemBody, runFeedbackSession } from '../ui/runner.js';
import { solutionPanel } from '../ui/solution.js';
import { recordTry, markRead, recordReflection, statusOf, recordUnit, studyState, scaffoldsOff, logEvent, recordMiss } from './progress.js';
import { LESSON_BY_ID } from './content/index.js';
import { checkItem } from '../core/check.js';
import { nextSpiral, spiralQuestion } from './spiral.js';

const T = (s) => renderInline(s, h);
const TONE_LABEL = { idea: 'Idea', trap: 'Trap', speed: 'Speed', rule: 'Rule', contrast: 'Contrast', edge: 'Edge case', transfer: 'Same idea elsewhere' };

export function familyOf(sectionId, familyId) {
  for (const [sid, mod] of Object.entries(SECTION_MODULES)) {
    if (sectionId && sid !== sectionId) continue;
    const f = mod.families.find((x) => x.id === familyId);
    if (f) return { section: sid, family: f };
  }
  return null;
}

// ctx: { lesson, store, rng }  — functions in blocks receive ctx
const val = (x, ctx) => (typeof x === 'function' ? x(ctx) : x);

export function renderBlock(b, ctx) {
  switch (b.type) {
    case 'section': return h('h2', { id: `s-${b.key}`, class: 'study-section' }, b.title);
    case 'text': return h('p', {}, T(val(b.text, ctx)));
    case 'formula': return h('div', { class: 'formula' }, T(val(b.text, ctx)));
    case 'list': return h('ul', { class: 'study-list' }, b.items.map((i) => h('li', {}, T(val(i, ctx)))));
    case 'callout': return h('div', { class: `callout callout-${b.tone}` }, h('div', { class: 'callout-label' }, b.title || TONE_LABEL[b.tone]), h('div', {}, T(val(b.text, ctx))));
    case 'diagram': return diagramBlock(b, ctx);
    case 'compare': return h('div', { class: 'compare' }, h('table', {}, h('thead', {}, h('tr', {}, b.columns.map((c) => h('th', {}, T(c))))), h('tbody', {}, b.rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, T(c))))))));
    case 'steps': return stepsBlock(b, ctx);
    case 'predict': return predictBlock(b);
    case 'check': return b.mastery ? masteryBlock(b, ctx) : checkBlock(b.questions, ctx, b.scope);
    case 'worked': return workedBlock(b, ctx);
    case 'traps': return trapsBlock(b, ctx);
    case 'tryit': return tryBlock(b, ctx);
    case 'recognize': return recognizeBlock(b, ctx);
    case 'challenge': return challengeBlock(b, ctx);
    case 'explain': return explainBlock(b);
    case 'erroneous': return erroneousBlock(b);
    case 'thinkaloud': return thinkAloudBlock(b);
    case 'variation': return variationBlock(b);
    case 'transfer': return h('div', { class: 'study-transfer' }, h('h3', { class: 'block-title' }, 'Transfer: same type in a new setting, then the same idea somewhere else'), checkBlock([b.near, b.far, b.principle], ctx, 'the principle of this lesson, in new settings', null, 'transfer: near, far, principle'));
    default: return h('p', { class: 'muted' }, `Unknown block ${b.type}`);
  }
}

function diagramBlock(b, ctx) {
  let el;
  try { el = renderDiagram(b.diagram, val(b.spec, ctx)); } catch (e) { el = h('p', { class: 'muted' }, `Diagram unavailable: ${e.message}`); }
  return h('figure', { class: 'study-figure' }, el, b.caption ? h('figcaption', {}, T(val(b.caption, ctx))) : null);
}

export const moveUnit = (i, st) => `move ${i + 1}: ${st.say.split(/\s+/).slice(0, 7).join(' ')}…`;

// Derivation: one move at a time. A move's micro-checks must be answered before the next move opens.
function stepsBlock(b, ctx) {
  const list = h('ol', { class: 'steps study-steps' });
  let shown = 0;
  const next = h('button', { class: 'btn small', type: 'button', onclick: () => advance() }, 'Next move');
  const all = h('button', { class: 'btn small', type: 'button', 'data-print-expand': '', onclick: () => { while (shown < b.steps.length) addStep(true); sync(); } }, 'Show all');
  const hint = h('span', { class: 'muted small-note' });
  let pending = 0;
  function addStep(skipChecks = false) {
    const st = b.steps[shown];
    const li = h('li', {}, h('span', { class: 'n' }, String(shown + 1)), h('div', {}, T(st.say)), h('div', { class: 'why' }, T(st.why)));
    if (st.answers) {
      const note = h('div', { class: 'attempt-note', hidden: true });
      const show = (a) => { if (a.id === st.answers) { note.replaceChildren(h('strong', {}, `This is where "${a.label}" breaks. `), T(a.breaksAt)); note.hidden = false; } };
      (ctx.attemptNotes ||= []).push(show);
      if (ctx.attempt) show(ctx.attempt);
      li.append(note);
    }
    if (st.checks?.length && !skipChecks) {
      pending += 1;
      li.append(checkBlock(st.checks, ctx, null, () => { pending -= 1; sync(); }, moveUnit(shown, st)));
    } else if (st.checks?.length) li.append(checkBlock(st.checks, ctx, null, null, moveUnit(shown, st)));
    list.append(li);
    shown += 1;
  }
  function advance() { if (pending > 0 || shown >= b.steps.length) return; addStep(); sync(); }
  if (ctx.faded) { while (shown < b.steps.length) addStep(true); }
  function sync() {
    const done = shown >= b.steps.length;
    next.hidden = done; all.hidden = done;
    next.disabled = pending > 0;
    hint.textContent = pending > 0 ? 'Answer the check above to open the next move.' : '';
  }
  addStep(); sync();
  return h('div', { class: 'study-derivation' }, list, h('div', { class: 'row' }, next, all, hint));
}

function predictBlock(b) {
  const input = h('input', { type: 'text', placeholder: 'Your prediction', 'aria-label': 'Your prediction', class: 'study-input' });
  const ans = h('div', { class: 'feedback', hidden: true }, h('strong', {}, 'Answer. '), T(b.answer), b.explain ? h('div', { class: 'muted' }, T(b.explain)) : null);
  const btn = h('button', { class: 'btn', type: 'button', onclick: () => {
    if (!input.value.trim()) { input.focus(); input.placeholder = 'Commit to a guess first'; return; }
    ans.hidden = false; btn.disabled = true;
  } }, 'Reveal');
  return h('div', { class: 'study-predict' }, h('p', {}, h('strong', {}, 'Predict. '), T(b.question)), h('div', { class: 'row' }, input, btn), ans);
}

// 1-3 micro-check questions. onDone fires once every question has been answered.
export function checkBlock(questions, ctx, scope, onDone, unit = scope) {
  const rng = ctx.rng.fork(`check:${Math.floor(ctx.rng.next() * 1e9)}`);
  // The question leads; what it draws on sits under it as a footnote, not a label above it.
  const box = h('div', { class: 'study-check', role: 'group', 'aria-label': `Check: ${questions.length} question${questions.length > 1 ? 's' : ''}` });
  let open = questions.length, clean = 0, unitClean = true;
  const finished = (first) => {
    clean += first.clean ? 1 : 0; unitClean &&= first.clean; open -= 1;
    ctx.onCheck?.(first);
    box.dispatchEvent(new CustomEvent('study:answered', { bubbles: true }));
    if (ctx.lesson?.id && ctx.store && !ctx.noTrack) {
      logEvent(ctx.store, { kind: 'check', lesson: ctx.lesson.id, unit, clean: first.clean, hints: first.hints });
      if (first.trap) recordMiss(ctx.store, { belief: first.trap, lesson: ctx.lesson.id, unit });
    }
    if (open === 0) { if (ctx.lesson?.id && !ctx.noTrack) recordUnit(ctx.store, ctx.lesson.id, unit, unitClean); onDone?.({ n: questions.length, clean }); spiralAfter(box, questions, ctx, unitClean); }
  };
  questions.forEach((spec, qi) => box.append(questionView(resolveQuestion(spec, rng.fork(`q${qi}`)), finished, { spec, rng: rng.fork(`again${qi}`), noHints: ctx.noHints })));
  if (scope) box.append(h('p', { class: 'check-label' }, `Uses only: ${scope}.`));
  return box;
}

// Quick recall: after a lesson check, maybe re-ask one earlier check (the choice is spiral.js).
function spiralAfter(box, questions, ctx, clean) {
  const blocks = ctx.lesson?.blocks || [], block = blocks.findIndex((b) => b.questions === questions);
  if (ctx.noTrack || block < 0 || blocks[block].mastery) return;
  const log = (ctx.spiralLog ||= []);
  log.push({ block, clean });
  const pick = nextSpiral(blocks, log);
  if (pick == null) return;
  const spec = blocks[pick].questions[spiralQuestion(blocks[pick].questions)], rng = ctx.rng.fork(`spiral${log.length}`);
  box.after(h('div', { class: 'study-check study-spiral' }, h('p', { class: 'small-note' }, h('strong', {}, 'Quick recall')),
    questionView(resolveQuestion(spec, rng), (first) => log.push({ block: pick, clean: first.clean, spiral: true }), { spec, rng: rng.fork('again'), noHints: ctx.noHints })));
}

// Mastery check for lessons without a question family (foundations): fresh generated
// questions; all right at the first attempt without hints marks the lesson mastered.
function masteryBlock(b, ctx) {
  const box = h('div', {});
  const status = h('p', { class: 'muted' }, `${b.questions.length} fresh questions. All right at the first attempt, without hints, masters the lesson.`);
  const again = h('button', { class: 'btn', type: 'button', hidden: true, onclick: () => run() }, 'Three new questions');
  const run = () => {
    again.hidden = true;
    box.replaceChildren(checkBlock(b.questions, ctx, b.scope, (r) => {
      const pass = recordTry(ctx.store, ctx.lesson.id, r);
      status.replaceChildren(h('span', { class: `badge ${pass ? 'ok' : 'no'}` }, pass ? 'Mastered' : 'Not yet'), ` ${r.clean} of ${r.n} right first time without hints. `, pass ? 'This lesson will come back for review.' : 'Re-read the unit behind the miss, then try new ones.');
      again.hidden = false;
      ctx.onProgress?.();
    }));
  };
  run();
  return h('div', { class: 'study-try' }, status, box, again);
}

function questionView(q, onAnswered, { spec, rng, noHints = false } = {}) {
  let tries = 0;
  const again = h('div', {});
  const offerAnother = (res) => {
    if (res.correct || typeof spec?.make !== 'function' || again.querySelector('button')) return;
    const btn = h('button', { class: 'btn small', type: 'button', onclick: () => {
      btn.remove(); tries += 1;
      again.append(h('div', { class: 'check-again' }, questionView(resolveQuestion(spec, rng.fork(`t${tries}`)), null, { spec, rng: rng.fork(`n${tries}`) })));
    } }, 'Try another like this');
    again.append(btn);
  };
  const fb = h('div', { class: 'check-feedback' });
  let attempts = 0, revealed = false, firstResult = null;
  // Repair loop: a wrong first attempt names the false belief (when known) but keeps the
  // answer hidden, so the learner locates the error and tries once more before being told.
  const reveal = (res) => {
    revealed = true;
    control?.querySelectorAll?.('button, input').forEach((x) => { if (!x.classList.contains('is-picked')) x.disabled = true; });
    fb.replaceChildren(h('div', { class: `feedback ${res.correct ? 'ok' : 'no'}` },
      h('strong', {}, res.correct ? (attempts > 1 ? 'Right on the second try. ' : 'Right. ') : 'Not quite. '),
      res.trap ? h('span', {}, 'That answer comes from: ', h('em', {}, T(res.trap)), '. ') : null,
      !res.correct ? h('span', {}, 'Answer: ', T(answerText(q)), '. ') : null,
      res.score != null ? h('span', {}, `Score ${res.score.toFixed(2)}. `) : null,
      h('div', { class: 'muted' }, T(q.explain))));
    offerAnother(res);
  };
  const done = (res, response) => {
    if (revealed) return;
    attempts += 1;
    if (attempts === 1) { firstResult = { clean: res.correct && used === 0, trap: res.trap, hints: used }; onAnswered?.(firstResult); }
    if (!res.correct && attempts === 1) {
      if (q.type === 'choice' && Number.isInteger(response)) control.querySelectorAll('button')[response].disabled = true;
      fb.replaceChildren(h('div', { class: 'feedback no' }, h('strong', {}, 'Not yet. '),
        res.trap ? h('span', {}, 'That answer comes from: ', h('em', {}, T(res.trap)), '. Where does your reasoning use that? ') : 'Find the exact step where your working leaves the unit above. ',
        'One more try, or ', h('button', { class: 'linkish', type: 'button', onclick: () => reveal({ ...res, correct: false }) }, 'show the answer'), '.'));
      return;
    }
    reveal(res);
  };
  let control;
  if (q.type === 'choice') {
    control = h('div', { class: 'check-options' }, q.options.map((o, i) => h('button', { class: 'btn small check-option', type: 'button', onclick: (e) => {
      control.querySelectorAll('button').forEach((b) => b.classList.remove('is-picked'));
      e.currentTarget.classList.add('is-picked');
      done(gradeCheck(q, i), i);
    } }, T(String(o)))));
  } else if (q.type === 'number') {
    const inp = h('input', { type: 'text', inputmode: 'decimal', class: 'study-input', 'aria-label': 'Your answer', placeholder: q.unit ? `answer (${q.unit})` : 'answer' });
    control = h('div', { class: 'row' }, inp, h('button', { class: 'btn small primary', type: 'button', onclick: () => { if (inp.value.trim()) done(gradeCheck(q, inp.value)); } }, 'Check'));
  } else if (q.type === 'interval') {
    const lo = h('input', { type: 'number', step: 'any', class: 'study-input', 'aria-label': 'Lower', placeholder: 'lower' });
    const hi = h('input', { type: 'number', step: 'any', class: 'study-input', 'aria-label': 'Upper', placeholder: 'upper' });
    control = h('div', { class: 'row' }, lo, hi, h('button', { class: 'btn small primary', type: 'button', onclick: () => done(gradeCheck(q, { lower: parseFloat(lo.value), upper: parseFloat(hi.value) })) }, 'Check'));
  } else {
    let order = q.items.map((_, i) => i);
    const list = h('ol', { class: 'check-order' });
    const draw = () => list.replaceChildren(...order.map((it, pos) => h('li', {}, T(q.items[it]), ' ',
      h('button', { class: 'btn small', type: 'button', disabled: pos === 0, onclick: () => { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; draw(); } }, 'Up'))));
    draw();
    control = h('div', {}, list, h('button', { class: 'btn small', type: 'button', onclick: () => done(gradeCheck(q, order)) }, 'Check order'));
  }
  // Progressive hint ladder: one hint at a time, each only after trying without it.
  let used = 0;
  const hintBox = h('div', {});
  const hintBtn = q.hints?.length && !noHints ? h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (used >= q.hints.length) return;
    hintBox.append(h('div', { class: 'feedback' }, h('strong', {}, `Hint ${used + 1}. `), T(q.hints[used])));
    used += 1;
    hintBtn.textContent = used >= q.hints.length ? 'No more hints' : `Next hint (${used}/${q.hints.length})`;
    hintBtn.disabled = used >= q.hints.length;
  } }, `Stuck? Hint (0/${q.hints.length})`) : null;
  // The hint sits beside Check on the same row, so the step reads as one action plus a way out.
  if (hintBtn && control.classList.contains('row')) { hintBtn.classList.add('ghost'); control.append(hintBtn); }
  return h('div', { class: 'check-q' }, h('p', {}, T(q.q)), control, control.contains(hintBtn) ? null : hintBtn, hintBox, fb, again);
}

// Productive failure: two attempted approaches and an answer before any teaching.
function challengeBlock(b, ctx) {
  const a1 = h('textarea', { class: 'study-text', rows: 2, placeholder: 'Approach 1: how would you attack it?', 'aria-label': 'Approach 1' });
  const a2 = h('textarea', { class: 'study-text', rows: 2, placeholder: 'Approach 2: a different way in', 'aria-label': 'Approach 2' });
  const ans = h('input', { type: 'text', class: 'study-input', placeholder: 'Your answer', 'aria-label': 'Your answer' });
  const picked = h('div', {});
  const attempts = b.attempts?.length ? h('div', {}, h('p', { class: 'small-note' }, 'Which of these is closest to what you tried?'),
    h('div', { class: 'check-options' }, [...b.attempts.map((a) => h('button', { class: 'btn small check-option', type: 'button', onclick: (e) => {
      e.currentTarget.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('is-picked', x === e.currentTarget));
      picked.replaceChildren(h('div', { class: 'feedback' }, h('strong', {}, `${a.label}: `), T(a.approach), h('div', { class: 'muted' }, 'Where it breaks: ', T(a.breaksAt)), h('div', { class: 'small-note muted' }, 'The derivation below marks the exact step that fixes this.')));
      ctx.pickAttempt?.(a);
    } }, T(a.label))), h('button', { class: 'btn small check-option', type: 'button', onclick: (e) => {
      e.currentTarget.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('is-picked', x === e.currentTarget));
      picked.replaceChildren(h('p', { class: 'small-note muted' }, 'Something else. Keep your attempt in mind and find the step where it and the derivation part ways.'));
    } }, 'None of these')]), picked) : null;
  const out = h('div', { hidden: true }, h('div', { class: 'feedback' }, h('strong', {}, 'Answer: '), T(b.answer), h('div', { class: 'muted' }, T(b.explain))), attempts);
  const btn = h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (!a1.value.trim() || !a2.value.trim() || !ans.value.trim()) { btn.textContent = 'Write both approaches and an answer first'; return; }
    out.hidden = false; btn.hidden = true;
  } }, 'Compare with the answer');
  return h('div', { class: 'study-challenge' }, h('h3', { class: 'block-title' }, 'Challenge: before any teaching'),
    h('p', {}, T(b.q)), h('p', { class: 'muted small-note' }, 'Struggling here is the point: the lesson builds on what you try. Two genuinely different approaches, then an answer.'), a1, a2, h('div', { class: 'row' }, ans, btn), out);
}

// Self-explanation / teach-back: write it in your own words, then tick the key points you covered.
function explainBlock(b) {
  const ta = h('textarea', { class: 'study-text', rows: 3, placeholder: 'Explain it as if to a friend who missed the lesson', 'aria-label': 'Your explanation' });
  const res = h('div', { hidden: true });
  const btn = h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (ta.value.trim().split(/\s+/).length < 5) { ta.placeholder = 'A sentence or two, in your own words, first'; ta.focus(); return; }
    res.hidden = false; btn.hidden = true;
  } }, 'Compare with the model');
  res.append(h('div', { class: 'feedback' }, h('strong', {}, 'Model: '), T(b.model)),
    h('p', { class: 'small-note' }, 'Tick the key points your explanation covered. Any unticked point is the link to re-read.'),
    h('ul', { class: 'plain' }, b.points.map((pt) => h('li', {}, h('label', {}, h('input', { type: 'checkbox' }), ' ', T(pt))))));
  return h('div', { class: 'study-explain' }, h('h3', { class: 'block-title' }, 'Explain it'), h('p', {}, T(b.prompt)), ta, btn, res);
}

// Erroneous example: a flawed solution; find the step where the reasoning breaks.
function erroneousBlock(b) {
  const fb = h('div', {});
  const list = h('ol', { class: 'steps' }, b.steps.map((st, i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)),
    h('button', { class: 'linkish step-pick', type: 'button', onclick: () => {
      const right = i === b.errorStep;
      list.children[i].classList.add(right ? 'is-correct' : 'is-wrong');
      if (right) list.children[i].classList.add('broken');
      fb.replaceChildren(h('div', { class: `feedback ${right ? 'ok' : 'no'}` }, h('strong', {}, right ? 'Found it. ' : 'That step is fine. '), right ? T(b.explain) : 'Look for the first move that does not follow.'));
    } }, T(typeof st === 'string' ? st : st.say)))));
  return h('div', { class: 'study-erroneous' }, h('h3', { class: 'block-title' }, 'Find the error'), h('p', {}, T(b.problem)), h('p', { class: 'muted small-note' }, 'One step is wrong. Click it.'), list, fb);
}

// Think-aloud: an expert's inner voice with timestamps. "Play at exam pace" reveals each
// thought at the second it happens, so the learner feels how fast the method runs.
function thinkAloudBlock(b) {
  const list = h('ol', { class: 'think-lines' }, b.lines.map((l) => h('li', { hidden: true }, h('span', { class: 'think-t num' }, `${l.t} s`), h('span', {}, T(l.say)))));
  const items = [...list.children];
  let timers = [];
  const showAll = () => { timers.forEach(clearTimeout); timers = []; items.forEach((li) => { li.hidden = false; }); play.disabled = true; all.hidden = true; };
  const play = h('button', { class: 'btn small primary', type: 'button', onclick: () => {
    play.disabled = true;
    b.lines.forEach((l, i) => timers.push(setTimeout(() => { items[i].hidden = false; if (i === items.length - 1) all.hidden = true; }, l.t * 1000)));
  } }, `Play at exam pace (${b.lines[b.lines.length - 1].t} s)`);
  const all = h('button', { class: 'btn small', type: 'button', 'data-print-expand': '', onclick: showAll }, 'Show all');
  return h('div', { class: 'study-think' }, h('h3', { class: 'block-title' }, 'Think-aloud: how an expert reads and solves it'), h('p', { class: 'prompt-small' }, T(b.problem)), h('div', { class: 'row' }, play, all), list);
}

// Variation: one feature of the base problem changes per row. Predict, then reveal.
function variationBlock(b) {
  return h('div', { class: 'study-variation' }, h('h3', { class: 'block-title' }, 'Change one thing: predict what happens'), h('p', {}, T(b.base)),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'What changes'), h('th', {}, 'Effect'))), h('tbody', {}, b.rows.map((r) => {
      const cell = h('td', {});
      const btn = h('button', { class: 'btn small', type: 'button', 'data-print-expand': '', onclick: () => cell.replaceChildren(T(r.effect)) }, 'Predict, then reveal');
      cell.append(btn);
      return h('tr', {}, h('td', {}, T(r.change)), cell);
    }))));
}

function answerText(q) {
  if (q.type === 'choice') return String(q.options[q.answer]);
  if (q.type === 'order') return q.answer.map((i) => q.items[i]).join(' > ');
  return String(q.answer);
}

// A live example from the family generator: try it first, then open the full solution.
function workedBlock(b, ctx) {
  const f = familyOf(b.section, b.family);
  if (!f) return h('p', { class: 'muted' }, `Unknown family ${b.family}`);
  const item = f.family.generate(makeRng(`study:${ctx.lesson.id}:${b.family}:${b.seed ?? b.difficulty}`), { difficulty: b.difficulty });
  const body = itemBody(item, { preview: false });
  body.view.lock?.();
  const sol = h('div', { hidden: true });
  const btn = h('button', { class: 'btn', type: 'button', onclick: () => {
    body.view.reveal?.({ correct: true, score: 1 }, null);
    sol.replaceChildren(item.solution?.steps?.length ? stepwiseSolution(item, b.explainAt || []) : solutionPanel(item, { stepwise: false }));
    if (b.diagram) { try { const d = b.diagram(item); sol.prepend(diagramBlock({ diagram: d.diagram, spec: d.spec, caption: d.caption }, ctx)); } catch { /* optional */ } }
    sol.hidden = false; btn.hidden = true;
  } }, 'I have tried it: show the solution');
  if (b.fade >= 1) return fadedWorked(b, item, ctx);
  return h('div', { class: 'study-worked' }, h('h3', { class: 'block-title' }, `Worked example · difficulty ${item.difficulty}`), b.intro ? h('p', {}, T(b.intro)) : null, body.el, btn, sol);
}

// Self-explaining a worked example: steps appear one at a time; each reason stays hidden
// until the learner has said why (and typed it at the explainAt steps).
function stepwiseSolution(item, explainAt) {
  const steps = item.solution.steps;
  const list = h('ol', { class: 'steps' });
  const end = h('div', {});
  let i = 0;
  const next = h('button', { class: 'btn small primary', type: 'button', onclick: () => add() }, 'Next step');
  function add() {
    const st = steps[i], k = i;
    const why = h('div', { class: 'why', hidden: true }, T(st.why));
    const typed = explainAt.includes(k) ? h('textarea', { class: 'study-text', rows: 2, placeholder: 'Why is this step right? Write it in your own words (a sentence).', 'aria-label': `Explain step ${k + 1}` }) : null;
    const reveal = h('button', { class: 'linkish small-note', type: 'button', onclick: () => {
      if (typed && typed.value.trim().split(/\s+/).length < 5) { reveal.textContent = 'Write at least a short sentence first'; return; }
      why.hidden = false; reveal.remove();
    } }, typed ? 'Compare with the reason' : 'Why this step? Say it to yourself, then reveal');
    list.append(h('li', {}, h('span', { class: 'n' }, String(k + 1)), h('div', {}, T(st.say)), typed, reveal, why));
    i += 1;
    if (i >= steps.length) { next.remove(); if (item.solution.rule) end.append(h('div', { class: 'rule' }, item.solution.rule)); }
  }
  add();
  return h('div', { class: 'solution' }, list, next, end);
}

// Worked-example fading: the first steps are given, the last `fade` steps are yours.
function fadedWorked(b, item, ctx) {
  const steps = item.solution.steps;
  const keep = Math.max(0, steps.length - b.fade);
  const body = itemBody(item, { preview: false });
  const given = h('ol', { class: 'steps' }, steps.slice(0, keep).map((st, i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)), h('div', {}, T(st.say)), h('div', { class: 'why' }, T(st.why)))));
  const rest = h('div', {});
  const btn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    const r = body.view.response();
    if (!r) { btn.textContent = 'Finish the last step and answer first'; return; }
    const res = checkItem(item, r);
    body.view.lock?.(); body.view.reveal?.(res, r);
    rest.replaceChildren(h('div', { class: `feedback ${res.correct ? 'ok' : 'no'}` }, h('strong', {}, res.correct ? 'You finished it. ' : 'Not quite. '), 'The remaining steps:'),
      h('ol', { class: 'steps', start: keep + 1 }, steps.slice(keep).map((st, i) => h('li', {}, h('span', { class: 'n' }, String(keep + i + 1)), h('div', {}, T(st.say)), h('div', { class: 'why' }, T(st.why))))),
      h('div', { class: 'rule' }, item.solution.rule));
    btn.hidden = true;
  } }, 'Check my finish');
  return h('div', { class: 'study-worked' }, h('h3', { class: 'block-title' }, `Worked example, faded · the last ${b.fade} step${b.fade > 1 ? 's are' : ' is'} yours`), b.intro ? h('p', {}, T(b.intro)) : null,
    body.el, h('p', { class: 'small-note muted' }, 'The start of the solution:'), given, btn, rest);
}

// Traps: the named false beliefs behind the family's wrong options, harvested from generated items.
function trapsBlock(b, ctx) {
  const counts = new Map();
  const f = b.family ? familyOf(b.section, b.family) : null;
  if (f) {
    for (let s = 0; s < 60; s++) {
      let it;
      try { it = f.family.generate(makeRng(`traps:${b.family}:${s}`), { difficulty: f.family.levels?.[s % f.family.levels.length] ?? 1 }); } catch { continue; }
      for (const o of it.options || []) if (o.misconception && !/^Magnitude guess/.test(o.misconception)) {
        const key = o.misconception.replace(/\d+(\.\d+)?/g, '#');
        counts.set(key, { text: o.misconception, n: (counts.get(key)?.n || 0) + 1 });
      }
    }
  }
  const harvested = [...counts.values()].sort((a, b2) => b2.n - a.n).slice(0, b.limit ?? 8);
  return h('div', { class: 'study-traps' },
    (b.extra?.length || harvested.length) ? h('ul', { class: 'study-list' },
      ...(b.extra || []).map((t) => h('li', {}, h('strong', {}, T(t.belief)), t.fix ? h('div', { class: 'muted' }, T(t.fix)) : null)),
      ...harvested.map((t) => h('li', {}, T(t.text)))) : h('p', { class: 'muted' }, 'No recurring traps recorded for this family.'),
    harvested.length ? h('p', { class: 'muted small-note' }, `The last ${harvested.length} come from the wrong options of 60 generated questions of this type: each is what you get from one specific wrong belief.`) : null);
}

// Try it: three fresh questions. 3/3 without hints marks the lesson mastered.
function tryBlock(b, ctx) {
  const box = h('div', { class: 'study-try' });
  if (b.game) {
    box.append(h('p', {}, 'Play the game with this strategy. The lesson counts as mastered once an exam run meets the target.'),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: `#/zapn/${b.game}/practice` }, 'Practise the game'), h('a', { class: 'btn', href: `#/zapn/${b.game}/exam` }, 'Exam run')));
    return box;
  }
  const f = familyOf(b.section, b.family);
  if (!f) return h('p', { class: 'muted' }, `Unknown family ${b.family}`);
  const status = h('p', { class: 'muted' }, 'Three fresh questions of this type. Answer all three right without hints to master the lesson; do it inside the exam time per question to earn the exam-pace badge.');
  const secs = (ms) => `${Math.round(ms / 1000)} s`;
  // Two tiers: Mastered (3/3 right first time, no hints) and Exam pace (the same, each inside the exam's time per item).
  const run = (paced) => {
    start.hidden = true; pace.hidden = true;
    const rng = makeRng(`try:${ctx.lesson.id}:${Date.now()}`);
    const levels = f.family.levels?.length ? f.family.levels : [1];
    const items = Array.from({ length: b.count ?? 3 }, (_, i) => f.family.generate(rng.fork(`t${i}`), { difficulty: levels[Math.min(i, levels.length - 1)] }));
    const area = h('div', {});
    box.append(area);
    runFeedbackSession(area, { sectionId: f.section, mode: paced ? 'drill' : 'learn', items, store: ctx.store, title: `${paced ? 'Exam pace' : 'Try it'}: ${f.family.title}`, diagnose: !paced,
      onMiss: (d) => recordMiss(ctx.store, { belief: d.item.options?.[d.response?.choice]?.misconception || d.belief, lesson: ctx.lesson.id, unit: 'try-it', type: d.type }),
      onDone: (r) => {
        const pass = recordTry(ctx.store, ctx.lesson.id, r);
        const onPace = pass && r.ms.every((m) => m <= r.budgetMs);
        const avg = r.ms.reduce((a, m) => a + m, 0) / Math.max(1, r.ms.length);
        status.replaceChildren(h('span', { class: `badge ${pass ? 'ok' : 'no'}` }, pass ? 'Mastered' : 'Not yet'), onPace ? [' ', h('span', { class: 'badge ok' }, 'Exam pace')] : null,
          ` ${r.clean} of ${r.n} right without hints, average ${secs(avg)} against ${secs(r.budgetMs)} per question. `,
          !pass ? 'Find the step you missed, then try three new ones.' : onPace ? 'Right and fast enough: this lesson comes back for review.' : 'Correct, not yet at exam pace: use the speed section, then try at exam pace.');
        start.textContent = 'Three more'; start.hidden = false; pace.hidden = !pass;
        ctx.onProgress?.();
      } });
  };
  const start = h('button', { class: 'btn primary', type: 'button', onclick: () => run(false) }, 'Start: 3 fresh questions');
  const pace = h('button', { class: 'btn', type: 'button', hidden: !(ctx.store && scaffoldsOff(ctx.store, ctx.lesson.id)), onclick: () => run(true) }, 'Try at exam pace (timed)');
  box.append(status, h('div', { class: 'row' }, start, pace));
  return box;
}

// Recognition drill items: { stem, options: [{ label, lesson }], answer } — pick the method first.
function recognizeBlock(b) {
  return h('div', { class: 'study-recognize' }, b.items.map((it) => {
    const fb = h('div', {});
    return h('div', { class: 'check-q' }, h('p', {}, T(it.stem)),
      h('div', { class: 'check-options' }, it.options.map((o, i) => h('button', { class: 'btn small', type: 'button', onclick: () => {
        const right = i === it.answer;
        fb.replaceChildren(h('div', { class: `feedback ${right ? 'ok' : 'no'}` }, h('strong', {}, right ? 'Right method. ' : 'Different method. '), 'This is ', h('a', { href: `#/study/lesson/${it.options[it.answer].lesson}` }, it.options[it.answer].label), '.'));
      } }, o.label))), fb);
  }));
}

// `restore: true` (after a failed review) keeps every scaffold on for this visit.
export function renderLesson(root, lesson, { store, onProgress, restore = false } = {}) {
  const faded = !restore && !!store && scaffoldsOff(store, lesson.id);
  const tally = { answered: 0, clean: 0, total: countQuestions(lesson) };
  const bar = h('span', {}), label = h('span', { class: 'small-note muted num' });
  const paint = () => { bar.style.width = `${Math.round((100 * tally.answered) / Math.max(1, tally.total))}%`; label.textContent = `${tally.answered} of ${tally.total} checks answered · ${tally.clean} right first time`; };
  const ctx = { lesson, store, rng: makeRng(`lesson:${lesson.id}:${Date.now()}`), onProgress, faded, tally,
    onCheck: (first) => { tally.answered += 1; tally.clean += first.clean ? 1 : 0; paint(); },
    pickAttempt: (a) => { ctx.attempt = a; (ctx.attemptNotes || []).forEach((f) => f(a)); } };
  markRead(store, lesson.id);
  paint();
  const toc = h('nav', { class: 'study-toc', 'aria-label': 'Lesson sections' }, lesson.blocks.filter((b) => b.type === 'section').map((b) => h('a', { href: `#s-${b.key}`, onclick: (e) => { e.preventDefault(); root.querySelector(`#s-${b.key}`)?.scrollIntoView({ behavior: 'smooth' }); } }, b.title)));
  const progress = h('div', { class: 'study-progress', role: 'status' }, h('div', { class: 'bar' }, bar), label);
  const plan = planBlock(lesson, store, faded, root, restore);
  if (store?.settings?.().studyFocus === false) {
    const body = h('article', { class: 'study-body' }, warmUp(lesson, ctx), lesson.blocks.map((b) => renderBlock(b, ctx)));
    return h('div', {}, plan, toc, progress, body, reflectBlock(lesson, store, tally));
  }
  return focusLesson(lesson, ctx, { plan, progress, store, tally });
}

// Focus mode: one step on screen at a time. A step is one teaching unit and the check that
// follows it (the cadence rule guarantees one), with its section heading. Continue turns
// primary once the step's questions are answered; it never locks, so nobody gets stuck.
const STEP_QUESTIONS = (b) => (b.type === 'check' ? b.questions.length : b.type === 'steps' ? b.steps.reduce((n, st) => n + (st.checks?.length || 0), 0) : b.type === 'transfer' ? 3 : 0);
function focusLesson(lesson, ctx, { plan, progress, store, tally }) {
  const steps = [];
  let cur = null;
  const open = () => (cur = { els: [], need: 0, section: null, teaches: false });
  open();
  const warm = warmUp(lesson, ctx);
  steps.push({ els: [plan], need: 0, section: null, intro: true });
  if (warm) steps.push({ els: [warm], need: 0, section: null });
  for (const b of lesson.blocks) {
    if (b.type === 'section') {
      if (cur.teaches || cur.need) { steps.push(cur); open(); }
      cur.section = b.key;
    } else cur.teaches = true;
    cur.els.push(renderBlock(b, ctx));
    cur.need += STEP_QUESTIONS(b);
    if (CLOSERS.includes(b.type)) { steps.push(cur); open(); }
  }
  if (cur.els.length) steps.push(cur);
  steps.push({ els: [reflectBlock(lesson, store, tally)], need: 0, section: null, outro: true });

  const answered = steps.map(() => 0);
  const views = steps.map((st, i) => {
    const el = h('section', { class: 'focus-step', hidden: true, 'aria-label': `Step ${i + 1} of ${steps.length}` }, st.els);
    el.addEventListener('study:answered', () => { answered[i] += 1; sync(); });
    return el;
  });
  // Resume where the learner left off (the last section they reached).
  const last = studyState(store)?.[lesson.id]?.lastSection;
  let at = last ? Math.max(0, steps.findIndex((st) => st.section === last)) : 0;
  const count = h('span', { class: 'num focus-count' });
  const back = h('button', { class: 'btn ghost', type: 'button', onclick: () => go(at - 1) }, 'Back');
  const next = h('button', { class: 'btn', type: 'button', onclick: () => go(at + 1) }, 'Continue');
  const hint = h('span', { class: 'small-note muted focus-hint' });
  function sync() {
    const st = steps[at];
    const done = answered[at] >= st.need;
    count.textContent = `Step ${at + 1} of ${steps.length}`;
    back.hidden = at === 0;
    next.hidden = at === steps.length - 1;
    next.textContent = at === 0 ? 'Start the lesson' : done ? 'Continue' : 'Skip ahead';
    next.className = `btn ${done ? 'primary' : 'ghost'}`;
    hint.textContent = done || at === 0 ? '' : `Answer the question${st.need - answered[at] > 1 ? 's' : ''} above to continue.`;
  }
  let go = function go(i) {
    if (i < 0 || i >= steps.length) return;
    views[at].hidden = true;
    at = i;
    views[at].hidden = false;
    sync();
    // Bring the new step to the top and put focus on its first heading or question.
    const target = views[at].querySelector('h2, .study-check, p') || views[at];
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    views[at].scrollIntoView({ block: 'start' });
  }
  views[at].hidden = false;
  sync();
  const bar = h('div', { class: 'focus-bar' }, count, progress);
  const shell = h('div', { class: 'focus-lesson' });
  // The lesson's own next-lesson buttons show only on the last step, so one action leads at a time.
  const syncShell = () => shell.classList.toggle('is-finished', at === steps.length - 1);
  views.forEach((v) => v.addEventListener('focusin', syncShell));
  shell.append(bar, h('article', { class: 'study-body' }, views), h('div', { class: 'row focus-nav' }, back, hint, h('span', { style: { flex: 1 } }), next));
  const go0 = go;
  go = (i) => { go0(i); syncShell(); };
  syncShell();
  return shell;
}

const questionsOf = (b) => (b.type === 'check' ? b.questions : b.type === 'steps' ? b.steps.flatMap((st) => st.checks || []) : []);
const countQuestions = (L) => L.blocks.reduce((n, b) => n + questionsOf(b).length, 0);

// Lesson opener: retrieve before new learning. Up to two generated questions from the
// prerequisite lessons, so the anchor the lesson builds on is warm (and gaps show up now).
function warmUp(lesson, ctx) {
  const pool = (lesson.prerequisites || []).map((id) => LESSON_BY_ID[id]).filter(Boolean)
    .flatMap((L) => L.blocks.filter((b) => b.type === 'check' && !b.mastery).flatMap((b) => b.questions.filter((q) => typeof q.make === 'function').map((q) => ({ q, L }))));
  if (!pool.length) return null;
  const picks = ctx.rng.shuffle(pool).slice(0, 2);
  const wctx = { ...ctx, noTrack: true, onCheck: null };
  return h('section', { class: 'study-warmup' }, h('h3', { class: 'block-title' }, 'Warm-up from earlier lessons: answer from memory first'),
    checkBlock(picks.map((x) => x.q), wctx, `${[...new Set(picks.map((x) => x.L.title))].join('; ')}`),
    h('p', { class: 'small-note muted' }, 'Missed one? Open ', ...[...new Set(picks.map((x) => x.L))].flatMap((L, i) => [i ? ', ' : '', h('a', { href: `#/study/lesson/${L.id}` }, L.title)]), ' before going on.'));
}

// Plan (goal setting + confidence before), shown above the lesson. Brings back last
// visit's if-then plan and weak units, and offers a test-out for people who know the type.
function planBlock(lesson, store, faded, root, restore) {
  const conf = h('div', { class: 'row', role: 'group', 'aria-label': 'Confidence before' }, [1, 2, 3, 4, 5].map((n) => h('button', { class: 'btn small', type: 'button', onclick: (e) => {
    recordReflection(store, lesson.id, { before: n });
    e.currentTarget.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
  } }, String(n))));
  const mine = store ? studyState(store)[lesson.id] || {} : {};
  const ifThen = mine.reflection?.ifThen;
  const weak = Object.entries(mine.units || {}).filter(([, u]) => u.last === false).map(([k]) => k);
  const hasTry = lesson.blocks.some((b) => b.type === 'section' && b.key === 'tryit') || lesson.blocks.some((b) => b.type === 'check' && b.mastery);
  const toTest = () => (root.querySelector('#s-tryit') || root.querySelector('.study-try'))?.scrollIntoView({ behavior: 'smooth' });
  return h('div', { class: 'panel study-plan' },
    lesson.objectives?.length ? h('div', {}, h('h3', { class: 'block-title' }, 'By the end you can'), h('ul', { class: 'study-list' }, lesson.objectives.map((o) => h('li', {}, T(o))))) : null,
    ifThen ? h('div', { class: 'callout callout-rule' }, h('div', { class: 'callout-label' }, 'Your plan from last time'), h('div', {}, `If ${ifThen.if}, then ${ifThen.then}.`)) : null,
    weak.length ? h('div', { class: 'callout callout-trap' }, h('div', { class: 'callout-label' }, 'Missed last time: watch these units'), h('ul', { class: 'study-list' }, weak.map((w) => h('li', {}, w)))) : null,
    h('div', { class: 'small-note' }, 'Before you start: how confident are you with this type? (1 = never seen it, 5 = could teach it)'), conf,
    hasTry && !faded ? h('p', { class: 'small-note' }, 'Already solve this type reliably? ', h('button', { class: 'linkish', type: 'button', onclick: toTest }, 'Test out: go straight to the three questions'), '. All three right first time without hints marks it mastered.') : null,
    restore ? h('div', { class: 'callout callout-edge' }, h('div', { class: 'callout-label' }, 'Scaffolds back on'), h('div', {}, 'Your last review missed something, so every check gates the next step again on this visit.')) : null,
    faded ? h('p', { class: 'small-note muted' }, 'You have mastered this lesson, so the scaffolds are faded: every step is open and no check blocks you. Use the checks as a quick self-test.') : null);
}

// Reflect (monitor → evaluate → plan): confidence after against results, the hardest
// step, and an if-then plan for the next time this type appears (implementation intention).
function reflectBlock(lesson, store, tally) {
  const hard = h('textarea', { class: 'study-text', rows: 2, placeholder: 'Which step was hardest, and why?', 'aria-label': 'Hardest step' });
  const ifIn = h('input', { type: 'text', class: 'study-input wide', placeholder: 'e.g. I see "at least one"', 'aria-label': 'If' });
  const thenIn = h('input', { type: 'text', class: 'study-input wide', placeholder: 'e.g. I compute 1 − P(none) first', 'aria-label': 'Then' });
  const note = h('p', { class: 'small-note muted', role: 'status' });
  const efficacy = h('p', { class: 'small-note' });
  const conf = h('div', { class: 'row', role: 'group', 'aria-label': 'Confidence after' }, [1, 2, 3, 4, 5].map((n) => h('button', { class: 'btn small', type: 'button', onclick: (e) => {
    const ifThen = ifIn.value.trim() && thenIn.value.trim() ? { if: ifIn.value.trim(), then: thenIn.value.trim() } : undefined;
    const r = recordReflection(store, lesson.id, { after: n, hardest: hard.value.trim(), ...(ifThen ? { ifThen } : {}) });
    e.currentTarget.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
    const t = r.lastTry;
    note.textContent = (t ? (n >= 4 && t.clean < t.n ? `You rate yourself ${n}/5 but got ${t.clean}/${t.n} without hints: likely overconfident. Re-read the step you missed.` : n <= 2 && t.clean === t.n ? `You rate yourself ${n}/5 but got ${t.clean}/${t.n}: you know more than you think.` : 'Your confidence matches your result.') : 'Saved. Do the three try-it questions to see how well your confidence matches your results.')
      + (ifThen ? ' Your if-then plan will be shown at the top of this lesson next time.' : '');
  } }, String(n))));
  const showEfficacy = () => { efficacy.textContent = tally.answered ? `This visit: ${tally.clean} of ${tally.answered} checks right at the first attempt. Each of those is a problem you solved yourself.` : ''; };
  const box = h('div', { class: 'panel study-reflect' }, h('h2', { style: { marginTop: 0 } }, 'Reflect'), efficacy, hard,
    h('div', { class: 'small-note' }, 'Plan for next time, as an if-then:'), h('div', { class: 'row' }, h('span', {}, 'If'), ifIn, h('span', {}, 'then'), thenIn),
    h('div', { class: 'small-note' }, 'How confident are you now? (1-5)'), conf, note);
  box.addEventListener('focusin', showEfficacy);
  new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) showEfficacy(); }).observe(box);
  return box;
}
