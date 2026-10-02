#!/usr/bin/env node
// OptPrep launcher: serves the app folder on 127.0.0.1 and opens the browser.
// No dependencies; runs on Node 20+ on macOS, Windows and Linux.
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_PORT = 8765;
const PORT_TRIES = 20;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

// Folders that exist in a git checkout but are never part of the app.
const DENY = new Set(['backend', 'engine', 'tools', 'tests', 'node_modules', 'screenshots']);
// Every file the app serves has a plain ASCII name. Anything else (percent-escapes left after
// decoding, backslashes, colons, '~' short names, non-ASCII look-alikes) is refused outright.
const SEGMENT = /^[a-z0-9_-][a-z0-9._-]*$/;

/**
 * Maps a request URL to a file path relative to the app root, or null for 404.
 * Decodes first, then normalises, then case-folds, so encoded or differently-cased
 * spellings of a private folder (%62ackend, Backend) are caught on any file system.
 */
export function requestPath(rawUrl) {
  let p = String(rawUrl ?? '').split(/[?#]/, 1)[0];
  try { p = decodeURIComponent(p); } catch { return null; }
  if (!p.startsWith('/')) return null;
  const parts = p.split('/').filter(Boolean);
  for (const part of parts) {
    const low = part.toLowerCase();
    // Leading dot: '.', '..', .git, .env. Trailing dot: Windows treats 'backend.' as 'backend'.
    if (!SEGMENT.test(low) || low.endsWith('.')) return null;
    if (DENY.has(low) || low.startsWith('brag-output')) return null;
  }
  if (!parts.length || p.endsWith('/')) parts.push('index.html');
  return parts.join('/');
}

/** The Host header must name this server: stops DNS-rebinding pages from reading the app. */
export function hostAllowed(host, port) {
  return [`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(String(host ?? '').toLowerCase());
}

function handle(req, res) {
  const send = (code, body, headers = {}) => {
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...headers });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (!hostAllowed(req.headers.host, req.socket.localPort)) return send(421, 'Misdirected request\n');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed\n', { Allow: 'GET, HEAD' });
  // The static launcher has no backend; answer the app's probe instead of logging a 404.
  if (req.url.split('?', 1)[0] === '/api/health') return send(200, '{"ok":false}', { 'Content-Type': 'application/json' });
  const rel = requestPath(req.url);
  const type = rel && MIME[extname(rel).toLowerCase()];
  if (!type) return send(404, 'Not found\n');
  let file, size;
  try {
    file = realpathSync(join(ROOT, rel));
    const st = statSync(file);
    if (!file.startsWith(ROOT + sep) || !st.isFile()) return send(404, 'Not found\n');
    size = st.size;
  } catch { return send(404, 'Not found\n'); }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (e) => { server.off('listening', onListening); reject(e); };
    const onListening = () => { server.off('error', onError); resolve(); };
    server.once('error', onError).once('listening', onListening).listen(port, '127.0.0.1');
  });
}

async function listenFrom(server, first) {
  for (let port = first; port < first + PORT_TRIES; port++) {
    try { await listen(server, port); return port; } catch (e) { if (e.code !== 'EADDRINUSE') throw e; }
  }
  throw new Error(`ports ${first}-${first + PORT_TRIES - 1} are all in use; pick another with --port`);
}

function openBrowser(url) {
  // detached keeps a browser started by xdg-open alive when Ctrl+C stops this process group.
  const [cmd, args, opts] = process.platform === 'darwin' ? ['open', [url], { detached: true }]
    // ComSpec is cmd.exe's full path; a bare 'cmd' would also match a cmd.exe in the current folder.
    : process.platform === 'win32' ? [process.env.ComSpec || 'cmd.exe', ['/c', 'start', '""', url], { windowsVerbatimArguments: true, windowsHide: true }]
      : ['xdg-open', [url], { detached: true }];
  const child = spawn(cmd, args, { stdio: 'ignore', ...opts });
  child.on('error', () => console.log(`Could not open a browser; open ${url} yourself.`));
  child.unref();
}

const runs = (cmd, args) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;

// The Python backend serves the app and /api on the same port; it ships with the git repo only.
async function startBackend(port) {
  const dir = join(ROOT, 'backend');
  if (!existsSync(join(dir, 'oa_backend', 'server.py'))) {
    console.log('The Python backend ships with the git repository, not the npm package. Serving the app without it.');
    return null;
  }
  const uv = ['uv', join(homedir(), '.local', 'bin', 'uv')].find((c) => runs(c, ['--version']));
  const py = !uv && ['python3', 'python', 'py'].find((c) => runs(c, ['-c', 'import sys; sys.exit(sys.version_info < (3, 10))']));
  if (!uv && !py) {
    console.log('--backend needs uv (https://docs.astral.sh/uv/) or Python 3.10+. Serving the app without it.');
    return null;
  }
  const args = ['-m', 'oa_backend.server', '--port', String(port)];
  const child = uv ? spawn(uv, ['run', 'python', ...args], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] })
    : spawn(py, args, { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
  child.on('error', () => {});
  // First uv run may create the virtual environment, so allow it some time.
  for (let i = 0; i < 150 && child.exitCode === null; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return child; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  console.log('The Python backend did not start. Serving the app without it.');
  return null;
}

const HELP = `Usage: optprep [options]

Serves OptPrep on http://127.0.0.1 and opens it in your browser.

Options:
  --port N     port to try first (default ${DEFAULT_PORT}; the next free one is used if taken)
  --no-open    do not open a browser
  --backend    also run the Python backend (git checkout with uv or Python 3.10+)
  --help       show this help
  --version    print the version`;

function parseArgs(argv) {
  const o = { port: DEFAULT_PORT, open: true, backend: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--version' || a === '-v') o.version = true;
    else if (a === '--no-open') o.open = false;
    else if (a === '--backend') o.backend = true;
    else if (a === '--port' || a.startsWith('--port=')) {
      const v = Number(a.includes('=') ? a.slice(7) : argv[++i]);
      if (!Number.isInteger(v) || v < 1 || v > 65535) throw new Error('--port needs a number between 1 and 65535');
      o.port = v;
    } else throw new Error(`unknown option ${a}`);
  }
  return o;
}

async function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) {
    console.error(`optprep: ${e.message}\n\n${HELP}`);
    process.exit(2);
  }
  if (o.help) return console.log(HELP);
  if (o.version) return console.log(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version);

  const server = createServer(handle);
  const port = await listenFrom(server, o.port);
  let backend = null;
  if (o.backend) {
    // Hand the free port to the backend, which serves the app and /api together.
    await new Promise((r) => server.close(r));
    backend = await startBackend(port);
    if (!backend) await listen(server, port);
  }

  const url = `http://127.0.0.1:${port}`;
  console.log(`OptPrep is running at ${url}${backend ? ' with the Python backend' : ''} (Ctrl+C to stop)`);
  if (o.open) openBrowser(url);

  const stop = () => { backend?.kill(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  backend?.on('exit', (code) => { console.log(`The Python backend stopped (exit ${code}).`); process.exit(code ?? 1); });
}

// npx runs this file through a symlink in node_modules/.bin, so compare real paths.
const isMain = (() => { try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } })();
if (isMain) main().catch((e) => { console.error(`optprep: ${e.message}`); process.exit(1); });
