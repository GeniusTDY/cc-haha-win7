# patches/ — 相对上游 NanmiCoder/cc-haha v0.5.4 的 Win7 移植增量

[English](README.md) | **简体中文**

基线：上游 tag/commit `d52bbec7`（"chore(release): prepare v0.5.4"）。
按补丁编号顺序应用。所有路径相对上游仓库根目录（`desktop/` 是 Electron 应用子项目）。

| # | 文件 | 应用对象 | 摘要 |
|---|---|---|---|
| 1 | `desktop/001-package-json-electron22.patch` | `desktop/package.json` | 固定 Electron 22.3.27（最后支持 Win7 的大版本，Chromium 108/Node 16.17）+ electron-builder 26.8.1 |
| 2 | `desktop/002-index-html-css-shim.patch` | `desktop/index.html` | Chromium 108 CSS 垫片：color-mix()/lab()/oklch()/lch()/oklab() 求值 + 滚动条回退，主题切换时重跑；另含 Set 七方法 polyfill（union/intersection/difference/symmetricDifference/isSubsetOf/isSupersetOf/isDisjointFrom —— Chrome 122+，cytoscape/mermaid 依赖） |
| 3 | `desktop/003-terminal-winpty-fallback.patch` | `desktop/electron/services/terminal.ts` | Win7/8 强制 node-pty 的 winpty 后端（`useConpty:false`）+ node-pty 无法加载/派生时的行式管道回退 |
| 4 | `cli/004-shell-win32-bash-resolution.patch` | `src/utils/Shell.ts`、`src/utils/windowsPaths.ts` | Bash 工具的 Windows shell 解析链：用户 Git → 捆绑 `runtime/git-2.45.2` PortableGit（`CC_HAHA_BASH_EXE`/`CC_HAHA_RUNTIME_DIR`/相对路径探测）→ PATH 上的 bash |
| 5 | `cli/005-server-mjs-computer-use-offline.patch` | `dist/server.mjs`（node-port bundle） | 捆绑 Python 检测、离线 wheel 安装（--no-index）、venv 回退到捆绑 python.exe。**历史存档**：针对 2026-08-18 构建的 diff；844024a9 重建后行偏移已变，对当前 build.mjs 产物 `git apply` 会失败——全新重建请用 `runtime/node-fallback/patch-computer-use.py`（标识符自适应，含 win32 CLI spawn 链与 cli.mjs VT 输入门控在内的完整 P1–P10 集） |
| 6 | `electron-builder/006-nsis-target-nowine.patch` | `node_modules/app-builder-lib/.../NsisTarget.js` | Linux 上免 wine 的卸载器提取（所有非 Windows 主机走 UninstallerReader） |
| 7 | `desktop/007-session-title-locale.patch` | `desktop/src/**`（10 处标题显示点 + 5 个语言包） | 占位会话标题的显示层映射 `displaySessionTitle()`（'New Session'/'Untitled Session' 数据层哨兵原样保留，界面按语言渲染 `t('session.untitled')`）；同时退役废弃的 `tabs.untitled` 键 |
| 8 | `desktop/008-brand-fork-etiquette.patch` | `desktop/package.json`、`desktop/src-tauri/tauri.conf.json`、`desktop/src/{components/layout/Sidebar,pages/ActivitySettings,pages/settings/AboutSettings}.tsx` + 测试 + 5 个语言包、`src/server/services/desktopUiPreferencesService.ts` | 仓库身份指向 GeniusTDY/cc-haha-win7（package.json homepage + electron-updater 发布目标、tauri 更新器端点、侧栏链接、后端 DEFAULT_PROFILE_SUBTITLE），同时按 fork 礼仪将上游放在首位致谢：About 的 "GitHub Repo"/"Author" 卡片以两行条目先列上游再列本 fork/维护者并附提示行，活动页 profile 在副标题仍为默认值时同时展示两条链接（五个语言包新增 `upstreamHint`/`upstreamAuthorHint`/`forkMaintainerHint` 键） |
| 9 | `desktop/009-changelog-modal.patch` | `desktop/src/pages/settings/AboutSettings.tsx`、`desktop/src/lib/changelogContent{,Data}.ts` + 5 个语言包 | 应用内更新日志弹窗，取代跳转上游 GitHub releases 的浏览器跳转：预烘焙双语语料（上游全部 40 个 release，中英文拆分与 Installation 小节剔除在生成期固化）、带回退的语言映射、裸 `#issue` 引用链接化到上游 tracker、弹窗内版本切换器带"当前版本"指示（五个语言包新增 `settings.about.currentVersion` 键）；同时退役不再使用的 GITHUB_RELEASES 常量 |
| 10 | `desktop/010-providers-changed-refresh.patch` | `desktop/src/types/chat.ts`、`desktop/src/stores/{chatStore,providerStore,providerStore.test}.ts` | 桌面端监听服务端 `providers_changed` 事件（provider 创建/更新/删除/激活/重排/导入时发出）：`chatStore` 暴露 `registerProvidersChangedHandler()` 并分发事件原因，`providerStore` 注册 500 ms 防抖的 `fetchProviders()` 刷新——在一个窗口导入或更新 provider 后，其余所有打开的窗口自动刷新，无需手动重载 |
| 11 | `desktop/011-h5-input-width-fix.patch` | `desktop/index.html` | H5 访问"访问主机/IP"行：视口断点 `sm:grid-cols-[minmax(0,1fr)_9rem_9rem]` 按窗口而非网格自身盒子宽度生效，设置页多层卡片嵌套下弹性列被压扁，输入框只有窗口最大化时才能完整显示；改为在该行父包装上设 `container-type:inline-size`，容器宽度不足 28rem 时退回单列 `minmax(0,1fr)`，按容器真实宽度响应（容器查询与 `:has()` 均为 Chromium 105+，Electron 22 的 108 原生支持） |
| 12 | `desktop/012-button-nowrap-fix.patch` | `desktop/index.html` | `button.inline-flex{white-space:nowrap}`：固定高度按钮（h-6=24px 等）未禁用换行，flex 行空间紧张时 CJK 标签（设置→诊断的"刷新"/"重建本地索引"）折成两行，约 27px 的行盒画出按钮边框；nowrap 保持标签单行并恢复 min-content 宽度保护，flex 不再把按钮压到标签宽度以下 |
| 13 | `desktop/013-intranet-mode-ui-gates.patch` | `desktop/src/{types/{settings,chat},stores/{settingsStore,chatStore,updateStore}}.ts`、`desktop/src/pages/{settings/{GeneralSettings,AboutSettings},ComputerUseSettings,Market}.tsx`、`desktop/src/components/layout/Sidebar.tsx`、`desktop/electron/services/{intranetMode,shell,updater}.ts`、5 个语言包 | 内网模式·桌面端：设置→通用页新增总开关（乐观更新、从服务端水合）；服务端 `network_policy_changed` 广播把权威值镜像进每个已打开窗口，即时生效无需重启；在线专属 UI 隐藏（关于页更新卡片 + GitHub/社媒链接、侧边栏技能市场入口 + 已打开市场标签页的"不可用"提示、Computer Use 的"下载 Python 3"按钮——离线包内置 Python，状态检测/路径配置保留）；主进程权威闸门每次调用无缓存读 `<CLAUDE_CONFIG_DIR>/settings.json`——`openExternalUrl()` 在加载 electron 模块之前就拒绝 http(s)（mailto/系统设置协议放行），`checkForUpdates()` 不触碰 electron-updater 直接返回空并清掉待装更新 |
| 14 | `cli/014-intranet-mode-network-policy.patch` | `src/utils/networkPolicy.ts`、`src/tools/WebSearchTool/{WebSearchTool,backend}.ts`、`src/tools/WebFetchTool/utils.ts`、`src/utils/telemetry/instrumentation.ts`、`src/server/{index,services/conversationService,middleware/errorHandler,ws/{events,handler},api/{settings,haha-oauth,haha-grok-oauth,haha-openai-oauth}}.ts` | 内网模式·服务端/CLI：`src/utils/networkPolicy.ts` 每次调用无缓存读 `~/.claude/settings.json` 的 `intranetMode`，翻转开关对已运行会话的下一次工具调用即时生效；遥测全关（OTLP + BigQuery + 初始化，覆盖 shell 继承来的 `CLAUDE_CODE_ENABLE_TELEMETRY=1`）；OAuth start/callback 返回 403 `INTRANET_MODE_DISABLED`，status 不做出站刷新直接报未登录（裸 `/callback*` 路由同样 403）；WebSearch 禁用一切后端并向模型说明（"内网模式已禁用 WebSearch——请勿重试，改用会话内容与本地文件作答"）；WebFetch 保留对内网纯 HTTP 服务的访问（跳过 http→https 升级与出站域名黑名单预检）；CLI 子进程注入 `CC_HAHA_INTRANET_MODE=1` + `CLAUDE_CODE_ENABLE_TELEMETRY=0`；`PUT /api/settings/user` 把开关广播给所有已连接客户端 |

Electron 主进程的 node-runtime 回退层不是编号补丁：它以编译产物
`port-src/desktop-electron/*.cjs` 交付（与 shipped 的 `app.asar`
字节一致；`main.cjs` 同时携带回退层与 winpty 强制——即补丁 003 加进
TS 源码的那段 hunk）。Stage A 从源码重建时必须在 electron-builder
打包 asar **之前将其叠加到 `desktop/electron-dist/`**（见根 README
Stage A 演练中的 `cp ../port-src/desktop-electron/*.cjs electron-dist/`
步骤）——上游 TS 源码不含回退层，缺此覆盖打出的 app.asar 在
Stage B 删除损坏 sidecar 后 server 无法启动。从 TS 重新编译 main.cjs
需手工补回回退层；叠加已入仓的编译产物才是可重现路径。（补丁 003
把该产物的管道回退移植进了 TS 源码，从源码重建保留这一半；
node-runtime 回退另一半只存在于编译产物中。）

## 源码叠加缺口（Source-level overlay gap）

补丁系列并非完整的移植增量。在全新上游克隆上构建 `dist/*.mjs`
还需以下仅存在于工作树的改动，本仓库未将其作为补丁携带：

- 叠加 `port-src/src/compat/` → `src/compat/` 与
  `port-src/src/entrypoints/serverNode.ts` → `src/entrypoints/serverNode.ts`
  （build.mjs 中的 esbuild `bun:sqlite` / `bun:bundle` 别名解析到
  `<root>/src/compat/…`，全新克隆中不存在该目录）；
- 上游源码的五处 Bun 调用点改写：
  `src/server/index.ts`（`Bun.serve` → `nodeServe`）、
  `src/server/api/sessions.ts` + `src/server/api/computer-use.ts`
  （`Bun.spawn` → `nodeBunSpawn`）、`src/server/staticH5.ts` +
  `src/server/api/previewFs.ts`（`Bun.file` → `nodeBunFile`）；
- 三处服务层改写（2026-08-21 会话 spawn 修复，均已包含在发布的
  `runtime/node-fallback/server.mjs` 中）：
  `src/server/services/conversationService.ts`、
  `src/server/services/cronScheduler.ts`、
  `src/server/services/diagnosticsService.ts`
  （`Bun.spawn` → `nodeBunSpawn`——会话派生、cron 调度器、
  `openLogDir` ×3；`src/utils/ripgrep.ts` 中内嵌 rg 的 `--version`
  探测仍用 `Bun.spawn`，Node 下为不可达死代码——桌面端捆绑原生
  rg.exe）；
- 同一重建中的两处语义修复：`shouldStripInheritedProviderEnv`
  （conversationService 与 cronScheduler 各一处）仅在配置了 provider
  时剥离 `ANTHROPIC_*`——`providerId === null` 保留继承环境变量，
  纯环境变量配置仍可完成认证；cronScheduler 的
  `buildCronCliArgs`/`resolveCronProjectRoot` 从 Bun 专属的
  `import.meta.dir` 回退到 `fileURLToPath(import.meta.url)`；
- 上游根目录依赖（67 项：axios、lodash-es、react 等）必须先安装
  （`bun install` / `npm install`）——本仓库只内置 esbuild 与
  desktop 依赖树。

实测：在全新 `d52bbec7` 克隆 + 补丁 001–004 + `cp -r port-src ./` 上
运行 build.mjs 会报约 2000 个 unresolved 模块错误。本仓库支持的
全离线可重现路径是 **仅 Stage B**：`runtime/node-fallback/` 内置
预构建 dist bundle，build-repack.sh 步骤 4/9 将其部署进安装器，
与任何 Stage A 构建无关。

## 应用

```bash
# 布局同根 README 的 Stage A 演练：上游克隆与本仓库（cc-haha-win7）
# 并列放置，因此在克隆内部以 ../cc-haha-win7/ 访问本仓库的一切。
git clone https://github.com/NanmiCoder/cc-haha && cd cc-haha
git checkout d52bbec7
git apply ../cc-haha-win7/patches/desktop/001-package-json-electron22.patch
git apply ../cc-haha-win7/patches/desktop/002-index-html-css-shim.patch
git apply ../cc-haha-win7/patches/desktop/003-terminal-winpty-fallback.patch
git apply ../cc-haha-win7/patches/desktop/007-session-title-locale.patch
git apply ../cc-haha-win7/patches/desktop/008-brand-fork-etiquette.patch
git apply ../cc-haha-win7/patches/desktop/009-changelog-modal.patch
git apply ../cc-haha-win7/patches/desktop/010-providers-changed-refresh.patch
git apply ../cc-haha-win7/patches/desktop/011-h5-input-width-fix.patch
git apply ../cc-haha-win7/patches/desktop/012-button-nowrap-fix.patch
git apply ../cc-haha-win7/patches/desktop/013-intranet-mode-ui-gates.patch
git apply ../cc-haha-win7/patches/cli/014-intranet-mode-network-policy.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch
# 构建出 node-port bundle（dist/server.mjs）之后：
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs
#   （补丁 005 是 2026-08-18 的历史 diff——见其 STATUS NOTE；
#    自适应脚本应用同一 CU 补丁集 + win32 spawn 链，
#    并恢复同级 dist/cli.mjs 的 VT 输入门控）
# 在 desktop/ 执行 `npm install` 之后（任何重装都会覆盖 node_modules）：
git apply ../cc-haha-win7/patches/electron-builder/006-nsis-target-nowine.patch
```

## 验证 node_modules 补丁在重装后是否存活

```bash
grep -q 'process.platform !== "win32"' \
  desktop/node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js \
  || echo "patch 006 lost — re-apply"
```

## 已知部署坑：HarfBuzz 连字崩溃（0xC0000005）

**症状**：打包后的应用在 Win7 上渲染进程随机崩溃
（`process-gone reason=crashed exitCode=-1073741819`），在全新会话 /
清空 Local Storage 后最易复现。原生 Win7 没有任何支持连字的字体，
而本移植的最小静态字体子集（`desktop/dist/assets` 里约 21KB 的图标
字体）无法 shaping 上游前端输出的**连字图标名**。

**根因**：上游 `App-*.js` 以连字名（`"icon-name"` 文本节点）引用图标；
本移植的字体是无连字的静态子集，改用 **PUA 码点**映射。把连字名喂给
该字体会触发 Chromium 108/Win7 上的 HarfBuzz shaping 崩溃路径——两边
各自都"对"，组合才致命，静态检查发现不了，只有真实 Win7 VM 能复现。

**修复/规则**：使用连字图标名的前端资产绝不能与 PUA 子集字体一起分发。
两个安全组合（2026-08-31 在 Win7 QEMU VM 上经 A/B 二分验证）：

1. PUA 码点前端资产（`__iconCP` 映射）+ PUA 字体子集
   （已验证部署采用的 crash-free 配方），或
2. 连字名前端资产 + 完整的连字能力字体（更大，本移植未采用）。

另外，会把 `file://` 重定向到 `http://127.0.0.1:60927` 的 `index.html`
变体在导航后同样进入该 shaping 崩溃路径——请使用无重定向的
`index.html`。向现有 asar 内替换 `server.mjs`/`cli.mjs` 时，前端资产
与字体必须保持同一构建世代。
