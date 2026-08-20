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
//     2. <cc-haha>/vendor/electron — copied/extracted next to the source
//     3. ../cc-haha-win7/vendor/electron — the recipe repo clone
//        (sibling of the cc-haha checkout; ships the official
//        electron-v22.3.27-win32-x64.zip committed in git, so Stage A
//        needs zero Electron downloads — see vendor/sha256sums.txt)
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

const DEFAULT_DIST = path.join(__dirname, '..', '..', 'vendor', 'electron')

function resolveElectronDist() {
  const candidates = [
    process.env.ELECTRON_DIST,
    DEFAULT_DIST,
    path.join(__dirname, '..', '..', '..', 'cc-haha-win7', 'vendor', 'electron'),
  ].filter(Boolean)
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
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
