import { h, mount } from '../dom.js';
import { SECTIONS } from '../../../config/sections.js';
import { SECTION_MODULES } from '../../sections/index.js';
import { makeRng } from '../../core/rng.js';
import { runFeedbackSession } from '../runner.js';

// Learn mode follows the learner profile cycle:
// purpose → anchor → derivation one move at a time → prediction before the
// reveal → compact rule and contrast → fresh test on new numbers.
export function learnPage(root, { store, id, family }) {
  const mod = SECTION_MODULES[id];
  const f = mod?.families.find((x) => x.id === family);
  if (!f) return mount(root, h('h1', {}, 'Unknown family'));
  const L = f.lesson;
  let shown = 1;
  const stepList = h('ol', { class: 'steps' });
  const nextBtn = h('button', { class: 'btn small', type: 'button', onclick: () => { shown++; renderSteps(); } }, 'Next move');
  const predictBox = h('div', { hidden: true });
  const ruleBox = h('div', { hidden: true });
  const testBox = h('div', {});

  function renderSteps() {
    stepList.replaceChildren(...L.steps.slice(0, shown).map((s, i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)), h('div', {}, s.say), h('div', { class: 'why' }, s.why))));
    nextBtn.hidden = shown >= L.steps.length;
    predictBox.hidden = shown < L.steps.length;
  }

  const guess = h('input', { type: 'text', 'aria-label': 'Your prediction', placeholder: 'Your prediction', style: { minWidth: '280px' } });
  const reveal = h('div', { hidden: true, class: 'feedback' }, h('strong', {}, 'Answer. '), L.predict.answer, L.predict.explain ? h('div', { class: 'muted' }, L.predict.explain) : null);
  const revealBtn = h('button', { class: 'btn', type: 'button', onclick: () => {
    if (!guess.value.trim()) { guess.focus(); guess.placeholder = 'Commit to a guess first'; return; }
    reveal.hidden = false; ruleBox.hidden = false; revealBtn.disabled = true;
  } }, 'Reveal');
  predictBox.append(h('h2', {}, 'Predict before you look'), h('p', {}, L.predict.question), h('div', { class: 'row' }, guess, revealBtn), reveal);
  ruleBox.append(
    h('h2', {}, 'Rule'), h('div', { class: 'rule' }, L.rule),
    L.contrast ? h('p', { class: 'muted', style: { marginTop: '8px' } }, `Not to be confused with: ${L.contrast}`) : null,
    h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', type: 'button', onclick: startTest }, 'Fresh test: 3 new questions')));

  function startTest() {
    const rng = makeRng(`learn:${f.id}:${Date.now()}`);
    const levels = f.levels?.length ? f.levels : [1];
    const items = [0, 1, 2].map((i) => f.generate(rng.fork(`t${i}`), { difficulty: levels[Math.min(i, levels.length - 1)] }));
    ruleBox.querySelector('button.primary').disabled = true;
    runFeedbackSession(testBox, { sectionId: id, mode: 'learn', items, store, title: f.title });
    testBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderSteps();
  mount(root,
    h('p', { class: 'muted' }, h('a', { href: `#/s/${id}` }, SECTIONS[id].title), ' / Learn'),
    h('h1', {}, f.title),
    h('p', { class: 'muted' }, f.skill),
    h('div', { class: 'panel' },
      h('h2', { style: { marginTop: 0 } }, 'What it is for'), h('p', {}, L.purpose),
      h('h2', {}, 'Start from what you know'), h('p', {}, L.anchor),
      h('h2', {}, 'Derivation, one move at a time'), stepList, nextBtn,
      predictBox, ruleBox),
    testBox);
}
