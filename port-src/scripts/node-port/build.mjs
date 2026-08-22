#!/usr/bin/env node
/**
 * Node.js port build pipeline (replaces `bun build`).
 *
 * Bundles src/entrypoints/cli.tsx (+ recovery CLI) to dist/ with esbuild:
 *  - bun:bundle / bun:sqlite aliased to Node compat shims in src/compat/
 *  - tsconfig path stubs (color-diff-napi, @ant/claude-for-chrome-mcp) aliased
 *  - node_modules kept external (shipped alongside dist/)
 *
 * Usage: node port-src/scripts/node-port/build.mjs
 *        (or, after copying scripts/node-port/ to the repo root: node scripts/node-port/build.mjs)
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
// Works from both layouts:
//   <root>/port-src/scripts/node-port/build.mjs  (documented: direct overlay
//     after `cp -r port-src ./`)
//   <root>/scripts/node-port/build.mjs            (legacy copied layout)
const rootDir = existsSync(path.join(scriptDir, '..', '..', 'package.json'))
  ? path.resolve(scriptDir, '..', '..')
  : path.resolve(scriptDir, '..', '..', '..')

// Resolve esbuild: the copy vendored into port-src/vendor/node_modules/ comes
// first (pinned 0.28.2 with both linux-x64 and win32-x64 binaries — esbuild
// itself resolves with zero registry access; the root `npm install` is still
// required for the 67 upstream dependencies, see patches/README "Source-level
// overlay gap"); fall back to whatever esbuild the repo's own node_modules
// provides.
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

// Build-time macros injected by Bun's release pipeline (`MACRO.*`).
// Key set must match the globalThis.MACRO in preload.ts / the official
// release pipeline — src reads 7 keys (VERSION, PACKAGE_URL,
// NATIVE_PACKAGE_URL, FEEDBACK_CHANNEL, BUILD_TIME, VERSION_CHANGELOG,
// ISSUES_EXPLAINER); missing keys become undefined at runtime and break
// install-command generation, changelog links, and issue hints.
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
  // Full bundling: avoids Node-strict-ESM breakage in packages like
  // jsonc-parser whose ESM builds use extensionless relative imports
  // (Bun tolerates this, Node does not). Produces a self-contained
  // artifact that only needs a Node 22+ runtime.
  jsx: 'automatic',
  sourcemap: 'linked',
  logLevel: 'info',
  // Optional integrations loaded via dynamic import with .catch fallbacks —
  // not installed by default; users who need them install them separately.
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
      // preload.ts parity: the Bun pipeline ran every entry with bunfig's
      // preload.ts, which defaulted this env (local builds skip remote
      // managed-settings/policy prefetch).
      'process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";',
    ].join('\n'),
  },
}

// CLI-only banner addition: preload.ts chdir'd into CALLER_DIR before any
// entry code ran, so the CLI always operated in the invoker's directory even
// though the launcher spawns it with cwd=install root. Server/adapter
// artifacts must NOT chdir (original compiled sidecars never did).
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

  // IM adapters (feishu/telegram/wechat/dingtalk/whatsapp): single dispatcher
  // entry with code-splitting so each adapter lands in its own chunk and only
  // loads when its --flag is passed. Unlike the CLI bundle, baileys here is
  // the real package from adapters/node_modules (the CLI stub alias must not
  // apply — whatsapp bridging is a real feature in this artifact).
  // The dispatcher is a port overlay file (does not exist upstream) and its
  // relative ./feishu/index.ts imports require it to sit at
  // <root>/adapters/index.ts — overlay it there automatically (idempotent)
  // when `cp -r port-src ./` left it inside the port-src subdirectory.
  // Adapter deps (grammy/baileys/@larksuiteoapi/…) live in adapters'
  // own node_modules; when they are not installed the bundle is skipped
  // with a notice — the core artifacts above are complete either way, and
  // Stage B ships the prebuilt chunks from runtime/node-fallback/.
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

    // The adapter chunks bundle third-party SDKs whose JSDoc API docs are
    // written in Chinese; strip those comments from the emitted chunks so
    // rebuilds match the committed (comment-free) runtime/node-fallback
    // payloads. Code is untouched — only CJK-containing comment spans go.
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
