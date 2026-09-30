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

// Resolve a question spec (data or generator) into concrete data.
export const resolveQuestion = (x, rng) => (typeof x?.make === 'function' ? x.make(rng) : x);

// Typed answers: "0.25", "0,25", "-3", or a fraction "1/4" / "-3 / 8".
export function parseNumber(str) {
  const t = String(str).trim().replace(',', '.');
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
