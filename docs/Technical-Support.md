# cc-haha Win7 兼容适配移植方案

## 1. 版本锁定

| 组件 | 版本 | 原因 |
|---|---|---|
| Electron | 22.3.27（Chromium 108 / Node 16.17） | 最后一代官方支持 Win7 的主版本（22.x 末版）。23 起已移除 Win7/8/8.1 支持 |
| electron-builder / app-builder-lib | 26.8.1 | 第 5 节补丁基于此版本，不同版本代码位置不同 |
| VxKex | 1.2.1.2229 | Win7 兼容层，KexCfg 注册 + kexdll.dll 注入兜底缺失 API |
| KB2533623 | x64 | kernel32 新增 SafeDLL 加载 API（AddDllDirectory 等），Chromium 延迟加载必需 |
| KB2670838 | x64 | 平台更新：Direct2D / DirectWrite / D3D11 / WIC，Chromium GPU 合成必需 |

GUI 安装包自带全部运行时，不依赖系统安装的 Python 或 Node.js：主进程为 Electron 内嵌 Node 16.17；CLI 服务端由捆绑的独立 `node.exe` 22.17.0 承载（详见第 9、13 节——Bun 编译的 sidecar 存在与 Win7 无关的打包缺陷，发行版通过删除 sidecar 触发 main.cjs 内置的 node.exe 回退）；脚本功能由捆绑的 Python 3.8.10 承载。Node 22 官方最低要求 Windows 10，必须经 VxKex 注入方可在 Win7 启动，且**必须关闭版本伪装**（注册清单见第 9 节）；Python 3.8 兼容 Win7 无需注入。**注意：捆绑的 rg.exe（ripgrep 15.1.0，Rust 新版工具链构建）静态导入 `api-ms-win-core-synch-l1-2-0.dll` 的 `WaitOnAddress`/`WakeByAddress*`（Win8+ API），在 Win7 上直接启动会报 DLL 缺失并弹模态错误框，导致工作区搜索（POST /api/search）永久挂起——必须同样经 KexCfg 注册 VxKex 注入**（安装器与 setup-vxkex.bat 均已包含）。截图走 desktopCapturer 原生 API。

---

## 2. electron-builder 构建配置

在 Electron 应用的 package.json 的 `build` 字段中新增 `npmRebuild: false`：

```json
{
  "build": {
    "npmRebuild": false
  }
}
```

Linux 上 node-gyp 不支持为 Windows 交叉编译原生模块（如 node-pty），该选项跳过 rebuild 步骤，直接使用 node_modules 中已有的预编译 Windows 二进制。

---

## 3. 渲染入口 CSS 降级

上游渲染层含超出 Chromium 108 支持范围的 CSS（Tailwind v4 的 oklch 调色板/嵌套、`color-mix()`、`scrollbar-color` 等）。这些是 Chromium 108 的能力边界，与 OS 无关。最终落地为两段式（patch 002，运行时细节见 13.8）：

1. **构建期**：Vite `css.transformer: lightningcss` + `targets: chrome 108`——可静态转译的部分（oklch、嵌套）直接降级，复检产物 oklch=0；
2. **运行期**：`desktop/index.html` 注入求值器（`CSS.supports` 探测，仅 108 触发）——补齐无法静态转译的 var() 型 `color-mix()`、自定义属性内 `lab()/oklch()` 调色板（运行时求值为等价 `rgb()`）、`scrollbar-color` 降级、`overlay` 过渡词剔除，并注入 Set 七方法 polyfill（cytoscape/mermaid 依赖）。现代引擎自动跳过，零开销。

---

## 4. 离线打包配置

创建一个独立的 electron-builder 配置文件，覆盖以下两项：

```javascript
const path = require('path')
const baseConfig = require('../package.json').build

module.exports = {
  ...baseConfig,
  electronDist: path.join(__dirname, '..', 'vendor', 'electron'),
  win: {
    ...baseConfig.win,
    signAndEditExecutable: false,
  },
}
```

- `electronDist`：指向本地 Electron win-x64 分发，三种形式任选其一，构建时不从 GitHub 下载：
  1. zip 文件完整路径（文件名任意）
  2. 目录，内含按官方命名的 `electron-v<版本>-win32-x64.zip`
  3. 目录，即该 zip 解压后的 Electron 根目录（内含 electron.exe）
- `signAndEditExecutable: false`：跳过 rcedit 资源编辑（rcedit 依赖 wine）。无证书时 signtool 也不会被调用，无需额外处理

---

## 5. 核心：NsisTarget.js 免 wine 补丁

**文件**：`node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js`

**背景**：stock electron-builder 在 Linux 上打 NSIS 包时，卸载器 `Uninstall <Product>.exe` 需先跑一遍中间安装器，然后在 wine 中运行该安装器提取出内嵌卸载器。这是 Linux 打 Win 包唯一硬依赖 wine 的环节。

官方代码中已内置纯 Node 替代方案 `UninstallerReader`（直接解析 PE + NSIS 字节流切出卸载器），但仅对 macOS Catalina 及以上版本启用。

**改动**：搜索 `UninstallerReader` 所在的条件判断，将启用条件从仅 macOS Catalina 放宽为所有非 Windows 主机：

```
// 修改前（仅 macOS Catalina+）
if (process.platform === "darwin" && ...)

// 修改后（所有非 Windows 主机）
if (process.platform !== "win32")
```

两遍 makensis 编译流程原样保留，卸载器提取全程无 exe 执行。

**注意**：补丁位于 node_modules 内，任何 `bun install` / `npm install` 会覆盖。构建脚本中应内置校验，缺失时快速报错而非中途死在 "wine is required"。

校验命令：

```bash
grep -q 'process.platform !== "win32"' \
  node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js
```

---

## 6. 交叉编译 sidecar

- 将 `CLI_EXTERNALS` 常量定义移至文件顶部（避免 TDZ 报错）
- 为 Linux 主机增加 CLI 构建路径，交叉产出 Windows 侧车程序（rg.exe、claude-sidecar 等）
- bun compile 阶段若报 `EXDEV: cross-device link not permitted`，将 `TMPDIR` 指到与输出目录同一文件系统

---

## 7. 离线构建脚本

```bash
app_dir="$(cd "$(dirname "$0")/.." && pwd)"

export ELECTRON_BUILDER_CACHE="$app_dir/vendor/electron-builder-cache"

grep -q 'process.platform !== "win32"' \
  "$app_dir/node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js" || {
  echo "NsisTarget.js wine-free patch missing"; exit 1
}

bunx electron-builder --win nsis --x64 --publish never \
  --config build/offline-win.cjs
```

仅读本地 vendor 缓存与 node_modules，不发起网络请求。

构建分为四阶段：

| 阶段 | 内容 | 产物 |
|---|---|---|
| renderer | 前端页面编译（Vite / Webpack 等） | `dist/` |
| sidecars | 交叉编译 CLI 与原生二进制为 Windows 目标 | 侧车程序 |
| main | 编译 Electron 主进程 TypeScript | 主进程 JS |
| package | 运行上述脚本，electron-builder 打包 NSIS | 安装包 .exe |

首次构建需全量执行四阶段。后续仅改打包配置或补丁时，可跳过前三阶段，直接执行第四阶段。

---

## 8. CLI 入口脚本修复

启动脚本中残留 TS 类型注解，因文件无扩展名被 node 按 CJS 解析直接语法报错。找到并移除 `(): string` 等注解。

---

## 9. VxKex 注册脚本

> **重要（VM 实测修订）**：VxKex 1.2.1.2229 **不存在** `KexDll64.dll`（安装目录为
> `Kex32\Kx*.dll`、`Kex64\Kx*.dll`、`KexCfg.exe`、`VxKexLdr.exe`）。旧版
> "IFEO 写 VerifierDlls=KexDll64.dll" 方案对 1.2.x **完全无效**（文件不存在，静默失败）。
> 正确方式是调用 VxKex 官方配置工具 `KexCfg.exe`。

**最终验证配置（Win7 SP1 x64 VM 端到端实测）**——只注册 `node.exe`，且
`WINVERSPOOF:NONE`（版本伪装必须关闭）：

```bat
set "KEXCFG=C:\Program Files\VxKex\KexCfg.exe"
set "NODE=C:\cc-haha\resources\runtime\node\node.exe"

"%KEXCFG%" /EXE:"%NODE%" /ENABLE:YES /WINVERSPOOF:NONE /DISABLEFORCHILD:NO
"%NODE%" --version
```

注册进程清单（相对早期方案的三大修订）：

| 映像 | 结论 | 原因 |
|---|---|---|
| `Claude Code Haha.exe`（GUI 主进程） | **不注册** | Electron 22 / Chromium 108 装好 KB2533623 + KB2670838 后原生兼容 Win7 SP1，注册反而引入变量 |
| `resources\runtime\node\node.exe` | **注册，WINVERSPOOF:NONE** | ① VxKex 需 shim Node 22 导入的 Win8+ API（`EventSetInformation` 等），不注册则 node.exe 以 0xC0000139 退出；② 版本伪装必须关闭——开启 WIN10 伪装时 V8 走 ThreadIsolation 路径，在 `OS::SetPermissions` 中使用 Win10 专有的 `PAGE_TARGETS_INVALID` 标志，触发 `Check failed: 1455L == error`（ERROR_COMMITMENT_LIMIT）崩溃；关闭伪装后 V8 走 Win7 传统内存路径，实测稳定运行 |
| `resources\runtime\python\python.exe` | **注册，WINVERSPOOF:NONE** | UCRT api-set shim；不注册则 Computer Use 的 Python 依赖链不可用（第 14 节依赖此注册） |
| `app.asar.unpacked\src-tauri\binaries\rg.exe` | **注册，WINVERSPOOF:NONE** | 静态导入 `WaitOnAddress`（api-ms-win-core-synch-l1-2-0，Win8+）；不注册则工作区搜索挂起（第 1 节） |
| `claude-sidecar-x86_64-pc-windows-msvc.exe` | **不注册（第 13 节直接删除）** | Bun 编译产物存在打包缺陷（`Cannot find package 'bundle'`），在 Win10 上同样崩溃；删除后走 node.exe 回退 |

原理（VxKex 1.2.x 架构）：KexCfg 在
`HKLM\...\Image File Execution Options\<映像名>` 下写入 `UseFilter=1` 并创建
`VxKex_<哈希>` 子键：

| 注册表值 | 作用 |
|---|---|
| FilterFullPath | 按可执行文件**完整路径**精确匹配（一个子键对应一个路径） |
| KEX_WinVerSpoof | 版本伪装等级（4=WIN10；**本方案必须为 NONE**，原因见上表） |
| KEX_DisableForChild = 0 | 子进程继承 VxKex（node 拉起子进程时必需） |
| GlobalFlag = 0x100 / VerifierFlags = 0x80000000 / VerifierDlls = kexdll.dll | Application Verifier 注入机制，由 KexCfg 自动写入 |

捆绑的 python.exe（UCRT api-set shim）与 rg.exe（`WaitOnAddress`，Win8+ API）同样**必须注册**（ENABLE + WINVERSPOOF:NONE，与第 1 节一致）——安装器（`repack/installer.nsi`）与 `runtime\setup-vxkex.bat` 均按 node/python/rg 三者注册并逐一验证运行。管理员运行一次即可。
完整脚本 `runtime\setup-vxkex.bat`（含安装检测、自定义路径参数与运行验证）。

---

## 10. Win7 前置补丁

| KB | 直链 | SHA1 |
|---|---|---|
| KB2533623 x64 | `http://download.windowsupdate.com/msdownload/update/software/updt/2011/07/windows6.1-kb2533623-x64_8a59ea3c7378895791e6cdca38cc2ad9e83bebff.msu` | `8a59ea3c7378895791e6cdca38cc2ad9e83bebff` |
| KB2670838 x64 | `http://download.windowsupdate.com/msdownload/update/software/ftpk/2013/02/windows6.1-kb2670838-x64_9f667ff60e80b64cbed2774681302baeaf0fc6a6.msu` | `9f667ff60e80b64cbed2774681302baeaf0fc6a6` |

双击 .msu 安装，重启后生效。

---

## 11. 离网构建前置准备

构建期间零网络，需预先准备两项本地缓存：

- Electron win-x64 zip（含 ffmpeg.dll）：可直接指向 zip 文件，或放入目录（保留官方命名 `electron-v<版本>-win32-x64.zip`），或解压成目录，`electronDist` 按第 4 节三种形式之一指向。Electron 版本必须与 npm 中 `electron` 包的版本一致
- electron-builder NSIS 工具链缓存，通过 `ELECTRON_BUILDER_CACHE` 环境变量指向。该缓存在首次联网构建时自动生成，也可从已有构建环境中复制

其余依赖（node_modules）也需在联网环境预先安装完整，之后整体迁移到离网构建机。特别注意 node_modules 中的 NsisTarget.js 补丁必须在迁移后再次确认存在。

---

## 12. Win7 目标机操作（离线一体包）

> **本节为最终交付流程**：使用 `Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe`
> （第 15 节重打包产物）后，目标机只剩两步。原五步手工流程
> （VxKex 手工安装/注册、remove-sidecar.bat 手工部署）已全部
> 内置进安装器，对应脚本仅在故障兜底时手工使用。

1. 安装 KB2533623 和 KB2670838（双击 runtime\kb-patches\ 下的 .msu，重启；
   操作系统级补丁，安装器无法代装）
2. 双击 `Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe`，UAC 点"是"。
   未装 VxKex 时安装器会弹窗引导运行内嵌的 VxKex 离线安装程序，
   随后自动注册 node.exe / python.exe 并完成全部部署
   （支持 `/S` 静默安装与覆盖升级）
3. 从桌面快捷方式启动；控制台窗口出现
   `[Server] Claude Code API server running at http://0.0.0.0:<端口>`
   即成功；Computer Use 在 Settings → Computer Use →
   Install Environment 一键离线启用（第 14 节）

---

## 13. Sidecar 打包缺陷与 Bun→Node 全量移植（最终方案）

### 13.1 缺陷定性

安装包自带的 `claude-sidecar-x86_64-pc-windows-msvc.exe`（Bun 1.2.x 编译）
启动即报 `Cannot find package 'bundle'` 退出。该缺陷是 **Bun 编译打包问题，
与 Win7 无关**（Win10 上同样崩溃），无法通过 VxKex 修复。

### 13.2 main.cjs 内置回退机制（反编译确认）

发行包 `electron-dist/main.cjs` 的服务计划逻辑：

```
hasCompiledSidecar() = exists(<inst>\resources\app.asar.unpacked\
                             src-tauri\binaries\claude-sidecar-<triple>.exe)

createServerPlan():
  if (!hasCompiledSidecar) {
      serverScript = resolveServerScript()   // desktopRoot\dist\server.mjs
      if (serverScript)
          return { command: resolveNodeRuntimeExecutable(),   // node.exe
                   args: [...nodeFlags, serverScript, "server", ...] }
  }
  return sidecar plan
```

关键解析顺序（均无需环境变量，逐级回退）：

- `resolveServerScript`：`CC_HAHA_SERVER_MJS` 环境变量 →
  `<inst>\resources\app.asar.unpacked\dist\server.mjs`
- `resolveNodeRuntimeExecutable`：`CC_HAHA_NODE_EXE` 环境变量 →
  `<inst>\resources\runtime\node\node.exe`（安装包自带，85MB）→ PATH 上的 node

**注意：NSIS 安装包不含 `dist\server.mjs` 等回退产物**（已解包 app-64.7z 与
app.asar 核实，dist/ 内只有前端资源），因此发行包必须附带
`runtime\node-fallback\`（server.mjs、adapters.mjs、cli.mjs、
recovery-cli.mjs、adapters-chunks\ 共 152MB），并由
`remove-sidecar.bat` 部署到安装目录。

### 13.3 NSIS 安装器异步重建 sidecar 的坑

卸载/重装或修复安装时，安装器会在安装流程后期异步重新释放
`src-tauri\binaries\claude-sidecar-*.exe`——即使先删再装也会被重建。
因此 **sidecar 删除必须在 GUI 安装完成之后执行**（第 12 节步骤顺序），
且故障恢复时直接重跑 `remove-sidecar.bat` 即可。

### 13.4 端到端验证记录（QEMU Win7 SP1 x64 VM）

| 检查项 | 结果 |
|---|---|
| KB2533623 + KB2670838 安装 | 通过（Chromium 108 正常渲染） |
| VxKex 1.2.1.2229 + KexCfg 注册 node.exe（WINVERSPOOF:NONE） | 通过，`node --version` → `v22.17.0` |
| 版本伪装开启时 node.exe | `Check failed: 1455L == error` 崩溃（复现确认根因） |
| 不注册 VxKex 时 node.exe | `0xC0000139` 入口点缺失（复现确认根因） |
| sidecar 删除 + server.mjs 部署 | 通过，GUI 自动回退拉起 node.exe（4688 进程审计确认） |
| GUI 启动 | 4 个 `Claude Code Haha.exe` 进程，主界面正常渲染 |
| Node 服务器 | 监听 `0.0.0.0:49276`，`GET /` → **HTTP 200 OK**（返回前端页面） |

### 13.5 Bun→Node 兼容层与构建链（dist 产物线的技术基座）

sidecar 删除后后端改走 Node 的前提，是上游源码全部 Bun 依赖可在 Node 下运行——为此完成全量 Bun→Node 移植（兼容层 `port-src/src/compat/`，构建脚本 `port-src/scripts/node-port/`）。API 映射：

| Bun 依赖 | Node 方案 | 落点 |
|---|---|---|
| `bun:sqlite` | `node:sqlite`（DatabaseSync，布尔参数归一化） | `compat/bunSqlite.ts` |
| `Bun.spawn` | `node:child_process`，复刻 `exited` promise 语义（exit + error 双路 settle） | `compat/bunSpawn.ts` |
| `Bun.serve`（含 WS 升级） | `node:http` + `ws`：路径路由（`/ws/`、`/sdk/`）、升级后禁写 HTTP 响应、ECONNRESET/请求级错误兜底 | `compat/bunServe.ts` |
| `Bun.file` | `node:fs` 流式实现 | `compat/bunFile.ts` |
| `bun:bundle` / `feature()` | shim；`CC_HAHA_FEATURES` 未设置时默认 `TRANSCRIPT_CLASSIFIER`（对齐上游官方入口的全路径特性注入，设空可禁用） | `compat/bunBundle.ts` |
| `import.meta.main` | 新增 `serverNode.ts` 包装入口（Node 下该属性 undefined 导致 server 不自启动） | entrypoints |
| `MACRO.*` 构建期注入 | esbuild `define` 复刻 Bun 发布管线注入（全部 7 键：VERSION/PACKAGE_URL/NATIVE_PACKAGE_URL/VERSION_CHANGELOG/ISSUES_EXPLAINER 等） | build.mjs |

原生/私有模块保持与上游一致的桩策略（`color-diff-napi`、`@ant/claude-for-chrome-mcp` 上游本就指向 stubs）；`@whiskeysockets/baileys` 在 CLI bundle 桩化、adapters 构建用真包。可选集成（sharp、Bedrock/Vertex SDK、OTel 导出器、audio-capture）external + 动态导入回退，与官方 Bun 构建的策略一致。

**构建链**（esbuild，替代全部 `bun build`）：

- `build.mjs` → `dist/{cli,server,recovery-cli,adapters}.mjs` + `adapters-chunks/`（五个 IM 适配器按需分块加载：feishu 5.4MB / whatsapp 4.4MB / telegram 967KB / dingtalk 221KB / wechat 30KB）
- `build-electron.mjs` → 4 个 CJS 产物（external：electron / node-pty / electron-updater）
- banner 统一注入：ESM 兼容 `__dirname`/`__filename`（adapters chunk 内 CJS 依赖必需，否则 `ReferenceError`）、`CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= "1"` 默认值、cli/recovery 的 `process.chdir(CALLER_DIR)`（复刻原 bunfig preload 的两个副作用；server/adapters 不注入，对齐原编译 sidecar 行为）

补丁文件清单与应用顺序见 `patches/README.md`（001 electron22 / 002 css-shim / 004 CU-offline / 005 nowine；003 即本节 main.cjs 回退层，以编译产物交付）。

### 13.6 Node 版本语义：`node:sqlite` 旗标坑

`node:sqlite` 于 22.5.0 引入，**22.5.0–22.12.x 与 23.0–23.3.x 必须加 `--experimental-sqlite`**（22.13.0 / 23.4.0 起免除），否则启动即崩 `ERR_UNKNOWN_BUILTIN_MODULE`。四条路径已全部自动附加旗标：

1. `bin/claude-haha` JS 启动器按 `process.versions.node` 精确区间注入
2. `bin/server-haha(.cmd)` 同逻辑
3. main.cjs `sqliteFlagArgsForVersion()`（`node --version` 探测一次后缓存，server 与 adapters 两个 spawn 计划共用）
4. Windows `.cmd` 启动器路由经 JS 启动器（Windows 同样吃到旗标逻辑）

仅手工 `node dist\*.mjs` 裸跑需自查版本（Node 22.5.0 实测：裸跑崩溃复现 → 启动器自愈 → mock API 端到端通过）。

### 13.7 运行时派生链与环境变量

**桌面壳 spawn 计划**（main.cjs，详见 `port-src/desktop-electron/README.md`）：sidecar 缺失时由 `resolveSidecarExecutable` 切换为 `resolveNodeRuntimeExecutable()` + `[sqlite 旗标…] server.mjs|adapters.mjs`，入口与解释器均可环境变量覆盖；捆绑 node.exe 经 `buildSidecarEnv` 的 PATH 增强定位，安装器另为其建防火墙入站规则。

**server→CLI / cron→CLI 派生**：dist 布局下 launcher 解析为 null 的场景（会话服务与 cron 调度器两处），回退探测 `../bin/claude-haha` 启动器（自带 sqlite 旗标 / CALLER_DIR / 特性注入）；`CC_HAHA_CLI_ENTRY` 直连分支同样补 sqlite 旗标。

**事件循环保活**：`standaloneProviderProxy` 模块加载时 eager 绑定的 `net.Server`（补偿 node:http 下一 tick 才有端口、供同步读 `.port`）创建后立即 `unref()`——否则 CLI 启动错误后进程永久挂起而非退出（上游 `Bun.serve` 同步绑定无此问题，此为语义对齐修复）。

**环境变量参考**（与部署手册 §4 合并）：

| 变量 | 作用 |
|---|---|
| `CC_HAHA_NODE_EXE` / `CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS` | 桌面壳回退链覆盖：node 解释器 / server / adapters 入口 |
| `CC_HAHA_CLI_ENTRY` | server/cron 派生 CLI 的直连入口覆盖 |
| `CC_HAHA_NODE` | 仅 .cmd 启动器：指定 node.exe 全路径 |
| `CC_HAHA_DESKTOP_SERVER_URL` | 远程模式（Win7 只跑 Electron 壳，后端在局域网他机） |
| `CC_HAHA_FEATURES` | 特性开关（默认 TRANSCRIPT_CLASSIFIER，显式设空禁用） |
| `CC_HAHA_SKIP_DOTENV` | 跳过根目录 .env 加载（.cmd 默认置 1） |
| `CLAUDE_CODE_FORCE_RECOVERY_CLI` | 强制进入恢复 CLI |
| `IS_SANDBOX` | 容器/root 高权限场景跳过权限拦截 |
| `NODE_SKIP_PLATFORM_CHECK` | 仅"官方 node.exe + 平台检查豁免"路径需要（部署手册 §2.1 路径 B） |

### 13.8 Electron 22 / Chromium 108 API 边界修复汇总

三个运行时层（主进程 Electron 22 = Node 16.17、渲染层 Chromium 108、sidecar = 系统 Node ≥22.5）各自的越界 API 经六轮全量扫描收敛（明细见 VERIFICATION-REPORT §7–§9）：

| 面 | 修复/回退 |
|---|---|
| 预览面板 | `WebContentsView`/`contentView`（Electron 28+）运行时探测构造器，22 上回退 `BrowserView`/`addBrowserView`（两代 API 同一 bundle 兼容） |
| 文件拖入 | `webUtils.getPathForFile`（Electron 29+）双代兼容：29+ 走 webUtils，≤31 走 `File.path`（32 才移除） |
| 自动更新 | `electron-updater` 懒加载 + no-op 回退（最小化部署缺失时仅告警禁用，不崩溃） |
| GPU 合成 | win32 且 `os.release()` 主版本 <10 自动 `app.disableHardwareAcceleration()`（软件合成，防老显卡驱动 GPU 进程崩溃循环白窗） |
| 渲染层 CSS | 即第 3 节两段式方案（lightningcss chrome108 构建期 + index.html 运行时求值器，patch 002） |
| 桌面终端 | node-pty 1.x 仅 ConPTY（Win10 1809+）；模块加载或 spawn 失败且主版本 <10 时自动管道式 PTY 回退（行式 shell 可用，vim 等全屏程序降级，启动有提示） |
| 工作区搜索 | 内置 ripgrep 14.1.0（双重验证：PE 导入表仅 Win7 可用 API + SubsystemVersion 6.0；运行需 VxKex 注册，见第 9 节） |
| TUI 按键 | VT 模式判定加 `parseFloat(os.release()) >= 10` 门控（Win7 conhost 无 VT 输入，自动用非 VT 按键绑定） |
| 通知 | `isSupported()` 门控——Win7 无 toast 时权限态 denied、发送返回 false，UI 优雅拒绝无崩溃路径 |

---

## 14. Computer Use 离线适配（Win7）

### 14.1 问题背景

Computer Use 依赖 Python 3 + mss / PyAutoGUI / Pillow / pywin32 等库实现
截屏与鼠标键盘控制。GUI 的 Settings → Computer Use 页面默认三项全红
（Python3 / Virtual Environment / Dependencies），且 Win7 目标机通常离线，
标准 setup 流程（venv + ensurepip + PyPI）在捆绑的嵌入式 Python 上全部不可用。

### 14.2 捆绑 Python 的三个硬限制与对策

安装包自带 `resources\runtime\python\python.exe`（3.8.10 嵌入式发行版，
依赖 VxKex shim UCRT，第 9 节已注册）：

| 限制 | 现象 | 对策（落地位置） |
|---|---|---|
| 无 `venv` 模块 | `python -m venv` → `No module named venv` | server.mjs 检测 venv 失败且来源为 bundled 时，回退直接使用内置解释器，并写 `venv-base-interpreter.txt` 标记 |
| 无 `ensurepip` / `pip` | `No module named ensurepip` | 提供 `pip-24.3.1-py3-none-any.whl`，**解压**到 `Lib\site-packages`（见 14.3） |
| `python38._pth` 隔离模式 | sys.path 不含 site-packages，pip 装了也 import 不到 | `remove-sidecar.bat` 检测并重写 `._pth`：追加 `Lib\site-packages` + `import site` |

### 14.3 pip wheel 引导的关键坑

pip ≥21.2 存在自修改保护：以 `python <wheel>/pip install pip …` 方式
运行时会直接报错拒绝（`ERROR: To modify pip, please run … -m pip …`），
exit 1。因此不能通过 wheel 路径执行来安装 pip 自身。

最终方案（server.mjs 两处引导点一致）：

```js
// 1) pip 是纯 Python 包，直接解压 wheel 到 purelib 即可被 -m pip 使用
runCommand(py, ["-c",
  "import os,sys,sysconfig,zipfile; d=sysconfig.get_paths()['purelib'];" +
  " os.makedirs(d,exist_ok=True); zipfile.ZipFile(sys.argv[1]).extractall(d)",
  pipWheelPath])
// 2) 再用 -m pip 离线安装构建工具
runCommand(py, ["-m","pip","install","--no-index",
  "--find-links",wheelsDir, "setuptools","wheel"])
// 3) 依赖安装同样离线
runCommand(py, ["-m","pip","install","--no-index","--no-build-isolation",
  "--find-links",wheelsDir, "-r",requirementsPath])
```

### 14.4 依赖版本锁定（Python 3.8 兼容）

原版 requirements 要求 `Pillow>=11.3.0`（需 Python ≥3.9），Win7 版降为
`Pillow>=10.0.0,<11`（`requirements-win.txt`，remove-sidecar.bat 部署，
server.mjs 内嵌默认值同步修改）。离线轮子清单（`runtime\python\wheels\`，16 个）：

| 轮子 | 版本 | 类型 |
|---|---|---|
| pip | 24.3.1 | 纯 Python（解压引导） |
| setuptools / wheel | 75.3.0 / 0.42.0 | 构建工具 |
| Pillow | 10.4.0 | cp38 win_amd64 二进制 |
| pywin32 | 306+（VM 实测装 311） | cp38 win_amd64 二进制 |
| psutil | 5.9.8+（VM 实测装 7.2.2） | cp37-abi3 二进制 |
| mss | 9.0.2 | 纯 Python |
| pyautogui 及其纯 Python 依赖链 | 0.9.54（pygetwindow / pyrect / pyscreeze / pytweening / mouseinfo / pymsgbox） | 纯 Python |
| pyperclip | 1.10.0+ | 纯 Python |
| screeninfo | 0.8.1 | 纯 Python |

### 14.5 端到端验证记录（QEMU Win7 SP1 x64 VM，干净状态）

清空 `.runtime` 与 `Lib\site-packages` 后从零走 GUI 安装流程：

| 检查项 | 结果 |
|---|---|
| `POST /api/computer-use/setup` | **success:true**，python_check / runtime_files / venv / pip / deps 五步全 ok |
| venv 回退 | 提示"嵌入式 Python 无 venv 模块，直接使用内置解释器"，继续执行 |
| `GET /api/computer-use/status` | `python.installed:true`（3.8.10 bundled）、`venv.created:true`、`dependencies.installed:true` |
| 依赖导入 | `import mss, pyautogui, PIL, psutil, pyperclip, screeninfo` → ok；`import win32api/win32gui/win32con` → ok |
| helper `check_permissions` | `{"ok":true,"accessibility":true,"screenRecording":true}` |
| helper `screenshot` | `{"ok":true,"base64":…}`（54KB 真实屏幕 JPEG） |
| GUI 页面 | 三项全部 check_circle（Installed），底部显示 "All checks passed. Computer Use is ready." |
| 总耗时 | 约 3 分钟（TCG 全模拟环境；真机预计 <1 分钟） |
| 服务器日志 | `[claude-server] [Server] Claude Code API server running at http://0.0.0.0:49276` |

---

## 15. 离线一体安装包（重打包最终方案）

### 15.1 产物与定位

`Claude-Code-Haha-0.5.4-Win7-x64-Offline.exe`（约 175MB，LZMA solid）：
用原生 makensis 重新打包的 NSIS 安装器，把第 9/13/14 节的全部修复
直接嵌入安装器，目标机两步完成部署（第 12 节）。源脚本
`repack/installer.nsi`，payload 为 `repack/app/`（原安装包解包树 +
dist 回退产物注入 + wheels 合并 + `._pth` 修复 - sidecar 移除）。

安装器内置动作（安装 Section 顺序）：

1. `taskkill` 运行中的 GUI / node 实例（覆盖升级安全）
2. 释放全部文件（含 `dist\server.mjs` 回退产物、离线 wheels、
   修复后的 `python38._pth`；payload 本身不含损坏的 sidecar）
3. 创建桌面 / 开始菜单快捷方式 + `WriteUninstaller`
4. **`SetRegView 64` 后写卸载注册表项**（HKLM 64 位视图，
   含 EstimatedSize），随后切 32 位视图 `DeleteRegKey` 清理
   旧版 Wow6432Node 残留（修复卸载列表出现重复/残留项的问题）
5. `netsh advfirewall` 为捆绑 node.exe 建入站允许规则
6. KexCfg 自动注册 node.exe + python.exe（均 `ENABLE:YES +
   WINVERSPOOF:NONE`）；系统未装 VxKex 时弹窗引导运行内嵌
   `KexSetup_Release_1_2_1_2229.exe`，装完继续注册
7. `node --version` 自检（失败弹窗提示手工跑 reg-vxkex.bat）

卸载 Section 对称清理（同样 `SetRegView 64`）：实例停止、防火墙规则、
快捷方式、整个安装目录、64 位卸载项；用户数据
（`%USERPROFILE%\.claude`，含 CU 运行时标记）按设计保留。

### 15.2 重装场景依赖自愈（server.mjs 补丁）

**问题**：CU 依赖装在捆绑 Python 的 site-packages（随程序目录卸载），
而安装完成标记 `~\.claude\.runtime\requirements.sha256`（摘要 stamp）
在用户目录（卸载保留）。重装/升级后 stamp 与 requirements 摘要一致，
setup 直接报"依赖已是最新"跳过安装 → site-packages 实际为空，
helper `import mss` 失败，CU 假性就绪（状态页全绿但截图报错）。

**修复**（server.mjs 两处相同模式：CU setup 的 deps 步骤 +
desktop-control 引导的 `ensureBootstrapped`）：stamp 匹配时先用
`effectivePythonCmd -c "import mss, pyautogui, PIL, psutil, pyperclip,
screeninfo[, win32api]"` 做真实导入探测，探测失败则强制走离线
wheels 重装并回写 stamp。VM 实测：重装后 `import mss` 先失败、
setup 触发重装、随后 imports-ok + 截图 ok。

### 15.3 全生命周期验证记录（QEMU Win7 SP1 x64 VM，全程离网）

| 路径 | 结果 |
|---|---|
| 全新安装（/S 静默 + UAC） | exit=0；文件/快捷方式/64 位卸载项/防火墙规则齐全；node v22.17.0、Python 3.8.10 可运行 |
| 覆盖升级（旧 32 位注册表残留） | exit=0；64 位项写入、Wow6432Node 残留清除；运行中实例安全停止 |
| 卸载（新版 Uninstall.exe /S） | C:\cc-haha 完整移除；64/32 位卸载项均不存在；快捷方式与防火墙规则移除 |
| 卸载后重装 | exit=0；CU setup 触发依赖自愈重装（15.2）；imports-ok、helper 截图 ok |
| Computer Use E2E（离线） | 三项 check_circle + "All checks passed. Computer Use is ready."；check_permissions ok；screenshot 返回 60KB 真实屏幕 JPEG |
| 服务器 | `[Server] Claude Code API server running at http://0.0.0.0:49276` |

验证自动化要点（复现时参考）：UAC 由宿主机经 QEMU VNC 发送
Alt+Y 审批（OCR 轮询安全桌面）；安装器被拒绝提权时以 exit code 5
退出且不产生任何更改——属预期行为。

## 16. v2 会话链路修复 + 覆盖盲区补齐（round24）

v1 验收（第 15 节）覆盖安装/卸载/CU/GUI/API，但 WS 会话、cron 调度、
CLI 入口与 agent 工具循环从未在离线 guest 内真正闭环。round24 用
guest 本地回环 mock API 补齐这些盲区，暴露并修复了两处致命缺陷。

### 16.1 server.mjs 两处修复（v2 核心 delta）

**修复 A — Win32 CLI spawn 路径**：服务端启动 CLI 子进程时使用了
Bun 专属 `--preload` 参数，Node 22 直接报 `bad option` 退出（exit 9），
导致 WS 会话与 cron 任务全部启动失败。win32 分支改为三级解析：
优先直接执行 `dist/cli.mjs` → 兜底 `bin/claude-haha.cmd` 启动器 →
仅非 win32 保留 preload 路径。

**修复 B — 继承环境变量过度剥离**：`shouldStripInheritedProviderEnv`
原无条件剥离继承的 `ANTHROPIC_*`，官方/默认模式下 CLI 拿不到
base_url / api_key / model。改为仅显式选择 provider id 字符串时才剥离，
默认模式放行继承变量。

### 16.2 离线 mock 测试方法

guest 内 `127.0.0.1:8787` 起最小 Anthropic 兼容服务（默认路由已删、
真实外网不可达，回环不受影响）：按 prompt 关键词分流——
`REPLY_WITH_TEXT_ONLY` 回纯文本；`FILE-TOOLS` 回 Write→Read 工具调用
链（相对路径）再回终文本 `FILE-TOOLS-OK`。应用以
`ANTHROPIC_BASE_URL=http://127.0.0.1:8787` 重启后，WS 会话、cron
执行、agent 完整回合均可在离线环境走通真实 spawn 链路。

### 16.3 gap-probe 套件（两阶段）

phase1（mock 环境，17 项）：CLI 冒烟 ×3（--version / recovery-cli
--help / adapters --telegram 无 token 路径）、agent 完整回合（工具
循环后验证 hi.txt 内容=ok）、WS ×4（REST 建会话、connected 帧、
user_message→message_complete、消息持久化 messageCount=8）、
cron ×3（建任务/手动触发/达到 completed 终态）、H5 静态入口、
终端 tab + xterm DOM（pipe-PTY 回退）、端口发现、截图。

phase2（无 mock 重启，3 项）：CJK 设置跨重启 sqlite 回环
（「中文持久化探针-✓」）、WS 会话跨重启存活、端口复发现。

### 16.4 测试基础设施修复（复现必读）

- **UAC 自动审批**：OCR 找 "Yes" 按钮坐标不可靠（缩放/抗锯齿导致
  not-found，提权脚本无限挂起）。auto-trigger 脚本改为识别
  UAC 文案后直接发送 Alt+Y，一次通过。
- **host smbd 看门狗**：QEMU 内建 smbd 曾无故退出（guest 共享
  \\10.0.2.4\qemu 不可达，测试输出文件全部丢失）。长跑脚本需
  轮询 `pgrep smbd` 并以 `/tmp/qemu-smb.*/smb.conf` 自动重启。
- **安装包-测试时序**：修复必须打进安装包并**重新安装**才生效——
  本轮曾因 guest 内仍是修复前构建，WS/cron 三项误报 FAIL。

### 16.5 v2 最终验收（round23 + round24，全离线）

| 套件 | 结果 |
|---|---|
| round23：全新安装 + 完整性 18 项 + E2E 77 项 + CU 探针 | 77/77 PASS，0 FAIL |
| round24：gap-probe phase1 17 项 + phase2 3 项 | 20/20 PASS，0 FAIL |

关键回归点：WS `ended=complete frames=34`（原 timeout + exit 9）、
`messageCount=8`（原 0）、cron `status=completed runs=1`（原空）、
agent `hi.txt=ok`。

v2 产物：`Claude-Code-Haha-0.5.4-Win7-x64-Offline-v2.exe`
sha256 `971df9d518f0d567c4a6a759835d99882cac1fc5abeabac51abce91dbe766ae1`
（体积超 git 上限，以 Release 附件分发；构建脚本 `repack/build-repack.sh`）。

## 17. 覆盖审计与 A 级盲区闭合（round25）

round23/24 之后对全部测试结论做覆盖审计，识别出 8 项此前从未真正
验证过的盲区，round25 一次性闭合，**产品代码零改动**（8 项全部按
预期行为通过，仅修正测试断言与测试基建）。

### 17.1 八项盲区与闭合方式

| 盲区 | 此前状态 | round25 验证 |
|---|---|---|
| API 面全景 | 只测过业务路由，未验证错误路径与 SDK 出站路由隔离 | 12 项：本地路由 200、SDK 出站路由（v1/skills 等）404、filesystem/file 越界 400/403、doctor/repair 干跑 200 |
| H5 访问安全门 | 只验证过"远程拒绝"一条 | 6 项：enable/disable/regenerate/settings 非桌面调用方 403、verify 未知/缺失 bearer 401 |
| 并发 WS 会话 | 只有单会话顺序执行 | 3 会话并发 user_message 全部 message_complete，3 个独立 workDir 工具循环互不串扰 |
| cron 真实调度 | round24 用手动触发，调度器 tick 未验证 | 创建 */1 任务后不手动触发，等真实 tick → completed |
| v1→v2 原地升级 | 全新安装验证过，覆盖安装从未测 | v1 基线 → 不卸载直接覆盖装 v2 → 5 项完整性断言全过 |
| 恢复模式 | recovery-cli --help 冒烟过，损坏场景未测 | 重命名 cli.mjs 模拟损坏 → recovery-cli 文本回合 MOCK-OK → 还原 |
| 崩溃自愈 | 未测 | 定位 PID → 杀进程端口拒连 → 应用重启拉起（Phase C 实测）；确认无进程级 respawn 属设计预期 |
| 非提权运行 | 全程提权测试 | runas /trustlevel:0x20000 受限令牌重启：服务 200、H5 入口 200、持久化数据在位 |

结果：phase1 30/30 PASS + phase2 3/3 PASS，0 FAIL。

### 17.2 测试假阳性修复（复现必读）

- **mock 无条件成功**：原 mock 在收到 tool_result 后无条件回成功文本，
  即使工具根本没执行也显示 TOOL-LOOP-OK。改为校验 tool_result 内容必须
  含 stdout 标记 `AGENT-TOOL-STDOUT-MARKER` 才回成功——随即暴露
  Win7 下 Bash 工具不可用的事实（rg/管道依赖），并发场景改用
  FILE-TOOLS（Write→Read 相对路径）验证工具循环，符合产品在 Win7
  的实际能力面。
- **recovery-cli 断言错位**：recovery-cli 设计上就是纯文本回合，
  断言工具循环属于测错对象；改为 TEXT-ONLY 场景验证。
- **H5 门禁误当故障**：enable/regenerate 返回 403 是"仅桌面端可改"
  的安全设计，非缺陷；断言反转后进入安全门验证组。
- **批处理括号语法**：`(no v2 marker)` 中的右括号提前闭合 if 块导致
  批处理静默截断，改用无括号文案；提权脚本先复制到 %TEMP% 再执行，
  规避 UNC 路径安全警告。

### 17.3 最终汇总

| 套件 | 覆盖 | 结果 |
|---|---|---|
| round23 | 全新安装 + 完整性 18 项 + E2E 77 项 + CU 探针 | 77/77 PASS |
| round24 | CLI/agent/WS/cron/H5/终端/持久化 gap 补齐 | 20/20 PASS |
| round25 | 8 项 A 级盲区（升级/恢复/并发/安全门/非提权等） | 33/33 PASS |

累计 **130 项断言，0 失败**。
预期豁免项（离线环境无法覆盖）：真实外网 API、自动更新、在线市场拉取。

## 18. 源码级对账与残余盲区 sweep（round26）

round25 之后做了一次**源码级对账**：从 server.mjs 提取全部 32 个
`handle*Api` 路由组、从渲染端提取实际侧边栏结构，逐项对照 round23/24/25
的测试明细，发现仍有两类从未触达的功能面（产品零缺陷，纯覆盖缺口）：

1. **19 个 API 路由组零请求**：providers、models、agents、tasks、
   workflows、teams、plugins、mcp、memory、open-targets、activity-stats、
   adapters(+channels)、wechat/whatsapp-adapters、haha 三组 OAuth 状态
   等。round26 对每组发代表性 GET，断言限时内受控响应（<500）且 sweep
   后服务仍健康——全部通过（200/404/405 均为设计内行为）。
2. **GUI 侧边栏未全遍历**：此前仅点击 4 个页面。round26 用 CDP 运行时
   枚举出全部 20 个真实条目并逐个点击验证渲染（含此前从未访问的
   Providers/General/H5 Access/IM Adapters/Terminal/MCP/Agents/Skills/
   Memory/Plugins/Pets 共 11 个设置区页面 + 8 个会话历史条目），
   全部通过，每页留有截图。

round26 结果：**49/49 PASS，0 FAIL**。至此对账闭环：32 个 API 路由组
全部有请求触达、GUI 侧边栏无未访问页面。

### 18.1 round26 暴露的测试基建问题（复现必读）

- **僵尸进程占用 CDP 端口**：反复 `taskkill /im` 全家桶后，guest 会残留
  CDP 端点已死（连接接受但不响应）的进程占住 9222，导致新实例起不来。
  bat 必须按 PID 清剿 9222 占用者并确认端口释放后再重启应用。
- **CDP 调用必须带超时**：`/json/list` 的 fetch 与 Runtime.evaluate 若
  不设超时会无限挂起探针；超时 + 单次重试后稳定。
- **动态 UI 的点击失配**：会话历史的相对时间戳（"4h ago"）随时间变化、
  虚拟滚动把条目移出视口；瞬态浮层按钮（"Expand display"）在枚举后
  消失。处理：前缀匹配 + scrollIntoView，失配时 DOM 重查——仍在则 FAIL、
  已消失则记 transient skip。

### 18.2 最终汇总（round23–26）

| 套件 | 覆盖 | 结果 |
|---|---|---|
| round23 | 全新离线安装 + 完整性 18 项 + E2E 77 项 + CU 探针 | 77/77 PASS |
| round24 | CLI/agent/WS/cron/H5/终端/持久化 gap 补齐 | 20/20 PASS |
| round25 | 8 项 A 级盲区（升级/恢复/并发/安全门/非提权等） | 33/33 PASS |
| round26 | API 全 32 路由组 sweep + GUI 全 20 导航条目遍历 | 49/49 PASS |

累计 **179 项断言，0 失败**，21 个维度。
预期豁免项（离线环境物理不可达）：真实外网 API、真实 OAuth 回调、
Telegram/微信/WhatsApp 通道真实推送、自动更新、在线市场拉取。

## 19. 测试类型学盲区闭合（round27）

round26 之后按**测试类型学**再审计一轮：此前 26 轮几乎全部走 happy
path。round27 用 5 类新场景（mock 新增 SLOW-STREAM / FAIL-NOW）补齐，
**产品零缺陷**——所有路径按设计工作：

| 类型 | 验证结论 |
|---|---|
| 协议负向 | 非法 JSON→PARSE_ERROR、未知类型→UNKNOWN_TYPE、非法 runtime config→RUNTIME_CONFIG_INVALID，连接不中断 |
| 运行中断 | stop_generation 于流式回合中断生效（2 delta 后流停，未跑完 25 tick） |
| 失败终态 | 提供方 500：SDK 10 级指数退避重试 218s → run 标记 failed（exitCode=1、output 落盘 API Error）——不卡 running、不假报成功 |
| 边界路径 | workDir 含空格+中文：Write→Read 工具回合正常落盘目标目录 |
| 生命周期终点 | v2 自卸载全清（exe/dist/快捷方式/安装目录），重装全恢复（含 v2 标记、health） |
| WS 控制面 | 入站 11 种消息类型 100% 受控覆盖（含无挂起 permission_response 的静默忽略语义） |

round27 = **37/37 PASS**（phase1 18 + batch 卸载 4 + phase3 重装 7 + WS 控制面 8）。

### 19.1 本轮沉淀的复现铁律

- **VxKex 注入按路径注册**：捆绑 node.exe 拷贝到任意其他路径都会以
  `0xC0000139`（入口点缺失）死亡——任何"卸载后自检"类测试只能用纯
  batch/系统工具完成，不能依赖拷贝出来的 node。这也再次印证第 1 节
  "必须关闭版本伪装 + 按安装路径注册"的设计约束。
- **cron 失败断言窗口必须大于 SDK 重试梯队**（实测 218s）：窗口不足会
  把"重试中"误判为"卡死"。
- **NSIS 卸载残留是锁竞态**：杀进程后等待 ≥9s 再触发卸载即全清；
  偶发残留目录不代表卸载器缺陷。

### 19.2 最终汇总（round23–30）

| 套件 | 覆盖 | 结果 |
|---|---|---|
| round23 | 全新离线安装 + 完整性 + E2E 77 项 + CU | 77/77 PASS |
| round24 | CLI/agent/WS/cron/H5/终端/持久化 | 20/20 PASS |
| round25 | 8 项 A 级盲区（升级/恢复/并发/安全门/非提权） | 33/33 PASS |
| round26 | API 32 路由组 sweep + GUI 全 20 导航条目 | 49/49 PASS |
| round27 | 类型学盲区（负向/中断/失败终态/自卸载/WS 控制面） | 37/37 PASS |
| round28 | 交互时序与状态机盲区（权限审批/拒绝、多轮上下文、断线恢复） | 29/29 PASS |
| round29 | 数据变更面/输入边界/资源泄漏/实例边界 | 26/26 PASS |
| round30 | GUI 表单控件级/样式加载/Provider 生命周期/GUI 聊天全链路 | 全 PASS（见 §22） |

累计 **300+ 项断言，0 失败**，38 个维度。覆盖完备性经六层对账：源码级
（32 个 handle*Api + WS 11 种入站帧 + GUI 侧边栏运行时枚举）、测试
类型学级（happy/负向/边界/中断/失败/生命周期）、交互时序与状态机级
（权限审批/拒绝全链路、同会话多轮上下文、挂起权限断线重连重放、活动轮
并发）、资源与实例级（进程/内存/二次启动）、mock 场景矩阵
（file-tools/text-only/bash/slow-stream/fail）、GUI 控件与样式级
（6 设置表单页控件操作还原、22 页 + 12 标签页逐页样式计算证明、
Provider 表单闭环、GUI↔API 双向一致性）。豁免项不变（离线物理不可达：真实外网 API、
真实 OAuth 回调、Telegram/微信/WhatsApp 真实推送、自动更新、在线市场）。

## 20. 交互时序与状态机盲区闭合（round28）

round27 之后按**交互时序与状态机**视角第四次审计，发现最关键的一类
盲区：此前所有 WS/cron 测试**全程 bypassPermissions**——真实权限审批
的线上路径从未跑过。round28 用 `default` 模式会话补齐，**产品零缺陷**：

| 时序场景 | 验证结论 |
|---|---|
| 权限审批流 | default 模式下 Write 触发 `permission_request`（input 含 file_path+content）→ 客户端 `permission_response allowed:true` → 广播 `permission_resolved` → 回合完成且 hi.txt=="ok"（Read 只读工具自动放行，符合设计） |
| 权限拒绝流 | 回 `allowed:false` → `permission_resolved(allowed:false)` → 回合**受控结束**（message_complete 无挂起）→ 文件未创建 → turnState 回 idle |
| 多轮上下文 | 同一 WS 会话 3 轮 TEXT-ONLY，mock 回显 `[seen-assistant:0/1/2]` 递增——CLI 会话历史跨轮累积，非每轮新建进程 |
| 断线重连恢复 | 权限挂起时断开 WS → 重连收 `permission_requests_snapshot`（pending id + turnActive=true）→ 服务端**重放同一 requestId** → 批准后回合完成、文件落地 |
| 活动轮并发 | 流式回合中再发 user_message 受控接受，stop_generation 仍生效，连接存活 |

### 20.1 本轮沉淀的复现要点

- **mock 上下文回显**：text-only 场景回 `[seen-assistant:N]`（N=请求中
  历史助手消息数），使"会话上下文是否累积"从推断变为可断言。
- **UAC 与 VNC 合成输入**：secure desktop 下鼠标点击不可靠（11 连击
  失败），键盘 `Alt+Y` 稳定；宿主机侧固化了"启动→检测
  UAC→Alt+Y→验证提权副本开跑"的反馈闭环。

## 21. 数据变更面 / 输入边界 / 资源与实例边界闭合（round29）

round28 之后按**第五视角**（数据变更方向 × 输入质量 × 资源 × 实例）
审计，发现变更面此前只有负向测试（非法 JSON→400、错方法→405），
正向 CRUD 从未执行。round29 复用 round28 的 live mock 环境，**产品
零缺陷**：

| 维度 | 验证结论 |
|---|---|
| 数据变更面 | settings/user PUT 有效负载往返不变形；session PATCH 改名（中文+emoji 标题）持久化；session DELETE→404→列表消失；定时任务 PUT（改名+禁用+cron 三项全生效）+ DELETE 全闭环 |
| 输入边界 | 空消息、emoji+中文、120KB 超大消息均走完整回合链路（服务端不拒收不崩溃）；1000 层深嵌套 JSON→UNKNOWN_TYPE 受容、连接存活 |
| 资源与泄漏 | 完整回合+中断回合后 CLI 子进程 4→4 零孤儿；server RSS Δ仅 1MB |
| 实例边界 | 二次启动 GUI：单实例锁生效（新进程自行退出），原服务器全程 /health 200 |

### 21.1 本轮沉淀的复现要点

- 变更面对账方法：对源码中每个 `method === "DELETE"/"PATCH"/"PUT"`
  分支逐个映射到探针请求——GET sweep（round26）不覆盖变更语义，
  两者不可互替；
- 资源探针须先做 serverPid 定位（netstat 端口→PID）再取 RSS，并留
  ≥20s 让 CLI 子进程自然退出后再计数，否则误报孤儿。

## 22. GUI 表单控件级 / 样式加载 / Provider 生命周期闭合（round30，a–n）

第六视角回归用户核心主题：**Win7 下 GUI 各表单、所有样式加载、后端
API 联动是否全部正常**。此前 GUI 验证止步于"页面渲染存活"（round26），
本轮下钻到控件交互、样式计算与 GUI↔API 双向一致性，**产品零缺陷**
（过程中 3 个探测 FAIL 均为探针定位问题，修正后全绿）：

| 维度 | 验证结论 |
|---|---|
| 设置表单（6 页） | General(12 控件)/H5 Access(5)/IM Adapters(2)/Terminal(2)/Memory(1)/Computer Use(5) 全部渲染；数字输入与开关两处端到端操作→Apply→重访还原；API 侧 byte-identical |
| 样式加载 | 3 样式表、663 条规则生效、0 损坏 link；CSS 变量 :root 解析（--radius-3xl=24px 等）；body 字体 Inter+PingFang SC+Microsoft YaHei；**web 字体离线加载 loaded**；22 侧边栏页 + 12 设置标签页逐页计算样式证明（styledEls 27–86/页） |
| Provider 生命周期 | GUI 表单新增（16 控件 placeholder 填写→Add→API 列表出现）→ 设默认激活（activeId 生效）→ Edit 对话框 → 卡片悬停 Delete→确认→API 清洁+GUI 列表刷新；删除激活中 provider 返回 409（设计保护，providerService.ts:337） |
| GUI 聊天全链路 | 全新会话→输入→Run→**mock 日志 POST /v1/messages 权威命中**→回复流式渲染于转录面板→GUI 存活；WS 控制组 19 帧隔离证明服务端路径正常 |
| GUI↔API 一致性 | 表单保存与 API 状态双向一致；API 删除后 GUI 列表不自动刷新（已知交互局限，重进页面恢复） |

### 22.1 本轮沉淀的复现要点

- GUI 自动化定位对话框按钮：先过滤**含 button 的面板**
  （`[class*="dialog-panel"]`），首个 `[role=dialog]` 常是零按钮的
  scrim 遮罩；Add Provider 的确认按钮文本是 "Add"；
- 卡片操作行（Set default/Test/Edit/Delete）为 `opacity-0 +
  group-hover` 悬停显现，DOM 常在，直接查询即可点击；
- WS user_message 字段是 `content`（非 `text`），错字段**无任何
  错误帧**（静默丢弃）——探针排障时优先核对 events.ts schema；
- body.innerText 含侧边栏会话标题（如历史 MOCK-OK 标题），断言
  回复必须用**转录面板作用域** + mock /__log 双重证据。