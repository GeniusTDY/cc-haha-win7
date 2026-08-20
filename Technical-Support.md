# cc-haha Win7 移植技术方案

> **上游**：[NanmiCoder/cc-haha](https://github.com/NanmiCoder/cc-haha) v0.5.4（Bun + Electron 42 + Tauri sidecar 架构，`d52bbec7`）
> **目标**：Windows 7 SP1 x64，安装与使用全程离线
> **定位**：本文档只描述 Win7 移植的技术方案本身。项目简介与使用教程见 [README](README.md)。

## 目录

1. [方案总览](#1-方案总览)
2. [Win7 系统前置](#2-win7-系统前置)
3. [VxKex 注册](#3-vxkex-注册)
4. [Bun→Node 全量移植](#4-bunnode-全量移植)
5. [server.mjs 关键补丁](#5-servermjs-关键补丁)
6. [Sidecar 缺陷与 main.cjs 回退](#6-sidecar-缺陷与-maincjs-回退)
7. [Electron 22 / Chromium 108 适配](#7-electron-22--chromium-108-适配)
8. [Computer Use 离线适配](#8-computer-use-离线适配)

---

## 1. 方案总览

各层与上游的对照总表见 [README](README.md)，此处不重复。运行时架构：

```text
GUI 主进程（Electron 22，原生兼容 Win7）
  └─ 检测 sidecar 缺失 → 拉起捆绑 node.exe 运行 server.mjs（HTTP + WS）
       ├─ CLI 会话：server 派生 cli.mjs
       └─ 脚本能力：捆绑 Python 3.8（Computer Use）

node.exe / python.exe / rg.exe 均经 VxKex 注入补齐 Win8+ API
```

技术模块与章节索引：

| 章节 | 模块 |
|---|---|
| [2](#2-win7-系统前置) | Win7 系统前置（KB 补丁） |
| [3](#3-vxkex-注册) | VxKex 兼容层注册 |
| [4](#4-bunnode-全量移植) | Bun→Node 全量移植（API 兼容层、esbuild 构建链、运行时派生链） |
| [5](#5-servermjs-关键补丁) | server.mjs 关键补丁 |
| [6](#6-sidecar-缺陷与-maincjs-回退) | Sidecar 缺陷与 main.cjs 回退 |
| [7](#7-electron-22--chromium-108-适配) | Electron 22 / Chromium 108 适配（CSS 降级、API 边界） |
| [8](#8-computer-use-离线适配) | Computer Use 离线适配（Python 载荷与 pip 引导） |

## 2. Win7 系统前置

| KB | 作用 | SHA1 |
|---|---|---|
| KB2533623 x64 | kernel32 SafeDLL 加载 API（`AddDllDirectory` 等），Chromium 延迟加载必需 | `8a59ea3c7378895791e6cdca38cc2ad9e83bebff` |
| KB2670838 x64 | 平台更新：Direct2D / DirectWrite / D3D11 / WIC，Chromium GPU 合成必需 | `9f667ff60e80b64cbed2774681302baeaf0fc6a6` |

两个 MSU 已入库（`runtime/kb-patches/`，SHA1 与微软官方值一致），无需从 Release 下载。

VxKex 1.2.1.2229：安装器内嵌 `KexSetup_Release_1_2_1_2229.exe` 离线安装。

## 3. VxKex 注册

VxKex 1.2.x **不存在** `KexDll64.dll`，旧版"IFEO 手写 VerifierDlls"方案无效，必须用官方 `KexCfg.exe` 注册：

```bat
"%KEXCFG%" /EXE:"<目标.exe>" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
```

注册矩阵：

| 映像 | 结论 | 原因 |
|---|---|---|
| `Claude Code Haha.exe`（GUI） | **不注册** | Electron 22 / Chromium 108 装好两个 KB 后原生兼容 Win7 SP1 |
| `runtime\node-v22.17.0\node.exe` | **注册，WINVERSPOOF:NONE** | Node 22 导入 Win8+ API（`EventSetInformation` 等），不注册以 `0xC0000139` 退出 |
| `runtime\python-3.8.10\python.exe` | **注册，WINVERSPOOF:NONE** | UCRT api-set shim，Computer Use 依赖链必需 |
| `src-tauri\binaries\rg.exe` | **注册，WINVERSPOOF:NONE** | 静态导入 `WaitOnAddress`（api-ms-win-core-synch-l1-2-0，Win8+），不注册则搜索挂起并弹 DLL 错误框 |
| sidecar exe | 不注册（已删除） | 见 §6 |

**版本伪装必须关闭的根因**：开启 WIN10 伪装时 V8 走 ThreadIsolation 路径，`OS::SetPermissions` 使用 Win10 专有的 `PAGE_TARGETS_INVALID` 标志，触发 `Check failed: 1455L == error` 崩溃；NONE 下 V8 走 Win7 传统内存路径。

注册表原理（KexCfg 自动写入 `HKLM\...\Image File Execution Options\<映像名>`）：

| 注册表值 | 作用 |
|---|---|
| FilterFullPath | 按可执行文件**完整路径**精确匹配（一子键一路径） |
| KEX_WinVerSpoof | 版本伪装等级（本方案必须 NONE） |
| KEX_DisableForChild = 0 | 子进程继承 VxKex（node 拉起子进程必需） |
| GlobalFlag = 0x100 / VerifierFlags = 0x80000000 / VerifierDlls = kexdll.dll | Application Verifier 注入机制 |

约束：注册按路径生效，把 node.exe 拷贝到其他路径运行会以 `0xC0000139` 退出（无注入），换路径必须重新注册。

完整脚本：`runtime\setup-vxkex.bat`（安装检测 + 三注册 + 双自检）；安装器在安装期自动完成三注册。

## 4. Bun→Node 全量移植

上游源码全部 Bun 依赖改跑 Node 的完整映射。兼容层位于 `port-src/src/compat/`，构建脚本位于 `port-src/scripts/node-port/`。

### 4.1 API 兼容层

| Bun 依赖 | Node 方案 | 落点 |
|---|---|---|
| `bun:sqlite` | `node:sqlite`（DatabaseSync，布尔参数归一化） | `compat/bunSqlite.ts` |
| `Bun.spawn` | `node:child_process`，复刻 `exited` promise 语义（exit + error 双路 settle） | `compat/bunSpawn.ts` |
| `Bun.serve`（含 WS 升级） | `node:http` + `ws`：路径路由（`/ws/`、`/sdk/`）、升级后禁写 HTTP 响应、ECONNRESET / 请求级错误兜底 | `compat/bunServe.ts` |
| `Bun.file` | `node:fs` 流式实现 | `compat/bunFile.ts` |
| `bun:bundle` / `feature()` | shim；`CC_HAHA_FEATURES` 未设置时默认 `TRANSCRIPT_CLASSIFIER`，设空禁用 | `compat/bunBundle.ts` |
| `import.meta.main` | 新增 `serverNode.ts` 包装入口（Node 下该属性 undefined 导致 server 不自启动） | entrypoints |
| `MACRO.*` 构建期注入 | esbuild `define` 复刻 Bun 发布管线全部 7 键（VERSION / PACKAGE_URL / NATIVE_PACKAGE_URL / VERSION_CHANGELOG / ISSUES_EXPLAINER 等） | build.mjs |

原生 / 私有模块桩策略与上游一致（`color-diff-napi`、`@ant/claude-for-chrome-mcp` 上游本就指向 stubs）；`@whiskeysockets/baileys` 在 CLI bundle 桩化、adapters 构建用真包；可选集成（sharp、Bedrock / Vertex SDK、OTel 导出器、audio-capture）external + 动态导入回退。

**事件循环保活修复**：`standaloneProviderProxy` 模块加载时 eager 绑定的 `net.Server`（补偿 node:http 下一 tick 才有端口、供同步读 `.port`）创建后必须立即 `unref()`，否则 CLI 启动错误后进程永久挂起（Bun.serve 同步绑定无此问题，属语义对齐修复）。

### 4.2 esbuild 构建链（替代全部 `bun build`）

- **esbuild 已内置**：0.28.2 本体 + `@esbuild/linux-x64`、`@esbuild/win32-x64` 双平台二进制提交于 `port-src/vendor/node_modules/`（约 23MB）。三个构建脚本（build.mjs / build-electron.mjs / build-preview-agent.mjs）优先加载内置副本，仓库 node_modules 内的 esbuild 仅作回退——新克隆**零注册表访问**即可构建，无需先在根目录 `npm install`。
- **产物**：`build.mjs` → `dist/{cli,server,recovery-cli,adapters}.mjs` + `adapters-chunks/`（五个 IM 适配器按需分块：feishu 5.4MB / whatsapp 4.4MB / telegram 967KB / dingtalk 221KB / wechat 30KB；入口分发器 `port-src/adapters/index.ts` 由构建脚本自动叠加到 `<root>/adapters/index.ts`）。
- **adapters 依赖优雅降级**：`adapters/node_modules` 未安装时跳过 adapters.mjs 并输出提示，核心三产物照常生成；`cd adapters && npm install` 后重跑可全量构建。Stage B 始终使用 `runtime/node-fallback/` 内的预构建分块，与本步无关。
- **桌面产物**：`build-electron.mjs` → 4 个 CJS 产物（external：electron / node-pty / electron-updater）。
- **banner 统一注入**：ESM 兼容 `__dirname` / `__filename`（adapters chunk 内 CJS 依赖必需）、`CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1"`、cli / recovery 的 `process.chdir(CALLER_DIR)`（复刻原 bunfig preload 副作用；server / adapters 不注入，对齐原编译 sidecar 行为）。
- **补丁清单与应用顺序**：见 [patches/README.md](patches/README.md)——001 Electron 22 固定 / 002 CSS shim / 003 终端 winpty / 004 Bash 解析链 / 005 CU 离线 / 006 NSIS 免 wine。main.cjs 回退层不是编号补丁：以编译产物 `port-src/desktop-electron/main.cjs` 随 `port-src` 叠加交付（§6）。

### 4.3 node:sqlite 旗标

`node:sqlite` 于 22.5.0 引入；**22.5.0–22.12.x 与 23.0–23.3.x 必须加 `--experimental-sqlite`**（22.13.0 / 23.4.0 起免除），否则 `ERR_UNKNOWN_BUILTIN_MODULE` 启动即崩。四条路径已自动附加：

1. `bin/claude-haha` JS 启动器按 `process.versions.node` 精确区间注入
2. `bin/server-haha(.cmd)` 同逻辑
3. main.cjs `sqliteFlagArgsForVersion()`（`node --version` 探测一次缓存，server 与 adapters 两个 spawn 计划共用）
4. Windows `.cmd` 启动器路由经 JS 启动器

仅手工 `node dist\*.mjs` 裸跑需自查版本。

### 4.4 运行时派生链

**桌面壳 → server**（main.cjs）：sidecar 缺失时切换 `resolveNodeRuntimeExecutable()` + `[sqlite 旗标…] server.mjs|adapters.mjs`，逐级回退、无需环境变量：

| 解析项 | 顺序 |
|---|---|
| server 入口 | `CC_HAHA_SERVER_MJS` → `<inst>\resources\app.asar.unpacked\dist\server.mjs` |
| node 解释器 | `CC_HAHA_NODE_EXE` → `<inst>\resources\runtime\node-v22.17.0\node.exe` → PATH |

捆绑 node.exe 经 `buildSidecarEnv` 的 PATH 增强定位；安装器为其建防火墙入站规则。

**server / cron → CLI**：dist 布局下 launcher 解析为 null 时（会话服务与 cron 调度器两处），回退探测 `../bin/claude-haha` 启动器（自带 sqlite 旗标 / CALLER_DIR / 特性注入）；`CC_HAHA_CLI_ENTRY` 直连分支同样补 sqlite 旗标。

### 4.5 移植内部环境变量

用户侧模型服务商变量（`ANTHROPIC_*` 等）与运行模式见 [README](README.md)，本表仅覆盖移植内部的回退链与开关：

| 变量 | 作用 |
|---|---|
| `CC_HAHA_NODE_EXE` / `CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS` | 桌面壳回退链覆盖：node 解释器 / server / adapters 入口 |
| `CC_HAHA_CLI_ENTRY` | server / cron 派生 CLI 的直连入口覆盖 |
| `CC_HAHA_NODE` | 仅 .cmd 启动器：指定 node.exe 全路径 |
| `CC_HAHA_BASH_EXE` / `CC_HAHA_RUNTIME_DIR` | Bash 工具解析链覆盖 |
| `CC_HAHA_DESKTOP_SERVER_URL` | 远程模式（Win7 只跑 Electron 壳，后端在局域网他机） |
| `CC_HAHA_FEATURES` | 特性开关（默认 TRANSCRIPT_CLASSIFIER，设空禁用） |
| `CC_HAHA_SKIP_DOTENV` | 跳过根目录 .env 加载（.cmd 默认置 1） |
| `CLAUDE_CODE_LOCAL_RECOVERY` | 强制进入恢复 CLI |
| `IS_SANDBOX` | 容器 / root 高权限场景跳过权限拦截 |
| `NODE_SKIP_PLATFORM_CHECK` | 仅"官方 node.exe + 平台检查豁免"路径需要 |

## 5. server.mjs 关键补丁

### 5.1 Win32 CLI spawn 路径

服务端启动 CLI 子进程原用 Bun 专属 `--preload` 参数，Node 22 报 `bad option`（exit 9），WS 会话与 cron 全部失败。`resolveCliArgs` 改为逐级解析：`CC_HAHA_CLI_ENTRY` 直连（自动补 sqlite 旗标）→ `../bin/claude-haha` JS 启动器 → win32 下直接执行 `dist/cli.mjs` → 兜底 `bin/claude-haha.cmd` 启动器 → 源码树布局的 preload 路径（安装布局下 cli.mjs 恒存在，实际不可达）。

### 5.2 继承环境变量剥离条件化

`shouldStripInheritedProviderEnv` 原无条件剥离继承的 `ANTHROPIC_*`，官方 / 默认模式下 CLI 拿不到 base_url / api_key / model。改为仅显式选择 provider id 时才剥离，默认模式放行继承变量。

### 5.3 重装场景依赖自愈

CU 依赖装在捆绑 Python 的 site-packages（随程序目录卸载），而完成标记 `~\.claude\.runtime\requirements.sha256` 在用户目录（卸载保留）。重装后 stamp 匹配会跳过安装 → site-packages 实际为空，CU 假性就绪。修复（CU setup deps 步骤 + desktop-control `ensureBootstrapped` 两处）：stamp 匹配时先以 `python -c "import mss, pyautogui, PIL, …"` 真实导入探测，失败则强制离线 wheels 重装并回写 stamp。

### 5.4 Bash 工具 shell 解析链（补丁 004）

Bash 工具依赖 Git Bash，上游仅探测 POSIX 路径（`/bin/bash` 等），Windows 上永不可达。win32 分支在 POSIX 逻辑之前显式三级探测：

1. **用户自装 Git for Windows**：`CC_HAHA_BASH_EXE` / `CLAUDE_CODE_GIT_BASH_PATH` 覆盖 → 标准安装目录 → PATH 扫描
2. **捆绑 PortableGit 2.45.2**（`runtime/git-2.45.2/`，2.46+ 已放弃 Win7 的最后可用版）：探测 `CC_HAHA_RUNTIME_DIR/git-2.45.2` → 便携布局 `<dist>/../runtime/git-2.45.2` → 安装器布局 `<dist>/../../runtime/git-2.45.2`
3. **PATH 上的裸 bash.exe** 兜底

三者皆无时报错并提示安装 Git for Windows 或设置 `CC_HAHA_BASH_EXE`。干净离线机靠第 2 级开箱即用，无需任何预装。

## 6. Sidecar 缺陷与 main.cjs 回退

**缺陷**：`claude-sidecar-x86_64-pc-windows-msvc.exe`（Bun 1.2.x 编译）启动即报 `Cannot find package 'bundle'` 退出——Bun 编译打包问题，与 Win7 无关，VxKex 不可修。

**方案**：删除 sidecar，触发 main.cjs 内置回退：

```text
createServerPlan():
  if (!hasCompiledSidecar())
      return { command: resolveNodeRuntimeExecutable(),   // node.exe
               args: [...sqliteFlags, server.mjs, ...] }   // 见 §4.4
  return sidecar plan
```

NSIS 原厂安装器在安装后期会异步重建 sidecar，因此删除动作并入重打包 payload（Stage B），不依赖装后脚本。发行包必须附带 node-port bundle（server.mjs / adapters.mjs / cli.mjs / recovery-cli.mjs / adapters-chunks\，由 Stage B 从仓库 `runtime/node-fallback/` 部署至安装布局 `resources\app.asar.unpacked\dist\`）。

## 7. Electron 22 / Chromium 108 适配

### 7.1 渲染层 CSS 两段式降级（patch 002）

上游 Tailwind v4 使用 oklch 调色板、嵌套、`color-mix()`、`scrollbar-color` 等 Chromium 108 不支持的特性（能力边界，与 OS 无关）：

1. **构建期**：Vite `css.transformer: lightningcss` + `targets: chrome 108`——可静态转译部分（oklch、嵌套）直接降级；
2. **运行期**：`desktop/index.html` 注入求值器（`CSS.supports` 探测，仅 108 触发）——补齐 var() 型 `color-mix()`、自定义属性内 `lab()/oklch()`（求值为等价 `rgb()`）、`scrollbar-color` 降级、`overlay` 过渡词剔除，并注入 Set 七方法 polyfill（cytoscape / mermaid 依赖）。现代引擎自动跳过。

### 7.2 主进程 / 渲染层 API 边界

| 面 | 修复 / 回退 |
|---|---|
| 预览面板 | `WebContentsView` / `contentView`（Electron 28+）运行时探测构造器，22 上回退 `BrowserView` / `addBrowserView` |
| 文件拖入 | `webUtils.getPathForFile`（29+）双代兼容：29+ 走 webUtils，≤31 走 `File.path` |
| 自动更新 | `electron-updater` 懒加载（手动检查/下载，`autoDownload:false`），feed 指向**本仓库** Releases——Stage B 步骤 2b 重写 `resources/app-update.yml`（owner/repo 可经 `UPDATE_OWNER`/`UPDATE_REPO` 覆盖）；元数据缺失或离线时静默回退为“无更新”，不崩溃 |
| GPU 合成 | win32 且 `os.release()` 主版本 <10 自动 `app.disableHardwareAcceleration()`（防老驱动 GPU 进程崩溃循环） |
| 桌面终端 | Win7/8 强制 node-pty 的 winpty 后端（`useConpty:false`，补丁 003）——winpty 原生支持 Win7，完整 TTY 仿真（vim / htop 可用）；repack 步骤 7/9 保证 winpty 载荷不被裁剪；仅载荷损坏时才降级管道式回退（有提示） |
| TUI 按键 | VT 模式判定加 `parseFloat(os.release()) >= 10` 门控（Win7 conhost 无 VT 输入；cli.mjs defaultBindings，经 `patch-computer-use.py` P10 恢复） |
| 通知 | `isSupported()` 门控，无 toast 时优雅拒绝 |
| 工作区搜索 | 内置 ripgrep 14.1.0（PE 导入表仅 Win7 可用 API + SubsystemVersion 6.0 双重验证；运行需 VxKex 注册） |

## 8. Computer Use 离线适配

依赖 Python 3 + mss / PyAutoGUI / Pillow / pywin32；Win7 目标机离线，标准 venv + ensurepip + PyPI 流程在嵌入式发行版上全部不可用。

捆绑 `runtime\python-3.8.10\python.exe`（3.8.10 embeddable，VxKex 已注册）三个硬限制：

| 限制 | 对策 |
|---|---|
| 无 `venv` 模块 | server.mjs 检测失败且来源为 bundled 时回退直接用内置解释器，写 `venv-base-interpreter.txt` 标记 |
| 无 `ensurepip` / `pip` | pip wheel **解压**到 `Lib\site-packages` 引导（见下） |
| `python38._pth` 隔离 | 重写 `._pth`：追加 `Lib\site-packages` + `import site` |

> **载荷说明**：`runtime/python-3.8.10/python38.zip`（2.4MB，605 个 stdlib `.pyc`）是 embeddable 布局的**标准库本体**——`python38._pth` 首行即指向它，python.exe 靠 zipimport 从中导入；`.pyd` / exe / DLL 只是二进制半边。它不是 python 目录的重复副本，**不能删**（删后 `import os` 都会失败）。`wheels/*.whl` 同理必须保留原格式（pip `--no-index --find-links` 只认 .whl）。仓库内仅这两处与两处分片（`repack/setup-exe/` 成品分片、`vendor/electron-v22.3.27-win32-x64/electron.exe.00/01.part`）保留压缩 / 切分类文件；其余构建期依赖（esbuild / desktop node_modules / Electron 分发）均已为普通文件。两处分片均为原始字节切片而非压缩包，超 GitHub 100MB 单文件上限所致：前者由 build-repack.sh 步骤 0 重组，后者由 offline-win.cjs 在构建时自动重组并 sha256 校验。

pip 引导坑：pip ≥21.2 自修改保护，wheel 路径直接执行安装 pip 自身会被拒绝。最终方案（server.mjs，patch 005）：

```js
// 1) pip 是纯 Python 包，解压 wheel 到 purelib 即可被 -m pip 使用
runCommand(py, ["-c",
  "import os,sys,sysconfig,zipfile; d=sysconfig.get_paths()['purelib'];" +
  " os.makedirs(d,exist_ok=True); zipfile.ZipFile(sys.argv[1]).extractall(d)",
  pipWheelPath])
// 2) 离线装构建工具与依赖
runCommand(py, ["-m","pip","install","--no-index",
  "--find-links",wheelsDir, "setuptools","wheel"])
runCommand(py, ["-m","pip","install","--no-index","--no-build-isolation",
  "--find-links",wheelsDir, "-r",requirementsPath])
```

版本锁定（Python 3.8 兼容）：`Pillow>=11.3.0` → `Pillow>=10.0,<10.5`（`requirements-win.txt`）。离线轮子（`runtime\python-3.8.10\wheels\`，16 个）：pip 24.3.1（解压引导）/ setuptools 75.3.0 / wheel 0.42.0 / Pillow 10.4.0 / pywin32 311 / psutil 7.2.2 / mss 9.0.2 / pyautogui 0.9.54 及纯 Python 依赖链（pygetwindow / pyrect / pyscreeze / pytweening / mouseinfo / pymsgbox）/ pyperclip 1.11.0 / screeninfo 0.8.1。二进制轮均为 cp38 win_amd64 / cp37-abi3。
