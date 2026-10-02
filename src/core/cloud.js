// Optional sync through the user's own GitHub Gist. Pure parts only: what to do at a sync,
// and the (optional) passphrase encryption. Each side keeps one full save; when both
// changed since the last sync the user chooses, so nothing is merged or lost silently.
export const SYNC_FILE = 'optprep-progress.json';
export const SYNC_DESCRIPTION = 'OptPrep progress (synced by the app)';

// local: { updatedAt, empty }, remote: { updatedAt } or null, last: { localAt, remoteAt } or
// null (this device has never synced). Returns 'push' | 'pull' | 'conflict' | 'none'.
export function decide(local, remote, last) {
  if (!remote) return 'push';
  if (!last) return local.empty ? 'pull' : 'conflict';
  const localChanged = (local.updatedAt || 0) > (last.localAt || 0);
  const remoteChanged = (remote.updatedAt || 0) > (last.remoteAt || 0);
  if (localChanged && remoteChanged) return 'conflict';
  if (remoteChanged) return 'pull';
  if (localChanged) return 'push';
  return 'none';
}

// A short description of a save, shown when the user has to choose between two.
export function describe(state) {
  const answers = Object.values(state?.stats || {}).reduce((s, x) => s + (x.n || 0), 0);
  const exams = (state?.runs || []).filter((r) => r.mode === 'exam').length;
  return { answers, exams, updatedAt: state?.updatedAt || null };
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function keyFrom(passphrase, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// The file written to the gist. With a passphrase the save is AES-GCM encrypted.
export async function pack(state, passphrase) {
  const text = JSON.stringify(state);
  if (!passphrase) return JSON.stringify({ app: 'optprep', v: 1, encrypted: false, state });
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(passphrase, salt), enc.encode(text));
  return JSON.stringify({ app: 'optprep', v: 1, encrypted: true, salt: b64(salt), iv: b64(iv), data: b64(data), updatedAt: state.updatedAt || null });
}

export async function unpack(text, passphrase) {
  const f = JSON.parse(text);
  if (f?.app !== 'optprep' || f.v !== 1) throw new Error('This gist file was not written by OptPrep.');
  if (!f.encrypted) return f.state;
  if (!passphrase) throw new Error('This progress is encrypted. Enter the passphrase you used on the other device.');
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(f.iv) }, await keyFrom(passphrase, unb64(f.salt)), unb64(f.data));
    return JSON.parse(dec.decode(plain));
  } catch { throw new Error('The passphrase does not match the one used to encrypt this progress.'); }
}
