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
├── src/compat/               Bun runtime-API shims (node:child_process based)
│   ├── bunSpawn.ts            Bun.spawn subset: hybrid ReadableStream w/
│   │                          .text()/.json(), exited promise, onExit
│   ├── bunBundle.ts bunFile.ts bunServe.ts bunSqlite.ts
├── desktop/
│   └── offline-win.cjs       electron-builder offline config (Stage A)
└── desktop-electron/         canonical compiled main-process artifacts
    └── main.cjs ...          incl. the node-runtime fallback layer
```

## Build the CLI bundle

```bash
# upstream repo root, after applying patches 001-004
node port-src/scripts/node-port/build.mjs     # -> dist/*.mjs
# then apply patches/cli/004-server-mjs-computer-use-offline.patch
# (or run runtime/node-fallback/patch-computer-use.py which applies the
#  same P1/P2 hunks idempotently)
```

Node target is 22 (`--experimental-sqlite` flag is auto-probed by
main.cjs's `sqliteFlagArgsForVersion` for 22.5–22.12).
