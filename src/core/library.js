// The question library: at least LIBRARY_MIN fixed, distinct, numbered questions per
// section, split into exam-sized sets the candidate can work through in order.
// Deterministic (seeded), so Set 7 is always the same Set 7.
import { makeRng } from './rng.js';

export const LIBRARY_MIN = 500;
export const setCount = (setSize) => Math.ceil(LIBRARY_MIN / setSize);
const cache = new Map();

export function buildLibrary(section, { size = LIBRARY_MIN, cache: useCache = true } = {}) {
  const key = `${section.id}:${size}:${section.families.length}:${section.bank?.length || 0}`;
  if (useCache && cache.has(key)) return cache.get(key);
  const seen = new Set();
  const out = [];
  const add = (it) => { if (!it || seen.has(it.prompt.text)) return false; seen.add(it.prompt.text); out.push(it); return true; };
  const bank = [...(section.bank || [])];
  const fams = section.families.map((f) => ({ f, k: 0, misses: 0, done: false }));
  let slot = 0;
  while (out.length < size && (fams.some((x) => !x.done) || bank.length)) {
    // one curated bank item every 10th slot until the bank is used up
    if (bank.length && (slot % 10 === 9 || fams.every((x) => x.done))) { add(bank.shift()); slot++; continue; }
    const live = fams.filter((x) => !x.done);
    if (!live.length) break;
    const st = live[slot % live.length];
    const levels = st.f.levels?.length ? st.f.levels : [1];
    let placed = false;
    while (!placed && st.misses < 60) {
      const rng = makeRng(`lib:${section.id}:${st.f.id}:${st.k}`);
      const it = st.f.generate(rng, { difficulty: levels[st.k % levels.length] });
      st.k++;
      if (add(it)) { placed = true; st.misses = 0; } else st.misses++;
    }
    if (!placed) st.done = true;
    slot++;
  }
  if (useCache) cache.set(key, out);
  return out;
}

export function librarySets(library, setSize) {
  const sets = [];
  for (let i = 0; i < library.length; i += setSize) {
    sets.push([...library.slice(i, i + setSize)].sort((a, b) => a.difficulty - b.difficulty));
  }
  return sets;
}
