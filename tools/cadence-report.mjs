// Dev report for the unit rule (src/study/schema.js, cadence): per book, every lesson
// with a teaching unit that is not followed by a check, and where. Prints the total
// last and exits 1 while any remain. Usage: node tools/cadence-report.mjs [bookId]
import { BOOKS } from '../src/study/content/index.js';
import { lessonsOf, cadence } from '../src/study/schema.js';

const only = process.argv[2];
const peek = (b) => {
  const t = typeof b.text === 'string' ? b.text : typeof b.caption === 'string' ? b.caption : b.problem || b.title || '';
  return `${b.type}${b.tone ? `(${b.tone})` : ''}${t ? ` "${t.slice(0, 50).replace(/\s+/g, ' ')}..."` : ''}`;
};
let total = 0;
for (const book of BOOKS) {
  if (book.pending || (only && book.id !== only)) continue;
  const rows = [];
  for (const L of lessonsOf(book)) {
    const v = cadence(L);
    if (!v.length) continue;
    total += v.length;
    rows.push(`  ${L.id} (${v.length})`);
    for (const x of v) rows.push(`    [${x.section}] blocks ${x.unit.join(',')}: ${x.reason}${x.at != null ? ` at ${x.at}` : ''}\n      ${x.unit.map((i) => peek(L.blocks[i])).join('\n      ')}`);
  }
  const n = rows.filter((r) => r.startsWith('  ') && !r.startsWith('    ')).length;
  console.log(`${book.id}: ${n} lesson${n === 1 ? '' : 's'} with violations`);
  if (rows.length) console.log(rows.join('\n'));
}
console.log(`${total} violation${total === 1 ? '' : 's'}`);
process.exit(total ? 1 : 0);
