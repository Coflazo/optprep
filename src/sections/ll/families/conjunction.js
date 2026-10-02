// Two-way table: single events, conjunctions, unions and conditionals. Linda-style subset logic.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'conjunction';
const CTX = [
  { a: 'plays chess', A: 'Plays chess', b: 'is a trader', B: 'Trader', pop: 'conference attendees', who: 'attendee' },
  { a: 'owns a car', A: 'Owns a car', b: 'lives in the city', B: 'City', pop: 'survey respondents', who: 'respondent' },
  { a: 'studied maths', A: 'Studied maths', b: 'codes daily', B: 'Codes daily', pop: 'new hires', who: 'new hire' },
  { a: 'reads the news daily', A: 'Reads news daily', b: 'holds stocks', B: 'Holds stocks', pop: 'students', who: 'student' },
];

export default {
  id: ID,
  section: 'll',
  title: 'Two-way tables and subset logic',
  skill: 'A AND B ≤ A ≤ A OR B, always; a conditional P(B | A) can be larger than all of them',
  levels: [1, 2, 3],

  generate(rng, { difficulty = 1 } = {}) {
    return retry(() => {
      const c = rng.pick(CTX);
      const ab = rng.int(4, 40), aNb = rng.int(4, 40), Nab = rng.int(4, 40), NaNb = rng.int(4, 40);
      const tot = ab + aNb + Nab + NaNb, A = ab + aNb, B = ab + Nab;
      const pool = {
        A: { text: `A randomly chosen ${c.who} ${c.a}.`, p: q(A, tot), how: `Row total ${A} of ${tot}.` },
        B: { text: `A randomly chosen ${c.who} ${c.b}.`, p: q(B, tot), how: `Column total ${B} of ${tot}.` },
        AB: { text: `A randomly chosen ${c.who} ${c.a} and ${c.b}.`, p: q(ab, tot), how: `One cell: ${ab} of ${tot}. It is inside both single events.` },
        AorB: { text: `A randomly chosen ${c.who} ${c.a} or ${c.b} (or both).`, p: q(tot - NaNb, tot), how: `Everyone except the ${NaNb} in neither: ${tot - NaNb} of ${tot}.` },
        BgA: { text: `A randomly chosen ${c.who} who ${c.a} also ${c.b}.`, p: q(ab, A), how: `${ab} of the ${A} who ${c.a}.` },
        neither: { text: `A randomly chosen ${c.who} neither ${c.a} nor ${c.b}.`, p: q(NaNb, tot), how: `The "neither" cell: ${NaNb} of ${tot}.` },
      };
      const keys = difficulty === 1 ? rng.shuffle(['A', 'AB', 'AorB']) : difficulty === 2 ? rng.shuffle(['B', 'AB', 'BgA', 'A']).slice(0, 3) : rng.shuffle(['AB', 'BgA', 'AorB', 'neither', 'B']).slice(0, 3);
      return rankItem(ID, rng, difficulty, {
        text: `The table counts ${tot} ${c.pop} by two traits. One ${c.who} is picked at random (from a subgroup where stated). Rank the statements from most to least likely.`,
        visual: { type: 'table', caption: `${tot} ${c.pop}`, columns: ['', c.B, `Not: ${c.B.toLowerCase()}`], rows: [[c.A, ab, aNb], [`Not: ${c.A.toLowerCase()}`, Nab, NaNb]] },
        statements: keys.map((k) => pool[k]),
        intro: [{ say: 'Before counting, use containment: "A and B" sits inside A, which sits inside "A or B".', why: 'Subset logic orders these statements for free; only the conditional needs a count.' }],
        compare: 'Subset logic plus one or two quick fractions settle the order.',
        picture: {
          diagram: 'venn',
          spec: { sets: [c.A, c.B], regions: { A: aNb, B: Nab, AB: ab, none: NaNb }, total: tot },
          caption: `The table's four cells as regions: ${ab} in both, ${aNb} only "${c.A.toLowerCase()}", ${Nab} only "${c.B.toLowerCase()}", ${NaNb} in neither. "And" is the overlap, inside each circle; "or" is everything inside either circle; a conditional keeps only one circle as its whole.`,
        },
        fast: `Order by containment first: "and" ≤ each single trait ≤ "or", no arithmetic needed. Count only what containment cannot place: ${keys.includes('BgA') ? `the conditional, ${ab} of the ${A} in its row` : keys.includes('neither') ? `"neither", ${NaNb} of ${tot}` : 'nothing here'}.`,
        check: `An "and" statement can never rank above either of its parts, and an "or" statement can never rank below them. ${keys.includes('BgA') ? `The conditional is the only one with a smaller whole (${A}, not ${tot}), so it can beat the single traits.` : 'An order that breaks containment is wrong before any counting.'}`,
        rule: 'AND ≤ single ≤ OR. P(B | A) = cell / row total, which can exceed P(B).',
        anchor: 'Counting outcomes, with the table\'s four cells as the building blocks of every event.',
        hints: ['Which statements are contained in which?', 'Only a conditional or a cross-comparison needs arithmetic.', 'Conditional = cell / row total.'],
        params: { cells: [[ab, aNb], [Nab, NaNb]], statements: keys },
      });
    });
  },

  // Independent check: recount from the rendered table cells.
  verify(item) {
    const [[, ab, aNb], [, Nab, NaNb]] = item.prompt.visual.rows;
    const tot = ab + aNb + Nab + NaNb;
    const val = { A: (ab + aNb) / tot, B: (ab + Nab) / tot, AB: ab / tot, AorB: (ab + aNb + Nab) / tot, BgA: ab / (ab + aNb), neither: NaNb / tot };
    return agreeRank(item, item.params.statements.map((k) => val[k]));
  },

  lesson: {
    purpose: 'The conjunction fallacy (the Linda problem) is the most common reasoning error in ranking tasks: a detailed, plausible story feels more likely than a plain one it is part of.',
    anchor: 'Subset logic from sets: if every outcome in E is also in F, then P(E) ≤ P(F).',
    steps: [
      { say: 'Identify containments: A∩B ⊂ A ⊂ A∪B.', why: 'An extra condition can only remove outcomes.' },
      { say: 'Order contained events without arithmetic.', why: 'Containment decides it outright.' },
      { say: 'Compute only the statements containment cannot place (a conditional, or two unrelated events).', why: 'Conditionals change the denominator and can be large.' },
    ],
    predict: { question: 'Which is more likely: "Sam is a trader" or "Sam is a trader who plays chess"?', answer: '"Sam is a trader". Adding "plays chess" can only remove possibilities.' },
    edge: 'If everyone with A also has B, then P(A and B) = P(A): equality, never reversal.',
    rule: 'AND ≤ each part ≤ OR. Conditional = cell / row.',
    contrast: 'P(A and B) (a cell over everyone) against P(B | A) (a cell over its row).',
  },
};
