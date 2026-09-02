#!/usr/bin/env node

import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = existsSync(path.join(here, '..', '..', 'package.json'))
  ? path.resolve(here, '..', '..')
  : path.resolve(here, '..', '..', '..')

async function loadEsbuild() {
  const vendored = [
    path.join(here, '..', '..', 'vendor', 'node_modules', 'esbuild', 'lib', 'main.js'),
    path.join(here, '..', '..', 'port-src', 'vendor', 'node_modules', 'esbuild', 'lib', 'main.js'),
  ].find(existsSync)
  const specs = vendored ? [pathToFileURL(vendored).href, 'esbuild'] : ['esbuild']
  for (const spec of specs) {
    try {
      const m = await import(spec)
      if (m.build) return m
      if (m.default?.build) return m.default
    } catch {}
  }
  throw new Error('esbuild not found (neither vendored nor in repo node_modules)')
}
const { build } = await loadEsbuild()
const desktopDir = path.join(root, 'desktop')
const outDir = path.join(desktopDir, 'electron-dist')

const bundles = [
  {
    entry: path.join(desktopDir, 'electron', 'main.ts'),
    outfile: path.join(outDir, 'main.cjs'),
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
    logLevel: 'info',
    define: {},
  })
  console.log(`[build-electron] ${rel} -> ${path.relative(root, cfg.outfile)}`)
}

console.log('[build-electron] all electron bundles written to desktop/electron-dist/')
