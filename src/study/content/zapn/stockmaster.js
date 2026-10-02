// Zap-N game lesson: Stock Master (divided attention and timing). Needle speeds, zones, the speed
// ramp and the scoring rule come from src/zapn/stockmaster/engine.js; every time below is computed.
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { DEFAULTS, needle } from '../../../zapn/stockmaster/engine.js';
import { sec, mc, pct, dec } from './balloon.js';

const O = DEFAULTS;
const TARGET = ZAPN_TARGETS.stockmaster.value;
const entry = (g) => g.spawn + (1000 * g.zone[0]) / g.speed; // ms
const exit = (g) => g.spawn + (1000 * g.zone[1]) / g.speed;
const mid = (g) => (entry(g) + exit(g)) / 2;
const s2 = (ms) => dec(ms / 1000, 2);
const acc = (h, m, f) => h / (h + m + f);
const speeds = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55];
const zStarts = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];

// Challenge and picture: the later dial reaches its zone first.
const A = { slot: 0, spawn: 0, speed: 0.25, zone: [0.5, 0.65] };
const B = { slot: 1, spawn: 400, speed: 0.5, zone: [0.5, 0.62] };
// Worked timeline: four dials and five clicks.
const WG = [
  { slot: 0, spawn: 0, speed: 0.4, zone: [0.6, 0.75] },
  { slot: 1, spawn: 300, speed: 0.5, zone: [0.45, 0.6] },
  { slot: 2, spawn: 600, speed: 0.3, zone: [0.5, 0.65] },
  { slot: 3, spawn: 900, speed: 0.55, zone: [0.7, 0.85] },
];
const WC = [
  { slot: 1, t: Math.round(mid(WG[1])) },
  { slot: 0, t: Math.round(entry(WG[0]) - 100) },
  { slot: 3, t: Math.round(exit(WG[3]) + 60) },
  { slot: 2, t: Math.round(mid(WG[2])) },
];
const outcome = (g, t) => { const p = needle(g, t); return p < g.zone[0] ? 'early' : p > g.zone[1] ? 'late' : 'hit'; };
const W = (() => { const res = WC.map((c) => ({ ...c, result: outcome(WG[c.slot], c.t) })); const hits = res.filter((c) => c.result === 'hit').length; return { res, hits, falseClicks: res.length - hits, misses: WG.length - res.length }; })();
W.accuracy = acc(W.hits, W.misses, W.falseClicks);
const THINK = [
  { slot: 0, spawn: 0, speed: 0.3, zone: [0.6, 0.78] },
  { slot: 2, spawn: 500, speed: 0.5, zone: [0.55, 0.7] },
];

const entryQ = (rng) => { const v = rng.pick(speeds), z = rng.pick(zStarts); return { type: 'number', q: `A needle moves at ${v} sweeps per second. Its zone starts at ${z}. How many seconds after the dial appears does the needle enter the zone? (2 decimals)`, answer: z / v, tolerance: 0.006, hints: ['Distance ÷ speed.', `${z} ÷ ${v}.`], explain: `${z} ÷ ${v} = ${dec(z / v, 2)} s.` }; };
const windowQ = (rng) => { const v = rng.pick(speeds), w = rng.pick([0.12, 0.14, 0.15, 0.16, 0.18, 0.2]); return { type: 'number', q: `Zone width ${w} of the dial, speed ${v} sweeps per second. How long is the needle inside the zone, in seconds? (2 decimals)`, answer: w / v, tolerance: 0.006, hints: ['Width ÷ speed.', `${w} ÷ ${v}.`], explain: `${w} ÷ ${v} = ${dec(w / v, 2)} s.` }; };
const orderQ = (rng) => {
  for (;;) {
    const a = { spawn: 0, speed: rng.pick(speeds), zone: [rng.pick(zStarts), 0] }, b = { spawn: 100 * rng.int(2, 12), speed: rng.pick(speeds), zone: [rng.pick(zStarts), 0] };
    const ea = entry(a), eb = entry(b);
    if (Math.abs(ea - eb) < 200 || eb > ea) continue; // the later dial must win, clearly
    return mc({ q: `Dial A appears at 0 s: speed ${a.speed} sweeps/s, zone from ${a.zone[0]}. Dial B appears at ${s2(b.spawn)} s: speed ${b.speed}, zone from ${b.zone[0]}. Which needle reaches its zone first?`, right: 'dial B', at: rng.int(0, 1),
      wrong: [['dial A', `served in order of appearance: A enters at ${s2(ea)} s, B at ${s2(eb)} s`]],
      explain: `A: ${a.zone[0]}/${a.speed} = ${s2(ea)} s. B: ${s2(b.spawn)} + ${b.zone[0]}/${b.speed} = ${s2(eb)} s. B first.` });
  }
};
const accQ = (rng) => { const h = rng.int(30, 60), m = rng.int(1, 8), f = rng.int(0, 8); return { type: 'number', q: `A run ends with ${h} hits, ${m} miss${m === 1 ? '' : 'es'} and ${f} false click${f === 1 ? '' : 's'}. Accuracy? (3 decimals)`, answer: acc(h, m, f), tolerance: 0.0006, hints: ['Hits over everything that counts.', `${h} / (${h} + ${m} + ${f}).`], explain: `${h}/${h + m + f} = ${dec(acc(h, m, f))}${acc(h, m, f) >= TARGET ? ': on target' : ': below target'}.` }; };
const clickQ = (rng) => {
  const g = { spawn: 0, speed: rng.pick(speeds), zone: [rng.pick(zStarts), 0] }; g.zone[1] = Math.round((g.zone[0] + rng.pick([0.12, 0.15, 0.2])) * 100) / 100;
  const t = Math.round(1000 * rng.pick([g.zone[0] - 0.05, (g.zone[0] + g.zone[1]) / 2, g.zone[1] + 0.05]) / g.speed);
  const res = outcome(g, t);
  const opts = { hit: 'a hit', early: 'a false click (early)', late: 'a false click (late)' };
  const traps = { hit: 'the needle is inside the zone, so it is a hit', early: `the needle is at ${dec(needle(g, t), 3)}, still below the zone`, late: `the needle is at ${dec(needle(g, t), 3)}, already past the zone` };
  return mc({ q: `Speed ${g.speed} sweeps/s, zone ${g.zone[0]} to ${g.zone[1]}. You click ${s2(t)} s after the dial appears. Result?`, right: opts[res], wrong: Object.keys(opts).filter((k) => k !== res).map((k) => [opts[k], `the needle is at ${dec(needle(g, t), 3)}: ${res === 'hit' ? 'inside the zone' : res === 'early' ? 'below the zone' : 'past the zone'}, so it is not ${k === 'hit' ? 'a hit' : k}`]), explain: `Needle = ${g.speed} × ${s2(t)} = ${dec(needle(g, t), 3)}: ${traps[res]}.` }, rng);
};

export default {
  id: 'zapn/stockmaster',
  book: 'zapn',
  kind: 'game',
  game: 'stockmaster',
  title: 'Stock Master: predict arrivals, click mid-zone',
  summary: 'A needle moves at constant speed, so one look gives its zone time: queue dials by zone entry, click the middle, let hopeless ones go.',
  prerequisites: [],
  objectives: [
    'Turn a needle’s speed and zone into the time window when a click is a hit',
    'Order several dials by when their zones open, not by when they appeared',
    'Score a run: hits over hits + misses + false clicks',
    `Hit the target: accuracy at least ${pct(TARGET)}`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. Dial A appears at 0 s; its needle moves at ${A.speed} sweeps per second and its zone runs from ${A.zone[0]} to ${A.zone[1]} of the dial. Dial B appears at ${s2(B.spawn)} s, moves at ${B.speed} sweeps per second, zone ${B.zone[0]} to ${B.zone[1]}. Which dial do you click first, and at roughly what time? Two different ways to decide.`, answer: `Dial B first, around ${s2(mid(B))} s; then dial A around ${s2(mid(A))} s.`, explain: `B's zone is open from ${s2(entry(B))} to ${s2(exit(B))} s, A's from ${s2(entry(A))} to ${s2(exit(A))} s. The dial that appeared later needs you first. If you planned to serve A first because it appeared first, the lesson shows the ordering that avoids misses.`,
      attempts: [
        { id: 'appear', label: 'Serve dials as they appear', approach: 'Clicked dial A first because it appeared first.', breaksAt: 'A faster dial that appeared later can reach its zone first, and its window closes while you wait for A.' },
        { id: 'watch', label: 'Follow each needle in', approach: 'Watched dial A all the way into its zone, then turned to dial B.', breaksAt: 'One look already gives the arrival time; watching starves the other dials.' },
      ] },
    { type: 'text', text: `Stock Master is the attention game of Zap-N. Up to ${O.slots} dials sit in fixed slots. Each needle sweeps from left to right at its own constant speed and the dial vanishes when the needle reaches the end. Click the dial (or press its key 1 to ${O.slots}) while the needle is inside the coloured zone to **buy**.` },
    { type: 'check', scope: 'when a click buys', questions: [
      { type: 'choice', q: 'When does a click buy?', options: ['while the needle is in the zone', 'any time before the dial vanishes', 'only at the far right of the dial'], answer: 0, traps: { 1: 'outside the zone a click is a false click', 2: 'the dial vanishes when the needle reaches the end' }, explain: 'A click buys only while the needle is inside the coloured zone.' },
    ] },
    { type: 'text', text: `A click outside the zone, or on an empty slot, is a **false click**. A needle that runs out unbought is a **miss**. Accuracy = hits / (hits + misses + false clicks). The game runs ${O.durationMs / 60000} minutes without a break, and needles speed up as it goes. Target: ${pct(TARGET)}.` },
    { type: 'check', scope: 'hits, misses and false clicks', questions: [
      mc({ q: 'You click a dial just after its needle has left the zone. What is it?', right: 'a false click', at: 2, wrong: [['a hit', 'only a click with the needle inside the zone is a hit'], ['a miss', 'a miss is a dial you never clicked; this one was clicked, outside the zone'], ['nothing: it is ignored', 'every click on a dial counts']], explain: 'Clicked outside the zone: false click.' }),
      { make: accQ },
    ] },

    sec('why'),
    { type: 'text', text: 'A trader watches several instruments at once and acts on each inside its own window. Stock Master measures sustained, divided attention with timing: whether you schedule your glances instead of staring at one needle while another opportunity runs out.' },

    sec('anchor'),
    { type: 'text', text: 'You know distance = speed × time. A needle is a car on a one-lane road at constant speed: one look tells you when it will reach the zone. Stock Master is that with **one change**: four roads at once, so the skill is deciding which car to watch next.' },
    { type: 'check', scope: 'time = distance ÷ speed', questions: [{ make: entryQ }] },

    sec('picture'),
    { type: 'text', text: 'Needle position against time for the two challenge dials. Straight lines, because the speed is constant; the markers show where each needle enters its zone.' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 4, label: 'seconds since dial A appeared' }, y: { min: 0, max: 1, label: 'needle position' }, curves: [{ label: 'dial A', points: [[0, 0], [1000 / A.speed / 1000, 1]] }, { label: 'dial B', points: [[B.spawn / 1000, 0], [(B.spawn + 1000 / B.speed) / 1000, 1]] }], markers: [{ x: entry(A) / 1000, y: A.zone[0], label: `A enters ${s2(entry(A))} s` }, { x: entry(B) / 1000, y: B.zone[0], label: `B enters ${s2(entry(B))} s` }] }, caption: 'The steeper line is the faster needle. B starts later but reaches its zone first.' },
    { type: 'check', scope: 'reading needle lines', questions: [{ make: orderQ }] },
    { type: 'diagram', diagram: 'zapn-stock', spec: { gauges: [A, B], stated: { windows: [[entry(A), exit(A)], [entry(B), exit(B)]], order: [1, 0] } }, caption: `The same two dials as a timeline. Shaded: the time each needle spends in its zone. B's window (${s2(entry(B))}-${s2(exit(B))} s) closes before A's even opens (${s2(entry(A))} s).` },
    { type: 'check', scope: 'zone windows', questions: [{ make: windowQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { answers: 'watch', say: 'The needle moves at constant speed: position = speed × (time since the dial appeared).', why: 'Each dial draws one speed when it appears and keeps it until it vanishes.',
        checks: [{ make: (rng) => { const v = rng.pick(speeds), t = rng.pick([0.4, 0.8, 1.2, 1.6]); return { type: 'number', q: `Speed ${v} sweeps per second. Where is the needle ${t} s after the dial appears? (position from 0 to 1)`, answer: Math.min(1, v * t), tolerance: 0.001, explain: `${v} × ${t} = ${dec(Math.min(1, v * t), 3)}.` }; } }] },
      { say: 'The zone opens at z_{0} ÷ speed and closes at z_{1} ÷ speed after the dial appears. The window lasts (z_{1} − z_{0}) ÷ speed.', why: 'Time to cover a distance at constant speed.',
        checks: [{ make: entryQ }, { make: windowQ }] },
      { say: 'Aim for the middle of the window: (z_{0} + z_{1}) ÷ (2 × speed). That leaves half the window as margin on each side.', why: 'Your click lands a little after you decide, and you can also misjudge early; the middle survives both errors.',
        checks: [{ make: (rng) => { const v = rng.pick(speeds), z = rng.pick(zStarts), w = rng.pick([0.12, 0.16, 0.2]); return { type: 'number', q: `Speed ${v}, zone ${z} to ${dec(z + w, 2)}. Best click time after the dial appears, in seconds? (2 decimals)`, answer: (z + w / 2) / v, tolerance: 0.006, hints: ['Middle of the zone ÷ speed.', `${dec(z + w / 2, 2)} ÷ ${v}.`], explain: `(${z} + ${dec(z + w, 2)})/2 = ${dec(z + w / 2, 2)}; ÷ ${v} = ${dec((z + w / 2) / v, 2)} s.` }; } }] },
      { answers: 'appear', say: 'Serve dials in order of zone entry, not order of appearance. A fast dial that appeared later often needs you first.', why: 'Queueing by entry time is the only order that never lets an earlier window close while you wait on a later one.',
        checks: [{ make: orderQ }] },
      { say: 'Accuracy = hits / (hits + misses + false clicks). An empty-slot click adds to the bottom without saving anything; a hopeless late click costs the same as the miss it replaces.', why: 'Both a miss and a false click add one to the denominator and nothing to the hits.',
        checks: [{ make: accQ }] },
      { say: `Needles speed up over the ${O.durationMs / 60000} minutes, to ×${O.rampTo} by the end, so every window shrinks to 1/${O.rampTo} = ${dec(1 / O.rampTo, 3)} of its early length.`, why: 'Window length = width ÷ speed, and the speed is multiplied by the ramp.',
        checks: [{ make: (rng) => { const w = rng.pick([0.12, 0.16, 0.2]), v = rng.pick(speeds); return { type: 'number', q: `Early in the game a dial with zone width ${w} and speed ${v} gives a window of ${dec(w / v, 3)} s. The same dial at the end (speed ×${O.rampTo}): window in seconds? (3 decimals)`, answer: w / v / O.rampTo, tolerance: 0.0006, explain: `${dec(w / v, 3)} ÷ ${O.rampTo} = ${dec(w / v / O.rampTo, 3)} s.` }; } }] },
    ] },
    { type: 'explain', prompt: 'Why does one glance at a new dial tell you everything you need, and what should you do with the time until its zone opens?', model: 'The needle moves at a constant speed, so from its speed and where the zone starts you know when it will enter and leave the zone. There is nothing more to learn by watching it. The time until then belongs to the other dials, served in order of when their zones open.', points: ['Constant speed makes the zone time predictable from one look', 'Watching a needle between the glance and its zone gains nothing', 'Spend the waiting time on the dial whose zone opens next'] },

    sec('worked'),
    { type: 'text', text: 'Four dials and four clicks from a real stretch of play. Score each click, then the stretch.' },
    { type: 'diagram', diagram: 'zapn-stock', spec: { gauges: WG, clicks: W.res.map(({ slot, t, result }) => ({ slot, t, result })), stated: { hits: W.hits, misses: W.misses, falseClicks: W.falseClicks, accuracy: W.accuracy } }, caption: `${W.hits} hits, ${W.res.filter((c) => c.result === 'early').length} early click, ${W.res.filter((c) => c.result === 'late').length} late click, ${W.misses} misses: accuracy ${dec(W.accuracy, 2)} for this stretch.` },
    { type: 'steps', steps: [
      { say: `Dial 2 (slot 2) is served first: its zone opens at ${s2(entry(WG[1]))} s, before dial 1's at ${s2(entry(WG[0]))} s. Clicked at ${s2(WC[0].t)} s, mid-window: hit.`, why: 'Entry order, not appearance order, decides the queue.',
        checks: [{ type: 'number', q: 'When does dial 2’s zone open, in seconds? (2 decimals)', answer: entry(WG[1]) / 1000, tolerance: 0.006, explain: `${s2(WG[1].spawn)} + ${WG[1].zone[0]}/${WG[1].speed} = ${s2(entry(WG[1]))} s.` }] },
      { say: `Dial 1 clicked at ${s2(WC[1].t)} s, ${s2(entry(WG[0]) - WC[1].t)} s before its zone opened at ${s2(entry(WG[0]))} s: early, a false click.`, why: 'Clicking at the leading edge leaves no margin for the delay between deciding and clicking.',
        checks: [mc({ q: 'Where should the click on dial 1 have been aimed?', right: `the middle of its window, ${s2(mid(WG[0]))} s`, at: 1, wrong: [[`the zone start, ${s2(entry(WG[0]))} s`, 'the leading edge has no margin for a late or early hand'], ['as soon as the dial appeared', 'the needle is nowhere near the zone yet']], explain: `(${s2(entry(WG[0]))} + ${s2(exit(WG[0]))})/2 = ${s2(mid(WG[0]))} s.` })] },
      { say: `Dial 4 clicked at ${s2(WC[2].t)} s, just after its zone closed at ${s2(exit(WG[3]))} s: late, a false click. Dial 3 clicked mid-window: hit.`, why: `Dial 4 is the fastest (${WG[3].speed} sweeps/s): its window lasts only ${s2(exit(WG[3]) - entry(WG[3]))} s.`,
        checks: [{ type: 'number', q: 'Accuracy for this stretch? (2 decimals)', answer: W.accuracy, tolerance: 0.006, explain: `${W.hits}/(${W.hits} + ${W.misses} + ${W.falseClicks}) = ${dec(W.accuracy, 2)}.` }] },
    ] },

    sec('predict'),
    { type: 'predict', question: `A zone of width 0.15 on a needle at ${O.speedMax} sweeps per second, near the end of the game (speed ×${O.rampTo}). How long is the window, in seconds, and what does that say about following needles with your eyes?`, answer: `${dec(0.15 / (O.speedMax * O.rampTo), 3)} s.`, explain: 'Too short to react to by watching; you must know it is coming and click on your predicted time.' },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Watch one needle all the way into its zone.', fix: 'One look gives the arrival time; watching longer starves the other dials.' },
      { belief: 'Click as the needle reaches the zone.', fix: 'Aim for the middle of the zone: margin on both sides.' },
      { belief: 'Serve dials in the order they appeared.', fix: 'Serve them in the order their zones open.' },
      { belief: 'Click a vanishing dial anyway, to avoid a miss.', fix: 'A late click is a false click: it costs exactly what the miss would have.' },
      { belief: 'Clicking an empty slot early gets you ready.', fix: 'An empty-slot click is a false click that saves nothing.' },
    ] },
    { type: 'erroneous', problem: 'A candidate scores a run: 44 hits, 3 misses, 6 false clicks.', steps: [
      'Hits: 44.',
      'Misses are dials that ran out: 3.',
      'Accuracy = 44 / (44 + 3).',
      `That is ${dec(44 / 47)}, so the ${pct(TARGET)} target is met.`,
    ], errorStep: 2, explain: `False clicks belong in the denominator too: 44/(44 + 3 + 6) = ${dec(acc(44, 3, 6))}, ${acc(44, 3, 6) >= TARGET ? 'still on target' : 'below target'}.` },
    { type: 'check', scope: 'scoring clicks', questions: [{ make: clickQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'When a dial appears: one glance for its speed and zone, estimate the entry time, look away. Keep a mental queue ordered by entry time and move your eyes to whichever dial is next.' },
    { type: 'check', scope: 'queueing by entry time', questions: [{ make: orderQ }] },
    { type: 'callout', tone: 'speed', text: 'Use the keys 1 to 4 rather than the mouse: no travel time, and your eyes never have to follow the cursor. If two zones open together, take the narrower or faster window first; the wide, slow one can wait.' },
    { type: 'thinkaloud', problem: `Two dials. Slot 1 appeared at 0 s: speed ${THINK[0].speed}, zone ${THINK[0].zone[0]}-${THINK[0].zone[1]}. Slot 3 appeared at ${s2(THINK[1].spawn)} s: speed ${THINK[1].speed}, zone ${THINK[1].zone[0]}-${THINK[1].zone[1]}.`, lines: [
      { t: 0, say: `Slot 1 is slow: its zone opens at ${s2(entry(THINK[0]))} s. Look away.` },
      { t: 0.6, say: 'Slot 3 just appeared. Slot 1 came first, so it stays first in my queue.', slip: true },
      { t: 0.9, say: `No: queue by zone entry. Slot 3: ${THINK[1].zone[0]} ÷ ${THINK[1].speed} after ${s2(THINK[1].spawn)} s is ${s2(entry(THINK[1]))} s, closing ${s2(exit(THINK[1]))} s. It goes first.` },
      { t: 1.2, say: `Queue: slot 3 at about ${s2(mid(THINK[1]))} s, then slot 1 at about ${s2(mid(THINK[0]))} s.` },
      { t: +s2(mid(THINK[1])), say: 'Key 3, mid-zone. Hit. Eyes to slot 1.' },
      { t: +s2(mid(THINK[0])), say: 'Key 1, mid-zone. Check the other slots for new dials.' },
    ] },
    { type: 'check', scope: 'the think-aloud and the second tip', questions: [
      { type: 'choice', q: 'Two zones open together. Which do you take first?', options: ['the narrower or faster window', 'the wider, slower window first', 'the one in slot 1'], answer: 0, traps: { 1: 'the wide, slow window can wait', 2: 'slot order does not decide' }, explain: 'The narrow or fast window closes first.' },
      { type: 'choice', q: 'In the think-aloud, slot 1 stayed first because it appeared first. What was wrong?', options: ['the queue is by zone entry time', 'slot 3 had already closed', 'slot 1 was the faster one'], answer: 0, traps: { 1: 'slot 3 was about to open', 2: 'slot 1 was slow at 0.3' }, explain: 'Slot 3 entered its zone at about 1.6 s, before slot 1 at about 2 s.' },
    ] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'Stock Master: glance, compute zone entry (start ÷ speed), queue by entry time, click mid-zone. Never click an empty slot; let a hopeless dial go.' },

    sec('contrast'),
    { type: 'compare', columns: ['Game', 'Targets at once', 'What to predict'], rows: [
      ['Stock Master', `up to ${O.slots} dials`, 'when each zone opens'],
      ['Shapeshift', 'one shape', 'nothing: react to what appears'],
      ['Balloon', 'one balloon', 'the pump count where expected value peaks'],
    ] },
    { type: 'variation', base: `One dial: speed 0.4 sweeps/s, zone 0.6 to 0.75. Window from ${dec(0.6 / 0.4, 3)} to ${dec(0.75 / 0.4, 3)} s after it appears.`, rows: [
      { change: 'Speed 0.8 instead of 0.4', effect: `Window from ${dec(0.6 / 0.8, 3)} to ${dec(0.75 / 0.8, 3)} s: twice as early and half as long.` },
      { change: 'Zone 0.5 to 0.65 instead of 0.6 to 0.75', effect: `Opens earlier, at ${dec(0.5 / 0.4, 3)} s, but lasts the same ${dec(0.15 / 0.4, 3)} s: same width, same speed.` },
      { same: true, change: 'It appears in slot 3 instead of slot 1', effect: 'Nothing changes except the key you press.' },
      { fusion: true, change: 'Speed 0.8 and zone 0.5 to 0.65', effect: `Window ${dec(0.5 / 0.8, 3)} to ${dec(0.65 / 0.8, 3)} s: the zone shift moves it earlier, and the double speed halves both its start and its length.` },
      { change: `Late in the game (speed ×${O.rampTo})`, effect: `Window ${dec(0.15 / 0.4 / O.rampTo, 3)} s instead of ${dec(0.15 / 0.4, 3)} s.` },
    ] },
    { type: 'callout', tone: 'edge', text: `Edge cases: zones always start at 0.4 or later and end by 0.9, so nothing can be bought in the first 40% of a sweep; relax until then. Zones cover ${Math.round(O.zoneMin * 100)}-${Math.round(O.zoneMax * 100)}% of the dial. A new dial can appear in a slot only after the previous one there has gone.` },
    { type: 'check', scope: 'the table and the edge cases', questions: [
      { type: 'choice', q: 'What do you watch in Stock Master?', options: ['when each zone opens', 'the best pump count', 'nothing: react to what appears'], answer: 0, traps: { 1: 'that is Balloon', 2: 'that is Shapeshift' }, explain: 'Queue the dials by the time each zone opens.' },
      { type: 'choice', q: 'A needle is at 30% of its sweep. Can it be in a zone?', options: ['no: zones start at 40% or later', 'yes: zones can start anywhere', 'yes, if the dial is fast'], answer: 0, traps: { 1: 'zones start at 0.4 or later', 2: 'speed does not move the zone' }, explain: 'Nothing can be bought in the first 40% of a sweep.' },
    ] },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: serving jobs in order of their deadlines is how schedulers avoid missed windows, and "one look, then predict" is how you watch several quotes at once instead of one.' },
    { type: 'transfer',
      near: { make: orderQ },
      far: { make: (rng) => { const dA = rng.pick([2.5, 3, 3.5, 4]), dB = rng.pick([1, 1.5, 2]); return mc({ q: `Two requests need 0.3 s of your attention each. Request A arrived first and must be handled within ${dA} s; request B arrived a moment later and must be handled within ${dB} s. Which do you handle first?`, right: 'request B', at: rng.int(0, 1), wrong: [['request A', `first come, first served: B's deadline (${dB} s) comes before A's (${dA} s)`]], explain: `Earliest deadline first: B by ${dB} s, then A with time to spare before ${dA} s.` }); } },
      principle: mc({ q: 'Which idea carried over from Stock Master to the two requests?', right: 'predict each window from one look, then serve the earliest one first', at: 0,
        wrong: [['serve whatever arrived first, then work down the line', 'arrival order ignores which window closes first'], ['watch one item closely until it is finished, then move on', 'that starves every other item'], ['wait for each deadline to come up and then react to it', 'reacting late leaves no margin; predicting leaves the middle of the window']],
        explain: 'Both are scheduling by window: know when each opens and closes, serve the earliest.' }),
    },
    { type: 'check', scope: 'the variation rows', questions: [{ make: windowQ }] },

    sec('tryit'),
    { type: 'tryit', game: 'stockmaster' },
  ],
};
