// CodeCompare: a licence-plate style target and four candidates, exactly one identical.
// Distractors differ by 1 or 2 edits: a look-alike swap (O/0, I/1, S/5, B/8, ...), or an
// adjacent transposition. Time allowance shrinks linearly from 5 s to 3 s; length grows 7 -> 10.

export const DEFAULTS = { rounds: 30, startMs: 5000, endMs: 3000, minLen: 7, maxLen: 10, options: 4, gapMs: 500 };
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
export const LOOKALIKE = {
  O: '0DQ', 0: 'OD', D: '0O', Q: 'O0', I: '1L', 1: 'I7L', L: '1I', S: '5', 5: 'S6', B: '83', 8: 'B3', 3: '8B',
  Z: '2', 2: 'Z', G: '6C', 6: 'G5', C: 'G', E: 'FB', F: 'EP', M: 'NW', N: 'MH', H: 'N', U: 'V', V: 'UY', W: 'M',
  P: 'RF', R: 'P', T: '7', 7: 'T1', A: '4', 4: 'A', K: 'X', X: 'K', Y: 'V', J: 'U', 9: '6',
};

export const allowanceMs = (i, o = DEFAULTS) => Math.round(o.startMs + ((o.endMs - o.startMs) * i) / Math.max(1, o.rounds - 1));
export const lengthAt = (i, o = DEFAULTS) => o.minLen + Math.floor((i * (o.maxLen - o.minLen + 1)) / o.rounds);

// Hamming-style difference count that treats one adjacent transposition as one edit.
export function editCount(a, b) {
  if (a.length !== b.length) return Infinity;
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (i + 1 < a.length && a[i] === b[i + 1] && a[i + 1] === b[i]) { n++; i++; } else n++;
  }
  return n;
}

function mutate(rng, s, edits) {
  const chars = s.split('');
  const used = new Set();
  for (let k = 0; k < edits; k++) {
    const free = [...chars.keys()].filter((i) => !used.has(i) && !used.has(i - 1) && !used.has(i + 1));
    const i = rng.pick(free);
    const canSwap = i + 1 < chars.length && chars[i] !== chars[i + 1] && !used.has(i + 2);
    if (canSwap && rng.chance(0.3)) {
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      used.add(i); used.add(i + 1);
    } else {
      const look = LOOKALIKE[chars[i]];
      chars[i] = look ? rng.pick(look.split('')) : rng.pick(ALPHABET.filter((c) => c !== chars[i]));
      used.add(i);
    }
  }
  return chars.join('');
}

export function generateRound(rng, i, o = DEFAULTS) {
  const len = lengthAt(i, o);
  // Bias toward characters that have look-alikes so swaps are genuinely confusable.
  const pool = Object.keys(LOOKALIKE);
  const target = Array.from({ length: len }, () => rng.pick(rng.chance(0.7) ? pool : ALPHABET)).join('');
  const distractors = new Set();
  while (distractors.size < o.options - 1) {
    const d = mutate(rng, target, rng.chance(0.5) ? 1 : 2);
    if (d !== target) distractors.add(d);
  }
  const options = rng.shuffle([target, ...distractors]);
  return { target, options, answer: options.indexOf(target), allowanceMs: allowanceMs(i, o), len };
}

export function createEngine(rng, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const rounds = Array.from({ length: o.rounds }, (_, i) => generateRound(rng, i, o));
  const state = { phase: 'ready', i: 0, onset: null, gapUntil: null, responses: [], rounds, opts: o };

  function answer(choice, t) {
    const R = rounds[state.i];
    const r = { i: state.i, choice, correct: choice === R.answer, rt: choice == null ? null : t - state.onset, timeout: choice == null };
    state.responses.push(r);
    state.phase = 'gap';
    state.gapUntil = t + o.gapMs;
    return r;
  }

  function tick(t) {
    if (state.phase === 'show' && t - state.onset >= rounds[state.i].allowanceMs) return answer(null, state.onset + rounds[state.i].allowanceMs);
    if (state.phase === 'gap' && t >= state.gapUntil) {
      state.i++;
      if (state.i >= rounds.length) state.phase = 'done';
      else { state.phase = 'show'; state.onset = t; }
    }
    return null;
  }

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') { state.phase = 'show'; state.onset = tMs; } return null; }
    if (state.phase === 'ready') return null;
    const timedOut = tick(tMs);
    if (action.type === 'tick') return timedOut;
    if (action.type === 'choose' && state.phase === 'show') return answer(action.index, tMs);
    return null;
  }

  const remaining = (t) => (state.phase === 'show' ? Math.max(0, rounds[state.i].allowanceMs - (t - state.onset)) : 0);

  function result() {
    const rs = state.responses, correct = rs.filter((r) => r.correct);
    return {
      score: correct.length,
      metric: 'accuracy',
      value: correct.length / o.rounds,
      detail: {
        correct: correct.length, timeouts: rs.filter((r) => r.timeout).length, rounds: o.rounds,
        meanRt: correct.length ? correct.reduce((a, r) => a + r.rt, 0) / correct.length : null,
      },
    };
  }

  return { state, act, remaining, isOver: () => state.phase === 'done', result };
}
