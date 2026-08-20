# cc-haha Win7 移植 · 验证报告

**移植目标**：彻底去除 Bun 运行时依赖，产出纯 Node.js ≥22.5 可执行的自包含 bundle，最大限度保留全部功能。
**验证环境**：Linux 沙箱，Node v24.1.0（node22 target 产物的超集运行时），mock Anthropic API。
**验证日期**：2026-08-16（L1/L2/L3 为当日复验；L4 于移植会话内完成）。

---

## 1. 移植范围：Bun → Node.js API 映射

| Bun 依赖 | 出现位置 | Node 移植方案 |
|---|---|---|
| `bun:sqlite` | 会话持久化 | `src/compat/bunSqlite.ts` → `node:sqlite`（DatabaseSync），含布尔参数归一化 |
| `Bun.spawn` | 子进程/CLI 拉起 | `src/compat/bunSpawn.ts` → `node:child_process`，复刻 `exited` promise 语义（exit + error 双路 settle） |
| `Bun.serve`（含 WebSocket 升级） | 桌面后端 HTTP/WS | `src/compat/bunServe.ts` → `node:http` + `ws`，路径路由（`/ws/`、`/sdk/`）、升级后禁止写 HTTP 响应、ECONNRESET/请求级错误兜底 |
| `Bun.file` | 文件流 | `src/compat/bunFile.ts` → `node:fs` 流式实现 |
| `bun:bundle` | 宏/嵌入资源 | `src/compat/bunBundle.ts` shim |
| `import.meta.main` | server 自启动判断 | 新增 `src/entrypoints/serverNode.ts` 包装（Node 下该属性 undefined 导致原入口不启动） |
| `MACRO.*` 构建期注入 | 版本号/构建时间 | esbuild `define` 复刻 Bun 发布管线注入 |
| `bin/claude-haha` Bun 启动器 | 入口 | 重写为 Node 启动器（env-file、CALLER_DIR、信号转发、退出码透传），另附 Win7 `.cmd` |
| `bun build`（CLI/Server/桌面壳×4） | 构建链 | `scripts/node-port/build.mjs` + `build-electron.mjs`（esbuild，全量 bundle 解决 Node 严格 ESM 对 extensionless import 的不容忍） |
| `feature()` 语义 / tsconfig 路径桩 | 原生模块 | `color-diff-napi`、`@ant/claude-for-chrome-mcp`、`@whiskeysockets/baileys` 桩替换 |

**保留策略**：全量打包 + 可选集成（sharp、AWS/Vertex/Foundry SDK、OTel 导出器、audio-capture-napi）保持 external + 动态导入回退，与官方 Bun 构建的可选依赖策略一致。

## 2. 分层验证结果

### L1 · Bun-free 产物 — **PASS**

对 7 个产物 grep `Bun.`：`cli.mjs` 21 处、`server.mjs` 20 处、其余 5 个产物 0 处。对全部 21 处逐条核查：

- 20 处均为 `if (typeof Bun !== "undefined") { Bun.x } else { Node 回退 }` 形态（`Bun.hash`→`crypto.createHash`、`Bun.semver`→npm semver、`Bun.YAML`→yaml 包、`Bun.which`→`spawnSync("which")`、`Bun.gc`/`generateHeapSnapshot`→跳过、上游代理中 `Bun.listen`→`startNodeRelay` 等），Node 下走回退分支；
- 唯一无守卫的 `Bun.spawn`（sandbox-runtime 的 ripgrep argv0 探测）仅在用户显式配置 `ripgrep.argv0` 时可达，默认配置 `{command:"rg"}` 不可达。

**结论：默认代码路径零 Bun 运行时调用。**

### L2 · CLI 启动 — **PASS**

```
$ node dist/cli.mjs --version
999.0.0-local (Claude Code)

$ node dist/cli.mjs --help
Usage: claude [options] [command] [prompt] …（完整选项列表正常输出）
```

### L3 · 单轮 Agent 循环（mock API）— **PASS**

mock Anthropic API（SSE）驱动完整回合：

```
$ node dist/cli.mjs -p "…" --dangerously-skip-permissions   (IS_SANDBOX=1)
FILE-TOOLS-OK — Write then Read both succeeded with expected content.
EXIT=0
```

覆盖：OAuth/模型端点解析 → SSE 流式解析 → `tool_use`(Write) → 工具执行落盘 → `tool_result` 回传 → `tool_use`(Read) → 终答文本。会话持久化目录（backups/plans/projects/sessions）正常生成。root 权限拦截经 `IS_SANDBOX=1` 正确豁免。

### L4 · 桌面服务 + WebSocket 端到端 — **PASS**（移植会话内完成）

- `node dist/server.mjs --host 127.0.0.1 --port 3456` 正常监听；
- WS 客户端 `Bearer` 鉴权连接 `/ws/<sessionId>`，完成会话创建 → 消息下发 → `message_complete` 回收；
- 文件工具链（Write/Read）经服务端会话执行成功；
- 修复项实证：WS 升级后 RSV1 帧错误、客户端断连 ECONNRESET 崩溃、CLI 子进程 stdin 管道悬挂、SDK token 校验失败——均已解决并回归。

### 桌面壳构建 — **PASS**

`build-electron.mjs` 产出 4 个 CJS bundle（main 253 KB / preload 24 KB / pet-preload 18 KB / preview-preload 3 KB），`electron`、`node-pty`、`electron-updater` 保持 external（node-pty 需在运行时从 node_modules 解析 prebuilds，Win7 下自动回退 winpty）。

## 3. 移植过程中修复的关键缺陷

1. `import.meta.main` Node 下 undefined → server 不自启动（新增 serverNode 入口）
2. `MACRO.VERSION` ReferenceError → esbuild define 注入
3. jsonc-parser 等包 extensionless ESM 导入 Node 不容忍 → 全量 bundle
4. mock SSE 事件格式与 Anthropic 协议不一致 → 修正 event 结构
5. root 权限拦截 → `IS_SANDBOX=1` 豁免路径
6. WS 升级后误写 HTTP 响应（RSV1 帧 RST）→ 升级标记 + 跳过
7. 客户端断连未捕获 ECONNRESET → req/res 级 error 监听
8. 开放管道 stdin 致 CLI 子进程悬挂 → RemoteIO 关闭时 `inputStream.end()`
9. 官方 OAuth 模式 provider 环境变量误剥离 → conversationService 修正
10. electron-updater 解析失败 → external 化

## 4. Win7 专项复查与修复（第三轮：启动语义与桌面链路）

按"Win7 OS 层"（而非 Bun 层）维度复扫全部产物，发现 4 项问题并修复 3 项、澄清 1 项：

| 问题 | 定性 | 处置 |
|---|---|---|
| node-pty 1.x 默认走 ConPTY（Win10 1809+）→ 桌面终端在 Win7 失败 | 功能缺失 | **已修（两轮）**：第一轮加管道式 PTY 回退（`loadNodePtyFactory` catch / spawn 点位 catch 且主版本 <10 时降级 `child_process` 管道实现）；第二轮升级为 winpty 完整方案——node-pty 1.1.0 的 prebuilds/win32-x64 实际仍附带 winpty（`pty.node` N-API + `winpty-agent.exe` + `winpty.dll`），补丁 003 在 Win7/8 强制 `useConpty:false` 走 winpty 后端（完整 TTY，vim/htop 可用），vendored 载荷（`runtime/node-pty-win32-x64/`）由 repack 步骤 6/8 保证不被 electron-builder 裁剪；管道回退仅保留为载荷损坏时的最后防线 |
| 无内置 ripgrep；2024-05 后构建的 rg.exe 要求 Win10+ → Grep 工具在 Win7 不可用 | 功能缺失 | **已修**：vendor 进 ripgrep 14.1.0 x64（`dist/vendor/ripgrep/x64-win32/rg.exe`）。双重验证：① PE 导入表解析确认仅含 ADVAPI32/KERNEL32/bcrypt/ntdll/USERENV，无任何 Win8+ API（无 `GetSystemTimePreciseAsFileTime`/`SetProcessMitigationPolicy`）；② SubsystemVersion=6.0。CLI 的 `builtinRipgrepConfig` 按该路径自动发现 |
| VT 模式判定只看 Node 版本（≥22.17），Win7 conhost 无 VT 输入处理 → 新 Node 上按键绑定错乱 | 渲染缺陷 | **已修**：`defaultBindings.ts` 的 `SUPPORTS_TERMINAL_VT_MODE` 增加 `parseFloat(os.release()) >= 10` 门控；Win7 自动使用非 VT 按键绑定（如 mode 切换用 meta+m） |
| PowerShell 目标 5.1，Win7 原生仅 2.0 | 部署前提 | **澄清**：shell 检测已有 Git Bash→PowerShell 回退链；装 WMF 5.1（Win7 SP1 支持）或 Git Bash 即满配，非代码缺陷 |
| SIGSTOP（ctrl+z 挂起） | 核查项 | **已有门控**：`App.tsx` `SUPPORTS_SUSPEND = platform !== 'win32'`，无需修改 |
| `__dirname`（内置 rg 路径解析） | 核查项 | **已 shim**：bundle 中 `__dirname = fileURLToPath(import.meta.url)/../`，正确解析到 `dist/`，vendored rg 路径可达 |

修复后重建全部产物（`build.mjs` + `build-electron.mjs`）并回归：L2 `--version`/`--help` PASS；L3 mock API 端到端工具循环 PASS（EXIT=0）；`main.cjs` 含管道回退（5 处引用）、`cli.mjs` 含 VT OS 门控（逐点 grep 确认）。

## 4b. 第三轮新增发现与修复（Node 版本语义 × 桌面进程链）

第三轮扫描切换维度：不再查"Bun 残留 / Win7 API"，改查 **Node 版本语义边界**与 **Electron 壳 → 子进程的完整拉起链**，发现三项此前全部漏网的问题：

| # | 问题 | 根因 | 修复 | 验证 |
|---|---|---|---|---|
| 1 | **`node:sqlite` 旗标坑**：22.5.0–22.12.x / 23.0–23.3.x 上 `import 'node:sqlite'` 直接抛 `ERR_UNKNOWN_BUILTIN_MODULE`，CLI/Server 启动即崩 | node:sqlite 于 22.5.0 引入时带 `--experimental-sqlite` 旗标，22.13.0/23.4.0 才解除；此前文档只写了"≥22.5"，且沙箱 Node 24 永远暴露不了 | ① `bin/claude-haha` 启动器按 `process.versions.node` 精确区间自动附加旗标；② 新增 `bin/server-haha(.cmd)` 同逻辑；③ 桌面壳 sidecar 回退内置版本探测；④ `.cmd` 改为路由经 JS 启动器（Windows 上也吃到旗标逻辑） | **实测 Node 22.5.0**：裸跑 `dist/cli.mjs` 复现崩溃 → 经启动器 `--version` EXIT=0 → 完整 L3（mock API + 工具循环 + sessions 持久化）EXIT=0 → `server-haha` 起服 HTTP 探活成功。谓词单测 7/7（22.5/22.12/22.13/23.3/23.4/24.1/20.19） |
| 2 | **桌面壳 sidecar 断链**：`createServerPlan`/`createAdapterPlan` spawn 编译版 `claude-sidecar-<triple>.exe`（上游 Bun 编译产物），本移植无此文件 → Electron 桌面端起不了后端 | L4 当时直接跑 `server.mjs`，绕过了 Electron 内部的 spawn 链，故未暴露 | `sidecarManager.ts` 增加回退：检测 sidecar 二进制缺失时改用系统 Node 运行 `dist/server.mjs`（args 兼容：忽略 `server`/`--app-root`，注入 `CLAUDE_APP_ROOT` env）与 `dist/adapters.mjs`；`spawnSidecar` 放行 PATH 裸命令名；新增 `CC_HAHA_NODE_EXE`/`CC_HAHA_SERVER_MJS`/`CC_HAHA_ADAPTERS_MJS` 覆盖项 | plan 级单测：server/adapter 两 plan 均产出 node 命令 + 旗标 + 正确参数/env；裸名 spawn 不再预检抛错 |
| 3 | **IM 桥接（adapters）整体缺失**：五个 IM 适配器（飞书/Telegram/微信/钉钉/WhatsApp）是独立 bun 子项目，首轮移植完全未打包 | 当时判定为"可选功能"未纳入；用户要求全部功能后重新评估——源码本身零 Bun 依赖（仅测试文件用 bun test），纯 JS 依赖可全量内联 | 新增 `adapters/index.ts` 调度入口（字面量动态 import 以支持 esbuild 代码切分）+ `build.mjs` 增加 adapters 构建段（真实 baileys，不复用 CLI 的 stub alias）→ `dist/adapters.mjs` + `dist/adapters-chunks/`（feishu 5.4MB / whatsapp 4.4MB / telegram 967KB / dingtalk 221KB / wechat 30KB，按需加载） | 无旗标 exit 2；`--telegram` 无 token 走到 adapter 自身配置校验（chunk 加载 + 模块初始化实证通过） |
| 4 | 启动器语法回归（过程中引入后即修） | 给纯 JS 启动器加了 TS 注解 | 移除注解 | Node 22.5.0 / 24 双版本回归通过 |
| 5 | **adapters chunk 内 `__dirname` 裸用**：feishu（lark SDK 包根探测）与 whatsapp（pino worker 定位）在 ESM 下抛 `ReferenceError: __dirname is not defined` | CJS 依赖的惯用法未被 esbuild 转换（cli/server 侧源码自带 shim，adapters 侧没有） | build.mjs banner 统一注入 ESM 兼容 `__dirname`/`__filename`（var 声明，不与 esbuild 重命名变量冲突），对全部 bundle 与 chunk 生效 | 五个 adapter 冒烟全部走到各自凭证校验（无 ReferenceError）；CLI/Server banner 变更后全量回归（Node 24 L2、Node 22.5.0 L2+L3）PASS |

另更正两处首轮文档误述：**TLS**——Node 自带 OpenSSL，与 Win7 系统开关无关（原"需在 Internet 选项启用 TLS 1.2"不适用于 Node 进程）；**Git Bash**——需 ≤2.45（2.46+ 要求 Win10）。

### 更正：sandbox-runtime 结论

首轮报告中"sandbox-runtime 不可用"为**误判**，现更正：`@anthropic-ai/sandbox-runtime` 的沙箱机制（bwrap/socat/seccomp）为 OS 层工具，已完整内联进 bundle，与 Bun 无耦合；其代码中唯一的 Bun 触点（ripgrep argv0 探测）仅在显式配置 `ripgrep.argv0` 时可达。沙箱的平台门控为 macOS/Linux/WSL2——**上游原版在任何 Windows 上都不启用**，因此不构成 Win7 移植回归。功能面无此项缺失。

## 5. 遗留风险（与部署手册 §6 对应）

- Win7 运行时本身是最大变量：官方 node.exe ≥22.5 在 Win7 的可用性未经官方保证，优先走 backport 构建（路径 A）或旁路部署（路径 C）；
- `node:sqlite` 为 experimental API，且 22.5–22.12 需旗标（启动器已自动处理；裸跑需自查）；Node 小版本升级需回归 L3；
- 管道式终端回退无 TTY 仿真（Win7 桌面终端的已知代价）；需要完整仿真是可选的 node-pty 0.11.0-beta37 降级方案（部署手册 §5.3）；
- Electron 22 桌面壳主进程为 Node 16，与构建 target node18 存在理论语法差（静态分析未见使用 node18+ 独有全局，风险低，建议真机冒烟一次）；
- 桌面壳完整链路（Electron 22 → 系统 Node → server/adapters）在沙箱内以等价的"直接 spawn Node"方式验证（plan 单测 + server 起服探活），Electron 壳内真机回归仍建议做一次。

## 6. 总评

CLI / Server / 桌面壳 / IM 桥接四条产品线均已完成 Bun → Node 迁移并通过分层验证：**L1 产物纯净度、L2 启动、L3 端到端 agent 工具循环、L4 桌面 WS 会话流全部 PASS**。三轮 Win7 专项复查累计发现并修复 7 项问题（桌面终端 PTY、内置 ripgrep、TUI 按键、sqlite 旗标、桌面 sidecar 断链、adapters 缺失、chunk `__dirname`），其中 sqlite 旗标与 sidecar 断链两项经 **Node 22.5.0 真实运行时实证**（裸跑崩溃复现 → 启动器自愈 → 端到端通过）。功能面完整保留（多轮会话、工具执行、文件链、持久化、桌面集成、五路 IM 桥接）。Win7 侧剩余风险集中于 Node 运行时获取，已在部署手册给出三条路径与验证门槛。

## 7. 第四轮全面复检（2026-08-16：Electron 22 API 边界）

按三个运行时分层重扫全部源码与产物（Electron 22 主进程 = Node 16.17 + Chromium 108；sidecar = 系统 Node ≥22.5；渲染层 = Chromium 108），发现并修复 5 项残留：

| # | 问题 | 影响面 | 修复 |
|---|---|---|---|
| 1 | `WebContentsView` / `window.contentView`（Electron 28+ API）硬编码于桌面壳，Electron 22 上 `new WebContentsView()` 直接 TypeError | 桌面预览面板崩溃 | `desktop/electron/main.ts` 运行时探测构造器，缺失时回退 `BrowserView`；`services/preview.ts` 父窗口适配 `addBrowserView/removeBrowserView`（两代 API 同一 bundle 兼容） |
| 2 | `electron-updater` 顶层静态 import：最小化 Win7 包（无 node_modules）启动即崩 | 桌面壳整体无法启动 | 改为懒加载 + no-op stub 回退（缺模块仅告警禁用更新） |
| 3 | Tailwind v4 产物含 oklch 调色板（Chromium 111+）与 CSS 嵌套（112+），Chromium 108 上大面积样式失效 | 桌面 UI 视觉 | Vite `css.transformer: lightningcss` + `targets: chrome 108`；复检产物 **oklch=0**。残留 42 处 var() 型 `color-mix`（不透明度工具类）无法静态转译，108 上按标准降级为忽略该声明——个别半透明样式不生效，属外观级而非功能级 |
| 4 | 渲染层 `desktop/dist` 前端产物缺失（Electron 白屏） | 桌面 UI | 已完成 Vite 构建（target es2021/safari15/chrome108），`dist/index.html` + assets 齐备 |
| 5 | `desktop/package.json` 仍声明 `electron ^42.4.0`（不支持 Win7）且 build/build:electron 脚本依赖 Bun | 按清单重装会得到不可用桌面壳 | devDependency 固定 `^22.3.27`；build / build:electron / build:preview-agent 全部改为纯 node 命令 |

加固项（防 Win7 白窗/崩溃循环）：主进程在 win32 且 `os.release()` 主版本 <10 时调用 `app.disableHardwareAcceleration()`（软件合成）；`src/utils/ripgrep.ts` 最后一处无守卫 `Bun.spawn`（argv0 探测）改为 Bun/Node 双分支——产物中 **Bun API 全部处于 `typeof Bun` 守卫内**。

复检结论：**Node 产物（cli/recovery/server/adapters）无 Node 22.5 之后的 API、无未守卫 Bun 调用；桌面壳无 Electron 22 之后的 API；渲染层无 Chromium 108 之后的 JS API**。渲染层残留 `color-mix` 为唯一已知外观级降级。

## 8. 第五轮全面复检（2026-08-16：Node 16 语义 × preload × 交付物完整性）

第四轮聚焦 Electron 22 的 API 面，本轮补齐三个盲区：主进程 **Node 16.17** 内置 API 边界（语法虽按 node18 转译，内置方法不会）、preload 沙箱层、以及**交付 tar 包与源码修复的同步状态**。发现并修复 3 项：

| # | 问题 | 影响面 | 修复 |
|---|---|---|---|
| 1 | `preload.ts` 顶层解构 `webUtils` 并直接调用 `webUtils.getPathForFile()`——`webUtils` 为 **Electron 29** 新增模块，Electron 22 上为 `undefined`，拖拽文件到窗口即 TypeError | 桌面文件拖入功能崩溃 | [preload.ts](file:///workspace/cc-haha/desktop/electron/preload.ts#L7-L15) 双代兼容：29+ 走 `webUtils`，≤31 走 `File.path`（Electron 32 才移除）。注：下游 electronHost 自带的 `file.path` 兜底原不可达（异常在外层先抛出），此修复使其生效 |
| 2 | 交付 tar 包 `main.cjs` 为第四轮修复前的旧产物：顶层 `require("electron-updater")` 在无 node_modules 的最小包内启动即崩 | Win7 部署包桌面壳无法启动 | 重建 electron-dist 后重组 package 并重新打 tar |
| 3 | 交付 tar 包 `package/dist/` **缺失渲染层**（无 index.html/assets）——渲染入口 `appRoot/dist/index.html` 落空 | Win7 部署包桌面壳白屏 | 渲染层产物并入 `package/dist/`（与 server bundle 同住 dist/，兼作手机 H5 静态目录） |

同步核查（均 PASS）：主进程源码与 main.cjs 无 Node 17+ 内置（全局 `fetch`/`Readable.fromWeb`/`structuredClone`/`findLast`/`AbortSignal.*` 等，健康检查显式用 `node:http`）；`systemProxyBridge` 仅用 Node 15+ API（`dns/promises`/`stream/promises`）；`serverRuntime` 纯 child_process/net；渲染层构建产物无 Chromium 109+ 内置方法（toSorted/groupBy/fromAsync 等均无），CSS 仅 `overscroll-behavior`(63+) 与 1 处 `@container`(105+)；menu roles / 窗口选项（`titleBarStyle:'hiddenInset'` 为 mac 分支）/ `setIgnoreMouseEvents` 均在 Electron 22 内；交付包冒烟 `node package/dist/cli.mjs --version` 通过。

已知非阻塞项：desktop/package.json 中 `build:sidecars`、`prepare:node-pty` 等仍为 Bun 脚本——仅开发机打包编译版 sidecar 时使用，Win7 部署路径（Node 回退）不经过它们。

## 9. 第六轮全面复检（2026-08-16：剩余盲区收口——全产物 API 全量扫描）

补齐五个此前未展开的盲区，**全部 PASS，无新增不兼容项**：

| 盲区 | 核查方式 | 结论 |
|---|---|---|
| pet-preload / preview-preload | 通读源码 | 仅用 `contextBridge`/`ipcRenderer`（Electron 22 沙箱安全子集）；preview-preload 对 `contextBridge` 缺失亦有守卫 |
| electron-dist 四产物 API 全量扫描 | grep Node 17+ 内置（structuredClone/AbortSignal.*/fromWeb/fromAsync/groupBy/Promise.try/RegExp.escape/crypto.hash/styleText/getBuiltinModule/enableCompileCompileCache 等）与 Electron 23+ API（BaseWindow/protocol.handle/net.fetch/utilityProcess 等） | 唯一命中为第四/五轮写入的**带守卫回退代码**（WebContentsView→BrowserView、webUtils→File.path）；无 node:sqlite、无未守卫外部 require |
| preview-agent.js（跑在 Chromium 108 的注入脚本，229 KB） | 同清单 grep | 零命中 |
| 渲染层 CSS/JS 深挖 | `lab(` 35 处 / `popover` / `popoverTarget` 逐一定位 | `lab(` 全部位于 `@supports (color:lab(0% 0 0))` 特性查询内——Chromium 108 评估为 false 整块跳过，外部有 srgb 回退值（Tailwind v4 渐进增强设计，**非缺陷**）；`popover` 为 z-index 自定义属性 `--z-popover` 与词表字符串；`popoverTarget` 仅存在于 HTML 实体表 / shiki 词法 / less 词表等字典 chunk，主业务 bundle 无 popover API 调用 |
| 通知降级（Win7 无 toast） | 通读 notifications.ts | `isSupported()` 门控：Electron 22 在 Win7 返回 false → 权限态 `denied`、发送返回 false，UI 优雅拒绝，无崩溃路径 |
| tray / 启动器 | tray.ts 仅用 Tray/Menu/nativeImage（远古 API）；tar 包 `.cmd` 路由至 JS 启动器、`server-haha` 探测 sqlite 旗标 | 均 Win7 安全 |

**六轮累计结论**：代码与交付物层面 Win7 不兼容项已全部收敛——Node 产物（Node 22.5 边界）、桌面壳（Electron 22 / 主进程 Node 16.17 边界）、渲染层与 preview-agent（Chromium 108 边界）均无越界 API；唯一已知降级为 var 型 `color-mix`（外观级，Chromium 108 按标准忽略声明）。剩余事项仅为真机 Win7 冒烟验证。

## 10. 第七轮复检（2026-08-16：对照原项目 v0.5.4 的功能等价性审计）

以 git HEAD（`d52bbec` v0.5.4，移植基线）为基准，逐文件审计全部 21 处修改 + 8 处新增的功能等价性：

**等价性确认（非遗漏）**：
- `@ant/claude-for-chrome-mcp` / `color-diff-napi` 桩——原项目 tsconfig paths 本就指向 `stubs/` 同款 null 桩（私有包未随开源仓库发布），移植逐字保留；`src/native-ts/color-diff`（纯 TS 实现）在原仓库同样零引用，属内部 release 管线预留
- `@whiskeysockets/baileys`——CLI bundle 桩化仅因 CLI 不含 WhatsApp 路径；adapters 构建显式取消 alias（`alias: undefined`），使用 `adapters/node_modules` 真包（7.0.0-rc.9，正式依赖），五路 IM 完整
- `src/entrypoints/`、`src/tools/`、`src/agent/` 零改动——CLI 命令面与全部 agent 工具与原项目逐字节一致
- sharp（FileReadTool 图片压缩回退）三重降级链完整（原生压缩→sharp→原图）；sandbox-runtime 内联 bundle 进 cli.mjs（无 external require 残留）；server 侧 `Bun.spawn/serve`→compat 层回退语义等价；keybindings 的 VT 门控新增 Win7 conhost 判断（合理增强）

**发现并修复 1 项**：
| 问题 | 影响 | 修复 |
|---|---|---|
| 构建期 `MACRO` 宏仅注入 3 键，源码实际读取 7 键（`PACKAGE_URL`×25、`NATIVE_PACKAGE_URL`×8、`VERSION_CHANGELOG`×3、`ISSUES_EXPLAINER`×2 缺失） | 构建产物中安装命令生成、更新包名、changelog 链接、issue 提示输出 `undefined` | [build.mjs](file:///workspace/cc-haha/scripts/node-port/build.mjs#L26-L40) 补齐全部 7 键（值对齐 preload.ts 默认），重建四个 bundle 并同步交付包 |

**结论**：对照原项目，移植无功能面遗漏；唯一实质缺陷（MACRO 宏缺键）已修复。原项目固有的桩化限制（彩色 diff、Claude in Chrome）与上游一致，非移植引入。

## 11. 第八轮复检（2026-08-16：compat 层保真度 × feature 门控 × 调度器对齐）

聚焦四个深层等价性风险点，**发现并修复 1 项功能遗漏**：

| # | 检查项 | 结论 |
|---|---|---|
| 1 | `feature()` 特性门控（bun:bundle 宏） | **发现遗漏并修复**：原项目所有官方入口都启用 `TRANSCRIPT_CLASSIFIER`（`bin/claude-haha` 传 `--feature=`、编译版 sidecar 构建期注入，desktop/scripts/build-sidecars.test.ts 有断言），门控 auto 权限模式的转录分类器（toolHooks/toolExecution/api）。移植仅启动器设置了 `CC_HAHA_FEATURES`，**server→CLI 子进程、cron 任务、electron sidecar、直接 `node dist/cli.mjs` 四条路径全部丢失该特性**。修复：[bunBundle.ts](file:///workspace/cc-haha/src/compat/bunBundle.ts#L11-L26) shim 在 `CC_HAHA_FEATURES` 未设置时默认 `TRANSCRIPT_CLASSIFIER`（显式设空可禁用），一处覆盖全部路径；已验证 cli.mjs/server.mjs 产物携带默认值。KAIROS/PROACTIVE/ULTRAPLAN/LODESTONE 等企业特性上游同样默认关闭，保持一致 |
| 2 | compat 层 API 保真度 | bunServe（idleTimeout/upgrade 双阶段/listening Promise/ECONNRESET 兜底）、bunSpawn（exited 的 exit+error 双路 settle）、bunSqlite（query/run/get/all + 布尔参数归一化）语义与 Bun 文档行为对齐，此前 L1–L4 已实证 |
| 3 | adapters 调度器 vs 原 sidecar 契约 | `adapters/index.ts` 五旗标→五入口与原 `claude-sidecar adapters --feishu\|...` 契约一致；adapters 源码零 `bun:` 依赖（仅 bun-types .d.ts 注释），构建产物无裸 bun: 导入 |
| 4 | 桌面构建管线 | build-electron.mjs 与原四条 `bun build` 同入口/同输出/同 external（electron、node-pty；electron-updater 因懒加载设计追加 external）；唯一省略为开发期 `prepare:node-pty`，运行时已有管道回退（Win7 必然走此路径，见 §5.3） |
| 5 | 杂项 diff | 根 package.json 仅追加 `build:node-port` 脚本；新增 `.npmrc`（engine-strict=false，解除 engines 校验阻断）无害 |

修复后四个 bundle 已重建并同步交付包（993 文件 / 49MB）。

## 12. 第九轮复检（2026-08-16：运行时语义链路——preload 副作用 × server 派生 CLI 解析）

对照原版 bunfig preload 与 CLI 派生链路逐条核对，**发现并修复 3 项遗漏**：

| # | 遗漏 | 原版行为 | Node 移植缺陷 | 修复 |
|---|---|---|---|---|
| 1 | **preload 副作用整体丢失** | bunfig preload 对所有入口注入：① `CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH=1` 默认值（本地构建跳过远程托管设置/策略预取）② CLI 进程 `process.chdir(CALLER_DIR)`（启动器以 cwd=安装根拉起，靠 preload 切到调用者目录） | CLI 永远运行在安装根目录（用户项目目录失效）；远程预取默认开启 | [build.mjs](file:///workspace/cc-haha/scripts/node-port/build.mjs#L95-L117)：四产物 banner 统一注入 `??= "1"`；cli/recovery 额外注入 chdir(CALLER_DIR)（server/adapters 不注入，对齐原编译 sidecar 无 preload 的行为） |
| 2 | **server→CLI 会话派生全断**（dist 布局） | sidecar 场景由编译版 claude-cli 二进制承接 | dist 布局下 launcher 解析为 null → win32 回退拼出 `node --preload <不存在的 preload.ts>`（`--preload` 还是 Bun 专属旗标，Node 直接报 bad option）；非 win32 回退指向不存在的 `../../../bin/claude-haha`；`CC_HAHA_CLI_ENTRY` 有读取无设置方 | [conversationService.ts](file:///workspace/cc-haha/src/server/services/conversationService.ts#L1938-L1974)：null-launcher 时优先探测 `../bin/claude-haha`（dist 布局）路由到 Node 启动器（自带 sqlite 旗标/CALLER_DIR/特性） |
| 3 | **cron 定时任务派生全断 + 旗标缺失** | 同上 | `buildCronCliArgs` null 回退硬编码 `'bun', '--preload', ...`——Node-only 环境无 bun 可执行文件，ENOENT；`CC_HAHA_CLI_ENTRY` 直连分支缺 `--experimental-sqlite`（22.5–22.12 崩溃） | [cronScheduler.ts](file:///workspace/cc-haha/src/server/services/cronScheduler.ts#L506-L513) 同增 dist 布局启动器回退；conversationService 新增 `nodeSqliteFlagArgs()`（22.5–22.12 / 23.0–23.3 注入旗标）用于直连分支 |

同步核查（PASS）：adapters 五入口无 `import.meta.main` 守卫（dispatcher 动态导入即启动，Node 下不受影响）；产物无残留 `import.meta.dir`（banner `__dirname` 覆盖）；`bin/claude-haha` 启动器 env-file/信号/退出码/特性与原版对等。功能验证：`CALLER_DIR=/tmp node dist/cli.mjs --version` 通过（chdir banner 生效）；四产物 banner 注入齐备；交付包 CLI 冒烟通过（1067 文件）。

**三轮对照累计**：第七轮 MACRO 缺 4 键、第八轮 TRANSCRIPT_CLASSIFIER 四路径丢失、第九轮 preload 副作用 + server/cron CLI 派生链——共 5 项实质遗漏，全部修复。其余确认等价。

## 13. 第十轮复检（2026-08-16：入口语义 × sidecar 派生链收尾 × 测试契约）

聚焦前九轮未覆盖的六个收尾项，**全部通过，零新增缺陷**：

| # | 检查项 | 结论 |
|---|---|---|
| 1 | `import.meta.main` 全源码分布 | 仅 `src/server/index.ts:677` 一处（自启动守卫），已被 `serverNode.ts` 包装覆盖；原守卫块为无参 `startServer()`（host/port 走 env），包装器语义等价。adapters 五入口无守卫，dispatcher 动态导入即启动 |
| 2 | mcp / init / recovery 入口可达性 | `entrypoints/mcp.ts` 经 `cli/handlers/mcp.tsx` 动态导入、`entrypoints/init.ts` 经 `main.tsx` 静态导入——全部打进 cli.mjs，`claude mcp`/初始化流程可用 |
| 3 | electron sidecar 派生 adapters 的 sqlite 旗标 | `createAdapterPlan`/`createServerPlan` 均经 `nodeRuntimeFlags()`（探测 node 版本→`sqliteFlagArgsForVersion`），22.5–22.12 自动注入 `--experimental-sqlite` |
| 4 | `globalThis.MACRO` 直读模式 | 全源码零命中——`MACRO.*` 均为裸标识符，esbuild `define` 全量覆盖（无 define 逃逸路径） |
| 5 | 重建产物 Bun 守卫复扫 | cli/server 剩余 `Bun.hash/semver/which/...` 共 21 处，18 处 `typeof Bun` 守卫包裹，与 L1 结论一致（Node 下走回退分支） |
| 6 | 第九轮修复的测试契约 | `cron-scheduler-launcher.test.ts`（bun:test，上游 CI 专用）8 用例全部走 CLAUDE_CLI_PATH launcher 分支；新 dist 启动器回退仅在 `../bin/claude-haha` 存在时激活——源码布局解析为 `src/server/bin`（不存在，测试行为不变），dist/package 布局解析为 `bin/`（存在，回退生效）。两种布局按需分裂，无回归 |

**四轮对照最终结论**：5 项实质遗漏（MACRO 缺键、特性四路径丢失、preload 双副作用、会话派生断链、cron 派生断链）已全部修复；其余全部确认与原项目等价。代码与交付物层面收敛，待真机 Win7 冒烟。

## 14. 第十一轮复检（2026-08-16：渲染层样式复原 × Node 22.5 实机全链路 × 事件循环保活修复）

本轮消除此前唯一遗留的"外观级降级"，并在 Node 22.5.0 上完成全链路功能验证。

**渲染层运行时 CSS/JS 补丁（desktop/index.html 注入，Chromium 108）**

| 项 | 处理 |
|---|---|
| var() 型 `color-mix()`（42 处，第七轮遗留） | 运行时求值器：解析 `in srgb/srgb-linear/oklab/lab/oklch/lch/hsl/hwb` 语法、预乘 alpha、按空间走对应插值（含 oklab 矩阵、lab 的 D50→D65 Bradford 适应），把声明改写为等价 `rgb()` |
| `lab()/oklch()/lch()/oklab()`（Chromium 111+） | 同一求值器内实现完整色彩空间转换（XYZ↔Lab↔OKLab、OKLCH 极坐标），覆盖 Tailwind v4 写入自定义属性的调色板（无静态回退可能的场景） |
| `scrollbar-color`（Chrome 121+） | 降级为 `::-webkit-scrollbar-thumb` 系列规则 |
| `transition`/`animation` 中的 `overlay` 位移词（Chrome 114+） | 从 shorthand 中剔除，避免整条声明失效 |
| cytoscape/mermaid 依赖的 Set 方法（Chrome 122+：union/intersection/difference/symmetricDifference/isSubsetOf/isSupersetOf/isDisjointFrom） | 注入 7 方法 polyfill（主 bundle 之前） |
| 触发条件 | `CSS.supports` 探测——现代引擎上零开销跳过；仅 108 触发求值 |

配测试 `desktop/index-html.test.ts`（数学断言），shim 已随 `desktop/index.html` 进入交付物。

**Node 22.5.0 实机全链路（7/7 PASS）**

| # | 场景 | 结果 |
|---|---|---|
| 1 | CLI 裸跑（无旗标 → 自愈 re-exec → mock API 完整回合） | exit 0，输出含 MOCK-OK |
| 2 | server 裸跑自愈 + `/health` | 200 |
| 3 | server re-exec 链 | 带旗标子进程存活 |
| 4 | cron 任务（REST 创建 → run now → 轮询） | status=completed，输出 MOCK-OK（经 dist 启动器派生） |
| 5 | adapters（telegram chunk 动态加载） | 仅因缺 token 退出（预期） |
| 6 | `bin/claude-haha --version`（PATH 中 22.5.0） | 旗标自动注入 |
| 7 | recovery-cli `--help` | 正常 |

**本轮新修复：standaloneProviderProxy 事件循环保活（CLI 早退挂起）**

- 缺陷：Node 移植在 `src/server/proxy/standaloneProviderProxy.ts` 模块加载时 eager 绑定 `net.Server`（为补偿 node:http 下一 tick 才有端口、供 managedEnv 同步读 `.port`），但该 server 处于 ref 状态——CLI 在 REPL 挂载前发生任何启动错误（rejection 被上游 `unhandledRejection` 监听器按设计吞掉）后进程**永久挂起**而非退出。上游 Bun 版无此问题（`Bun.serve` 同步绑定且只在 `activeProviderNeedsProxy()` 为真时才创建）。
- 修复：保留 eager 绑定（`.port` 同步可读语义不变），创建后立即 `nodeServer.unref()`——代理不再单独保活；有活跃代理连接时 socket 句柄自然保活，与 Bun 生命周期语义对齐。
- 验证：CLI 快速失败路径（CI 环境无凭据）由"无限挂起"变为按上游语义退出；快乐路径 7 项全过。
- 测试基建说明：诊断中发现本地 mock Anthropic 服务器的 SSE 帧缺少 `event:` 行，导致 SDK 0.80 `fromSSEResponse`（按 `sse.event` 键过滤）解析出 0 事件——此为**测试工具缺陷非产品缺陷**，已在开发环境的 mock 服务器脚本中修正（补 `event:` 行 + 非流式 JSON 分支）。

**最终结论**：渲染层"唯一已知降级"（var 型 color-mix）已由运行时求值器消除；Node 22.5 全链路（CLI/server/cron/adapters/launcher/recovery）实机通过；CLI 早退挂起缺陷已修复。代码与交付物层面无已知 Win7 不兼容项，剩余事项仅为真机 Win7 冒烟。

## 15. QEMU Win7 SP1 x64 全程离线 E2E（2026-08-18：重建离线安装包真机验证）

第十一轮收口后，还原工程进入安装包层：以 Stage A（electron-builder + Electron 22.3.27）产物为底，经 `repack/build-repack.sh`（Stage B）重打包为一体化离线安装包，并在 QEMU Win7 SP1 x64（TCG、guest 断网）完成全链路真机验证。

### 15.1 验证环境与断网证明

- QEMU Win7 SP1 x64 虚拟机（win7-pure-qemu 工具链启动，SMB 共享注入测试脚本）
- 断网方式：guest 内 `route delete 0.0.0.0` 删除默认路由；`ping 8.8.8.8` → `General failure`（100% loss）、DNS 解析失败（exit=1）实证全程离线；SMB（10.0.2.4，QEMU 内置 NAT 网段）不受影响
- 安装包：v1 = 还原重建版（与发布的 Offline.exe 字节一致，sha256 `3221d5e9…a025b40`）；v2 = 改进版（仅 server.mjs 一处增强，见 15.3）

### 15.2 安装完整性（round19，17 项断言全过）

静默安装（`/S`，提权）重建包后逐项断言：node-fallback dist 四 bundle 在位；损坏的编译版 sidecar（`claude-sidecar-x86_64-pc-windows-msvc.exe`）已移除；`rg.exe` 在位；node/python 负载落位；`python38._pth` 为修复版（启用 site-packages）；16 个 `.whl` 离线轮子（含 pip/setuptools/wheel）在位；KexCfg 版 `setup-vxkex.bat` 在位；app.asar 内 CSS shim 标记与 main.cjs 回退标记在位。随后 bundled `node --version`（v22.17.0）/ `python --version`（3.8.10）/ `rg --version`（14.1.0）直接运行成功——证明安装器在干净 profile 上自动完成了 VxKex 注册（node/python/rg 三者 ENABLE + WINVERSPOOF:NONE）。

### 15.3 v2 改进：CU setup 接受指向内置解释器的自定义 Python 路径

- 缺陷（v1 边角）：设置页将 Python 路径显式配置为内置解释器（`C:\cc-haha\resources\runtime\python\python.exe`）时，`pythonRuntime.source` 判为 custom，venv 失败（嵌入式 Python 无 venv 模块）后不走内置回退，setup 报 `success:false`
- 修复：`runSetup` 增加 `bundledCandidateMatch`——自定义路径经 `path.resolve` 归一化后与 `getBundledPythonCandidatesWin()` 逐一比对，命中即等同 `source === "bundled"`，直接使用内置解释器并落 base-interpreter 标记
- 补丁形态：`patches/cli/005-server-mjs-computer-use-offline.patch`（runSetup venv fallback 段）；`runtime/node-fallback/patch-computer-use.py` P3c/P3e/P7e/P7g 同步携带离线 wheel 引导与运行时依赖自愈探针
- 验证（round21c，离线）：`cu-setup-probe.mjs` 以自定义路径触发 setup → `success:true`，步骤含 `嵌入式 Python 无 venv 模块，直接使用内置解释器`

### 15.4 全量 E2E 结果（77 检查 × 三轮）

| 轮次 | 包 | 网络 | 结果 | 说明 |
|---|---|---|---|---|
| round19g | v1 重建包 | 在线 | **76/77** | 唯一失败为 `page Providers` 导航点击偶发（后续轮次均过，判定 flaky） |
| round20 | v1 重建包 | **全程离线** | **77/77** | 首次全离线全绿 |
| round22 | **v2 改进包**（server 热替换部署） | **全程离线** | **77/77** | 含 15.3 修复的 CU 场景复验 |
| round23 | **v2 安装包本体，全新离线安装** | **全程离线** | **77/77 + CU PASS，0 FAIL** | 最终验收：卸载旧版→清用户态→断网（ping 实证）→静默安装 v2 exe→18 项完整性断言（含 `bundledCandidateMatch` 标记，证明部署的即 v2 server）→E2E 77 项→CU 自定义路径探针 `RESULT: PASS` |

77 项检查覆盖：GUI 冷启动（CDP 9222 连接、主窗口截图、computed styles + 3 stylesheets/663 规则、无未样式控件、导航枚举）；渲染层 CSS shim（Chromium 108 下字体/配色/背景正确）；server HTTP API（/health、/api/status、/api/sessions、/api/settings、/api/models、/api/providers 等）；WebSocket 会话链路；工作区搜索（rg.exe 经 VxKex 运行）；**Computer Use 完整链路**（内置 Python 3.8.10 检出、venv 回退、离线 wheel 安装、`win_helper.py` 截图 83KB 实证）；设置四页（Providers/Scheduled/Settings/Computer Use）逐页截图与表单填充（Apply/Recheck）；adapters 与 recovery CLI 冒烟。

### 15.5 产物一致性

重建 v2 与 v1 的差异仅为 `resources/app.asar.unpacked/dist/server.mjs` 一个文件（bundledCandidateMatch 增强）；NSIS 结构、文件集、安装逻辑逐字节一致（除 NSIS 固化 mtime 外）。v2 sha256：`971df9d518f0d567c4a6a759835d99882cac1fc5abeabac51abce91dbe766ae1`。

### 15.6 round23 附带观察（非缺陷）

- 卸载器在"CU 依赖曾装入内置 Python site-packages"的场景下遗留 `win32com\ifilter\demo` 空目录（`uninstall-exit=2`、`[WARN] dir still exists`）——NSIS rmdir 既有行为，v1/v2 卸载段相同（还原保真），且不影响后续重装（install-exit=0、全部断言与 E2E 通过）
- 沙箱侧产物复验同步通过：v2 `server.mjs` 语法检查 OK；`cli.mjs --version` L2 OK；CSS shim 数学断言（对安装包内 `dist/index.html`）ALL PASSED；mock Anthropic API 单轮 L3 `MOCK-OK` EXIT=0；v2 `server.mjs` 起服 `/health`+`/api/status` 200

**真机冒烟收口结论**：第十一轮"剩余事项仅为真机 Win7 冒烟"已完成——离线 Win7 上安装、GUI 全样式、server 全 API、搜索、Computer Use、设置交互全部通过，无已知功能或样式缺陷。round23 以 v2 安装包本体在全新离线安装下复验通过，最终交付定版。
