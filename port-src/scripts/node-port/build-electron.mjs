#!/usr/bin/env node
/**
 * Node-port desktop shell build: esbuild replacement for the four
 * `bun build` invocations in desktop/package.json's build:electron.
 *
 *   electron/main.ts           -> electron-dist/main.cjs          (external: electron, node-pty)
 *   electron/preload.ts        -> electron-dist/preload.cjs       (external: electron)
 *   electron/pet-preload.ts    -> electron-dist/pet-preload.cjs   (external: electron)
 *   electron/preview-preload.ts-> electron-dist/preview-preload.cjs (external: electron)
 *
 * Usage:  node scripts/node-port/build-electron.mjs   (from repo root or desktop/)
 *
 * Win7 note: the produced main.cjs runs under Electron >= 22 equally well as
 * under the Electron 22 LTS line (the last Win7-capable Chromium). node-pty
 * is kept external so its prebuilds (winpty fallback on Windows builds <
 * 10.0.19041) resolve from node_modules at runtime.
 */

import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const desktopDir = path.join(root, 'desktop')
const outDir = path.join(desktopDir, 'electron-dist')

const bundles = [
  {
    entry: path.join(desktopDir, 'electron', 'main.ts'),
    outfile: path.join(outDir, 'main.cjs'),
    // electron-updater ships in the packaged app's node_modules (optional at
    // dev time), so keep it external alongside electron and node-pty.
    external: ['electron', 'node-pty', 'electron-updater'],
  },
  {
    entry: path.join(desktopDir, 'electron', 'preload.ts'),
    outfile: path.join(outDir, 'preload.cjs'),
    external: ['electron'],
  },
  {
    entry: path.join(desktopDir, 'electron', 'pet-preload.ts'),
    outfile: path.join(outDir, 'pet-preload.cjs'),
    external: ['electron'],
  },
  {
    entry: path.join(desktopDir, 'electron', 'preview-preload.ts'),
    outfile: path.join(outDir, 'preview-preload.cjs'),
    external: ['electron'],
  },
]

for (const cfg of bundles) {
  const rel = path.relative(root, cfg.entry)
  await build({
    entryPoints: [cfg.entry],
    outfile: cfg.outfile,
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    external: cfg.external,
    sourcemap: false,
    // electron-updater and other optional native/optional deps stay external
    // unless explicitly bundled; match bun's default of following package.json
    // "browser" fields off and node builtins inlined as requires.
    logLevel: 'info',
    // Keep dynamic require/import of electron at runtime.
    define: {},
  })
  console.log(`[build-electron] ${rel} -> ${path.relative(root, cfg.outfile)}`)
}

console.log('[build-electron] all electron bundles written to desktop/electron-dist/')
