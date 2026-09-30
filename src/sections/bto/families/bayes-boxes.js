// Bayes with physical objects: coins (one double-headed), two boxes of balls, two-sided cards.
import { mcqItem, agree, q, qpow } from '../lib.js';

const ID = 'bayes-boxes';

export default {
  id: ID,
  section: 'bto',
  title: 'Bayes: coins, boxes and cards',
  skill: 'Weigh each hypothesis by prior × likelihood; count equally likely "atoms" (faces, balls) not objects',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const kind = difficulty === 2 ? rng.pick(['boxes', 'cards']) : rng.pick(['coins', 'boxes', 'coins']);
    if (kind === 'coins') {
      const m = rng.int(4, 12), k = rng.int(2, 4);
      const lik = qpow(q(1, 2), k);
      const v = q(1).div(q(1).add(q(m - 1).mul(lik)));
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `A bag holds ${m} coins: one is double-headed, the other ${m - 1} are fair. You pick one at random and flip it ${k} times. It shows heads every time. What is the probability that you picked the double-headed coin?`,
        distractors: [
          { value: q(1, m), misconception: 'Ignored the evidence and kept the prior 1/m.' },
          { value: q(1).sub(lik), misconception: `Treated "a fair coin rarely does this" (1 − 1/2^${k}) as the answer, ignoring that fair coins are ${m - 1} times as common.` },
          { value: q(1).div(q(1).add(q(m - 1).mul(qpow(q(1, 2), k - 1)))), misconception: `Off by one in the likelihood: used ${k - 1} heads instead of ${k}.` },
          { value: q(1).div(q(1).add(q(m).mul(lik))), misconception: `Counted ${m} fair coins instead of ${m - 1}.` },
          { value: q(1, m).div(q(1, m).add(lik)), misconception: 'Forgot to weight the fair-coin likelihood by the fair coins\' prior (m − 1)/m.' },
        ],
        steps: [
          { say: `Prior odds double-headed : fair = 1 : ${m - 1}.`, why: `One coin of ${m} is double-headed.` },
          { say: `Likelihood of ${k} heads: 1 for the double-headed coin, 1/2^${k} = 1/${2 ** k} for a fair coin.`, why: 'Independent flips of a fair coin.' },
          { say: `Posterior odds = 1 : ${m - 1}/${2 ** k}, so P = 1/(1 + ${m - 1}/${2 ** k}) = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Posterior odds = prior odds × likelihood ratio.' },
        ],
        rule: 'Posterior odds = prior odds × likelihood ratio. Double-headed vs m − 1 fair after k heads: 1 : (m − 1)/2^k.',
        anchor: 'Bayes for a test result, with one change: the "test" is the flips, and its hit rates are 1 and 1/2^k.',
        hints: ['Start from prior odds: how many fair coins per double-headed coin?', `How likely is ${k} heads under each coin?`, `Odds 1 : ${m - 1}/${2 ** k}.`],
        data: { kind, m, k },
      });
    }
    if (kind === 'boxes') {
      let a, b, c, d;
      do { a = rng.int(1, 8); b = rng.int(1, 8); c = rng.int(1, 8); d = rng.int(1, 8); } while (a + b === c + d || a * (c + d) === c * (a + b));
      const la = q(a, a + b), lb = q(c, c + d);
      const v = la.div(la.add(lb));
      return mcqItem(ID, rng, difficulty, {
        value: v,
        text: `Box A holds ${a} red and ${b} blue balls; box B holds ${c} red and ${d} blue. You pick a box at random (each with probability 1/2) and draw one ball. It is red. What is the probability that you picked box A?`,
        distractors: [
          { value: 0.5, misconception: 'Kept the prior 1/2 and ignored that the boxes produce red at different rates.' },
          { value: q(a, a + c), misconception: 'Pooled all red balls as equally likely. A red ball in the smaller box is more likely to be drawn, since each box is chosen with 1/2 regardless of size.' },
          { value: la, misconception: 'Answered P(red | box A), the likelihood, instead of P(box A | red).' },
          { value: la.mul(q(1, 2)), misconception: 'Computed P(box A and red) without dividing by P(red).' },
          { value: q(1).sub(v), misconception: 'Answered P(box B | red).' },
        ],
        steps: [
          { say: `P(red | A) = ${la}, P(red | B) = ${lb}.`, why: 'Each box has its own red fraction.' },
          { say: 'With equal priors the 1/2 cancels: P(A | red) = P(red | A)/(P(red | A) + P(red | B)).', why: 'Bayes with a uniform prior is a ratio of likelihoods.' },
          { say: `P = ${la}/(${la} + ${lb}) = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Substitute.' },
        ],
        rule: 'Equal priors → posterior ∝ likelihood. Never pool balls across boxes of different sizes.',
        anchor: 'Bayes for a test result, with the change that the "test" is which colour came out and each box has its own hit rate.',
        hints: ['How likely is red from each box?', 'The equal 1/2 priors cancel.', `Ratio ${la} : ${lb}.`],
        data: { kind, a, b, c, d },
      });
    }
    // Two-sided cards: rr double red, mx mixed, bb double black; you see a red face.
    const rr = rng.int(1, 3), mx = rng.int(1, 3), bb = rng.int(0, 2);
    const v = q(2 * rr, 2 * rr + mx);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `A hat holds ${rr + mx + bb} cards: ${rr} red on both sides, ${mx} red on one side and black on the other${bb ? `, and ${bb} black on both sides` : ''}. You draw a card at random and look at one random side: it is red. What is the probability that the other side is also red?`,
      distractors: [
        { value: q(rr, rr + mx), misconception: 'Counted cards that have a red side as equally likely. A double-red card shows red twice as often as a mixed card.' },
        { value: 0.5, misconception: 'Reasoned "it is one of two card types, so 1/2". The red face you saw is more likely to belong to a double-red card.' },
        { value: q(rr, rr + mx + bb), misconception: 'Answered the prior chance of drawing a double-red card.' },
        { value: q(mx, 2 * rr + mx), misconception: 'Answered the chance the other side is black.' },
      ],
      steps: [
        { say: `Count red faces: ${2 * rr} on double-red cards, ${mx} on mixed cards.`, why: 'Every face is equally likely to be the one you see, so faces are the equally likely atoms.' },
        { say: `The seen face is one of these ${2 * rr + mx}; its reverse is red for the ${2 * rr} on double-red cards.`, why: 'Condition on "a red face is showing".' },
        { say: `P = ${2 * rr}/${2 * rr + mx} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Favourable faces over red faces.' },
      ],
      rule: 'Condition on what you saw: count the equally likely red faces, not the cards.',
      anchor: 'The classic three-card puzzle (answer 2/3) with one change: different numbers of each card type.',
      hints: ['Which things are equally likely to be seen: cards, or faces?', 'Count red faces on each card type.', `${2 * rr} of ${2 * rr + mx} red faces have a red back.`],
      data: { kind: 'cards', rr, mx, bb },
    });
  },

  // Independent check: enumerate equally likely atoms (coin x flip sequence, box x ball, card x side).
  verify(item) {
    const d = item.params;
    if (d.kind === 'coins') {
      // Atoms: (coin, flip sequence), all equally likely. The double-headed coin (coin 0) shows
      // all heads on every atom; a fair coin only on the all-heads sequence (s = 0).
      let dh = 0, fair = 0;
      for (let coin = 0; coin < d.m; coin++) for (let s = 0; s < 2 ** d.k; s++) {
        if (coin === 0) dh++; else if (s === 0) fair++;
      }
      return agree(item, dh / (dh + fair), 1e-12);
    }
    if (d.kind === 'boxes') {
      // Atoms: (box, ball) with weight 1/2 * 1/size.
      let A = 0, tot = 0;
      for (let i = 0; i < d.a + d.b; i++) if (i < d.a) { A += 0.5 / (d.a + d.b); tot += 0.5 / (d.a + d.b); }
      for (let i = 0; i < d.c + d.d; i++) if (i < d.c) tot += 0.5 / (d.c + d.d);
      return agree(item, A / tot, 1e-12);
    }
    const faces = [];
    for (let i = 0; i < d.rr; i++) faces.push(['r', 'r'], ['r', 'r']);
    for (let i = 0; i < d.mx; i++) faces.push(['r', 'b'], ['b', 'r']);
    for (let i = 0; i < d.bb; i++) faces.push(['b', 'b'], ['b', 'b']);
    const seenRed = faces.filter((f) => f[0] === 'r');
    return agree(item, seenRed.filter((f) => f[1] === 'r').length / seenRed.length, 1e-12);
  },

  lesson: {
    purpose: 'When evidence arrives (heads again, a red ball, a red face), you must update which hypothesis you are in. The mistake is always to count objects instead of the equally likely things you could have observed.',
    anchor: 'Bayes for a medical test, with one change: the hypotheses are physical objects (coins, boxes, cards) and the likelihoods come from counting.',
    steps: [
      { say: 'List hypotheses with priors (which coin, which box, which card).', why: 'Before evidence, these are the only uncertain facts.' },
      { say: 'For each, compute the likelihood of what you saw.', why: 'A double-headed coin always shows heads; a box with more reds shows red more often.' },
      { say: 'Posterior ∝ prior × likelihood; normalise.', why: 'Only the ratios matter, so equal priors cancel.' },
    ],
    predict: { question: 'Three cards: RR, RB, BB. You see red. Is the back red with probability 1/2 or 2/3?', answer: '2/3. Of the three red faces you could be looking at, two have a red back.' },
    edge: 'If the evidence is impossible under a hypothesis (black face and the RR card), that hypothesis drops to 0.',
    rule: 'Posterior odds = prior odds × likelihood ratio. Count faces, balls, sequences: the things that are equally likely to be seen.',
    contrast: 'Counting cards (1/2) against counting faces (2/3); pooling balls across boxes against weighting each box by its own chance.',
  },
};
