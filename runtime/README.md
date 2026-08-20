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

Only the optional payloads (`git/`, KB patches) remain release
attachments — see "Optional / remaining attachments" below.

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
├── git/             optional PortableGit 2.45.x extraction — Bash tool
│                    shell on a clean offline Win7 (2.46+ dropped Win7)
│                    [optional attachment, ~300MB — too big for git]
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

The committed trees were extracted from the released
`Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe` (the build that passed
the 77-check QEMU Win7 E2E suite), so the fixed `python38._pth` and
the 16 wheels are already applied — no post-clone fixup needed.

| payload | key file | sha256 |
|---|---|---|
| `node/` | `node/node.exe` | `39d45b59…20f3636` |
| `python/` | `python/python.exe` | `5275c42f…b074581` |
| `vxkex/` | `vxkex/KexSetup_Release_1_2_1_2229.exe` | `7db81065…6c8708cd` |

Verify with `cd runtime && sha256sum -c sha256sums.txt`.

## Optional / remaining attachments (GitHub Release)

| attachment | unpack to | sha256 |
|---|---|---|
| `runtime-git-portable-2.45-win64.tar.gz` (optional) | `runtime/git/` (~300MB tree — Bash tool shell; 2.46+ dropped Win7) | see release notes |
| `win7-kb-patches.tar.gz` (KB2533623 + KB2670838 MSU) | anywhere; install both **before** VxKex setup on a clean Win7 | see release notes |
| `Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe` | Stage A input for `repack/build-repack.sh` (skip Stage A path) | see release notes |
| `Claude-Code-Haha-0.5.4-Win7-x64-Offline-v2.exe` | rebuilt all-in-one offline installer (v2) | `971df9d5…e766ae1` |

## node-pty-win32-x64/ (in git, ~1 MB)

Vendored node-pty 1.1.0 runtime subset (lib/ JS + `prebuilds/win32-x64/`
N-API `pty.node` + `winpty-agent.exe` + `winpty.dll`; conpty bits omitted —
the app forces the winpty backend on Win7/8 via patch 006). The repack
script (step 6/8) overlays it onto
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
