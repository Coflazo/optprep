// NumberLogic family lesson: a weighted two-term recurrence p·a(n−1) + q·a(n−2) (+ c).
// Every number shown is computed here.
import { S, neg, sgn, seq, ratio, nz, nextQ, pick, num, fibl, geo, affine, round2 } from './method-ladder.js';

const wt = (p, q, c, s, n) => { const o = [...s]; while (o.length < n) o.push(p * o[o.length - 1] + q * o[o.length - 2] + c); return o.slice(0, n); };
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const plusC = (c) => (c ? (c < 0 ? ` − ${-c}` : ` + ${c}`) : '');
const name = (p, q) => `${p === 1 ? '' : `${p} × `}last ${q < 0 ? '−' : '+'} ${Math.abs(q) === 1 ? '' : `${Math.abs(q)} × `}previous`;
const at = (p, q, c, xs, i) => p * xs[i - 1] + q * xs[i - 2] + c;
// "p × last ± q × previous ± c" with signs and brackets, for any draw.
const ev = (p, q, c, last, prev) => `${p === 1 ? '' : `${p} × `}${par(last)} ${q < 0 ? '−' : '+'} ${Math.abs(q) === 1 ? '' : `${Math.abs(q)} × `}${par(prev)}${plusC(c)}`;
// The ratio a weighted rule settles near: the positive root of r² = p·r + q.
const settle = (p, q) => (p + Math.sqrt(p * p + 4 * q)) / 2;

const CH = wt(2, 1, 0, [1, 5], 6);
const E1 = wt(1, 2, 0, [2, 5], 7);
const E2 = wt(3, 1, 0, [1, 2], 7);
const E3 = wt(3, -1, 0, [2, 5], 7);
const E4c = 2, E4 = wt(2, 1, E4c, [1, 3], 8);
const PRED = wt(1, 2, 0, [1, 3], 7);
const ERR = wt(2, 1, 0, [3, 4], 7);
const LONG = wt(2, 1, 0, [1, 2], 10);
const PAIRS = [[1, 1], [1, 2], [2, 1], [1, 3], [3, -1], [2, 2], [3, 1]];
const PELL = wt(2, 1, 0, [2, 5], 6);
const PELL2 = wt(2, 1, 0, [1, 3], 6), PELLD = wt(2, 1, 0, [1, 2], 6);

// Levels as in the generator. Five-term level-3 items often fit a second rule, so the checks
// show six terms (seven with a constant); the one six-term start that still fits a second rule
// (1 × last + 2 × previous from 3, 5, found with the rule finder) is redrawn.
const PQ = { 3: [[2, 1], [1, 2]], 4: [[3, 1], [1, 3], [2, 2], [3, -1]], 5: [[2, 1], [1, 2], [3, 1]] };
function draw(rng, lvl = rng.pick([3, 4, 5])) {
  for (;;) {
    const [p, q] = rng.pick(PQ[lvl]), c = lvl === 5 ? nz(rng, -5, 5) : 0, s = [rng.int(1, 5), rng.int(1, 6)], n = lvl === 5 ? 7 : 6;
    if (!c && p === 1 && q === 2 && s[0] === 3 && s[1] === 5) continue;
    return { p, q, c, n, xs: wt(p, q, c, s, n + 2) };
  }
}
const plain = (rng) => draw(rng, rng.pick([3, 4]));

export default {
  id: 'nl/weighted-two-term',
  book: 'nl',
  kind: 'family',
  family: 'weighted-two-term',
  title: 'Two previous terms with weights',
  summary: 'Last + previous is off, and the ratio drifts: try small weights such as 2 × last + previous; the pair that fits two steps is the rule.',
  prerequisites: ['nl/method-ladder', 'nl/fibonacci-like', 'nl/affine-recurrence'],
  objectives: [
    'Rule out last + previous in one addition',
    'Test the common weight pairs (2, 1), (1, 2), (3, 1), (1, 3) on two steps',
    'Put each weight on the right term and add any constant',
    'Use the size of the ratio to guess which weights to try first',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'plain-sum', label: 'Add the last two', approach: `Tried last + previous: ${CH[3]} + ${CH[4]} = ${CH[3] + CH[4]}.`, breaksAt: 'It is too small on every step: one of the two terms carries a weight.' },
      { id: 'ratio', label: 'Multiply by the ratio', approach: `Read the last ratio (about ${round2(CH[4] / CH[3])}) and multiplied by it.`, breaksAt: 'The ratio drifts, so no single multiplier gives whole numbers on every step.' },
      { id: 'swap', label: 'Weight the wrong term', approach: 'Found a weight of 2 and put it on the term before the last.', breaksAt: 'The shown steps fix which term carries the weight; swapping it changes the answer.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the ratios, once by building each term from the two before it.`, answer: String(CH[5]), explain: `Ratios ${CH.slice(1, 5).map((v, i) => round2(v / CH[i])).join(', ')} drift, so it is not one multiplication. Two before: ${CH[1]} + ${CH[2]} = ${CH[1] + CH[2]} is too small for ${CH[3]}, but 2 × ${CH[2]} + ${CH[1]} = ${CH[3]} and 2 × ${CH[3]} + ${CH[2]} = ${CH[4]}. Next: 2 × ${CH[4]} + ${CH[3]} = ${CH[5]}.` },
    { type: 'text', text: 'Each term is built from the **two terms before it**, each multiplied by a small whole number: 2 × last + previous, last + 2 × previous, 3 × last + previous, and so on, sometimes with a constant on top. The ratios look almost constant but keep drifting.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E4.slice(0, 7))}, ?`] },
    { type: 'check', scope: 'the cue: two terms, with weights', questions: [
      { make: (rng) => { const p = plain(rng), xs = p.xs.slice(0, 6), f = fibl(rng.int(1, 5), rng.int(6, 9), 6), a = affine(rng.int(1, 5), 2, rng.int(1, 4), 6); return pick(rng, 'Which sequence is a weighted two-term rule (not a plain sum, not k × last + c)?', seq(xs), [[seq(f), `${f[3]} + ${f[4]} = ${f[5]}: weights 1 and 1, the plain sum`], [seq(a), `2 × each term + ${a[1] - 2 * a[0]} gives the next: one previous term only`]], `${seq(xs)} is ${name(p.p, p.q)}: ${ev(p.p, p.q, 0, xs[4], xs[3])} = ${neg(xs[5])}.`); } },
    ] },
    { type: 'text', text: 'Not this lesson: weights (1, 1), the plain two-term sum; a single previous term times k plus a constant (the multiply-then-add lesson); or an exact ratio.' },
    { type: 'check', scope: 'the neighbouring rules', questions: [
      { type: 'choice', q: '2, 5, 11, 23, 47: which rule fits?', options: ['2 × last + 1', '2 × last + previous', 'last + previous'], answer: 0, traps: { 1: '2 × 11 + 5 = 27, not 23', 2: '11 + 5 = 16, not 23' }, explain: 'One previous term times 2, plus 1: the multiply-then-add lesson.' },
    ] },

    S('why'),
    { type: 'text', text: `Weighted recurrences appear in candidate reports of the test: a list like ${seq(PELL.slice(0, 5))} looks geometric, but the ratio drifts. They take long only if you guess formulas. With a short list of weight pairs to try, and one addition to rule out the plain sum, each test costs two multiplications, and the rule usually falls out on the first or second try.` },

    S('anchor'),
    { type: 'text', text: 'Fibonacci: next = 1 × last + 1 × previous. This family changes **one thing**: the two weights are other small whole numbers. Every weighted rule is "p × last + q × previous", and the Fibonacci rule is the case p = q = 1.' },
    { type: 'check', scope: 'p × last + q × previous', questions: [
      { make: (rng) => { const [p, q] = rng.pick(PAIRS.slice(1)), a = rng.int(5, 30), b = rng.int(10, 60); return num(`The last term is ${b} and the one before it is ${a}. The rule is ${name(p, q)}. What comes next?`, p * b + q * a, `${ev(p, q, 0, b, a)} = ${p * b + q * a}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Test candidate weights on the shown steps. Each row below is one candidate rule; the right one reproduces every shown term. The plain sum falls short, and one weight too many overshoots.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['rule', `predicts ${CH[2]}?`, `predicts ${CH[3]}?`, `predicts ${CH[4]}?`], rows: [[1, 1], [1, 2], [2, 1]].map(([p, q]) => [name(p, q), ...[2, 3, 4].map((i) => String(at(p, q, 0, CH, i)))]) }, caption: `Candidates on ${seq(CH.slice(0, 5))}: only ${name(2, 1)} gives ${seq(CH.slice(2, 5))}. Next: 2 × ${CH[4]} + ${CH[3]} = ${CH[5]}.` },
    { type: 'check', scope: 'testing candidate weights', questions: [
      { make: (rng) => { const p = plain(rng), xs = p.xs.slice(0, 6); const cands = PQ[3].concat(PQ[4]).filter(([a, b]) => !(a === p.p && b === p.q)).map(([a, b]) => [name(a, b), `${ev(a, b, 0, xs[3], xs[2])} = ${neg(at(a, b, 0, xs, 4))}, not ${neg(xs[4])}`]); return pick(rng, `${seq(xs)}: which rule fits every step?`, name(p.p, p.q), rng.shuffle(cands).slice(0, 3), `${ev(p.p, p.q, 0, xs[3], xs[2])} = ${neg(xs[4])}, and the same on every step.`); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [LONG.slice(4, 9), LONG.slice(5, 9).map((v, i) => ratio(LONG[i + 4], v))] }, caption: `Ratios of ${name(2, 1)} along a longer run: ${LONG.slice(5, 9).map((v, i) => round2(v / LONG[i + 4])).join(', ')}. They settle near ${round2(settle(2, 1))} but are never exactly equal: that drift is what rules out a geometric sequence.` },
    { type: 'check', scope: 'drift rules out a ratio', questions: [
      { type: 'choice', q: 'The ratios of 2 × last + previous settle near 2.41 but never become exact. What does that rule out?', options: ['a geometric sequence', 'a weighted two-term rule', 'a rule that uses two terms'], answer: 0, traps: { 1: 'drift is exactly what a weighted rule shows', 2: 'the rule does use two terms' }, explain: 'A constant ratio would be exact; drift means two weighted terms.' },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['weights (last, previous)', 'ratio settles near'], rows: PAIRS.map(([p, q]) => [`${p}, ${q}`, String(round2(settle(p, q)))]) }, caption: `Where each weight pair makes the ratio settle. A ratio near ${round2(settle(2, 1))} points to (2, 1), near ${round2(settle(1, 2))} to (1, 2), near ${round2(settle(3, 1))} to (3, 1). Use it to pick the first pair to test, then let the arithmetic decide.` },
    { type: 'check', scope: 'the ratio points to the weights', questions: [
      { make: (rng) => { const [p, q] = rng.pick([[2, 1], [1, 2], [3, 1], [1, 3]]), xs = wt(p, q, 0, [rng.int(1, 3), rng.int(4, 6)], 9), r = round2(xs[8] / xs[7]); return pick(rng, `Late in a weighted sequence the ratio of neighbours is about ${r}. Which weights (last, previous) should you test first?`, `${p}, ${q}`, [[1, 2], [2, 1], [3, 1], [1, 3]].filter(([a, b]) => !(a === p && b === q)).map(([a, b]) => [`${a}, ${b}`, `those settle near ${round2(settle(a, b))}`]), `${p}, ${q} settles near ${round2(settle(p, q))}.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: `The whole search on ${seq(E2.slice(0, 6))}: the plain sum ${E2[2]} + ${E2[3]} = ${E2[2] + E2[3]} is far below ${E2[4]}. The late ratio is about ${round2(E2[5] / E2[4])}, which points to (3, 1). Test it: 3 × ${E2[3]} + ${E2[2]} = ${E2[4]} and 3 × ${E2[4]} + ${E2[3]} = ${E2[5]}. Next: 3 × ${E2[5]} + ${E2[4]} = ${E2[6]}. The moves below slow that search down.` },
    { type: 'steps', steps: [
      { answers: 'plain-sum', say: 'Rule out the plain sum: compare term 2 + term 3 with term 4.', why: 'Weights (1, 1) are the first two-term rule to test. If the sum is too small, a weight bigger than 1 is involved.',
        checks: [
          { make: (rng) => { const p = plain(rng), xs = p.xs, s = xs[1] + xs[2]; return pick(rng, `${seq(xs.slice(0, 6))}: compared with ${neg(xs[3])}, is ${neg(xs[1])} + ${par(xs[2])} too small, right, or too large?`, s < xs[3] ? 'too small' : s > xs[3] ? 'too large' : 'right', [['too small', 'the sum is not below the term'], ['right', `${neg(xs[1])} + ${par(xs[2])} = ${neg(s)}, not ${neg(xs[3])}`], ['too large', 'the sum is not above the term']].filter(([v]) => v !== (s < xs[3] ? 'too small' : s > xs[3] ? 'too large' : 'right')), `${neg(xs[1])} + ${par(xs[2])} = ${neg(s)} against ${neg(xs[3])}.`); } },
        ] },
      { say: 'Try 2 × last + previous on one step.', why: 'It is the most common weighted rule. One multiplication and one addition test it.',
        checks: [
          { make: (rng) => { const p = plain(rng), xs = p.xs; return num(`${seq(xs.slice(0, 6))}: what is ${ev(2, 1, 0, xs[3], xs[2])}?`, 2 * xs[3] + xs[2], `${ev(2, 1, 0, xs[3], xs[2])} = ${neg(2 * xs[3] + xs[2])}, ${2 * xs[3] + xs[2] === xs[4] ? 'which matches' : 'which does not match'} ${neg(xs[4])}.`); } },
        ] },
      { say: 'If it misses, try last + 2 × previous, then 3 × last + previous and last + 3 × previous.', why: 'Test writers use a handful of small pairs. Trying them in order is faster than solving for the weights.',
        checks: [
          { make: (rng) => { const p = plain(rng), xs = p.xs; return num(`${seq(xs.slice(0, 6))}: what is ${ev(1, 2, 0, xs[3], xs[2])}?`, xs[3] + 2 * xs[2], `${ev(1, 2, 0, xs[3], xs[2])} = ${neg(xs[3] + 2 * xs[2])}, ${xs[3] + 2 * xs[2] === xs[4] ? 'which matches' : 'which does not match'} ${neg(xs[4])}.`); } },
        ] },
      { answers: 'ratio', say: 'Keep the pair that fits two steps, then check it on every other step.', why: 'Two unknown weights are pinned down by two equations; every further step is a free check against coincidence.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), p = plain(rng), xs = p.xs.slice(0, 6); if (!yes) xs[5] += rng.pick([1, 2, -1]); return pick(rng, `Does ${name(p.p, p.q)} fit every step of ${seq(xs)}?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every step matches' : `${ev(p.p, p.q, 0, xs[4], xs[3])} = ${neg(at(p.p, p.q, 0, xs, 5))}, not ${neg(xs[5])}`]], `Steps: ${xs.slice(2).map((v, i) => `${neg(at(p.p, p.q, 0, xs, i + 2))} vs ${neg(v)}`).join('; ')}.`); } },
        ] },
      { answers: 'swap', say: 'Next = p × last + q × previous, with each weight on its own term.', why: 'Swapping the weights changes the answer; confirm which term carries the bigger weight on a shown step.',
        checks: [
          { make: (rng) => { const p = plain(rng), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `${name(p.p, p.q)}: ${ev(p.p, p.q, 0, xs[5], xs[4])} = ${neg(xs[6])}.`, ['Rule out the plain sum, then try the common pairs.', 'Weights on the right terms.']); } },
        ] },
      { say: 'If a pair fits up to a constant, the leftover (term − weighted sum) is the same c on every step: add it.', why: 'The same idea as a constant miss in the sum-plus-constant lesson, applied to a weighted sum.',
        checks: [
          { make: (rng) => { const p = draw(rng, 5), xs = p.xs; return num(nextQ(xs.slice(0, 7)), xs[7], `${name(p.p, p.q)} misses by ${sgn(p.c)} on every step: ${ev(p.p, p.q, p.c, xs[6], xs[5])} = ${neg(xs[7])}.`, ['Find the pair that fits up to a constant.', 'The leftover is the same on every step: add it.']); } },
        ] },
    ] },
    { type: 'explain', prompt: 'Why do two shown steps fix the weights, and why does the ratio drift instead of staying constant?', model: 'The rule has two unknowns, p and q, and each shown step gives one equation p × a(n − 1) + q × a(n − 2) = a(n), so two steps pin them down and the rest are checks. The ratio a(n)/a(n − 1) = p + q × a(n − 2)/a(n − 1) depends on the previous ratio, so it keeps adjusting and only settles in the long run.', points: ['Two unknown weights need two equations: two steps', 'Extra steps are checks against coincidence', 'The ratio depends on the previous ratio, so it drifts before settling'] },

    S('worked'),
    { type: 'worked', family: 'weighted-two-term', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'Weights (2, 1) or (1, 2). Rule out the plain sum first.' },
    { type: 'worked', family: 'weighted-two-term', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'Larger or negative weights. The pair is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? The rule is last + 2 × previous. Will the next term be above or below 2 × ${PRED[5]} = ${2 * PRED[5]}? Then give it.`, answer: `${PRED[6] > 2 * PRED[5] ? 'Above' : 'Below'}: ${PRED[5]} + 2 × ${PRED[4]} = ${PRED[6]}.`, explain: `Weights (1, 2) settle at ratio ${round2(settle(1, 2))}, so the terms roughly double, alternately just above and just below.` },

    S('traps'),
    { type: 'traps', family: 'weighted-two-term', section: 'nl', extra: [
      { belief: 'The ratio is about 2.4, so multiply by 2.4.', fix: 'The ratio drifts; only the weighted rule gives whole numbers that match every step.' },
      { belief: 'The weights can go on either term.', fix: '2 × last + previous and last + 2 × previous are different rules. Test the order on a shown step.' },
      { belief: 'One matching step fixes the weights.', fix: 'Two unknowns need two steps; check a third.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `The plain sum is too small: ${ERR[2]} + ${ERR[3]} = ${ERR[2] + ERR[3]}, not ${ERR[4]}.`,
      `One weight is 2: 2 × ${ERR[3]} + ${ERR[2]} = ${ERR[4]}, and 2 × ${ERR[4]} + ${ERR[3]} = ${ERR[5]}.`,
      `Next = ${ERR[5]} + 2 × ${ERR[4]} = ${ERR[5] + 2 * ERR[4]}.`,
      `Answer: ${ERR[5] + 2 * ERR[4]}.`,
    ], errorStep: 2, explain: `The weight 2 belongs on the **last** term, as the checks in the step before showed: 2 × ${ERR[5]} + ${ERR[4]} = ${ERR[6]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), xs = p.xs, n = p.n, a = xs[n - 1], b = xs[n - 2]; const w = [[p.q * a + p.p * b + p.c, 'swapped the weights: the bigger weight goes on the term shown in the rule'], [p.p * a + p.c, `dropped the previous term: ${p.p} × last alone misses the ${neg(p.q)} × previous part`], [a + b + p.c, 'used the plain sum; the shown steps rule it out']]; if (p.c) w.unshift([p.p * a + p.q * b, `found the weights but forgot the constant ${sgn(p.c)}`]); return pick(rng, nextQ(xs.slice(0, n)), xs[n], w, `${name(p.p, p.q)}${plusC(p.c)}: ${neg(xs[n])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Order of tests: plain sum (one addition), then (2, 1), (1, 2), (3, 1), (1, 3). Use the late ratio from the table above to jump straight to the likely pair. Test on the last step first, then one earlier step.' },
    { type: 'check', scope: 'the order of tests', questions: [
      { make: (rng) => { const p = draw(rng, 4), xs = p.xs; return num(nextQ(xs.slice(0, 6)), xs[6], `${name(p.p, p.q)}: ${ev(p.p, p.q, 0, xs[5], xs[4])} = ${neg(xs[6])}.`, ['Read the late ratio to guess the pair.', 'Check the pair on two steps, then apply it.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: `A negative weight such as 3 × last − previous grows more slowly than its big weight suggests (ratio near ${round2(settle(3, -1))}). Growth that is slower than the weights suggest points to a negative weight.` },
    { type: 'thinkaloud', problem: nextQ(E1.slice(0, 6)), lines: [
      { t: 0, say: `Ratios near 2: ${E1.slice(1, 6).map((v, i) => round2(v / E1[i])).join(', ')}.` },
      { t: 3, say: `So double the last term: 2 × ${E1[5]} = ${2 * E1[5]}.`, slip: true },
      { t: 7, say: `Check a shown step: 2 × ${E1[4]} = ${2 * E1[4]}, not ${E1[5]}. The ratio drifts, so no single multiplier works.` },
      { t: 12, say: `Plain sum: ${E1[3]} + ${E1[4]} = ${E1[3] + E1[4]}, far below ${E1[5]}. A weight is needed.` },
      { t: 17, say: `2 × last + previous: 2 × ${E1[4]} + ${E1[3]} = ${2 * E1[4] + E1[3]}. No. Last + 2 × previous: ${E1[4]} + 2 × ${E1[3]} = ${E1[5]}. Yes.` },
      { t: 23, say: `Second step: ${E1[3]} + 2 × ${E1[2]} = ${E1[4]}. Confirmed.` },
      { t: 28, say: `Next: ${E1[5]} + 2 × ${E1[4]} = ${E1[6]}. The doubling guess was off by ${2 * E1[5] - E1[6]}. Answer ${E1[6]}.` },
    ] },
    { type: 'check', scope: 'a negative weight, and the think-aloud', questions: [
      { type: 'choice', q: 'A rule with weight 3 on the last term grows only about × 2.6 per step. What does that point to?', options: ['a negative weight: 3 × last − previous', 'the weights (3, 1) on last and previous', 'a plain two-term sum of neighbours'], answer: 0, traps: { 1: '(3, 1) grows faster, near 3.3', 2: 'a plain sum grows near 1.6' }, explain: 'Growth slower than the big weight suggests points to a negative weight.' },
      { type: 'choice', q: 'In the think-aloud, the first try doubled 75 to get 150. What showed it was wrong?', options: ['2 × 37 = 74, not 75', 'the ratios were exactly 2', 'the plain sum fit'], answer: 0, traps: { 1: 'the ratios drift: 1.8, 2.11, 1.95', 2: '19 + 37 = 56, far below 75' }, explain: 'A shown step broke the doubling. Last + 2 × previous fits: 149.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Plain sum is off and the ratio drifts → test p × last + q × previous for small pairs; the pair that fits two steps (plus any constant leftover) gives the next term.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Rule', 'Next'], rows: [
      [seq(fibl(2, 5, 6)), 'last + previous (Fibonacci)', String(fibl(2, 5, 7)[6])],
      [seq(E1.slice(0, 6)), name(1, 2), String(E1[6])],
      [seq(E2.slice(0, 6)), name(3, 1), String(E2[6])],
      [seq(affine(2, 2, 3, 6)), '2 × last + 3 (one previous term)', String(affine(2, 2, 3, 7)[6])],
      [seq(geo(3, 2, 6)), '× 2 exactly', String(geo(3, 2, 7)[6])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 5))}, ? (${name(2, 1)}, next ${CH[5]})`, rows: [
      { change: 'Swap the weights: last + 2 × previous, same start', effect: `${seq(wt(1, 2, 0, CH.slice(0, 2), 5))}: next ${wt(1, 2, 0, CH.slice(0, 2), 6)[5]}.` },
      { change: 'Add 1 after every weighted sum', effect: `${seq(wt(2, 1, 1, CH.slice(0, 2), 5))}: every step gains 1 and it compounds, next ${wt(2, 1, 1, CH.slice(0, 2), 6)[5]}.` },
      { change: 'Weights 3 and 1 instead', effect: `${seq(wt(3, 1, 0, CH.slice(0, 2), 5))}: faster growth (ratio near ${round2(settle(3, 1))}), next ${wt(3, 1, 0, CH.slice(0, 2), 6)[5]}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the last two terms and the weights are the same, so the next is still ${CH[5]}. With fewer steps shown, check the weights more carefully.` },
      { change: 'Swap the weights and add 1 after every sum', fusion: true, effect: `The swap changes which term carries the 2, and the +1 compounds on top: ${seq(wt(1, 2, 1, CH.slice(0, 2), 5))}, next ${wt(1, 2, 1, CH.slice(0, 2), 6)[5]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a negative weight (${seq(E3.slice(0, 6))} is ${name(3, -1)}); equal weights (2, 2); and a constant on top (${seq(E4.slice(0, 5))} is ${name(2, 1)}${plusC(E4c)}). The small first terms can fit several pairs, so test the pairs on the later steps.` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const s = [rng.int(1, 4), rng.int(5, 8)]; const xs = t === 0 ? fibl(...s, 6) : t === 1 ? wt(2, 1, 0, s, 6) : affine(rng.int(1, 5), 2, rng.int(1, 5), 6); const names = ['last + previous', '2 × last + previous', '2 × last + a constant']; const fit = (i) => (i === 0 ? xs[3] + xs[4] : i === 1 ? 2 * xs[4] + xs[3] : 2 * xs[4] + (xs[1] - 2 * xs[0])); return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, `on the last step it gives ${fit(i)}, not ${xs[5]}`]).filter((_, i) => i !== t), `Test each rule on the last step: only "${names[t]}" gives ${xs[5]}.`); } },
    ] },

    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: ${seq(wt(2, 1, 0, [1, 2], 6))} (2 × last + previous) are the Pell numbers, and neighbouring ratios approach 1 + √2. Any quantity driven by its last two values with fixed weights, like a smoothed signal, follows the same test: fit two weights on two steps, check the rest.` },
    { type: 'transfer',
      near: { make: (rng) => { const p = plain(rng), xs = p.xs; return num(`Each year a colony's size is built from the last two years with small whole-number weights: ${seq(xs.slice(0, 6))}. What is next year's size?`, xs[6], `${name(p.p, p.q)}: ${ev(p.p, p.q, 0, xs[5], xs[4])} = ${neg(xs[6])}.`, ['Rule out the plain sum.', 'Try (2, 1), (1, 2), (3, 1), (1, 3) on two steps.']); } },
      far: { type: 'number', q: `The fractions ${PELL2.slice(0, 4).map((v, i) => `${v}/${PELLD[i]}`).join(', ')} get closer and closer to √2. Their numerators ${seq(PELL2.slice(0, 4))} follow one weighted rule. What is the next numerator?`, answer: PELL2[4], explain: `2 × ${PELL2[2]} + ${PELL2[1]} = ${PELL2[3]}, and 2 × ${PELL2[3]} + ${PELL2[2]} = ${PELL2[4]}: 2 × last + previous.`, hints: ['The plain sum is too small.', 'Try 2 × last + previous.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the √2 fractions?', options: ['Two shown steps fix two unknown weights', 'The ratio of neighbours is exactly constant', 'Each term is the plain sum of the two before', 'A fixed constant is added at every step'], answer: 0, traps: { 1: `the ratios ${PELL2.slice(1, 4).map((v, i) => (v / PELL2[i]).toFixed(2)).join(', ')} drift`, 2: `${PELL2[1]} + ${PELL2[2]} is not ${PELL2[3]}`, 3: `the leftovers after doubling, ${seq(PELL2.slice(1, 4).map((v, i) => v - 2 * PELL2[i]))}, change` }, explain: 'The numerators follow 2 × last + previous: two weights, pinned down by two steps, exactly as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'weighted-two-term', section: 'nl', count: 3 },
  ],
};
