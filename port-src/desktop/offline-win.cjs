const fs = require('fs')
const path = require('path')

function resolveBaseConfig() {
  const candidates = [
    path.resolve(process.cwd(), 'package.json'),
    path.join(__dirname, '..', '..', 'desktop', 'package.json'),
  ]
  for (const p of candidates) {
    try {
      const cfg = require(p)
      if (cfg && typeof cfg.build === 'object') return cfg.build
    } catch { }
  }
  throw new Error(
    '[offline-win.cjs] desktop/package.json with a "build" section not found — ' +
    'run electron-builder from the desktop/ dir (see header comment)'
  )
}

const DEFAULT_DIST = path.join(__dirname, '..', '..', 'vendor', 'electron-v22.3.27-win32-x64')
const crypto = require('crypto')

function ensureElectronExe(distDir) {
  const exe = path.join(distDir, 'electron.exe')
  if (fs.existsSync(exe)) return
  const parts = fs.readdirSync(distDir)
    .filter(f => /^electron\.exe\.\d+\.part$/.test(f))
    .sort()
  if (parts.length === 0) return
  const manifest = fs.readFileSync(path.join(distDir, 'electron.exe.parts.sha256'), 'utf8')
  const expected = {}
  for (const line of manifest.split('\n')) {
    const m = line.trim().match(/^([0-9a-f]{64})\s{2}(.+)$/)
    if (m) expected[m[2]] = m[1]
  }
  const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  for (const p of parts) {
    if (sha256(path.join(distDir, p)) !== expected[p]) {
      throw new Error(`[offline-win.cjs] sha256 mismatch for ${p} — re-clone or fix the part file`)
    }
  }
  console.log(`[offline-win.cjs] reassembling electron.exe from ${parts.length} split parts`)
  const out = fs.openSync(exe, 'w')
  try {
    for (const p of parts) {
      const buf = fs.readFileSync(path.join(distDir, p))
      fs.writeSync(out, buf)
    }
  } finally {
    fs.closeSync(out)
  }
  const actual = sha256(exe)
  if (expected['electron.exe'] && actual !== expected['electron.exe']) {
    fs.unlinkSync(exe)
    throw new Error('[offline-win.cjs] reassembled electron.exe sha256 mismatch')
  }
}

function resolveElectronDist() {
  const candidates = [
    process.env.ELECTRON_DIST,
    DEFAULT_DIST,
    path.join(__dirname, '..', '..', '..', 'cc-haha-win7', 'vendor', 'electron-v22.3.27-win32-x64'),
  ].filter(Boolean)
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      if (fs.statSync(c).isDirectory()) ensureElectronExe(c)
      return c
    }
  }
  return DEFAULT_DIST
}

module.exports = {
  ...resolveBaseConfig(),
  electronDist: resolveElectronDist(),
  win: {
    ...resolveBaseConfig().win,
    signAndEditExecutable: false,
  },
}
