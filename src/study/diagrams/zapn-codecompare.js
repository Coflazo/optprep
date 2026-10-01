// CodeCompare: a target code and its candidates, with the differing characters marked.
// spec: { target: 'K5O2B8Q', candidates: [{ code, diff?: [i, ...], edits?: n }], answer?: i, chunk?: 3 }
//   diff: 0-based positions where the candidate differs from the target (shaded).
//   edits: the engine's edit count (a swap of two neighbours counts as one edit, two positions).
//   chunk: draw the codes in groups of this size (how you read them).
// validate: codes use A-Z and 0-9 and match the target's length; every diff lists exactly the
// differing positions; edits equal the engine's editCount; a stated answer is the one candidate
// identical to the target, and exactly one candidate is identical.
import { svg, text, rect } from './_util.js';
import { editCount } from '../../zapn/codecompare/engine.js';

export const diffPositions = (a, b) => [...a].map((ch, i) => (ch === b[i] ? -1 : i)).filter((i) => i >= 0);

export function validate(spec) {
  const T = spec?.target;
  if (!(typeof T === 'string' && /^[A-Z0-9]{1,16}$/.test(T))) return ['zapn-codecompare: target must be 1..16 of A-Z, 0-9'];
  if (!Array.isArray(spec.candidates) || spec.candidates.length < 2) return ['zapn-codecompare: at least 2 candidates'];
  const e = [];
  spec.candidates.forEach((c, i) => {
    if (!(typeof c.code === 'string' && /^[A-Z0-9]+$/.test(c.code) && c.code.length === T.length)) { e.push(`zapn-codecompare: candidate ${i + 1} must be ${T.length} of A-Z, 0-9`); return; }
    const d = diffPositions(T, c.code);
    if (c.diff && JSON.stringify([...c.diff].sort((a, b) => a - b)) !== JSON.stringify(d)) e.push(`zapn-codecompare: candidate ${i + 1} differs at [${d}], marked [${c.diff}]`);
    if (c.edits != null && c.edits !== editCount(T, c.code)) e.push(`zapn-codecompare: candidate ${i + 1} is ${editCount(T, c.code)} edits away, stated ${c.edits}`);
  });
  if (spec.answer != null && !e.length) {
    const same = spec.candidates.map((c, i) => (c.code === T ? i : -1)).filter((i) => i >= 0);
    if (same.length !== 1) e.push(`zapn-codecompare: ${same.length} candidates are identical, need exactly 1`);
    else if (same[0] !== spec.answer) e.push(`zapn-codecompare: candidate ${same[0] + 1} is identical, answer says ${spec.answer + 1}`);
  }
  if (spec.chunk != null && !(Number.isInteger(spec.chunk) && spec.chunk >= 1 && spec.chunk <= 5)) e.push('zapn-codecompare: chunk must be 1..5');
  return e;
}

export function render(spec) {
  const CS = 24, GAP = 10, LW = 92;
  const k = spec.chunk || spec.target.length;
  const xOf = (i) => LW + i * CS + Math.floor(i / k) * GAP;
  const W = xOf(spec.target.length - 1) + CS + 16;
  const rows = [{ label: 'target', code: spec.target, diff: [] }, ...spec.candidates.map((c, i) => ({ label: `${i + 1}${spec.answer === i ? ' (same)' : ''}`, code: c.code, diff: diffPositions(spec.target, c.code) }))];
  const H = rows.length * (CS + 8) + 36;
  const parts = [];
  rows.forEach((r, j) => {
    const y = 8 + j * (CS + 8) + (j ? 8 : 0);
    parts.push(text(LW - 10, y + CS / 2, r.label, { 'text-anchor': 'end', class: `dg-text dg-small${j === 0 || spec.answer === j - 1 ? ' dg-strong-text' : ' dg-muted'}` }));
    [...r.code].forEach((ch, i) => {
      const on = r.diff.includes(i);
      parts.push(rect(xOf(i), y, CS - 2, CS, on ? 'dg-cell dg-cell-on' : 'dg-cell', 3));
      parts.push(text(xOf(i) + (CS - 2) / 2, y + CS / 2, ch, { class: `dg-text dg-mono${on ? ' dg-strong-text' : ''}` }));
    });
  });
  parts.push(text(LW, H - 8, 'shaded: differs from the target', { 'text-anchor': 'start', class: 'dg-text dg-small dg-muted' }));
  return svg(W, H, spec.label || `CodeCompare: target ${spec.target} and ${spec.candidates.length} candidates`, ...parts);
}
