# cc-haha Win7 Port — Technical Design

**English** | [简体中文](Technical-Support.zh-CN.md)

> **Upstream**: [NanmiCoder/cc-haha](https://github.com/NanmiCoder/cc-haha) v0.5.4 (Bun + Electron 42 + Tauri sidecar architecture, `d52bbec7`)
> **Target**: Windows 7 SP1 x64, fully offline installation and use
> **Scope**: This document covers only the technical design of the Win7 port itself. For the project overview and user guide see the [README](README.md).

## Contents

1. [Overview](#1-overview)
2. [Win7 system prerequisites](#2-win7-system-prerequisites)
3. [VxKex registration](#3-vxkex-registration)
4. [Bun-to-Node full port](#4-bun-to-node-full-port)
5. [Key server.mjs patches](#5-key-servermjs-patches)
6. [Sidecar defect and the main.cjs fallback](#6-sidecar-defect-and-the-maincjs-fallback)
7. [Electron 22 / Chromium 108 adaptation](#7-electron-22--chromium-108-adaptation)
8. [Computer Use offline adaptation](#8-computer-use-offline-adaptation)

---

## 1. Overview

The layer-by-layer comparison table against upstream lives in the [README](README.md) and is not repeated here. Runtime architecture:

```text
GUI main process (Electron 22, natively Win7-compatible)
  └─ detects missing sidecar → spawns the bundled node.exe to run server.mjs (HTTP + WS)
       ├─ CLI sessions: server spawns cli.mjs
       └─ scripting capability: bundled Python 3.8 (Computer Use)

node.exe / python.exe / rg.exe all get their Win8+ APIs filled in via VxKex injection
```

Technical modules and section index:

| Section | Module |
|---|---|
| [2](#2-win7-system-prerequisites) | Win7 system prerequisites (KB patches) |
| [3](#3-vxkex-registration) | VxKex compatibility-layer registration |
| [4](#4-bun-to-node-full-port) | Bun-to-Node full port (API compat layer, esbuild pipeline, runtime spawn chain) |
| [5](#5-key-servermjs-patches) | Key server.mjs patches |
| [6](#6-sidecar-defect-and-the-maincjs-fallback) | Sidecar defect and the main.cjs fallback |
| [7](#7-electron-22--chromium-108-adaptation) | Electron 22 / Chromium 108 adaptation (CSS downgrade, API boundaries) |
| [8](#8-computer-use-offline-adaptation) | Computer Use offline adaptation (Python payload and pip bootstrap) |

## 2. Win7 system prerequisites

| KB | Purpose | SHA1 |
|---|---|---|
| KB2533623 x64 | kernel32 SafeDLL loading APIs (`AddDllDirectory` etc.), required for Chromium delay-loading | `8a59ea3c7378895791e6cdca38cc2ad9e83bebff` |
| KB2670838 x64 | Platform update: Direct2D / DirectWrite / D3D11 / WIC, required for Chromium GPU compositing | `9f667ff60e80b64cbed2774681302baeaf0fc6a6` |

Both MSU files are committed in git (`runtime/kb-patches/`, SHA1 matches Microsoft's official values) — no Release download needed.

VxKex 1.2.1.2229: the installer embeds `KexSetup_Release_1_2_1_2229.exe` for offline installation.

## 3. VxKex registration

VxKex 1.2.x does **not** ship `KexDll64.dll`, so the old "hand-write VerifierDlls into IFEO" approach does not work — registration must use the official `KexCfg.exe`:

```bat
"%KEXCFG%" /EXE:"<target.exe>" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
```

Registration matrix:

| Image | Verdict | Reason |
|---|---|---|
| `Claude Code Haha.exe` (GUI) | **Do not register** | Electron 22 / Chromium 108 runs natively on Win7 SP1 once the two KBs are installed |
| `runtime\node-v22.17.0\node.exe` | **Register, WINVERSPOOF:NONE** | Node 22 imports Win8+ APIs (`EventSetInformation` etc.); without registration it exits with `0xC0000139` |
| `runtime\python-3.8.10\python.exe` | **Register, WINVERSPOOF:NONE** | UCRT api-set shim, required by the Computer Use dependency chain |
| `src-tauri\binaries\rg.exe` | **Register, WINVERSPOOF:NONE** | Statically imports `WaitOnAddress` (api-ms-win-core-synch-l1-2-0, Win8+); without registration search hangs behind a modal DLL error |
| sidecar exe | Not registered (removed) | See §6 |

**Why version spoofing must stay off**: with WIN10 spoofing enabled, V8 takes the ThreadIsolation path where `OS::SetPermissions` uses the Win10-only `PAGE_TARGETS_INVALID` flag, triggering a `Check failed: 1455L == error` crash; with NONE, V8 takes the traditional Win7 memory path.

Registry mechanics (KexCfg writes `HKLM\...\Image File Execution Options\<image name>` automatically):

| Registry value | Purpose |
|---|---|
| FilterFullPath | Matches the executable by its **full path** (one subkey per path) |
| KEX_WinVerSpoof | Version-spoofing level (must be NONE in this design) |
| KEX_DisableForChild = 0 | Child processes inherit VxKex (required for node to spawn children) |
| GlobalFlag = 0x100 / VerifierFlags = 0x80000000 / VerifierDlls = kexdll.dll | Application Verifier injection mechanism |

Constraint: registration is path-scoped — copying node.exe elsewhere and running it exits with `0xC0000139` (no injection); moving it to a new path requires re-registration.

Full script: `runtime\setup-vxkex.bat` (install detection + three registrations + double self-check); the installer performs the three registrations automatically during setup.

## 4. Bun-to-Node full port

Upstream Bun dependencies are re-based onto Node: `bun:sqlite` / `bun:bundle` are swapped via esbuild module aliases, while the remaining call sites are source-level rewrites that import the compat layer directly — `Bun.serve` in `server/index.ts`; `Bun.spawn` in `api/sessions.ts` / `api/computer-use.ts` and, since the 2026-08-21 session-spawn fix, in the services layer too (`conversationService.ts` session spawn, `cronScheduler.ts` task spawn, `diagnosticsService.ts` `openLogDir` x3 — under Node the bare `Bun` global is undefined and every session/cron spawn threw at the call site); `Bun.file` in `staticH5.ts` / `api/previewFs.ts`. The compat layer lives in `port-src/src/compat/`, the build scripts in `port-src/scripts/node-port/`.

### 4.1 API compatibility layer

| Bun dependency | Node approach | Location |
|---|---|---|
| `bun:sqlite` | `node:sqlite` (DatabaseSync, boolean-argument normalization) | `compat/bunSqlite.ts` |
| `Bun.spawn` | `node:child_process`, replicating the `exited` promise semantics (settle on both exit and error paths) | `compat/bunSpawn.ts` |
| `Bun.serve` (incl. WS upgrade) | `node:http` + `ws`: path routing (`/ws/`, `/sdk/`), disable HTTP writes after upgrade, ECONNRESET / per-request error fallbacks | `compat/bunServe.ts` |
| `Bun.file` | streaming implementation over `node:fs` | `compat/bunFile.ts` |
| `bun:bundle` / `feature()` | shim; defaults to `TRANSCRIPT_CLASSIFIER` when `CC_HAHA_FEATURES` is unset, set empty to disable | `compat/bunBundle.ts` |
| `import.meta.main` | new `serverNode.ts` wrapper entry (the property is undefined under Node, which prevented the server from self-starting) | entrypoints |
| `import.meta.dir` (cron) | inline `?? fileURLToPath(import.meta.url)` fallback in `buildCronCliArgs` / `resolveCronProjectRoot` (undefined under Node — cron CLI resolution and project-root probing crashed before the 2026-08-21 fix) | call sites in `cronScheduler.ts` |
| `MACRO.*` build-time injection | esbuild `define` replicating all 7 keys of the Bun release pipeline (VERSION / PACKAGE_URL / NATIVE_PACKAGE_URL / VERSION_CHANGELOG / ISSUES_EXPLAINER etc.) | build.mjs |

Native / private module stub strategy matches upstream (`color-diff-napi` and `@ant/claude-for-chrome-mcp` already point at stubs upstream); `@whiskeysockets/baileys` is stubbed in the CLI bundle but real for the adapters build; optional integrations (sharp, Bedrock / Vertex SDKs, OTel exporters, audio-capture) are external with dynamic-import fallbacks.

**Rewrite boundary**: the source-level call-site rewrites above live in the upstream working tree used for building and are not carried as patches (a fresh-clone rebuild of dist needs them re-applied first — see patches/README "Source-level overlay gap"). `cli.mjs` additionally keeps three upstream-native `Bun.*` calls, all unreachable in the desktop flow: `Bun.serve` in `standaloneProviderProxy` (server sets `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1` when spawning the CLI, skipping that branch), the first-use probe of the ripgrep bundled mode and the `Bun.spawn` in /open-dir (the desktop passes the bundled rg explicitly via `CC_HAHA_RIPGREP_PATH` and never takes the argv0 branch). The shared `utils/ripgrep.ts` bundles one copy of that guarded `Bun.spawn` into `server.mjs` as well — likewise dead code under Node (the `config.argv0` branch only fires for Bun-embedded rg), so it is deliberately left un-rewritten.

### 4.2 esbuild build pipeline (replacing all `bun build`)

- **esbuild is vendored**: 0.28.2 itself plus both `@esbuild/linux-x64` and `@esbuild/win32-x64` binaries are committed under `port-src/vendor/node_modules/` (~23MB). The three build scripts (build.mjs / build-electron.mjs / build-preview-agent.mjs) load the vendored copy first; an esbuild inside the repo's own node_modules is only a fallback — **esbuild itself needs zero registry access**. The upstream sources' own 67 dependencies (axios, lodash-es, react, …) still need to be installed in the upstream root first, otherwise the build fails with ~2000 unresolved errors (`port-src/vendor/` only vendors esbuild; the desktop dependency tree is separate under `vendor/desktop-node-modules-0.5.4/`; neither covers the upstream root dependencies).
- **Outputs**: `build.mjs` → `dist/{cli,server,recovery-cli,adapters}.mjs` + `adapters-chunks/` (the five IM adapters code-split on demand: feishu 3.6MB / whatsapp 4.4MB / telegram 967KB / dingtalk 221KB / wechat 30KB, plus 7 shared chunks (`chunk-*.mjs`) statically imported by the adapter chunks — drop any one and it's `ERR_MODULE_NOT_FOUND`; the entry dispatcher `port-src/adapters/index.ts` is overlaid onto `<root>/adapters/index.ts` automatically by the build script; after the build, third-party-SDK Chinese JSDoc comments are stripped automatically — `port-src/scripts/node-port/strip-cjk-comments.mjs` removes comments only and never touches code, verified byte-equivalent through esbuild-normalized output).
- **Graceful adapters degradation**: when `adapters/node_modules` is not installed, adapters.mjs is skipped with a notice and the three core outputs build normally; run `cd adapters && npm install` and rebuild for the full set. Stage B always uses the prebuilt chunks in `runtime/node-fallback/` and is unaffected by this step.
- **Desktop outputs**: `build-electron.mjs` → 4 CJS artifacts (external: electron / node-pty / electron-updater).
- **Unified banner injection**: ESM-compatible `__dirname` / `__filename` (required by CJS dependencies inside adapter chunks), `CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1"`, and `process.chdir(CALLER_DIR)` for cli / recovery (replicating the original bunfig preload side effect; not injected for server / adapters, matching the original compiled sidecar behavior).
- **Patch list and apply order**: see [patches/README.md](patches/README.md) — 001 Electron 22 pin / 002 CSS shim / 003 terminal winpty / 004 Bash resolution chain / 005 CU offline / 006 wine-free NSIS. The main.cjs fallback layer is not a numbered patch: it ships as the compiled artifact `port-src/desktop-electron/main.cjs` via the `port-src` overlay (§6); the dist Bun call-site rewrites and the compat/ entrypoints placement are likewise not carried as patches (patches/README "Source-level overlay gap").

### 4.3 The node:sqlite flag

`node:sqlite` was introduced in 22.5.0; **22.5.0–22.12.x and 23.0–23.3.x require `--experimental-sqlite`** (lifted from 22.13.0 / 23.4.0 on), otherwise startup dies with `ERR_UNKNOWN_BUILTIN_MODULE`. Two paths append it automatically:

1. main.cjs `sqliteFlagArgsForVersion()` (one cached `node --version` probe, shared by both the server and adapters spawn plans)
2. server.mjs `nodeSqliteFlagArgs()`: the `CC_HAHA_CLI_ENTRY` direct-connection branch injects the flag for the exact version range based on `process.versions.node`

The bundled node is 22.17.0 (≥22.13) and needs no flag anyway, which is why the win32 `dist/cli.mjs` direct-run branch of `resolveCliArgs` needs no injection; only bare `node dist\*.mjs` runs or switching to a 22.5–22.12 runtime require a manual version check.

### 4.4 Runtime spawn chain

**Desktop shell → server** (main.cjs): when the sidecar is missing, switch to `resolveNodeRuntimeExecutable()` + `[sqlite flags…] server.mjs|adapters.mjs`, with cascading fallbacks and no environment variables needed:

| Resolved item | Order |
|---|---|
| server entry | `CC_HAHA_SERVER_MJS` → `<inst>\resources\app.asar.unpacked\dist\server.mjs` |
| node interpreter | `CC_HAHA_NODE_EXE` → `<inst>\resources\runtime\node-v22.17.0\node.exe` → PATH |

The bundled node.exe is located by direct probing in `resolveNodeRuntimeExecutable()` (order above, PATH-independent); the sidecar child env additionally gets the bundled ripgrep directory on PATH via `withBundledRipgrepPath` (`buildSidecarEnv` only sets `CLAUDE_H5_*` / `CLAUDE_CONFIG_DIR` / `XDG_CACHE_HOME`, never PATH); the installer creates a firewall inbound rule for node.exe.

**server / cron → CLI**: the session service (`resolveCliArgs`) and — since the 2026-08-21 session-spawn fix — the cron scheduler (`buildCronCliArgs`) share the same stepwise chain: `CC_HAHA_CLI_ENTRY` direct connection (sqlite flag auto-added) → `../bin/claude-haha` launcher (present under the source-tree layout: injects CALLER_DIR / TRANSCRIPT_CLASSIFIER feature flags) → on win32, run `dist/cli.mjs` directly → `bin/claude-haha.cmd` fallback (full chain in §5.1). Before the fix the cron path only probed `../bin/claude-haha` and otherwise fell through to the Bun-only dev launcher, which crashed on the undefined `import.meta.dir`.

### 4.5 Port-internal environment variables

User-facing provider variables (`ANTHROPIC_*` etc.) and run modes are covered in the [README](README.md); this table only covers the port's internal fallback chains and switches:

| Variable | Purpose |
|---|---|
| `CC_HAHA_NODE_EXE` / `CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS` | Desktop-shell fallback-chain overrides: node interpreter / server / adapters entry |
| `CC_HAHA_CLI_ENTRY` | Direct-entry override for CLI processes spawned by server / cron |
| `CC_HAHA_BASH_EXE` / `CC_HAHA_RUNTIME_DIR` | Bash tool resolution-chain overrides |
| `CC_HAHA_DESKTOP_SERVER_URL` | Remote mode (Win7 runs only the Electron shell, the backend on another LAN machine) |
| `CC_HAHA_FEATURES` | Feature switches (default TRANSCRIPT_CLASSIFIER, set empty to disable) |
| `CC_HAHA_SKIP_DOTENV` | Skip loading the root .env (set to 1 when the server spawns CLI children) |
| `CLAUDE_CODE_LOCAL_RECOVERY` | Force the recovery CLI |
| `IS_SANDBOX` | Skip permission interception in container / root high-privilege scenarios |

## 5. Key server.mjs patches

### 5.1 Win32 CLI spawn path

The server originally spawned CLI children with the Bun-only `--preload` argument, which Node 22 rejects as `bad option` (exit 9), killing every WS session and cron job. `resolveCliArgs` now resolves stepwise: `CC_HAHA_CLI_ENTRY` direct connection (sqlite flag auto-added) → `../bin/claude-haha` JS launcher → on win32, execute `dist/cli.mjs` directly → fallback `bin/claude-haha.cmd` launcher → the source-tree preload path (unreachable in the install layout since cli.mjs always exists there). The cron scheduler's `buildCronCliArgs` mirrors this chain step for step (aligned in the 2026-08-21 fix).

### 5.2 Conditional stripping of inherited environment variables

`shouldStripInheritedProviderEnv` used to strip inherited `ANTHROPIC_*` unconditionally, so in official / default mode the CLI never received base_url / api_key / model. Stripping is now conditional and happens only when: a provider id is explicitly selected; `~\.claude\cc-haha\providers.json` exists; or `settings.json`'s `env` carries any provider key (`ANTHROPIC_*` model slots, OpenAI/Grok OAuth, the four image-generation keys, etc.). In a bare environment with no provider configuration at all, inherited variables pass through and the CLI picks up the inherited credentials directly. "Explicitly selected" means a string provider id (`typeof providerId === 'string'`, the 2026-08-21 tightening — the guard used to be `!== undefined`): `null` (Claude Official, also the default when nothing is configured) keeps the inherited env, so env-only setups (server launched with `ANTHROPIC_*` and no configured provider) can still authenticate.

### 5.3 Dependency self-healing after reinstall

CU dependencies are installed into the bundled Python's site-packages (removed with the program directory), while the completion stamp `~\.claude\.runtime\requirements.sha256` lives in the user directory (survives uninstall). After a reinstall, a matching stamp skips installation → site-packages is actually empty and CU looks ready but is not. Fix (in both the CU setup deps step and desktop-control `ensureBootstrapped`): on stamp match, first probe with a real `python -c "import mss, pyautogui, PIL, …"` import; on failure, force an offline reinstall from wheels and rewrite the stamp.

### 5.4 Bash tool shell resolution chain (patch 004)

The Bash tool depends on Git Bash, but upstream only probes POSIX paths (`/bin/bash` etc.), never reachable on Windows. The win32 branch explicitly probes three levels before the POSIX logic:

1. **User-installed Git for Windows**: `CC_HAHA_BASH_EXE` / `CLAUDE_CODE_GIT_BASH_PATH` overrides → standard install dirs → PATH scan
2. **Bundled PortableGit 2.45.2** (`runtime/git-2.45.2/`, the last usable release after 2.46+ dropped Win7): probes `CC_HAHA_RUNTIME_DIR/git-2.45.2` → portable layout `<dist>/../runtime/git-2.45.2` → installer layout `<dist>/../../runtime/git-2.45.2`
3. **Bare bash.exe on PATH** as the last resort

When none of the three exists, it errors with a hint to install Git for Windows or set `CC_HAHA_BASH_EXE`. A clean offline machine works out of the box via level 2 — nothing needs to be preinstalled.

## 6. Sidecar defect and the main.cjs fallback

**The defect**: `claude-sidecar-x86_64-pc-windows-msvc.exe` (Bun 1.2.x compiled) exits at startup with `Cannot find package 'bundle'` — a Bun compile-packaging problem unrelated to Win7; VxKex cannot fix it.

**The approach**: remove the sidecar, which triggers the built-in main.cjs fallback:

```text
createServerPlan():
  if (!hasCompiledSidecar())
      return { command: resolveNodeRuntimeExecutable(),   // node.exe
               args: [...sqliteFlags, server.mjs, ...] }   // see §4.4
  return sidecar plan
```

The stock NSIS installer asynchronously rebuilds the sidecar late in installation, so the removal is folded into the repack payload (Stage B) rather than a post-install script. The distribution must carry the node-port bundle (server.mjs / adapters.mjs / cli.mjs / recovery-cli.mjs / adapters-chunks\, deployed by Stage B from the repo's `runtime/node-fallback/` to the install layout `resources\app.asar.unpacked\dist\`).

Installer texts (MUI pages, the VxKex/node dialogs, the finish-page run checkbox, the detail-log lines) live in NSIS LangString tables — SimpChinese + English; makensis embeds both language tables and NSIS picks the one matching the OS UI language at runtime, so an English system never sees Chinese installer text (2026-08-21, Stage B `installer.nsi`).

## 7. Electron 22 / Chromium 108 adaptation

### 7.1 Renderer CSS runtime downgrade (patch 002)

Upstream Tailwind v4 uses the oklch palette, nesting, `color-mix()`, `scrollbar-color` and other features Chromium 108 does not support (a capability boundary, unrelated to the OS). **No CSS downgrade is configured at build time** — patch 001 only pins the Electron version; neither upstream's vite.config.ts nor this repo sets `css.transformer: lightningcss` / browserslist / `targets: chrome 108` (Tailwind v4's internal lightningcss would downgrade the oklch() palette to lab() of the same generation, but the lab family is equally missing in 108 — static transpilation cannot be relied upon). All 108 compatibility is handled at runtime: `desktop/index.html` injects an evaluator (`CSS.supports` probing) — filling in var()-based `color-mix()`, `lab()/oklch()` inside custom properties (evaluated to equivalent `rgb()`), `scrollbar-color` downgrades, `overlay` transition-keyword removal, plus a Set seven-methods polyfill (needed by cytoscape / mermaid). Modern engines with the features present skip all of it automatically.

### 7.2 Main-process / renderer API boundaries

| Surface | Fix / fallback |
|---|---|
| Preview panel | `WebContentsView` / `contentView` (Electron 28+) — runtime constructor probing, falls back to `BrowserView` / `addBrowserView` on 22 |
| File drag-drop | `webUtils.getPathForFile` (29+) dual-generation compatible: 29+ via webUtils, ≤31 via `File.path` |
| Auto-update | `electron-updater` lazy-loading (manual check/download, `autoDownload:false`), feed pointed at **this repo's** Releases — Stage B step 2b rewrites `resources/app-update.yml` (owner/repo overridable via `UPDATE_OWNER`/`UPDATE_REPO`); missing metadata or offline silently degrades to "no updates", never crashes |
| GPU compositing | On win32 with `os.release()` major < 10, `app.disableHardwareAcceleration()` automatically (prevents GPU-process crash loops on old drivers) |
| Desktop terminal | Win7/8 force node-pty's winpty backend (`useConpty:false`, patch 003) — winpty natively supports Win7 with full TTY emulation (vim / htop usable); repack steps 7/9 guarantee the winpty payload is never pruned; only a corrupted payload degrades to the pipe fallback (with a notice) |
| TUI keys | VT-mode gating adds `parseFloat(os.release()) >= 10` (Win7 conhost has no VT input; cli.mjs defaultBindings, restored via `patch-computer-use.py` P10) |
| Notifications | Gated by `isSupported()`, gracefully rejected when toast is unavailable |
| Workspace search | Bundled ripgrep 15.1.0 (PE import table uses only Win7-available APIs + SubsystemVersion 6.0, doubly verified; needs VxKex registration to run) |

## 8. Computer Use offline adaptation

Depends on Python 3 + mss / PyAutoGUI / Pillow / pywin32; the Win7 target machine is offline, and the standard venv + ensurepip + PyPI flow is entirely unusable on the embeddable distribution.

The bundled `runtime\python-3.8.10\python.exe` (3.8.10 embeddable, VxKex-registered) has three hard constraints:

| Constraint | Countermeasure |
|---|---|
| No `venv` module | server.mjs falls back to the bundled interpreter directly when venv detection fails and the source is bundled, writing a `venv-base-interpreter.txt` marker |
| No `ensurepip` / `pip` | pip wheel **extracted** into `Lib\site-packages` to bootstrap (see below) |
| `python38._pth` isolation | `._pth` rewritten: append `Lib\site-packages` + `import site` |

> **Payload note**: `runtime/python-3.8.10/python38.zip` (2.4MB, 605 stdlib `.pyc` files) is the **standard library itself** in the embeddable layout — the first line of `python38._pth` points at it and python.exe imports from it via zipimport; the `.pyd` / exe / DLL files are merely the binary half. It is not a duplicate copy of the python directory and **must not be deleted** (after deletion even `import os` fails). The `wheels/*.whl` likewise must stay in their original format (pip `--no-index --find-links` only accepts .whl). In the repo, only these two locations and two split-file sets (`repack/setup-exe/` installer parts, `vendor/electron-v22.3.27-win32-x64/electron.exe.00/01.part`) keep compressed / split-style files; all other build-time dependencies (esbuild / desktop node_modules / the Electron distribution / the electron-builder NSIS toolchain cache under `vendor/electron-builder-cache-26.8.1/`, consumed via `ELECTRON_BUILDER_CACHE`) are plain files. Both split sets are raw byte slices rather than archives, forced by GitHub's 100MB single-file limit: the former is reassembled by build-repack.sh step 0, the latter reassembled automatically with a sha256 check by offline-win.cjs at build time.

pip bootstrap pitfall: pip ≥21.2 has self-modification protection — installing pip itself by executing from the wheel path is rejected. The final approach (server.mjs, patch 005):

```js
// 1) pip is a pure-Python package; extracting the wheel into purelib is
//    enough for -m pip to use
runCommand(py, ["-c",
  "import os,sys,sysconfig,zipfile; d=sysconfig.get_paths()['purelib'];" +
  " os.makedirs(d,exist_ok=True); zipfile.ZipFile(sys.argv[1]).extractall(d)",
  pipWheelPath])
// 2) offline-install the build tools and dependencies
runCommand(py, ["-m","pip","install","--no-index",
  "--find-links",wheelsDir, "setuptools","wheel"])
runCommand(py, ["-m","pip","install","--no-index","--no-build-isolation",
  "--find-links",wheelsDir, "-r",requirementsPath])
```

Version pins (Python 3.8 compatible): `Pillow>=11.3.0` → `Pillow>=10.0,<10.5` (`requirements-win.txt`). Offline wheels (`runtime\python-3.8.10\wheels\`, 16 total): pip 24.3.1 (extracted to bootstrap) / setuptools 75.3.0 / wheel 0.42.0 / Pillow 10.4.0 / pywin32 311 / psutil 7.2.2 / mss 9.0.2 / pyautogui 0.9.54 plus the pure-Python dependency chain (pygetwindow / pyrect / pyscreeze / pytweening / mouseinfo / pymsgbox) / pyperclip 1.11.0 / screeninfo 0.8.1. Binary wheels are all cp38 win_amd64 / cp37-abi3.
