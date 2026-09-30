// Monty Hall: the host's rule sets the likelihoods. A knowing host leaves your door at 1/n and
// pushes the rest onto the other closed doors; a random host who happens to show goats does not.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

// n doors, knowing host opens m goats, you switch to one of the k = n − m − 1 other closed doors.
const knowSwitch = (n, m) => Q.of(n - 1, n * (n - m - 1));
const stay = (n) => Q.of(1, n);
const randomHost = (n, m) => Q.of(1, n - m);
const NS = [3, 4, 5, 6, 10, 20];

export default {
  id: 'bto/monty-hall',
  book: 'bto',
  kind: 'family',
  family: 'monty-hall',
  title: 'Monty Hall and the host\'s knowledge',
  summary: 'Ask whether the host could have shown the car. Knowing host: your door keeps 1/n. Random host: all closed doors are equal.',
  prerequisites: ['bto/bayes-boxes'],
  objectives: [
    'Derive the 2/3 switching answer with a probability tree, not by memory',
    'Generalise to n doors and m opened doors: switch wins (n − 1)/(n · k) for k other closed doors',
    'Explain why a random host who happens to show goats gives 1/2, not 2/3',
    'Recognise the "two doors left, so 1/2" belief and repair it',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: three doors, one car, two goats. You pick door 1. The host, who knows where the car is, opens another door showing a goat and offers a switch. If you switch, what is your chance of the car? Try two approaches.', answer: `${knowSwitch(3, 1)}`, explain: 'Your first pick is right 1/3 of the time and switching then loses; it is wrong 2/3 of the time and switching then wins, because the host has removed the only other goat. If you said 1/2, you treated the two closed doors as equal; the lesson shows why they are not.' },
    { type: 'text', text: 'Several doors (boxes, envelopes) hide one prize. You pick one. A **host** then opens some of the others, showing no prize, and you may **stay or switch**. The question asks your chance of winning, and the crucial detail is **whether the host knows** where the prize is.' },
    { type: 'list', items: ['"Three doors, you pick door 1, the host (who knows) opens door 3: a goat. Switch?"', '"100 doors; the host opens 98 empty ones. Probability the last closed door has the car?"', '"The host does not know where the car is and opens a door at random: a goat. Now what is your chance if you switch?"'] },
    { type: 'text', text: 'Not this lesson: evidence produced by the object itself, like a coin showing heads (bto/bayes-boxes). Here the evidence is **chosen** by someone, and his rule of choice is what matters.' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which detail matters most in a Monty Hall question?', options: ['Whether the host could have revealed the prize', 'Which door number you picked', 'Whether the prize is a car', 'How many goats there are'], answer: 0, traps: { 1: 'door labels are symmetric', 2: 'the prize is irrelevant', 3: 'it matters only through the number of doors' }, explain: 'A host who avoids the prize on purpose moves probability; a host who might have shown it does not.' },
    ] },

    S('why'),
    { type: 'text', text: 'Monty Hall tests whether you can tell informative evidence from uninformative evidence. The same "goat revealed" means different things depending on how the door was chosen. The idea matters far beyond games: a quote from a trader who knows more than you carries information in what it avoids, just as the host\'s door does. Memorising 2/3 is not enough either: with more doors, several doors opened, or a host who does not know, the answer changes, and each variant has its own tempting wrong option.' },

    S('anchor'),
    { type: 'text', text: 'From bto/bayes-boxes: posterior ∝ prior × P(evidence | hypothesis). Here the hypotheses are the car positions (prior 1/n each) and the evidence is "the host opened this door". The **one change**: the likelihood comes from the host\'s **rule**, how likely he was to open that door given where the car is.' },
    { type: 'check', scope: 'prior × likelihood, with the host as the source', questions: [
      { type: 'choice', q: 'Three doors, you picked door 1, the knowing host must open a goat door. If the car is behind door 2, how likely is he to open door 3?', options: ['1', '1/2', '1/3', '0'], answer: 0, traps: { 1: 'he has no choice: door 1 is yours and door 2 hides the car', 2: 'confused with the prior', 3: 'door 3 is the only door he may open' }, explain: 'He cannot open your door or the car, so door 3 is forced.' },
    ] },

    S('picture'),
    { type: 'text', text: 'The tree for the knowing host, when he opens door 3. First the car\'s position (1/3 each), then the host\'s move. If the car is behind your door, he picks either goat door at random; otherwise his move is forced.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'car', children: [
      { p: '1/3', label: 'behind door 1 (yours)', children: [{ p: '1/2', label: 'host opens 2' }, { p: '1/2', label: 'host opens 3', mark: true }] },
      { p: '1/3', label: 'behind door 2', children: [{ p: '1', label: 'host opens 3', mark: true }] },
      { p: '1/3', label: 'behind door 3', children: [{ p: '1', label: 'host opens 2' }] },
    ] }, total: '1/2' }, caption: 'Given "host opens 3" (marked, total 1/2): car behind door 1 has weight 1/6, behind door 2 has 1/3. So P(door 1) = 1/3 and P(door 2) = 2/3. Switch.' },
    { type: 'check', scope: 'reading the knowing-host tree', questions: [
      { type: 'choice', q: 'From the tree: P(car behind door 2 | host opened door 3)?', options: ['2/3', '1/2', '1/3', '1'], answer: 0, traps: { 1: 'treated the two closed doors as equal', 2: 'kept the prior', 3: 'forgot the host sometimes opens door 3 when the car is behind door 1' }, explain: '(1/3) / (1/6 + 1/3) = 2/3.' },
    ] },
    { type: 'text', text: 'Now a host who does **not** know. He opens door 3 at random, and it happens to show a goat. If the car had been behind door 3 he would have revealed it; that branch is ruled out by what you saw, and it is equally likely whichever door hides the car.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'car', children: [
      { p: '1/3', label: 'behind door 1', children: [{ p: '1/2', label: 'opens 2: goat' }, { p: '1/2', label: 'opens 3: goat', mark: true }] },
      { p: '1/3', label: 'behind door 2', children: [{ p: '1/2', label: 'opens 2: car shown' }, { p: '1/2', label: 'opens 3: goat', mark: true }] },
      { p: '1/3', label: 'behind door 3', children: [{ p: '1/2', label: 'opens 2: goat' }, { p: '1/2', label: 'opens 3: car shown' }] },
    ] }, total: '1/3' }, caption: 'Given "door 3 opened and showed a goat" (marked, total 1/3): door 1 and door 2 each have weight 1/6. So each is 1/2. The random host\'s reveal is plain elimination.' },
    { type: 'check', scope: 'the random-host tree', questions: [
      { type: 'choice', q: 'Random host, three doors, he opened door 3 and it showed a goat. You switch to door 2. P(win)?', options: [randomHost(3, 1).toString(), knowSwitch(3, 1).toString(), '1/3', '0'], answer: 0, traps: { 1: 'used the knowing-host answer: this host might have shown the car', 2: 'the prior', 3: 'thought switching never helps' }, explain: 'The two marked leaves weigh the same: 1/2 each.' },
    ] },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Knowing host opens all but one other door', xLabel: 'doors n', yLabel: 'P(win)', categories: NS.map(String), series: [{ name: 'switch', values: NS.map((n) => Math.round(knowSwitch(n, n - 2).toNumber() * 1000) / 1000) }, { name: 'stay', values: NS.map((n) => Math.round(stay(n).toNumber() * 1000) / 1000) }], valueLabels: true }, caption: 'Your door keeps 1/n; the single other closed door collects everything else, (n − 1)/n. With 20 doors, switching wins 19 times in 20.' },
    { type: 'check', scope: 'many doors, knowing host', questions: [
      { make: (rng) => { const n = rng.pick([4, 5, 10, 50, 100]); return mc(rng, `${n} doors. The knowing host opens ${n - 2} goat doors, leaving yours and one other closed. P(win if you switch)?`, knowSwitch(n, n - 2).toString(), [['1/2', 'two closed doors, so 1/2'], [stay(n).toString(), 'the staying probability'], [Q.of(n - 2, n).toString(), 'moved only the opened doors\' share']], `Your door keeps 1/${n}; the other closed door has ${knowSwitch(n, n - 2)}.`); } },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Prior: the car is behind each of the n doors with 1/n, including yours.', why: 'The car is placed before you choose, uniformly.',
        checks: [
          { make: (rng) => { const n = rng.int(3, 8); return { type: 'number', q: `${n} doors. Before anything is opened, how many times out of ${n * 10} would your first pick hide the car, on average?`, answer: 10, hints: [`P = 1/${n}.`], explain: `${n * 10} × 1/${n} = 10.` }; } },
        ] },
      { say: 'Knowing host: he can always open goat doors, whatever is behind yours. So his action says nothing about your door: it keeps 1/n.', why: 'Evidence that is equally likely under "car behind my door" and "car elsewhere" cannot move the probability of your door.',
        checks: [
          { type: 'choice', q: 'Knowing host, 3 doors. After he opens a goat door, P(car behind your door)?', options: ['1/3', '1/2', '2/3', '0'], answer: 0, traps: { 1: 'thought the reveal splits the rest evenly', 2: 'swapped your door with the other', 3: 'thought the host reveals your door\'s content' }, explain: 'His action was possible whatever your door hid: 1/3 stays.' },
        ] },
      { say: 'The opened doors drop to 0. The remaining (n − 1)/n spreads evenly over the other closed doors, k of them.', why: 'He never opens the car, so its probability cannot sit on an opened door; the other closed doors are symmetric to each other.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 7), m = rng.int(1, n - 3); const k = n - m - 1; return { type: 'number', q: `${n} doors, knowing host opens ${m}. How many closed doors are there besides yours?`, answer: k, hints: [`${n} doors minus yours minus ${m} opened.`], explain: `${n} − 1 − ${m} = ${k}; they share ${Q.of(n - 1, n)}.` }; } },
        ] },
      { say: 'Switching to one of those k doors wins with (n − 1)/n ÷ k = (n − 1)/(n · k). Three doors, k = 1: 2/3.', why: 'You collect one door\'s share of the probability that left your door.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 7), m = rng.int(1, n - 3); const v = knowSwitch(n, m); return mc(rng, `${n} doors, the knowing host opens ${m} goat door${m > 1 ? 's' : ''}; you switch to one of the other closed doors at random. P(win)?`, v.toString(), [[randomHost(n, m).toString(), 'treated all unopened doors as equally likely'], [stay(n).toString(), 'the staying probability'], [Q.of(n - 1, n).toString(), 'gave your new door all the probability of the other doors'], [Q.of(1 + m, n).toString(), 'moved only the opened doors\' share onto your new door']], `(${n} − 1)/(${n} × ${n - m - 1}) = ${v}.`); } },
        ] },
      { say: 'Random host who happens to show goats: his choice ignored the car, so conditioning on "goats shown" leaves every unopened door, yours included, equally likely: 1/(n − m).', why: 'The reveal was equally likely to have exposed the car whichever door it was behind, so seeing goats only eliminates those doors.',
        checks: [
          { make: (rng) => { const n = rng.int(4, 7), m = rng.int(1, n - 2); return mc(rng, `${n} doors. A host who does not know opens ${m} other door${m > 1 ? 's' : ''} at random: all goats. You switch to one particular closed door. P(win)?`, randomHost(n, m).toString(), [[knowSwitch(n, m).toString(), 'used the knowing-host answer'], [stay(n).toString(), 'kept the prior'], ['1/2', 'two outcomes, car or goat']], `${n - m} unopened doors, all equal: ${randomHost(n, m)}.`); } },
        ] },
    ] },
    { type: 'explain', prompt: 'In your own words: why does switching win 2/3 with a knowing host but only 1/2 with a host who opens a door at random and happens to show a goat?', model: 'The knowing host can always show a goat, so his reveal tells you nothing about your own door, which stays at 1/3; since he never reveals the car, the other 2/3 lands on the one closed door. The random host could have revealed the car, and seeing a goat is equally consistent with the car behind your door or the other closed door, so they end up equal at 1/2.', points: ['ask whether the host could have shown the car', 'knowing host: your door keeps 1/n, the rest moves to the other closed doors', 'random host: the reveal is elimination, all closed doors equal'] },

    S('worked'),
    { type: 'worked', family: 'monty-hall', section: 'bto', difficulty: 2, seed: 'a', intro: 'The classic three doors. Try it before opening the solution.' },
    { type: 'worked', family: 'monty-hall', section: 'bto', difficulty: 3, seed: 'c', fade: 1, intro: 'More doors and a host who does not know. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: '100 doors. The knowing host opens 98 goat doors. Before computing: roughly what is your chance if you switch to the last closed door?', answer: `${knowSwitch(100, 98)}.`, explain: 'Your door kept 1/100; the one other closed door collected the rest.' },

    S('traps'),
    { type: 'traps', family: 'monty-hall', section: 'bto', extra: [
      { belief: 'Two closed doors are left, so each has 1/2.', fix: 'They are not symmetric: the host protected one of them (the other door) and could not touch yours.' },
      { belief: 'A random host who shows goats is the same as a knowing host.', fix: 'He could have shown the car; his goat is plain elimination, so the closed doors are equal.' },
      { belief: 'With several other closed doors, switching gets all of (n − 1)/n.', fix: 'That share is split over the k other closed doors: (n − 1)/(n · k).' },
    ] },
    { type: 'erroneous', problem: 'A candidate analyses the classic three doors with a knowing host. One step is wrong.', steps: [
      'I pick door 1: P(car) = 1/3.',
      'The host opens door 3 and shows a goat.',
      'Two doors are left and the car is behind one of them, so each has probability 1/2.',
      'Switching does not matter.',
    ], errorStep: 2, explain: 'The two doors are not symmetric. The host could open door 3 whatever was behind door 1, so door 1 keeps 1/3; he chose door 3 partly because door 2 might hide the car. Door 2 has 2/3.' },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `5 doors, knowing host opens 1 goat door; you switch to one of the other 3 closed doors. A candidate answers ${Q.of(4, 5)}. Which belief?`, options: ['Gave the new door all of (n − 1)/n', 'Two doors, so 1/2', 'Random host'], answer: 0, explain: `4/5 is shared by 3 doors: ${knowSwitch(5, 1)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'One question first: **could the host have shown the car?** No (he knows and avoids it) → your door 1/n, the other closed doors share (n − 1)/n. Yes (random) → every unopened door equal.' },
    { type: 'callout', tone: 'speed', text: `Values to know: 3 doors switch ${knowSwitch(3, 1)}; 4 doors, 1 opened, switch ${knowSwitch(4, 1)} (still better than staying at ${stay(4)}); n doors, n − 2 opened, switch (n − 1)/n. These take seconds of the ${SECTIONS.bto.exam.perItemSeconds}.` },
    { type: 'check', scope: 'the one question and the values', questions: [
      { type: 'choice', q: '4 doors. The knowing host opens 1 goat door; you switch at random to one of the 2 other closed doors. Better or worse than staying?', options: [`Better: ${knowSwitch(4, 1)} against ${stay(4)}`, `Worse: ${Q.of(1, 3)} against ${Q.of(1, 2)}`, 'The same'], answer: 0, traps: { 1: 'mixed up the random-host answer with a two-door picture', 2: 'switching still collects a share of the 3/4 that left your door' }, explain: `(4 − 1)/(4 × 2) = ${knowSwitch(4, 1)} > 1/4.` },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Could the host have shown the car? No → stay 1/n, switch (n − 1)/(n · k). Yes (random, goats seen) → every unopened door 1/(n − m).' },

    S('contrast'),
    { type: 'compare', columns: ['Three doors, goat shown behind door 3', 'P(door 1)', 'P(door 2)'], rows: [
      ['knowing host', stay(3).toString(), knowSwitch(3, 1).toString()],
      ['random host, happened to show a goat', randomHost(3, 1).toString(), randomHost(3, 1).toString()],
      ['door 3 blew open by accident', randomHost(3, 1).toString(), randomHost(3, 1).toString()],
      ['host always opens door 3 if it is a goat, else door 2', Q.of(1, 2).toString(), Q.of(1, 2).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a random host who reveals the car ends the game, which is why "he showed a goat" is information. A host who opens every other door leaves only yours and one more. With 2 doors there is nothing to open and nothing to switch to.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: in bto/card-symmetry, a card you are shown changes the odds while an unseen discard does not; Monty Hall adds a third case, a card shown by someone who chose it. In markets, a quote from a better-informed trader is the knowing host: what he avoids is information.' },
    { type: 'check', scope: 'the contrast table', questions: [
      { type: 'choice', q: 'Three doors, you pick door 1. The host always opens door 3 when it hides a goat (otherwise door 2). He opens door 3. P(win if you switch to door 2)?', options: ['1/2', '2/3', '1/3', '1'], answer: 0, traps: { 1: 'the classic answer assumes he picks at random when both others are goats', 2: 'kept the prior for door 2', 3: 'thought door 3 opening proves door 2 has the car' }, explain: 'Car behind door 1: he opens 3 (weight 1/3). Car behind door 2: he opens 3 (weight 1/3). Equal weights: 1/2.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'monty-hall', section: 'bto', count: 3 },
  ],
};
