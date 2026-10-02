// Urns, drawing without replacement: count subsets, C(r,j)C(b,k−j)/C(r+b,k); a sequential product
// needs the C(k,j) orders. Every number shown is computed here, never typed by hand.
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

const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const qpow = (x, k) => { let r = Q.of(1); for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const hyper = (r, b, k, j) => Q.of(C(r, j) * C(b, k - j), C(r + b, k));
const atLeast = (r, b, k, j) => { let s = Q.of(0); for (let t = j; t <= k; t++) s = s.add(hyper(r, b, k, t)); return s; };
const binom = (p, k, j) => Q.of(C(k, j)).mul(qpow(p, j)).mul(qpow(Q.of(1).sub(p), k - j));
// One fixed order: j reds first, then k − j blues.
const oneOrder = (r, b, k, j) => { let p = Q.of(1); for (let i = 0; i < j; i++) p = p.mul(Q.of(r - i, r + b - i)); for (let i = 0; i < k - j; i++) p = p.mul(Q.of(b - i, r + b - j - i)); return p; };
const words = ['no', 'one', 'two', 'three', 'four', 'five'];
const d3 = (x) => (Math.round(x.toNumber() * 1000) / 1000).toFixed(3);
const BALLS = ['R1', 'R2', 'R3', 'B1', 'B2'];
const J4 = [0, 1, 2, 3, 4];
const urn = (rng) => { const r = rng.int(3, 7), b = rng.int(3, 7); return { r, b, n: r + b }; };
const CH_BIN = Q.of(C(3, 2)).mul(qpow(Q.of(5, 8), 2)).mul(Q.of(3, 8)).add(qpow(Q.of(5, 8), 3)); // challenge, binomial attempt
const TA_BIN = binom(Q.of(3, 10), 4, 1); // think-aloud: binomial slip

export default {
  id: 'bto/urn-draws',
  book: 'bto',
  kind: 'family',
  family: 'urn-draws',
  title: 'Urns: drawing without replacement',
  summary: 'Count subsets: C(r, j) C(b, k − j) / C(r + b, k). A sequential product needs its C(k, j) orders.',
  prerequisites: ['bto/card-draws', 'bto/coin-sequences'],
  objectives: [
    'Compute P(exactly j red in k draws) as C(r, j) C(b, k − j) / C(r + b, k)',
    'Handle "at least j" by adding terms or taking the complement, whichever is shorter',
    'Rebuild the same answer from a sequential product times C(k, j), and say why the orders are equally likely',
    'Explain why the binomial is the wrong tool without replacement, and which way it errs',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: a bag holds 5 red and 3 green counters. You draw 3 without replacement. What is the probability that at least two are red? Try two different approaches.', answer: `(C(5,2)C(3,1) + C(5,3)) / C(8,3) = ${atLeast(5, 3, 3, 2)}`, explain: `Hands: ${C(5, 2) * C(3, 1)} with exactly two red plus ${C(5, 3)} with three red, out of ${C(8, 3)}. If you used the binomial with p = 5/8 you got ${d3(Q.of(C(3, 2)).mul(qpow(Q.of(5, 8), 2)).mul(Q.of(3, 8)).add(qpow(Q.of(5, 8), 3)))}: that assumes each counter goes back.`, attempts: [
      { id: 'binomial', label: 'Binomial with p = 5/8', approach: `Used C(3,2)(5/8)²(3/8) + (5/8)³ ≈ ${d3(CH_BIN)}.`, breaksAt: 'That puts each counter back. Without replacement the chance of red changes after every draw.' },
      { id: 'exactly', label: 'Exactly two red only', approach: `Counted hands with two red: C(5,2)C(3,1)/C(8,3) = ${hyper(5, 3, 3, 2)}.`, breaksAt: `"At least two" also includes the ${C(5, 3)} all-red hands.` },
      { id: 'one-order', label: 'Red, red, then green', approach: 'Multiplied 5/8 × 4/7 × 3/6 for red, red, green, then added the all-red chain.', breaksAt: 'The green can come 1st, 2nd or 3rd: three orders, each with the same product.' },
    ] },
    { type: 'text', text: 'An urn (bag, box, batch) holds balls of two kinds, r red and b blue. You draw k of them **without replacement** and the question asks how many of one kind you got: exactly j, at least j, none.' },
    { type: 'list', items: ['"An urn has 5 red and 5 blue balls. Draw 2. Probability of one of each?"', '"A batch of 10 items has 3 defective. You test 4. Probability exactly one is defective?"', '"A committee of 3 is picked from 4 women and 6 men. Probability of at least 2 women?"'] },
    { type: 'check', scope: 'how many of one kind', questions: [
      { type: 'choice', q: '"A batch of 12 has 3 defective items. You test 4. Probability that every tested item works?" Which count is asked?', options: ['none defective', 'at least one defective', 'exactly one defective', 'all four defective'], answer: 0, traps: { 1: 'that is the complement of the question', 2: 'one defective item means one tested item fails', 3: 'reversed the kinds: every item works' }, explain: 'Every tested item works means 0 of the 4 are defective.' },
    ] },
    { type: 'text', text: 'Not this lesson: draws **with** replacement or independent trials (the binomial: bto/coin-sequences, bto/race-to-k), and card hands with many groups (bto/card-draws). Two kinds of ball, taken out and kept out, is this lesson.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['12 bulbs, 4 faulty; pick 3 without looking: probability exactly 1 is faulty', 'Each bulb is faulty with 1/3 independently; 3 bulbs: probability exactly 1 faulty', 'Draw a ball, note its colour, put it back, three times', 'The 7th ball drawn from an urn: probability it is red'], answer: 0, traps: { 1: 'independent trials: binomial', 2: 'with replacement: binomial', 3: 'one position: symmetry gives r/(r + b)' }, explain: 'A fixed batch, sampled without replacement, counting one kind.' },
    ] },

    S('why'),
    { type: 'text', text: 'The urn is the standard model for sampling without replacement: defective items in a batch, committees, cards of one colour. The binomial is the tempting wrong tool because it is the formula you know for "j of k". The difference is small for big urns and large for small ones, and the question writers always include the binomial answer among the options.' },

    S('anchor'),
    { type: 'text', text: 'You know the binomial: k independent draws, each red with the same p, give C(k, j) p^j (1 − p)^(k−j). You also know from bto/card-draws that a hand can be counted as a subset. The urn is the binomial with **one change**: the balls do not go back, so p changes after every draw. Counting subsets handles that change for free.' },
    { type: 'check', scope: 'the binomial you already know', questions: [
      { type: 'choice', q: 'Draw 2 balls from an urn of 5 red and 5 blue, putting each back. P(one of each)?', options: ['1/2', '1/4', '5/9', '1/3'], answer: 0, traps: { 1: 'counted one order only', 2: 'that is the answer without replacement', 3: 'treated 0, 1, 2 reds as equally likely' }, explain: 'With replacement: C(2,1) × 1/2 × 1/2 = 1/2.' },
    ] },

    S('picture'),
    { type: 'text', text: 'A small urn: 3 red and 2 blue, draw 2. As a tree, every branch carries (balls of that colour left)/(balls left). One red and one blue can happen in two orders.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'draw', children: [
      { p: '3/5', label: 'red first', children: [{ p: '2/4', label: 'red: RR' }, { p: '2/4', label: 'blue: RB', mark: true }] },
      { p: '2/5', label: 'blue first', children: [{ p: '3/4', label: 'red: BR', mark: true }, { p: '1/4', label: 'blue: BB' }] },
    ] }, total: hyper(3, 2, 2, 1).toString() }, caption: `RB and BR both come to 6/20: 3/5 × 2/4 = 2/5 × 3/4. Their sum ${hyper(3, 2, 2, 1)} is the answer. Every order of the same colours has the same probability, which is why the orders can be counted instead of drawn.` },
    { type: 'check', scope: 'orders have equal probability', questions: [
      { type: 'choice', q: 'Urn: 4 red, 3 blue. Draw 3. Compare P(R, R, B in that order) with P(B, R, R in that order).', options: ['They are equal', 'R, R, B is larger', 'B, R, R is larger'], answer: 0, traps: { 1: 'the denominators are 7, 6, 5 either way and the numerators are the same factors in another order', 2: 'same factors, different order' }, explain: `Both are (4 × 3 × 3)/(7 × 6 × 5) = ${oneOrder(4, 3, 3, 2)}.` },
    ] },
    { type: 'text', text: 'The same urn as a grid of ordered draws: rows are the first ball, columns the second. The diagonal is impossible (a ball cannot be drawn twice), leaving 20 equally likely ordered pairs.' },
    { type: 'diagram', diagram: 'grid', spec: (() => { const hl = []; const txt = BALLS.map((a, i) => BALLS.map((b, j) => { if (i === j) return '×'; if (a[0] !== b[0]) hl.push([i, j]); return ''; })); return { rows: 5, cols: 5, rowLabels: BALLS, colLabels: BALLS, rowTitle: 'first ball', colTitle: 'second ball', cellText: txt, highlight: hl, count: hl.length }; })(), caption: `One red and one blue: ${3 * 2 * 2} of the 20 ordered pairs, ${Q.of(12, 20)}. As unordered hands: 3 × 2 = 6 of C(5,2) = 10, the same ${hyper(3, 2, 2, 1)}.` },
    { type: 'check', scope: 'ordered pairs versus hands', questions: [
      { type: 'number', q: 'Same urn (3 red, 2 blue), draw 2. How many unordered hands have two reds?', answer: C(3, 2), hints: ['Choose 2 of the 3 red balls.', 'C(3,2).'], explain: `C(3,2) = ${C(3, 2)} hands of 10, so P(two red) = ${hyper(3, 2, 2, 2)}.` },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Draw 4 from 5 red and 5 blue: number of reds', xLabel: 'reds drawn', yLabel: 'probability', categories: J4.map(String), series: [{ name: 'without replacement', values: J4.map((j) => Math.round(hyper(5, 5, 4, j).toNumber() * 1000) / 1000) }, { name: 'binomial (with replacement)', values: J4.map((j) => Math.round(binom(Q.of(1, 2), 4, j).toNumber() * 1000) / 1000) }], valueLabels: true }, caption: 'Without replacement the count is more concentrated around the middle: every red you draw makes the next ball more likely blue, which pulls lopsided hands back toward balance.' },
    { type: 'check', scope: 'which way the binomial errs', questions: [
      { type: 'choice', q: 'Draw 4 from 5 red and 5 blue without replacement. P(all four red) compared with the binomial (1/2)⁴:', options: ['smaller', 'larger', 'equal'], answer: 0, traps: { 1: 'each red drawn lowers the chance of the next red', 2: 'only the first draw has the same chance' }, explain: `${hyper(5, 5, 4, 4)} ≈ ${d3(hyper(5, 5, 4, 4))} against 0.0625.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'binomial', say: 'For the colour count, order does not matter. Every subset of k balls is equally likely to be the hand, so there are C(r + b, k) equally likely hands.', why: 'Each ordered draw of k distinct balls is equally likely, and every hand is k! of them, the same number for every hand.',
        checks: [
          { make: (rng) => { const { r, b, n } = urn(rng); const k = rng.int(2, 4); return { type: 'number', q: `An urn holds ${r} red and ${b} blue. How many equally likely hands of ${k} balls are there?`, answer: C(n, k), hints: [`${n} balls in total.`, `C(${n}, ${k}).`], explain: `C(${n},${k}) = ${C(n, k)}.` }; } },
        ] },
      { say: 'A hand with exactly j red: choose which j of the r reds (C(r, j)) and which k − j of the b blues (C(b, k − j)). Multiply.', why: 'The two choices are independent of each other; every pair of choices is a different hand.',
        checks: [
          { make: (rng) => { const { r, b } = urn(rng); const k = 3, j = rng.int(1, 2); return { type: 'number', q: `${r} red, ${b} blue, draw 3. How many hands have exactly ${j} red?`, answer: C(r, j) * C(b, k - j), hints: [`Reds: C(${r},${j}).`, `Blues: C(${b},${k - j}).`], explain: `${C(r, j)} × ${C(b, k - j)} = ${C(r, j) * C(b, k - j)}.` }; } },
        ] },
      { say: 'Divide: P(exactly j red) = C(r, j) C(b, k − j) / C(r + b, k).', why: 'Favourable hands over all hands, since hands are equally likely.',
        checks: [
          { make: (rng) => { const { r, b, n } = urn(rng); const k = 3, j = rng.int(1, 2); const v = hyper(r, b, k, j); return mc(rng, `${r} red, ${b} blue, draw 3 without replacement. P(exactly ${words[j]} red)?`, v.toString(), [[binom(Q.of(r, n), k, j).toString(), 'used the binomial, as if each ball went back'], [oneOrder(r, b, k, j).toString(), `computed one order only and forgot the C(3,${j}) = ${C(3, j)} orders`], [atLeast(r, b, k, j).toString(), `computed at least ${words[j]}`], [Q.of(j, k).toString(), 'used the fraction of the draws that are red']], `C(${r},${j})C(${b},${k - j})/C(${n},3) = ${C(r, j) * C(b, k - j)}/${C(n, 3)} = ${v}.`); } },
        ] },
      { answers: 'exactly', say: 'At least j: add the terms for j, j + 1, …, k. If "at least 1", use the complement: 1 − C(b, k)/C(r + b, k).', why: 'Different red counts are disjoint, so their probabilities add; the complement is shorter when only one term is excluded.',
          checks: [
          { make: (rng) => { const { r, b, n } = urn(rng); const k = 3; const v = atLeast(r, b, k, 1); return mc(rng, `${r} red, ${b} blue, draw 3. P(at least one red)?`, v.toString(), [[hyper(r, b, k, 1).toString(), 'computed exactly one red'], [Q.of(1).sub(qpow(Q.of(b, n), 3)).toString(), 'used the with-replacement complement'], ...(3 * r <= n ? [[Q.of(3 * r, n).toString(), 'added r/n for each draw']] : [])], `1 − C(${b},3)/C(${n},3) = 1 − ${C(b, 3)}/${C(n, 3)} = ${v}.`); } },
        ] },
      { answers: 'one-order', say: 'Sequential route: the product for one order (reds first) times C(k, j), the number of orders. It gives the same answer.', why: 'Every order of the same colours has the same product (same factors, rearranged), so the total is one product times the count of orders.',
        checks: [
          { type: 'choice', q: '4 red, 4 blue, draw 3. P(exactly 2 red) by the sequential route?', options: [`3 × 4/8 × 3/7 × 4/6 = ${Q.of(3).mul(oneOrder(4, 4, 3, 2))}`, `4/8 × 3/7 × 4/6 = ${oneOrder(4, 4, 3, 2)}`, `3 × (1/2)³ = ${Q.of(3, 8)}`], answer: 0, traps: { 1: 'forgot the C(3,2) = 3 orders', 2: 'with replacement' }, explain: `Check by hands: C(4,2)C(4,1)/C(8,3) = ${C(4, 2) * C(4, 1)}/${C(8, 3)} = ${hyper(4, 4, 3, 2)}.` },
        ] },
    ] },
    { type: 'text', text: 'One more contrast keeps the counting honest. If the question is about **one particular draw** (the 3rd ball is red) rather than a count, no C is needed at all: by the card-symmetry argument, any single draw is a uniformly random ball, red with r/(r + b), whatever happened unseen before it. Counts need hands; single positions need only symmetry.' },
    { type: 'check', scope: 'a single draw versus a count', questions: [
      { make: (rng) => { const { r, b, n } = urn(rng); const m = rng.int(2, 5); return mc(rng, `${r} red, ${b} blue. Balls are drawn without replacement and not looked at until the end. P(the ${['', '1st', '2nd', '3rd', '4th', '5th'][m]} ball is red)?`, Q.of(r, n).toString(), [[Q.of(r, n - m + 1).toString(), 'shrank the urn by the earlier unseen draws'], [hyper(r, b, m, 1).toString(), `computed exactly one red in ${m} draws`], [Q.of(r - m + 1, n - m + 1).toString(), 'assumed every earlier draw was red']], `Any single draw is a uniform ball: ${r}/${n} = ${Q.of(r, n)}.`); } },
    ] },
    { type: 'explain', prompt: 'In your own words: why do all orders of the same colours (like RRB, RBR, BRR) have the same probability when drawing without replacement?', model: 'Each order\'s probability is a product with denominators n, n − 1, n − 2 in every case, because one ball leaves per draw. The numerators are the reds r, r − 1 and the blue b, just met in a different order. Same factors, so the same product; that is why you can count orders with C(k, j) or count hands directly.', points: ['denominators fall n, n − 1, … whatever the colours', 'numerators are the same factors in a different order', 'so orders are equally likely: multiply one order by C(k, j), or count hands'] },

    S('worked'),
    { type: 'worked', family: 'urn-draws', section: 'bto', difficulty: 2, seed: 'd', explainAt: [0], intro: 'Exactly j red. Try it before opening the solution.' },
    { type: 'worked', family: 'urn-draws', section: 'bto', difficulty: 3, seed: 'b', fade: 1, intro: 'At least j red. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'A batch of 10 items has 3 defective. You test 4 of them, chosen at random. What is the probability that exactly one is defective?', lines: [
      { t: 0, say: 'A fixed batch, sampled without putting back, counting one kind: an urn. Count hands.' },
      { t: 3, say: `Exactly one of four at 3/10 each: C(4,1) × 3/10 × (7/10)³ ≈ ${d3(TA_BIN)}.`, slip: true },
      { t: 7, say: `Wait, that is the binomial: it puts items back. Count hands instead: C(10,4) = ${C(10, 4)} in total.` },
      { t: 11, say: `One defective and three good: C(3,1) × C(7,3) = ${C(3, 1)} × ${C(7, 3)} = ${C(3, 1) * C(7, 3)}.` },
      { t: 15, say: `P = ${C(3, 1) * C(7, 3)}/${C(10, 4)} = ${hyper(3, 7, 4, 1)}. One is the central count and urns concentrate there, so beating ${d3(TA_BIN)} fits. Answer ${hyper(3, 7, 4, 1)}.` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try gave about 0.412. What went wrong?', options: ['used the binomial, as if items went back', 'counted the defective items wrong', 'multiplied by C(4, 1)', 'answered at least one'], answer: 0, traps: { 1: '3 defective in 10 is right', 2: 'the four positions were fine; the slip was 3/10 at every draw', 3: 'the try was for exactly one' }, explain: 'Tested items are not put back. Count hands: C(3, 1) × C(7, 3) / C(10, 4) = 105/210 = 1/2.' },
    ] },

    S('predict'),
    { type: 'predict', question: 'Urn with 5 red and 5 blue; draw 2 without replacement. Is P(one of each) above or below the binomial 1/2?', answer: `Above: ${hyper(5, 5, 2, 1)} ≈ ${d3(hyper(5, 5, 2, 1))}.`, explain: 'Taking a red makes blue more likely next, which favours mixed hands.' },

    S('traps'),
    { type: 'traps', family: 'urn-draws', section: 'bto', extra: [
      { belief: 'Use the binomial with p = r/(r + b).', fix: 'That puts each ball back. Without replacement, count hands.' },
      { belief: 'The sequential product for one order is the answer.', fix: 'It is one of C(k, j) equally likely orders. Multiply by C(k, j).' },
      { belief: '"At least j" is the same as "exactly j".', fix: 'Add the terms for every allowed count, or use the complement.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(exactly two red) when drawing 3 from 4 red and 4 blue. One step is wrong.', steps: [
      'The first two draws are red: 4/8 × 3/7.',
      'The third is blue: 4/6.',
      `So P = 4/8 × 3/7 × 4/6 = ${oneOrder(4, 4, 3, 2)}.`,
      `Answer ${oneOrder(4, 4, 3, 2)}.`,
    ], errorStep: 0, explain: `Step 1 assumes the reds come first. The blue can be the 1st, 2nd or 3rd draw: C(3,2) = 3 orders, each with the same product. Correct: ${hyper(4, 4, 3, 2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `5 red, 3 green, draw 3. A candidate answers P(at least 2 red) = ${hyper(5, 3, 3, 2)}. Which belief?`, options: ['"At least 2" read as "exactly 2"', 'Binomial instead of hands', 'One order only'], answer: 0, explain: `${hyper(5, 3, 3, 2)} leaves out the ${C(5, 3)} all-red hands. Correct: ${atLeast(5, 3, 3, 2)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the small binomial coefficients: C(6,3) = ${C(6, 3)}, C(7,3) = ${C(7, 3)}, C(8,3) = ${C(8, 3)}, C(9,3) = ${C(9, 3)}, C(10,3) = ${C(10, 3)}, C(10,4) = ${C(10, 4)}. Most urn items are two small products over one of these.` },
    { type: 'check', scope: 'the coefficients and the sanity rule', questions: [
      { make: (rng) => { const n = rng.int(6, 10); const k = rng.int(2, 3); return { type: 'number', q: `C(${n}, ${k}) = ?`, answer: C(n, k), hints: [`n(n − 1)${k === 3 ? '(n − 2)' : ''} / ${k === 3 ? '6' : '2'}.`], explain: `C(${n},${k}) = ${C(n, k)}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `Sanity: the probabilities for 0, 1, …, k reds add to 1, and the answer is pulled toward the middle compared with the binomial. Time budget ${SECTIONS.bto.exam.perItemSeconds} seconds: an exact-j item takes 30, an at-least item 45.` },
    { type: 'check', scope: 'pulled toward the middle', questions: [
      { type: 'choice', q: 'An urn holds 3 red and 7 blue. Draw 3. Compared with drawing with replacement, P(exactly 1 red) is:', options: ['higher', 'lower', 'the same'], answer: 0, stable: true, traps: { 1: 'without replacement the count is pulled toward the middle, and 1 red is the middle here', 2: 'the draws change the urn, so the chances differ' }, explain: 'Urn: C(3, 1) × C(7, 2)/C(10, 3) = 63/120 = 0.525. With replacement: 3 × 0.3 × 0.7² = 0.441.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Without replacement, j of one kind in k draws → C(r,j)C(b,k−j)/C(r+b,k). Sequential product → × C(k,j). At least → add terms or complement.' },

    S('contrast'),
    { type: 'compare', columns: ['Draw 3 from 4 red, 4 blue: P(exactly 2 red)', 'Formula', 'Value'], rows: [
      ['without replacement (hands)', 'C(4,2)C(4,1)/C(8,3)', hyper(4, 4, 3, 2).toString()],
      ['with replacement (binomial)', 'C(3,2)(1/2)²(1/2)', binom(Q.of(1, 2), 3, 2).toString()],
      ['one order only (the trap)', '4/8 × 3/7 × 4/6', oneOrder(4, 4, 3, 2).toString()],
      ['the 3rd ball alone is red', 'symmetry: r/(r + b)', '1/2'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: if k is larger than the number of blues, "no red" is impossible: C(b, k) = 0. Draw every ball and the count is certain. A single draw (k = 1) is the same with or without replacement.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'An urn holds 2 red and 3 blue. Draw 4. P(no red)?', options: ['0', qpow(Q.of(3, 5), 4).toString(), '1/5'], answer: 0, traps: { 1: 'used the binomial (3/5)⁴, which allows the same blue ball twice', 2: 'guessed one of five balls' }, explain: 'Only 3 blues exist, so 4 draws must include a red.' },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a deck is an urn with 4 suits or 13 ranks (bto/card-draws); a committee is an urn of people; quality control samples a batch. When the urn is huge compared with the sample, the binomial becomes a good approximation, which is how polls work.' },
    { type: 'variation', base: `Urn: 4 red, 4 blue. Draw 3 without replacement. P(exactly 2 red) = C(4,2)C(4,1)/C(8,3) = ${hyper(4, 4, 3, 2)}.`, rows: [
      { change: 'Ask for exactly 2 blue instead', effect: `No change: ${hyper(4, 4, 3, 1)}. With as many blues as reds, swapping the colour names maps one event onto the other.`, same: true },
      { change: 'Draw the 3 balls together instead of one by one', effect: 'No change. A handful is a uniformly random subset, the same as three draws kept out.', same: true },
      { change: 'Put each ball back after drawing it', effect: `Binomial: C(3,2)(1/2)³ = ${binom(Q.of(1, 2), 3, 2)}. Lower, because replacement allows lopsided hands more often.` },
      { change: 'Ask for at least 2 red', effect: `Add the all-red hands: (${C(4, 2) * C(4, 1)} + ${C(4, 3)})/${C(8, 3)} = ${atLeast(4, 4, 3, 2)}.` },
      { change: 'Put the balls back and ask for at least 2 red', effect: `Each term changes (${binom(Q.of(1, 2), 3, 2)} + ${binom(Q.of(1, 2), 3, 3)}), yet the total is ${atLeast(4, 4, 3, 2).toString() === binom(Q.of(1, 2), 3, 2).add(binom(Q.of(1, 2), 3, 3)).toString() ? 'the same' : 'different'}: ${binom(Q.of(1, 2), 3, 2).add(binom(Q.of(1, 2), 3, 3))}. "At least 2 of 3" is a colour majority, and an evenly mixed urn gives either colour the majority equally often, with or without replacement.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const w = rng.int(3, 6), m = rng.int(4, 7); const n = w + m; const v = hyper(w, m, 3, 2); return mc(rng, `A committee of 3 is picked at random from ${w} women and ${m} men. P(exactly 2 women)?`, v.toString(), [[binom(Q.of(w, n), 3, 2).toString(), 'used the binomial, as if a person could be picked twice'], [oneOrder(w, m, 3, 2).toString(), 'computed one order only'], [atLeast(w, m, 3, 2).toString(), 'computed at least 2 women']], `C(${w},2)C(${m},1)/C(${n},3) = ${C(w, 2) * m}/${C(n, 3)} = ${v}.`); } },
      far: { type: 'choice', q: 'An auditor checks 4 of the 12 trades booked today, chosen at random. 2 of the 12 have booking errors. P(the audit finds no error)?', options: [hyper(2, 10, 4, 0).toString(), qpow(Q.of(10, 12), 4).toString(), Q.of(1).sub(hyper(2, 10, 4, 0)).toString(), Q.of(1).sub(Q.of(4 * 2, 12)).toString()], answer: 0, traps: { 1: 'used the binomial: a trade cannot be checked twice', 2: 'answered "finds at least one error"', 3: 'subtracted 2/12 for each checked trade' }, explain: `All 4 checked trades come from the 10 clean ones: C(10,4)/C(12,4) = ${C(10, 4)}/${C(12, 4)} = ${hyper(2, 10, 4, 0)}.` },
      principle: { type: 'choice', q: 'Which idea carried over from urns to committees and audits?', options: ['Count equally likely subsets: C(r, j) C(b, k − j) / C(n, k)', 'Treat each pick as independent with the same chance', 'Multiply one order of the picks and stop there', 'Use the share of good items as the probability'], answer: 0, traps: { 1: 'that is the binomial: sampling with replacement', 2: 'every order of the same kinds has the same product; count them all', 3: 'a share of the population is not the chance of a count' }, explain: 'Without replacement every subset of size k is equally likely, so count the favourable subsets and divide.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'urn-draws', section: 'bto', count: 3 },
  ],
};
