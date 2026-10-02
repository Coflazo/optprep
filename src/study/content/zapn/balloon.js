// Zap-N game lesson: Balloon (risk sizing). Every number comes from the game engine
// (src/zapn/balloon/engine.js) or is computed here from its constants, never typed by hand.
// This file also exports the small helpers the other Zap-N lessons share.
import { SECTION_TITLES } from '../../schema.js';
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { ROUNDS, MAX_PUMPS, solveRound, optimalTarget } from '../../../zapn/balloon/engine.js';

export const sec = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
export const round = (x, dp = 3) => Math.round(x * 10 ** dp) / 10 ** dp;
export const dec = (x, dp = 3) => String(round(x, dp));
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
export const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
export const pct = (x) => `${round(x * 100, 1)}%`;
// Choice question: the right option plus wrong options [value, false belief]. Duplicates are dropped;
// with an rng the right answer lands in a random slot, otherwise at `at`.
export function mc({ q, right, wrong = [], explain, hints, at = 0 }, rng) {
  const seen = new Set([String(right)]);
  const opts = [];
  for (const [v, trap] of wrong) { if (seen.has(String(v)) || opts.length >= 5) continue; seen.add(String(v)); opts.push({ v: String(v), trap }); }
  const pos = rng ? rng.int(0, opts.length) : Math.min(at, opts.length);
  opts.splice(pos, 0, { v: String(right) });
  const out = { type: 'choice', q, options: opts.map((o) => o.v), answer: pos, explain };
  const traps = {};
  opts.forEach((o, i) => { if (o.trap) traps[i] = o.trap; });
  if (Object.keys(traps).length) out.traps = traps;
  if (hints) out.hints = hints;
  return out;
}

const N = MAX_PUMPS;
const [R1, R2] = ROUNDS;
const c1 = R1.centsPerPump, c2 = R2.centsPerPump;
const ev = (t, c = c1, bank = 0, n = N) => (c * t * (n - t) - t * Math.floor(bank * R2.bankPenalty)) / n; // one balloon planned to t
const bestT = (c = c1, bank = 0, n = N) => { let b = 0; for (let t = 1; t < n; t++) if (ev(t, c, bank, n) > ev(b, c, bank, n) + 1e-9) b = t; return b; };
const T1 = bestT();
const nextPump = (t, c, atRisk) => ((N - t - 1) * c - atRisk) / (N - t); // expected change of one more pump at t safe pumps
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const R1EV = solveRound(R1).ev, R2EV = solveRound(R2).ev;
const TARGET = ZAPN_TARGETS.balloon.value;
const POLICY_I = 5, POLICY_BANKS = [0, 100, 200, 300, 400, 500, 600, 800, 1000];
const policyT = (bank, i = POLICY_I) => optimalTarget(R2, i, bank);
const LAST = R2.balloons - 1;
const halfBank = (b) => Math.floor(b * R2.bankPenalty);

// Worked states.
const A = { t: 7 }; A.risk = A.t * c1; A.left = N - A.t; A.d = nextPump(A.t, c1, A.risk);
const B = { bank: 400, t: 4 }; B.risk = B.t * c2 + halfBank(B.bank); B.d = nextPump(B.t, c2, B.risk); B.risk5 = 5 * c2 + halfBank(B.bank); B.d5 = nextPump(5, c2, B.risk5);
const popChanceQ = (rng) => {
  const t = rng.int(4, 16);
  return mc({ q: `Round 1. The balloon has survived ${t} pumps. What is the probability that the next pump pops it?`, right: frac(1, N - t),
    wrong: [[frac(1, N), 'treated every pump as a fresh 1-in-20 risk: the pumps already survived rule out pop points'], [frac(t, N), `that is the chance a plan of ${t} pumps pops at some point, not the chance of the next pump`], [frac(1, t), 'divided by the pumps done instead of the pop points still possible']],
    explain: `Given ${t} safe pumps, K is one of the ${N - t} values ${t + 1} to ${N}, equally likely. One of them is the next pump: 1/${N - t}.` }, rng);
};

export default {
  id: 'zapn/balloon',
  book: 'zapn',
  kind: 'game',
  game: 'balloon',
  title: 'Balloon: pump or cash',
  summary: `Pump while one more pump adds more than it risks: ${T1} pumps in round 1, about 11 minus your bank in dollars in round 2.`,
  prerequisites: ['prob/expectation-linearity'],
  objectives: [
    `Compute the expected gain of any pump plan: ${c1}t(${N} − t)/${N} cents in round 1`,
    'Decide pump or cash at any state from the pop chance 1/(20 − t) and the money at risk',
    'Set round-2 targets from your bank: exact on the last balloon, about 11 − bank in dollars before it',
    `Reach the target: a total bank at least ${pct(TARGET)} of what the EV-optimal policy earns on the same balloons`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. Each pump adds ${c1}c to a balloon. The balloon hides a pop point K: the K-th pump pops it, and K is equally likely to be any whole number from 1 to ${N}. A pop loses that balloon's money; cashing in banks it. How many pumps should you plan before cashing, to earn the most on average?`, answer: `${T1} pumps, worth ${ev(T1)}c per balloon on average.`, explain: `Plan t pumps: you keep ${c1}t cents only if K > t, which has probability (${N} − t)/${N}. The product ${c1}t(${N} − t)/${N} peaks at t = ${T1}. If you chose a small number "to be safe", or "as many as I dare", hold on to that: the lesson shows which half of the bet each choice ignores.`,
      attempts: [
        { id: 'safe', label: 'Pump a little to be safe', approach: 'Cash after 2 to 4 pumps so the balloon almost never pops.', breaksAt: `Keeping the balloon is not the score: 3 pumps survive ${pct((N - 3) / N)} of the time but earn ${ev(3)}c on average against ${ev(T1)}c.` },
        { id: 'greedy', label: 'Pump while it probably survives', approach: 'Keep pumping as long as the next pump survives more often than it pops.', breaksAt: `At ${T1} pumps the next pump survives ${N - T1 - 1} times in ${N - T1} and still loses money: a pop costs everything on the balloon.` },
        { id: 'same', label: 'One target for both rounds', approach: `Use the round-1 answer, ${T1} pumps, in round 2 as well.`, breaksAt: 'A round-2 pop also costs half the round-2 bank, so the best target falls as the bank grows.' },
      ] },
    { type: 'text', text: `Balloon is the risk game of Zap-N. Each pump adds money to the balloon; at any moment you cash in (bank it) or pump again. If it pops first, that balloon pays nothing. **Round 1**: ${R1.balloons} balloons at ${c1}c per pump. **Round 2**: ${R2.balloons} balloons at ${c2}c per pump, and a pop also costs half of the money banked in round 2 so far. The game is untimed.` },
    { type: 'check', scope: 'the rules of the two rounds', questions: [
      mc({ q: 'Round 1. A balloon with 6 pumps on it pops. What do you lose?', right: `the ${6 * c1}c on that balloon only`, at: 1,
        wrong: [['half of your round-1 bank', 'the bank penalty exists only in round 2'], ['everything banked so far', 'banked money is never lost in round 1'], ['nothing, the balloon was never banked', 'the pumps had earned money that the pop wipes out']],
        explain: 'In round 1 a pop wipes out only the money on the current balloon; the bank is safe.' }),
      { make: (rng) => { const bank = 20 * rng.int(5, 40); return { type: 'number', q: `Round 2. Your round-2 bank is ${bank}c and the current balloon (5 pumps) pops. What is your round-2 bank now, in cents?`, answer: bank - halfBank(bank), hints: ['The balloon money is gone, and the pop costs half the round-2 bank.', `Half of ${bank} is ${bank / 2}.`], explain: `The balloon's ${5 * c2}c is lost and the pop takes floor(${bank} × 0.5) = ${halfBank(bank)}c of the bank: ${bank} − ${halfBank(bank)} = ${bank - halfBank(bank)}c.` }; } },
    ] },
    { type: 'text', text: `The real pop distribution is not published. This trainer draws each balloon's pop point uniformly from 1 to ${N}; the method below works for any distribution you can estimate. You are scored against the expected-value-optimal policy on the same balloons, so luck cancels: target ${pct(TARGET)} of its bank.` },
    { type: 'check', scope: 'how the bank is scored', questions: [
      { type: 'choice', q: 'Your bank is scored against what?', options: ['the best policy on the same balloons', 'the highest bank anyone has made', 'a fixed bank of 1,000 cents'], answer: 0, traps: { 1: 'the same balloons for both cancel your luck', 2: 'the target is 85% of the best policy bank' }, explain: 'You are compared with the expected-value-optimal policy on the same balloons.' },
    ] },

    sec('why'),
    { type: 'text', text: 'Each pump is a small bet with a known reward and a growing risk. Sizing a bet to the point where its expected value peaks, and re-sizing it when the cost of losing changes, is the daily job of a trader. Balloon is the one Zap-N game where a short calculation tells you the best play exactly, so every cent below the optimum is a cent you chose to lose.' },

    sec('anchor'),
    { type: 'text', text: `You know expected value: EV = Σ value × probability. A pump plan is a bet with two outcomes: the balloon survives your t pumps and you bank ${c1}t cents, or it pops and you bank nothing. **One change**: you choose t. So you compute the EV of every plan and pick the largest.` },
    { type: 'check', scope: 'EV of a two-outcome bet', questions: [
      { make: (rng) => { const t = rng.int(3, 16), p = frac(N - t, N); return { type: 'number', q: `A plan pays ${c1 * t}c with probability ${p} and 0 otherwise. What is its expected payout, in cents?`, answer: ev(t), hints: ['EV = value × probability for each outcome, then add.', `${c1 * t} × ${p} + 0.`], explain: `${c1 * t} × ${p} = ${ev(t)}c.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: `Survival first. A plan of t pumps survives exactly when the pop point K is above t: ${N} − t of the ${N} equally likely values. So P(survive) = (${N} − t)/${N}, and the plan is worth ${c1}t × (${N} − t)/${N} cents. More pumps make the prize bigger and the chance of keeping it smaller.` },
    { type: 'diagram', diagram: 'zapn-balloon', spec: { kind: 'ev', centsPerPump: c1, rows: [0, 4, 8, T1, 12, 16, 19].map((t) => ({ t, safe: `${N - t}/${N}`, ev: ev(t) })), best: T1 }, caption: `Round 1 plans. The prize grows by ${c1}c a pump while the survival chance falls by 1/${N}: their product peaks at ${T1} pumps, ${ev(T1)}c.` },
    { type: 'check', scope: 'the survival chance and the plan value', questions: [
      { make: (rng) => { const t = rng.int(2, 18); return { type: 'number', q: `Round 1. What is the probability that a plan of ${t} pumps survives? (a fraction or a decimal)`, answer: (N - t) / N, hints: ['Survive means K > t.', `${N - t} of the ${N} pop points are above ${t}.`], explain: `K must be one of ${t + 1} to ${N}: ${N - t}/${N} = ${dec((N - t) / N)}.` }; } },
    ] },
    { type: 'diagram', diagram: 'zapn-balloon', spec: { kind: 'ev', centsPerPump: c1, curve: true, rows: [{ t: 6 }, { t: 14 }], best: T1 }, caption: `The expected gain ${c1}t(${N} − t)/${N} is a hill, symmetric about ${T1}: planning 6 pumps is worth exactly as much as planning 14 (${ev(6)}c), and both lose to ${T1} (${ev(T1)}c).` },
    { type: 'check', scope: 'reading the hill', questions: [
      { make: (rng) => { const k = rng.int(2, 6); return mc({ q: `Round 1. Which plan earns more on average: ${T1 - k} pumps or ${T1 + k} pumps?`, right: 'both the same',
        wrong: [[`${T1 + k} pumps`, 'more pumps, more money: this ignores that the prize is kept less often'], [`${T1 - k} pumps`, 'fewer pumps are safer: this ignores that the prize is smaller'], ['depends on luck', 'expected values are fixed numbers; luck only moves single balloons']],
        explain: `t(${N} − t) is the same for t = ${T1 - k} and t = ${T1 + k}: ${c1} × ${T1 - k} × ${T1 + k}/${N} = ${ev(T1 - k)}c both.` }, rng); } },
    ] },
    { type: 'text', text: `The same answer from inside one balloon. After t safe pumps, K is equally likely to be any of the ${N} − t values above t, so the **next** pump pops with probability 1/(${N} − t). It adds ${c1}c if it survives and costs everything on the balloon if it pops.` },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: `at 9 pumps (${9 * c1}c on it)`, children: [{ p: `1/${N - 9}`, label: `next pump pops: lose ${9 * c1}c` }, { p: `${N - 10}/${N - 9}`, label: `survives: +${c1}c`, mark: true }] }, showProducts: false }, caption: `At 9 pumps: expected change (${N - 10} × ${c1} − ${9 * c1})/${N - 9} = ${dec(nextPump(9, c1, 90), 2)}c, so pump. At 10 pumps it is (${N - 11} × ${c1} − ${10 * c1})/${N - 10} = ${dec(nextPump(10, c1, 100), 2)}c, so cash.` },
    { type: 'check', scope: 'the pop chance of the next pump', questions: [{ make: popChanceQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { say: `Plan t pumps. The balloon survives when its pop point K is above t: P(survive) = (${N} − t)/${N}.`, why: `K is equally likely to be each of 1 to ${N}, and exactly ${N} − t of those values lie above t.`,
        checks: [{ make: (rng) => { const t = rng.int(1, 19); return { type: 'number', q: `How many of the ${N} pop points let a ${t}-pump plan survive?`, answer: N - t, explain: `K from ${t + 1} to ${N}: ${N - t} values.` }; } }] },
      { answers: 'safe', say: `Expected gain of the plan: ${c1}t × (${N} − t)/${N} cents. A pop pays 0 in round 1.`, why: 'Two outcomes: survive and bank the balloon money, or pop and bank nothing. Nothing else is at stake in round 1.',
        checks: [{ make: (rng) => { const t = rng.int(2, 18); return { type: 'number', q: `Round 1. Expected gain of planning ${t} pumps, in cents?`, answer: ev(t), hints: [`Balloon money ${c1 * t}c, survival ${N - t}/${N}.`, `${c1 * t} × ${N - t}/${N}.`], explain: `${c1} × ${t} × ${N - t}/${N} = ${ev(t)}c.` }; } }] },
      { say: `One more pump changes the expected gain by ${c1}(${N - 1} − 2t)/${N} cents.`, why: `Subtract: ${c1}(t + 1)(${N - 1} − t)/${N} − ${c1}t(${N} − t)/${N}. The t² terms cancel and ${c1}(${N - 1} − 2t)/${N} is left.`,
        checks: [{ make: (rng) => { const t = rng.int(5, 15); const d = ev(t + 1) - ev(t); return { type: 'number', q: `Round 1. Going from a ${t}-pump plan to a ${t + 1}-pump plan changes the expected gain by how many cents? (negative if it falls)`, answer: d, hints: [`${c1}(${N - 1} − 2t)/${N} with t = ${t}.`, `${c1} × ${N - 1 - 2 * t}/${N}.`], explain: `${c1} × (${N - 1} − ${2 * t})/${N} = ${dec(d)}c: ev(${t + 1}) − ev(${t}) = ${ev(t + 1)} − ${ev(t)}.` }; } }] },
      { answers: 'greedy', say: `That is positive while t ≤ ${T1 - 1} and negative from t = ${T1}: the ${T1}th pump still adds, the ${T1 + 1}th subtracts. Plan ${T1} pumps: ${ev(T1)}c per balloon.`, why: `${N - 1} − 2t > 0 exactly when t < ${(N - 1) / 2}. Over ${R1.balloons} balloons the optimum expects ${money(R1EV)}.`,
        checks: [
          { type: 'number', q: `Round 1 has ${R1.balloons} balloons. What is the expected round-1 bank of the optimal plan, in dollars?`, answer: R1EV / 100, hints: [`Each balloon is worth ${ev(T1)}c at the best plan.`, `${R1.balloons} × ${ev(T1)}c.`], explain: `${R1.balloons} × ${ev(T1)}c = ${R1EV}c = ${money(R1EV)}.` },
        ] },
      { answers: 'same', say: `Round 2 changes one thing: a pop also costs half the round-2 bank B. The plan's expected gain becomes ${c2}t(${N} − t)/${N} − (t/${N}) × B/2.`, why: `The plan pops with probability t/${N}, and a pop now also removes floor(B/2) cents of the bank.`,
        checks: [{ make: (rng) => { const bank = 100 * rng.int(1, 6), t = rng.int(3, 9); return { type: 'number', q: `Round 2, bank ${bank}c. Expected gain of a ${t}-pump plan on this balloon, in cents?`, answer: ev(t, c2, bank), hints: [`Gain part: ${c2} × ${t} × ${N - t}/${N}.`, `Loss part: ${t}/${N} × ${halfBank(bank)}.`], explain: `${c2 * t * (N - t) / N} − ${t}/${N} × ${halfBank(bank)} = ${dec(ev(t, c2, bank))}c.` }; } }] },
      { say: `On the last balloon this formula is exact: no later balloon can be hurt. The next pump pays while ${c2}(${N - 1} − 2t) > B/2.`, why: `Same subtraction as round 1, now with the extra pop cost B/2 times the extra pop chance 1/${N}.`,
        checks: [{ make: (rng) => { const bank = rng.pick([0, 100, 200, 300, 400, 500, 600, 800]); return { type: 'number', q: `Round 2, last balloon, round-2 bank ${money(bank)}. How many pumps should you plan?`, answer: optimalTarget(R2, LAST, bank), hints: [`Pump t + 1 while ${c2}(${N - 1} − 2t) > ${halfBank(bank)}.`, 'Find the first t where that fails; plan exactly that many pumps.'], explain: `The largest t with ${c2}(${N - 1} − 2(t − 1)) > ${halfBank(bank)} is ${optimalTarget(R2, LAST, bank)}: plan ${optimalTarget(R2, LAST, bank)} pumps.` }; } }] },
    ] },
    { type: 'text', text: `Earlier balloons have later balloons to protect, so the exact targets come from backward induction over the whole round (the engine solves it). The table is balloon ${POLICY_I + 1} of ${R2.balloons}.` },
    { type: 'diagram', diagram: 'zapn-balloon', spec: { kind: 'policy', round: R2, balloon: POLICY_I, rows: POLICY_BANKS.map((b) => ({ bankCents: b, target: policyT(b) })) }, caption: `The target falls about one pump per dollar banked: roughly 11 − (bank in dollars), down to ${policyT(1000)} once the bank reaches $10.` },
    { type: 'check', scope: 'the round-2 table and its rule of thumb', questions: [
      { type: 'number', q: `From the table: balloon ${POLICY_I + 1}, round-2 bank $3.00. How many pumps?`, answer: policyT(300), explain: `Row $3.00: pump to ${policyT(300)}, which is 11 − 3.` },
      { make: (rng) => { const d = rng.int(1, 8); return { type: 'number', q: `Rule of thumb: round-2 bank $${d}.00, early in the round. About how many pumps?`, answer: 11 - d, explain: `11 − ${d} = ${11 - d}. The exact table stays within 2 pumps of this rule for banks up to $10.` }; } },
    ] },
    { type: 'explain', prompt: `Why does the ${T1 + 1}th pump lose money in round 1 even though the balloon survives it ${N - T1 - 1} times out of ${N - T1}?`, model: `At ${T1} pumps there is ${money(T1 * c1)} on the balloon. The next pump pops with probability 1/${N - T1} and costs that ${money(T1 * c1)}: −${T1 * c1 / (N - T1)}c on average. It survives with probability ${N - T1 - 1}/${N - T1} and adds ${c1}c: +${(N - T1 - 1) * c1 / (N - T1)}c on average. Net ${dec(nextPump(T1, c1, T1 * c1))}c: the risk has outgrown the reward.`, points: [`Given ${T1} safe pumps, only ${N - T1} pop points remain, so the next pump pops with probability 1/${N - T1}`, 'The downside is everything on the balloon, which grows with every pump', `The upside stays ${c1}c, so past the midpoint a pump has negative expected value`] },

    sec('worked'),
    { type: 'text', text: 'Two states from real play. Decide at each step before you open the next one.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: `round 1, ${A.t} pumps (${A.risk}c on it)`, children: [{ p: `1/${A.left}`, label: `pops: lose ${A.risk}c` }, { p: `${A.left - 1}/${A.left}`, label: `survives: +${c1}c`, mark: true }] }, showProducts: false }, caption: `State A. ${A.left} pop points remain (${A.t + 1} to ${N}), so the next pump pops with probability 1/${A.left}.` },
    { type: 'steps', steps: [
      { say: `State A: round 1, ${A.t} pumps, ${A.risk}c on the balloon. The next pump pops with probability 1/${A.left}.`, why: `${A.t} safe pumps rule out pop points 1 to ${A.t}; ${A.left} equally likely values remain.`,
        checks: [{ type: 'number', q: 'In state A, what is the probability that the next pump pops? (a fraction or a decimal)', answer: 1 / A.left, tolerance: 0.001, explain: `1/${A.left}: one of the ${A.left} remaining pop points is the next pump.` }] },
      { say: `Expected change of one more pump: (${A.left - 1} × ${c1} − ${A.risk})/${A.left} = ${dec(A.d, 2)}c. Positive: pump.`, why: `Weigh the gain (${c1}c, ${A.left - 1} ways) against the loss (${A.risk}c, 1 way), over ${A.left} equally likely pop points.`,
        checks: [mc({ q: 'State A. Pump or cash?', right: 'pump', at: 0, wrong: [['cash', `${A.risk}c on the balloon feels like a lot, but it is lost only 1 time in ${A.left}; the pump is worth +${dec(A.d, 2)}c`]], explain: `The expected change is +${dec(A.d, 2)}c. Keep pumping to ${T1}.` })] },
      { say: `State B: round 2, the last balloon, round-2 bank ${money(B.bank)}, ${B.t} pumps on it. A pop costs the ${B.t * c2}c on the balloon plus ${halfBank(B.bank)}c of the bank: ${B.risk}c at risk.`, why: 'In round 2 the downside of a pop is the balloon money plus half the round-2 bank.',
        checks: [{ type: 'number', q: 'In state B, how many cents does a pop cost in total?', answer: B.risk, explain: `${B.t} × ${c2} = ${B.t * c2}c on the balloon plus floor(${B.bank}/2) = ${halfBank(B.bank)}c of the bank: ${B.risk}c.` }] },
      { say: `Next pump: (${N - B.t - 1} × ${c2} − ${B.risk})/${N - B.t} = ${dec(B.d, 2)}c, still positive: pump once more. At 5 pumps: (${N - 6} × ${c2} − ${B.risk5})/${N - 5} = ${dec(B.d5, 2)}c: cash.`, why: `The table below shows the same stop: the best plan at bank ${money(B.bank)} is ${bestT(c2, B.bank)} pumps.`,
        checks: [mc({ q: 'State B after one more safe pump (5 pumps on the balloon). Pump or cash?', right: 'cash', at: 1, wrong: [['pump', `the survival chance is still high, but ${B.risk5}c is now at risk against a ${c2}c gain`]], explain: `Expected change ${dec(B.d5, 2)}c: cash in.` })] },
    ] },
    { type: 'diagram', diagram: 'zapn-balloon', spec: { kind: 'ev', centsPerPump: c2, bankCents: B.bank, bankPenalty: R2.bankPenalty, rows: [3, 4, 5, 6, 7].map((t) => ({ t, safe: `${N - t}/${N}`, ev: ev(t, c2, B.bank) })), best: bestT(c2, B.bank) }, caption: `State B as plans: with ${money(B.bank)} banked, the one-balloon expected gain peaks at ${bestT(c2, B.bank)} pumps, not ${T1}.` },
    { type: 'check', scope: 'state B', questions: [
      { type: 'choice', q: 'State B, $4.00 banked in round 2: where does the one-balloon expected gain peak?', options: ['at 5 pumps', 'at 10 pumps', 'at 1 pump'], answer: 0, traps: { 1: '10 is round 1, where a pop costs no bank', 2: 'one pump gives up most of the value' }, explain: 'With bank at risk, the peak moves down from 10 to 5.' },
    ] },

    sec('predict'),
    { type: 'predict', question: `If the pop point were uniform on 1 to 30 instead of 1 to ${N}, what round-1 plan would maximise the expected gain, and what would it be worth per balloon?`, answer: `${bestT(c1, 0, 30)} pumps, ${ev(bestT(c1, 0, 30), c1, 0, 30)}c per balloon.`, explain: `The extra pump now pays ${c1}(29 − 2t)/30, positive while t ≤ ${bestT(c1, 0, 30) - 1}. For a uniform pop point the best plan is half the range.` },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: `Every pump pops with the same 1-in-${N} chance.`, fix: `Given t safe pumps, the next pops with 1/(${N} − t): 1/${N} on the first pump, 1/${N - 10} at 10 pumps, 1/2 at ${N - 2}.` },
      { belief: 'Fewer pumps are safer, so a low target is prudent.', fix: `Safety is not the score. Planning 3 pumps keeps the balloon ${pct((N - 3) / N)} of the time but earns ${ev(3)}c on average, about half the best ${ev(T1)}c.` },
      { belief: `Round 2 is round 1 at double the stake: pump to ${T1}.`, fix: `The bank penalty lowers the target as the bank grows: ${policyT(0)} with an empty bank, ${policyT(400)} at $4 (balloon ${POLICY_I + 1}).` },
      { belief: 'A pop in round 2 halves my whole bank.', fix: 'Only the round-2 bank is at risk; round-1 money is safe.' },
      { belief: 'The score is mostly luck.', fix: 'You are compared with the optimal policy on the same pop points, so luck cancels.' },
    ] },
    { type: 'erroneous', problem: `A candidate at ${T1} pumps in round 1 decides whether to pump again. One step is wrong.`, steps: [
      `The pop point is uniform on 1 to ${N}.`,
      `So each pump pops with probability 1/${N}.`,
      `The next pump adds ${c1}c with probability ${N - 1}/${N}: +${dec(c1 * (N - 1) / N, 2)}c expected, and loses ${T1 * c1}c with probability 1/${N}: −${T1 * c1 / N}c.`,
      `Net +${dec((c1 * (N - 1) - T1 * c1) / N, 2)}c, so pump again.`,
    ], errorStep: 1, explain: `The pumps already survived rule out pop points 1 to ${T1}. Given ${T1} safe pumps the next pops with probability 1/${N - T1}, and the expected change is ${dec(nextPump(T1, c1, T1 * c1))}c: cash.` },
    { type: 'check', scope: 'the conditional pop chance and the stop rule', questions: [
      { make: (rng) => { const t = rng.int(T1, 15); const d = nextPump(t, c1, t * c1); return { type: 'number', q: `Round 1, ${t} pumps on the balloon. Expected change in cents from one more pump? (negative if it loses)`, answer: d, tolerance: 0.01, hints: [`Next pump pops with 1/${N - t} and costs ${t * c1}c; survives with ${N - t - 1}/${N - t} and adds ${c1}c.`, `(${N - t - 1} × ${c1} − ${t * c1})/${N - t}.`], explain: `(${(N - t - 1) * c1} − ${t * c1})/${N - t} = ${dec(d, 2)}c: cash.` }; } },
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Round 1 needs no thought: count the pumps under your breath and cash at ${T1}. The game is untimed, so the only speed that matters is never changing your mind mid-balloon.` },
    { type: 'check', scope: 'round 1 needs no thought', questions: [
      { type: 'choice', q: 'Round 1, you are at 9 pumps and feel lucky. What do you do?', options: ['pump once more and cash at 10', 'keep pumping on to 15 this time', 'cash in right now at 9 pumps'], answer: 0, traps: { 1: 'changing the plan mid-balloon is the costly mistake', 2: 'the round-1 rule is 10, not 9' }, explain: 'Count to 10 and cash. Never re-decide mid-balloon.' },
    ] },
    { type: 'callout', tone: 'speed', text: `Round 2: before each balloon, read the round-2 bank in dollars and set the target to about 11 minus that. Once the bank passes $10, pump at most twice. The optimum expects about ${money(R1EV)} in round 1 and ${money(R2EV)} in round 2.` },
    { type: 'thinkaloud', problem: `Round 2, balloon ${POLICY_I + 1} of ${R2.balloons}. Your round-2 bank is $3.00 and a fresh balloon is up. What is your plan?`, lines: [
      { t: 0, say: 'Fresh balloon, bank $3.00.' },
      { t: 2, say: `Plan ${T1} pumps, the number that worked all through round 1.`, slip: true },
      { t: 4, say: `Wrong round. In round 2 a pop also costs ${money(halfBank(300))} of bank. Rule of thumb: 11 − 3 = ${11 - 3} pumps.` },
      { t: 6, say: `Sanity check: below round 1's ${T1}, as it must be with bank at stake. The exact table says ${policyT(300)} as well.` },
      { t: 8, say: `Pump and count to ${11 - 3}, then cash. No re-deciding halfway.` },
      { t: 10, say: `If it survives, the bank becomes ${money(300 + (11 - 3) * c2)}, so the next target drops to about ${Math.round(11 - (300 + (11 - 3) * c2) / 100)}.` },
    ] },
    { type: 'check', scope: 'the targets you carry into the game', questions: [
      { make: (rng) => { const d = rng.int(2, 9); return mc({ q: `Round 2, early balloon, round-2 bank $${d}.00. Which target?`, right: String(11 - d),
        wrong: [[String(T1), `round-1 target: ignores the ${money(halfBank(100 * d))} a pop now costs`], [String(Math.max(0, 11 - 2 * d)), 'cut two pumps per dollar: too timid for early balloons'], ['0', 'stopped pumping with a small bank: early pops at small banks are cheap']],
        explain: `About 11 − ${d} = ${11 - d}.` }, rng); } },
      { type: 'choice', q: 'In the think-aloud, the first plan was 10 pumps in round 2. What was wrong?', options: ['a pop now also costs half the bank', 'round 2 needs more than 10 pumps', 'the bank was $10'], answer: 0, traps: { 1: 'round-2 targets sit below 10', 2: 'the bank was $3.00' }, explain: 'Round 2 puts bank at stake: 11 − 3 = 8 pumps.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `Balloon: round 1, pump to ${T1} and cash. Round 2, pump to about 11 − (round-2 bank in $), at most 2 once the bank passes $10.` },

    sec('contrast'),
    { type: 'compare', columns: ['Setting', 'Next pump pops with', 'A pop costs', 'Best plan'], rows: [
      [`Round 1 (K uniform on 1-${N})`, `1/(${N} − t)`, 'the money on the balloon', `${T1} pumps`],
      ['Round 2, empty bank', `1/(${N} − t)`, 'the money on the balloon', `${policyT(0)} pumps (exact table)`],
      [`Round 2, $4 banked (balloon ${POLICY_I + 1})`, `1/(${N} − t)`, `balloon money + ${money(halfBank(400))}`, `${policyT(400)} pumps`],
      ['Round 1 if K were uniform on 1-30', '1/(30 − t)', 'the money on the balloon', `${bestT(c1, 0, 30)} pumps`],
    ] },
    { type: 'variation', base: `Round 1: pop point uniform on 1 to ${N}, ${c1}c per pump. Best plan ${T1} pumps, worth ${ev(T1)}c per balloon.`, rows: [
      { change: `${c2}c per pump instead of ${c1}c`, effect: `Same plan, ${bestT(c2)} pumps. The stake multiplies the gain and the loss alike, so the peak of t(${N} − t) does not move; the value doubles to ${ev(bestT(c2), c2)}c.` },
      { same: true, change: 'The last three balloons popped early', effect: 'Nothing changes in this trainer: every balloon draws a fresh pop point, so past pops say nothing about this one.' },
      { change: 'Pop point uniform on 1 to 30', effect: `${bestT(c1, 0, 30)} pumps: the best plan is half the range, because one more pump pays while t < (range − 1)/2.` },
      { fusion: true, change: `${c2}c per pump and a pop point uniform on 1 to 30`, effect: `${bestT(c2, 0, 30)} pumps, worth ${ev(bestT(c2, 0, 30), c2, 0, 30)}c: only the range moves the target; the stake just scales the value.` },
      { change: 'A pop also costs half the round-2 bank, and $4 is banked', effect: `The extra downside moves the break-even earlier: ${bestT(c2, 400)} pumps on the last balloon, ${policyT(400)} on balloon ${POLICY_I + 1}.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: on the **last** balloon of round 2 the one-balloon formula is exact (${optimalTarget(R2, LAST, 0)} pumps at an empty bank). Earlier balloons run about one pump higher at small banks: money banked early is still exposed to every later pop, so it is worth less than face value and risking it is cheaper.` },
    { type: 'check', scope: 'the contrast table', questions: [
      { make: (rng) => { const n = rng.pick([16, 24, 30, 40]); const t = bestT(c1, 0, n); return { type: 'number', q: `Round 1 rules, but the pop point is uniform on 1 to ${n}. How many pumps should you plan?`, answer: t, hints: [`One more pump pays ${c1}(${n - 1} − 2t)/${n}.`, `Positive while t < ${(n - 1) / 2}.`], explain: `Half the range: ${t} pumps.` }; } },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: every "stop or continue" game in Beat the Odds (roll again or take the money) is solved by comparing what one more step adds with what it risks, and the round-2 table is first-step analysis run backwards over the balloons.' },
    { type: 'transfer',
      near: { make: (rng) => { const n = rng.pick([12, 16, 24, 30]), c = rng.pick([5, 10, 25]), t = rng.int(2, n - 3), go = (n - 2 * t - 1) > 0; return mc({ q: `Balloon with ${c}c per pump and a pop point uniform on 1 to ${n}. The balloon has survived ${t} pumps. Pump or cash?`, right: go ? 'pump' : 'cash', at: go ? 0 : 1, wrong: [[go ? 'cash' : 'pump', go ? `the gain (${c}c on ${n - t - 1} of ${n - t} pop points) still beats the loss (${c * t}c on 1 of them)` : `${c * t}c at risk on 1 of ${n - t} pop points outweighs ${c}c on the other ${n - t - 1}`]], explain: `Next pump: (${n - t - 1} × ${c} − ${c * t})/${n - t} = ${dec(((n - t - 1) * c - c * t) / (n - t), 2)}c.` }); } },
      far: { make: (rng) => { const P = rng.pick([8, 12, 15, 24, 28, 35]), go = P < 20; return mc({ q: `A dice game: each roll adds its face to a pot, except a 1, which wipes the pot out. You may stop and bank the pot at any time. Your pot is ${P}. Roll again or stop?`, right: go ? 'roll again' : 'stop', at: go ? 0 : 1, wrong: [[go ? 'stop' : 'roll again', go ? `a roll adds 4 on average 5 times in 6 (+${dec(20 / 6, 2)}) and risks ${P} once in 6 (−${dec(P / 6, 2)})` : `the ${P} at risk once in 6 (−${dec(P / 6, 2)}) outweighs the average gain (+${dec(20 / 6, 2)})`]], explain: `Expected change of a roll: (5/6) × 4 − (1/6) × ${P} = (20 − ${P})/6 = ${dec((20 - P) / 6, 2)}. Roll while the pot is below 20.` }); } },
      principle: mc({ q: 'What carried over from Balloon to the dice pot?', right: "continue while one more step's expected gain beats its expected loss", at: 1,
        wrong: [['stop once losing becomes more likely than winning on the next step', 'the chance alone ignores how much is at risk: at 10 pumps a pop is only 1 in 10 and still not worth it'], ['stop at half of the largest prize the game can possibly pay out', 'half the range is special to a uniform pop point, not the principle'], ['always continue while the prize keeps growing with every step', 'a growing prize is exactly what makes each step riskier']],
        explain: 'Both games compare the gain of one more step with its expected loss, and the loss grows with what you already hold.' }),
    },

    sec('tryit'),
    { type: 'tryit', game: 'balloon' },
  ],
};
