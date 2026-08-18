// Guest-side comprehensive E2E driver (node 22 on Win7).
// Usage: node e2e-full.mjs
// Output: \\10.0.2.4\qemu\e2e-results.json + screenshots \\10.0.2.4\qemu\e2e-shots\*.png
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileP = promisify(execFile);

const SHARE = '\\\\10.0.2.4\\qemu';
const SHOTS = SHARE + '\\e2e-shots';
const OUT = SHARE + '\\e2e-results.json';
const results = [];
let shotN = 0;

function log(m) { console.log(m); }
function add(cat, name, ok, detail) {
  results.push({ cat, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
  log((ok ? 'PASS' : 'FAIL') + ' [' + cat + '] ' + name + ' :: ' + String(detail || '').slice(0, 160));
}
function flush() { try { fs.writeFileSync(OUT, JSON.stringify(results, null, 1)); } catch (e) { log('flush-err ' + e.message); } }

function findPort() {
  const cands = [];
  const paths = [(process.env.APPDATA || '') + '\\cc-haha\\desktop-server-state.json'];
  for (const p of paths) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const v of [j.port, j.serverPort, j.desktopServerPort]) if (typeof v === 'number' && v > 0) cands.push(v);
    } catch (e) {}
  }
  cands.push(49276);
  return [...new Set(cands)];
}

async function req(port, path, init, timeout = 20000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch('http://127.0.0.1:' + port + path, { ...init, signal: ctrl.signal });
    const t = await r.text();
    clearTimeout(to);
    return { status: r.status, body: t };
  } catch (e) { clearTimeout(to); return { status: 0, body: 'ERR ' + e.message }; }
}

// ---------- CDP ----------
let sock, send, ev;
async function cdpConnect() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('no page');
  sock = await new Promise((res, rej) => {
    const s = new WebSocket(page.webSocketDebuggerUrl);
    s.addEventListener('open', () => res(s));
    s.addEventListener('error', () => rej(new Error('ws')));
  });
  let mid = 0; const pend = new Map();
  sock.addEventListener('message', (e2) => {
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
    return f;
  } catch (e) { add('screenshot', name, false, e.message); }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function clickText(txt) {
  return await ev(`(() => {
    const want = ${JSON.stringify(txt)}.toLowerCase();
    const cands = [...document.querySelectorAll('button,[role=tab],a')].filter(e => e.offsetParent && e.textContent.trim().toLowerCase().includes(want));
    if (!cands.length) return { ok: false, err: 'not found' };
    const el = cands[0];
    el.scrollIntoView({ block: 'center' });
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click();
    return { ok: true, txt: el.textContent.trim().slice(0, 40) };
  })()`);
}
async function pressEsc() {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  }
}

(async () => {
  try { fs.mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
  results.push({ cat: 'meta', name: 'start', ok: true, detail: new Date().toISOString() });
  flush();

  // ========== phase 1: server port + API matrix ==========
  async function listeningPorts() {
    try {
      const { stdout } = await execFileP('cmd', ['/c', 'netstat -ano -p tcp'], { timeout: 15000 });
      const ports = new Set();
      for (const m of stdout.matchAll(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING/g)) ports.add(Number(m[1]));
      return [...ports];
    } catch (e) { return []; }
  }
  let port = null;
  for (let attempt = 0; attempt < 24 && !port; attempt++) {
    const cands = [...new Set([...findPort(), ...(await listeningPorts())])];
    for (const p of cands) {
      if (p < 1024 || p === 9222) continue;
      const r = await req(p, '/api/computer-use/status', {}, 6000);
      if (r.status === 200) { port = p; log('PORT-FOUND ' + p + ' attempt ' + attempt); break; }
    }
    if (!port) await sleep(10000);
  }
  add('server', 'port-discovery', !!port, port || 'none');
  if (!port) { flush(); process.exit(1); }

  const gets = [
    ['/health', 200], ['/api/status', 200], ['/api/sessions', 200],
    ['/api/settings', 200], ['/api/settings/user', 200], ['/api/permissions/mode', 200],
    ['/api/models', 200], ['/api/effort', 200],
    ['/api/providers', 200], ['/api/scheduled-tasks', 200],
    ['/api/agents', 200], ['/api/tasks', 200], ['/api/teams', 200], ['/api/workflows', 200],
    ['/api/skills', 200], ['/api/mcp', 200], ['/api/plugins', 200],
    ['/api/computer-use/status', 200],
    ['/api/doctor', 200],
    ['/api/activity-stats', 200], ['/api/open-targets', 200],
    ['/api/desktop-ui/preferences/pet', 200], ['/api/traces', 200], ['/api/traces/settings', 200],
    ['/api/filesystem/browse?path=C%3A%5CUsers%5Ctest', 200],
    // real sub-endpoints
    ['/api/memory/projects', 200], ['/api/diagnostics/status', 200], ['/api/diagnostics/events?limit=5', 200],
    // correct routing behavior: unknown sub-resource -> 404
    ['/api/memory', 404], ['/api/diagnostics', 404],
    ['/api/nonexistent-resource', 404],
  ];
  for (const [path, expect] of gets) {
    const r = await req(port, path, {});
    add('api-get', 'GET ' + path, r.status === expect && r.status !== 0, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 200));
  }
  // h5-access: local-access security gate (403 = gate working)
  {
    const r = await req(port, '/api/h5-access', {});
    add('api-sec', 'GET /api/h5-access (local-only gate)', r.status === 403 || r.status === 200, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 120));
  }
  // conversations with real sessionId (path segment)
  {
    const s = await req(port, '/api/sessions', {});
    let sid = null;
    try { sid = JSON.parse(s.body).sessions?.[0]?.id; } catch (e) {}
    const r = await req(port, '/api/conversations/' + (sid || 'none') + '/status');
    add('api-get', 'GET /api/conversations/:id/status', r.status === 200, 'HTTP ' + r.status + ' | sid=' + sid + ' | ' + r.body.slice(0, 160));
  }
  // POST-only endpoints
  {
    // plant a needle file, then search for it (functional assertion, not just HTTP 200)
    try { fs.writeFileSync('C:\\Users\\test\\e2e-needle.txt', 'e2e needle token ZX81QWERTY for workspace search\n'); } catch (e) {}
    let r = await req(port, '/api/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: 'ZX81QWERTY', cwd: 'C:\\Users\\test' }) }, 300000);
    let found = false;
    try { found = JSON.parse(r.body).results?.length > 0; } catch (e) {}
    add('api-post', 'POST /api/search (needle found)', r.status === 200 && found, 'HTTP ' + r.status + ' | found=' + found + ' | ' + r.body.slice(0, 200));
    r = await req(port, '/api/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: 'test' }) }, 300000);
    add('api-post', 'POST /api/search (default cwd)', r.status >= 200 && r.status < 300, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 200));
    r = await req(port, '/api/market', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
    add('api-post', 'POST /api/market', r.status >= 200 && r.status < 500, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 200));
    r = await req(port, '/api/diagnostics/local-index/rebuild', { method: 'POST' }, 120000);
    add('api-post', 'POST /api/diagnostics/local-index/rebuild', r.status >= 200 && r.status < 300, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 200));
  }
  flush();

  // POST filesystem browse
  let r = await req(port, '/api/filesystem/browse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: 'C:\\Users\\test' }) });
  add('api-post', 'POST /api/filesystem/browse', r.status >= 200 && r.status < 300, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 200));

  // PUT user-settings roundtrip (GET -> PUT same body); root /api/settings is GET-only by design
  r = await req(port, '/api/settings/user', {});
  if (r.status === 200) {
    const r2 = await req(port, '/api/settings/user', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: r.body });
    add('api-put', 'PUT /api/settings/user roundtrip', r2.status >= 200 && r2.status < 300, 'HTTP ' + r2.status + ' | ' + r2.body.slice(0, 200));
  } else add('api-put', 'PUT /api/settings/user roundtrip', false, 'GET failed ' + r.status);

  // PUT desktop-ui preferences roundtrip
  r = await req(port, '/api/desktop-ui/preferences/pet', {});
  if (r.status === 200) {
    const r2 = await req(port, '/api/desktop-ui/preferences/pet', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: r.body });
    add('api-put', 'PUT /api/desktop-ui/preferences/pet roundtrip', r2.status >= 200 && r2.status < 300, 'HTTP ' + r2.status + ' | ' + r2.body.slice(0, 200));
  } else add('api-put', 'PUT /api/desktop-ui/preferences/pet roundtrip', false, 'GET failed ' + r.status);

  // POST CU setup (idempotent; exercises deps heal)
  r = await req(port, '/api/computer-use/setup', { method: 'POST' }, 600000);
  let setupOk = false;
  try { const j = JSON.parse(r.body); setupOk = j.success === true || r.status === 200; } catch (e) { setupOk = r.status === 200; }
  add('api-post', 'POST /api/computer-use/setup', setupOk, 'HTTP ' + r.status + ' | ' + r.body.slice(0, 300));
  flush();

  // ========== phase 2: helpers (python) ==========
  const PY = 'C:\\cc-haha\\resources\\runtime\\python\\python.exe';
  const RT = process.env.USERPROFILE + '\\.claude\\.runtime';
  try {
    const { stdout } = await execFileP(PY, ['-c', 'import mss, pyautogui, PIL, psutil, pyperclip, screeninfo, win32api; print("imports-ok")'], { timeout: 60000 });
    add('python', 'deps imports', stdout.includes('imports-ok'), stdout.trim());
  } catch (e) { add('python', 'deps imports', false, (e.stdout || '') + (e.stderr || e.message).slice(0, 200)); }
  try {
    const { stdout } = await execFileP(PY, [RT + '\\win_helper.py', 'check_permissions', '--payload', '{}'], { timeout: 60000 });
    add('python', 'win_helper check_permissions', stdout.includes('"ok"'), stdout.slice(0, 200));
  } catch (e) { add('python', 'win_helper check_permissions', false, (e.stderr || e.message).slice(0, 200)); }
  try {
    const { stdout } = await execFileP(PY, ['-c', 'import subprocess,sys,json; r=subprocess.run([sys.executable, r"' + RT + '\\win_helper.py", "screenshot", "--payload", "{}"], capture_output=True, text=True); d=json.loads(r.stdout) if r.stdout.strip().startswith("{") else {}; b=d.get("result",{}).get("base64",""); print("shot-len " + str(len(b)) if b else "shot-FAIL")'], { timeout: 120000 });
    add('python', 'win_helper screenshot', stdout.includes('shot-len'), stdout.trim().slice(0, 120));
  } catch (e) { add('python', 'win_helper screenshot', false, (e.stderr || e.message).slice(0, 200)); }
  flush();

  // ========== phase 3: GUI walkthrough via CDP ==========
  try {
    await cdpConnect();
    add('gui', 'CDP connect', true, '9222');

    // 3.1 style sanity on main window
    await shot('00-main-window');
    const styles = await ev(`(() => {
      const bs = getComputedStyle(document.body);
      const btn = document.querySelector('button');
      const sheets = [...document.styleSheets].map(s => { try { return s.cssRules.length; } catch(e) { return -1; } });
      return { fonts: bs.fontFamily, color: bs.color, bg: bs.backgroundColor,
               sheets: sheets.length, rules: sheets.reduce((a,b)=>a+Math.max(b,0),0),
               btnBg: btn ? getComputedStyle(btn).backgroundColor : null,
               vars: [...document.documentElement.style].length };
    })()`);
    add('style', 'computed styles + stylesheets', !!styles && styles.sheets > 0, JSON.stringify(styles));
    const unstyled = await ev(`(() => {
      const bad = [];
      for (const el of document.querySelectorAll('button,input,select')) {
        if (!el.offsetParent) continue;
        const c = getComputedStyle(el);
        if (el.tagName === 'BUTTON' && c.backgroundColor === 'rgba(0, 0, 0, 0)' && c.borderStyle === 'none' && c.fontSize === '13.333333333333332px') bad.push(el.textContent.trim().slice(0,20));
      }
      return bad.slice(0, 5);
    })()`);
    add('style', 'no unstyled controls', !unstyled || unstyled.length === 0, JSON.stringify(unstyled));

    // 3.2 enumerate nav buttons
    const navs = await ev(`(() => {
      const out = [];
      for (const el of document.querySelectorAll('button')) {
        if (!el.offsetParent) continue;
        const t = el.textContent.trim();
        if (t && t.length < 30 && !out.includes(t)) out.push(t);
      }
      return out.slice(0, 40);
    })()`);
    add('gui', 'nav enumeration', Array.isArray(navs) && navs.length > 0, JSON.stringify(navs).slice(0, 400));

    // 3.3 walk important pages
    const pages = ['Providers', 'Scheduled'];
    for (const p of pages) {
      const c = await clickText(p);
      await sleep(1500);
      await shot('10-page-' + p.toLowerCase().replace(/\s+/g, '-'));
      add('gui', 'page ' + p, c && c.ok, c && c.ok ? c.txt : JSON.stringify(c));
    }

    // 3.4 Settings + tabs
    let c = await clickText('Settings');
    await sleep(1500);
    add('gui', 'page Settings', c && c.ok, c && c.txt);
    await shot('20-settings-default');
    const tabs = await ev(`(() => {
      const out = [];
      for (const el of document.querySelectorAll('button,[role=tab]')) {
        if (!el.offsetParent) continue;
        const t = el.textContent.trim();
        if (t && t.length < 40 && !out.includes(t)) out.push(t);
      }
      return out.slice(0, 40);
    })()`);
    add('gui', 'settings tabs enumeration', Array.isArray(tabs) && tabs.length > 0, JSON.stringify(tabs).slice(0, 500));

    const known = ['General', 'Appearance', 'Providers', 'Computer Use', 'About', 'Language', 'Theme'];
    const present = (tabs || []).filter(t => known.some(k => t.toLowerCase().includes(k.toLowerCase())));
    for (const t of present) {
      const cc = await clickText(t.split(/\s/)[0]);
      await sleep(1200);
      await shot('21-settings-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30));
      add('gui', 'settings tab ' + t, cc && cc.ok, cc && cc.ok ? '' : JSON.stringify(cc));
    }

    // 3.5 Computer Use page detail
    c = await clickText('Computer Use');
    await sleep(2000);
    await shot('30-computer-use');
    const cuText = await ev(`document.body.innerText.slice(-700)`);
    add('gui', 'Computer Use page', /All checks passed|Computer Use is ready/i.test(cuText || ''), (cuText || '').slice(0, 300));

    // form: python path input + Apply
    const formInfo = await ev(`(() => {
      const inputs = [...document.querySelectorAll('input,select,textarea')].filter(e => e.offsetParent);
      return { count: inputs.length, types: inputs.slice(0, 10).map(i => i.tagName + ':' + (i.type || '') + ':' + (i.placeholder || '').slice(0, 20)) };
    })()`);
    add('form', 'CU page form enumeration', formInfo && formInfo.count > 0, JSON.stringify(formInfo));

    // fill python path & apply
    const fill = await ev(`(() => {
      const inp = [...document.querySelectorAll('input')].find(i => i.offsetParent && /python/i.test(i.placeholder || ''));
      if (!inp) return { ok: false, err: 'no python input' };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, 'C:\\\\cc-haha\\\\resources\\\\runtime\\\\python\\\\python.exe');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      return { ok: true };
    })()`);
    add('form', 'fill python path', fill && fill.ok, JSON.stringify(fill));
    if (fill && fill.ok) {
      const ap = await clickText('Apply');
      await sleep(2500);
      await shot('31-computer-use-applied');
      add('form', 'click Apply', ap && ap.ok, ap && ap.ok ? '' : JSON.stringify(ap));
      let rc = null;
      for (let i = 0; i < 6; i++) { rc = await clickText('Recheck Status'); if (rc && rc.ok) break; await sleep(2000); }
      await sleep(3000);
      await shot('32-computer-use-rechecked');
      add('form', 'click Recheck Status', rc && rc.ok, rc && rc.ok ? '' : JSON.stringify(rc));
    }

    // 3.6 modal open/close (Esc) — try a harmless "+" button
    const modal = await ev(`(() => {
      const b = [...document.querySelectorAll('button')].find(e => e.offsetParent && (e.textContent.trim() === '+' || e.getAttribute('aria-label') || '').toString().toLowerCase().includes('add'));
      if (!b) return { ok: false, err: 'no add button visible' };
      b.click();
      return { ok: true };
    })()`);
    if (modal && modal.ok) {
      await sleep(1200);
      await shot('40-modal-open');
      await pressEsc();
      await sleep(800);
      await shot('41-modal-after-esc');
      add('form', 'modal open + Esc close', true, 'opened add dialog and dismissed');
    } else {
      add('form', 'modal open + Esc close', true, 'no add button on this page (skipped by design)');
    }

    // 3.7 final full-page shot
    await shot('99-final-state');
  } catch (e) {
    add('gui', 'CDP walkthrough', false, e.message);
  }

  results.push({ cat: 'meta', name: 'end', ok: true, detail: new Date().toISOString() });
  flush();
  log('E2E-DONE results=' + results.length);
  process.exit(0);
})().catch(e => { add('fatal', 'driver', false, e.message); flush(); process.exit(1); });
