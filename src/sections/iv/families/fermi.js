import { ivItem } from '../lib.js';

// Word problems whose every input is given: the estimate is pure arithmetic with units.
const T = [
  { key: 'messages', make: (rng) => ({ rate: rng.int(8, 60) * 100, hours: rng.pick([6.5, 8, 8.5, 9, 24]) }),
    text: ({ rate, hours }) => `An exchange gateway handles ${rate.toLocaleString('en-US')} messages per second, steadily, for ${hours} hours a day. How many million messages is that per day?`,
    f: ({ rate, hours }) => (rate * hours * 3600) / 1e6, unit: 'million',
    how: ({ rate, hours }) => `${rate} × ${hours} × 3600 s/h, then divide by 10^6.` },
  { key: 'orders', make: (rng) => ({ traders: rng.int(12, 60), perHour: rng.int(40, 400), hours: rng.pick([7, 8, 8.5, 9]) }),
    text: ({ traders, perHour, hours }) => `A desk of ${traders} traders each sends ${perHour} orders per hour over a ${hours}-hour day. How many orders does the desk send per day?`,
    f: ({ traders, perHour, hours }) => traders * perHour * hours, unit: 'orders',
    how: ({ traders, perHour, hours }) => `${traders} × ${perHour} × ${hours}.` },
  { key: 'storage', make: (rng) => ({ bytes: rng.pick([64, 96, 128, 200, 256]), rate: rng.int(5, 90) * 1000, hours: rng.pick([6.5, 8, 24]) }),
    text: ({ bytes, rate, hours }) => `A market-data feed sends ${rate.toLocaleString('en-US')} updates per second, each ${bytes} bytes, for ${hours} hours. How many gigabytes (10^9 bytes) is that?`,
    f: ({ bytes, rate, hours }) => (bytes * rate * hours * 3600) / 1e9, unit: 'GB',
    how: ({ bytes, rate, hours }) => `${bytes} × ${rate} × ${hours} × 3600, then divide by 10^9.` },
  { key: 'latency', make: (rng) => ({ km: rng.int(300, 9000) }),
    text: ({ km }) => `Light in optical fibre travels at about 200,000 km per second. What is the round-trip time, in milliseconds, over a ${km.toLocaleString('en-US')} km fibre route?`,
    f: ({ km }) => (2 * km / 200000) * 1000, unit: 'ms',
    how: ({ km }) => `Round trip 2 × ${km} km at 200 km per millisecond.` },
  { key: 'notional', make: (rng) => ({ trades: rng.int(200, 5000), size: rng.pick([100, 200, 250, 500, 1000]), price: +rng.float(8, 250).toFixed(2) }),
    text: ({ trades, size, price }) => `A strategy makes ${trades.toLocaleString('en-US')} trades a day, each of ${size} shares at about €${price}. What is the traded notional per day, in € millions?`,
    f: ({ trades, size, price }) => (trades * size * price) / 1e6, unit: '€ million',
    how: ({ trades, size, price }) => `${trades} × ${size} × ${price}, then divide by 10^6.` },
  { key: 'ticks', make: (rng) => ({ spread: rng.pick([0.01, 0.02, 0.05]), shares: rng.int(2, 40) * 1e5, capture: rng.pick([0.2, 0.25, 0.3, 0.4, 0.5]) }),
    text: ({ spread, shares, capture }) => `A market maker trades ${shares.toLocaleString('en-US')} shares a day and earns on average ${capture * 100}% of a ${spread * 100}-cent spread per share. What are its daily earnings in euros?`,
    f: ({ spread, shares, capture }) => spread * capture * shares, unit: '€',
    how: ({ spread, shares, capture }) => `${shares} × ${spread} × ${capture}.` },
];

const fam = {
  id: 'fermi',
  section: 'iv',
  title: 'Estimates from given numbers',
  skill: 'Write the chain of units, multiply rounded numbers, and keep powers of ten straight',
  levels: [2, 3],
  generate(rng, { difficulty = 2 } = {}) {
    const t = rng.pick(T), p = t.make(rng), truth = t.f(p);
    const sd = difficulty === 2 ? 0.03 : 0.05;
    return ivItem(fam, rng, difficulty, {
      text: t.text(p), truth, unit: t.unit,
      coach: { exact: false, belief: { kind: 'lognormal', sd }, note: `Every input is given, so only arithmetic error remains: about ±${sd * 100}% when rounding under time pressure.` },
      steps: [
        { say: t.how(p), why: 'Write the units next to each number; the units tell you what multiplies and what divides.' },
        { say: `Exact value: ${truth.toPrecision(6)} ${t.unit}.`, why: 'Computed from the stated numbers.' },
      ],
      hints: ['Write the chain of units first (per second → per hour → per day).', 'Round each number, multiply, and count the powers of ten separately.'],
      params: { scenario: t.key, ...p },
    });
  },
  // Independent check: recompute with explicit unit conversions in a different order.
  verify(item) {
    const P = item.params;
    const v = {
      messages: () => P.hours * 60 * 60 * P.rate * 1e-6,
      orders: () => P.hours * P.perHour * P.traders,
      storage: () => P.hours * 60 * 60 * P.rate * P.bytes * 1e-9,
      latency: () => (P.km * 2 * 1000) / 2e5,
      notional: () => P.price * P.size * P.trades * 1e-6,
      ticks: () => P.capture * P.spread * P.shares,
    }[P.scenario]();
    return { ok: Math.abs(v / item.truth - 1) < 1e-9, detail: `recomputed ${v}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'Some Intervals items are word problems where every number is given. The risk is not the maths but a slipped power of ten.',
    anchor: 'Unit conversion (seconds → hours → days), which you already do, with one addition: round the numbers so the multiplication is mental.',
    steps: [
      { say: 'Write the chain of units and cancel them.', why: 'Units decide which numbers multiply and which divide.' },
      { say: 'Round, multiply the leading digits, and count powers of ten separately.', why: 'Most errors are an extra or missing zero.' },
      { say: 'Interval: ±3 to 5% for rounding.', why: 'The inputs are exact, so only your arithmetic is uncertain.' },
    ],
    predict: { question: '2,500 messages per second for 8 hours: how many million per day?', answer: '2,500 × 28,800 = 72 million.' },
    rule: 'Units first, leading digits second, powers of ten last; interval ±3 to 5%.',
    contrast: 'Real Fermi questions have unknown inputs and wide intervals; here every input is given, so the interval should be narrow.',
    edge: 'A day of trading (6.5 to 9 hours) is not 24 hours; read which one the question uses.',
  },
};
export default fam;
