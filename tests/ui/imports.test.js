// Walks the app's module graph from app.js, static and lazy imports alike, and fails on any
// import that points at a missing file. A broken import stops the whole app at the splash,
// and no unit test that imports a single module would notice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SPEC = /(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;

test('every module reachable from app.js exists', () => {
  const seen = new Set(), missing = [], queue = [resolve(ROOT, 'app.js')];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of readFileSync(file, 'utf8').matchAll(SPEC)) {
      const target = resolve(dirname(file), m[1] || m[2]);
      if (!existsSync(target)) missing.push(`${file.slice(ROOT.length)} -> ${m[1] || m[2]}`);
      else queue.push(target);
    }
  }
  assert.deepEqual(missing, []);
  assert.ok(seen.size > 300, `walked only ${seen.size} modules`);
});
