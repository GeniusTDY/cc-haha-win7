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
         unpack Setup.exe (7z) -> deploy node-fallback dist -> remove broken
         sidecar -> overlay runtime payloads (node/python/vxkex) -> makensis
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
(patches + port-src) and the canonical compiled artifacts
(port-src/desktop-electron/*.cjs are byte-identical to the app.asar
contents of the shipped installer).

## Stage B — offline repack

```bash
cd repack
# put the Stage A output Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe here
# (built above; or pass its path as the first argument);
# runtime/ payloads (node/ python/ vxkex/ git/) are already in this repo
NODE_FALLBACK_DIR=../runtime/node-fallback \
RUNTIME_DIR=../runtime \
  ./build-repack.sh
# RUNTIME_DIR/git = PortableGit 2.45.2 (committed) -> ships a Bash
# tool shell on a clean offline Win7 (build-repack step 7/8)
```

Reproducibility: rebuilding from the shipped Setup.exe + shipped runtime
tree reproduces the released Offline.exe
(sha256 `3221d5e9…a025b40`); NSIS stores file mtimes, so byte-identity
additionally requires matching input timestamps — structural identity
(same file set, sizes, install logic) is preserved regardless.

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
