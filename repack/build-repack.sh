#!/usr/bin/env bash
# =============================================================================
# build-repack.sh — rebuild Claude-Code-Haha-0.5.4-win7-x64-setup.exe
#
# Stage B of the Win7 offline build: repackage the electron-builder output
# (Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe, Stage A) into the all-in-one
# offline installer with native makensis — no wine required.
#
# Produces the restored offline installer.
# Build history — the sha256 is each build's identifier (the product
# version is always 0.5.4, tracking upstream cc-haha):
# initial build (byte-identical to the released Offline.exe):
#   sha256 3221d5e9d1c56a4d0a00655a67dfad8f99bcb5387525a7c5426499ad8a025b40
# improvement build (CU setup accepts a custom python path that resolves
#   to the bundled interpreter; see patches/cli/004 runSetup venv fallback):
#   sha256 971df9d518f0d567c4a6a759835d99882cac1fc5abeabac51abce91dbe766ae1
# 2026-08-19 rebuild (also fixes Win32 CLI spawn + provider-env
#   over-stripping; Release asset until the 2026-08-20 rebuild):
#   sha256 03286eaf62a5ce7e607c610bc66787897be87c9539ff648225f98a4b0ba716be
# 2026-08-20 "most complete" rebuild:
#   + desktop terminal full TTY: main.cjs forces node-pty's winpty backend on
#     Win7/8 (ConPTY is Win10 1809+) — patch-app-asar.mjs surgery inside
#     app.asar, preserving the node-runtime fallback layer byte-exactly
#   + Bash tool on a clean offline box: cli.mjs probes CC_HAHA_RUNTIME_DIR /
#     <resources>/runtime/git-2.45.2/bin/bash.exe (bundled PortableGit 2.45.2)
#   + Computer Use fully offline: server.mjs CU patch (identifier-adaptive
#     patch-computer-use.py) installs Python deps from bundled wheels
#   + node-pty payload guaranteed in app.asar.unpacked/node_modules
# 2026-08-20 rebuild-from-parts (same fix set, zero network):
#   sha256 76a635d9456c9760cb3da5decebe37288bab63244279b137520430626a5ee8ec
#   — built from the git-committed split parts (setup-exe/) + runtime tree
#   only; differs from the c22f57eb… "most complete" build solely by
#   NSIS-embedded file mtimes (structural identity asserted: same fix set)
# 2026-08-20 feed-rewrite rebuild (same fix set + step 2b repoints
#   app-update.yml at GeniusTDY/cc-haha-win7; was the Release asset):
#   sha256 b3665af60989fead7f4a2b36c555a1d0074859782cafb30f500340ee55371f4c
#   REGRESSION (found 2026-08-21 audit): it was built at 13:27, BEFORE the
#   repo-side restores — its server.mjs/cli.mjs were the 844024a9 regressed
#   bundles (no win32 CLI spawn chain, no VT-input gate), so desktop chat
#   and cron sessions threw on every spawn (import.meta.dir undefined under
#   Node). Superseded by the 2026-08-21 fixed rebuild below.
# 2026-08-21 fixed rebuild:
#   + deploys the FIXED node-fallback bundles (5a8b9943 win32 spawn chain +
#     nodeSqliteFlagArgs, a9ba5178 cli.mjs VT-input gate, Pillow>=10.0,<10.5)
#   + step 6 drops the seed's unversioned runtime/node|python|vxkex dirs
#     (~128MB of dead on-disk duplicates in every earlier build)
#   + adapters-chunks carries exactly the 6 overlay chunks (no stale
#     Stage A leftovers)
#   REGRESSION (found 2026-08-21 CJK-comment audit): pruning to 6 files
#   also dropped the 6 shared chunks the adapter chunks statically import
#   (chunk-{3YB4CKQ6,BIHENVFB,DHF3HF4Q,EGNMGFGK,U75DXZ5W,ZU3FNH5X}) —
#   every --feishu/--telegram/--wechat/--whatsapp/--dingtalk load died
#   with ERR_MODULE_NOT_FOUND in the d9edd747/7ad7852e/9973c54b builds.
#   Fixed by the adapter-chunks restore below.
#   sha256 d9edd74791aa23ac206fad92e630576b1fcf38e0a1706dca38c0720f0c39c2ea
#   (briefly published under a bumped version stamp; superseded same day
#   by the re-stamp below)
# 2026-08-21 re-stamp (identical fix set to the 2026-08-21 fixed rebuild
#   above, version kept at 0.5.4 — this port tracks upstream cc-haha
#   versioning; upstream IS 0.5.4):
#   sha256 7ad7852ec1f3c23db644d273b45e99d6ab50f77c80af46fc88314311ab2f12b3
# 2026-08-21 installer-i18n rebuild: same fix set
#   + installer.nsi texts moved to NSIS LangString tables (SimpChinese +
#     English; MUI pages, the VxKex/node dialogs, the finish-page checkbox
#     and the detail-log lines all follow the OS UI language at runtime —
#     compile output embeds 2 language tables)
#   sha256 9973c54bc460eecd3ec3cf5a68674f3f755b4798b0f7335d6dd03a867f7b7b42
#   (carried the adapter-chunks regression above; superseded same day by
#   the adapters-restore rebuild below)
# 2026-08-21 adapters-restore rebuild (current Release asset): the CJK
#   -comment audit found every IM adapter broken since the 6-chunk prune
#   + restores the 6 shared chunks (chunk-{3YB4CKQ6,BIHENVFB,DHF3HF4Q,
#     EGNMGFGK,U75DXZ5W,ZU3FNH5X}.mjs) from d43ce656 — adapters-chunks is
#     again the full 12-file import closure, every --feishu/--telegram/
#     --wechat/--whatsapp/--dingtalk load verified import-clean
#   + feishu/dingtalk adapter chunks stripped of the third-party SDKs'
#     Chinese JSDoc comments (2802 spans, -1.5MB; code proven
#     byte-equivalent via esbuild --minify-whitespace normalization)
#   + port-src/scripts/node-port/strip-cjk-comments.mjs wired into
#     build.mjs so source rebuilds emit comment-free chunks too
#   sha256 f964d552df2fe63735c567c176a09b73c47d033b2e9894b3df0b6220e77d2ea1
#   Caveat: with the feed version equal to the installed one,
#   electron-updater offers nothing — users of earlier builds must
#   re-download this installer manually.
# 2026-08-21 session-spawn fix rebuild (current Release asset): a runtime
#   Bun.spawn audit found 5 more reachable call sites in server.mjs that
#   still hit the undefined Bun global under Node — conversation sessions,
#   the cron task scheduler and openLogDir x3 — all rewritten to
#   nodeBunSpawn; plus
#   + shouldStripInheritedProviderEnv no longer strips ANTHROPIC_* when
#     providerId === null (env-only setups keep their inherited auth, so
#     the spawned CLI can authenticate instead of exiting silently)
#   + cron buildCronCliArgs/resolveCronProjectRoot no longer rely on the
#     Bun-only import.meta.dir (fileURLToPath(import.meta.url) fallback)
#   Same electron-updater caveat as above (version stays 0.5.4).
#   sha256 c67271455b47f2181f3f255af8f959f43242ceb14e5814640c0ea95c4d8946c1
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
APP_VERSION="0.5.4"
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

echo "== 3/9 patch app.asar main.cjs (force winpty terminal backend + $APP_VERSION) =="
# Surgical in-place asar rewrite (see patch-app-asar.mjs header comment): the
# shipped main.cjs carries the Win7 node-runtime fallback layer that is not in
# the current desktop sources, so we only insert the one missing runtime hunk
# of patches/desktop/006 — `ptySpawnOptions.useConpty = false` on legacy
# Windows — and leave every other archived file at its original offset.
# --set-version re-stamps the asar package.json version to APP_VERSION
# (no-op for 0.5.4 — the Stage A seed already carries it; the flag exists
# so a future version bump propagates into the asar for electron-updater).
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
# node-v22.17.0/ python-3.8.10/ (with fixed python38._pth + whl wheels)
# vxkex-1.2.1.2229/ + scripts
for d in node-v22.17.0 python-3.8.10 vxkex-1.2.1.2229; do
  rm -rf "$RT/$d"
  cp -a "$RUNTIME_DIR/$d" "$RT/$d"
done
# the Stage A seed still carries the pre-version-stamp unversioned runtime
# dirs (~128MB dead weight — every probe now uses the versioned layout)
rm -rf "$RT/node" "$RT/python" "$RT/vxkex" "$RT/git"
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
# expected: f964d552… (2026-08-21 adapters-restore rebuild, version 0.5.4)
#   — current Release asset
# historical: 3221d5e9… (initial, = released Offline.exe) · 971df9d5…
#   (CU python-path fix) · 03286eaf… (2026-08-19, win32 spawn +
#   provider-env fixes) · c22f57eb… (2026-08-20, "most complete") ·
#   76a635d9… (2026-08-20, from git parts) · b3665af6… (2026-08-20,
#   regressed server.mjs/cli.mjs) · d9edd747… (2026-08-21, fixed;
#   superseded by the 0.5.4 re-stamp) · 7ad7852e… (2026-08-21 re-stamp,
#   superseded by the installer-i18n rebuild) · 9973c54b… (2026-08-21
#   installer-i18n, regressed adapters-chunks; superseded by the
#   adapters-restore rebuild)
