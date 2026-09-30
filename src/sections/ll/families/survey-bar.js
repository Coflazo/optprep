// Grouped survey counts (bar chart): marginal, joint and both directions of a conditional.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'survey-bar';
const CTX = [
  { cats: ['Equities', 'Options', 'FX', 'Rates'], groups: ['Traders', 'Engineers'], title: 'Favourite market', who: 'person', q: 'prefers' },
  { cats: ['Coffee', 'Tea', 'Water', 'Juice'], groups: ['Morning shift', 'Night shift'], title: 'Drink of choice', who: 'worker', q: 'chose' },
  { cats: ['Python', 'C++', 'Java', 'Rust'], groups: ['Interns', 'Seniors'], title: 'Main language', who: 'developer', q: 'uses' },
  { cats: ['Bus', 'Bike', 'Train', 'Walk'], groups: ['City office', 'Suburb office'], title: 'Commute', who: 'employee', q: 'uses' },
];

export default {
  id: ID,
  section: 'll',
  title: 'Survey bar charts',
  skill: 'Separate P(category), P(group and category), P(category | group) and P(group | category): same counts, different denominators',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const c = rng.pick(CTX);
      const counts = c.groups.map(() => c.cats.map(() => rng.int(3, 30)));
      const tot = counts.flat().reduce((a, b) => a + b, 0);
      const g = rng.int(0, 1), k = rng.int(0, 3);
      const gName = c.groups[g], kName = c.cats[k];
      const inG = counts[g].reduce((a, b) => a + b, 0), inK = counts[0][k] + counts[1][k], both = counts[g][k];
      const k2 = (k + rng.int(1, 3)) % 4;
      const pool = [
        { key: 'marg', text: `A randomly chosen ${c.who} ${c.q} ${kName}.`, p: q(inK, tot), how: `${inK} of all ${tot} respondents.` },
        { key: 'joint', text: `A randomly chosen ${c.who} is in ${gName} and ${c.q} ${kName}.`, p: q(both, tot), how: `${both} of all ${tot}: both conditions at once.` },
        { key: 'kGivenG', text: `A randomly chosen member of ${gName} ${c.q} ${kName}.`, p: q(both, inG), how: `${both} of the ${inG} people in ${gName}.` },
        { key: 'gGivenK', text: `A randomly chosen ${c.who} who ${c.q} ${kName} is in ${gName}.`, p: q(both, inK), how: `${both} of the ${inK} people choosing ${kName}.` },
        { key: 'marg2', text: `A randomly chosen ${c.who} ${c.q} ${c.cats[k2]}.`, p: q(counts[0][k2] + counts[1][k2], tot), how: `${counts[0][k2] + counts[1][k2]} of all ${tot}.` },
      ];
      const use = difficulty === 2 ? rng.shuffle([pool[0], pool[1], pool[4]]) : difficulty === 3 ? rng.shuffle([pool[0], pool[1], pool[2]]) : rng.shuffle([pool[1], pool[2], pool[3]]);
      return rankItem(ID, rng, difficulty, {
        text: `The chart shows survey counts by group (${c.groups.join(' and ')}). One respondent is picked at random from the people described in each statement. Rank the statements from most to least likely.`,
        visual: { type: 'bar', title: c.title, xLabel: 'Answer', yLabel: 'People', categories: c.cats, series: c.groups.map((name, i) => ({ name, values: counts[i] })) },
        statements: use,
        intro: [{ say: `Totals: ${tot} people; ${inG} in ${gName}; ${inK} chose ${kName}; ${both} in both.`, why: 'Four numbers answer every statement; only the denominator changes.' }],
        compare: 'Same numerator, different denominators: the smaller the group you pick from, the larger the fraction.',
        rule: 'Joint = both/all; P(k | g) = both/g; P(g | k) = both/k. Joint ≤ each conditional.',
        anchor: 'Counting outcomes in a table, with the one change that each statement picks from a different subgroup.',
        hints: ['Find the four totals: everyone, the group, the answer, and both.', 'Match each statement to its denominator.', 'The joint statement can never beat a conditional with the same numerator.'],
        params: { groups: c.groups, categories: c.cats, counts, statements: use.map((x) => ({ key: x.key, group: g, category: x.key === 'marg2' ? k2 : k })) },
      });
    });
  },

  // Independent check: recount from the rendered bar series.
  verify(item) {
    const vals = item.prompt.visual.series.map((s) => s.values);
    const all = vals.flat().reduce((a, b) => a + b, 0);
    const ps = item.params.statements.map(({ key, group, category }) => {
      const both = vals[group][category], col = vals[0][category] + vals[1][category], row = vals[group].reduce((a, b) => a + b, 0);
      return { marg: col / all, marg2: col / all, joint: both / all, kGivenG: both / row, gGivenK: both / col }[key];
    });
    return agreeRank(item, ps);
  },

  lesson: {
    purpose: 'Survey charts test the difference between joint and conditional probabilities, and between the two directions of a conditional. Traders mix these up under time pressure.',
    anchor: 'Counting outcomes in a table, with the one change that each statement chooses a different population to pick from.',
    steps: [
      { say: 'Compute four totals: everyone, the group, the answer, both.', why: 'Every statement is one of these over another.' },
      { say: 'Joint: both/everyone. Conditional on the group: both/group. Conditional on the answer: both/answer.', why: 'The phrase "a randomly chosen member of ..." names the denominator.' },
      { say: 'Order: with the same numerator, the smallest denominator gives the largest probability.', why: 'Fractions with equal tops.' },
    ],
    predict: { question: '10 of 40 traders prefer Options; 25 people in total prefer Options. Which is larger: P(Options | trader) or P(trader | Options)?', answer: 'P(trader | Options) = 10/25 = 0.4 beats 10/40 = 0.25.' },
    edge: 'If a group is everyone, the conditional equals the marginal.',
    rule: 'Same numerator (both) over everyone / group / answer. Joint is always the smallest of the three.',
    contrast: 'P(answer | group) against P(group | answer): Bayes swaps the denominator.',
  },
};
