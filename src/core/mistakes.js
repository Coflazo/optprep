// Wrong-answer history. A row is a small snapshot (prompt, options, your answer, the right
// one, the belief behind the miss); the full item can be rebuilt from its id and seed.
import { makeRng } from './rng.js';
import { beliefHash } from './patterns.js';

export const MISTAKE_CAP = 500;
const clip = (s, n) => (s == null ? null : String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

const orderText = (o) => (Array.isArray(o) ? o.map((v) => (typeof v === 'number' ? String.fromCharCode(65 + v) : String(v))).join(' > ') : null);

function answerText(item, response) {
  if (!response) return null;
  if (response.skip) return 'skipped';
  if (item.kind === 'mcq') return item.options?.[response.choice]?.label ?? null;
  if (item.kind === 'rank') return orderText(response.order);
  if (item.kind === 'interval') return `[${response.lower}, ${response.upper}]`;
  if (item.kind === 'orderbook') return clip(JSON.stringify(response.trades || []), 120);
  return clip(JSON.stringify(response), 120);
}

function correctText(item) {
  if (item.kind === 'mcq') return item.options?.[item.answerIndex]?.label ?? null;
  if (item.kind === 'rank') return orderText(item.answerOrder);
  if (item.kind === 'interval') return String(item.truth ?? item.answer?.value ?? '');
  if (item.kind === 'orderbook') return item.best ? `profit ${item.best.profit}` : null;
  return null;
}

export function mistakeRow(item, response, { mode = 'practice', ms = 0, now = Date.now() } = {}) {
  const picked = item.kind === 'mcq' ? item.options?.[response?.choice] : null;
  const belief = clip(picked?.misconception ?? null, 160);
  return {
    at: now, sid: item.section, fam: item.family, id: item.id, d: item.difficulty ?? 1, mode, ms, kind: item.kind,
    prompt: clip(item.prompt?.text ?? '', 400),
    options: item.kind === 'mcq' ? item.options.map((o) => o.label) : undefined,
    chosen: answerText(item, response), correct: correctText(item),
    belief, bk: belief ? beliefHash(belief) : null, n: 1,
  };
}

// Missing the same question again bumps the count instead of adding a row.
export function upsertMistake(list, row, cap = MISTAKE_CAP) {
  const i = list.findIndex((r) => r.id === row.id);
  if (i >= 0) { const prev = list.splice(i, 1)[0]; row = { ...row, n: (prev.n || 1) + 1 }; }
  list.push(row);
  if (list.length > cap) list.splice(0, list.length - cap);
  return list;
}

// Rebuild the question from its id. exact = false when the generator changed since the miss.
export function regenerate(row, modules) {
  const mod = modules[row.sid];
  if (!mod) return null;
  const banked = mod.bank?.find((b) => b.id === row.id);
  if (banked) return { item: banked, exact: true };
  const fam = mod.families.find((f) => f.id === row.fam);
  if (!fam) return null;
  const raw = row.id.slice(`${row.sid}:${row.fam}:`.length);
  const seed = /^\d+$/.test(raw) ? Number(raw) : raw;
  try {
    const item = fam.generate(makeRng(seed), { difficulty: row.d });
    return { item, exact: (item.prompt?.text ?? '').startsWith(String(row.prompt ?? '').replace(/…$/, '')) };
  } catch { return null; }
}
