# cc-haha Win7 兼容适配移植方案

上游：NanmiCoder/cc-haha v0.5.4（Bun + Electron 42 + Tauri sidecar 架构）。
目标：Windows 7 SP1 x64，全程离线可装可用。

## 1. 方案总览

| 层 | 上游 | Win7 版方案 |
|---|---|---|
| 桌面壳 | Electron 42（Win10+） | **Electron 22.3.27**（Chromium 108 / Node 16.17，末代 Win7 官方支持） |
| 后端 | Bun 编译 sidecar `.exe` | **删除 sidecar → 捆绑 node.exe 22.17.0 跑 `dist/server.mjs`**（源码全量 Bun→Node 移植，第 4 节） |
| 渲染层 CSS | Tailwind v4 原生（oklch/嵌套） | lightningcss `chrome 108` 构建期降级 + 运行时求值器（第 7 节） |
| Computer Use | 系统 Python + PyPI | 捆绑 Python 3.8.10 embeddable + 16 个离线 wheel（第 8 节） |
| 工作区搜索 | rg.exe（新版工具链，Win8+ API） | ripgrep 14.1.0（Win7 安全导入表） |
| Win8+ API 缺口 | — | VxKex 1.2.1 兼容层，node/python/rg 三注册（第 3 节） |
| 自动更新 | electron-updater | 懒加载 + no-op 回退（离线无更新源） |

运行时架构：GUI 主进程（Electron 22，原生兼容 Win7）→ 检测 sidecar 缺失 →
回退拉起捆绑 node.exe 运行 `server.mjs`（HTTP + WS，CLI 会话由 server 派生
`cli.mjs`）。脚本能力走捆绑 Python 3.8。node/python/rg 依赖 VxKex 注入。

## 2. Win7 系统前置

| KB | 作用 | SHA1 |
|---|---|---|
| KB2533623 x64 | kernel32 SafeDLL 加载 API（AddDllDirectory 等），Chromium 延迟加载必需 | `8a59ea3c7378895791e6cdca38cc2ad9e83bebff` |
| KB2670838 x64 | 平台更新：Direct2D/DirectWrite/D3D11/WIC，Chromium GPU 合成必需 | `9f667ff60e80b64cbed2774681302baeaf0fc6a6` |

两个 MSU 已入库（`runtime/kb-patches/`，SHA1 与微软官方值一致），
无需再从 Release 下载。

VxKex 1.2.1.2229：安装器内嵌 `KexSetup_Release_1_2_1_2229.exe` 离线安装。

## 3. VxKex 注册

VxKex 1.2.x **不存在** `KexDll64.dll`，旧版"IFEO 手写 VerifierDlls"方案无效；
必须用官方 `KexCfg.exe` 注册：

```bat
"%KEXCFG%" /EXE:"<目标.exe>" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
```

注册矩阵：

| 映像 | 结论 | 原因 |
|---|---|---|
| `Claude Code Haha.exe`（GUI） | **不注册** | Electron 22 / Chromium 108 装好两个 KB 后原生兼容 Win7 SP1 |
| `runtime\node\node.exe` | **注册，WINVERSPOOF:NONE** | Node 22 导入 Win8+ API（`EventSetInformation` 等），不注册以 0xC0000139 退出 |
| `runtime\python\python.exe` | **注册，WINVERSPOOF:NONE** | UCRT api-set shim，Computer Use 依赖链必需 |
| `src-tauri\binaries\rg.exe` | **注册，WINVERSPOOF:NONE** | 静态导入 `WaitOnAddress`（api-ms-win-core-synch-l1-2-0，Win8+），不注册则搜索挂起并弹 DLL 错误框 |
| sidecar exe | 不注册（已删除） | 见第 6 节 |

**版本伪装必须关闭的根因**：开启 WIN10 伪装时 V8 走 ThreadIsolation 路径，
`OS::SetPermissions` 使用 Win10 专有的 `PAGE_TARGETS_INVALID` 标志，触发
`Check failed: 1455L == error` 崩溃；NONE 下 V8 走 Win7 传统内存路径。

注册表原理（KexCfg 自动写入 `HKLM\...\Image File Execution Options\<映像名>`）：

| 注册表值 | 作用 |
|---|---|
| FilterFullPath | 按可执行文件**完整路径**精确匹配（一子键一路径） |
| KEX_WinVerSpoof | 版本伪装等级（本方案必须 NONE） |
| KEX_DisableForChild = 0 | 子进程继承 VxKex（node 拉起子进程必需） |
| GlobalFlag = 0x100 / VerifierFlags = 0x80000000 / VerifierDlls = kexdll.dll | Application Verifier 注入机制 |

约束：注册按路径生效，把 node.exe 拷贝到其他路径运行会以 `0xC0000139`
退出（无注入）；换路径必须重新注册。

完整脚本：`runtime\setup-vxkex.bat`（安装检测 + 三注册 + 双自检）。

## 4. Bun→Node 全量移植

上游源码全部 Bun 依赖改跑 Node 的完整映射。兼容层 `port-src/src/compat/`，
构建脚本 `port-src/scripts/node-port/`。

### 4.1 API 兼容层

| Bun 依赖 | Node 方案 | 落点 |
|---|---|---|
| `bun:sqlite` | `node:sqlite`（DatabaseSync，布尔参数归一化） | `compat/bunSqlite.ts` |
| `Bun.spawn` | `node:child_process`，复刻 `exited` promise 语义（exit + error 双路 settle） | `compat/bunSpawn.ts` |
| `Bun.serve`（含 WS 升级） | `node:http` + `ws`：路径路由（`/ws/`、`/sdk/`）、升级后禁写 HTTP 响应、ECONNRESET/请求级错误兜底 | `compat/bunServe.ts` |
| `Bun.file` | `node:fs` 流式实现 | `compat/bunFile.ts` |
| `bun:bundle` / `feature()` | shim；`CC_HAHA_FEATURES` 未设置时默认 `TRANSCRIPT_CLASSIFIER`，设空禁用 | `compat/bunBundle.ts` |
| `import.meta.main` | 新增 `serverNode.ts` 包装入口（Node 下该属性 undefined 导致 server 不自启动） | entrypoints |
| `MACRO.*` 构建期注入 | esbuild `define` 复刻 Bun 发布管线全部 7 键（VERSION/PACKAGE_URL/NATIVE_PACKAGE_URL/VERSION_CHANGELOG/ISSUES_EXPLAINER 等） | build.mjs |

原生/私有模块桩策略与上游一致（`color-diff-napi`、`@ant/claude-for-chrome-mcp`
上游本就指向 stubs）；`@whiskeysockets/baileys` 在 CLI bundle 桩化、adapters
构建用真包；可选集成（sharp、Bedrock/Vertex SDK、OTel 导出器、audio-capture）
external + 动态导入回退。

**事件循环保活修复**：`standaloneProviderProxy` 模块加载时 eager 绑定的
`net.Server`（补偿 node:http 下一 tick 才有端口、供同步读 `.port`）创建后
必须立即 `unref()`，否则 CLI 启动错误后进程永久挂起（Bun.serve 同步绑定
无此问题，属语义对齐修复）。

### 4.2 esbuild 构建链（替代全部 `bun build`）

- `build.mjs` → `dist/{cli,server,recovery-cli,adapters}.mjs` + `adapters-chunks/`
  （五个 IM 适配器按需分块：feishu 5.4MB / whatsapp 4.4MB / telegram 967KB /
  dingtalk 221KB / wechat 30KB）
- `build-electron.mjs` → 4 个 CJS 产物（external：electron / node-pty / electron-updater）
- banner 统一注入：ESM 兼容 `__dirname`/`__filename`（adapters chunk 内 CJS
  依赖必需）、`CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1"`、cli/recovery 的
  `process.chdir(CALLER_DIR)`（复刻原 bunfig preload 副作用；server/adapters
  不注入，对齐原编译 sidecar 行为）

补丁清单与应用顺序见 `patches/README.md`（001 electron22 / 002 css-shim /
004 CU-offline / 005 nowine；003 即 main.cjs 回退层，以编译产物交付）。

### 4.3 node:sqlite 旗标

`node:sqlite` 于 22.5.0 引入；**22.5.0–22.12.x 与 23.0–23.3.x 必须加
`--experimental-sqlite`**（22.13.0 / 23.4.0 起免除），否则
`ERR_UNKNOWN_BUILTIN_MODULE` 启动即崩。四条路径已自动附加：

1. `bin/claude-haha` JS 启动器按 `process.versions.node` 精确区间注入
2. `bin/server-haha(.cmd)` 同逻辑
3. main.cjs `sqliteFlagArgsForVersion()`（`node --version` 探测一次缓存，server
   与 adapters 两个 spawn 计划共用）
4. Windows `.cmd` 启动器路由经 JS 启动器

仅手工 `node dist\*.mjs` 裸跑需自查版本。

### 4.4 运行时派生链

**桌面壳 → server**（main.cjs）：sidecar 缺失时切换
`resolveNodeRuntimeExecutable()` + `[sqlite 旗标…] server.mjs|adapters.mjs`。
解析顺序（逐级回退，无需环境变量）：

- server 入口：`CC_HAHA_SERVER_MJS` → `<inst>\resources\app.asar.unpacked\dist\server.mjs`
- node 解释器：`CC_HAHA_NODE_EXE` → `<inst>\resources\runtime\node\node.exe` → PATH
- 捆绑 node.exe 经 `buildSidecarEnv` 的 PATH 增强定位；安装器为其建防火墙入站规则

**server → CLI / cron → CLI**：dist 布局下 launcher 解析为 null 时（会话服务与
cron 调度器两处），回退探测 `../bin/claude-haha` 启动器（自带 sqlite 旗标 /
CALLER_DIR / 特性注入）；`CC_HAHA_CLI_ENTRY` 直连分支同样补 sqlite 旗标。

### 4.5 环境变量

| 变量 | 作用 |
|---|---|
| `CC_HAHA_NODE_EXE` / `CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS` | 桌面壳回退链覆盖：node 解释器 / server / adapters 入口 |
| `CC_HAHA_CLI_ENTRY` | server/cron 派生 CLI 的直连入口覆盖 |
| `CC_HAHA_NODE` | 仅 .cmd 启动器：指定 node.exe 全路径 |
| `CC_HAHA_DESKTOP_SERVER_URL` | 远程模式（Win7 只跑 Electron 壳，后端在局域网他机） |
| `CC_HAHA_FEATURES` | 特性开关（默认 TRANSCRIPT_CLASSIFIER，设空禁用） |
| `CC_HAHA_SKIP_DOTENV` | 跳过根目录 .env 加载（.cmd 默认置 1） |
| `CLAUDE_CODE_FORCE_RECOVERY_CLI` | 强制进入恢复 CLI |
| `IS_SANDBOX` | 容器/root 高权限场景跳过权限拦截 |
| `NODE_SKIP_PLATFORM_CHECK` | 仅"官方 node.exe + 平台检查豁免"路径需要 |

## 5. server.mjs 关键补丁

### 5.1 Win32 CLI spawn 路径

服务端启动 CLI 子进程原用 Bun 专属 `--preload` 参数，Node 22 报
`bad option`（exit 9），WS 会话与 cron 全部失败。win32 分支改为三级解析：
直接执行 `dist/cli.mjs` → 兜底 `bin/claude-haha.cmd` 启动器 → 仅非 win32
保留 preload 路径。

### 5.2 继承环境变量剥离条件化

`shouldStripInheritedProviderEnv` 原无条件剥离继承的 `ANTHROPIC_*`，
官方/默认模式下 CLI 拿不到 base_url / api_key / model。改为仅显式选择
provider id 时才剥离，默认模式放行继承变量。

### 5.3 重装场景依赖自愈

CU 依赖装在捆绑 Python 的 site-packages（随程序目录卸载），而完成标记
`~\.claude\.runtime\requirements.sha256` 在用户目录（卸载保留）。重装后
stamp 匹配会跳过安装 → site-packages 实际为空，CU 假性就绪。
修复（CU setup deps 步骤 + desktop-control `ensureBootstrapped` 两处）：
stamp 匹配时先以 `python -c "import mss, pyautogui, PIL, …"` 真实导入探测，
失败则强制离线 wheels 重装并回写 stamp。

## 6. Sidecar 缺陷与 main.cjs 回退

**缺陷**：`claude-sidecar-x86_64-pc-windows-msvc.exe`（Bun 1.2.x 编译）启动即报
`Cannot find package 'bundle'` 退出——Bun 编译打包问题，与 Win7 无关，VxKex
不可修。方案：**删除 sidecar**，触发 main.cjs 内置回退：

```
createServerPlan():
  if (!hasCompiledSidecar())
      return { command: resolveNodeRuntimeExecutable(),   // node.exe
               args: [...sqliteFlags, server.mjs, ...] }   // 见 4.4
  return sidecar plan
```

NSIS 原厂安装器在安装后期会异步重建 sidecar，因此删除动作并入重打包
payload（第 9 节），不依赖装后脚本。发行包必须附带 `runtime\node-fallback\`
（server.mjs / adapters.mjs / cli.mjs / recovery-cli.mjs / adapters-chunks\）。

## 7. Electron 22 / Chromium 108 适配

### 7.1 渲染层 CSS 两段式降级（patch 002）

上游 Tailwind v4 使用 oklch 调色板、嵌套、`color-mix()`、`scrollbar-color`
等 Chromium 108 不支持的特性（能力边界，与 OS 无关）：

1. **构建期**：Vite `css.transformer: lightningcss` + `targets: chrome 108`
   ——可静态转译部分（oklch、嵌套）直接降级
2. **运行期**：`desktop/index.html` 注入求值器（`CSS.supports` 探测，仅 108
   触发）——补齐 var() 型 `color-mix()`、自定义属性内 `lab()/oklch()`（求值
   为等价 `rgb()`）、`scrollbar-color` 降级、`overlay` 过渡词剔除，并注入
   Set 七方法 polyfill（cytoscape/mermaid 依赖）。现代引擎自动跳过。

### 7.2 主进程 / 渲染层 API 边界

| 面 | 修复/回退 |
|---|---|
| 预览面板 | `WebContentsView`/`contentView`（Electron 28+）运行时探测构造器，22 上回退 `BrowserView`/`addBrowserView` |
| 文件拖入 | `webUtils.getPathForFile`（29+）双代兼容：29+ 走 webUtils，≤31 走 `File.path` |
| 自动更新 | `electron-updater` 懒加载 + no-op 回退（缺失时告警禁用，不崩溃） |
| GPU 合成 | win32 且 `os.release()` 主版本 <10 自动 `app.disableHardwareAcceleration()`（防老驱动 GPU 进程崩溃循环） |
| 桌面终端 | Win7/8 强制 node-pty 的 winpty 后端（`useConpty:false`，补丁 003）——winpty 原生支持 Win7，完整 TTY 仿真（vim/htop 可用）；repack 步骤 6/8 保证 winpty 载荷不被裁剪；仅载荷损坏时才降级管道式回退（有提示） |
| TUI 按键 | VT 模式判定加 `parseFloat(os.release()) >= 10` 门控（Win7 conhost 无 VT 输入） |
| 通知 | `isSupported()` 门控，无 toast 时优雅拒绝 |
| 工作区搜索 | 内置 ripgrep 14.1.0（PE 导入表仅 Win7 可用 API + SubsystemVersion 6.0 双重验证；运行需 VxKex 注册） |

## 8. Computer Use 离线适配

依赖 Python 3 + mss / PyAutoGUI / Pillow / pywin32；Win7 目标机离线，标准
venv + ensurepip + PyPI 流程在嵌入式发行版上全部不可用。

捆绑 `runtime\python\python.exe`（3.8.10 embeddable，VxKex 已注册）三个硬限制：

| 限制 | 对策 |
|---|---|
| 无 `venv` 模块 | server.mjs 检测失败且来源为 bundled 时回退直接用内置解释器，写 `venv-base-interpreter.txt` 标记 |
| 无 `ensurepip`/`pip` | pip wheel **解压**到 `Lib\site-packages` 引导（见下） |
| `python38._pth` 隔离 | 重写 `._pth`：追加 `Lib\site-packages` + `import site` |

pip 引导坑：pip ≥21.2 自修改保护，wheel 路径直接执行安装 pip 自身会被拒绝。
最终方案（server.mjs，patch 005）：

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

版本锁定（Python 3.8 兼容）：`Pillow>=11.3.0` → `Pillow>=10.0.0,<11`
（`requirements-win.txt`）。离线轮子（`runtime\python\wheels\`，16 个）：
pip 24.3.1（解压引导）/ setuptools 75.3.0 / wheel 0.42.0 / Pillow 10.4.0 /
pywin32 306+ / psutil 5.9.8+ / mss 9.0.2 / pyautogui 0.9.54 及纯 Python 依赖链
（pygetwindow/pyrect/pyscreeze/pytweening/mouseinfo/pymsgbox）/ pyperclip 1.10.0+
/ screeninfo 0.8.1。二进制轮均为 cp38 win_amd64 / cp37-abi3。

## 9. 离线一体安装包（NSIS 重打包）

`Claude-Code-Haha-0.5.4-win7-x64-setup.exe`（约 241MB，LZMA solid；Release
资产原名 `Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe`），
原生 makensis 重打包。源脚本 `repack/installer.nsi`，payload 为原安装包
解包树 + dist 回退产物 + wheels + `._pth` 修复 − sidecar。

安装 Section 动作：

1. `taskkill` 运行中的 GUI / node 实例（覆盖升级安全）
2. 释放全部文件（回退产物、离线 wheels、修复后的 `python38._pth`；不含 sidecar）
3. 桌面 / 开始菜单快捷方式 + `WriteUninstaller`
4. `SetRegView 64` 写 HKLM 卸载项（含 EstimatedSize），切 32 位视图清理
   Wow6432Node 旧残留（修复卸载列表重复项）
5. `netsh advfirewall` 为捆绑 node.exe 建入站规则
6. KexCfg 自动注册 node.exe / python.exe / rg.exe（`ENABLE:YES + WINVERSPOOF:NONE`）；
   未装 VxKex 时弹窗引导运行内嵌安装器后继续
7. `node --version` 自检（失败弹窗提示手工跑 `setup-vxkex.bat`）

卸载对称清理（同 `SetRegView 64`）：实例、防火墙规则、快捷方式、安装目录、
64 位卸载项；用户数据 `%USERPROFILE%\.claude` 保留。支持 `/S` 静默安装与覆盖升级。

目标机部署两步：装 KB2533623 + KB2670838（`runtime/kb-patches/`，重启）→
运行安装器。

## 10. 构建流水线（Linux 主机，免 wine，全程可离网）

**Stage A（桌面构建）**：上游源码 + patches → `Setup.exe`

```
git apply patches/desktop/001-package-json-electron22.patch   # Electron 22.3.27 + electron-builder 26.8.1
git apply patches/desktop/002-index-html-css-shim.patch       # 7.1 运行时求值器
cp -r port-src ./
node port-src/scripts/node-port/build.mjs                     # CLI bundle（esbuild，4.2 节）
git apply patches/cli/005-server-mjs-computer-use-offline.patch
cd desktop && ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install    # npmRebuild:false（见下）；skip 标志跳过 electron 包 postinstall 的 ~100MB 冗余下载
git apply ../patches/electron-builder/006-nsis-target-nowine.patch
npx electron-builder --config ../port-src/desktop/offline-win.cjs --win
```

关键配置：

- `build.npmRebuild: false`：Linux 上 node-gyp 不能交叉编译 Windows 原生模块
  （node-pty），直接用 node_modules 内预编译二进制
- `offline-win.cjs`：`electronDist` 指向本地 Electron win-x64 分发（zip 路径 /
  目录 / 解压根三选一，构建不下载）。官方
  `electron-v22.3.27-win32-x64.zip`（97MB，SHASUMS256 校验一致）已入仓
  `vendor/electron/`，配置按 `$ELECTRON_DIST` → `cc-haha/vendor/electron` →
  同级 `cc-haha-win7/vendor/electron` 顺序自动定位——Stage A 无需下载
  Electron；`signAndEditExecutable: false` 跳过 rcedit（依赖 wine）
- **免 wine 补丁（005）**：`app-builder-lib/.../NsisTarget.js` 中
  `UninstallerReader`（纯 Node 解析 PE + NSIS 字节流提取卸载器）的启用条件
  从仅 macOS Catalina 放宽为 `process.platform !== "win32"`。补丁在
  node_modules 内，重装依赖后必须复查：
  ```bash
  grep -q 'process.platform !== "win32"' \
    node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js
  ```
- `ELECTRON_BUILDER_CACHE` 指向已入仓的 NSIS 工具链缓存
  `vendor/electron-builder-cache/`（nsis-3.0.4.1 + nsis-resources-3.4.1，
  ~11MB，见 vendor/sha256sums.txt）——构建步骤零下载
- CLI 入口脚本无扩展名被 node 按 CJS 解析，需移除残留 TS 类型注解（`(): string` 等）

**Stage B（离线重打包）**：`repack/build-repack.sh` 解包 Setup.exe（7z）→
注入 `runtime/node-fallback` dist 产物 → 去 sidecar → 叠加 node/python/vxkex
运行时树 → makensis → `Claude-Code-Haha-0.5.4-win7-x64-setup.exe`。
Setup.exe 无需自备：缺失时第 0/9 步自动从入仓分片 `repack/setup-exe/`
（≤95MB/片）重组并校验 sha256——克隆仓库即可零联网重建。

完整命令序列见 [BUILD-AND-VERIFY.md](BUILD-AND-VERIFY.md)。

## 11. 已知限制

| 项 | 表现 | 说明 |
|---|---|---|
| 桌面终端 | 完整 TTY（winpty 后端） | Win7/8 强制 `useConpty:false`（补丁 003），winpty 载荷由 repack 步骤 6/8 保证；仅当载荷损坏时降级为管道式回退（启动有提示，vim 等全屏程序降级） |
| Bash 工具 | 可用（需 Git Bash） | shell 解析链（补丁 004）：用户 Git for Windows → 内置 PortableGit 2.45.2（`runtime/git`，已入库，最后支持 Win7 的 Git 版本）→ PATH bash；三者皆无时报错并提示安装/设置 `CC_HAHA_BASH_EXE` |
| 自动更新 | no-op | 离线无更新源，属设计行为 |
| GPU | 软件合成 | Win7 自动禁硬件加速，防老驱动崩溃 |
| 离线不可达 | 真实外网 API、OAuth 回调、IM 真实推送、在线市场 | 物理离线豁免 |
