#!/usr/bin/env bash
# =============================================================================
# build-repack.sh — rebuild Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe
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
#
# Prereqs: 7z, makensis (>= 3.08), bash, coreutils
#
# Inputs (relative to this script's directory):
#   Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe  Stage A output (electron-builder)
#   assets/app-icon.ico, assets/modern-wizard.bmp
#   NODE_FALLBACK_DIR  dir with server.mjs adapters.mjs cli.mjs
#                      recovery-cli.mjs adapters-chunks/   (built by
#                      port-src/scripts/node-port/build.mjs + patch 004)
#   RUNTIME_DIR        dir with node/ python/ vxkex/ setup-vxkex.bat
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

OUT_EXE="$HERE/Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe"
WORK="$HERE/.work"
ORIG="$WORK/orig"    # NSIS shell from Stage A installer
APP="$WORK/app"      # final payload tree

[ -f "$SETUP" ] || { echo "[FAIL] Stage A installer not found: $SETUP"; exit 1; }
for f in server.mjs adapters.mjs cli.mjs recovery-cli.mjs adapters-chunks; do
  [ -e "$NODE_FALLBACK_DIR/$f" ] || { echo "[FAIL] node-fallback missing: $NODE_FALLBACK_DIR/$f"; exit 1; }
done
for d in node python vxkex; do
  [ -d "$RUNTIME_DIR/$d" ] || { echo "[FAIL] runtime payload missing: $RUNTIME_DIR/$d"; exit 1; }
done

echo "== 1/6 unpack Stage A installer shell =="
rm -rf "$WORK"; mkdir -p "$ORIG"
7z x -y -o"$ORIG" "$SETUP" >/dev/null
[ -f "$ORIG/\$PLUGINSDIR/app-64.7z" ] || { echo "[FAIL] app-64.7z not found in installer"; exit 1; }

echo "== 2/6 extract app payload =="
mkdir -p "$APP"
7z x -y -o"$APP" "$ORIG/\$PLUGINSDIR/app-64.7z" >/dev/null

DIST="$APP/resources/app.asar.unpacked/dist"
BIN="$APP/resources/app.asar.unpacked/src-tauri/binaries"
RT="$APP/resources/runtime"

echo "== 3/6 deploy node-fallback bundle (forces node.exe server) =="
for f in server.mjs adapters.mjs cli.mjs recovery-cli.mjs; do
  cp -f "$NODE_FALLBACK_DIR/$f" "$DIST/$f"
done
rm -rf "$DIST/adapters-chunks"
cp -a "$NODE_FALLBACK_DIR/adapters-chunks" "$DIST/adapters-chunks"

echo "== 4/6 remove broken compiled sidecar =="
rm -f "$BIN/claude-sidecar-x86_64-pc-windows-msvc.exe"
ls "$BIN"

echo "== 5/6 overlay offline runtime payloads =="
# node/ python/ (with fixed python38._pth + whl wheels) vxkex/ + scripts
for d in node python vxkex; do
  rm -rf "$RT/$d"
  cp -a "$RUNTIME_DIR/$d" "$RT/$d"
done
for f in setup-vxkex.bat requirements-win.txt requirements.txt win_helper.py; do
  [ -f "$RUNTIME_DIR/$f" ] && cp -f "$RUNTIME_DIR/$f" "$RT/$f" || true
done
# drop Stage A dev leftovers not meant to ship
rm -f "$RT/WIN7-SETUP.txt" "$RT/mac_helper.py" "$RT/test_helpers.py"

echo "== 6/8 guarantee node-pty winpty payload (full TTY terminal on Win7) =="
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
  cp -a "$HERE/../runtime/node-pty-win32-x64/." "$NODE_PTY_DST/"
fi
ls "$NODE_PTY_DST/prebuilds/win32-x64" | sed 's/^/  node-pty: /'

echo "== 7/8 bundled PortableGit (Bash tool on a clean offline Win7) =="
# The CLI's findSuitableShell resolves, in order: user-installed Git for
# Windows, then <resources>/runtime/git/bin/bash.exe (this overlay), then PATH.
# PortableGit 2.45.2 is the last Git line that still runs on Win7 — a pristine
# extraction is committed under runtime/git/ (see runtime/README.md), so the
# default RUNTIME_DIR=../runtime ships it fully offline.
if [ -d "$RUNTIME_DIR/git" ]; then
  echo "  overlaying bundled PortableGit -> resources/runtime/git"
  rm -rf "$RT/git"
  cp -a "$RUNTIME_DIR/git" "$RT/git"
else
  echo "  (no RUNTIME_DIR/git — Bash tool needs Git for Windows installed)"
fi

echo "== 8/8 makensis (native, no wine) =="
cd "$HERE"
# installer.nsi expects app/, app-icon.ico, modern-wizard.bmp next to it
ln -sfn "$APP" "$HERE/app"
cp -f assets/app-icon.ico assets/modern-wizard.bmp .
makensis installer.nsi

echo
echo "[OK] built: $OUT_EXE"
sha256sum "$OUT_EXE"
# expected (v2): 971df9d518f0d567c4a6a759835d99882cac1fc5abeabac51abce91dbe766ae1
