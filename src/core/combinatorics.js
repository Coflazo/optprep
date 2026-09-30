// Exact counting helpers (BigInt). Use Number(...) only at the display edge.

export function factorial(n) {
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

export function nPr(n, r) {
  if (r < 0 || r > n) return 0n;
  let out = 1n;
  for (let i = 0; i < r; i++) out *= BigInt(n - i);
  return out;
}

export function nCr(n, r) {
  if (r < 0 || r > n) return 0n;
  r = Math.min(r, n - r);
  let out = 1n;
  for (let i = 1; i <= r; i++) out = (out * BigInt(n - r + i)) / BigInt(i);
  return out;
}

// !n: permutations with no fixed point.
export function derangements(n) {
  if (n === 0) return 1n;
  let a = 1n, b = 0n; // D(0), D(1)
  for (let i = 2; i <= n; i++) [a, b] = [b, BigInt(i - 1) * (a + b)];
  return n === 1 ? 0n : b;
}
