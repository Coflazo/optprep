// Pigeonhole: a random-looking question whose answer is forced by capacity. Check n > k·m
// before estimating anything; when the check fails, count the complement. Every number shown
// is computed here, never typed by hand.
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
// P(all d socks different colours), s socks of each of c colours, drawn without replacement.
const allDiff = (c, s, d) => { let p = one; for (let i = 0; i < d; i++) p = p.mul(Q.of(s * (c - i), s * c - i)); return p; };
const chain = (c, s, d) => Array.from({ length: d }, (_, i) => `${s * (c - i)}/${s * c - i}`).join(' × ');
const d3 = (x) => (x instanceof Q ? x.toNumber() : x).toFixed(3);
// Challenge and picture example: 46 coins, 9 boxes, cap 5.
const K = 9, M = 5, N = K * M + 1;
// Pairs {i, 2P+1-i} for the hidden-boxes picture.
const P = 6;
// Erroneous example: 4 socks, 5 colours, 6 of each.
const E = { c: 5, s: 6, d: 4 };
// One particular box overflowing: P(Bin(n, 1/k) > m), exact.
const nCr = (n, r) => { let x = 1n; for (let i = 0; i < r; i++) x = (x * BigInt(n - i)) / BigInt(i + 1); return x; };
// Think-aloud: 43 coins, 14 boxes, cap 3.
const TA = { n: 43, k: 14, m: 3 };
const oneBox = (n, k, m) => { let s = 0n; for (let j = m + 1; j <= n; j++) s += nCr(n, j) * BigInt(k - 1) ** BigInt(n - j); return new Q(s, BigInt(k) ** BigInt(n)); };

export default {
  id: 'bto/pigeonhole',
  book: 'bto',
  kind: 'family',
  family: 'pigeonhole',
  title: 'Pigeonhole: when it is certain',
  summary: 'Before estimating, ask whether the boxes can hold every item without the event. If n > k·m, P = 1.',
  prerequisites: ['prob/complement', 'bto/die-repeats'],
  objectives: [
    'Run the capacity check n > k·m on any "some box gets more than m" question in under ten seconds',
    'Find the hidden boxes: colours, months, pairs of numbers with a fixed sum',
    'Switch to 1 − P(every box within the cap) when the check fails',
    'Name the trap options: one particular box, an even spread, the excess fraction',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${N} coins are dropped at random into ${K} boxes. You win if some box ends up with more than ${M} coins. What is the probability that you win? Try two approaches.`, answer: `1: the boxes can hold at most ${K} × ${M} = ${K * M} coins without the event, and there are ${N}.`, explain: 'If you started a binomial estimate for one box, you answered a different question ("does box 3 overflow?") and never needed to. The lesson shows how to spot a certainty in ten seconds.', attempts: [
      { id: 'one-box', label: 'Binomial tail for one box', approach: `Worked out P(box 1 gets more than ${M}) with ${N} coins and chance 1/${K} each.`, breaksAt: 'The prize needs some box, not box 1. The event fails only when every box stays at the cap, so that is the case to test.' },
      { id: 'even-spread', label: 'Even spread, so overflow is rare', approach: `Reasoned that ${N} coins spread out to about ${M} per box, so overflow must be unlikely.`, breaksAt: `${K} boxes at ${M} hold only ${K * M} coins. The even spread is not a safe outcome here; it is impossible.` },
      { id: 'excess', label: 'Excess coins as a fraction', approach: `Took the ${N - K * M} coin over capacity as a share of all ${N} coins: ${N - K * M}/${N}.`, breaksAt: 'Once every placement overflows, no outcome is left outside the event. Probability 1 is not built from a ratio of coins.' },
    ] },
    { type: 'text', text: 'Items are dropped, drawn or chosen **at random**, and the question asks whether **some** category ends up crowded: some box with more than m coins, two socks of one colour, two chosen numbers that add up to a target. When the count forces the event, the randomness is decoration.' },
    { type: 'list', items: ['"61 coins are thrown into 15 boxes. Probability that some box holds more than 4?"', '"A drawer has socks in 4 colours. You take 5 in the dark. Probability of a matching pair?"', '"You pick 6 different numbers from 1 to 10. Probability that two of them add up to 11?"'] },
    { type: 'text', text: 'Not this lesson: many categories and few items (23 people, 365 birthdays), where a repeat is likely but not forced (bto/birthday); and questions about **one particular** box, which are binomial counts.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question is most likely to have the answer exactly 1?', options: ['40 coins into 13 boxes: some box has more than 3', '40 coins into 13 boxes: box 1 has more than 3', '23 people: two share a birthday', '5 socks from 5 colours: a matching pair'], answer: 0, traps: { 1: 'one particular box: a binomial tail, far below 1', 2: 'likely (about 1/2) but not forced: 365 boxes, 23 items', 3: '5 socks can all differ when there are 5 colours' }, explain: '13 × 3 = 39 < 40: an even spread cannot keep every box at 3 or fewer.' },
    ] },

    S('why'),
    { type: 'text', text: 'These items are written to look like long computations: a binomial tail, a product of many fractions. A candidate who starts computing burns a minute and often lands on a trap option. A candidate who asks "can this be avoided at all?" answers in ten seconds and banks the time for the hard items. The same question, "what is the worst case?", is also how you spot an impossible event (probability 0).' },

    S('anchor'),
    { type: 'text', text: 'You know the sock fact: 3 socks from 2 colours must contain a pair, because one sock per colour covers only 2 socks. Pigeonhole is that fact with **one change**: k boxes that may each hold up to m items hold at most **k × m** items without any box going over m.' },
    { type: 'check', scope: 'capacity k × m', questions: [
      { make: (rng) => { const k = rng.int(7, 16), m = rng.int(2, 6); return { type: 'number', q: `${k} boxes, and no box may hold more than ${m} coins. What is the largest number of coins they can hold?`, answer: k * m, explain: `${k} × ${m} = ${k * m}: fill every box to the cap.` }; } },
      { make: (rng) => { const c = rng.int(3, 7); return { type: 'number', q: `Socks come in ${c} colours. How many socks must you take (in the dark) to be sure of a pair of one colour?`, answer: c + 1, explain: `${c} socks can be one of each colour; sock number ${c + 1} must repeat a colour.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: `Picture the **worst case**: the most even spread the items could take, the one that tries hardest to avoid the event. Fill every box to the cap and see whether anything is left over. Here ${N} coins meet ${K} boxes with cap ${M}.` },
    { type: 'diagram', diagram: 'bar', spec: { title: `The most even spread of ${N} coins over ${K} boxes`, xLabel: 'box', yLabel: 'coins', categories: Array.from({ length: K }, (_, i) => String(i + 1)), series: [{ name: 'coins', values: Array.from({ length: K }, (_, i) => (i === K - 1 ? M + 1 : M)) }], valueLabels: true }, caption: `${K - 1} boxes at the cap ${M} and one at ${M + 1}. The spread that avoids overflow best still overflows: coin ${N} has no legal box. Every other spread is less even, so it overflows too. P = 1.` },
    { type: 'check', scope: 'the worst-case spread', questions: [
      { make: (rng) => { const k = rng.int(8, 18), m = rng.int(3, 6), n = k * m + rng.int(1, 3); return mc(rng, `${n} coins are thrown at random into ${k} boxes. P(some box ends up with more than ${m} coins)?`, '1', [['1/2', 'treated "overflow or not" as a coin flip'], [`1/${k}`, 'used the chance a coin lands in one given box'], [Q.of(n - k * m, n).toString(), 'used the excess coins as a fraction of all coins'], ['0', 'thought an even spread keeps every box at the cap']], `${k} × ${m} = ${k * m} < ${n}: some box must exceed ${m} in every outcome.`, { hinge: true }); } },
    ] },
    { type: 'text', text: `Now the boundary. With exactly k × m items the even spread **just fits**: every box at the cap, nothing left over. The event is no longer forced. One spread avoids it, so P < 1, even if that spread is rare.` },
    { type: 'diagram', diagram: 'bar', spec: { title: `${K * M} coins over ${K} boxes: the even spread fits`, xLabel: 'box', yLabel: 'coins', categories: Array.from({ length: K }, (_, i) => String(i + 1)), series: [{ name: 'coins', values: Array.from({ length: K }, () => M) }], valueLabels: true }, caption: `One coin fewer and the worst case is legal: all ${K} boxes at exactly ${M}. The certainty breaks at n = k × m, not at n = k × m + k.` },
    { type: 'check', scope: 'the boundary n = k × m', questions: [
      { make: (rng) => { const k = rng.int(8, 16), m = rng.int(3, 5); return mc(rng, `${k * m} coins are thrown at random into ${k} boxes. What can you say about P(some box has more than ${m})?`, 'Below 1: every box at exactly the cap is possible', [['Exactly 1: the coins outnumber the boxes by far', `${k} × ${m} = ${k * m} exactly fits, so the event is not forced`], ['Exactly 0: the coins always spread out evenly', 'the even spread is possible but not guaranteed'], ['Exactly 1/2: overflow or no overflow, a coin flip', 'no symmetry makes it a coin flip']], `Capacity ${k * m} equals the number of coins: the event can be avoided, so it is not certain.`); } },
    ] },
    { type: 'text', text: `Sometimes the boxes are hidden. Pick numbers from 1 to ${2 * P} and ask for two that add up to ${2 * P + 1}. Each number has exactly one partner, so the numbers fall into ${P} pairs. The pairs are the boxes, and "two numbers add to ${2 * P + 1}" means "two numbers in one box".` },
    { type: 'diagram', diagram: 'table', spec: { caption: `Boxes for the target ${2 * P + 1}`, columns: ['box', 'the two numbers in it'], rows: Array.from({ length: P }, (_, i) => [String(i + 1), `${i + 1} and ${2 * P - i}`]) }, caption: `${2 * P} numbers, ${P} boxes of two. Choose ${P + 1} numbers and two must share a box: they add to ${2 * P + 1}. With ${P} numbers you can take one from each box and avoid it.` },
    { type: 'check', scope: 'hidden boxes: pairs with a fixed sum', questions: [
      { make: (rng) => { const p = rng.int(4, 9); return { type: 'number', q: `You choose different numbers from 1 to ${2 * p}. How many must you choose to be sure that two of them add up to ${2 * p + 1}?`, answer: p + 1, hints: ['Which numbers pair up to the target?', `There are ${p} pairs.`], explain: `${p} pairs are the boxes; ${p} numbers can take one from each, number ${p + 1} must complete a pair.` }; } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Name the boxes and the cap: which categories can get crowded, and how many items may each take while the event still fails?', why: 'The event "some box has more than m" fails exactly when every box holds m or fewer. That cap m is the number to find.', answers: 'one-box',
        checks: [
          { type: 'choice', q: 'Socks in 6 colours, event "at least two socks of the same colour". Boxes and cap?', options: ['6 boxes (colours), cap 1', '6 boxes, cap 2', 'one box per sock, cap 1', '2 boxes (match or not), cap 1'], answer: 0, traps: { 1: 'a box with 2 socks already is a match', 2: 'the socks are the items, not the boxes', 3: 'the boxes are categories that items fall into' }, explain: 'Colours are the boxes; the event fails while every colour has at most one sock.' },
        ] },
      { say: 'Capacity: k boxes with at most m each hold at most k × m items without the event.', why: 'Add the caps. This is the most items that can be placed while avoiding the event.', answers: 'even-spread',
        checks: [
          { make: (rng) => { const k = rng.int(10, 20), m = rng.int(2, 6); return { type: 'number', q: `${k} boxes, event "some box has more than ${m}". How many items can be placed without the event?`, answer: k * m, explain: `${k} × ${m} = ${k * m}.` }; } },
        ] },
      { say: 'Compare. If n > k × m, every outcome contains the event: P = 1. Which outcome happened, and how likely it was, no longer matters.', why: 'Every possible placement has some box over the cap, so the event is the whole sample space.', answers: 'excess',
        checks: [
          { make: (rng) => { const p = rng.int(4, 8); return mc(rng, `You choose ${p + 1} different numbers at random from 1 to ${2 * p}. P(two of them add up to ${2 * p + 1})?`, '1', [[Q.of(p + 1, 2 * p).toString(), 'used the share of numbers chosen as a probability'], [`1/${2 * p - 1}`, 'used the chance that two particular numbers are partners'], ['1/2', 'treated it as a coin flip']], `${p} pairs, ${p + 1} numbers: two share a pair in every choice.`, { hinge: true }); } },
        ] },
      { say: 'If n ≤ k × m, the event can be avoided, so it is uncertain. Count the complement: P = 1 − P(every box within the cap).', why: 'Pigeonhole no longer decides; it hands you the boxes that organise an ordinary count.',
        checks: [
          { make: (rng) => { const c = rng.int(4, 6), s = rng.int(4, 8), d = rng.int(2, 3); const v = one.sub(allDiff(c, s, d)); return mc(rng, `A drawer holds ${s} socks of each of ${c} colours. You take ${d} in the dark. P(at least two of the same colour)?`, v.toString(), [['1', `${d} socks can all differ when there are ${c} colours`], [allDiff(c, s, d).toString(), 'answered the complement: all different'], [`1/${c}`, 'used the chance that two particular socks match']], `All different: ${chain(c, s, d)} = ${allDiff(c, s, d)}. So P = ${v} ≈ ${d3(v)}.`); } },
        ] },
      { say: 'The general form: n items in k boxes put at least ⌈n/k⌉ (n/k rounded up) in some box.', why: 'If every box had fewer than n/k, the total would be below n.',
        checks: [
          { make: (rng) => { const k = rng.int(5, 12), n = k * rng.int(3, 7) + rng.int(1, k - 1); return { type: 'number', q: `${n} items are placed in ${k} boxes. The fullest box holds at least how many?`, answer: Math.ceil(n / k), hints: [`Divide ${n} by ${k}.`, 'Round up: a fraction of an item still forces one more.'], explain: `${n}/${k} ≈ ${(n / k).toFixed(2)}, rounded up: ${Math.ceil(n / k)}.` }; } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why is the answer to the coins question exactly 1, and not just "very likely"?', model: 'Probability 1 means every outcome is in the event. The most even spread holds at most k × m coins without any box going over m. With more coins than that, even this best attempt overflows, and every other spread is less even, so it overflows too. There is no outcome left that avoids the event.', points: ['the worst case is the most even spread', 'capacity k × m is below n, so even the worst case overflows', 'an event that contains every outcome has probability exactly 1'] },

    S('worked'),
    { type: 'worked', family: 'pigeonhole', section: 'bto', difficulty: 1, seed: 'a', explainAt: [1], intro: 'Coins into boxes. Run the capacity check before anything else.' },
    { type: 'worked', family: 'pigeonhole', section: 'bto', difficulty: 2, seed: 'b', fade: 1, intro: 'Here the check fails, so the event is uncertain. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: '61 coins into 15 boxes: P(some box holds more than 4)? Now 60 coins: same answer?', answer: `61: exactly 1, since 15 × 4 = ${15 * 4} < 61. 60: below 1, because all 15 boxes at exactly 4 is possible (though very unlikely).`, explain: 'One coin moves the answer from "certain" to "almost certain". The options will often contain both 1 and a number just below it.' },

    S('traps'),
    { type: 'traps', family: 'pigeonhole', section: 'bto', extra: [
      { belief: 'The question is about one box, so compute a binomial tail.', fix: '"Some box" is a different event from "box 3". Check capacity first; for "some box" the answer may be exactly 1.' },
      { belief: 'An even spread keeps every box at the cap, so the event is unlikely.', fix: 'Test it: k × m < n means the even spread itself overflows.' },
      { belief: 'More items than boxes always forces a repeat, whatever the cap.', fix: 'The comparison is with k × m, not k. For "more than 1 per box" the cap is 1, so k × 1 = k.' },
    ] },
    { type: 'erroneous', problem: `A drawer holds ${E.s} socks in each of ${E.c} colours. A candidate works out P(a matching pair) when ${E.d} socks are taken. One step is wrong.`, steps: [
      `The boxes are the ${E.c} colours; the event "a matching pair" fails while each colour has at most one sock.`,
      `Capacity without a match: ${E.c} × 1 = ${E.c} socks.`,
      `${E.d} socks go into ${E.c} colours, so two must share a colour: P = 1.`,
      'Answer: 1.',
    ], errorStep: 2, explain: `${E.d} ≤ ${E.c}: the capacity is not exceeded, so all-different is possible and pigeonhole says nothing. Count the complement: P = 1 − ${chain(E.c, E.s, E.d)} = ${one.sub(allDiff(E.c, E.s, E.d))} ≈ ${d3(one.sub(allDiff(E.c, E.s, E.d)))}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `40 coins into 13 boxes. A candidate answers about ${d3(oneBox(40, 13, 3))} for "some box has more than 3". Which belief?`, options: ['Computed the chance for one particular box', 'Applied pigeonhole without checking capacity', 'Answered the complement of the right value'], answer: 0, traps: { 1: 'unchecked pigeonhole gives exactly 1, not a small number', 2: 'the complement of 1 is 0, not a small positive number' }, explain: `${d3(oneBox(40, 13, 3))} is a one-box binomial tail. "Some box" is certain: 13 × 3 = ${13 * 3} < 40.` },
      { type: 'choice', q: '4 socks from 5 colours. A candidate answers 1 for P(a matching pair). Which belief?', options: ['Applied pigeonhole though 4 socks fit 5 colours', 'Computed the chance for one particular colour', 'Answered the complement: all four differ'], answer: 0, traps: { 1: 'one colour gives a small chance, not 1', 2: 'all-different is a probability well below 1' }, explain: '5 colours can take 4 socks with no repeat, so the match is uncertain.' },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Do the capacity check first, before any formula: boxes × cap, compare with items. It costs ten seconds of the ${SECTIONS.bto.exam.perItemSeconds} you have. If the check passes, pick 1 and move on.` },
    { type: 'callout', tone: 'speed', text: 'Option sanity: if 1 is among the options and the question says "some" or "at least two of the same", run the check. If the check fails, 1 is the trap option and the answer is a complement.' },
    { type: 'thinkaloud', problem: `${TA.n} coins are thrown at random into ${TA.k} boxes. What is the probability that some box holds more than ${TA.m} coins?`, lines: [
      { t: 0, say: 'Coins into boxes, and "some box" gets crowded. Before any formula: can the event be avoided at all?' },
      { t: 4, say: `Box 1 gets more than ${TA.m} with ${TA.n} coins at chance 1/${TA.k} each: a binomial tail...`, slip: true },
      { t: 8, say: `Wait, the prize is some box, not box 1. Worst case instead: ${TA.k} boxes at the cap hold ${TA.k} × ${TA.m} = ${TA.k * TA.m} coins.` },
      { t: 13, say: `${TA.n} > ${TA.k * TA.m}: even the most even spread overflows. Every outcome is in the event, so P = 1.` },
      { t: 17, say: `Sanity check: the one-box tail would be about ${d3(oneBox(TA.n, TA.k, TA.m))}, a trap option. Answer 1, with ${SECTIONS.bto.exam.perItemSeconds - 17} seconds to spare.` },
    ] },
    { type: 'check', scope: 'the ten-second capacity check', questions: [
      { make: (rng) => { const k = rng.int(10, 16), m = rng.int(3, 5); const sure = `${k * m + 1} coins into ${k} boxes: some box has more than ${m}`; return mc(rng, 'Which event is certain?', sure, [[`${k * m} coins into ${k} boxes: some box has more than ${m}`, `${k} × ${m} = ${k * m} exactly fits`], [`${k * m + 1} coins into ${k} boxes: box 1 has more than ${m}`, 'one particular box is never forced'], [`${k} coins into ${k} boxes: some box has more than 1`, `${k} coins can take one box each`]], `${k} × ${m} = ${k * m} < ${k * m + 1}.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: '"Some box gets more than m": check n > k·m. Yes → P = 1. No → P = 1 − P(every box within m).' },

    S('contrast'),
    { type: 'compare', columns: ['Question', 'Items against capacity', 'Answer'], rows: [
      ['some box gets more than m', 'n > k·m', 'exactly 1'],
      ['some box gets more than m', 'n ≤ k·m', '1 − P(all within m)'],
      ['a particular box gets more than m', 'any', 'binomial tail, small'],
      ['two share a birthday (23 people)', '23 < 365', 'about 1/2 (bto/birthday)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: n = k·m exactly is the first uncertain case (the perfectly even spread). With a cap of 1 the check reads n > k: more items than boxes forces a repeat, so 366 people guarantee a shared birthday (ignoring leap years).' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: whenever a question asks "must", "at least one box", or has 1 or 0 among the options, look for the worst case first. The birthday problem (bto/birthday) is the uncertain side of the same boxes, and in NumberLogic or Intervals a forced value is also found by asking what the extreme case allows.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'number', q: 'Ignoring leap years, how many people guarantee that two share a birthday?', answer: 366, explain: '365 boxes with cap 1 hold 365 people; person 366 forces a repeat.' },
      { type: 'number', q: 'How many people guarantee that three share a birth month?', answer: 12 * 2 + 1, hints: ['Cap 2 per month.', 'Capacity 12 × 2.'], explain: `12 months with at most 2 each hold ${12 * 2}; one more forces three.` },
    ] },
    { type: 'variation', base: `${N} coins are thrown at random into ${K} boxes. P(some box has more than ${M}) = 1, because ${K} × ${M} = ${K * M} < ${N}.`, rows: [
      { change: 'Drop the coins one at a time and watch them land', effect: 'No change: still 1. The capacity argument only looks at the final counts, never at the order they arrived in.', same: true },
      { change: `Use ${K * M} coins instead of ${N}`, effect: `Below 1. All ${K} boxes at exactly ${M} is now a legal outcome, so the event can be avoided: count 1 − P(every box within ${M}).` },
      { change: 'Ask about box 1 instead of some box', effect: `A binomial tail, about ${d3(oneBox(N, K, M))}. No single box is ever forced to overflow.` },
      { change: `Use ${N + K} coins and ask for more than ${M + 1}`, effect: `Still exactly 1. The cap rises by one per box, so capacity rises by ${K} to ${K * (M + 1)}, and the coins rose by ${K} too: ${N + K} > ${K * (M + 1)}. The two changes cancel.`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const t = rng.int(3, 5), r = rng.int(1, 4), n = 7 * (t - 1) + r; return mc(rng, `${n} people are in a room. P(at least ${t} of them were born on the same day of the week)?`, '1', [['1/7', 'used the chance that one person has a given weekday'], ['1/2', 'treated "crowded or not" as a coin flip'], [Q.of(r, n).toString(), 'used the excess people as a fraction of everyone']], `7 weekdays with at most ${t - 1} each hold ${7 * (t - 1)} people; ${n} > ${7 * (t - 1)}, so some weekday gets ${t} in every outcome.`); } },
      far: { make: (rng) => { const d = rng.int(5, 12); return { type: 'number', q: `You pick whole numbers. How many must you pick to be sure that two of them differ by a multiple of ${d}?`, answer: d + 1, hints: [`Two numbers differ by a multiple of ${d} exactly when they leave the same remainder on division by ${d}.`, `There are ${d} possible remainders: those are the boxes.`], explain: `The ${d} remainders are the boxes with cap 1. ${d} numbers can all leave different remainders; number ${d + 1} must repeat one.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from coins in boxes to both new questions?', options: ['Worst case: fill every box to its cap, compare with items', 'Binomial tail: the chance one given box gets crowded', 'Even spread: items share out, so crowding is rare', 'Excess share: the items over capacity divided by all'], answer: 0, traps: { 1: 'a given box is never forced; "some box" is', 2: 'the even spread is exactly the case that overflows', 3: 'a certain event has probability 1, not a ratio' }, explain: 'Weekdays and remainders are hidden boxes. Capacity (boxes × cap) against the number of items decides whether the event is forced.' } },

    S('tryit'),
    { type: 'tryit', family: 'pigeonhole', section: 'bto', count: 3 },
  ],
};
