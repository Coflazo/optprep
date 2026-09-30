// Monty Hall with n doors: a knowing host versus a host who opens doors at random.
import { mcqItem, agree, q } from '../lib.js';

const ID = 'monty-hall';

export default {
  id: ID,
  section: 'bto',
  title: 'Monty Hall and the host\'s knowledge',
  skill: 'A host who knowingly avoids the car moves probability onto the other doors; a random host does not',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const n = difficulty === 2 ? 3 : rng.int(4, 7);
    const m = difficulty === 2 ? 1 : rng.int(1, n - 2);
    const variant = difficulty === 2 ? rng.pick(['switch', 'switch', 'stay']) : rng.pick(['switch', 'switch', 'random']);
    const closedOthers = n - m - 1;
    let value, text, steps;
    const setup = `There are ${n} doors: one hides a car, the rest hide goats. You pick door 1.`;
    if (variant === 'random') {
      value = q(1, n - m);
      text = `${setup} The host, who does NOT know where the car is, opens ${m === 1 ? 'one of the other doors' : `${m} of the other doors`} at random, and ${m === 1 ? 'it shows a goat' : 'they all show goats'}. You switch to one particular unopened door other than yours. What is the probability that you win the car?`;
      steps = [
        { say: 'The host\'s choice did not depend on the car, so seeing goats is just information that those doors are empty.', why: 'A random reveal is like the doors being opened by chance.' },
        { say: `Given that, the car is equally likely behind any of the ${n - m} unopened doors.`, why: 'By symmetry, nothing distinguishes your door from the other closed doors.' },
        { say: `P = 1/${n - m}${n - m === 2 ? ' = 1/2' : ''}.`, why: 'Uniform over the unopened doors.' },
      ];
    } else if (variant === 'stay') {
      value = q(1, n);
      text = `${setup} The host, who knows where the car is, opens ${m === 1 ? 'another door' : `${m} other doors`} showing ${m === 1 ? 'a goat' : 'goats'} and offers a switch. You stay. What is the probability that you win the car?`;
      steps = [
        { say: `Your door had probability 1/${n} when you picked it.`, why: 'The car is placed uniformly.' },
        { say: 'The host can always show a goat, whatever is behind your door, so his action carries no information about your door.', why: 'An event that happens with certainty under every hypothesis cannot shift their probabilities.' },
        { say: `P(stay wins) = 1/${n}.`, why: 'Unchanged prior.' },
      ];
    } else {
      value = q(n - 1, n * closedOthers);
      text = `${setup} The host, who knows where the car is, opens ${m === 1 ? 'another door' : `${m} other doors`} showing ${m === 1 ? 'a goat' : 'goats'}. You switch to ${closedOthers === 1 ? 'the remaining closed door' : 'one of the other closed doors, chosen at random'}. What is the probability that you win the car?`;
      steps = [
        { say: `P(car behind your door) stays 1/${n}.`, why: 'The host can always open goat doors, so his action says nothing about your door.' },
        { say: `The remaining ${n - 1}/${n} is spread evenly over the ${closedOthers} other closed door${closedOthers > 1 ? 's' : ''}.`, why: 'The host never opens the car, so the opened doors have probability 0 and the other closed doors are symmetric.' },
        { say: `P = (${n - 1}/${n}) / ${closedOthers} = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Your share is one of those doors.' },
      ];
    }
    const distractors = [
      { value: q(1, n - m), misconception: 'Treated all unopened doors as equally likely. A host who knowingly avoids the car does not reset the odds.' },
      { value: q(1, n), misconception: 'Assumed switching cannot beat the original 1/n: that is the staying probability.' },
      { value: q(n - 1, n), misconception: 'Gave the switch all of the other doors\' probability. With several closed doors left, you move to only one of them.' },
      { value: 0.5, misconception: 'Reasoned "two outcomes, car or goat, so 1/2".' },
      { value: q(1 + m, n), misconception: 'Moved only the opened doors\' probability onto the door you switch to. It is shared by all the other closed doors.' },
    ];
    distractors.push(variant === 'stay'
      ? { value: 0, misconception: 'Believed staying can never win. It wins whenever your first pick was the car: 1/n of the time.' }
      : { value: 1, misconception: 'Believed switching always wins. It wins only when your first pick was a goat, and then only if you land on the car.' });
    if (variant === 'random') distractors.unshift({ value: q(n - 1, n * closedOthers), misconception: 'Used the knowing-host answer. A host who opens doors at random, and happens to show goats, does not move probability onto the other doors.' });
    return mcqItem(ID, rng, difficulty, {
      value, text, distractors, steps,
      rule: 'Knowing host: your door keeps 1/n; the other closed doors share (n−1)/n. Random host who happens to show goats: all unopened doors are equal.',
      anchor: 'Conditioning on new information (the opened doors), with one change: what the information means depends on whether the host could have revealed the car.',
      hints: ['Could the host have shown the car? What does his choice tell you about your own door?', 'Your door\'s probability does not move with a knowing host.', 'Split the rest over the other closed doors.'],
      data: { n, m, variant },
    });
  },

  // Independent check: enumerate car position, the host's allowed door sets, and your switch choice.
  verify(item) {
    const { n, m, variant } = item.params;
    const others = [...Array(n - 1).keys()].map((i) => i + 1); // door 0 is yours
    const subsets = (arr, k) => (k === 0 ? [[]] : arr.flatMap((x, i) => subsets(arr.slice(i + 1), k - 1).map((s) => [x, ...s])));
    const opens = subsets(others, m);
    let win = 0, tot = 0;
    for (let car = 0; car < n; car++) {
      const allowed = variant === 'random' ? opens : opens.filter((s) => !s.includes(car));
      for (const s of allowed) {
        const w = 1 / n / allowed.length;
        if (variant === 'random' && s.includes(car)) continue; // condition: all revealed doors show goats
        if (variant === 'stay') { tot += w; if (car === 0) win += w; continue; }
        const closed = others.filter((d) => !s.includes(d));
        for (const d of closed) { tot += w / closed.length; if (d === car) win += w / closed.length; }
      }
    }
    return agree(item, win / tot, 1e-12);
  },

  lesson: {
    purpose: 'Monty Hall tests whether you can tell informative evidence from uninformative evidence. The same "goat revealed" means different things depending on how it was chosen.',
    anchor: 'Bayes updating with one change: the likelihood of the evidence depends on the host\'s rule, not only on where the car is.',
    steps: [
      { say: 'Ask: could the host\'s action have come out differently depending on where the car is?', why: 'Evidence that is certain under every hypothesis carries no information.' },
      { say: 'Knowing host: your door keeps 1/n; the opened doors drop to 0; the rest share (n − 1)/n.', why: 'He always can show goats, so your door is untouched; he never shows the car, so it concentrates elsewhere.' },
      { say: 'Random host who happens to show goats: every unopened door is equally likely.', why: 'His choice ignored the car, so the reveal is plain elimination.' },
    ],
    predict: { question: '100 doors, knowing host opens 98 goats. Switch: roughly what chance?', answer: '99/100. Your door kept 1/100 and the one other closed door collected the rest.' },
    edge: 'With a random host, a reveal of the car ends the game; conditioning on "all goats" is what makes the doors symmetric.',
    rule: 'Knowing host: switch = (n−1)/(n·k) for k other closed doors. Random host: 1/(number of unopened doors).',
    contrast: 'Same reveal, different rule: knowing host → switch wins 2/3 (3 doors); random host → 1/2.',
  },
};
