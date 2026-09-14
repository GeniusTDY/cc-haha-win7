# runtime/ — 离线运行时载荷（Win7）

[English](README.md) | **简体中文**

离线安装器叠加进 `resources/runtime/` 的全部内容。
**node-v22.17.0/、python-3.8.10/ 与 vxkex-1.2.1.2229/ 已提交入 git**（共 128MB，
从已验证的发布版 Offline.exe 提取——修正过的
`python38._pth` 与全部 16 个 wheel 均已应用），因此 `git clone`
之后可直接运行 `repack/build-repack.sh`：

```bash
NODE_FALLBACK_DIR=../runtime/node-fallback RUNTIME_DIR=../runtime \
  ./build-repack.sh
```

`git-2.45.2/`（PortableGit 2.45.2）与 `kb-patches/`（KB2533623 +
KB2670838 MSU）也已入仓——因此一台干净的离线 Win7 除克隆本仓库
和那一个安装器外零下载：装两个 KB 补丁（git 跟踪、不随安装器分发），
运行安装器，完成。

## 安装器内随附布局

```
resources/runtime/
├── node-v22.17.0/   Node.js 22.17.0 win-x64（node.exe …）      [入 git，82MB]
├── python-3.8.10/   Python 3.8.10 embeddable win amd64          [入 git，33MB]
│   ├── python38._pth    已修正："python38.zip / . / Lib\site-packages / import site"
│   │                    （原版 embeddable 默认禁用 site-packages）
│   └── wheels/          16 个离线 wheel：pyautogui 全家桶
│                        (mouseinfo mss pillow psutil pyautogui
│                        pygetwindow pymsgbox pyperclip pyrect
│                        pyscreeze pytweening pywin32 screeninfo)
│                        + pip-24.3.1 / setuptools-75.3.0 / wheel-0.42.0
├── vxkex-1.2.1.2229/ KexSetup_Release_1_2_1_2229.exe（VxKex 1.2.1）[入 git，13MB]
├── git-2.45.2/      PortableGit 2.45.2 解包——干净离线 Win7 上的
│                    Bash 工具 shell（2.46+ 已放弃 Win7）[入 git，404MB]
├── kb-patches/      Windows6.1-KB2533623-x64.msu + KB2670838-x64.msu
│                    （干净 Win7 SP1 上在 VxKex 安装之前先装两个；
│                    SHA1 与微软官方值一致——仓库根
│                    Technical-Support.md §2）
│                    [仅 git，14MB——不随安装器分发；
│                     build-repack.sh 从不将其拷入 resources/runtime/]
├── setup-vxkex.bat  手动 KexCfg 注册（安装器自动完成；
│                    本脚本是兜底）
├── requirements-win.txt / requirements.txt / win_helper.py
└── （node-fallback bundle 部署到 resources/app.asar.unpacked/dist/，
     见 node-fallback/ 与 patches/cli/004）
```

## VxKex 注册矩阵（Win7 SP1 x64 实测验证）

| 可执行文件 | 处理 | 原因 |
|---|---|---|
| `runtime/node-v22.17.0/node.exe` | KexCfg ENABLE，**WINVERSPOOF:NONE** | Node 22 需要 Win8+ API；版本伪装必须关闭，否则 V8 的 ThreadIsolation 路径在 Win7 上崩溃（见 Technical-Support.md §3） |
| `runtime/python-3.8.10/python.exe` | ENABLE，WINVERSPOOF:NONE | UCRT api-set shim |
| `app.asar.unpacked/src-tauri/binaries/rg.exe` | ENABLE，WINVERSPOOF:NONE | 静态导入 `WaitOnAddress`（api-ms-win-core-synch-l1-2-0，Win8+）；不注册则 POST /api/search 在模态 DLL 错误框后永久挂起 |
| `Claude Code Haha.exe` | 不注册 | Electron 22 原生运行于 Win7 |

## 入 git 载荷来源与校验和

已提交的 node-v22.17.0 / python-3.8.10 / vxkex-1.2.1.2229 目录树
提取自已发布的 Win7 离线安装器（v0.5.4 构建，sha256
`3221d5e9…a025b40`）。它们是版本无关的运行时载荷，原样带入
v0.6.2 安装器，因此修正过的 `python38._pth` 与 16 个 wheel
均已应用——克隆后无需修补。

| 载荷 | 关键文件 | sha256 |
|---|---|---|
| `node-v22.17.0/` | `node-v22.17.0/node.exe` | `39d45b59…20f3636` |
| `python-3.8.10/` | `python-3.8.10/python.exe` | `5275c42f…b074581` |
| `vxkex-1.2.1.2229/` | `vxkex-1.2.1.2229/KexSetup_Release_1_2_1_2229.exe` | `7db81065…6c8708cd` |
| `git-2.45.2/` | `git-2.45.2/bin/bash.exe` | 见 `sha256sums.txt` |
| `kb-patches/` | 两个 `.msu` 文件 | 见 `sha256sums.txt` |

以 `cd runtime && sha256sum -c sha256sums.txt` 验证。

## git-2.45.2/ 来源（PortableGit 2.45.2）

上游自解压档案 `PortableGit-2.45.2-64-bit.7z.exe`
（sha256 `851a1507…c27ccdd`，来自
<https://github.com/git-for-windows/git/releases/tag/v2.45.2.windows.1>）
的原始解包——2.45.2 是仍能在 Win7 上运行的最后一个 Git 版本线。

说明：

- Bash 工具 shell 解析链（补丁 004）探测
  `runtime/git-2.45.2/bin/bash.exe`
  ——位于解包根目录，因此该目录树按入仓状态直接可用。
- 上游的 `post-install.bat` 步骤**未**预执行：其唯一关键效果
  （把 `mingw64/bin/*.dll` 硬链接进 `mingw64/libexec/git-core/`）
  在档案内**已经满足**；其余动作（`/etc/mtab`、拷贝 Windows
  `hosts` 等）只影响 `df`/`mount` 显示。在目标机上运行一次
  `runtime\git-2.45.2\post-install.bat` 是获得完整上游处理的
  可选方式（幂等，完成后自删）。

## 剩余附件（GitHub Release——仅安装器）

全部运行时载荷均已入 git；Release 只挂一个成品安装器——最新构建：

| 附件 | 用途 | sha256 |
|---|---|---|
| `Claude-Code-Haha-0.6.2-win7-x64-setup.exe` | **2026-09-13 v0.6.2 Win7 重建（265,758,324 字节）**——上游 v0.6.2 源码重新适配到 Win7 移植：补丁系列 008/009/010/013 + 编译版移植覆盖层为 v0.6.2 重建，内网层（013/014 门控 + 末系列渲染层）重切，node-fallback bundle 重新推导（server/CLI/recovery + 覆盖 v0.6.2 八个适配器旗标的完整 44 模块 `adapters-chunks/` 导入闭包），版本戳 `resources/runtime/` 载荷（node 22.17.0 / Python 3.8.10 / VxKex 1.2.1.2229 / PortableGit 2.45.2 + node-pty）叠加，锁定的 ripgrep 15.1.0 `rg.exe` 重新部署到 `app.asar.unpacked/src-tauri/binaries/`（损坏的编译版 sidecar 保持删除，从而由 `hasCompiledSidecar()` 驱动 node 回退）。`app-update.yml` 仍指向本仓库。配套 `latest.yml` 供 electron-updater 使用。取代 0.5.4 构建（`c6727145…c8946c1`），其 node/python/vxkex 目录树即本目录中已提交的版本无关载荷 | `218d3899…291ee9` |

## node-pty-1.1.0-win32-x64/（入 git，约 1MB）

内置 node-pty 1.1.0 运行时子集（lib/ JS + `prebuilds/win32-x64/`
N-API `pty.node` + `winpty-agent.exe` + `winpty.dll`；省略 conpty
部分——应用经补丁 003 在 Win7/8 强制 winpty 后端）。重打包脚本
（步骤 7/9）在 Stage A 载荷缺失或被裁剪掉该模块时将其叠加到
`resources/app.asar.unpacked/node_modules/node-pty`，保证桌面终端
保持完整 TTY 仿真（winpty 原生支持 Win7——agent 无需 VxKex 注册）。

## ripgrep-15.1.0-win32-x64/（入 git，约 4MB）

内置 ripgrep 15.1.0 win-x64 二进制（`rg.exe`）及其
`ripgrep-licenses/`（COPYING / LICENSE-MIT / UNLICENSE）与
`ripgrep-manifest.json`——正是上游
`desktop/scripts/prepare-ripgrep.ts` 部署进 `src-tauri/binaries/`
的那份载荷。v0.6.2 的 Stage A 载荷完全不携带 `src-tauri/` 目录树
（`app.asar.unpacked/` 下只剩 `dist/`、`electron-dist/` 与
`node_modules/`），因此 `repack/build-repack.sh` 步骤 5/9 会创建
`resources/app.asar.unpacked/src-tauri/binaries/`、删除损坏的
编译版 sidecar 并拷入本载荷。`rg.exe` 必须存在于此，原因有二：
`installer.nsi` 要将其注册进 VxKex（`WaitOnAddress` shim——见上文
矩阵），且 `main-guest.cjs` 经 `withBundledRipgrepPath()` 解析它。
sidecar 特意保持缺失——这样 `hasCompiledSidecar()` 会走内置的
node 回退。

二进制来源：`rg.exe` 与 v0.5.4 发布版所附带的那份字节一致（离线从
`Claude-Code-Haha-0.5.4-Win7-x64-Setup.exe` 重新解出），sha256
`decdd4992f3f1b9a5ef9898f1b40ab16886d579d6516b4efd3d5eaa19364e408`
（4,266,496 字节）；上游锁定档案
`ripgrep-15.1.0-x86_64-pc-windows-msvc.zip` 的 sha256 为
`124510b94b6baa3380d051fdf4650eaa80a302c876d611e9dba0b2e18d87493a`。

## node-fallback/

部署到 `resources/app.asar.unpacked/dist/` 的 Node 移植
server/CLI bundle（server.mjs + adapters.mjs + cli.mjs +
recovery-cli.mjs + adapters-chunks/）。此处提交的文件均已完整
修补；重打包构建脚本按原样部署。`adapters-chunks/` 必须保持
完整的 44 模块导入闭包——8 个适配器分块（feishu / whatsapp /
telegram / dingtalk / qq / wecom / wechat / slack）+ 22 个共享
`chunk-*.mjs`（含 `adapters.mjs` 导入的宏初始化分块
`chunk-57T55QIK.mjs`）+ 14 个 parser/lib 分块——适配器分块静态导入
它们，丢任何一个都会让 `--feishu/--telegram/--wechat/--dingtalk/
--whatsapp/--wecom/--qq/--slack` 全部以
ERR_MODULE_NOT_FOUND 失败。feishu/dingtalk 适配器分块存档时
已剥离第三方 SDK 的中文 JSDoc 注释（经
`port-src/scripts/node-port/strip-cjk-comments.mjs` 处理，该步骤
同样在构建期运行；代码经 esbuild 规范化验证字节等价）。
`remove-sidecar.bat` 是历史遗留的 pre-repack 清理脚本（已被
build-repack.sh 步骤 5 取代），而 `patch-computer-use.py`
仍是现行标识符自适应修补器（P1–P10，含 cli.mjs VT 输入门控），
用于从全新 Stage A 构建重新推导这些 bundle。
