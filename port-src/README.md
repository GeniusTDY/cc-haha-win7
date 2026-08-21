# port-src/ — new sources added by the Win7 port

Files that do not exist upstream; they either build new artifacts or are
the canonical compiled artifacts the installer ships.

```
port-src/
├── scripts/node-port/        Bun-free CLI/server build pipeline (esbuild)
│   ├── build.mjs              bundles src/entrypoints/cli.tsx + recovery CLI
│   │                          -> dist/{server,cli,recovery-cli,adapters}.mjs
│   │                          Bun APIs aliased to src/compat shims
│   ├── build-electron.mjs     desktop electron build helper (Stage A)
│   ├── build-preview-agent.mjs
│   └── cli-entry-wrapper.mjs
├── src/
│   ├── compat/               Bun runtime-API shims (node:child_process based)
│   │   ├── bunSpawn.ts        Bun.spawn subset: hybrid ReadableStream w/
│   │   │                      .text()/.json(), exited promise, onExit
│   │   └── bunBundle.ts bunFile.ts bunServe.ts bunSqlite.ts
│   └── entrypoints/
│       └── serverNode.ts     Node server entry wrapper (import.meta.main
│                              is undefined under Node — this file is the
│                              explicit self-start entry for server.mjs)
├── adapters/
│   └── index.ts              IM-adapter dispatcher overlay (code-splitting
│                              entry; copied to <root>/adapters/index.ts by
│                              build.mjs when adapters deps are installed)
├── desktop/
│   └── offline-win.cjs       electron-builder offline config (Stage A)
└── desktop-electron/         canonical compiled main-process artifacts
    └── main.cjs ...          incl. the node-runtime fallback layer
```

## Build the CLI bundle

```bash
# upstream repo root, after applying patches 001-004
# (prerequisites beyond the patches: `npm install` for the 67 upstream root
#  dependencies + the five Bun call-site rewrites — see patches/README
#  "Source-level overlay gap")
node port-src/scripts/node-port/build.mjs     # -> dist/*.mjs
# then run the identifier-adaptive post-build patcher (CU offline +
# win32 CLI spawn chain + cli.mjs VT-input gate — patch 005 is the
# historical 08-18 diff and no longer applies to fresh builds).
# Layout as in the root README's Stage A: cc-haha and cc-haha-win7 are
# siblings, so from the upstream repo root the patcher lives at
# ../cc-haha-win7/runtime/node-fallback/:
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs
```

Node target is 22 (`--experimental-sqlite` flag is auto-probed by
main.cjs's `sqliteFlagArgsForVersion` for 22.5–22.12 and 23.0–23.3).
