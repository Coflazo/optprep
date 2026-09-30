// Shared plumbing for Likelihood List families: build a rank item from three statements
// with exact probabilities, or return null when the RANK_MARGIN gaps do not hold (callers retry).
import { RANK_MARGIN } from '../../core/contract.js';
import { fmtAuto, num, plain, exactText } from '../bto/lib.js';

export { fmtAuto, num, plain, exactText };

// o: { text, visual?, statements: [{ text, p (Q | number), how }] (display order), intro?: [{say, why}],
//      compare: string, rule, anchor, hints, params }
export function rankItem(family, rng, difficulty, o) {
  const st = o.statements.map((x) => ({ text: x.text, p: num(x.p), exact: exactText(x.p), how: x.how }));
  if (st.some((x) => !(x.p >= 0 && x.p <= 1))) return null;
  const order = [0, 1, 2].sort((a, b) => st[b].p - st[a].p);
  const ps = order.map((i) => st[i].p);
  if (ps[0] - ps[1] < RANK_MARGIN || ps[1] - ps[2] < RANK_MARGIN) return null;
  const short = (t) => (t.length > 70 ? `${t.slice(0, 67)}…` : t);
  const steps = [
    ...(o.intro || []),
    ...order.map((i) => ({ say: `"${short(st[i].text)}": P = ${st[i].exact}${st[i].exact.startsWith('≈') || st[i].exact === fmtAuto(st[i].p) ? '' : ` ≈ ${fmtAuto(st[i].p)}`}.`, why: st[i].how })),
    { say: `Most to least likely: ${order.map((i) => fmtAuto(st[i].p)).join(' > ')}.`, why: o.compare },
  ];
  return {
    id: `ll:${family}:${rng.seed}`,
    section: 'll',
    family,
    difficulty,
    kind: 'rank',
    prompt: o.visual ? { text: o.text, visual: o.visual } : { text: o.text },
    statements: st,
    answerOrder: order,
    solution: { steps, rule: o.rule, anchor: o.anchor },
    hints: o.hints,
    params: plain({ family, ...o.params }),
  };
}

// Call make() until it returns an item (margins hold); deterministic because rng is seeded.
export function retry(make, tries = 400) {
  for (let t = 0; t < tries; t++) { const it = make(); if (it) return it; }
  throw new Error('could not build an item with the required rank margins');
}

// Verifier verdict: independent probabilities match the statements and give the same order.
export function agreeRank(item, ps, tol = 1e-9) {
  const bad = ps.findIndex((p, i) => !(Math.abs(p - item.statements[i].p) <= tol));
  const order = [0, 1, 2].sort((a, b) => ps[b] - ps[a]);
  const ok = bad === -1 && JSON.stringify(order) === JSON.stringify(item.answerOrder);
  return { ok, detail: `independent [${ps.map((p) => p.toFixed(6)).join(', ')}], item [${item.statements.map((x) => x.p.toFixed(6)).join(', ')}]` };
}

export const pct = (x) => `${x}%`;
export const cap = (t) => t[0].toUpperCase() + t.slice(1);

// Pool families: statements drawn from a table of named events. Each event has
//   gen(rng) -> args, setup(args) -> short phrase naming the experiment (used in the prompt),
//   text(args), p(args) -> exact Q or number, how(args), check(args) -> number
// where check is an independent computation (enumeration, recursion or simulation-free formula).
export function poolItem(family, rng, difficulty, pool, o) {
  return retry(() => {
    const keys = rng.shuffle(o.keys).slice(0, 3);
    const evs = keys.map((k) => ({ k, args: pool[k].gen(rng) }));
    if (new Set(evs.map((e) => pool[e.k].text(e.args))).size < 3) return null;
    const setups = [...new Set(evs.map((e) => pool[e.k].setup(e.args)))];
    const list = setups.length === 1 ? setups[0] : `${setups.slice(0, -1).join(', ')} and ${setups[setups.length - 1]}`;
    return rankItem(family, rng, difficulty, {
      ...o,
      text: o.text(list),
      statements: evs.map((e) => ({ text: pool[e.k].text(e.args), p: pool[e.k].p(e.args), how: pool[e.k].how(e.args) })),
      params: { events: evs.map((e) => ({ key: e.k, args: e.args })) },
    });
  });
}
export function verifyPool(item, pool, tol = 1e-9) {
  return agreeRank(item, item.params.events.map((e) => pool[e.key].check(e.args)), tol);
}
