#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SETUP="${1:-$HERE/Claude-Code-Haha-0.6.2-Win7-x64-Setup.exe}"
NODE_FALLBACK_DIR="${NODE_FALLBACK_DIR:-$HERE/../runtime/node-fallback}"
RUNTIME_DIR="${RUNTIME_DIR:?set RUNTIME_DIR to the offline runtime payloads dir (node/ python/ vxkex/ ...)}"
RIPGREP_DIR="${RIPGREP_DIR:-$RUNTIME_DIR/ripgrep-15.1.0-win32-x64}"

OUT_EXE="$HERE/Claude-Code-Haha-0.6.2-win7-x64-setup.exe"
APP_VERSION="0.6.2"
WORK="$HERE/.work"
ORIG="$WORK/orig"
APP="$WORK/app"

if [ ! -f "$SETUP" ] && [ -z "${1:-}" ]; then
  PARTS_DIR="$HERE/setup-exe"
  if ls "$PARTS_DIR"/Claude-Code-Haha-0.6.2-Win7-x64-Setup.exe.*.part >/dev/null 2>&1; then
    echo "== 0/9 reassemble Stage A installer from committed split parts =="
    (cd "$PARTS_DIR" && sha256sum -c parts.sha256)
    cat "$PARTS_DIR"/Claude-Code-Haha-0.6.2-Win7-x64-Setup.exe.*.part > "$SETUP"
    echo "2e2e38bd0c37918115988cdecf47ba2e459de0a755ba197c4dfe6ba13e654212  $SETUP" \
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
for f in rg.exe ripgrep-manifest.json; do
  [ -f "$RIPGREP_DIR/$f" ] || { echo "[FAIL] ripgrep payload missing: $RIPGREP_DIR/$f"; exit 1; }
done

echo "== 1/9 unpack Stage A installer shell =="
rm -rf "$WORK"; mkdir -p "$ORIG"
7z x -y -o"$ORIG" "$SETUP" >/dev/null
[ -f "$ORIG/\$PLUGINSDIR/app-64.7z" ] || { echo "[FAIL] app-64.7z not found in installer"; exit 1; }

echo "== 2/9 extract app payload =="
mkdir -p "$APP"
7z x -y -o"$APP" "$ORIG/\$PLUGINSDIR/app-64.7z" >/dev/null

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

echo "== 3/9 patch app.asar main.cjs (force winpty terminal backend + $APP_VERSION) =="
node "$HERE/patch-app-asar.mjs" "$APP/resources/app.asar" --set-version "$APP_VERSION"

echo "== 4/9 deploy node-fallback bundle (forces node.exe server) =="
for f in server.mjs adapters.mjs cli.mjs recovery-cli.mjs; do
  cp -f "$NODE_FALLBACK_DIR/$f" "$DIST/$f"
done
rm -rf "$DIST/adapters-chunks"
cp -a "$NODE_FALLBACK_DIR/adapters-chunks" "$DIST/adapters-chunks"

echo "== 4b/9 overlay intranet layer (patches 013/014 + final-series renderer) =="
LAYER="$HERE/intranet-layer"
if [ ! -f "$LAYER/app.asar" ] && [ -f "$LAYER/app.asar.00.part" ]; then
  echo "  reassembling app.asar from split parts (parts.sha256)"
  ( cd "$LAYER" && sha256sum -c parts.sha256 && cat app.asar.00.part app.asar.01.part > app.asar )
fi
for f in app.asar server.mjs cli.mjs recovery-cli.mjs main-guest.cjs index-cp.html material-symbols-cp.woff2; do
  [ -f "$LAYER/$f" ] || { echo "[FAIL] intranet layer missing: $LAYER/$f"; exit 1; }
done
[ -f "$LAYER/assets/App-BUNNj51i.js" ] || { echo "[FAIL] intranet layer assets incomplete (no App-BUNNj51i.js)"; exit 1; }
[ -f "$LAYER/adapters-chunks/APEv2Parser-IPT6KYZ7.mjs" ] || { echo "[FAIL] intranet layer adapters-chunks incomplete"; exit 1; }
cp -f "$LAYER/app.asar" "$APP/resources/app.asar"
rm -rf "$DIST/adapters-chunks"
cp -a "$LAYER/adapters-chunks" "$DIST/adapters-chunks"
for f in server.mjs cli.mjs recovery-cli.mjs; do
  cp -f "$LAYER/$f" "$DIST/$f"
done
rm -f "$DIST"/assets/App-*.js
cp -a "$LAYER/assets/." "$DIST/assets/"
cp -f "$LAYER/index-cp.html" "$DIST/index.html"
cp -f "$LAYER/material-symbols-cp.woff2" "$DIST/assets/material-symbols-outlined-DAw3iYaN.woff2"
cp -a "$LAYER/fonts/." "$DIST/fonts/"
cp -f "$LAYER/material-symbols-cp.woff2" "$DIST/fonts/material-symbols-outlined.woff2"
mkdir -p "$APP/resources/app.asar.unpacked/electron-dist"
cp -f "$LAYER/main-guest.cjs" "$APP/resources/app.asar.unpacked/electron-dist/main.cjs"

echo "== 5/9 stage pinned ripgrep + drop broken compiled sidecar =="
mkdir -p "$BIN"
rm -f "$BIN/claude-sidecar-x86_64-pc-windows-msvc.exe"
cp -a "$RIPGREP_DIR/." "$BIN/"
ls "$BIN" 2>/dev/null || echo "  (empty)"
[ -f "$BIN/rg.exe" ] || { echo "[FAIL] rg.exe not staged into $BIN"; exit 1; }
echo "  rg.exe sha256: $(sha256sum "$BIN/rg.exe" | cut -d' ' -f1)"

echo "== 5b/9 inject official app icon + alternate icon group into exe =="
node "$HERE/icon-tool/inject-icon.mjs" "$APP/Claude Code Haha.exe" \
  "$HERE/assets/app-icon.ico" "$HERE/assets/claude-alt.ico"
node "$HERE/icon-tool/verify-alt-group.mjs" "$APP/Claude Code Haha.exe" \
  "$HERE/assets/app-icon.ico" "$HERE/assets/claude-alt.ico"

echo "== 5c/9 ship alternate desktop icon (claude-alt.ico) =="
cp -f "$HERE/assets/claude-alt.ico" "$APP/claude-alt.ico"
ls -la "$APP/claude-alt.ico"
cp -f "$HERE/assets/app-icon.ico" "$APP/app-icon.ico"
ls -la "$APP/app-icon.ico"

echo "== 6/9 overlay offline runtime payloads =="
mkdir -p "$RT"
for d in node-v22.17.0 python-3.8.10 vxkex-1.2.1.2229; do
  rm -rf "$RT/$d"
  cp -a "$RUNTIME_DIR/$d" "$RT/$d"
done
rm -rf "$RT/node" "$RT/python" "$RT/vxkex" "$RT/git"
for f in setup-vxkex.bat requirements-win.txt requirements.txt win_helper.py; do
  [ -f "$RUNTIME_DIR/$f" ] && cp -f "$RUNTIME_DIR/$f" "$RT/$f" || true
done
rm -f "$RT/WIN7-SETUP.txt" "$RT/mac_helper.py" "$RT/test_helpers.py"

echo "== 7/9 guarantee node-pty winpty payload (full TTY terminal on Win7) =="
NODE_PTY_DST="$APP/resources/app.asar.unpacked/node_modules/node-pty"
if [ ! -f "$NODE_PTY_DST/lib/windowsTerminal.js" ] || \
   [ ! -f "$NODE_PTY_DST/prebuilds/win32-x64/winpty-agent.exe" ]; then
  echo "  node-pty missing/pruned in Stage A payload — overlaying vendored copy"
  mkdir -p "$NODE_PTY_DST"
  cp -a "$HERE/../runtime/node-pty-1.1.0-win32-x64/." "$NODE_PTY_DST/"
fi
ls "$NODE_PTY_DST/prebuilds/win32-x64" | sed 's/^/  node-pty: /'

echo "== 8/9 bundled PortableGit (Bash tool on a clean offline Win7) =="
if [ -d "$RUNTIME_DIR/git-2.45.2" ]; then
  echo "  overlaying bundled PortableGit -> resources/runtime/git-2.45.2"
  rm -rf "$RT/git-2.45.2"
  cp -a "$RUNTIME_DIR/git-2.45.2" "$RT/git-2.45.2"
else
  echo "  (no RUNTIME_DIR/git-2.45.2 — Bash tool needs Git for Windows installed)"
fi

echo "== 9/9 makensis (native, no wine) =="
ln -sfn "$APP" "$HERE/app"
cp -f assets/app-icon.ico assets/modern-wizard.bmp .
makensis installer.nsi

echo
echo "[OK] built: $OUT_EXE"
sha256sum "$OUT_EXE"
