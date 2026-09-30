// Derangements: a random matching of items to owners is a random permutation; "a match" is a
// fixed point. D(n)/n! ≈ 1/e, exactly k fixed is C(n,k)D(n−k)/n!, exactly n−1 is impossible.
// Every number shown is computed here, never typed by hand.
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

const one = Q.of(1);
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const D = (n) => { const d = [1, 0]; for (let m = 2; m <= n; m++) d.push((m - 1) * (d[m - 1] + d[m - 2])); return d[n]; };
const nCr = (n, r) => fact(n) / (fact(r) * fact(n - r));
const none = (n) => Q.of(D(n), fact(n));
const exactly = (n, k) => Q.of(nCr(n, k) * D(n - k), fact(n));
const indep = (n) => { let p = one; for (let i = 0; i < n; i++) p = p.mul(Q.of(n - 1, n)); return p; };
const f3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
const f4 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(4);
const E1 = Math.exp(-1);
// The 3! arrangements of letters A, B, C into envelopes a, b, c, with their fixed points.
const PERMS3 = [['A', 'B', 'C'], ['A', 'C', 'B'], ['B', 'A', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B'], ['C', 'B', 'A']];
const fixed3 = (p) => p.filter((x, i) => x === 'ABC'[i]).length;
const NS = [1, 2, 3, 4, 5, 6, 7, 8];
const altSum = (n) => { let s = Q.of(0); for (let k = 0; k <= n; k++) s = s.add(Q.of(k % 2 ? -1 : 1, fact(k))); return s; };

export default {
  id: 'bto/derangements',
  book: 'bto',
  kind: 'family',
  family: 'derangements',
  title: 'Derangements: nobody gets their own',
  summary: 'A random handing-back is a random permutation. P(no match) = D(n)/n! ≈ 1/e; exactly k: C(n,k)·D(n−k)/n!; exactly n − 1: impossible.',
  prerequisites: ['bto/birthday', 'prob/inclusion-exclusion', 'prob/counting'],
  objectives: [
    'Compute D(n) with D(n) = (n − 1)(D(n−1) + D(n−2)) and P(nobody gets their own) = D(n)/n!',
    'Explain why ((n − 1)/n)^n is wrong: the matches are dependent',
    'Find P(exactly k matches) = C(n,k)·D(n−k)/n!, and spot that exactly n − 1 is impossible',
    'Quote 1/e ≈ 0.368 as the answer for any group of 5 or more',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: 4 letters are put at random into their 4 addressed envelopes, one per envelope. What is the probability that no letter is in its own envelope? Try two approaches.', answer: `${D(4)}/${fact(4)} = ${none(4)}`, explain: `If you got (3/4)⁴ = ${indep(4)} ≈ ${f3(indep(4))}, you treated the letters as independent. They are not: once letter A takes envelope b, letter B has one fewer place to go. The lesson counts the ${fact(4)} arrangements directly.` },
    { type: 'text', text: 'n items belong to n owners and are handed back **at random, one each**: letters and envelopes, hats, coats, Secret Santa names. The question asks for the chance that **nobody** gets their own, that **at least one** does, or that **exactly k** do.' },
    { type: 'list', items: ['"5 letters go into 5 addressed envelopes at random. Probability no letter is in the right envelope?"', '"6 traders draw names from a hat. Probability that exactly 2 draw their own name?"', '"7 coats handed back at random. Probability that exactly 6 people get their own coat?"'] },
    { type: 'text', text: 'Not this lesson: values drawn independently with repeats allowed (bto/birthday), and the **expected** number who get their own, which is always 1 (bto/linearity).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['6 hats returned at random, one each: nobody gets their own', '6 people each pick a random hat size from 6 sizes: two pick the same', '6 hats returned at random: expected number of people with their own hat', 'A die is thrown 6 times: face 1 never appears'], answer: 0, traps: { 1: 'independent picks with repeats: a birthday question', 2: 'an expectation: linearity gives 1 at once', 3: 'independent throws: a complement product' }, explain: 'A random one-to-one handing back: a permutation question.' },
    ] },

    S('why'),
    { type: 'text', text: 'Hat-check and Secret Santa questions look like they need a long count, and the tempting shortcut ((n − 1)/n)^n is a trap that lands close to the right answer, often one option away. The truth is almost exactly 1/e for any group of 5 or more. If you know why, the item takes ten seconds; if you know the recursion, even the small cases take thirty.' },

    S('anchor'),
    { type: 'text', text: 'From bto/at-least-one: P(at least one) = 1 − P(none), and when the tries are **independent**, P(none) is a product. Here there is **one change**: the tries are dependent. If person 1 takes person 2\'s hat, person 2 cannot get it, and the chances of everyone else shift.' },
    { type: 'check', scope: 'why the matches are dependent', questions: [
      { make: (rng) => { const n = rng.int(4, 7); return mc(rng, `${n} hats are handed back at random, one each. Person 1 has received person 2's hat. What is P(person 3 gets their own hat) now?`, Q.of(1, n - 1).toString(), [[Q.of(1, n).toString(), 'kept the unconditional 1/n: one hat is already gone'], ['0', 'person 3\'s hat is still in the pile'], [Q.of(1, n - 2).toString(), 'removed two hats; only one has been handed out']], `${n - 1} hats remain for ${n - 1} people, and person 3's is among them: 1/${n - 1}. The information changed the chance, so the matches are dependent.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'List every arrangement for 3 letters A, B, C into envelopes a, b, c. There are 3! = 6, all equally likely. Count the letters in their own envelope (the fixed points) in each row. Small cases like this are worth listing once: they show the patterns the formulas must reproduce.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'All 6 arrangements of 3 letters', columns: ['envelope a', 'envelope b', 'envelope c', 'letters in own envelope'], rows: PERMS3.map((p) => [...p, String(fixed3(p))]) }, caption: `Two rows have no letter at home (B C A and C A B): D(3) = ${D(3)}, so P(no match) = ${none(3)}. No row has exactly 2 at home: if two are right, the third has only its own envelope left.` },
    { type: 'check', scope: 'reading the 3-letter table', questions: [
      { type: 'number', q: 'In the table, how many arrangements have exactly one letter in its own envelope?', answer: PERMS3.filter((p) => fixed3(p) === 1).length, explain: 'A C B, B A C and C B A: fix one letter, swap the other two.' },
      { type: 'choice', q: 'Why does no row have exactly 2 letters at home?', options: ['If two are home, the third has only its own envelope left', 'Because 2 is even', 'It happens, but rarely', 'The table is incomplete'], answer: 0, traps: { 1: 'parity has nothing to do with it', 2: 'it is impossible, not rare: no arrangement does it', 3: 'all 3! = 6 arrangements are listed' }, explain: 'Exactly n − 1 matches is impossible for any n.' },
    ] },
    { type: 'text', text: 'Count fixed points for 4 letters the same way, over all 24 arrangements, and plot how many arrangements have each count.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Arrangements of 4 letters by letters at home', xLabel: 'letters in own envelope', yLabel: 'arrangements', categories: ['0', '1', '2', '3', '4'], series: [{ name: 'arrangements', values: [0, 1, 2, 3, 4].map((k) => nCr(4, k) * D(4 - k)) }], valueLabels: true }, caption: `${D(4)} + ${nCr(4, 1) * D(3)} + ${nCr(4, 2) * D(2)} + 0 + 1 = ${fact(4)}. The bar at 3 is empty (exactly n − 1 is impossible), and "nobody" is the tallest bar: ${D(4)} of ${fact(4)}.` },
    { type: 'check', scope: 'the fixed-point counts for 4', questions: [
      { type: 'choice', q: '4 letters. P(exactly 1 in its own envelope)?', options: [exactly(4, 1).toString(), Q.of(nCr(4, 1) * fact(3), fact(4)).toString(), Q.of(D(3), fact(4)).toString(), Q.of(1, 4).toString()], answer: 0, traps: { 1: 'let the other three be anything: that allows them home too', 2: 'forgot to choose which letter is the one at home', 3: 'used one letter\'s chance of being home' }, explain: `Choose the 1 at home, C(4,1) = ${nCr(4, 1)}; the other 3 must all miss, D(3) = ${D(3)}: ${nCr(4, 1) * D(3)}/${fact(4)} = ${exactly(4, 1)}.` },
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 8, label: 'n' }, y: { min: 0, max: 0.6, label: 'P(nobody gets their own)' }, curves: [{ label: 'D(n)/n!', points: NS.map((n) => [n, none(n).toNumber()]) }], hlines: [{ y: E1, label: `1/e ≈ ${E1.toFixed(3)}` }] }, caption: `The chance zigzags around 1/e and settles fast: n = 4 gives ${f3(none(4))}, n = 5 gives ${f3(none(5))}, n = 6 gives ${f4(none(6))}. From 5 people on, 1/e is right to about 2 decimals.` },
    { type: 'check', scope: 'the 1/e limit', questions: [
      { make: (rng) => { const n = rng.int(7, 30); return mc(rng, `${n} people draw names at random for Secret Santa. P(nobody draws their own name), to 2 decimals?`, E1.toFixed(2), [[(1 - E1).toFixed(2), 'answered "at least one draws their own"'], [(1 / n).toFixed(2), 'used one person\'s chance'], ['0.50', 'treated it as a coin flip']], `For n ≥ 5, D(n)/n! ≈ 1/e ≈ ${E1.toFixed(3)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'The object: a random permutation of n items. All n! arrangements are equally likely, and a "match" is a fixed point.', why: 'Handing back one each, at random, means every ordering of the items to the owners is equally likely.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 7); return { type: 'number', q: `${n} coats are handed back at random, one each. How many equally likely arrangements are there?`, answer: fact(n), explain: `${n}! = ${fact(n)}.` }; } },
        ] },
      { say: 'Do not multiply ((n − 1)/n)^n. That assumes independent matches, and they are dependent.', why: 'The independent model allows two people to receive the same hat. A permutation never does.',
        checks: [
          { type: 'choice', q: '4 letters. Which is P(no letter in its own envelope)?', options: [none(4).toString(), indep(4).toString(), Q.of(1, 4).toString(), (1 - E1).toFixed(3)], answer: 0, traps: { 1: 'the independent model: letters would be allowed to share envelopes', 2: 'one letter\'s chance of a match', 3: 'the large-n answer for "at least one", not "none"' }, explain: `${D(4)} of ${fact(4)} arrangements: ${none(4)} = ${f3(none(4))}. The independent guess gives ${f3(indep(4))}.` },
        ] },
      { say: 'Count derangements by where item 1 goes. It goes to some slot j (n − 1 choices). Then either item j goes to slot 1, a swap, leaving D(n − 2), or it does not, leaving D(n − 1). So D(n) = (n − 1)(D(n−1) + D(n−2)).', why: 'In the second case, "item j must not go to slot 1" acts like j\'s forbidden home: n − 1 items each with one forbidden slot.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 7); return { type: 'number', q: `D(${n - 2}) = ${D(n - 2)} and D(${n - 1}) = ${D(n - 1)}. What is D(${n})?`, answer: D(n), hints: ['Add the two previous values.', `Multiply by n − 1 = ${n - 1}.`], explain: `(${n} − 1)(${D(n - 1)} + ${D(n - 2)}) = ${D(n)}.` }; } },
        ] },
      { say: 'P(nobody gets their own) = D(n)/n!. Inclusion-exclusion writes it as 1 − 1 + 1/2! − 1/3! + … ± 1/n!, the start of the series for e^(−1).', why: 'Subtract arrangements with some forced match, add back the doubly counted, and so on. The alternating tail shrinks like 1/n!.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 6); const v = altSum(n); return mc(rng, `Evaluate 1 − 1 + 1/2! − 1/3! + … ± 1/${n}! exactly.`, v.toString(), [[none(n - 1).toString(), `stopped one term early (that is the n = ${n - 1} answer)`], [one.sub(v).toString(), 'answered the complement'], [indep(n).toString(), 'used the independent model']], `It equals D(${n})/${n}! = ${D(n)}/${fact(n)} = ${v}.`); } },
        ] },
      { say: 'Exactly k matches: choose which k are home, C(n, k), then the other n − k must **all** miss: D(n − k). P = C(n, k)·D(n − k)/n!.', why: '"Exactly" forbids any further match, so the rest must form a derangement, not any arrangement.',
        checks: [
          { make: (rng) => { const n = rng.int(5, 7), k = rng.int(1, n - 3); const v = exactly(n, k); return mc(rng, `${n} names drawn at random. P(exactly ${k} draw their own)?`, v.toString(), [[Q.of(nCr(n, k) * fact(n - k), fact(n)).toString(), 'let the rest be anything: that counts "at least these k"'], [Q.of(D(n - k), fact(n)).toString(), `forgot to choose which ${k} match`], [Q.of(1, n).toString(), 'used one person\'s chance'], [one.sub(v).toString(), 'answered the complement']], `C(${n},${k}) × D(${n - k}) / ${n}! = ${nCr(n, k)} × ${D(n - k)} / ${fact(n)} = ${v}.`, { hinge: true }); } },
        ] },
      { say: 'Exactly n − 1 matches is impossible: P = 0.', why: 'With n − 1 at home, the last item has only its own slot left. In the formula, D(1) = 0.',
        checks: [
          { make: (rng) => { const n = rng.int(5, 9); return mc(rng, `${n} coats handed back at random. P(exactly ${n - 1} people get their own coat)?`, '0', [[Q.of(n, fact(n)).toString(), `chose the one wrong person (${n} ways) as if that were possible`], [Q.of(1, fact(n)).toString(), 'counted one arrangement'], [Q.of(1, n).toString(), 'used one person\'s chance']], `If ${n - 1} are home, the last coat left is the last person's own.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is ((n − 1)/n)^n the wrong answer for "nobody gets their own", even though each person individually misses with (n − 1)/n?', model: 'Each person misses with (n − 1)/n on their own, but the misses are linked: the items are handed out one each, so what one person receives changes what is left for the others. Multiplying assumes independence, which would allow two people to receive the same item. Counting permutations respects the one-each rule and gives D(n)/n!.', points: ['each individual chance is (n − 1)/n', 'the events are dependent because items are handed out one each', 'count arrangements instead: D(n)/n!'] },

    S('worked'),
    { type: 'worked', family: 'derangements', section: 'bto', difficulty: 2, seed: 'a', intro: 'Nobody gets their own. Try it before opening the solution.' },
    { type: 'worked', family: 'derangements', section: 'bto', difficulty: 3, seed: 'f', fade: 1, intro: 'Exactly k matches. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'Which is larger for 10 people: P(nobody gets their own) or P(exactly one gets their own)?', answer: `They are almost equal: ${f4(none(10))} and ${f4(exactly(10, 1))}. For large n, P(exactly k) ≈ e^(−1)/k!, so k = 0 and k = 1 tie.`, explain: `P(exactly 1) = n·D(n − 1)/n! = D(n − 1)/(n − 1)!, which is the "nobody" answer for n − 1 people.` },

    S('traps'),
    { type: 'traps', family: 'derangements', section: 'bto', extra: [
      { belief: 'Each person misses with (n − 1)/n, so P(nobody) = ((n − 1)/n)^n.', fix: 'The misses are dependent. Count permutations: D(n)/n!.' },
      { belief: '"Exactly k" = C(n, k) × (n − k)!/n!.', fix: 'That lets the others land home too. The rest must be a derangement: D(n − k).' },
      { belief: 'Exactly n − 1 matches is rare but possible.', fix: 'It is impossible: the last item has only its own slot.' },
    ] },
    { type: 'erroneous', problem: '5 letters go into 5 envelopes at random. A candidate works out P(exactly 2 letters in the right envelope). One step is wrong.', steps: [
      `Choose which 2 letters are right: C(5,2) = ${nCr(5, 2)}.`,
      `The other 3 letters can go into the remaining 3 envelopes in 3! = ${fact(3)} ways.`,
      `Favourable: ${nCr(5, 2)} × ${fact(3)} = ${nCr(5, 2) * fact(3)}.`,
      `P = ${nCr(5, 2) * fact(3)}/${fact(5)} = ${Q.of(nCr(5, 2) * fact(3), fact(5))}.`,
    ], errorStep: 1, explain: `The other 3 must **all** miss, or more than 2 would be right: only D(3) = ${D(3)} ways. P = ${nCr(5, 2)} × ${D(3)}/${fact(5)} = ${exactly(5, 2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `5 letters. A candidate answers (4/5)⁵ ≈ ${f3(indep(5))} for "no letter right". Which belief?`, options: ['Independent matches', 'Forgot to choose which match', 'Answered at least one'], answer: 0, explain: `The letters compete for the same envelopes. D(5)/5! = ${none(5)} ≈ ${f3(none(5))}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise D(n) for n = 1 to 7: ${[1, 2, 3, 4, 5, 6, 7].map(D).join(', ')}. Each is n·D(n − 1) ± 1 (plus for even n, minus for odd): ${D(5)} = 5 × ${D(4)} − 1, ${D(6)} = 6 × ${D(5)} + 1.` },
    { type: 'callout', tone: 'speed', text: `For n ≥ 5, answer 1/e ≈ ${E1.toFixed(3)} for "nobody" and 1 − 1/e ≈ ${(1 - E1).toFixed(3)} for "at least one". Exactly k for large n: e^(−1)/k!. That takes five seconds of the ${SECTIONS.bto.exam.perItemSeconds}.` },
    { type: 'check', scope: 'D(n) values and the 1/e shortcut', questions: [
      { make: (rng) => { const n = rng.int(5, 7); return { type: 'number', q: `D(${n - 1}) = ${D(n - 1)}. Use D(n) = n·D(n − 1) ± 1 to get D(${n}).`, answer: D(n), hints: [`${n} × ${D(n - 1)} = ${n * D(n - 1)}.`, n % 2 ? 'n is odd: subtract 1.' : 'n is even: add 1.'], explain: `${n} × ${D(n - 1)} ${n % 2 ? '−' : '+'} 1 = ${D(n)}.` }; } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Random one-each handing back → permutation. Nobody: D(n)/n! ≈ 1/e. Exactly k: C(n,k)·D(n−k)/n!. Exactly n − 1: 0.' },

    S('contrast'),
    { type: 'compare', columns: ['Model (n = 4)', 'What is random', 'P(no match)'], rows: [
      ['permutation (letters, hats)', 'one item each, no repeats', `${none(4)} = ${f3(none(4))}`],
      ['independent picks (each picks any of 4)', 'repeats allowed', `(3/4)⁴ = ${f3(indep(4))}`],
      ['large n, either model', 'both tend to 1/e', E1.toFixed(3)],
      ['expected matches (permutation)', 'linearity', '1 match on average'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: n = 1 cannot be deranged (D(1) = 0, P = 0). n = 2: the only derangement is the swap, P = 1/2. Exactly n − 1 matches: 0 for every n. Exactly n: 1/n!.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the expected number of fixed points is exactly 1 for every n (bto/linearity), even though P(no match) ≈ 1/e. Inclusion-exclusion over forced matches is the tool for any "none of these events" question with dependent events (prob/inclusion-exclusion).' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: '2 people swap hats at random (one each). P(nobody gets their own)?', options: ['1/2', '1/4', '0', '1/e'], answer: 0, traps: { 1: 'the independent model (1/2)²', 2: 'the swap is a derangement', 3: 'the large-n limit, wrong for n = 2' }, explain: 'Two equally likely arrangements: keep or swap. Only the swap works.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'derangements', section: 'bto', count: 3 },
  ],
};
