// Exam replicas and readiness targets. Formats are third-party candidate reports
// (QuantVault, Aptitude Test Prep, Tradermath, PracHub), so every number is editable here.
// Targets are this trainer's bar, set above the reported pass lines, not Optiver cutoffs.

export const SECTIONS = {
  // 80-in-8: reported by QuantVault (verified June 2026) as a separate test for Quant Trader,
  // graduate and intern trader roles. One tap answers and moves on; there is no going back.
  mm: {
    id: 'mm', title: '80-in-8', kind: 'mcq', portalOrder: 0,
    blurb: '80 mental arithmetic questions in 8 minutes, no calculator. Four options; tapping one answers and moves on. Right +1, wrong −1, no going back.',
    exam: { count: 80, totalSeconds: 480, navigation: 'forward', scoring: 'plusMinus', autoAdvance: true, allowSkip: false, optionCount: 4 },
    variants: [{ label: 'Skip allowed', allowSkip: true }, { label: 'Sprint: 20 in 2 minutes', count: 20, totalSeconds: 120 }],
    target: { metric: 'net', value: 62, label: 'net score at least 62 of 80 (reported pass ≈55, competitive 70+)' },
  },
  bto: {
    id: 'bto', title: 'Beat the Odds', kind: 'mcq', portalOrder: 1,
    blurb: 'Probability and expected value. Pick the closest value. Wrong answers cost a point, so skip when unsure.',
    exam: { count: 20, perItemSeconds: 90, navigation: 'forward', scoring: 'plusMinus' },
    variants: [{ label: '30 questions', count: 30 }],
    target: { metric: 'netPct', value: 0.6, label: 'net score at least 60% of the maximum' },
  },
  nl: {
    id: 'nl', title: 'NumberLogic', kind: 'mcq', portalOrder: 2,
    blurb: 'Find the next term. Difficulty ramps; you may skip and come back. Wrong answers cost a point.',
    exam: { count: 26, totalSeconds: 25 * 60, navigation: 'free', scoring: 'plusMinus' },
    variants: [{ label: 'Short: 6 in 5 minutes', count: 6, totalSeconds: 300 }],
    target: { metric: 'net', value: 18, label: 'net score at least 18 of 26 (reported safe line: 15)' },
  },
  ll: {
    id: 'll', title: 'Likelihood List', kind: 'rank', portalOrder: 3,
    blurb: 'Order three statements from most to least likely. One point only for the exact order.',
    exam: { count: 15, perItemSeconds: 90, navigation: 'forward', scoring: 'exactOrder' },
    variants: [],
    target: { metric: 'net', value: 12, label: 'at least 12 of 15 exact orders' },
  },
  iv: {
    id: 'iv', title: 'Intervals', kind: 'interval', portalOrder: 4,
    blurb: 'Give a lower and upper bound. Score is lower / upper if the true value is inside, otherwise zero.',
    exam: { count: 18, perItemSeconds: 60, navigation: 'forward', scoring: 'ratio' },
    variants: [{ label: 'Short: 4 questions, 45 s each', count: 4, perItemSeconds: 45 }],
    target: { metric: 'mean', value: 0.7, label: 'mean score at least 0.70' },
  },
  ob: {
    id: 'ob', title: 'Orderbooks', kind: 'orderbook', portalOrder: 5,
    blurb: 'Tap prices across products and bundles to lock in a profit with a flat position. A wrong submit costs time.',
    exam: { count: 20, totalSeconds: 8 * 60, navigation: 'forward', scoring: 'solved', wrongSubmitPenaltySeconds: 5 },
    variants: [{ label: 'Short: 6 boards in 3 minutes', count: 6, totalSeconds: 180 }],
    target: { metric: 'net', value: 17, label: 'at least 17 of 20 boards solved' },
  },
};

export const PORTAL_ORDER = ['mm', 'bto', 'nl', 'll', 'iv', 'ob', 'zapn'];
export const READINESS_WINDOW = 3; // last N exam runs must all meet the target

export const ZAPN_TARGETS = {
  balloon: { label: 'total bank within 85% of the EV-optimal strategy', metric: 'ratio', value: 0.85 },
  skyscraper: { label: 'average at most 2 moves above optimal', metric: 'movesOver', value: 2 },
  shapeshift: { label: 'accuracy at least 95%', metric: 'accuracy', value: 0.95 },
  codecompare: { label: 'accuracy at least 90%', metric: 'accuracy', value: 0.9 },
  pincode: { label: 'forward span at least 9 digits', metric: 'span', value: 9 },
  numberbox: { label: 'at least 9 of 10 targets made', metric: 'solved', value: 9 },
  figureitout: { label: 'average at most 1 guess above optimal', metric: 'guessesOver', value: 1 },
  theswitch: { label: 'accuracy at least 95%', metric: 'accuracy', value: 0.95 },
  stockmaster: { label: 'hit rate at least 85%', metric: 'accuracy', value: 0.85 },
};
