// Seeded PRNG (mulberry32). Every generator takes one of these so an item can be
// rebuilt from its seed, and tests can sweep thousands of seeds reproducibly.

function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function makeRng(seed = Date.now()) {
  let a = (typeof seed === 'string' ? hashString(seed) : (seed >>> 0)) || 0x9e3779b9;
  const origin = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    seed: origin,
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    float: (lo, hi) => lo + next() * (hi - lo),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    // Standard normal via Box-Muller.
    normal: (mu = 0, sd = 1) => {
      const u = Math.max(next(), 1e-12), v = next();
      return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    fork: (label) => makeRng(hashString(`${String(origin)}|${label}`)),
  };
  return rng;
}

export { hashString };
