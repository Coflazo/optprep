export default {
  purpose: 'Measures speeded classification: how fast you map what you see to the right key without letting speed break accuracy.',
  howItWorks: [
    'A circle or a square flashes for half a second somewhere on the stage.',
    'Right arrow for a circle, left arrow for a square. You have 1.5 s from the flash to answer.',
    '60 rounds. A key pressed before a shape appears counts as an early press, not an answer.',
  ],
  scoring: 'Accuracy over all 60 rounds, with misses counted as wrong. Mean reaction time on correct answers is recorded. Target: 95% or better.',
  strategy: [
    { say: 'Anchor: this is a traffic light with two colours. You do not look for the light; you let it arrive and react to one feature.', why: 'Searching the screen costs time. The shape appears anywhere, so keep your eyes on the centre and let peripheral vision catch it.' },
    { say: 'Bind the rule to a single cue: round = right. Squares are simply "not round".', why: 'One stored rule plus a default is faster than two separate rules. Round and right both start with R, which makes the binding stick.' },
    { say: 'Rest both fingers on the arrows before each round and keep them there.', why: 'Moving a finger to a key costs time on every round and invites pressing the wrong one.' },
    { say: 'Do not press in anticipation. Wait for the shape, then answer.', why: 'Circles and squares are equally likely and random, so a guess is right only half the time. One early wrong answer costs more accuracy than you save in speed.' },
    { say: 'Edge case: if you catch yourself pressing before you have seen the shape, slow down for three rounds.', why: 'Errors cluster after fast streaks. A short reset brings accuracy back without costing much mean time.' },
  ],
  rule: 'Eyes centre, fingers on keys. Round = right, else left. Never guess before you see it.',
  drills: [
    'Play one practice run aiming for zero errors at any speed, then one aiming for the same accuracy 50 ms faster.',
    'Say "right" silently whenever you see anything round in daily life for a day before the test.',
  ],
};
