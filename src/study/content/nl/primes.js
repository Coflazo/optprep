// NumberLogic family lesson: prime numbers and simple transforms of them. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nextQ, pick, num, arith, quad, PRIMES } from './method-ladder.js';

const isPrime = (n) => n > 1 && PRIMES.every((p) => p * p > n || n % p);
const g = (xs) => diffs(xs);
const P100 = PRIMES.filter((p) => p < 100);
const ODDC = Array.from({ length: 49 }, (_, i) => 2 * i + 3).filter((n) => n < 100 && !isPrime(n));
const DECADES = Array.from({ length: 10 }, (_, d) => P100.filter((p) => Math.floor(p / 10) === d));
const fac = (c) => { const d = PRIMES.find((q) => c % q === 0); return `${d} × ${c / d}`; };
const nextOddComposite = (p) => { for (let v = p + 2; ; v += 2) if (!isPrime(v)) return v; };

// Transform of a prime: al·p + be, or p² (sq).
const tf = ({ al, be, sq }, p) => (sq ? p * p : al * p + be);
const run = (t, s, n) => Array.from({ length: n }, (_, i) => tf(t, PRIMES[s + i]));
const name = ({ al, be, sq }) => (sq ? 'p²' : `${al === 1 ? '' : `${al}p`}${al === 1 ? 'p' : ''}${be ? ` ${be < 0 ? '−' : '+'} ${Math.abs(be)}` : ''}`);
const undo = ({ al, be, sq }) => (sq ? 'take square roots' : al === 1 && !be ? 'nothing to undo' : `${be ? `${be < 0 ? 'add' : 'subtract'} ${Math.abs(be)}` : ''}${be && al > 1 ? ', then ' : ''}${al > 1 ? `divide by ${al}` : ''}`);

const PLAIN = { al: 1, be: 0, sq: false };
const CH = run(PLAIN, 4, 7);
const E1 = run(PLAIN, 9, 7); // gaps 2, 6, 4, 2, 4: no alternating pattern to mislead
const T2 = { al: 2, be: 1, sq: false }, E2 = run(T2, 1, 6);
const TS = { al: 1, be: 0, sq: true }, E3 = run(TS, 0, 6);
const ERt = { al: 2, be: 1, sq: false }, ERs = 3, ER = run(ERt, ERs, 6);
const PRs = 8, PR = run(PLAIN, PRs, 6);
const ODD = arith(3, 2, 6);
const PG = [1]; for (let i = 0; PG.length < 6; i++) PG.push(PG[PG.length - 1] + PRIMES[i]);
const QD = quad(2, 1, 2, 6);

// A short run of primes can fit a second rule: gaps that alternate (7, 11, 13, 17, 19, 23 goes
// +4, +2, +4, …) or the same gap shape elsewhere in the list (5, 7, 11, 13 and 11, 13, 17, 19).
// Checks only draw windows of n − 1 shown primes whose gap shape is unique and not alternating.
// Windows (by start index and number of shown terms) that the rule finder in src/sections/nl/solver.js
// also fits with a second whole-number rule, whatever the transform, are skipped as well.
const TWO_FACED = { 5: [0, 1, 2, 4, 5, 11, 13, 14, 16], 6: [0, 3, 4, 8, 15] };
const gapsAt = (s, n) => g(PRIMES.slice(s, s + n));
const clean = (s, n) => { if ((TWO_FACED[n] || []).includes(s)) return false; const G = gapsAt(s, n); if (G.every((v, i) => i < 2 || v === G[i - 2])) return false; for (let t = 0; t < 30; t++) { if (t === s) continue; const H = gapsAt(t, n), a = H[0] / G[0]; if (H.every((v, i) => v === a * G[i])) return false; } return true; };
const d2 = (rng, n) => { let s; do s = rng.int(0, 16); while (!clean(s, n - 1)); return { t: PLAIN, s, xs: run(PLAIN, s, n) }; };
const d3 = (rng, n) => { let t, s; do { t = rng.pick([{ al: rng.pick([2, 3]), be: rng.int(-3, 5), sq: false }, { al: 1, be: rng.pick([-1, 1, 2, 3, -3]), sq: false }, { al: 1, be: 0, sq: true }]); s = t.sq ? rng.int(0, 4) : rng.int(2, 14); } while (!t.sq && !clean(s, n - 1)); return { t, s, xs: run(t, s, n) }; };
// Think-aloud window: irregular gaps, and an odd non-prime sits before the next prime (the slip).
const TAt = { al: 2, be: -1, sq: false }, TAs = 6, TA = run(TAt, TAs, 6), TAp = PRIMES.slice(TAs, TAs + 6), TAc = nextOddComposite(TAp[4]);
const E16 = E1.slice(0, 6), T2x = { al: 2, be: 0, sq: false }, T3x = { al: 1, be: 3, sq: false }, Tsq = { al: 1, be: 0, sq: true }, Tboth = { al: 2, be: 3, sq: false };
const vrow = (t) => run(t, 9, 7);
const BIG = PRIMES.map((p, i) => i).filter((i) => PRIMES[i] > 100 && i + 6 < PRIMES.length);
const anyP = (rng, n) => (rng.chance(0.5) ? d2(rng, n) : d3(rng, n));

export default {
  id: 'nl/primes',
  book: 'nl',
  kind: 'family',
  family: 'primes',
  title: 'Prime numbers and their transforms',
  summary: 'Gaps that never settle and no constant layer → primes: undo any transform (×2, + c, squared), take the next prime, redo the transform.',
  prerequisites: ['nl/method-ladder', 'nl/squares-plus'],
  objectives: [
    `Know the ${P100.length} primes below 100 by sight`,
    'Recognise primes from irregular gaps that never settle',
    'Undo a transform (a·p + b or p²) and redo it on the next prime',
    'Avoid the odd numbers that are not prime and the skipped prime',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: the difference ladder, and asking what these numbers have in common.`, answer: String(CH[6]), explain: `The gaps ${seq(g(CH.slice(0, 6)))} never settle, and neither does any row below them. What the terms share: no divisors except 1 and themselves. They are consecutive primes, so the next is the prime after ${CH[5]}: ${CH[6]}.`,
      attempts: [
        { id: 'ladder', label: 'Build more ladder rows', approach: `Took the gaps ${seq(g(CH.slice(0, 6)))}, then their gaps ${seq(g(g(CH.slice(0, 6))))}, waiting for a row to settle.`, breaksAt: 'Prime gaps are irregular at every depth: no row ever settles, so switch from computing to recognising.' },
        { id: 'step-2', label: 'Primes step by 2', approach: `Saw small gaps near the end and answered ${CH[5]} + 2 = ${CH[5] + 2}.`, breaksAt: `It lands on a prime here by luck. Prime gaps vary (${CH[4]} to ${CH[5]} is ${CH[5] - CH[4]}), so find the actual next prime and test it.` },
      ] },
    { type: 'text', text: 'The terms are **consecutive primes**, or every prime transformed the same way: doubled plus a constant, shifted by a constant, or squared. No difference row and no ratio ever settles, because the gaps between primes are irregular by nature.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `Not this lesson: the odd numbers (${seq(ODD)}, a constant gap of 2) and lists whose **gaps** are the primes (${seq(PG)} adds ${seq(g(PG))}), which is a later lesson.` },
    { type: 'check', scope: 'the cue: irregular gaps that never settle', questions: [
      { make: (rng) => { const p = d2(rng, 6), o = arith(rng.int(1, 20) * 2 + 1, 2, 6), q = quad(rng.int(1, 10), rng.int(1, 4), 2, 6); return pick(rng, 'Which list is consecutive primes?', seq(p.xs), [[seq(o), `constant gap 2: odd numbers, and ${o.find((v) => !isPrime(v)) ?? o[5] + 2} is not prime`], [seq(q), `its gaps ${seq(g(q))} grow steadily`]], `${seq(p.xs)}: gaps ${seq(g(p.xs))}, irregular, and every term is prime.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Primes have no formula a ladder can find, so they must be recognised. That makes them a five-second item for anyone who knows the list and a lost minute for anyone who does not. In the second half of the test they come disguised as 2p + 1, p − 3 or p², and the disguise is always one simple step to undo.' },

    S('anchor'),
    { type: 'text', text: `You already know ${seq(PRIMES.slice(0, 6))}. This family changes **at most one thing**: the same transform, such as × 2, + c, or squaring, is applied to every prime in the list.` },
    { type: 'check', scope: 'the next prime', questions: [
      { make: (rng) => { const i = rng.int(3, 20); return num(`What is the next prime after ${PRIMES[i]}?`, PRIMES[i + 1], `${PRIMES[i + 1]} is prime, and every number strictly between ${PRIMES[i]} and ${PRIMES[i + 1]} has a divisor.`, ['Try the odd numbers after it one by one.', 'A number below 100 is prime if 2, 3, 5 and 7 do not divide it.']); } },
    ] },

    S('picture'),
    { type: 'text', text: `Write 1 to 100 in rows of ten and mark the primes. They thin out and bunch unpredictably: gaps of 2, 4, 6 and more, with no rhythm. That irregularity is exactly what you see in the gap row of a prime item.` },
    { type: 'diagram', diagram: 'grid', spec: { rows: 10, cols: 10, cellText: Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => r * 10 + c + 1)), highlight: P100.map((p) => [Math.floor((p - 1) / 10), (p - 1) % 10]), count: P100.length }, caption: `The ${P100.length} primes below 100, highlighted. Apart from 2 and 5, they all sit in the columns ending 1, 3, 7 and 9, but most numbers in those columns are not prime.` },
    { type: 'check', scope: 'reading the prime grid', questions: [
      { make: (rng) => { const p = d2(rng, 7); return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Consecutive primes; the next after ${p.xs[5]} is ${p.xs[6]}.`, ['What do all these numbers have in common?', `Which is the first prime after ${p.xs[5]}?`]); } },
    ] },
    { type: 'text', text: 'The ladder confirms it the hard way: the gaps are irregular, their gaps are irregular, and no row ever becomes constant. When a ladder refuses to settle and the terms look "prime-ish", stop building rows.' },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1.slice(0, 6), 2) }, caption: `${seq(E1.slice(0, 6))}: gaps ${seq(g(E1.slice(0, 6)))}, second row ${seq(g(g(E1.slice(0, 6))))}. Nothing settles, and nothing ever will.` },
    { type: 'check', scope: 'a ladder that never settles', questions: [
      { make: (rng) => { const p = d2(rng, 6), gg = g(g(p.xs)); return pick(rng, `The second row of the ladder for ${seq(p.xs)} is ${seq(gg)}. What does that tell you?`, 'no row will settle: test a known list such as primes', [['the second difference is constant, so extend that row', `the entries ${seq(gg)} differ`], ['build a third row of differences: it will settle there', 'prime gaps never settle at any depth']], 'Irregular rows at every depth are the signal to recognise, not compute.'); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'ladder', say: 'Signal: the gaps are irregular, the second row is irregular, and the ratios are not constant. Suspect primes, possibly transformed.', why: 'Every formula family eventually gives a constant layer; primes never do.',
        checks: [
          { make: (rng) => { const p = d3(rng, 5); return pick(rng, `${seq(p.xs)}: gaps ${seq(g(p.xs))}, no row settles. What do you try next?`, 'undo a simple transform and look for primes', [['build a third row of differences and extend it', 'the rows will not settle: prime gaps are irregular'], ['test the ratios between neighbouring terms', `${p.xs[1]} ÷ ${p.xs[0]} and ${p.xs[2]} ÷ ${p.xs[1]} differ`]], `This is ${name(p.t)} over consecutive primes.`); } },
        ] },
      { say: 'Undo the transform: subtract the constant, then divide by the multiplier, or take square roots. The result must be consecutive primes.', why: 'The same transform was applied to every prime, so undoing it on every term restores the list you know.',
        checks: [
          { make: (rng) => { const t = { al: 2, be: rng.pick([-1, 1, 3]), sq: false }, s = rng.int(1, 8), xs = run(t, s, 5); return num(`${seq(xs)} is 2p ${t.be < 0 ? '−' : '+'} ${Math.abs(t.be)} over consecutive primes. What is the prime behind the last term?`, PRIMES[s + 4], `(${xs[4]} ${t.be < 0 ? '+' : '−'} ${Math.abs(t.be)}) ÷ 2 = ${PRIMES[s + 4]}.`, [`${t.be < 0 ? 'Add' : 'Subtract'} ${Math.abs(t.be)} first.`, 'Then halve.']); } },
        ] },
      { answers: 'step-2', say: 'Take the next prime. Check it has no divisor up to its square root, and that you have not skipped one.', why: 'The two classic slips live here: an odd number that is not prime (21, 25, 27) and a prime jumped over.',
        checks: [
          { hinge: true, make: (rng) => { let i; do i = rng.int(3, 22); while (nextOddComposite(PRIMES[i]) > PRIMES[i + 1]); const p = PRIMES[i], c = nextOddComposite(p); return pick(rng, `Which number is the next prime after ${p}?`, PRIMES[i + 1], [[c, `${c} = ${PRIMES.find((d) => c % d === 0)} × ${c / PRIMES.find((d) => c % d === 0)}: odd, but not prime`], [PRIMES[i + 2], `that skips ${PRIMES[i + 1]}`]], `${PRIMES[i + 1]} is prime; nothing between ${p} and it is.`); } },
        ] },
      { say: 'Redo the transform on the next prime.', why: 'The answer is a term of the list, not the prime itself.',
        checks: [
          { make: (rng) => { const p = d3(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Undo (${undo(p.t)}): ${seq(PRIMES.slice(p.s, p.s + 5))}. Next prime ${PRIMES[p.s + 5]}; redo: ${neg(p.xs[5])}.`, ['Undo the transform to find the primes.', 'Take the next prime and apply the transform again.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['term', 'undo: − 1, ÷ 2', 'prime?'], rows: E2.slice(0, 5).map((v) => [String(v), String((v - 1) / 2), isPrime((v - 1) / 2) ? 'yes' : 'no']) }, caption: `${seq(E2.slice(0, 5))} is 2p + 1. Undoing gives ${seq(E2.slice(0, 5).map((v) => (v - 1) / 2))}, consecutive primes. Next prime ${PRIMES[6]}, so the next term is 2 × ${PRIMES[6]} + 1 = ${E2[5]}.` },
    { type: 'text', text: 'Which transform? Look at the first term and the size of the gaps. Gaps that are all even and about twice the usual prime gaps suggest 2p + c; terms that are primes shifted by a small constant have prime-sized gaps; gaps that grow fast and the terms 4, 9, 25 at the start mean squares. Undo your guess on two terms: if both give primes, undo the rest.' },
    { type: 'explain', prompt: 'Why can no difference ladder find primes, and why must you undo the transform before reading the list?', model: 'Every ladder row of a formula eventually becomes constant, but primes follow no formula, so their gaps stay irregular at every depth. A transform hides the familiar numbers; only after undoing it do you see 7, 11, 13 instead of 15, 23, 27.', points: ['Primes have no polynomial or ratio rule, so no layer settles', 'The transform is the same for every term, so it can be undone', 'Read the primes, step to the next, then redo the transform'] },

    S('worked'),
    { type: 'worked', family: 'primes', section: 'nl', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Plain consecutive primes. Name the next prime before opening the solution.' },
    { type: 'worked', family: 'primes', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'A transformed list. The undoing is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PR.slice(0, 5))}, ? The gaps are ${seq(g(PR.slice(0, 5)))}. Is the next term ${PR[4] + 2}, ${PR[4] + 4} or ${PR[4] + 6}? Commit before checking.`, answer: `${PR[5]}: it is the next prime. ${[PR[4] + 2, PR[4] + 4, PR[4] + 6].filter((v) => v !== PR[5]).map((v) => (isPrime(v) ? `${v} is prime but skips ${PR[5]}` : `${v} = ${fac(v)}`)).join('; ')}.`, explain: 'Test each candidate with 2, 3, 5 and 7; the first survivor is the next prime.' },

    S('traps'),
    { type: 'traps', family: 'primes', section: 'nl', extra: [
      { belief: 'The next odd number is the next prime.', fix: `Odd numbers like ${seq(ODDC.slice(0, 8))} are not prime; test with 3, 5 and 7.` },
      { belief: 'Primes step by 2 after the start.', fix: 'Prime gaps vary: 2, 4, 6 and more. Always find the actual next prime.' },
      { belief: 'Once you find the next prime, that is the answer.', fix: 'Redo the transform: the answer is 2p + 1, p − 3 or p², not p.' },
    ] },
    { type: 'text', text: 'The options in this family mainly punish three habits: taking the next odd number, jumping over a prime, and forgetting to redo the transform. Each wrong option is a real number you could reach by one of these slips, so a quick divisibility test and one last multiplication decide the item.' },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ER.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Undo: subtract 1 and halve, giving ${seq(PRIMES.slice(ERs, ERs + 5))}.`,
      'These are consecutive primes.',
      `The next odd number after ${PRIMES[ERs + 4]} is ${PRIMES[ERs + 4] + 2}, so the next prime is ${PRIMES[ERs + 4] + 2}.`,
      `Next term = 2 × ${PRIMES[ERs + 4] + 2} + 1 = ${2 * (PRIMES[ERs + 4] + 2) + 1}.`,
    ], errorStep: 2, explain: `${PRIMES[ERs + 4] + 2} = ${fac(PRIMES[ERs + 4] + 2)} is not prime. The next prime is ${PRIMES[ERs + 5]}, so the next term is 2 × ${PRIMES[ERs + 5]} + 1 = ${ER[5]}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { make: (rng) => { const p = anyP(rng, 6), last = PRIMES[p.s + 4], nxt = PRIMES[p.s + 5], c = nextOddComposite(last); const w = [[tf(p.t, PRIMES[p.s + 6]), `skipped a prime: after ${last} comes ${nxt}`], [tf(p.t, last + 2), `assumed the primes step by 2 (${last} → ${last + 2})`]]; if (c < nxt) w.unshift([tf(p.t, c), `used ${c}, which is not prime`]); if (p.t.sq || p.t.al !== 1 || p.t.be) w.push([nxt, `found the next prime ${nxt} but did not redo the transform`]); return pick(rng, nextQ(p.xs.slice(0, 5)), tf(p.t, nxt), w, `${name(p.t)} over consecutive primes: next prime ${nxt}, term ${neg(tf(p.t, nxt))}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `The primes below 100, decade by decade: ${DECADES.map((d) => d.join(' ')).join(' | ')}.` },
    { type: 'callout', tone: 'speed', text: `The odd numbers below 100 that look prime but are not: ${seq(ODDC)}. To test any n below 100, try dividing by 3, 5 and 7 (after checking it is odd); if none divides it, it is prime.` },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps ${seq(g(TA.slice(0, 5)))}: all even, irregular. No layer will settle, so think primes.` },
      { t: 5, say: `Undo 2p − 1: add 1, halve. ${seq(TAp.slice(0, 5))}: consecutive primes.` },
      { t: 11, say: `Next after ${TAp[4]} is ${TAc}, so 2 × ${TAc} − 1 = ${2 * TAc - 1}.`, slip: true },
      { t: 14, say: `Wait: ${TAc} = ${fac(TAc)}, not prime. The next prime is ${TAp[5]}.` },
      { t: 18, say: `2 × ${TAp[5]} − 1 = ${TA[5]}. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: undo, test the next prime, redo', questions: [
      { make: (rng) => { const p = d3(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Undo (${undo(p.t)}): ${seq(PRIMES.slice(p.s, p.s + 5))}. The next prime is ${PRIMES[p.s + 5]}; redo ${name(p.t)}: ${neg(p.xs[5])}.`, ['Undo the transform on two terms: do you get primes?', 'Test the next candidate with 3, 5 and 7, then redo the transform.']); } },
    ] },
    { type: 'check', scope: 'testing with 3, 5 and 7', questions: [
      { make: (rng) => { const pr = rng.pick(P100.filter((p) => p > 20)), cs = rng.shuffle(ODDC.filter((c) => c > 20)).slice(0, 3); return pick(rng, 'Which of these is prime?', pr, cs.map((c) => [c, `${c} = ${PRIMES.find((d) => c % d === 0)} × ${c / PRIMES.find((d) => c % d === 0)}`]), `${pr} has no divisor among 2, 3, 5, 7.`); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Irregular gaps and no settled layer → primes: undo the transform, take the next prime (no skips, no odd composites), redo the transform.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Read it as'], rows: [
      [seq(E1.slice(0, 6)), seq(g(E1.slice(0, 6))), 'consecutive primes'],
      [seq(ODD), seq(g(ODD)), 'odd numbers: constant gap 2, includes non-primes'],
      [seq(PG), seq(g(PG)), 'the gaps are the primes (a later lesson)'],
      [seq(QD.slice(0, 5)), seq(g(QD.slice(0, 5))), 'a quadratic: the gaps grow steadily'],
    ] },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) xs = d2(rng, 6).xs; else if (t === 1) { do { xs = [rng.int(1, 9)]; const s = rng.int(0, 3); while (xs.length < 6) xs.push(xs[xs.length - 1] + PRIMES[s + xs.length - 1]); } while (xs.every(isPrime)); } else xs = arith(rng.int(1, 30) * 2 + 1, 2, 6); const names = ['the terms are primes', 'the gaps are primes', 'odd numbers']; const trp = [[null, `the gaps ${seq(g(xs))} are not consecutive primes`, `the gaps ${seq(g(xs))} are not all 2`], [`the terms include ${xs.find((v) => !isPrime(v))}, which is not prime`, null, `the gaps ${seq(g(xs))} are not all 2`], ['odd numbers step by 2 and include non-primes', 'a constant gap of 2 is not a run of primes', null]]; return pick(rng, `${seq(xs)}: which reading?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: 2 is the only even prime, so a list starting 2, 3, 5 has a gap of 1 first; 1 is not prime; and squared primes (${seq(E3.slice(0, 5))}) are the one transform whose gaps look quadratic at first but never settle.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: when no formula settles, switch from computing to recognising. The same switch applies to digit rules and to Fibonacci numbers hidden inside another rule.' },
    { type: 'variation', base: `${seq(E16)}, ?  Consecutive primes; next ${E1[6]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E16.slice(1))}, ?`, effect: `Still ${E1[6]}. The list is still consecutive primes ending at ${E1[5]}.` },
      { change: `Double every term: ${seq(vrow(T2x).slice(0, 6))}, ?`, effect: `${vrow(T2x)[6]}. Halve to read the primes, take ${E1[6]}, double back.` },
      { change: `Add 3 to every term: ${seq(vrow(T3x).slice(0, 6))}, ?`, effect: `${vrow(T3x)[6]}. Subtract 3 to read the primes; none of the shown terms is prime any more, which is the disguise.` },
      { change: `Square every term: ${seq(vrow(Tsq).slice(0, 4))}, …, ?`, effect: `${vrow(Tsq)[6]}. Take square roots; the next prime squared is ${E1[6]}².` },
      { fusion: true, change: `Double, then add 3: ${seq(vrow(Tboth).slice(0, 6))}, ?`, effect: `${vrow(Tboth)[6]}. Undo in reverse order (subtract 3, then halve), take the next prime ${E1[6]}, then redo in the original order (double, then add 3).` },
    ] },
    { type: 'check', scope: 'the edge cases', questions: [
      { make: (rng) => { const s = rng.int(0, 3), xs = run(TS, s, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Square roots ${seq(PRIMES.slice(s, s + 5))} are consecutive primes; next ${PRIMES[s + 5]}² = ${xs[5]}.`, ['Take square roots.', 'Square the next prime.']); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const i = rng.pick(BIG.slice(0, 6)), xs = PRIMES.slice(i, i + 6); return num(`${nextQ(xs.slice(0, 5))} (Above 100, test 3, 5, 7 and 11.)`, xs[5], `Consecutive primes above 100. Between ${xs[4]} and ${xs[5]}: ${Array.from({ length: (xs[5] - xs[4]) / 2 - 1 }, (_, k) => xs[4] + 2 * (k + 1)).map((c) => `${c} = ${fac(c)}`).join(', ') || 'no odd number'}. Next prime ${xs[5]}.`, ['The terms are primes: check each odd number after the last one.', 'Up to 168, a number is prime if 2, 3, 5, 7 and 11 do not divide it.']); } },
      far: { make: (rng) => { const n = rng.pick([10, 12, 20, 30]), k = PRIMES.filter((p) => p <= n).length; return { type: 'number', q: `A fair ${n}-sided die (faces 1 to ${n}) is rolled. What is the probability that the result is prime? (A fraction or a decimal to three places.)`, answer: k / n, tolerance: 0.001, hints: [`List the primes from 1 to ${n}; 1 is not prime.`, `Count them and divide by ${n}.`], explain: `The primes up to ${n} are ${PRIMES.filter((p) => p <= n).join(', ')}: ${k} of ${n} faces, so ${k}/${n}.` }; } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the big primes and the die?', options: [
        'find primes by testing small divisors, not by a formula',
        'every odd number above 2 is a prime number',
        'after the first few, primes are spaced 2 apart',
        'primes follow a gap rule that the ladder will find',
      ], answer: 0, traps: { 1: '9, 15 and 21 are odd but not prime: test 3, 5 and 7', 2: 'prime gaps vary: 23 to 29 is a gap of 6', 3: 'no difference row of the primes ever settles' }, explain: 'Above the memorised list and on the die alike, primes are found the same way: test each candidate with the small primes up to its square root.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'primes', section: 'nl', count: 3 },
  ],
};
