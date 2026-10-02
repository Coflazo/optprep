// Install prompt and offline service worker.
//
// The worker is registered only on a hosted https copy (GitHub Pages). On 127.0.0.1 or
// localhost it never registers: a worker there would keep controlling that origin and
// could answer for a different local app that later uses the same port.
//
// Events on window:
//   'optprep:update'       a new version is installed and waiting; call
//                          event.detail.apply() (or applyUpdate()) to reload into it.
//   'optprep:installable'  the browser offered an install prompt; canInstall() is now true.
import { isLocalHost } from './sync.js';

let deferredPrompt = null;
let waiting = null;
let reloadOnChange = false;

export const canInstall = () => deferredPrompt !== null;

/** Shows the browser's install dialog. Resolves true when the reader accepted. */
export async function promptInstall() {
  const e = deferredPrompt;
  if (!e) return false;
  deferredPrompt = null;
  e.prompt();
  return (await e.userChoice).outcome === 'accepted';
}

/** Activates the waiting version and reloads once it controls the page. */
export function applyUpdate() {
  if (!waiting) return false;
  reloadOnChange = true;
  waiting.postMessage('skip-waiting');
  return true;
}

export function initPwa(win = window) {
  win.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    win.dispatchEvent(new Event('optprep:installable'));
  });
  win.addEventListener('appinstalled', () => { deferredPrompt = null; });

  const sw = win.navigator.serviceWorker;
  if (!sw || win.location.protocol !== 'https:' || isLocalHost(win.location.hostname)) return;
  const notify = (worker) => {
    waiting = worker;
    win.dispatchEvent(new CustomEvent('optprep:update', { detail: { apply: applyUpdate } }));
  };
  sw.addEventListener('controllerchange', () => { if (reloadOnChange) win.location.reload(); });
  sw.register('sw.js').then((reg) => {
    // With no controller this is the first install, not an update.
    if (reg.waiting && sw.controller) notify(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && sw.controller) notify(worker); });
    });
  }).catch(() => { /* offline support is optional */ });
}
