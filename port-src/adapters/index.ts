// adapters/index.ts — IM adapter dispatcher (Win7 port overlay file).
// Reconstructed from the shipped dist/adapters.mjs artifact: single entry
// point for all five IM adapters, one literal dynamic import per adapter so
// esbuild code-splits each into a chunk that is only fetched when its
// --flag is passed.

const flag = process.argv.find(
  (arg) =>
    arg === '--feishu' ||
    arg === '--telegram' ||
    arg === '--wechat' ||
    arg === '--dingtalk' ||
    arg === '--whatsapp',
)

if (!flag) {
  console.error(
    '[adapters] missing adapter flag: pass --feishu, --telegram, --wechat, --dingtalk or --whatsapp',
  )
  process.exit(2)
}

const entrypoints = {
  // Literal dynamic imports: esbuild code-splits these into chunks that are
  // only fetched at runtime, keeping non-selected adapters unloaded.
  '--feishu': () => import('./feishu/index.ts'),
  '--telegram': () => import('./telegram/index.ts'),
  '--wechat': () => import('./wechat/index.ts'),
  '--dingtalk': () => import('./dingtalk/index.ts'),
  '--whatsapp': () => import('./whatsapp/index.ts'),
}

try {
  await entrypoints[flag]()
} catch (error) {
  console.error(`[adapters] ${flag.slice(2)} adapter failed:`, error)
  process.exit(1)
}
