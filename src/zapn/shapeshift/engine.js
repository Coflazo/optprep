// Shapeshift: a circle or a square flashes at a random position. Right arrow = circle,
// left arrow = square. The view feeds 'tick' every frame; all timing comes from tMs.
// Flash and response-window lengths are this trainer's choice (sources say only "briefly").

export const DEFAULTS = { rounds: 60, flashMs: 500, windowMs: 1500, itiMin: 500, itiMax: 1100 };
export const KEY_FOR = { circle: 'right', square: 'left' };

export function createEngine(rng, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const half = Math.floor(o.rounds / 2);
  const shapes = rng.shuffle([...Array(half).fill('circle'), ...Array(o.rounds - half).fill('square')]);
  const trials = shapes.map((shape) => ({
    shape, x: rng.float(0.1, 0.9), y: rng.float(0.15, 0.85), iti: rng.int(o.itiMin, o.itiMax),
  }));
  const state = { phase: 'ready', i: 0, onsetAt: null, stimAt: null, responses: [], early: 0, trials, opts: o };

  function next(t) {
    state.i++;
    if (state.i >= trials.length) { state.phase = 'done'; return; }
    state.phase = 'iti';
    state.onsetAt = t + trials[state.i].iti;
    state.stimAt = null;
  }

  function record(r, t) {
    state.responses.push(r);
    next(t);
    return r;
  }

  function tick(t) {
    if (state.phase === 'iti' && t >= state.onsetAt) { state.phase = 'stim'; state.stimAt = t; }
    if (state.phase === 'stim' && t - state.stimAt >= o.windowMs) {
      return record({ i: state.i, shape: trials[state.i].shape, key: null, correct: false, rt: null, miss: true }, t);
    }
    return null;
  }

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') {
      if (state.phase === 'ready') { state.phase = 'iti'; state.onsetAt = tMs + trials[0].iti; }
      return null;
    }
    if (state.phase === 'ready') return null;
    const unseen = state.phase === 'iti'; // stimulus not yet drawn before this event
    const timedOut = tick(tMs);
    if (action.type === 'tick') return timedOut;
    if (action.type === 'key') {
      if (unseen || state.phase === 'iti') { state.early++; return { early: true }; }
      if (state.phase !== 'stim') return null;
      const shape = trials[state.i].shape;
      return record({ i: state.i, shape, key: action.key, correct: action.key === KEY_FOR[shape], rt: tMs - state.stimAt, miss: false }, tMs);
    }
    return null;
  }

  // Visible only for the first flashMs of the response window.
  const visible = (t) => state.phase === 'stim' && t - state.stimAt < o.flashMs;

  function result() {
    const rs = state.responses;
    const correct = rs.filter((r) => r.correct);
    const meanRt = correct.length ? correct.reduce((a, r) => a + r.rt, 0) / correct.length : null;
    return {
      score: correct.length,
      metric: 'accuracy',
      value: correct.length / o.rounds,
      detail: { correct: correct.length, answered: rs.filter((r) => !r.miss).length, misses: rs.filter((r) => r.miss).length, early: state.early, meanRt, rounds: o.rounds },
    };
  }

  return { state, act, visible, isOver: () => state.phase === 'done', result };
}
