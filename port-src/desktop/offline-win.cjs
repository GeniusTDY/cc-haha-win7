// electron-builder offline config for the Win7 build (Stage A).
// Usage (from desktop/):
//   electron-builder --config ../port-src/desktop/offline-win.cjs --win
//
// - electronDist: never downloads Electron at build time; points at the
//   local win-x64 distribution (any of: zip path / dir containing the
//   officially-named zip / extracted Electron root with electron.exe)
// - signAndEditExecutable: false — skips rcedit (depends on wine); with
//   no certificate signtool is not invoked either
const path = require('path')
const baseConfig = require('../package.json').build

module.exports = {
  ...baseConfig,
  electronDist: path.join(__dirname, '..', '..', 'vendor', 'electron'),
  win: {
    ...baseConfig.win,
    signAndEditExecutable: false,
  },
}
