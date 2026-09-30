// Shared machinery for NumberLogic families: exact term labels, the generic rival-rule
// distractors, the item builder and the independent verifier. A family file only states
// its rule (terms), its parameters, its own rivals and its teaching text.
import { Q } from '../../core/rational.js';
import { buildMcq } from '../../core/options.js';
import { distinctNext, predictAll, parseTerm, close } from './solver.js';

export const q = (n, d = 1) => Q.of(n, d);
export const MINUS = '−';
const P10 = Array.from({ length: 9 }, (_, k) => 10n ** BigInt(k));

function decimalString(n, d) {
  for (let k = 0; k < P10.length; k++) {
    if (P10[k] % d !== 0n) continue;
    const scaled = n * (P10[k] / d);
    if (k === 0) return scaled.toString();
    const int = scaled / P10[k], frac = (scaled % P10[k]).toString().padStart(k, '0').replace(/0+$/, '');
    return frac ? `${int}.${frac}` : int.toString();
  }
  return null;
}

// Q -> display label. mode: 'int' | 'frac' | 'dec'.
export function label(x, mode = 'int') {
  const neg = x.n < 0n, n = neg ? -x.n : x.n, s = neg ? MINUS : '';
  if (x.d === 1n) return s + n.toString();
  if (mode === 'dec') { const dec = decimalString(n, x.d); if (dec) return s + dec; }
  return `${s}${n}/${x.d}`;
}
export const L = (x) => label(x, 'int');

// Plain-JSON encoding of a term for params: integers and terminating decimals as numbers,
// other fractions as "n/d" strings (ASCII minus).
export function encodeTerm(x) {
  if (x == null) return null;
  if (x.d === 1n || decimalString(x.n < 0n ? -x.n : x.n, x.d) !== null) return x.toNumber();
  return `${x.n}/${x.d}`;
}

// Display label -> exact Q ('−12', '3/4', '2.25').
export function parseQ(s) {
  const t = String(s).trim().replace(/\u2212/g, '-');
  const neg = t.startsWith('-'), u = neg ? t.slice(1) : t;
  let v;
  if (u.includes('/')) { const [a, b] = u.split('/'); v = Q.of(+a, +b); }
  else if (u.includes('.')) { const [a, b] = u.split('.'); v = new Q(BigInt(a + b), 10n ** BigInt(b.length)); }
  else v = Q.of(+u);
  return neg ? v.neg() : v;
}

export function displayable(x, mode) {
  if (!(x instanceof Q)) return false;
  if (mode === 'int') return x.d === 1n;
  if (mode === 'dec') return decimalString(x.n < 0n ? -x.n : x.n, x.d) !== null;
  return x.d !== 1n; // frac: every term a proper fraction label
}
const mag = (x) => Math.abs(x.toNumber());
export const list = (xs, mode = 'int') => xs.map((x) => label(x, mode)).join(', ');
export const diffsQ = (xs) => xs.slice(1).map((v, i) => v.sub(xs[i]));
export const ratiosQ = (xs) => xs.slice(1).map((v, i) => v.div(xs[i]));
const allEqual = (xs) => xs.every((v) => v.eq(xs[0]));

// Rival rules every sequence invites. Each names the exact belief and where it breaks.
export function genericRivals(shown, mode) {
  const n = shown.length, a = shown[n - 1], b = shown[n - 2], c = shown[n - 3];
  const out = [];
  const g = diffsQ(shown);
  const gl = list(g, mode);
  if (!allEqual(g)) {
    out.push({ value: a.add(a.sub(b)), misconception: `Repeated the last gap (${label(a.sub(b), mode)}) as if the differences were constant; the differences are ${gl}.` });
    const g2 = a.sub(b).sub(b.sub(c));
    out.push({ value: a.add(a.sub(b)).add(g2), misconception: `Assumed the gaps change by a constant ${label(g2, mode)} because the last two gaps do; the full list of gaps (${gl}) does not follow that.` });
  }
  if (shown.every((v) => !v.isZero())) {
    const r = ratiosQ(shown);
    if (!allEqual(r)) out.push({ value: a.mul(a).div(b), misconception: `Repeated the last ratio (×${label(a.div(b), 'frac')}) as if the sequence were geometric; the earlier ratios differ.` });
  }
  const fibFail = shown.findIndex((v, i) => i >= 2 && !v.eq(shown[i - 1].add(shown[i - 2])));
  if (fibFail > 0) out.push({ value: a.add(b), misconception: `Assumed each term is the sum of the two before it; that already fails at term ${fibFail + 1} (${label(shown[fibFail - 2], mode)} + ${label(shown[fibFail - 1], mode)} is not ${label(shown[fibFail], mode)}).` });
  if (n >= 4) {
    // quadratic through the first three terms, extended to position n
    const d0 = shown[1].sub(shown[0]), s = shown[2].sub(shown[1]).sub(d0);
    const early = shown[0].add(d0.mul(n)).add(s.mul(Q.of(n * (n - 1), 2)));
    const breaks = shown.findIndex((v, i) => !v.eq(shown[0].add(d0.mul(i)).add(s.mul(Q.of(i * (i - 1), 2)))));
    if (breaks > 0) out.push({ value: early, misconception: `Fitted only the first three terms (gaps ${label(d0, mode)}, ${label(d0.add(s), mode)}, growing by ${label(s, mode)}); that rule already breaks at term ${breaks + 1}.` });
  }
  return out;
}

export function missingRivals(seq, k, mode) {
  const out = [];
  const left = seq[k - 1], right = seq[k + 1];
  if (k >= 2) out.push({ value: left.add(left.sub(seq[k - 2])), misconception: `Continued the gap just before the blank (${label(left.sub(seq[k - 2]), mode)}) without checking the terms after it.` });
  if (k + 2 < seq.length) out.push({ value: right.sub(seq[k + 2].sub(right)), misconception: `Worked back from the right with the gap after the blank (${label(seq[k + 2].sub(right), mode)}), assuming the gaps are equal there.` });
  out.push({ value: left.add(right).div(Q.of(2)), misconception: 'Took the average of the two neighbours; that is only right when the two gaps around the blank are equal.' });
  if (k >= 2 && !seq[k - 2].isZero()) out.push({ value: left.mul(left).div(seq[k - 2]), misconception: `Multiplied by the ratio just before the blank (×${label(left.div(seq[k - 2]), 'frac')}), assuming a constant ratio.` });
  return out;
}

// Family factory. def: { id, title, skill, levels, display, show(d,p), params(rng,d),
//   terms(p, count) -> Q[], rule(p), explain(p, ctx) -> steps, compute(p, all, k) -> string,
//   rivals(p, ctx) -> [{value, misconception}], hints(p, ctx), anchor, srule, lesson,
//   missing?: max difficulty allowing a missing-term item, limit?: max |term| }
export function family(def) {
  return {
    id: def.id,
    section: 'nl',
    title: def.title,
    skill: def.skill,
    levels: def.levels,
    terms: def.terms,
    generate(rng, { difficulty = def.levels[0] } = {}) { return build(def, rng, difficulty); },
    verify: verifyNl,
    lesson: def.lesson,
  };
}

function build(def, rng, difficulty) {
  const mode = def.display || 'int';
  const limit = def.limit ?? 1e8;
  for (let attempt = 0; attempt < 80; attempt++) {
    const p = def.params(rng, difficulty);
    const n = typeof def.show === 'function' ? def.show(difficulty, p) : (def.show ?? 5);
    const missing = def.missing && difficulty <= def.missing && rng.chance(0.25);
    const all = def.terms(p, n + 2);
    if (!all || all.length < n + 1) continue;
    const used = all.slice(0, n + 1);
    if (!used.every((x) => displayable(x, mode) && mag(x) <= limit)) continue;
    if (allEqual(used) || (def.accept && !def.accept(p, used))) continue;
    let seq, target, k, rivals;
    if (missing) {
      // at least three terms before the blank, at least one after it
      k = rng.int(3, n - 1);
      seq = used; target = used[k];
      const prefix = used.slice(0, k);
      rivals = [...(def.missingRivalsFor?.(p, used, k) || []), ...missingRivals(used, k, mode),
        ...def.rivals(p, { shown: prefix, next: target, after: used[k + 1], mode, difficulty }), ...genericRivals(prefix, mode)];
    } else {
      k = n;
      seq = used.slice(0, n); target = used[n];
      const ctx0 = { shown: seq, next: target, after: all[n + 1], mode, difficulty };
      rivals = [...def.rivals(p, ctx0), ...genericRivals(seq, mode)];
      if (all[n + 1] && displayable(all[n + 1], mode) && mag(all[n + 1]) <= limit * 100) {
        rivals.push({ value: all[n + 1], misconception: 'Applied the rule one step too far: this is the term after the next one.' });
      }
    }
    const correctLabel = label(target, mode);
    const seen = new Set([correctLabel]), chosen = [];
    for (const r of rivals) {
      if (!r || !(r.value instanceof Q) || !displayable(r.value, mode) || mag(r.value) > limit * 100) continue;
      if (mode === 'dec' && label(r.value, mode).length > 9) continue;
      const l = label(r.value, mode);
      if (seen.has(l) || (missing && seq.some((x) => label(x, mode) === l))) continue;
      seen.add(l);
      chosen.push({ ...r, label: l });
      if (chosen.length === 4) break;
    }
    if (chosen.length < 4) continue;
    const labels = seq.map((x) => label(x, mode));
    const display = missing ? labels.map((l, i) => (i === k ? '?' : l)) : [...labels, '?'];
    // Reject sequences that admit two different rule-consistent answers.
    if (!missing && distinctNext(labels).length > 1) continue;
    if (missing && [correctLabel, ...chosen.map((c) => c.label)].filter((l) => fillsFit(display, k, l)).length !== 1) continue;
    const byValue = new Map([[target.toNumber(), correctLabel], ...chosen.map((c) => [c.value.toNumber(), c.label])]);
    const mcq = buildMcq(rng, {
      correct: target.toNumber(),
      distractors: chosen.map((c) => ({ value: c.value.toNumber(), misconception: c.misconception })),
      format: (v) => byValue.get(v),
      minGap: () => 0,
      fillers: [],
    });
    const ctx = { shown: missing ? used : seq, next: target, all, k, missing, mode, difficulty, labels: display };
    const steps = [...def.explain(p, ctx), {
      say: def.compute(p, all, k, mode),
      why: missing ? `The blank is term ${k + 1}; check that the term after it follows from ${correctLabel} by the same rule.` : 'Apply the same rule once more to the last shown term.',
    }];
    return {
      id: `nl:${def.id}:${rng.seed}`,
      section: 'nl',
      family: def.id,
      difficulty,
      kind: 'mcq',
      prompt: {
        text: missing ? `Which number replaces the question mark?  ${display.join(', ')}` : `What number comes next?  ${display.join(', ')}`,
        sequence: display,
      },
      ...mcq,
      answer: { value: target.toNumber(), label: correctLabel, rule: def.rule(p), full: used.map((x) => label(x, mode)), position: k },
      params: { rule: def.id, coeffs: p, shown: seq.map((x, i) => (missing && i === k ? null : encodeTerm(x))), next: encodeTerm(target), position: k },
      solution: { steps, rule: def.srule, anchor: def.anchor },
      hints: def.hints(p, ctx),
    };
  }
  throw new Error(`nl/${def.id}: no valid item after 80 attempts at difficulty ${difficulty}`);
}

function fillsFit(display, k, l) {
  return predictAll(display.map((s, i) => (i === k ? l : s))).length > 0;
}

// Independent check: parse the displayed terms and option labels, re-derive by rule search.
export function verifyNl(item) {
  const seq = item.prompt.sequence;
  const k = seq.indexOf('?');
  const opts = item.options.map((o) => parseTerm(o.label).v);
  if (k === seq.length - 1) {
    const preds = distinctNext(seq.slice(0, -1));
    const ok = preds.length === 1 && close(preds[0], opts[item.answerIndex]) &&
      opts.every((v, i) => i === item.answerIndex || !close(v, preds[0]));
    return { ok, detail: `rule search predicts [${preds.join(', ')}], answer ${item.options[item.answerIndex].label}` };
  }
  const fits = item.options.map((o) => fillsFit(seq, k, o.label));
  const ok = fits[item.answerIndex] && fits.filter(Boolean).length === 1;
  return { ok, detail: `options that complete a consistent rule: ${item.options.filter((_, i) => fits[i]).map((o) => o.label).join(', ') || 'none'}` };
}

// Small helpers for family files.
// "40 + 7 = 47" / "40 − 7 = 33" for any two consecutive Q terms.
export function stepText(prev, next, mode = 'int') {
  const g = next.sub(prev);
  return `${label(prev, mode)} ${g.n < 0n ? MINUS : '+'} ${label(g.n < 0n ? g.neg() : g, mode)} = ${label(next, mode)}`;
}
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };
export const sgn = (v) => (v < 0 ? `${MINUS} ${-v}` : `+ ${v}`);
export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `+${v}`);
export const PRIMES = (() => { const p = []; for (let n = 2; p.length < 60; n++) if (p.every((d) => n % d)) p.push(n); return p; })();
export const FIB = (() => { const f = [1, 1]; while (f.length < 45) f.push(f[f.length - 1] + f[f.length - 2]); return f; })();
