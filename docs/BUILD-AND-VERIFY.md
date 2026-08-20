# Build & Verify — cc-haha 0.5.4 Win7 offline edition (restored)

Two-stage build, fully offline-capable, Linux host, no wine.

```
upstream cc-haha v0.5.4 (d52bbec7)
        │  patches 001/002 + port-src TS/JS sources
        ▼
Stage A  desktop build (electron-builder + Electron 22.3.27, offline-win.cjs,
         NsisTarget nowine patch 006, CLI cross-built via node-port)
        │  -> Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe
        ▼
Stage B  repack/build-repack.sh (this repo)
         unpack Setup.exe (7z) -> asar surgery on main.cjs (winpty forcing)
         -> deploy node-fallback dist -> remove broken sidecar -> overlay
         runtime payloads (node/python/vxkex/git) -> guarantee node-pty
         payload -> makensis
        │  -> Claude-Code-Haha-0.5.4-win7-x64-setup.exe
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
git apply patches/desktop/003-terminal-winpty-fallback.patch
git apply patches/cli/004-shell-win32-bash-resolution.patch
cp -r port-src ./

# CLI bundle (Bun-free, esbuild): esbuild 0.28.2 + linux-x64/win32-x64
# binaries are vendored at port-src/vendor/node_modules/ (~23MB) — the build
# runs on a fresh clone with ZERO registry access (no root npm install);
# a repo-node_modules esbuild is only used as fallback.
node port-src/scripts/node-port/build.mjs
# optional — full IM-adapter bundle (adapters.mjs + code-split chunks for
# feishu/telegram/wechat/dingtalk/whatsapp): `cd adapters && npm install`
# first, then re-run build.mjs. Without it the adapter step is skipped
# with a notice and the core artifacts (cli/recovery-cli/server.mjs) are
# still complete — Stage B ships the prebuilt chunks from
# runtime/node-fallback/, so it never needs this.
git apply patches/cli/005-server-mjs-computer-use-offline.patch

# desktop: restore deps from the committed node_modules tree (zero network),
# then build offline.
# vendor/desktop-node-modules/node_modules/ is the full desktop dependency
# tree committed as PLAIN FILES — 957 packages / 31709 files / ~782MB,
# resolved WITH patch 001 applied (electron 22.3.27 + electron-builder 26.8.1
# pinned; apply patches 001-004 BEFORE restoring), with patch 006 (nowine)
# PRE-APPLIED. No archives anywhere: same convention as the vendored esbuild
# in port-src/vendor/node_modules/. restore.sh is a plain `cp -a` (preserves
# symlinks/exec bits/mtimes) followed by a self-check that 006 is baked in;
# no postinstall scripts ever ran, so no Electron binary download either
# (offline-win.cjs points electronDist at the committed vendor/electron zip
# anyway).
# (Prefer a real npm install? Copy vendor/desktop-node-modules/package-lock.json
# into desktop/ first to pin the same resolution, then
# `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install` and apply patch 006 after.)
cd desktop
bash ../../cc-haha-win7/vendor/desktop-node-modules/restore.sh
# NSIS toolchain cache (nsis-3.0.4.1 + nsis-resources-3.4.1, ~11 MB
# unpacked) is committed in this repo — point the cache there and
# electron-builder downloads nothing during the build:
export ELECTRON_BUILDER_CACHE="<path-to>/cc-haha-win7/vendor/electron-builder-cache"
# --publish never: desktop/package.json carries a publish config; without
# this flag electron-builder attempts a GitHub release upload (GH_TOKEN)
# AFTER the artifact is already built — harmless but noisy.
npx electron-builder --config ../port-src/desktop/offline-win.cjs --win --publish never
# Electron dist: zero downloads — the official electron-v22.3.27-win32-x64
# distribution is committed at vendor/electron/ as PLAIN FILES (the
# extracted zip root, 71 files / ~221 MB; no archives in the repo);
# offline-win.cjs auto-resolves it from the sibling cc-haha-win7 clone
# (override with $ELECTRON_DIST; provenance in vendor/sha256sums.txt).
# electron.exe itself (157,602,304 bytes) exceeds GitHub's 100 MB file cap,
# so it is committed as two raw byte-slice parts (electron.exe.00/01.part +
# electron.exe.parts.sha256 — same scheme as repack/setup-exe/); the config
# reassembles and sha256-verifies it on first run.
# Stage A is now 100% network-free after the two clones: the last registry
# access (desktop npm install) is replaced by the committed plain-file
# node_modules tree (a single cp).
# From-source output: build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe
# (~122 MB — smaller than the shipped 225 MB Setup.exe, which additionally
# embeds the upstream bun-compiled sidecar (163 MB, removed by Stage B step
# 5/9 anyway) and a runtime payload tree (re-overlaid by Stage B step 6/9);
# src-tauri/binaries is empty in a source checkout, so rg.exe ships via the
# repack step instead. Stage B consumes either form identically.
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

Stage A config notes (offline-win.cjs / build flags):

- `build.npmRebuild: false` — node-gyp on Linux cannot cross-compile the
  Windows native module (node-pty); the prebuilt binary inside node_modules
  is used as-is.
- `signAndEditExecutable: false` — skips rcedit, which would need wine on
  a Linux host.
- `electronDist` accepts a zip path, a directory, or an extracted
  distribution root (the committed form is the extracted root) and resolves
  `$ELECTRON_DIST` → `cc-haha/vendor/electron` → sibling
  `cc-haha-win7/vendor/electron`.
- Wine-free uninstaller extraction: patch 006 widens the
  `UninstallerReader` condition in `app-builder-lib/.../NsisTarget.js`
  from macOS-Catalina-only to `process.platform !== "win32"`; it is
  pre-applied in the committed node_modules tree (restore.sh self-checks
  it; after a real `npm install`, re-apply 006 and verify with
  `grep -q 'process.platform !== "win32"' node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js`).
- CLI entry scripts carry no file extension and node parses them as CJS —
  strip leftover TS type annotations (`(): string` etc.).

## Stage B — offline repack

```bash
cd repack
# NO downloads needed: when Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe is
# absent, step 0/9 reassembles it from the git-committed split parts in
# setup-exe/ (225,684,328 bytes, sha256 33f20bbf…ff1d9b; GitHub caps single
# files at 100MB, hence 95MB parts) — the whole Stage B pipeline runs
# network-free from a fresh clone. An explicit path argument still wins.
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
# step 2b/9 rewrites resources/app-update.yml so electron-updater points at
#   THIS repo's GitHub Releases (UPDATE_OWNER/UPDATE_REPO env overrides;
#   default GeniusTDY/cc-haha-win7) instead of upstream's. Publishing an
#   update: build the new setup.exe, then
#     node repack/make-latest-yml.mjs <setup.exe> <version> [--tag vX.Y.Z]
#   and attach latest.yml + the setup.exe (unchanged file name) to the
#   latest non-prerelease release. electron-updater resolves
#   releases/latest -> tag -> releases/download/<tag>/latest.yml, compares
#   <version> against the installed asar package.json version (semver gt),
#   downloads + sha512-verifies the exe and runs it (NSIS /S supported;
#   quitAndInstall(false, true) shows the installer wizard). On offline
#   machines the check silently resolves to "no update".
```

Reproducibility: rebuilding from the shipped Setup.exe + shipped runtime
tree reproduces the released installer family
(v1 `3221d5e9…` · v2 `971df9d5…` · 2026-08-19 `03286eaf…` ·
2026-08-20 v3 `c22f57eb…88eacbc`); NSIS stores file mtimes, so
byte-identity additionally requires matching input timestamps —
structural identity (same file set, sizes, install logic) is preserved
regardless. Zero-network proof (2026-08-20): a fresh-clone rebuild with
the Setup.exe reassembled from the committed split parts
(`repack/setup-exe/`, step 0/9) produced
`76a635d9456c9760cb3da5decebe37288bab63244279b137520430626a5ee8ec` —
same v3 fix set (winpty ×1 · fallback ×6 · CC_HAHA_RUNTIME_DIR ×1 ·
getBundledPythonDirsWin ×6 · node-pty prebuilds · PortableGit · node/
python payloads), differing from v3 only by NSIS-embedded mtimes.

## Installer behavior (NSIS)

The final artifact `Claude-Code-Haha-0.5.4-win7-x64-setup.exe`
(~241MB, LZMA solid; Release asset name
`Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe`) is built by native
makensis from `repack/installer.nsi`. Payload = unpacked upstream
installer tree + dist fallback artifacts + offline wheels + fixed
`python38._pth` − sidecar.

Install-section actions:

1. `taskkill` running GUI / node instances (safe overwrite upgrades)
2. Extract all files (fallback artifacts, offline wheels, fixed
   `python38._pth`; no sidecar)
3. Desktop / Start-menu shortcuts + `WriteUninstaller`
4. `SetRegView 64`: write the HKLM uninstall entry (incl. EstimatedSize),
   then clean stale Wow6432Node leftovers in the 32-bit view (fixes
   duplicate uninstall-list entries)
5. `netsh advfirewall` inbound rule for the bundled node.exe
6. KexCfg auto-registration of node.exe / python.exe / rg.exe
   (`ENABLE:YES + WINVERSPOOF:NONE`); when VxKex is absent, a dialog
   guides the user through the embedded VxKex installer and continues
7. `node --version` self-check (on failure, a dialog points at
   `setup-vxkex.bat`)

Uninstall (same `SetRegView 64`) symmetrically removes running instances,
the firewall rule, shortcuts, the install dir and the 64-bit uninstall
entry; user data at `%USERPROFILE%\.claude` is preserved. `/S` silent
install and overwrite upgrades are supported.

Target-machine deployment: install KB2533623 + KB2670838
(`runtime/kb-patches/`, reboot), then run the installer.

## Verify the v3 build (Linux host, structural)

```bash
# unpack the built installer and assert the complete fix set
# (NSIS layout: the app tree sits at the archive top level):
7z x -o/tmp/v3 Claude-Code-Haha-0.5.4-win7-x64-setup.exe
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
