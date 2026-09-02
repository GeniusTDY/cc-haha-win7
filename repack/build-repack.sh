#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SETUP="${1:-$HERE/Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe}"
NODE_FALLBACK_DIR="${NODE_FALLBACK_DIR:-$HERE/../runtime/node-fallback}"
RUNTIME_DIR="${RUNTIME_DIR:?set RUNTIME_DIR to the offline runtime payloads dir (node/ python/ vxkex/ ...)}"

OUT_EXE="$HERE/Claude-Code-Haha-0.5.4-win7-x64-setup.exe"
APP_VERSION="0.5.4"
WORK="$HERE/.work"
ORIG="$WORK/orig"
APP="$WORK/app"

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

echo "== 5/9 remove broken compiled sidecar =="
rm -f "$BIN/claude-sidecar-x86_64-pc-windows-msvc.exe"
ls "$BIN"

echo "== 6/9 overlay offline runtime payloads =="
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
