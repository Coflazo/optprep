// Intervals: coupon collector, uniform (n·H(n), exact) and weighted (inclusion-exclusion over
// the sets of items, exact but long enough to allow a small band). Every number is computed here.
import { Q, sumQ } from '../../../core/rational.js';
import { sec, dec, round, mc, ivq, exactEntry, bestLog } from './scoring-and-width.js';

const H = (n) => sumQ(Array.from({ length: n }, (_, i) => Q.of(1, i + 1)));
const nH = (n) => Q.of(n).mul(H(n));
// E[time to collect all] = Σ over non-empty sets S of (−1)^(|S|+1) / P(S).
function ie(ps) {
  let e = Q.of(0);
  const rows = [];
  for (let mask = 1; mask < 1 << ps.length; mask++) {
    let p = Q.of(0), bits = 0; const names = [];
    ps.forEach((x, i) => { if (mask & (1 << i)) { p = p.add(x); bits++; names.push(i); } });
    const inv = Q.of(1).div(p);
    e = bits % 2 ? e.add(inv) : e.sub(inv);
    rows.push({ names, bits, p, inv });
  }
  return { e, rows };
}
const qs = (arr) => arr.map(([a, b]) => Q.of(a, b));
const N6 = 6, STAGES = Array.from({ length: N6 }, (_, i) => Q.of(N6, N6 - i));
const TOYS = ['red', 'blue', 'green', 'yellow'];
const CH = { ps: qs([[1, 2], [1, 3], [1, 6]]) }; Object.assign(CH, ie(CH.ps));
const CH_SINGLE = sumQ(CH.ps.map((p) => Q.of(1).div(p)));
const PRED = { ps: qs([[1, 2], [1, 4], [1, 8], [1, 8]]) }; PRED.e = ie(PRED.ps).e; PRED.pair = ie(PRED.ps.slice(2)).e;
PRED.near = [8, 12, 16].reduce((b, x) => (Math.abs(x - PRED.e.toNumber()) < Math.abs(b - PRED.e.toNumber()) ? x : b));
const S3 = qs([[1, 2], [1, 4], [1, 4]]), S3sum = sumQ(S3.map((p) => Q.of(1).div(p)));
const NS = Array.from({ length: 20 }, (_, i) => i + 1);
const B3 = bestLog(0.02), B4 = bestLog(0.04);
const show = (q) => `${q.toString()}${q.d === 1n ? '' : ` ≈ ${dec(q.toNumber(), 4)}`}`;

const geoQ = (rng) => { const [a, b] = rng.pick([[1, 6], [1, 8], [2, 5], [1, 4], [3, 10], [1, 12]]); return { type: 'number', q: `Each try succeeds with probability ${a}/${b}, independently. Expected number of tries until the first success?`, answer: b / a, tolerance: 1e-9, explain: `1 ÷ (${a}/${b}) = ${b}/${a}${b % a ? ` = ${dec(b / a, 4)}` : ''}.` }; };
const stageQ = (rng) => { const n = rng.int(4, 12), i = rng.int(1, n - 1); return { type: 'number', q: `A fair ${n}-sided die: you have already seen ${i} different faces. Expected rolls until a new face? (4 decimal places)`, answer: round(n / (n - i), 4), tolerance: 0.0001, hints: [`A new face has chance ${n - i}/${n} per roll.`, 'Geometric wait: 1 ÷ chance.'], explain: `${n}/${n - i}${n % (n - i) ? ` = ${dec(n / (n - i), 4)}` : ''}.` }; };
const nHQ = (rng) => { const n = rng.int(3, 9), q = nH(n); return ivq(`A fair ${n}-sided die is rolled until every face has appeared. Type the best interval for the expected number of rolls.`, q.toNumber(), `${Array.from({ length: n }, (_, i) => `${n}/${n - i}`).join(' + ')} = ${show(q)}. Type ${exactEntry(q.toNumber()).text}.`, ['Add the stage waits n/n + n/(n − 1) + … + n/1.', 'Keep fractions until the end; the sum is n × H(n).']); };
const twoQ = (rng) => { const [a, b] = rng.pick([[1, 3], [1, 4], [1, 5], [2, 5], [1, 6], [3, 8]]); const p = Q.of(a, b), q = Q.of(1).sub(p), e = Q.of(1).div(p).add(Q.of(1).div(q)).sub(Q.of(1)); return { type: 'number', q: `Two toys: A with probability ${p.toString()}, B with ${q.toString()}. Expected boxes to get both? (4 decimal places)`, answer: round(e.toNumber(), 4), tolerance: 0.0001, hints: ['max(a, b) = a + b − min(a, b).', 'The first box always holds A or B, so the wait for "either" is 1.'], explain: `1/(${p.toString()}) + 1/(${q.toString()}) − 1 = ${show(e)}.` }; };
const maxQ = (rng) => { const [a, b, c] = [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)]; const v = a + b + c - Math.min(a, b) - Math.min(a, c) - Math.min(b, c) + Math.min(a, b, c); return { type: 'number', q: `a = ${a}, b = ${b}, c = ${c}. Compute a + b + c − min(a,b) − min(a,c) − min(b,c) + min(a,b,c).`, answer: v, explain: `${a + b + c} − ${Math.min(a, b) + Math.min(a, c) + Math.min(b, c)} + ${Math.min(a, b, c)} = ${v}, which is max(${a}, ${b}, ${c}). The alternating sum of minima always rebuilds the maximum.` }; };
const threeQ = (rng) => {
  let w; do w = [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)]; while (new Set(w).size === 1);
  const tot = w.reduce((a, b) => a + b, 0), ps = w.map((x) => Q.of(x, tot)), { e } = ie(ps);
  const singles = sumQ(ps.map((p) => Q.of(1).div(p))), pairs = sumQ([[0, 1], [0, 2], [1, 2]].map(([i, j]) => Q.of(1).div(ps[i].add(ps[j]))));
  return { type: 'number', q: `Three toys with probabilities ${ps.map((p) => p.toString()).join(', ')}. Expected boxes to collect all three? (2 decimal places)`, answer: round(e.toNumber(), 2), tolerance: 0.006,
    hints: ['Singles: add 1/p for each toy. Pairs: subtract 1/(p + q) for each pair. The triple: add 1/1.', `Singles ${show(singles)}; pairs ${show(pairs)}.`],
    explain: `${show(singles)} − ${show(pairs)} + 1 = ${show(e)}.` };
};
const widthQ = (rng) => {
  const k = rng.pick([3, 4]), b = k === 3 ? B3 : B4;
  return { hinge: true, ...mc({ q: `You computed a weighted coupon answer with ${k} toys (${2 ** k - 1} signed terms) in 35 seconds and got 9.4. You did not double-check. What do you type?`, right: `[${dec(9.4 / b.f, 2)}, ${dec(9.4 * b.f, 2)}]`, wrong: [
    ['[9.4, 9.4]', 'zero width assumes no slip in a long signed sum; one slip scores 0'],
    ['[5, 15]', 'the method is exact, so there is no model doubt to cover: this throws away most of the score'],
    [`[${dec(9.4 * 0.998, 2)}, ${dec(9.4 * 1.002, 2)}]`, 'a 0.2% band covers rounding, not a slipped term']],
    explain: `Exact method, error-prone arithmetic: allow about ${k === 3 ? 2 : 4}% (one SD), which gives 9.4 ×/÷ ${dec(b.f, 3)}. If you did double-check, bracket the exact fraction instead.` }, rng) };
};

const TA = { e: ie(S3).e, pairs: sumQ([[0, 1], [0, 2], [1, 2]].map(([i, j]) => Q.of(1).div(S3[i].add(S3[j])))) };

export default {
  id: 'iv/coupon',
  book: 'iv',
  kind: 'family',
  family: 'coupon',
  title: 'Coupon collector, plain and weighted',
  summary: 'Uniform: n·H(n), a sum of shrinking geometric waits. Weighted: the time of the last first-arrival, by inclusion-exclusion over sets of items. The rarest item dominates.',
  prerequisites: ['iv/expected-dice', 'bto/coupon-collector', 'prob/inclusion-exclusion'],
  objectives: [
    'Compute n·H(n) exactly for a fair die with up to 12 faces',
    'Compute the weighted collector with 3 or 4 items by inclusion-exclusion over sets',
    'Sanity-check any answer against the rarest item and the uniform case',
    'Choose between a tight bracket and a 2 to 4% band depending on how long the arithmetic was',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'uniform', label: 'Treated it as a fair die', approach: `Used 3 × H(3) = ${show(nH(3))}, as if all toys were equally likely.`, breaksAt: 'The stage waits n/(n − i) need equal chances; unequal ones make collecting slower.' },
      { id: 'sumall', label: 'Added every 1/p', approach: `Took ${CH.ps.map((p) => Q.of(1).div(p).toString()).join(' + ')} = ${CH_SINGLE.toString()} boxes.`, breaksAt: 'The waits for different toys overlap in time, so their sum overcounts.' },
      { id: 'rareonly', label: 'Used the rarest toy alone', approach: `Answered ${1 / CH.ps[2].toNumber()}, the wait for the rarest toy.`, breaksAt: 'That is only a lower bound: other toys can still be missing when it arrives.' },
    ], q: `Before any teaching: a cereal box holds one of 3 toys: ${TOYS.slice(0, 3).map((t, i) => `${t} with probability ${CH.ps[i].toString()}`).join(', ')}. What is the expected number of boxes needed to collect all three? Two approaches, then an interval.`, answer: `${show(CH.e)} boxes`,
      explain: `Tempting wrong answers: 3 (one box per toy), ${1 / CH.ps[2].toNumber()} (the rare green toy alone) and ${CH_SINGLE.toString()} (adding every 1/p, which double-counts waits that overlap). The lesson shows why ${CH_SINGLE.toString()} − ${CH.rows.filter((r) => r.bits === 2).reduce((a, r) => a.add(r.inv), Q.of(0)).toString()} + 1 is right.` },
    { type: 'text', text: 'The cue: keep drawing (rolling a die, opening boxes) **until every** item has appeared, and give the expected number of draws. Either the items are equally likely (a fair n-sided die) or each has its own probability (toys, stickers).' },
    { type: 'list', items: ['"A fair 8-sided die is rolled until every face has appeared. Expected number of rolls?"', '"A box holds one of 3 toys with probabilities 1/2, 1/3, 1/6. Expected boxes to collect all 3?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question is a coupon-collector question?', right: 'Roll a fair die until all six faces have appeared: expected rolls', wrong: [['Roll a fair die until a six appears: expected rolls', 'one specific face: a single geometric wait of 6'], ['Roll until two sixes in a row: expected rolls', 'a run: the waiting-time family'], ['Roll a die 6 times: expected number of different faces', 'a fixed number of rolls: linearity with indicators']], explain: 'Every face must appear, and you keep rolling until they have.' }),
    ] },
    { type: 'text', text: 'Not this lesson: waiting for one **specific** item (a single geometric wait, 1/p) and waiting for a **run** such as two sixes in a row (iv/waiting-time).' },
    { type: 'check', scope: 'one item, or a run', questions: [
      { type: 'choice', q: '"Roll a die until two sixes in a row. Expected rolls?" Which lesson is it?', options: ['waiting for a run: iv/waiting-time', 'collecting every face (this lesson)', 'a single geometric wait'], answer: 0, traps: { 1: 'nothing is collected: the target is a run', 2: 'a run needs two sixes back to back, not one six' }, explain: 'A run of consecutive results is a waiting-time question.' },
    ] },

    sec('why'),
    { type: 'text', text: 'The collector is reported in Intervals in both forms. The uniform one is exact and quick once you see the stages. The weighted one is exact too, but its signed sum has 7 or 15 terms, so it tests arithmetic under time pressure and a sensible choice of width. Both reward the same habit: sanity-check the result against the rarest item before typing, because the tempting wrong answers are far from the truth.' },

    sec('anchor'),
    { type: 'text', text: 'You know the geometric wait: an event with chance p per try takes 1/p tries on average. The collector is that idea **with one change**: you wait several times in a row, and each time the chance of something new is smaller than before.' },
    { type: 'check', scope: 'the geometric wait', questions: [{ make: geoQ }] },

    sec('picture'),
    { type: 'text', text: `Uniform case, a fair ${N6}-sided die. Split the wait into stages by how many faces you have seen. The first roll is always new; after that each new face gets harder to find.` },
    { type: 'diagram', diagram: 'bar', spec: { title: `Expected rolls per stage, fair ${N6}-sided die`, xLabel: 'faces already seen', yLabel: 'expected rolls', categories: STAGES.map((_, i) => String(i)), series: [{ name: 'wait', values: STAGES.map((q) => round(q.toNumber(), 3)) }], valueLabels: true }, caption: `Stage waits ${STAGES.map((q) => q.toString()).join(', ')}. They add to ${show(nH(N6))}. The last face alone costs ${N6} rolls, ${dec(N6 / nH(N6).toNumber() * 100, 0)}% of the total.` },
    { type: 'check', scope: 'stage waits', questions: [{ make: stageQ }] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: 20, label: 'n (faces)' }, y: { min: 0, max: 80, label: 'expected rolls' }, curves: [{ label: 'n·H(n)', points: NS.map((n) => [n, nH(n).toNumber()]) }, { label: 'n(ln n + 0.577)', points: NS.map((n) => [n, n * (Math.log(n) + 0.5772)]) }] }, caption: `n·H(n) grows a little faster than n: about n(ln n + 0.577) + ½. At n = 20 the exact value is ${dec(nH(20).toNumber(), 2)}. The approximation is for sanity checks; the exact sum is short enough to compute for n up to 12.` },
    { type: 'check', scope: 'n·H(n)', questions: [{ make: nHQ }] },
    { type: 'text', text: 'Weighted items break the stage trick: which toy counts as new depends on which toys you already hold. Look from the toys\' side instead. Each toy has its own first-arrival time, and you finish when the last of them arrives. The table lists the pieces of that calculation.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['set S of toys', 'P(S)', '1/P(S)', 'sign'], rows: CH.rows.map((r) => [r.names.map((i) => TOYS[i]).join(' or '), r.p.toString(), show(r.inv), r.bits % 2 ? '+' : '−']).concat([['total', '', show(CH.e), '']]) }, caption: `Weighted case, toys ${CH.ps.map((p) => p.toString()).join(', ')}. One row per non-empty set of toys: add the singles, subtract the pairs, add the triple. Total ${show(CH.e)}.` },
    { type: 'check', scope: 'the signed table with two toys', questions: [{ make: twoQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { answers: 'uniform', say: 'Uniform, n items. Holding i distinct items, a new one arrives with chance (n − i)/n per draw, so that stage waits n/(n − i) draws.', why: 'Each stage is a geometric wait, and it starts afresh when the previous one ends.',
        checks: [{ make: stageQ }] },
      { say: 'Add the stages: n/n + n/(n − 1) + … + n/1 = n(1 + 1/2 + … + 1/n) = n·H(n).', why: 'Linearity: the expected total is the sum of the expected stages.',
        checks: [{ make: nHQ }] },
      { answers: 'sumall', say: 'Weighted items. Let T_{i} be the first box holding toy i; it is geometric with mean 1/p_{i}. You finish at the **last** of these: T = max(T_{1}, …, T_{k}).', why: 'You are done exactly when the slowest toy has arrived.',
        checks: [mc({ q: 'Why is E[T] not 1/p_{1} + 1/p_{2} + 1/p_{3}?', right: 'The waits overlap in time', wrong: [['It is: separate waits always add up', 'waits add only when they run one after another, like the uniform stages'], ['The toys are not independent of each other', 'the fix is about overlap in time, not dependence']], explain: 'Summing the 1/p values counts the same boxes several times.' })] },
      { say: 'A maximum is rebuilt from minima: max(a, b) = a + b − min(a, b), and for three, a + b + c − the three pairwise minima + the triple minimum.', why: 'Inclusion-exclusion; check it on numbers.',
        checks: [{ make: maxQ }] },
      { answers: 'rareonly', say: 'The minimum over a set S is the wait for any toy of S: chance P(S) per box, mean 1/P(S). So E[T] = Σ 1/p_{i} − Σ 1/(p_{i} + p_{j}) + … ± 1/1.', why: 'Take expectations of the max-min identity; each minimum is a geometric wait.',
        checks: [{ make: threeQ }] },
      { say: 'Type it. Uniform: bracket n·H(n) exactly. Weighted: the method is exact, but 7 or 15 signed terms invite a slip, so unless you double-checked, allow about 2% (3 toys) or 4% (4 toys).', why: 'A slipped term makes a zero-width answer score 0; a small band costs a few percent.',
        checks: [{ make: widthQ }] },
    ] },
    { type: 'explain', prompt: 'Why does the rarest item dominate the expected collection time?', model: 'You cannot finish before the rarest item arrives, and that alone takes 1/p_{min} boxes on average. By the time it arrives, the common items have almost always been collected already, so the other terms add relatively little on top of 1/p_{min}.', points: ['The answer is at least 1/p_{min}', 'Common items arrive early, during the long wait for the rare one', 'So the total is 1/p_{min} plus a modest correction'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'coupon', section: 'iv', difficulty: 3, seed: 'a', intro: 'A fair die with every face to collect. Add the stages, then decide what to type.' },
    { type: 'worked', family: 'coupon', section: 'iv', difficulty: 4, seed: 'b', fade: 1, intro: 'Three weighted toys. The signed sum is given; choosing the interval is yours.' },
    { type: 'thinkaloud', problem: `A box holds one of 3 toys with probabilities ${S3.map((p) => p.toString()).join(', ')}. Expected boxes to collect all three?`, lines: [
      { t: 0, say: 'I see "collect all" with unequal chances: inclusion-exclusion over sets of toys.' },
      { t: 5, say: `Singles: ${S3.map((p) => Q.of(1).div(p).toString()).join(' + ')} = ${S3sum.toString()}.` },
      { t: 12, say: `Pairs: ${[[0, 1], [0, 2], [1, 2]].map(([i, j]) => `1/(${S3[i].add(S3[j]).toString()})`).join(' + ')} = ${TA.pairs.toString()}, so ${S3sum.toString()} + ${TA.pairs.toString()} …`, slip: true },
      { t: 17, say: 'No: the signs alternate. Singles are added, pairs subtracted, the triple added back.' },
      { t: 24, say: `${S3sum.toString()} − ${TA.pairs.toString()} + 1 = ${show(TA.e)}.` },
      { t: 31, say: `Check: above the rare toy's 4 and above 3·H(3) = ${dec(nH(3).toNumber(), 2)}, below ${S3sum.toString()}. It passes.` },
      { t: 38, say: `Checked once only, so about 2%: roughly [${dec(TA.e.toNumber() / B3.f, 2)}, ${dec(TA.e.toNumber() * B3.f, 2)}].` },
    ] },
    { type: 'check', scope: 'the slip in the think-aloud', questions: [
      { type: 'choice', q: 'In the think-aloud, the first try added the pair terms. What was wrong?', options: ['the signs alternate', 'the singles were wrong', 'there are no pair terms'], answer: 0, traps: { 1: '2 + 4 + 4 = 10 is right', 2: 'inclusion-exclusion has pair terms, subtracted' }, explain: 'Singles added, pairs subtracted, the triple added back: 10 − 14/3 + 1 = 19/3.' },
    ] },

    sec('predict'),
    { type: 'predict', question: `Stickers with probabilities ${PRED.ps.map((p) => p.toString()).join(', ')}. Is the expected number of boxes closer to 8, 12 or 16?`, answer: `Closer to ${PRED.near}: ${show(PRED.e)}.`, explain: `Each 1/8 sticker alone takes 8 boxes, and you need both of them: that pair alone takes 8 + 8 − 1/(1/8 + 1/8) = ${show(PRED.pair)}. The two common stickers add a little more.` },

    sec('traps'),
    { type: 'traps', family: 'coupon', section: 'iv', extra: [
      { belief: 'Add 1/p for every item.', fix: 'The waits overlap; subtract the pairs and add back the triples.' },
      { belief: 'n items take n draws (or n² draws).', fix: `The stages shrink: n·H(n), which is ${show(nH(6))} for a die.` },
      { belief: 'The rarest item alone is the answer.', fix: 'It is a lower bound; the other items add a correction on top.' },
      { belief: 'An exact method always deserves zero width.', fix: 'Not when the arithmetic has 15 signed terms and no time to check.' },
    ] },
    { type: 'erroneous', problem: `A candidate computes the weighted collector for toys ${CH.ps.map((p) => p.toString()).join(', ')}. One step is wrong.`, steps: [
      `Singles: ${CH.rows.filter((r) => r.bits === 1).map((r) => show(r.inv)).join(' + ')} = ${CH_SINGLE.toString()}.`,
      `Pairs: ${CH.rows.filter((r) => r.bits === 2).map((r) => `1/(${r.p.toString()})`).join(' + ')} = ${show(CH.rows.filter((r) => r.bits === 2).reduce((a, r) => a.add(r.inv), Q.of(0)))}.`,
      `E = singles + pairs + triple = ${CH_SINGLE.toString()} + ${dec(CH.rows.filter((r) => r.bits === 2).reduce((a, r) => a.add(r.inv), Q.of(0)).toNumber(), 4)} + 1 = ${dec(CH_SINGLE.toNumber() + CH.rows.filter((r) => r.bits === 2).reduce((a, r) => a.add(r.inv), Q.of(0)).toNumber() + 1, 4)}.`,
      'Type a 2% band around it.',
    ], errorStep: 2, explain: `The pairs are **subtracted**: inclusion-exclusion alternates signs. E = ${CH_SINGLE.toString()} − ${dec(CH.rows.filter((r) => r.bits === 2).reduce((a, r) => a.add(r.inv), Q.of(0)).toNumber(), 4)} + 1 = ${show(CH.e)}. A sanity check catches it: the answer must sit near the rare toy's ${1 / CH.ps[2].toNumber()}, not near triple it.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: `A candidate answers ${CH_SINGLE.toString()} for the toys ${CH.ps.map((p) => p.toString()).join(', ')}. Which belief?`, right: 'Overlapping waits simply add', wrong: [['Only the rarest toy matters', `that would give ${1 / CH.ps[2].toNumber()}`], ['n items always take n draws', 'that would give 3']], explain: `${CH_SINGLE.toString()} is Σ 1/p: every box is counted once per toy it could have been. The right answer is ${show(CH.e)}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Harmonic numbers: H(4) = ${show(H(4))}, H(6) = ${show(H(6))}, H(8) = ${show(H(8))}, H(10) = ${show(H(10))}. Multiply by n. For a quick check, n(ln n + 0.577) + ½.` },
    { type: 'check', scope: 'harmonic numbers', questions: [
      { type: 'number', q: 'A fair six-sided die: expected rolls until every face has appeared?', answer: 14.7, tolerance: 0.01, explain: '6 × H(6) = 6 × 49/20 = 14.7.' },
    ] },
    { type: 'callout', tone: 'speed', text: 'Sanity bounds for the weighted case: the answer is at least 1/p_{min} and at least the uniform answer n·H(n) for the same number of items (equal weights are the fastest), and below Σ 1/p. If your result is outside, a sign slipped.' },
    { type: 'check', scope: 'sanity bounds', questions: [
      mc({ q: `Three toys with probabilities ${S3.map((p) => p.toString()).join(', ')}. Which answer is possible?`, right: show(ie(S3).e), wrong: [['4', 'equal to 1/p_{min}: that would need the other toys to cost nothing extra'], [dec(nH(3).toNumber() - 0.5, 1), `below the uniform 3·H(3) = ${show(nH(3))}, which is the fastest possible`], [S3sum.toString(), `equal to Σ 1/p = ${S3sum.toString()}: that would need the waits never to overlap`]], explain: `Exact: ${show(ie(S3).e)}, above both 1/p_{min} = 4 and ${show(nH(3))}, and below ${S3sum.toString()}.` }),
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Collect all n equally likely: n·H(n), bracket it. Weighted: Σ 1/p − Σ 1/(p + q) + Σ 1/(p + q + r) − …; sanity-check against 1/p_{min}; band about 2% (3 items) or 4% (4 items) unless double-checked.' },

    sec('contrast'),
    { type: 'compare', columns: ['Waiting for', 'Expected draws', 'Six-sided die'], rows: [
      ['one specific face', '1/p', String(6)],
      ['all faces, equal chances', 'n·H(n)', show(nH(6))],
      ['all items, unequal chances', 'Σ ±1/P(S)', 'more than n·H(n)'],
      ['a run like 66', 'overlap rule (iv/waiting-time)', String(36 + 6)],
    ] },
    { type: 'variation', base: `Base: a fair six-sided die rolled until every face appears: ${show(nH(6))} rolls.`, rows: [
      { change: 'Six faces become twelve', effect: `12·H(12) = ${show(nH(12))}: more than double, because of the H(n) factor.` },
      { change: 'Every face becomes any three different faces', effect: `Only the first three stages: 6/6 + 6/5 + 6/4 = ${show(Q.of(6, 6).add(Q.of(6, 5)).add(Q.of(6, 4)))}.` },
      { change: 'Equal chances become 1/2, 1/4, 1/8, 1/8 (four items)', effect: `${show(PRED.e)}, well above the uniform 4·H(4) = ${show(nH(4))}: the rare items dominate.` },
      { change: 'Every face becomes one specific face', effect: 'A single geometric wait: 6.' },
      { same: true, change: 'The die becomes a six-card deck, drawn with replacement', effect: `No change: six equally likely outcomes per draw, so still ${show(nH(6))}.` },
      { fusion: true, change: 'Six faces become twelve AND every face becomes any three different faces', effect: `Only the first three stages of a 12-face collection: 12/12 + 12/11 + 12/10 = ${show(Q.of(12, 12).add(Q.of(12, 11)).add(Q.of(12, 10)))}. More faces make each early stage quicker, and stopping at three cuts the long tail.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: one item takes exactly 1 draw. Two items with probabilities p and q = 1 − p take 1/p + 1/q − 1. If one probability is tiny, the answer is close to 1/p_{min} plus a small correction. With four items the signed sum has ${2 ** 4 - 1} terms: group them by size (${[1, 2, 3, 4].map((k) => ie(qs([[1, 4], [1, 4], [1, 4], [1, 4]])).rows.filter((r) => r.bits === k).length).join(', ')} sets of 1, 2, 3, 4 items) so that none is lost.` },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'Roll a fair die until a 6 and a 1 have both appeared. Expected rolls?', right: String(6 + 6 - 3), wrong: [['12', 'added the two waits: they overlap'], ['6', 'only the first of the two'], [dec(nH(2).toNumber(), 1), 'used the two-item uniform collector, but most rolls show neither face']], explain: 'max-min: 6 + 6 − (wait for either, chance 2/6, mean 3) = 9.' }),
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same ideas elsewhere: stage-by-stage geometric waits appear in Beat the Odds ("expected rolls to see k different faces"). The max-min inclusion-exclusion trick answers any "expected time until all of several independent things have happened".' },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(4, 8), q = nH(n); return ivq(`A playlist picks one of ${n} songs at random each time, repeats allowed. Expected picks until every song has played? Type the best interval.`, q.toNumber(), `Stages ${n}/${n} + … + ${n}/1 = ${show(q)}. Type ${exactEntry(q.toNumber()).text}.`); } },
      far: { type: 'number', q: 'Two servers each crash on any given day with probability 1/2, independently. Expected days until both have crashed at least once? (3 decimal places)', answer: round(2 + 2 - 4 / 3, 3), tolerance: 0.0015, explain: `max = a + b − min: each server alone waits 2 days; "either crashes" has chance 3/4 a day, so it waits 4/3. E = 2 + 2 − 4/3 = ${dec(2 + 2 - 4 / 3, 4)}.` },
      principle: mc({ q: 'Which idea carried over from toys to servers?', right: 'Rebuild a maximum from minima', wrong: [['Add the stage waits n/(n − i)', 'stages need one draw that brings one item; here each day tests both servers'], ['Add every 1/p', 'the waits overlap in time'], ['The slowest item alone', 'that is only a lower bound']], explain: 'Finishing time = the last of several first-arrival times; E[max] = Σ E[min over sets] with alternating signs.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'coupon', section: 'iv', count: 3 },
  ],
};
