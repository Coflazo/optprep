// Waiting for the first success: one forced path of misses then a hit; "more than k" is
// a block of misses; turn-taking races reduce to one round. Every number shown is computed here.
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

const qpow = (x, k) => { let r = Q.of(1); for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const onK = (p, k) => qpow(Q.of(1).sub(p), k - 1).mul(p); // first success exactly on trial k
const moreThan = (p, k) => qpow(Q.of(1).sub(p), k); // first k trials all fail
const within = (p, k) => Q.of(1).sub(moreThan(p, k));
const starter = (p) => Q.of(1).div(Q.of(2).sub(p)); // first mover wins an alternating race
const SIX = Q.of(1, 6);
const d3 = (x) => (Math.round(x.toNumber() * 1000) / 1000).toFixed(3);
const ord = (k) => `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}`;
const COINS = [[1, 3], [2, 5], [3, 4], [1, 4], [3, 5]].map(([a, b]) => Q.of(a, b));
const KS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default {
  id: 'bto/first-success',
  book: 'bto',
  kind: 'family',
  family: 'first-success',
  title: 'Waiting for the first success',
  summary: 'Write the one path: k − 1 misses, then a hit. "More than k" is k misses. Races reduce to one round.',
  prerequisites: ['bto/at-least-one', 'prob/discrete-distributions'],
  objectives: [
    'Write P(first success on trial k) = (1 − p)^(k−1) p for any p',
    'Translate "more than k trials needed" into "the first k trials all fail" without an off-by-one slip',
    'Solve turn-taking races ("first to throw a six wins") with the one-round ratio, answer 1/(2 − p)',
    'Tell apart "first six on throw k", "a six within k throws" and "more than k throws"',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw a fair die repeatedly. What is the probability that the first six appears on the 3rd throw? Try two approaches.', answer: `(5/6)² × 1/6 = ${onK(SIX, 3)}`, explain: `Throws 1 and 2 must miss, throw 3 must hit. If you got 1/6 you ignored the misses; if you got ${within(SIX, 3)} you computed "a six somewhere in the first 3 throws". The lesson separates the three.` },
    { type: 'text', text: 'Something is repeated until it first succeeds: a die until a six, a coin until a head, two players taking turns until one wins. The question fixes **when** the first success happens ("on the 4th throw"), bounds it ("more than 5 throws needed"), or asks **who** gets it first.' },
    { type: 'list', items: ['"A die is thrown repeatedly. What is the probability that the first six appears on the third throw?"', '"What is the chance you need more than 4 throws to get a six?"', '"Two players take turns throwing a die; the first to throw a six wins. What is the chance the starter wins?"', '"You throw a die until the first six. Probability it comes on an even-numbered throw?"'] },
    { type: 'text', text: 'Not this lesson: "at least one six in 4 throws" with no mention of which throw (bto/at-least-one), and the **expected** number of throws (bto/expected-waiting).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['A coin is flipped until the first head: probability it takes exactly 5 flips', 'A coin is flipped 5 times: probability of at least one head', 'A coin is flipped 5 times: probability of exactly 2 heads', 'A coin is flipped until the first head: expected number of flips'], answer: 0, traps: { 1: 'an at-least-one question: no position is fixed', 2: 'a fixed-length count: bto/coin-sequences', 3: 'an expectation: bto/expected-waiting' }, explain: 'The first head on flip 5 fixes the position of the first success.' },
    ] },

    S('why'),
    { type: 'text', text: 'Waiting questions look open-ended because the process could run forever. They are not: the event "first success on trial k" is one forced path, and "who wins a race" collapses to one round. Once you write the path down, a waiting question is a single product. The traps are all about positions: one miss too many or too few, or answering "within k" when the question says "on k".' },

    S('anchor'),
    { type: 'text', text: 'From bto/at-least-one you know that k independent tries all miss with (1 − p)^k, for example no six in 3 throws with (5/6)³. Waiting for the first success is that fact with **one change**: after the block of misses comes a hit at a **fixed** position, so you multiply one more factor, p.' },
    { type: 'check', scope: 'a block of misses: (1 − p)^k', questions: [
      { make: (rng) => { const k = rng.int(2, 4); return mc(rng, `A die is thrown ${k} times. P(no six in any of them)?`, moreThan(SIX, k).toString(), [[Q.of(1).sub(Q.of(k, 6)).toString(), 'subtracted 1/6 per throw'], [within(SIX, k).toString(), 'answered "at least one six"'], [qpow(SIX, k).toString(), 'answered "a six every time"']], `(5/6)^${k} = ${moreThan(SIX, k)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the throws as a tree that stops at the first six. Every branch that hits stops; every miss continues. The first six on throw 3 is the one path miss, miss, hit.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: [
      { p: '1/6', label: 'throw 1 six: stop' },
      { p: '5/6', label: 'throw 1 miss', children: [
        { p: '1/6', label: 'throw 2 six: stop' },
        { p: '5/6', label: 'throw 2 miss', children: [{ p: '1/6', label: 'throw 3 six: first six on 3', mark: true }, { p: '5/6', label: 'throw 3 miss: keep going' }] },
      ] },
    ] }, total: onK(SIX, 3).toString() }, caption: `One marked path: 5/6 × 5/6 × 1/6 = ${onK(SIX, 3)}. The bottom leaf, three misses, is "more than 3 throws needed": (5/6)³ = ${moreThan(SIX, 3)}.` },
    { type: 'check', scope: 'the stopping tree', questions: [
      { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `A die is thrown until the first six. P(first six on the ${ord(k)} throw)?`, onK(SIX, k).toString(), [[SIX.toString(), 'ignored the misses before it'], [moreThan(SIX, k - 1).toString(), 'forgot the final 1/6 for the six itself'], [onK(SIX, k + 1).toString(), `used ${k} misses instead of ${k - 1}`], [within(SIX, k).toString(), `computed a six somewhere in the first ${k} throws`]], `(5/6)^${k - 1} × 1/6 = ${onK(SIX, k)}.`); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'P(first six on throw k)', xLabel: 'throw k', yLabel: 'probability', categories: KS.map(String), series: [{ name: 'P', values: KS.map((k) => Math.round(onK(SIX, k).toNumber() * 1000) / 1000) }], valueLabels: true }, caption: 'Each bar is 5/6 of the one before: the first six is always most likely on throw 1, and every later throw needs one more miss. The bars add up to 1 over all k.' },
    { type: 'check', scope: 'the ratio between bars', questions: [
      { type: 'choice', q: 'A biased coin shows heads with 1/3. P(first head on flip 5) divided by P(first head on flip 4)?', options: ['2/3', '1/3', '1', '3/2'], answer: 0, traps: { 1: 'used the success chance as the ratio', 2: 'thought every position is equally likely', 3: 'inverted the ratio: later positions are less likely' }, explain: 'One more miss: each position is (1 − p) times the one before.' },
    ] },
    { type: 'text', text: 'For two players taking turns, group the throws into **rounds** (Ann, then Bob). A round either ends with Ann\'s six, ends with Bob\'s six, or ends with two misses and a fresh round that looks exactly the same.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'round', children: [
      { p: '1/6', label: 'Ann six: Ann wins', mark: true },
      { p: '5/6', label: 'Ann miss', children: [{ p: '1/6', label: 'Bob six: Bob wins' }, { p: '5/6', label: 'both miss: same round again' }] },
    ] }, total: '1/6' }, caption: `Inside one round Ann wins with 1/6 and Bob with 5/6 × 1/6 = ${SIX.mul(Q.of(5, 6))}. A repeat round changes nothing, so the game is decided in the ratio 1/6 : 5/36 = 6 : 5.` },
    { type: 'check', scope: 'one round decides the ratio', questions: [
      { type: 'choice', q: 'Ann and Bob alternate throwing a die, Ann first; first six wins. P(Ann wins)?', options: [starter(SIX).toString(), '1/2', '1/6', Q.of(1).sub(starter(SIX)).toString()], answer: 0, traps: { 1: 'ignored that Ann gets the first chance', 2: 'only counted Ann\'s first throw', 3: 'answered Bob\'s chance' }, explain: `Ratio 6 : 5, so Ann wins with ${starter(SIX)}.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: '"The first success is on trial k" forces the path: fail, fail, …, fail (k − 1 times), then succeed.', why: '"First" forbids any earlier success, so every earlier trial is a forced miss. There is exactly one pattern.',
        checks: [
          { type: 'choice', q: 'The first head is on flip 4. Which pattern is forced?', options: ['T, T, T, H', 'any three flips then H', 'H on flip 4, the rest anything', 'T, T, T, T, H'], answer: 0, traps: { 1: 'an earlier head would make flip 4 not the first', 2: 'same slip: earlier flips must be tails', 3: 'one tail too many: that is flip 5' }, explain: 'Three tails, then the head.' },
        ] },
      { say: 'Multiply along the path: P(first success on k) = (1 − p)^{k−1} × p.', why: 'The trials are independent, so the chance of one fixed pattern is the product of its factors.',
        checks: [
          { make: (rng) => { const p = rng.pick(COINS); const k = rng.int(2, 4); return mc(rng, `A coin shows heads with ${p}. P(first head on flip ${k})?`, onK(p, k).toString(), [[p.toString(), 'ignored the earlier tails'], [qpow(Q.of(1).sub(p), k - 1).toString(), 'forgot the factor for the head'], [onK(p, k + 1).toString(), 'one tail too many'], [qpow(p, k).toString(), 'multiplied the head chance every flip']], `(${Q.of(1).sub(p)})^${k - 1} × ${p} = ${onK(p, k)}.`); } },
        ] },
      { say: '"More than k trials needed" means the first k trials all fail: (1 − p)^k. Nothing is said about trial k + 1.', why: 'Test the boundary: a success on trial k means exactly k trials were needed, not more. So trials 1 to k must all fail.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 6); return mc(rng, `A die is thrown until a six. P(more than ${k} throws are needed)?`, moreThan(SIX, k).toString(), [[moreThan(SIX, k - 1).toString(), `used ${k - 1} misses: a six on throw ${k} means exactly ${k} throws, not more`], [within(SIX, k).toString(), 'answered the complement'], [onK(SIX, k + 1).toString(), `required the six exactly on throw ${k + 1}`]], `Throws 1 to ${k} all miss: (5/6)^${k} = ${moreThan(SIX, k)}.`); } },
        ] },
      { say: '"Within k trials" (at most k needed) is the complement: 1 − (1 − p)^k.', why: 'Either the first k trials contain a success or they do not; this is the at-least-one rule.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 5); return { type: 'number', q: `A die is thrown until a six. P(at most ${k} throws are needed), to 3 decimals?`, answer: Math.round(within(SIX, k).toNumber() * 1000) / 1000, tolerance: 0.0015, hints: [`Complement: more than ${k} throws.`, `(5/6)^${k} ≈ ${d3(moreThan(SIX, k))}.`], explain: `1 − (5/6)^${k} ≈ ${d3(within(SIX, k))}.` }; } },
        ] },
      { say: 'Turn-taking race: inside one round the starter wins with p and the second player with (1 − p)p. Repeat rounds do not change the ratio, so P(starter) = p / (p + (1 − p)p) = 1/(2 − p).', why: 'A round with two misses returns the game to its start, so only the two deciding outcomes of a round matter.',
        checks: [
          { make: (rng) => { const p = rng.pick([Q.of(1, 2), Q.of(1, 3), Q.of(1, 4), Q.of(1, 6)]); return mc(rng, `Two players alternate; each try succeeds with ${p}; first success wins. P(the starter wins)?`, starter(p).toString(), [['1/2', 'ignored the starter\'s head start'], [p.toString(), 'only counted the first try'], [Q.of(1).sub(starter(p)).toString(), 'answered the second player']], `1/(2 − ${p}) = ${starter(p)}.`); } },
        ] },
      { say: 'The first six on an even-numbered throw is the second player\'s side of the same race: 1 − 6/11 = 5/11.', why: 'Odd throws are the starter\'s, even throws the second player\'s. Relabelling the throws does not change the maths.',
        checks: [
          { type: 'choice', q: 'A coin (heads 1/2) is flipped until the first head. P(it comes on an even-numbered flip)?', options: [Q.of(1).sub(starter(Q.of(1, 2))).toString(), '1/2', starter(Q.of(1, 2)).toString(), '1/4'], answer: 0, traps: { 1: 'odd and even flips are not symmetric: flip 1 is odd', 2: 'answered the odd side', 3: 'only counted flip 2' }, explain: `Starter share 1/(2 − 1/2) = ${starter(Q.of(1, 2))}; the even side gets ${Q.of(1).sub(starter(Q.of(1, 2)))}.` },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why can you ignore rounds where both players miss when finding who wins a turn-taking race?', model: 'A round of two misses puts the game back exactly where it started, so whatever happens next is a copy of the original game. The winner is decided in the first round that has a six, and in any such round the starter wins with p and the second player with (1 − p)p. The ratio of those two decides the game.', points: ['two misses reset the game to the same state', 'the winner is decided in the first deciding round', 'P(starter) = p / (p + (1 − p)p) = 1/(2 − p)'] },

    S('worked'),
    { type: 'worked', family: 'first-success', section: 'bto', difficulty: 1, seed: 'd', intro: 'The first six at a fixed throw. Try it before opening the solution.' },
    { type: 'worked', family: 'first-success', section: 'bto', difficulty: 2, seed: 'b', fade: 1, intro: 'An odd-or-even race. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Without computing: is the first six more likely on throw 1 or on throw 2? And is it more likely on throw 1 than on all even throws together?', answer: `Throw 1 beats throw 2: 1/6 against ${onK(SIX, 2)}. But all even throws together give ${Q.of(1).sub(starter(SIX))} ≈ ${d3(Q.of(1).sub(starter(SIX)))}, much more than 1/6.`, explain: 'Each single later throw is less likely, but there are infinitely many of them.' },

    S('traps'),
    { type: 'traps', family: 'first-success', section: 'bto', extra: [
      { belief: 'P(first six on throw k) = 1/6, since every throw has a 1/6 chance.', fix: 'That is P(six on throw k). "First" also needs k − 1 misses before it.' },
      { belief: '"More than k throws" means k − 1 misses.', fix: 'Boundary test: a six on throw k means exactly k throws. So k misses are needed.' },
      { belief: 'Turn-taking races are fair: 1/2 each.', fix: 'The starter gets the first chance in every round: 1/(2 − p) > 1/2.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(more than 3 throws are needed to get the first six). One step is wrong.', steps: [
      'More than 3 throws needed means the first six comes on throw 4 or later.',
      'So throws 1 to 4 must all miss.',
      'P = (5/6)⁴.',
      `P = ${moreThan(SIX, 4)} ≈ ${d3(moreThan(SIX, 4))}.`,
    ], errorStep: 1, explain: `A six on throw 4 is allowed ("4 or later"). Only throws 1 to 3 must miss: (5/6)³ = ${moreThan(SIX, 3)} ≈ ${d3(moreThan(SIX, 3))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `A candidate answers P(first six on throw 4) = ${qpow(Q.of(5, 6), 3)}. Which belief?`, options: ['Forgot the final 1/6 for the six itself', 'One miss too many', '"Within 4" instead of "on 4"'], answer: 0, explain: `${qpow(Q.of(5, 6), 3)} is three misses only. Correct: ${onK(SIX, 4)}.` },
      { type: 'choice', q: `Another answers ${within(SIX, 4)} for the same question. Which belief?`, options: ['"A six within 4 throws" instead of "the first six on throw 4"', 'Forgot the final 1/6', 'The race formula'], answer: 0, explain: `1 − (5/6)⁴ counts a six on any of the first 4 throws.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Race values to know: die (p = 1/6) starter wins ${starter(SIX)} ≈ ${d3(starter(SIX))}; fair coin starter wins ${starter(Q.of(1, 2))}. The formula 1/(2 − p) is one subtraction and one division.` },
    { type: 'callout', tone: 'speed', text: `Sanity checks: P(first success on k) always falls as k grows (ratio 1 − p). The three events "on k", "within k" and "more than k" satisfy within(k) + more than(k) = 1. The time you have is ${SECTIONS.bto.exam.perItemSeconds} seconds; a waiting item should take 20.` },
    { type: 'check', scope: 'race values and the sanity identity', questions: [
      { make: (rng) => { const k = rng.int(2, 5); return mc(rng, `A die is thrown until a six. P(within ${k} throws) + P(more than ${k} throws) equals:`, '1', [[`${onK(SIX, k)}`, 'confused one of them with "exactly on throw k"'], ['1/2', 'thought the two are halves']], 'They are complements: either a six has come by throw k or it has not.'); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'First success on k: (1 − p)^(k−1) p. More than k needed: (1 − p)^k. Within k: 1 − (1 − p)^k. Starter of an alternating race: 1/(2 − p).' },

    S('contrast'),
    { type: 'compare', columns: ['Event (die, p = 1/6)', 'Path', 'Formula', 'k = 3'], rows: [
      ['first six on throw k', 'k − 1 misses, then a six', '(5/6)^(k−1) × 1/6', onK(SIX, 3).toString()],
      ['more than k throws needed', 'k misses', '(5/6)^k', moreThan(SIX, 3).toString()],
      ['a six within k throws', 'not all k miss', '1 − (5/6)^k', within(SIX, 3).toString()],
      ['a six on throw k (first or not)', 'throw k only', '1/6', '1/6'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: k = 1 gives p (no misses needed). If p = 1 the first success is always trial 1. "More than 0 trials" is certain: (1 − p)⁰ = 1. In a race with p = 1 the starter always wins, and 1/(2 − 1) = 1 agrees.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: this is the geometric distribution. Its mean 1/p is the expected wait (bto/expected-waiting). Coin patterns such as HH replace the single success with a pattern (bto/pattern-waiting), and "first to k wins" series extend the one-round race to k wins (bto/race-to-k).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'A die. Which is largest?', options: ['more than 3 throws needed', 'a six within 3 throws', 'first six on throw 3', 'a six on throw 3'], answer: 0, traps: { 1: `three throws are not enough to make a six likely: ${d3(within(SIX, 3))} against ${d3(moreThan(SIX, 3))}`, 2: 'one fixed path: the smallest of these', 3: 'one throw, 1/6' }, explain: `Within 3: ${d3(within(SIX, 3))}; more than 3: ${d3(moreThan(SIX, 3))}; on throw 3: ${d3(onK(SIX, 3))}; six on throw 3: ${d3(SIX)}.` },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'first-success', section: 'bto', count: 3 },
  ],
};
