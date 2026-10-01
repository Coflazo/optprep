// The Switch: rounds with an arithmetic block (top) and two arrow sets (bottom); one block is active.
// spec: { rounds: [{ task: 'math' | 'arrows', math: '13 + 8', arrows: [['left', 3], ['right', 4]],
//         answer?: 'yes' | 'no', switch?: boolean }] }
//   Top active: "is the result odd?" Bottom active: "do both arrow sets point the same way?"
// validate: math is "a + b" or "a - b" with whole numbers; arrow sets point left or right with 1-6
// arrows; a stated answer obeys the rule for the active block; a stated switch flag says whether the
// active block changed from the previous round (never on the first round).
import { svg, text, rect } from './_util.js';

const MATH = /^\s*(\d+)\s*([+\-−])\s*(\d+)\s*$/;
export const mathValue = (s) => { const m = MATH.exec(s); return m ? (m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3]) : null; };
export const ruleAnswer = (r) => (r.task === 'math' ? Math.abs(mathValue(r.math)) % 2 === 1 : r.arrows[0][0] === r.arrows[1][0]) ? 'yes' : 'no';

export function validate(spec) {
  const R = spec?.rounds;
  if (!Array.isArray(R) || !R.length) return ['zapn-switch: rounds required'];
  const e = [];
  R.forEach((r, i) => {
    if (!['math', 'arrows'].includes(r.task)) { e.push(`zapn-switch: round ${i + 1} task must be math or arrows`); return; }
    if (mathValue(r.math) == null) { e.push(`zapn-switch: round ${i + 1} math must be "a + b" or "a - b"`); return; }
    if (!(Array.isArray(r.arrows) && r.arrows.length === 2 && r.arrows.every(([d, n]) => ['left', 'right'].includes(d) && Number.isInteger(n) && n >= 1 && n <= 6))) { e.push(`zapn-switch: round ${i + 1} needs two arrow sets [dir, count]`); return; }
    if (r.answer != null && r.answer !== ruleAnswer(r)) e.push(`zapn-switch: round ${i + 1} answer is ${ruleAnswer(r)}, stated ${r.answer}`);
    if (r.switch != null) {
      const actual = i > 0 && R[i - 1].task !== r.task;
      if (r.switch !== actual) e.push(`zapn-switch: round ${i + 1} is ${actual ? 'a switch' : i ? 'a repeat' : 'the first round'}, stated switch ${r.switch}`);
    }
  });
  return e;
}

const arrowText = ([d, n]) => Array(n).fill(d === 'left' ? '←' : '→').join(' ');

export function render(spec) {
  const CW = 150, G = 14, H = 206;
  const W = spec.rounds.length * (CW + G) + G;
  const parts = [];
  spec.rounds.forEach((r, i) => {
    const x = G + i * (CW + G);
    const tag = r.switch == null ? '' : r.switch ? ' · switch' : i ? ' · repeat' : '';
    parts.push(text(x + CW / 2, 12, `round ${i + 1}${tag}`, { class: `dg-text dg-small${r.switch ? ' dg-strong-text' : ' dg-muted'}` }));
    parts.push(rect(x, 24, CW, 50, r.task === 'math' ? 'dg-cell dg-cell-on' : 'dg-cell', 6));
    parts.push(text(x + CW / 2, 49, r.math.replace('-', '−'), { class: `dg-text dg-mono${r.task === 'math' ? ' dg-strong-text' : ' dg-muted'}` }));
    parts.push(rect(x, 82, CW, 70, r.task === 'arrows' ? 'dg-cell dg-cell-on' : 'dg-cell', 6));
    r.arrows.forEach((a, k) => parts.push(text(x + CW / 2, 102 + k * 28, arrowText(a), { class: `dg-text dg-mono${r.task === 'arrows' ? ' dg-strong-text' : ' dg-muted'}`, style: { fontSize: '20px' } })));
    const q = r.task === 'math' ? 'odd?' : 'same way?';
    parts.push(text(x + CW / 2, 172, r.answer != null ? `${q} ${r.answer}` : q, { class: 'dg-text dg-small dg-strong-text' }));
    parts.push(text(x + CW / 2, 192, r.task === 'math' ? 'top is active' : 'bottom is active', { class: 'dg-text dg-small dg-muted' }));
  });
  return svg(W, H, spec.label || `The Switch, ${spec.rounds.length} rounds`, ...parts);
}
