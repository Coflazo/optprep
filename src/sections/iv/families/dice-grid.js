import { ivItem } from '../lib.js';

// A 10 x 10 grid of dice faces: count one face, or estimate the total number of pips.
const W = 420, H = 300;

const fam = {
  id: 'dice-grid',
  section: 'iv',
  title: 'Dice grid: counts and totals',
  skill: 'Estimate totals as count × average, then correct with a quick scan',
  levels: [2, 3],
  generate(rng, { difficulty = 2 } = {}) {
    const cell = 27, x0 = (W - 10 * cell) / 2, y0 = (H - 10 * cell) / 2;
    const pips = Array.from({ length: 100 }, () => rng.int(1, 6));
    const items = pips.map((p, k) => ({ x: +(x0 + ((k % 10) + 0.5) * cell).toFixed(1), y: +(y0 + (Math.floor(k / 10) + 0.5) * cell).toFixed(1), r: 11, shape: 'die', pips: p }));
    const visual = { type: 'dots', width: W, height: H, grid: { x: x0, y: y0, rows: 10, cols: 10, cell }, items, label: 'A 10 by 10 grid of dice' };
    let text, truth, sd, steps, unit, face = null;
    if (difficulty === 2) {
      face = rng.int(1, 6);
      truth = pips.filter((p) => p === face).length;
      if (truth === 0) return fam.generate(rng.fork('retry'), { difficulty });
      text = `How many of the 100 dice show ${face === 1 ? 'a one' : ['', '', 'a two', 'a three', 'a four', 'a five', 'a six'][face]}?`;
      sd = Math.max(1.5, 0.1 * truth);
      unit = 'dice';
      steps = [
        { say: `Expect about 100/6 ≈ 17; then scan row by row counting only ${face}s.`, why: 'The prior (1/6 of 100) tells you the scale; the scan corrects it.' },
        { say: `True count: ${truth}.`, why: 'Counted from the grid.' },
      ];
    } else {
      truth = pips.reduce((a, b) => a + b, 0);
      text = 'What is the total number of pips on all 100 dice?';
      sd = 12;
      unit = 'pips';
      steps = [
        { say: 'Baseline: 100 × 3.5 = 350.', why: 'Expected pips per die is 3.5; the spread of the total from chance alone is about √(100 × 35/12) ≈ 17.' },
        { say: 'Scan for excess high or low faces (e.g. count sixes and ones) and adjust the baseline.', why: 'Each extra six over a one shifts the total by 5; a quick scan halves the uncertainty.' },
        { say: `True total: ${truth}.`, why: 'Summed from the grid.' },
      ];
    }
    return ivItem(fam, rng, difficulty, {
      text, visual, truth, unit,
      coach: { exact: false, belief: { kind: 'normal', sd: Number(sd.toPrecision(2)) }, note: difficulty === 2 ? 'Counting one face among 100 dice in 45 seconds: expect to be off by one or two.' : 'Baseline 350 has a chance spread of ±17; a quick scan brings a prepared estimate to about ±12.' },
      steps, hints: ['What would you expect before looking? 100 dice, each face 1/6 of the time.', 'Scan row by row and adjust your expectation.'],
      params: { scenario: difficulty === 2 ? 'count-face' : 'total-pips', face, pips },
    });
  },
  verify(item) {
    const pips = item.prompt.visual.items.map((i) => i.pips);
    const v = item.params.scenario === 'count-face' ? pips.filter((p) => p === item.params.face).length : pips.reduce((a, b) => a + b, 0);
    return { ok: v === item.truth && pips.length === 100 && pips.every((p) => p >= 1 && p <= 6), detail: `recomputed ${v}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'A reported item shows a 10 × 10 grid of dice. Totals are fastest as count × average plus a correction.',
    anchor: 'Expected value (3.5 per die) meets visual counting: the expectation gives a baseline, the picture refines it.',
    steps: [
      { say: 'Start from the expectation: 100 dice × 3.5 = 350, or 100/6 ≈ 17 of any one face.', why: 'A prior anchors the scale and catches gross miscounts.' },
      { say: 'Correct by scanning for deviations: extra sixes push the total up, extra ones pull it down.', why: 'Counting deviations is faster than summing 100 numbers.' },
    ],
    predict: { question: 'You count 22 sixes and 12 ones, the rest look balanced. Estimate the total.', answer: 'Roughly 350 + (22 − 17) × 2.5 − (12 − 17) × 2.5 ≈ 375: each extra six adds about 2.5 over average, each missing one also adds 2.5.' },
    rule: 'Total ≈ n × mean + scanned correction; interval ± about 1.3 × your remaining error.',
    contrast: 'The chance spread of the total (±17) is not your error bar after scanning; scanning is what earns a narrower interval.',
    edge: 'Counting a single face exactly is feasible (17 of 100); counting all pips exactly is not in 60 seconds.',
  },
};
export default fam;
