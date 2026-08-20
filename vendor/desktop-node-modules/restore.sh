#!/usr/bin/env bash
# restore.sh — one-command restore of desktop/node_modules from the
# git-committed plain file tree in this directory (vendor/desktop-node-modules/).
#
# Replaces `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install` entirely:
#   - node_modules/ here is the exact dependency tree as resolved WITH patch
#     001 applied (electron 22.3.27 + electron-builder 26.8.1 pinned; 957
#     packages, ~782MB, 31709 files) — apply patches 001-004 BEFORE this step
#   - patch 006 (electron-builder NsisTarget nowine) is PRE-APPLIED in the
#     committed tree — no git apply step, no install-order constraints
#   - no archives anywhere in the repo: the tree is committed as plain files
#     (same convention as port-src/vendor/node_modules/ esbuild), so restore
#     is a plain copy (cp -a) — no tar, no split parts, no reassembly
#   - no postinstall scripts ran when the tree was snapshotted, so no Electron
#     binary download is ever triggered
#   - matching package-lock.json sits next to this script for anyone who
#     prefers a real `npm install` (copy it into desktop/ to pin the same
#     resolution, then apply 006 after install)
#
# Usage (from cc-haha/desktop/, the documented Stage A layout):
#   bash ../../cc-haha-win7/vendor/desktop-node-modules/restore.sh
# Or with an explicit target:
#   bash restore.sh /path/to/cc-haha/desktop
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
src="$here/node_modules"

# ---- locate the desktop/ dir to restore into -----------------------------
target=""
if [ "${1:-}" != "" ]; then
  target="$1"
elif [ -f "$PWD/package.json" ] && grep -q '"name": *"claude-code-desktop"' "$PWD/package.json" 2>/dev/null; then
  target="$PWD"                       # run from inside desktop/
elif [ -d "$here/../../../cc-haha/desktop" ]; then
  target="$here/../../../cc-haha/desktop"   # sibling-clone default layout
fi
if [ -z "$target" ] || [ ! -f "$target/package.json" ]; then
  echo "usage: restore.sh [path-to-cc-haha-desktop]   (or run from inside desktop/)" >&2
  exit 1
fi

if [ ! -d "$src" ]; then
  echo "[restore] $src missing — the committed node_modules tree is not here" >&2
  exit 1
fi
if [ -d "$target/node_modules" ]; then
  echo "[restore] $target/node_modules already exists — remove it first to re-copy" >&2
  exit 1
fi

# ---- plain copy (preserves symlinks, exec bits, mtimes) --------------------
echo "[restore] copying node_modules into $target ..."
cp -a "$src" "$target/node_modules"

# ---- verify what matters for the offline build ---------------------------
(cd "$target" && node -e "
const v = p => require(p + '/package.json').version
console.log('[restore]   electron ' + v('electron') + ', electron-builder ' + v('electron-builder'))
") 2>/dev/null || true
n="$target/node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js"
if [ -f "$n" ] && grep -q 'process.platform !== "win32"' "$n"; then
  echo "[restore] OK — node_modules copied, patch 006 (nowine) already applied"
else
  echo "[restore] WARNING: patch 006 not detected in $n — re-apply patches/electron-builder/006-*.patch" >&2
  exit 1
fi
