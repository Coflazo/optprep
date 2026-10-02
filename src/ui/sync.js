// Backend sync. When the Python server is running, answers and exam runs go to
// SQLite (the analytics input) and the full state is mirrored for backup. Without
// it, everything keeps working from localStorage. The backend only ever runs on this
// machine, so a hosted copy (GitHub Pages) never probes for it.
export const isLocalHost = (host) => ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(String(host ?? '').toLowerCase());

export function createSync(fetchImpl = (...a) => fetch(...a), host = globalThis.location?.hostname) {
  let online = false;
  let stateTimer = null;
  const queue = [];
  const post = (path, body, method = 'POST') => fetchImpl(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  async function flush() {
    if (!online || !queue.length) return;
    const batch = queue.splice(0, queue.length);
    try { await post('api/answers', batch); } catch { queue.unshift(...batch); }
  }

  const hooks = {
    answer(row) { queue.push(row); if (online) flush(); },
    run(run) { if (online) post('api/runs', run).catch(() => {}); },
    state(state) {
      if (!online) return;
      clearTimeout(stateTimer);
      stateTimer = setTimeout(() => post('api/state', state, 'PUT').catch(() => {}), 1500);
    },
  };

  return {
    hooks,
    get online() { return online; },
    async start(store) {
      if (!isLocalHost(host)) return false;
      try {
        const r = await fetchImpl('api/health');
        online = r.ok && (await r.json()).ok === true;
      } catch { online = false; }
      if (!online) return false;
      // A browser with no local progress picks up the server snapshot (switching browsers).
      const empty = !store.state.runs.length && !Object.keys(store.stats()).length;
      if (empty) {
        try {
          const s = await (await fetchImpl('api/state')).json();
          if (s.state) store.adopt(s.state);
        } catch { /* stay local */ }
      }
      flush();
      return true;
    },
    async analytics() { if (!online) return null; try { return await (await fetchImpl('api/analytics')).json(); } catch { return null; } },
    async verification() { if (!online) return null; try { return (await (await fetchImpl('api/verification')).json()).report; } catch { return null; } },
  };
}
