// Balloon: the pump-or-cash decision under this trainer's pop model (the pop point K is uniform
// on 1..N, the K-th pump pops). A balloon planned to t pumps survives with probability (N - t)/N.
// spec, kind 'ev' (one balloon, one plan):
//   { kind: 'ev', N?: 20, centsPerPump: 10, bankCents?: 0, bankPenalty?: 0,
//     rows?: [{ t, safe: 'a/b', ev: cents }], best?: t, curve?: true }
//   ev(t) = c·t·(N - t)/N - (t/N)·floor(bank·penalty): the expected change in the bank from this
//   balloon (win t pumps of money when it survives, lose the penalty on the bank when it pops).
//   curve: draws ev(t) for t = 0..N with the rows and the best plan marked.
// spec, kind 'policy' (the engine's exact backward-induction targets for a whole round):
//   { kind: 'policy', round: { balloons, centsPerPump, bankPenalty }, N?: 20, balloon: i (0-based),
//     rows: [{ bankCents, target }] }
// validate: safe, ev and best follow the formula exactly (best = the smallest t in 0..N-1 with the
// largest ev); policy targets equal the engine's optimalTarget for that balloon and bank.
import { toQ, fmt, near } from './_util.js';
import { render as plot } from './plot.js';
import { h } from '../../ui/dom.js';
import { optimalTarget, MAX_PUMPS } from '../../zapn/balloon/engine.js';

export const balloonEv = (t, { N = MAX_PUMPS, centsPerPump: c, bankCents = 0, bankPenalty = 0 }) => (c * t * (N - t) - t * Math.floor(bankCents * bankPenalty)) / N;
export function bestPlan(o) {
  const N = o.N ?? MAX_PUMPS;
  let best = 0;
  for (let t = 1; t < N; t++) if (balloonEv(t, o) > balloonEv(best, o) + 1e-9) best = t;
  return best;
}

export function validate(spec) {
  const e = [];
  const N = spec?.N ?? MAX_PUMPS;
  if (spec?.kind === 'policy') {
    const r = spec.round;
    if (!(r && Number.isInteger(r.balloons) && r.balloons > 0 && r.centsPerPump > 0 && r.bankPenalty >= 0 && r.bankPenalty < 1)) return ['zapn-balloon: policy needs a round { balloons, centsPerPump, bankPenalty }'];
    if (!(Number.isInteger(spec.balloon) && spec.balloon >= 0 && spec.balloon < r.balloons)) return ['zapn-balloon: balloon index out of range'];
    if (!Array.isArray(spec.rows) || !spec.rows.length) return ['zapn-balloon: policy rows required'];
    const reach = spec.balloon * (N - 1) * r.centsPerPump;
    for (const row of spec.rows) {
      if (!(Number.isInteger(row.bankCents) && row.bankCents >= 0 && row.bankCents <= reach)) { e.push(`zapn-balloon: bank ${row.bankCents} cannot occur before balloon ${spec.balloon + 1}`); continue; }
      const t = optimalTarget(r, spec.balloon, row.bankCents, N);
      if (t !== row.target) e.push(`zapn-balloon: at bank ${row.bankCents}c the optimal target is ${t}, stated ${row.target}`);
    }
    return e;
  }
  if (spec?.kind !== 'ev') return ['zapn-balloon: kind must be ev or policy'];
  if (!(Number.isInteger(N) && N >= 2 && spec.centsPerPump > 0)) return ['zapn-balloon: N >= 2 and centsPerPump > 0 required'];
  for (const row of spec.rows || []) {
    if (!(Number.isInteger(row.t) && row.t >= 0 && row.t < N)) { e.push(`zapn-balloon: pumps ${row.t} out of range`); continue; }
    if (row.safe != null) { const q = toQ(row.safe); if (!q || !q.eq(toQ(`${N - row.t}/${N}`))) e.push(`zapn-balloon: P(safe) at ${row.t} pumps is ${N - row.t}/${N}, stated ${row.safe}`); }
    if (row.ev != null && !near(row.ev, balloonEv(row.t, { ...spec, N }))) e.push(`zapn-balloon: ev at ${row.t} pumps is ${balloonEv(row.t, { ...spec, N })}, stated ${row.ev}`);
  }
  if (spec.best != null && spec.best !== bestPlan({ ...spec, N })) e.push(`zapn-balloon: best plan is ${bestPlan({ ...spec, N })} pumps, stated ${spec.best}`);
  return e;
}

const money = (c) => (Math.abs(c) >= 100 ? `$${fmt(Math.round(c) / 100)}` : `${fmt(c)}c`);

export function render(spec) {
  const N = spec.N ?? MAX_PUMPS;
  if (spec.kind === 'policy') {
    return h('figure', { class: 'dg-ledger', role: 'img', 'aria-label': spec.label || 'Optimal pump targets by bank' },
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Bank before the balloon'), h('th', { style: { textAlign: 'right' } }, 'Pump to'))),
        h('tbody', {}, spec.rows.map((r) => h('tr', {}, h('td', { class: 'num' }, `$${(r.bankCents / 100).toFixed(2)}`), h('td', { class: 'num', style: { textAlign: 'right' } }, String(r.target)))))),
      h('div', { class: 'dg-caption-note' }, `Balloon ${spec.balloon + 1} of ${spec.round.balloons}: exact targets from backward induction over every later balloon.`));
  }
  const o = { ...spec, N };
  const best = bestPlan(o);
  if (spec.curve) {
    const pts = Array.from({ length: N + 1 }, (_, t) => [t, balloonEv(t, o)]);
    const lo = Math.min(0, ...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1]));
    const pad = (hi - lo) * 0.1 || 1;
    return plot({
      x: { min: 0, max: N, label: 'pumps planned before cashing (t)' },
      y: { min: lo < 0 ? -20 * Math.ceil((pad - lo) / 20) : 0, max: 20 * Math.ceil((hi + pad) / 20), label: 'expected gain (cents)' },
      curves: [{ label: '', points: pts }],
      markers: [{ x: best, y: balloonEv(best, o), label: `best: ${best} pumps, ${money(balloonEv(best, o))}` }, ...(spec.rows || []).filter((r) => r.t !== best).map((r) => ({ x: r.t, y: balloonEv(r.t, o), label: `${r.t}` }))],
      vlines: [{ x: best, label: '' }],
      label: spec.label || 'Expected gain of one balloon by planned pumps',
    });
  }
  const rows = spec.rows?.length ? spec.rows : Array.from({ length: N }, (_, t) => ({ t }));
  return h('figure', { class: 'dg-ledger', role: 'img', 'aria-label': spec.label || 'Expected gain per planned pump count' },
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Pump to t'), h('th', { style: { textAlign: 'right' } }, 'P(survives)'), h('th', { style: { textAlign: 'right' } }, 'Expected gain'))),
      h('tbody', {}, rows.map((r) => h('tr', { class: r.t === best ? 'dg-top' : '' }, h('td', { class: 'num' }, String(r.t)), h('td', { class: 'num', style: { textAlign: 'right' } }, `${N - r.t}/${N}`), h('td', { class: 'num', style: { textAlign: 'right' } }, `${fmt(balloonEv(r.t, o))}c`))))),
    h('div', { class: 'dg-caption-note' }, `${spec.centsPerPump}c per pump${spec.bankCents ? `, bank ${money(spec.bankCents)}, a pop costs ${money(Math.floor(spec.bankCents * (spec.bankPenalty || 0)))} of it` : ''}. Bold row: the best plan, ${best} pumps.`));
}
