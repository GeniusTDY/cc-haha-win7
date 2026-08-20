// electron-builder offline config for the Win7 build (Stage A).
// Usage (from desktop/):
//   electron-builder --config ../port-src/desktop/offline-win.cjs --win
//
// - baseConfig: the project's desktop/package.json "build" section
//   (patch 001 pins electron 22.3.27 + electron-builder 26.8.1 there).
//   Resolved from CWD first (documented usage runs from desktop/), then
//   module-relative (../.. = the cc-haha checkout root after port-src
//   is copied into it).
// - electronDist: never downloads Electron at build time; points at the
//   local win-x64 distribution (any of: zip path / dir containing the
//   officially-named zip / extracted Electron root with electron.exe).
//   Resolution order (first existing wins):
//     1. $ELECTRON_DIST            — explicit override (zip or dir)
//     2. <cc-haha>/vendor/electron-v22.3.27-win32-x64 — copied/extracted
//        next to the source
//     3. ../cc-haha-win7/vendor/electron-v22.3.27-win32-x64 — the recipe
//        repo clone
//        (sibling of the cc-haha checkout; ships the official
//        electron-v22.3.27-win32-x64 distribution committed as PLAIN
//        FILES — the extracted zip root with electron.exe, no archives
//        in the repo, so Stage A needs zero Electron downloads — see
//        vendor/sha256sums.txt for provenance)
//        electron.exe itself exceeds GitHub's 100MB file cap, so it is
//        committed as raw split parts (electron.exe.00/01.part + a
//        sha256 manifest, same scheme as repack/setup-exe/) and is
//        reassembled on demand below — parts are byte slices, not
//        archives, so the repo still contains no compressed packages.
// - signAndEditExecutable: false — skips rcedit (depends on wine); with
//   no certificate signtool is not invoked either
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
    } catch { /* try next candidate */ }
  }
  throw new Error(
    '[offline-win.cjs] desktop/package.json with a "build" section not found — ' +
    'run electron-builder from the desktop/ dir (see header comment)'
  )
}

const DEFAULT_DIST = path.join(__dirname, '..', '..', 'vendor', 'electron-v22.3.27-win32-x64')
const crypto = require('crypto')

// Reassemble electron.exe from the committed split parts (raw byte slices
// at 95MB, GitHub's file cap is 100MB) when the assembled file is absent.
// Verifies each part and the final file against electron.exe.parts.sha256.
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
  // nothing found — return the default so electron-builder surfaces its
  // usual "electronDist not found" error for the documented path
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
