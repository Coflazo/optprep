// Fair-coin sequences: 2^n equally likely strings, so every question is a count of strings.
// Head counts by choosing positions, ties by H/T symmetry, neighbour rules by recursion.
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

const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
// Strings of length n with no run of k heads: track the current head-run length.
const noRun = (n, k) => { let st = Array(k).fill(0); st[0] = 1; for (let i = 0; i < n; i++) { const tot = st.reduce((a, b) => a + b, 0); const nx = Array(k).fill(0); nx[0] = tot; for (let r = 0; r < k - 1; r++) nx[r + 1] += st[r]; st = nx; } return st.reduce((a, b) => a + b, 0); };
const noHH = (n) => noRun(n, 2);
const tie = (n) => (n % 2 ? 0 : C(n, n / 2));
const moreH = (n) => Q.of(2 ** n - tie(n), 2 ** (n + 1));
const d3 = (x) => (Math.round((x instanceof Q ? x.toNumber() : x) * 1000) / 1000).toFixed(3);
const ROW6 = [0, 1, 2, 3, 4, 5, 6];
const NS = [1, 2, 3, 4, 5, 6, 7, 8];
const strings3 = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
// Three-flip tree built from the strings, marking exactly two heads.
const tree3 = () => {
  const node = (pre) => (pre.length === 3 ? { p: '1/2', label: pre, mark: [...pre].filter((c) => c === 'H').length === 2 } : { p: '1/2', label: pre ? `${pre}…` : 'start', children: [node(`${pre}H`), node(`${pre}T`)] });
  return { root: { label: 'start', children: [node('H'), node('T')] }, total: fr(C(3, 2), 8) };
};

export default {
  id: 'bto/coin-sequences',
  book: 'bto',
  kind: 'family',
  family: 'coin-sequences',
  title: 'Coin sequences',
  summary: 'n fair flips = 2^n equally likely strings. Count strings: choose head positions, use H/T symmetry, recurse on neighbours.',
  prerequisites: ['prob/counting', 'bto/die-repeats'],
  objectives: [
    'Count the strings for "exactly k heads" with C(n, k) and divide by 2^n',
    'Answer "more heads than tails" with the symmetry (1 − P(tie))/2',
    'Count strings with no two heads in a row by the recursion a(n) = a(n − 1) + a(n − 2)',
    'Tell "k heads" from "k heads in a row" and name the wrong answers each produces',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you flip a fair coin 5 times. What is the probability of exactly 2 heads? Try two approaches.', answer: `${C(5, 2)}/32 = ${fr(C(5, 2), 32)}`, explain: `The two heads can sit in any 2 of the 5 positions: C(5,2) = ${C(5, 2)} strings of 32. If you got 1/32 you counted one string (HHTTT); if you got 1/6 you treated the six head counts 0 to 5 as equally likely.`, attempts: [
      { id: 'equal-counts', label: 'Six head counts, one each', approach: 'Head counts 0 to 5 are six possible results, so answered 1/6.', breaksAt: `Head counts are not equally likely: 0 heads is one string, 2 heads is ${C(5, 2)}.` },
      { id: 'one-string', label: 'Just the string HHTTT', approach: 'Wrote one string with two heads, HHTTT, and answered 1/32.', breaksAt: `The two heads can sit in any 2 of the 5 positions; HHTTT is one of ${C(5, 2)} such strings.` },
    ] },
    { type: 'text', text: 'A fair coin is flipped a **fixed** number of times, n, and the question is about the resulting string of H and T: how many heads, whether all flips agree, whether heads outnumber tails, whether two heads ever sit next to each other, whether a run of heads appears.' },
    { type: 'list', items: ['"A coin is flipped 6 times. What is the probability of exactly 3 heads?"', '"Three flips: what is the chance all three land the same way?"', '"Nine flips: probability of strictly more heads than tails?"', '"Ten flips: probability that no two consecutive flips are both heads?"'] },
    { type: 'text', text: 'Not this lesson: flipping **until** something happens (bto/first-success, bto/pattern-waiting) and biased coins in a series (bto/race-to-k). Here n is fixed and the coin is fair, so every string is equally likely.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Eight fair flips: probability of at least 3 heads in a row', 'Flip until HH appears: expected number of flips', 'Flip until the first head: probability it takes 4 flips', 'Best-of-5 series with a 60% team: probability it wins'], answer: 0, traps: { 1: 'flipping until a pattern: bto/pattern-waiting', 2: 'waiting for the first head: bto/first-success', 3: 'a series: bto/race-to-k' }, explain: 'Fixed n = 8, fair coin, a property of the string.' },
    ] },

    S('why'),
    { type: 'text', text: 'Coin strings are the cleanest counting problems in the section: every string has the same probability, so every answer is a count divided by 2^n. The skill is choosing the right way to count. Head counts, symmetry and neighbour rules each need a different tool, and the wrong tool gives a plausible wrong option every time. A reported past question ("three flips, all the same side") is the smallest case.' },

    S('anchor'),
    { type: 'text', text: 'You know one die thrown n times gives 6^n equally likely sequences (bto/die-repeats). A coin is the same with **one change**: 2 faces instead of 6, so there are 2^n equally likely strings, each with probability 1/2^n. A probability is therefore a count of strings.' },
    { type: 'check', scope: '2^n equally likely strings', questions: [
      { make: (rng) => { const n = rng.int(3, 8); return { type: 'number', q: `A coin is flipped ${n} times. How many equally likely H/T strings are there?`, answer: 2 ** n, hints: ['Each flip has 2 outcomes.', `Multiply 2 by itself ${n} times.`], explain: `2^${n} = ${2 ** n}.` }; } },
      { make: (rng) => { const n = rng.int(3, 5); return mc(rng, `${n} flips. P(all ${n} flips show the same side)?`, fr(2, 2 ** n), [[fr(1, 2 ** n), 'counted only all heads; all tails also qualifies'], [fr(n, 2 ** n), 'counted one string per flip'], ['1/2', 'only compared two flips']], `Two strings (all H, all T) of ${2 ** n}: ${fr(2, 2 ** n)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Three flips as a tree: 8 leaves, one per string, each reached with 1/2 × 1/2 × 1/2. The marked leaves have exactly two heads. Notice where the heads sit: the string is fixed by **which positions** hold the heads.' },
    { type: 'diagram', diagram: 'tree', spec: tree3(), caption: `Exactly two heads: HHT, HTH, THH. Three strings of eight, ${fr(C(3, 2), 8)}. Three = the number of ways to choose 2 positions out of 3, C(3,2).` },
    { type: 'check', scope: 'a string is fixed by its head positions', questions: [
      { make: (rng) => { const n = rng.int(4, 6); const k = rng.int(1, n - 1); return { type: 'number', q: `${n} flips. How many strings have exactly ${k} heads?`, answer: C(n, k), hints: [`A string is fixed by which ${k} of the ${n} positions are heads.`, `C(${n},${k}).`], explain: `C(${n},${k}) = ${C(n, k)}.` }; } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Six flips: strings per number of heads', xLabel: 'heads', yLabel: 'strings', categories: ROW6.map(String), series: [{ name: 'strings', values: ROW6.map((k) => C(6, k)) }], valueLabels: true }, caption: `A row of Pascal's triangle: ${ROW6.map((k) => C(6, k)).join(', ')}, adding to ${2 ** 6}. It is symmetric (k heads ↔ k tails) and peaks at the tie, 3 heads, with ${C(6, 3)} strings.` },
    { type: 'check', scope: 'the symmetric row and the tie', questions: [
      { type: 'choice', q: 'Six flips. P(strictly more heads than tails)?', options: [fr(2 ** 6 - C(6, 3), 2 ** 7), '1/2', fr(C(6, 3), 64), fr(2 ** 6 + C(6, 3), 2 ** 7)], answer: 0, traps: { 1: `ignored ties: 3 heads, 3 tails has ${C(6, 3)} strings`, 2: 'computed the tie', 3: 'counted ties as wins ("at least as many")' }, explain: `Take away the ${C(6, 3)} ties, split the other ${2 ** 6 - C(6, 3)} evenly: ${fr(2 ** 6 - C(6, 3), 2 ** 7)}.` },
    ] },
    { type: 'text', text: 'Neighbour rules need a different picture. Count the strings with **no two heads in a row** for growing n: every good string ends in T (anything good before it) or in TH (anything good before that). So each count is the sum of the two before it.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['flips n', ...NS.map(String)], rows: [['strings with no HH', ...NS.map((n) => String(noHH(n)))], ['all strings 2^n', ...NS.map((n) => String(2 ** n))]] }, caption: `${NS.slice(0, 5).map(noHH).join(', ')}, …: each entry is the sum of the two before it (Fibonacci numbers). The share of good strings shrinks, but much more slowly than guessing (3/4) per neighbouring pair.` },
    { type: 'check', scope: 'the Fibonacci count for no HH', questions: [
      { make: (rng) => { const n = rng.int(5, 9); return { type: 'number', q: `${n} flips. How many strings have no two consecutive heads?`, answer: noHH(n), hints: ['Split on the end: …T or …TH.', `a(n) = a(n − 1) + a(n − 2), starting a(1) = 2, a(2) = 3.`], explain: `Continue 2, 3, 5, 8, …: a(${n}) = ${noHH(n)}.` }; } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'equal-counts', say: 'Every one of the 2^n strings has probability 1/2^n, so P(event) = (number of strings in the event) / 2^n.', why: 'Independent fair flips: each fixed string is one path of n halves.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 6); return mc(rng, `${n} flips. P(the exact string ${'HT'.repeat(n).slice(0, n)})?`, fr(1, 2 ** n), [[fr(C(n, Math.ceil(n / 2)), 2 ** n), 'counted every string with the same number of heads'], ['1/2', 'thought an alternating string is "typical"'], [fr(1, n + 1), 'divided by the number of possible head counts']], `One string of ${2 ** n}.`); } },
        ] },
      { answers: 'one-string', say: 'Exactly k heads: choose which k of the n positions are heads, C(n, k) strings. P = C(n, k)/2^n.', why: 'Once the head positions are chosen, the rest are tails, so the string is fixed.',
        checks: [
          { make: (rng) => { const n = rng.int(5, 8); const k = rng.int(2, n - 2); return mc(rng, `${n} flips. P(exactly ${k} heads)?`, fr(C(n, k), 2 ** n), [[fr(1, 2 ** n), `counted one string and forgot the C(${n},${k}) orders`], [fr(1, n + 1), `treated the ${n + 1} head counts as equally likely`], [fr(k, n), 'used the fraction of flips that are heads'], [fr(C(n, k), 2 ** (n - 1)), `divided by 2^${n - 1}`]], `C(${n},${k}) = ${C(n, k)} strings of ${2 ** n}: ${fr(C(n, k), 2 ** n)}.`); } },
        ] },
      { say: 'More heads than tails: swapping every H with T maps "more heads" onto "more tails", so they have equal counts. P = (1 − P(tie))/2, and with n odd a tie is impossible, so P = 1/2.', why: 'The swap is a one-to-one pairing of strings, so the two events are equally likely; ties are the only strings left over.',
        checks: [
          { make: (rng) => { const n = rng.pick([4, 5, 7, 8, 9, 10]); const wrongs = n % 2
            ? [[fr(C(n, (n + 1) / 2), 2 ** n), 'computed exactly one more head than tails'], ['1/3', 'split into more heads / tie / more tails as equal thirds, but a tie is impossible'], [fr(n + 1, 2 * n), 'guessed a small edge above 1/2']]
            : [['1/2', `ignored the tie, which has ${tie(n)} strings`], [fr(tie(n), 2 ** n), 'computed the tie'], [fr(2 ** n + tie(n), 2 ** (n + 1)), 'counted ties as wins'], ['1/3', 'split into more heads / tie / more tails as equal thirds']];
          return mc(rng, `${n} flips. P(strictly more heads than tails)?`, moreH(n).toString(), wrongs, n % 2 ? `${n} is odd: no tie, so exactly 1/2.` : `(1 − ${fr(tie(n), 2 ** n)})/2 = ${moreH(n)}.`); } },
        ] },
      { say: 'No two heads in a row: a good string ends in T (after any good string one shorter) or in TH (after any good string two shorter). So a(n) = a(n − 1) + a(n − 2) with a(1) = 2, a(2) = 3.', why: 'A head must be preceded by a tail (or start the string), so splitting on the last one or two flips covers every good string exactly once.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 7); return mc(rng, `${n} flips. P(no two consecutive heads)?`, fr(noHH(n), 2 ** n), [[`(3/4)^${n - 1}`, 'treated the overlapping neighbour pairs as independent'], [fr(noHH(n - 1), 2 ** n), 'off by one in the recursion'], [fr(n + 1, 2 ** n), 'counted only strings with at most one head']], `a(${n}) = ${noHH(n)}, so ${fr(noHH(n), 2 ** n)}.`); } },
        ] },
      { say: 'A run of k heads somewhere: count the complement, strings with no run of k. Track how long the current head run is; a tail resets it, a head extends it, and reaching k is forbidden.', why: 'Windows overlap (flips 1 to 3 and 2 to 4 share two flips), so adding or multiplying window chances is wrong. The run-length count handles the overlap.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 6); return { type: 'number', q: `${n} flips. How many strings have at least one run of 3 heads? (Count the complement.)`, answer: 2 ** n - noRun(n, 3), hints: ['Strings with no HHH follow a(n) = a(n − 1) + a(n − 2) + a(n − 3).', `Start a(1) = 2, a(2) = 4, a(3) = 7.`], explain: `No HHH: ${noRun(n, 3)} strings, so ${2 ** n} − ${noRun(n, 3)} = ${2 ** n - noRun(n, 3)} have a run.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is P(no two consecutive heads) not (3/4)^(n − 1), even though each neighbouring pair is HH with probability 1/4?', model: 'Neighbouring pairs overlap: flips 1-2 and flips 2-3 share flip 2. If flip 2 is a tail, both pairs are safe at once, so the pair events are dependent and their chances cannot be multiplied. Counting good strings directly with the recursion avoids the dependence.', points: ['neighbouring pairs share a flip', 'overlapping events are dependent, so their chances do not multiply', 'the recursion on the last flips counts each good string once'] },

    S('worked'),
    { type: 'worked', family: 'coin-sequences', section: 'bto', difficulty: 1, seed: 'g', explainAt: [1], intro: 'A head count on a few flips. Try it before opening the solution.' },
    { type: 'worked', family: 'coin-sequences', section: 'bto', difficulty: 3, seed: 'd', fade: 1, intro: 'A neighbour rule. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'A fair coin is flipped 6 times. What is the probability of strictly more heads than tails?', lines: [
      { t: 0, say: 'Fixed n, fair coin, "more heads than tails": a symmetry question, not a sum of Pascal entries.' },
      { t: 3, say: 'Swap every H with T: more heads pairs with more tails, so the answer is 1/2.', slip: true },
      { t: 6, say: 'Wait, 6 is even: 3-3 ties exist and belong to neither side. Take them out first.' },
      { t: 10, say: `Ties: C(6,3) = ${C(6, 3)} of ${2 ** 6}. The other ${2 ** 6 - C(6, 3)} split evenly: ${(2 ** 6 - C(6, 3)) / 2}.` },
      { t: 14, say: `P = ${(2 ** 6 - C(6, 3)) / 2}/${2 ** 6} = ${moreH(6)} ≈ ${d3(moreH(6))}. Below 1/2 because the ties take the middle. Answer ${moreH(6)}.` },
    ] },

    S('predict'),
    { type: 'predict', question: 'Without computing: four fair flips. Is P(exactly 2 heads) above or below 1/2?', answer: `Below: ${C(4, 2)}/16 = ${fr(C(4, 2), 16)}.`, explain: 'The most likely head count is still less likely than all the other counts together.' },

    S('traps'),
    { type: 'traps', family: 'coin-sequences', section: 'bto', extra: [
      { belief: 'Every head count 0 to n is equally likely, 1/(n + 1).', fix: `Counts near n/2 have far more strings: 6 flips give ${C(6, 0)} string with 0 heads and ${C(6, 3)} with 3.` },
      { belief: '"More heads than tails" is 1/2 for any n.', fix: 'Only when n is odd. With n even the tie takes its share first.' },
      { belief: 'Overlapping windows are independent, so multiply (3/4) per neighbouring pair.', fix: 'Windows share flips. Count strings with the recursion instead.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(more heads than tails in 4 flips). One step is wrong.', steps: [
      'There are 16 equally likely strings.',
      'Swapping H and T turns every "more heads" string into a "more tails" string.',
      'So the 16 strings split evenly between the two: P = 1/2.',
      'Answer 1/2.',
    ], errorStep: 2, explain: `The swap pairs "more heads" with "more tails", but ${C(4, 2)} strings are ties and belong to neither. Correct: (16 − ${C(4, 2)})/2 = ${(16 - C(4, 2)) / 2} strings, P = ${moreH(4)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'Five flips. A candidate answers P(exactly 2 heads) = 1/6. Which belief produced it?', options: ['Head counts 0 to 5 equally likely', 'Only one string counted, like HHTTT', 'Divided by 2^4 instead of 2^5'], answer: 0, explain: `Six possible counts, but they carry C(5,k) strings each: ${fr(C(5, 2), 32)}.` },
      { type: 'choice', q: `Another answers ${fr(1, 32)}. Which belief?`, options: ['One string counted, not the C(5,2) orders', 'The six head counts are equally likely', 'Divided by 2^4 = 16 instead of 2^5 = 32'], answer: 0, explain: `HHTTT is one of ${C(5, 2)} strings with two heads.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the Pascal rows: n = 4: ${[0, 1, 2, 3, 4].map((k) => C(4, k)).join(' ')}; n = 5: ${[0, 1, 2, 3, 4, 5].map((k) => C(5, k)).join(' ')}; n = 6: ${ROW6.map((k) => C(6, k)).join(' ')}. And the powers: 2^8 = ${2 ** 8}, 2^10 = ${2 ** 10}. Most coin items are one lookup and one division.` },
    { type: 'callout', tone: 'speed', text: `No-HH counts are Fibonacci numbers: a(n) = F(n + 2), so 10 flips give ${noHH(10)} of ${2 ** 10} ≈ ${d3(noHH(10) / 2 ** 10)}. Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds a question, enough to run the recursion to n = 10 by hand.` },
    { type: 'check', scope: 'Pascal rows and the Fibonacci count', questions: [
      { make: (rng) => { const n = rng.int(4, 6); const k = rng.int(0, n); return { type: 'number', q: `${n} flips. How many strings have exactly ${k} heads? (Recall the Pascal row.)`, answer: C(n, k), explain: `Row ${n}: ${Array.from({ length: n + 1 }, (_, i) => C(n, i)).join(' ')}. Entry ${k}: ${C(n, k)}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'n fair flips → count strings over 2^n. Exactly k heads: C(n,k). More heads: (1 − P(tie))/2. No HH: Fibonacci a(n) = a(n−1) + a(n−2). Runs: count the complement with a run-length table.' },

    S('contrast'),
    { type: 'compare', columns: ['Event (6 flips)', 'Counting tool', 'Strings', 'Probability'], rows: [
      ['exactly 3 heads', 'choose positions, C(6,3)', String(C(6, 3)), fr(C(6, 3), 64)],
      ['at least 3 heads', 'add C(6,3) + … + C(6,6)', String(C(6, 3) + C(6, 4) + C(6, 5) + C(6, 6)), fr(C(6, 3) + C(6, 4) + C(6, 5) + C(6, 6), 64)],
      ['3 heads in a row somewhere', 'complement, run-length table', String(64 - noRun(6, 3)), fr(64 - noRun(6, 3), 64)],
      ['more heads than tails', 'H/T symmetry minus ties', String((64 - C(6, 3)) / 2), moreH(6).toString()],
      ['no two heads in a row', 'Fibonacci recursion', String(noHH(6)), fr(noHH(6), 64)],
      ['all the same', 'two strings', '2', fr(2, 64)],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: n = 1 means no HH is certain (2 of 2). n = 2 gives 3/4, the only length where the independence guess (3/4)^(n−1) happens to be exact. Exactly 0 heads and exactly n heads each have one string.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: C(n, k) positions reappear in a random walk ("at position 2 after 8 steps" is "5 ups of 8": bto/random-walk-line), in the binomial for biased coins (bto/race-to-k), and in urn draws where the chances change (bto/urn-draws). Run-length recursions are the first step toward pattern waiting times (bto/pattern-waiting).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Six flips. Which is more likely: at least 3 heads, or 3 heads in a row somewhere?', options: ['at least 3 heads', '3 heads in a row somewhere', 'equally likely'], answer: 0, traps: { 1: 'every string with a run of 3 heads has at least 3 heads, so the run cannot be more likely', 2: 'HTHTHH has 4 heads but no run of 3: positions anywhere are a bigger set than adjacent positions' }, explain: `${C(6, 3) + C(6, 4) + C(6, 5) + C(6, 6)} strings against ${64 - noRun(6, 3)}: the run is a special case.` },
      { type: 'number', q: 'Two flips. How many of the 4 strings have no two consecutive heads?', answer: noHH(2), explain: 'HT, TH, TT: only HH is excluded.' },
    ] },

    { type: 'variation', base: `Five fair flips. P(exactly 2 heads) = C(5,2)/32 = ${fr(C(5, 2), 32)}.`, rows: [
      { change: 'Ask for exactly 3 heads instead', effect: `No change: C(5,3) = C(5,2) = ${C(5, 3)}. Choosing the 3 heads is choosing the 2 tails.`, same: true },
      { change: 'Flip five coins at once instead of one coin five times', effect: 'No change. Label the coins 1 to 5 and they are five positions, exactly like five flips.', same: true },
      { change: 'Ask for at least 2 heads', effect: `Add the row from 2 up, or take away 0 and 1 heads: 1 − (${C(5, 0)} + ${C(5, 1)})/32 = ${fr(32 - C(5, 0) - C(5, 1), 32)}.` },
      { change: 'Ask for 2 heads in a row somewhere', effect: `Adjacency is a different tool: the complement "no HH" has ${noHH(5)} strings, so ${fr(32 - noHH(5), 32)}.` },
      { change: 'Six flips and exactly 3 heads, both at once', effect: `Each change alone moves the answer, together they cancel: C(6,3)/64 = ${fr(C(6, 3), 64)}, the base value again. More flips spread the strings; 3 of 6 is the new peak.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(4, 6); const k = rng.int(1, n - 1); return mc(rng, `A strategy's ${n} trading days are each up or down with probability 1/2, independently. P(exactly ${k} up days)?`, fr(C(n, k), 2 ** n), [[fr(1, 2 ** n), 'counted one string of up and down days'], [fr(1, n + 1), `treated the ${n + 1} possible counts as equally likely`], [fr(k, n), 'used the share of days, not a probability']], `Choose which ${k} of the ${n} days are up: C(${n},${k}) = ${C(n, k)} of ${2 ** n}.`); } },
      far: { type: 'choice', q: 'A price moves one tick up or down each second, each with probability 1/2, independently. After 6 seconds, P(the price is exactly 2 ticks above its start)?', options: [fr(C(6, 4), 64), fr(1, 64), fr(1, 7), fr(C(6, 3), 64)], answer: 0, traps: { 1: 'counted one path, such as up, up, up, up, down, down', 2: 'treated the 7 possible end points as equally likely', 3: 'counted 3 ups and 3 downs: that ends back at the start' }, explain: `Up 2 net means 4 ups and 2 downs: choose the up seconds, C(6,4) = ${C(6, 4)} paths of 64.` },
      principle: { type: 'choice', q: 'Which idea carried over from coins to trading days and price paths?', options: ['Count the ways to place the ups: C(n, k) of 2^n', 'Each possible total is equally likely: one over the totals', 'One fixed string stands for the whole event', 'The share of ups is the probability, k/n'], answer: 0, traps: { 1: 'totals near the middle have many more strings', 2: 'every rearrangement of the same ups is its own equally likely string', 3: 'k/n is a share of positions, not a chance' }, explain: 'Each up/down string is equally likely; an event is fixed by which positions are ups, so count positions with C(n, k).' },
    },

    S('tryit'),
    { type: 'tryit', family: 'coin-sequences', section: 'bto', count: 3 },
  ],
};
