export default {
  purpose: 'Measures deduction under feedback: whether every guess extracts all the information it can, instead of testing one idea at a time.',
  howItWorks: [
    'A hidden figure has 3 to 6 properties, such as shape, colour, fill, size, count and border.',
    'Pick one value for every property and submit. Each property is marked right or wrong.',
    'The round ends when every property is right. 5 rounds, each with more properties or values.',
    'Keyboard: up and down pick the property, left and right change its value, Enter submits.',
  ],
  scoring: 'Guesses above the optimum, averaged over the 5 rounds. The optimum is the expected guess count of a perfect strategy (3.25 in round 1, about 4.07 in round 5). Target: at most 1 above.',
  strategy: [
    { say: 'Anchor: this is Mastermind where the referee tells you which pegs are right, not just how many.', why: 'Because feedback is per property, the properties are separate puzzles that happen to share one submit button.' },
    { say: 'On every guess, keep every right value and change every wrong value to one you have not tried.', why: 'Each property can be tested in parallel. Changing one property at a time, as in a controlled experiment, wastes the feedback on all the others.' },
    { say: 'So the round lasts as long as the slowest property: the one with the most values.', why: 'Property k is solved on the guess where you first try its hidden value. With 5 shapes that takes up to 5 guesses; everything else finishes earlier.' },
    { say: 'The optimum is the expected slowest property. Round 1 (4, 4, 3 values) averages 3.25 guesses; worst case 4.', why: 'P(done within m guesses) = product over properties of min(m, n)/n. Summing P(not done) over m gives the expectation.' },
    { say: 'Keep a mental list of eliminated values per property; never resubmit a known wrong value.', why: 'A repeated wrong value is a guess that cannot finish the round, so it adds exactly one guess over the optimum.' },
    { say: 'Edge case: once a property is right, do not touch it again, even if the figure "looks wrong".', why: 'A right mark is certain. Changing it guarantees the next guess cannot be the answer.' },
  ],
  rule: 'Keep rights, change every wrong to an untried value, every guess. The round ends at the property with the most values.',
  drills: [
    'Play a round and before each submit say how many values remain for each property.',
    'Predict: with properties of 5, 3 and 2 values, what is the worst-case number of guesses? (5.)',
  ],
};
