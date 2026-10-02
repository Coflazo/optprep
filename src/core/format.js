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
export const divNotation = (text, mode) => (mode === 'colon' ? String(text).replace(/÷/g, ':') : text);
