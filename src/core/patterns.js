// Weak patterns: which families and which false beliefs keep costing points. Counters
// decay with a 7-day half-life so recent misses matter most, and a Wilson lower bound
// keeps one unlucky answer from looking like a pattern.
export const HALF_LIFE = 7 * 24 * 3600e3;

export const beliefKey = (text) => String(text).toLowerCase().replace(/\d+(\.\d+)?/g, '#').replace(/\s+/g, ' ').trim().slice(0, 140);

export function beliefHash(text) {
  let h = 2166136261 >>> 0;
  const s = beliefKey(text);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}

const decay = (at, now, H) => 0.5 ** (Math.max(0, now - at) / H);

// One answer: n counts attempts, c counts correct ones, both decayed to `now`.
export function trendStep(t, correct, now, H = HALF_LIFE) {
  const f = t ? decay(t.at, now, H) : 0;
  return { n: (t?.n || 0) * f + 1, c: (t?.c || 0) * f + (correct ? 1 : 0), at: now };
}

export function decayed(t, now, H = HALF_LIFE) {
  if (!t) return { n: 0, c: 0 };
  const f = decay(t.at, now, H);
  return { n: t.n * f, c: t.c * f };
}

// Lower bound of the share k/n at confidence z (1.28 is one-sided 90%).
export function wilsonLower(k, n, z = 1.28) {
  if (n <= 0) return 0;
  const p = Math.min(1, Math.max(0, k / n));
  const z2 = z * z;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return Math.max(0, (centre - margin) / (1 + z2 / n));
}

// Top patterns, at most two per family. A family needs about 3 recent attempts and a
// miss rate whose lower bound is at least 20%. A belief's rate is its decayed misses over
// its family's decayed attempts.
export function weakPatterns({ trend = {}, mistakes = [], now = Date.now(), limit = 5, H = HALF_LIFE } = {}) {
  const out = [];
  for (const [key, t] of Object.entries(trend)) {
    const { n, c } = decayed(t, now, H);
    if (n < 3) continue;
    const [sid, fam] = key.split(':');
    const lb = wilsonLower(n - c, n);
    if (lb >= 0.2) out.push({ type: 'family', sid, fam, key, k: n - c, n, lb });
  }
  const beliefs = new Map();
  for (const m of mistakes) {
    if (!m.belief) continue;
    const id = `${m.sid}:${m.fam}:${m.bk}`;
    const b = beliefs.get(id) || { sid: m.sid, fam: m.fam, text: m.belief, k: 0 };
    b.k += (m.n || 1) * decay(m.at, now, H);
    beliefs.set(id, b);
  }
  for (const b of beliefs.values()) {
    const key = `${b.sid}:${b.fam}`;
    const n = decayed(trend[key], now, H).n;
    if (n < 3) continue;
    const lb = wilsonLower(Math.min(b.k, n), n);
    if (lb >= 0.2) out.push({ type: 'belief', sid: b.sid, fam: b.fam, key, text: b.text, k: b.k, n, lb });
  }
  out.sort((a, b) => b.lb - a.lb);
  const perFamily = new Map();
  const picked = [];
  for (const p of out) {
    const used = perFamily.get(p.key) || 0;
    if (used >= 2) continue;
    perFamily.set(p.key, used + 1);
    picked.push(p);
    if (picked.length === limit) break;
  }
  return picked;
}
