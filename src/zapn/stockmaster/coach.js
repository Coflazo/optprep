export default {
  purpose: 'Measures sustained, divided attention with timing: tracking several moving opportunities at once and acting on each inside its window, the way a trader works several instruments at once.',
  howItWorks: [
    'Up to four dials sit in fixed slots. Each needle rises from left to right at its own speed; the dial disappears when the needle reaches the end.',
    'Click a dial, or press its key 1 to 4, while the needle is inside the coloured zone to buy.',
    'A click outside the zone, or on an empty slot, is a false click. A needle that runs out unbought is a miss.',
    'Two minutes, continuous. Needles speed up as time goes on.',
  ],
  scoring: 'Hits divided by hits plus misses plus false clicks. Target: 85% or better.',
  strategy: [
    { say: 'Anchor: this is catching a traffic light on green while watching four junctions. You do not stare at one light; you schedule your glances.', why: 'Each dial is predictable once you have seen its speed: a needle moves at a constant rate, so you can tell when it will reach its zone.' },
    { say: 'When a dial appears, estimate its arrival time at the zone and move on.', why: 'Constant speed means one look gives you the arrival time. Watching a slow needle the whole way wastes the attention that the fast dials need.' },
    { say: 'Serve dials in order of arrival, not order of appearance.', why: 'A fast dial that appeared later often reaches its zone first. Queueing by arrival time is the only ordering that avoids misses.' },
    { say: 'Aim for the middle of the zone, not its leading edge.', why: 'Your click lands a little after you decide. Aiming at the centre leaves margin on both sides, so early and late errors both drop.' },
    { say: 'If two dials hit their zones at once, take the one with the wider or slower window last.', why: 'It stays inside its zone longer, so it can wait a fraction of a second.' },
    { say: 'Edge case: never click a dial just because it is about to vanish. A late click is a false click and costs the same as a miss.', why: 'Both lower the ratio by the same amount, so a hopeless late click gains nothing.' },
  ],
  rule: 'Glance, predict arrival, queue by arrival, click mid-zone. Let hopeless dials go.',
  drills: [
    'Play one run with keys only (1 to 4), eyes never following a single needle for more than a moment.',
    'After a run, check whether your errors were early, late or misses; drill the largest one next run.',
  ],
};
