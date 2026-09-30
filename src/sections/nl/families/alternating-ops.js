import { family, q, L, stepText } from '../lib.js';

const OPS = {
  add: (v) => ({ f: (x) => x.add(q(v)), t: `+${v}`, word: `add ${v}` }),
  sub: (v) => ({ f: (x) => x.sub(q(v)), t: `−${v}`, word: `subtract ${v}` }),
  mul: (v) => ({ f: (x) => x.mul(q(v)), t: `×${v}`, word: `multiply by ${v}` }),
};
const pairFor = (rng, d) => (d === 2
  ? rng.pick([[['add', rng.int(1, 9)], ['mul', rng.pick([2, 3])]], [['mul', 2], ['add', rng.int(1, 9)]]])
  : rng.pick([[['mul', rng.pick([2, 3])], ['sub', rng.int(1, 9)]], [['sub', rng.int(1, 6)], ['mul', rng.pick([2, 3])]], [['mul', 3], ['add', rng.int(2, 9)]]]));
const mk = ([k, v]) => OPS[k](v);

export default family({
  id: 'alternating-ops',
  title: 'Alternating operations',
  skill: 'When the steps take turns (add, multiply, add, multiply), track which operation is due',
  levels: [2, 3],
  show: (d) => (d === 2 ? 6 : 7),
  params: (rng, d) => ({ a: rng.int(1, 9), ops: pairFor(rng, d) }),
  accept: (p, xs) => xs.every((v) => !v.isZero()),
  terms: ({ a, ops }, n) => { const out = [q(a)]; for (let i = 1; i < n; i++) out.push(mk(ops[(i - 1) % 2]).f(out[i - 1])); return out; },
  rule: ({ ops }) => `alternate: ${mk(ops[0]).word}, then ${mk(ops[1]).word}`,
  explain: ({ ops }, { shown }) => [
    { say: `Steps: ${shown.slice(1).map((v, i) => stepText(shown[i], v)).slice(0, 4).join('; ')}.`, why: 'Look at each step on its own: gaps alternate between a fixed number and something that grows with the term.' },
    { say: `Odd steps ${mk(ops[0]).word}; even steps ${mk(ops[1]).word}.`, why: 'Two operations taking turns; each is checked on every step of its type.' },
  ],
  compute: ({ ops }, all, k) => `Step ${k} is ${k % 2 === 1 ? 'odd' : 'even'}, so ${mk(ops[(k - 1) % 2]).word}: ${L(all[k - 1])} ${mk(ops[(k - 1) % 2]).t} = ${L(all[k])}.`,
  rivals: ({ ops }, { shown }) => {
    const n = shown.length, a = shown[n - 1];
    const due = mk(ops[(n - 1) % 2]), other = mk(ops[n % 2]);
    return [
      { value: other.f(a), misconception: `Applied the wrong operation (${other.t}); the operations alternate, and this step is ${due.t}.` },
      { value: other.f(due.f(a)), misconception: `Applied both operations (${due.t} then ${other.t}) in one step; each step uses only one.` },
    ];
  },
  hints: () => ['Describe each step separately: some are additions, some multiplications.', 'Which operation did the last step use? The next step uses the other one.'],
  anchor: 'A single rule repeats one operation; here two known operations simply take turns.',
  srule: 'Alternating steps → name each step\'s operation, apply the one that is due.',
  lesson: {
    purpose: 'Alternating rules produce gaps that look chaotic (+3, +8, +3, +22). Naming each step\'s operation makes them trivial.',
    anchor: 'Arithmetic (always +a) and geometric (always ×b) are the two pieces; the one change is that they alternate.',
    steps: [
      { say: 'Write each step as an operation: +3? ×2? Check odd and even steps separately.', why: 'An operation that depends on the term (×2) makes gaps grow; a fixed addition keeps them flat, so the gap list alternates flat and growing.' },
      { say: 'Apply the operation whose turn it is.', why: 'Most errors come from applying the operation that was just used.' },
    ],
    predict: { question: '2, 5, 10, 13, 26, 29, ? Which operation is due?', answer: '×2 (steps went +3, ×2, +3, ×2, +3): 58.' },
    rule: 'Alternating steps → name each step\'s operation, apply the one that is due.',
    contrast: 'Interleaved sequences also zigzag, but there every second term forms its own sequence; here each term is built from the one immediately before.',
    edge: 'When the addition is negative (×3 then −4) the terms can still grow; judge by the operations, not by the direction of travel.',
  },
});
