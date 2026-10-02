import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Q } from '../../src/core/rational.js';
import { makeRng } from '../../src/core/rng.js';
import {
  QUANTITIES, IDS, ROUNDS, SIZES, outcomes, fairValue, botViews, botExpectation, hedges,
  botDecision, fill, pnlOf, edgeOf, quoteValue, price, checkQuote, createSession, playRound,
} from '../../src/mk/engine.js';

const q = (x) => price(String(x));

test('mk: fair values are exact and match an independent formula', () => {
  assert.deepEqual(IDS.map((id) => outcomes(id).length), [216, 36, 1024, 90]);
  assert.ok(fairValue('dice3').eq(Q.of(21, 2)), 'three dice: 3 x 3.5');
  // Max of two dice: P(max = k) = (2k - 1) / 36.
  const max2 = [1, 2, 3, 4, 5, 6].reduce((s, k) => s.add(Q.of(k * (2 * k - 1), 36)), Q.of(0));
  assert.ok(fairValue('max2').eq(max2));
  assert.equal(String(fairValue('max2')), '161/36');
  assert.ok(fairValue('heads10').eq(Q.of(5)), 'ten flips: 10 x 1/2');
  assert.ok(fairValue('cards2').eq(Q.of(11)), 'two cards from 1..10: 2 x 5.5');
});

test('mk: the other trader\'s expectations are exact and average back to fair value', () => {
  for (let d = 1; d <= 6; d++) {
    assert.ok(botExpectation('dice3', d).eq(Q.of(d + 7)), `dice3 sees ${d}`);
    let higher = 0;
    for (let k = d + 1; k <= 6; k++) higher += k;
    assert.ok(botExpectation('max2', d).eq(Q.of(d * d + higher, 6)), `max2 sees ${d}`);
  }
  for (let h = 0; h <= 4; h++) assert.ok(botExpectation('heads10', h).eq(Q.of(h + 3)), `heads10 sees ${h}`);
  for (let c = 1; c <= 10; c++) assert.ok(botExpectation('cards2', c).eq(Q.of(c).add(Q.of(55 - c, 9))), `cards2 sees ${c}`);
  for (const id of IDS) {
    const total = botViews(id).reduce((s, v) => s.add(v.p.mul(v.e)), Q.of(0));
    assert.ok(total.eq(fairValue(id)), `${id}: law of total expectation`);
    const hs = hedges(id);
    assert.equal(hs.length, QUANTITIES[id].hedge * 8 + 1);
    assert.ok(hs[0].eq(Q.of(-QUANTITIES[id].hedge * 4, 4)) && hs.at(-1).eq(Q.of(QUANTITIES[id].hedge * 4, 4)));
  }
});

test('mk: the other trader buys above your ask, sells below your bid, otherwise passes', () => {
  const bid = q(8.5), ask = q(12.5);
  assert.equal(botDecision({ bid, ask, value: Q.of(13) }), 'buy');
  assert.equal(botDecision({ bid, ask, value: Q.of(8) }), 'sell');
  assert.equal(botDecision({ bid, ask, value: Q.of(21, 2) }), 'pass');
  assert.equal(botDecision({ bid, ask, value: q(12.5) }), 'pass', 'a tie at the ask passes');
  assert.equal(botDecision({ bid, ask, value: q(8.5) }), 'pass', 'a tie at the bid passes');
  // Saw a 6 (expects 13) but hedges -1: values it at 12, inside the market.
  const plan = (seen, hedge) => ({ id: 'dice3', outcome: outcomes('dice3').find((o) => o.seen === seen), hedge: Q.of(hedge) });
  const quote = { bid, ask, size: 5 };
  assert.equal(playRound(plan(6, -1), quote).action, 'pass');
  const picked = playRound(plan(6, 0), quote);
  assert.equal(picked.action, 'buy');
  assert.equal(picked.pickedOff, true, 'its information alone beat the ask');
  // Saw a 3 (expects 10) with a hedge of -2: sells at 8.5 for its own reasons, not picked off.
  const hedged = playRound(plan(3, -2), quote);
  assert.equal(hedged.action, 'sell');
  assert.equal(hedged.pickedOff, false);
  assert.equal(playRound(plan(3, 0), quote).pickedOff, null, 'no trade, no adverse selection');
});

test('mk: P&L sign conventions (you buy at your bid when it sells to you)', () => {
  const bid = q(9.5), ask = q(11.5), fair = fairValue('dice3');
  const bought = fill({ action: 'sell', bid, ask, size: 5 });
  assert.equal(bought.position, 5);
  assert.ok(bought.price.eq(bid));
  assert.ok(pnlOf(bought, 13).eq(q(17.5)), '5 x (13 - 9.5)');
  assert.ok(pnlOf(bought, 7).eq(q(-12.5)), '5 x (7 - 9.5)');
  assert.ok(edgeOf(bought, fair).eq(Q.of(5)), 'bought 1 under fair, 5 lots');
  const sold = fill({ action: 'buy', bid, ask, size: 5 });
  assert.equal(sold.position, -5);
  assert.ok(sold.price.eq(ask));
  assert.ok(pnlOf(sold, 13).eq(q(-7.5)), '-5 x (13 - 11.5)');
  assert.ok(pnlOf(sold, 7).eq(q(22.5)), '-5 x (7 - 11.5)');
  assert.ok(edgeOf(sold, fair).eq(Q.of(5)), 'sold 1 over fair, 5 lots');
  const none = fill({ action: 'pass', bid, ask, size: 5 });
  assert.equal(none.position, 0);
  assert.ok(pnlOf(none, 18).isZero() && edgeOf(none, fair).isZero());
});

test('mk: expected value of a quote matches a brute-force sum over every outcome and hedge', () => {
  const quotes = { dice3: [[8.5, 12.5], [10, 11], [9, 13]], max2: [[3.5, 5.5], [4, 5]], heads10: [[4, 6], [3, 4.5]], cards2: [[8, 14], [10, 12]] };
  for (const id of IDS) {
    for (const [b, a] of quotes[id]) {
      const bid = q(b), ask = q(a), hs = hedges(id), list = outcomes(id);
      let total = Q.of(0);
      for (const o of list) {
        for (const hd of hs) {
          const action = botDecision({ bid, ask, value: botExpectation(id, o.seen).add(hd) });
          total = total.add(pnlOf(fill({ action, bid, ask, size: 1 }), o.value));
        }
      }
      assert.ok(quoteValue(id, bid, ask).eq(total.div(list.length * hs.length)), `${id} ${b}/${a}`);
    }
  }
});

test('mk: a centred full-width market earns on average, a tight one loses, an off-centre one earns less', () => {
  for (const id of IDS) {
    const fair = fairValue(id), half = Q.of(QUANTITIES[id].cap, 2), tight = Q.of(1, 4);
    const full = quoteValue(id, fair.sub(half), fair.add(half));
    assert.ok(full.cmp(0) > 0, `${id}: full width centred ${full}`);
    assert.ok(quoteValue(id, fair.sub(tight), fair.add(tight)).cmp(0) < 0, `${id}: half a unit wide loses`);
    const shift = Q.of(QUANTITIES[id].cap, 2);
    assert.ok(quoteValue(id, fair.sub(half).add(shift), fair.add(half).add(shift)).cmp(full) < 0, `${id}: off centre is worse`);
  }
});

test('mk: prices parse exactly, with two decimals at most', () => {
  assert.ok(price('10.5').eq(Q.of(21, 2)));
  assert.ok(price(' 10,25 ').eq(Q.of(41, 4)));
  assert.ok(price('\u22123').eq(Q.of(-3)));
  assert.ok(price('.5').eq(Q.of(1, 2)));
  assert.ok(price(7).eq(Q.of(7)));
  for (const bad of ['', ' ', 'abc', '1.234', '1e3', '--1', '.', '1/2', null, undefined]) assert.equal(price(bad), null, String(bad));
});

test('mk: the spread cap and the other quote rules are enforced', () => {
  assert.deepEqual(IDS.map((id) => QUANTITIES[id].cap), [4, 2, 2, 6]);
  assert.match(checkQuote('dice3', { bid: '8', ask: '12.5', size: 1 }).error, /4\.5 wide.*most allowed here is 4/);
  assert.ok(!checkQuote('dice3', { bid: '8.5', ask: '12.5', size: 1 }).error, 'exactly the cap is fine');
  assert.ok(checkQuote('max2', { bid: '3', ask: '5.01', size: 1 }).error, 'max2 cap is 2');
  assert.match(checkQuote('dice3', { bid: '11', ask: '10', size: 1 }).error, /below your ask/);
  assert.match(checkQuote('dice3', { bid: '10', ask: '10', size: 1 }).error, /below your ask/);
  assert.match(checkQuote('dice3', { bid: '', ask: '11', size: 1 }).error, /bid and an ask/);
  assert.match(checkQuote('dice3', { bid: '10', ask: '11', size: 3 }).error, /size/);
  // A rejected quote leaves the round open.
  const s = createSession(makeRng('cap'));
  const cap = QUANTITIES[s.current().id].cap;
  assert.ok(s.quote({ bid: '0', ask: String(cap + 1), size: 1 }).error);
  assert.equal(s.state.round, 0);
  assert.equal(s.state.phase, 'quote');
  assert.ok(s.quote({ bid: '0', ask: String(cap), size: 1 }).entry);
  assert.equal(s.state.phase, 'reveal');
});

function play(session, pick = (c) => ({ bid: '0', ask: String(c.cap), size: 1 })) {
  let n = 0;
  while (!session.isOver()) {
    const res = session.quote(pick(session.current()));
    assert.ok(res.entry, res.error);
    assert.ok(session.quote(pick(session.current())).error, 'one quote per round');
    session.next();
    n += 1;
    assert.ok(n <= ROUNDS);
  }
  return n;
}

test('mk: a session is always 8 rounds, each quantity twice', () => {
  assert.equal(ROUNDS, 8);
  assert.deepEqual(SIZES, [1, 5, 10]);
  for (let seed = 0; seed < 50; seed++) {
    const s = createSession(makeRng(`len${seed}`));
    assert.equal(s.plan.length, 8);
    for (const id of IDS) assert.equal(s.plan.filter((p) => p.id === id).length, 2, `seed ${seed} ${id}`);
    assert.equal(play(s), 8);
    assert.equal(s.result().rounds.length, 8);
    assert.equal(s.current(), null);
    assert.ok(s.quote({ bid: '1', ask: '2', size: 1 }).error);
    assert.equal(s.next(), false);
  }
});

test('mk: same seed, same rounds and results; different seeds differ', () => {
  const pick = (c) => { const f = fairValue(c.id).toNumber(); return { bid: (Math.round((f - 1) * 4) / 4).toFixed(2), ask: (Math.round((f + 1) * 4) / 4).toFixed(2), size: 5 }; };
  const a = createSession(makeRng('same')), b = createSession(makeRng('same'));
  play(a, pick); play(b, pick);
  assert.deepEqual(a.result(), b.result());
  assert.deepEqual(a.plan.map((p) => [p.id, p.outcome.draw, String(p.hedge)]), b.plan.map((p) => [p.id, p.outcome.draw, String(p.hedge)]));
  const plans = new Set();
  for (let seed = 0; seed < 40; seed++) plans.add(JSON.stringify(createSession(makeRng(seed)).plan.map((p) => [p.id, p.outcome.draw, String(p.hedge)])));
  assert.equal(plans.size, 40);
});

test('mk: session totals equal the sum of the rounds, exactly', () => {
  for (let seed = 0; seed < 20; seed++) {
    const s = createSession(makeRng(`tot${seed}`));
    play(s, (c) => { const f = fairValue(c.id).toNumber(); return { bid: (f - c.cap / 2).toFixed(2), ask: (f + c.cap / 2 - 0.01).toFixed(2), size: 10 }; });
    const pnl = s.state.log.reduce((t, e) => t.add(e.exact.pnl), Q.of(0));
    const edge = s.state.log.reduce((t, e) => t.add(e.exact.edge), Q.of(0));
    assert.equal(s.result().pnl, pnl.toNumber());
    assert.equal(s.result().edge, edge.toNumber());
    for (const e of s.state.log) {
      assert.ok(Math.abs(e.pnl - e.position * (e.settlement - (e.price ?? 0))) < 1e-9);
      assert.ok(Number.isInteger(e.settlement) && e.settlement >= Math.min(...outcomes(e.id).map((o) => o.value)));
    }
  }
});
