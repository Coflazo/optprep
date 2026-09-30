// NumberBox: make the target from four numbers with + - x / and brackets, each number
// used exactly once. Arithmetic is exact, so 8 / (3 - 8/3) = 24 counts. The exhaustive
// solver covers every binary expression tree over the four numbers; every generated round
// has a solution, which the view can reveal.
import { Q } from '../../core/rational.js';

export const DEFAULTS = { rounds: 10, minTarget: 10, maxTarget: 99, roundMs: null };

// Solver arithmetic: exact fractions [num, den] over plain integers (den > 0, reduced).
// Four numbers from 1 to 9 keep every intermediate far below 2^53, so this is exact and
// much faster than BigInt. The BigInt parser below (check) re-verifies every shown solution.
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
const OPS = {
  '+': ([a, b], [c, d]) => frac(a * d + c * b, b * d),
  '-': ([a, b], [c, d]) => frac(a * d - c * b, b * d),
  '*': ([a, b], [c, d]) => frac(a * c, b * d),
  '/': ([a, b], [c, d]) => frac(a * d, b * c),
};
const SHOW = { '+': '+', '-': '−', '*': '×', '/': '÷' };

// Precedence for printing with minimal brackets: atoms 3, x / 2, + - 1.
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
function print(op, a, b) {
  const q = PREC[op];
  const l = a.p < q ? `(${a.e})` : a.e;
  const r = b.p < q || (b.p === q && (op === '-' || op === '/')) ? `(${b.e})` : b.e;
  return `${l} ${SHOW[op]} ${r}`;
}
const keyOfFrac = ([n, d]) => (d === 1 ? String(n) : `${n}/${d}`);

// Exhaustive solver by subset dynamic programming: for every subset of the numbers, every
// value reachable using exactly that subset, with one printed expression and the number
// of expression trees that reach it. Splitting each subset into two non-empty parts and
// applying + x (both orders are the same) and - / (both orders) covers every binary tree.
// Returns Map(valueKey -> { v, e, p, count }) for the full set; keys are "n" or "n/d".
export function solve(nums) {
  const n = nums.length, T = new Array(1 << n);
  nums.forEach((x, i) => { T[1 << i] = new Map([[String(x), { v: [x, 1], e: String(x), p: 3, count: 1 }]]); });
  for (let m = 1; m < 1 << n; m++) {
    if (T[m]) continue;
    const out = new Map();
    for (let a = (m - 1) & m; a > 0; a = (a - 1) & m) {
      const b = m ^ a;
      if (a < b) continue; // each unordered split once
      for (const x of T[a].values()) {
        for (const y of T[b].values()) {
          const c = x.count * y.count;
          for (const [op, l, r] of [['+', x, y], ['*', x, y], ['-', x, y], ['-', y, x], ['/', x, y], ['/', y, x]]) {
            if (op === '/' && r.v[0] === 0) continue;
            const v = OPS[op](l.v, r.v), k = keyOfFrac(v), cur = out.get(k);
            if (cur) cur.count += c;
            else out.set(k, { v, e: print(op, l, r), p: PREC[op], count: c });
          }
        }
      }
    }
    T[m] = out;
  }
  return T[(1 << n) - 1];
}

export const solutionFor = (nums, target) => solve(nums).get(String(target))?.e ?? null;

// Parser for the candidate's expression. Accepts digits, + - * / x × ÷ − and brackets;
// no unary minus and no digit concatenation beyond the given numbers.
export function evaluate(text) {
  const src = String(text).replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');
  const toks = src.match(/\d+|[-+*/()]|\S/g) ?? [];
  let pos = 0;
  const used = [];
  const peek = () => toks[pos];
  const fail = (msg) => { throw new SyntaxError(msg); };
  function factor() {
    const t = toks[pos++];
    if (t === '(') { const v = expr(); if (toks[pos++] !== ')') fail('missing )'); return v; }
    if (/^\d+$/.test(t ?? '')) { used.push(Number(t)); return Q.of(Number(t)); }
    return fail(t == null ? 'expression ends early' : `unexpected "${t}"`);
  }
  function term() {
    let v = factor();
    while (peek() === '*' || peek() === '/') {
      const op = toks[pos++], r = factor();
      if (op === '/' && r.isZero()) fail('division by zero');
      v = op === '*' ? v.mul(r) : v.div(r);
    }
    return v;
  }
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = toks[pos++]; v = op === '+' ? v.add(term()) : v.sub(term()); }
    return v;
  }
  try {
    if (!toks.length) fail('empty');
    const value = expr();
    if (pos < toks.length) fail(`unexpected "${toks[pos]}"`);
    return { ok: true, value, used };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const sameMultiset = (a, b) => a.length === b.length && [...a].sort((x, y) => x - y).every((x, i) => x === [...b].sort((p, q) => p - q)[i]);

export function check(nums, target, text) {
  const r = evaluate(text);
  if (!r.ok) return { ok: false, valid: false, reason: r.error };
  if (!sameMultiset(r.used, nums)) return { ok: false, valid: false, reason: `use each of ${nums.join(', ')} exactly once` };
  return { ok: r.value.eq(Q.of(target)), valid: true, value: r.value.toString() };
}

// Rounds 1-3 easy (targets reached by many expression trees), 4-7 medium, 8-10 hard (fewest).
export function generateRound(rng, i, o = DEFAULTS) {
  const band = i < 3 ? 0 : i < 7 ? 1 : 2;
  for (;;) {
    const nums = Array.from({ length: 4 }, () => rng.int(1, 9));
    const all = solve(nums);
    const cands = [];
    for (let t = o.minTarget; t <= o.maxTarget; t++) {
      const hit = all.get(String(t));
      if (hit) cands.push({ t, n: hit.count, e: hit.e });
    }
    if (cands.length < 9) continue;
    cands.sort((a, b) => b.n - a.n || a.t - b.t);
    const third = Math.floor(cands.length / 3);
    const { t, n, e } = rng.pick(cands.slice(band * third, band === 2 ? cands.length : (band + 1) * third));
    return { nums, target: t, solution: e, solutionCount: n };
  }
}

export function createEngine(rng, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const rounds = Array.from({ length: o.rounds }, (_, i) => generateRound(rng, i, o));
  const state = { phase: 'ready', i: 0, roundStart: null, wrong: 0, results: [], rounds, last: null, opts: o };

  function finish(solved, t, extra = {}) {
    const R = rounds[state.i];
    const r = { i: state.i, solved, ms: t - state.roundStart, wrongSubmits: state.wrong, solution: R.solution, ...extra };
    state.results.push(r);
    state.last = r;
    state.i++; state.wrong = 0; state.roundStart = t;
    if (state.i >= rounds.length) state.phase = 'done';
    return r;
  }

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') { state.phase = 'play'; state.roundStart = tMs; } return null; }
    if (state.phase !== 'play') return null;
    if (o.roundMs && tMs - state.roundStart >= o.roundMs) return finish(false, state.roundStart + o.roundMs, { timeout: true });
    if (action.type === 'submit') {
      const R = rounds[state.i];
      const c = check(R.nums, R.target, action.expr);
      if (!c.valid) return { ...c, round: state.i };
      if (!c.ok) { state.wrong++; return { ...c, round: state.i }; }
      return { ...c, round: state.i, result: finish(true, tMs, { expr: action.expr }) };
    }
    if (action.type === 'skip') return { ok: false, skipped: true, round: state.i, result: finish(false, tMs, { skipped: true }) };
    return null;
  }

  function result() {
    const solved = state.results.filter((r) => r.solved).length;
    return {
      score: solved,
      metric: 'solved',
      value: solved,
      detail: {
        rounds: o.rounds, solved,
        wrongSubmits: state.results.reduce((a, r) => a + r.wrongSubmits, 0),
        meanSolveMs: solved ? state.results.filter((r) => r.solved).reduce((a, r) => a + r.ms, 0) / solved : null,
      },
    };
  }

  return { state, act, isOver: () => state.phase === 'done', result };
}
