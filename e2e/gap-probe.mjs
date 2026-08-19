// gap-probe.mjs — round24 coverage-gap filler (runs INSIDE the Win7 guest
// with the bundled node). Phase arg: "1" (live app + mock env) or "2"
// (after app restart: persistence re-check).
// Fills the gaps not covered by e2e-full.mjs's 77 checks:
//   A. guest-side CLI smoke (cli / recovery / adapters)
//   B. full agent turn inside guest via localhost mock API (CLI entry)
//   C. desktop WS session flow (REST create -> WS -> user_message ->
//      message_complete), mock-driven
//   D. cron scheduled task create -> manual run -> terminal status
//   E. persistence probe written in phase1, re-read in phase2 (sqlite
//      roundtrip incl. CJK value) + session survival across restart
//   F. terminal tab (pipe-PTY fallback on Win7) via CDP
//   H. H5 static entry (GET / serves dist/index.html)
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileP = promisify(execFile);

const PHASE = process.argv[2] || '1';
const SHARE = '\\\\10.0.2.4\\qemu';
const SHOTS = SHARE + '\\e2e-shots';
const OUT = SHARE + '\\gap-results.json';
const DIST = 'C:\\cc-haha\\resources\\app.asar.unpacked\\dist';
const NODE = 'C:\\cc-haha\\resources\\runtime\\node\\node.exe';
const PROBE_KEY = 'w7Round24Probe';
const PROBE_VAL = '中文持久化探针-✓-round24';

const results = [];
function add(cat, name, ok, detail) {
  results.push({ cat, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
  console.log((ok ? 'PASS' : 'FAIL') + ' [' + cat + '] ' + name + ' :: ' + String(detail || '').slice(0, 200));
}
function flush() { try { fs.writeFileSync(OUT, JSON.stringify(results, null, 1)); } catch (e) { console.log('flush-err ' + e.message); } }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function findPort() {
  const cands = [];
  try {
    const j = JSON.parse(fs.readFileSync((process.env.APPDATA || '') + '\\cc-haha\\desktop-server-state.json', 'utf8'));
    for (const v of [j.port, j.serverPort, j.desktopServerPort]) if (typeof v === 'number' && v > 0) cands.push(v);
  } catch (e) {}
  // netstat fallback: probe every LISTENING port for our /health shape
  try {
    const { execSync } = await import('child_process');
    const out = execSync('netstat -ano -p tcp', { timeout: 15000, encoding: 'utf8', windowsHide: true });
    for (const m of out.matchAll(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING/g)) cands.push(Number(m[1]));
  } catch (e) {}
  return [...new Set(cands)];
}
async function livePort() {
  for (const p of await findPort()) {
    if (p === 8787) continue; // guest mock API also serves /health
    try {
      const r = await fetch('http://127.0.0.1:' + p + '/health', { signal: AbortSignal.timeout(4000) });
      if (!r.ok) continue;
      const s = await fetch('http://127.0.0.1:' + p + '/api/status', { signal: AbortSignal.timeout(4000) });
      if (s.ok) return p;
    } catch (e) {}
  }
  return 0;
}
async function req(port, path, init, timeout = 30000) {
  try {
    const r = await fetch('http://127.0.0.1:' + port + path, { ...init, signal: AbortSignal.timeout(timeout) });
    return { status: r.status, body: await r.text() };
  } catch (e) { return { status: 0, body: 'ERR ' + e.message }; }
}

// ---------- CDP (for terminal tab) ----------
let send, ev;
async function cdpConnect() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('no page');
  const sock = await new Promise((res, rej) => {
    const s = new WebSocket(page.webSocketDebuggerUrl);
    s.addEventListener('open', () => res(s));
    s.addEventListener('error', () => rej(new Error('ws')));
  });
  let mid = 0; const pend = new Map();
  sock.addEventListener('message', e2 => {
    const m = JSON.parse(e2.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  });
  send = (method, params) => new Promise((res, rej) => { const id = ++mid; pend.set(id, { res, rej }); sock.send(JSON.stringify({ id, method, params })); });
  ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
}
async function shot(name) {
  try {
    await send('Page.enable', {});
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const f = SHOTS + '\\' + name + '.png';
    fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
    add('screenshot', name, true, f);
  } catch (e) { add('screenshot', name, false, e.message); }
}

async function cliSmoke() {
  try { const { stdout } = await execFileP(NODE, [DIST + '\\cli.mjs', '--version'], { timeout: 60000 }); add('cli', 'guest cli.mjs --version', /999\.0\.0-local/.test(stdout), stdout.trim()); }
  catch (e) { add('cli', 'guest cli.mjs --version', false, e.message); }
  try { const { stdout } = await execFileP(NODE, [DIST + '\\recovery-cli.mjs', '--help'], { timeout: 60000 }); add('cli', 'guest recovery-cli --help', /usage/i.test(stdout) || stdout.length > 50, stdout.slice(0, 80)); }
  catch (e) { add('cli', 'guest recovery-cli --help', false, e.message); }
  try {
    const r = await execFileP(NODE, [DIST + '\\adapters.mjs', '--telegram'], { timeout: 90000 });
    add('cli', 'guest adapters --telegram (chunk load, no-token path)', /TELEGRAM|token/i.test(r.stdout + r.stderr), (r.stdout + r.stderr).slice(0, 120));
  } catch (e) {
    const t = (e.stdout || '') + (e.stderr || '') + e.message;
    add('cli', 'guest adapters --telegram (chunk load, no-token path)', /token|TELEGRAM/i.test(t), ('exit=' + e.code + ' ') + t.slice(0, 120));
  }
}

async function mockAgentTurn() {
  const wd = (process.env.TEMP || 'C:\\Windows\\Temp') + '\\w7gap';
  fs.mkdirSync(wd, { recursive: true });
  fs.rmSync(wd + '\\hi.txt', { force: true });
  const env = { ...process.env, ANTHROPIC_BASE_URL: 'http://127.0.0.1:8787', ANTHROPIC_API_KEY: 'mock', ANTHROPIC_MODEL: 'claude-fable-5', ANTHROPIC_SMALL_FAST_MODEL: 'claude-fable-5', CALLER_DIR: wd, IS_SANDBOX: '1' };
  delete env.CLAUDE_CONFIG_DIR;
  try {
    const { stdout, stderr } = await execFileP(NODE, [DIST + '\\cli.mjs', '-p', 'FILE-TOOLS: create file hi.txt with content ok, then read it back', '--dangerously-skip-permissions'], { timeout: 300000, cwd: wd, env, windowsHide: true });
    let file = '';
    try { file = fs.readFileSync(wd + '\\hi.txt', 'utf8').trim(); } catch (e2) {}
    add('agent', 'guest agent turn via localhost mock (CLI entry, tool loop)', /FILE-TOOLS-OK|MOCK-OK/.test(stdout + stderr) || file === 'ok', 'file=' + file + ' out=' + (stdout + stderr).slice(0, 120));
  } catch (e) { add('agent', 'guest agent turn via localhost mock (CLI entry, tool loop)', false, 'code=' + e.code + ' msg=' + e.message.slice(0, 100) + ' out=' + ((e.stdout || '') + (e.stderr || '')).slice(0, 120)); }
}

async function wsSessionFlow(port) {
  const base = 'http://127.0.0.1:' + port;
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer sk-mock' };
  const wd = (process.env.TEMP || 'C:\\Windows\\Temp') + '\\w7gap-ws';
  fs.mkdirSync(wd, { recursive: true });
  const c = await req(port, '/api/sessions', { method: 'POST', headers: H, body: JSON.stringify({ workDir: wd, permissionMode: 'bypassPermissions' }) });
  let sessionId = '';
  try { sessionId = (JSON.parse(c.body).id) || (JSON.parse(c.body).sessionId) || ''; } catch (e) {}
  add('ws', 'REST create session', c.status === 201 && !!sessionId, 'HTTP ' + c.status + ' id=' + sessionId + ' body=' + c.body.slice(0, 120));
  if (!sessionId) return;

  const frames = [];
  let complete = null, connected = false, lastErr = '';
  const ws = new WebSocket('ws://127.0.0.1:' + port + '/ws/' + sessionId);
  const done = new Promise((res) => { complete = res; });
  const to = setTimeout(() => complete('timeout'), 300000);
  ws.addEventListener('open', () => { ws.send(JSON.stringify({ type: 'user_message', content: 'FILE-TOOLS: create file hi.txt with content ok, then read it back' })); });
  ws.addEventListener('message', e2 => {
    let m; try { m = JSON.parse(e2.data); } catch { return; }
    frames.push(m.type || '?');
    if (m.type === 'connected') connected = true;
    if (m.type === 'error') lastErr = JSON.stringify(m).slice(0, 300);
    if (m.type === 'message_complete') { clearTimeout(to); complete('complete'); ws.close(); }
  });
  ws.addEventListener('error', () => {});
  const ended = await done;
  add('ws', 'WS connected frame', connected, 'types=' + [...new Set(frames)].slice(0, 8).join(','));
  add('ws', 'WS user_message -> message_complete (mock-driven CLI subprocess)', ended === 'complete', 'ended=' + ended + ' frames=' + frames.length + (lastErr ? ' lastError=' + lastErr : ''));
  const d = await req(port, '/api/sessions/' + sessionId, { headers: H });
  let mc = -1; try { const j = JSON.parse(d.body); mc = j.messageCount ?? j.session?.messageCount ?? -1; } catch (e) {}
  add('ws', 'session detail after turn (messages persisted)', d.status === 200 && mc >= 1, 'HTTP ' + d.status + ' messageCount=' + mc);
  fs.writeFileSync(SHARE + '\\gap-session-id.txt', sessionId);
}

async function cronFlow(port) {
  const H = { 'Content-Type': 'application/json' };
  const c = await req(port, '/api/scheduled-tasks', { method: 'POST', headers: H, body: JSON.stringify({ name: 'w7-round24-probe', cron: '0 3 * * *', prompt: 'FILE-TOOLS: create file hi.txt with content ok, then read it back', enabled: true, recurring: true }) });
  let id = '';
  try { id = JSON.parse(c.body).task?.id || ''; } catch (e) {}
  add('cron', 'create scheduled task', c.status === 201 && !!id, 'HTTP ' + c.status + ' id=' + id);
  if (!id) return;
  const r = await req(port, '/api/scheduled-tasks/' + id + '/run', { method: 'POST', headers: H });
  add('cron', 'manual run accepted', r.status === 200, 'HTTP ' + r.status + ' ' + r.body.slice(0, 60));
  // poll task for a run record reaching a terminal status
  let terminal = '', lastRuns = 0, lastJson = '';
  for (let i = 0; i < 40; i++) {
    await sleep(5000);
    const t = await req(port, '/api/scheduled-tasks');
    let task = null;
    try { task = JSON.parse(t.body).tasks?.find(x => x.id === id); } catch (e) {}
    const rr = await req(port, '/api/scheduled-tasks/' + id + '/runs');
    let runsArr = [];
    try { runsArr = JSON.parse(rr.body).runs || JSON.parse(rr.body) || []; } catch (e) {}
    if (Array.isArray(runsArr) && runsArr.length && !task?.runs) task = { ...(task || {}), runs: runsArr };
    if (task) {
      lastJson = JSON.stringify(task).slice(0, 400);
      const runs = task.runs || task.runHistory || task.executionHistory || [];
      lastRuns = runs.length;
      const st = runs[runs.length - 1]?.status || task.lastRunStatus || task.status || '';
      // require a SUCCESSFUL terminal run — 'failed' means the spawn chain or
      // prompt execution broke, which must not silently pass
      if (['completed', 'success'].includes(String(st).toLowerCase())) { terminal = st; break; }
      if (['failed', 'error'].includes(String(st).toLowerCase())) { terminal = ''; break; }
    }
  }
  add('cron', 'task run reached SUCCESS terminal status (scheduler+spawn chain live)', !!terminal, 'status=' + terminal + ' runs=' + lastRuns + ' task=' + lastJson.slice(0, 200));
}

async function h5Entry(port) {
  const r = await req(port, '/', {});
  add('h5', 'GET / serves H5 static entry', r.status === 200 && /html/i.test(r.body), 'HTTP ' + r.status + ' len=' + r.body.length);
}

async function persistenceWrite(port) {
  const H = { 'Content-Type': 'application/json' };
  const r = await req(port, '/api/settings/user', { method: 'PUT', headers: H, body: JSON.stringify({ [PROBE_KEY]: PROBE_VAL }) });
  add('persist', 'write CJK settings probe', r.status === 200, 'HTTP ' + r.status);
}

async function persistenceRead(port) {
  const r = await req(port, '/api/settings/user');
  let ok = false, detail = 'HTTP ' + r.status;
  try { const j = JSON.parse(r.body); ok = j[PROBE_KEY] === PROBE_VAL; detail += ' val=' + j[PROBE_KEY]; } catch (e) { detail += ' parse-err'; }
  add('persist', 'settings survive app restart (sqlite, CJK roundtrip)', ok, detail);
  try {
    const sid = fs.readFileSync(SHARE + '\\gap-session-id.txt', 'utf8').trim();
    const s = await req(port, '/api/sessions');
    const listed = s.body.includes(sid);
    add('persist', 'WS session survives app restart', listed, 'id=' + sid.slice(0, 12) + ' listed=' + listed);
  } catch (e) { add('persist', 'WS session survives app restart', false, e.message); }
}

async function terminalTab() {
  try {
    await cdpConnect();
    // try clicking a Terminal entry in the sidebar/titlebar
    const clicked = await ev(`(() => {
      const cands = [...document.querySelectorAll('button,[role=tab],a')].filter(e => e.offsetParent && /terminal|终端/i.test(e.textContent.trim()));
      if (!cands.length) return { ok: false, n: 0 };
      cands[0].click(); return { ok: true, label: cands[0].textContent.trim().slice(0, 30) };
    })()`);
    await sleep(9000);
    const xterm = await ev(`(() => ({
      xterm: !!document.querySelector('.xterm'),
      rows: document.querySelectorAll('.xterm-rows').length,
      text: (document.querySelector('.xterm-rows')||{}).textContent?.slice(0,80) || ''
    }))()`);
    add('term', 'terminal tab click', !!clicked && clicked.ok, JSON.stringify(clicked));
    add('term', 'xterm DOM mounted (pipe-PTY fallback live)', !!xterm.xterm, JSON.stringify(xterm));
    await shot('40-terminal-tab');
  } catch (e) { add('term', 'terminal tab (CDP)', false, e.message); }
}

async function main() {
  console.log('=== gap-probe phase ' + PHASE + ' ' + new Date().toISOString() + ' ===');
  const port = await livePort();
  add('server', 'port discovery', port > 0, 'port=' + port);
  if (!port) { flush(); process.exit(1); }

  if (PHASE === '1') {
    await cliSmoke();
    await mockAgentTurn();
    await wsSessionFlow(port);
    await cronFlow(port);
    await h5Entry(port);
    await persistenceWrite(port);
    await terminalTab();
  } else {
    await persistenceRead(port);
  }
  flush();
  console.log('GAP-PHASE-' + PHASE + '-DONE results=' + results.length + ' fail=' + results.filter(x => !x.ok).length);
  process.exit(0);
}
main().catch(e => { console.error('GAP-FAIL', e); flush(); process.exit(1); });
