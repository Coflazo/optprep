// Session runner for every section and mode.
//   practice  untimed, adaptive family choice, hints, full feedback after each item
//   drill     real per-item timing, feedback after each item, fixed length
//   mistakes  families due in spaced repetition, feedback after each item
//   exam      exact replica: timing, navigation and scoring from config, review at the end
import { h, mount } from './dom.js';
import { renderVisual } from './visuals/index.js';
import { mcqView } from './kinds/mcq.js';
import { rankView } from './kinds/rank.js';
import { intervalView } from './kinds/interval.js';
import { orderbookView } from './kinds/orderbook.js';
import { feedbackBanner, solutionPanel, hintLadder, intervalCoach } from './solution.js';
import { checkItem } from '../core/check.js';
import { makeRng } from '../core/rng.js';
import { practiceItem, examItems, examScore, drawItem } from '../core/draw.js';
import { srsRecord, srsDue } from '../core/srs.js';
import { makeCountdown } from '../core/timer.js';
import { SECTIONS } from '../../config/sections.js';
import { SECTION_MODULES } from '../sections/index.js';
import { readiness, runMeetsTarget } from '../core/readiness.js';
import { lessonForFamily } from '../study/catalog.js';
import { divNotation } from '../core/format.js';
import { setRail, scanSheet, bubbles, tickTo } from './sheet.js';
import { mistakeRow } from '../core/mistakes.js';
import { timingOf } from '../../config/presets.js';

const VIEWS = { mcq: mcqView, rank: rankView, interval: intervalView, orderbook: orderbookView };
// Sure/unsure buttons. Not the 80-in-8: one tap answers there, so there is no second button to press.
const CALIBRATED = new Set(['bto', 'nl']);

// notation: 'colon' shows ÷ as : (European), the learner's setting.
let promptSeq = 0;
export function itemBody(item, { onChange, preview = true, notation, keys = true, label } = {}) {
  const pid = `prompt-${++promptSeq}`;
  const view = VIEWS[item.kind](item, { onChange, showPreview: preview, keys, labelledby: pid });
  let visual = null;
  if (item.prompt.visual) {
    try { visual = renderVisual(item.prompt.visual); } catch (e) { visual = h('p', { class: 'muted' }, `Visual unavailable: ${e.message}`); }
  }
  const el = h('div', {}, h('p', { class: 'prompt', id: pid, tabindex: '-1' }, label ? h('span', { class: 'visually-hidden' }, `${label}. `) : null, divNotation(item.prompt.text, notation)), visual, view.el);
  return { el, view };
}
const notationOf = (store) => store?.settings?.().divNotation;
const keysOf = (store) => store?.settings?.().answerKeys !== false;
// Focus the new question (or result) after each swap so keyboard and screen reader users stay in place.
const focusIn = (root, sel) => { const t = root.querySelector(sel); if (t) { if (!t.hasAttribute('tabindex')) t.tabIndex = -1; t.focus({ preventScroll: false }); } };

function familyTitle(section, id) { return section.families.find((f) => f.id === id)?.title || id; }

function timerEl() { return h('span', { class: 'timer', 'aria-live': 'off' }); }
function paintTimer(el, ms) {
  const s = Math.ceil(ms / 1000);
  el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  el.classList.toggle('low', s <= 10);
}

// ---------------------------------------------------------------- feedback modes
export function runFeedbackSession(root, { sectionId, mode, family, count, store, onDone, items: fixedItems, title, setNumber, diagnose = false, onMiss, noHints = false }) {
  const section = SECTION_MODULES[sectionId];
  const cfg = SECTIONS[sectionId];
  const rng = makeRng(`${sectionId}:${mode}:${Date.now()}`);
  const perItemMs = drillMs(cfg);
  // One-tap sections (the 80-in-8): a pace line against the exam's seconds per question, and in
  // drill a tap on an option submits it, as in the exam. Practice keeps Submit, so you can rethink.
  const paceMs = cfg.exam.autoAdvance ? perItemMs() : 0;
  const tapSubmits = cfg.exam.autoAdvance && mode === 'drill';
  const notation = notationOf(store);
  const log = [];
  const xp0 = store.xpTotal();
  const lv0 = { ...store.mastery() };
  let idx = 0;
  let current = null;
  let cleanup = () => {};
  const limit = fixedItems ? fixedItems.length : (count || (mode === 'practice' ? Infinity : 10));
  const dueKeys = mode === 'mistakes' ? srsDue(store.srs).filter((k) => k.startsWith(`${sectionId}:`)).map((k) => k.split(':')[1]) : [];

  function nextItem() {
    if (fixedItems) return fixedItems[idx];
    if (mode === 'mistakes') {
      if (!dueKeys.length) return null;
      return drawItem(section, rng, { family: dueKeys[idx % dueKeys.length] });
    }
    return practiceItem(section, rng, store.stats(), { family });
  }

  function show() {
    cleanup();
    if (idx >= limit) return summary();
    const item = nextItem();
    if (!item) return summary();
    current = { item, start: performance.now(), hints: 0 };
    if (Number.isFinite(limit)) setRail(idx / limit, `Question ${idx + 1} of ${limit}`);
    const submitBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => submit() }, 'Submit');
    const unsureBtn = CALIBRATED.has(sectionId) ? h('button', { class: 'btn ghost', type: 'button', onclick: () => submit({ confidence: 0.6 }) }, 'Submit, not sure') : null;
    const skipBtn = item.kind === 'mcq' ? h('button', { class: 'btn ghost', type: 'button', onclick: () => submit({ skip: true }) }, 'Skip') : null;
    const hints = mode === 'drill' || noHints ? null : hintLadder(item, (n) => { current.hints = n; });
    const body = itemBody(item, { preview: mode !== 'drill', notation, keys: keysOf(store), label: Number.isFinite(limit) ? `Question ${idx + 1} of ${limit}` : `Question ${idx + 1}`, onChange: tapSubmits && item.kind === 'mcq' ? () => submit() : undefined });
    const t = timerEl();
    const paceEl = paceMs && mode !== 'drill' ? h('span', { class: 'num pace', title: 'Seconds on this question against the exam pace' }) : null;
    // The family name can give the method away (e.g. "cheap bundle: buy it, sell the parts"),
    // so it is shown only after the answer is in, except when the learner chose the family.
    const famLabel = h('span', {}, family || mode === 'learn' ? ` · ${familyTitle(section, item.family)}` : '');
    const head = h('div', { class: 'qhead' },
      h('span', {}, `${title || cfg.title} · ${modeLabel(mode)}`, famLabel),
      h('span', {}, Number.isFinite(limit) ? `${idx + 1} / ${limit}` : `#${idx + 1}`, mode === 'drill' ? ' · ' : '', mode === 'drill' ? t : '', paceEl ? ' · ' : '', paceEl));
    const controls = h('div', { class: 'row' }, submitBtn, unsureBtn, skipBtn, hints?.btn,
      h('span', { style: { flex: 1 } }), h('button', { class: 'btn ghost', type: 'button', onclick: () => { idx = limit; summary(); } }, 'End session'));
    const after = h('div', { 'aria-live': 'polite' });
    mount(root, h('h1', { class: 'visually-hidden' }, `${title || cfg.title}: ${modeLabel(mode)}`), h('div', { class: 'panel' }, head, tapSubmits && item.kind === 'mcq' ? h('p', { class: 'small-note muted' }, 'Tapping an option submits it.') : null, body.el, hints?.box, controls, after));
    focusIn(root, '.prompt');
    current.body = body; current.after = after; current.controls = controls; current.famLabel = famLabel;
    if (item.kind === 'interval') body.view.focus?.();

    const onKey = (e) => {
      if (current.done) { if (e.key === 'Enter' && !e.target.closest?.('a, button, summary, input, select, textarea')) { e.preventDefault(); idx++; show(); } return; }
      body.view.keyHandler?.(e);
      if (e.key === 'Enter' && !e.target.closest?.('button')) { e.preventDefault(); submit(); }
    };
    document.addEventListener('keydown', onKey);
    let raf = 0;
    if (mode === 'drill') {
      const cd = makeCountdown(perItemMs(item));
      const tick = () => { paintTimer(t, cd.remaining()); if (cd.expired()) submit({ timeout: true }); else raf = requestAnimationFrame(tick); };
      tick();
    } else if (paceEl) {
      const tick = () => {
        const ms = performance.now() - current.start;
        paceEl.textContent = `${(ms / 1000).toFixed(1)} s / ${paceMs / 1000} s`;
        paceEl.classList.toggle('over', ms > paceMs);
        if (!current.done) raf = requestAnimationFrame(tick);
      };
      tick();
    }
    cleanup = () => { document.removeEventListener('keydown', onKey); cancelAnimationFrame(raf); };
  }

  function submit(opts = {}) {
    if (current.done) return;
    const { item, body } = current;
    let response = opts.skip ? { skip: true } : body.view.response();
    if (!response) {
      if (!opts.timeout) return flash(current.after, { orderbook: 'Tap prices to build a position first.', interval: 'Enter a lower and an upper bound first.', rank: 'Put the statements in order first.' }[item.kind] || 'Choose an answer first, or skip.');
      response = { skip: true };
    }
    current.done = true;
    body.view.lock();
    const result = checkItem(item, response);
    const ms = performance.now() - current.start;
    const confidence = opts.confidence ?? (CALIBRATED.has(sectionId) && !response.skip ? 0.9 : undefined);
    const correctNoHelp = result.correct && current.hints === 0;
    store.recordAnswer(sectionId, item.family, {
      correct: correctNoHelp, ms, confidence: response.skip ? undefined : confidence, difficulty: item.difficulty, score: item.kind === 'interval' ? result.score : undefined,
      hints: current.hints, mode, fresh: setNumber == null, budgetMs: perItemMs(item),
      miss: !result.correct && !response.skip ? mistakeRow(item, response, { mode, ms: Math.round(ms) }) : undefined,
    });
    store.srs = srsRecord(store.srs, `${sectionId}:${item.family}`, correctNoHelp);
    log.push({ family: item.family, correct: result.correct, score: result.score, hints: current.hints, ms });
    body.view.reveal(result, response);
    current.famLabel.textContent = ` · ${familyTitle(section, item.family)}`;
    const banner = feedbackBanner(item, result, response);
    // Study try-it: after a miss, the learner first locates the break ("correct until here")
    // and names the error type; only then does the stepwise solution open.
    const sol = diagnose && !result.correct && item.solution?.steps?.length
      ? diagnosePanel(item, (d) => onMiss?.({ item, response, ...d }), () => solutionPanel(item, { stepwise: true }))
      : solutionPanel(item, { stepwise: !result.correct });
    const pace = paceMs && !response.skip ? h('p', { class: 'small-note num' }, `Answered in ${(ms / 1000).toFixed(1)} s · exam pace ${paceMs / 1000} s${ms > paceMs ? ' · slower than the exam allows' : ''}`) : null;
    mount(current.after, banner, pace, sol,
      h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', type: 'button', onclick: () => { idx++; show(); } }, idx + 1 >= limit ? 'Finish' : 'Next (Enter)'),
        !result.correct && lessonForFamily(sectionId, item.family) ? h('a', { class: 'btn', href: `#/study/lesson/${lessonForFamily(sectionId, item.family)}` }, `Study: ${familyTitle(section, item.family)}`) : null));
    if (item.kind === 'interval') intervalCoach(item, banner.querySelector('.coach-slot'));
    current.after.querySelector('.btn.primary')?.focus({ preventScroll: true });
    current.controls.querySelectorAll('button').forEach((b) => { if (b.textContent !== 'End session') b.disabled = true; });
  }

  function summary() {
    cleanup();
    const n = log.length;
    const correct = log.filter((x) => x.correct).length;
    const byFam = new Map();
    for (const x of log) { const f = byFam.get(x.family) || { n: 0, c: 0 }; f.n++; f.c += x.correct ? 1 : 0; byFam.set(x.family, f); }
    const weakest = [...byFam.entries()].sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n)[0];
    if (mode === 'drill' && n) store.recordRun({ section: sectionId, mode: 'drill', score: log.reduce((s, x) => s + x.score, 0), max: n, items: log });
    if (setNumber != null && n === limit) store.recordSet(sectionId, setNumber, { score: Math.round(log.reduce((s, x) => s + x.score, 0) * 100) / 100, max: n, mode: 'practice' });
    const xpGain = store.xpTotal() - xp0;
    const now = store.mastery();
    const spentS = Math.round(log.reduce((t, x) => t + x.ms, 0) / 1000);
    const famRows = [...byFam.entries()].map(([f, v]) => {
      const k = `${sectionId}:${f}`;
      const before = lv0[k]?.lv || 0, after = now[k]?.lv || 0;
      const marks = bubbles(5, after, { label: `Level ${after} of 5` });
      // Level-up: the newly filled bubbles pop in once (rare, so it earns a moment).
      [...marks.children].slice(before, after).forEach((b) => b.classList.add('is-new'));
      return h('li', { class: 'summary-row' },
        h('span', { class: 'summary-fam' }, familyTitle(section, f)),
        h('span', { class: 'num muted' }, `${v.c}/${v.n}`),
        marks,
        after > before ? h('span', { class: 'stamp stamp-mastered' }, `Level ${after}`) : null);
    });
    setRail(1, 'Session complete');
    mount(root, h('section', { class: 'field session-summary' },
      h('h2', { class: 'field-label' }, `${modeLabel(mode)} summary`),
      n ? h('div', { class: 'summary-stats' },
        h('span', {}, h('span', { class: 'num big' }, `${correct}/${n}`), ' right'),
        h('span', {}, h('span', { class: 'num big xp-tick' }, '+0'), ' XP'),
        h('span', {}, h('span', { class: 'num big' }, `${Math.floor(spentS / 60)}:${String(spentS % 60).padStart(2, '0')}`), ' on questions'))
        : h('p', { class: 'muted' }, mode === 'mistakes' ? 'Nothing is due for review in this task right now.' : 'No questions answered.'),
      n ? h('ol', { class: 'summary-list' }, famRows) : null,
      h('div', { class: 'row' },
        weakest && weakest[1].c < weakest[1].n && lessonForFamily(sectionId, weakest[0]) ? h('a', { class: 'btn primary', href: `#/study/lesson/${lessonForFamily(sectionId, weakest[0])}` }, `Study: ${familyTitle(section, weakest[0])}`) : null,
        weakest && weakest[1].c < weakest[1].n ? h('a', { class: 'btn', href: `#/s/${sectionId}/learn/${weakest[0]}` }, `Worked examples: ${familyTitle(section, weakest[0])}`) : null,
        h('a', { class: 'btn ghost', href: `#/s/${sectionId}` }, 'Back to the roadmap'))));
    focusIn(root, '.session-summary .field-label');
    const xpEl = root.querySelector('.xp-tick');
    if (xpEl) tickTo(xpEl, xpGain);
    onDone?.({ n, correct, clean: log.filter((x) => x.correct && !x.hints).length, family: fixedItems?.[0]?.family, ms: log.map((x) => Math.round(x.ms)), budgetMs: perItemMs(fixedItems?.[0] || {}) });
  }

  show();
  return () => cleanup();
}

// "Correct until here": list the solution's moves; the learner clicks the first one they would
// not have written, then names the error type. Slips get a checking habit, not a re-teach.
const ERROR_TYPES = [['slip', 'Slip: I knew it, made a careless error'], ['idea', 'Missing idea: I did not know this step'], ['method', 'Wrong method: I used a different approach'], ['misread', 'Misread the question']];
function diagnosePanel(item, record, solution) {
  const box = h('div', { class: 'panel diagnose' });
  const steps = item.solution.steps;
  const open = (stepIndex) => {
    box.replaceChildren(h('p', {}, stepIndex == null ? 'You would have written every step: the break is in the execution.' : h('span', {}, stepIndex === 0 ? 'The break is at the first step: ' : `Your reasoning was right up to step ${stepIndex}; the break is step ${stepIndex + 1}: `, h('em', {}, steps[stepIndex].say), h('div', { class: 'muted' }, steps[stepIndex].why))),
      h('p', { class: 'small-note' }, 'What kind of error was it?'),
      h('div', { class: 'check-options' }, ERROR_TYPES.map(([type, label]) => h('button', { class: 'btn small', type: 'button', onclick: () => {
        record({ stepIndex, type, belief: stepIndex == null ? 'Execution slip in a method I knew' : steps[stepIndex].say });
        box.replaceChildren(h('p', { class: 'small-note muted' }, type === 'slip' ? 'Slips need a checking habit, not a re-teach: before submitting, estimate the answer and compare.' : type === 'misread' ? 'Underline the deciding words (at least, exactly, without replacement) before you start.' : 'Here is the full solution; the step you marked is the one to re-learn.'), solution());
      } }, label))));
  };
  box.append(h('p', {}, h('strong', {}, 'Find the break. '), 'Click the first step you would NOT have written:'),
    h('ol', { class: 'steps' }, steps.map((st, i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)), h('button', { class: 'linkish step-pick', type: 'button', onclick: () => open(i) }, st.say)))),
    h('button', { class: 'btn small', type: 'button', onclick: () => open(null) }, 'I would have written all of these'));
  return box;
}

function drillMs(cfg) {
  return () => {
    if (cfg.exam.perItemSeconds) return cfg.exam.perItemSeconds * 1000;
    return Math.round((cfg.exam.totalSeconds / cfg.exam.count) * 1000);
  };
}

function modeLabel(m) { return { practice: 'Practice', drill: 'Drill', mistakes: 'Mistakes', exam: 'Exam', learn: 'Fresh test' }[m] || m; }

function flash(el, msg) {
  const note = h('p', { class: 'muted', role: 'status' }, msg);
  el.replaceChildren(note);
  // Stays until the next action replaces it (WCAG 2.2.1: no timed messages).
}

// ---------------------------------------------------------------- exam replica
export function runExam(root, { sectionId, variant, store, seed = Date.now(), onDone, mock = false, items: fixedItems, setNumber }) {
  const section = SECTION_MODULES[sectionId];
  const base = SECTIONS[sectionId];
  const extra = Number(store?.settings?.().extraTime) || 1;
  const exam0 = { ...base.exam, ...(variant || {}) };
  // Extra time (an accessibility setting) stretches the clock; such runs never count toward readiness.
  const exam = extra > 1 ? { ...exam0, totalSeconds: exam0.totalSeconds && exam0.totalSeconds * extra, perItemSeconds: exam0.perItemSeconds && exam0.perItemSeconds * extra } : exam0;
  const items = fixedItems || examItems(section, { count: exam.count, ramp: sectionId === 'nl', bankRatio: 0.2 }, seed);
  const responses = items.map(() => null);
  const obSolved = items.map(() => false);
  let idx = 0;
  let finished = false;
  let raf = 0;
  const total = exam.totalSeconds ? makeCountdown(exam.totalSeconds * 1000) : null;
  let perItem = null;
  let current = null;
  const t = timerEl();
  // autoAdvance (80-in-8): tapping an option is the answer and the next question appears; no Next
  // button and no Enter. allowSkip false removes the Skip button. Both default to the old behaviour.
  const canSkip = exam.allowSkip !== false;
  const notation = notationOf(store);
  const spent = items.map(() => 0); // ms on screen per question, summed over revisits
  const budgetMs = exam.perItemSeconds ? exam.perItemSeconds * 1000 : (exam.totalSeconds * 1000) / items.length;
  const leave = () => { if (current?.i != null) { spent[current.i] += performance.now() - current.t; current.i = null; } };

  function show() {
    if (finished) return;
    leave();
    if (idx >= items.length) return exam.navigation === 'free' ? endScreen() : finish();
    setRail(idx / items.length, `Question ${idx + 1} of ${items.length}`);
    const item = items[idx];
    const tap = exam.autoAdvance && item.kind === 'mcq';
    let live = false; // restoring a saved answer must not advance
    const body = itemBody(item, { preview: false, notation, keys: keysOf(store), label: `Question ${idx + 1} of ${items.length}`, onChange: tap ? () => { if (live) { save(); idx++; show(); } } : undefined });
    if (responses[idx] && !responses[idx].skip) body.view.setResponse?.(responses[idx]);
    live = true;
    current = { item, body, i: idx, t: performance.now() };
    if (exam.perItemSeconds) perItem = makeCountdown(exam.perItemSeconds * 1000);
    const free = exam.navigation === 'free';
    const palette = free ? h('div', { class: 'palette', role: 'navigation', 'aria-label': 'Questions' }, items.map((_, i) => h('button', {
      class: `btn small${i === idx ? ' primary' : ''}${responses[i] && !responses[i].skip ? ' answered' : ''}`, type: 'button',
      onclick: () => { save(); idx = i; show(); },
    }, String(i + 1)))) : null;
    const note = h('div', { class: 'exam-note', role: 'status' });
    const controls = h('div', { class: 'row' },
      free && idx > 0 ? h('button', { class: 'btn', type: 'button', onclick: () => { save(); idx--; show(); } }, 'Previous') : null,
      item.kind === 'orderbook'
        ? h('button', { class: 'btn primary', type: 'button', onclick: () => submitBoard(note) }, 'Submit position')
        : tap ? null : h('button', { class: 'btn primary', type: 'button', onclick: () => { save(); idx++; show(); } }, 'Next'),
      (item.kind === 'mcq' || item.kind === 'orderbook') && canSkip ? h('button', { class: 'btn', type: 'button', onclick: () => { if (!free || !responses[idx]) responses[idx] = { skip: true }; idx++; show(); } }, free ? 'Skip for now' : 'Skip') : null,
      h('span', { style: { flex: 1 } }),
      h('button', { class: 'btn', type: 'button', onclick: () => { if (confirm('Finish the exam now? Unanswered questions score 0.')) { save(); finish(); } } }, 'Finish exam'));
    mount(root, h('h1', { class: 'visually-hidden' }, `${base.title}: exam`), h('div', { class: 'panel exam' },
      h('div', { class: 'qhead' }, h('span', {}, `${base.title} · Exam${mock ? ' (mock)' : ''} · Question ${idx + 1} of ${items.length}`), t),
      palette, body.el, note, controls));
    focusIn(root, '.prompt');
  }

  // Free navigation (NumberLogic): before finishing, show which questions are still open.
  function endScreen() {
    current = null;
    const open = items.map((_, i) => i).filter((i) => !responses[i] || responses[i].skip);
    mount(root, h('div', { class: 'panel exam' },
      h('div', { class: 'qhead' }, h('span', {}, `${base.title} · Exam · end of questions`), t),
      h('p', {}, open.length ? `${open.length} question(s) skipped or unanswered. Go back to any of them, or finish.` : 'Every question has an answer.'),
      h('div', { class: 'palette' }, open.map((i) => h('button', { class: 'btn small', type: 'button', onclick: () => { idx = i; show(); } }, String(i + 1)))),
      h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', type: 'button', onclick: () => finish() }, 'Finish exam'))));
  }

  function save() {
    if (!current) return;
    const r = current.body.view.response();
    if (current.item.kind === 'orderbook') return; // boards are scored by submission
    if (r) responses[idx] = r;
    else if (!responses[idx]) responses[idx] = { skip: true };
  }

  function submitBoard(note) {
    const r = current.body.view.response();
    if (!r) { note.textContent = 'Tap prices to build a position first.'; return; }
    const res = checkItem(current.item, r);
    responses[idx] = r;
    if (res.correct) { obSolved[idx] = true; idx++; show(); return; }
    const pen = exam.wrongSubmitPenaltySeconds || 5;
    total?.penalize(pen * 1000);
    note.textContent = `Not a flat, profitable position. −${pen} s. Adjust and resubmit, or skip.`;
  }

  function tick() {
    if (finished) return;
    const rem = total ? total.remaining() : perItem ? perItem.remaining() : 0;
    paintTimer(t, rem);
    if (total && total.expired()) { save(); const live = document.getElementById('live'); if (live) live.textContent = 'Time is up. Your exam is finished.'; return finish(); }
    if (!total && perItem && perItem.expired()) {
      // per-item clock ran out: keep whatever is on screen (rank order, a full interval), else skip
      const r = current.body.view.response();
      responses[idx] = r || { skip: true };
      idx++; show();
    }
    raf = requestAnimationFrame(tick);
  }

  const onKey = (e) => {
    if (!current || finished) return;
    const tap = exam.autoAdvance && current.item.kind === 'mcq';
    if (tap && e.repeat) return; // a held key must not answer a run of questions
    current.body.view.keyHandler?.(e);
    // With one-tap answering, Enter would only skip (no answer chosen yet), so it does nothing.
    if (e.key === 'Enter' && !tap && !e.target.closest?.('button') && current.item.kind !== 'orderbook') { e.preventDefault(); save(); idx++; show(); }
  };
  document.addEventListener('keydown', onKey);

  function finish() {
    if (finished) return;
    finished = true;
    leave();
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
    const results = items.map((it, i) => {
      if (it.kind === 'orderbook') return obSolved[i] ? { correct: true, score: 1 } : { correct: false, score: 0, skipped: !responses[i] };
      return checkItem(it, responses[i] || { skip: true });
    });
    const { score, max } = examScore(sectionId, results.map((r) => r.score));
    items.forEach((it, i) => {
      if (responses[i] && !responses[i].skip) {
        store.recordAnswer(sectionId, it.family, {
          correct: results[i].correct, ms: Math.round(spent[i]), difficulty: it.difficulty, score: it.kind === 'interval' ? results[i].score : undefined,
          mode: 'exam', fresh: setNumber == null, budgetMs,
          miss: !results[i].correct && it.kind !== 'orderbook' ? mistakeRow(it, responses[i], { mode: 'exam', ms: Math.round(spent[i]) }) : undefined,
        });
        store.srs = srsRecord(store.srs, `${sectionId}:${it.family}`, results[i].correct);
      }
    });
    const run = { section: sectionId, mode: 'exam', mock, variant: variant?.label || null, score, max, timing: timingOf(exam), perfect: results.every((r) => r.correct), targetMet: runMeetsTarget({ score, max }, base.target), items: items.map((it, i) => ({ family: it.family, score: results[i].score, ms: Math.round(spent[i]) })) };
    // Only fresh full-length replicas count toward readiness; numbered sets and
    // short variants are practice (a set can be memorised on a second attempt).
    const official = !variant && setNumber == null && extra === 1;
    if (setNumber != null) store.recordSet(sectionId, setNumber, { score, max, mode: 'timed' });
    else if (official) store.recordRun(run);
    else store.recordRun({ ...run, mode: 'exam-variant' });
    review(results, score, max, official);
    onDone?.({ score, max });
  }

  function review(results, score, max, official) {
    const target = base.target;
    const meets = runMeetsTarget({ score, max }, target);
    const ready = readiness(store.runs(sectionId, 'exam'), target);
    const rows = items.map((it, i) => {
      const detail = h('tr', { hidden: true }, h('td', { colspan: 5 }, h('div', { class: 'review-item' }, itemBody(it, { preview: false, notation }).el, feedbackBanner(it, results[i], responses[i] || { skip: true }), solutionPanel(it, { stepwise: false }))));
      const toggle = h('button', { class: 'btn small', type: 'button', 'aria-label': `Solution, question ${i + 1}`, 'aria-expanded': 'false', onclick: () => { detail.hidden = !detail.hidden; toggle.textContent = detail.hidden ? 'Solution' : 'Hide'; toggle.setAttribute('aria-expanded', String(!detail.hidden)); } }, 'Solution');
      const r = results[i];
      return [h('tr', { 'data-grade': r.skipped ? 'skip' : r.correct || r.score > 0 ? 'right' : 'wrong' },
        h('td', { class: 'num' }, String(i + 1)),
        h('td', {}, familyTitle(section, it.family)),
        h('td', {}, r.skipped ? h('span', { class: 'badge' }, canSkip ? 'Skipped' : 'Not answered') : r.correct || r.score > 0 ? h('span', { class: 'badge ok' }, it.kind === 'interval' ? r.score.toFixed(2) : 'Right') : h('span', { class: 'badge no' }, 'Wrong')),
        h('td', { class: 'num', style: { textAlign: 'right' } }, it.kind === 'interval' ? r.score.toFixed(2) : String(r.score)),
        h('td', { style: { textAlign: 'right' } }, toggle)), detail];
    });
    const sheet = h('div', { class: 'panel exam-review' },
      h('h1', { class: 'score-print is-pending', style: { marginTop: 0 } }, `${base.title}: ${sectionId === 'iv' ? `${score.toFixed(2)} of ${max} (mean ${(score / max).toFixed(2)})` : `${score} of ${max}`}`),
      h('p', {}, h('span', { class: `badge ${meets ? 'ok' : 'no'}` }, meets ? 'Target met' : 'Below target'), ` Target: ${target.label}.`),
      setNumber != null ? h('p', { class: 'muted' }, `Set ${setNumber} is fixed practice: it does not count toward readiness. Fresh full exams do.`) : official ? h('p', { class: 'muted' }, ready.ready ? 'Ready: the last 3 exams all met the target. This section is safe to open.' : `Readiness streak ${ready.streak} of ${ready.needed}. The section turns ready after 3 exams in a row at target.`) : h('p', { class: 'muted' }, 'Short variant: good practice, but only the full-length exam counts toward readiness.'),
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Family'), h('th', {}, 'Result'), h('th', { style: { textAlign: 'right' } }, 'Points'), h('th', {}, h('span', { class: 'visually-hidden' }, 'Solution')))), h('tbody', {}, rows.flat())),
      h('div', { class: 'row', style: { marginTop: '16px' } },
        h('a', { class: 'btn primary', href: setNumber != null ? `#/s/${sectionId}/sets` : `#/s/${sectionId}` }, setNumber != null ? 'Back to sets' : 'Back to section'),
        h('a', { class: 'btn', href: `#/run/${sectionId}/mistakes` }, 'Review mistakes')));
    mount(root, sheet);
    setRail(1, 'Exam finished');
    // Submit is a scan: the line sweeps the sheet, grading each row as it passes, then the score prints.
    scanSheet(sheet, [...sheet.querySelectorAll('tr[data-grade]')]).then(() => { sheet.querySelector('.score-print')?.classList.remove('is-pending'); focusIn(sheet, '.score-print'); });
  }

  // Start screen: the rules before the clock runs (WCAG 3.2.2, 2.2.1). The mock has its own.
  function begin() { total?.restart?.(); show(); raf = requestAnimationFrame(tick); }
  if (mock) begin();
  else {
    const tapAll = exam.autoAdvance && items.every((it) => it.kind === 'mcq');
    const time = exam.totalSeconds ? `${Math.round(exam.totalSeconds / 60 * 10) / 10} minutes for ${items.length} questions` : `${exam.perItemSeconds} seconds per question`;
    mount(root, h('section', { class: 'field exam-start' },
      h('h1', { tabindex: '-1' }, `${base.title}: exam replica`),
      h('ul', { class: 'steps-plain' },
        h('li', {}, time, extra > 1 ? ` (with your extra time ×${extra}; this run will not count toward Ready)` : '', '.'),
        tapAll ? h('li', {}, 'Tapping an option is your answer, and the next question appears. There is no going back.') : null,
        !canSkip ? h('li', {}, 'You cannot skip. A wrong answer costs a point.') : null,
        keysOf(store) && items.some((it) => it.kind === 'mcq') ? h('li', {}, 'Keys 1 to 4 (or A to D) pick an option.') : null),
      h('p', { class: 'muted small-note' }, 'This replica is timed because the real test is. For untimed questions, use ', h('a', { href: `#/run/${sectionId}/practice` }, 'Practice'), '.'),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: begin }, 'Start the clock'))));
    focusIn(root, 'h1');
  }
  return () => { finished = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
}
