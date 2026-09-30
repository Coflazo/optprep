// The Switch: every round shows an arithmetic block (top) and two arrow sets (bottom).
// One block is highlighted. Top active: "Is the result odd?" Bottom active: "Do both arrow
// sets point the same way?" Answer yes/no. The active block switches unpredictably:
// exactly half of the 34 transitions are switches, in shuffled order.

export const DEFAULTS = { rounds: 35, deadlineMs: 4000, itiMs: 500 };

function mathItem(rng, odd) {
  for (;;) {
    const plus = rng.chance(0.5);
    const a = rng.int(plus ? 2 : 6, plus ? 19 : 25), b = rng.int(2, plus ? 19 : a - 1);
    const value = plus ? a + b : a - b;
    if ((value % 2 === 1) === odd) return { text: `${a} ${plus ? '+' : '-'} ${b}`, value };
  }
}

function arrowItem(rng, same) {
  const d = rng.pick(['left', 'right']);
  return { a: { dir: d, n: rng.int(3, 5) }, b: { dir: same ? d : d === 'left' ? 'right' : 'left', n: rng.int(3, 5) }, same };
}

export function generateTrials(rng, rounds) {
  const half = Math.floor((rounds - 1) / 2);
  const switches = rng.shuffle([...Array(half).fill(true), ...Array(rounds - 1 - half).fill(false)]);
  let task = rng.pick(['math', 'arrows']);
  return Array.from({ length: rounds }, (_, i) => {
    if (i > 0 && switches[i - 1]) task = task === 'math' ? 'arrows' : 'math';
    const math = mathItem(rng, rng.chance(0.5));
    const arrows = arrowItem(rng, rng.chance(0.5));
    const answer = task === 'math' ? math.value % 2 === 1 : arrows.same;
    return { task, math, arrows, answer, switch: i > 0 && switches[i - 1] };
  });
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function createEngine(rng, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const trials = generateTrials(rng, o.rounds);
  const state = { phase: 'ready', i: 0, onsetAt: null, stimAt: null, responses: [], trials, opts: o };

  function record(yes, t) {
    const T = trials[state.i];
    const r = { i: state.i, task: T.task, switch: T.switch, yes, correct: yes === T.answer, rt: yes == null ? null : t - state.stimAt, timeout: yes == null };
    state.responses.push(r);
    state.i++;
    if (state.i >= trials.length) state.phase = 'done';
    else { state.phase = 'iti'; state.onsetAt = t + o.itiMs; }
    return r;
  }

  function tick(t) {
    if (state.phase === 'iti' && t >= state.onsetAt) { state.phase = 'stim'; state.stimAt = t; }
    if (state.phase === 'stim' && t - state.stimAt >= o.deadlineMs) return record(null, state.stimAt + o.deadlineMs);
    return null;
  }

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') { state.phase = 'iti'; state.onsetAt = tMs + o.itiMs; } return null; }
    if (state.phase === 'ready') return null;
    const unseen = state.phase === 'iti';
    const timedOut = tick(tMs);
    if (action.type === 'tick') return timedOut;
    if (action.type === 'answer' && state.phase === 'stim' && !unseen) return record(!!action.yes, tMs);
    return null;
  }

  function result() {
    const rs = state.responses, ok = rs.filter((r) => r.correct);
    const accuracy = ok.length / o.rounds;
    const meanRt = mean(ok.map((r) => r.rt));
    const sw = mean(ok.filter((r) => r.switch).map((r) => r.rt)), rep = mean(ok.filter((r) => !r.switch && r.i > 0).map((r) => r.rt));
    // Speed and accuracy weigh equally. Speed maps mean correct RT from 400 ms (1) to the deadline (0).
    const speed = meanRt == null ? 0 : Math.min(1, Math.max(0, (o.deadlineMs - meanRt) / (o.deadlineMs - 400)));
    return {
      score: Math.round(100 * (0.5 * accuracy + 0.5 * speed)),
      metric: 'accuracy',
      value: accuracy,
      detail: {
        correct: ok.length, rounds: o.rounds, timeouts: rs.filter((r) => r.timeout).length, meanRt,
        switchCost: sw != null && rep != null ? sw - rep : null,
        switchAccuracy: mean(rs.filter((r) => r.switch).map((r) => (r.correct ? 1 : 0))),
        repeatAccuracy: mean(rs.filter((r) => !r.switch && r.i > 0).map((r) => (r.correct ? 1 : 0))),
      },
    };
  }

  return { state, act, isOver: () => state.phase === 'done', result };
}
