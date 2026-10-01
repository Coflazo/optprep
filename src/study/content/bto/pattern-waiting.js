// Waiting for coin patterns: first-step equations on "progress" states, the overlap shortcut
// (E = Σ 2^k over self-overlaps) and Conway's odds for which pattern comes first.
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

// Conway correlation X·Y: add 2^(k−1) for each k where the last k letters of X equal the first k of Y.
const corr = (X, Y) => { let s = 0; for (let k = 1; k <= Math.min(X.length, Y.length); k++) if (X.slice(-k) === Y.slice(0, k)) s += 2 ** (k - 1); return s; };
const overlaps = (A) => Array.from({ length: A.length }, (_, i) => i + 1).filter((k) => A.slice(-k) === A.slice(0, k));
const wait = (A) => 2 * corr(A, A); // Σ 2^k over self-overlaps
const pFirst = (A, B) => Q.of(corr(B, B) - corr(B, A), corr(A, A) - corr(A, B) + corr(B, B) - corr(B, A));
const P2 = ['HH', 'HT', 'TH', 'TT'];
const P3 = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
const RACES = [['HH', 'TH'], ['HH', 'HT'], ['HHT', 'THH'], ['HTH', 'HHT'], ['TTH', 'HTT'], ['HHH', 'THH']].filter(([a, b]) => !pFirst(a, b).eq(Q.of(1, 2)));
const node = (id, label, x, y) => ({ id, label, x, y });
const dieWait = (A) => overlaps(A).reduce((a, k) => a + 6 ** k, 0); // six-letter alphabet: Σ 6^k
const HIT = Q.of(1, 3); // far transfer: a quote is hit each minute
const hitHit = Q.of(1).add(HIT).div(HIT.mul(HIT)); // E for two hits in a row: (1 + p)/p²
const ud = (A) => A.replace(/H/g, 'U').replace(/T/g, 'D');

export default {
  id: 'bto/pattern-waiting',
  book: 'bto',
  kind: 'family',
  family: 'pattern-waiting',
  title: 'Waiting for coin patterns',
  summary: 'A near miss keeps or destroys progress. First-step equations, the overlap sum Σ 2^k, and Conway odds for races.',
  prerequisites: ['bto/first-success', 'prob/first-step-markov', 'prob/expectation-linearity'],
  objectives: [
    'Set up and solve first-step equations for the expected wait for HH and HT',
    'Read off any pattern\'s expected wait from its self-overlaps: E = Σ 2^k',
    'Decide which of two patterns appears first with Conway\'s odds (BB − BA) : (AA − AB)',
    'Explain why HH takes longer than HT although both have chance 1/4 at any position',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: you flip a fair coin until you see two heads in a row (HH). What is the expected number of flips? Try two approaches, then compare with your answer for HT.', answer: `HH: ${wait('HH')} flips. HT: ${wait('HT')} flips.`, explain: 'If you answered 4 for both, you treated every pair of flips as a fresh 1/4 attempt. HH is slower because a near miss (HT) throws the progress away, while a near miss for HT (HH) keeps the last H.', attempts: [
      { id: 'fresh-pairs', label: 'Each pair a fresh 1/4 try', approach: 'Each pair of flips is HH with chance 1/4, so answered 4 flips.', breaksAt: 'Pairs overlap and are not fresh attempts: after H then T the progress is gone, while HHH holds two HH at once.' },
      { id: 'two-waits', label: 'Wait for H, then wait again', approach: 'Waited 2 flips for an H, then 2 more flips for the next H: 4.', breaksAt: 'The second H must come on the very next flip. A T in between sends you back to the start.' },
    ] },
    { type: 'text', text: 'A fair coin is flipped **until** a given pattern of consecutive flips appears (HH, HTH, HHT, …). The question asks for the **expected number of flips**, or, with two patterns, **which appears first**.' },
    { type: 'list', items: ['"A coin is flipped until two heads in a row appear. Expected number of flips?"', '"Expected flips until HTH?"', '"Flip until either HH or TH appears. Probability TH comes first?"'] },
    { type: 'text', text: 'Not this lesson: a fixed number of flips (bto/coin-sequences) and a single success (bto/first-success, which is the one-letter case of this lesson).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Flip until HTH appears: expected flips', 'Ten flips: probability that HTH appears somewhere', 'Flip until the first head: expected flips', 'Ten flips: probability of no HH'], answer: 0, traps: { 1: 'a fixed number of flips: a counting question', 2: 'a single success: bto/first-success', 3: 'a fixed-length count: bto/coin-sequences' }, explain: 'Flipping until a multi-flip pattern appears.' },
    ] },

    S('why'),
    { type: 'text', text: 'HH and HT each have chance 1/4 at any given pair of positions, yet HH takes 6 flips on average and HT only 4. This separates "chance per window" from "waiting time", which is why it is a favourite interview and assessment question. The method you learn here, writing one equation per state of progress, is also the general tool for any "expected steps until" question.' },

    S('anchor'),
    { type: 'text', text: 'Start from the one-letter case. Waiting for a single H: each flip ends the wait with 1/2 or leaves you exactly where you started. Write E for the expected flips. Spend one flip; half the time you are done, half the time you face the same wait again: E = 1 + ½ × 0 + ½ × E, so E = 2. A pattern is the same wait with **one change**: the state after a flip is not just "done" or "start"; it can be **partial progress**.' },
    { type: 'check', scope: 'E = 1 + (chance of repeating) × E', questions: [
      { make: (rng) => { const n = rng.pick([3, 4, 6, 10]); return { type: 'number', q: `Each try succeeds with 1/${n}, independently. Using E = 1 + (1 − 1/${n})E, what is the expected number of tries?`, answer: n, hints: ['Collect the E terms on one side.', `E × 1/${n} = 1.`], explain: `E(1/${n}) = 1, so E = ${n}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the progress as states. For HH: "start" (no useful progress), "H" (one head, half way), "HH" (done). A head moves you forward. A tail from "H" does not keep anything: HH cannot start with T, so you fall back to start.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Waiting for HH', nodes: [node('s', 'start', 0.05, 0.5), node('h', 'H', 0.5, 0.5), node('hh', 'HH', 0.95, 0.5)], edges: [{ from: 's', to: 'h', p: 0.5, label: 'H 1/2' }, { from: 's', to: 's', p: 0.5, label: 'T 1/2' }, { from: 'h', to: 'hh', p: 0.5, label: 'H 1/2' }, { from: 'h', to: 's', p: 0.5, label: 'T 1/2' }, { from: 'hh', to: 'hh', p: 1, label: 'done' }] }, caption: 'The dangerous arrow is H → start: a tail after one head destroys all progress. That backward arrow is why HH is slow.' },
    { type: 'check', scope: 'progress states for HH', questions: [
      { type: 'choice', q: 'Waiting for HH, you have just flipped H. You flip T. Where are you?', options: ['start', 'still at H', 'done', 'one step past start'], answer: 0, traps: { 1: 'a tail cannot be the start of HH, so nothing is kept', 2: 'HT is not HH', 3: 'there is no partial state that ends in T for HH' }, explain: 'The last flip is T and HH starts with H: no progress survives.' },
    ] },
    { type: 'text', text: 'Now HT. The states are "start", "H" and "HT". A tail from "H" finishes. The key difference: a **head** from "H" leaves you at "H", because the new H is still a valid start of HT. Progress is never lost once you have an H.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Waiting for HT', nodes: [node('s', 'start', 0.05, 0.5), node('h', 'H', 0.5, 0.5), node('ht', 'HT', 0.95, 0.5)], edges: [{ from: 's', to: 'h', p: 0.5, label: 'H 1/2' }, { from: 's', to: 's', p: 0.5, label: 'T 1/2' }, { from: 'h', to: 'ht', p: 0.5, label: 'T 1/2' }, { from: 'h', to: 'h', p: 0.5, label: 'H 1/2' }, { from: 'ht', to: 'ht', p: 1, label: 'done' }] }, caption: 'No arrow points backwards from H: a near miss (HH) keeps the last H. Same two steps of progress, no way to lose them, so HT is faster.' },
    { type: 'check', scope: 'progress states for HT', questions: [
      { type: 'choice', q: 'Why is the expected wait for HT shorter than for HH?', options: ['After an H, a wrong flip keeps HT at H but resets HH', 'HT is more likely than HH at any fixed pair of flips', 'HT needs fewer flips because it has fewer letters', 'Tails come up more often than heads on this coin'], answer: 0, traps: { 1: 'both are 1/4 at any fixed pair of positions', 2: 'both have two letters', 3: 'the coin is fair' }, explain: 'Same per-window chance, different fate after a near miss.' },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['pattern', 'self-overlaps k', 'expected flips Σ 2^k'], rows: [...P2, 'HHH', 'HHT', 'HTH', 'HTT'].map((A) => [A, overlaps(A).join(', '), overlaps(A).map((k) => `2^${k}`).join(' + ') + ` = ${wait(A)}`]) }, caption: 'A self-overlap of length k means the last k letters equal the first k letters. The full length always counts. More overlaps, longer wait: HH and HHH overlap themselves at every shift.' },
    { type: 'check', scope: 'reading self-overlaps', questions: [
      { make: (rng) => { const A = rng.pick(P3); return { type: 'number', q: `Using the overlap rule: expected flips until ${A}?`, answer: wait(A), hints: [`For each k from 1 to 3, do the last k letters of ${A} equal its first k?`, `Overlaps: ${overlaps(A).join(', ')}. Add 2^k for each.`], explain: `${overlaps(A).map((k) => `2^${k}`).join(' + ')} = ${wait(A)}.` }; } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Name one unknown per progress state. For HH: E₀ = expected flips still needed from start, E₁ = expected flips still needed when the last flip was H.', why: 'The future depends only on the useful progress so far, not on the whole history, so one number per state is enough.',
        checks: [
          { type: 'choice', q: 'Waiting for HH, you have flipped T, T, H, T, H. Which state are you in?', options: ['E₁ (last flip H)', 'E₀ (start, no progress)', 'done (HH has appeared)'], answer: 0, traps: { 1: 'the last flip is H, which is progress', 2: 'no HH has appeared' }, explain: 'Only the last flip matters for HH: it is H.' },
        ] },
      { answers: 'two-waits', say: 'From state H, spend one flip: H finishes, T sends you to start. So E₁ = 1 + ½ × 0 + ½ × E₀.', why: 'First-step analysis: pay the flip you are about to make, then average the expected remaining wait over where it lands you.',
        checks: [
          { type: 'choice', q: 'Waiting for HT, which equation holds for the state "last flip H"?', options: ['E₁ = 1 + ½ × 0 + ½ × E₁', 'E₁ = 1 + ½ × 0 + ½ × E₀', 'E₁ = ½ × E₀', 'E₁ = 1 + E₀'], answer: 0, traps: { 1: 'that is HH: for HT a head keeps you at H', 2: 'forgot to pay for the flip', 3: 'ignored the chance of finishing' }, explain: 'T finishes HT; H leaves you in the same state.' },
        ] },
      { say: 'From start: H moves you to state H, T leaves you at start. So E₀ = 1 + ½ × E₁ + ½ × E₀, which simplifies to E₀ = 2 + E₁.', why: 'Same first-step move. Multiplying by 2 and collecting E₀ gives the short form.',
        checks: [
          { type: 'number', q: 'Waiting for HT: E₁ = 1 + ½ E₁ gives E₁ = ? (then E₀ = 2 + E₁)', answer: 2, hints: ['Collect E₁: ½ E₁ = 1.'], explain: `E₁ = 2, so E₀ = 4: the HT wait is ${wait('HT')}.` },
        ] },
      { say: 'Solve for HH: E₀ = 2 + E₁ and E₁ = 1 + ½ E₀. Substitute: E₀ = 3 + ½ E₀, so E₀ = 6.', why: 'Two linear equations, two unknowns; substitution is one line.',
        checks: [
          { type: 'number', q: 'Waiting for HH: what is E₁, the expected flips still needed when the last flip was H?', answer: 1 + wait('HH') / 2, hints: ['Use E₁ = 1 + ½ E₀.', `E₀ = ${wait('HH')}.`], explain: `E₁ = 1 + ½ × ${wait('HH')} = ${1 + wait('HH') / 2}. Having one H saves only 2 flips.` },
        ] },
      { answers: 'fresh-pairs', say: 'Shortcut: the expected wait is Σ 2^k over the pattern\'s self-overlaps k (the full length always counts). HH: 2 + 4 = 6. HT: 4.', why: 'Each self-overlap is a way a failed or finished attempt doubles as the start of a new one. The equations above always sum to this; it is Conway\'s rule for a fair coin.',
          checks: [
          { make: (rng) => { const A = rng.pick(['HTH', 'HHT', 'HHH', 'THT', 'TTH']); const L = A.length; return mc(rng, `Expected flips until ${A}?`, String(wait(A)), [[String(2 ** L), 'treated each window as a fresh 1/8 attempt, ignoring overlaps'], [String(wait(A) / 2), 'added 2^(k−1) instead of 2^k'], [String(2 ** (L + 1) - 2), 'used the all-heads formula for a pattern that does not overlap itself at every shift'], [String(L * 2 ** (L - 1)), 'multiplied the length by 2^(L−1)']], `Overlaps ${overlaps(A).join(', ')}: ${overlaps(A).map((k) => `2^${k}`).join(' + ')} = ${wait(A)}.`); } },
        ] },
      { say: 'Two patterns racing: with Conway numbers X·Y (add 2^(k−1) for each k where X\'s last k letters equal Y\'s first k), the odds that A comes before B are (B·B − B·A) : (A·A − A·B).', why: 'Cross-overlaps say how much of one pattern\'s progress hands the other a head start. HH vs TH: HH·HH = 3, HH·TH = 0, TH·TH = 2, TH·HH = 1, so odds 1 : 3.',
        checks: [
          { make: (rng) => { const [A, B] = rng.pick(RACES); const v = pFirst(A, B); return mc(rng, `Flip until ${A} or ${B} appears. P(${A} first)?`, v.toString(), [['1/2', 'assumed patterns of equal length race evenly'], [Q.of(1).sub(v).toString(), `answered P(${B} first)`], [Q.of(wait(B), wait(A) + wait(B)).toString(), 'used the two waiting times as odds']], `A·A = ${corr(A, A)}, A·B = ${corr(A, B)}, B·B = ${corr(B, B)}, B·A = ${corr(B, A)}. Odds ${corr(B, B) - corr(B, A)} : ${corr(A, A) - corr(A, B)}, so ${v}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: HH and HT each have chance 1/4 in any two consecutive flips. Why does HH take longer to appear?', model: 'The long-run rate is the same, but occurrences of HH overlap and come in clumps (HHH contains two), so the gaps between clumps are longer, and the first one arrives later. In state terms: after one H, a wrong flip for HH (a tail) sends you back to start, while a wrong flip for HT (a head) keeps you one step in.', points: ['same chance per window, different waiting time', 'after a near miss HH loses its progress and HT keeps it', 'self-overlaps make occurrences clump, which delays the first'] },

    S('worked'),
    { type: 'worked', family: 'pattern-waiting', section: 'bto', difficulty: 3, seed: 'c', explainAt: [0], intro: 'One pattern, expected flips. Try it before opening the solution.' },
    { type: 'worked', family: 'pattern-waiting', section: 'bto', difficulty: 4, seed: 'e', fade: 1, intro: 'Two patterns racing. The first steps are given; the last one and the answer are yours.' },

    { type: 'thinkaloud', problem: 'A fair coin is flipped until HTH appears. What is the expected number of flips?', lines: [
      { t: 0, say: 'Flip until a three-letter pattern: overlap rule, add 2^k for every self-overlap k.' },
      { t: 3, say: 'Three letters, each window is 1/8, so 8 flips.', slip: true },
      { t: 6, say: 'Wait, that ignores overlaps. Check them: last letter H equals first letter H, so k = 1 counts. Last two TH against HT: no. k = 3 always counts.' },
      { t: 12, say: `So ${overlaps('HTH').map((k) => `2^${k}`).join(' + ')} = ${wait('HTH')}.` },
      { t: 15, say: `Sanity: a self-overlapping pattern waits longer than 2^3, never shorter. ${wait('HTH')} fits. Answer ${wait('HTH')}.` },
    ] },

    S('predict'),
    { type: 'predict', question: 'Flip until HH or TH appears. Which pattern usually wins, and with what probability?', answer: `TH, with ${pFirst('TH', 'HH')}.`, explain: 'HH can only win if the first two flips are HH. Once any T appears, the next H completes TH before HH can form.' },

    S('traps'),
    { type: 'traps', family: 'pattern-waiting', section: 'bto', extra: [
      { belief: 'Every two-letter pattern takes 4 flips, every three-letter pattern 8.', fix: 'Only patterns with no self-overlap except their full length wait 2^L. HH waits 6, HHH waits 14.' },
      { belief: 'Two patterns of the same length are equally likely to appear first.', fix: `HH against TH: TH wins ${pFirst('TH', 'HH')} of the time.` },
      { belief: 'The pattern with the shorter expected wait wins the race.', fix: 'Races depend on cross-overlaps, not only on waiting times.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out the expected number of flips until HHH. One step is wrong.', steps: [
      'At any position, the next three flips are HHH with probability 1/8.',
      'In a long string, HHH occurs about once per 8 positions on average.',
      'So the first HHH arrives after about 8 flips on average.',
      'Answer: 8.',
    ], errorStep: 2, explain: `The long-run rate is right, but occurrences overlap (HHHH holds two, HHHHH three), so they come in clumps and the first one takes longer. Self-overlaps 1, 2, 3 give 2 + 4 + 8 = ${wait('HHH')}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: 'A candidate says HTH and HTT both wait 8 flips. Which is wrong?', options: [`HTH: it overlaps itself, so it waits ${wait('HTH')}`, `HTT: it overlaps itself, so it waits ${wait('HTT') + 2}`, 'Neither: both have three letters, so both wait 8'], answer: 0, traps: { 1: `HTT has no self-overlap except its length: ${wait('HTT')} is right`, 2: 'HTH ends with its own first letter' }, explain: `HTH: 2 + 8 = ${wait('HTH')}. HTT: ${wait('HTT')}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise: HH ${wait('HH')}, HT ${wait('HT')}, HHH ${wait('HHH')}, HTH ${wait('HTH')}, HHT ${wait('HHT')}, HTT ${wait('HTT')}. A run of L heads waits 2^(L+1) − 2. A pattern with no self-overlap waits exactly 2^L.` },
    { type: 'callout', tone: 'speed', text: `Races: before computing, ask whether one pattern can only win at the very start (like HH against TH). If so, the answer is 1/2^L for it. Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds a question; overlap reading takes 15, Conway odds about 45.` },
    { type: 'check', scope: 'the memorised waits and the "only at the start" race', questions: [
      { type: 'choice', q: 'Flip until HHH or THH appears. P(HHH first)?', options: [Q.of(1, 8).toString(), '1/2', Q.of(7, 8).toString(), Q.of(1, 4).toString()], answer: 0, traps: { 1: 'equal lengths do not race evenly', 2: 'answered THH', 3: 'used a two-flip start' }, explain: 'Once any T appears, the first HH after it completes THH. HHH wins only if the first three flips are HHH: 1/8.' },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Wait for a pattern → Σ 2^k over self-overlaps (HH 6, HT 4, HHH 14). Race A vs B → odds (B·B − B·A) : (A·A − A·B). Unsure → one first-step equation per progress state.' },

    S('contrast'),
    { type: 'compare', columns: ['Question about HH', 'Depends on', 'Value'], rows: [
      ['chance the next two flips are HH', 'the pattern only', '1/4'],
      ['expected flips until HH', 'self-overlaps', String(wait('HH'))],
      ['HH before TH?', 'cross-overlaps', pFirst('HH', 'TH').toString()],
      ['HH somewhere in n fixed flips', 'counting strings (no-HH recursion)', 'see bto/coin-sequences'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a one-letter pattern is the first-success wait, 2 flips. A pattern cannot race itself. If one pattern contains the other (HH inside HHT), the shorter always comes first or at the same time.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: with a die, replace 2 by 6. Two sixes in a row overlap at k = 1 and k = 2, so the expected wait is 6 + 36 = 42 throws. The state equations are the general tool for any "expected steps until" question: random walks, gambler\'s ruin, polygon walks.' },
    { type: 'check', scope: 'the transfer to dice', questions: [
      { type: 'choice', q: 'A die is thrown until a 1 is immediately followed by a 2. Expected throws?', options: ['36', '42', '12', '6'], answer: 0, traps: { 1: '"1 then 2" does not overlap itself, unlike "6 then 6"', 2: 'added 6 per letter', 3: 'waited for one letter only' }, explain: 'Only the full-length overlap: 6² = 36.' },
    ] },

    { type: 'variation', base: `Fair coin, flip until HH. Expected flips = ${wait('HH')}.`, rows: [
      { change: 'Wait for TT instead', effect: `No change: swapping H and T maps every string to one just as likely, and TT overlaps itself exactly like HH. ${wait('TT')} flips.`, same: true },
      { change: 'Wait for HT', effect: `Only the full-length overlap: ${wait('HT')}. A near miss (HH) keeps the last H.` },
      { change: 'Wait for HHH', effect: `Overlaps at 1, 2 and 3: ${overlaps('HHH').map((k) => `2^${k}`).join(' + ')} = ${wait('HHH')}.` },
      { change: 'Ask for P(the next two flips are HH)', effect: 'A per-window chance, 1/4, not a waiting time. Overlaps do not enter at all.' },
      { change: 'A die, waiting for "1 then 2"', effect: `Two changes: the die turns each 2^k into 6^k, and "1 then 2" overlaps itself only at full length, so the 6^1 term disappears: ${dieWait('12')} throws, against ${dieWait('66')} for "6 then 6".`, fusion: true },
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const A = rng.pick(['HTH', 'HHT', 'HHH', 'THT', 'TTH']); const L = A.length; return mc(rng, `A signal goes up (U) or down (D) each minute, each with probability 1/2, independently. Expected minutes until ${ud(A)} first appears?`, String(wait(A)), [[String(2 ** L), 'treated each window as a fresh 1/8 attempt'], [String(wait(A) / 2), 'added 2^(k−1) instead of 2^k'], [String(L * 2 ** (L - 1)), 'multiplied the length by 2^(L−1)']], `U and D are H and T. Overlaps ${overlaps(A).join(', ')}: ${wait(A)}.`); } },
      far: { type: 'choice', q: `Each minute a quote is hit with probability ${HIT}, independently. Expected minutes until it is hit in two consecutive minutes?`, options: [hitHit.toString(), Q.of(1).div(HIT.mul(HIT)).toString(), String(wait('HH')), Q.of(1).div(HIT).toString()], answer: 0, traps: { 1: 'treated each pair of minutes as a fresh 1/9 attempt', 2: 'used the fair-coin answer; the chance per minute is 1/3', 3: 'waited for a single hit' }, explain: `States as for HH: E₁ = 1 + (1 − p)E₀ and E₀ = 1/p + E₁. With p = ${HIT}: E₀ = ${hitHit}.` },
      principle: { type: 'choice', q: 'Which idea carried over from coin patterns to signals and quotes?', options: ['A near miss can reset progress: track the progress states', 'Every window is a fresh attempt at the pattern\'s chance', 'Patterns of the same length take the same time', 'The wait is two to the power of the length'], answer: 0, traps: { 1: 'windows overlap and share flips', 2: 'HH waits 6 while HT waits 4', 3: 'true only for patterns with no self-overlap' }, explain: 'The wait depends on what survives a near miss; one first-step equation per progress state captures it.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'pattern-waiting', section: 'bto', count: 3 },
  ],
};
