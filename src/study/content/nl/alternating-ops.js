// NumberLogic family lesson: two operations taking turns on the previous term. Every number shown is computed here.
import { S, neg, seq, diffs, ladderRows, nextQ, pick, num, arith, geo, affine, weave } from './method-ladder.js';

const OP = {
  add: (v) => ({ f: (x) => x + v, t: `+${v}`, word: `add ${v}` }),
  sub: (v) => ({ f: (x) => x - v, t: `−${v}`, word: `subtract ${v}` }),
  mul: (v) => ({ f: (x) => x * v, t: `×${v}`, word: `multiply by ${v}` }),
};
const mk = ([k, v]) => OP[k](v);
// a, then ops[0], ops[1], ops[0], ... : the generator's parametrisation.
const run = (a, ops, n) => { const o = [a]; for (let i = 1; i < n; i++) o.push(mk(ops[(i - 1) % 2]).f(o[i - 1])); return o; };
const g = (xs) => diffs(xs);
const due = (ops, n) => mk(ops[(n - 1) % 2]); // the operation that makes term n + 1 from term n (n terms shown)
const other = (ops, n) => mk(ops[n % 2]);
const steps = (xs, ops) => xs.slice(1).map((_, i) => mk(ops[i % 2]).t);
// Plausible operations that do NOT take x to y (wrong options for "which operation" checks).
const POOL = [['mul', 2], ['mul', 3], ['add', 2], ['add', 3], ['add', 5], ['sub', 2], ['sub', 4]];
const falseOps = (x, y, skip) => POOL.map(mk).filter((o) => o.f(x) !== y && !skip.includes(o.t));

const CHo = [['add', 3], ['mul', 2]], CH = run(2, CHo, 7);
const E1o = [['mul', 2], ['add', 5]], E1 = run(3, E1o, 7);
const E2o = [['mul', 3], ['sub', 4]], E2 = run(3, E2o, 8);
const E3o = [['sub', 2], ['mul', 3]], E3 = run(6, E3o, 8);
const ERo = [['add', 3], ['mul', 2]], ER = run(5, ERo, 7);
const IL = weave(arith(3, 4, 4), arith(30, -3, 4), 6);
const AF = affine(2, 2, 3, 6);
const GN = geo(3, -2, 6);
const TAo = [['mul', 3], ['sub', 5]], TA = run(4, TAo, 7);
const E16 = E1.slice(0, 6), ADD7 = run(3, [['mul', 2], ['add', 7]], 7), SWAP = run(3, [['add', 5], ['mul', 2]], 8);
const sp = (t) => t.replace(/^([+−×])/, '$1 ');
const pile = (a, r, moves) => run(a, [['mul', 2], ['sub', r]], moves + 1)[moves];

// Level 2 and level 3 operation pairs, as in the generator. Lists with a term of size 0 or 1 are
// redrawn: tiny terms let a second rule fit (1, 2, 3, 6, 7, 14 also fits a counting multiplier plus a
// leftover, checked with the rule finder in src/sections/nl/solver.js).
const pairFor = (rng, d) => (d === 2
  ? rng.pick([[['add', rng.int(1, 9)], ['mul', rng.pick([2, 3])]], [['mul', 2], ['add', rng.int(1, 9)]]])
  : rng.pick([[['mul', rng.pick([2, 3])], ['sub', rng.int(1, 9)]], [['sub', rng.int(1, 6)], ['mul', rng.pick([2, 3])]], [['mul', 3], ['add', rng.int(2, 9)]]]));
function draw(rng, n, d = rng.pick([2, 3])) {
  for (;;) {
    const ops = pairFor(rng, d), xs = run(rng.int(1, 9), ops, n + 2);
    // Also redrawn: a step that both operations explain (6 → 12 is +6 and ×2), which blurs the labels.
    const clear = xs.every((v, i) => i === 0 || mk(ops[i % 2]).f(xs[i - 1]) !== v);
    if (clear && xs.every((v) => Math.abs(v) >= 2) && new Set(xs).size === xs.length) return { ops, xs };
  }
}

export default {
  id: 'nl/alternating-ops',
  book: 'nl',
  kind: 'family',
  family: 'alternating-ops',
  title: 'Alternating operations',
  summary: 'Steps take turns (add, multiply, add, multiply): name each step, find the one that made the last term, apply the other.',
  prerequisites: ['nl/method-ladder', 'nl/interleaved'],
  objectives: [
    'Name the operation of every step: + c, − c or × m',
    'Decide which operation is due from the number of shown steps',
    'Tell alternating operations apart from two interleaved strands',
    'Avoid applying the operation that was just used',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with the gaps, once by describing each step in words.`, answer: String(CH[6]), explain: `Gaps ${seq(g(CH.slice(0, 6)))}: every other gap is ${CH[1] - CH[0]}, the rest grow. In words the steps are ${steps(CH.slice(0, 6), CHo).join(', ')}. The last step was ${due(CHo, 5).t}, so the next is ${due(CHo, 6).t}: ${CH[5]} ${due(CHo, 6).t.replace('×', '× ')} = ${CH[6]}.`,
      attempts: [
        { id: 'gaps', label: 'Hunt a gap pattern', approach: `Wrote the gaps ${seq(g(CH.slice(0, 6)))} and looked for one pattern in them.`, breaksAt: 'Every other gap is flat and the rest grow with the term: the gaps mix two kinds of step, so name each step instead.' },
        { id: 'same-op', label: 'Repeat the last operation', approach: `The last step was ${other(CHo, 6).t}, so did it again: ${CH[5]} ${sp(other(CHo, 6).t)} = ${other(CHo, 6).f(CH[5])}.`, breaksAt: 'The operations take turns: the one that made the last term is exactly the one that is not next.' },
        { id: 'both', label: 'Apply both operations', approach: `Did ${mk(CHo[0]).t} and ${mk(CHo[1]).t} in one go: (${CH[5]} ${sp(mk(CHo[0]).t)}) ${sp(mk(CHo[1]).t)} = ${mk(CHo[1]).f(mk(CHo[0]).f(CH[5]))}.`, breaksAt: `One step, one operation. Test it on a shown step: ${CH[0]} done that way gives ${mk(CHo[1]).f(mk(CHo[0]).f(CH[0]))}, not ${CH[1]}.` },
      ] },
    { type: 'text', text: 'Two operations take turns on the **previous term**: add 3, multiply by 2, add 3, multiply by 2. The gap list alternates between a fixed number (the addition or subtraction) and a gap that grows with the term (the multiplication). That mixture of flat and growing gaps is the signature.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 7))}, ?`, `What number comes next?  ${seq(E3.slice(0, 7))}, ?`] },
    { type: 'check', scope: 'the cue: flat and growing gaps taking turns', questions: [
      { make: (rng) => { const d = draw(rng, 6, 2), il = weave(arith(rng.int(1, 9), rng.int(2, 5), 3), arith(rng.int(30, 60), -rng.int(2, 6), 3), 6), ge = geo(rng.int(2, 5), 2, 6); return pick(rng, 'In which list do two operations take turns on the previous term?', seq(d.xs.slice(0, 6)), [[seq(il), 'there every second term forms its own list: two strands, not two operations'], [seq(ge), 'every step is the same ×2']], `${seq(d.xs.slice(0, 6))}: steps ${steps(d.xs.slice(0, 6), d.ops).join(', ')}.`); } },
    ] },
    { type: 'text', text: `Not this lesson: two separate sequences written alternately (${seq(IL)} is ${seq(IL.filter((_, i) => i % 2 === 0))} beside ${seq(IL.filter((_, i) => i % 2 === 1))}). There the odd-position terms never touch the even ones. Here every term is built from the one right before it.` },
    { type: 'check', scope: 'two strands', questions: [
      { type: 'choice', q: '3, 30, 7, 27, 11, 24: what is it?', options: ['two strands: 3, 7, 11 and 30, 27, 24', 'two operations taking turns', 'a single arithmetic sequence'], answer: 0, traps: { 1: 'no pair of operations turns 3 into 30 and 30 into 7 the same way twice', 2: 'the gaps swing between big rises and big falls' }, explain: 'Odd positions 3, 7, 11 and even positions 30, 27, 24 never touch: two strands.' },
    ] },

    S('why'),
    { type: 'text', text: 'Alternating rules produce gap lists that look chaotic, like +3, +8, +3, +22. Naming each step makes them trivial. They appear from the middle of the test on, often with a subtraction mixed in to hide the pattern, and the most common wrong option is simply the other operation applied at the wrong time. The whole skill is bookkeeping: label, then count. Nothing here needs more arithmetic than one multiplication.' },

    S('anchor'),
    { type: 'text', text: 'A constant-gap sequence adds d on every step; a constant-ratio sequence multiplies by r on every step. This family changes **one thing**: the two kinds of step take turns. Each step on its own is something you already know.' },
    { type: 'check', scope: 'applying two operations in turn', questions: [
      { make: (rng) => { const x = rng.int(2, 9), c = rng.int(1, 9), m = rng.pick([2, 3]); const v = (x + c) * m + c; return num(`Start at ${x}. Add ${c}, then multiply by ${m}, then add ${c} again. Where do you end up?`, v, `${x} + ${c} = ${x + c}; × ${m} = ${(x + c) * m}; + ${c} = ${v}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Label every step between neighbours with its operation. The labels alternate. In the gap row, the additions show up as the same number on every other step, while the multiplications show up as gaps that grow with the terms.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['step', 'from', 'to', 'operation'], rows: E1.slice(0, 6).map((v, i) => [String(i + 1), String(v), String(E1[i + 1]), mk(E1o[i % 2]).t]) }, caption: `${seq(E1.slice(0, 7))} step by step: ${mk(E1o[0]).t} and ${mk(E1o[1]).t} take turns. Six steps are listed; the seventh would be ${due(E1o, 7).t}.` },
    { type: 'check', scope: 'labelling each step', questions: [
      { make: (rng) => { const { ops, xs } = draw(rng, 6), k = rng.int(1, 4); const right = mk(ops[k % 2]), wrong = mk(ops[(k + 1) % 2]); return pick(rng, `${seq(xs.slice(0, 6))}: which of the list's two operations takes ${neg(xs[k])} to ${neg(xs[k + 1])}?`, right.t, [[wrong.t, `that is the other operation: ${neg(xs[k])} ${wrong.t.replace('×', '× ')} is ${wrong.f(xs[k])}, not ${neg(xs[k + 1])}`], ...falseOps(xs[k], xs[k + 1], [right.t, wrong.t]).slice(0, 2).map((o) => [o.t, `${neg(xs[k])} ${o.t.replace('×', '× ')} is ${o.f(xs[k])}, not ${neg(xs[k + 1])}`])], `${neg(xs[k])} ${right.t.replace('×', '× ')} = ${neg(xs[k + 1])}.`); } },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: `Gaps of ${seq(CH.slice(0, 6))}`, xLabel: 'step', yLabel: 'gap', categories: g(CH.slice(0, 6)).map((_, i) => String(i + 1)), series: [{ name: 'gap', values: g(CH.slice(0, 6)) }], valueLabels: true }, caption: `Flat, growing, flat, growing: the flat bars are the ${mk(CHo[0]).t} steps and the growing ones are the ${mk(CHo[1]).t} steps, each as big as the term it doubles.` },
    { type: 'check', scope: 'flat and growing bars', questions: [
      { type: 'choice', q: 'In the gap bars of an alternating-operations list, which steps give the growing bars?', options: ['the multiplications', 'the additions', 'every second addition'], answer: 0, traps: { 1: 'additions give flat bars of one height', 2: 'all additions are flat' }, explain: 'A multiplication gap grows with the term it acts on.' },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'gaps', say: 'Describe each step on its own: is it "+ c" or "− c" (the same gap every time it appears) or "× m" (next ÷ previous is the same whole number)?', why: 'A fixed addition gives the same gap whatever the term; a multiplication gives a gap that grows with the term. Testing each step separately exposes which is which.',
        checks: [
          { make: (rng) => { const { ops, xs } = draw(rng, 6), op = mk(ops[1]), o0 = mk(ops[0]); return pick(rng, `${seq(xs.slice(0, 6))}: which operation takes term 2 to term 3?`, op.t, [[o0.t, `that is the first step's operation: ${neg(xs[1])} ${o0.t.replace('×', '× ')} is ${o0.f(xs[1])}, not ${neg(xs[2])}`], ...falseOps(xs[1], xs[2], [op.t, o0.t]).slice(0, 2).map((o) => [o.t, `${neg(xs[1])} ${o.t.replace('×', '× ')} is ${o.f(xs[1])}, not ${neg(xs[2])}`])], `${neg(xs[1])} ${op.t.replace('×', '× ')} = ${neg(xs[2])}.`); } },
        ] },
      { say: 'Check the pattern: odd steps (1, 3, 5) share one operation and even steps (2, 4, 6) share the other.', why: 'Two operations taking turns must repeat every other step. One exception means a different rule.',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), { ops, xs } = draw(rng, 6); const ys = xs.slice(0, 6); if (!yes) ys[5] += rng.pick([1, 2, -1]); return pick(rng, `Do the steps of ${seq(ys)} alternate between just two operations (${mk(ops[0]).t} and ${mk(ops[1]).t})?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every odd step and every even step matches' : `the last step does not match: ${neg(ys[4])} ${mk(ops[0]).t.replace('×', '× ')} is ${mk(ops[0]).f(ys[4])}, not ${neg(ys[5])}`]], `Steps: ${ys.slice(1).map((v, i) => `${neg(ys[i])} → ${neg(v)}`).join(', ')}.`); } },
        ] },
      { answers: 'same-op', say: 'Find which operation is due: with n terms shown there are n − 1 steps, so the next is step n. Odd step → the first operation; even step → the second. Quicker: the next operation is the one that did **not** make the last term.', why: 'The operations alternate strictly, so the last step decides the next one.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 7]), { ops, xs } = draw(rng, n); return pick(rng, `${seq(xs.slice(0, n))}, ? Which operation makes the next term?`, due(ops, n).t, [[other(ops, n).t, `that operation made the last term (${neg(xs[n - 2])} → ${neg(xs[n - 1])}); they take turns`]], `The last step was ${other(ops, n).t}, so the next is ${due(ops, n).t}.`); } },
        ] },
      { answers: 'both', say: 'Apply only that operation to the last term.', why: 'One step, one operation. Applying both at once is a classic slip.',
        checks: [
          { make: (rng) => { const n = rng.pick([6, 7]), { ops, xs } = draw(rng, n); return num(nextQ(xs.slice(0, n)), xs[n], `Next step ${due(ops, n).t}: ${neg(xs[n - 1])} ${due(ops, n).t.replace('×', '× ')} = ${neg(xs[n])}.`, ['Label each step with its operation.', 'Which operation made the last term? Use the other one.']); } },
        ] },
    ] },
    { type: 'text', text: `Test writers mix in subtraction to hide the pattern. A subtraction step shows up as a flat negative gap; the multiplication gap still grows. In ${seq(E2.slice(0, 6))} the gaps are ${seq(g(E2.slice(0, 6)))}: every other gap is ${g(E2)[1]}, the subtraction, and the rest grow. The same labelling works whatever the sign.` },
    { type: 'check', scope: 'a subtraction step', questions: [
      { type: 'number', q: 'What comes next?  4, 12, 7, 21, 16, ?', answer: 48, explain: '× 3 and − 5 take turns: 16 came from a subtraction, so multiply next: 16 × 3 = 48.' },
    ] },
    { type: 'explain', prompt: 'Why do the gaps alternate between flat and growing, and how is this different from two interleaved strands?', model: 'An addition adds the same amount whatever the term, so its gaps are flat; a multiplication adds (m − 1) × the term, so its gaps grow as the terms grow. With interleaving, each term comes from the term two places back in its own strand; here each term comes from the term right before it.', points: ['Addition: same gap every time', 'Multiplication: gap = (m − 1) × the term, so it grows', 'Here each term comes from its neighbour, not from two places back'] },

    S('worked'),
    { type: 'worked', family: 'alternating-ops', section: 'nl', difficulty: 2, seed: 'a', explainAt: [1], intro: 'An addition and a multiplication taking turns. Label the steps before opening the solution.' },
    { type: 'worked', family: 'alternating-ops', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'A subtraction in the mix. The labels are given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(E2.slice(0, 6))}, ? The terms rise overall, although one operation is a subtraction. Which operation is due, and what is the next term?`, answer: `The steps go ${steps(E2.slice(0, 6), E2o).join(', ')}, so the next is ${due(E2o, 6).t}: ${E2[5]} ${due(E2o, 6).t.replace('×', '× ')} = ${E2[6]}.`, explain: 'Direction of travel says nothing about which operation is due; the last step does.' },

    S('traps'),
    { type: 'traps', family: 'alternating-ops', section: 'nl', extra: [
      { belief: 'The operation just used comes again.', fix: 'They alternate: the next step uses the operation that did not make the last term.' },
      { belief: 'Each step applies both operations.', fix: 'One step, one operation. Check a shown step: applying both overshoots it.' },
      { belief: 'The terms are rising, so the next step must add.', fix: 'Judge by the operation that is due, not the direction; ×3 then −4 still rises.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ER.slice(0, 6))}, ?. One step is wrong.`, steps: [
      `Steps: ${steps(ER.slice(0, 6), ERo).join(', ')}.`,
      `The last step was ${mk(ERo[1]).t}, so the next is ${mk(ERo[0]).t}.`,
      `Next = ${ER[5]} ${mk(ERo[0]).t.replace('×', '× ')} = ${mk(ERo[0]).f(ER[5])}.`,
      `Answer: ${mk(ERo[0]).f(ER[5])}.`,
    ], errorStep: 1, explain: `Five steps are shown and the fifth, ${ER[4]} → ${ER[5]}, was ${mk(ERo[0]).t}. So the next is ${mk(ERo[1]).t}: ${ER[5]} ${mk(ERo[1]).t.replace('×', '× ')} = ${ER[6]}. Read the last step off the last two terms, never from memory of the pattern.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const n = rng.pick([6, 7]), { ops, xs } = draw(rng, n), l = xs[n - 1], dOp = due(ops, n), oOp = other(ops, n); return pick(rng, nextQ(xs.slice(0, n)), xs[n], [[oOp.f(l), `applied ${oOp.t} again; this step is ${dOp.t}`], [oOp.f(dOp.f(l)), `applied both operations (${dOp.t} then ${oOp.t}) in one step`], [l + (l - xs[n - 3]), 'treated the list as two strands and repeated a gap two places back'], [xs[n + 1], 'went one step too far']], `Last step ${oOp.t}, so ${dOp.t}: ${neg(l)} ${dOp.t.replace('×', '× ')} = ${neg(xs[n])}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Only the last two steps matter for the answer: name the step that made the last term, then apply the other operation. Check one earlier pair of steps and answer.' },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 6)), lines: [
      { t: 0, say: `Gaps ${seq(g(TA.slice(0, 6)))}: a flat ${neg(g(TA)[1])} every other step, the rest grow. Two operations taking turns.` },
      { t: 5, say: `Label the steps: ${steps(TA.slice(0, 6), TAo).join(', ')}.` },
      { t: 9, say: `It is climbing fast, so multiply again: ${TA[5]} × 3 = ${TA[5] * 3}.`, slip: true },
      { t: 12, say: `No: ${TA[4]} → ${TA[5]} was the ×3. They take turns, so this step is ${due(TAo, 6).t}.` },
      { t: 15, say: `${TA[5]} − ${TA[5] - TA[6]} = ${TA[6]}. Check an earlier pair: ${TA[3]} − ${TA[3] - TA[4]} = ${TA[4]}. Answer ${TA[6]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: read the last step, apply the other', questions: [
      { make: (rng) => { const n = rng.pick([6, 7]), { ops, xs } = draw(rng, n, 3); return num(nextQ(xs.slice(0, n)), xs[n], `The last step ${neg(xs[n - 2])} → ${neg(xs[n - 1])} was ${other(ops, n).t}, so this one is ${due(ops, n).t}: ${neg(xs[n - 1])} ${due(ops, n).t.replace('×', '× ')} = ${neg(xs[n])}.`, ['Which operation made the last term?', 'Apply the other one, once.']); } },
    ] },
    { type: 'callout', tone: 'speed', text: 'Spot a multiplication from the gap alone: under ×m the gap equals (m − 1) × the term before. A gap equal to the previous term is ×2; a gap of twice the previous term is ×3.' },
    { type: 'check', scope: 'gap = (m − 1) × the term', questions: [
      { make: (rng) => { const x = rng.int(4, 40), m = rng.pick([2, 3]); return num(`A step takes ${x} to ${x * m}. The gap is ${x * m - x}. If this is a multiplication, by what?`, m, `Gap ${x * m - x} = ${m - 1} × ${x}, so m − 1 = ${m - 1} and m = ${m}.`, ['Under ×m the gap is (m − 1) × the term.', `Divide the gap by ${x}, then add 1.`]); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Steps take turns → label each step, find the operation that made the last term, apply the other one.' },

    S('contrast'),
    { type: 'text', text: 'Interleaving or alternating operations? Both zigzag. Ask one question: does each term follow from the one right before it by one of two operations, taking turns? If yes, this lesson. If instead neighbour steps fit no pair of operations while every second term forms a clean list, it is interleaving.' },
    { type: 'diagram', diagram: 'flow', spec: { root: 'z', nodes: [
      { id: 'z', text: 'Gaps zigzag or alternate?', kind: 'q' },
      { id: 'op', text: 'Each step fits one of two operations, taking turns?', kind: 'q' },
      { id: 'alt', text: 'Alternating operations: apply the one that is due', kind: 'a', link: 'nl/alternating-ops' },
      { id: 'str', text: 'Every second term forms a clean list?', kind: 'q' },
      { id: 'il', text: 'Two strands: continue the strand whose turn it is', kind: 'a', link: 'nl/interleaved' },
      { id: 'back', text: 'Back to the method ladder', kind: 'note' },
    ], edges: [{ from: 'z', to: 'op', label: 'yes' }, { from: 'op', to: 'alt', label: 'yes' }, { from: 'op', to: 'str', label: 'no' }, { from: 'str', to: 'il', label: 'yes' }, { from: 'str', to: 'back', label: 'no' }] }, caption: 'Two questions separate the two zigzag families: first test neighbour steps for two alternating operations, then test every second term for clean strands.' },
    { type: 'check', scope: 'the first question of the flow', questions: [
      { make: (rng) => { const yes = rng.chance(0.5); let xs, ops; if (yes) ({ ops, xs } = draw(rng, 6)); else xs = weave(arith(rng.int(2, 9), rng.int(3, 6), 3), arith(rng.int(40, 70), -rng.int(2, 7), 3), 6); return pick(rng, `${seq(xs.slice(0, 6))}: does every step fit one of two operations taking turns?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? `the steps are ${steps(xs.slice(0, 6), ops).join(', ')}` : `the odd steps ${seq(g(xs).filter((_, i) => i % 2 === 0))} are neither one addition nor one multiplication: split the strands instead`]], yes ? `Steps: ${steps(xs.slice(0, 6), ops).join(', ')}.` : `Every second term forms a clean list: ${seq(xs.filter((_, i) => i % 2 === 0))} and ${seq(xs.filter((_, i) => i % 2 === 1))}.`); } },
    ] },
    { type: 'compare', columns: ['Sequence', 'Gaps', 'What happens'], rows: [
      [seq(CH.slice(0, 6)), seq(g(CH.slice(0, 6))), `${mk(CHo[0]).t} and ${mk(CHo[1]).t} on the previous term (this lesson)`],
      [seq(IL), seq(g(IL)), 'two strands: every second term forms its own list'],
      [seq(AF.slice(0, 5)), seq(g(AF.slice(0, 5))), 'both operations every step: × 2, then + 3'],
      [seq(GN.slice(0, 5)), seq(g(GN.slice(0, 5))), 'one operation, × (−2): the signs alternate'],
    ] },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) xs = draw(rng, 6).xs.slice(0, 6); else if (t === 1) xs = affine(rng.int(1, 6), 2, rng.int(1, 5), 6); else xs = geo(rng.int(1, 5), -2, 6); const names = ['two operations taking turns', 'both operations every step', 'one operation every step']; const trp = [[null, 'the same combined step does not produce every term', 'no single operation fits every step'], ['the steps do not alternate: every step is × 2 then + the same constant', null, 'no single operation fits: the ratios drift'], ['every step is the same × (−2)', 'there is no constant added: the leftover after × (−2) is 0', null]]; return pick(rng, `${seq(xs)}: how is each term made from the one before?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps: ${seq(g(xs))}.`); } },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: with ×3 and −4 the terms still rise, so the direction proves nothing. The pattern can start with either operation, so read the first step rather than assuming "add first". And a subtraction can take a small term below zero, where the multiplication then pushes it further down.' },
    { type: 'check', scope: 'the edge cases', questions: [
      { make: (rng) => { let s, m, ops, xs; do { s = rng.int(1, 6); m = rng.pick([2, 3]); ops = [['mul', m], ['sub', s]]; xs = run(rng.int(3, 9), ops, 8); } while (xs.some((v) => Math.abs(v) < 2) || new Set(xs).size < xs.length); return num(nextQ(xs.slice(0, 7)), xs[7], `Steps ${steps(xs.slice(0, 7), ops).join(', ')}: the next is ${due(ops, 7).t}, so ${xs[6]} ${due(ops, 7).t.replace('×', '× ')} = ${xs[7]}.`, ['The terms rise, but one step subtracts.', 'Which operation made the last term?']); } },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: any process of two alternating actions (a move and a reply, a deposit and a fee) is simulated step by step, and the one thing to track is whose turn it is.' },
    { type: 'variation', base: `${seq(E16)}, ?  The last step was ${other(E1o, 6).t}, so ${due(E1o, 6).t}: ${E1[6]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E16.slice(1))}, ?`, effect: `Still ${E1[6]}. The last step is still ${E1[4]} → ${E1[5]}, a ${other(E1o, 6).t}, so ${due(E1o, 6).t} is due. Read the last step, not the count from the start.` },
      { change: `Show one more term: ${seq(E1.slice(0, 7))}, ?`, effect: `${mk(E1o[0]).f(E1[6])}. The last step is now ${due(E1o, 6).t}, so ${other(E1o, 6).t} is due.` },
      { change: `Add 7 instead of 5: ${seq(ADD7.slice(0, 6))}, ?`, effect: `${ADD7[6]}. Same turn order; the flat gap is 7 now.` },
      { change: `Start with the addition: ${seq(SWAP.slice(0, 6))}, ?`, effect: `${SWAP[6]}. The order flips, so after six terms the ×2 is due.` },
      { fusion: true, change: `Start with the addition and show one more term: ${seq(SWAP.slice(0, 7))}, ?`, effect: `${SWAP[7]}. Each change flips which operation is due, so together they cancel: +5 is due again, as in the base.` },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const { ops, xs } = draw(rng, 6, 3), o1 = due(ops, 6), o2 = other(ops, 6); return num(`${seq(xs.slice(0, 6))}, ?, ? What is the **second** missing term?`, xs[7], `The last step was ${o2.t}, so first ${o1.t}: ${neg(xs[5])} → ${neg(xs[6])}; then ${o2.t}: ${neg(xs[6])} → ${neg(xs[7])}.`, ['Which operation is due first?', 'Apply it, then the other one.']); } },
      far: { make: (rng) => { const a = rng.int(4, 9), r = rng.int(2, 5), m = rng.int(5, 7); return num(`A pile starts with ${a} chips. You and an opponent take turns, you first: on your turn the pile doubles, on the opponent's turn ${r} chips are removed. How many chips are in the pile after ${m} turns in total?`, pile(a, r, m), `Turns alternate ×2 and −${r}: ${run(a, [['mul', 2], ['sub', r]], m + 1).join(' → ')}.`, ['Write the pile after each turn.', 'Odd turns double, even turns remove chips.']); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the chip game?', options: [
        'track whose turn it is and apply only that action',
        'repeat whichever action was used most recently',
        'apply both actions together on every single turn',
        'split the record into two separate lists to continue',
      ], answer: 0, traps: { 1: 'the actions take turns, so the last one used is not the next one', 2: 'each turn is one action; doing both overshoots a shown turn', 3: 'each value is built from the one right before it, not from two places back' }, explain: 'The chip game and the sequences both alternate two actions on the current value: the only bookkeeping is whose turn it is.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'alternating-ops', section: 'nl', count: 3 },
  ],
};
