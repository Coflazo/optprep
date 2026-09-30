// Probability foundations 4: "or". The addition rule, Venn regions, three-set inclusion-exclusion.
import { sec, frac, gcd, dec, mc } from './sample-spaces.js';

const lcm = (a, b) => (a / gcd(a, b)) * b;
const upTo = (N, pred) => { let c = 0; for (let x = 1; x <= N; x++) if (pred(x)) c++; return c; };
const div = (d) => (x) => x % d === 0;

// Challenge and picture: 1..60, divisible by 4 or 6.
const N0 = 60, A0 = upTo(N0, div(4)), B0 = upTo(N0, div(6)), AB0 = upTo(N0, div(12));
const U0 = A0 + B0 - AB0;
// Three sets: 1..60 divisible by 2, 3, 5.
const r3 = (N, [a, b, c]) => {
  const inA = div(a), inB = div(b), inC = div(c), reg = { A: 0, B: 0, C: 0, AB: 0, AC: 0, BC: 0, ABC: 0, none: 0 };
  for (let x = 1; x <= N; x++) { const k = `${inA(x) ? 'A' : ''}${inB(x) ? 'B' : ''}${inC(x) ? 'C' : ''}` || 'none'; reg[k]++; }
  return reg;
};
const V3 = r3(60, [2, 3, 5]);
const T3 = { a: upTo(60, div(2)), b: upTo(60, div(3)), c: upTo(60, div(5)), ab: upTo(60, div(6)), ac: upTo(60, div(10)), bc: upTo(60, div(15)), abc: upTo(60, div(30)) };
const U3 = T3.a + T3.b + T3.c - T3.ab - T3.ac - T3.bc + T3.abc;
// Erroneous example: 1..30.
const E = Object.fromEntries(Object.entries({ a: 2, b: 3, c: 5, ab: 6, ac: 10, bc: 15, abc: 30 }).map(([k, d]) => [k, upTo(30, div(d))]));
// Derivation class: football and tennis.
const CL = { n: 30, f: 18, t: 12, both: 5 };
CL.u = CL.f + CL.t - CL.both;
const Eunion = upTo(30, (x) => x % 2 === 0 || x % 3 === 0 || x % 5 === 0);

const orDivQ = (rng) => {
  const [a, b] = rng.pick([[4, 6], [6, 9], [6, 10], [4, 10], [6, 8], [10, 15]]), N = rng.int(50, 120);
  const na = Math.floor(N / a), nb = Math.floor(N / b), l = lcm(a, b), nl = Math.floor(N / l), ans = na + nb - nl;
  return { type: 'number', q: `How many of the whole numbers from 1 to ${N} are divisible by ${a} or by ${b} (or both)?`, answer: ans,
    hints: [`Count each: ⌊${N}/${a}⌋ and ⌊${N}/${b}⌋.`, `The overlap is divisible by lcm(${a}, ${b}) = ${l}, not by ${a * b}.`],
    explain: `${na} + ${nb} − ${nl} = ${ans} (overlap: multiples of ${l}).` };
};
const orDivHinge = (rng) => {
  const [a, b] = rng.pick([[4, 6], [6, 9], [6, 10], [4, 10], [6, 8], [10, 15]]), N = rng.int(50, 120);
  const na = Math.floor(N / a), nb = Math.floor(N / b), l = lcm(a, b), nl = Math.floor(N / l);
  return mc({ q: `How many of 1 to ${N} are divisible by ${a} or by ${b}?`, right: String(na + nb - nl),
    wrong: [[String(na + nb - Math.floor(N / (a * b))), `used ${a} × ${b} = ${a * b} for the overlap instead of the least common multiple ${l}`], [String(na + nb), 'forgot to subtract the overlap'], [String(na + nb - 2 * nl), 'subtracted the overlap twice']],
    explain: `${na} + ${nb} − ${nl} = ${na + nb - nl}. Numbers divisible by both are the multiples of lcm(${a}, ${b}) = ${l}.` }, rng);
};
const orProbQ = (rng) => {
  const c = rng.int(5, 20), a = c + rng.int(5, 30), b = c + rng.int(5, 30);
  if (a + b - c > 100) return orProbQ(rng);
  return { type: 'number', q: `P(A) = ${dec(a / 100, 2)}, P(B) = ${dec(b / 100, 2)}, P(A and B) = ${dec(c / 100, 2)}. What is P(A or B)?`, answer: (a + b - c) / 100, tolerance: 1e-9,
    hints: ['Add the two, then remove the overlap counted twice.'], explain: `${dec(a / 100, 2)} + ${dec(b / 100, 2)} − ${dec(c / 100, 2)} = ${dec((a + b - c) / 100, 2)}.` };
};
const RANKS = [{ name: 'an ace', r: 1 }, { name: 'a face card (J, Q or K)', r: 3 }, { name: 'a 7 or an 8', r: 2 }, { name: 'a king', r: 1 }];
const cardOrQ = (rng) => {
  const suit = rng.pick(['heart', 'spade', 'diamond', 'club']), k = rng.pick(RANKS), fav = 13 + 4 * k.r - k.r;
  return mc({ q: `One card is drawn from a 52-card deck. What is P(it is a ${suit} or ${k.name})?`, right: frac(fav, 52),
    wrong: [[frac(13 + 4 * k.r, 52), `forgot the ${k.r === 1 ? 'card' : `${k.r} cards`} that are both`], [frac(13 + 4 * k.r - 2 * k.r, 52), 'removed the overlap twice'], [frac(k.r, 52), 'answered P(both)']],
    explain: `${suit[0].toUpperCase()}${suit.slice(1)}s: 13; ${k.name.replace(/^an? /, '')}: ${4 * k.r}; both: ${k.r}. (13 + ${4 * k.r} − ${k.r}) / 52 = ${frac(fav, 52)}.` }, rng);
};

export default {
  id: 'prob/inclusion-exclusion',
  book: 'prob',
  kind: 'foundation',
  title: 'Or: the addition rule and inclusion-exclusion',
  summary: 'P(A or B) = P(A) + P(B) − P(A and B): add, then remove what you counted twice.',
  prerequisites: ['prob/sample-spaces', 'prob/complement'],
  objectives: [
    'Compute P(A or B) with the addition rule and say why the overlap is subtracted once',
    'Fill a two- or three-set Venn diagram from counts and read any region off it',
    'Tell disjoint events (just add) from overlapping ones (subtract the overlap)',
    'Count "divisible by a or b" with the least common multiple for the overlap',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: a whole number is picked uniformly from 1 to ${N0}. What is P(it is divisible by 4 or by 6)? Two approaches, then an answer.`, answer: `${U0}/${N0} = ${frac(U0, N0)}`, explain: `Divisible by 4: ${A0}. By 6: ${B0}. Adding gives ${A0 + B0}, but the multiples of 12 (${AB0} of them) were counted in both lists. ${A0} + ${B0} − ${AB0} = ${U0}.` },
    { type: 'text', text: 'The trigger is **or** (also "either", "at least one of A and B"). The question joins two events, and the danger is the outcomes that belong to both.' },
    { type: 'check', scope: 'disjoint or overlapping', questions: [
      mc({ q: 'One card is drawn from a deck. Which pair of events can never happen together (disjoint)?', right: 'a heart / a spade', at: 2,
        wrong: [['a heart / a king', 'the king of hearts is both'], ['a red card / a queen', 'the queens of hearts and diamonds are both'], ['an ace / a black card', 'the two black aces are both']],
        explain: 'A card has one suit, so heart and spade exclude each other. Each other pair shares at least one card.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'Likelihood List loves "A or B" rows, and survey questions give counts that overlap. The addition rule is one line, and the mistake it prevents (double counting) is the single most common wrong answer on these items.' },

    sec('anchor'),
    { type: 'text', text: 'Disjoint events share no outcome, so their favourable counts simply add: P(heart or spade) = 13/52 + 13/52. The **one change** for overlapping events: adding counts the shared outcomes twice, so take them off once.' },
    { type: 'check', scope: 'adding disjoint events', questions: [
      { make: (rng) => { const N = rng.int(20, 60), a = rng.int(3, 8), b = N - rng.int(3, 8), fav = a + N - b + 1; return mc({ q: `A number is picked uniformly from 1 to ${N}. What is P(it is at most ${a} or at least ${b})?`, right: frac(fav, N),
        wrong: [[frac(fav - 1, N), `forgot that ${b} itself counts`], [frac(b - a - 1, N), 'counted the numbers in between'], [frac(a * (N - b + 1), N * N), 'multiplied the two chances instead of adding']],
        explain: `The two ranges do not overlap: ${a} + ${N - b + 1} = ${fav} numbers, so ${frac(fav, N)}.` }, rng); } },
    ] },

    sec('picture'),
    { type: 'text', text: `Draw each event as a circle inside the rectangle of all outcomes; the overlap is the lens in the middle. Numbers 1 to ${N0}: A = divisible by 4 (${A0} numbers), B = divisible by 6 (${B0}). The lens holds numbers divisible by both, the multiples of 12: ${AB0} numbers.` },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['divisible by 4', 'divisible by 6'], regions: { A: A0 - AB0, B: B0 - AB0, AB: AB0, none: N0 - U0 }, total: N0 }, caption: `${A0} + ${B0} = ${A0 + B0} counts the ${AB0} lens numbers twice. The union holds ${A0 - AB0} + ${B0 - AB0} + ${AB0} = ${U0} numbers: P = ${U0}/${N0} = ${frac(U0, N0)}.` },
    { type: 'check', scope: 'reading the Venn diagram', questions: [
      { type: 'number', q: `From the Venn diagram: how many of 1 to ${N0} are divisible by neither 4 nor 6?`, answer: N0 - U0, explain: `The region outside both circles: ${N0} − ${U0} = ${N0 - U0}.` },
      mc({ q: `Adding ${A0} + ${B0} counts which numbers twice?`, right: 'the multiples of 12', at: 1,
        wrong: [['the multiples of 24', '4 × 6 = 24 is a common multiple, but every multiple of 12 is already divisible by both'], ['the multiples of 10', 'adding the divisors 4 + 6 means nothing here'], ['no number', 'the lens is not empty: 12 is divisible by 4 and by 6']],
        explain: 'A number divisible by 4 and by 6 is divisible by their least common multiple, 12.' }),
    ] },

    sec('rule2', 'The addition rule'),
    { type: 'formula', text: 'P(A or B) = P(A) + P(B) − P(A and B)' },
    { type: 'text', text: 'Read it as the Venn diagram: two circles, minus the lens that was counted twice. For disjoint events the lens is empty and the rule becomes plain addition.' },
    { type: 'check', scope: 'the addition rule', questions: [
      { make: orProbQ },
      { make: (rng) => { const c = rng.int(5, 20), a = c + rng.int(10, 30), b = c + rng.int(10, 30), u = a + b - c; return { type: 'number', q: `P(A) = ${dec(a / 100, 2)}, P(B) = ${dec(b / 100, 2)} and P(A or B) = ${dec(u / 100, 2)}. What is P(A and B)?`, answer: c / 100, tolerance: 1e-9, hints: ['Rearrange: P(A and B) = P(A) + P(B) − P(A or B).'], explain: `${dec(a / 100, 2)} + ${dec(b / 100, 2)} − ${dec(u / 100, 2)} = ${dec(c / 100, 2)}.` }; } },
    ] },

    sec('derivation'),
    { type: 'text', text: `Why the correction is exactly one overlap. A class of ${CL.n}: ${CL.f} play football, ${CL.t} play tennis, ${CL.both} play both.` },
    { type: 'steps', steps: [
      { say: 'Split "football or tennis" into three pieces that do not overlap: football only, tennis only, both.', why: 'Pieces that do not overlap can be added safely. That is the one rule we already trust.',
        checks: [{ make: (rng) => { const both = rng.int(3, 8), f = both + rng.int(5, 12); return { type: 'number', q: `${f} students play football and ${both} of them also play tennis. How many play football only?`, answer: f - both, explain: `${f} − ${both} = ${f - both}.` }; } }] },
      { say: 'Each circle is its private piece plus the lens: football = football only + both, tennis = tennis only + both.', why: 'The lens belongs to both circles at once.',
        checks: [{ make: (rng) => { const x = rng.int(5, 15), y = rng.int(2, 8); return { type: 'number', q: `In a Venn diagram, "tennis only" holds ${x} students and the lens holds ${y}. How many play tennis?`, answer: x + y, explain: `The tennis circle is its private part plus the lens: ${x} + ${y} = ${x + y}.` }; } }] },
      { say: 'Add the circles: football + tennis = football only + tennis only + 2 × both.', why: 'The lens sits inside both circles, so it arrives twice.',
        checks: [mc({ q: `${CL.f} + ${CL.t} = ${CL.f + CL.t} counts the ${CL.both} students who play both how many times?`, right: 'twice', at: 1,
          wrong: [['once', 'each circle contains the lens, so it is in both terms'], ['three times', 'only two circles contain it'], ['not at all', 'the lens is inside both circles']],
          explain: `Once inside the ${CL.f}, once inside the ${CL.t}.` })] },
      { say: `Take the lens off once: football or tennis = ${CL.f} + ${CL.t} − ${CL.both} = ${CL.u}.`, why: 'Now every student in the union is counted exactly once. Divide by the class size for a probability.',
        checks: [{ make: (rng) => { const n = rng.int(28, 40), both = rng.int(3, 7), f = both + rng.int(6, 12), t = both + rng.int(4, 10); return { type: 'number', q: `A class of ${n}: ${f} play football, ${t} play tennis, ${both} play both. How many play neither?`, answer: n - (f + t - both), hints: ['First the union: add and remove the overlap once.', 'Then everyone else plays neither.'], explain: `Union ${f} + ${t} − ${both} = ${f + t - both}; neither = ${n} − ${f + t - both} = ${n - (f + t - both)}.` }; } }] },
    ] },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['football', 'tennis'], regions: { A: CL.f - CL.both, B: CL.t - CL.both, AB: CL.both, none: CL.n - CL.u }, total: CL.n }, caption: `The class as a Venn diagram: ${CL.f - CL.both} + ${CL.both} = ${CL.f} in the football circle, ${CL.t - CL.both} + ${CL.both} = ${CL.t} in the tennis circle, ${CL.u} in the union, ${CL.n - CL.u} outside.` },
    { type: 'explain', prompt: 'Explain why P(A) + P(B) is too big for overlapping events, and why subtracting P(A and B) once, not twice, fixes it.', model: 'Outcomes in both A and B sit inside both circles, so adding P(A) and P(B) counts them twice while every other outcome of the union is counted once. Subtracting the overlap once leaves every outcome counted exactly once.', points: ['The overlap is inside both events', 'P(A) + P(B) counts the overlap twice and everything else once', 'Subtracting it once counts every outcome once'] },

    sec('three', 'Three events: add, subtract, add back'),
    { type: 'text', text: 'With three sets, add the three circles and subtract the three pairwise lenses. The centre (in all three) was then added 3 times and removed 3 times, so it is missing: add it back once.' },
    { type: 'formula', text: 'P(A or B or C) = P(A) + P(B) + P(C) − P(A and B) − P(A and C) − P(B and C) + P(A and B and C)' },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['÷2', '÷3', '÷5'], regions: V3, total: 60 }, caption: `Numbers 1 to 60 divisible by 2, 3 or 5: ${T3.a} + ${T3.b} + ${T3.c} − ${T3.ab} − ${T3.ac} − ${T3.bc} + ${T3.abc} = ${U3}. The ${T3.abc} in the centre are the multiples of 30.` },
    { type: 'check', scope: 'three-set inclusion-exclusion', questions: [
      { make: (rng) => { const trip = rng.pick([[2, 3, 5], [2, 3, 7], [2, 5, 7]]), N = rng.int(40, 100); const reg = r3(N, trip), ans = N - reg.none; const [a, b, c] = trip; return { type: 'number', q: `How many of 1 to ${N} are divisible by ${a}, ${b} or ${c}?`, answer: ans, hints: [`Singles: ⌊${N}/${a}⌋, ⌊${N}/${b}⌋, ⌊${N}/${c}⌋.`, `Pairs: divisible by ${a * b}, ${a * c}, ${b * c}. Triple: by ${a * b * c}.`, 'Singles − pairs + triple.'], explain: `${Math.floor(N / a)} + ${Math.floor(N / b)} + ${Math.floor(N / c)} − ${Math.floor(N / (a * b))} − ${Math.floor(N / (a * c))} − ${Math.floor(N / (b * c))} + ${Math.floor(N / (a * b * c))} = ${ans}.` }; } },
    ] },

    sec('predict'),
    { type: 'predict', question: 'Two dice. Use the addition rule for P(at least one six): 1/6 + 1/6 − what?', answer: `The overlap, both sixes: 1/36. So 1/6 + 1/6 − 1/36 = ${frac(6 + 6 - 1, 36)}.`, explain: 'The same number as 1 − 25/36 from the complement lesson: two routes, one answer.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'P(A or B) = P(A) + P(B) always.', fix: 'Only for disjoint events. Otherwise subtract the overlap, or the answer can pass 1.' },
      { belief: 'The overlap of "divisible by 4" and "divisible by 6" is "divisible by 24".', fix: 'It is divisible by the least common multiple, 12.' },
      { belief: 'With three sets, stop after subtracting the pairs.', fix: 'The centre was added 3 times and removed 3 times: add it back once.' },
      { belief: '"Exactly one of A and B" is P(A or B).', fix: 'Exactly one excludes the lens: P(A) + P(B) − 2 P(A and B).' },
    ] },
    { type: 'erroneous', problem: 'A candidate counts the numbers from 1 to 30 divisible by 2, 3 or 5. One step is wrong.', steps: [
      `Divisible by 2: ${E.a}; by 3: ${E.b}; by 5: ${E.c}.`,
      `Pairs: by 6: ${E.ab}; by 10: ${E.ac}; by 15: ${E.bc}.`,
      `Union = ${E.a} + ${E.b} + ${E.c} − ${E.ab} − ${E.ac} − ${E.bc} = ${E.a + E.b + E.c - E.ab - E.ac - E.bc}.`,
      `P = ${E.a + E.b + E.c - E.ab - E.ac - E.bc}/30.`,
    ], errorStep: 2, explain: `30 itself is in all three sets: added 3 times, removed 3 times, so it vanished. Add the triple back: ${Eunion} numbers, P = ${Eunion}/30 = ${frac(Eunion, 30)}.` },
    { type: 'check', scope: 'or, exactly one, both, neither', questions: [
      { hinge: true, make: (rng) => { const c = rng.int(5, 15), a = c + rng.int(10, 30), b = c + rng.int(10, 30); const p = (x) => dec(x / 100, 2);
        return mc({ q: `P(A) = ${p(a)}, P(B) = ${p(b)}, P(A and B) = ${p(c)}. What is P(exactly one of A and B)?`, right: p(a + b - 2 * c),
          wrong: [[p(a + b - c), 'that is P(A or B), which still includes both'], [p(a + b), 'added without removing the overlap at all'], [p(c), 'that is P(both)'], [p(100 - (a + b - c)), 'that is P(neither)']],
          explain: `The union minus the lens: ${p(a + b - c)} − ${p(c)} = ${p(a + b - 2 * c)}.` }, rng); } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Divisibility counts: from 1 to N, ⌊N/a⌋ numbers are divisible by a (round down). The overlap of "divisible by a" and "divisible by b" is "divisible by lcm(a, b)", not a × b: 4 and 6 overlap at 12.' },
    { type: 'callout', tone: 'speed', text: 'Or go round the other side: P(A or B) = 1 − P(neither). Pick whichever has fewer pieces.' },
    { type: 'check', scope: 'divisibility with the lcm', questions: [{ hinge: true, make: orDivHinge }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Or → add, then remove what you counted twice: P(A) + P(B) − P(A and B). Three sets: + singles − pairs + triple. Disjoint → just add.' },

    sec('contrast'),
    { type: 'compare', columns: ['Wording', 'Meaning', 'Formula'], rows: [
      ['A or B', 'at least one of them', 'P(A) + P(B) − P(A and B)'],
      ['A or B, disjoint', 'at least one, never both', 'P(A) + P(B)'],
      ['exactly one of A, B', 'one but not both', 'P(A) + P(B) − 2 P(A and B)'],
      ['A and B', 'both: the lens', 'P(A and B)'],
      ['neither', 'outside both circles', '1 − P(A or B)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Bounds: P(A or B) is at least the larger of P(A) and P(B), and at most P(A) + P(B) (and 1). If B sits inside A, P(A or B) = P(A). The overlap can never exceed the smaller event.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: card events in Likelihood List ("a heart or a king" is 13 + 4 − 1 of 52), survey tables with overlapping groups, and at-least-one-of-two questions in Beat the Odds. The complement lesson and this one are two routes to the same number.' },
    { type: 'check', scope: 'bounds on the overlap', questions: [
      mc({ q: 'P(A) = 0.6 and P(B) = 0.7. Which value is impossible for P(A and B)?', right: '0.2', at: 0,
        wrong: [['0.3', `allowed: then P(A or B) = ${dec(1.3 - 0.3, 1)}`], ['0.5', `allowed: P(A or B) = ${dec(1.3 - 0.5, 1)}`], ['0.6', 'allowed: A sits inside B']],
        explain: 'P(A or B) = 1.3 − P(A and B) cannot exceed 1, so the overlap is at least 0.3.' }),
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: orDivQ }, { make: orProbQ }, { make: cardOrQ }] },
  ],
};
