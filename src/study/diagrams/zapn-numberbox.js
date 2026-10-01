// NumberBox: four numbers, a target, and a solution built one combination at a time.
// spec: { nums: [4, 3, 2, 7], target: 52, steps?: [{ a, op, b, r }], expr?: '(7 + 3 × 2) × 4',
//         back?: [{ from, undo, n, to }] }
//   steps: combine two numbers you still hold into one (op: + − × ÷; values may be 'n/d' strings).
//   back: the backwards search. "from = to undo n": the last move was `undo` n, so before it
//   you needed `to` (undo × → to = from ÷ n, ÷ → from × n, + → from − n, − → from + n).
// validate: each step uses two numbers still held and computes r exactly (no division by zero);
// after the steps one number is left and it equals the target; expr passes the engine's check
// (each number exactly once, value equal to the target); the back chain starts at the target,
// continues from each `to`, computes every `to` exactly and uses distinct numbers from nums.
import { toQ } from './_util.js';
import { h } from '../../ui/dom.js';
import { check } from '../../zapn/numberbox/engine.js';

const OP = { '+': '+', '-': '−', '−': '−', '*': '×', '×': '×', x: '×', '/': '÷', '÷': '÷' };
const apply = (a, op, b) => (op === '+' ? a.add(b) : op === '−' ? a.sub(b) : op === '×' ? a.mul(b) : b.isZero() ? null : a.div(b));
const undoOf = (from, op, n) => (op === '×' ? (n.isZero() ? null : from.div(n)) : op === '÷' ? from.mul(n) : op === '+' ? from.sub(n) : from.add(n));

function take(held, v) { const i = held.findIndex((x) => x.eq(v)); if (i < 0) return false; held.splice(i, 1); return true; }

export function validate(spec) {
  const { nums, target } = spec || {};
  if (!(Array.isArray(nums) && nums.length >= 2 && nums.every((n) => Number.isInteger(n) && n >= 0) && Number.isInteger(target))) return ['zapn-numberbox: nums (whole numbers) and an integer target required'];
  const e = [];
  if (spec.steps) {
    const held = nums.map((n) => toQ(n));
    spec.steps.forEach((s, i) => {
      if (e.length) return;
      const a = toQ(s.a), b = toQ(s.b), r = toQ(s.r), op = OP[s.op];
      if (!a || !b || !r || !op) { e.push(`zapn-numberbox: step ${i + 1} needs a, op, b, r`); return; }
      if (!take(held, a) || !take(held, b)) { e.push(`zapn-numberbox: step ${i + 1} uses a number you no longer hold`); return; }
      const v = apply(a, op, b);
      if (!v) { e.push(`zapn-numberbox: step ${i + 1} divides by zero`); return; }
      if (!v.eq(r)) { e.push(`zapn-numberbox: step ${i + 1}: ${s.a} ${op} ${s.b} = ${v}, stated ${s.r}`); return; }
      held.push(v);
    });
    if (!e.length && !(held.length === 1 && held[0].eq(toQ(target)))) e.push(`zapn-numberbox: steps end holding ${held.map(String).join(', ')}, not just the target ${target}`);
  }
  if (spec.expr != null) {
    const c = check(nums, target, spec.expr);
    if (!c.ok) e.push(`zapn-numberbox: "${spec.expr}" ${c.valid ? `makes ${c.value}, not ${target}` : `is not allowed: ${c.reason}`}`);
  }
  if (spec.back) {
    const pool = nums.map((n) => toQ(n));
    let need = toQ(target);
    spec.back.forEach((b, i) => {
      if (e.length) return;
      const from = toQ(b.from), n = toQ(b.n), to = toQ(b.to), op = OP[b.undo];
      if (!from || !n || !to || !op) { e.push(`zapn-numberbox: back step ${i + 1} needs from, undo, n, to`); return; }
      if (!from.eq(need)) { e.push(`zapn-numberbox: back step ${i + 1} starts from ${b.from}, but ${need} is needed`); return; }
      if (!take(pool, n)) { e.push(`zapn-numberbox: back step ${i + 1} uses ${b.n}, which is not left`); return; }
      const want = undoOf(from, op, n);
      if (!want || !want.eq(to)) { e.push(`zapn-numberbox: back step ${i + 1}: before ${op} ${b.n} you need ${want}, stated ${b.to}`); return; }
      need = to;
    });
  }
  return e;
}

const cell = (v, cls = 'dg-ladder-cell') => h('span', { class: cls, style: { display: 'inline-block', marginRight: '6px' } }, String(v));
const note = (s) => h('div', { class: 'dg-caption-note' }, s);

export function render(spec) {
  const out = [h('div', {}, ...spec.nums.map((n) => cell(n)), h('span', { class: 'dg-caption-note', style: { margin: '0 8px' } }, 'target'), cell(spec.target, 'dg-ladder-cell dg-last-row'))];
  if (spec.back) {
    const left = [...spec.nums];
    out.push(note('Backwards from the target:'), h('ol', { class: 'steps' }, spec.back.map((b) => {
      left.splice(left.indexOf(Number(b.n)), 1);
      const op = OP[b.undo];
      return h('li', {}, `${b.from} = ${op === '÷' ? `${b.to} ÷ ${b.n}` : op === '−' ? `${b.to} − ${b.n}` : `${b.to} ${op} ${b.n}`}: now make ${b.to} from ${left.join(', ')}`);
    })));
  }
  if (spec.steps) {
    const held = [...spec.nums.map(String)];
    out.push(note('Forwards, one combination at a time:'), h('ol', { class: 'steps' }, spec.steps.map((s) => {
      held.splice(held.indexOf(String(s.a)), 1); held.splice(held.indexOf(String(s.b)), 1); held.push(String(s.r));
      return h('li', {}, `${s.a} ${OP[s.op]} ${s.b} = ${s.r}   ·   holding ${held.join(', ')}`);
    })));
  }
  if (spec.expr) out.push(note(`Answer: ${spec.expr} = ${spec.target}`));
  return h('div', { role: 'img', 'aria-label': spec.label || `NumberBox: make ${spec.target} from ${spec.nums.join(', ')}` }, out);
}
