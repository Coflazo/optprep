// "At least one" events: one clean product through the complement, never a sum of overlapping chances.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
const fr = (n, d = 1) => Q.of(n, d).toString();
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const qpow = (x, k) => { let r = Q.of(1); for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const none6 = (n) => qpow(Q.of(5, 6), n);
const some6 = (n) => Q.of(1).sub(none6(n));
const d3 = (x) => (Math.round((x instanceof Q ? x.toNumber() : x) * 1000) / 1000).toFixed(3);
const d4 = (x) => (Math.round((x instanceof Q ? x.toNumber() : x) * 10000) / 10000).toFixed(4);
const oneIn = (p, n) => 1 - (1 - p) ** n;
const FR = [[1, 2], [1, 3], [1, 4], [2, 5], [1, 5], [3, 10], [1, 6], [3, 5]];
const fq = ([a, b]) => Q.of(a, b);
const exactly1 = (n) => Q.of(n).mul(Q.of(1, 6)).mul(qpow(Q.of(5, 6), n - 1));
const NS = Array.from({ length: 13 }, (_, n) => n);
const TA = [Q.of(1, 2), Q.of(1, 4), Q.of(1, 5)]; // think-aloud trades
const TA_SUM = TA.reduce((a, p) => a.add(p), Q.of(0));
const TA_NONE = TA.reduce((a, p) => a.mul(Q.of(1).sub(p)), Q.of(1));
const LINE_FAIL = Q.of(1, 10); // far transfer: data lines

export default {
  id: 'bto/at-least-one',
  book: 'bto',
  kind: 'family',
  family: 'at-least-one',
  title: 'At least one: the complement trick',
  summary: '"At least one" = 1 − P(none), and P(none) is a product. Never add overlapping chances.',
  prerequisites: ['prob/complement', 'prob/independence', 'bto/die-repeats'],
  objectives: [
    'Spot "at least one" in any wording ("one or more", "any", "not all fail") in under five seconds',
    'Compute 1 − Π(1 − pᵢ) for equal and unequal chances',
    'Explain why adding the chances overshoots, using the double-counted overlap',
    'Use the benchmarks: four dice just over 1/2, n tries at 1/n about 63%',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw a fair die 4 times. What is the probability of at least one six? Try two approaches and compare them.', answer: `1 − (5/6)⁴ = ${some6(4)} ≈ ${d3(some6(4))}`, explain: `If one approach gave 4 × 1/6 = ${d3(4 / 6)}, it counted every outcome with two sixes twice. With 7 throws that approach would even pass 1. The lesson shows the one product that always works.`, attempts: [
      { id: 'add', label: 'Add 1/6 for each throw', approach: `Added 1/6 four times: 4/6 ≈ ${d3(4 / 6)}.`, breaksAt: 'An outcome with two sixes is counted once per six. With 7 throws the total would pass 1.' },
      { id: 'miss-product', label: 'One minus (1/6)⁴', approach: `Took 1 − (1/6)⁴ = ${Q.of(1).sub(qpow(Q.of(1, 6), 4))}.`, breaksAt: '(1/6)⁴ is "a six every time". The opposite of "at least one six" is "no six", (5/6)⁴.' },
      { id: 'exactly', label: 'One six, three misses', approach: `Put one six among four throws: 4 × 1/6 × (5/6)³ = ${exactly1(4)}.`, breaksAt: 'That is exactly one six. Outcomes with two, three or four sixes are dropped.' },
    ] },
    { type: 'text', text: 'Several independent tries, each with some chance of success, and the question asks whether **at least one** succeeds. The wording varies: "at least one", "one or more", "any of them", "not all of them fail", "the alarm goes off at some point".' },
    { type: 'list', items: ['"You throw a die four times. What is the probability of at least one six?"', '"Three independent trades succeed with probabilities 1/2, 1/3, 1/4. Chance that at least one succeeds?"', '"A pair of dice is thrown 24 times. Probability of at least one double six?"', '"You buy 20 tickets, each winning with probability 1/20. Chance of at least one win?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question is an "at least one" question?', options: ['Five coin flips: probability that not every flip is tails', 'Five coin flips: probability of exactly one head', 'Die thrown until a six: probability the first six is on throw 3', 'Two dice: probability the sum is 7'], answer: 0, traps: { 1: '"exactly one" excludes two or more heads', 2: 'a first-success question: the position is fixed', 3: 'a two-dice sum' }, explain: '"Not every flip is tails" = "at least one head".' },
    ] },
    { type: 'text', text: 'Not this lesson: "exactly one" (a different count), "the first six on throw k" (bto/first-success) and draws without replacement (bto/card-draws), where the product shrinks differently.' },
    { type: 'check', scope: 'what is not at least one', questions: [
      { type: 'choice', q: '"Four throws of a die: probability of exactly one six?" How do you treat it?', options: ['a different count: exactly one', 'at least one: 1 − P(none)', 'first six on a fixed throw', 'draws without replacement'], answer: 0, traps: { 1: '"exactly one" excludes two or more sixes, so 1 − P(none) is too big', 2: 'no throw is fixed for the six', 3: 'dice throws are independent: nothing is used up' }, explain: 'Exactly one six is one count among several. It is not the at-least-one complement.' },
    ] },

    S('why'),
    { type: 'text', text: '"At least one" shows up in a large share of quick probability questions, and it carries the most common wrong answer in the whole section: adding the chances. Adding feels natural ("four chances of 1/6") and is close enough to look plausible, so it will sit among the options. The complement turns the question into one multiplication that is exactly right.' },

    S('anchor'),
    { type: 'text', text: 'You know two facts. The **complement rule**: P(A) = 1 − P(not A). And **independence**: the chance that independent events all happen is the product of their chances. "At least one success" is the complement rule with **one change**: its "not A" is "every try fails", which independence turns into a product.' },
    { type: 'check', scope: 'complement and independence', questions: [
      { make: (rng) => { const n = rng.int(2, 4); return mc(rng, `A die is thrown ${n} times. P(no six at all)?`, none6(n).toString(), [[Q.of(1).sub(Q.of(n, 6)).toString(), 'subtracted 1/6 per throw as if "six on throw i" were disjoint'], [Q.of(5, 6).toString(), 'used one throw only'], [qpow(Q.of(1, 6), n).toString(), 'computed "a six every time"']], `Each throw misses with 5/6, independently: (5/6)^${n} = ${none6(n)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw two throws as a tree. "At least one six" is every path except the bottom one, where both throws miss. So you can add the marked paths, or take one minus the single unmarked path. The second is always shorter.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: [
      { p: '1/6', label: 'throw 1: six', mark: true },
      { p: '5/6', label: 'throw 1: no six', children: [{ p: '1/6', label: 'throw 2: six', mark: true }, { p: '5/6', label: 'throw 2: no six' }] },
    ] }, total: some6(2).toString() }, caption: `Marked paths: 1/6 + 5/6 × 1/6 = ${some6(2)}. The unmarked path is (5/6)² = ${none6(2)}, and 1 − ${none6(2)} gives the same ${some6(2)}.` },
    { type: 'check', scope: 'one minus the all-miss path', questions: [
      { make: (rng) => { const n = rng.int(2, 3); return mc(rng, `A die is thrown ${n} times. P(at least one six)?`, some6(n).toString(), [[Q.of(n, 6).toString(), 'added 1/6 per throw: outcomes with two sixes are counted twice'], [none6(n).toString(), 'answered P(no six), the complement'], [exactly1(n).toString(), 'counted exactly one six']], `1 − (5/6)^${n} = ${some6(n)}.`); } },
    ] },
    { type: 'text', text: 'Why adding fails, in one picture: with two dice, 6 cells have a six on the first die and 6 have a six on the second. Adding gives 12, but the cell (6,6) is in both groups. The true count is 11.' },
    { type: 'diagram', diagram: 'grid', spec: (() => { const hl = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (r === 5 || c === 5) hl.push([r, c]); return { rows: 6, cols: 6, rowTitle: 'throw 1', colTitle: 'throw 2', highlight: hl, count: hl.length }; })(), caption: `At least one six: the last row plus the last column, ${36 - 25} cells. Adding 6 + 6 = 12 counts the corner (6,6) twice.` },
    { type: 'check', scope: 'the overlap adding misses', questions: [
      { type: 'choice', q: 'Why does 1/6 + 1/6 overstate P(at least one six in two throws)?', options: ['The outcome (6,6) is counted in both terms', 'The throws are dependent', '1/6 is the wrong chance for one throw', 'It should be 1/6 × 1/6'], answer: 0, traps: { 1: 'the throws are independent; the overlap is the issue', 2: '1/6 is right for each throw', 3: 'that is "both are sixes", a different event' }, explain: `Adding double counts the overlap: 12/36 against the true ${36 - 25}/36.` },
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 12, label: 'throws n' }, y: { min: 0, max: 1.2, label: 'probability' }, curves: [
      { label: 'true: 1 − (5/6)^n', points: NS.map((n) => [n, oneIn(1 / 6, n)]) },
      { label: 'adding: n/6', points: NS.filter((n) => n <= 7).map((n) => [n, n / 6]) },
    ], hlines: [{ y: 1, label: 'certainty' }], markers: [{ x: 4, y: oneIn(1 / 6, 4), label: `n = 4: ${d3(oneIn(1 / 6, 4))}` }] }, caption: `The true curve bends and never reaches 1. The adding line is a straight overestimate that hits 1 at six throws and passes it at seven, which no probability can do. Four throws is the first n above 1/2.` },
    { type: 'check', scope: 'reading the two curves', questions: [
      { type: 'choice', q: 'Six throws of a die. Adding gives 6 × 1/6 = 1. What is the truth?', options: [`about ${d3(oneIn(1 / 6, 6))}`, '1', 'about 0.5', `about ${d3((5 / 6) ** 6)}`], answer: 0, traps: { 1: 'adding: you can miss all six throws', 2: 'guessed the midpoint', 3: 'that is P(no six)' }, explain: `1 − (5/6)⁶ ≈ ${d3(oneIn(1 / 6, 6))}.` },
    ] },

    { type: 'text', text: (() => { const ps = [[1, 2], [1, 3], [1, 4]].map(fq); const none = ps.reduce((a, p) => a.mul(Q.of(1).sub(p)), Q.of(1)); const sum = ps.reduce((a, p) => a.add(p), Q.of(0)); return `Unequal chances change nothing in the method. Three independent trades succeed with 1/2, 1/3 and 1/4. They all fail with 1/2 × 2/3 × 3/4 = ${none}, so at least one succeeds with 1 − ${none} = ${Q.of(1).sub(none)}. Adding would give ${sum}, more than 1: the overlaps (two or three trades succeeding together) have been counted repeatedly.`; })() },
    { type: 'check', scope: 'unequal chances, same complement', questions: [
      { make: (rng) => { const ps = rng.shuffle(FR).slice(0, 2).map(fq); const none = ps.reduce((a, p) => a.mul(Q.of(1).sub(p)), Q.of(1)); return mc(rng, `Two independent trades succeed with ${ps.join(' and ')}. P(at least one succeeds)?`, Q.of(1).sub(none).toString(), [[ps[0].add(ps[1]).toString(), 'added the chances; both can succeed together'], [ps[0].mul(ps[1]).toString(), 'computed "both succeed"'], [none.toString(), 'answered "both fail"']], `1 − (1 − ${ps[0]})(1 − ${ps[1]}) = ${Q.of(1).sub(none)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'add', say: 'Name the complement of "at least one success": **no success at all**, every try fails.', why: '"At least one" is a union of overlapping cases (one, two, three successes…). Its opposite is a single pattern.',
        checks: [
          { type: 'choice', q: 'Five coin flips. The complement of "at least one head" is:', options: ['all five tails', 'at least one tail', 'exactly one tail', 'all five heads'], answer: 0, traps: { 1: 'HHHHT has a tail and a head: not a complement', 2: 'the complement must include every outcome with no head', 3: 'all heads is a case of "at least one head"' }, explain: 'Every outcome with no head is all tails.' },
        ] },
      { answers: 'miss-product', say: 'P(no success) = (1 − p₁)(1 − p₂)…(1 − pₙ).', why: 'Independent failures happen together with the product of their chances.',
        checks: [
          { make: (rng) => { const ps = rng.shuffle(FR).slice(0, 3); const none = ps.reduce((a, p) => a.mul(Q.of(1).sub(fq(p))), Q.of(1)); return mc(rng, `Three independent trades succeed with ${ps.map(([a, b]) => `${a}/${b}`).join(', ')}. P(all three fail)?`, none.toString(), [[ps.reduce((a, p) => a.mul(fq(p)), Q.of(1)).toString(), 'multiplied the success chances: that is "all succeed"'], ...(() => { const d = Q.of(1).sub(ps.reduce((a, p) => a.add(fq(p)), Q.of(0))); return d.cmp(0) >= 0 ? [[d.toString(), 'subtracted the sum of the successes, as if they were disjoint']] : []; })(), [Q.of(1).sub(none).toString(), 'answered "at least one succeeds", the complement']], `${ps.map(([a, b]) => `(1 − ${a}/${b})`).join(' × ')} = ${none}.`); } },
        ] },
      { answers: 'exactly', say: 'P(at least one) = 1 − (1 − p₁)(1 − p₂)…(1 − pₙ). With equal chances p: 1 − (1 − p)^n.', why: 'The event and its complement cover everything, so their chances add to 1. One minus "all fail" keeps every outcome with one, two or more successes.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 6); return { type: 'number', q: `A die is thrown ${n} times. P(at least one six), to 3 decimals?`, answer: Math.round(oneIn(1 / 6, n) * 1000) / 1000, tolerance: 0.0015, hints: ['Complement first: no six at all.', `(5/6)^${n} ≈ ${d3((5 / 6) ** n)}.`], explain: `1 − (5/6)^${n} ≈ ${d3(oneIn(1 / 6, n))}.` }; } },
        ] },
      { say: 'Rare events per try: find the per-try chance first. A double six on one throw of two dice is 1/36, so n throws give 1 − (35/36)^n.', why: 'The formula needs the chance of success on one try; for a double six that is one cell of 36, not one die\'s 1/6.',
        checks: [
          { make: (rng) => { const n = rng.pick([12, 18, 24, 30]); return mc(rng, `A pair of dice is thrown ${n} times. P(at least one double six)?`, `1 − (35/36)^${n}`, [[`1 − (5/6)^${n}`, 'used 5/6, the chance one die misses a six, as the per-throw miss'], [`${n}/36`, 'added 1/36 per throw'], [`(35/36)^${n}`, 'answered P(no double six)']], `Per throw the miss chance is 35/36: 1 − (35/36)^${n} ≈ ${d3(oneIn(1 / 36, n))}.`); } },
        ] },
      { say: 'n tries at chance 1/n: (1 − 1/n)^n is close to 1/e ≈ 0.368 for large n, so P(at least one) ≈ 0.632.', why: 'This limit is worth memorising: "on average one success" still leaves about a 37% chance of none.',
        checks: [
          { type: 'choice', q: '100 independent tickets, each winning with 1/100. P(at least one win)?', options: [`about ${d3(oneIn(0.01, 100))}`, '1', '0.5', `about ${d3(0.99 ** 100)}`], answer: 0, traps: { 1: 'adding 100 × 1/100', 2: '"on average one win" is not a 50% chance', 3: 'that is P(no win)' }, explain: `1 − 0.99^100 ≈ ${d3(oneIn(0.01, 100))}, close to 1 − 1/e.` },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does adding the per-try chances give too much, and when would adding be correct?', model: 'Adding counts an outcome once for every try that succeeds in it, so outcomes with two or more successes are counted several times. The complement counts each outcome once. Adding is correct only for disjoint events, where at most one can happen.', points: ['adding counts multi-success outcomes more than once', 'the complement "all fail" is a single product', 'adding is right only for events that cannot happen together'] },

    S('worked'),
    { type: 'worked', family: 'at-least-one', section: 'bto', difficulty: 1, seed: 'b', explainAt: [0], intro: 'Sixes in a few throws. Try it before opening the solution.' },
    { type: 'worked', family: 'at-least-one', section: 'bto', difficulty: 2, seed: 'b', fade: 1, intro: 'Unequal chances. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: `Three independent trades succeed with probabilities ${TA.join(', ')}. What is the probability that at least one succeeds?`, lines: [
      { t: 0, say: '"At least one succeeds": complement territory. Unequal chances do not change the method.' },
      { t: 3, say: `Quick version: ${TA.join(' + ')} = ${TA_SUM}.`, slip: true },
      { t: 6, say: 'No: that adds overlapping chances, so it is only an upper bound. Complement: all three fail.' },
      { t: 10, say: `Fail chances ${TA.map((p) => Q.of(1).sub(p)).join(', ')}; their product is ${TA_NONE}.` },
      { t: 14, say: `P = 1 − ${TA_NONE} = ${Q.of(1).sub(TA_NONE)}. Below the adding bound ${TA_SUM}, as it must be. Answer ${Q.of(1).sub(TA_NONE)}.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try gave 19/20. What went wrong?', options: ['added chances that overlap', 'took the complement too early', 'multiplied the success chances', 'used a method for equal chances'], answer: 0, traps: { 1: 'the complement is the fix, not the slip', 2: 'the product came later, with the fail chances', 3: 'unequal chances do not change the method' }, explain: 'Adding counts outcomes with two successes more than once: an upper bound only. 1 − 1/2 × 3/4 × 4/5 = 7/10.' },
    ] },

    S('predict'),
    { type: 'predict', question: 'The classic gamble: bet A pays if at least one six appears in 4 throws of a die; bet B pays if at least one double six appears in 24 throws of two dice. Which is above 1/2?', answer: `Only A: ${d3(oneIn(1 / 6, 4))} against ${d3(oneIn(1 / 36, 24))}.`, explain: 'Adding says both are 4/6 = 24/36, which is exactly the error that made the bets look equal.' },

    S('traps'),
    { type: 'traps', family: 'at-least-one', section: 'bto', extra: [
      { belief: 'P(at least one) = sum of the chances.', fix: 'Outcomes with two successes are counted twice. Use 1 − Π(1 − pᵢ).' },
      { belief: '"At least one" means "exactly one".', fix: 'At least one also counts two, three, … successes.' },
      { belief: 'An average of one success means a 50% chance of at least one.', fix: `n tries at 1/n give about 1 − 1/e ≈ ${d3(1 - Math.exp(-1))}.` },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(at least one six in 3 throws of a die). One step is wrong.', steps: [
      'The six can come on throw 1, 2 or 3.',
      'At least one six means one throw is a six and the other two are not.',
      'That is 3 × 1/6 × (5/6)² = 75/216.',
      'So P = 75/216.',
    ], errorStep: 1, explain: `"One throw is a six and the others are not" is **exactly** one six. It drops outcomes with two or three sixes. Correct: 1 − (5/6)³ = ${some6(3)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `Five throws. A candidate answers ${exactly1(5)}. Which belief produced it?`, options: ['"At least one" read as "exactly one"', 'Adding the five chances of 1/6', 'Taking the complement twice over'], answer: 0, explain: `5 × 1/6 × (5/6)⁴ = ${exactly1(5)} is exactly one six. Correct: ${some6(5)}.` },
      { type: 'choice', q: 'Another answers 5/6 for the same question. Which belief?', options: ['Adding 1/6 five times', '"Exactly one"', 'Using the complement'], answer: 0, explain: `5 × 1/6. Truth: 1 − (5/6)⁵ ≈ ${d3(oneIn(1 / 6, 5))}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Benchmarks: at least one six in 4 throws ≈ ${d3(oneIn(1 / 6, 4))} (just over 1/2); in 6 throws ≈ ${d3(oneIn(1 / 6, 6))}; n tries at 1/n ≈ ${d3(1 - Math.exp(-1))}. Adding is an **upper bound**: the true answer is always a bit below Σpᵢ, and close to it only when every pᵢ is small.` },
    { type: 'check', scope: 'benchmarks and the upper bound', questions: [
      { type: 'choice', q: 'Ten independent tries, each 1/20. Closest value for P(at least one success)?', options: [d3(oneIn(0.05, 10)), '0.500', d3(0.95 ** 10), '0.050'], answer: 0, traps: { 1: 'added 10 × 1/20: an upper bound, not the answer', 2: 'that is P(no success)', 3: 'used one try' }, explain: `1 − 0.95^10 ≈ ${d3(oneIn(0.05, 10))}, a little below the adding bound 0.5.` },
    ] },
    { type: 'callout', tone: 'speed', text: `Powers you should know: (5/6)² ≈ ${d3((5 / 6) ** 2)}, (5/6)³ ≈ ${d3((5 / 6) ** 3)}, (5/6)⁴ ≈ ${d3((5 / 6) ** 4)}, (5/6)⁶ ≈ ${d3((5 / 6) ** 6)}. Beat the Odds gives ${SECTIONS.bto.exam.perItemSeconds} seconds; these save most of them.` },
    { type: 'check', scope: 'powers of 5/6', questions: [
      { type: 'choice', q: '(5/6)⁴ is closest to:', options: ['0.482', '0.518', '0.579', '0.694'], answer: 0, traps: { 1: 'that is 1 − (5/6)⁴, at least one six in 4 throws', 2: 'that is (5/6)³', 3: 'that is (5/6)²' }, explain: '(5/6)⁴ = 625/1296 ≈ 0.482.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'At least one → 1 − Π(1 − pᵢ). Find the per-try chance first. Never add overlapping chances.' },

    S('contrast'),
    { type: 'compare', columns: ['Event', 'Formula', 'Die, 3 throws (six)'], rows: [
      ['at least one', '1 − Π(1 − pᵢ)', some6(3).toString()],
      ['all of them', 'Π pᵢ', qpow(Q.of(1, 6), 3).toString()],
      ['exactly one', 'Σ pᵢ Π_{j≠i}(1 − pⱼ)', exactly1(3).toString()],
      ['none', 'Π(1 − pᵢ)', none6(3).toString()],
      ['A or B, disjoint', 'P(A) + P(B)', 'adding is right only here'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: if any single try is certain (pᵢ = 1), the product has a zero factor and "at least one" is 1. If every pᵢ = 0, it is 0. With zero tries the answer is 0: the empty product is 1.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Three independent alarms each ring with 1/2. P(exactly one rings)?', options: ['3/8', '7/8', '1/8', '3/2'], answer: 0, traps: { 1: 'that is "at least one"', 2: 'that is "all" or "none"', 3: 'added the chances' }, explain: '3 × 1/2 × (1/2)² = 3/8.' },
      { type: 'choice', q: 'Four independent tries with chances 1/3, 1/2, 1, 1/4. P(at least one success)?', options: ['1', `${Q.of(1, 3).add(Q.of(1, 2)).add(Q.of(1, 4)).add(Q.of(1))}`, '1/24'], answer: 0, traps: { 1: 'added the chances', 2: 'multiplied them: that is "all succeed"' }, explain: 'The third try always succeeds, so P(none) has a factor 0.' },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "at least one ace in five cards" uses 1 − P(no ace), with a shrinking product because cards do not go back (bto/card-draws). The birthday problem is 1 − P(all different). Reliability questions ("the system works if any component works") are this lesson with components for tries.' },
    { type: 'variation', base: `A die is thrown 4 times. P(at least one six) = 1 − (5/6)⁴ = ${some6(4)}.`, rows: [
      { change: 'Throw four dice at once instead of one die four times', effect: 'No change. Four dice at once are four independent tries with the same 1/6 each.', same: true },
      { change: 'Ask for at least one 1 instead of at least one six', effect: 'No change. Any single named face has chance 1/6 per throw; only the per-try chance matters.', same: true },
      { change: 'Ask for "exactly one six"', effect: `A different event: 4 × 1/6 × (5/6)³ = ${exactly1(4)}. The complement trick does not apply; outcomes with two or more sixes now fail.` },
      { change: 'Throw six times', effect: `One product with a bigger exponent: 1 − (5/6)⁶ ≈ ${d3(oneIn(1 / 6, 6))}. Still below 1, where adding would claim certainty.` },
      { change: 'Throw a pair of dice 24 times and ask for a double six', effect: `The per-try chance drops to 1/36 and the tries rise to 24: adding says these cancel (24/36 = 4/6), but the product gives ${d3(oneIn(1 / 36, 24))}, just under 1/2, against ${d3(oneIn(1 / 6, 4))}. Rarer per try is not undone by more tries.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const p = rng.pick([Q.of(1, 3), Q.of(1, 4), Q.of(1, 5)]); const n = rng.int(2, 4); const miss = Q.of(1).sub(p); return mc(rng, `A trader sends ${n} independent quotes; each is hit with probability ${p}. P(at least one quote is hit)?`, Q.of(1).sub(qpow(miss, n)).toString(), [[Q.of(n).mul(p).toString(), 'added the chances; two quotes can both be hit'], [qpow(miss, n).toString(), 'answered "none is hit"'], [qpow(p, n).toString(), 'computed "every quote is hit"']], `Complement: 1 − (${miss})^${n} = ${Q.of(1).sub(qpow(miss, n))}.`); } },
      far: { type: 'choice', q: `A trading system has 3 independent data lines and stays connected if any line works. Each line fails on a given day with probability ${LINE_FAIL}. P(the system stays connected)?`, options: [Q.of(1).sub(qpow(LINE_FAIL, 3)).toString(), qpow(Q.of(1).sub(LINE_FAIL), 3).toString(), qpow(LINE_FAIL, 3).toString(), Q.of(3).mul(Q.of(1).sub(LINE_FAIL)).mul(qpow(LINE_FAIL, 2)).toString()], answer: 0, traps: { 1: 'required all three lines to work', 2: 'answered "all three fail"', 3: 'counted exactly one working line' }, explain: `Connected = at least one line works = 1 − P(all fail) = 1 − (${LINE_FAIL})³ = ${Q.of(1).sub(qpow(LINE_FAIL, 3))}.` },
      principle: { type: 'choice', q: 'Which idea carried over from dice to quotes and data lines?', options: ['"At least one" is one minus the product of the failures', 'Add the chances of the separate successes', '"At least one" is the same event as "exactly one"', 'Multiply the chances of the separate successes'], answer: 0, traps: { 1: 'adding counts multi-success outcomes more than once', 2: 'at least one also includes two, three, … successes', 3: 'that is "all succeed"' }, explain: 'The opposite of "at least one works" is "all fail", a single product of the failure chances.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'at-least-one', section: 'bto', count: 3 },
  ],
};
