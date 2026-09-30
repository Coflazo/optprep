// Multiple-choice builder for "pick the closest value" questions.
// Every wrong option must come from a named false belief, so a wrong pick can be
// answered with "your reasoning broke HERE" instead of a generic explanation.

const defaultGap = (c) => Math.max(0.012, Math.abs(c) * 0.07);

export function buildMcq(rng, { correct, distractors, format, count = 5, minGap = defaultGap, fillers }) {
  const label = (v) => format(v);
  const chosen = [];
  const seen = new Set([label(correct)]);
  const farEnough = (v) => chosen.every((o) => Math.abs(o.value - v) >= minGap(correct) * 0.5) &&
    Math.abs(v - correct) >= minGap(correct);
  for (const d of rng.shuffle(distractors)) {
    if (chosen.length === count - 1) break;
    if (!Number.isFinite(d.value) || !d.misconception) continue;
    const l = label(d.value);
    if (seen.has(l) || !farEnough(d.value)) continue;
    seen.add(l);
    chosen.push({ label: l, value: d.value, misconception: d.misconception });
  }
  // Fallback fillers keep the option count stable when a family's error list runs dry.
  const extra = fillers || defaultFillers(correct);
  for (const f of extra) {
    if (chosen.length === count - 1) break;
    const l = label(f.value);
    if (seen.has(l) || !farEnough(f.value) || !Number.isFinite(f.value)) continue;
    seen.add(l);
    chosen.push({ label: l, value: f.value, misconception: f.misconception });
  }
  if (chosen.length < count - 1) throw new Error(`buildMcq: only ${chosen.length + 1} distinct options for ${correct}`);
  const options = [...chosen, { label: label(correct), value: correct, misconception: null }]
    .sort((a, b) => a.value - b.value);
  return { options, answerIndex: options.findIndex((o) => o.misconception === null) };
}

function defaultFillers(c) {
  const isProb = c >= 0 && c <= 1;
  const cands = isProb
    ? [c / 2, c * 1.5, 1 - c, c * c, Math.sqrt(c), c + 0.1, c - 0.1, c * 2, c + 0.2, c - 0.2]
    : [c * 2, c / 2, c * 1.5, c * 0.75, c + 1, c - 1, c * 3, c / 3];
  return cands
    .filter((v) => (isProb ? v > 0 && v < 1 : v !== 0))
    .map((v) => ({ value: v, misconception: 'Magnitude guess: this value matches no correct method; estimate the size of the answer before committing' }));
}
