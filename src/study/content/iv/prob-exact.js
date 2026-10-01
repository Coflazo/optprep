// Intervals: exact probabilities in percent. Compute the fraction, convert, then type a point
// (terminating) or a 4-significant-figure bracket (repeating). Every number is computed here.
import { sec, dec, round, pct, frac, mc, ivq, exactEntry, bestLog, IV } from './scoring-and-width.js';

const ways = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const atLeast = (k) => { let n = 0; for (let s = k; s <= 12; s++) n += ways(s); return n; };
const P = (n, d) => (n / d) * 100;
const cells = (pred) => { const out = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (pred(r + c + 2)) out.push([r, c]); return out; };
const grid = (pred) => ({ rows: 6, cols: 6, rowTitle: 'first die', colTitle: 'second die', cellText: Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => r + c + 2)), highlight: cells(pred), count: cells(pred).length });

const CH = { m: 8 }; CH.p = P(CH.m - 1, 2 * CH.m); CH.e = exactEntry(CH.p);
const G = { k: 10 }; G.n = atLeast(G.k); G.e = exactEntry(P(G.n, 36));
const Z = { n: 2, d: 7 }; Z.x = P(Z.n, Z.d); Z.e = exactEntry(Z.x);
const ST = { k: 4 }; ST.p = P(2, ST.k + 1);
const EST = [bestLog(0.03).e, bestLog(0.1).e];
const ACE = { x: P(4 * 3, 52 * 51) }; ACE.e = exactEntry(ACE.x); ACE.two = [Math.floor(ACE.x * 100) / 100, Math.ceil(ACE.x * 100) / 100];
const DUEL = { m: 6 }; DUEL.tie = P(1, DUEL.m); DUEL.right = P(DUEL.m - 1, 2 * DUEL.m);

const toPctQ = (rng) => {
  const [n, d] = rng.pick([[1, 8], [3, 8], [5, 16], [7, 32], [11, 16], [3, 40], [9, 20], [13, 25]]);
  return { type: 'number', q: `A probability is exactly ${n}/${d}. What is it in percent? (all its digits)`, answer: P(n, d), tolerance: 1e-6, hints: ['Multiply by 100.', `${n}/${d} × 100 = ${n * 100}/${d}.`], explain: `${n}/${d} = ${P(n, d)}%. It terminates, so [${P(n, d)}, ${P(n, d)}] scores 1.` };
};
const sumQ = (rng) => {
  const k = rng.int(8, 11), n = atLeast(k), e = exactEntry(P(n, 36));
  return ivq(`Two fair dice. Type the best interval for P(sum ≥ ${k}), in percent.`, P(n, 36), `Sums ${k} to 12: ${Array.from({ length: 13 - k }, (_, i) => ways(k + i)).join(' + ')} = ${n} of 36 cells = ${frac(n, 36)} = ${dec(P(n, 36), 5)}…%. Type ${e.text}${e.point ? '' : `, score ${dec(e.score, 4)}`}.`, ['Count the grid cells from the top: 1, 3, 6, 10, 15 for sums ≥ 12, 11, 10, 9, 8.', 'Divide by 36, multiply by 100, then bracket if it repeats.']);
};
const stickQ = (rng) => {
  const k = rng.int(2, 9), x = P(2, k + 1), e = exactEntry(x);
  return ivq(`A stick is broken at a uniformly random point. Type the best interval for P(the longer piece is at least ${k} times the shorter), in percent.`, x, `Shorter ≤ 1/${k + 1} of the stick: the break is within 1/${k + 1} of either end, P = 2/${k + 1} = ${dec(x, 5)}…%. Type ${e.text}.`, [`Longer ≥ ${k} × shorter means shorter ≤ 1/${k + 1}.`, 'Two end zones, each of length 1/(k + 1).']);
};
const duelQ = (rng) => {
  const m = rng.pick([4, 6, 10, 12, 20]), x = P(m - 1, 2 * m), e = exactEntry(x);
  return { type: 'number', q: `You and a friend each roll a fair ${m}-sided die. P(yours is strictly higher), in percent? (3 decimal places)`, answer: round(x, 3), tolerance: 0.0006, hints: [`P(tie) = 1/${m}.`, 'Higher and lower split the rest equally.'], explain: `(1 − 1/${m}) ÷ 2 = ${m - 1}/${2 * m} = ${dec(x, 4)}%. Type ${e.text}.` };
};
const n36Q = (rng) => {
  const n = rng.pick([1, 2, 4, 5, 7, 8, 10, 11, 13]), x = P(n, 36), e = exactEntry(x);
  return { type: 'number', q: `Using 1/36 = ${dec(P(1, 36), 4)}…%, what is ${n}/36 in percent? (2 decimal places)`, answer: round(x, 2), tolerance: 0.006, hints: [`${n} × 2.7777…`, `${n} × 2.78 would drift by ${dec(n * 0.0022, 3)}; use 2.7778.`], explain: `${n} × ${dec(P(1, 36), 5)} = ${dec(x, 4)}…%, so type ${e.text}.` };
};

const tri = (s) => { let n = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) if (a + b + c === s) n++; return n; };
const TRI16 = tri(16) + tri(17) + tri(18);

export default {
  id: 'iv/prob-exact',
  book: 'iv',
  kind: 'family',
  family: 'prob-exact',
  title: 'Exact probabilities in percent',
  summary: 'Countable setups (a few dice, coins, two cards, one uniform break) have exact answers: compute, convert to percent, type a point or a tight bracket.',
  prerequisites: ['iv/scoring-and-width', 'bto/two-dice-sum', 'prob/complement', 'prob/symmetry'],
  objectives: [
    'Decide in five seconds whether a probability question is exactly computable in under 40 seconds',
    'Compute it as a fraction by counting, complement, symmetry or a product, and convert to percent',
    'Type a point when the percent terminates and a 4-significant-figure bracket when it repeats',
    'Name the two zero-score traps: a rounded point and an answer in decimals instead of percent',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'safeband', label: 'Typed a safety band', approach: `Computed ${CH.p}% and typed [40, 48] to be safe.`, breaksAt: 'The answer is exact, so any width only lowers lower ÷ upper.' },
      { id: 'nosplit', label: 'Forgot the symmetry split', approach: `Took P(not a tie) = 1 − 1/${CH.m} as the answer.`, breaksAt: '"Not a tie" is higher or lower; by symmetry you want half of it.' },
      { id: 'decimal', label: 'Answered as a decimal', approach: `Typed [${CH.p / 100}, ${CH.p / 100}].`, breaksAt: 'The question asks in percent: the decimal is 100 times too small.' },
    ], q: `Before any teaching: you and a friend each roll a fair ${CH.m}-sided die. What is the probability, in percent, that your number is strictly higher? Type the interval you would submit, and find two different ways to get the number.`, answer: `${frac(CH.m - 1, 2 * CH.m)} = ${CH.p}%, so ${CH.e.text}, score 1`,
      explain: `Count: ${CH.m * CH.m} ordered pairs, ${CH.m} ties, the other ${CH.m * CH.m - CH.m} split evenly between higher and lower. Or symmetry: (1 − 1/${CH.m}) ÷ 2. If you typed a range such as [40, 48] "to be safe", you scored ${dec(40 / 48, 2)} on a question worth 1.` },
    { type: 'text', text: 'The cue is "What is the probability, **in percent**, that …" attached to a small, fully specified random setup: two or three dice, a handful of coin tosses, two cards from a deck, one uniform break of a stick. Every outcome can be counted or the event has a one-line formula.' },
    { type: 'list', items: ['"Two fair dice are thrown. What is the probability, in percent, that the sum is at least 9?"', '"A fair coin is tossed 5 times. Probability, in percent, of exactly 2 heads?"', '"Two cards are drawn without replacement. Probability, in percent, that they have the same suit?"'] },
    { type: 'text', text: 'Not this lesson: setups with many trials (30 people and birthdays, 100 coins, 20 dice). Those are exact in principle but too long for a minute, so you estimate them (iv/prob-estimate).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question should you compute exactly and answer with zero width?', right: 'Three dice: P(all show different numbers), in percent', wrong: [['40 people: P(two share a birthday), in percent', 'exact in principle, but 40 factors do not fit in a minute: estimate'], ['100 coin tosses: P(at least 60 heads), in percent', 'a sum of 41 binomial terms: estimate with the normal curve'], ['20 dice: P(the total is at least 80), in percent', 'a 20-dice convolution: estimate with the normal curve']], explain: `Three dice: 6 × 5 × 4 = 120 of 216 outcomes, ${dec(P(120, 216), 4)}…%. The rest need estimation.` }),
    ] },

    sec('why'),
    { type: 'text', text: `Exact questions are the only ones where 1.0 is on offer. A well-sized estimate earns about ${dec(EST[1], 2)} at a 10% error and ${dec(EST[0], 2)} at 3%, so every exact question you convert to a full point pays for the width you need elsewhere. The trainer's readiness bar is a mean of ${IV.target.value}; exact questions answered exactly are how you clear it. They are also where a careless last step hurts most: the right fraction typed as a rounded point, or as a decimal instead of a percent, scores exactly what a blank scores.` },

    sec('anchor'),
    { type: 'text', text: 'This is a Beat the Odds probability question with **one change**: there are no options. You compute the same fraction, then type it as percent bounds. The counting tools (ordered pairs, the complement, symmetry) are unchanged; only the last step is new.' },
    { type: 'check', scope: 'fraction to percent', questions: [{ make: toPctQ }] },

    sec('picture'),
    { type: 'text', text: `The counting picture is the one you know. For two dice, draw the 6 × 6 grid of ordered pairs and highlight the event. Below: sum ≥ ${G.k}, which is ${G.n} cells. Coins work the same way with 2^{n} equally likely sequences, and two cards with 52 × 51 ordered draws.` },
    { type: 'diagram', diagram: 'grid', spec: grid((s) => s >= G.k), caption: `Sum ≥ ${G.k}: ${G.n} of 36 cells, so P = ${frac(G.n, 36)} = ${dec(P(G.n, 36), 4)}…%. The percent repeats, so the answer to type is ${G.e.text}.` },
    { type: 'check', scope: 'counting cells, then percent', questions: [{ make: sumQ }] },
    { type: 'text', text: `The new part is the last step. You can only type finitely many digits, so a repeating value like ${Z.n}/${Z.d} = ${dec(Z.x, 6)}…% must be **bracketed** by the numbers just below and just above it.` },
    { type: 'diagram', diagram: 'numberline', spec: { min: round(Z.e.lo - 0.01, 2), max: round(Z.e.hi + 0.01, 2), step: 0.01, barriers: [Z.e.lo, Z.e.hi], marks: [{ x: Z.x, label: `truth ${dec(Z.x, 4)}…` }] }, caption: `Zoomed in on ${Z.n}/${Z.d} in percent. The bracket ${Z.e.text} contains the truth and scores ${dec(Z.e.score, 4)}. The point [${round(Z.x, 2)}, ${round(Z.x, 2)}] sits just beside it and scores 0.` },
    { type: 'check', scope: 'brackets for repeating values', questions: [
      mc({ q: `P = 1/221 exactly (two aces from a deck), which is ${dec(ACE.x, 6)}…%. Which interval scores highest?`, right: ACE.e.text, wrong: [[`[${ACE.two[0]}, ${ACE.two[1]}]`, `two decimals on a value below 1%: it scores only ${dec(ACE.two[0] / ACE.two[1], 3)}`], [`[${round(ACE.x, 2)}, ${round(ACE.x, 2)}]`, 'a rounded point misses the truth'], [`[${dec(ACE.x / 100, 4)}, ${dec(ACE.x / 100 + 0.0001, 4)}]`, 'answered as a decimal fraction instead of percent']], explain: `Keep 4 significant figures: ${ACE.e.text} scores ${dec(ACE.e.score, 4)}. Two decimals are enough only for values above 10%.` }),
    ] },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 1, step: 0.1, barriers: [1 / (ST.k + 1), ST.k / (ST.k + 1)], marks: [{ x: 0.1, label: `short ≤ 1/${ST.k + 1}` }, { x: 0.5, label: 'no' }, { x: 0.9, label: `short ≤ 1/${ST.k + 1}` }] }, caption: `A stick of length 1 broken at a uniform point. "Longer ≥ ${ST.k} × shorter" means the shorter piece is at most 1/${ST.k + 1}: the break lands in one of the two end zones, total length 2/${ST.k + 1}, so P = ${ST.p}%.` },
    { type: 'check', scope: 'the stick picture', questions: [{ make: stickQ }] },

    sec('derivation'),
    { type: 'text', text: 'Four moves. The middle two are Beat the Odds work you already know; the first and the last are what Intervals adds, and they are where the points are won or lost.' },
    { type: 'steps', steps: [
      { answers: 'safeband', say: 'Decide first: is the outcome space small and equally likely, or is there a one-line formula (complement, symmetry, product)? If yes, it is exact.', why: 'The decision sets the strategy: exact means zero width, estimate means a calibrated band. Deciding wrong in either direction costs points.',
        checks: [mc({ q: 'Which is exact in under 40 seconds?', right: 'Two cards: P(same suit)', wrong: [['25 dice: P(total ≥ 100)', 'a 25-fold convolution: estimate'], ['23 people: P(shared birthday)', '23 factors: estimate with the exponential shortcut']], explain: 'Whatever the first card, 12 of the remaining 51 share its suit: 12/51.' })] },
      { answers: 'nosplit', say: 'Compute the fraction: count favourable over total, or use the complement for "at least one", symmetry for a duel, a product for "all of them".', why: 'These are the Beat the Odds tools; the fraction is exact, so keep it as a fraction until the last step.',
        checks: [{ make: duelQ }] },
      { answers: 'decimal', say: 'Multiply by 100. The percent terminates exactly when the reduced denominator has no prime factor other than 2 and 5.', why: '1/2, 1/4, 1/5, 1/8 … end; 1/3, 1/6, 1/7, 1/36 … repeat for ever.',
        checks: [mc({ q: 'Which probability gives a terminating percent?', right: '7/16', wrong: [['5/12', '12 = 4 × 3: the 3 makes it repeat'], ['2/7', '7 is not 2 or 5: repeats'], ['11/36', '36 = 4 × 9: the 9 makes it repeat']], explain: `7/16 = ${P(7, 16)}%: 16 = 2^{4}, so it terminates.` })] },
      { say: 'Type it. Terminating: the point [x, x] with every digit. Repeating: bracket it, keeping 4 significant figures (2 decimals above 10%, 3 between 1% and 10%, 4 below 1%).', why: 'A point must equal the truth exactly to score; a bracket always contains it, and 4 significant figures keep the score above 0.999.',
        checks: [{ make: (rng) => { const [n, d] = rng.pick([[1, 6], [5, 6], [1, 12], [7, 36], [3, 7], [1, 72], [5, 216], [2, 9]]); const x = P(n, d), e = exactEntry(x); return ivq(`An exact probability is ${n}/${d}. Type the best interval, in percent.`, x, `${n}/${d} = ${dec(x, 6)}…%. Keep 4 significant figures: ${e.text}, score ${dec(e.score, 4)}.`, ['Multiply by 100 first.', 'It repeats, so type the values just below and just above it.']); } }] },
    ] },
    { type: 'explain', prompt: 'Why does [16.67, 16.67] score 0 for P(sum = 7) while [16.66, 16.67] scores almost 1?', model: 'P(sum = 7) is 1/6 = 16.666…%. The point 16.67 is not equal to 16.666…, so the truth lies outside the zero-width interval and the score is 0. The bracket [16.66, 16.67] contains 16.666…, so it scores 16.66 ÷ 16.67, which is 0.9994.', points: ['A zero-width interval only scores if it equals the truth exactly', 'A repeating decimal can never be typed exactly', 'A bracket around it costs almost nothing: lower ÷ upper is close to 1'] },

    sec('worked'),
    { type: 'worked', explainAt: [0, 2], family: 'prob-exact', section: 'iv', difficulty: 1, seed: 'a', intro: 'Dice sums or coins. Compute it and decide what to type before opening the solution.' },
    { type: 'worked', family: 'prob-exact', section: 'iv', difficulty: 2, seed: 'b', fade: 1, intro: 'Maxima, duels, cards or "at least one six". The calculation is given; the last step, what to type, is yours.' },
    { type: 'thinkaloud', problem: 'Two cards are drawn without replacement from a standard deck. What is the probability, in percent, that they have the same suit?', lines: [
      { t: 0, say: 'I see two cards and one small event: this is exact, so zero width is on the table. I compute carefully.' },
      { t: 5, say: 'A quarter of the deck is each suit, so 13/52 = 25%.', slip: true },
      { t: 9, say: 'Wait: the first card is already out. Whatever it is, 12 of the remaining 51 share its suit.' },
      { t: 15, say: `12/51 = ${frac(12, 51)}. The denominator has a factor other than 2 and 5, so the percent repeats: I will bracket.` },
      { t: 22, say: `${frac(12, 51)} = ${dec(P(12, 51), 5)}…%. It is above 10%, so two decimals keep four significant figures.` },
      { t: 28, say: 'Sanity check: a bit under 25%, because one card of that suit is gone. Right.' },
      { t: 33, say: `I type ${exactEntry(P(12, 51)).text}, then re-read: "same suit", not "same colour". Done.` },
    ] },

    sec('predict'),
    { type: 'predict', question: 'P(at least one head in 5 tosses) = 31/32. Do you type a point or a bracket, and what does [96.8, 96.9] score against the right answer?', answer: `31/32 = ${P(31, 32)}% terminates, so type [${P(31, 32)}, ${P(31, 32)}] for 1. [96.8, 96.9] contains it and scores ${dec(96.8 / 96.9, 4)}: close, but a free ${dec(1 - 96.8 / 96.9, 4)} thrown away.`, explain: 'Terminating denominators (powers of 2 and 5) never need a bracket.' },

    sec('traps'),
    { type: 'traps', family: 'prob-exact', section: 'iv', extra: [
      { belief: 'Round the answer and type it as a point.', fix: 'A rounded repeating value is outside the zero-width interval: score 0. Bracket it.' },
      { belief: 'Type the probability as a decimal (0.1667).', fix: 'The question asks in percent: 0.1667 is outside [16.66, 16.67] by a factor of 100.' },
      { belief: 'Add a safety width to an exact answer.', fix: 'Width only lowers L ÷ U when the truth is certain. Recheck the fraction instead.' },
      { belief: 'Two dice have 11 equally likely sums (or 21 unordered pairs).', fix: 'Count the 36 ordered pairs.' },
    ] },
    { type: 'erroneous', problem: `A candidate answers "You and a friend each roll a fair ${DUEL.m}-sided die. P(yours is strictly higher), in percent". One step is wrong.`, steps: [
      `There are ${DUEL.m * DUEL.m} equally likely ordered pairs.`,
      `A tie happens in ${DUEL.m} of them: P(tie) = 1/${DUEL.m} = ${dec(DUEL.tie, 4)}…%.`,
      `So P(higher) = 1 − 1/${DUEL.m} = ${dec(100 - DUEL.tie, 4)}…%.`,
      `Type the bracket [${exactEntry(100 - DUEL.tie).lo}, ${exactEntry(100 - DUEL.tie).hi}].`,
    ], errorStep: 2, explain: `"Not a tie" is higher **or lower**, and by symmetry those are equal. P(higher) = (1 − 1/${DUEL.m}) ÷ 2 = ${frac(DUEL.m - 1, 2 * DUEL.m)} = ${dec(DUEL.right, 4)}…%, so ${exactEntry(DUEL.right).text}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate computes P(sum = 7) = 1/6 and types [0.1666, 0.1667]. What do they score?', right: '0', wrong: [['0.9994', 'forgot the question asks in percent'], ['1', 'a bracket around the right fraction, but in the wrong unit'], ['0.5', 'partial credit does not exist outside the interval']], explain: 'The truth is 16.666…%, far outside [0.1666, 0.1667]. Right number, wrong unit, score 0.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Know the repeating families by heart: 1/3 = ${dec(P(1, 3), 4)}…%, 1/6 = ${dec(P(1, 6), 4)}…%, 1/12 = ${dec(P(1, 12), 4)}…%, 1/36 = ${dec(P(1, 36), 4)}…%, 1/7 = ${dec(P(1, 7), 4)}…%. Then n/36 is n × ${dec(P(1, 36), 4)}, and the bracket follows at once.` },
    { type: 'callout', tone: 'speed', text: `Budget: ${IV.exam.perItemSeconds} seconds per question. Aim for about 40 to compute, 10 to convert and type. If the fraction is not done by 45 seconds, switch to an estimate with a small band rather than submit nothing.` },
    { type: 'check', scope: 'the 1/36 table', questions: [{ make: n36Q }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Countable setup → exact fraction → × 100 → terminating: [x, x]; repeating: bracket at 4 significant figures. Never a rounded point, never a decimal instead of percent.' },

    sec('contrast'),
    { type: 'compare', columns: ['Question type', 'Answer is', 'What to type', 'Typical score'], rows: [
      ['Exact probability (this lesson)', 'a fraction', 'point or 4-s.f. bracket', `1, or ${dec(exactEntry(P(1, 221)).score, 4)} for a bracket`],
      ['Probability to estimate (iv/prob-estimate)', 'an approximation', 'band sized to its error', `about ${dec(EST[1], 2)} at 10%`],
      ['Beat the Odds', 'a fraction', 'pick the closest option', '+1 or −1'],
      ['Expected value with dice (iv/expected-dice)', 'a fraction', 'point or bracket', '1'],
    ] },
    { type: 'variation', base: `Base: two fair dice, P(sum ≥ ${G.k}) in percent = ${G.n}/36 = ${dec(P(G.n, 36), 4)}…%, typed as ${G.e.text}.`, rows: [
      { change: `Sum ≥ ${G.k} becomes sum ≥ ${G.k - 1}`, effect: `${atLeast(G.k - 1)}/36 = ${dec(P(atLeast(G.k - 1), 36), 4)}…%: still repeating, so still a bracket, ${exactEntry(P(atLeast(G.k - 1), 36)).text}.` },
      { change: 'Two dice become 5 coin tosses, P(at least one head)', effect: `31/32 = ${P(31, 32)}%: the denominator is a power of 2, so it terminates. Type the point.` },
      { change: 'Two dice become 30 dice, P(total ≥ 120)', effect: 'No longer countable in a minute: estimate with the normal curve and give a band (iv/prob-estimate).' },
      { change: `Sum ≥ ${G.k} becomes sum = 7`, effect: `No change in the answer: sum 7 also has ${ways(7)} cells, so it is again ${frac(ways(7), 36)} and ${exactEntry(P(ways(7), 36)).text}.` },
      { same: true, change: 'The two dice are painted red and blue', effect: `No change: the 36 ordered pairs were already the right outcomes, so it stays ${G.n}/36 and ${G.e.text}.` },
      { fusion: true, change: `Two dice become three AND sum ≥ ${G.k} becomes sum ≥ 16`, effect: `Both changes act on the count: 216 ordered triples, and only sums 16, 17, 18 qualify (${[16, 17, 18].map(tri).join(' + ')} = ${TRI16}), so ${TRI16}/216 = ${dec(P(TRI16, 216), 4)}…%, typed ${exactEntry(P(TRI16, 216)).text}.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a probability of exactly 0 cannot score, because the lower bound must be above 0; do not spend time on it. A certain event is [100, 100]. A value just under 1% (1/221) needs four decimals to stay tight.' },
    { type: 'callout', tone: 'transfer', text: 'Same move elsewhere: any exact answer (an expected value, a waiting time, a count of arrangements) gets the same last step. Compute the fraction, and type a point if it terminates or a 4-significant-figure bracket if it does not.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'Two dice: P(sum = 1). What do you type?', right: 'Skip it: an answer of 0 cannot score', wrong: [['[0, 0], since the answer is 0', 'a lower bound of 0 always scores 0'], ['[0, 1], a small safe band', 'the lower bound is still 0'], ['[2.77, 2.78], the smallest sum', 'that is P(sum = 2), not sum = 1']], explain: 'The sum is at least 2, so P = 0, and the rule requires a lower bound above 0. Move on.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const [q, n, d] = rng.pick([['A fair 12-sided die is rolled. P(a multiple of 5), in percent', 2, 12], ['One card from a deck. P(a heart or a king), in percent', 16, 52], ['Three fair coins. P(exactly two heads), in percent', 3, 8], ['Two fair 4-sided dice. P(sum = 5), in percent', 4, 16]]); const e = exactEntry(P(n, d)); return ivq(`${q}. Type the best interval.`, P(n, d), `${n}/${d} = ${dec(P(n, d), 5)}${e.point ? '' : '…'}%. Type ${e.text}.`); } },
      far: ivq('Outside probability: a 60-second clock is split equally among 7 questions. How many seconds per question? Type the best interval.', 60 / 7, `60/7 = ${dec(60 / 7, 6)}…, which repeats: keep 4 significant figures, ${exactEntry(60 / 7).text}.`),
      principle: mc({ q: 'Which idea carried over from the dice to the clock question?', right: 'A repeating exact value gets a tight bracket', wrong: [['Probabilities must be typed in percent', 'the clock answer is in seconds: units were not the shared idea'], ['Count the equally likely ordered outcomes', 'no counting was needed for the clock'], ['Estimates need a band of about two SDs', 'nothing was estimated: both answers were exact']], explain: 'Both answers were exact fractions that repeat, so both get the 4-significant-figure bracket.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'prob-exact', section: 'iv', count: 3 },
  ],
};
