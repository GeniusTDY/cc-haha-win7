#!/usr/bin/env bash
# =============================================================================
# build-repack.sh — rebuild Claude-Code-Haha-0.5.4-win7-x64-setup.exe
#
# Stage B of the Win7 offline build: repackage the electron-builder output
# (Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe, Stage A) into the all-in-one
# offline installer with native makensis — no wine required.
#
# Produces the restored offline installer.
# v1 (byte-identical to the released Offline.exe):
#   sha256 3221d5e9d1c56a4d0a00655a67dfad8f99bcb5387525a7c5426499ad8a025b40
# v2 (improvement: CU setup accepts a custom python path that resolves to the
#     bundled interpreter; see patches/cli/004 runSetup venv fallback):
#   sha256 971df9d518f0d567c4a6a759835d99882cac1fc5abeabac51abce91dbe766ae1
# v2 2026-08-19 rebuild (also fixes Win32 CLI spawn + provider-env
#     over-stripping; Release asset until the v3 rebuild):
#   sha256 03286eaf62a5ce7e607c610bc66787897be87c9539ff648225f98a4b0ba716be
# v3 2026-08-20 "most complete" rebuild:
#   + desktop terminal full TTY: main.cjs forces node-pty's winpty backend on
#     Win7/8 (ConPTY is Win10 1809+) — patch-app-asar.mjs surgery inside
#     app.asar, preserving the node-runtime fallback layer byte-exactly
#   + Bash tool on a clean offline box: cli.mjs probes CC_HAHA_RUNTIME_DIR /
#     <resources>/runtime/git-2.45.2/bin/bash.exe (bundled PortableGit 2.45.2)
#   + Computer Use fully offline: server.mjs CU patch (identifier-adaptive
#     patch-computer-use.py) installs Python deps from bundled wheels
#   + node-pty payload guaranteed in app.asar.unpacked/node_modules
# 2026-08-20 rebuild-from-parts (v3 fix set, zero network):
#   sha256 76a635d9456c9760cb3da5decebe37288bab63244279b137520430626a5ee8ec
#   — built from the git-committed split parts (setup-exe/) + runtime tree
#   only; differs from v3 c22f57eb… solely by NSIS-embedded file mtimes
#   (structural identity asserted: same fix set)
# 2026-08-20 feed-rewrite rebuild (v3 fix set + step 2b repoints
#   app-update.yml at GeniusTDY/cc-haha-win7; current Release asset,
#   paired with latest.yml from make-latest-yml.mjs):
#   sha256 b3665af60989fead7f4a2b36c555a1d0074859782cafb30f500340ee55371f4c
#
# Prereqs: 7z, makensis (>= 3.08), bash, coreutils, node (for asar surgery)
#
# Inputs (relative to this script's directory):
#   Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe  Stage A output — OPTIONAL:
#     auto-reassembled from the committed split parts in setup-exe/
#     (0/9 step) when missing, so a fresh clone needs zero downloads
#   assets/app-icon.ico, assets/modern-wizard.bmp
#   NODE_FALLBACK_DIR  dir with server.mjs adapters.mjs cli.mjs
#                      recovery-cli.mjs adapters-chunks/   (built by
#                      port-src/scripts/node-port/build.mjs + patch 005)
#   RUNTIME_DIR        dir with node-v22.17.0/ python-3.8.10/
#                      vxkex-1.2.1.2229/ setup-vxkex.bat
#                      requirements-win.txt win_helper.py   (release payloads)
#
# Usage:
#   NODE_FALLBACK_DIR=../runtime/node-fallback RUNTIME_DIR=<payload-dir> \
#     ./build-repack.sh [path/to/Setup.exe]
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SETUP="${1:-$HERE/Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe}"
NODE_FALLBACK_DIR="${NODE_FALLBACK_DIR:-$HERE/../runtime/node-fallback}"
RUNTIME_DIR="${RUNTIME_DIR:?set RUNTIME_DIR to the offline runtime payloads dir (node/ python/ vxkex/ ...)}"

OUT_EXE="$HERE/Claude-Code-Haha-0.5.4-win7-x64-setup.exe"
WORK="$HERE/.work"
ORIG="$WORK/orig"    # NSIS shell from Stage A installer
APP="$WORK/app"      # final payload tree

# Stage A input: prefer a local Setup.exe; when absent and the caller did not
# pass an explicit path, reassemble it from the git-committed split parts in
# repack/setup-exe/ (225,684,328 bytes split at 95MB — GitHub caps single
# files at 100MB). This keeps the whole Stage B pipeline network-free:
# clone -> build-repack.sh -> installer, no Release downloads needed.
if [ ! -f "$SETUP" ] && [ -z "${1:-}" ]; then
  PARTS_DIR="$HERE/setup-exe"
  if ls "$PARTS_DIR"/Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe.*.part >/dev/null 2>&1; then
    echo "== 0/9 reassemble Stage A installer from committed split parts =="
    (cd "$PARTS_DIR" && sha256sum -c parts.sha256)
    cat "$PARTS_DIR"/Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe.*.part > "$SETUP"
    echo "33f20bbf2bbc3b0c0dc9decf5f53ac70943614a78e9e6eb77a9ad1eb8aff1d9b  $SETUP" \
      | sha256sum -c -
  fi
fi
[ -f "$SETUP" ] || { echo "[FAIL] Stage A installer not found: $SETUP"; exit 1; }
for f in server.mjs adapters.mjs cli.mjs recovery-cli.mjs adapters-chunks; do
  [ -e "$NODE_FALLBACK_DIR/$f" ] || { echo "[FAIL] node-fallback missing: $NODE_FALLBACK_DIR/$f"; exit 1; }
done
for d in node-v22.17.0 python-3.8.10 vxkex-1.2.1.2229; do
  [ -d "$RUNTIME_DIR/$d" ] || { echo "[FAIL] runtime payload missing: $RUNTIME_DIR/$d"; exit 1; }
done

echo "== 1/9 unpack Stage A installer shell =="
rm -rf "$WORK"; mkdir -p "$ORIG"
7z x -y -o"$ORIG" "$SETUP" >/dev/null
[ -f "$ORIG/\$PLUGINSDIR/app-64.7z" ] || { echo "[FAIL] app-64.7z not found in installer"; exit 1; }

echo "== 2/9 extract app payload =="
mkdir -p "$APP"
7z x -y -o"$APP" "$ORIG/\$PLUGINSDIR/app-64.7z" >/dev/null

# The Stage A installer embeds the upstream feed config (NanmiCoder/cc-haha,
# from desktop/package.json publish). Rewrite it so the update channel points
# at THIS repo's GitHub Releases — where the Win7 installers are actually
# published. electron-updater then resolves:
#   https://github.com/<owner>/<repo>/releases/latest            (latest tag)
#   https://github.com/<owner>/<repo>/releases/download/<tag>/latest.yml
# Release checklist: attach latest.yml (repack/make-latest-yml.mjs) + the
# setup.exe to the latest non-prerelease release; its version must be
# semver-greater than the installed one for the update to be offered.
UPDATE_OWNER="${UPDATE_OWNER:-GeniusTDY}"
UPDATE_REPO="${UPDATE_REPO:-cc-haha-win7}"
echo "== 2b/9 point electron-updater at $UPDATE_OWNER/$UPDATE_REPO Releases =="
cat > "$APP/resources/app-update.yml" <<EOF
owner: $UPDATE_OWNER
repo: $UPDATE_REPO
provider: github
updaterCacheDirName: claude-code-desktop-updater
EOF
echo "  update feed -> https://github.com/$UPDATE_OWNER/$UPDATE_REPO/releases/download/<tag>/latest.yml"

DIST="$APP/resources/app.asar.unpacked/dist"
BIN="$APP/resources/app.asar.unpacked/src-tauri/binaries"
RT="$APP/resources/runtime"

echo "== 3/9 patch app.asar main.cjs (force winpty terminal backend) =="
# Surgical in-place asar rewrite (see patch-app-asar.mjs header comment): the
# shipped main.cjs carries the Win7 node-runtime fallback layer that is not in
# the current desktop sources, so we only insert the one missing runtime hunk
# of patches/desktop/006 — `ptySpawnOptions.useConpty = false` on legacy
# Windows — and leave every other archived file at its original offset.
node "$HERE/patch-app-asar.mjs" "$APP/resources/app.asar"

echo "== 4/9 deploy node-fallback bundle (forces node.exe server) =="
for f in server.mjs adapters.mjs cli.mjs recovery-cli.mjs; do
  cp -f "$NODE_FALLBACK_DIR/$f" "$DIST/$f"
done
rm -rf "$DIST/adapters-chunks"
cp -a "$NODE_FALLBACK_DIR/adapters-chunks" "$DIST/adapters-chunks"

echo "== 5/9 remove broken compiled sidecar =="
rm -f "$BIN/claude-sidecar-x86_64-pc-windows-msvc.exe"
ls "$BIN"

echo "== 6/9 overlay offline runtime payloads =="
# node-v22.17.0/ python-3.8.10/ (with fixed python38._pth + whl wheels)
# vxkex-1.2.1.2229/ + scripts
for d in node-v22.17.0 python-3.8.10 vxkex-1.2.1.2229; do
  rm -rf "$RT/$d"
  cp -a "$RUNTIME_DIR/$d" "$RT/$d"
done
for f in setup-vxkex.bat requirements-win.txt requirements.txt win_helper.py; do
  [ -f "$RUNTIME_DIR/$f" ] && cp -f "$RUNTIME_DIR/$f" "$RT/$f" || true
done
# drop Stage A dev leftovers not meant to ship
rm -f "$RT/WIN7-SETUP.txt" "$RT/mac_helper.py" "$RT/test_helpers.py"

echo "== 7/9 guarantee node-pty winpty payload (full TTY terminal on Win7) =="
# The desktop terminal loads node-pty from app.asar.unpacked/node_modules and
# forces its winpty backend on Win7/8 (main.cjs useConpty:false). electron-
# builder may prune or omit that module from the payload — overlay the vendored
# runtime copy (node-pty 1.1.0 N-API binding + winpty agent, win32-x64) so the
# terminal never silently degrades to the line-based pipe fallback.
NODE_PTY_DST="$APP/resources/app.asar.unpacked/node_modules/node-pty"
if [ ! -f "$NODE_PTY_DST/lib/windowsTerminal.js" ] || \
   [ ! -f "$NODE_PTY_DST/prebuilds/win32-x64/winpty-agent.exe" ]; then
  echo "  node-pty missing/pruned in Stage A payload — overlaying vendored copy"
  mkdir -p "$NODE_PTY_DST"
  cp -a "$HERE/../runtime/node-pty-1.1.0-win32-x64/." "$NODE_PTY_DST/"
fi
ls "$NODE_PTY_DST/prebuilds/win32-x64" | sed 's/^/  node-pty: /'

echo "== 8/9 bundled PortableGit (Bash tool on a clean offline Win7) =="
# The CLI's findSuitableShell resolves, in order: user-installed Git for
# Windows, then <resources>/runtime/git-2.45.2/bin/bash.exe (this overlay),
# then PATH. PortableGit 2.45.2 is the last Git line that still runs on Win7 —
# a pristine extraction is committed under runtime/git-2.45.2/ (see
# runtime/README.md), so the default RUNTIME_DIR=../runtime ships it offline.
if [ -d "$RUNTIME_DIR/git-2.45.2" ]; then
  echo "  overlaying bundled PortableGit -> resources/runtime/git-2.45.2"
  rm -rf "$RT/git-2.45.2"
  cp -a "$RUNTIME_DIR/git-2.45.2" "$RT/git-2.45.2"
else
  echo "  (no RUNTIME_DIR/git-2.45.2 — Bash tool needs Git for Windows installed)"
fi

echo "== 9/9 makensis (native, no wine) =="
# installer.nsi expects app/, app-icon.ico, modern-wizard.bmp next to it
ln -sfn "$APP" "$HERE/app"
cp -f assets/app-icon.ico assets/modern-wizard.bmp .
makensis installer.nsi

echo
echo "[OK] built: $OUT_EXE"
sha256sum "$OUT_EXE"
# expected: 2026-08-20 feed-rewrite rebuild — v3 fix set + update channel
#   pointed at GeniusTDY/cc-haha-win7 (current Release asset)
# historical: v1 3221d5e9… · v2 971df9d5… · v2-rebuild 03286eaf… ·
#   v3 c22f57eb… · rebuild-from-parts 76a635d9…
