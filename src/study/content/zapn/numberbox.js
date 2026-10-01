// Zap-N game lesson: NumberBox (arithmetic search). Every expression is checked with the engine's
// exact parser and every "can this be made?" answer comes from its exhaustive solver
// (src/zapn/numberbox/engine.js).
import { Q } from '../../../core/rational.js';
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { DEFAULTS, solve, check, generateRound } from '../../../zapn/numberbox/engine.js';
import { sec, mc } from './balloon.js';

const TARGET = ZAPN_TARGETS.numberbox.value;
const without = (nums, n) => { const r = [...nums]; r.splice(r.indexOf(n), 1); return r; };
const canMake = (nums, v) => Number.isInteger(v) && !!solve(nums).get(String(v));
const madeBy = (nums, v) => solve(nums).get(String(v))?.e;
// Values two numbers can make: a+b, a×b, a−b, b−a, a÷b, b÷a (distinct, exact).
const pairValues = (a, b) => { const A = Q.of(a), B = Q.of(b); const vs = [A.add(B), A.mul(B), A.sub(B), B.sub(A), ...(b ? [A.div(B)] : []), ...(a ? [B.div(A)] : [])]; return [...new Map(vs.map((v) => [v.toString(), v])).values()]; };
// Backwards: the four "X op n = T" subgoals for last number n.
const subgoals = (T, n) => [['−', T - n, `${T} − ${n}`], ['+', T + n, `${T} + ${n}`], ['÷', T / n, `${T} ÷ ${n}`], ['×', T * n, `${T} × ${n}`]];
const OPNAME = { '−': 'added', '+': 'subtracted', '÷': 'multiplied by', '×': 'divided by' };

const CH = { nums: [4, 3, 2, 7], target: 52, expr: '(7 + 3 × 2) × 4' };
const WK = { nums: [7, 2, 4, 8], target: 62, expr: '(8 + 7) × 4 + 2' };
const FR = { nums: [8, 3, 8, 3], target: 24, expr: '8 ÷ (3 − 8 ÷ 3)' };
const HARD = { nums: [2, 9, 4, 7], target: 36 };
const branchTable = (P) => [...new Set(P.nums)].map((n) => [String(n), ...subgoals(P.target, n).map(([, v]) => (Number.isInteger(v) && v > 0 ? `${v} ${canMake(without(P.nums, n), v) ? '✓' : '✗'}` : `${Number.isInteger(v) ? v : 'fraction'} ✗`))]);
const liveBranches = (P) => [...new Set(P.nums)].flatMap((n) => subgoals(P.target, n).filter(([, v]) => canMake(without(P.nums, n), v)).map(([op, v]) => ({ n, op, v })));
const CHlive = liveBranches(CH);
const RULE28 = solve([2, 7, 5, 1]).get('28').e;
HARD.live = liveBranches(HARD);
HARD.answer = `${madeBy(without(HARD.nums, HARD.live[0].n), HARD.live[0].v)} ${HARD.live[0].op === '−' ? '+' : '−'} ${HARD.live[0].n}`;

const pairQ = (rng) => { const a = rng.int(2, 9), b = rng.int(1, 9); const vs = pairValues(a, b); return { type: 'number', q: `How many different values can you make from ${a} and ${b} with one operation (+, −, ×, ÷, either order)?`, answer: vs.length, hints: ['There are six candidates: a + b, a × b, a − b, b − a, a ÷ b, b ÷ a.', 'Cross out any that coincide.'], explain: `${vs.map(String).join(', ')}: ${vs.length} distinct.` }; };
const subgoalQ = (rng) => {
  for (;;) {
    const r = generateRound(rng, rng.int(0, 6)), n = rng.pick(r.nums);
    const [op, v, text] = rng.pick(subgoals(r.target, n).filter(([o, x]) => o !== '×' && Number.isInteger(x) && x > 0));
    return { type: 'number', q: `Target ${r.target} from ${r.nums.join(', ')}. Suppose ${n} is used last and ${OPNAME[op]} at the end. What must the other three numbers make?`, answer: v, hints: ['Undo the last step.', `Undo "${OPNAME[op]} ${n}".`], explain: `${text} = ${v}: then ${v} ${op === '−' ? '+' : op === '+' ? '−' : '×'} ${n} = ${r.target}.` };
  }
};
const lastStepQ = (rng) => {
  for (;;) {
    const r = generateRound(rng, rng.int(3, 8));
    const live = [], dead = [];
    for (const n of new Set(r.nums)) for (const [op, v] of subgoals(r.target, n)) {
      if (!(Number.isInteger(v) && v > 0 && v < 1000)) continue;
      const rest = without(r.nums, n), text = `${op} ${n}: make ${v} from ${rest.join(', ')}`;
      (canMake(rest, v) ? live : dead).push({ text, v, rest });
    }
    if (!live.length || dead.length < 3) continue;
    const L = live[0];
    return mc({ q: `Target ${r.target} from ${r.nums.join(', ')}. Which last step leaves a three-number problem that can be solved?`, right: L.text,
      wrong: rng.shuffle(dead).slice(0, 3).map((d) => [d.text, `${d.v} cannot be made from ${d.rest.join(', ')}: a subgoal is only alive if the other three can reach it`]),
      explain: `${L.v} = ${madeBy(L.rest, L.v)}, so ${L.text.split(':')[0]} solves it.` }, rng);
  }
};
const exprQ = (rng) => {
  for (;;) {
    const r = generateRound(rng, rng.int(0, 6));
    const e = r.solution;
    const wrong = [];
    const flat = e.replace(/[()]/g, '');
    if (flat !== e) { const c = check(r.nums, r.target, flat); if (!c.ok && c.valid) wrong.push([flat, `dropped the brackets: × and ÷ go before + and −, so it makes ${c.value}`]); }
    const ns = e.match(/\d+/g), uniq = [...new Set(r.nums)];
    if (uniq.length > 1) {
      const a = ns[0], b = uniq.find((x) => String(x) !== a);
      const twice = e.replace(new RegExp(`\\b${a}\\b`), String(b));
      const c = check(r.nums, r.target, twice);
      if (!c.ok && twice !== e) wrong.push([twice, `swaps a ${a} for a ${b}: each of ${r.nums.join(', ')} must be used exactly once`]);
    }
    const near = [...solve(r.nums).entries()].find(([k]) => /^\d+$/.test(k) && Math.abs(+k - r.target) <= 3 && +k !== r.target);
    if (near) wrong.push([near[1].e, `makes ${near[0]}, not ${r.target}: check the value, not just the shape`]);
    if (wrong.length < 2) continue;
    return mc({ q: `Make ${r.target} from ${r.nums.join(', ')}. Which expression is right?`, right: e, wrong, explain: `${e} = ${r.target}, each number once.` }, rng);
  }
};
const factorQ = (rng) => {
  for (;;) {
    const a = rng.int(3, 9), b = rng.int(3, 9), T = a * b;
    if (T < DEFAULTS.minTarget || a === b) continue;
    const pairs = [];
    for (let x = 2; x <= 9; x++) if (T % x === 0 && T / x <= 9 && x <= T / x) pairs.push(`${x} × ${T / x}`);
    return mc({ q: `Target ${T}. Which is a factor pair of single digits?`, right: pairs[0], wrong: [[`${a} × ${b + 1}`, `that is ${a * (b + 1)}: recheck the product`], [`${a + 1} × ${b}`, `that is ${(a + 1) * b}: recheck the product`], [`${T / 2} × 2`, `${T / 2} is not a single digit`]].filter(([v]) => !pairs.includes(v)), explain: `${pairs.join(' and ')} ${pairs.length > 1 ? 'give' : 'gives'} ${T}.` }, rng);
  }
};

export default {
  id: 'zapn/numberbox',
  book: 'zapn',
  kind: 'game',
  game: 'numberbox',
  title: 'NumberBox: work backwards from the target',
  summary: 'Undo the last step: try target ÷ n and target ± n for each number, recurse on three numbers, finish with the six results of two numbers.',
  prerequisites: [],
  objectives: [
    'State the rules exactly: each number once, + − × ÷ and brackets, exact fractions allowed',
    'List the at most six values two numbers can make',
    'Search backwards: turn the target into a three-number subgoal for each possible last number',
    `Hit the target: at least ${TARGET} of ${DEFAULTS.rounds} rounds made`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. Make ${CH.target} from ${CH.nums.join(', ')}, using each number exactly once with +, −, ×, ÷ and brackets. Try two different ways in.`, answer: `${CH.expr} = ${CH.target}.`, explain: `Forwards, you combine pairs and hope. Backwards, you ask what the last step was: ${CH.target} ÷ 4 = 13, and 13 from 3, 2, 7 is 7 + 3 × 2. If your forward search wandered, keep it in mind: the lesson counts how many forward paths there are.`,
      attempts: [
        { id: 'forward', label: 'Combine numbers forwards', approach: `Tried pairs of numbers and operations until something reached ${CH.target}.`, breaksAt: 'There are hundreds of expression trees and nothing says which one is close.' },
        { id: 'integers', label: 'Keep every step whole', approach: 'Only tried operations that give whole numbers along the way.', breaksAt: `Some targets need a fraction in the middle, such as ${FR.expr} = ${FR.target}.` },
      ] },
    { type: 'text', text: `NumberBox is the arithmetic game of Zap-N. Four numbers and a target: combine **all four**, each exactly once, with +, −, ×, ÷ and brackets, to hit the target exactly. ${DEFAULTS.rounds} rounds, getting harder; wrong answers can be retried, and Skip shows a solution and moves on. This trainer draws numbers from 1 to 9 and targets from ${DEFAULTS.minTarget} to ${DEFAULTS.maxTarget}; every round is solvable.` },
    { type: 'text', text: `Arithmetic is exact and follows the usual order: × and ÷ before + and −, brackets first. So fractions in the middle are fine: ${FR.expr} = ${FR.target}. You may not glue digits together (2 and 7 are never 27). Score: targets made. Target: ${TARGET} of ${DEFAULTS.rounds}.` },
    { type: 'check', scope: 'the rules', questions: [
      { type: 'choice', q: 'Numbers 2, 7, 5, 1, target 28. Which answer is accepted?', options: ['7 × (5 − 1)', RULE28, '27 + 1', '(2 + 5) × (7 − 1)'], answer: 1, traps: { 0: 'leaves 2 out: all four numbers must be used', 2: 'glues 2 and 7 into 27 and leaves 5 out', 3: `uses every number once but makes ${check([2, 7, 5, 1], 28, '(2 + 5) × (7 − 1)').value}` }, explain: `${RULE28} = 28, each number once.` },
      mc({ q: `Is ${FR.expr} an accepted answer for ${FR.target} from ${FR.nums.join(', ')}?`, right: 'yes', at: 0, wrong: [['no: 8 ÷ 3 is not a whole number', 'intermediate fractions are allowed; arithmetic is exact']], explain: `8 ÷ 3 = 8/3, 3 − 8/3 = 1/3, 8 ÷ 1/3 = ${FR.target}.` }),
    ] },

    sec('why'),
    { type: 'text', text: 'Backing a fair price out of a few quoted numbers is a search: which combination gives the number you need? NumberBox measures whether you search with structure instead of trying combinations at random. With four numbers the forward tree has hundreds of branches; the backward view usually has one or two live ones.' },

    sec('anchor'),
    { type: 'text', text: 'You know the 24 game: four cards, make 24. NumberBox is the 24 game with **one change**: the target moves every round. That change kills memorised patterns and rewards a method. The method is to work **backwards**: ask what the last step was, the way you solve an equation by undoing the outermost operation.' },
    { type: 'check', scope: 'undoing a last step', questions: [{ make: subgoalQ }] },

    sec('picture'),
    { type: 'text', text: 'Two numbers are the base case: they make at most six values, a + b, a × b, a − b, b − a, a ÷ b and b ÷ a.' },
    { type: 'check', scope: 'the six values of two numbers', questions: [{ make: pairQ }] },
    { type: 'text', text: `Now the whole search for the challenge, backwards. For each number n that could come last, the other three must make target − n, target + n, target ÷ n or target × n. The solver checks each subgoal.` },
    { type: 'diagram', diagram: 'table', spec: { columns: ['Last number n', `${CH.target} − n`, `${CH.target} + n`, `${CH.target} ÷ n`, `${CH.target} × n`], rows: branchTable(CH) }, caption: `16 possible last steps, ${CHlive.length} alive (✓ = the other three numbers can make it). The live one is ÷ ${CHlive[0].n}: make ${CHlive[0].v} from ${without(CH.nums, CHlive[0].n).join(', ')}.` },
    { type: 'check', scope: 'reading the backward table', questions: [
      mc({ q: `From the table: which last step solves ${CH.target} from ${CH.nums.join(', ')}?`, right: `÷ 4, then make 13 from 3, 2, 7`, at: 2, wrong: [['− 4, then make 48 from 3, 2, 7', '48 cannot be made from 3, 2, 7 (the table marks it ✗)'], ['− 2, then make 50 from 4, 3, 7', '50 cannot be made from 4, 3, 7'], ['× 3, then make 156 from 4, 2, 7', 'a subgoal far above the target needs huge products; it is dead']], explain: `Only ${CH.target} ÷ 4 = 13 is alive, and 13 = 7 + 3 × 2.` }),
    ] },
    { type: 'diagram', diagram: 'zapn-numberbox', spec: { nums: CH.nums, target: CH.target, back: [{ from: 52, undo: '×', n: 4, to: 13 }, { from: 13, undo: '+', n: 7, to: 6 }], steps: [{ a: 3, op: '×', b: 2, r: 6 }, { a: 7, op: '+', b: 6, r: 13 }, { a: 13, op: '×', b: 4, r: 52 }], expr: CH.expr }, caption: 'Backwards to find the route (52 = 13 × 4, 13 = 6 + 7, 6 = 3 × 2), forwards to write the answer.' },
    { type: 'check', scope: 'from subgoals to an expression', questions: [
      mc({ q: 'You found 52 = 13 × 4 and 13 = 7 + 3 × 2. How do you type it?', right: CH.expr, at: 1, wrong: [['7 + 3 × 2 × 4', `no brackets: × goes first, so it makes ${check(CH.nums, CH.target, '7 + 3 × 2 × 4').value}`], ['(7 + 3) × 2 × 4', `brackets in the wrong place: it makes ${check(CH.nums, CH.target, '(7 + 3) × 2 × 4').value}`]], explain: 'Bracket the subgoal: (7 + 3 × 2) × 4.' }),
    ] },

    sec('derivation'),
    { type: 'steps', steps: [
      { say: 'Base case: two numbers a and b make at most six values: a + b, a × b, a − b, b − a, a ÷ b, b ÷ a.', why: 'Every expression ends with one operation joining two parts. With two numbers, those six are all there is.',
        checks: [{ make: pairQ }] },
      { answers: 'forward', say: 'Backwards: the last step is (something from three numbers) op n. For each n, the three others must make target − n, target + n, target ÷ n or target × n.', why: 'Undoing the last operation turns a four-number problem into a three-number one.',
        checks: [{ make: subgoalQ }] },
      { say: 'Test each subgoal quickly and drop the dead ones: a whole-number subgoal near the size three single digits can reach is worth trying first.', why: 'Most of the 16 branches are dead; a quick size check kills them without work.',
        checks: [{ make: lastStepQ }] },
      { say: 'Recurse: a three-number subgoal is the same problem again. Pick its last number, undo, and land on two numbers, then read the six values.', why: 'Each level removes one number, so three levels of undoing reach the base case.',
        checks: [mc({ q: 'You need 13 from 3, 2, 7. Which works?', right: '7 + 3 × 2', at: 0, wrong: [['3 × 2 + 7 + 0', 'there is no 0 to use'], ['(7 + 3) × 2', 'that makes 20'], ['7 × 2 − 3', `that makes ${7 * 2 - 3}`]], explain: '7 + 6 = 13, with 6 = 3 × 2.' })] },
      { say: 'Big targets are almost always a product plus or minus a little: look at factor pairs of the target and of target ± each number.', why: 'Single digits reach 60 or more only through multiplication, so the last step is often "product ± leftover".',
        checks: [{ make: factorQ }] },
      { answers: 'integers', say: `If no branch lives, try a fraction in the middle: a small divisor like 1/3 multiplies back to a whole number. ${FR.expr} = ${FR.target}.`, why: 'Exact arithmetic keeps 8/3 and 1/3 exact, so division can build values that no whole-number route reaches.',
        checks: [mc({ q: `In ${FR.expr}, what does the bracket (3 − 8 ÷ 3) equal?`, right: '1/3', at: 1, wrong: [['1', 'rounded 8 ÷ 3 to 2: arithmetic is exact, 8 ÷ 3 stays 8/3'], ['−5/3', 'did 3 − 8 first: ÷ goes before −']], explain: '3 − 8/3 = 9/3 − 8/3 = 1/3, and 8 ÷ 1/3 = 24.' })] },
    ] },
    { type: 'diagram', diagram: 'zapn-numberbox', spec: { nums: FR.nums, target: FR.target, steps: [{ a: 8, op: '÷', b: 3, r: '8/3' }, { a: 3, op: '−', b: '8/3', r: '1/3' }, { a: 8, op: '÷', b: '1/3', r: 24 }], expr: FR.expr }, caption: 'The fraction route, one combination at a time: 8/3, then 1/3, then 8 ÷ 1/3 = 24. No whole-number route reaches 24 from these four.' },
    { type: 'check', scope: 'dividing by a fraction', questions: [
      { make: (rng) => { const a = rng.int(2, 9), k = rng.int(2, 5); return { type: 'number', q: `What is ${a} ÷ (1/${k})?`, answer: a * k, explain: `Dividing by 1/${k} multiplies by ${k}: ${a * k}.` }; } },
    ] },
    { type: 'explain', prompt: 'Why does working backwards from the target beat combining the numbers forwards?', model: 'Forwards, every pair of numbers and every operation opens a new branch, so the tree has hundreds of paths and nothing tells you which is close. Backwards, the target fixes the last step: for each number there are only four subgoals, most of them are clearly impossible, and the live one is a smaller problem of the same kind.', points: ['Forward search branches over hundreds of trees with no guidance', 'The target suggests the last step: target ± n, ÷ n, × n', 'Each undo leaves a smaller problem, down to two numbers'] },

    sec('worked'),
    { type: 'text', text: `A medium round: ${WK.target} from ${WK.nums.join(', ')}.` },
    { type: 'diagram', diagram: 'zapn-numberbox', spec: { nums: WK.nums, target: WK.target, back: [{ from: 62, undo: '+', n: 2, to: 60 }, { from: 60, undo: '×', n: 4, to: 15 }, { from: 15, undo: '+', n: 8, to: 7 }], expr: WK.expr }, caption: `Product plus leftover: ${WK.target} = 60 + 2, 60 = 15 × 4, 15 = 7 + 8.` },
    { type: 'steps', steps: [
      { say: `${WK.target} is big, so look for a product plus or minus a little. ${WK.target} is not a product of these digits, but ${WK.target} − 2 = 60 is 15 × 4.`, why: 'Undo "+ 2" first, then the target of the rest is a round product.',
        checks: [{ type: 'number', q: `Undo "+ 2": what must 7, 4, 8 make?`, answer: WK.target - 2, explain: `${WK.target} − 2 = ${WK.target - 2}.` }] },
      { say: '60 from 7, 4, 8: undo "× 4" to get 15 from 7 and 8.', why: '60 ÷ 4 is whole and 15 is within reach of two single digits.',
        checks: [mc({ q: 'Make 15 from 7 and 8.', right: '7 + 8', at: 0, wrong: [['8 × 7 ÷ 4', 'uses 4 again: 4 is already spent on the × 4'], ['8 − 7', 'that is 1']], explain: '7 + 8 = 15.' })] },
      { say: `Write it forwards with brackets: ${WK.expr}.`, why: `The solver confirms it: ${check(WK.nums, WK.target, WK.expr).ok ? 'accepted' : 'rejected'}.`,
        checks: [mc({ q: 'Which typing is accepted?', right: WK.expr, at: 1, wrong: [['8 + 7 × 4 + 2', `× first makes it ${check(WK.nums, WK.target, '8 + 7 × 4 + 2').value}`], ['(8 + 7) × (4 + 2)', `makes ${check(WK.nums, WK.target, '(8 + 7) × (4 + 2)').value}`]], explain: `${WK.expr} = ${WK.target}.` })] },
    ] },

    sec('predict'),
    { type: 'predict', question: `${HARD.target} from ${HARD.nums.join(', ')}. The factor pair 9 × 4 is tempting: "÷ 9, then make 4 from 2, 4, 7". Does that branch live? If not, which last step does?`, answer: `${canMake(without(HARD.nums, 9), 4) ? 'It lives' : 'It is dead'}. ${HARD.live.map((b) => `${b.op} ${b.n} lives: make ${b.v} from ${without(HARD.nums, b.n).join(', ')}, and ${b.v} = ${madeBy(without(HARD.nums, b.n), b.v)}`).join('; ')}. Answer: ${HARD.answer}.`, explain: `The obvious factor pair is a decoy; product plus leftover is the route. The engine accepts ${HARD.answer}: ${check(HARD.nums, HARD.target, HARD.answer).ok ? 'yes' : 'no'}.` },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'You may leave a number out if the target is reached.', fix: 'All four numbers must be used exactly once. A spare 1 can be absorbed with × 1.' },
      { belief: 'Digits can be glued: 2 and 7 make 27.', fix: 'Only the four numbers themselves, combined with + − × ÷.' },
      { belief: 'Expressions are read left to right.', fix: '× and ÷ go before + and −. Bracket every subgoal.' },
      { belief: 'Every step must give a whole number.', fix: 'Fractions in the middle are exact and allowed.' },
      { belief: 'Search forwards: try pairs until something fits.', fix: 'Hundreds of forward paths; start from the target instead.' },
    ] },
    { type: 'erroneous', problem: `A candidate makes ${CH.target} from ${CH.nums.join(', ')}. One step is wrong.`, steps: [
      `${CH.target} ÷ 4 = 13, so make 13 from 3, 2, 7.`,
      '13 = 7 + 3 × 2.',
      'Type the answer as 7 + 3 × 2 × 4.',
      'Submit.',
    ], errorStep: 2, explain: `Without brackets × goes first: 7 + 3 × 2 × 4 = ${check(CH.nums, CH.target, '7 + 3 × 2 × 4').value}. The subgoal must be bracketed: ${CH.expr}.` },
    { type: 'check', scope: 'typing a valid expression', questions: [{ make: exprQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'First 5 seconds: is the target big (needs a product) or small (sums and differences)? For a big target, list its factor pairs and those of target ± each number.' },
    { type: 'callout', tone: 'speed', text: `The game is untimed, so the only budget is your ${DEFAULTS.rounds - TARGET} allowed miss. Skip only when every branch is dead and a fraction route also fails; a skip is a round lost.` },
    { type: 'thinkaloud', problem: `Make ${WK.target} from ${WK.nums.join(', ')}.`, lines: [
      { t: 0, say: `${WK.target}: big, so a product plus or minus a little.` },
      { t: 3, say: `${WK.target} is even: ${WK.target} ÷ 2 = ${WK.target / 2}, so make ${WK.target / 2} from 7, 4, 8.`, slip: true },
      { t: 7, say: `${canMake([7, 4, 8], WK.target / 2) ? `That works: ${madeBy([7, 4, 8], WK.target / 2)}.` : `Dead end: nothing makes ${WK.target / 2} from 7, 4, 8.`} Back up: ${WK.target} − 2 = 60, and 60 is 15 × 4.` },
      { t: 10, say: '15 from 7 and 8: 7 + 8. Every number used once.' },
      { t: 13, say: `Write it with brackets: ${WK.expr}. Check: 15 × 4 = 60, plus 2 is ${WK.target}.` },
    ] },
    { type: 'check', scope: 'big targets', questions: [{ make: factorQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'NumberBox: target first. For each number n try target ± n and target ÷ n, recurse on three numbers, finish with two. Products for big targets, fractions as the last resort, brackets on every subgoal.' },

    sec('contrast'),
    { type: 'compare', columns: ['Puzzle', 'What you search', 'Direction'], rows: [
      ['NumberBox', 'expressions over four numbers', 'backwards from the target'],
      ['24 game', 'expressions, target always 24', 'patterns you can memorise'],
      ['Skyscraper', 'block moves', 'bottom-up from the target picture'],
    ] },
    { type: 'variation', base: `Make ${CH.target} from ${CH.nums.join(', ')}: ${CH.expr}.`, rows: [
      { same: true, change: 'The numbers come in a different order (7, 2, 3, 4)', effect: 'Nothing changes: order on screen never matters, the same expression works.' },
      { change: `Target ${CH.target + 4} instead of ${CH.target}`, effect: `${canMake(CH.nums, CH.target + 4) ? `Still makeable: ${madeBy(CH.nums, CH.target + 4)}` : 'Not makeable from these numbers'}; the backward table has to be redone because every subgoal moves.` },
      { fusion: true, change: 'Order shuffled to 7, 2, 3, 4 and the target becomes 28', effect: `Only the target change matters: the shuffle does nothing, the new target moves every subgoal. ${canMake(CH.nums, 28) ? `28 = ${madeBy(CH.nums, 28)}.` : 'No route exists.'}` },
      { change: 'Target 24 from 8, 3, 8, 3', effect: 'No whole-number branch lives; the answer needs a fraction in the middle, 8 ÷ (3 − 8 ÷ 3).' },
      { change: 'One of the numbers is 1', effect: 'A free move: × 1 or ÷ 1 changes nothing, + 1 or − 1 fixes an off-by-one.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: repeated numbers (8, 3, 8, 3) are separate numbers, each used once. A subgoal can be a fraction or even negative on the way. Every round in this trainer has at least one solution; the hard rounds have only one or two expression trees.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: undo the last step to shrink a problem is how you solve equations, and how first-step analysis runs a process backwards. Skyscraper plans from the target picture the same way.' },
    { type: 'transfer',
      near: { make: lastStepQ },
      far: { make: (rng) => { const a = rng.int(2, 5), b = rng.int(2, 5), c = rng.int(2, 6), x = rng.int(1, 9), T = (x + a * b) * c; return { type: 'number', q: `Solve for x: (x + ${a} × ${b}) × ${c} = ${T}.`, answer: x, hints: [`Undo the last operation first: ÷ ${c}.`, `x + ${a * b} = ${T / c}.`], explain: `${T} ÷ ${c} = ${T / c}, minus ${a * b} leaves x = ${x}.` }; } },
      principle: mc({ q: 'Which idea carried over from NumberBox to solving the equation?', right: 'undo the last operation to get a smaller problem of the same kind', at: 2,
        wrong: [['try combinations forwards until one of them happens to fit', 'guessing forwards has no signal telling you how close you are'], ['always multiply the two largest numbers together first', 'a fixed first move ignores what the target needs'], ['look for a pattern you have memorised from earlier rounds', 'every round has a new target, so patterns do not carry over']],
        explain: 'Both peel off the outermost operation and solve what is left.' }),
    },
    { type: 'check', scope: 'the variation rows', questions: [
      mc({ q: 'The four numbers are shown in a different order. What changes?', right: 'nothing', at: 0, wrong: [['the answer must use them in the shown order', 'order is never a rule; only each-number-once'], ['the target changes', 'the target is fixed for the round']], explain: 'Order on screen never matters.' }),
    ] },

    sec('tryit'),
    { type: 'tryit', game: 'numberbox' },
  ],
};
