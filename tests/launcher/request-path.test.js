import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestPath, hostAllowed } from '../../bin/optprep.js';

test('app files map to their path; folders map to index.html', () => {
  assert.equal(requestPath('/'), 'index.html');
  assert.equal(requestPath('/?x=1#y'), 'index.html');
  assert.equal(requestPath('/app.js'), 'app.js');
  assert.equal(requestPath('/src/study/diagrams/_util.js'), 'src/study/diagrams/_util.js');
  assert.equal(requestPath('/manifest.webmanifest?v=2'), 'manifest.webmanifest');
  assert.equal(requestPath('/assets/icons/icon-192.png'), 'assets/icons/icon-192.png');
});

test('private folders are refused however they are spelled', () => {
  for (const url of [
    '/backend/pyproject.toml', '/%62ackend/pyproject.toml', '/Backend/pyproject.toml', '/BACKEND/data/progress.db',
    '/src/../backend/pyproject.toml', '/engine/CMakeLists.txt', '/Tools/export-library.mjs', '/tests/core/rng.test.js',
    '/node_modules/x.js', '/screenshots/a.png', '/brag-output/a.md', '/Brag-Output-2/a.md',
    '/backend./pyproject.toml', '/BACKEN~1/pyproject.toml',
  ]) assert.equal(requestPath(url), null, url);
});

test('dot segments, traversal and odd encodings are refused', () => {
  for (const url of [
    '/.git/config', '/%2egit/config', '/.GIT/HEAD', '/.env', '/..%2f..%2fetc/passwd', '/..%2F.git/config',
    '/%2e%2e/%2e%2e/etc/passwd', '/src/./app.js', '/a\\..\\backend', '/%5c..%5cbackend', '/C:/Windows/win.ini',
    '/app.js::$DATA', '/%252e%252e/x', '/%E0%A4%A', '/%00app.js', 'app.js',
    // Unicode look-alikes: Kelvin sign and long s fold to ASCII on case-insensitive file systems.
    '/bac\u212Aend/pyproject.toml', '/bac%E2%84%AAend/pyproject.toml', '/te\u017Fts/x.js', '/caf\u00e9.js',
  ]) assert.equal(requestPath(url), null, url);
});

test('Host header must name this server', () => {
  assert.equal(hostAllowed('127.0.0.1:8765', 8765), true);
  assert.equal(hostAllowed('localhost:8765', 8765), true);
  assert.equal(hostAllowed('[::1]:8765', 8765), true);
  assert.equal(hostAllowed('evil.example', 8765), false);
  assert.equal(hostAllowed('127.0.0.1:8766', 8765), false);
  assert.equal(hostAllowed(undefined, 8765), false);
});
