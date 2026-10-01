// Zap-N game lesson: CodeCompare (visual precision under a shrinking deadline). Round counts,
// deadlines, code lengths and the look-alike table come from src/zapn/codecompare/engine.js.
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { DEFAULTS, LOOKALIKE, allowanceMs, lengthAt, editCount, generateRound } from '../../../zapn/codecompare/engine.js';
import { sec, mc, pct, dec } from './balloon.js';

const { rounds: R, options: OPTS } = DEFAULTS;
const TARGET = ZAPN_TARGETS.codecompare.value;
const BUDGET = Math.floor(R * (1 - TARGET) + 1e-9);
const diffAt = (a, b) => [...a].map((c, i) => (c === b[i] ? -1 : i)).filter((i) => i >= 0);
// What makes b differ from the target a, in words (positions counted from 1).
export function describe(a, b) {
  const d = diffAt(a, b), parts = [];
  for (let k = 0; k < d.length; k++) {
    const i = d[k];
    if (d[k + 1] === i + 1 && a[i] === b[i + 1] && a[i + 1] === b[i]) { parts.push(`positions ${i + 1}-${i + 2} swapped, ${a[i]}${a[i + 1]} became ${b[i]}${b[i + 1]}`); k++; }
    else parts.push(`position ${i + 1}: ${a[i]} became ${b[i]}`);
  }
  return parts.join('; ');
}
const chunks = (s, k = 3) => s.match(new RegExp(`.{1,${k}}`, 'g'));
const code = (s) => `\`${s}\``;
const secs = (ms) => dec(ms / 1000, 2);

// Challenge / picture round (engine-generated, stored as data; the diagram validator re-checks every mark).
const C = { target: '11VAXL7', options: ['11VAX17', '11VAXL7', '11VXAL7', 'L1VAXL1'] };
C.answer = C.options.indexOf(C.target);
// Worked round.
const Wk = { target: 'G8OAOL5N4', options: ['8GOAOL5N4', 'G80AOL5M4', 'G8OAOL5N4', 'G8OAOL5NA'] };
Wk.answer = Wk.options.indexOf(Wk.target);
const survivesChunk = (t, o, j) => chunks(o)[j] === chunks(t)[j];
const wAfter1 = Wk.options.map((o, i) => i).filter((i) => survivesChunk(Wk.target, Wk.options[i], 0));
const wAfter2 = wAfter1.filter((i) => survivesChunk(Wk.target, Wk.options[i], 1));
const pairDiff = diffAt(Wk.options[wAfter2[0]], Wk.options[wAfter2[1]]);
// Think-aloud round (engine-generated, round 16), with its elimination computed chunk by chunk.
const TK = { i: 15, target: 'OMLHY2XDM', options: ['OMIHY2XDM', 'OMLHY2XDM', 'OMLHY2XMD', 'OMLNY2XDM'] };
TK.lines = (() => {
  const out = [{ t: 0, say: `Target ${chunks(TK.target).join(' ')}: ${chunks(TK.target).length} chunks. One chunk at a time, across all four.` }];
  let alive = TK.options.map((_, i) => i), t = 0;
  chunks(TK.target).forEach((c, j) => {
    t = Math.round((t + 0.8) * 10) / 10;
    const out1 = alive.filter((i) => !survivesChunk(TK.target, TK.options[i], j));
    alive = alive.filter((i) => !out1.includes(i));
    const head = j === 2 ? 'No, finish the pass first. ' : '';
    out.push({ t, say: `${head}Chunk ${j + 1}, ${c}: ${out1.length ? out1.map((i) => `candidate ${i + 1} has ${chunks(TK.options[i])[j]} (${describe(c, chunks(TK.options[i])[j])}), out`).join('; ') : 'everyone matches'}.` });
    if (j === 1) { const decoy = alive.find((i) => TK.options[i] !== TK.target); t = Math.round((t + 0.3) * 10) / 10; out.push({ t, say: `Candidate ${decoy + 1} matches so far and looks right: press ${decoy + 1}.`, slip: true }); }
  });
  const left = Math.round((allowanceMs(TK.i) / 1000 - t - 0.3) * 10) / 10;
  out.push({ t: Math.round((t + 0.3) * 10) / 10, say: `Only candidate ${alive[0] + 1} is left, so I press ${alive[0] + 1} without re-reading it: about ${left} s to spare.` });
  return out;
})();
const PAIRS = ['O', 'I', 'S', 'B', 'Z', 'G'].map((c) => `${c}/${LOOKALIKE[c].split('').join('/')}`);

const identicalQ = (rng) => {
  const i = rng.int(0, R - 1), r = generateRound(rng, i);
  const wrong = r.options.filter((o) => o !== r.target).map((o) => [code(o), `missed a difference: ${describe(r.target, o)}`]);
  return mc({ q: `Round ${i + 1}. Target ${code(r.target)}. Which candidate is identical?`, right: code(r.target), wrong, explain: `The other three: ${r.options.filter((o) => o !== r.target).map((o) => `${o} (${describe(r.target, o)})`).join('; ')}.` }, rng);
};
const oneEditQ = (rng) => {
  const r = generateRound(rng, rng.int(0, R - 1));
  const o = rng.pick(r.options.filter((x) => x !== r.target));
  const n = diffAt(r.target, o).length;
  return { type: 'number', q: `Target ${code(r.target)}, candidate ${code(o)}. In how many positions do they differ?`, answer: n, hints: ['Compare character by character, not by overall shape.', 'A swap of two neighbours changes two positions.'], explain: `${describe(r.target, o)}: ${n} position${n > 1 ? 's' : ''}.` };
};

export default {
  id: 'zapn/codecompare',
  book: 'zapn',
  kind: 'game',
  game: 'codecompare',
  title: 'CodeCompare: eliminate by chunks',
  summary: 'Read codes in chunks of 3, cross out candidates chunk by chunk, compare the last two survivors with each other, and never let the clock run out.',
  prerequisites: [],
  objectives: [
    'Name the two kinds of difference the distractors use: a look-alike swap and a swap of two neighbours',
    'Split a code into chunks of 3 and eliminate candidates chunk by chunk across all four',
    'Resolve two survivors by comparing them with each other',
    `Hit the target: ${pct(TARGET)} accuracy, at most ${BUDGET} errors in ${R} rounds`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. Target ${code(C.target)}. Candidates: ${C.options.map((o, i) => `${i + 1}) ${code(o)}`).join('  ')}. Exactly one is identical. Which, and how did you check it? Find two different methods.`, answer: `Candidate ${C.answer + 1}, ${code(C.target)}.`, explain: `The others: ${C.options.filter((o) => o !== C.target).map((o) => `${o} (${describe(C.target, o)})`).join('; ')}. If you read the codes as shapes, the L/1 swap and the neighbour swap are easy to miss; the lesson replaces shape-reading with elimination.`,
      attempts: [
        { id: 'shape', label: 'Compare the overall look', approach: 'Glanced at each candidate and picked the one that looked the same.', breaksAt: 'Look-alike swaps and neighbour swaps keep the overall shape, so a glance passes them.' },
        { id: 'confirm', label: 'Check candidates one by one', approach: 'Compared candidate 1 in full with the target, then candidate 2, and so on.', breaksAt: 'It re-reads the target for every candidate and spends longest on the identical one.' },
        { id: 'timeout', label: 'Leave it when unsure', approach: 'Let the clock run out rather than risk a wrong answer.', breaksAt: 'A timeout scores the same as a wrong answer, so a pick among the survivors can only help.' },
      ] },
    { type: 'text', text: `CodeCompare is the proofreading game of Zap-N. A target code of letters and digits sits above ${OPTS} candidates. Exactly one candidate is identical; the other ${OPTS - 1} differ in one or two places. Press 1 to ${OPTS}, or click. ${R} rounds: codes grow from ${lengthAt(0)} to ${lengthAt(R - 1)} characters while the time limit falls from ${secs(allowanceMs(0))} s to ${secs(allowanceMs(R - 1))} s.` },
    { type: 'text', text: `A distractor is built from the target by one or two edits of two kinds: a **look-alike swap** (O for 0, L for 1, S for 5, B for 8, and so on) or a **neighbour swap** (two adjacent characters trade places). No answer in time counts as wrong. Target: ${pct(TARGET)}, so at most ${BUDGET} errors.` },
    { type: 'check', scope: 'the game: one identical candidate', questions: [{ make: identicalQ }] },

    sec('why'),
    { type: 'text', text: 'Traders read order tickets, account codes and prices under time pressure, and one wrong character is one wrong trade. CodeCompare measures whether you verify character by character fast enough, instead of trusting the overall look of a string. The distractors are built exactly from the errors that shape-reading lets through.' },

    sec('anchor'),
    { type: 'text', text: 'You proofread a phone number against a note by checking digits, not by glancing at the whole number: a number has no word shape to lean on. CodeCompare is that with **one change**: letters and digits that look alike are mixed on purpose, so even a character-by-character check must ask "0 or O?", "1 or L?" at every position. Your eye is built to read words by their outline and fill in the letters it expects; here that habit is exactly what the distractors exploit.' },
    { type: 'check', scope: 'character-by-character reading', questions: [{ make: oneEditQ }] },

    sec('picture'),
    { type: 'text', text: 'The challenge with the differences shaded, the codes drawn in chunks of 3.' },
    { type: 'diagram', diagram: 'zapn-codecompare', spec: { target: C.target, candidates: C.options.map((o) => ({ code: o, diff: diffAt(C.target, o), edits: editCount(C.target, o) })), answer: C.answer, chunk: 3 }, caption: `Candidate 1 swaps a look-alike (${describe(C.target, C.options[0])}); candidate 3 swaps two neighbours; candidate 4 has two look-alike swaps. Each shaded cell is invisible to a glance at the shape.` },
    { type: 'check', scope: 'the two kinds of difference', questions: [
      mc({ q: 'What kind of difference is candidate 3?', right: 'two neighbours swapped', at: 0,
        wrong: [['a look-alike swap', 'no character was replaced: A and X both still appear, in the other order'], ['one character missing', 'every candidate has exactly the target\'s length'], ['two separate look-alike swaps', 'the two shaded characters are the same pair, exchanged']],
        explain: `${describe(C.target, C.options[2])}.` }),
    ] },
    { type: 'text', text: 'The clock tightens while the codes grow, so the time you can give each character falls fast.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 1, max: R, label: 'round' }, y: { min: 0, max: 800, label: 'ms per character of the target' }, curves: [{ label: 'time limit ÷ code length', points: Array.from({ length: R }, (_, i) => [i + 1, allowanceMs(i) / lengthAt(i)]) }], markers: [{ x: 1, y: allowanceMs(0) / lengthAt(0), label: `${Math.round(allowanceMs(0) / lengthAt(0))} ms` }, { x: R, y: allowanceMs(R - 1) / lengthAt(R - 1), label: `${Math.round(allowanceMs(R - 1) / lengthAt(R - 1))} ms` }] }, caption: `From ${Math.round(allowanceMs(0) / lengthAt(0))} ms per target character in round 1 to ${Math.round(allowanceMs(R - 1) / lengthAt(R - 1))} ms in round ${R}, and each character has ${OPTS} candidates to check against.` },
    { type: 'check', scope: 'the shrinking deadline', questions: [
      { make: (rng) => { const i = rng.int(0, R - 1); return { type: 'number', q: `The limit falls evenly from ${secs(allowanceMs(0))} s in round 1 to ${secs(allowanceMs(R - 1))} s in round ${R}. How many seconds do you get in round ${i + 1}? (2 decimals)`, answer: allowanceMs(i) / 1000, tolerance: 0.006, hints: [`It drops by ${dec((allowanceMs(0) - allowanceMs(R - 1)) / 1000, 2)} s over ${R - 1} steps.`, `5 − 2 × ${i}/${R - 1}.`], explain: `${secs(allowanceMs(0))} − 2 × ${i}/${R - 1} = ${secs(allowanceMs(i))} s.` }; } },
    ] },

    sec('derivation'),
    { type: 'steps', steps: [
      { answers: 'confirm', say: `Exactly one candidate is identical, so you never need to confirm it: eliminate ${OPTS - 1} and the survivor is the answer.`, why: 'Finding one difference is fast and certain; confirming every character of a match is slow.',
        checks: [mc({ q: 'You have found a difference in three candidates. What do you do with the fourth?', right: 'answer it without checking', at: 0, wrong: [['check it fully first', 'exactly one candidate is identical, so the last survivor must be it'], ['compare it with the other three', 'they are already out']], explain: 'The survivor is identical by the rules of the game.' })] },
      { say: 'Split the target into chunks of 3 and hold one chunk at a time. A code of length n gives ⌈n/3⌉ chunks.', why: 'Three characters fit in one glance and in working memory at once, so each comparison is a single look.',
        checks: [{ make: (rng) => { const n = rng.int(lengthAt(0), lengthAt(R - 1)); return { type: 'number', q: `How many chunks of 3 does a ${n}-character code make?`, answer: Math.ceil(n / 3), explain: `⌈${n}/3⌉ = ${Math.ceil(n / 3)} (the last chunk may be shorter).` }; } }] },
      { say: 'Compare chunk 1 of the target with chunk 1 of **every** candidate and cross out each that fails. Then chunk 2 among the survivors, and so on.', why: 'One chunk held in mind is checked four times in a row, instead of re-reading the target for each candidate.',
        checks: [{ type: 'number', q: `Challenge round: chunk 1 of ${code(C.target)} is ${code(chunks(C.target)[0])}. How many candidates survive chunk 1?`, answer: C.options.filter((o) => survivesChunk(C.target, o, 0)).length, explain: `Only ${C.options.filter((o) => !survivesChunk(C.target, o, 0)).join(', ')} fails chunk 1.` }] },
      { answers: 'shape', say: 'A neighbour swap changes two positions but keeps the same characters. Check the **order** inside a chunk, not just which characters are there.', why: 'A chunk like "AX" against "XA" contains the same letters, so a "same characters?" check passes it.',
        checks: [{ make: oneEditQ }] },
      { say: 'When two candidates survive, compare them with **each other**. Where they differ is the only position to check in the target.', why: 'The two differ exactly where one of them is wrong, so a single target position decides.',
        checks: [mc({ q: `Two survivors: ${code(Wk.options[wAfter2[0]])} and ${code(Wk.options[wAfter2[1]])}. Target ${code(Wk.target)}. Which position decides?`, right: `position ${pairDiff[0] + 1}`, at: 1,
          wrong: [['position 1', 'the survivors agree there; it cannot separate them'], ['all of them, one by one', 'only positions where the survivors differ can separate them'], [`position ${pairDiff[0]}`, 'counted positions from 0']],
          explain: `They differ only at position ${pairDiff[0] + 1}; the target has ${Wk.target[pairDiff[0]]} there.` })] },
      { answers: 'timeout', say: 'No answer in time counts as wrong, the same as a wrong answer. So when time runs out, answer anyway: pick a survivor.', why: 'With k survivors a pick is right 1/k of the time; a timeout is right 0 of the time.',
        checks: [mc({ q: 'Two candidates survive and 0.3 s remain. Best action?', right: 'pick one of the two now', at: 0, wrong: [['let it time out', 'a timeout scores the same as a wrong answer, and a pick is right half the time'], ['pick one of the eliminated candidates', 'eliminated candidates are certainly wrong']], explain: 'A pick is right with probability 1/2; a timeout never is.' })] },
    ] },
    { type: 'explain', prompt: 'Why is it faster to eliminate candidates chunk by chunk than to check candidate 1 fully, then candidate 2, and so on?', model: 'Eliminating needs only one difference per wrong candidate, and with a chunk held in mind you check it against all four at once without re-reading the target. Checking candidates one at a time re-reads the target four times and spends the most time on the identical candidate, which never shows a difference.', points: ['Each wrong candidate needs only one found difference', 'One chunk held in mind is compared against all four candidates', 'The identical candidate never needs a full check: it is whatever survives'] },

    sec('worked'),
    { type: 'text', text: `A mid-game round: ${Wk.target.length} characters. Follow the elimination chunk by chunk.` },
    { type: 'diagram', diagram: 'zapn-codecompare', spec: { target: Wk.target, candidates: Wk.options.map((o) => ({ code: o, diff: diffAt(Wk.target, o) })), answer: Wk.answer, chunk: 3 }, caption: `Chunks ${chunks(Wk.target).join(' · ')}. Chunk 1 removes candidates 1 and 2; chunk 2 removes nobody; comparing the survivors 3 and 4 settles it at the last position.` },
    { type: 'steps', steps: [
      { say: `Chunk 1 is ${code(chunks(Wk.target)[0])}. Candidate 1 starts ${code(chunks(Wk.options[0])[0])} (neighbour swap), candidate 2 starts ${code(chunks(Wk.options[1])[0])} (look-alike). Both out.`, why: 'One chunk, four quick comparisons.',
        checks: [{ type: 'number', q: 'How many candidates survive chunk 1?', answer: wAfter1.length, explain: `Candidates ${wAfter1.map((i) => i + 1).join(' and ')}.` }] },
      { say: `Chunk 2 is ${code(chunks(Wk.target)[1])}. Both survivors match it.`, why: 'A chunk that removes nobody is still needed: a difference could have been there.',
        checks: [{ type: 'number', q: 'How many candidates survive chunk 2?', answer: wAfter2.length, explain: `Still ${wAfter2.map((i) => i + 1).join(' and ')}.` }] },
      { say: `Survivors 3 and 4 differ only at position ${pairDiff[0] + 1}: ${Wk.options[wAfter2[0]][pairDiff[0]]} against ${Wk.options[wAfter2[1]][pairDiff[0]]}. The target has ${Wk.target[pairDiff[0]]}. Answer ${Wk.answer + 1}.`, why: 'Comparing the pair to each other finds the one position that matters.',
        checks: [mc({ q: 'Which candidate is identical?', right: String(Wk.answer + 1), at: 2, wrong: [['1', `neighbour swap: ${describe(Wk.target, Wk.options[0])}`], ['2', `look-alikes: ${describe(Wk.target, Wk.options[1])}`], ['4', `look-alike at the end: ${describe(Wk.target, Wk.options[3])}`]], explain: `Candidate ${Wk.answer + 1} is the only one with no difference.` })] },
    ] },

    sec('predict'),
    { type: 'predict', question: `Round ${R}: ${lengthAt(R - 1)} characters, ${secs(allowanceMs(R - 1))} s. If you checked every character of all ${OPTS} candidates, how long could each character comparison take?`, answer: `${Math.round(allowanceMs(R - 1) / (lengthAt(R - 1) * OPTS))} ms.`, explain: `${allowanceMs(R - 1)} ms ÷ (${lengthAt(R - 1)} × ${OPTS}) comparisons. Too fast for careful reading, which is why you eliminate by chunks and stop as soon as one candidate is left.` },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Read the code as a word and compare shapes.', fix: 'Shape-reading fills in expected characters: exactly the O/0 and L/1 errors the distractors are made of.' },
      { belief: 'The first characters are enough.', fix: 'Differences can sit anywhere, including the last position. Finish the elimination pass.' },
      { belief: 'A neighbour swap changes one character.', fix: 'It changes two positions while keeping the same characters, so check order, not just content.' },
      { belief: 'Check candidate 1 fully, then candidate 2, and so on.', fix: 'Eliminate chunk by chunk across all four; the identical one never needs a full check.' },
      { belief: 'If unsure, better to let it time out than answer wrong.', fix: 'A timeout counts as wrong too. A pick among the survivors can only help.' },
    ] },
    { type: 'erroneous', problem: `A candidate answers the worked round (target ${code(Wk.target)}). One step is wrong.`, steps: [
      `Chunk 1 ${code(chunks(Wk.target)[0])} rules out candidates 1 and 2.`,
      `Chunk 2 ${code(chunks(Wk.target)[1])}: candidates 3 and 4 both match.`,
      'Candidate 4 matches the first two chunks, so it is the identical one.',
      'Answer 4.',
    ], errorStep: 2, explain: `Matching two chunks proves nothing while another candidate also matches. Chunk 3 (or comparing 3 and 4 with each other) shows candidate 4 ends in A where the target ends in 4.` },
    { type: 'check', scope: 'finishing the elimination', questions: [{ make: identicalQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Look-alikes to expect: ${PAIRS.join(', ')}, plus neighbour swaps like 47 against 74. Knowing the list turns "looks the same" into a specific question at each position.` },
    { type: 'callout', tone: 'speed', text: 'Budget: say each chunk silently ("K-5-O") before comparing it, stop the moment one candidate is left, and answer before the bar runs out even if two survive.' },
    { type: 'thinkaloud', problem: `Round ${TK.i + 1}, ${secs(allowanceMs(TK.i))} s. Target ${code(TK.target)}. Candidates: ${TK.options.map((o, i) => `${i + 1}) ${code(o)}`).join('  ')}.`, lines: TK.lines },
    { type: 'check', scope: 'the error budget', questions: [
      { make: (rng) => { const e = rng.int(1, 5); return mc({ q: `You made ${e} errors in ${R} rounds (timeouts included). Did you reach ${pct(TARGET)}?`, right: e <= BUDGET ? 'yes' : 'no', at: 0, wrong: [[e <= BUDGET ? 'no' : 'yes', e <= BUDGET ? `${R - e}/${R} = ${dec((R - e) / R)} is at least ${TARGET}` : `${R - e}/${R} = ${dec((R - e) / R)} is below ${TARGET}`]], explain: `${R - e}/${R} = ${dec((R - e) / R)}; the budget is ${BUDGET} errors.` }); } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'CodeCompare: chunk by 3, eliminate across all four, compare the last two survivors with each other, and always answer before time runs out.' },

    sec('contrast'),
    { type: 'compare', columns: ['Game', 'What you hold in mind', 'How you decide'], rows: [
      ['CodeCompare', 'one chunk of the visible target', 'eliminate the three that differ'],
      ['Pincode', 'the whole hidden code, as chunks', 'recall and type it back'],
      ['Shapeshift', 'one rule: round is right', 'react to one feature'],
      ['Figure It Out', 'the values ruled out so far', 'eliminate per property after each guess'],
    ] },
    { type: 'variation', base: `Round ${TK.i + 1}: a ${TK.target.length}-character target, ${OPTS} candidates, ${secs(allowanceMs(TK.i))} s. Chunk by 3 and eliminate.`, rows: [
      { same: true, change: 'The identical candidate sits in slot 4 instead of slot 2', effect: 'Nothing changes: the slot is random, so no slot deserves a look first.' },
      { change: 'A distractor uses a neighbour swap instead of a look-alike', effect: 'Its chunk holds the same characters in another order: check the order inside the chunk, not just which characters are there.' },
      { change: "A distractor's only difference is in the last position", effect: 'It survives every chunk but the last: finish the pass, or compare the last two survivors with each other.' },
      { fusion: true, change: `Round ${R}, and a distractor's only difference is a neighbour swap in the last chunk`, effect: 'Less time and a late, order-only difference: the two add up, so the last chunk must be checked for order even when the clock is short.' },
      { change: 'Two candidates survive with 0.2 s left', effect: 'Pick one now: right half the time, while a timeout is always wrong.' },
      { change: `Round ${R}: ${lengthAt(R - 1)} characters and ${secs(allowanceMs(R - 1))} s`, effect: `${Math.ceil(lengthAt(R - 1) / 3)} chunks and ${Math.round(allowanceMs(R - 1) / lengthAt(R - 1))} ms per target character: same method, less slack for re-reading.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a distractor with two edits can match the first chunks, so one clean chunk never clears a candidate. Two look-alike edits can sit in one chunk. The identical candidate can be in any slot; do not favour one.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: chunking by 3 is the Pincode memory trick used for perception instead of recall, and elimination (find one flaw per wrong option) is how Figure It Out and every multiple-choice task are won.' },
    { type: 'transfer',
      near: { make: identicalQ },
      far: { make: (rng) => {
        let q; do q = String(rng.int(102, 987)); while (new Set(q).size < 3);
        const p = `${rng.int(95, 120)}.${rng.int(1, 9)}${rng.int(1, 9)}`;
        if (p[p.length - 1] === p[p.length - 2]) return { type: 'number', q: `Your order was BUY ${q} @ ${p}. How many characters does a confirmation BUY ${q[1]}${q[0]}${q[2]} @ ${p} differ from it in?`, answer: 2, explain: 'The first two digits of the quantity traded places: two positions.' };
        const sw = (s, i) => s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
        const t = `BUY ${q} @ ${p}`;
        return mc({ q: `Your order was ${code(t)}. Which confirmation matches it?`, right: code(t), wrong: [[code(`BUY ${sw(q, 0)} @ ${p}`), `missed a neighbour swap in the quantity: ${q.slice(0, 2)} became ${q[1]}${q[0]}`], [code(`BUY ${sw(q, 1)} @ ${p}`), `missed a neighbour swap in the quantity: ${q.slice(1)} became ${q[2]}${q[1]}`], [code(`BUY ${q} @ ${sw(p, p.length - 2)}`), `missed a neighbour swap in the price: ${p.slice(-2)} became ${p[p.length - 1]}${p[p.length - 2]}`]], explain: `Only ${t} matches character by character.` }, rng);
      } },
      principle: mc({ q: 'Which idea carried over from CodeCompare to checking a trade confirmation?', right: 'find one difference per wrong option, reading in chunks', at: 3,
        wrong: [['pick the option that looks most familiar at a glance', 'swaps keep the familiar look: that is how they slip through'], ['check only the first few characters of each option', 'differences sit anywhere, including the end'], ['read every option in full, one after another', 'correct but slow: elimination needs only one difference per wrong option']],
        explain: 'Both are won by chunked, character-level elimination rather than an overall impression.' }),
    },
    { type: 'check', scope: 'the contrast table', questions: [
      mc({ q: 'Which game uses the same chunk-by-3 habit to remember a code that is no longer on screen?', right: 'Pincode', at: 1, wrong: [['Shapeshift', 'Shapeshift has no code, only a shape'], ['Figure It Out', 'Figure It Out tracks eliminated values, not a code'], ['Stock Master', 'Stock Master tracks needles, not characters']], explain: 'Pincode hides the code and asks you to type it back; chunks of 3 are how you hold it.' }),
    ] },

    sec('tryit'),
    { type: 'tryit', game: 'codecompare' },
  ],
};
