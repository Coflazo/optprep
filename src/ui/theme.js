// Theme: 'system' (default, follows the OS live), 'light' or 'dark'. The choice lives in
// its own small key so theme-boot.js can apply it before the app loads.
const KEY = 'optprep:theme';
export const THEMES = ['system', 'light', 'dark'];

export function getTheme() {
  try { const t = localStorage.getItem(KEY); return THEMES.includes(t) ? t : 'system'; } catch { return 'system'; }
}

export function effectiveTheme(choice, prefersDark) {
  return choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
}

const media = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

function paint(choice) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme; else root.dataset.theme = choice;
  const dark = effectiveTheme(choice, media()?.matches) === 'dark';
  // Browser chrome (mobile address bar, installed-app title bar) follows the app theme.
  for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.setAttribute('content', dark ? '#021129' : '#F4F7FA');
}

export function setTheme(choice) {
  if (!THEMES.includes(choice)) return;
  try { if (choice === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, choice); } catch { /* memory only */ }
  const swap = () => paint(choice);
  // Cross-fade the switch where the View Transitions API exists.
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const t = document.startViewTransition(swap); t.ready.catch(() => {}); t.finished.catch(() => {}); } else swap();
  window.dispatchEvent(new CustomEvent('optprep:theme', { detail: choice }));
}

export function initTheme() {
  paint(getTheme());
  media()?.addEventListener?.('change', () => paint(getTheme()));
}
