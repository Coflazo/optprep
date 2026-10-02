// Likelihood List family: collision (birthday-type) statements. "Some two share" grows with the number
// of pairs n(n − 1)/2; "someone matches a fixed value" grows only with n. All-different is a shrinking
// product; the collision is its complement. Every value is computed here.
import { S, LL, dp, mc, rank, again } from './compare-without-computing.js';

const allDiff = (n, d) => { let p = 1; for (let i = 0; i < n; i++) p *= (d - i) / d; return p; };
const anyPair = (n, d) => 1 - allDiff(n, d);
const matchYou = (n, d = 365) => 1 - (1 - 1 / d) ** n;
const pairs = (n) => (n * (n - 1)) / 2;
const approx = (n, d) => 1 - Math.exp(-pairs(n) / d);
const firstHalf = (f) => { let n = 1; while (f(n) < 0.5) n += 1; return n; };
const N23 = firstHalf((n) => anyPair(n, 365)), NYOU = firstHalf((n) => matchYou(n));
const CH = [['(a) 23 people, two share a birthday', anyPair(23, 365)], ['(b) 100 others, someone shares yours', matchYou(100)], ['(c) 5 people, two share a birth month', anyPair(5, 12)]].sort((a, b) => b[1] - a[1]);

// Think-aloud: 4 dice repeat a face, two of 15 share a birthday, someone of 50 shares yours.
const TD4 = anyPair(4, 6), T15 = anyPair(15, 365), T50 = matchYou(50);
// Variation: (b) as a collision; (c) as a fixed month; (a) doubled to 46 and turned into a fixed target.
const B100 = anyPair(100, 365), C5 = matchYou(5, 12), A46 = anyPair(46, 365), Y23 = matchYou(23), Y46 = matchYou(46);
if (!(TD4 > T15 && T15 > T50 && B100 > anyPair(5, 12) && C5 < anyPair(23, 365) && C5 > matchYou(100) && Y46 < matchYou(100) && A46 > 0.9 && Y23 < Y46)) throw new Error('collisions: prose orders no longer hold');

// Transfer: near = random account codes; far = random request IDs (estimate by pairs).
const nearT = (rng) => again(() => { const n = rng.pick([20, 30, 40, 50]), m = rng.pick([100, 200, 500]), k = rng.int(3, 5);
  return rank(rng, 'Accounts get random 3-digit codes (000 to 999), each equally likely and independent. Rank from most to least likely.', [[`Among ${n} accounts, two share a code.`, anyPair(n, 1000)], [`Among ${m} accounts, one has the code 777.`, matchYou(m, 1000)], [`Among ${k} people, two share a birth month.`, anyPair(k, 12)]], `Pairs: ${pairs(n)} among ${n} accounts. Fixed target: ${m} chances at 1/1000. Months: ${pairs(k)} pairs at 1/12.`, { gap: 0.02 }); });
const farT = (rng) => { const n = rng.pick([100, 200, 300, 400]), d = 2 ** 16;
  return { type: 'number', q: `A service gives each of ${n} requests a random 16-bit ID (${d} equally likely values). Estimate P(two requests share an ID). (2 decimals)`, answer: anyPair(n, d), tolerance: 0.02, hints: [`pairs = ${n} × ${n - 1}/2 = ${pairs(n)}.`, `1 − e^(−pairs/${d}).`], explain: `${pairs(n)} pairs, pairs/d = ${dp(pairs(n) / d)}, so ≈ ${dp(approx(n, d), 2)} (exact ${dp(anyPair(n, d))}).` }; };

// Pool for the ranking checks.
const POOL = {
  bday: (r) => { const n = r.pick([10, 15, 20, 23, 30, 40, 50]); return [`Among ${n} people, two share a birthday.`, anyPair(n, 365)]; },
  you: (r) => { const n = r.pick([20, 50, 100, 150, 250]); return [`Among ${n} other people, someone shares your birthday.`, matchYou(n)]; },
  month: (r) => { const n = r.int(3, 6); return [`Among ${n} people, two share a birth month.`, anyPair(n, 12)]; },
  dice: (r) => { const n = r.int(2, 5); return [`Some face repeats when ${n} dice are thrown.`, anyPair(n, 6)]; },
  pin: (r) => { const n = r.pick([5, 10, 20, 40]); return [`${n} people pick random 2-digit PINs (00-99) and two pick the same.`, anyPair(n, 100)]; },
  week: (r) => { const n = r.int(2, 5); return [`${n} people were all born on different weekdays.`, allDiff(n, 7)]; },
};

export default {
  id: 'll/collisions',
  book: 'll',
  kind: 'family',
  family: 'collisions',
  title: 'Collision (birthday-type) statements',
  summary: 'Some pair matching grows with pairs, n(n − 1)/2; someone matching a fixed value grows only with n.',
  prerequisites: ['bto/die-repeats', 'prob/complement'],
  objectives: [
    'Compute "all different" as a shrinking product and "some two match" as its complement',
    'Estimate a collision from the number of pairs: 1 − e^(−pairs/d)',
    'Tell "some two share" from "someone shares a fixed value" and rank them',
    'Spot certain collisions by pigeonhole (more items than values)',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: all birthdays (and birth months) are equally likely and independent. Rank: (a) among 23 people, two share a birthday, (b) among 100 other people, someone shares your birthday, (c) among 5 people, two share a birth month.', answer: CH.map(([t, p]) => `${t} ≈ ${dp(p)}`).join(' > '), explain: `(a) looks tiny next to (b): 23 people against 100. But (a) is about any of the ${pairs(23)} pairs matching, while (b) is 100 separate chances at one fixed day. (c) has only 12 values, so ${pairs(5)} pairs already collide more often than not.`,
      attempts: [
        { id: 'divide', label: 'Divide people by values', approach: 'You priced (a) at 23/365 and (c) at 5/12.', breaksAt: 'Each new person must avoid every value already taken: a shrinking product, then 1 minus it.' },
        { id: 'people', label: 'Count the people', approach: 'You put (b) first: 100 people beat 23 people.', breaksAt: `"Two of 23 share" can happen in any of ${pairs(23)} pairs; (b) has only 100 chances at one fixed day.` },
        { id: 'pairsfixed', label: 'Count pairs for (b) too', approach: 'You priced (b) from the pairs among all 101 people, as if any two could match.', breaksAt: 'Only matches with your one birthday count: 100 chances, 1 − (364/365)^100.' },
      ] },
    { type: 'text', text: 'There is **no picture**: statements about people (or dice, or PINs) each taking one of d equally likely values, independently. Two shapes appear: **some two** of them match (a collision among themselves), or **someone** matches one fixed value (yours). A third, "all different", is the complement of the first.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, '"Among 40 people, someone shares the teacher\'s birthday." Which shape is it?', 'someone matches a fixed value', [['some two match each other', 'the teacher\'s birthday is fixed: only matches with it count'], ['all different', 'that would be about no repeats at all'], ['a certain event by pigeonhole', 'forty is far below 365 values']], 'One fixed target: 40 independent chances at 1/365 each.', { at: 0 }),
    ] },
    { type: 'text', text: 'Not this lesson: dice sums or card hands. Here only the pattern of repeats matters: how many values, how many draws, and whether the target is fixed.' },
    { type: 'check', scope: 'what matters', questions: [
      { type: 'choice', q: '"30 PINs drawn from 10,000: two of them match." What decides the chance?', options: ['how many values and draws', 'the digits in each PIN', 'the sum of all the PINs'], answer: 0, traps: { 1: 'only the pattern of repeats matters', 2: 'sums belong to dice items' }, explain: 'd = 10,000 values and n = 30 draws, with no fixed target.' },
    ] },

    S('why'),
    { type: 'text', text: `Collisions are ranked badly by intuition because people count **people** instead of **pairs**. A room of 23 has ${pairs(23)} pairs, and each pair is a separate chance of a shared birthday. The items pair a small collision against a big fixed-target statement to catch exactly that. Once you ask "pairs or a fixed target?" for every statement, the family becomes one of the fastest in the section.` },

    S('anchor'),
    { type: 'text', text: 'You know "all dice different": 3 dice all show different faces with 6/6 × 5/6 × 4/6. A collision statement is the same chain with **one change**: d values instead of 6, and the question asks for the complement, "some two match". The fixed-target shape is the other tool you know, "at least one six in n throws", with 1/d in place of 1/6.' },
    { type: 'check', scope: 'all different as a chain', questions: [
      { make: (rng) => { const n = rng.int(2, 5); return { type: 'number', q: `${n} dice are thrown. P(all show different faces)? (3 decimals)`, answer: allDiff(n, 6), tolerance: 0.0015, hints: ['Each new die avoids the faces already shown.', Array.from({ length: n }, (_, i) => `${6 - i}/6`).join(' × ')], explain: `${Array.from({ length: n }, (_, i) => `${6 - i}/6`).join(' × ')} = ${dp(allDiff(n, 6))}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Both shapes on one plot, with 365 values. The collision curve (any two share) races ahead; the fixed-target curve crawls.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 100, label: 'people n' }, y: { min: 0, max: 1, label: 'probability' }, curves: [{ label: 'some two share', points: Array.from({ length: 51 }, (_, i) => [2 * i, anyPair(2 * i, 365)]) }, { label: 'someone shares yours', points: Array.from({ length: 51 }, (_, i) => [2 * i, matchYou(2 * i)]) }], hlines: [{ y: 0.5, label: '1/2' }] }, caption: `"Some two share" passes 1/2 at n = ${N23}. "Someone shares yours" is only ${dp(matchYou(100))} at n = 100 and needs n = ${NYOU} to pass 1/2.` },
    { type: 'check', scope: 'pairs against people', questions: [
      mc(null, 'Which is more likely: two of 30 people share a birthday, or one of 30 others shares yours?', 'two of 30 people share a birthday', [['one of 30 others shares yours', `counted people instead of pairs: 30 chances against ${pairs(30)} pairs`], ['equally likely', 'both have 30 people, but not the same number of chances']], `${dp(anyPair(30, 365))} against ${dp(matchYou(30))}.`, { at: 0 }),
    ] },
    { type: 'text', text: `Why pairs: every pair is its own chance of a match, and the number of pairs grows like n². Ten people make ${pairs(10)} pairs, not 10 chances.` },
    { type: 'diagram', diagram: 'bar', spec: { title: 'People against pairs', xLabel: 'people n', yLabel: 'pairs n(n − 1)/2', categories: ['5', '10', '23', '30', '50'], series: [{ name: 'pairs', values: [5, 10, 23, 30, 50].map(pairs) }] }, caption: `${[5, 10, 23, 30, 50].map((n) => `${n} people → ${pairs(n)} pairs`).join('; ')}. Doubling the people roughly quadruples the pairs.` },
    { type: 'check', scope: 'counting pairs', questions: [
      { make: (rng) => { const n = rng.int(6, 40); return { type: 'number', q: `How many pairs can be formed from ${n} people?`, answer: pairs(n), hints: ['Each of n people pairs with n − 1 others.', 'Each pair was counted twice.'], explain: `${n} × ${n - 1} / 2 = ${pairs(n)}.` }; } },
    ] },
    { type: 'text', text: 'Small d makes collisions fast. Birth months (d = 12) as a running product:' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'Birth months, 12 equally likely', columns: ['people n', 'all different', 'two share a month'], rows: [2, 3, 4, 5, 6].map((n) => [n, dp(allDiff(n, 12)), dp(anyPair(n, 12))]) }, caption: `Each row multiplies the one above by (12 − n + 1)/12. Five people already share a month with ${dp(anyPair(5, 12))}.` },
    { type: 'check', scope: 'the shrinking product', questions: [
      { make: (rng) => { const [d, what] = rng.pick([[12, 'birth month'], [7, 'weekday of birth'], [6, 'die face'], [10, 'last digit of a phone number']]), n = rng.int(3, Math.min(5, d - 1)); return { type: 'number', q: `${n} people, ${d} equally likely values (${what}). P(at least two match)? (3 decimals)`, answer: anyPair(n, d), tolerance: 0.0015, hints: ['First: all different, a product.', 'Then 1 minus it.'], explain: `1 − ${Array.from({ length: n }, (_, i) => `${d - i}/${d}`).join(' × ')} = ${dp(anyPair(n, d))}.` }; } },
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves: the exact product, the pair estimate that ranks without a calculator, the fixed-target formula, and the pigeonhole bound. The estimate is the move that saves time; the exact product is the move that settles a close call.' },
    { type: 'steps', steps: [
      { answers: 'divide', say: 'All different: person i must avoid the i − 1 values already taken, so P(all different) = Π (d − i)/d for i = 0 to n − 1. Some two match = 1 minus that.', why: 'Each new person has d − i free values out of d, independently of how the earlier ones were placed.',
        checks: [{ make: (rng) => { const n = rng.pick([5, 10, 20]); return { type: 'number', q: `${n} people pick random 2-digit PINs (100 values). P(two pick the same)? (3 decimals)`, answer: anyPair(n, 100), tolerance: 0.0015, hints: ['All different: 100/100 × 99/100 × …', 'Then 1 minus it.'], explain: `1 − Π(100 − i)/100 = ${dp(anyPair(n, 100))}.` }; } }] },
      { answers: 'people', say: 'Estimate: each of the n(n − 1)/2 pairs matches with chance 1/d, and pairs are nearly independent, so P(some match) ≈ 1 − e^(−pairs/d).', why: 'With many rare chances, "no match at all" is close to e^(−expected matches), and expected matches = pairs/d.',
        checks: [{ make: (rng) => { const n = rng.pick([10, 20, 23, 30, 40]); return { type: 'number', q: `Estimate P(two of ${n} people share a birthday) with 1 − e^(−pairs/365). (2 decimals)`, answer: approx(n, 365), tolerance: 0.02, hints: [`pairs = ${n} × ${n - 1}/2.`, 'e^(−x) ≈ 1 − x + x²/2 for small x, or recall e^(−0.7) ≈ 0.5.'], explain: `pairs = ${pairs(n)}, pairs/365 = ${dp(pairs(n) / 365)}, so ≈ ${dp(approx(n, 365), 2)} (exact ${dp(anyPair(n, 365))}).` }; } }] },
      { answers: 'pairsfixed', say: 'Fixed target (your birthday): each of the n others matches with 1/d, independently, so P = 1 − (1 − 1/d)^n ≈ n/d while n is small next to d.', why: 'Only n chances, one per person: the n² of the pair count never enters.',
        checks: [{ make: (rng) => { const n = rng.pick([20, 50, 100, 150, 250]); return { type: 'number', q: `P(someone among ${n} others shares your birthday)? (3 decimals)`, answer: matchYou(n), tolerance: 0.0015, hints: ['Complement: nobody matches.', `1 − (364/365)^${n}.`], explain: `1 − (364/365)^${n} = ${dp(matchYou(n))}; n/d would say ${dp(n / 365)}.` }; } }] },
      { say: 'Pigeonhole: with more people than values (n > d), two must match: probability 1.', why: 'You cannot place n items into d boxes without doubling up when n > d.',
        checks: [{ hinge: true, make: (rng) => { const n = rng.int(8, 12); return mc(rng, `${n} people. P(at least two were born on the same weekday)?`, '1', [[dp(anyPair(Math.min(n, 7), 7)), 'used the product for 7 people; with more than 7 it is forced'], [dp(1 - (6 / 7) ** n), 'used the fixed-target formula: that is "someone matches a given weekday"'], [dp(pairs(n) / 7), 'used pairs/d as a probability; it is an expected count, not a chance']].filter(([v]) => v !== '1'), `${n} people, 7 weekdays: pigeonhole forces a repeat.`); } }] },
    ] },
    { type: 'explain', prompt: 'Explain why 23 people are enough for a better-than-even chance of a shared birthday, while you need about 253 others to have an even chance of someone sharing yours.', model: `A shared birthday among 23 people can happen in any of their ${pairs(23)} pairs, and each pair matches with chance 1/365, so there are many chances. Matching your birthday only counts the pairs that include you: one chance per other person. To get the same number of chances you need about as many other people as the 23-person room has pairs: ${NYOU} against ${pairs(23)}.`, points: ['"Some two share" counts pairs: n(n − 1)/2', '"Someone shares yours" counts people: n', 'Equal chances need people ≈ pairs'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'collisions', difficulty: 2, seed: 'a', explainAt: [0, 2], intro: 'Small value sets: months, dice, weekdays, PINs. Products and complements. Try it first.' },
    { type: 'worked', section: 'll', family: 'collisions', difficulty: 3, seed: 'b', fade: 1, intro: 'Birthdays against your birthday. The values are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: '23 people share a birthday, or 100 others include your birthday: which is likelier?', answer: `The 23-person collision: ${dp(anyPair(23, 365))} against ${dp(matchYou(100))}.`, explain: `${pairs(23)} pairs against 100 people.` },

    S('traps'),
    { type: 'text', text: 'Collision traps come from counting the wrong chances: people instead of pairs, pairs instead of people for a fixed target, or pairs/d used as if it were a probability.' },
    { type: 'traps', section: 'll', family: 'collisions', extra: [
      { belief: 'Two of n people share a birthday with about n/365.', fix: 'Count pairs: n(n − 1)/2 chances, so about 1 − e^(−pairs/365).' },
      { belief: 'Someone matching your birthday is as likely as any two matching.', fix: 'A fixed target has only n chances: 1 − (364/365)^n.' },
      { belief: 'pairs/d is the probability of a collision.', fix: 'It is the expected number of matching pairs; it can pass 1. Use 1 − e^(−pairs/d).' },
      { belief: 'More values than people means a match is unlikely.', fix: 'Five people and twelve months: a shared month is more likely than not.' },
    ] },
    { type: 'erroneous', problem: 'A candidate compares "two of 23 people share a birthday" with "one of 100 others shares yours". One step is wrong.', steps: [
      `Two of 23 share: each person matches another with about ${23 - 1}/365, so ≈ ${dp(22 / 365)}.`,
      `Someone of 100 shares yours: 1 − (364/365)^100 ≈ ${dp(matchYou(100))}.`,
      `The fixed-target statement is about ${Math.round(matchYou(100) / (22 / 365))} times larger.`,
      'So "100 others" ranks first.',
    ], errorStep: 0, explain: `Step 1 counts the chances of one person, not of all ${pairs(23)} pairs. The collision is 1 − Π(365 − i)/365 = ${dp(anyPair(23, 365))}, which beats ${dp(matchYou(100))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, `A candidate estimates P(two of 40 people share a birthday) as ${pairs(40)}/365 and caps it at 1. Which belief?`, 'The expected number of matching pairs is a probability', [['Counted the people in the room instead of the pairs', `the ${pairs(40)} is the pair count, which is right`], ['Used the fixed-target formula for one given birthday', 'that would give 1 − (364/365)^40'], ['Applied pigeonhole as if the room held more than 365', '40 people is far below 365 values']], `${pairs(40)}/365 is the expected number of matching pairs; the probability is 1 − Π = ${dp(anyPair(40, 365))}.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Landmarks: ${N23} people for an even chance of a shared birthday; about ${NYOU} others for an even chance of someone sharing yours. For small d, multiply the chain in your head: months ${[3, 4, 5].map((n) => `n = ${n}: ${dp(anyPair(n, 12), 2)}`).join(', ')}.` },
    { type: 'check', scope: 'the landmarks', questions: [
      { type: 'choice', q: 'About how many people give an even chance that two share a birthday?', options: ['23', '183', '253', '365'], answer: 0, traps: { 1: 'half of 365: pairs grow much faster than people', 2: 'that is for someone sharing your birthday', 3: 'that is the number of days' }, explain: '23 people make 253 pairs: an even chance of a shared birthday.' },
    ] },
    { type: 'callout', tone: 'speed', text: `Ask one question per statement: pairs or a fixed target? Then pairs/d (collision) or n/d (fixed target) tells you the size at a glance. Budget: ${LL.exam.perItemSeconds} seconds; the ranking rarely needs more than those estimates.` },
    { type: 'check', scope: 'pairs or a fixed target', questions: [
      { make: (rng) => again(() => { const keys = rng.shuffle(Object.keys(POOL)).slice(0, 3); return rank(rng, 'All values equally likely and independent. Rank from most to least likely.', keys.map((k) => POOL[k](rng)), 'Pairs for "two share", people for a fixed target, a product for "all different".', { gap: 0.02 }); }) },
    ] },

    { type: 'thinkaloud', problem: 'Rank: (a) among 15 people, two share a birthday, (b) some face repeats when 4 dice are thrown, (c) among 50 other people, someone shares your birthday.', lines: [
      { t: 0, say: 'Collisions: for each statement, pairs or a fixed target?' },
      { t: 5, say: `(b) 4 dice, 6 faces: 1 − 6 × 5 × 4 × 3 / 1296 = ${dp(TD4, 2)}. Small d collides fast.` },
      { t: 13, say: '(c) has 50 people and (a) only 15, so (c) goes above (a).', slip: true },
      { t: 18, say: `No: (a) is "some two share", so I count pairs: ${pairs(15)}. (c) is a fixed target: 50 chances.` },
      { t: 25, say: `(a) ≈ 1 − e^(−${pairs(15)}/365) ≈ ${dp(approx(15, 365), 2)}; (c) = 1 − (364/365)^50 ≈ ${dp(T50, 2)}.` },
      { t: 31, say: `Order (b) > (a) > (c), with ${LL.exam.perItemSeconds - 31} seconds left.` },
    ] },
    { type: 'check', scope: 'the think-aloud routine on fresh statements', questions: [
      { make: (rng) => again(() => rank(rng, 'All values equally likely and independent. Rank from most to least likely.', [POOL.bday(rng), POOL.you(rng), POOL[rng.pick(['dice', 'month', 'pin'])](rng)], 'Pairs for "two share", people for a fixed target.', { gap: 0.02 })) },
    ] },

    S('rule'),
    { type: 'text', text: 'Before any number, sort each statement into one of three shapes: some two match, someone matches a fixed value, or all different. The shape decides the formula, and the pair count or n decides the size.' },
    { type: 'callout', tone: 'rule', text: 'Collision → all different = Π(d − i)/d, some two match = 1 − that ≈ 1 − e^(−n(n−1)/2d). Fixed target → 1 − (1 − 1/d)^n ≈ n/d. n > d → certain.' },

    S('contrast'),
    { type: 'compare', columns: ['Statement', 'Chances', 'Value'], rows: [
      ['some two of n share', 'n(n − 1)/2 pairs', '1 − Π(d − i)/d'],
      ['someone matches a fixed value', 'n people', '1 − (1 − 1/d)^n'],
      ['all n different', 'none may match', 'Π(d − i)/d'],
      ['n > d, some two share', 'pigeonhole', '1'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: two people share a birthday with exactly 1/365 (one pair). With n = d + 1 a collision is certain, even though "all different" is only just impossible.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'P(two given people share a birthday)?', '1/365', [['2/365', 'counted each person as a separate chance, but there is one pair'], ['1/365^2', 'required both to match one fixed day'], ['364/365', 'answered the complement']], 'Whatever the first birthday is, the second matches it with 1/365.', { at: 0 }),
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: dice repeats in Beat the Odds (d = 6), card hands with "two of the same rank", and hash collisions in code. Anything with many pairs and few values collides early.' },
    { type: 'variation', base: `The challenge: (c) 5 people share a month ≈ ${dp(anyPair(5, 12))} > (a) 23 people share a birthday ≈ ${dp(anyPair(23, 365))} > (b) someone of 100 shares yours ≈ ${dp(matchYou(100))}.`, rows: [
      { same: true, change: 'Reword (a) as "not all 23 birthdays are different"', effect: 'No change. It is the same event: "some two share" is exactly the complement of "all different".' },
      { change: 'Change (b) to "two of the 100 share a birthday"', effect: `Now ${pairs(100)} pairs: ${dp(B100, 7)}. Same people, collision shape: (b) jumps from last to first.` },
      { change: 'Change (c) to "someone among 5 people shares your birth month"', effect: `A fixed target: 1 − (11/12)^5 ≈ ${dp(C5)}. (c) drops from first to second, below (a).` },
      { fusion: true, change: 'Double (a) to 46 people, and make it "someone of 46 others shares your birthday"', effect: `Doubling alone would make a collision near certain (${dp(A46)}); the fixed target alone would give ${dp(Y23)}. Together: ${dp(Y46)}, last of the three.` },
    ] },
    { type: 'transfer',
      near: { make: nearT },
      far: { make: farT },
      principle: mc(null, 'Which idea carried over from birthdays to request IDs?', 'Count pairs, n(n − 1)/2, each matching with 1/d', [
        ['Count the requests, each matching with chance 1/d', 'that is the fixed-target shape; any two IDs may match'],
        ['A match is unlikely while there are more IDs than requests', 'pairs grow like n², so collisions come early'],
        ['Divide the number of pairs by d and use it as the chance', 'pairs/d is an expected count; use 1 − e^(−pairs/d)'],
      ], 'IDs, birthdays and PINs are all n draws from d values: the pairs decide when they collide.'),
    },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'collisions', count: 3 },
  ],
};
