// Every text/background pair in both themes meets WCAG AA (4.5:1 text, 3:1 UI parts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { effectiveTheme } from '../../src/ui/theme.js';

const css = readFileSync(new URL('../../src/ui/styles.css', import.meta.url), 'utf8');
function theme(name) {
  const block = css.split(`/* theme: ${name} */`)[1].split('/* end theme */')[0];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
}
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5], ['text-2', 'surface', 4.5], ['text-2', 'bg', 4.5], ['text-2', 'surface-2', 4.5],
  ['text-3', 'surface', 3], ['brand-text', 'surface', 4.5], ['brand-text', 'bg', 4.5], ['accent-text', 'accent', 4.5],
  ['correct', 'correct-bg', 4.5], ['correct', 'surface', 4.5], ['wrong', 'wrong-bg', 4.5], ['wrong', 'surface', 4.5],
  ['warn', 'warn-bg', 4.5], ['warn', 'surface', 4.5], ['ring', 'bg', 3], ['ring', 'surface', 3], ['border-strong', 'surface', 3],
  ['brand', 'surface', 3], ['xp', 'surface', 4.5],
];

for (const name of ['light', 'dark']) {
  test(`${name} theme meets WCAG AA`, () => {
    const t = theme(name);
    for (const [fg, bg, min] of PAIRS) {
      assert.ok(t[fg] && t[bg], `${name}: missing --${fg} or --${bg}`);
      assert.ok(ratio(t[fg], t[bg]) >= min, `${name}: --${fg} on --${bg} is ${ratio(t[fg], t[bg]).toFixed(2)}:1, needs ${min}:1`);
    }
  });
}

test('the system dark block repeats the dark theme exactly', () => {
  const dark = theme('dark');
  const sys = css.split(':root:not([data-theme="light"]) {')[1].split('}')[0];
  for (const [k, v] of Object.entries(dark)) assert.match(sys, new RegExp(`--${k}: ${v}`), `--${k} differs in the system dark block`);
});

test('system follows the OS, explicit choices win', () => {
  assert.equal(effectiveTheme('system', true), 'dark');
  assert.equal(effectiveTheme('system', false), 'light');
  assert.equal(effectiveTheme('light', true), 'light');
  assert.equal(effectiveTheme('dark', false), 'dark');
});
