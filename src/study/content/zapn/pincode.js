// Zap-N game lesson: Pincode (working memory). Modes, display times and the length staircase come
// from src/zapn/pincode/engine.js; the staircase examples are produced by driving the real engine.
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { makeRng } from '../../../core/rng.js';
import { createEngine, expected, showMs, DEFAULTS } from '../../../zapn/pincode/engine.js';
import { sec, mc, dec, round } from './balloon.js';

const TARGET = ZAPN_TARGETS.pincode.value;
const secs = (n) => dec(showMs(n) / 1000, 1);
const chunk3 = (s) => s.match(/.{1,3}/g);
const TIMES = ['', 'once', 'twice', 'three times', 'four times', 'five times'];
const tallyText = (code) => [...new Set(expected(code, 'sorted'))].map((d) => { const n = [...code].filter((x) => x === d).length; return n > 1 ? `${d} ${TIMES[n] ?? `${n} times`}` : d; }).join(', ');
const randCode = (rng, n) => Array.from({ length: n }, () => rng.int(0, 9)).join('');

// Drive forward mode of the real engine; decide(len) says whether the typed answer is right.
function runForward(decide, seed) {
  const e = createEngine(makeRng(seed));
  let t = 0; e.act({ type: 'start' }, t);
  const log = [];
  for (let k = 0; k < 60 && e.state.mode === 0 && !e.isOver(); k++) {
    t = e.state.showUntil; e.act({ type: 'tick' }, t);
    const want = expected(e.state.digits, 'forward'), ok = decide(e.state.len);
    for (const d of ok ? want : want.slice(1)) e.act({ type: 'digit', d }, t);
    const tr = e.act({ type: 'submit' }, ++t);
    log.push({ len: tr.len, ok: tr.correct });
    t = e.state.feedbackUntil; e.act({ type: 'tick' }, t);
  }
  return { log, span: e.state.spans.forward, over: e.state.mode !== 0 };
}
const logText = (log) => {
  const by = [];
  for (const x of log) { if (!by.length || by[by.length - 1].len !== x.len) by.push({ len: x.len, r: [] }); by[by.length - 1].r.push(x.ok ? 'right' : 'wrong'); }
  return by.map((g) => `${g.len} digits: ${g.r.join(', ')}`).join(' · ');
};
const staircaseQ = (rng) => {
  for (;;) {
    const k = rng.int(5, 10), run = runForward((len) => rng.chance(len < k ? 0.85 : 0.25), `pin:${rng.int(0, 1e9)}`);
    if (!run.over || run.log.length > 18) continue;
    return { type: 'number', q: `Forward mode went: ${logText(run.log)}. The mode is over. What is your forward span?`, answer: run.span, hints: ['Two wrong at one length end the mode.', 'The span is the longest length you typed correctly at least once.'], explain: `The longest length with a right answer is ${run.span}${run.span ? '' : ' (none)'}; the mode ended after two wrong at ${run.log[run.log.length - 1].len}.` };
  }
};
const reverseQ = (rng) => {
  const code = randCode(rng, rng.int(6, 9)), ch = chunk3(code);
  return mc({ q: `Reverse mode. The code was ${ch.join(' ')}. What do you type?`, right: expected(code, 'reverse'),
    wrong: [[[...ch].reverse().join(''), 'reversed the order of the chunks but not the digits inside each chunk'], [ch.map((c) => [...c].reverse().join('')).join(''), 'reversed inside each chunk but kept the chunk order'], [code, 'typed it forward']],
    explain: `Last chunk first, each read backwards: ${[...ch].reverse().map((c) => [...c].reverse().join('')).join(' ')}.` }, rng);
};
const sortedQ = (rng) => {
  let code; do code = randCode(rng, rng.int(6, 9)); while (new Set(code).size === code.length);
  const up = expected(code, 'sorted');
  return mc({ q: `Sorted mode. The code was ${chunk3(code).join(' ')}. What do you type?`, right: up,
    wrong: [[[...up].reverse().join(''), 'sorted high to low: the mode asks for low to high'], [[...new Set(up)].join(''), 'dropped the repeated digits: every digit is typed as often as it appeared'], [code, 'typed it in the shown order']],
    explain: `Tally: ${tallyText(code)}. Read it from 0 to 9: ${up}.` }, rng);
};

// Diagram codes.
const F = '472915836', FR = expected(F, 'reverse');
const S = '38583178', SS = expected(S, 'sorted');
const STAIR2 = runForward(((seq) => { let i = 0; return () => seq[i++] ?? false; })([true, true, true, true, true, false, true, false, true, false, false]), 'pin:table');

export default {
  id: 'zapn/pincode',
  book: 'zapn',
  kind: 'game',
  game: 'pincode',
  title: 'Pincode: chunk, reverse by chunks, tally',
  summary: 'Hold a code as chunks of 3 spoken as numbers; reverse it chunk by chunk; for sorted mode keep a tally, not the order.',
  prerequisites: [],
  objectives: [
    'Hold a 9-digit code as three spoken chunks for the whole display time',
    'Type a code reversed by reversing the chunk order and each chunk',
    'Type a code sorted from a tally of digit counts, repeats included',
    `Read the length staircase and reach the target forward span of ${TARGET} digits`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. The code ${[...F].join(' ')} is shown for ${secs(F.length)} s, then hidden. How would you hold it until you type? And if the mode were "sorted, low to high", what would you type?`, answer: `Hold it as ${chunk3(F).join(', ')}; sorted: ${expected(F, 'sorted')}.`, explain: `Nine separate digits overflow working memory; three chunks do not. Sorting throws the order away, so for sorted mode you only need which digits appeared. If you tried to memorise the order for the sorted question, the lesson shows the cheaper route.`,
      attempts: [
        { id: 'digits', label: 'Hold nine separate digits', approach: 'Repeated the digits one after another until the code disappeared.', breaksAt: 'Nine separate items overflow working memory, and the first digits fade first.' },
        { id: 'order', label: 'Memorise the order, then sort', approach: 'Held the code as shown and sorted it in your head while typing.', breaksAt: 'Sorting in your head needs every digit in play at once, and the order was never needed.' },
      ] },
    { type: 'text', text: `Pincode is the memory game of Zap-N. A digit code appears, then disappears; you type it and press Enter. Mode 1 types it **as shown**, mode 2 **reversed**, mode 3 **sorted** from low to high. The code is shown for ${DEFAULTS.msPerDigit / 1000} s per digit (at least ${DEFAULTS.minShowMs / 1000} s): ${secs(9)} s for 9 digits.` },
    { type: 'text', text: `Codes start at ${DEFAULTS.startLen} digits. Two right answers at a length add a digit; two wrong answers at a length end the mode. The score is your **forward span**: the longest code you typed correctly in mode 1. Target: ${TARGET} digits. No pen and paper.` },
    { type: 'check', scope: 'the three modes and the display time', questions: [
      mc({ q: 'The code was 5 2 9. Reverse mode. What do you type?', right: '925', at: 1, wrong: [['529', 'typed it forward'], ['259', 'sorted it instead of reversing'], ['952', 'reversed only the last two digits']], explain: 'Reverse: last digit first, 9 2 5.' }),
      { make: (rng) => { const n = rng.int(3, 14); return { type: 'number', q: `How many seconds is a ${n}-digit code shown?`, answer: showMs(n) / 1000, hints: [`${DEFAULTS.msPerDigit / 1000} s per digit, but never less than ${DEFAULTS.minShowMs / 1000} s.`], explain: `max(${DEFAULTS.minShowMs / 1000}, ${n} × ${DEFAULTS.msPerDigit / 1000}) = ${secs(n)} s.` }; } },
    ] },

    sec('why'),
    { type: 'text', text: 'A trader keeps several prices, sizes and positions in mind while the screen moves on. Pincode measures working memory: how many items you can hold and manipulate at once. The span you can reach depends far more on how you pack the digits than on raw memory, and packing is a skill you can train. The three modes also test manipulation, not just storage: reversing and sorting ask you to work on what you hold without losing it.' },

    sec('anchor'),
    { type: 'text', text: 'You already remember phone numbers as 3-3-4 groups, not as ten separate digits. Working memory holds about four **chunks**, not four digits. Pincode is the phone-number trick with **one change**: the code is new every time, so you build the chunks on the spot, in the seconds it is on screen. Saying each chunk as one number ("four seventy-two") matters: your inner voice can loop a few short sounds for as long as you keep repeating them, and a number is one sound where three digits are three.' },
    { type: 'check', scope: 'chunks, not digits', questions: [
      { make: (rng) => { const n = rng.int(7, 15); return { type: 'number', q: `A ${n}-digit code held in chunks of 3 (the last one may be shorter) is how many chunks?`, answer: Math.ceil(n / 3), explain: `⌈${n}/3⌉ = ${Math.ceil(n / 3)} chunks, against ${n} loose digits.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: `Mode 1, forward. The ${F.length} digits become three chunks, each said as one number ("${chunk3(F).join('", "')}"), not as nine separate digits.` },
    { type: 'diagram', diagram: 'zapn-pincode', spec: { code: F, mode: 'forward', chunks: chunk3(F), answer: F }, caption: 'Colour marks the chunk. Three things to hold, rehearsed silently until input opens.' },
    { type: 'check', scope: 'forward chunks', questions: [
      mc({ q: `Which chunking of ${F} holds the fewest items without making any chunk longer than 3?`, right: chunk3(F).join(' '), at: 2, wrong: [[[...F].join(' '), 'nine loose digits: more than working memory holds'], [`${F.slice(0, 2)} ${F.slice(2, 4)} ${F.slice(4, 6)} ${F.slice(6, 8)} ${F.slice(8)}`, 'pairs give five items, two more than needed'], [`${F.slice(0, 4)} ${F.slice(4)}`, 'a 5-digit chunk is too long to say as one number']], explain: 'Three chunks of three: the fewest items that each fit in one breath.' }),
    ] },
    { type: 'diagram', diagram: 'zapn-pincode', spec: { code: F, mode: 'reverse', chunks: chunk3(F), answer: FR }, caption: `Mode 2, reverse. Keep the same chunks, then type the last chunk first, each chunk backwards: ${FR}. Only three digits are ever being reversed at once.` },
    { type: 'check', scope: 'reverse by chunks', questions: [{ make: reverseQ }] },
    { type: 'diagram', diagram: 'zapn-pincode', spec: { code: S, mode: 'sorted', tally: Object.fromEntries([...new Set(S)].map((d) => [d, [...S].filter((x) => x === d).length])), answer: SS }, caption: `Mode 3, sorted. Order is thrown away, so do not store it: tally the digits (${tallyText(S)}) and read the tally from 0 to 9: ${SS}.` },
    { type: 'check', scope: 'sorted by tally', questions: [{ make: sortedQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { answers: 'digits', say: 'Split the code into chunks of 3 and say each chunk as one number: "four seventy-two", not "four, seven, two".', why: 'A spoken number is one sound unit, so three chunks cost three items of rehearsal instead of nine.',
        checks: [{ make: (rng) => { const code = randCode(rng, rng.int(7, 12)); return { type: 'number', q: `How many chunks do you rehearse for ${code}?`, answer: chunk3(code).length, explain: `${chunk3(code).join(' ')}: ${chunk3(code).length}.` }; } }] },
      { say: 'Rehearse the chunks silently while the code is on screen and after it hides; start typing the moment input opens.', why: 'Rehearsal fades within seconds once it stops, and the first chunk, rehearsed longest ago, is the one most at risk.',
        checks: [mc({ q: 'Input opens. When should you start typing?', right: 'at once', at: 0, wrong: [['after one more full rehearsal', 'every second without rehearsal lets the first chunk fade'], ['after checking the last chunk twice', 'the first chunk is the one at risk, not the last']], explain: 'Type while the rehearsal is fresh.' })] },
      { say: 'Reverse mode: keep the forward chunks, then output the last chunk first, each chunk read backwards.', why: 'Reversing nine digits at once needs all nine in play; reversing a 3-digit chunk needs three.',
        checks: [{ make: reverseQ }] },
      { answers: 'order', say: 'Sorted mode: tally how many of each digit appear ("two 3s, one 5, three 8s"), then read the tally from 0 to 9.', why: 'Sorting discards the order, so storing it is wasted effort. A tally is smaller and reads out already sorted.',
        checks: [{ make: sortedQ }] },
      { say: `The staircase: two right at a length add a digit, two wrong at a length end the mode. Your span is the longest length you got right, so reaching ${TARGET} needs one right answer at ${TARGET} digits.`, why: 'The span records the best length with a correct answer; the ending rule only decides when the mode stops.',
        checks: [{ make: staircaseQ }] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Trial', 'Length', 'Result'], rows: STAIR2.log.map((x, i) => [String(i + 1), String(x.len), x.ok ? 'right' : 'wrong']) }, caption: `A forward run from the real engine. Two rights move up a digit; the run ends after two wrongs at ${STAIR2.log[STAIR2.log.length - 1].len} digits. Forward span ${STAIR2.span}.` },
    { type: 'check', scope: 'reading a staircase', questions: [
      { type: 'number', q: 'From the table: what forward span did this run score?', answer: STAIR2.span, explain: `The longest length with a right answer is ${STAIR2.span}.` },
    ] },
    { type: 'explain', prompt: 'Why is a tally better than memorising the order in sorted mode?', model: 'Sorted mode asks for the digits from low to high, so the order they were shown in is never used. A tally keeps only what the answer needs, how many of each digit, which is fewer things to hold, and reading it from 0 to 9 produces the sorted answer directly. Repeats are kept as counts, so none is dropped.', points: ['The shown order is thrown away by sorting', 'A tally holds only the counts, a smaller object', 'Reading the tally 0 to 9 gives the answer, repeats included'] },

    sec('worked'),
    { type: 'text', text: 'One code, three modes. Decide each answer before opening the next step.' },
    { type: 'diagram', diagram: 'zapn-pincode', spec: { code: '905527', mode: 'reverse', chunks: ['905', '527'], answer: expected('905527', 'reverse') }, caption: 'The code 905 527: two chunks. Reverse mode shown.' },
    { type: 'steps', steps: [
      { say: 'Forward: say "nine-oh-five, five-twenty-seven" and type 905527.', why: 'The zero stays a digit: say "oh" so it is not lost.',
        checks: [{ type: 'number', q: 'How many seconds was this 6-digit code on screen?', answer: showMs(6) / 1000, explain: `6 × ${DEFAULTS.msPerDigit / 1000} = ${secs(6)} s.` }] },
      { say: `Reverse: last chunk first, backwards: 725, then 509. Type ${expected('905527', 'reverse')}.`, why: 'Two chunk reversals of three digits each.',
        checks: [mc({ q: 'Reverse answer?', right: expected('905527', 'reverse'), at: 0, wrong: [['527905', 'swapped the chunks but kept each forward'], ['509725', 'reversed each chunk but kept the chunk order']], explain: '725 then 509.' })] },
      { say: `Sorted: tally ${tallyText('905527')}; read 0 to 9: ${expected('905527', 'sorted')}.`, why: 'The double 5 is a count of 2, so it is typed twice.',
        checks: [mc({ q: 'Sorted answer?', right: expected('905527', 'sorted'), at: 1, wrong: [['02579', 'dropped the second 5'], ['975520', 'sorted high to low']], explain: `${expected('905527', 'sorted')}.` })] },
    ] },

    sec('predict'),
    { type: 'predict', question: `Held as chunks of 3, how many items is a ${TARGET}-digit code, and how long is it on screen?`, answer: `${Math.ceil(TARGET / 3)} chunks, shown for ${secs(TARGET)} s.`, explain: 'Three chunks sit inside the four that working memory holds; nine loose digits do not.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Memorise the digits one by one.', fix: 'Nine loose digits overflow working memory; three spoken chunks do not.' },
      { belief: 'Sorted mode needs the shown order.', fix: 'Sorting throws the order away. Keep a tally.' },
      { belief: 'Reverse the whole string in your head at once.', fix: 'Reverse chunk by chunk: last chunk first, each backwards.' },
      { belief: 'A repeated digit is typed once.', fix: 'Every digit is typed as often as it appeared. Say "double seven".' },
      { belief: 'Wait a moment after input opens to rehearse again.', fix: 'Rehearsal fades once it stops. Type at once.' },
    ] },
    { type: 'erroneous', problem: `A candidate answers sorted mode for the code ${S}. One step is wrong.`, steps: [
      'Sorted mode needs only which digits appeared, not their order.',
      `The digits that appear are ${[...new Set(SS)].join(', ')}.`,
      `So the answer is ${[...new Set(SS)].join('')}.`,
      'Submit.',
    ], errorStep: 2, explain: `Repeats count. The tally is ${tallyText(S)}, so the answer is ${SS}: every digit as often as it appeared.` },
    { type: 'check', scope: 'repeats in sorted mode', questions: [{ make: sortedQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Build the chunks while the code is still on screen: ${DEFAULTS.msPerDigit / 1000} s per digit is enough to say each chunk twice. Name repeats as one feature ("double seven") and say zeros as "oh".` },
    { type: 'callout', tone: 'speed', text: 'Train it outside the game: glance at a licence plate or a receipt number, look away, and recite it in chunks. For sorted mode, use only the tally method for a whole session until it is automatic.' },
    { type: 'thinkaloud', problem: `Forward mode, ${F.length} digits: ${[...F].join(' ')}, on screen for ${secs(F.length)} s.`, lines: [
      { t: 0, say: `Nine digits: three chunks. "${chunk3(F)[0]}".` },
      { t: 1.5, say: `"${chunk3(F)[1]}". Back to the start: ${chunk3(F).slice(0, 2).join(', ')}.` },
      { t: 3, say: `"${chunk3(F)[2]}". Whole thing once: ${chunk3(F).join(', ')}.` },
      { t: +secs(F.length), say: `Hidden. Rehearse: ${[chunk3(F)[0], chunk3(F)[1][0] + chunk3(F)[1][2] + chunk3(F)[1][1], chunk3(F)[2]].join(', ')}.`, slip: true },
      { t: round(showMs(F.length) / 1000 + 0.4, 1), say: `The middle chunk is off: on screen I said "${chunk3(F)[1]}". Rehearse: ${chunk3(F).join(', ')}.` },
      { t: round(showMs(F.length) / 1000 + 0.9, 1), say: `Input is open: type ${F} straight away. Nine digits typed, count matches the three chunks.` },
    ] },
    { type: 'check', scope: 'building chunks at speed', questions: [
      { make: (rng) => { const n = rng.int(6, 12); return { type: 'number', q: `A ${n}-digit code: how many seconds per chunk of 3 do you get while it is on screen?`, answer: showMs(n) / 1000 / Math.ceil(n / 3), tolerance: 0.01, hints: [`It is shown for ${secs(n)} s.`, `Divide by ${Math.ceil(n / 3)} chunks.`], explain: `${secs(n)} s ÷ ${Math.ceil(n / 3)} = ${dec(showMs(n) / 1000 / Math.ceil(n / 3), 2)} s per chunk.` }; } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Pincode: forward, chunk by 3 and say them as numbers. Reverse, last chunk first, each backwards. Sorted, tally the counts and read 0 to 9.' },

    sec('contrast'),
    { type: 'compare', columns: ['Mode', 'What you store', 'What you type'], rows: [
      ['Forward', 'the chunks, in order', 'the chunks, in order'],
      ['Reverse', 'the same chunks, in order', 'last chunk first, each backwards'],
      ['Sorted', 'a tally of digit counts', 'the tally read from 0 to 9'],
      ['CodeCompare (a neighbour)', 'one chunk of a visible code', 'nothing: you eliminate candidates'],
    ] },
    { type: 'variation', base: `Forward mode, code ${chunk3(F).join(' ')} (${F.length} digits, ${secs(F.length)} s).`, rows: [
      { change: 'Reverse mode', effect: `Same chunks, output reversed: ${FR}.` },
      { change: 'Sorted mode', effect: `Tally instead of order: ${expected(F, 'sorted')}.` },
      { same: true, change: 'The same nine digits in a different order, sorted mode', effect: `Same answer, ${expected(F, 'sorted')}: sorting throws the order away.` },
      { fusion: true, change: 'Reverse mode and a tenth digit, 4', effect: `Chunk ${chunk3(F + '4').join(' ')}: the lone 4 comes out first, then each chunk backwards: ${expected(F + '4', 'reverse')}. Both changes fit the chunk method; only the chunk count grows.` },
      { change: 'Ten digits instead of nine', effect: `Shown ${secs(10)} s; chunk it 3-3-4 like a phone number, or 3-3-3-1: still at most four chunks.` },
      { change: 'The code has a repeat, like 4 7 7', effect: 'Hold "four, double seven" as one chunk; in sorted mode the tally says 7 × 2.' },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a leading zero is a digit like any other; type it. Codes grow up to ${DEFAULTS.maxLen} digits. A mode ends after two wrongs at one length even if you had rights at that length, so one careful answer at a new length is worth more than a fast one.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: chunking by 3 is also the CodeCompare reading method, and "store only what the answer needs" (the tally) is the same move as tracking only the eliminated values in Figure It Out.' },
    { type: 'transfer',
      near: { make: (rng) => (rng.chance(0.5) ? reverseQ(rng) : sortedQ(rng)) },
      far: { make: (rng) => { const seq = Array.from({ length: rng.int(6, 9) }, () => rng.pick(['B', 'S'])); return mc({ q: `Orders arrive one at a time and vanish: ${seq.join(', ')}. At the end you must say how many more buys than sells there were. What should you keep in mind as they arrive?`, right: 'one running count of buys minus sells', wrong: [['the whole sequence of orders, in order', 'the order of arrival is never used in the answer'], ['the time at which each order arrived', 'timing is not part of the answer'], ['nothing: recount them all at the end', 'the orders are gone by then']], explain: `Keep only the net count. Here it ends at ${seq.filter((x) => x === 'B').length - seq.filter((x) => x === 'S').length}.` }, rng); } },
      principle: mc({ q: 'Which idea carried over from Pincode to the order count?', right: 'store only what the answer needs, in as few chunks as possible', at: 1,
        wrong: [['store everything exactly as it was shown, to be safe', 'more to hold means more to lose'], ['rehearse for longer before you start to answer', 'rehearsal fades once it stops; start answering at once'], ['split everything into single items, one per digit', 'single items overflow working memory fastest']],
        explain: 'A tally (sorted mode) and a running count (orders) both keep only what the answer uses.' }),
    },
    { type: 'check', scope: 'what each mode stores', questions: [
      mc({ q: 'Which mode lets you forget the order of the digits the moment you have seen them?', right: 'sorted', at: 2, wrong: [['forward', 'you type them in the shown order'], ['reverse', 'reversing needs the order'], ['none of them', 'sorting throws the order away']], explain: 'Sorted needs only the counts.' }),
    ] },

    sec('tryit'),
    { type: 'tryit', game: 'pincode' },
  ],
};
