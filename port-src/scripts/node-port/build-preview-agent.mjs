#!/usr/bin/env node
/**
 * Node port of desktop/scripts/build-preview-agent.ts (drops `bun build`).
 *
 * Bundles src/preview-agent/index.ts to src-tauri/resources/preview-agent.js
 * as a minified IIFE with esbuild, mirroring the original bun invocation:
 *   bun build ./src/preview-agent/index.ts --outfile=<tmp> --format=iife --minify
 */

import { build } from 'esbuild'
import { mkdirSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'desktop',
)
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
