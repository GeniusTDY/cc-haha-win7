# patches/ — 相对上游 NanmiCoder/cc-haha v0.6.2 的 Win7 移植增量

[English](README.md) | **简体中文**

基线：上游 tag/commit `85e7f3a20`（"release: v0.6.2"；原始树
`757d004471e01255b13bec5a67d8f909e21d689b`）。本系列此前基线为
`d52bbec7`（v0.5.4）——见下方重新生成说明。按补丁编号顺序应用。
所有路径相对上游仓库根目录（`desktop/` 是 Electron 应用子项目）。

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
| 9 | `desktop/009-changelog-modal.patch` | `desktop/src/pages/settings/AboutSettings.tsx`、`desktop/src/lib/changelogContent{,Data}.ts` + 5 个语言包 | 应用内更新日志弹窗，取代跳转上游 GitHub releases 的浏览器跳转：预烘焙双语语料（上游全部 44 个 release，v0.1.0 - v0.6.2，中英文拆分与 Installation 小节剔除在生成期固化）、带回退的语言映射、裸 `#issue` 引用链接化到上游 tracker、弹窗内版本切换器带"当前版本"指示（五个语言包新增 `settings.about.currentVersion` 键）；同时退役不再使用的 GITHUB_RELEASES 常量 |
| 10 | `desktop/010-providers-changed-refresh.patch` | `desktop/src/stores/chatStore.ts`、`desktop/src/types/chat.ts` | 桌面端监听服务端 `providers_changed` 事件（provider 创建/更新/删除/激活/重排/导入时发出）：`chatStore` 就地处理并调度 500 ms 防抖的 `useProviderStore.fetchProviders()`，突发多事件导入会合并为一次刷新——在一个窗口导入或更新 provider 后，其余所有打开的窗口自动刷新，无需手动重载；刷新由 `chatStore` 调度（它本就 import `useProviderStore`），而非在 `providerStore` 模块顶层注册回调——后者会在 `chatStore` ↔ `providerStore` 循环 import 期间、处理函数绑定仍处暂时性死区（TDZ）时求值，从而在测试运行器下击穿 store 图 |
| 11 | `desktop/011-h5-input-width-fix.patch` | `desktop/index.html` | H5 访问"访问主机/IP"行：视口断点 `sm:grid-cols-[minmax(0,1fr)_9rem_9rem]` 按窗口而非网格自身盒子宽度生效，设置页多层卡片嵌套下弹性列被压扁，输入框只有窗口最大化时才能完整显示；改为在该行父包装上设 `container-type:inline-size`，容器宽度不足 28rem 时退回单列 `minmax(0,1fr)`，按容器真实宽度响应（容器查询与 `:has()` 均为 Chromium 105+，Electron 22 的 108 原生支持） |
| 12 | `desktop/012-button-nowrap-fix.patch` | `desktop/index.html` | `button.inline-flex{white-space:nowrap}`：固定高度按钮（h-6=24px 等）未禁用换行，flex 行空间紧张时 CJK 标签（设置→诊断的"刷新"/"重建本地索引"）折成两行，约 27px 的行盒画出按钮边框；nowrap 保持标签单行并恢复 min-content 宽度保护，flex 不再把按钮压到标签宽度以下 |
| 13 | `desktop/013-intranet-mode-ui-gates.patch` | `desktop/electron/main.ts`、`desktop/electron/services/{intranetMode,intranetNetworkGuard,shell,systemProxyBridge,updater}.ts`、`desktop/src/api/settings.ts`、`desktop/src/components/layout/Sidebar.tsx`、`desktop/src/pages/Settings.tsx`、`desktop/src/pages/{settings/{AboutSettings,GeneralSettings,IntranetModeSettings,ProviderSettings},ComputerUseSettings,Market}.tsx`、`desktop/src/stores/{settingsStore,chatStore,updateStore,uiStore}.ts`、`desktop/src/types/{settings,chat}.ts`、5 个语言包 | 内网模式·桌面端：独立设置页承载总开关（侧边栏首项）；服务端 `network_policy_changed` 广播把权威值镜像进每个已打开窗口即时生效，焦点水合（窗口 focus/visibilitychange 重拉 `/api/settings/user`，PUT 时间戳防在途保存竞态）兜底刚重启、无打开会话收不到广播的场景；在线专属 UI 隐藏（关于页更新卡片 + 社媒/作者/反馈区块、服务商弹窗「获取 API Key」按钮 + 预设推广条——弹窗本身保留，添加内网自建服务商正是内网核心用例、WebSearch Tavily/Brave「获取 API Key」外链、侧边栏技能市场入口 + 已打开市场标签页的"不可用"提示、IM 接入侧边栏项、Computer Use 的"下载 Python 3"按钮）；关于页两张 GitHub 仓库卡片（上游 + 本项目）**保留展示**——属署名信息而非功能入口，点击经 openUrl 短路为无反应；主进程权威闸门每次调用无缓存读 `<CLAUDE_CONFIG_DIR>/settings.json`——`openExternalUrl()` 在加载 electron 模块前拒绝 http(s)，`checkForUpdates()` 不触碰 electron-updater 直接返回空，新增 Chromium 网络防护（main.ts 安装）禁用拼写词典下载与组件更新器（NetworkService 后台流量），内网模式下系统代理桥只转发到环回/RFC1918/ULA/链路本地目标，经桥隧道的 CLI 子进程无法触达公网 |
| 14 | `cli/014-intranet-mode-network-policy.patch` | `src/utils/{networkPolicy,apiPreconnect,releaseNotes}.ts`、`src/tools/WebSearchTool/{WebSearchTool,backend}.ts`、`src/tools/WebFetchTool/utils.ts`、`src/tools/{RemoteTriggerTool/RemoteTriggerTool,BriefTool/upload}.ts`、`src/utils/telemetry/instrumentation.ts`、`src/services/{api/{usage,referral},mcp/officialRegistry,remoteManagedSettings/syncCache,settingsSync/index,teamMemorySync/index,voiceStreamSTT}.ts`、`src/server/{index,services/{conversationService,market/providerFetch},middleware/errorHandler,ws/{events,handler},api/{settings,haha-oauth,haha-grok-oauth,haha-openai-oauth}}.ts` | 内网模式·服务端/CLI：`src/utils/networkPolicy.ts` 每次调用无缓存读 `~/.claude/settings.json` 的 `intranetMode`，翻转开关对已运行会话的下一次工具调用即时生效；遥测全关（OTLP + BigQuery + 初始化，覆盖 shell 继承来的 `CLAUDE_CODE_ENABLE_TELEMETRY=1`）；OAuth start/callback 返回 403 `INTRANET_MODE_DISABLED`，status 不做出站刷新直接报未登录（裸 `/callback*` 路由同样 403）；WebSearch 禁用一切后端并向模型说明（"内网模式已禁用 WebSearch——请勿重试，改用会话内容与本地文件作答"）；WebFetch 保留对内网纯 HTTP 服务的访问（跳过 http→https 升级与出站域名黑名单预检）；CLI 子进程注入 `CC_HAHA_INTRANET_MODE=1` + `CLAUDE_CODE_ENABLE_TELEMETRY=0`；`PUT /api/settings/user` 把开关广播给所有已连接客户端。审计补全（应用主动发起的一切外联全部挂闸）：API 预热连接跳过；MCP 官方注册表预取跳过（api.anthropic.com，`isOfficialMcpUrl()` 本就失败关闭）；更新日志拉取跳过（raw.githubusercontent.com，保留本地缓存）；技能市场在 `providerFetch()` 服务端拒绝任何代理外联（不止隐藏 UI，H5/直连 API 同样被拒）；设置同步上传/下载、远程托管设置资格（先查缓存前判断，翻转立即生效）、团队记忆同步全部硬关（claude.ai）；用量查询降级为 null、邀请返利降级为不可参与/空列表；语音流 STT 永不可用；RemoteTriggerTool 快速失败并提示勿重试；Brief 附件上传静默跳过（纯本地 brief 不受影响） |
| 16 | `desktop/016-activity-profile-title-width.patch` | `desktop/src/pages/ActivitySettings.tsx` + `ActivitySettings.test.tsx` | 活动页标题不再在内容列尚未占满时提前省略：`<h1>` 的宽度上限 `max-w-[min(720px,calc(100%-2.25rem))]` 属自引用（`100%` 相对其所处的 shrink-to-fit flex 行解析，`2.25rem` 恰为同级编辑按钮占用的空间），导致发布版 800px 窗口把 `cc-haha` 渲染成 `cc-ha…`，而内容列其实仍有空间——下方两行副标题只带 `max-w-full`、能完整渲染且更宽，正是它把"截断"定位到标题自身而非容器；现将编辑控件改为 `absolute inset-y-0 right-0 my-auto` 脱离文档流（显示行为不变，仍为 `opacity-0` + `group-hover/focus-visible` 显现，去掉 `shrink-0`），行改为 `relative w-full`，标题上限变成干净的定值 `max-w-[720px]`；并补一条回归测试断言标题不再含 `calc(100%-2.25rem)`、控件为绝对定位 |

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
- 上游根目录依赖（68 项：axios、lodash-es、react 等）必须先安装
  （`bun install` / `npm install`）——本仓库只内置 esbuild、desktop
  依赖树，以及两棵 repack 工具树（`repack/asar-tool/node_modules`、
  `repack/icon-tool/node_modules`）。

实测：在全新 `85e7f3a20` 克隆 + 补丁 001–004 + `cp -r port-src ./` 上
运行 build.mjs 会报约 2000 个 unresolved 模块错误。本仓库支持的
全离线可重现路径是 **仅 Stage B**：`runtime/node-fallback/` 内置
预构建 dist bundle，build-repack.sh 步骤 4/9 将其部署进安装器，
与任何 Stage A 构建无关。

## 为 v0.6.2 重新生成补丁系列（2026-09-12）

本系列原基线为 v0.5.4。将基线迁到 `85e7f3a20`（"release: v0.6.2"）后，
001/002/003/007/011/012 与 cli/004、cli/014 保持逐字节不变，只有上游
在其下方改动了上下文的四个补丁被重新生成：**008、009、010、013**。
验证方式：在原始 `85e7f3a20` 检出上按下方顺序应用当时的系列（12 个编号补丁），
所得树与规范重放一致（零冲突标记）：

```
series tree: 9d06be08fa401dbc7665b7cc1e22653bd06c61d4
expected   : 9d06be08fa401dbc7665b7cc1e22653bd06c61d4
```

（v0.5.4 时为 `861e9c96e15ce7ebd3f31b69adafee17f1f3c984`）。重新生成的
diff 用 git plumbing（`hash-object` / `read-tree` /
`update-index --cacheinfo` / `write-tree` / `commit-tree`）产出，并以
`git diff <parent> <new-commit>` 输出，因此每个补丁仍是普通双向
`git diff`，`git apply` 无需 3-way 回退即可应用。

- **008（品牌/fork 礼仪）**——仅上下文行位移。
- **009（更新日志弹窗）**——语料由 40 条扩展到 **44** 条
  （v0.1.0 - v0.6.2），做法是对上游 `release-notes/*.md` 重跑生成器。
  语言归属按内容而非位置判定：英文块是含 `## Installation` 的那块，
  中文块是含 `## 安装` 的那块——因为 v0.6.1、v0.6.2 把中文块放在前面，
  而 v0.5.2–v0.6.0 是英文在前。44 条中有 37 条为单语（仅中文），
  经 `changelogContent.ts` 的回退逻辑到达界面。解析器对已发布的三个
  双语条目（v0.5.2/0.5.3/0.5.4）逐字节复现。补丁体积
  233,997 → 265,256 B。
- **010（`providers_changed` 刷新）** 与 **013（内网模式 UI 闸门）**
  ——上游重构了 `chatStore`/`settingsStore`，两者均已 rebase 到新源码。
  013 的最终 `settingsStore.ts`（`userSettingsPatch()`、
  `intranetMode: userSettings.intranetMode === true`、
  `proxyManagedSettingsWarning`）从重放链的最终提交重建，而非带冲突
  标记的中间提交。010 在**本轮之后**又做了一次修订：500 ms 防抖刷新
  改由 `chatStore` 就地调度，而不再经 `providerStore` 模块顶层注册的
  回调——后者会在 `chatStore` ↔ `providerStore` 循环 import 期间触发
  暂时性死区（TDZ）错误，进而在测试运行器下击穿 store 图。上方树哈希
  为修订前的值。

在全新克隆上做 3-way 重放（`git apply --3way`）还需补丁所依赖的中间
blob 在对象库中可达；这些 blob 通过用 `git apply --3way` +
`git add -A` + commit 重放 v0.5.4 系列完成播种。下方所用的普通
`git apply` 不需要该前置步骤。

v0.5.4 → v0.6.2 之间根依赖由 67 项增至 68 项（devDependencies 仍为
1 项）。Bun 调用点普查形态不变：`Bun.serve`、`Bun.spawn`、`Bun.file`、
`bun:sqlite`（`src/server/services/ccSwitchImport.ts`）、`bun:bundle`
（`src/bridge/*`、`src/cli`、`src/commands/*`）与 `import.meta.dir`
（`src/server/services/conversationService.ts`、`cronScheduler.ts`）；
无 `Bun.write`/`Bun.env`。

**016** 于该次重新生成之后加入（2026-09-14）。它只触及
`ActivitySettings.tsx` 及其测试，这两个文件未被四个重新生成的补丁
改动（008 只动了其副标题 hunk），且其 `index` blob 直接承接 008 的
产物（`1688c5b05..88c19bc24`），因此叠加在重新生成的系列之上、不改动
其中任何 hunk。编号取 16 是因为编号跟随系列位置；015 未进入下方应用
列表，因为它属产物级（见下）。

### 补丁 015 属产物级，不在上游系列内

`desktop/015-renderer-recovery-hardening.patch` **不**应用到上游检出：
它记录的是对本仓库自身入仓编译产物
`port-src/desktop-electron/main.cjs` 的改动（渲染进程崩溃恢复——
单次重载尝试改为最多三次递进尝试，第二次、第三次重载前分别清理
`localstorage` 与 `localstorage`+`shadercache`+`cachestorage`）。
该改动已并入重新生成的 v0.6.2 产物，因此与补丁 005 一样，本补丁对
当前 `main.cjs` 已无法应用，仅作为该次编辑的记录保留；绝不能交给
全新上游克隆应用。

## 应用

```bash
# 布局同根 README 的 Stage A 演练：上游克隆与本仓库（cc-haha-win7）
# 并列放置，因此在克隆内部以 ../cc-haha-win7/ 访问本仓库的一切。
git clone https://github.com/NanmiCoder/cc-haha && cd cc-haha
git checkout 85e7f3a20
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
git apply ../cc-haha-win7/patches/desktop/016-activity-profile-title-width.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch
git apply ../cc-haha-win7/patches/cli/014-intranet-mode-network-policy.patch
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
