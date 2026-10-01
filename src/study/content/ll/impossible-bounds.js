// Likelihood List family: impossible and certain statements. Check hard bounds before estimating:
// the maximum achievable count, what is already guaranteed, parity, and pigeonhole can pin a
// statement to exactly 0 or 1. Every number is computed here.
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const binGe = (n, k, p) => { let d = [1]; for (let i = 0; i < n; i++) { const nx = Array(d.length + 1).fill(0); d.forEach((v, j) => { nx[j] += v * (1 - p); nx[j + 1] += v * p; }); d = nx; } return d.slice(Math.max(0, k)).reduce((a, b) => a + b, 0); };
const FT = { made: 45, n: 50, k: 50, p: 0.9 };
FT.tot = FT.n + FT.k; FT.max = FT.made + FT.k;
const HI = 96, LO = 45, MID = 45; // targets in % of the total shots, and the "next shots" threshold
const needHi = Math.ceil((HI * FT.tot) / 100), needLo = Math.ceil((LO * FT.tot) / 100);
const PMID = binGe(FT.k, MID, FT.p);
const N6 = 6;
const neg = (v) => (v < 0 ? `−${-v}` : String(v));

// Free-throw generator for the checks: returns an impossible or a certain target.
const shots = (rng) => { const n = rng.pick([20, 40, 50, 100]), made = n - rng.int(2, Math.floor(n / 5)), k = rng.pick([10, 20, 50]); return { n, made, k, tot: n + k, max: made + k }; };
// A triple with one impossible, one certain and one uncertain statement, told as a story.
const bounded = (rng, s, story) => {
  const hi = Math.ceil((1000 * (s.max + 1)) / s.tot) / 10, lo = Math.floor((1000 * s.made) / s.tot) / 10, m = Math.round(0.8 * s.k), p = rng.pick([0.7, 0.8, 0.9]);
  return rank(rng, `${story.intro(s, p)} Rank from most to least likely.`, [[story.fin(s, hi), 0], [story.next(m, s.k), binGe(s.k, m, p)], [story.fin(s, lo), 1]],
    `${hi}% of ${s.tot} needs more than the ${s.made} + ${s.k} = ${s.max} reachable: 0. ${s.made}/${s.tot} already meets ${lo}%: 1. The middle statement needs no value.`);
};
const shooter = { intro: (s, p) => `A player has made ${s.made} of ${s.n} free throws and takes ${s.k} more, each going in with probability ${p}.`, fin: (s, x) => `She finishes the ${s.tot} shots with at least ${x}% made.`, next: (m, k) => `She makes at least ${m} of the next ${k}.` };
const seller = { intro: (s, p) => `A salesperson has closed ${s.made} of ${s.n} calls this month and has ${s.k} calls left, each closing with probability ${p}.`, fin: (s, x) => `The month ends with at least ${x}% of its ${s.tot} calls closed.`, next: (m, k) => `At least ${m} of the ${k} remaining calls close.` };

// Think-aloud numbers.
const TK = { made: 72, n: 80, k: 20, p: 0.9, hi: 93, lo: 70 };
TK.tot = TK.n + TK.k; TK.max = TK.made + TK.k; TK.needHi = Math.ceil((TK.hi * TK.tot) / 100); TK.needLo = Math.ceil((TK.lo * TK.tot) / 100); TK.m = 18;
// Variation numbers: (a) lowered to the maximum; (c) raised past what is guaranteed; one more make with a higher target.
const V = { edgePct: (100 * FT.max) / FT.tot, edgeP: FT.p ** FT.k, cPct: 91 };
V.cNeed = Math.ceil((V.cPct * FT.tot) / 100); V.cP = binGe(FT.k, V.cNeed - FT.made, FT.p); V.fNeed = Math.ceil(((HI + 1) * FT.tot) / 100);
if (!(TK.needHi > TK.max && TK.needLo <= TK.made && V.edgeP < PMID && V.cP < PMID && FT.max + 1 >= needHi && V.fNeed > FT.max + 1)) throw new Error('impossible-bounds: prose claims no longer hold');

export default {
  id: 'll/impossible-bounds',
  book: 'll',
  kind: 'family',
  family: 'impossible-bounds',
  title: 'Impossible and certain statements',
  summary: 'Before estimating, test hard bounds: maximum achievable, already guaranteed, parity, pigeonhole. They pin statements to 0 or 1.',
  prerequisites: ['ll/compare-without-computing', 'prob/counting'],
  objectives: [
    'Test a statement against the maximum achievable count and against what is already guaranteed',
    'Use parity and pigeonhole to prove a statement impossible or certain',
    'Tell impossible (exactly 0) from merely very unlikely',
    'Rank a triple with a certain and an impossible statement without computing the middle one',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a basketball player has made ${FT.made} of her first ${FT.n} free throws. She takes ${FT.k} more, making each with probability ${FT.p}, independently. Rank: (a) she finishes the ${FT.tot} shots with at least ${HI}% made, (b) she makes at least ${MID} of the next ${FT.k}, (c) she finishes with at least ${LO}% made. Two approaches, then an order.`, answer: `(c) certain (1) > (b) ≈ ${dp(PMID)} > (a) impossible (0)`, explain: `(a) needs ${needHi} makes; she can reach at most ${FT.made} + ${FT.k} = ${FT.max}. (c) needs ${needLo}, and she already has ${FT.made}. Only (b) is uncertain, and with one statement between a 1 and a 0 you never need its value.`,
      attempts: [
        { id: 'streak', label: 'Judge (a) by her accuracy', approach: `You called (a) unlikely but possible: a ${FT.p * 100}% shooter can get hot.`, breaksAt: `${HI}% of ${FT.tot} needs ${needHi} makes, and ${FT.made} + ${FT.k} = ${FT.max} is the most she can have.` },
        { id: 'form', label: 'Estimate (c) from her form', approach: `You put (c) near ${FT.p} because she makes about ${FT.p * 100}% of her shots.`, breaksAt: `Her ${FT.made} makes already meet ${LO}% of ${FT.tot}, even if she misses every remaining shot.` },
        { id: 'compute', label: 'Compute all three first', approach: 'You worked out the binomial tail for (b) before writing any order.', breaksAt: 'With one certain and one impossible statement in the triple, (b) goes in the middle whatever its value.' },
      ] },
    { type: 'text', text: 'The prompt is a story with numbers (shots made so far, dice, coin flips, cards dealt) and three statements, one of which **sounds reasonable but cannot happen** or **sounds uncertain but must happen**. A good shooter "reaching 96%", a coin whose heads minus tails is odd, five cards in four suits.' },
    { type: 'list', items: ['**Maximum achievable**: more successes needed than trials left.', '**Already guaranteed**: the target is met even if everything else fails.', '**Parity**: a difference or sum that can only be even (or odd).', '**Pigeonhole**: more items than boxes forces a repeat.'] },
    { type: 'text', text: 'Not this lesson: statements that are merely very unlikely (100 makes in a row). Those are positive, just small. Here a counting argument gives exactly 0 or exactly 1.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, 'Which statement is impossible (probability exactly 0)?', 'Two dice show a sum of 13', [['A fair coin lands heads 20 times in a row', 'very unlikely, but possible: (1/2)^20 is above 0'], ['A 5-card hand is a royal flush', 'rare, but some hands are royal flushes'], ['Three dice all show six', 'possible: 1/216']], 'The largest sum of two dice is 12.', { at: 1 }),
    ] },

    S('why'),
    { type: 'text', text: 'A reported Likelihood List item hides an impossible statement behind a plausible story (a strong shooter "reaching" a percentage that the remaining shots cannot deliver). Bounds settle such statements exactly and instantly, and they fix the ends of the order so the rest needs little or no arithmetic. They are also the cheapest check in the whole section, so they come first on every item, not only on the ones that look like this.' },

    S('anchor'),
    { type: 'text', text: 'You know that probabilities live in [0, 1] and that P = favourable / total for equally likely outcomes. The one change: if a counting argument shows the favourable set is **empty**, P = 0; if it is **everything**, P = 1. No estimate is needed at either end, and no estimate could beat it: an exact 0 or 1 is the one probability you know perfectly.' },
    { type: 'check', scope: 'empty set → 0, everything → 1', questions: [
      { make: (rng) => { const n = rng.int(3, 6); return mc(rng, `${n} dice are thrown. P(the sum is at most ${6 * n})?`, '1', [['0', 'mixed up the largest possible sum with an impossible one'], [dp(1 - 1 / 6 ** n, 4), `subtracted the all-sixes outcome, but a sum of ${6 * n} is still "at most ${6 * n}"`], ['1/2', 'guessed without checking the largest possible sum']], `The largest sum is ${6 * n}, so every outcome qualifies.`); } },
    ] },

    S('picture'),
    { type: 'text', text: `The free-throw story on a number line of final makes. Whatever happens, she ends between ${FT.made} (misses everything) and ${FT.max} (makes everything).` },
    { type: 'diagram', diagram: 'numberline', spec: { min: 40, max: 100, step: 10, barriers: [FT.made, FT.max], marks: [{ x: needLo, label: `${LO}% needs ${needLo}` }, { x: needHi, label: `${HI}% needs ${needHi}` }] }, caption: `The reachable range is ${FT.made} to ${FT.max} makes (between the bars). ${LO}% needs ${needLo}: at or below the bottom of the range, so already guaranteed. ${HI}% needs ${needHi}: above the range, so impossible.` },
    { type: 'check', scope: 'the reachable range', questions: [
      { make: (rng) => { const s = shots(rng), pct = Math.ceil((1000 * (s.max + rng.int(1, 3))) / s.tot) / 10; const need = Math.ceil((pct * s.tot) / 100 - 1e-9); return mc(rng, `${s.made} of ${s.n} made, ${s.k} more to shoot. Can she finish the ${s.tot} with at least ${pct}%?`, 'No: impossible', [['Yes, but unlikely', `did not compare with the maximum: ${need} needed, ${s.max} possible`], ['Yes, certainly', 'confused the target with a guaranteed one'], ['It depends on her accuracy', 'accuracy cannot beat a count bound']], `${pct}% of ${s.tot} needs ${need} makes; at most ${s.made} + ${s.k} = ${s.max}.`, { hints: ['Makes needed: percentage × total shots.', 'Makes possible: made + remaining.'] }); } },
    ] },
    { type: 'text', text: 'Dice: every outcome has a sum from 2 to 12. A statement about sum 13 covers no cell; a statement about sum at most 12 covers every cell.' },
    { type: 'diagram', diagram: 'grid', spec: { rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => r + c + 2)), highlight: Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6), i % 6]), count: 36 }, caption: '"Sum at most 12" highlights all 36 cells: certain. "Sum is 13" or "sum is 1" would highlight none: impossible.' },
    { type: 'check', scope: 'bounds on sums', questions: [
      { make: (rng) => { const n = rng.int(2, 4), bad = rng.pick([n - 1, 6 * n + 1]); return mc(rng, `${n} dice are thrown. P(the sum is ${bad})?`, '0', [[`1/${6 ** n}`, `treated ${bad} as one extreme outcome, but the sums run from ${n} to ${6 * n}`], ['very small but positive', 'did not check the range of possible sums'], ['1/2', 'guessed']], `Sums run from ${n} to ${6 * n}.`); } },
    ] },
    { type: 'text', text: `Parity: with ${N6} flips, heads − tails = 2 × heads − ${N6}, always even.` },
    { type: 'diagram', diagram: 'table', spec: { caption: `${N6} flips`, columns: ['heads', 'tails', 'heads − tails'], rows: Array.from({ length: N6 + 1 }, (_, h) => [h, N6 - h, neg(2 * h - N6)]) }, caption: `Every difference is even: ${Array.from({ length: N6 + 1 }, (_, h) => neg(2 * h - N6)).join(', ')}. "Heads minus tails is 3" can never happen with ${N6} flips.` },
    { type: 'check', scope: 'parity', questions: [
      { make: (rng) => { const n = rng.pick([7, 8, 9, 10, 11, 12]), d = rng.pick([1, 2, 3, 4]); const ok = (n - d) % 2 === 0 && d <= n; return mc(rng, `${n} flips. Can heads − tails equal exactly ${d}?`, ok ? 'Yes' : 'No: impossible', [[ok ? 'No: impossible' : 'Yes', ok ? `${d} has the same parity as ${n}, so it is reachable` : `heads − tails = 2 × heads − ${n} has the parity of ${n}`]], ok ? `heads = ${(n + d) / 2} gives ${d}.` : `${n} is ${n % 2 ? 'odd' : 'even'} and ${d} is ${d % 2 ? 'odd' : 'even'}.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: 'Four bounds, then the ordering move. The bounds take seconds each and are exact; the ordering move is why they save so much time, since a pinned statement never needs a second look.' },
    { type: 'steps', steps: [
      { answers: 'streak', say: 'Maximum achievable: the most successes possible is (successes so far) + (trials left). If the statement needs more, P = 0, however good the player is.', why: 'No sequence of outcomes can create more successes than there are trials.',
        checks: [{ make: (rng) => { const s = shots(rng); return { type: 'number', q: `${s.made} of ${s.n} made, ${s.k} shots left. What is the highest final percentage she can reach? (1 decimal)`, answer: Math.round((1000 * s.max) / s.tot) / 10, tolerance: 0.051, hints: ['Makes: made + all remaining.', `Divide by ${s.tot}.`], explain: `${s.max}/${s.tot} = ${dp((100 * s.max) / s.tot, 1)}%.` }; } }] },
      { answers: 'form', say: 'Already guaranteed: if the successes so far already meet the target over the full total (even with every remaining trial failing), P = 1.', why: 'The worst case still qualifies, so every case does.',
        checks: [{ make: (rng) => { const s = shots(rng); const worst = Math.floor((1000 * s.made) / s.tot) / 10; return { type: 'number', q: `${s.made} of ${s.n} made, ${s.k} shots left. Up to what final percentage is she guaranteed, even if she misses everything? (1 decimal, round down)`, answer: worst, tolerance: 0.051, hints: ['Worst case: no more makes.', `${s.made} / ${s.tot}.`], explain: `${s.made}/${s.tot} = ${dp((100 * s.made) / s.tot, 2)}%: any target up to that is certain.` }; } }] },
      { say: 'Parity and pigeonhole: heads − tails has the parity of n; putting more items than boxes forces a shared box. Wrong parity → 0; more items than boxes → 1.', why: 'Both are facts about every outcome, so they give exact answers.',
        checks: [{ make: (rng) => { const k = rng.int(5, 9); return mc(rng, `${k} cards are dealt. P(at least two share a suit)?`, '1', [['3/4', 'estimated a high chance instead of noticing the repeat is forced'], ['12/51', 'used the two-card same-suit fact'], ['0', 'confused "share a suit" with "all four suits"']], `${k} cards into 4 suits: some suit gets two.`); } }] },
      { answers: 'compute', say: 'Order: certain statements first, impossible ones last. With one 1 and one 0 in the triple, the middle statement needs no value at all.', why: 'Nothing beats probability 1 and nothing loses to 0, whatever the middle is.',
        checks: [{ hinge: true, make: (rng) => { const n = rng.pick([8, 10, 12]), d = rng.pick([1, 3, 5]); return mc(rng, `${n} flips. Statements: (i) heads − tails is exactly ${d}, (ii) exactly ${n / 2} heads, (iii) at least one head or at least one tail. What must you compute to rank them?`, 'Nothing: (iii) is certain and (i) impossible', [[`Only (ii), as C(${n}, ${n / 2})/2^${n}, to place it`, 'computed the middle statement, which cannot change the order'], ['All three probabilities, then sort them', 'did not use the bounds'], ['Only (i), with a normal approximation', 'missed the parity bound: (i) is exactly 0']], `Parity makes (i) impossible; (iii) is always true, so (ii) sits between them.`); } }] },
    ] },
    { type: 'explain', prompt: 'Explain why "she finishes with at least 96%" can be impossible for a 90% shooter, while "she makes her next 50 shots" is only very unlikely.', model: 'A percentage target over a fixed number of shots is a count: 96% of 100 needs 96 makes. If she has 45 and only 50 shots remain, the most she can have is 95, so no sequence of outcomes reaches the target: probability 0. Making 50 in a row is one possible sequence with probability 0.9^50, tiny but positive.', points: ['Convert the percentage into a count of makes', 'Compare with the maximum achievable count', 'Impossible means no outcome qualifies; unlikely means few do'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'impossible-bounds', difficulty: 2, seed: 'a', explainAt: [1, 3], intro: 'Dice, coins or cards with a bound hidden in one statement. Find it first. Try it before opening the solution.' },
    { type: 'worked', section: 'll', family: 'impossible-bounds', difficulty: 3, seed: 'b', fade: 1, intro: 'The free-throw story. The bounds are worked out; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: '90 of 100 made; 100 more shots. Can she finish at 96%?', answer: `No: 96% of 200 = ${(96 * 200) / 100} makes, but at most ${90 + 100} are possible.`, explain: 'Convert to counts, compare with the maximum.' },

    S('traps'),
    { type: 'text', text: 'The traps come from trusting the story (a good shooter "should" reach a high percentage) and from treating a tiny probability as zero, or a zero as tiny. Both errors vanish once every percentage is turned into a count and compared with what the remaining trials can still deliver.' },
    { type: 'traps', section: 'll', family: 'impossible-bounds', extra: [
      { belief: 'A 90% shooter can finish at 96% if she gets hot.', fix: 'Convert to makes: if the target needs more makes than shots left allow, no streak helps.' },
      { belief: 'Very unlikely events are impossible.', fix: 'Only a hard bound gives exactly 0; 0.9^100 is tiny but positive, and still ranks above an impossible statement.' },
      { belief: 'heads − tails can be any number from −n to n.', fix: 'It moves in steps of 2: it always has the parity of n.' },
      { belief: 'The middle statement must be computed to rank the triple.', fix: 'With a 1 and a 0 in the triple, the middle is between them whatever its value.' },
    ] },
    { type: 'erroneous', problem: `A candidate ranks the challenge statements (${FT.made} of ${FT.n} made, ${FT.k} more at ${FT.p}). One step is wrong.`, steps: [
      `At least ${LO}% needs ${needLo} makes; she already has ${FT.made}: certain.`,
      `At least ${HI}% needs ${needHi} makes; she is a ${FT.p * 100}% shooter, so it is unlikely but possible.`,
      `At least ${MID} of the next ${FT.k}: a binomial tail, about ${dp(PMID, 2)}.`,
      `Order: at least ${LO}% > next ${FT.k} > at least ${HI}%.`,
    ], errorStep: 1, explain: `She can reach at most ${FT.max} makes, fewer than the ${needHi} needed: the statement is impossible, not unlikely. Here the order survives, but only by luck; with a tiny positive middle statement it would not.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, 'Which ranks higher: "a fair coin shows heads 30 times in a row" or "heads minus tails is exactly 1 in 10 flips"?', '30 heads in a row', [['heads minus tails is 1 in 10 flips', 'missed the parity bound: that statement is exactly 0'], ['they tie at 0', 'treated a tiny probability as zero: (1/2)^30 is positive']], `(1/2)^30 > 0, while heads − tails with 10 flips is always even.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Run the four bounds on every statement before any estimate: max achievable, already guaranteed, parity, pigeonhole. Each takes a few seconds, and a hit fixes an end of the order.' },
    { type: 'callout', tone: 'speed', text: `If the triple has one certain and one impossible statement, submit without computing the middle. Budget: ${LL.exam.perItemSeconds} seconds; these items can take 15.` },
    { type: 'check', scope: 'bounds first', questions: [
      { make: (rng) => again(() => { const s = shots(rng); const pct = Math.floor((1000 * s.made) / s.tot / 5) * 5 / 10; if (pct <= 0) return null; return mc(rng, `${s.made} of ${s.n} made, ${s.k} more to shoot. P(she finishes the ${s.tot} with at least ${pct}%)?`, '1', [['about 0.9', 'estimated from her accuracy instead of checking what is already guaranteed'], ['0', 'confused a guaranteed target with an impossible one'], ['1/2', 'guessed']], `${s.made}/${s.tot} = ${dp((100 * s.made) / s.tot, 1)}% ≥ ${pct}% even if she misses everything.`); }) },
    ] },

    { type: 'thinkaloud', problem: `A player has made ${TK.made} of ${TK.n} free throws and takes ${TK.k} more at ${TK.p}. Rank: (a) she finishes the ${TK.tot} with at least ${TK.hi}% made, (b) she makes at least ${TK.m} of the next ${TK.k}, (c) she finishes with at least ${TK.lo}% made.`, lines: [
      { t: 0, say: 'Made so far, shots left, percentage targets: bounds first, before any estimate.' },
      { t: 4, say: `(a): ${TK.hi}% of ${TK.tot} needs ${TK.needHi} makes.` },
      { t: 8, say: `She shoots ${TK.p * 100}%, so ${TK.hi}% is a stretch, but a hot streak could do it. Unlikely, not zero.`, slip: true },
      { t: 13, say: `No: she has ${TK.made} and ${TK.k} shots left, so ${TK.max} makes at most. ${TK.needHi} is out of reach: exactly 0. Streaks do not matter.` },
      { t: 19, say: `(c): ${TK.lo}% needs ${TK.needLo}; she already has ${TK.made}. Certain even if she misses everything.` },
      { t: 24, say: 'One 1 and one 0, so (b) goes in the middle. I do not compute it.' },
      { t: 27, say: `Order (c) > (b) > (a), with ${LL.exam.perItemSeconds - 27} seconds to spare.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine on fresh numbers', questions: [{ make: (rng) => bounded(rng, shots(rng), shooter) }] },

    S('rule'),
    { type: 'text', text: 'Four bounds, a few seconds each, before any estimate. A hit is exact and pins one end of the order; two hits settle the whole item.' },
    { type: 'callout', tone: 'rule', text: 'Bounds first: more successes than trials left → 0; already guaranteed → 1; wrong parity → 0; more items than boxes → 1. Certain first, impossible last; the middle needs no number.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Bound', 'Probability'], rows: [
      [`at least ${HI}% (needs ${needHi}, max ${FT.max})`, 'max achievable', '0'],
      [`at least ${LO}% (needs ${needLo}, has ${FT.made})`, 'already guaranteed', '1'],
      ['heads − tails odd with even n', 'parity', '0'],
      ['5 cards, two share a suit', 'pigeonhole', '1'],
      ['100 makes in a row at 0.9', 'none: just rare', '0.9^100, tiny but positive'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a target exactly equal to the maximum is possible (every remaining shot must go in). A statement can be both very likely and not certain; only a bound gives exactly 1.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: pigeonhole in collisions (more people than values), card hands (five cards, four suits), and Orderbooks, where a trade that cannot be filled is impossible whatever the prices look like.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const s = shots(rng); const pct = Math.round((1000 * s.max) / s.tot) / 10; const exact = (pct * s.tot) / 100 === s.max;
        const opts = ['Possible: only if every remaining shot goes in', [['Impossible: the target is above her maximum', 'a target equal to the maximum is reachable by making every shot'], ['Certain: she is guaranteed to reach it', 'it needs every remaining shot, so it is far from certain']]];
        return exact ? mc(rng, `${s.made} of ${s.n} made, ${s.k} left. Can she finish at ${pct}%?`, ...opts, `${pct}% of ${s.tot} is exactly ${s.max}, the maximum.`) : mc(rng, `${s.made} of ${s.n} made, ${s.k} left. How does "she finishes with ${s.max} of ${s.tot} made" rank against the bounds?`, ...opts, `${s.max} is the maximum: making all ${s.k} gives it.`); } },
    ] },

    { type: 'variation', base: `The challenge: ${FT.made} of ${FT.n} made, ${FT.k} more at ${FT.p}. (a) at least ${HI}% is impossible (needs ${needHi}, at most ${FT.max}), (c) at least ${LO}% is certain, (b) at least ${MID} of the next ${FT.k} goes between.`, rows: [
      { same: true, change: `She is a 70% shooter instead of ${FT.p * 100}%`, effect: 'No change to the order. The bounds use counts only; her accuracy moves (b), and (b) stays between the 1 and the 0.' },
      { change: `Lower (a) to "at least ${V.edgePct}%"`, effect: `That needs ${FT.max}, exactly the maximum: possible only if all ${FT.k} go in, ${FT.p}^${FT.k} ≈ ${dp(V.edgeP, 4)}. No longer 0, so no free place: it ranks last only because (b) is about ${dp(PMID, 2)}.` },
      { change: `Raise (c) to "at least ${V.cPct}%"`, effect: `That needs ${V.cNeed}; she has ${FT.made}, so ${V.cNeed - FT.made} more of the ${FT.k}: about ${dp(V.cP, 2)}. The bound is lost and it drops below (b) (${dp(PMID, 2)}): the order becomes (b) > (c) > (a).` },
      { fusion: true, change: `She has made ${FT.made + 1} (not ${FT.made}), and (a) asks for ${HI + 1}% (not ${HI}%)`, effect: `One more make lifts the maximum to ${FT.max + 1}, which alone would put ${HI}% (needs ${needHi}) in reach. The higher target needs ${V.fNeed}: out of reach again. The two changes cancel and (a) stays exactly 0.` },
    ] },
    { type: 'transfer',
      near: { make: (rng) => bounded(rng, shots(rng), seller) },
      far: { make: (rng) => { const a = rng.int(2, 6) * 10, d = rng.int(2, 4), cap = rng.pick([10, 15, 20]), T = a + d * cap + rng.pick([5, 10]);
        return mc(rng, `A desk has made €${a}k this week with ${d} trading days left. A risk limit stops it making more than €${cap}k on any day. P(the week ends with at least €${T}k)?`, '0', [['Small but positive', `a good run cannot beat the cap: at most ${a} + ${d} × ${cap} = ${a + d * cap}`], ['About 1/2', 'guessed from the story instead of counting the most reachable'], ['It depends on how volatile the desk is', 'volatility moves the likely outcomes, not a hard bound']], `The most the week can end with is €${a + d * cap}k, below €${T}k.`); } },
      principle: mc(null, 'Which idea carried over from the free throws to the capped desk?', 'Turn the target into a count and compare it with the most still reachable', [
        ['A skilled player or desk can reach any target with a good enough run', 'the story, not the count: no run beats the most that is still reachable'],
        ['Very unlikely outcomes can be ranked as if they were impossible', 'only a hard bound gives exactly 0; tiny is still positive'],
        ['Parity decides whether any count target can be reached', 'parity is one bound among four; here the cap on the total decides'],
      ], 'Maximum achievable: what is done plus the most the rest can add. Above it, P = 0 exactly, in any setting.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'impossible-bounds', count: 3 },
  ],
};
