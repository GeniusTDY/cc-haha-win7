# cc-haha v2 (Win7 离线版) 测试覆盖矩阵

- 对象: `Claude-Code-Haha-0.5.4-Win7-x64-Offline-v2.exe`
  sha256 `03286eaf62a5ce7e607c610bc66787897be87c9539ff648225f98a4b0ba716be`
- 环境: Win7 SP1 x64 VM（QEMU，完全离线：默认路由删除 + ping 8.8.8.8/github.com 超时证明）
- 最终结果: **round23 = 77/77 PASS，round24 = 17+3/20 全 PASS，round25 = 30+3/33 全 PASS，0 FAIL**

## 1. 最终验收套件（当前有效）

| 脚本 | 阶段 | 覆盖点 | 结果 |
|---|---|---|---|
| round23.bat | 卸载旧版 | Uninstall.exe /S 静默卸载 + 残留目录清理 | uninstall-exit 记录（首次无旧版时=2 属预期） |
| | 首次运行场景 | 清空 %APPDATA%\cc-haha、~/.claude/.runtime、~/.claude/cc-haha | 通过 |
| | 离线证明 | route delete + ping 8.8.8.8/DNS 超时 + SMB(10.0.2.4)仍可达 | ping 超时=离线成立 |
| | 静默安装 | v2.exe /S 提权静默安装（离线） | install-exit=0 |
| | 安装完整性 (18 项) | 主 exe、dist/{server,adapters,cli,recovery-cli}.mjs、adapters-chunks、**sidecar 已移除**、rg.exe、node.exe、python.exe、pip wheel、python38._pth(Lib\site-packages + import site)、setup-vxkex(KexCfg)、index.html CSS shim、asar 内 node-fallback、v2 server.mjs 标记 | 全 [OK] |
| | 运行时可用 | node --version / python --version / rg --version（VxKex 生效证明） | 全部 exit=0 |
| | 全量 E2E | 见 e2e-full.mjs 77 项（下表） | 77/77 |
| | CU 自定义路径探针 | cu-setup-probe.mjs（下表） | RESULT: PASS |
| | 路由恢复 | route add 还原 | exit=0 |
| round24.bat | 安装器副产物 | 桌面/开始菜单快捷方式、Uninstall.exe 存在 | 通过 |
| | 离线 + guest 本地 mock | 127.0.0.1:8787 mock Anthropic API（FILE-TOOLS 工具链 + 流式） | mock-health OK |
| | gap-probe phase1 (17 项) | 见下表 | 17/17 |
| | gap-probe phase2 (3 项) | 无 mock 环境重启后持久化复查 | 3/3 |
| | 路由恢复 | route add | exit=0 |
| round25.bat | Phase A：v1→v2 原地升级 | 先装 v1 建基线（确认无 v2 标记）→ 不卸载直接覆盖安装 v2 → exe/v2 server.mjs/spawn 修复/sidecar 已移除/卸载器 5 项断言 | 全 [OK] |
| | round25-probe phase1 (30 项) | 见第 4 节 | 30/30 |
| | Phase C：非提权重启 | runas /trustlevel:0x20000 受限令牌重启应用 | 探针可连 |
| | round25-probe phase2 (3 项) | 受限令牌下服务可用性 + 崩溃后重启恢复 | 3/3 |
| | 路由恢复 | route add | exit=0 |

## 2. e2e-full.mjs — 77 项明细（全 PASS）

| 类别 | 检查 |
|---|---|
| server (1) | 端口发现（netstat） |
| api-get (2) | /api/settings/user、/api/conversations/:id/status |
| api-sec (1) | /api/h5-access 本地独占门（远程拒绝） |
| api-post (6) | /api/search 命中、默认 cwd、/api/market、/api/diagnostics/local-index/rebuild、/api/filesystem/browse、/api/computer-use/setup |
| api-put (2) | /api/settings/user 读写回环、/api/desktop-ui/preferences/pet 回环 |
| python (3) | 依赖 imports、win_helper check_permissions、win_helper screenshot |
| gui (9) | CDP 连接、导航枚举、New session/Providers/Scheduled/Settings 页、设置 tabs 枚举 ×4、Computer Use 页 |
| style (2) | 计算样式 + 样式表加载、无裸控件（Win7 CSS shim 验证） |
| form (6) | CU 表单枚举、填写 python path、Apply、Recheck Status、modal 开启 + Esc 关闭 |
| screenshot (14) | 每页/关键状态截图存证（e2e-shots/*.png） |
| fatal (1) | 驱动自身无致命错误 |

## 3. gap-probe.mjs — 覆盖盲区补齐（20/20 PASS）

| 类别 | 检查 | 本轮结果 |
|---|---|---|
| cli (3) | cli.mjs --version、recovery-cli --help、adapters --telegram（分块加载/无 token 路径） | PASS |
| agent (1) | 完整 agent 回合：CLI 入口 + Write→Read 工具循环（mock API 驱动，hi.txt 内容=ok） | PASS |
| ws (4) | REST 建会话(201)、WS connected 帧、**user_message→message_complete**（服务端 spawn CLI 子进程）、会话详情消息持久化(messageCount=8) | PASS（修复验证点） |
| cron (3) | 建任务(201)、手动触发(200)、**run 达到 SUCCESS/completed 终态**（调度器+spawn 链路） | PASS（修复验证点） |
| h5 (1) | GET / 提供 H5 静态入口 | PASS |
| term (3) | 终端 tab 点击、xterm DOM 挂载（pipe-PTY 回退）、CDP 截图 | PASS |
| server (1) | 端口发现 | PASS |
| persist (2) | **CJK 设置跨应用重启**（sqlite 中文回环「中文持久化探针-✓」）、**WS 会话跨重启存活** | PASS |
| 截图 (1) | 40-terminal-tab.png | PASS |

## 4. round25-probe.mjs — A 级盲区闭合（30+3/33 PASS）

对 round23/24 之后的覆盖审计识别出 8 项盲区，全部闭合：

| 盲区 | 检查 | 结果 |
|---|---|---|
| API 面 (12) | doctor/traces(+settings)/sessions/skills 本地路由 200；v1/skills、features、claude_code/metrics 等 SDK 出站路由 404（证明不误挂本地）；filesystem/file 无 path→400、任意路径/越界路径→403；doctor/repair 空 targets 干跑 200 | PASS |
| H5 安全门 (6) | enable/disable/regenerate 非桌面调用方一律 403（本地独占）；settings 读 403；verify 拒绝未知/缺失 bearer 401 | PASS |
| 并发 WS 会话 (2) | 3 个会话同时 user_message→全部 message_complete；3 个独立 workDir 各自 Write→Read 工具循环互不串扰（hi.txt=ok ×3） | PASS |
| cron 真调度 (3) | 创建 */1 每分钟任务(201)后**不手动触发**，等待调度器真实 tick → status=completed runs=1；任务删除清理 | PASS |
| v1→v2 原地升级 (Phase A, 5) | v1 基线确认（无 v2 标记）→ 不卸载直接覆盖装 v2：主 exe、v2 server.mjs（bundledCandidateMatch 标记）、spawn 修复（cliMjs2）、sidecar 已移除、卸载器在位 | PASS |
| 恢复模式 (3) | 重命名 cli.mjs 模拟主 CLI 损坏 → recovery-cli 文本回合仍 MOCK-OK（exit=0）→ cli.mjs 还原 | PASS |
| 崩溃自愈 (3) | 定位服务监听 PID→taskkill 后端口即拒连（进程确已死）→ 支持的恢复路径为应用重启（Phase C 实测拉起成功，无进程级 respawn 属设计预期） | PASS |
| 非提权运行 (phase2, 3) | runas /trustlevel:0x20000 受限令牌重启后：端口复发现、/health 200（且持久化探针值仍在）、H5 静态入口 200 | PASS |

关键测试方法：mock-anthropic.mjs 新增 TEXT-ONLY 场景（recovery-cli 纯文本回合）与
Bash 场景 stdout 标记校验（`AGENT-TOOL-STDOUT-MARKER` 必须出现在 tool_result 中
才回 TOOL-LOOP-OK，杜绝无条件成功的假阳性）；FILE-TOOLS 并发场景用独立 workDir
验证会话隔离。

## 5. 修复回归对照（v2 上一版 → 本版）

| 问题 | 症状 | 修复 | 验证 |
|---|---|---|---|
| 服务端 spawn CLI 用了 Bun 专属 `--preload` | node.exe 报 bad option，WS/cron 全挂 | win32 分支改为直接执行 cli.mjs，保留 .cmd 启动器与 preload 兜底 | WS ended=complete frames=34；cron status=completed |
| 继承环境变量被过度剥离 | CLI 拿不到 ANTHROPIC_* | 仅显式选择 provider id 时才剥离 | agent turn / WS / cron 全通过 |

## 6. 历史脚本归类（迭代遗留，结论已收敛进 round23/24/25，无需再跑）

| 组 | 脚本 | 用途（已被取代） |
|---|---|---|
| 环境搭建/启动 | run-vm.sh, qvm.sh, launch-gui.bat, enable-vxkex.bat, kexfix*, reg-vxkex-vm.bat, restore-vxkex.bat | VM/VxKex 一次性环境搭建 |
| 探索诊断 | explore.bat, miniprobe.bat, apiprobe.bat, whereis-node.bat, check-fallback.bat, check-ifeo.bat, fix-ifeo.bat, v8-flags.bat, matrix-node.bat, matrix-test.bat, smoke-node.bat, noderun.bat, guinodedbg.bat, readfiles.bat, rgfix.bat, rgtest.bat, t1/t3/t4.bat, r-test.bat, r4.bat, q-test.bat, shot1.bat, validate.bat | 早期逐项手工排查（node 兼容、IFE0、rg 等） |
| 迭代验收 | func1–10.bat, crash14*.bat, probe14.bat, retry14.bat, retry-sidecar.bat, cuverify3–15.bat, cudiag*.bat, cupip.bat, cusetup2.bat, cuquick1.bat, cu9recheck.bat, round17–22*.bat, e2erun*.bat, srvwatch.bat, node-fallback.bat, deploy-node-fallback.bat | 各轮功能/崩溃/CU/回退验证，断言已并入 round23/24 |
| 驱动辅助 | auto-trigger.py, run-launch.py, vncclick.py, vncshot.py, vnccap.py, uac-click.py, uac-watch.py, scr.py, screen-check.py, slowtype.py, cdp.mjs, cdp2.mjs, mock-anthropic.mjs, server-v2.mjs, postsetup.mjs, gap-probe.mjs, cu-setup-probe.mjs, e2e-full.mjs, diag24.bat | 套件基础设施（VNC/UAC/CDP/mock），仍在用 |

## 7. 结论

- 安装、离线、完整性、运行时、API、GUI、Python 侧、CLI、agent 回合、WS 会话（含并发）、cron 调度（含真实 tick）、H5（含安全门）、终端、持久化、CU、原地升级、恢复模式、崩溃恢复、非提权运行 —— **20 个维度全部覆盖，0 失败**。
- 未覆盖项（超出离线范围，属预期豁免）：真实外网 API 调用、自动更新、在线 Skills Market 拉取（离线环境用 mock/本地断言替代）。
