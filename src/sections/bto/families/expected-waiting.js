// Expected waiting times: first six, two special faces, a repeat, two sixes in a row, k heads in a row.
import { hittingTimes } from '../../../core/markov.js';
import { mcqItem, agree, q, pic, table } from '../lib.js';
const par = (x) => (String(x).includes('/') ? `(${x})` : String(x));

const ID = 'expected-waiting';
const COINS = [[1, 2], [1, 3], [1, 4], [2, 5], [1, 5], [1, 10]];
const FIRST = [
  { text: 'You throw a fair die until the first six.', unit: 'throws', p: [1, 6], why: 'One face of six.' },
  { text: 'You throw a fair die until you get a 5 or a 6.', unit: 'throws', p: [1, 3], why: 'Two faces of six.' },
  { text: 'You throw two fair dice until they show a double.', unit: 'throws', p: [1, 6], why: 'Six doubles among 36 ordered pairs.' },
  { text: 'You throw two fair dice until their sum is 12.', unit: 'throws', p: [1, 36], why: 'Only (6,6) of 36 ordered pairs.' },
  { text: 'You throw two fair dice until their sum is at least 10.', unit: 'throws', p: [1, 6], why: 'Sums 10, 11, 12 have 3 + 2 + 1 = 6 of 36 ordered pairs.' },
  { text: 'You draw a card from a shuffled deck, look, and put it back, until you draw an ace.', unit: 'draws', p: [1, 13], why: 'Four aces in 52 cards, restored after each draw.' },
  { text: 'You draw a card with replacement until you draw a heart.', unit: 'draws', p: [1, 4], why: 'Thirteen hearts in 52 cards.' },
  { text: 'You throw three fair dice until all three show the same face.', unit: 'throws', p: [1, 36], why: 'Six triples among 216 outcomes.' },
  ...COINS.map(([a, c]) => ({ text: `A coin lands heads with probability ${a}/${c}. You flip it until the first head.`, unit: 'flips', p: [a, c], why: 'Given.' })),
];
const words = ['', 'one', 'two', 'three', 'four', 'five'];

// Each variant: closed-form value + a Markov chain (rows of Q) whose hitting time is the answer.
function variant(kind, rng) {
  if (kind === 'first') {
    const ev = rng.pick(FIRST);
    const [a, c] = ev.p;
    const p = q(a, c);
    const med = Math.ceil(Math.log(0.5) / Math.log(1 - a / c));
    return {
      value: q(c, a), data: { kind, a, c },
      text: `${ev.text} What is the expected number of ${ev.unit}, including the last one?`,
      distractors: [
        { value: q(c - a, a), misconception: 'Counted only the failures before the success; the successful trial counts too.' },
        { value: q(c, 2 * a), misconception: 'Halved 1/p, reasoning that the success arrives "halfway" on average.' },
        { value: med, misconception: `Answered the median wait (${med}), the point by which you have a 50% chance. The mean is larger because of the long tail of unlucky runs.` },
        { value: q(c, a).mul(q(c, a)), misconception: 'Squared 1/p.' },
        { value: p, misconception: 'Answered the success probability per trial instead of the expected number of trials.' },
      ],
      steps: [
        { say: `P(success on one ${ev.unit.replace(/s$/, '')}) = ${p}.`, why: ev.why },
        { say: `Let E be the expected number. One trial happens; with probability ${p} you stop, otherwise you are back at the start.`, why: 'Independent trials: after a failure, nothing has changed.' },
        { say: `E = 1 + (1 − ${p})E, so E = 1/p = ${c / a}.`, why: 'Solve the one-line equation.' },
      ],
      picture: pic('tree', { root: { label: 'start', children: [{ p: p.toString(), label: 'success: stop', mark: true }, { p: q(1).sub(p).toString(), label: 'miss: back to the start' }] }, showProducts: false }, `One ${ev.unit.replace(/s$/, '')} always happens. With chance ${p} you stop; otherwise you face the same wait again, so E = 1 + (1 − ${p})E and E = ${c / a}.`),
      fast: `1/p = ${c}/${a} = ${c / a}.`,
      check: `Half the time you finish within ${med} ${ev.unit}, yet the mean is ${c / a}: the long tail of slow runs pulls the average up, so an option near ${med} is the median, not the mean.`,
    };
  }
  if (kind === 'twoFaces') {
    const s = rng.pick([6, 6, 8, 10, 12]), m = rng.pick([2, 2, 3]);
    const faces = m === 2 ? 'a 1 and a 2' : 'a 1, a 2 and a 3';
    let v = q(0);
    const parts = [];
    for (let i = 0; i < m; i++) { v = v.add(q(s, m - i)); parts.push(`${s}/${m - i}`); }
    return {
      value: v, data: { kind, s, m },
      text: `You throw a fair ${s === 6 ? 'die' : `${s}-sided die`} until ${faces} have all appeared (in any order). What is the expected number of throws?`,
      distractors: [
        { value: m * s, misconception: `Added ${m} separate waits of ${s}. Early on, any missing special face will do, so the first stages are faster.` },
        { value: s, misconception: 'Only waited for one special face.' },
        { value: q(s, m), misconception: 'Only counted the wait for the first special face.' },
        { value: v.mul(q(2)), misconception: 'Doubled the stage sum; each stage wait is s/(number of faces still missing).' },
        { value: q(s * (m + 1), 2), misconception: 'Averaged the fastest and slowest stage waits instead of adding all stages.' },
      ],
      steps: [
        { say: `Stage i (i special faces still missing) succeeds with probability i/${s} per throw: expected ${s}/i throws.`, why: 'Any missing special face ends the stage.' },
        { say: `Total = ${parts.join(' + ')} = ${v} ≈ ${v.toNumber().toFixed(2)}.`, why: 'Linearity: expected total = sum of expected stages.' },
      ],
      picture: table(['Stage', 'Special faces missing', 'Chance per throw', 'Expected throws'], Array.from({ length: m }, (_, i) => [i + 1, m - i, `${m - i}/${s}`, `${s}/${m - i}`]), `Each stage ends when any missing special face shows up, so it gets slower as fewer are missing. The stage waits add to ${v}.`),
      fast: `${parts.join(' + ')} = ${v}.`,
      check: `It must exceed ${m} × ${s}/${m} = ${s} (waiting for the faces at the first stage's speed throughout) and stay below ${m} × ${s} = ${m * s} (waiting for each face from scratch).`,
    };
  }
  if (kind === 'repeat') {
    const s = rng.pick([4, 6, 6, 8, 10, 12, 20]);
    return {
      value: q(s + 1), data: { kind, s },
      text: `You throw a fair ${s === 6 ? 'die' : `${s}-sided die`} repeatedly. What is the expected number of throws until some throw shows the same face as the throw just before it?`,
      distractors: [
        { value: s, misconception: 'Forgot the first throw: it cannot match anything, but it still counts.' },
        { value: s * s + s, misconception: 'Waited for a specific double such as two sixes in a row.' },
        { value: s * s, misconception: `Treated each pair of throws as a fresh attempt with chance 1/${s * s}.` },
        { value: 2, misconception: `Assumed a match is likely right away; each later throw only matches with chance 1/${s}.` },
        { value: (s + 1) / 2, misconception: 'Averaged the faces instead of counting throws.' },
      ],
      steps: [
        { say: `The first throw sets a face; from then on, each throw matches the previous one with probability 1/${s}.`, why: 'Whatever the previous face is, exactly one face matches it.' },
        { say: `Expected throws after the first = ${s}, so total = 1 + ${s} = ${s + 1}.`, why: 'Geometric wait, plus the first throw.' },
      ],
      picture: pic('tree', { root: { label: 'after any throw', children: [{ p: `1/${s}`, label: 'next throw matches: stop', mark: true }, { p: `${s - 1}/${s}`, label: 'no match: same position' }] }, showProducts: false }, `After the first throw the chance of a match is 1/${s} every time, whatever the faces are, so the wait after it is ${s} throws: ${s + 1} in total.`),
      fast: `1 + ${s} = ${s + 1}.`,
      ask: 'We want E[number of throws until a throw repeats the face of the throw before it].',
      check: `The first throw can never be a match, so the answer is one more than the plain wait ${s}.`,
    };
  }
  if (kind === 'doubleSix') {
    const s = rng.pick([6, 6, 4, 8, 10]);
    const face = s === 6 ? 'sixes' : `${s}s`;
    const one = s === 6 ? 'six' : String(s); // one face: 'a six', 'an 8'
    const aOne = `${s === 8 ? 'an' : 'a'} ${one}`;
    return {
      value: q(s * s + s), data: { kind, s },
      text: `You throw a fair ${s === 6 ? 'die' : `${s}-sided die`} until you get two ${face} in a row. What is the expected number of throws?`,
      distractors: [
        { value: s * s, misconception: `Treated each pair of throws as an independent attempt with chance 1/${s * s}. Overlapping pairs and resets make it slower.` },
        { value: 2 * s * s, misconception: `Used non-overlapping blocks of two throws: 2 × ${s * s}.` },
        { value: 2 * s, misconception: `Added two waits of ${s}. After ${aOne}, a miss sends you back to the start.` },
        { value: s + 1, misconception: 'Waited for any repeated face, not specifically this one.' },
      ],
      steps: [
        { say: `States: 0 (no progress), 1 (last throw ${aOne}). E0 = 1 + (${s - 1}/${s})E0 + (1/${s})E1, E1 = 1 + (${s - 1}/${s})E0.`, why: `From state 1, ${aOne} finishes and anything else resets to state 0.` },
        { say: `Substitute and solve: E0 = ${s}² + ${s} = ${s * s + s}.`, why: 'Two linear equations in two unknowns.' },
      ],
      picture: pic('graph', { markov: true, nodes: [{ id: '0', label: 'no progress', x: 0.1, y: 0.5 }, { id: '1', label: `one ${one}`, x: 0.55, y: 0.5 }, { id: 'D', label: 'done', x: 0.95, y: 0.5 }], edges: [{ from: '0', to: '0', p: (s - 1) / s, label: `${s - 1}/${s}` }, { from: '0', to: '1', p: 1 / s, label: `1/${s}` }, { from: '1', to: 'D', p: 1 / s, label: `1/${s}` }, { from: '1', to: '0', p: (s - 1) / s, label: `${s - 1}/${s}` }] }, `Two states of progress. A miss from either state sends you back to the start, which is why the wait is ${s}² + ${s} and not 2 × ${s}.`),
      fast: `s² + s = ${s * s} + ${s} = ${s * s + s}.`,
      check: `Two ${face} in a row have chance 1/${s * s} in any fixed pair of throws, so the wait is at least ${s * s}; losing progress after a miss adds the extra ${s}.`,
    };
  }
  if (kind === 'headRun') {
    const k = rng.int(2, 5);
    return {
      value: q(2 ** (k + 1) - 2), data: { kind, k },
      text: `You flip a fair coin until you get ${words[k]} heads in a row. What is the expected number of flips?`,
      distractors: [
        { value: 2 ** k, misconception: `Treated each block of ${k} flips as a fresh attempt with chance 1/2^${k}; overlapping attempts and resets change this.` },
        { value: 2 ** (k + 1), misconception: 'Forgot the −2 in 2^(k+1) − 2.' },
        { value: 2 * k, misconception: 'Added a wait of 2 per head; a tail wipes out the progress.' },
        { value: k * 2 ** k, misconception: 'Multiplied the run length by 2^k.' },
      ],
      steps: [
        { say: `E_k = 2E_(k−1) + 2: to extend a run of k − 1 heads, flip once more; a tail sends you back to the start.`, why: 'E_k = E_(k−1) + 1 + (1/2)E_k, which rearranges to E_k = 2E_(k−1) + 2.' },
        { say: `E_1 = 2, E_2 = 6, E_3 = 14, … so E_${k} = 2^${k + 1} − 2 = ${2 ** (k + 1) - 2}.`, why: 'Iterate the recursion.' },
      ],
      picture: table(['Heads in a row', 'Expected flips E = 2 × previous + 2'], Array.from({ length: k }, (_, i) => [i + 1, `${i ? `2 × ${2 ** (i + 1) - 2} + 2 = ` : ''}${2 ** (i + 2) - 2}`]), `Each extra head in the run roughly doubles the wait, because a tail at any point throws away the whole run.`),
      fast: `2^${k + 1} − 2 = ${2 ** (k + 1) - 2}.`,
      check: `The chance of ${k} heads in a row at a fixed place is 1/${2 ** k}, so the wait is at least ${2 ** k}; resets push it to about twice that.`,
    };
  }
  // Wait until both heads and tails have appeared, biased coin.
  const [a, c] = rng.pick(COINS.filter(([x, y]) => 2 * x !== y));
  const p = q(a, c), r = q(1).sub(p);
  const v = q(1).add(p.div(r)).add(r.div(p));
  return {
    value: v, data: { kind: 'bothSides', a, c },
    text: `A coin lands heads with probability ${p}. You flip it until you have seen at least one head and at least one tail. What is the expected number of flips?`,
    distractors: [
      { value: q(c, a).add(q(c, c - a)), misconception: 'Added the waits for a head and for a tail from scratch. After the first flip you only wait for the other side.' },
      { value: 3, misconception: 'Used the fair-coin answer 3 for a biased coin.' },
      { value: 2, misconception: 'Assumed two flips always suffice.' },
      { value: q(1).add(q(c, a)), misconception: 'Only waited for a head after the first flip, forgetting the first flip might be a head.' },
    ],
    steps: [
      { say: 'The first flip shows some side; then wait for the other side.', why: 'After one flip, only the missing side matters.' },
      { say: `If the first is a head (prob ${p}), the wait for a tail is 1/${par(r)}; if a tail (prob ${r}), the wait for a head is 1/${par(p)}.`, why: 'Geometric waits.' },
      { say: `E = 1 + ${par(p)}/${par(r)} + ${par(r)}/${par(p)} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Condition on the first flip.' },
    ],
    picture: pic('tree', { root: { label: 'first flip', children: [{ p: p.toString(), label: `head, then wait 1/${par(r)} for a tail` }, { p: r.toString(), label: `tail, then wait 1/${par(p)} for a head` }] }, showProducts: false }, `Split on the first flip; after it only the missing side matters. E = 1 + ${p} × 1/${par(r)} + ${r} × 1/${par(p)} = ${v}.`),
    fast: `1 + p/q + q/p = ${v}.`,
    check: `A fair coin gives 3; a biased one waits longer for its rare side, so the answer is above 3.`,
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Expected waiting times',
  skill: 'Write E = 1 + Σ P(next state)·E(next state); geometric waits are 1/p',
  levels: [1, 2, 3],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? 'first' : difficulty === 2 ? rng.pick(['twoFaces', 'repeat', 'bothSides', 'first']) : rng.pick(['doubleSix', 'headRun', 'twoFaces']);
    const v = variant(kind, rng);
    return mcqItem(ID, rng, difficulty, {
      ev: true,
      value: v.value,
      text: v.text,
      distractors: v.distractors,
      steps: v.steps,
      picture: v.picture, fast: v.fast, check: v.check, ask: v.ask,
      rule: 'Geometric wait = 1/p. Multi-stage wait = sum of stage waits. With resets, set up E_state = 1 + Σ p·E_next and solve.',
      anchor: 'The expected number of throws to a six is 6 = 1/p. Every waiting question here is that fact with one change: several stages, or progress that can be lost.',
      hints: ['What are the states of progress?', 'Write E for each state: one step, then the expected remaining wait from where you land.', 'Solve the small linear system.'],
      data: v.data,
    });
  },

  // Independent check: expected hitting time of the absorbing state, solved exactly by markov.js.
  verify(item) {
    const P = chain(item.params);
    const h = hittingTimes(P, [P.length - 1]);
    return agree(item, h[0]);
  },

  lesson: {
    purpose: 'Expected-value questions about "how long until" are the most common harder Beat the Odds items. One method, first-step analysis, solves all of them.',
    anchor: 'Expected throws to a six = 6 (= 1/p). Everything else is that with one change: more than one stage, or progress that can reset.',
    steps: [
      { say: 'Name the states of progress (none, one six so far, done).', why: 'The future depends only on the current state.' },
      { say: 'For each state: E = 1 + Σ P(move to s)·E(s), with E(done) = 0.', why: 'One step is always spent; then you continue from wherever you land.' },
      { say: 'Solve the linear equations, or add stages when progress can never be lost.', why: 'Linearity: independent stages add.' },
    ],
    predict: { question: 'Which takes longer on average: two sixes in a row, or a six followed by a five?', answer: 'Two sixes in a row (42) against six-then-five (36). After a failed attempt at 66 you may lose progress; a failed 65 attempt that ends in 6 keeps it.' },
    edge: 'p = 1 gives E = 1; p → 0 makes the wait unbounded.',
    rule: '1/p for one success; Σ stage waits for stages; E_k = 2E_(k−1) + 2 for k heads in a row; 42 for 66.',
    contrast: 'Mean wait (1/p) against median wait (about 0.69/p): the question asks for the mean.',
  },
};

// Markov chain for each variant, built only from item.params; the last state is "done".
function chain({ kind, a, c, k, s: sides, m }) {
  const z = q(0), one = q(1);
  if (kind === 'first') { const p = q(a, c); return [[one.sub(p), p], [z, one]]; }
  if (kind === 'twoFaces') {
    // state i = number of special faces seen so far (0..m)
    return Array.from({ length: m + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => {
      if (i === m) return j === m ? one : z;
      return j === i ? q(sides - (m - i), sides) : j === i + 1 ? q(m - i, sides) : z;
    }));
  }
  if (kind === 'repeat') return [[z, one, z], [z, q(sides - 1, sides), q(1, sides)], [z, z, one]];
  if (kind === 'doubleSix') return [[q(sides - 1, sides), q(1, sides), z], [q(sides - 1, sides), z, q(1, sides)], [z, z, one]];
  if (kind === 'headRun') {
    // state i = current run of heads; a tail returns to 0, a head moves to i + 1
    return Array.from({ length: k + 1 }, (_, i) => Array.from({ length: k + 1 }, (_, j) => {
      if (i === k) return j === k ? one : z;
      return (j === 0 ? q(1, 2) : z).add(j === i + 1 ? q(1, 2) : z);
    }));
  }
  const p = q(a, c), r = one.sub(p); // states: start, seen H only, seen T only, done
  return [[z, p, r, z], [z, p, z, r], [z, z, r, p], [z, z, z, one]];
}
