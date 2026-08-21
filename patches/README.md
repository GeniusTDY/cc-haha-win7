# patches/ — Win7 port deltas vs upstream NanmiCoder/cc-haha v0.5.4

Base: upstream tag/commit `d52bbec7` ("chore(release): prepare v0.5.4").
Apply order = patch number. All paths are relative to the upstream repo
root (`desktop/` is the Electron app subproject).

| # | file | applies to | summary |
|---|---|---|---|
| 1 | `desktop/001-package-json-electron22.patch` | `desktop/package.json` | pin Electron 22.3.27 (last Win7 major, Chromium 108/Node 16.17) + electron-builder 26.8.1 |
| 2 | `desktop/002-index-html-css-shim.patch` | `desktop/index.html` | Chromium 108 CSS shim: color-mix()/lab()/oklch()/lch()/oklab() evaluation + scrollbar fallbacks, re-runs on theme change; plus Set seven-methods polyfill (union/intersection/difference/symmetricDifference/isSubsetOf/isSupersetOf/isDisjointFrom — Chrome 122+, needed by cytoscape/mermaid) |
| 3 | `desktop/003-terminal-winpty-fallback.patch` | `desktop/electron/services/terminal.ts` | force node-pty's winpty backend on Win7/8 (`useConpty:false`) + line-based pipe fallback when node-pty cannot load/spawn |
| 4 | `cli/004-shell-win32-bash-resolution.patch` | `src/utils/Shell.ts`, `src/utils/windowsPaths.ts` | Windows shell chain for the Bash tool: user Git → bundled `runtime/git-2.45.2` PortableGit (`CC_HAHA_BASH_EXE`/`CC_HAHA_RUNTIME_DIR`/relative probes) → PATH bash |
| 5 | `cli/005-server-mjs-computer-use-offline.patch` | `dist/server.mjs` (node-port bundle) | bundled-Python detection, offline wheel install (--no-index), venv fallback to bundled python.exe. **Historical**: diff against the 2026-08-18 build; the 844024a9 rebuild changed line offsets so `git apply` fails on current build.mjs output — fresh rebuilds use `runtime/node-fallback/patch-computer-use.py` (identifier-adaptive, full P1–P10 set incl. the win32 CLI spawn chain and the cli.mjs VT-input gate) |
| 6 | `electron-builder/006-nsis-target-nowine.patch` | `node_modules/app-builder-lib/.../NsisTarget.js` | wine-free uninstaller extraction on Linux (UninstallerReader for all non-Windows hosts) |

The Electron main-process node-runtime fallback layer is not a numbered
patch: it ships as the compiled artifacts `port-src/desktop-electron/*.cjs`
(byte-identical to the shipped `app.asar`; `main.cjs` carries BOTH the
fallback layer AND the winpty forcing — the same hunk patch 003 adds to
the TS source). In a Stage A source rebuild they must be **overlaid onto
`desktop/electron-dist/` before electron-builder packs the asar** (see
the `cp ../port-src/desktop-electron/*.cjs electron-dist/` step in the
root README's Stage A walkthrough) — the upstream TS sources do not
contain the fallback layer, and a rebuild without the overlay produces
an app.asar whose server cannot start once Stage B removes the broken
sidecar. Rebuilding main.cjs from TS requires re-adding the fallback
layer by hand; overlaying the committed artifact is the reproducible
path. (Patch 003 ports that artifact's pipe fallback into the TS source,
so rebuilds from source keep that half; the node-runtime fallback half
exists only in the compiled artifact.)

## Apply

```bash
# Layout as in the root README's Stage A walkthrough: the upstream clone
# and this repo (cc-haha-win7) sit side by side, so from inside the clone
# everything this repo ships is reachable as ../cc-haha-win7/.
git clone https://github.com/NanmiCoder/cc-haha && cd cc-haha
git checkout d52bbec7
git apply ../cc-haha-win7/patches/desktop/001-package-json-electron22.patch
git apply ../cc-haha-win7/patches/desktop/002-index-html-css-shim.patch
git apply ../cc-haha-win7/patches/desktop/003-terminal-winpty-fallback.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch
# after building the node-port bundle (dist/server.mjs):
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs
#   (patch 005 is the historical 2026-08-18 diff — see its STATUS NOTE;
#    the adaptive script applies the same CU set + the win32 spawn chain
#    and also restores the VT-input gate in the sibling dist/cli.mjs)
# after `npm install` in desktop/ (any reinstall overwrites node_modules):
git apply ../cc-haha-win7/patches/electron-builder/006-nsis-target-nowine.patch
```

## Verify the node_modules patch survived a reinstall

```bash
grep -q 'process.platform !== "win32"' \
  desktop/node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js \
  || echo "patch 006 lost — re-apply"
```
