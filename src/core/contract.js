// The item contract every generator and every bank item must satisfy.
// Tests run validateItem over thousands of generated items per section.
import { positionOutcome } from './check.js';

export const SECTIONS = ['mm', 'bto', 'nl', 'll', 'iv', 'ob'];
export const KINDS = ['mcq', 'rank', 'interval', 'orderbook'];
export const RANK_MARGIN = 0.02;

const str = (x) => typeof x === 'string' && x.trim().length > 0;

export function validateItem(it) {
  const e = [];
  if (!str(it.id)) e.push('id missing');
  if (!SECTIONS.includes(it.section)) e.push(`section ${it.section} invalid`);
  if (!str(it.family)) e.push('family missing');
  if (!(Number.isInteger(it.difficulty) && it.difficulty >= 1 && it.difficulty <= 5)) e.push('difficulty must be 1..5');
  if (!KINDS.includes(it.kind)) e.push(`kind ${it.kind} invalid`);
  if (!str(it.prompt?.text)) e.push('prompt.text missing');
  const s = it.solution;
  if (!s || !Array.isArray(s.steps) || s.steps.length < 2) e.push('solution.steps needs >= 2 steps');
  else s.steps.forEach((st, i) => { if (!str(st.say) || !str(st.why)) e.push(`solution.steps[${i}] needs say and why`); });
  if (!str(s?.rule)) e.push('solution.rule missing');
  if (!str(s?.anchor)) e.push('solution.anchor missing');
  if (!Array.isArray(it.hints) || it.hints.length < 2 || !it.hints.every(str)) e.push('hints needs >= 2 strings');

  if (it.kind === 'mcq') {
    const o = it.options;
    const n = it.optionCount ?? 5; // the 80-in-8 has 4 options; every other mcq section 5
    if (!Array.isArray(o) || o.length !== n) e.push(`mcq needs exactly ${n} options`);
    else {
      if (new Set(o.map((x) => x.label)).size !== o.length) e.push('mcq option labels must be distinct');
      if (!(Number.isInteger(it.answerIndex) && o[it.answerIndex])) e.push('answerIndex invalid');
      else if (o[it.answerIndex].misconception !== null) e.push('correct option must have misconception null');
      o.forEach((x, i) => { if (i !== it.answerIndex && !str(x.misconception)) e.push(`option ${i} needs a misconception`); });
    }
  }
  if (it.kind === 'rank') {
    const st = it.statements;
    if (!Array.isArray(st) || st.length !== 3 || !st.every((x) => str(x.text) && x.p >= 0 && x.p <= 1)) e.push('rank needs 3 statements with p in [0,1]');
    else {
      const want = [0, 1, 2].sort((a, b) => st[b].p - st[a].p);
      if (JSON.stringify(want) !== JSON.stringify(it.answerOrder)) e.push('answerOrder must sort statements by p descending');
      const ps = want.map((i) => st[i].p);
      if (ps[0] - ps[1] < RANK_MARGIN || ps[1] - ps[2] < RANK_MARGIN) e.push(`rank probabilities within margin ${RANK_MARGIN}`);
    }
  }
  if (it.kind === 'interval') {
    if (!(Number.isFinite(it.truth) && it.truth > 0)) e.push('interval truth must be a positive number');
  }
  if (it.kind === 'orderbook') {
    const b = it.board;
    if (!b || !Array.isArray(b.products) || !Array.isArray(b.instruments)) e.push('orderbook board missing');
    else {
      b.instruments.forEach((i) => {
        if (i.legs?.length !== b.products.length) e.push(`instrument ${i.id} legs length`);
        if (!(i.bid < i.ask)) e.push(`instrument ${i.id} bid must be below ask`);
      });
      if (!it.best?.trades?.length) e.push('orderbook best trade missing');
      else {
        const out = positionOutcome(b, it.best.trades);
        if (!out.flat) e.push('best trade is not flat');
        if (!(out.profit > 0) || Math.abs(out.profit - it.best.profit) > 1e-6) e.push('best profit mismatch');
      }
    }
  }
  return e;
}

// The worked solution every item carries: what is asked, a picture (or null where none
// helps), steps with the arithmetic of each move in `math`, the exam-speed path and a
// sanity check that would catch a wrong option. Diagram specs are checked against the
// study diagram validators in tests/core/solutions.test.js.
export function validateSolution(s) {
  const e = [];
  for (const k of ['ask', 'fast', 'check']) if (!str(s[k])) e.push(`solution.${k} missing`);
  if (!('picture' in s)) e.push('solution.picture missing (null only where no picture helps)');
  else if (s.picture !== null) {
    const p = s.picture;
    if (!(str(p?.diagram) && p.spec && typeof p.spec === 'object' && str(p.caption))) e.push('solution.picture needs diagram, spec and caption');
  }
  const steps = Array.isArray(s.steps) ? s.steps : [];
  steps.forEach((st, i) => { if (st.math != null && !str(st.math)) e.push(`solution.steps[${i}].math must be text`); });
  if (!steps.some((st) => str(st.math))) e.push('solution needs math on at least one step');
  return e;
}
