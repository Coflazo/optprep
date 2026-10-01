// One die, several throws: all different, all the same, no equal neighbours, some repeat.
// The method is a walk through the throws: at each throw, how many faces are allowed?
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

const falling = (k, n) => { let p = 1; for (let i = 0; i < n; i++) p *= k - i; return p; }; // k(k−1)…(k−n+1)
const allDiff = (k, n) => Q.of(falling(k, n), k ** n);
const allSame = (k, n) => Q.of(1, k ** (n - 1));
const noAdj = (k, n) => Q.of((k - 1) ** (n - 1), k ** (n - 1));
const repeat = (k, n) => Q.of(1).sub(allDiff(k, n));
const chain = (k, n) => Array.from({ length: n }, (_, i) => `${k - i}/${k}`).join(' × ');
const dec = (x) => (Math.round(x.toNumber() * 1000) / 1000).toFixed(3);
const N = [1, 2, 3, 4, 5, 6];

export default {
  id: 'bto/die-repeats',
  book: 'bto',
  kind: 'family',
  family: 'die-repeats',
  title: 'One die, repeated throws',
  summary: 'Walk the throws one at a time and ask how many faces each throw may show; multiply.',
  prerequisites: ['bto/two-dice-sum', 'prob/counting'],
  objectives: [
    'Recognise an "all different / all the same / no equal neighbours / some repeat" question',
    'Write the allowed-face fraction for each throw and multiply, for any number of sides',
    'Pick the right complement: "some repeat" is 1 − "all different", not 1 − "all the same"',
    'Keep "all different" and "no equal neighbours" apart from three throws on',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you throw one fair die three times. What is the probability that all three throws show different faces? Find two different ways to get there.', answer: `${falling(6, 3)}/216 = ${allDiff(6, 3)}`, explain: `Counting: ${chain(6, 3).replace(/\/6/g, '')} = ${falling(6, 3)} sequences of 216. Walking: ${chain(6, 3)} = ${allDiff(6, 3)}. If you got ${noAdj(6, 3)} you only kept neighbours apart; if you got ${Q.of(1).sub(allSame(6, 3))} you took the complement of "all the same". The lesson names both beliefs.`, attempts: [
      { id: 'first-factor', label: 'A "new" factor for every throw', approach: `Wrote 5/6 × 4/6 × 3/6, one "new face" factor per throw, and got ${Q.of(5 * 4 * 3, 216)}.`, breaksAt: 'The first throw has nothing to clash with, so its factor is 6/6. Every factor after it was shifted one step too far.' },
      { id: 'neighbours', label: 'Throw 3 avoids only throw 2', approach: `Took 5/6 for throw 2 and 5/6 again for throw 3: ${noAdj(6, 3)}.`, breaksAt: 'Throw 3 must also avoid throw 1. That answer lets 2, 5, 2 count as all different.' },
      { id: 'not-same', label: 'One minus "all the same"', approach: `Took 1 − P(all the same) = ${Q.of(1).sub(allSame(6, 3))}.`, breaksAt: 'Most sequences are neither all the same nor all different, like 3, 3, 5. They land on the wrong side.' },
    ] },
    { type: 'text', text: 'One die (sometimes a 4-, 8-, 10- or 12-sided die) is thrown several times, and the question is whether the throws **agree or differ**: all different, all the same, no two consecutive throws equal, or at least two throws equal.' },
    { type: 'list', items: ['"A die is thrown four times. What is the chance all four numbers are different?"', '"You roll a 10-sided die three times. Probability that no two consecutive rolls match?"', '"A die is rolled three times. What is the chance at least two rolls are the same?"'] },
    { type: 'text', text: 'Not this lesson: questions that name a face ("at least one six": bto/at-least-one) or add the faces (bto/three-dice). Here no face is special; only agreement matters.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['An 8-sided die is rolled three times: probability all three differ', 'A die is rolled three times: probability of at least one six', 'Three dice: probability the sum is 10', 'Two dice: probability the larger face is 4'], answer: 0, traps: { 1: 'a named face: bto/at-least-one', 2: 'a sum: bto/three-dice', 3: 'a maximum: bto/dice-order-stats' }, explain: 'Only the first asks whether throws agree, with no face singled out.' },
    ] },

    S('why'),
    { type: 'text', text: 'Agreement questions look like they need a list of cases. They do not: walking through the throws turns every one of them into a single product. The only skill is deciding how many faces each throw is allowed to show, and that is where the classic wrong answers come from. A reported past question ("a die is thrown twice: what is the chance the second throw differs from the first?") is the smallest case of this lesson, and the larger cases differ only in the length of the product.' },

    S('anchor'),
    { type: 'text', text: 'You know one throw: 6 equally likely faces, so P(a set of faces) = allowed / 6. Several throws are the same fraction repeated, with **one change**: how many faces a throw is allowed to show depends on the throws before it. Independence lets you multiply these fractions along the way.' },
    { type: 'check', scope: 'one throw: allowed / 6, then multiply', questions: [
      { make: (rng) => { const k = rng.pick([4, 6, 8, 10, 12]); return mc(rng, `A fair ${k}-sided die is thrown twice. P(second throw differs from the first)?`, fr(k - 1, k), [[fr(1, k), 'answered "the same", not "different"'], ['1/2', 'treated "same" and "different" as equally likely'], [fr((k - 1) ** 2, k * k), 'applied the "differ" factor to the first throw too']], `Whatever the first throw shows, ${k - 1} of the ${k} faces differ from it: ${fr(k - 1, k)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the three throws as a tree, asking at each throw only "new face or repeat?". The first throw is always new. The second is new for 5 of 6 faces. The third is new for 4 of 6, because two faces are used up.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: [{ p: '1', label: 'throw 1: any face', children: [
      { p: '5/6', label: 'throw 2 new', children: [{ p: '4/6', label: 'throw 3 new: all different', mark: true }, { p: '2/6', label: 'throw 3 repeats one' }] },
      { p: '1/6', label: 'throw 2 repeats' },
    ] }] }, total: allDiff(6, 3).toString() }, caption: `All different is the single marked path: 1 × 5/6 × 4/6 = ${allDiff(6, 3)}. Each "new" branch is thinner than the last because more faces are used.` },
    { type: 'check', scope: 'the "new face" tree', questions: [
      { make: (rng) => { const n = rng.int(2, 5); return { type: 'number', q: `A die is thrown ${n} times. How many of the 6^${n} ordered sequences have all faces different?`, answer: falling(6, n), hints: ['How many faces may the first throw show? The second?', 'Each new throw loses one allowed face.'], explain: `${Array.from({ length: n }, (_, i) => 6 - i).join(' × ')} = ${falling(6, n)}.` }; } },
    ] },
    { type: 'text', text: 'Each question type is just a different row of allowed fractions. Line them up and the formulas write themselves.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Event', 'throw 1', 'throw 2', 'throw 3', 'throw 4', '4 throws'], rows: [
      ['all different', '6/6', '5/6', '4/6', '3/6', allDiff(6, 4).toString()],
      ['all the same', '6/6', '1/6', '1/6', '1/6', allSame(6, 4).toString()],
      ['no equal neighbours', '6/6', '5/6', '5/6', '5/6', noAdj(6, 4).toString()],
    ] }, caption: 'Read across a row and multiply. "All different" must avoid every used face, "no equal neighbours" only the one just before, "all the same" must hit one face.' },
    { type: 'check', scope: 'the rows of allowed fractions', questions: [
      { type: 'choice', q: 'Four throws, no two consecutive throws equal. What does the fourth throw have to avoid?', options: ['Only the face of throw 3', 'Every face used so far', 'The face of throw 1', 'Nothing'], answer: 0, traps: { 1: 'that is the "all different" rule', 2: 'throw 1 is not its neighbour', 3: 'it must still differ from throw 3' }, explain: 'Only neighbours must differ, so throw 4 avoids exactly one face: 5/6.' },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Six-sided die: probability after n throws', xLabel: 'throws n', yLabel: 'probability', categories: N.map(String), series: [{ name: 'no equal neighbours', values: N.map((n) => Math.round(noAdj(6, n).toNumber() * 1000) / 1000) }, { name: 'all different', values: N.map((n) => Math.round(allDiff(6, n).toNumber() * 1000) / 1000) }], valueLabels: true }, caption: `The two rows agree for n = 1 and n = 2, then split fast: at n = 6, all different has ${dec(allDiff(6, 6))} left while no equal neighbours still has ${dec(noAdj(6, 6))}.` },
    { type: 'check', scope: 'how the two events split', questions: [
      { make: (rng) => { const n = rng.int(3, 5); return mc(rng, `A die is thrown ${n} times. Which is larger?`, 'P(no equal neighbours)', [['P(all throws different)', '"all different" forbids every used face, so it is the stricter event'], ['Equal: the two events match', `they only agree for 2 throws or fewer; from 3 throws on, 1, 2, 1 is allowed by one and not the other`]], `All different implies no equal neighbours, never the reverse: ${dec(noAdj(6, n))} against ${dec(allDiff(6, n))}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'first-factor', say: 'Walk the throws in order. For each throw write (faces allowed, given the earlier throws) / k, then multiply the fractions. Throw 1 has no earlier throws, so its factor is k/k.', why: 'Independent throws: the chance a throw lands in its allowed set is allowed/k whatever happened before, and the chain rule multiplies these.',
        checks: [
          { type: 'choice', q: 'Why may you multiply 5/6 by 4/6 for "all three throws differ"?', options: ['4/6 is P(throw 3 is new, given throws 1 and 2 differ)', 'The throws are dependent, so their chances multiply', '5/6 and 4/6 are disjoint events, so they multiply'], answer: 0, traps: { 1: 'the throws are independent; only the allowed set depends on the past', 2: 'disjoint events add, they do not multiply' }, explain: 'Each factor is a conditional probability; the chain rule multiplies them.' },
        ] },
      { answers: 'neighbours', say: 'All different: each throw loses one more allowed face, so k/k × (k − 1)/k × (k − 2)/k … for n throws.', why: 'Every face already used is forbidden, and after i throws there are i of them.',
        checks: [
          { make: (rng) => { const k = rng.pick([4, 8, 10, 12]); const n = 3; return mc(rng, `A fair ${k}-sided die is thrown three times. P(all three different)?`, allDiff(k, n).toString(), [[noAdj(k, n).toString(), 'only kept neighbouring throws apart; throw 3 must also avoid throw 1'], [Q.of(1).sub(allSame(k, n)).toString(), 'took the complement of "all the same"'], [Q.of(falling(k, n), 6 * k ** n).toString(), 'counted sets of faces, dividing out the 3! orders'], [Q.of((k - 1) ** 3, k ** 3).toString(), 'gave the first throw a factor too']], `${chain(k, n)} = ${allDiff(k, n)}.`); } },
        ] },
      { say: 'All the same: the first throw is free, and each of the other n − 1 throws must match it: (1/k)^{n−1}.', why: 'No face is named, so the first throw only chooses the target; it costs nothing.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 4); return mc(rng, `A die is thrown ${n} times. P(all the same face)?`, allSame(6, n).toString(), [[Q.of(1, 6 ** n).toString(), 'required one named face, such as all sixes'], [Q.of(n - 1, 6).toString(), 'added 1/6 per later throw instead of multiplying'], [Q.of(1).sub(allDiff(6, n)).toString(), 'answered "at least two match"']], `(1/6)^${n - 1} = ${allSame(6, n)}: six favourable sequences out of ${6 ** n}.`); } },
        ] },
      { say: 'No equal neighbours: the first throw is free, and each later throw avoids only the face just before it: ((k − 1)/k)^{n−1}.', why: 'Given the previous face, exactly k − 1 faces are allowed, whatever happened earlier. Throw 3 may repeat throw 1.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 5); return { type: 'number', q: `A die is thrown ${n} times. How many of the 6^${n} sequences have no two consecutive throws equal?`, answer: 6 * 5 ** (n - 1), hints: ['How many faces may throw 1 show?', 'Each later throw must avoid one face only.'], explain: `6 × 5^${n - 1} = ${6 * 5 ** (n - 1)}.` }; } },
        ] },
      { answers: 'not-same', say: 'At least two throws the same: take the complement of "all different": 1 − k(k − 1)…/k^n.', why: '"Some repeat" is many overlapping cases (throws 1 and 2 match, or 1 and 3, …). Its opposite is one clean product.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 4); return mc(rng, `A die is thrown ${n} times. P(at least two throws show the same face)?`, repeat(6, n).toString(), [[Q.of(1).sub(noAdj(6, n)).toString(), 'only looked for matching neighbours; throw 1 can match throw 3'], [Q.of(n * (n - 1) / 2, 6).toString(), 'added 1/6 for each pair of throws; the pair events overlap'], [allSame(6, n).toString(), 'answered "all the same", a much stronger event'], [allDiff(6, n).toString(), 'answered "all different", the complement']], `1 − ${allDiff(6, n)} = ${repeat(6, n)}.`); } },
        ] },
    ] },
    { type: 'text', text: `Every product above is also a count, which gives you a second route to check yourself. The ${6 ** 3} ordered sequences of three throws are equally likely; ${falling(6, 3)} of them are all different, 6 are all the same, and ${6 * 25} have no equal neighbours. Dividing each count by ${6 ** 3} gives exactly the products. When a question feels unfamiliar, count sequences; when it is familiar, walk the throws. Both must agree.` },
    { type: 'check', scope: 'products are counts over k^n', questions: [
      { make: (rng) => { const k = rng.pick([4, 8, 10]); return { type: 'number', q: `A fair ${k}-sided die is thrown three times. How many of the ${k ** 3} ordered sequences are all different?`, answer: falling(k, 3), hints: ['Count choices for throw 1, then throw 2, then throw 3.', 'Each throw loses one allowed face.'], explain: `${k} × ${k - 1} × ${k - 2} = ${falling(k, 3)}; divided by ${k ** 3} this is ${allDiff(k, 3)}, the same as the walk.` }; } },
    ] },
    { type: 'explain', prompt: 'In your own words: why is "all the same" not the complement of "all different"? Give a sequence that shows it.', model: 'The complement of "all different" is "at least two match". A sequence like 3, 3, 5 has a match, so it is not all different, but it is not all the same either. So 1 − P(all the same) counts far too much as "all different".', points: ['complement of "all different" is "at least two match"', 'a counterexample such as 3, 3, 5 is neither', 'use 1 − P(all different) for "some repeat"'] },

    S('worked'),
    { type: 'worked', family: 'die-repeats', section: 'bto', difficulty: 1, seed: 'b', explainAt: [1], intro: 'A six-sided die, "all different" or "all the same". Try it before opening the solution.' },
    { type: 'worked', family: 'die-repeats', section: 'bto', difficulty: 2, seed: 'c', fade: 1, intro: 'A die with a different number of sides. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'A die is thrown four times. What is the probability that at least two throws show the same face?', lines: [
      { t: 0, say: 'Four throws, "at least two the same", no face named: an agreement question. "Some repeat" has many overlapping cases, so I take the complement.' },
      { t: 5, say: `The opposite is "no throw repeats the one before it": (5/6)^3 = ${noAdj(6, 4)}.`, slip: true },
      { t: 9, say: 'Wait, 2, 5, 2, 4 has a repeat and no equal neighbours. The opposite of "some repeat" is "all different": 6/6 × 5/6 × 4/6 × 3/6.' },
      { t: 14, say: `That is ${allDiff(6, 4)}, so P = 1 − ${allDiff(6, 4)} = ${repeat(6, 4)} ≈ ${dec(repeat(6, 4))}.` },
      { t: 18, say: `Check: only six faces for four throws, so a repeat should be likely, and ${dec(repeat(6, 4))} is. Answer ${repeat(6, 4)}, ${SECTIONS.bto.exam.perItemSeconds - 18} seconds to spare.` },
    ] },

    S('predict'),
    { type: 'predict', question: 'Four throws of a die. Which is bigger, P(no equal neighbours) or P(all different), and roughly by what factor?', answer: `No equal neighbours: ${noAdj(6, 4)} ≈ ${dec(noAdj(6, 4))} against ${allDiff(6, 4)} ≈ ${dec(allDiff(6, 4))}, about ${Math.round(noAdj(6, 4).toNumber() / allDiff(6, 4).toNumber() * 10) / 10} times.`, explain: 'One forbids one face per throw, the other forbids every used face.' },

    S('traps'),
    { type: 'traps', family: 'die-repeats', section: 'bto', extra: [
      { belief: '"All different" only means each throw differs from the one before it.', fix: 'That is "no equal neighbours". All different forbids every face already used: 6/6 × 5/6 × 4/6 …' },
      { belief: '"All different" is the complement of "all the same".', fix: 'Most sequences are neither, for example 1, 1, 4. The complement of "all different" is "some repeat".' },
      { belief: 'The first throw also carries a factor, (5/6)^n.', fix: 'The first throw has nothing to clash with: its factor is 6/6.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(at least two of four throws match) for one die. One step is wrong.', steps: [
      'Use the complement: P(at least two match) = 1 − P(no two match).',
      'No two match means each throw differs from the previous one: (5/6)^3.',
      `So P(no two match) = ${noAdj(6, 4)}.`,
      `P = 1 − ${noAdj(6, 4)} = ${Q.of(1).sub(noAdj(6, 4))}.`,
    ], errorStep: 1, explain: `"No two match" means all four different, not just neighbours: ${chain(6, 4)} = ${allDiff(6, 4)}. The right answer is 1 − ${allDiff(6, 4)} = ${repeat(6, 4)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `Three throws. A candidate answers P(all different) = ${noAdj(6, 3)}. Which belief produced it?`, options: ['Only neighbours must differ', '"All different" is the complement of "all the same"', 'Sets of faces instead of sequences', 'The first throw has a factor'], answer: 0, explain: `${noAdj(6, 3)} = 5/6 × 5/6: throw 3 only avoided throw 2. Correct: ${allDiff(6, 3)}.` },
      { type: 'choice', q: `Three throws. Another answers P(all different) = ${Q.of(1).sub(allSame(6, 3))}. Which belief?`, options: ['Complement of "all the same"', 'Only neighbours must differ', 'Adding instead of multiplying'], answer: 0, explain: `1 − 1/36 = ${Q.of(1).sub(allSame(6, 3))}: it counts 2, 2, 5 as "all different".` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Six-sided die, all different: 2 throws ${allDiff(6, 2)}, 3 throws ${allDiff(6, 3)}, 4 throws ${allDiff(6, 4)}. Each new throw multiplies by the next fraction down (4/6, 3/6, …), so the chance falls fast.` },
    { type: 'callout', tone: 'speed', text: 'Sanity check for free: all different ≤ no equal neighbours, and all the same ≤ some repeat. If your numbers break either inequality, a factor is wrong. And n throws of a k-sided die with n > k can never be all different.' },
    { type: 'callout', tone: 'speed', text: `Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds a question. Writing the row of fractions takes 10; the product and a match to the closest option takes 20 more.` },
    { type: 'check', scope: 'the memorised values and the sanity inequality', questions: [
      { type: 'choice', q: 'Four throws of a die. A candidate reports P(all different) = 0.6 and P(no equal neighbours) = 0.58. What do you conclude?', options: ['At least one is wrong: all different ≤ no equal neighbours', 'Both are plausible: the events are close for four throws', 'Only the second is wrong: it must be below one half'], answer: 0, traps: { 1: 'all different is a special case of no equal neighbours, so it is never larger', 2: `no equal neighbours is ${dec(noAdj(6, 4))} for four throws, so 0.58 is right` }, explain: `Truth: ${dec(allDiff(6, 4))} and ${dec(noAdj(6, 4))}. The first number is the broken one.` },
      { make: (rng) => { const k = rng.pick([4, 5]); const n = k + 1; return mc(rng, `A fair ${k}-sided die is thrown ${n} times. P(all different)?`, '0', [[allDiff(k + 1, n).toString(), `pretended the die has ${n} sides`], [Q.of(k - 1, k).toString(), 'used a single throw'], [noAdj(k, n).toString(), 'computed no equal neighbours']], `${n} throws but only ${k} faces: a repeat is certain, so P = 0.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Walk the throws: all different k(k−1)(k−2)…/k^n; all same (1/k)^(n−1); no equal neighbours ((k−1)/k)^(n−1); some repeat = 1 − all different.' },

    S('contrast'),
    { type: 'compare', columns: ['Event', 'Each later throw must', 'Formula', 'Die, 3 throws'], rows: [
      ['all different', 'avoid every used face', 'k(k−1)(k−2)…/k^n', allDiff(6, 3).toString()],
      ['no equal neighbours', 'avoid the previous face', '((k−1)/k)^(n−1)', noAdj(6, 3).toString()],
      ['all the same', 'match the first face', '(1/k)^(n−1)', allSame(6, 3).toString()],
      ['some repeat', '(complement)', '1 − all different', repeat(6, 3).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: with 2 throws, "all different" and "no equal neighbours" coincide (${allDiff(6, 2)}). With more throws than faces, all different is impossible and some repeat is certain. With 1 throw, everything is "all different" and "all the same" at once.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the birthday problem is "all different" with a 365-sided die, and card questions like "five cards, no two share a rank" use the same walk with shrinking counts (bto/card-draws). Any time a later choice must avoid earlier ones, write the allowed fraction per step and multiply.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'A die is thrown n ≥ 3 times. Which statement is always true?', options: ['P(all different) < P(no equal neighbours)', 'P(all different) = 1 − P(all the same)', 'P(some repeat) = 1 − P(no equal neighbours)'], answer: 0, traps: { 1: '"not all the same" also contains sequences like 1, 1, 4', 2: 'a repeat can skip a throw, as in 2, 5, 2, which has no equal neighbours' }, explain: `From three throws on, 2, 5, 2 has no equal neighbours but is not all different, so the inequality is strict: for 3 throws ${allDiff(6, 3)} < ${noAdj(6, 3)}.` },
      { make: (rng) => { const days = 365; const n = rng.int(3, 5); const p = allDiff(days, n); return mc(rng, `${n} people, birthdays uniform over 365 days. P(all birthdays different) as a walk?`, `${chain(days, n)}`, [[['365/365', ...Array.from({ length: n - 1 }, () => '364/365')].join(' × '), 'kept only neighbours apart'], [`1 − ${Q.of(1, days ** (n - 1))}`, 'took the complement of "all the same"']], `Each new person avoids every birthday already used: ${chain(days, n)} ≈ ${dec(p)}.`); } },
    ] },

    { type: 'variation', base: `A die is thrown three times. P(all different) = ${allDiff(6, 3)}.`, rows: [
      { change: 'Throw three dice at once instead of one die three times', effect: 'No change. Three dice at once are three independent throws; label them first, second, third and the walk is identical.', same: true },
      { change: 'Ask for "no two consecutive throws equal"', effect: `Throw 3 now avoids only throw 2: 5/6 × 5/6 = ${noAdj(6, 3)}, larger, because 2, 5, 2 now counts.` },
      { change: 'Use a 10-sided die', effect: `The factors shrink more slowly: ${chain(10, 3)} = ${allDiff(10, 3)}. More faces make clashes rarer.` },
      { change: 'Throw four times', effect: `One more factor, 3/6: ${allDiff(6, 4)}.` },
      { change: 'Four throws and ask for "at least two the same"', effect: `The extra throw adds the factor 3/6 to "all different" (${allDiff(6, 4)}); the complement then flips it: 1 − ${allDiff(6, 4)} = ${repeat(6, 4)}. Walk first, complement last.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(3, 4); return mc(rng, `A random generator prints ${n} digits, each uniform on 0 to 9 and independent. P(all ${n} digits differ)?`, allDiff(10, n).toString(), [[noAdj(10, n).toString(), 'only kept neighbouring digits apart'], [Q.of(1).sub(allSame(10, n)).toString(), 'took the complement of "all the same"'], [Q.of(falling(9, n), 10 ** n).toString(), 'gave the first digit a factor too']], `A 10-sided die thrown ${n} times: ${chain(10, n)} = ${allDiff(10, n)}.`); } },
      far: { type: 'choice', q: 'A desk sends 4 orders. Each is routed to one of 5 exchanges, uniformly and independently. P(no exchange receives two of the orders)?', options: [allDiff(5, 4).toString(), noAdj(5, 4).toString(), Q.of(1).sub(allSame(5, 4)).toString(), repeat(5, 4).toString()], answer: 0, traps: { 1: 'only kept consecutive orders apart; order 3 may not reuse the exchange of order 1', 2: 'took the complement of "all orders at one exchange"', 3: 'answered "some exchange gets two", the complement' }, explain: `Exchanges are faces of a 5-sided die, orders are throws: ${chain(5, 4)} = ${allDiff(5, 4)}.` },
      principle: { type: 'choice', q: 'Which idea carried over from dice to digits and exchanges?', options: ['Each new pick avoids every earlier pick: shrinking factors', 'Each new pick avoids only the pick just before it', '"Not all the same" is the same event as "all different"', 'Every pick, the first included, gets a "new" factor'], answer: 0, traps: { 1: 'that is "no equal neighbours", a weaker event', 2: 'most outcomes are neither, like 3, 3, 5', 3: 'the first pick has nothing to clash with: factor k/k' }, explain: 'Walk the picks; each one may use only the faces (digits, exchanges) not used yet, so the allowed fraction shrinks by one each time.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'die-repeats', section: 'bto', count: 3 },
  ],
};
