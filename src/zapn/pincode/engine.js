// Pincode: memorise a digit code, then type it forward, reversed, or sorted ascending.
// At each length: two correct answers move up one digit, two wrong answers end the mode.
// The code is shown whole for max(minShowMs, len * msPerDigit), then hidden for input.

export const MODES = ['forward', 'reverse', 'sorted'];
export const DEFAULTS = { startLen: 3, maxLen: 16, msPerDigit: 600, minShowMs: 1500, feedbackMs: 900 };

export function expected(digits, mode) {
  if (mode === 'reverse') return [...digits].reverse().join('');
  if (mode === 'sorted') return [...digits].sort().join('');
  return digits;
}

export const showMs = (len, o = DEFAULTS) => Math.max(o.minShowMs, len * o.msPerDigit);

export function createEngine(rng, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const state = {
    phase: 'ready', mode: 0, len: o.startLen, okAtLen: 0, badAtLen: 0,
    digits: '', typed: '', showUntil: null, inputAt: null, feedbackUntil: null,
    spans: { forward: 0, reverse: 0, sorted: 0 }, trials: [], last: null, opts: o,
  };

  function newTrial(t) {
    state.digits = Array.from({ length: state.len }, () => rng.int(0, 9)).join('');
    state.typed = '';
    state.phase = 'show';
    state.showUntil = t + showMs(state.len, o);
  }

  function afterFeedback(t) {
    const modeOver = state.badAtLen >= 2 || state.len > o.maxLen;
    if (modeOver) {
      state.mode++;
      if (state.mode >= MODES.length) { state.phase = 'done'; return; }
      state.len = o.startLen; state.okAtLen = 0; state.badAtLen = 0;
    }
    newTrial(t);
  }

  function tick(t) {
    if (state.phase === 'show' && t >= state.showUntil) { state.phase = 'input'; state.inputAt = t; }
    if (state.phase === 'feedback' && t >= state.feedbackUntil) afterFeedback(t);
  }

  function submit(t) {
    const mode = MODES[state.mode];
    const want = expected(state.digits, mode);
    const correct = state.typed === want;
    const trial = { mode, len: state.len, digits: state.digits, want, typed: state.typed, correct, ms: t - state.inputAt };
    state.trials.push(trial);
    state.last = trial;
    if (correct) {
      state.spans[mode] = Math.max(state.spans[mode], state.len);
      if (++state.okAtLen >= 2) { state.len++; state.okAtLen = 0; state.badAtLen = 0; }
    } else state.badAtLen++;
    state.phase = 'feedback';
    state.feedbackUntil = t + o.feedbackMs;
    return trial;
  }

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') newTrial(tMs); return null; }
    if (state.phase === 'ready') return null;
    tick(tMs);
    if (state.phase !== 'input') return null;
    if (action.type === 'digit' && /^[0-9]$/.test(String(action.d)) && state.typed.length < o.maxLen + 1) state.typed += String(action.d);
    else if (action.type === 'back') state.typed = state.typed.slice(0, -1);
    else if (action.type === 'submit') return submit(tMs);
    return null;
  }

  function result() {
    return {
      score: state.spans.forward + state.spans.reverse + state.spans.sorted,
      metric: 'span',
      value: state.spans.forward,
      detail: { spans: { ...state.spans }, trials: state.trials.length, correct: state.trials.filter((x) => x.correct).length },
    };
  }

  return { state, act, isOver: () => state.phase === 'done', result };
}
