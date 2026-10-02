// GitHub Gist sync: the user's own fine-grained token (Gists: read and write only), one
// secret gist, optional passphrase encryption. The token never leaves this browser except
// in the Authorization header to api.github.com. Talks only to api.github.com.
import { SYNC_FILE, SYNC_DESCRIPTION, decide, pack, unpack } from '../core/cloud.js';

const KEY = 'optprep:gist';
const API = 'https://api.github.com';

export function gistConfig() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
function saveConfig(c) { try { if (c) localStorage.setItem(KEY, JSON.stringify(c)); else localStorage.removeItem(KEY); } catch { /* memory only */ } }

async function api(token, path, { method = 'GET', body, fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) throw new Error('GitHub did not accept the token. Check it has not expired and has Gists read and write access.');
  if (r.status === 403 || r.status === 404) throw new Error('The token cannot reach gists. Create a fine-grained token with the Gists permission set to read and write.');
  if (!r.ok) throw new Error(`GitHub answered ${r.status}. Try again in a minute.`);
  return r.status === 204 ? null : r.json();
}

async function findGist(token, opts) {
  for (let page = 1; page <= 5; page++) {
    const list = await api(token, `/gists?per_page=100&page=${page}`, opts);
    const hit = list.find((g) => g.description === SYNC_DESCRIPTION && g.files?.[SYNC_FILE]);
    if (hit || list.length < 100) return hit || null;
  }
  return null;
}

async function readGist(token, id, opts) {
  const g = await api(token, `/gists/${id}`, opts);
  const f = g.files?.[SYNC_FILE];
  if (!f) return null;
  if (!f.truncated) return f.content;
  const r = await (opts?.fetchImpl || fetch)(f.raw_url);
  return r.text();
}

// One sync round. Returns { action, remote? } where action is what happened, or
// 'conflict' with both saves so the page can ask the user which one to keep.
export async function syncNow(store, { fetchImpl, choose } = {}) {
  const cfg = gistConfig();
  if (!cfg?.token) return { action: 'off' };
  const opts = { fetchImpl };
  if (!cfg.gistId) { const g = await findGist(cfg.token, opts); if (g) cfg.gistId = g.id; }
  const text = cfg.gistId ? await readGist(cfg.token, cfg.gistId, opts) : null;
  const remote = text ? await unpack(text, cfg.passphrase) : null;
  let action = choose || decide({ updatedAt: store.state.updatedAt || 0, empty: store.isEmpty() }, remote, cfg.last || null);
  if (action === 'conflict') return { action, remote };
  if (action === 'pull') { store.adopt(remote); }
  if (action === 'push' || action === 'keep-local') {
    store.save();
    const body = { description: SYNC_DESCRIPTION, files: { [SYNC_FILE]: { content: await pack(store.state, cfg.passphrase) } } };
    if (cfg.gistId) await api(cfg.token, `/gists/${cfg.gistId}`, { method: 'PATCH', body, ...opts });
    else cfg.gistId = (await api(cfg.token, '/gists', { method: 'POST', body: { ...body, public: false }, ...opts })).id;
    action = 'push';
  }
  cfg.last = { localAt: store.state.updatedAt || 0, remoteAt: action === 'pull' ? remote.updatedAt || 0 : store.state.updatedAt || 0, at: Date.now() };
  saveConfig(cfg);
  return { action };
}

export function connectGist({ token, passphrase }) { saveConfig({ token: token.trim(), passphrase: passphrase || '', gistId: null, last: null }); }
export function disconnectGist() { saveConfig(null); }
