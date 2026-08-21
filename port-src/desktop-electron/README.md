# desktop-electron — Electron main-process build artifacts (Win7 port)

**English** | [简体中文](README.zh-CN.md)

These are the four compiled artifacts from the Win7 desktop build
(Electron 22.3.27), byte-identical to the ones inside the shipped
offline installer's `resources/app.asar`:

| file | sha256 (first 16) | role |
|---|---|---|
| `main.cjs` | `b42ba76eed1eb658` | main process (node-fallback layer + winpty forcing, see below) |
| `preload.cjs` | `17710337ae27feb7` | renderer preload |
| `pet-preload.cjs` | `7d73778fe069d0d8` | pet window preload |
| `preview-preload.cjs` | `819aae02d816873d` | preview window preload |

Full hashes: `MANIFEST.sha256` in this directory. `main.cjs` carries
both Win7 port additions — the node-runtime fallback layer described
below AND the winpty backend forcing
(`ptySpawnOptions.useConpty = false` on legacy Windows, the same hunk
`repack/patch-app-asar.mjs` inserts when it patches an asar whose
main.cjs lacks it; that patcher is idempotent, so overlaying this
already-patched main.cjs into a Stage A build is safe).

They live inside `app.asar` at `electron-dist/*.cjs`. The desktop build
compiles `desktop/electron/*.ts` (upstream) plus the Win7 port additions
below; when rebuilding from source, the outputs must be overlaid onto
`electron-dist/` before electron-builder packs the asar.

## main.cjs node-runtime fallback layer (Win7 port addition)

Upstream v0.5.4 spawns a Bun-compiled sidecar
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

Reference: Technical-Support.md (repo root) §3, §4.4, §6.
