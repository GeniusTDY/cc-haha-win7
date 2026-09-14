# runtime/ — offline runtime payloads (Win7)

**English** | [简体中文](README.zh-CN.md)

Everything the offline installer overlays into `resources/runtime/`.
**node-v22.17.0/, python-3.8.10/ and vxkex-1.2.1.2229/ are committed in git** (128 MB total,
extracted from the verified released Offline.exe — the fixed
`python38._pth` and all 16 wheels are already applied), so after
`git clone` you can run `repack/build-repack.sh` immediately:

```bash
NODE_FALLBACK_DIR=../runtime/node-fallback RUNTIME_DIR=../runtime \
  ./build-repack.sh
```

`git-2.45.2/` (PortableGit 2.45.2) and `kb-patches/` (KB2533623 +
KB2670838 MSU) are committed too — so a clean offline Win7 needs
zero downloads beyond a clone of this repo and the one installer:
install the two KB patches (git-tracked, not shipped inside the
installer), run the installer, done.

## Layout shipped inside the installer

```
resources/runtime/
├── node-v22.17.0/   Node.js 22.17.0 win-x64 (node.exe ...)     [in git, 82MB]
├── python-3.8.10/   Python 3.8.10 embeddable win amd64          [in git, 33MB]
│   ├── python38._pth    fixed: "python38.zip / . / Lib\site-packages / import site"
│   │                    (stock embeddable leaves site-packages disabled)
│   └── wheels/          16 offline wheels: the pyautogui stack
│                        (mouseinfo mss pillow psutil pyautogui
│                        pygetwindow pymsgbox pyperclip pyrect
│                        pyscreeze pytweening pywin32 screeninfo)
│                        + pip-24.3.1 / setuptools-75.3.0 / wheel-0.42.0
├── vxkex-1.2.1.2229/ KexSetup_Release_1_2_1_2229.exe (VxKex 1.2.1) [in git, 13MB]
├── git-2.45.2/      PortableGit 2.45.2 extraction — Bash tool shell on a
│                    clean offline Win7 (2.46+ dropped Win7) [in git, 404MB]
├── kb-patches/      Windows6.1-KB2533623-x64.msu + KB2670838-x64.msu
│                    (install both on a clean Win7 SP1 BEFORE VxKex setup;
│                    SHA1 matches Microsoft's official values — §2 of
│                    Technical-Support.md in the repo root)
│                    [git only, 14MB — NOT shipped inside the installer;
│                     build-repack.sh never copies it into resources/runtime/]
├── setup-vxkex.bat  manual KexCfg registration (installer does it
│                    automatically; this is the fallback)
├── requirements-win.txt / requirements.txt / win_helper.py
└── (node-fallback bundle goes to resources/app.asar.unpacked/dist/,
     see node-fallback/ and patches/cli/004)
```

## VxKex registration matrix (verified on Win7 SP1 x64)

| executable | treatment | why |
|---|---|---|
| `runtime/node-v22.17.0/node.exe` | KexCfg ENABLE, **WINVERSPOOF:NONE** | Node 22 needs Win8+ APIs; version spoof must stay OFF or V8's ThreadIsolation path crashes on Win7 (see Technical-Support.md §3) |
| `runtime/python-3.8.10/python.exe` | ENABLE, WINVERSPOOF:NONE | UCRT api-set shim |
| `app.asar.unpacked/src-tauri/binaries/rg.exe` | ENABLE, WINVERSPOOF:NONE | statically imports `WaitOnAddress` (api-ms-win-core-synch-l1-2-0, Win8+); without it POST /api/search hangs forever behind a modal DLL error |
| `Claude Code Haha.exe` | none | Electron 22 runs natively on Win7 |

## In-git payload provenance & checksums

The committed node-v22.17.0 / python-3.8.10 / vxkex-1.2.1.2229 trees
were extracted from the released Win7 offline installer (the v0.5.4
build, sha256 `3221d5e9…a025b40`). They are version-independent runtime
payloads carried unchanged into the v0.6.2 installer, so the fixed
`python38._pth` and the 16 wheels are already applied — no post-clone
fixup needed.

| payload | key file | sha256 |
|---|---|---|
| `node-v22.17.0/` | `node-v22.17.0/node.exe` | `39d45b59…20f3636` |
| `python-3.8.10/` | `python-3.8.10/python.exe` | `5275c42f…b074581` |
| `vxkex-1.2.1.2229/` | `vxkex-1.2.1.2229/KexSetup_Release_1_2_1_2229.exe` | `7db81065…6c8708cd` |
| `git-2.45.2/` | `git-2.45.2/bin/bash.exe` | see `sha256sums.txt` |
| `kb-patches/` | both `.msu` files | see `sha256sums.txt` |

Verify with `cd runtime && sha256sum -c sha256sums.txt`.

## git-2.45.2/ provenance (PortableGit 2.45.2)

Pristine extraction of the upstream self-extracting archive
`PortableGit-2.45.2-64-bit.7z.exe`
(sha256 `851a1507…c27ccdd`, from
<https://github.com/git-for-windows/git/releases/tag/v2.45.2.windows.1>)
— 2.45.2 is the last Git line that still runs on Win7.

Notes:

- The Bash tool shell chain (patch 004) probes `runtime/git-2.45.2/bin/bash.exe`
  — present at the extraction root, so the tree works as committed.
- Upstream's `post-install.bat` step is *not* pre-applied: its one
  critical effect (hard-linking `mingw64/bin/*.dll` into
  `mingw64/libexec/git-core/`) is **already satisfied inside the
  archive**; the rest (`/etc/mtab`, copying Windows `hosts` etc.) only
  affects `df`/`mount` cosmetics. Running
  `runtime\git-2.45.2\post-install.bat` once on the target machine is an
  optional way to get the full upstream treatment (it is idempotent
  and deletes itself when done).

## Remaining attachments (GitHub Release — installer + build inputs)

All runtime payloads are committed in git; the Release carries the
ready-made installer (the newest build), plus the two large build inputs
(the Stage A setup and the intranet `app.asar`) that `build-repack.sh`
fetches automatically when they are absent:

| attachment | purpose | sha256 |
|---|---|---|
| `Claude-Code-Haha-0.6.2-win7-x64-setup.exe` | **2026-09-14 v0.6.2 Win7 rebuild (265,776,976 bytes)** — the upstream v0.6.2 sources re-adapted to the Win7 port: patch series 008/009/010/013 + the compiled port overlay rebuilt for v0.6.2, the intranet layer (013/014 gates + final-series renderer) re-cut, the node-fallback bundle re-derived (server/CLI/recovery + the full 44-module `adapters-chunks/` import closure for the eight v0.6.2 adapter flags), the versioned `resources/runtime/` payload (node 22.17.0 / Python 3.8.10 / VxKex 1.2.1.2229 / PortableGit 2.45.2 + node-pty) overlaid, and the pinned ripgrep 15.1.0 `rg.exe` re-staged under `app.asar.unpacked/src-tauri/binaries/` (the broken compiled sidecar stays removed so `hasCompiledSidecar()` drives the node fallback). `app-update.yml` keeps pointing at this repo. Paired with `latest.yml` for electron-updater. Supersedes the 0.5.4 build (`c6727145…c8946c1`), whose node/python/vxkex trees are the version-independent payloads committed in this dir | `1355635a…2965deed` |
| `build-input-StageA-Setup.exe` | Stage A input of `build-repack.sh` step 0/9 (132,451,540 bytes) — kept out of git to avoid repo bloat; fetched automatically when `repack/setup-exe/*.part` are absent | `2e2e38bd…e654212` |
| `build-input-intranet-layer-app.asar` | intranet-layer `app.asar` overlay (189,305,159 bytes) — kept out of git to avoid repo bloat; fetched automatically when `repack/intranet-layer/app.asar*` are absent | `1e7944aa…66aae35e` |

## node-pty-1.1.0-win32-x64/ (in git, ~1 MB)

Vendored node-pty 1.1.0 runtime subset (lib/ JS + `prebuilds/win32-x64/`
N-API `pty.node` + `winpty-agent.exe` + `winpty.dll`; conpty bits omitted —
the app forces the winpty backend on Win7/8 via patch 003). The repack
script (step 7/9) overlays it onto
`resources/app.asar.unpacked/node_modules/node-pty` whenever the Stage A
payload is missing or pruned that module, so the desktop terminal keeps
full TTY emulation (winpty works natively on Win7 — no VxKex registration
needed for the agent).

## ripgrep-15.1.0-win32-x64/ (in git, ~4 MB)

Vendored ripgrep 15.1.0 win-x64 binary (`rg.exe`) plus its
`ripgrep-licenses/` (COPYING / LICENSE-MIT / UNLICENSE) and
`ripgrep-manifest.json` — exactly the payload upstream's
`desktop/scripts/prepare-ripgrep.ts` stages into `src-tauri/binaries/`.
The v0.6.2 Stage A payload ships no `src-tauri/` tree at all (only
`dist/`, `electron-dist/` and `node_modules/` under
`app.asar.unpacked/`), so `repack/build-repack.sh` step 5/9 creates
`resources/app.asar.unpacked/src-tauri/binaries/`, drops the broken
compiled sidecar and copies this payload in. `rg.exe` must live there
for two reasons: `installer.nsi` registers it with VxKex
(`WaitOnAddress` shim — see the matrix above) and `main-guest.cjs`
resolves it via `withBundledRipgrepPath()`. The sidecar stays absent on
purpose — `hasCompiledSidecar()` then drives the built-in node
fallback.

Binary provenance: `rg.exe` is byte-identical to the copy shipped in
the v0.5.4 release (re-extracted offline from
`Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe`), sha256
`decdd4992f3f1b9a5ef9898f1b40ab16886d579d6516b4efd3d5eaa19364e408`
(4,266,496 bytes); the pinned upstream archive
`ripgrep-15.1.0-x86_64-pc-windows-msvc.zip` has sha256
`124510b94b6baa3380d051fdf4650eaa80a302c876d611e9dba0b2e18d87493a`.

## node-fallback/

The Node-port server/CLI bundle deployed to
`resources/app.asar.unpacked/dist/` (server.mjs + adapters.mjs +
cli.mjs + recovery-cli.mjs + adapters-chunks/). The files committed
here are already fully patched; the repack build script deploys them
as-is. `adapters-chunks/` must keep its full 44-module import closure —
8 adapter chunks (feishu / whatsapp / telegram / dingtalk / qq / wecom /
wechat / slack) + 22 shared `chunk-*.mjs` (incl. the `chunk-57T55QIK.mjs`
macro-init chunk that `adapters.mjs` imports) + 14 parser/lib chunks —
the adapter chunks import the shared ones statically, so dropping any of
them breaks every `--feishu/--telegram/--wechat/--dingtalk/--whatsapp/
--wecom/--qq/--slack` load with ERR_MODULE_NOT_FOUND. The feishu/dingtalk
adapter chunks are stored
without the third-party SDKs' Chinese JSDoc comments (stripped via
`port-src/scripts/node-port/strip-cjk-comments.mjs`, which also runs
at build time; code verified byte-equivalent through esbuild
normalization). `remove-sidecar.bat` is the historical pre-repack cleanup
(superseded by build-repack.sh step 5), while `patch-computer-use.py`
remains the active identifier-adaptive patcher (P1–P10, incl. the
cli.mjs VT-input gate) used to re-derive these bundles from a fresh
Stage A build.
