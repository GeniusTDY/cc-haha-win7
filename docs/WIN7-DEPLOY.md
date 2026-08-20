# cc-haha Win7 移植版 · 部署手册

> 基于 NanmiCoder/cc-haha 最新版的完整 Bun → Node.js 移植。所有产物已彻底去除 Bun 运行时依赖，仅依赖 Node.js ≥ 22.5.0（因使用内置 `node:sqlite`）。

---

## 1. 产物清单

```
cc-haha-win7-port/
├── package/                     ← 可部署产物（拷贝到目标机即可）
│   ├── bin/
│   │   ├── claude-haha          Linux/macOS 启动器（Node 版，替代原 Bun 启动器）
│   │   ├── claude-haha.cmd      Windows 启动器（内部路由至 JS 启动器，自动附加 sqlite 旗标）
│   │   ├── server-haha          桌面后端启动器（Linux/macOS）
│   │   └── server-haha.cmd      桌面后端启动器（Windows）
│   ├── dist/
│   │   ├── cli.mjs              CLI 主程序（自包含 bundle，约 25 MB）
│   │   ├── server.mjs           桌面版后端服务（自包含 bundle，约 23 MB）
│   │   ├── recovery-cli.mjs     恢复模式 CLI
│   │   ├── adapters.mjs         IM 桥接调度入口（飞书/Telegram/微信/钉钉/WhatsApp）
│   │   ├── adapters-chunks/     各 IM 适配器按需加载的分块 bundle
│   │   ├── index.html           Electron 渲染层入口（Chromium 108 目标构建）
│   │   ├── assets/              渲染层 JS/CSS 产物（lightningcss 降级后）
│   │   └── vendor/ripgrep/x64-win32/rg.exe   内置 Grep 工具二进制（Win7 兼容版 14.1.0）
│   ├── desktop-electron/        Electron 桌面壳（需配合 Electron 运行）
│   │   ├── main.cjs
│   │   ├── preload.cjs
│   │   ├── pet-preload.cjs
│   │   └── preview-preload.cjs
│   └── package.json
├── port-src/                    ← 移植源码（兼容层 + 构建脚本，可复现构建）
│   ├── scripts/node-port/       build.mjs（CLI/Server）、build-electron.mjs（桌面壳）、
│   │                            build-preview-agent.mjs、cli-entry-wrapper.mjs
│   └── src/compat/              Bun API 兼容层：bunSpawn / bunServe / bunFile /
│                                bunSqlite / bunBundle
├── WIN7-DEPLOY.md               本手册
└── VERIFICATION-REPORT.md       移植验证报告（L1–L4）
```

产物不包含 sourcemap（减小体积）；调试需要时用 `port-src` 自行重建。

## 2. 系统要求

| 项目 | 要求 | 说明 |
|---|---|---|
| 操作系统 | Windows 7 SP1 x64（或 Linux/macOS） | 桌面壳另见 §5.3 |
| Node.js | **≥ 22.5.0**（**推荐 ≥ 22.13.0**） | `node:sqlite` 于 22.5.0 引入；**22.5.0–22.12.x 与 23.0–23.3.x 需 `--experimental-sqlite` 旗标**（22.13.0 / 23.4.0 起免除）。本包全部启动器（bin\claude-haha.cmd、bin\server-haha.cmd、桌面壳 sidecar 回退）已按版本自动附加该旗标，**直接 `node dist\*.mjs` 裸跑才会踩坑** |
| 网络 | 需访问 Anthropic API（或自设 `ANTHROPIC_BASE_URL`） | Node 自带 OpenSSL（不依赖系统 SChannel），TLS 1.2 开箱可用 |
| 内存 | ≥ 2 GB 空闲 | bundle 约 65 MB 加载后常驻 300–500 MB |

**推荐一并安装的组件**（影响 Shell 工具与交互体验，agent 核心不依赖）：

- **WMF 5.1**（Windows Management Framework 5.1，Win7 SP1 可装）——把 PowerShell 升到 5.1；或安装 **Git Bash ≤ 2.45**（二者任一即可，无 Git Bash 时自动使用 PowerShell）。注意：Git for Windows 自 2.46 起要求 Win10+，Win7 请装 2.45.x 或更早
- **ConEmu**（可选）——Win7 上的 VT 终端，交互式 TUI 渲染最佳；原生 conhost 也可用（按键绑定自动降级）。mintty 不是真控制台，直连会令 TUI 退化，需 `winpty node ...` 包一层，不如 ConEmu 省事

### 2.1 在 Win7 上获取 Node.js ≥ 22.5（关键步骤）

官方 Node.js 自 v14 起拒绝在 Win7 上运行（最后官方支持 Win7 的是 v12.x）。三条可行路径，按推荐顺序：

**路径 A（推荐）：社区 Win7 backport 构建 ≥ 22.5**

- 参考项目：alex0x08 的 Node.js Win7 backport（已验证可把 v22 线移植到 Win7，文章见 habr.com «Бекпорт на примере Node.js v22 и Windows 7»），以及 vladimir-andreevich/node.js-windows-7（已产出 v20 的 Win7 构建）。
- 注意：alex0x08 公开构建停在 **v22.3.0，不含 `node:sqlite`**，不满足本移植要求。需将其补丁集套用到 **v22.5.0 及以上**标签自行构建（其补丁线从 20 → 22.3 已验证可升级，同线升到 22.5+ 工作量小）。
- 构建要求：VS2022 + Python，按上游 Node 构建文档执行。

**路径 B（零成本试验）：官方 node.exe + 平台检查豁免**

1. 下载官方 `node-v22.x-win-x64.zip`（zip 版，不要 msi——msi 安装器会直接拒绝 Win7）。
2. 解压后设置环境变量 `NODE_SKIP_PLATFORM_CHECK=1`，绕过 node.exe 启动时的系统版本门禁。
3. 实测反馈：v18 x86 在 Win7 上以此方式可运行；v22 x64 在 Win7 上**不保证**——若 V8/libuv 调用了 Win8+ 内核 API 会启动即崩。先跑 `node -p "require('node:sqlite')"` 验证。

**路径 C（保底，功能零损失）：旁路部署**

Win7 只跑桌面壳（Electron 22，见 §5.3），`dist/server.mjs` + `dist/cli.mjs` 部署在局域网内任意 Win10+/Linux 机器上，桌面壳通过 `CC_HAHA_DESKTOP_SERVER_URL` 指向远端服务。此路径 100% 保留全部功能，规避 Win7 运行时问题。

## 3. 部署步骤

1. 将 `package/` 整目录拷贝到目标机，例如 `C:\cc-haha\`。
2. 确认 Node 可用：
   ```cmd
   C:\cc-haha> node --version
   v22.18.0        ← 需 ≥ v22.5.0
   C:\cc-haha> node -e "require('node:sqlite'); console.log('sqlite OK')"
   sqlite OK       ← 路径 B 下必须先通过此步
   ```
3. 冒烟验证：
   ```cmd
   C:\cc-haha> bin\claude-haha.cmd --version
   999.0.0-local (Claude Code)
   ```
4. （可选）把 `C:\cc-haha\bin` 加入 `PATH`，即可直接使用 `claude-haha`。

## 4. 环境变量参考

| 变量 | 作用 | 默认 |
|---|---|---|
| `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` | API 凭证与端点（兼容任意 Anthropic 协议网关） | — |
| `ANTHROPIC_MODEL` / `ANTHROPIC_SMALL_FAST_MODEL` | 主/辅模型 | 内置默认 |
| `CC_HAHA_SKIP_DOTENV=1` | 跳过根目录 `.env` 加载（.cmd 启动器已默认置 1） | 未设置 |
| `CC_HAHA_FEATURES` | 特性开关（启动器默认 `TRANSCRIPT_CLASSIFIER`） | 同左 |
| `CLAUDE_CODE_FORCE_RECOVERY_CLI=1` | 强制进入恢复 CLI | 未设置 |
| `CLAUDE_CONFIG_DIR` | 配置/会话持久化目录（含 sqlite） | `~/.claude` |
| `IS_SANDBOX=1` | 无权限/容器环境下跳过 root 权限拦截 | 未设置 |
| `NODE_SKIP_PLATFORM_CHECK=1` | 仅路径 B：豁免官方 node.exe 的 Win8.1+ 门禁 | 未设置 |
| `CC_HAHA_NODE` | 仅 .cmd 启动器：指定 node.exe 全路径 | PATH 上的 node |

## 5. 三种运行模式

### 5.1 CLI（交互/单次）

```cmd
bin\claude-haha.cmd                        rem 交互式会话
bin\claude-haha.cmd -p "你的提示词"         rem 单次执行
bin\claude-haha.cmd --dangerously-skip-permissions -p "..."
```

### 5.2 Server（桌面版后端，可独立于桌面壳运行）

```cmd
bin\server-haha.cmd --host 127.0.0.1 --port 3456
```

提供 HTTP API + WebSocket（`/ws/<sessionId>`，Bearer 鉴权），供桌面壳或远程客户端连接。`server-haha.cmd` 会按 Node 版本自动附加 `--experimental-sqlite`（22.5–22.12 必需）；坚持裸跑 `node dist\server.mjs` 时需自行补该旗标。

### 5.2.1 IM 桥接（adapters，需桌面服务已运行）

五个 IM 适配器已全部打包（`dist/adapters.mjs` 按需加载 `dist/adapters-chunks/`）：

```cmd
node dist\adapters.mjs --telegram   rem 另有 --feishu / --wechat / --dingtalk / --whatsapp
```

各适配器凭证通过环境变量或 `~/.claude/adapters.json` 提供（如 `TELEGRAM_BOT_TOKEN`；缺凭证时启动会明确报缺哪项）。桌面壳内置的 IM 入口在无编译 sidecar 时也会自动走此 Node 产物。

### 5.3 Desktop（Electron 桌面壳）

- `desktop-electron/*.cjs` 需放入 Electron 应用的入口位置（替换原 `desktop/electron-dist/` 产物），应用根目录需能向上找到 `dist/server.mjs`（建议直接以本包 `package/` 根作为 Electron 应用根，即 `package/electron-dist/` 放四个 .cjs，或设 `CC_HAHA_SERVER_MJS` 指定绝对路径）。渲染层入口已内置：`package/dist/index.html` + `assets/`（渲染入口与后端 bundle 同住 `dist/`，二者互不干扰；`dist/` 同时作为手机 H5 访问的静态目录）。
- **Win7 上必须使用 Electron 22.x**（最后一个支持 Win7 的 Chromium/Node 组合）。Electron 22 主进程内置 Node 16，而桌面壳仅做窗口/进程管理——真正的 agent 运行时是它拉起的系统 Node ≥22.5 子进程（`dist/server.mjs`）。
- **Electron 22 API 兼容（已内置，无需手动处理）**：预览面板在 Electron 28+ 走 `WebContentsView`，在 22 上自动回退 `BrowserView`；`electron-updater` 缺失时自动禁用自动更新（仅告警）；Win7/8 自动关闭硬件加速走软件合成，避免 GPU 进程崩溃循环白窗。渲染层构建经 lightningcss 以 `chrome 108` 为目标降级（Tailwind v4 的 oklch/嵌套已转译），构建期无法转译的 var() 型 `color-mix` 与自定义属性内的 `lab()/oklch()` 调色板由 `index.html` 内置运行时求值器补齐。
- **sidecar Node 回退**：上游桌面壳原通过编译版 `claude-sidecar-*.exe` 拉起后端与 IM 桥接；本移植检测到该二进制缺失时，自动改用系统 Node 运行 `dist/server.mjs` / `dist/adapters.mjs`（含 sqlite 旗标探测）。要求 `node.exe` 在桌面壳进程的 PATH 上，或设 `CC_HAHA_NODE_EXE` 指向全路径；`CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS` 可覆盖脚本定位。
- 终端集成：node-pty 1.x 仅支持 ConPTY（Win10 1809+）。Win7 上加载或 spawn 失败时，桌面壳**自动降级为管道式终端**（行式 shell 可用，全屏程序降级，启动时有提示）。追求完整 TTY 仿真的进阶选项：将 `node_modules/node-pty` 替换为 `0.11.0-beta37`（最后含 winpty 的版本）并为 Electron 22 重编原生模块（需 VS Build Tools）。
- 远程模式（路径 C）：设置 `CC_HAHA_DESKTOP_SERVER_URL=http://<server-host>:3456`。

## 6. Win7 已知限制与风险

| 项 | 状态 | 影响 |
|---|---|---|
| `node:sqlite` 实验特性 | Node 侧仍标记 experimental（启动时一条警告，已由启动器抑制）；**22.5–22.12 / 23.0–23.3 需 `--experimental-sqlite`**，全部启动器已自动附加 | 用启动器即无感；仅裸跑 `node dist\*.mjs` 时需自查 Node 版本（推荐 ≥22.13） |
| ripgrep 二进制 | **已内置**：包内 `dist/vendor/ripgrep/x64-win32/rg.exe`（ripgrep 14.1.0，PE 导入表已验证仅含 Win7 可用 API，SubsystemVersion 6.0），CLI 自动发现 | Grep 工具开箱即用；2024-05 后的 rg 版本不再支持 Win7，勿自行升级替换 |
| 桌面终端（node-pty） | **已修（winpty 后端）**：Win7/8 强制 `useConpty:false`（补丁 003）走 node-pty 1.1.0 自带的 winpty 载荷（N-API `pty.node` + `winpty-agent.exe`/`winpty.dll`，vendored 于 `runtime/node-pty-win32-x64/`，repack 步骤 6/8 保证不被裁剪） | 完整 TTY 仿真——vim/htop 等全屏程序、resize 均正常；仅当 winpty 载荷损坏时才降级为管道式终端（启动有提示，行式 shell 仍可用） |
| 交互式 TUI 按键 | **已修**：VT 模式判定加入 OS 版本门控（Win7 conhost 无 VT 输入），自动使用非 VT 按键绑定 | 交互模式在 cmd.exe/conhost 中按键可用；建议配合 ConEmu/mintty（Win7 上支持 VT）获得完整体验 |
| 沙箱隔离（sandbox-runtime） | 平台门控为 macOS/Linux/WSL2——**上游原版在任何 Windows 上都不启用**，非移植回归 | Windows 上（含 Win10/11）一律使用常规权限模式 |
| Shell 工具 | bash（Git Bash）或 PowerShell 二选一；Win7 原生仅 PS 2.0 | **装 WMF 5.1**（Win7 SP1 支持）或 Git Bash；Bash 工具的 shell 解析链（补丁 004）：用户 Git for Windows → 内置 PortableGit 2.45.2（`runtime/git`，已入库，repack 步骤 7/8 自动打包）→ PATH bash，均无时提示安装或设 `CC_HAHA_BASH_EXE`；桌面终端 shell 无 Git Bash 时自动用 PowerShell |
| 可选集成（sharp / AWS Bedrock / Vertex / OTel 导出器 / audio-capture） | 未打进 bundle（与官方 Bun 构建一致的可选依赖策略） | 需要时在部署目录 `npm install <包>` 后自动生效 |
| IM 桥接（adapters） | **已打包**：飞书/Telegram/微信/钉钉/WhatsApp 五个适配器（真实 baileys 等依赖已内联，按需分块加载） | 凭证就绪即可用；沙箱内已验证 chunk 加载与缺凭证校验路径 |
| Electron 22 = Chromium 108 | 桌面壳渲染层为 2022 引擎 | JS 已按 chrome108 目标构建（无 108 之后的语法/内置）；CSS 经 lightningcss 降级 + `index.html` 内置运行时补丁（`CSS.supports` 探测触发）：var() 型 `color-mix`、`lab()/oklch()` 系色彩函数在 108 上运行时求值为等价 `rgb()`，`scrollbar-color` 降级为 `::-webkit-scrollbar-*`，`overlay` 过渡词剔除；另注入 Set 七方法 polyfill（cytoscape/mermaid 依赖）。现代引擎自动跳过，零开销 |
| 桌面预览面板 | **已修**：Electron 28+ 的 `WebContentsView`/`contentView` 在 22 上自动回退 `BrowserView`/`addBrowserView` | Win7 上预览面板（网页预览/截图/选区）可用 |
| 自动更新（electron-updater） | **已修**：懒加载 + no-op 回退 | 最小化部署（无 node_modules）不再启动崩溃；更新功能自动禁用并告警 |
| GPU 合成 | **已修**：Win7/8 自动 `app.disableHardwareAcceleration()` | 软件合成，规避老显卡驱动下 GPU 进程崩溃循环白窗 |
| TLS | Node 自带 OpenSSL，与系统 SChannel/IE 设置无关 | TLS 1.2 开箱可用；若走系统代理注意代理本身支持 |
| 路径 B（官方 node.exe） | 社区经验仅验证到 v18 on Win7 | v22 可能因内核 API 缺失启动失败——务必先过 §3 第 2 步 |

## 7. 部署后快速验证

```cmd
rem L2：启动与版本
bin\claude-haha.cmd --version
bin\claude-haha.cmd --help

rem L3：单轮 agent + 工具执行（需可达的 API 端点）
bin\claude-haha.cmd --dangerously-skip-permissions -p "创建文件 hi.txt 内容为 ok，然后读出它"

rem L4：桌面服务模式（本地验证，可配合任意 WS 客户端）
bin\server-haha.cmd --host 127.0.0.1 --port 3456
```

沙箱内已完成的完整验证（含 mock API 端到端、桌面 WS 会话流）见 `VERIFICATION-REPORT.md`。

## 8. 故障排查

| 症状 | 原因与处置 |
|---|---|
| `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` | Node 22.5–22.12 / 23.0–23.3 且未加旗标。用 `bin\claude-haha.cmd` / `bin\server-haha.cmd` 启动（自动附加），或升级 ≥22.13，或裸跑时手动加 `--experimental-sqlite` |
| `node: cannot find module 'node:sqlite'`（加旗标后仍报） | Node < 22.5。升级运行时（§2.1） |
| node.exe 弹窗 "only supported on Windows 8.1..." | 未设 `NODE_SKIP_PLATFORM_CHECK=1`，或改用路径 A/C |
| `--dangerously-skip-permissions cannot be used with root` | 设置 `IS_SANDBOX=1`（容器/高权限账户场景） |
| API 连接失败 | 检查 `ANTHROPIC_BASE_URL`、代理变量（Win7 下注意 `HTTP_PROXY/HTTPS_PROXY` 大小写）；Node 侧 TLS 无需系统设置 |
| 桌面壳起不来后端（日志含 sidecar not found / spawn 失败） | 桌面壳 PATH 上无 node.exe：设 `CC_HAHA_NODE_EXE` 指向全路径，并确认应用根可定位 `dist\server.mjs`（或设 `CC_HAHA_SERVER_MJS`） |
| 桌面壳白屏 | Electron 22 渲染层限制，重启壳；确认 `CC_HAHA_DESKTOP_SERVER_URL` 指向可达的 §5.2 服务 |
| 桌面终端标签报错/降级提示 | Win7 上预期行为：node-pty 仅支持 ConPTY（Win10+），已自动降级为管道式终端；行式 shell 正常即属正常。需完整 TTY 仿真见 §5.3 的 node-pty 降级方案 |
| Grep 工具不可用 | 内置 rg 位于 `dist\vendor\ripgrep\x64-win32\rg.exe`，确认未被删；或设 `CC_HAHA_RIPGREP_PATH` 指向兼容版本（2024-05 前构建） |
| IM 适配器启动报缺 token | 预期校验路径：补齐环境变量或 `~/.claude/adapters.json` 对应凭证后重启 |
| 终端乱码/无输出 | 中文代码页建议 `chcp 65001`；交互式 TUI 建议用 ConEmu（mintty 需 winpty 包裹） |

---

*构建复现：在含 Node ≥22.5 的机器上，于仓库根目录执行 `node scripts/node-port/build.mjs && node scripts/node-port/build-electron.mjs`（`port-src/` 内为全部移植侧脚本与兼容层，esbuild 0.28.2 及双平台二进制已内置于 `port-src/vendor/node_modules/`，零联网、无需先 `npm i`；如需完整 adapters.mjs，先 `cd adapters && npm install`）。*
