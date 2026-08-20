#!/usr/bin/env node
/**
 * Node port of desktop/scripts/build-preview-agent.ts (drops `bun build`).
 *
 * Bundles src/preview-agent/index.ts to src-tauri/resources/preview-agent.js
 * as a minified IIFE with esbuild, mirroring the original bun invocation:
 *   bun build ./src/preview-agent/index.ts --outfile=<tmp> --format=iife --minify
 */

import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
// Works from both <root>/port-src/scripts/node-port/ (documented overlay
// layout) and <root>/scripts/node-port/ (legacy copied layout).
const root = existsSync(path.join(here, '..', '..', 'package.json'))
  ? path.resolve(here, '..', '..')
  : path.resolve(here, '..', '..', '..')
const desktopDir = path.join(root, 'desktop')

// esbuild: vendored copy in port-src/vendor/node_modules/ first (pinned
// 0.28.2, zero registry access on a fresh clone), repo node_modules second.
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
const outfile = path.join(desktopDir, 'src-tauri', 'resources', 'preview-agent.js')
const tmpfile = `${outfile}.${process.pid}.tmp`
mkdirSync(path.dirname(outfile), { recursive: true })

await build({
  entryPoints: [path.join(desktopDir, 'src', 'preview-agent', 'index.ts')],
  outfile: tmpfile,
  format: 'iife',
  minify: true,
  target: 'es2021',
  platform: 'browser',
  bundle: true,
  logLevel: 'info',
})

renameSync(tmpfile, outfile)
rmSync(`${outfile}.map`, { force: true })
console.log('[node-port] preview-agent.js built')
