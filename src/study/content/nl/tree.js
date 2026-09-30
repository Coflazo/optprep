// Recognition tree for the NumberLogic book. Interim version: part B replaces it with the full tree.
export default { diagram: 'flow', caption: 'Start at the top: the method ladder tells you which test to run first.', spec: { root: 'q1', nodes: [
  { id: 'q1', text: 'Which test do you run first?', kind: 'q' },
  { id: 'a1', text: 'The method ladder', kind: 'a', link: 'nl/method-ladder' },
], edges: [{ from: 'q1', to: 'a1' }] } };
