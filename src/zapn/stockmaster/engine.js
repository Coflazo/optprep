// Stock Master: gauges appear in fixed slots; each needle sweeps from 0 to 1 at its own
// speed and the gauge vanishes when it reaches 1. Click (or press the slot key) while the
// needle is inside the coloured zone to buy. Each gauge has exactly one outcome:
//   hit   clicked inside the zone
//   false clicked outside the zone (too early or too late); clicking an empty slot is also false
//   miss  never clicked before the needle ran out
// The full schedule is drawn up front from the rng, so play is deterministic given click times.
// Speeds rise over the 2 minutes (x1 to x1.6). Slot count, speeds and zone sizes are this trainer's choice.

export const DEFAULTS = {
  durationMs: 120000, slots: 4, gapMin: 400, gapMax: 1800,
  speedMin: 0.25, speedMax: 0.55, rampTo: 1.6, zoneMin: 0.12, zoneMax: 0.2,
};

export function schedule(rng, o = DEFAULTS) {
  const out = [];
  for (let slot = 0; slot < o.slots; slot++) {
    let t = rng.int(0, o.gapMax);
    while (t < o.durationMs) {
      const ramp = 1 + (o.rampTo - 1) * (t / o.durationMs);
      const speed = rng.float(o.speedMin, o.speedMax) * ramp; // sweeps per second
      const width = rng.float(o.zoneMin, o.zoneMax);
      const z0 = rng.float(0.4, 0.9 - width);
      const end = t + 1000 / speed;
      out.push({ slot, spawn: t, end, speed, zone: [z0, z0 + width] });
      t = end + rng.int(o.gapMin, o.gapMax);
    }
  }
  out.sort((a, b) => a.spawn - b.spawn || a.slot - b.slot);
  out.forEach((g, id) => { g.id = id; });
  return out;
}

export const needle = (g, rel) => Math.min(1, Math.max(0, ((rel - g.spawn) * g.speed) / 1000));

export function createEngine(rng, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const gauges = schedule(rng, o);
  const outcome = new Map(); // gauge id -> 'hit' | 'false' | 'miss'
  const state = { phase: 'ready', startAt: null, gauges, outcome, hits: 0, misses: 0, falseClicks: 0, clicks: [], opts: o };

  function tick(t) {
    const rel = t - state.startAt;
    const until = Math.min(rel, o.durationMs);
    for (const g of gauges) {
      if (g.spawn > until) break;
      if (g.end <= until && !outcome.has(g.id)) { outcome.set(g.id, 'miss'); state.misses++; }
    }
    if (rel >= o.durationMs) state.phase = 'done';
  }

  // Gauges visible at time t (relative), for the view.
  const active = (rel) => gauges.filter((g) => g.spawn <= rel && rel < g.end && !outcome.has(g.id));

  function act(action, tMs) {
    if (state.phase === 'done') return null;
    if (action.type === 'start') { if (state.phase === 'ready') { state.phase = 'play'; state.startAt = tMs; } return null; }
    if (state.phase !== 'play') return null;
    tick(tMs);
    if (state.phase !== 'play' || action.type !== 'click') return null;
    const rel = tMs - state.startAt;
    const g = active(rel).find((x) => x.slot === action.slot);
    if (!g) { state.falseClicks++; state.clicks.push({ rel, slot: action.slot, result: 'empty' }); return { result: 'empty' }; }
    const p = needle(g, rel);
    const hit = p >= g.zone[0] && p <= g.zone[1];
    outcome.set(g.id, hit ? 'hit' : 'false');
    if (hit) state.hits++; else state.falseClicks++;
    const r = { rel, slot: action.slot, id: g.id, p, result: hit ? 'hit' : p < g.zone[0] ? 'early' : 'late' };
    state.clicks.push(r);
    return r;
  }

  function result() {
    const { hits, misses, falseClicks } = state;
    const n = hits + misses + falseClicks;
    return {
      score: hits,
      metric: 'accuracy',
      value: n ? hits / n : 0,
      detail: {
        hits, misses, falseClicks, gauges: outcome.size,
        early: state.clicks.filter((c) => c.result === 'early').length,
        late: state.clicks.filter((c) => c.result === 'late').length,
        empty: state.clicks.filter((c) => c.result === 'empty').length,
      },
    };
  }

  return { state, act, active: (tMs) => active(tMs - state.startAt), isOver: () => state.phase === 'done', result };
}
