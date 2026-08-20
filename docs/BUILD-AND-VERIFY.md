# Build & Verify — cc-haha 0.5.4 Win7 offline edition (restored)

Two-stage build, fully offline-capable, Linux host, no wine.

```
upstream cc-haha v0.5.4 (d52bbec7)
        │  patches 001/002 + port-src TS/JS sources
        ▼
Stage A  desktop build (electron-builder + Electron 22.3.27, offline-win.cjs,
         NsisTarget nowine patch 005, CLI cross-built via node-port)
        │  -> Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe
        ▼
Stage B  repack/build-repack.sh (this repo)
         unpack Setup.exe (7z) -> asar surgery on main.cjs (winpty forcing)
         -> deploy node-fallback dist -> remove broken sidecar -> overlay
         runtime payloads (node/python/vxkex/git) -> guarantee node-pty
         payload -> makensis
        │  -> Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe
        ▼
Verify   QEMU Win7 SP1 x64 (offline guest)
         fresh install + 77-check E2E suite
```

## Stage A — desktop/CLI build (from upstream source)

```bash
git clone https://github.com/NanmiCoder/cc-haha && cd cc-haha
git checkout d52bbec7
git apply patches/desktop/001-package-json-electron22.patch
git apply patches/desktop/002-index-html-css-shim.patch
git apply patches/desktop/006-terminal-winpty-fallback.patch
git apply patches/cli/007-shell-win32-bash-resolution.patch
cp -r port-src ./

# CLI bundle (Bun-free, esbuild):
node port-src/scripts/node-port/build.mjs
git apply patches/cli/004-server-mjs-computer-use-offline.patch

# desktop: install deps, patch electron-builder, build offline
cd desktop && npm install
git apply ../patches/electron-builder/005-nsis-target-nowine.patch
export ELECTRON_BUILDER_CACHE="$PWD/../vendor/electron-builder-cache"
npx electron-builder --config ../port-src/desktop/offline-win.cjs --win
# requires vendor/electron (Electron 22.3.27 win-x64 dist) — see
# Technical-Support.md §10; rg.exe + sidecar come from src-tauri/binaries
```

Stage A output provenance note: the shipped Setup.exe (225,684,328 bytes)
already embodies Stage A; this repo restores its complete source delta
(patches + port-src). Note on `port-src/desktop-electron/main.cjs`: it is an
esbuild rebuild of the current sources and carries the patch-006 winpty
forcing, but the shipped asar's main.cjs additionally contains the
node-runtime fallback layer (`NODE_RUNTIME_EXE_ENV`,
`resolveNodeRuntimeExecutable`, …) whose TS source was lost. Stage B
therefore never replaces the shipped main.cjs — `patch-app-asar.mjs`
surgically inserts only the missing `useConpty = false` hunk into it
inside app.asar, recomputes its SHA256 integrity entry, and leaves every
other archived file at its original offset (the old bytes become
unreachable dead space). The preloads are unmodified upstream and stay
byte-identical.

## Stage B — offline repack

```bash
cd repack
# put the Stage A output Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe here
# (built above; or pass its path as the first argument);
# runtime/ payloads (node/ python/ vxkex/ git/) are already in this repo
NODE_FALLBACK_DIR=../runtime/node-fallback \
RUNTIME_DIR=../runtime \
  ./build-repack.sh
# step 3/9 patches app.asar main.cjs (winpty forcing; needs node +
#   the vendored asar-tool/ — @electron/asar is committed)
# step 7/9 guarantees node-pty in app.asar.unpacked/node_modules
#   (winpty-agent.exe + pty.node for full TTY)
# RUNTIME_DIR/git = PortableGit 2.45.2 (committed) -> ships a Bash
#   tool shell on a clean offline Win7 (step 8/9)
```

Reproducibility: rebuilding from the shipped Setup.exe + shipped runtime
tree reproduces the released Offline.exe family
(v1 `3221d5e9…` · v2 `971df9d5…` · 2026-08-19 `03286eaf…` ·
2026-08-20 v3 `c22f57eb…88eacbc`); NSIS stores file mtimes, so
byte-identity additionally requires matching input timestamps —
structural identity (same file set, sizes, install logic) is preserved
regardless.

## Verify the v3 build (Linux host, structural)

```bash
# unpack the built installer and assert the complete fix set
# (NSIS layout: the app tree sits at the archive top level):
7z x -o/tmp/v3 Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe
cd /tmp/v3

node /path/to/repack/asar-tool/node_modules/.bin/asar \
  extract-file resources/app.asar electron-dist/main.cjs
grep -c 'useConpty = false'    main.cjs   # -> 1  (winpty forcing)
grep -c 'resolveNodeRuntimeExecutable' main.cjs  # -> fallback layer intact
node --check main.cjs                    # -> syntax valid
node -e "require('@electron/asar').extractFile('resources/app.asar','electron-dist/main.cjs')"  # integrity ok

grep -c CC_HAHA_RUNTIME_DIR  resources/app.asar.unpacked/dist/cli.mjs    # -> 1 (Bash shell fix)
grep -c getBundledPythonDirsWin resources/app.asar.unpacked/dist/server.mjs # -> 6 (CU offline)
ls resources/app.asar.unpacked/node_modules/node-pty/prebuilds/win32-x64/   # winpty-agent.exe …
ls resources/runtime/git/bin/bash.exe                                      # PortableGit
! ls resources/app.asar.unpacked/src-tauri/binaries/claude-sidecar-*.exe    # sidecar removed
```

## Verify (QEMU Win7, guest offline)

Summary of round19 (restored-pipeline verification):

1. guest: uninstall previous build, wipe `%APPDATA%\cc-haha`,
   `~/.claude/.runtime`, `~/.claude/cc-haha`
2. silent-install the **rebuilt** Offline.exe (`/S`, elevated)
3. install-integrity asserts (17 checks): node-fallback dist files,
   sidecar removed, rg.exe, node/python payloads, fixed `python38._pth`,
   `.whl` wheels incl. pip/setuptools/wheel, KexCfg-edition
   setup-vxkex.bat, CSS shim marker, main.cjs fallback marker in asar
4. bundled `node --version` / `python --version` / `rg --version`
   (proves installer's VxKex registration on a clean profile)
5. GUI launch with CDP + 77-check E2E suite

Results are appended to `docs/VERIFICATION-REPORT.md`.
