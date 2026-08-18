// Guest-side Computer Use API driver: reads server port, POSTs setup, GETs status.
import fs from 'fs';

function findPort() {
  const candidates = [];
  const appData = process.env.APPDATA || '';
  const paths = [
    appData + '\\cc-haha\\desktop-server-state.json',
    process.env.USERPROFILE + '\\AppData\\Roaming\\cc-haha\\desktop-server-state.json',
  ];
  for (const p of paths) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log('STATE ' + p + ' -> ' + JSON.stringify(j).slice(0, 400));
      for (const v of [j.port, j.serverPort, j.desktopServerPort]) {
        if (typeof v === 'number' && v > 0) candidates.push(v);
      }
    } catch (e) { console.log('STATE-MISS ' + p); }
  }
  // fallback: common default
  candidates.push(49276);
  return [...new Set(candidates)];
}

async function tryPort(port, path, init) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 600000);
  try {
    const r = await fetch('http://127.0.0.1:' + port + path, { ...init, signal: ctrl.signal });
    const t = await r.text();
    clearTimeout(to);
    return r.status + ' | ' + t;
  } catch (e) {
    clearTimeout(to);
    return 'ERR ' + e.message;
  }
}

(async () => {
  const ports = findPort();
  let port = null;
  for (const p of ports) {
    const probe = await tryPort(p, '/api/computer-use/status', {});
    console.log('PROBE port=' + p + ' -> ' + probe.slice(0, 200));
    if (probe.startsWith('200')) { port = p; break; }
  }
  if (!port) { console.log('NO-PORT'); process.exit(1); }

  console.log('=== POST setup (may take minutes) ===');
  const setup = await tryPort(port, '/api/computer-use/setup', { method: 'POST' });
  console.log('SETUP ' + setup.slice(0, 2500));

  console.log('=== GET status ===');
  const st = await tryPort(port, '/api/computer-use/status', {});
  console.log('STATUS ' + st.slice(0, 1500));
})();
