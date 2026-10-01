// Likelihood List family: coin-sequence statements (no picture). n fair flips = 2^n equally likely
// strings. Count the strings that AVOID a pattern: avoiding HT leaves n + 1 strings, avoiding HH
// leaves a Fibonacci number, so HT turns up far more often although both have chance 1/4 at a spot.
import { S, LL, dp, mc, rank, again, C } from './compare-without-computing.js';

const fib = (n) => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };
const noRun = (n, k) => { let st = Array(k).fill(0); st[0] = 1; for (let i = 0; i < n; i++) { const nx = Array(k).fill(0); nx[0] = st.reduce((a, b) => a + b, 0); for (let r = 0; r < k - 1; r++) nx[r + 1] += st[r]; st = nx; } return st.reduce((a, b) => a + b, 0); };
const strings = (n) => Array.from({ length: 2 ** n }, (_, m) => Array.from({ length: n }, (_, i) => ((m >> (n - 1 - i)) & 1 ? 'T' : 'H')).join(''));
const P = {
  HT: (n) => (2 ** n - (n + 1)) / 2 ** n,
  HH: (n) => (2 ** n - fib(n + 2)) / 2 ** n,
  HHH: (n) => (2 ** n - noRun(n, 3)) / 2 ** n,
  exact: (n, k) => C(n, k) / 2 ** n,
  alt: (n) => 2 / 2 ** n,
  first: (j) => 1 / 2 ** j,
  more: (n) => (1 - (n % 2 ? 0 : C(n, n / 2)) / 2 ** n) / 2,
};
const S4 = strings(4);
const cellOf = (i) => [Math.floor(i / 4), i % 4];
const CH = [['(a) HT appears', P.HT(5), `${2 ** 5 - (5 + 1)}/32`], ['(b) HH appears', P.HH(5), `${2 ** 5 - fib(7)}/32`], ['(c) exactly 3 heads', P.exact(5, 3), `${C(5, 3)}/32`]].sort((a, b) => b[1] - a[1]);

// Think-aloud: HH in 4 flips (exactly 1/2), more heads than tails in 6, first head on flip 2.
if (!(P.HH(4) === 0.5 && P.more(6) > P.first(2) && P.HHH(5) < P.exact(5, 3) && P.HH(8) > P.HT(4) && P.HT(4) > P.exact(5, 3))) throw new Error('coin-patterns: prose orders no longer hold');

// Transfer: near = up/down days; far = two sixes in a row (avoiders follow a(n) = 5a(n − 1) + 5a(n − 2)).
const nearT = (rng) => again(() => { const n = rng.int(4, 8), k = rng.int(1, n - 1);
  return rank(rng, `A desk logs each trading day as Up (U) or Down (D), each with probability 1/2, independently. Over ${n} days, rank from most to least likely.`, [[`UD appears somewhere in the ${n}-day log.`, P.HT(n)], [`UU appears somewhere in the ${n}-day log.`, P.HH(n)], [`Exactly ${k} up days.`, P.exact(n, k)]], `Avoiders: ${n + 1} for UD, ${fib(n + 2)} for UU, out of ${2 ** n}. Exactly ${k}: C(${n}, ${k}) = ${C(n, k)}.`, { gap: 0.02 }); });
const noSixSix = (n) => { let a = 1, b = 6; for (let i = 1; i < n; i++) [a, b] = [b, 5 * b + 5 * a]; return b; };
const farT = (rng) => { const n = rng.int(3, 5), v = 1 - noSixSix(n) / 6 ** n;
  return { type: 'number', q: `A die is rolled ${n} times. P(two sixes in a row appear somewhere)? (3 decimals)`, answer: v, tolerance: 0.0015, hints: ['Count the roll sequences that never have a six followed by a six.', 'a(n) = 5 × a(n − 1) + 5 × a(n − 2), with a(1) = 6 and a(2) = 35: end on a non-six, or on a non-six then a six.'], explain: `${noSixSix(n)} of ${6 ** n} sequences avoid it: 1 − ${noSixSix(n)}/${6 ** n} = ${dp(v)}.` }; };

// Pool for the ranking checks.
const POOL = {
  HT: (r) => { const n = r.int(4, 8); return [`HT appears somewhere in ${n} flips.`, P.HT(n)]; },
  HH: (r) => { const n = r.int(4, 8); return [`HH appears somewhere in ${n} flips.`, P.HH(n)]; },
  HHH: (r) => { const n = r.int(5, 9); return [`HHH appears somewhere in ${n} flips.`, P.HHH(n)]; },
  exact: (r) => { const n = r.int(4, 8), k = r.int(1, n - 1); return [`Exactly ${k} heads in ${n} flips.`, P.exact(n, k)]; },
  alt: (r) => { const n = r.int(3, 6); return [`${n} flips alternate perfectly.`, P.alt(n)]; },
  first: (r) => { const j = r.int(1, 4); return [`The first head comes on flip ${j}.`, P.first(j)]; },
  more: (r) => { const n = r.pick([4, 6, 8]); return [`Strictly more heads than tails in ${n} flips.`, P.more(n)]; },
};

export default {
  id: 'll/coin-patterns',
  book: 'll',
  kind: 'family',
  family: 'coin-patterns',
  title: 'Coin-sequence statements',
  summary: 'Count strings that avoid the pattern: HT is avoided by n + 1 strings, HH by a Fibonacci number, so HT appears far more often.',
  prerequisites: ['bto/coin-sequences', 'prob/complement'],
  objectives: [
    'Price "pattern appears somewhere in n flips" by counting the strings that avoid it',
    'Count HT-avoiders (n + 1) and HH-avoiders (Fibonacci) and explain the difference',
    'Handle exact counts, alternation, first head and "more heads than tails" in one line each',
    'Rank a mixed triple without enumerating strings',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: a fair coin is flipped 5 times. Rank: (a) HT appears somewhere in the string, (b) HH appears somewhere, (c) exactly 3 heads. Two approaches, then an order.', answer: CH.map(([t, p, x]) => `${t} ${x} ≈ ${dp(p)}`).join(' > '), explain: `HH and HT each have chance 1/4 at any given pair of spots, so many people call (a) and (b) equal. They are not: after a miss, HT can restart at once, HH cannot. Count the strings that avoid each pattern: ${5 + 1} avoid HT, ${fib(7)} avoid HH.`,
      attempts: [
        { id: 'half', label: 'Exactly 3 is about half', approach: 'You put (c) near 1/2 because 3 heads is close to the middle of 5.', breaksAt: `Exactly 3 is one head count among six: C(5, 3) = ${C(5, 3)} of 32 strings.` },
        { id: 'addspots', label: 'Add the chance per spot', approach: 'You priced (a) as 4 × 1/4 = 1, one chance for each place the pattern could start.', breaksAt: 'Adding spots counts strings with several HTs more than once; count the strings that avoid HT instead.' },
        { id: 'samespot', label: 'HH and HT are a tie', approach: 'You gave (a) and (b) the same value: each pattern has chance 1/4 at any pair of spots.', breaksAt: 'Equal at a fixed spot is not equal somewhere: after a miss HT restarts at once, HH must start over.' },
      ] },
    { type: 'text', text: 'There is **no picture**: statements about a fixed number of fair flips. Some ask whether a pattern (HH, HT, HHH) **appears somewhere**; others ask for exactly k heads, perfect alternation, the first head on flip j, or more heads than tails.' },
    { type: 'text', text: 'Not this lesson: flipping **until** a pattern appears (waiting times in Beat the Odds) and large samples of flips (proportions and the law of large numbers). Here n is small and fixed, and every string of n flips is equally likely.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'How many equally likely strings does 6 flips of a fair coin produce?', `${2 ** 6}`, [['12', 'added 2 per flip instead of multiplying'], ['36', 'squared 6 as if two dice'], ['7', 'counted the possible numbers of heads, which are not equally likely']], 'Each flip doubles the count: 2^6.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Pattern statements hide an asymmetry that intuition misses: two patterns with the same chance at any fixed spot are not equally likely to show up somewhere. Items pair HH with HT on purpose. The fix is a counting habit: count what avoids the pattern, since "appears somewhere" has too many cases to count directly. The same habit prices HHH and longer runs, where the avoider counts follow a similar recursion.' },

    S('anchor'),
    { type: 'text', text: 'You know the complement: "at least one" = 1 − "none". "HT appears somewhere" is "at least one HT", so count the strings with **no** HT. The one change: "none" is a pattern constraint on the whole string, so it needs a small counting argument instead of a product.' },
    { type: 'check', scope: 'complement of "appears somewhere"', questions: [
      { make: (rng) => { const n = rng.int(4, 8), a = rng.int(2, n + 3); return { type: 'number', q: `In ${n} flips, ${a} strings avoid some pattern. P(the pattern appears somewhere)? (3 decimals)`, answer: 1 - a / 2 ** n, tolerance: 0.0015, hints: [`There are ${2 ** n} strings.`, 'Subtract the avoiders, divide.'], explain: `1 − ${a}/${2 ** n} = ${dp(1 - a / 2 ** n)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'All 16 strings of 4 flips. First, the strings that contain HH somewhere.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 4, cols: 4, rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''], cellText: [0, 1, 2, 3].map((r) => S4.slice(4 * r, 4 * r + 4)), highlight: S4.map((s, i) => (s.includes('HH') ? cellOf(i) : null)).filter(Boolean), count: S4.filter((s) => s.includes('HH')).length }, caption: `${S4.filter((s) => s.includes('HH')).length} of 16 contain HH; ${fib(6)} avoid it.` },
    { type: 'check', scope: 'strings containing HH', questions: [
      mc(null, 'Which 4-flip string avoids HH?', 'HTHT', [['THHT', 'the middle two flips are HH'], ['HHTT', 'starts with HH'], ['TTHH', 'ends with HH']], 'In HTHT every H is followed by T or ends the string.', { at: 2 }),
    ] },
    { type: 'text', text: 'The same 16 strings, now marking the ones that contain HT.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 4, cols: 4, rowLabels: ['', '', '', ''], colLabels: ['', '', '', ''], cellText: [0, 1, 2, 3].map((r) => S4.slice(4 * r, 4 * r + 4)), highlight: S4.map((s, i) => (s.includes('HT') ? cellOf(i) : null)).filter(Boolean), count: S4.filter((s) => s.includes('HT')).length }, caption: `${S4.filter((s) => s.includes('HT')).length} of 16 contain HT; only ${4 + 1} avoid it: ${S4.filter((s) => !s.includes('HT')).join(', ')}, all tails then all heads.` },
    { type: 'check', scope: 'strings avoiding HT', questions: [
      { make: (rng) => { const n = rng.int(3, 8); return { type: 'number', q: `How many strings of ${n} flips contain no HT?`, answer: n + 1, hints: ['Once an H appears, can a T ever follow it?', 'The string is some tails, then some heads.'], explain: `T…TH…H with the switch at one of ${n + 1} places (including all T and all H): ${n + 1}.` }; } },
    ] },
    { type: 'text', text: `As n grows, the gap opens: n + 1 grows by one per flip, the Fibonacci count by a factor of about ${dp((1 + Math.sqrt(5)) / 2, 1)} per flip. That is why the curves below pull apart.` },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 2, max: 10, label: 'flips n' }, y: { min: 0, max: 1, label: 'P(pattern appears)' }, curves: [{ label: 'HT', points: Array.from({ length: 9 }, (_, i) => [i + 2, P.HT(i + 2)]) }, { label: 'HH', points: Array.from({ length: 9 }, (_, i) => [i + 2, P.HH(i + 2)]) }, { label: 'HHH', points: Array.from({ length: 9 }, (_, i) => [i + 2, P.HHH(i + 2)]) }] }, caption: `At n = 2 HH and HT tie at 1/4. By n = 6: HT ${dp(P.HT(6))}, HH ${dp(P.HH(6))}, HHH ${dp(P.HHH(6))}.` },
    { type: 'check', scope: 'the gap between HT and HH', questions: [
      { make: (rng) => { const n = rng.int(3, 8); return mc(rng, `In ${n} flips, which is more likely to appear somewhere: HH or HT?`, 'HT', [['HH', 'reversed: HH is the pattern that needs a clean restart'], ['equally likely', 'matched the chance at one fixed spot (1/4) and stopped']], `HT ${dp(P.HT(n))} against HH ${dp(P.HH(n))}.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves: the base count, the two avoider counts, and the comparison that ranks them. Each count is short enough to redo from scratch in the exam.' },
    { type: 'steps', steps: [
      { answers: 'half', say: 'n fair flips give 2^n equally likely strings; every statement is (strings that qualify) / 2^n. Exactly k heads: choose the k head positions, C(n, k).', why: 'Each flip doubles the strings, and a string is fixed once you say where the heads are.',
        checks: [{ make: (rng) => { const n = rng.int(4, 8), k = rng.int(1, n - 1); return { type: 'number', q: `P(exactly ${k} heads in ${n} flips)? (3 decimals)`, answer: P.exact(n, k), tolerance: 0.0015, hints: [`C(${n}, ${k}) strings.`, `Divide by ${2 ** n}.`], explain: `${C(n, k)}/${2 ** n} = ${dp(P.exact(n, k))}.` }; } }] },
      { answers: 'addspots', say: 'Avoid HT: after the first H, every flip must be H (a T would make HT). So the string is T…TH…H, fixed by where the heads start: n + 1 strings.', why: 'The first H can sit at any of n spots, or not appear at all.',
        checks: [{ make: (rng) => { const n = rng.int(4, 9); return { type: 'number', q: `P(HT appears somewhere in ${n} flips)? (3 decimals)`, answer: P.HT(n), tolerance: 0.0015, hints: [`${n + 1} strings avoid HT.`], explain: `1 − ${n + 1}/${2 ** n} = ${dp(P.HT(n))}.` }; } }] },
      { say: 'Avoid HH: split on the first flip. T, then any HH-avoider of length n − 1; or H, which must be followed by T, then any avoider of length n − 2. So a(n) = a(n − 1) + a(n − 2): Fibonacci, a(n) = F(n + 2).', why: 'Every H has to be followed by T (or end the string), which ties each length to the two before it.',
        checks: [{ make: (rng) => { const n = rng.int(3, 8); return { type: 'number', q: `How many strings of ${n} flips contain no HH? (a(1) = 2, a(2) = 3)`, answer: fib(n + 2), hints: ['a(n) = a(n − 1) + a(n − 2).', 'Build up: 2, 3, 5, 8, …'], explain: `a(${n}) = ${fib(n + 2)}.` }; } }] },
      { answers: 'samespot', say: 'Compare: n + 1 strings avoid HT, F(n + 2) avoid HH, and F grows much faster. So HT appears far more often, although each pattern has chance 1/4 at any fixed spot.', why: 'After an H that fails (HT when you wanted HH), HH must restart from scratch; after a T that fails, HT just needs an H and is halfway there.',
        checks: [{ hinge: true, make: (rng) => { const n = rng.int(4, 8); return mc(rng, `Why is "HT somewhere in ${n} flips" more likely than "HH somewhere"?`, 'Fewer strings avoid HT than avoid HH', [['HT has a higher chance at each pair of spots', 'both have exactly 1/4 at any fixed pair'], ['Heads are more likely after tails', 'flips are independent: the coin has no memory'], ['HT can overlap with itself', 'reversed: HH overlaps with itself (HHH holds two), which is exactly why it appears in fewer strings']], `${n + 1} avoid HT against ${fib(n + 2)} avoiding HH.`); } }] },
    ] },
    { type: 'explain', prompt: 'Explain why HT appears somewhere in 6 flips more often than HH, even though P(HT at flips 1-2) = P(HH at flips 1-2) = 1/4.', model: `Appearing somewhere is about the strings that never contain the pattern. To avoid HT the string must be all its tails first and all its heads after: only ${6 + 1} strings of 64. To avoid HH it only needs every head followed by a tail, which ${fib(8)} strings manage. Fewer avoiders means the pattern appears more often: HT in ${64 - 7} strings, HH in ${64 - fib(8)}.`, points: ['"Somewhere" = 1 − (avoiders)/2^n', 'HT-avoiders are forced into T…TH…H: n + 1', 'HH-avoiders grow like Fibonacci, so HH appears less'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'coin-patterns', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Exact counts, first head, alternation, more heads. One line each. Try it first.' },
    { type: 'worked', section: 'll', family: 'coin-patterns', difficulty: 4, seed: 'b', fade: 1, intro: 'HH, HT and HHH somewhere. The avoider counts are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: 'In 6 flips, is HH or HT more likely to appear somewhere?', answer: `HT: 1 − ${6 + 1}/64 ≈ ${dp(P.HT(6), 2)} against HH: 1 − ${fib(8)}/64 ≈ ${dp(P.HH(6), 2)}.`, explain: 'Fewer strings avoid HT.' },

    S('traps'),
    { type: 'text', text: 'The traps mix up "at a fixed spot" with "somewhere", count positions instead of strings, or forget ties in "more heads than tails". Each one is a single wrong belief; name it and the count comes out right.' },
    { type: 'traps', section: 'll', family: 'coin-patterns', extra: [
      { belief: 'HH and HT are equally likely to appear somewhere.', fix: 'Equal at a fixed spot (1/4) but not somewhere: count avoiders, n + 1 against F(n + 2).' },
      { belief: 'P(HT somewhere in n flips) = (n − 1) × 1/4.', fix: 'Adding spots double-counts strings with several HTs and can pass 1. Use the complement.' },
      { belief: 'More heads than tails in an even number of flips is 1/2.', fix: 'Ties take probability: (1 − P(tie))/2, below 1/2.' },
      { belief: 'A perfectly alternating string is rarer than any other specific string.', fix: 'Every specific string has 1/2^n; "alternates" has two strings, so 2/2^n.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(HH appears somewhere in 5 flips). One step is wrong.', steps: [
      'There are 32 equally likely strings.',
      'HH can start at flip 1, 2, 3 or 4, and each start has chance 1/4.',
      'So P = 4 × 1/4 = 1: HH is certain.',
      'It ranks above any other statement.',
    ], errorStep: 2, explain: `Adding the four chances counts strings with two or more HH several times (HHHHH counts four times). Count the avoiders instead: ${fib(7)} strings, so P = 1 − ${fib(7)}/32 = ${dp(P.HH(5))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { make: (rng) => { const n = rng.pick([4, 6, 8]); return mc(rng, `P(strictly more heads than tails in ${n} flips)?`, dp(P.more(n)), [['0.500', 'forgot that ties take part of the probability'], [dp(C(n, n / 2) / 2 ** n), 'answered P(a tie)'], [dp(1 - P.more(n)), 'answered "at least as many heads", which includes ties']], `(1 − C(${n},${n / 2})/${2 ** n})/2 = ${dp(P.more(n))}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise the HH-avoider counts a(n) = ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => fib(n + 2)).join(', ')} for n = 1 to 8, and HT-avoiders n + 1. Then "somewhere" is one subtraction.` },
    { type: 'callout', tone: 'speed', text: `Single-line values: exactly k heads C(n, k)/2^n; alternates 2/2^n; first head on flip j is 1/2^j; more heads than tails (1 − P(tie))/2. Budget: ${LL.exam.perItemSeconds} seconds; none of these needs enumeration.` },
    { type: 'check', scope: 'the recall values', questions: [
      { make: (rng) => again(() => { const keys = rng.shuffle(Object.keys(POOL)).slice(0, 3); return rank(rng, 'A fair coin. Rank from most to least likely.', keys.map((k) => POOL[k](rng)), 'Avoider counts for patterns, one-line formulas for the rest.', { gap: 0.02 }); }) },
    ] },

    { type: 'thinkaloud', problem: 'A fair coin. Rank: (a) HH appears somewhere in 4 flips, (b) strictly more heads than tails in 6 flips, (c) the first head comes on flip 2.', lines: [
      { t: 0, say: 'Coin strings, no picture: one count per statement.' },
      { t: 5, say: `(a) HH in 4 flips: ${fib(6)} strings avoid it, so 1 − ${fib(6)}/16 = ${dp(P.HH(4), 2)}.` },
      { t: 12, say: '(b) more heads than tails: heads and tails are symmetric, so 1/2. A tie with (a).', slip: true },
      { t: 17, say: `No: 6 is even, so ties take ${C(6, 3)}/64. (1 − ${C(6, 3)}/64)/2 = ${dp(P.more(6))}, well below 1/2.` },
      { t: 24, say: '(c) first head on flip 2: a tail, then a head, 1/4.' },
      { t: 28, say: `Order (a) > (b) > (c), with ${LL.exam.perItemSeconds - 28} seconds left.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine on fresh statements', questions: [
      { make: (rng) => again(() => rank(rng, 'A fair coin. Rank from most to least likely.', [POOL.more(rng), POOL.HH(rng), POOL[rng.pick(['first', 'alt', 'exact', 'HT', 'HHH'])](rng)], 'Ties for "more heads" with an even n; avoider counts for patterns; one-line counts for the rest.', { gap: 0.02 })) },
    ] },

    S('rule'),
    { type: 'text', text: 'One habit covers the family: for "somewhere", count what avoids it; for everything else, write the one-line count. Never add chances over positions.' },
    { type: 'callout', tone: 'rule', text: 'Coin strings → 2^n strings. "Pattern somewhere" = 1 − avoiders/2^n; HT-avoiders n + 1, HH-avoiders F(n + 2). Exactly k: C(n, k); more heads: (1 − tie)/2.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Count of strings', 'Probability'], rows: [
      ['HT somewhere in n', `2^n − (n + 1)`, '1 − (n + 1)/2^n'],
      ['HH somewhere in n', '2^n − F(n + 2)', '1 − F(n + 2)/2^n'],
      ['HT at flips 1-2', '2^(n−2)', '1/4'],
      ['exactly k heads', 'C(n, k)', 'C(n, k)/2^n'],
      ['alternates perfectly', '2', '2/2^n'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: with 2 flips HH and HT are both exactly 1/4; the gap only appears from 3 flips on. More heads than tails with an odd number of flips is exactly 1/2 (no ties possible).' },
    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: waiting for a pattern (HH takes ${2 ** 2 + 2} flips on average, HT only ${2 ** 2}: the same overlap asymmetry), dice "all different" counts, and impossible statements from parity (heads minus tails always has the parity of n).` },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const n = rng.pick([3, 5, 7, 9]); return mc(rng, `P(strictly more heads than tails in ${n} flips)?`, '1/2', [[dp(P.more(n + 1)), `used the even-n formula; with ${n} flips a tie is impossible`], ['less than 1/2, because of ties', 'ties need an even number of flips'], ['more than 1/2', 'heads and tails are symmetric']], 'Odd n: no ties, and heads/tails symmetry splits the rest equally.'); } },
    ] },

    { type: 'variation', base: `Five flips: (a) HT somewhere ${2 ** 5 - 6}/32 > (b) HH somewhere ${2 ** 5 - fib(7)}/32 > (c) exactly 3 heads ${C(5, 3)}/32.`, rows: [
      { same: true, change: 'Swap heads and tails everywhere: TH, TT, exactly 3 tails', effect: 'No change. A fair coin is symmetric, so every string and its mirror image are equally likely.' },
      { change: 'Ask (b) for HHH instead of HH', effect: `${noRun(5, 3)} strings avoid HHH: 1 − ${noRun(5, 3)}/32 = ${dp(P.HHH(5))}. A longer run is harder to hit, and (b) drops to last.` },
      { change: 'Ask (a) for "HT at flips 1 and 2"', effect: 'A fixed spot is 1/4 exactly: the restart advantage only helps "somewhere", so (a) falls to last.' },
      { fusion: true, change: 'Ask (a) for HT in 4 flips and (b) for HH in 8 flips', effect: `Fewer flips pull HT down (${dp(P.HT(4))}), more flips push HH up (${dp(P.HH(8))}). Together HH overtakes: the HT advantage holds only at equal length.` },
    ] },
    { type: 'transfer',
      near: { make: nearT },
      far: { make: farT },
      principle: mc(null, 'Which idea carried over from coin strings to the dice rolls?', 'Count the sequences that avoid the pattern, then take 1 minus', [
        ['Add the chance of the pattern at each starting position', 'adding spots counts sequences with several hits more than once'],
        ['Two patterns with equal chance at one spot are equally likely', 'equal at a fixed spot is not equal somewhere'],
        ['Multiply the chance of the pattern by the number of rolls', 'that is the same overcount as adding spots'],
      ], 'Sequences that never contain the pattern follow a short recursion, for coins and for dice alike.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'coin-patterns', count: 3 },
  ],
};
