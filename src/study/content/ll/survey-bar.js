// Likelihood List family: grouped survey bar charts. Four totals (everyone, group, answer, both)
// answer every statement; the joint, the two conditionals and the marginal differ only in their
// denominators. With a shared numerator the smallest denominator wins. Every number is computed here.
import { S, dp, mc, rank, again } from './compare-without-computing.js';

const CATS = ['Equities', 'Options', 'FX', 'Rates'];
const GROUPS = ['Traders', 'Engineers'];
const CNT = [[16, 24, 8, 6], [20, 7, 12, 17]];
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const TOT = sum(CNT.flat()), G = CNT.map(sum), K = CATS.map((_, k) => CNT[0][k] + CNT[1][k]);
const g0 = 0, k0 = 1, BOTH = CNT[g0][k0];
const P = { marg: K[k0] / TOT, joint: BOTH / TOT, kg: BOTH / G[g0], gk: BOTH / K[k0] };

// Fresh survey for the checks.
const survey = (rng) => { const c = GROUPS.map(() => CATS.map(() => rng.int(3, 30))); const tot = sum(c.flat()); const g = rng.int(0, 1), k = rng.int(0, 3); return { c, tot, g, k, gName: GROUPS[g], kName: CATS[k], inG: sum(c[g]), inK: c[0][k] + c[1][k], both: c[g][k] }; };
const sayS = (s) => `A survey: ${GROUPS.map((n, i) => `${n} ${CATS.map((c, j) => `${c} ${s.c[i][j]}`).join(', ')}`).join('; ')}.`;

export default {
  id: 'll/survey-bar',
  book: 'll',
  kind: 'family',
  family: 'survey-bar',
  title: 'Survey bar charts',
  summary: 'Four totals answer everything: joint = both/all, P(answer | group) = both/group, P(group | answer) = both/answer.',
  prerequisites: ['ll/conjunction', 'prob/conditional-bayes'],
  objectives: [
    'Read the four totals (everyone, group, answer, both) off a grouped bar chart',
    'Match each statement to its denominator from its wording',
    'Order statements with the same numerator by their denominators, without dividing',
    'Tell P(answer | group) from P(group | answer) and say which is larger from the totals',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: `Before any teaching: a survey asks ${TOT} people their favourite market. ${GROUPS[0]}: ${CATS.map((c, j) => `${c} ${CNT[0][j]}`).join(', ')}. ${GROUPS[1]}: ${CATS.map((c, j) => `${c} ${CNT[1][j]}`).join(', ')}. Rank: (a) a random respondent prefers Options, (b) a random trader prefers Options, (c) a random respondent who prefers Options is a trader. Two approaches, then an order.`, answer: `(c) ${BOTH}/${K[k0]} > (b) ${BOTH}/${G[g0]} > (a) ${K[k0]}/${TOT}`, explain: `(b) and (c) share the numerator ${BOTH} (traders who prefer Options); (c) divides by the ${K[k0]} Options fans, (b) by the ${G[g0]} traders, so (c) wins without dividing. (a) is ${dp(P.marg, 2)}. If you thought (b) and (c) were the same, you swapped the two directions of a conditional.` },
    { type: 'text', text: 'The prompt is a **grouped bar chart** of survey counts: one bar per answer (Equities, Options, ...) for each group (Traders, Engineers). One person is picked at random from the people the statement describes. The statements look alike and differ only in who is picked: everyone, one group, or everyone who gave one answer.' },
    { type: 'list', items: ['"A randomly chosen respondent prefers Options." (everyone)', '"A randomly chosen respondent is a trader and prefers Options." (everyone, both conditions)', '"A randomly chosen trader prefers Options." (the trader group)', '"A randomly chosen respondent who prefers Options is a trader." (the Options answer)'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc(null, '"A randomly chosen engineer prefers FX." Who is the pick made from?', 'the engineers', [['everyone surveyed', 'that would be "a randomly chosen respondent"'], ['everyone who prefers FX', 'that is the other direction: "a respondent who prefers FX is an engineer"'], ['engineers who prefer FX', 'that is the numerator, not the group picked from']], '"A randomly chosen engineer" picks from the engineer group.', { at: 0 }),
    ] },

    S('why'),
    { type: 'text', text: 'Survey charts test the difference between a joint probability and a conditional one, and between the two directions of a conditional, P(answer | group) against P(group | answer). Traders confuse these under time pressure; so does most of the public, which is why the item exists. The chart is just a 2 × 2 table (group or not, answer or not) drawn as bars, so the whole family reduces to choosing the right denominator.' },

    S('anchor'),
    { type: 'text', text: 'You know the 2 × 2 table: a conditional keeps the lens cell and divides by its row or column total. A survey chart is that table with **one change**: the rows are groups and the columns are answers, so "both" is a single bar and each total is a sum of bars. Nothing new is computed; only the bookkeeping changes, from reading cells to adding bars.' },
    { type: 'check', scope: 'a bar is a cell, a total is a sum of bars', questions: [
      { make: (rng) => { const s = survey(rng); return { type: 'number', q: `${sayS(s)} How many ${s.gName.toLowerCase()} were surveyed?`, answer: s.inG, hints: [`Add the four ${s.gName} bars.`], explain: `${s.c[s.g].join(' + ')} = ${s.inG}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'The chart as it appears in the item. Each bar is one cell of the table: a group and an answer together.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Favourite market', xLabel: 'answer', yLabel: 'people', categories: CATS, series: GROUPS.map((name, i) => ({ name, values: CNT[i] })) }, caption: `The ${GROUPS[0]} bar above Options is ${BOTH}: traders who prefer Options. Every statement about "traders" and "Options" uses that ${BOTH} on top.` },
    { type: 'check', scope: 'reading one bar', questions: [
      { make: (rng) => { const g = rng.int(0, 1), k = rng.int(0, 3); return { type: 'number', q: `From the chart: how many ${GROUPS[g].toLowerCase()} chose ${CATS[k]}?`, answer: CNT[g][k], explain: `The ${GROUPS[g]} bar above ${CATS[k]}: ${CNT[g][k]}.` }; } },
    ] },
    { type: 'text', text: 'Turn the bars into a table with totals. The margins are the denominators: the right column holds each group, the bottom row each answer, the corner everyone.' },
    { type: 'diagram', diagram: 'table', spec: { caption: 'The chart as a table', columns: ['', ...CATS, 'Total'], rows: [...GROUPS.map((g, i) => [g, ...CNT[i], G[i]]), ['Total', ...K, TOT]] }, caption: `Four numbers answer every statement about traders and Options: everyone ${TOT}, traders ${G[g0]}, Options ${K[k0]}, both ${BOTH}.` },
    { type: 'check', scope: 'the four totals', questions: [
      mc(null, `"A randomly chosen respondent who prefers Options is a trader." Which fraction?`, `${BOTH}/${K[k0]}`, [[`${BOTH}/${G[g0]}`, 'divided by the traders: that is P(Options | trader), the other direction'], [`${BOTH}/${TOT}`, 'divided by everyone: that is the joint, "a trader who prefers Options"'], [`${G[g0]}/${TOT}`, 'that is P(trader), ignoring the Options condition']], `The pick is among the ${K[k0]} Options fans; ${BOTH} of them are traders.`, { at: 2 }),
    ] },
    { type: 'text', text: 'The same four numbers as a Venn diagram: the trader circle, the Options circle, and the lens where they meet.' },
    { type: 'diagram', diagram: 'venn', spec: { sets: ['trader', 'prefers Options'], regions: { A: G[g0] - BOTH, B: K[k0] - BOTH, AB: BOTH, none: TOT - G[g0] - K[k0] + BOTH }, total: TOT }, caption: `Joint = lens / everything (${BOTH}/${TOT}). P(Options | trader) = lens / trader circle (${BOTH}/${G[g0]}). P(trader | Options) = lens / Options circle (${BOTH}/${K[k0]}). One lens, three denominators.` },
    { type: 'check', scope: 'one numerator, three denominators', questions: [
      mc(null, 'For any survey, which of the three can never be the largest: the joint, P(answer | group), P(group | answer)?', 'the joint', [['P(answer | group)', 'it can be the largest when the group is smaller than the answer total'], ['P(group | answer)', 'it can be the largest when the answer total is smaller than the group']], 'All three share the lens on top; the joint divides by everyone, the largest total.', { at: 0 }),
    ] },

    S('derivation'),
    { type: 'text', text: 'Four moves. The first collects the only numbers you need; the others match each wording to a denominator and then order without dividing.' },
    { type: 'steps', steps: [
      { say: 'Compute four totals: everyone, the group, the answer (both groups), and both (one bar).', why: 'Every statement is one of these over another, so four additions replace all the reading.',
        checks: [{ make: (rng) => { const s = survey(rng); return { type: 'number', q: `${sayS(s)} How many people chose ${s.kName} (both groups)?`, answer: s.inK, hints: [`Add the two ${s.kName} bars.`], explain: `${s.c[0][s.k]} + ${s.c[1][s.k]} = ${s.inK}.` }; } }] },
      { say: 'Joint ("a random respondent is in group g and chose k"): both / everyone.', why: 'The pick is from everyone, and it must satisfy two conditions: the lens.',
        checks: [{ make: (rng) => { const s = survey(rng); return { type: 'number', q: `${sayS(s)} P(a random respondent is one of the ${s.gName} and chose ${s.kName})? (2 decimals)`, answer: s.both / s.tot, tolerance: 0.006, hints: ['Numerator: one bar.', `Denominator: everyone, ${s.tot}.`], explain: `${s.both}/${s.tot} = ${dp(s.both / s.tot, 2)}.` }; } }] },
      { say: 'Conditionals: "a random member of g chose k" is both / group; "a random person who chose k is in g" is both / answer.', why: 'The words before the condition name who is picked, and that set is the denominator. Swapping them swaps the denominator.',
        checks: [{ hinge: true, make: (rng) => again(() => { const s = survey(rng); if (s.inG === s.inK) return null; return mc(rng, `${sayS(s)} P(a random person who chose ${s.kName} is one of the ${s.gName})?`, `${s.both}/${s.inK}`, [[`${s.both}/${s.inG}`, `divided by the ${s.gName}: that is P(${s.kName} | ${s.gName}), the reverse direction`], [`${s.both}/${s.tot}`, 'divided by everyone: that is the joint'], [`${s.inK}/${s.tot}`, `that is P(${s.kName}), with no group condition`]], `The pick is among the ${s.inK} who chose ${s.kName}; ${s.both} of them are ${s.gName}.`); }) }] },
      { say: 'Order statements that share the numerator by their denominators: the smaller the pool you pick from, the larger the probability. The joint is always last of the three.', why: 'Fractions with equal tops: a/b > a/c exactly when b < c. Everyone is at least as large as any group or answer total.',
        checks: [{ make: (rng) => again(() => { const s = survey(rng); return rank(rng, `${sayS(s)} Rank from most to least likely (compare denominators).`, [[`A random respondent is one of the ${s.gName} and chose ${s.kName}.`, s.both / s.tot], [`A random member of the ${s.gName} chose ${s.kName}.`, s.both / s.inG], [`A random person who chose ${s.kName} is one of the ${s.gName}.`, s.both / s.inK]], `Numerator ${s.both} each time; denominators ${s.inK} (answer), ${s.inG} (group), ${s.tot} (everyone).`); }) }] },
    ] },
    { type: 'explain', prompt: 'Explain why P(Options | trader) and P(trader | Options) are different numbers, and how to tell which is larger without dividing.', model: 'Both count the same people on top: traders who prefer Options. P(Options | trader) picks from all traders, P(trader | Options) from all Options fans, so they divide by different totals. The one with the smaller total is the larger probability, so compare the number of traders with the number of Options fans.', points: ['Same numerator: the people in both', 'Different pools picked from: the group against the answer', 'Smaller pool → larger probability'] },

    S('worked'),
    { type: 'worked', section: 'll', family: 'survey-bar', difficulty: 3, seed: 'a', intro: 'A marginal, a joint and a conditional. Find the four totals first; commit to an order before opening the solution.' },
    { type: 'worked', section: 'll', family: 'survey-bar', difficulty: 4, seed: 'b', fade: 1, intro: 'The joint and both directions of the conditional. The totals are given; the ordering is yours.' },

    S('predict'),
    { type: 'predict', question: '10 of 40 traders prefer Options, and 25 people in total prefer Options. Which is larger: P(Options | trader) or P(trader | Options)?', answer: 'P(trader | Options) = 10/25 = 0.4 beats P(Options | trader) = 10/40 = 0.25.', explain: 'Same numerator, and 25 < 40.' },

    S('traps'),
    { type: 'text', text: 'Every trap in this family is a denominator mistake: the numerator (one bar) is almost always read correctly. Before dividing, say the pool out loud: everyone, the group, or the answer. Then check the pool against the wording: "a randomly chosen trader" names the group, "a respondent who prefers Options" names the answer, and a sentence with neither names everyone.' },
    { type: 'traps', section: 'll', family: 'survey-bar', extra: [
      { belief: 'P(answer | group) = P(group | answer).', fix: 'Same numerator, different pools: the group total against the answer total.' },
      { belief: '"A trader who prefers Options" means "among traders".', fix: 'Without "among" or "a randomly chosen trader", the pick is from everyone: that is the joint.' },
      { belief: 'The answer total is the height of one bar.', fix: 'An answer total adds the bars of both groups.' },
      { belief: 'A conditional is always smaller than the plain probability.', fix: 'P(Options | trader) can be far above P(Options) when traders love Options.' },
    ] },
    { type: 'erroneous', problem: `A candidate ranks the challenge statements for the ${TOT}-person survey. One step is wrong.`, steps: [
      `Totals: everyone ${TOT}, traders ${G[g0]}, Options ${K[k0]}, traders who prefer Options ${BOTH}.`,
      `P(a random respondent prefers Options) = ${K[k0]}/${TOT} = ${dp(P.marg, 2)}.`,
      `P(a random trader prefers Options) and P(a random Options fan is a trader) are both ${BOTH}/${G[g0]} = ${dp(P.kg, 2)}.`,
      'So the two conditionals tie at the top.',
    ], errorStep: 2, explain: `"A random Options fan" picks among the ${K[k0]} Options fans: ${BOTH}/${K[k0]} = ${dp(P.gk, 2)}. The conditionals only share a numerator. Order: ${dp(P.gk, 2)} > ${dp(P.kg, 2)} > ${dp(P.marg, 2)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc(null, `A candidate writes P(a random respondent who prefers Options is a trader) = ${BOTH}/${TOT}. Which belief?`, 'Treated the conditional as the joint: divided by everyone', [['Swapped the two directions', `that would give ${BOTH}/${G[g0]}`], ['Read the wrong bar', `the numerator ${BOTH} is the right bar`], ['Forgot to add the two groups', `the denominator used is everyone, not a single bar`]], `The pick is among Options fans: ${BOTH}/${K[k0]}.`, { at: 0 }),
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: 'Never divide for the order between statements that share the lens: compare the denominators instead. Divide only when a marginal (a different numerator) must be placed against them, and then cross-multiply.' },
    { type: 'callout', tone: 'speed', text: 'Add bars in pairs you can do in your head. You need at most three sums: one group total, one answer total, and everyone.' },
    { type: 'callout', tone: 'speed', text: 'Sanity check before you submit: the joint must be the smallest of joint and conditionals, and a conditional on a small group can sit far above the marginal. If your order breaks either fact, a denominator is wrong.' },
    { type: 'check', scope: 'comparing denominators', questions: [
      { make: (rng) => again(() => { const s = survey(rng); if (s.inG === s.inK) return null; const r = s.inK < s.inG ? `P(${s.gName} | ${s.kName})` : `P(${s.kName} | ${s.gName})`; return mc(rng, `${s.inG} ${s.gName}, ${s.inK} chose ${s.kName}, ${s.both} did both. Which conditional is larger?`, r, [[s.inK < s.inG ? `P(${s.kName} | ${s.gName})` : `P(${s.gName} | ${s.kName})`, 'picked the larger pool: equal tops, so the larger denominator gives the smaller fraction'], ['They are equal', 'they share only the numerator']], `Numerator ${s.both} each; the smaller pool is ${Math.min(s.inG, s.inK)}.`); }) },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'Survey chart → four totals. Joint = both/all; P(k | g) = both/g; P(g | k) = both/k. Same numerator: smaller pool wins; the joint is last of the three.' },

    S('contrast'),
    { type: 'compare', columns: ['Wording', 'Numerator', 'Denominator', 'Name'], rows: [
      ['a random respondent chose k', 'answer total', 'everyone', 'marginal P(k)'],
      ['a random respondent is in g and chose k', 'both', 'everyone', 'joint'],
      ['a random member of g chose k', 'both', 'group g', 'P(k | g)'],
      ['a random person who chose k is in g', 'both', 'answer k', 'P(g | k)'],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: if the group is everyone, P(k | g) is just P(k). If nobody in g chose k, every statement with that lens is 0. If everyone who chose k is in g, P(g | k) = 1.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: a medical test in Beat the Odds (P(positive | sick) against P(sick | positive): the same lens over different pools), two-way tables, and the scatter-plot strip ("among days with x above 5").' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      mc(null, 'Every respondent who chose Rates is an engineer. P(engineer | Rates) is:', '1', [['the engineers\' share of everyone', 'answered P(engineer), ignoring the condition'], ['0', 'mixed up "every" with "none"'], ['P(Rates | engineer)', 'swapped the direction: engineers can choose other markets too']], 'The pool is the Rates fans, all of them engineers.', { at: 0 }),
    ] },

    S('tryit'),
    { type: 'tryit', section: 'll', family: 'survey-bar', count: 3 },
  ],
};
