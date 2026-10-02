import { h } from './dom.js';
import { fmtNum } from '../core/format.js';
import { positionOutcome } from '../core/check.js';
import { renderDiagram } from '../study/diagrams/index.js';
import { lessonForFamily } from '../study/catalog.js';

// Feedback follows the learner profile: on a miss, name the exact false belief
// first ("your reasoning broke here"), then let the solution unfold one step at a
// time, then compress it into the rule.
export function feedbackBanner(item, result, response) {
  if (result.skipped) return h('div', { class: 'feedback' }, h('strong', {}, 'Skipped. '), 'Scores 0. Worth it when you are less than 50% sure under the −1 rule.');
  if (result.correct && item.kind !== 'interval') return h('div', { class: 'feedback ok' }, h('strong', {}, 'Correct.'), item.kind === 'orderbook' && result.profit != null ? ` Locked in ${fmtNum(result.profit)}.` : null);
  const parts = [];
  if (item.kind === 'mcq') {
    const picked = item.options[response?.choice];
    parts.push(h('strong', {}, 'Not quite. '));
    // misconception is a string; `step` (on the option, or a {text, step} misconception) names
    // the solution step that this belief breaks, counted from 1.
    const m = picked?.misconception;
    const belief = typeof m === 'object' && m ? m.text : m;
    const at = picked?.step ?? (typeof m === 'object' && m ? m.step : null);
    const broken = Number.isInteger(at) ? item.solution?.steps?.[at - 1] : null;
    if (belief) parts.push(h('div', {}, 'Your answer ', h('span', { class: 'num' }, picked.label), ' is what you get if you: ', h('em', {}, belief)));
    if (broken) parts.push(h('div', { class: 'small-note' }, `That belief breaks step ${at}: ${broken.say}`));
    parts.push(h('div', { class: 'muted' }, 'Correct answer: ', h('span', { class: 'num' }, item.options[item.answerIndex].label)));
  } else if (item.kind === 'rank') {
    parts.push(h('strong', {}, 'Order was off. '), 'One point needs all three in the exact order. The probabilities are shown next to each statement.');
  } else if (item.kind === 'interval') {
    const r = response;
    const inside = r && item.truth >= r.lower && item.truth <= r.upper;
    parts.push(h('strong', {}, result.score > 0 ? `Scored ${result.score.toFixed(2)}. ` : 'Scored 0. '));
    parts.push(`True value: ${fmtNum(item.truth)}${item.unit ? ` ${item.unit}` : ''}. `);
    if (r && !inside) parts.push(r.lower > item.truth ? 'Your lower bound was above the truth.' : 'Your upper bound was below the truth.');
    else if (r && r.lower <= 0) parts.push('A lower bound of 0 always scores 0.');
    else if (r) parts.push(`Width cost you ${(1 - result.score).toFixed(2)}.`);
    return h('div', { class: `feedback ${result.score >= 0.7 ? 'ok' : 'no'}` }, parts, h('div', { class: 'coach-slot' }));
  } else if (item.kind === 'orderbook') {
    const out = response?.trades?.length ? positionOutcome(item.board, response.trades) : null;
    parts.push(h('strong', {}, 'Not a locked-in profit. '));
    if (out && !out.flat) parts.push('Your position is not flat: some product is left long or short, so the profit is not locked in.');
    else if (out) parts.push(`Your position is flat but makes ${fmtNum(out.profit)}: you crossed the spread the wrong way somewhere.`);
  }
  return h('div', { class: 'feedback no' }, parts);
}

// The worked solution, in reading order: what is asked, the picture, the steps (one at a
// time, each with its arithmetic in a mono line), the exam-speed path, the sanity check,
// the rule, then two ways on: the family's lesson and a fresh twin question.
export function solutionPanel(item, { stepwise = true } = {}) {
  const sol = item.solution;
  const steps = sol.steps;
  let shown = stepwise ? 1 : steps.length;
  const list = h('ol', { class: 'steps' });
  const more = h('button', { class: 'btn small', type: 'button', onclick: () => { shown = Math.min(steps.length, shown + 1); render(); } }, 'Next step');
  const all = h('button', { class: 'btn small', type: 'button', onclick: () => { shown = steps.length; render(); } }, 'Show all');
  // Caret exponents print as real superscripts: 2^4 reads 2⁴.
  const sup = (t) => (typeof t === 'string' ? t.replace(/\^(\d+)/g, (_, d) => [...d].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('')) : t);
  const ask = sol.ask ? h('p', { class: 'solution-ask' }, sup(sol.ask)) : null;
  const picture = sol.picture ? pictureFigure(sol.picture) : null;
  const block = (cls, title, body) => h('div', { class: cls, hidden: true }, h('h4', {}, title), h('p', {}, sup(body)));
  const fast = sol.fast ? block('solution-fast', 'Exam-speed path', sol.fast) : null;
  const check = sol.check ? block('solution-check', 'Sanity check', sol.check) : null;
  const rule = h('div', { class: 'rule', hidden: true }, sol.rule);
  const anchor = h('p', { class: 'muted', hidden: true }, `Anchor: ${sol.anchor}`);
  const best = item.kind === 'orderbook' && item.best ? h('p', { class: 'num', hidden: true }, `Best position: ${describeTrades(item)} → profit ${fmtNum(item.best.profit)}`) : null;
  function render() {
    list.replaceChildren(...steps.slice(0, shown).map((s, i) => h('li', {},
      h('span', { class: 'n' }, String(i + 1)), h('div', {}, sup(s.say)),
      s.math ? h('div', { class: 'solution-math num' }, sup(s.math)) : null,
      h('div', { class: 'why' }, sup(s.why)))));
    const done = shown >= steps.length;
    more.hidden = done; all.hidden = done;
    for (const el of [best, fast, check, anchor, rule]) if (el) el.hidden = !done;
  }
  render();
  return h('section', { class: 'solution' }, h('h3', {}, 'Solution'), ask, picture, list, h('div', { class: 'row' }, more, all),
    best, fast, check, anchor, rule, solutionActions(item));
}

function pictureFigure(p) {
  let el;
  try { el = renderDiagram(p.diagram, p.spec); } catch { return null; }
  return h('figure', { class: 'solution-picture study-figure' }, el, h('figcaption', {}, p.caption));
}

function solutionActions(item) {
  const lesson = item.section && item.family ? lessonForFamily(item.section, item.family) : null;
  return h('div', { class: 'row solution-actions' },
    lesson ? h('a', { class: 'btn small', href: `#/study/lesson/${lesson}` }, 'Learn this') : null,
    item.section && item.family ? h('a', { class: 'btn small ghost', href: `#/run/${item.section}/practice/${item.family}` }, 'Try a twin') : null);
}

function describeTrades(item) {
  const counts = new Map();
  for (const t of item.best.trades) {
    const k = `${t.side}|${t.id}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].map(([k, n]) => {
    const [side, id] = k.split('|');
    const ins = item.board.instruments.find((x) => x.id === id);
    return `${side === 'buy' ? 'buy' : 'sell'} ${n > 1 ? `${n}× ` : ''}${ins.name || id} @ ${fmtNum(side === 'buy' ? ins.ask : ins.bid)}`;
  }).join(', ');
}

export function hintLadder(item, onUse) {
  let used = 0;
  const box = h('div', { class: 'hints' });
  const btn = h('button', { class: 'btn small', type: 'button', onclick: () => {
    if (used >= item.hints.length) return;
    box.append(h('div', { class: 'feedback' }, h('strong', {}, `Hint ${used + 1}. `), item.hints[used]));
    used += 1;
    onUse?.(used);
    btn.textContent = used >= item.hints.length ? 'No more hints' : `Hint (${used}/${item.hints.length})`;
    btn.disabled = used >= item.hints.length;
  } }, `Hint (0/${item.hints.length})`);
  return { btn, box, used: () => used };
}

// Interval coach: the expected-score-optimal interval for a calibrated belief.
export async function intervalCoach(item, slot) {
  if (!item.coach || !slot) return;
  try {
    const mod = await import('../sections/iv/optimal.js');
    const fn = mod.bestInterval || mod.default;
    if (!fn) return;
    const best = fn(item.coach.belief, item.truth);
    if (!best) return;
    const lo = best.lower ?? best[0], hi = best.upper ?? best[1];
    slot.append(h('div', { class: 'muted' },
      `Calibrated play: with the uncertainty a prepared candidate has here (${item.coach.note || item.coach.belief?.kind}), the best interval around the answer is `,
      h('span', { class: 'num' }, `[${fmtNum(lo)}, ${fmtNum(hi)}]`),
      (best.expectedScore ?? best.score) != null ? ` for an expected score of ${(best.expectedScore ?? best.score).toFixed(2)}.` : '.'));
  } catch { /* coach is optional */ }
}
