// Practice picks families in proportion to weakness. Accuracy is smoothed
// ((correct+1)/(n+2)) so one lucky answer does not hide a family.
export function familyWeights(section, familyIds, stats) {
  const w = {};
  for (const id of familyIds) {
    const s = stats[`${section}:${id}`];
    if (!s || s.n === 0) { w[id] = 2; continue; }
    const acc = (s.correct + 1) / (s.n + 2);
    w[id] = 0.3 + 3 * (1 - acc);
  }
  return w;
}

export function pickFamily(rng, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let x = rng.next() * total;
  for (const [k, v] of entries) { x -= v; if (x <= 0) return k; }
  return entries[entries.length - 1][0];
}
