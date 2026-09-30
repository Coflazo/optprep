// Figure It Out: a hidden figure has one value per property (shape, colour, fill, ...).
// The candidate composes a guess by picking a value for every property; feedback marks
// each property right or wrong. Fewer guesses is better; time is recorded but secondary.
//
// Optimum. Feedback on property k says nothing about the others, and the hidden value of k
// is uniform over n_k values. So under any strategy that never retries a value known to be
// wrong, property k is first right on guess U_k ~ Uniform{1..n_k}, independently, and the
// round ends on guess max_k U_k. Hence
//   E* = sum_{m>=0} (1 - prod_k min(m, n_k)/n_k),   W* = max_k n_k.
// solveExact() is an exhaustive search over every adaptive strategy on a small code space;
// the tests use it to confirm the closed form.

export const PROPS = [
  { key: 'shape', values: ['circle', 'square', 'triangle', 'diamond', 'hexagon'] },
  { key: 'colour', values: ['blue', 'orange', 'green', 'purple', 'red'] },
  { key: 'fill', values: ['solid', 'outline', 'striped', 'dotted'] },
  { key: 'size', values: ['small', 'medium', 'large'] },
  { key: 'count', values: ['1', '2', '3'] },
  { key: 'border', values: ['thin', 'thick', 'dashed'] },
];

// Values per property in each of the 5 rounds (property count grows 3 -> 6).
export const ROUNDS = [[4, 4, 3], [4, 4, 3, 3], [5, 5, 4, 3], [5, 5, 4, 3, 3], [5, 5, 4, 3, 3, 3]];

export function optimum(values) {
  const worst = Math.max(...values);
  let expected = 0;
  for (let m = 0; m < worst; m++) expected += 1 - values.reduce((p, n) => p * Math.min(m, n) / n, 1);
  return { expected, worst };
}

// Feedback of guess g against hidden h: bit k set when property k matches.
export const feedback = (g, h) => g.reduce((m, v, k) => m | (v === h[k] ? 1 << k : 0), 0);

export function allCodes(values) {
  let out = [[]];
  for (const n of values) out = out.flatMap((c) => Array.from({ length: n }, (_, v) => [...c, v]));
  return out;
}

// Exhaustive optimum over subsets of a small code list (at most 30 codes).
//   T(S) = |S| + min_g sum_o T(S_o)             total guesses over all hidden codes in S
//   W(S) = min_g max([g in S], 1 + max_o W(S_o)) worst case
// S_o = codes of S other than g giving feedback o to guess g. Any code may be guessed.
export function solveExact(codes, fbFn = feedback) {
  const n = codes.length, full = (1 << n) - 1;
  const fb = codes.map((g) => codes.map((h) => fbFn(g, h)));
  const T = new Map(), W = new Map();
  function solve(S) {
    if (T.has(S)) return;
    const size = popcount(S);
    if (size === 1) { T.set(S, 1); W.set(S, 1); return; }
    let bt = Infinity, bw = Infinity;
    for (let g = 0; g < n; g++) {
      const classes = new Map();
      for (let c = 0; c < n; c++) if ((S >> c) & 1 && c !== g) classes.set(fb[g][c], (classes.get(fb[g][c]) ?? 0) | (1 << c));
      const inS = (S >> g) & 1;
      if (!inS && classes.size < 2) continue; // learns nothing
      let t = size, w = inS ? 1 : 0;
      for (const P of classes.values()) { solve(P); t += T.get(P); w = Math.max(w, 1 + W.get(P)); }
      bt = Math.min(bt, t); bw = Math.min(bw, w);
    }
    T.set(S, bt); W.set(S, bw);
  }
  solve(full);
  return { expected: T.get(full) / n, worst: W.get(full) };
}

export function popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

// Values of each property still possible after the guesses so far.
export function possible(values, guesses) {
  return values.map((n, k) => {
    const right = guesses.find((g) => (g.fb >> k) & 1);
    if (right) return [right.code[k]];
    const wrong = new Set(guesses.map((g) => g.code[k]));
    return Array.from({ length: n }, (_, v) => v).filter((v) => !wrong.has(v));
  });
}

export function createEngine(rng, opts = {}) {
  const specs = opts.rounds ?? ROUNDS;
  const rounds = specs.map((values) => ({
    values, props: PROPS.slice(0, values.length), hidden: values.map((n) => rng.int(0, n - 1)), ...optimum(values),
  }));
  const state = { phase: 'ready', round: 0, guesses: [], roundStart: null, results: [], rounds };

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') { state.phase = 'play'; state.roundStart = tMs; } return null; }
    if (action.type === 'next' && state.phase === 'roundDone') {
      state.round++; state.guesses = []; state.roundStart = tMs;
      state.phase = state.round >= rounds.length ? 'done' : 'play';
      return null;
    }
    if (state.phase !== 'play' || action.type !== 'guess') return null;
    const R = rounds[state.round];
    const code = action.code;
    if (!Array.isArray(code) || code.length !== R.values.length || code.some((v, k) => !(Number.isInteger(v) && v >= 0 && v < R.values[k]))) return null;
    const fb = feedback(code, R.hidden);
    const g = { code: code.slice(), fb, marks: R.values.map((_, k) => !!((fb >> k) & 1)), t: tMs };
    state.guesses.push(g);
    if (g.marks.every(Boolean)) {
      const r = { round: state.round + 1, guesses: state.guesses.length, optimal: R.expected, worst: R.worst, ms: tMs - state.roundStart };
      r.over = r.guesses - r.optimal;
      state.results.push(r);
      state.phase = 'roundDone';
      return { ...g, solved: true, result: r };
    }
    return { ...g, solved: false };
  }

  function result() {
    const rs = state.results;
    return {
      score: rs.reduce((a, r) => a + r.guesses, 0),
      metric: 'guessesOver',
      value: rs.length ? rs.reduce((a, r) => a + r.over, 0) / rs.length : Infinity,
      detail: { rounds: rs, completed: rs.length, totalMs: rs.reduce((a, r) => a + r.ms, 0) },
    };
  }

  return { state, act, isOver: () => state.phase === 'done', result };
}
