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
| `CLAUDE_CODE_FORCE_RECOVERY_CLI` | 设为 `1` 启用简化 Recovery CLI |
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
| `--print` 无头模式 | `claude-haha -p "任务描述"` | 脚本与 CI 自动化，处理完成后输出结果并退出；支持 `--output-format json`、`--max-budget-usd` |
| 恢复模式 | `CLAUDE_CODE_FORCE_RECOVERY_CLI=1` 或 `-r [id]` | 主 CLI 异常时的简化兜底；`-r` 按会话恢复，配合 `--fork-session` 恢复并创建分支 |

桌面端的每个会话均由上述 CLI 进程驱动（运行在捆绑的 node.exe 上），无需手动启动。

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

git apply ../cc-haha-win7/patches/desktop/001-package-json-electron22.patch
git apply ../cc-haha-win7/patches/desktop/002-index-html-css-shim.patch
git apply ../cc-haha-win7/patches/desktop/003-terminal-winpty-fallback.patch
git apply ../cc-haha-win7/patches/cli/004-shell-win32-bash-resolution.patch

cp -r ../cc-haha-win7/port-src ./

node port-src/scripts/node-port/build.mjs

git apply ../cc-haha-win7/patches/cli/005-server-mjs-computer-use-offline.patch

cd desktop
bash ../../cc-haha-win7/vendor/desktop-node-modules/restore.sh

export ELECTRON_BUILDER_CACHE="$PWD/../../cc-haha-win7/vendor/electron-builder-cache"

npx electron-builder --config ../port-src/desktop/offline-win.cjs --win
```

产物：`build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe`（约 122 MB）

#### Stage B · 重打包为离线安装器

```bash
cd ../cc-haha-win7/repack

NODE_FALLBACK_DIR=../runtime/node-fallback \
RUNTIME_DIR=../runtime \
  ./build-repack.sh
```

产物：`Claude-Code-Haha-0.5.4-win7-x64-setup.exe`，刻录或拷贝至 U 盘后，可在 Win7 SP1 x64 离线机器上直接安装。

若使用 Stage A 产物作为输入：

```bash
./build-repack.sh ../../cc-haha/desktop/build-artifacts/electron/Claude-Code-Haha-0.5.4-win-x64.exe
```

---

克隆即彻底零联网：esbuild、desktop 依赖树（替代 `npm install`）、Electron 分发、NSIS 工具链缓存与全部运行时载荷均以普通文件内置入仓。
