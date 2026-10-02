import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Q } from '../../src/core/rational.js';
import { makeRng } from '../../src/core/rng.js';
import { QUANTITIES, IDS, outcomes, playRound, price, fairValue, createSession } from '../../src/mk/engine.js';
import { roundNote, sessionNote, money, num } from '../../src/mk/coach.js';

const round = (seen, hedge, bid, ask, size = 1) => playRound(
  { id: 'dice3', outcome: outcomes('dice3').find((o) => o.seen === seen), hedge: Q.of(hedge) },
  { bid: price(bid), ask: price(ask), size });
const sentences = (s) => s.split(/(?<=[.!?])\s+(?=[A-Z])/).length;
// Copy rules: no em or en dashes, never the abbreviation for the online assessment.
const clean = (s) => !/[\u2013\u2014]/.test(s) && !/\bOA\b/.test(s);

test('mk coach: each round gets one or two plain sentences', () => {
  const notes = [
    round(6, 0, '8.5', '12.5'), round(3, 0, '8.5', '12.5'), round(3, -2, '8.5', '12.5'),
    round(5, 0, '10', '11'), round(1, 0, '11', '13'), round(2, 3, '7', '9'),
  ].map(roundNote);
  for (const n of notes) {
    assert.ok(sentences(n) >= 1 && sentences(n) <= 2, n);
    assert.ok(clean(n), n);
  }
});

test('mk coach: says whether the mid was on fair value', () => {
  assert.match(roundNote(round(3, 0, '8.5', '12.5')), /^Good market: centred on fair value \(10\.5\) and 4 wide\./);
  assert.match(roundNote(round(3, 0, '11', '13')), /mid of 12 was 1\.5 above fair value \(10\.5\).*bid was a gift to sellers/);
  assert.match(roundNote(round(3, 0, '7', '10')), /mid of 8\.5 was 2 below fair value.*ask was a gift to buyers/);
  // max2: an inexact fair value is shown as the fraction and a decimal.
  const r = playRound({ id: 'max2', outcome: outcomes('max2')[0], hedge: Q.of(0) }, { bid: price('2'), ask: price('4'), size: 1 });
  assert.match(roundNote(r), /fair value \(161\/36, about 4\.47\)/);
});

test('mk coach: says when the spread was narrow for the uncertainty', () => {
  const note = roundNote(round(4, 0, '10', '11'));
  assert.match(note, /1 wide is tight/);
  assert.match(note, /anywhere from 8 to 13/);
  assert.match(note, /use the full 4/);
  assert.doesNotMatch(roundNote(round(4, 0, '9', '12')), /tight/, '3 of 4 is wide enough');
});

test('mk coach: names adverse selection and what it implies', () => {
  const picked = roundNote(round(6, 0, '8.5', '12.5'));
  assert.match(picked, /It saw a 6 and expected 13, so it bought at your ask and picked you off/);
  assert.match(picked, /move your fair value toward it/);
  assert.match(roundNote(round(1, 0, '8.5', '12.5')), /It saw a 1 and expected 8, so it sold at your bid and picked you off/);
  assert.match(roundNote(round(3, -2, '8.5', '12.5')), /expected 10, inside your market, so it sold at your bid for its own reasons/);
  assert.match(roundNote(round(3, 0, '8.5', '12.5')), /inside your market, so it passed/);
  const card = playRound({ id: 'cards2', outcome: outcomes('cards2').find((o) => o.seen === 8), hedge: Q.of(0) }, { bid: price('8'), ask: price('14'), size: 1 });
  assert.match(roundNote(card), /It saw an 8 and expected about 13\.22/);
});

// A whole session played by a fixed rule, through the real engine.
function session(seed, rule) {
  const s = createSession(makeRng(seed));
  while (!s.isOver()) { s.quote(rule(s.current())); s.next(); }
  return s.state.log;
}
const at = (c, mid, width, size) => ({ bid: (mid - width / 2).toFixed(2), ask: (mid + width / 2).toFixed(2), size });
const fair = (c) => Math.round(fairValue(c.id).toNumber() * 2) / 2;

test('mk coach: the session summary picks the single most costly habit', () => {
  for (let seed = 0; seed < 10; seed++) {
    assert.equal(sessionNote(session(`off${seed}`, (c) => at(c, fair(c) + c.cap, c.cap, 1))).key, 'centre');
    assert.equal(sessionNote(session(`narrow${seed}`, (c) => at(c, fair(c), 0.5, 1))).key, 'width');
    assert.equal(sessionNote(session(`small${seed}`, (c) => at(c, fair(c), c.cap, 1))).key, 'size');
    assert.equal(sessionNote(session(`big${seed}`, (c) => at(c, fair(c) + c.cap, c.cap, 10))).key, 'centre', 'a big losing market: fix the market, not the size');
    assert.equal(sessionNote(session(`good${seed}`, (c) => at(c, fair(c), c.cap, 10))).key, 'keep');
  }
});

test('mk coach: the summary reports trades, expected value and P&L in plain words', () => {
  const log = session('summary', (c) => at(c, fair(c), c.cap, 10));
  const note = sessionNote(log);
  const trades = log.filter((r) => r.action !== 'pass').length;
  assert.match(note.text, new RegExp(`^${trades} trades?, \\d+ of them picked off\\.`));
  assert.match(note.text, /worth [+\u2212]?\d+\.\d\d; they made [+\u2212]?\d+\.\d\d, and the difference is luck\.$/);
  assert.ok(clean(note.text) && clean(note.habit));
  for (const key of ['centre', 'width', 'size']) assert.ok(note.costs[key] >= 0, key);
});

test('mk coach: number formats and every piece of game copy follow the copy rules', () => {
  assert.equal(money(4.5), '+4.50');
  assert.equal(money(-2.25), '\u22122.25');
  assert.equal(money(0), '0.00');
  assert.equal(money(-0.001), '0.00');
  assert.equal(num(161 / 36), '4.47');
  for (const id of IDS) {
    const d = QUANTITIES[id];
    for (const s of [d.label, d.setup, d.botLine, d.seenText(1), d.drawText(outcomes(id)[0].draw)]) assert.ok(clean(s), s);
  }
});
