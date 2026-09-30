// Recognition tree for the Beat the Odds book: from what the question looks like to its lesson.
export default { diagram: 'flow', caption: 'Start at the top and answer each question about the problem in front of you.', spec: { root: 'q1', nodes: [
  { id: 'q1', text: 'What is being randomised?', kind: 'q' },
  { id: 'a1', text: 'Two dice, a sum', kind: 'a', link: 'bto/two-dice-sum' },
], edges: [{ from: 'q1', to: 'a1', label: 'dice' }] } };
