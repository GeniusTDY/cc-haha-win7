# runtime/ — offline runtime payloads (Win7)

Everything the offline installer overlays into `resources/runtime/`.
**node/, python/ and vxkex/ are committed in git** (128 MB total,
extracted from the verified released Offline.exe — the fixed
`python38._pth` and all 16 wheels are already applied), so after
`git clone` you can run `repack/build-repack.sh` immediately:

```bash
NODE_FALLBACK_DIR=../runtime/node-fallback RUNTIME_DIR=../runtime \
  ./build-repack.sh
```

`git/` (PortableGit 2.45.2) and `kb-patches/` (KB2533623 +
KB2670838 MSU) are committed too — so a clean offline Win7 needs
zero downloads from this repo: install the two KB patches, run the
installer, done.

## Layout shipped inside the installer

```
resources/runtime/
├── node/            Node.js 22.17.0 win-x64 (node.exe ...)     [in git, 82MB]
├── python/          Python 3.8.10 embeddable win amd64          [in git, 33MB]
│   ├── python38._pth    fixed: "python38.zip / . / Lib\site-packages / import site"
│   │                    (stock embeddable leaves site-packages disabled)
│   └── wheels/          16 offline wheels: pyautogui stack
│                        (mouseinfo/pyautogui/pygetwindow/pyrect/
│                        pyscreeze/pytweening as .whl) +
│                        pip-24.3.1 / setuptools-75.3.0 / wheel-0.42.0
├── vxkex/           KexSetup_Release_1_2_1_2229.exe (VxKex 1.2.1) [in git, 13MB]
├── git/             PortableGit 2.45.2 extraction — Bash tool shell on a
│                    clean offline Win7 (2.46+ dropped Win7) [in git, 404MB]
├── kb-patches/      Windows6.1-KB2533623-x64.msu + KB2670838-x64.msu
│                    (install both on a clean Win7 SP1 BEFORE VxKex setup;
│                    SHA1 matches Microsoft's official values — §2 of
│                    docs/Technical-Support.md) [in git, 14MB]
├── setup-vxkex.bat  manual KexCfg registration (installer does it
│                    automatically; this is the fallback)
├── requirements-win.txt / requirements.txt / win_helper.py
└── (node-fallback bundle goes to resources/app.asar.unpacked/dist/,
     see node-fallback/ and patches/cli/004)
```

## VxKex registration matrix (verified on Win7 SP1 x64)

| executable | treatment | why |
|---|---|---|
| `runtime/node/node.exe` | KexCfg ENABLE, **WINVERSPOOF:NONE** | Node 22 needs Win8+ APIs; version spoof must stay OFF or the sidecar handshake mis-detects the OS |
| `runtime/python/python.exe` | ENABLE, WINVERSPOOF:NONE | UCRT api-set shim |
| `app.asar.unpacked/src-tauri/binaries/rg.exe` | ENABLE, WINVERSPOOF:NONE | statically imports `WaitOnAddress` (api-ms-win-core-synch-l1-2-0, Win8+); without it POST /api/search hangs forever behind a modal DLL error |
| `Claude Code Haha.exe` | none | Electron 22 runs natively on Win7 |

## In-git payload provenance & checksums

The committed node/python/vxkex trees were extracted from the released
`Claude-Code-Haha-0.5.4-win7-x64-setup.exe` (the build that passed
the 77-check QEMU Win7 E2E suite), so the fixed `python38._pth` and
the 16 wheels are already applied — no post-clone fixup needed.

| payload | key file | sha256 |
|---|---|---|
| `node/` | `node/node.exe` | `39d45b59…20f3636` |
| `python/` | `python/python.exe` | `5275c42f…b074581` |
| `vxkex/` | `vxkex/KexSetup_Release_1_2_1_2229.exe` | `7db81065…6c8708cd` |
| `git/` | `git/bin/bash.exe` | see `sha256sums.txt` |
| `kb-patches/` | both `.msu` files | see `sha256sums.txt` |

Verify with `cd runtime && sha256sum -c sha256sums.txt`.

## git/ provenance (PortableGit 2.45.2)

Pristine extraction of the upstream self-extracting archive
`PortableGit-2.45.2-64-bit.7z.exe`
(sha256 `851a1507…c27ccdd`, from
<https://github.com/git-for-windows/git/releases/tag/v2.45.2.windows.1>)
— 2.45.2 is the last Git line that still runs on Win7.

Notes:

- The Bash tool shell chain (patch 007) probes `runtime/git/bin/bash.exe`
  — present at the extraction root, so the tree works as committed.
- Upstream's `post-install.bat` step is *not* pre-applied: its one
  critical effect (hard-linking `mingw64/bin/*.dll` into
  `mingw64/libexec/git-core/`) is **already satisfied inside the
  archive**; the rest (`/etc/mtab`, copying Windows `hosts` etc.) only
  affects `df`/`mount` cosmetics. Running
  `runtime\git\post-install.bat` once on the target machine is an
  optional way to get the full upstream treatment (it is idempotent
  and deletes itself when done).

## Remaining attachment (GitHub Release — installer only)

All runtime payloads are committed in git; the Release carries a single
ready-made installer — the newest build:

| attachment | purpose | sha256 |
|---|---|---|
| `Claude-Code-Haha-0.5.4-win7-x64-setup.exe` | **2026-08-20 v3 "most complete" rebuild**: full-TTY winpty terminal + bundled PortableGit Bash shell + fully-offline Computer Use + guaranteed node-pty payload (older v1 / v2 / Stage A Setup.exe assets were removed; asset renamed from `…-Win7-x64-Offline.exe`) | `c22f57eb…88eacbc` |

## node-pty-win32-x64/ (in git, ~1 MB)

Vendored node-pty 1.1.0 runtime subset (lib/ JS + `prebuilds/win32-x64/`
N-API `pty.node` + `winpty-agent.exe` + `winpty.dll`; conpty bits omitted —
the app forces the winpty backend on Win7/8 via patch 006). The repack
script (step 7/9) overlays it onto
`resources/app.asar.unpacked/node_modules/node-pty` whenever the Stage A
payload is missing or pruned that module, so the desktop terminal keeps
full TTY emulation (winpty works natively on Win7 — no VxKex registration
needed for the agent).

## node-fallback/

The Node-port server/CLI bundle deployed to
`resources/app.asar.unpacked/dist/` (server.mjs + adapters.mjs +
cli.mjs + recovery-cli.mjs + adapters-chunks/). `remove-sidecar.bat`
and `patch-computer-use.py` are the historical deployment/patch tools;
the repack build script performs the same steps directly.
