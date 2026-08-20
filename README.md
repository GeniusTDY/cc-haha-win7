# cc-haha-win7

Restored source of the **Windows 7 offline edition** of
[NanmiCoder/cc-haha](https://github.com/NanmiCoder/cc-haha) v0.5.4 —
the compatibility work behind the original
`Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe` release (now renamed
`Claude-Code-Haha-0.5.4-win7-x64-setup.exe`; the Release ships only the
newest rebuild, the **2026-08-20 v3** "most complete" installer).

The original fix sources were lost; this repo reconstructs them from the
shipped installers + the development log, and re-verifies the result on an
offline QEMU Win7 SP1 x64 guest (77/77 E2E checks). See
[docs/VERIFICATION-REPORT.md](docs/VERIFICATION-REPORT.md) §15.

## What the Win7 edition changes

| layer | original | Win7 offline edition |
|---|---|---|
| Electron / Chromium | 42 (Win10+) | **22.3.27 / Chromium 108** (last Win7-capable) |
| Renderer CSS | Tailwind v4 native (oklch, nesting) | lightningcss `chrome 108` downgrade + runtime shim in `index.html` (`color-mix()`, `lab()/oklch()`, `scrollbar-color`, Set-methods polyfill) |
| Desktop backend | compiled Bun sidecar `.exe` | sidecar removed → **bundled Node 22.17.0** runs `dist/server.mjs` (Bun→Node port, `port-src/`) |
| Desktop terminal | ConPTY (Win10 1809+) | **winpty backend forced** (`useConpty:false` via in-asar `main.cjs` surgery, `repack/patch-app-asar.mjs`) + pipe fallback if node-pty is unloadable |
| Bash tool shell | requires Git for Windows | auto-resolves user Git Bash → **bundled PortableGit 2.45.2** (`resources/runtime/git`) → PATH |
| Computer Use | system Python + pip install | **bundled Python 3.8.10 embeddable + 16 offline wheels**, venv-less fallback, runtime deps self-heal |
| Search (rg) | shipped rg.exe (Win10+) | ripgrep 14.1.0 (Win7-safe imports) |
| Win8+ API gaps | — | **VxKex** compatibility layer for node.exe / python.exe / rg.exe (auto-registered by the installer) |
| Updates | electron-updater | lazy-loaded, no-op fallback (offline) |

## Repo layout

```
patches/       source deltas against upstream cc-haha v0.5.4 (d52bbec7)
  desktop/       001 electron 22 pin · 002 index.html CSS shim
  cli/           004 server.mjs Computer-Use offline + self-heal
  electron-builder/ 005 NsisTarget without wine
port-src/      Bun→Node port sources (compat layer, build scripts,
               offline electron-builder config, canonical desktop .cjs)
runtime/       offline runtime payloads — node/, python/, vxkex/,
               git/ (PortableGit 2.45.2), kb-patches/ and
               node-pty-win32-x64/ are all committed in git (~545 MB);
               Release carries installers only
vendor/        Stage A build dependency committed in git: the official
               electron-v22.3.27-win32-x64.zip (97 MB, matches upstream
               SHASUMS256.txt) — offline-win.cjs auto-resolves it, so
               Stage A needs zero Electron downloads
               (verify: cd vendor && sha256sum -c sha256sums.txt)
repack/        Stage B: build-repack.sh + installer.nsi → win7-x64-setup.exe;
               patch-app-asar.mjs surgically adds the winpty forcing to the
               shipped main.cjs inside app.asar (asar-tool/ vendors
               @electron/asar); asar surgery preserves the node-runtime
               fallback layer byte-exactly
docs/          Technical-Support.md (technical porting solution) ·
               VERIFICATION-REPORT.md (L1–L4 + 15 review rounds + QEMU E2E) ·
               BUILD-AND-VERIFY.md · WIN7-DEPLOY.md
```

## Quick start

1. `git clone` this repo — node/, python/, vxkex/, git/ (PortableGit
   2.45.2, Bash tool shell) and kb-patches/ payloads are already inside
   `runtime/` (verify with `cd runtime && sha256sum -c sha256sums.txt`),
   and the Electron 22.3.27 win-x64 dist zip for Stage A is inside
   `vendor/electron/` (verify with `cd vendor && sha256sum -c
   sha256sums.txt`) — no downloads from the Release needed at all.
2. Build: [docs/BUILD-AND-VERIFY.md](docs/BUILD-AND-VERIFY.md) —
   Stage A (upstream + patches → Setup.exe), Stage B (`repack/build-repack.sh`
   → win7-x64-setup.exe).
3. Install on Win7 SP1 x64 (offline OK; on a clean system install the two
   KB patches from `runtime/kb-patches/` first — installer bundles VxKex),
   or grab the ready-made **v3** installer
   (`Claude-Code-Haha-0.5.4-win7-x64-setup.exe`, 2026-08-20) from Releases.

## Reproducibility

Rebuilding from the Stage A Setup.exe + runtime tree reproduces the released
Offline.exe (v1 sha256 `3221d5e9…a025b40`). Later rebuilds add cumulative
fixes — v2 `971df9d5…e766ae1` (CU python-path fallback), the 2026-08-19 v2
rebuild `03286eaf…a716be` (Win32 CLI spawn + provider-env fix), and the
**2026-08-20 v3 rebuild** (current Release asset, sha256
`c22f57eb…88eacbc`): full-TTY desktop terminal (winpty forced), Bash tool
shell auto-resolution with bundled PortableGit, Computer Use fully offline,
and a guaranteed node-pty payload. All passed the offline QEMU Win7 E2E
(§15.4); the v3 delta is verified structurally (see
docs/BUILD-AND-VERIFY.md "Verify the v3 build").

The Release carries only the newest build; older assets are reproducible
from this repo.
