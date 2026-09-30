// First to k wins (best-of series): imagine all 2k − 1 games are played, then it is a binomial tail.
// Every number shown is computed here, never typed by hand.
import { SECTION_TITLES } from '../../schema.js';
import { Q } from '../../../core/rational.js';
import { SECTIONS } from '../../../../config/sections.js';

const S = (key) => ({ type: 'section', key, title: SECTION_TITLES[key] });
// Choice check with shuffled options; every wrong option names the belief behind it.
function mc(rng, q, right, wrongs, explain, extra = {}) {
  const seen = new Set([String(right)]);
  const opts = [{ t: String(right), ok: true }];
  for (const [t, trap] of wrongs) if (!seen.has(String(t)) && opts.length < 6) { seen.add(String(t)); opts.push({ t: String(t), trap }); }
  const order = rng.shuffle(opts);
  return { type: 'choice', q, options: order.map((o) => o.t), answer: order.findIndex((o) => o.ok), traps: Object.fromEntries(order.flatMap((o, i) => (o.trap ? [[i, o.trap]] : []))), explain, ...extra };
}

const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const qpow = (x, k) => { let r = Q.of(1); for (let i = 0; i < k; i++) r = r.mul(x); return r; };
const one = Q.of(1);
// P(A wins at least k of 2k − 1 games): the series winner.
const winSeries = (p, k) => { const n = 2 * k - 1; let s = Q.of(0); for (let j = k; j <= n; j++) s = s.add(Q.of(C(n, j)).mul(qpow(p, j)).mul(qpow(one.sub(p), n - j))); return s; };
const fullLength = (p, k) => Q.of(C(2 * k - 2, k - 1)).mul(qpow(p.mul(one.sub(p)), k - 1));
const exactlyK = (p, k) => { const n = 2 * k - 1; return Q.of(C(n, k)).mul(qpow(p, k)).mul(qpow(one.sub(p), n - k)); };
const winNum = (p, k) => { const n = 2 * k - 1; let s = 0; for (let j = k; j <= n; j++) s += C(n, j) * p ** j * (1 - p) ** (n - j); return s; };
const d3 = (x) => (Math.round((x instanceof Q ? x.toNumber() : x) * 1000) / 1000).toFixed(3);
const pct = (x) => `${Math.round((x instanceof Q ? x.toNumber() : x) * 1000) / 10}%`;
const HALF = Q.of(1, 2);
const P35 = Q.of(3, 5);
const PS = [Q.of(3, 5), Q.of(2, 3), Q.of(2, 5), Q.of(3, 4)];
// All 8 full-length best-of-3 sequences with the series winner.
const seqs3 = ['AAA', 'AAB', 'ABA', 'ABB', 'BAA', 'BAB', 'BBA', 'BBB'];
const realStop = (s) => { let a = 0, b = 0; for (let i = 0; i < s.length; i++) { if (s[i] === 'A') a++; else b++; if (a === 2 || b === 2) return s.slice(0, i + 1); } return s; };
const GRID = Array.from({ length: 21 }, (_, i) => i / 20);

export default {
  id: 'bto/race-to-k',
  book: 'bto',
  kind: 'family',
  family: 'race-to-k',
  title: 'First to k wins',
  summary: 'Imagine all 2k − 1 games are played: the series winner is whoever wins at least k of them.',
  prerequisites: ['bto/coin-sequences', 'prob/discrete-distributions'],
  objectives: [
    'Turn a best-of-(2k − 1) series into "at least k wins out of 2k − 1 imagined games"',
    'Compute the chance a series goes the full distance, C(2k − 2, k − 1)(pq)^(k−1)',
    'Explain why a series favours the stronger side more than a single game does',
    'Avoid the three classic slips: one order only, "exactly k" instead of "at least k", equally likely lengths',
  ],
  blocks: [
    S('recognise'),
    { type: 'challenge', q: 'Before any teaching: two evenly matched teams play a best-of-7 series (first to 4 wins). What is the probability that it goes to a seventh game? Try two approaches.', answer: `C(6,3)/2⁶ = ${fullLength(HALF, 4)}`, explain: `Game 7 happens exactly when the first 6 games split 3-3: C(6,3) = ${C(6, 3)} of the 64 equally likely win/loss strings. If you got 1/64 you counted one order; if you got 1/4 you treated the four possible lengths as equally likely.` },
    { type: 'text', text: 'Two sides play repeated independent games, and the contest ends as soon as one side has **k wins**: "best of 5" is first to 3, "best of 7" is first to 4. The question asks who wins the series, or whether it goes the full distance.' },
    { type: 'list', items: ['"Two equally strong teams play a best-of-seven series. What is the chance it goes to a seventh game?"', '"Team A wins each game with probability 3/5. What is the chance it wins a best-of-five?"', '"First to 3 wins: a player who wins each point with 2/3. Probability she wins the match?"'] },
    { type: 'text', text: 'Not this lesson: a fixed number of games counted afterwards (bto/coin-sequences), and races to a single success like "first to throw a six" (bto/first-success).' },
    { type: 'check', scope: 'the recognition cues above', questions: [
      { type: 'choice', q: 'Which question belongs to this lesson?', options: ['Play until someone has 3 wins; each game 60/40: who wins?', 'Play exactly 5 games, 60/40: probability of exactly 3 wins', 'Alternate throwing a die; first six wins', 'Flip until HH appears'], answer: 0, traps: { 1: 'a fixed number of games: a plain binomial count', 2: 'a race to one success: bto/first-success', 3: 'a pattern wait: bto/pattern-waiting' }, explain: 'First to 3 wins: a series that stops early.' },
    ] },

    S('why'),
    { type: 'text', text: 'A series looks like it needs a game tree with branches that stop at different depths. One idea removes the tree: pretend the series always runs its full length. That turns every series question into a count of strings you already know from coin flips. It also explains the fact traders care about: a longer contest favours the stronger side.' },

    S('anchor'),
    { type: 'text', text: 'You know how to count win/loss strings of a fixed length: exactly j wins in n games is C(n, j) strings, each with probability p^j q^(n−j), where q = 1 − p. A series is that with **one change**: it stops as soon as someone reaches k. The trick is to show that the stop does not matter.' },
    { type: 'check', scope: 'binomial strings: C(n, j) p^j q^(n−j)', questions: [
      { make: (rng) => { const n = rng.int(4, 6); const j = rng.int(1, n - 1); return { type: 'number', q: `A fair game is played ${n} times. How many of the 2^${n} win/loss strings have exactly ${j} wins?`, answer: C(n, j), hints: ['A string is fixed by which games are wins.', `C(${n},${j}).`], explain: `C(${n},${j}) = ${C(n, j)}.` }; } },
    ] },

    S('picture'),
    { type: 'text', text: 'Draw a best-of-3 (first to 2) where A wins each game with 3/5. The tree stops as soon as someone has 2 wins, so its branches have different lengths. The marked leaves are A\'s series wins.' },
    { type: 'diagram', diagram: 'tree', spec: { root: { label: 'start', children: [
      { p: '3/5', label: 'A wins game 1', children: [{ p: '3/5', label: 'A: 2-0', mark: true }, { p: '2/5', label: '1-1', children: [{ p: '3/5', label: 'A: 2-1', mark: true }, { p: '2/5', label: 'B: 1-2' }] }] },
      { p: '2/5', label: 'B wins game 1', children: [{ p: '3/5', label: '1-1', children: [{ p: '3/5', label: 'A: 2-1', mark: true }, { p: '2/5', label: 'B: 1-2' }] }, { p: '2/5', label: 'B: 0-2' }] },
    ] }, total: winSeries(P35, 2).toString() }, caption: `A wins with 9/25 + 18/125 + 18/125 = ${winSeries(P35, 2)} ≈ ${d3(winSeries(P35, 2))}, more than the single-game 3/5.` },
    { type: 'check', scope: 'reading the stopping tree', questions: [
      { type: 'choice', q: 'From the tree: P(the best-of-3 goes to a third game)?', options: [fullLength(P35, 2).toString(), Q.of(6, 25).toString(), '1/2', '1/3'], answer: 0, traps: { 1: 'counted only one order of the 1-1 split', 2: 'treated game 3 as a coin flip', 3: 'treated the three possible endings as equally likely' }, explain: `1-1 after two games: 3/5 × 2/5 + 2/5 × 3/5 = ${fullLength(P35, 2)}.` },
    ] },
    { type: 'text', text: 'Now play all 3 games **every time**, even when the series is already decided. Each full string still has an obvious series winner, and the extra games never change it: once A has 2 wins, B can have at most 1 of the 3.' },
    { type: 'diagram', diagram: 'table', spec: { columns: ['all 3 games', 'real series stops at', 'series winner', 'A wins ≥ 2 of 3?'], rows: seqs3.map((s) => [s, realStop(s), realStop(s).split('A').length - 1 >= 2 ? 'A' : 'B', [...s].filter((c) => c === 'A').length >= 2 ? 'yes' : 'no']) }, caption: 'Every row agrees: A wins the real series exactly when A wins at least 2 of the 3 imagined games. The stop only hides games that cannot matter.' },
    { type: 'check', scope: 'the imagine-all-games equivalence', questions: [
      { type: 'choice', q: 'Best of 7. Which event is the same as "A wins the series"?', options: ['A wins at least 4 of 7 imagined games', 'A wins exactly 4 of 7 games', 'A wins the first 4 games', 'A wins game 7'], answer: 0, traps: { 1: 'A also wins the series with 5, 6 or 7 of the 7 imagined games', 2: 'that is one way to win, not all of them', 3: 'game 7 often never matters' }, explain: 'Exactly one side can win 4 or more of 7, and that side reached 4 first.' },
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 1, label: 'p = chance A wins one game' }, y: { min: 0, max: 1, label: 'P(A wins)' }, curves: [
      { label: 'one game', points: GRID.map((p) => [p, p]) },
      { label: 'best of 3', points: GRID.map((p) => [p, winNum(p, 2)]) },
      { label: 'best of 7', points: GRID.map((p) => [p, winNum(p, 4)]) },
    ], vlines: [{ x: 0.5, label: 'even' }], markers: [{ x: 0.6, y: winNum(0.6, 4), label: `p = 0.6: ${d3(winNum(0.6, 4))}` }] }, caption: 'Longer series bend the curve into an S: the stronger side\'s edge grows with the length, the weaker side\'s chance shrinks, and even teams stay at 1/2.' },
    { type: 'check', scope: 'the S-curve', questions: [
      { type: 'choice', q: 'A team wins each game with 0.4. Its chance in a best-of-7 is:', options: ['below 0.4', 'exactly 0.4', 'above 0.4', 'exactly 0.5'], answer: 0, traps: { 1: 'a series amplifies edges; it does not copy the single-game chance', 2: 'the amplification works against the weaker side', 3: 'only even teams get 1/2' }, explain: `By symmetry with the 0.6 team: 1 − ${d3(winNum(0.6, 4))} = ${d3(winNum(0.4, 4))}.` },
    ] },

    S('derivation'),
    { type: 'steps', steps: [
      { say: 'Pretend all 2k − 1 games are played, even after the series is decided.', why: 'Extra games are independent of the real ones and do not change which side reached k first. They are a bookkeeping device, not a new game.',
        checks: [
          { type: 'choice', q: 'Best of 5 (first to 3). A leads 3-0. How many of the two imagined extra games can B win?', options: ['both, and A is still the series winner', 'at most one', 'none: they are not played'], answer: 0, traps: { 1: 'B can win both: 3-2, still A', 2: 'they are imagined for counting; the point is they never change the winner' }, explain: 'A has 3 of 5; B can reach at most 2.' },
        ] },
      { say: 'Exactly one side wins at least k of the 2k − 1 games, and that side is the series winner.', why: 'k + k > 2k − 1, so both sides cannot reach k; and k − 1 + k − 1 < 2k − 1, so one of them must.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 4); return mc(rng, `First to ${k}. "A wins the series" is the same as A winning how many of ${2 * k - 1} imagined games?`, `at least ${k}`, [[`exactly ${k}`, `forgot that A can win more than ${k} of the imagined games`], [`the first ${k}`, 'confused one path with the event'], [`at least ${k - 1}`, `off by one: ${k - 1} wins leave room for the other side to reach ${k}`]], `At least ${k} of ${2 * k - 1}.`); } },
        ] },
      { say: 'So P(A wins) = Σ C(2k − 1, j) p^j q^(2k−1−j), summed over j = k to 2k − 1: a binomial tail. For best of 3 this is p²(3 − 2p).', why: 'The imagined games are a fixed number of independent trials, so the binomial count applies.',
        checks: [
          { make: (rng) => { const p = rng.pick(PS); return mc(rng, `A wins each game with ${p}. P(A wins a best-of-3)?`, winSeries(p, 2).toString(), [[p.toString(), 'used the single-game chance'], [qpow(p, 2).toString(), 'required A to win the first 2 games straight'], [exactlyK(p, 2).toString(), 'computed exactly 2 of 3, leaving out 3 of 3'], [one.sub(winSeries(p, 2)).toString(), 'answered B']], `p²(3 − 2p) with p = ${p}: ${winSeries(p, 2)}.`); } },
        ] },
      { say: 'Full length: the last game is played exactly when the first 2k − 2 games split k − 1 each. P = C(2k − 2, k − 1)(pq)^(k−1).', why: 'If either side had k wins earlier, the series would already be over; a (k − 1)-(k − 1) split is the only way to reach the decider.',
        checks: [
          { make: (rng) => { const k = rng.int(2, 4); return mc(rng, `Even teams, first to ${k} (best of ${2 * k - 1}). P(all ${2 * k - 1} games are played)?`, fullLength(HALF, k).toString(), [[qpow(HALF, 2 * k - 2).toString(), 'counted one alternating order only'], [Q.of(1, k).toString(), `treated the ${k} possible lengths as equally likely`], [one.sub(fullLength(HALF, k)).toString(), 'answered "ends early"']], `C(${2 * k - 2},${k - 1}) × (1/4)^${k - 1} = ${fullLength(HALF, k)}.`); } },
        ] },
    ] },
    { type: 'text', text: (() => { const len = (m) => Q.of(2 * C(m - 1, 3), 2 ** m); return `The same reasoning gives every possible length. A series ends at game m when the winner takes game m and had exactly k − 1 wins before it: C(m − 1, k − 1) orders, for either side. For even teams in a best of 7 the lengths 4, 5, 6, 7 have chances ${[4, 5, 6, 7].map(len).join(', ')}. They add to 1 and they are far from equal: a sweep is the rarest ending.`; })() },
    { type: 'check', scope: 'the length of a series', questions: [
      { type: 'choice', q: 'Even teams, best of 7. P(the series ends in exactly 4 games)?', options: [Q.of(2, 16).toString(), Q.of(1, 16).toString(), '1/4', Q.of(C(7, 4), 128).toString()], answer: 0, traps: { 1: 'counted a sweep by one team only', 2: 'treated the four lengths as equally likely', 3: 'counted 4 wins anywhere in 7 games' }, explain: 'A 4-0 sweep by either side: 2 × (1/2)⁴ = 1/8.' },
    ] },
    { type: 'explain', prompt: 'In your own words: why can you pretend every series runs its full length, and what does that buy you?', model: 'Once one side has k wins, the other side cannot also reach k within 2k − 1 games, so playing the remaining games never changes the winner. Pretending they are played turns a series with a random stopping time into a fixed number of independent games, and then "A wins" is just "A wins at least k of 2k − 1", a binomial tail.', points: ['extra games cannot change who reached k first', 'the series becomes a fixed number of independent games', 'A wins ⇔ at least k of 2k − 1: binomial tail'] },

    S('worked'),
    { type: 'worked', family: 'race-to-k', section: 'bto', difficulty: 2, seed: 'b', intro: 'Even teams, full length. Try it before opening the solution.' },
    { type: 'worked', family: 'race-to-k', section: 'bto', difficulty: 3, seed: 'e', fade: 1, intro: 'An uneven series. The first steps are given; the last one and the answer are yours.' },

    S('predict'),
    { type: 'predict', question: 'A team wins each game with 60%. In a best-of-7, is its series chance above or below 60%, and roughly what?', answer: `Above: about ${pct(winNum(0.6, 4))}.`, explain: 'The S-curve: a longer contest lets the better side\'s edge show.' },

    S('traps'),
    { type: 'traps', family: 'race-to-k', section: 'bto', extra: [
      { belief: 'The series chance equals the single-game chance.', fix: `A 60% team wins a best-of-7 about ${pct(winNum(0.6, 4))} of the time.` },
      { belief: '"Goes the distance" is one sequence of alternating wins.', fix: 'Any order of the first 2k − 2 games with a (k − 1)-(k − 1) split works: multiply by C(2k − 2, k − 1).' },
      { belief: 'A wins the series means A wins exactly k of the 2k − 1 games.', fix: 'At least k: in the imagined full series A may win more.' },
    ] },
    { type: 'erroneous', problem: 'A candidate works out P(an even best-of-5 goes all 5 games). One step is wrong.', steps: [
      'Game 5 is played exactly when the first 4 games split 2-2.',
      'The chance of a 2-2 split is (1/2)⁴ = 1/16.',
      'So P(5 games) = 1/16.',
      'About 6%.',
    ], errorStep: 1, explain: `(1/2)⁴ is one order, such as ABAB. There are C(4,2) = ${C(4, 2)} orders with two wins each: ${fullLength(HALF, 3)}.` },
    { type: 'check', scope: 'the named traps', questions: [
      { type: 'choice', q: `Even teams, best of 7. A candidate answers P(game 7) = 1/4. Which belief?`, options: ['The four possible lengths are equally likely', 'Only one order counted', 'Exactly k instead of at least k'], answer: 0, explain: `Lengths 4 to 7 are not equally likely. Correct: ${fullLength(HALF, 4)}.` },
      { type: 'choice', q: `A 3/5 team, best of 3. A candidate answers ${exactlyK(P35, 2)}. Which belief?`, options: ['Exactly 2 of 3 instead of at least 2', 'Single-game chance', 'Only one order'], answer: 0, explain: `3 × (3/5)² × 2/5 = ${exactlyK(P35, 2)} misses the 3-0 imagined strings. Correct: ${winSeries(P35, 2)}.` },
    ] },

    S('speed'),
    { type: 'callout', tone: 'speed', text: `Even teams, full length: best of 3 → ${fullLength(HALF, 2)}, best of 5 → ${fullLength(HALF, 3)}, best of 7 → ${fullLength(HALF, 4)}. Uneven best of 3: p²(3 − 2p). The general win formula is a sum, so for best of 5 or 7 use the complement when p is large.` },
    { type: 'callout', tone: 'speed', text: `Sanity: an even series is 1/2 by symmetry, and the stronger side\'s series chance always lies between p and 1. Time budget: ${SECTIONS.bto.exam.perItemSeconds} seconds; best of 3 or a full-length question takes 20, a best-of-7 win sum takes about 60, so check the options first for one that is clearly above p.` },
    { type: 'check', scope: 'the memorised values and the sanity bounds', questions: [
      { type: 'choice', q: 'A 2/3 player in a best-of-5 match. Which option can be right?', options: [d3(winSeries(Q.of(2, 3), 3)), '0.600', '0.667', '0.500'], answer: 0, traps: { 1: 'below the single-game chance: a series cannot shrink the stronger side\'s edge', 2: 'exactly the single-game chance', 3: 'the even-teams value' }, explain: `It must lie between 2/3 and 1: ${winSeries(Q.of(2, 3), 3)} ≈ ${d3(winSeries(Q.of(2, 3), 3))}.` },
    ] },

    S('rule'),
    { type: 'callout', tone: 'rule', text: 'First to k → imagine 2k − 1 games; A wins ⇔ at least k of them (binomial tail). Full length: C(2k−2, k−1)(pq)^(k−1).' },

    S('contrast'),
    { type: 'compare', columns: ['Question (A: 3/5, best of 3)', 'What to count', 'Value'], rows: [
      ['A wins one game', 'one trial', '3/5'],
      ['A wins the series', 'at least 2 of 3 imagined games', winSeries(P35, 2).toString()],
      ['A wins exactly 2 of 3 games', 'exactly 2 of 3 (all played)', exactlyK(P35, 2).toString()],
      ['series goes to game 3', '1-1 after two games', fullLength(P35, 2).toString()],
      ['A sweeps 2-0', 'one path', qpow(P35, 2).toString()],
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: best of 1 (k = 1) is a single game, so the series chance is p. With p = 1/2 the series is 1/2 whatever its length. With p = 1 the series never goes the distance: (pq)^(k−1) = 0 for k ≥ 2.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: "imagine the process runs on" works whenever stopping does not change the answer: "do 3 heads come before 3 tails?" is a best of 5 with p = 1/2. The S-curve is why repeated small edges add up (gambler\'s ruin, bto/gamblers-ruin), and why a market maker with a small edge per trade wants many trades.' },
    { type: 'check', scope: 'the contrast table and edge cases', questions: [
      { type: 'choice', q: 'Evenly matched, best of 9. P(A wins)?', options: ['1/2', 'more than 1/2', 'less than 1/2'], answer: 0, traps: { 1: 'length helps the stronger side; there is none here', 2: 'no side is weaker' }, explain: 'Swapping A and B maps every A-win onto a B-win.' },
    ] },

    S('tryit'),
    { type: 'tryit', family: 'race-to-k', section: 'bto', count: 3 },
  ],
};
