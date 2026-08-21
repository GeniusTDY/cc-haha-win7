# cc-haha-win7

[NanmiCoder/cc-haha](https://github.com/NanmiCoder/cc-haha) v0.5.4 的 **Windows 7 SP1 x64 离线移植版**。

上游基于 Electron 42 与 Bun sidecar 架构，均不支持 Win7。本项目将其移植为 Electron 22.3.27（最后一个支持 Win7 的版本）加捆绑 Node 运行时，终端改用 winpty（Win7 无 ConPTY），并配合 VxKex 兼容层与内置 Python、PortableGit 载荷，实现**安装与使用全程离线**。

| 层 | 上游 | Win7 移植 |
|---|---|---|
| 桌面壳 | Electron 42（Win10+） | Electron 22.3.27（Chromium 108） |
| 后端 | Bun 编译 sidecar | 捆绑 node.exe 运行 `dist/server.mjs` |
| 终端 | ConPTY | winpty（完整 TTY） |
| Computer Use | 系统 Python + pip | 捆绑 Python 3.8.10 + 16 个离线 wheel |
| Win8+ API 缺口 | — | VxKex 兼容层（node / python / rg 自动注册） |

> 移植原理见 [Technical-Support.md](Technical-Support.md)

## 仓库结构

| 目录 | 职责 |
|---|---|
| `patches/` | 对上游 v0.5.4 的 6 个补丁（Electron 22 固定 / CSS 垫片 / winpty / Bash 链 / CU 离线 / 免 wine） |
| `port-src/` | 移植新增源码：Bun API 兼容层、esbuild 构建链、main.cjs 编译产物 |
| `repack/` | Stage B 全离线安装器打包脚本 |
| `runtime/` | 装机载荷（~620MB）：Node / Python / PortableGit / VxKex / KB 补丁 / 离线 bundle |
| `vendor/` | 构建期依赖（~1.2GB）：Electron 发行版 / NSIS 缓存 / desktop 依赖树 |

`patches/`、`port-src/`、`runtime/` 各有 README 详述。

## 使用教程

### 环境变量

配置入口按使用方式选择，避免在多处保存同一凭据：

- **桌面端**：设置 → 服务商 中配置，由应用统一管理认证与模型映射；
- **CLI**：`~/.claude/settings.json` 的 `env` 字段，或 Shell 环境变量。

#### 模型服务（Anthropic 兼容接口）

| 变量 | 说明 |
|---|---|
| `ANTHROPIC_API_KEY` | 经 `x-api-key` 头发送，与 Auth Token 二选一 |
| `ANTHROPIC_AUTH_TOKEN` | 经 `Authorization: Bearer` 头发送，与 API Key 二选一 |
| `ANTHROPIC_BASE_URL` | 兼容端点基础地址 |
| `ANTHROPIC_MODEL` | 当前会话默认模型 |
| `ANTHROPIC_DEFAULT_{HAIKU,SONNET,OPUS}_MODEL` | 各模型槽位 |
| `API_TIMEOUT_MS` | 请求超时（毫秒），默认 `600000` |

#### Azure OpenAI

启用需设置 `CLAUDE_CODE_USE_AZURE_OPENAI=1`，并配置 `AZURE_OPENAI_BASE_URL` 与 `AZURE_OPENAI_API_KEY`；可选 `AZURE_OPENAI_API_VERSION`、`AZURE_OPENAI_CODEX_DEPLOYMENT`。

#### 本地运行与隐私

| 变量 | 说明 |
|---|---|
| `CLAUDE_CONFIG_DIR` | 自定义配置目录（默认 `~/.claude`），用于便携模式或隔离测试 |
| `CLAUDE_CODE_LOCAL_RECOVERY` | 设为 `1` 启用简化 Recovery CLI |
| `CLAUDE_CODE_SHELL_PREFIX` | 为 Bash 工具指定 Shell 前缀，如 `wsl -e bash -lc` |
| `DISABLE_TELEMETRY` | 设为 `1` 禁用遥测 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | 设为 `1` 禁用非必要网络请求 |

#### Win7 版专属

| 变量 | 说明 |
|---|---|
| `CC_HAHA_BASH_EXE` | 显式指定 bash.exe 路径；缺省时按 用户 Git → 内置 PortableGit → PATH 顺序解析 |
| `CC_HAHA_RUNTIME_DIR` | 显式指定运行时载荷目录；缺省为安装目录 `resources/runtime` |

### 三种运行模式

| 模式 | 启动方式 | 适用场景 |
|---|---|---|
| 交互式会话（默认） | 直接启动 | 日常终端对话，流式输出与工具调用 |
| `--print` 无头模式 | `cli.mjs -p "任务描述"` | 脚本与 CI 自动化，处理完成后输出结果并退出；支持 `--output-format json`、`--max-budget-usd` |
| 恢复模式 | `CLAUDE_CODE_LOCAL_RECOVERY=1` 或 `-r [id]` | 主 CLI 异常时的简化兜底；`-r` 按会话恢复，配合 `--fork-session` 恢复并创建分支 |

桌面端的每个会话均由上述 CLI 进程驱动（运行在捆绑的 node.exe 上），无需手动启动。Win7 安装布局不提供 `claude-haha` 命令，手动调用 CLI 时以捆绑 Node 直接运行入口脚本：

```bat
"C:\cc-haha\resources\runtime\node-v22.17.0\node.exe" "C:\cc-haha\resources\app.asar.unpacked\dist\cli.mjs" -p "任务描述"
```

### 部署打包

构建流程分为两个阶段，可在 Linux 或 Win10/11 构建机上执行，产物目标机为 Win7 SP1 x64：

- **Stage A**：上游源码 + 补丁 → electron-builder → `win-x64.exe`（可选，跳过时 Stage B 自动使用入仓成品）；
- **Stage B**：上一步产物 + 离线载荷 → 全离线安装器 `win7-x64-setup.exe`。

命令统一采用 Linux 形态；`[Win]` 注释标注 Windows 构建机的差异，其余命令两平台相同。

#### 第 0 步 · 环境准备

```bash
sudo apt-get install -y nodejs git p7zip-full nsis
# [Win] 先执行 git config --global core.autocrlf false（防止换行符改写导致 git apply 失败）
#       改为安装 Git for Windows / Node.js≥18 / 7-Zip / NSIS≥3.08
#       此后所有命令均在 Git Bash 中执行

git clone https://github.com/GeniusTDY/cc-haha-win7.git
cd cc-haha-win7
```

#### Stage A · 从源码构建 win-x64.exe

```bash
cd ..
git clone https://github.com/NanmiCoder/cc-haha.git
cd cc-haha
git checkout d52bbec7

# 上游根目录自身的 67 个 dependencies（axios / lodash-es / react …）未入仓，
# 这是 Stage A 的唯一联网点（esbuild 与 desktop 依赖树均已内置）：
npm install

git apply ../cc-haha-win7/patches/desktop/001-package-json-electron22.patch
git apply ../cc-haha-win7/patches/desktop/002-index-html-css-shim.patch
git apply ../cc-haha-win7/patches/desktop/003-terminal-winpty-fallback.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch

cp -r ../cc-haha-win7/port-src ./

# 五处 Bun 调用点改写未随补丁入仓，需手工补齐（详见 patches/README
# 「源码叠加缺口」）：src/server/index.ts 的 Bun.serve → nodeServe、
# src/server/api/{sessions,computer-use}.ts 的 Bun.spawn → nodeBunSpawn、
# src/server/staticH5.ts 与 src/server/api/previewFs.ts 的 Bun.file →
# nodeBunFile（均改为 import port-src/src/compat 兼容层）。
# 缺此步时构建仍会成功，但 server.mjs 在 Node 下运行即崩（Bun 未定义）。

node port-src/scripts/node-port/build.mjs

# CU 离线 + Win32 CLI spawn 链 + cli.mjs VT 门控修补（标识符自适应，
# 可重现 shipped 产物；patch 005 是 2026-08-18 旧构建的 diff 存档，
# 对新构建 git apply 会失败）：
python3 ../cc-haha-win7/runtime/node-fallback/patch-computer-use.py dist/server.mjs

cd desktop

# 主进程产物覆盖（关键）：上游 TS 源码不含 node 回退层与 winpty 强制，
# 两者仅存在于编译产物中——必须以仓库内置真身覆盖 electron-dist/，
# 否则打出的 app.asar 缺回退层，Stage B 删除 sidecar 后 server 无法启动
mkdir -p electron-dist
cp ../port-src/desktop-electron/*.cjs electron-dist/

bash ../../cc-haha-win7/vendor/desktop-node-modules-0.5.4/restore.sh

# NSIS 免 wine 补丁（restore.sh 重装 node_modules 后必须重打，Linux 构建机必需）：
git apply ../../cc-haha-win7/patches/electron-builder/006-nsis-target-nowine.patch

export ELECTRON_BUILDER_CACHE="$PWD/../../cc-haha-win7/vendor/electron-builder-cache-26.8.1"

npx electron-builder --config ../port-src/desktop/offline-win.cjs --win --publish never
```

产物：`build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe`（约 122 MB）

#### Stage B · 重打包为离线安装器

```bash
cd ../../cc-haha-win7/repack

NODE_FALLBACK_DIR=../runtime/node-fallback \
RUNTIME_DIR=../runtime \
  ./build-repack.sh
```

产物：`Claude-Code-Haha-0.5.4-win7-x64-setup.exe`，刻录或拷贝至 U 盘后，可在 Win7 SP1 x64 离线机器上直接安装。

若使用 Stage A 产物作为输入（注意：Stage A 产物名为 `win-x64.exe`，与 Stage B 默认种子 `Win7-x64-Setup.exe` 不同，需显式传参）：

```bash
./build-repack.sh ../../cc-haha/desktop/build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe
```

#### 发布新版本（自动更新分发）

```bash
node make-latest-yml.mjs Claude-Code-Haha-0.5.4-win7-x64-setup.exe 0.5.4
```

将生成的 `latest.yml` 与新 setup.exe 一并挂到本仓库最新的非预发布 Release，版本号大于已装版本时，存量用户会收到更新提示。

---

Stage B 全程零联网：esbuild、desktop 依赖树（替代 desktop/ 的 `npm install`）、Electron 分发、NSIS 工具链缓存与全部运行时载荷均以普通文件内置入仓，克隆后可直接运行 `build-repack.sh`。Stage A 从源码重建时的唯一联网点是上游根目录自身的 67 个 dependencies（见 patches/README「源码叠加缺口」）。
