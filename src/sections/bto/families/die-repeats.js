// One die, several throws: all different, all the same, no equal neighbours, some repeat.
import { Q } from '../../../core/rational.js';
import { nPr, nCr } from '../../../core/combinatorics.js';
import { mcqItem, agree, qpow, q, sequences, table } from '../lib.js';

const ID = 'die-repeats';
const words = ['', 'one', 'two', 'three', 'four', 'five'];

function build(kind, n, k) {
  const total = k ** n;
  const die = k === 6 ? 'one die' : `a fair ${k}-sided die`;
  const all = n === 2 ? 'both' : `all ${words[n]}`;
  const allDiff = new Q(nPr(k, n), BigInt(total));
  const allSame = q(1, k ** (n - 1));
  const noAdj = qpow(q(k - 1, k), n - 1);
  const repeat = q(1).sub(allDiff);
  const f = (x) => x.toString();
  const chain = Array.from({ length: n }, (_, i) => `${k - i}/${k}`).join(' × ');
  // Allowed faces throw by throw: the picture behind every chained product here.
  const allowed = (perThrow, caption) => table(['Throw', 'Faces allowed', 'Factor'], perThrow.map((a, i) => [i + 1, a, `${a}/${k}`]), caption);
  const freeThen = (x) => Array.from({ length: n }, (_, i) => (i === 0 ? k : x));
  const shrinking = Array.from({ length: n }, (_, i) => k - i);
  if (kind === 'allDiff') return {
    value: allDiff,
    text: n === 2
      ? `You throw ${die} two times. What is the probability that the second throw shows a different face from the first?`
      : `You throw ${die} ${words[n]} times. What is the probability that all ${words[n]} throws show different faces?`,
    distractors: [
      { value: noAdj, misconception: 'Only required each throw to differ from the one just before it. "All different" means every throw must avoid every earlier face.' },
      { value: q(1).sub(allSame), misconception: 'Treated "all different" as the complement of "all the same". Most sequences are neither, for example 3, 3, 5.' },
      { value: new Q(nCr(k, n), BigInt(total)), misconception: `Counted sets of faces (C(${k},${n})) instead of ordered sequences: each set can appear in ${n}! orders.` },
      { value: qpow(q(1, k), n - 1), misconception: 'Computed "all the same" instead of "all different".' },
      { value: qpow(q(k - 1, k), n), misconception: `Applied the factor ${k - 1}/${k} to every throw, including the first, which cannot clash with anything.` },
      { value: 0.5, misconception: 'Treated "different" and "same" as two equally likely outcomes. Count the faces allowed at each throw instead.' },
    ],
    steps: [
      { say: `There are ${k}^${n} = ${total} equally likely ordered sequences.`, why: `Each throw is independent with ${k} equally likely faces.` },
      { say: `Favourable: ${Array.from({ length: n }, (_, i) => k - i).join(' × ')} = ${nPr(k, n)}.`, why: 'Each new throw must avoid every face already used, so the number of allowed faces drops by one per throw.' },
      { say: `P = ${nPr(k, n)}/${total} = ${f(allDiff)} ≈ ${allDiff.toNumber().toFixed(3)}.`, why: 'Favourable over total for equally likely outcomes.' },
    ],
    hints: ['Fix the first throw. How many faces are still allowed for the second?', `Multiply the allowed-face fractions: ${chain}.`, `Product: ${f(allDiff)}.`],
    fast: `One factor per throw, each one face fewer: ${chain} = ${f(allDiff)}.`,
    check: n > 2
      ? `All different is stricter than "no equal neighbours", (${k - 1}/${k})^${n - 1} = ${f(noAdj)}, so the answer must sit below that.`
      : `With two throws, "different" fails only when the second copies the first: 1 − 1/${k} = ${f(allDiff)}.`,
    picture: allowed(shrinking, `Each throw must avoid every face already used, so the allowed faces drop by one per throw. Multiply the factors: ${f(allDiff)}.`),
  };
  if (kind === 'allSame') return {
    value: allSame,
    text: `You throw ${die} ${words[n]} times. What is the probability that ${all} throws show the same face?`,
    distractors: [
      { value: q(1, total), misconception: `Required one specific face (for example all ${k === 6 ? 'sixes' : 'ones'}). Any face works, so multiply 1/${total} by ${k}.` },
      { value: q(1).sub(allDiff), misconception: 'Answered "at least two throws match", a much weaker event than "all match".' },
      { value: q(1).sub(noAdj), misconception: 'Answered "some neighbouring pair matches" instead of "every throw matches".' },
      { value: q(n, k), misconception: `Added 1/${k} for every throw. The first throw only sets the face, and the later matches must all happen together, so multiply.` },
      { value: q(1).sub(allSame), misconception: 'Answered the complement, "not all the same".' },
      { value: 0.5, misconception: 'Treated "same" and "different" as two equally likely outcomes.' },
    ],
    steps: [
      { say: 'The first throw can be anything: it only fixes the target face.', why: 'No face is specified in the question, so the first throw carries no cost.' },
      { say: `Each of the other ${n - 1} throws must match it: probability 1/${k} each.`, why: 'Throws are independent, so the match probabilities multiply.' },
      { say: `P = (1/${k})^${n - 1} = ${f(allSame)}.`, why: `Same as ${k} favourable sequences out of ${total}.` },
    ],
    hints: ['Does the first throw have to be anything in particular?', 'Only the later throws must match the first.', `(1/${k})^${n - 1}.`],
    fast: `The first throw is free; the other ${n - 1} must copy it: (1/${k})^${n - 1} = ${f(allSame)}.`,
    check: `${k} sequences out of ${total} work (one per face), so the answer is ${k}/${total}, ${k} times the chance of one named face.`,
    picture: allowed(freeThen(1), `Throw 1 may be any of the ${k} faces; every later throw has exactly 1 allowed face, the one already shown. Product ${f(allSame)}.`),
  };
  if (kind === 'noAdjacent') return {
    value: noAdj,
    text: `You throw ${die} ${words[n]} times. What is the probability that no two consecutive throws show the same face?`,
    distractors: [
      { value: allDiff, misconception: 'Required all faces to be different. The rule only forbids equal neighbours; 2, 5, 2 is allowed.' },
      { value: qpow(q(k - 1, k), n), misconception: 'Applied the "differ" condition to the first throw too. The first throw has nothing before it.' },
      { value: q(1).sub(allSame), misconception: 'Only excluded sequences where all throws are equal.' },
      { value: q(1).sub(q(n - 1, k)), misconception: `Subtracted 1/${k} for each neighbouring pair as if the "pair i matches" events were disjoint.` },
      { value: qpow(q(1, k), n - 1), misconception: 'Computed the chance that every neighbour matches instead of none.' },
    ],
    steps: [
      { say: 'The first throw is free.', why: 'There is no earlier throw it could equal.' },
      { say: `Each of the next ${n - 1} throws must avoid the face just before it: ${k - 1}/${k} each.`, why: `Given the previous face, exactly ${k - 1} of ${k} faces are allowed, whatever happened earlier.` },
      { say: `P = (${k - 1}/${k})^${n - 1} = ${f(noAdj)} ≈ ${noAdj.toNumber().toFixed(3)}.`, why: 'The conditional factors multiply along the chain.' },
    ],
    hints: ['Each throw only needs to avoid one face. Which one?', 'The first throw is unconstrained.', `(${k - 1}/${k})^${n - 1}.`],
    fast: `First throw free, then ${k - 1}/${k} for each of the ${n - 1} neighbours: ${f(noAdj)}.`,
    check: `Repeats that are not neighbours are allowed, so the answer is above P(all different) = ${f(allDiff)}.`,
    picture: allowed(freeThen(k - 1), `Each throw only has to avoid the previous face, so every throw after the first keeps ${k - 1} of ${k} faces. Product ${f(noAdj)}.`),
  };
  return {
    value: repeat,
    text: `You throw ${die} ${words[n]} times. What is the probability that at least two of the throws show the same face?`,
    distractors: [
      { value: q(1).sub(noAdj), misconception: 'Only looked for matches between neighbouring throws. Throw 1 can match throw 3.' },
      { value: q(n * (n - 1) / 2, k), misconception: `Added 1/${k} for each of the C(${n},2) pairs. Pair matches overlap, so adding double counts.` },
      { value: allSame, misconception: 'Answered "all the same", a much stronger event.' },
      { value: allDiff, misconception: 'Answered the complement, "all different".' },
      { value: q(n - 1, k), misconception: 'Checked each later throw against the first throw only.' },
    ],
    steps: [
      { say: 'Use the complement: at least one repeat = 1 − P(all different).', why: '"At least" events have many cases; the complement has one clean count.' },
      { say: `P(all different) = ${chain} = ${f(allDiff)}.`, why: 'Each throw must avoid all faces already used.' },
      { say: `P = 1 − ${f(allDiff)} = ${f(repeat)} ≈ ${repeat.toNumber().toFixed(3)}.`, why: 'Complement rule.' },
    ],
    hints: ['Counting "at least two match" directly is messy. What is its complement?', 'Complement: all throws different.', `1 − ${f(allDiff)}.`],
    fast: `Complement of all different: 1 − ${chain} = ${f(repeat)}.`,
    check: `This and P(all different) = ${f(allDiff)} must add to exactly 1; an option that does not is the wrong event.`,
    picture: allowed(shrinking, `The complement first: all different, with one face fewer allowed each throw (product ${f(allDiff)}). The answer is everything else, 1 − ${f(allDiff)}.`),
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'One die, repeated throws',
  skill: 'Chain conditional factors (6/6, 5/6, 4/6 …) and pick the right complement',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const kind = difficulty === 1 ? rng.pick(['allDiff', 'allSame']) : rng.pick(['allDiff', 'noAdjacent', 'someRepeat']);
    const k = difficulty === 1 ? 6 : rng.pick([4, 6, 6, 8, 10, 12]);
    const n = difficulty === 1 ? rng.int(2, 3) : rng.int(3, k > 6 ? 4 : 5);
    const b = build(kind, n, k);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      rule: 'Chain the conditionals: P(throw k is allowed | earlier throws), multiply; use 1 − P(all different) for "some repeat".',
      anchor: 'A single throw has 6 equally likely faces; several throws multiply those chances, with the allowed count changing as faces get used.',
      data: { kind, n, k },
    });
  },

  // Independent check: enumerate every one of the k^n sequences.
  verify(item) {
    const { kind, n, k } = item.params;
    let hits = 0, total = 0;
    for (const s of sequences(k, n)) {
      total++;
      const distinct = new Set(s).size;
      const adj = s.some((x, i) => i > 0 && x === s[i - 1]);
      if (kind === 'allDiff' && distinct === n) hits++;
      if (kind === 'allSame' && distinct === 1) hits++;
      if (kind === 'noAdjacent' && !adj) hits++;
      if (kind === 'someRepeat' && distinct < n) hits++;
    }
    return agree(item, hits / total);
  },

  lesson: {
    purpose: 'Many dice questions are about whether throws agree or differ. The fast route is to walk through the throws one at a time and ask how many faces each throw may show.',
    anchor: 'One throw: P(face) = 1/6. Several throws = the same idea with one change: each throw\'s allowed-face count depends on what came before.',
    steps: [
      { say: 'Walk the throws in order and write the allowed fraction for each.', why: 'Independence lets conditional fractions multiply.' },
      { say: 'All different: 6/6 × 5/6 × 4/6 …; all the same: 6/6 × 1/6 × 1/6 …; no equal neighbours: 6/6 × 5/6 × 5/6 …', why: 'The constraint decides how many faces are forbidden at each step: all used faces, all but one, or just the previous face.' },
      { say: 'For "at least two match", take 1 − P(all different).', why: 'The complement is one product instead of many overlapping cases.' },
    ],
    predict: { question: 'Four throws. Which is bigger: P(no equal neighbours) or P(all different)?', answer: 'No equal neighbours: (5/6)^3 ≈ 0.58 against 6·5·4·3/6^4 ≈ 0.28. It forbids one face per throw, not all used faces.' },
    edge: 'Two throws: "all different" and "no equal neighbours" coincide (5/6). They split from three throws on.',
    rule: 'All different: 6·5·4…/6^n. All same: (1/6)^(n−1). No equal neighbours: (5/6)^(n−1). Some repeat: 1 − all different.',
    contrast: '"All the same" is not the complement of "all different": 1, 1, 4 is neither.',
  },
};
