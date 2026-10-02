// Display formatting shared by every section. Generators compute exact values and
// only these functions round.
// Probabilities: three decimals, but two significant figures below 0.01 so small values never print as 0.
export const fmtP = (p) => (p === 0 ? '0' : p === 1 ? '1' : p > 0 && p < 0.01 ? String(Number(p.toPrecision(2))) : p.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''));
export const fmtPct = (p) => `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
export function fmtNum(x) {
  if (!Number.isFinite(x)) return String(x);
  if (Number.isInteger(x)) return x.toLocaleString('en-US');
  const a = Math.abs(x);
  const dp = a >= 100 ? 1 : a >= 10 ? 2 : 3;
  return x.toFixed(dp).replace(/0+$/, '').replace(/\.$/, '');
}
export const fmtFrac = (q) => q.toString();
// European division sign: items always store ÷; the view shows : when the learner asks for it.
// Caret exponents print as superscripts: 2^6 reads 2⁶, 2^n reads 2ⁿ. Grouped exponents like 2^(n-1) stay as written.
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', n: 'ⁿ', k: 'ᵏ', m: 'ᵐ' };
export const superscripts = (t) => (typeof t === 'string' ? t.replace(/\^([0-9nkm]+)\b/g, (_, e) => [...e].map((c) => SUP[c]).join('')) : t);
export const divNotation = (text, mode) => (mode === 'colon' ? String(text).replace(/÷/g, ':') : text);
