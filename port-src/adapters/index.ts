
const flag = process.argv.find(
  (arg) =>
    arg === '--feishu' ||
    arg === '--telegram' ||
    arg === '--wechat' ||
    arg === '--dingtalk' ||
    arg === '--whatsapp' ||
    arg === '--wecom' ||
    arg === '--qq' ||
    arg === '--slack',
)

if (!flag) {
  console.error(
    '[adapters] missing adapter flag: pass --feishu, --telegram, --wechat, --dingtalk, --whatsapp, --wecom, --qq or --slack',
  )
  process.exit(2)
}

const entrypoints = {
  '--feishu': () => import('./feishu/index.ts'),
  '--telegram': () => import('./telegram/index.ts'),
  '--wechat': () => import('./wechat/index.ts'),
  '--dingtalk': () => import('./dingtalk/index.ts'),
  '--whatsapp': () => import('./whatsapp/index.ts'),
  '--wecom': () => import('./wecom/index.ts'),
  '--qq': () => import('./qq/index.ts'),
  '--slack': () => import('./slack/index.ts'),
}

try {
  await entrypoints[flag]()
} catch (error) {
  console.error(`[adapters] ${flag.slice(2)} adapter failed:`, error)
  process.exit(1)
}
