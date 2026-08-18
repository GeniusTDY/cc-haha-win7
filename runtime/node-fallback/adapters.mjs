import { createRequire as __nodePortCreateRequire } from 'node:module';
import { fileURLToPath as __nodePortF2P } from 'node:url';
import { dirname as __nodePortDirname } from 'node:path';
var require = __nodePortCreateRequire(import.meta.url);
var __filename = __nodePortF2P(import.meta.url);
var __dirname = __nodePortDirname(__filename);
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1";
import {
  init_define_MACRO
} from "./adapters-chunks/chunk-W6QE2DL3.mjs";

// adapters/index.ts
init_define_MACRO();
var flag = process.argv.find(
  (arg) => arg === "--feishu" || arg === "--telegram" || arg === "--wechat" || arg === "--dingtalk" || arg === "--whatsapp"
);
if (!flag) {
  console.error(
    "[adapters] missing adapter flag: pass --feishu, --telegram, --wechat, --dingtalk or --whatsapp"
  );
  process.exit(2);
}
var entrypoints = {
  // Literal dynamic imports: esbuild code-splits these into chunks that are
  // only fetched at runtime, keeping non-selected adapters unloaded.
  "--feishu": () => import("./adapters-chunks/feishu-3DIUNOQW.mjs"),
  "--telegram": () => import("./adapters-chunks/telegram-7MO42EDR.mjs"),
  "--wechat": () => import("./adapters-chunks/wechat-JIM7FGX2.mjs"),
  "--dingtalk": () => import("./adapters-chunks/dingtalk-AQZ5FOSM.mjs"),
  "--whatsapp": () => import("./adapters-chunks/whatsapp-3QJAVYTB.mjs")
};
try {
  await entrypoints[flag]();
} catch (error) {
  console.error(`[adapters] ${flag.slice(2)} adapter failed:`, error);
  process.exit(1);
}
//# sourceMappingURL=adapters.mjs.map
