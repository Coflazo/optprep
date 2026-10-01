// Intervals: expected waiting time for a run (HTH, two sixes in a row) by the overlap rule
// E = Σ 1/P(prefix) over prefixes that are also suffixes, derived with the fair-casino argument.
import { Q } from '../../../core/rational.js';
import { sec, dec, round, mc, ivq, exactEntry } from './scoring-and-width.js';

const overlaps = (w) => { const out = []; for (let k = 1; k <= w.length; k++) if (w.slice(0, k) === w.slice(w.length - k)) out.push(w.slice(0, k)); return out; };
const Pw = (w, p) => [...w].reduce((a, c) => a.mul(p(c)), Q.of(1));
const wait = (w, p) => overlaps(w).reduce((a, u) => a.add(Q.of(1).div(Pw(u, p))), Q.of(0));
const fair = (c) => Q.of(1, 2), die = () => Q.of(1, 6);
const biased = (ph) => (c) => (c === 'H' ? ph : Q.of(1).sub(ph));
const terms = (w, p) => overlaps(w).map((u) => Q.of(1).div(Pw(u, p)).toString()).join(' + ');
// 'a + b = total', or just 'total' when there is a single term.
const sumText = (w, p) => (overlaps(w).length > 1 ? `${terms(w, p)} = ${wait(w, p).toString()}` : wait(w, p).toString());
const THREE = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
const TAB = 'HTHT';
const COIN = ['HH', 'HT', 'HHH', 'HTH', 'HHT', 'HTT', 'HHHH', 'HTHT', 'HHTT', 'THTH', 'HTHH'];
const DICE = [['66', 'two sixes in a row'], ['61', 'a six then a one'], ['666', 'three sixes in a row'], ['616', 'six, one, six'], ['6666', 'four sixes in a row'], ['1234', 'one, two, three, four']];

const geoQ = (rng) => { const [w, p, name] = rng.pick([['H', Q.of(1, 2), 'head with a fair coin'], ['6', Q.of(1, 6), 'six with a fair die'], ['H', Q.of(1, 3), 'head when P(heads) = 1/3'], ['T', Q.of(3, 4), 'tail when P(tails) = 3/4']]); return { type: 'number', q: `Expected number of tries until the first ${name}?`, answer: Q.of(1).div(p).toNumber(), tolerance: 1e-9, explain: `1 ÷ ${p.toString()} = ${Q.of(1).div(p).toString()}.` }; };
const stakeQ = (rng) => {
  const [w, p, what] = rng.pick([['HT', fair, 'H then T with a fair coin'], ['HHT', fair, 'H, H, T with a fair coin'], ['61', die, 'a six then a one'], ['66', die, 'six then six'], ['HT', biased(Q.of(1, 3)), 'H then T with P(heads) = 1/3']]);
  const v = Q.of(1).div(Pw(w, p));
  return { type: 'number', q: `A gambler starts with 1 and bets everything at fair odds on each letter of ${what}, in order. If every bet wins, how much does he hold at the end?`, answer: v.toNumber(), tolerance: 1e-9, hints: ['A fair bet on an event of probability p multiplies the stake by 1/p.', 'Multiply the factors letter by letter.'], explain: `1 ÷ P(${w}) = 1 ÷ ${Pw(w, p).toString()} = ${v.toString()}.` };
};
const overlapQ = (rng) => {
  const w = rng.pick(['HTH', 'HHT', 'HTHT', 'HHH', 'THTH', 'HTHH', '616', '666', '1234', 'HTTH']);
  const ov = overlaps(w);
  const right = ov.join(', ');
  const all = Array.from({ length: w.length }, (_, k) => w.slice(0, k + 1)).join(', ');
  const whole = w;
  return { hinge: true, ...mc({ q: `Which prefixes of ${w} are also suffixes of it?`, right, wrong: [
    [all, 'listed every prefix: only those that also end the pattern count'],
    ...(ov.length > 1 ? [[whole, 'kept only the whole pattern: it overlaps itself'], [ov.slice(0, -1).join(', ') || 'none', 'forgot the whole pattern, which always counts']] : [[`${w[0]}, ${w}`, `assumed the first letter always counts: here it does not end the pattern`], ['none', 'forgot the whole pattern, which always counts']])],
    explain: `Slide ${w} over itself: ${ov.map((u) => `"${u}" starts and ends it`).join('; ')}.` }, rng) };
};
const coinQ = (rng) => { const w = rng.pick(COIN), e = wait(w, fair); return ivq(`A fair coin is tossed until ${w} first appears. Type the best interval for the expected number of tosses.`, e.toNumber(), `Overlaps of ${w}: ${overlaps(w).join(', ')}. E = ${sumText(w, fair)}. Type ${exactEntry(e.toNumber()).text}.`, ['List the prefixes that are also suffixes, including the whole pattern.', 'Add 2^{k} for each overlap of length k.']); };
const diceQ = (rng) => { const [w, d] = rng.pick(DICE), e = wait(w, die); return { type: 'number', q: `A fair die is rolled until ${d} first appears (${w}). Expected number of rolls?`, answer: e.toNumber(), hints: ['Which prefixes are also suffixes?', 'Add 6^{k} for each overlap of length k.'], explain: `Overlaps ${overlaps(w).join(', ')}: ${sumText(w, die)}.` }; };
const biasQ = (rng) => { const ph = rng.pick([Q.of(1, 3), Q.of(2, 3), Q.of(1, 4)]), w = rng.pick(['HH', 'HT', 'HTH', 'HHT', 'THH']), p = biased(ph), e = wait(w, p); return ivq(`A biased coin with P(heads) = ${ph.toString()} is tossed until ${w} appears. Type the best interval for the expected number of tosses.`, e.toNumber(), `Overlaps ${overlaps(w).join(', ')}: ${overlaps(w).map((u) => `1/P(${u})`).join(' + ')} = ${sumText(w, p)}${e.d === 1n ? '' : ` = ${dec(e.toNumber(), 4)}${exactEntry(e.toNumber()).point ? '' : '…'}`}. Type ${exactEntry(e.toNumber()).text}.`, ['Same overlaps as for a fair coin; only the probabilities change.', 'P(prefix) is the product of its letters\' probabilities.']); };

export default {
  id: 'iv/waiting-time',
  book: 'iv',
  kind: 'family',
  family: 'waiting-time',
  title: 'Expected waiting times for patterns',
  summary: 'Waiting for a run: add 1/P(prefix) over every prefix that is also a suffix. Overlap makes a pattern slower; exact, so a point or a bracket.',
  prerequisites: ['iv/scoring-and-width', 'bto/pattern-waiting'],
  objectives: [
    'List the prefixes of a pattern that are also suffixes in under ten seconds',
    'Compute E[wait] = Σ 1/P(prefix) for fair coins, biased coins and dice',
    'Explain the rule with the fair-casino argument',
    'Type the exact answer as a point or a tight bracket',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', attempts: [
      { id: 'inverse', label: 'Used 1/P(pattern) for both', approach: 'Took 1 ÷ (1/4) = 4 tosses for HH and for HT.', breaksAt: 'That is only the whole-pattern term; every self-overlap adds its own 1/P(prefix).' },
      { id: 'double', label: 'Added two one-letter waits', approach: 'A head takes 2 tosses, so two letters take 2 + 2 = 4.', breaksAt: 'Letters in a row are not separate waits: a failed second letter can wipe out the first.' },
    ], q: 'Before any teaching: a fair coin is tossed until HH appears (two heads in a row), and separately until HT appears. Which takes longer on average, and how long is each? Two approaches.', answer: `HH: ${wait('HH', fair).toString()} tosses. HT: ${wait('HT', fair).toString()} tosses.`,
      explain: 'Both patterns have probability 1/4 at any given position, yet HH is slower. After H then T, an HH hunt restarts from zero; after H then H, an HT hunt is still one step away. The lesson turns that difference into one formula.' },
    { type: 'text', text: 'The cue: a coin or die is tossed **until a run** (a specific sequence in consecutive tosses) first appears, and the question asks for the expected number of tosses. Coins may be biased; dice patterns look like "two sixes in a row" or "a six followed by a one".' },
    { type: 'list', items: ['"A fair coin is tossed until HTH first appears. Expected number of tosses?"', '"A biased coin with P(heads) = 1/3 is tossed until HH appears. Expected tosses?"', '"A fair die is rolled until two sixes appear in a row. Expected rolls?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question is a pattern-waiting question?', right: 'Roll a die until 6 then 1 appear in consecutive rolls: expected rolls', wrong: [['Roll a die until every face has appeared: expected rolls', 'collect-them-all: the coupon family'], ['Roll a die until a 6 appears: expected rolls', 'one letter: a plain geometric wait'], ['Toss a coin 10 times: probability of HH somewhere', 'a probability over a fixed number of tosses, not a waiting time']], explain: 'A run in consecutive rolls, and the expected wait for it.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'These answers are exact integers or short fractions, so they are full points once you know the overlap rule, and zeros if you trust the tempting 1/P(pattern). The same rule settles Beat the Odds questions about which pattern comes first.' },

    sec('anchor'),
    { type: 'text', text: 'You know two facts. One letter of probability p takes 1/p tries. And from Beat the Odds, fair-coin patterns take Σ 2^{k} over their overlaps (HH = 2 + 4). This lesson makes **one change**: letters can have any probability (a die face, a biased coin), and the 2^{k} becomes 1/P(prefix).' },
    { type: 'check', scope: 'the one-letter wait', questions: [{ make: geoQ }] },

    sec('picture'),
    { type: 'text', text: 'Picture the hunt for HH as a machine that remembers how much of the pattern you currently hold. From "start", a head moves you to "H"; a tail keeps you at start. From "H", a head finishes; a tail throws you back to start.' },
    { type: 'diagram', diagram: 'graph', spec: { title: 'Hunting for HH (fair coin)', markov: true, nodes: [{ id: 's', label: 'start', x: 0.1, y: 0.5 }, { id: 'h', label: 'H', x: 0.5, y: 0.5 }, { id: 'hh', label: 'HH', x: 0.9, y: 0.5 }], edges: [{ from: 's', to: 's', p: 0.5, label: 'T 1/2' }, { from: 's', to: 'h', p: 0.5, label: 'H 1/2' }, { from: 'h', to: 'hh', p: 0.5, label: 'H 1/2' }, { from: 'h', to: 's', p: 0.5, label: 'T 1/2' }, { from: 'hh', to: 'hh', p: 1, label: 'done' }] }, caption: `A tail from "H" sends you all the way back: that is why HH takes ${wait('HH', fair).toString()} tosses. For HT, a head from "H" keeps you at "H" (the new H is a fresh start), so no progress is ever lost: ${wait('HT', fair).toString()} tosses.` },
    { type: 'check', scope: 'reading the machine', questions: [
      mc({ q: 'Hunting HTH, you hold "HT" and toss H. Where are you?', right: 'Done: HTH is complete', wrong: [['Back at start, all progress lost', 'the last three tosses are H, T, H: the pattern'], ['At "H", one letter of progress', 'that is where you would be after HTH if you kept hunting for another copy']], explain: 'HT + H = HTH, the whole pattern.' }),
      mc({ q: 'Hunting HTH, you hold "HT" and toss T. Where are you?', right: 'Back at start', wrong: [['At "H"', 'the last tosses are T, T: no H to keep'], ['At "HT"', 'the new T breaks the run']], explain: 'H, T, T: no suffix of that is a prefix of HTH, so all progress is lost.' }),
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Expected tosses for every 3-letter pattern (fair coin)', xLabel: 'pattern', yLabel: 'expected tosses', categories: THREE, series: [{ name: 'E', values: THREE.map((w) => wait(w, fair).toNumber()) }], valueLabels: true }, caption: `All eight patterns have probability 1/8 at any position, yet the waits range from ${Math.min(...THREE.map((w) => wait(w, fair).toNumber()))} to ${Math.max(...THREE.map((w) => wait(w, fair).toNumber()))}. The patterns that overlap themselves (HHH, HTH and their mirrors) are the slow ones.` },
    { type: 'check', scope: 'overlap makes it slower', questions: [
      mc({ q: 'Fair coin. Which of these patterns takes longest to appear?', right: 'THT', wrong: [['THH', `no overlap: ${wait('THH', fair).toString()}`], ['TTH', `no overlap: ${wait('TTH', fair).toString()}`], ['HTT', `no overlap: ${wait('HTT', fair).toString()}`]], explain: `THT overlaps itself (T starts and ends it): ${terms('THT', fair)} = ${wait('THT', fair).toString()}.` }),
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['k', 'first k letters', 'last k letters', 'match?', 'adds 1/P'], rows: Array.from({ length: TAB.length }, (_, i) => { const k = i + 1, a = TAB.slice(0, k), b = TAB.slice(TAB.length - k), m = a === b; return [String(k), a, b, m ? 'yes' : 'no', m ? Q.of(1).div(Pw(a, fair)).toString() : '']; }).concat([['', '', '', 'total', wait(TAB, fair).toString()]]) }, caption: `The overlap table for ${TAB}: compare the first k letters with the last k. Matches at k = ${overlaps(TAB).map((u) => u.length).join(' and ')} add ${terms(TAB, fair)} = ${wait(TAB, fair).toString()}.` },
    { type: 'check', scope: 'the overlap table', questions: [{ make: overlapQ }] },

    sec('derivation'),
    { type: 'text', text: 'The overlap rule looks like a trick until you see where it comes from. The casino argument below derives it in a few moves, and nowhere does it need the letters to be equally likely: that is why the same rule covers dice and biased coins.' },
    { type: 'steps', steps: [
      { say: 'Imagine a casino. Before every toss a new gambler arrives with 1 and bets it, at fair odds, that the toss is the pattern\'s first letter. If he wins, he bets everything on the second letter, and so on. He leaves at his first loss.', why: 'Fair odds on an event of probability p pay 1/p per unit staked, so a winner\'s stake multiplies by 1/p each time.',
        checks: [{ make: stakeQ }] },
      { say: 'Every bet is fair, so on average the casino neither gains nor loses. It takes in 1 per toss, so it takes in T in total: E[T] = E[what the gamblers hold when the pattern first completes].', why: 'A fair game stays fair when you stop it at a sensible time: expected money in equals expected money out.',
        checks: [mc({ q: 'Why does the casino take in exactly T units?', right: 'One gambler with 1 unit arrives per toss', wrong: [['Each gambler who leaves has lost 1 unit', 'the gamblers still alive at the end have not lost'], ['The pattern has T letters, one per unit', 'T is the number of tosses, not the pattern length']], explain: 'Money in counts arrivals: one per toss.' })] },
      { answers: 'double', say: 'When the pattern completes, who is still alive? The gambler who started at the pattern\'s first letter holds 1/P(pattern). A gambler who started k tosses before the end is alive only if those k tosses spell the first k letters: a prefix that is also a suffix.', why: 'Everyone else has already lost a bet and left with nothing.',
        checks: [{ make: overlapQ }] },
      { answers: 'inverse', say: 'So E[T] = Σ 1/P(prefix) over every prefix that is also a suffix, the whole pattern included.', why: 'Add up the holdings of the surviving gamblers.',
        checks: [{ make: coinQ }] },
      { say: 'The same rule covers dice and biased coins: only P(prefix) changes. Two sixes in a row: overlaps 6 and 66, so 6 + 36.', why: 'Nothing in the argument used fairness of the coin, only fair betting odds.',
        checks: [{ make: diceQ }] },
      { say: 'Type it: the answer is an exact fraction. Terminating: a point. Repeating (biased coins can give thirds): a 4-significant-figure bracket.', why: 'Exact answers get zero width.',
        checks: [{ make: biasQ }] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does HH take longer than HT, even though both have probability 1/4 at any position?', model: 'Both patterns complete equally often in the long run, but HH occurrences clump: HHH contains two overlapping copies. Clumped occurrences mean longer gaps between clumps, so the first one arrives later. In the casino picture, when HH completes, two gamblers are alive (the one who started at the first H holds 4, the one who just started holds 2), so E = 4 + 2 = 6; for HT only one gambler survives, holding 4.', points: ['Same frequency, but overlapping patterns clump together', 'The casino argument counts surviving gamblers at the finish', 'Each overlap (prefix = suffix) adds 1/P(prefix) to the wait'] },

    sec('worked'),
    { type: 'worked', explainAt: [0], family: 'waiting-time', section: 'iv', difficulty: 2, seed: 'a', intro: 'A fair-coin pattern. List the overlaps, add, then decide what to type.' },
    { type: 'worked', family: 'waiting-time', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'A dice pattern or a biased coin. The overlaps and sum are given; the interval is yours.' },
    { type: 'thinkaloud', problem: `A fair coin is tossed until ${TAB} first appears. What is the expected number of tosses?`, lines: [
      { t: 0, say: 'I see a run in consecutive tosses: overlap rule. Exact answer, zero width.' },
      { t: 4, say: `It repeats HT, so every prefix overlaps: 2 + 4 + 8 + 16 = ${2 + 4 + 8 + 16}.`, slip: true },
      { t: 8, say: `No, check each k. k = 1: starts ${TAB[0]}, ends ${TAB[TAB.length - 1]}: no. k = 2: ${TAB.slice(0, 2)} against ${TAB.slice(-2)}: yes.` },
      { t: 14, say: `k = 3: ${TAB.slice(0, 3)} against ${TAB.slice(-3)}: no. k = 4 is the whole pattern: yes.` },
      { t: 19, say: `E = 2^{2} + 2^{4} = ${wait(TAB, fair).toString()}. Check: at least 2^{4} = 16, and it overlaps, so a bit more. Fine.` },
      { t: 24, say: `I type [${wait(TAB, fair).toString()}, ${wait(TAB, fair).toString()}].` },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Fair die: which comes sooner on average, two sixes in a row (66) or a six followed by a one (61)? By how many rolls?', answer: `61 is sooner: ${wait('61', die).toString()} rolls against ${wait('66', die).toString()} for 66, a difference of ${wait('66', die).sub(wait('61', die)).toString()}.`, explain: '66 overlaps itself (the second 6 can start a new attempt), which adds 1/P(6) = 6.' },

    sec('traps'),
    { type: 'traps', family: 'waiting-time', section: 'iv', extra: [
      { belief: 'The wait is always 1/P(pattern).', fix: 'Only for patterns that do not overlap themselves. Each overlap adds 1/P(prefix).' },
      { belief: 'Every prefix adds a term.', fix: 'Only prefixes that are also suffixes. HHT has none apart from itself.' },
      { belief: 'Use 2^{k} for a biased coin.', fix: '2^{k} is 1/P(prefix) only when heads and tails are 1/2. Otherwise multiply the actual letter probabilities.' },
      { belief: 'Overlap means the pattern contains a repeated letter.', fix: 'HTT repeats T but does not overlap itself: its start (H) never ends it.' },
    ] },
    { type: 'erroneous', problem: 'A candidate computes the expected rolls until two sixes in a row. One step is wrong.', steps: [
      `P(66) at a given position is 1/36.`,
      '66 has no overlap with itself, so no correction is needed.',
      `E = 1/P(66) = ${Q.of(36).toString()}.`,
      `Type [36, 36].`,
    ], errorStep: 1, explain: `The single 6 is a prefix and a suffix of 66, so it overlaps itself. E = ${terms('66', die)} = ${wait('66', die).toString()}: type [${wait('66', die).toString()}, ${wait('66', die).toString()}].` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate answers 8 for "fair coin until HTH". Which belief?', right: 'The wait is always 1/P(pattern)', wrong: [['Every prefix adds a term', `that would give 2 + 4 + 8 = ${2 + 4 + 8}`], ['Use 2^{k} for a biased coin', 'the coin here is fair']], explain: `HTH overlaps itself at H: ${terms('HTH', fair)} = ${wait('HTH', fair).toString()}.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Fair coin: E = Σ 2^{k} over overlap lengths k. Fair die: Σ 6^{k}. So with a fair coin, a length-n pattern that overlaps only as a whole takes 2^{n}; a run of n equal letters takes 2 + 4 + … + 2^{n} = 2^{n+1} − 2.' },
    { type: 'callout', tone: 'speed', text: 'Finding overlaps fast: check whether the last letter equals the first, then whether the last two equal the first two, and so on. Most patterns fail at k = 1, which settles them at once.' },
    { type: 'check', scope: 'the fast forms', questions: [
      { make: (rng) => { const n = rng.int(2, 6); const w = 'H'.repeat(n); return { type: 'number', q: `Fair coin: expected tosses until ${n} heads in a row?`, answer: 2 ** (n + 1) - 2, hints: ['Every prefix of a run of heads is also a suffix.', `2 + 4 + … + 2^{${n}}.`], explain: `${terms(w, fair)} = ${2 ** (n + 1) - 2} = 2^{${n + 1}} − 2.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Run of letters → list prefixes that are also suffixes (whole pattern included) → E = Σ 1/P(prefix) (fair coin: Σ 2^{k}; die: Σ 6^{k}) → exact: point or bracket.' },

    sec('contrast'),
    { type: 'compare', columns: ['Waiting for', 'Rule', 'Example'], rows: [
      ['one letter', '1/p', `a six: ${Q.of(1).div(Q.of(1, 6)).toString()}`],
      ['a run with no self-overlap', '1/P(pattern)', `HT: ${wait('HT', fair).toString()}; 61: ${wait('61', die).toString()}`],
      ['a run that overlaps itself', 'Σ 1/P(prefix = suffix)', `HH: ${wait('HH', fair).toString()}; 66: ${wait('66', die).toString()}`],
      ['every face at least once', 'n·H(n) (iv/coupon)', 'six faces: 14.7'],
    ] },
    { type: 'variation', base: `Base: a fair coin until HT: ${wait('HT', fair).toString()} tosses.`, rows: [
      { change: 'HT becomes HH', effect: `${sumText('HH', fair)}: the single H now overlaps, adding 2.` },
      { change: 'HT becomes HTH (one letter longer)', effect: `${sumText('HTH', fair)}: the H at both ends overlaps.` },
      { change: 'The fair coin becomes P(heads) = 1/3', effect: `HT still has no overlap: 1/P(HT) = ${wait('HT', biased(Q.of(1, 3))).toString()}.` },
      { fusion: true, change: 'P(heads) = 1/3 AND HT becomes HH', effect: `${sumText('HH', biased(Q.of(1, 3)))}: the new overlap adds 1/P(H), and the rarer head makes every term bigger.` },
      { same: true, change: 'HT becomes TH', effect: `No change: TH does not overlap itself either, so it is still ${wait('TH', fair).toString()}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a one-letter pattern is the plain geometric wait. A biased coin changes the numbers but not the overlaps: HH with P(heads) = 1/3 takes ${terms('HH', biased(Q.of(1, 3)))} = ${wait('HH', biased(Q.of(1, 3))).toString()}. The probability of a pattern at one position says nothing about how long you wait for it.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: the casino argument also gives Conway\'s odds for which of two patterns comes first (Beat the Odds, pattern races), and the "how much progress survives" machine is the first-step method for any process that runs until something happens.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [{ make: biasQ }] },
    { type: 'transfer',
      near: { make: (rng) => { const [w, ph] = rng.pick([['THT', Q.of(1, 2)], ['HHT', Q.of(1, 3)], ['TT', Q.of(2, 3)], ['HTH', Q.of(1, 3)]]); const p = biased(ph), e = wait(w, p); return { type: 'number', q: `A coin with P(heads) = ${ph.toString()} is tossed until ${w} appears. Expected tosses? (2 decimal places)`, answer: round(e.toNumber(), 2), tolerance: 0.006, explain: `Overlaps ${overlaps(w).join(', ')}: ${sumText(w, p)}${e.d === 1n ? '' : ` ≈ ${dec(e.toNumber(), 3)}`}.` }; } },
      far: { type: 'number', q: 'A trading signal fires in each minute with probability 1/10, independently. Expected minutes until it fires in two consecutive minutes?', answer: 10 + 100, explain: 'The pattern "fire, fire" overlaps itself at one fire: 1/(1/10) + 1/(1/100) = 10 + 100 = 110.' },
      principle: mc({ q: 'Which idea carried over from coins to the trading signal?', right: 'Add 1/P(prefix) for each self-overlap', wrong: [['Wait 1/P(pattern) and nothing more', 'forgets the overlap, giving 100'], ['Add 1/P for every prefix', 'only prefixes that are also suffixes count'], ['Collect all outcomes: n·H(n)', 'nothing is being collected']], explain: 'A run of two fires overlaps itself exactly like HH, so the same overlap sum applies.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'waiting-time', section: 'iv', count: 3 },
  ],
};
