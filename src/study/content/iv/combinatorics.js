// Intervals: counting (committees, arrangements with repeated letters, grid paths, hands with
// exactly k of a suit). Count ordered, divide out the orderings that do not matter; small counts
// are exact (a point), big ones are estimated with a 3 to 6% band.
import { sec, dec, round, num, mc, ivq, bestLog } from './scoring-and-width.js';

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const P = (n, k) => { let p = 1; for (let i = 0; i < k; i++) p *= n - i; return p; };
const C = (n, k) => (k < 0 || k > n ? 0 : Math.round(P(n, Math.min(k, n - k)) / fact(Math.min(k, n - k))));
const counts = (w) => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return c; };
const arr = (w) => Object.values(counts(w)).reduce((q, k) => q / fact(k), fact(w.length));
const reps = (w) => Object.entries(counts(w)).filter(([, k]) => k > 1);
const repText = (w) => reps(w).map(([ch, k]) => `${k}! for the ${ch}s`).join(' and ') || 'nothing';

const CH = { w: 'LETTER' }; CH.n = arr(CH.w); CH.all = fact(CH.w.length);
const GP = { a: 4, b: 3 }; GP.n = C(GP.a + GP.b, GP.a);
// One shortest path drawn on the grid of points (rows = up, cols = right): R R U R U U R
const moves = 'RRURUUR'; const pathCells = [[GP.b, 0]]; { let r = GP.b, c = 0; for (const m of moves) { if (m === 'R') c++; else r--; pathCells.push([r, c]); } }
const PASCAL = Array.from({ length: 9 }, (_, n) => Array.from({ length: 9 }, (_, k) => (k <= n ? String(C(n, k)) : '')));
const HT = { k: 2 }; HT.a = C(13, HT.k); HT.b = C(39, 5 - HT.k); HT.n = HT.a * HT.b; HT.wrongB = P(39, 5 - HT.k);
const B3 = bestLog(0.03), B6 = bestLog(0.06);
const VB = { n: 10, k: 3 };

const orderedQ = (rng) => { const n = rng.int(6, 12), k = rng.int(2, 4); return { type: 'number', q: `In how many ways can ${n} runners fill 1st, 2nd${k > 2 ? ', 3rd' : ''}${k > 3 ? ' and 4th' : ''} place (${k} places, order matters)?`, answer: P(n, k), hints: [`${n} choices for 1st, then ${n - 1} for 2nd, …`], explain: `${Array.from({ length: k }, (_, i) => n - i).join(' × ')} = ${P(n, k)}.` }; };
const chooseQ = (rng) => { const n = rng.int(6, 14), k = rng.int(2, 4); return ivq(`A committee of ${k} is chosen from ${n} people. How many committees? Type your interval.`, C(n, k), `Ordered: ${P(n, k)}; each committee was counted ${k}! = ${fact(k)} times, so ${P(n, k)} ÷ ${fact(k)} = ${C(n, k)}. Exact: a point.`, ['Count ordered picks first.', `Divide by ${k}!: the orderings of the same ${k} people.`]); };
const wordQ = (rng) => { const w = rng.pick(['BANANA', 'LETTER', 'PEPPER', 'COFFEE', 'ABACUS', 'TOMATO']); return { type: 'number', q: `How many distinct arrangements are there of the letters of ${w}?`, answer: arr(w), hints: [`${w.length}! = ${fact(w.length)} orderings of the letters as if all were different.`, `Divide by ${repText(w)}.`], explain: `${fact(w.length)} ÷ (${reps(w).map(([, k]) => `${k}!`).join(' × ')}) = ${arr(w)}.` }; };
const gridQ = (rng) => { const a = rng.int(2, 6), b = rng.int(2, 6); return { type: 'number', q: `Shortest paths from (0, 0) to (${a}, ${b}) moving only right or up?`, answer: C(a + b, a), hints: [`Every path has ${a + b} moves, ${a} of them right.`, `Choose which ${a} moves are right: C(${a + b}, ${a}).`], explain: `C(${a + b}, ${a}) = ${C(a + b, a)}.` }; };
const suitQ = (rng) => { const k = rng.int(0, 3); return { type: 'number', q: `How many 5-card hands contain exactly ${k} heart${k === 1 ? '' : 's'}?`, answer: C(13, k) * C(39, 5 - k), hints: ['Choose the hearts from 13 and the other cards from 39, then multiply.', `C(13, ${k}) = ${C(13, k)}; C(39, ${5 - k}) = ${num(C(39, 5 - k))}.`], explain: `${C(13, k)} × ${num(C(39, 5 - k))} = ${num(C(13, k) * C(39, 5 - k))}.` }; };
const sizeQ = (rng) => {
  const [n, k] = rng.pick([[30, 5], [40, 4], [25, 6], [48, 5]]), v = C(n, k), est = Math.round(v * rng.pick([0.98, 1.01, 1.03]));
  const opt = [Math.round(est / B3.f), Math.round(est * B3.f)];
  return { hinge: true, ...mc({ q: `C(${n}, ${k}) is too long to finish exactly in the time. Your careful rounded estimate is ${num(est)}, good to about 3%. What do you type?`, right: `[${num(opt[0])}, ${num(opt[1])}]`, wrong: [
    [`[${num(est)}, ${num(est)}]`, 'a point on an estimate: rounding makes it miss'],
    [`[${num(Math.round(est / 3))}, ${num(est * 3)}]`, 'panic width: a hit scores about 0.11'],
    [`[${num(Math.round(est * 0.999))}, ${num(Math.round(est * 1.001))}]`, 'a 0.1% band for a 3% estimate']],
    explain: `About ×/÷ ${dec(B3.f, 3)} around ${num(est)}. (Exact: ${num(v)}.)` }, rng) };
};

export default {
  id: 'iv/combinatorics',
  book: 'iv',
  kind: 'family',
  family: 'combinatorics',
  title: 'Counting: combinations and arrangements',
  summary: 'Count ordered choices, then divide by the orderings that do not matter (k! for a committee, repeat factorials for letters). Small counts are exact; big ones get a 3 to 6% band.',
  prerequisites: ['prob/counting', 'iv/estimation-tricks'],
  objectives: [
    'Count committees, arrangements with repeated letters, grid paths and hands with exactly k of a suit',
    'Decide between a point (small, exact) and a 3 to 6% band (big, estimated)',
    'Explain why dividing by k! turns ordered picks into unordered choices',
    'Avoid the classic slips: order counted twice, repeats not divided out, "and" added instead of multiplied',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: how many distinct arrangements are there of the letters of ${CH.w}? Find two ways, then type an interval.`,
      attempts: [
        { id: 'listing', label: 'Tried to list them', approach: `Started writing ${CH.w}, LETTRE, LETERT, … and lost track.`, breaksAt: 'Hundreds of words cannot be listed in a minute: count orderings instead.' },
        { id: 'noreps', label: 'Used 6! = 720', approach: `Counted every ordering of the ${CH.w.length} letters: ${CH.all}.`, breaksAt: 'Swapping the two Ts, or the two Es, gives the same word: divide by 2! for each.' },
        { id: 'band', label: 'Typed a range', approach: 'Estimated "a few hundred" and typed [100, 500].', breaksAt: 'A count this small is exact: compute it and type a point.' },
      ],
      answer: `${CH.all} ÷ (2! × 2!) = ${CH.n}, typed [${CH.n}, ${CH.n}]`,
      explain: `Treat the letters as different: ${CH.w.length}! = ${CH.all} orderings. Each word is then counted 2! × 2! = 4 times (swap the Ts, swap the Es), so ${CH.n} distinct words.` },
    { type: 'text', text: 'The cue: "In how many ways …" or "How many distinct …". Committees chosen from a group, arrangements of a word\'s letters, shortest paths on a grid, or card hands with exactly k of a suit. The answer is a whole number of ways. The first question to ask is always the same: does the order of the chosen things matter?' },
    { type: 'list', items: ['"In how many ways can a committee of 4 be chosen from 12 people?"', '"How many distinct arrangements are there of the letters of MISSISSIPPI?"', '"How many 5-card hands contain exactly 2 hearts?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question belongs to this lesson?', right: 'How many ways to choose 3 of 9 books', wrong: [['P(3 books drawn are all red), in percent', 'a probability: iv/prob-exact'], ['Expected number of red books in 3 draws', 'an expected value: iv/expected-dice style'], ['How many boxes to collect all 9 books', 'a waiting time: iv/coupon']], explain: 'A count of ways, with no probability attached.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Counting questions test two things at once: can you set up the count, and do you know when to stop computing? Small counts are exact and worth a full point; big counts (C(40, 6), MISSISSIPPI) take too long to finish exactly, and a careful estimate with a narrow band beats an unfinished exact attempt. Most errors are not arithmetic: they are counting the same selection several times, or forgetting that it was.' },

    sec('anchor'),
    { type: 'text', text: 'From the counting lesson: ordered choices multiply (n × (n − 1) × … for k picks). **One change**: when order does not matter, every selection has been counted once per internal ordering, so divide those orderings out.' },
    { type: 'check', scope: 'ordered choices', questions: [{ make: orderedQ }] },

    sec('picture'),
    { type: 'text', text: `A shortest path from one corner of a grid to the other is a string of moves: ${GP.a} rights and ${GP.b} ups in some order. Choosing the path is choosing which ${GP.a} of the ${GP.a + GP.b} moves are rights.` },
    { type: 'diagram', diagram: 'grid', spec: { rows: GP.b + 1, cols: GP.a + 1, rowTitle: 'up', colTitle: 'right', highlight: pathCells, count: pathCells.length }, caption: `One shortest path (highlighted) from the bottom-left point to the top-right: moves ${moves.split('').join(' ')}. Every path uses ${GP.a} R and ${GP.b} U; there are C(${GP.a + GP.b}, ${GP.a}) = ${GP.n} of them.` },
    { type: 'check', scope: 'paths as choices of positions', questions: [{ make: gridQ }] },
    { type: 'text', text: 'Small values of C(n, k) are worth recognising on sight. Pascal\'s triangle holds them all, and its symmetry halves the work: choosing k to keep is the same as choosing n − k to leave out.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['n', ...Array.from({ length: 9 }, (_, k) => `k=${k}`)], rows: PASCAL.map((r, n) => [String(n), ...r]) }, caption: 'C(n, k) for n up to 8 (Pascal\'s triangle): each entry is the sum of the two above it, and every row is symmetric, C(n, k) = C(n, n − k).' },
    { type: 'check', scope: 'reading C(n, k)', questions: [
      mc({ q: 'Which equals C(8, 5)?', right: 'C(8, 3)', wrong: [['C(8, 4)', 'the symmetric partner of 5 in a row of 8 is 3, not 4'], ['C(5, 3)', 'swapped n and k'], ['8 × 5', 'multiplied instead of choosing']], explain: `Choosing 5 to keep is choosing 3 to leave out: C(8, 5) = C(8, 3) = ${C(8, 3)}.` }),
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'C(10, k)', xLabel: 'k', yLabel: 'ways', categories: Array.from({ length: 11 }, (_, k) => String(k)), series: [{ name: 'C(10, k)', values: Array.from({ length: 11 }, (_, k) => C(10, k)) }], valueLabels: true }, caption: `Counts peak in the middle (C(10, 5) = ${C(10, 5)}) and fall symmetrically. Choosing few or almost all is quick to count; choosing half is the biggest number.` },
    { type: 'check', scope: 'symmetry of C(n, k)', questions: [
      { make: (rng) => { const n = rng.int(9, 16), k = rng.int(n - 3, n - 1); return { type: 'number', q: `Compute C(${n}, ${k}) (use the symmetry first).`, answer: C(n, k), hints: [`C(${n}, ${k}) = C(${n}, ${n - k}).`], explain: `C(${n}, ${n - k}) = ${C(n, n - k)}.` }; } },
    ] },

    sec('derivation'),
    { type: 'text', text: 'Six moves. The first two build the committee count from ordered picks; the next three apply the same idea to words, paths and hands; the last decides how to type the number. Every count here is "ordered count, divided by the orderings that do not matter".' },
    { type: 'steps', steps: [
      { answers: 'listing', say: 'Count ordered choices: n × (n − 1) × … × (n − k + 1) for k picks; n! for arranging all n.', why: 'Each position is filled from what is left; the choices multiply.',
        checks: [{ make: orderedQ }] },
      { say: 'Order does not matter: divide by k!. That gives C(n, k) = n(n − 1)…(n − k + 1) / k!.', why: 'Each unordered group of k was counted once for every one of its k! orderings.',
        checks: [{ make: chooseQ }] },
      { answers: 'noreps', say: 'Repeated letters: n! divided by the factorial of each letter\'s count.', why: 'Swapping identical letters gives the same word, so each word was counted that many times.',
        checks: [{ make: wordQ }] },
      { say: 'Grid paths: C(a + b, a), the ways to choose which of the a + b moves go right.', why: 'A path is fixed once you know where its rights are.',
        checks: [{ make: gridQ }] },
      { say: 'Two independent choices ("exactly k hearts" means k hearts AND 5 − k others): multiply the counts.', why: 'Every choice of hearts pairs with every choice of the rest.',
        checks: [{ make: suitQ }] },
      { answers: 'band', say: `Decide how to type it. Small counts (up to a few thousand, or quick to finish): exact, a point. Big ones you cannot finish: round the factors, and type ×/÷ ${dec(B3.f, 2)} to ${dec(B6.f, 2)}.`, why: 'A point on a sloppy big product misses; a band on an exact small count wastes points.',
        checks: [{ make: sizeQ }] },
    ] },
    { type: 'explain', prompt: 'Why does dividing by k! turn ordered picks into committees?', model: 'Ordered picking counts the committee {A, B, C} once for every order the three could be picked in: ABC, ACB, BAC, BCA, CAB, CBA. That is 3! = 6 times, and the same holds for every committee. So the ordered count is exactly k! times the number of committees, and dividing by k! leaves each committee counted once.', points: ['Ordered picking counts each group once per ordering', 'Every group has exactly k! orderings', 'So committees = ordered count ÷ k!'] },

    sec('worked'),
    { type: 'worked', family: 'combinatorics', section: 'iv', difficulty: 2, seed: 'a', explainAt: [0], intro: 'A small count. Set it up, compute it, and decide what to type.' },
    { type: 'worked', family: 'combinatorics', section: 'iv', difficulty: 3, seed: 'c', fade: 1, intro: 'A bigger count. The set-up is given; how to type it is yours.' },
    { type: 'thinkaloud', problem: `How many 5-card hands from a standard deck contain exactly ${HT.k} hearts?`, lines: [
      { t: 0, say: `I see "exactly ${HT.k} hearts": two independent choices, hearts and non-hearts. Multiply.` },
      { t: 4, say: `Hearts: C(13, ${HT.k}) = ${HT.a}.` },
      { t: 9, say: `Others: C(39, ${5 - HT.k}) = 39 × 38 × 37 = ${num(HT.wrongB)}.`, slip: true },
      { t: 14, say: `No: that is ordered. Divide by ${5 - HT.k}! = ${fact(5 - HT.k)}: ${num(HT.b)}.` },
      { t: 22, say: `${HT.a} × ${num(HT.b)} = ${num(HT.n)}. Check: all hands are C(52, 5) = ${num(C(52, 5))}, and about a quarter to a third of them having exactly ${HT.k} hearts is plausible.` },
      { t: 34, say: `The multiplication was long; I allow 3%: about [${num(Math.round(HT.n / B3.f))}, ${num(Math.round(HT.n * B3.f))}].` },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Which is bigger: the number of ways to choose 3 people from 10, or to choose 7 people from 10?', answer: `They are equal: C(10, 3) = C(10, 7) = ${C(10, 3)}.`, explain: 'Choosing who is in is the same as choosing who is out.' },

    sec('traps'),
    { type: 'traps', family: 'combinatorics', section: 'iv', extra: [
      { belief: 'A committee count is n × (n − 1) × … with no division.', fix: 'That counts ordered picks: divide by k!.' },
      { belief: 'Repeated letters do not matter.', fix: 'Divide by the factorial of each repeat count.' },
      { belief: '"Exactly k of this AND the rest of that" adds the counts.', fix: 'AND multiplies: every choice of one pairs with every choice of the other.' },
      { belief: 'A small exact count still deserves a band.', fix: 'If you finished it cleanly, type the point.' },
    ] },
    { type: 'erroneous', problem: `A candidate counts 5-card hands with exactly ${HT.k} hearts. One step is wrong.`, steps: [
      `Choose the hearts: C(13, ${HT.k}) = ${HT.a}.`,
      `Choose the other ${5 - HT.k} cards from 39: 39 × 38 × 37 = ${num(HT.wrongB)}.`,
      `Multiply: ${HT.a} × ${num(HT.wrongB)} = ${num(HT.a * HT.wrongB)}.`,
      'Type a 3% band around it.',
    ], errorStep: 1, explain: `The non-hearts are an unordered set: divide by ${5 - HT.k}! = ${fact(5 - HT.k)}, giving C(39, ${5 - HT.k}) = ${num(HT.b)}. The count is ${num(HT.n)}; the wrong one is ${fact(5 - HT.k)} times too big, and bigger than all C(52, 5) = ${num(C(52, 5))} hands, which a sanity check would catch.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate counts committees of 3 from 10 as 10 × 9 × 8 = 720. Which belief?', right: 'Committees are ordered picks', wrong: [['Repeated letters do not matter', 'no letters here'], ['"And" adds instead of multiplies', 'nothing was added'], ['A small count deserves a band', 'this is about the count, not the band']], explain: `720 counts each committee 3! = 6 times: ${C(10, 3)} committees.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Cancel before multiplying: C(12, 4) = (12 × 11 × 10 × 9)/(4 × 3 × 2 × 1) = 11 × 5 × 9 = ${C(12, 4)}. Use C(n, k) = C(n, n − k) to keep k small. Worth knowing: C(52, 5) = ${num(C(52, 5))}, C(n, 2) = n(n − 1)/2.` },
    { type: 'callout', tone: 'speed', text: 'Big counts: work in powers of ten. C(40, 6) ≈ 40^{6}/720 × a correction (the top factors shrink): write each factor, round, and track the ledger as in mental products.' },
    { type: 'check', scope: 'cancelling first', questions: [{ make: chooseQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `Count ordered, divide by orderings that do not matter (k! or repeat factorials); independent parts multiply; grid paths C(a + b, a). Small → exact point; big → rounded estimate, ×/÷ ${dec(B3.f, 2)} to ${dec(B6.f, 2)}.` },

    sec('contrast'),
    { type: 'compare', columns: ['Situation', 'Order matters?', 'Count', 'Example'], rows: [
      ['podium places', 'yes', 'n(n − 1)…(n − k + 1)', `10 runners, 3 places: ${P(10, 3)}`],
      ['committee', 'no', 'C(n, k)', `3 of 10: ${C(10, 3)}`],
      ['word with repeats', 'identical letters', 'n! / (repeat factorials)', `BANANA: ${arr('BANANA')}`],
      ['grid path', 'positions of rights', 'C(a + b, a)', `(4, 3): ${GP.n}`],
    ] },
    { type: 'variation', base: `Base: a committee of ${VB.k} from ${VB.n} people: C(${VB.n}, ${VB.k}) = ${C(VB.n, VB.k)}.`, rows: [
      { change: 'The three get roles: chair, secretary, treasurer', effect: `Order now matters: ${VB.n} × ${VB.n - 1} × ${VB.n - 2} = ${P(VB.n, VB.k)}, which is ${VB.k}! times the committee count.` },
      { change: `${VB.n} people become ${VB.n + 1}`, effect: `C(${VB.n + 1}, ${VB.k}) = ${C(VB.n + 1, VB.k)}: one more candidate adds the committees that include them, C(${VB.n}, ${VB.k - 1}) = ${C(VB.n, VB.k - 1)}.` },
      { same: true, change: `Choose ${VB.n - VB.k} instead of ${VB.k}`, effect: `No change: C(${VB.n}, ${VB.n - VB.k}) = C(${VB.n}, ${VB.k}) = ${C(VB.n, VB.k)}. Choosing who is in fixes who is out.` },
      { fusion: true, change: `Roles are given AND there are ${VB.n + 1} people`, effect: `Both raise the count: ${VB.n + 1} × ${VB.n} × ${VB.n - 1} = ${P(VB.n + 1, VB.k)}, ordered picks from the bigger group.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: C(n, 0) = C(n, n) = 1 (choose nobody, or everybody). A word with all letters different is plain n!. A hand with 0 hearts is C(39, 5), not zero. A word with one letter repeated three times divides by 3! = 6, not by 3.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: every probability count in Beat the Odds (hands, coin sequences with exactly k heads, grid walks) is one of these counts divided by a total. "Choose positions for one kind" counts binary strings, paths and heads alike.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'How many 5-card hands contain no hearts?', right: `C(39, 5) = ${num(C(39, 5))}`, wrong: [['0: no hearts means no hand', 'a hand of five non-hearts is still a hand'], [`C(13, 0) = 1`, 'counted only the (empty) choice of hearts'], [`C(52, 5) − 13 = ${num(C(52, 5) - 13)}`, 'subtracted the hearts instead of choosing from the non-hearts']], explain: 'All five cards come from the 39 non-hearts.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(8, 14), k = rng.int(2, 4); return ivq(`A pizza place offers ${n} toppings. How many different pizzas have exactly ${k} toppings? Type your interval.`, C(n, k), `C(${n}, ${k}) = ${P(n, k)} ÷ ${fact(k)} = ${C(n, k)}. Exact: a point.`); } },
      far: { type: 'number', q: 'Outside the OA: how many 10-bit binary strings contain exactly 4 ones?', answer: C(10, 4), explain: `Choose the positions of the 4 ones among 10: C(10, 4) = ${C(10, 4)}, the same count as grid paths with 4 rights and 6 ups.` },
      principle: mc({ q: 'Which idea carried over from grid paths to binary strings?', right: 'Choose positions for one kind; the rest are forced', wrong: [['Divide by the repeat factorial of every letter', 'that also works, but the shared idea is choosing positions'], ['Multiply independent choices', 'there was only one choice to make'], ['Ordered picks with no division', 'order within the chosen positions does not matter']], explain: 'A path is fixed by where its rights go; a string by where its ones go: C(n, k) both times.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'combinatorics', section: 'iv', count: 3 },
  ],
};
