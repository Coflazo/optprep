// Lesson renderer. Blocks are data; this turns them into DOM. Text goes through the
// inline markup (text nodes only). Diagrams come from the study registry. Worked
// examples and try-it questions come live from the verified generators.
import { h } from '../ui/dom.js';
import { renderInline } from './markup.js';
import { renderDiagram } from './diagrams/index.js';
import { resolveQuestion, gradeCheck } from './check.js';
import { SECTION_MODULES } from '../sections/index.js';
import { makeRng } from '../core/rng.js';
import { itemBody, runFeedbackSession } from '../ui/runner.js';
import { solutionPanel } from '../ui/solution.js';
import { recordTry, markRead, recordReflection, statusOf } from './progress.js';
import { checkItem } from '../core/check.js';

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
    case 'check': return checkBlock(b.questions, ctx, b.scope);
    case 'worked': return workedBlock(b, ctx);
    case 'traps': return trapsBlock(b, ctx);
    case 'tryit': return tryBlock(b, ctx);
    case 'recognize': return recognizeBlock(b, ctx);
    case 'challenge': return challengeBlock(b);
    case 'explain': return explainBlock(b);
    case 'erroneous': return erroneousBlock(b);
    default: return h('p', { class: 'muted' }, `Unknown block ${b.type}`);
  }
}

function diagramBlock(b, ctx) {
  let el;
  try { el = renderDiagram(b.diagram, val(b.spec, ctx)); } catch (e) { el = h('p', { class: 'muted' }, `Diagram unavailable: ${e.message}`); }
  return h('figure', { class: 'study-figure' }, el, b.caption ? h('figcaption', {}, T(val(b.caption, ctx))) : null);
}

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
    if (st.checks?.length && !skipChecks) {
      pending += 1;
      li.append(checkBlock(st.checks, ctx, null, () => { pending -= 1; sync(); }));
    } else if (st.checks?.length) li.append(checkBlock(st.checks, ctx));
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
export function checkBlock(questions, ctx, scope, onDone) {
  const rng = ctx.rng.fork(`check:${Math.floor(ctx.rng.next() * 1e9)}`);
  const box = h('div', { class: 'study-check' }, h('div', { class: 'check-label' }, `Check · ${questions.length} question${questions.length > 1 ? 's' : ''}`, scope ? h('span', { class: 'muted' }, ` · uses only: ${scope}`) : null));
  let open = questions.length;
  const finished = () => { open -= 1; if (open === 0) onDone?.(); };
  questions.forEach((spec, qi) => box.append(questionView(resolveQuestion(spec, rng.fork(`q${qi}`)), finished)));
  return box;
}

function questionView(q, onAnswered) {
  const fb = h('div', { class: 'check-feedback' });
  let answered = false;
  const done = (res, response) => {
    const first = !answered;
    answered = true;
    fb.replaceChildren(h('div', { class: `feedback ${res.correct ? 'ok' : 'no'}` },
      h('strong', {}, res.correct ? 'Right. ' : 'Not quite. '),
      res.trap ? h('span', {}, 'That answer comes from: ', h('em', {}, T(res.trap)), '. ') : null,
      !res.correct ? h('span', {}, 'Answer: ', T(answerText(q)), '. ') : null,
      res.score != null ? h('span', {}, `Score ${res.score.toFixed(2)}. `) : null,
      h('div', { class: 'muted' }, T(q.explain))));
    if (first) onAnswered?.();
    void response;
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
    control = h('div', { class: 'row' }, inp, h('button', { class: 'btn small', type: 'button', onclick: () => { if (inp.value.trim()) done(gradeCheck(q, inp.value)); } }, 'Check'));
  } else if (q.type === 'interval') {
    const lo = h('input', { type: 'number', step: 'any', class: 'study-input', 'aria-label': 'Lower', placeholder: 'lower' });
    const hi = h('input', { type: 'number', step: 'any', class: 'study-input', 'aria-label': 'Upper', placeholder: 'upper' });
    control = h('div', { class: 'row' }, lo, hi, h('button', { class: 'btn small', type: 'button', onclick: () => done(gradeCheck(q, { lower: parseFloat(lo.value), upper: parseFloat(hi.value) })) }, 'Check'));
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
  const hintBtn = q.hints?.length ? h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (used >= q.hints.length) return;
    hintBox.append(h('div', { class: 'feedback' }, h('strong', {}, `Hint ${used + 1}. `), T(q.hints[used])));
    used += 1;
    hintBtn.textContent = used >= q.hints.length ? 'No more hints' : `Next hint (${used}/${q.hints.length})`;
    hintBtn.disabled = used >= q.hints.length;
  } }, `Stuck? Hint (0/${q.hints.length})`) : null;
  return h('div', { class: 'check-q' }, h('p', {}, T(q.q)), control, hintBtn, hintBox, fb);
}

// Productive failure: two attempted approaches and an answer before any teaching.
function challengeBlock(b) {
  const a1 = h('textarea', { class: 'study-text', rows: 2, placeholder: 'Approach 1: how would you attack it?', 'aria-label': 'Approach 1' });
  const a2 = h('textarea', { class: 'study-text', rows: 2, placeholder: 'Approach 2: a different way in', 'aria-label': 'Approach 2' });
  const ans = h('input', { type: 'text', class: 'study-input', placeholder: 'Your answer', 'aria-label': 'Your answer' });
  const out = h('div', { hidden: true }, h('div', { class: 'feedback' }, h('strong', {}, 'Answer: '), T(b.answer), h('div', { class: 'muted' }, T(b.explain))));
  const btn = h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (!a1.value.trim() || !a2.value.trim() || !ans.value.trim()) { btn.textContent = 'Write both approaches and an answer first'; return; }
    out.hidden = false; btn.hidden = true;
  } }, 'Compare with the answer');
  return h('div', { class: 'study-challenge' }, h('div', { class: 'check-label' }, 'Challenge: before any teaching'),
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
  return h('div', { class: 'study-explain' }, h('div', { class: 'check-label' }, 'Explain it'), h('p', {}, T(b.prompt)), ta, btn, res);
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
  return h('div', { class: 'study-erroneous' }, h('div', { class: 'check-label' }, 'Find the error'), h('p', {}, T(b.problem)), h('p', { class: 'muted small-note' }, 'One step is wrong. Click it.'), list, fb);
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
    sol.replaceChildren(solutionPanel(item, { stepwise: false }));
    if (b.diagram) { try { const d = b.diagram(item); sol.prepend(diagramBlock({ diagram: d.diagram, spec: d.spec, caption: d.caption }, ctx)); } catch { /* optional */ } }
    sol.hidden = false; btn.hidden = true;
  } }, 'I have tried it: show the solution');
  if (b.fade >= 1) return fadedWorked(b, item, ctx);
  return h('div', { class: 'study-worked' }, h('div', { class: 'check-label' }, `Worked example · difficulty ${item.difficulty}`), b.intro ? h('p', {}, T(b.intro)) : null, body.el, btn, sol);
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
  return h('div', { class: 'study-worked' }, h('div', { class: 'check-label' }, `Worked example, faded · the last ${b.fade} step${b.fade > 1 ? 's are' : ' is'} yours`), b.intro ? h('p', {}, T(b.intro)) : null,
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
  const status = h('p', { class: 'muted' }, 'Three fresh questions of this type. Answer all three right without hints to master the lesson.');
  const start = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    start.hidden = true;
    const rng = makeRng(`try:${ctx.lesson.id}:${Date.now()}`);
    const levels = f.family.levels?.length ? f.family.levels : [1];
    const items = Array.from({ length: b.count ?? 3 }, (_, i) => f.family.generate(rng.fork(`t${i}`), { difficulty: levels[Math.min(i, levels.length - 1)] }));
    const area = h('div', {});
    box.append(area);
    runFeedbackSession(area, { sectionId: f.section, mode: 'learn', items, store: ctx.store, title: `Try it: ${f.family.title}`, onDone: (r) => {
      const pass = recordTry(ctx.store, ctx.lesson.id, r);
      status.replaceChildren(h('span', { class: `badge ${pass ? 'ok' : 'no'}` }, pass ? 'Mastered' : 'Not yet'), ` ${r.clean} of ${r.n} right without hints. `, pass ? 'This lesson will come back for review.' : 'Re-read the step you missed, then try three new ones.');
      start.textContent = 'Three more'; start.hidden = false;
      ctx.onProgress?.();
    } });
  } }, 'Start: 3 fresh questions');
  box.append(status, start);
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

export function renderLesson(root, lesson, { store, onProgress } = {}) {
  const status = statusOf(store, lesson.id);
  const faded = status === 'mastered' || status === 'review';
  const ctx = { lesson, store, rng: makeRng(`lesson:${lesson.id}:${Date.now()}`), onProgress, faded };
  markRead(store, lesson.id);
  const toc = h('nav', { class: 'study-toc', 'aria-label': 'Lesson sections' }, lesson.blocks.filter((b) => b.type === 'section').map((b) => h('a', { href: `#s-${b.key}`, onclick: (e) => { e.preventDefault(); root.querySelector(`#s-${b.key}`)?.scrollIntoView({ behavior: 'smooth' }); } }, b.title)));
  const plan = planBlock(lesson, store, faded);
  const body = h('article', { class: 'study-body' }, lesson.blocks.map((b) => renderBlock(b, ctx)));
  return h('div', {}, plan, toc, body, reflectBlock(lesson, store));
}

// Plan (goal setting + confidence before), shown above the lesson.
function planBlock(lesson, store, faded) {
  const conf = h('div', { class: 'row', role: 'group', 'aria-label': 'Confidence before' }, [1, 2, 3, 4, 5].map((n) => h('button', { class: 'btn small', type: 'button', onclick: (e) => {
    recordReflection(store, lesson.id, { before: n });
    e.currentTarget.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
  } }, String(n))));
  return h('div', { class: 'panel study-plan' },
    lesson.objectives?.length ? h('div', {}, h('div', { class: 'check-label' }, 'By the end you can'), h('ul', { class: 'study-list' }, lesson.objectives.map((o) => h('li', {}, T(o))))) : null,
    h('div', { class: 'small-note' }, 'Before you start: how confident are you with this type? (1 = never seen it, 5 = could teach it)'), conf,
    faded ? h('p', { class: 'small-note muted' }, 'You have mastered this lesson, so the scaffolds are faded: every step is open and no check blocks you. Use the checks as a quick self-test.') : null);
}

// Reflect (monitor → evaluate): confidence after, what was hardest, what next.
function reflectBlock(lesson, store) {
  const hard = h('textarea', { class: 'study-text', rows: 2, placeholder: 'Which step was hardest, and why?', 'aria-label': 'Hardest step' });
  const next = h('textarea', { class: 'study-text', rows: 2, placeholder: 'What will you do differently next time you meet this type?', 'aria-label': 'Next time' });
  const note = h('p', { class: 'small-note muted', role: 'status' });
  const conf = h('div', { class: 'row', role: 'group', 'aria-label': 'Confidence after' }, [1, 2, 3, 4, 5].map((n) => h('button', { class: 'btn small', type: 'button', onclick: (e) => {
    const r = recordReflection(store, lesson.id, { after: n, hardest: hard.value.trim(), next: next.value.trim() });
    e.currentTarget.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget)));
    const t = r.lastTry;
    note.textContent = t ? (n >= 4 && t.clean < t.n ? `You rate yourself ${n}/5 but got ${t.clean}/${t.n} without hints: likely overconfident. Re-read the step you missed.` : n <= 2 && t.clean === t.n ? `You rate yourself ${n}/5 but got ${t.clean}/${t.n}: you know more than you think.` : 'Your confidence matches your result.') : 'Saved. Do the three try-it questions to see how well your confidence matches your results.';
  } }, String(n))));
  return h('div', { class: 'panel study-reflect' }, h('h2', { style: { marginTop: 0 } }, 'Reflect'), hard, next,
    h('div', { class: 'small-note' }, 'How confident are you now? (1-5)'), conf, note);
}
