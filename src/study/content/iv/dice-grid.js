// Intervals: a 10 × 10 grid of dice. Count one face (expect 100/6, then scan) or estimate the
// total (350 plus a scanned correction, weights 2.5, 1.5, 0.5). The grid is generated here from
// a fixed seed and every count shown is taken from it.
import { makeRng } from '../../../core/rng.js';
import { sec, dec, round, mc, ivq, bestNorm, eNorm } from './scoring-and-width.js';

const W = 420, H = 300, CELL = 27, X0 = (W - 10 * CELL) / 2, Y0 = (H - 10 * CELL) / 2;
function diceGrid(seed) {
  const rng = makeRng(seed), pips = Array.from({ length: 100 }, () => rng.int(1, 6));
  const items = pips.map((p, k) => ({ x: +(X0 + ((k % 10) + 0.5) * CELL).toFixed(1), y: +(Y0 + (Math.floor(k / 10) + 0.5) * CELL).toFixed(1), r: 11, shape: 'die', pips: p }));
  const n = [0, 1, 2, 3, 4, 5, 6].map((f) => pips.filter((p) => p === f).length);
  return { pips, n, total: pips.reduce((a, b) => a + b, 0), spec: { width: W, height: H, grid: { x: X0, y: Y0, rows: 10, cols: 10, cell: CELL }, items, label: 'A 10 by 10 grid of dice' } };
}
const WEIGHT = [0, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
const corr = (n) => [1, 2, 3, 4, 5, 6].reduce((a, f) => a + WEIGHT[f] * n[f], 0);
const G = diceGrid('iv-lesson-dice');
G.face = [6, 5, 4, 3, 2, 1].find((f) => G.pips.slice(0, 20).filter((p) => p === f).length >= 3) ?? 6; G.face2 = G.pips.slice(0, 20).filter((p) => p === G.face).length;
G.quick = 350 + 2.5 * (G.n[6] - G.n[1]);
const SD_TOT = Math.sqrt((100 * 35) / 12), SD_FACE = Math.sqrt(100 * (1 / 6) * (5 / 6));
const BASE = bestNorm(350, SD_TOT), SCAN = bestNorm(350, 12);
const faceSd = (c) => Math.max(1.5, 0.1 * c);
const PR = { six: 22, one: 12 }; PR.est = 350 + 2.5 * (PR.six - PR.one);
const ER = { six: 21, one: 13 }; ER.wrong = 350 + 6 * (ER.six - ER.one); ER.right = 350 + 2.5 * (ER.six - ER.one);
const normPts = Array.from({ length: 61 }, (_, i) => { const x = 280 + (140 * i) / 60; return [x, (Math.exp(-(((x - 350) / SD_TOT) ** 2) / 2) / (SD_TOT * Math.sqrt(2 * Math.PI))) * 1000]; });
const nm = ['', 'ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
const pm = (x) => (x < 0 ? `− ${-x}` : `+ ${x}`);

const corrQ = (rng) => {
  const n = [0, ...Array.from({ length: 6 }, () => rng.int(10, 24))];
  const s = n.slice(1).reduce((a, b) => a + b, 0); n[4] += 100 - s; if (n[4] < 0) { n[3] += n[4]; n[4] = 0; }
  const tot = [1, 2, 3, 4, 5, 6].reduce((a, f) => a + f * n[f], 0);
  return { type: 'number', q: `100 dice show ${[1, 2, 3, 4, 5, 6].map((f) => `${n[f]} ${nm[f]}`).join(', ')}. Using total = 350 + 2.5(sixes − ones) + 1.5(fives − twos) + 0.5(fours − threes), what is the total?`, answer: tot,
    hints: [`2.5 × (${n[6]} − ${n[1]}) = ${2.5 * (n[6] - n[1])}.`, `1.5 × (${n[5]} − ${n[2]}) = ${1.5 * (n[5] - n[2])}; 0.5 × (${n[4]} − ${n[3]}) = ${0.5 * (n[4] - n[3])}.`],
    explain: `350 ${pm(2.5 * (n[6] - n[1]))} ${pm(1.5 * (n[5] - n[2]))} ${pm(0.5 * (n[4] - n[3]))} = ${tot}. The identity is exact, not an approximation.` };
};
const bandQ = (rng) => {
  const scanned = rng.chance(0.5), est = rng.int(330, 375), sd = scanned ? 12 : round(SD_TOT, 1), b = bestNorm(est, sd);
  const opt = [Math.floor(b.lo), Math.ceil(b.hi)], narrow = [est - 5, est + 5], wide = [est - 100, est + 100], low = [Math.round(est - 2.6 * sd), Math.round(est + 1.6 * sd)];
  const E = ([l, u]) => dec(eNorm(est, sd, l, u), 2);
  return { hinge: true, ...mc({ q: `Your ${scanned ? 'scanned' : 'baseline'} estimate of the pips on 100 dice is ${est}, good to about ±${sd}. Which interval is best?`, right: `[${opt.join(', ')}]`, wrong: [
    [`[${narrow.join(', ')}]`, `± 5 treats the estimate as nearly exact (expected ${E(narrow)})`],
    [`[${wide.join(', ')}]`, `panic width (expected ${E(wide)})`],
    [`[${low.join(', ')}]`, `leans low: a lower band has a worse ratio (expected ${E(low)})`]],
    explain: `About ${dec(b.below, 1)} SDs below and ${dec(b.above, 1)} above: [${opt.join(', ')}], expected ${E(opt)}.` }, rng) };
};

export default {
  id: 'iv/dice-grid',
  book: 'iv',
  kind: 'family',
  family: 'dice-grid',
  title: 'Dice grid: counts and totals',
  summary: 'Start from the expectation (100/6 of a face, 350 pips), correct it with a quick scan, and size the band to what the scan leaves uncertain.',
  prerequisites: ['iv/dots-count', 'iv/expected-dice', 'prob/estimation-clt'],
  objectives: [
    'Give the baseline for a 10 × 10 dice grid in two seconds: 100/6 of any face, 350 pips in total',
    'Correct the total exactly with 350 + 2.5(sixes − ones) + 1.5(fives − twos) + 0.5(fours − threes)',
    'Count one face by scanning and give a band sized to the scan error',
    'Decide when the baseline alone is good enough to type',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'addall', label: 'Started adding every die', approach: 'Summed the faces row by row and ran out of time around row four.', breaksAt: 'A hundred additions do not fit; start from 350 and measure only the deviations.' },
      { id: 'sixpips', label: 'Counted each extra six as 6', approach: 'Added 6 pips for every six seen beyond the ones.', breaksAt: 'The baseline already counts each die at 3.5, so a six adds only 2.5 more.' },
      { id: 'spread', label: 'Kept ±17 after scanning', approach: 'Used the chance spread of the total as the band after counting sixes and ones.', breaksAt: 'The scan removes much of that uncertainty; the band should shrink.' },
    ], q: 'Before any teaching: a picture shows a 10 × 10 grid of dice. "What is the total number of pips?" What number do you have before looking closely, and how would you improve it in 45 seconds? Two approaches.', answer: `Start from 100 × 3.5 = 350. Then count the sixes and the ones: each six adds 2.5 over the average, each one takes 2.5 away.`,
      explain: `Summing 100 faces is too slow. The baseline alone is typically off by about ${dec(SD_TOT, 0)} pips; a scan of sixes and ones removes much of that. The lesson turns this into an exact identity and a band.` },
    { type: 'text', text: 'The cue: a **grid of dice** and either "How many of the 100 dice show a four?" or "What is the total number of pips on all 100 dice?". You cannot sum 100 faces in a minute, and you do not need to.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question belongs to this lesson?', right: 'A 10 × 10 grid of dice: how many show a five?', wrong: [['Two dice: expected value of the larger', 'theory, no picture: iv/expected-dice'], ['A 10 × 10 grid of dots: how many cells are filled?', 'plain counting: iv/dots-count'], ['Ten dice: probability the total is at least 40', 'a probability to estimate: iv/prob-estimate']], explain: 'A picture of real dice, and a count or a total.' }),
    ] },

    sec('why'),
    { type: 'text', text: `The dice grid rewards thinking before looking. The baseline alone (350 pips, or 100/6 of a face) already earns about ${dec(BASE.e, 2)} on a total; a 30-second scan lifts that to about ${dec(SCAN.e, 2)}. Candidates who try to add up the dice run out of time and score 0. The method here is the same one a trader uses on any big noisy total: write down what you expect, measure only the biggest deviations, and let the band cover the rest.` },

    sec('anchor'),
    { type: 'text', text: 'From the expected-value lesson: one die averages 3.5, so 100 dice average 350, and each face appears 100/6 times on average. **One change**: here the dice are in front of you, so you correct the expectation with what you actually see. The expectation is free and instant; the correction costs scanning time, so you buy only as much of it as the clock allows.' },
    { type: 'check', scope: 'the baseline', questions: [
      mc({ q: 'Before looking closely: how many of 100 dice do you expect to show a two?', right: dec(100 / 6, 2), wrong: [['20', '100/5: there are six faces, not five'], ['10', 'one tenth: there are six faces'], ['2', 'confused the face value with the count']], explain: '100 × 1/6 ≈ 16.67.' }),
    ] },

    sec('picture'),
    { type: 'diagram', diagram: 'dots', spec: G.spec, caption: `This grid holds ${G.n.slice(1).map((c, i) => `${c} ${nm[i + 1]}`).join(', ')}: total ${G.total} pips. The baseline 350 is off by ${Math.abs(G.total - 350)}.` },
    { type: 'check', scope: 'scanning for one face', questions: [
      { type: 'number', q: `In the top two rows of the grid above, how many dice show a ${G.face}?`, answer: G.face2, hints: [`Look for the pattern of ${G.face} pips only; ignore the rest.`, 'Scan row one, then row two.'], explain: `The top two rows hold ${G.face2} ${nm[G.face]}.` },
    ] },
    { type: 'text', text: 'Summarise the grid by how many dice show each face. The baseline assumes every face appears 100/6 times; the real counts never match exactly, and the total drifts from 350 by the weighted sum of those drifts.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Faces in the grid above', xLabel: 'face', yLabel: 'dice', categories: ['1', '2', '3', '4', '5', '6'], series: [{ name: 'count', values: G.n.slice(1) }, { name: 'expected', values: Array(6).fill(round(100 / 6, 2)) }], valueLabels: true }, caption: `Real counts wobble around 100/6 ≈ ${dec(100 / 6, 1)}. The total moves by the face value minus 3.5 for every die above or below expectation: ${dec(corr(G.n), 1)} here, so 350 + ${dec(corr(G.n), 1)} = ${G.total}.` },
    { type: 'check', scope: 'the correction identity', questions: [{ make: corrQ }] },
    { type: 'text', text: 'How far can the real total be from 350? Each die varies by its own SD, and 100 independent dice add their variances, so the total spreads like a normal curve. That spread is your error if you type the baseline without looking.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 280, max: 420, label: 'total pips on 100 dice' }, y: { min: 0, max: 25, label: 'chance per pip (per 1000)' }, curves: [{ label: 'baseline spread', points: normPts }], vlines: [{ x: 350, label: '350' }, { x: round(350 - 2 * SD_TOT, 1), label: '−2 SD' }, { x: round(350 + 2 * SD_TOT, 1), label: '+2 SD' }] }, caption: `Before any scan the total is roughly normal around 350 with SD √(100 × 35/12) ≈ ${dec(SD_TOT, 1)}. A scan does not change the dice; it shrinks your uncertainty about them, to about ±12 after counting sixes and ones.` },
    { type: 'check', scope: 'the chance spread', questions: [
      { type: 'number', q: 'What is the SD of the total pips on 100 fair dice? (1 decimal place)', answer: round(SD_TOT, 1), tolerance: 0.051, hints: ['One die has variance 35/12.', 'Variances add: 100 × 35/12, then the square root.'], explain: `√(100 × 35/12) = √${dec((100 * 35) / 12, 1)} ≈ ${dec(SD_TOT, 2)}.` },
    ] },

    sec('derivation'),
    { type: 'text', text: 'Five moves: the baseline, its spread, the exact correction, the order in which to scan, and the band. Each one is short; together they turn an impossible sum into a 30-second estimate with a known error.' },
    { type: 'steps', steps: [
      { answers: 'addall', say: 'Baseline from expectation: one face appears about 100/6 ≈ 16.7 times; the total is about 100 × 3.5 = 350.', why: 'Linearity: expected count = 100 × 1/6, expected total = 100 × 3.5.',
        checks: [{ make: (rng) => { const n = rng.pick([36, 64, 100, 144]); return { type: 'number', q: `A grid of ${n} dice (${Math.sqrt(n)} rows of ${Math.sqrt(n)}). Baseline for the total pips?`, answer: 3.5 * n, explain: `${n} × 3.5 = ${3.5 * n}.` }; } }] },
      { say: `Know the baseline's spread: the total has SD ≈ ${dec(SD_TOT, 1)}; one face's count has SD √(100 × 1/6 × 5/6) ≈ ${dec(SD_FACE, 1)}.`, why: 'These are the errors you carry if you type the baseline without looking.',
        checks: [mc({ q: 'Without looking, what is the SD of the number of fives among 100 dice?', right: dec(SD_FACE, 2), wrong: [[dec(100 / 6, 2), 'that is the expected count, not its spread'], [dec(SD_TOT, 2), 'that is the SD of the total pips'], [dec(Math.sqrt(100 / 6), 2), 'used √(np) and forgot the (1 − p) factor']], explain: `Binomial(100, 1/6): √(100 × 1/6 × 5/6) ≈ ${dec(SD_FACE, 2)}.` })] },
      { answers: 'sixpips', say: 'Correct the total exactly: each die contributes its face minus 3.5 on top of 350, so total = 350 + 2.5(sixes − ones) + 1.5(fives − twos) + 0.5(fours − threes).', why: 'Group the dice by face: a six is 2.5 above average, a one 2.5 below, and so on.',
        checks: [{ make: corrQ }] },
      { say: 'Scan in order of weight: sixes and ones first (2.5 each), then fives and twos (1.5). Fours and threes barely move the total; skip them.', why: 'The biggest weights remove the most uncertainty per second of scanning.',
        checks: [mc({ q: 'You have time to count only two faces. Which two?', right: 'Sixes and ones', wrong: [['Threes and fours', 'weights 0.5: they move the total least'], ['Sixes and fives', 'both push the same way; pairing a high face with a low one measures the imbalance'], ['Ones and twos', 'both low: you learn nothing about the high side']], explain: 'Weights 2.5 and −2.5: the largest effect on the total.' })] },
      { answers: 'spread', say: 'Type a band: about ±12 (one SD) after a sixes-and-ones scan, ±17 for the bare baseline, about 10% for a single-face count; two SDs each way, leaning high.', why: 'The band follows what is still uncertain after the scan, not the chance spread of the dice.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why does counting sixes and ones improve the total so much more than counting threes and fours?', model: 'Each die adds its face minus 3.5 to the baseline 350. Sixes and ones are 2.5 away from 3.5, threes and fours only 0.5, so an imbalance of sixes over ones moves the total five times as much as the same imbalance of fours over threes. Counting the heavy faces removes most of the uncertainty for the same scanning time.', points: ['Total = 350 + Σ (face − 3.5) per die', 'Sixes and ones carry weight 2.5; threes and fours only 0.5', 'Scan the heavy faces first'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'dice-grid', section: 'iv', difficulty: 2, seed: 'a', intro: 'Count one face. Expect 100/6 first, then scan, then choose the band.' },
    { type: 'worked', family: 'dice-grid', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'The total pips. The baseline and scan are given; the band is yours.' },
    { type: 'thinkaloud', problem: 'The 10 × 10 dice grid from the picture section: what is the total number of pips?', lines: [
      { t: 0, say: 'I see a grid of dice and "total pips": baseline 100 × 3.5 = 350. I will not add them up.' },
      { t: 4, say: `I scan for sixes, row by row: ${G.n[6]}. Then ones: ${G.n[1]}.` },
      { t: 18, say: `Correction: 6 × (${G.n[6]} − ${G.n[1]}) = ${6 * (G.n[6] - G.n[1])}.`, slip: true },
      { t: 21, say: `No: the baseline already counts every die at 3.5, so each six is only 2.5 above it: 2.5 × (${G.n[6]} − ${G.n[1]}) = ${2.5 * (G.n[6] - G.n[1])}. About ${G.quick}.` },
      { t: 28, say: `Check: a correction of ${Math.abs(2.5 * (G.n[6] - G.n[1]))} is well inside the usual ±${dec(SD_TOT, 0)}, so nothing looks miscounted.` },
      { t: 34, say: `Fives and twos unscanned, so about ±12, leaning high: [${Math.floor(bestNorm(G.quick, 12).lo)}, ${Math.ceil(bestNorm(G.quick, 12).hi)}]. (True total ${G.total}.)` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try corrected by 6 × (17 − 15). What was wrong?', options: ['each six is only 2.5 above 3.5', 'the ones were counted twice', 'the baseline is 600'], answer: 0, traps: { 1: '15 ones were counted once', 2: 'the baseline is 100 × 3.5 = 350' }, explain: 'The baseline already counts each die at 3.5: 2.5 × (17 − 15) = 5.' },
    ] },

    sec('predict'),
    { type: 'predict', question: `You count ${PR.six} sixes and ${PR.one} ones among 100 dice, and the rest look balanced. What is your estimate of the total?`, answer: `About 350 + 2.5 × (${PR.six} − ${PR.one}) = ${PR.est}.`, explain: 'Each extra six is 2.5 above the average and each missing one is 2.5 fewer below it, so both push the total up.' },

    sec('traps'),
    { type: 'traps', family: 'dice-grid', section: 'iv', extra: [
      { belief: 'Each extra six adds 6 pips.', fix: 'It adds 6 − 3.5 = 2.5 relative to the baseline, which already counts every die at 3.5.' },
      { belief: 'Type 350 ± 17 after scanning.', fix: '±17 is the spread before looking. After a scan, your error is smaller: about ±12.' },
      { belief: 'Type 16.67 for "how many show a four".', fix: 'That is only the expectation. The grid shows actual dice: scan and count.' },
      { belief: 'Add all 100 faces to be exact.', fix: 'It cannot be done in 60 seconds; a half-finished sum scores 0.' },
    ] },
    { type: 'erroneous', problem: `A candidate estimates the total pips on 100 dice. One step is wrong.`, steps: [
      'Baseline: 100 × 3.5 = 350.',
      `I count ${ER.six} sixes and ${ER.one} ones.`,
      `There are ${ER.six - ER.one} more sixes than ones, and each six adds 6 pips: 350 + 6 × ${ER.six - ER.one} = ${ER.wrong}.`,
      `Band: about ±12, leaning high, around ${ER.wrong}.`,
    ], errorStep: 2, explain: `The baseline already counts each die at 3.5, so a six adds only 6 − 3.5 = 2.5 and a one removes 2.5: 350 + 2.5 × (${ER.six} − ${ER.one}) = ${ER.right}. The wrong band sits ${ER.wrong - ER.right} too high and would miss.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'You counted 19 sixes and 15 ones. What does that imbalance add to the baseline?', right: String(2.5 * (19 - 15)), wrong: [[String(6 * (19 - 15)), 'counted each extra six as 6 pips'], [String(6 * 19 - 15), 'added the pips of the sixes and ones instead of their imbalance'], ['0', 'thought the baseline already includes the sixes you see']], explain: '2.5 × (19 − 15) = 10.' }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Remember the weights 2.5, 1.5, 0.5. With 20 seconds, count sixes and ones only. With 35, add fives and twos. Never count threes and fours for a total. For a single face, sweep each row once, left to right, saying the running count; a second sweep of the same face is the best use of spare seconds.' },
    { type: 'check', scope: 'weights and the fallback band', questions: [
      { make: (rng) => { const a = rng.int(12, 24), b = rng.int(12, 24); return { type: 'number', q: `You counted ${a} fives and ${b} twos. What does that add to the total (negative if it lowers it)?`, answer: 1.5 * (a - b), explain: `1.5 × (${a} − ${b}) = ${1.5 * (a - b)}.` }; } },
    ] },
    { type: 'callout', tone: 'speed', text: `If a question comes when you have less than 15 seconds left, type the baseline band for the total, [${Math.floor(BASE.lo)}, ${Math.ceil(BASE.hi)}]: it still earns about ${dec(BASE.e, 2)} on average.` },
    { type: 'check', scope: 'the fallback band', questions: [
      { type: 'choice', q: 'Less than 15 seconds left for "total pips" on a 10 × 10 grid. What do you type?', options: ['the baseline band [315, 387]', 'a single number: 350 exactly', 'nothing for this one'], answer: 0, traps: { 1: 'a zero-width guess almost never scores', 2: 'the baseline band still earns about 0.79' }, explain: 'Type the baseline band: it scores well on average.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Dice grid → baseline (100/6 per face, 350 pips) → scan heavy faces: total = 350 + 2.5(6s − 1s) + 1.5(5s − 2s) + 0.5(4s − 3s) → band two SDs of what is left (±12 after a 6s-and-1s scan), leaning high.' },

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Start from', 'Then', 'Error after 30 s'], rows: [
      ['dice grid: total pips', '350', 'scan 6s and 1s (then 5s and 2s)', 'about ±12'],
      ['dice grid: one face', `100/6 ≈ ${dec(100 / 6, 1)}`, 'scan that face only', 'about 10%, at least ±1.5'],
      ['dot grid (iv/dots-count)', 'nothing', 'count rows or gaps', '1 + 2% of the count'],
      ['expected total of n dice (iv/expected-dice)', 'n × 3.5', 'nothing: it is exact', 'zero'],
    ] },
    { type: 'variation', base: `Base: a 10 × 10 grid of dice, total pips: baseline 350, spread ±${dec(SD_TOT, 1)} before scanning.`, rows: [
      { change: 'The grid becomes 8 × 8 (64 dice)', effect: `Baseline 64 × 3.5 = ${64 * 3.5}, spread √(64 × 35/12) ≈ ${dec(Math.sqrt((64 * 35) / 12), 1)}: smaller in pips, similar in percent.` },
      { change: 'Total pips becomes "how many show a six"', effect: `Baseline 100/6 ≈ ${dec(100 / 6, 1)}, and you count one face exactly; error about 10%.` },
      { same: true, change: 'The dice are shuffled into a different arrangement', effect: 'No change: the same dice give the same total and the same counts. Only your scanning path changes.' },
      { change: 'You also count fives and twos', effect: 'Same total, less uncertainty: the band narrows because a bigger part of the correction is now known.' },
      { fusion: true, change: 'The grid becomes 8 × 8 AND the question becomes "how many show a six"', effect: `Baseline 64/6 ≈ ${dec(64 / 6, 1)}, scanned for sixes only; the error stays about ±1.5 at this size.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a face count can be small (under 10), where one missed die is a 10% error, so the band never goes below about ±1.5. If a grid looks strongly skewed (many sixes), trust the scan over the baseline: the correction can be far bigger than 17.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'An 8 × 8 grid of dice. What is the baseline for the total pips?', right: String(64 * 3.5), wrong: [['350', 'used 100 dice'], [String(64 * 6), 'counted every die as a six'], [String(64 * 3), 'used 3 as the average face']], explain: '64 × 3.5 = 224.' }),
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "expectation plus a measured correction" is how the percentile grid, the noisy series and every Fermi estimate are refined. In Beat the Odds the same 350 ± 17 appears as a CLT question about 100 dice.' },
    { type: 'transfer',
      near: { make: (rng) => { const s = rng.pick([6, 8]), n6 = rng.int(3, 14), n1 = rng.int(3, 14); const base = s * s * 3.5; return { type: 'number', q: `A ${s} × ${s} grid of dice shows ${n6} sixes and ${n1} ones; the other faces look balanced. Estimate the total pips.`, answer: base + 2.5 * (n6 - n1), explain: `Baseline ${s * s} × 3.5 = ${base}; correction 2.5 × (${n6} − ${n1}) = ${2.5 * (n6 - n1)}; about ${base + 2.5 * (n6 - n1)}.` }; } },
      far: { type: 'number', q: 'Outside the assessment: 30 exams are expected to average 70. You spot 4 scores of 95 and 2 of 45; the rest look average. Estimate the class total.', answer: 30 * 70 + 4 * (95 - 70) + 2 * (45 - 70), explain: `Baseline 30 × 70 = ${30 * 70}; deviations 4 × 25 − 2 × 25 = ${4 * 25 - 2 * 25}; total about ${30 * 70 + 4 * 25 - 2 * 25}.` },
      principle: mc({ q: 'Which idea carried over from dice to exams?', right: 'Mean baseline plus measured deviations', wrong: [['Add every single item exactly', 'too slow in both, and not needed'], ['Count only the most common value', 'the rare, far-from-average items move the total most'], ['Band with the chance spread of the total', 'the band follows what is left uncertain after the scan']], explain: 'Total = n × mean + Σ (item − mean) over the items you checked: the same identity for dice and for exams.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'dice-grid', section: 'iv', count: 3 },
  ],
};
