// Probability foundations 11: first-step analysis on Markov chain graphs. Probabilities of
// reaching a target, expected numbers of steps, absorbing states, gambler's ruin.
import { sec, frac, dec, mc, diceCells } from './sample-spaces.js';

// Two unfinished states: e0 = 1 + a e1 + b e0, e1 = c + d e0 (c is the step cost, d the chance of a reset).
const solve2 = (a, b, c, d) => (1 + a * c) / (1 - b - a * d);
const HH = solve2(0.5, 0.5, 1, 0.5);
const HHbad = solve2(0.5, 0.5, 0.5, 0.5); // the erroneous example: +1 dropped from the second equation
const HT1 = 2; // from "last toss H": e1 = 1 + ½ e1  →  e1 = 2
const HT = 2 + HT1; // from start: e0 = 1 + ½ e1 + ½ e0  →  e0 = 2 + e1

const FACESETS = [
  { win: [6], lose: [1, 3, 5], wn: 'a 6', ln: 'any odd number' },
  { win: [5, 6], lose: [1], wn: 'a 5 or 6', ln: 'a 1' },
  { win: [6], lose: [1, 2, 3], wn: 'a 6', ln: 'a 1, 2 or 3' },
  { win: [4, 5, 6], lose: [1, 2], wn: 'a 4, 5 or 6', ln: 'a 1 or 2' },
  { win: [2], lose: [5, 6], wn: 'a 2', ln: 'a 5 or 6' },
];
const raceQ = (rng) => {
  const f = rng.pick(FACESETS), w = f.win.length, l = f.lose.length;
  return mc({ q: `Roll a die repeatedly. You win if ${f.wn} appears before ${f.ln}. What is P(you win)?`, right: frac(w, w + l),
    wrong: [['1/2', 'treated winning and losing as equally likely'], [frac(w, 6), 'the chance of winning on the first roll only'], [frac(l, w + l), 'solved for losing']],
    hints: ['Name p = P(win from the start). Which rolls send you back to the start?', `p = ${w}/6 + ${6 - w - l}/6 × p.`],
    explain: `p = ${w}/6 + ${6 - w - l}/6 × p, so p × ${w + l}/6 = ${w}/6 and p = ${frac(w, w + l)}. Rolls that change nothing drop out.` }, rng);
};
const ruinQ = (rng) => {
  const N = rng.int(5, 12), k0 = rng.int(1, N - 1), k = 2 * k0 === N ? k0 - 1 : k0;
  if (rng.chance(0.5)) return { type: 'number', q: `A fair ±1 walk starts at ${k} and stops at 0 or at ${N}. Expected number of steps?`, answer: k * (N - k), hints: ['E_{k} = k(N − k).'], explain: `${k} × (${N} − ${k}) = ${k * (N - k)}.` };
  return mc({ q: `A fair ±1 walk starts at ${k} and stops at 0 or at ${N}. What is P(it reaches ${N} before 0)?`, right: frac(k, N),
    wrong: [['1/2', 'ignored where the walk starts'], [frac(N - k, N), 'that is P(reaching 0 first)'], [frac(1, N), 'counted only the path that goes straight up']],
    explain: `p_{k} = k/N = ${frac(k, N)}.` }, rng);
};
const twoInRowQ = (rng) => {
  const [pn, pd, what, unit] = rng.pick([[1, 2, 'toss a fair coin until you get two heads in a row', 'tosses'], [1, 3, 'spin a spinner that wins with chance 1/3 until you get two wins in a row', 'spins'], [1, 6, 'roll a die until you get two sixes in a row', 'rolls'], [1, 4, 'spin a spinner that wins with chance 1/4 until you get two wins in a row', 'spins']]);
  const p = pn / pd, ans = Math.round(solve2(p, 1 - p, 1, 1 - p));
  return { type: 'number', q: `You ${what}. Expected number of ${unit}?`, answer: ans,
    hints: ['States: start, and "one success just now".', `e_{0} = 1 + ${frac(pn, pd)} e_{1} + ${frac(pd - pn, pd)} e_{0};  e_{1} = 1 + ${frac(pd - pn, pd)} e_{0}.`, 'The first equation gives e_{0} = 1/p + e_{1}; substitute.'],
    explain: `e_{0} = ${pd} + e_{1} and e_{1} = 1 + ${frac(pd - pn, pd)} e_{0}, so e_{0} = ${ans}.` };
};
const ways = (s) => diceCells((a, b) => a + b === s).length;

export default {
  id: 'prob/first-step-markov',
  book: 'prob',
  kind: 'foundation',
  title: 'First-step analysis and Markov chains',
  summary: 'Name the states, look one step ahead, write one equation per state, solve.',
  prerequisites: ['prob/conditional-bayes', 'prob/expectation-linearity', 'prob/discrete-distributions'],
  objectives: [
    'Draw a process as a Markov chain graph with absorbing states',
    'Set up and solve first-step equations for the probability of reaching a target',
    'Set up and solve first-step equations for the expected number of steps, with the +1',
    'Use the fair gambler\'s ruin results k/N and k(N − k)',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: 'Before any teaching: you toss a fair coin until you see two heads in a row. How many tosses do you expect? Two approaches, then an answer.', answer: String(HH), explain: `A tree never ends. Name two situations: "start" (no progress) and "last toss was H". From each, one toss leads back to a named situation, giving two equations whose solution is ${HH}. If you said 4 (= 2 × 2), you treated the two heads as separate waits and missed that a T wipes out your progress.` },
    { type: 'text', text: 'Trigger: a process that runs **until** something happens ("toss until", "first time", "keeps walking", "who reaches k first"), with the same rules at every step. You name the situations (**states**), then write one equation per state by looking one step ahead.' },
    { type: 'check', scope: 'spotting a first-step question', questions: [
      mc({ q: 'Which question calls for first-step analysis?', right: 'Expected tosses of a coin until two heads in a row', at: 2,
        wrong: [['P(exactly two heads in 5 tosses)', 'a fixed number of tosses: binomial'], ['P(the 5th card is an ace)', 'symmetry: any position is a uniform card'], ['Expected number of sixes in 12 rolls', 'linearity: 12 × 1/6']],
        explain: '"Until" plus progress that can be lost: states and first-step equations.' }),
    ] },

    sec('why'),
    { type: 'text', text: "Beat the Odds loves processes: gambler's ruin, random walks on a line or a polygon, races to k points, waiting for a pattern. Each looks like an infinite tree; first-step analysis turns it into two or three small equations." },

    sec('anchor'),
    { type: 'text', text: 'You know the tree from the conditional lesson: split on the first branch, weight each branch by its chance, add. First-step analysis is that tree cut after **one** step, with **one change**: after the step you land in a situation you have already named, so its value is an unknown you already have, not a new subtree.' },
    { type: 'formula', text: 'value(here) = Σ P(next) × value(next)' },
    { type: 'check', scope: 'weighting the next step', questions: [
      { make: (rng) => { const a = rng.pick([0.2, 0.4, 0.6, 0.8]), b = rng.pick([0.1, 0.3, 0.5, 0.9]); return { type: 'number', q: `With chance 1/2 you move to A, where your chance of winning is ${a}; otherwise to B, where it is ${b}. What is your chance of winning now?`, answer: Math.round(((a + b) / 2) * 100) / 100, tolerance: 1e-9, hints: ['Weight each next value by the chance of landing there.'], explain: `1/2 × ${a} + 1/2 × ${b} = ${dec((a + b) / 2, 2)}.` }; } },
    ] },

    sec('picture'),
    { type: 'text', text: 'Draw the states as circles and the moves as arrows labelled with their chances: a **Markov chain** graph. The chances leaving each state add to 1. A state whose only arrow loops back to itself with chance 1 is **absorbing**: once there, the process is over.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: 'Waiting for HH', nodes: [{ id: 'S', label: 'start', x: 0.08, y: 0.5 }, { id: 'H', label: 'H', x: 0.5, y: 0.5 }, { id: 'HH', label: 'HH', x: 0.92, y: 0.5 }], edges: [{ from: 'S', to: 'H', p: 0.5, label: '1/2' }, { from: 'S', to: 'S', p: 0.5, label: '1/2' }, { from: 'H', to: 'HH', p: 0.5, label: '1/2' }, { from: 'H', to: 'S', p: 0.5, label: '1/2' }, { from: 'HH', to: 'HH', p: 1, label: '1' }] }, caption: 'From start, H moves right and T stays. From "last toss H", another H finishes and a T sends you back to start. HH is absorbing.' },
    { type: 'check', scope: 'reading the chain', questions: [
      mc({ q: 'In the HH chain, from the state "last toss was H", where does a T take you?', right: 'back to start', at: 0,
        wrong: [['to HH', 'a T breaks the run'], ['it stays at "last toss was H"', 'the last toss is now a T'], ['out of the chain', 'the process only ends at HH']],
        explain: 'After ...H T the run of heads is zero again: the start state.' }),
    ] },

    sec('prob', 'First step for a probability'),
    { type: 'text', text: 'A race: roll a die repeatedly; you win if a 6 appears before any odd number. Rolling a 2 or a 4 changes nothing: you are back where you started.' },
    { type: 'diagram', diagram: 'graph', spec: { markov: true, title: '6 before an odd number', nodes: [{ id: 'S', label: 'start', x: 0.5, y: 0.2 }, { id: 'W', label: 'win', x: 0.1, y: 0.85 }, { id: 'L', label: 'lose', x: 0.9, y: 0.85 }], edges: [{ from: 'S', to: 'W', p: 1 / 6, label: '1/6' }, { from: 'S', to: 'L', p: 1 / 2, label: '3/6' }, { from: 'S', to: 'S', p: 1 / 3, label: '2/6' }, { from: 'W', to: 'W', p: 1, label: '1' }, { from: 'L', to: 'L', p: 1, label: '1' }] }, caption: 'One unfinished state (start) and two absorbing ones. The loop on start is the 2 or 4 that changes nothing.' },
    { type: 'steps', steps: [
      { say: 'Name the unknown: p = P(win from the start).', why: 'There is only one unfinished situation, so one unknown.',
        checks: [mc({ q: 'You roll a 2. What is your chance of winning from here?', right: 'p again: nothing has changed', at: 1,
          wrong: [['0', 'a 2 does not lose'], ['1/6', 'that is the chance of winning on the very next roll only'], ['1', 'a 2 does not win']],
          explain: 'The process has no memory: after a 2 you face exactly the starting situation.' })] },
      { say: 'Split on the first roll: a 6 wins (1/6), an odd number loses (3/6), a 2 or 4 returns to the start (2/6).', why: 'The three cases cover every face and do not overlap.',
        checks: [mc({ q: 'In this race, what is P(the first roll sends you back to the start)?', right: frac(2, 6), at: 2, wrong: [[frac(1, 6), 'only counted one of the two neutral faces'], [frac(3, 6), 'that is P(lose on the first roll)'], [frac(5, 6), 'counted every non-winning roll as a return']], explain: 'Faces 2 and 4: 2/6 = 1/3.' })] },
      { say: 'Write the equation: p = 1/6 × 1 + 3/6 × 0 + 2/6 × p.', why: 'Each branch is its chance times the win probability where it lands: 1 at win, 0 at lose, p at start.',
        checks: [{ make: (rng) => { const f = rng.pick(FACESETS), w = f.win.length, l = f.lose.length, n = 6 - w - l; return mc({ q: `Race: roll until ${f.wn} (win) or ${f.ln} (lose). Which equation is right for p = P(win)?`, right: `p = ${w}/6 + ${n}/6 × p`,
          wrong: [[`p = ${w}/6`, 'ignored the rolls that send you back'], [`p = ${w}/6 + ${l}/6 × p`, 'sent the losing rolls back to the start'], [`p = ${n}/6 × p`, 'forgot the winning branch']],
          explain: `Win: ${w}/6 × 1. Lose: ${l}/6 × 0. Neither: ${n}/6 × p.` }, rng); } }] },
      { say: 'Solve: p × (1 − 2/6) = 1/6, so p = (1/6) / (4/6) = 1/4.', why: 'Collect the p terms on one side, then divide.',
        checks: [{ make: raceQ }] },
    ] },

    sec('steps', 'First step for expected steps'),
    { type: 'text', text: 'For "how long", every step costs 1, and then you continue from wherever you land. Absorbing states cost nothing more.' },
    { type: 'formula', text: 'E(here) = 1 + Σ P(next) × E(next),    E(absorbing) = 0' },
    { type: 'steps', steps: [
      { say: 'Name the unknowns: e_{0} = expected tosses from start, e_{1} = expected tosses from "last toss was H".', why: 'Two unfinished states, two unknowns. HH is absorbing: 0 more tosses.',
        checks: [mc({ q: 'How many unknowns does "toss until HHH" need?', right: '3', at: 2,
          wrong: [['1', 'every partial run is its own state'], ['2', 'the unfinished states are start, H and HH: three'], ['4', 'HHH is absorbing: its value is 0, not an unknown']],
          explain: 'Start, "H", "HH": three unfinished states.' })] },
      { say: 'From start: one toss, then H (1/2) moves you to e_{1} and T (1/2) keeps you at start: e_{0} = 1 + ½ e_{1} + ½ e_{0}.', why: 'The +1 pays for the toss just made; the rest is the weighted value of where you land.',
        checks: [mc({ q: 'Roll a die until a 6. Which equation for e = expected rolls is right?', right: 'e = 1 + (5/6) e', at: 1,
          wrong: [['e = (5/6) e', 'forgot the +1 for the roll just made'], ['e = 1 + (1/6) e', 'a 6 ends the game; it is the misses that repeat'], ['e = 6 + (5/6) e', 'each roll costs 1, not 6']],
          explain: 'One roll, then with chance 5/6 you face the same situation again.' })] },
      { say: 'From "last toss H": one toss, then H (1/2) finishes and T (1/2) sends you to start: e_{1} = 1 + ½ × 0 + ½ e_{0}.', why: 'A T breaks the run, so you are back at the start, not at "H".',
        checks: [{ make: (rng) => { const k = rng.pick([2, 3, 4, 6, 10]); return { type: 'number', q: `Solve e = 1 + (1 − 1/${k}) e: the expected number of trials until a success with chance 1/${k}.`, answer: k, hints: ['Move the e terms to one side: e × (1/k) = 1.'], explain: `e/${k} = 1, so e = ${k}. This proves the geometric mean 1/p.` }; } }] },
      { say: `Substitute: the first equation gives e_{0} = 2 + e_{1}; with the second, e_{0} = 2 + 1 + ½ e_{0}, so e_{0} = ${HH}.`, why: 'Two linear equations, solved by substitution.',
        checks: [{ make: twoInRowQ }] },
    ] },
    { type: 'explain', prompt: 'Why does the equation for expected steps carry a +1 while the equation for a probability does not?', model: 'The +1 counts the step you just took: the expected steps from here are that one step plus the expected steps from wherever it leads. A probability of winning is not a count of anything; it is just the weighted chance of winning from the next state.', points: ['Expected steps = the step just taken + the expected steps from the next state', 'Probabilities weight the next values with nothing added', 'Absorbing states: value 1 or 0 for probabilities, 0 for steps'] },

    sec('ruin', "Gambler's ruin"),
    { type: 'text', text: 'A fair ±1 walk starting at k stops at 0 (ruin) or at N (target). First step: p_{k} = ½ p_{k − 1} + ½ p_{k + 1}, with p_{0} = 0 and p_{N} = 1. Each p_{k} is the average of its neighbours, so the points lie on a straight line from 0 to 1: p_{k} = k/N.' },
    { type: 'text', text: 'Expected length: E_{k} = 1 + ½ E_{k − 1} + ½ E_{k + 1} with E_{0} = E_{N} = 0. Try E_{k} = k(N − k): the right side is 1 + ½(k − 1)(N − k + 1) + ½(k + 1)(N − k − 1) = 1 + kN − k^{2} − 1 = k(N − k). It balances.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 10, barriers: [0, 10], start: 3, target: 10, path: [3, 4, 3, 2, 3, 4, 5, 4, 5, 6, 7] }, caption: `Start at 3, absorbing ends at 0 and 10. P(reach 10 first) = ${frac(3, 10)}; expected steps 3 × 7 = ${3 * 7}. The path below is one possible walk.` },
    { type: 'check', scope: "the fair gambler's ruin", questions: [{ hinge: true, make: (rng) => { const N = rng.int(5, 12), k0 = rng.int(1, N - 1), k = 2 * k0 === N ? k0 - 1 : k0; return mc({ q: `A fair ±1 walk starts at ${k} and stops at 0 or at ${N}. What is P(it reaches ${N} before 0)?`, right: frac(k, N), wrong: [['1/2', 'ignored where the walk starts'], [frac(N - k, N), 'that is P(reaching 0 first)'], [frac(1, N), 'counted only the path that goes straight up']], explain: `p_{k} = k/N = ${frac(k, N)}.` }, rng); } }] },

    sec('predict'),
    { type: 'predict', question: 'Fair coin. Which takes longer to appear on average: HT or HH?', answer: `HH: ${HH} tosses against ${HT} for HT.`, explain: `After H, a failed HH attempt (a T) sends you back to start, but a failed HT attempt (another H) leaves you at "last toss H". For HT: e_{1} = 1 + ½ e_{1} gives ${HT1}, and e_{0} = 2 + e_{1} = ${HT}.` },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Leave out the +1 for the step just taken.', fix: 'Expected steps = 1 + the weighted expected steps from the next state.' },
      { belief: 'After a broken run, go back one state.', fix: 'Ask what the last tosses now are: HH broken by T is the start; HT broken by H is still "last toss H".' },
      { belief: 'For a probability, the win state has value 0.', fix: 'For P(win): win 1, lose 0. For expected steps: every absorbing state 0.' },
      { belief: 'Every two-toss pattern takes 4 tosses on average.', fix: `HT takes ${HT}, HH takes ${HH}: how a pattern overlaps itself matters.` },
    ] },
    { type: 'erroneous', problem: 'A candidate computes the expected tosses until HH. One step is wrong.', steps: [
      'Let e_{0} be the expected tosses from start and e_{1} after one H.',
      'e_{0} = 1 + ½ e_{1} + ½ e_{0}.',
      'e_{1} = ½ × 1 + ½ e_{0}.',
      `Solving gives e_{0} = ${HHbad}.`,
    ], errorStep: 2, explain: `The toss from "H" costs 1 whatever happens: e_{1} = 1 + ½ × 0 + ½ e_{0}. With the +1 in place, e_{0} = ${HH}.` },
    { type: 'check', scope: 'first-step races', questions: [{ hinge: true, make: raceQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Races: P(A before B) = P(A) / (P(A) + P(B)) per step. Throw away the steps where nothing happens.' },
    { type: 'callout', tone: 'speed', text: 'Fair walk between 0 and N from k: P(reach N first) = k/N, expected steps k(N − k). A self-loop with chance q holds you for 1/(1 − q) steps on average.' },
    { type: 'check', scope: 'the race shortcut', questions: [
      { make: (rng) => { const [a, b] = rng.pick([[7, 12], [7, 2], [8, 12], [6, 11], [7, 11], [5, 10]]), wa = ways(a), wb = ways(b); return mc({ q: `Two dice are rolled repeatedly. What is P(a sum of ${a} appears before a sum of ${b})?`, right: frac(wa, wa + wb),
        wrong: [[frac(wa, 36), 'the chance on one roll only'], ['1/2', 'treated the two sums as equally likely'], [frac(wb, wa + wb), 'swapped the two sums']],
        explain: `Sum ${a}: ${wa} way${wa === 1 ? '' : 's'}, sum ${b}: ${wb} way${wb === 1 ? '' : 's'}. Ignore every other roll: ${wa}/(${wa} + ${wb}) = ${frac(wa, wa + wb)}.` }, rng); } },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Name the states; write value = (+1 per step if counting steps) + Σ P(next) × value(next); set the absorbing values (1 or 0 for win or lose, 0 for steps); solve the small system.' },

    sec('contrast'),
    { type: 'compare', columns: ['Asked for', 'Absorbing values', 'Equation per state'], rows: [
      ['P(reach the target first)', 'target 1, other ends 0', 'p = Σ P(next) × p(next)'],
      ['Expected number of steps', 'every end 0', 'e = 1 + Σ P(next) × e(next)'],
      ['Expected total payoff', 'the payoff at each end', 'v = (reward now) + Σ P(next) × v(next)'],
      ['Long-run share of time (no ends)', 'none', 'a different tool: balance of flows'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a state with a self-loop of chance q holds you for 1/(1 − q) steps on average (a geometric wait). With a biased walk, p_{k} = k/N no longer holds; the first-step equations still do, only their solution changes.' },
    { type: 'callout', tone: 'transfer', text: "Same idea elsewhere: the gambler's-ruin, random-walk, polygon-walk, pattern-waiting and race-to-k families in Beat the Odds; Markov graph rows in Likelihood List (their long-run version); and the geometric mean 1/p, now proved by e = 1 + (1 − p)e." },
    { type: 'check', scope: 'self-loops', questions: [
      { make: (rng) => { const [n, d] = rng.pick([[1, 2], [2, 3], [3, 4], [4, 5]]); return { type: 'number', q: `A state loops back to itself with chance ${n}/${d} and leaves otherwise. How many steps do you expect to spend in it (counting the step that leaves)?`, answer: d / (d - n), hints: ['e = 1 + q e.'], explain: `e = 1 + ${n}/${d} e, so e = 1/(1 − ${n}/${d}) = ${d / (d - n)}.` }; } },
    ] },

    sec('mastery', 'Mastery check'),
    { type: 'check', mastery: true, scope: 'the whole lesson', questions: [{ make: raceQ }, { make: ruinQ }, { make: twoInRowQ }] },
  ],
};
