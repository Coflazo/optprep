import { h, mount } from '../ui/dom.js';
import { BOOKS, BOOK_BY_ID, LESSON_BY_ID } from './content/index.js';
import { lessonsOf, wordCount } from './schema.js';
import { renderLesson, renderBlock, familyOf } from './render.js';
import { statusOf, dueLessons } from './progress.js';
import { renderInline } from './markup.js';
import { makeRng } from '../core/rng.js';
import { renderVisual } from '../ui/visuals/index.js';
import { runFeedbackSession } from '../ui/runner.js';

const T = (s) => renderInline(s, h);
const BADGE = { new: ['', 'New'], read: ['warn', 'Read'], mastered: ['ok', 'Mastered'], review: ['no', 'Review due'] };
const badge = (st) => h('span', { class: `badge ${BADGE[st][0]}` }, BADGE[st][1]);
const minutes = (L) => L.minutes ?? Math.max(4, Math.round(wordCount(L) / 170 + (L.blocks.filter((b) => b.type === 'check' || b.type === 'steps').length * 1.5)));

export function studyHome(root, { store }) {
  const due = dueLessons(store).filter((id) => LESSON_BY_ID[id]);
  mount(root,
    h('h1', {}, 'Study guide'),
    h('p', { class: 'muted' }, 'Every question type, taught from first principles: a picture first, the derivation one move at a time with a check after each move, live worked examples, the traps, speed tricks, and a rule to keep. A lesson is mastered after three fresh questions in a row without hints, and it comes back for review.'),
    due.length ? h('div', { class: 'panel' }, h('h2', { style: { marginTop: 0 } }, `Due for review (${due.length})`), h('ul', { class: 'plain' }, due.slice(0, 10).map((id) => h('li', {}, h('a', { href: `#/study/lesson/${id}` }, LESSON_BY_ID[id].title))))) : null,
    h('div', { class: 'panel' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Book'), h('th', { style: { textAlign: 'right' } }, 'Lessons'), h('th', { style: { textAlign: 'right' } }, 'Mastered'), h('th', {}))),
      h('tbody', {}, BOOKS.map((b) => {
        const ls = b.pending ? [] : lessonsOf(b);
        const m = ls.filter((l) => ['mastered', 'review'].includes(statusOf(store, l.id))).length;
        return h('tr', {},
          h('td', {}, h('a', { href: `#/study/book/${b.id}` }, b.title), h('div', { class: 'muted small-note' }, b.blurb)),
          h('td', { class: 'num', style: { textAlign: 'right' } }, b.pending ? '—' : String(ls.length)),
          h('td', { class: 'num', style: { textAlign: 'right' } }, b.pending ? '—' : `${m}/${ls.length}`),
          h('td', { style: { textAlign: 'right' } }, b.pending ? h('span', { class: 'badge warn' }, 'Being written') : h('a', { class: 'btn small', href: `#/study/book/${b.id}` }, 'Open')));
      })))));
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
      h('div', { class: 'panel' }, h('table', {}, h('tbody', {}, c.lessons.map((l) => h('tr', {},
        h('td', {}, h('a', { href: `#/study/lesson/${l.id}` }, l.title), h('div', { class: 'muted small-note' }, T(l.summary))),
        h('td', { class: 'num muted', style: { textAlign: 'right', whiteSpace: 'nowrap' } }, `${minutes(l)} min`),
        h('td', { style: { textAlign: 'right' } }, badge(statusOf(store, l.id)))))))))));
}

export function lessonPage(root, { store, id }) {
  const L = LESSON_BY_ID[id];
  if (!L) return mount(root, h('h1', {}, 'Lesson not found'), h('p', {}, h('a', { href: '#/study' }, 'Study guide')));
  const b = BOOK_BY_ID[L.book];
  const order = lessonsOf(b);
  const i = order.findIndex((x) => x.id === id);
  const status = h('span', {}, badge(statusOf(store, id)));
  const refresh = () => status.replaceChildren(badge(statusOf(store, id)));
  const fam = L.family ? familyOf(L.book, L.family) : null;
  mount(root,
    h('p', { class: 'muted' }, h('a', { href: '#/study' }, 'Study guide'), ' / ', h('a', { href: `#/study/book/${b.id}` }, b.title)),
    h('div', { class: 'spread' }, h('h1', {}, L.title), status),
    h('p', { class: 'muted' }, T(L.summary), ` · about ${minutes(L)} min`),
    L.prerequisites?.length ? h('p', { class: 'small-note' }, 'Builds on: ', L.prerequisites.map((p, k) => [k ? ', ' : '', LESSON_BY_ID[p] ? h('a', { href: `#/study/lesson/${p}` }, LESSON_BY_ID[p].title) : p])) : null,
    renderLesson(root, L, { store, onProgress: refresh }),
    h('div', { class: 'row study-nav' },
      order[i - 1] ? h('a', { class: 'btn', href: `#/study/lesson/${order[i - 1].id}` }, `Previous: ${order[i - 1].title}`) : null,
      h('span', { style: { flex: 1 } }),
      fam ? h('a', { class: 'btn', href: `#/run/${fam.section}/practice/${L.family}` }, 'Practise this type') : null,
      order[i + 1] ? h('a', { class: 'btn primary', href: `#/study/lesson/${order[i + 1].id}` }, `Next: ${order[i + 1].title}`) : null));
}

// Cheat sheet: every rule callout of the book, grouped by chapter, on one printable page.
export function cheatPage(root, { id }) {
  const b = BOOK_BY_ID[id];
  if (!b || b.pending) return mount(root, h('h1', {}, 'Not available yet'));
  mount(root,
    h('p', { class: 'muted' }, h('a', { href: `#/study/book/${b.id}` }, b.title), ' / Cheat sheet'),
    h('h1', {}, `${b.title}: cheat sheet`),
    h('p', { class: 'muted' }, 'Every rule from this book. Print it, or read it the night before.'),
    ...b.chapters.map((c) => h('section', { class: 'cheat' }, h('h2', {}, c.title), h('table', {}, h('tbody', {}, c.lessons.map((l) => {
      const rules = l.blocks.filter((x) => x.type === 'callout' && x.tone === 'rule').map((x) => (typeof x.text === 'function' ? '' : x.text)).filter(Boolean);
      return h('tr', {}, h('td', { style: { width: '32%' } }, h('a', { href: `#/study/lesson/${l.id}` }, l.title)), h('td', { class: 'rule-cell' }, rules.map((r) => h('div', {}, T(r)))));
    }))))));
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
