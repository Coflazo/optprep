// Micro-checks: 1-3 exam-level questions after every smallest unit of teaching, using
// only what that unit taught. A question is plain data or a make(rng) generator.
//   { type: 'choice', q, options: [..], answer: index, traps?: { [index]: 'false belief' }, explain }
//   { type: 'number', q, answer: number, tolerance?: abs, unit?, explain }
//   { type: 'order',  q, items: [..], answer: [indices, first = top], explain }
//   { type: 'interval', q, answer: truth > 0, explain }  (scored L/U like the real section)
import { intervalScore } from '../core/check.js';

const str = (x) => typeof x === 'string' && x.trim().length > 0;

export function validateQuestion(x) {
  const e = [];
  if (!x || !str(x.q) || !str(x.explain)) return ['check: needs q and explain'];
  switch (x.type) {
    case 'choice':
      if (!Array.isArray(x.options) || x.options.length < 2 || x.options.length > 6) e.push('check: choice needs 2-6 options');
      else {
        if (!(Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length)) e.push('check: answer index');
        if (new Set(x.options.map(String)).size !== x.options.length) e.push('check: duplicate options');
        if (Number.isInteger(x.answer) && x.options[x.answer] != null) {
          // Length cue: the right answer must not stand out as the long, careful one.
          const len = (o) => String(o).length;
          const numeric = x.options.every(isPlainNumber);
          const longest = Math.max(...x.options.filter((_, i) => i !== x.answer).map(len));
          if (!numeric && len(x.options[x.answer]) >= 15 && len(x.options[x.answer]) > 1.3 * longest) e.push('check: length cue (the right option is much longer than every wrong one)');
        }
      }
      break;
    case 'number': if (!Number.isFinite(x.answer)) e.push('check: number answer'); break;
    case 'order':
      if (!Array.isArray(x.items) || x.items.length < 2) e.push('check: order needs items');
      else if (JSON.stringify([...(x.answer || [])].sort()) !== JSON.stringify(x.items.map((_, i) => i))) e.push('check: order answer must be a permutation');
      break;
    case 'interval': if (!(Number.isFinite(x.answer) && x.answer > 0)) e.push('check: interval truth must be positive'); break;
    default: e.push(`check: unknown type ${x.type}`);
  }
  return e;
}

// A plain number ("0.25", "-3", "12%", "≈ 4.5" is not) or an integer fraction ("5/12"). Quotes such as
// "100.5 / 101.5" are not numbers to sort: they are shuffled like any other option.
const isPlainNumber = (o) => /^[-−]?\d+(\.\d+)?%?$|^[-−]?\d+\/\d+$/.test(String(o).trim());

// Fair choice checks: the correct option's position must carry no information. Numeric
// options are shown in ascending order (a logical order); others are shuffled, unless the
// author marks the order as meaningful with `stable: true`. Answer index and trap keys follow.
export function arrangeChoice(q, rng) {
  if (q?.type !== 'choice' || q.stable) return q;
  const idx = q.options.map((_, i) => i);
  const order = q.options.every(isPlainNumber) ? idx.sort((a, b) => parseNumber(String(q.options[a]).replace('%', '')) - parseNumber(String(q.options[b]).replace('%', ''))) : rng.shuffle(idx);
  const traps = q.traps ? Object.fromEntries(Object.entries(q.traps).map(([k, v]) => [order.indexOf(Number(k)), v])) : q.traps;
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer), traps };
}

// Resolve a question spec (data or generator) into concrete data.
export const resolveQuestion = (x, rng) => (typeof x?.make === 'function' ? x.make(rng) : x);

// Typed answers: "0.25", "0,25", "-3", or a fraction "1/4" / "-3 / 8".
export function parseNumber(str) {
  const t = String(str).trim().replace(',', '.').replace(/[\u2212\u2012\u2013]/g, '-');
  const m = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  return m ? Number(m[1]) / Number(m[2]) : t === '' ? NaN : Number(t);
}

export function gradeCheck(x, response) {
  switch (x.type) {
    case 'choice': return { correct: response === x.answer, trap: response !== x.answer ? x.traps?.[response] : undefined };
    case 'number': {
      const v = typeof response === 'string' ? parseNumber(response) : response;
      const tol = x.tolerance ?? 1e-9 * Math.max(1, Math.abs(x.answer));
      return { correct: Number.isFinite(v) && Math.abs(v - x.answer) <= tol };
    }
    case 'order': return { correct: Array.isArray(response) && response.every((v, i) => v === x.answer[i]) };
    case 'interval': { const s = intervalScore(response?.lower, response?.upper, x.answer); return { correct: s > 0, score: s }; }
    default: return { correct: false };
  }
}
