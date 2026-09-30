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

const VIEWS = { mcq: mcqView, rank: rankView, interval: intervalView, orderbook: orderbookView };
const CALIBRATED = new Set(['bto', 'nl']);

export function itemBody(item, { onChange, preview = true } = {}) {
  const view = VIEWS[item.kind](item, { onChange, showPreview: preview });
  let visual = null;
  if (item.prompt.visual) {
    try { visual = renderVisual(item.prompt.visual); } catch (e) { visual = h('p', { class: 'muted' }, `Visual unavailable: ${e.message}`); }
  }
  const el = h('div', {}, h('p', { class: 'prompt' }, item.prompt.text), visual, view.el);
  return { el, view };
}

function familyTitle(section, id) { return section.families.find((f) => f.id === id)?.title || id; }

function timerEl() { return h('span', { class: 'timer', 'aria-live': 'off' }); }
function paintTimer(el, ms) {
  const s = Math.ceil(ms / 1000);
  el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  el.classList.toggle('low', s <= 10);
}

// ---------------------------------------------------------------- feedback modes
export function runFeedbackSession(root, { sectionId, mode, family, count, store, onDone, items: fixedItems, title }) {
  const section = SECTION_MODULES[sectionId];
  const cfg = SECTIONS[sectionId];
  const rng = makeRng(`${sectionId}:${mode}:${Date.now()}`);
  const perItemMs = drillMs(cfg);
  const log = [];
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
    const submitBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => submit() }, 'Submit');
    const unsureBtn = CALIBRATED.has(sectionId) ? h('button', { class: 'btn', type: 'button', onclick: () => submit({ confidence: 0.6 }) }, 'Submit (unsure)') : null;
    if (unsureBtn) submitBtn.textContent = 'Submit (sure)';
    const skipBtn = item.kind === 'mcq' ? h('button', { class: 'btn', type: 'button', onclick: () => submit({ skip: true }) }, 'Skip') : null;
    const hints = mode === 'drill' ? null : hintLadder(item, (n) => { current.hints = n; });
    const body = itemBody(item, { preview: mode !== 'drill' });
    const t = timerEl();
    const head = h('div', { class: 'qhead' },
      h('span', {}, `${title || cfg.title} · ${modeLabel(mode)} · ${familyTitle(section, item.family)}`),
      h('span', {}, Number.isFinite(limit) ? `${idx + 1} / ${limit}` : `#${idx + 1}`, mode === 'drill' ? ' · ' : '', mode === 'drill' ? t : ''));
    const controls = h('div', { class: 'row' }, submitBtn, unsureBtn, skipBtn, hints?.btn,
      h('span', { style: { flex: 1 } }), h('button', { class: 'btn', type: 'button', onclick: () => { idx = limit; summary(); } }, 'End session'));
    const after = h('div', {});
    mount(root, h('div', { class: 'panel' }, head, body.el, hints?.box, controls, after));
    current.body = body; current.after = after; current.controls = controls;
    if (item.kind === 'interval') body.view.focus?.();

    const onKey = (e) => {
      if (current.done) { if (e.key === 'Enter') { e.preventDefault(); idx++; show(); } return; }
      body.view.keyHandler?.(e);
      if (e.key === 'Enter' && !e.target.closest?.('button')) { e.preventDefault(); submit(); }
    };
    document.addEventListener('keydown', onKey);
    let raf = 0;
    if (mode === 'drill') {
      const cd = makeCountdown(perItemMs(item));
      const tick = () => { paintTimer(t, cd.remaining()); if (cd.expired()) submit({ timeout: true }); else raf = requestAnimationFrame(tick); };
      tick();
    }
    cleanup = () => { document.removeEventListener('keydown', onKey); cancelAnimationFrame(raf); };
  }

  function submit(opts = {}) {
    if (current.done) return;
    const { item, body } = current;
    let response = opts.skip ? { skip: true } : body.view.response();
    if (!response) {
      if (!opts.timeout) return flash(current.after, 'Choose an answer first, or skip.');
      response = { skip: true };
    }
    current.done = true;
    body.view.lock();
    const result = checkItem(item, response);
    const ms = performance.now() - current.start;
    const confidence = opts.confidence ?? (CALIBRATED.has(sectionId) && !response.skip ? 0.9 : undefined);
    const correctNoHelp = result.correct && current.hints === 0;
    store.recordAnswer(sectionId, item.family, { correct: correctNoHelp, ms, confidence: response.skip ? undefined : confidence });
    store.srs = srsRecord(store.srs, `${sectionId}:${item.family}`, correctNoHelp);
    log.push({ family: item.family, correct: result.correct, score: result.score, hints: current.hints, ms });
    body.view.reveal(result, response);
    const banner = feedbackBanner(item, result, response);
    mount(current.after, banner, solutionPanel(item, { stepwise: !result.correct }),
      h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', type: 'button', onclick: () => { idx++; show(); } }, idx + 1 >= limit ? 'Finish' : 'Next (Enter)')));
    if (item.kind === 'interval') intervalCoach(item, banner.querySelector('.coach-slot'));
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
    mount(root, h('div', { class: 'panel' },
      h('h2', { style: { marginTop: 0 } }, `${modeLabel(mode)} summary`),
      n ? h('p', {}, `${correct} of ${n} correct (${Math.round((100 * correct) / n)}%).`) : h('p', { class: 'muted' }, mode === 'mistakes' ? 'Nothing is due for review in this section right now.' : 'No questions answered.'),
      n ? h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Family'), h('th', { style: { textAlign: 'right' } }, 'Correct'))),
        h('tbody', {}, [...byFam.entries()].map(([f, v]) => h('tr', {}, h('td', {}, familyTitle(section, f)), h('td', { class: 'num', style: { textAlign: 'right' } }, `${v.c}/${v.n}`))))) : null,
      h('div', { class: 'row', style: { marginTop: '16px' } },
        weakest && weakest[1].c < weakest[1].n ? h('a', { class: 'btn primary', href: `#/s/${sectionId}/learn/${weakest[0]}` }, `Learn: ${familyTitle(section, weakest[0])}`) : null,
        h('a', { class: 'btn', href: `#/s/${sectionId}` }, 'Back to section'))));
    onDone?.({ n, correct });
  }

  show();
  return () => cleanup();
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
  setTimeout(() => { if (note.isConnected) note.remove(); }, 2500);
}

// ---------------------------------------------------------------- exam replica
export function runExam(root, { sectionId, variant, store, seed = Date.now(), onDone, mock = false }) {
  const section = SECTION_MODULES[sectionId];
  const base = SECTIONS[sectionId];
  const exam = { ...base.exam, ...(variant || {}) };
  const items = examItems(section, { count: exam.count, ramp: sectionId === 'nl', bankRatio: 0.2 }, seed);
  const responses = items.map(() => null);
  const obSolved = items.map(() => false);
  let idx = 0;
  let finished = false;
  let raf = 0;
  const total = exam.totalSeconds ? makeCountdown(exam.totalSeconds * 1000) : null;
  let perItem = null;
  let current = null;
  const t = timerEl();

  function show() {
    if (finished) return;
    if (idx >= items.length) return exam.navigation === 'free' ? endScreen() : finish();
    const item = items[idx];
    const body = itemBody(item, { preview: false });
    if (responses[idx] && !responses[idx].skip) body.view.setResponse?.(responses[idx]);
    current = { item, body };
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
        : h('button', { class: 'btn primary', type: 'button', onclick: () => { save(); idx++; show(); } }, 'Next'),
      item.kind === 'mcq' || item.kind === 'orderbook' ? h('button', { class: 'btn', type: 'button', onclick: () => { if (!free || !responses[idx]) responses[idx] = { skip: true }; idx++; show(); } }, free ? 'Skip for now' : 'Skip') : null,
      h('span', { style: { flex: 1 } }),
      h('button', { class: 'btn', type: 'button', onclick: () => { if (confirm('Finish the exam now? Unanswered questions score 0.')) { save(); finish(); } } }, 'Finish exam'));
    mount(root, h('div', { class: 'panel exam' },
      h('div', { class: 'qhead' }, h('span', {}, `${base.title} · Exam${mock ? ' (mock)' : ''} · Question ${idx + 1} of ${items.length}`), t),
      palette, body.el, note, controls));
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
    if (total && total.expired()) { save(); return finish(); }
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
    current.body.view.keyHandler?.(e);
    if (e.key === 'Enter' && !e.target.closest?.('button') && current.item.kind !== 'orderbook') { e.preventDefault(); save(); idx++; show(); }
  };
  document.addEventListener('keydown', onKey);

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
    const results = items.map((it, i) => {
      if (it.kind === 'orderbook') return obSolved[i] ? { correct: true, score: 1 } : { correct: false, score: 0, skipped: !responses[i] };
      return checkItem(it, responses[i] || { skip: true });
    });
    const { score, max } = examScore(sectionId, results.map((r) => r.score));
    items.forEach((it, i) => {
      if (responses[i] && !responses[i].skip) {
        store.recordAnswer(sectionId, it.family, { correct: results[i].correct, ms: 0 });
        store.srs = srsRecord(store.srs, `${sectionId}:${it.family}`, results[i].correct);
      }
    });
    const run = { section: sectionId, mode: 'exam', mock, variant: variant?.label || null, score, max, items: items.map((it, i) => ({ family: it.family, score: results[i].score })) };
    const official = !variant; // only the full-length replica counts toward readiness
    if (official) store.recordRun(run);
    else store.recordRun({ ...run, mode: 'exam-variant' });
    review(results, score, max, official);
    onDone?.({ score, max });
  }

  function review(results, score, max, official) {
    const target = base.target;
    const meets = runMeetsTarget({ score, max }, target);
    const ready = readiness(store.runs(sectionId, 'exam'), target);
    const rows = items.map((it, i) => {
      const detail = h('tr', { hidden: true }, h('td', { colspan: 5 }, h('div', { class: 'review-item' }, itemBody(it, { preview: false }).el, feedbackBanner(it, results[i], responses[i] || { skip: true }), solutionPanel(it, { stepwise: false }))));
      const toggle = h('button', { class: 'btn small', type: 'button', onclick: () => { detail.hidden = !detail.hidden; toggle.textContent = detail.hidden ? 'Solution' : 'Hide'; } }, 'Solution');
      const r = results[i];
      return [h('tr', {},
        h('td', { class: 'num' }, String(i + 1)),
        h('td', {}, familyTitle(section, it.family)),
        h('td', {}, r.skipped ? h('span', { class: 'badge' }, 'Skipped') : r.correct || r.score > 0 ? h('span', { class: 'badge ok' }, it.kind === 'interval' ? r.score.toFixed(2) : 'Right') : h('span', { class: 'badge no' }, 'Wrong')),
        h('td', { class: 'num', style: { textAlign: 'right' } }, it.kind === 'interval' ? r.score.toFixed(2) : String(r.score)),
        h('td', { style: { textAlign: 'right' } }, toggle)), detail];
    });
    mount(root, h('div', { class: 'panel' },
      h('h2', { style: { marginTop: 0 } }, `${base.title}: ${sectionId === 'iv' ? `${score.toFixed(2)} of ${max} (mean ${(score / max).toFixed(2)})` : `${score} of ${max}`}`),
      h('p', {}, h('span', { class: `badge ${meets ? 'ok' : 'no'}` }, meets ? 'Target met' : 'Below target'), ` Target: ${target.label}.`),
      official ? h('p', { class: 'muted' }, ready.ready ? 'Ready: the last 3 exams all met the target. This section is safe to open.' : `Readiness streak ${ready.streak} of ${ready.needed}. The section turns ready after 3 exams in a row at target.`) : h('p', { class: 'muted' }, 'Short variant: good practice, but only the full-length exam counts toward readiness.'),
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Family'), h('th', {}, 'Result'), h('th', { style: { textAlign: 'right' } }, 'Points'), h('th', {}))), h('tbody', {}, rows.flat())),
      h('div', { class: 'row', style: { marginTop: '16px' } },
        h('a', { class: 'btn primary', href: `#/s/${sectionId}` }, 'Back to section'),
        h('a', { class: 'btn', href: `#/run/${sectionId}/mistakes` }, 'Review mistakes'))));
  }

  show();
  raf = requestAnimationFrame(tick);
  return () => { finished = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
}
