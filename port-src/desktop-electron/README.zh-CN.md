# desktop-electron — Electron 主进程构建产物（Win7 移植）

[English](README.md) | **简体中文**

这是 Win7 桌面构建（Electron 22.3.27）的四个编译产物，与离线安装器
`resources/app.asar` 内的产物字节一致：

| 文件 | sha256（前 16 位） | 角色 |
|---|---|---|
| `main.cjs` | `b42ba76eed1eb658` | 主进程（node 回退层 + winpty 强制，见下） |
| `preload.cjs` | `17710337ae27feb7` | 渲染层 preload |
| `pet-preload.cjs` | `7d73778fe069d0d8` | 宠物窗口 preload |
| `preview-preload.cjs` | `819aae02d816873d` | 预览窗口 preload |

完整哈希：本目录的 `MANIFEST.sha256`。`main.cjs` 同时携带两项
Win7 移植新增——下述 node-runtime 回退层**以及** winpty 后端强制
（旧版 Windows 上的 `ptySpawnOptions.useConpty = false`，即
`repack/patch-app-asar.mjs` 给缺少该段的 asar 内 main.cjs 插入的
同一 hunk；该修补器幂等，因此把这份已修补的 main.cjs 叠加进
Stage A 构建是安全的）。

它们在 `app.asar` 内位于 `electron-dist/*.cjs`。桌面构建编译
`desktop/electron/*.ts`（上游）加上下述 Win7 移植新增；从源码重建时，
输出必须在 electron-builder 打包 asar 前叠加到 `electron-dist/`。

## main.cjs node-runtime 回退层（Win7 移植新增）

上游 v0.5.4 派生 Bun 编译的 sidecar
（`src-tauri/binaries/claude-sidecar-x86_64-pc-windows-msvc.exe`）承载
server 与 adapter 进程。该二进制存在与 Win7 无关的打包缺陷，被离线
重打包**有意删除**；main.cjs 随即回退为派生捆绑 Node.js 运行时：

```
main.cjs（shipped）                    上游等价物
---------------------------------------  ------------------------------------------
var NODE_RUNTIME_EXE_ENV =              （不存在——仅 sidecar）
  "CC_HAHA_NODE_EXE";
var SERVER_MJS_ENV = "CC_HAHA_SERVER_MJS";
var ADAPTERS_MJS_ENV =
  "CC_HAHA_ADAPTERS_MJS";

function resolveNodeRuntimeExecutable()  环境变量覆盖 CC_HAHA_NODE_EXE
  // CC_HAHA_NODE_EXE 若存在则用之，   否则 "node.exe"（win32）/ "node"
  // 否则 "node.exe" / "node"

function sqliteFlagArgsForVersion(v)    Node 22.5–22.12 / 23.0–23.3:
  // ["--experimental-sqlite"]           node:sqlite 需要该旗标

function nodeRuntimeFlags()             探测一次 `node --version` 并
  // 缓存版本探测                        返回 [] 或 sqlite 旗标
```

spawn 计划点（server + adapters）从
`command: resolveSidecarExecutable(desktopRoot)` 切换为
`command: resolveNodeRuntimeExecutable(env), args: [<sqlite 旗标>,
server.mjs | adapters.mjs, ...]`，入口解析可经
`CC_HAHA_SERVER_MJS` / `CC_HAHA_ADAPTERS_MJS` 覆盖。

捆绑的 `resources/runtime/node-v22.17.0/node.exe`（Node 22.17.0
win-x64）由 `resolveNodeRuntimeExecutable` 直探解析（探测顺序：
`CC_HAHA_NODE_EXE` → `desktopRoot/runtime/node-v22.17.0/node.exe` →
`../runtime/node-v22.17.0/node.exe` → `process.resourcesPath/runtime/
node-v22.17.0/node.exe` → PATH）——安装器还会为它建防火墙入站规则。
sidecar 子进程环境另经 `withBundledRipgrepPath` 把捆绑 ripgrep 所在
目录注入 PATH（`buildSidecarEnv` 本身只设置 `CLAUDE_H5_*` /
`CLAUDE_CONFIG_DIR` / `XDG_CACHE_HOME`，不改 PATH）。在 Win7 上，
node.exe 仅在 VxKex 兼容层下才能启动（以 `WINVERSPOOF:NONE` 注册；
见 `runtime/setup-vxkex.bat`）。

参考：仓库根目录 Technical-Support.zh-CN.md §3、§4.4、§6。
