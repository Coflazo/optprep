// Settings: theme, daily goal, battery, division sign, install, backup and storage.
import { h, mount } from '../dom.js';
import { getTheme, setTheme } from '../theme.js';
import { activePreset } from '../../../config/presets.js';
import { canInstall, promptInstall } from '../pwa.js';
import { choice, field } from '../sheet.js';
import { presetPicker } from './path.js';
import { icon } from '../icons.js';

function backup(store) {
  const status = h('p', { role: 'status', class: 'muted small-note' });
  const file = h('input', { type: 'file', accept: 'application/json', class: 'visually-hidden', id: 'import-file', onchange: async () => {
    const f = file.files?.[0];
    if (!f) return;
    try { store.importJSON(await f.text()); status.textContent = 'Backup restored. Your sheet now shows the imported progress.'; } catch (e) { status.textContent = `That file could not be restored: ${e.message}. Pick a file exported from OptPrep.`; }
    file.value = '';
  } });
  let armed = null;
  const reset = h('button', { class: 'btn danger', type: 'button', onclick: () => {
    if (!armed) {
      reset.textContent = 'Press again to delete all progress';
      armed = setTimeout(() => { armed = null; reset.textContent = 'Reset progress'; }, 4000);
      return;
    }
    clearTimeout(armed); armed = null;
    store.reset();
    reset.textContent = 'Reset progress';
    status.textContent = 'Progress deleted from this device.';
  } }, 'Reset progress');
  return [
    h('p', {}, 'Progress saves on this device as you go. Export a backup to move it to another browser or device, or before clearing site data.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `optprep-backup-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.append(a); a.click(); a.remove();
        status.textContent = 'Backup downloaded.';
      } }, icon('download', { size: 18 }), 'Export backup'),
      file, h('label', { class: 'btn', for: 'import-file' }, 'Import backup'),
      reset),
    status,
  ];
}

function storageLine(store) {
  const kb = Math.max(1, Math.round(store.bytes / 1024));
  const line = h('p', { class: 'muted small-note' }, `Using ${kb} KB of browser storage.`);
  if (store.readOnly) line.append(' This save came from a newer version of OptPrep, so changes stay in memory until you reload with the newer version.');
  if (store.storageFull) line.append(' Storage is full: older history was trimmed. Export a backup now.');
  navigator.storage?.persisted?.().then((p) => { line.append(p ? ' The browser will keep this data.' : ' The browser may clear this data if space runs low; installing the app or exporting a backup protects it.'); }).catch(() => {});
  return line;
}

export function settingsPage(root, { store }) {
  const goal = store.goalMin();
  const install = canInstall() ? h('button', { class: 'btn', type: 'button', onclick: async () => { if (await promptInstall()) install.replaceWith(h('p', { class: 'muted' }, 'Installed.')); } }, 'Install the app') : null;
  mount(root,
    h('h1', {}, 'Settings'),
    field('Theme', choice({ name: 'theme', value: getTheme(), onChange: setTheme, columns: true, options: [
      { value: 'system', label: 'System', hint: 'Follows your device' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' }] })),
    field('Daily goal', choice({ name: 'goal', value: goal, columns: true, onChange: (v) => store.setSetting('dailyGoalMin', v), options: [
      { value: 5, label: '5 minutes', hint: 'A quick daily habit' },
      { value: 10, label: '10 minutes', hint: 'Recommended' },
      { value: 20, label: '20 minutes', hint: 'Exam is close' }] }),
    h('p', { class: 'muted small-note' }, 'Minutes count only while you answer or read, with the tab open.')),
    field('Battery', h('p', {}, 'Currently: ', h('strong', {}, activePreset().title), '.'), presetPicker(store, { compact: true, onDone: () => settingsPage(root, { store }) })),
    field('Division sign', choice({ name: 'div', value: store.settings().divNotation || 'obelus', columns: true, onChange: (v) => store.setSetting('divNotation', v), options: [
      { value: 'obelus', label: '÷', hint: '84 ÷ 7' },
      { value: 'colon', label: ':', hint: '84 : 7, as some European tests print it' }] })),
    install ? field('App', h('p', {}, 'Install OptPrep to open it from your dock or home screen and practise offline.'), install) : null,
    field('Backup', ...backup(store), storageLine(store)),
    h('p', { class: 'muted small-note' }, 'OptPrep is free and open source. Not affiliated with or endorsed by Optiver.'));
}
