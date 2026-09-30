// Likelihood List family: dice statement triples (no picture). Price each statement with its
// fastest tool: count (two-dice sums, doubles, maximum), complement (at least one), product (first
// six, all different), binomial tail (at least k). The classic traps are de Méré and Newton-Pepys.
import { Q } from '../../../core/rational.js';
import { S, LL, dp, mc, rank, again, C } from './compare-without-computing.js';

const q = (n, d = 1) => Q.of(n, d);
const pw = (x, n) => { let r = q(1); for (let i = 0; i < n; i++) r = r.mul(x); return r; };
const ways = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const sumGe = (t) => { let w = 0; for (let s = t; s <= 12; s++) w += ways(s); return w; };
const atLeastOne = (n, p = q(1, 6)) => q(1).sub(pw(q(1).sub(p), n));
// P(at least k successes in n trials at 1/6), exact.
const binGe = (n, k) => { let t = q(0); for (let j = k; j <= n; j++) t = t.add(q(C(n, j)).mul(pw(q(1, 6), j)).mul(pw(q(5, 6), n - j))); return t; };
const DM = { four: atLeastOne(4), dbl: atLeastOne(24, q(1, 36)), ge10: q(sumGe(10), 36) };
const DMO = [['(a) one six in 4 throws', DM.four], ['(b) a double six in 24 throws', DM.dbl], ['(c) sum at least 10', DM.ge10]].sort((a, b) => b[1].cmp(a[1]));
const NP = [1, 2, 3, 4].map((k) => binGe(6 * k, k));
const NS = [1, 2, 3, 4, 5, 6, 8, 10];
const ONE2 = 36 - 25, NAIVE2 = 6 + 6; // two dice: pairs with at least one six; the double-counted sum
const NP4 = q(4).mul(q(1, 6)).toString(), TOP = [12, 11, 10, 9, 8].map(sumGe);

// Statement pool for the ranking checks.
const POOL = {
  sixInN: (r) => { const n = r.int(2, 6); return [`At least one six in ${n} throws.`, atLeastOne(n).toNumber()]; },
  noSix: (r) => { const n = r.int(2, 5); return [`No six in ${n} throws.`, pw(q(5, 6), n).toNumber()]; },
  sumGe: (r) => { const t = r.int(7, 11); return [`The sum of two dice is at least ${t}.`, sumGe(t) / 36]; },
  sumEq: (r) => { const s = r.int(4, 10); return [`The sum of two dice is exactly ${s}.`, ways(s) / 36]; },
  double: () => ['Two dice show the same face.', 1 / 6],
  maxIs: (r) => { const k = r.int(3, 6); return [`The higher of two dice is exactly ${k}.`, (2 * k - 1) / 36]; },
  firstSix: (r) => { const k = r.int(1, 4); return [`The first six comes on throw ${k}.`, pw(q(5, 6), k - 1).mul(q(1, 6)).toNumber()]; },
  allDiff: (r) => { const n = r.int(3, 4); return [`${n} dice all show different faces.`, Array.from({ length: n }, (_, i) => (6 - i) / 6).reduce((x, y) => x * y, 1)]; },
};

export default {
  id: 'll/dice-events',
  book: 'll',
  kind: 'family',
  family: 'dice-events',
  title: 'Dice statement triples',
  summary: 'Price each statement with its fastest tool (count, complement, product, binomial); beware n × p and "scale everything up".',
  prerequisites: ['bto/two-dice-sum', 'bto/at-least-one', 'prob/discrete-distributions'],
  objectives: [
    'Pick the fastest tool for any dice statement in a few seconds',
    'Compute "at least one in n" as 1 − (1 − p)^n and explain why n × p overshoots',
    'Order the de Méré and Newton-Pepys triples and say why the intuitive order fails',
    'Recall (5/6)^n for small n and the two-dice counts well enough to rank without writing',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: rank from most to least likely. (a) At least one six in 4 throws of a die. (b) At least one double six in 24 throws of a pair of dice. (c) The sum of two dice is at least 10. Two approaches, then an order.', answer: DMO.map(([t, p]) => `${t} ≈ ${dp(p)}`).join(' > '), explain: `4 × 1/6 and 24 × 1/36 are both ${NP4}, so the "rate × tries" reasoning calls (a) and (b) equal. The complement separates them: 1 − (5/6)^4 ≈ ${dp(DM.four)} against 1 − (35/36)^24 ≈ ${dp(DM.dbl)}. That is the Chevalier de Méré's problem from 1654.` },
    { type: 'text', text: 'There is **no picture**: three statements about fair dice, each from a different experiment (a few throws of one die, a pair of dice, several dice at once, throwing until a six). You rank them by putting a number, or a tight estimate, on each.' },
    { type: 'list', items: ['"At least one six in n throws" or "no six in n throws"', '"The sum of two dice is at least t", "two dice show the same face", "the higher die is exactly k"', '"At least k sixes when 6k dice are thrown", "the first six comes on throw k", "n dice all show different faces"'] },
    { type: 'text', text: 'Not this lesson: a table or chart of past rolls (count rows instead) and coin strings (patterns inside a sequence).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Which tool prices "at least one six in 5 throws" fastest?', 'the complement: 1 − (5/6)^5', [['counting ordered outcomes directly', '6^5 = 7776 outcomes is far too many to count'], ['5 × 1/6', 'adding the chances double-counts throws with several sixes'], ['a two-dice grid', 'the grid only covers two dice']], 'Every throw missing is one product: (5/6)^5.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Pure dice triples are frequent and quick if each statement triggers its tool instantly. They are built around two famous intuitions that fail: "rate × tries" (de Méré) and "scale everything up and the chance stays the same" (Newton-Pepys, 1693). Knowing both failures by heart turns the hardest items of this family into recall, and the rest are one-line calculations you can do without writing.' },

    S('anchor'),
    { type: 'text', text: 'You know one die (1/6 per face), the two-dice grid (36 ordered pairs) and the complement ("at least one" = 1 − "none"). Every statement here is one of those with **one change**: more throws (complement), more dice at once (count or product), or a threshold of k successes (binomial tail).' },
    { type: 'check', scope: 'one die, two dice, complement', questions: [
      { make: (rng) => { const n = rng.int(2, 5); return { type: 'number', q: `P(no six in ${n} throws of a die)? (3 decimals)`, answer: pw(q(5, 6), n).toNumber(), tolerance: 0.0015, hints: ['Each throw misses with 5/6.', `Multiply ${n} times.`], explain: `(5/6)^${n} = ${dp(pw(q(5, 6), n))}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Two dice, "at least one six" highlighted. The blank 5 × 5 block is the complement: no six on either die.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', highlight: Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6), i % 6]).filter(([r, c]) => r === 5 || c === 5), count: ONE2 }, caption: `${ONE2} of 36 cells, not ${NAIVE2}: 1/6 + 1/6 counts the double six (6,6) twice. 1 − 25/36 = ${atLeastOne(2)} counts it once.` },
    { type: 'check', scope: 'the complement on the grid', questions: [
      { make: (rng) => { const f = rng.int(1, 6); return mc(rng, `Two dice. P(at least one die shows ${f})?`, `${ONE2}/36`, [[`${NAIVE2}/36`, 'added 1/6 + 1/6 and counted the double twice'], ['1/36', 'answered "both dice show it"'], ['25/36', 'answered the complement: neither die shows it']], `1 − (5/6)^2 = ${atLeastOne(2)}.`); } },
    ] },
    { type: 'text', text: 'Now more throws. The true curve 1 − (5/6)^n bends below the straight line n/6, which even passes 1.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 8, label: 'throws n' }, y: { min: 0, max: 1.4, label: 'probability' }, curves: [{ label: '1 − (5/6)^n', points: Array.from({ length: 9 }, (_, n) => [n, 1 - (5 / 6) ** n]) }, { label: 'n/6 (wrong)', points: Array.from({ length: 9 }, (_, n) => [n, n / 6]) }], hlines: [{ y: 0.5, label: '1/2' }] }, caption: `The curve crosses 1/2 between 3 throws (${dp(atLeastOne(3))}) and 4 throws (${dp(atLeastOne(4))}). The line n/6 says 6 throws guarantee a six; the truth is ${dp(atLeastOne(6))}.` },
    { type: 'check', scope: 'at least one in n', questions: [
      { make: (rng) => { const n = rng.pick(NS); return { type: 'number', q: `P(at least one six in ${n} throws)? (3 decimals)`, answer: atLeastOne(n).toNumber(), tolerance: 0.0015, hints: ['Complement: no six at all.', `1 − (5/6)^${n}.`], explain: `1 − (5/6)^${n} = ${dp(atLeastOne(n))}.` }; } },
    ] },
    { type: 'text', text: 'Newton-Pepys: scale the dice and the required sixes together. The expected number of sixes stays exactly at the target, yet the chance of reaching it falls.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'At least k sixes with 6k dice', xLabel: 'k (dice = 6k)', yLabel: 'probability', categories: ['1 (6 dice)', '2 (12 dice)', '3 (18 dice)', '4 (24 dice)'], series: [{ name: 'P', values: NP.map((x) => Number(x.toNumber().toFixed(3))) }] }, caption: `${NP.map((x) => dp(x)).join(', ')}. Each bar is below the one before: more dice make "at least the average" harder, drifting down towards 1/2.` },
    { type: 'check', scope: 'Newton-Pepys', questions: [
      mc(null, 'Which is most likely?', 'at least one six with 6 dice', [['at least two sixes with 12 dice', 'assumed scaling dice and target together keeps the chance fixed'], ['at least three sixes with 18 dice', 'assumed more dice make the target easier'], ['they are all equal', 'the expected count equals the target each time, but the chance of reaching it falls']], `${NP.slice(0, 3).map((x) => dp(x)).join(' > ')}.`, { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves: choose the tool, then the two classic corrections, then the product rules for sequences. With them, every statement in the pool gets a number in under 15 seconds.' },
    { type: 'steps', steps: [
      { say: 'Choose the tool from the wording: a two-dice property → count cells of 36; "at least one" → complement; "first six on throw k", "all different" → a product; "at least k of n" → binomial tail.', why: 'Only the order is scored, so the fastest correct number per statement is all you need.',
        checks: [mc(null, '"Three dice all show different faces." Fastest tool?', 'a product: 6/6 × 5/6 × 4/6', [['the complement of "at least one six"', 'faces being different has nothing to do with sixes'], ['the two-dice grid', 'there are three dice'], ['a binomial tail', 'there is no count of successes here']], 'Each new die must avoid the faces already shown.', { at: 1 })] },
      { say: '"At least one in n" = 1 − (1 − p)^n. Never n × p: that adds the chances and counts outcomes with two or more successes several times.', why: 'The complement "none in n" is one product, which is exact.',
        checks: [{ make: (rng) => { const n = rng.pick([12, 18, 24, 30, 36]); return { type: 'number', q: `P(at least one double six in ${n} throws of two dice)? (3 decimals)`, answer: atLeastOne(n, q(1, 36)).toNumber(), tolerance: 0.0015, hints: ['A double six has chance 1/36 per throw.', `1 − (35/36)^${n}.`], explain: `1 − (35/36)^${n} = ${dp(atLeastOne(n, q(1, 36)))}; n × p would give ${dp(n / 36)}.` }; } }] },
      { say: 'Equal n × p does not mean equal chances: rarer events tried more often fall further short of n × p. So 4 tries at 1/6 beats 24 tries at 1/36.', why: 'The overshoot of n × p comes from multiple successes, which are more common when each try succeeds more often; the exact complement removes it.',
        checks: [{ hinge: true, make: (rng) => { const [n1, n2] = rng.pick([[2, 12], [3, 18], [4, 24], [5, 30]]); return mc(rng, `Which is more likely: at least one six in ${n1} throws, or at least one double six in ${n2} throws of two dice?`, `one six in ${n1} throws`, [[`one double six in ${n2} throws`, 'assumed more tries always win'], ['they are equal', `used n × p: ${n1}/6 = ${n2}/36`]], `1 − (5/6)^${n1} = ${dp(atLeastOne(n1))} against 1 − (35/36)^${n2} = ${dp(atLeastOne(n2, q(1, 36)))}.`); } }] },
      { say: '"At least k sixes with 6k dice" falls as k grows: the target is the mean, and with more dice the chance of landing below the mean grows towards 1/2.', why: 'The count spreads out like √n, so falling a little short of the mean becomes common.',
        checks: [{ make: (rng) => { const k = rng.int(1, 3); return mc(rng, `Compare "at least ${k} six${k > 1 ? 'es' : ''} with ${6 * k} dice" and "at least ${k + 1} sixes with ${6 * k + 6} dice".`, `the first is more likely`, [['the second is more likely', 'assumed more dice make the target easier'], ['they are equal', 'matched the expected counts and stopped']], `${dp(NP[k - 1])} against ${dp(NP[k])}.`); } }] },
    ] },
    { type: 'explain', prompt: 'Explain why "at least one six in 4 throws" and "at least one double six in 24 throws" differ although 4 × 1/6 = 24 × 1/36.', model: 'Multiplying tries by the chance adds up the chances of each try, which counts the outcomes with several successes more than once, so it overstates "at least one". The exact route is the complement: none in 4 is (5/6)^4 and none in 24 is (35/36)^24. The second is larger, so "at least one double six in 24" is less likely: about 0.491 against 0.518.', points: ['n × p overcounts outcomes with several successes', 'Use 1 − (1 − p)^n', 'The two complements differ, so the two chances differ'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'dice-events', difficulty: 1, seed: 'a', intro: 'One throw of two dice and a few throws of one die. Put a number on each statement. Try it first.' },
    { type: 'worked', section: 'll', family: 'dice-events', difficulty: 3, seed: 'b', fade: 1, intro: 'Newton-Pepys style statements. The numbers are worked out for you; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'One six in 6 dice, or two sixes in 12 dice: which is more likely?', answer: `One six in 6 dice: ${dp(NP[0])} against ${dp(NP[1])} (Newton-Pepys).`, explain: 'Scaling up the dice and the target together makes it harder.' },

    S('traps'),
    { type: 'text', text: 'Every trap in this family is an intuition that works for one die and breaks when the experiment grows: adding chances, scaling up, or forgetting order. The fix is always the same: use the exact tool for the statement\'s shape.' },
    { type: 'traps', section: 'll', family: 'dice-events', extra: [
      { belief: 'At least one six in n throws is n/6.', fix: 'Use 1 − (5/6)^n; n/6 overcounts and passes 1 once n is above 6.' },
      { belief: 'Equal n × p means equal chance (de Méré).', fix: 'Compute both complements: 4 throws at 1/6 beats 24 at 1/36.' },
      { belief: 'More dice with proportionally more sixes needed keep the chance the same.', fix: 'Newton-Pepys: the chance falls with every step up.' },
      { belief: `At least one six with two dice is ${NAIVE2}/36.`, fix: `The double six is counted twice: ${ONE2}/36.` },
    ] },
    { type: 'erroneous', problem: 'A candidate ranks the challenge triple. One step is wrong.', steps: [
      `Sum at least 10: ${sumGe(10)} of 36 pairs, ${dp(DM.ge10)}.`,
      `One six in 4 throws: 4 × 1/6 = ${NP4}.`,
      `One double six in 24 throws: 24 × 1/36 = ${q(24).mul(q(1, 36))}, the same.`,
      'So (a) and (b) tie, both far above (c).',
    ], errorStep: 1, explain: `n × p is not a probability of "at least one". Step 2 should be 1 − (5/6)^4 = ${dp(DM.four)} (and step 3 then 1 − (35/36)^24 = ${dp(DM.dbl)}), which breaks the tie.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'A candidate answers P(at least one six in 8 throws) = 8/6. What went wrong?', 'Added the chances instead of using the complement', [['Used the wrong die', 'the per-throw chance 1/6 is right'], ['Counted ordered pairs', 'no pairs are involved'], ['Applied Newton-Pepys', 'that is about several sixes, not at least one']], `A probability cannot pass 1; 1 − (5/6)^8 = ${dp(atLeastOne(8))}.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise (5/6)^n: it drops below 1/2 at 4 throws (${dp(pw(q(5, 6), 4), 2)}) and is about ${dp(pw(q(5, 6), 6), 2)} at 6. "At least one six" is 1 minus the table.` },
    { type: 'diagram', diagram: 'table', spec: { caption: 'No six in n throws', columns: ['n', '(5/6)^n', 'at least one six'], rows: [1, 2, 3, 4, 5, 6].map((n) => [n, dp(pw(q(5, 6), n)), dp(atLeastOne(n))]) }, caption: 'Six numbers that settle most "at least one six" statements at a glance.' },
    { type: 'callout', tone: 'speed', text: `Two dice: sums by 6 − |s − 7|, "at least t" from the top as ${TOP.join(', ')}; doubles 6/36; maximum exactly k is (2k − 1)/36. Budget: ${LL.exam.perItemSeconds} seconds, but most triples take 20.` },
    { type: 'check', scope: 'the recall table', questions: [
      { make: (rng) => again(() => { const keys = rng.shuffle(Object.keys(POOL)).slice(0, 3); return rank(rng, 'Rank from most to least likely (fair dice).', keys.map((k) => POOL[k](rng)), 'Price each with its tool; the table and the two-dice counts do most of the work.', { gap: 0.02 }); }) },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Dice triple → one tool per statement: grid counts (/36), 1 − (5/6)^n, products for sequences, binomial tails. Never n × p; scaling up dice and target lowers the chance.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Tool', 'Value'], rows: [
      ['at least one six in n', 'complement', '1 − (5/6)^n'],
      ['no six in n', 'product', '(5/6)^n'],
      ['first six on throw k', 'product', '(5/6)^(k−1) × 1/6'],
      ['two dice sum s', 'count', '(6 − |s − 7|)/36'],
      ['three dice all different', 'product', '6 × 5 × 4 / 216'],
      ['at least k sixes in 6k dice', 'binomial tail', 'falls with k'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: with n = 1 the complement and n × p agree (1/6). Seven dice can never all differ (only six faces), so that statement is impossible.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: collisions ("all different" with d values instead of 6), card hands (complements as products), coin patterns (count the strings that avoid the event) and large-number statements (binomial tails shrinking with n).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const k = rng.int(1, 4); const v = pw(q(5, 6), k - 1).mul(q(1, 6)); return { type: 'number', q: `P(the first six comes on throw ${k})? (3 decimals)`, answer: v.toNumber(), tolerance: 0.0015, hints: [`${k - 1} misses, then a six.`], explain: `(5/6)^${k - 1} × 1/6 = ${dp(v)}.` }; } },
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'dice-events', count: 3 },
  ],
};
