import { h, mount } from '../dom.js';

// Progress lives in this browser only. Export is the backup; import restores it.
export function dataPage(root, { store }) {
  const status = h('p', { role: 'status', class: 'muted' });
  const file = h('input', { type: 'file', accept: 'application/json', 'aria-label': 'Backup file', onchange: async () => {
    const f = file.files?.[0];
    if (!f) return;
    try { store.importJSON(await f.text()); status.textContent = 'Backup restored.'; } catch (e) { status.textContent = `Import failed: ${e.message}`; }
  } });
  mount(root,
    h('h1', {}, 'Data'),
    h('p', { class: 'muted' }, 'Progress is stored in this browser. Export a backup before clearing site data or switching browsers.'),
    h('div', { class: 'panel stack' },
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => {
          const blob = new Blob([store.exportJSON()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `oa-trainer-backup-${new Date().toISOString().slice(0, 10)}.json` });
          document.body.append(a); a.click(); a.remove();
        } }, 'Export backup'),
        h('label', { class: 'btn' }, 'Import backup', h('span', { style: { display: 'none' } }, file))),
      h('div', {}, h('button', { class: 'btn', type: 'button', onclick: () => {
        if (confirm('Delete all progress in this browser? Export a backup first if you want to keep it.')) { store.reset(); status.textContent = 'Progress cleared.'; }
      } }, 'Reset progress')),
      status),
    h('p', { class: 'muted' }, `Answers recorded: ${Object.values(store.stats()).reduce((s, x) => s + x.n, 0)}. Exams recorded: ${store.state.runs.filter((r) => r.mode === 'exam').length}.`));
}
