# patches/ — Win7 port deltas vs upstream NanmiCoder/cc-haha v0.5.4

Base: upstream tag/commit `d52bbec7` ("chore(release): prepare v0.5.4").
Apply order = patch number. All paths are relative to the upstream repo
root (`desktop/` is the Electron app subproject).

| # | file | applies to | summary |
|---|---|---|---|
| 1 | `desktop/001-package-json-electron22.patch` | `desktop/package.json` | pin Electron 22.3.27 (last Win7 major, Chromium 108/Node 16.17) + electron-builder 26.8.1 |
| 2 | `desktop/002-index-html-css-shim.patch` | `desktop/index.html` | Chromium 108 CSS shim: color-mix()/lab()/oklch()/lch()/oklab() evaluation + scrollbar fallbacks, re-runs on theme change |
| 4 | `cli/004-server-mjs-computer-use-offline.patch` | `dist/server.mjs` (node-port bundle) | bundled-Python detection, offline wheel install (--no-index), venv fallback to bundled python.exe |
| 5 | `electron-builder/005-nsis-target-nowine.patch` | `node_modules/app-builder-lib/.../NsisTarget.js` | wine-free uninstaller extraction on Linux (UninstallerReader for all non-Windows hosts) |
| 6 | `desktop/006-terminal-winpty-fallback.patch` | `desktop/electron/services/terminal.ts` | force node-pty's winpty backend on Win7/8 (`useConpty:false`) + line-based pipe fallback when node-pty cannot load/spawn |
| 7 | `cli/007-shell-win32-bash-resolution.patch` | `src/utils/Shell.ts`, `src/utils/windowsPaths.ts` | Windows shell chain for the Bash tool: user Git → bundled `runtime/git` PortableGit (`CC_HAHA_BASH_EXE`/`CC_HAHA_RUNTIME_DIR`/relative probes) → PATH bash |

Patch 3 is not a diff: the Electron main-process node-runtime fallback
layer ships as the compiled artifact `port-src/desktop-electron/main.cjs`
(byte-identical to the shipped `app.asar`), documented in
`port-src/desktop-electron/README.md`. Rebuilding it from TS requires the
full desktop toolchain; overlaying the artifact is the reproducible path.
(Patch 006 ports that artifact's pipe fallback into the TS source, so
rebuilds from source keep it; the shipped main.cjs already carries it.)

## Apply

```bash
git clone https://github.com/NanmiCoder/cc-haha && cd cc-haha
git checkout d52bbec7
git apply ../patches/desktop/001-package-json-electron22.patch
git apply ../patches/desktop/002-index-html-css-shim.patch
git apply ../patches/desktop/006-terminal-winpty-fallback.patch
git apply ../patches/cli/007-shell-win32-bash-resolution.patch
# after `npm install` in desktop/ (any reinstall overwrites node_modules):
git apply ../patches/electron-builder/005-nsis-target-nowine.patch
# after building the node-port bundle (dist/server.mjs):
git apply ../patches/cli/004-server-mjs-computer-use-offline.patch
```

## Verify the node_modules patch survived a reinstall

```bash
grep -q 'process.platform !== "win32"' \
  desktop/node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js \
  || echo "patch 005 lost — re-apply"
```
