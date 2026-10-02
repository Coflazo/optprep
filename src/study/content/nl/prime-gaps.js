// NumberLogic family lesson: the gaps are consecutive primes. Every number shown is computed here.
import { S, seq, diffs, ladderRows, nextQ, pick, num, arith, PRIMES } from './method-ladder.js';

// a, then add PRIMES[s], PRIMES[s + 1], …: the generator's parametrisation.
const pg = (a, s, n) => { const o = [a]; for (let i = 1; i < n; i++) o.push(o[i - 1] + PRIMES[s + i - 1]); return o; };
const g = (xs) => diffs(xs);
const isPrime = (n) => n > 1 && PRIMES.every((p) => p * p > n || n % p);
const oddComposite = (p, q) => { for (let v = p + 2; v < q; v += 2) if (!isPrime(v)) return v; return null; };
const fac = (v) => { const d = PRIMES.find((p) => v % p === 0); return `${d} × ${v / d}`; };

const CH = pg(4, 0, 7);
const E1 = pg(10, 1, 7);
const E2 = pg(1, 3, 7);
const E3 = pg(5, 6, 7);
const PRED = pg(2, 0, 7);
const ERRs = 1, ERR = pg(3, ERRs, 7);
const AI = [3]; while (AI.length < 6) AI.push(AI[AI.length - 1] + AI.length + 1);
const AI2 = [CH[0]]; while (AI2.length < 6) AI2.push(AI2[AI2.length - 1] + AI2.length + 1);
const SQ = Array.from({ length: 6 }, (_, i) => (i + 2) ** 2 + 1);
const COMPOSITE_ODDS = arith(9, 2, 26).filter((v) => !isPrime(v));
const CUM = PRIMES.slice(0, 6).map((_, i) => PRIMES.slice(0, i + 1).reduce((a, b) => a + b, 0));

// Start positions in the prime list as in the generator (level 3: 0..2, level 4: 2..7). Gap runs
// starting at 5, 11 or 13 also read as a shifted run of later primes (5, 7, 11, 13, 17 is
// 11, 13, 17, 19, 23 minus 6; checked with the rule finder), so those starts are skipped.
const STARTS = [0, 1, 3, 6, 7];
function draw(rng, n = 6) { const s = rng.pick(STARTS), a = rng.int(1, 20); return { s, a, n, xs: pg(a, s, n + 2) }; }
const gapAfter = (p) => p.s + p.n - 1; // index in PRIMES of the next gap

export default {
  id: 'nl/prime-gaps',
  book: 'nl',
  kind: 'family',
  family: 'prime-gaps',
  title: 'Gaps that are the primes',
  summary: 'Irregular but rising gaps that never settle: check whether they are consecutive primes, then add the next prime.',
  prerequisites: ['nl/method-ladder', 'nl/add-index', 'nl/primes'],
  objectives: [
    'Recognise a run of consecutive primes in the gap row',
    'Name the prime after any prime below 60 without skipping one',
    'Reject odd composites such as 9, 15, 21 and 25 as gaps',
    'Add the next prime to the last term',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'ladder', label: 'Keep taking differences', approach: `Took a second row (${seq(g(g(CH.slice(0, 6))))}) and a third, hoping one settles.`, breaksAt: 'Rows built from the primes never settle.' },
      { id: 'count', label: 'Read the gaps as counting', approach: `Read ${seq(g(CH.slice(0, 3)))} as roughly counting up and added ${g(CH)[4] + 1}.`, breaksAt: `The gaps skip 4 and 6: they are the primes, not the counting numbers.` },
      { id: 'odd', label: 'Take the next odd number', approach: `Took the odd number after the last gap as the next gap.`, breaksAt: `Odd numbers such as ${COMPOSITE_ODDS.slice(0, 4).join(', ')} are not prime.` },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with a second row of differences, once by naming the gaps themselves.`, answer: String(CH[6]), explain: `Gaps ${seq(g(CH.slice(0, 6)))}; their gaps ${seq(g(g(CH.slice(0, 6))))} are irregular, so a second row does not help. Named: the gaps are the primes ${seq(g(CH.slice(0, 6)))}, so the next gap is ${g(CH)[5]} and ${CH[5]} + ${g(CH)[5]} = ${CH[6]}.` },
    { type: 'text', text: `The gaps rise, but not steadily: ${seq(PRIMES.slice(0, 5))} jumps by ${seq(diffs(PRIMES.slice(0, 5)))}. No row of differences ever settles. The gap row is a **famous list**, the primes, and you continue it by knowing the next prime.` },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 6))}, ?`] },
    { type: 'check', scope: 'the cue: the gap row is the primes', questions: [
      { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 6), b = rng.int(1, 20), ai = [b]; while (ai.length < 6) ai.push(ai[ai.length - 1] + ai.length + 1); const o = Array.from({ length: 6 }, (_, i) => (i + 2) ** 2 + rng.int(1, 9)); return pick(rng, 'Which sequence adds consecutive primes?', seq(xs), [[seq(ai), `its gaps ${seq(g(ai))} count up by 1`], [seq(o), `its gaps ${seq(g(o))} are the odd numbers; ${g(o)[2]} is fine, but ${g(o).find((v) => !isPrime(v))} is not prime`]], `Gaps ${seq(g(xs))}: consecutive primes.`); } },
    ] },
    { type: 'text', text: `Not this lesson: gaps that count up 2, 3, 4, 5 (${seq(AI)}, the add-the-index lesson), or gaps that are the odd numbers (${seq(SQ)}, squares plus a constant). Also terms that are themselves primes (the primes lesson).` },
    { type: 'check', scope: 'the neighbouring lists', questions: [
      { type: 'choice', q: '5, 10, 17, 26, 37, 50: which lesson is it?', options: ['squares plus 1: gaps are odd', 'gaps that are the primes', 'the terms are primes'], answer: 0, traps: { 1: 'the gaps 5, 7, 9, 11, 13 include 9, which is not prime', 2: '10 and 26 are not prime' }, explain: '2² + 1, 3² + 1, …, 7² + 1: gaps run through the odd numbers.' },
    ] },

    S('why'),
    { type: 'text', text: 'Hiding the primes one layer down is a favourite way to make a list look random. Primes have no formula, so no ladder, ratio or recurrence ever catches them: recognition is the only route. Once you see them, the item costs one addition. The traps are all about the next prime: skipping one, or taking an odd number that is not prime. Both are cheap to avoid if you know the primes to 60 and test each odd candidate for a factor of 3, 5 or 7.' },

    S('anchor'),
    { type: 'text', text: `In the add-the-index lesson the gaps were the counting numbers ${seq(arith(2, 1, 4))}. This family changes **one thing**: the gaps are the **primes** ${seq(PRIMES.slice(0, 5))}. The method is the same: continue the gap list, then add its next entry to the last term. Only the list itself is harder to continue.` },
    { type: 'check', scope: 'continuing the list of primes', questions: [
      { make: (rng) => { const i = rng.int(3, 12); return num(`The gaps of a sequence are the primes ${seq(PRIMES.slice(i, i + 4))}. What is the next gap?`, PRIMES[i + 4], `The prime after ${PRIMES[i + 3]} is ${PRIMES[i + 4]}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: `Build two rows. The gap row rises; the row under it jumps around (${seq(diffs(PRIMES.slice(0, 7)))}) and never settles. That irregular second row is the signal to stop subtracting and name the gap row instead.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(CH.slice(0, 6), 2) }, caption: `${seq(CH.slice(0, 6))}: gaps ${seq(g(CH.slice(0, 6)))} (the primes), second row ${seq(g(g(CH.slice(0, 6))))}: irregular. Subtraction will not settle; recognition will.` },
    { type: 'check', scope: 'the irregular second row', questions: [
      { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 6); return pick(rng, `${seq(xs)} has gaps ${seq(g(xs))} and second row ${seq(g(g(xs)))}. What next?`, 'name the gap row', [['take a third row', `${seq(g(g(g(xs))))} is irregular too: rows of primes never settle`], ['divide the gaps', 'the gaps do not share a ratio']], 'The gaps are a known list.'); } },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['prime', ...PRIMES.slice(0, 17).map(String)], rows: [['gap to the next prime', ...PRIMES.slice(0, 17).map((p, i) => String(PRIMES[i + 1] - p))]] }, caption: `The primes up to ${PRIMES[16]}, with the gap to the next one. Every odd number that is missing from the top row is a product: ${COMPOSITE_ODDS.slice(0, 8).map((v) => `${v} = ${fac(v)}`).join(', ')}.` },
    { type: 'check', scope: 'the primes to 60', questions: [
      { hinge: true, make: (rng) => { let i; do i = rng.int(3, 15); while (!oddComposite(PRIMES[i], PRIMES[i + 1])); const p = PRIMES[i], c = oddComposite(p, PRIMES[i + 1]); return pick(rng, `Which number is the next prime after ${p}?`, PRIMES[i + 1], [[c, `${c} = ${fac(c)}: odd, but not prime`], [PRIMES[i + 2], `that skips ${PRIMES[i + 1]}`], [p + 2 === c ? p + 4 : p + 2, `it is not the next number of the list: ${p + 2 === c ? p + 4 : p + 2} ${isPrime(p + 2 === c ? p + 4 : p + 2) ? 'comes later' : 'is not prime'}`]].filter(([v]) => v !== PRIMES[i + 1]), `${PRIMES[i + 1]} is prime, and nothing between ${p} and it is.`); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1, 1), predicted: true }, caption: `${seq(E1.slice(0, 6))}: gaps ${seq(g(E1.slice(0, 6)))}. Outlined: the next prime ${g(E1)[5]}, then ${E1[5]} + ${g(E1)[5]} = ${E1[6]}.` },
    { type: 'check', scope: 'continuing the gap row', questions: [
      { type: 'number', q: 'What comes next?  10, 13, 18, 25, 36, 49, 66, ?', answer: 85, explain: 'Gaps 3, 5, 7, 11, 13, 17: the next prime is 19, so 66 + 19 = 85.' },
    ] },

    S('derivation'),
    { type: 'text', text: `The same moves on a harder item, ${seq(E3.slice(0, 6))}: gaps ${seq(g(E3.slice(0, 6)))}, second row ${seq(g(g(E3.slice(0, 6))))}, irregular. The gaps are consecutive primes starting at ${g(E3)[0]}. After ${g(E3)[4]} come ${arith(g(E3)[4] + 2, 2, (g(E3)[5] - g(E3)[4]) / 2 - 1).map((v) => `${v} = ${fac(v)}`).join(' and ')}, so the next prime is ${g(E3)[5]} and the next term ${E3[5]} + ${g(E3)[5]} = ${E3[6]}. Larger primes only make the last check longer.` },
    { type: 'steps', steps: [
      { say: 'Take the gaps, later minus earlier.', why: 'Always the first test; here it produces the list you will recognise.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 6); return num(`${seq(xs)}: what is the last gap?`, g(xs)[4], `Gaps: ${seq(g(xs))}.`); } },
        ] },
      { answers: 'ladder', say: 'Take the second row. If it is irregular (not constant, not doubling), the gap row is not a ladder rule: stop subtracting.', why: 'Each further row of a prime list is just as irregular. Subtracting more only wastes time.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 6); return pick(rng, `${seq(xs)}: is the second row constant?`, 'No', [['Yes', `the second row is ${seq(g(g(xs)))}`]], `Second row: ${seq(g(g(xs)))}.`); } },
        ] },
      { answers: 'count', say: 'Name the gap row: are the gaps consecutive primes, with none skipped?', why: 'The primes are the one famous list no ladder finds, so they must be recognised by sight.',
        checks: [
          { make: (rng) => { const p = draw(rng), xs = p.xs.slice(0, 6), gs = g(xs); return pick(rng, `The gaps of ${seq(xs)} are ${seq(gs)}. What are they?`, 'consecutive primes', [['odd numbers', `${gs.find((v, i) => i && v - gs[i - 1] !== 2) ? 'consecutive gaps differ by more than 2' : 'they skip odd numbers'}: odd numbers go up by 2 every time`], ['numbers that count up by 1', `${seq(gs.slice(0, 2))} already jumps by ${gs[1] - gs[0]}`]], `${seq(gs)} are consecutive primes.`); } },
        ] },
      { answers: 'odd', say: 'Find the next prime after the last gap. Check every odd number in between: skip the ones with a factor.', why: 'The next gap is the next entry of the list, so a skipped prime or an odd composite gives a wrong term.',
        checks: [
          { make: (rng) => { const p = draw(rng); return num(`${seq(p.xs.slice(0, 6))}, ? The gaps are consecutive primes ending in ${PRIMES[gapAfter(p) - 1]}. What is the next gap?`, PRIMES[gapAfter(p)], `The prime after ${PRIMES[gapAfter(p) - 1]} is ${PRIMES[gapAfter(p)]}.`); } },
        ] },
      { say: 'Next = last term + next prime.', why: 'Climb back up exactly as with any gap row.',
        checks: [
          { make: (rng) => { const p = draw(rng); return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Next gap ${PRIMES[gapAfter(p)]}: ${p.xs[5]} + ${PRIMES[gapAfter(p)]} = ${p.xs[6]}.`, ['Name the gap row.', 'Add the next prime to the last term.']); } },
        ] },
    ] },
    { type: 'explain', prompt: 'Why does no row of differences ever settle for a prime gap row, and what replaces the ladder here?', model: `The primes follow no polynomial or ratio rule, so their differences (${seq(diffs(PRIMES.slice(0, 7)))}, …) stay irregular at every level. The ladder only finds rules with a constant layer. What replaces it is recognition: knowing the primes by sight and continuing the list.`, points: ['Primes have no formula, so no difference row is constant', 'The signal is an irregular but rising gap row', 'Recognition of the list replaces the ladder'] },

    S('worked'),
    { type: 'worked', family: 'prime-gaps', section: 'nl', difficulty: 3, seed: 'a', explainAt: [1], intro: 'Gaps from the small primes. Name the gap row before opening the solution.' },
    { type: 'worked', family: 'prime-gaps', section: 'nl', difficulty: 4, seed: 'b', fade: 1, intro: 'Gaps from larger primes. The gap row is given; the next prime is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 6))}, ? Predict the next gap before adding anything.`, answer: `${g(PRED)[5]}: the gaps are ${seq(g(PRED.slice(0, 6)))}, and the prime after ${g(PRED)[4]} is ${g(PRED)[5]}. The term is ${PRED[5]} + ${g(PRED)[5]} = ${PRED[6]}.`, explain: 'The gap row is the whole puzzle; the addition is the easy part.' },

    S('traps'),
    { type: 'traps', family: 'prime-gaps', section: 'nl', extra: [
      { belief: 'Odd numbers after 2 are prime.', fix: `${COMPOSITE_ODDS.slice(0, 6).join(', ')} are odd and not prime. Test each odd candidate for a factor.` },
      { belief: 'The gaps grow by 2 from here on.', fix: 'Consecutive primes do not step evenly. Name the next prime.' },
      { belief: 'The second row will settle if you go deeper.', fix: 'Prime rows never settle. Stop after the second row and name the list.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `Gaps: ${seq(g(ERR.slice(0, 6)))}: consecutive primes.`,
      `The next odd number after ${PRIMES[ERRs + 4]} is ${PRIMES[ERRs + 4] + 2}, so that is the next gap.`,
      `Next = ${ERR[5]} + ${PRIMES[ERRs + 4] + 2} = ${ERR[5] + PRIMES[ERRs + 4] + 2}.`,
      `Answer: ${ERR[5] + PRIMES[ERRs + 4] + 2}.`,
    ], errorStep: 1, explain: `${PRIMES[ERRs + 4] + 2} = ${fac(PRIMES[ERRs + 4] + 2)} is not prime. The prime after ${PRIMES[ERRs + 4]} is ${PRIMES[ERRs + 5]}, so the answer is ${ERR[5]} + ${PRIMES[ERRs + 5]} = ${ERR[6]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = draw(rng), last = p.xs[5], lp = PRIMES[gapAfter(p) - 1], np = PRIMES[gapAfter(p)], c = oddComposite(lp, np); const w = [[last + PRIMES[gapAfter(p) + 1], `skipped a prime: the gap after ${lp} is ${np}`], [last + lp + 2, `assumed the gaps step by 2 (${lp} → ${lp + 2})`], [last + lp, 'repeated the last gap'], [p.xs[7], 'went one step too far: that is the term after the next one']]; if (c) w.unshift([last + c, `used ${c} as the gap: ${c} = ${fac(c)} is not prime`]); return pick(rng, nextQ(p.xs.slice(0, 6)), p.xs[6], w, `Next prime ${np}: ${last} + ${np} = ${p.xs[6]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the primes to 60 by sight: ${seq(PRIMES.slice(0, 17))}. The odd numbers that are **not** prime in that range are the ones to watch: ${COMPOSITE_ODDS.filter((v) => v < 60).join(', ')}.` },
    { type: 'check', scope: 'the primes to 60', questions: [
      { type: 'choice', q: 'Which odd number below 60 is not prime?', options: ['51', '53', '47', '59'], answer: 0, traps: { 1: '53 is prime', 2: '47 is prime', 3: '59 is prime' }, explain: '51 = 3 × 17: its digit sum 6 is divisible by 3.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'Quick prime test up to 60: an odd number is prime unless it is divisible by 3, 5 or 7 (checks by digit sum, last digit, and one division). Two gaps in, if the gaps are 2, 3, 5 or start on any prime and keep hitting primes, assume the list and verify one more.' },
    { type: 'thinkaloud', problem: nextQ(E2.slice(0, 6)), lines: [
      { t: 0, say: `Gaps: ${seq(g(E2.slice(0, 6)))}. Rising, but unevenly.` },
      { t: 5, say: `Second row ${seq(g(g(E2.slice(0, 6))))}: irregular. Stop subtracting and name the gaps: consecutive primes.` },
      { t: 10, say: `After ${g(E2)[4]} comes ${oddComposite(g(E2)[4], g(E2)[5])}, so the next gap is ${oddComposite(g(E2)[4], g(E2)[5])}: ${E2[5] + oddComposite(g(E2)[4], g(E2)[5])}.`, slip: true },
      { t: 14, say: `Wait: ${oddComposite(g(E2)[4], g(E2)[5])} = ${fac(oddComposite(g(E2)[4], g(E2)[5]))}, not prime. The prime after ${g(E2)[4]} is ${g(E2)[5]}.` },
      { t: 19, say: `${E2[5]} + ${g(E2)[5]} = ${E2[6]}. Answer ${E2[6]}.` },
    ] },
    { type: 'check', scope: 'primes to 60 and the quick test', questions: [
      { make: (rng) => { const p = draw(rng); return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Gaps ${seq(g(p.xs.slice(0, 6)))}; next prime ${PRIMES[gapAfter(p)]}; ${p.xs[5]} + ${PRIMES[gapAfter(p)]} = ${p.xs[6]}.`, ['Name the gap row.', 'Next prime: test the odd numbers after the last gap for 3, 5, 7.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Rising gaps with an irregular second row → check for consecutive primes; next = last + the next prime (never an odd composite).' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Gap list', 'Next'], rows: [
      [seq(AI), seq(g(AI)), 'counting numbers', String(AI[5] + g(AI)[4] + 1)],
      [seq(SQ.slice(0, 5)), seq(g(SQ.slice(0, 5))), 'odd numbers (squares + 1)', String(SQ[5])],
      [seq(CH.slice(0, 6)), seq(g(CH.slice(0, 6))), 'primes (this lesson)', String(CH[6])],
      [seq(PRIMES.slice(0, 6)), seq(g(PRIMES.slice(0, 6))), 'the terms are the primes', String(PRIMES[6])],
    ] },
    { type: 'variation', base: `${seq(CH.slice(0, 6))}, ? (gaps are the primes from 2, next ${CH[6]})`, rows: [
      { change: `Start at ${CH[0] + 6} instead of ${CH[0]}`, effect: `${seq(pg(CH[0] + 6, 0, 6))}: the same gaps, every term 6 higher, next ${pg(CH[0] + 6, 0, 7)[6]}.` },
      { change: 'The gaps start at 3 instead of 2', effect: `${seq(pg(CH[0], 1, 6))}: the next gap is ${PRIMES[6]}, so ${pg(CH[0], 1, 7)[6]}.` },
      { change: 'The gaps are the counting numbers 2, 3, 4, … instead', effect: `${seq(AI2)}: the add-the-index rule, next ${AI2[5] + 7}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the gap list still ends at ${g(CH)[4]}, so the next gap is still ${g(CH)[5]} and the next term ${CH[6]}.` },
      { change: `Start at ${CH[0] + 6} and begin the gaps at 3, together`, fusion: true, effect: `The start shifts every term and the gap list moves one prime along: ${seq(pg(CH[0] + 6, 1, 6))}, next ${pg(CH[0] + 6, 1, 7)[6]}.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: gaps starting 2, 3 look like "add 2, then 3", a counting rule, until the third gap is 5 instead of 4; so read at least four gaps before deciding. A gap row that starts at a larger prime (7, 11, 13, 17) is the same rule, just further along the list.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2), a = rng.int(1, 15); let xs; if (t === 0) xs = pg(a, 0, 6); else if (t === 1) { xs = [a]; while (xs.length < 6) xs.push(xs[xs.length - 1] + xs.length + 1); } else xs = Array.from({ length: 6 }, (_, i) => (i + 1) ** 2 + a); const names = ['consecutive primes', 'counting numbers', 'odd numbers']; const trp = [[null, `the third gap is ${g(xs)[2]}, not ${g(xs)[1] + 1}`, `${g(xs)[0]} is even`], [`${g(xs).find((v) => !isPrime(v))} is not prime`, null, 'the gaps rise by 1, not 2'], [`${g(xs).find((v) => !isPrime(v))} is not prime`, 'the gaps rise by 2, not 1', null]]; return pick(rng, `${seq(xs)}: what are the gaps?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
    ] },

    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: whenever a derived row looks random, compare it with the lists you know (squares, powers, primes, Fibonacci). The fraction lesson uses the same move on its numerator and denominator rows.' },
    { type: 'transfer',
      near: { make: (rng) => { const p = draw(rng); return num(`Markers stand along a road, the distances between them being consecutive primes: ${seq(p.xs.slice(0, 6))}. Where is the next marker?`, p.xs[6], `Gaps ${seq(g(p.xs.slice(0, 6)))}; next prime ${PRIMES[gapAfter(p)]}; ${p.xs[5]} + ${PRIMES[gapAfter(p)]} = ${p.xs[6]}.`, ['Name the gaps.', 'Add the next prime.']); } },
      far: { type: 'number', q: `The running totals of the primes (2, 2 + 3, 2 + 3 + 5, …) are ${seq(CUM.slice(0, 5))}. What is the next running total?`, answer: CUM[5], explain: `The gaps of the running totals are the primes themselves (${seq(g(CUM.slice(0, 5)))}); the next prime is ${PRIMES[5]}, so ${CUM[4]} + ${PRIMES[5]} = ${CUM[5]}.`, hints: ['Take the gaps of the totals.', 'Add the next prime.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the running totals?', options: ['Name the gap row as a known list and continue it', 'Take differences until one of the rows is constant', 'Divide neighbours and look for a constant ratio', 'Add the two previous totals to get the next total'], answer: 0, traps: { 1: `the rows ${seq(g(g(CUM.slice(0, 5))))} never settle`, 2: `the ratios ${CUM.slice(1, 4).map((v, i) => (v / CUM[i]).toFixed(2)).join(', ')} drift`, 3: `${CUM[1]} + ${CUM[2]} is not ${CUM[3]}` }, explain: 'Running totals have the list itself as their gap row: recognise the primes one layer down, as in this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'prime-gaps', section: 'nl', count: 3 },
  ],
};
