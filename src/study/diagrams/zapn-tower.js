// Skyscraper (a Tower of London puzzle): three towers with height caps and lettered blocks
// (block 0 = A, 1 = B, ...). Towers are listed bottom to top and numbered 1 to 3 on screen.
// spec: { caps: [3, 3, 3], start: [[0, 1], [2], []], target?: [[..], [..], [..]],
//         path?: [[from, to], ...] (0-based towers), frames?: true (draw the state after every move),
//         opt?: n (BFS minimum from start to target), bound?: n (blocks outside the shared bottom stacks),
//         titles?: [startTitle, targetTitle] }
// validate: caps 1..6; every state fits its caps and holds the same distinct blocks 0..5; every path
// move is legal under the engine's rules and the path ends on the target; opt equals the engine's
// BFS optimum; bound equals the number of blocks that are not in the common bottom stack of start
// and target on the same tower (each of those must move at least once).
import { svg, text, line, rect } from './_util.js';
import { legalMoves, applyMove, keyOf, optimalMoves } from '../../zapn/skyscraper/engine.js';

export const LETTERS = 'ABCDEF';
const sharedBottom = (a, b) => { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; return k; };
// Lower bound on moves: every block outside the shared bottom stacks must move at least once.
export const lowerBound = (start, target) => start.flat().length - start.reduce((n, t, i) => n + sharedBottom(t, target[i]), 0);

function checkState(s, caps, name) {
  if (!Array.isArray(s) || s.length !== 3 || !s.every(Array.isArray)) return [`zapn-tower: ${name} needs three towers`];
  const e = [];
  s.forEach((t, i) => { if (t.length > caps[i]) e.push(`zapn-tower: ${name} tower ${i + 1} holds ${t.length}, cap ${caps[i]}`); });
  const all = s.flat();
  if (!all.every((b) => Number.isInteger(b) && b >= 0 && b < 6) || new Set(all).size !== all.length) e.push(`zapn-tower: ${name} blocks must be distinct ids 0..5`);
  return e;
}

export function validate(spec) {
  const { caps, start, target, path } = spec || {};
  if (!(Array.isArray(caps) && caps.length === 3 && caps.every((c) => Number.isInteger(c) && c >= 1 && c <= 6))) return ['zapn-tower: caps must be three integers 1..6'];
  const e = checkState(start, caps, 'start');
  if (target != null) {
    e.push(...checkState(target, caps, 'target'));
    if (!e.length && JSON.stringify(start.flat().sort()) !== JSON.stringify(target.flat().sort())) e.push('zapn-tower: start and target hold different blocks');
  }
  if (e.length) return e;
  if (path != null) {
    let cur = start;
    path.forEach((m, i) => {
      if (e.length) return;
      if (!legalMoves(cur, caps).some(([f, t]) => f === m[0] && t === m[1])) e.push(`zapn-tower: move ${i + 1} (${m[0] + 1} to ${m[1] + 1}) is illegal`);
      else cur = applyMove(cur, m);
    });
    if (!e.length && target && keyOf(cur) !== keyOf(target)) e.push('zapn-tower: path does not end on the target');
  }
  if (spec.opt != null) {
    if (!target) e.push('zapn-tower: opt needs a target');
    else { const o = optimalMoves(start, target, caps); if (o !== spec.opt) e.push(`zapn-tower: optimum is ${o}, stated ${spec.opt}`); }
  }
  if (spec.bound != null) {
    if (!target) e.push('zapn-tower: bound needs a target');
    else if (lowerBound(start, target) !== spec.bound) e.push(`zapn-tower: lower bound is ${lowerBound(start, target)}, stated ${spec.bound}`);
  }
  return e;
}

export const moveText = (towers, [f, t]) => `${LETTERS[towers[f][towers[f].length - 1]]}: ${f + 1} → ${t + 1}`;

export function render(spec) {
  const { caps } = spec;
  const TW = 30, G = 8, BH = 20, FW = 3 * TW + 2 * G, PAD = 26;
  const frames = [{ title: spec.titles?.[0] ?? 'start', towers: spec.start }];
  if (spec.frames && spec.path) {
    let cur = spec.start;
    spec.path.forEach((m, i) => { const label = `${i + 1}. ${moveText(cur, m)}`; cur = applyMove(cur, m); frames.push({ title: label, towers: cur }); });
  }
  if (spec.target && !(spec.frames && spec.path)) frames.push({ title: spec.titles?.[1] ?? 'target', towers: spec.target, target: true });
  const perRow = 5, rows = Math.ceil(frames.length / perRow);
  const hMax = Math.max(...caps);
  const FH = 22 + hMax * (BH + 2) + 22;
  const W = Math.min(frames.length, perRow) * (FW + PAD) + PAD;
  const foot = spec.opt != null || spec.bound != null ? 22 : 0;
  const H = rows * (FH + 8) + foot + 6;
  const parts = [];
  frames.forEach((f, i) => {
    const x0 = PAD + (i % perRow) * (FW + PAD), y0 = 6 + Math.floor(i / perRow) * (FH + 8);
    parts.push(text(x0 + FW / 2, y0 + 8, f.title, { class: `dg-text dg-small${f.target ? ' dg-strong-text' : ''}` }));
    const base = y0 + 22 + hMax * (BH + 2);
    f.towers.forEach((tw, k) => {
      const x = x0 + k * (TW + G);
      for (let s = 0; s < caps[k]; s++) parts.push(rect(x + 2, base - (s + 1) * (BH + 2), TW - 4, BH, 'dg-cell', 3));
      tw.forEach((b, s) => {
        parts.push(rect(x + 2, base - (s + 1) * (BH + 2), TW - 4, BH, `dg-region dg-tone-${(b % 5) + 1}`, 3));
        parts.push(text(x + TW / 2, base - (s + 1) * (BH + 2) + BH / 2, LETTERS[b], { class: 'dg-text dg-small dg-strong-text' }));
      });
      parts.push(line(x, base + 1, x + TW, base + 1, 'dg-line dg-strong'));
      parts.push(text(x + TW / 2, base + 12, k + 1, { class: 'dg-text dg-small dg-muted dg-mono' }));
    });
    if (i > 0 && i % perRow !== 0) parts.push(text(x0 - PAD / 2, y0 + FH / 2, '→', { class: 'dg-text dg-muted' }));
  });
  if (foot) parts.push(text(PAD, H - 12, [spec.bound != null ? `lower bound ${spec.bound} moves` : '', spec.opt != null ? `minimum ${spec.opt} moves` : ''].filter(Boolean).join(' · '), { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `Skyscraper towers, ${frames.length} states`, ...parts);
}
