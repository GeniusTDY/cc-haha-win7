
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
