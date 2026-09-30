// Skyscraper: Tower-of-London style rearrangement. Three towers with height caps,
// distinct coloured blocks, only the top block moves, onto another tower with room.
// A configuration is an array of three arrays, bottom to top, of block ids 0..n-1.

// Ten progressive levels: block count, tower caps, and the exact optimal move count.
export const LEVELS = [
  { blocks: 3, caps: [3, 3, 3], opt: 2 },
  { blocks: 3, caps: [3, 3, 3], opt: 3 },
  { blocks: 3, caps: [3, 2, 1], opt: 4 },
  { blocks: 4, caps: [4, 4, 4], opt: 4 },
  { blocks: 4, caps: [4, 3, 2], opt: 5 },
  { blocks: 4, caps: [4, 4, 4], opt: 6 },
  { blocks: 5, caps: [5, 5, 5], opt: 6 },
  { blocks: 5, caps: [5, 4, 3], opt: 7 },
  { blocks: 5, caps: [5, 5, 5], opt: 8 },
  { blocks: 6, caps: [6, 6, 6], opt: 9 },
];

export const keyOf = (towers) => `${towers[0].join('')}|${towers[1].join('')}|${towers[2].join('')}`; // block ids are single digits

export function legalMoves(towers, caps) {
  const out = [];
  for (let f = 0; f < 3; f++) {
    if (!towers[f].length) continue;
    for (let to = 0; to < 3; to++) if (to !== f && towers[to].length < caps[to]) out.push([f, to]);
  }
  return out;
}

export function applyMove(towers, [f, to]) {
  const next = towers.map((t) => t.slice());
  next[to].push(next[f].pop());
  return next;
}

// Breadth-first search from start over all legal configurations.
// Returns dist (key -> moves) and prev (key -> [parentKey, move]) for path reconstruction.
// maxDepth stops expansion early when only nearby configurations are needed.
export function bfs(start, caps, maxDepth = Infinity) {
  const k0 = keyOf(start);
  const dist = new Map([[k0, 0]]), prev = new Map(), nodes = new Map([[k0, start]]);
  const queue = [start];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi], ck = keyOf(cur), d = dist.get(ck);
    if (d >= maxDepth) break;
    for (const m of legalMoves(cur, caps)) {
      const nx = applyMove(cur, m), nk = keyOf(nx);
      if (dist.has(nk)) continue;
      dist.set(nk, d + 1); prev.set(nk, [ck, m]); nodes.set(nk, nx);
      queue.push(nx);
    }
  }
  return { dist, prev, nodes };
}

export function optimalMoves(start, target, caps) {
  return bfs(start, caps).dist.get(keyOf(target)) ?? Infinity;
}

export function optimalPath(start, target, caps) {
  const { prev } = bfs(start, caps);
  const path = [];
  for (let k = keyOf(target); prev.has(k); k = prev.get(k)[0]) path.unshift(prev.get(k)[1]);
  return path;
}

function randomConfig(rng, n, caps) {
  const towers = [[], [], []];
  for (const b of rng.shuffle([...Array(n).keys()])) {
    const open = [0, 1, 2].filter((i) => towers[i].length < caps[i]);
    towers[rng.pick(open)].push(b);
  }
  return towers;
}

// Random start, then a target at exactly the level's optimal distance (BFS-verified).
export function generateLevel(rng, spec) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const start = randomConfig(rng, spec.blocks, spec.caps);
    const { dist, nodes } = bfs(start, spec.caps, spec.opt);
    const at = [...dist].filter(([, d]) => d === spec.opt).map(([k]) => k);
    if (!at.length) continue;
    const target = nodes.get(rng.pick(at));
    return { start, target, caps: spec.caps, blocks: spec.blocks, opt: spec.opt };
  }
  throw new Error(`no level at distance ${spec.opt}`);
}

export function createEngine(rng, opts = {}) {
  const specs = opts.levels ?? LEVELS;
  const levels = specs.map((s) => generateLevel(rng, s));
  const state = {
    phase: 'ready', level: 0, towers: null, moves: 0, invalid: 0,
    levelStart: null, firstMoveAt: null, results: [], levels,
  };

  function begin(i, t) {
    state.level = i;
    state.towers = levels[i].start.map((x) => x.slice());
    state.moves = 0; state.invalid = 0; state.levelStart = t; state.firstMoveAt = null;
    state.phase = 'play';
  }

  function act(action, tMs) {
    if (action.type === 'start' && state.phase === 'ready') { begin(0, tMs); return null; }
    if (action.type === 'next' && state.phase === 'levelDone') {
      if (state.level + 1 >= levels.length) state.phase = 'done';
      else begin(state.level + 1, tMs);
      return null;
    }
    if (state.phase !== 'play') return null;
    const L = levels[state.level];
    if (action.type === 'reset') { state.towers = L.start.map((x) => x.slice()); return { reset: true }; }
    if (action.type !== 'move') return null;
    const { from, to } = action;
    const ok = legalMoves(state.towers, L.caps).some(([f, tt]) => f === from && tt === to);
    if (!ok) { state.invalid++; return { ok: false }; }
    if (state.firstMoveAt == null) state.firstMoveAt = tMs;
    state.towers = applyMove(state.towers, [from, to]);
    state.moves++;
    if (keyOf(state.towers) === keyOf(L.target)) {
      const r = {
        level: state.level + 1, moves: state.moves, opt: L.opt, over: state.moves - L.opt,
        planMs: state.firstMoveAt - state.levelStart, totalMs: tMs - state.levelStart,
      };
      state.results.push(r);
      state.phase = 'levelDone';
      return { ok: true, solved: true, result: r };
    }
    return { ok: true };
  }

  function result() {
    const rs = state.results;
    const moves = rs.reduce((a, r) => a + r.moves, 0), opt = rs.reduce((a, r) => a + r.opt, 0);
    const movesOver = rs.length ? rs.reduce((a, r) => a + r.over, 0) / rs.length : Infinity;
    return {
      score: moves ? Math.round((100 * opt) / moves) : 0,
      metric: 'movesOver',
      value: movesOver,
      detail: {
        levels: rs,
        completed: rs.length,
        meanPlanMs: rs.length ? rs.reduce((a, r) => a + r.planMs, 0) / rs.length : 0,
        meanTotalMs: rs.length ? rs.reduce((a, r) => a + r.totalMs, 0) / rs.length : 0,
      },
    };
  }

  return { state, act, isOver: () => state.phase === 'done', result };
}
