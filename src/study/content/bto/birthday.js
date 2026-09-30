// Birthday collisions: "some pair shares a value" is the complement of an all-different
// product and grows with the number of pairs; "someone shares mine" grows only with n.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const one = Q.of(1);
const allDiff = (d, n) => { let p = one; for (let i = 0; i < n; i++) p = p.mul(Q.of(d - i, d)); return p; };
const coll = (d, n) => one.sub(allDiff(d, n));
const mineN = (d, n) => 1 - ((d - 1) / d) ** n; // someone of n others shares my value
const pairs = (n) => (n * (n - 1)) / 2;
const est = (d, n) => 1 - Math.exp(-pairs(n) / d);
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const f4 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(4);
const chain = (d, n) => Array.from({ length: n }, (_, i) => `${d - i}/${d}`).join(' × ');
const firstAbove = (f) => { let n = 1; while (f(n) <= 0.5) n += 1; return n; };
const N_ANY = firstAbove((n) => coll(365, n).toNumber());
const N_MINE = firstAbove((n) => mineN(365, n));
const LAND = [10, 20, 23, 30, 40, 50, 57, 70];
const NS = Array.from({ length: 61 }, (_, i) => i);
const CH = { d: 12, n: 4 };
const TR = { d: 12, n: 3 };

export default {
  id: 'bto/birthday',
  book: 'bto',
  kind: 'family',
  family: 'birthday',
  title: 'Birthday collisions',
  summary: 'Some pair shares: 1 − d(d−1)…(d−n+1)/d^n, driven by n(n−1)/2 pairs. Someone shares yours: 1 − ((d−1)/d)^n.',
  prerequisites: ['bto/pigeonhole', 'bto/die-repeats', 'prob/complement'],
  objectives: [
    'Compute P(some two share a value) as 1 − the all-different product, for any number of values d',
    'Estimate it in seconds from the number of pairs: 1 − e^(−n(n−1)/2d)',
    'Tell "some pair matches" from "someone matches me" and compute both',
    'Name the trap answers n/d, pairs/d and the complement, and say which belief produces each',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${CH.n} people each have a birth month, all ${CH.d} months equally likely. What is the probability that at least two share a birth month? Try two approaches.`, answer: `1 − ${chain(CH.d, CH.n)} = ${coll(CH.d, CH.n)} ≈ ${f3(coll(CH.d, CH.n))}`, explain: `If you got ${CH.n}/${CH.d} you added a chance per person; if you got ${pairs(CH.n)}/${CH.d} you added a chance per pair and double counted. The lesson shows the one product that gets it exact.` },
    { type: 'text', text: 'n people (or dice, or random picks) each get one of d equally likely values, independently. The question asks whether **some two** of them share a value, or whether **someone shares yours**. The values can be birthdays, months, die faces, numbers from 1 to 100; only n and d matter.' },
    { type: 'list', items: ['"23 people in a room: probability that two share a birthday?"', '"You throw 4 dice: probability that at least two show the same face?"', '"You and 30 others: probability that someone shares your birthday?"'] },
    { type: 'text', text: 'Not this lesson: more people than values, where a repeat is certain (bto/pigeonhole), and items matched back to their owners, such as letters and envelopes (bto/derangements).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['8 traders pick numbers from 1 to 50: two pick the same', '60 traders pick numbers from 1 to 50: two pick the same', '8 traders hand back 8 name cards at random: nobody gets their own', '8 traders pick numbers from 1 to 50: trader 1 picks 7'], answer: 0, traps: { 1: '60 > 50: a repeat is certain (pigeonhole)', 2: 'a matching to owners: derangements', 3: 'one fixed value for one person: 1/50' }, explain: 'Independent uniform values, few people, many values: a collision question.' },
    ] },

    S('why'),
    { type: 'text', text: 'Collisions are everywhere: two orders at the same price, two keys with the same hash, two people with the same birthday. Intuition underestimates them badly, because it counts people while collisions come from **pairs** of people. Assessment options are built from exactly those intuitive mistakes (people instead of pairs, pairs added up, the complement), so knowing the pair count turns a trap-filled item into a sure point. The same product also answers every "all different" question with dice, cards or random picks.' },

    S('anchor'),
    { type: 'text', text: 'From bto/die-repeats: four dice all different is 6/6 × 5/6 × 4/6 × 3/6, one fraction per throw, each throw avoiding the faces already used. The birthday problem is that product with **one change**: d values instead of 6. "Some two share" is then its complement.' },
    { type: 'check', scope: 'all different as a product', questions: [
      { make: (rng) => { const n = rng.int(3, 4); const v = allDiff(6, n); return mc(rng, `You throw ${n} fair dice. P(all faces different)?`, v.toString(), [[Q.of(5, 6).toString(), 'only checked that the second die differs from the first'], [one.sub(v).toString(), 'answered "some two match"'], [Q.of(6 - n + 1, 6).toString(), 'kept only the last factor']], `${chain(6, n)} = ${v}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: `Build the people one at a time. Each new person either lands on a new value or repeats one already taken. For ${TR.n} people and ${TR.d} months, the only all-different path is "new, new".` },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'person 1', children: [
      { p: `${TR.d - 1}/${TR.d}`, label: 'person 2 new month', children: [{ p: `${TR.d - 2}/${TR.d}`, label: 'person 3 new: all different', mark: true }, { p: `2/${TR.d}`, label: 'person 3 repeats' }] },
      { p: `1/${TR.d}`, label: 'person 2 repeats' },
    ] }, total: allDiff(TR.d, TR.n).toString() }, caption: `Person 1 can have any month. The marked path multiplies ${TR.d - 1}/${TR.d} × ${TR.d - 2}/${TR.d} = ${allDiff(TR.d, TR.n)}. Every other leaf contains a shared month, so P(share) = 1 − ${allDiff(TR.d, TR.n)} = ${coll(TR.d, TR.n)}.` },
    { type: 'check', scope: 'the all-different path', questions: [
      { make: (rng) => { const d = rng.pick([10, 12, 20]), n = rng.int(3, 4); const v = coll(d, n); return mc(rng, `${n} people each pick a value from ${d}, all equally likely. P(at least two pick the same)?`, v.toString(), [[Q.of(n, d).toString(), 'added a chance per person'], [Q.of(pairs(n), d).toString(), 'added a chance per pair: the pair events overlap'], [allDiff(d, n).toString(), 'answered the complement: all different'], [Q.of(1, d).toString(), 'only looked at one pair']], `1 − ${chain(d, n)} = ${v} ≈ ${f3(v)}.`, { hinge: true }); } },
    ] },
    { type: 'text', text: 'Now let the group grow, with 365 birthdays. Two curves: some pair shares a birthday, and someone shares **yours**. They separate fast.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 60, label: 'people' }, y: { min: 0, max: 1, label: 'probability' }, curves: [
      { label: 'some two share', points: NS.map((n) => [n, n < 2 ? 0 : coll(365, n).toNumber()]) },
      { label: 'someone shares yours', points: NS.map((n) => [n, mineN(365, n)]) },
    ], markers: [{ x: N_ANY, y: coll(365, N_ANY).toNumber(), label: `${N_ANY} people: ${f3(coll(365, N_ANY))}` }], hlines: [{ y: 0.5, label: '1/2' }] }, caption: `"Some two share" passes 1/2 at ${N_ANY} people and is near certain by 60. "Someone shares yours" (n others) is still below ${f3(mineN(365, 60))} at 60 and needs ${N_MINE} others to pass 1/2.` },
    { type: 'check', scope: 'pairs against people', questions: [
      { type: 'choice', q: 'Why does "some two share" rise so much faster than "someone shares yours"?', options: ['It counts every pair, and pairs grow like n²', 'Birthdays cluster in some months', 'It counts you twice', 'It uses a smaller number of days'], answer: 0, traps: { 1: 'the model has all days equally likely', 2: 'nobody is counted twice: each pair is one chance', 3: 'both curves use 365 days' }, explain: `${N_ANY} people form ${pairs(N_ANY)} pairs; a match with you only has ${N_ANY - 1} chances.` },
    ] },
    { type: 'text', text: 'On a closest-value item you rarely need the whole product. Treat each of the n(n − 1)/2 pairs as its own small chance 1/d of matching. The chance that no pair matches is then about e^(−pairs/d), because 1 − 1/d ≈ e^(−1/d) and the pairs multiply. The table checks that estimate against the exact product for 365 days.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Landmarks for 365 days', columns: ['people', 'pairs', 'exact P(some two share)', 'estimate 1 − e^(−pairs/365)'], rows: LAND.map((n) => [String(n), String(pairs(n)), f3(coll(365, n)), f3(est(365, n))]) }, caption: 'The pairs estimate is within about 0.01 of the exact value everywhere in the table. That is closer than the spacing of the options on a closest-value question.' },
    { type: 'check', scope: 'the pairs estimate', questions: [
      { make: (rng) => { const [d, n] = rng.pick([[100, 10], [100, 15], [365, 30], [365, 40], [52, 8], [1000, 40]]); return { type: 'number', q: `${n} people, ${d} equally likely values. Estimate P(some two share) with 1 − e^(−pairs/d), to 2 decimals.`, answer: Math.round(est(d, n) * 100) / 100, tolerance: 0.015, hints: [`Pairs: ${n} × ${n - 1}/2.`, `pairs/d = ${pairs(n)}/${d} ≈ ${(pairs(n) / d).toFixed(3)}.`], explain: `${pairs(n)} pairs, ${pairs(n)}/${d} ≈ ${(pairs(n) / d).toFixed(3)}, so 1 − e^(−${(pairs(n) / d).toFixed(3)}) ≈ ${est(d, n).toFixed(3)} (exact ${f3(coll(d, n))}).` }; } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: '"Some two share a value" is the complement of "all n values are different".', why: 'The pair events overlap heavily, so adding them fails. "All different" is one clean chain.',
        checks: [
          { type: 'choice', q: 'For 5 people and months, which event is the complement of "at least two share a month"?', options: ['all 5 months different', 'no one shares my month', 'all 5 share one month', 'exactly two share a month'], answer: 0, traps: { 1: 'that is the complement of a different event: a match with me', 2: 'that is one extreme, not the complement', 3: 'three sharing, or two pairs, also count as sharing' }, explain: 'Not "some two equal" means every pair differs: all different.' },
        ] },
      { say: 'Multiply one factor per person: P(all different) = d/d × (d − 1)/d × … × (d − n + 1)/d.', why: 'Person i + 1 must avoid the i values already taken; the choices are independent.',
        checks: [
          { make: (rng) => { const d = rng.pick([10, 20, 52]), n = rng.int(3, 5); const v = allDiff(d, n); return { type: 'number', q: `${n} people, ${d} equally likely values. P(all different), to 3 decimals?`, answer: Math.round(v.toNumber() * 1000) / 1000, tolerance: 0.0015, hints: ['One factor per person.', chain(d, n)], explain: `${chain(d, n)} ≈ ${f3(v)}.` }; } },
        ] },
      { say: 'Count the pairs: n people make n(n − 1)/2 pairs, and each pair matches with probability 1/d.', why: 'Every collision needs a pair. This is where the n² comes from.',
        checks: [
          { make: (rng) => { const n = rng.int(8, 40); return { type: 'number', q: `How many pairs of people are there among ${n}?`, answer: pairs(n), explain: `${n} × ${n - 1}/2 = ${pairs(n)}.` }; } },
        ] },
      { say: 'Estimate: P(no pair matches) ≈ e^(−pairs/d), so P(some two share) ≈ 1 − e^(−n(n − 1)/2d). When pairs/d is small, that is about pairs/d.', why: 'Each pair misses with 1 − 1/d ≈ e^(−1/d). Treating the pairs as independent is slightly off, but close.',
        checks: [
          { make: (rng) => { const [d, n] = rng.pick([[365, 10], [1000, 20], [500, 10], [10000, 50]]); return mc(rng, `${n} values drawn from ${d}. Roughly P(some two equal)?`, (pairs(n) / d).toFixed(3), [[(n / d).toFixed(3), 'counted people instead of pairs'], [(1 / d).toFixed(3), 'only looked at one pair'], [(1 - pairs(n) / d).toFixed(3), 'answered the complement']], `${pairs(n)} pairs × 1/${d} ≈ ${(pairs(n) / d).toFixed(3)} (exact ${f3(coll(d, n))}).`); } },
        ] },
      { say: 'A match with **your** value is different: each of the n others misses you with (d − 1)/d independently, so P = 1 − ((d − 1)/d)^n ≈ n/d.', why: 'Your value is fixed before anyone else is drawn, so only the n pairs that include you can produce a match, not all n(n − 1)/2 pairs. Each of those n chances is independent of the others.',
        checks: [
          { make: (rng) => { const n = rng.pick([10, 20, 30, 40]); return mc(rng, `You and ${n} others, 365 equally likely birthdays. P(someone shares yours), 3 decimals?`, f3(mineN(365, n)), [[f3(coll(365, n + 1)), 'answered "some pair in the room shares"'], [f3(1 / 365), 'only looked at one other person'], [f3(1 - mineN(365, n)), 'answered the complement']], `1 − (364/365)^${n} ≈ ${f3(mineN(365, n))}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does it take only 23 people for a shared birthday to be more likely than not, but about 250 others to share yours?', model: 'A shared birthday can come from any pair, and 23 people already form 253 pairs, each with a 1/365 chance. A match with me can only come from the pairs that include me, one per other person, so I need about as many people as there were pairs before.', points: ['collisions come from pairs, n(n − 1)/2 of them', 'a match with a fixed value has only n chances', 'the estimate 1 − e^(−pairs/d) makes both precise'] },

    S('worked'),
    { type: 'worked', family: 'birthday', section: 'bto', difficulty: 2, seed: 'c', intro: 'A small number of values. Try it before opening the solution.' },
    { type: 'worked', family: 'birthday', section: 'bto', difficulty: 3, seed: 'd', fade: 1, intro: 'The classic 365 days. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: '30 people: is P(some two share a birthday) above or below 1/2? And is P(someone shares the birthday of person 1) above or below 1/10?', answer: `Above 1/2: ${f3(coll(365, 30))}. Below 1/10: ${f3(mineN(365, 29))}.`, explain: `${pairs(30)} pairs against 29 chances for person 1.` },

    S('traps'),
    { type: 'traps', family: 'birthday', section: 'bto', extra: [
      { belief: 'P(some two share) = n/d.', fix: 'That counts people. Collisions come from pairs, n(n − 1)/2 of them.' },
      { belief: 'P(some two share) = pairs/d.', fix: 'Pair events overlap; adding them overcounts. Use 1 − all different, or 1 − e^(−pairs/d).' },
      { belief: '"Someone shares mine" and "some two share" are the same question.', fix: 'Yours is fixed: n chances, 1 − ((d − 1)/d)^n.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(at least two of 5 people share a birth month), months equally likely. One step is wrong.', steps: [
      'Use the complement: all five months different.',
      'Each person must have a different month from the first person: 11/12 each.',
      `P(all different) = (11/12)⁴ ≈ ${f3(Q.of(11, 12).mul(Q.of(11, 12)).mul(Q.of(11, 12)).mul(Q.of(11, 12)))}.`,
      `P(share) ≈ ${f3(one.sub(Q.of(11 ** 4, 12 ** 4)))}.`,
    ], errorStep: 1, explain: `Each new person must avoid **every** month already taken, not just the first person's: 11/12, then 10/12, 9/12, 8/12. P(all different) = ${chain(12, 5)} = ${allDiff(12, 5)}, so P(share) = ${coll(12, 5)} ≈ ${f3(coll(12, 5))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: '23 people, 365 days. A candidate answers 23/365. Which belief?', options: ['Counted people, not pairs', 'Counted pairs and added', 'Answered the complement'], answer: 0, explain: `23/365 ≈ ${f3(23 / 365)} adds a chance per person. The answer is ${f3(coll(365, 23))}.` },
      { type: 'choice', q: 'Another answers 253/365 ≈ 0.69. Which belief?', options: ['Added a chance per pair, ignoring overlaps', 'Counted people', 'Used a match with one fixed person'], answer: 0, explain: `253 pairs × 1/365 overcounts; 1 − e^(−253/365) ≈ ${f3(est(365, 23))} corrects it.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Pairs first: n(n − 1)/2, divide by d. Small ratio → that is the answer. Ratio near 1 → 1 − e^(−ratio). Landmarks for 365: 23 → ${f3(coll(365, 23))}, 30 → ${f3(coll(365, 30))}, 40 → ${f3(coll(365, 40))}, 57 → ${f3(coll(365, 57))}.` },
    { type: 'callout', tone: 'speed', text: `Values of e^(−x) to keep: e^(−0.5) ≈ ${Math.exp(-0.5).toFixed(2)}, e^(−0.7) ≈ ${Math.exp(-0.7).toFixed(2)}, e^(−1) ≈ ${Math.exp(-1).toFixed(2)}, e^(−2) ≈ ${Math.exp(-2).toFixed(2)}. With ${SECTIONS.bto.exam.perItemSeconds} seconds per item, the estimate takes 20 and lands within the option spacing.` },
    { type: 'check', scope: 'pairs over d and the e^(−x) values', questions: [
      { make: (rng) => { const [d, n] = rng.pick([[365, 30], [365, 40], [100, 15], [200, 20]]); const r = pairs(n) / d; return mc(rng, `${n} people, ${d} values: pairs/d ≈ ${r.toFixed(2)}. Closest estimate of P(some two share)?`, (1 - Math.exp(-r)).toFixed(2), [[Math.min(r, 0.99).toFixed(2), 'used pairs/d without the exponential, too big when the ratio is near 1'], [Math.exp(-r).toFixed(2), 'answered the complement'], [(n / d).toFixed(2), 'counted people']], `1 − e^(−${r.toFixed(2)}) ≈ ${(1 - Math.exp(-r)).toFixed(2)}; exact ${f3(coll(d, n))}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Some two share: 1 − Π(d − i)/d ≈ 1 − e^(−n(n − 1)/2d). Someone shares yours: 1 − ((d − 1)/d)^n ≈ n/d. More people than values: 1.' },

    S('contrast'),
    { type: 'compare', columns: ['Question (d = 365)', 'Chances', 'Formula', 'n = 23'], rows: [
      ['some two share', 'n(n − 1)/2 pairs', '1 − Π(365 − i)/365', f3(coll(365, 23))],
      ['someone shares yours (n others)', 'n', '1 − (364/365)^n', f3(mineN(365, 23))],
      ['two named people share', '1', '1/365', f3(1 / 365)],
      ['more people than days', 'forced', 'pigeonhole', '1 (from 366 people)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: one person cannot collide (P = 0). Two people: exactly 1/d. From d + 1 people the collision is certain. With d = 2 (a coin), 3 flips already force a repeat.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: hash collisions, two traders quoting the same price, repeated faces in dice questions (bto/die-repeats). The "pairs" count also drives expected numbers: the expected number of shared pairs is exactly n(n − 1)/2d, by linearity (bto/linearity).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Two named people, Ann and Bob. P(they share a birthday)?', options: ['1/365', '2/365', `1/${365 * 365}`, '1/2'], answer: 0, traps: { 1: 'counted the one pair twice, once per direction', 2: 'required both to be born on one fixed day (1/365²)', 3: 'treated it as a coin flip' }, explain: 'One pair, one chance: 1/365.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'birthday', section: 'bto', count: 3 },
  ],
};
