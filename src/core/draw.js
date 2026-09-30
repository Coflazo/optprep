// Drawing items for sessions: exam replicas (fixed count, difficulty ramp, bank mix,
// unique prompts, deterministic per seed) and adaptive practice.
import { makeRng } from './rng.js';
import { familyWeights, pickFamily } from './adaptive.js';

export function nearestLevel(levels, d) {
  const ls = levels?.length ? levels : [1];
  return ls.reduce((best, l) => (Math.abs(l - d) < Math.abs(best - d) ? l : best), ls[0]);
}

export function drawItem(section, rng, { family, difficulty } = {}) {
  const f = family ? section.families.find((x) => x.id === family) : rng.pick(section.families);
  if (!f) throw new Error(`no family ${family} in ${section.id}`);
  const level = difficulty ? nearestLevel(f.levels, difficulty) : rng.pick(f.levels?.length ? f.levels : [1]);
  return f.generate(rng.fork(`${f.id}:${rng.int(0, 2 ** 31)}`), { difficulty: level });
}

// cfg: { count, ramp?: boolean, bankRatio?: number }
export function examItems(section, cfg, seed) {
  const rng = makeRng(`exam:${section.id}:${seed}`);
  const count = cfg.count;
  const bankPool = rng.shuffle(section.bank || []);
  const nBank = Math.min(bankPool.length, Math.round(count * (cfg.bankRatio ?? 0.2)));
  const bankSlots = new Set(rng.shuffle([...Array(count).keys()]).slice(0, nBank));
  const famOrder = [];
  const out = [];
  const seen = new Set();
  let bankIdx = 0;
  for (let i = 0; i < count; i++) {
    const target = cfg.ramp ? 1 + Math.floor((i / count) * 5) : 1 + (i % 5);
    if (bankSlots.has(i) && bankIdx < bankPool.length) {
      // prefer a bank item near the target difficulty
      bankPool.sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target));
      const it = bankPool.splice(0, 1)[0];
      if (!seen.has(it.prompt.text)) { seen.add(it.prompt.text); out.push(it); continue; }
    }
    if (!famOrder.length) famOrder.push(...rng.shuffle(section.families));
    // families that can reach the target difficulty come first
    famOrder.sort((a, b) => Math.abs(nearestLevel(a.levels, target) - target) - Math.abs(nearestLevel(b.levels, target) - target));
    const f = famOrder.shift();
    let it; let tries = 0;
    do { it = drawItem(section, rng, { family: f.id, difficulty: target }); tries++; } while (seen.has(it.prompt.text) && tries < 30);
    seen.add(it.prompt.text);
    out.push(it);
  }
  if (cfg.ramp) out.sort((a, b) => a.difficulty - b.difficulty);
  return out;
}

export function practiceItem(section, rng, stats, { family, difficulty } = {}) {
  if (family) return drawItem(section, rng, { family, difficulty });
  const w = familyWeights(section.id, section.families.map((f) => f.id), stats);
  return drawItem(section, rng, { family: pickFamily(rng, w), difficulty });
}

export function examScore(sectionId, scores) {
  const score = Math.round(scores.reduce((s, x) => s + x, 0) * 1000) / 1000;
  return { score, max: scores.length };
}
