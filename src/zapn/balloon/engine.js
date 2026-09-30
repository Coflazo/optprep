// Balloon: Balloon Analogue Risk Task as reported for Zap-N.
// Pop model (this trainer's choice; the real distribution is not published): each balloon
// has a hidden pop point K ~ Uniform{1..N}. The K-th pump pops it, so t pumps are safe
// exactly when K > t, which has probability (N - t) / N.
// Money is integer cents. Round 2 pops also cost floor(bank * 0.5) of that round's bank.

export const MAX_PUMPS = 20; // N
export const ROUNDS = [
  { balloons: 30, centsPerPump: 10, bankPenalty: 0 },
  { balloons: 20, centsPerPump: 20, bankPenalty: 0.5 },
];

const popLoss = (bank, penalty) => Math.floor(bank * penalty);

// Backward induction over (balloons left, bank in cents). Within one balloon the only
// information is "not popped yet", so choosing a pump target t up front loses nothing.
// Returns policy[b][bank] = EV-optimal target with b balloons left, and ev = expected final bank.
const solved = new Map();
export function solveRound(round, N = MAX_PUMPS) {
  const key = `${round.balloons}|${round.centsPerPump}|${round.bankPenalty}|${N}`;
  if (solved.has(key)) return solved.get(key);
  const { balloons: n, centsPerPump: c, bankPenalty: p } = round;
  const maxBank = n * (N - 1) * c;
  let next = Float64Array.from({ length: maxBank + 1 }, (_, b) => b); // no balloons left: keep the bank
  const policy = [null];
  for (let b = 1; b <= n; b++) {
    const reach = (n - b) * (N - 1) * c; // most the bank can hold with b balloons still to play
    const cur = new Float64Array(maxBank + 1), pol = new Uint8Array(reach + 1);
    for (let bank = 0; bank <= reach; bank++) {
      const popped = next[bank - popLoss(bank, p)];
      let best = -Infinity, bestT = 0;
      for (let t = 0; t < N; t++) {
        const ev = ((N - t) * next[bank + t * c] + t * popped) / N;
        if (ev > best + 1e-9) { best = ev; bestT = t; }
      }
      cur[bank] = best; pol[bank] = bestT;
    }
    policy.push(pol);
    next = cur;
  }
  const out = { policy, ev: next[0] };
  solved.set(key, out);
  return out;
}

// EV-optimal pump target for balloon index i (0-based) of a round, given the round bank so far.
// The bank before balloon i is at most i * (N - 1) * c, which is inside the policy table.
export function optimalTarget(round, i, bank, N = MAX_PUMPS) {
  return solveRound(round, N).policy[round.balloons - i][bank];
}

// What the EV-optimal policy earns on these exact pop points (removes luck from the benchmark).
export function optimalBank(round, pops, N = MAX_PUMPS) {
  let bank = 0;
  pops.forEach((k, i) => {
    const t = optimalTarget(round, i, bank, N);
    bank = k > t ? bank + t * round.centsPerPump : bank - popLoss(bank, round.bankPenalty);
  });
  return bank;
}

export function createEngine(rng, opts = {}) {
  const N = opts.maxPumps ?? MAX_PUMPS;
  const rounds = opts.rounds ?? ROUNDS;
  const pops = rounds.map((r) => Array.from({ length: r.balloons }, () => rng.int(1, N)));
  const state = {
    phase: 'ready', round: 0, balloon: 0, pumps: 0,
    banks: rounds.map(() => 0), log: rounds.map(() => []), last: null, startAt: null,
  };
  const cur = () => rounds[state.round];

  function endBalloon(outcome, t) {
    const r = cur();
    const before = state.banks[state.round];
    const earned = outcome === 'cash' ? state.pumps * r.centsPerPump : 0;
    const lost = outcome === 'pop' ? popLoss(before, r.bankPenalty) : 0;
    state.banks[state.round] += earned - lost;
    const entry = {
      pumps: state.pumps, outcome, earned, lost, popAt: pops[state.round][state.balloon],
      optimal: optimalTarget(r, state.balloon, before, N), t,
    };
    state.log[state.round].push(entry);
    state.last = entry;
    state.pumps = 0;
    state.balloon++;
    if (state.balloon >= r.balloons) {
      state.balloon = 0;
      state.round++;
      if (state.round >= rounds.length) state.phase = 'done';
    }
    return entry;
  }

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') { state.phase = 'play'; state.startAt = tMs; } return null; }
    if (state.phase !== 'play') return null;
    if (action.type === 'pump') {
      state.pumps++;
      if (state.pumps >= pops[state.round][state.balloon]) return endBalloon('pop', tMs);
      return { outcome: 'pumped', pumps: state.pumps };
    }
    if (action.type === 'cash') return endBalloon('cash', tMs);
    return null;
  }

  function result() {
    const bank = state.banks.reduce((a, b) => a + b, 0);
    const optimal = rounds.reduce((a, r, i) => a + optimalBank(r, pops[i], N), 0);
    const ratio = optimal > 0 ? bank / optimal : (bank >= 0 ? 1 : 0);
    const perRound = rounds.map((r, i) => ({
      bank: state.banks[i], optimal: optimalBank(r, pops[i], N), expected: solveRound(r, N).ev,
      pops: state.log[i].filter((e) => e.outcome === 'pop').length,
      meanPumps: state.log[i].length ? state.log[i].reduce((a, e) => a + e.pumps, 0) / state.log[i].length : 0,
    }));
    return { score: bank / 100, metric: 'ratio', value: ratio, detail: { bankCents: bank, optimalCents: optimal, perRound } };
  }

  return { state, act, isOver: () => state.phase === 'done', result, pops };
}
