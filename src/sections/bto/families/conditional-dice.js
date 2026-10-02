// Conditional probability with two dice (and two children): restrict the sample space, then count.
import { mcqItem, agree, q, pic, table } from '../lib.js';

// The same predicates the verifier reads from params, used here to draw the restricted grid.
const holds = ([k, x], a, b) => ({ atLeastOne: a === x || b === x, both: a === x && b === x, sumParity: (a + b) % 2 === x, bothParity: a % 2 === x && b % 2 === x, different: a !== b, sumIn: Array.isArray(x) && x.includes(a + b), sumAtLeast: a + b >= x, firstParity: a % 2 === x })[k];
function restricted(c) {
  const highlight = [], cellText = [];
  for (let a = 1; a <= 6; a++) {
    cellText.push([]);
    for (let b = 1; b <= 6; b++) {
      const inA = holds(c.params.cond, a, b), inB = holds(c.params.event, a, b);
      if (inA) highlight.push([a - 1, b - 1]);
      cellText[a - 1].push(inA && inB ? '●' : '');
    }
  }
  return pic('grid', { rows: 6, cols: 6, highlight, count: highlight.length, cellText, rowTitle: 'first die', colTitle: 'second die' },
    `Shaded: the ${c.A} outcomes where ${c.cond}, the only ones still possible. Dots: the ${c.AB} of them where ${c.ev}. The answer is dots over shaded, ${c.AB}/${c.A}.`);
}

const ID = 'conditional-dice';
const ways = (s) => (s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7));
const withX = (x, s) => { const y = s - x; return y < 1 || y > 6 ? 0 : y === x ? 1 : 2; }; // ordered pairs with sum s containing x

// Each template returns counts |A|, |A∩B|, |B| over 36 ordered pairs plus the wording.
function template(t, rng) {
  switch (t) {
    case 'bothSix': return { A: 11, AB: 1, B: 1, cond: 'at least one die shows a 6', ev: 'both dice show a 6', params: { cond: ['atLeastOne', 6], event: ['both', 6] }, why: 'Outcomes with a 6: (6,1..6) and (1..5,6): 6 + 5 = 11.' };
    case 'bothEven': return { A: 18, AB: 9, B: 9, cond: 'the sum is even', ev: 'both dice are even', params: { cond: ['sumParity', 0], event: ['bothParity', 0] }, why: 'An even sum means both even (9) or both odd (9).' };
    case 'seven': return { A: 30, AB: 6, B: 6, cond: 'the dice show different numbers', ev: 'the sum is 7', params: { cond: ['different'], event: ['sumIn', [7]] }, why: 'All 6 pairs summing to 7 are non-doubles; 30 outcomes are non-doubles.' };
    case 'xThenSum': {
      const x = rng.int(1, 6);
      const choices = [];
      for (let s = 2; s <= 12; s++) if (withX(x, s)) choices.push(s);
      const s = rng.pick(choices);
      return { A: 11, AB: withX(x, s), B: ways(s), cond: `at least one die shows a ${x}`, ev: `the sum is ${s}`, params: { cond: ['atLeastOne', x], event: ['sumIn', [s]] }, why: `11 outcomes contain a ${x}; of these, the ones summing to ${s} are ${withX(x, s) === 2 ? `(${x},${s - x}) and (${s - x},${x})` : `(${x},${x})`}.` };
    }
    case 'sumThenX': {
      const s = rng.int(3, 11);
      const opts = [1, 2, 3, 4, 5, 6].filter((x) => withX(x, s));
      const x = rng.pick(opts);
      return { A: ways(s), AB: withX(x, s), B: 11, cond: `the sum is ${s}`, ev: `at least one die shows a ${x}`, params: { cond: ['sumIn', [s]], event: ['atLeastOne', x] }, why: `${ways(s)} ordered pairs sum to ${s}; ${withX(x, s)} of them contain a ${x}.` };
    }
    case 'geThenSix': {
      const t = rng.int(7, 11);
      let A = 0; for (let s = t; s <= 12; s++) A += ways(s);
      const AB = 2 * (7 - Math.max(1, t - 6)) - 1;
      return { A, AB, B: 11, cond: `the sum is at least ${t}`, ev: 'at least one die shows a 6', params: { cond: ['sumAtLeast', t], event: ['atLeastOne', 6] }, why: `${A} pairs have sum ≥ ${t}; those with a 6: (6, y) and (y, 6) with y ≥ ${Math.max(1, t - 6)}, counting (6,6) once: ${AB}.` };
    }
    default: { // firstEvenThenGe
      const t = rng.int(6, 11);
      let AB = 0; for (const a of [2, 4, 6]) AB += Math.max(0, 6 - Math.max(1, t - a) + 1);
      let B = 0; for (let s = t; s <= 12; s++) B += ways(s);
      return { A: 18, AB, B, cond: 'the first die is even', ev: `the sum is at least ${t}`, params: { cond: ['firstParity', 0], event: ['sumAtLeast', t] }, why: `First die 2, 4 or 6 (18 outcomes); for each, count second dice reaching ${t}: total ${AB}.` };
    }
  }
}

export default {
  id: ID,
  section: 'bto',
  title: 'Conditional probability with dice',
  skill: 'Given information shrinks the sample space: P(B | A) = |A ∩ B| / |A|',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const kids = difficulty === 2 && rng.chance(0.25);
    if (kids) {
      const older = rng.chance(0.5);
      return mcqItem(ID, rng, difficulty, {
        value: older ? q(1, 2) : q(1, 3),
        text: older
          ? 'A family has two children. You learn that the older child is a boy. What is the probability that both children are boys? (Each child is a boy or girl with probability 1/2, independently.)'
          : 'A family has two children, and at least one of them is a boy. What is the probability that both are boys? (Each child is a boy or girl with probability 1/2, independently.)',
        distractors: [
          { value: older ? q(1, 3) : q(1, 2), misconception: older ? 'Used the "at least one boy" answer; knowing WHICH child is a boy leaves only the younger child uncertain.' : 'Assumed the other child is a boy with probability 1/2. "At least one" does not say which child, so BB, BG, GB remain equally likely.' },
          { value: q(1, 4), misconception: 'Ignored the information: P(two boys) before conditioning.' },
          { value: q(2, 3), misconception: 'Computed P(one boy and one girl | information).' },
          { value: q(3, 4), misconception: 'Computed P(at least one boy).' },
        ],
        steps: [
          { say: 'Sample space (older, younger): BB, BG, GB, GG, each 1/4.', why: 'Order matters because the children are different people.' },
          { say: older ? 'Given the older is a boy: BB, BG remain.' : 'Given at least one boy: BB, BG, GB remain.', why: 'Remove outcomes that contradict the information.' },
          { say: `P(BB | info) = ${older ? '1/2' : '1/3'}.`, why: 'The remaining outcomes stay equally likely.' },
        ],
        rule: 'Condition = delete the outcomes that contradict the information, then renormalise.',
        anchor: 'Counting equally likely outcomes, with one change: the information deletes some outcomes before you count.',
        hints: ['List the four ordered outcomes.', 'Delete the ones the information rules out.', 'Count what is left.'],
        picture: table(['Older', 'Younger', 'Still possible?'], [['boy', 'boy', 'yes'], ['boy', 'girl', 'yes'], ['girl', 'boy', older ? 'no' : 'yes'], ['girl', 'girl', 'no']], `Four equally likely families. The information leaves ${older ? 'two' : 'three'}, and both-boys is one of them: ${older ? '1/2' : '1/3'}.`),
        fast: older ? 'Only the younger child is unknown: 1/2.' : 'BB is one of the three families with a boy: 1/3.',
        check: older ? 'Knowing which child is a boy tells you nothing about the other child, so the answer is the plain 1/2.' : '"At least one boy" does not name a child, so the answer must differ from the 1/2 of "the older is a boy".',
        params: { kids: true, older },
      });
    }
    const t = difficulty === 2 ? rng.pick(['bothSix', 'bothEven', 'seven']) : rng.pick(['xThenSum', 'sumThenX', 'geThenSix', 'firstEvenThenGe']);
    const c = template(t, rng);
    const v = q(c.AB, c.A);
    return mcqItem(ID, rng, difficulty, {
      value: v,
      text: `You throw two fair dice. Given that ${c.cond}, what is the probability that ${c.ev}?`,
      distractors: [
        { value: q(c.B, 36), misconception: 'Ignored the condition and answered the unconditional probability.' },
        { value: q(c.AB, 36), misconception: `Computed P(${c.cond} AND ${c.ev}) and forgot to divide by P(condition).` },
        { value: q(c.AB, c.B), misconception: 'Reversed the conditional: this is P(condition | event).' },
        ...(t === 'bothSix' ? [{ value: q(1, 6), misconception: 'Assumed "the other die" is a six with probability 1/6. "At least one six" does not say which die, so there is no single "other die".' }] : []),
        { value: q(c.A - c.AB, c.A), misconception: 'Answered the complement within the condition.' },
      ],
      steps: [
        { say: `Restrict to outcomes where ${c.cond}: ${c.A} of 36.`, why: c.why },
        { say: `Among them, ${c.ev}: ${c.AB}.`, why: 'Count inside the restricted space only.' },
        { say: `P = ${c.AB}/${c.A} = ${v} ≈ ${v.toNumber().toFixed(3)}.`, why: 'Equally likely outcomes remain equally likely after conditioning.' },
      ],
      rule: 'P(B | A) = |A ∩ B| / |A| for equally likely outcomes.',
      anchor: 'Favourable over total, with one change: the total is only the outcomes consistent with what you were told.',
      hints: ['Which of the 36 outcomes are still possible?', 'Count the event inside that smaller set.', `${c.AB} of ${c.A}.`],
      picture: restricted(c),
      fast: `Count inside the condition only: ${c.AB} of ${c.A} = ${v}.`,
      check: `Dividing by 36 instead of ${c.A} gives the unconditional ${q(c.AB, 36)}; the condition removes ${36 - c.A} outcomes, so the answer must be at least that.`,
      params: { dice: 2, sides: 6, ...c.params },
    });
  },

  // Independent check: enumerate outcomes and evaluate the condition and event from params.
  verify(item) {
    const d = item.params;
    if (d.kids) {
      let a = 0, ab = 0;
      for (const older of 'BG') for (const younger of 'BG') {
        const cond = d.older ? older === 'B' : older === 'B' || younger === 'B';
        if (!cond) continue;
        a++; if (older === 'B' && younger === 'B') ab++;
      }
      return agree(item, ab / a);
    }
    const test = ([k, x], a, b) => {
      switch (k) {
        case 'atLeastOne': return a === x || b === x;
        case 'both': return a === x && b === x;
        case 'sumParity': return (a + b) % 2 === x;
        case 'bothParity': return a % 2 === x && b % 2 === x;
        case 'different': return a !== b;
        case 'sumIn': return x.includes(a + b);
        case 'sumAtLeast': return a + b >= x;
        case 'firstParity': return a % 2 === x;
        default: throw new Error(k);
      }
    };
    let A = 0, AB = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (test(d.cond, a, b)) { A++; if (test(d.event, a, b)) AB++; }
    return agree(item, AB / A);
  },

  lesson: {
    purpose: '"Given that ..." questions test whether you shrink the sample space correctly. The classic trap is to reason about "the other die" when the information does not say which die.',
    anchor: 'Favourable over total, with one change: the information deletes outcomes first, so the total is smaller.',
    steps: [
      { say: 'List (or count) the outcomes consistent with the information.', why: 'Conditioning removes everything that contradicts what you were told.' },
      { say: 'Count the event inside that set.', why: 'Outcomes stay equally likely after the deletion.' },
      { say: 'Divide.', why: 'P(B | A) = |A ∩ B| / |A|.' },
    ],
    predict: { question: 'Two dice, at least one is a 6. Is P(both are 6) 1/6 or 1/11?', answer: '1/11: 11 outcomes contain a 6 and only (6,6) has two.' },
    edge: 'If the information names the die ("the first die is a 6"), the answer returns to 1/6.',
    rule: 'Restrict, then count: P(B | A) = |A∩B|/|A|. "At least one" ≠ "this one".',
    contrast: '"At least one child is a boy" (1/3) against "the older child is a boy" (1/2).',
  },
};
