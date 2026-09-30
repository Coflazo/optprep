export default {
  purpose: 'Measures task switching: how cleanly you drop one rule and load another when the context changes, the way a trader flips between two products with different quoting rules.',
  howItWorks: [
    'Every round shows both blocks: a sum or difference on top, two arrow sets below. One block is highlighted.',
    'Top highlighted: is the result odd? Bottom highlighted: do both arrow sets point the same way?',
    'Answer Yes with the right arrow or Y, No with the left arrow or N. 35 rounds, 4 s per answer.',
    'The highlight moves unpredictably, about half the time.',
  ],
  scoring: 'Accuracy is the tracked metric (target 95%). The game score weighs accuracy and speed equally. Switch cost (mean time on switch rounds minus repeat rounds) is recorded so you can see the price of each switch.',
  strategy: [
    { say: 'Anchor: this is a Stroop-style test with two rulebooks. The unhighlighted block is a distractor whose answer disagrees with yours half the time.', why: 'Both blocks always have an answer. If you answer the wrong block you are right only by luck, so the first job each round is choosing the block, not solving it.' },
    { say: 'Before looking at the content, name the active task silently: "odd" or "same".', why: 'Naming loads the rule. It costs a fraction of a second and removes the main error source, which is answering the previous round\'s task.' },
    { say: 'Odd check: only the last digits matter. Odd plus even is odd; odd plus odd and even plus even are even. Differences follow the same rule.', why: 'Parity of a sum or difference depends only on the parities of its parts, so you never need the full result.' },
    { say: 'Arrow check: compare the first arrow of each set.', why: 'Within a set all arrows point the same way, so one arrow per set is enough.' },
    { say: 'After a switch, expect to be slower; do not rush to make it up.', why: 'Switch cost is normal. Errors on switch rounds, not slowness, are what drag accuracy below target.' },
    { say: 'Edge case: two repeats in a row tempt you to stop naming the task. Keep naming it.', why: 'Switches are random, so a long run of repeats says nothing about the next round.' },
  ],
  rule: 'Name the task ("odd" or "same"), then check only what it needs: last digits for odd, first arrows for same.',
  drills: [
    'Play one practice run saying the task name out loud each round.',
    'Parity drill: for 20 random sums, say odd or even from the last digits only, before computing.',
  ],
};
