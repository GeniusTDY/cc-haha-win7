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
