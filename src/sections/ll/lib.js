// Shared plumbing for Likelihood List families: build a rank item from three statements
// with exact probabilities, or return null when the RANK_MARGIN gaps do not hold (callers retry).
import { RANK_MARGIN } from '../../core/contract.js';
import { fmtAuto, num, plain, exactText } from '../bto/lib.js';

export { fmtAuto, num, plain, exactText };

// The exam-speed habit for each family (bank items share their family's).
const TIPS = {
  'score-table': 'Count qualifying rows over the rows in the group, and place AND and OR statements by containment before counting.',
  football: 'Tally the qualifying results over the matches in scope; a team statement divides by that team\'s matches only.',
  'survey-bar': 'Same count on top, different groups underneath: the smaller the group you pick from, the bigger the fraction.',
  'fund-returns': 'Count qualifying years over the years in scope; a persistence statement counts only the years that follow a positive year.',
  'histogram-bins': 'Add the bars in each range over the total; a conditional divides by the bars in its condition instead.',
  'scatter-regions': 'Count the dots in each region; a region inside another can never hold more, so containment orders those pairs for free.',
  'density-curves': 'Compare areas, not heights: width times typical height, symmetry about the peak, 68% within one sd.',
  'markov-graph': 'Over a few steps, multiply along each path and add the paths that end in the same node; in the long run, follow the probability flowing into each node, not the number of arrows.',
  'dice-events': 'Use the complement for "at least one", 6 − |s − 7| ordered pairs for a two-dice sum, and the anchors 4 throws for a six ≈ 0.52, 24 throws for a double six ≈ 0.49.',
  'card-events': 'Fix the first card and give the second 51 options; take "none" as a product for hands; any one position of a shuffled deck is a uniform card.',
  'coin-patterns': 'At a fixed position, patterns of equal length tie; "somewhere in n flips" favours a pattern that cannot overlap itself, so HT beats HH.',
  collisions: 'Pairs drive shared values: n people make n(n − 1)/2 pairs, so 23 people pass 1/2 for a shared birthday, while matching one fixed day needs about 253.',
  'large-numbers': 'The head proportion has sd 0.5/√n: extreme proportions belong to small samples, and bands around 50% fill up as n grows.',
  'impossible-bounds': 'Find the certain and the impossible statements first (too many successes, more items than boxes, the wrong parity); only the middle one needs arithmetic.',
  'bayes-boxes': 'Weight each box by its prior times the chance of what was seen; the posterior is that box\'s share of the total.',
};

// o: { text, visual?, statements: [{ text, p (Q | number), how }] (display order), intro?: [{say, why}],
//      compare: string, rule, anchor, hints, params }
export function rankItem(family, rng, difficulty, o) {
  const st = o.statements.map((x) => ({ text: x.text, p: num(x.p), exact: exactText(x.p), how: x.how }));
  if (st.some((x) => !(x.p >= 0 && x.p <= 1))) return null;
  const order = [0, 1, 2].sort((a, b) => st[b].p - st[a].p);
  const ps = order.map((i) => st[i].p);
  if (ps[0] - ps[1] < RANK_MARGIN || ps[1] - ps[2] < RANK_MARGIN) return null;
  const short = (t) => (t.length > 70 ? `${t.slice(0, 67)}…` : t);
  const pText = (x) => `P = ${x.exact}${x.exact.startsWith('≈') || x.exact === fmtAuto(x.p) ? '' : ` ≈ ${fmtAuto(x.p)}`}`;
  const steps = [
    ...(o.intro || []),
    ...order.map((i) => ({ say: `"${short(st[i].text)}"`, math: pText(st[i]), why: st[i].how })),
    { say: 'Most to least likely.', math: order.map((i) => fmtAuto(st[i].p)).join(' > '), why: o.compare },
  ];
  // Short names that tell the statements apart: drop the words all three start with, then trim.
  const words = st.map((x) => x.text.replace(/\.$/, '').split(/\s+/));
  let common = 0;
  while (common < Math.min(...words.map((w) => w.length)) - 1 && words.every((w) => w[common] === words[0][common])) common++;
  const brief = (i) => { const t = words[i].slice(common >= 2 ? common : 0).join(' '); return `"${common >= 2 ? '…' : ''}${t.length > 44 ? `${t.slice(0, 41).replace(/\s+\S*$/, '')}…` : t}"`; };
  const gap = (a, b) => fmtAuto(Math.round((st[a].p - st[b].p) * 1e4) / 1e4);
  const [hi, md, lo] = order;
  const extras = {
    ask: 'We want the three statements in order, most likely first; one point needs the whole order right.',
    fast: o.fast || `${TIPS[family] || 'Put a rough number or a bound on each statement before any exact work.'} Here ${fmtAuto(st[hi].p)} > ${fmtAuto(st[md].p)} > ${fmtAuto(st[lo].p)}.`,
    check: o.check || `Check each neighbouring pair on its own. ${brief(hi)} beats ${brief(md)} by ${gap(hi, md)}; ${brief(md)} beats ${brief(lo)} by ${gap(md, lo)}. If an estimate cannot separate a pair, compute that pair exactly.`,
    picture: o.picture || {
      diagram: 'bar',
      spec: { categories: ['Most likely', 'Middle', 'Least likely'], series: [{ name: 'Probability', values: order.map((i) => Math.round(st[i].p * 1000) / 1000) }], yLabel: 'Probability' },
      caption: `Most likely ${brief(hi)}, then ${brief(md)}, then ${brief(lo)}. The bar heights show how far apart the three are.`,
    },
  };
  return {
    id: `ll:${family}:${rng.seed}`,
    section: 'll',
    family,
    difficulty,
    kind: 'rank',
    prompt: o.visual ? { text: o.text, visual: o.visual } : { text: o.text },
    statements: st,
    answerOrder: order,
    solution: { ...extras, steps, rule: o.rule, anchor: o.anchor },
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
