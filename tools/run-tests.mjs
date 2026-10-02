// Runs every tests/**/*.test.js with node --test. Node 20 has no glob support on the
// command line and Node 22 no longer searches a directory argument, so the files are
// listed here and passed explicitly; this works the same on every OS.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../tests', import.meta.url));
const files = readdirSync(root, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => join(root, f));
if (!files.length) {
  console.error('No test files found under tests/');
  process.exit(1);
}
const run = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(run.status ?? 1);
