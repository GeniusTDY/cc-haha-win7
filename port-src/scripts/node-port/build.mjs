#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = existsSync(path.join(scriptDir, '..', '..', 'package.json'))
  ? path.resolve(scriptDir, '..', '..')
  : path.resolve(scriptDir, '..', '..', '..')

async function loadEsbuild() {
  const vendored = [
    path.join(scriptDir, '..', '..', 'vendor', 'node_modules', 'esbuild', 'lib', 'main.js'),
    path.join(scriptDir, '..', '..', 'port-src', 'vendor', 'node_modules', 'esbuild', 'lib', 'main.js'),
  ].find(existsSync)
  const specs = vendored ? [pathToFileURL(vendored).href, 'esbuild'] : ['esbuild']
  for (const spec of specs) {
    try {
      const m = await import(spec)
      if (m.build) return m
      if (m.default?.build) return m.default
    } catch {}
  }
  throw new Error(
    'esbuild not found: neither port-src/vendor/node_modules/ nor the repo node_modules has it',
  )
}
const { build } = await loadEsbuild()
const outDir = path.join(rootDir, 'dist')
mkdirSync(outDir, { recursive: true })

const pkgVersion = JSON.parse(
  readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
).version

const MACRO_VALUE = JSON.stringify({
  VERSION: process.env.CC_HAHA_BUILD_VERSION ?? pkgVersion,
  PACKAGE_URL: 'claude-code-local',
  NATIVE_PACKAGE_URL: 'claude-code-local',
  BUILD_TIME: new Date().toISOString(),
  VERSION_CHANGELOG: '',
  ISSUES_EXPLAINER: '',
  FEEDBACK_CHANNEL: 'https://github.com/GeniusTDY/cc-haha-win7/issues',
})

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  jsx: 'automatic',
  sourcemap: 'linked',
  logLevel: 'info',
  external: [
    'sharp',
    '@aws-sdk/client-bedrock',
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-sts',
    '@anthropic-ai/bedrock-sdk',
    '@anthropic-ai/vertex-sdk',
    '@anthropic-ai/foundry-sdk',
    '@anthropic-ai/mcpb',
    '@azure/identity',
    '@opentelemetry/exporter-metrics-otlp-grpc',
    '@opentelemetry/exporter-metrics-otlp-http',
    '@opentelemetry/exporter-metrics-otlp-proto',
    '@opentelemetry/exporter-prometheus',
    '@opentelemetry/exporter-logs-otlp-grpc',
    '@opentelemetry/exporter-logs-otlp-http',
    '@opentelemetry/exporter-logs-otlp-proto',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-trace-otlp-proto',
    'audio-capture-napi',
  ],
  loader: {
    '.md': 'text',
    '.txt': 'text',
    '.jsonc': 'text',
    '.yaml': 'text',
    '.yml': 'text',
  },
  define: {
    MACRO: MACRO_VALUE,
  },
  alias: {
    'bun:bundle': path.join(rootDir, 'src/compat/bunBundle.ts'),
    'bun:sqlite': path.join(rootDir, 'src/compat/bunSqlite.ts'),
    'color-diff-napi': path.join(rootDir, 'stubs/color-diff-napi.ts'),
    '@ant/claude-for-chrome-mcp': path.join(rootDir, 'stubs/ant-claude-for-chrome-mcp.ts'),
    '@whiskeysockets/baileys': path.join(rootDir, 'stubs/baileys.ts'),
  },
  banner: {
    js: [
      "import { createRequire as __nodePortCreateRequire } from 'node:module';",
      "import { fileURLToPath as __nodePortF2P } from 'node:url';",
      "import { dirname as __nodePortDirname } from 'node:path';",
      'var require = __nodePortCreateRequire(import.meta.url);',
      'var __filename = __nodePortF2P(import.meta.url);',
      'var __dirname = __nodePortDirname(__filename);',
      'process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";',
    ].join('\n'),
  },
}

const cliBanner = {
  js: `${shared.banner.js}\nif (process.env.CALLER_DIR) { try { process.chdir(process.env.CALLER_DIR); } catch {} }`,
}

async function main() {
  await build({
    ...shared,
    banner: cliBanner,
    entryPoints: [path.join(rootDir, 'src/entrypoints/cli.tsx')],
    outfile: path.join(outDir, 'cli.mjs'),
  })

  await build({
    ...shared,
    banner: cliBanner,
    entryPoints: [path.join(rootDir, 'src/localRecoveryCli.ts')],
    outfile: path.join(outDir, 'recovery-cli.mjs'),
  })

  await build({
    ...shared,
    entryPoints: [path.join(rootDir, 'src/entrypoints/serverNode.ts')],
    outfile: path.join(outDir, 'server.mjs'),
  })

  const overlaySrc = path.resolve(scriptDir, '..', '..', 'adapters', 'index.ts')
  const adaptersEntry = path.join(rootDir, 'adapters', 'index.ts')
  const adaptersDepsInstalled = existsSync(path.join(rootDir, 'adapters', 'node_modules'))
  if (adaptersDepsInstalled) {
    if (!existsSync(adaptersEntry)) {
      if (!existsSync(overlaySrc)) {
        throw new Error('adapters/index.ts not found (neither at repo root nor in port-src/)')
      }
      copyFileSync(overlaySrc, adaptersEntry)
    }
    await build({
      ...shared,
      alias: undefined,
      entryPoints: [adaptersEntry],
      outdir: outDir,
      entryNames: 'adapters',
      outExtension: { '.js': '.mjs' },
      splitting: true,
      chunkNames: 'adapters-chunks/[name]-[hash]',
    })

    const { stripCjkCommentsInFile } = await import('./strip-cjk-comments.mjs')
    const chunkDir = path.join(outDir, 'adapters-chunks')
    if (existsSync(chunkDir)) {
      let spans = 0
      for (const f of readdirSync(chunkDir).filter(f => f.endsWith('.mjs'))) {
        const r = stripCjkCommentsInFile(path.join(chunkDir, f))
        spans += r.removedSpans
      }
      console.log(`[node-port] adapters-chunks: stripped ${spans} CJK comment span(s)`)
    }

    console.log('[node-port] build complete → dist/cli.mjs, dist/recovery-cli.mjs, dist/server.mjs, dist/adapters.mjs')
  } else {
    console.warn(
      '[node-port] adapters deps not installed (cd adapters && npm install) — ' +
        'skipped dist/adapters.mjs; core artifacts are complete. ' +
        'Stage B needs nothing here: the prebuilt chunks ship in runtime/node-fallback/.',
    )
    console.log('[node-port] build complete → dist/cli.mjs, dist/recovery-cli.mjs, dist/server.mjs')
  }
}

main().catch(err => {
  console.error('[node-port] build failed:', err)
  process.exit(1)
})
