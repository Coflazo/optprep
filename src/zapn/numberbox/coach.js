export default {
  purpose: 'Measures structured arithmetic search: whether you can find a path to a number instead of trying combinations at random, the same move as backing out a price from a few quoted numbers.',
  howItWorks: [
    'Four numbers and a target. Combine all four with +, −, ×, ÷ and brackets to hit the target exactly.',
    'Type an expression such as (8 − 2) × (3 + 1) and press Enter, or build it with the buttons. Wrong answers can be retried.',
    'Give up with the Skip button to see a solution and move on. 10 rounds, getting harder.',
  ],
  scoring: 'Number of targets made out of 10. Target: at least 9.',
  strategy: [
    { say: 'Anchor: this is the 24 game with a moving target. Work backwards from the target, not forwards from the numbers.', why: 'Forward search branches over hundreds of trees. Backwards, the target usually suggests a last step immediately.' },
    { say: 'First ask: which number could be the last one used? Try target ± that number, target ÷ that number, and target × that number.', why: 'Each gives a smaller three-number problem. For 52 from 4, 3, 2, 7: 52 ÷ 4 = 13, and 13 from 3, 2, 7 is 7 + 3 × 2.' },
    { say: 'Look at the factors of the target first; big targets are almost always a product plus or minus a little.', why: 'With single digits, reaching 60 or more needs multiplication, so the last step is often "product ± leftover".' },
    { say: 'If nothing works, try a fraction in the middle: 8 ÷ (3 − 8 ÷ 3) = 24.', why: 'Division can create an intermediate like 1/3 that multiplies back to an integer. Exact arithmetic is used, so fractions are allowed.' },
    { say: 'Edge case: a 1 is a free move. × 1 and ÷ 1 change nothing, and + 1 or − 1 fixes an off-by-one.', why: 'Every number must be used, so an awkward 1 can always be absorbed without changing the value.' },
  ],
  rule: 'Target first: try target ÷ n, target ± n for each n, recurse on three numbers. Products for big targets, fractions as the last resort.',
  drills: [
    'For five random targets, list their factor pairs in 10 seconds each before solving.',
    'Solve three rounds out loud using only the backwards method, even when a forward guess comes to mind.',
  ],
};
