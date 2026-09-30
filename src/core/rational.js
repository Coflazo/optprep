// Exact fractions over BigInt. Probability answers are computed with these so the
// "correct" option is exact, and only the display rounds.

const abs = (x) => (x < 0n ? -x : x);
function gcd(a, b) {
  a = abs(a); b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export class Q {
  constructor(n, d) {
    if (d === 0n) throw new RangeError('zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  static of(n, d = 1) { return new Q(BigInt(n), BigInt(d)); }
  static from(x) {
    if (x instanceof Q) return x;
    if (typeof x === 'bigint') return new Q(x, 1n);
    if (Number.isInteger(x)) return new Q(BigInt(x), 1n);
    throw new TypeError(`Q.from needs an integer or Q, got ${x}`);
  }
  add(o) { o = Q.from(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.from(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.from(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.from(o); if (o.n === 0n) throw new RangeError('divide by zero'); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  cmp(o) { o = Q.from(o); const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; }
  isZero() { return this.n === 0n; }
  toNumber() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}

export const ZERO = Q.of(0);
export const ONE = Q.of(1);
export const sumQ = (xs) => xs.reduce((s, x) => s.add(x), ZERO);
