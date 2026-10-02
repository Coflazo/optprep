import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, pack, unpack, describe as describeSave, SYNC_FILE, SYNC_DESCRIPTION } from '../../src/core/cloud.js';
import { makeStore, memoryBackend } from '../../src/core/store.js';

test('decide: push, pull, none and conflict', () => {
  assert.equal(decide({ updatedAt: 5 }, null, null), 'push');
  assert.equal(decide({ updatedAt: 0, empty: true }, { updatedAt: 9 }, null), 'pull');
  assert.equal(decide({ updatedAt: 3, empty: false }, { updatedAt: 9 }, null), 'conflict');
  const last = { localAt: 10, remoteAt: 10 };
  assert.equal(decide({ updatedAt: 10 }, { updatedAt: 10 }, last), 'none');
  assert.equal(decide({ updatedAt: 12 }, { updatedAt: 10 }, last), 'push');
  assert.equal(decide({ updatedAt: 10 }, { updatedAt: 14 }, last), 'pull');
  assert.equal(decide({ updatedAt: 12 }, { updatedAt: 14 }, last), 'conflict');
});

test('pack and unpack round-trip, plain and encrypted', async () => {
  const state = { version: 2, runs: [], stats: { 'bto:x': { n: 3, correct: 2, ms: 1 } }, updatedAt: 42 };
  assert.deepEqual(await unpack(await pack(state)), state);
  const sealed = await pack(state, 'correct horse');
  assert.ok(!sealed.includes('bto:x'), 'encrypted file must not contain the progress in clear');
  assert.deepEqual(await unpack(sealed, 'correct horse'), state);
  await assert.rejects(unpack(sealed, 'wrong'), /passphrase does not match/);
  await assert.rejects(unpack(sealed), /encrypted/);
  await assert.rejects(unpack('{"app":"other"}'), /not written by OptPrep/);
  assert.equal(describeSave(state).answers, 3);
});

// A fake GitHub holding gists in memory.
function fakeGithub() {
  const gists = new Map();
  let n = 0;
  const fetchImpl = async (url, { method = 'GET', body, headers } = {}) => {
    assert.match(headers.Authorization, /^Bearer t0k/);
    const u = new URL(url);
    const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.pathname === '/gists' && method === 'GET') return ok([...gists.values()]);
    if (u.pathname === '/gists' && method === 'POST') { const id = `g${++n}`; const g = { id, ...JSON.parse(body) }; gists.set(id, g); assert.equal(g.public, false); return ok(g); }
    const id = u.pathname.split('/').pop();
    if (method === 'PATCH') { const g = gists.get(id); g.files = JSON.parse(body).files; return ok(g); }
    return ok(gists.get(id));
  };
  return { gists, fetchImpl };
}

test('two devices: first pushes, an empty second pulls, a changed pair asks', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const { syncNow, connectGist, gistConfig } = await import('../../src/ui/gist.js');
  const gh = fakeGithub();
  let t = 1000;
  const a = makeStore(memoryBackend(), {}, { clock: () => (t += 10) });
  a.recordAnswer('bto', 'two-dice-sum', { correct: true, ms: 4000 });
  connectGist({ token: 't0k', passphrase: 'pw' });
  assert.equal((await syncNow(a, { fetchImpl: gh.fetchImpl })).action, 'push');
  const file = [...gh.gists.values()][0];
  assert.equal(file.description, SYNC_DESCRIPTION);
  assert.ok(file.files[SYNC_FILE].content.includes('"encrypted":true'));

  // Second device, same token, nothing local: it pulls.
  mem.clear();
  const b = makeStore(memoryBackend(), {}, { clock: () => (t += 10) });
  connectGist({ token: 't0k', passphrase: 'pw' });
  assert.equal((await syncNow(b, { fetchImpl: gh.fetchImpl })).action, 'pull');
  assert.equal(b.stats()['bto:two-dice-sum'].n, 1);
  assert.ok(gistConfig().gistId);

  // Both change before syncing: the user is asked, then their choice wins.
  const bCfg = gistConfig();
  b.recordAnswer('bto', 'two-dice-sum', { correct: false, ms: 3000 });
  gh.gists.get(bCfg.gistId).files[SYNC_FILE].content = await (await import('../../src/core/cloud.js')).pack({ ...b.state, stats: { 'nl:x': { n: 9, correct: 9, ms: 0 } }, updatedAt: t + 1e6 }, 'pw');
  const res = await syncNow(b, { fetchImpl: gh.fetchImpl });
  assert.equal(res.action, 'conflict');
  assert.equal((await syncNow(b, { fetchImpl: gh.fetchImpl, choose: 'keep-local' })).action, 'push');
  assert.equal((await syncNow(b, { fetchImpl: gh.fetchImpl })).action, 'none');
  delete globalThis.localStorage;
});
