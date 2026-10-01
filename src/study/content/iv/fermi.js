// Intervals: word-problem estimates where every input is given (message rates, orders, storage,
// latency, notional, spread capture). Chain the units, split mantissas from powers of ten, round
// with a ledger, convert once, and type a 3 to 5% band.
import { sec, dec, round, sig, num, mc, ivq, bestLog } from './scoring-and-width.js';

const B3 = bestLog(0.03), B5 = bestLog(0.05);
const CH = { rate: 45000, bytes: 128, hours: 6.5 }; CH.bytesTot = CH.rate * CH.bytes * CH.hours * 3600; CH.gb = CH.bytesTot / 1e9; CH.gib = CH.bytesTot / 2 ** 30; CH.noSec = (CH.rate * CH.bytes * CH.hours) / 1e9;
const sci = (x) => { const k = Math.floor(Math.log10(x) + 1e-12); return { m: x / 10 ** k, k }; };
const LED = [['updates per second', CH.rate], ['bytes per update', CH.bytes], ['hours', CH.hours], ['seconds per hour', 3600]].map(([n, v]) => ({ n, v, ...sci(v) }));
const LEDm = LED.reduce((a, r) => a * r.m, 1), LEDk = LED.reduce((a, r) => a + r.k, 0);
const MS = { rate: 2500, hours: 8 }; MS.v = (MS.rate * MS.hours * 3600) / 1e6;
const TA = { km: 5800 }; TA.one = TA.km / 200; TA.rt = 2 * TA.one;
const ER = { rate: 30000, bytes: 200, hours: 8 }; ER.v = (ER.rate * ER.bytes * ER.hours * 3600) / 1e9;
ER.parts = [ER.rate, ER.bytes, ER.hours * 3600].map(sci); ER.m = ER.parts.reduce((a, r) => a * r.m, 1); ER.k = ER.parts.reduce((a, r) => a + r.k, 0);

const secQ = (rng) => { const h = rng.pick([6.5, 7, 8, 8.5, 9, 24]); return { type: 'number', q: `How many seconds are there in ${h} hours?`, answer: h * 3600, hints: ['3,600 seconds per hour.'], explain: `${h} × 3,600 = ${num(h * 3600)}.` }; };
const expQ = (rng) => { const a = rng.pick([2.5, 4, 6, 1.2, 3.6]) * 10 ** rng.int(3, 4), b = rng.pick([2, 3, 5, 8]) * 10 ** rng.int(1, 2), c = 3600; const v = a * b * c; const k = Math.floor(Math.log10(v) + 1e-12); return { type: 'number', q: `${num(a)} × ${num(b)} × 3,600 = m × 10^{k} with m between 1 and 10. What is k?`, answer: k, hints: ['Write each number as m × 10^{k}.', 'Add the exponents; bump by one if the mantissas multiply past 10.'], explain: `${num(v)} = ${dec(v / 10 ** k, 3)} × 10^{${k}}.` }; };
const msgQ = (rng) => { const rate = rng.int(8, 60) * 100, hours = rng.pick([6.5, 8, 9, 24]); const v = (rate * hours * 3600) / 1e6; return { type: 'number', q: `A gateway handles ${num(rate)} messages per second for ${hours} hours. How many million messages? (within 2%)`, answer: round(v, 4), tolerance: round(0.02 * v, 4), hints: [`${hours} hours = ${num(hours * 3600)} seconds.`, `${num(rate)} × ${num(hours * 3600)}, then ÷ 10^{6}.`], explain: `${num(rate)} × ${num(hours * 3600)} = ${num(rate * hours * 3600)} = ${dec(v, 2)} million.` }; };
const unitQ = (rng) => { const km = rng.pick([900, 1500, 3000, 4200, 6400]); return { hinge: true, ...mc({ q: `Light in fibre travels about 200,000 km per second. Round-trip time over a ${num(km)} km route, in milliseconds?`, right: String((2 * km) / 200), wrong: [[String(km / 200), 'one way only: a round trip covers the route twice'], [String((2 * km) / 200000), 'answered in seconds, not milliseconds'], [String((2 * km) / 20), 'slipped a power of ten: 200,000 km/s is 200 km per millisecond']], explain: `200,000 km/s = 200 km per ms. Round trip ${num(2 * km)} km ÷ 200 = ${(2 * km) / 200} ms.` }, rng) }; };
const bandQ = (rng) => {
  const s = rng.pick([0.03, 0.05]), b = s === 0.03 ? B3 : B5, m = rng.pick([28.1, 72, 106.8, 6000, 13.3]);
  const opt = [sig(m / b.f, 4), sig(m * b.f, 4)], pt = [m, m], ten = [sig(m / 10, 4), sig(m * 10, 4)], half = [sig(m * 0.995, 4), sig(m * 1.005, 4)];
  return { hinge: true, ...mc({ q: `All inputs were given; your rounded chain gives ${m}, good to about ${Math.round(s * 100)}%. What do you type?`, right: `[${opt.join(', ')}]`, wrong: [[`[${pt.join(', ')}]`, 'a point: rounding the inputs makes the chain approximate'], [`[${ten.join(', ')}]`, 'a factor-of-ten band: that is for real Fermi questions with unknown inputs'], [`[${half.join(', ')}]`, `±0.5% for a ${Math.round(s * 100)}% rounding error`]], explain: `×/÷ ${dec(b.f, 3)} around ${m}: expected ${dec(b.e, 2)}.` }, rng) };
};

export default {
  id: 'iv/fermi',
  book: 'iv',
  kind: 'family',
  family: 'fermi',
  title: 'Estimates from given numbers',
  summary: 'Every input is given, so only arithmetic can go wrong: write the chain of units, split mantissas from powers of ten, round with a ledger, convert once, band 3 to 5%.',
  prerequisites: ['iv/estimation-tricks', 'iv/mental-product'],
  objectives: [
    'Write the chain of units for a rate-and-time word problem and cancel them correctly',
    'Keep powers of ten separate from mantissas so no zero slips',
    'Convert to the asked unit once, at the end (million, GB = 10^{9} bytes, milliseconds, euros)',
    'Type a 3 to 5% band, not a point and not a factor-of-ten band',
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching: a market-data feed sends ${num(CH.rate)} updates per second, each ${CH.bytes} bytes, for ${CH.hours} hours. How many gigabytes (10^{9} bytes) is that? Two approaches, then an interval.`,
      attempts: [
        { id: 'hours', label: 'Forgot seconds per hour', approach: `Multiplied ${num(CH.rate)} × ${CH.bytes} × ${CH.hours} and got about ${dec(CH.noSec, 1)} GB.`, breaksAt: 'The rate is per second and the time is in hours: 3,600 seconds per hour must appear.' },
        { id: 'zeros', label: 'Lost a power of ten', approach: 'Multiplied the digits and guessed the zeros at the end.', breaksAt: 'Count the powers of ten separately, factor by factor.' },
        { id: 'gib', label: 'Divided by 1,024³', approach: `Used 2^{30} bytes per GB and got ${dec(CH.gib, 1)}.`, breaksAt: 'The question defines 1 GB as 10^{9} bytes; use its definition.' },
      ],
      answer: `${num(CH.rate)} × ${CH.bytes} × ${CH.hours} × 3,600 = ${num(CH.bytesTot)} bytes = ${dec(CH.gb, 2)} GB; a 3 to 5% band`,
      explain: `Write the units: updates/s × bytes/update × s/h × h = bytes. Then count powers of ten separately: ${LED.map((r) => `${dec(r.m, 3)} × 10^{${r.k}}`).join(' × ')}.` },
    { type: 'text', text: 'The cue: a word problem where **every number is given**: a rate (messages per second, orders per hour, updates per second), a duration, maybe a size or a price, and a unit to answer in (million, GB, ms, € million). Nothing is unknown; only the arithmetic can fail. That makes these the most controllable estimates in the section: with a clean chain, the answer is within a couple of percent every time.' },
    { type: 'list', items: ['"An exchange gateway handles 2,500 messages per second for 8 hours a day. How many million messages per day?"', '"Light in fibre travels about 200,000 km per second. Round-trip time over a 5,800 km route, in ms?"', '"A market maker trades 1,200,000 shares a day and earns 25% of a 2-cent spread per share. Daily earnings in euros?"'] },
    { type: 'check', scope: 'the recognition cues above', questions: [
      mc({ q: 'Which question belongs to this lesson (all inputs given)?', right: '30 traders, 120 orders an hour each, 8 hours: total?', wrong: [['How many piano tuners work in Amsterdam today?', 'a real Fermi question: the inputs are unknown'], ['Estimate 8.3 × 68 × 1.6 with friendly numbers', 'bare arithmetic: iv/mental-product'], ['Estimate the square root of 59430', 'a root: iv/powers-roots']], explain: 'A chain of given rates and times, with a unit to answer in.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'These items look easy and are lost to one slipped zero, a forgotten 3,600, or a round trip counted one way. Because every input is exact, the right band is narrow (3 to 5%), so a careful chain scores about 0.8 to 0.85; a sloppy one scores 0. The difference is never cleverness. It is writing the units down and counting the zeros on purpose.' },

    sec('anchor'),
    { type: 'text', text: 'This is the Fermi chain from the estimation-tricks lesson, with **one change**: no factor is unknown, so there is no geometric mean and no wide band. What remains is the unit chain, the powers of ten, and the rounding ledger. Seconds per hour is the conversion that appears in almost every one of these questions.' },
    { type: 'check', scope: 'seconds in a time span', questions: [{ make: secQ }] },

    sec('picture'),
    { type: 'text', text: 'Write the chain with its units, then cancel. Each unit that appears on top and bottom disappears; what is left must be the unit the question asks for. If it is not, a conversion is missing.' },
    { type: 'diagram', diagram: 'flow', spec: { root: 'r', nodes: [
      { id: 'r', text: `${num(CH.rate)} updates per second`, kind: 'q' },
      { id: 'b', text: `× ${CH.bytes} bytes per update`, kind: 'q' },
      { id: 's', text: '× 3,600 seconds per hour', kind: 'q' },
      { id: 'h', text: `× ${CH.hours} hours`, kind: 'q' },
      { id: 'g', text: `= ${num(CH.bytesTot)} bytes ÷ 10^{9} = ${dec(CH.gb, 2)} GB`, kind: 'a' },
    ], edges: [{ from: 'r', to: 'b', label: 'updates cancel' }, { from: 'b', to: 's', label: 'seconds cancel' }, { from: 's', to: 'h', label: 'hours cancel' }, { from: 'h', to: 'g', label: 'bytes to GB' }] }, caption: 'The unit chain for the challenge: every unit cancels except bytes, and the last step converts bytes to the asked unit once.' },
    { type: 'check', scope: 'the unit chain', questions: [{ make: msgQ }] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['factor', 'number', 'mantissa', 'power of ten'], rows: [...LED.map((r) => [r.n, num(r.v), dec(r.m, 3), `10^${r.k}`]), ['product', num(CH.bytesTot), dec(LEDm, 3), `10^${LEDk}`]] }, caption: `Mantissas multiply (${LED.map((r) => dec(r.m, 2)).join(' × ')} ≈ ${dec(LEDm, 1)}) and exponents add (${LED.map((r) => r.k).join(' + ')} = ${LEDk}), so the product is about ${dec(LEDm, 1)} × 10^{${LEDk}} bytes, ${dec(CH.gb, 1)} GB.` },
    { type: 'check', scope: 'mantissas and exponents', questions: [{ make: expQ }] },
    { type: 'text', text: 'The last step converts to the asked unit, and each question states its own definitions: gigabytes as 10^{9} bytes, a speed in km per second, a spread in cents. Use exactly those, and look for the words that double or halve a quantity, such as "round trip".' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['span or unit', 'value'], rows: [['1 hour', `${num(3600)} s`], ['6.5-hour trading day', `${num(6.5 * 3600)} s`], ['8-hour day', `${num(8 * 3600)} s`], ['24-hour day', `${num(24 * 3600)} s`], ['1 million', '10^6'], ['1 GB (as defined)', '10^9 bytes'], ['200,000 km/s', '200 km per ms'], ['1 cent', '€0.01']] }, caption: 'Conversions that recur. Know the seconds in the usual day lengths by heart: they are where most zeros slip.' },
    { type: 'check', scope: 'conversions', questions: [{ make: unitQ }] },

    sec('derivation'),
    { type: 'text', text: 'Five moves. The chain decides what multiplies; the powers of ten keep the size right; the ledger keeps the digits right; the conversion answers in the asked unit; the band covers only your rounding.' },
    { type: 'steps', steps: [
      { answers: 'hours', say: 'Write the chain of numbers with their units, and cancel. Rates per second times hours need 3,600 seconds per hour.', why: 'Units decide which numbers multiply and which divide; a leftover unit shows a missing conversion.',
        checks: [{ make: secQ }] },
      { answers: 'zeros', say: 'Split each number into a mantissa (1 to 10) and a power of ten. Multiply the mantissas, add the exponents.', why: 'Mantissa arithmetic is small; exponents are counted, not guessed.',
        checks: [{ make: expQ }] },
      { say: 'Round the mantissas to friendly values, note each change in percent, multiply, and divide out the net change.', why: 'The rounding ledger from mental products keeps the digits within about 1%.',
        checks: [{ make: msgQ }] },
      { answers: 'gib', say: 'Convert once, at the end, to the unit the question asks for, using its own definitions (1 GB = 10^{9} bytes, ms, € million). Watch for round trips and cents.', why: 'One conversion is one chance to slip; the question\'s definition overrides habits like 1,024.',
        checks: [{ make: unitQ }] },
      { say: `Band: the inputs are exact, so only rounding remains: ×/÷ about ${dec(B3.f, 2)} (3%) to ${dec(B5.f, 2)} (5%).`, why: 'A point misses after rounding; a factor-of-ten band is for questions with unknown inputs.',
        checks: [{ make: bandQ }] },
    ] },
    { type: 'explain', prompt: 'Why should the band here be so much narrower than for a classic Fermi question like "piano tuners in a city"?', model: 'In a classic Fermi question each input is a guess that can be off by a factor of two or more, so the answer can be off by a factor of several and the band must be wide. Here every input is given exactly; the only error is from rounding the arithmetic, a few percent. The band should match the actual uncertainty, which is small.', points: ['Classic Fermi inputs are guesses; these are given', 'Only rounding error remains, a few percent', 'The band follows the real uncertainty'] },

    sec('worked'),
    { type: 'worked', family: 'fermi', section: 'iv', difficulty: 2, seed: 'a', explainAt: [0], intro: 'A rate and a time. Chain the units, compute, then choose the band.' },
    { type: 'worked', family: 'fermi', section: 'iv', difficulty: 3, seed: 'b', fade: 1, intro: 'A bigger chain. The set-up is given; the band is yours.' },
    { type: 'thinkaloud', problem: `Light in fibre travels about 200,000 km per second. What is the round-trip time, in milliseconds, over a ${num(TA.km)} km route?`, lines: [
      { t: 0, say: 'I see a distance, a speed and "milliseconds": a unit chain. All inputs given, so a narrow band.' },
      { t: 4, say: '200,000 km per second is 200 km per millisecond.' },
      { t: 9, say: `${num(TA.km)} ÷ 200 = ${TA.one} ms.`, slip: true },
      { t: 13, say: `Wait: "round trip" means there and back: ${num(2 * TA.km)} km, so ${TA.rt} ms.` },
      { t: 18, say: `Check: transatlantic pings are tens of milliseconds, so ${TA.rt} is the right size.` },
      { t: 22, say: `The inputs are given; allow about 5% for "about 200,000": [${dec(TA.rt / B5.f, 1)}, ${dec(TA.rt * B5.f, 1)}].` },
    ] },

    sec('predict'),
    { type: 'predict', question: `${num(MS.rate)} messages per second for ${MS.hours} hours: how many million messages?`, answer: `${num(MS.rate)} × ${num(MS.hours * 3600)} = ${num(MS.rate * MS.hours * 3600)} = ${MS.v} million.`, explain: `${MS.hours} hours is ${num(MS.hours * 3600)} seconds; ${dec(sci(MS.rate).m, 2)} × 10^{${sci(MS.rate).k}} × ${dec(sci(MS.hours * 3600).m, 3)} × 10^{${sci(MS.hours * 3600).k}} = ${dec(sci(MS.rate * MS.hours * 3600).m, 2)} × 10^{${sci(MS.rate * MS.hours * 3600).k}}.` },

    sec('traps'),
    { type: 'traps', family: 'fermi', section: 'iv', extra: [
      { belief: 'Per second × hours needs no conversion.', fix: 'Multiply by 3,600 seconds per hour: the units must cancel.' },
      { belief: 'A trading day is 24 hours.', fix: 'Use the hours the question states (6.5, 8, 9 or 24).' },
      { belief: 'A round trip is the route once.', fix: 'There and back: twice the distance.' },
      { belief: 'A cent is €0.1, or GB means 1,024³ bytes here.', fix: 'A cent is €0.01; use the question\'s definition of GB.' },
    ] },
    { type: 'erroneous', problem: `A candidate computes the data volume of ${num(ER.rate)} updates per second, ${ER.bytes} bytes each, for ${ER.hours} hours, in GB. One step is wrong.`, steps: [
      `${ER.hours} hours = ${num(ER.hours * 3600)} seconds.`,
      `Bytes: ${num(ER.rate)} × ${ER.bytes} × ${num(ER.hours * 3600)} = ${ER.parts.map((r) => `${dec(r.m, 3)} × 10^{${r.k}}`).join(' × ')} = ${dec(ER.m, 2)} × 10^{${ER.k - 1}}.`,
      `In GB (10^{9} bytes): ${dec(ER.m, 2)} × 10^{${ER.k - 1}} ÷ 10^{9} = ${dec(ER.m * 10 ** (ER.k - 1 - 9), 2)} GB.`,
      `Type a 3% band around ${dec(ER.m * 10 ** (ER.k - 1 - 9), 2)}.`,
    ], errorStep: 1, explain: `The exponents add to ${ER.parts.map((r) => r.k).join(' + ')} = ${ER.k}, not ${ER.k - 1}: the bytes are ${num(ER.rate * ER.bytes * ER.hours * 3600)} = ${dec(ER.m / 10, 4)} × 10^{${ER.k + 1}}, so the answer is ${dec(ER.v, 1)} GB. One lost power of ten makes the band miss by a factor of 10.` },
    { type: 'check', scope: 'the named traps', questions: [
      mc({ q: 'A candidate answers 29 ms for a 5,800 km fibre round trip at 200 km per ms. Which belief?', right: 'A round trip is the route once', wrong: [['A trading day is 24 hours', 'no day length is involved'], ['Per second × hours needs no conversion', 'the speed was already per millisecond'], ['GB means 1,024³ bytes', 'no bytes are involved']], explain: `5,800 ÷ 200 = 29 ms is one way; there and back is ${TA.rt} ms.` }),
    ] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: `Memorise the seconds: 1 hour = 3,600, a 6.5-hour day = ${num(6.5 * 3600)}, 8 hours = ${num(8 * 3600)}, 24 hours = ${num(24 * 3600)}. Then a rate per second times a day is one multiplication.` },
    { type: 'callout', tone: 'speed', text: 'Budget: 10 seconds to write the chain, 25 to multiply mantissas and add exponents, 10 to convert and type. Before typing, check the size against something you know (a day of messages in millions, a transatlantic ping in tens of ms).' },
    { type: 'check', scope: 'seconds per day', questions: [{ make: secQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: `All inputs given → chain the units and cancel → mantissas multiply, exponents add → ledger for rounding → convert once to the asked unit → band ×/÷ ${dec(B3.f, 2)} to ${dec(B5.f, 2)}.` },

    sec('contrast'),
    { type: 'compare', columns: ['Question', 'Inputs', 'Main risk', 'Band'], rows: [
      ['given-number chain (this lesson)', 'all stated', 'a slipped zero or conversion', `×/÷ ${dec(B3.f, 2)} to ${dec(B5.f, 2)}`],
      ['classic Fermi (piano tuners)', 'guessed', 'each guess off by ×2 or more', 'very wide'],
      ['bare arithmetic (iv/mental-product)', 'numbers only', 'rounding direction', `×/÷ ${dec(bestLog(0.02).f, 2)} to ${dec(B3.f, 2)}`],
    ] },
    { type: 'variation', base: `Base: ${num(MS.rate)} messages per second for ${MS.hours} hours = ${MS.v} million.`, rows: [
      { change: `${MS.hours} hours become 24 hours`, effect: `Three times as long: ${(MS.rate * 24 * 3600) / 1e6} million.` },
      { change: 'The rate halves', effect: `Half the messages: ${MS.v / 2} million. Every factor in a chain scales the answer directly.` },
      { same: true, change: `The rate is stated as ${num(MS.rate * 60)} per minute instead of ${num(MS.rate)} per second`, effect: `No change: the same rate in other units, so still ${MS.v} million once the minutes cancel.` },
      { fusion: true, change: 'The rate triples AND the day shrinks from 8 to 6.5 hours', effect: `The factors combine: × 3 × 6.5/8 = × ${dec((3 * 6.5) / 8, 4)}, so ${dec((MS.rate * 3 * 6.5 * 3600) / 1e6, 1)} million.` },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a rate stated per minute or per day changes the conversion, not the method, and the chain shows it at once. "Steadily" means the average rate applies all day. If an answer comes out absurd (a billion GB, a 0.03 ms transatlantic ping), a power of ten slipped: recount the exponents.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: unit chains price every Orderbooks trade (lots × contract size × price), turn Beat the Odds rates into counts, and are the backbone of classic Fermi questions, where the only difference is that the inputs are guesses.' },
    { type: 'check', scope: 'contrast and edge cases', questions: [
      mc({ q: 'Which question needs the widest band?', right: 'How many coffees are sold in Amsterdam each day?', wrong: [['3,000 orders per hour for 8 hours: orders?', 'every input is given: narrow band'], ['2,500 messages per second for 8 hours: million?', 'every input is given: narrow band'], ['5,800 km fibre round trip at 200 km per ms: ms?', 'every input is given: narrow band']], explain: 'Only the coffee question has unknown inputs, which multiply their uncertainties.' }),
    ] },
    { type: 'transfer',
      near: { make: (rng) => { const t = rng.int(12, 60), ph = rng.int(40, 400), h = rng.pick([7, 8, 8.5, 9]); const v = t * ph * h; return { type: 'number', q: `A desk of ${t} traders each sends ${ph} orders per hour over a ${h}-hour day. How many orders per day? (within 2%)`, answer: v, tolerance: 0.02 * v, explain: `${t} × ${ph} × ${h} = ${num(v)}.` }; } },
      far: { type: 'number', q: 'Outside the OA: streaming uses 5 MB per minute, 3 hours a day, for 30 days, at €0.02 per MB. Monthly cost in euros?', answer: 0.02 * 5 * 60 * 3 * 30, tolerance: 1e-9, explain: `5 MB/min × 60 min/h × 3 h/day × 30 days = ${num(5 * 60 * 3 * 30)} MB; × €0.02 = €${0.02 * 5 * 60 * 3 * 30}.` },
      principle: mc({ q: 'Which idea carried over from messages to streaming costs?', right: 'Chain the units until they cancel', wrong: [['Use the geometric mean of bounds', 'all inputs were given'], ['Band by a factor of ten', 'the inputs were exact'], ['Split a factor into easy parts', 'helpful arithmetic, but not the shared structure']], explain: 'Both were a product of rates and times whose units cancel to the asked unit.' }) },

    sec('tryit'),
    { type: 'tryit', family: 'fermi', section: 'iv', count: 3 },
  ],
};
