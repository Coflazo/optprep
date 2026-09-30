import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../../src/study/markup.js';

test('tokenizes bold, italics, code, fractions, sup and sub', () => {
  const t = tokenize('Use **36** ordered pairs, *not* `21`: P = {{6|36}} and x^{2} + a_{n}.');
  assert.deepEqual(t.map((x) => x.t), ['text', 'b', 'text', 'i', 'text', 'code', 'text', 'frac', 'text', 'sup', 'text', 'sub', 'text']);
  assert.equal(t.find((x) => x.t === 'frac').n, '6');
  assert.equal(t.find((x) => x.t === 'frac').d, '36');
});

test('never turns text into markup it did not ask for', () => {
  const t = tokenize('<img src=x onerror=alert(1)> and <b>tags</b>');
  assert.deepEqual(t, [{ t: 'text', v: '<img src=x onerror=alert(1)> and <b>tags</b>' }]);
});

test('unclosed markers stay literal', () => {
  assert.deepEqual(tokenize('a ** b'), [{ t: 'text', v: 'a ** b' }]);
  assert.deepEqual(tokenize('{{1|'), [{ t: 'text', v: '{{1|' }]);
});
