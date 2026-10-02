import { h, mount } from '../ui/dom.js';
import { BOOKS, BOOK_BY_ID, LESSON_BY_ID, ALL_LESSONS } from './content/index.js';
import { lessonsOf, wordCount } from './schema.js';
import { renderLesson, renderBlock, familyOf, checkBlock, moveUnit } from './render.js';
import { statusOf, dueLessons, weakUnits, studyState, studyMeta, recordTry, recordMiss, recordRetest, setBeliefPlan, openBeliefs, setGoal, checkGoal, setLastSection, logEvent } from './progress.js';
import { DAY, weekStats, readWeek, goalIsHow, goalDue, pickNext, ago } from './insights.js';
import { renderInline } from './markup.js';
import { makeRng } from '../core/rng.js';
import { renderVisual } from '../ui/visuals/index.js';
import { runFeedbackSession } from '../ui/runner.js';

const T = (s) => renderInline(s, h);
const BADGE = { new: ['', 'New'], read: ['warn', 'Read'], mastered: ['ok', 'Mastered'], review: ['no', 'Review due'] };
const badge = (st) => h('span', { class: `badge ${BADGE[st][0]}` }, BADGE[st][1]);
const minutes = (L) => L.minutes ?? Math.max(4, Math.round(wordCount(L) / 170 + (L.blocks.filter((b) => b.type === 'check' || b.type === 'steps').length * 1.5)));
const REVIEW_MIN = 5, RETEST_MIN = 2;
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const sectionsOf = (L) => L.blocks.filter((b) => b.type === 'section');
const masterable = (L) => L.blocks.some((b) => (b.type === 'tryit' && b.family) || (b.type === 'check' && b.mastery));
const reviewHref = (id) => `#/study/review/${id}`;
const crumbs = (...parts) => h('p', { class: 'muted' }, h('a', { href: '#/study' }, 'Study guide'), parts.map((p) => [' / ', p]));

// Study lists show 5 rows; the rest open with one click (ADHD: short lists, one next action).
function capped(container, n = 5) {
  const rest = [...container.children].slice(n);
  if (!rest.length) return container;
  rest.forEach((el) => { el.hidden = true; });
  const btn = h('button', { class: 'btn small show-all', type: 'button', onclick: () => { rest.forEach((el) => { el.hidden = false; }); btn.remove(); } }, `Show all ${n + rest.length}`);
  return h('div', {}, container, btn);
}

export function studyHome(root, { store }) {
  const now = Date.now();
  const due = dueLessons(store, now).filter((id) => LESSON_BY_ID[id]);
  const weak = weakUnits(store).filter((u) => LESSON_BY_ID[u.id]);
  mount(root,
    h('h1', {}, 'Study guide'),
    nextUp(store, now, due.length),
    goalBox(store, now),
    due.length ? h('div', { class: 'panel' }, h('h2', { style: { marginTop: 0 } }, `Due for review (${due.length})`),
      h('p', { class: 'small-note muted' }, `Each review: recall the rule from memory, then three questions without hints. About ${REVIEW_MIN} min.`),
      capped(h('ul', { class: 'plain' }, due.map((id) => h('li', {}, h('a', { href: reviewHref(id) }, LESSON_BY_ID[id].title)))))) : null,
    weak.length ? h('div', { class: 'panel' }, h('h2', { style: { marginTop: 0 } }, `Units to revisit (${weak.length})`),
      h('p', { class: 'small-note muted' }, 'Units whose last first attempt was wrong. Each stays here until you get it right.'),
      capped(h('ul', { class: 'plain' }, weak.map((u) => h('li', {}, h('a', { href: `#/study/lesson/${u.id}` }, LESSON_BY_ID[u.id].title), h('span', { class: 'muted' }, `: ${u.unit}`)))))) : null,
    h('div', { class: 'tasks-head' }, h('h2', {}, 'Books')),
    h('p', { class: 'muted small-note' }, 'Short steps with a question after each one. A lesson counts as mastered after three fresh questions right without hints.'),
    h('ul', { class: 'task-list' }, BOOKS.map((b) => {
      const ls = b.pending ? [] : lessonsOf(b);
      const m = ls.filter((l) => ['mastered', 'review'].includes(statusOf(store, l.id))).length;
      return h('li', {}, h('a', { class: 'task-row', href: `#/study/book/${b.id}` },
        h('span', { class: 'task-name' }, b.title, h('span', { class: 'task-blurb' }, b.blurb)),
        b.pending ? h('span', { class: 'stamp stamp-new' }, 'Being written') : h('span', { class: 'task-progress num' }, `${m} of ${ls.length}`)));
    })));
}

// Next up: exactly one primary button. Due review > open mistake > unfinished lesson > next unread.
function nextUp(store, now, dueCount) {
  const lessons = ALL_LESSONS.map((L) => ({ id: L.id, sections: sectionsOf(L).map((s) => s.key), masterable: masterable(L) }));
  const beliefs = openBeliefs(store);
  const n = pickNext({ lessons, study: studyState(store), beliefs, log: studyMeta(store).log }, now);
  const L = LESSON_BY_ID[n.id];
  let label, href, why;
  if (n.kind === 'review') {
    [label, href] = [`Review: ${L.title} · ${REVIEW_MIN} min`, reviewHref(n.id)];
    why = `${dueCount} lesson${dueCount > 1 ? 's' : ''} due for review. Recall the rule first, then three questions without hints.`;
  } else if (n.kind === 'retest') {
    const b = beliefs.find((x) => x.key === n.key);
    [label, href] = [`Re-test a mistake · ${RETEST_MIN} min`, `#/study/mistakes/${encodeURIComponent(n.key)}`];
    why = ['Open mistake, missed ', String(b.count), '×: ', T(b.text)];
  } else if (n.kind === 'resume') {
    const secs = sectionsOf(L);
    const k = Math.max(0, secs.findIndex((s) => s.key === n.section));
    [label, href] = [`Continue: ${L.title} · ${Math.max(2, Math.round((minutes(L) * (secs.length - k)) / secs.length))} min`, `#/study/lesson/${n.id}`];
    why = `You stopped at ${secs[k].title} (${k + 1} of ${secs.length}).`;
  } else if (n.kind === 'start') {
    [label, href] = [`Start: ${L.title} · ${minutes(L)} min`, `#/study/lesson/${n.id}`];
    why = `The next unread lesson in ${BOOK_BY_ID[L.book].title}.`;
  } else {
    [label, href, why] = ['Full mock exam', '#/mock', 'Every lesson is read and nothing is due. Test it under exam conditions.'];
  }
  return h('div', { class: 'panel next-up' }, h('div', {}, h('h2', {}, 'Next up'), h('p', { class: 'small-note muted' }, why)), h('a', { class: 'btn primary', href }, label));
}

// The learner's how-to-study goal, with the yes / partly / no check a week after setting it.
function goalBox(store, now, onWeekPage = false) {
  const g = studyMeta(store).goal;
  if (!g) return null;
  const last = g.checks?.[g.checks.length - 1];
  const box = h('div', { class: 'panel goal' }, h('p', {}, h('strong', {}, 'Your study goal: '), g.text));
  if (goalDue(g, now)) {
    const row = h('div', { class: 'row', role: 'group', 'aria-label': 'Did you keep your goal' }, h('span', { class: 'small-note' }, 'A week on: did you keep it?'),
      ['yes', 'partly', 'no'].map((v) => h('button', { class: 'btn small', type: 'button', onclick: () => {
        checkGoal(store, v);
        row.replaceChildren(h('span', { class: 'small-note muted' }, `Recorded: ${v}. `, onWeekPage ? 'Set next week\'s goal below.' : h('a', { href: '#/study/week' }, 'Set next week\'s goal in the weekly review')));
      } }, v)));
    box.append(row);
  } else box.append(h('p', { class: 'small-note muted' }, `Set ${ago(g.at, now)}.${last ? ` Last check: ${last.verdict}.` : ''} You check it a week after setting it.`));
  return box;
}

export function bookPage(root, { store, id }) {
  const b = BOOK_BY_ID[id];
  if (!b || b.pending) return mount(root, h('h1', {}, b?.title || 'Unknown book'), h('p', { class: 'muted' }, 'This book is still being written.'));
  mount(root,
    h('p', { class: 'muted' }, h('a', { href: '#/study' }, 'Study guide'), ` / ${b.title}`),
    h('h1', {}, b.title),
    h('p', { class: 'muted' }, b.blurb),
    h('div', { class: 'row' }, h('a', { class: 'btn', href: `#/study/cheat/${b.id}` }, 'Cheat sheet'), lessonsOf(b).some((l) => l.kind === 'family') ? h('a', { class: 'btn', href: `#/study/drill/${b.id}` }, 'Recognition drill') : null),
    h('h2', {}, 'Which lesson does a question need?'),
    renderBlock({ type: 'diagram', diagram: 'flow', spec: b.tree.spec, caption: b.tree.caption || 'Follow the questions from the top; each answer box links to its lesson.' }, { rng: makeRng(1) }),
    ...b.chapters.map((c, ci) => h('section', {}, h('div', { class: 'spread' }, h('h2', {}, c.title),
      c.lessons.filter((l) => l.kind === 'family').length >= 2 ? h('a', { class: 'btn small', href: `#/study/mixed/${b.id}/${ci}` }, 'Mixed practice') : null),
      c.intro ? h('p', { class: 'muted' }, T(c.intro)) : null,
      h('div', { class: 'panel' }, h('table', {}, h('tbody', {}, c.lessons.map((l) => {
        const st = statusOf(store, l.id);
        return h('tr', {},
          h('td', {}, h('a', { href: `#/study/lesson/${l.id}` }, l.title), h('div', { class: 'muted small-note' }, T(l.summary))),
          h('td', { class: 'num muted', style: { textAlign: 'right', whiteSpace: 'nowrap' } }, `${minutes(l)} min`),
          h('td', { style: { textAlign: 'right' } }, st === 'review' ? h('a', { href: reviewHref(l.id), title: 'Review from memory' }, badge(st)) : badge(st)));
      })))))));
}

// `restore` (after a failed review) keeps every scaffold on for this visit.
export function lessonPage(root, { store, id, restore = false }) {
  const L = LESSON_BY_ID[id];
  if (!L) return mount(root, h('h1', {}, 'Lesson not found'), h('p', {}, h('a', { href: '#/study' }, 'Study guide')));
  const b = BOOK_BY_ID[L.book];
  const order = lessonsOf(b);
  const i = order.findIndex((x) => x.id === id);
  const statusEl = () => (statusOf(store, id) === 'review' ? [badge('review'), ' ', h('a', { class: 'small-note', href: reviewHref(id) }, 'Review from memory')] : badge(statusOf(store, id)));
  const status = h('span', {}, statusEl());
  const refresh = () => status.replaceChildren(...[statusEl()].flat());
  const fam = L.family ? familyOf(L.book, L.family) : null;
  const secs = sectionsOf(L);
  const k = secs.findIndex((s) => s.key === studyState(store)[id]?.lastSection);
  const goTo = (key) => root.querySelector(`#s-${key}`)?.scrollIntoView({ behavior: 'smooth' });
  mount(root,
    h('p', { class: 'muted' }, h('a', { href: '#/study' }, 'Study guide'), ' / ', h('a', { href: `#/study/book/${b.id}` }, b.title)),
    h('div', { class: 'spread' }, h('h1', {}, L.title), status),
    h('p', { class: 'muted' }, T(L.summary), ` · about ${minutes(L)} min`),
    k > 0 ? h('div', { class: 'row resume' }, h('button', { class: 'btn primary small', type: 'button', onclick: () => goTo(secs[k].key) }, `Continue at ${secs[k].title} (${k + 1} of ${secs.length})`)) : null,
    L.prerequisites?.length ? h('p', { class: 'small-note' }, 'Builds on: ', L.prerequisites.map((p, j) => [j ? ', ' : '', LESSON_BY_ID[p] ? h('a', { href: `#/study/lesson/${p}` }, LESSON_BY_ID[p].title) : p])) : null,
    renderLesson(root, L, { store, onProgress: refresh, restore }),
    h('div', { class: 'row study-nav' },
      order[i - 1] ? h('a', { class: 'btn', href: `#/study/lesson/${order[i - 1].id}` }, `Previous: ${order[i - 1].title}`) : null,
      h('span', { style: { flex: 1 } }),
      fam ? h('a', { class: 'btn', href: `#/run/${fam.section}/practice/${L.family}` }, 'Practise this type') : null,
      order[i + 1] ? h('a', { class: 'btn primary', href: `#/study/lesson/${order[i + 1].id}` }, `Next: ${order[i + 1].title}`) : null));
  // Remember the section in view (a heading in the top 40% of the screen) so the next visit can continue
  // there. The observer's first report is the load position, not reading, so it is skipped.
  if (typeof IntersectionObserver === 'undefined') return undefined;
  let first = true;
  const io = new IntersectionObserver((es) => {
    if (first) { first = false; return; }
    const hit = es.filter((e) => e.isIntersecting).pop();
    if (hit) setLastSection(store, id, hit.target.id.slice(2));
  }, { rootMargin: '0px 0px -60% 0px' });
  root.querySelectorAll('h2.study-section').forEach((el) => io.observe(el));
  return () => io.disconnect();
}

// Cheat sheet: every rule callout of the book, grouped by chapter, on one printable page.
// Recall mode hides each rule until the learner has tried to say it, and counts the ones recalled.
export function cheatPage(root, { id }) {
  const b = BOOK_BY_ID[id];
  if (!b || b.pending) return mount(root, h('h1', {}, 'Not available yet'));
  const draw = (recall) => {
    let recalled = 0, total = 0;
    const counter = h('span', { class: 'num', role: 'status' });
    const paint = () => { counter.textContent = `Recalled ${recalled} of ${total}`; };
    const cell = (rules) => {
      const shown = h('div', {}, rules.map((r) => h('div', {}, T(r))));
      if (!recall || !rules.length) return shown;
      total += 1;
      const tick = h('input', { type: 'checkbox', onchange: (e) => { recalled += e.target.checked ? 1 : -1; paint(); } });
      const wrap = h('div', {});
      wrap.append(h('button', { class: 'btn small', type: 'button', onclick: () => wrap.replaceChildren(shown, h('label', { class: 'tick small-note' }, tick, 'I recalled this')) }, 'Recall, then reveal'));
      return wrap;
    };
    const chapters = b.chapters.map((c) => h('section', { class: 'cheat' }, h('h2', {}, c.title), h('table', {}, h('tbody', {}, c.lessons.map((l) => {
      const rules = l.blocks.filter((x) => x.type === 'callout' && x.tone === 'rule').map((x) => (typeof x.text === 'function' ? '' : x.text)).filter(Boolean);
      return h('tr', {}, h('td', { style: { width: '32%' } }, h('a', { href: `#/study/lesson/${l.id}` }, l.title)), h('td', { class: 'rule-cell' }, cell(rules)));
    })))));
    mount(root,
      h('p', { class: 'muted' }, h('a', { href: `#/study/book/${b.id}` }, b.title), ' / Cheat sheet'),
      h('h1', {}, `${b.title}: cheat sheet`),
      h('p', { class: 'muted' }, recall ? 'Recall mode: say each lesson\'s rule aloud or write it down, then reveal it and tick the ones you had.' : 'Every rule from this book. Print it, or read it the night before.'),
      h('div', { class: 'row cheat-tools' }, h('button', { class: 'btn', type: 'button', 'aria-pressed': String(recall), onclick: () => draw(!recall) }, recall ? 'Recall mode: on' : 'Recall mode: off'), recall ? counter : null),
      ...chapters);
    paint();
  };
  draw(false);
}

// Recognition drill: fresh questions from the book's families; name the method before solving.
export function drillPage(root, { id }) {
  const b = BOOK_BY_ID[id];
  if (!b || b.pending) return mount(root, h('h1', {}, 'Not available yet'));
  const fams = lessonsOf(b).filter((l) => l.kind === 'family');
  const rng = makeRng(`drill:${id}:${Date.now()}`);
  const picks = rng.shuffle(fams).slice(0, 10);
  let score = 0, answered = 0;
  const tally = h('p', { class: 'muted' });
  const cards = picks.map((l) => {
    const f = familyOf(l.book, l.family);
    const lv = f.family.levels?.length ? f.family.levels : [1];
    const item = f.family.generate(rng.fork(l.id), { difficulty: rng.pick(lv) });
    const others = rng.shuffle(fams.filter((x) => x.id !== l.id)).slice(0, 3);
    const opts = rng.shuffle([l, ...others]);
    const fb = h('div', {});
    let visual = null;
    try { if (item.prompt.visual) visual = renderVisual(item.prompt.visual); } catch { /* optional */ }
    const buttons = h('div', { class: 'check-options' }, opts.map((o) => h('button', { class: 'btn small', type: 'button', onclick: () => {
      if (fb.childNodes.length) return;
      const right = o.id === l.id;
      answered += 1; score += right ? 1 : 0;
      tally.textContent = `${score} of ${answered} named correctly.`;
      fb.append(h('div', { class: `feedback ${right ? 'ok' : 'no'}` }, h('strong', {}, right ? 'Right method. ' : 'Different method. '), 'This is ', h('a', { href: `#/study/lesson/${l.id}` }, l.title), '. ', T(rulesOf(l)[0] || '')));
    } }, o.title)));
    return h('div', { class: 'panel' }, h('p', { class: 'prompt' }, item.prompt.text), visual, h('p', { class: 'muted small-note' }, 'Which method? Decide before solving.'), buttons, fb);
  });
  mount(root, h('p', { class: 'muted' }, h('a', { href: `#/study/book/${b.id}` }, b.title), ' / Recognition drill'),
    h('h1', {}, `${b.title}: recognition drill`),
    h('p', { class: 'muted' }, 'Ten fresh questions. Name the method first: recognising the type is half the time saved in the real test.'), tally, ...cards,
    h('a', { class: 'btn', href: `#/study/drill/${id}`, onclick: () => setTimeout(() => location.reload(), 0) }, 'New drill'));
}

// Interleaved practice: two fresh questions per family of one chapter, shuffled so no type
// repeats back to back. The type is hidden until you answer, so choosing the method is part of the test.
export function mixedPage(root, { store, id, chapter }) {
  const b = BOOK_BY_ID[id];
  const c = b && !b.pending ? b.chapters[chapter] : null;
  const fams = c ? c.lessons.filter((l) => l.kind === 'family') : [];
  if (fams.length < 2) return mount(root, h('h1', {}, 'Not available'), h('p', { class: 'muted' }, 'Mixed practice needs a chapter with at least two question types.'));
  const rng = makeRng(`mixed:${id}:${chapter}:${Date.now()}`);
  const items = interleave(fams.flatMap((l) => {
    const f = familyOf(l.book, l.family).family;
    const lv = f.levels?.length ? f.levels : [1];
    return [0, 1].map((k) => ({ key: l.family, item: f.generate(rng.fork(`${l.id}:${k}`), { difficulty: lv[Math.min(k + 1, lv.length - 1)] }) }));
  }), rng);
  const area = h('div', {});
  mount(root, h('p', { class: 'muted' }, h('a', { href: `#/study/book/${b.id}` }, b.title), ` / ${c.title} / Mixed practice`),
    h('h1', {}, `Mixed practice: ${c.title}`),
    h('p', { class: 'muted' }, `${items.length} questions from ${fams.length} types, shuffled. Decide which method each one needs before you solve it.`), area);
  return runFeedbackSession(area, { sectionId: fams[0].book, mode: 'practice', items, store, title: `Mixed: ${c.title}` });
}

// Greedy order: always take the type with the most items left that differs from the last one
// (random tie-break). This never repeats a type back to back when any such order exists.
export function interleave(xs, rng) {
  const groups = new Map();
  for (const x of rng.shuffle(xs)) groups.set(x.key, [...(groups.get(x.key) || []), x.item]);
  const out = [];
  let last = null;
  while (out.length < xs.length) {
    const keys = rng.shuffle([...groups.keys()].filter((k) => groups.get(k).length));
    const pick = keys.filter((k) => k !== last).sort((a, b) => groups.get(b).length - groups.get(a).length)[0] ?? keys[0];
    out.push(groups.get(pick).pop());
    last = pick;
  }
  return out;
}

const rulesOf = (l) => l.blocks.filter((x) => x.type === 'callout' && x.tone === 'rule' && typeof x.text === 'string').map((x) => x.text);

// ---------------------------------------------------------------- study management

// Rule callouts of a lesson, split into sentences the learner can tick against a recall.
function ruleSentences(L) {
  const ctx = { lesson: L, rng: makeRng(`rules:${L.id}`) };
  return L.blocks.filter((b) => b.type === 'callout' && b.tone === 'rule').flatMap((b) => {
    let t = '';
    try { t = typeof b.text === 'function' ? b.text(ctx) : b.text; } catch { /* a generated rule that needs more context */ }
    return String(t || '').split(/(?<=[.!?])\s+(?=[A-Z0-9"(*])/).map((x) => x.trim()).filter(Boolean);
  });
}

// Fresh generated items from the lesson's try-it family (one item: a middle difficulty).
function freshItems(L, n, seed) {
  const t = L.blocks.find((b) => b.type === 'tryit' && b.family);
  const f = t && familyOf(t.section, t.family);
  if (!f) return null;
  const rng = makeRng(seed);
  const levels = f.family.levels?.length ? f.family.levels : [1];
  const level = (i) => levels[Math.min(n === 1 ? levels.length >> 1 : i, levels.length - 1)];
  return { f, items: Array.from({ length: n }, (_, i) => f.family.generate(rng.fork(`t${i}`), { difficulty: level(i) })) };
}

// The check questions behind a unit name, as render.js names units: a check block's scope,
// a derivation move ("move 3: first seven words…"), or the transfer block.
function unitQuestions(L, unit) {
  if (!unit) return null;
  for (const b of L.blocks) {
    if (b.type === 'check' && b.scope === unit) return { questions: b.questions, scope: b.scope, unit };
    if (b.type === 'steps') {
      const i = b.steps.findIndex((st, j) => st.checks?.length && moveUnit(j, st) === unit);
      if (i >= 0) return { questions: b.steps[i].checks, scope: null, unit };
    }
    if (b.type === 'transfer' && unit === 'transfer: near, far, principle') return { questions: [b.near, b.far, b.principle], scope: 'the principle of this lesson, in new settings', unit };
  }
  return null;
}

// Review by recall: write the rule from memory, compare with the rule callouts, then fresh
// questions without hints. A pass moves the lesson up a review box; a miss brings the scaffolds back.
export function reviewPage(root, { store, id }) {
  const L = LESSON_BY_ID[id];
  if (!L) return mount(root, h('h1', {}, 'Lesson not found'), h('p', {}, h('a', { href: '#/study' }, 'Study guide')));
  const now = Date.now();
  const x = studyState(store)[id] || {};
  const cleanups = [];
  const rules = ruleSentences(L);

  // Step 1: recall
  const ta = h('textarea', { id: 'recall-text', class: 'study-text', rows: 4, placeholder: 'When it applies, what you compute, and the trap to avoid' });
  let conf = null;
  const confRow = h('div', { class: 'row', role: 'group', 'aria-label': 'How sure are you' }, [1, 2, 3, 4, 5].map((n) => h('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false', onclick: (e) => {
    conf = n;
    confRow.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y === e.currentTarget)));
  } }, String(n))));
  const note1 = h('span', { class: 'small-note muted', role: 'status' });
  const compareBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    if (words(ta.value) < 5) { note1.textContent = 'Write at least five words from memory first.'; ta.focus(); return; }
    if (!conf) { note1.textContent = 'Pick how sure you are, 1 to 5.'; return; }
    ta.readOnly = true; compareBtn.hidden = true; note1.textContent = '';
    confRow.querySelectorAll('button').forEach((y) => { y.disabled = true; });
    step2.hidden = false;
    step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } }, 'Compare with the rule');
  const step1 = h('section', {}, h('h2', {}, 'Step 1 of 3: recall'),
    h('div', { class: 'panel' },
      h('label', { for: 'recall-text' }, h('strong', {}, `Write the rule for ${L.title} from memory.`), ' No peeking: the effort of recalling is what makes it stick.'),
      ta,
      h('p', { class: 'small-note', style: { margin: '8px 0 4px' } }, 'How sure are you? (1 = guessing, 5 = certain)'), confRow,
      h('div', { class: 'row', style: { marginTop: '12px' } }, compareBtn, note1)));

  // Step 2: compare
  let covered = 0;
  const coveredEl = h('span', { class: 'num' }, `0 of ${rules.length}`);
  const ticks = rules.map(() => h('input', { type: 'checkbox', onchange: (e) => { covered += e.target.checked ? 1 : -1; coveredEl.textContent = `${covered} of ${rules.length}`; } }));
  const testBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    logEvent(store, { kind: 'recall', lesson: id, confidence: conf, covered, total: rules.length });
    store.save();
    testBtn.hidden = true; ticks.forEach((t) => { t.disabled = true; });
    step3.hidden = false;
    startTest();
    step3.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } }, 'Step 3: fresh questions without hints');
  const step2 = h('section', { hidden: true }, h('h2', {}, 'Step 2 of 3: compare'),
    h('div', { class: 'panel' },
      rules.length ? [h('p', { class: 'small-note' }, 'Tick each rule sentence your recall covered. An unticked sentence is the link to re-learn.'),
        h('ul', { class: 'plain' }, rules.map((r, i) => h('li', {}, h('label', { class: 'tick' }, ticks[i], h('span', {}, T(r)))))),
        h('p', { class: 'small-note' }, 'Covered: ', coveredEl)]
        : h('p', { class: 'muted' }, 'This lesson has no rule callout. Compare with its summary: ', T(L.summary)),
      testBtn));

  // Step 3: unassisted questions
  const body3 = h('div', {});
  const result = h('div', {});
  const step3 = h('section', { hidden: true }, h('h2', {}, 'Step 3 of 3: questions without hints'), body3, result);
  const finish = (r) => {
    const pass = recordTry(store, id, { ...r, kind: 'review' });
    const st = studyState(store)[id];
    if (pass) {
      result.replaceChildren(h('div', { class: 'panel' }, h('p', {}, h('span', { class: 'badge ok' }, 'Passed'), ` ${r.clean} of ${r.n} right first time without hints. Next review in ${Math.round((st.due - Date.now()) / DAY)} days.`),
        h('a', { class: 'btn primary', href: '#/study' }, 'Back to Next up')));
      return;
    }
    const weak = Object.entries(st.units || {}).filter(([, u]) => u.last === false).map(([k]) => k);
    result.replaceChildren(h('div', { class: 'panel' },
      h('p', {}, h('span', { class: 'badge no' }, 'Not yet'), ` ${r.clean} of ${r.n} right first time without hints. The lesson stays due, and its scaffolds come back on.`),
      weak.length ? [h('p', { class: 'small-note' }, 'Weak units in this lesson:'), capped(h('ul', { class: 'plain' }, weak.map((w) => h('li', {}, w))))]
        : h('p', { class: 'small-note muted' }, 'No single unit is flagged: start at the Rule section.'),
      h('a', { class: 'btn primary', href: `#/study/lesson/${id}/restore` }, 'Scaffolds back on for this visit')));
  };
  const startTest = () => {
    const fresh = freshItems(L, 3, `review:${id}:${Date.now()}`);
    const mastery = L.blocks.find((b) => b.type === 'check' && b.mastery);
    const game = L.blocks.find((b) => b.type === 'tryit' && b.game)?.game;
    if (fresh) {
      const area = h('div', { class: 'study-unassisted' });
      body3.replaceChildren(area);
      cleanups.push(runFeedbackSession(area, { sectionId: fresh.f.section, mode: 'learn', items: fresh.items, store, title: 'Review', noHints: true, diagnose: true,
        onMiss: (d) => recordMiss(store, { belief: d.item.options?.[d.response?.choice]?.misconception || d.belief, lesson: id, unit: 'try-it', type: d.type }),
        onDone: finish }));
    } else if (mastery) {
      body3.replaceChildren(h('div', { class: 'study-unassisted' }, checkBlock(mastery.questions, { lesson: L, store, rng: makeRng(`review:${id}:${Date.now()}`), noHints: true }, mastery.scope, finish)));
    } else if (game) {
      body3.replaceChildren(h('p', {}, 'A game review is an exam run: meet the target again.'), h('a', { class: 'btn primary', href: `#/zapn/${game}/exam` }, 'Exam run'));
    } else {
      body3.replaceChildren(h('p', { class: 'muted' }, 'This lesson has no question set, so the recall above is the review.'), h('a', { class: 'btn primary', href: `#/study/lesson/${id}` }, 'Open the lesson'));
    }
  };

  mount(root,
    crumbs(h('a', { href: `#/study/book/${L.book}` }, BOOK_BY_ID[L.book].title), 'Review'),
    h('h1', {}, `Review: ${L.title}`),
    h('p', { class: 'muted' }, `Three steps, about ${REVIEW_MIN} min: recall the rule from memory, compare, then fresh questions without hints.`,
      x.lastTry ? ` Last test ${ago(x.lastTry.at, now)}: ${x.lastTry.clean} of ${x.lastTry.n} clean.` : ''),
    step1, step2, step3);
  return () => cleanups.forEach((f) => f());
}

// Mistake log: misses grouped by the false belief behind them, across lessons.
const TYPE_LABEL = { slip: 'slip', idea: 'missing idea', method: 'wrong method', misread: 'misread' };
export function mistakesPage(root, { store, key = null }) {
  const now = Date.now();
  const open = openBeliefs(store);
  const cleared = Object.values(studyMeta(store).beliefs).filter((b) => !b.open).length;
  const cleanups = [];
  const target = open.some((b) => b.key === key) ? key : null;
  const rows = open.map((b, i) => beliefRow(store, b, now, target ? b.key === target : i === 0, cleanups));
  mount(root,
    crumbs('Mistake log'),
    h('h1', {}, 'Mistake log'),
    h('p', { class: 'muted' }, `${open.length} open · ${cleared} cleared. Each row is one false belief behind your misses, merged across lessons. A belief clears after two clean re-tests on different days.`),
    open.length ? capped(h('div', { class: 'belief-list' }, rows))
      : h('div', { class: 'panel' }, h('p', { class: 'muted' }, 'No open mistakes. Misses in checks, try-its and reviews land here, grouped by the belief behind them.'), h('a', { class: 'btn primary', href: '#/study' }, 'Back to Next up')));
  if (target) {
    const row = rows[open.findIndex((b) => b.key === target)];
    row.hidden = false;
    row.querySelector('[data-retest]')?.click();
    row.scrollIntoView({ block: 'start' });
  }
  return () => cleanups.forEach((f) => f());
}

function beliefRow(store, b, now, primary, cleanups) {
  const lessonId = LESSON_BY_ID[b.unit?.lesson] ? b.unit.lesson : [...b.lessons].reverse().find((id) => LESSON_BY_ID[id]);
  const L = LESSON_BY_ID[lessonId];
  const ifThen = L ? studyState(store)[L.id]?.reflection?.ifThen : null;
  const see = h('input', { type: 'text', class: 'study-input', value: b.plan?.see ?? ifThen?.if ?? '', placeholder: 'the signal, e.g. "at least one"' });
  const will = h('input', { type: 'text', class: 'study-input', value: b.plan?.will ?? ifThen?.then ?? '', placeholder: 'the action, e.g. compute 1 − P(none) first' });
  const saved = h('span', { class: 'small-note muted', role: 'status' });
  const save = () => { if (see.value.trim() && will.value.trim()) { setBeliefPlan(store, b.key, { see: see.value.trim(), will: will.value.trim() }); saved.textContent = 'Saved.'; } };
  see.addEventListener('change', save); will.addEventListener('change', save);
  const types = Object.entries(b.types || {}).map(([t, n]) => `${n} ${TYPE_LABEL[t] || t}`).join(', ') || 'error type not named';
  const lessons = b.lessons.filter((id) => LESSON_BY_ID[id]).map((id, i) => [i ? ', ' : '', h('a', { href: `#/study/lesson/${id}` }, LESSON_BY_ID[id].title)]);
  const area = h('div', { class: 'study-unassisted study-inline-run' });
  const out = h('span', { class: 'small-note', role: 'status' });
  const done = (clean) => {
    const gone = recordRetest(store, b.key, clean);
    const days = studyMeta(store).beliefs[b.key]?.clean.length || 0;
    out.replaceChildren(h('span', { class: `badge ${clean ? 'ok' : 'no'}` }, gone ? 'Cleared' : clean ? 'Clean' : 'Missed'), ' ',
      gone ? 'Two clean re-tests on different days: this belief is cleared.' : clean ? `${days} of 2 clean days. Re-test again tomorrow to clear it.` : 'The belief stays open. Re-read the unit, then re-test tomorrow.');
  };
  const btn = h('button', { class: `btn small${primary ? ' primary' : ''}`, type: 'button', 'data-retest': '', onclick: () => { btn.hidden = true; retest(area, store, b, L, done, cleanups); } }, `Re-test · ${RETEST_MIN} min`);
  return h('div', { class: 'panel belief' },
    h('div', { class: 'spread' }, h('strong', {}, T(b.text)), h('span', { class: 'badge', title: 'Times missed' }, `${b.count}×`)),
    h('p', { class: 'small-note muted' }, `Last seen ${ago(b.last, now)} · ${types}`, lessons.length ? [' · ', lessons] : null),
    h('div', { class: 'belief-plan' }, h('label', {}, 'Next time I see', see), h('label', {}, 'I will', will)), saved,
    h('div', { class: 'row' }, btn, out), area);
}

// One fresh question on the unit where the belief last showed up: that unit's check, else an item
// of the lesson's family, else the lesson's mastery questions.
function retest(area, store, b, L, done, cleanups) {
  if (!L) return area.replaceChildren(h('p', { class: 'muted small-note' }, 'The lesson behind this belief is not available.'));
  const ctx = () => ({ lesson: L, store, rng: makeRng(`retest:${L.id}:${Date.now()}`), noHints: true });
  const q = unitQuestions(L, b.unit?.lesson === L.id ? b.unit.unit : null);
  if (q) return area.replaceChildren(checkBlock(q.questions, ctx(), q.scope, (r) => done(r.clean >= r.n), q.unit));
  const fresh = freshItems(L, 1, `retest:${L.id}:${Date.now()}`);
  if (fresh) {
    return cleanups.push(runFeedbackSession(area, { sectionId: fresh.f.section, mode: 'learn', items: fresh.items, store, title: 'Re-test', noHints: true,
      onDone: (r) => done(r.n >= 1 && r.clean >= r.n) }));
  }
  const m = L.blocks.find((x) => x.type === 'check' && x.mastery);
  if (m) return area.replaceChildren(checkBlock(m.questions, ctx(), m.scope, (r) => done(r.clean >= r.n)));
  return area.replaceChildren(h('p', { class: 'muted small-note' }, 'No fresh question for this belief yet. ', h('a', { href: `#/study/lesson/${L.id}` }, `Re-read ${L.title}`), '.'));
}

// Weekly review: the learner reads the numbers and names the pattern first; only then the app's
// reading appears, and the week ends with one goal about how to study.
export function weekPage(root, { store }) {
  const now = Date.now();
  const meta = studyMeta(store);
  const { cur, prev } = weekStats({ log: meta.log, study: studyState(store) }, now);
  const open = openBeliefs(store);
  const pc = (v) => `${Math.round(100 * v)}%`;
  const ROWS = [
    ['First-attempt clean rate on checks', (s) => (s.checks ? `${pc(s.clean)} of ${s.checks}` : 'none')],
    ['Checks where you opened a hint', (s) => (s.checks ? pc(s.hints) : 'none')],
    ['Try-it and review passes', (s) => (s.tries ? `${s.passed} of ${s.tries}` : 'none')],
    ['Time per question against the exam budget', (s) => (s.timedItems ? `${pc(s.paceMedian)} median · ${s.inBudget} of ${s.timedItems} in time` : 'none timed')],
    ['Reviews done / still due', (s) => `${s.reviewsDone} / ${s.reviewsDue}`],
    ['Confidence minus results', (s) => (s.calGap == null ? 'no ratings' : `${s.calGap > 0 ? '+' : ''}${Math.round(100 * s.calGap)} points`)],
    ['Days studied', (s) => String(s.days)],
  ];
  const ta = h('textarea', { id: 'week-pattern', class: 'study-text', rows: 3, placeholder: 'e.g. I opened hints a lot on Bayes and still missed the same step' });
  const note = h('span', { class: 'small-note muted', role: 'status' });
  const goalIn = h('input', { id: 'week-goal', type: 'text', class: 'study-input goal-input', placeholder: 'e.g. Do every try-it without hints before opening a solution' });
  const goalNote = h('p', { class: 'small-note', role: 'status' });
  const goalBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    const t = goalIn.value.trim();
    if (!goalIsHow(t)) { goalNote.textContent = 'Say how you will study, not only what: use a verb like review, test, time or explain, or "without hints".'; goalIn.focus(); return; }
    setGoal(store, t);
    goalBtn.disabled = true; goalIn.readOnly = true;
    goalNote.textContent = 'Saved. It shows on the Study home, and in a week you check whether you kept it.';
  } }, 'Set this goal');
  const reading = h('section', { hidden: true }, h('h2', {}, 'The app\'s reading'),
    h('div', { class: 'panel' }, h('ul', { class: 'study-list' }, readWeek(cur, prev, open.length).map((r) => h('li', {}, r)))),
    h('h2', {}, 'One goal for next week: how you will study'),
    h('div', { class: 'panel' }, h('label', { for: 'week-goal', class: 'small-note' }, 'A habit, not a topic. "Bayes" is a topic; "do Bayes try-its without hints" is a goal.'), h('div', { class: 'row', style: { marginTop: '6px' } }, goalIn, goalBtn), goalNote));
  const readBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    if (words(ta.value) < 3) { note.textContent = 'Write what you see first: one sentence is enough.'; ta.focus(); return; }
    logEvent(store, { kind: 'week-note', text: ta.value.trim() }, Date.now());
    store.save();
    ta.readOnly = true; readBtn.hidden = true; note.textContent = '';
    reading.hidden = false;
    reading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } }, 'Show the app\'s reading');
  mount(root,
    crumbs('Weekly review'),
    h('h1', {}, 'Weekly review'),
    h('p', { class: 'muted' }, 'The last 7 days against the 7 before. Read the numbers, write the pattern you see, then set one goal for how you will study next week.'),
    goalBox(store, now, true),
    h('div', { class: 'panel' }, h('table', { class: 'week-table' },
      h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', { style: { textAlign: 'right' } }, 'Last 7 days'), h('th', { style: { textAlign: 'right' } }, 'The 7 before'))),
      h('tbody', {}, ROWS.map(([label, fmt]) => h('tr', {}, h('td', {}, label), h('td', { class: 'num' }, fmt(cur)), h('td', { class: 'num muted' }, fmt(prev))))))),
    open.length ? h('div', { class: 'panel' }, h('h2', { style: { marginTop: 0 } }, `Recurring mistakes (${open.length} open)`),
      h('ul', { class: 'plain' }, open.slice(0, 3).map((b) => h('li', {}, T(b.text), h('span', { class: 'muted' }, ` · ${b.count}×`)))),
      h('p', { class: 'small-note', style: { margin: '8px 0 0' } }, h('a', { href: '#/study/mistakes' }, 'Open the mistake log'))) : null,
    h('h2', {}, 'What pattern do you see in your week?'),
    h('div', { class: 'panel' }, h('label', { for: 'week-pattern', class: 'small-note' }, 'Before the app says anything: what went well, what did not, and why?'), ta, h('div', { class: 'row' }, readBtn, note)),
    reading);
}
