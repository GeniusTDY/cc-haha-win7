# desktop-electron — Electron main-process build artifacts (Win7 port)

**English** | [简体中文](README.zh-CN.md)

These are the four compiled artifacts from the Win7 desktop build
(Electron 22.3.27), rebuilt against upstream v0.6.2 and overlaid onto
`electron-dist/` in the offline installer's `resources/app.asar`:

| file | sha256 (first 16) | role |
|---|---|---|
| `main.cjs` | `c972586903f9d08a` | main process (node-fallback layer + winpty forcing + Electron-22 feature fallbacks, see below) |
| `preload.cjs` | `ffe5f6b7f573b109` | renderer preload |
| `pet-preload.cjs` | `5a51c07283993343` | pet window preload |
| `preview-preload.cjs` | `515f049a78e78d29` | preview window preload |

Full hashes: `MANIFEST.sha256` in this directory. `main.cjs` carries
all Win7 port additions — the node-runtime fallback layer described
below, the Electron-22 feature fallbacks (tray i18n, preview view
fallback, lazy autoUpdater), the renderer-recovery hardening, AND the
winpty backend forcing
(`ptySpawnOptions.useConpty = false` on legacy Windows, the same hunk
`repack/patch-app-asar.mjs` inserts when it patches an asar whose
main.cjs lacks it; that patcher is idempotent, so overlaying this
already-patched main.cjs into a Stage A build is safe).

They live inside `app.asar` at `electron-dist/*.cjs`. The desktop build
compiles `desktop/electron/*.ts` (upstream) plus the Win7 port additions
below; when rebuilding from source, the outputs must be overlaid onto
`electron-dist/` before electron-builder packs the asar.

## main.cjs node-runtime fallback layer (Win7 port addition)

Upstream v0.6.2 spawns a Bun-compiled sidecar
(`src-tauri/binaries/claude-sidecar-x86_64-pc-windows-msvc.exe`) for the
server and adapter processes. That binary has a packaging defect
unrelated to Win7 and is deliberately **removed** by the offline repack;
main.cjs then falls back to spawning the bundled Node.js runtime:

```
main.cjs (shipped)                       upstream equivalent
---------------------------------------  ------------------------------------------
var NODE_RUNTIME_EXE_ENV =               (absent — sidecar only)
  "CC_HAHA_NODE_EXE";
var SERVER_MJS_ENV = "CC_HAHA_SERVER_MJS";
var ADAPTERS_MJS_ENV =
  "CC_HAHA_ADAPTERS_MJS";

function resolveNodeRuntimeExecutable()  env override CC_HAHA_NODE_EXE
  // CC_HAHA_NODE_EXE if it exists,     else "node.exe" (win32) / "node"
  // else "node.exe" / "node"

function sqliteFlagArgsForVersion(v)    Node 22.5–22.12 / 23.0–23.3:
  // ["--experimental-sqlite"]           node:sqlite needs the flag

function nodeRuntimeFlags()             probes `node --version` once,
  // cached version probe                returns [] or the sqlite flag
```

Spawn-plan sites (server + adapters) switch from
`command: resolveSidecarExecutable(desktopRoot)` to
`command: resolveNodeRuntimeExecutable(env), args: [<sqlite flags>,
server.mjs | adapters.mjs, ...]` with entry resolution overridable via
`CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS`.

The bundled `resources/runtime/node-v22.17.0/node.exe` (Node 22.17.0 win-x64) is
resolved directly by `resolveNodeRuntimeExecutable` (probe order:
`CC_HAHA_NODE_EXE` → `desktopRoot/runtime/node-v22.17.0/node.exe` →
`../runtime/node-v22.17.0/node.exe` → `process.resourcesPath/runtime/
node-v22.17.0/node.exe` → PATH) — the installer also adds a
firewall allow rule for it. The sidecar child env additionally gets the
bundled ripgrep directory on PATH via `withBundledRipgrepPath`
(`buildSidecarEnv` itself only sets `CLAUDE_H5_*` / `CLAUDE_CONFIG_DIR` /
`XDG_CACHE_HOME`, not PATH). On Win7, node.exe only starts under the VxKex
compatibility layer (registered with `WINVERSPOOF:NONE`; see
`runtime/setup-vxkex.bat`).

## main.cjs Electron-22 feature fallbacks (Win7 port addition)

Upstream v0.6.2 targets Electron 42 and uses three APIs that do not
exist (or are not callable) on Electron 22.3.27. `main.cjs` patches
each so the corresponding upstream feature keeps working on Win7:

| upstream (Electron 42) | Win7 fallback in `main.cjs` |
|---|---|
| `WebContentsView` + `window.contentView.addChildView/removeChildView` | `previewViewConstructor = WebContentsView ?? BrowserView`; preview attach/detach uses `addBrowserView`/`removeBrowserView` when `contentView` is absent (`attachPreviewView`/`detachPreviewView`) |
| eager `import { autoUpdater } from 'electron-updater'` | `loadAutoUpdater()` lazily `require`s the module and falls back to `createAutoUpdaterStub()` when it is unavailable, so a missing updater never crashes startup |
| English-only tray tooltip/labels | `resolveTrayLocale` + `TRAY_LABELS` localize the tooltip and context menu across `en` / `zh` / `zh-TW` / `jp` / `kr`; `TrayController.setLocale` re-applies them when the locale preference changes |

## main.cjs renderer-recovery hardening (Win7 port addition)

Upstream reloads an unresponsive/crashed renderer **at most once**, then
gives up. Chromium 108 on Win7 can wedge on a single reload (stale
`localstorage` / shader cache), so `installRendererLifecycle` retries up
to `MAX_RENDERER_RECOVERY_ATTEMPTS = 3` with a `0 / 750 / 2000 ms`
backoff and, from the second attempt on, clears `localstorage` before
reloading (the third attempt also clears `shadercache` and
`cachestorage`). Recorded as
`patches/desktop/015-renderer-recovery-hardening.patch`.

Reference: Technical-Support.md (repo root) §3, §4.4, §6.
