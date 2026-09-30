// Numbers below come from engine.solveRound with pop point K ~ Uniform{1..20};
// tests/zapn/balloon.test.js pins them so this text cannot drift from the engine.
export default {
  purpose: 'Measures how you size risk: whether you push each bet to the point where its expected value peaks, and whether you change that point when the cost of losing changes.',
  howItWorks: [
    'Each pump adds money to the balloon. Cash in to bank it; if the balloon pops first, that balloon pays nothing.',
    'Round 1: 30 balloons at 10c per pump.',
    'Round 2: 20 balloons at 20c per pump, and a pop also costs half of the money banked in that round.',
    'Each balloon hides a random pop point. In this trainer it is uniform on 1 to 20 pumps; the real distribution is not published, so treat the first balloons as data.',
  ],
  scoring: 'Your total bank divided by what the expected-value-optimal policy earns on the same balloons. Luck cancels out because both strategies face the same pop points. Target: 0.85 or better.',
  strategy: [
    { say: 'Anchor: this is a coin you keep flipping for a growing prize. Each pump is one more flip.', why: 'Every pump is a separate bet: it adds 10c if the balloon survives and forfeits everything on it if it pops.' },
    { say: 'Round 1: after t safe pumps, the next pump pops with probability 1/(20 - t) and adds 10c.', why: 'Given no pop yet, K is uniform on the 20 - t remaining pump numbers, so one of them is the next pump.' },
    { say: 'Expected value of cashing at t is 10c x t x (20 - t) / 20. The next pump adds 10c x (19 - 2t) / 20.', why: 'Survival to t pumps has probability (20 - t)/20. The difference between t + 1 and t is positive while t < 9.5.' },
    { say: 'So pump to 10 and cash, every balloon. Greed after the midpoint loses: pump 11 has negative expected value.', why: 'Past the midpoint you risk more banked-in-balloon money than the 10c the pump adds.' },
    { say: 'Round 2 changes one thing: a pop also halves the round-2 bank. The more you have banked, the more each pump risks.', why: 'The downside of a pump now includes half of everything you already won this round, so the break-even pump count falls as the bank grows.' },
    { say: 'Round 2 targets from the exact solution: empty bank, 11 pumps; $2 banked, about 9; $4, about 7; $6, about 5; $8, about 3; $10 or more, 0 to 2.', why: 'Backward induction over (balloons left, bank) maximises the expected final bank. An early pop at a small bank is cheap, so you start aggressive and taper.' },
    { say: 'Edge case: if pops in round 1 cluster well below 10, the real distribution is tighter than 1 to 20. Halve the pop points you see and aim there.', why: 'For a uniform pop point on 1..N the optimum is N/2, so the midpoint of the pops you observe estimates the right target.' },
  ],
  rule: 'Round 1: 10 pumps, cash. Round 2: pump about 11 minus your round-2 bank in dollars; stop pumping once that bank passes $10.',
  drills: [
    'Play round 1 at exactly 10 pumps for 10 balloons and compare your bank to 10 x $0.50 = $5 expected.',
    'Before each round-2 balloon, say the target out loud from the rule, then execute it without changing your mind mid-balloon.',
    'Predict: if pop points were uniform on 1..30, what is the round-1 target? (15.)',
  ],
};
