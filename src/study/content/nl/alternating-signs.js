// NumberLogic family lesson: signs that flip every term. Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ladderRows, nz, nextQ, pick, num, arith, geo, affine, weave } from './method-ladder.js';

// Level 2: an ordinary size sequence with (−1)^(i + e) in front; level 3: a(n) = −m·a(n−1) + c.
// Both as in the generator.
const alt = (sizes, e) => sizes.map((v, i) => ((i + e) % 2 ? -v : v));
const sqs = (s, e, n) => alt(Array.from({ length: n }, (_, i) => (i + s) ** 2), e);
const lin = (a, d, e, n) => alt(arith(a, d, n), e);
const aff = (a, m, c, n) => affine(a, -m, c, n);
const g = (xs) => diffs(xs);
const size = (xs) => xs.map(Math.abs);
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const lo = (xs, m) => xs.slice(1).map((v, i) => v + m * xs[i]);

const CH = sqs(2, 0, 7);
const E1 = lin(3, 4, 0, 7);
const E2 = sqs(1, 1, 7);
const E3m = 2, E3c = 3, E3 = aff(2, E3m, E3c, 7);
const PRED = sqs(1, 0, 7);
const ERR = lin(5, 3, 0, 7);
const GN = geo(3, -2, 6);
const SERIES = [1, 2, 3, 4, 5].map((n) => (n % 2 ? `${n === 1 ? '1' : `1/${n}`}` : `−1/${n}`));
const IL = weave(arith(2, 3, 4), arith(-5, -4, 4), 7);

function sizesDraw(rng, n) {
  const e = rng.pick([0, 1]);
  if (rng.chance(0.5)) { const s = rng.int(1, 6); return { k: 'sq', e, xs: sqs(s, e, n), sz: Array.from({ length: n }, (_, i) => (i + s) ** 2) }; }
  const a = rng.int(1, 9), d = rng.int(2, 7);
  return { k: 'lin', e, d, xs: lin(a, d, e, n), sz: arith(a, d, n) };
}
function affDraw(rng, n) {
  for (;;) {
    const a = rng.int(1, 6), m = rng.pick([2, 3]), c = nz(rng, -5, 5), xs = aff(a, m, c, n);
    if (xs.every((v, i) => v !== 0 && (i === 0 || Math.sign(v) !== Math.sign(xs[i - 1])))) return { k: 'aff', m, c, xs };
  }
}
const anyDraw = (rng, n) => (rng.chance(0.6) ? sizesDraw(rng, n) : affDraw(rng, n));
const sizeRule = (p) => (p.k === 'sq' ? 'consecutive squares' : `a constant gap of ${p.d}`);

export default {
  id: 'nl/alternating-signs',
  book: 'nl',
  kind: 'family',
  family: 'alternating-signs',
  title: 'Signs that flip every term',
  summary: 'Signs alternate: strip them, solve the sizes as an ordinary sequence, then give the next term the opposite sign of the last; if the sizes are messy, test −m × previous + c with the signs kept.',
  prerequisites: ['nl/method-ladder', 'nl/arithmetic', 'nl/squares-plus', 'nl/geometric', 'nl/affine-recurrence'],
  objectives: [
    'Separate sign from size and solve the sizes in under 20 seconds',
    'Decide the sign of the next term before any arithmetic',
    'Recognise when the sizes have no rule and switch to −m × previous + c',
    'Avoid the right-size, wrong-sign answer',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', attempts: [
      { id: 'gaps', label: 'Ladder the signed terms', approach: `Took the gaps of the signed terms: ${seq(g(CH.slice(0, 6)))}.`, breaksAt: 'Every sign flip makes the gaps swing; no row of them settles.' },
      { id: 'same-sign', label: 'Copy the last sign', approach: 'Found the next size and kept the sign of the last term.', breaksAt: 'The sign flips on every step, so the next sign is the opposite one.' },
      { id: 'strip-always', label: 'Strip signs on a multiplier', approach: `Stripped the signs of ${seq(E3.slice(0, 5))} and looked for a rule in the sizes.`, breaksAt: 'The sizes have no rule there; the flips come from multiplying by a negative number.' },
    ], q: `Before any teaching: ${seq(CH.slice(0, 6))}, ? What comes next? Try two ways: once with the gaps between neighbours, once with the signs covered up.`, answer: neg(CH[6]), explain: `The gaps ${seq(g(CH.slice(0, 6)))} swing wildly and hide everything. Cover the signs: ${seq(size(CH.slice(0, 6)))} are the squares 2² to 7², so the next size is 8² = ${CH[6] < 0 ? -CH[6] : CH[6]}. The signs flip every term and ${neg(CH[5])} is positive, so the answer is ${neg(CH[6])}.` },
    { type: 'text', text: 'The signs flip on **every** step: +, −, +, − or −, +, −, +. The gaps then swing between large positive and large negative values and tell you nothing. Two things are going on at once, a sign pattern and a size pattern, and they are solved separately.' },
    { type: 'list', items: [`What number comes next?  ${seq(E1.slice(0, 6))}, ?`, `What number comes next?  ${seq(E2.slice(0, 6))}, ?`, `What number comes next?  ${seq(E3.slice(0, 6))}, ?`] },
    { type: 'text', text: `Not this lesson: signs that do not flip on every step, or two strands that happen to be positive and negative, as in ${seq(IL.slice(0, 6))} (split into ${seq(IL.slice(0, 6).filter((_, i) => i % 2 === 0))} and ${seq(IL.slice(0, 6).filter((_, i) => i % 2 === 1))}). The strand lesson covers those.` },
    { type: 'check', scope: 'the cue: the sign flips every term', questions: [
      { make: (rng) => { const p = sizesDraw(rng, 6); let q; do q = arith(-rng.int(15, 30), rng.int(8, 12), 6); while (q.includes(0)); const z = weave(arith(rng.int(10, 30), rng.int(3, 6), 3), arith(rng.int(40, 70), rng.int(3, 8), 3), 6); return pick(rng, 'In which sequence does the sign flip on every step?', seq(p.xs), [[seq(q), 'the signs change only once, where the terms cross 0'], [seq(z), 'all terms are positive: that zigzag is two strands, not signs']], `${seq(p.xs)}: +, −, +, − (or the reverse) on every step.`); } },
    ] },

    S('why'),
    { type: 'text', text: 'Alternating signs make the gap row useless: the gaps jump between big positive and big negative values, so the first test of the ladder fails loudly. Candidates who keep subtracting lose a minute. Covering the signs turns most of these items into a squares or constant-gap question from the first lessons. The last trap is the sign itself: the right size with the wrong sign is always one of the options.' },

    S('anchor'),
    { type: 'text', text: 'You already solve the sizes: constant gaps, squares, a ratio. This family changes **one thing**: every second term is multiplied by −1. Undo that change (look at sizes only), solve, then redo it (put the sign back).' },
    { type: 'check', scope: 'stripping the signs', questions: [
      { make: (rng) => { const p = sizesDraw(rng, 5); return pick(rng, `Cover the signs of ${seq(p.xs)}. Which list is left?`, seq(p.sz), [[seq(p.xs.map((v) => -v)), 'that flips every sign; covering the signs leaves every size positive'], [seq(p.xs.filter((v) => v > 0)), 'that drops the negative terms instead of keeping their sizes']], `Sizes: ${seq(p.sz)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw the terms as bars: they alternate above and below zero, and the bar heights follow a plain rule. The gap row of the same list is noise; the gap row of the sizes is clean.' },
    { type: 'diagram', diagram: 'bar', spec: { title: `Terms of ${seq(E1.slice(0, 6))}`, xLabel: 'position', yLabel: 'term', categories: E1.slice(0, 6).map((_, i) => String(i + 1)), series: [{ name: 'term', values: E1.slice(0, 6) }], valueLabels: true }, caption: `Up, down, up, down: the sign flips every position. The heights ${seq(size(E1.slice(0, 6)))} grow by ${size(E1)[1] - size(E1)[0]} each time.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(E1.slice(0, 6), 1) }, caption: `The gaps of the signed terms: ${seq(g(E1.slice(0, 6)))}. They swing and grow; no ladder row will settle.` },
    { type: 'check', scope: 'bars and the useless gap row', questions: [
      { make: (rng) => { const p = sizesDraw(rng, 6); return num(`What is the size (the number without its sign) of the last term of ${seq(p.xs)}?`, p.sz[5], `${neg(p.xs[5])} has size ${p.sz[5]}.`); } },
    ] },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'diff', rows: ladderRows(size(E2.slice(0, 6)), 2) }, caption: `The sizes of ${seq(E2.slice(0, 6))} are ${seq(size(E2.slice(0, 6)))}: gaps ${seq(g(size(E2.slice(0, 6))))}, second row 2. The squares, as in the squares lesson.` },
    { type: 'check', scope: 'solving the sizes', questions: [
      { make: (rng) => { const p = sizesDraw(rng, 7); return num(`The sizes of ${seq(p.xs.slice(0, 6))} follow ${sizeRule(p)}. What is the **next size**?`, p.sz[6], `Sizes ${seq(p.sz.slice(0, 6))}: next ${p.sz[6]}.`); } },
    ] },

    S('derivation'),
    { type: 'text', text: `The whole method on ${seq(E2.slice(0, 6))}: the signs go ${E2.slice(0, 6).map((v) => (v < 0 ? '−' : '+')).join(' ')}, flipping every time. The sizes ${seq(size(E2.slice(0, 6)))} are the squares, so the next size is ${size(E2)[6]}. The last term is positive, so the next is negative: ${neg(E2[6])}. The moves below take that apart one decision at a time, then handle the case where the sizes have no rule.` },
    { type: 'steps', steps: [
      { say: 'Check the signs: do they flip on every single step?', why: 'The method only applies to a strict alternation. One missed flip means a different rule (often two strands).',
        checks: [
          { make: (rng) => { const yes = rng.chance(0.5), p = sizesDraw(rng, 6); const xs = yes ? p.xs : p.xs.map((v, i) => (i === 3 ? -v : v)); return pick(rng, `Do the signs of ${seq(xs)} flip on every step?`, yes ? 'Yes' : 'No', [[yes ? 'No' : 'Yes', yes ? 'every neighbour pair has opposite signs' : `${neg(xs[2])}, ${neg(xs[3])}, ${neg(xs[4])}: the sign fails to flip there`]], `Signs: ${xs.map((v) => (v < 0 ? '−' : '+')).join(' ')}.`); } },
        ] },
      { answers: 'gaps', say: 'Strip the signs and write the sizes.', why: 'Sign and size are separate patterns. With the signs gone, the sizes are an ordinary sequence.',
        checks: [
          { make: (rng) => { const p = sizesDraw(rng, 6); return num(`Write the sizes of ${seq(p.xs)}. What is the fifth size?`, p.sz[4], `Sizes: ${seq(p.sz)}.`); } },
        ] },
      { say: 'Solve the sizes with the earlier lessons: constant gap, squares, or a ratio. Find the next size.', why: 'Nothing new here; the sizes are the familiar rule.',
        checks: [
          { make: (rng) => { const p = sizesDraw(rng, 7); return num(`${seq(p.xs.slice(0, 6))}, ? What is the size of the next term?`, p.sz[6], `Sizes ${seq(p.sz.slice(0, 6))} follow ${sizeRule(p)}: next ${p.sz[6]}.`, ['Cover the signs.', 'Continue the size sequence.']); } },
        ] },
      { answers: 'same-sign', say: 'Put the sign back: the next term has the opposite sign of the last shown term.', why: 'A strict alternation flips every step, so only the last sign matters. Decide it before any arithmetic.',
        checks: [
          { make: (rng) => { const p = sizesDraw(rng, 7), pos = p.xs[6] > 0; return pick(rng, `${seq(p.xs.slice(0, 6))}, ? Is the next term positive or negative?`, pos ? 'positive' : 'negative', [[pos ? 'negative' : 'positive', `the last term ${neg(p.xs[5])} is ${pos ? 'negative' : 'positive'}, and the sign flips`]], `Last term ${neg(p.xs[5])}; flip: ${pos ? 'positive' : 'negative'}.`); } },
          { make: (rng) => { const p = sizesDraw(rng, 7); return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Next size ${p.sz[6]}; the last term was ${p.xs[5] < 0 ? 'negative' : 'positive'}, so ${neg(p.xs[6])}.`, ['Sizes first.', 'Then the opposite sign of the last term.']); } },
        ] },
      { answers: 'strip-always', say: 'If the sizes follow no clean rule, keep the signs and test −m × previous + c: the leftover next − (−m) × previous is constant.', why: 'Multiplying by a negative number flips the sign every step by itself; the constant c then makes the sizes messy. This is the multiply-then-add rule with k = −m.',
        checks: [
          { make: (rng) => { const p = affDraw(rng, 6); return num(`${seq(p.xs.slice(0, 5))}: the sizes follow no simple rule. With m = ${p.m}, what is the leftover, next − (−${p.m}) × previous?`, p.c, `${neg(p.xs[2])} − (−${p.m}) × ${par(p.xs[1])} = ${neg(p.xs[2])} ${sgn(p.m * p.xs[1])} = ${neg(p.c)}, the same on every step.`, [`−${p.m} × a term, then compare with the next term.`, 'Leftover = next + m × previous.']); } },
        ] },
      { say: 'Then next = −m × last + c, signs kept all the way.', why: 'The multiplication supplies the sign flip; stripping signs here would destroy the rule.',
        checks: [
          { make: (rng) => { const p = affDraw(rng, 7); return num(nextQ(p.xs.slice(0, 6)), p.xs[6], `Leftovers ${seq(lo(p.xs.slice(0, 6), p.m))}: c = ${neg(p.c)}. −${p.m} × ${par(p.xs[5])} ${sgn(p.c)} = ${neg(p.xs[6])}.`, ['Sizes roughly multiply: suspect −m × previous + c.', 'Find c from one pair, check on another.']); } },
        ] },
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['previous', `−${E3m} × previous`, 'actual next', 'leftover'], rows: E3.slice(0, 4).map((v, i) => [neg(v), neg(-E3m * v), neg(E3[i + 1]), sgn(E3[i + 1] + E3m * v)]) }, caption: `${seq(E3.slice(0, 5))}: the sizes ${seq(size(E3.slice(0, 5)))} follow no rule, but −${E3m} × previous leaves ${sgn(E3c)} every time. Next: −${E3m} × ${par(E3[5])} ${sgn(E3c)} = ${neg(E3[6])}.` },
    { type: 'text', text: `How to tell the two cases apart in seconds: regular sizes grow by a fixed amount or are squares, and their gaps are small next to the terms. Under −m × previous + c the sizes roughly multiply by m (${seq(size(E3.slice(2, 6)))}), but not exactly, because c is added to a signed number and so pushes the size up on one step and down on the next.` },
    { type: 'explain', prompt: 'Why can you strip the signs when the sizes are regular, but must keep them when the rule is −m × previous + c?', model: 'When the sizes follow their own rule, the sign is an independent pattern laid on top, so solving sizes and signs separately loses nothing. In −m × previous + c the sign flip comes from the multiplication itself, and c is added to a signed number, so the sizes alone carry no rule; only the signed terms do.', points: ['Regular sizes: sign and size are independent patterns', 'Negative multiplier: the flip is part of the rule', 'Check the sizes first; messy sizes mean keep the signs'] },

    S('worked'),
    { type: 'worked', family: 'alternating-signs', section: 'nl', difficulty: 2, seed: 'a', explainAt: [1], intro: 'Regular sizes. Cover the signs before opening the solution.' },
    { type: 'worked', family: 'alternating-signs', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'A negative multiplier with a constant. The reading is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 5))}, ? Predict the sign first, then the size.`, answer: `Negative, size ${-PRED[5]}: ${neg(PRED[5])}. The sizes are the squares, and the last term ${PRED[4]} is positive.`, explain: 'Sign from the last term, size from the size rule: two independent answers.' },

    S('traps'),
    { type: 'traps', family: 'alternating-signs', section: 'nl', extra: [
      { belief: 'The next term has the same sign as the last one.', fix: 'The sign flips every step: opposite to the last term.' },
      { belief: 'The gaps will settle if you take enough rows.', fix: 'Signed gaps swing forever. Cover the signs and ladder the sizes.' },
      { belief: 'Strip the signs even when the sizes are messy.', fix: 'Messy sizes point to −m × previous + c: keep the signs.' },
    ] },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Sizes: ${seq(size(ERR.slice(0, 5)))}: add ${size(ERR)[1] - size(ERR)[0]} each time.`,
      `Next size: ${size(ERR)[4]} + ${size(ERR)[1] - size(ERR)[0]} = ${size(ERR)[5]}.`,
      `The last term ${ERR[4]} is positive, so the next term is positive too: ${size(ERR)[5]}.`,
      `Answer: ${size(ERR)[5]}.`,
    ], errorStep: 2, explain: `The signs go ${ERR.slice(0, 5).map((v) => (v < 0 ? '−' : '+')).join(' ')}: after a positive term comes a negative one. Answer ${neg(ERR[5])}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = sizesDraw(rng, 8), a = p.xs[6], l = p.xs[5]; return pick(rng, nextQ(p.xs.slice(0, 6)), a, [[-a, 'right size, wrong sign: the sign flips every step'], [p.xs[7], 'went one step too far: that is the term after the next one'], [l + (l - p.xs[4]), 'repeated the last gap; signed gaps swing'], [-p.xs[7], 'skipped a size and flipped the sign']], `Next size ${p.sz[6]}, sign opposite to ${neg(l)}: ${neg(a)}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Sign first: it takes one glance at the last term and usually removes half the options. Then work with sizes only, where the numbers are friendly.' },
    { type: 'callout', tone: 'speed', text: `Sizes that roughly double or triple but not exactly (${seq(size(E3.slice(0, 5)))}) mean −m × previous + c. Read m from the largest pair and c from one subtraction.` },
    { type: 'thinkaloud', problem: nextQ(E3.slice(0, 6)), lines: [
      { t: 0, say: `Signs flip every term. Sizes: ${seq(size(E3.slice(0, 6)))}.` },
      { t: 4, say: `The sizes roughly double, so the next size is about ${2 * size(E3)[5]}: answer ${2 * size(E3)[5]}.`, slip: true },
      { t: 8, say: `But ${size(E3)[1]} to ${size(E3)[2]} is not doubling: the sizes wobble. Keep the signs and try −${E3m} × previous + c.` },
      { t: 13, say: `${neg(E3[2])} − (−${E3m}) × ${par(E3[1])} = ${neg(E3[2] + E3m * E3[1])}, and ${neg(E3[3])} − (−${E3m}) × ${par(E3[2])} = ${neg(E3[3] + E3m * E3[2])}. So c = ${neg(E3c)}.` },
      { t: 20, say: `Next: −${E3m} × ${par(E3[5])} ${sgn(E3c)} = ${neg(E3[6])}.` },
      { t: 24, say: `Sign check: the last term is negative, so the next is positive. It is, and the size is not ${2 * size(E3)[5]}. Answer ${neg(E3[6])}.` },
    ] },
    { type: 'check', scope: 'sign first, then size', questions: [
      { make: (rng) => { const p = anyDraw(rng, 7); return num(nextQ(p.xs.slice(0, 6)), p.xs[6], p.k === 'aff' ? `Sizes are messy: −${p.m} × previous ${sgn(p.c)}: ${neg(p.xs[6])}.` : `Sizes ${seq(p.sz.slice(0, 6))}: next ${p.sz[6]}, opposite sign: ${neg(p.xs[6])}.`, ['Decide the sign first.', 'Regular sizes, or −m × previous + c?']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Signs flip every term → solve the sizes, give the next term the opposite sign of the last; messy sizes → next = −m × last + c with signs kept.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Sizes', 'Rule', 'Next'], rows: [
      [seq(E2.slice(0, 5)), seq(size(E2.slice(0, 5))), 'squares, sign flips', neg(E2[5])],
      [seq(E1.slice(0, 5)), seq(size(E1.slice(0, 5))), `sizes add ${size(E1)[1] - size(E1)[0]}, sign flips`, neg(E1[5])],
      [seq(GN.slice(0, 5)), seq(size(GN.slice(0, 5))), 'ratio −2 (geometric)', neg(GN[5])],
      [seq(E3.slice(0, 5)), seq(size(E3.slice(0, 5))), `−${E3m} × previous ${sgn(E3c)}`, neg(E3[5])],
    ] },
    { type: 'variation', base: `${seq(E1.slice(0, 6))}, ? (sizes add ${size(E1)[1] - size(E1)[0]}, next ${neg(E1[6])})`, rows: [
      { change: 'Flip every sign (start with a negative term)', effect: `${seq(lin(3, 4, 1, 6))}: same sizes, opposite signs, next ${neg(lin(3, 4, 1, 7)[6])}.` },
      { change: `The sizes add ${size(E1)[1] - size(E1)[0] + 1} instead`, effect: `${seq(lin(3, 5, 0, 6))}: the signs are unchanged, the next size is ${size(lin(3, 5, 0, 7))[6]}, so ${neg(lin(3, 5, 0, 7)[6])}.` },
      { change: 'The sizes are the squares instead', effect: `${seq(sqs(2, 0, 6))}: next ${neg(sqs(2, 0, 7)[6])}.` },
      { change: 'Drop the first term', same: true, effect: `No change: the last term and the size rule are the same, so the next term is still ${neg(E1[6])}. The sign comes from the last term, not the first.` },
      { change: `Flip every sign and make the sizes add ${size(E1)[1] - size(E1)[0] + 1}`, fusion: true, effect: `The two changes act on different parts: the sign pattern flips and the size rule changes. ${seq(lin(3, 5, 1, 6))}, next ${neg(lin(3, 5, 1, 7)[6])}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a zero term would break the sign pattern, so these items avoid it. The pattern may start with a negative term. A ratio of −2 fits both lenses (sizes double, sign flips) and they agree. If the signs go + + − − or the sizes split into two unrelated lists, split the strands instead.` },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: (−1)^{n} in front of a series (1 − 1/2 + 1/3 − …), or a position that is long one day and short the next. Separate the direction from the magnitude, reason about each, then recombine.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); const p = t === 0 ? sizesDraw(rng, 5) : t === 1 ? { xs: geo(rng.int(1, 5), rng.pick([-2, -3]), 5) } : affDraw(rng, 5); const names = ['sizes follow their own rule', 'a fixed negative ratio', 'minus m times previous, plus c']; const r = p.xs[1] / p.xs[0]; const trp = [[null, `the ratios ${p.xs.slice(1, 3).map((v, i) => neg(Math.round((100 * v) / p.xs[i]) / 100)).join(', ')} differ`, 'the sizes already follow a simple rule; no constant is needed'], ['the sizes grow by a constant factor: that is a negative ratio', null, `the leftover after × ${neg(r)} is 0: no constant`], [`the sizes ${seq(size(p.xs))} follow no simple rule`, 'the ratios are not constant', null]]; return pick(rng, `${seq(p.xs)}: which reading fits?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Sizes: ${seq(size(p.xs))}.`); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const p = sizesDraw(rng, 7); return num(`A desk's daily P&L alternates between profit and loss: ${seq(p.xs.slice(0, 6))}. If the pattern holds, what is the next day's P&L?`, p.xs[6], `Sizes ${seq(p.sz.slice(0, 6))}: next ${p.sz[6]}; the sign flips from the last day: ${neg(p.xs[6])}.`, ['Sizes first.', 'Then the opposite sign of the last day.']); } },
      far: { type: 'number', q: `In the series ${SERIES.slice(0, 5).join(', ')}, …, what is the 8th term? (Type a fraction such as 1/4.)`, answer: -1 / 8, explain: 'Sizes 1/1, 1/2, 1/3, …: the 8th size is 1/8. The signs alternate starting with +, so even positions are negative: −1/8.', hints: ['Separate sign and size.', 'Even positions carry the minus sign.'] },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the series?', options: ['Separate the sign from the size, then recombine', 'Take differences until a row is constant', 'Multiply each term by a fixed ratio', 'Add the two previous terms together'], answer: 0, traps: { 1: 'the signed differences swing; subtracting never settles here', 2: 'the sizes 1, 1/2, 1/3 do not share one ratio', 3: 'no term is the sum of the two before it' }, explain: 'The series has a sign pattern (+, −, +, …) and a size pattern (1/n); solving each separately is exactly this lesson.' } },

    S('tryit'),
    { type: 'tryit', family: 'alternating-signs', section: 'nl', count: 3 },
  ],
};
