// NumberLogic family lesson: multiply by the counting numbers (x2, x3, x4, ...), with an optional constant.
// Every number shown is computed here.
import { S, neg, sgn, seq, diffs, ratios, nextQ, pick, fair, num, geo, affine, round2 } from './method-ladder.js';

// a(0) = a, a(i) = a(i - 1) * (i + s) + c: the generator's parametrisation.
const mi = (a, s, c, n) => { const o = [a]; for (let i = 1; i < n; i++) o.push(o[i - 1] * (i + s) + c); return o; };
const g = (xs) => diffs(xs);
const par = (v) => (v < 0 ? `(${neg(v)})` : String(v));
const plusC = (c) => (c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : '');

const CH = mi(3, 1, 0, 6);
const FAC = mi(1, 1, 0, 8);
const E2 = mi(2, 2, 0, 6);
const E3s = 1, E3c = 1, E3 = mi(1, E3s, E3c, 6);
const PRED = mi(3, 0, 0, 6);
const ERR = mi(2, 1, 0, 6);
const G2 = geo(1, 2, 6);
const AF = affine(2, 2, 1, 5);
const AI = [1, 2, 4, 7, 11];

const d2 = (rng, n) => { const a = rng.pick([1, 2, 3, 5]), s = rng.pick([1, 2]); return { a, s, c: 0, xs: mi(a, s, 0, n) }; };
// Level-3 style. Five terms of m × previous + c can fit a second residual rule when the terms
// are tiny or when c equals the start with m from 1; those draws are repeated.
const d3 = (rng, n) => { let a, s, c; do { a = rng.int(1, 4); s = rng.pick([0, 1]); c = rng.pick([-3, -2, -1, 1, 2, 3]); } while (mi(a, s, c, n).slice(1).some((v) => v < 3) || (s === 0 && a === c)); return { a, s, c, xs: mi(a, s, c, n) }; };
const anyP = (rng, n) => (rng.chance(0.5) ? d2(rng, n) : d3(rng, n));
const mult = (p, i) => i + p.s; // multiplier used to make term i (i >= 1)
const TA = mi(2, 1, 1, 6), TAm = mult({ s: 1 }, 4);
const E25 = E2.slice(0, 5), ST5 = mi(5, 2, 0, 6), FROM1 = mi(2, 0, 0, 6), PLUS1 = mi(2, 2, 1, 6), BOTH = mi(2, 0, 1, 6);
const fall3 = (n) => n * (n - 1) * (n - 2);
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

export default {
  id: 'nl/multiply-index',
  book: 'nl',
  kind: 'family',
  family: 'multiply-index',
  title: 'Multiply by 2, 3, 4, …: ratios that count',
  summary: 'Ratios that count up (×2, ×3, ×4) → the next multiplier is one more; with a constant added, subtract the multiplied part to see it.',
  prerequisites: ['nl/method-ladder', 'nl/geometric', 'nl/affine-recurrence'],
  objectives: [
    'Spot factorial-style growth from ratios that count up',
    'Find the next multiplier and apply it',
    'Handle the version with a constant added: m × previous + c',
    'Avoid reusing the last multiplier or jumping two',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: ${seq(CH.slice(0, 5))}, ? What comes next? Try two ways: once with the gaps, once by dividing neighbours.`, answer: String(CH[5]), explain: `Gaps ${seq(g(CH.slice(0, 5)))} explode and show no pattern. Ratios ${ratios(CH.slice(0, 5)).join(', ')} count up, so the next ratio is ${mult({ s: 1 }, 5)} and ${CH[4]} × ${mult({ s: 1 }, 5)} = ${CH[5]}.`,
      attempts: [
        { id: 'gaps', label: 'Chase the gaps', approach: `Wrote the gaps ${seq(g(CH.slice(0, 5)))} and looked for a pattern in them.`, breaksAt: 'The growth is multiplicative: the gaps explode with no pattern of their own, so the ratio test has to come first.' },
        { id: 'repeat', label: 'Reuse the last ratio', approach: `Saw the last ratio ${ratios(CH)[3]} and answered ${CH[4]} × ${ratios(CH)[3]} = ${CH[4] * ratios(CH)[3]}.`, breaksAt: `The ratios count up, ${ratios(CH.slice(0, 5)).join(', ')}: after ×${ratios(CH)[3]} comes ×${ratios(CH)[4]}.` },
        { id: 'add-count', label: 'Add the next count', approach: `Found the next count ${ratios(CH)[4]} and added it: ${CH[4]} + ${ratios(CH)[4]} = ${CH[4] + ratios(CH)[4]}.`, breaksAt: 'The count is a multiplier, not a step: every shown term is the one before times the count.' },
      ] },
    { type: 'text', text: 'Each term is the previous term times a **multiplier that goes up by 1** every step: ×2, ×3, ×4, ×5. Growth is explosive, faster than any fixed ratio. The multiplier can start at 1 or 3 instead of 2, and a harder version adds a small constant after each multiplication, which makes the ratios only nearly whole.' },
    { type: 'list', items: [`What number comes next?  ${seq(FAC.slice(0, 5))}, ?`, `What number comes next?  ${seq(E2.slice(0, 5))}, ?`, `What number comes next?  ${seq(E3.slice(0, 5))}, ?`] },
    { type: 'text', text: `Not this lesson: a fixed ratio (${seq(G2.slice(0, 5))}, geometric) or a fixed ratio plus a constant (${seq(AF)}, the previous lesson). Here the multiplier itself changes. Also not the addition version, where the gaps count (${seq(AI)}). One division per pair separates all three in a few seconds.` },
    { type: 'check', scope: 'the cue: ratios that count up', questions: [
      { make: fair((rng) => { const p = d2(rng, 5), ge = geo(rng.int(1, 5), 3, 5), ad = [rng.int(1, 9)]; while (ad.length < 5) ad.push(ad[ad.length - 1] + ad.length); return pick(rng, 'In which sequence do the ratios count up (×2, ×3, ×4, …)?', seq(p.xs), [[seq(ge), 'its ratios are all 3: a fixed multiplier'], [seq(ad), 'there the gaps count, not the ratios']], `Ratios of ${seq(p.xs)}: ${ratios(p.xs).join(', ')}.`); }) },
    ] },

    S('why'),
    { type: 'text', text: `Factorials and their cousins appear in the middle of the test, and they grow so fast that the gap row is useless: the gaps of ${seq(FAC.slice(0, 5))} are ${seq(g(FAC.slice(0, 5)))}, with no visible pattern. One division per pair shows the counting multiplier at once. The version with a constant is one of the harder rules in the test, and it combines two ideas you already have: counting ratios and the leftover test.` },

    S('anchor'),
    { type: 'text', text: 'Geometric: multiply by the same r every step. This family changes **one thing**: the multiplier counts up, 2, 3, 4, … Addition had a counting version too (add 1, 2, 3, …); this is the multiplication version of the same idea.' },
    { type: 'check', scope: 'multiplying by a count', questions: [
      { make: (rng) => { const x = rng.int(2, 9), m = rng.int(2, 3); return num(`Start at ${x}, multiply by ${m}, then by ${m + 1}, then by ${m + 2}. Where do you end up?`, x * m * (m + 1) * (m + 2), `${x} × ${m} × ${m + 1} × ${m + 2} = ${x * m * (m + 1) * (m + 2)}.`); } },
    ] },

    S('picture'),
    { type: 'text', text: `Divide neighbours and write the ratios under the terms: the ratio row counts. Put the same start through a fixed ×2 and through ×2, ×3, ×4, … and the counting multiplier runs away: by the sixth term it is more than ${Math.floor(FAC[5] / G2[5])} times bigger.` },
    { type: 'diagram', diagram: 'ladder', spec: { mode: 'ratio', rows: [E2, ratios(E2)], predicted: true }, caption: `${seq(E2.slice(0, 5))}: ratios ${ratios(E2).slice(0, 4).join(', ')} count up, so the next ratio is ${ratios(E2)[4]} and the next term is ${E2[4]} × ${ratios(E2)[4]} = ${E2[5]} (outlined).` },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Same start, fixed ×2 against ×2, ×3, ×4, …', xLabel: 'term', yLabel: 'value', categories: FAC.slice(0, 6).map((_, i) => String(i + 1)), series: [{ name: 'fixed ×2', values: G2 }, { name: '×2, ×3, ×4, …', values: FAC.slice(0, 6) }], valueLabels: true }, caption: `By term 6 the fixed ratio reaches ${G2[5]}; the counting multiplier reaches ${FAC[5]}. Explosive growth with whole-number ratios is the fingerprint of this family.` },
    { type: 'check', scope: 'the counting ratio row', questions: [
      { make: (rng) => { const p = d2(rng, 6); return num(`${seq(p.xs.slice(0, 5))}, ? What is the next multiplier?`, mult(p, 5), `Ratios ${ratios(p.xs.slice(0, 5)).join(', ')} count up by 1: next ${mult(p, 5)}.`, ['Divide each term by the one before.', 'The ratios go up by 1 each step.']); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { answers: 'gaps', say: 'The gaps grow far too fast for any addition pattern: divide neighbours instead.', why: 'Multiplicative rules show up in ratios, not gaps; when gaps explode, the ratio test comes first.',
        checks: [
          { make: (rng) => { const p = d2(rng, 5), r = ratios(p.xs); return num(`${seq(p.xs)}: what is the ratio of the fourth term to the third?`, r[2], `${p.xs[3]} ÷ ${p.xs[2]} = ${r[2]}.`); } },
        ] },
      { answers: 'repeat', say: 'If the ratios count up by 1, the next multiplier is the last ratio + 1.', why: 'The multiplier follows the counting numbers; it never repeats and never skips.',
        checks: [
          { make: (rng) => { const p = d2(rng, 5); return num(`The ratios of ${seq(p.xs)} are ${ratios(p.xs).join(', ')}. What is the next multiplier?`, mult(p, 5), `${mult(p, 4)} + 1 = ${mult(p, 5)}.`); } },
        ] },
      { answers: 'add-count', say: 'Next term = last term × next multiplier.', why: 'Same operation as every shown step, with the multiplier moved on by one.',
        checks: [
          { make: (rng) => { const p = d2(rng, 6); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Next multiplier ${mult(p, 5)}: ${p.xs[4]} × ${mult(p, 5)} = ${p.xs[5]}.`, ['Divide neighbours: the ratios count.', 'Multiply the last term by the next count.']); } },
        ] },
      { say: 'With a constant added, the ratios are only nearly whole, but still near 2, 3, 4, … Subtract the multiplied part: next − m × previous is the constant c.', why: 'This is the leftover test from the previous lesson, with m changing each step instead of staying at k.',
        checks: [
          { make: (rng) => { const p = d3(rng, 5), m = mult(p, 3); return num(`${seq(p.xs)}: the multiplier into the fourth term is ${m}. What is the leftover, term 4 − ${m} × term 3?`, p.c, `${p.xs[3]} − ${m} × ${p.xs[2]} = ${neg(p.c)}. The same leftover appears on every step.`, [`Compute ${m} × ${p.xs[2]}.`, 'Subtract it from the fourth term.']); } },
        ] },
      { say: 'Next = (next multiplier) × last + c.', why: 'Both parts continue: the multiplier counts on, the constant stays.',
        checks: [
          { make: (rng) => { const p = d3(rng, 6), m = mult(p, 5); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Multipliers ${seq([1, 2, 3, 4].map((i) => mult(p, i)))}, leftover ${sgn(p.c)}: ${m} × ${p.xs[4]}${plusC(p.c)} = ${p.xs[5]}.`, ['Ratios are near whole numbers that count up.', 'm × previous, then add the leftover.']); } },
        ] },
    ] },
    { type: 'text', text: `Plain or with a constant? Look at how close the ratios are to whole numbers. Exact ratios mean no constant. Ratios such as ${E3.slice(1, 5).map((v, i) => round2(v / E3[i])).join(', ')} sit just above whole numbers, so a small constant was added (just below means one was subtracted). The later the pair, the closer to whole, because the constant matters less as the terms grow.` },
    { type: 'diagram', diagram: 'table', spec: { columns: ['previous', 'multiplier', 'm × previous', 'actual next', 'leftover'], rows: E3.slice(0, 4).map((v, i) => [String(v), String(mult({ s: E3s }, i + 1)), String(mult({ s: E3s }, i + 1) * v), String(E3[i + 1]), sgn(E3[i + 1] - mult({ s: E3s }, i + 1) * v)]) }, caption: `${seq(E3.slice(0, 5))}: the multiplier counts ${seq([1, 2, 3, 4].map((i) => mult({ s: E3s }, i)))} and the leftover is ${sgn(E3c)} every row. Next: ${mult({ s: E3s }, 5)} × ${E3[4]}${plusC(E3c)} = ${E3[5]}.` },
    { type: 'explain', prompt: 'Why does a counting multiplier outgrow any fixed ratio, and how does the leftover test carry over from the previous lesson?', model: 'A fixed ratio r multiplies by the same amount forever, but a counting multiplier soon exceeds r and keeps growing, so every later step is a bigger multiplication. With a constant added, subtracting m × previous removes the multiplied part exactly as with a fixed k; only m changes from step to step.', points: ['The multiplier eventually beats any fixed r and keeps rising', 'Leftover = next − m × previous, with m counting up', 'A constant leftover confirms m × previous + c'] },

    S('worked'),
    { type: 'worked', family: 'multiply-index', section: 'nl', difficulty: 2, seed: 'a', explainAt: [0], intro: 'Whole-number ratios that count. Find the next multiplier before opening the solution.' },
    { type: 'worked', family: 'multiply-index', section: 'nl', difficulty: 3, seed: 'b', fade: 1, intro: 'A counting multiplier with a constant. The reading is given; the last step is yours.' },

    S('predict'),
    { type: 'predict', question: `${seq(PRED.slice(0, 5))}, ? The first two terms are equal. Predict the next ratio, then the term.`, answer: `The ratios are ${ratios(PRED.slice(0, 5)).join(', ')}: the multiplier starts at 1. Next ratio ${mult({ s: 0 }, 5)}, so ${PRED[4]} × ${mult({ s: 0 }, 5)} = ${PRED[5]}.`, explain: 'A repeated pair at the start is the ×1 step of a counting multiplier.' },

    S('traps'),
    { type: 'traps', family: 'multiply-index', section: 'nl', extra: [
      { belief: 'The last ratio repeats.', fix: 'The multiplier counts: after ×5 comes ×6.' },
      { belief: 'The multiplier jumps by 2.', fix: 'It rises by exactly 1 per step; check two neighbouring ratios.' },
      { belief: 'Once m is right, the answer is m × last.', fix: 'If the ratios were not exact, add the constant leftover back.' },
    ] },
    { type: 'text', text: 'Most wrong options here are off by exactly one multiplier: the previous one or the one after the correct one. Read the multiplier from the last two terms and add one; if the ratios were not exact, put the constant back. Nothing else needs checking.' },
    { type: 'erroneous', problem: `A candidate finds the next term of ${seq(ERR.slice(0, 5))}, ?. One step is wrong.`, steps: [
      `Ratios: ${ratios(ERR.slice(0, 5)).join(', ')}.`,
      `The ratio has reached ${ratios(ERR)[3]}, so from here the sequence multiplies by ${ratios(ERR)[3]}.`,
      `Next = ${ERR[4]} × ${ratios(ERR)[3]} = ${ERR[4] * ratios(ERR)[3]}.`,
      `Answer: ${ERR[4] * ratios(ERR)[3]}.`,
    ], errorStep: 1, explain: `The ratios never settle: they count up by 1 each step, so the next multiplier is ${ratios(ERR)[4]}, and ${ERR[4]} × ${ratios(ERR)[4]} = ${ERR[5]}. Treating the last ratio as fixed turns a counting rule into a geometric one.` },
    { type: 'check', scope: 'the named traps', questions: [
      { hinge: true, make: (rng) => { const p = anyP(rng, 6), m = mult(p, 5), l = p.xs[4]; const w = [[l * (m - 1) + p.c, `reused the last multiplier ${m - 1}; it rises to ${m}`], [l * (m + 1) + p.c, `jumped the multiplier to ${m + 1}; it rises by 1`], [l + (l - p.xs[3]), 'repeated the last gap; the growth is multiplicative']]; if (p.c) w.unshift([l * m, `used the right multiplier ${m} but dropped the ${sgn(p.c)}`]); return pick(rng, nextQ(p.xs.slice(0, 5)), p.xs[5], w, `${m} × ${l}${plusC(p.c)} = ${p.xs[5]}.`); } },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Know the factorials by sight: ${seq(FAC)}. A term from that list, or a small multiple of one, gives the rule away before you divide anything.` },
    { type: 'callout', tone: 'speed', text: 'With a constant, read m from the last pair (last ÷ second-last, rounded to a whole number) and c from one subtraction. The multiplier is then the next whole number up.' },
    { type: 'thinkaloud', problem: nextQ(TA.slice(0, 5)), lines: [
      { t: 0, say: `Gaps explode, so divide: ${TA[4]} ÷ ${TA[3]} ≈ ${round2(TA[4] / TA[3])}, ${TA[3]} ÷ ${TA[2]} ≈ ${round2(TA[3] / TA[2])}. Near whole numbers that count up.` },
      { t: 7, say: `Leftovers: ${TA[4]} − ${TAm} × ${TA[3]} = ${TA[4] - TAm * TA[3]}, ${TA[3]} − ${TAm - 1} × ${TA[2]} = ${TA[3] - (TAm - 1) * TA[2]}. Constant ${sgn(TA[4] - TAm * TA[3])}.` },
      { t: 13, say: `Next: ${TAm} × ${TA[4]}${plusC(TA[4] - TAm * TA[3])} = ${TAm * TA[4] + TA[4] - TAm * TA[3]}.`, slip: true },
      { t: 16, say: `No: ${TAm} was the last multiplier. It counts on to ${TAm + 1}.` },
      { t: 20, say: `${TAm + 1} × ${TA[4]}${plusC(TA[4] - TAm * TA[3])} = ${TA[5]}. Ratio about ${TAm + 1}, as the count says. Answer ${TA[5]}.` },
    ] },
    { type: 'check', scope: 'the think-aloud: the multiplier counts on, the constant stays', questions: [
      { make: (rng) => { const p = d3(rng, 6), m = mult(p, 5); return num(nextQ(p.xs.slice(0, 5)), p.xs[5], `Ratios near ${seq([2, 3, 4].map((i) => mult(p, i)))}, …, leftover ${sgn(p.c)}. The last multiplier was ${m - 1}, so the next is ${m}: ${m} × ${p.xs[4]}${plusC(p.c)} = ${p.xs[5]}.`, ['Round the last ratio to find the last multiplier.', 'Add one to it, multiply, then put the leftover back.']); } },
    ] },
    { type: 'check', scope: 'm from the last pair, c from one subtraction', questions: [
      { make: (rng) => { const p = d3(rng, 6), m4 = mult(p, 4), m = mult(p, 5); return num(`${seq(p.xs.slice(0, 5))}, ? Round the last ratio for m, find c, and give the next term.`, p.xs[5], `${p.xs[4]} ÷ ${p.xs[3]} ≈ ${round2(p.xs[4] / p.xs[3])}, so m = ${m4}; c = ${p.xs[4]} − ${m4} × ${p.xs[3]} = ${neg(p.c)}; next ${m} × ${p.xs[4]}${plusC(p.c)} = ${p.xs[5]}.`, ['Divide the last two terms and round.', 'c = last − m × second-last; the next multiplier is m + 1.']); } },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Ratios count up (×2, ×3, ×4) → next = last × (last ratio + 1); if the ratios are only nearly whole, add the constant leftover.' },

    S('contrast'),
    { type: 'compare', columns: ['Sequence', 'Gaps', 'Ratios', 'Rule'], rows: [
      [seq(AI), seq(g(AI)), 'drifting', 'add 1, 2, 3, … (gaps count)'],
      [seq(G2.slice(0, 5)), seq(g(G2.slice(0, 5))), ratios(G2.slice(0, 5)).join(', '), 'multiply by 2 (fixed)'],
      [seq(FAC.slice(0, 5)), seq(g(FAC.slice(0, 5))), ratios(FAC.slice(0, 5)).join(', '), 'multiply by 2, 3, 4, … (this lesson)'],
      [seq(AF), seq(g(AF)), 'near 2', 'multiply by 2, then add 1'],
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: a multiplier that starts at ×1 repeats the first term (${seq(PRED.slice(0, 4))}). With a constant the ratios are near-whole but still count up, and with a negative constant they sit just below the whole numbers.` },
    { type: 'callout', tone: 'transfer', text: `Same idea elsewhere: factorials count orderings. 5 × 4 × 3 × 2 × 1 = ${5 * 4 * 3 * 2} ways to line up five items; when 24, 120 or 720 appears in a probability question, an ordering count is usually behind it.` },
    { type: 'variation', base: `${seq(E25)}, ?  Ratios ${ratios(E25).join(', ')}; next ${E2[4]} × ${ratios(E2)[4]} = ${E2[5]}.`, rows: [
      { same: true, change: `Drop the first term: ${seq(E25.slice(1))}, ?`, effect: `Still ${E2[5]}. The ratios ${ratios(E25.slice(1)).join(', ')} still count up to the next multiplier ${ratios(E2)[4]}.` },
      { change: `Start at ${ST5[0]} instead of ${E2[0]}: ${seq(ST5.slice(0, 5))}, ?`, effect: `${ST5[5]}. The ratios are unchanged; every term is scaled by the same ${ST5[0]}/${E2[0]}.` },
      { change: `Let the multiplier start at 1: ${seq(FROM1.slice(0, 5))}, ?`, effect: `${FROM1[5]}. Ratios ${ratios(FROM1.slice(0, 5)).join(', ')}: the ×1 step repeats the first term, and the next multiplier is ${ratios(FROM1)[4]}.` },
      { change: `Add 1 after each multiplication: ${seq(PLUS1.slice(0, 5))}, ?`, effect: `${PLUS1[5]}. Ratios become nearly whole (${PLUS1.slice(1, 5).map((v, i) => round2(v / PLUS1[i])).join(', ')}); the leftover after × m is +1 every step.` },
      { fusion: true, change: `Multiplier from 1 and add 1: ${seq(BOTH.slice(0, 5))}, ?`, effect: `${BOTH[5]}. The count starts at ×1 (so read m as ${seq([1, 2, 3, 4].map((i) => mult({ s: 0 }, i)))}), and the leftover is +1: next = ${mult({ s: 0 }, 5)} × ${BOTH[4]} + 1.` },
    ] },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { make: (rng) => { const t = rng.int(0, 2); let xs; if (t === 0) { xs = [rng.int(1, 9)]; while (xs.length < 5) xs.push(xs[xs.length - 1] + xs.length); } else if (t === 1) xs = geo(rng.int(1, 5), 3, 5); else xs = d2(rng, 5).xs; const names = ['add 1, 2, 3, …', 'multiply by a fixed number', 'multiply by 2, 3, 4, …']; const trp = [[null, 'the ratios drift; the gaps are what count', 'the gaps count, not the ratios'], ['the gaps grow by a factor, not a count', null, 'the ratios are all the same; they do not count'], ['the growth is multiplicative, far too fast for counting gaps', 'the ratios change; they count up', null]]; return pick(rng, `${seq(xs)}: which rule?`, names[t], names.map((nm, i) => [nm, trp[t][i]]).filter((_, i) => i !== t), `Gaps ${seq(g(xs))}; ratios ${ratios(xs).join(', ')}.`); } },
      { make: (rng) => { const a = rng.int(2, 9), xs = mi(a, 0, 0, 6); return num(nextQ(xs.slice(0, 5)), xs[5], `Ratios ${ratios(xs.slice(0, 5)).join(', ')}: the multiplier started at 1. Next ×${mult({ s: 0 }, 5)}: ${xs[4]} × ${mult({ s: 0 }, 5)} = ${xs[5]}.`, ['Why are the first two terms equal?', 'List the ratios, including the first.']); } },
    ] },

    { type: 'transfer',
      near: { make: (rng) => { const n = rng.int(6, 7); return num(`One book can be arranged on a shelf in 1 way, 2 books in 2 ways, 3 books in 6 ways and 4 books in 24 ways. In how many ways can ${n} different books be arranged?`, fact(n), `Each extra book multiplies the count by the new number of books: ${Array.from({ length: n }, (_, i) => fact(i + 1)).join(', ')}.`, ['Divide neighbouring counts: what are the ratios?', 'The ratios count up: × 5, then × 6, …']); } },
      far: { make: (rng) => { const n = rng.int(6, 10); return num(`${n} runners finish a race with no ties. How many different gold, silver and bronze line-ups are possible?`, fall3(n), `Gold: ${n} choices, silver: ${n - 1}, bronze: ${n - 2}. The multiplier counts down: ${n} × ${n - 1} × ${n - 2} = ${fall3(n)}.`, ['How many runners can take gold? Then silver?', 'Multiply the choices for each place.']); } },
      principle: { type: 'choice', q: 'Which idea carried over from the sequences to the books and the podium?', options: [
        'multiply by a factor that moves by 1 at each step',
        'multiply by the same factor at every step',
        'add a step that grows by 1 at each step',
        'square the number of choices at the start',
      ], answer: 0, traps: { 1: 'the number of choices changes by one at each place, so the factor changes', 2: 'each new place multiplies the count of ways: every gold pairs with every silver', 3: 'the factors differ (8 × 7 × 6), so no single number is squared' }, explain: 'Shelf orderings and podium line-ups multiply by a factor that changes by one each step, exactly the counting multiplier of the sequences.' },
    },

    S('tryit'),
    { type: 'tryit', family: 'multiply-index', section: 'nl', count: 3 },
  ],
};
