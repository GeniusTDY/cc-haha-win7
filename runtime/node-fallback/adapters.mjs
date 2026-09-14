import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  init_define_MACRO
} from "./adapters-chunks/chunk-57T55QIK.mjs";

// adapters/index.ts
init_define_MACRO();
var flag = process.argv.find(
  (arg) => arg === "--feishu" || arg === "--telegram" || arg === "--wechat" || arg === "--dingtalk" || arg === "--whatsapp" || arg === "--wecom" || arg === "--qq" || arg === "--slack"
);
if (!flag) {
  console.error(
    "[adapters] missing adapter flag: pass --feishu, --telegram, --wechat, --dingtalk, --whatsapp, --wecom, --qq or --slack"
  );
  process.exit(2);
}
var entrypoints = {
  "--feishu": () => import("./adapters-chunks/feishu-LPT7NURW.mjs"),
  "--telegram": () => import("./adapters-chunks/telegram-WJXZNHIZ.mjs"),
  "--wechat": () => import("./adapters-chunks/wechat-FLEZ56VR.mjs"),
  "--dingtalk": () => import("./adapters-chunks/dingtalk-REHYDPMP.mjs"),
  "--whatsapp": () => import("./adapters-chunks/whatsapp-L7Z2RVMT.mjs"),
  "--wecom": () => import("./adapters-chunks/wecom-YAK7FJMY.mjs"),
  "--qq": () => import("./adapters-chunks/qq-CAB5O3MK.mjs"),
  "--slack": () => import("./adapters-chunks/slack-PKLFTXC7.mjs")
};
try {
  await entrypoints[flag]();
} catch (error) {
  console.error(`[adapters] ${flag.slice(2)} adapter failed:`, error);
  process.exit(1);
}
//# sourceMappingURL=adapters.mjs.map
