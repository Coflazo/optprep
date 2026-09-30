// Curated Likelihood List items modelled on reported scenarios and classic ranking traps.
// Every item is an original rewrite, satisfies the item contract (exact probabilities, RANK_MARGIN),
// carries meta.source and params (the data behind each statement). Probabilities are computed
// here from the item's own data, so the numbers shown and the numbers scored cannot drift apart.
import { makeRng } from '../../core/rng.js';
import { nCr, nPr, derangements, factorial } from '../../core/combinatorics.js';
import { Q } from '../../core/rational.js';
import { stationary } from '../../core/markov.js';
import { rankItem } from './lib.js';
import { q, qpow } from '../bto/lib.js';
import { DISTS, points } from './families/density-curves.js';

const SRC = {
  qv: 'QuantVault, "Optiver Likelihood List Game" (format; score tables, football results, density curves, scatter plots, Markov graph with reversed order, fund returns, free-throw item), https://quantvault.org/optiver-likelihood-list.html',
  prachub: 'PracHub, "Optiver Likelihood List Assessment" guide (two-dice ranking example; subset logic, denominators), https://prachub.com/resources/optiver-likelihood-list-assessment-2027-probability-ranking-charts-timing-and-preparation',
  tm: 'Tradermath, Optiver Likelihood-list practice lobby (chart, table or scenario plus three statements, 90 s each), https://www.tradermath.org/online-assessments/likelihood-test/lobby',
  linda: 'Tversky and Kahneman (1983), "Extensional versus intuitive reasoning: the conjunction fallacy" (Linda problem)',
  hospital: 'Tversky and Kahneman (1974), "Judgment under Uncertainty: Heuristics and Biases" (hospital problem)',
  demere: 'Chevalier de Méré problem (Pascal-Fermat correspondence, 1654)',
  pepys: 'Newton-Pepys problem (1693)',
  feller: 'W. Feller, An Introduction to Probability Theory and Its Applications, Vol. 1',
  green: 'X. Zhou, A Practical Guide to Quantitative Finance Interviews ("Green Book"), 2008',
  barhillel: 'Bar-Hillel and Falk (1982), "Some teasers concerning conditional probabilities"',
  monty: 'Monty Hall problem (Selvin 1975; vos Savant 1990)',
};

const binomGe = (n, k, a = 1, c = 2) => { let s = 0n; for (let j = Math.max(k, 0); j <= n; j++) s += nCr(n, j) * BigInt(a) ** BigInt(j) * BigInt(c - a) ** BigInt(n - j); return new Q(s, BigInt(c) ** BigInt(n)); };
const binomEq = (n, k, a = 1, c = 2) => new Q(nCr(n, k) * BigInt(a) ** BigInt(k) * BigInt(c - a) ** BigInt(n - k), BigInt(c) ** BigInt(n));
const allDiff = (n, d) => new Q(nPr(d, n), BigInt(d) ** BigInt(n));
const ways2 = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const ways3 = (s) => { let w = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const c = s - a - b; if (c >= 1 && c <= 6) w++; } return w; };
const fib = (n) => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };

const bank = [];
function add(slug, family, difficulty, source, o) {
  const rng = makeRng(`llbank:${slug}`);
  const order = o.keepOrder ? [0, 1, 2] : rng.shuffle([0, 1, 2]);
  const it = rankItem(family, rng, difficulty, {
    ...o,
    statements: order.map((i) => o.statements[i]).map(([text, p, how]) => ({ text, p, how })),
    intro: o.intro || [{ say: 'Put a number (or a bound) on each statement before ordering.', why: 'Only the order is scored, so a quick estimate per statement usually suffices.' }],
    compare: o.compare || 'Order the three probabilities from largest to smallest.',
    rule: o.rule,
    anchor: o.anchor,
    hints: o.hints,
    params: { ...o.params, displayOrder: order },
  });
  if (!it) throw new Error(`ll bank item ${slug} violates the rank margin: ${o.statements.map((x) => (x[1].toNumber ? x[1].toNumber() : x[1]).toFixed(4)).join(', ')}`);
  bank.push({ ...it, id: `ll-bank-${slug}`, meta: { source } });
}

// ---------- Pure reasoning triples ----------
add('two-dice-triple', 'dice-events', 1, SRC.prachub, {
  text: 'Two fair dice are thrown. Rank the statements from most to least likely.',
  statements: [
    ['At least one die shows a 6.', q(11, 36), '11 of 36 ordered pairs contain a 6.'],
    ['The sum is at least 9.', q(10, 36), 'Sums 9, 10, 11, 12: 4 + 3 + 2 + 1 = 10 pairs.'],
    ['The sum is exactly 12.', q(1, 36), 'Only (6,6).'],
  ],
  rule: 'Count ordered pairs out of 36.', anchor: 'Favourable over 36 equally likely ordered pairs.',
  hints: ['Count ordered pairs for each statement.', 'At least one 6: 36 − 25.'],
  params: { events: [{ key: 'atLeastOne', face: 6, dice: 2 }, { key: 'sumAtLeast', t: 9 }, { key: 'sumEq', s: 12 }] },
});
add('free-throw-95', 'impossible-bounds', 3, SRC.qv, {
  text: 'A basketball player has made 90 of her first 100 free throws. She takes 100 more, making each with probability 0.9 independently. Rank the statements from most to least likely.',
  statements: [
    ['She finishes the 200 shots at 95% or better.', qpow(q(9, 10), 100), '95% of 200 is 190: she would need all 100 remaining shots, probability 0.9^100 ≈ 0.00003. It sounds reachable for a 90% shooter; it is almost impossible.'],
    ['She finishes the 200 shots at 90% or better.', binomGe(100, 90, 9, 10), 'Needs at least 90 of the next 100: P(Bin(100, 0.9) ≥ 90) ≈ 0.58.'],
    ['She makes at least 80 of the next 100 shots.', binomGe(100, 80, 9, 10), 'Mean 90, sd 3: 80 is more than 3 sd below the mean, so this is nearly certain.'],
  ],
  compare: 'Nearly certain > about even > almost impossible.',
  rule: 'Translate percentages into the number of makes still needed; compare with the shots left.',
  anchor: 'Binomial tails, with the first step being a bound on what is still achievable.',
  hints: ['How many makes does each final percentage need out of 200?', 'How many can she still make?'],
  params: { scenario: 'freeThrow', made: 90, n: 100, k: 100, a: 9, c: 10, statements: [{ finalPct: 95 }, { finalPct: 90 }, { nextAtLeast: 80 }] },
});
add('free-throw-impossible', 'impossible-bounds', 2, SRC.qv, {
  text: 'A player has made 45 of 50 free throws and will take 50 more, making each with probability 0.9. Rank the statements from most to least likely.',
  statements: [
    ['She ends with at least 96% of her 100 shots made.', q(0), '96 makes need 51 of the next 50. Impossible.'],
    ['She ends with at least 45% made.', q(1), 'She already has 45 of 100 guaranteed. Certain.'],
    ['She makes at least 45 of the next 50.', binomGe(50, 45, 9, 10), 'Binomial tail P(Bin(50, 0.9) ≥ 45) ≈ 0.62.'],
  ],
  compare: 'Certain > binomial tail > impossible.',
  rule: 'Bounds first: already guaranteed → 1; more makes than shots → 0.',
  anchor: 'Probabilities live in [0, 1]; counting bounds pin statements to the ends.',
  hints: ['Is any statement guaranteed already?', 'Is any statement impossible even if she makes everything?'],
  params: { scenario: 'freeThrow', made: 45, n: 50, k: 50, a: 9, c: 10, statements: [{ finalPct: 96 }, { finalPct: 45 }, { nextAtLeast: 45 }] },
});
add('newton-pepys', 'dice-events', 3, SRC.pepys, {
  text: 'Fair dice are thrown. Rank the statements from most to least likely.',
  statements: [
    ['At least one six when 6 dice are thrown.', binomGe(6, 1, 1, 6), '1 − (5/6)^6 ≈ 0.665.'],
    ['At least two sixes when 12 dice are thrown.', binomGe(12, 2, 1, 6), 'Binomial tail ≈ 0.619.'],
    ['At least three sixes when 18 dice are thrown.', binomGe(18, 3, 1, 6), 'Binomial tail ≈ 0.597.'],
  ],
  compare: 'Scaling the dice and the required sixes together makes the event less likely each time.',
  rule: 'P(at least k in 6k) falls with k: the mean stays at k, and the chance of falling below it grows.',
  anchor: 'The binomial tail P(X ≥ mean) for growing n.',
  hints: ['Each statement asks for at least the expected number of sixes.', 'Which one is most forgiving?'],
  params: { events: [{ key: 'kSixes', k: 1 }, { key: 'kSixes', k: 2 }, { key: 'kSixes', k: 3 }] },
});
add('de-mere', 'dice-events', 2, SRC.demere, {
  text: 'Rank the statements from most to least likely.',
  statements: [
    ['At least one six in 4 throws of a die.', q(1).sub(qpow(q(5, 6), 4)), '1 − (5/6)^4 ≈ 0.518.'],
    ['At least one double six in 24 throws of a pair of dice.', q(1).sub(qpow(q(35, 36), 24)), '1 − (35/36)^24 ≈ 0.491.'],
    ['The sum of two dice is at least 10.', q(6, 36), '6 of 36 pairs.'],
  ],
  compare: 'De Méré thought the first two were equal (4 × 1/6 = 24 × 1/36); the complement rule separates them.',
  rule: '1 − (1 − p)^n, not n·p.', anchor: 'The complement rule.',
  hints: ['Do not add n × p.', 'Use 1 − (1 − p)^n.'],
  params: { events: [{ key: 'sixInN', n: 4 }, { key: 'doubleSix', n: 24 }, { key: 'sumGe', t: 10 }] },
});
add('linda', 'conjunction', 1, SRC.linda, {
  text: 'At a trading firm, 30% of staff are traders, 25% of staff play chess, and 12% are traders who play chess. Sam, picked at random from the staff, is quiet and loves puzzles. Rank the statements from most to least likely.',
  statements: [
    ['Sam is a trader.', q(30, 100), '30% of staff.'],
    ['Sam is a trader who plays chess.', q(12, 100), 'A subset of the traders: 12%. The description makes it feel likelier; it cannot be.'],
    ['Sam is a trader or plays chess (or both).', q(43, 100), '30% + 25% − 12% = 43%.'],
  ],
  compare: 'OR ⊇ single ⊇ AND, whatever the story says.',
  rule: 'P(A and B) ≤ P(A) ≤ P(A or B).', anchor: 'Subset logic.',
  hints: ['Which statement is contained in which?', 'The personality sketch changes nothing: Sam is a random staff member.'],
  params: { pA: 0.3, pB: 0.25, pAB: 0.12, statements: ['A', 'AB', 'AorB'] },
});
add('hospital', 'large-numbers', 3, SRC.hospital, {
  text: 'Boys and girls are equally likely. Rank the statements from most to least likely.',
  statements: [
    ['A small hospital with 15 births in a day records at least 10 boys (over 60%).', binomGe(15, 10), 'P(Bin(15, 1/2) ≥ 10) ≈ 0.151.'],
    ['A large hospital with 45 births in a day records at least 28 boys (over 60%).', binomGe(45, 28), 'P(Bin(45, 1/2) ≥ 28) ≈ 0.068.'],
    ['A hospital with 16 births in a day records exactly 8 boys.', binomEq(16, 8), 'C(16,8)/2^16 ≈ 0.196.'],
  ],
  compare: 'Exact balance in a small sample is common; extreme proportions are about twice as common in the small hospital as in the large one.',
  rule: 'sd of a proportion = 0.5/√n: small samples swing more.', anchor: 'Binomial proportions across sample sizes.',
  hints: ['Which hospital sees more extreme days?', 'How likely is an exact 8–8 split in 16?'],
  params: { events: [{ key: 'hospital', n: 15, atLeast: 10 }, { key: 'hospital', n: 45, atLeast: 28 }, { key: 'exactHalf', n: 16 }] },
});
add('birthday-triple', 'collisions', 2, SRC.feller, {
  text: 'All birthdays (and birth months) are equally likely and independent. Rank the statements from most to least likely.',
  statements: [
    ['Among 23 people, two share a birthday.', q(1).sub(allDiff(23, 365)), '1 − 365·…·343/365^23 ≈ 0.507.'],
    ['Among 100 other people, someone shares your birthday.', q(1).sub(qpow(q(364, 365), 100)), '1 − (364/365)^100 ≈ 0.240.'],
    ['Among 5 people, two share a birth month.', q(1).sub(allDiff(5, 12)), '1 − 12·11·10·9·8/12^5 ≈ 0.618.'],
  ],
  compare: 'Collisions among pairs grow fast; matching one fixed person grows slowly.',
  rule: 'Pairs: 1 − Π(1 − i/d). Fixed target: 1 − (1 − 1/d)^n.', anchor: 'The all-different chain.',
  hints: ['Count pairs for "two share".', 'A fixed target has only n chances.'],
  params: { events: [{ key: 'birthdayAny', n: 23 }, { key: 'birthdayYou', n: 100 }, { key: 'month', n: 5 }] },
});
add('hh-vs-ht', 'coin-patterns', 3, SRC.green, {
  text: 'A fair coin is flipped 5 times. Rank the statements from most to least likely.',
  statements: [
    ['HT appears somewhere in the 5 flips.', q(26, 32), 'Only T…TH…H avoids HT: 6 strings. 1 − 6/32.'],
    ['HH appears somewhere in the 5 flips.', q(32 - fib(7), 32), 'Strings avoiding HH: F(7) = 13. 1 − 13/32.'],
    ['HHH appears somewhere in the 5 flips.', q(8, 32), '8 of 32 strings contain three heads in a row.'],
  ],
  compare: 'HT and HH are equally likely at any fixed position, yet HT is found far more often.',
  rule: 'Count avoiders: HT → n + 1, HH → Fibonacci.', anchor: 'Counting 2^n strings.',
  hints: ['Count the strings that avoid each pattern.', 'Avoiding HT forces tails before heads.'],
  params: { events: [{ key: 'hasHT', n: 5 }, { key: 'hasHH', n: 5 }, { key: 'hasHHH', n: 5 }] },
});
add('monty-triple', 'bayes-boxes', 3, SRC.monty, {
  text: 'Three doors hide one car and two goats; you pick door 1. Rank the statements from most to least likely.',
  statements: [
    ['A host who knows where the car is opens a goat door, you switch, and you win.', q(2, 3), 'Your door keeps 1/3; the other closed door holds 2/3.'],
    ['You stay with door 1 and win.', q(1, 3), 'The host\'s action never changes your door\'s 1/3.'],
    ['A host who does not know opens a random other door, it happens to show a goat, you switch, and you win.', q(1, 2), 'A random reveal is plain elimination: 1/2 each for the two closed doors.'],
  ],
  compare: 'Knowing host 2/3 > random host 1/2 > staying 1/3.',
  rule: 'What a reveal means depends on how the host chose it.', anchor: 'Bayes updating with a choice rule.',
  hints: ['Could the host have revealed the car?', 'Compare the knowing and random hosts.'],
  params: { doors: 3, statements: [{ host: 'knowing', action: 'switch' }, { host: 'any', action: 'stay' }, { host: 'random', action: 'switch' }] },
});
add('two-children', 'conjunction', 2, SRC.barhillel, {
  text: 'A family has two children; each is a boy or a girl with probability 1/2, independently. Rank the statements from most to least likely.',
  statements: [
    ['Both are boys, given that the older child is a boy.', q(1, 2), 'Only the younger child is uncertain.'],
    ['Both are boys, given that at least one is a boy.', q(1, 3), 'BB, BG, GB remain; one of three.'],
    ['Both are boys (no information).', q(1, 4), 'One of four equally likely outcomes.'],
  ],
  compare: 'More specific information about which child leaves fewer outcomes to share the probability.',
  rule: 'Condition by deleting outcomes, then renormalise.', anchor: 'Counting equally likely ordered outcomes.',
  hints: ['List BB, BG, GB, GG.', 'Delete what each condition rules out.'],
  params: { outcomes: ['BB', 'BG', 'GB', 'GG'], statements: [{ given: 'olderBoy' }, { given: 'atLeastOneBoy' }, { given: null }] },
});
add('card-triple', 'card-events', 2, SRC.feller, {
  text: 'Two cards are dealt from a shuffled 52-card deck. Rank the statements from most to least likely.',
  statements: [
    ['The two cards have different colours.', q(26, 51), '26 of the remaining 51 cards have the other colour.'],
    ['The two cards have the same suit.', q(12, 51), '12 of the remaining 51 share the first card\'s suit.'],
    ['The two cards form a pair.', q(3, 51), '3 of the remaining 51 share its rank.'],
  ],
  compare: 'Same numerator structure: 26 > 12 > 3 matching cards out of 51.',
  rule: 'Fix the first card; count matches among 51.', anchor: 'One card uniform over 52, then one over 51.',
  hints: ['Fix the first card.', 'How many of the other 51 qualify?'],
  params: { events: [{ key: 'diffColour' }, { key: 'sameSuit' }, { key: 'pair' }] },
});
add('large-numbers-flips', 'large-numbers', 2, SRC.feller, {
  text: 'A fair coin is flipped. Rank the statements from most to least likely.',
  statements: [
    ['At least 60% heads in 10 flips.', binomGe(10, 6), 'P(at least 6 of 10) = 386/1024 ≈ 0.377.'],
    ['At least 60% heads in 100 flips.', binomGe(100, 60), '60 is 2 sd above 50: ≈ 0.028.'],
    ['Exactly 50% heads in 10 flips.', binomEq(10, 5), 'C(10,5)/1024 ≈ 0.246.'],
  ],
  compare: 'The same proportion is far more extreme in a large sample.',
  rule: 'sd(proportion) = 0.5/√n.', anchor: 'Binomial proportions.',
  hints: ['How spread out is the proportion for 10 flips versus 100?', 'Compute or estimate each tail.'],
  params: { events: [{ key: 'atLeast', n: 10, f: 0.6 }, { key: 'atLeast', n: 100, f: 0.6 }, { key: 'exactHalf', n: 10 }] },
});
add('three-dice-sums', 'dice-events', 2, SRC.feller, {
  text: 'Three fair dice are thrown. Rank the statements from most to least likely.',
  statements: [
    ['All three show different faces.', q(120, 216), '6·5·4/216.'],
    ['The sum is exactly 10.', q(ways3(10), 216), '27 of 216 ordered triples.'],
    ['The sum is exactly 6.', q(ways3(6), 216), '10 of 216 ordered triples.'],
  ],
  compare: 'All different is common; a particular sum is at most 27/216.',
  rule: 'Count ordered triples out of 216.', anchor: 'Two-dice counting with a third die.',
  hints: ['Count ordered triples.', 'Middle sums have the most ways.'],
  params: { events: [{ key: 'allDiff', n: 3 }, { key: 'threeSum', s: 10 }, { key: 'threeSum', s: 6 }] },
});
add('parity-trap', 'impossible-bounds', 2, SRC.qv, {
  text: 'A fair coin is flipped 10 times. Rank the statements from most to least likely.',
  statements: [
    ['The number of heads minus the number of tails is exactly 3.', q(0), 'Heads − tails = 2·heads − 10 is even. Impossible.'],
    ['Exactly 5 heads come up.', binomEq(10, 5), 'C(10,5)/1024 ≈ 0.246.'],
    ['At least one head or at least one tail comes up.', q(1), 'Always true. Certain.'],
  ],
  compare: 'Certain > ordinary > impossible.',
  rule: 'Parity can make an outcome impossible.', anchor: 'Bounds and parity before estimation.',
  hints: ['Is heads − tails always even?', 'Which statement can never fail?'],
  params: { scenario: 'coins', n: 10, d: 3 },
});
add('waiting-six', 'dice-events', 2, SRC.feller, {
  text: 'A die is thrown repeatedly. Rank the statements from most to least likely.',
  statements: [
    ['The first six comes on throw 1.', q(1, 6), '1/6.'],
    ['The first six comes on throw 2.', q(5, 36), '5/6 × 1/6.'],
    ['No six appears in the first 6 throws.', qpow(q(5, 6), 6), '(5/6)^6 ≈ 0.335.'],
  ],
  compare: 'Missing six times in a row (1/3) is more likely than a six on any particular throw.',
  rule: 'First success on k: (1 − p)^(k−1) p; no success in k: (1 − p)^k.', anchor: 'Geometric waiting.',
  hints: ['Write each as a path of misses and hits.', '(5/6)^6 is about 1/3.'],
  params: { events: [{ key: 'firstSix', k: 1 }, { key: 'firstSix', k: 2 }, { key: 'noSix', n: 6 }] },
});
add('poker-triple', 'card-events', 3, SRC.feller, {
  text: 'Hands are dealt from a shuffled deck. Rank the statements from most to least likely.',
  statements: [
    ['A 5-card hand contains at least two cards of the same rank.', q(1).sub(new Q(nCr(13, 5) * 1024n, nCr(52, 5))), '1 − C(13,5)·4^5/C(52,5) ≈ 0.493.'],
    ['A 13-card hand contains no ace.', new Q(nCr(48, 13), nCr(52, 13)), 'C(48,13)/C(52,13) ≈ 0.304.'],
    ['A 5-card hand is a flush.', new Q(4n * nCr(13, 5), nCr(52, 5)), '≈ 0.002.'],
  ],
  compare: 'Nearly half of hands have a repeated rank; a flush is rare.',
  rule: 'Complements for "at least"; direct counts for flushes.', anchor: 'Counting hands.',
  hints: ['Complement of "at least two share a rank".', 'Flush ≈ 1/500.'],
  params: { events: [{ key: 'pairOrBetter' }, { key: 'noAceBridge' }, { key: 'flushFive' }] },
});
add('hat-check', 'dice-events', 2, SRC.feller, {
  text: 'Three people put their hats in a box and each takes one back at random. Rank the statements from most to least likely.',
  statements: [
    ['Exactly one person gets their own hat.', q(3, 6), '3 of the 6 arrangements fix exactly one hat.'],
    ['Nobody gets their own hat.', new Q(derangements(3), factorial(3)), '2 derangements of 6.'],
    ['Everybody gets their own hat.', q(1, 6), 'Only the identity arrangement.'],
  ],
  compare: '3/6 > 2/6 > 1/6 (exactly two is impossible).',
  rule: 'Count arrangements; exactly n − 1 matches is impossible.', anchor: 'Permutations of 3 items.',
  hints: ['List the 6 arrangements.', 'Count fixed points in each.'],
  params: { n: 3, statements: [{ fixed: 1 }, { fixed: 0 }, { fixed: 3 }] },
});
add('ruin-triple', 'large-numbers', 3, SRC.green, {
  text: 'A price moves up or down 1 each minute. It stops when it hits 10 or 0. Rank the statements from most to least likely.',
  statements: [
    ['Starting at 3 with up-moves of probability 0.6, it hits 10 first.', q(1).sub(qpow(q(2, 3), 3)).div(q(1).sub(qpow(q(2, 3), 10))), '(1 − (2/3)^3)/(1 − (2/3)^10) ≈ 0.716.'],
    ['Starting at 5 with fair moves, it hits 10 first.', q(1, 2), 'Fair walk: 5/10.'],
    ['Starting at 3 with fair moves, it hits 10 first.', q(3, 10), 'Fair walk: 3/10.'],
  ],
  compare: 'A small upward edge beats starting in the middle of a fair walk.',
  rule: 'Fair: i/N. Biased: (1 − r^i)/(1 − r^N), r = q/p.', anchor: 'Gambler\'s ruin.',
  hints: ['Fair walks: i/N.', 'A 60/40 edge compounds over many steps.'],
  params: { statements: [{ start: 3, target: 10, p: 0.6 }, { start: 5, target: 10, p: 0.5 }, { start: 3, target: 10, p: 0.5 }] },
});

// ---------- Tables ----------
const scoreTable = (slug, difficulty, rows, subs, stmts, source) => {
  const objs = rows.map((r) => Object.fromEntries([['name', r[0]], ...subs.map((s, i) => [s, r[i + 1]])]));
  add(slug, 'score-table', difficulty, source, {
    text: `The table shows the exam scores of ${rows.length} students. One student is picked at random (or from a subgroup, where stated). Rank the statements from most to least likely.`,
    visual: { type: 'table', caption: 'Exam scores', columns: ['Student', ...subs], rows },
    statements: stmts.map(([text, given, cond]) => {
      const base = objs.filter(given || (() => true)), hit = base.filter(cond).length;
      return [text, q(hit, base.length), `${hit} of the ${base.length} ${given ? 'students in the subgroup' : 'students'} qualify.`];
    }),
    compare: 'Order the counted fractions; AND statements can never beat their parts.',
    rule: 'Count rows; conditional statements divide by the subgroup.', anchor: 'Counting table rows.',
    hints: ['Name each denominator.', 'Use subset logic before counting.'],
    // Each statement: the row indices in scope and the qualifying row indices (p = hits / scope).
    params: { subjects: subs, rows, statements: stmts.map(([, given, cond]) => { const scope = objs.map((r, i) => i).filter((i) => !given || given(objs[i])); return { scope, hits: scope.filter((i) => cond(objs[i])) }; }) },
  });
};
scoreTable('scores-a', 2, [['Ava', 82, 75], ['Ben', 64, 58], ['Chen', 91, 88], ['Dara', 55, 71], ['Eli', 73, 69], ['Farah', 88, 92], ['Gus', 47, 52], ['Hana', 69, 81], ['Ivo', 77, 64], ['Jade', 95, 90]], ['Maths', 'Physics'], [
  ['A randomly chosen student scored at least 70 in Maths.', null, (r) => r.Maths >= 70],
  ['A randomly chosen student scored at least 70 in both subjects.', null, (r) => r.Maths >= 70 && r.Physics >= 70],
  ['A randomly chosen student scored below 60 in Physics.', null, (r) => r.Physics < 60],
], SRC.qv);
scoreTable('scores-b', 3, [['Kofi', 58, 62, 71], ['Lena', 84, 79, 66], ['Milo', 72, 88, 59], ['Nia', 91, 85, 90], ['Omar', 49, 55, 61], ['Pia', 77, 73, 82], ['Ava', 66, 70, 58], ['Ben', 83, 64, 77], ['Chen', 60, 58, 49], ['Dara', 88, 91, 86], ['Eli', 71, 69, 73], ['Farah', 54, 76, 68]], ['Maths', 'Statistics', 'English'], [
  ['Among students with at least 80 in Maths, a randomly chosen one scored at least 80 in Statistics.', (r) => r.Maths >= 80, (r) => r.Statistics >= 80],
  ['A randomly chosen student scored at least 80 in Statistics.', null, (r) => r.Statistics >= 80],
  ['A randomly chosen student scored below 55 in English.', null, (r) => r.English < 55],
], SRC.qv);
scoreTable('scores-c', 4, [['Gus', 45, 61], ['Hana', 78, 74], ['Ivo', 83, 89], ['Jade', 52, 48], ['Kofi', 67, 71], ['Lena', 90, 86], ['Milo', 58, 66], ['Nia', 74, 59], ['Omar', 81, 84], ['Pia', 63, 57], ['Ava', 70, 70]], ['Probability', 'Programming'], [
  ['A randomly chosen student scored at least 70 in Probability or Programming (or both).', null, (r) => r.Probability >= 70 || r.Programming >= 70],
  ['A randomly chosen student scored at least 70 in Probability.', null, (r) => r.Probability >= 70],
  ['A randomly chosen student scored at least 80 in both subjects.', null, (r) => r.Probability >= 80 && r.Programming >= 80],
], SRC.qv);

const results = (slug, difficulty, ms, stmts, source) => {
  const parsed = ms.map(([h, a, s]) => { const [hg, ag] = s.split('–').map(Number); return { h, a, hg, ag }; });
  add(slug, 'football', difficulty, source, {
    text: `The table lists ${ms.length} results in a small league. A match is picked at random (or from one team's matches, where stated). Rank the statements from most to least likely.`,
    visual: { type: 'table', caption: 'Results (home team first)', columns: ['Home', 'Away', 'Score'], rows: ms, align: ['left', 'left', 'right'] },
    statements: stmts.map(([text, scope, cond]) => { const base = parsed.filter(scope || (() => true)), hit = base.filter(cond).length; return [text, q(hit, base.length), `${hit} of the ${base.length} ${scope ? 'matches that team played' : 'matches'} qualify.`]; }),
    compare: 'Order the tallied fractions; team statements divide by that team\'s games.',
    rule: 'Frequency = qualifying matches / matches in scope.', anchor: 'Counting rows.',
    hints: ['Tally in one pass.', 'Check each denominator.'],
    params: { matches: ms, statements: stmts.map(([, scope, cond]) => { const sc = parsed.map((m, i) => i).filter((i) => !scope || scope(parsed[i])); return { scope: sc, hits: sc.filter((i) => cond(parsed[i])) }; }) },
  });
};
results('league-a', 2, [['Lions', 'Tigers', '2–1'], ['Wolves', 'Eagles', '0–0'], ['Tigers', 'Wolves', '3–1'], ['Eagles', 'Lions', '1–2'], ['Lions', 'Wolves', '1–1'], ['Tigers', 'Eagles', '0–2'], ['Wolves', 'Lions', '2–3'], ['Eagles', 'Tigers', '2–2'], ['Lions', 'Eagles', '4–0'], ['Wolves', 'Tigers', '1–0']], [
  ['A randomly chosen match was won by the home team.', null, (m) => m.hg > m.ag],
  ['A randomly chosen match had at least 3 goals.', null, (m) => m.hg + m.ag >= 3],
  ['A randomly chosen match ended in a draw.', null, (m) => m.hg === m.ag],
], SRC.qv);
results('league-b', 3, [['Sharks', 'Bears', '1–0'], ['Hawks', 'Foxes', '2–2'], ['Bears', 'Hawks', '0–3'], ['Foxes', 'Sharks', '1–1'], ['Sharks', 'Hawks', '2–0'], ['Bears', 'Foxes', '2–1'], ['Hawks', 'Sharks', '1–2'], ['Foxes', 'Bears', '0–0'], ['Sharks', 'Foxes', '3–2'], ['Hawks', 'Bears', '1–1'], ['Foxes', 'Hawks', '2–0'], ['Bears', 'Sharks', '1–3']], [
  ['A randomly chosen match involving the Sharks was won by the Sharks.', (m) => m.h === 'Sharks' || m.a === 'Sharks', (m) => (m.h === 'Sharks' ? m.hg > m.ag : m.ag > m.hg), 'Sharks played 6 and won 5.'],
  ['A randomly chosen match saw both teams score.', null, (m) => m.hg > 0 && m.ag > 0],
  ['A randomly chosen match was a draw.', null, (m) => m.hg === m.ag],
], SRC.qv);
results('league-c', 3, [['Eagles', 'Foxes', '0–1'], ['Lions', 'Bears', '2–0'], ['Foxes', 'Lions', '1–1'], ['Bears', 'Eagles', '3–0'], ['Lions', 'Eagles', '0–2'], ['Foxes', 'Bears', '2–2'], ['Eagles', 'Lions', '1–4'], ['Bears', 'Foxes', '0–1'], ['Lions', 'Foxes', '1–0'], ['Eagles', 'Bears', '2–1']], [
  ['A randomly chosen match involving the Eagles was won by the Eagles.', (m) => m.h === 'Eagles' || m.a === 'Eagles', (m) => (m.h === 'Eagles' ? m.hg > m.ag : m.ag > m.hg), 'Eagles won 2 of their 5.'],
  ['A randomly chosen match ended in a draw.', null, (m) => m.hg === m.ag],
  ['A randomly chosen match had exactly one goal.', null, (m) => m.hg + m.ag === 1],
], SRC.qv);

const twoWay = (slug, difficulty, traits, cells, keys, source) => {
  const [[ab, aNb], [Nab, NaNb]] = cells, tot = ab + aNb + Nab + NaNb;
  const [A, B] = traits;
  const S = {
    A: [`A randomly chosen person ${A.v}.`, q(ab + aNb, tot), `Row total ${ab + aNb} of ${tot}.`],
    B: [`A randomly chosen person ${B.v}.`, q(ab + Nab, tot), `Column total ${ab + Nab} of ${tot}.`],
    AB: [`A randomly chosen person ${A.v} and ${B.v}.`, q(ab, tot), `One cell: ${ab} of ${tot}.`],
    AorB: [`A randomly chosen person ${A.v} or ${B.v} (or both).`, q(tot - NaNb, tot), `All but the ${NaNb} in neither.`],
    BgA: [`A randomly chosen person who ${A.v} also ${B.v}.`, q(ab, ab + aNb), `${ab} of the ${ab + aNb} who ${A.v}.`],
    AgB: [`A randomly chosen person who ${B.v} also ${A.v}.`, q(ab, ab + Nab), `${ab} of the ${ab + Nab} who ${B.v}.`],
  };
  add(slug, 'conjunction', difficulty, source, {
    text: `The table counts ${tot} people by two traits. One person is picked at random (from a subgroup where stated). Rank the statements from most to least likely.`,
    visual: { type: 'table', caption: `${tot} people`, columns: ['', B.col, `Not: ${B.col.toLowerCase()}`], rows: [[A.col, ab, aNb], [`Not: ${A.col.toLowerCase()}`, Nab, NaNb]] },
    statements: keys.map((k) => S[k]),
    compare: 'Containment orders the AND/single/OR statements; conditionals need one division.',
    rule: 'AND ≤ single ≤ OR; conditional = cell / row or column.', anchor: 'Counting a two-way table.',
    hints: ['Use containment first.', 'Conditional: cell over its row or column.'],
    params: { cells, statements: keys },
  });
};
twoWay('two-way-a', 1, [{ v: 'plays chess', col: 'Plays chess' }, { v: 'is a trader', col: 'Trader' }], [[18, 22], [12, 48]], ['A', 'AB', 'AorB'], SRC.linda);
twoWay('two-way-b', 2, [{ v: 'studied maths', col: 'Studied maths' }, { v: 'codes daily', col: 'Codes daily' }], [[30, 10], [15, 45]], ['BgA', 'B', 'AB'], SRC.linda);
twoWay('two-way-c', 3, [{ v: 'owns a car', col: 'Owns a car' }, { v: 'lives in the city', col: 'City' }], [[12, 38], [28, 22]], ['AgB', 'BgA', 'AB'], SRC.barhillel);

// ---------- Charts ----------
const survey = (slug, difficulty, cats, groups, counts, keys, source) => {
  const tot = counts.flat().reduce((a, b) => a + b, 0);
  const [g, k] = [0, 1];
  const inG = counts[g].reduce((a, b) => a + b, 0), inK = counts[0][k] + counts[1][k], both = counts[g][k];
  const S = {
    marg: [`A randomly chosen respondent chose ${cats[k]}.`, q(inK, tot), `${inK} of ${tot}.`],
    joint: [`A randomly chosen respondent is in ${groups[g]} and chose ${cats[k]}.`, q(both, tot), `${both} of ${tot}.`],
    kGivenG: [`A randomly chosen member of ${groups[g]} chose ${cats[k]}.`, q(both, inG), `${both} of ${inG}.`],
    gGivenK: [`A randomly chosen respondent who chose ${cats[k]} is in ${groups[g]}.`, q(both, inK), `${both} of ${inK}.`],
  };
  add(slug, 'survey-bar', difficulty, source, {
    text: `The chart shows survey counts for ${groups.join(' and ')}. One respondent is picked at random from the people described in each statement. Rank the statements from most to least likely.`,
    visual: { type: 'bar', title: 'Survey answers', xLabel: 'Answer', yLabel: 'People', categories: cats, series: groups.map((name, i) => ({ name, values: counts[i] })) },
    statements: keys.map((x) => S[x]),
    compare: 'Same numerator, different denominators.', rule: 'Joint ≤ each conditional with the same cell.', anchor: 'Counting a grouped table.',
    hints: ['Find the four totals.', 'Match each statement to its denominator.'],
    params: { groups, categories: cats, counts, statements: keys.map((key) => ({ key, group: g, category: k })) },
  });
};
survey('survey-a', 2, ['Equities', 'Options', 'FX', 'Rates'], ['Traders', 'Engineers'], [[14, 22, 9, 5], [18, 6, 11, 15]], ['marg', 'joint', 'kGivenG'], SRC.tm);
survey('survey-b', 3, ['Python', 'C++', 'Java', 'Rust'], ['Interns', 'Seniors'], [[25, 8, 12, 5], [10, 30, 6, 9]], ['gGivenK', 'kGivenG', 'joint'], SRC.tm);
survey('survey-c', 4, ['Bus', 'Bike', 'Train', 'Walk'], ['City office', 'Suburb office'], [[20, 12, 30, 18], [15, 4, 25, 6]], ['gGivenK', 'marg', 'kGivenG'], SRC.tm);

const funds = (slug, difficulty, names, start, ra, rb, stmts, source) => {
  const years = ra.map((_, i) => String(start + i));
  add(slug, 'fund-returns', difficulty, source, {
    text: `The chart shows the annual returns of ${names[0]} and ${names[1]} over ${ra.length} years. A year is chosen at random (for "given" statements, from the qualifying years). Rank the statements from most to least likely.`,
    visual: { type: 'bar', xLabel: 'Year', yLabel: 'Return (%)', unit: '%', categories: years, series: [{ name: names[0], values: ra }, { name: names[1], values: rb }] },
    statements: stmts.map(([text, scope, cond]) => {
      const idx = ra.map((_, i) => i).filter((i) => scope(i, ra, rb)), hit = idx.filter((i) => cond(i, ra, rb)).length;
      return [text, q(hit, idx.length), `${hit} of the ${idx.length} years in scope qualify.`];
    }),
    compare: 'Order the counted fractions; the volatile fund wins extremes, the steady fund wins "positive".',
    rule: 'Count bars in scope.', anchor: 'Counting rows drawn as bars.',
    hints: ['Which bars matter for each statement?', 'Check the denominator of the "given" statement.'],
    params: { years, funds: names, returns: [ra, rb], statements: stmts.map(([, scope, cond]) => { const sc = ra.map((_, i) => i).filter((i) => scope(i, ra, rb)); return { scope: sc, hits: sc.filter((i) => cond(i, ra, rb)) }; }) },
  });
};
const all = () => true;
funds('funds-a', 2, ['Steady', 'Swing'], 2014, [4, 6, 3, -2, 5, 7, 2, 6, 4, 5], [18, -9, 25, -14, 11, 30, -6, 8, -12, 21], [
  ['In a randomly chosen year, Steady was positive.', all, (i, a) => a[i] > 0],
  ['In a randomly chosen year, Swing returned more than 10%.', all, (i, a, b) => b[i] > 10],
  ['In a randomly chosen year, Swing lost money.', all, (i, a, b) => b[i] < 0],
], SRC.qv);
funds('funds-b', 3, ['Core', 'Momentum'], 2013, [5, -3, 8, 6, -1, 4, 7, 2, -4, 9, 3, 6], [12, -15, 22, 17, -8, -3, 26, 5, -19, 14, 9, 11], [
  ['In a randomly chosen year, Momentum beat Core.', all, (i, a, b) => b[i] > a[i]],
  ['In a randomly chosen year, both funds lost money.', all, (i, a, b) => a[i] < 0 && b[i] < 0],
  ['Given that Core was positive the year before, Core was positive again.', (i, a) => i > 0 && a[i - 1] > 0, (i, a) => a[i] > 0],
], SRC.qv);
funds('funds-c', 4, ['North', 'South'], 2015, [3, 5, 4, -2, 6, 3, 5, 4, 2], [-10, 24, -7, 15, -12, 28, -5, 19, 7], [
  ['In a randomly chosen year, South returned more than 15%.', all, (i, a, b) => b[i] > 15],
  ['In a randomly chosen year, North returned more than South.', all, (i, a, b) => a[i] > b[i]],
  ['In a randomly chosen year, North was positive.', all, (i, a) => a[i] > 0],
], SRC.qv);

const histo = (slug, difficulty, title, xLabel, unit, lo, w, counts, stmts, source) => {
  const bins = counts.map((c, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count: c }));
  const N = counts.reduce((a, b) => a + b, 0);
  const mass = (a, b) => bins.reduce((s, x) => s + (x.from >= a && x.to <= b ? x.count : 0), 0);
  add(slug, 'histogram-bins', difficulty, source, {
    text: `The histogram shows ${N} ${title}. One is chosen at random (or from a subgroup, where stated). Values never fall exactly on a bin edge. Rank the statements from most to least likely.`,
    visual: { type: 'histogram', xLabel, yLabel: 'Count', unit, bins },
    statements: stmts.map(([text, a, b, ga, gb]) => { const num = mass(a, b), den = ga == null ? N : mass(ga, gb); return [text, q(num, den), `Bars in the range: ${num}; ${ga == null ? 'total' : 'bars in the subgroup'}: ${den}.`]; }),
    compare: 'Add bars; divide by the right total.', rule: 'Range = Σ bars / total.', anchor: 'Counting grouped outcomes.',
    hints: ['Total count first.', 'Conditional: divide by the subgroup.'],
    params: { bins, statements: stmts.map(([text, a, b, ga, gb]) => ({ a, b, given: ga == null ? null : [ga, gb] })) },
  });
};
histo('returns-hist', 2, 'daily returns of a stock', 'Daily return (%)', '%', -3, 1, [4, 11, 23, 27, 14, 6], [
  ['The return is positive.', 0, 3, null, null],
  ['The return is between −1% and +1%.', -1, 1, null, null],
  ['The return is below −1%.', -3, -1, null, null],
], SRC.qv);
histo('scores-hist', 3, 'exam scores', 'Score', '', 40, 10, [5, 12, 20, 16, 7, 3], [
  ['Among students scoring above 70, a randomly chosen one scored above 80.', 80, 100, 70, 100],
  ['A randomly chosen student scored above 70.', 70, 100, null, null],
  ['A randomly chosen student scored below 50.', 40, 50, null, null],
], SRC.qv);
histo('fill-times', 3, 'order fill times', 'Fill time (ms)', '', 0, 2, [30, 22, 12, 6, 3, 2], [
  ['A fill takes under 4 ms.', 0, 4, null, null],
  ['Among fills over 4 ms, a randomly chosen one takes over 8 ms.', 8, 12, 4, 12],
  ['A fill takes over 8 ms.', 8, 12, null, null],
], SRC.tm);

const dens = (slug, difficulty, curves, names, stmts, text, source) => {
  const specs = curves.map((c) => DISTS[c.kind](c));
  add(slug, 'density-curves', difficulty, source, {
    text,
    visual: { type: 'density', xLabel: 'Value', yLabel: 'Density', curves: curves.map((c, i) => ({ name: names[i], points: points(c) })) },
    statements: stmts.map(([t, ci, a, b, how]) => [t, specs[ci].prob(a, b), how]),
    compare: 'Compare areas under the curves.', rule: 'Probability = area; 68-95 for bell curves; 1/width for flat ones.', anchor: 'Areas under a density.',
    hints: ['Which curve and which interval?', 'Width × typical height.'],
    params: { curves, statements: stmts.map(([, ci, a, b]) => ({ curve: ci, a, b })) },
  });
};
dens('bell-vs-flat', 2, [{ kind: 'normal', mu: 3, sd: 1 }, { kind: 'uniform', lo: 0, hi: 6 }], ['Desk A', 'Desk B'], [
  ["Desk A's P&L is between 2 and 4.", 0, 2, 4, 'Within 1 sd of the mean: about 68%.'],
  ["Desk B's P&L is between 2 and 4.", 1, 2, 4, 'Flat density 1/6 over a width of 2: 1/3.'],
  ["Desk A's P&L is above 5.", 0, 5, 50, 'More than 2 sd above the mean: about 2.3%.'],
], 'The curves are the densities of tomorrow\'s P&L (in $k) for two desks. Rank the statements from most to least likely.', SRC.qv);
dens('skewed-tails', 3, [{ kind: 'skew', th: 1 }, { kind: 'normal', mu: 2, sd: 1 }], ['Desk A', 'Desk B'], [
  ["Desk A's P&L is above 4.", 0, 4, 50, 'Right-skewed tail: e^(−4)(1 + 4) ≈ 0.092.'],
  ["Desk B's P&L is above 4.", 1, 4, 50, 'Bell curve, 2 sd above its mean: ≈ 0.023.'],
  ["Desk A's P&L is below 1.", 0, -50, 1, '1 − e^(−1)(1 + 1) ≈ 0.264.'],
], 'The curves are the densities of tomorrow\'s P&L (in $k) for two desks: A is right-skewed, B is bell-shaped. Rank the statements from most to least likely.', SRC.qv);
dens('triangle-centre', 3, [{ kind: 'tri', lo: 0, mode: 2, hi: 6 }], ['X'], [
  ['X is below 2.', 0, -50, 2, 'Left part of the triangle: 2²/(6 × 2) = 1/3.'],
  ['X is between 2 and 3.', 0, 2, 3, 'F(3) − F(2) = (1 − 9/24) − 1/3 = 7/24.'],
  ['X is above 5.', 0, 5, 50, '(6 − 5)²/(6 × 4) = 1/24.'],
], 'The curve is the density of a random quantity X (triangular, peaking at 2). Rank the statements from most to least likely.', SRC.tm);

const scat = (slug, difficulty, pts, stmts, diag, source) => {
  add(slug, 'scatter-regions', difficulty, source, {
    text: `Each point is one trading day: x = signal strength, y = next-day return (in tens of basis points). One day is chosen at random (or from a subgroup, where stated). Rank the statements from most to least likely.`,
    visual: { type: 'scatter', xLabel: 'x: signal strength', yLabel: 'y: next-day return', points: pts, xDomain: [0, 10], yDomain: [0, 10], lines: diag ? [{ slope: 1, intercept: 0, label: 'y = x' }] : [] },
    statements: stmts.map(([text, given, cond]) => { const base = pts.filter(given || (() => true)), hit = base.filter(cond).length; return [text, q(hit, base.length), `${hit} of the ${base.length} ${given ? 'points in the strip' : 'points'} qualify.`]; }),
    compare: 'Count points in each region; divide by the points in scope.', rule: 'Count / scope.', anchor: 'Counting dots as outcomes.',
    hints: ['Shade each region.', 'Conditional: count within the strip.'],
    params: { points: pts, statements: stmts.map(([, given, cond]) => { const sc = pts.map((_, i) => i).filter((i) => !given || given(pts[i])); return { scope: sc, hits: sc.filter((i) => cond(pts[i])) }; }) },
  });
};
const P1 = [[0.7, 1.3], [1.4, 2.6], [1.8, 1.1], [2.3, 3.4], [2.9, 2.2], [3.3, 4.1], [3.6, 2.8], [4.2, 3.7], [4.6, 5.3], [5.1, 4.4], [5.4, 6.2], [5.8, 3.9], [6.3, 6.7], [6.6, 5.4], [7.1, 7.6], [7.4, 6.1], [7.9, 8.3], [8.3, 6.9], [8.7, 8.8], [9.2, 7.4]];
scat('scatter-a', 2, P1, [
  ['A randomly chosen day has x above 5.', null, ([x]) => x > 5],
  ['A randomly chosen day has x above 5 and y above 6.', null, ([x, y]) => x > 5 && y > 6],
  ['A randomly chosen day has y above 8.', null, ([, y]) => y > 8],
], false, SRC.qv);
scat('scatter-b', 3, P1, [
  ['Among days with x above 5, a randomly chosen one has y above 6.', ([x]) => x > 5, ([, y]) => y > 6],
  ['A randomly chosen day has its point above the line y = x.', null, ([x, y]) => y > x],
  ['A randomly chosen day has y above 6.', null, ([, y]) => y > 6],
], true, SRC.qv);
scat('scatter-c', 4, [[1.2, 7.4], [1.7, 6.1], [2.1, 8.2], [2.6, 5.3], [3.1, 6.8], [3.4, 4.2], [3.9, 5.7], [4.3, 3.6], [4.8, 5.1], [5.2, 2.7], [5.7, 4.4], [6.1, 3.3], [6.6, 1.8], [7.2, 3.9], [7.7, 2.4], [8.1, 1.3], [8.6, 2.9], [9.3, 0.8]], [
  ['Among days with x below 4, a randomly chosen one has y above 5.', ([x]) => x < 4, ([, y]) => y > 5],
  ['A randomly chosen day has y above 5.', null, ([, y]) => y > 5],
  ['Among days with x above 6, a randomly chosen one has y above 3.', ([x]) => x > 6, ([, y]) => y > 3],
], false, SRC.qv);

// Markov graphs
const graphItem = (slug, difficulty, nodes, P, mode, stmtNodes, text, source, extra = {}) => {
  const labels = nodes.map((n) => n.id);
  const edges = [];
  P.forEach((r, i) => r.forEach((p, j) => { if (!p.isZero()) edges.push({ from: labels[i], to: labels[j], p: p.toNumber(), label: p.toString() }); }));
  let ps;
  if (mode === 'stationary') ps = stationary(P);
  else { const s0 = extra.start; ps = labels.map((_, j) => P[s0].reduce((acc, p, k) => acc.add(p.mul(P[k][j])), q(0))); }
  add(slug, 'markov-graph', difficulty, source, {
    text, visual: { type: 'graph', nodes, edges },
    statements: stmtNodes.map((j, i) => [extra.texts ? extra.texts[i] : `The signal is at ${labels[j]}.`, ps[j], mode === 'stationary' ? `Long-run fraction at ${labels[j]} from π = πP.` : `Two-step paths from ${labels[extra.start]} into ${labels[j]}.`]),
    intro: extra.intro, compare: extra.compare || 'Order the probabilities.',
    rule: 'Long run: π = πP. Two steps: Σ_k P(i,k)P(k,j).', anchor: 'Flow balance for probability.',
    hints: ['Write flow in = flow out for each node.', 'Arrow counts are not probabilities.'],
    params: { matrix: P.map((r) => r.map((x) => x.toString())), mode, targets: stmtNodes, start: extra.start ?? null },
    keepOrder: extra.keepOrder,
  });
};
{
  // The reported trap: listed by incoming arrows (3, 2, 1), long-run order is the exact reverse.
  const [A, B, C, D] = [0, 1, 2, 3];
  const z = () => q(0);
  const P = Array.from({ length: 4 }, () => [z(), z(), z(), z()]);
  P[A][B] = q(3, 4); P[A][D] = q(1, 4);
  P[B][A] = q(1, 5); P[B][D] = q(4, 5);
  P[C][A] = q(1, 10); P[C][B] = q(1, 3); P[C][D] = q(17, 30);
  P[D][C] = q(5, 6); P[D][A] = q(1, 6);
  const nodes = [{ id: 'A', x: 0.1, y: 0.1 }, { id: 'B', x: 0.9, y: 0.1 }, { id: 'C', x: 0.9, y: 0.9 }, { id: 'D', x: 0.1, y: 0.9 }];
  graphItem('markov-reversal', 5, nodes, P, 'stationary', [A, B, C],
    'A signal hops between four nodes every second, following an outgoing arrow with the probability shown. After a very long time it is observed at a random moment. The statements are listed by how many arrows point into each node. Rank them from most to least likely.', SRC.qv, {
      keepOrder: true,
      texts: ['The signal is at A (3 incoming arrows).', 'The signal is at B (2 incoming arrows).', 'The signal is at C (1 incoming arrow).'],
      intro: [{ say: 'Solve π = πP; ignore the arrow counts.', why: 'C\'s single arrow comes from D with probability 5/6, and D collects most of the flow.' }],
      compare: 'The long-run order C > B > A reverses the displayed order.',
    });
  const P3 = [[q(0), q(1, 2), q(1, 2)], [q(1), q(0), q(0)], [q(1, 3), q(0), q(2, 3)]];
  const n3 = [{ id: 'A', x: 0.5, y: 0.05 }, { id: 'B', x: 0.08, y: 0.95 }, { id: 'C', x: 0.92, y: 0.95 }];
  graphItem('markov-three', 4, n3, P3, 'stationary', [0, 1, 2], 'A signal moves between three nodes every second along the arrows shown. After a very long time it is observed at a random moment. Rank the statements from most to least likely.', SRC.qv);
  const P4 = [[q(0), q(1, 3), q(2, 3)], [q(1, 2), q(1, 2), q(0)], [q(1, 4), q(3, 4), q(0)]];
  graphItem('markov-two-step', 3, n3, P4, 'nstep', [0, 1, 2], 'A signal starts at A and moves each second along an outgoing arrow with the probability shown. Rank the statements about where it is after exactly 2 seconds.', SRC.qv, { start: 0 });
}

export default bank;
