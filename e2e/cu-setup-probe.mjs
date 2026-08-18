// Guest-side probe: POST /api/computer-use/setup while a custom python path
// (pointing at the bundled embeddable python) is configured. Asserts the
// improved venv fallback reports success:true.
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileP = promisify(execFile);

const SHARE = '\\\\10.0.2.4\\qemu';
const OUT = SHARE + '\\vm\\cu-setup-probe-result.txt';
const lines = [];
const log = (m) => { lines.push(m); console.log(m); };

async function listeningPorts() {
  try {
    const { stdout } = await execFileP('cmd', ['/c', 'netstat -ano -p tcp'], { timeout: 15000 });
    const ports = new Set();
    for (const m of stdout.matchAll(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING/g)) ports.add(Number(m[1]));
    return [...ports];
  } catch (e) { return []; }
}

function findPort() {
  const cands = [];
  const p = (process.env.APPDATA || '') + '\\cc-haha\\desktop-server-state.json';
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const v of [j.port, j.serverPort, j.desktopServerPort]) if (typeof v === 'number' && v > 0) cands.push(v);
  } catch (e) {}
  cands.push(49276);
  return [...new Set(cands)];
}

async function req(port, path, init, timeout = 600000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch('http://127.0.0.1:' + port + path, { ...init, signal: ctrl.signal });
    const t = await r.text();
    clearTimeout(to);
    return { status: r.status, body: t };
  } catch (e) { clearTimeout(to); return { status: 0, body: 'ERR ' + e.message }; }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let port = null;
for (let attempt = 0; attempt < 24 && !port; attempt++) {
  const cands = [...new Set([...findPort(), ...(await listeningPorts())])];
  for (const p of cands) {
    if (p < 1024 || p === 9222) continue;
    const r = await req(p, '/api/computer-use/status', {}, 6000);
    if (r.status === 200) { port = p; break; }
  }
  if (!port) await sleep(10000);
}
log('PORT ' + port);
if (!port) { fs.writeFileSync(OUT, lines.join('\n')); process.exit(1); }

// confirm the custom python path is still configured (set by round19g E2E)
const st = await req(port, '/api/computer-use/status', {}, 20000);
log('STATUS ' + st.body.slice(0, 400));

// delete any stale venv-base marker so setup actually exercises the venv path
try { fs.rmSync(process.env.USERPROFILE + '\\.claude\\.runtime\\venv-base-interpreter.txt', { force: true }); } catch (e) {}

const r = await req(port, '/api/computer-use/setup', { method: 'POST' }, 600000);
log('SETUP HTTP ' + r.status);
let ok = false, venvStep = null;
try {
  const j = JSON.parse(r.body);
  ok = j.success === true;
  venvStep = (j.steps || []).find(s => s.name === 'venv');
} catch (e) { log('parse-err ' + e.message); }
log('SETUP success=' + ok);
log('venv step: ' + JSON.stringify(venvStep));
log(ok && venvStep && venvStep.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
fs.writeFileSync(OUT, lines.join('\n'));
process.exit(ok ? 0 : 1);
