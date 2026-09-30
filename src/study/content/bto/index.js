// Book: Beat the Odds. One lesson per question family, grouped into chapters.
// Agent A extends this file: add chapters and lessons; keep two-dice-sum as the reference lesson.
import twoDiceSum from './two-dice-sum.js';

export default {
  id: 'bto',
  title: 'Beat the Odds',
  blurb: 'Every Beat the Odds question type: dice, cards, coins, urns, games and expected values, each solved from first principles.',
  chapters: [
    { title: 'Dice', intro: 'Sample spaces you can draw as a grid.', lessons: [twoDiceSum] },
  ],
  tree: { diagram: 'flow', caption: 'Start at the top and answer each question about the problem in front of you.', spec: { root: 'q1', nodes: [
    { id: 'q1', text: 'What is being randomised?', kind: 'q' },
    { id: 'a1', text: 'Two dice, a sum', kind: 'a', link: 'bto/two-dice-sum' },
  ], edges: [{ from: 'q1', to: 'a1', label: 'dice' }] } },
};
