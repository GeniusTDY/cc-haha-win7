# cc-haha-win7

**English** | [简体中文](README.zh-CN.md)

The **Windows 7 SP1 x64 offline port** of [NanmiCoder/cc-haha](https://github.com/NanmiCoder/cc-haha) v0.5.4.

Upstream is built on Electron 42 and a Bun sidecar architecture — neither supports Win7. This project ports it to Electron 22.3.27 (the last release that supports Win7) plus a bundled Node runtime, switches the terminal to winpty (Win7 has no ConPTY), and combines the VxKex compatibility layer with bundled Python and PortableGit payloads, so **installation and daily use stay fully offline**.

| Layer | Upstream | Win7 port |
|---|---|---|
| Desktop shell | Electron 42 (Win10+) | Electron 22.3.27 (Chromium 108) |
| Backend | Bun-compiled sidecar | Bundled node.exe running `dist/server.mjs` |
| Terminal | ConPTY | winpty (full TTY) |
| Computer Use | System Python + pip | Bundled Python 3.8.10 + 16 offline wheels |
| Win8+ API gaps | — | VxKex compatibility layer (node / python / rg registered automatically) |

> For the porting rationale see [Technical-Support.md](Technical-Support.md)

## Repository layout

| Directory | Responsibility |
|---|---|
| `patches/` | 6 patches against upstream v0.5.4 (Electron 22 pin / CSS shim / winpty / Bash chain / CU offline / wine-free NSIS) |
| `port-src/` | New sources added by the port: Bun API compat layer, esbuild build pipeline, compiled main.cjs artifacts |
| `repack/` | Stage B fully-offline installer repack scripts |
| `runtime/` | Machine payloads (~620MB): Node / Python / PortableGit / VxKex / KB patches / offline bundle |
| `vendor/` | Build-time dependencies (~1.2GB): Electron distribution / NSIS cache / desktop dependency tree |

`patches/`, `port-src/` and `runtime/` each carry a dedicated README.

## User guide

### Environment variables

Pick the configuration entry point that matches how you run the app, and avoid storing the same credential in multiple places:

- **Desktop**: configure under Settings → Providers; the app manages authentication and model mapping centrally;
- **CLI**: the `env` field of `~/.claude/settings.json`, or shell environment variables.

#### Model providers (Anthropic-compatible endpoints)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Sent via the `x-api-key` header; mutually exclusive with the auth token |
| `ANTHROPIC_AUTH_TOKEN` | Sent via the `Authorization: Bearer` header; mutually exclusive with the API key |
| `ANTHROPIC_BASE_URL` | Base URL of the compatible endpoint |
| `ANTHROPIC_MODEL` | Default model for the current session |
| `ANTHROPIC_DEFAULT_{HAIKU,SONNET,OPUS}_MODEL` | Per-slot model overrides |
| `API_TIMEOUT_MS` | Request timeout in milliseconds, default `600000` |

#### Azure OpenAI

Enable with `CLAUDE_CODE_USE_AZURE_OPENAI=1` plus `AZURE_OPENAI_BASE_URL` and `AZURE_OPENAI_API_KEY`; optional: `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_CODEX_DEPLOYMENT`.

#### Local operation & privacy

| Variable | Description |
|---|---|
| `CLAUDE_CONFIG_DIR` | Custom config directory (default `~/.claude`) for portable mode or isolated testing |
| `CLAUDE_CODE_LOCAL_RECOVERY` | Set to `1` to enable the stripped-down Recovery CLI |
| `CLAUDE_CODE_SHELL_PREFIX` | Shell prefix for the Bash tool, e.g. `wsl -e bash -lc` |
| `DISABLE_TELEMETRY` | Set to `1` to disable telemetry |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Set to `1` to disable non-essential network requests |

#### Win7-port specific

| Variable | Description |
|---|---|
| `CC_HAHA_BASH_EXE` | Explicit bash.exe path; by default resolved as user Git → bundled PortableGit → PATH |
| `CC_HAHA_RUNTIME_DIR` | Explicit runtime payload directory; defaults to `resources/runtime` under the install dir |

### Three run modes

| Mode | How to start | Use case |
|---|---|---|
| Interactive session (default) | Launch directly | Everyday terminal chat, streaming output and tool calls |
| `--print` headless mode | `cli.mjs -p "task description"` | Script and CI automation; prints the result and exits; supports `--output-format json`, `--max-budget-usd` |
| Recovery mode | `CLAUDE_CODE_LOCAL_RECOVERY=1` or `-r [id]` | Stripped-down fallback when the main CLI misbehaves; `-r` resumes a session, `--fork-session` resumes and branches it |

Every desktop session is driven by the CLI process above (running on the bundled node.exe) — no manual start needed. The Win7 install layout does not provide a `claude-haha` command; to invoke the CLI manually, run the entry script directly with the bundled Node:

```bat
"C:\cc-haha\resources\runtime\node-v22.17.0\node.exe" "C:\cc-haha\resources\app.asar.unpacked\dist\cli.mjs" -p "task description"
```

### Deployment & packaging

The build has two stages and runs on a Linux or Win10/11 build machine; the artifact targets Win7 SP1 x64:

- **Stage A**: upstream sources + patches → electron-builder → `win-x64.exe` (optional; when skipped, Stage B automatically uses the committed ready-made binary);
- **Stage B**: previous output + offline payloads → fully-offline installer `win7-x64-setup.exe`.

Commands are given in Linux form; `[Win]` comments mark differences on a Windows build machine — everything else is identical on both platforms.

#### Step 0 · Environment setup

```bash
sudo apt-get install -y nodejs git p7zip-full nsis
# [Win] First run git config --global core.autocrlf false (prevents line-ending
#       rewrites from breaking git apply)
#       Instead install Git for Windows / Node.js>=18 / 7-Zip / NSIS>=3.08
#       Then run every command below inside Git Bash

git clone https://github.com/GeniusTDY/cc-haha-win7.git
cd cc-haha-win7
```

#### Stage A · Build win-x64.exe from source

```bash
cd ..
git clone https://github.com/NanmiCoder/cc-haha.git
cd cc-haha
git checkout d52bbec7

# The upstream root's own 67 dependencies (axios / lodash-es / react …) are
# not committed — this is Stage A's only network access point (esbuild and
# the desktop dependency tree are both vendored):
npm install

git apply ../cc-haha-win7/patches/desktop/001-package-json-electron22.patch
git apply ../cc-haha-win7/patches/desktop/002-index-html-css-shim.patch
git apply ../cc-haha-win7/patches/desktop/003-terminal-winpty-fallback.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch

cp -r ../cc-haha-win7/port-src ./

# The five Bun call-site rewrites are not carried as patches and must be
# applied by hand (see patches/README "Source-level overlay gap"):
#   src/server/index.ts  Bun.serve → nodeServe,
#   src/server/api/{sessions,computer-use}.ts  Bun.spawn → nodeBunSpawn,
#   src/server/staticH5.ts and src/server/api/previewFs.ts  Bun.file →
#   nodeBunFile (all switched to import the port-src/src/compat shims).
# Without this step the build still succeeds, but server.mjs crashes at
# runtime under Node (Bun is not defined).

node port-src/scripts/node-port/build.mjs

# CU-offline + Win32 CLI spawn chain + cli.mjs VT-input gate patcher
# (identifier-adaptive, reproduces the shipped artifacts; patch 005 is the
# archived diff of the 2026-08-18 build — git apply fails on fresh output):
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs

cd desktop

# Main-process artifact overlay (critical): the upstream TS sources lack the
# node-runtime fallback layer and the winpty forcing — both exist only in
# the compiled artifacts — so electron-dist/ must be overwritten with the
# committed originals, otherwise the packed app.asar misses the fallback
# layer and the server cannot start once Stage B removes the sidecar
mkdir -p electron-dist
cp ../port-src/desktop-electron/*.cjs electron-dist/

bash ../../cc-haha-win7/vendor/desktop-node-modules-0.5.4/restore.sh

# Wine-free NSIS patch (must be re-applied after restore.sh reinstalls
# node_modules; required on Linux build machines):
git apply ../../cc-haha-win7/patches/electron-builder/006-nsis-target-nowine.patch

export ELECTRON_BUILDER_CACHE="$PWD/../../cc-haha-win7/vendor/electron-builder-cache-26.8.1"

npx electron-builder --config ../port-src/desktop/offline-win.cjs --win --publish never
```

Output: `build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe` (~122 MB)

#### Stage B · Repack into the offline installer

```bash
cd ../../cc-haha-win7/repack

NODE_FALLBACK_DIR=../runtime/node-fallback \
RUNTIME_DIR=../runtime \
  ./build-repack.sh
```

Output: `Claude-Code-Haha-0.5.4-win7-x64-setup.exe` — burn it or copy it to a USB stick and install directly on an offline Win7 SP1 x64 machine.

To feed a Stage A artifact as input (note: Stage A output is named `win-x64.exe`, unlike Stage B's default seed `Win7-x64-Setup.exe`, so pass it explicitly):

```bash
./build-repack.sh ../../cc-haha/desktop/build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe
```

#### Publishing a new version (auto-update distribution)

```bash
node make-latest-yml.mjs Claude-Code-Haha-0.5.4-win7-x64-setup.exe 0.5.4
```

Attach the generated `latest.yml` together with the new setup.exe to this repo's latest non-prerelease Release; when the version number exceeds the installed one, existing users get an update prompt.

---

Stage B needs zero network access: esbuild, the desktop dependency tree (replacing `npm install` in desktop/), the Electron distribution, the NSIS toolchain cache and all runtime payloads are committed as plain files — after cloning, `build-repack.sh` runs directly. Stage A's only network access point when rebuilding from source is the upstream root's own 67 dependencies (see patches/README "Source-level overlay gap").
