// Export every section's fixed question library as JSON for the Python/C++
// verification pipeline:  node tools/export-library.mjs [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECTION_MODULES } from '../src/sections/index.js';
import { SECTIONS } from '../config/sections.js';
import { buildLibrary, setCount } from '../src/core/library.js';

const out = process.argv[2] || 'backend/data/library';
mkdirSync(out, { recursive: true });
for (const [id, mod] of Object.entries(SECTION_MODULES)) {
  const size = setCount(SECTIONS[id].exam.count) * SECTIONS[id].exam.count;
  const items = buildLibrary(mod, { size, cache: false });
  writeFileSync(join(out, `${id}.json`), JSON.stringify({ section: id, families: mod.families.map((f) => f.id), bank: mod.bank.length, items }));
  console.log(`${id}: ${items.length} items, ${mod.families.length} families`);
}
