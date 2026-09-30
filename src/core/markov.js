// Exact Markov-chain answers over rationals: hitting times, absorption
// probabilities and stationary distributions, by Gaussian elimination.
import { Q, ZERO, ONE } from './rational.js';

export function solveLinear(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row.map(Q.from), Q.from(b[i])]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    while (piv < n && M[piv][col].isZero()) piv++;
    if (piv === n) throw new Error('singular system');
    [M[col], M[piv]] = [M[piv], M[col]];
    const p = M[col][col];
    for (let k = col; k <= n; k++) M[col][k] = M[col][k].div(p);
    for (let r = 0; r < n; r++) {
      if (r === col || M[r][col].isZero()) continue;
      const f = M[r][col];
      for (let k = col; k <= n; k++) M[r][k] = M[r][k].sub(f.mul(M[col][k]));
    }
  }
  return M.map((row) => row[n]);
}

// Expected steps to first reach any state in `targets`. Targets get 0.
export function hittingTimes(P, targets) {
  const n = P.length, T = new Set(targets);
  const free = [...Array(n).keys()].filter((i) => !T.has(i));
  const idx = new Map(free.map((s, k) => [s, k]));
  const A = free.map((i) => free.map((j) => (i === j ? ONE : ZERO).sub(Q.from(P[i][j]))));
  const b = free.map(() => ONE);
  const h = solveLinear(A, b);
  return [...Array(n).keys()].map((i) => (T.has(i) ? ZERO : h[idx.get(i)]));
}

// Probability of being absorbed in `goal` (one of `absorbing`) from each state.
export function absorptionProbs(P, absorbing, goal) {
  const n = P.length, Ab = new Set(absorbing);
  const free = [...Array(n).keys()].filter((i) => !Ab.has(i));
  const idx = new Map(free.map((s, k) => [s, k]));
  const A = free.map((i) => free.map((j) => (i === j ? ONE : ZERO).sub(Q.from(P[i][j]))));
  const b = free.map((i) => Q.from(P[i][goal]));
  const x = solveLinear(A, b);
  return [...Array(n).keys()].map((i) => (Ab.has(i) ? (i === goal ? ONE : ZERO) : x[idx.get(i)]));
}

// pi P = pi, sum pi = 1 (irreducible chains).
export function stationary(P) {
  const n = P.length;
  const A = [], b = [];
  for (let j = 0; j < n - 1; j++) {
    A.push([...Array(n).keys()].map((i) => Q.from(P[i][j]).sub(i === j ? ONE : ZERO)));
    b.push(ZERO);
  }
  A.push(Array(n).fill(ONE));
  b.push(ONE);
  return solveLinear(A, b);
}
