import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAY, windowStats, weekStats, readWeek, goalIsHow, goalDue, pickNext, ago } from '../../src/study/insights.js';

const NOW = 100 * DAY;

test('week stats: last 7 days against the 7 before', () => {
  const log = [
    // this week: 4 checks, 3 clean, 2 with hints; a passed timed review and a failed try
    { kind: 'check', clean: true, hints: 0, at: NOW - 1 * DAY },
    { kind: 'check', clean: true, hints: 1, at: NOW - 1 * DAY },
    { kind: 'check', clean: true, hints: 0, at: NOW - 2 * DAY },
    { kind: 'check', clean: false, hints: 2, at: NOW - 2 * DAY },
    { kind: 'review', n: 3, clean: 3, ms: [30e3, 60e3, 120e3], budgetMs: 60e3, at: NOW - 3 * DAY },
    { kind: 'try', n: 3, clean: 1, at: NOW - 3 * DAY },
    // the week before: 2 checks, 1 clean
    { kind: 'check', clean: true, hints: 0, at: NOW - 8 * DAY },
    { kind: 'check', clean: false, hints: 0, at: NOW - 9 * DAY },
    // outside both windows
    { kind: 'check', clean: false, at: NOW - 20 * DAY },
  ];
  const study = {
    a: { masteredAt: 1, due: NOW - 1 * DAY, reflection: { after: 5, at: NOW - DAY }, lastTry: { n: 3, clean: 1 } }, // due, overconfident by 1 - 1/3
    b: { masteredAt: 1, due: NOW + DAY }, // not due yet
    c: { masteredAt: 1, due: NOW - 10 * DAY }, // fell due last week, still waiting
  };
  const { cur, prev } = weekStats({ log, study }, NOW);
  assert.equal(cur.checks, 4);
  assert.equal(cur.clean, 0.75);
  assert.equal(cur.hints, 0.5);
  assert.equal(cur.tries, 2);
  assert.equal(cur.passed, 1);
  assert.equal(cur.timedItems, 3);
  assert.equal(cur.paceMedian, 1);
  assert.equal(cur.inBudget, 2);
  assert.equal(cur.reviewsDone, 1);
  assert.equal(cur.reviewsDue, 1);
  assert.ok(Math.abs(cur.calGap - 2 / 3) < 1e-9);
  assert.equal(cur.days, 3);
  assert.equal(prev.checks, 2);
  assert.equal(prev.clean, 0.5);
  assert.equal(prev.hints, 0);
  assert.equal(prev.reviewsDue, 1);
  assert.equal(prev.timedItems, 0);
  const empty = windowStats({}, 0, NOW);
  assert.equal(empty.clean, null);
  assert.equal(empty.calGap, null);
});

test('the reading: plain rules from the numbers', () => {
  const base = { checks: 10, clean: 0.6, hints: 0.1, tries: 2, timedItems: 3, paceMedian: 0.8, calGap: 0, reviewsDue: 0, reviewsDone: 0 };
  const has = (rules, re) => rules.some((r) => re.test(r));
  // hint use up, clean rate flat
  assert.ok(has(readWeek({ ...base, hints: 0.4 }, base), /try every check without hints first/));
  // hint use up and clean rate up: no hint warning from the trend
  assert.ok(!has(readWeek({ ...base, hints: 0.2, clean: 0.9 }, base), /without hints/));
  // no timed questions
  assert.ok(has(readWeek({ ...base, timedItems: 0, paceMedian: null }, base), /exam-pace try-it/));
  assert.ok(has(readWeek({ ...base, paceMedian: 1.4 }, base), /140% of the exam budget/));
  // confidence above results
  assert.ok(has(readWeek({ ...base, calGap: 0.3 }, base), /test before rating/));
  assert.ok(has(readWeek({ ...base, reviewsDue: 3, reviewsDone: 1 }, base), /Reviews are piling up/));
  assert.ok(has(readWeek(base, base, 4), /mistake log/));
  assert.ok(has(readWeek({ ...base, clean: 0.9 }, base), /rose from 60% to 90%/));
  assert.deepEqual(readWeek(base, base), ['No warning signs this week: keep the routine and add one exam-pace try-it.']);
  assert.match(readWeek({ checks: 0, tries: 0 }, base)[0], /Nothing logged/);
  const all = readWeek({ ...base, hints: 0.5, clean: 0.3, timedItems: 0, calGap: 0.4, reviewsDue: 2 }, base, 5);
  assert.ok(all.length <= 5);
});

test('a goal says how to study, not only what', () => {
  for (const g of ['Bayes', 'Conditional probability and Bayes', 'Finish the NumberLogic book', '', null]) assert.ok(!goalIsHow(g), g);
  for (const g of ['Do every try-it without hints', 'Review due lessons before new ones', 'Time myself on Bayes questions', 'Explain each rule from memory', 'Re-test the top mistake daily']) assert.ok(goalIsHow(g), g);
});

test('goal check comes back a week after setting or the last check', () => {
  assert.ok(!goalDue(null, NOW));
  assert.ok(!goalDue({ at: NOW - 6 * DAY, checks: [] }, NOW));
  assert.ok(goalDue({ at: NOW - 7 * DAY, checks: [] }, NOW));
  assert.ok(!goalDue({ at: NOW - 20 * DAY, checks: [{ at: NOW - 2 * DAY }] }, NOW));
});

test('next up: review > re-test > resume > start > done', () => {
  const lessons = [
    { id: 'x/a', sections: ['one', 'two'], masterable: true },
    { id: 'x/b', sections: ['one', 'two'], masterable: true },
    { id: 'x/s', sections: ['one', 'two'], masterable: false },
    { id: 'x/c', sections: ['one', 'two'], masterable: true },
  ];
  const study = {
    'x/a': { readAt: 1, masteredAt: 2, due: NOW - DAY },
    'x/b': { readAt: 1, lastSection: 'two' },
    'x/s': { readAt: 1, lastSection: 'two' }, // strategy lesson read to the end: finished
  };
  const beliefs = [{ key: 'gone', lessons: ['y/zzz'] }, { key: 'k', lessons: ['x/b'] }];
  assert.deepEqual(pickNext({ lessons, study, beliefs }, NOW), { kind: 'review', id: 'x/a' });
  const notDue = { ...study, 'x/a': { ...study['x/a'], due: NOW + DAY } };
  assert.deepEqual(pickNext({ lessons, study: notDue, beliefs }, NOW), { kind: 'retest', key: 'k' });
  assert.deepEqual(pickNext({ lessons, study: notDue, beliefs: beliefs.slice(0, 1) }, NOW), { kind: 'resume', id: 'x/b', section: 'two' });
  // the most recently active unfinished lesson wins
  const two = { ...notDue, 'x/c': { readAt: 1, lastSection: 'one' } };
  assert.equal(pickNext({ lessons, study: two, log: [{ lesson: 'x/c', at: 50 }, { lesson: 'x/b', at: 10 }] }, NOW).id, 'x/c');
  const none = { ...notDue, 'x/b': { readAt: 1, masteredAt: 3, due: NOW + DAY } };
  assert.deepEqual(pickNext({ lessons, study: none }, NOW), { kind: 'start', id: 'x/c' });
  assert.deepEqual(pickNext({ lessons, study: { ...none, 'x/c': { readAt: 1 } } }, NOW), { kind: 'done' });
});

test('relative time', () => {
  assert.equal(ago(NOW - 3600e3, NOW), 'today');
  assert.equal(ago(NOW - DAY, NOW), 'yesterday');
  assert.equal(ago(NOW - 5 * DAY, NOW), '5 days ago');
});
