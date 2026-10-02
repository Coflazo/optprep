// Helpers shared by the 80-in-8 lessons. Every number in the prose is computed here or in the
// lesson file, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { mc } from '../iv/scoring-and-width.js';
import { SECTIONS } from '../../../../config/sections.js';

export { mc };
export const MM = SECTIONS.mm;
export const PACE = MM.exam.totalSeconds / MM.exam.count; // seconds per question at exam pace
export const sec = (key, title) => ({ type: 'section', key, title: title ?? SECTION_TITLES[key] });
export const N = (q, answer, explain, hints) => ({ type: 'number', q, answer, explain, ...(hints ? { hints } : {}) });
export const neg = (n) => (n < 0 ? `−${-n}` : String(n));
export const r2 = (x) => Math.round(x * 100) / 100;
export const r3 = (x) => Math.round(x * 1000) / 1000;
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
export const pick = (rng, xs) => xs[Math.floor(rng.next() * xs.length)];

// Cumulative retrieval. A lesson lists one question maker per unit it teaches, in teaching order.
// The check after unit k asks about the newest unit half the time and about any earlier unit
// otherwise, so every check covers everything taught so far, not just the last paragraph.
export function cum(pool, k) {
  const upto = pool.slice(0, k + 1);
  return { make: (rng) => (rng.chance(0.5) ? upto[k] : upto[Math.floor(rng.next() * upto.length)])(rng) };
}
export const check = (pool, k, scope) => ({ type: 'check', scope, questions: [cum(pool, k)] });
